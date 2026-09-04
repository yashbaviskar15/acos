"""
Aravanta CloudOS — ArvKube Service Router
Full CRUD for Kubernetes clusters backed by persistent database storage,
scoped to authenticated users, with real notification emission.
"""
import hashlib
import random
from datetime import datetime
from typing import Optional, List
from fastapi import APIRouter, HTTPException, Query, Depends, status
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.services.arvgate.models import User, AuditLog
from app.services.arvgate.dependencies import get_current_user_flexible
from app.core.cloud_models import KubeCluster, emit_notification

router = APIRouter(prefix="/api/v1/kubernetes", tags=["ArvKube"])

K8S_VERSIONS = ["1.28.4", "1.29.2", "1.30.1"]
NODE_SIZES = ["arv.medium", "arv.large", "arv.xlarge", "arv.2xlarge"]
NAMESPACES = ["default", "kube-system", "aravanta-core", "monitoring", "ingress-nginx"]
POD_PREFIXES = ["api-server", "web-frontend", "worker", "scheduler", "redis", "postgres", "nginx-ingress", "prometheus", "grafana", "loki", "cert-manager"]

def _det_id(prefix: str, name: str) -> str:
    return f"{prefix}-{hashlib.md5(f'{name}-{datetime.utcnow().timestamp()}'.encode()).hexdigest()[:10]}"

class CreateClusterRequest(BaseModel):
    name: str
    version: str = "1.30.1"
    region: str = "arv-us-east-1"
    node_count: int = 3
    node_size: str = "arv.large"

class ScaleRequest(BaseModel):
    node_count: int

@router.get("/clusters")
def list_clusters(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user_flexible)
):
    query = db.query(KubeCluster)
    if current_user.role != "SuperAdmin":
        query = query.filter(
            (KubeCluster.user_id == current_user.id) |
            (KubeCluster.workspace_id == current_user.workspace_id)
        )
    clusters = query.order_by(KubeCluster.created_at.desc()).all()
    return [c.to_dict() for c in clusters]

@router.get("/clusters/{cluster_id}")
def get_cluster(
    cluster_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user_flexible)
):
    cluster = db.query(KubeCluster).filter(KubeCluster.id == cluster_id).first()
    if not cluster:
        raise HTTPException(404, "Cluster not found")
    if current_user.role != "SuperAdmin" and cluster.user_id != current_user.id and cluster.workspace_id != current_user.workspace_id:
        raise HTTPException(403, "Access denied to this cluster")
    return cluster.to_dict()

@router.post("/clusters", status_code=201)
def create_cluster(
    req: CreateClusterRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user_flexible)
):
    cid = _det_id("arv-k8s", req.name)
    now = datetime.utcnow()
    new_cluster = KubeCluster(
        id=cid,
        user_id=current_user.id,
        workspace_id=current_user.workspace_id or "default",
        name=req.name.strip(),
        version=req.version,
        region=req.region,
        status="ACTIVE",
        node_count=req.node_count,
        node_size=req.node_size,
        endpoint=f"https://{cid}.k8s.aravanta.cloud:6443",
        cpu_cores_total=req.node_count * 4,
        ram_gb_total=req.node_count * 16,
        pod_count=req.node_count * 3,
        created_at=now
    )
    db.add(new_cluster)

    # Log audit entry
    audit = AuditLog(
        id=f"audit-{hashlib.md5(f'{cid}-{now.isoformat()}'.encode()).hexdigest()[:12]}",
        workspace_id=current_user.workspace_id,
        user_email=current_user.email,
        action="CREATE_CLUSTER",
        resource=req.name.strip(),
        details=f"Created cluster {req.name} ({req.version}) with {req.node_count} nodes in {req.region}"
    )
    db.add(audit)

    # Emit persistent notification
    emit_notification(
        db=db,
        user_id=current_user.id,
        workspace_id=current_user.workspace_id,
        title="Kubernetes Cluster Provisioned",
        desc=f"Cluster {req.name} (v{req.version}) is now ACTIVE with {req.node_count} worker nodes.",
        type="success"
    )

    db.commit()
    db.refresh(new_cluster)
    return new_cluster.to_dict()

