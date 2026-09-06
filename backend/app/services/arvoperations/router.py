"""
Aravanta CloudOS — ArvOperations Service Router
Multi-Tenant Unified Cloud Operations, Developer Platform, Observability, Incidents & Automation Engine.
"""
import uuid
import random
import copy
from datetime import datetime, timedelta
from typing import Optional, List, Dict, Any
from fastapi import APIRouter, HTTPException, Query, status, Header, Depends, Response
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session
from sqlalchemy import or_, func
from fpdf import FPDF
from fpdf.enums import XPos, YPos

import json
from app.core.database import get_db
from app.services.arvgate.models import User
from app.services.arvgate.dependencies import get_current_user, require_roles, get_current_user_optional
from app.core.cloud_models import (
    Notification, emit_notification, DeploymentRecord, ApplicationRecord, BackupRecord,
    ComputeInstance, KubeCluster, StorageBucket, DatabaseInstance, PaymentMethodRecord, InvoiceRecord
)

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
    event: Optional[str] = None
    note: Optional[str] = None
    author: Optional[str] = None
    type: Optional[str] = "UPDATE"

class IncidentRCA(BaseModel):
    rca_notes: str

class PaymentMethodAdd(BaseModel):
    brand: str = Field("visa", example="visa")
    last4: str = Field(..., example="4242")
    exp_month: Optional[int] = Field(12, ge=1, le=12)
    exp_year: Optional[int] = Field(2030, ge=2024, le=2040)
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

class CreateBackupRequest(BaseModel):
    resource_type: str = "database"
    resource_name: str
    retention_days: int = 30

class ContainerActionRequest(BaseModel):
    action: str = "restart"

# ─────────────────────────────────────────────────────────────────────────────
# 1. Applications Workloads Catalog
# ─────────────────────────────────────────────────────────────────────────────

@router.get("/applications", summary="List microservices workloads")
def list_applications(
    environment: Optional[str] = None,
    status_filter: Optional[str] = Query(None, alias="status"),
    workspace_id: Optional[str] = Header(None, alias="x-workspace-id"),
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user),
):
    query = db.query(ApplicationRecord)
    if current_user and (current_user.role or "").strip().lower() not in ["superadmin", "admin"]:
        query = query.filter(
            (ApplicationRecord.user_id == current_user.id) |
            (ApplicationRecord.workspace_id == current_user.workspace_id)
        )
    if environment:
        query = query.filter(ApplicationRecord.environment.ilike(environment))
    if status_filter:
        query = query.filter(ApplicationRecord.status.ilike(status_filter))
    
    db_apps = query.order_by(ApplicationRecord.created_at.desc()).all()
    if db_apps:
        return [a.to_dict() for a in db_apps]

    # Fallback to workspace store if database has no records for this workspace
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
    current_user: User = Depends(require_roles(["SuperAdmin", "Admin", "Operator", "Developer"])),
):
    ws = _get_workspace_store(workspace_id)
    app_id = f"app-{body.name.lower().replace(' ', '-')}"
    now_dt = datetime.utcnow()
    now_iso = now_dt.isoformat() + "Z"

    # Persist directly into PostgreSQL database
    existing = db.query(ApplicationRecord).filter(ApplicationRecord.id == app_id).first()
    if existing:
        existing.version = body.version
        existing.replicas = body.replicas
        existing.target_replicas = body.replicas
        existing.image = body.image
        existing.strategy = body.strategy
        existing.environment = body.environment
        existing.last_deployed_at = now_dt
        db_app = existing
    else:
        db_app = ApplicationRecord(
            id=app_id,
            user_id=current_user.id,
            workspace_id=current_user.workspace_id or workspace_id or "default",
            name=body.name,
            environment=body.environment,
            version=body.version,
            previous_version=None,
            replicas=body.replicas,
            target_replicas=body.replicas,
            status="HEALTHY",
            health_percent=100.0,
            error_rate_percent=0.0,
            cpu_usage_m=120,
            memory_usage_mb=250,
            p95_latency_ms=15.0,
            requests_per_sec=120,
            strategy=body.strategy,
            image=body.image,
            repository=body.repository,
            endpoints=json.dumps([f"https://{body.name}.aravanta.cloud"]),
            ports=json.dumps(body.ports),
            env_vars=json.dumps(body.env_vars or {}),
            created_at=now_dt,
            last_deployed_at=now_dt,
        )
        db.add(db_app)

    db.commit()
    db.refresh(db_app)

    new_app = db_app.to_dict()
    ws["applications"][app_id] = new_app

    emit_notification(
        db,
        title="Application Deployed",
        message=f"Application '{body.name}' ({body.environment}) deployed with {body.replicas} replica(s).",
        severity="INFO",
        source="ArvOperations",
        user_id=current_user.id,
        workspace_id=workspace_id or current_user.workspace_id or "default",
    )

    return new_app

@router.get("/applications/{app_id}", summary="Get application details")
def get_application(
    app_id: str, 
    workspace_id: Optional[str] = Header(None, alias="x-workspace-id"),
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user),
):
    db_app = db.query(ApplicationRecord).filter(ApplicationRecord.id == app_id).first()
    if db_app:
        return db_app.to_dict()

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
    current_user: User = Depends(require_roles(["SuperAdmin", "Admin", "Operator", "Developer"])),
):
    db_app = db.query(ApplicationRecord).filter(ApplicationRecord.id == app_id).first()
    if db_app:
        db_app.target_replicas = body.replicas
        db_app.replicas = body.replicas
        if body.replicas == 0:
            db_app.status = "STOPPED"
            db_app.health_percent = 0.0
        else:
            db_app.status = "HEALTHY"
            db_app.health_percent = 100.0
        db.commit()
        db.refresh(db_app)
        app_dict = db_app.to_dict()
    else:
        ws = _get_workspace_store(workspace_id)
        if app_id not in ws["applications"]:
            raise HTTPException(status_code=404, detail=f"Application {app_id} not found")
        app = ws["applications"][app_id]
        app["target_replicas"] = body.replicas
        app["replicas"] = body.replicas
        app["status"] = "STOPPED" if body.replicas == 0 else "HEALTHY"
        app_dict = app

    emit_notification(
        db,
        title="Application Scaled",
        message=f"Application '{app_dict['name']}' scaled to {body.replicas} replica(s).",
        severity="INFO",
        source="ArvOperations",
        user_id=current_user.id,
        workspace_id=workspace_id or "default",
    )

    return {"message": f"Scaled {app_dict['name']} to {body.replicas} replicas", "application": app_dict}

