"""
Aravanta Cloud OS — Control Plane Models
Defines multi-tenancy hierarchy (Organization -> Project -> Resource),
asynchronous Jobs, and Event Audit trails.
"""
import uuid
import json
import datetime
from sqlalchemy import Column, String, Integer, DateTime, Text, ForeignKey, Boolean
from sqlalchemy.orm import relationship
from app.core.database import Base


def _gen_id(prefix: str) -> str:
    return f"{prefix}-{uuid.uuid4().hex[:12]}"


class Organization(Base):
    __tablename__ = "organizations"

    id = Column(String(50), primary_key=True, index=True, default=lambda: _gen_id("org"))
    name = Column(String(100), nullable=False)
    slug = Column(String(100), unique=True, index=True, nullable=False)
    owner_id = Column(String(36), index=True, nullable=False)
    created_at = Column(DateTime, default=datetime.datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow, nullable=False)

    def to_dict(self) -> dict:
        return {
            "id": self.id,
            "name": self.name,
            "slug": self.slug,
            "owner_id": self.owner_id,
            "created_at": self.created_at.isoformat() + "Z" if self.created_at else None,
            "updated_at": self.updated_at.isoformat() + "Z" if self.updated_at else None,
        }


class Project(Base):
    __tablename__ = "projects"

    id = Column(String(50), primary_key=True, index=True, default=lambda: _gen_id("prj"))
    organization_id = Column(String(50), index=True, nullable=False)
    name = Column(String(100), nullable=False)
    slug = Column(String(100), index=True, nullable=False)
    region = Column(String(50), default="arv-us-east-1", nullable=False)
    description = Column(Text, default="", nullable=False)
    created_at = Column(DateTime, default=datetime.datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow, nullable=False)

    def to_dict(self) -> dict:
        return {
            "id": self.id,
            "organization_id": self.organization_id,
            "name": self.name,
            "slug": self.slug,
            "region": self.region,
            "description": self.description,
            "created_at": self.created_at.isoformat() + "Z" if self.created_at else None,
            "updated_at": self.updated_at.isoformat() + "Z" if self.updated_at else None,
        }


class Membership(Base):
    __tablename__ = "memberships"

    id = Column(String(50), primary_key=True, index=True, default=lambda: _gen_id("mem"))
    organization_id = Column(String(50), index=True, nullable=False)
    user_id = Column(String(36), index=True, nullable=False)
    role = Column(String(50), default="Developer", nullable=False)  # Owner, Admin, Developer, Viewer, Billing
    created_at = Column(DateTime, default=datetime.datetime.utcnow, nullable=False)

    def to_dict(self) -> dict:
        return {
            "id": self.id,
            "organization_id": self.organization_id,
            "user_id": self.user_id,
            "role": self.role,
            "created_at": self.created_at.isoformat() + "Z" if self.created_at else None,
        }


