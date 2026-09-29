# ArvRegistry Verification Report

## 1. Pre-Fix State
ArvRegistry calculated container image sizes using a synthetic mathematical formula (`size_mb=round(120.0 + len(a.name) * 8.5, 1)`) and returned mock repositories with fake sizes.

## 2. Root Cause
- `backend/app/services/arvregistry/router.py`:
  - Line 47: `size_mb=round(120.0 + len(a.name) * 8.5, 1)` fabricated image sizes based on character lengths.

## 3. Fix Description
1. **Removed Formula-Derived Sizes**:
   - Completely deleted `120.0 + len(a.name) * 8.5`.
2. **Real Docker Engine Inspection**:
   - If local Docker daemon is running, inspects real local images with `client.images.list()`, extracting genuine `attrs["Size"]` in MB.
   - If querying un-pulled application image metadata, `size_mb` is reported honestly as `None`.
   - Vulnerability data accurately reports `{"scan_status": "NO_SCAN_DATA"}`.

## 4. Verification Evidence
- Test suite: `backend/tests/test_services_control_plane.py`
  - `test_registry_no_formula_sizes`: Passed (100%)

## 5. Invariants Checked
- **Rule 1 (No Fabricated Data)**: Zero formula-derived numbers or mock CVE counts.
- **Rule 2 (Evidence-Gated State)**: Only real images physically present on host show byte sizes.
- **Rule 3 (Provenance on Every Resource)**: Every image tagged with `source="docker-engine"` or `source="registry-only"`.
- **Rule 4 (No Stub Implementations)**: Direct inspection of local Docker daemon.
- **Rule 5 (Graceful Degradation)**: Image sizes cleanly display `None` when offline.
