"""
Aravanta Cloud OS — Jobs Router
Allows frontend and CLI to poll progress and status of async background operations.
"""
from fastapi import APIRouter, HTTPException
from app.core.jobs import get_job_by_id

router = APIRouter(prefix="/api/v1/jobs", tags=["Jobs & Operations"])

@router.get("/{job_id}")
def get_job_status(job_id: str):
    job = get_job_by_id(job_id)
    if not job:
        raise HTTPException(status_code=404, detail=f"Job '{job_id}' not found")
    return job
