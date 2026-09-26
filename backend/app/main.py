import os
import sys
from pathlib import Path

# Ensure backend root and app directory are always in sys.path
_current_file = Path(__file__).resolve()
_backend_root = _current_file.parent.parent
if str(_backend_root) not in sys.path:
    sys.path.insert(0, str(_backend_root))
if str(_current_file.parent) not in sys.path:
    sys.path.insert(0, str(_current_file.parent))

# Fallbacks for critical environment variables on serverless cold starts
if not os.environ.get("SECRET_KEY"):
    os.environ["SECRET_KEY"] = "aravanta_prod_live_sec_key_9f82b71e84a20c4e8d35f76a1b94c032e578"
if not os.environ.get("DATABASE_URL"):
    os.environ["DATABASE_URL"] = "postgresql://neondb_owner:npg_rJL0kIVv7Xuj@ep-small-pond-a5i9ohyh-pooler.us-east-2.aws.neon.tech/neondb?sslmode=require&channel_binding=require"

import logging
import uuid
import datetime
from contextlib import asynccontextmanager
from sqlalchemy import text

from fastapi import FastAPI, Request, Response
from fastapi.middleware.cors import CORSMiddleware
from prometheus_client import generate_latest, CONTENT_TYPE_LATEST

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
from app.services.arvfunctions.router import router as arvfunctions_router
from app.services.arvvault.router import router as arvvault_router
from app.services.arvevents.router import router as arvevents_router
from app.services.arvnetwork.router import router as arvnetwork_router
from app.services.arvdns.router import router as arvdns_router
import app.services.arvgate.models
import app.control_plane.models
import app.core.cloud_models
import app.services.arvcommunity.models
import app.services.arvcostiq.models
import app.services.arvguard.models
import app.services.arvpulse.models
import app.services.arvsandbox.models
import app.services.arvfunctions.models
import app.services.arvvault.models
import app.services.arvevents.models
import app.services.arvnetwork.models
import app.services.arvdns.models
import app.billing.models

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

        try:
            from app.core.add_storage_data_column import ensure_storage_data_column
            ensure_storage_data_column(engine)
        except Exception:
            pass

        try:
            from app.core.add_vault_columns import add_key_material_column
            add_key_material_column()
        except Exception as e:
            logger.warning("add_vault_columns error: %s", e)

        try:
            from app.core.add_functions_code_column import main as add_functions_code_col
            add_functions_code_col()
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


# Database initialization: run on explicit request or local development, not on serverless cold starts
is_serverless = bool(os.environ.get("VERCEL") or os.environ.get("AWS_LAMBDA_FUNCTION_NAME"))
if not is_serverless:
    try:
        init_db()
    except Exception as exc:
        logger.warning("Startup database initialization: %s", exc)


app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
    docs_url="/docs",
    redoc_url="/redoc"
)

# Pure ASGI middleware to normalize Vercel serverless /api and /api/index rewrite paths
class VercelPathRewriteMiddleware:
    def __init__(self, app):
        self.app = app

    async def __call__(self, scope, receive, send):
        if scope["type"] == "http":
            headers = dict(scope.get("headers", []))
            matched = (
                headers.get(b"x-matched-path", b"")
                or headers.get(b"x-vercel-rewrite-path", b"")
                or headers.get(b"x-original-url", b"")
            ).decode("utf-8", errors="ignore")
            if matched and matched not in ("/api", "/api/", "/api/index", "/api/index/"):
                scope["path"] = matched
            path = scope.get("path", "")
            if path in ("/api", "/api/", "/api/index", "/api/index/"):
                scope["path"] = "/"
            elif path.startswith("/api/index/"):
                scope["path"] = path[len("/api/index"):]
        await self.app(scope, receive, send)

app.add_middleware(VercelPathRewriteMiddleware)

# Configure CORS: allow all Vercel domains (*.vercel.app), localhost, and explicit origins
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_origin_regex=r"^https://.*\.vercel\.app$",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"],
)


@app.exception_handler(Exception)
async def global_unhandled_exception_handler(request: Request, exc: Exception):
    import traceback
    logger.error("Unhandled API exception on %s %s: %s\n%s", request.method, request.url.path, exc, traceback.format_exc())
    from fastapi.responses import JSONResponse
    return JSONResponse(
        status_code=500,
        content={
            "status": "error",
            "message": "Internal server error occurred",
            "detail": str(exc),
            "path": request.url.path
        }
    )

@app.get("/metrics", tags=["Metrics"])
def get_metrics():
    return Response(content=generate_latest(), media_type=CONTENT_TYPE_LATEST)

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
app.include_router(arvfunctions_router)
app.include_router(arvvault_router)
app.include_router(arvevents_router)
app.include_router(arvnetwork_router)
app.include_router(arvdns_router)

@app.get("/", tags=["Root"])
@app.get("/api", tags=["Root"], include_in_schema=False)
@app.get("/api/", tags=["Root"], include_in_schema=False)
@app.get("/api/index", tags=["Root"], include_in_schema=False)
@app.get("/api/index/", tags=["Root"], include_in_schema=False)
def root():
    return {
        "status": "HEALTHY",
        "service": "Aravanta CloudOS Backend API",
        "version": settings.VERSION,
        "docs": "/docs",
        "health": "/health"
    }

@app.get("/health", tags=["Health"])
@app.get("/api/health", tags=["Health"], include_in_schema=False)
@app.get("/api/v1/health", tags=["Health"])
@app.get("/api/index/health", tags=["Health"], include_in_schema=False)
@app.get("/api/index/api/v1/health", tags=["Health"], include_in_schema=False)
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

handler = app
application = app

