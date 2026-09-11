"""
Aravanta CloudOS — Knowledge Base Indexer & Domain Corpus Engine
Indexes documentation, SOPs, and incident runbooks from `docs/` and `docs/runbooks/`.
Maintains an authoritative in-memory curated knowledge base of platform capabilities:
ArvStore, ArvDB, ArvGate & RBAC, ArvEdge, ArvCompute, ArvKube, ArvCICD, FinOps, CLI (`arv`),
compliance (DPDPA/SOC2), regions, and runbook diagnostics.
"""
import os
import re
import math
from typing import List, Dict, Any, Tuple, Optional, Set


class DocumentChunk:
    def __init__(
        self,
        doc_id: str,
        title: str,
        file_path: str,
        heading: str,
        content: str,
        category: str = "doc",
        keywords: Optional[List[str]] = None
    ):
        self.doc_id = doc_id
        self.title = title
        self.file_path = file_path
        self.heading = heading
        self.content = content.strip()
        self.category = category
        self.keywords = keywords or []
        
        all_text = f"{title} {heading} {category} {' '.join(self.keywords)} {content}".lower()
        self.word_set = set(re.findall(r'\b[a-z0-9_\-]+\b', all_text))


# Curated Authoritative Knowledge Vectors for Aravanta Cloud OS
CURATED_KNOWLEDGE_VECTORS = [
    {
        "id": "kb-store-s3-overview",
        "title": "ArvStore — S3-Compatible Object Storage",
        "category": "storage",
        "heading": "Object Storage Architecture & S3 Compatibility",
        "keywords": ["s3", "storage", "bucket", "object", "blob", "arvstore", "upload", "download", "presigned", "aes-256", "supabase"],
        "content": (
            "ArvStore is Aravanta Cloud OS's S3-compatible, distributed object storage service. "
            "Key capabilities include:\n"
            "- **S3 API Compatibility**: Full compatibility with AWS S3 SDKs, boto3, AWS CLI, and MinIO clients.\n"
            "- **Encryption**: Server-side encryption at rest using AES-256 enabled by default on all buckets.\n"
            "- **Zero Inter-Region Egress**: Data transfer between ArvStore buckets and ArvCompute / ArvKube workloads in any Aravanta region is 100% free with zero egress tolls.\n"
            "- **Presigned URLs**: Secure, time-limited presigned URLs (configurable expiry from 60s to 7 days) for client-side uploads and downloads.\n"
            "- **Bucket Operations**: Create buckets, set lifecycle rules, configure CORS policies, and toggle public/private access controls from the console at `/storage` or via CLI."
        )
    },
    {
        "id": "kb-store-cli-commands",
        "title": "ArvStore — CLI Commands & Usage",
        "category": "cli",
        "heading": "CLI Syntax for ArvStore",
        "keywords": ["arv store", "cli", "bucket", "create bucket", "upload", "download", "mb", "cp", "ls", "rm"],
        "content": (
            "Manage ArvStore buckets and files using the `arv` CLI:\n\n"
            "```bash\n"
            "# Create a new storage bucket\n"
            "arv store mb arv://my-app-assets --region=ap-south-1\n\n"
            "# List all buckets\n"
            "arv store ls\n\n"
            "# Upload a file or folder\n"
            "arv store cp ./build/assets arv://my-app-assets/assets/ --recursive\n\n"
            "# Download an object\n"
            "arv store cp arv://my-app-assets/report.pdf ./local-report.pdf\n\n"
            "# Generate a presigned download URL (valid 1 hour)\n"
            "arv store presign arv://my-app-assets/report.pdf --expires-in=3600\n"
            "```"
        )
    },
    {
        "id": "kb-db-patroni-overview",
        "title": "ArvDB — Managed Database Engines & High Availability",
        "category": "database",
        "heading": "Patroni HA, PostgreSQL 16, Redis 7 & MySQL 8",
        "keywords": ["database", "postgres", "postgresql", "redis", "mysql", "patroni", "ha", "failover", "replica", "pgbouncer", "pitr", "backup"],
        "content": (
            "ArvDB provides production-ready, fully managed database clusters:\n"
            "- **Supported Engines**: PostgreSQL 16 (Patroni HA), Redis 7 (In-Memory / Cluster), MySQL 8.0.\n"
            "- **Patroni High Availability**: Automated zero-data-loss failover using Raft consensus (DCS). If the primary node fails, a standby replica is promoted in under 8 seconds.\n"
            "- **Connection Pooling**: Integrated PgBouncer connection pooling enabled out-of-the-box with transaction and session pooling modes.\n"
            "- **Point-In-Time Recovery (PITR)**: Continuous WAL archiving allows point-in-time recovery to any second within the retention window (up to 35 days).\n"
            "- **Automated Backups**: Daily encrypted snapshots replicated across disaster recovery zones automatically."
        )
    },
    {
        "id": "kb-db-connection-triage",
        "title": "ArvDB — Connection Pool Saturation Triage",
        "category": "database",
        "heading": "Resolving Database Connection Pool Saturation",
        "keywords": ["database connection", "pool saturation", "max_connections", "pgbouncer", "triage", "troubleshoot", "db slow", "patroni failover"],
        "content": (
            "When database connection pools saturate or clients encounter 'FATAL: remaining connection slots are reserved':\n"
            "1. **Check Active Connections** via CLI or Console `/database`:\n"
            "   ```bash\n"
            "   arv db pool-status aravanta-core-db\n"
            "   ```\n"
            "2. **Identify Long-Running or Leaked Queries**:\n"
            "   ```sql\n"
            "   SELECT pid, now() - query_start AS duration, query, state\n"
            "   FROM pg_stat_activity\n"
            "   WHERE state != 'idle' ORDER BY duration DESC LIMIT 10;\n"
            "   ```\n"
            "3. **Enable / Scale PgBouncer Pool**: Switch connection string from direct port 5432 to PgBouncer port 6432.\n"
            "4. **Manual Failover (if primary is unresponsive)**:\n"
            "   ```bash\n"
            "   arv db failover aravanta-core-db --candidate=replica-02\n"
            "   ```"
        )
    },
    {
        "id": "kb-gate-rbac-matrix",
        "title": "ArvGate — 4-Tier RBAC & Access Control",
        "category": "security",
        "heading": "Role-Based Access Control (RBAC) Matrix",
        "keywords": ["rbac", "roles", "permissions", "admin", "operator", "developer", "viewer", "superadmin", "access control", "security"],
        "content": (
            "ArvGate enforces a strict 4-tier Role-Based Access Control matrix across all operational domains:\n\n"
            "| Role | Infrastructure | Deployments | Observability | Logs | Automation | Security/IAM |\n"
            "|------|----------------|-------------|---------------|------|------------|--------------|\n"
            "| **Admin (SuperAdmin)** | Full CRUD & Decommission | Full Deploy & Rollback | Full View & Manage | Full View & Export | Full Create & Exec | Full IAM & Key Rotation |\n"
            "| **Operator (SRE)** | Provision & Scale (No Decommission) | Trigger & Rollback | Acknowledge & Incidents | View & Export | Execute Runbooks | View Audit Logs |\n"
            "| **Developer** | Restart & Scale Dev/Staging | Trigger & Rollback | View Telemetry & Ack | View & Export Logs | Execute Dev Runbooks | Read-Only Profile |\n"
            "| **Viewer (Auditor)** | Read-Only | Read-Only | Read-Only Telemetry | Read-Only Logs | No Execution | Read-Only Audit Logs |\n\n"
            "Roles are assigned in Console at `/security` or via `arv iam role-assign`."
        )
    },
    {
        "id": "kb-auth-mfa-totp",
        "title": "ArvAuth — Multi-Factor Authentication (MFA) with RFC 6238 TOTP",
        "category": "security",
        "heading": "Configuring Two-Factor Authentication (TOTP MFA)",
        "keywords": ["mfa", "totp", "2fa", "google authenticator", "authy", "authenticator", "qr code", "security", "two-factor", "login"],
        "content": (
            "ArvAuth implements RFC 6238 Time-Based One-Time Password (TOTP) MFA:\n"
            "- **Compatible Apps**: Google Authenticator, Twilio Authy, Microsoft Authenticator, 1Password.\n"
            "- **Code Specifications**: 6-digit verification code with a 30-second rotation cycle.\n"
            "- **How to Enable**:\n"
            "  1. Go to Console > User Profile > Security Settings (`/settings`).\n"
            "  2. Click **Enable Multi-Factor Authentication (MFA)**.\n"
            "  3. Scan the generated QR code using your authenticator app.\n"
            "  4. Enter the 6-digit confirmation code and save the emergency recovery backup codes.\n"
            "- **Enforcement Policy**: Workspace administrators can require mandatory MFA for all team members under `/security`."
        )
    },
    {
        "id": "kb-audit-compliance",
        "title": "Compliance & Immutable Audit Logging",
        "category": "security",
        "heading": "DPDPA 2023, SOC 2 Type II & SHA-256 HMAC Audit Logs",
        "keywords": ["compliance", "dpdpa", "soc 2", "iso 27001", "audit log", "security", "encryption", "tamper-evident", "hmac", "retention"],
        "content": (
            "Aravanta Cloud OS conforms to enterprise regulatory compliance standards:\n"
            "- **DPDPA 2023**: Fully compliant with the India Digital Personal Data Protection Act 2023, ensuring data residency in Indian sovereign regions (Mumbai, Hyderabad, Bangalore, Delhi-NCR).\n"
            "- **SOC 2 Type II & ISO 27001**: Certified controls for security, availability, and confidentiality.\n"
            "- **Append-Only Audit Logs**: Every API request and platform action records actor, timestamp, target resource, IP address, and payload.\n"
            "- **Integrity Verification**: Audit logs are cryptographically sealed with SHA-256 HMAC chains preventing retroactive tampering.\n"
            "- **Retention**: Standard 365-day retention with automated SIEM JSON export to Datadog, Splunk, or S3."
        )
    },
    {
        "id": "kb-billing-finops",
        "title": "ArvBilling — FinOps, Per-Second Billing & Zero Egress",
        "category": "billing",
        "heading": "Pricing Model, Dual Currency (INR/USD) & Zero Egress Fees",
        "keywords": ["billing", "finops", "cost", "inr", "usd", "egress", "zero egress", "per-second", "pricing", "invoice", "gst"],
        "content": (
            "ArvBilling provides transparent, predictable infrastructure pricing:\n"
            "- **Per-Second Granular Billing**: You only pay for active execution time with zero minimum rounding penalties.\n"
            "- **Dual Currency Support**: Native support for Indian Rupees (INR ₹) with GST 18% compliance invoicing, and US Dollars (USD $).\n"
            "- **Zero Inter-Region Egress Fees**: Unlike hyperscalers that charge $0.09/GB for data egress, Aravanta Cloud OS provides **₹0.00 zero-cost data transfer** between Aravanta regions and internal services.\n"
            "- **FinOps Dashboard**: View real-time cost breakdowns by service (Compute, Kubernetes, Databases, Storage), environment, and team under `/billing`.\n"
            "- **Budget Alerting**: Set proactive spend thresholds (e.g. alert at 80% and 100% of monthly quota) with automatic Slack and email notifications."
        )
    },
    {
        "id": "kb-compute-vms",
        "title": "ArvCompute — Virtual Machines & Compute Fleet",
        "category": "compute",
        "heading": "Compute VM Lifecycle, Flavors & Live Resizing",
        "keywords": ["vm", "compute", "instance", "virtual machine", "server", "cpu", "ram", "arvcompute", "resize", "snapshot"],
        "content": (
            "ArvCompute offers hypervisor-level virtual machines:\n"
            "- **Instance Types**:\n"
            "  - `g1.small` (1 vCPU, 2GB RAM) — dev / microservices\n"
            "  - `g1.medium` (2 vCPU, 4GB RAM) — standard workloads\n"
            "  - `c1.large` (4 vCPU, 8GB RAM) — compute-intensive APIs\n"
            "  - `m1.xlarge` (8 vCPU, 32GB RAM) — memory-optimized caches and databases\n"
            "- **Lifecycle Management**: Instant Start, Graceful Stop, Rolling Reboot, and Decommission.\n"
            "- **Live Resizing**: Upgrade CPU and RAM allocations without terminating the VM or changing IP addresses.\n"
            "- **Storage**: High-throughput NVMe persistent block storage with automated snapshots."
        )
    },
    {
        "id": "kb-kube-clusters",
        "title": "ArvKube — Managed Kubernetes Service",
        "category": "kubernetes",
        "heading": "CNCF Kubernetes, Node Pools & Auto-Draining",
        "keywords": ["k8s", "kube", "kubernetes", "cluster", "pod", "node", "arvkube", "hpa", "autoscaling", "cncf", "calico"],
        "content": (
            "ArvKube provides certified CNCF-compliant Kubernetes clusters:\n"
            "- **Control Plane**: Fully managed, multi-master high availability with automated etcd backups.\n"
            "- **Node Pools**: Auto-scaling node pools with live health checking, automatic node replacement, and graceful node draining (`kubectl drain`).\n"
            "- **Networking**: Calico CNI with eBPF data plane acceleration and native NetworkPolicy security.\n"
            "- **Storage**: CSI driver integrated with ArvStore and persistent block storage.\n"
            "- **Cluster Upgrades**: Zero-downtime rolling node upgrades with automated pre-flight conformance validation."
        )
    },
    {
        "id": "kb-cicd-canary",
        "title": "ArvCICD — Canary Deployments & 1.2s Instant Rollback",
        "category": "deployment",
        "heading": "Canary 25% Traffic Gate & Instant Envoy Rollback",
        "keywords": ["deploy", "release", "cicd", "canary", "rollback", "envoy", "traffic split", "gitops", "bluegreen", "rollingupdate"],
        "content": (
            "ArvCICD guarantees zero-downtime, safe application releases:\n"
            "- **Deployment Strategies**: RollingUpdate (sequential replacement), Canary (gradual traffic split), and BlueGreen (instant cutover).\n"
            "- **Canary 25% Traffic Gate**: New versions initially receive 25% of live traffic. The automated health gate verifies P95 latency and error rates for 30 seconds before proceeding to 100% rollout.\n"
            "- **1.2-Second Automated Rollback**: If HTTP 5xx error rate exceeds 1% or P95 latency spikes > 500ms, the Envoy service mesh shifts 100% of traffic back to the stable release in just 1.2 seconds.\n"
            "- **CLI Rollback Command**:\n"
            "  ```bash\n"
            "  arv cicd rollback <app-name> --target=previous\n"
            "  ```"
        )
    },
    {
        "id": "kb-edge-cdn",
        "title": "ArvEdge — Anycast CDN, TLS 1.3 & DDoS Protection",
        "category": "networking",
        "heading": "Edge Network, DDoS Shield & SSL Management",
        "keywords": ["edge", "cdn", "dns", "tls 1.3", "ddos", "arvedge", "cache", "ssl", "custom domain"],
        "content": (
            "ArvEdge sits at the platform boundary providing edge routing and security:\n"
            "- **Anycast Global CDN**: Edge nodes terminate user connections within 15ms in India and worldwide.\n"
            "- **DDoS Shield**: Automated Layer 3/4 and Layer 7 volumetric DDoS mitigation with SYN flood and rate limiting protection.\n"
            "- **Automated TLS 1.3**: Automatic Let's Encrypt SSL/TLS certificates with zero-configuration renewals.\n"
            "- **Edge Caching**: Configurable cache-control headers, stale-while-revalidate, and instant cache purge via Console or CLI (`arv edge purge-cache`)."
        )
    },
    {
        "id": "kb-cli-full-reference",
        "title": "Aravanta CLI (`arv`) — Complete Command Reference",
        "category": "cli",
        "heading": "Unified Command Line Interface (`arv`)",
        "keywords": ["cli", "arv", "command line", "terminal", "sdk", "syntax", "commands", "scripting"],
        "content": (
            "The `arv` CLI allows developers and SREs to automate every facet of Aravanta Cloud OS:\n\n"
            "```bash\n"
            "# Authentication & Session\n"
            "arv login\n"
            "arv whoami\n\n"
            "# Compute VM Management\n"
            "arv compute list\n"
            "arv compute create --name=api-worker-01 --type=g1.medium --region=ap-south-1\n"
            "arv compute restart <vm-id>\n"
            "arv compute stop <vm-id>\n\n"
            "# Kubernetes Clusters\n"
            "arv kube get-clusters\n"
            "arv kube get-nodes <cluster-id>\n"
            "arv kube get-kubeconfig <cluster-id> > ~/.kube/config\n\n"
            "# Database Operations\n"
            "arv db list\n"
            "arv db snapshot-create <db-id> --label=pre-migration\n"
            "arv db failover <db-id>\n\n"
            "# Object Storage\n"
            "arv store ls\n"
            "arv store mb arv://<bucket-name>\n"
            "arv store cp <local-path> arv://<bucket-name>/<key>\n\n"
            "# CI/CD & Deployments\n"
            "arv cicd deploy <service> --version=v2.5.0 --strategy=canary\n"
            "arv cicd rollback <service> --target=previous\n\n"
            "# Observability & Incident Response\n"
            "arv logs <service> --tail=100 --follow\n"
            "arv alerts list --firing\n"
            "arv rca analyze <incident-id>\n"
            "```"
        )
    },
    {
        "id": "kb-regions-infrastructure",
        "title": "Regions & Sovereign Data Residency",
        "category": "architecture",
        "heading": "Supported Regions & Sovereign Indian Infrastructure",
        "keywords": ["regions", "zones", "mumbai", "hyderabad", "bangalore", "delhi", "data residency", "sovereignty", "datacenter"],
        "content": (
            "Aravanta Cloud OS operates tier-4 compliant data centers across Indian regions:\n"
            "- **`ap-south-1`**: Mumbai (Primary Financial & Low-Latency Hub, 3 Availability Zones)\n"
            "- **`ap-south-2`**: Hyderabad (Enterprise & High-Throughput Hub, 3 Availability Zones)\n"
            "- **`ap-south-3`**: Bangalore (Tech & AI Inference Hub, 3 Availability Zones)\n"
            "- **`ap-north-1`**: Delhi-NCR (Government & Public Sector Hub, 2 Availability Zones)\n\n"
            "All regions are interconnected via redundant 100 Gbps dedicated optical fibers with **zero egress costs** between zones."
        )
    },
    {
        "id": "kb-triage-exit-code-137",
        "title": "Diagnostic Runbook — Exit Code 137 OOMKilled",
        "category": "runbook",
        "heading": "Triage & Fix Exit Code 137 (Out of Memory)",
        "keywords": ["exit code 137", "oomkilled", "oom", "memory", "crashloopbackoff", "pod crash", "kill 9", "troubleshoot", "fix"],
        "content": (
            "Exit Code 137 indicates the Linux Kernel OOM (Out Of Memory) Killer terminated the container because memory exceeded its cgroup limit.\n\n"
            "**Diagnostic Steps**:\n"
            "1. Inspect pod termination state:\n"
            "   ```bash\n"
            "   kubectl describe pod <pod-name> -n production | grep -A 5 'Last State'\n"
            "   ```\n"
            "2. Confirm OOMKilled via Loki logs:\n"
            "   Query Loki: `{app=\"<service-name>\"} |= \"OOMKilled\" or \"exit code 137\"`\n\n"
            "**Remediation Steps**:\n"
            "1. Increase memory request and limit in your deployment manifest or via console:\n"
            "   ```yaml\n"
            "   resources:\n"
            "     limits:\n"
            "       memory: \"2Gi\"\n"
            "     requests:\n"
            "       memory: \"1Gi\"\n"
            "   ```\n"
            "2. Check for memory leaks in Node.js/Python/Go heap buffers.\n"
            "3. If urgent, roll back to the previous stable release using `arv cicd rollback <app> --target=previous`."
        )
    }
]

