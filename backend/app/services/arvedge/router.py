from typing import List
from fastapi import APIRouter, Depends
from pydantic import BaseModel
from app.services.arvgate.dependencies import get_current_user
from app.services.arvgate.models import User

router = APIRouter(prefix="/api/v1/edge", tags=["ArvEdge — Load Balancer & WAF"])

class LoadBalancerResponse(BaseModel):
    id: str
    name: str
    type: str
    status: str
    dns_name: str
    target_groups: int

MOCK_LBS = [
    {
        "id": "alb-main-01",
        "name": "aravanta-public-gateway",
        "type": "Application (L7)",
        "status": "ACTIVE",
        "dns_name": "gateway.aravanta.cloud",
        "target_groups": 3
    }
]

@router.get("/load-balancers", response_model=List[LoadBalancerResponse])
def list_load_balancers(current_user: User = Depends(get_current_user)):
    return MOCK_LBS
