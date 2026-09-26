import uuid
from datetime import datetime
from sqlalchemy import Column, String, Integer, Text, Boolean, DateTime, ForeignKey, JSON
from sqlalchemy.orm import relationship
from app.core.database import Base

def gen_fn_id():
    return f"fn-{uuid.uuid4().hex}"

def gen_inv_id():
    return f"inv-{uuid.uuid4().hex}"

class ArvFunction(Base):
    __tablename__ = "arv_functions"

    id = Column(String, primary_key=True, default=gen_fn_id)
    project_id = Column(String, index=True)
    name = Column(String, index=True)
    runtime = Column(String, default="python3.11")
    handler = Column(String)
    memory_mb = Column(Integer, default=256)
    timeout_seconds = Column(Integer, default=30)
    code_bundle_url = Column(String, nullable=True)
    code = Column(Text, nullable=True)
    env_vars = Column(JSON, default=dict)
    trigger_type = Column(String, default="http")
    trigger_config = Column(JSON, default=dict)
    status = Column(String, default="ACTIVE")
    invocation_count = Column(Integer, default=0)
    last_invoked_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    invocations = relationship("ArvFunctionInvocation", back_populates="function", cascade="all, delete-orphan")

    def to_dict(self):
        return {
            "id": self.id,
            "project_id": self.project_id,
            "name": self.name,
            "runtime": self.runtime,
            "handler": self.handler,
            "memory_mb": self.memory_mb,
            "timeout_seconds": self.timeout_seconds,
            "code_bundle_url": self.code_bundle_url,
            "code": self.code,
            "env_vars": self.env_vars,
            "trigger_type": self.trigger_type,
            "trigger_config": self.trigger_config,
            "status": self.status,
            "invocation_count": self.invocation_count,
            "last_invoked_at": self.last_invoked_at.isoformat() if self.last_invoked_at else None,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
        }

class ArvFunctionInvocation(Base):
    __tablename__ = "arv_function_invocations"

    id = Column(String, primary_key=True, default=gen_inv_id)
    function_id = Column(String, ForeignKey("arv_functions.id"))
    status = Column(String, default="SUCCESS")
    duration_ms = Column(Integer, default=0)
    billed_duration_ms = Column(Integer, default=0)
    memory_used_mb = Column(Integer, default=0)
    request_payload = Column(Text, nullable=True)
    response_payload = Column(Text, nullable=True)
    error_message = Column(Text, nullable=True)
    timestamp = Column(DateTime, default=datetime.utcnow)

    function = relationship("ArvFunction", back_populates="invocations")

    def to_dict(self):
        return {
            "id": self.id,
            "function_id": self.function_id,
            "status": self.status,
            "duration_ms": self.duration_ms,
            "billed_duration_ms": self.billed_duration_ms,
            "memory_used_mb": self.memory_used_mb,
            "request_payload": self.request_payload,
            "response_payload": self.response_payload,
            "error_message": self.error_message,
            "timestamp": self.timestamp.isoformat() if self.timestamp else None,
        }
