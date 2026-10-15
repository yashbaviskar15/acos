"""
Aravanta Cloud OS — Fleet State Reconciler
Implements Invariant #3: PROVIDER IS SOURCE OF TRUTH.
Periodically and on-demand compares cloud provider state with the registry,
detects external deletion / drift, and enforces honest evidence-gated states.
"""
import logging
from datetime import datetime
from typing import Dict, Any, Optional, List
from sqlalchemy.orm import Session

from app.core.database import SessionLocal
from app.core.cloud_models import ComputeInstance
from app.core.state_guard import transition_resource_state, StateGuardViolation

logger = logging.getLogger("aravanta.reconciler")

# In-memory cache for latest fleet reconciliation report
_latest_reconciliation_report: Dict[str, Any] = {
    "reconciled_at": None,
    "status": "INITIALIZED",
    "total_scanned": 0,
    "drift_detected": 0,
    "external_deletions": 0,
    "healthy": 0,
    "details": []
}


class FleetReconciler:
    @staticmethod
    def get_latest_status() -> Dict[str, Any]:
        """Returns the most recent reconciliation audit report."""
        return dict(_latest_reconciliation_report)

    @staticmethod
    def reconcile_fleet(db: Optional[Session] = None, user_id: Optional[str] = None) -> Dict[str, Any]:
        """
        Executes a full reconciliation pass over registered cloud resources.
        Detects drift, external deletions, and unverified RUNNING states.
        """
        global _latest_reconciliation_report
        own_session = False
        if db is None:
            db = SessionLocal()
            own_session = True

        now = datetime.utcnow()
        report: Dict[str, Any] = {
            "reconciled_at": now.isoformat() + "Z",
            "status": "COMPLETED",
            "total_scanned": 0,
            "drift_detected": 0,
            "external_deletions": 0,
            "healthy": 0,
            "details": []
        }

        try:
            query = db.query(ComputeInstance)
            if user_id:
                query = query.filter(ComputeInstance.user_id == user_id)

            instances: List[ComputeInstance] = query.all()
            report["total_scanned"] = len(instances)

            for inst in instances:
                res_detail = {
                    "resource_id": inst.id,
                    "name": inst.name,
                    "previous_status": inst.status,
                    "new_status": inst.status,
                    "drift_type": None
                }

                # Case 1: Resource claims to have an external provider resource ID
                if inst.provider_resource_id:
                    from app.services.arvcompute.router import _get_compute_driver_for_user
                    provider, p_type = _get_compute_driver_for_user(db, str(inst.user_id))
                    if provider:
                        try:
                            status_info = provider.compute.get_status(inst.provider_resource_id)
                            provider_status = status_info.get("status", "UNKNOWN").upper()

                            # Detect status drift
                            if provider_status != inst.status:
                                transition_resource_state(
                                    inst,
                                    target_state=provider_status,
                                    provider_resource_id=inst.provider_resource_id,
                                    state_source="reconciler",
                                    observed_at=now
                                )
                                inst.private_ip = status_info.get("private_ip", inst.private_ip)
                                inst.public_ip = status_info.get("public_ip", inst.public_ip)
                                inst.last_error = None
                                report["drift_detected"] += 1
                                res_detail["new_status"] = provider_status
                                res_detail["drift_type"] = f"STATE_DRIFT ({inst.status} -> {provider_status})"
                            else:
                                inst.observed_at = now
                                report["healthy"] += 1

                        except Exception as p_err:
                            err_str = str(p_err).lower()
                            # Provider indicates resource no longer exists externally
                            if "not found" in err_str or "does not exist" in err_str or "404" in err_str or "invalidinstanceid" in err_str:
                                transition_resource_state(
                                    inst,
                                    target_state="MISSING_AT_PROVIDER",
                                    state_source="reconciler",
                                    observed_at=now,
                                    last_error=f"Resource deleted externally at {p_type}: {p_err}"
                                )
                                report["drift_detected"] += 1
                                report["external_deletions"] += 1
                                res_detail["new_status"] = "MISSING_AT_PROVIDER"
                                res_detail["drift_type"] = "EXTERNAL_DELETION"
                            else:
                                # Provider temporarily unreachable
                                inst.status = "UNKNOWN"
                                inst.state_source = "reconciler"
                                inst.observed_at = now
                                inst.last_error = f"Provider unreachable: {p_err}"
                                report["drift_detected"] += 1
                                res_detail["new_status"] = "UNKNOWN"
                                res_detail["drift_type"] = "PROVIDER_UNREACHABLE"
                    else:
                        # Credentials missing or revoked
                        if inst.status in ["RUNNING", "PROVISIONING"]:
                            transition_resource_state(
                                inst,
                                target_state="AWAITING_PROVIDER_SETUP",
                                state_source="reconciler",
                                observed_at=now,
                                last_error="Provider credentials unconfigured or revoked."
                            )
                            report["drift_detected"] += 1
                            res_detail["new_status"] = "AWAITING_PROVIDER_SETUP"
                            res_detail["drift_type"] = "CREDENTIALS_MISSING"
                        else:
                            report["healthy"] += 1

                # Case 2: Resource has no provider ID but holds an evidence-gated active state
                elif inst.status in ["RUNNING", "AVAILABLE", "ACTIVE"]:
                    transition_resource_state(
                        inst,
                        target_state="AWAITING_PROVIDER_SETUP",
                        state_source="reconciler",
                        observed_at=now,
                        last_error="No provider resource evidence found for active state."
                    )
                    report["drift_detected"] += 1
                    res_detail["new_status"] = "AWAITING_PROVIDER_SETUP"
                    res_detail["drift_type"] = "UNVERIFIED_ACTIVE_STATE"
                else:
                    report["healthy"] += 1

                if res_detail["drift_type"]:
                    report["details"].append(res_detail)

            db.commit()
            _latest_reconciliation_report = report
            logger.info(
                "Fleet reconciliation complete: %d scanned, %d drifted, %d deleted externally",
                report["total_scanned"],
                report["drift_detected"],
                report["external_deletions"]
            )
            return report

        except Exception as exc:
            db.rollback()
            logger.error("Fleet reconciliation encountered an unexpected error: %s", exc)
            report["status"] = "ERROR"
            report["error"] = str(exc)
            _latest_reconciliation_report = report
            return report
        finally:
            if own_session:
                db.close()
