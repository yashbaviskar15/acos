"""
Aravanta CloudOS — ArvEdge Service Router
Load balancing, edge routing, and WAF rules derived dynamically from persistent infrastructure.
"""
from typing import List, Optional
from fastapi import APIRouter, Depends, Header
from sqlalchemy.orm import Session
from pydantic import BaseModel

from app.core.database import get_db
from app.services.arvgate.dependencies import get_current_user
from app.services.arvgate.models import User
from app.core.cloud_models import ApplicationRecord, KubeCluster

router = APIRouter(prefix="/api/v1/edge", tags=["ArvEdge — Load Balancer & WAF"])

class LoadBalancerResponse(BaseModel):
    id: str
    name: str
    type: str
    status: str
    dns_name: str
    target_groups: int

@router.get("/load-balancers", response_model=List[LoadBalancerResponse])
def list_load_balancers(
    workspace_id: Optional[str] = Header(None, alias="x-workspace-id"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    ws_id = current_user.workspace_id or workspace_id or "default"
    
    app_count = db.query(ApplicationRecord).filter(
        (ApplicationRecord.workspace_id == ws_id) | (ApplicationRecord.user_id == current_user.id)
    ).count()

    clusters = db.query(KubeCluster).filter(
        (KubeCluster.workspace_id == ws_id) | (KubeCluster.user_id == current_user.id)
    ).all()

    lbs = [
        LoadBalancerResponse(
            id="alb-main-01",
            name=f"aravanta-{current_user.workspace_name.lower().replace(' ', '-') if current_user.workspace_name else 'public'}-gateway",
            type="Application (L7)",
            status="ACTIVE",
            dns_name=f"gateway.{ws_id}.aravanta.cloud",
            target_groups=max(1, app_count)
        )
    ]

    for c in clusters:
        lbs.append(
            LoadBalancerResponse(
                id=f"nlb-{c.id[:8]}",
                name=f"{c.name}-network-ingress",
                type="Network (L4)",
                status="ACTIVE" if c.status == "ACTIVE" else "PROVISIONING",
                dns_name=f"k8s.{c.region}.aravanta.cloud",
                target_groups=max(1, c.node_count)
            )
        )

    return lbs