@router.post("/applications/{app_id}/restart", summary="Rolling restart of application")
def restart_application(
    app_id: str,
    workspace_id: Optional[str] = Header(None, alias="x-workspace-id"),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(["SuperAdmin", "Admin", "Operator", "Developer"])),
):
    db_app = db.query(ApplicationRecord).filter(ApplicationRecord.id == app_id).first()
    name = db_app.name if db_app else app_id
    replicas = db_app.replicas if db_app else 1
    if db_app:
        db_app.status = "HEALTHY"
        db_app.health_percent = 100.0
        db.commit()

    emit_notification(
        db,
        title="Application Restarted",
        message=f"Rolling restart completed for '{name}'.",
        severity="INFO",
        source="ArvOperations",
        user_id=current_user.id,
        workspace_id=workspace_id or "default",
    )

    return {"message": f"Rolling restart completed for {name} across {replicas} pods"}

@router.post("/applications/{app_id}/rollback", summary="Rollback application version")
def rollback_application(
    app_id: str, 
    body: ApplicationRollback,
    workspace_id: Optional[str] = Header(None, alias="x-workspace-id"),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(["SuperAdmin", "Admin", "Operator", "Developer"])),
):
    db_app = db.query(ApplicationRecord).filter(ApplicationRecord.id == app_id).first()
    if db_app:
        current = db_app.version
        db_app.version = body.target_version
        db_app.previous_version = current
        db_app.status = "HEALTHY"
        db_app.health_percent = 100.0
        db.commit()
        db.refresh(db_app)
        app_dict = db_app.to_dict()
    else:
        ws = _get_workspace_store(workspace_id)
        if app_id not in ws["applications"]:
            raise HTTPException(status_code=404, detail=f"Application {app_id} not found")
        app = ws["applications"][app_id]
        current = app["version"]
        app["version"] = body.target_version
        app["previous_version"] = current
        app["status"] = "HEALTHY"
        app_dict = app

    emit_notification(
        db,
        title="Application Rolled Back",
        message=f"Application '{app_dict['name']}' rolled back to {body.target_version}.",
        severity="WARNING",
        source="ArvOperations",
        user_id=current_user.id,
        workspace_id=workspace_id or "default",
    )

    return {"message": f"Successfully rolled back {app_dict['name']} to {body.target_version}", "application": app_dict}

@router.delete("/applications/{app_id}", summary="Delete application")
def delete_application(
    app_id: str,
    workspace_id: Optional[str] = Header(None, alias="x-workspace-id"),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(["SuperAdmin", "Admin", "Operator"])),
):
    db_app = db.query(ApplicationRecord).filter(ApplicationRecord.id == app_id).first()
    name = db_app.name if db_app else app_id
    if db_app:
        db.delete(db_app)
        db.commit()

    ws = _get_workspace_store(workspace_id)
    if app_id in ws["applications"]:
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
    current_user: User = Depends(require_roles(["SuperAdmin", "Admin", "Operator", "Developer"])),
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


@router.post("/deployments/{deployment_id}/rollback", summary="Rollback specific deployment")
def rollback_deployment(
    deployment_id: str,
    workspace_id: Optional[str] = Header(None, alias="x-workspace-id"),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(["SuperAdmin", "Admin", "Operator", "Developer"])),
):
    ws = _get_workspace_store(workspace_id)
    target_dep = None
    for d in ws["deployments"]:
        if d["id"] == deployment_id:
            target_dep = d
            break

    db_dep = db.query(DeploymentRecord).filter(DeploymentRecord.id == deployment_id).first()
    app_name = target_dep["application_name"] if target_dep else (db_dep.service_name if db_dep else "service")
    target_version = (target_dep.get("previous_version") if target_dep else None) or "v1.0.0"

    if target_dep:
        target_dep["status"] = "SUCCESSFUL"
        target_dep["commit_message"] = f"Emergency rollback to {target_version}"

    if db_dep:
        db_dep.status = "SUCCESSFUL"
        db.commit()

    for app in ws["applications"].values():
        if app.get("name") == app_name:
            app["version"] = target_version
            app["status"] = "HEALTHY"
            app["health_percent"] = 100.0
            app["error_rate_percent"] = 0.01

    db_app = db.query(ApplicationRecord).filter(ApplicationRecord.name == app_name).first()
    if db_app:
        db_app.version = target_version
        db_app.status = "HEALTHY"
        db_app.health_percent = 100.0
        db.commit()

    emit_notification(
        db,
        title=f"Rollback Completed: {deployment_id}",
        message=f"Deployment '{deployment_id}' for {app_name} rolled back to stable release {target_version}.",
        severity="WARNING",
        source="ArvOperations",
        user_id=current_user.id,
        workspace_id=workspace_id or "default",
    )

    return {
        "message": f"Successfully rolled back deployment {deployment_id} to {target_version}",
        "deployment_id": deployment_id,
        "target_version": target_version
    }


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

@router.post("/containers/{container_id}/action", summary="Perform container action (start/stop/restart)")
def container_action(
    container_id: str,
    body: ContainerActionRequest,
    workspace_id: Optional[str] = Header(None, alias="x-workspace-id"),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(["SuperAdmin", "Admin", "Operator", "Developer"])),
):
    ws = _get_workspace_store(workspace_id)
    target = None
    for c in ws["containers"]:
        if c["id"] == container_id:
            target = c
            if body.action == "stop":
                c["status"] = "STOPPED"
            elif body.action in ["start", "restart"]:
                c["status"] = "RUNNING"
                if body.action == "restart":
                    c["restarts"] = (c.get("restarts") or 0) + 1
            break

    name = target["name"] if target else container_id
    emit_notification(
        db,
        title=f"Container {body.action.capitalize()}ed",
        message=f"Container '{name}' action '{body.action}' completed successfully.",
        severity="INFO",
        source="ArvOperations",
        user_id=current_user.id,
        workspace_id=workspace_id or "default",
    )

    return {"message": f"Container {name} {body.action} executed successfully."}

