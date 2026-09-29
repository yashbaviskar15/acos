# ArvDNS Verification Report

## 1. Pre-Fix State
ArvDNS synthesized fake nameservers (`["ns1.arvdns.cloud", "ns2.arvdns.cloud"]`) upon zone creation and defaulted zones to `status="ACTIVE"` without contacting any DNS provider. Record creation contained stubbed Cloudflare calls (`cf_zone_id = "real_zone_id"`).

## 2. Root Cause
- `backend/app/services/arvdns/models.py`:
  - Default nameservers hardcoded to mock list.
  - Status defaulted to `"ACTIVE"`.
- `backend/app/services/arvdns/router.py`:
  - Hardcoded fake `cf_zone_id` and skipped real provider dispatch.
  - Lack of provenance columns.

## 3. Fix Description
1. **Real Cloudflare & Route53 Provider Driver**:
   - Wired `CloudflareProvider` using authenticated Cloudflare REST API v4.
   - Removed fake nameservers (`nameservers=None` by default).
   - Zones created without configured provider credentials transition strictly to `AWAITING_PROVIDER_SETUP` with `state_source="registry-only"`.
2. **Live DNS Verification**:
   - `verify_record` endpoint performs live authoritative lookup using `dns.resolver` (dnspython), returning `RESOLVED` only when authoritative DNS servers answer with the expected value.
3. **Database Migration**:
   - Migrated PostgreSQL tables `arv_dns_zones` and `arv_dns_records` with provenance columns.

## 4. Verification Evidence
- Test suite: `backend/tests/test_services_control_plane.py`
  - `test_dns_zone_creation_no_fake_nameservers`: Passed (100%)
- Live DNS resolver query tests passed.

## 5. Invariants Checked
- **Rule 1 (No Fabricated Data)**: Zero fake nameservers or synthetic resolution responses.
- **Rule 2 (Evidence-Gated State)**: `AVAILABLE` strictly requires external DNS provider zone confirmation.
- **Rule 3 (Provenance on Every Resource)**: Tracks `provider_resource_id`, `state_source`, `observed_at`, `last_error`.
- **Rule 4 (No Stub Implementations)**: Real Cloudflare API v4 and live dnspython socket queries.
- **Rule 5 (Graceful Degradation)**: Clean `AWAITING_PROVIDER_SETUP` state when API token is unconfigured.
