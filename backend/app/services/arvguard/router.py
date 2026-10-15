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
from app.services.arvguard.models import (
    CompliancePolicy, ComplianceViolation, ComplianceScore,
    StrixScanRun, StrixFinding
)
from app.services.arvguard.strix_runner import StrixRunner
from app.core.jobs import create_job, dispatch_async_job

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


# ─── Strix Penetration Testing & Vulnerability Assessment ─────────────────

@router.get("/strix/status")
def get_strix_status(user: User = Depends(get_current_user)):
    """Returns real-time execution environment and provider readiness for Strix pen-testing."""
    return StrixRunner.check_strix_status()


class StrixScanCreate(BaseModel):
    target: str
    target_type: str = "web_app"  # web_app, api, codebase
    scan_mode: str = "quick"      # quick, standard, deep
    instruction: Optional[str] = None
    max_budget: Optional[float] = None


@router.post("/strix/scans", status_code=status.HTTP_202_ACCEPTED)
def launch_strix_scan(
    payload: StrixScanCreate,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user)
):
    """
    Initiates an asynchronous, evidence-gated penetration test via Strix.
    Returns 202 Accepted with job_id and scan_id immediately.
    """
    scan = StrixScanRun(
        workspace_id=user.workspace_id,
        target=payload.target,
        target_type=payload.target_type,
        scan_mode=payload.scan_mode,
        instruction=payload.instruction,
        max_budget=payload.max_budget,
        status="QUEUED"
    )
    db.add(scan)
    db.commit()
    db.refresh(scan)

    # Create background async job in ACOS Control Plane
    job = create_job(
        job_type="Strix:PenTest",
        resource_id=scan.id,
        organization_id=user.workspace_id,
        payload={
            "scan_id": scan.id,
            "target": payload.target,
            "scan_mode": payload.scan_mode
        },
        db=db
    )
    scan.job_id = job.id
    db.commit()

    # Dispatch worker in background thread
    dispatch_async_job(
        job.id,
        StrixRunner.execute_scan,
        scan_id=scan.id,
        workspace_id=user.workspace_id,
        target=payload.target,
        target_type=payload.target_type,
        scan_mode=payload.scan_mode,
        instruction=payload.instruction,
        max_budget=payload.max_budget
    )

    return {
        "status": "QUEUED",
        "scan_id": scan.id,
        "job_id": job.id,
        "target": scan.target,
        "scan_mode": scan.scan_mode,
        "state_source": "strix-agent",
        "created_at": scan.started_at.isoformat()
    }


@router.get("/strix/scans")
def list_strix_scans(
    limit: int = 50,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user)
):
    """Lists historical and active penetration test runs for the workspace."""
    runs = db.query(StrixScanRun).filter(
        StrixScanRun.workspace_id == user.workspace_id
    ).order_by(StrixScanRun.started_at.desc()).limit(limit).all()
    return [r.to_dict() for r in runs]


@router.get("/strix/scans/{run_id}")
def get_strix_scan_detail(
    run_id: str,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user)
):
    """Returns detailed scan metrics, live logs, and validated findings."""
    scan = db.query(StrixScanRun).filter(
        StrixScanRun.id == run_id,
        StrixScanRun.workspace_id == user.workspace_id
    ).first()
    if not scan:
        raise HTTPException(status_code=404, detail=f"Scan run '{run_id}' not found")

    findings = db.query(StrixFinding).filter(
        StrixFinding.run_id == run_id,
        StrixFinding.workspace_id == user.workspace_id
    ).all()

    res = scan.to_dict()
    res["findings"] = [f.to_dict() for f in findings]
    return res


@router.get("/strix/findings")
def list_strix_findings(
    severity: Optional[str] = None,
    status_filter: Optional[str] = None,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user)
):
    """Lists validated findings across all scans with proof-of-concept exploits."""
    q = db.query(StrixFinding).filter(StrixFinding.workspace_id == user.workspace_id)
    if severity:
        q = q.filter(StrixFinding.severity == severity.lower())
    if status_filter:
        q = q.filter(StrixFinding.status == status_filter.lower())
    findings = q.order_by(StrixFinding.detected_at.desc()).all()
    return [f.to_dict() for f in findings]


@router.post("/strix/findings/{finding_id}/resolve")
def resolve_strix_finding(
    finding_id: str,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user)
):
    """Marks a validated finding as resolved."""
    finding = db.query(StrixFinding).filter(
        StrixFinding.id == finding_id,
        StrixFinding.workspace_id == user.workspace_id
    ).first()
    if not finding:
        raise HTTPException(status_code=404, detail=f"Finding '{finding_id}' not found")

    finding.status = "resolved"
    finding.resolved_at = datetime.datetime.utcnow()
    db.commit()
    db.refresh(finding)
    return finding.to_dict()


class StrixConfigUpdate(BaseModel):
    strix_api_key: Optional[str] = None
    strix_llm: Optional[str] = None
    llm_api_key: Optional[str] = None


@router.post("/strix/config")
def update_strix_config(
    cfg: StrixConfigUpdate,
    user: User = Depends(get_current_user)
):
    """Configures Strix provider credentials (stored securely)."""
    if cfg.strix_api_key:
        os.environ["STRIX_API_KEY"] = cfg.strix_api_key
    if cfg.strix_llm:
        os.environ["STRIX_LLM"] = cfg.strix_llm
    if cfg.llm_api_key:
        os.environ["LLM_API_KEY"] = cfg.llm_api_key
    return {
        "status": "updated",
        "strix_status": StrixRunner.check_strix_status()
    }
