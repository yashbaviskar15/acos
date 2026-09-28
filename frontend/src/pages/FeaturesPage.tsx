import React, { useState, useMemo, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Server,
  Boxes,
  Zap,
  Terminal,
  GitBranch,
  HardDrive,
  Database,
  RefreshCw,
  Network,
  Share2,
  Globe2,
  Radio,
  Shield,
  Lock,
  CheckCircle2,
  Activity,
  Sliders,
  CreditCard,
  Search,
  Copy,
  ArrowRight,
  ChevronRight,
  Check,
  FileText,
  Rocket,
  Layers,
} from 'lucide-react';

import { Navbar, LandingView } from '../components/ui/Navbar';
import { Footer } from '../components/ui/Footer';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Breadcrumbs } from '../components/ui/Breadcrumbs';

interface PageProps {
  onGoToLogin: () => void;
  onGoToRegister: () => void;
  onOpenCommandPalette?: () => void;
  onNavigate?: (view: LandingView) => void;
}

type ServiceCategory = 'all' | 'compute' | 'storage' | 'network' | 'security' | 'sre';

interface ServiceDefinition {
  id: string;
  category: 'compute' | 'storage' | 'network' | 'security' | 'sre';
  categoryLabel: string;
  name: string;
  title: string;
  subtitle: string;
  icon: React.ComponentType<{ className?: string }>;
  tone: 'gold' | 'emerald' | 'sky' | 'violet' | 'rose' | 'amber';
  pricing: string;
  statusBadge: string;
  features: { name: string; detail: string }[];
  snippets: {
    cli: string;
    terraform: string;
    rest: string;
    sdk: string;
  };
}