@router.get("/containers/{container_id}/logs", summary="Get logs for a specific pod")
def get_container_logs(
    container_id: str,
    workspace_id: Optional[str] = Header(None, alias="x-workspace-id"),
    limit: int = 50,
):
    ws = _get_workspace_store(workspace_id)
    logs = ws.get("logs", [])
    pod_logs = [l for l in logs if container_id in l.get("message", "") or container_id in l.get("service", "")]
    if not pod_logs:
        now = datetime.utcnow()
        pod_logs = [
            {"timestamp": (now - timedelta(seconds=i * 10)).isoformat() + "Z", "level": "INFO", "service": container_id, "message": f"Container {container_id} stdout: Worker loop tick {i} - status OK"}
            for i in range(10)
        ]
    return pod_logs[:limit]


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
    current_user: User = Depends(require_roles(["SuperAdmin", "Admin", "Operator"])),
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
    current_user: User = Depends(require_roles(["SuperAdmin", "Admin", "Operator"])),
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
    ev_text = body.event or body.note or "Timeline note logged"
    for inc in ws["incidents"]:
        if inc["id"] == incident_id:
            now = datetime.utcnow().isoformat() + "Z"
            inc["timeline"].append({
                "timestamp": now,
                "event": ev_text,
                "note": ev_text,
                "author": body.author or "Incident Commander",
                "type": body.type or "UPDATE"
            })
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
def list_workflows(
    workspace_id: Optional[str] = Header(None, alias="x-workspace-id"),
    current_user: User = Depends(get_current_user),
):
    ws = _get_workspace_store(workspace_id)
    return ws["workflows"]

@router.post("/automation/workflows/{workflow_id}/run", summary="Trigger runbook execution")
def run_workflow(
    workflow_id: str, 
    workspace_id: Optional[str] = Header(None, alias="x-workspace-id"),
    current_user: User = Depends(require_roles(["SuperAdmin", "Admin", "Operator", "Developer"])),
):
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
def list_backups(
    workspace_id: Optional[str] = Header(None, alias="x-workspace-id"),
    current_user: User = Depends(require_roles(["SuperAdmin", "Admin", "Operator"])),
):
    ws = _get_workspace_store(workspace_id)
    return ws["backups"]

@router.post("/backups", status_code=status.HTTP_201_CREATED, summary="Create backup snapshot")
def create_backup(
    body: CreateBackupRequest,
    workspace_id: Optional[str] = Header(None, alias="x-workspace-id"),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(["SuperAdmin", "Admin", "Operator"])),
):
    ws = _get_workspace_store(workspace_id)
    bkp_id = f"snap-{random.randint(1000, 9999)}"
    now = datetime.utcnow()
    new_bkp = {
        "id": bkp_id,
        "name": f"{body.resource_name.split(' ')[0]}-snap-{now.strftime('%Y%m%d%H%M')}",
        "resource_type": body.resource_type,
        "resource_name": body.resource_name,
        "size_mb": random.randint(1200, 8500),
        "status": "COMPLETED",
        "created_at": now.isoformat() + "Z",
        "retention_days": body.retention_days,
        "restore_point": (now - timedelta(minutes=5)).strftime("%Y-%m-%d %H:%M:%S UTC"),
        "region": "arv-us-east-1",
        "encryption": "AES-256",
    }
    ws = _get_workspace_store(workspace_id)
    ws["backups"].insert(0, new_bkp)

    emit_notification(
        db,
        title="Backup Snapshot Created",
        message=f"Disaster recovery snapshot '{new_bkp['name']}' created for {body.resource_name}.",
        severity="INFO",
        source="ArvOperations",
        user_id=current_user.id,
        workspace_id=workspace_id or "default",
    )

    return new_bkp

@router.post("/backups/{backup_id}/restore", summary="Restore from backup snapshot")
def restore_backup(
    backup_id: str,
    workspace_id: Optional[str] = Header(None, alias="x-workspace-id"),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(["SuperAdmin", "Admin", "Operator"])),
):
    ws = _get_workspace_store(workspace_id)
    for bkp in ws["backups"]:
        if bkp["id"] == backup_id:
            emit_notification(
                db,
                title="Backup Restore Initiated",
                message=f"Restoration from snapshot '{bkp['name']}' completed successfully.",
                severity="INFO",
                source="ArvOperations",
                user_id=current_user.id,
                workspace_id=workspace_id or "default",
            )
            return {"message": f"Restore completed successfully from snapshot {backup_id}."}
    raise HTTPException(status_code=404, detail="Backup snapshot not found")

@router.delete("/backups/{backup_id}", summary="Delete backup snapshot")
def delete_backup(
    backup_id: str,
    workspace_id: Optional[str] = Header(None, alias="x-workspace-id"),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(["SuperAdmin", "Admin"])),
):
    ws = _get_workspace_store(workspace_id)
    ws["backups"] = [b for b in ws["backups"] if b["id"] != backup_id]

    emit_notification(
        db,
        title="Backup Snapshot Deleted",
        message=f"Backup snapshot '{backup_id}' removed from disaster recovery storage.",
        severity="INFO",
        source="ArvOperations",
        user_id=current_user.id,
        workspace_id=workspace_id or "default",
    )

    return {"message": f"Backup snapshot {backup_id} deleted"}


# ─────────────────────────────────────────────────────────────────────────────
# 8. Infrastructure Multi-Cloud Inventory
# ─────────────────────────────────────────────────────────────────────────────

