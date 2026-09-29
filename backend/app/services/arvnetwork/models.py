import uuid
import datetime
from sqlalchemy import Column, String, Integer, DateTime, Text, Boolean
from app.core.database import Base


class ArvVPC(Base):
    __tablename__ = "arv_vpcs"
    id = Column(String(50), primary_key=True, default=lambda: f"vpc-{uuid.uuid4().hex[:10]}")
    user_id = Column(String(50), nullable=True, index=True)
    name = Column(String(100), nullable=False)
    cidr_block = Column(String(20), default="10.0.0.0/16")
    region = Column(String(30), default="arv-us-east-1")
    status = Column(String(30), default="AWAITING_PROVIDER_SETUP")
    is_default = Column(Boolean, default=False)
    provider_resource_id = Column(String(100), nullable=True)
    state_source = Column(String(50), nullable=True)
    observed_at = Column(DateTime, nullable=True)
    last_error = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)

    def to_dict(self) -> dict:
        return {
            "id": self.id,
            "user_id": self.user_id,
            "name": self.name,
            "cidr_block": self.cidr_block,
            "region": self.region,
            "status": self.status,
            "is_default": self.is_default,
            "provider_resource_id": self.provider_resource_id,
            "state_source": self.state_source or ("provider" if self.provider_resource_id else "registry-only"),
            "observed_at": self.observed_at.isoformat() + "Z" if self.observed_at else None,
            "last_error": self.last_error,
            "created_at": self.created_at.isoformat() + "Z" if self.created_at else None,
            "updated_at": self.updated_at.isoformat() + "Z" if self.updated_at else None,
        }


class ArvLoadBalancer(Base):
    __tablename__ = "arv_load_balancers"
    id = Column(String(50), primary_key=True, default=lambda: f"lb-{uuid.uuid4().hex[:10]}")
    user_id = Column(String(50), nullable=True, index=True)
    vpc_id = Column(String(50), nullable=True)
    name = Column(String(100), nullable=False)
    lb_type = Column(String(20), default="APPLICATION")
    protocol = Column(String(10), default="HTTPS")
    port = Column(Integer, default=443)
    target_port = Column(Integer, default=8080)
    health_check_path = Column(String(200), default="/health")
    status = Column(String(30), default="AWAITING_PROVIDER_SETUP")
    provider_resource_id = Column(String(100), nullable=True)
    state_source = Column(String(50), nullable=True)
    observed_at = Column(DateTime, nullable=True)
    last_error = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    def to_dict(self) -> dict:
        return {
            "id": self.id,
            "user_id": self.user_id,
            "vpc_id": self.vpc_id,
            "name": self.name,
            "lb_type": self.lb_type,
            "protocol": self.protocol,
            "port": self.port,
            "target_port": self.target_port,
            "health_check_path": self.health_check_path,
            "status": self.status,
            "provider_resource_id": self.provider_resource_id,
            "state_source": self.state_source or ("provider" if self.provider_resource_id else "registry-only"),
            "observed_at": self.observed_at.isoformat() + "Z" if self.observed_at else None,
            "last_error": self.last_error,
            "created_at": self.created_at.isoformat() + "Z" if self.created_at else None,
        }


class ArvFirewallRule(Base):
    __tablename__ = "arv_firewall_rules"
    id = Column(String(50), primary_key=True, default=lambda: f"fw-{uuid.uuid4().hex[:10]}")
    user_id = Column(String(50), nullable=True, index=True)
    vpc_id = Column(String(50), nullable=True)
    name = Column(String(100), nullable=False)
    direction = Column(String(10), default="INBOUND")
    protocol = Column(String(10), default="TCP")
    port_range = Column(String(20), default="443")
    source_cidr = Column(String(20), default="0.0.0.0/0")
    action = Column(String(10), default="ALLOW")
    priority = Column(Integer, default=100)
    status = Column(String(30), default="AWAITING_PROVIDER_SETUP")
    provider_resource_id = Column(String(100), nullable=True)
    state_source = Column(String(50), nullable=True)
    observed_at = Column(DateTime, nullable=True)
    last_error = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    def to_dict(self) -> dict:
        return {
            "id": self.id,
            "user_id": self.user_id,
            "vpc_id": self.vpc_id,
            "name": self.name,
            "direction": self.direction,
            "protocol": self.protocol,
            "port_range": self.port_range,
            "source_cidr": self.source_cidr,
            "action": self.action,
            "priority": self.priority,
            "status": self.status,
            "provider_resource_id": self.provider_resource_id,
            "state_source": self.state_source or ("provider" if self.provider_resource_id else "registry-only"),
            "observed_at": self.observed_at.isoformat() + "Z" if self.observed_at else None,
            "last_error": self.last_error,
            "created_at": self.created_at.isoformat() + "Z" if self.created_at else None,
        }