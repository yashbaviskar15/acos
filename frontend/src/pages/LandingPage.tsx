import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence, Variants } from 'framer-motion';
import {
  ArrowRight,
  ShieldCheck,
  Server,
  HardDrive,
  Database,
  GitBranch,
  Activity,
  AlertTriangle,
  Lock,
  Check,
  ChevronRight,
  Globe2,
  BarChart3,
  Shield,
  Boxes,
  BookOpen,
  Terminal,
  UploadCloud,
  FileText,
  Copy,
  Zap,
  Folder,
  LayoutGrid,
  MessageSquare,
} from 'lucide-react';

import { Navbar, LandingView } from '../components/ui/Navbar';
import { Footer } from '../components/ui/Footer';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Card, CardBody } from '../components/ui/Card';
import {
  TabContainer,
  TabList,
  Tab,
  TabPanel,
} from '../components/ui/Tabs';
import {
  Accordion,
  AccordionItem,
  AccordionHeader,
  AccordionBody,
} from '../components/ui/Accordion';
import { CodeBlock } from '../components/ui/CopyButton';

interface LandingPageProps {
  onGoToLogin: () => void;
  onGoToRegister: () => void;
  onOpenCommandPalette?: () => void;
  onNavigate?: (view: LandingView) => void;
  onGoToConsole?: () => void;
}

const prefersReducedMotion = () =>
  typeof window !== 'undefined' &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// ── Verified Developer CLI & API Code Snippets ──
const codeSnippets: Record<string, string> = {
  cli: `# 1. Install Aravanta CLI v2.0 (Zero Repo Dependency)
# Windows (PowerShell):
[Net.ServicePointManager]::SecurityProtocol = 3072; irm https://aravantacos.vercel.app/install.ps1 | iex
# macOS / Linux (cURL):
curl -fsSL https://aravantacos.vercel.app/install.sh | bash

# 2. Check health & connect to live control plane
aravanta status

# 3. Provision compute instance with NVMe block storage
aravanta compute create --name api-worker-01 --cpu 2 --ram 4096 --region ap-south-1

# 4. Upload build artifacts to S3 bucket with folder prefix
aravanta store upload --bucket arv-assets-prod --file dist/app.bundle.js --folder /v1.2.0/

✓ Resource provisioned (State: RUNNING)
  Private IP: 10.240.0.12  •  Provider: FastCloud-v1  •  Egress: ₹0.50/GB`,
  terraform: `# Multi-Region Aravanta CloudOS Provider Configuration
terraform {
  required_providers {
    aravanta = {
      source  = "aravanta/cloudos"
      version = "~> 1.0.0"
    }
  }
}

provider "aravanta" {
  api_endpoint = "https://arv-backend.vercel.app/api/v1"
  region       = "ap-south-1"
}

resource "aravanta_compute_instance" "api_gateway" {
  name          = "api-gateway-prod"
  instance_type = "c3.large"
  region        = "ap-south-1"
  image         = "ubuntu-24.04-lts"

  disk {
    size_gb = 120
    type    = "nvme-ssd"
  }

  tags = {
    environment = "production"
    finops_cost = "core-infrastructure"
  }
}

resource "aravanta_storage_bucket" "assets" {
  name          = "arv-assets-prod"
  region        = "ap-south-1"
  storage_class = "STANDARD"
  access        = "PRIVATE"
  versioning    = true
}`,
  rest: `# Authenticate & Obtain Bearer JWT Token
curl -X POST "https://arv-backend.vercel.app/api/v1/auth/login" \\
  -H "Content-Type: application/json" \\
  -d '{
    "email": "operator@company.in",
    "password": "SecurePassword123!"
  }'

# Provision High-Performance Compute Instance
curl -X POST "https://arv-backend.vercel.app/api/v1/compute/instances" \\
  -H "Authorization: Bearer $ARAVANTA_TOKEN" \\
  -H "Content-Type: application/json" \\
  -d '{
    "name": "worker-pool-01",
    "instance_type": "c3.large",
    "region": "ap-south-1",
    "image": "ubuntu-24.04",
    "disk_size_gb": 120
  }'

# HTTP 201 Created
# {"id":"cmp_7f3da1b2","status":"RUNNING","region":"ap-south-1","uptime":"99.99%"}`,
  sdk: `import { AravantaClient } from '@aravanta/sdk';

// Initialize with workspace token and primary sovereign region
const client = new AravantaClient({
  token: process.env.ARAVANTA_TOKEN,
  region: 'ap-south-1',
});

async function deployStack() {
  // 1. Create S3 Storage Bucket with versioning enabled
  const bucket = await client.storage.buckets.create({
    name: 'arv-production-vault',
    storageClass: 'STANDARD',
    access: 'PRIVATE',
    versioning: true,
  });

  // 2. Trigger GitOps canary rollout with 25% traffic slice
  const deployment = await client.operations.deployments.trigger({
    service: 'api-gateway',
    tag: 'v2.4.2',
    strategy: 'canary',
    canaryWeight: 25,
  });

  console.log(\`Bucket: \${bucket.name} | Canary Deployment: \${deployment.id}\`);
}

deployStack();`,
};

// ── Verified 6-Step Application Workflow ──
const workflowSteps = [
  {
    key: 'auth',
    step: '01',
    name: 'Register & Authenticate',
    icon: Lock,
    title: 'Account registration with TOTP 2FA & invite tokens',
    desc: 'Create your account or join an existing workspace via invitation token (ARV-ACC-XXXXXX). Secure your account with RFC 6238 30-second TOTP multi-factor authentication and brute-force lockout protection.',
    metrics: [
      { label: 'MFA Standard', value: 'RFC 6238' },
      { label: 'Rate Limiting', value: '5 Failures / 60s' },
    ],
  },
  {
    key: 'rbac',
    step: '02',
    name: 'Workspace Governance',
    icon: ShieldCheck,
    title: 'Server-enforced 5-tier role-based access control',
    desc: 'Assign granular permissions strictly controlled by the database schema: SuperAdmin, Admin, Operator, Developer, and Viewer. Client-side role overrides are strictly rejected at the API boundary.',
    metrics: [
      { label: 'Role Tiers', value: '5 Roles' },
      { label: 'Audit Logging', value: 'Cryptographic' },
    ],
  },
  {
    key: 'provision',
    step: '03',
    name: 'Provision Infrastructure',
    icon: Server,
    title: 'Multi-cloud compute, Kubernetes, databases & S3 storage',
    desc: 'Spin up virtual machines, managed Kubernetes clusters (ArvKube), high-availability PostgreSQL/Redis databases (ArvDB), and S3 object buckets (ArvStore) through visual forms, CLI, or Terraform.',
    metrics: [
      { label: 'Provision Time', value: '< 60s' },
      { label: 'Primary Region', value: 'ap-south-1' },
    ],
  },
  {
    key: 'deploy',
    step: '04',
    name: 'Workloads & Files',
    icon: GitBranch,
    title: 'GitOps delivery pipelines & structured S3 file management',
    desc: 'Automate releases with 25% progressive canary traffic gates and sub-second rollback triggers. Upload, preview, and organize files in S3 buckets with drag-and-drop and folder prefixes.',
    metrics: [
      { label: 'Canary Slices', value: '25% - 50% - 100%' },
      { label: 'Max File Size', value: '100 MB / file' },
    ],
  },
  {
    key: 'observe',
    step: '05',
    name: 'Observe & Triage',
    icon: Activity,
    title: 'Sub-second telemetry & automated incident war-rooms',
    desc: 'Stream Prometheus metrics, explore live Loki logs, and triage firing alert rules. When incidents occur, assign commanders, log timestamps, and execute self-healing automated runbooks.',
    metrics: [
      { label: 'Telemetry Stream', value: '< 10ms' },
      { label: 'Auto-Healing', value: 'Runbook Driven' },
    ],
  },
  {
    key: 'finops',
    step: '06',
    name: 'Cost & Invoicing',
    icon: BarChart3,
    title: 'Per-second metering in INR (₹) with GST tax invoices',
    desc: 'Real-time FinOps cost tracking across compute, storage, databases, and bandwidth. Set strict project budget caps and generate GST-compliant tax invoices with PDF and WebCopy download.',
    metrics: [
      { label: 'Billing Precision', value: 'Per-Second' },
      { label: 'Tax Compliance', value: 'CGST + SGST (18%)' },
    ],
  },
];