const servicesData: ServiceDefinition[] = [
  {
    id: 'compute',
    category: 'compute',
    categoryLabel: 'Compute & Serverless',
    name: 'ArvCompute',
    title: 'Elastic Virtual Machines & Bare Metal',
    subtitle: 'High-performance cloud compute with configurable shapes, local NVMe, and live resize',
    icon: Server,
    tone: 'gold',
    pricing: '₹1.50 / vCPU-hr',
    statusBadge: 'GA • Multi-Zone',
    features: [
      { name: 'AMD EPYC & ARM Neoverse', detail: '80+ instance shapes ranging from 1 shared vCPU to 224 dedicated cores' },
      { name: 'Live vertical resize', detail: 'Adjust vCPU and RAM allocations dynamically without unmounting storage volumes' },
      { name: 'NVMe scratch disk attachments', detail: 'Sub-millisecond latency local NVMe drives offering up to 800,000 IOPS' },
      { name: 'Preemptible & spot pools', detail: 'Save up to 72% on batch workloads with graceful 60-second shutdown hooks' },
    ],
    snippets: {
      cli: `arv compute create \\
  --name api-worker-01 \\
  --shape c3.2xlarge \\
  --region ap-south-1 \\
  --disk 100GB-nvme`,
      terraform: `resource "aravanta_compute_instance" "worker" {
  name          = "api-worker-01"
  instance_type = "c3.2xlarge"
  region        = "ap-south-1"
  disk {
    size_gb = 100
    type    = "nvme-ssd"
  }
}`,
      rest: `curl -X POST "https://arv-backend.vercel.app/api/v1/compute/instances" \\
  -H "Authorization: Bearer $ARAVANTA_TOKEN" \\
  -H "Content-Type: application/json" \\
  -d '{"name":"api-worker-01","instance_type":"c3.2xlarge","region":"ap-south-1"}'`,
      sdk: `import { AravantaClient } from '@aravanta/sdk';
const arv = new AravantaClient({ token: process.env.ARV_TOKEN });
await arv.compute.create({ name: 'api-worker-01', shape: 'c3.2xlarge', region: 'ap-south-1' });`,
    },
  },
  {
    id: 'k8s',
    category: 'compute',
    categoryLabel: 'Compute & Serverless',
    name: 'ArvKube',
    title: 'Managed Kubernetes Engine (v1.27–1.30)',
    subtitle: 'Enterprise Kubernetes clusters with self-healing 3-node control planes & eBPF networking',
    icon: Boxes,
    tone: 'emerald',
    pricing: '₹4.00 / cluster-hr',
    statusBadge: 'SLA 99.99%',
    features: [
      { name: 'Automated HA control plane', detail: '3-node etcd cluster with automated backup snapshots and self-healing recovery' },
      { name: 'Calico eBPF networking', detail: 'Sub-millisecond service mesh with strict zero-trust NetworkPolicy enforcement' },
      { name: 'HPA + VPA + KEDA scaling', detail: 'Event-driven autoscaling from 0 to 1,000 pods within 12 seconds' },
      { name: 'Integrated OCI container registry', detail: 'Zero-egress image pulling with built-in Clair vulnerability scanning on push' },
    ],
    snippets: {
      cli: `arv kube cluster create \\
  --name prod-cluster-01 \\
  --version 1.30 \\
  --node-count 3 \\
  --cni calico-ebpf`,
      terraform: `resource "aravanta_kubernetes_cluster" "prod" {
  name        = "prod-cluster-01"
  k8s_version = "1.30"
  node_count  = 3
  region      = "ap-south-1"
}`,
      rest: `curl -X POST "https://arv-backend.vercel.app/api/v1/kubernetes/clusters" \\
  -H "Authorization: Bearer $ARAVANTA_TOKEN" \\
  -d '{"name":"prod-cluster-01","version":"1.30","node_count":3}'`,
      sdk: `const cluster = await arv.k8s.clusters.create({
  name: 'prod-cluster-01',
  version: '1.30',
  nodeCount: 3,
});`,
    },
  },
  {
    id: 'functions',
    category: 'compute',
    categoryLabel: 'Compute & Serverless',
    name: 'ArvFunctions',
    title: 'Serverless Event-Driven Functions',
    subtitle: 'Sub-millisecond cold start serverless compute triggered by HTTP, S3 mutations, and events',
    icon: Zap,
    tone: 'amber',
    pricing: '1M calls free / mo',
    statusBadge: 'Fast Cold-Start',
    features: [
      { name: 'Sub-ms cold starts', detail: 'Pre-warmed micro-VM isolate execution engine supporting Python, Node.js, and Go' },
      { name: 'Native ArvStore & Event triggers', detail: 'Trigger function runs directly on S3 file uploads, table mutations, or queue events' },
      { name: 'Hardware secret bindings', detail: 'Inject secrets securely from ArvVault into runtime memory with zero disk persistence' },
      { name: 'Concurrency auto-scaling', detail: 'Scale instantly from zero to 10,000 concurrent executions with zero provisioning delay' },
    ],
    snippets: {
      cli: `arv functions deploy \\
  --name image-resizer \\
  --runtime python3.11 \\
  --entrypoint main.handler \\
  --memory 512MB`,
      terraform: `resource "aravanta_serverless_function" "resizer" {
  name       = "image-resizer"
  runtime    = "python3.11"
  handler    = "main.handler"
  memory_mb  = 512
}`,
      rest: `curl -X POST "https://arv-backend.vercel.app/api/v1/functions" \\
  -H "Authorization: Bearer $ARAVANTA_TOKEN" \\
  -d '{"name":"image-resizer","runtime":"python3.11","handler":"main.handler"}'`,
      sdk: `await arv.functions.deploy({
  name: 'image-resizer',
  runtime: 'python3.11',
  sourcePath: './dist',
});`,
    },
  },
  {
    id: 'sandbox',
    category: 'compute',
    categoryLabel: 'Compute & Serverless',
    name: 'ArvSandbox',
    title: 'Ephemeral Micro-VM Environments',
    subtitle: 'Isolated on-demand cloud sandboxes for automated pull request previews and security tests',
    icon: Terminal,
    tone: 'sky',
    pricing: '₹0.75 / hr-sandbox',
    statusBadge: '< 800ms Boot',
    features: [
      { name: 'Sub-second instantiation', detail: 'Kernel-level Firecracker micro-VM provisioning initialized in under 800ms' },
      { name: 'Automatic PR lifecycle binding', detail: 'Spins up preview URLs for GitHub/GitLab PRs and tears down automatically upon merge' },
      { name: 'Air-gapped security boundary', detail: 'Strict cgroups v2 resource capping and isolated software-defined network namespaces' },
      { name: 'Deterministic snapshots', detail: 'Save running sandbox memory states to warm storage and resume instantly anywhere' },
    ],
    snippets: {
      cli: `arv sandbox spawn \\
  --template nodejs-e2e \\
  --ttl 30m \\
  --git-ref pr-412`,
      terraform: `resource "aravanta_sandbox_environment" "preview" {
  template = "nodejs-e2e"
  ttl_mins = 30
  git_ref  = "refs/pull/412/head"
}`,
      rest: `curl -X POST "https://arv-backend.vercel.app/api/v1/sandbox/spawn" \\
  -H "Authorization: Bearer $ARAVANTA_TOKEN" \\
  -d '{"template":"nodejs-e2e","ttl_minutes":30}'`,
      sdk: `const sandbox = await arv.sandbox.spawn({
  template: 'nodejs-e2e',
  ttlMinutes: 30,
});`,
    },
  },
  {
    id: 'cicd',
    category: 'compute',
    categoryLabel: 'Compute & Serverless',
    name: 'GitOps CI/CD',
    title: 'Automated Canary Rollout Engine',
    subtitle: 'Progressive traffic shifting with automated synthetic health gates & 1-click rollback',
    icon: GitBranch,
    tone: 'violet',
    pricing: '₹0.25 / build-min',
    statusBadge: '1.2s Rollback',
    features: [
      { name: 'Progressive canary traffic gates', detail: 'Slice traffic safely at 25%, 50%, and 100% intervals with automated anomaly checks' },
      { name: 'Sub-1.2s instant rollbacks', detail: 'Immediate reversion to previous healthy release state upon any SLO error spike' },
      { name: 'Dual architecture runners', detail: 'Parallel high-throughput build matrix on native AMD64 and ARM64 bare-metal runners' },
      { name: 'Cryptographic release attestations', detail: 'Sign container images with Sigstore Cosign before promotion to production' },
    ],
    snippets: {
      cli: `arv cicd rollout \\
  --app web-frontend \\
  --version v2.4.0 \\
  --strategy canary \\
  --canary-weight 25`,
      terraform: `resource "aravanta_deployment_pipeline" "canary" {
  app_name = "web-frontend"
  strategy = "canary"
  slices   = [25, 50, 100]
}`,
      rest: `curl -X POST "https://arv-backend.vercel.app/api/v1/cicd/deploy" \\
  -H "Authorization: Bearer $ARAVANTA_TOKEN" \\
  -d '{"app":"web-frontend","tag":"v2.4.0","strategy":"canary"}'`,
      sdk: `await arv.cicd.triggerRollout({
  app: 'web-frontend',
  tag: 'v2.4.0',
  strategy: 'canary',
});`,
    },
  },
  {
    id: 'storage',
    category: 'storage',
    categoryLabel: 'Storage & Databases',
    name: 'ArvStore',
    title: 'S3-Compatible Object Storage',
    subtitle: 'Distributed object storage with lifecycle tiering, WORM retention, and web file management',
    icon: HardDrive,
    tone: 'sky',
    pricing: '₹0.0014 / GB-hr',
    statusBadge: 'S3 API Compatible',
    features: [
      { name: 'S3 API compatibility', detail: 'Plug and play with AWS CLI, Boto3, MinIO Client, Terraform, and s5cmd utilities' },
      { name: 'Lifecycle automated tiering', detail: 'Transition aging objects seamlessly from Standard to Infrequent and Glacier Archive' },
      { name: 'Object Lock & WORM compliance', detail: 'Tamper-evident legal hold retention adhering to RBI and SEBI compliance guidelines' },
      { name: 'Web explorer & folder prefixes', detail: 'Full file manager with drag-and-drop uploads, folder prefixing, and signed download URLs' },
    ],
    snippets: {
      cli: `arv store bucket create \\
  --name arv-media-assets \\
  --region ap-south-1 \\
  --tier standard \\
  --versioning true`,
      terraform: `resource "aravanta_storage_bucket" "assets" {
  name          = "arv-media-assets"
  storage_class = "STANDARD"
  versioning    = true
  region        = "ap-south-1"
}`,
      rest: `curl -X POST "https://arv-backend.vercel.app/api/v1/storage/buckets" \\
  -H "Authorization: Bearer $ARAVANTA_TOKEN" \\
  -d '{"name":"arv-media-assets","tier":"standard","versioning":true}'`,
      sdk: `await arv.storage.buckets.create({
  name: 'arv-media-assets',
  versioning: true,
  region: 'ap-south-1',
});`,
    },
  },
  {
    id: 'database',
    category: 'storage',
    categoryLabel: 'Storage & Databases',
    name: 'ArvDB',
    title: 'Managed PostgreSQL, Redis & MySQL',
    subtitle: 'High-availability database clusters with automated failover, PITR, and pgvector extension',
    icon: Database,
    tone: 'violet',
    pricing: '₹3.00 / instance-hr',
    statusBadge: 'Patroni HA Failover',
    features: [
      { name: 'PostgreSQL 16 with pgvector', detail: 'Native vector embeddings support for AI/LLM workloads, Patroni failover with RPO < 1s' },
      { name: 'Redis 7 with Sentinel HA', detail: 'In-memory caching and message pub/sub with AOF and RDB durable persistence' },
      { name: 'Point-In-Time-Restore (PITR)', detail: 'Continuous WAL archiving allows restoring cluster state down to the exact second' },
      { name: 'Integrated PgBouncer pooling', detail: 'Built-in transaction connection pooler serving up to 20,000 active client connections' },
    ],
    snippets: {
      cli: `arv db cluster create \\
  --engine postgres16 \\
  --name user-service-db \\
  --nodes 3 \\
  --storage 200GB`,
      terraform: `resource "aravanta_database_cluster" "primary" {
  engine      = "postgres16"
  name        = "user-service-db"
  node_count  = 3
  storage_gb  = 200
  enable_pitr = true
}`,
      rest: `curl -X POST "https://arv-backend.vercel.app/api/v1/database/clusters" \\
  -H "Authorization: Bearer $ARAVANTA_TOKEN" \\
  -d '{"engine":"postgres16","name":"user-service-db","nodes":3}'`,
      sdk: `const db = await arv.database.create({
  engine: 'postgres16',
  name: 'user-service-db',
  nodes: 3,
});`,
    },
  },
  {
    id: 'backups',
    category: 'storage',
    categoryLabel: 'Storage & Databases',
    name: 'ArvBackups',
    title: 'Disaster Recovery & Snapshots',
    subtitle: 'Point-in-time snapshot orchestration across block volumes, databases, and object buckets',
    icon: RefreshCw,
    tone: 'emerald',
    pricing: 'Included with Storage',
    statusBadge: 'RPO < 15 min',
    features: [
      { name: 'Cross-region async replication', detail: 'Asynchronous snapshot replication between ap-south-1 (Mumbai) and secondary regions' },
      { name: 'Differential block snapshots', detail: 'Capture only modified NVMe storage blocks to drastically reduce storage footprint' },
      { name: 'Automated retention policies', detail: 'Hourly, daily, weekly, and monthly rotation schedules with immutable lock protection' },
      { name: '1-Click disaster recovery', detail: 'Reconstitute complete infrastructure stacks from snapshot archives in under 5 minutes' },
    ],
    snippets: {
      cli: `arv backup create \\
  --target-id cmp_7f3da1b2 \\
  --retention 30d \\
  --replicate-to ap-south-2`,
      terraform: `resource "aravanta_backup_policy" "daily" {
  target_id = "cmp_7f3da1b2"
  schedule  = "cron(0 2 * * ? *)"
  retention = "30d"
}`,
      rest: `curl -X POST "https://arv-backend.vercel.app/api/v1/backups" \\
  -H "Authorization: Bearer $ARAVANTA_TOKEN" \\
  -d '{"target_id":"cmp_7f3da1b2","retention_days":30}'`,
      sdk: `await arv.backups.schedule({
  targetId: 'cmp_7f3da1b2',
  retentionDays: 30,
});`,
    },
  },
  {
    id: 'vpc',
    category: 'network',
    categoryLabel: 'Cloud Networking',
    name: 'ArvVPC',
    title: 'Software-Defined Virtual Private Cloud',
    subtitle: 'Isolated software-defined networks with custom CIDRs, multi-zone subnets, and stateful firewalls',
    icon: Network,
    tone: 'sky',
    pricing: 'Free with Compute',
    statusBadge: 'Zero-Trust SDN',
    features: [
      { name: 'Custom CIDR network topology', detail: 'Allocate RFC 1918 private address ranges (e.g. 10.0.0.0/16) across isolated VPCs' },
      { name: 'Multi-AZ public & private subnets', detail: 'Segment public ingress workloads from air-gapped private database subnets' },
      { name: 'Distributed security groups', detail: 'Stateful micro-segmentation firewalls enforcing ingress/egress rules at the virtual NIC' },
      { name: 'Transit gateway & VPC peering', detail: 'Low-latency encrypted interconnect between VPCs without public internet exposure' },
    ],
    snippets: {
      cli: `arv vpc create \\
  --name prod-vpc-01 \\
  --cidr 10.0.0.0/16 \\
  --subnets "10.0.1.0/24:public,10.0.2.0/24:private"`,
      terraform: `resource "aravanta_vpc" "prod" {
  name       = "prod-vpc-01"
  cidr_block = "10.0.0.0/16"
  region     = "ap-south-1"
}`,
      rest: `curl -X POST "https://arv-backend.vercel.app/api/v1/networking/vpcs" \\
  -H "Authorization: Bearer $ARAVANTA_TOKEN" \\
  -d '{"name":"prod-vpc-01","cidr":"10.0.0.0/16"}'`,
      sdk: `const vpc = await arv.networking.vpcs.create({
  name: 'prod-vpc-01',
  cidr: '10.0.0.0/16',
});`,
    },
  },
  {
    id: 'lb',
    category: 'network',
    categoryLabel: 'Cloud Networking',
    name: 'ArvLB',
    title: 'Elastic Load Balancers (L4 / L7)',
    subtitle: 'High-throughput load balancing with automated Let\'s Encrypt SSL/TLS termination and health checks',
    icon: Share2,
    tone: 'emerald',
    pricing: '₹2.20 / LB-hr',
    statusBadge: 'SSL Auto-Term',
    features: [
      { name: 'Layer 4 & Layer 7 routing', detail: 'Ultra-low-latency TCP/UDP proxying and content-based HTTP/HTTPS path routing' },
      { name: 'Automated TLS 1.3 termination', detail: 'Zero-configuration Let\'s Encrypt certificate issuance, renewal, and SNI support' },
      { name: 'Active target group health probes', detail: 'Continuous HTTP/TCP health checks with automatic connection draining on failure' },
      { name: 'Sticky sessions & rate limiting', detail: 'Cookie-based session persistence and edge-level DDoS request throttling' },
    ],
    snippets: {
      cli: `arv lb create \\
  --name api-edge-lb \\
  --type layer7 \\
  --port 443 \\
  --target-group api-backend-tg`,
      terraform: `resource "aravanta_load_balancer" "edge" {
  name = "api-edge-lb"
  type = "APPLICATION"
  port = 443
}`,
      rest: `curl -X POST "https://arv-backend.vercel.app/api/v1/networking/load-balancers" \\
  -H "Authorization: Bearer $ARAVANTA_TOKEN" \\
  -d '{"name":"api-edge-lb","type":"L7","port":443}'`,
      sdk: `await arv.networking.loadBalancers.create({
  name: 'api-edge-lb',
  type: 'APPLICATION',
  port: 443,
});`,
    },
  },
  {
    id: 'dns',
    category: 'network',
    categoryLabel: 'Cloud Networking',
    name: 'ArvDNS',
    title: 'Global Anycast Cloud DNS',
    subtitle: 'Sub-10ms global query resolution with GeoDNS routing, DNSSEC signing, and private split-horizon',
    icon: Globe2,
    tone: 'amber',
    pricing: '₹0.10 / 1M queries',
    statusBadge: '< 10ms Anycast',
    features: [
      { name: 'Global Anycast network', detail: 'Distributed DNS resolver nodes across 24 edge points of presence with sub-10ms query times' },
      { name: 'GeoDNS proximity routing', detail: 'Direct inbound requests to the nearest cloud region based on client IP geolocation' },
      { name: 'DNSSEC cryptographic signing', detail: 'Hardware-backed automated DNSSEC key management preventing spoofing and cache poisoning' },
      { name: 'Split-horizon private zones', detail: 'Internal DNS resolution for private VPC services with zero internet record exposure' },
    ],
    snippets: {
      cli: `arv dns record set \\
  --zone aravantacloud.in \\
  --type A \\
  --name api \\
  --value 103.21.244.10 \\
  --ttl 60`,
      terraform: `resource "aravanta_dns_record" "api" {
  zone_name = "aravantacloud.in"
  name      = "api"
  type      = "A"
  records   = ["103.21.244.10"]
  ttl       = 60
}`,
      rest: `curl -X POST "https://arv-backend.vercel.app/api/v1/networking/dns/records" \\
  -H "Authorization: Bearer $ARAVANTA_TOKEN" \\
  -d '{"zone":"aravantacloud.in","type":"A","name":"api","value":"103.21.244.10"}'`,
      sdk: `await arv.dns.setRecord({
  zone: 'aravantacloud.in',
  name: 'api',
  type: 'A',
  value: '103.21.244.10',
});`,
    },
  },
  {
    id: 'events',
    category: 'network',
    categoryLabel: 'Cloud Networking',
    name: 'ArvEvents',
    title: 'Cloud Event Bus & Pub/Sub',
    subtitle: 'Distributed event bus compatible with CloudEvents and Apache Kafka protocols for asynchronous architectures',
    icon: Radio,
    tone: 'gold',
    pricing: '10M events free / mo',
    statusBadge: 'CloudEvents v1.0',
    features: [
      { name: 'CloudEvents & Kafka compatibility', detail: 'Publish and consume events using standard Kafka clients or JSON CloudEvents format' },
      { name: 'Guaranteed at-least-once delivery', detail: 'Durable distributed log replication across 3 availability zones with message ordering' },
      { name: 'Dead-letter queues & retries', detail: 'Configurable exponential backoff policies and dead-letter queue routing for failed deliveries' },
      { name: 'Serverless function bindings', detail: 'Fanout event streams directly into ArvFunctions with automatic batching and filtering' },
    ],
    snippets: {
      cli: `arv events publish \\
  --topic order.created \\
  --data '{"order_id":"ord_9901","amount_inr":4500}'`,
      terraform: `resource "aravanta_event_topic" "orders" {
  name               = "order.created"
  retention_hours    = 72
  partitions         = 6
}`,
      rest: `curl -X POST "https://arv-backend.vercel.app/api/v1/events/publish" \\
  -H "Authorization: Bearer $ARAVANTA_TOKEN" \\
  -d '{"topic":"order.created","payload":{"order_id":"ord_9901"}}'`,
      sdk: `await arv.events.publish({
  topic: 'order.created',
  payload: { orderId: 'ord_9901', amountInr: 4500 },
});`,
    },
  },
  {
    id: 'iam',
    category: 'security',
    categoryLabel: 'Security & KMS',
    name: 'ArvIAM',
    title: 'Zero-Trust Identity & Access Management',
    subtitle: '5-tier role-based access control, RFC 6238 TOTP MFA, WebAuthn FIDO2 passkeys, and SCIM 2.0',
    icon: Shield,
    tone: 'rose',
    pricing: 'Enterprise Workspace',
    statusBadge: 'RFC 6238 MFA',
    features: [
      { name: 'Server-enforced 5-tier RBAC', detail: 'Strict hierarchy (SuperAdmin, Admin, Operator, Developer, Viewer) validated at the Pydantic API boundary' },
      { name: 'TOTP MFA & WebAuthn Passkeys', detail: 'RFC 6238 30-second rotating TOTP codes and biometric hardware passkeys support' },
      { name: 'SCIM 2.0 automated provisioning', detail: 'Synchronize users and group memberships automatically with Okta, Microsoft Entra ID, and Google' },
      { name: 'Fine-grained scoped API keys', detail: 'Generate short-lived API keys with CIDR IP whitelists and read/write permission scopes' },
    ],
    snippets: {
      cli: `arv iam user invite \\
  --email engineer@company.in \\
  --role Operator \\
  --require-mfa true`,
      terraform: `resource "aravanta_iam_user" "lead_eng" {
  email       = "engineer@company.in"
  role        = "Operator"
  require_mfa = true
}`,
      rest: `curl -X POST "https://arv-backend.vercel.app/api/v1/iam/invites" \\
  -H "Authorization: Bearer $ARAVANTA_TOKEN" \\
  -d '{"email":"engineer@company.in","role":"Operator"}'`,
      sdk: `await arv.iam.inviteUser({
  email: 'engineer@company.in',
  role: 'Operator',
  requireMfa: true,
});`,
    },
  },
  {
    id: 'vault',
    category: 'security',
    categoryLabel: 'Security & KMS',
    name: 'ArvVault',
    title: 'Hardware KMS & Secrets Manager',
    subtitle: 'AES-256-GCM envelope encryption, automated secret rotation, and Customer-Managed Encryption Keys (CMEK)',
    icon: Lock,
    tone: 'amber',
    pricing: '100 Secrets Free',
    statusBadge: 'AES-256-GCM',
    features: [
      { name: 'Hardware-backed envelope encryption', detail: 'Secrets encrypted at rest using AES-256-GCM backed by physical Hardware Security Modules (HSM)' },
      { name: 'Zero-downtime secret rotation', detail: 'Automated rotation triggers for database credentials, API tokens, and TLS private keys' },
      { name: 'CMEK key governance', detail: 'Bring your own master cryptographic keys with audit logs for every decrypt operation' },
      { name: 'Dynamic temporary credentials', detail: 'Issue short-lived (15 min) database credentials that expire automatically' },
    ],
    snippets: {
      cli: `arv vault secret set \\
  --key STRIPE_SECRET_KEY \\
  --value "sk_live_9981a8" \\
  --rotate-days 90`,
      terraform: `resource "aravanta_vault_secret" "stripe" {
  key         = "STRIPE_SECRET_KEY"
  value       = var.stripe_key
  rotate_days = 90
}`,
      rest: `curl -X POST "https://arv-backend.vercel.app/api/v1/vault/secrets" \\
  -H "Authorization: Bearer $ARAVANTA_TOKEN" \\
  -d '{"key":"STRIPE_SECRET_KEY","value":"sk_live_9981a8"}'`,
      sdk: `await arv.vault.setSecret({
  key: 'STRIPE_SECRET_KEY',
  value: process.env.LIVE_KEY,
});`,
    },
  },
  {
    id: 'compliance',
    category: 'security',
    categoryLabel: 'Security & KMS',
    name: 'ArvGuard',
    title: 'Sovereign Governance & Compliance',
    subtitle: 'DPDPA 2023 compliance engine, immutable cryptographic audit logs, and in-country sovereign residency',
    icon: CheckCircle2,
    tone: 'emerald',
    pricing: 'Included in Platform',
    statusBadge: 'DPDPA 2023 Ready',
    features: [
      { name: 'DPDPA 2023 compliance engine', detail: 'Built specifically to comply with the Indian Digital Personal Data Protection Act statutory rules' },
      { name: 'Cryptographic immutable audit trails', detail: 'Tamper-evident, hash-chained audit logs with 365-day persistent retention and CSV export' },
      { name: 'Strict sovereign data residency', detail: 'Guaranteed in-country storage in MeitY-aligned datacenter facilities in Mumbai (ap-south-1)' },
      { name: 'Automated SOC 2 readiness reports', detail: 'Export continuous compliance evidence bundles formatted for ISO 27001 and SOC 2 audits' },
    ],
    snippets: {
      cli: `arv compliance report generate \\
  --standard DPDPA-2023 \\
  --period Q3-2026 \\
  --format pdf`,
      terraform: `resource "aravanta_compliance_policy" "dpdpa" {
  standard          = "DPDPA_2023"
  sovereign_region  = "ap-south-1"
  enforce_immutable = true
}`,
      rest: `curl -X GET "https://arv-backend.vercel.app/api/v1/compliance/reports/dpdpa" \\
  -H "Authorization: Bearer $ARAVANTA_TOKEN"`,
      sdk: `const report = await arv.compliance.generateReport({
  standard: 'DPDPA_2023',
  format: 'json',
});`,
    },
  },
  {
    id: 'observability',
    category: 'sre',
    categoryLabel: 'SRE & FinOps AI',
    name: 'ArvWatch',
    title: 'Full-Stack SRE Telemetry & Observability',
    subtitle: 'Prometheus-compatible TSDB, structured Loki log streaming, and OpenTelemetry distributed tracing',
    icon: Activity,
    tone: 'gold',
    pricing: 'Included with Compute',
    statusBadge: '< 10ms Ingest',
    features: [
      { name: 'Prometheus TSDB federation', detail: 'Long-term metric retention with Thanos-style global querying and Grafana compatibility' },
      { name: 'Structured Loki log explorer', detail: 'Live log tailing, regex label filtering, saved views, and persistent shareable query URLs' },
      { name: 'OpenTelemetry & Jaeger tracing', detail: 'Interactive flamegraphs and service dependency graphs pinpointing P99 latency bottlenecks' },
      { name: 'Sub-10ms scraping cadence', detail: 'High-frequency telemetry ingestion detecting micro-bursts and CPU throttling instantly' },
    ],
    snippets: {
      cli: `arv watch logs query \\
  --service api-gateway \\
  --status ">=500" \\
  --tail 50`,
      terraform: `resource "aravanta_observability_alert" "high_error_rate" {
  service   = "api-gateway"
  metric    = "http_5xx_rate"
  threshold = 0.01
}`,
      rest: `curl -X GET "https://arv-backend.vercel.app/api/v1/observability/metrics?service=api-gateway" \\
  -H "Authorization: Bearer $ARAVANTA_TOKEN"`,
      sdk: `const metrics = await arv.watch.getMetrics({
  service: 'api-gateway',
  range: '1h',
});`,
    },
  },
  {
    id: 'pulse',
    category: 'sre',
    categoryLabel: 'SRE & FinOps AI',
    name: 'ArvPulse',
    title: 'Autonomous Health & Incident War-Room',
    subtitle: 'Multi-window SLO error budget tracking, synthetic heartbeat probes, and automated remediation runbooks',
    icon: Sliders,
    tone: 'rose',
    pricing: 'Platform Operations',
    statusBadge: 'Autonomous SRE',
    features: [
      { name: 'Multi-window SLO burn-rate alerts', detail: 'Calculates fast and slow error budget consumption to prevent alert fatigue on transient spikes' },
      { name: 'Collaborative incident war-rooms', detail: 'Assign incident commanders, record timestamped postmortem events, and track MTTR' },
      { name: 'Synthetic global uptime probes', detail: 'Periodic heartbeat checks verifying endpoints from Mumbai, Singapore, Frankfurt, and Virginia' },
      { name: 'Automated self-healing runbooks', detail: 'Trigger parameterized remediation actions (restart pod, flush cache, failover DB) on alert firing' },
    ],
    snippets: {
      cli: `arv pulse incident trigger \\
  --title "High Redis Memory Fragmentation" \\
  --severity P1 \\
  --runbook flush-idle-cache`,
      terraform: `resource "aravanta_slo" "api_latency" {
  service     = "api-gateway"
  target      = 0.999
  latency_p95 = "120ms"
}`,
      rest: `curl -X POST "https://arv-backend.vercel.app/api/v1/pulse/incidents" \\
  -H "Authorization: Bearer $ARAVANTA_TOKEN" \\
  -d '{"title":"P1 Outage","severity":"critical"}'`,
      sdk: `await arv.pulse.createIncident({
  title: 'P1 Outage',
  severity: 'critical',
});`,
    },
  },
  {
    id: 'costiq',
    category: 'sre',
    categoryLabel: 'SRE & FinOps AI',
    name: 'ArvCostIQ',
    title: 'FinOps AI & Consumption Cost Governance',
    subtitle: 'Per-second metering in INR (₹) and USD, idle VM detection, rightsizing AI, and 18% GST tax invoicing',
    icon: CreditCard,
    tone: 'emerald',
    pricing: 'Included in Suite',
    statusBadge: '18% GST Invoicing',
    features: [
      { name: 'Per-second precision metering', detail: 'Strict consumption accounting in Indian Rupees (₹) with zero ungrounded rounding penalties' },
      { name: 'AI rightsizing recommendations', detail: 'Identifies over-provisioned CPU/RAM shapes and computes exact projected monthly rupee savings' },
      { name: 'Idle resource auto-suspend', detail: 'Automatically suspends staging environments on weekends and non-business hours' },
      { name: 'GSTIN tax invoice generation', detail: 'Official tax invoices with CGST (9%) + SGST (9%) breakdowns downloadable in PDF and WebCopy' },
    ],
    snippets: {
      cli: `arv costiq optimize \\
  --project production \\
  --auto-apply-threshold 30d-idle`,
      terraform: `resource "aravanta_finops_budget" "monthly_cap" {
  budget_inr   = 150000
  alert_at_pct = 80
  notify_slack = true
}`,
      rest: `curl -X GET "https://arv-backend.vercel.app/api/v1/billing/breakdown" \\
  -H "Authorization: Bearer $ARAVANTA_TOKEN"`,
      sdk: `const cost = await arv.costiq.getCurrentMonthSpend();
console.log(\`Current spend: ₹\${cost.total_inr}\`);`,
    },
  },
];

