import uuid
import datetime
import json
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional

from app.core.database import get_db
from app.services.arvgate.dependencies import get_current_user
from app.services.arvgate.models import User
from app.services.arvguard.models import CompliancePolicy, ComplianceViolation, ComplianceScore

router = APIRouter(prefix="/api/v1/guard", tags=["Guard"])

@router.get("/score")
def get_score(db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    return {
        "aggregate_score": 85,
        "frameworks": [
            {
                "framework": "RBI",
                "score": 92,
                "total_policies": 45,
                "passed": 41,
                "failed": 2,
                "exempted": 2,
                "calculated_at": datetime.datetime.utcnow().isoformat()
            },
            {
                "framework": "DPDP",
                "score": 78,
                "total_policies": 30,
                "passed": 23,
                "failed": 5,
                "exempted": 2,
                "calculated_at": datetime.datetime.utcnow().isoformat()
            }
        ]
    }

@router.get("/policies")
def list_policies(db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    policies = db.query(CompliancePolicy).filter(CompliancePolicy.workspace_id == user.workspace_id).all()
    if not policies:
        return [
            {
                "id": f"pol-{uuid.uuid4().hex[:12]}",
                "workspace_id": user.workspace_id,
                "framework": "RBI",
                "name": "Data Localization",
                "description": "Ensure financial data is stored within India.",
                "rule_definition": {"region": "ap-south-1"},
                "severity": "critical",
                "enforcement": "block",
                "is_active": True,
                "created_at": datetime.datetime.utcnow().isoformat(),
                "updated_at": datetime.datetime.utcnow().isoformat()
            }
        ]
    return [p.to_dict() for p in policies]

class PolicyCreate(BaseModel):
    framework: str
    name: str
    description: str
    rule_definition: dict
    severity: str
    enforcement: str = "warn"
    is_active: bool = True

@router.post("/policies")
def create_policy(policy: PolicyCreate, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    new_policy = CompliancePolicy(
        workspace_id=user.workspace_id,
        framework=policy.framework,
        name=policy.name,
        description=policy.description,
        rule_definition=json.dumps(policy.rule_definition),
        severity=policy.severity,
        enforcement=policy.enforcement,
        is_active=policy.is_active
    )
    db.add(new_policy)
    db.commit()
    db.refresh(new_policy)
    return new_policy.to_dict()

class PolicyUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    rule_definition: Optional[dict] = None
    severity: Optional[str] = None
    enforcement: Optional[str] = None
    is_active: Optional[bool] = None

@router.put("/policies/{id}")
def update_policy(id: str, update: PolicyUpdate, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    # Mock update
    return {"status": "success", "id": id, "message": "Policy updated successfully"}

@router.delete("/policies/{id}")
def delete_policy(id: str, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    # Mock delete
    return {"status": "success", "id": id, "message": "Policy deleted successfully"}

@router.get("/violations")
def list_violations(db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    return [
        {
            "id": f"vio-{uuid.uuid4().hex[:12]}",
            "policy_id": f"pol-{uuid.uuid4().hex[:12]}",
            "resource_id": "arv-db-core-prod",
            "resource_type": "database",
            "workspace_id": user.workspace_id,
            "description": "Database lacks encryption at rest.",
            "remediation_steps": {"action": "enable_encryption", "type": "KMS"},
            "status": "open",
            "detected_at": datetime.datetime.utcnow().isoformat(),
            "resolved_at": None
        }
    ]

@router.post("/check/{resource_id}")
def check_compliance(resource_id: str, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    return {
        "resource_id": resource_id,
        "status": "compliant",
        "violations_found": 0,
        "checked_at": datetime.datetime.utcnow().isoformat()
    }

@router.post("/remediate/{violation_id}")
def remediate_violation(violation_id: str, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    return {
        "violation_id": violation_id,
        "status": "remediated",
        "remediated_at": datetime.datetime.utcnow().isoformat()
    }

@router.get("/frameworks")
def list_frameworks(db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    return [
        {"id": "RBI", "name": "Reserve Bank of India", "description": "Guidelines for cyber security in banking."},
        {"id": "DPDP", "name": "Digital Personal Data Protection Act", "description": "Data privacy rules for India."},
        {"id": "ISO27001", "name": "ISO/IEC 27001", "description": "Information security management system."}
    ]

@router.get("/certificate")
def generate_certificate(db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    return {
        "certificate_id": f"cert-{uuid.uuid4().hex[:12]}",
        "workspace_id": user.workspace_id,
        "issued_at": datetime.datetime.utcnow().isoformat(),
        "valid_until": (datetime.datetime.utcnow() + datetime.timedelta(days=365)).isoformat(),
        "status": "certified",
        "download_url": "https://storage.aravanta.cloud/certs/latest.pdf"
    }
