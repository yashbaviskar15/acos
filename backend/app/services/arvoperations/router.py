"""
Aravanta CloudOS — ArvOperations Service Router
Multi-Tenant Unified Cloud Operations, Developer Platform, Observability, Incidents & Automation Engine.
"""
import uuid
import random
import copy
from datetime import datetime, timedelta
from typing import Optional, List, Dict, Any
from fastapi import APIRouter, HTTPException, Query, status, Header, Depends
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.services.arvgate.models import User
from app.services.arvgate.dependencies import get_current_user_flexible
from app.core.cloud_models import Notification, emit_notification

router = APIRouter(prefix="/api/v1/operations", tags=["ArvOperations — Cloud Platform Operations"])

ENVIRONMENTS = ["production", "staging", "development"]
REGIONS = ["arv-us-east-1", "arv-us-west-2", "arv-eu-west-1", "arv-ap-south-1"]
STRATEGIES = ["RollingUpdate", "Canary", "BlueGreen"]

# ─────────────────────────────────────────────────────────────────────────────
# Multi-Tenant Workspace Data Storage
# ─────────────────────────────────────────────────────────────────────────────

def _create_seed_workspace_data(workspace_name: str = "Enterprise Production Cloud", is_demo: bool = True) -> dict:
    now = datetime.utcnow()

    apps = [
        {
            "id": "app-api-gateway",
            "name": "api-gateway",
            "environment": "production",
            "version": "v2.4.1",
            "previous_version": "v2.4.0",
            "replicas": 4,
            "target_replicas": 4,
            "status": "HEALTHY",
            "health_percent": 100.0,
            "error_rate_percent": 0.02,
            "cpu_usage_m": 420,
            "memory_usage_mb": 680,
            "p95_latency_ms": 38.5,
            "requests_per_sec": 4200,
            "strategy": "RollingUpdate",
            "image": "aravanta/api-gateway:v2.4.1",
            "repository": "github.com/yashbaviskar15/acos-gateway",
            "endpoints": ["https://api.aravanta.cloud", "https://arv-backend.vercel.app"],
            "ports": [8000, 443],
            "created_at": (now - timedelta(days=120)).isoformat() + "Z",
            "last_deployed_at": (now - timedelta(hours=6)).isoformat() + "Z",
            "env_vars": {"NODE_ENV": "production", "LOG_LEVEL": "info", "CACHE_TTL": "300"},
        },
        {
            "id": "app-auth-service",
            "name": "auth-service",
            "environment": "production",
            "version": "v1.9.0",
            "previous_version": "v1.8.4",
            "replicas": 3,
            "target_replicas": 3,
            "status": "HEALTHY",
            "health_percent": 99.98,
            "error_rate_percent": 0.01,
            "cpu_usage_m": 280,
            "memory_usage_mb": 420,
            "p95_latency_ms": 24.1,
            "requests_per_sec": 1850,
            "strategy": "RollingUpdate",
            "image": "aravanta/auth-service:v1.9.0",
            "repository": "github.com/yashbaviskar15/acos-auth",
            "endpoints": ["https://auth.aravanta.cloud/v1"],
            "ports": [8080],
            "created_at": (now - timedelta(days=90)).isoformat() + "Z",
            "last_deployed_at": (now - timedelta(days=2)).isoformat() + "Z",
            "env_vars": {"JWT_ALGORITHM": "HS256", "MFA_ENABLED": "true", "SESSION_TIMEOUT": "3600"},
        },
        {
            "id": "app-web-console",
            "name": "web-console",
            "environment": "production",
            "version": "v1.5.2",
            "previous_version": "v1.5.1",
            "replicas": 3,
            "target_replicas": 3,
            "status": "HEALTHY",
            "health_percent": 100.0,
            "error_rate_percent": 0.00,
            "cpu_usage_m": 190,
            "memory_usage_mb": 310,
            "p95_latency_ms": 18.2,
            "requests_per_sec": 3100,
            "strategy": "Canary",
            "image": "aravanta/web-console:v1.5.2",
            "repository": "github.com/yashbaviskar15/acos-frontend",
            "endpoints": ["https://aravantacos.vercel.app", "https://console.aravanta.cloud"],
            "ports": [3000, 80],
            "created_at": (now - timedelta(days=100)).isoformat() + "Z",
            "last_deployed_at": (now - timedelta(hours=14)).isoformat() + "Z",
            "env_vars": {"VITE_API_URL": "https://arv-backend.vercel.app", "ENV": "production"},
        },
        {
            "id": "app-telemetry-engine",
            "name": "telemetry-engine",
            "environment": "production",
            "version": "v3.1.0",
            "previous_version": "v3.0.2",
            "replicas": 2,
            "target_replicas": 2,
            "status": "WARNING",
            "health_percent": 96.4,
            "error_rate_percent": 1.45,
            "cpu_usage_m": 890,
            "memory_usage_mb": 1420,
            "p95_latency_ms": 145.0,
            "requests_per_sec": 8900,
            "strategy": "RollingUpdate",
            "image": "aravanta/telemetry-engine:v3.1.0",
            "repository": "github.com/yashbaviskar15/acos-telemetry",
            "endpoints": ["https://metrics.aravanta.cloud/ingest"],
            "ports": [9090, 4317],
            "created_at": (now - timedelta(days=60)).isoformat() + "Z",
            "last_deployed_at": (now - timedelta(hours=3)).isoformat() + "Z",
            "env_vars": {"BUFFER_SIZE": "100000", "OTEL_EXPORTER": "prometheus"},
        },
        {
            "id": "app-payment-worker",
            "name": "payment-worker",
            "environment": "staging",
            "version": "v1.2.0-rc2",
            "previous_version": "v1.1.9",
            "replicas": 2,
            "target_replicas": 2,
            "status": "HEALTHY",
            "health_percent": 100.0,
            "error_rate_percent": 0.05,
            "cpu_usage_m": 150,
            "memory_usage_mb": 290,
            "p95_latency_ms": 85.0,
            "requests_per_sec": 450,
            "strategy": "BlueGreen",
            "image": "aravanta/payment-worker:v1.2.0-rc2",
            "repository": "github.com/yashbaviskar15/acos-billing",
            "endpoints": ["https://staging-billing.aravanta.cloud"],
            "ports": [8085],
            "created_at": (now - timedelta(days=45)).isoformat() + "Z",
            "last_deployed_at": (now - timedelta(hours=1)).isoformat() + "Z",
            "env_vars": {"STRIPE_SANDBOX": "true", "CURRENCY": "INR"},
        }
    ]

    deployments = [
        {
            "id": "dep-8842",
            "application_id": "app-api-gateway",
            "application_name": "api-gateway",
            "environment": "production",
            "version": "v2.4.1",
            "previous_version": "v2.4.0",
            "image": "aravanta/api-gateway:v2.4.1",
            "strategy": "RollingUpdate",
            "replicas": 4,
            "status": "SUCCESSFUL",
            "trigger": "git push (main)",
            "commit_hash": "a4d13d8",
            "commit_message": "feat(gateway): add circuit breaker timeout configuration",
            "author": "yashbaviskar15",
            "started_at": (now - timedelta(hours=6)).isoformat() + "Z",
            "finished_at": (now - timedelta(hours=5, minutes=57)).isoformat() + "Z",
            "duration_seconds": 180,
            "steps": [
                {"name": "Build Container Image", "status": "COMPLETED", "duration": "45s"},
                {"name": "Vulnerability Security Scan (Trivy)", "status": "COMPLETED", "duration": "18s"},
                {"name": "Deploy Canary Pods (25%)", "status": "COMPLETED", "duration": "35s"},
                {"name": "Health Check & Metric Verification", "status": "COMPLETED", "duration": "30s"},
                {"name": "Promote Full Rollout", "status": "COMPLETED", "duration": "52s"},
            ]
        },
        {
            "id": "dep-8841",
            "application_id": "app-telemetry-engine",
            "application_name": "telemetry-engine",
            "environment": "production",
            "version": "v3.1.0",
            "previous_version": "v3.0.2",
            "image": "aravanta/telemetry-engine:v3.1.0",
            "strategy": "RollingUpdate",
            "replicas": 2,
            "status": "FAILED",
            "trigger": "git push (main)",
            "commit_hash": "e9b21f0",
            "commit_message": "perf: increase telemetry batch queue to 50k items",
            "author": "yashbaviskar15",
            "started_at": (now - timedelta(hours=3, minutes=15)).isoformat() + "Z",
            "finished_at": (now - timedelta(hours=3, minutes=11)).isoformat() + "Z",
            "duration_seconds": 240,
            "error_reason": "Health check failed: OOMKilled on pod telemetry-engine-79bf2a (RAM limit 1500MB exceeded)",
            "steps": [
                {"name": "Build Container Image", "status": "COMPLETED", "duration": "50s"},
                {"name": "Deploy Canary Pods", "status": "COMPLETED", "duration": "40s"},
                {"name": "Health Check Verification", "status": "FAILED", "duration": "150s"},
                {"name": "Automatic Safe Rollback", "status": "COMPLETED", "duration": "25s"},
            ]
        },
        {
            "id": "dep-8840",
            "application_id": "app-web-console",
            "application_name": "web-console",
            "environment": "production",
            "version": "v1.5.2",
            "previous_version": "v1.5.1",
            "image": "aravanta/web-console:v1.5.2",
            "strategy": "Canary",
            "replicas": 3,
            "status": "SUCCESSFUL",
            "trigger": "manual release",
            "commit_hash": "7f8b186",
            "commit_message": "feat(console): redesign operations dashboard with human UX",
            "author": "yashbaviskar15",
            "started_at": (now - timedelta(hours=14)).isoformat() + "Z",
            "finished_at": (now - timedelta(hours=13, minutes=58)).isoformat() + "Z",
            "duration_seconds": 120,
            "steps": [
                {"name": "Build Vite SPA Bundle", "status": "COMPLETED", "duration": "38s"},
                {"name": "CDN Asset Cache Purge", "status": "COMPLETED", "duration": "12s"},
                {"name": "Canary Verification (25%)", "status": "COMPLETED", "duration": "40s"},
                {"name": "Global CDN Ingress Cutover", "status": "COMPLETED", "duration": "30s"},
            ]
        }
    ]

    containers = [
        {"id": "pod-api-gw-7b94", "name": "api-gateway-7b94a8f9-x2k9l", "app_name": "api-gateway", "environment": "production", "node": "worker-pool-01.arv-prod", "status": "RUNNING", "cpu_percent": 18.4, "memory_mb": 172, "restarts": 0, "uptime": "14d 6h"},
        {"id": "pod-api-gw-7b95", "name": "api-gateway-7b94a8f9-m8q1w", "app_name": "api-gateway", "environment": "production", "node": "worker-pool-02.arv-prod", "status": "RUNNING", "cpu_percent": 21.0, "memory_mb": 180, "restarts": 0, "uptime": "14d 6h"},
        {"id": "pod-auth-8f12", "name": "auth-service-5d6b4c-9p4z1", "app_name": "auth-service", "environment": "production", "node": "worker-pool-01.arv-prod", "status": "RUNNING", "cpu_percent": 12.5, "memory_mb": 140, "restarts": 0, "uptime": "28d 12h"},
        {"id": "pod-telemetry-01", "name": "telemetry-engine-79bf-k91la", "app_name": "telemetry-engine", "environment": "production", "node": "worker-pool-03.arv-prod", "status": "RUNNING", "cpu_percent": 74.2, "memory_mb": 710, "restarts": 2, "uptime": "3h 15m"},
        {"id": "pod-web-01", "name": "web-console-6c8a2b-w9z1a", "app_name": "web-console", "environment": "production", "node": "worker-pool-02.arv-prod", "status": "RUNNING", "cpu_percent": 8.1, "memory_mb": 105, "restarts": 0, "uptime": "14h 2m"},
    ]

    logs = [
        {"id": "log-01", "timestamp": (now - timedelta(seconds=12)).isoformat() + "Z", "level": "INFO", "service": "api-gateway", "container": "api-gateway-7b94", "message": "HTTP 200 GET /api/v1/operations/inventory duration=14ms client_ip=203.0.113.19", "environment": "production"},
        {"id": "log-02", "timestamp": (now - timedelta(seconds=28)).isoformat() + "Z", "level": "INFO", "service": "auth-service", "container": "auth-service-5d6b", "message": "JWT access token successfully issued for subject=yashbaviskar67@gmail.com role=SuperAdmin", "environment": "production"},
        {"id": "log-03", "timestamp": (now - timedelta(seconds=45)).isoformat() + "Z", "level": "WARN", "service": "telemetry-engine", "container": "telemetry-engine-79bf", "message": "Timeseries ingestion queue buffer at 78% capacity (78,400/100,000 metrics)", "environment": "production"},
        {"id": "log-04", "timestamp": (now - timedelta(seconds=70)).isoformat() + "Z", "level": "INFO", "service": "web-console", "container": "web-console-6c8a", "message": "SSR page hydration complete for path /dashboard in 28ms", "environment": "production"},
        {"id": "log-05", "timestamp": (now - timedelta(seconds=110)).isoformat() + "Z", "level": "ERROR", "service": "postgres-primary", "container": "db-cluster-node-01", "message": "Slow query detected (2450ms): SELECT * FROM audit_logs ORDER BY timestamp DESC LIMIT 5000", "environment": "production"},
    ]

    incidents = [
        {
            "id": "inc-2026-001",
            "title": "High Memory Pressure & OOM Throttling on Telemetry Ingestion Node",
            "severity": "P2",
            "status": "Investigating",
            "affected_service": "telemetry-engine",
            "commander": "Yash Baviskar",
            "detected_at": (now - timedelta(hours=1, minutes=45)).isoformat() + "Z",
            "resolved_at": None,
            "timeline": [
                {"timestamp": (now - timedelta(hours=1, minutes=45)).isoformat() + "Z", "event": "Prometheus alert rule MemoryThresholdExceeded fired (>85%)"},
                {"timestamp": (now - timedelta(hours=1, minutes=30)).isoformat() + "Z", "event": "On-call engineer acknowledged incident and engaged war-room"},
                {"timestamp": (now - timedelta(hours=1, minutes=15)).isoformat() + "Z", "event": "HPA horizontal autoscaling triggered. Provisioning 2 additional pod replicas"},
            ],
            "rca_notes": "Queue buffer exceeded target threshold during traffic spike. Investigating memory leak in Protobuf deserializer."
        }
    ]

    workflows = [
        {
            "id": "wf-auto-scale-cpu",
            "name": "Auto-Scale Replicas on CPU Spikes",
            "description": "Monitors container CPU threshold across production pods. If sustained load exceeds 80% for 3m, scales replica count +2 and dispatches Slack notification.",
            "trigger": "Prometheus Metric Trigger (CPU > 80%)",
            "target": "Production Pod Fleet",
            "status": "ACTIVE",
            "last_run": (now - timedelta(hours=4)).isoformat() + "Z",
            "last_status": "SUCCESSFUL",
            "duration": "42s",
            "run_count": 28,
            "actions": ["Evaluate CPU Load", "Scale Horizontal Replicas", "Verify Health Probes", "Send Slack Notification"]
        },
        {
            "id": "wf-db-nightly-backup",
            "name": "Postgres Managed Cluster Snapshot & WAL Archival",
            "description": "Executes daily point-in-time snapshot of production databases, validates checksum against S3 storage, and purges logs older than 30 days.",
            "trigger": "Cron Schedule (0 2 * * *)",
            "target": "Managed DB (Postgres Primary)",
            "status": "ACTIVE",
            "last_run": (now - timedelta(hours=18)).isoformat() + "Z",
            "last_status": "SUCCESSFUL",
            "duration": "3m 12s",
            "run_count": 142,
            "actions": ["Lock Writes (5s)", "Generate EBS Snapshot", "Upload to ArvStore S3", "Verify SHA-256 Checksum", "Unlock Database"]
        }
    ]

    backups = [
        {
            "id": "bkp-pg-prod-20260901",
            "resource_name": "postgres-primary-prod",
            "resource_type": "Managed Database (Postgres 16.2)",
            "size_gb": 48.5,
            "region": "arv-ap-south-1 (Mumbai)",
            "created_at": (now - timedelta(hours=18)).isoformat() + "Z",
            "status": "COMPLETED",
            "retention_days": 30,
            "storage_tier": "ArvStore Hot Storage (AES-256)",
            "checksum": "sha256:7f8b1864e29c01f4",
        },
        {
            "id": "bkp-k8s-state-20260901",
            "resource_name": "k8s-cluster-prod-state",
            "resource_type": "Kubernetes Cluster Etcd & Manifests",
            "size_gb": 4.2,
            "region": "arv-ap-south-1 (Mumbai)",
            "created_at": (now - timedelta(hours=22)).isoformat() + "Z",
            "status": "COMPLETED",
            "retention_days": 14,
            "storage_tier": "ArvStore Hot Storage (AES-256)",
            "checksum": "sha256:a4d13d87b5c19e02",
        }
    ]

    infrastructure = [
        {"id": "vm-prod-node-01", "name": "prod-node-01.mumbai", "type": "Compute VM", "provider": "AWS / EC2 (c6i.2xlarge)", "region": "ap-south-1 (Mumbai)", "env": "production", "status": "RUNNING", "specs": "8 vCPU, 16GB RAM, 200GB NVMe", "uptime": "99.98% (42d 18h)", "tags": {"team": "infrastructure", "tier": "backend"}},
        {"id": "vm-prod-node-02", "name": "prod-node-02.mumbai", "type": "Compute VM", "provider": "AWS / EC2 (c6i.2xlarge)", "region": "ap-south-1 (Mumbai)", "env": "production", "status": "RUNNING", "specs": "8 vCPU, 16GB RAM, 200GB NVMe", "uptime": "99.98% (42d 18h)", "tags": {"team": "infrastructure", "tier": "backend"}},
        {"id": "k8s-prod-cluster", "name": "arv-k8s-prod-cluster", "type": "Kubernetes Cluster", "provider": "AWS / EKS (v1.29)", "region": "ap-south-1 (Mumbai)", "env": "production", "status": "RUNNING", "specs": "3 Node Pools (12 Worker Nodes)", "uptime": "99.99% (89d)", "tags": {"env": "production", "orchestrator": "kubernetes"}},
        {"id": "db-pg-primary", "name": "arv-db-postgres-primary", "type": "Managed Database", "provider": "GCP / Cloud SQL (Postgres 16)", "region": "asia-south1 (Mumbai)", "env": "production", "status": "RUNNING", "specs": "4 vCPU, 16GB RAM, 500GB SSD (Multi-AZ)", "uptime": "99.99% (120d)", "tags": {"tier": "data-layer", "ha": "active-standby"}},
        {"id": "s3-bucket-assets", "name": "arv-production-assets", "type": "Object Storage", "provider": "AWS / S3 (Standard)", "region": "ap-south-1 (Mumbai)", "env": "production", "status": "RUNNING", "specs": "14.2 TB Stored / 4.8M Objects", "uptime": "100.0%", "tags": {"security": "encrypted-kms", "lifecycle": "active"}},
    ]

    notifications = [
        {"id": "notif-01", "title": "Deployment Successful", "message": "api-gateway v2.4.1 rollout completed successfully across 4 pods.", "type": "deployment", "read": False, "created_at": (now - timedelta(hours=6)).isoformat() + "Z"},
        {"id": "notif-02", "title": "High Memory Warning", "message": "telemetry-engine RAM utilization reached 78% of capacity threshold.", "type": "alert", "read": False, "created_at": (now - timedelta(hours=1, minutes=45)).isoformat() + "Z"},
        {"id": "notif-03", "title": "Nightly Backup Completed", "message": "Snapshot bkp-pg-prod-20260901 verified with SHA-256 checksum.", "type": "backup", "read": True, "created_at": (now - timedelta(hours=18)).isoformat() + "Z"},
    ]

    payment_methods = [
        {"id": "pm_card_01", "brand": "visa", "last4": "4242", "exp_month": 12, "exp_year": 2028, "is_default": True, "holder_name": "Yash Baviskar"},
        {"id": "pm_card_02", "brand": "mastercard", "last4": "8894", "exp_month": 8, "exp_year": 2027, "is_default": False, "holder_name": "Yash Baviskar"},
    ]

    invoices = [
        {"id": "INV-2026-0901", "date": "2026-09-01", "period": "Aug 01, 2026 - Aug 31, 2026", "amount_inr": 2499, "status": "PAID", "payment_method": "Visa ending in 4242", "download_url": "/api/v1/operations/billing/invoices/INV-2026-0901/pdf"},
        {"id": "INV-2026-0801", "date": "2026-08-01", "period": "Jul 01, 2026 - Jul 31, 2026", "amount_inr": 2499, "status": "PAID", "payment_method": "Visa ending in 4242", "download_url": "/api/v1/operations/billing/invoices/INV-2026-0801/pdf"},
        {"id": "INV-2026-0701", "date": "2026-07-01", "period": "Jun 01, 2026 - Jun 30, 2026", "amount_inr": 2499, "status": "PAID", "payment_method": "Visa ending in 4242", "download_url": "/api/v1/operations/billing/invoices/INV-2026-0701/pdf"},
    ]

    usage = {
        "plan_name": "Team Cloud Operations",
        "plan_code": "team",
        "billing_cycle": "monthly",
        "price_inr": 2499,
        "renewal_date": (now + timedelta(days=29)).strftime("%B %d, %Y"),
        "metrics": {
            "vcpu_used": 24, "vcpu_limit": 64,
            "ram_gb_used": 48, "ram_gb_limit": 128,
            "storage_gb_used": 1420, "storage_gb_limit": 5000,
            "deployments_month": 48, "deployments_limit": 200,
            "bandwidth_gb_used": 340, "bandwidth_gb_limit": 1000
        }
    }

    return {
        "workspace_name": workspace_name,
        "applications": {app["id"]: app for app in apps},
        "deployments": deployments,
        "containers": containers,
        "logs": logs,
        "incidents": incidents,
        "workflows": workflows,
        "backups": backups,
        "infrastructure": infrastructure,
        "notifications": notifications,
        "payment_methods": payment_methods,
        "invoices": invoices,
        "usage": usage,
    }

