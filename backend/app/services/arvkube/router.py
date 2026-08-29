"""
Aravanta CloudOS — ArvKube Service Router
Full CRUD for Kubernetes clusters, node pools, and pods.
"""
import hashlib
import random
from datetime import datetime, timedelta
from typing import Optional
from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel

router = APIRouter(prefix="/api/v1/kubernetes", tags=["ArvKube"])

K8S_VERSIONS = ["1.28.4", "1.29.2", "1.30.1"]
NODE_SIZES = ["arv.medium", "arv.large", "arv.xlarge", "arv.2xlarge"]

_clusters: dict[str, dict] = {}
_pods: dict[str, list] = {}

def _det_id(prefix: str, name: str) -> str:
    return f"{prefix}-{hashlib.md5(name.encode()).hexdigest()[:10]}"

# Seed clusters
_seed_clusters = [
    ("aravanta-prod", "1.30.1", "arv-us-east-1", 5, "ACTIVE"),
    ("aravanta-staging", "1.29.2", "arv-us-east-1", 3, "ACTIVE"),
    ("ml-workloads", "1.30.1", "arv-us-west-2", 4, "ACTIVE"),
]

NAMESPACES = ["default", "kube-system", "aravanta-core", "monitoring", "ingress-nginx"]
POD_PREFIXES = ["api-server", "web-frontend", "worker", "scheduler", "redis", "postgres", "nginx-ingress", "prometheus", "grafana", "loki", "cert-manager"]

random.seed(42)
for cname, ver, region, nodes, status in _seed_clusters:
    cid = _det_id("arv-k8s", cname)
    created = datetime.utcnow() - timedelta(days=random.randint(30, 180))
    _clusters[cid] = {
        "id": cid,
        "name": cname,
        "version": ver,
        "region": region,
        "status": status,
        "node_count": nodes,
        "node_size": random.choice(NODE_SIZES),
        "endpoint": f"https://{cid}.k8s.aravanta.cloud:6443",
        "cpu_cores_total": nodes * random.choice([4, 8]),
        "ram_gb_total": nodes * random.choice([16, 32]),
        "pod_count": 0,
        "created_at": created.isoformat() + "Z",
    }
    # Seed pods per cluster
    pod_count = random.randint(8, 22)
    cluster_pods = []
    for i in range(pod_count):
        prefix = random.choice(POD_PREFIXES)
        suffix = hashlib.md5(f"{cname}-pod-{i}".encode()).hexdigest()[:8]
        pod = {
            "id": f"pod-{hashlib.md5(f'{cname}-{i}'.encode()).hexdigest()[:10]}",
            "name": f"{prefix}-{suffix}",
            "namespace": random.choice(NAMESPACES),
            "status": random.choices(["Running", "Running", "Running", "Running", "Pending", "CrashLoopBackOff", "Completed"], weights=[50, 50, 50, 50, 5, 2, 3])[0],
            "restarts": random.randint(0, 5) if random.random() > 0.7 else 0,
            "cpu_usage_m": random.randint(10, 500),
            "ram_usage_mb": random.randint(32, 1024),
            "node": f"node-{random.randint(1, nodes)}",
            "age_hours": random.randint(1, 720),
            "image": f"aravanta/{prefix}:{random.choice(['latest', 'v1.2.3', 'v2.0.1', 'v1.8.0'])}",
        }
        cluster_pods.append(pod)
    _pods[cid] = cluster_pods
    _clusters[cid]["pod_count"] = len(cluster_pods)
random.seed()

class CreateClusterRequest(BaseModel):
    name: str
    version: str = "1.30.1"
    region: str = "arv-us-east-1"
    node_count: int = 3
    node_size: str = "arv.large"

class ScaleRequest(BaseModel):
    node_count: int

@router.get("/clusters")
def list_clusters():
    return list(_clusters.values())

@router.get("/clusters/{cluster_id}")
def get_cluster(cluster_id: str):
    if cluster_id not in _clusters:
        raise HTTPException(404, "Cluster not found")
    return _clusters[cluster_id]

@router.post("/clusters", status_code=201)
def create_cluster(req: CreateClusterRequest):
    cid = _det_id("arv-k8s", req.name)
    cluster = {
        "id": cid,
        "name": req.name,
        "version": req.version,
        "region": req.region,
        "status": "PROVISIONING",
        "node_count": req.node_count,
        "node_size": req.node_size,
        "endpoint": f"https://{cid}.k8s.aravanta.cloud:6443",
        "cpu_cores_total": req.node_count * 4,
        "ram_gb_total": req.node_count * 16,
        "pod_count": 0,
        "created_at": datetime.utcnow().isoformat() + "Z",
    }
    _clusters[cid] = cluster
    _pods[cid] = []
    cluster["status"] = "ACTIVE"
    return cluster

@router.delete("/clusters/{cluster_id}")
def delete_cluster(cluster_id: str):
    if cluster_id not in _clusters:
        raise HTTPException(404, "Cluster not found")
    del _clusters[cluster_id]
    _pods.pop(cluster_id, None)
    return {"message": f"Cluster {cluster_id} deleted"}

@router.post("/clusters/{cluster_id}/scale")
def scale_cluster(cluster_id: str, req: ScaleRequest):
    if cluster_id not in _clusters:
        raise HTTPException(404, "Cluster not found")
    _clusters[cluster_id]["node_count"] = req.node_count
    _clusters[cluster_id]["cpu_cores_total"] = req.node_count * 4
    _clusters[cluster_id]["ram_gb_total"] = req.node_count * 16
    return _clusters[cluster_id]

@router.get("/clusters/{cluster_id}/pods")
def list_pods(cluster_id: str, namespace: Optional[str] = Query(None)):
    if cluster_id not in _clusters:
        raise HTTPException(404, "Cluster not found")
    pods = _pods.get(cluster_id, [])
    if namespace:
        pods = [p for p in pods if p["namespace"] == namespace]
    return pods

@router.get("/versions")
def list_versions():
    return [{"version": v} for v in K8S_VERSIONS]

@router.get("/summary")
def kube_summary():
    clusters = list(_clusters.values())
    total_pods = sum(c["pod_count"] for c in clusters)
    total_nodes = sum(c["node_count"] for c in clusters)
    return {
        "total_clusters": len(clusters),
        "active_clusters": len([c for c in clusters if c["status"] == "ACTIVE"]),
        "total_nodes": total_nodes,
        "total_pods": total_pods,
        "total_cpu_cores": sum(c["cpu_cores_total"] for c in clusters),
        "total_ram_gb": sum(c["ram_gb_total"] for c in clusters),
    }
