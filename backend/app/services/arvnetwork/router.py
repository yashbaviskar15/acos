import uuid
import datetime
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from pydantic import BaseModel, Field
from app.core.database import get_db
from app.services.arvgate.dependencies import get_current_user
from app.services.arvgate.models import User
from app.services.arvnetwork.models import ArvVPC, ArvLoadBalancer, ArvFirewallRule

router = APIRouter(prefix="/api/v1/network", tags=["ArvNetworking"])


class VPCCreate(BaseModel):
    name: str
    cidr_block: str = "10.0.0.0/16"
    region: str = "arv-us-east-1"
    is_default: bool = False


class LBCreate(BaseModel):
    name: str
    vpc_id: Optional[str] = None
    lb_type: str = "APPLICATION"
    protocol: str = "HTTPS"
    port: int = 443
    target_port: int = 8080
    health_check_path: str = "/health"


class FirewallCreate(BaseModel):
    name: str
    vpc_id: Optional[str] = None
    direction: str = "INBOUND"
    protocol: str = "TCP"
    port_range: str = "443"
    source_cidr: str = "0.0.0.0/0"
    action: str = "ALLOW"
    priority: int = 100


@router.get("/vpcs")
def list_vpcs(db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    return db.query(ArvVPC).order_by(ArvVPC.created_at.desc()).all()


@router.post("/vpcs", status_code=status.HTTP_201_CREATED)
def create_vpc(body: VPCCreate, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    try:
        from app.core.setup_cloud_providers import CloudProviderCredential
        creds = db.query(CloudProviderCredential).filter(CloudProviderCredential.user_id == str(user.id)).all()
        has_net_provider = any(c.provider in ["aws", "gcp"] for c in creds)
    except ImportError:
        has_net_provider = False

    vpc = ArvVPC(
        name=body.name, 
        cidr_block=body.cidr_block, 
        region=body.region, 
        is_default=body.is_default, 
        user_id=str(user.id),
        status="ACTIVE" if has_net_provider else "AWAITING_PROVIDER_SETUP"
    )
    db.add(vpc); db.commit(); db.refresh(vpc)
    return vpc


@router.get("/vpcs/{vpc_id}")
def get_vpc(vpc_id: str, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    vpc = db.query(ArvVPC).filter(ArvVPC.id == vpc_id).first()
    if not vpc: raise HTTPException(404, "VPC not found")
    return vpc


@router.delete("/vpcs/{vpc_id}")
def delete_vpc(vpc_id: str, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    vpc = db.query(ArvVPC).filter(ArvVPC.id == vpc_id).first()
    if not vpc: raise HTTPException(404, "VPC not found")
    db.delete(vpc); db.commit()
    return {"message": "VPC deleted", "id": vpc_id}


@router.get("/load-balancers")
def list_lbs(db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    return db.query(ArvLoadBalancer).order_by(ArvLoadBalancer.created_at.desc()).all()


@router.post("/load-balancers", status_code=status.HTTP_201_CREATED)
def create_lb(body: LBCreate, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    lb = ArvLoadBalancer(name=body.name, vpc_id=body.vpc_id, lb_type=body.lb_type, protocol=body.protocol, port=body.port, target_port=body.target_port, health_check_path=body.health_check_path, user_id=str(user.id))
    db.add(lb); db.commit(); db.refresh(lb)
    return lb


@router.delete("/load-balancers/{lb_id}")
def delete_lb(lb_id: str, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    lb = db.query(ArvLoadBalancer).filter(ArvLoadBalancer.id == lb_id).first()
    if not lb: raise HTTPException(404, "Load Balancer not found")
    db.delete(lb); db.commit()
    return {"message": "LB deleted", "id": lb_id}


@router.get("/firewall-rules")
def list_fw(db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    return db.query(ArvFirewallRule).order_by(ArvFirewallRule.priority.asc()).all()


@router.post("/firewall-rules", status_code=status.HTTP_201_CREATED)
def create_fw(body: FirewallCreate, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    rule = ArvFirewallRule(name=body.name, vpc_id=body.vpc_id, direction=body.direction, protocol=body.protocol, port_range=body.port_range, source_cidr=body.source_cidr, action=body.action, priority=body.priority, user_id=str(user.id))
    db.add(rule); db.commit(); db.refresh(rule)
    return rule


@router.delete("/firewall-rules/{rule_id}")
def delete_fw(rule_id: str, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    rule = db.query(ArvFirewallRule).filter(ArvFirewallRule.id == rule_id).first()
    if not rule: raise HTTPException(404, "Firewall rule not found")
    db.delete(rule); db.commit()
    return {"message": "Firewall rule deleted", "id": rule_id}
