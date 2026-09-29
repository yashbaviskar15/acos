import React, { useState, useMemo, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Search,
  ChevronRight,
  ChevronLeft,
  ArrowRight,
  BookOpen,
  FileJson,
  Terminal,
  FolderTree,
  Zap,
  Server,
  Container,
  HardDrive,
  Database,
  Activity,
  Shield,
  CreditCard,
  Rocket,
  Cpu,
  FileCode,
  Lightbulb,
  Sparkles,
} from 'lucide-react';

import { Navbar, LandingView } from '../components/ui/Navbar';
import { Footer } from '../components/ui/Footer';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Card, CardBody } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { CodeBlock } from '../components/ui/CopyButton';

interface PageProps {
  onGoToLogin: () => void;
  onGoToRegister: () => void;
  onOpenCommandPalette?: () => void;
  onNavigate?: (view: LandingView) => void;
  onGoToConsole?: () => void;
}

// ── Sidebar Tree Navigation Schema ──
const sidebarTree = [
  {
    group: 'Getting started',
    items: [
      { id: 'intro', label: 'Introduction & Architecture', icon: Rocket },
      { id: 'quickstart', label: 'Quickstart (5 steps)', icon: Zap },
      { id: 'concepts', label: 'Core concepts & primitives', icon: Lightbulb },
    ],
  },
  {
    group: 'Products',
    items: [
      { id: 'compute', label: 'Compute VMs (ArvCompute)', icon: Server },
      { id: 'k8s', label: 'Managed Kubernetes (ArvKube)', icon: Container },
      { id: 'storage', label: 'S3 Object Storage (ArvStore)', icon: HardDrive },
      { id: 'database', label: 'Managed Databases (ArvDB)', icon: Database },
    ],
  },
  {
    group: 'Platform',
    items: [
      { id: 'monitoring', label: 'Observability & SRE', icon: Activity },
      { id: 'security', label: 'RBAC & Zero-Trust Security', icon: Shield },
      { id: 'billing', label: 'Billing & FinOps (INR)', icon: CreditCard },
    ],
  },
  {
    group: 'Reference',
    items: [
      { id: 'cli', label: 'CLI Toolchain (arv)', icon: Terminal },
      { id: 'terraform', label: 'Terraform provider', icon: Cpu },
      { id: 'sdk', label: 'SDKs (Python, TS, Go)', icon: FileCode },
      { id: 'openapi', label: 'OpenAPI 3.1 & REST API', icon: FileJson },
    ],
  },
];

// ── Documentation Content Registry ──
interface DocSubSection {
  id: string;
  title: string;
  body: string;
  tip?: string;
  code?: string;
  lang?: string;
  bullets?: string[];
  metrics?: { label: string; value: string }[];
}

interface DocArticle {
  id: string;
  title: string;
  category: string;
  badge: string;
  description: string;
  sections: DocSubSection[];
}

