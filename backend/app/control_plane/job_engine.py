"""
Aravanta Cloud OS — Job & Worker Engine
Executes long-running cloud operations asynchronously and records full execution history.
"""
import json
import logging
from datetime import datetime
from typing import Callable, Any, Dict, Optional
from sqlalchemy.orm import Session
from app.control_plane.models import JobRecord, EventRecord

logger = logging.getLogger("aravanta.job_engine")


class JobEngine:
    @staticmethod
    def create_job(
        db: Session,
        organization_id: str,
        project_id: str,
        action: str,
        resource_id: Optional[str] = None
    ) -> JobRecord:
        """Create and queue a new job record."""
        job = JobRecord(
            organization_id=organization_id,
            project_id=project_id,
            resource_id=resource_id,
            action=action,
            status="QUEUED",
            result="{}",
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow()
        )
        db.add(job)
        db.commit()
        db.refresh(job)
        return job

    @staticmethod
    def execute_job(
        db: Session,
        job_id: str,
        task_func: Callable[[], Dict[str, Any]]
    ) -> JobRecord:
        """Executes the task, handles success/failure transitions, and emits audit event."""
        job = db.query(JobRecord).filter(JobRecord.id == job_id).first()
        if not job:
            raise ValueError(f"Job {job_id} not found")

        job.status = "RUNNING"
        job.updated_at = datetime.utcnow()
        db.commit()

        try:
            output = task_func()
            job.status = "SUCCEEDED"
            job.result = json.dumps(output or {})
            job.updated_at = datetime.utcnow()

            # Record Event
            event = EventRecord(
                organization_id=job.organization_id,
                project_id=job.project_id,
                resource_id=job.resource_id,
                event_type=f"Job:{job.action}:Success",
                payload=json.dumps({"job_id": job.id, "action": job.action}),
                timestamp=datetime.utcnow()
            )
            db.add(event)
            db.commit()
            db.refresh(job)
            return job
        except Exception as exc:
            logger.error("Job %s execution failed: %s", job_id, exc)
            job.status = "FAILED"
            job.error_message = str(exc)
            job.updated_at = datetime.utcnow()

            # Record Failure Event
            event = EventRecord(
                organization_id=job.organization_id,
                project_id=job.project_id,
                resource_id=job.resource_id,
                event_type=f"Job:{job.action}:Failed",
                payload=json.dumps({"job_id": job.id, "error": str(exc)}),
                timestamp=datetime.utcnow()
            )
            db.add(event)
            db.commit()
            db.refresh(job)
            return job
