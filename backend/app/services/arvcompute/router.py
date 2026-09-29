"""
Aravanta CloudOS — ArvCompute Service Router
Real cloud control plane implementation:
- Dispatches to real cloud providers (AWS EC2 or verified Local Docker).
- When credentials are not configured, records metadata honestly in AWAITING_PROVIDER_SETUP.
- Prohibits fake IPs, fake metrics, or fake RUNNING states without provider proof.
- Governed by Evidence-Gated State Guard.
"""
import hashlib
import json
import base64
from datetime import datetime
from typing import Optional, List
from fastapi import APIRouter, HTTPException, Query, Depends, status
from pydantic import BaseModel
from cryptography.hazmat.primitives.asymmetric import ed25519
from cryptography.hazmat.primitives import serialization
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.services.arvgate.models import User, AuditLog
from app.services.arvgate.dependencies import get_current_user, require_roles
from app.core.cloud_models import ComputeInstance, emit_notification, SSHKeyPair
from app.core.state_guard import transition_resource_state, StateGuardViolation
from app.core.crypto import PLATFORM_MASTER_KEY, decrypt_aes256gcm
from app.core.providers import get_provider
from app.services.cloud_providers.models import CloudProviderCredential

router = APIRouter(prefix="/api/v1/compute", tags=["ArvCompute"])

REGIONS = ["arv-us-east-1", "arv-us-west-2", "arv-eu-west-1", "arv-ap-south-1"]
INSTANCE_TYPES = [
    {"id": "arv.nano", "vcpus": 1, "ram_gb": 0.5, "price_hr": 0.005},
    {"id": "arv.micro", "vcpus": 1, "ram_gb": 1, "price_hr": 0.012},
    {"id": "arv.small", "vcpus": 1, "ram_gb": 2, "price_hr": 0.023},
    {"id": "arv.medium", "vcpus": 2, "ram_gb": 4, "price_hr": 0.046},
    {"id": "arv.large", "vcpus": 2, "ram_gb": 8, "price_hr": 0.092},
    {"id": "arv.xlarge", "vcpus": 4, "ram_gb": 16, "price_hr": 0.184},
    {"id": "arv.2xlarge", "vcpus": 8, "ram_gb": 32, "price_hr": 0.368},
    {"id": "arv.compute.medium", "vcpus": 4, "ram_gb": 8, "price_hr": 0.085},
    {"id": "arv.compute.large", "vcpus": 8, "ram_gb": 16, "price_hr": 0.170},
    {"id": "arv.memory.large", "vcpus": 2, "ram_gb": 16, "price_hr": 0.134},
    {"id": "arv.memory.xlarge", "vcpus": 4, "ram_gb": 32, "price_hr": 0.268},
    {"id": "arv.gpu.medium", "vcpus": 4, "ram_gb": 16, "price_hr": 0.526},
]
OS_IMAGES = [
    "Ubuntu 22.04 LTS", "Ubuntu 24.04 LTS", "Debian 12 Bookworm",
    "Amazon Linux 2023", "CentOS Stream 9", "Rocky Linux 9.3",
    "Windows Server 2022", "Aravanta CoreOS 1.0"
]

def _det_id(prefix: str, name: str) -> str:
    return f"{prefix}-{hashlib.md5(f'{name}-{datetime.utcnow().timestamp()}'.encode()).hexdigest()[:10]}"

def _get_compute_driver_for_user(db: Session, user_id: str):
    cred = db.query(CloudProviderCredential).filter(
        CloudProviderCredential.user_id == user_id,
        CloudProviderCredential.provider.in_(["AWS", "EC2"])
    ).first()
    if cred:
        try:
            raw_creds = json.loads(decrypt_aes256gcm(PLATFORM_MASTER_KEY, cred.encrypted_credentials))
            return get_provider("AWS", raw_creds), "provider"
        except Exception:
            pass
    # Check local Docker daemon
    try:
        docker_provider = get_provider("DOCKER")
        success, _, _ = docker_provider.test_connection({})
        if success:
            return docker_provider, "docker"
    except Exception:
        pass
    return None, None


