import uuid
import datetime
import json
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from pydantic import BaseModel, Field

from app.core.database import get_db
from app.services.arvgate.dependencies import get_current_user
from app.services.arvgate.models import User
from app.services.arvnetwork.models import ArvVPC, ArvLoadBalancer, ArvFirewallRule
from app.core.state_guard import transition_resource_state
from app.core.crypto import PLATFORM_MASTER_KEY, decrypt_aes256gcm
from app.core.providers import get_provider
from app.services.cloud_providers.models import CloudProviderCredential

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


def _get_aws_driver_for_user(db: Session, user_id: str):
    cred = db.query(CloudProviderCredential).filter(
        CloudProviderCredential.user_id == user_id,
        CloudProviderCredential.provider.in_(["AWS", "EC2"])
    ).first()
    if not cred:
        return None
    try:
        raw_creds = json.loads(decrypt_aes256gcm(PLATFORM_MASTER_KEY, cred.encrypted_credentials))
        return get_provider("AWS", raw_creds)
    except Exception:
        return None


@router.get("/vpcs")
def list_vpcs(db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    vpcs = db.query(ArvVPC).order_by(ArvVPC.created_at.desc()).all()
    return [v.to_dict() for v in vpcs]


@router.post("/vpcs", status_code=status.HTTP_201_CREATED)
def create_vpc(body: VPCCreate, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    vpc = ArvVPC(
        name=body.name, 
        cidr_block=body.cidr_block, 
        region=body.region, 
        is_default=body.is_default, 
        user_id=str(user.id),
        status="PROVISIONING"
    )
    db.add(vpc)
    db.flush()

    aws_provider = _get_aws_driver_for_user(db, str(user.id))
    if aws_provider:
        try:
            res = aws_provider.network.create_vpc(
                cidr=body.cidr_block,
                name=body.name,
                idempotency_key=vpc.id
            )
            transition_resource_state(
                vpc,
                target_state=res.get("status", "AVAILABLE"),
                provider_resource_id=res["provider_resource_id"],
                state_source="provider",
                observed_at=datetime.datetime.utcnow()
            )
        except Exception as e:
            transition_resource_state(
                vpc,
                target_state="FAILED",
                state_source="provider",
                last_error=str(e)
            )
    else:
        transition_resource_state(
            vpc,
            target_state="AWAITING_PROVIDER_SETUP",
            state_source="registry-only",
            last_error="No cloud provider configured. Connect AWS credentials to provision real VPC."
        )

    db.commit()
    db.refresh(vpc)
    return vpc.to_dict()


@router.get("/vpcs/{vpc_id}")
def get_vpc(vpc_id: str, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    vpc = db.query(ArvVPC).filter(ArvVPC.id == vpc_id).first()
    if not vpc:
        raise HTTPException(404, "VPC not found")
    return vpc.to_dict()


@router.delete("/vpcs/{vpc_id}")
def delete_vpc(vpc_id: str, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    vpc = db.query(ArvVPC).filter(ArvVPC.id == vpc_id).first()
    if not vpc:
        raise HTTPException(404, "VPC not found")
    
    if vpc.provider_resource_id:
        aws_provider = _get_aws_driver_for_user(db, str(user.id))
        if aws_provider:
            try:
                aws_provider.network.delete_vpc(vpc.provider_resource_id)
            except Exception as e:
                raise HTTPException(502, f"Provider error deleting VPC: {e}")

    db.delete(vpc)
    db.commit()
    return {"message": "VPC deleted", "id": vpc_id}


@router.get("/load-balancers")
def list_lbs(db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    lbs = db.query(ArvLoadBalancer).order_by(ArvLoadBalancer.created_at.desc()).all()
    return [lb.to_dict() for lb in lbs]


@router.post("/load-balancers", status_code=status.HTTP_201_CREATED)
def create_lb(body: LBCreate, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    lb = ArvLoadBalancer(
        name=body.name,
        vpc_id=body.vpc_id,
        lb_type=body.lb_type,
        protocol=body.protocol,
        port=body.port,
        target_port=body.target_port,
        health_check_path=body.health_check_path,
        user_id=str(user.id),
        status="AWAITING_PROVIDER_SETUP",
        state_source="registry-only",
        last_error="Load balancer driver requires an active cloud provider (AWS ALB or local Ingress controller)."
    )
    db.add(lb)
    db.commit()
    db.refresh(lb)
    return lb.to_dict()


@router.delete("/load-balancers/{lb_id}")
def delete_lb(lb_id: str, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    lb = db.query(ArvLoadBalancer).filter(ArvLoadBalancer.id == lb_id).first()
    if not lb:
        raise HTTPException(404, "Load Balancer not found")
    db.delete(lb)
    db.commit()
    return {"message": "LB deleted", "id": lb_id}


@router.get("/firewall-rules")
def list_fw(db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    rules = db.query(ArvFirewallRule).order_by(ArvFirewallRule.priority.asc()).all()
    return [r.to_dict() for r in rules]


@router.post("/firewall-rules", status_code=status.HTTP_201_CREATED)
def create_fw(body: FirewallCreate, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    rule = ArvFirewallRule(
        name=body.name,
        vpc_id=body.vpc_id,
        direction=body.direction,
        protocol=body.protocol,
        port_range=body.port_range,
        source_cidr=body.source_cidr,
        action=body.action,
        priority=body.priority,
        user_id=str(user.id),
        status="AWAITING_PROVIDER_SETUP",
        state_source="registry-only",
        last_error="Firewall driver requires an active VPC security group provider."
    )
    db.add(rule)
    db.commit()
    db.refresh(rule)
    return rule.to_dict()


@router.delete("/firewall-rules/{rule_id}")
def delete_fw(rule_id: str, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    rule = db.query(ArvFirewallRule).filter(ArvFirewallRule.id == rule_id).first()
    if not rule:
        raise HTTPException(404, "Firewall rule not found")
    db.delete(rule)
    db.commit()
    return {"message": "Firewall rule deleted", "id": rule_id}
