from __future__ import annotations

import os

from fastapi import APIRouter, Depends, status
from pydantic import BaseModel

from aravanta_shared.security import authenticated_user_dependency
from aravanta_shared.stub_service import create_service_app

JWT_SECRET_KEY = os.getenv("JWT_SECRET_KEY", os.getenv("ARVGATE_JWT_SECRET_KEY", "change-me-in-production"))
JWT_ALGORITHM = os.getenv("JWT_ALGORITHM", "HS256")
current_user = authenticated_user_dependency(JWT_SECRET_KEY, JWT_ALGORITHM)

BUCKETS = [{"id": "bkt-001", "name": "platform-artifacts", "versioning": True, "region": "us-east-1"}]


class BucketCreate(BaseModel):
    name: str
    region: str = "us-east-1"
    versioning: bool = True


def router_factory() -> APIRouter:
    router = APIRouter(prefix="/storage", tags=["ArvStore"])

    @router.get("/buckets")
    async def list_buckets(_identity=Depends(current_user)):
        return BUCKETS

    @router.post("/buckets", status_code=status.HTTP_201_CREATED)
    async def create_bucket(payload: BucketCreate, _identity=Depends(current_user)):
        bucket = payload.model_dump()
        bucket["id"] = f"bkt-{len(BUCKETS) + 1:03d}"
        BUCKETS.append(bucket)
        return bucket

    return router


app = create_service_app(
    service_name="arvstore",
    title="ArvStore API",
    description="Object storage catalog and policy management service scaffold.",
    api_router_factory=router_factory,
)
