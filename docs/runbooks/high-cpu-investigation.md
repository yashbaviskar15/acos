# Runbook: High CPU Utilization on Compute Instances & Workloads

## Severity: Warning / Critical
**Target Components**: ArvCompute VM Instances, Kubernetes Node Pools, Application Pods
**Alert Trigger**: CPU utilization > 85% sustained for 5+ minutes (`alert-cpu-web-prod`)

---

## 1. Initial Assessment
1. Determine the scope of the CPU saturation:
   - Single VM instance vs. cluster-wide node degradation.
   - Specific user workload vs. control-plane container.
2. Check real-time telemetry via **ArvWatch** or execute Prometheus query:
   ```promql
   sum(rate(node_cpu_seconds_total{mode!="idle"}[5m])) by (instance) * 100
   ```

---

## 2. Diagnostic Steps
1. **Identify Top Processes via eBPF / SSH**:
   - For VM instances, inspect process CPU consumption:
     ```bash
     ps aux --sort=-%cpu | head -n 10
     ```
   - For Kubernetes pods:
     ```bash
     kubectl top pods -n default --sort-by=cpu
     ```
2. **Check for Request Spikes**:
   - Correlate CPU jump with ingress traffic using Loki:
     ```logql
     rate({app="api-gateway"} |= "HTTP" [1m])
     ```
3. **Inspect Thread Dump / Event Loop**:
   - Check if an unindexed database query or recursive loop is blocking runtime threads.

---

## 3. Mitigation & Remediation
- **Autoscaling (HPA)**: If traffic is legitimate, scale replicas via ArvKube:
  ```bash
  arv kube scale deployment/order-service --replicas=6
  ```
- **Live VM Resize**: With ArvCompute live resize (zero downtime), increase vCPU cores:
  ```bash
  arv compute resize vm-web-prod-01 --cpu=8 --ram=32GB
  ```
- **Traffic Throttling**: Apply rate-limiting at ArvEdge CDN if malicious DDOS pattern is detected.