class ResourceRecord(Base):
    """
    Unified Resource Model for all Cloud Services (Compute, Storage, Network, Database, Container).
    Tracks both Desired State and Observed State for Control Plane reconciliation.
    """
    __tablename__ = "cloud_resources"

    id = Column(String(50), primary_key=True, index=True, default=lambda: _gen_id("res"))
    name = Column(String(100), index=True, nullable=False)
    type = Column(String(50), index=True, nullable=False)  # compute, storage, database, network, container
    organization_id = Column(String(50), index=True, nullable=False)
    project_id = Column(String(50), index=True, nullable=False)
    region = Column(String(50), default="arv-us-east-1", nullable=False)
    
    # State Reconciliation: PENDING -> PROVISIONING -> RUNNING / READY -> STOPPED -> TERMINATED / ERROR
    status = Column(String(30), default="PENDING", index=True, nullable=False)
    desired_state = Column(String(30), default="RUNNING", nullable=False)
    observed_state = Column(String(30), default="PENDING", nullable=False)
    
    spec = Column(Text, default="{}", nullable=False)  # CPU, RAM, disk, engine, ports, etc.
    metadata_json = Column(Text, default="{}", nullable=False)  # IPs, endpoints, provider details
    tags = Column(Text, default="{}", nullable=False)
    owner_id = Column(String(36), index=True, nullable=False)
    
    created_at = Column(DateTime, default=datetime.datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow, nullable=False)

    def to_dict(self) -> dict:
        try:
            parsed_spec = json.loads(self.spec) if self.spec else {}
        except Exception:
            parsed_spec = {}
        try:
            parsed_meta = json.loads(self.metadata_json) if self.metadata_json else {}
        except Exception:
            parsed_meta = {}
        try:
            parsed_tags = json.loads(self.tags) if self.tags else {}
        except Exception:
            parsed_tags = {}

        return {
            "id": self.id,
            "name": self.name,
            "type": self.type,
            "organization_id": self.organization_id,
            "project_id": self.project_id,
            "region": self.region,
            "status": self.status,
            "desired_state": self.desired_state,
            "observed_state": self.observed_state,
            "spec": parsed_spec,
            "metadata": parsed_meta,
            "tags": parsed_tags,
            "owner_id": self.owner_id,
            "created_at": self.created_at.isoformat() + "Z" if self.created_at else None,
            "updated_at": self.updated_at.isoformat() + "Z" if self.updated_at else None,
        }


class JobRecord(Base):
    """
    Asynchronous job execution model for operations that must not block the API.
    States: QUEUED, RUNNING, SUCCEEDED, FAILED, CANCELLED.
    """
    __tablename__ = "control_plane_jobs"

    id = Column(String(50), primary_key=True, index=True, default=lambda: _gen_id("job"))
    organization_id = Column(String(50), index=True, nullable=False)
    project_id = Column(String(50), index=True, nullable=False)
    resource_id = Column(String(50), index=True, nullable=True)
    action = Column(String(100), nullable=False)  # create, start, stop, restart, delete, deploy
    status = Column(String(30), default="QUEUED", index=True, nullable=False)
    result = Column(Text, default="{}", nullable=False)
    error_message = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow, nullable=False)

    def to_dict(self) -> dict:
        try:
            parsed_result = json.loads(self.result) if self.result else {}
        except Exception:
            parsed_result = {}
        return {
            "id": self.id,
            "organization_id": self.organization_id,
            "project_id": self.project_id,
            "resource_id": self.resource_id,
            "action": self.action,
            "status": self.status,
            "result": parsed_result,
            "error_message": self.error_message,
            "created_at": self.created_at.isoformat() + "Z" if self.created_at else None,
            "updated_at": self.updated_at.isoformat() + "Z" if self.updated_at else None,
        }


class EventRecord(Base):
    """
    Internal platform audit and state-transition event bus model.
    """
    __tablename__ = "control_plane_events"

    id = Column(String(50), primary_key=True, index=True, default=lambda: _gen_id("evt"))
    organization_id = Column(String(50), index=True, nullable=False)
    project_id = Column(String(50), index=True, nullable=True)
    resource_id = Column(String(50), index=True, nullable=True)
    event_type = Column(String(100), index=True, nullable=False)  # ResourceCreated, ResourceStateChanged, etc.
    payload = Column(Text, default="{}", nullable=False)
    timestamp = Column(DateTime, default=datetime.datetime.utcnow, nullable=False)

    def to_dict(self) -> dict:
        try:
            parsed_payload = json.loads(self.payload) if self.payload else {}
        except Exception:
            parsed_payload = {}
        return {
            "id": self.id,
            "organization_id": self.organization_id,
            "project_id": self.project_id,
            "resource_id": self.resource_id,
            "event_type": self.event_type,
            "payload": parsed_payload,
            "timestamp": self.timestamp.isoformat() + "Z" if self.timestamp else None,
        }
