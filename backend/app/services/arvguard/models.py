import uuid
import datetime
import json
from sqlalchemy import Column, String, Integer, Boolean, DateTime, Text, Float
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

class StrixScanRun(Base):
    __tablename__ = "strix_scan_runs"
    id = Column(String(50), primary_key=True, index=True, default=lambda: f"strix-run-{uuid.uuid4().hex[:12]}")
    workspace_id = Column(String(50), index=True)
    target = Column(String(255))
    target_type = Column(String(50), default="web_app")      # web_app, api, codebase
    scan_mode = Column(String(50), default="quick")          # quick, standard, deep
    instruction = Column(Text, nullable=True)
    max_budget = Column(Float, nullable=True)
    status = Column(String(50), default="QUEUED")            # QUEUED, RUNNING, SUCCEEDED, FAILED, AWAITING_PROVIDER_SETUP
    runner_type = Column(String(50), default="local_docker") # local_docker, cloud_api, cli
    job_id = Column(String(50), nullable=True)
    started_at = Column(DateTime, default=datetime.datetime.utcnow)
    completed_at = Column(DateTime, nullable=True)
    raw_logs = Column(Text, default="")
    summary = Column(Text, default="{}")
    error_message = Column(Text, nullable=True)
    state_source = Column(String(50), default="strix-agent")
    observed_at = Column(DateTime, default=datetime.datetime.utcnow)

    def to_dict(self):
        return {
            "id": self.id,
            "workspace_id": self.workspace_id,
            "target": self.target,
            "target_type": self.target_type,
            "scan_mode": self.scan_mode,
            "instruction": self.instruction,
            "max_budget": self.max_budget,
            "status": self.status,
            "runner_type": self.runner_type,
            "job_id": self.job_id,
            "started_at": self.started_at.isoformat() if self.started_at else None,
            "completed_at": self.completed_at.isoformat() if self.completed_at else None,
            "raw_logs": self.raw_logs,
            "summary": json.loads(self.summary) if self.summary else {},
            "error_message": self.error_message,
            "state_source": self.state_source,
            "observed_at": self.observed_at.isoformat() if self.observed_at else None,
        }

class StrixFinding(Base):
    __tablename__ = "strix_findings"
    id = Column(String(50), primary_key=True, index=True, default=lambda: f"strix-fnd-{uuid.uuid4().hex[:12]}")
    run_id = Column(String(50), index=True)
    workspace_id = Column(String(50), index=True)
    title = Column(String(255))
    description = Column(Text)
    severity = Column(String(20), default="medium") # critical, high, medium, low, info
    cvss_score = Column(Float, nullable=True)
    owasp_category = Column(String(100), nullable=True)
    affected_endpoint = Column(String(255), nullable=True)
    proof_of_concept = Column(Text, nullable=True) # Working curl command, HTTP payload or script
    remediation_patch = Column(Text, nullable=True) # Actionable code patch / guidance
    status = Column(String(20), default="open")     # open, resolved, retesting, false_positive
    state_source = Column(String(50), default="strix-agent")
    detected_at = Column(DateTime, default=datetime.datetime.utcnow)
    resolved_at = Column(DateTime, nullable=True)

    def to_dict(self):
        return {
            "id": self.id,
            "run_id": self.run_id,
            "workspace_id": self.workspace_id,
            "title": self.title,
            "description": self.description,
            "severity": self.severity,
            "cvss_score": self.cvss_score,
            "owasp_category": self.owasp_category,
            "affected_endpoint": self.affected_endpoint,
            "proof_of_concept": self.proof_of_concept,
            "remediation_patch": self.remediation_patch,
            "status": self.status,
            "state_source": self.state_source,
            "detected_at": self.detected_at.isoformat() if self.detected_at else None,
            "resolved_at": self.resolved_at.isoformat() if self.resolved_at else None,
        }
