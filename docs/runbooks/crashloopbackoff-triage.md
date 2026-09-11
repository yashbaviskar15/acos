# Runbook: Pod CrashLoopBackOff Triage & Recovery

## Severity: Critical
**Target Components**: ArvKube Managed Kubernetes Clusters
**Alert Trigger**: Pod restarts > 5 within 10 minutes (`alert-pod-crashloop`)

---

## 1. Triage Workflow
1. **Locate the Failing Pods**:
   ```bash
   kubectl get pods -n production --field-selector=status.phase!=Running
   ```
2. **Inspect Container Termination Reason**:
   ```bash
   kubectl describe pod <pod-name> -n production
   ```
   Check the `Last State` section for:
   - `Exit Code 137`: **OOMKilled** (Memory limit exceeded)
   - `Exit Code 1`: **Application Exception** (Unhandled exception / syntax error)
   - `Exit Code 0`: Completed prematurely without daemon loop
   - `Exit Code 126 / 127`: Entrypoint binary not found or permission denied

---

## 2. Inspect Logs in Loki / Stdout
```bash
kubectl logs <pod-name> -n production --previous --tail=100
```
Look for database connection failures, missing environment variables (e.g. `DATABASE_URL`, `JWT_SECRET`), or Vault secret decryption errors.

---

## 3. Remediation Actions
- **If OOMKilled**: Bump memory request and limit in deployment manifest:
  ```yaml
  resources:
    limits:
      memory: "2Gi"
    requests:
      memory: "1Gi"
  ```
- **If Configuration Failure**: Verify ConfigMap and Secret bindings in the namespace.
- **If Bad Release Deployment**: Execute instant rollback via ArvCICD Canary Engine:
  ```bash
  arv cicd rollback app-api-gateway --target=previous
  ```
