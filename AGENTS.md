# Aravanta Cloud OS: Real Control Plane Rules

## Mission
Aravanta Cloud OS is a real cloud control plane. Every service shown in the UI must either:
  A) manage a genuinely provisioned, usable resource, or
  B) state clearly why it cannot (missing provider, credentials, or infrastructure).

The control-plane database is a METADATA REGISTRY, not infrastructure. A row, generated ID, hostname, or status string is never evidence that a resource exists.

## Invariants (never violate)

1. NO FABRICATED DATA in any runtime path. This includes: random or formula-derived metrics, invented IDs/IPs/hostnames/URLs/timestamps/durations, synthesized Kubernetes objects, seeded demo pipelines/repos/alerts, hardcoded vulnerability counts, and "deterministic mocks." If data doesn't exist, render an honest empty/unavailable state. Never write a stub just to make the UI look complete.

2. EVIDENCE-GATED STATE. Only a provider driver or the reconciler may set RUNNING / AVAILABLE / ACTIVE / SUCCESS. Enforce this in ONE state-transition function that requires: provider_resource_id, state_source, observed_at. Direct writes of these states anywhere else are bugs.

3. PROVIDER IS SOURCE OF TRUTH. The reconciler periodically compares provider state with the registry and updates the registry, including drift and external deletion.

4. PROVENANCE ON EVERY RESPONSE. Each status/metric/log payload carries {source: provider|k8s-api|prometheus|host|registry-only, observed_at}. The UI shows a source badge and the age of the data.

5. SECRETS. Encrypt all credentials and passwords with ArvVault (AES-256-GCM/HKDF). Secret fields are write-only in APIs. Never return or log AWS secret keys, GCP private keys, Azure client secrets, or DB passwords, and add log redaction tests. Connection strings containing passwords are revealed only through an authorized, audited action.

6. SAFETY AGAINST REAL INFRASTRUCTURE
   - Never create paid or destructive cloud resources without explicit user confirmation for that specific run.
   - Default live tests to the smallest/cheapest sizes and a dry-run mode where the provider supports it.
   - Tag every provider resource: managed-by=aravanta, aravanta-resource-id=<id>. Test resources also get aravanta-test=true.
   - Only delete resources that carry Aravanta tags. Provide a cleanup script for test resources.
   - Never commit credentials. Never run destructive commands against an account you haven't confirmed is a sandbox.

7. HONEST REPORTING. Never call a service "real" or "working" without evidence (see Verification Levels). Unverifiable is a valid, honest outcome. Fabricated success is not.

8. DON'T REWRITE WHAT WORKS. ArvFunctions, ArvEvents (queues/DLQ), ArvVault, and ArvStorage are believed to be genuine. Audit and harden them; do not replace them unless the audit finds fake behavior.

9. USE THE EXISTING STACK. Inspect the repo first. Reuse existing frameworks, job/queue mechanisms, and UI components. Introduce a new dependency only with a written justification.

## State model

Resource lifecycle (per resource):
  AWAITING_PROVIDER_SETUP, AWAITING_CREDENTIALS, PROVISIONING, STARTING, RUNNING (AVAILABLE for DB/LB/registry),
  STOPPING, STOPPED, DELETING, DELETED, FAILED, MISSING_AT_PROVIDER (deleted or drifted externally), UNKNOWN (provider unreachable; last known state shown with its age)

Data availability (per metric/log/status panel, separate from lifecycle):
  REAL_DATA, NO_TELEMETRY, UNAVAILABLE, ERROR

Registry fields for every provider-managed resource:
  resource_id, service, provider, region, provider_resource_id, desired_state, actual_state, state_source, observed_at, last_error, job_id, tags, created_at, deleted_at

## Provider abstraction
CloudProvider interface with AWSProvider, GCPProvider, AzureProvider, LocalProvider (only enabled when the required local engine is detected). Business logic lives in the service layer, never duplicated per provider. Drivers expose consistent operations, for example:
  compute: create/start/stop/restart/delete/get_status/get_network_info
  database: create/get_status/backup/restore/delete
  kubernetes: create/get_status/get_kubeconfig/delete
  network: create_vpc/create_subnet/create_firewall/delete
  dns: create_record/delete_record/lookup
Provider-managed creates must use idempotency keys (e.g. EC2 ClientToken).

## Async provisioning
Long-running operations run as background jobs with: job_id, status, progress, error, retry policy, idempotency key, and resumability after backend restart. The API returns 202 + job_id immediately. The UI polls or subscribes to the job.

## Provider Management
"Cloud Providers" section: AWS, GCP, Azure, Docker/Local, DNS provider (Cloudflare, Route53, PowerDNS), Git provider, Registry provider. Each has a TEST CONNECTION that makes a real authenticated provider call and returns exactly one of: CONNECTED, INVALID_CREDENTIALS, INSUFFICIENT_PERMISSIONS, NETWORK_ERROR, NOT_CONFIGURED. It must never just check that fields are non-empty. Services depending on an unconfigured provider show AWAITING_PROVIDER_SETUP with a link to setup.

## Definition of Done (applies to EVERY service)
A service is done only when all of these are answered in docs/verification/<service>.md with evidence:
  1. Where does the user access it (console route)?
  2. What does the user create?
  3. Where is the actual resource created (provider/engine)?
  4. How does the backend talk to it?
  5. How does the user connect to it (real, working connection method)?
  6. How does the user manage it (all actions operate on the real resource)?
  7. Where does the UI get real status (and how is drift/external deletion handled)?
  8. What does the UI show if the provider is unavailable or credentials are missing?
  9. How are logs and metrics retrieved (real source, or NO_TELEMETRY)?
  10. How does the user tell REAL from unavailable (badges, provenance)?
  11. How is the resource deleted, and how is deletion verified at the provider?
  12. The acceptance test passed:
      CREATE → PROVISION → VERIFY AT PROVIDER → DISPLAY → ACCESS → ACT → VERIFY ACTION AT PROVIDER → READ STATE → MONITOR → DELETE → VERIFY DELETION

Every service also needs a console experience (list, create, details page /<service>/<type>/{id} with Overview, Configuration, Networking/Security where relevant, Metrics, Logs, Activity, Connections) and actions that operate on the real resource.

## Verification levels (use exactly these labels)
  VERIFIED_LIVE: passed against a real cloud provider, with evidence (provider IDs, CLI/API output).
  VERIFIED_LOCAL: passed against a real local engine (Docker, Postgres, kind, etc.), with evidence.
  CODE_COMPLETE_UNVERIFIED: implemented, but untested because credentials/infrastructure are missing. State exactly what is missing.
  BLOCKED: cannot proceed. State the blocker.
Unit tests using provider mocks are allowed in the TEST suite only. They never count as verification and must never be reachable in runtime.
