"""
Aravanta CloudOS — ArvOperations Service Router
Unified Cloud Operations, Developer Platform, SRE Observability, Incident Management & Automation Engine.
"""
import uuid
import random
import hashlib
from datetime import datetime, timedelta
from typing import Optional, List, Dict, Any
from fastapi import APIRouter, HTTPException, Query, status
from pydantic import BaseModel, Field

router = APIRouter(prefix="/api/v1/operations", tags=["ArvOperations — Cloud Platform Operations"])

# ─────────────────────────────────────────────────────────────────────────────
# In-Memory Operational Store
# ─────────────────────────────────────────────────────────────────────────────

ENVIRONMENTS = ["production", "staging", "development"]
REGIONS = ["arv-us-east-1", "arv-us-west-2", "arv-eu-west-1", "arv-ap-south-1"]
STRATEGIES = ["RollingUpdate", "Canary", "BlueGreen"]

# ── 1. Applications Store ────────────────────────────────────────────────────
_applications: dict[str, dict] = {}
_seed_apps = [
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
        "created_at": (datetime.utcnow() - timedelta(days=120)).isoformat() + "Z",
        "last_deployed_at": (datetime.utcnow() - timedelta(hours=6)).isoformat() + "Z",
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
        "created_at": (datetime.utcnow() - timedelta(days=90)).isoformat() + "Z",
        "last_deployed_at": (datetime.utcnow() - timedelta(days=2)).isoformat() + "Z",
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
        "endpoints": ["https://arv-frontend.vercel.app", "https://console.aravanta.cloud"],
        "ports": [3000, 80],
        "created_at": (datetime.utcnow() - timedelta(days=100)).isoformat() + "Z",
        "last_deployed_at": (datetime.utcnow() - timedelta(hours=14)).isoformat() + "Z",
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
        "created_at": (datetime.utcnow() - timedelta(days=60)).isoformat() + "Z",
        "last_deployed_at": (datetime.utcnow() - timedelta(hours=3)).isoformat() + "Z",
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
        "created_at": (datetime.utcnow() - timedelta(days=45)).isoformat() + "Z",
        "last_deployed_at": (datetime.utcnow() - timedelta(hours=1)).isoformat() + "Z",
        "env_vars": {"STRIPE_SANDBOX": "true", "CURRENCY": "INR"},
    }
]

for app in _seed_apps:
    _applications[app["id"]] = app

# ── 2. Deployments Store ─────────────────────────────────────────────────────
_deployments: list[dict] = [
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
        "started_at": (datetime.utcnow() - timedelta(hours=6)).isoformat() + "Z",
        "finished_at": (datetime.utcnow() - timedelta(hours=5, minutes=57)).isoformat() + "Z",
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
        "started_at": (datetime.utcnow() - timedelta(hours=3, minutes=15)).isoformat() + "Z",
        "finished_at": (datetime.utcnow() - timedelta(hours=3, minutes=11)).isoformat() + "Z",
        "duration_seconds": 240,
        "error_reason": "Health check failed: OOMKilled on pod telemetry-engine-79bf2a (RAM limit 1500MB exceeded)",
        "steps": [
            {"name": "Build Container Image", "status": "COMPLETED", "duration": "50s"},
            {"name": "Deploy Canary Pods", "status": "COMPLETED", "duration": "40s"},
            {"name": "Synthetic Health Probes (Liveness/Readiness)", "status": "FAILED", "duration": "150s"},
        ]
    },
    {
        "id": "dep-8840",
        "application_id": "app-telemetry-engine",
        "application_name": "telemetry-engine",
        "environment": "production",
        "version": "v3.0.2",
        "previous_version": "v3.1.0",
        "image": "aravanta/telemetry-engine:v3.0.2",
        "strategy": "Rollback",
        "replicas": 2,
        "status": "ROLLED_BACK",
        "trigger": "automated rollback on health check failure",
        "commit_hash": "c4d817a",
        "commit_message": "rollback: auto-revert to stable release v3.0.2",
        "author": "Aravanta-SRE-Bot",
        "started_at": (datetime.utcnow() - timedelta(hours=3, minutes=10)).isoformat() + "Z",
        "finished_at": (datetime.utcnow() - timedelta(hours=3, minutes=8)).isoformat() + "Z",
        "duration_seconds": 120,
        "steps": [
            {"name": "Drain Traffic from Failing Canary", "status": "COMPLETED", "duration": "20s"},
            {"name": "Restore Previous Replicaset v3.0.2", "status": "COMPLETED", "duration": "60s"},
            {"name": "Verify Pod Telemetry & SRE SLOs", "status": "COMPLETED", "duration": "40s"},
        ]
    },
    {
        "id": "dep-8839",
        "application_id": "app-web-console",
        "application_name": "web-console",
        "environment": "production",
        "version": "v1.5.2",
        "previous_version": "v1.5.1",
        "image": "aravanta/web-console:v1.5.2",
        "strategy": "Canary",
        "replicas": 3,
        "status": "SUCCESSFUL",
        "trigger": "git push (main)",
        "commit_hash": "3e02c6b",
        "commit_message": "fix: responsive cross-platform header and layout fixes",
        "author": "yashbaviskar15",
        "started_at": (datetime.utcnow() - timedelta(hours=14)).isoformat() + "Z",
        "finished_at": (datetime.utcnow() - timedelta(hours=13, minutes=58)).isoformat() + "Z",
        "duration_seconds": 120,
        "steps": [
            {"name": "Vite Production Build", "status": "COMPLETED", "duration": "60s"},
            {"name": "Upload Static Assets to CDN Edge", "status": "COMPLETED", "duration": "30s"},
            {"name": "Warm Edge Cache", "status": "COMPLETED", "duration": "30s"},
        ]
    }
]

