from __future__ import annotations

import os

from fastapi import APIRouter, Depends, status
from pydantic import BaseModel

from aravanta_shared.security import authenticated_user_dependency
from aravanta_shared.stub_service import create_service_app

JWT_SECRET_KEY = os.getenv("JWT_SECRET_KEY", os.getenv("ARVGATE_JWT_SECRET_KEY", "change-me-in-production"))
JWT_ALGORITHM = os.getenv("JWT_ALGORITHM", "HS256")
current_user = authenticated_user_dependency(JWT_SECRET_KEY, JWT_ALGORITHM)

LOAD_BALANCERS = [{"id": "lb-001", "hostname": "api.aravanta.local", "waf_mode": "monitor"}]


class LoadBalancerCreate(BaseModel):
    hostname: str
    waf_mode: str = "block"


def router_factory() -> APIRouter:
    router = APIRouter(prefix="/edge", tags=["ArvEdge"])

    @router.get("/load-balancers")
    async def list_load_balancers(_identity=Depends(current_user)):
        return LOAD_BALANCERS

    @router.post("/load-balancers", status_code=status.HTTP_201_CREATED)
    async def create_load_balancer(payload: LoadBalancerCreate, _identity=Depends(current_user)):
        balancer = payload.model_dump()
        balancer["id"] = f"lb-{len(LOAD_BALANCERS) + 1:03d}"
        LOAD_BALANCERS.append(balancer)
        return balancer

    return router


app = create_service_app(
    service_name="arvedge",
    title="ArvEdge API",
    description="Load balancer, WAF, and edge traffic management service scaffold.",
    api_router_factory=router_factory,
)