// ── Verified Core Platform Capabilities ──
const capabilities = [
  {
    icon: Server,
    category: 'Compute & VMs',
    title: 'ArvCompute Virtual Machines',
    desc: 'Elastic virtual instances with configurable CPU/RAM shapes, attached NVMe block volumes, snapshots, and non-prod auto-suspend.',
    route: 'features' as LandingView,
    tag: 'Infrastructure',
  },
  {
    icon: Boxes,
    category: 'Containers & Clusters',
    title: 'ArvKube Managed Kubernetes',
    desc: 'Production-ready Kubernetes control planes with auto-scaling node pools, Calico eBPF networking, and live pod telemetry.',
    route: 'features' as LandingView,
    tag: 'Orchestration',
  },
  {
    icon: HardDrive,
    category: 'Object Storage',
    title: 'ArvStore S3 Buckets & Files',
    desc: 'S3-compatible object storage with drag-drop uploads, folder prefixing, storage classes (Standard, Glacier), and secure download URLs.',
    route: 'features' as LandingView,
    tag: 'Storage',
  },
  {
    icon: Database,
    category: 'Managed Databases',
    title: 'ArvDB PostgreSQL & Redis',
    desc: 'High-availability PostgreSQL and Redis engines with environment-aware sizing, automated snapshots, and connection pooling.',
    route: 'features' as LandingView,
    tag: 'Databases',
  },
  {
    icon: GitBranch,
    category: 'GitOps Delivery',
    title: 'CI/CD Pipelines & Canary Releases',
    desc: 'Progressive canary traffic splits with automated synthetic error-rate gates and 1-click instantaneous rollback upon SLO breach.',
    route: 'features' as LandingView,
    tag: 'Delivery',
  },
  {
    icon: Activity,
    category: 'SRE Observability',
    title: 'ArvWatch Real-Time Telemetry',
    desc: 'Sub-second metrics, structured Loki log explorer, firing alert triage, and Prometheus scrapers for fleet-wide visibility.',
    route: 'documentation' as LandingView,
    tag: 'Observability',
  },
  {
    icon: AlertTriangle,
    category: 'Incident SRE',
    title: 'War-Room Incident Command',
    desc: 'Centralized incident response center with commander assignment, timestamped timeline recording, and self-healing runbook execution.',
    route: 'features' as LandingView,
    tag: 'Operations',
  },
  {
    icon: ShieldCheck,
    category: 'Governance & IAM',
    title: '5-Tier RBAC & Security Matrix',
    desc: 'Server-controlled role hierarchy (SuperAdmin to Viewer), TOTP multi-factor authentication, and cryptographically verified audit trails.',
    route: 'documentation' as LandingView,
    tag: 'Security',
  },
  {
    icon: BarChart3,
    category: 'FinOps & Billing',
    title: 'Indian Rupee (₹) Cost Governance',
    desc: 'Transparent per-second consumption rates, real-time service cost breakdown, monthly budget caps, and GST-compliant PDF invoices.',
    route: 'pricing' as LandingView,
    tag: 'FinOps',
  },
  {
    icon: Terminal,
    category: 'Developer Tools',
    title: 'Aravanta CLI & Open APIs',
    desc: 'Cross-platform PowerShell and Bash CLI tool, OpenAPI 3.1 REST gateway, and Terraform providers for declarative automation.',
    route: 'developers' as LandingView,
    tag: 'DevOps',
  },
  {
    icon: MessageSquare,
    category: 'Knowledge Sharing',
    title: 'Engineering Community Forum',
    desc: 'Collaborative discussion board for platform engineering, architecture patterns, troubleshooting guides, and peer knowledge sharing.',
    route: 'community' as LandingView,
    tag: 'Community',
  },
  {
    icon: BookOpen,
    category: 'Documentation',
    title: 'Standard Operating Procedures',
    desc: 'Step-by-step developer guides, user authentication manuals, API endpoint references, and architecture blueprints.',
    route: 'user-manual' as LandingView,
    tag: 'Docs',
  },
];

// ── Real Consumption Pricing Rates (From PricingEngine) ──
const realPricingRates = [
  { service: 'Compute Virtual Machines', monthlyRate: '₹1.50', annualRate: '₹1.20', unit: 'per vCPU / hour', note: 'Elastic VM runtime' },
  { service: 'Block & S3 Object Storage', monthlyRate: '₹0.0014', annualRate: '₹0.0011', unit: 'per GB / hour', note: '~₹1.00 / GB-month' },
  { service: 'Managed Databases (Postgres/Redis)', monthlyRate: '₹3.00', annualRate: '₹2.40', unit: 'per instance / hour', note: 'HA with snapshot backups' },
  { service: 'Managed Kubernetes Clusters', monthlyRate: '₹4.00', annualRate: '₹3.20', unit: 'per cluster / hour', note: 'Control plane & worker nodes' },
  { service: 'CI/CD Pipeline Builds', monthlyRate: '₹0.25', annualRate: '₹0.20', unit: 'per minute', note: 'Automated container build & test' },
  { service: 'Egress Network Bandwidth', monthlyRate: '₹0.50', annualRate: '₹0.40', unit: 'per GB', note: 'Predictable outbound transfer' },
];

// ── Verified FAQs ──
const faqs = [
  {
    q: 'How does Aravanta CloudOS enforce server-side RBAC and role hierarchy?',
    a: 'Every operational action is verified against a 5-tier Role-Based Access Control matrix (SuperAdmin, Admin, Operator, Developer, Viewer) backed by the database. Client payloads attempting to supply unauthorized role or permission mutations are strictly rejected at the Pydantic schema validation boundary. Critical operations like instance termination or billing updates require SuperAdmin or Admin privileges.',
  },
  {
    q: 'How does ArvStore manage documents, files, and S3 storage buckets?',
    a: 'ArvStore provides an S3-compatible object storage layer with bucket-level access control (Private or Public-Read) and storage tiering (Standard or Glacier). Users can upload files up to 100MB with drag-and-drop, organize files into hierarchical directories using folder prefixes, copy secure download links, and preview documents directly in the console.',
  },
  {
    q: 'How do progressive canary deployments and automated rollbacks work?',
    a: 'When a new release is triggered via GitOps or the console, ArvCD deploys a canary slice (e.g. 25% traffic). The system evaluates synthetic health probes, P95 latency thresholds, and HTTP error rates. If anomalies or SLO breaches occur, an automated rollback restores the previous stable release in under 1.2 seconds with zero dropped connections.',
  },
  {
    q: 'How is consumption-based FinOps billing calculated and invoiced?',
    a: 'All infrastructure consumption is metered per-second using the pricing engine rates (e.g. ₹1.50/vCPU-hr for compute, ₹1.00/GB-mo for S3 storage, ₹0.50/GB for egress). Accounts can track real-time spend against configurable monthly budget caps. Invoices are generated with standard Indian Goods and Services Tax (9% CGST + 9% SGST = 18%) and can be exported as official PDFs or interactive WebCopies.',
  },
  {
    q: 'What authentication methods and security protections are implemented?',
    a: 'Aravanta CloudOS supports email and Account ID (ARV-ACC-XXXXXX) sign-in, RFC 6238 Time-based One-Time Passwords (TOTP MFA with 30-second token rotation), workspace invitation tokens, sliding-window rate limiting (5 failed attempts locks the account for 60 seconds), and cryptographic audit logging for all administrative actions.',
  },
  {
    q: 'What is the underlying deployment and architecture of the live platform?',
    a: 'The production platform runs serverless on Vercel with a React 18 + Vite frontend and a Python 3.11 FastAPI backend connected to managed PostgreSQL. The repository also includes production-ready Kubernetes manifests and Terraform definitions for self-hosted or dedicated sovereign enterprise deployments.',
  },
];