# ── 3. Containers Store ──────────────────────────────────────────────────────
_containers: list[dict] = [
    {"id": "ctr-api-gw-01", "name": "api-gateway-7b9f8-x4q2w", "app": "api-gateway", "image": "aravanta/api-gateway:v2.4.1", "node": "node-us-east-1a", "status": "RUNNING", "restarts": 0, "cpu_pct": 18.2, "ram_mb": 172, "uptime": "6h 24m", "ip": "10.244.1.42"},
    {"id": "ctr-api-gw-02", "name": "api-gateway-7b9f8-9kp7v", "app": "api-gateway", "image": "aravanta/api-gateway:v2.4.1", "node": "node-us-east-1b", "status": "RUNNING", "restarts": 0, "cpu_pct": 21.5, "ram_mb": 168, "uptime": "6h 24m", "ip": "10.244.2.18"},
    {"id": "ctr-api-gw-03", "name": "api-gateway-7b9f8-m3d8l", "app": "api-gateway", "image": "aravanta/api-gateway:v2.4.1", "node": "node-us-east-1c", "status": "RUNNING", "restarts": 0, "cpu_pct": 19.8, "ram_mb": 170, "uptime": "6h 24m", "ip": "10.244.3.91"},
    {"id": "ctr-api-gw-04", "name": "api-gateway-7b9f8-zz21b", "app": "api-gateway", "image": "aravanta/api-gateway:v2.4.1", "node": "node-us-east-1a", "status": "RUNNING", "restarts": 0, "cpu_pct": 16.0, "ram_mb": 170, "uptime": "6h 24m", "ip": "10.244.1.45"},
    {"id": "ctr-auth-01", "name": "auth-service-58dc7-28nvd", "app": "auth-service", "image": "aravanta/auth-service:v1.9.0", "node": "node-us-east-1a", "status": "RUNNING", "restarts": 0, "cpu_pct": 12.4, "ram_mb": 140, "uptime": "2d 4h", "ip": "10.244.1.50"},
    {"id": "ctr-auth-02", "name": "auth-service-58dc7-pl01a", "app": "auth-service", "image": "aravanta/auth-service:v1.9.0", "node": "node-us-east-1b", "status": "RUNNING", "restarts": 0, "cpu_pct": 14.1, "ram_mb": 138, "uptime": "2d 4h", "ip": "10.244.2.62"},
    {"id": "ctr-auth-03", "name": "auth-service-58dc7-ff89c", "app": "auth-service", "image": "aravanta/auth-service:v1.9.0", "node": "node-us-east-1c", "status": "RUNNING", "restarts": 0, "cpu_pct": 11.8, "ram_mb": 142, "uptime": "2d 4h", "ip": "10.244.3.11"},
    {"id": "ctr-telem-01", "name": "telemetry-engine-79bf2a-x9m2", "app": "telemetry-engine", "image": "aravanta/telemetry-engine:v3.1.0", "node": "node-us-east-1b", "status": "CRASHLOOPBACKOFF", "restarts": 4, "cpu_pct": 89.0, "ram_mb": 1480, "uptime": "14m", "ip": "10.244.2.99"},
    {"id": "ctr-telem-02", "name": "telemetry-engine-79bf2a-4k11", "app": "telemetry-engine", "image": "aravanta/telemetry-engine:v3.0.2", "node": "node-us-east-1c", "status": "RUNNING", "restarts": 0, "cpu_pct": 45.2, "ram_mb": 620, "uptime": "3h 8m", "ip": "10.244.3.55"},
    {"id": "ctr-db-pg-01", "name": "postgres-primary-stateful-0", "app": "aravanta-core-db", "image": "postgres:16.2-alpine", "node": "node-us-east-1a", "status": "RUNNING", "restarts": 0, "cpu_pct": 34.8, "ram_mb": 1840, "uptime": "42d 12h", "ip": "10.244.1.10"},
    {"id": "ctr-redis-01", "name": "redis-cluster-cache-0", "app": "redis-cache", "image": "redis:7.2-alpine", "node": "node-us-east-1b", "status": "RUNNING", "restarts": 0, "cpu_pct": 8.5, "ram_mb": 512, "uptime": "42d 12h", "ip": "10.244.2.10"},
]

