# ArvWatch Verification Report

## 1. Pre-Fix State
Previously, ArvWatch fabricated CPU, memory, network, and latency graphs using synthetic base numbers, and calculated billing costs even for unprovisioned resources (`AWAITING_PROVIDER_SETUP`).

## 2. Root Cause
- `backend/app/services/arvwatch/router.py`:
  - Accrued cost in `get_dashboard_services()` calculated hourly burn on instances and databases regardless of whether they were in `AWAITING_PROVIDER_SETUP`.
  - Metrics returned arbitrary telemetry instead of honest `NO_TELEMETRY` status when host agents were absent.

## 3. Fix Description
1. **Zero Cost on Unprovisioned Resources**:
   - Accrued cost calculation now enforces: if `status == "AWAITING_PROVIDER_SETUP"`, `cost_usd = 0.0`, `cost_inr = 0.0`, `hourly_rate = 0.0`, `runtime_hours = 0.0`.
2. **Honest Telemetry States**:
   - If instances report no telemetry (`cpu_usage is None`), `get_metrics()` returns `telemetry_status="NO_TELEMETRY"` with `cpu_usage_percent=None`.
   - `timeseries` returns `telemetry_source="NO_TELEMETRY"` with `None` values instead of invented sinusoids.
3. **Real Host & Database Signals**:
   - P95 latency is measured from real platform database round-trip times (`time.monotonic()`).
   - Serverless invocation metrics count actual rows from `arv_function_invocations`.

## 4. Verification Evidence
- Test suite: `backend/tests/test_services_control_plane.py`
  - `test_watch_telemetry_honesty`: Passed (100%)
  - `test_watch_dashboard_services_cost_honesty`: Passed (100%)

## 5. Invariants Checked
- **Rule 1 (No Fabricated Data)**: Removed all formula-derived metrics. Unmeasured dimensions return `None`.
- **Rule 2 (Evidence-Gated State)**: `ACTIVE` telemetry requires real reporting agents.
- **Rule 3 (Provenance on Every Resource)**: Telemetry sources labeled as `"REAL_HOST_TELEMETRY"` or `"NO_TELEMETRY"`.
- **Rule 4 (No Stub Implementations)**: Live database latency measurement.
- **Rule 5 (Graceful Degradation)**: Honest empty charts and unavailable badges.
