import logging

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from prometheus_client import make_asgi_app

from app.core.config import settings
from app.core.database import Base, engine
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

logger = logging.getLogger("aravanta.startup")

# Initialize database tables and seed default users safely.
def init_db():
    try:
        Base.metadata.create_all(bind=engine)
        from app.core.database import SessionLocal
        from app.services.arvgate.models import User
        from app.core.security import get_password_hash, generate_mfa_secret

        db = SessionLocal()
        try:
            # Seed primary administrator account
            admin_email = "yashbaviskar67@gmail.com"
            user = db.query(User).filter(User.email == admin_email).first()
            if not user:
                new_user = User(
                    id="usr-yash-admin-001",
                    account_id="ARV-ACC-100001",
                    email=admin_email,
                    full_name="Yash Baviskar",
                    hashed_password=get_password_hash("Padma@0215"),
                    role="SuperAdmin",
                    is_mfa_enabled=False,
                    mfa_secret=generate_mfa_secret()
                )
                db.add(new_user)

            # Seed platform admin account
            cloud_admin = db.query(User).filter(User.email == "admin@aravanta.cloud").first()
            if not cloud_admin:
                new_admin = User(
                    id="usr-cloud-admin-002",
                    account_id="ARV-ACC-100002",
                    email="admin@aravanta.cloud",
                    full_name="Enterprise Administrator",
                    hashed_password=get_password_hash("Aravanta@2026!"),
                    role="SuperAdmin",
                    is_mfa_enabled=False,
                    mfa_secret=generate_mfa_secret()
                )
                db.add(new_admin)

            db.commit()
        except Exception as err:
            logger.warning("Seed error: %s", err)
            db.rollback()
        finally:
            db.close()
    except Exception as exc:  # noqa: BLE001 - defensive startup guard
        logger.error(
            "Database initialization failed: %s.",
            exc,
        )

init_db()

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
    docs_url="/docs",
    redoc_url="/redoc"
)

# Configure CORS. Allows specified origins + all *.vercel.app preview deployments.
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_origin_regex=r"https://.*\.vercel\.app",
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
    return {
        "status": "HEALTHY",
        "service": "Aravanta CloudOS Microservices API",
        "version": settings.VERSION
    }
