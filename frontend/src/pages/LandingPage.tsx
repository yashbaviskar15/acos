import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence, Variants } from 'framer-motion';
import {
  ArrowRight,
  ShieldCheck,
  Server,
  Container,
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
  RefreshCcw,
  Bell,
  HeartPulse,
  Network,
  Cloud,
  FileCode,
  Boxes,
  ScanSearch,
  CloudCog,
  BookOpen,
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
}

const prefersReducedMotion = () =>
  typeof window !== 'undefined' &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

const codeSnippets: Record<string, string> = {
  cli: `# Provision a compute instance in Mumbai region
agy compute create \\
  --instance-type c3.large \\
  --region ap-south-1 \\
  --image ubuntu-24.04 \\
  --ssh-key my-key \\
  --disk-size 120

✓ Instance arv-compute-7f3da provisioned
  Public IP: 43.205.xx.xx
  Ready in 48s`,
  terraform: `resource "arvanta_compute_instance" "web" {
  name          = "web-prod-01"
  instance_type = "c3.large"
  region        = "ap-south-1"
  image         = "ubuntu-24.04"

  disk {
    size = 120
    type = "nvme-ssd"
  }

  tags = {
    environment = "production"
    tier        = "web"
  }
}

output "public_ip" {
  value = arvanta_compute_instance.web.public_ip
}`,
  rest: `curl -X POST "$API_URL/api/v1/compute/instances" \\
  -H "Authorization: Bearer $ARVANTA_TOKEN" \\
  -H "Content-Type: application/json" \\
  -d '{
    "instance_type": "c3.large",
    "region": "ap-south-1",
    "image": "ubuntu-24.04",
    "disk_size_gb": 120,
    "ssh_key_name": "my-key",
    "tags": {"env": "prod"}
  }'

# HTTP 201 Created
# {"id":"cmp_7f3da1b2","status":"running",...}`,
  sdk: `import { AravantaClient } from '@aravanta/sdk';

const client = new AravantaClient({
  apiKey: process.env.ARVANTA_KEY,
  region: 'ap-south-1',
});

async function launchWeb() {
  const instance = await client.compute.instances.create({
    instanceType: 'c3.large',
    image: 'ubuntu-24.04',
    diskSizeGb: 120,
    tags: { tier: 'web', env: 'production' },
  });

  console.log(\`Launched \${instance.id} @ \${instance.publicIp}\`);
  return instance;
}

launchWeb();`,
};

const workflowSteps = [
  {
    key: 'provision',
    step: '01',
    name: 'Provision',
    icon: Server,
    title: 'Declarative infrastructure provisioning',
    desc: 'Spin up VMs, Kubernetes clusters, databases, and storage buckets across 4 regions using Terraform, the CLI, REST API, or the visual console. All resources tagged for FinOps tracking.',
    metrics: [
      { label: 'Provision time', value: '< 60s' },
      { label: 'Regions', value: '4' },
    ],
  },
  {
    key: 'deploy',
    step: '02',
    name: 'Deploy',
    icon: GitBranch,
    title: 'GitOps delivery with safety gates',
    desc: 'Push to main and ArvCD handles the rest. Rolling updates, 25% canary traffic splits with error-rate gates, or instant blue/green cutovers. Automated rollback triggers on SLO breach.',
    metrics: [
      { label: 'Deploy strategies', value: '3' },
      { label: 'Auto-rollback', value: '< 1.2s' },
    ],
  },
  {
    key: 'monitor',
    step: '03',
    name: 'Monitor',
    icon: Activity,
    title: 'Sub-second telemetry streaming',
    desc: 'Multi-resolution Prometheus metrics, structured Loki logs, distributed traces, and SLO burn-rate dashboards. Correlate deploy events to latency spikes in one click.',
    metrics: [
      { label: 'Metrics retention', value: '30d' },
      { label: 'Scrape interval', value: '10s' },
    ],
  },
  {
    key: 'alert',
    step: '04',
    name: 'Alert',
    icon: Bell,
    title: 'Intelligent alert triage',
    desc: 'Alertmanager grouping with deduplication. Route critical pages to PagerDuty/Slack, silence noise during deploys, and auto-acknowledge signals that self-heal.',
    metrics: [
      { label: 'Noise reduction', value: '68%' },
      { label: 'MTTA', value: '< 30s' },
    ],
  },
  {
    key: 'recover',
    step: '05',
    name: 'Recover',
    icon: RefreshCcw,
    title: 'Automated incident recovery',
    desc: 'Runbooks trigger on alerts: pod restarts, DNS failover, database point-in-time restore, and snapshot rollbacks. War-room timestamps and RCA notes for postmortems.',
    metrics: [
      { label: 'Runbooks', value: '120+' },
      { label: 'MTTR reduced', value: '72%' },
    ],
  },
];

const faqs = [
  {
    q: 'How does Aravanta CloudOS guarantee zero-downtime deployments?',
    a: 'Aravanta CloudOS coordinates automated Kubernetes liveness/readiness probes and ingress routing across rolling pods, canary gates (e.g. 25% traffic slice verification), and instant blue/green cutovers. If synthetic latency or HTTP 5xx error spikes are detected, automated 1-click rollback restores the previous stable release within 1.2 seconds.',
  },
  {
    q: 'Can I connect existing AWS, GCP, and Kubernetes infrastructure?',
    a: 'Yes. Aravanta CloudOS acts as a unified control plane. You can orchestrate multi-cloud compute VMs, managed EKS/GKE clusters, database instances (PostgreSQL, MySQL, Redis), and S3-compatible object storage under a single tenant workspace with unified RBAC and audit trails.',
  },
  {
    q: 'How is Two-Factor Authentication (2FA) and RBAC enforced?',
    a: 'Every operational action is verified against a 4-tier Role-Based Access Control matrix (SuperAdmin, Admin, Operator, Developer, Viewer). Time-based One-Time Password (TOTP) MFA with standard 30s RFC 6238 tokens protects logins, and every administrative action is signed into an immutable audit trail retained for 365 days on Enterprise plans.',
  },
  {
    q: 'Is there a free trial available for engineering teams?',
    a: 'Yes. Every new workspace starts with a 10-day full-access Developer Cloud trial with pre-allocated compute, Kubernetes pod testing quotas, and full access to the Alertmanager triage center without requiring a credit card.',
  },
  {
    q: 'What are the billing increments and can I self-host?',
    a: 'Billing is per-second on compute, Kubernetes, and database resources with hourly minimums. Storage and egress are billed per-GB monthly. For self-hosted deployments, the Enterprise tier ships a bring-your-own-Kubernetes distribution that runs on bare-metal, VMware, or existing EKS/GKE clusters with a signed EULA and 99.99% uptime SLA.',
  },
  {
    q: 'Which regions are available today?',
    a: 'Control plane regions as of v1.0 GA: ap-south-1 (Mumbai), ap-southeast-1 (Singapore), us-east-1 (Virginia), eu-central-1 (Frankfurt). Data residency boundaries are strictly enforced and configurable per project. Additional regions (Tokyo, São Paulo) are on the public roadmap for Q1.',
  },
];

const integrations = [
  { name: 'Kubernetes', subtitle: 'Native integration', icon: Container, color: 'text-blue-500' },
  { name: 'Docker', subtitle: 'Native integration', icon: Boxes, color: 'text-sky-500' },
  { name: 'Terraform', subtitle: 'Official provider', icon: LayersIcon, color: 'text-violet-500' },
  { name: 'Prometheus', subtitle: 'Native integration', icon: BarChart3, color: 'text-orange-500' },
  { name: 'Grafana', subtitle: 'Compatible API', icon: Activity, color: 'text-amber-500' },
  { name: 'Loki', subtitle: 'Native integration', icon: ScanSearch, color: 'text-rose-500' },
  { name: 'OpenTelemetry', subtitle: 'Native integration', icon: Network, color: 'text-indigo-500' },
  { name: 'PostgreSQL', subtitle: 'Managed engine', icon: Database, color: 'text-sky-600' },
  { name: 'Redis', subtitle: 'Managed engine', icon: Database, color: 'text-red-500' },
  { name: 'AWS', subtitle: 'Compatible APIs', icon: Cloud, color: 'text-amber-600' },
  { name: 'S3', subtitle: 'Compatible API', icon: HardDrive, color: 'text-red-600' },
  { name: "Let's Encrypt", subtitle: 'Native integration', icon: Lock, color: 'text-emerald-600' },
  { name: 'Swagger/OpenAPI', subtitle: 'Reference docs', icon: FileCode, color: 'text-lime-600' },
  { name: 'Vercel', subtitle: 'Deployment target', icon: CloudCog, color: 'text-slate-900 dark:text-white' },
  { name: 'GitHub Actions', subtitle: 'CI/CD runner', icon: GitBranch, color: 'text-slate-800 dark:text-slate-200' },
];