# ── 4. Incidents Store ───────────────────────────────────────────────────────
_incidents: list[dict] = [
    {
        "id": "inc-1042",
        "number": "INC-1042",
        "title": "Database Connection Pool Saturation & Query Latency Spike",
        "severity": "P1 - Critical",
        "status": "Mitigating",
        "affected_services": ["ArvDB (PostgreSQL)", "api-gateway", "auth-service"],
        "detected_at": (datetime.utcnow() - timedelta(minutes=45)).isoformat() + "Z",
        "resolved_at": None,
        "commander": "Yash Baviskar (Lead SRE)",
        "summary": "Connection pool reached 92% capacity (184/200 conns) triggering HTTP 504 Gateway Timeouts across API endpoints.",
        "root_cause": "Unindexed slow analytical query executed by nightly billing summary task blocking active connection pool slots.",
        "timeline": [
            {"time": "18:15:00 UTC", "author": "ArvWatch Alertmanager", "note": "Triggered alert: DB Connection Pool Utilization > 90%", "type": "ALERT"},
            {"time": "18:18:30 UTC", "author": "Yash Baviskar", "note": "Declared P1 incident, initiated bridge with platform team", "type": "ACTION"},
            {"time": "18:24:00 UTC", "author": "Yash Baviskar", "note": "Identified slow PID 14892 blocking tables. Terminated rogue queries via pg_terminate_backend.", "type": "MITIGATION"},
            {"time": "18:35:00 UTC", "author": "Yash Baviskar", "note": "Scaled max_connections from 200 -> 350 and verified pool recovery to 22%", "type": "VERIFICATION"},
        ],
        "related_alerts": ["Database connection pool saturating", "High API P95 Latency > 500ms"]
    },
    {
        "id": "inc-1041",
        "number": "INC-1041",
        "title": "Pod CrashLoopBackOff on Telemetry Engine Canary Release",
        "severity": "P2 - Major",
        "status": "Resolved",
        "affected_services": ["telemetry-engine", "ArvKube"],
        "detected_at": (datetime.utcnow() - timedelta(hours=3, minutes=15)).isoformat() + "Z",
        "resolved_at": (datetime.utcnow() - timedelta(hours=3, minutes=8)).isoformat() + "Z",
        "commander": "Yash Baviskar (DevOps)",
        "summary": "Canary deployment v3.1.0 hit OOMKilled condition immediately after receiving 25% traffic share.",
        "root_cause": "Buffer allocation increased by 10x without raising pod memory limits in Helm values (remained at 1.5Gi).",
        "timeline": [
            {"time": "15:45:00 UTC", "author": "CI/CD Pipeline", "note": "Deployment dep-8841 failed health check probe", "type": "ALERT"},
            {"time": "15:46:10 UTC", "author": "ArvOperations SRE-Bot", "note": "Automated zero-downtime rollback initiated to stable release v3.0.2", "type": "ACTION"},
            {"time": "15:52:00 UTC", "author": "Yash Baviskar", "note": "Rollback verified, all pods Running with 0 restarts. Hotfix PR created for memory limits.", "type": "RESOLUTION"},
        ],
        "related_alerts": ["Pod CrashLoopBackOff detected"]
    },
    {
        "id": "inc-1040",
        "number": "INC-1040",
        "title": "SSL Certificate Expiry Warning on Edge Ingress",
        "severity": "P3 - Minor",
        "status": "Resolved",
        "affected_services": ["ArvEdge", "cloudos.aravanta.cloud"],
        "detected_at": (datetime.utcnow() - timedelta(days=1)).isoformat() + "Z",
        "resolved_at": (datetime.utcnow() - timedelta(hours=22)).isoformat() + "Z",
        "commander": "Yash Baviskar",
        "summary": "Let's Encrypt automated cert-manager renewal failed due to DNS challenge rate limit.",
        "root_cause": "DNS-01 webhook credentials rotated without updating cert-manager Secret.",
        "timeline": [
            {"time": "Yesterday", "author": "ArvWatch", "note": "Certificate renewal alert triggered (14 days remaining)", "type": "ALERT"},
            {"time": "Yesterday", "author": "Yash Baviskar", "note": "Updated cert-manager API token secret and forced manual certificate request", "type": "ACTION"},
            {"time": "Yesterday", "author": "cert-manager", "note": "New TLS certificate successfully issued for 90 days", "type": "RESOLUTION"},
        ],
        "related_alerts": ["SSL certificate expiring soon"]
    }
]

# ── 5. Automation Runbooks Store ─────────────────────────────────────────────
_workflows: list[dict] = [
    {
        "id": "wf-01",
        "name": "Rolling Service Restart & Cache Purge",
        "description": "Performs zero-downtime rolling restart of microservice pods and flushes associated Redis cache namespaces.",
        "trigger": "Manual / Webhook",
        "target": "api-gateway, auth-service",
        "status": "ACTIVE",
        "last_run": (datetime.utcnow() - timedelta(hours=6)).isoformat() + "Z",
        "last_status": "SUCCESS",
        "duration": "1m 45s",
        "run_count": 84,
        "actions": ["Drain pod traffic", "Restart pod", "Await ReadinessProbe", "Flush redis key prefix 'sess:*'"]
    },
    {
        "id": "wf-02",
        "name": "Nightly Automated Database Snapshot & S3 Sync",
        "description": "Executes pg_dump backup of production databases, applies Gzip compression, and syncs encrypted snapshot to secondary region S3.",
        "trigger": "Cron (0 2 * * *)",
        "target": "aravanta-core-db",
        "status": "ACTIVE",
        "last_run": (datetime.utcnow() - timedelta(hours=16)).isoformat() + "Z",
        "last_status": "SUCCESS",
        "duration": "4m 12s",
        "run_count": 312,
        "actions": ["Create DB snapshot", "Verify SHA-256 checksum", "Sync to s3://aravanta-backups-dr", "Expire snapshots > 30d"]
    },
    {
        "id": "wf-03",
        "name": "Auto-Scale Worker Nodes on CPU Pressure",
        "description": "Monitors node pool CPU threshold (> 80% for 5m). Automatically provisions +2 compute worker instances and joins K8s cluster.",
        "trigger": "Alertmanager Webhook",
        "target": "aravanta-prod cluster",
        "status": "ACTIVE",
        "last_run": (datetime.utcnow() - timedelta(days=2)).isoformat() + "Z",
        "last_status": "SUCCESS",
        "duration": "3m 30s",
        "run_count": 27,
        "actions": ["Evaluate cluster headroom", "Request ArvCompute instances", "Execute kubeadm join", "Cordon old nodes if scaled down"]
    },
    {
        "id": "wf-04",
        "name": "Ephemeral Resource & Disk Garbage Collection",
        "description": "Prunes untagged Docker images, dangling volumes, and completed Kubernetes jobs older than 7 days.",
        "trigger": "Cron (0 4 * * 0)",
        "target": "All Cluster Nodes",
        "status": "ACTIVE",
        "last_run": (datetime.utcnow() - timedelta(days=3)).isoformat() + "Z",
        "last_status": "SUCCESS",
        "duration": "2m 10s",
        "run_count": 52,
        "actions": ["Docker system prune -f", "Delete completed jobs", "Clean /tmp scratch disks"]
    }
]

