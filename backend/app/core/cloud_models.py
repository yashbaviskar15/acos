"""
Aravanta CloudOS — Persistent Cloud Management Models
Provides real SQLAlchemy models for Compute VMs, K8s Clusters, S3 Buckets,
Managed Databases, Applications, Deployments, Incidents, Alerts, and Notifications.
"""
import datetime
import uuid
import json
from typing import Optional, List, Dict, Any
from sqlalchemy import (
    Column, String, Integer, Float, Boolean, DateTime, Text, ForeignKey
)
from app.core.database import Base


class Notification(Base):
    __tablename__ = "notifications"

    id = Column(String(36), primary_key=True, index=True, default=lambda: f"notif-{uuid.uuid4().hex[:12]}")
    user_id = Column(String(36), index=True, nullable=False)
    workspace_id = Column(String(50), index=True, nullable=True)
    title = Column(String(255), nullable=False)
    desc = Column(Text, nullable=False)
    type = Column(String(30), default="info", nullable=False)  # info, success, warning, error
    read = Column(Boolean, default=False, nullable=False)
    link = Column(String(255), nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow, nullable=False)

    def to_dict(self) -> dict:
        return {
            "id": self.id,
            "title": self.title,
            "desc": self.desc,
            "message": self.desc,
            "type": self.type,
            "read": self.read,
            "link": self.link,
            "time": self.created_at.strftime("%I:%M %p") if self.created_at else "Just now",
            "created_at": self.created_at.isoformat() + "Z" if self.created_at else datetime.datetime.utcnow().isoformat() + "Z",
        }


class ComputeInstance(Base):
    __tablename__ = "compute_instances"

    id = Column(String(50), primary_key=True, index=True)
    user_id = Column(String(36), index=True, nullable=False)
    workspace_id = Column(String(50), index=True, nullable=True)
    name = Column(String(100), index=True, nullable=False)
    instance_type = Column(String(50), default="arv.medium", nullable=False)
    os_image = Column(String(100), default="Ubuntu 22.04 LTS", nullable=False)
    region = Column(String(50), default="arv-us-east-1", nullable=False)
    status = Column(String(20), default="RUNNING", nullable=False)  # RUNNING, STOPPED, TERMINATED
    private_ip = Column(String(50), nullable=False)
    public_ip = Column(String(50), nullable=True)
    cpu_usage = Column(Float, default=5.0)
    ram_usage = Column(Float, default=20.0)
    disk_gb = Column(Integer, default=50)
    tags = Column(Text, default="{}")
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow)

    def to_dict(self) -> dict:
        try:
            parsed_tags = json.loads(self.tags) if self.tags else {}
        except Exception:
            parsed_tags = {}
        return {
            "id": self.id,
            "name": self.name,
            "instance_type": self.instance_type,
            "os_image": self.os_image,
            "region": self.region,
            "status": self.status,
            "private_ip": self.private_ip,
            "public_ip": self.public_ip,
            "cpu_usage": self.cpu_usage,
            "ram_usage": self.ram_usage,
            "disk_gb": self.disk_gb,
            "tags": parsed_tags,
            "launched_at": self.created_at.isoformat() + "Z" if self.created_at else datetime.datetime.utcnow().isoformat() + "Z",
            "created_at": self.created_at.isoformat() + "Z" if self.created_at else datetime.datetime.utcnow().isoformat() + "Z",
        }


class KubeCluster(Base):
    __tablename__ = "kube_clusters"

    id = Column(String(50), primary_key=True, index=True)
    user_id = Column(String(36), index=True, nullable=False)
    workspace_id = Column(String(50), index=True, nullable=True)
    name = Column(String(100), index=True, nullable=False)
    version = Column(String(20), default="1.30.1", nullable=False)
    region = Column(String(50), default="arv-us-east-1", nullable=False)
    status = Column(String(20), default="ACTIVE", nullable=False)
    node_count = Column(Integer, default=3)
    node_size = Column(String(50), default="arv.large")
    endpoint = Column(String(255), nullable=False)
    cpu_cores_total = Column(Integer, default=12)
    ram_gb_total = Column(Integer, default=48)
    pod_count = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    def to_dict(self) -> dict:
        return {
            "id": self.id,
            "name": self.name,
            "version": self.version,
            "region": self.region,
            "status": self.status,
            "node_count": self.node_count,
            "node_size": self.node_size,
            "endpoint": self.endpoint,
            "cpu_cores_total": self.cpu_cores_total,
            "ram_gb_total": self.ram_gb_total,
            "pod_count": self.pod_count,
            "created_at": self.created_at.isoformat() + "Z" if self.created_at else datetime.datetime.utcnow().isoformat() + "Z",
        }


