# Feature Catalog

Comprehensive list of all features in Aravanta CloudOS.

## Operations Console

### Dashboard (Fleet SRE Console)
Real-time operations overview displaying fleet health metrics (total services, healthy count, firing alerts, active incidents), time-series CPU/RAM charts, firing alerts queue with severity indicators, active incidents banner, and recent deployments feed.

### Infrastructure Management
Multi-cloud resource inventory with filtering by environment (production/staging/dev), resource type (Compute VM, Kubernetes Cluster, Managed Database, Object Storage, Microservice), and status. Lifecycle actions include rolling restart, stop, and decommission with confirmation modals. Tag-based search and resource detail inspection drawer.

### Application Management
Microservices catalog displaying per-service health metrics (replicas, P95 latency, error rate, throughput). Actions: horizontal scaling via replica slider (0-10 pods), version deployment with strategy selection, rolling restart, and emergency rollback. 5-tab detail view: Overview, Telemetry, Live Logs, Cluster Events, Configuration.

### Deployment Pipeline
GitOps-style deployment workflow with version tagging, container image selection, and strategy picker (RollingUpdate, Canary 25%, BlueGreen). Execution timeline tracks stages: Build, Test, Security Scan, Canary Verification, Full Rollout. 1-click emergency rollback to previous stable version. Deployment history with status, duration, and initiator tracking.

### Container Management
Kubernetes pod fleet table with per-pod CPU (millicores) and RAM (MB) utilization. Live stdout/stderr log stream viewer. Container lifecycle actions: restart and stop. Pod status indicators with uptime tracking.

## Observability

### Monitoring Hub
Multi-resolution time-series telemetry with configurable ranges (5m, 15m, 1h, 6h, 24h, 7d). Charts: CPU/RAM/Disk I/O saturation (AreaChart), HTTP request volume (BarChart), P95 latency and error rate (LineChart). KPI gauges for fleet CPU load, RAM allocation, P95 latency, and network throughput.

### Log Explorer
Real-time log stream with severity filtering (INFO, WARN, ERROR, DEBUG). Service selector for targeted log viewing. Full-text search. Per-line copy to clipboard. JSON bulk export for external analysis. Auto-refresh with pause/resume toggle (4-second polling). Terminal-style dark viewer.

### Alertmanager
Alert triage center with severity and status filtering. Actions: acknowledge (assign to on-call), mute for 2 hours (silence), resolve (close). KPI stats: total firing, critical P1/P2, acknowledged, and resolved in 24h with MTTR.

### Incident Command Center
Full incident lifecycle management: Detected, Investigating, Mitigating, Resolved. War-room drawer with event timeline and timestamp poster. RCA (Root Cause Analysis) notes field. Severity classification. Incident creation and status transition controls.

## Automation and Reliability

### Automation Runbooks
Self-healing operational playbooks with multi-step execution pipelines. "Run Now" manual trigger. Execution history with run count and duration tracking. Toil reduction metrics. Supports scheduled (cron) and event-driven triggers.

### Backup and Disaster Recovery
Snapshot inventory with retention policies and cross-region support. 1-click restore workflow. Backup verification status. Size and creation timestamp tracking.

### CI/CD Pipelines
Pipeline visualization with stage tracking. Container artifact release management.

## Cloud Resources

### Compute VMs
Virtual machine provisioning and management (EC2/GCE equivalent). Instance type selection, start/stop/terminate lifecycle.

### Managed Kubernetes
Kubernetes cluster management (EKS/GKE equivalent). Node pool configuration, cluster scaling, version upgrades.

### Managed Databases
Database engine provisioning (Postgres, Redis, MySQL). Connection string management, backup scheduling, scaling.

### Object Storage
S3-compatible bucket management. File upload/download, access control, storage metrics.

## Governance

### Security and RBAC
4-tier role-based access control matrix: Admin (SuperAdmin), Operator (SRE), Developer, Viewer (Auditor). Permissions enforced across 6 operational domains: Infrastructure, Deployments, Observability, Logs, Automation, Security/IAM. Active session management with token revocation. Zero-trust enforcement indicators.

### Audit Logs
Tamper-evident immutable audit trail. Each entry records: timestamp, actor (user email), action type, target resource, IP address, and details. JSON export for external SIEM integration. SOC2 Type II / ISO 27001 compliance retention (365 days).

### Billing and FinOps
Cost analytics dashboard with INR pricing. Resource cost breakdown by service, environment, and team.

## Platform Features

### Command Palette
Keyboard-driven navigation (Ctrl+K) across all 20+ pages. Fuzzy search by page name, feature, or action.

### Responsive Design
Mobile-first layout with breakpoints for phones, tablets, and desktops. Collapsible sidebar with backdrop overlay on mobile.

### Dark / Light Mode
System-aware theme with manual toggle. Consistent color palette across all components.

### Landing Page
Public-facing marketing page with service tabs, pricing tiers (INR), FAQ accordion, cookie consent, and floating sales chat widget.
