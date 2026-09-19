import os
import logging
import uuid
import datetime
from contextlib import asynccontextmanager
from sqlalchemy import text

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from prometheus_client import make_asgi_app

from app.core.config import settings
from app.core.database import Base, engine, DATABASE_URL
from app.services.arvgate.router import router as arvgate_router
from app.services.arvcompute.router import router as arvcompute_router
from app.services.arvkube.router import router as arvkube_router
from app.services.arvstore.router import router as arvstore_router
from app.services.arvdb.router import router as arvdb_router
from app.services.arvregistry.router import router as arvregistry_router
from app.services.arvedge.router import router as arvedge_router
from app.services.arvwatch.router import router as arvwatch_router
from app.services.arvcicd.router import router as arvcicd_router
from app.services.arvbilling.router import router as arvbilling_router
from app.services.arvoperations.router import router as arvoperations_router
from app.services.arvai.router import router as arvai_router
from app.services.arvcommunity.router import router as arvcommunity_router
from app.services.arvcostiq.router import router as arvcostiq_router
from app.services.arvguard.router import router as arvguard_router
from app.services.arvpulse.router import router as arvpulse_router
from app.services.arvsandbox.router import router as arvsandbox_router
from app.services.control_plane.router import router as control_plane_router
import app.services.arvgate.models
import app.control_plane.models
import app.core.cloud_models
import app.services.arvcommunity.models
import app.services.arvcostiq.models
import app.services.arvguard.models
import app.services.arvpulse.models
import app.services.arvsandbox.models

logger = logging.getLogger("aravanta.startup")

_is_sqlite = DATABASE_URL.startswith("sqlite")
_is_postgres = DATABASE_URL.startswith("postgresql")


def init_db():
    """Initialize database tables and schema migrations only.

    This function is idempotent:
    - create_all() only creates tables that don't exist
    - SQLite/PostgreSQL column migrations are safe on re-run
    - NO seed users, NO demo data, NO hardcoded credentials
    - For demo/seed data, run scripts/seed.py manually
    """
    try:
        Base.metadata.create_all(bind=engine)

        if _is_sqlite:
            try:
                with engine.connect() as conn:
                    for col_sql in [
                        "ALTER TABLE users ADD COLUMN workspace_id VARCHAR(50)",
                        "ALTER TABLE users ADD COLUMN workspace_name VARCHAR(100)",
                        "ALTER TABLE users ADD COLUMN avatar_url VARCHAR(500)",
                        "ALTER TABLE users ADD COLUMN timezone VARCHAR(50) DEFAULT 'Asia/Kolkata'",
                        "ALTER TABLE users ADD COLUMN preferences TEXT DEFAULT '{}'",
                        "ALTER TABLE audit_logs ADD COLUMN workspace_id VARCHAR(50)",
                    ]:
                        try:
                            conn.execute(text(col_sql))
                            conn.commit()
                        except Exception:
                            pass
            except Exception:
                pass
        if _is_postgres:
            try:
                with engine.connect() as conn:
                    conn.execute(text("ALTER TABLE payment_methods ALTER COLUMN last4 TYPE VARCHAR(100);"))
                    conn.commit()
            except Exception:
                pass

        from app.core.database import SessionLocal

        db = SessionLocal()
        try:
            logger.info("Database initialized successfully. Engine: %s", "PostgreSQL" if _is_postgres else "SQLite")
        except Exception as err:
            logger.warning("Init DB error: %s", err)
            db.rollback()
        finally:
            db.close()
    except Exception as exc:
            logger.error("Database initialization failed: %s.", exc)


@asynccontextmanager
async def lifespan(_app: FastAPI):
    """Run DB schema setup. create_all(checkfirst=True) is idempotent and creates newly added tables."""
    try:
        init_db()
    except Exception as exc:
        logger.warning("Startup database initialization: %s", exc)
    yield


app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan
)

# HTTP Security Headers Middleware (OWASP recommended defense)
@app.middleware("http")
async def add_security_headers(request: Request, call_next):
    response = await call_next(request)
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["X-XSS-Protection"] = "1; mode=block"
    response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
    return response

# Configure CORS: explicitly allowed production origins + Aravanta Vercel previews only
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_origin_regex=r"https://(aravantacos|acos)(-[a-z0-9-]+)?\.vercel\.app",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount Prometheus metrics endpoint
metrics_app = make_asgi_app()
app.mount("/metrics", metrics_app)

# Include Arv* Service Routers (Routers already include /api/v1 in their prefix)
app.include_router(arvgate_router)
app.include_router(arvcompute_router)
app.include_router(arvkube_router)
app.include_router(arvstore_router)
app.include_router(arvdb_router)
app.include_router(arvregistry_router)
app.include_router(arvedge_router)
app.include_router(arvwatch_router)
app.include_router(arvcicd_router)
app.include_router(arvbilling_router)
app.include_router(arvoperations_router)
app.include_router(arvai_router)
app.include_router(arvcommunity_router)
app.include_router(arvcostiq_router)
app.include_router(arvguard_router)
app.include_router(arvpulse_router)
app.include_router(arvsandbox_router)
app.include_router(control_plane_router)

@app.get("/", tags=["Root"])
def root():
    return {
        "status": "HEALTHY",
        "service": "Aravanta CloudOS Backend API",
        "version": settings.VERSION,
        "docs": "/docs",
        "health": "/health"
    }

@app.get("/health", tags=["Health"])
@app.get("/api/v1/health", tags=["Health"])
def health_check():
    db_status = "unknown"
    db_engine_type = "postgresql" if _is_postgres else ("sqlite" if _is_sqlite else "unknown")
    try:
        from app.core.database import SessionLocal
        db = SessionLocal()
        try:
            db.execute(text("SELECT 1"))
            db_status = "connected"
        except Exception as e:
            db_status = f"error: {str(e)[:100]}"
        finally:
            db.close()
    except Exception as e:
        db_status = f"error: {str(e)[:100]}"

    return {
        "status": "HEALTHY" if db_status == "connected" else "DEGRADED",
        "service": "Aravanta CloudOS Microservices API",
        "version": settings.VERSION,
        "database": db_status,
        "database_engine": db_engine_type,
    }