class StorageBucket(Base):
    __tablename__ = "storage_buckets"

    id = Column(String(50), primary_key=True, index=True)
    user_id = Column(String(36), index=True, nullable=False)
    workspace_id = Column(String(50), index=True, nullable=True)
    name = Column(String(100), index=True, nullable=False)
    region = Column(String(50), default="arv-us-east-1", nullable=False)
    storage_class = Column(String(50), default="STANDARD", nullable=False)
    size_gb = Column(Float, default=0.0)
    object_count = Column(Integer, default=0)
    versioning = Column(Boolean, default=False)
    encryption = Column(String(50), default="AES-256")
    access = Column(String(50), default="PRIVATE")
    monthly_cost = Column(Float, default=0.0)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    def to_dict(self) -> dict:
        return {
            "id": self.id,
            "name": self.name,
            "region": self.region,
            "storage_class": self.storage_class,
            "size_gb": round(self.size_gb, 2),
            "object_count": self.object_count,
            "versioning": self.versioning,
            "encryption": self.encryption,
            "access": self.access,
            "monthly_cost": round(self.size_gb * 0.023, 2),
            "created_at": self.created_at.isoformat() + "Z" if self.created_at else datetime.datetime.utcnow().isoformat() + "Z",
        }


class StorageObject(Base):
    __tablename__ = "storage_objects"

    id = Column(String(50), primary_key=True, index=True, default=lambda: f"obj-{uuid.uuid4().hex[:12]}")
    bucket_id = Column(String(50), index=True, nullable=False)
    key = Column(String(255), index=True, nullable=False)
    size_bytes = Column(Integer, default=0)
    storage_class = Column(String(50), default="STANDARD")
    content_type = Column(String(100), default="application/octet-stream")
    last_modified = Column(DateTime, default=datetime.datetime.utcnow)

    def to_dict(self) -> dict:
        return {
            "id": self.id,
            "key": self.key,
            "size_bytes": self.size_bytes,
            "storage_class": self.storage_class,
            "content_type": self.content_type,
            "last_modified": self.last_modified.isoformat() + "Z" if self.last_modified else datetime.datetime.utcnow().isoformat() + "Z",
        }


class DatabaseInstance(Base):
    __tablename__ = "database_instances"

    id = Column(String(50), primary_key=True, index=True)
    user_id = Column(String(36), index=True, nullable=False)
    workspace_id = Column(String(50), index=True, nullable=True)
    name = Column(String(100), index=True, nullable=False)
    engine = Column(String(50), default="PostgreSQL 16", nullable=False)
    tier = Column(String(50), default="db.arv.medium", nullable=False)
    region = Column(String(50), default="arv-us-east-1", nullable=False)
    storage_gb = Column(Integer, default=100)
    storage_used_gb = Column(Float, default=0.0)
    status = Column(String(20), default="AVAILABLE", nullable=False)
    endpoint = Column(String(255), nullable=False)
    port = Column(String(10), default="5432")
    connection_count = Column(Integer, default=0)
    max_connections = Column(Integer, default=200)
    latency_ms = Column(Float, default=1.5)
    iops = Column(Integer, default=3000)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    def to_dict(self) -> dict:
        return {
            "id": self.id,
            "name": self.name,
            "engine": self.engine,
            "tier": self.tier,
            "region": self.region,
            "storage_gb": self.storage_gb,
            "storage_used_gb": self.storage_used_gb,
            "status": self.status,
            "endpoint": self.endpoint,
            "port": self.port,
            "connection_count": self.connection_count,
            "max_connections": self.max_connections,
            "latency_ms": self.latency_ms,
            "iops": self.iops,
            "created_at": self.created_at.isoformat() + "Z" if self.created_at else datetime.datetime.utcnow().isoformat() + "Z",
        }


