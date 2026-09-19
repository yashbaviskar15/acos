"""
Aravanta Cloud OS — Control Plane Resource Manager
Implements unified resource abstraction, state reconciliation, and provider orchestration.
"""
import json
import logging
from datetime import datetime
from typing import Dict, Any, List, Optional
from sqlalchemy.orm import Session
from sqlalchemy import and_

from app.control_plane.models import ResourceRecord, EventRecord, JobRecord
from app.control_plane.providers.base import DefaultComputeProvider
from app.billing.metering_service import MeteringService

logger = logging.getLogger("aravanta.resource_manager")

_compute_provider = DefaultComputeProvider()


class ResourceManager:
    @staticmethod
    def create_resource(
        db: Session,
        name: str,
        resource_type: str,
        organization_id: str,
        project_id: str,
        owner_id: str,
        region: str = "arv-us-east-1",
        spec: Optional[Dict[str, Any]] = None,
        tags: Optional[Dict[str, str]] = None,
    ) -> ResourceRecord:
        """
        Creates and provisions a cloud resource through the control plane reconciliation flow:
        Desired State (RUNNING) -> Provisioner -> Observed State (RUNNING with IP/Specs).
        """
        spec_dict = spec or {}
        tags_dict = tags or {}
        now = datetime.utcnow()

        resource = ResourceRecord(
            name=name.strip(),
            type=resource_type.lower(),
            organization_id=organization_id,
            project_id=project_id,
            region=region,
            status="PROVISIONING",
            desired_state="RUNNING",
            observed_state="PENDING",
            spec=json.dumps(spec_dict),
            metadata_json="{}",
            tags=json.dumps(tags_dict),
            owner_id=owner_id,
            created_at=now,
            updated_at=now
        )
        db.add(resource)
        db.commit()
        db.refresh(resource)

        # Reconcile via Provider
        try:
            if resource.type == "compute":
                obs_meta = _compute_provider.provision(resource.id, spec_dict, region)
            else:
                obs_meta = {
                    "provider": "aravanta-native",
                    "resource_type": resource.type,
                    "region": region,
                    "status": "READY"
                }

            resource.metadata_json = json.dumps(obs_meta)
            resource.status = "RUNNING" if resource.type == "compute" else "READY"
            resource.observed_state = resource.status
            resource.updated_at = datetime.utcnow()

            # Record Event
            event = EventRecord(
                organization_id=organization_id,
                project_id=project_id,
                resource_id=resource.id,
                event_type="ResourceCreated",
                payload=json.dumps({"name": resource.name, "type": resource.type, "region": region}),
                timestamp=datetime.utcnow()
            )
            db.add(event)
            db.commit()
            db.refresh(resource)
        except Exception as exc:
            logger.error("Failed to provision resource %s: %s", resource.id, exc)
            resource.status = "ERROR"
            resource.observed_state = "FAILED"
            resource.metadata_json = json.dumps({"error": str(exc)})
            db.commit()
            db.refresh(resource)

        if resource.status in ("RUNNING", "READY"):
            try:
                MeteringService.start_usage(db, resource)
            except Exception as m_err:
                logger.warning("Failed to start usage metering: %s", m_err)

        return resource

    @staticmethod
    def get_resource(db: Session, resource_id: str, organization_id: Optional[str] = None) -> Optional[ResourceRecord]:
        query = db.query(ResourceRecord).filter(ResourceRecord.id == resource_id)
        if organization_id:
            query = query.filter(ResourceRecord.organization_id == organization_id)
        return query.first()

    @staticmethod
    def list_resources(
        db: Session,
        organization_id: str,
        project_id: Optional[str] = None,
        resource_type: Optional[str] = None,
        status: Optional[str] = None,
    ) -> List[ResourceRecord]:
        query = db.query(ResourceRecord).filter(ResourceRecord.organization_id == organization_id)
        if project_id:
            query = query.filter(ResourceRecord.project_id == project_id)
        if resource_type:
            query = query.filter(ResourceRecord.type == resource_type.lower())
        if status:
            query = query.filter(ResourceRecord.status == status.upper())
        return query.order_by(ResourceRecord.created_at.desc()).all()

    @staticmethod
    def execute_action(
        db: Session,
        resource: ResourceRecord,
        action: str
    ) -> ResourceRecord:
        """
        Executes lifecycle action (start, stop, reboot, terminate) and reconciles state.
        """
        try:
            meta = json.loads(resource.metadata_json) if resource.metadata_json else {}
        except Exception:
            meta = {}

        action_clean = action.lower().strip()
        if action_clean == "stop":
            resource.desired_state = "STOPPED"
            if resource.type == "compute":
                meta = _compute_provider.stop(resource.id, meta)
            resource.status = "STOPPED"
            resource.observed_state = "STOPPED"
            try:
                MeteringService.stop_usage(db, resource)
            except Exception as m_err:
                logger.warning("Failed to stop usage metering: %s", m_err)
        elif action_clean in ("start", "resume"):
            resource.desired_state = "RUNNING"
            if resource.type == "compute":
                meta = _compute_provider.start(resource.id, meta)
            resource.status = "RUNNING"
            resource.observed_state = "RUNNING"
            try:
                MeteringService.start_usage(db, resource)
            except Exception as m_err:
                logger.warning("Failed to start usage metering: %s", m_err)
        elif action_clean == "terminate":
            resource.desired_state = "TERMINATED"
            if resource.type == "compute":
                meta = _compute_provider.terminate(resource.id, meta)
            resource.status = "TERMINATED"
            resource.observed_state = "TERMINATED"
            try:
                MeteringService.stop_usage(db, resource, terminate=True)
            except Exception as m_err:
                logger.warning("Failed to terminate usage metering: %s", m_err)

        resource.metadata_json = json.dumps(meta)
        resource.updated_at = datetime.utcnow()

        event = EventRecord(
            organization_id=resource.organization_id,
            project_id=resource.project_id,
            resource_id=resource.id,
            event_type=f"ResourceAction:{action_clean.capitalize()}",
            payload=json.dumps({"action": action_clean, "status": resource.status}),
            timestamp=datetime.utcnow()
        )
        db.add(event)
        db.commit()
        db.refresh(resource)
        return resource

    @staticmethod
    def delete_resource(db: Session, resource: ResourceRecord) -> None:
        """Terminates and purges the resource record."""
        ResourceManager.execute_action(db, resource, "terminate")
        try:
            MeteringService.close_all_for_resource(db, resource.id)
        except Exception:
            pass
        db.delete(resource)
        db.commit()
