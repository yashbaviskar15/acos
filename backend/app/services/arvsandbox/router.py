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

@router.get("", include_in_schema=False)
@router.get("/")
def list_sandboxes(db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    sandboxes = db.query(Sandbox).filter(Sandbox.workspace_id == user.workspace_id).all()
    return [s.to_dict() for s in sandboxes]

@router.get("/{id}")
def get_sandbox(id: str, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    sandbox = db.query(Sandbox).filter(Sandbox.id == id, Sandbox.workspace_id == user.workspace_id).first()
    if not sandbox:
        raise HTTPException(status_code=404, detail=f"Sandbox '{id}' not found")
    return sandbox.to_dict()

@router.put("/{id}/extend")
def extend_sandbox(id: str, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    sandbox = db.query(Sandbox).filter(Sandbox.id == id, Sandbox.workspace_id == user.workspace_id).first()
    if not sandbox:
        raise HTTPException(status_code=404, detail=f"Sandbox '{id}' not found")
    sandbox.ttl_hours += 24
    sandbox.expires_at = sandbox.expires_at + datetime.timedelta(hours=24)
    db.commit()
    db.refresh(sandbox)
    return sandbox.to_dict()

@router.delete("/{id}")
def destroy_sandbox(id: str, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    sandbox = db.query(Sandbox).filter(Sandbox.id == id, Sandbox.workspace_id == user.workspace_id).first()
    if not sandbox:
        raise HTTPException(status_code=404, detail=f"Sandbox '{id}' not found")
    sandbox.status = "destroyed"
    sandbox.destroyed_at = datetime.datetime.utcnow()
    db.commit()
    return {"status": "success", "id": id, "message": "Sandbox destroyed"}

@router.get("/{id}/diff")
def diff_sandbox(id: str, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    sandbox = db.query(Sandbox).filter(Sandbox.id == id, Sandbox.workspace_id == user.workspace_id).first()
    if not sandbox:
        raise HTTPException(status_code=404, detail=f"Sandbox '{id}' not found")
    return {
        "sandbox_id": id,
        "diff": {
            "services_added": [],
            "services_modified": [],
            "schema_changes": []
        }
    }

@router.post("/{id}/promote")
def promote_sandbox(id: str, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    sandbox = db.query(Sandbox).filter(Sandbox.id == id, Sandbox.workspace_id == user.workspace_id).first()
    if not sandbox:
        raise HTTPException(status_code=404, detail=f"Sandbox '{id}' not found")
    return {
        "status": "success",
        "sandbox_id": id,
        "message": f"Sandbox '{id}' changes promoted",
        "job_id": f"job-{uuid.uuid4().hex[:8]}"
    }
