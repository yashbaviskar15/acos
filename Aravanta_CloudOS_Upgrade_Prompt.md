# Aravanta Cloud OS — Upgrade & Competitive-Build Prompt

Use this prompt with an agentic coding tool (Claude Code, etc.) pointed at the
`acos` repo. It is sequenced so security fixes happen before any new feature
work — building new cloud services on top of confirmed auth bypasses would
make the platform worse, not more competitive.

---

## Context to give the agent

You are the lead engineer for **Aravanta Cloud OS** (Aravanta Tech), a
self-service cloud operations platform: React + TypeScript frontend, FastAPI
+ SQLAlchemy + PostgreSQL backend, deployed serverless on Vercel. A prior
engineering audit (Phase 1) already inspected the real, deployed codebase at
`backend/app/` and found the following **confirmed, code-verified issues**.
Do not re-derive these from scratch — verify each still applies, fix it, then
move to the next stage. Do not propose new cloud services, new UI, or new
"competing with AWS" features until Stage 0 is fully closed.

Two implementations exist in this repo. `backend/app/main.py` (imported by
`backend/api/index.py` / `api/index.py`) is the real, deployed one. The
top-level `arvgate/`, `arvcompute/`, `arvkube/`, etc. directories at the repo
root are **dead code** — not imported anywhere. Confirm this is still true
before touching either; if dead code is still dead, delete it rather than
fixing it in place, since maintaining two divergent auth implementations is
itself the source of several of the bugs below.

---

## Stage 0 — Close the confirmed P0 authentication bypasses (do this first, nothing else)

For each item: confirm it's still present, fix it, add a regression test that
fails on the old behavior and passes on the fix, and note the fix in a
CHANGELOG or PR description. Do not batch these into one giant commit — one
fix per bypass, so each is independently reviewable and revertable.

1. **Hardcoded MFA bypass codes.** `backend/app/core/security.py`,
   `verify_mfa_token()` currently accepts `"000000"`, `"123456"`, `"111111"`,
   `"999999"` as valid for any user's MFA, without checking the real TOTP
   secret. Remove the bypass entirely. If a developer/test bypass is
   genuinely needed for local dev, gate it behind an explicit
   `ENVIRONMENT=local` check that cannot be true in any deployed environment,
   and make it fail loudly (raise, not silently pass) if that env var is
   unset in a way that could be ambiguous in production.

2. **Password-reset code bypass + unauthenticated SuperAdmin creation.**
   `backend/app/services/arvgate/router.py`, `confirm_password_reset()`
   currently accepts any 6-digit numeric string as a valid reset code, and
   silently creates a new account with `role="SuperAdmin"` if the target
   email doesn't exist. Fix both: (a) the reset code must match only the
   real generated token, checked with constant-time comparison
   (`secrets.compare_digest`), with no numeric-format shortcut; (b) if the
   target email has no existing account, return a 404 or a generic
   "if this email exists, a code was sent" response — never create an
   account, and never create one with an elevated role. Also stop returning
   `reset_token` in the API response body; it must only be delivered via the
   actual email/SMS channel.

3. **Universal password bypass on "registration."**
   `backend/app/services/arvgate/router.py`, `register_user()` currently
   treats a request as a legitimate password change if the submitted
   password matches the literal string `"Aravanta@2026!"`, regardless of the
   real account password. Remove this check entirely. Registering against an
   existing email should return a 409 "account exists" — full stop. Any
   password-change flow for an existing account must go through proper
   authentication (current session, or the fixed reset flow above), never
   through the registration endpoint.

4. **Hardcoded JWT signing-key fallback.** `backend/app/core/config.py`,
   `SECRET_KEY` defaults to a hardcoded string if the env var is unset. Make
   `SECRET_KEY` required with no default — the app should fail to start (not
   silently run insecurely) if it's missing in any environment. Apply the
   same fix to any other service (including dead-code services, if they are
   kept instead of deleted) that has an equivalent fallback.

5. **JWT-driven auto-provisioning trusts unverified role claims.**
   `backend/app/services/arvgate/dependencies.py`, `get_current_user()`
   currently auto-creates a new active user — using the `role` claim from
   the token itself — if a validly-signed JWT's subject doesn't match an
   existing user. Remove the auto-provisioning behavior. A JWT whose subject
   has no matching database user should be rejected as invalid, full stop.
   New users are created only through the registration endpoint (which
   already correctly rejects client-supplied roles — reuse that same
   validator/pattern here for consistency, per the note in item 7).

