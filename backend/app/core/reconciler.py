"""
Aravanta Cloud OS — Infrastructure Reconciler
Periodically compares provider state with registry to reconcile drift,
detect external deletion (MISSING_AT_PROVIDER), and handle provider outages (UNKNOWN).
"""
import logging
from datetime import datetime
from typing import Dict, Any, Optional
from sqlalchemy.orm import Session

from app.core.database import SessionLocal
from app.core.cloud_models import ComputeInstance, KubeCluster, DatabaseInstance
from app.core.state_guard import transition_resource_state, StateGuardViolation
from app.core.providers import get_provider
from app.core.crypto import PLATFORM_MASTER_KEY, decrypt_aes256gcm
from app.services.cloud_providers.models import CloudProviderCredential
import json

logger = logging.getLogger("aravanta.reconciler")

def get_decrypted_provider_credentials(db: Session, user_id: str, provider_name: str) -> Optional[Dict[str, Any]]:
    cred = db.query(CloudProviderCredential).filter(
        CloudProviderCredential.user_id == user_id,
        CloudProviderCredential.provider == provider_name.upper()
    ).first()
    if not cred or not cred.encrypted_credentials:
        return None
    try:
        raw_json = decrypt_aes256gcm(PLATFORM_MASTER_KEY, cred.encrypted_credentials)
        return json.loads(raw_json)
    except Exception as e:
        logger.error(f"Failed to decrypt credentials for {provider_name}: {e}")
        return None


def reconcile_compute_instance(db: Session, instance: ComputeInstance) -> Dict[str, Any]:
    """Reconciles a single compute instance against its actual cloud/local provider."""
    if not instance.provider_resource_id:
        return {"status": instance.status, "reconciled": False, "reason": "No provider_resource_id"}

    provider_name = (instance.provider or "AWS").upper()
    creds = get_decrypted_provider_credentials(db, instance.user_id, provider_name)
    
    try:
        provider = get_provider(provider_name, creds)
        status_info = provider.compute.get_status(instance.provider_resource_id)
        
        target_state = status_info.get("status", "UNKNOWN")
        source = "provider" if provider_name != "DOCKER" else "docker"
        
        # Check if instance IPs updated
        if status_info.get("public_ip"):
            instance.public_ip = status_info["public_ip"]
        if status_info.get("private_ip"):
            instance.private_ip = status_info["private_ip"]

        transition_resource_state(
            resource=instance,
            target_state=target_state,
            provider_resource_id=instance.provider_resource_id,
            state_source=source,
            observed_at=datetime.utcnow()
        )
        db.commit()
        return {"status": target_state, "reconciled": True, "source": source}
        
    except Exception as e:
        logger.warning(f"Reconciliation failed for instance {instance.id}: {e}")
        instance.actual_state = "UNKNOWN"
        instance.last_error = str(e)
        instance.observed_at = datetime.utcnow()
        db.commit()
        return {"status": "UNKNOWN", "reconciled": False, "error": str(e)}


def reconcile_all_resources() -> Dict[str, int]:
    """Scans and reconciles all active provider-managed infrastructure."""
    db = SessionLocal()
    stats = {"scanned": 0, "reconciled": 0, "errors": 0}
    try:
        instances = db.query(ComputeInstance).filter(
            ComputeInstance.provider_resource_id.isnot(None),
            ComputeInstance.status.notin_(["DELETED", "TERMINATED"])
        ).all()
        
        for inst in instances:
            stats["scanned"] += 1
            res = reconcile_compute_instance(db, inst)
            if res.get("reconciled"):
                stats["reconciled"] += 1
            elif res.get("error"):
                stats["errors"] += 1
        return stats
    finally:
        db.close()