const docArticles: Record<string, DocArticle> = {
  intro: {
    id: 'intro',
    title: 'Aravanta Cloud OS Architecture & Overview',
    category: 'Getting Started',
    badge: 'v2.4 Sovereign Core',
    description:
      'Aravanta Cloud OS is India’s sovereign multi-cloud operating system, designed to orchestrate high-performance AMD EPYC virtual machines, managed Kubernetes clusters, S3-compatible NVMe object storage, and zero-trust IAM across Tier-IV carrier-neutral Indian datacenters.',
    sections: [
      {
        id: 'sovereign-guarantee',
        title: 'Sovereign Data Residency & Jurisdiction',
        body: 'All physical compute nodes, NVMe block arrays, and object storage buckets reside within Indian territorial jurisdiction (Mumbai ap-south-1, Bengaluru ap-south-2, Delhi ap-north-1, Hyderabad ap-south-3, and Chennai ap-south-4). Complies strictly with the Digital Personal Data Protection (DPDP) Act 2023 with zero cross-border packet routing.',
        bullets: [
          '100% In-Country Storage & Processing: Databases, logs, and backups never transit international fiber routes.',
          'Carrier-Neutral Interconnects: Direct high-bandwidth peering with NIXI, Tata Communications, Bharti Airtel IQ, and DE-CIX.',
          'Tier-IV Datacenter Availability: Dual active power feeds (N+N) and 99.99% uptime control plane guarantees.',
        ],
        tip: 'Verify your active region latency at any time using "arv status --region ap-south-1".',
        code: `# Inspect active control plane health & regional latency
arv status

# Output:
# Region: ap-south-1 (Mumbai Sovereign Core)
# Status: OPERATIONAL • Latency: 7.8ms • Control Plane: v2.4.2-GA
# Tier: Tier-IV Uptime Certified • Compliance: DPDPA 2023`,
        lang: 'bash',
      },
      {
        id: 'control-vs-data',
        title: 'Control Plane vs. Data Plane Separation',
        body: 'Aravanta Cloud OS enforces strict separation between the administrative control plane and client data workloads. The control plane manages metadata, cryptographic audit logging, RBAC scoping, and telemetry ingestion without inspecting private application payloads.',
        metrics: [
          { label: 'Control Plane SLO', value: '99.99%' },
          { label: 'API Ingestion Latency', value: '< 15ms' },
          { label: 'Audit Signing', value: 'SHA-256 HMAC' },
          { label: 'Network Isolation', value: 'WireGuard Mesh' },
        ],
        code: `# Connect to control plane via authenticated CLI
arv auth login --account ARV-ACC-891044

# Verify tenant isolation boundary
arv org describe --output json`,
        lang: 'bash',
      },
    ],
  },

  quickstart: {
    id: 'quickstart',
    title: '5-Step Production Quickstart Guide',
    category: 'Getting Started',
    badge: '~10 min walkthrough',
    description:
      'This 5-step quickstart guides you through launching your first sovereign cloud resources: creating workspaces, provisioning high-speed AMD EPYC compute instances, inspecting telemetry, automating CI/CD, and lifecycle management.',
    sections: [
      {
        id: 'step-1',
        title: 'Step 1: Create Organization & Workspace Project',
        body: 'Organizations represent the top-level boundary for multi-tenancy and RBAC governance. Projects group related cloud resources (VMs, K8s clusters, storage) for cost attribution and access scoping. Every API call targets a single active project.',
        tip: 'Follow the enterprise naming convention: {company}-{environment}-{team}. Example: acme-prod-core.',
        code: `# List accessible organizations for your authenticated identity
arv org list

# Create a new production organization
arv org create --name "Bharat Enterprise"

# Create a new project scoped to the organization
arv project create --name acme-prod-billing --region ap-south-1`,
        lang: 'bash',
      },
      {
        id: 'step-2',
        title: 'Step 2: Provision High-Performance Compute Instances',
        body: 'Launch virtual machines with dedicated vCPU and RAM allocations. Instances are provisioned in under 60 seconds through the Aravanta FastCloud orchestration engine with attached high-throughput NVMe block storage.',
        tip: 'Pass "--output json" to pipe outputs directly into jq or CI/CD pipelines.',
        code: `# Launch a compute instance (2 vCPU, 4GB RAM, Ubuntu 24.04 LTS)
arv compute create \\
  --name api-worker-01 \\
  --cpu 2 \\
  --ram 4096 \\
  --disk 120 \\
  --region ap-south-1

# List running virtual machine instances with public & private IPs
arv compute list --format table`,
        lang: 'bash',
      },
      {
        id: 'step-3',
        title: 'Step 3: Inspect Platform Telemetry & Unified Resources',
        body: 'Check live connection latency, backend health status, and unified resource topology across all infrastructure types directly from the command line or dashboard.',
        tip: 'Filter resources by type (compute, database, storage) for rapid SRE triage.',
        code: `# Inspect active cloud infrastructure status & network latency
arv status

# Check unified resources across all infrastructure categories
arv resource list --type compute --output table`,
        lang: 'bash',
      },
      {
        id: 'step-4',
        title: 'Step 4: Automate Deployments with CI/CD Non-Interactive Mode',
        body: 'Integrate the Aravanta CLI into GitHub Actions, GitLab CI, or Jenkins using environment variables without interactive prompts.',
        tip: 'Set ARAVANTA_TOKEN and ARAVANTA_API_URL in CI repository secrets.',
        code: `# Provide token in environment without interactive prompt
export ARAVANTA_TOKEN="arv_sec_live_948f2b7a"
export ARAVANTA_API_URL="https://arv-backend.vercel.app"

# Query resources headlessly
arv compute list --output json | jq '.[] | {id: .id, status: .status}'`,
        lang: 'bash',
      },
      {
        id: 'step-5',
        title: 'Step 5: Manage Instance Lifecycle & Session State',
        body: 'Stop, start, and restart compute instances on demand. Inspect active user credentials, tenant roles, and consumption counters.',
        tip: 'Stop non-production staging instances overnight to optimize FinOps spend.',
        code: `# Inspect active session identity and RBAC role
arv whoami

# Stop an active virtual machine
arv compute stop res-9cdc306743c7

# Start a stopped virtual machine
arv compute start res-9cdc306743c7`,
        lang: 'bash',
      },
    ],
  },

  concepts: {
    id: 'concepts',
    title: 'Core Concepts & Platform Primitives',
    category: 'Architecture',
    badge: 'Primitives Matrix',
    description:
      'Master the foundational primitives of Aravanta Cloud OS: Organizations, Projects, Sovereign Regions, 5-Tier RBAC, and Per-Second FinOps Metering.',
    sections: [
      {
        id: 'tenancy-hierarchy',
        title: 'Tenancy Hierarchy & Scoping',
        body: 'The tenancy model guarantees complete data and network isolation between independent customers and environment tiers.',
        bullets: [
          'Account ID: Unique enterprise identifier (e.g. ARV-ACC-891044).',
          'Organizations: Top-level governance boundary containing billing profiles and IAM rules.',
          'Projects: Logical groups for compute, Kubernetes, storage, and databases.',
          'VPC Network: Software-defined WireGuard mesh providing isolated CIDR blocks.',
        ],
        code: `# Set the default active project in your shell
arv config set project acme-prod-billing
arv config set region ap-south-1`,
        lang: 'bash',
      },
      {
        id: 'rbac-hierarchy',
        title: '5-Tier Server-Controlled RBAC',
        body: 'Access privileges are evaluated against PostgreSQL row-level security and JWT claims on every HTTP request. Client-side role overrides are strictly rejected at the API schema boundary.',
        metrics: [
          { label: 'SuperAdmin', value: 'Full Platform Access' },
          { label: 'Admin', value: 'Org & Billing Admin' },
          { label: 'Operator', value: 'Infra & Deployments' },
          { label: 'Developer', value: 'Workloads & Code' },
          { label: 'Viewer', value: 'Read-Only Audit' },
        ],
      },
    ],
  },

  compute: {
    id: 'compute',
    title: 'ArvCompute: Elastic Virtual Machines',
    category: 'Products',
    badge: 'AMD EPYC 9654',
    description:
      'Provision dedicated and burstable virtual machine instances powered by AMD EPYC and ARM Ampere architectures with attached NVMe SSD storage and keyless in-browser SSH.',
    sections: [
      {
        id: 'vm-shapes',
        title: 'Pre-Hardened VM Shapes & Specifications',
        body: 'All shapes include NVMe boot volumes, private IPv4 addresses, and access to internal sovereign DNS.',
        bullets: [
          'c3.micro: 1 vCPU, 2 GB RAM, 40 GB NVMe — Staging & light services',
          'c3.small: 2 vCPU, 4 GB RAM, 80 GB NVMe — API gateways & workers',
          'c3.medium: 4 vCPU, 8 GB RAM, 120 GB NVMe — PostgreSQL & microservice pods',
          'c3.large: 8 vCPU, 16 GB RAM, 250 GB NVMe — Production clusters & Redis',
          'c3.4xlarge: 16 vCPU, 64 GB RAM, 500 GB NVMe — High-throughput BFSI workloads',
        ],
        code: `# Create a c3.large instance with custom cloud-init script
arv compute create \\
  --name prod-api-gateway \\
  --shape c3.large \\
  --image ubuntu-24.04-lts \\
  --region ap-south-1 \\
  --user-data ./setup.sh`,
        lang: 'bash',
      },
      {
        id: 'web-terminal',
        title: 'Keyless Web Terminal & Instant SSH Connect',
        body: 'Connect to your virtual machines directly through the web terminal with full session recording, zero public SSH keys to download, and short-lived cryptographic tokens.',
        code: `# Connect to VM via arv CLI keyless proxy
arv compute connect prod-api-gateway

# Or open browser web terminal directly:
# Navigate to: https://aravantacos.vercel.app/console -> Compute -> Terminal`,
        lang: 'bash',
      },
    ],
  },

  k8s: {
    id: 'k8s',
    title: 'ArvKube: Production-Grade Managed Kubernetes',
    category: 'Products',
    badge: 'Kubernetes v1.30 Native',
    description:
      'Deploy, auto-scale, and operate production-ready Kubernetes clusters with multi-AZ replicated control planes, Calico eBPF networking, automated node pool scaling, and 1-click kubeconfig access.',
    sections: [
      {
        id: 'cluster-architecture',
        title: 'Managed Control Plane Architecture & 99.99% SLO',
        body: 'Every ArvKube cluster includes a dedicated, highly available Kubernetes control plane running across three independent availability zones with automated etcd backups, zero-downtime control plane patching, and managed API server endpoints.',
        metrics: [
          { label: 'Supported Versions', value: '1.28 • 1.29 • 1.30' },
          { label: 'Control Plane HA', value: '3-Node Multi-AZ' },
          { label: 'Network CNI', value: 'Calico eBPF' },
          { label: 'etcd Snapshots', value: 'Every 60 Minutes' },
        ],
        tip: 'ArvKube control planes are fully managed with zero maintenance fees; you only pay for the worker nodes you run.',
      },
      {
        id: 'cluster-creation',
        title: 'Provisioning a Cluster via CLI',
        body: 'Launch an enterprise Kubernetes cluster with dedicated worker node pools using a single declarative command.',
        code: `# 1. Provision 3-node managed cluster in ap-south-1
arv k8s cluster create \\
  --name sovereign-mesh-01 \\
  --nodes 3 \\
  --shape c3.large \\
  --version 1.30 \\
  --region ap-south-1

# 2. Download kubeconfig and merge into local ~/.kube/config
arv k8s get-kubeconfig --cluster sovereign-mesh-01 > ~/.kube/config

# 3. Verify node connectivity with kubectl
kubectl get nodes -o wide`,
        lang: 'bash',
      },
      {
        id: 'deployment-manifest',
        title: 'Production Kubernetes YAML Manifest Example',
        body: 'Deploy production workloads with readiness probes, liveness probes, and resource constraints configured for high availability.',
        code: `apiVersion: apps/v1
kind: Deployment
metadata:
  name: api-gateway
  namespace: default
  labels:
    app: api-gateway
spec:
  replicas: 3
  selector:
    matchLabels:
      app: api-gateway
  template:
    metadata:
      labels:
        app: api-gateway
    spec:
      containers:
      - name: api
        image: registry.aravanta.internal/prod/api:v2.4.2
        ports:
        - containerPort: 8080
        resources:
          limits:
            cpu: "2"
            memory: "4Gi"
          requests:
            cpu: "500m"
            memory: "1Gi"
        livenessProbe:
          httpGet:
            path: /healthz
            port: 8080
          initialDelaySeconds: 15
          periodSeconds: 10`,
        lang: 'yaml',
      },
    ],
  },

  storage: {
    id: 'storage',
    title: 'ArvStore: NVMe S3-Compatible Object Storage',
    category: 'Products',
    badge: 'S3 API v4',
    description:
      'High-throughput, S3-compatible distributed object storage engineered with sub-10ms TTFB, multipart uploads, bucket versioning, presigned URLs, and zero internal cross-service egress fees.',
    sections: [
      {
        id: 'bucket-management',
        title: 'Bucket Creation & Storage Classes',
        body: 'ArvStore buckets can be created instantly via CLI, REST API, or Python SDK. Supports Standard NVMe, Infrequent Access (IA), and Cold Archive tiers.',
        code: `# Create an S3-compatible bucket in ap-south-1
arv store create-bucket --name arv-assets-prod --tier STANDARD

# Upload asset with folder prefix
arv store upload \\
  --bucket arv-assets-prod \\
  --file ./dist/bundle.js \\
  --folder /v2.4.0/`,
        lang: 'bash',
      },
      {
        id: 'boto3-sdk',
        title: 'Standard AWS SDK / boto3 Compatibility',
        body: 'Drop-in replacement for AWS S3 with standard client libraries.',
        code: `import boto3

s3 = boto3.client(
    's3',
    endpoint_url='https://storage.aravanta.internal',
    aws_access_key_id='ARV_ACCESS_KEY_XXXXX',
    aws_secret_access_key='ARV_SECRET_KEY_XXXXX',
    region_name='ap-south-1'
)

# Upload file with metadata
s3.upload_file('report.pdf', 'arv-assets-prod', 'reports/annual-2026.pdf')`,
        lang: 'python',
      },
    ],
  },

  database: {
    id: 'database',
    title: 'ArvDB: Managed High-Availability Databases',
    category: 'Products',
    badge: 'PostgreSQL 16 & Redis',
    description:
      'Fully managed PostgreSQL and Redis database instances featuring PgBouncer connection pooling, automated point-in-time recovery, automated minor upgrades, and multi-AZ standby replication.',
    sections: [
      {
        id: 'pg-provisioning',
        title: 'Provisioning High-Availability PostgreSQL 16',
        body: 'Launch an isolated PostgreSQL 16 cluster with an active standby replica in a secondary availability zone.',
        code: `# Provision HA PostgreSQL instance
arv db create \\
  --name prod-db-primary \\
  --engine postgres \\
  --version 16 \\
  --ha \\
  --storage-gb 200 \\
  --region ap-south-1`,
        lang: 'bash',
      },
      {
        id: 'backups-pitr',
        title: 'Automated Snapshots & Point-in-Time Recovery',
        body: 'ArvDB streams WAL logs continuously to ArvStore, enabling transaction-level point-in-time recovery up to 35 days.',
        bullets: [
          'Zero-downtime daily full backups with automated checksum verification.',
          '1-click instant point-in-time restoration to any exact minute.',
          'SSL/TLS mandatory encryption in-transit (enforced TLS 1.3).',
        ],
      },
    ],
  },

  monitoring: {
    id: 'monitoring',
    title: 'ArvWatch: Observability & SRE Incident Management',
    category: 'Platform',
    badge: 'Prometheus & Loki',
    description:
      'End-to-end telemetry streaming, centralized Loki log aggregation, synthetic latency probes, and automated incident war-rooms.',
    sections: [
      {
        id: 'metrics-pipeline',
        title: 'Prometheus Metric Scraping & SLO Tracking',
        body: 'Infrastructure and container pods are scraped at 5-second intervals. P95 and P99 latencies are computed in real time.',
        code: `# Query live CPU utilization across cluster nodes
arv monitor query --expr 'avg(rate(container_cpu_usage_seconds_total[5m])) * 100'`,
        lang: 'bash',
      },
      {
        id: 'alerts-routing',
        title: 'Alert Routing & Self-Healing Runbooks',
        body: 'Route firing SLO breach alerts to Slack, PagerDuty, or trigger automated remediation webhooks (such as scaling worker pools or Canary rollback).',
      },
    ],
  },

  security: {
    id: 'security',
    title: 'Zero-Trust Identity, RBAC & Compliance',
    category: 'Platform',
    badge: 'RFC 6238 TOTP',
    description:
      'Server-enforced role-based access control, cryptographic authenticator pairing, sliding-window rate limiting, and immutable audit logs.',
    sections: [
      {
        id: 'totp-mfa',
        title: 'RFC 6238 Time-based One-Time Password (TOTP)',
        body: 'All administrative console logins require 30-second rotating cryptographic TOTP authenticator pairing (Google Authenticator, Authy, 1Password).',
        bullets: [
          'Sliding-window rate limiting: 5 failed attempts locks the account for 60 seconds.',
          'Immutable audit logging: Every administrative mutation is signed with actor IP and timestamp.',
          'DPDP Act 2023: Zero cross-border data transfer guarantee.',
        ],
      },
    ],
  },

  billing: {
    id: 'billing',
    title: 'FinOps Billing, Pricing & Invoicing',
    category: 'Platform',
    badge: 'INR (₹) Per-Second',
    description:
      'Per-second resource metering, configurable monthly budget caps, and automated GST tax invoices with PDF downloads.',
    sections: [
      {
        id: 'metering-rates',
        title: 'Unit Rate Schedule & FinOps Tracking',
        body: 'Pay strictly for the resources provisioned with zero hidden egress surcharges.',
        bullets: [
          'Compute (VMs): ₹1.50 per vCPU-hour',
          'RAM Allocation: ₹0.30 per GB-hour',
          'S3 Object Storage: ₹1.00 per GB-month (Zero internal egress)',
          'PostgreSQL HA: ₹2.50 per vCPU-hour',
          'GST Invoicing: Automated 18% (9% CGST + 9% SGST) monthly tax invoices',
        ],
      },
    ],
  },

  cli: {
    id: 'cli',
    title: 'Aravanta CLI Toolchain Reference',
    category: 'Reference',
    badge: 'Binary v2.4',
    description:
      'Official command-line client for managing all Aravanta Cloud OS resources, scripting CI/CD workflows, and headless orchestration.',
    sections: [
      {
        id: 'cli-install',
        title: 'Cross-Platform Installation',
        body: 'Install the native arv CLI on Windows, macOS, or Linux with zero external dependencies.',
        code: `# Windows (PowerShell):
[Net.ServicePointManager]::SecurityProtocol = 3072; irm https://aravantacos.vercel.app/install.ps1 | iex

# Linux & macOS (bash):
curl -fsSL https://aravantacos.vercel.app/install.sh | bash`,
        lang: 'bash',
      },
      {
        id: 'cli-commands',
        title: 'Core Command Structure',
        body: 'The CLI follows the uniform schema: arv [service] [action] [flags].',
        bullets: [
          'arv auth login: Authenticate via API token or browser OAuth',
          'arv compute list: List virtual machine instances',
          'arv k8s get-kubeconfig: Fetch cluster kubeconfig',
          'arv store upload: Upload objects to S3 storage bucket',
        ],
      },
    ],
  },

  terraform: {
    id: 'terraform',
    title: 'Aravanta Terraform Provider Guide',
    category: 'Reference',
    badge: 'Provider ~> 2.4',
    description:
      'Manage your sovereign cloud infrastructure declaratively using HashiCorp Terraform and OpenTofu.',
    sections: [
      {
        id: 'tf-provider',
        title: 'Provider Configuration Block',
        body: 'Configure the provider in your main.tf file with your sovereign region and API token.',
        code: `terraform {
  required_providers {
    aravanta = {
      source  = "aravanta/cloudos"
      version = "~> 2.4.0"
    }
  }
}

provider "aravanta" {
  region       = "ap-south-1"
  api_endpoint = "https://arv-backend.vercel.app/api/v1"
}

resource "aravanta_compute_instance" "api_gateway" {
  name          = "api-gateway-prod"
  instance_type = "c3.large"
  image         = "ubuntu-24.04-lts"
  disk_size_gb  = 120
}`,
        lang: 'hcl',
      },
    ],
  },

  sdk: {
    id: 'sdk',
    title: 'Software Development Kits (SDKs)',
    category: 'Reference',
    badge: 'Python & TypeScript',
    description:
      'Official client libraries for Python, Node.js/TypeScript, and Go with typed interfaces and async request support.',
    sections: [
      {
        id: 'python-sdk',
        title: 'Python SDK Example',
        body: 'Initialize the async client and manage storage buckets programmatically.',
        code: `from aravanta import CloudOSClient

client = CloudOSClient(
    token="arv_sec_live_948f2b7a",
    region="ap-south-1"
)

# Create an S3 object bucket
bucket = client.storage.create_bucket(name="telemetry-vault", tier="STANDARD")
print(f"Created bucket: {bucket.arn}")`,
        lang: 'python',
      },
    ],
  },

  openapi: {
    id: 'openapi',
    title: 'OpenAPI 3.1 & REST API Endpoints',
    category: 'Reference',
    badge: 'Swagger UI Hosted',
    description:
      'Direct programmatic access to the Aravanta Cloud OS control plane via RESTful JSON endpoints with JWT Bearer token authentication.',
    sections: [
      {
        id: 'rest-auth',
        title: 'Authentication & Base URL',
        body: 'All API requests must target https://arv-backend.vercel.app/api/v1 and include the Authorization: Bearer {token} header.',
        code: `# Authenticate and retrieve bearer token
curl -X POST "https://arv-backend.vercel.app/api/v1/auth/login" \\
  -H "Content-Type: application/json" \\
  -d '{"email":"admin@enterprise.in","password":"SecurePassword123!"}'`,
        lang: 'bash',
      },
      {
        id: 'swagger-link',
        title: 'Interactive Swagger UI Documentation',
        body: 'Explore all 40+ endpoints interactively, view request/response schemas, and execute test requests in your browser.',
        bullets: [
          'Swagger UI: https://arv-backend.vercel.app/docs',
          'OpenAPI 3.1 JSON Schema: https://arv-backend.vercel.app/api/v1/openapi.json',
        ],
      },
    ],
  },
};

