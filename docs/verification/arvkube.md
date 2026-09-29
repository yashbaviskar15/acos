# ArvKube Verification Report

## 1. Pre-Fix State
ArvKube allowed users to create clusters that defaulted to `status="ACTIVE"`, synthesized 3 worker nodes, and returned a list of 12 fake pods (`arv-core-api-...`, `ingress-nginx-...`) and 48 GB of fabricated RAM without connecting to any Kubernetes cluster.

## 2. Root Cause
- `backend/app/services/arvkube/router.py`:
  - `create_cluster()` defaulted to 3 nodes, 12 vCPUs, and 48 GB RAM.
  - `list_pods()` generated synthetic pods.
  - `scale_cluster()` altered database numbers without contacting a cluster orchestrator.

## 3. Fix Description
1. **Live Kubernetes API Driver**:
   - Implemented `KubernetesAPIDriver` in `backend/app/core/providers/kubernetes.py` querying `/version`, `/api/v1/nodes`, and `/api/v1/pods`.
2. **Evidence-Gated Cluster Registration**:
   - `create_cluster()` now strictly transitions to `AWAITING_PROVIDER_SETUP` with `node_count=0`, `cpu_cores_total=0`, `ram_gb_total=0`, and `endpoint=None`.
   - `connect_cluster()` verifies the live endpoint via HTTP/TLS before setting `ACTIVE` with `state_source="k8s-api"`.
3. **No Synthetic Pods**:
   - `list_pods()` queries the live cluster API if connected; otherwise returns an empty list `[]` with HTTP response header `x-telemetry-status: NO_TELEMETRY`.
4. **Guarded Actions**:
   - Scaling an unprovisioned cluster is rejected with HTTP 400.
   - Downloading kubeconfig for unprovisioned cluster is rejected with HTTP 404.

## 4. Verification Evidence
- Test suite: `backend/tests/test_services_control_plane.py`
  - `test_kube_cluster_creation_without_provider`: Passed (100%)
  - `test_kube_cluster_scale_blocked`: Passed (100%)
  - `test_kube_pods_empty_telemetry`: Passed (100%)

## 5. Invariants Checked
- **Rule 1 (No Fabricated Data)**: Zero synthesized pods, nodes, or invented kubeconfig endpoints.
- **Rule 2 (Evidence-Gated State)**: `ACTIVE` strictly requires verified handshake with live K8s API server.
- **Rule 3 (Provenance on Every Resource)**: Tracks `provider_resource_id`, `state_source`, `observed_at`, `last_error`.
- **Rule 4 (No Stub Implementations)**: Real Kubernetes REST API client.
- **Rule 5 (Graceful Degradation)**: Clean `AWAITING_PROVIDER_SETUP` with setup path.
