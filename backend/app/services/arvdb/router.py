"""
Aravanta CloudOS — ArvDB Service Router
Full CRUD for managed database instances.
"""
import hashlib
import random
from datetime import datetime, timedelta
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

router = APIRouter(prefix="/api/v1/databases", tags=["ArvDB"])

DB_ENGINES = ["PostgreSQL 15", "PostgreSQL 16", "MySQL 8.0", "MariaDB 11", "Redis 7.2", "MongoDB 7.0"]
DB_TIERS = [
    {"id": "db.arv.micro", "vcpus": 1, "ram_gb": 1, "price_hr": 0.018},
    {"id": "db.arv.small", "vcpus": 1, "ram_gb": 2, "price_hr": 0.036},
    {"id": "db.arv.medium", "vcpus": 2, "ram_gb": 4, "price_hr": 0.072},
    {"id": "db.arv.large", "vcpus": 2, "ram_gb": 8, "price_hr": 0.144},
    {"id": "db.arv.xlarge", "vcpus": 4, "ram_gb": 16, "price_hr": 0.288},
    {"id": "db.arv.2xlarge", "vcpus": 8, "ram_gb": 32, "price_hr": 0.576},
]

_databases: dict[str, dict] = {}

def _deterministic_id(prefix: str, name: str) -> str:
    return f"{prefix}-{hashlib.md5(name.encode()).hexdigest()[:8]}"

def _get_tier_price(tier_id: str) -> float:
    for t in DB_TIERS:
        if t["id"] == tier_id:
            return t["price_hr"]
    return 0.072

# Seed databases
_seed_dbs = [
    ("aravanta-core-db", "PostgreSQL 16", "db.arv.large", "arv-us-east-1", 100),
    ("aravanta-analytics", "PostgreSQL 15", "db.arv.xlarge", "arv-us-east-1", 500),
    ("session-cache", "Redis 7.2", "db.arv.medium", "arv-us-east-1", 0),
    ("user-documents", "MongoDB 7.0", "db.arv.large", "arv-us-west-2", 200),
]

random.seed(42)
for name, engine, tier, region, storage in _seed_dbs:
    db_id = _deterministic_id("arv-db", name)
    port = "6379" if "Redis" in engine else ("27017" if "MongoDB" in engine else "5432")
    conn_active = random.randint(5, 120)
    conn_max = random.choice([100, 200, 500])
    storage_used = round(storage * random.uniform(0.4, 0.95), 1) if storage > 0 else 0
    _databases[db_id] = {
        "id": db_id,
        "name": name,
        "engine": engine,
        "tier": tier,
        "region": region,
        "storage_gb": storage,
        "storage_used_gb": storage_used,
        "status": "AVAILABLE",
        "endpoint": f"{name}.db.aravanta.cloud",
        "port": port,
        "connection_count": conn_active,
        "connections_active": conn_active,
        "connections_max": conn_max,
        "latency_ms": round(random.uniform(0.5, 8.0), 1),
        "iops": random.randint(1000, 15000),
        "created_at": (datetime.utcnow() - timedelta(days=random.randint(10, 100))).isoformat() + "Z",
        "multi_az": True,
        "monthly_cost_usd": round(_get_tier_price(tier) * 730, 2),
    }
random.seed()

class CreateDatabaseRequest(BaseModel):
    name: str
    engine: str = "PostgreSQL 16"
    tier: str = "db.arv.medium"
    region: str = "arv-us-east-1"
    storage_gb: int = 100
    multi_az: bool = False

@router.get("/instances")
def list_databases():
    return list(_databases.values())

@router.get("/instances/{db_id}")
def get_database(db_id: str):
    if db_id not in _databases:
        raise HTTPException(status_code=404, detail="Database not found")
    return _databases[db_id]

@router.post("/instances", status_code=201)
def create_database(req: CreateDatabaseRequest):
    db_id = _deterministic_id("arv-db", req.name)
    port = "6379" if "Redis" in req.engine else ("27017" if "MongoDB" in req.engine else "5432")
    new_db = {
        "id": db_id,
        "name": req.name,
        "engine": req.engine,
        "tier": req.tier,
        "region": req.region,
        "storage_gb": req.storage_gb,
        "storage_used_gb": 0,
        "status": "AVAILABLE",
        "endpoint": f"{req.name}.db.aravanta.cloud",
        "port": port,
        "connection_count": 0,
        "connections_active": 0,
        "connections_max": 200,
        "latency_ms": 0,
        "iops": 0,
        "created_at": datetime.utcnow().isoformat() + "Z",
        "multi_az": req.multi_az,
        "monthly_cost_usd": round(_get_tier_price(req.tier) * 730, 2),
    }
    _databases[db_id] = new_db
    return new_db

@router.delete("/instances/{db_id}")
def delete_database(db_id: str):
    if db_id not in _databases:
        raise HTTPException(status_code=404, detail="Database not found")
    del _databases[db_id]
    return {"message": f"Database {db_id} deleted"}

@router.get("/summary")
def database_summary():
    dbs = list(_databases.values())
    total_monthly = sum(d.get("monthly_cost_usd", 0) for d in dbs)
    return {
        "total_databases": len(dbs),
        "total_instances": len(dbs),
        "available": len([d for d in dbs if d["status"] == "AVAILABLE"]),
        "total_storage_gb": sum(d["storage_gb"] for d in dbs),
        "total_connections": sum(d.get("connections_active", d.get("connection_count", 0)) for d in dbs),
        "engines": list(set(d["engine"] for d in dbs)),
        "total_monthly_cost": total_monthly,
    }
