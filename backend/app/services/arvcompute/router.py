"""
Aravanta CloudOS — ArvCompute Service Router
Full CRUD for virtual machine instances backed by persistent database storage,
scoped to authenticated users, with real notification emission.
"""
import hashlib
import json
import random
from datetime import datetime
from typing import Optional, List
from fastapi import APIRouter, HTTPException, Query, Depends, status
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.services.arvgate.models import User, AuditLog
from app.services.arvgate.dependencies import get_current_user, require_roles
from app.core.cloud_models import ComputeInstance, emit_notification

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

def _random_ip():
    return f"10.{random.randint(0,255)}.{random.randint(1,254)}.{random.randint(1,254)}"

def _random_public_ip():
    return f"{random.randint(34,52)}.{random.randint(100,255)}.{random.randint(1,254)}.{random.randint(1,254)}"

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

# ─── Endpoints ──────────────────────────────────────────────────
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
        status="RUNNING",
        private_ip=_random_ip(),
        public_ip=_random_public_ip(),
        cpu_usage=round(random.uniform(5, 18), 1),
        ram_usage=round(random.uniform(15, 35), 1),
        disk_gb=req.disk_gb,
        tags=json.dumps(req.tags or {}),
        created_at=now,
        updated_at=now
    )
    db.add(new_inst)

    # Log audit entry
    audit = AuditLog(
        id=f"audit-{hashlib.md5(f'{inst_id}-{now.isoformat()}'.encode()).hexdigest()[:12]}",
        workspace_id=current_user.workspace_id,
        user_email=current_user.email,
        action="CREATE_INSTANCE",
        resource=req.name.strip(),
        details=f"Deployed {req.instance_type} in {req.region}"
    )
    db.add(audit)

    # Emit persistent notification
    emit_notification(
        db=db,
        user_id=current_user.id,
        workspace_id=current_user.workspace_id,
        title="VM Instance Deployed",
        desc=f"Instance {req.name} ({req.instance_type}) was launched successfully in {req.region}.",
        type="success"
    )

    db.commit()
    db.refresh(new_inst)
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
        db.delete(inst)
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
    else:
        raise HTTPException(status_code=400, detail=f"Unknown action: {action}")

    if action == "start":
        inst.status = "RUNNING"
        inst.cpu_usage = round(random.uniform(8, 25), 1)
        inst.ram_usage = round(random.uniform(20, 45), 1)
        inst.updated_at = datetime.utcnow()
        emit_notification(
            db=db,
            user_id=current_user.id,
            workspace_id=current_user.workspace_id,
            title="Instance Started",
            desc=f"VM instance {inst.name} is now RUNNING in {inst.region}.",
            type="info"
        )
    elif action == "stop":
        inst.status = "STOPPED"
        inst.cpu_usage = 0.0
        inst.ram_usage = 0.0
        inst.updated_at = datetime.utcnow()
        emit_notification(
            db=db,
            user_id=current_user.id,
            workspace_id=current_user.workspace_id,
            title="Instance Stopped",
            desc=f"VM instance {inst.name} was STOPPED.",
            type="warning"
        )
    elif action == "reboot":
        inst.status = "RUNNING"
        inst.cpu_usage = round(random.uniform(10, 20), 1)
        inst.updated_at = datetime.utcnow()
        emit_notification(
            db=db,
            user_id=current_user.id,
            workspace_id=current_user.workspace_id,
            title="Instance Rebooted",
            desc=f"VM instance {inst.name} completed reboot cycle.",
            type="info"
        )

    db.commit()
    db.refresh(inst)
    return inst.to_dict()

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
        "total_vcpus": total_vcpus,
        "total_ram_gb": total_ram,
        "regions_active": len(set(i.region for i in instances)) if instances else 0,
    }