# Master multi-tenant store dictionary
_workspaces: Dict[str, dict] = {
    "default": _create_seed_workspace_data("Production Cloud Ops"),
}

def _get_workspace_store(workspace_id: Optional[str] = None) -> dict:
    key = workspace_id.strip() if workspace_id and workspace_id.strip() else "default"
    if key not in _workspaces:
        _workspaces[key] = _create_seed_workspace_data(workspace_name=f"Workspace {key}", is_demo=False)
    return _workspaces[key]

# ─────────────────────────────────────────────────────────────────────────────
# Request Models
# ─────────────────────────────────────────────────────────────────────────────

class ApplicationCreate(BaseModel):
    name: str = Field(..., example="order-service")
    environment: str = Field("production", example="production")
    version: str = Field("v1.0.0", example="v1.0.0")
    replicas: int = Field(2, ge=1, le=20)
    strategy: str = Field("RollingUpdate", example="RollingUpdate")
    image: str = Field(..., example="aravanta/order-service:v1.0.0")
    repository: str = Field("github.com/yashbaviskar15/acos-service", example="github.com/yashbaviskar15/acos-service")
    ports: List[int] = Field([8080], example=[8080])
    env_vars: Optional[Dict[str, str]] = Field(default_factory=dict)

class ApplicationScale(BaseModel):
    replicas: int = Field(..., ge=0, le=50)