@router.get("/infrastructure/inventory", summary="Multi-cloud resource inventory")
def get_infrastructure_inventory(
    workspace_id: Optional[str] = Header(None, alias="x-workspace-id"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    ws_id = current_user.workspace_id or workspace_id or "default"
    is_admin = (current_user.role or "").strip().lower() in ["superadmin", "admin"]

    # Pull real persistent records from all core cloud services
    vm_q = db.query(ComputeInstance)
    k8s_q = db.query(KubeCluster)
    db_q = db.query(DatabaseInstance)
    s3_q = db.query(StorageBucket)
    app_q = db.query(ApplicationRecord)

    if not is_admin:
        vm_q = vm_q.filter((ComputeInstance.user_id == current_user.id) | (ComputeInstance.workspace_id == ws_id))
        k8s_q = k8s_q.filter((KubeCluster.user_id == current_user.id) | (KubeCluster.workspace_id == ws_id))
        db_q = db_q.filter((DatabaseInstance.user_id == current_user.id) | (DatabaseInstance.workspace_id == ws_id))
        s3_q = s3_q.filter((StorageBucket.user_id == current_user.id) | (StorageBucket.workspace_id == ws_id))
        app_q = app_q.filter((ApplicationRecord.user_id == current_user.id) | (ApplicationRecord.workspace_id == ws_id))

    vms = vm_q.all()
    clusters = k8s_q.all()
    dbs = db_q.all()
    buckets = s3_q.all()
    apps = app_q.all()

    resources = []
    for vm in vms:
        try:
            tags = json.loads(vm.tags) if vm.tags else {}
        except Exception:
            tags = {}
        resources.append({
            "id": vm.id,
            "name": vm.name,
            "type": "Compute VM",
            "provider": "AWS / EC2",
            "region": vm.region,
            "env": tags.get("env", "production"),
            "status": vm.status,
            "specs": f"{vm.instance_type} ({vm.os_image})",
            "uptime": "99.98% (Healthy)",
            "tags": tags
        })
    for c in clusters:
        resources.append({
            "id": c.id,
            "name": c.name,
            "type": "Kubernetes Cluster",
            "provider": "AWS / EKS",
            "region": c.region,
            "env": "production",
            "status": c.status,
            "specs": f"{c.node_count} Nodes ({c.node_size}) - K8s {c.version}",
            "uptime": "99.99%",
            "tags": {"orchestrator": "kubernetes"}
        })
    for d in dbs:
        resources.append({
            "id": d.id,
            "name": d.name,
            "type": "Managed Database",
            "provider": f"{d.engine} Managed",
            "region": d.region,
            "env": "production",
            "status": d.status,
            "specs": f"{d.tier} ({d.storage_gb}GB)",
            "uptime": "99.99%",
            "tags": {"tier": "data-layer"}
        })
    for b in buckets:
        resources.append({
            "id": b.id,
            "name": b.name,
            "type": "Object Storage",
            "provider": "ArvStore S3",
            "region": b.region,
            "env": "production",
            "status": "RUNNING",
            "specs": f"{b.size_gb} GB / {b.storage_class}",
            "uptime": "100.0%",
            "tags": {"storage": b.storage_class}
        })
    for a in apps:
        resources.append({
            "id": a.id,
            "name": a.name,
            "type": "Microservice",
            "provider": "CloudOS Workload",
            "region": "global",
            "env": a.environment,
            "status": a.status,
            "specs": f"{a.replicas} Replicas ({a.version})",
            "uptime": "99.99%",
            "tags": {"environment": a.environment}
        })

    # If empty, fallback to seed workspace data
    if not resources:
        ws = _get_workspace_store(workspace_id)
        resources = ws["infrastructure"]

    return {
        "workspace": current_user.workspace_name or "Production Cloud Ops",
        "total_resources": len(resources),
        "resources": resources
    }

@router.post("/infrastructure/provision", status_code=status.HTTP_201_CREATED, summary="Provision infrastructure resource")
def provision_resource(
    body: ProvisionResourceRequest,
    workspace_id: Optional[str] = Header(None, alias="x-workspace-id"),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(["SuperAdmin", "Admin", "Operator", "Developer"])),
):
    ws_id = current_user.workspace_id or workspace_id or "default"
    res_id = f"vm-{uuid.uuid4().hex[:8]}"

    # Persist as real ComputeInstance in PostgreSQL
    new_vm = ComputeInstance(
        id=res_id,
        user_id=current_user.id,
        workspace_id=ws_id,
        name=body.name.strip(),
        instance_type="arv.medium",
        os_image="Ubuntu 22.04 LTS",
        region=body.region or "arv-ap-south-1",
        status="RUNNING",
        private_ip=f"10.0.{random.randint(1,254)}.{random.randint(1,254)}",
        public_ip=f"34.{random.randint(100,250)}.{random.randint(1,254)}.{random.randint(1,254)}",
        cpu_usage=5.0,
        ram_usage=20.0,
        disk_gb=100,
        tags=json.dumps(body.tags or {"env": body.env}),
        created_at=datetime.utcnow()
    )
    db.add(new_vm)
    db.commit()
    db.refresh(new_vm)

    new_res = {
        "id": res_id,
        "name": body.name,
        "type": body.type or "Compute VM",
        "provider": body.provider or "AWS / EC2",
        "region": body.region,
        "env": body.env,
        "status": "RUNNING",
        "specs": body.specs,
        "uptime": "100.0% (Just provisioned)",
        "tags": body.tags or {"env": body.env}
    }

    emit_notification(
        db,
        title="Infrastructure Provisioned",
        message=f"Infrastructure node '{body.name}' ({body.type}) provisioned in {body.region}.",
        severity="INFO",
        source="ArvOperations",
        user_id=current_user.id,
        workspace_id=ws_id,
    )

    return new_res

@router.post("/infrastructure/{res_id}/restart", summary="Rolling restart infrastructure node")
def restart_resource(
    res_id: str,
    workspace_id: Optional[str] = Header(None, alias="x-workspace-id"),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(["SuperAdmin", "Admin", "Operator", "Developer"])),
):
    vm = db.query(ComputeInstance).filter(ComputeInstance.id == res_id).first()
    if vm:
        vm.status = "RUNNING"
        db.commit()
        name = vm.name
    else:
        name = res_id

    emit_notification(
        db,
        title="Infrastructure Restarted",
        message=f"Infrastructure node '{name}' restarted successfully.",
        severity="INFO",
        source="ArvOperations",
        user_id=current_user.id,
        workspace_id=current_user.workspace_id or "default",
    )
    return {"message": f"Resource {name} restarted successfully."}

@router.post("/infrastructure/{res_id}/stop", summary="Halt infrastructure resource")
def stop_resource(
    res_id: str,
    workspace_id: Optional[str] = Header(None, alias="x-workspace-id"),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(["SuperAdmin", "Admin", "Operator", "Developer"])),
):
    vm = db.query(ComputeInstance).filter(ComputeInstance.id == res_id).first()
    if vm:
        vm.status = "STOPPED"
        db.commit()
        name = vm.name
    else:
        name = res_id

    emit_notification(
        db,
        title="Infrastructure Halted",
        message=f"Infrastructure node '{name}' has been stopped.",
        severity="WARNING",
        source="ArvOperations",
        user_id=current_user.id,
        workspace_id=current_user.workspace_id or "default",
    )
    return {"message": f"Resource {name} halted."}

@router.delete("/infrastructure/{res_id}", summary="Decommission infrastructure resource")
def decommission_resource(
    res_id: str,
    workspace_id: Optional[str] = Header(None, alias="x-workspace-id"),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(["SuperAdmin", "Admin", "Operator"])),
):
    vm = db.query(ComputeInstance).filter(ComputeInstance.id == res_id).first()
    name = vm.name if vm else res_id
    if vm:
        db.delete(vm)
        db.commit()

    emit_notification(
        db,
        title="Infrastructure Decommissioned",
        message=f"Infrastructure resource '{name}' decommissioned and released.",
        severity="WARNING",
        source="ArvOperations",
        user_id=current_user.id,
        workspace_id=current_user.workspace_id or "default",
    )
    return {"message": f"Resource {name} decommissioned successfully."}

