import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Layers,
  Cpu,
  BookOpen,
  Users,
  Code2,
  Scale,
  Shield,
  FileText,
  AlertTriangle,
  Headphones,
  Mail,
  HelpCircle,
  ChevronRight,
  Rocket,
  DollarSign,
  Building2,
  HardDrive,
  Database,
  GitBranch,
  Search,
  Key,
  Globe2,
} from 'lucide-react';

import { Navbar, LandingView } from '../components/ui/Navbar';
import { Footer } from '../components/ui/Footer';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Card, CardBody } from '../components/ui/Card';
import { Breadcrumbs } from '../components/ui/Breadcrumbs';

interface PageProps {
  onGoToLogin: () => void;
  onGoToRegister: () => void;
  onOpenCommandPalette?: () => void;
  onNavigate?: (view: LandingView) => void;
}

interface SitemapLink {
  label: string;
  view?: LandingView;
  href?: string;
  external?: boolean;
  description: string;
  icon: React.ComponentType<any>;
  tag?: string;
}

interface SitemapGroup {
  title: string;
  subtitle: string;
  accent: 'gold' | 'emerald' | 'sky' | 'purple';
  icon: React.ComponentType<any>;
  links: SitemapLink[];
}

const groups: SitemapGroup[] = [
  {
    title: '1. Compute & Containers',
    subtitle: 'Virtual machines, Kubernetes, serverless runtimes, and ephemeral environments',
    accent: 'gold',
    icon: Cpu,
    links: [
      { label: 'Compute Virtual Machines (ArvCompute)', view: 'features', description: 'KVM hypervisors, dedicated vCPUs & NVMe SSDs across Mumbai', icon: Cpu, tag: 'Compute' },
      { label: 'Managed Kubernetes (ArvKube)', view: 'features', description: 'Self-healing, auto-scaling K8s control plane with etcd HA', icon: Layers, tag: 'Kubernetes' },
      { label: 'Serverless Functions (ArvFunctions)', view: 'features', description: 'Event-driven, sub-millisecond cold start serverless compute', icon: Rocket, tag: 'Serverless' },
      { label: 'Ephemeral Dev Sandboxes (ArvSandbox)', view: 'features', description: 'Instant, disposable cloud environments for branch previews', icon: Code2, tag: 'DevEnv' },
      { label: 'GitOps Continuous Deployment', view: 'features', description: 'Canary releases, automated rollbacks & health gates', icon: GitBranch, tag: 'CI/CD' },
      { label: 'Pricing & FinOps TCO Engine', view: 'pricing', description: 'Transparent usage rates in INR (₹) with 20% annual discount', icon: DollarSign, tag: 'FinOps' },
    ],
  },
  {
    title: '2. Storage, Databases & Cloud Networking',
    subtitle: 'High-availability data persistence, software-defined networking, and message queues',
    accent: 'emerald',
    icon: HardDrive,
    links: [
      { label: 'ArvStore S3 Object Storage', view: 'features', description: 'S3-compatible distributed storage with 11 9s durability', icon: HardDrive, tag: 'Storage' },
      { label: 'Managed Databases (ArvDB)', view: 'features', description: 'Automated clustering for Postgres, Redis & MySQL', icon: Database, tag: 'Database' },
      { label: 'Virtual Private Cloud (ArvVPC)', view: 'features', description: 'Isolated software-defined networks, subnets & route tables', icon: Globe2, tag: 'Networking' },
      { label: 'Elastic Load Balancing (ArvLB)', view: 'features', description: 'High-throughput L4/L7 traffic ingress with TLS termination', icon: Layers, tag: 'LoadBalancer' },
      { label: 'Authoritative Cloud DNS (ArvDNS)', view: 'features', description: 'Ultra-low latency anycast DNS zone management', icon: Globe2, tag: 'DNS' },
      { label: 'Distributed Event Bus (ArvEvents)', view: 'features', description: 'Managed pub/sub topics and message queues for microservices', icon: GitBranch, tag: 'Events' },
    ],
  },
  {
    title: '3. Security, SRE Observability & FinOps AI',
    subtitle: 'Zero-trust identity, cryptographic KMS, Indian compliance, and predictive telemetry',
    accent: 'purple',
    icon: Shield,
    links: [
      { label: 'Zero-Trust IAM & RBAC (ArvIAM)', view: 'features', description: 'Fine-grained policy matrix, TOTP MFA & service account tokens', icon: Key, tag: 'IAM' },
      { label: 'Secrets & Key Manager (ArvVault)', view: 'features', description: 'Hardware-backed KMS with automated secret rotation', icon: Key, tag: 'KMS' },
      { label: 'Compliance-as-Code (ArvGuard)', view: 'features', description: 'Automated Indian sovereignty (DPDPA 2023) audit validation', icon: Shield, tag: 'Compliance' },
      { label: 'Observability Hub (ArvWatch)', view: 'features', description: 'Prometheus TSDB, Loki logs & OpenTelemetry distributed tracing', icon: BookOpen, tag: 'Telemetry' },
      { label: 'Predictive FinOps AI (ArvCostIQ)', view: 'features', description: 'Machine-learning powered cloud budget forecasting & optimization', icon: DollarSign, tag: 'FinOps AI' },
      { label: 'Incident Command War-Room', view: 'contact', description: '24×7 P1 emergency hotline and collaborative triage rooms', icon: Headphones, tag: 'War-Room' },
    ],
  },
  {
    title: '4. Developer Hub & Architecture Documentation',
    subtitle: 'Comprehensive guides, CLI reference, and security operational manuals',
    accent: 'sky',
    icon: BookOpen,
    links: [
      { label: 'Developer Hub & SDKs', view: 'developers', description: 'Unified API schemas, Python/Node/Go SDKs & Terraform provider', icon: Code2, tag: 'Developer' },
      { label: 'Interactive Terminal & arv CLI', view: 'developers', description: 'Web terminal emulator and one-line terminal installer scripts', icon: Code2, tag: 'CLI' },
      { label: '5-Minute Quickstart Guide', view: 'getting-started', description: 'Rapid deployment walkthrough for developers and teams', icon: Rocket, tag: 'Guide' },
      { label: 'System Architecture & SOPs', view: 'documentation', description: 'Full architectural manual and microservices catalog', icon: BookOpen, tag: 'Reference' },
      { label: 'User Security & Authentication Manual', view: 'user-manual', description: 'Operational runbook for TOTP MFA, OAuth 2.0 & zero-trust RBAC', icon: Key, tag: 'Security' },
      { label: 'Official GitHub Repository', href: 'https://github.com/yashbaviskar15/acos', external: true, description: 'Source code, issue tracking, and community PRs', icon: GitBranch, tag: 'Open Source' },
    ],
  },
  {
    title: '5. Ecosystem, Legal & Sovereignty',
    subtitle: 'Engineering community, statutory agreements, privacy governance, and company principles',
    accent: 'gold',
    icon: Scale,
    links: [
      { label: 'SRE Engineering Community', view: 'community', description: 'Discussions, architecture teardowns & community showcases', icon: Users, tag: 'Community' },
      { label: 'About Aravanta Cloud OS', view: 'about', description: 'Company history, sovereign cloud mission & leadership team', icon: Building2, tag: 'Company' },
      { label: 'Platform Status Dashboard', href: 'https://status.aravanta.cloud', external: true, description: 'Real-time region latency, incident logs & scheduled maintenance', icon: Globe2, tag: 'Telemetry' },
      { label: 'Contact Solutions & Support', view: 'contact', description: 'Sales, SRE support, FinOps billing & security incident hotline', icon: Mail, tag: 'Contact' },
      { label: 'Frequently Asked Questions (FAQ)', view: 'faq', description: 'Answers regarding pricing, K8s versions, S3 storage & CLI setup', icon: HelpCircle, tag: 'FAQ' },
      { label: 'Privacy Policy (DPDPA 2023)', view: 'privacy', description: 'Sovereign data governance, cryptographic isolation & DPO office', icon: Shield, tag: 'Privacy' },
      { label: 'Master Terms of Use & SLAs', view: 'terms', description: 'Enterprise SaaS agreement, 99.99% uptime credits & GST terms', icon: FileText, tag: 'Legal' },
      { label: 'Platform Disclaimer & Matrix', view: 'disclaimer', description: 'Shared responsibility matrix, backup duties & liability limits', icon: AlertTriangle, tag: 'Compliance' },
    ],
  },
];