class ApplicationRollback(BaseModel):
    target_version: str = Field(..., example="v2.4.0")
    reason: Optional[str] = "Operator initiated emergency rollback"

class DeploymentTrigger(BaseModel):
    version: str = Field(..., example="v2.5.0")
    image: str = Field(..., example="aravanta/api-gateway:v2.5.0")
    environment: str = Field("production", example="production")
    strategy: str = Field("RollingUpdate", example="RollingUpdate")
    replicas: int = Field(4, ge=1, le=20)
    change_summary: Optional[str] = "Release update"

class IncidentCreate(BaseModel):
    title: str = Field(..., example="Database replication latency degradation")
    severity: str = Field("P2", example="P2")
    affected_service: str = Field(..., example="postgres-primary")
    commander: str = Field("Yash Baviskar", example="Yash Baviskar")
    initial_note: Optional[str] = "Degraded write performance observed across secondary nodes"

class IncidentTransition(BaseModel):
    status: str = Field(..., example="Mitigating")
    note: Optional[str] = None

class IncidentTimelineEvent(BaseModel):
    event: str = Field(..., example="HPA autoscaler increased worker pods to 8 replicas")

class IncidentRCA(BaseModel):
    rca_notes: str

class PaymentMethodAdd(BaseModel):
    brand: str = Field("visa", example="visa")
    last4: str = Field(..., example="4242")
    exp_month: int = Field(..., ge=1, le=12)
    exp_year: int = Field(..., ge=2024, le=2040)
    holder_name: str = Field(..., example="Yash Baviskar")
    set_as_default: bool = False