# ─────────────────────────────────────────────────────────────────────────────
# 9. Notifications Center
# ─────────────────────────────────────────────────────────────────────────────

@router.get("/notifications", summary="List user notifications")
def list_notifications(
    workspace_id: Optional[str] = Header(None, alias="x-workspace-id"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    query = db.query(Notification)
    user_role = (current_user.role or "").strip().lower()
    if user_role not in ["superadmin", "admin"]:
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
    current_user: User = Depends(get_current_user),
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
    current_user: User = Depends(get_current_user),
):
    query = db.query(Notification)
    user_role = (current_user.role or "").strip().lower()
    if user_role not in ["superadmin", "admin"]:
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
def get_billing_summary(
    workspace_id: Optional[str] = Header(None, alias="x-workspace-id"),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(["SuperAdmin", "Admin", "Operator", "Developer"])),
):
    ws_id = current_user.workspace_id or workspace_id or "default"
    pm_count = db.query(PaymentMethodRecord).filter(
        (PaymentMethodRecord.user_id == current_user.id) | (PaymentMethodRecord.workspace_id == ws_id)
    ).count()
    inv_count = db.query(InvoiceRecord).filter(
        (InvoiceRecord.user_id == current_user.id) | (InvoiceRecord.workspace_id == ws_id)
    ).count()

    ws = _get_workspace_store(workspace_id)
    return {
        "workspace_name": current_user.workspace_name or ws["workspace_name"],
        "usage": ws["usage"],
        "payment_methods_count": max(1, pm_count),
        "invoices_count": max(1, inv_count)
    }

@router.get("/billing/invoices", summary="List workspace invoices")
def list_invoices(
    workspace_id: Optional[str] = Header(None, alias="x-workspace-id"),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(["SuperAdmin", "Admin", "Operator", "Developer"])),
):
    ws_id = current_user.workspace_id or workspace_id or "default"
    invs = db.query(InvoiceRecord).filter(
        (InvoiceRecord.user_id == current_user.id) | (InvoiceRecord.workspace_id == ws_id)
    ).order_by(InvoiceRecord.created_at.desc()).all()

    if not invs:
        # Seed initial paid invoice for workspace in PostgreSQL
        now = datetime.utcnow()
        init_inv = InvoiceRecord(
            id=f"INV-{now.strftime('%Y%m')}-001",
            user_id=current_user.id,
            workspace_id=ws_id,
            period=f"{now.strftime('%B %Y')}",
            amount_inr=2499.0,
            amount_usd=30.0,
            status="PAID",
            payment_method="Visa ending in 4242",
            date=now.strftime("%Y-%m-%d"),
            download_url=f"/api/v1/operations/billing/invoices/INV-{now.strftime('%Y%m')}-001/pdf",
            created_at=now
        )
        try:
            db.add(init_inv)
            db.commit()
            db.refresh(init_inv)
            invs = [init_inv]
        except Exception:
            db.rollback()
            invs = []

    return [i.to_dict() for i in invs]

class InvoicePDF(FPDF):
    def header(self):
        self.set_fill_color(15, 32, 56)
        self.rect(0, 0, 210, 38, 'F')
        self.set_draw_color(201, 168, 76)
        self.set_line_width(1.5)
        self.line(0, 38, 210, 38)
        
        self.set_text_color(255, 255, 255)
        self.set_font('Helvetica', 'B', 20)
        self.set_xy(14, 10)
        self.cell(100, 10, 'ARAVANTA CLOUDOS', new_x=XPos.RIGHT, new_y=YPos.TOP)
        
        self.set_text_color(201, 168, 76)
        self.set_font('Helvetica', 'B', 18)
        self.set_xy(110, 10)
        self.cell(86, 10, 'TAX INVOICE', align='R', new_x=XPos.LMARGIN, new_y=YPos.NEXT)
        
        self.set_text_color(180, 200, 230)
        self.set_font('Helvetica', '', 8)
        self.set_xy(14, 22)
        self.cell(100, 5, 'Enterprise Cloud Infrastructure Platform', new_x=XPos.RIGHT, new_y=YPos.TOP)
        
        self.set_xy(110, 22)
        self.cell(86, 5, 'Original for Recipient (GST Compliant)', align='R', new_x=XPos.LMARGIN, new_y=YPos.NEXT)
        self.ln(18)

    def footer(self):
        self.set_y(-25)
        self.set_draw_color(226, 232, 240)
        self.set_line_width(0.5)
        self.line(14, self.get_y(), 196, self.get_y())
        
        self.set_y(-20)
        self.set_font('Helvetica', '', 7)
        self.set_text_color(148, 163, 184)
        self.cell(0, 4, 'This is an authorized computer-generated tax invoice and requires no physical signature.', new_x=XPos.LMARGIN, new_y=YPos.NEXT)
        self.cell(0, 4, 'Aravanta CloudOS Inc. - CIN: U72200MH2026PTC000001 - support@aravanta.cloud', new_x=XPos.LMARGIN, new_y=YPos.NEXT)
        now_utc = datetime.utcnow().strftime("%d %b %Y %H:%M UTC")
        self.cell(0, 4, f'Digitally signed & verified by Aravanta FinOps Engine on {now_utc}', new_x=XPos.LMARGIN, new_y=YPos.NEXT)

