from __future__ import annotations

import os

from fastapi import APIRouter, Depends

from aravanta_shared.security import authenticated_user_dependency
from aravanta_shared.stub_service import create_service_app

JWT_SECRET_KEY = os.getenv("JWT_SECRET_KEY", os.getenv("ARVGATE_JWT_SECRET_KEY", "change-me-in-production"))
JWT_ALGORITHM = os.getenv("JWT_ALGORITHM", "HS256")
current_user = authenticated_user_dependency(JWT_SECRET_KEY, JWT_ALGORITHM)


def router_factory() -> APIRouter:
    router = APIRouter(prefix="/billing", tags=["ArvBilling"])

    @router.get("/usage")
    async def usage(_identity=Depends(current_user)):
        return {
            "period": "2026-08",
            "estimated_cost_usd": 2340.5,
            "budget_usd": 2800,
            "alerts": ["Forecast exceeds 80% of monthly budget"],
        }

    return router


app = create_service_app(
    service_name="arvbilling",
    title="ArvBilling API",
    description="Usage metering and budget alerting scaffold for the CloudOS billing engine.",
    api_router_factory=router_factory,
)
