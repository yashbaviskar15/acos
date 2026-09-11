# Runbook: Cloud Cost Spikes & Resource Underutilization

## Severity: Warning
**Target Components**: ArvBilling FinOps Engine, ArvCompute, ArvStore
**Trigger**: Daily accrued spend > 25% above 7-day rolling average

---

## 1. Identify Cost Anomaly Vector
Query ArvBilling breakdown by service type:
1. **Unattached NVMe Block Storage Volumes**:
   - Check for orphaned block storage volumes left after VM terminations.
2. **Cross-AZ Network Egress**:
   - Check eBPF network telemetry for cross-region data transfers.
3. **Over-Provisioned Kubernetes Node Pools**:
   - Identify nodes with < 15% average CPU/memory utilization over 48 hours.

---

## 2. Corrective Actions
- Run automated node compaction to drain low-density nodes and trigger Cluster Autoscaler scale-down.
- Enable S3 Infrequent Access (IA) lifecycle policies for storage buckets with objects unaccessed for > 30 days.
- Set budget alerts with webhook notifications to Slack / PagerDuty.
