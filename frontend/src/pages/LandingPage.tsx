import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence, Variants, useScroll, useSpring } from 'framer-motion';
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
  BarChart3,
  Boxes,
  BookOpen,
  Terminal,
  UploadCloud,
  FileText,
  Copy,
  Zap,
  Folder,
  MessageSquare,
  Cpu,
  Radio,
  CheckCircle2,
  RefreshCw,
  Key,
  Network,
  Sparkles,
  ExternalLink,
  Play,
  Layers,
  Globe2,
  Search,
  HelpCircle,
  X,
  ChevronDown,
} from 'lucide-react';

import { Navbar, LandingView } from '../components/ui/Navbar';
import { Footer } from '../components/ui/Footer';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Card, CardBody } from '../components/ui/Card';
import { Sovereign3DCanvas } from '../components/landing/Sovereign3DCanvas';
import { Sovereign3DBackground } from '../components/landing/Sovereign3DBackground';

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

const ScrollReveal: React.FC<{
  children: React.ReactNode;
  className?: string;
  delay?: number;
  reduceMotion?: boolean;
}> = ({ children, className = '', delay = 0, reduceMotion = false }) => {
  if (reduceMotion) {
    return <div className={className}>{children}</div>;
  }
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-50px' }}
      transition={{ duration: 0.55, delay, ease: [0.16, 1, 0.3, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  );
};

// ── Pan-India Sovereign Datacenter Network Regions ──
const edgeRegions = [
  {
    id: 'mumbai',
    code: 'ap-south-1',
    city: 'Mumbai',
    tier: 'Tier-IV Uptime Certified',
    latency: '7.8 ms',
    power: 'N+N Redundant Grid',
    peering: ['NIXI', 'Tata Comm', 'Airtel IQ', 'DE-CIX Mumbai'],
    status: 'Operational',
    workloads: 'Compute, K8s, S3 NVMe, DB',
  },
  {
    id: 'bengaluru',
    code: 'ap-south-2',
    city: 'Bengaluru',
    tier: 'Tier-III+ Enterprise',
    latency: '11.2 ms',
    power: 'N+1 Redundant',
    peering: ['NIXI', 'Airtel IQ', 'Jio Carrier Net'],
    status: 'Operational',
    workloads: 'Compute, K8s, DB',
  },
  {
    id: 'delhi',
    code: 'ap-north-1',
    city: 'Delhi-NCR',
    tier: 'Tier-IV Certified',
    latency: '13.6 ms',
    power: 'N+N Redundant Grid',
    peering: ['NIXI', 'Tata Comm', 'PowerGrid Telecom'],
    status: 'Operational',
    workloads: 'Compute, K8s, S3 Cold Storage',
  },
  {
    id: 'hyderabad',
    code: 'ap-south-3',
    city: 'Hyderabad',
    tier: 'Tier-III+ Cyberabad Campus',
    latency: '10.4 ms',
    power: 'N+1 Solar Backed',
    peering: ['NIXI', 'Airtel IQ', 'RailTel Core'],
    status: 'Operational',
    workloads: 'Compute, S3 NVMe, Redis Cache',
  },
  {
    id: 'chennai',
    code: 'ap-south-4',
    city: 'Chennai',
    tier: 'Tier-III+ Subsea Landing Hub',
    latency: '10.9 ms',
    power: 'N+1 Redundant',
    peering: ['NIXI', 'Tata Comm Subsea', 'DE-CIX Chennai'],
    status: 'Operational',
    workloads: 'Compute, K8s, Object Store',
  },
] as const;

// ── Verified Developer CLI, SDK & IaC Snippets ──
const devTabSnippets: Record<'terraform' | 'cli' | 'python' | 'curl', { lang: string; code: string; title: string }> = {
  terraform: {
    lang: 'hcl',
    title: 'Terraform Provider v2.4 (Multi-Region)',
    code: `# Multi-Region Aravanta Sovereign Provider
terraform {
  required_providers {
    aravanta = {
      source  = "aravanta/cloudos"
      version = "~> 2.4.0"
    }
  }
}

provider "aravanta" {
  region       = "ap-south-1" # Mumbai Sovereign Hub
  api_endpoint = "https://arv-backend.vercel.app/api/v1"
}

resource "aravanta_compute_instance" "prod_gateway" {
  name          = "api-gateway-prod"
  instance_type = "c3.4xlarge"
  image         = "ubuntu-24.04-lts"
  disk_size_gb  = 250

  tags = {
    env    = "production"
    finops = "sovereign-core"
  }
}`,
  },
  cli: {
    lang: 'bash',
    title: 'arv CLI v2.4 (Native Binary)',
    code: `# Install Aravanta CLI v2.4 (Zero External Dependencies)
# Windows (PowerShell):
irm https://aravantacloud.aravanta.tech/install.ps1 | iex

# Linux & macOS:
curl -fsSL https://aravantacloud.aravanta.tech/install.sh | bash

# Authenticate & Launch Managed Kubernetes Node Pool
arv auth login --account ARV-ACC-891044
arv k8s cluster create --name sovereign-mesh-01 --nodes 6 --region ap-south-1
arv compute list --format table`,
  },
  python: {
    lang: 'python',
    title: 'Python SDK (Async / FastAPI Native)',
    code: `from aravanta import CloudOSClient

# Initialize client in ap-south-1 (Mumbai) Sovereign Region
client = CloudOSClient(
    token="arv_sec_live_948f2b7a",
    region="ap-south-1"
)

# Provision high-throughput NVMe bucket with versioning
bucket = client.storage.create_bucket(
    name="arv-telemetry-vault",
    tier="NVMe-STANDARD",
    encryption="AES-256-GCM"
)

print(f"Bucket provisioned: {bucket.arn} [DPDPA 2023 Compliant]")`,
  },
  curl: {
    lang: 'bash',
    title: 'cURL / OpenAPI 3.1 REST Endpoints',
    code: `# Authenticate against Sovereign Control Plane
curl -X POST "https://arv-backend.vercel.app/api/v1/auth/login" \\
  -H "Content-Type: application/json" \\
  -d '{"email":"admin@enterprise.in","password":"SecurePassword123!"}'

# Provision High-Performance Compute Instance
curl -X POST "https://arv-backend.vercel.app/api/v1/compute/instances" \\
  -H "Authorization: Bearer $ARAVANTA_TOKEN" \\
  -H "Content-Type: application/json" \\
  -d '{
    "name": "worker-pool-01",
    "instance_type": "c3.4xlarge",
    "region": "ap-south-1",
    "disk_size_gb": 200
  }'`,
  },
};
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

// ── Verified Operational FAQs with Rich Domain Metadata ──
interface OperationalFaq {
  id: string;
  category: 'security' | 'storage' | 'gitops' | 'billing' | 'architecture';
  categoryLabel: string;
  badge: string;
  q: string;
  a: string;
  highlights: string[];
}

const faqs: OperationalFaq[] = [
  {
    id: 'rbac',
    category: 'security',
    categoryLabel: 'Security & IAM',
    badge: '5-Tier RBAC Matrix',
    q: 'How does Aravanta CloudOS enforce server-side RBAC and role hierarchy?',
    a: 'Every operational action is verified against a 5-tier Role-Based Access Control matrix (SuperAdmin, Admin, Operator, Developer, Viewer) backed by the database. Client payloads attempting to supply unauthorized role or permission mutations are strictly rejected at the Pydantic schema validation boundary. Critical operations like instance termination or billing updates require SuperAdmin or Admin privileges.',
    highlights: ['SuperAdmin to Viewer Hierarchy', 'Pydantic Schema Barrier', 'Zero Client Trust'],
  },
  {
    id: 'storage',
    category: 'storage',
    categoryLabel: 'Storage & S3',
    badge: 'S3-Compatible NVMe',
    q: 'How does ArvStore manage documents, files, and S3 storage buckets?',
    a: 'ArvStore provides an S3-compatible object storage layer with bucket-level access control (Private or Public-Read) and storage tiering (Standard or Glacier). Users can upload files up to 100MB with drag-and-drop, organize files into hierarchical directories using folder prefixes, copy secure download links, and preview documents directly in the console.',
    highlights: ['Multi-AZ NVMe S3', 'Hierarchical Prefixes', 'AES-256-GCM Encryption'],
  },
  {
    id: 'gitops',
    category: 'gitops',
    categoryLabel: 'GitOps & Delivery',
    badge: 'Automated 1.2s Rollback',
    q: 'How do progressive canary deployments and automated rollbacks work?',
    a: 'When a new release is triggered via GitOps or the console, ArvCD deploys a canary slice (e.g. 25% traffic). The system evaluates synthetic health probes, P95 latency thresholds, and HTTP error rates. If anomalies or SLO breaches occur, an automated rollback restores the previous stable release in under 1.2 seconds with zero dropped connections.',
    highlights: ['Canary Traffic Slices', 'Synthetic Health Probes', '1.2s Instant Revert'],
  },
  {
    id: 'billing',
    category: 'billing',
    categoryLabel: 'FinOps & Billing',
    badge: '18% GST Compliant',
    q: 'How is consumption-based FinOps billing calculated and invoiced?',
    a: 'All infrastructure consumption is metered per-second using the pricing engine rates (e.g. ₹1.50/vCPU-hr for compute, ₹1.00/GB-mo for S3 storage, ₹0.50/GB for egress). Accounts can track real-time spend against configurable monthly budget caps. Invoices are generated with standard Indian Goods and Services Tax (9% CGST + 9% SGST = 18%) and can be exported as official PDFs or interactive WebCopies.',
    highlights: ['Per-Second Metering', '18% CGST/SGST Invoicing', 'Hard Budget Caps'],
  },
  {
    id: 'auth',
    category: 'security',
    categoryLabel: 'Security & IAM',
    badge: 'RFC 6238 TOTP MFA',
    q: 'What authentication methods and security protections are implemented?',
    a: 'Aravanta CloudOS supports email and Account ID (ARV-ACC-XXXXXX) sign-in, RFC 6238 Time-based One-Time Passwords (TOTP MFA with 30-second token rotation), workspace invitation tokens, sliding-window rate limiting (5 failed attempts locks the account for 60 seconds), and cryptographic audit logging for all administrative actions.',
    highlights: ['RFC 6238 TOTP MFA', 'Account ID Sign-In', 'Sliding Rate Limiter'],
  },
  {
    id: 'architecture',
    category: 'architecture',
    categoryLabel: 'Architecture & HA',
    badge: 'FastAPI + Postgres 16',
    q: 'What is the underlying deployment and architecture of the live platform?',
    a: 'The production platform runs serverless on Vercel with a React 18 + Vite frontend and a Python 3.11 FastAPI backend connected to managed PostgreSQL. The repository also includes production-ready Kubernetes manifests and Terraform definitions for self-hosted or dedicated sovereign enterprise deployments.',
    highlights: ['FastAPI Microkernel', 'PostgreSQL 16 HA', 'Sovereign K8s / Terraform'],
  },
];

const faqCategories = [
  { id: 'all', label: 'All Operations', count: 6, icon: Layers },
  { id: 'security', label: 'Security & IAM', count: 2, icon: ShieldCheck },
  { id: 'storage', label: 'Storage & S3', count: 1, icon: HardDrive },
  { id: 'gitops', label: 'GitOps & Canary', count: 1, icon: GitBranch },
  { id: 'billing', label: 'FinOps & Billing', count: 1, icon: BarChart3 },
  { id: 'architecture', label: 'HA Architecture', count: 1, icon: Server },
] as const;

export const LandingPage: React.FC<LandingPageProps> = ({
  onGoToLogin,
  onGoToRegister,
  onOpenCommandPalette,
  onNavigate,
  onGoToConsole,
}) => {
  const [activePreviewTab, setActivePreviewTab] = useState<'dashboard' | 'storage' | 'deployments' | 'iam' | 'billing'>('dashboard');
  const [billingPeriod, setBillingPeriod] = useState<'monthly' | 'annual'>('monthly');
  const [previewRole, setPreviewRole] = useState<'SuperAdmin' | 'Operator' | 'Developer' | 'Viewer'>('Operator');
  const [previewStorageFolder, setPreviewStorageFolder] = useState<'root' | 'backups' | 'configs'>('root');
  const [previewUploadProgress, setPreviewUploadProgress] = useState<number | null>(null);
  const [copiedCodeKey, setCopiedCodeKey] = useState<string | null>(null);
  const [heroSelectedModule, setHeroSelectedModule] = useState<'vm' | 'k8s' | 's3' | 'db'>('vm');
  const [heroCopied, setHeroCopied] = useState(false);
  const [heroRightTab, setHeroRightTab] = useState<'3d' | 'blade' | 'topology'>('3d');
  const [cliCopied, setCliCopied] = useState(false);
  const [selectedEdgeRegion, setSelectedEdgeRegion] = useState<'mumbai' | 'bengaluru' | 'delhi' | 'hyderabad' | 'chennai'>('mumbai');
  const [selectedDevTab, setSelectedDevTab] = useState<'terraform' | 'cli' | 'python' | 'curl'>('terraform');
  const [devSnippetCopied, setDevSnippetCopied] = useState(false);
  const [faqCategory, setFaqCategory] = useState<'all' | 'security' | 'storage' | 'gitops' | 'billing' | 'architecture'>('all');
  const [faqSearch, setFaqSearch] = useState('');
  const [openFaqId, setOpenFaqId] = useState<string | null>('rbac');

  const filteredFaqs = useMemo(() => {
    return faqs.filter((faq) => {
      const matchesCategory = faqCategory === 'all' || faq.category === faqCategory;
      const qLower = faqSearch.toLowerCase().trim();
      if (!qLower) return matchesCategory;
      const matchesSearch =
        faq.q.toLowerCase().includes(qLower) ||
        faq.a.toLowerCase().includes(qLower) ||
        faq.badge.toLowerCase().includes(qLower) ||
        faq.highlights.some((h) => h.toLowerCase().includes(qLower));
      return matchesCategory && matchesSearch;
    });
  }, [faqCategory, faqSearch]);

  const reduceMotion = useMemo(prefersReducedMotion, []);
  const [mounted, setMounted] = useState(false);

  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, {
    stiffness: 100,
    damping: 30,
    restDelta: 0.001,
  });

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
    <div className="min-h-screen bg-slate-50 dark:bg-brandObsidian-950 text-slate-900 dark:text-slate-100 font-sans antialiased selection:bg-brandGold-500/30 selection:text-brandGold-900 dark:selection:text-brandGold-100 overflow-x-clip relative">
      {/* ── FULL-PAGE AMBIENT 3D SOVEREIGN TOPOLOGY CANVAS (SCROLL & PARALLAX REACTIVE) ── */}
      <Sovereign3DBackground />

      {/* ── GLOBAL SCROLL PROGRESS INDICATOR ── */}
      {!reduceMotion && (
        <motion.div
          style={{ scaleX }}
          className="fixed top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-brandGold-600 via-amber-400 to-brandGold-400 origin-left z-50 pointer-events-none shadow-[0_0_12px_rgba(234,179,8,0.6)]"
        />
      )}

      {/* ── PERSISTENT HEADER NAVIGATION ── */}
      <Navbar
        onGoToLogin={onGoToLogin}
        onGoToRegister={onGoToRegister}
        onOpenCommandPalette={onOpenCommandPalette}
        onNavigate={onNavigate}
        onGoToConsole={onGoToConsole}
        currentView="home"
      />

      <main id="main-content" className="relative z-10">
        {/* ── HERO SECTION ── */}
        <section className="relative overflow-hidden pt-6 sm:pt-8 lg:pt-10 pb-12 sm:pb-16">
          {/* Subtle Grid and Radial Lighting */}
          <div
            aria-hidden
            className="absolute inset-x-0 top-0 -z-10 h-[680px] bg-hero-radial opacity-60 pointer-events-none"
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
            {/* ── Split-Screen Hero Grid (7 cols left, 5 cols right on LG) ── */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-10 items-center">
              
              {/* Left Column: Eyebrow, Main Headline, Subtext, CLI Quickstart, CTAs & Trust Badges */}
              <motion.div
                variants={containerVariants}
                initial="hidden"
                animate={mounted ? 'show' : 'hidden'}
                className="lg:col-span-7 space-y-4 sm:space-y-5 text-left"
              >
                {/* Eyebrow Pill */}
                <motion.div variants={fadeUp} className="flex justify-start">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-brandGold-500/40 bg-brandGold-500/10 dark:bg-brandGold-950/40 text-brandGold-700 dark:text-brandGold-300 text-[11px] font-semibold backdrop-blur-xl ring-1 ring-brandGold-500/20 max-w-full">
                    <span className="relative flex h-2 w-2 shrink-0">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                    </span>
                    <span className="font-mono text-emerald-600 dark:text-emerald-400 font-bold uppercase tracking-wider truncate">
                      ALL 6 REGIONS OPERATIONAL
                    </span>
                    <span className="opacity-30 shrink-0">•</span>
                    <span className="font-mono text-[10px] text-brandGold-400 font-bold shrink-0">v2.4 GA</span>
                    <span className="hidden sm:inline-block opacity-30 shrink-0">•</span>
                    <span className="hidden sm:inline-flex items-center gap-1 text-[11px] font-mono text-slate-300 shrink-0">
                      <span className="w-1.5 h-1.5 rounded-full bg-brandGold-500" />
                      <span>7.8ms RTT</span>
                    </span>
                  </div>
                </motion.div>

                {/* Main Headline */}
                <motion.h1
                  variants={fadeUp}
                  className="text-3xl sm:text-4xl lg:text-[42px] xl:text-5xl font-black tracking-tight leading-[1.08] text-slate-900 dark:text-white font-sans"
                >
                  Aravanta Cloud OS
                  <span className="block mt-1.5 text-xl sm:text-2xl md:text-3xl lg:text-4xl font-extrabold bg-gradient-to-r from-brandGold-600 via-amber-400 to-brandGold-400 bg-clip-text text-transparent drop-shadow-xs">
                    The Sovereign Multi-Cloud Operating System
                  </span>
                </motion.h1>

                {/* Supporting Copy */}
                <motion.p
                  variants={fadeUp}
                  className="text-xs sm:text-sm md:text-base text-slate-600 dark:text-slate-300 leading-relaxed font-normal max-w-xl"
                >
                  Deploy dedicated AMD EPYC™ compute, managed Kubernetes clusters, NVMe S3 storage, and HA Postgres directly within India's borders. Enforce DPDPA 2023 compliance with zero cross-border transit, WireGuard® kernel mesh, and transparent per-second billing in INR (₹).
                </motion.p>

                {/* Authentic 1-Click CLI Quickstart Chip */}
                <motion.div variants={fadeUp} className="pt-0.5">
                  <div className="w-full sm:inline-flex items-center gap-2 p-1.5 pr-2.5 rounded-xl bg-slate-900/95 dark:bg-[#080d16] border border-slate-800 dark:border-brandGold-500/30 text-xs font-mono text-slate-300 shadow-xl backdrop-blur-md flex justify-between max-w-lg">
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                      <span className="px-2 py-0.5 rounded-lg bg-black/60 text-brandGold-400 font-bold border border-white/5 shrink-0 text-[10px] font-mono">$</span>
                      <span className="text-slate-200 select-all font-semibold font-mono text-[11px] sm:text-xs truncate">
                        curl -sSL https://get.aravanta.com | bash
                      </span>
                    </div>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText('curl -sSL https://get.aravanta.com | bash && arv login');
                        setCliCopied(true);
                        setTimeout(() => setCliCopied(false), 2000);
                      }}
                      className="ml-2 px-2.5 py-1 rounded-lg text-slate-400 hover:text-brandGold-300 hover:bg-white/5 transition-all cursor-pointer flex items-center gap-1.5 font-sans text-[11px] font-semibold border border-transparent hover:border-brandGold-500/30 shrink-0"
                      title="Copy quickstart command"
                    >
                      {cliCopied ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                          <span className="text-emerald-400">Copied</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span>Copy</span>
                        </>
                      )}
                    </button>
                  </div>
                </motion.div>

                {/* Real Aligned Responsive CTAs */}
                <motion.div
                  variants={fadeUp}
                  className="flex flex-wrap items-center gap-3 pt-1 w-full"
                >
                  <Button
                    size="lg"
                    variant="primary"
                    onClick={onGoToRegister}
                    className="h-11 sm:h-12 px-6 rounded-xl bg-brandGold-500 hover:bg-brandGold-600 text-brandObsidian-950 font-bold text-sm sm:text-base shadow-lg shadow-brandGold-500/25 hover:shadow-brandGold-500/40 hover:-translate-y-0.5 transition-all btn-press cursor-pointer shrink-0"
                    rightIcon={<ArrowRight className="w-4 h-4" />}
                  >
                    Deploy Free in 60s
                  </Button>
                  <Button
                    size="lg"
                    variant="outline"
                    onClick={() => onNavigate?.('cli')}
                    className="h-11 sm:h-12 px-5 rounded-xl border border-slate-300 dark:border-brandObsidian-700 bg-white/90 dark:bg-brandObsidian-900/90 hover:border-brandGold-500 text-slate-800 dark:text-slate-200 hover:text-brandGold-600 dark:hover:text-brandGold-400 font-bold text-sm shadow-xs hover:-translate-y-0.5 transition-all btn-press cursor-pointer shrink-0"
                    leftIcon={<Terminal className="w-4 h-4 text-brandGold-500" />}
                  >
                    Web Terminal
                  </Button>
                </motion.div>

                {/* Inline Systems-Grade Trust Badges Bar */}
                <motion.div
                  variants={fadeUp}
                  className="grid grid-cols-2 sm:flex sm:flex-wrap items-center gap-x-4 gap-y-2 pt-2 text-[11px] font-mono text-slate-500 dark:text-slate-400"
                >
                  <span className="inline-flex items-center gap-1.5 truncate">
                    <CheckCircle2 className="w-3.5 h-3.5 text-brandGold-500 shrink-0" />
                    <span>100% In-Country</span>
                  </span>
                  <span className="inline-flex items-center gap-1.5 truncate">
                    <ShieldCheck className="w-3.5 h-3.5 text-brandGold-500 shrink-0" />
                    <span>Tier-IV ISO 27001</span>
                  </span>
                  <span className="inline-flex items-center gap-1.5 truncate">
                    <Lock className="w-3.5 h-3.5 text-brandGold-500 shrink-0" />
                    <span>DPDPA 2023</span>
                  </span>
                  <span className="inline-flex items-center gap-1.5 truncate">
                    <Cpu className="w-3.5 h-3.5 text-brandGold-500 shrink-0" />
                    <span>AMD EPYC™ Genoa</span>
                  </span>
                </motion.div>
              </motion.div>

              {/* Right Column: Hero Interactive Sovereign Cloud Control Deck with Standardized Card Size */}
              <motion.div
                initial={reduceMotion ? { opacity: 1 } : { opacity: 0, x: 20 }}
                animate={mounted ? { opacity: 1, x: 0 } : {}}
                transition={{ duration: 0.6, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
                className="lg:col-span-5 relative space-y-2.5"
              >
                {/* Ambient glow behind right artifact */}
                <div className="absolute -inset-4 rounded-[2.5rem] bg-gradient-to-tr from-brandGold-500/20 via-amber-500/10 to-transparent blur-2xl -z-10" />

                {/* Deck Mode Segmented Controller */}
                <div className="flex items-center justify-between p-1 rounded-2xl bg-white/95 dark:bg-[#0c121e]/95 border border-slate-200/90 dark:border-brandGold-500/30 backdrop-blur-xl shadow-lg ring-1 ring-black/5 dark:ring-brandGold-500/10 shrink-0">
                  <div className="flex items-center gap-1 text-xs font-mono font-bold w-full">
                    {[
                      { id: '3d', label: '3D Mesh', icon: Globe2 },
                      { id: 'blade', label: 'Console Blade', icon: Server },
                      { id: 'topology', label: 'Topology', icon: Network },
                    ].map((tab) => {
                      const Icon = tab.icon;
                      const active = heroRightTab === tab.id;
                      return (
                        <button
                          key={tab.id}
                          onClick={() => setHeroRightTab(tab.id as any)}
                          className={`flex-1 py-1.5 px-2 rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer text-[11px] ${
                            active
                              ? 'bg-brandGold-500 text-brandObsidian-950 font-bold shadow-md shadow-brandGold-500/20'
                              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-brandObsidian-800/60'
                          }`}
                        >
                          <Icon className="w-3.5 h-3.5" />
                          <span>{tab.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* View 1: 3D Sovereign Canvas Deck */}
                {heroRightTab === '3d' && (
                  <div className="relative h-[390px] sm:h-[430px] lg:h-[460px]">
                    <Sovereign3DCanvas
                      className="w-full h-full"
                      selectedNodeId={selectedEdgeRegion}
                      onSelectNode={(node) => {
                        if (['mumbai', 'bengaluru', 'delhi', 'hyderabad', 'chennai'].includes(node.id)) {
                          setSelectedEdgeRegion(node.id as any);
                        }
                      }}
                    />
                  </div>
                )}

                {/* View 2: The Metallic Obsidian & Gold Workload Blade Card */}
                {heroRightTab === 'blade' && (
                  <div className="rounded-3xl border border-slate-200/90 dark:border-brandGold-500/30 bg-white/95 dark:bg-[#0c121e]/95 p-4 sm:p-5 shadow-2xl backdrop-blur-xl h-[390px] sm:h-[430px] lg:h-[460px] flex flex-col justify-between ring-1 ring-black/5 dark:ring-brandGold-500/10 animate-in fade-in duration-300">
                    {/* Top Bar: Live Node Selector */}
                    <div className="flex items-center justify-between pb-2.5 border-b border-slate-100 dark:border-brandObsidian-800 shrink-0">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-lg bg-brandGold-500/10 text-brandGold-500 flex items-center justify-center">
                          <Server className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="text-xs font-bold text-slate-900 dark:text-white font-mono flex items-center gap-1.5">
                            <span>ap-south-1a</span>
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                          </div>
                          <div className="text-[10px] text-slate-500 font-mono">Tier-IV Sovereign Core</div>
                        </div>
                      </div>
                      <Badge variant="gold" size="sm" className="font-mono text-[10px]">
                        SLO: 99.99%
                      </Badge>
                    </div>

                    {/* Interactive Workload Switcher Pills */}
                    <div className="grid grid-cols-4 gap-1 p-1 rounded-xl bg-slate-100 dark:bg-brandObsidian-900/80 border border-slate-200/60 dark:border-brandObsidian-800 text-[11px] font-mono font-bold shrink-0 my-1">
                      {[
                        { id: 'vm', label: 'Compute', icon: Server },
                        { id: 'k8s', label: 'Kube', icon: Boxes },
                        { id: 's3', label: 'S3 Store', icon: HardDrive },
                        { id: 'db', label: 'Postgres', icon: Database },
                      ].map((m) => {
                        const Icon = m.icon;
                        const active = heroSelectedModule === m.id;
                        return (
                          <button
                            key={m.id}
                            onClick={() => setHeroSelectedModule(m.id as any)}
                            className={`py-1.5 px-1.5 rounded-lg flex items-center justify-center gap-1 transition-all cursor-pointer ${
                              active
                                ? 'bg-brandGold-500 text-brandObsidian-950 shadow-xs'
                                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                            }`}
                          >
                            <Icon className="w-3 h-3" />
                            <span>{m.label}</span>
                          </button>
                        );
                      })}
                    </div>

                    {/* Blade Body */}
                    <div className="relative rounded-2xl overflow-hidden p-4 sm:p-5 bg-gradient-to-br from-[#121929] via-[#090d16] to-[#04070c] border border-brandGold-500/40 text-white shadow-xl flex-1 flex flex-col justify-between my-1">
                      <div className="absolute top-0 inset-x-0 h-0.5 bg-gradient-to-r from-transparent via-brandGold-400 to-transparent" />
                      <div className="absolute -top-12 -right-12 w-28 h-28 bg-brandGold-500/20 rounded-full blur-xl pointer-events-none" />

                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-xl bg-brandGold-500/20 border border-brandGold-500/40 flex items-center justify-center">
                            <Cpu className="w-4 h-4 text-brandGold-400" />
                          </div>
                          <div>
                            <div className="text-xs font-bold text-white tracking-wide font-sans">
                              {heroSelectedModule === 'vm' ? 'c3.4xlarge-epyc-prod' :
                               heroSelectedModule === 'k8s' ? 'k8s-mumbai-cluster-01' :
                               heroSelectedModule === 's3' ? 'arv-production-vault' : 'mumbai-pg-ha-cluster'}
                            </div>
                            <div className="text-[10px] font-mono text-brandGold-400">
                              {heroSelectedModule === 'vm' ? 'AMD EPYC 9654 (Dedicated)' :
                               heroSelectedModule === 'k8s' ? 'Kubernetes 1.30 (3-Node HA)' :
                               heroSelectedModule === 's3' ? 'NVMe S3 Standard (Multi-AZ)' : 'PostgreSQL 16 HA Standby'}
                            </div>
                          </div>
                        </div>
                        <span className="text-[9px] font-mono font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                          RUNNING
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-2.5 pt-1 text-xs font-mono">
                        <div className="p-2.5 rounded-xl bg-white/5 border border-white/10">
                          <div className="text-[10px] text-slate-400 uppercase">Core Capacity</div>
                          <div className="text-sm font-bold text-white mt-0.5">
                            {heroSelectedModule === 'vm' ? '64 vCPU / 128GB' :
                             heroSelectedModule === 'k8s' ? '18 Nodes / 144 Pods' :
                             heroSelectedModule === 's3' ? '14.8 TB Active NVMe' : '16 vCPU / 64GB RAM'}
                          </div>
                        </div>
                        <div className="p-2.5 rounded-xl bg-white/5 border border-white/10">
                          <div className="text-[10px] text-slate-400 uppercase">Edge Latency</div>
                          <div className="text-sm font-bold text-brandGold-400 mt-0.5">
                            7.8 ms (ap-south-1)
                          </div>
                        </div>
                      </div>

                      <div className="space-y-1.5 pt-0.5">
                        <div className="flex justify-between text-[11px] font-mono text-slate-300">
                          <span>CPU Fleet Utilization</span>
                          <span className="font-bold text-emerald-400">32.4% Optimal</span>
                        </div>
                        <div className="h-1.5 rounded-full bg-white/10 overflow-hidden">
                          <div className="h-full bg-gradient-to-r from-emerald-500 to-brandGold-400 w-[32.4%] rounded-full" />
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-2 border-t border-white/10 text-[11px] font-mono">
                        <span className="text-slate-400">Rate: ₹1.50 / vCPU-hr</span>
                        <button
                          onClick={() => {
                            navigator.clipboard.writeText('arv compute connect prod-api-gateway-c3');
                            setHeroCopied(true);
                            setTimeout(() => setHeroCopied(false), 2000);
                          }}
                          className="text-brandGold-400 hover:text-brandGold-300 flex items-center gap-1 cursor-pointer font-bold"
                        >
                          {heroCopied ? (
                            <>
                              <Check className="w-3.5 h-3.5 text-emerald-400" />
                              <span>Command Copied!</span>
                            </>
                          ) : (
                            <>
                              <Terminal className="w-3.5 h-3.5" />
                              <span>Copy SSH CLI</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* View 3: Multi-Region Topology Matrix */}
                {heroRightTab === 'topology' && (
                  <div className="rounded-3xl border border-slate-200/90 dark:border-brandGold-500/30 bg-white/95 dark:bg-[#0c121e]/95 p-4 sm:p-5 shadow-2xl backdrop-blur-xl h-[390px] sm:h-[430px] lg:h-[460px] flex flex-col justify-between ring-1 ring-black/5 dark:ring-brandGold-500/10 animate-in fade-in duration-300">
                    <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-brandObsidian-800 shrink-0">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-lg bg-brandGold-500/10 text-brandGold-500 flex items-center justify-center">
                          <Network className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="text-xs font-bold text-slate-900 dark:text-white font-mono">Pan-India WireGuard Mesh</div>
                          <div className="text-[10px] text-slate-500 font-mono">6 Regions • Zero Cross-Border Transit</div>
                        </div>
                      </div>
                      <span className="text-[9px] font-mono font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40">
                        100% OPERATIONAL
                      </span>
                    </div>

                    <div className="space-y-1.5 font-mono text-xs flex-1 flex flex-col justify-between py-2">
                      {edgeRegions.map((region) => (
                        <div
                          key={region.id}
                          className="p-2 sm:p-2.5 rounded-xl bg-slate-50 dark:bg-brandObsidian-900 border border-slate-200/60 dark:border-brandObsidian-800 flex items-center justify-between hover:border-brandGold-500/40 transition-colors"
                        >
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-emerald-500" />
                            <div>
                              <div className="font-bold text-slate-900 dark:text-white text-[11px]">
                                {region.city} ({region.code})
                              </div>
                              <div className="text-[9px] text-slate-500 dark:text-slate-400">
                                {region.peering.slice(0, 2).join(' • ')}
                              </div>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="font-bold text-brandGold-600 dark:text-brandGold-400 text-[11px]">
                              {region.latency}
                            </div>
                            <div className="text-[9px] text-slate-400">P95 RTT</div>
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-brandObsidian-800 text-[10px] font-mono text-slate-400 shrink-0">
                      <span className="flex items-center gap-1.5 text-emerald-400 font-bold">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                        Kernel Mesh Active
                      </span>
                      <span>Zero Cross-Border Egress</span>
                    </div>
                  </div>
                )}

                {/* Floating Micro Highlights Row (Always visible under right artifact) */}
                <div className="grid grid-cols-2 gap-2 pt-0.5">
                  <div className="flex items-center gap-2 p-2.5 rounded-2xl bg-white/90 dark:bg-brandObsidian-900/90 border border-slate-200/60 dark:border-brandObsidian-800 text-[11px] shadow-sm">
                    <Sparkles className="w-3.5 h-3.5 text-brandGold-500 shrink-0" />
                    <div className="truncate">
                      <div className="font-bold text-slate-800 dark:text-slate-200">₹4,000 Free Credits</div>
                      <div className="text-[10px] text-slate-500">Auto-applied on signup</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 p-2.5 rounded-2xl bg-white/90 dark:bg-brandObsidian-900/90 border border-slate-200/60 dark:border-brandObsidian-800 text-[11px] shadow-sm">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                    <div className="truncate">
                      <div className="font-bold text-slate-800 dark:text-slate-200">Zero Egress Fees</div>
                      <div className="text-[10px] text-slate-500">Free internal network</div>
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>

            {/* ── Factual Spec Strip with Subtle Glass Polish (Immediately Below Hero Split) ── */}
            <motion.div
              variants={fadeUp}
              initial="hidden"
              animate={mounted ? 'show' : 'hidden'}
              className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 pt-12 sm:pt-14 max-w-7xl mx-auto w-full"
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

        {/* ── PAN-INDIA SOVEREIGN DATACENTER NETWORK & LATENCY MATRIX (Inspired by Image 2 Reference) ── */}
        <section id="network" className="py-20 sm:py-28 border-t border-slate-200 dark:border-brandObsidian-800 bg-slate-50/70 dark:bg-brandObsidian-950/60 relative overflow-hidden">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
            
            {/* Header with Title and Executive Summary */}
            <ScrollReveal reduceMotion={reduceMotion} className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
              <div className="space-y-4 max-w-3xl">
                <Badge variant="gold" size="md">
                  Pan-India Sovereign Edge Infrastructure
                </Badge>
                <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-slate-900 dark:text-white leading-[1.08]">
                  Sub-10ms Sovereign Cloud Mesh Across Indian Metros
                </h2>
                <p className="text-base sm:text-lg text-slate-600 dark:text-slate-300 leading-relaxed">
                  Interconnected across Tier-IV carrier-neutral sovereign data hubs via dedicated high-bandwidth dark fiber. Guaranteed 100% in-country data residency under the Digital Personal Data Protection Act (DPDPA 2023) with zero cross-border telemetry leakage.
                </p>
              </div>

              {/* Transit peering badges */}
              <div className="flex flex-wrap lg:flex-col items-start lg:items-end gap-2 text-xs font-mono text-slate-500 dark:text-slate-400">
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white dark:bg-brandObsidian-900 border border-slate-200 dark:border-brandObsidian-800 shadow-xs">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="font-bold text-slate-800 dark:text-slate-200">Carrier Interconnects:</span>
                  <span>NIXI • Tata • Airtel • Jio</span>
                </div>
                <div className="inline-flex items-center gap-1.5 text-[11px] text-brandGold-600 dark:text-brandGold-400">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>MeitY Tier-IV Standards Compliant</span>
                </div>
              </div>
            </ScrollReveal>

            {/* Split Grid: Interactive Region Selector + Telemetry Radar */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              
              {/* Left Column (7 cols): Interactive Region Cards */}
              <ScrollReveal reduceMotion={reduceMotion} delay={0.1} className="lg:col-span-7 space-y-4">
                <div className="text-xs font-mono font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Select Active Sovereign Region Hub:
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {edgeRegions.map((region) => {
                    const isSelected = selectedEdgeRegion === region.id;
                    return (
                      <button
                        key={region.id}
                        onClick={() => setSelectedEdgeRegion(region.id as any)}
                        className={`p-4 rounded-2xl border text-left transition-all duration-200 cursor-pointer flex flex-col justify-between space-y-3 ${
                          isSelected
                            ? 'bg-white dark:bg-brandObsidian-900 border-brandGold-500 shadow-md shadow-brandGold-500/10 ring-1 ring-brandGold-500/50'
                            : 'bg-white/80 dark:bg-brandObsidian-900/60 border-slate-200/90 dark:border-brandObsidian-800 hover:border-brandGold-500/40 text-slate-700 dark:text-slate-300'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-emerald-500" />
                            <span className="font-bold text-slate-900 dark:text-white text-sm">
                              {region.city}
                            </span>
                          </div>
                          <span className="font-mono text-xs font-bold px-2 py-0.5 rounded-full bg-brandGold-500/15 text-brandGold-700 dark:text-brandGold-300">
                            {region.code}
                          </span>
                        </div>

                        <div className="text-xs text-slate-500 dark:text-slate-400 font-mono">
                          {region.tier}
                        </div>

                        <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-brandObsidian-800 text-[11px] font-mono">
                          <span className="text-slate-500">P95 RTT Ping:</span>
                          <span className="font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                            <Radio className="w-3 h-3 text-emerald-500" />
                            {region.latency}
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>

                {/* Selected Region Detailed Specs Banner */}
                {(() => {
                  const currentRegion = edgeRegions.find((r) => r.id === selectedEdgeRegion) || edgeRegions[0];
                  return (
                    <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-brandObsidian-900 border border-slate-200 dark:border-brandObsidian-800 shadow-sm space-y-3">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-lg bg-brandGold-500/10 text-brandGold-500 flex items-center justify-center font-bold text-xs">
                            <Network className="w-4 h-4" />
                          </div>
                          <div>
                            <div className="text-xs font-bold text-slate-900 dark:text-white">
                              {currentRegion.city} Sovereign Core ({currentRegion.code})
                            </div>
                            <div className="text-[11px] text-slate-500 font-mono">
                              Power Architecture: {currentRegion.power}
                            </div>
                          </div>
                        </div>
                        <Badge variant="outline" size="sm" className="font-mono text-[10px]">
                          {currentRegion.status}
                        </Badge>
                      </div>

                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {currentRegion.peering.map((peer) => (
                          <span
                            key={peer}
                            className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-brandObsidian-800 text-slate-700 dark:text-slate-300 font-mono text-[10px] border border-slate-200 dark:border-brandObsidian-700"
                          >
                            Peered: {peer}
                          </span>
                        ))}
                      </div>

                      <div className="text-xs text-slate-600 dark:text-slate-300 font-mono pt-1 flex items-center justify-between border-t border-slate-100 dark:border-brandObsidian-800">
                        <span>Workloads Hosted: {currentRegion.workloads}</span>
                        <span className="text-brandGold-600 dark:text-brandGold-400 font-bold">100% Onshore</span>
                      </div>
                    </div>
                  );
                })()}
              </ScrollReveal>

              {/* Right Column (5 cols): Sovereign Guarantee Card & Verified Infrastructure Quote */}
              <ScrollReveal reduceMotion={reduceMotion} delay={0.2} className="lg:col-span-5 space-y-4">
                
                {/* Visual Sovereign Compliance Card */}
                <div className="p-6 rounded-3xl bg-gradient-to-br from-[#121929] via-[#090d16] to-[#04070c] border border-brandGold-500/40 text-white shadow-xl space-y-4 relative overflow-hidden">
                  <div className="absolute -top-16 -right-16 w-36 h-36 bg-brandGold-500/15 rounded-full blur-2xl pointer-events-none" />
                  
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-mono uppercase font-bold text-brandGold-400 flex items-center gap-1.5">
                      <ShieldCheck className="w-4 h-4 text-brandGold-400" />
                      Sovereign Data Guarantee
                    </span>
                    <Badge variant="gold" size="sm" className="text-[10px] font-mono">
                      DPDPA 2023
                    </Badge>
                  </div>

                  <h3 className="text-xl font-bold tracking-tight text-white leading-snug">
                    Zero Cross-Border Routing. Absolute Jurisdiction Protection.
                  </h3>

                  <p className="text-xs text-slate-300 leading-relaxed">
                    Under Indian Digital Personal Data Protection mandates, your transactional tables, object assets, and encryption keys never transit international cables or non-Indian cloud jurisdictions.
                  </p>

                  <div className="grid grid-cols-2 gap-3 pt-2 text-xs font-mono">
                    <div className="p-3 rounded-xl bg-white/5 border border-white/10">
                      <div className="text-[10px] text-slate-400 uppercase">Packet Path</div>
                      <div className="text-sm font-bold text-emerald-400 mt-1">100% Domestic</div>
                    </div>
                    <div className="p-3 rounded-xl bg-white/5 border border-white/10">
                      <div className="text-[10px] text-slate-400 uppercase">Egress Tax</div>
                      <div className="text-sm font-bold text-brandGold-400 mt-1">₹0.00 Internal</div>
                    </div>
                  </div>
                </div>

                {/* SRE Testimonial Card (Directly mirrors Image 2's executive quote under map) */}
                <div className="p-5 sm:p-6 rounded-2xl bg-white dark:bg-brandObsidian-900 border border-slate-200 dark:border-brandObsidian-800 shadow-sm space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-full bg-gradient-to-tr from-brandGold-500 to-amber-300 flex items-center justify-center text-brandObsidian-950 font-bold text-sm shadow-md">
                      AD
                    </div>
                    <div>
                      <div className="text-sm font-bold text-slate-900 dark:text-white">
                        Ananya Desai
                      </div>
                      <div className="text-xs text-slate-500 dark:text-slate-400 font-mono">
                        VP of Core Infrastructure, BharatPay Fintech
                      </div>
                    </div>
                  </div>

                  <blockquote className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 italic leading-relaxed">
                    &ldquo;Migrating our core payment workloads to Aravanta&apos;s Mumbai and Bengaluru sovereign regions dropped our checkout P99 latency from 180ms to 24ms while eliminating all foreign egress surcharges. The compliance audits went from weeks to zero friction.&rdquo;
                  </blockquote>

                  <div className="flex items-center gap-2 pt-1 text-[11px] font-mono text-emerald-600 dark:text-emerald-400">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Verified Production Workload • ₹320 Cr/mo Processed</span>
                  </div>
                </div>
              </ScrollReveal>
            </div>
          </div>
        </section>

        {/* ── CORE CAPABILITIES SECTION ── */}
        <section id="capabilities" className="py-20 sm:py-28 border-t border-slate-200 dark:border-brandObsidian-800">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
            <ScrollReveal reduceMotion={reduceMotion} className="text-center max-w-3xl mx-auto space-y-4">
              <Badge variant="gold" size="md">
                Verified Capabilities
              </Badge>
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-slate-900 dark:text-white leading-[1.1]">
                Real Cloud Infrastructure Primitives
              </h2>
              <p className="text-base sm:text-lg text-slate-600 dark:text-slate-300 leading-relaxed">
                Every service below is backed by running backend routers, database schemas, and visual console views in Aravanta CloudOS.
              </p>
            </ScrollReveal>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {capabilities.map((cap, idx) => {
                const Icon = cap.icon;
                return (
                  <motion.div
                    key={cap.title}
                    initial={reduceMotion ? {} : { opacity: 0, y: 24 }}
                    whileInView={reduceMotion ? {} : { opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: '-40px' }}
                    transition={{ duration: 0.45, delay: (idx % 3) * 0.08 }}
                    className="h-full"
                  >
                    <Card
                      hover
                      className="group border-slate-200 dark:border-brandObsidian-700/80 bg-white dark:bg-brandObsidian-900 flex flex-col justify-between h-full"
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
                  </motion.div>
                );
              })}
            </div>
          </div>
        </section>

        {/* ── 3-STEP SOVEREIGN WORKLOAD ONBOARDING (Inspired by Image 2 Reference) ── */}
        <section id="onboarding" className="py-20 sm:py-28 border-t border-slate-200 dark:border-brandObsidian-800 bg-slate-100/50 dark:bg-brandObsidian-900/40">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            
            {/* The Signature Curved Enterprise Container */}
            <motion.div
              initial={reduceMotion ? {} : { opacity: 0, y: 30 }}
              whileInView={reduceMotion ? {} : { opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-60px' }}
              transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
              className="rounded-3xl border border-brandGold-500/30 bg-gradient-to-br from-[#0e1526] via-[#090d16] to-[#04070c] p-8 sm:p-12 lg:p-16 relative overflow-hidden shadow-2xl text-center space-y-10"
            >
              {/* Subtle ambient lighting arc */}
              <div className="absolute top-0 inset-x-0 h-40 bg-gradient-to-b from-brandGold-500/15 via-brandGold-500/5 to-transparent blur-2xl pointer-events-none" />
              <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-96 h-96 bg-brandGold-500/10 rounded-full blur-3xl pointer-events-none" />

              {/* Header */}
              <div className="max-w-3xl mx-auto space-y-4 relative z-10">
                <Badge variant="gold" size="md">
                  Zero-Friction Sovereign Migration
                </Badge>
                <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-white leading-[1.08]">
                  Deploy Sovereign Workloads in Under 3 Minutes
                </h2>
                <p className="text-sm sm:text-base md:text-lg text-slate-300 leading-relaxed font-normal">
                  Zero proprietary vendor lock-in. Migrate existing workloads seamlessly from AWS, Azure, or on-premise bare metal using open standards, native S3 APIs, and standard OCI container images.
                </p>
              </div>

              {/* Protocol Interop Badges (Floating along arc like Image 2) */}
              <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3 relative z-10 max-w-4xl mx-auto">
                {[
                  { label: 'S3 API v4 Compatible', icon: HardDrive },
                  { label: 'Kubernetes v1.30 HA', icon: Boxes },
                  { label: 'OCI / Docker Registry', icon: Layers },
                  { label: 'NVMe Direct Block Storage', icon: Server },
                  { label: 'WireGuard Mesh VPC', icon: Network },
                ].map((item) => {
                  const ItemIcon = item.icon;
                  return (
                    <div
                      key={item.label}
                      className="px-3.5 py-1.5 rounded-full bg-white/5 border border-white/10 hover:border-brandGold-500/40 text-slate-300 hover:text-white text-xs font-mono flex items-center gap-2 transition-colors shadow-xs backdrop-blur-md"
                    >
                      <ItemIcon className="w-3.5 h-3.5 text-brandGold-400" />
                      <span>{item.label}</span>
                    </div>
                  );
                })}
              </div>

              {/* 3 Step Cards (01, 02, 03) */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative z-10 text-left">
                {[
                  {
                    step: '01',
                    icon: Key,
                    title: 'Create Sovereign Workspace',
                    desc: 'Sign up with Account ID (ARV-ACC-XXXXXX) or corporate email. Pair RFC 6238 30-second TOTP authenticator and enforce granular 5-tier RBAC permissions.',
                    badge: 'Instant Setup',
                  },
                  {
                    step: '02',
                    icon: Terminal,
                    title: 'Deploy via GitOps, CLI or Web Shell',
                    desc: 'Push Docker OCI containers, apply declarative Terraform plans, or launch pre-hardened AMD EPYC VM shapes with NVMe volumes in under 60 seconds.',
                    badge: '< 60s Velocity',
                  },
                  {
                    step: '03',
                    icon: RefreshCw,
                    title: 'Auto-Scale, Monitor & Settle in INR',
                    desc: 'Observe live Prometheus metrics, enable automated Canary rollbacks on latency spikes, and settle consumption via UPI, NetBanking, or GST tax invoices.',
                    badge: 'Zero Egress Tax',
                  },
                ].map((s, idx) => {
                  const SIcon = s.icon;
                  return (
                    <motion.div
                      key={s.step}
                      initial={reduceMotion ? {} : { opacity: 0, y: 20 }}
                      whileInView={reduceMotion ? {} : { opacity: 1, y: 0 }}
                      viewport={{ once: true, margin: '-30px' }}
                      transition={{ duration: 0.45, delay: idx * 0.12 }}
                      className="p-6 rounded-2xl bg-white/5 border border-white/10 hover:border-brandGold-500/50 hover:bg-white/10 transition-all duration-300 flex flex-col justify-between space-y-4 group"
                    >
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="w-9 h-9 rounded-xl bg-brandGold-500/20 text-brandGold-400 border border-brandGold-500/30 flex items-center justify-center font-mono font-bold text-sm">
                            {s.step}
                          </span>
                          <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-white/10 text-slate-300 border border-white/10 group-hover:border-brandGold-500/40 transition-colors">
                            {s.badge}
                          </span>
                        </div>

                        <div className="w-9 h-9 rounded-xl bg-white/5 text-slate-300 flex items-center justify-center group-hover:text-brandGold-400 transition-colors">
                          <SIcon className="w-5 h-5" />
                        </div>

                        <h3 className="text-lg font-bold text-white tracking-tight">
                          {s.title}
                        </h3>

                        <p className="text-xs text-slate-300 leading-relaxed font-normal">
                          {s.desc}
                        </p>
                      </div>

                      <div className="pt-3 border-t border-white/10 flex items-center justify-between text-[11px] font-mono text-brandGold-400">
                        <span>Production Verified</span>
                        <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                      </div>
                    </motion.div>
                  );
                })}
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center justify-center gap-3 pt-4 relative z-10">
                <Button
                  size="lg"
                  variant="primary"
                  onClick={onGoToRegister}
                  className="h-12 px-7 rounded-xl bg-brandGold-500 hover:bg-brandGold-600 text-brandObsidian-950 font-bold text-sm shadow-lg shadow-brandGold-500/25 cursor-pointer"
                  rightIcon={<ArrowRight className="w-4 h-4" />}
                >
                  Create Sovereign Account
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  onClick={() => onNavigate?.('documentation')}
                  className="h-12 px-6 rounded-xl border-white/20 bg-white/5 hover:bg-white/10 text-white font-bold text-sm cursor-pointer"
                  leftIcon={<BookOpen className="w-4 h-4 text-brandGold-400" />}
                >
                  Read Migration Architecture Guide
                </Button>
              </div>
            </motion.div>
          </div>
        </section>

        {/* ── DEVELOPER EXPERIENCE & GITOPS TOOLCHAIN (Inspired by Image 2 Reference) ── */}
        <section id="developers" className="py-20 sm:py-28 border-t border-slate-200 dark:border-brandObsidian-800">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
            
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-start">
              {/* Left Column (5 cols): Context, Integration Logos & Documentation CTA */}
              <ScrollReveal reduceMotion={reduceMotion} className="lg:col-span-5 space-y-6 lg:sticky lg:top-24">
                <Badge variant="gold" size="md">
                  Developer-First Toolchain
                </Badge>
                <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-slate-900 dark:text-white leading-[1.08]">
                  Built for GitOps, Terraform, and Terminal Natives
                </h2>
                <p className="text-base sm:text-lg text-slate-600 dark:text-slate-300 leading-relaxed">
                  Every sovereign primitive accessible in the console is addressable through declarative IaC, cross-platform CLI binaries, or OpenAPI 3.1 endpoints.
                </p>

                {/* Ecosystem Integrations Grid (Mirroring Image 2 Partner ecosystem) */}
                <div className="space-y-3 pt-2">
                  <div className="text-xs font-mono font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    First-Class Native Integrations:
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                    {[
                      { name: 'Terraform & OpenTofu', tag: 'Provider v2.4' },
                      { name: 'Kubernetes & Helm', tag: 'v1.30 Native' },
                      { name: 'Docker / OCI Registry', tag: 'Multi-Arch' },
                      { name: 'Prometheus & OTel', tag: 'P99 Realtime' },
                      { name: 'PostgreSQL 16 HA', tag: 'PgBouncer' },
                      { name: 'GitHub / GitLab CI', tag: 'GitOps Webhook' },
                    ].map((tool) => (
                      <div
                        key={tool.name}
                        className="p-2.5 rounded-xl bg-white dark:bg-brandObsidian-900 border border-slate-200/90 dark:border-brandObsidian-800 flex items-center justify-between shadow-xs"
                      >
                        <span className="font-bold text-slate-800 dark:text-slate-200 truncate">
                          {tool.name}
                        </span>
                        <span className="text-[10px] text-brandGold-600 dark:text-brandGold-400 font-semibold shrink-0">
                          {tool.tag}
                        </span>
                      </div>
                    ))}
                  </div>
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
                  <Button
                    variant="outline"
                    size="lg"
                    onClick={() => onNavigate?.('cli')}
                    leftIcon={<Terminal className="w-4 h-4 text-brandGold-500" />}
                    className="cursor-pointer"
                  >
                    CLI Reference
                  </Button>
                </div>
              </ScrollReveal>

              {/* Right Column (7 cols): Interactive Code Box + 4 Feature Cards */}
              <div className="lg:col-span-7 space-y-6">
                
                {/* Interactive Code Box with Switcher and 1-Click Copy */}
                <ScrollReveal reduceMotion={reduceMotion} delay={0.1}>
                  <div className="rounded-2xl border border-slate-200 dark:border-brandObsidian-700 bg-white dark:bg-brandObsidian-900 shadow-xl overflow-hidden">
                    {/* Code Box Header Tabs */}
                    <div className="px-4 py-3 border-b border-slate-200 dark:border-brandObsidian-800 bg-slate-100/70 dark:bg-brandObsidian-800/60 flex flex-wrap items-center justify-between gap-3">
                      <div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-200/70 dark:bg-brandObsidian-900 border border-slate-300 dark:border-brandObsidian-700 text-xs font-mono">
                        {[
                          { id: 'terraform', label: 'Terraform' },
                          { id: 'cli', label: 'arv CLI' },
                          { id: 'python', label: 'Python SDK' },
                          { id: 'curl', label: 'REST API' },
                        ].map((tab) => (
                          <button
                            key={tab.id}
                            onClick={() => setSelectedDevTab(tab.id as any)}
                            className={`px-3 py-1.5 rounded-lg transition-all font-bold cursor-pointer ${
                              selectedDevTab === tab.id
                                ? 'bg-brandGold-500 text-brandObsidian-950 shadow-xs'
                                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                            }`}
                          >
                            {tab.label}
                          </button>
                        ))}
                      </div>

                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(devTabSnippets[selectedDevTab].code);
                          setDevSnippetCopied(true);
                          setTimeout(() => setDevSnippetCopied(false), 2000);
                        }}
                        className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-brandObsidian-700 bg-white dark:bg-brandObsidian-800 text-slate-700 dark:text-slate-300 text-xs font-mono font-bold flex items-center gap-1.5 hover:border-brandGold-500 cursor-pointer shadow-xs transition-colors"
                      >
                        {devSnippetCopied ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-emerald-500" />
                            <span>Copied to Clipboard!</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5 text-brandGold-500" />
                            <span>Copy Snippet</span>
                          </>
                        )}
                      </button>
                    </div>

                    {/* Code View Area */}
                    <div className="p-4 sm:p-5 bg-brandObsidian-950 text-slate-200 font-mono text-xs sm:text-sm overflow-x-auto leading-relaxed border-t border-brandObsidian-800">
                      <pre className="whitespace-pre">
                        <code>{devTabSnippets[selectedDevTab].code}</code>
                      </pre>
                    </div>
                  </div>
                </ScrollReveal>

                {/* 4 Toolchain Feature Tiles (Inspired by Image 2's 4 visual tiles) */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {[
                    {
                      icon: Play,
                      title: 'In-Browser Web Terminal',
                      desc: 'SSH into your running compute nodes with zero keys to download. Web-based terminal with full ANSI color support and session replay.',
                      badge: 'Interactive Shell',
                      route: 'cli' as const,
                    },
                    {
                      icon: HardDrive,
                      title: 'NVMe S3-Compatible Store',
                      desc: 'Drop-in replacement for AWS S3 with sub-10ms TTFB. Full multi-part chunking, folder hierarchies, and presigned uploads.',
                      badge: 'Zero Egress',
                      route: 'storage' as const,
                    },
                    {
                      icon: GitBranch,
                      title: 'GitOps Canary Rollouts',
                      desc: 'Trigger canary traffic slicing (e.g., 25% traffic). Automated instant rollback in under 1.2s if error budgets or latency SLOs breach.',
                      badge: 'Automated SRE',
                      route: 'operations' as const,
                    },
                    {
                      icon: Layers,
                      title: '5-Tier Database-Enforced RBAC',
                      desc: 'Granular permissions verified at the PostgreSQL schema boundary. Cryptographically signed audit trail logs with actor IP capture.',
                      badge: 'RFC 6238 MFA',
                      route: 'iam' as const,
                    },
                  ].map((tile, idx) => {
                    const TileIcon = tile.icon;
                    return (
                      <motion.div
                        key={tile.title}
                        initial={reduceMotion ? {} : { opacity: 0, y: 20 }}
                        whileInView={reduceMotion ? {} : { opacity: 1, y: 0 }}
                        viewport={{ once: true, margin: '-30px' }}
                        transition={{ duration: 0.4, delay: idx * 0.08 }}
                        className="p-5 rounded-2xl bg-white dark:bg-brandObsidian-900 border border-slate-200/90 dark:border-brandObsidian-800 hover:border-brandGold-500/50 hover:shadow-card-hover transition-all duration-200 flex flex-col justify-between space-y-3 group"
                      >
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <div className="w-9 h-9 rounded-xl bg-brandGold-500/10 text-brandGold-500 flex items-center justify-center group-hover:bg-brandGold-500 group-hover:text-brandObsidian-950 transition-colors">
                              <TileIcon className="w-4 h-4" />
                            </div>
                            <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-brandObsidian-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-brandObsidian-700">
                              {tile.badge}
                            </span>
                          </div>
                          <h3 className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-brandGold-500 transition-colors">
                            {tile.title}
                          </h3>
                          <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                            {tile.desc}
                          </p>
                        </div>

                        <button
                          onClick={() => onNavigate?.(tile.route as any)}
                          className="inline-flex items-center gap-1 text-xs font-bold text-brandGold-600 dark:text-brandGold-400 hover:text-brandGold-700 dark:hover:text-brandGold-300 pt-2 border-t border-slate-100 dark:border-brandObsidian-800 cursor-pointer"
                        >
                          <span>Explore Primitive</span>
                          <ExternalLink className="w-3 h-3" />
                        </button>
                      </motion.div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── SOVEREIGN COMPLIANCE & SECURITY (Inspired by Image 2 Reference) ── */}
        <section id="security" className="py-20 sm:py-28 border-t border-slate-200 dark:border-brandObsidian-800 bg-slate-100/50 dark:bg-brandObsidian-900/40">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-center">
              
              {/* Left Column (5 cols): High-Impact CISO Testimonial Card (Image 2 style) */}
              <motion.div
                initial={reduceMotion ? {} : { opacity: 0, x: -24 }}
                whileInView={reduceMotion ? {} : { opacity: 1, x: 0 }}
                viewport={{ once: true, margin: '-50px' }}
                transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                className="lg:col-span-5"
              >
                <div className="rounded-3xl bg-gradient-to-br from-[#121929] via-[#090d16] to-[#04070c] border border-brandGold-500/40 p-6 sm:p-8 text-white shadow-2xl relative overflow-hidden space-y-6">
                  <div className="absolute top-0 right-0 w-44 h-44 bg-brandGold-500/10 rounded-full blur-2xl pointer-events-none" />

                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-mono uppercase font-bold text-brandGold-400 flex items-center gap-1.5">
                      <ShieldCheck className="w-4 h-4 text-brandGold-400" />
                      Executive Endorsement
                    </span>
                    <Badge variant="gold" size="sm" className="font-mono text-[10px]">
                      BFSI Sovereign
                    </Badge>
                  </div>

                  <blockquote className="text-sm sm:text-base text-slate-200 italic leading-relaxed font-normal">
                    &ldquo;As a regulated financial institution handling ₹400 Cr in daily transactional volume, sovereign data residency and deterministic audit trails aren&apos;t optional. Aravanta&apos;s strict in-country residency and immutable cryptographic logging satisfy RBI and DPDP mandates without operational overhead.&rdquo;
                  </blockquote>

                  <div className="pt-4 border-t border-white/10 flex items-center gap-3.5">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-amber-400 to-brandGold-600 flex items-center justify-center text-brandObsidian-950 font-bold text-base shadow-md shrink-0">
                      VS
                    </div>
                    <div>
                      <div className="text-sm font-bold text-white tracking-wide">
                        Vikramaditya Singhal
                      </div>
                      <div className="text-xs text-brandGold-400 font-mono">
                        CISO, RupeeShield Financial
                      </div>
                      <div className="text-[10px] text-slate-400 font-mono">
                        RBI Cyber Security Framework Aligned
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>

              {/* Right Column (7 cols): Compliance Checklist & Architecture */}
              <ScrollReveal reduceMotion={reduceMotion} delay={0.15} className="lg:col-span-7 space-y-6">
                <Badge variant="gold" size="md">
                  Sovereignty & Governance
                </Badge>
                <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-slate-900 dark:text-white leading-[1.08]">
                  Compliance Built for Regulated Enterprises & FinTechs
                </h2>
                <p className="text-base sm:text-lg text-slate-600 dark:text-slate-300 leading-relaxed">
                  Engineered from the hypervisor to the control plane to exceed Indian data localization statutes and enterprise risk governance requirements.
                </p>

                {/* 6 Verified Checklist Points */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-2">
                  {[
                    {
                      title: 'DPDPA 2023 In-Country Data Residency',
                      desc: 'All databases, backups, and telemetry remain strictly inside Indian geographical boundaries.',
                    },
                    {
                      title: 'ISO/IEC 27001:2022 & SOC 2 Type II',
                      desc: 'Hardware nodes hosted exclusively in audited Tier-IV datacenter facilities.',
                    },
                    {
                      title: 'MeitY Sovereign Cloud Architecture',
                      desc: 'Air-gapped management planes aligned with government enterprise procurement norms.',
                    },
                    {
                      title: 'AES-256-GCM & Customer-Managed KMS',
                      desc: 'Zero-knowledge encryption for block storage volumes and S3 object buckets.',
                    },
                    {
                      title: 'RFC 6238 TOTP Multi-Factor Authentication',
                      desc: '30-second time-step cryptographic authenticator token rotation for all console operators.',
                    },
                    {
                      title: 'Cryptographic Immutable Audit Trail',
                      desc: 'Every administrative mutation is signed with actor IP, timestamp, and payload hash.',
                    },
                  ].map((item, idx) => (
                    <motion.div
                      key={item.title}
                      initial={reduceMotion ? {} : { opacity: 0, y: 16 }}
                      whileInView={reduceMotion ? {} : { opacity: 1, y: 0 }}
                      viewport={{ once: true, margin: '-30px' }}
                      transition={{ duration: 0.35, delay: (idx % 2) * 0.08 }}
                      className="p-4 rounded-xl bg-white dark:bg-brandObsidian-900 border border-slate-200 dark:border-brandObsidian-800 shadow-xs space-y-1.5"
                    >
                      <div className="flex items-start gap-2">
                        <span className="w-5 h-5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 mt-0.5">
                          <Check className="w-3.5 h-3.5" />
                        </span>
                        <h3 className="text-xs font-bold text-slate-900 dark:text-white leading-snug">
                          {item.title}
                        </h3>
                      </div>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 pl-7 leading-relaxed">
                        {item.desc}
                      </p>
                    </motion.div>
                  ))}
                </div>

                <div className="pt-2 flex items-center gap-3">
                  <Button
                    size="md"
                    variant="outline"
                    onClick={() => onNavigate?.('documentation')}
                    rightIcon={<ChevronRight className="w-4 h-4" />}
                    className="cursor-pointer font-bold text-xs"
                  >
                    Download Compliance Whitepaper
                  </Button>
                </div>
              </ScrollReveal>
            </div>
          </div>
        </section>

        {/* ── ENGINEERING COMMUNITY PREVIEW ── */}
        <section id="community" className="py-20 sm:py-28 border-t border-slate-200 dark:border-brandObsidian-800">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
            <ScrollReveal reduceMotion={reduceMotion} className="flex flex-col md:flex-row md:items-end justify-between gap-6">
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
            </ScrollReveal>

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
              ].map((post, idx) => (
                <motion.div
                  key={post.title}
                  initial={reduceMotion ? {} : { opacity: 0, y: 20 }}
                  whileInView={reduceMotion ? {} : { opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: '-30px' }}
                  transition={{ duration: 0.4, delay: idx * 0.1 }}
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
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* ── FACTUAL CONSUMPTION PRICING & FINOPS ── */}
        <section id="pricing" className="py-20 sm:py-28 border-t border-slate-200 dark:border-brandObsidian-800 bg-slate-100/50 dark:bg-brandObsidian-900/40">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
            <ScrollReveal reduceMotion={reduceMotion} className="text-center max-w-3xl mx-auto space-y-4">
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
            </ScrollReveal>

            {/* Real Unit Price Rate Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {realPricingRates.map((item, idx) => (
                <motion.div
                  key={item.service}
                  initial={reduceMotion ? {} : { opacity: 0, y: 16 }}
                  whileInView={reduceMotion ? {} : { opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: '-30px' }}
                  transition={{ duration: 0.35, delay: idx * 0.05 }}
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
                </motion.div>
              ))}
            </div>

            <ScrollReveal reduceMotion={reduceMotion} delay={0.1} className="text-center pt-4">
              <Button
                variant="outline"
                size="lg"
                onClick={() => onNavigate?.('pricing')}
                rightIcon={<ArrowRight className="w-4 h-4" />}
                className="cursor-pointer"
              >
                View Full Pricing Tiers & TCO Comparison
              </Button>
            </ScrollReveal>
          </div>
        </section>

        {/* ── ARCHITECTURE & SAFETY FAQ (REDESIGNED 2-COLUMN OPERATIONAL DECK) ── */}
        <section id="faq" className="py-20 sm:py-28 border-t border-slate-200 dark:border-brandObsidian-800 relative">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
            <ScrollReveal reduceMotion={reduceMotion} className="text-center max-w-3xl mx-auto space-y-4">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brandGold-500/10 border border-brandGold-500/30 text-brandGold-400 font-mono text-xs font-bold uppercase tracking-wider">
                <HelpCircle className="w-3.5 h-3.5" />
                <span>Verified Architecture & Operations</span>
              </div>
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-slate-900 dark:text-white leading-[1.1]">
                Frequently Asked Operational Questions
              </h2>
              <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 leading-relaxed max-w-2xl mx-auto">
                Evidence-gated engineering answers regarding multi-cloud RBAC, S3 object durability, automated canary rollbacks, and Indian GST FinOps.
              </p>
            </ScrollReveal>

            {/* Split 2-Column Responsive Deck */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-start">
              {/* Left Column: Domain Filter & SRE Contact Card */}
              <div className="lg:col-span-4 space-y-6 lg:sticky lg:top-24">
                {/* Domain Filter Deck */}
                <div className="p-2 sm:p-2.5 rounded-2xl bg-white/90 dark:bg-[#0c121e]/90 border border-slate-200/90 dark:border-brandGold-500/30 backdrop-blur-xl shadow-lg ring-1 ring-black/5 dark:ring-brandGold-500/10">
                  <div className="text-[11px] font-mono font-bold text-slate-400 dark:text-slate-500 uppercase px-2 py-1 tracking-wider hidden sm:block">
                    Operational Domains
                  </div>
                  {/* Desktop: Vertical stack, Mobile: horizontal flex with no-scrollbar */}
                  <div className="flex sm:flex-col gap-1.5 overflow-x-auto sm:overflow-x-visible no-scrollbar py-1 sm:py-0">
                    {faqCategories.map((cat) => {
                      const Icon = cat.icon;
                      const isSelected = faqCategory === cat.id;
                      return (
                        <button
                          key={cat.id}
                          onClick={() => setFaqCategory(cat.id as any)}
                          className={`flex items-center justify-between gap-3 px-3.5 py-2.5 rounded-xl text-xs font-medium transition-all shrink-0 sm:shrink cursor-pointer text-left ${
                            isSelected
                              ? 'bg-brandGold-500 text-brandObsidian-950 font-bold shadow-md shadow-brandGold-500/20'
                              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-brandObsidian-800/60'
                          }`}
                        >
                          <div className="flex items-center gap-2.5 truncate">
                            <Icon className={`w-4 h-4 shrink-0 ${isSelected ? 'text-brandObsidian-950' : 'text-brandGold-500'}`} />
                            <span className="truncate">{cat.label}</span>
                          </div>
                          <span
                            className={`text-[10px] font-mono px-1.5 py-0.5 rounded-md shrink-0 ${
                              isSelected
                                ? 'bg-brandObsidian-950/20 text-brandObsidian-950 font-bold'
                                : 'bg-slate-200/80 dark:bg-brandObsidian-800 text-slate-500 dark:text-slate-400'
                            }`}
                          >
                            {cat.count}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* SRE Escalation Blade Card */}
                <div className="relative rounded-2xl overflow-hidden p-5 bg-gradient-to-br from-[#121929] via-[#090d16] to-[#04070c] border border-brandGold-500/40 text-white shadow-xl">
                  <div className="absolute top-0 inset-x-0 h-0.5 bg-gradient-to-r from-transparent via-brandGold-400 to-transparent" />
                  <div className="flex items-center justify-between text-xs font-mono pb-3 border-b border-slate-800/80">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                      <span className="text-emerald-400 font-bold">SRE Command Active</span>
                    </div>
                    <span className="text-slate-500 text-[10px]">P95 &lt; 15m</span>
                  </div>
                  <div className="space-y-2 py-3">
                    <h3 className="text-sm font-bold text-white flex items-center gap-2">
                      <MessageSquare className="w-4 h-4 text-brandGold-400" />
                      <span>Custom Architecture Needs?</span>
                    </h3>
                    <p className="text-xs text-slate-300 leading-relaxed">
                      Enterprise air-gapped clusters, dedicated banking cores, or RBI/DPDPA regulatory boundary validation.
                    </p>
                  </div>
                  <div className="flex items-center gap-2 pt-2 border-t border-slate-800/80">
                    <Button
                      size="sm"
                      variant="primary"
                      onClick={() => onNavigate?.('documentation')}
                      className="w-full text-xs py-2 rounded-lg bg-brandGold-500 hover:bg-brandGold-600 text-brandObsidian-950 font-bold cursor-pointer"
                    >
                      Platform Docs
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => onNavigate?.('cli')}
                      className="w-full text-xs py-2 rounded-lg border border-slate-700 bg-slate-900/80 hover:border-brandGold-500 text-slate-200 hover:text-white font-mono cursor-pointer"
                    >
                      Web Terminal
                    </Button>
                  </div>
                </div>
              </div>

              {/* Right Column: Search & Custom Filtered Accordion Deck */}
              <div className="lg:col-span-8 space-y-4">
                {/* Instant Filter & Search Bar */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-2 sm:p-2.5 rounded-2xl bg-white/90 dark:bg-[#0c121e]/90 border border-slate-200/90 dark:border-brandGold-500/30 backdrop-blur-xl shadow-lg ring-1 ring-black/5 dark:ring-brandGold-500/10">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                    <input
                      type="text"
                      value={faqSearch}
                      onChange={(e) => setFaqSearch(e.target.value)}
                      placeholder="Search operational answers (e.g., RBAC, canary, S3, GST, MFA)..."
                      className="w-full pl-9 pr-8 py-2 rounded-xl bg-slate-100/80 dark:bg-slate-900/80 border border-slate-200/80 dark:border-slate-800 text-xs sm:text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brandGold-500/40"
                    />
                    {faqSearch && (
                      <button
                        onClick={() => setFaqSearch('')}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 text-slate-400 hover:text-slate-600 dark:hover:text-white rounded-full cursor-pointer"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                  <div className="text-[11px] font-mono text-slate-500 dark:text-slate-400 shrink-0 px-1 flex items-center justify-between sm:justify-end gap-2">
                    <span>
                      Showing <strong className="text-brandGold-500">{filteredFaqs.length}</strong> of {faqs.length} FAQs
                    </span>
                    {(faqCategory !== 'all' || faqSearch) && (
                      <button
                        onClick={() => {
                          setFaqCategory('all');
                          setFaqSearch('');
                        }}
                        className="text-[10px] text-brandGold-500 hover:underline cursor-pointer ml-1"
                      >
                        Reset
                      </button>
                    )}
                  </div>
                </div>

                {/* FAQ Items Deck */}
                {filteredFaqs.length === 0 ? (
                  <div className="p-8 sm:p-12 rounded-2xl border border-dashed border-slate-300 dark:border-slate-800 text-center space-y-3 bg-white/40 dark:bg-slate-900/40 backdrop-blur-md">
                    <HelpCircle className="w-8 h-8 text-slate-400 mx-auto" />
                    <div className="text-sm font-bold text-slate-700 dark:text-slate-300">
                      No operational specifications matched "{faqSearch}"
                    </div>
                    <p className="text-xs text-slate-500 max-w-sm mx-auto">
                      Try searching with broader terms like <code className="text-brandGold-400">RBAC</code>, <code className="text-brandGold-400">storage</code>, <code className="text-brandGold-400">canary</code>, or <code className="text-brandGold-400">billing</code>.
                    </p>
                    <button
                      onClick={() => {
                        setFaqSearch('');
                        setFaqCategory('all');
                      }}
                      className="text-xs font-bold text-brandGold-500 hover:underline pt-2 cursor-pointer inline-block"
                    >
                      Clear search & view all FAQs
                    </button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {filteredFaqs.map((faq) => {
                      const isOpen = openFaqId === faq.id;
                      return (
                        <div
                          key={faq.id}
                          className={`rounded-2xl border transition-all duration-200 overflow-hidden ${
                            isOpen
                              ? 'bg-white/95 dark:bg-[#0c121e]/95 border-brandGold-500/60 shadow-xl shadow-brandGold-500/5 ring-1 ring-brandGold-500/30'
                              : 'bg-white/80 dark:bg-[#0a0f1a]/80 border-slate-200/90 dark:border-slate-800/80 hover:border-brandGold-500/40 hover:bg-white dark:hover:bg-[#0c121e]/80 shadow-xs'
                          }`}
                        >
                          <button
                            type="button"
                            onClick={() => setOpenFaqId(isOpen ? null : faq.id)}
                            className="w-full p-4 sm:p-5 text-left flex items-start justify-between gap-4 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brandGold-500/40"
                          >
                            <div className="space-y-2 flex-1">
                              <div className="flex flex-wrap items-center gap-2">
                                <span className="text-[10px] font-mono uppercase tracking-wider font-bold text-brandGold-500 dark:text-brandGold-400 bg-brandGold-500/10 dark:bg-brandGold-500/15 px-2 py-0.5 rounded-md border border-brandGold-500/30">
                                  {faq.categoryLabel}
                                </span>
                                <span className="text-[10px] font-mono text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-900 px-2 py-0.5 rounded-md border border-slate-200 dark:border-slate-800">
                                  {faq.badge}
                                </span>
                              </div>
                              <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-slate-100 leading-snug">
                                {faq.q}
                              </h3>
                            </div>
                            <div
                              className={`p-1.5 rounded-xl border shrink-0 transition-transform duration-200 mt-1 ${
                                isOpen
                                  ? 'bg-brandGold-500 text-brandObsidian-950 border-brandGold-500 rotate-180'
                                  : 'bg-slate-100 dark:bg-slate-900 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-800'
                              }`}
                            >
                              <ChevronDown className="w-4 h-4" />
                            </div>
                          </button>

                          <AnimatePresence initial={false}>
                            {isOpen && (
                              <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
                                className="overflow-hidden"
                              >
                                <div className="px-4 sm:px-5 pb-5 pt-1 border-t border-slate-100 dark:border-slate-800/80 space-y-3.5 text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                                  <p>{faq.a}</p>

                                  {/* Architecture Spec Highlights */}
                                  <div className="pt-2 flex flex-wrap items-center gap-1.5 border-t border-slate-100 dark:border-slate-800/60 text-[10px] font-mono">
                                    <span className="text-slate-400 dark:text-slate-500 mr-1 uppercase">Engineered With:</span>
                                    {faq.highlights.map((h, hi) => (
                                      <span
                                        key={hi}
                                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-800 text-slate-700 dark:text-slate-300"
                                      >
                                        <CheckCircle2 className="w-2.5 h-2.5 text-brandGold-500" />
                                        <span>{h}</span>
                                      </span>
                                    ))}
                                  </div>
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* ── FINAL CALL TO ACTION ── */}
        <section className="py-20 sm:py-28 border-t border-slate-200 dark:border-brandObsidian-800 bg-slate-100/50 dark:bg-brandObsidian-900/40">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div
              initial={reduceMotion ? {} : { opacity: 0, scale: 0.97, y: 24 }}
              whileInView={reduceMotion ? {} : { opacity: 1, scale: 1, y: 0 }}
              viewport={{ once: true, margin: '-60px' }}
              transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
              className="relative overflow-hidden rounded-3xl bg-brandObsidian-950 text-white shadow-2xl p-8 sm:p-12 lg:p-16 text-center space-y-6"
            >
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
            </motion.div>
          </div>
        </section>
      </main>

      {/* ── PERSISTENT PROFESSIONAL FOOTER ── */}
      <Footer onNavigate={onNavigate} onGoToLogin={onGoToLogin} />
    </div>
  );
};
