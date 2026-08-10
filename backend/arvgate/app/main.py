from __future__ import annotations

from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from aravanta_shared.observability import add_observability, configure_logging, configure_tracing
from app.api.v1.router import router
from app.core.config import settings
from app.db.session import Base, engine


@asynccontextmanager
async def lifespan(_: FastAPI):
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    yield


def create_app() -> FastAPI:
    configure_logging(settings.service_name)

    app = FastAPI(
        title="ArvGate API",
        description="Identity, MFA, RBAC, and audit control plane for Aravanta CloudOS.",
        version="0.1.0",
        docs_url="/docs",
        redoc_url="/redoc",
        openapi_url="/openapi.json",
        lifespan=lifespan,
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
    add_observability(app, settings.service_name)
    configure_tracing(app, settings.service_name)
    app.include_router(router, prefix=settings.api_prefix)

    @app.get("/health/live", tags=["Health"])
    async def live() -> dict[str, str]:
        return {"status": "ok", "service": settings.service_name, "probe": "live"}

    @app.get("/health/ready", tags=["Health"])
    async def ready() -> dict[str, str]:
        return {"status": "ok", "service": settings.service_name, "probe": "ready"}

    return app


app = create_app()
