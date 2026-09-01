"""
Aravanta CloudOS — ArvWatch Service Router
Real-time metrics, alerts, and system health monitoring.
"""
import random
import uuid
from datetime import datetime, timedelta
from fastapi import APIRouter
from pydantic import BaseModel

router = APIRouter(prefix="/api/v1/monitoring", tags=["ArvWatch"])

ALERT_SEVERITIES = ["critical", "warning", "info"]

_alerts: list[dict] = [
    {"id": f"alert-{uuid.uuid4().hex[:8]}", "title": "High CPU on web-server-prod-01", "severity": "warning", "service": "ArvCompute", "message": "CPU utilization at 87% for 5 minutes", "status": "firing", "fired_at": (datetime.utcnow() - timedelta(minutes=12)).isoformat() + "Z"},
    {"id": f"alert-{uuid.uuid4().hex[:8]}", "title": "Database connection pool saturating", "severity": "critical", "service": "ArvDB", "message": "aravanta-core-db connections at 182/200 (91%)", "status": "firing", "fired_at": (datetime.utcnow() - timedelta(minutes=3)).isoformat() + "Z"},
    {"id": f"alert-{uuid.uuid4().hex[:8]}", "title": "Pod CrashLoopBackOff detected", "severity": "critical", "service": "ArvKube", "message": "scheduler-7f8a2c1e in aravanta-prod restarted 5 times", "status": "firing", "fired_at": (datetime.utcnow() - timedelta(minutes=8)).isoformat() + "Z"},
    {"id": f"alert-{uuid.uuid4().hex[:8]}", "title": "SSL certificate expiring soon", "severity": "warning", "service": "ArvEdge", "message": "cloudos.aravanta.cloud cert expires in 14 days", "status": "firing", "fired_at": (datetime.utcnow() - timedelta(hours=2)).isoformat() + "Z"},
    {"id": f"alert-{uuid.uuid4().hex[:8]}", "title": "Storage bucket nearing capacity", "severity": "info", "service": "ArvStore", "message": "app-logs-archive at 89% of 1.5TB quota", "status": "resolved", "fired_at": (datetime.utcnow() - timedelta(hours=6)).isoformat() + "Z"},
    {"id": f"alert-{uuid.uuid4().hex[:8]}", "title": "Deployment rollback triggered", "severity": "warning", "service": "CI/CD", "message": "web-frontend v2.1.0 health check failed, rolled back to v2.0.9", "status": "resolved", "fired_at": (datetime.utcnow() - timedelta(hours=1)).isoformat() + "Z"},
]

_audit_events: list[dict] = [
    {"id": f"evt-{uuid.uuid4().hex[:8]}", "user": "admin@aravanta.cloud", "action": "CREATE_INSTANCE", "resource": "web-server-prod-01", "service": "ArvCompute", "ip": "203.0.113.45", "timestamp": (datetime.utcnow() - timedelta(hours=2)).isoformat() + "Z"},
    {"id": f"evt-{uuid.uuid4().hex[:8]}", "user": "developer@aravanta.cloud", "action": "SCALE_CLUSTER", "resource": "aravanta-prod (3 -> 5 nodes)", "service": "ArvKube", "ip": "198.51.100.22", "timestamp": (datetime.utcnow() - timedelta(hours=4)).isoformat() + "Z"},
    {"id": f"evt-{uuid.uuid4().hex[:8]}", "user": "admin@aravanta.cloud", "action": "CREATE_DATABASE", "resource": "aravanta-analytics", "service": "ArvDB", "ip": "203.0.113.45", "timestamp": (datetime.utcnow() - timedelta(hours=8)).isoformat() + "Z"},
    {"id": f"evt-{uuid.uuid4().hex[:8]}", "user": "developer@aravanta.cloud", "action": "DEPLOY_IMAGE", "resource": "aravanta/api-server:v2.1.0", "service": "ArvRegistry", "ip": "198.51.100.22", "timestamp": (datetime.utcnow() - timedelta(hours=1)).isoformat() + "Z"},
    {"id": f"evt-{uuid.uuid4().hex[:8]}", "user": "admin@aravanta.cloud", "action": "UPDATE_FIREWALL_RULE", "resource": "Allow HTTPS ingress", "service": "ArvEdge", "ip": "203.0.113.45", "timestamp": (datetime.utcnow() - timedelta(minutes=30)).isoformat() + "Z"},
]

