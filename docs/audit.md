# Aravanta Cloud OS: Phase 0 Audit & Environment Discovery Report

## 1. Environment Inventory

| Tool / CLI / Component | Detected Path / Status | Current Operational Capability |
| :--- | :--- | :--- |
| **Docker CLI** | `C:\Program Files\Docker\Docker\resources\bin\docker.exe` | CLI installed; Docker Desktop daemon not currently running (`//./pipe/dockerDesktopLinuxEngine` not found). Must report `UNAVAILABLE` or `AWAITING_PROVIDER_SETUP` unless daemon is launched. |
| **Kubectl CLI** | `C:\Program Files\Docker\Docker\resources\bin\kubectl.exe` | CLI installed; no cluster reachable on `localhost:8080` (`connection refused`). No synthetic pods allowed. |
| **AWS CLI** | `C:\Program Files\Amazon\AWSCLIV2\aws.exe` | CLI installed; no AWS credentials found in environment (`NoCredentials`). CloudProvider driver must require valid AWS keys via ArvVault. |
| **Python** | `Python 3.12.0` (Windows) | Operational. `boto3`, `docker`, `cryptography`, `fastapi`, `SQLAlchemy`, `asyncpg`, `psycopg2-binary`, `PyGithub`, `celery` installed. |
| **gcloud / az / trivy** | `NOT_FOUND` | Not installed in PATH. Must be marked `UNAVAILABLE` / `AWAITING_PROVIDER_SETUP`. |
| **kind / k3d / minikube** | `NOT_FOUND` | No local Kubernetes cluster engine currently installed. |
| **psql / postgres** | `psql` CLI not in PATH | PostgreSQL remote database is configured via Neon (`DATABASE_URL`). Connection to PostgreSQL is live and verified. |
| **dig** | `NOT_FOUND` | Use Python `dnspython` (installed v2.8.0) and PowerShell `Resolve-DnsName` for verified DNS queries. |
| **Prometheus / node_exporter**| `NOT_FOUND` | No external Prometheus server running. Metrics panel must return `NO_TELEMETRY` unless real host/docker metrics are observed. |

---

## 2. Deep Audit: Simulated & Fake Behaviors

| Service | File:Line | What is Faked / Fabricated | Replacement Plan |
| :--- | :--- | :--- | :--- |
| **Cloud Providers** | `backend/app/services/cloud_providers/drivers/aws_driver.py:7-9` | Returns `True, "CONNECTED"` merely if `aws_access_key_id` starts with `AKIA`/`ASIA` without making any real STS API call. | Replace with real `boto3.client('sts').get_caller_identity()` call. Return `CONNECTED`, `INVALID_CREDENTIALS`, `NETWORK_ERROR`, or `INSUFFICIENT_PERMISSIONS`. |
| **Cloud Providers** | `backend/app/services/cloud_providers/drivers/docker_driver.py:6` | Returns `True, "CONNECTED"` hardcoded even when Docker engine is stopped. | Replace with real `docker.from_env().ping()` check. Return `CONNECTED` or `NETWORK_ERROR`. |
| **Cloud Providers** | `backend/app/services/cloud_providers/drivers/kube_driver.py:5` | Returns `True, "CONNECTED"` hardcoded without checking Kubernetes API or kubeconfig. | Replace with real Kubernetes API version call using provided kubeconfig. |
| **ArvCompute** | `backend/app/services/arvcompute/router.py:228-245` | `POST /instances` inserts DB row with `status="AWAITING_PROVIDER_SETUP"` but does not call any provider driver even if credentials exist. | Implement `CloudProvider.compute.create()` calling EC2 / Local Docker Container driver. Evidence-gated transitions with `provider_resource_id`. |
| **ArvCompute** | `backend/app/services/arvcompute/router.py:355` | `POST /instances/{id}/action` sets `inst.status = "STOPPED"` directly in DB without checking or stopping the actual cloud instance. | Implement `CloudProvider.compute.stop()`, verify with provider, record `state_source="provider"` and `observed_at`. |
| **ArvCompute** | `backend/app/core/cloud_models.py:53-57` | Default columns: `status="RUNNING"`, `cpu_usage=5.0`, `ram_usage=20.0` in `ComputeInstance`. | Set default `status="AWAITING_PROVIDER_SETUP"`, nullable `cpu_usage`/`ram_usage`. Enforce state transitions through evidence guard. |
| **ArvNetwork** | `backend/app/services/arvnetwork/router.py:63` | Sets `status="ACTIVE"` on VPC if any AWS/GCP credential exists, without creating any VPC in AWS/GCP. | Call real `boto3.client('ec2').create_vpc()` with idempotency key. Record real `provider_resource_id` (`vpc-xxxx`). Without credentials, show `AWAITING_PROVIDER_SETUP`. |
| **ArvDNS** | `backend/app/services/arvdns/router.py:87-98` | Hardcoded `cf_zone_id = "real_zone_id"` and commented out the HTTP call to Cloudflare. | Connect real Cloudflare / Route53 driver. Call provider, then verify propagation using real DNS resolver (`dnspython`). |
| **ArvEdge** | `backend/app/services/arvedge/router.py:43-62` | Synthesizes fake load balancers (`alb-main-01`, `gateway.{ws_id}.aravanta.cloud`, `status="ACTIVE"`) out of thin air. | Remove all synthesized LBs. Query real AWS ELB / Traefik / Envoy. If none configured, show `AWAITING_PROVIDER_SETUP`. |
| **ArvKube** | `backend/app/services/arvkube/router.py:260-262` | Calculates formulaic metrics: `cpu_cores = node_count * 4`, `ram_gb = node_count * 16`, `pod_count = node_count * 3`. | Remove formula metrics. Retrieve real node and pod metrics from live Kubernetes API or return `NO_TELEMETRY`. |
| **ArvKube** | `backend/app/services/arvkube/router.py:277-293` | Does not list real pods from Kubernetes API for active clusters. | Connect to live Kubernetes API (`/api/v1/pods`) using authenticated client. Display actual pods, namespaces, container statuses. |
| **ArvDB** | `backend/app/services/arvdb/router.py:126` | Generates random 32-character password in Python but does not create a corresponding database role/user in PostgreSQL with that password. | Execute real `CREATE ROLE ... WITH LOGIN PASSWORD ...` and grant database privileges so user can actually connect with the generated credentials. |
| **ArvWatch** | `backend/app/services/arvwatch/router.py:533-543` | Hardcoded subsystem health list with fake latency numbers (e.g. `latency_ms: 2.4`, `8.1`, `11.3`). | Measure real HTTP / DB / provider ping latencies. If subsystem is unconfigured, mark as `UNCONFIGURED` or `NO_TELEMETRY`. |
| **ArvCICD** | `backend/app/services/arvcicd/router.py:28-39` | Generates fake commit hashes with MD5, hardcodes `"duration": wf.duration or "1m 30s"`, and sets `last_status = "SUCCESS"` immediately upon dispatch. | Track real GitHub Action run status via polling. Capture real start/finish times, duration, commit hash, and logs. |
| **ArvRegistry** | `backend/app/services/arvregistry/router.py:47` | Calculates fake image size formula: `size_mb = 120.0 + len(a.name) * 8.5`. | Integrate with real OCI registry API or AWS ECR. Fetch real manifest, layers, and digest. If no registry configured, show `AWAITING_PROVIDER_SETUP`. |
| **Frontend Dashboard** | `frontend/src/pages/Dashboard.tsx:451-456` | Returns fallback hardcoded duration `'1m 42s'` and fake commit hash `'fc3e039b'` if no pipelines exist. | Render honest empty state (`"—"`) and `AWAITING_PIPELINE_RUN`. |
| **Seeded Demo Data** | `scripts/seed.py:51-358` | Seeds demo users, instances, clusters, databases with hardcoded IDs and metrics. | Ensure seed data is completely isolated from production/control-plane runtime. |

