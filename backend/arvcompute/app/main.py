from __future__ import annotations

import os
from uuid import uuid4

from fastapi import APIRouter, Depends, status
from pydantic import BaseModel

from aravanta_shared.security import authenticated_user_dependency
from aravanta_shared.stub_service import create_service_app

JWT_SECRET_KEY = os.getenv("JWT_SECRET_KEY", os.getenv("ARVGATE_JWT_SECRET_KEY", "change-me-in-production"))
JWT_ALGORITHM = os.getenv("JWT_ALGORITHM", "HS256")
current_user = authenticated_user_dependency(JWT_SECRET_KEY, JWT_ALGORITHM)


class InstanceCreate(BaseModel):
    name: str
    instance_type: str = "arv.general.medium"
    image: str = "ubuntu-22.04-lts"
    region: str = "us-east-1"


INSTANCES = [
    {
        "id": "inst-001",
        "name": "web-gateway-01",
        "instance_type": "arv.general.medium",
        "image": "ubuntu-22.04-lts",
        "status": "RUNNING",
        "ip_address": "10.10.1.24",
        "region": "us-east-1",
    },
    {
        "id": "inst-002",
        "name": "build-runner-01",
        "instance_type": "arv.compute.large",
        "image": "ubuntu-22.04-lts",
        "status": "RUNNING",
        "ip_address": "10.10.1.31",
        "region": "us-east-1",
    },
]


def router_factory() -> APIRouter:
    router = APIRouter(prefix="/compute", tags=["ArvCompute"])

    @router.get("/instances")
    async def list_instances(_identity=Depends(current_user)):
        return INSTANCES

    @router.post("/instances", status_code=status.HTTP_201_CREATED)
    async def create_instance(payload: InstanceCreate, _identity=Depends(current_user)):
        instance = {
            "id": f"inst-{uuid4().hex[:8]}",
            "name": payload.name,
            "instance_type": payload.instance_type,
            "image": payload.image,
            "status": "PROVISIONING",
            "ip_address": "pending",
            "region": payload.region,
        }
        INSTANCES.append(instance)
        return instance

    @router.delete("/instances/{instance_id}")
    async def delete_instance(instance_id: str, _identity=Depends(current_user)):
        return {"id": instance_id, "status": "TERMINATING"}

    return router


app = create_service_app(
    service_name="arvcompute",
    title="ArvCompute API",
    description="Compute control plane for VM lifecycle, templates, and autoscaling.",
    api_router_factory=router_factory,
)