class PlanChangeRequest(BaseModel):
    plan_code: str = Field(..., example="team")
    billing_cycle: str = Field("monthly", example="monthly")

class ProvisionResourceRequest(BaseModel):
    name: str = Field(..., example="worker-node-04.mumbai")
    type: str = Field("Compute VM", example="Compute VM")
    provider: str = Field("AWS / EC2", example="AWS / EC2")
    region: str = Field("ap-south-1 (Mumbai)", example="ap-south-1 (Mumbai)")
    env: str = Field("production", example="production")
    specs: str = Field("8 vCPU, 16GB RAM, 200GB NVMe", example="8 vCPU, 16GB RAM, 200GB NVMe")
    tags: Optional[Dict[str, str]] = Field(default_factory=dict)

# ─────────────────────────────────────────────────────────────────────────────
# 1. Applications Workloads Catalog
# ─────────────────────────────────────────────────────────────────────────────

@router.get("/applications", summary="List microservices workloads")
def list_applications(
    environment: Optional[str] = None,
    status_filter: Optional[str] = Query(None, alias="status"),
    workspace_id: Optional[str] = Header(None, alias="x-workspace-id")
):
    ws = _get_workspace_store(workspace_id)
    apps = list(ws["applications"].values())
    if environment:
        apps = [a for a in apps if a["environment"].lower() == environment.lower()]
    if status_filter:
        apps = [a for a in apps if a["status"].lower() == status_filter.lower()]
    return apps