# ── 6. Backups Store ─────────────────────────────────────────────────────────
_backups: list[dict] = [
    {
        "id": "bsp-1092",
        "name": "pg-core-db-snapshot-daily-2026-09-01",
        "resource_type": "database",
        "resource_name": "aravanta-core-db (PostgreSQL 16)",
        "size_mb": 4820,
        "status": "COMPLETED",
        "created_at": (datetime.utcnow() - timedelta(hours=16)).isoformat() + "Z",
        "retention_days": 30,
        "restore_point": "2026-09-01T02:00:00Z",
        "region": "arv-us-east-1",
        "encryption": "AES-256-GCM"
    },
    {
        "id": "bsp-1091",
        "name": "k8s-cluster-state-etcd-2026-09-01",
        "resource_type": "cluster_state",
        "resource_name": "aravanta-prod (etcd Snapshot)",
        "size_mb": 145,
        "status": "COMPLETED",
        "created_at": (datetime.utcnow() - timedelta(hours=18)).isoformat() + "Z",
        "retention_days": 14,
        "restore_point": "2026-09-01T00:30:00Z",
        "region": "arv-us-east-1",
        "encryption": "AES-256-GCM"
    },
    {
        "id": "bsp-1090",
        "name": "s3-assets-dr-replication-2026-08-31",
        "resource_type": "storage_bucket",
        "resource_name": "aravanta-assets-prod",
        "size_mb": 128400,
        "status": "COMPLETED",
        "created_at": (datetime.utcnow() - timedelta(days=1)).isoformat() + "Z",
        "retention_days": 90,
        "restore_point": "2026-08-31T23:59:00Z",
        "region": "arv-us-west-2",
        "encryption": "KMS-Customer-Managed"
    },
    {
        "id": "bsp-1089",
        "name": "redis-cache-dump-2026-08-31",
        "resource_type": "cache",
        "resource_name": "redis-cluster-cache",
        "size_mb": 820,
        "status": "COMPLETED",
        "created_at": (datetime.utcnow() - timedelta(days=1)).isoformat() + "Z",
        "retention_days": 7,
        "restore_point": "2026-08-31T22:00:00Z",
        "region": "arv-us-east-1",
        "encryption": "AES-256-GCM"
    }
]

# ── 7. Seed Operational Logs Generator ────────────────────────────────────────
_LOG_SERVICES = ["api-gateway", "auth-service", "telemetry-engine", "web-console", "postgres-primary", "k8s-scheduler"]
_LOG_TEMPLATES = {
    "INFO": [
        "HTTP {method} {path} completed in {ms}ms with status 200 OK",
        "JWT token validated for subject {email} with role {role}",
        "Heartbeat health check passed across all {count} worker nodes",
        "Prometheus metrics scraped: {count} timeseries ingested",
        "TLS handshake successful from client {ip}",
        "Worker thread pool idle: 32/32 threads available"
    ],
    "WARN": [
        "Database query duration {ms}ms exceeded 100ms threshold for {path}",
        "High memory allocation detected on worker node {node} (usage at 82%)",
        "Client rate limit approaching threshold (95/100 req/min) for IP {ip}",
        "Connection pool active count elevated: 165/200 connections in use",
        "SSL certificate expiry warning: 14 days remaining for domain {domain}"
    ],
    "ERROR": [
        "HTTP 504 Gateway Timeout connecting to upstream upstream-{svc}:5432",
        "PostgresConnectionException: connection refused on host 10.244.1.10:5432",
        "OOMKilled: container exceeded memory limit of 1536MiB on pod {pod}",
        "Failed to verify webhook HMAC signature from trigger source {src}",
        "Readiness probe failed for container {ctr}: connection refused on port 8080"
    ],
    "DEBUG": [
        "Cache hit for key 'sess:usr-01' from Redis in 0.8ms",
        "Goroutine count: 184 | Memory allocated: 48.2MB",
        "Ingress routing rule matched: path '/api/v1/*' -> service 'api-gateway:8000'",
        "Evaluating auto-scale horizontal pod autoscaler: current=4, desired=4"
    ]
}

