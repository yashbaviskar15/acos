# Runbook: Automated Canary Gate & Emergency Rollback

## Severity: High / Critical
**Target Components**: ArvCICD GitOps Delivery Engine, Envoy Service Mesh
**Alert Trigger**: Canary traffic error rate > 1.0% or P95 latency > 250ms (`alert-deploy-rollback`)

---

## 1. Canary Gate Safety Mechanism
- When a new deployment is initiated, ArvCICD shifts **25% of ingress traffic** to the candidate canary pods.
- The canary gate continuously samples SLO health metrics:
  - `HTTP 5xx error rate < 0.05%`
  - `P95 latency degradation < 15%`
  - `Zero crashloop backoffs`

---

## 2. Automatic Rollback Trigger
If any SLO metric breaches the canary gate threshold for **30 consecutive seconds**:
1. Envoy service mesh instantly reroutes 100% of user traffic back to the stable baseline deployment.
2. Total traffic shift completes in **1.2 seconds**.
3. Canary pods are drained and isolated for forensic diagnostic inspection.

---

## 3. Manual Rollback Override
To trigger an immediate manual rollback from the CLI or War-Room Console:
```bash
arv cicd rollback <application-id> --force --reason="Production P95 latency spike"
```
Verify state:
```bash
arv cicd status <application-id>
```
All rollback actions are cryptographically logged to the **365-day immutable audit trail**.
