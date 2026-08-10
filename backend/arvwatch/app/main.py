from __future__ import annotations

import os

from fastapi import APIRouter, Depends

from aravanta_shared.security import authenticated_user_dependency
from aravanta_shared.stub_service import create_service_app

JWT_SECRET_KEY = os.getenv("JWT_SECRET_KEY", os.getenv("ARVGATE_JWT_SECRET_KEY", "change-me-in-production"))
JWT_ALGORITHM = os.getenv("JWT_ALGORITHM", "HS256")
current_user = authenticated_user_dependency(JWT_SECRET_KEY, JWT_ALGORITHM)


def router_factory() -> APIRouter:
    router = APIRouter(prefix="/monitoring", tags=["ArvWatch"])

    @router.get("/overview")
    async def overview(_identity=Depends(current_user)):
        return {
            "healthy_services": 8,
            "degraded_services": 0,
            "cpu_usage_percent": 42.6,
            "memory_usage_percent": 61.3,
            "storage_usage_percent": 37.8,
            "active_alerts": 1,
            "traces_per_minute": 168,
        }

    @router.get("/alerts")
    async def alerts(_identity=Depends(current_user)):
        return [
            {
                "severity": "warning",
                "summary": "API p95 latency above target for arvcompute",
                "status": "firing",
            }
        ]

    return router


app = create_service_app(
    service_name="arvwatch",
    title="ArvWatch API",
    description="Monitoring, logs, traces, dashboards, and alerting service scaffold.",
    api_router_factory=router_factory,
)
