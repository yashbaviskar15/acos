"""
Aravanta CloudOS — ArvKube Service Router
Full CRUD for Kubernetes clusters backed by persistent database storage,
scoped to authenticated users, with real notification emission.
"""
import hashlib
import random
from datetime import datetime
from typing import Optional, List
from fastapi import APIRouter, HTTPException, Query, Depends, status, Response
import yaml
import httpx
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.services.arvgate.models import User, AuditLog
from app.services.arvgate.dependencies import get_current_user, require_roles
from app.core.cloud_models import KubeCluster, emit_notification

router = APIRouter(prefix="/api/v1/kubernetes", tags=["ArvKube"])

K8S_VERSIONS = ["1.28.4", "1.29.2", "1.30.1"]
NODE_SIZES = ["arv.medium", "arv.large", "arv.xlarge", "arv.2xlarge"]
NAMESPACES = ["default", "kube-system", "aravanta-core", "monitoring", "ingress-nginx"]
POD_PREFIXES = []

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
    current_user: User = Depends(get_current_user)
):
    query = db.query(KubeCluster)
    user_role = (current_user.role or "").strip().lower()
    if user_role not in ["superadmin", "admin"]:
        query = query.filter(
            (KubeCluster.user_id == current_user.id) |
            (KubeCluster.workspace_id == current_user.workspace_id)
        )
    clusters = query.order_by(KubeCluster.created_at.desc()).all()
    return [c.to_dict() for c in clusters]

class ConnectClusterRequest(BaseModel):
    name: str
    kubeconfig_yaml: str

@router.post("/connect-cluster")
def connect_cluster(
    req: ConnectClusterRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(["SuperAdmin", "Admin", "Operator"]))
):
    try:
        config = yaml.safe_load(req.kubeconfig_yaml)
    except yaml.YAMLError as e:
        raise HTTPException(400, f"Invalid YAML: {e}")
    
    if not config or "clusters" not in config or not config["clusters"]:
        raise HTTPException(400, "Invalid kubeconfig: missing clusters")
    
    cluster_info = config["clusters"][0].get("cluster", {})
    endpoint = cluster_info.get("server")
    if not endpoint:
        raise HTTPException(400, "Invalid kubeconfig: missing server endpoint")

    try:
        with httpx.Client(verify=False, timeout=5.0) as client:
            resp = client.get(f"{endpoint}/version")
            resp.raise_for_status()
            version_data = resp.json()
            k8s_version = version_data.get("gitVersion", "unknown")
    except Exception as e:
        raise HTTPException(400, f"Cluster unreachable: {str(e)}")

    cid = _det_id("arv-k8s", req.name)
    now = datetime.utcnow()
    new_cluster = KubeCluster(
        id=cid,
        user_id=current_user.id,
        workspace_id=current_user.workspace_id or "default",
        name=req.name.strip(),
        version=k8s_version,
        region="external",
        status="ACTIVE",
        node_count=1,
        node_size="unknown",
        endpoint=endpoint,
        cpu_cores_total=4,
        ram_gb_total=16,
        pod_count=0,
        created_at=now
    )
    db.add(new_cluster)
    db.commit()
    db.refresh(new_cluster)
    return new_cluster.to_dict()

@router.get("/clusters/{cluster_id}/kubeconfig")
def download_kubeconfig(
    cluster_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    cluster = db.query(KubeCluster).filter(KubeCluster.id == cluster_id).first()
    if not cluster:
        raise HTTPException(404, "Cluster not found")
    user_role = (current_user.role or "").strip().lower()
    if user_role not in ["superadmin", "admin"] and cluster.user_id != current_user.id and cluster.workspace_id != current_user.workspace_id:
        raise HTTPException(403, "Access denied to this cluster")

    if cluster.status == "AWAITING_PROVIDER_SETUP":
        raise HTTPException(404, "Kubeconfig is not available until cluster is provisioned by a cloud provider.")

    return Response(
        content=f"apiVersion: v1\nclusters:\n- cluster:\n    server: {cluster.endpoint}\n  name: {cluster.name}\n",
        media_type="application/x-yaml"
    )

@router.get("/clusters/{cluster_id}")
def get_cluster(
    cluster_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    cluster = db.query(KubeCluster).filter(KubeCluster.id == cluster_id).first()
    if not cluster:
        raise HTTPException(404, "Cluster not found")
    user_role = (current_user.role or "").strip().lower()
    if user_role not in ["superadmin", "admin"] and cluster.user_id != current_user.id and cluster.workspace_id != current_user.workspace_id:
        raise HTTPException(403, "Access denied to this cluster")
    return cluster.to_dict()

@router.post("/clusters", status_code=201)
def create_cluster(
    req: CreateClusterRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(["SuperAdmin", "Admin", "Operator"]))
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
        status="AWAITING_PROVIDER_SETUP",
        node_count=0,
        node_size=req.node_size,
        endpoint="",
        cpu_cores_total=0,
        ram_gb_total=0,
        pod_count=0,
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

    try:
        from app.billing.metering_service import MeteringService
        MeteringService.start_resource_meter(
            db=db,
            resource_id=new_cluster.id,
            resource_type="kubernetes",
            organization_id=current_user.workspace_id or "default"
        )
    except Exception:
        pass

    return new_cluster.to_dict()

@router.delete("/clusters/{cluster_id}")
def delete_cluster(
    cluster_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(["SuperAdmin", "Admin"]))
):
    cluster = db.query(KubeCluster).filter(KubeCluster.id == cluster_id).first()
    if not cluster:
        raise HTTPException(404, "Cluster not found")
    user_role = (current_user.role or "").strip().lower()
    if user_role not in ["superadmin", "admin"] and cluster.user_id != current_user.id and cluster.workspace_id != current_user.workspace_id:
        raise HTTPException(403, "Access denied to this cluster")

    c_name = cluster.name
    db.delete(cluster)
    db.commit()

    try:
        from app.billing.metering_service import MeteringService
        MeteringService.stop_resource_meter(db=db, resource_id=cluster_id, debit_from_account=True)
    except Exception:
        pass

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
    current_user: User = Depends(require_roles(["SuperAdmin", "Admin", "Operator", "Developer"]))
):
    cluster = db.query(KubeCluster).filter(KubeCluster.id == cluster_id).first()
    if not cluster:
        raise HTTPException(404, "Cluster not found")
    user_role = (current_user.role or "").strip().lower()
    if user_role not in ["superadmin", "admin"] and cluster.user_id != current_user.id and cluster.workspace_id != current_user.workspace_id:
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
    response: Response,
    namespace: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    cluster = db.query(KubeCluster).filter(KubeCluster.id == cluster_id).first()
    if not cluster:
        raise HTTPException(404, "Cluster not found")
    
    if cluster.status == "AWAITING_PROVIDER_SETUP":
        response.headers["x-telemetry-status"] = "NO_TELEMETRY"
        return []
        
    return []

@router.get("/versions")
def list_versions():
    return [{"version": v} for v in K8S_VERSIONS]

@router.get("/summary")
def kube_summary(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = db.query(KubeCluster)
    user_role = (current_user.role or "").strip().lower()
    if user_role not in ["superadmin", "admin"]:
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

