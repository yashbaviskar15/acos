import logging
import uuid
import datetime
from sqlalchemy import text

from fastapi import FastAPI
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
import app.services.arvgate.models
import app.core.cloud_models

logger = logging.getLogger("aravanta.startup")

_is_sqlite = DATABASE_URL.startswith("sqlite")
_is_postgres = DATABASE_URL.startswith("postgresql")


def init_db():
    """Initialize database tables and seed default admin users.
    
    This function is idempotent:
    - create_all() only creates tables that don't exist
    - Seed data checks by primary key, not by table count
    - Safe to call on every cold start
    """
    try:
        Base.metadata.create_all(bind=engine)

        # SQLite-only: add columns that may be missing from older schemas
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

        from app.core.database import SessionLocal
        from app.services.arvgate.models import User
        from app.core.security import get_password_hash, generate_mfa_secret
        from app.core.cloud_models import (
            Notification, ComputeInstance, KubeCluster, StorageBucket, StorageObject,
            DatabaseInstance, ApplicationRecord, DeploymentRecord, IncidentRecord,
            AlertRecord, WorkflowRecord, BackupRecord
        )

        db = SessionLocal()
        try:
            # Seed primary administrator account (idempotent — check by email)
            admin_email = "yashbaviskar67@gmail.com"
            user = db.query(User).filter(User.email == admin_email).first()
            if not user:
                new_user = User(
                    id="usr-yash-admin-001",
                    account_id="ARV-ACC-100001",
                    workspace_id="ws-yash-prod",
                    workspace_name="Yash's Production Cloud Ops",
                    email=admin_email,
                    full_name="Yash Baviskar",
                    hashed_password=get_password_hash("Padma@0215"),
                    role="SuperAdmin",
                    is_mfa_enabled=False,
                    mfa_secret=generate_mfa_secret()
                )
                db.add(new_user)
                user = new_user

            # Seed platform admin account (idempotent — check by email)
            cloud_admin = db.query(User).filter(User.email == "admin@aravanta.cloud").first()
            if not cloud_admin:
                new_admin = User(
                    id="usr-cloud-admin-002",
                    account_id="ARV-ACC-100002",
                    workspace_id="ws-enterprise-default",
                    workspace_name="Enterprise Platform Operations",
                    email="admin@aravanta.cloud",
                    full_name="Enterprise Administrator",
                    hashed_password=get_password_hash("Aravanta@2026!"),
                    role="SuperAdmin",
                    is_mfa_enabled=False,
                    mfa_secret=generate_mfa_secret()
                )
                db.add(new_admin)

            db.commit()

            # Seed demo infrastructure ONLY for primary admin workspace
            # Idempotent: check by specific IDs, not by count
            admin_id = user.id if user else "usr-yash-admin-001"
            admin_ws = "ws-yash-prod"

            if not db.query(ComputeInstance).filter(ComputeInstance.id == "arv-i-prod-web01").first():
                demo_vms = [
                    ComputeInstance(
                        id="arv-i-prod-web01",
                        user_id=admin_id,
                        workspace_id=admin_ws,
                        name="web-server-prod-01",
                        instance_type="arv.large",
                        os_image="Ubuntu 22.04 LTS",
                        region="arv-us-east-1",
                        status="RUNNING",
                        private_ip="10.0.1.12",
                        public_ip="34.120.45.89",
                        cpu_usage=18.5,
                        ram_usage=42.0,
                        disk_gb=100,
                        tags='{"env": "production", "tier": "frontend"}'
                    ),
                    ComputeInstance(
                        id="arv-i-prod-api01",
                        user_id=admin_id,
                        workspace_id=admin_ws,
                        name="api-gateway-prod",
                        instance_type="arv.xlarge",
                        os_image="Ubuntu 24.04 LTS",
                        region="arv-us-east-1",
                        status="RUNNING",
                        private_ip="10.0.1.15",
                        public_ip="34.120.45.90",
                        cpu_usage=24.0,
                        ram_usage=55.0,
                        disk_gb=150,
                        tags='{"env": "production", "tier": "backend"}'
                    ),
                    ComputeInstance(
                        id="arv-i-prod-worker01",
                        user_id=admin_id,
                        workspace_id=admin_ws,
                        name="worker-node-01",
                        instance_type="arv.compute.large",
                        os_image="Ubuntu 22.04 LTS",
                        region="arv-us-west-2",
                        status="RUNNING",
                        private_ip="10.0.2.20",
                        public_ip=None,
                        cpu_usage=38.0,
                        ram_usage=64.0,
                        disk_gb=200,
                        tags='{"env": "production", "tier": "workers"}'
                    ),
                    ComputeInstance(
                        id="arv-i-stg-app01",
                        user_id=admin_id,
                        workspace_id=admin_ws,
                        name="staging-app-01",
                        instance_type="arv.medium",
                        os_image="Ubuntu 22.04 LTS",
                        region="arv-eu-west-1",
                        status="STOPPED",
                        private_ip="10.0.3.5",
                        public_ip=None,
                        cpu_usage=0.0,
                        ram_usage=0.0,
                        disk_gb=50,
                        tags='{"env": "staging"}'
                    ),
                ]
                db.add_all(demo_vms)

            if not db.query(KubeCluster).filter(KubeCluster.id == "arv-k8s-prod01").first():
                demo_cluster = KubeCluster(
                    id="arv-k8s-prod01",
                    user_id=admin_id,
                    workspace_id=admin_ws,
                    name="aravanta-prod",
                    version="1.30.1",
                    region="arv-us-east-1",
                    status="ACTIVE",
                    node_count=3,
                    node_size="arv.large",
                    endpoint="https://arv-k8s-prod01.k8s.aravanta.cloud:6443",
                    cpu_cores_total=24,
                    ram_gb_total=96,
                    pod_count=18
                )
                db.add(demo_cluster)

            if not db.query(StorageBucket).filter(StorageBucket.id == "arv-s3-assets-prod").first():
                demo_buckets = [
                    StorageBucket(
                        id="arv-s3-assets-prod",
                        user_id=admin_id,
                        workspace_id=admin_ws,
                        name="aravanta-assets-prod",
                        region="arv-us-east-1",
                        storage_class="STANDARD",
                        size_gb=156.8,
                        object_count=1240,
                        versioning=True,
                        encryption="AES-256",
                        access="PRIVATE",
                        monthly_cost=3.61
                    ),
                    StorageBucket(
                        id="arv-s3-backups",
                        user_id=admin_id,
                        workspace_id=admin_ws,
                        name="aravanta-backups",
                        region="arv-us-east-1",
                        storage_class="INFREQUENT_ACCESS",
                        size_gb=420.3,
                        object_count=89,
                        versioning=False,
                        encryption="AES-256",
                        access="PRIVATE",
                        monthly_cost=9.67
                    ),
                ]
                db.add_all(demo_buckets)

            if not db.query(DatabaseInstance).filter(DatabaseInstance.id == "arv-db-core-prod").first():
                demo_db = DatabaseInstance(
                    id="arv-db-core-prod",
                    user_id=admin_id,
                    workspace_id=admin_ws,
                    name="aravanta-core-db",
                    engine="PostgreSQL 16",
                    tier="db.arv.large",
                    region="arv-us-east-1",
                    storage_gb=200,
                    storage_used_gb=84.5,
                    status="AVAILABLE",
                    endpoint="aravanta-core-db.db.aravanta.cloud",
                    port="5432",
                    connection_count=42,
                    max_connections=200,
                    latency_ms=1.2,
                    iops=4500
                )
                db.add(demo_db)

            if not db.query(ApplicationRecord).filter(ApplicationRecord.id == "app-api-gateway").first():
                demo_apps = [
                    ApplicationRecord(
                        id="app-api-gateway",
                        user_id=admin_id,
                        workspace_id=admin_ws,
                        name="api-gateway",
                        environment="production",
                        version="v2.4.1",
                        previous_version="v2.4.0",
                        replicas=4,
                        target_replicas=4,
                        status="HEALTHY",
                        health_percent=100.0,
                        error_rate_percent=0.01,
                        cpu_usage_m=420,
                        memory_usage_mb=680,
                        p95_latency_ms=38.5,
                        requests_per_sec=4200,
                        strategy="RollingUpdate",
                        image="aravanta/api-gateway:v2.4.1",
                        repository="github.com/yashbaviskar15/acos-gateway",
                        endpoints='["https://api.aravanta.cloud", "https://arv-backend.vercel.app"]',
                        ports="[8000, 443]",
                        env_vars='{"NODE_ENV": "production", "LOG_LEVEL": "info"}'
                    ),
                    ApplicationRecord(
                        id="app-web-console",
                        user_id=admin_id,
                        workspace_id=admin_ws,
                        name="web-console",
                        environment="production",
                        version="v1.5.2",
                        previous_version="v1.5.1",
                        replicas=3,
                        target_replicas=3,
                        status="HEALTHY",
                        health_percent=100.0,
                        error_rate_percent=0.0,
                        cpu_usage_m=190,
                        memory_usage_mb=310,
                        p95_latency_ms=18.2,
                        requests_per_sec=3100,
                        strategy="Canary",
                        image="aravanta/web-console:v1.5.2",
                        repository="github.com/yashbaviskar15/acos-frontend",
                        endpoints='["https://aravantacos.vercel.app"]',
                        ports="[3000, 80]",
                        env_vars='{"VITE_API_URL": "https://arv-backend.vercel.app"}'
                    ),
                ]
                db.add_all(demo_apps)

            if not db.query(Notification).filter(Notification.title == "Control Plane Active").first():
                demo_notifs = [
                    Notification(
                        id=f"notif-{uuid.uuid4().hex[:12]}",
                        user_id=admin_id,
                        workspace_id=admin_ws,
                        title="Control Plane Active",
                        desc="Unified CloudOS control plane operational across Mumbai & Global regions.",
                        type="success",
                        read=False,
                        created_at=datetime.datetime.utcnow() - datetime.timedelta(hours=2)
                    ),
                    Notification(
                        id=f"notif-{uuid.uuid4().hex[:12]}",
                        user_id=admin_id,
                        workspace_id=admin_ws,
                        title="10-Day Trial Active",
                        desc="Your enterprise trial is active with unrestricted resource provisioning.",
                        type="info",
                        read=False,
                        created_at=datetime.datetime.utcnow() - datetime.timedelta(hours=5)
                    ),
                ]
                db.add_all(demo_notifs)

            db.commit()
            logger.info("Database initialized successfully. Engine: %s", "PostgreSQL" if _is_postgres else "SQLite")
        except Exception as err:
            logger.warning("Seed error: %s", err)
            db.rollback()
        finally:
            db.close()
    except Exception as exc:
        logger.error("Database initialization failed: %s.", exc)

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
app.include_router(arvoperations_router)

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
