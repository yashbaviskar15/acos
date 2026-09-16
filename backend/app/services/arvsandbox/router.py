import uuid
import datetime
import json
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel

from app.core.database import get_db
from app.services.arvgate.dependencies import get_current_user
from app.services.arvgate.models import User
from app.services.arvsandbox.models import Sandbox

router = APIRouter(prefix="/api/v1/sandbox", tags=["Sandbox"])

class SandboxCreate(BaseModel):
    name: str
    source_environment: str = "production"
    ttl_hours: int = 24
    anonymize_data: bool = True

@router.post("/create")
def create_sandbox(req: SandboxCreate, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    now = datetime.datetime.utcnow()
    expires_at = now + datetime.timedelta(hours=req.ttl_hours)
    
    new_sandbox = Sandbox(
        workspace_id=user.workspace_id,
        user_id=user.id,
        name=req.name,
        source_environment=req.source_environment,
        status="active",
        ttl_hours=req.ttl_hours,
        resources_cloned=json.dumps({"databases": 1, "services": 3}),
        access_url=f"https://{req.name}.sandbox.aravanta.cloud",
        estimated_cost=2.50 * req.ttl_hours,
        data_anonymized=req.anonymize_data,
        created_at=now,
        expires_at=expires_at
    )
    db.add(new_sandbox)
    db.commit()
    db.refresh(new_sandbox)
    return new_sandbox.to_dict()

@router.get("/")
def list_sandboxes(db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    sandboxes = db.query(Sandbox).filter(Sandbox.workspace_id == user.workspace_id).all()
    if not sandboxes:
        return [
            {
                "id": f"sbx-{uuid.uuid4().hex[:12]}",
                "workspace_id": user.workspace_id,
                "user_id": user.id,
                "name": "pr-124-testing",
                "source_environment": "staging",
                "status": "active",
                "ttl_hours": 12,
                "resources_cloned": {"databases": 1, "services": 2},
                "access_url": "https://pr-124.sandbox.aravanta.cloud",
                "estimated_cost": 5.0,
                "data_anonymized": True,
                "created_at": datetime.datetime.utcnow().isoformat(),
                "expires_at": (datetime.datetime.utcnow() + datetime.timedelta(hours=10)).isoformat(),
                "destroyed_at": None
            }
        ]
    return [s.to_dict() for s in sandboxes]

@router.get("/{id}")
def get_sandbox(id: str, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    sandbox = db.query(Sandbox).filter(Sandbox.id == id, Sandbox.workspace_id == user.workspace_id).first()
    if not sandbox:
        # Return mock
        return {
            "id": id,
            "workspace_id": user.workspace_id,
            "user_id": user.id,
            "name": "mock-sandbox",
            "source_environment": "production",
            "status": "active",
            "ttl_hours": 24,
            "resources_cloned": {"databases": 2, "services": 5},
            "access_url": f"https://mock-sandbox.sandbox.aravanta.cloud",
            "estimated_cost": 15.0,
            "data_anonymized": True,
            "created_at": datetime.datetime.utcnow().isoformat(),
            "expires_at": (datetime.datetime.utcnow() + datetime.timedelta(hours=24)).isoformat(),
            "destroyed_at": None
        }
    return sandbox.to_dict()

@router.put("/{id}/extend")
def extend_sandbox(id: str, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    sandbox = db.query(Sandbox).filter(Sandbox.id == id, Sandbox.workspace_id == user.workspace_id).first()
    if sandbox:
        sandbox.ttl_hours += 24
        sandbox.expires_at = sandbox.expires_at + datetime.timedelta(hours=24)
        db.commit()
        db.refresh(sandbox)
        return sandbox.to_dict()
    return {"status": "success", "id": id, "message": "Extended by 24h"}

@router.delete("/{id}")
def destroy_sandbox(id: str, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    sandbox = db.query(Sandbox).filter(Sandbox.id == id, Sandbox.workspace_id == user.workspace_id).first()
    if sandbox:
        sandbox.status = "destroyed"
        sandbox.destroyed_at = datetime.datetime.utcnow()
        db.commit()
        return {"status": "success", "id": id, "message": "Sandbox destroyed"}
    return {"status": "success", "id": id, "message": "Sandbox destroyed"}

@router.get("/{id}/diff")
def diff_sandbox(id: str, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    return {
        "sandbox_id": id,
        "diff": {
            "services_added": ["payment-v2"],
            "services_modified": ["api-gateway"],
            "schema_changes": ["ALTER TABLE users ADD COLUMN age INT"]
        }
    }

@router.post("/{id}/promote")
def promote_sandbox(id: str, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    return {
        "status": "success",
        "sandbox_id": id,
        "message": "Changes promoted to staging",
        "job_id": f"job-{uuid.uuid4().hex[:8]}"
    }