class ApplicationRecord(Base):
    __tablename__ = "applications"

    id = Column(String(50), primary_key=True, index=True)
    user_id = Column(String(36), index=True, nullable=False)
    workspace_id = Column(String(50), index=True, nullable=True)
    name = Column(String(100), index=True, nullable=False)
    environment = Column(String(50), default="production", nullable=False)
    version = Column(String(50), default="v1.0.0", nullable=False)
    previous_version = Column(String(50), nullable=True)
    replicas = Column(Integer, default=1)
    target_replicas = Column(Integer, default=1)
    status = Column(String(20), default="HEALTHY", nullable=False)
    health_percent = Column(Float, default=100.0)
    error_rate_percent = Column(Float, default=0.0)
    cpu_usage_m = Column(Integer, default=100)
    memory_usage_mb = Column(Integer, default=200)
    p95_latency_ms = Column(Float, default=20.0)
    requests_per_sec = Column(Integer, default=50)
    strategy = Column(String(50), default="RollingUpdate")
    image = Column(String(255), default="aravanta/service:v1.0.0")
    repository = Column(String(255), nullable=True)
    endpoints = Column(Text, default="[]")
    ports = Column(Text, default="[80]")
    env_vars = Column(Text, default="{}")
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    last_deployed_at = Column(DateTime, default=datetime.datetime.utcnow)

    def to_dict(self) -> dict:
        try:
            ep = json.loads(self.endpoints) if self.endpoints else []
        except Exception:
            ep = [f"https://{self.name}.aravanta.cloud"]
        try:
            p = json.loads(self.ports) if self.ports else [80]
        except Exception:
            p = [80]
        try:
            ev = json.loads(self.env_vars) if self.env_vars else {}
        except Exception:
            ev = {}
        return {
            "id": self.id,
            "name": self.name,
            "environment": self.environment,
            "version": self.version,
            "previous_version": self.previous_version,
            "replicas": self.replicas,
            "target_replicas": self.target_replicas,
            "status": self.status,
            "health_percent": self.health_percent,
            "error_rate_percent": self.error_rate_percent,
            "cpu_usage_m": self.cpu_usage_m,
            "memory_usage_mb": self.memory_usage_mb,
            "p95_latency_ms": self.p95_latency_ms,
            "requests_per_sec": self.requests_per_sec,
            "strategy": self.strategy,
            "image": self.image,
            "repository": self.repository,
            "endpoints": ep,
            "ports": p,
            "env_vars": ev,
            "created_at": self.created_at.isoformat() + "Z" if self.created_at else datetime.datetime.utcnow().isoformat() + "Z",
            "last_deployed_at": self.last_deployed_at.isoformat() + "Z" if self.last_deployed_at else datetime.datetime.utcnow().isoformat() + "Z",
        }


class DeploymentRecord(Base):
    __tablename__ = "deployments"

    id = Column(String(50), primary_key=True, index=True)
    user_id = Column(String(36), index=True, nullable=False)
    workspace_id = Column(String(50), index=True, nullable=True)
    application_id = Column(String(50), index=True, nullable=False)
    application_name = Column(String(100), nullable=False)
    environment = Column(String(50), default="production")
    version = Column(String(50), nullable=False)
    image = Column(String(255), nullable=False)
    strategy = Column(String(50), default="RollingUpdate")
    replicas = Column(Integer, default=1)
    status = Column(String(20), default="SUCCESSFUL")
    trigger = Column(String(100), default="manual release")
    commit_hash = Column(String(50), nullable=True)
    commit_message = Column(String(255), nullable=True)
    author = Column(String(100), nullable=True)
    duration_seconds = Column(Integer, default=60)
    started_at = Column(DateTime, default=datetime.datetime.utcnow)
    finished_at = Column(DateTime, default=datetime.datetime.utcnow)

    def to_dict(self) -> dict:
        return {
            "id": self.id,
            "application_id": self.application_id,
            "application_name": self.application_name,
            "environment": self.environment,
            "version": self.version,
            "image": self.image,
            "strategy": self.strategy,
            "replicas": self.replicas,
            "status": self.status,
            "trigger": self.trigger,
            "commit_hash": self.commit_hash or "head",
            "commit_message": self.commit_message or "Release update",
            "author": self.author or "system",
            "duration_seconds": self.duration_seconds,
            "started_at": self.started_at.isoformat() + "Z" if self.started_at else datetime.datetime.utcnow().isoformat() + "Z",
            "finished_at": self.finished_at.isoformat() + "Z" if self.finished_at else datetime.datetime.utcnow().isoformat() + "Z",
        }