def generate_invoice_pdf_bytes(inv: InvoiceRecord, user_email: str, user_name: str, ws_id: str) -> bytes:
    pdf = InvoicePDF('P', 'mm', 'A4')
    pdf.set_auto_page_break(auto=True, margin=30)
    pdf.add_page()
    
    # Metadata Box
    pdf.set_fill_color(248, 250, 252)
    pdf.set_draw_color(226, 232, 240)
    pdf.rect(14, 45, 182, 32, 'DF')
    
    pdf.set_xy(18, 48)
    pdf.set_font('Helvetica', 'B', 8)
    pdf.set_text_color(100, 116, 139)
    pdf.cell(80, 4, 'INVOICE NUMBER', new_x=XPos.LMARGIN, new_y=YPos.NEXT)
    pdf.set_x(18)
    pdf.set_font('Helvetica', 'B', 11)
    pdf.set_text_color(15, 23, 42)
    pdf.cell(80, 6, inv.id, new_x=XPos.LMARGIN, new_y=YPos.NEXT)
    
    pdf.set_x(18)
    pdf.set_font('Helvetica', 'B', 8)
    pdf.set_text_color(100, 116, 139)
    pdf.cell(80, 4, 'BILLING PERIOD', new_x=XPos.LMARGIN, new_y=YPos.NEXT)
    pdf.set_x(18)
    pdf.set_font('Helvetica', '', 9)
    pdf.set_text_color(15, 23, 42)
    pdf.cell(80, 5, inv.period or 'Cloud Subscription', new_x=XPos.LMARGIN, new_y=YPos.NEXT)
    
    pdf.set_xy(110, 48)
    pdf.set_font('Helvetica', 'B', 8)
    pdf.set_text_color(100, 116, 139)
    pdf.cell(80, 4, 'INVOICE DATE', new_x=XPos.LMARGIN, new_y=YPos.NEXT)
    pdf.set_x(110)
    pdf.set_font('Helvetica', 'B', 9)
    pdf.set_text_color(15, 23, 42)
    pdf.cell(80, 6, inv.date or datetime.utcnow().strftime('%Y-%m-%d'), new_x=XPos.LMARGIN, new_y=YPos.NEXT)
    
    pdf.set_x(110)
    pdf.set_font('Helvetica', 'B', 8)
    pdf.set_text_color(100, 116, 139)
    pdf.cell(80, 4, 'GSTIN / SAC CODE', new_x=XPos.LMARGIN, new_y=YPos.NEXT)
    pdf.set_x(110)
    pdf.set_font('Helvetica', '', 9)
    pdf.set_text_color(15, 23, 42)
    pdf.cell(80, 5, '27AAAAA0000A1Z5 (SAC 998313)', new_x=XPos.LMARGIN, new_y=YPos.NEXT)
    
    # Bill To Box
    pdf.ln(12)
    pdf.set_fill_color(240, 246, 255)
    pdf.rect(14, 82, 182, 22, 'DF')
    pdf.set_xy(18, 85)
    pdf.set_font('Helvetica', 'B', 8)
    pdf.set_text_color(37, 99, 235)
    pdf.cell(30, 5, 'BILLED TO:', new_x=XPos.RIGHT, new_y=YPos.TOP)
    pdf.set_font('Helvetica', 'B', 9)
    pdf.set_text_color(15, 23, 42)
    pdf.cell(100, 5, f"{user_name} ({user_email})", new_x=XPos.LMARGIN, new_y=YPos.NEXT)
    pdf.set_x(48)
    pdf.set_font('Helvetica', '', 8)
    pdf.set_text_color(100, 116, 139)
    pdf.cell(100, 5, f"Workspace Cluster: {ws_id} - Region: ap-south-1 (Mumbai)", new_x=XPos.LMARGIN, new_y=YPos.NEXT)
    
    # Items Table Header
    pdf.ln(12)
    pdf.set_xy(14, 110)
    pdf.set_fill_color(15, 32, 56)
    pdf.set_text_color(255, 255, 255)
    pdf.set_font('Helvetica', 'B', 8)
    pdf.cell(15, 8, '#', 0, 0, 'C', True)
    pdf.cell(97, 8, 'Service Description', 0, 0, 'L', True)
    pdf.cell(15, 8, 'Qty', 0, 0, 'C', True)
    pdf.cell(25, 8, 'Unit Price', 0, 0, 'R', True)
    pdf.cell(30, 8, 'Amount (INR)', 0, 1, 'R', True)
    
    # Calculations
    amount_inr = float(inv.amount_inr or 2499.0)
    subtotal = round(amount_inr / 1.18, 2)
    tax = round(amount_inr - subtotal, 2)
    cgst = round(tax / 2, 2)
    sgst = round(tax - cgst, 2)
    
    pdf.set_fill_color(255, 255, 255)
    pdf.set_text_color(15, 23, 42)
    pdf.set_font('Helvetica', '', 8)
    pdf.cell(15, 8, '1', 'B', 0, 'C', True)
    pdf.cell(97, 8, f'Aravanta CloudOS Subscription - {inv.period}', 'B', 0, 'L', True)
    pdf.cell(15, 8, '1', 'B', 0, 'C', True)
    pdf.cell(25, 8, f'Rs. {subtotal:,.2f}', 'B', 0, 'R', True)
    pdf.cell(30, 8, f'Rs. {subtotal:,.2f}', 'B', 1, 'R', True)
    
    # Totals
    pdf.ln(4)
    totals_x = 120
    pdf.set_x(totals_x)
    pdf.set_font('Helvetica', '', 8)
    pdf.set_text_color(100, 116, 139)
    pdf.cell(40, 5, 'Subtotal:', 0, 0, 'L')
    pdf.set_text_color(15, 23, 42)
    pdf.set_font('Helvetica', 'B', 8)
    pdf.cell(36, 5, f'Rs. {subtotal:,.2f}', 0, 1, 'R')
    
    pdf.set_x(totals_x)
    pdf.set_font('Helvetica', '', 8)
    pdf.set_text_color(100, 116, 139)
    pdf.cell(40, 5, 'CGST (9%):', 0, 0, 'L')
    pdf.set_text_color(15, 23, 42)
    pdf.cell(36, 5, f'Rs. {cgst:,.2f}', 0, 1, 'R')
    
    pdf.set_x(totals_x)
    pdf.set_font('Helvetica', '', 8)
    pdf.set_text_color(100, 116, 139)
    pdf.cell(40, 5, 'SGST (9%):', 0, 0, 'L')
    pdf.set_text_color(15, 23, 42)
    pdf.cell(36, 5, f'Rs. {sgst:,.2f}', 0, 1, 'R')
    
    # Total Box
    pdf.ln(2)
    pdf.set_x(totals_x - 5)
    pdf.set_fill_color(15, 32, 56)
    pdf.rect(totals_x - 5, pdf.get_y(), 81, 10, 'F')
    pdf.set_xy(totals_x, pdf.get_y() + 1.5)
    pdf.set_font('Helvetica', 'B', 9)
    pdf.set_text_color(201, 168, 76)
    pdf.cell(35, 6, 'GRAND TOTAL:', 0, 0, 'L')
    pdf.set_font('Helvetica', 'B', 11)
    pdf.set_text_color(255, 255, 255)
    pdf.cell(36, 6, f'Rs. {amount_inr:,.2f}', 0, 1, 'R')
    
    # Payment Confirmed Box
    pdf.ln(12)
    pdf.set_fill_color(236, 253, 245)
    pdf.set_draw_color(167, 243, 208)
    pdf.rect(14, pdf.get_y(), 182, 18, 'DF')
    pdf.set_xy(18, pdf.get_y() + 3)
    pdf.set_font('Helvetica', 'B', 9)
    pdf.set_text_color(5, 150, 105)
    pdf.cell(100, 4, '[PAID] Payment Verified & Settled via Primary Mandate', new_x=XPos.LMARGIN, new_y=YPos.NEXT)
    pdf.set_x(18)
    pdf.set_font('Helvetica', '', 8)
    pdf.set_text_color(71, 85, 105)
    pdf.cell(100, 5, f'Transaction ID: TXN-{inv.id.replace("INV-", "")} - Payment Method: {inv.payment_method or "Primary Mandate"}', new_x=XPos.LMARGIN, new_y=YPos.NEXT)
    
    return bytes(pdf.output())