const categoryTabs = [
  { id: 'all' as ServiceCategory, label: 'All Primitives', count: 18 },
  { id: 'compute' as ServiceCategory, label: 'Compute & Serverless', count: 5 },
  { id: 'storage' as ServiceCategory, label: 'Storage & Databases', count: 3 },
  { id: 'network' as ServiceCategory, label: 'Cloud Networking', count: 4 },
  { id: 'security' as ServiceCategory, label: 'Security & KMS', count: 3 },
  { id: 'sre' as ServiceCategory, label: 'SRE & FinOps AI', count: 3 },
];



const toneIconMap: Record<string, string> = {
  gold: 'bg-brandGold-500/10 text-brandGold-600 dark:text-brandGold-400 group-hover:bg-brandGold-500 group-hover:text-white',
  emerald: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 group-hover:bg-emerald-500 group-hover:text-white',
  sky: 'bg-sky-500/10 text-sky-600 dark:text-sky-400 group-hover:bg-sky-500 group-hover:text-white',
  violet: 'bg-violet-500/10 text-violet-600 dark:text-violet-400 group-hover:bg-violet-500 group-hover:text-white',
  rose: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 group-hover:bg-rose-500 group-hover:text-white',
  amber: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 group-hover:bg-amber-500 group-hover:text-white',
};