6. **Hardcoded SuperAdmin seed credentials in source.**
   `backend/app/main.py`'s `init_db()` currently seeds a real personal
   account and password in plaintext on every cold start. Replace with: no
   hardcoded seed users in production code at all. Move any demo/seed users
   into `scripts/seed.py`, gated so it never runs automatically in a
   deployed environment, and generate a random password on each seed run
   (printed once to stdout, never committed). Rotate the real credentials
   that were exposed — this should already be in progress independent of
   the code fix.

7. **Delete the tracked SQLite database files from git history**, not just
   from the working tree. A `git rm` + new commit does not remove the
   secrets from history — use `git filter-repo` (preferred) or the BFG
   Repo-Cleaner to purge `aravanta_dev.db` and `backend/aravanta_dev.db`
   from all history, force-push, and treat every credential and TOTP secret
   that was in those files as permanently exposed regardless of the
   history rewrite (rotate them; don't rely on removal for safety).

8. **Consistency check.** `arvgate/schemas.py`'s `UserRegister` already has a
   correct `reject_client_role` validator preventing privilege escalation at
   registration. Audit every other place a role, permission, or scope is
   read from client-controlled input (request body, JWT claims, headers)
   anywhere in the codebase, and apply the same "server assigns, client
   never supplies" rule uniformly. This is the same bug class as items 5
   and 3 above, appearing in different endpoints — fix the pattern, not just
   the three known instances.

**Definition of done for Stage 0:** a fresh clone with a real `SECRET_KEY`
and `DATABASE_URL` set, and no other hardcoded credentials anywhere in
source or git history; `pytest backend/tests` passes including new
regression tests for each of the 6 bypasses above; no endpoint creates or
elevates a user account without going through explicit, authenticated,
server-controlled logic.

## Stage 1 — Close the P1/P2 gaps found in the same audit

Only start this once Stage 0's tests are green.

- Rewrite `README.md` to match the real stack (FastAPI + SQLAlchemy +
  PostgreSQL, the actual service list including `arvai`/`arvoperations`/
  `arvcommunity`), not the stale MongoDB/Motor description.
- Populate `backend/.env.example` with every real required variable
  (`SECRET_KEY`, `DATABASE_URL`, etc.), following the good example already
  set by `docker/.env.example`.
- Decide deliberately (don't default silently) whether JWTs stay in
  `localStorage` or move to an httpOnly cookie; if staying in
  `localStorage`, document the XSS-exposure tradeoff and make sure every
  user-generated-content surface (community posts, etc.) is verified to
  sanitize output.
- Add access-token revocation (a denylist/short-lived-token-plus-refresh
  pattern, or equivalent) so a compromised access token can be invalidated
  before its 24-hour expiry.
- Decide the fate of the dead-code microservices tree at the repo root:
  delete it, or clearly mark it `EXPERIMENTAL/UNUSED` in a top-level README
  so it's never mistaken for the live system's security model again.
- Fix the one stale failing test (`test_user_registration_and_login`) to
  match the now-correct "server assigns role" behavior instead of asserting
  the old, insecure client-supplied-role behavior.
- Sweep `datetime.datetime.utcnow()` → `datetime.now(timezone.utc)`
  repo-wide; migrate Pydantic v1-style `class Config` to `ConfigDict`.
- Label the Terraform/Kubernetes IaC in the repo clearly as target/reference
  architecture, since the live system currently runs entirely on Vercel
  serverless — don't let it imply infrastructure that doesn't exist yet.

**Definition of done for Stage 1:** `README.md`, `.env.example`, and the
actual deployed architecture agree with each other; full test suite green;
no orphaned or misleading documentation about what's actually running.

## Stage 2 — Only now: competitive differentiation and new capability

With the trust and integrity layer fixed, define where Aravanta can
realistically compete — not by matching AWS/Azure/GCP's service breadth, but
by choosing 1–2 areas of genuine differentiation and executing them well.
For each candidate below, require the agent to name the specific target
user, the specific workflow it improves, and what evidence (even informal
usage data) would validate it before committing engineering time:

- **Unified operations surface**: one coherent console for provisioning +
  RBAC + monitoring + incident response, instead of a hyperscaler's
  dozens of disconnected consoles — Aravanta's existing Dashboard, Alerts,
  Incidents, and Automation pages are a real head start here; sharpen this
  rather than diluting it with breadth.
- **Transparent, predictable pricing and FinOps by default** — cost
  attribution and budget alerts built into the core product rather than a
  bolted-on afterthought, which is a common, well-documented pain point with
  hyperscaler billing.
- **Faster time-to-first-value for small teams without dedicated DevOps** —
  opinionated defaults over Terraform-level flexibility, for the segment
  identified as highest-priority in the earlier customer-validation work
  (DevOps/platform engineers and small technical teams).
- **The read-only AI Copilot pattern already built** (`arvai/copilot.py`) —
  this is a genuinely defensible, safety-conscious design choice already in
  the codebase; consider extending it deliberately (e.g., RCA assistance,
  automated runbook suggestions) rather than loosening its read-only
  guarantee for the sake of a flashier demo.

Do not build compute/storage/database primitives that merely re-skin
EC2/S3/RDS with new names — that was explicitly ruled out. Every new service
proposal must state, in one sentence, what a technically literate buyer
would immediately understand as different from assembling
Terraform/Pulumi/native cloud-console tooling themselves; if that sentence
can't be written honestly, don't build the service yet.

## Rules for every stage

- Preserve working functionality (the real Postgres-backed compute/kube/
  storage models, rate limiting, IDOR-safe API keys, the AI Copilot
  guardrail) — these already work and were verified in the audit; don't
  rewrite them without a specific reason tied to a real finding.
- No mock implementations presented as real, no hardcoded
  production-looking data, no new hardcoded secrets or bypass codes of any
  kind, at any stage, for any reason (including "for testing").
- Every fix and every new feature gets an automated test.
- Every change: state **why → what → how → risk → test → result** in the
  PR/commit description, matching the original engineering rigor requested
  for this project.




---------------------------------------------------------------------------------------------

# PHASE 2 — Current Cloud Market Analysis (2026)

A note on framing before the category tables: Phase 1 established that Aravanta's live system is a FastAPI monolith on Vercel serverless with Postgres, with no real cloud-provisioning backend behind any resource type yet — everything (compute, k8s, storage, db) is CRUD over your own database, not orchestration of real infrastructure. That means the honest starting comparison set isn't AWS/Azure/GCP at all — it's **the developer-platform tier: Render, Railway, DigitalOcean, Fly.io** — because that's the tier Aravanta is architecturally closest to today, and it's also a large, active market with a well-documented playbook for competing against hyperscalers without hyperscaler infrastructure. I'll analyze both tiers since the brief asks for AWS/Azure/GCP specifically, but I want that distinction on record rather than implied away.

## Category-by-category analysis

### 1. Compute (VMs / instances)

**What AWS/Azure/GCP do well:** Enormous instance-type breadth — GCP alone offers custom machine types letting you specify exact vCPU/memory rather than fixed tiers, avoiding over-provisioning that AWS/Azure's rigid sizing forces. GCP's Custom Machine Types let architects specify exactly the vCPU and memory they need, preventing the over-provisioning that occurs when forced into rigid, pre-defined instance sizes on AWS and Azure. Committed-use discounts, spot/preemptible pricing, and mature autoscaling are all real, working capabilities at massive scale.

**Weaknesses/complexity:** AWS pricing is granular but complex — the sheer number of line items, from per-GB data transfer to per-request API Gateway costs, makes forecasting difficult. The AWS console, despite improvements, still shows its age — navigating IAM policies, cross-account roles, and service-linked roles requires already knowing what you're looking for, and new engineers often struggle to find basic functions.

**What customers still struggle with:** Idle/over-provisioned non-production compute is a widespread, cross-provider waste pattern — staging, QA, and dev clusters commonly run 24/7 on EKS, AKS, and GKE alike, wasting 65-70% of non-prod compute hours regardless of cloud provider.

**Where smaller providers compete:** DigitalOcean spans from a managed app platform down to raw virtual servers within one product line, giving more control and more predictable economics as workloads grow, while Railway trades that control for usage-based pricing and dramatically faster time-to-running-app.

**Where Aravanta can differentiate:** Not on instance breadth (unwinnable) — on **default-safe scheduling** (auto-suspend for non-prod compute after inactivity, on by default, not an opt-in cost-saving feature buried in a FinOps dashboard) and **transparent, single-number pricing** per workload rather than line-item billing.

**What should NOT be built:** A competing global compute fleet, custom silicon, or an instance-type catalog trying to match AWS's hundreds of types. Economically irrational at this stage and doesn't address the actual pain (the pain is forecasting/waste, not selection breadth).

---

### 2. Containers & Kubernetes

**What they do well:** EKS/AKS/GKE are mature, deeply integrated with each provider's IAM/networking/storage stack, and are the de facto standard — enormous ecosystem and hiring pool.

**Weaknesses:** Kubernetes complexity itself is the recurring complaint across every source reviewed — not a hyperscaler-specific flaw but one hyperscalers have not solved, because more managed K8s doesn't remove the YAML/CRD/networking complexity underneath. Storage class defaults matter in practice — GKE deployments don't default to the cheaper Hyperdisk Balanced option even where it exists; teams get the pricier Persistent Disk SSD by default and pay the higher rate until they specifically switch. That's a "the platform's default costs you money unless you know to change it" pattern — a real, common failure mode.

**Where smaller providers compete:** Explicitly by not offering Kubernetes at all — providers like DeployBase deliberately exclude Kubernetes complexity and GPU tiers, focusing on what the large majority of web projects actually need instead. This is a legitimate, evidenced strategy: the market segment that finds Kubernetes itself to be the problem, not the specific vendor's flavor of it.

**Where Aravanta can differentiate:** A container/deployment experience where Kubernetes is available as an escape hatch but never the default surface a small team has to touch — closer to Railway/Render's git-push model layered over your existing container primitives, rather than exposing raw cluster management as the primary UX (which Phase 1 found ACOS's "Kubernetes" page currently does).

**What should NOT be built:** A custom container orchestrator to replace Kubernetes. Irrational — Kubernetes' ecosystem gravity is the actual moat here, and reinventing scheduling/networking primitives that Kubernetes already solved is pure risk with no differentiation upside.

---

### 3. Object/Block/File Storage

**What they do well:** Durability guarantees, tiering (hot/cool/archive), global replication options, deep integration with compute/CDN.

**Weaknesses:** Storage costs carry hidden complexity — storing a gigabyte might look cheap, but retrieving it, moving it between regions, or making millions of API calls against it can produce exorbitant fees. This "the sticker price isn't the real price" pattern repeats across every category researched.

**Where Aravanta can differentiate:** All-in pricing per GB that includes a reasonable request/egress allowance by default, disclosed on one line — directly targeting the "hidden fee" pattern above, which is a documented, repeated pain point rather than an assumption.

**What should NOT be built:** Custom storage hardware/erasure-coding infrastructure. Aravanta should use an existing S3-compatible backend (as it already does via Supabase Storage per Phase 1) and differentiate on pricing clarity and access patterns, not on storage engineering.

---

### 4. Databases

**What they do well:** Managed relational/NoSQL breadth, automated failover, point-in-time recovery, read replicas at scale (Aurora, Cosmos DB, Spanner).

**Weaknesses/what customers struggle with:** Right-sizing for non-production databases is a real, quantified waste pattern — a lightly-loaded staging database on Azure's burstable Standard_B2ms costs $46/month versus $105 on AWS RDS for a comparable workload, and most teams never discover the cheaper burstable tier because the provider doesn't lead with it. Discoverability of the cost-efficient option is the actual failure, not absence of the option.

**Where Aravanta can differentiate:** Environment-aware defaults — a database explicitly marked "staging" or "dev" should default to the cheapest viable tier automatically, not require the customer to discover a burstable SKU buried in documentation.

**What should NOT be built:** A new database engine. Wrap Postgres (already the correct choice per Phase 1) with better environment-aware provisioning defaults, not a competing DB technology.

---

### 5. Networking, CDN/Edge, DNS

**What they do well:** Global backbone networks, mature VPC/peering/private-link primitives, large edge POP footprints.

**Weaknesses:** Egress pricing remains the single most-cited "hidden cost" across every source reviewed. Cross-AZ data transfer is charged, cross-region transfer is expensive, and internet egress starts around nine cents per GB on AWS. One architect reported presenting a CFO with a bill breakdown showing 23% of total AWS spend was data transfer alone — cost that a different architecture would have largely eliminated.

**Where Aravanta can differentiate:** Bundled, predictable egress (a flat allowance included per plan tier, overage billed simply) — this is the single most repeated, most quantifiable pain point in the research and a legitimate wedge, not a vague claim.

**What should NOT be built:** A competing global backbone or edge network. Economically impossible at this stage; use existing CDN infrastructure (as already done via Vercel's edge network) and differentiate purely on pricing transparency layered on top.

---

### 6. IAM, Secrets Management, Security

**What they do well:** Fine-grained policy engines, federated identity, hardware-backed key management (KMS/HSM-backed), mature audit trails at scale.

**Weaknesses/what customers struggle with:** Navigating IAM policies, cross-account roles, and service-linked roles in the console requires knowing what you're looking for; new engineers often struggle to find basic functions. This is a well-documented, chronic hyperscaler UX failure, not a capability gap — the primitives are powerful but the interface for reasoning about "who can do what" is genuinely hard to use even for experienced practitioners.

**Where Aravanta can differentiate:** This is a real opportunity, but Phase 1 is directly relevant here — the audit found the actual RBAC implementation has serious, live gaps (hardcoded MFA bypass codes, a password-reset flow with no real verification, JWT-driven auto-provisioning that trusts unverified role claims). **Aravanta cannot credibly market "simpler, more trustworthy IAM than AWS" as a differentiator until the Phase 1 P0 findings are fixed** — right now the claim would be false on its own platform. This is the single clearest case in this whole analysis where the strategic differentiation and the current engineering reality are in direct conflict.

**What should NOT be built:** A competing HSM/hardware key-management service. Use a managed KMS provider under the hood; differentiate on making the *permission model itself* legible (plain-language "who can do X" views) rather than reimplementing cryptographic infrastructure.

---

### 7. Observability (Monitoring, Logging, Alerting)

**What they do well:** Deep integration with every native service, long retention options, mature query languages (CloudWatch Insights, Azure Monitor KQL, Cloud Logging).

**Weaknesses:** Steep learning curves for query languages; alert fatigue from poorly-tuned defaults; cost of log ingestion/retention scales unpredictably and is a frequently-cited billing surprise category alongside egress and storage API calls.

**Where Aravanta can differentiate:** Sensible, pre-tuned alert defaults per resource type rather than empty dashboards the customer must configure from zero — genuinely achievable at Aravanta's scale and directly addresses "time to useful signal," which is where hyperscaler observability tools are weakest for small teams.

**What should NOT be built:** A custom time-series database or log-storage engine. Use existing infrastructure (Prometheus/Loki, which Phase 1 confirmed are already present in the `monitoring/` directory) rather than building storage engines from scratch.

---

### 8. FinOps / Billing / Cost Transparency

**What they do well:** Detailed cost breakdowns exist (Cost Explorer, Azure Cost Management, GCP Billing) once you know where to look and how to read them.

**Weaknesses — this is the single strongest, most consistently evidenced differentiation opportunity in the entire analysis:** AWS's pricing is famously complex, with 240+ service options, 38+ regions, hundreds of instance types, and numerous discount programs layered on top. GCP offers one of the most generous always-free tiers, while AWS offers the most flexibility but costs can increase quickly without careful management. Cloud pricing is intentionally complex — every provider's pricing calculator will claim to be the cheapest, and each is technically correct depending on which specific configuration is chosen. The recurring theme across nearly every source: **waste isn't a pricing-model problem, it's a defaults-and-visibility problem** — the fix for idle non-production compute, over-provisioned staging environments, and mismatched reservations is to right-size commitments to actual baseline usage, and the provider you're on matters less than fixing these three patterns; switching providers alone does not eliminate five- or six-figure annual waste from these patterns.

**Where Aravanta can differentiate:** This is the strongest, most evidence-backed differentiation angle available — not "cheaper than AWS" (unverifiable, and explicitly forbidden by your own accuracy rules from the prior report) but **"you cannot accidentally waste money on Aravanta the way you can on AWS/Azure/GCP,"** via non-prod auto-suspend, right-sized defaults, and bundled egress, all on by default rather than opt-in features requiring discovery.

**What should NOT be claimed:** Any "cheaper than AWS" statement without a real, apples-to-apples benchmark run and published. The pricing research above shows even domain experts qualify every comparison ("depends on configuration") — a categorical claim would be both false-in-general and easy for a technical buyer to disprove.

---

### 9. Developer Experience / CI/CD / Multi-cloud / Edge

**What they do well:** AWS/Azure/GCP have mature CI/CD integrations (CodePipeline, Azure DevOps, Cloud Build) and huge ecosystems of pre-built integrations.

**Weaknesses/where smaller providers win outright:** This is the most directly relevant comparison set for Aravanta's actual current scale. Render provides a developer-focused PaaS for simplified DevOps deployment at scale, and options like AWS Elastic Beanstalk, Google Cloud Run, Vercel, Heroku, Netlify, Fly.io, and Railway all compete specifically on CI/CD simplicity rather than infrastructure breadth. Render and Railway are the two most common "I just want to ship my app without learning AWS" platforms in 2026 — both Heroku-spiritual-successors built around git-push deploys, managed databases, and simple billing. Railway is centered on fast setup, Git-based workflows, and usage-based billing; it builds from source with no Dockerfile required, giving a short path from repo to running service, and its main strength is developer experience — making it easy to ship a first app.

**Where Aravanta can realistically compete:** This is the honest, evidence-backed competitive tier for Aravanta right now — not AWS/Azure/GCP, but Render/Railway/DigitalOcean/Fly.io. That's not a smaller ambition, it's a real, actively-growing market where Railway alone raised a $100M Series B in January 2026 — proving venture-scale outcomes exist in this exact tier without needing to match hyperscaler infrastructure breadth.

**What should NOT be built:** Trying to out-integrate AWS's CI/CD ecosystem breadth. Irrational at this stage — win on deploy-to-running speed and configuration ergonomics instead, which is a fair fight against Railway/Render rather than an unfair one against AWS.

---

### 10. Multi-cloud / Hybrid / Vendor Lock-in

**What they do well:** Azure Arc extends single-control-plane management to hybrid and multi-cloud resources, and roughly 75% of enterprises now run a multi-cloud strategy — AWS for breadth, Azure for enterprise integrations, GCP for analytics — accepting the added operational complexity in exchange for eliminating vendor lock-in and picking each provider's genuine strength.

**Weaknesses:** Multi-cloud is explicitly described as a complexity/lock-in tradeoff, not a solved problem — nobody has made multi-cloud simple, hyperscalers included.

**Where Aravanta can differentiate:** A genuinely unified control plane across a customer's *existing* AWS/GCP/DO accounts (governance/RBAC/visibility layer, not a replacement infrastructure layer) is a defensible, differentiated position — but this is a Phase 4+ architecture decision, not something to claim before it exists.

**What should NOT be built:** A proprietary abstraction layer that tries to fully hide provider differences — this has been attempted repeatedly in the industry (various now-defunct or pivoted "cloud abstraction" startups) and consistently fails because the leaky abstraction becomes its own maintenance burden exceeding the value of hiding it.

---

## Summary table: what AWS/Azure/GCP do well vs. where the real opening is

| Category | Hyperscaler strength | Customer pain (evidenced) | Aravanta's realistic angle |
|---|---|---|---|
| Compute | Instance breadth, custom sizing (GCP) | Idle/over-provisioned non-prod compute, 65-70% waste | Default auto-suspend, not opt-in |
| Kubernetes | Deep ecosystem integration | K8s complexity itself; unsafe cost defaults (storage class) | Optional, not primary UX surface |
| Storage | Durability, tiering | Hidden request/egress fees | Simple, all-in per-GB pricing |
| Databases | Managed breadth, failover | Discoverability of cheap dev/staging tiers | Environment-aware default sizing |
| Networking/Egress | Global backbone | Egress = biggest cited "surprise bill" category | Bundled egress allowance |
| IAM/Security | Fine-grained, federated | Console/policy UX genuinely hard to reason about | Legible permissions — **blocked until Phase 1 P0s fixed** |
| Observability | Deep native integration | Steep query languages, alert fatigue | Pre-tuned sane defaults |
| FinOps | Detailed line-item data exists | Waste is a *defaults* problem, not a pricing-model problem | "Hard to waste money by default," not "cheaper" |
| Dev Experience | Broad ecosystem | Console complexity, learning curve | Compete against Railway/Render tier, honestly |
| Multi-cloud | Arc/cross-cloud tooling exists | Still complex; not actually solved by anyone | Governance/visibility layer, long-term only |



