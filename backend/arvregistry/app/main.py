from __future__ import annotations

import os

from fastapi import APIRouter, Depends

from aravanta_shared.security import authenticated_user_dependency
from aravanta_shared.stub_service import create_service_app

JWT_SECRET_KEY = os.getenv("JWT_SECRET_KEY", os.getenv("ARVGATE_JWT_SECRET_KEY", "change-me-in-production"))
JWT_ALGORITHM = os.getenv("JWT_ALGORITHM", "HS256")
current_user = authenticated_user_dependency(JWT_SECRET_KEY, JWT_ALGORITHM)

REPOSITORIES = [{"name": "aravanta/arvgate", "signed": True, "latest_scan_status": "clean"}]


def router_factory() -> APIRouter:
    router = APIRouter(prefix="/registry", tags=["ArvRegistry"])

    @router.get("/repositories")
    async def list_repositories(_identity=Depends(current_user)):
        return REPOSITORIES

    @router.get("/repositories/{repository}/scans")
    async def get_scan_status(repository: str, _identity=Depends(current_user)):
        return {"repository": repository, "critical_cves": 0, "status": "clean"}

    return router


app = create_service_app(
    service_name="arvregistry",
    title="ArvRegistry API",
    description="Container registry and image security scanning scaffold.",
    api_router_factory=router_factory,
)