@router.get("/billing/invoices/{invoice_id}/pdf", summary="Download official tax invoice PDF")
def download_invoice_pdf(
    invoice_id: str,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user_optional),
):
    inv = db.query(InvoiceRecord).filter(
        or_(
            InvoiceRecord.id == invoice_id,
            func.lower(InvoiceRecord.id) == invoice_id.lower()
        )
    ).first()
    
    if not inv:
        raise HTTPException(status_code=404, detail="Invoice record not found")
        
    user_email = current_user.email if current_user else "developer@aravanta.cloud"
    user_name = current_user.full_name if current_user else "Aravanta Cloud Developer"
    ws_id = inv.workspace_id or (current_user.workspace_id if current_user else "ws-enterprise-default")
    
    try:
        pdf_content = generate_invoice_pdf_bytes(inv, user_email, user_name, ws_id)
        return Response(
            content=pdf_content,
            media_type="application/pdf",
            headers={
                "Content-Disposition": f"attachment; filename=Aravanta_Invoice_{inv.id}.pdf",
                "Cache-Control": "no-cache"
            }
        )
    except Exception as e:
        html = f"""<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Invoice {inv.id} - Aravanta CloudOS</title>
  <style>
    body {{ font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 40px; color: #0f172a; }}
    .header {{ background: #0f2038; color: white; padding: 24px; border-radius: 8px; display: flex; justify-content: space-between; }}
    .gold {{ color: #c9a84c; }}
    .box {{ background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px; margin: 20px 0; }}
    table {{ width: 100%; border-collapse: collapse; margin: 20px 0; }}
    th {{ background: #0f2038; color: white; padding: 10px; text-align: left; font-size: 12px; }}
    td {{ padding: 12px 10px; border-bottom: 1px solid #e2e8f0; font-size: 13px; }}
    .total-box {{ background: #0f2038; color: white; padding: 12px; border-radius: 6px; float: right; width: 280px; text-align: right; }}
    @media print {{ .no-print {{ display: none; }} }}
  </style>
</head>
<body>
  <div class="no-print" style="margin-bottom: 20px;">
    <button onclick="window.print()" style="background: #2563eb; color: white; border: none; padding: 8px 16px; border-radius: 6px; font-weight: bold; cursor: pointer;">Print / Save as PDF</button>
  </div>
  <div class="header">
    <div>
      <h1 style="margin: 0; font-size: 24px;">ARAVANTA CLOUDOS</h1>
      <p style="margin: 4px 0 0; font-size: 12px; color: #94a3b8;">Enterprise Cloud Infrastructure Platform</p>
    </div>
    <div style="text-align: right;">
      <h2 class="gold" style="margin: 0; font-size: 22px;">TAX INVOICE</h2>
      <p style="margin: 4px 0 0; font-size: 11px; color: #94a3b8;">Original for Recipient</p>
    </div>
  </div>
  <div class="box" style="display: flex; justify-content: space-between;">
    <div>
      <div style="font-size: 10px; color: #64748b; font-weight: bold;">INVOICE NUMBER</div>
      <div style="font-size: 16px; font-weight: bold;">{inv.id}</div>
      <div style="font-size: 10px; color: #64748b; font-weight: bold; margin-top: 8px;">BILLING PERIOD</div>
      <div style="font-size: 13px;">{inv.period}</div>
    </div>
    <div style="text-align: right;">
      <div style="font-size: 10px; color: #64748b; font-weight: bold;">INVOICE DATE</div>
      <div style="font-size: 14px; font-weight: bold;">{inv.date}</div>
      <div style="font-size: 10px; color: #64748b; font-weight: bold; margin-top: 8px;">GSTIN / SAC</div>
      <div style="font-size: 13px;">27AAAAA0000A1Z5 (SAC 998313)</div>
    </div>
  </div>
  <table>
    <thead>
      <tr><th>#</th><th>Description</th><th>Qty</th><th style="text-align: right;">Amount (INR)</th></tr>
    </thead>
    <tbody>
      <tr><td>1</td><td>Aravanta CloudOS Subscription — {inv.period}</td><td>1</td><td style="text-align: right;">Rs. {inv.amount_inr:,.2f}</td></tr>
    </tbody>
  </table>
  <div class="total-box">
    <div style="font-size: 11px; color: #c9a84c; font-weight: bold;">GRAND TOTAL (INCL. GST)</div>
    <div style="font-size: 20px; font-weight: bold; margin-top: 4px;">Rs. {inv.amount_inr:,.2f}</div>
  </div>
</body>
</html>"""
        return Response(content=html, media_type="text/html")

@router.get("/billing/invoices/{invoice_id}", summary="Get invoice details")
def get_invoice_details(
    invoice_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(["SuperAdmin", "Admin", "Operator", "Developer"])),
):
    inv = db.query(InvoiceRecord).filter(
        or_(
            InvoiceRecord.id == invoice_id,
            func.lower(InvoiceRecord.id) == invoice_id.lower()
        )
    ).first()
    if not inv:
        raise HTTPException(status_code=404, detail="Invoice record not found")
    return inv.to_dict()

