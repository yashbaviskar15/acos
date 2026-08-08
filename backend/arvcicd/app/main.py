from __future__ import annotations

import os

from fastapi import APIRouter, Depends, status
from pydantic import BaseModel

from aravanta_shared.security import authenticated_user_dependency
from aravanta_shared.stub_service import create_service_app

JWT_SECRET_KEY = os.getenv("JWT_SECRET_KEY", os.getenv("ARVGATE_JWT_SECRET_KEY", "change-me-in-production"))
JWT_ALGORITHM = os.getenv("JWT_ALGORITHM", "HS256")
current_user = authenticated_user_dependency(JWT_SECRET_KEY, JWT_ALGORITHM)

PIPELINES = [{"id": "pipe-001", "repository": "github.com/aravanta/cloudos", "environment": "staging"}]


class PipelineCreate(BaseModel):
    repository: str
    environment: str = "staging"


def router_factory() -> APIRouter:
    router = APIRouter(prefix="/cicd", tags=["ArvCI/CD"])

    @router.get("/pipelines")
    async def list_pipelines(_identity=Depends(current_user)):
        return PIPELINES

    @router.post("/pipelines", status_code=status.HTTP_201_CREATED)
    async def create_pipeline(payload: PipelineCreate, _identity=Depends(current_user)):
        pipeline = payload.model_dump()
        pipeline["id"] = f"pipe-{len(PIPELINES) + 1:03d}"
        PIPELINES.append(pipeline)
        return pipeline

    return router


app = create_service_app(
    service_name="arvcicd",
    title="ArvCI/CD API",
    description="Pipeline orchestration, Git integration, and deployment workflow scaffold.",
    api_router_factory=router_factory,
)