@router.post("/applications", status_code=status.HTTP_201_CREATED, summary="Create microservice")
def create_application(
    body: ApplicationCreate,
    workspace_id: Optional[str] = Header(None, alias="x-workspace-id"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user_flexible),
):
    ws = _get_workspace_store(workspace_id)
    app_id = f"app-{body.name.lower().replace(' ', '-')}"
    now = datetime.utcnow().isoformat() + "Z"
    new_app = {
        "id": app_id,
        "name": body.name,
        "environment": body.environment,
        "version": body.version,
        "previous_version": None,
        "replicas": body.replicas,
        "target_replicas": body.replicas,
        "status": "HEALTHY",
        "health_percent": 100.0,
        "error_rate_percent": 0.0,
        "cpu_usage_m": 120,
        "memory_usage_mb": 250,
        "p95_latency_ms": 15.0,
        "requests_per_sec": 120,
        "strategy": body.strategy,
        "image": body.image,
        "repository": body.repository,
        "endpoints": [f"https://{body.name}.aravanta.cloud"],
        "ports": body.ports,
        "created_at": now,
        "last_deployed_at": now,
        "env_vars": body.env_vars or {},
    }
    ws["applications"][app_id] = new_app

    emit_notification(
        db,
        title="Application Deployed",
        message=f"Application '{body.name}' ({body.environment}) deployed with {body.replicas} replica(s).",
        severity="INFO",
        source="ArvOperations",
        user_id=current_user.id,
        workspace_id=workspace_id or "default",
    )

    return new_app

@router.get("/applications/{app_id}", summary="Get application details")
def get_application(app_id: str, workspace_id: Optional[str] = Header(None, alias="x-workspace-id")):
    ws = _get_workspace_store(workspace_id)
    if app_id not in ws["applications"]:
        raise HTTPException(status_code=404, detail=f"Application {app_id} not found")
    return ws["applications"][app_id]

@router.post("/applications/{app_id}/scale", summary="Scale application replicas")
def scale_application(
    app_id: str, 
    body: ApplicationScale,
    workspace_id: Optional[str] = Header(None, alias="x-workspace-id"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user_flexible),
):
    ws = _get_workspace_store(workspace_id)
    if app_id not in ws["applications"]:
        raise HTTPException(status_code=404, detail=f"Application {app_id} not found")
    app = ws["applications"][app_id]
    app["target_replicas"] = body.replicas
    app["replicas"] = body.replicas
    if body.replicas == 0:
        app["status"] = "STOPPED"
        app["health_percent"] = 0.0
    else:
        app["status"] = "HEALTHY"
        app["health_percent"] = 100.0

    emit_notification(
        db,
        title="Application Scaled",
        message=f"Application '{app['name']}' scaled to {body.replicas} replica(s).",
        severity="INFO",
        source="ArvOperations",
        user_id=current_user.id,
        workspace_id=workspace_id or "default",
    )

    return {"message": f"Scaled {app['name']} to {body.replicas} replicas", "application": app}

@router.post("/applications/{app_id}/restart", summary="Rolling restart of application")
def restart_application(
    app_id: str,
    workspace_id: Optional[str] = Header(None, alias="x-workspace-id"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user_flexible),
):
    ws = _get_workspace_store(workspace_id)
    if app_id not in ws["applications"]:
        raise HTTPException(status_code=404, detail=f"Application {app_id} not found")
    app = ws["applications"][app_id]
    app["status"] = "HEALTHY"
    app["health_percent"] = 100.0

    emit_notification(
        db,
        title="Application Restarted",
        message=f"Rolling restart completed for '{app['name']}'.",
        severity="INFO",
        source="ArvOperations",
        user_id=current_user.id,
        workspace_id=workspace_id or "default",
    )

    return {"message": f"Rolling restart completed for {app['name']} across {app['replicas']} pods"}

@router.post("/applications/{app_id}/rollback", summary="Rollback application version")
def rollback_application(
    app_id: str, 
    body: ApplicationRollback,
    workspace_id: Optional[str] = Header(None, alias="x-workspace-id"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user_flexible),
):
    ws = _get_workspace_store(workspace_id)
    if app_id not in ws["applications"]:
        raise HTTPException(status_code=404, detail=f"Application {app_id} not found")
    app = ws["applications"][app_id]
    current = app["version"]
    app["version"] = body.target_version
    app["previous_version"] = current
    app["status"] = "HEALTHY"
    app["health_percent"] = 100.0
    app["error_rate_percent"] = 0.01

    emit_notification(
        db,
        title="Application Rolled Back",
        message=f"Application '{app['name']}' rolled back to {body.target_version}.",
        severity="WARNING",
        source="ArvOperations",
        user_id=current_user.id,
        workspace_id=workspace_id or "default",
    )

    return {"message": f"Successfully rolled back {app['name']} to {body.target_version}", "application": app}

@router.delete("/applications/{app_id}", summary="Delete application")
def delete_application(
    app_id: str,
    workspace_id: Optional[str] = Header(None, alias="x-workspace-id"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user_flexible),
):
    ws = _get_workspace_store(workspace_id)
    if app_id not in ws["applications"]:
        raise HTTPException(status_code=404, detail=f"Application {app_id} not found")
    name = ws["applications"][app_id]["name"]
    del ws["applications"][app_id]

    emit_notification(
        db,
        title="Application Deleted",
        message=f"Application '{name}' decommissioned and removed.",
        severity="WARNING",
        source="ArvOperations",
        user_id=current_user.id,
        workspace_id=workspace_id or "default",
    )

    return {"message": f"Application {app_id} deleted successfully"}

