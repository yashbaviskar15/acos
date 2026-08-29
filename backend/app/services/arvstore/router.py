"""
Aravanta CloudOS — ArvStore Service Router
Full CRUD for object storage buckets and objects with file upload support.
"""
import hashlib
import random
from datetime import datetime, timedelta
from typing import Optional
from fastapi import APIRouter, HTTPException, Query, UploadFile, File, Form
from pydantic import BaseModel

router = APIRouter(prefix="/api/v1/storage", tags=["ArvStore"])

_buckets: dict[str, dict] = {}
_objects: dict[str, list] = {}

STORAGE_CLASSES = ["STANDARD", "INFREQUENT_ACCESS", "ARCHIVE", "GLACIER"]

def _det_id(prefix: str, name: str) -> str:
    return f"{prefix}-{hashlib.md5(name.encode()).hexdigest()[:10]}"

# Seed buckets
_seed_buckets = [
    ("aravanta-assets-prod", "arv-us-east-1", "STANDARD", 156.8, 12400),
    ("aravanta-backups", "arv-us-east-1", "INFREQUENT_ACCESS", 420.3, 890),
    ("ml-datasets", "arv-us-west-2", "STANDARD", 89.4, 2100),
    ("app-logs-archive", "arv-us-east-1", "ARCHIVE", 1240.0, 45000),
]

random.seed(42)
for bname, region, sclass, size_gb, obj_count in _seed_buckets:
    bid = _det_id("arv-s3", bname)
    created = datetime.utcnow() - timedelta(days=random.randint(30, 365))
    _buckets[bid] = {
        "id": bid,
        "name": bname,
        "region": region,
        "storage_class": sclass,
        "size_gb": size_gb,
        "object_count": obj_count,
        "versioning": random.choice([True, False]),
        "encryption": "AES-256",
        "access": random.choice(["PRIVATE", "PRIVATE", "PUBLIC_READ"]),
        "created_at": created.isoformat() + "Z",
        "monthly_cost": round(size_gb * 0.023, 2),
    }
    # Seed some objects
    exts = [".json", ".csv", ".parquet", ".log", ".tar.gz", ".png", ".jpg", ".mp4", ".yaml", ".sql"]
    dirs = ["data/", "backups/", "logs/", "models/", "config/", "assets/", "exports/"]
    bucket_objects = []
    for i in range(min(obj_count, 20)):
        obj = {
            "key": f"{random.choice(dirs)}{hashlib.md5(f'{bname}-obj-{i}'.encode()).hexdigest()[:8]}{random.choice(exts)}",
            "size_bytes": random.randint(1024, 500_000_000),
            "storage_class": sclass,
            "last_modified": (datetime.utcnow() - timedelta(days=random.randint(0, 90))).isoformat() + "Z",
            "content_type": random.choice(["application/json", "text/csv", "application/octet-stream", "image/png"]),
        }
        bucket_objects.append(obj)
    _objects[bid] = bucket_objects
random.seed()

class CreateBucketRequest(BaseModel):
    name: str
    region: str = "arv-us-east-1"
    storage_class: str = "STANDARD"
    versioning: bool = False
    access: str = "PRIVATE"

@router.get("/buckets")
def list_buckets():
    return list(_buckets.values())

@router.get("/buckets/{bucket_id}")
def get_bucket(bucket_id: str):
    if bucket_id not in _buckets:
        raise HTTPException(404, "Bucket not found")
    return _buckets[bucket_id]

@router.post("/buckets", status_code=201)
def create_bucket(req: CreateBucketRequest):
    bid = _det_id("arv-s3", req.name)
    bucket = {
        "id": bid,
        "name": req.name,
        "region": req.region,
        "storage_class": req.storage_class,
        "size_gb": 0,
        "object_count": 0,
        "versioning": req.versioning,
        "encryption": "AES-256",
        "access": req.access,
        "created_at": datetime.utcnow().isoformat() + "Z",
        "monthly_cost": 0,
    }
    _buckets[bid] = bucket
    _objects[bid] = []
    return bucket

@router.delete("/buckets/{bucket_id}")
def delete_bucket(bucket_id: str):
    if bucket_id not in _buckets:
        raise HTTPException(404, "Bucket not found")
    del _buckets[bucket_id]
    _objects.pop(bucket_id, None)
    return {"message": f"Bucket {bucket_id} deleted"}

@router.get("/buckets/{bucket_id}/objects")
def list_objects(bucket_id: str, prefix: Optional[str] = Query(None)):
    if bucket_id not in _buckets:
        raise HTTPException(404, "Bucket not found")
    objs = _objects.get(bucket_id, [])
    if prefix:
        objs = [o for o in objs if o["key"].startswith(prefix)]
    return objs

@router.post("/buckets/{bucket_id}/upload", status_code=201)
async def upload_file(
    bucket_id: str,
    file: UploadFile = File(...),
    folder_prefix: str = Form("uploads/")
):
    if bucket_id not in _buckets:
        raise HTTPException(404, "Bucket not found")

    content = await file.read()
    file_size = len(content)

    # Form key path
    prefix = folder_prefix.strip()
    if prefix and not prefix.endswith("/"):
        prefix += "/"
    key_path = f"{prefix}{file.filename}"

    new_obj = {
        "key": key_path,
        "size_bytes": file_size,
        "storage_class": _buckets[bucket_id].get("storage_class", "STANDARD"),
        "last_modified": datetime.utcnow().isoformat() + "Z",
        "content_type": file.content_type or "application/octet-stream",
    }

    if bucket_id not in _objects:
        _objects[bucket_id] = []
    _objects[bucket_id].insert(0, new_obj)

    # Update bucket stats
    _buckets[bucket_id]["object_count"] += 1
    _buckets[bucket_id]["size_gb"] = round(_buckets[bucket_id]["size_gb"] + (file_size / 1024 / 1024 / 1024), 3)

    return {
        "message": f"File '{file.filename}' uploaded successfully to bucket '{_buckets[bucket_id]['name']}'",
        "object": new_obj
    }

@router.get("/summary")
def storage_summary():
    buckets = list(_buckets.values())
    return {
        "total_buckets": len(buckets),
        "total_size_gb": round(sum(b["size_gb"] for b in buckets), 1),
        "total_objects": sum(b["object_count"] for b in buckets),
        "total_monthly_cost": round(sum(b["monthly_cost"] for b in buckets), 2),
    }
