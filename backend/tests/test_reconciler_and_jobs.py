"""
Aravanta Cloud OS — Invariant Test Suite: Fleet Reconciler & Async Jobs
Tests:
1. FleetReconciler detects state drift and unverified RUNNING states.
2. Reconciler marks resources honestly with state_source='reconciler' and observed_at.
3. Jobs engine registers, tracks progress, and allows cancellation.
"""
import pytest
from datetime import datetime
from tests.conftest import TestingSessionLocal
from app.core.cloud_models import ComputeInstance
from app.core.reconciler import FleetReconciler
from app.core.jobs import create_job, update_job_progress, get_job_by_id, cancel_job, list_jobs


def test_reconciler_corrects_unverified_running_instance():
    """If an instance holds RUNNING status without a provider resource ID, Reconciler must revert it to AWAITING_PROVIDER_SETUP."""
    db = TestingSessionLocal()
    try:
        inst_id = "test-i-unverified-running"
        inst = db.query(ComputeInstance).filter(ComputeInstance.id == inst_id).first()
        if not inst:
            inst = ComputeInstance(
                id=inst_id,
                user_id="test-user-001",
                workspace_id="ws-test",
                name="unverified-web",
                instance_type="arv.medium",
                os_image="Ubuntu 22.04 LTS",
                region="arv-us-east-1",
                status="RUNNING",  # Simulating an unverified database write
                provider_resource_id=None,
                created_at=datetime.utcnow()
            )
            db.add(inst)
            db.commit()
        else:
            inst.status = "RUNNING"
            inst.provider_resource_id = None
            db.commit()

        # Run Fleet Reconciler
        report = FleetReconciler.reconcile_fleet(db=db, user_id="test-user-001")
        assert report["drift_detected"] >= 1

        db.refresh(inst)
        assert inst.status == "AWAITING_PROVIDER_SETUP"
        assert inst.state_source == "reconciler"
        assert inst.observed_at is not None

        # Clean up
        db.delete(inst)
        db.commit()
    finally:
        db.close()


def test_reconciler_status_reporting():
    """FleetReconciler status returns a valid audit structure."""
    status_report = FleetReconciler.get_latest_status()
    assert "reconciled_at" in status_report
    assert "total_scanned" in status_report
    assert "drift_detected" in status_report
    assert "healthy" in status_report


def test_async_job_lifecycle():
    """Jobs engine properly creates, updates progress, and cancels jobs."""
    db = TestingSessionLocal()
    try:
        job = create_job(
            job_type="PROVISION_INSTANCE",
            resource_id="arv-i-test-99",
            organization_id="ws-enterprise",
            payload={"tier": "c3.4xlarge"},
            db=db
        )
        assert job.status == "QUEUED"
        assert job.progress == 0

        # Progress update
        update_job_progress(job.id, progress=50, status="RUNNING", db=db)
        fetched = get_job_by_id(job.id, db=db)
        assert fetched is not None
        assert fetched["status"] == "RUNNING"
        assert fetched["progress"] == 50

        # Cancel job
        cancelled = cancel_job(job.id, db=db)
        assert cancelled is not None
        assert cancelled["status"] == "CANCELLED"

        # List jobs
        all_jobs = list_jobs(organization_id="ws-enterprise", limit=10, db=db)
        assert any(j["id"] == job.id for j in all_jobs)
    finally:
        db.close()