# ─────────────────────────────────────────────────────────────────────────────
# 2. Deployments & GitOps Pipeline
# ─────────────────────────────────────────────────────────────────────────────

@router.get("/deployments", summary="List deployment release history")
def list_deployments(
    application_id: Optional[str] = None,
    environment: Optional[str] = None,
    workspace_id: Optional[str] = Header(None, alias="x-workspace-id")
):
    ws = _get_workspace_store(workspace_id)
    deps = ws["deployments"]
    if application_id:
        deps = [d for d in deps if d.get("application_id") == application_id]
    if environment:
        deps = [d for d in deps if d.get("environment") == environment]
    return deps

@router.post("/deployments", status_code=status.HTTP_201_CREATED, summary="Trigger deployment")
def trigger_deployment(
    body: DeploymentTrigger,
    workspace_id: Optional[str] = Header(None, alias="x-workspace-id"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user_flexible),
):
    ws = _get_workspace_store(workspace_id)
    dep_id = f"dep-{random.randint(8850, 9999)}"
    now = datetime.utcnow().isoformat() + "Z"
    new_dep = {
        "id": dep_id,
        "application_id": "app-api-gateway",
        "application_name": body.image.split(":")[0].split("/")[-1],
        "environment": body.environment,
        "version": body.version,
        "previous_version": "v2.4.0",
        "image": body.image,
        "strategy": body.strategy,
        "replicas": body.replicas,
        "status": "SUCCESSFUL",
        "trigger": "manual release",
        "commit_hash": f"{uuid.uuid4().hex[:7]}",
        "commit_message": body.change_summary or "Release update",
        "author": "Operator",
        "started_at": now,
        "finished_at": (datetime.utcnow() + timedelta(seconds=45)).isoformat() + "Z",
        "duration_seconds": 45,
        "steps": [
            {"name": "Build Container Image", "status": "COMPLETED", "duration": "20s"},
            {"name": "Pre-flight Security Scan", "status": "COMPLETED", "duration": "10s"},
            {"name": "Deploy Pods", "status": "COMPLETED", "duration": "15s"},
        ]
    }
    ws["deployments"].insert(0, new_dep)

    emit_notification(
        db,
        title="Deployment Initiated",
        message=f"Deployment for '{new_dep['application_name']}' ({body.version}) triggered to {body.environment}.",
        severity="INFO",
        source="ArvOperations",
        user_id=current_user.id,
        workspace_id=workspace_id or "default",
    )

    return new_dep

# ─────────────────────────────────────────────────────────────────────────────
# 3. Containers Fleet Management
# ─────────────────────────────────────────────────────────────────────────────

@router.get("/containers", summary="List live Kubernetes pod fleet")
def list_containers(
    app_name: Optional[str] = None,
    workspace_id: Optional[str] = Header(None, alias="x-workspace-id")
):
    ws = _get_workspace_store(workspace_id)
    containers = ws["containers"]
    if app_name:
        containers = [c for c in containers if c.get("app_name") == app_name]
    return containers

@router.post("/containers/{container_id}/restart", summary="Restart individual pod")
def restart_container(container_id: str, workspace_id: Optional[str] = Header(None, alias="x-workspace-id")):
    return {"message": f"Pod {container_id} restart signal sent. Health probe passing."}

@router.post("/containers/{container_id}/stop", summary="Stop individual pod")
def stop_container(container_id: str, workspace_id: Optional[str] = Header(None, alias="x-workspace-id")):
    ws = _get_workspace_store(workspace_id)
    for c in ws["containers"]:
        if c["id"] == container_id:
            c["status"] = "STOPPED"
    return {"message": f"Pod {container_id} terminated."}

# ─────────────────────────────────────────────────────────────────────────────
# 4. Log Explorer Stream
# ─────────────────────────────────────────────────────────────────────────────

@router.get("/logs", summary="Stream operational logs")
def get_logs(
    service: Optional[str] = None,
    level: Optional[str] = None,
    query: Optional[str] = None,
    limit: int = 100,
    workspace_id: Optional[str] = Header(None, alias="x-workspace-id")
):
    ws = _get_workspace_store(workspace_id)
    logs = ws["logs"]
    if service and service != "all":
        logs = [l for l in logs if l.get("service") == service]
    if level and level != "all":
        logs = [l for l in logs if l.get("level").upper() == level.upper()]
    if query:
        q = query.lower()
        logs = [l for l in logs if q in l.get("message", "").lower() or q in l.get("service", "").lower()]
    return logs[:limit]

# ─────────────────────────────────────────────────────────────────────────────
# 5. Incident Command Center
# ─────────────────────────────────────────────────────────────────────────────

@router.get("/incidents", summary="List active and past incidents")
def list_incidents(
    status_filter: Optional[str] = Query(None, alias="status"),
    workspace_id: Optional[str] = Header(None, alias="x-workspace-id")
):
    ws = _get_workspace_store(workspace_id)
    incidents = ws["incidents"]
    if status_filter and status_filter != "all":
        incidents = [i for i in incidents if i["status"].lower() == status_filter.lower()]
    return incidents

@router.post("/incidents", status_code=status.HTTP_201_CREATED, summary="Declare new incident")
def declare_incident(
    body: IncidentCreate,
    workspace_id: Optional[str] = Header(None, alias="x-workspace-id"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user_flexible),
):
    ws = _get_workspace_store(workspace_id)
    inc_id = f"inc-2026-{random.randint(100, 999)}"
    now = datetime.utcnow().isoformat() + "Z"
    new_inc = {
        "id": inc_id,
        "title": body.title,
        "severity": body.severity,
        "status": "Detected",
        "affected_service": body.affected_service,
        "commander": body.commander,
        "detected_at": now,
        "resolved_at": None,
        "timeline": [
            {"timestamp": now, "event": f"Incident declared: {body.initial_note or body.title}"}
        ],
        "rca_notes": ""
    }
    ws["incidents"].insert(0, new_inc)

    emit_notification(
        db,
        title=f"Incident Declared [{body.severity}]",
        message=f"{body.title} - Affected: {body.affected_service}",
        severity="CRITICAL" if body.severity in ["P1", "critical"] else "WARNING",
        source="ArvOperations",
        user_id=current_user.id,
        workspace_id=workspace_id or "default",
    )

    return new_inc

