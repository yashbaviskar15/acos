"""
Aravanta CloudOS — ArvCICD Service Router
Continuous Integration & Delivery Pipelines, build runners, and artifact releases.
"""
import uuid
import random
from datetime import datetime, timedelta
from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel

router = APIRouter(prefix="/api/v1/cicd", tags=["ArvCICD — Pipelines"])

class PipelineCreate(BaseModel):
    name: str
    repository: str
    branch: str = "main"

_pipelines: list[dict] = [
    {
        "id": "pipe-01",
        "name": "backend-api-ci",
        "repository": "aravanta/cloudos-backend",
        "branch": "main",
        "commit": "8a1f4b2",
        "trigger": "git push",
        "status": "SUCCESS",
        "duration": "2m 14s",
        "finished_at": (datetime.utcnow() - timedelta(minutes=12)).isoformat() + "Z",
        "build_number": 142
    },
    {
        "id": "pipe-02",
        "name": "frontend-web-build",
        "repository": "aravanta/cloudos-frontend",
        "branch": "main",
        "commit": "c3d90e1",
        "trigger": "git push",
        "status": "SUCCESS",
        "duration": "1m 45s",
        "finished_at": (datetime.utcnow() - timedelta(minutes=25)).isoformat() + "Z",
        "build_number": 98
    },
    {
        "id": "pipe-03",
        "name": "arv-kube-helm-deploy",
        "repository": "aravanta/infrastructure-helm",
        "branch": "release/1.0",
        "commit": "f92e8a7",
        "trigger": "manual",
        "status": "SUCCESS",
        "duration": "3m 02s",
        "finished_at": (datetime.utcnow() - timedelta(hours=2)).isoformat() + "Z",
        "build_number": 45
    },
    {
        "id": "pipe-04",
        "name": "database-migration-test",
        "repository": "aravanta/cloudos-backend",
        "branch": "feature/auth",
        "commit": "b45c11d",
        "trigger": "pull_request",
        "status": "FAILED",
        "duration": "45s",
        "finished_at": (datetime.utcnow() - timedelta(hours=4)).isoformat() + "Z",
        "build_number": 31
    }
]

@router.get("/pipelines")
def list_pipelines():
    return _pipelines

@router.post("/pipelines", status_code=status.HTTP_201_CREATED)
def create_pipeline(p_in: PipelineCreate):
    new_pipe = {
        "id": f"pipe-{uuid.uuid4().hex[:4]}",
        "name": p_in.name,
        "repository": p_in.repository,
        "branch": p_in.branch,
        "commit": secrets_commit_hash(),
        "trigger": "manual",
        "status": "PENDING",
        "duration": "0s",
        "finished_at": datetime.utcnow().isoformat() + "Z",
        "build_number": 1
    }
    _pipelines.insert(0, new_pipe)
    return new_pipe

@router.post("/pipelines/{pipeline_id}/trigger")
def trigger_pipeline(pipeline_id: str):
    for p in _pipelines:
        if p["id"] == pipeline_id:
            p["status"] = "SUCCESS"
            p["build_number"] += 1
            p["commit"] = secrets_commit_hash()
            p["finished_at"] = datetime.utcnow().isoformat() + "Z"
            return p
    raise HTTPException(status_code=404, detail="Pipeline not found")

@router.get("/summary")
def get_cicd_summary():
    total = len(_pipelines)
    successful = sum(1 for p in _pipelines if p["status"] == "SUCCESS")
    failed = sum(1 for p in _pipelines if p["status"] == "FAILED")
    return {
        "total_pipelines": total,
        "successful_runs": successful,
        "failed_runs": failed,
        "pass_rate_percent": round((successful / total * 100), 1) if total > 0 else 100,
        "avg_duration_seconds": 115
    }

def secrets_commit_hash():
    chars = "0123456789abcdef"
    return "".join(random.choice(chars) for _ in range(7))