@router.get("/billing/payment-methods", summary="List saved payment methods")
def list_payment_methods(
    workspace_id: Optional[str] = Header(None, alias="x-workspace-id"),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(["SuperAdmin", "Admin", "Operator", "Developer"])),
):
    ws_id = current_user.workspace_id or workspace_id or "default"
    pms = db.query(PaymentMethodRecord).filter(
        (PaymentMethodRecord.user_id == current_user.id) | (PaymentMethodRecord.workspace_id == ws_id)
    ).order_by(PaymentMethodRecord.created_at.desc()).all()

    if not pms:
        # Seed initial default payment method in PostgreSQL
        default_pm = PaymentMethodRecord(
            id=f"pm_card_{uuid.uuid4().hex[:8]}",
            user_id=current_user.id,
            workspace_id=ws_id,
            brand="visa",
            last4="4242",
            exp_month=12,
            exp_year=2028,
            holder_name=current_user.full_name or "Workspace Admin",
            is_default=True,
            created_at=datetime.utcnow()
        )
        try:
            db.add(default_pm)
            db.commit()
            db.refresh(default_pm)
            pms = [default_pm]
        except Exception:
            db.rollback()
            pms = []

    return [p.to_dict() for p in pms]

@router.post("/billing/payment-methods", status_code=status.HTTP_201_CREATED, summary="Add payment method")
def add_payment_method(
    body: PaymentMethodAdd,
    workspace_id: Optional[str] = Header(None, alias="x-workspace-id"),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(["SuperAdmin", "Admin", "Operator", "Developer"])),
):
    ws_id = current_user.workspace_id or workspace_id or "default"
    pm_id = f"pm_card_{uuid.uuid4().hex[:8]}"
    
    if body.set_as_default:
        db.query(PaymentMethodRecord).filter(
            (PaymentMethodRecord.user_id == current_user.id) | (PaymentMethodRecord.workspace_id == ws_id)
        ).update({"is_default": False})

    new_pm = PaymentMethodRecord(
        id=pm_id,
        user_id=current_user.id,
        workspace_id=ws_id,
        brand=body.brand.lower(),
        last4=body.last4[-4:],
        exp_month=body.exp_month,
        exp_year=body.exp_year,
        holder_name=body.holder_name,
        is_default=body.set_as_default,
        created_at=datetime.utcnow()
    )
    db.add(new_pm)
    db.commit()
    db.refresh(new_pm)

    emit_notification(
        db,
        title="Payment Method Added",
        message=f"{body.brand.upper()} ending in {body.last4[-4:]} registered successfully.",
        severity="INFO",
        source="ArvBilling",
        user_id=current_user.id,
        workspace_id=ws_id,
    )

    return new_pm.to_dict()

@router.delete("/billing/payment-methods/{pm_id}", summary="Remove payment method")
def remove_payment_method(
    pm_id: str, 
    workspace_id: Optional[str] = Header(None, alias="x-workspace-id"),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(["SuperAdmin", "Admin", "Operator", "Developer"])),
):
    ws_id = current_user.workspace_id or workspace_id or "default"
    db.query(PaymentMethodRecord).filter(
        PaymentMethodRecord.id == pm_id,
        (PaymentMethodRecord.user_id == current_user.id) | (PaymentMethodRecord.workspace_id == ws_id)
    ).delete()
    db.commit()
    return {"message": "Payment method removed successfully."}

@router.post("/billing/payment-methods/{pm_id}/default", summary="Set default payment method")
def set_default_payment_method(
    pm_id: str, 
    workspace_id: Optional[str] = Header(None, alias="x-workspace-id"),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(["SuperAdmin", "Admin", "Operator", "Developer"])),
):
    ws_id = current_user.workspace_id or workspace_id or "default"
    db.query(PaymentMethodRecord).filter(
        (PaymentMethodRecord.user_id == current_user.id) | (PaymentMethodRecord.workspace_id == ws_id)
    ).update({"is_default": False})

    target = db.query(PaymentMethodRecord).filter(
        PaymentMethodRecord.id == pm_id,
        (PaymentMethodRecord.user_id == current_user.id) | (PaymentMethodRecord.workspace_id == ws_id)
    ).first()
    if not target:
        raise HTTPException(status_code=404, detail="Payment method not found")

    target.is_default = True
    db.commit()
    return {"message": "Default payment method updated."}

@router.post("/billing/plan/change", summary="Upgrade or downgrade workspace subscription plan")
def change_subscription_plan(
    body: PlanChangeRequest,
    workspace_id: Optional[str] = Header(None, alias="x-workspace-id"),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(["SuperAdmin", "Admin", "Operator", "Developer"])),
):
    ws_id = current_user.workspace_id or workspace_id or "default"
    now = datetime.utcnow()
    plan_map = {
        "developer": {"name": "Developer Cloud Starter", "price": 499, "vcpu": 8, "ram": 16, "storage": 500},
        "team": {"name": "Team Cloud Operations", "price": 2499, "vcpu": 64, "ram": 128, "storage": 5000},
        "enterprise": {"name": "Dedicated Enterprise Control Plane", "price": 14999, "vcpu": 256, "ram": 512, "storage": 25000}
    }
    target = plan_map.get(body.plan_code.lower(), plan_map["team"])

    # Update in-memory workspace store
    ws = _get_workspace_store(workspace_id)
    ws["usage"]["plan_name"] = target["name"]
    ws["usage"]["plan_code"] = body.plan_code.lower()
    ws["usage"]["price_inr"] = target["price"]
    ws["usage"]["metrics"]["vcpu_limit"] = target["vcpu"]
    ws["usage"]["metrics"]["ram_gb_limit"] = target["ram"]
    ws["usage"]["metrics"]["storage_gb_limit"] = target["storage"]

    # Generate persistent invoice in PostgreSQL
    inv_id = f"INV-{now.strftime('%Y%m%d')}-{uuid.uuid4().hex[:4].upper()}"
    new_inv = InvoiceRecord(
        id=inv_id,
        user_id=current_user.id,
        workspace_id=ws_id,
        period=f"{target['name']} Upgrade",
        amount_inr=float(target["price"]),
        amount_usd=round(target["price"] / 83.0, 2),
        status="PAID",
        payment_method="Primary Card",
        date=now.strftime("%Y-%m-%d"),
        download_url=f"/api/v1/operations/billing/invoices/{inv_id}/pdf",
        created_at=now
    )
    db.add(new_inv)
    db.commit()

    emit_notification(
        db,
        title="Subscription Upgraded",
        message=f"Workspace upgraded to {target['name']} (₹{target['price']}/mo).",
        type="success",
        user_id=current_user.id,
        workspace_id=ws_id,
    )

    return {
        "message": f"Plan updated to {target['name']}",
        "usage": ws["usage"],
        "invoice": new_inv.to_dict()
    }

