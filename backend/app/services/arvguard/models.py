import uuid
import datetime
import json
from sqlalchemy import Column, String, Integer, Boolean, DateTime, Text
from app.core.database import Base

class CompliancePolicy(Base):
    __tablename__ = "compliance_policies"
    id = Column(String(50), primary_key=True, index=True, default=lambda: f"pol-{uuid.uuid4().hex[:12]}")
    workspace_id = Column(String(50), index=True)
    framework = Column(String(50))
    name = Column(String(200))
    description = Column(Text)
    rule_definition = Column(Text, default="{}")
    severity = Column(String(20))
    enforcement = Column(String(20), default="warn")
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)

    def to_dict(self):
        return {
            "id": self.id,
            "workspace_id": self.workspace_id,
            "framework": self.framework,
            "name": self.name,
            "description": self.description,
            "rule_definition": json.loads(self.rule_definition) if self.rule_definition else {},
            "severity": self.severity,
            "enforcement": self.enforcement,
            "is_active": self.is_active,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None
        }

class ComplianceViolation(Base):
    __tablename__ = "compliance_violations"
    id = Column(String(50), primary_key=True, index=True, default=lambda: f"vio-{uuid.uuid4().hex[:12]}")
    policy_id = Column(String(50), index=True)
    resource_id = Column(String(50))
    resource_type = Column(String(50))
    workspace_id = Column(String(50), index=True)
    description = Column(Text)
    remediation_steps = Column(Text, default="{}")
    status = Column(String(20), default="open")
    detected_at = Column(DateTime, default=datetime.datetime.utcnow)
    resolved_at = Column(DateTime, nullable=True)

    def to_dict(self):
        return {
            "id": self.id,
            "policy_id": self.policy_id,
            "resource_id": self.resource_id,
            "resource_type": self.resource_type,
            "workspace_id": self.workspace_id,
            "description": self.description,
            "remediation_steps": json.loads(self.remediation_steps) if self.remediation_steps else {},
            "status": self.status,
            "detected_at": self.detected_at.isoformat() if self.detected_at else None,
            "resolved_at": self.resolved_at.isoformat() if self.resolved_at else None
        }

class ComplianceScore(Base):
    __tablename__ = "compliance_scores"
    id = Column(String(50), primary_key=True, index=True, default=lambda: f"cscr-{uuid.uuid4().hex[:12]}")
    workspace_id = Column(String(50), index=True)
    framework = Column(String(50))
    score = Column(Integer, default=0)
    total_policies = Column(Integer, default=0)
    passed = Column(Integer, default=0)
    failed = Column(Integer, default=0)
    exempted = Column(Integer, default=0)
    calculated_at = Column(DateTime, default=datetime.datetime.utcnow)

    def to_dict(self):
        return {
            "id": self.id,
            "workspace_id": self.workspace_id,
            "framework": self.framework,
            "score": self.score,
            "total_policies": self.total_policies,
            "passed": self.passed,
            "failed": self.failed,
            "exempted": self.exempted,
            "calculated_at": self.calculated_at.isoformat() if self.calculated_at else None
        }
