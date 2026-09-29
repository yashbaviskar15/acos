"""
Aravanta CloudOS — ArvEdge Service Router
Edge routing and load balancer service.
Queries genuine load balancer infrastructure from ArvNetwork.
Never synthesizes fake load balancers or fictitious endpoints.
"""
from typing import List, Optional
from fastapi import APIRouter, Depends, Header
from sqlalchemy.orm import Session
from pydantic import BaseModel

from app.core.database import get_db
from app.services.arvgate.dependencies import get_current_user
from app.services.arvgate.models import User
from app.services.arvnetwork.models import ArvLoadBalancer

router = APIRouter(prefix="/api/v1/edge", tags=["ArvEdge — Load Balancer & WAF"])

class LoadBalancerResponse(BaseModel):
    id: str
    name: str
    type: str
    status: str
    dns_name: Optional[str] = None
    target_groups: int = 1
    provider_resource_id: Optional[str] = None
    state_source: Optional[str] = None
    last_error: Optional[str] = None

@router.get("/load-balancers", response_model=List[LoadBalancerResponse])
def list_load_balancers(
    workspace_id: Optional[str] = Header(None, alias="x-workspace-id"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    user_role = (current_user.role or "").strip().lower()
    query = db.query(ArvLoadBalancer)
    if user_role not in ["superadmin", "admin"]:
        query = query.filter(ArvLoadBalancer.user_id == str(current_user.id))

    lbs = query.all()
    results = []
    for lb in lbs:
        results.append(
            LoadBalancerResponse(
                id=lb.id,
                name=lb.name,
                type=lb.lb_type or "Application (L7)",
                status=lb.status or "AWAITING_PROVIDER_SETUP",
                dns_name=None,  # Real DNS name allocated only when provider provisions real ALB
                target_groups=1,
                provider_resource_id=lb.provider_resource_id,
                state_source=lb.state_source or "registry-only",
                last_error=lb.last_error
            )
        )
    return results