export const DocumentationPage: React.FC<PageProps> = ({
  onGoToLogin,
  onGoToRegister,
  onOpenCommandPalette,
  onNavigate,
  onGoToConsole,
}) => {
  const [query, setQuery] = useState('');
  const [activeGroup, setActiveGroup] = useState<string>('k8s');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const searchContainerRef = useRef<HTMLDivElement>(null);
  const articleRef = useRef<HTMLElement>(null);

  // Global '/' hotkey to focus search bar & outside click handling
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        e.key === '/' &&
        !(e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement)
      ) {
        e.preventDefault();
        searchInputRef.current?.focus();
        setIsSearchOpen(true);
      }
      if (e.key === 'Escape') {
        setIsSearchOpen(false);
      }
    };

    const handleClickOutside = (e: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target as Node)) {
        setIsSearchOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const filteredSidebar = useMemo(() => {
    if (!query.trim()) return sidebarTree;
    const q = query.trim().toLowerCase();
    return sidebarTree
      .map((g) => ({
        ...g,
        items: g.items.filter(
          (i) =>
            i.label.toLowerCase().includes(q) ||
            i.id.toLowerCase().includes(q)
        ),
      }))
      .filter((g) => g.items.length > 0);
  }, [query]);

  // Real-time documentation match suggestions across all articles
  const searchMatches = useMemo(() => {
    if (!query.trim()) return [];
    const q = query.trim().toLowerCase();
    const results: { title: string; subtitle: string; topicId: string; subSectionId?: string; type: string }[] = [];

    // Search across all docArticles
    Object.values(docArticles).forEach((article) => {
      if (
        article.title.toLowerCase().includes(q) ||
        article.description.toLowerCase().includes(q)
      ) {
        results.push({
          title: article.title,
          subtitle: `${article.category} • ${article.badge}`,
          topicId: article.id,
          type: 'Document',
        });
      }

      article.sections.forEach((sec) => {
        if (
          sec.title.toLowerCase().includes(q) ||
          sec.body.toLowerCase().includes(q) ||
          (sec.code && sec.code.toLowerCase().includes(q))
        ) {
          results.push({
            title: sec.title,
            subtitle: `${article.title}`,
            topicId: article.id,
            subSectionId: sec.id,
            type: 'Section',
          });
        }
      });
    });

    return results.slice(0, 6);
  }, [query]);

  // Get active article data (fallback to k8s or intro)
  const currentArticle = docArticles[activeGroup] || docArticles['k8s'] || docArticles['intro'];

  // Track active sub-section for Table of Contents scroll spy
  const [activeSectionId, setActiveSectionId] = useState<string>(
    () => currentArticle.sections[0]?.id || ''
  );

  // Smooth scroll with 88px clearance below the sticky navbar
  const scrollToElement = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      const navOffset = 88; // 64px navbar + 24px comfortable spacing
      const elementPosition = el.getBoundingClientRect().top + window.scrollY;
      window.scrollTo({
        top: Math.max(0, elementPosition - navOffset),
        behavior: 'smooth',
      });
      setActiveSectionId(id);
    }
  };

  const scrollToArticle = () => {
    if (articleRef.current) {
      const navOffset = 88;
      const elementPosition = articleRef.current.getBoundingClientRect().top + window.scrollY;
      window.scrollTo({
        top: Math.max(0, elementPosition - navOffset),
        behavior: 'smooth',
      });
    }
  };

  const handleSelectSearchMatch = (topicId: string, subSectionId?: string) => {
    setActiveGroup(topicId);
    setQuery('');
    setTimeout(() => {
      if (subSectionId) {
        scrollToElement(subSectionId);
        return;
      }
      scrollToArticle();
    }, 100);
  };

  const handleTopicClick = (topicId: string) => {
    setActiveGroup(topicId);
    setTimeout(() => {
      scrollToArticle();
    }, 50);
  };

  // Real-time Scroll Spy to highlight the active section in the Table of Contents
  useEffect(() => {
    if (!currentArticle.sections || currentArticle.sections.length === 0) return;
    setActiveSectionId(currentArticle.sections[0]?.id || '');

    const handleScroll = () => {
      const scrollPosition = window.scrollY + 120;
      const sections = currentArticle.sections
        .map((s) => document.getElementById(s.id))
        .filter(Boolean) as HTMLElement[];

      for (let i = sections.length - 1; i >= 0; i--) {
        const el = sections[i];
        if (el.offsetTop <= scrollPosition) {
          setActiveSectionId(el.id);
          break;
        }
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [currentArticle]);

  // Calculate prev and next topics for footer navigation
  const allItems = useMemo(() => {
    return sidebarTree.flatMap((g) => g.items);
  }, []);

  const currentIndex = allItems.findIndex((item) => item.id === activeGroup);
  const prevTopic = currentIndex > 0 ? allItems[currentIndex - 1] : null;
  const nextTopic = currentIndex < allItems.length - 1 ? allItems[currentIndex + 1] : null;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-brandObsidian-950 font-sans antialiased text-slate-900 dark:text-slate-100 selection:bg-brandGold-500/30 selection:text-brandGold-900 dark:selection:text-brandGold-100">
      <Navbar
        onGoToLogin={onGoToLogin}
        onGoToRegister={onGoToRegister}
        onOpenCommandPalette={onOpenCommandPalette}
        onNavigate={onNavigate}
        onGoToConsole={onGoToConsole}
        currentView="documentation"
      />

      <main>
        {/* Top Header & Search Hero */}
        <section className="relative pt-12 pb-8 border-b border-slate-200 dark:border-brandObsidian-800 bg-white/40 dark:bg-brandObsidian-900/30">
          <div aria-hidden className="absolute inset-x-0 top-0 -z-10 h-[380px] bg-hero-radial opacity-70 pointer-events-none overflow-hidden" />
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35 }}
              className="max-w-3xl mx-auto text-center space-y-4"
            >
              <div className="inline-flex items-center gap-2">
                <Badge variant="gold" size="md" dot>
                  <BookOpen className="w-3.5 h-3.5" /> v2.4 Sovereign Documentation
                </Badge>
              </div>
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-slate-900 dark:text-white leading-[1.08]">
                Aravanta Cloud OS Documentation
              </h1>
              <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 leading-relaxed font-normal">
                Comprehensive developer guides, CLI toolchain references, and API architecture for sovereign cloud primitives.
              </p>

              {/* Search Bar */}
              <div className="max-w-2xl mx-auto pt-2">
                <div ref={searchContainerRef} className="relative z-40">
                  <Input
                    ref={searchInputRef}
                    size="lg"
                    value={query}
                    onFocus={() => setIsSearchOpen(true)}
                    onChange={(e) => {
                      setQuery(e.target.value);
                      setIsSearchOpen(true);
                    }}
                    placeholder='Search docs: "Kubernetes", "compute shapes", "S3 store", "TOTP MFA"...'
                    leftIcon={<Search className="w-5 h-5 text-brandGold-500" />}
                    rightIcon={
                      !query ? (
                        <kbd className="hidden sm:inline-flex items-center justify-center h-6 px-2 rounded-md border border-slate-200 dark:border-brandObsidian-700 text-[11px] font-mono font-semibold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-brandObsidian-800/80">
                          /
                        </kbd>
                      ) : undefined
                    }
                    wrapperClassName="!rounded-2xl !shadow-lg !bg-white dark:!bg-brandObsidian-900 border border-slate-300 dark:border-brandObsidian-700"
                    clearable
                    onClear={() => {
                      setQuery('');
                      setIsSearchOpen(false);
                    }}
                  />

                  {/* Live Search Quick Results Dropdown */}
                  {isSearchOpen && searchMatches.length > 0 && (
                    <div className="absolute top-full left-0 right-0 mt-2 bg-white/95 dark:bg-[#0B0F17]/95 backdrop-blur-xl border border-slate-200 dark:border-brandObsidian-700/80 rounded-2xl shadow-2xl z-50 p-2 text-left animate-fadeIn max-h-[min(380px,65vh)] overflow-y-auto scrollbar-thin">
                      <div className="flex items-center justify-between px-3 py-1.5 text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400 border-b border-slate-100 dark:border-brandObsidian-800/80 pb-1.5 mb-1">
                        <span>Matching Documentation Topics ({searchMatches.length})</span>
                        <span className="text-[10px] text-slate-500 font-normal">esc to close</span>
                      </div>
                      <div className="space-y-1">
                        {searchMatches.map((res, i) => (
                          <button
                            key={i}
                            type="button"
                            onClick={() => {
                              handleSelectSearchMatch(res.topicId, res.subSectionId);
                              setIsSearchOpen(false);
                            }}
                            className="w-full flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-100 dark:hover:bg-brandObsidian-800/80 transition-colors text-left group cursor-pointer"
                          >
                            <div className="min-w-0 flex-1 pr-2">
                              <div className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white group-hover:text-brandGold-600 dark:group-hover:text-brandGold-400 transition-colors truncate">
                                {res.title}
                              </div>
                              <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate mt-0.5 font-mono">
                                {res.subtitle}
                              </div>
                            </div>
                            <span className="shrink-0 text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-100 dark:bg-brandObsidian-800 text-slate-500 font-semibold ml-2 group-hover:bg-brandGold-500/10 group-hover:text-brandGold-500 transition-colors">
                              {res.type}
                            </span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Popular Keywords Row */}
                <div className="flex flex-wrap items-center justify-center gap-2 pt-2.5 text-xs text-slate-500 dark:text-slate-400">
                  <span className="font-semibold uppercase tracking-wider text-[11px]">Popular:</span>
                  {[
                    { term: 'Managed Kubernetes', id: 'k8s' },
                    { term: 'Compute VMs', id: 'compute' },
                    { term: 'S3 Store', id: 'storage' },
                    { term: 'PostgreSQL HA', id: 'database' },
                    { term: 'CLI Toolchain', id: 'cli' },
                  ].map((t) => (
                    <button
                      key={t.term}
                      type="button"
                      onClick={() => handleTopicClick(t.id)}
                      className="px-2.5 py-0.5 rounded-full border border-slate-200 dark:border-brandObsidian-700 hover:border-brandGold-500/50 hover:text-brandGold-600 dark:hover:text-brandGold-400 transition-colors cursor-pointer text-xs"
                    >
                      {t.term}
                    </button>
                  ))}
                </div>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Documentation Content Layout */}
        <section className="py-8 sm:py-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-start">
              
              {/* Left Column: Rock-Solid Sticky Sidebar Navigation (3 cols) */}
              <aside className="lg:col-span-3 hidden lg:block sticky top-20 self-start max-h-[calc(100vh-5.5rem)] overflow-y-auto pr-3 pb-8 overscroll-contain scrollbar-thin space-y-6">
                <div>
                  <div className="flex items-center justify-between text-[11px] uppercase font-bold tracking-wider text-slate-500 dark:text-slate-400 mb-2.5 px-2 font-mono">
                    <span>Table of contents</span>
                    <span className="text-[10px] text-brandGold-600 dark:text-brandGold-400 font-semibold bg-brandGold-500/10 px-2 py-0.5 rounded-full">
                      {sidebarTree.reduce((acc, g) => acc + g.items.length, 0)} docs
                    </span>
                  </div>
                  <nav className="space-y-4">
                    {filteredSidebar.map((group) => (
                      <div key={group.group}>
                        <div className="px-2 text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-1 font-mono">
                          {group.group}
                        </div>
                        <ul className="space-y-0.5">
                          {group.items.map((item) => {
                            const Icon = item.icon;
                            const isActive = activeGroup === item.id;
                            return (
                              <li key={item.id}>
                                <button
                                  onClick={() => handleTopicClick(item.id)}
                                  className={[
                                    'w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs sm:text-sm transition-all text-left cursor-pointer font-medium',
                                    isActive
                                      ? 'bg-brandGold-500/15 text-brandGold-600 dark:text-brandGold-400 font-bold border border-brandGold-500/40 shadow-xs'
                                      : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-brandObsidian-850 hover:text-slate-900 dark:hover:text-white',
                                  ].join(' ')}
                                >
                                  <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-brandGold-500' : 'text-slate-400'}`} />
                                  <span className="truncate flex-1">{item.label}</span>
                                  {isActive && (
                                    <span className="w-1.5 h-1.5 rounded-full bg-brandGold-500 shrink-0" />
                                  )}
                                </button>
                              </li>
                            );
                          })}
                        </ul>
                      </div>
                    ))}
                  </nav>
                </div>

                {/* Dynamic 'On this page' Sub-Section Outline with Scroll Spy */}
                <Card className="bg-white dark:bg-brandObsidian-900 border-slate-200 dark:border-brandObsidian-800 shadow-sm">
                  <CardBody className="!p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <FolderTree className="w-4 h-4 text-brandGold-500" />
                        <h3 className="text-xs font-bold uppercase tracking-wider font-mono text-slate-800 dark:text-slate-200">
                          On this page
                        </h3>
                      </div>
                      <span className="text-[10px] font-mono text-slate-400">
                        {currentArticle.sections.length} parts
                      </span>
                    </div>
                    <ol className="space-y-1 text-xs text-slate-600 dark:text-slate-300 font-medium">
                      {currentArticle.sections.map((sec, idx) => {
                        const isSectionActive = activeSectionId === sec.id;
                        return (
                          <li key={sec.id}>
                            <button
                              onClick={() => scrollToElement(sec.id)}
                              className={[
                                'w-full flex items-start gap-2 py-1.5 px-2 rounded-lg text-left transition-all cursor-pointer group text-xs',
                                isSectionActive
                                  ? 'bg-brandGold-500/15 text-brandGold-600 dark:text-brandGold-400 font-bold border-l-2 border-brandGold-500 pl-2'
                                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-brandObsidian-800/60',
                              ].join(' ')}
                            >
                              <span
                                className={`text-[10px] font-mono font-bold w-3.5 shrink-0 ${
                                  isSectionActive
                                    ? 'text-brandGold-500'
                                    : 'text-slate-400 dark:text-slate-500 group-hover:text-brandGold-500'
                                }`}
                              >
                                {idx + 1}.
                              </span>
                              <span className="truncate leading-tight flex-1">{sec.title}</span>
                            </button>
                          </li>
                        );
                      })}
                    </ol>
                  </CardBody>
                </Card>
              </aside>

              {/* Right Column: Active Documentation Article (9 cols) */}
              <article
                ref={articleRef}
                id="doc-article-container"
                className="lg:col-span-9 space-y-6 sm:space-y-8 scroll-mt-28"
              >
                {/* Mobile Quick Navigator Bar (< lg) */}
                <div className="lg:hidden p-4 rounded-2xl bg-white dark:bg-brandObsidian-900 border border-slate-200 dark:border-brandObsidian-800 shadow-sm space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-xs font-mono font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                      <FolderTree className="w-4 h-4 text-brandGold-500" />
                      <span>Table of Contents</span>
                    </div>
                    <Badge variant="gold" size="sm">
                      {currentArticle.badge}
                    </Badge>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[10px] font-mono uppercase text-slate-400 mb-1">
                        Topic
                      </label>
                      <select
                        value={activeGroup}
                        onChange={(e) => handleTopicClick(e.target.value)}
                        className="w-full text-xs font-medium bg-slate-50 dark:bg-brandObsidian-850 border border-slate-200 dark:border-brandObsidian-700 rounded-xl px-3 py-2 text-slate-800 dark:text-slate-200 focus:outline-none focus:border-brandGold-500 cursor-pointer"
                      >
                        {sidebarTree.map((g) => (
                          <optgroup key={g.group} label={g.group}>
                            {g.items.map((item) => (
                              <option key={item.id} value={item.id}>
                                {item.label}
                              </option>
                            ))}
                          </optgroup>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-[10px] font-mono uppercase text-slate-400 mb-1">
                        Jump to section
                      </label>
                      <select
                        value={activeSectionId}
                        onChange={(e) => scrollToElement(e.target.value)}
                        className="w-full text-xs font-medium bg-slate-50 dark:bg-brandObsidian-850 border border-slate-200 dark:border-brandObsidian-700 rounded-xl px-3 py-2 text-slate-800 dark:text-slate-200 focus:outline-none focus:border-brandGold-500 cursor-pointer"
                      >
                        {currentArticle.sections.map((sec, idx) => (
                          <option key={sec.id} value={sec.id}>
                            {idx + 1}. {sec.title}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                {/* Article Header Banner */}
                <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-brandObsidian-900 border border-slate-200/90 dark:border-brandObsidian-800 shadow-sm space-y-4">
                  {/* Breadcrumb Row */}
                  <div className="flex flex-wrap items-center gap-2 text-xs font-mono text-slate-500 dark:text-slate-400">
                    <button
                      onClick={() => onNavigate?.('home')}
                      className="hover:text-brandGold-500 cursor-pointer"
                    >
                      Home
                    </button>
                    <span>/</span>
                    <span>Docs</span>
                    <span>/</span>
                    <span className="text-brandGold-600 dark:text-brandGold-400 font-bold">
                      {currentArticle.category}
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-2.5">
                    <Badge variant="gold" size="sm">
                      {currentArticle.badge}
                    </Badge>
                    <span className="text-xs font-mono text-emerald-600 dark:text-emerald-400 flex items-center gap-1 font-semibold">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                      Production GA
                    </span>
                  </div>

                  <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black text-slate-900 dark:text-white tracking-tight leading-tight">
                    {currentArticle.title}
                  </h2>

                  <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 leading-relaxed font-normal">
                    {currentArticle.description}
                  </p>
                </div>

                {/* Article Sub-Sections */}
                <div className="space-y-8">
                  {currentArticle.sections.map((sec, secIdx) => (
                    <section
                      key={sec.id}
                      id={sec.id}
                      className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-brandObsidian-900 border border-slate-200/90 dark:border-brandObsidian-800 shadow-sm space-y-5 scroll-mt-28 relative"
                    >
                      <div className="flex items-start gap-4">
                        <div className="w-8 h-8 rounded-xl bg-brandGold-500/10 text-brandGold-600 dark:text-brandGold-400 border border-brandGold-500/20 flex items-center justify-center font-mono font-bold text-xs shrink-0 mt-0.5">
                          0{secIdx + 1}
                        </div>
                        <div className="space-y-1 flex-1">
                          <h3 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                            {sec.title}
                          </h3>
                        </div>
                      </div>

                      <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 leading-relaxed font-normal pl-12">
                        {sec.body}
                      </p>

                      {/* Bullets List */}
                      {sec.bullets && sec.bullets.length > 0 && (
                        <div className="pl-12 space-y-2">
                          {sec.bullets.map((bullet, bIdx) => (
                            <div key={bIdx} className="flex items-start gap-2.5 text-xs sm:text-sm text-slate-700 dark:text-slate-300">
                              <span className="w-4 h-4 rounded-full bg-brandGold-500/15 text-brandGold-600 dark:text-brandGold-400 flex items-center justify-center shrink-0 mt-0.5 text-[10px]">
                                ✓
                              </span>
                              <span>{bullet}</span>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Metrics Strip */}
                      {sec.metrics && sec.metrics.length > 0 && (
                        <div className="pl-12 grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
                          {sec.metrics.map((m) => (
                            <div
                              key={m.label}
                              className="p-3 rounded-xl bg-slate-50 dark:bg-brandObsidian-800/60 border border-slate-200/80 dark:border-brandObsidian-700/60"
                            >
                              <div className="text-[10px] font-mono uppercase font-bold text-slate-400">
                                {m.label}
                              </div>
                              <div className="text-sm font-black text-slate-900 dark:text-white mt-0.5">
                                {m.value}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Pro Tip Box */}
                      {sec.tip && (
                        <div className="ml-12 flex items-start gap-3 rounded-2xl border border-brandGold-500/30 bg-brandGold-500/5 p-4">
                          <Lightbulb className="w-4 h-4 text-brandGold-500 shrink-0 mt-0.5" />
                          <p className="text-xs sm:text-sm text-brandGold-800 dark:text-brandGold-300 leading-relaxed">
                            <strong className="font-bold">Pro tip:</strong> {sec.tip}
                          </p>
                        </div>
                      )}

                      {/* Code Block */}
                      {sec.code && (
                        <div className="pl-12 pt-2">
                          <CodeBlock code={sec.code} language={sec.lang || 'bash'} />
                        </div>
                      )}
                    </section>
                  ))}
                </div>

                {/* Next & Previous Topic Navigation Footer */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-slate-200 dark:border-brandObsidian-800">
                  {prevTopic ? (
                    <button
                      onClick={() => handleTopicClick(prevTopic.id)}
                      className="p-4 rounded-2xl border border-slate-200 dark:border-brandObsidian-800 bg-white dark:bg-brandObsidian-900 hover:border-brandGold-500/50 transition-all text-left space-y-1 cursor-pointer group"
                    >
                      <div className="text-[10px] font-mono font-bold uppercase text-slate-400 flex items-center gap-1">
                        <ChevronLeft className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform" />
                        <span>Previous Topic</span>
                      </div>
                      <div className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-brandGold-500 transition-colors">
                        {prevTopic.label}
                      </div>
                    </button>
                  ) : <div />}

                  {nextTopic ? (
                    <button
                      onClick={() => handleTopicClick(nextTopic.id)}
                      className="p-4 rounded-2xl border border-slate-200 dark:border-brandObsidian-800 bg-white dark:bg-brandObsidian-900 hover:border-brandGold-500/50 transition-all text-right space-y-1 cursor-pointer group sm:ml-auto w-full sm:max-w-xs"
                    >
                      <div className="text-[10px] font-mono font-bold uppercase text-slate-400 flex items-center justify-end gap-1">
                        <span>Next Topic</span>
                        <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                      </div>
                      <div className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-brandGold-500 transition-colors">
                        {nextTopic.label}
                      </div>
                    </button>
                  ) : <div />}
                </div>

                {/* Call to Action Banner */}
                <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#121929] via-[#090d16] to-[#04070c] border border-brandGold-500/30 text-white shadow-2xl p-8 sm:p-10 text-center space-y-4">
                  <div className="inline-flex items-center gap-2">
                    <Badge variant="gold" size="sm">
                      <Sparkles className="w-3.5 h-3.5" /> Start Free in ap-south-1
                    </Badge>
                  </div>
                  <h3 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                    Deploy Sovereign Infrastructure in Under 3 Minutes
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-300 max-w-xl mx-auto leading-relaxed">
                    Get ₹4,000 free testing credits automatically applied to your account. Zero foreign egress taxes and instant multi-node provisioning.
                  </p>
                  <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                    <Button
                      size="lg"
                      variant="primary"
                      onClick={onGoToRegister}
                      className="bg-brandGold-500 hover:bg-brandGold-600 text-brandObsidian-950 font-bold text-sm cursor-pointer shadow-md"
                      rightIcon={<ArrowRight className="w-4 h-4" />}
                    >
                      Create Sovereign Workspace
                    </Button>
                    <Button
                      size="lg"
                      variant="outline"
                      onClick={() => onNavigate?.('cli')}
                      className="border-white/20 bg-white/5 hover:bg-white/10 text-white font-bold text-sm cursor-pointer"
                      leftIcon={<Terminal className="w-4 h-4 text-brandGold-400" />}
                    >
                      Web Terminal
                    </Button>
                  </div>
                </div>
              </article>
            </div>
          </div>
        </section>
      </main>

      <Footer onNavigate={onNavigate} onGoToLogin={onGoToLogin} onGoToRegister={onGoToRegister} />
    </div>
  );
};
