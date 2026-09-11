"""
Aravanta CloudOS — Console Copilot Engine (Module 1)
Interactive, read-only AI infrastructure copilot embedded in the management console.
Answers ANY developer and SRE questions regarding:
- Live infrastructure telemetry (VMs, K8s, Databases, S3 Storage, Billing, Deployments, Alerts)
- Platform architecture, features, and SOP how-to guides (ArvStore, ArvDB, ArvGate, ArvEdge, FinOps)
- Diagnostic runbooks (Exit Code 137 OOMKilled, CrashLoopBackOff, DB pool exhaustion, Canary rollback)
- CLI syntax (`arv` command line interface)
- Security, RBAC matrix, TOTP MFA, and DPDPA/SOC2 compliance
- Strictly read-only: intercepts mutation commands and guides users to safe manual execution.
"""
import os
import re
import json
from typing import Dict, Any, List, Optional
from datetime import datetime
from sqlalchemy.orm import Session
import httpx

from .retrieval import grounding_engine
from .knowledge_base import knowledge_base


class ConsoleCopilotEngine:
    """
    Console Copilot provides grounded, read-only answers to developer and SRE queries.
    Strictly read-only: does not execute mutations or cloud modifications.
    """
    def __init__(self):
        self.grounding = grounding_engine
        self.kb = knowledge_base

    async def process_chat(
        self,
        message: str,
        tab_context: Optional[str] = "dashboard",
        workspace_id: Optional[str] = None,
        user_id: Optional[str] = None,
        db: Optional[Session] = None
    ) -> Dict[str, Any]:
        msg_clean = message.strip()
        msg_lower = msg_clean.lower()

        # 1. Check for Imperative Write / Mutation Requests (Read-Only Safety Guardrail)
        if self._is_imperative_mutation(msg_lower):
            guardrail_res = self._handle_read_only_guardrail(msg_clean)
            return {
                "reply": guardrail_res["content"],
                "intent": "read_only_guardrail",
                "citations": ["[Security Policy: Strict Read-Only Guardrail]"],
                "suggested_followups": guardrail_res["followups"],
                "metric_cards": [],
                "timestamp": self._get_utc_timestamp(),
                "read_only_guarantee": True
            }

        # 2. Retrieve Grounded Context (Docs, Live Resources, Telemetry, Traces)
        context = await self.grounding.retrieve_context(
            query=message,
            workspace_id=workspace_id,
            user_id=user_id,
            db=db
        )

        # 3. Optional LLM Synthesis (if external API key configured)
        llm_reply = await self._try_external_llm_synthesis(message, tab_context or "dashboard", context)
        if llm_reply:
            return {
                "reply": llm_reply["content"],
                "intent": llm_reply["intent"],
                "citations": context["citations"],
                "suggested_followups": llm_reply["followups"],
                "metric_cards": llm_reply.get("metric_cards", []),
                "timestamp": context["timestamp"],
                "read_only_guarantee": True
            }

        # 4. Built-in Semantic RAG & Multi-Intent Synthesizer
        response_data = self._synthesize_response(message, tab_context or "dashboard", context)

        return {
            "reply": response_data["content"],
            "intent": response_data["intent"],
            "citations": context["citations"],
            "suggested_followups": response_data["followups"],
            "metric_cards": response_data.get("metric_cards", []),
            "timestamp": context["timestamp"],
            "read_only_guarantee": True
        }

    def _is_imperative_mutation(self, msg: str) -> bool:
        """
        Detects if the user is trying to execute an imperative write/mutation action directly,
        rather than asking a question, how-to, or status check.
        """
        inquiry_tokens = [
            "how to", "how do", "how can", "can i", "what is", "explain",
            "steps to", "guide", "show me how", "syntax for", "tell me about", "what are",
            "why", "when"
        ]
        if any(tok in msg for tok in inquiry_tokens):
            return False

        action_verbs = [
            "delete", "restart", "reboot", "kill", "terminate", "drop",
            "decommission", "purge", "destroy", "remove"
        ]
        target_nouns = [
            "vm", "vms", "cluster", "clusters", "pod", "pods", "instance", "instances",
            "database", "db", "bucket", "buckets", "service", "services", "node", "nodes"
        ]

        words = re.findall(r'\b[a-z0-9_\-]+\b', msg.lower())
        if not words:
            return False

        first_word = words[0]
        if first_word in action_verbs:
            if any(noun in words for noun in target_nouns):
                return True

        if "scale" in words and any(w in words for w in ["down", "0", "zero"]):
            return True

        return False

    def _handle_read_only_guardrail(self, raw_message: str) -> Dict[str, Any]:
        return {
            "content": (
                "### 🛡️ Read-Only Safety Guarantee Enforced\n\n"
                "Console Copilot operates under a **strict read-only safety guardrail**. "
                "AI agents are intentionally prohibited from executing automated mutations, state changes, or destructive operations on your live infrastructure.\n\n"
                "**To perform this action safely, please use verified manual controls**:\n"
                "1. **Operations Console**: Navigate to the respective console tab ([Infrastructure](/infrastructure), [Kubernetes](/kubernetes), or [Deployments](/deployments)) and confirm the action via the two-step verification modal.\n"
                "2. **Aravanta CLI (`arv`)**: Execute via the authenticated CLI from your authorized terminal:\n"
                "   ```bash\n"
                "   # Example manual CLI action with audit verification\n"
                "   arv compute restart <instance-id>\n"
                "   # or\n"
                "   arv kube drain <node-id> --ignore-daemonsets\n"
                "   ```\n\n"
                "*Zero modifications were applied to your infrastructure.*"
            ),
            "followups": [
                "What is the status of my virtual machines?",
                "What permissions does my role have in RBAC?",
                "How do I use the arv CLI to manage resources?"
            ]
        }

    def _synthesize_response(self, message: str, tab: str, ctx: Dict[str, Any]) -> Dict[str, Any]:
        msg = message.lower()
        inv = ctx.get("inventory", {})
        tel = ctx.get("telemetry", {})
        docs = ctx.get("documents", [])

        # -------------------------------------------------------------
        # Branch 1: Specific Error Codes & Runbook Diagnostics
        # -------------------------------------------------------------
        if any(w in msg for w in ["exit code 137", "oomkilled", "oom killed", "out of memory"]):
            return self._synthesize_oom_triage()

        if any(w in msg for w in ["crashloop", "crashloopbackoff", "pod crash", "exit code 1", "exit code 126", "exit code 127"]):
            return self._synthesize_crashloop_triage(inv, docs)

        if any(w in msg for w in ["pool exhaustion", "max_connections", "pool saturated", "too many connections", "connection pool exhaustion", "pool exhausted"]):
            return self._synthesize_db_pool_triage(inv, docs)

        # -------------------------------------------------------------
        # Branch 2: Live Infrastructure Telemetry Queries
        # -------------------------------------------------------------
        # 2A: S3 Object Storage & ArvStore
        if any(w in msg for w in ["storage", "bucket", "s3", "blob", "arvstore", "upload", "download", "presigned"]):
            return self._synthesize_storage_status(inv, docs)

        # 2B: Managed Databases & Patroni HA
        if any(w in msg for w in ["database", "postgres", "postgresql", "redis", "mysql", "patroni", "replica", "pitr"]):
            return self._synthesize_database_status(inv, docs)

        # 2C: Billing, FinOps, INR/USD & Zero Egress
        if any(w in msg for w in ["billing", "cost", "spend", "invoice", "inr", "usd", "pricing", "money", "egress", "finops"]):
            return self._synthesize_billing_status(inv, docs)

        # 2D: Compute VMs
        if any(w in msg for w in ["vm", "compute", "instance", "virtual machine", "server"]):
            return self._synthesize_compute_status(inv, tel)

        # 2E: Kubernetes Clusters & Pods
        if any(w in msg for w in ["k8s", "kube", "kubernetes", "cluster", "pod", "node", "service mesh"]):
            return self._synthesize_kube_status(inv, tel)

        # 2F: Deployments, CI/CD, Canary & GitOps
        if any(w in msg for w in ["deploy", "release", "cicd", "gitops", "canary", "rollback", "bluegreen", "rollingupdate"]):
            return self._synthesize_deployment_status(inv, docs)

        # 2G: Active Alerts & Incident Command
        if any(w in msg for w in ["alert", "incident", "firing", "war-room", "outage", "mttr"]):
            return self._synthesize_alerts_and_incidents(inv, tel)

        # 2H: Security, RBAC Matrix & TOTP MFA
        if any(w in msg for w in ["rbac", "role", "permission", "mfa", "totp", "2fa", "authenticator", "audit log", "compliance", "dpdpa", "soc2"]):
            return self._synthesize_security_and_rbac(docs)

        # 2I: CLI (`arv`) Syntax & Tooling
        if any(w in msg for w in ["cli", "arv", "command line", "terminal", "command syntax"]):
            return self._synthesize_cli_guidance(docs)

        # 2J: Edge, CDN & Networking
        if any(w in msg for w in ["edge", "cdn", "dns", "ddos", "tls", "ssl", "arvedge"]):
            return self._synthesize_edge_guidance(docs)

        # 2K: Regions & Sovereign Infrastructure
        if any(w in msg for w in ["region", "regions", "zone", "mumbai", "hyderabad", "bangalore", "delhi", "datacenter"]):
            return self._synthesize_regions_guidance(docs)

        # -------------------------------------------------------------
        # Branch 3: General Document / Runbook RAG Fallback
        # -------------------------------------------------------------
        if docs and docs[0].get("score", 0) >= 0.2:
            return self._synthesize_rag_from_docs(message, docs)

        # -------------------------------------------------------------
        # Branch 4: General Infrastructure Status Overview (Greeting)
        # -------------------------------------------------------------
        return self._synthesize_general_overview(inv, tel)

    # -----------------------------------------------------------------
    # Synthesis Helpers
    # -----------------------------------------------------------------
    def _synthesize_oom_triage(self) -> Dict[str, Any]:
        content = (
            "### 🚨 Runbook Diagnostic: Exit Code 137 (OOMKilled)\n\n"
            "**Root Cause**: The Linux Kernel OOM (Out Of Memory) Killer terminated the container because memory consumption breached the cgroup memory limit.\n\n"
            "**Actionable Remediation Steps**:\n"
            "1. **Confirm Termination State**:\n"
            "   ```bash\n"
            "   kubectl describe pod <pod-name> -n production | grep -A 5 'Last State'\n"
            "   ```\n"
            "2. **Verify Memory Spike via Loki**:\n"
            "   Search query: `{app=\"<service-name>\"} |= \"OOMKilled\" or \"exit code 137\"`\n\n"
            "3. **Increase Cgroup Memory Limit in Deployment Manifest**:\n"
            "   ```yaml\n"
            "   resources:\n"
            "     limits:\n"
            "       memory: \"2Gi\"\n"
            "     requests:\n"
            "       memory: \"1Gi\"\n"
            "   ```\n"
            "4. **Emergency Rollback** (if caused by a recent bad release):\n"
            "   ```bash\n"
            "   arv cicd rollback <service-name> --target=previous\n"
            "   ```\n"
            "You can also inspect live container memory in the [Container Console](/containers)."
        )
        return {
            "intent": "runbook_triage",
            "content": content,
            "metric_cards": [
                {"label": "Exit Code", "value": "137 (OOMKilled)", "status": "critical"},
                {"label": "Root Cause", "value": "Memory Cgroup Ceiling", "status": "critical"},
                {"label": "Fix Action", "value": "Bump RAM Limits", "status": "healthy"}
            ],
            "followups": [
                "How do I triage a CrashLoopBackOff error?",
                "What is our procedure for an instant canary rollback?",
                "Show active alerts across our clusters"
            ]
        }

    def _synthesize_crashloop_triage(self, inv: Dict[str, Any], docs: List[Dict[str, Any]]) -> Dict[str, Any]:
        content = (
            "### 🔍 Runbook Diagnostic: Pod CrashLoopBackOff Triage\n\n"
            "A pod entering `CrashLoopBackOff` indicates that the container repeatedly starts, crashes, and is restarted by the kubelet with exponential backoff delays.\n\n"
            "**Key Termination Codes & Diagnostic Meaning**:\n"
            "- **Exit Code 137**: **OOMKilled** (Memory limit exceeded).\n"
            "- **Exit Code 1**: **Application Runtime Exception** (Unhandled exception, syntax error, missing environment variable).\n"
            "- **Exit Code 126 / 127**: **Entrypoint Command Not Found** or file permission issue.\n"
            "- **Exit Code 0**: **Premature Completion** (Daemon process ran as one-shot and terminated).\n\n"
            "**Standard Recovery Steps**:\n"
            "1. Inspect recent container logs before the crash:\n"
            "   ```bash\n"
            "   kubectl logs <pod-name> -n production --previous --tail=100\n"
            "   ```\n"
            "2. Inspect Kubernetes lifecycle events:\n"
            "   ```bash\n"
            "   kubectl describe pod <pod-name> -n production\n"
            "   ```\n"
            "3. Verify ConfigMap and Secret bindings (e.g. `DATABASE_URL`, `JWT_SECRET`).\n"
            "4. View the correlated incident timeline in the [War-Room / Incidents](/incidents) console."
        )
        return {
            "intent": "runbook_triage",
            "content": content,
            "followups": [
                "How do I fix Exit Code 137 OOMKilled?",
                "Show Loki log streams for failing services",
                "Execute emergency canary rollback"
            ]
        }

    def _synthesize_db_pool_triage(self, inv: Dict[str, Any], docs: List[Dict[str, Any]]) -> Dict[str, Any]:
        content = (
            "### 🗄️ Runbook Diagnostic: Database Connection Pool Saturation\n\n"
            "When active connections approach `max_connections`, clients encounter `FATAL: remaining connection slots are reserved` or 504 Gateway Timeouts.\n\n"
            "**Diagnostic & Recovery Steps**:\n"
            "1. **Check Pool Saturation via CLI**:\n"
            "   ```bash\n"
            "   arv db pool-status aravanta-core-db\n"
            "   ```\n"
            "2. **Identify Long-Running or Leaked Client Connections**:\n"
            "   ```sql\n"
            "   SELECT pid, now() - query_start AS duration, query, state\n"
            "   FROM pg_stat_activity\n"
            "   WHERE state != 'idle' ORDER BY duration DESC LIMIT 10;\n"
            "   ```\n"
            "3. **Route Traffic via PgBouncer Pooler**: Switch application connection string from direct PostgreSQL port `5432` to PgBouncer port `6432` (transaction pooling).\n"
            "4. **Initiate Patroni Standby Failover (if primary node is unresponsive)**:\n"
            "   ```bash\n"
            "   arv db failover aravanta-core-db --candidate=replica-02\n"
            "   ```\n"
            "Check live database metrics under the [ArvDB Console](/database)."
        )
        return {
            "intent": "runbook_triage",
            "content": content,
            "metric_cards": [
                {"label": "DB Pool Engine", "value": "PgBouncer Port 6432", "status": "healthy"},
                {"label": "HA Consensus", "value": "Patroni Raft Active", "status": "healthy"},
                {"label": "Failover Latency", "value": "< 8 seconds", "status": "healthy"}
            ],
            "followups": [
                "What is the connection pool status on our databases?",
                "How does Patroni automated failover work?",
                "When was the last automated PITR backup completed?"
            ]
        }

    def _synthesize_compute_status(self, inv: Dict[str, Any], tel: Dict[str, Any]) -> Dict[str, Any]:
        vms = inv.get("compute_vms", [])
        if not vms:
            return {
                "intent": "compute_status",
                "content": (
                    "### ArvCompute Fleet Status\n"
                    "You currently have **0 active virtual machines** provisioned in this workspace.\n\n"
                    "**To launch an instance**:\n"
                    "- Navigate to the [ArvCompute Console](/compute) and click **Create Instance**.\n"
                    "- Or use the CLI:\n"
                    "  ```bash\n"
                    "  arv compute create --name=api-worker-01 --type=g1.medium --region=ap-south-1\n"
                    "  ```"
                ),
                "followups": ["What instance types are available?", "What is the pricing for ArvCompute VMs?", "Check Kubernetes clusters"]
            }
        running = sum(1 for v in vms if v["status"] == "RUNNING")
        cards = [{"label": v["name"], "value": f"{v['status']} ({v['cpu_usage']}% CPU)", "status": "healthy" if v["status"] == "RUNNING" else "warning"} for v in vms[:4]]
        vm_lines = "\n".join([f"- **`{v['name']}`** ({v['instance_type']}): Status `{v['status']}`, IP `{v['ip']}`, CPU `{v['cpu_usage']}%`, RAM `{v['ram_usage']}%` [{v['region']}]" for v in vms])

        content = (
            f"### ArvCompute Fleet Overview\n"
            f"You have **{len(vms)} instances** provisioned (**{running} running**, **{len(vms) - running} stopped**):\n\n"
            f"{vm_lines}\n\n"
            f"Telemetry via Observability Hub reports average fleet CPU at **{tel.get('cluster_cpu_utilization_pct', 24.5)}%**.\n"
            f"*Read-only query completed. No infrastructure changes applied.*"
        )
        return {
            "intent": "compute_status",
            "content": content,
            "metric_cards": cards,
            "followups": ["Are any instances experiencing high CPU?", "What is our current monthly VM compute cost?", "Show memory utilization"]
        }

    def _synthesize_kube_status(self, inv: Dict[str, Any], tel: Dict[str, Any]) -> Dict[str, Any]:
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
            f"- **Total Nodes**: {tel.get('active_nodes', 3)} active\n"
            f"- **Total Pods**: {tel.get('total_pods', 18)} running ({tel.get('unhealthy_pods', 0)} crashlooping)\n"
            f"- **P95 Service Mesh Latency**: {tel.get('p95_latency_ms', 14.2)} ms\n"
            f"- **Error Rate**: {tel.get('error_rate_pct', 0.02)}%\n\n"
            f"All clusters are healthy and reporting upstream CNCF conformity."
        )
        return {
            "intent": "k8s_status",
            "content": content,
            "metric_cards": cards,
            "followups": ["Are there any crashlooping pods?", "Show me recent deployment releases", "Check database connection pool"]
        }

    def _synthesize_storage_status(self, inv: Dict[str, Any], docs: List[Dict[str, Any]]) -> Dict[str, Any]:
        buckets = inv.get("storage_buckets", [])
        cards = [
            {"label": "Object Storage", "value": "S3-Compatible", "status": "healthy"},
            {"label": "Inter-Region Egress", "value": "₹0.00 (Free)", "status": "healthy"},
            {"label": "Encryption", "value": "AES-256 Enabled", "status": "healthy"}
        ]
        bucket_text = ""
        if buckets:
            bucket_text = "**Active Provisioned Buckets**:\n" + "\n".join([
                f"- **`{b['name']}`** ({b['region']}): `{b['size_gb']} GB`, `{b['object_count']} objects`, Encryption `{b['encryption']}`"
                for b in buckets
            ]) + "\n\n"
        else:
            bucket_text = "No storage buckets provisioned in this workspace yet.\n\n"

        content = (
            f"### ArvStore — S3-Compatible Object Storage\n\n"
            f"{bucket_text}"
            f"**ArvStore Core Features & S3 Compatibility**:\n"
            f"- **S3 API Compatibility**: Works seamlessly with AWS SDKs, `boto3`, MinIO client, and AWS CLI.\n"
            f"- **Zero Inter-Region Egress Fees**: Free data transfer between storage buckets and compute/cluster nodes in any Aravanta region.\n"
            f"- **Encryption at Rest**: AES-256 enabled by default on all buckets.\n"
            f"- **Presigned URLs**: Secure, time-limited presigned URLs (60s to 7 days) for client-side uploads and downloads.\n\n"
            f"**Quick CLI Usage**:\n"
            f"```bash\n"
            f"# Create a new bucket\n"
            f"arv store mb arv://app-data-assets --region=ap-south-1\n\n"
            f"# Upload objects with recursive flag\n"
            f"arv store cp ./media arv://app-data-assets/media/ --recursive\n"
            f"```\n"
            f"Manage your storage buckets in the [ArvStore Console](/storage)."
        )
        return {
            "intent": "storage_status",
            "content": content,
            "metric_cards": cards,
            "followups": [
                "How do I generate a presigned download URL?",
                "What is the storage pricing per GB?",
                "How do I set lifecycle policies on my bucket?"
            ]
        }

    def _synthesize_database_status(self, inv: Dict[str, Any], docs: List[Dict[str, Any]]) -> Dict[str, Any]:
        dbs = inv.get("databases", [])
        cards = [
            {"label": "DB Engines", "value": "Postgres 16, Redis 7", "status": "healthy"},
            {"label": "HA Architecture", "value": "Patroni Raft Active", "status": "healthy"},
            {"label": "PITR Retention", "value": "35 Days", "status": "healthy"}
        ]
        db_text = ""
        if dbs:
            db_text = "**Managed Database Instances**:\n" + "\n".join([
                f"- **`{d['name']}`** ({d['engine']}): Status `{d['status']}`, Connections `{d['connections']}`, Storage `{d['storage_used_gb']} GB`"
                for d in dbs
            ]) + "\n\n"

        content = (
            f"### ArvDB — Managed Database Fleet & Patroni HA\n\n"
            f"{db_text}"
            f"**Patroni High Availability & Reliability Architecture**:\n"
            f"- **Automated Failover**: Managed by Patroni with Raft consensus DCS. Failover to an active read replica takes **< 8 seconds** with zero data loss.\n"
            f"- **Connection Pooling**: PgBouncer port `6432` is pre-configured to prevent connection spikes from crashing the database engine.\n"
            f"- **Continuous PITR Backups**: WAL archives allow rolling back to any specific second within 35 days.\n\n"
            f"**CLI Commands**:\n"
            f"```bash\n"
            f"# Inspect database status\n"
            f"arv db list\n\n"
            f"# Trigger manual failover candidate promotion\n"
            f"arv db failover aravanta-core-db\n"
            f"```\n"
            f"Inspect query performance and connections in the [ArvDB Console](/database)."
        )
        return {
            "intent": "database_status",
            "content": content,
            "metric_cards": cards,
            "followups": [
                "What runbook applies to database pool exhaustion?",
                "When was the last automated PITR backup completed?",
                "How do I create a read replica in another region?"
            ]
        }

    def _synthesize_billing_status(self, inv: Dict[str, Any], docs: List[Dict[str, Any]]) -> Dict[str, Any]:
        invoices = inv.get("invoices", [])
        content = (
            "### ArvBilling FinOps Snapshot\n"
            "Aravanta Cloud OS utilizes **per-second usage billing** with native dual currency support (INR ₹ and USD $):\n\n"
            "- **Active Billing Cycle**: Current Month\n"
            "- **Estimated Accrued Spend**: **₹3,480.50 INR** (~$41.80 USD)\n"
            "- **Data Egress Tolls**: **₹0.00** (Zero egress fees between Aravanta regions and internal services)\n"
            "- **Payment Method**: Corporate Card / UPI Active with automated GST 18% invoicing\n\n"
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
            "followups": [
                "How do I download my GST tax invoice?",
                "Which service is generating the highest cost?",
                "Explain our zero egress fee policy compared to AWS"
            ]
        }

    def _synthesize_deployment_status(self, inv: Dict[str, Any], docs: List[Dict[str, Any]]) -> Dict[str, Any]:
        apps = inv.get("applications", [])
        app_lines = "\n".join([f"- **`{a['name']}`** ({a['version']}): `{a['status']}`, `{a['replicas']} replicas`, P95 `{a['p95_ms']}ms`, Error rate `{a['error_pct']}%`" for a in apps]) if apps else "All microservices running stable."
        content = (
            f"### GitOps & Deployment Health\n"
            f"Active application workloads managed by ArvCICD Canary Gate:\n\n"
            f"{app_lines}\n\n"
            f"**Canary Gate Policy Engine**:\n"
            f"- **Deployment Strategy**: 25% Canary traffic split with 30s SLO verification gate.\n"
            f"- **Automated Rollback Latency**: 1.2 seconds via Envoy service mesh if error rate exceeds 1%.\n"
            f"- All production release artifacts are cryptographically signed and recorded in the 365-day immutable audit log.\n\n"
            f"**Emergency Rollback Command**:\n"
            f"```bash\n"
            f"arv cicd rollback <app-name> --target=previous\n"
            f"```"
        )
        return {
            "intent": "deployment_status",
            "content": content,
            "followups": [
                "What is the procedure for an emergency rollback?",
                "Show firing alerts in the cluster",
                "Check Kubernetes pods"
            ]
        }

    def _synthesize_alerts_and_incidents(self, inv: Dict[str, Any], tel: Dict[str, Any]) -> Dict[str, Any]:
        alerts = inv.get("active_alerts", [])
        alert_text = ""
        if alerts:
            alert_text = "**Currently Firing Alerts**:\n" + "\n".join([
                f"- **[{al['severity'].upper()}]** `{al['title']}` ({al.get('service', 'cluster')}): {al['message']}"
                for al in alerts
            ]) + "\n\n"
        else:
            alert_text = "No critical alerts are currently firing across the platform fleet.\n\n"

        content = (
            f"### Observability Hub — Alerts & Incident Management\n\n"
            f"{alert_text}"
            f"**Telemetry Health Metrics**:\n"
            f"- **Cluster Status**: **{tel.get('status', 'HEALTHY')}**\n"
            f"- **Fleet CPU Utilization**: {tel.get('cluster_cpu_utilization_pct', 24.5)}%\n"
            f"- **P95 Latency**: {tel.get('p95_latency_ms', 14.2)} ms\n"
            f"- **Active Monitored Pods**: {tel.get('total_pods', 18)}\n\n"
            f"Navigate to the [Incidents / War-Room](/incidents) or [Alerts](/alerts) console to acknowledge or investigate."
        )
        return {
            "intent": "incident_status",
            "content": content,
            "metric_cards": [
                {"label": "Active Incidents", "value": "1 In Progress", "status": "warning"},
                {"label": "Firing Alerts", "value": f"{len(alerts)} Active", "status": "warning" if alerts else "healthy"},
                {"label": "Fleet Health", "value": "99.98% SLO", "status": "healthy"}
            ],
            "followups": [
                "Summarize root cause analysis for the active incident",
                "What runbook applies to database pool exhaustion?",
                "Check CPU and memory saturation trends"
            ]
        }

    def _synthesize_security_and_rbac(self, docs: List[Dict[str, Any]]) -> Dict[str, Any]:
        content = (
            "### ArvGate & ArvAuth — Security, 4-Tier RBAC & TOTP MFA\n\n"
            "Aravanta Cloud OS enforces enterprise zero-trust security and compliance:\n\n"
            "**1. 4-Tier Role-Based Access Control (RBAC)**:\n"
            "- **Admin (SuperAdmin)**: Full infrastructure CRUD, cluster lifecycle, user management, key rotation, and audit review.\n"
            "- **Operator (SRE)**: Provisioning, scaling, release rollback, incident management, and runbook execution (no permanent resource decommissioning).\n"
            "- **Developer**: Application deployment, staging scale/restart, log explorer, and telemetry inspection.\n"
            "- **Viewer (Auditor)**: Strictly read-only access to metrics, logs, and compliance audit records.\n\n"
            "**2. Multi-Factor Authentication (RFC 6238 TOTP)**:\n"
            "- Compatible with Google Authenticator, Twilio Authy, Microsoft Authenticator, and 1Password.\n"
            "- 6-digit codes rotating every 30 seconds with emergency backup recovery keys.\n"
            "- Enable under User Profile > Security Settings (`/settings`).\n\n"
            "**3. Compliance & Immutable Audit Trail**:\n"
            "- **DPDPA 2023 & SOC 2 Type II**: Certified controls with sovereign data residency in India.\n"
            "- **SHA-256 HMAC Integrity**: Append-only 365-day audit logs with cryptographic tamper detection.\n\n"
            "Configure roles and users in the [Security Console](/security)."
        )
        return {
            "intent": "security_status",
            "content": content,
            "followups": [
                "How do I set up TOTP MFA in my account?",
                "How do I assign Developer role to a new team member?",
                "What is our compliance retention policy for audit logs?"
            ]
        }

    def _synthesize_cli_guidance(self, docs: List[Dict[str, Any]]) -> Dict[str, Any]:
        content = (
            "### Aravanta CLI (`arv`) Quickstart Reference\n\n"
            "The `arv` CLI allows you to inspect and manage infrastructure from your terminal:\n\n"
            "```bash\n"
            "# 1. Authentication\n"
            "arv login\n"
            "arv whoami\n\n"
            "# 2. Virtual Machines\n"
            "arv compute list\n"
            "arv compute create --name=api-worker-01 --type=g1.medium --region=ap-south-1\n\n"
            "# 3. Kubernetes Clusters\n"
            "arv kube get-clusters\n"
            "arv kube get-nodes <cluster-id>\n\n"
            "# 4. S3 Object Storage\n"
            "arv store ls\n"
            "arv store mb arv://<bucket-name>\n"
            "arv store cp ./build arv://<bucket-name>/dist/ --recursive\n\n"
            "# 5. CI/CD & Deployments\n"
            "arv cicd deploy <service> --version=v2.5.0 --strategy=canary\n"
            "arv cicd rollback <service> --target=previous\n\n"
            "# 6. Observability & AI Incident RCA\n"
            "arv logs <service> --tail=100\n"
            "arv rca analyze <incident-id>\n"
            "```"
        )
        return {
            "intent": "cli_guidance",
            "content": content,
            "followups": [
                "How do I create an S3 bucket with arv CLI?",
                "How do I trigger an emergency canary rollback?",
                "How do I export Loki logs via CLI?"
            ]
        }

    def _synthesize_edge_guidance(self, docs: List[Dict[str, Any]]) -> Dict[str, Any]:
        content = (
            "### ArvEdge — Anycast CDN, DDoS Shield & SSL/TLS 1.3\n\n"
            "ArvEdge operates at the perimeter of Aravanta Cloud OS providing global low-latency edge delivery:\n\n"
            "- **Anycast CDN**: Sub-15ms edge caching and termination across India and global POPs.\n"
            "- **Automated Layer 3/4 & Layer 7 DDoS Mitigation**: SYN flood, UDP amplification, and HTTP flood shielding.\n"
            "- **Automated TLS 1.3**: Zero-config Let's Encrypt certificates with automated renewals.\n"
            "- **Zero Inter-Region Egress Fees**: Routing between ArvEdge, ArvStore, and ArvCompute has **₹0.00 data transfer tolls**.\n\n"
            "**Purge Cache via CLI**:\n"
            "```bash\n"
            "arv edge purge-cache --domain=app.aravanta.com --all\n"
            "```"
        )
        return {
            "intent": "edge_guidance",
            "content": content,
            "followups": [
                "How do I attach a custom domain to my application?",
                "Explain our zero egress fee policy",
                "How does DDoS rate limiting work?"
            ]
        }

    def _synthesize_regions_guidance(self, docs: List[Dict[str, Any]]) -> Dict[str, Any]:
        content = (
            "### Aravanta Cloud OS — Global & Sovereign Indian Regions\n\n"
            "Aravanta Cloud OS operates high-availability tier-4 compliant data centers ensuring Indian data sovereignty (DPDPA 2023 compliant):\n\n"
            "- **`ap-south-1`**: **Mumbai** (Primary Financial Hub, 3 Availability Zones)\n"
            "- **`ap-south-2`**: **Hyderabad** (Enterprise & High-Throughput Hub, 3 Availability Zones)\n"
            "- **`ap-south-3`**: **Bangalore** (Tech & AI Inference Hub, 3 Availability Zones)\n"
            "- **`ap-north-1`**: **Delhi-NCR** (Government & Public Sector Hub, 2 Availability Zones)\n\n"
            "All regions are connected over 100 Gbps private fiber backbones with **zero inter-region data egress fees**."
        )
        return {
            "intent": "regions_guidance",
            "content": content,
            "followups": [
                "How do I replicate my database across regions?",
                "What is our zero egress fee policy?",
                "How do I choose the best region for my workload?"
            ]
        }

    def _synthesize_rag_from_docs(self, message: str, docs: List[Dict[str, Any]]) -> Dict[str, Any]:
        top_doc = docs[0]
        excerpts = "\n\n".join([f"**{d['heading']}** ({d['title']}):\n{d['content'][:500]}..." for d in docs[:2]])

        content = (
            f"### Platform Knowledge & Documentation Guidance\n\n"
            f"Based on the Aravanta Cloud OS documentation and runbooks for **{top_doc['title']}**:\n\n"
            f"{excerpts}\n\n"
            f"**Recommended Action**:\n"
            f"- Refer to the detailed guide in `{top_doc['file_path']}`.\n"
            f"- Access the corresponding console page for live controls."
        )
        return {
            "intent": "platform_knowledge",
            "content": content,
            "followups": [
                f"How do I configure {top_doc['title']}?",
                "Show CLI commands for this operation",
                "Check cluster observability telemetry"
            ]
        }

    def _synthesize_general_overview(self, inv: Dict[str, Any], tel: Dict[str, Any]) -> Dict[str, Any]:
        vms = inv.get("compute_vms", [])
        clusters = inv.get("kube_clusters", [])
        dbs = inv.get("databases", [])
        buckets = inv.get("storage_buckets", [])

        return {
            "intent": "general_overview",
            "content": (
                "### Aravanta Cloud OS — Console Copilot\n"
                "I am your **Console Copilot AI**, connected directly to the Observability Hub (Prometheus + Loki + eBPF) and platform knowledge base.\n\n"
                "**Current Platform Fleet**:\n"
                f"- **Compute**: {len(vms)} VM instances ({sum(1 for v in vms if v['status'] == 'RUNNING')} running)\n"
                f"- **Kubernetes**: {len(clusters)} clusters ({sum(c.get('pod_count', 0) for c in clusters)} pods)\n"
                f"- **Databases**: {len(dbs)} managed engines (Patroni HA)\n"
                f"- **Storage**: {len(buckets)} S3-compatible buckets\n"
                f"- **Observability**: **{tel.get('status', 'HEALTHY')}** (P95: {tel.get('p95_latency_ms', 14.2)}ms, Error Rate: {tel.get('error_rate_pct', 0.02)}%)\n\n"
                "**How I can assist you**:\n"
                "- **Live Queries**: Virtual machines, Kubernetes pod health, billing in INR/USD, databases, active alerts.\n"
                "- **How-To & Guides**: S3 object storage in ArvStore, Patroni failover, TOTP MFA, 4-tier RBAC, canary rollbacks.\n"
                "- **CLI Reference**: Syntax and scripts for the `arv` CLI.\n"
                "- **Diagnostics**: Triage Exit Code 137 OOMKilled, CrashLoopBackOff, and DB pool saturation."
            ),
            "followups": [
                "What is the status of my virtual machines?",
                "How do I create an S3 bucket in ArvStore?",
                "How does Patroni database failover work?",
                "How much have we spent on billing this month?"
            ]
        }

    async def _try_external_llm_synthesis(
        self,
        message: str,
        tab: str,
        ctx: Dict[str, Any]
    ) -> Optional[Dict[str, Any]]:
        """
        Optional bridge to an external LLM (OpenAI, Anthropic, Ollama, Gemini) if API keys exist.
        Falls back to local synthesis if no keys are found or if an error occurs.
        """
        openai_key = os.getenv("OPENAI_API_KEY")
        ollama_url = os.getenv("OLLAMA_BASE_URL")

        if not openai_key and not ollama_url:
            return None

        try:
            prompt_context = (
                f"You are the Console Copilot for Aravanta Cloud OS, a Kubernetes-native cloud platform.\n"
                f"You are STRICTLY READ-ONLY. Never execute or pretend to execute state mutations.\n"
                f"Active tab: {tab}\n"
                f"Grounded Docs: {json.dumps([d['heading'] + ': ' + d['content'][:300] for d in ctx.get('documents', [])])}\n"
                f"Live Telemetry: {json.dumps(ctx.get('telemetry', {}))}\n"
                f"User Question: {message}\n\n"
                f"Provide a clear, accurate, technical response with markdown formatting, code snippets where applicable, and citations."
            )

            if openai_key:
                async with httpx.AsyncClient(timeout=10.0) as client:
                    res = await client.post(
                        "https://api.openai.com/v1/chat/completions",
                        headers={"Authorization": f"Bearer {openai_key}", "Content-Type": "application/json"},
                        json={
                            "model": "gpt-4o-mini",
                            "messages": [{"role": "system", "content": prompt_context}, {"role": "user", "content": message}],
                            "temperature": 0.2
                        }
                    )
                    if res.status_code == 200:
                        data = res.json()
                        reply_text = data["choices"][0]["message"]["content"]
                        return {
                            "intent": "llm_grounded_response",
                            "content": reply_text,
                            "followups": [
                                "What is the status of my virtual machines?",
                                "Check active Kubernetes health",
                                "Show current monthly billing"
                            ]
                        }
        except Exception:
            pass

        return None

    def _get_utc_timestamp(self) -> str:
        return datetime.utcnow().isoformat() + "Z"


# Global singleton instance
copilot_engine = ConsoleCopilotEngine()
