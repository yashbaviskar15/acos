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


class ClusterCreate(BaseModel):
    name: str
    kubernetes_version: str = "1.31"
    node_count: int = 3
    region: str = "us-east-1"


CLUSTERS = [
    {
        "id": "cls-001",
        "name": "aravanta-core",
        "kubernetes_version": "1.31",
        "node_count": 3,
        "status": "HEALTHY",
        "region": "us-east-1",
    }
]

PODS = [
    {"id": "pod-001", "name": "arvgate-6d77fd9d7-xzwnw", "namespace": "aravanta-system", "status": "Running"},
    {"id": "pod-002", "name": "arvcompute-7c958756d4-t4b5g", "namespace": "aravanta-system", "status": "Running"},
]


def router_factory() -> APIRouter:
    router = APIRouter(prefix="/kubernetes", tags=["ArvKube"])

    @router.get("/clusters")
    async def list_clusters(_identity=Depends(current_user)):
        return CLUSTERS

    @router.post("/clusters", status_code=status.HTTP_201_CREATED)
    async def create_cluster(payload: ClusterCreate, _identity=Depends(current_user)):
        cluster = {
            "id": f"cls-{uuid4().hex[:8]}",
            "name": payload.name,
            "kubernetes_version": payload.kubernetes_version,
            "node_count": payload.node_count,
            "status": "CREATING",
            "region": payload.region,
        }
        CLUSTERS.append(cluster)
        return cluster

    @router.get("/clusters/{cluster_id}/pods")
    async def list_pods(cluster_id: str, _identity=Depends(current_user)):
        return {"cluster_id": cluster_id, "pods": PODS}

    return router


app = create_service_app(
    service_name="arvkube",
    title="ArvKube API",
    description="Managed Kubernetes control plane for clusters, node pools, and pod inspection.",
    api_router_factory=router_factory,
)