@router.post("/incidents/{incident_id}/transition", summary="Transition incident lifecycle state")
def transition_incident(
    incident_id: str, 
    body: IncidentTransition,
    workspace_id: Optional[str] = Header(None, alias="x-workspace-id"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user_flexible),
):
    ws = _get_workspace_store(workspace_id)
    for inc in ws["incidents"]:
        if inc["id"] == incident_id:
            inc["status"] = body.status
            now = datetime.utcnow().isoformat() + "Z"
            note = body.note or f"Status transitioned to {body.status}"
            inc["timeline"].append({"timestamp": now, "event": note})
            if body.status == "Resolved":
                inc["resolved_at"] = now

            emit_notification(
                db,
                title=f"Incident {body.status}",
                message=f"Incident '{inc['title']}' moved to status '{body.status}'.",
                severity="INFO" if body.status == "Resolved" else "WARNING",
                source="ArvOperations",
                user_id=current_user.id,
                workspace_id=workspace_id or "default",
            )

            return inc
    raise HTTPException(status_code=404, detail="Incident not found")

@router.post("/incidents/{incident_id}/timeline", summary="Post event to incident war-room timeline")
def post_incident_timeline(
    incident_id: str, 
    body: IncidentTimelineEvent,
    workspace_id: Optional[str] = Header(None, alias="x-workspace-id")
):
    ws = _get_workspace_store(workspace_id)
    for inc in ws["incidents"]:
        if inc["id"] == incident_id:
            now = datetime.utcnow().isoformat() + "Z"
            inc["timeline"].append({"timestamp": now, "event": body.event})
            return inc
    raise HTTPException(status_code=404, detail="Incident not found")

@router.post("/incidents/{incident_id}/rca", summary="Update Root Cause Analysis notes")
def update_incident_rca(
    incident_id: str, 
    body: IncidentRCA,
    workspace_id: Optional[str] = Header(None, alias="x-workspace-id")
):
    ws = _get_workspace_store(workspace_id)
    for inc in ws["incidents"]:
        if inc["id"] == incident_id:
            inc["rca_notes"] = body.rca_notes
            return inc
    raise HTTPException(status_code=404, detail="Incident not found")

# ─────────────────────────────────────────────────────────────────────────────
# 6. Automation Runbooks & Playbooks
# ─────────────────────────────────────────────────────────────────────────────

@router.get("/automation/workflows", summary="List automation playbooks")
def list_workflows(workspace_id: Optional[str] = Header(None, alias="x-workspace-id")):
    ws = _get_workspace_store(workspace_id)
    return ws["workflows"]

@router.post("/automation/workflows/{workflow_id}/run", summary="Trigger runbook execution")
def run_workflow(workflow_id: str, workspace_id: Optional[str] = Header(None, alias="x-workspace-id")):
    ws = _get_workspace_store(workspace_id)
    for wf in ws["workflows"]:
        if wf["id"] == workflow_id:
            wf["last_run"] = datetime.utcnow().isoformat() + "Z"
            wf["run_count"] = (wf.get("run_count") or 0) + 1
            return {"message": f"Runbook '{wf['name']}' executed successfully.", "duration": wf["duration"]}
    raise HTTPException(status_code=404, detail="Workflow not found")

# ─────────────────────────────────────────────────────────────────────────────
# 7. Backups & Disaster Recovery
# ─────────────────────────────────────────────────────────────────────────────

@router.get("/backups", summary="List backup snapshots")
def list_backups(workspace_id: Optional[str] = Header(None, alias="x-workspace-id")):
    ws = _get_workspace_store(workspace_id)
    return ws["backups"]

@router.post("/backups/{backup_id}/restore", summary="Restore from backup snapshot")
def restore_backup(backup_id: str, workspace_id: Optional[str] = Header(None, alias="x-workspace-id")):
    ws = _get_workspace_store(workspace_id)
    for bkp in ws["backups"]:
        if bkp["id"] == backup_id:
            return {"message": f"Restore completed successfully from snapshot {backup_id}."}
    raise HTTPException(status_code=404, detail="Backup snapshot not found")

# ─────────────────────────────────────────────────────────────────────────────
# 8. Infrastructure Multi-Cloud Inventory
# ─────────────────────────────────────────────────────────────────────────────

@router.get("/infrastructure/inventory", summary="Multi-cloud resource inventory")
def get_infrastructure_inventory(workspace_id: Optional[str] = Header(None, alias="x-workspace-id")):
    ws = _get_workspace_store(workspace_id)
    return {
        "workspace": ws["workspace_name"],
        "total_resources": len(ws["infrastructure"]),
        "resources": ws["infrastructure"]
    }

@router.post("/infrastructure/provision", status_code=status.HTTP_201_CREATED, summary="Provision infrastructure resource")
def provision_resource(
    body: ProvisionResourceRequest,
    workspace_id: Optional[str] = Header(None, alias="x-workspace-id")
):
    ws = _get_workspace_store(workspace_id)
    res_id = f"res-{uuid.uuid4().hex[:8]}"
    new_res = {
        "id": res_id,
        "name": body.name,
        "type": body.type,
        "provider": body.provider,
        "region": body.region,
        "env": body.env,
        "status": "RUNNING",
        "specs": body.specs,
        "uptime": "100.0% (Just provisioned)",
        "tags": body.tags or {"env": body.env}
    }
    ws["infrastructure"].insert(0, new_res)
    return new_res

@router.post("/infrastructure/{res_id}/restart", summary="Rolling restart infrastructure node")
def restart_resource(res_id: str, workspace_id: Optional[str] = Header(None, alias="x-workspace-id")):
    ws = _get_workspace_store(workspace_id)
    for r in ws["infrastructure"]:
        if r["id"] == res_id:
            r["status"] = "RUNNING"
            return {"message": f"Resource {r['name']} restarted successfully."}
    raise HTTPException(status_code=404, detail="Resource not found")

@router.post("/infrastructure/{res_id}/stop", summary="Halt infrastructure resource")
def stop_resource(res_id: str, workspace_id: Optional[str] = Header(None, alias="x-workspace-id")):
    ws = _get_workspace_store(workspace_id)
    for r in ws["infrastructure"]:
        if r["id"] == res_id:
            r["status"] = "STOPPED"
            return {"message": f"Resource {r['name']} halted."}
    raise HTTPException(status_code=404, detail="Resource not found")

