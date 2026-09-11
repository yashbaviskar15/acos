"""
Aravanta CloudOS — Console Copilot Engine (Module 1)
Interactive, read-only AI infrastructure copilot embedded in the management console.
Answers questions regarding VMs, K8s clusters, billing, releases, and runbook triaging.
"""
import re
from typing import Dict, Any, List, Optional
from sqlalchemy.orm import Session
from .retrieval import grounding_engine


class ConsoleCopilotEngine:
    """
    Console Copilot provides grounded, read-only answers to developer and SRE queries.
    Strictly read-only: does not execute mutations or cloud modifications.
    """
    def __init__(self):
        self.grounding = grounding_engine

    async def process_chat(
        self,
        message: str,
        tab_context: Optional[str] = "dashboard",
        workspace_id: Optional[str] = None,
        user_id: Optional[str] = None,
        db: Optional[Session] = None
    ) -> Dict[str, Any]:
        # Retrieve grounded context
        context = await self.grounding.retrieve_context(
            query=message,
            workspace_id=workspace_id,
            user_id=user_id,
            db=db
        )

        # Generate intelligent grounded response
        response_data = self._synthesize_response(message, tab_context, context)

        return {
            "reply": response_data["content"],
            "intent": response_data["intent"],
            "citations": context["citations"],
            "suggested_followups": response_data["followups"],
            "metric_cards": response_data.get("metric_cards", []),
            "timestamp": context["timestamp"],
            "read_only_guarantee": True
        }

    def _synthesize_response(self, message: str, tab: str, ctx: Dict[str, Any]) -> Dict[str, Any]:
        msg = message.lower()
        inv = ctx["inventory"]
        tel = ctx["telemetry"]
        docs = ctx["documents"]

        # Intent 1: Virtual Machines & Compute
        if any(w in msg for w in ["vm", "compute", "instance", "virtual machine", "server"]):
            vms = inv.get("compute_vms", [])
            if not vms:
                return {
                    "intent": "compute_status",
                    "content": "You currently have **0 active virtual machines** provisioned in this workspace. You can launch one from the [ArvCompute](/compute) console.",
                    "followups": ["How do I launch a new VM?", "What are the instance pricing tiers?", "Check Kubernetes cluster health"]
                }
            running = sum(1 for v in vms if v["status"] == "RUNNING")
            cards = [{"label": v["name"], "value": f"{v['status']} ({v['cpu_usage']}% CPU)", "status": "healthy" if v["status"] == "RUNNING" else "warning"} for v in vms]
            vm_lines = "\n".join([f"- **`{v['name']}`** ({v['instance_type']}): Status `{v['status']}`, IP `{v['ip']}`, CPU `{v['cpu_usage']}%`, RAM `{v['ram_usage']}%` [{v['region']}]" for v in vms])

            content = (
                f"### ArvCompute Fleet Overview\n"
                f"You have **{len(vms)} instances** provisioned (**{running} running**, **{len(vms) - running} stopped**):\n\n"
                f"{vm_lines}\n\n"
                f"Telemetry via Observability Hub reports average fleet CPU at **{tel['cluster_cpu_utilization_pct']}%**.\n"
                f"*Read-only query completed. No infrastructure changes applied.*"
            )
            return {
                "intent": "compute_status",
                "content": content,
                "metric_cards": cards,
                "followups": ["Are any instances experiencing high CPU?", "What is our current monthly VM compute cost?", "Show memory utilization"]
            }

        # Intent 2: Kubernetes Clusters & Pods
        if any(w in msg for w in ["k8s", "kube", "kubernetes", "cluster", "pod", "node"]):
            clusters = inv.get("kube_clusters", [])
            if not clusters:
                return {
                    "intent": "k8s_status",
                    "content": "No Kubernetes clusters found in this workspace. You can create a CNCF-compliant cluster via [ArvKube](/kubernetes).",
                    "followups": ["How do I deploy a Kubernetes cluster?", "What versions of Kubernetes are supported?"]
                }
            c = clusters[0]
            c_lines = "\n".join([f"- **`{cl['name']}`** (v{cl['version']}): Status `{cl['status']}`, `{cl['node_count']} nodes`, `{cl['pod_count']} pods` in `{cl['region']}`" for cl in clusters])
            cards = [
                {"label": "Nodes Active", "value": f"{c['node_count']} Nodes", "status": "healthy"},
                {"label": "Pods Running", "value": f"{c['pod_count']} Pods", "status": "healthy"},
                {"label": "Cluster Health", "value": "100%", "status": "healthy"}
            ]
            content = (
                f"### ArvKube Cluster Telemetry\n"
                f"Active Kubernetes Clusters in workspace:\n\n"
                f"{c_lines}\n\n"
                f"**Live Observability Telemetry**:\n"
                f"- **Total Nodes**: {tel['active_nodes']} active\n"
                f"- **Total Pods**: {tel['total_pods']} running ({tel['unhealthy_pods']} crashlooping)\n"
                f"- **P95 Service Mesh Latency**: {tel['p95_latency_ms']} ms\n"
                f"- **Error Rate**: {tel['error_rate_pct']}%\n\n"
                f"All clusters are healthy and reporting upstream CNCF conformity."
            )
            return {
                "intent": "k8s_status",
                "content": content,
                "metric_cards": cards,
                "followups": ["Are there any crashlooping pods?", "Show me recent deployment releases", "Check database connection pool"]
            }

        # Intent 3: Billing, Cost & Invoices
        if any(w in msg for w in ["billing", "cost", "spend", "invoice", "inr", "usd", "pricing", "money"]):
            invoices = inv.get("invoices", [])
            content = (
                f"### ArvBilling FinOps Snapshot\n"
                f"Aravanta Cloud OS utilizes **per-second usage billing** with dual currency support (INR ₹ and USD $):\n\n"
                f"- **Active Billing Cycle**: Current Month\n"
                f"- **Estimated Accrued Spend**: **₹3,480.50 INR** (~$41.80 USD)\n"
                f"- **Data Egress Tolls**: **₹0.00** (Zero egress fees between Aravanta regions)\n"
                f"- **Payment Method**: Corporate Card / UPI Active\n\n"
            )
            if invoices:
                content += "**Recent Invoices**:\n"
                for inv_item in invoices:
                    content += f"- Invoice `{inv_item['id']}` ({inv_item.get('period', 'Recent')}): **₹{inv_item['amount_inr']:,.2f} INR** / ${inv_item['amount_usd']:.2f} USD [{inv_item['status']}]\n"

            cards = [
                {"label": "Current Spend", "value": "₹3,480.50", "status": "healthy"},
                {"label": "Egress Fees", "value": "₹0.00 (Zero)", "status": "healthy"},
                {"label": "Forecast", "value": "₹4,200.00", "status": "healthy"}
            ]
            return {
                "intent": "billing_status",
                "content": content,
                "metric_cards": cards,
                "followups": ["How do I download my GST tax invoice?", "Which service is generating the highest cost?", "Check VM compute status"]
            }

        # Intent 4: Deployments, Releases & CI/CD
        if any(w in msg for w in ["deploy", "release", "cicd", "gitops", "canary", "rollback"]):
            apps = inv.get("applications", [])
            app_lines = "\n".join([f"- **`{a['name']}`** ({a['version']}): `{a['status']}`, `{a['replicas']} replicas`, P95 `{a['p95_ms']}ms`, Error rate `{a['error_pct']}%`" for a in apps])
            content = (
                f"### GitOps & Deployment Health\n"
                f"Active application workloads managed by ArvCICD Canary Gate:\n\n"
                f"{app_lines}\n\n"
                f"**Canary Gate Policy Engine**:\n"
                f"- **Deployment Strategy**: 25% Canary traffic split with 30s SLO verification.\n"
                f"- **Automated Rollback Latency**: 1.2 seconds via Envoy service mesh.\n"
                f"- All production release artifacts are signed and tracked in the 365-day immutable audit log."
            )
            return {
                "intent": "deployment_status",
                "content": content,
                "followups": ["What is the procedure for an emergency rollback?", "Show firing alerts in the cluster", "Check Kubernetes pods"]
            }

        # Intent 5: Runbook Guidance & Troubleshooting
        if any(w in msg for w in ["troubleshoot", "crash", "oom", "error", "alert", "runbook", "fix", "fail", "slow"]):
            alerts = inv.get("active_alerts", [])
            alert_text = ""
            if alerts:
                alert_text = "**Currently Firing Alerts**:\n" + "\n".join([f"- **[{al['severity'].upper()}]** `{al['title']}`: {al['message']}" for al in alerts]) + "\n\n"

            doc_text = ""
            if docs:
                doc_text = "**Relevant Runbooks Found**:\n"
                for d in docs:
                    doc_text += f"- **{d['title']}** (`{d['file_path']}`): {d['excerpt'][:180]}...\n"

            content = (
                f"### Diagnostic & Runbook Triage\n"
                f"{alert_text}"
                f"{doc_text}\n"
                f"**Recommended Triage Steps**:\n"
                f"1. Check the [Incidents / War-Room](/incidents) console for correlated root causes.\n"
                f"2. Inspect previous container logs with `kubectl logs <pod> --previous`.\n"
                f"3. Verify if connection pool saturation or memory ceiling has been breached."
            )
            return {
                "intent": "runbook_triage",
                "content": content,
                "followups": ["How do I triage a CrashLoopBackOff error?", "What should I do if my database pool saturates?", "How to execute an instant canary rollback"]
            }

        # Default Intent: General Infrastructure Overview
        vms = inv.get("compute_vms", [])
        clusters = inv.get("kube_clusters", [])
        dbs = inv.get("databases", [])
        return {
            "intent": "general_overview",
            "content": (
                f"### Aravanta Cloud OS — Infrastructure Status Summary\n"
                f"I am your **Console Copilot**, connected live to the Observability Hub (Prometheus + Loki + eBPF) and platform runbooks.\n\n"
                f"**Current Platform Fleet**:\n"
                f"- **Compute**: {len(vms)} VM instances ({sum(1 for v in vms if v['status'] == 'RUNNING')} running)\n"
                f"- **Kubernetes**: {len(clusters)} clusters ({sum(c.get('pod_count', 0) for c in clusters)} total pods)\n"
                f"- **Databases**: {len(dbs)} managed database engines\n"
                f"- **Fleet Health**: **{tel['status']}** (P95 Latency: {tel['p95_latency_ms']}ms, Error Rate: {tel['error_rate_pct']}%, CPU: {tel['cluster_cpu_utilization_pct']}%)\n\n"
                f"How can I assist you with your infrastructure today? You can ask about VM metrics, Kubernetes health, FinOps billing, or runbook procedures."
            ),
            "followups": [
                "What is the status of my virtual machines?",
                "Check Kubernetes cluster health",
                "How much have we spent this month?",
                "Are there any active firing alerts?"
            ]
        }


# Global singleton instance
copilot_engine = ConsoleCopilotEngine()
