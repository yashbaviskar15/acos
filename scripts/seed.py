import sys
import os
import uuid
import secrets
import string
import random
import datetime

sys.path.append(os.path.join(os.path.dirname(__file__), '..', 'backend'))

from app.core.database import SessionLocal, Base, engine
from app.core.security import get_password_hash, generate_mfa_secret
from app.services.arvgate.models import User, AuditLog
from app.core.cloud_models import (
    Notification, ComputeInstance, KubeCluster, StorageBucket,
    DatabaseInstance, ApplicationRecord
)

_ONE_DAY_SECONDS = 86400


def _gen_password(length: int = 24) -> str:
    alphabet = string.ascii_letters + string.digits + "-_!$"
    while True:
        candidate = "".join(secrets.choice(alphabet) for _ in range(length))
        if (
            any(c.islower() for c in candidate)
            and any(c.isupper() for c in candidate)
            and any(c.isdigit() for c in candidate)
        ):
            return candidate


def _gated() -> None:
    is_serverless = bool(os.environ.get("VERCEL") or os.environ.get("AWS_LAMBDA_FUNCTION_NAME"))
    if is_serverless:
        print(
            "[!] seed.py must NOT be run in a serverless (Vercel/Lambda) deployment. "
            "Exiting to prevent accidental demo data in production."
        )
        sys.exit(2)
    auto_init = os.environ.get("AUTO_INIT_DB", "").lower() in ("true", "1")
    if auto_init:
        print(
            "[!] seed.py is a manual script — do not run it with AUTO_INIT_DB=1. "
            "Exiting as a safety gate."
        )
        sys.exit(2)


def seed_database():
    _gated()

    print("Initializing database tables...")
    Base.metadata.create_all(bind=engine)

    db = SessionLocal()
    try:
        credentials = []

        admin_email = "admin@aravanta.cloud"
        admin = db.query(User).filter(User.email == admin_email).first()
        if not admin:
            admin_pw = _gen_password()
            admin = User(
                id=str(uuid.uuid4()),
                account_id=f"ARV-ACC-{random.randint(100000, 999999)}",
                workspace_id="ws-demo-admin",
                workspace_name="Demo Workspace (Admin)",
                email=admin_email,
                full_name="Super Administrator",
                hashed_password=get_password_hash(admin_pw),
                role="SuperAdmin",
                is_active=True,
                mfa_secret=generate_mfa_secret()
            )
            db.add(admin)
            credentials.append(("SuperAdmin", admin_email, admin_pw))

        dev_email = "developer@aravanta.cloud"
        dev = db.query(User).filter(User.email == dev_email).first()
        if not dev:
            dev_pw = _gen_password()
            dev = User(
                id=str(uuid.uuid4()),
                account_id=f"ARV-ACC-{random.randint(100000, 999999)}",
                workspace_id=admin.workspace_id,
                workspace_name=admin.workspace_name,
                email=dev_email,
                full_name="Lead Developer",
                hashed_password=get_password_hash(dev_pw),
                role="Developer",
                is_active=True,
                mfa_secret=generate_mfa_secret()
            )
            db.add(dev)
            credentials.append(("Developer", dev_email, dev_pw))

        op_email = "operator@aravanta.cloud"
        op = db.query(User).filter(User.email == op_email).first()
        if not op:
            op_pw = _gen_password()
            op = User(
                id=str(uuid.uuid4()),
                account_id=f"ARV-ACC-{random.randint(100000, 999999)}",
                workspace_id=admin.workspace_id,
                workspace_name=admin.workspace_name,
                email=op_email,
                full_name="SRE Operator",
                hashed_password=get_password_hash(op_pw),
                role="Operator",
                is_active=True,
                mfa_secret=generate_mfa_secret()
            )
            db.add(op)
            credentials.append(("Operator", op_email, op_pw))

        db.commit()

        admin_id = admin.id
        admin_ws = admin.workspace_id

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
            db.add(KubeCluster(
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
            ))

        if not db.query(StorageBucket).filter(StorageBucket.id == "arv-s3-assets-prod").first():
            db.add_all([
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
                    storage_class="INFREQUENT ACCESS",
                    size_gb=420.3,
                    object_count=89,
                    versioning=False,
                    encryption="AES-256",
                    access="PRIVATE",
                    monthly_cost=9.67
                ),
            ])

        if not db.query(DatabaseInstance).filter(DatabaseInstance.id == "arv-db-core-prod").first():
            db.add(DatabaseInstance(
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
            ))

        if not db.query(ApplicationRecord).filter(ApplicationRecord.id == "app-api-gateway").first():
            db.add_all([
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
                    repository="github.com/aravanta/acos-gateway",
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
                    repository="github.com/aravanta/acos-frontend",
                    endpoints='["https://aravantacos.vercel.app"]',
                    ports="[3000, 80]",
                    env_vars='{"VITE_API_URL": "https://arv-backend.vercel.app"}'
                ),
            ])

        if not db.query(Notification).filter(Notification.title == "Control Plane Active").first():
            db.add_all([
                Notification(
                    id=f"notif-{uuid.uuid4().hex[:12]}",
                    user_id=admin_id,
                    workspace_id=admin_ws,
                    title="Control Plane Active",
                    desc="Unified CloudOS control plane operational across all regions.",
                    type="success",
                    read=False,
                    created_at=datetime.datetime.utcnow() - datetime.timedelta(hours=2)
                ),
                Notification(
                    id=f"notif-{uuid.uuid4().hex[:12]}",
                    user_id=admin_id,
                    workspace_id=admin_ws,
                    title="Demo Seed Complete",
                    desc="Workspaces, resources, and accounts were seeded by scripts/seed.py.",
                    type="info",
                    read=False,
                    created_at=datetime.datetime.utcnow() - datetime.timedelta(minutes=5)
                ),
            ])

        audit = AuditLog(
            id=str(uuid.uuid4()),
            workspace_id=admin_ws,
            user_email="system@aravanta.cloud",
            action="SEED_DATABASE",
            resource="Database",
            ip_address="127.0.0.1",
            details="Manual scripts/seed.py run completed successfully"
        )
        db.add(audit)

        db.commit()

        print()
        print("=" * 72)
        print("  DATABASE SEED COMPLETE — SAVE THESE CREDENTIALS NOW")
        print("  (Passwords are generated uniquely per run and never stored)")
        print("=" * 72)
        for role, email, pw in credentials:
            print(f"  [{role:<11}] {email}")
            print(f"               password: {pw}")
            print()
        print("=" * 72)
        print("Workspace: ", admin_ws)
        print("Account ID:", admin.account_id)
        print()

    except Exception as e:
        db.rollback()
        print(f"Error seeding database: {e}")
        sys.exit(1)
    finally:
        db.close()


if __name__ == "__main__":
    seed_database()