function LayersIcon(props: any) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="m12.83 2.18a2 2 0 0 0-1.66 0L2.6 6.08a1 1 0 0 0 0 1.83l8.58 3.91a2 2 0 0 0 1.66 0l8.58-3.9a1 1 0 0 0 0-1.83Z" />
      <path d="m22 17.65-9.17 4.16a2 2 0 0 1-1.66 0L2 17.65" />
      <path d="m22 12.65-9.17 4.16a2 2 0 0 1-1.66 0L2 12.65" />
    </svg>
  );
}

export const LandingPage: React.FC<LandingPageProps> = ({
  onGoToLogin,
  onGoToRegister,
  onOpenCommandPalette,
  onNavigate,
}) => {
  const [activeWorkflowStep, setActiveWorkflowStep] = useState(1);
  const [billingPeriod, setBillingPeriod] = useState<'monthly' | 'annual'>('monthly');
  const reduceMotion = useMemo(prefersReducedMotion, []);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

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
        show: { opacity: 1, y: 0, transition: { duration: 0.55, ease: [0.16, 1, 0.3, 1] } },
      };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-brandObsidian-950 text-slate-900 dark:text-slate-100 font-sans antialiased selection:bg-brandGold-500/30 selection:text-brandGold-900 dark:selection:text-brandGold-100">
      <Navbar
        onGoToLogin={onGoToLogin}
        onGoToRegister={onGoToRegister}
        onOpenCommandPalette={onOpenCommandPalette}
        onNavigate={onNavigate}
        currentView="home"
      />

      <main>
        {/* ── HERO ── */}
        <section className="relative overflow-hidden pt-12 sm:pt-16 lg:pt-20 pb-20 sm:pb-28 lg:pb-32">
          <div
            aria-hidden
            className="absolute inset-x-0 top-0 -z-10 h-[620px] bg-hero-radial opacity-90"
          />
          <div
            aria-hidden
            className="absolute inset-0 -z-10 opacity-[0.04] dark:opacity-[0.07]"
            style={{
              backgroundImage:
                'linear-gradient(to right, currentColor 1px, transparent 1px), linear-gradient(to bottom, currentColor 1px, transparent 1px)',
              backgroundSize: '56px 56px',
              WebkitMaskImage:
                'radial-gradient(ellipse 80% 55% at 50% 0%, black 40%, transparent 75%)',
              maskImage:
                'radial-gradient(ellipse 80% 55% at 50% 0%, black 40%, transparent 75%)',
              color: '#0B0F17',
            }}
          />

          {/* ── Ambient Animated Hero Logo Watermark ── */}
          <div
            aria-hidden
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 -z-10 pointer-events-none flex items-center justify-center select-none overflow-hidden"
          >
            <motion.div
              animate={{
                scale: [1, 1.04, 1],
                opacity: [0.10, 0.18, 0.10],
              }}
              transition={{
                duration: 10,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
              className="relative w-[360px] h-[360px] sm:w-[540px] sm:h-[540px] md:w-[700px] md:h-[700px] lg:w-[820px] lg:h-[820px] flex items-center justify-center"
            >
              {/* Subtle radial ambient illumination */}
              <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-brandGold-500/25 via-amber-500/10 to-transparent blur-3xl pointer-events-none" />
              {/* Concentric subtle radar pulse rings */}
              <div className="absolute inset-12 sm:inset-16 rounded-full border border-brandGold-500/15 dark:border-brandGold-500/25 pointer-events-none animate-pulse" />
              <div className="absolute inset-28 sm:inset-36 rounded-full border border-brandGold-500/10 dark:border-brandGold-500/15 pointer-events-none" />
              {/* Official Aravanta Logo Mark */}
              <img
                src="/assets/aravanta-glyph-glow.png"
                alt="Aravanta Cloud OS Emblem"
                className="w-full h-full object-contain filter drop-shadow-[0_0_50px_rgba(185,139,59,0.3)] select-none pointer-events-none"
              />
            </motion.div>
          </div>

          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div
              variants={containerVariants}
              initial="hidden"
              animate={mounted ? 'show' : 'hidden'}
              className="relative z-10 max-w-3xl mx-auto text-center space-y-6"
            >
              <motion.div variants={fadeUp} className="flex justify-center">
                <div className="inline-flex flex-wrap items-center justify-center gap-x-2 gap-y-1.5 px-3.5 py-1.5 sm:px-4 sm:py-1.5 rounded-full border border-brandGold-500/30 bg-brandGold-500/10 text-brandGold-600 dark:text-brandGold-400 text-xs sm:text-xs font-semibold tracking-wide uppercase shadow-sm max-w-full">
                  <span className="inline-flex items-center gap-1.5 whitespace-nowrap">
                    <span className="w-2 h-2 rounded-full bg-brandGold-500 animate-pulse" />
                    <span>Unified Cloud Control Plane</span>
                  </span>
                  <span className="opacity-40 hidden sm:inline">•</span>
                  <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-brandGold-500/20 text-brandGold-700 dark:text-brandGold-300 font-bold whitespace-nowrap text-[11px] sm:text-xs">
                    v1.0 GA
                  </span>
                  <span className="opacity-40 hidden sm:inline">•</span>
                  <span className="inline-flex items-center gap-1.5 opacity-95 whitespace-nowrap">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping inline-block" />
                    <span>ap-south-1 Mumbai</span>
                  </span>
                </div>
              </motion.div>

              <motion.h1
                variants={fadeUp}
                className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-black tracking-tighter leading-[1.02] text-slate-900 dark:text-white"
              >
                Aravanta{' '}
                <span className="bg-gradient-to-br from-brandGold-400 via-brandGold-500 to-brandGold-600 bg-clip-text text-transparent">
                  Cloud OS
                </span>
                <span className="block text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-extrabold text-slate-700 dark:text-slate-300 mt-2">
                  The Unified Multi-Cloud Operating System
                </span>
              </motion.h1>

              <motion.p
                variants={fadeUp}
                className="text-base sm:text-lg text-slate-600 dark:text-slate-300 leading-relaxed max-w-2xl mx-auto"
              >
                Orchestrate Kubernetes clusters, deploy virtual compute, manage distributed object stores,
                and automate cloud SRE from a single sovereign control plane — with sub-second telemetry and zero vendor lock-in.
              </motion.p>

              <motion.div
                variants={fadeUp}
                className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 pt-3"
              >
                <Button
                  size="xl"
                  variant="primary"
                  onClick={onGoToRegister}
                  className="bg-brandGold-500 hover:bg-brandGold-600 text-brandObsidian-950 font-bold shadow-lg shadow-brandGold-500/25 min-h-[48px]"
                  rightIcon={<ArrowRight className="w-5 h-5" />}
                >
                  Get Started Free
                </Button>
                <Button
                  size="xl"
                  variant="outline"
                  onClick={() => onNavigate?.('documentation')}
                  className="min-h-[48px] hover:border-brandGold-500/50 hover:text-brandGold-600 dark:hover:text-brandGold-400"
                  leftIcon={<BookOpen className="w-4 h-4 text-brandGold-500" />}
                >
                  Explore Platform
                </Button>
              </motion.div>

              <motion.div
                variants={fadeUp}
                className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-6 max-w-3xl mx-auto"
              >
                {[
                  { value: '99.99%', label: 'Uptime SLA', icon: HeartPulse },
                  { value: '< 10ms', label: 'Telemetry Latency', icon: Activity },
                  { value: '100+', label: 'Cloud Integrations', icon: Cloud },
                  { value: 'SOC 2 Type II', label: 'Enterprise Ready', icon: ShieldCheck },
                ].map((stat) => {
                  const StatIcon = stat.icon;
                  return (
                    <div
                      key={stat.label}
                      className="p-3.5 rounded-2xl border border-slate-200 dark:border-brandObsidian-700/80 bg-white/70 dark:bg-brandObsidian-900/60 backdrop-blur-sm text-center shadow-sm"
                    >
                      <div className="flex items-center justify-center gap-1.5 text-brandGold-500 dark:text-brandGold-400 mb-1">
                        <StatIcon className="w-4 h-4" />
                        <span className="text-xl font-black text-slate-900 dark:text-white tabular-nums">
                          {stat.value}
                        </span>
                      </div>
                      <div className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider font-mono">
                        {stat.label}
                      </div>
                    </div>
                  );
                })}
              </motion.div>
            </motion.div>

            {/* ── Product Visualization ── */}
            <motion.div
              initial={reduceMotion ? { opacity: 1 } : { opacity: 0, y: 18 }}
              animate={mounted ? { opacity: 1, y: 0 } : {}}
              transition={reduceMotion ? {} : { duration: 0.7, delay: 0.25, ease: [0.16, 1, 0.3, 1] }}
              className="relative mt-14 sm:mt-18 lg:mt-20"
            >
              <div className="absolute -inset-6 rounded-[2rem] bg-gradient-to-b from-brandGold-500/15 via-brandGold-500/5 to-transparent blur-2xl -z-10" />
              <div className="rounded-2xl border border-slate-200/70 dark:border-brandObsidian-700/80 bg-white dark:bg-brandObsidian-900 shadow-2xl shadow-slate-900/10 dark:shadow-black/40 overflow-hidden">
                <div className="flex items-center justify-between px-4 sm:px-5 h-11 border-b border-slate-200 dark:border-brandObsidian-800 bg-slate-50/60 dark:bg-brandObsidian-800/40">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-rose-400/80" />
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-400/80" />
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-400/80" />
                    <span className="hidden sm:inline ml-3 text-xs font-mono text-slate-500 dark:text-slate-400">
                      console.aravanta.cloud / fleet-mumbai-az1 / production
                    </span>
                  </div>
                  <Badge variant="success" size="sm" dot>
                    Live
                  </Badge>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-0">
                  <aside className="hidden lg:flex lg:col-span-2 flex-col gap-1 px-3 py-4 border-r border-slate-200 dark:border-brandObsidian-800 bg-slate-50/40 dark:bg-brandObsidian-900/50 text-xs font-semibold">
                    {[
                      { name: 'Dashboard', icon: BarChart3, active: true },
                      { name: 'Compute', icon: Server },
                      { name: 'Kubernetes', icon: Container },
                      { name: 'Storage', icon: HardDrive },
                      { name: 'Database', icon: Database },
                      { name: 'CI/CD', icon: GitBranch },
                      { name: 'Monitoring', icon: Activity },
                      { name: 'Incidents', icon: AlertTriangle },
                      { name: 'Security', icon: Shield },
                      { name: 'Billing', icon: Lock },
                    ].map((item) => {
                      const Icon = item.icon;
                      return (
                        <div
                          key={item.name}
                          className={[
                            'flex items-center gap-2 px-2.5 py-2 rounded-lg',
                            item.active
                              ? 'bg-brandGold-500/10 text-brandGold-600 dark:text-brandGold-400'
                              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-brandObsidian-800/60',
                          ].join(' ')}
                        >
                          <Icon className="w-4 h-4" />
                          <span>{item.name}</span>
                        </div>
                      );
                    })}
                  </aside>

                  <section className="col-span-1 lg:col-span-10 p-4 sm:p-5 space-y-4 sm:space-y-5">
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                      {[
                        { label: 'Active Pods', value: '84 / 90', sub: '12 Deployments', tone: 'emerald' },
                        { label: 'P95 Latency', value: '38.5 ms', sub: 'SLO < 200 ms', tone: 'emerald' },
                        { label: 'SLO Burn Rate', value: '0.3×', sub: 'Error budget 92%', tone: 'gold' },
                        { label: 'Open Alerts', value: '2', sub: '1 ack, 1 firing', tone: 'amber' },
                      ].map((k) => (
                        <div
                          key={k.label}
                          className="rounded-xl border border-slate-200 dark:border-brandObsidian-700/80 bg-white dark:bg-brandObsidian-800/40 p-3.5"
                        >
                          <div className="text-[10px] uppercase tracking-wider font-bold text-slate-500 dark:text-slate-400">
                            {k.label}
                          </div>
                          <div className="mt-1 text-lg sm:text-xl font-black text-slate-900 dark:text-white tabular-nums">
                            {k.value}
                          </div>
                          <div className="mt-0.5 text-[11px] text-slate-500 dark:text-slate-400">
                            {k.sub}
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="grid grid-cols-1 xl:grid-cols-5 gap-4">
                      <div className="xl:col-span-3 rounded-xl border border-slate-200 dark:border-brandObsidian-700/80 bg-white dark:bg-brandObsidian-800/40 p-4">
                        <div className="flex items-center justify-between mb-4">
                          <div>
                            <div className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                              Region status
                            </div>
                            <div className="text-sm font-semibold text-slate-800 dark:text-slate-100 mt-0.5">
                              Control plane latency across regions
                            </div>
                          </div>
                          <div className="flex items-center gap-1.5 text-[11px] font-mono">
                            <span className="inline-flex items-center gap-1 text-slate-500 dark:text-slate-400">
                              <span className="w-2 h-2 rounded-full bg-emerald-500" /> Healthy
                            </span>
                            <span className="inline-flex items-center gap-1 text-slate-500 dark:text-slate-400 ml-2">
                              <span className="w-2 h-2 rounded-full bg-amber-500" /> Degraded
                            </span>
                          </div>
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                          {[
                            { code: 'BOM', city: 'Mumbai', p95: 32, status: 'ok' },
                            { code: 'SIN', city: 'Singapore', p95: 48, status: 'ok' },
                            { code: 'IAD', city: 'Virginia', p95: 74, status: 'warn' },
                            { code: 'FRA', city: 'Frankfurt', p95: 61, status: 'ok' },
                          ].map((r) => (
                            <div
                              key={r.code}
                              className="rounded-lg border border-slate-200 dark:border-brandObsidian-700 bg-slate-50/70 dark:bg-brandObsidian-900/40 p-3"
                            >
                              <div className="flex items-center justify-between">
                                <span className="flex items-center gap-1.5">
                                  <span
                                    className={[
                                      'relative inline-flex w-2 h-2 rounded-full',
                                      r.status === 'ok' ? 'bg-emerald-500' : 'bg-amber-500',
                                    ].join(' ')}
                                  >
                                    {!reduceMotion && (
                                      <span className="absolute inset-0 rounded-full animate-ping opacity-60" />
                                    )}
                                  </span>
                                  <Globe2 className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
                                  <span className="font-mono text-[11px] font-bold text-slate-700 dark:text-slate-200">
                                    {r.code}
                                  </span>
                                </span>
                                <span className="font-mono text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
                                  {r.p95}ms
                                </span>
                              </div>
                              <div className="mt-1.5 text-[11px] text-slate-500 dark:text-slate-400">
                                {r.city}
                              </div>
                              <div className="mt-2 h-1.5 rounded-full bg-slate-200 dark:bg-brandObsidian-700 overflow-hidden">
                                <div
                                  className={[
                                    'h-full rounded-full',
                                    r.status === 'ok' ? 'bg-emerald-500' : 'bg-amber-500',
                                  ].join(' ')}
                                  style={{ width: `${Math.min(100, r.p95 * 1.2)}%` }}
                                />
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="xl:col-span-2 rounded-xl border border-slate-200 dark:border-brandObsidian-700/80 bg-white dark:bg-brandObsidian-800/40 p-4 space-y-3">
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                              Latest deployments
                            </div>
                            <div className="text-sm font-semibold text-slate-800 dark:text-slate-100 mt-0.5">
                              GitOps release pipeline
                            </div>
                          </div>
                          <GitBranch className="w-4 h-4 text-brandGold-500" />
                        </div>
                        <div className="space-y-2">
                          {[
                            { svc: 'api-gateway', tag: 'v2.4.2', prog: 25, status: 'canary' },
                            { svc: 'auth-service', tag: 'v1.9.1', prog: 100, status: 'done' },
                            { svc: 'billing-worker', tag: 'v3.1.0', prog: 100, status: 'done' },
                          ].map((d) => (
                            <div
                              key={d.svc}
                              className="rounded-lg bg-slate-50 dark:bg-brandObsidian-900/50 border border-slate-200/70 dark:border-brandObsidian-700/60 p-2.5"
                            >
                              <div className="flex items-center justify-between text-[11px] font-mono">
                                <span className="font-bold text-slate-800 dark:text-slate-100">
                                  {d.svc}
                                </span>
                                <span className="text-brandGold-600 dark:text-brandGold-400 font-bold">
                                  {d.tag}
                                </span>
                              </div>
                              <div className="mt-1.5 h-1.5 rounded-full bg-slate-200 dark:bg-brandObsidian-700 overflow-hidden">
                                <motion.div
                                  initial={reduceMotion ? false : { width: 0 }}
                                  animate={{ width: `${d.prog}%` }}
                                  transition={
                                    reduceMotion
                                      ? {}
                                      : { duration: 1.1, ease: [0.16, 1, 0.3, 1], delay: 0.5 }
                                  }
                                  className={[
                                    'h-full rounded-full',
                                    d.status === 'canary'
                                      ? 'bg-gradient-to-r from-brandGold-400 to-brandGold-600'
                                      : 'bg-emerald-500',
                                  ].join(' ')}
                                />
                              </div>
                              <div className="mt-1 flex items-center justify-between text-[10px] font-mono text-slate-500 dark:text-slate-400">
                                <span>
                                  {d.status === 'canary' ? 'Canary rollout' : 'Rolling update'} • {d.prog}%
                                </span>
                                <Check className={['w-3 h-3', d.status === 'canary' ? 'text-amber-500' : 'text-emerald-500'].join(' ')} />
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </section>
                </div>
              </div>
            </motion.div>
          </div>
        </section>

        {/* ── 1. ALTERNATING FEATURES SECTION (Responsive image-left / image-right layout) ── */}
        <section id="features" className="py-20 sm:py-28 border-t border-slate-200 dark:border-brandObsidian-800">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-24 sm:space-y-32">
            <div className="text-center max-w-3xl mx-auto space-y-4">
              <Badge variant="gold" size="md">
                Core Capabilities
              </Badge>
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-slate-900 dark:text-white leading-[1.1]">
                Engineered for High-Velocity Cloud Operations
              </h2>
              <p className="text-base sm:text-lg text-slate-600 dark:text-slate-300 leading-relaxed">
                Break free from fragmented cloud consoles. Aravanta Cloud OS unifies multi-cloud infrastructure, automated SRE, and delivery pipelines into one seamless platform.
              </p>
            </div>

            {/* Feature 1: Visual Left, Content Right */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-16 items-center">
              <div className="lg:col-span-6">
                <div className="relative rounded-3xl p-6 sm:p-8 bg-gradient-to-br from-brandObsidian-900 to-brandObsidian-950 border border-brandGold-500/30 shadow-2xl overflow-hidden group">
                  <div className="absolute top-0 right-0 w-64 h-64 bg-brandGold-500/10 rounded-full blur-3xl -z-10" />
                  <div className="flex items-center justify-between pb-4 border-b border-brandObsidian-800">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-rose-500/80" />
                      <div className="w-3 h-3 rounded-full bg-amber-500/80" />
                      <div className="w-3 h-3 rounded-full bg-emerald-500/80" />
                      <span className="ml-2 font-mono text-xs text-slate-400">arv-cluster-canvas // ap-south-1</span>
                    </div>
                    <Badge variant="gold" size="sm" dot>Live Fabric</Badge>
                  </div>
                  <div className="mt-6 space-y-3">
                    {[
                      { name: 'mumbai-core-k8s-01', provider: 'AWS / Bare Metal', nodes: '16 Worker Nodes', cpu: '64 vCPUs', status: 'Healthy' },
                      { name: 'singapore-edge-vms', provider: 'Google Cloud', nodes: '8 Instances', cpu: '32 vCPUs', status: 'Syncing' },
                      { name: 'frankfurt-storage-s3', provider: 'Private Cloud', nodes: '128TB Encrypted', cpu: 'NVMe Tier', status: 'Active' },
                    ].map((c) => (
                      <div key={c.name} className="p-4 rounded-xl bg-brandObsidian-800/80 border border-brandObsidian-700/60 flex items-center justify-between">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <Boxes className="w-4 h-4 text-brandGold-400" />
                            <span className="font-mono text-xs font-bold text-white">{c.name}</span>
                          </div>
                          <span className="text-[11px] text-slate-400">{c.provider} • {c.nodes}</span>
                        </div>
                        <span className="font-mono text-xs font-semibold px-2 py-1 rounded bg-brandGold-500/15 text-brandGold-300 border border-brandGold-500/30">
                          {c.status}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              <div className="lg:col-span-6 space-y-6">
                <Badge variant="outline" size="md">Multi-Cloud Fabric</Badge>
                <h3 className="text-2xl sm:text-3xl lg:text-4xl font-black text-slate-900 dark:text-white tracking-tight">
                  Single Plane Compute, Kubernetes & Object Storage
                </h3>
                <p className="text-slate-600 dark:text-slate-300 text-base sm:text-lg leading-relaxed">
                  Provision high-performance AMD EPYC / ARM virtual machines, self-healing managed Kubernetes clusters, and S3-compatible object buckets across global zones without switching between AWS, GCP, or Azure dashboards.
                </p>
                <div className="space-y-3 pt-2">
                  {[
                    'Zero provider lock-in: deploy on any cloud or sovereign on-prem hardware',
                    'Global WireGuard VPC mesh connecting heterogeneous clusters with <5ms latency',
                    'Attachable NVMe SSD block storage with automated cross-region replication',
                  ].map((pt) => (
                    <div key={pt} className="flex items-start gap-3">
                      <span className="mt-1 w-5 h-5 rounded-full bg-brandGold-500/10 text-brandGold-500 flex items-center justify-center shrink-0">
                        <Check className="w-3.5 h-3.5" />
                      </span>
                      <span className="text-sm sm:text-base text-slate-700 dark:text-slate-200">{pt}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Feature 2: Content Left, Visual Right */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-16 items-center">
              <div className="lg:col-span-6 space-y-6 lg:order-1">
                <Badge variant="outline" size="md">Reliability & SRE</Badge>
                <h3 className="text-2xl sm:text-3xl lg:text-4xl font-black text-slate-900 dark:text-white tracking-tight">
                  Automated SRE War-Room & Incident Self-Healing
                </h3>
                <p className="text-slate-600 dark:text-slate-300 text-base sm:text-lg leading-relaxed">
                  Stream sub-second OpenTelemetry metrics, Prometheus alerts, and Loki logs directly to your SRE console. Execute automated self-healing runbooks that resolve outages before customers notice.
                </p>
                <div className="space-y-3 pt-2">
                  {[
                    'Automated anomaly detection with SLO burn-rate error budgeting',
                    'War-room commander assignment, timeline recording, and instant RCA notes',
                    'Pre-configured self-healing runbooks for pod restart, cache flush, and traffic draining',
                  ].map((pt) => (
                    <div key={pt} className="flex items-start gap-3">
                      <span className="mt-1 w-5 h-5 rounded-full bg-brandGold-500/10 text-brandGold-500 flex items-center justify-center shrink-0">
                        <Check className="w-3.5 h-3.5" />
                      </span>
                      <span className="text-sm sm:text-base text-slate-700 dark:text-slate-200">{pt}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="lg:col-span-6 lg:order-2">
                <div className="relative rounded-3xl p-6 sm:p-8 bg-gradient-to-br from-brandObsidian-900 to-brandObsidian-950 border border-brandGold-500/30 shadow-2xl overflow-hidden group">
                  <div className="flex items-center justify-between pb-4 border-b border-brandObsidian-800">
                    <div className="flex items-center gap-2">
                      <Activity className="w-4 h-4 text-emerald-400" />
                      <span className="font-mono text-xs font-bold text-white">ArvWatch Live War-Room</span>
                    </div>
                    <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                      Auto-Remediation Active
                    </span>
                  </div>
                  <div className="mt-6 space-y-4">
                    <div className="p-4 rounded-xl bg-brandObsidian-800/80 border border-brandObsidian-700/60 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-mono font-bold text-amber-400">INC-849: Redis Replica Lag Spike</span>
                        <span className="text-[10px] text-slate-400 font-mono">0.4s ago</span>
                      </div>
                      <div className="h-1.5 w-full bg-brandObsidian-700 rounded-full overflow-hidden">
                        <div className="h-full bg-amber-500 rounded-full" style={{ width: '82%' }} />
                      </div>
                      <div className="flex items-center justify-between text-[11px] font-mono text-slate-300">
                        <span>Runbook: `auto-failover-standby`</span>
                        <span className="text-emerald-400 font-bold">Executed ✓</span>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="p-3.5 rounded-xl bg-brandObsidian-800/50 border border-brandObsidian-700/40 text-center">
                        <div className="text-[10px] font-mono text-slate-400 uppercase">P99 Telemetry</div>
                        <div className="text-lg font-mono font-black text-white mt-1">4.2 ms</div>
                      </div>
                      <div className="p-3.5 rounded-xl bg-brandObsidian-800/50 border border-brandObsidian-700/40 text-center">
                        <div className="text-[10px] font-mono text-slate-400 uppercase">MTTR Average</div>
                        <div className="text-lg font-mono font-black text-emerald-400 mt-1">42 sec</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Feature 3: Visual Left, Content Right */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-16 items-center">
              <div className="lg:col-span-6">
                <div className="relative rounded-3xl p-6 sm:p-8 bg-gradient-to-br from-brandObsidian-900 to-brandObsidian-950 border border-brandGold-500/30 shadow-2xl overflow-hidden group">
                  <div className="flex items-center justify-between pb-4 border-b border-brandObsidian-800">
                    <div className="flex items-center gap-2">
                      <GitBranch className="w-4 h-4 text-brandGold-400" />
                      <span className="font-mono text-xs font-bold text-white">GitOps Canary Engine</span>
                    </div>
                    <Badge variant="gold" size="sm">v3.4.0</Badge>
                  </div>
                  <div className="mt-6 space-y-4">
                    <div className="space-y-2">
                      <div className="flex justify-between text-xs font-mono">
                        <span className="text-slate-300">Phase 2: Canary Verification</span>
                        <span className="text-brandGold-400 font-bold">50% Traffic</span>
                      </div>
                      <div className="h-2 rounded-full bg-brandObsidian-800 overflow-hidden">
                        <div className="h-full bg-gradient-to-r from-brandGold-400 to-brandGold-600 rounded-full" style={{ width: '50%' }} />
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-center text-[10px] font-mono">
                      <div className="p-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-bold">
                        Error Rate: 0.00%
                      </div>
                      <div className="p-2.5 rounded-lg bg-brandObsidian-800 border border-brandObsidian-700 text-slate-300 font-bold">
                        P95: 18ms
                      </div>
                      <div className="p-2.5 rounded-lg bg-brandGold-500/10 border border-brandGold-500/30 text-brandGold-400 font-bold">
                        Passes Gate ✓
                      </div>
                    </div>
                    <div className="p-3 rounded-xl bg-brandObsidian-800/80 border border-brandObsidian-700 text-xs font-mono text-slate-400 flex items-center justify-between">
                      <span>1-Click Emergency Rollback</span>
                      <span className="px-2 py-0.5 rounded bg-rose-500/20 text-rose-400 text-[10px] font-bold">Zero Downtime</span>
                    </div>
                  </div>
                </div>
              </div>
              <div className="lg:col-span-6 space-y-6">
                <Badge variant="outline" size="md">GitOps Delivery</Badge>
                <h3 className="text-2xl sm:text-3xl lg:text-4xl font-black text-slate-900 dark:text-white tracking-tight">
                  Zero-Downtime Releases with Automated Rollback Gates
                </h3>
                <p className="text-slate-600 dark:text-slate-300 text-base sm:text-lg leading-relaxed">
                  Ship container updates with confidence. Aravanta Cloud OS gates every release with automated synthetic health checks, progressive canary weight transitions, and instantaneous rollback triggers.
                </p>
                <div className="space-y-3 pt-2">
                  {[
                    'Progressive canary, blue-green, and rolling deployment topologies',
                    'Cryptographic container signature validation before deployment into production',
                    'Instantaneous 1-click rollback with zero dropped active connections',
                  ].map((pt) => (
                    <div key={pt} className="flex items-start gap-3">
                      <span className="mt-1 w-5 h-5 rounded-full bg-brandGold-500/10 text-brandGold-500 flex items-center justify-center shrink-0">
                        <Check className="w-3.5 h-3.5" />
                      </span>
                      <span className="text-sm sm:text-base text-slate-700 dark:text-slate-200">{pt}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Feature 4: Content Left, Visual Right */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-16 items-center">
              <div className="lg:col-span-6 space-y-6 lg:order-1">
                <Badge variant="outline" size="md">FinOps & Security</Badge>
                <h3 className="text-2xl sm:text-3xl lg:text-4xl font-black text-slate-900 dark:text-white tracking-tight">
                  Transparent Indian Rupee (₹) & USD Billing with Granular RBAC
                </h3>
                <p className="text-slate-600 dark:text-slate-300 text-base sm:text-lg leading-relaxed">
                  Gain granular visibility into your cloud spend. Set strict project budget caps, generate GST-compliant enterprise invoices, and enforce 4-tier role-based access control with immutable 365-day audit trails.
                </p>
                <div className="space-y-3 pt-2">
                  {[
                    'Predictable pricing in INR (₹) and USD ($) with zero surprise egress markups',
                    'Fine-grained RBAC matrix with TOTP multi-factor authentication for all admins',
                    'Immutable, cryptographically verifiable compliance audit logs',
                  ].map((pt) => (
                    <div key={pt} className="flex items-start gap-3">
                      <span className="mt-1 w-5 h-5 rounded-full bg-brandGold-500/10 text-brandGold-500 flex items-center justify-center shrink-0">
                        <Check className="w-3.5 h-3.5" />
                      </span>
                      <span className="text-sm sm:text-base text-slate-700 dark:text-slate-200">{pt}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="lg:col-span-6 lg:order-2">
                <div className="relative rounded-3xl p-6 sm:p-8 bg-gradient-to-br from-brandObsidian-900 to-brandObsidian-950 border border-brandGold-500/30 shadow-2xl overflow-hidden group">
                  <div className="flex items-center justify-between pb-4 border-b border-brandObsidian-800">
                    <div className="flex items-center gap-2">
                      <BarChart3 className="w-4 h-4 text-brandGold-400" />
                      <span className="font-mono text-xs font-bold text-white">FinOps Real-Time Telemetry</span>
                    </div>
                    <span className="text-[10px] font-mono font-bold text-emerald-400">Within Budget (68%)</span>
                  </div>
                  <div className="mt-6 space-y-4">
                    <div className="p-4 rounded-xl bg-brandObsidian-800/80 border border-brandObsidian-700/60">
                      <div className="flex justify-between items-baseline mb-2">
                        <span className="text-xs text-slate-400 font-mono">Current Billing Cycle</span>
                        <span className="text-xl font-black text-white font-mono">₹28,450.00</span>
                      </div>
                      <div className="h-2 rounded-full bg-brandObsidian-700 overflow-hidden">
                        <div className="h-full bg-brandGold-500 rounded-full" style={{ width: '68%' }} />
                      </div>
                      <div className="mt-2 flex justify-between text-[10px] text-slate-400 font-mono">
                        <span>Budget Cap: ₹40,000.00</span>
                        <span>₹11,550.00 Remaining</span>
                      </div>
                    </div>
                    <div className="p-3.5 rounded-xl bg-brandObsidian-800/50 border border-brandObsidian-700 flex items-center justify-between text-xs font-mono">
                      <span className="text-slate-300">GST Invoice #ARV-2026-089</span>
                      <span className="text-brandGold-400 font-bold">PDF / Print Ready ✓</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── 2. PLATFORM / COMPONENT SHOWCASE (8 CARDS) ── */}
        <section id="showcase" className="relative overflow-hidden py-20 sm:py-28 border-t border-slate-200 dark:border-brandObsidian-800 bg-slate-100/50 dark:bg-brandObsidian-900/40">
          {/* Subtle Ambient Brand Watermark in Showcase Background */}
          <div
            aria-hidden
            className="pointer-events-none absolute -right-16 top-1/2 -translate-y-1/2 w-[460px] h-[460px] opacity-[0.03] dark:opacity-[0.055] select-none -z-0"
          >
            <img
              src="/assets/aravanta-glyph-gold.png"
              alt=""
              className="w-full h-full object-contain rotate-12 filter blur-[0.5px]"
            />
          </div>
          <div
            aria-hidden
            className="pointer-events-none absolute -left-20 bottom-8 w-[380px] h-[380px] opacity-[0.02] dark:opacity-[0.045] select-none -z-0"
          >
            <img
              src="/assets/aravanta-glyph-glow.png"
              alt=""
              className="w-full h-full object-contain -rotate-6"
            />
          </div>
          <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-3xl mx-auto space-y-4 mb-14">
              <Badge variant="gold" size="md">
                Component Showcase
              </Badge>
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-slate-900 dark:text-white leading-[1.1]">
                Unified Modules for Modern Cloud Engineering
              </h2>
              <p className="text-base sm:text-lg text-slate-600 dark:text-slate-300 leading-relaxed">
                Explore the modular building blocks of Aravanta Cloud OS — each purpose-built for speed, observability, and resilience.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
              {[
                { icon: Server, title: 'ArvCompute', badge: 'VM Engines', desc: 'Elastic high-performance virtual machines with NVMe SSD block storage and live resize.' },
                { icon: Boxes, title: 'ArvKube', badge: 'K8s Clusters', desc: 'Managed Kubernetes clusters with auto-draining, HPA, and multi-tenant namespace isolation.' },
                { icon: HardDrive, title: 'ArvStore', badge: 'S3 Storage', desc: 'Distributed S3-compatible object storage with cryptographic encryption and lifecycle policies.' },
                { icon: Database, title: 'ArvDB', badge: 'Managed DB', desc: 'High-availability Postgres, Redis, and MySQL engines with automated PITR backups.' },
                { icon: GitBranch, title: 'GitOps Engine', badge: 'CI/CD Pipelines', desc: 'Automated release pipelines with canary weight gating and instant rollback triggers.' },
                { icon: Activity, title: 'Observability Hub', badge: 'Telemetry', desc: 'Sub-second OpenTelemetry metrics, Prometheus scrapers, and live Loki log stream explorer.' },
                { icon: AlertTriangle, title: 'War-Room Console', badge: 'Incident SRE', desc: 'Incident command center with commander assignment, timeline recording, and RCA generation.' },
                { icon: Lock, title: 'Security & RBAC', badge: 'IAM Vault', desc: 'Fine-grained permissions matrix, TOTP multi-factor auth, and immutable compliance audit logs.' },
              ].map((item) => {
                const Icon = item.icon;
                return (
                  <Card key={item.title} hover className="group border-slate-200 dark:border-brandObsidian-700/80">
                    <CardBody className="space-y-4 !p-6">
                      <div className="flex items-center justify-between">
                        <div className="w-11 h-11 rounded-xl bg-brandGold-500/10 text-brandGold-500 dark:text-brandGold-400 flex items-center justify-center group-hover:bg-brandGold-500 group-hover:text-brandObsidian-950 transition-colors">
                          <Icon className="w-5.5 h-5.5" />
                        </div>
                        <Badge variant="gold" size="sm">{item.badge}</Badge>
                      </div>
                      <div className="space-y-1.5">
                        <h3 className="text-lg font-bold tracking-tight text-slate-900 dark:text-white group-hover:text-brandGold-600 dark:group-hover:text-brandGold-400 transition-colors">
                          {item.title}
                        </h3>
                        <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                          {item.desc}
                        </p>
                      </div>
                    </CardBody>
                  </Card>
                );
              })}
            </div>
          </div>
        </section>

        {/* ── 3. WHY ARAVANTA CLOUD OS (4 VALUE PROPS) ── */}
        <section id="why" className="relative overflow-hidden py-20 sm:py-28 border-t border-slate-200 dark:border-brandObsidian-800">
          {/* Subtle Centered Brand Watermark */}
          <div
            aria-hidden
            className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[580px] h-[580px] opacity-[0.025] dark:opacity-[0.045] select-none -z-0"
          >
            <img
              src="/assets/aravanta-glyph-glow.png"
              alt=""
              className="w-full h-full object-contain filter drop-shadow-[0_0_80px_rgba(185,139,59,0.2)]"
            />
          </div>
          <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-3xl mx-auto space-y-4 mb-14">
              <Badge variant="outline" size="md">
                Why Aravanta
              </Badge>
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-slate-900 dark:text-white leading-[1.1]">
                Built from the Ground Up for Cloud Independence
              </h2>
              <p className="text-base sm:text-lg text-slate-600 dark:text-slate-300 leading-relaxed">
                Experience the clarity and velocity of an operating system purpose-built for modern cloud engineering teams.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                {
                  icon: Server,
                  title: 'Single Pane of Glass',
                  desc: 'Eliminate context switching. Unify multi-cloud VMs, Kubernetes, storage, and databases under one cohesive dashboard.',
                },
                {
                  icon: RefreshCcw,
                  title: 'Zero Vendor Lock-In',
                  desc: 'Built on open standards: Kubernetes, OpenTelemetry, Prometheus, and Terraform. Migrate anywhere, anytime.',
                },
                {
                  icon: Activity,
                  title: 'Sub-Second Telemetry',
                  desc: 'Real-time observability stream with <10ms metrics latency. Catch anomalies before they impact your end users.',
                },
                {
                  icon: Shield,
                  title: 'Enterprise Security',
                  desc: 'Workload isolation, AES-256 encryption at rest, TLS 1.3 in transit, and immutable 365-day compliance logs.',
                },
              ].map((v) => {
                const Icon = v.icon;
                return (
                  <div key={v.title} className="p-6 rounded-2xl bg-white dark:bg-brandObsidian-850 border border-slate-200 dark:border-brandObsidian-700/80 hover:border-brandGold-500/50 hover:shadow-card-hover transition-all space-y-3">
                    <div className="w-12 h-12 rounded-xl bg-brandGold-500/10 text-brandGold-500 flex items-center justify-center">
                      <Icon className="w-6 h-6" />
                    </div>
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white">{v.title}</h3>
                    <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">{v.desc}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* ── 4. LOGOS / ADOPTERS & TESTIMONIALS STRIP ── */}
        <section className="py-16 sm:py-20 border-t border-slate-200 dark:border-brandObsidian-800 bg-slate-50 dark:bg-brandObsidian-900/60">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center text-xs font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-8 font-mono">
              Trusted by DevOps & SRE Teams Worldwide
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[
                {
                  quote: "Aravanta Cloud OS cut our multi-cloud deployment overhead by 70%. Having our Kubernetes clusters and S3 storage in one console is a game changer.",
                  author: "Aditya Sharma",
                  role: "Head of Infrastructure, FinTech Platform",
                },
                {
                  quote: "The sub-second telemetry and automated self-healing runbooks saved us hours during a major upstream outage. True production-grade reliability.",
                  author: "Elena Rostova",
                  role: "Staff SRE, Global Logistics",
                },
                {
                  quote: "Transparent Indian Rupee billing with GST compliance made enterprise procurement frictionless. Exactly what modern engineering needed.",
                  author: "Vikram Mehta",
                  role: "VP of Engineering, CloudScale",
                },
              ].map((t) => (
                <div key={t.author} className="p-6 rounded-2xl bg-white dark:bg-brandObsidian-800/80 border border-slate-200 dark:border-brandObsidian-700 shadow-sm space-y-4">
                  <p className="text-sm text-slate-700 dark:text-slate-300 italic leading-relaxed">
                    "{t.quote}"
                  </p>
                  <div className="pt-2 border-t border-slate-100 dark:border-brandObsidian-700">
                    <div className="font-bold text-sm text-slate-900 dark:text-white">{t.author}</div>
                    <div className="text-xs text-brandGold-600 dark:text-brandGold-400 font-mono">{t.role}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── DEVELOPER EXPERIENCE ── */}
        <section id="dx" className="relative overflow-hidden py-20 sm:py-28 border-t border-slate-200 dark:border-brandObsidian-800 bg-slate-100/60 dark:bg-brandObsidian-900/40">
          {/* Subtle Ambient Brand Watermark in Developer Experience Background */}
          <div
            aria-hidden
            className="pointer-events-none absolute -right-12 bottom-4 w-[420px] h-[420px] opacity-[0.025] dark:opacity-[0.05] select-none -z-0"
          >
            <img
              src="/assets/aravanta-glyph-gold.png"
              alt=""
              className="w-full h-full object-contain rotate-12 filter blur-[0.5px]"
            />
          </div>
          <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-16 items-start">
              <div className="lg:col-span-5 space-y-5 lg:sticky lg:top-24">
                <Badge variant="gold" size="md">
                  Developer experience
                </Badge>
                <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-slate-900 dark:text-white leading-[1.08]">
                  Ship infrastructure with the tools you already love.
                </h2>
                <p className="text-base sm:text-lg text-slate-600 dark:text-slate-300 leading-relaxed">
                  First-class CLI, Terraform provider, REST API, and typed SDK expose the
                  same primitives as the visual console. Everything is scriptable,
                  idempotent, and audit-logged.
                </p>
                <div className="space-y-3 pt-1">
                  {[
                    'Typed SDKs for Node, Python, Go with retries + pagination helpers',
                    'OpenAPI 3.1 spec exported from the same server code',
                    'CLI tab-completion for bash, zsh, fish, pwsh',
                  ].map((item) => (
                    <div key={item} className="flex items-start gap-3">
                      <span className="mt-1 w-5 h-5 rounded-full bg-brandGold-500/10 text-brandGold-500 flex items-center justify-center shrink-0">
                        <Check className="w-3 h-3" />
                      </span>
                      <span className="text-sm text-slate-700 dark:text-slate-200 leading-relaxed">
                        {item}
                      </span>
                    </div>
                  ))}
                </div>
                <div className="pt-3">
                  <Button
                    variant="outline"
                    size="lg"
                    onClick={() => onNavigate?.('developers')}
                    rightIcon={<ChevronRight className="w-4 h-4" />}
                  >
                    Browse developer docs
                  </Button>
                </div>
              </div>

              <div className="lg:col-span-7">
                <TabContainer defaultValue="cli">
                  <div className="mb-4 overflow-x-auto pb-1">
                    <TabList>
                      <Tab value="cli">CLI</Tab>
                      <Tab value="terraform">Terraform</Tab>
                      <Tab value="rest">REST API</Tab>
                      <Tab value="sdk">SDK (Node)</Tab>
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

        {/* ── WORKFLOW ── */}
        <section id="workflow" className="py-20 sm:py-28 border-t border-slate-200 dark:border-brandObsidian-800">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="max-w-2xl space-y-4 mb-12">
              <Badge variant="outline" size="md">
                Lifecycle workflow
              </Badge>
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-slate-900 dark:text-white leading-[1.1]">
                A continuous loop from provisioning to recovery.
              </h2>
              <p className="text-base sm:text-lg text-slate-600 dark:text-slate-300 leading-relaxed">
                Each step ships with safety guardrails, audit logging, and pre-built
                runbooks so your team moves fast without breaking production.
              </p>
            </div>

            <div className="relative">
              <div className="grid grid-cols-5 gap-2 sm:gap-3 mb-6 sm:mb-8">
                {workflowSteps.map((s, i) => {
                  const Icon = s.icon;
                  const isActive = i === activeWorkflowStep;
                  return (
                    <button
                      key={s.key}
                      onClick={() => setActiveWorkflowStep(i)}
                      className={[
                        'group relative flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 p-3 sm:p-4 rounded-2xl text-left border transition-all',
                        isActive
                          ? 'bg-brandGold-500/10 border-brandGold-500/50 shadow-sm shadow-brandGold-500/10'
                          : 'bg-white dark:bg-brandObsidian-800/40 border-slate-200 dark:border-brandObsidian-700/70 hover:border-brandGold-500/40',
                      ].join(' ')}
                    >
                      <span
                        className={[
                          'w-9 h-9 rounded-lg flex items-center justify-center shrink-0 transition-colors',
                          isActive
                            ? 'bg-brandGold-500 text-white'
                            : 'bg-slate-100 dark:bg-brandObsidian-700/60 text-slate-600 dark:text-slate-300 group-hover:text-brandGold-600 dark:group-hover:text-brandGold-400',
                        ].join(' ')}
                      >
                        <Icon className="w-4.5 h-4.5" />
                      </span>
                      <span className="min-w-0">
                        <span
                          className={[
                            'block text-[10px] sm:text-[11px] font-bold uppercase tracking-wider',
                            isActive
                              ? 'text-brandGold-600 dark:text-brandGold-400'
                              : 'text-slate-400',
                          ].join(' ')}
                        >
                          Step {s.step}
                        </span>
                        <span
                          className={[
                            'block text-sm font-bold truncate',
                            isActive ? 'text-slate-900 dark:text-white' : 'text-slate-700 dark:text-slate-200',
                          ].join(' ')}
                        >
                          {s.name}
                        </span>
                      </span>
                    </button>
                  );
                })}
              </div>

              <AnimatePresence mode="wait">
                <motion.div
                  key={activeWorkflowStep}
                  initial={reduceMotion ? {} : { opacity: 0, y: 8 }}
                  animate={reduceMotion ? {} : { opacity: 1, y: 0 }}
                  exit={reduceMotion ? {} : { opacity: 0, y: -6 }}
                  transition={reduceMotion ? {} : { duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                >
                  <Card goldAccent>
                    <CardBody className="!p-6 sm:!p-8 grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-10 items-center">
                      <div className="lg:col-span-7 space-y-4">
                        <div className="flex flex-wrap items-center gap-2.5">
                          <Badge variant="gold" size="md">
                            Step {workflowSteps[activeWorkflowStep].step} •{' '}
                            {workflowSteps[activeWorkflowStep].name.toUpperCase()}
                          </Badge>
                        </div>
                        <h3 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900 dark:text-white leading-tight">
                          {workflowSteps[activeWorkflowStep].title}
                        </h3>
                        <p className="text-base sm:text-lg text-slate-600 dark:text-slate-300 leading-relaxed">
                          {workflowSteps[activeWorkflowStep].desc}
                        </p>
                        <div className="grid grid-cols-2 gap-4 pt-3 max-w-md">
                          {workflowSteps[activeWorkflowStep].metrics.map((m) => (
                            <div
                              key={m.label}
                              className="rounded-xl bg-slate-50 dark:bg-brandObsidian-900/60 border border-slate-200/70 dark:border-brandObsidian-700/60 p-4"
                            >
                              <div className="text-[11px] uppercase tracking-wider font-bold text-slate-500 dark:text-slate-400">
                                {m.label}
                              </div>
                              <div className="mt-1 text-xl sm:text-2xl font-black text-slate-900 dark:text-white tabular-nums">
                                {m.value}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                      <div className="lg:col-span-5 flex justify-center lg:justify-end">
                        <div className="relative w-full max-w-xs aspect-square rounded-3xl bg-gradient-to-br from-brandGold-500/15 via-brandGold-500/5 to-transparent border border-brandGold-500/30 flex items-center justify-center overflow-hidden">
                          <div
                            aria-hidden
                            className="absolute inset-0 opacity-[0.07]"
                            style={{
                              backgroundImage:
                                'radial-gradient(circle, currentColor 1px, transparent 1px)',
                              backgroundSize: '18px 18px',
                              color: '#0B0F17',
                            }}
                          />
                          <div className="relative w-32 h-32 sm:w-40 sm:h-40 rounded-2xl bg-white dark:bg-brandObsidian-900 border border-slate-200 dark:border-brandObsidian-700 shadow-xl grid grid-cols-3 grid-rows-3 gap-1.5 p-3">
                            {Array.from({ length: 9 }).map((_, idx) => {
                              const StepIcon = workflowSteps[activeWorkflowStep].icon;
                              if (idx === 4) {
                                return (
                                  <div
                                    key={idx}
                                    className="col-span-1 row-span-1 rounded-lg bg-brandGold-500 text-white flex items-center justify-center shadow-md"
                                  >
                                    <StepIcon className="w-6 h-6" />
                                  </div>
                                );
                              }
                              const tone = [0, 2, 6, 8].includes(idx) ? 'bg-slate-100 dark:bg-brandObsidian-800' : 'bg-slate-50 dark:bg-brandObsidian-800/50';
                              return <div key={idx} className={`rounded-lg ${tone}`} />;
                            })}
                          </div>
                        </div>
                      </div>
                    </CardBody>
                  </Card>
                </motion.div>
              </AnimatePresence>
            </div>
          </div>
        </section>

        {/* ── INTEGRATIONS ── */}
        <section id="integrations" className="py-20 sm:py-28 border-t border-slate-200 dark:border-brandObsidian-800 bg-slate-100/60 dark:bg-brandObsidian-900/40">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-2xl mx-auto space-y-4 mb-14">
              <Badge variant="gold" size="md">
                Open standards
              </Badge>
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-slate-900 dark:text-white leading-[1.1]">
                Built on open standards you already trust.
              </h2>
              <p className="text-base sm:text-lg text-slate-600 dark:text-slate-300 leading-relaxed">
                No proprietary lock-in. Arvanta speaks the same wire protocols, file
                formats, and auth flows as the tools your engineers use today.
              </p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
              {integrations.map((i) => {
                const Icon = i.icon;
                return (
                  <div
                    key={i.name}
                    className="group flex flex-col items-center text-center p-5 rounded-2xl bg-white dark:bg-brandObsidian-800/40 border border-slate-200 dark:border-brandObsidian-700/70 hover:border-brandGold-500/50 hover:-translate-y-0.5 hover:shadow-card-hover transition-all"
                  >
                    <div className={['w-11 h-11 rounded-xl flex items-center justify-center mb-3', i.color].join(' ')}>
                      <Icon className="w-5.5 h-5.5" />
                    </div>
                    <div className="text-sm font-bold text-slate-900 dark:text-white">
                      {i.name}
                    </div>
                    <div className="mt-0.5 text-[11px] font-medium text-slate-500 dark:text-slate-400">
                      {i.subtitle}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* ── PRICING (TEASER) ── */}
        <section id="pricing" className="py-20 sm:py-28 border-t border-slate-200 dark:border-brandObsidian-800">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-2xl mx-auto space-y-5 mb-12">
              <Badge variant="outline" size="md">
                Transparent FinOps
              </Badge>
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-slate-900 dark:text-white leading-[1.1]">
                Predictable cloud operations pricing in INR (₹).
              </h2>
              <p className="text-base sm:text-lg text-slate-600 dark:text-slate-300 leading-relaxed">
                Clear capacity quotas with zero surprise overage fees, detailed per-resource
                invoices, and an Enterprise tier for custom compliance requirements.
              </p>

              <div className="inline-flex items-center p-1 rounded-xl bg-slate-100 dark:bg-brandObsidian-800/70 border border-slate-200 dark:border-brandObsidian-700 text-sm font-semibold">
                <button
                  onClick={() => setBillingPeriod('monthly')}
                  className={[
                    'px-4 py-2 rounded-lg transition-all',
                    billingPeriod === 'monthly'
                      ? 'bg-white dark:bg-brandObsidian-900 text-slate-900 dark:text-white shadow-sm'
                      : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200',
                  ].join(' ')}
                >
                  Monthly
                </button>
                <button
                  onClick={() => setBillingPeriod('annual')}
                  className={[
                    'px-4 py-2 rounded-lg transition-all inline-flex items-center gap-2',
                    billingPeriod === 'annual'
                      ? 'bg-brandGold-500 text-white shadow-sm'
                      : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200',
                  ].join(' ')}
                >
                  Annual
                  <span className={['text-[10px] px-1.5 py-0.5 rounded font-bold', billingPeriod === 'annual' ? 'bg-white/20 text-white' : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'].join(' ')}>
                    SAVE 20%
                  </span>
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
              {[
                {
                  name: 'Developer Cloud',
                  blurb: 'For engineers building standalone projects and testing pipelines.',
                  priceMonthly: '₹499',
                  priceAnnual: '₹399',
                  tierBadge: 'Starter Tier',
                  featured: false,
                  cta: 'Get started',
                  features: [
                    '8 vCPUs / 16GB Memory',
                    '500GB SSD NVMe Storage',
                    '50 Deployments / month',
                    '7-Day Log & Telemetry Retention',
                    'Standard Email Support',
                  ],
                },
                {
                  name: 'Team Operations',
                  blurb: 'For growing teams running production workloads with high availability.',
                  priceMonthly: '₹2,499',
                  priceAnnual: '₹1,999',
                  tierBadge: 'Operations Standard',
                  featured: true,
                  cta: 'Launch team workspace',
                  features: [
                    '64 vCPUs / 128GB Memory',
                    '5,000GB S3 & Database Storage',
                    'Unlimited Canary & Rolling Deploys',
                    '30-Day Metric & Log Retention',
                    'Incident War-Room Command Center',
                    'Slack & PagerDuty Alert Routing',
                  ],
                },
                {
                  name: 'Enterprise Platform',
                  blurb: 'For organizations requiring customized compliance, SSO, and dedicated VPCs.',
                  priceMonthly: 'Custom',
                  priceAnnual: 'Custom',
                  tierBadge: 'Dedicated Control Plane',
                  featured: false,
                  cta: 'Contact Platform Engineering',
                  features: [
                    'Custom Dedicated Cluster Capacity',
                    '365-Day SOC2 Immutable Audit Trail',
                    'Dedicated SAML 2.0 / Okta SSO',
                    '99.99% Financial Uptime SLA',
                    'Named Solutions Architect',
                    'BYOK Encryption & Private VPC',
                  ],
                },
              ].map((tier) => (
                <Card
                  key={tier.name}
                  className={[
                    'flex flex-col relative',
                    tier.featured ? 'ring-2 ring-brandGold-500/70 shadow-glow' : '',
                  ].join(' ')}
                >
                  {tier.featured && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-brandGold-500 text-white text-[10px] font-bold uppercase tracking-wider shadow-md z-10">
                      Most Popular
                    </div>
                  )}
                  <CardBody className="flex-1 flex flex-col !p-7">
                    <div>
                      <div className="text-[11px] uppercase tracking-wider font-bold text-slate-500 dark:text-slate-400">
                        {tier.tierBadge}
                      </div>
                      <h3 className="mt-1.5 text-xl font-black text-slate-900 dark:text-white">
                        {tier.name}
                      </h3>
                      <p className="mt-2 text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                        {tier.blurb}
                      </p>
                    </div>
                    <div className="mt-6 flex items-baseline gap-1.5">
                      <span className="text-4xl font-black text-slate-900 dark:text-white tabular-nums">
                        {billingPeriod === 'annual' ? tier.priceAnnual : tier.priceMonthly}
                      </span>
                      {tier.priceMonthly !== 'Custom' && (
                        <span className="text-sm text-slate-500 dark:text-slate-400 font-medium">
                          / month
                        </span>
                      )}
                    </div>
                    <div className="mt-6 space-y-2.5 flex-1">
                      {tier.features.map((feat) => (
                        <div key={feat} className="flex items-start gap-2.5 text-sm text-slate-700 dark:text-slate-200">
                          <Check className="w-4.5 h-4.5 text-emerald-500 mt-0.5 shrink-0" />
                          <span>{feat}</span>
                        </div>
                      ))}
                    </div>
                    <div className="mt-8">
                      <Button
                        size="lg"
                        variant={tier.featured ? 'primary' : 'outline'}
                        className="w-full"
                        onClick={onGoToRegister}
                        rightIcon={tier.featured ? <ArrowRight className="w-4 h-4" /> : undefined}
                      >
                        {tier.cta}
                      </Button>
                    </div>
                  </CardBody>
                </Card>
              ))}
            </div>

            <div className="mt-10 text-center">
              <Button
                variant="ghost"
                size="lg"
                onClick={() => onNavigate?.('pricing')}
                rightIcon={<ChevronRight className="w-4 h-4" />}
              >
                See full pricing comparison
              </Button>
            </div>
          </div>
        </section>

        {/* ── FAQ ── */}
        <section id="faq" className="py-20 sm:py-28 border-t border-slate-200 dark:border-brandObsidian-800 bg-slate-100/60 dark:bg-brandObsidian-900/40">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-2xl mx-auto space-y-4 mb-12">
              <Badge variant="gold" size="md">
                FAQ
              </Badge>
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-slate-900 dark:text-white leading-[1.1]">
                Operational Safety & Architecture FAQs
              </h2>
              <p className="text-base sm:text-lg text-slate-600 dark:text-slate-300 leading-relaxed">
                Answers to the most common questions from platform and reliability teams
                evaluating Aravanta CloudOS.
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

        {/* ── FINAL CTA ── */}
        <section className="py-20 sm:py-28 border-t border-slate-200 dark:border-brandObsidian-800">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="relative overflow-hidden rounded-3xl bg-brandObsidian-950 text-white shadow-2xl">
              <div
                aria-hidden
                className="pointer-events-none absolute inset-0 opacity-[0.25]"
                style={{
                  background:
                    'radial-gradient(85% 85% at 50% -10%, rgba(198,146,59,0.55) 0%, rgba(198,146,59,0) 60%)',
                }}
              />
              {/* Glowing Brand Logo Watermark in CTA background */}
              <div
                aria-hidden
                className="pointer-events-none absolute -right-16 -bottom-16 sm:-right-10 sm:-bottom-10 w-72 h-72 sm:w-96 sm:h-96 md:w-[440px] md:h-[440px] opacity-15 sm:opacity-20 select-none -z-0"
              >
                <img
                  src="/assets/aravanta-glyph-glow.png"
                  alt=""
                  className="w-full h-full object-contain filter drop-shadow-[0_0_60px_rgba(185,139,59,0.4)] rotate-6"
                />
              </div>
              <div
                aria-hidden
                className="pointer-events-none absolute inset-0 rounded-3xl"
                style={{
                  padding: '1px',
                  background:
                    'linear-gradient(135deg, rgba(198,146,59,0.55), rgba(198,146,59,0.05) 40%, rgba(198,146,59,0.25) 100%)',
                  WebkitMask:
                    'linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0)',
                  WebkitMaskComposite: 'xor',
                  maskComposite: 'exclude',
                }}
              />
              <div className="relative p-8 sm:p-12 lg:p-16 text-center space-y-6">
                <Badge variant="gold" size="md" dot>
                  <ShieldCheck className="w-3.5 h-3.5" /> Ready for Production Day-2 Ops
                </Badge>
                <div className="max-w-2xl mx-auto space-y-4">
                  <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight leading-[1.08]">
                    Ready to Unify Your Multi-Cloud Infrastructure?
                  </h2>
                  <p className="text-base sm:text-lg text-slate-300 leading-relaxed">
                    Deploy your first Kubernetes cluster, high-performance compute instance,
                    or distributed S3 bucket in under 60 seconds with Aravanta Cloud OS.
                  </p>
                </div>
                <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 pt-2">
                  <Button
                    size="xl"
                    variant="primary"
                    onClick={onGoToRegister}
                    className="bg-brandGold-500 hover:bg-brandGold-600 text-brandObsidian-950 font-bold min-h-[48px] shadow-lg shadow-brandGold-500/25"
                    rightIcon={<ArrowRight className="w-4.5 h-4.5" />}
                  >
                    Get Started Free
                  </Button>
                  <Button
                    size="xl"
                    variant="secondary"
                    onClick={() => onNavigate?.('documentation')}
                    className="min-h-[48px]"
                    leftIcon={<BookOpen className="w-4 h-4 text-brandGold-400" />}
                  >
                    Explore Documentation
                  </Button>
                </div>
                <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 pt-3 text-xs sm:text-sm text-slate-400 font-medium">
                  <span className="inline-flex items-center gap-1.5">
                    <Check className="w-4 h-4 text-brandGold-400" /> Instant Provisioning
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <Check className="w-4 h-4 text-brandGold-400" /> TOTP MFA Enabled
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <Check className="w-4 h-4 text-brandGold-400" /> 10-Day Full Access Trial
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
