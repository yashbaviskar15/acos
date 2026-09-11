"""
Aravanta CloudOS — Unified Grounding & Retrieval Service
Coordinates knowledge across documentation, live database resources, and Observability Hub telemetry.
Shared by Console Copilot, War-Room RCA Agent, and Infra Automation Agent.
"""
from typing import Dict, Any, List, Optional
from datetime import datetime
from sqlalchemy.orm import Session
from sqlalchemy import or_

from app.core.cloud_models import (
    ComputeInstance, KubeCluster, DatabaseInstance, StorageBucket,
    ApplicationRecord, DeploymentRecord, IncidentRecord, AlertRecord, InvoiceRecord
)
from app.services.arvgate.models import User, AuditLog
from .telemetry_connectors import PrometheusConnector, LokiConnector, EbpfTraceConnector
from .knowledge_base import knowledge_base


class GroundingEngine:
    """
    Central Grounding & RAG service for Aravanta Cloud OS AI agents.
    Retrieves live platform context, docs, and metrics without write side-effects.
    """
    def __init__(self):
        self.prom = PrometheusConnector()
        self.loki = LokiConnector()
        self.ebpf = EbpfTraceConnector()
        self.kb = knowledge_base

    async def retrieve_context(
        self,
        query: str,
        workspace_id: Optional[str] = None,
        user_id: Optional[str] = None,
        db: Optional[Session] = None
    ) -> Dict[str, Any]:
        """
        Gathers live infrastructure state, metrics, logs, and runbook docs matching the query.
        """
        # 1. Document & Runbook RAG
        doc_matches = self.kb.search(query, top_k=3)

        # 2. Live Telemetry
        prom_snapshot = await self.prom.get_cluster_snapshot()
        ebpf_snapshot = await self.ebpf.get_active_traces()
        recent_logs = await self.loki.query_logs('{app=~".+"}', limit=5)

        # 3. Database Resource State
        infra_state = self._get_db_inventory(workspace_id, user_id, db)

        # 4. Formulate citations
        citations = []
        for d in doc_matches:
            citations.append(d["citation"])
        citations.append(f"[Telemetry: {prom_snapshot['source']}]")
        citations.append(f"[Kernel: {ebpf_snapshot['source']}]")

        return {
            "query": query,
            "timestamp": datetime.utcnow().isoformat() + "Z",
            "workspace_id": workspace_id,
            "documents": doc_matches,
            "telemetry": prom_snapshot,
            "ebpf": ebpf_snapshot,
            "logs": recent_logs,
            "inventory": infra_state,
            "citations": citations
        }

    def _get_db_inventory(
        self,
        workspace_id: Optional[str],
        user_id: Optional[str],
        db: Optional[Session]
    ) -> Dict[str, Any]:
        if not db:
            return {"compute_vms": [], "kube_clusters": [], "databases": [], "storage_buckets": [], "applications": [], "alerts": []}

        # Filter by workspace / user if provided
        vm_query = db.query(ComputeInstance)
        kube_query = db.query(KubeCluster)
        db_query = db.query(DatabaseInstance)
        store_query = db.query(StorageBucket)
        app_query = db.query(ApplicationRecord)
        alert_query = db.query(AlertRecord)
        inv_query = db.query(InvoiceRecord)

        if workspace_id:
            vm_query = vm_query.filter(or_(ComputeInstance.workspace_id == workspace_id, ComputeInstance.user_id == user_id))
            kube_query = kube_query.filter(or_(KubeCluster.workspace_id == workspace_id, KubeCluster.user_id == user_id))
            db_query = db_query.filter(or_(DatabaseInstance.workspace_id == workspace_id, DatabaseInstance.user_id == user_id))
            store_query = store_query.filter(or_(StorageBucket.workspace_id == workspace_id, StorageBucket.user_id == user_id))
            app_query = app_query.filter(or_(ApplicationRecord.workspace_id == workspace_id, ApplicationRecord.user_id == user_id))
            alert_query = alert_query.filter(or_(AlertRecord.workspace_id == workspace_id, AlertRecord.user_id == user_id))
            inv_query = inv_query.filter(or_(InvoiceRecord.workspace_id == workspace_id, InvoiceRecord.user_id == user_id))

        vms = vm_query.limit(10).all()
        clusters = kube_query.limit(5).all()
        dbs = db_query.limit(5).all()
        buckets = store_query.limit(10).all()
        apps = app_query.limit(5).all()
        alerts = alert_query.filter(AlertRecord.status == "firing").limit(5).all()
        invoices = inv_query.order_by(InvoiceRecord.created_at.desc()).limit(3).all()

        return {
            "compute_vms": [
                {
                    "id": v.id, "name": v.name, "instance_type": v.instance_type,
                    "status": v.status, "cpu_usage": v.cpu_usage, "ram_usage": v.ram_usage,
                    "region": v.region, "ip": getattr(v, "public_ip", None) or getattr(v, "private_ip", "10.0.0.1")
                } for v in vms
            ],
            "kube_clusters": [
                {
                    "id": c.id, "name": c.name, "version": c.version,
                    "status": c.status, "node_count": c.node_count, "pod_count": c.pod_count,
                    "region": c.region
                } for c in clusters
            ],
            "databases": [
                {
                    "id": d.id, "name": d.name, "engine": d.engine,
                    "status": d.status, "storage_used_gb": d.storage_used_gb,
                    "connections": f"{d.connection_count}/{d.max_connections}"
                } for d in dbs
            ],
            "storage_buckets": [
                {
                    "id": b.id, "name": b.name, "region": b.region,
                    "storage_class": b.storage_class, "size_gb": b.size_gb,
                    "object_count": b.object_count, "encryption": b.encryption
                } for b in buckets
            ],
            "applications": [
                {
                    "id": a.id, "name": a.name, "version": a.version,
                    "status": a.status, "replicas": f"{a.replicas}/{a.target_replicas}",
                    "p95_ms": a.p95_latency_ms, "error_pct": a.error_rate_percent
                } for a in apps
            ],
            "active_alerts": [
                {"id": al.id, "title": al.title, "severity": al.severity, "service": al.service, "message": al.message}
                for al in alerts
            ],
            "invoices": [
                {"id": i.id, "period": getattr(i, "period", "Current Month"), "amount_inr": i.amount_inr, "amount_usd": i.amount_usd, "status": i.status}
                for i in invoices
            ]
        }


# Global singleton instance
grounding_engine = GroundingEngine()
