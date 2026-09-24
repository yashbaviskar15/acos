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
    status = Column(String(20), default="ACTIVE")
    is_default = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)


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
    status = Column(String(20), default="ACTIVE")
    created_at = Column(DateTime, default=datetime.datetime.utcnow)


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
    created_at = Column(DateTime, default=datetime.datetime.utcnow)