@router.delete("/clusters/{cluster_id}")
def delete_cluster(
    cluster_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user_flexible)
):
    cluster = db.query(KubeCluster).filter(KubeCluster.id == cluster_id).first()
    if not cluster:
        raise HTTPException(404, "Cluster not found")
    if current_user.role != "SuperAdmin" and cluster.user_id != current_user.id and cluster.workspace_id != current_user.workspace_id:
        raise HTTPException(403, "Access denied to this cluster")

    c_name = cluster.name
    db.delete(cluster)
    emit_notification(
        db=db,
        user_id=current_user.id,
        workspace_id=current_user.workspace_id,
        title="Cluster Terminated",
        desc=f"Kubernetes cluster {c_name} ({cluster_id}) was deleted.",
        type="error"
    )
    db.commit()
    return {"message": f"Cluster {cluster_id} deleted"}

@router.post("/clusters/{cluster_id}/scale")
def scale_cluster(
    cluster_id: str,
    req: ScaleRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user_flexible)
):
    cluster = db.query(KubeCluster).filter(KubeCluster.id == cluster_id).first()
    if not cluster:
        raise HTTPException(404, "Cluster not found")
    if current_user.role != "SuperAdmin" and cluster.user_id != current_user.id and cluster.workspace_id != current_user.workspace_id:
        raise HTTPException(403, "Access denied to this cluster")

    cluster.node_count = req.node_count
    cluster.cpu_cores_total = req.node_count * 4
    cluster.ram_gb_total = req.node_count * 16
    cluster.pod_count = req.node_count * 3

    emit_notification(
        db=db,
        user_id=current_user.id,
        workspace_id=current_user.workspace_id,
        title="Cluster Scaled",
        desc=f"Cluster {cluster.name} scaled to {req.node_count} worker nodes.",
        type="info"
    )

    db.commit()
    db.refresh(cluster)
    return cluster.to_dict()

@router.get("/clusters/{cluster_id}/pods")
def list_pods(
    cluster_id: str,
    namespace: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user_flexible)
):
    cluster = db.query(KubeCluster).filter(KubeCluster.id == cluster_id).first()
    if not cluster:
        raise HTTPException(404, "Cluster not found")
    
    # Generate deterministic pod list based on cluster node count
    pods = []
    count = max(cluster.pod_count, cluster.node_count * 2)
    for i in range(count):
        prefix = POD_PREFIXES[i % len(POD_PREFIXES)]
        ns = NAMESPACES[i % len(NAMESPACES)]
        suffix = hashlib.md5(f"{cluster.name}-{i}".encode()).hexdigest()[:6]
        pod = {
            "id": f"pod-{suffix}",
            "name": f"{prefix}-{suffix}",
            "namespace": ns,
            "status": "Running",
            "restarts": 0 if i % 4 != 0 else 1,
            "cpu_usage_m": 25 + (i * 15) % 300,
            "ram_usage_mb": 64 + (i * 32) % 512,
            "node": f"node-{(i % cluster.node_count) + 1}",
            "age_hours": 12 + i * 8,
            "image": f"aravanta/{prefix}:latest"
        }
        pods.append(pod)
    
    if namespace:
        pods = [p for p in pods if p["namespace"] == namespace]
    return pods

@router.get("/versions")
def list_versions():
    return [{"version": v} for v in K8S_VERSIONS]

@router.get("/summary")
def kube_summary(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user_flexible)
):
    query = db.query(KubeCluster)
    if current_user.role != "SuperAdmin":
        query = query.filter(
            (KubeCluster.user_id == current_user.id) |
            (KubeCluster.workspace_id == current_user.workspace_id)
        )
    clusters = query.all()

    total_pods = sum(c.pod_count for c in clusters)
    total_nodes = sum(c.node_count for c in clusters)
    return {
        "total_clusters": len(clusters),
        "active_clusters": len([c for c in clusters if c.status == "ACTIVE"]),
        "total_nodes": total_nodes,
        "total_pods": total_pods,
        "total_cpu_cores": sum(c.cpu_cores_total for c in clusters),
        "total_ram_gb": sum(c.ram_gb_total for c in clusters),
    }