# Synonym mappings for semantic expansion
SYNONYM_MAP = {
    "bucket": ["s3", "storage", "store", "arvstore", "blob", "object"],
    "s3": ["storage", "store", "arvstore", "bucket", "object", "upload"],
    "upload": ["store", "storage", "s3", "bucket", "cp", "presigned"],
    "download": ["store", "storage", "s3", "bucket", "cp", "presigned"],
    "database": ["db", "arvdb", "postgres", "postgresql", "redis", "mysql", "patroni", "pgbouncer", "sql"],
    "postgres": ["database", "arvdb", "patroni", "pgbouncer", "sql", "ha"],
    "postgresql": ["database", "arvdb", "patroni", "pgbouncer", "sql", "ha"],
    "redis": ["database", "arvdb", "cache", "in-memory"],
    "mysql": ["database", "arvdb", "sql"],
    "failover": ["patroni", "database", "replica", "ha", "high availability"],
    "replica": ["patroni", "database", "read replica", "replication", "ha"],
    "mfa": ["totp", "2fa", "two-factor", "authenticator", "security", "arvauth", "arvgate"],
    "totp": ["mfa", "2fa", "authenticator", "qr code", "security", "arvauth"],
    "2fa": ["mfa", "totp", "authenticator", "security", "arvauth"],
    "rbac": ["roles", "permissions", "admin", "operator", "developer", "viewer", "arvgate", "security"],
    "role": ["rbac", "permissions", "admin", "operator", "developer", "viewer", "arvgate"],
    "permission": ["rbac", "roles", "admin", "operator", "developer", "viewer", "arvgate"],
    "audit": ["compliance", "audit log", "dpdpa", "soc2", "immutable", "hmac"],
    "compliance": ["dpdpa", "soc2", "iso27001", "audit", "security", "gdpr"],
    "egress": ["billing", "finops", "zero egress", "toll", "cost", "bandwidth"],
    "billing": ["cost", "spend", "invoice", "finops", "inr", "usd", "pricing", "money"],
    "cost": ["billing", "spend", "invoice", "finops", "inr", "usd", "pricing"],
    "pricing": ["billing", "cost", "spend", "inr", "usd", "per-second"],
    "cli": ["arv", "command", "terminal", "syntax", "commands", "bash"],
    "arv": ["cli", "command", "syntax", "terminal", "tools"],
    "canary": ["deployment", "cicd", "traffic", "rollback", "envoy", "release"],
    "rollback": ["canary", "cicd", "deployment", "envoy", "release", "undo"],
    "deploy": ["release", "cicd", "canary", "rollingupdate", "bluegreen", "gitops"],
    "oom": ["exit code 137", "oomkilled", "memory", "crashloop", "runbook"],
    "oomkilled": ["exit code 137", "oom", "memory", "crashloop", "runbook"],
    "crash": ["crashloopbackoff", "troubleshoot", "triage", "error", "pod", "runbook"],
    "crashloop": ["crashloopbackoff", "pod", "exit code 137", "oomkilled", "runbook"],
    "ebpf": ["kernel", "trace", "network", "socket", "observability", "latency"],
    "trace": ["ebpf", "telemetry", "observability", "loki", "prometheus"],
    "region": ["regions", "zones", "mumbai", "hyderabad", "bangalore", "delhi", "datacenter"],
    "regions": ["zones", "mumbai", "hyderabad", "bangalore", "delhi", "datacenter"]
}


