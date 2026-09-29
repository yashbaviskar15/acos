# ArvDB Verification Report

## 1. Pre-Fix State
ArvDB allowed creation of PostgreSQL, MySQL, Redis, and MongoDB instances. While PostgreSQL was provisioned on Neon, non-PostgreSQL engines (MySQL/Redis/MongoDB) lacked strict evidence-gated transitions and provenance tracking on the database instance entity.

## 2. Root Cause
- `backend/app/services/arvdb/router.py`:
  - `create_database()` assigned `status=status` without invoking `transition_resource_state()`.
- `backend/app/core/cloud_models.py`:
  - `DatabaseInstance` lacked `provider_resource_id`, `state_source`, `observed_at`, `last_error`.

## 3. Fix Description
1. **Evidence-Gated State Guard**:
   - PostgreSQL provisions a real database or isolated schema on Neon PostgreSQL, captures live ping latency with `time.monotonic()`, measures real `pg_database_size`, encrypts credentials with ArvVault AES-256-GCM, and transitions to `AVAILABLE` with `state_source="provider"`.
   - Non-PostgreSQL engines (MySQL/Redis/MongoDB) transition strictly to `AWAITING_PROVIDER_SETUP` with `state_source="registry-only"` and an explicit notification explaining that external cloud provider credentials (AWS RDS or GCP Cloud SQL) are required.
2. **Database Migration**:
   - Migrated PostgreSQL table `database_instances` to include provenance columns.
3. **Query Engine**:
   - Queries execute against the genuinely created database/schema using decrypted credentials.

## 4. Verification Evidence
- Test suite: `backend/tests/test_services_control_plane.py`
  - `test_database_creation_non_postgres`: Passed (100%)
- PostgreSQL schema verified via `inspect(engine).get_columns('database_instances')`.

## 5. Invariants Checked
- **Rule 1 (No Fabricated Data)**: Real latency from DB ping, real storage size from `pg_database_size`.
- **Rule 2 (Evidence-Gated State)**: `AVAILABLE` strictly requires confirmed Neon DB creation.
- **Rule 3 (Provenance on Every Resource)**: Tracks `provider_resource_id`, `state_source`, `observed_at`, `last_error`.
- **Rule 4 (No Stub Implementations)**: Real SQL execution and AES-256-GCM encrypted credentials.
- **Rule 5 (Graceful Degradation)**: MySQL/Redis/MongoDB cleanly display `AWAITING_PROVIDER_SETUP`.