def _generate_logs(count: int = 150) -> list[dict]:
    logs = []
    now = datetime.utcnow()
    for i in range(count):
        level = random.choices(["INFO", "INFO", "INFO", "WARN", "ERROR", "DEBUG"], weights=[50, 20, 15, 8, 4, 3])[0]
        svc = random.choice(_LOG_SERVICES)
        template = random.choice(_LOG_TEMPLATES[level])
        msg = template.format(
            method=random.choice(["GET", "POST", "PUT", "DELETE"]),
            path=random.choice(["/api/v1/auth/login", "/api/v1/compute/instances", "/api/v1/kubernetes/pods", "/api/v1/monitoring/metrics", "/api/v1/storage/objects"]),
            ms=round(random.uniform(2.5, 450.0), 1),
            email="developer@aravanta.cloud",
            role="SuperAdmin",
            count=random.randint(4, 50),
            ip=f"203.0.113.{random.randint(10, 250)}",
            node=f"node-us-east-1{random.choice(['a', 'b', 'c'])}",
            domain="arv-backend.vercel.app",
            svc=svc,
            pod=f"{svc}-7b9f8-{random.randint(100, 999)}",
            src="github-actions",
            ctr=f"ctr-{svc}-01"
        )
        ts = now - timedelta(seconds=(count - i) * random.randint(2, 45))
        logs.append({
            "id": f"log-{hashlib.md5(f'{i}-{ts.isoformat()}'.encode()).hexdigest()[:10]}",
            "timestamp": ts.isoformat() + "Z",
            "level": level,
            "service": svc,
            "container": f"{svc}-7b9f8",
            "message": msg,
            "environment": random.choice(["production", "production", "staging"])
        })
    return sorted(logs, key=lambda x: x["timestamp"], reverse=True)

_cached_logs = _generate_logs(200)

# ─────────────────────────────────────────────────────────────────────────────
# Request/Response Schemas
# ─────────────────────────────────────────────────────────────────────────────

class ScaleAppRequest(BaseModel):
    replicas: int = Field(..., ge=0, le=20)

class DeployAppRequest(BaseModel):
    version: str
    image: str
    environment: str = "production"
    strategy: str = "RollingUpdate"
    replicas: int = 3
    change_summary: str = "Production deployment release"

class RollbackRequest(BaseModel):
    target_version: Optional[str] = None
    reason: str = "Automated or operator initiated rollback"

class ContainerActionRequest(BaseModel):
    action: str = Field(..., description="start, stop, restart, terminate")

class CreateIncidentRequest(BaseModel):
    title: str
    severity: str = "P2 - Major"
    affected_services: List[str]
    summary: str
    commander: str = "Yash Baviskar"

class UpdateIncidentRequest(BaseModel):
    status: Optional[str] = None
    root_cause: Optional[str] = None
    summary: Optional[str] = None

class AddIncidentTimelineRequest(BaseModel):
    author: str
    note: str
    type: str = "NOTE"

class CreateBackupRequest(BaseModel):
    resource_type: str
    resource_name: str
    retention_days: int = 30

# ─────────────────────────────────────────────────────────────────────────────
# 1. Applications Endpoints
# ─────────────────────────────────────────────────────────────────────────────

@router.get("/applications")
def list_applications(environment: Optional[str] = None):
    apps = list(_applications.values())
    if environment:
        apps = [a for a in apps if a["environment"].lower() == environment.lower()]
    return apps

@router.get("/applications/{app_id}")
def get_application(app_id: str):
    if app_id not in _applications:
        raise HTTPException(status_code=404, detail="Application not found")
    app = _applications[app_id]
    recent_deps = [d for d in _deployments if d["application_id"] == app_id][:5]
    app_containers = [c for c in _containers if c["app"] == app["name"]]
    return {
        **app,
        "recent_deployments": recent_deps,
        "containers": app_containers,
        "events": [
            {"type": "Normal", "reason": "Scaled", "message": f"Successfully scaled to {app['replicas']} replicas", "timestamp": app["last_deployed_at"]},
            {"type": "Normal", "reason": "Healthy", "message": "All readiness and liveness probes passing", "timestamp": datetime.utcnow().isoformat() + "Z"}
        ]
    }

@router.post("/applications/{app_id}/scale")
def scale_application(app_id: str, req: ScaleAppRequest):
    if app_id not in _applications:
        raise HTTPException(status_code=404, detail="Application not found")
    app = _applications[app_id]
    app["replicas"] = req.replicas
    app["target_replicas"] = req.replicas
    app["last_deployed_at"] = datetime.utcnow().isoformat() + "Z"
    return {"message": f"Application {app['name']} scaled to {req.replicas} replicas", "application": app}

@router.post("/applications/{app_id}/restart")
def restart_application(app_id: str):
    if app_id not in _applications:
        raise HTTPException(status_code=404, detail="Application not found")
    app = _applications[app_id]
    app["status"] = "UPDATING"
    app["last_deployed_at"] = datetime.utcnow().isoformat() + "Z"
    dep_id = f"dep-{random.randint(8900, 9999)}"
    new_dep = {
        "id": dep_id,
        "application_id": app_id,
        "application_name": app["name"],
        "environment": app["environment"],
        "version": app["version"],
        "previous_version": app["version"],
        "image": app["image"],
        "strategy": "RollingRestart",
        "replicas": app["replicas"],
        "status": "SUCCESSFUL",
        "trigger": "operator rolling restart",
        "commit_hash": hashlib.md5(datetime.utcnow().isoformat().encode()).hexdigest()[:7],
        "commit_message": f"chore: rolling restart initiated for {app['name']}",
        "author": "Yash Baviskar",
        "started_at": datetime.utcnow().isoformat() + "Z",
        "finished_at": (datetime.utcnow() + timedelta(seconds=45)).isoformat() + "Z",
        "duration_seconds": 45,
        "steps": [
            {"name": "Drain Pod Traffic", "status": "COMPLETED", "duration": "15s"},
            {"name": "Rolling Pod Recreation", "status": "COMPLETED", "duration": "20s"},
            {"name": "Health Probe Verification", "status": "COMPLETED", "duration": "10s"},
        ]
    }
    _deployments.insert(0, new_dep)
    app["status"] = "HEALTHY"
    return {"message": f"Rolling restart completed for {app['name']}", "deployment": new_dep}

