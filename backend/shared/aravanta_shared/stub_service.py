from __future__ import annotations

from typing import Callable

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from aravanta_shared.observability import add_observability, configure_logging, configure_tracing


def create_service_app(
    *,
    service_name: str,
    title: str,
    description: str,
    api_router_factory: Callable[[], object],
    api_prefix: str = "/api/v1",
) -> FastAPI:
    configure_logging(service_name)

    app = FastAPI(
        title=title,
        description=description,
        version="0.1.0",
        docs_url="/docs",
        redoc_url="/redoc",
        openapi_url="/openapi.json",
    )
    allowed_origins = [
        "https://acos-taupe.vercel.app",
        "http://localhost:3000",
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ]

    app.add_middleware(
        CORSMiddleware,
        allow_origins=allowed_origins,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    add_observability(app, service_name)
    configure_tracing(app, service_name)
    app.include_router(api_router_factory(), prefix=api_prefix)

    @app.get("/health/live", tags=["Health"])
    async def live() -> dict[str, str]:
        return {"status": "ok", "service": service_name, "probe": "live"}

    @app.get("/health/ready", tags=["Health"])
    async def ready() -> dict[str, str]:
        return {"status": "ok", "service": service_name, "probe": "ready"}

    return app