class KnowledgeBase:
    """
    In-memory semantic search engine for platform docs, runbooks, and curated domain vectors.
    """
    def __init__(self, docs_root: Optional[str] = None):
        if docs_root is None:
            base = os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))))
            docs_root = os.path.join(base, "docs")
        self.docs_root = docs_root
        self.chunks: List[DocumentChunk] = []
        self.indexed_files: List[str] = []
        self._build_index()

    def _build_index(self):
        """Scans docs/ and docs/runbooks/, and mounts curated domain vectors."""
        # 1. Mount Curated Authoritative Knowledge Vectors
        for kv in CURATED_KNOWLEDGE_VECTORS:
            self.chunks.append(DocumentChunk(
                doc_id=kv["id"],
                title=kv["title"],
                file_path=f"kb/{kv['category']}.md",
                heading=kv["heading"],
                content=kv["content"],
                category=kv["category"],
                keywords=kv.get("keywords", [])
            ))

        # 2. Scan and index physical markdown files
        if not os.path.exists(self.docs_root):
            return

        for root, _, files in os.walk(self.docs_root):
            for file in files:
                if file.endswith(".md"):
                    full_path = os.path.join(root, file)
                    rel_path = os.path.relpath(full_path, self.docs_root)
                    self._index_file(full_path, rel_path)

    def _index_file(self, full_path: str, rel_path: str):
        try:
            with open(full_path, "r", encoding="utf-8", errors="ignore") as f:
                text = f.read()

            title = os.path.splitext(os.path.basename(rel_path))[0].replace("-", " ").title()
            self.indexed_files.append(rel_path)

            category = "runbook" if "runbook" in rel_path.lower() else "doc"

            # Split by markdown headers (#, ##, ###)
            sections = re.split(r'\n(?=#{1,3}\s+)', text)
            for idx, sec in enumerate(sections):
                if not sec.strip():
                    continue
                header_match = re.match(r'^(#{1,3})\s+(.+)$', sec.strip().split('\n')[0])
                heading = header_match.group(2) if header_match else f"Section {idx + 1}"
                chunk_id = f"{rel_path}#{idx}"
                self.chunks.append(DocumentChunk(
                    doc_id=chunk_id,
                    title=title,
                    file_path=rel_path,
                    heading=heading,
                    content=sec,
                    category=category
                ))
        except Exception:
            pass

    def expand_query(self, query: str) -> Set[str]:
        """Performs tokenization and synonym expansion on the user query."""
        raw_words = re.findall(r'\b[a-z0-9_\-]+\b', query.lower())
        expanded = set(raw_words)
        for word in raw_words:
            if word in SYNONYM_MAP:
                for syn in SYNONYM_MAP[word]:
                    expanded.add(syn)
        return expanded

    def search(self, query: str, top_k: int = 4) -> List[Dict[str, Any]]:
        """
        Performs semantic & token-overlap BM25-style ranking over indexed chunks.
        Applies phrase bonuses, title/heading boosts, and keyword alignment.
        """
        raw_tokens = re.findall(r'\b[a-z0-9_\-]+\b', query.lower())
        if not raw_tokens:
            return []

        query_words = set(raw_tokens)
        expanded_words = self.expand_query(query)
        clean_query_str = " ".join(raw_tokens)

        scored_chunks: List[Tuple[float, DocumentChunk]] = []
        for chunk in self.chunks:
            direct_overlap = query_words.intersection(chunk.word_set)
            expanded_overlap = expanded_words.intersection(chunk.word_set)

            if not expanded_overlap:
                continue

            # Base BM25-style term frequency score
            base_score = (len(direct_overlap) * 2.0 + len(expanded_overlap) * 1.0) / (
                math.sqrt(len(expanded_words)) * math.sqrt(len(chunk.word_set) or 1)
            )

            # Boost if query matches title or heading
            heading_words = set(re.findall(r'\b[a-z0-9_\-]+\b', (chunk.title + " " + chunk.heading).lower()))
            if query_words.intersection(heading_words):
                base_score += 0.75

            # Phrase matching bonus for multi-word queries
            if len(clean_query_str) > 5 and clean_query_str in chunk.content.lower():
                base_score += 1.2

            # Specific keyword bonus
            if any(kw in clean_query_str for kw in chunk.keywords):
                base_score += 0.8

            scored_chunks.append((base_score, chunk))

        scored_chunks.sort(key=lambda x: x[0], reverse=True)

        results = []
        for score, chunk in scored_chunks[:top_k]:
            results.append({
                "doc_id": chunk.doc_id,
                "title": chunk.title,
                "file_path": chunk.file_path,
                "heading": chunk.heading,
                "category": chunk.category,
                "score": round(score, 3),
                "content": chunk.content,
                "excerpt": chunk.content[:450] + ("..." if len(chunk.content) > 450 else ""),
                "citation": f"[Doc: {chunk.file_path} > {chunk.heading}]"
            })
        return results


# Global singleton instance
knowledge_base = KnowledgeBase()
