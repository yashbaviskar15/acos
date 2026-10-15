"""
Aravanta Cloud OS — Jobs & Fleet Reconciler Router
Exposes asynchronous background task status and on-demand fleet reconciliation.
"""
from typing import Optional
from fastapi import APIRouter, HTTPException, Query, Depends
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.jobs import get_job_by_id, list_jobs, cancel_job
from app.core.reconciler import FleetReconciler
from app.services.arvgate.dependencies import get_current_user, require_roles
from app.services.arvgate.models import User

router = APIRouter(tags=["Jobs & Operations"])


# ─── Async Jobs Endpoints ───────────────────────────────────────────────
@router.get("/api/v1/jobs")
def get_jobs_list(
    status: Optional[str] = Query(None, description="Filter by QUEUED, RUNNING, SUCCESS, FAILED, CANCELLED"),
    resource_id: Optional[str] = Query(None, description="Filter by resource ID"),
    limit: int = Query(50, ge=1, le=200),
    current_user: User = Depends(get_current_user)
):
    """Lists asynchronous provisioning and maintenance jobs."""
    org_id = current_user.workspace_id if current_user.role not in ["SuperAdmin", "Admin"] else None
    return list_jobs(organization_id=org_id, status=status, resource_id=resource_id, limit=limit)


@router.get("/api/v1/jobs/{job_id}")
def get_job_status(job_id: str, current_user: User = Depends(get_current_user)):
    """Polls progress, status, and output of an async background operation."""
    job = get_job_by_id(job_id)
    if not job:
        raise HTTPException(status_code=404, detail=f"Job '{job_id}' not found")
    return job


@router.post("/api/v1/jobs/{job_id}/cancel")
def cancel_job_endpoint(
    job_id: str,
    current_user: User = Depends(require_roles(["SuperAdmin", "Admin", "Operator"]))
):
    """Cancels a queued or active background job."""
    res = cancel_job(job_id)
    if not res:
        raise HTTPException(status_code=404, detail=f"Job '{job_id}' not found")
    return res


# ─── Fleet Reconciler Endpoints ─────────────────────────────────────────
@router.post("/api/v1/reconciler/run")
def run_fleet_reconciliation(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(["SuperAdmin", "Admin", "Operator"]))
):
    """
    Triggers a live fleet reconciliation pass comparing external provider status with registry.
    Detects external deletions and drift without fabricating data.
    """
    user_filter = str(current_user.id) if current_user.role not in ["SuperAdmin", "Admin"] else None
    report = FleetReconciler.reconcile_fleet(db=db, user_id=user_filter)
    return report


@router.get("/api/v1/reconciler/status")
def get_reconciler_status(
    current_user: User = Depends(get_current_user)
):
    """Retrieves the latest reconciliation audit metrics and detected drift counts."""
    return FleetReconciler.get_latest_status()