@router.post("/applications/{app_id}/rollback")
def rollback_application(app_id: str, req: RollbackRequest):
    if app_id not in _applications:
        raise HTTPException(status_code=404, detail="Application not found")
    app = _applications[app_id]
    target_ver = req.target_version or app.get("previous_version", "v1.0.0")
    old_curr = app["version"]
    
    app["version"] = target_ver
    app["previous_version"] = old_curr
    app["status"] = "HEALTHY"
    app["last_deployed_at"] = datetime.utcnow().isoformat() + "Z"
    
    dep_id = f"dep-{random.randint(8900, 9999)}"
    rollback_dep = {
        "id": dep_id,
        "application_id": app_id,
        "application_name": app["name"],
        "environment": app["environment"],
        "version": target_ver,
        "previous_version": old_curr,
        "image": f"aravanta/{app['name']}:{target_ver}",
        "strategy": "Rollback",
        "replicas": app["replicas"],
        "status": "ROLLED_BACK",
        "trigger": f"rollback: {req.reason}",
        "commit_hash": hashlib.md5(target_ver.encode()).hexdigest()[:7],
        "commit_message": f"rollback: reverted {app['name']} to stable release {target_ver}",
        "author": "Yash Baviskar",
        "started_at": datetime.utcnow().isoformat() + "Z",
        "finished_at": datetime.utcnow().isoformat() + "Z",
        "duration_seconds": 60,
        "steps": [
            {"name": "Stop Active Canary Traffic", "status": "COMPLETED", "duration": "10s"},
            {"name": f"Restore Deployment to {target_ver}", "status": "COMPLETED", "duration": "35s"},
            {"name": "Verify 0 Error Rate", "status": "COMPLETED", "duration": "15s"},
        ]
    }
    _deployments.insert(0, rollback_dep)
    return {"message": f"Application {app['name']} successfully rolled back to {target_ver}", "deployment": rollback_dep}

# ─────────────────────────────────────────────────────────────────────────────
# 2. Deployments Endpoints
# ─────────────────────────────────────────────────────────────────────────────

@router.get("/deployments")
def list_deployments(environment: Optional[str] = None, status: Optional[str] = None):
    deps = _deployments
    if environment:
        deps = [d for d in deps if d["environment"].lower() == environment.lower()]
    if status:
        deps = [d for d in deps if d["status"].lower() == status.lower()]
    return deps

@router.post("/deployments", status_code=status.HTTP_201_CREATED)
def trigger_deployment(req: DeployAppRequest):
    app_id = f"app-{req.version.replace('.', '-')}"
    for aid, a in _applications.items():
        if a["image"].split(":")[0] == req.image.split(":")[0]:
            app_id = aid
            break

    dep_id = f"dep-{random.randint(8900, 9999)}"
    new_dep = {
        "id": dep_id,
        "application_id": app_id,
        "application_name": req.image.split(":")[0].replace("aravanta/", ""),
        "environment": req.environment,
        "version": req.version,
        "previous_version": _applications.get(app_id, {}).get("version", "v1.0.0"),
        "image": req.image,
        "strategy": req.strategy,
        "replicas": req.replicas,
        "status": "SUCCESSFUL",
        "trigger": "operator manual deploy",
        "commit_hash": hashlib.md5(req.version.encode()).hexdigest()[:7],
        "commit_message": req.change_summary,
        "author": "Yash Baviskar",
        "started_at": datetime.utcnow().isoformat() + "Z",
        "finished_at": (datetime.utcnow() + timedelta(seconds=110)).isoformat() + "Z",
        "duration_seconds": 110,
        "steps": [
            {"name": "Pull Container Image from Registry", "status": "COMPLETED", "duration": "25s"},
            {"name": "Execute Pre-flight Security Scan", "status": "COMPLETED", "duration": "15s"},
            {"name": f"Apply {req.strategy} Deployment Strategy", "status": "COMPLETED", "duration": "50s"},
            {"name": "Verify HTTP 200 Health Probes", "status": "COMPLETED", "duration": "20s"},
        ]
    }
    _deployments.insert(0, new_dep)

    if app_id in _applications:
        _applications[app_id]["previous_version"] = _applications[app_id]["version"]
        _applications[app_id]["version"] = req.version
        _applications[app_id]["image"] = req.image
        _applications[app_id]["last_deployed_at"] = datetime.utcnow().isoformat() + "Z"
        _applications[app_id]["status"] = "HEALTHY"

    return new_dep

@router.post("/deployments/{dep_id}/rollback")
def rollback_deployment_by_id(dep_id: str):
    target = None
    for d in _deployments:
        if d["id"] == dep_id:
            target = d
            break
    if not target:
        raise HTTPException(status_code=404, detail="Deployment record not found")
    
    app_id = target["application_id"]
    if app_id in _applications:
        return rollback_application(app_id, RollbackRequest(target_version=target.get("previous_version"), reason=f"Rollback of deployment {dep_id}"))
    
    target["status"] = "ROLLED_BACK"
    return {"message": f"Deployment {dep_id} marked as rolled back", "deployment": target}

# ─────────────────────────────────────────────────────────────────────────────
# 3. Containers Endpoints
# ─────────────────────────────────────────────────────────────────────────────

@router.get("/containers")
def list_containers():
    return _containers

