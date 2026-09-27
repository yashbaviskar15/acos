import uuid
import datetime
import json
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import or_
from pydantic import BaseModel
from typing import Optional

from app.core.database import get_db
from app.services.arvgate.dependencies import get_current_user
from app.services.arvgate.models import User
from app.services.arvpulse.models import PulseScore, PulsePrediction, PulsePattern
from app.core.cloud_models import ComputeInstance, DatabaseInstance, StorageBucket, KubeCluster

router = APIRouter(prefix="/api/v1/pulse", tags=["Pulse"])

@router.get("/score/{resource_id}")
def get_score(resource_id: str, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    stored = db.query(PulseScore).filter(
        PulseScore.resource_id == resource_id,
        PulseScore.workspace_id == user.workspace_id
    ).first()
    if stored:
        return stored.to_dict()

    # Calculate real health score based on resource presence and status
    vm = db.query(ComputeInstance).filter(ComputeInstance.id == resource_id).first()
    if vm:
        score = 100 if vm.status == "RUNNING" else (70 if vm.status == "STOPPED" else 50)
        return {
            "id": f"pls-{uuid.uuid4().hex[:12]}",
            "resource_id": resource_id,
            "resource_type": "compute",
            "workspace_id": user.workspace_id,
            "score": score,
            "trend": "stable" if vm.status == "RUNNING" else "degraded",
            "factors": {
                "cpu": "healthy" if (vm.cpu_usage or 0) < 80 else "warning",
                "memory": "healthy" if (vm.ram_usage or 0) < 80 else "warning",
                "disk": "healthy"
            },
            "recorded_at": datetime.datetime.utcnow().isoformat()
        }

    db_inst = db.query(DatabaseInstance).filter(DatabaseInstance.id == resource_id).first()
    if db_inst:
        score = 100 if db_inst.status == "AVAILABLE" else 50
        return {
            "id": f"pls-{uuid.uuid4().hex[:12]}",
            "resource_id": resource_id,
            "resource_type": "database",
            "workspace_id": user.workspace_id,
            "score": score,
            "trend": "stable",
            "factors": {"connection": "healthy", "storage": "healthy"},
            "recorded_at": datetime.datetime.utcnow().isoformat()
        }

    raise HTTPException(status_code=404, detail=f"Resource '{resource_id}' not found")

@router.get("/workspace")
def get_workspace_health(db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    ws_id = user.workspace_id
    u_id = user.id

    vms = db.query(ComputeInstance).filter(or_(ComputeInstance.workspace_id == ws_id, ComputeInstance.user_id == u_id)).all()
    dbs = db.query(DatabaseInstance).filter(or_(DatabaseInstance.workspace_id == ws_id, DatabaseInstance.user_id == u_id)).all()
    clusters = db.query(KubeCluster).filter(or_(KubeCluster.workspace_id == ws_id, KubeCluster.user_id == u_id)).all()
    buckets = db.query(StorageBucket).filter(or_(StorageBucket.workspace_id == ws_id, StorageBucket.user_id == u_id)).all()

    vm_score = 100 if not vms else int(sum(100 if v.status == "RUNNING" else 70 for v in vms) / len(vms))
    db_score = 100 if not dbs else int(sum(100 if d.status == "AVAILABLE" else 50 for d in dbs) / len(dbs))
    k8s_score = 100 if not clusters else int(sum(100 if c.status == "ACTIVE" else 50 for c in clusters) / len(clusters))
    storage_score = 100

    overall = int((vm_score + db_score + k8s_score + storage_score) / 4)
    return {
        "overall_score": overall,
        "trend": "stable" if overall >= 80 else "degraded",
        "per_resource_type": {
            "compute": vm_score,
            "kubernetes": k8s_score,
            "database": db_score,
            "storage": storage_score
        },
        "calculated_at": datetime.datetime.utcnow().isoformat()
    }

@router.get("/predictions")
def list_predictions(db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    preds = db.query(PulsePrediction).filter(PulsePrediction.workspace_id == user.workspace_id).all()
    return [p.to_dict() for p in preds]

@router.get("/timeline/{resource_id}")
def get_timeline(resource_id: str, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    return []

@router.get("/patterns")
def list_patterns(db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    patterns = db.query(PulsePattern).filter(PulsePattern.workspace_id == user.workspace_id).all()
    return [p.to_dict() for p in patterns]
