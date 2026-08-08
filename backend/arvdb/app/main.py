from __future__ import annotations

import os

from fastapi import APIRouter, Depends, status
from pydantic import BaseModel

from aravanta_shared.security import authenticated_user_dependency
from aravanta_shared.stub_service import create_service_app

JWT_SECRET_KEY = os.getenv("JWT_SECRET_KEY", os.getenv("ARVGATE_JWT_SECRET_KEY", "change-me-in-production"))
JWT_ALGORITHM = os.getenv("JWT_ALGORITHM", "HS256")
current_user = authenticated_user_dependency(JWT_SECRET_KEY, JWT_ALGORITHM)

DATABASES = [{"id": "db-001", "engine": "postgresql", "tier": "ha-small", "status": "AVAILABLE"}]


class DatabaseCreate(BaseModel):
    engine: str = "postgresql"
    tier: str = "ha-small"


def router_factory() -> APIRouter:
    router = APIRouter(prefix="/database", tags=["ArvDB"])

    @router.get("/instances")
    async def list_instances(_identity=Depends(current_user)):
        return DATABASES

    @router.post("/instances", status_code=status.HTTP_201_CREATED)
    async def create_instance(payload: DatabaseCreate, _identity=Depends(current_user)):
        database = payload.model_dump()
        database["id"] = f"db-{len(DATABASES) + 1:03d}"
        database["status"] = "PROVISIONING"
        DATABASES.append(database)
        return database

    return router


app = create_service_app(
    service_name="arvdb",
    title="ArvDB API",
    description="Managed database scaffolding for PostgreSQL, MySQL, and failover workflows.",
    api_router_factory=router_factory,
)