@router.post("/containers/{container_id}/action")
def perform_container_action(container_id: str, req: ContainerActionRequest):
    for c in _containers:
        if c["id"] == container_id:
            action = req.action.lower()
            if action == "restart":
                c["status"] = "RUNNING"
                c["restarts"] += 1
                c["uptime"] = "1m"
            elif action == "stop":
                c["status"] = "STOPPED"
                c["cpu_pct"] = 0.0
            elif action == "start":
                c["status"] = "RUNNING"
                c["uptime"] = "1m"
            elif action == "terminate":
                c["status"] = "TERMINATED"
            return {"message": f"Container {container_id} action '{action}' executed successfully", "container": c}
    raise HTTPException(status_code=404, detail="Container not found")

@router.get("/containers/{container_id}/logs")
def get_container_logs(container_id: str):
    return [
        {"timestamp": (datetime.utcnow() - timedelta(minutes=5)).isoformat() + "Z", "stream": "stdout", "log": f"Starting container {container_id} PID 1..."},
        {"timestamp": (datetime.utcnow() - timedelta(minutes=4)).isoformat() + "Z", "stream": "stdout", "log": "Listening on 0.0.0.0:8000 (HTTP/1.1)"},
        {"timestamp": (datetime.utcnow() - timedelta(minutes=2)).isoformat() + "Z", "stream": "stdout", "log": "Readiness probe HTTP /health returned 200 OK"},
        {"timestamp": (datetime.utcnow() - timedelta(minutes=1)).isoformat() + "Z", "stream": "stdout", "log": "Ingesting active connection traffic"},
    ]

# ─────────────────────────────────────────────────────────────────────────────
# 4. Log Explorer Endpoints
# ─────────────────────────────────────────────────────────────────────────────

@router.get("/logs")
def query_logs(
    query: Optional[str] = None,
    service: Optional[str] = None,
    level: Optional[str] = None,
    limit: int = 100
):
    results = _cached_logs
    if service and service != "all":
        results = [l for l in results if l["service"].lower() == service.lower()]
    if level and level != "all":
        results = [l for l in results if l["level"].upper() == level.upper()]
    if query:
        q = query.lower()
        results = [l for l in results if q in l["message"].lower() or q in l["service"].lower()]
    return results[:limit]

# ─────────────────────────────────────────────────────────────────────────────
# 5. Incidents Endpoints
# ─────────────────────────────────────────────────────────────────────────────

@router.get("/incidents")
def list_incidents():
    return _incidents

@router.get("/incidents/{incident_id}")
def get_incident(incident_id: str):
    for inc in _incidents:
        if inc["id"] == incident_id:
            return inc
    raise HTTPException(status_code=404, detail="Incident not found")

@router.post("/incidents", status_code=status.HTTP_201_CREATED)
def create_incident(req: CreateIncidentRequest):
    inc_num = f"INC-{random.randint(1043, 1999)}"
    new_inc = {
        "id": f"inc-{uuid.uuid4().hex[:6]}",
        "number": inc_num,
        "title": req.title,
        "severity": req.severity,
        "status": "Detected",
        "affected_services": req.affected_services,
        "detected_at": datetime.utcnow().isoformat() + "Z",
        "resolved_at": None,
        "commander": req.commander,
        "summary": req.summary,
        "root_cause": "Under investigation",
        "timeline": [
            {"time": datetime.utcnow().strftime("%H:%M:%S UTC"), "author": req.commander, "note": "Declared incident and began triage", "type": "ALERT"}
        ],
        "related_alerts": []
    }
    _incidents.insert(0, new_inc)
    return new_inc

@router.patch("/incidents/{incident_id}")
def update_incident(incident_id: str, req: UpdateIncidentRequest):
    for inc in _incidents:
        if inc["id"] == incident_id:
            if req.status:
                inc["status"] = req.status
                if req.status.lower() == "resolved":
                    inc["resolved_at"] = datetime.utcnow().isoformat() + "Z"
            if req.root_cause:
                inc["root_cause"] = req.root_cause
            if req.summary:
                inc["summary"] = req.summary
            return inc
    raise HTTPException(status_code=404, detail="Incident not found")

@router.post("/incidents/{incident_id}/timeline")
def add_incident_timeline_event(incident_id: str, req: AddIncidentTimelineRequest):
    for inc in _incidents:
        if inc["id"] == incident_id:
            entry = {
                "time": datetime.utcnow().strftime("%H:%M:%S UTC"),
                "author": req.author,
                "note": req.note,
                "type": req.type
            }
            inc["timeline"].append(entry)
            return entry
    raise HTTPException(status_code=404, detail="Incident not found")

# ─────────────────────────────────────────────────────────────────────────────
# 6. Automation & Runbooks Endpoints
# ─────────────────────────────────────────────────────────────────────────────

@router.get("/automation/workflows")
def list_workflows():
    return _workflows

@router.post("/automation/workflows/{wf_id}/run")
def run_workflow(wf_id: str):
    for wf in _workflows:
        if wf["id"] == wf_id:
            wf["last_run"] = datetime.utcnow().isoformat() + "Z"
            wf["last_status"] = "SUCCESS"
            wf["run_count"] += 1
            return {
                "message": f"Runbook '{wf['name']}' executed successfully",
                "execution_id": f"run-{uuid.uuid4().hex[:8]}",
                "status": "SUCCESS",
                "duration": "42s",
                "workflow": wf
            }
    raise HTTPException(status_code=404, detail="Workflow runbook not found")

# ─────────────────────────────────────────────────────────────────────────────
# 7. Backups & Disaster Recovery Endpoints
# ─────────────────────────────────────────────────────────────────────────────

@router.get("/backups")
def list_backups():
    return _backups