export const LandingPage: React.FC<LandingPageProps> = ({
  onGoToLogin,
  onGoToRegister,
  onOpenCommandPalette,
  onNavigate,
  onGoToConsole,
}) => {
  const [activePreviewTab, setActivePreviewTab] = useState<'dashboard' | 'storage' | 'deployments' | 'iam' | 'billing'>('dashboard');
  const [activeWorkflowStep, setActiveWorkflowStep] = useState(0);
  const [billingPeriod, setBillingPeriod] = useState<'monthly' | 'annual'>('monthly');
  const [previewRole, setPreviewRole] = useState<'SuperAdmin' | 'Operator' | 'Developer' | 'Viewer'>('Operator');
  const [previewStorageFolder, setPreviewStorageFolder] = useState<'root' | 'backups' | 'configs'>('root');
  const [previewUploadProgress, setPreviewUploadProgress] = useState<number | null>(null);
  const [copiedCodeKey, setCopiedCodeKey] = useState<string | null>(null);
  const reduceMotion = useMemo(prefersReducedMotion, []);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleCopyCode = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCodeKey(key);
    setTimeout(() => setCopiedCodeKey(null), 2000);
  };

  const handleSimulateUpload = () => {
    setPreviewUploadProgress(10);
    const interval = setInterval(() => {
      setPreviewUploadProgress((prev) => {
        if (prev === null || prev >= 100) {
          clearInterval(interval);
          setTimeout(() => setPreviewUploadProgress(null), 1500);
          return 100;
        }
        return prev + 30;
      });
    }, 250);
  };

  const containerVariants: Variants = reduceMotion
    ? { hidden: {}, show: {} }
    : {
        hidden: {},
        show: {
          transition: { staggerChildren: 0.06, delayChildren: 0.05 },
        },
      };

  const fadeUp: Variants = reduceMotion
    ? { hidden: {}, show: {} }
    : {
        hidden: { opacity: 0, y: 14 },
        show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] } },
      };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-brandObsidian-950 text-slate-900 dark:text-slate-100 font-sans antialiased selection:bg-brandGold-500/30 selection:text-brandGold-900 dark:selection:text-brandGold-100 overflow-x-clip">
      {/* ── PERSISTENT HEADER NAVIGATION ── */}
      <Navbar
        onGoToLogin={onGoToLogin}
        onGoToRegister={onGoToRegister}
        onOpenCommandPalette={onOpenCommandPalette}
        onNavigate={onNavigate}
        onGoToConsole={onGoToConsole}
        currentView="home"
      />

      <main id="main-content">
        {/* ── HERO SECTION ── */}
        <section className="relative overflow-hidden pt-10 sm:pt-14 lg:pt-20 pb-16 sm:pb-24 lg:pb-28">
          {/* Subtle Grid and Radial Lighting */}
          <div
            aria-hidden
            className="absolute inset-x-0 top-0 -z-10 h-[680px] bg-hero-radial opacity-90 pointer-events-none"
          />
          <div
            aria-hidden
            className="absolute -top-28 left-1/2 -translate-x-1/2 -z-10 w-[720px] sm:w-[1000px] h-[480px] bg-gradient-to-b from-brandGold-500/25 via-amber-500/10 to-transparent blur-[110px] pointer-events-none rounded-full"
          />
          <div
            aria-hidden
            className="absolute inset-0 -z-10 opacity-[0.035] dark:opacity-[0.07] pointer-events-none"
            style={{
              backgroundImage:
                'linear-gradient(to right, currentColor 1px, transparent 1px), linear-gradient(to bottom, currentColor 1px, transparent 1px)',
              backgroundSize: '48px 48px',
              WebkitMaskImage:
                'radial-gradient(ellipse 85% 60% at 50% 0%, black 40%, transparent 80%)',
              maskImage:
                'radial-gradient(ellipse 85% 60% at 50% 0%, black 40%, transparent 80%)',
              color: '#0B0F17',
            }}
          />

          {/* Ambient Brand Glyph Watermark */}
          <div
            aria-hidden
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 -z-10 pointer-events-none flex items-center justify-center select-none overflow-hidden"
          >
            <div className="relative w-[340px] h-[340px] sm:w-[500px] sm:h-[500px] md:w-[680px] md:h-[680px] flex items-center justify-center opacity-10 dark:opacity-15">
              <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-brandGold-500/25 via-amber-500/10 to-transparent blur-3xl" />
              <img
                src="/assets/aravanta-glyph-glow.png"
                alt=""
                className="w-full h-full object-contain filter drop-shadow-[0_0_50px_rgba(185,139,59,0.35)]"
              />
            </div>
          </div>

          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div
              variants={containerVariants}
              initial="hidden"
              animate={mounted ? 'show' : 'hidden'}
              className="relative z-10 max-w-4xl mx-auto text-center space-y-6"
            >
              {/* Eyebrow Pill */}
              <motion.div variants={fadeUp} className="flex justify-center">
                <div className="inline-flex flex-wrap items-center justify-center gap-x-2.5 gap-y-1.5 px-4 py-1.5 rounded-full border border-brandGold-500/40 bg-brandGold-500/10 dark:bg-brandGold-950/40 text-brandGold-700 dark:text-brandGold-300 text-xs font-semibold tracking-wide shadow-sm shadow-brandGold-500/10 backdrop-blur-xl ring-1 ring-brandGold-500/20">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                  </span>
                  <span className="font-mono text-emerald-600 dark:text-emerald-400 font-bold uppercase text-[11px]">
                    All Systems Operational
                  </span>
                  <span className="opacity-30 hidden sm:inline">•</span>
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-brandGold-500/20 text-brandGold-800 dark:text-brandGold-200 font-bold text-[10px] font-mono">
                    v2.4 GA
                  </span>
                  <span className="opacity-30 hidden sm:inline">•</span>
                  <span className="inline-flex items-center gap-1.5 text-slate-700 dark:text-slate-300 text-[11px] font-mono">
                    <span className="w-1.5 h-1.5 rounded-full bg-brandGold-500" />
                    <span>ap-south-1 Sovereign (8ms Latency)</span>
                  </span>
                </div>
              </motion.div>

              {/* Main Headline */}
              <motion.h1
                variants={fadeUp}
                className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-black tracking-tight leading-[1.08] text-slate-900 dark:text-white max-w-4xl mx-auto font-sans"
              >
                Aravanta Cloud OS
                <span className="block mt-2 sm:mt-3 text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-extrabold bg-gradient-to-r from-brandGold-600 via-amber-400 to-brandGold-400 bg-clip-text text-transparent drop-shadow-xs">
                  The Sovereign Multi-Cloud Operating System
                </span>
              </motion.h1>

              {/* Supporting Copy */}
              <motion.p
                variants={fadeUp}
                className="text-sm sm:text-base md:text-lg text-slate-600 dark:text-slate-300 leading-relaxed max-w-2xl sm:max-w-3xl mx-auto font-normal"
              >
                Orchestrate elastic virtual machines, managed Kubernetes clusters, distributed S3 storage, serverless functions, and high-availability databases from a single sovereign control plane — with sub-second telemetry, GitOps delivery, and predictable FinOps billing in INR (₹).
              </motion.p>

              {/* Real Aligned Responsive CTAs */}
              <motion.div
                variants={fadeUp}
                className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2 max-w-2xl mx-auto w-full"
              >
                <Button
                  size="lg"
                  variant="primary"
                  onClick={onGoToRegister}
                  className="w-full sm:w-auto h-12 px-6 rounded-xl bg-brandGold-500 hover:bg-brandGold-600 text-brandObsidian-950 font-bold text-sm sm:text-base shadow-lg shadow-brandGold-500/25 hover:shadow-brandGold-500/40 hover:-translate-y-0.5 transition-all btn-press cursor-pointer shrink-0"
                  rightIcon={<ArrowRight className="w-4 h-4" />}
                >
                  Get Started Free
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  onClick={() => onNavigate?.('cli')}
                  className="w-full sm:w-auto h-12 px-5 rounded-xl border border-slate-300 dark:border-brandObsidian-700 bg-white/90 dark:bg-brandObsidian-900/90 hover:border-brandGold-500 text-slate-800 dark:text-slate-200 hover:text-brandGold-600 dark:hover:text-brandGold-400 font-bold text-sm shadow-xs hover:-translate-y-0.5 transition-all btn-press cursor-pointer shrink-0"
                  leftIcon={<Terminal className="w-4 h-4 text-brandGold-500" />}
                >
                  Web Terminal
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  onClick={() => onNavigate?.('services')}
                  className="w-full sm:w-auto h-12 px-5 rounded-xl border border-slate-300 dark:border-brandObsidian-700 bg-white/90 dark:bg-brandObsidian-900/90 hover:border-brandGold-500 text-slate-800 dark:text-slate-200 hover:text-brandGold-600 dark:hover:text-brandGold-400 font-bold text-sm shadow-xs hover:-translate-y-0.5 transition-all btn-press cursor-pointer shrink-0"
                  leftIcon={<Boxes className="w-4 h-4 text-brandGold-500" />}
                >
                  Explore 20+ Services
                </Button>
                {onGoToConsole && (
                  <Button
                    size="lg"
                    variant="ghost"
                    onClick={onGoToConsole}
                    className="w-full sm:w-auto h-12 px-4 rounded-xl text-slate-700 dark:text-slate-300 hover:text-brandGold-600 dark:hover:text-brandGold-400 font-bold text-sm hover:bg-slate-100 dark:hover:bg-brandObsidian-800/80 transition-colors shrink-0"
                    leftIcon={<LayoutGrid className="w-4 h-4 text-brandGold-500" />}
                  >
                    Console
                  </Button>
                )}
              </motion.div>

              {/* Factual Spec Strip with Subtle Glass Polish */}
              <motion.div
                variants={fadeUp}
                className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 pt-6 max-w-4xl mx-auto w-full"
              >
                {[
                  { value: '80+ Shapes', label: 'AMD EPYC & ARM VMs', icon: Server, badge: 'Compute' },
                  { value: '< 60s', label: 'Provisioning Velocity', icon: Zap, badge: 'Velocity' },
                  { value: 'INR (₹) & GST', label: 'Per-Second FinOps', icon: BarChart3, badge: 'FinOps' },
                  { value: 'RFC 6238', label: 'TOTP 2FA Protected', icon: Lock, badge: 'Security' },
                ].map((stat) => {
                  const StatIcon = stat.icon;
                  return (
                    <div
                      key={stat.label}
                      className="p-4 rounded-2xl border border-slate-200/90 dark:border-brandGold-500/25 bg-white/95 dark:bg-[#0c121e]/90 backdrop-blur-xl shadow-xs hover:border-brandGold-500/60 hover:shadow-md hover:shadow-brandGold-500/10 hover:-translate-y-1 transition-all duration-300 text-left flex flex-col justify-between group relative overflow-hidden"
                    >
                      <div className="absolute top-0 inset-x-0 h-0.5 bg-gradient-to-r from-transparent via-brandGold-500/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                      <div className="flex items-center justify-between mb-2.5 sm:mb-3">
                        <div className="w-8 h-8 rounded-xl bg-brandGold-500/10 text-brandGold-600 dark:text-brandGold-400 flex items-center justify-center group-hover:bg-brandGold-500 group-hover:text-brandObsidian-950 transition-colors duration-300">
                          <StatIcon className="w-4 h-4" />
                        </div>
                        <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-brandObsidian-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-brandObsidian-700 group-hover:border-brandGold-500/40 transition-colors">
                          {stat.badge}
                        </span>
                      </div>
                      <div>
                        <div className="text-lg sm:text-xl font-black text-slate-900 dark:text-white tabular-nums tracking-tight">
                          {stat.value}
                        </div>
                        <div className="text-[11px] font-medium text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-1">
                          {stat.label}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </motion.div>
            </motion.div>

            {/* ── LAYERED PRODUCT DASHBOARD PREVIEW & SIMULATOR ── */}
            <motion.div
              initial={reduceMotion ? { opacity: 1 } : { opacity: 0, y: 20 }}
              animate={mounted ? { opacity: 1, y: 0 } : {}}
              transition={reduceMotion ? {} : { duration: 0.6, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
              className="relative mt-12 sm:mt-16 lg:mt-20"
            >
              <div className="absolute -inset-4 sm:-inset-6 rounded-[2.5rem] bg-gradient-to-b from-brandGold-500/15 via-brandGold-500/5 to-transparent blur-2xl -z-10" />

              <div className="rounded-2xl border border-slate-200/90 dark:border-brandObsidian-700/80 bg-white dark:bg-brandObsidian-900 shadow-2xl overflow-hidden">
                {/* Window Chrome Header with Live Module Tabs */}
                <div className="px-4 sm:px-5 py-3 border-b border-slate-200 dark:border-brandObsidian-800 bg-slate-100/70 dark:bg-brandObsidian-800/60 flex flex-col md:flex-row md:items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1.5">
                      <span className="w-3 h-3 rounded-full bg-rose-500/80 inline-block" />
                      <span className="w-3 h-3 rounded-full bg-amber-500/80 inline-block" />
                      <span className="w-3 h-3 rounded-full bg-emerald-500/80 inline-block" />
                    </div>
                    <span className="text-xs font-mono font-medium text-slate-500 dark:text-slate-400 truncate">
                      aravanta.cloudos // workspace-mumbai-01 // production
                    </span>
                  </div>

                  {/* Interactive Dashboard Module Selector */}
                  <div className="flex flex-wrap items-center gap-1.5">
                    {[
                      { id: 'dashboard', label: 'Fleet Overview', icon: BarChart3 },
                      { id: 'storage', label: 'ArvStore (S3 & Files)', icon: HardDrive },
                      { id: 'deployments', label: 'GitOps Canaries', icon: GitBranch },
                      { id: 'iam', label: 'IAM & RBAC', icon: ShieldCheck },
                      { id: 'billing', label: 'FinOps Invoices', icon: FileText },
                    ].map((tab) => {
                      const Icon = tab.icon;
                      const isActive = activePreviewTab === tab.id;
                      return (
                        <button
                          key={tab.id}
                          onClick={() => setActivePreviewTab(tab.id as any)}
                          className={[
                            'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer',
                            isActive
                              ? 'bg-brandGold-500 text-brandObsidian-950 shadow-sm'
                              : 'text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-brandObsidian-700/60',
                          ].join(' ')}
                        >
                          <Icon className="w-3.5 h-3.5" />
                          <span>{tab.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Dashboard Viewport Content */}
                <div className="p-4 sm:p-6 bg-slate-50/50 dark:bg-brandObsidian-950/60 min-h-[420px]">
                  <AnimatePresence mode="wait">
                    {/* VIEW 1: FLEET & SRE CONSOLE */}
                    {activePreviewTab === 'dashboard' && (
                      <motion.div
                        key="dashboard"
                        initial={reduceMotion ? false : { opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -6 }}
                        transition={{ duration: 0.25 }}
                        className="space-y-5"
                      >
                        {/* Fleet KPI Cards */}
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                          {[
                            { label: 'Active Fleet', value: '24 Resources', sub: '14 Pods, 4 VMs, 3 DBs, 2 Buckets' },
                            { label: 'P95 Latency', value: '38.5 ms', sub: 'SLO Target < 200 ms' },
                            { label: 'CPU Fleet Telemetry', value: '32% Avg', sub: 'Peak 48% @ 14:00 IST' },
                            { label: 'Alertmanager', value: '1 Firing', sub: '2 Acknowledged / Healthy' },
                          ].map((kpi) => (
                            <div
                              key={kpi.label}
                              className="rounded-xl border border-slate-200 dark:border-brandObsidian-800 bg-white dark:bg-brandObsidian-900 p-4 shadow-xs"
                            >
                              <div className="text-[10px] uppercase font-bold tracking-wider text-slate-500 dark:text-slate-400 font-mono">
                                {kpi.label}
                              </div>
                              <div className="mt-1 text-xl sm:text-2xl font-black text-slate-900 dark:text-white tabular-nums">
                                {kpi.value}
                              </div>
                              <div className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                                {kpi.sub}
                              </div>
                            </div>
                          ))}
                        </div>

                        {/* Live Inventory Table */}
                        <div className="rounded-xl border border-slate-200 dark:border-brandObsidian-800 bg-white dark:bg-brandObsidian-900 overflow-hidden shadow-xs">
                          <div className="px-4 py-3 border-b border-slate-200 dark:border-brandObsidian-800 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <Server className="w-4 h-4 text-brandGold-500" />
                              <span className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200">
                                Live Resource Fleet (PostgreSQL Sync)
                              </span>
                            </div>
                            <Badge variant="success" size="sm" dot>Live Polling</Badge>
                          </div>

                          <div className="overflow-x-auto">
                            <table className="w-full text-left text-xs">
                              <thead className="bg-slate-50 dark:bg-brandObsidian-800/50 text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-brandObsidian-800 font-mono">
                                <tr>
                                  <th className="py-2.5 px-4 font-semibold">Resource Name</th>
                                  <th className="py-2.5 px-4 font-semibold">Type</th>
                                  <th className="py-2.5 px-4 font-semibold">Engine / Spec</th>
                                  <th className="py-2.5 px-4 font-semibold">Region</th>
                                  <th className="py-2.5 px-4 font-semibold">Status</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-100 dark:divide-brandObsidian-800 font-mono">
                                {[
                                  { name: 'web-prod-api-cluster', type: 'Container Pod', spec: '4 vCPU • 8 GB RAM', region: 'ap-south-1a', status: 'RUNNING' },
                                  { name: 'mumbai-pg-ha-01', type: 'PostgreSQL 16', spec: 'HA Standby Replica', region: 'ap-south-1b', status: 'HEALTHY' },
                                  { name: 'edge-worker-vm-03', type: 'Compute VM', spec: 'c3.large • NVMe SSD', region: 'ap-south-1a', status: 'RUNNING' },
                                  { name: 'arv-assets-prod', type: 'S3 Object Bucket', spec: 'Standard Storage', region: 'ap-south-1', status: 'ACTIVE' },
                                ].map((row) => (
                                  <tr key={row.name} className="hover:bg-slate-50/60 dark:hover:bg-brandObsidian-800/40">
                                    <td className="py-2.5 px-4 font-bold text-slate-900 dark:text-white flex items-center gap-2">
                                      <span className="w-2 h-2 rounded-full bg-emerald-500" />
                                      {row.name}
                                    </td>
                                    <td className="py-2.5 px-4 text-slate-600 dark:text-slate-300">{row.type}</td>
                                    <td className="py-2.5 px-4 text-slate-500 dark:text-slate-400">{row.spec}</td>
                                    <td className="py-2.5 px-4 text-slate-500 dark:text-slate-400">{row.region}</td>
                                    <td className="py-2.5 px-4">
                                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                                        {row.status}
                                      </span>
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      </motion.div>
                    )}

                    {/* VIEW 2: ARVSTORE S3 & FILE MANAGEMENT */}
                    {activePreviewTab === 'storage' && (
                      <motion.div
                        key="storage"
                        initial={reduceMotion ? false : { opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -6 }}
                        transition={{ duration: 0.25 }}
                        className="space-y-4"
                      >
                        {/* Storage Header Controls */}
                        <div className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-xl bg-white dark:bg-brandObsidian-900 border border-slate-200 dark:border-brandObsidian-800">
                          <div>
                            <div className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 font-mono">
                              Active Bucket: <span className="text-brandGold-600 dark:text-brandGold-400">arv-production-vault</span>
                            </div>
                            <div className="text-sm font-semibold text-slate-800 dark:text-slate-100 mt-0.5">
                              Region: ap-south-1 • Storage Class: STANDARD • Access: PRIVATE
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={handleSimulateUpload}
                              leftIcon={<UploadCloud className="w-3.5 h-3.5 text-brandGold-500" />}
                              className="text-xs cursor-pointer"
                            >
                              Upload File (100MB Max)
                            </Button>
                            <Badge variant="gold" size="sm">Versioning ON</Badge>
                          </div>
                        </div>

                        {previewUploadProgress !== null && (
                          <div className="p-3 rounded-lg bg-brandGold-500/10 border border-brandGold-500/30 text-xs font-mono space-y-1.5">
                            <div className="flex justify-between font-bold text-brandGold-700 dark:text-brandGold-300">
                              <span>Uploading `release-bundle-v1.4.tar.gz`...</span>
                              <span>{previewUploadProgress}%</span>
                            </div>
                            <div className="h-1.5 rounded-full bg-brandGold-500/20 overflow-hidden">
                              <div
                                className="h-full bg-brandGold-500 transition-all duration-200"
                                style={{ width: `${previewUploadProgress}%` }}
                              />
                            </div>
                          </div>
                        )}

                        {/* File Hierarchy Browser */}
                        <div className="rounded-xl border border-slate-200 dark:border-brandObsidian-800 bg-white dark:bg-brandObsidian-900 overflow-hidden">
                          <div className="px-4 py-2.5 bg-slate-50 dark:bg-brandObsidian-800/50 border-b border-slate-200 dark:border-brandObsidian-800 flex items-center justify-between text-xs font-mono">
                            <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400">
                              <Folder className="w-3.5 h-3.5 text-brandGold-500" />
                              <span>arv-production-vault /</span>
                              <button
                                onClick={() => setPreviewStorageFolder('root')}
                                className={`hover:underline cursor-pointer ${previewStorageFolder === 'root' ? 'font-bold text-brandGold-600 dark:text-brandGold-400' : ''}`}
                              >
                                root
                              </button>
                              <span>/</span>
                              <button
                                onClick={() => setPreviewStorageFolder('backups')}
                                className={`hover:underline cursor-pointer ${previewStorageFolder === 'backups' ? 'font-bold text-brandGold-600 dark:text-brandGold-400' : ''}`}
                              >
                                backups
                              </button>
                              <span>/</span>
                              <button
                                onClick={() => setPreviewStorageFolder('configs')}
                                className={`hover:underline cursor-pointer ${previewStorageFolder === 'configs' ? 'font-bold text-brandGold-600 dark:text-brandGold-400' : ''}`}
                              >
                                configs
                              </button>
                            </div>
                            <span className="text-slate-400">
                              {previewStorageFolder === 'root' ? '3 Objects' : previewStorageFolder === 'backups' ? '1 Object' : '1 Object'}
                            </span>
                          </div>

                          <div className="divide-y divide-slate-100 dark:divide-brandObsidian-800 text-xs font-mono">
                            {(previewStorageFolder === 'root' ? [
                              { key: 'backups/postgres-snapshot-2026-09-27.sql.gz', size: '1.42 GB', modified: '2 hours ago', class: 'STANDARD' },
                              { key: 'configs/kubernetes-production-spec.yaml', size: '8.4 KB', modified: 'Yesterday', class: 'STANDARD' },
                              { key: 'invoices/aravanta-tax-invoice-ARV-089.pdf', size: '164 KB', modified: '3 days ago', class: 'STANDARD' },
                            ] : previewStorageFolder === 'backups' ? [
                              { key: 'backups/postgres-snapshot-2026-09-27.sql.gz', size: '1.42 GB', modified: '2 hours ago', class: 'STANDARD' },
                            ] : [
                              { key: 'configs/kubernetes-production-spec.yaml', size: '8.4 KB', modified: 'Yesterday', class: 'STANDARD' },
                            ]).map((obj) => (
                              <div key={obj.key} className="p-3.5 flex items-center justify-between hover:bg-slate-50/70 dark:hover:bg-brandObsidian-800/40">
                                <div className="flex items-center gap-3">
                                  <FileText className="w-4 h-4 text-brandGold-500 shrink-0" />
                                  <div>
                                    <div className="font-bold text-slate-800 dark:text-slate-200">{obj.key}</div>
                                    <div className="text-[11px] text-slate-500 dark:text-slate-400">
                                      Size: {obj.size} • Modified: {obj.modified}
                                    </div>
                                  </div>
                                </div>
                                <div className="flex items-center gap-2">
                                  <span className="hidden sm:inline px-2 py-0.5 rounded text-[10px] bg-slate-100 dark:bg-brandObsidian-800 text-slate-600 dark:text-slate-400">
                                    {obj.class}
                                  </span>
                                  <button
                                    onClick={() => handleCopyCode(obj.key, obj.key)}
                                    className="p-1.5 rounded hover:bg-slate-200 dark:hover:bg-brandObsidian-700 text-slate-500 hover:text-slate-800 dark:hover:text-white cursor-pointer"
                                    title="Copy Object Key"
                                  >
                                    {copiedCodeKey === obj.key ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </motion.div>
                    )}

                    {/* VIEW 3: GITOPS & CANARY RELEASES */}
                    {activePreviewTab === 'deployments' && (
                      <motion.div
                        key="deployments"
                        initial={reduceMotion ? false : { opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -6 }}
                        transition={{ duration: 0.25 }}
                        className="space-y-4"
                      >
                        <div className="p-4 rounded-xl bg-white dark:bg-brandObsidian-900 border border-slate-200 dark:border-brandObsidian-800 flex items-center justify-between">
                          <div>
                            <div className="text-xs font-mono font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                              Active Release: <span className="text-brandGold-500 font-bold">api-gateway // v2.4.2</span>
                            </div>
                            <div className="text-sm font-semibold text-slate-800 dark:text-slate-100 mt-0.5">
                              Canary Strategy: 25% Traffic Slice • Envoy Ingress Controller
                            </div>
                          </div>
                          <Badge variant="gold" size="sm">Phase 2: Verifying</Badge>
                        </div>

                        {/* Canary Progress Bar */}
                        <div className="p-4 rounded-xl bg-white dark:bg-brandObsidian-900 border border-slate-200 dark:border-brandObsidian-800 space-y-3">
                          <div className="flex justify-between text-xs font-mono">
                            <span className="text-slate-600 dark:text-slate-400">Traffic Distribution: 25% Canary / 75% Stable</span>
                            <span className="text-emerald-500 font-bold">Error Rate: 0.00%</span>
                          </div>
                          <div className="h-2 rounded-full bg-slate-200 dark:bg-brandObsidian-800 overflow-hidden flex">
                            <div className="h-full bg-brandGold-500 w-[25%]" />
                            <div className="h-full bg-emerald-500 w-[75%]" />
                          </div>

                          <div className="grid grid-cols-3 gap-2 text-center text-xs font-mono pt-1">
                            <div className="p-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 font-bold">
                              Synthetic Probe: 100% OK
                            </div>
                            <div className="p-2.5 rounded-lg bg-slate-100 dark:bg-brandObsidian-800 text-slate-700 dark:text-slate-300 font-bold">
                              P95 Latency: 18.2ms
                            </div>
                            <div className="p-2.5 rounded-lg bg-brandGold-500/10 border border-brandGold-500/20 text-brandGold-700 dark:text-brandGold-300 font-bold">
                              Rollback Ready: &lt; 1.2s
                            </div>
                          </div>
                        </div>

                        <div className="p-3.5 rounded-xl bg-slate-100/70 dark:bg-brandObsidian-800/40 border border-slate-200 dark:border-brandObsidian-800 flex items-center justify-between text-xs font-mono">
                          <span className="text-slate-600 dark:text-slate-400">Commit: git-sha 9a4f21d (Merge PR #142: Fix connection pooling timeout)</span>
                          <span className="text-emerald-600 dark:text-emerald-400 font-bold">Signature Verified ✓</span>
                        </div>
                      </motion.div>
                    )}

                    {/* VIEW 4: IAM & RBAC GOVERNANCE */}
                    {activePreviewTab === 'iam' && (
                      <motion.div
                        key="iam"
                        initial={reduceMotion ? false : { opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -6 }}
                        transition={{ duration: 0.25 }}
                        className="space-y-4"
                      >
                        {/* Interactive Role Switcher */}
                        <div className="p-4 rounded-xl bg-white dark:bg-brandObsidian-900 border border-slate-200 dark:border-brandObsidian-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                          <div>
                            <div className="text-xs font-mono font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                              Simulate Role-Based Permissions
                            </div>
                            <div className="text-sm font-semibold text-slate-800 dark:text-slate-100 mt-0.5">
                              Active Persona: <span className="text-brandGold-500 font-bold">{previewRole}</span>
                            </div>
                          </div>

                          <div className="flex items-center gap-1.5">
                            {(['SuperAdmin', 'Operator', 'Developer', 'Viewer'] as const).map((r) => (
                              <button
                                key={r}
                                onClick={() => setPreviewRole(r)}
                                className={[
                                  'px-2.5 py-1 rounded text-xs font-mono font-bold transition-all cursor-pointer',
                                  previewRole === r
                                    ? 'bg-brandGold-500 text-brandObsidian-950 shadow-xs'
                                    : 'bg-slate-100 dark:bg-brandObsidian-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white',
                                ].join(' ')}
                              >
                                {r}
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* Permission Matrix for Simulated Role */}
                        <div className="rounded-xl border border-slate-200 dark:border-brandObsidian-800 bg-white dark:bg-brandObsidian-900 p-4">
                          <div className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 font-mono mb-3">
                            Operational Capabilities Allowed For {previewRole}
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 text-xs font-mono">
                            {[
                              { action: 'View Metrics & Logs', allowed: true },
                              { action: 'Upload S3 Objects', allowed: previewRole !== 'Viewer' },
                              { action: 'Trigger Deployments', allowed: previewRole !== 'Viewer' },
                              { action: 'Provision Virtual Machines', allowed: previewRole === 'SuperAdmin' || previewRole === 'Operator' },
                              { action: 'Manage FinOps & Billing', allowed: previewRole === 'SuperAdmin' },
                              { action: 'Invite Members & Modify Roles', allowed: previewRole === 'SuperAdmin' },
                            ].map((perm) => (
                              <div
                                key={perm.action}
                                className={[
                                  'p-2.5 rounded-lg border flex items-center justify-between',
                                  perm.allowed
                                    ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-700 dark:text-emerald-400'
                                    : 'bg-rose-500/5 border-rose-500/20 text-rose-600 dark:text-rose-400 opacity-60',
                                ].join(' ')}
                              >
                                <span>{perm.action}</span>
                                <span>{perm.allowed ? '✓ ALLOW' : '✕ DENY'}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </motion.div>
                    )}

                    {/* VIEW 5: FINOPS & INVOICES */}
                    {activePreviewTab === 'billing' && (
                      <motion.div
                        key="billing"
                        initial={reduceMotion ? false : { opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -6 }}
                        transition={{ duration: 0.25 }}
                        className="space-y-4"
                      >
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                          <div className="p-4 rounded-xl bg-white dark:bg-brandObsidian-900 border border-slate-200 dark:border-brandObsidian-800">
                            <div className="text-[10px] font-mono uppercase font-bold text-slate-500 dark:text-slate-400">
                              Current Billing Cycle (Sept 2026)
                            </div>
                            <div className="text-2xl font-black text-slate-900 dark:text-white font-mono mt-1">
                              ₹28,450.00
                            </div>
                            <div className="text-xs text-emerald-500 mt-0.5">Budget Cap: ₹40,000.00 (71% utilized)</div>
                          </div>

                          <div className="p-4 rounded-xl bg-white dark:bg-brandObsidian-900 border border-slate-200 dark:border-brandObsidian-800">
                            <div className="text-[10px] font-mono uppercase font-bold text-slate-500 dark:text-slate-400">
                              Tax Breakdown (India GST)
                            </div>
                            <div className="text-xs font-mono space-y-1 mt-2 text-slate-600 dark:text-slate-400">
                              <div className="flex justify-between"><span>Subtotal:</span><span className="font-bold text-slate-900 dark:text-white">₹24,110.17</span></div>
                              <div className="flex justify-between"><span>CGST (9%):</span><span>₹2,169.91</span></div>
                              <div className="flex justify-between"><span>SGST (9%):</span><span>₹2,169.91</span></div>
                            </div>
                          </div>

                          <div className="p-4 rounded-xl bg-white dark:bg-brandObsidian-900 border border-slate-200 dark:border-brandObsidian-800 flex flex-col justify-between">
                            <div>
                              <div className="text-[10px] font-mono uppercase font-bold text-slate-500 dark:text-slate-400">
                                Latest Official Invoice
                              </div>
                              <div className="text-sm font-bold text-slate-800 dark:text-slate-200 mt-1 font-mono">
                                #INV-ARV-2026-089
                              </div>
                            </div>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => onNavigate?.('pricing')}
                              className="mt-2 text-xs cursor-pointer"
                              rightIcon={<ChevronRight className="w-3.5 h-3.5" />}
                            >
                              View Pricing & Invoices
                            </Button>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            </motion.div>
          </div>
        </section>

        {/* ── CORE CAPABILITIES SECTION ── */}
        <section id="capabilities" className="py-20 sm:py-28 border-t border-slate-200 dark:border-brandObsidian-800">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
            <div className="text-center max-w-3xl mx-auto space-y-4">
              <Badge variant="gold" size="md">
                Verified Capabilities
              </Badge>
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-slate-900 dark:text-white leading-[1.1]">
                Real Cloud Infrastructure Primitives
              </h2>
              <p className="text-base sm:text-lg text-slate-600 dark:text-slate-300 leading-relaxed">
                Every service below is backed by running backend routers, database schemas, and visual console views in Aravanta CloudOS.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {capabilities.map((cap) => {
                const Icon = cap.icon;
                return (
                  <Card
                    key={cap.title}
                    hover
                    className="group border-slate-200 dark:border-brandObsidian-700/80 bg-white dark:bg-brandObsidian-900 flex flex-col justify-between"
                  >
                    <CardBody className="space-y-4 !p-6 flex-1 flex flex-col justify-between">
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <div className="w-11 h-11 rounded-xl bg-brandGold-500/10 text-brandGold-500 dark:text-brandGold-400 flex items-center justify-center group-hover:bg-brandGold-500 group-hover:text-brandObsidian-950 transition-colors">
                            <Icon className="w-5.5 h-5.5" />
                          </div>
                          <Badge variant="outline" size="sm">{cap.tag}</Badge>
                        </div>
                        <div>
                          <div className="text-[11px] font-mono uppercase font-bold text-slate-400">
                            {cap.category}
                          </div>
                          <h3 className="text-lg font-bold tracking-tight text-slate-900 dark:text-white mt-1 group-hover:text-brandGold-600 dark:group-hover:text-brandGold-400 transition-colors">
                            {cap.title}
                          </h3>
                          <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed mt-2">
                            {cap.desc}
                          </p>
                        </div>
                      </div>

                      <div className="pt-4 border-t border-slate-100 dark:border-brandObsidian-800">
                        <button
                          onClick={() => onNavigate?.(cap.route)}
                          className="inline-flex items-center gap-1.5 text-xs font-bold text-brandGold-600 dark:text-brandGold-400 hover:text-brandGold-700 dark:hover:text-brandGold-300 transition-colors cursor-pointer"
                        >
                          <span>Explore {cap.category}</span>
                          <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                        </button>
                      </div>
                    </CardBody>
                  </Card>
                );
              })}
            </div>
          </div>
        </section>

        {/* ── HOW IT WORKS: THE 6-STEP APPLICATION WORKFLOW ── */}
        <section id="workflow" className="py-20 sm:py-28 border-t border-slate-200 dark:border-brandObsidian-800 bg-slate-100/50 dark:bg-brandObsidian-900/40">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
            <div className="max-w-3xl space-y-4">
              <Badge variant="outline" size="md">
                Application Lifecycle
              </Badge>
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-slate-900 dark:text-white leading-[1.1]">
                How Aravanta CloudOS Operates
              </h2>
              <p className="text-base sm:text-lg text-slate-600 dark:text-slate-300 leading-relaxed">
                From initial account registration with TOTP 2FA to automated canary rollouts and GST tax invoicing, follow the exact workflow implemented across our full stack.
              </p>
            </div>

            {/* Stepper Navigation */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
              {workflowSteps.map((step, idx) => {
                const StepIcon = step.icon;
                const isActive = idx === activeWorkflowStep;
                return (
                  <button
                    key={step.key}
                    onClick={() => setActiveWorkflowStep(idx)}
                    className={[
                      'p-3.5 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between min-h-[96px]',
                      isActive
                        ? 'bg-brandGold-500/10 border-brandGold-500 text-slate-900 dark:text-white shadow-xs'
                        : 'bg-white dark:bg-brandObsidian-900 border-slate-200 dark:border-brandObsidian-800 text-slate-600 dark:text-slate-400 hover:border-brandGold-500/40',
                    ].join(' ')}
                  >
                    <div className="flex items-center justify-between">
                      <span className={[
                        'text-[11px] font-mono font-bold',
                        isActive ? 'text-brandGold-600 dark:text-brandGold-400' : 'text-slate-400',
                      ].join(' ')}>
                        STEP {step.step}
                      </span>
                      <StepIcon className={[
                        'w-4 h-4',
                        isActive ? 'text-brandGold-500' : 'text-slate-400',
                      ].join(' ')} />
                    </div>
                    <span className="text-xs font-bold line-clamp-1 mt-2">
                      {step.name}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Active Step Showcase */}
            <Card goldAccent className="bg-white dark:bg-brandObsidian-900">
              <CardBody className="!p-6 sm:!p-8 grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-10 items-center">
                <div className="lg:col-span-8 space-y-4">
                  <Badge variant="gold" size="md">
                    Step {workflowSteps[activeWorkflowStep].step} • {workflowSteps[activeWorkflowStep].name}
                  </Badge>
                  <h3 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                    {workflowSteps[activeWorkflowStep].title}
                  </h3>
                  <p className="text-base text-slate-600 dark:text-slate-300 leading-relaxed">
                    {workflowSteps[activeWorkflowStep].desc}
                  </p>

                  <div className="grid grid-cols-2 gap-4 pt-3 max-w-md">
                    {workflowSteps[activeWorkflowStep].metrics.map((m) => (
                      <div
                        key={m.label}
                        className="rounded-xl bg-slate-50 dark:bg-brandObsidian-800/60 border border-slate-200 dark:border-brandObsidian-700/60 p-4"
                      >
                        <div className="text-[11px] uppercase tracking-wider font-bold text-slate-500 dark:text-slate-400 font-mono">
                          {m.label}
                        </div>
                        <div className="mt-1 text-lg sm:text-xl font-black text-slate-900 dark:text-white font-mono">
                          {m.value}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="lg:col-span-4 flex justify-center">
                  <div className="w-full max-w-xs p-6 rounded-2xl bg-slate-50 dark:bg-brandObsidian-800/50 border border-slate-200 dark:border-brandObsidian-700 text-center space-y-3">
                    <div className="w-12 h-12 rounded-xl bg-brandGold-500/10 text-brandGold-500 flex items-center justify-center mx-auto">
                      {React.createElement(workflowSteps[activeWorkflowStep].icon, { className: 'w-6 h-6' })}
                    </div>
                    <div className="text-xs font-mono font-bold uppercase text-slate-400">Production Ready</div>
                    <div className="text-sm font-bold text-slate-800 dark:text-slate-200">
                      Live in Aravanta Control Plane
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => onNavigate?.('documentation')}
                      className="w-full text-xs cursor-pointer"
                    >
                      Read Step Documentation
                    </Button>
                  </div>
                </div>
              </CardBody>
            </Card>
          </div>
        </section>

        {/* ── DEVELOPER EXPERIENCE (CLI & APIS) ── */}
        <section id="developers" className="py-20 sm:py-28 border-t border-slate-200 dark:border-brandObsidian-800">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-16 items-start">
              <div className="lg:col-span-5 space-y-6 lg:sticky lg:top-24">
                <Badge variant="gold" size="md">
                  Developer Workflows
                </Badge>
                <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-slate-900 dark:text-white leading-[1.08]">
                  Automate Infrastructure via CLI, Terraform, and REST.
                </h2>
                <p className="text-base sm:text-lg text-slate-600 dark:text-slate-300 leading-relaxed">
                  Every resource accessible in the visual dashboard is exposed programmatically through the Aravanta CLI v2.0, OpenAPI 3.1 endpoints, and Terraform resources.
                </p>

                <div className="space-y-3 pt-1">
                  {[
                    'Cross-platform global CLI: install on Windows (pwsh) or macOS/Linux (bash)',
                    'OpenAPI 3.1 Swagger spec hosted at /api/v1/openapi.json',
                    'Idempotent provisioning with stateful transaction rollback',
                  ].map((item) => (
                    <div key={item} className="flex items-start gap-3">
                      <span className="mt-1 w-5 h-5 rounded-full bg-brandGold-500/10 text-brandGold-500 flex items-center justify-center shrink-0">
                        <Check className="w-3.5 h-3.5" />
                      </span>
                      <span className="text-sm text-slate-700 dark:text-slate-200 leading-relaxed">
                        {item}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="pt-2 flex flex-wrap gap-3">
                  <Button
                    variant="primary"
                    size="lg"
                    onClick={() => onNavigate?.('developers')}
                    rightIcon={<ChevronRight className="w-4 h-4" />}
                    className="bg-brandGold-500 hover:bg-brandGold-600 text-brandObsidian-950 font-bold cursor-pointer"
                  >
                    View Developer Documentation
                  </Button>
                </div>
              </div>

              <div className="lg:col-span-7">
                <TabContainer defaultValue="cli">
                  <div className="mb-4 overflow-x-auto pb-1">
                    <TabList>
                      <Tab value="cli">Aravanta CLI v2.0</Tab>
                      <Tab value="terraform">Terraform</Tab>
                      <Tab value="rest">REST API</Tab>
                      <Tab value="sdk">Node.js SDK</Tab>
                    </TabList>
                  </div>
                  <TabPanel value="cli">
                    <CodeBlock code={codeSnippets.cli} language="bash" />
                  </TabPanel>
                  <TabPanel value="terraform">
                    <CodeBlock code={codeSnippets.terraform} language="hcl" />
                  </TabPanel>
                  <TabPanel value="rest">
                    <CodeBlock code={codeSnippets.rest} language="bash" />
                  </TabPanel>
                  <TabPanel value="sdk">
                    <CodeBlock code={codeSnippets.sdk} language="typescript" />
                  </TabPanel>
                </TabContainer>
              </div>
            </div>
          </div>
        </section>

        {/* ── SECURITY, TRUST & SOVEREIGNTY ── */}
        <section id="security" className="py-20 sm:py-28 border-t border-slate-200 dark:border-brandObsidian-800 bg-slate-100/50 dark:bg-brandObsidian-900/40">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
            <div className="text-center max-w-3xl mx-auto space-y-4">
              <Badge variant="outline" size="md">
                Technical Security Architecture
              </Badge>
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-slate-900 dark:text-white leading-[1.1]">
                Zero-Trust Access & Immutable Audits
              </h2>
              <p className="text-base sm:text-lg text-slate-600 dark:text-slate-300 leading-relaxed">
                Security in Aravanta CloudOS is enforced at the database and API schema boundaries — not merely in the browser UI.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[
                {
                  icon: Lock,
                  title: 'RFC 6238 TOTP Multi-Factor Auth',
                  desc: 'Standard 30-second rotating time-step verification. Protects administrative logins with cryptographic authenticator app pairing.',
                },
                {
                  icon: ShieldCheck,
                  title: '5-Tier Server-Controlled RBAC',
                  desc: 'Strict role hierarchy (SuperAdmin, Admin, Operator, Developer, Viewer). Payloads attempting client-side scope injections are rejected.',
                },
                {
                  icon: Activity,
                  title: 'Sliding-Window Rate Limiting',
                  desc: 'Five consecutive authentication failures trigger an automatic 60-second lockout to protect accounts against credential stuffing.',
                },
                {
                  icon: FileText,
                  title: 'Cryptographic Audit Trail',
                  desc: 'Every administrative action is signed with actor IP, timestamp, and target resource, exportable as JSON audit evidence.',
                },
                {
                  icon: Globe2,
                  title: 'Sovereign Data Residency',
                  desc: 'Primary control plane deployed in ap-south-1 (Mumbai). Compliant with Indian DPDP Act standards and sovereign cloud isolation.',
                },
                {
                  icon: Shield,
                  title: 'HTTP Security Hardening',
                  desc: 'Enforces X-Content-Type-Options: nosniff, X-Frame-Options: DENY, X-XSS-Protection, and strict Content-Security-Policy headers.',
                },
              ].map((sec) => {
                const SecIcon = sec.icon;
                return (
                  <div
                    key={sec.title}
                    className="p-6 rounded-2xl bg-white dark:bg-brandObsidian-900 border border-slate-200 dark:border-brandObsidian-800 space-y-3"
                  >
                    <div className="w-10 h-10 rounded-xl bg-brandGold-500/10 text-brandGold-500 flex items-center justify-center">
                      <SecIcon className="w-5 h-5" />
                    </div>
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                      {sec.title}
                    </h3>
                    <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                      {sec.desc}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* ── ENGINEERING COMMUNITY PREVIEW ── */}
        <section id="community" className="py-20 sm:py-28 border-t border-slate-200 dark:border-brandObsidian-800">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
              <div className="space-y-4 max-w-2xl">
                <Badge variant="gold" size="md">
                  Community & Engineering Forum
                </Badge>
                <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-slate-900 dark:text-white leading-[1.1]">
                  Connect with Cloud & SRE Practitioners
                </h2>
                <p className="text-base sm:text-lg text-slate-600 dark:text-slate-300 leading-relaxed">
                  Join discussions on multi-region Kubernetes architectures, incident response playbooks, and S3 storage optimization directly inside the platform.
                </p>
              </div>

              <div>
                <Button
                  size="lg"
                  variant="outline"
                  onClick={() => onNavigate?.('community')}
                  rightIcon={<ArrowRight className="w-4 h-4" />}
                  className="cursor-pointer"
                >
                  Browse All Discussions
                </Button>
              </div>
            </div>

            {/* Real Discussion Category Previews */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[
                {
                  category: 'Architecture',
                  title: 'WireGuard VPC Mesh for Heterogeneous Multi-Region Clusters',
                  author: 'Cloud Platform Team',
                  replies: '14 replies',
                  tag: 'Networking',
                },
                {
                  category: 'Troubleshooting',
                  title: 'Automating Redis Standby Failover using ArvWatch Self-Healing Runbooks',
                  author: 'Reliability Engineering',
                  replies: '8 replies',
                  tag: 'Incident SRE',
                },
                {
                  category: 'Showcase',
                  title: 'High-Throughput File Ingestion into ArvStore using Pre-Signed URLs',
                  author: 'Core Services Lead',
                  replies: '19 replies',
                  tag: 'Object Storage',
                },
              ].map((post) => (
                <div
                  key={post.title}
                  onClick={() => onNavigate?.('community')}
                  className="p-6 rounded-2xl bg-white dark:bg-brandObsidian-900 border border-slate-200 dark:border-brandObsidian-800 hover:border-brandGold-500/50 hover:shadow-card-hover transition-all cursor-pointer flex flex-col justify-between space-y-4"
                >
                  <div className="space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-mono font-bold uppercase text-brandGold-600 dark:text-brandGold-400">
                        {post.category}
                      </span>
                      <Badge variant="outline" size="sm">{post.tag}</Badge>
                    </div>
                    <h3 className="text-base font-bold text-slate-900 dark:text-white line-clamp-2">
                      {post.title}
                    </h3>
                  </div>

                  <div className="pt-3 border-t border-slate-100 dark:border-brandObsidian-800 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 font-mono">
                    <span>{post.author}</span>
                    <span className="flex items-center gap-1">
                      <MessageSquare className="w-3.5 h-3.5 text-brandGold-500" />
                      {post.replies}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── FACTUAL CONSUMPTION PRICING & FINOPS ── */}
        <section id="pricing" className="py-20 sm:py-28 border-t border-slate-200 dark:border-brandObsidian-800 bg-slate-100/50 dark:bg-brandObsidian-900/40">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
            <div className="text-center max-w-3xl mx-auto space-y-4">
              <Badge variant="outline" size="md">
                Transparent FinOps Rates
              </Badge>
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-slate-900 dark:text-white leading-[1.1]">
                Predictable Consumption Billing in INR (₹)
              </h2>
              <p className="text-base sm:text-lg text-slate-600 dark:text-slate-300 leading-relaxed">
                Pay exclusively for resources provisioned and runtime executed. Zero hidden egress surcharges, with automated monthly GST invoicing.
              </p>

              {/* Monthly vs Annual Invoicing Toggle */}
              <div className="flex justify-center pt-2">
                <div className="inline-flex items-center p-1 rounded-xl bg-slate-200/80 dark:bg-brandObsidian-800 border border-slate-300 dark:border-brandObsidian-700 text-xs font-semibold">
                  <button
                    onClick={() => setBillingPeriod('monthly')}
                    className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                      billingPeriod === 'monthly'
                        ? 'bg-white dark:bg-brandObsidian-900 text-slate-900 dark:text-white shadow-xs'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    Monthly Metering
                  </button>
                  <button
                    onClick={() => setBillingPeriod('annual')}
                    className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer inline-flex items-center gap-1.5 ${
                      billingPeriod === 'annual'
                        ? 'bg-brandGold-500 text-brandObsidian-950 font-bold shadow-xs'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    <span>Annual Capacity</span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-800 dark:text-emerald-200 font-bold">
                      SAVE 20%
                    </span>
                  </button>
                </div>
              </div>
            </div>

            {/* Real Unit Price Rate Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {realPricingRates.map((item) => (
                <div
                  key={item.service}
                  className="p-5 rounded-2xl bg-white dark:bg-brandObsidian-900 border border-slate-200 dark:border-brandObsidian-800 space-y-2"
                >
                  <div className="text-xs font-mono font-bold text-slate-500 dark:text-slate-400">
                    {item.service}
                  </div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-2xl font-black text-slate-900 dark:text-white font-mono">
                      {billingPeriod === 'annual' ? item.annualRate : item.monthlyRate}
                    </span>
                    <span className="text-xs text-slate-500 dark:text-slate-400">
                      {item.unit}
                    </span>
                  </div>
                  <div className="text-xs text-slate-500 dark:text-slate-400">
                    {item.note}
                  </div>
                </div>
              ))}
            </div>

            <div className="text-center pt-4">
              <Button
                variant="outline"
                size="lg"
                onClick={() => onNavigate?.('pricing')}
                rightIcon={<ArrowRight className="w-4 h-4" />}
                className="cursor-pointer"
              >
                View Full Pricing Tiers & TCO Comparison
              </Button>
            </div>
          </div>
        </section>

        {/* ── ARCHITECTURE & SAFETY FAQ ── */}
        <section id="faq" className="py-20 sm:py-28 border-t border-slate-200 dark:border-brandObsidian-800">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
            <div className="text-center max-w-2xl mx-auto space-y-4">
              <Badge variant="gold" size="md">
                Platform Architecture FAQ
              </Badge>
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-slate-900 dark:text-white leading-[1.1]">
                Frequently Asked Operational Questions
              </h2>
              <p className="text-base text-slate-600 dark:text-slate-300 leading-relaxed">
                Direct answers to engineering questions about security, deployments, and multi-cloud operations.
              </p>
            </div>

            <Accordion type="single" defaultValue="0">
              {faqs.map((f, i) => (
                <AccordionItem key={i} value={String(i)}>
                  <AccordionHeader value={String(i)}>{f.q}</AccordionHeader>
                  <AccordionBody value={String(i)}>{f.a}</AccordionBody>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </section>

        {/* ── FINAL CALL TO ACTION ── */}
        <section className="py-20 sm:py-28 border-t border-slate-200 dark:border-brandObsidian-800 bg-slate-100/50 dark:bg-brandObsidian-900/40">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="relative overflow-hidden rounded-3xl bg-brandObsidian-950 text-white shadow-2xl p-8 sm:p-12 lg:p-16 text-center space-y-6">
              <div
                aria-hidden
                className="pointer-events-none absolute inset-0 opacity-[0.25]"
                style={{
                  background:
                    'radial-gradient(85% 85% at 50% -10%, rgba(198,146,59,0.55) 0%, rgba(198,146,59,0) 60%)',
                }}
              />
              <div
                aria-hidden
                className="pointer-events-none absolute -right-12 -bottom-12 w-64 h-64 sm:w-80 sm:h-80 opacity-15 select-none"
              >
                <img
                  src="/assets/aravanta-glyph-glow.png"
                  alt=""
                  className="w-full h-full object-contain filter drop-shadow-[0_0_60px_rgba(185,139,59,0.4)]"
                />
              </div>

              <div className="relative z-10 max-w-2xl mx-auto space-y-4">
                <Badge variant="gold" size="md" dot>
                  <ShieldCheck className="w-3.5 h-3.5" /> Production Ready Control Plane
                </Badge>
                <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight leading-[1.08]">
                  Ready to Access Your Sovereign Workspace?
                </h2>
                <p className="text-base sm:text-lg text-slate-300 leading-relaxed">
                  Provision compute instances, manage S3 object storage buckets, and execute GitOps canary rollouts in under 60 seconds with Aravanta CloudOS.
                </p>
              </div>

              <div className="relative z-10 flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 pt-2">
                <Button
                  size="xl"
                  variant="primary"
                  onClick={onGoToRegister}
                  className="w-full sm:w-auto bg-brandGold-500 hover:bg-brandGold-600 text-brandObsidian-950 font-bold min-h-[48px] shadow-lg shadow-brandGold-500/25 cursor-pointer"
                  rightIcon={<ArrowRight className="w-4.5 h-4.5" />}
                >
                  Get Started Free
                </Button>
                <Button
                  size="xl"
                  variant="secondary"
                  onClick={() => onNavigate?.('user-manual')}
                  className="w-full sm:w-auto min-h-[48px] cursor-pointer"
                  leftIcon={<BookOpen className="w-4 h-4 text-brandGold-400" />}
                >
                  Read User Manual
                </Button>
                <Button
                  size="xl"
                  variant="outline"
                  onClick={onGoToLogin}
                  className="w-full sm:w-auto min-h-[48px] border-slate-700 hover:border-brandGold-500 text-slate-300 cursor-pointer"
                >
                  Sign In
                </Button>
              </div>

              <div className="relative z-10 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 pt-3 text-xs sm:text-sm text-slate-400 font-medium">
                <span className="inline-flex items-center gap-1.5">
                  <Check className="w-4 h-4 text-brandGold-400" /> Instant Provisioning
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <Check className="w-4 h-4 text-brandGold-400" /> TOTP 2FA Protected
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <Check className="w-4 h-4 text-brandGold-400" /> Server-Enforced RBAC
                </span>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* ── PERSISTENT PROFESSIONAL FOOTER ── */}
      <Footer onNavigate={onNavigate} onGoToLogin={onGoToLogin} />
    </div>
  );
};