export const FeaturesPage: React.FC<PageProps> = ({
  onGoToLogin,
  onGoToRegister,
  onOpenCommandPalette,
  onNavigate,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<ServiceCategory>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedService, setSelectedService] = useState<ServiceDefinition>(servicesData[0]);
  const [activeSnippetTab, setActiveSnippetTab] = useState<'cli' | 'terraform' | 'rest' | 'sdk'>('cli');
  const [copiedSnippet, setCopiedSnippet] = useState(false);

  useEffect(() => {
    // Clear any stale anchor hash and guarantee landing at top
    if (typeof window !== 'undefined') {
      if (window.location.hash) {
        window.history.replaceState(null, '', window.location.pathname);
      }
      window.scrollTo(0, 0);
    }
  }, []);

  const filteredServices = useMemo(() => {
    return servicesData.filter((srv) => {
      const matchesCategory = selectedCategory === 'all' || srv.category === selectedCategory;
      const q = searchQuery.toLowerCase().trim();
      if (!q) return matchesCategory;

      const matchesSearch =
        srv.name.toLowerCase().includes(q) ||
        srv.title.toLowerCase().includes(q) ||
        srv.subtitle.toLowerCase().includes(q) ||
        srv.features.some((f) => f.name.toLowerCase().includes(q) || f.detail.toLowerCase().includes(q));

      return matchesCategory && matchesSearch;
    });
  }, [selectedCategory, searchQuery]);

  const handleCopyCode = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedSnippet(true);
    setTimeout(() => setCopiedSnippet(false), 2000);
  };

  const SelectedIcon = selectedService.icon;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-brandObsidian-950 font-sans antialiased text-slate-900 dark:text-slate-100 transition-colors">
      <Navbar
        onGoToLogin={onGoToLogin}
        onGoToRegister={onGoToRegister}
        onOpenCommandPalette={onOpenCommandPalette}
        onNavigate={onNavigate}
        currentView="features"
      />

      <main>
        {/* Breadcrumb Header */}
        <section className="pt-6 pb-2">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <Breadcrumbs
              items={[
                { label: 'Platform', onClick: () => onNavigate?.('home') },
                { label: 'Cloud Architecture' },
                { label: 'Feature Matrix' },
              ]}
            />
          </div>
        </section>

        {/* Hero Section */}
        <section className="relative pt-6 sm:pt-8 pb-10 sm:pb-16 overflow-hidden">
          <div aria-hidden className="absolute inset-x-0 top-0 -z-10 h-[560px] bg-hero-radial opacity-85 pointer-events-none" />
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
              className="max-w-4xl mx-auto text-center space-y-5"
            >
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-brandGold-500/40 bg-brandGold-500/10 text-brandGold-700 dark:text-brandGold-300 text-xs font-semibold tracking-wide uppercase shadow-xs">
                <span className="w-2 h-2 rounded-full bg-brandGold-500 animate-pulse" />
                <span>Feature Matrix • 18+ Primitives • ap-south-1 Sovereign</span>
              </div>

              <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight leading-[1.08] text-slate-900 dark:text-white">
                The Complete Cloud Primitive Matrix for{' '}
                <span className="bg-gradient-to-r from-brandGold-500 via-amber-500 to-brandGold-600 bg-clip-text text-transparent">
                  Aravanta Cloud OS
                </span>
              </h1>

              <p className="text-sm sm:text-base lg:text-lg text-slate-600 dark:text-slate-300 leading-relaxed max-w-3xl mx-auto">
                Explore every cloud infrastructure and platform primitive in detail. From elastic virtual machines and managed Kubernetes to zero-trust IAM, sovereign data compliance, and FinOps cost AI. Every primitive ships with audit-logged REST APIs and official Terraform providers.
              </p>

              <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                <Button
                  size="xl"
                  variant="primary"
                  onClick={onGoToRegister}
                  className="bg-brandGold-500 hover:bg-brandGold-600 text-brandObsidian-950 font-bold shadow-lg shadow-brandGold-500/20"
                  rightIcon={<ArrowRight className="w-5 h-5" />}
                >
                  Launch Free Workspace
                </Button>
                <Button
                  size="xl"
                  variant="outline"
                  onClick={() => onNavigate?.('cli')}
                  className="border-slate-300 dark:border-brandObsidian-700 hover:border-brandGold-500"
                  leftIcon={<Terminal className="w-4 h-4 text-brandGold-500" />}
                >
                  Interactive Web Terminal
                </Button>
                <Button
                  size="xl"
                  variant="ghost"
                  onClick={() => onNavigate?.('services')}
                  className="text-slate-700 dark:text-slate-300 hover:text-brandGold-600"
                  leftIcon={<Layers className="w-4 h-4 text-brandGold-500" />}
                >
                  Service Catalog
                </Button>
              </div>

              {/* Factual Spec Strip */}
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5 sm:gap-3 pt-4 max-w-4xl mx-auto text-left">
                {[
                  { label: 'VM Shapes', val: '80+ AMD & ARM' },
                  { label: 'Sovereign Regions', val: '4 Datacenters' },
                  { label: 'VM Provisioning', val: '< 60 seconds' },
                  { label: 'Canary Rollback', val: '< 1.2s Zero Drop' },
                  { label: 'Tax Compliance', val: '18% GST Invoicing' },
                ].map((item) => (
                  <div
                    key={item.label}
                    className="p-3 rounded-xl border border-slate-200/80 dark:border-brandObsidian-800 bg-white/70 dark:bg-brandObsidian-900/70 backdrop-blur-sm shadow-xs"
                  >
                    <div className="text-xs font-bold text-brandGold-600 dark:text-brandGold-400 truncate">{item.val}</div>
                    <div className="text-[10px] text-slate-500 dark:text-slate-400 uppercase font-mono mt-0.5 truncate">{item.label}</div>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        </section>

        {/* Interactive Controls & Category Tabs */}
        <section className="relative z-10 bg-white/95 dark:bg-brandObsidian-950/95 backdrop-blur-md border-y border-slate-200 dark:border-brandObsidian-800 py-3 shadow-xs">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col xl:flex-row xl:items-center justify-between gap-3">
            {/* Category Filter Pills (no scrollbar visible) */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 xl:pb-0 scrollbar-none no-scrollbar">
              {categoryTabs.map((cat) => {
                const isActive = selectedCategory === cat.id;
                return (
                  <button
                    key={cat.id}
                    onClick={() => setSelectedCategory(cat.id)}
                    className={[
                      'px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 shrink-0',
                      isActive
                        ? 'bg-brandGold-500 text-brandObsidian-950 shadow-sm'
                        : 'bg-slate-100 dark:bg-brandObsidian-900 border border-slate-200 dark:border-brandObsidian-800 text-slate-700 dark:text-slate-300 hover:border-brandGold-500/50',
                    ].join(' ')}
                  >
                    <span>{cat.label}</span>
                    <span
                      className={[
                        'text-[10px] px-1.5 py-0.2 rounded-full font-mono font-bold',
                        isActive
                          ? 'bg-brandObsidian-950/20 text-brandObsidian-950'
                          : 'bg-slate-200 dark:bg-brandObsidian-800 text-slate-500 dark:text-slate-400',
                      ].join(' ')}
                    >
                      {cat.count}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Live Search Input */}
            <div className="relative w-full xl:w-72 shrink-0">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search primitives, specs, or tags..."
                className="w-full pl-9 pr-3.5 py-1.5 text-xs sm:text-sm rounded-xl border border-slate-300 dark:border-brandObsidian-700 bg-slate-50 dark:bg-brandObsidian-900 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brandGold-500/40"
              />
            </div>
          </div>
        </section>

        {/* Main Content Area: Split View Grid + Interactive Code & Architecture Inspector */}
        <section className="py-8 sm:py-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">
              {/* Left Column: Feature Cards Grid (7 Cols on LG) */}
              <div className="lg:col-span-7 space-y-4">
                <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 font-mono">
                  <span>Showing {filteredServices.length} of {servicesData.length} cloud primitives</span>
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery('')}
                      className="text-brandGold-600 dark:text-brandGold-400 hover:underline cursor-pointer"
                    >
                      Clear search
                    </button>
                  )}
                </div>

                {filteredServices.length === 0 ? (
                  <div className="p-12 text-center rounded-2xl border border-dashed border-slate-300 dark:border-brandObsidian-800">
                    <Search className="w-8 h-8 text-slate-400 mx-auto mb-3" />
                    <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">No primitives matching "{searchQuery}"</p>
                    <p className="text-xs text-slate-500 mt-1">Try searching for compute, vpc, kubernetes, s3, or security.</p>
                  </div>
                ) : (
                  <div className="space-y-3.5">
                    {filteredServices.map((srv, idx) => {
                      const Icon = srv.icon;
                      const isSelected = selectedService.id === srv.id;
                      return (
                        <motion.article
                          key={srv.id}
                          initial={{ opacity: 0, y: 12 }}
                          whileInView={{ opacity: 1, y: 0 }}
                          viewport={{ once: true }}
                          transition={{ duration: 0.35, delay: idx * 0.02 }}
                          onClick={() => setSelectedService(srv)}
                          className={[
                            'group p-4 sm:p-5 rounded-2xl border transition-all duration-200 cursor-pointer',
                            isSelected
                              ? 'border-brandGold-500 dark:border-brandGold-500 bg-white dark:bg-brandObsidian-900 shadow-xl shadow-brandGold-500/10 ring-2 ring-brandGold-500/30'
                              : 'border-slate-200 dark:border-brandObsidian-800 bg-white/90 dark:bg-brandObsidian-900/90 hover:border-brandGold-500/50 hover:shadow-md',
                          ].join(' ')}
                        >
                          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                            <div className="flex items-start gap-3">
                              <div
                                className={[
                                  'w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-colors',
                                  toneIconMap[srv.tone],
                                ].join(' ')}
                              >
                                <Icon className="w-5 h-5" />
                              </div>
                              <div className="min-w-0">
                                <div className="flex flex-wrap items-center gap-1.5">
                                  <h3 className="text-base font-bold text-slate-900 dark:text-white group-hover:text-brandGold-600 dark:group-hover:text-brandGold-400 transition-colors">
                                    {srv.name}
                                  </h3>
                                  <Badge variant="outline" size="sm" className="font-mono text-[10px]">
                                    {srv.statusBadge}
                                  </Badge>
                                </div>
                                <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 mt-0.5">
                                  {srv.title}
                                </div>
                                <p className="text-xs text-slate-600 dark:text-slate-300 mt-1.5 leading-relaxed">
                                  {srv.subtitle}
                                </p>
                              </div>
                            </div>

                            <div className="sm:text-right shrink-0">
                              <div className="text-xs font-mono font-bold text-slate-900 dark:text-white">
                                {srv.pricing}
                              </div>
                              <div className="text-[10px] font-mono text-slate-400 uppercase mt-0.5">
                                Pricing Rate
                              </div>
                            </div>
                          </div>

                          {/* Capabilities Grid */}
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-3 pt-3 border-t border-slate-100 dark:border-brandObsidian-800">
                            {srv.features.map((feat) => (
                              <div key={feat.name} className="flex items-start gap-1.5">
                                <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                                <div className="min-w-0">
                                  <div className="text-xs font-bold text-slate-800 dark:text-slate-200 leading-tight">
                                    {feat.name}
                                  </div>
                                  <div className="text-[11px] text-slate-500 dark:text-slate-400 leading-snug">
                                    {feat.detail}
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>

                          <div className="flex items-center justify-between mt-3 pt-2.5 text-xs border-t border-slate-100 dark:border-brandObsidian-800">
                            <span className="text-slate-400 font-mono text-[11px]">
                              {srv.categoryLabel}
                            </span>
                            <span className="inline-flex items-center gap-1 font-semibold text-brandGold-600 dark:text-brandGold-400 group-hover:translate-x-0.5 transition-transform text-xs">
                              <span>Inspect Architecture & Code</span>
                              <ChevronRight className="w-3.5 h-3.5" />
                            </span>
                          </div>
                        </motion.article>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Right Column: Sticky Live Architecture & Code Inspector (5 Cols on LG) */}
              <div className="lg:col-span-5 lg:sticky lg:top-20 space-y-3">
                <div className="p-4 sm:p-5 rounded-2xl border border-slate-200 dark:border-brandObsidian-700 bg-white dark:bg-brandObsidian-900 shadow-xl overflow-hidden">
                  <div className="flex items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-brandObsidian-800">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-9 h-9 rounded-xl bg-brandGold-500/10 text-brandGold-500 flex items-center justify-center shrink-0">
                        <SelectedIcon className="w-4.5 h-4.5" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <h4 className="text-base font-bold text-slate-900 dark:text-white truncate">
                            {selectedService.name}
                          </h4>
                          <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-brandGold-500/15 text-brandGold-600 dark:text-brandGold-400">
                            {selectedService.statusBadge}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                          {selectedService.categoryLabel} • {selectedService.pricing}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Architecture Spec Summary */}
                  <div className="py-2.5 space-y-1">
                    <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 font-mono">
                      Primitive Architecture
                    </div>
                    <p className="text-xs text-slate-600 dark:text-slate-300 leading-snug">
                      {selectedService.subtitle}. Bound directly into the Aravanta control plane with automatic RBAC validation and real-time FinOps metering.
                    </p>
                  </div>

                  {/* Code Tabs Header */}
                  <div className="pt-1">
                    <div className="flex items-center justify-between pb-2">
                      <div className="flex items-center gap-1 bg-slate-100 dark:bg-brandObsidian-950 p-0.5 rounded-lg">
                        {[
                          { id: 'cli' as const, label: 'CLI' },
                          { id: 'terraform' as const, label: 'Terraform' },
                          { id: 'rest' as const, label: 'REST API' },
                          { id: 'sdk' as const, label: 'Node SDK' },
                        ].map((tab) => (
                          <button
                            key={tab.id}
                            onClick={() => setActiveSnippetTab(tab.id)}
                            className={[
                              'px-2 py-0.5 text-xs font-mono font-semibold rounded-md transition-all cursor-pointer',
                              activeSnippetTab === tab.id
                                ? 'bg-white dark:bg-brandObsidian-800 text-brandGold-600 dark:text-brandGold-400 shadow-xs'
                                : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200',
                            ].join(' ')}
                          >
                            {tab.label}
                          </button>
                        ))}
                      </div>

                      <button
                        onClick={() => handleCopyCode(selectedService.snippets[activeSnippetTab])}
                        className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-mono font-semibold rounded-md border border-slate-200 dark:border-brandObsidian-700 bg-white dark:bg-brandObsidian-800 text-slate-700 dark:text-slate-200 hover:border-brandGold-500 transition-colors cursor-pointer"
                        title="Copy snippet"
                      >
                        {copiedSnippet ? (
                          <>
                            <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                            <span className="text-emerald-500 text-[11px]">Copied</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3 h-3 text-slate-400" />
                            <span className="text-[11px]">Copy</span>
                          </>
                        )}
                      </button>
                    </div>

                    {/* Code Container (compact & clean) */}
                    <div className="rounded-xl overflow-hidden border border-slate-300 dark:border-brandObsidian-800 bg-[#0B0F17] text-slate-200 p-3 font-mono text-xs overflow-y-auto max-h-[140px] no-scrollbar scrollbar-none shadow-inner">
                      <pre className="whitespace-pre leading-relaxed">
                        <code>{selectedService.snippets[activeSnippetTab]}</code>
                      </pre>
                    </div>
                  </div>

                  {/* Actions Bar */}
                  <div className="pt-3 mt-3 border-t border-slate-100 dark:border-brandObsidian-800 space-y-2">
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => onNavigate?.('cli')}
                      className="w-full bg-brandGold-500 hover:bg-brandGold-600 text-brandObsidian-950 font-bold"
                      leftIcon={<Terminal className="w-3.5 h-3.5" />}
                      rightIcon={<ArrowRight className="w-3.5 h-3.5" />}
                    >
                      Execute in Web Terminal
                    </Button>
                    <div className="grid grid-cols-2 gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onNavigate?.('services')}
                        className="w-full text-xs"
                        leftIcon={<Layers className="w-3 h-3" />}
                      >
                        Service Catalog
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onNavigate?.('documentation')}
                        className="w-full text-xs"
                        leftIcon={<FileText className="w-3 h-3" />}
                      >
                        API Specs
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Quick Architecture Callout Box */}
                <div className="p-3.5 rounded-xl border border-brandGold-500/20 bg-brandGold-500/5 text-xs space-y-1">
                  <div className="font-bold text-brandGold-700 dark:text-brandGold-300 flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-brandGold-500" />
                    <span>Sovereign India Cloud Guarantee</span>
                  </div>
                  <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-snug">
                    All compute cores, S3 buckets, and databases execute inside ISO 27001-certified tier-IV datacenter facilities in Mumbai (ap-south-1) with full MeitY & DPDPA 2023 compliance.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>


        {/* Detailed Enterprise Comparison Matrix */}
        <section className="py-16 sm:py-20 border-t border-slate-200 dark:border-brandObsidian-800 bg-white/50 dark:bg-brandObsidian-900/30">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
            <div className="max-w-3xl mx-auto text-center space-y-3">
              <Badge variant="gold" size="sm" dot>
                Architecture Comparison
              </Badge>
              <h2 className="text-3xl sm:text-4xl font-black tracking-tight text-slate-900 dark:text-white">
                How Aravanta Cloud OS compares to conventional cloud stacks
              </h2>
              <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300">
                A unified operational plane designed for sovereign reliability, predictable FinOps in INR (₹), and instant developer ergonomics.
              </p>
            </div>

            <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-brandObsidian-700 bg-white dark:bg-brandObsidian-900 shadow-xl">
              <table className="w-full text-left text-xs sm:text-sm">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-brandObsidian-800 bg-slate-50 dark:bg-brandObsidian-950/80 font-mono uppercase text-slate-500 dark:text-slate-400">
                    <th className="py-4 px-5">Capability / Requirement</th>
                    <th className="py-4 px-5 text-brandGold-600 dark:text-brandGold-400 font-bold">
                      Aravanta Cloud OS
                    </th>
                    <th className="py-4 px-5">Hyperscale Cloud (AWS / GCP / Azure)</th>
                    <th className="py-4 px-5">Ad-Hoc VPS Providers</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-brandObsidian-800">
                  {[
                    {
                      feature: 'Data Sovereignty & DPDPA 2023',
                      arv: '100% In-Country Sovereign (ap-south-1)',
                      hyper: 'Varies by region, complex egress boundaries',
                      vps: 'Often foreign hosting without legal guarantees',
                    },
                    {
                      feature: 'FinOps Billing & Currencies',
                      arv: 'Per-second in INR (₹) with 18% GST invoices',
                      hyper: 'USD billing subject to currency exchange volatility',
                      vps: 'Monthly flat rate with strict bandwidth caps',
                    },
                    {
                      feature: 'Canary Deployments & Rollback',
                      arv: 'Sub-1.2s instant 1-click rollback built-in',
                      hyper: 'Requires external tooling (Spinnaker, ArgoCD)',
                      vps: 'Manual deployment scripts with downtime risk',
                    },
                    {
                      feature: 'SRE War-Rooms & SLO Tracking',
                      arv: 'Built-in real-time telemetry, Loki, and war-rooms',
                      hyper: 'Fragmented across CloudWatch, Datadog, PagerDuty',
                      vps: 'Basic CPU graph only without error budgets',
                    },
                    {
                      feature: 'RBAC & Identity Governance',
                      arv: 'Server-enforced 5-tier matrix + RFC 6238 TOTP',
                      hyper: 'Complex IAM policies (steep learning curve)',
                      vps: 'Single root password or basic SSH key list',
                    },
                    {
                      feature: 'Web Shell Terminal & CLI',
                      arv: 'Zero-install in-browser shell + arv CLI v2.4',
                      hyper: 'CloudShell with startup cold latency',
                      vps: 'Requires local SSH client and manual ports',
                    },
                  ].map((row, i) => (
                    <tr key={i} className="hover:bg-slate-50/80 dark:hover:bg-brandObsidian-800/40 transition-colors">
                      <td className="py-3.5 px-5 font-bold text-slate-900 dark:text-white">
                        {row.feature}
                      </td>
                      <td className="py-3.5 px-5 font-semibold text-brandGold-600 dark:text-brandGold-400 bg-brandGold-500/5">
                        <span className="inline-flex items-center gap-1.5">
                          <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                          <span>{row.arv}</span>
                        </span>
                      </td>
                      <td className="py-3.5 px-5 text-slate-600 dark:text-slate-300">
                        {row.hyper}
                      </td>
                      <td className="py-3.5 px-5 text-slate-500 dark:text-slate-400">
                        {row.vps}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* Bottom CTA Card */}
        <section className="py-20 sm:py-28 border-t border-slate-200 dark:border-brandObsidian-800">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="relative overflow-hidden rounded-3xl bg-brandObsidian-950 text-white shadow-2xl border border-brandObsidian-800">
              <div
                aria-hidden
                className="pointer-events-none absolute inset-0 opacity-[0.25]"
                style={{
                  background:
                    'radial-gradient(85% 85% at 50% -10%, rgba(198,146,59,0.55) 0%, rgba(198,146,59,0) 60%)',
                }}
              />
              <div className="relative p-8 sm:p-12 lg:p-14 text-center space-y-6">
                <Badge variant="gold" size="md" dot>
                  <Rocket className="w-3.5 h-3.5" /> Launch In Production
                </Badge>
                <div className="max-w-2xl mx-auto space-y-4">
                  <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight leading-[1.08]">
                    Experience every primitive in your live workspace.
                  </h2>
                  <p className="text-base sm:text-lg text-slate-300 leading-relaxed">
                    Full access to virtual machines, managed Kubernetes, S3 storage, serverless functions, and FinOps budgeting. Zero setup fees, cancel anytime.
                  </p>
                </div>
                <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 pt-2">
                  <Button
                    size="xl"
                    variant="primary"
                    onClick={onGoToRegister}
                    className="bg-brandGold-500 hover:bg-brandGold-600 text-brandObsidian-950 font-bold shadow-lg shadow-brandGold-500/25"
                    rightIcon={<ArrowRight className="w-4.5 h-4.5" />}
                  >
                    Start Free Trial
                  </Button>
                  <Button
                    size="xl"
                    variant="secondary"
                    onClick={() => onNavigate?.('pricing')}
                    leftIcon={<CreditCard className="w-4 h-4" />}
                  >
                    View Pricing Engine
                  </Button>
                  <Button
                    size="xl"
                    variant="outline"
                    onClick={() => onNavigate?.('documentation')}
                    className="text-white border-brandObsidian-700 hover:bg-brandObsidian-800"
                    leftIcon={<FileText className="w-4 h-4" />}
                  >
                    Read Docs
                  </Button>
                </div>
                <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 pt-2 text-xs sm:text-sm text-slate-400 font-medium">
                  <span className="inline-flex items-center gap-1.5">
                    <Check className="w-4 h-4 text-brandGold-400" /> 80+ instance shapes
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <Check className="w-4 h-4 text-brandGold-400" /> ap-south-1 Sovereign
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <Check className="w-4 h-4 text-brandGold-400" /> 18% GST Compliant
                  </span>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer onNavigate={onNavigate} />
    </div>
  );
};