---

## 3. Audit of Believed-Genuine Services

### 3.1 ArvStorage (`backend/app/services/arvstore/router.py`)
- **Status:** **GENUINE WITH LOCAL STORAGE, EXPANDABLE TO S3.**
- **Finding:** Files uploaded via `POST /buckets/{id}/upload` are read into memory, stored as binary data in `storage_objects.data`, given real SHA256/MD5 ETags, and streamed back via `GET /buckets/{id}/objects/{key}/download`.
- **Harden:** When AWS S3 credentials are configured in Cloud Providers, provide S3 driver to store and retrieve directly from real S3 buckets.

### 3.2 ArvFunctions (`backend/app/services/arvfunctions/router.py`)
- **Status:** **GENUINE LOCAL RUNTIME EXECUTION.**
- **Finding:** Invocations execute Python code using `subprocess.run(["python3", "-c", wrapper, ...])`, capturing real execution duration, stdout, and stderr.
- **Harden:**
  1. On Windows, ensure it uses `sys.executable` instead of `"python3"` so it runs cross-platform without depending on symlinks.
  2. Implement versioning and real timeout bounds.

### 3.3 ArvEvents (`backend/app/services/arvevents/router.py`)
- **Status:** **GENUINE QUEUE ENGINE.**
- **Finding:** Implements real message queuing, visibility deadlines, in-flight state tracking, receive count, DLQ routing, and message acknowledgment.
- **Harden:** Ensure queue depth and message counts reflect active non-expired DB rows rather than synthetic numbers.

### 3.4 ArvVault (`backend/app/services/arvvault/router.py` & `app/core/crypto.py`)
- **Status:** **GENUINE CRYPTOGRAPHY.**
- **Finding:** Uses real `AES-256-GCM` with cryptographic random 12-byte IVs and authenticated tags via `cryptography.hazmat.primitives.ciphers.aead.AESGCM`. Tracks key versions and access audit logs.
- **Harden:** Ensure private credentials in Cloud Providers and DB passwords are never returned in plaintext in list APIs and are strictly write-only or require explicit password reveal authorization.

---

## 4. Phase 0 Gate Check

- [x] Environment discovery completed and recorded.
- [x] Every fake/simulated behavior mapped to file, line, and replacement plan.
- [x] ArvStorage, ArvFunctions, ArvEvents, and ArvVault audited.
- **Gate 0 Decision:** **PASSED.** Proceed to Phase 1 (Foundation).
