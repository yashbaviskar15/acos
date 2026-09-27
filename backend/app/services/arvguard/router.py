import uuid
import datetime
import json
from fastapi import APIRouter, Depends, HTTPException, status
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
    scores = db.query(ComplianceScore).filter(ComplianceScore.workspace_id == user.workspace_id).all()
    if scores:
        avg_score = int(sum(s.score for s in scores) / len(scores))
        return {
            "aggregate_score": avg_score,
            "frameworks": [s.to_dict() for s in scores]
        }
    violations = db.query(ComplianceViolation).filter(
        ComplianceViolation.workspace_id == user.workspace_id,
        ComplianceViolation.status == "open"
    ).count()
    calculated = max(0, 100 - (violations * 10))
    return {
        "aggregate_score": calculated,
        "frameworks": [
            {
                "framework": "ISO27001",
                "score": calculated,
                "total_policies": 0,
                "passed": 0,
                "failed": violations,
                "exempted": 0,
                "calculated_at": datetime.datetime.utcnow().isoformat()
            }
        ]
    }

@router.get("/policies")
def list_policies(db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    policies = db.query(CompliancePolicy).filter(CompliancePolicy.workspace_id == user.workspace_id).all()
    return [p.to_dict() for p in policies]

class PolicyCreate(BaseModel):
    framework: str
    name: str
    description: str
    rule_definition: dict = {}
    severity: str = "medium"
    enforcement: str = "warn"
    is_active: bool = True

@router.post("/policies", status_code=status.HTTP_201_CREATED)
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
    policy = db.query(CompliancePolicy).filter(CompliancePolicy.id == id, CompliancePolicy.workspace_id == user.workspace_id).first()
    if not policy:
        raise HTTPException(status_code=404, detail=f"Policy '{id}' not found")
    if update.name is not None:
        policy.name = update.name
    if update.description is not None:
        policy.description = update.description
    if update.rule_definition is not None:
        policy.rule_definition = json.dumps(update.rule_definition)
    if update.severity is not None:
        policy.severity = update.severity
    if update.enforcement is not None:
        policy.enforcement = update.enforcement
    if update.is_active is not None:
        policy.is_active = update.is_active
    policy.updated_at = datetime.datetime.utcnow()
    db.commit()
    db.refresh(policy)
    return policy.to_dict()

@router.delete("/policies/{id}")
def delete_policy(id: str, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    policy = db.query(CompliancePolicy).filter(CompliancePolicy.id == id, CompliancePolicy.workspace_id == user.workspace_id).first()
    if not policy:
        raise HTTPException(status_code=404, detail=f"Policy '{id}' not found")
    db.delete(policy)
    db.commit()
    return {"status": "success", "id": id, "message": "Policy deleted successfully"}

@router.get("/violations")
def list_violations(db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    violations = db.query(ComplianceViolation).filter(ComplianceViolation.workspace_id == user.workspace_id).all()
    return [v.to_dict() for v in violations]

@router.post("/check/{resource_id}")
def check_compliance(resource_id: str, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    violations = db.query(ComplianceViolation).filter(
        ComplianceViolation.resource_id == resource_id,
        ComplianceViolation.workspace_id == user.workspace_id,
        ComplianceViolation.status == "open"
    ).all()
    return {
        "resource_id": resource_id,
        "status": "non_compliant" if violations else "compliant",
        "violations_found": len(violations),
        "violations": [v.to_dict() for v in violations],
        "checked_at": datetime.datetime.utcnow().isoformat()
    }

@router.post("/remediate/{violation_id}")
def remediate_violation(violation_id: str, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    violation = db.query(ComplianceViolation).filter(
        ComplianceViolation.id == violation_id,
        ComplianceViolation.workspace_id == user.workspace_id
    ).first()
    if not violation:
        raise HTTPException(status_code=404, detail=f"Violation '{violation_id}' not found")
    violation.status = "resolved"
    violation.resolved_at = datetime.datetime.utcnow()
    db.commit()
    db.refresh(violation)
    return violation.to_dict()

@router.get("/frameworks")
def list_frameworks(db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    return [
        {"id": "RBI", "name": "Reserve Bank of India", "description": "Guidelines for cyber security in banking."},
        {"id": "DPDP", "name": "Digital Personal Data Protection Act", "description": "Data privacy rules for India."},
        {"id": "ISO27001", "name": "ISO/IEC 27001", "description": "Information security management system."},
        {"id": "SOC2", "name": "SOC 2 Type II", "description": "Service Organization Control trust services criteria."}
    ]
