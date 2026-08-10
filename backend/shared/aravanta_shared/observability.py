from __future__ import annotations

import logging
import os
import time

import structlog
from fastapi import FastAPI, Request, Response
from opentelemetry import trace
from opentelemetry.exporter.otlp.proto.http.trace_exporter import OTLPSpanExporter
from opentelemetry.instrumentation.fastapi import FastAPIInstrumentor
from opentelemetry.sdk.resources import SERVICE_NAME, Resource
from opentelemetry.sdk.trace import TracerProvider
from opentelemetry.sdk.trace.export import BatchSpanProcessor
from prometheus_client import CONTENT_TYPE_LATEST, Counter, Histogram, generate_latest

REQUEST_COUNT = Counter(
    "aravanta_http_requests_total",
    "Total HTTP requests served by Aravanta services",
    ["service", "method", "path", "status_code"],
)
REQUEST_LATENCY = Histogram(
    "aravanta_http_request_duration_seconds",
    "HTTP request latency for Aravanta services",
    ["service", "method", "path"],
)


def configure_logging(service_name: str) -> None:
    structlog.configure(
        processors=[
            structlog.processors.TimeStamper(fmt="iso"),
            structlog.processors.add_log_level,
            structlog.processors.JSONRenderer(),
        ],
        wrapper_class=structlog.make_filtering_bound_logger(logging.INFO),
        logger_factory=structlog.PrintLoggerFactory(),
        cache_logger_on_first_use=True,
    )
    logging.basicConfig(level=logging.INFO, format="%(message)s")
    structlog.get_logger().info("logging_configured", service=service_name)


def configure_tracing(app: FastAPI, service_name: str) -> None:
    otlp_endpoint = os.getenv("OTEL_EXPORTER_OTLP_ENDPOINT")
    if not otlp_endpoint:
        return

    resource = Resource.create({SERVICE_NAME: service_name})
    provider = TracerProvider(resource=resource)
    processor = BatchSpanProcessor(OTLPSpanExporter(endpoint=f"{otlp_endpoint}/v1/traces"))
    provider.add_span_processor(processor)
    trace.set_tracer_provider(provider)
    FastAPIInstrumentor.instrument_app(app, tracer_provider=provider)


def add_observability(app: FastAPI, service_name: str) -> None:
    logger = structlog.get_logger(service=service_name)

    @app.middleware("http")
    async def metrics_and_logging(request: Request, call_next):
        start = time.perf_counter()
        response: Response = await call_next(request)
        elapsed = time.perf_counter() - start

        route = request.url.path
        REQUEST_COUNT.labels(
            service=service_name,
            method=request.method,
            path=route,
            status_code=response.status_code,
        ).inc()
        REQUEST_LATENCY.labels(
            service=service_name,
            method=request.method,
            path=route,
        ).observe(elapsed)

        logger.info(
            "http_request",
            method=request.method,
            path=route,
            status_code=response.status_code,
            duration_ms=round(elapsed * 1000, 2),
            client=request.client.host if request.client else "unknown",
        )
        return response

    @app.get("/metrics", include_in_schema=False)
    async def metrics() -> Response:
        return Response(generate_latest(), media_type=CONTENT_TYPE_LATEST)