@router.delete("/infrastructure/{res_id}", summary="Decommission infrastructure resource")
def decommission_resource(res_id: str, workspace_id: Optional[str] = Header(None, alias="x-workspace-id")):
    ws = _get_workspace_store(workspace_id)
    ws["infrastructure"] = [r for r in ws["infrastructure"] if r["id"] != res_id]
    return {"message": f"Resource {res_id} decommissioned."}

# ─────────────────────────────────────────────────────────────────────────────
# 9. Notifications Center
# ─────────────────────────────────────────────────────────────────────────────

@router.get("/notifications", summary="List user notifications")
def list_notifications(
    workspace_id: Optional[str] = Header(None, alias="x-workspace-id"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user_flexible),
):
    query = db.query(Notification)
    if current_user.role != "admin":
        query = query.filter((Notification.user_id == current_user.id) | (Notification.user_id == "system"))
    notifs = query.order_by(Notification.created_at.desc()).limit(50).all()
    if not notifs:
        ws = _get_workspace_store(workspace_id)
        return ws.get("notifications", [])
    return [n.to_dict() for n in notifs]


@router.post("/notifications/{notif_id}/read", summary="Mark notification as read")
def mark_notification_read(
    notif_id: str,
    workspace_id: Optional[str] = Header(None, alias="x-workspace-id"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user_flexible),
):
    notif = db.query(Notification).filter(Notification.id == notif_id).first()
    if notif:
        notif.read = True
        db.commit()
        return notif.to_dict()
    ws = _get_workspace_store(workspace_id)
    for n in ws.get("notifications", []):
        if n["id"] == notif_id:
            n["read"] = True
            return n
    return {"message": "Notification updated"}


@router.post("/notifications/read-all", summary="Mark all notifications as read")
def mark_all_notifications_read(
    workspace_id: Optional[str] = Header(None, alias="x-workspace-id"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user_flexible),
):
    query = db.query(Notification)
    if current_user.role != "admin":
        query = query.filter(Notification.user_id == current_user.id)
    query.update({Notification.read: True})
    db.commit()
    ws = _get_workspace_store(workspace_id)
    for n in ws.get("notifications", []):
        n["read"] = True
    return {"message": "All notifications marked as read"}


# ─────────────────────────────────────────────────────────────────────────────
# 10. Billing, Invoices & Payment Methods
# ─────────────────────────────────────────────────────────────────────────────

@router.get("/billing/summary", summary="Get workspace billing & FinOps usage summary")
def get_billing_summary(workspace_id: Optional[str] = Header(None, alias="x-workspace-id")):
    ws = _get_workspace_store(workspace_id)
    return {
        "workspace_name": ws["workspace_name"],
        "usage": ws["usage"],
        "payment_methods_count": len(ws["payment_methods"]),
        "invoices_count": len(ws["invoices"])
    }

@router.get("/billing/invoices", summary="List workspace invoices")
def list_invoices(workspace_id: Optional[str] = Header(None, alias="x-workspace-id")):
    ws = _get_workspace_store(workspace_id)
    return ws["invoices"]

@router.get("/billing/payment-methods", summary="List saved payment methods")
def list_payment_methods(workspace_id: Optional[str] = Header(None, alias="x-workspace-id")):
    ws = _get_workspace_store(workspace_id)
    return ws["payment_methods"]

@router.post("/billing/payment-methods", status_code=status.HTTP_201_CREATED, summary="Add payment method")
def add_payment_method(
    body: PaymentMethodAdd,
    workspace_id: Optional[str] = Header(None, alias="x-workspace-id")
):
    ws = _get_workspace_store(workspace_id)
    pm_id = f"pm_card_{uuid.uuid4().hex[:8]}"
    
    if body.set_as_default:
        for pm in ws["payment_methods"]:
            pm["is_default"] = False

    new_pm = {
        "id": pm_id,
        "brand": body.brand.lower(),
        "last4": body.last4[-4:],
        "exp_month": body.exp_month,
        "exp_year": body.exp_year,
        "is_default": body.set_as_default or len(ws["payment_methods"]) == 0,
        "holder_name": body.holder_name
    }
    ws["payment_methods"].append(new_pm)
    return new_pm

@router.delete("/billing/payment-methods/{pm_id}", summary="Remove payment method")
def remove_payment_method(pm_id: str, workspace_id: Optional[str] = Header(None, alias="x-workspace-id")):
    ws = _get_workspace_store(workspace_id)
    ws["payment_methods"] = [pm for pm in ws["payment_methods"] if pm["id"] != pm_id]
    return {"message": "Payment method removed successfully."}

@router.post("/billing/payment-methods/{pm_id}/default", summary="Set default payment method")
def set_default_payment_method(pm_id: str, workspace_id: Optional[str] = Header(None, alias="x-workspace-id")):
    ws = _get_workspace_store(workspace_id)
    found = False
    for pm in ws["payment_methods"]:
        if pm["id"] == pm_id:
            pm["is_default"] = True
            found = True
        else:
            pm["is_default"] = False
    if not found:
        raise HTTPException(status_code=404, detail="Payment method not found")
    return {"message": "Default payment method updated."}

@router.post("/billing/plan/change", summary="Upgrade or downgrade workspace subscription plan")
def change_subscription_plan(
    body: PlanChangeRequest,
    workspace_id: Optional[str] = Header(None, alias="x-workspace-id")
):
    ws = _get_workspace_store(workspace_id)
    plan_map = {
        "developer": {"name": "Developer Cloud Starter", "price": 499, "vcpu": 8, "ram": 16, "storage": 500},
        "team": {"name": "Team Cloud Operations", "price": 2499, "vcpu": 64, "ram": 128, "storage": 5000},
        "enterprise": {"name": "Dedicated Enterprise Control Plane", "price": 14999, "vcpu": 256, "ram": 512, "storage": 25000}
    }
    target = plan_map.get(body.plan_code.lower(), plan_map["team"])
    ws["usage"]["plan_name"] = target["name"]
    ws["usage"]["plan_code"] = body.plan_code.lower()
    ws["usage"]["price_inr"] = target["price"]
    ws["usage"]["metrics"]["vcpu_limit"] = target["vcpu"]
    ws["usage"]["metrics"]["ram_gb_limit"] = target["ram"]
    ws["usage"]["metrics"]["storage_gb_limit"] = target["storage"]

    return {"message": f"Plan updated to {target['name']}", "usage": ws["usage"]}
