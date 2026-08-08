"""
Aravanta CloudOS — ArvCompute Service Router
Full CRUD for virtual machine instances with in-memory data store.
"""
import uuid
import random
from datetime import datetime, timedelta
from typing import Optional
from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel

router = APIRouter(prefix="/api/v1/compute", tags=["ArvCompute"])

# ─── In-Memory Data Store ───────────────────────────────────────
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

def _random_ip():
    return f"10.{random.randint(0,255)}.{random.randint(1,254)}.{random.randint(1,254)}"

def _random_public_ip():
    return f"{random.randint(34,52)}.{random.randint(100,255)}.{random.randint(1,254)}.{random.randint(1,254)}"

# Seed initial instances
_instances: dict[str, dict] = {}
_seed_names = [
    ("web-server-prod-01", "arv.large", "Ubuntu 22.04 LTS", "arv-us-east-1"),
    ("api-gateway-prod", "arv.xlarge", "Aravanta CoreOS 1.0", "arv-us-east-1"),
    ("worker-node-01", "arv.compute.large", "Ubuntu 24.04 LTS", "arv-us-east-1"),
    ("worker-node-02", "arv.compute.large", "Ubuntu 24.04 LTS", "arv-us-east-1"),
    ("ml-training-gpu", "arv.gpu.medium", "Ubuntu 22.04 LTS", "arv-us-west-2"),
    ("staging-app-01", "arv.medium", "Ubuntu 22.04 LTS", "arv-eu-west-1"),
    ("db-replica-reader", "arv.memory.large", "Amazon Linux 2023", "arv-us-east-1"),
    ("monitoring-stack", "arv.large", "Aravanta CoreOS 1.0", "arv-us-east-1"),
    ("ci-runner-01", "arv.compute.medium", "Ubuntu 24.04 LTS", "arv-us-west-2"),
    ("bastion-host", "arv.small", "Ubuntu 22.04 LTS", "arv-us-east-1"),
]
for name, itype, os_img, region in _seed_names:
    inst_id = f"arv-i-{uuid.uuid4().hex[:12]}"
    launched = datetime.utcnow() - timedelta(days=random.randint(1, 90), hours=random.randint(0, 23))
    _instances[inst_id] = {
        "id": inst_id,
        "name": name,
        "instance_type": itype,
        "os_image": os_img,
        "region": region,
        "status": random.choice(["RUNNING", "RUNNING", "RUNNING", "RUNNING", "STOPPED"]),
        "private_ip": _random_ip(),
        "public_ip": _random_public_ip() if random.random() > 0.3 else None,
        "cpu_usage": round(random.uniform(5, 85), 1),
        "ram_usage": round(random.uniform(20, 90), 1),
        "disk_gb": random.choice([20, 50, 100, 200, 500]),
        "launched_at": launched.isoformat() + "Z",
        "tags": {"env": random.choice(["production", "staging", "development"]), "team": random.choice(["platform", "backend", "ml", "devops"])},
    }

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
def list_instances(region: Optional[str] = Query(None), status: Optional[str] = Query(None)):
    result = list(_instances.values())
    if region:
        result = [i for i in result if i["region"] == region]
    if status:
        result = [i for i in result if i["status"] == status.upper()]
    return result

@router.get("/instances/{instance_id}")
def get_instance(instance_id: str):
    if instance_id not in _instances:
        raise HTTPException(status_code=404, detail=f"Instance {instance_id} not found")
    return _instances[instance_id]

@router.post("/instances", status_code=201)
def create_instance(req: CreateInstanceRequest):
    inst_id = f"arv-i-{uuid.uuid4().hex[:12]}"
    instance = {
        "id": inst_id,
        "name": req.name,
        "instance_type": req.instance_type,
        "os_image": req.os_image,
        "region": req.region,
        "status": "RUNNING",
        "private_ip": _random_ip(),
        "public_ip": _random_public_ip(),
        "cpu_usage": round(random.uniform(2, 15), 1),
        "ram_usage": round(random.uniform(10, 30), 1),
        "disk_gb": req.disk_gb,
        "launched_at": datetime.utcnow().isoformat() + "Z",
        "tags": req.tags,
    }
    _instances[inst_id] = instance
    return instance

@router.post("/instances/{instance_id}/action")
def instance_action(instance_id: str, req: ActionRequest):
    if instance_id not in _instances:
        raise HTTPException(status_code=404, detail=f"Instance {instance_id} not found")
    inst = _instances[instance_id]
    action = req.action.lower()
    if action == "start":
        inst["status"] = "RUNNING"
        inst["cpu_usage"] = round(random.uniform(5, 25), 1)
    elif action == "stop":
        inst["status"] = "STOPPED"
        inst["cpu_usage"] = 0.0
        inst["ram_usage"] = 0.0
    elif action == "reboot":
        inst["status"] = "RUNNING"
        inst["cpu_usage"] = round(random.uniform(5, 15), 1)
    elif action == "terminate":
        del _instances[instance_id]
        return {"message": f"Instance {instance_id} terminated"}
    else:
        raise HTTPException(status_code=400, detail=f"Unknown action: {action}")
    return inst

@router.delete("/instances/{instance_id}")
def delete_instance(instance_id: str):
    if instance_id not in _instances:
        raise HTTPException(status_code=404, detail=f"Instance {instance_id} not found")
    del _instances[instance_id]
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
def compute_summary():
    instances = list(_instances.values())
    running = len([i for i in instances if i["status"] == "RUNNING"])
    stopped = len([i for i in instances if i["status"] == "STOPPED"])
    total_vcpus = 0
    total_ram = 0
    for inst in instances:
        if inst["status"] == "RUNNING":
            itype = next((t for t in INSTANCE_TYPES if t["id"] == inst["instance_type"]), None)
            if itype:
                total_vcpus += itype["vcpus"]
                total_ram += itype["ram_gb"]
    return {
        "total_instances": len(instances),
        "running": running,
        "stopped": stopped,
        "total_vcpus": total_vcpus,
        "total_ram_gb": total_ram,
        "regions_active": len(set(i["region"] for i in instances)),
    }