# ─── Schemas ────────────────────────────────────────────────────
class CreateInstanceRequest(BaseModel):
    name: str
    instance_type: str = "arv.medium"
    os_image: str = "Ubuntu 22.04 LTS"
    region: str = "arv-us-east-1"
    disk_gb: int = 50
    tags: dict = {}

class ActionRequest(BaseModel):
    action: str  # start, stop, reboot, terminate

class CreateKeypairRequest(BaseModel):
    name: str

# ─── Endpoints ──────────────────────────────────────────────────
@router.get("/provider-status")
def get_provider_status(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    provider, p_type = _get_compute_driver_for_user(db, str(current_user.id))
    if provider:
        return {
            "provider_configured": True,
            "provider_type": p_type,
            "message": f"Connected to {p_type.upper()} compute infrastructure.",
            "supported_providers": ["aws_ec2", "docker_local"]
        }
    return {
        "provider_configured": False,
        "message": "No compute provider configured. Connect AWS credentials to provision real VMs.",
        "supported_providers": ["aws_ec2", "docker_local"]
    }

@router.post("/keypairs")
def create_keypair(
    req: CreateKeypairRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    private_key = ed25519.Ed25519PrivateKey.generate()
    private_bytes = private_key.private_bytes(
        encoding=serialization.Encoding.PEM,
        format=serialization.PrivateFormat.OpenSSH,
        encryption_algorithm=serialization.NoEncryption()
    )
    public_key = private_key.public_key()
    public_bytes = public_key.public_bytes(
        encoding=serialization.Encoding.OpenSSH,
        format=serialization.PublicFormat.OpenSSH
    )
    digest = hashlib.sha256(public_bytes).digest()
    fingerprint = "SHA256:" + base64.b64encode(digest).decode('utf-8').rstrip('=')

    kp = SSHKeyPair(
        user_id=current_user.id,
        workspace_id=current_user.workspace_id or "default",
        name=req.name,
        public_key=public_bytes.decode('utf-8'),
        fingerprint=fingerprint
    )
    db.add(kp)
    db.commit()
    db.refresh(kp)

    return {
        "id": kp.id,
        "name": kp.name,
        "fingerprint": kp.fingerprint,
        "private_key": private_bytes.decode('utf-8')
    }

@router.get("/keypairs")
def list_keypairs(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = db.query(SSHKeyPair)
    user_role = (current_user.role or "").strip().lower()
    if user_role not in ["superadmin", "admin"]:
        query = query.filter(
            (SSHKeyPair.user_id == current_user.id) |
            (SSHKeyPair.workspace_id == current_user.workspace_id)
        )
    return [kp.to_dict() for kp in query.all()]

@router.delete("/keypairs/{name}")
def delete_keypair(
    name: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = db.query(SSHKeyPair).filter(SSHKeyPair.name == name)
    user_role = (current_user.role or "").strip().lower()
    if user_role not in ["superadmin", "admin"]:
        query = query.filter(
            (SSHKeyPair.user_id == current_user.id) |
            (SSHKeyPair.workspace_id == current_user.workspace_id)
        )
    kp = query.first()
    if not kp:
        raise HTTPException(status_code=404, detail="Keypair not found")
    db.delete(kp)
    db.commit()
    return {"message": "Keypair deleted"}

@router.get("/instances/{instance_id}/connect")
def connect_instance(
    instance_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    inst = db.query(ComputeInstance).filter(ComputeInstance.id == instance_id).first()
    if not inst:
        raise HTTPException(status_code=404, detail=f"Instance {instance_id} not found")
    
    if inst.public_ip:
        return {
            "connectable": True,
            "ssh_command": f"ssh -i ~/.ssh/aravanta-key.pem ubuntu@{inst.public_ip}",
            "public_ip": inst.public_ip,
            "username": "ubuntu",
            "port": 22
        }
    else:
        return {
            "connectable": False,
            "reason": f"Instance {instance_id} is in status '{inst.status}' with no public IP assigned. A real instance must be provisioned on an active provider with a verified public IP to establish an SSH connection.",
            "status": inst.status
        }

@router.post("/instances/{instance_id}/reconcile")
def reconcile_instance(
    instance_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    inst = db.query(ComputeInstance).filter(ComputeInstance.id == instance_id).first()
    if not inst:
        raise HTTPException(status_code=404, detail=f"Instance {instance_id} not found")
    
    provider, p_type = _get_compute_driver_for_user(db, str(current_user.id))
    if provider and inst.provider_resource_id:
        try:
            status_info = provider.compute.get_status(inst.provider_resource_id)
            target_status = status_info.get("status", "UNKNOWN")
            transition_resource_state(
                inst,
                target_state=target_status,
                provider_resource_id=inst.provider_resource_id,
                state_source=p_type,
                observed_at=datetime.utcnow()
            )
            inst.private_ip = status_info.get("private_ip")
            inst.public_ip = status_info.get("public_ip")
        except Exception as e:
            inst.last_error = str(e)
    else:
        if inst.status not in ["AWAITING_PROVIDER_SETUP", "FAILED", "DELETED"]:
            transition_resource_state(
                inst,
                target_state="AWAITING_PROVIDER_SETUP",
                state_source="registry-only",
                last_error="No provider connection verified."
            )
    
    db.commit()
    db.refresh(inst)
    return inst.to_dict()

@router.get("/instances")
def list_instances(
    region: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = db.query(ComputeInstance)
    if (current_user.role or "").strip().lower() not in ["superadmin", "admin"]:
        query = query.filter(
            (ComputeInstance.user_id == current_user.id) |
            (ComputeInstance.workspace_id == current_user.workspace_id)
        )
    if region:
        query = query.filter(ComputeInstance.region == region)
    if status:
        query = query.filter(ComputeInstance.status == status.upper())
    
    instances = query.order_by(ComputeInstance.created_at.desc()).all()
    return [inst.to_dict() for inst in instances]

@router.get("/instances/{instance_id}")
def get_instance(
    instance_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    inst = db.query(ComputeInstance).filter(ComputeInstance.id == instance_id).first()
    if not inst:
        raise HTTPException(status_code=404, detail=f"Instance {instance_id} not found")
    user_role = (current_user.role or "").strip().lower()
    if user_role not in ["superadmin", "admin"] and inst.user_id != current_user.id and inst.workspace_id != current_user.workspace_id:
        raise HTTPException(status_code=403, detail="Access denied to this instance")
    return inst.to_dict()

@router.post("/instances", status_code=201)
def create_instance(
    req: CreateInstanceRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(["SuperAdmin", "Admin", "Operator"]))
):
    inst_id = _det_id("arv-i", req.name)
    now = datetime.utcnow()
    
    new_inst = ComputeInstance(
        id=inst_id,
        user_id=current_user.id,
        workspace_id=current_user.workspace_id or "default",
        name=req.name.strip(),
        instance_type=req.instance_type,
        os_image=req.os_image,
        region=req.region,
        status="PROVISIONING",
        private_ip=None,
        public_ip=None,
        cpu_usage=None,
        ram_usage=None,
        disk_gb=req.disk_gb,
        tags=json.dumps(req.tags or {}),
        created_at=now,
        updated_at=now
    )
    db.add(new_inst)
    db.flush()

    provider, p_type = _get_compute_driver_for_user(db, str(current_user.id))
    if provider:
        try:
            spec = {
                "name": req.name.strip(),
                "instance_type": req.instance_type,
                "os_image": req.os_image,
                "disk_gb": req.disk_gb,
                "resource_id": inst_id
            }
            res = provider.compute.create(spec, idempotency_key=inst_id)
            target_st = res.get("status", "RUNNING")
            transition_resource_state(
                new_inst,
                target_state=target_st,
                provider_resource_id=res["provider_resource_id"],
                state_source=p_type,
                observed_at=now
            )
            new_inst.private_ip = res.get("private_ip")
            new_inst.public_ip = res.get("public_ip")
        except Exception as e:
            transition_resource_state(
                new_inst,
                target_state="FAILED",
                state_source=p_type or "provider",
                last_error=str(e)
            )
    else:
        transition_resource_state(
            new_inst,
            target_state="AWAITING_PROVIDER_SETUP",
            state_source="registry-only",
            last_error="No compute provider configured. Connect AWS credentials to provision real compute."
        )

    # Log audit entry
    audit = AuditLog(
        id=f"audit-{hashlib.md5(f'{inst_id}-{now.isoformat()}'.encode()).hexdigest()[:12]}",
        workspace_id=current_user.workspace_id,
        user_email=current_user.email,
        action="CREATE_INSTANCE",
        resource=req.name.strip(),
        details=f"Compute instance request: {req.instance_type} in {req.region} (status: {new_inst.status})"
    )
    db.add(audit)

    # Emit persistent notification
    emit_notification(
        db=db,
        user_id=current_user.id,
        workspace_id=current_user.workspace_id,
        title="VM Instance Created" if new_inst.status in ["RUNNING", "PROVISIONING"] else "Compute Setup Required",
        desc=f"Instance {req.name} status is {new_inst.status}.",
        type="success" if new_inst.status in ["RUNNING", "PROVISIONING"] else "warning"
    )

    db.commit()
    db.refresh(new_inst)

    if new_inst.status == "RUNNING":
        try:
            from app.billing.metering_service import MeteringService
            MeteringService.start_resource_meter(
                db=db,
                resource_id=new_inst.id,
                resource_type="compute",
                organization_id=current_user.workspace_id or "default"
            )
        except Exception:
            pass

    return new_inst.to_dict()

@router.post("/instances/{instance_id}/action")
def instance_action(
    instance_id: str,
    req: ActionRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    inst = db.query(ComputeInstance).filter(ComputeInstance.id == instance_id).first()
    if not inst:
        raise HTTPException(status_code=404, detail=f"Instance {instance_id} not found")
    user_role = (current_user.role or "").strip().lower()
    if user_role not in ["superadmin", "admin"] and inst.user_id != current_user.id and inst.workspace_id != current_user.workspace_id:
        raise HTTPException(status_code=403, detail="Access denied to this instance")

    action = req.action.lower()
    if action == "terminate":
        if user_role not in ["superadmin", "admin"]:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"User role '{current_user.role}' is not authorized to terminate instances."
            )
        inst_name = inst.name
        if inst.provider_resource_id:
            provider, p_type = _get_compute_driver_for_user(db, str(current_user.id))
            if provider:
                try:
                    provider.compute.delete(inst.provider_resource_id)
                except Exception as e:
                    raise HTTPException(502, f"Provider error terminating instance: {e}")

        db.delete(inst)
        try:
            from app.billing.metering_service import MeteringService
            MeteringService.stop_resource_meter(db=db, resource_id=instance_id, debit_from_account=True)
        except Exception:
            pass
        emit_notification(
            db=db,
            user_id=current_user.id,
            workspace_id=current_user.workspace_id,
            title="Instance Terminated",
            desc=f"VM instance {inst_name} ({instance_id}) was terminated and removed.",
            type="error"
        )
        db.commit()
        return {"message": f"Instance {instance_id} terminated"}

    if action in ["start", "stop", "reboot"]:
        if user_role not in ["superadmin", "admin", "operator", "developer"]:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"User role '{current_user.role}' is not authorized to perform {action} action."
            )
        if not inst.provider_resource_id:
            raise HTTPException(
                status_code=400,
                detail=f"Cannot perform '{action}' on an unprovisioned instance (status: {inst.status}). Connect a cloud provider to provision real infrastructure."
            )
        
        provider, p_type = _get_compute_driver_for_user(db, str(current_user.id))
        if not provider:
            raise HTTPException(status_code=503, detail="Active cloud provider credentials missing or unreachable.")
        
        try:
            if action == "start":
                res = provider.compute.start(inst.provider_resource_id)
                target_state = res.get("status", "STARTING")
            elif action == "stop":
                res = provider.compute.stop(inst.provider_resource_id)
                target_state = res.get("status", "STOPPING")
            elif action == "reboot":
                res = provider.compute.restart(inst.provider_resource_id)
                target_state = res.get("status", "STARTING")

            transition_resource_state(
                inst,
                target_state=target_state,
                provider_resource_id=inst.provider_resource_id,
                state_source=p_type,
                observed_at=datetime.utcnow()
            )
        except Exception as e:
            inst.last_error = str(e)
            raise HTTPException(502, f"Provider error executing {action}: {e}")

        db.commit()
        db.refresh(inst)
        return inst.to_dict()
    else:
        raise HTTPException(status_code=400, detail=f"Unknown action: {action}")

@router.delete("/instances/{instance_id}")
def delete_instance(
    instance_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(["SuperAdmin", "Admin"]))
):
    inst = db.query(ComputeInstance).filter(ComputeInstance.id == instance_id).first()
    if not inst:
        raise HTTPException(status_code=404, detail=f"Instance {instance_id} not found")
    user_role = (current_user.role or "").strip().lower()
    if user_role not in ["superadmin", "admin"] and inst.user_id != current_user.id and inst.workspace_id != current_user.workspace_id:
        raise HTTPException(status_code=403, detail="Access denied to this instance")

    if inst.provider_resource_id:
        provider, _ = _get_compute_driver_for_user(db, str(current_user.id))
        if provider:
            try:
                provider.compute.delete(inst.provider_resource_id)
            except Exception:
                pass

    inst_name = inst.name
    db.delete(inst)
    emit_notification(
        db=db,
        user_id=current_user.id,
        workspace_id=current_user.workspace_id,
        title="Instance Terminated",
        desc=f"VM instance {inst_name} ({instance_id}) was deleted.",
        type="error"
    )
    db.commit()
    return {"message": f"Instance {instance_id} terminated"}

@router.get("/instance-types")
def list_instance_types():
    return INSTANCE_TYPES

@router.get("/regions")
def list_regions():
    return [{"id": r, "name": r.replace("arv-", "").replace("-", " ").title()} for r in REGIONS]

@router.get("/os-images")
def list_os_images():
    return [{"id": img, "name": img} for img in OS_IMAGES]

@router.get("/summary")
def compute_summary(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = db.query(ComputeInstance)
    user_role = (current_user.role or "").strip().lower()
    if user_role not in ["superadmin", "admin"]:
        query = query.filter(
            (ComputeInstance.user_id == current_user.id) |
            (ComputeInstance.workspace_id == current_user.workspace_id)
        )
    instances = query.all()

    running = len([i for i in instances if i.status == "RUNNING"])
    stopped = len([i for i in instances if i.status == "STOPPED"])
    awaiting_setup = len([i for i in instances if i.status == "AWAITING_PROVIDER_SETUP"])
    total_vcpus = 0
    total_ram = 0
    for inst in instances:
        if inst.status == "RUNNING":
            itype = next((t for t in INSTANCE_TYPES if t["id"] == inst.instance_type), None)
            if itype:
                total_vcpus += itype["vcpus"]
                total_ram += itype["ram_gb"]
            else:
                total_vcpus += 2
                total_ram += 4

    return {
        "total_instances": len(instances),
        "running": running,
        "stopped": stopped,
        "awaiting_setup": awaiting_setup,
        "total_vcpus": total_vcpus,
        "total_ram_gb": total_ram,
        "regions_active": len(set(i.region for i in instances if i.status == "RUNNING")) if instances else 0,
    }
