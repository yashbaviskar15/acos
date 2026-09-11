# Runbook: Database Connection Pool Saturation & Query Latency

## Severity: Critical
**Target Components**: ArvDB (PostgreSQL 16, MySQL 8, Redis 7)
**Alert Trigger**: Database active connections > 85% of `max_connections` (`alert-db-pool-sat`)

---

## 1. Symptom Verification
- Applications receiving `FATAL: remaining connection slots are reserved for non-replication superuser connections` or `ConnectionTimeoutError`.
- ArvDB connection metric shows:
  ```promql
  sum(pg_stat_activity_count) by (instance) / sum(pg_settings_max_connections) * 100 > 85
  ```

---

## 2. Root Cause Identification
1. **Query Active Connections by Client State**:
   ```sql
   SELECT client_addr, state, count(*)
   FROM pg_stat_activity
   WHERE datname = 'aravanta_core_db'
   GROUP BY client_addr, state;
   ```
2. **Detect Long-Running Idle-in-Transaction Queries**:
   ```sql
   SELECT pid, now() - query_start AS duration, query, state
   FROM pg_stat_activity
   WHERE state = 'idle in transaction' AND now() - query_start > interval '30 seconds';
   ```
3. **Check Connection Leaks from Microservices**:
   - Identify which pod/service failed to release connections back to the HikariCP / SQLAlchemy pool.

---

## 3. Immediate Remediation
1. **Terminate Stalled Queries**:
   ```sql
   SELECT pg_terminate_backend(pid)
   FROM pg_stat_activity
   WHERE state = 'idle in transaction' AND now() - query_start > interval '60 seconds';
   ```
2. **Scale PgBouncer / Connection Pooler**:
   - Route traffic through the built-in ArvDB connection pooling proxy to multiplex client connections.
3. **Increase Pool Capacity**:
   - For persistent workloads, adjust `max_connections` and trigger Patroni rolling restart without downtime.
