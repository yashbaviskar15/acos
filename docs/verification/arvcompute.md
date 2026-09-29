# ArvCompute Verification Report

## 1. Pre-Fix State
Previously, ArvCompute allowed users to deploy "virtual machines" which defaulted directly to `RUNNING` or `START_REQUESTED` without interacting with any cloud provider or local hypervisor. Instances displayed synthesized private IPs (`10.0.x.x`), formulaic CPU/RAM utilizations, and mock SSH connection strings even when zero cloud provider credentials were configured. Furthermore, start, stop, and reboot actions toggled database strings without communicating with an external compute engine.

## 2. Root Cause
- `backend/app/services/arvcompute/router.py`:
  - `create_instance()`: inserted `ComputeInstance` directly into the database with synthetic IP assignments and status `AWAITING_PROVIDER_SETUP` or `RUNNING` without provider verification.
  - `instance_action()`: mutated `status` directly to `START_REQUESTED`, `STOPPED`, `REBOOT_REQUESTED` without invoking external provider drivers.
  - `connect_instance()`: returned fictitious SSH connection strings for instances lacking public IPs.
- `backend/app/core/cloud_models.py`:
  - `ComputeInstance` table lacked provenance columns (`provider_resource_id`, `state_source`, `observed_at`, `last_error`).

## 3. Fix Description
1. **Evidence-Gated State Guard**: Integrated `transition_resource_state()` on all lifecycle paths.
2. **Provider Driver Wiring**:
   - Wired `AWSCloudProvider` (EC2) with `managed-by=aravanta` tagging and `ClientToken` idempotency.
   - Wired `DockerLocalProvider` for verified local containers, honestly labeled as `"container-instance"` (not VM).
   - If credentials/daemons are absent, the instance transitions strictly to `AWAITING_PROVIDER_SETUP` with `state_source="registry-only"`, `private_ip=None`, and `public_ip=None`.
3. **Action Guarding**: Actions (`start`, `stop`, `reboot`) verify the presence of `provider_resource_id` and call the verified driver. Unprovisioned instances reject lifecycle actions with HTTP 400.
4. **Connection Guarding**: Connect endpoint checks for an actual verified `public_ip`; otherwise it returns `connectable: False` with an honest status explanation.
5. **UI Provenance**: `Compute.tsx` renders `StatusBadge` and `SourceBadge` displaying live provenance and observed timestamp.

## 4. Verification Evidence
- Test suite: `backend/tests/test_services_control_plane.py`
  - `test_compute_instance_creation_without_provider`: Passed (100%)
  - `test_compute_actions_blocked_on_unprovisioned`: Passed (100%)
  - `test_compute_connect_blocked_without_public_ip`: Passed (100%)
- Frontend production build: `npm run build` compiled cleanly with 0 errors.

## 5. Invariants Checked
- **Rule 1 (No Fabricated Data)**: No fake private/public IPs or synthetic CPU/RAM percentages.
- **Rule 2 (Evidence-Gated State)**: `RUNNING` is physically unachievable without confirmed provider execution.
- **Rule 3 (Provenance on Every Resource)**: Every instance records `provider_resource_id`, `state_source`, `observed_at`, `last_error`.
- **Rule 4 (No Stub Implementations)**: AWS EC2 calls real boto3 API; Docker calls real Docker daemon API.
- **Rule 5 (Graceful Degradation)**: Missing credentials cleanly report `AWAITING_PROVIDER_SETUP`.
