"""
Aravanta Cloud OS — Asynchronous Job Management System
Handles long-running infrastructure operations with idempotency, progress, retries, and persistence.
"""
from typing import Optional, Dict, Any
from datetime import datetime
import json
import uuid

from app.core.database import SessionLocal
from app.control_plane.models import JobRecord

def create_job(
    job_type: str,
    resource_id: Optional[str] = None,
    idempotency_key: Optional[str] = None,
    payload: Optional[Dict[str, Any]] = None,
    max_retries: int = 3,
    organization_id: Optional[str] = None,
    project_id: Optional[str] = None,
) -> JobRecord:
    db = SessionLocal()
    try:
        if idempotency_key:
            existing = db.query(JobRecord).filter(JobRecord.idempotency_key == idempotency_key).first()
            if existing:
                return existing

        job_id = f"job-{uuid.uuid4().hex[:12]}"
        job = JobRecord(
            id=job_id,
            action=job_type,
            job_type=job_type,
            resource_id=resource_id,
            idempotency_key=idempotency_key,
            organization_id=organization_id,
            project_id=project_id,
            status="QUEUED",
            progress=0,
            max_retries=max_retries,
            payload=json.dumps(payload or {})
        )
        db.add(job)
        db.commit()
        db.refresh(job)
        return job
    finally:
        db.close()


def update_job_progress(
    job_id: str,
    progress: int,
    status: Optional[str] = None,
    error: Optional[str] = None,
    result: Optional[Dict[str, Any]] = None
) -> None:
    db = SessionLocal()
    try:
        job = db.query(JobRecord).filter(JobRecord.id == job_id).first()
        if not job:
            return
        job.progress = max(0, min(100, progress))
        if status:
            job.status = status
            if status in ("SUCCESS", "SUCCEEDED", "FAILED", "CANCELLED"):
                job.finished_at = datetime.utcnow()
        if error:
            job.error_message = str(error)
        if result is not None:
            job.result = json.dumps(result)
        job.updated_at = datetime.utcnow()
        db.commit()
    finally:
        db.close()


def get_job_by_id(job_id: str) -> Optional[Dict[str, Any]]:
    db = SessionLocal()
    try:
        job = db.query(JobRecord).filter(JobRecord.id == job_id).first()
        return job.to_dict() if job else None
    finally:
        db.close()