class IncidentRecord(Base):
    __tablename__ = "incidents"

    id = Column(String(50), primary_key=True, index=True)
    user_id = Column(String(36), index=True, nullable=False)
    workspace_id = Column(String(50), index=True, nullable=True)
    title = Column(String(255), nullable=False)
    severity = Column(String(20), default="P2")
    status = Column(String(20), default="Investigating")
    affected_service = Column(String(100), nullable=False)
    commander = Column(String(100), default="Platform Admin")
    detected_at = Column(DateTime, default=datetime.datetime.utcnow)
    resolved_at = Column(DateTime, nullable=True)
    timeline = Column(Text, default="[]")
    rca_notes = Column(Text, nullable=True)

    def to_dict(self) -> dict:
        try:
            tl = json.loads(self.timeline) if self.timeline else []
        except Exception:
            tl = []
        return {
            "id": self.id,
            "title": self.title,
            "severity": self.severity,
            "status": self.status,
            "affected_service": self.affected_service,
            "commander": self.commander,
            "detected_at": self.detected_at.isoformat() + "Z" if self.detected_at else datetime.datetime.utcnow().isoformat() + "Z",
            "resolved_at": self.resolved_at.isoformat() + "Z" if self.resolved_at else None,
            "timeline": tl,
            "rca_notes": self.rca_notes,
        }


class AlertRecord(Base):
    __tablename__ = "alerts"

    id = Column(String(50), primary_key=True, index=True)
    user_id = Column(String(36), index=True, nullable=False)
    workspace_id = Column(String(50), index=True, nullable=True)
    title = Column(String(255), nullable=False)
    severity = Column(String(20), default="warning")
    service = Column(String(100), nullable=False)
    message = Column(Text, nullable=False)
    status = Column(String(20), default="firing")
    fired_at = Column(DateTime, default=datetime.datetime.utcnow)

    def to_dict(self) -> dict:
        return {
            "id": self.id,
            "title": self.title,
            "severity": self.severity,
            "service": self.service,
            "message": self.message,
            "status": self.status,
            "fired_at": self.fired_at.isoformat() + "Z" if self.fired_at else datetime.datetime.utcnow().isoformat() + "Z",
        }


class WorkflowRecord(Base):
    __tablename__ = "workflows"

    id = Column(String(50), primary_key=True, index=True)
    user_id = Column(String(36), index=True, nullable=False)
    workspace_id = Column(String(50), index=True, nullable=True)
    name = Column(String(100), nullable=False)
    description = Column(Text, nullable=False)
    trigger = Column(String(100), nullable=False)
    target = Column(String(100), nullable=False)
    status = Column(String(20), default="ACTIVE")
    last_run = Column(DateTime, default=datetime.datetime.utcnow)
    last_status = Column(String(20), default="SUCCESSFUL")
    duration = Column(String(20), default="30s")
    run_count = Column(Integer, default=0)
    actions = Column(Text, default="[]")

    def to_dict(self) -> dict:
        try:
            act = json.loads(self.actions) if self.actions else []
        except Exception:
            act = []
        return {
            "id": self.id,
            "name": self.name,
            "description": self.description,
            "trigger": self.trigger,
            "target": self.target,
            "status": self.status,
            "last_run": self.last_run.isoformat() + "Z" if self.last_run else datetime.datetime.utcnow().isoformat() + "Z",
            "last_status": self.last_status,
            "duration": self.duration,
            "run_count": self.run_count,
            "actions": act,
        }


class BackupRecord(Base):
    __tablename__ = "backups"

    id = Column(String(50), primary_key=True, index=True)
    user_id = Column(String(36), index=True, nullable=False)
    workspace_id = Column(String(50), index=True, nullable=True)
    resource_name = Column(String(100), nullable=False)
    resource_type = Column(String(100), nullable=False)
    size_gb = Column(Float, default=1.0)
    region = Column(String(50), default="ap-south-1")
    status = Column(String(20), default="COMPLETED")
    retention_days = Column(Integer, default=30)
    storage_tier = Column(String(100), default="ArvStore Hot Storage (AES-256)")
    checksum = Column(String(100), default="sha256:e3b0c44298fc1c14")
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    def to_dict(self) -> dict:
        return {
            "id": self.id,
            "resource_name": self.resource_name,
            "resource_type": self.resource_type,
            "size_gb": round(self.size_gb, 2),
            "region": self.region,
            "status": self.status,
            "retention_days": self.retention_days,
            "storage_tier": self.storage_tier,
            "checksum": self.checksum,
            "created_at": self.created_at.isoformat() + "Z" if self.created_at else datetime.datetime.utcnow().isoformat() + "Z",
        }