const accentMap: Record<string, string> = {
  gold: 'bg-brandGold-500/10 text-brandGold-600 dark:text-brandGold-400',
  emerald: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
  sky: 'bg-sky-500/10 text-sky-600 dark:text-sky-400',
  purple: 'bg-purple-500/10 text-purple-600 dark:text-purple-400',
};

export const SitemapPage: React.FC<PageProps> = ({
  onGoToLogin,
  onGoToRegister,
  onOpenCommandPalette,
  onNavigate,
}) => {
  const [filterQuery, setFilterQuery] = useState('');

  const filteredGroups = groups.map((g) => ({
    ...g,
    links: g.links.filter(
      (l) =>
        l.label.toLowerCase().includes(filterQuery.toLowerCase()) ||
        l.description.toLowerCase().includes(filterQuery.toLowerCase()) ||
        (l.tag && l.tag.toLowerCase().includes(filterQuery.toLowerCase()))
    ),
  })).filter((g) => g.links.length > 0);

  const totalFilteredLinks = filteredGroups.reduce((acc, g) => acc + g.links.length, 0);

  const handleLinkClick = (link: SitemapLink) => {
    if (link.view) {
      onNavigate?.(link.view);
      setTimeout(() => window.scrollTo({ top: 0, behavior: 'smooth' }), 50);
    } else if (link.href) {
      window.open(link.href, link.external ? '_blank' : '_self', 'noopener,noreferrer');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-brandObsidian-950 font-sans antialiased text-slate-900 dark:text-slate-100 transition-colors">
      <Navbar
        onGoToLogin={onGoToLogin}
        onGoToRegister={onGoToRegister}
        onOpenCommandPalette={onOpenCommandPalette}
        onNavigate={onNavigate}
        currentView="sitemap"
      />

      <main>
        {/* Breadcrumb Header */}
        <section className="pt-6 pb-4 sm:pt-8">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <Breadcrumbs
              items={[
                { label: 'Platform', onClick: () => onNavigate?.('home') },
                { label: 'Directory' },
                { label: 'Sitemap' },
              ]}
            />
          </div>
        </section>

        {/* Hero Title Strip */}
        <section className="pb-8 sm:pb-12 border-b border-slate-200/80 dark:border-brandObsidian-800">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
                className="space-y-3 max-w-3xl"
              >
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="gold" size="sm" dot>
                    Platform Directory &amp; Navigation Index
                  </Badge>
                  <span className="text-xs text-slate-500 dark:text-slate-400 font-mono">
                    Aravanta CloudOS v2.4 GA
                  </span>
                </div>
                <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-slate-900 dark:text-white">
                  Platform Sitemap
                </h1>
                <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 leading-relaxed">
                  A comprehensive directory of all services, documentation guides, legal governance agreements, and developer tools across the Aravanta Cloud OS ecosystem.
                </p>
              </motion.div>

              <div className="flex items-center gap-3 shrink-0">
                <Button
                  variant="primary"
                  size="md"
                  onClick={onGoToRegister}
                  className="bg-brandGold-500 hover:bg-brandGold-600 text-brandObsidian-950 font-bold"
                  rightIcon={<Rocket className="w-4 h-4" />}
                >
                  Create Free Workspace
                </Button>
              </div>
            </div>

            {/* Filter Search Input */}
            <div className="mt-8 max-w-xl relative">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={filterQuery}
                onChange={(e) => setFilterQuery(e.target.value)}
                placeholder="Search sitemap (e.g., K8s, Storage, CLI, Billing, Privacy, MFA)..."
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 dark:border-brandObsidian-700 bg-white dark:bg-brandObsidian-900 text-xs sm:text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-brandGold-500 shadow-xs transition-colors"
              />
              {filterQuery && (
                <button
                  onClick={() => setFilterQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                >
                  Clear
                </button>
              )}
            </div>
            {filterQuery && (
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 font-mono">
                Showing {totalFilteredLinks} matching page{totalFilteredLinks === 1 ? '' : 's'} across {filteredGroups.length} categories.
              </p>
            )}
          </div>
        </section>

        {/* Sitemap Sections Grid */}
        <section className="py-12 sm:py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="space-y-10">
              {filteredGroups.map((group) => {
                const GIcon = group.icon;
                return (
                  <div key={group.title} className="space-y-4">
                    {/* Category Header */}
                    <div className="flex items-center gap-3 pb-2 border-b border-slate-200 dark:border-brandObsidian-800">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${accentMap[group.accent]}`}>
                        <GIcon className="w-4.5 h-4.5" />
                      </div>
                      <div>
                        <h2 className="text-lg sm:text-xl font-bold tracking-tight text-slate-900 dark:text-white">
                          {group.title}
                        </h2>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          {group.subtitle}
                        </p>
                      </div>
                    </div>

                    {/* Links Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      {group.links.map((link) => {
                        const LIcon = link.icon;
                        return (
                          <button
                            key={link.label}
                            onClick={() => handleLinkClick(link)}
                            className="group p-4 rounded-2xl border border-slate-200 dark:border-brandObsidian-800 bg-white dark:bg-brandObsidian-900 hover:border-brandGold-500/60 hover:shadow-md transition-all text-left flex flex-col justify-between cursor-pointer"
                          >
                            <div className="space-y-2">
                              <div className="flex items-center justify-between">
                                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${accentMap[group.accent]} group-hover:scale-105 transition-transform`}>
                                  <LIcon className="w-4 h-4" />
                                </div>
                                {link.tag && (
                                  <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-md bg-slate-100 dark:bg-brandObsidian-800 text-slate-600 dark:text-slate-400">
                                    {link.tag}
                                  </span>
                                )}
                              </div>
                              <h3 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white group-hover:text-brandGold-600 dark:group-hover:text-brandGold-400 transition-colors">
                                {link.label}
                              </h3>
                              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed line-clamp-2">
                                {link.description}
                              </p>
                            </div>
                            <div className="mt-3 pt-2 border-t border-slate-100 dark:border-brandObsidian-800 flex items-center justify-between text-[11px] text-slate-400 group-hover:text-brandGold-500 transition-colors">
                              <span>Jump to page</span>
                              <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Bottom Register Callout */}
            <div className="mt-14">
              <Card className="bg-gradient-to-br from-brandGold-500/10 via-white to-white dark:via-brandObsidian-900 dark:to-brandObsidian-900 border border-brandGold-500/30">
                <CardBody className="!p-6 sm:!p-8 flex flex-col sm:flex-row sm:items-center justify-between gap-5">
                  <div className="space-y-1">
                    <h3 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">
                      Ready to launch your first cluster?
                    </h3>
                    <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300">
                      Get started on the free developer tier in under 60 seconds with no credit card required.
                    </p>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <Button
                      variant="primary"
                      size="lg"
                      onClick={onGoToRegister}
                      className="bg-brandGold-500 hover:bg-brandGold-600 text-brandObsidian-950 font-bold"
                      rightIcon={<Rocket className="w-4 h-4" />}
                    >
                      Deploy Now
                    </Button>
                  </div>
                </CardBody>
              </Card>
            </div>
          </div>
        </section>
      </main>

      <Footer onNavigate={onNavigate} />
    </div>
  );
};