@router.get("/metrics")
def get_metrics():
    return {
        "cpu_usage_percent": round(random.uniform(30, 70), 1),
        "memory_usage_percent": round(random.uniform(50, 80), 1),
        "storage_usage_percent": round(random.uniform(25, 60), 1),
        "network_in_mbps": round(random.uniform(50, 300), 1),
        "network_out_mbps": round(random.uniform(20, 150), 1),
        "active_instances": 10 + random.randint(-2, 3),
        "active_clusters": 3,
        "active_databases": 4,
        "active_buckets": 4,
        "total_requests_1h": random.randint(80000, 250000),
        "error_rate_percent": round(random.uniform(0.01, 0.8), 2),
        "p95_latency_ms": round(random.uniform(45, 200), 1),
        "uptime_percent": round(random.uniform(99.9, 99.999), 3),
        "cost_today_usd": round(random.uniform(60, 120), 2),
        "cost_mtd_usd": round(random.uniform(1800, 2800), 2),
        "timestamp": datetime.utcnow().isoformat() + "Z",
    }

@router.get("/metrics/timeseries")
def get_timeseries(time_range: str = "24h"):
    """Return CPU/RAM/Network/Latency/ErrorRate data points based on time range (5m, 15m, 1h, 6h, 24h, 7d)."""
    now = datetime.utcnow()
    points = []
    
    # Define step count and delta interval based on selected range
    range_config = {
        "5m": (10, timedelta(seconds=30), "%H:%M:%S"),
        "15m": (15, timedelta(minutes=1), "%H:%M"),
        "1h": (12, timedelta(minutes=5), "%H:%M"),
        "6h": (18, timedelta(minutes=20), "%H:%M"),
        "24h": (24, timedelta(hours=1), "%H:%M"),
        "7d": (14, timedelta(hours=12), "%b %d %H:%M"),
    }
    
    count, delta, time_fmt = range_config.get(time_range, (24, timedelta(hours=1), "%H:%M"))
    
    for i in range(count):
        ts = now - delta * (count - 1 - i)
        points.append({
            "timestamp": ts.isoformat() + "Z",
            "time_label": ts.strftime(time_fmt),
            "cpu": round(random.uniform(25, 78), 1),
            "memory": round(random.uniform(45, 82), 1),
            "disk_io": round(random.uniform(15, 65), 1),
            "network_in": round(random.uniform(40, 250), 1),
            "network_out": round(random.uniform(20, 130), 1),
            "p95_latency": round(random.uniform(28, 160), 1),
            "requests": random.randint(3000, 15000),
            "errors": random.randint(0, 35),
            "error_rate": round(random.uniform(0.01, 0.45), 2),
        })
    return points

@router.get("/alerts")
def list_alerts():
    return _alerts

@router.post("/alerts/{alert_id}/acknowledge")
def acknowledge_alert(alert_id: str):
    for a in _alerts:
        if a["id"] == alert_id:
            a["status"] = "acknowledged"
            return a
    return {"message": "Alert not found"}

@router.post("/alerts/{alert_id}/mute")
def mute_alert(alert_id: str):
    for a in _alerts:
        if a["id"] == alert_id:
            a["status"] = "muted"
            return a
    return {"message": "Alert not found"}

@router.post("/alerts/{alert_id}/resolve")
def resolve_alert(alert_id: str):
    for a in _alerts:
        if a["id"] == alert_id:
            a["status"] = "resolved"
            return a
    return {"message": "Alert not found"}

@router.get("/audit-log")
def get_audit_log():
    return _audit_events

@router.get("/health")
def system_health():
    services = [
        {"name": "ArvGate (Identity)", "status": "healthy", "latency_ms": round(random.uniform(2, 15), 1)},
        {"name": "ArvCompute", "status": "healthy", "latency_ms": round(random.uniform(5, 30), 1)},
        {"name": "ArvKube", "status": "healthy", "latency_ms": round(random.uniform(8, 25), 1)},
        {"name": "ArvStore", "status": "healthy", "latency_ms": round(random.uniform(3, 20), 1)},
        {"name": "ArvDB", "status": random.choice(["healthy", "healthy", "degraded"]), "latency_ms": round(random.uniform(5, 50), 1)},
        {"name": "ArvRegistry", "status": "healthy", "latency_ms": round(random.uniform(5, 20), 1)},
        {"name": "ArvEdge", "status": "healthy", "latency_ms": round(random.uniform(2, 10), 1)},
        {"name": "ArvWatch", "status": "healthy", "latency_ms": round(random.uniform(3, 12), 1)},
        {"name": "PostgreSQL Primary", "status": "healthy", "latency_ms": round(random.uniform(1, 8), 1)},
        {"name": "Redis Cache", "status": "healthy", "latency_ms": round(random.uniform(0.5, 3), 1)},
    ]
    return {
        "overall": "OPERATIONAL" if all(s["status"] == "healthy" for s in services) else "DEGRADED",
        "services": services,
        "checked_at": datetime.utcnow().isoformat() + "Z",
    }