@router.post("/backups", status_code=status.HTTP_201_CREATED)
def create_backup(req: CreateBackupRequest):
    bsp_id = f"bsp-{random.randint(1093, 1999)}"
    new_bsp = {
        "id": bsp_id,
        "name": f"{req.resource_name.lower().replace(' ', '-')}-snap-{datetime.utcnow().strftime('%Y%m%d%H%M')}",
        "resource_type": req.resource_type,
        "resource_name": req.resource_name,
        "size_mb": random.randint(120, 8500),
        "status": "COMPLETED",
        "created_at": datetime.utcnow().isoformat() + "Z",
        "retention_days": req.retention_days,
        "restore_point": datetime.utcnow().isoformat() + "Z",
        "region": "arv-us-east-1",
        "encryption": "AES-256-GCM"
    }
    _backups.insert(0, new_bsp)
    return new_bsp

@router.post("/backups/{backup_id}/restore")
def restore_backup(backup_id: str):
    for b in _backups:
        if b["id"] == backup_id:
            return {
                "message": f"Backup snapshot {b['name']} successfully queued for restoration",
                "restore_job_id": f"rst-{uuid.uuid4().hex[:8]}",
                "target_resource": b["resource_name"],
                "status": "IN_PROGRESS",
                "estimated_time_seconds": 180
            }
    raise HTTPException(status_code=404, detail="Backup snapshot not found")

@router.delete("/backups/{backup_id}")
def delete_backup(backup_id: str):
    global _backups
    _backups = [b for b in _backups if b["id"] != backup_id]
    return {"message": f"Backup snapshot {backup_id} deleted successfully"}

# ─────────────────────────────────────────────────────────────────────────────
# 8. Unified Multi-Cloud Infrastructure Inventory
# ─────────────────────────────────────────────────────────────────────────────

@router.get("/infrastructure/inventory")
def get_unified_inventory():
    return {
        "summary": {
            "total_resources": 28,
            "healthy": 25,
            "warning": 2,
            "critical": 1,
            "monthly_spend_usd": 2714.50
        },
        "resources": [
            {"id": "vm-web-prod-01", "name": "web-server-prod-01", "type": "Compute VM", "provider": "Aravanta Elastic VM", "region": "arv-us-east-1", "env": "production", "status": "RUNNING", "specs": "4 vCPU / 8GB RAM", "uptime": "42d", "tags": {"team": "platform", "tier": "frontend"}},
            {"id": "vm-api-gw-prod", "name": "api-gateway-prod", "type": "Compute VM", "provider": "Aravanta Elastic VM", "region": "arv-us-east-1", "env": "production", "status": "RUNNING", "specs": "4 vCPU / 16GB RAM", "uptime": "88d", "tags": {"team": "backend", "tier": "gateway"}},
            {"id": "k8s-aravanta-prod", "name": "aravanta-prod", "type": "Kubernetes Cluster", "provider": "ArvKube Managed K8s", "region": "arv-us-east-1", "env": "production", "status": "RUNNING", "specs": "5 Nodes (1.30.1)", "uptime": "120d", "tags": {"team": "sre", "env": "prod"}},
            {"id": "k8s-aravanta-stage", "name": "aravanta-staging", "type": "Kubernetes Cluster", "provider": "ArvKube Managed K8s", "region": "arv-us-east-1", "env": "staging", "status": "RUNNING", "specs": "3 Nodes (1.29.2)", "uptime": "60d", "tags": {"team": "qa", "env": "stage"}},
            {"id": "db-pg-core-prod", "name": "aravanta-core-db", "type": "Managed Database", "provider": "ArvDB (PostgreSQL 16)", "region": "arv-us-east-1", "env": "production", "status": "WARNING", "specs": "8 vCPU / 32GB RAM / 500GB SSD", "uptime": "42d", "tags": {"tier": "data", "backup": "daily"}},
            {"id": "db-redis-cache-prod", "name": "redis-cluster-cache", "type": "Managed In-Memory", "provider": "ArvDB (Redis 7.2)", "region": "arv-us-east-1", "env": "production", "status": "RUNNING", "specs": "4 vCPU / 16GB RAM", "uptime": "42d", "tags": {"tier": "cache"}},
            {"id": "s3-assets-prod", "name": "aravanta-assets-prod", "type": "Object Storage", "provider": "ArvStore (S3 API)", "region": "arv-us-east-1", "env": "production", "status": "RUNNING", "specs": "1.2 TB / Multi-AZ", "uptime": "120d", "tags": {"retention": "90d"}},
            {"id": "s3-logs-archive", "name": "aravanta-logs-archive", "type": "Object Storage", "provider": "ArvStore (S3 API)", "region": "arv-us-west-2", "env": "production", "status": "RUNNING", "specs": "3.8 TB / Glacier Tier", "uptime": "120d", "tags": {"retention": "365d"}},
            {"id": "app-api-gateway", "name": "api-gateway (v2.4.1)", "type": "Microservice", "provider": "ArvOperations App", "region": "arv-us-east-1", "env": "production", "status": "RUNNING", "specs": "4 Replicas / 2.7K req/s", "uptime": "6h", "tags": {"tier": "app"}},
            {"id": "app-telemetry-engine", "name": "telemetry-engine (v3.1.0)", "type": "Microservice", "provider": "ArvOperations App", "region": "arv-us-east-1", "env": "production", "status": "CRITICAL", "specs": "2 Replicas / OOM Issue", "uptime": "14m", "tags": {"tier": "observability"}},
        ]
    }
