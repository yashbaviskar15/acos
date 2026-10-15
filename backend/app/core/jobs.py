"""
Aravanta Cloud OS — Asynchronous Job Management System
Handles long-running infrastructure operations with idempotency, progress, retries, and persistence.
"""
from typing import Optional, Dict, Any, List, Callable
from datetime import datetime
import json
import uuid
import logging
import threading
from sqlalchemy.orm import Session

from app.core.database import SessionLocal
from app.control_plane.models import JobRecord

logger = logging.getLogger("aravanta.jobs")


def create_job(
    job_type: str,
    resource_id: Optional[str] = None,
    idempotency_key: Optional[str] = None,
    payload: Optional[Dict[str, Any]] = None,
    max_retries: int = 3,
    organization_id: Optional[str] = None,
    project_id: Optional[str] = None,
    db: Optional[Session] = None,
) -> JobRecord:
    own_session = False
    if db is None:
        db = SessionLocal()
        own_session = True
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
        if own_session:
            db.close()


def update_job_progress(
    job_id: str,
    progress: int,
    status: Optional[str] = None,
    error: Optional[str] = None,
    result: Optional[Dict[str, Any]] = None,
    db: Optional[Session] = None,
) -> None:
    own_session = False
    if db is None:
        db = SessionLocal()
        own_session = True
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
        if own_session:
            db.close()


def get_job_by_id(job_id: str, db: Optional[Session] = None) -> Optional[Dict[str, Any]]:
    own_session = False
    if db is None:
        db = SessionLocal()
        own_session = True
    try:
        job = db.query(JobRecord).filter(JobRecord.id == job_id).first()
        return job.to_dict() if job else None
    finally:
        if own_session:
            db.close()


def list_jobs(
    organization_id: Optional[str] = None,
    status: Optional[str] = None,
    resource_id: Optional[str] = None,
    limit: int = 50,
    db: Optional[Session] = None,
) -> List[Dict[str, Any]]:
    own_session = False
    if db is None:
        db = SessionLocal()
        own_session = True
    try:
        query = db.query(JobRecord)
        if organization_id:
            query = query.filter(JobRecord.organization_id == organization_id)
        if status:
            query = query.filter(JobRecord.status == status.upper())
        if resource_id:
            query = query.filter(JobRecord.resource_id == resource_id)
        jobs = query.order_by(JobRecord.created_at.desc()).limit(limit).all()
        return [j.to_dict() for j in jobs]
    finally:
        if own_session:
            db.close()


def cancel_job(job_id: str, db: Optional[Session] = None) -> Optional[Dict[str, Any]]:
    own_session = False
    if db is None:
        db = SessionLocal()
        own_session = True
    try:
        job = db.query(JobRecord).filter(JobRecord.id == job_id).first()
        if not job:
            return None
        if job.status in ("SUCCESS", "SUCCEEDED", "FAILED", "CANCELLED"):
            return job.to_dict()
        job.status = "CANCELLED"
        job.finished_at = datetime.utcnow()
        job.updated_at = datetime.utcnow()
        db.commit()
        return job.to_dict()
    finally:
        if own_session:
            db.close()


def dispatch_async_job(job_id: str, fn: Callable, *args, **kwargs) -> threading.Thread:
    """Executes a long-running callable in a daemon thread, managing job lifecycle."""
    def _worker():
        update_job_progress(job_id, progress=15, status="RUNNING")
        try:
            output = fn(*args, **kwargs)
            update_job_progress(job_id, progress=100, status="SUCCESS", result=output or {})
        except Exception as exc:
            logger.error("Async job %s execution failed: %s", job_id, exc)
            update_job_progress(job_id, progress=100, status="FAILED", error=str(exc))

    t = threading.Thread(target=_worker, daemon=True, name=f"AravantaJob-{job_id}")
    t.start()
    return t