class InvitationRecord(Base):
    __tablename__ = "invitations"

    id = Column(String(50), primary_key=True, index=True)
    token = Column(String(100), unique=True, index=True, nullable=False)
    workspace_id = Column(String(50), index=True, nullable=False)
    workspace_name = Column(String(100), nullable=False)
    email = Column(String(255), index=True, nullable=False)
    full_name = Column(String(255), nullable=True)
    role = Column(String(50), default="Developer")
    invited_by = Column(String(255), nullable=True)
    status = Column(String(20), default="PENDING")  # PENDING, ACCEPTED, REVOKED
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    expires_at = Column(DateTime, nullable=True)

    def to_dict(self) -> dict:
        return {
            "id": self.id,
            "token": self.token,
            "workspace_id": self.workspace_id,
            "workspace_name": self.workspace_name,
            "email": self.email,
            "full_name": self.full_name,
            "role": self.role,
            "invited_by": self.invited_by,
            "status": self.status,
            "created_at": self.created_at.isoformat() + "Z" if self.created_at else None,
            "expires_at": self.expires_at.isoformat() + "Z" if self.expires_at else None,
        }


class PaymentMethodRecord(Base):
    __tablename__ = "payment_methods"

    id = Column(String(50), primary_key=True, index=True)
    user_id = Column(String(36), index=True, nullable=False)
    workspace_id = Column(String(50), index=True, nullable=False)
    brand = Column(String(50), default="visa")
    last4 = Column(String(4), nullable=False)
    exp_month = Column(Integer, nullable=False)
    exp_year = Column(Integer, nullable=False)
    holder_name = Column(String(255), nullable=False)
    is_default = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    def to_dict(self) -> dict:
        return {
            "id": self.id,
            "brand": self.brand,
            "last4": self.last4,
            "exp_month": self.exp_month,
            "exp_year": self.exp_year,
            "holder_name": self.holder_name,
            "is_default": self.is_default,
            "created_at": self.created_at.isoformat() + "Z" if self.created_at else None,
        }


class InvoiceRecord(Base):
    __tablename__ = "invoices"

    id = Column(String(50), primary_key=True, index=True)
    user_id = Column(String(36), index=True, nullable=False)
    workspace_id = Column(String(50), index=True, nullable=False)
    period = Column(String(100), nullable=False)
    amount_inr = Column(Float, nullable=False)
    amount_usd = Column(Float, nullable=False)
    status = Column(String(20), default="PAID")
    payment_method = Column(String(100), default="Visa ending in 4242")
    date = Column(String(20), nullable=False)
    download_url = Column(String(255), nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    def to_dict(self) -> dict:
        return {
            "id": self.id,
            "period": self.period,
            "amount_inr": self.amount_inr,
            "amount_usd": self.amount_usd,
            "status": self.status,
            "payment_method": self.payment_method,
            "date": self.date,
            "download_url": self.download_url or f"/api/v1/operations/billing/invoices/{self.id}/pdf",
            "created_at": self.created_at.isoformat() + "Z" if self.created_at else None,
        }


def emit_notification(
    db,
    user_id: Optional[str] = None,
    title: str = "Notification",
    desc: Optional[str] = None,
    type: str = "info",
    workspace_id: Optional[str] = None,
    link: Optional[str] = None,
    message: Optional[str] = None,
    severity: Optional[str] = None,
    **kwargs
) -> Notification:
    """Helper to persist a real user notification from application lifecycle events."""
    description = desc or message or title
    notif_type = (type or severity or "info").lower()
    if notif_type not in ["info", "success", "warning", "error"]:
        notif_type = "info"
    uid = user_id or "usr-system"

    notif = Notification(
        id=f"notif-{uuid.uuid4().hex[:12]}",
        user_id=uid,
        workspace_id=workspace_id or "default",
        title=title,
        desc=description,
        type=notif_type,
        read=False,
        link=link,
        created_at=datetime.datetime.utcnow()
    )
    try:
        db.add(notif)
        db.commit()
        db.refresh(notif)
    except Exception:
        db.rollback()
    return notif
