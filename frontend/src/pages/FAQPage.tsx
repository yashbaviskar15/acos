import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  HelpCircle,
  Rocket,
  Building2,
  GitBranch,
  Headphones,
  Mail,
  Code2,
  Search,
  ChevronDown,
  Layers,
  HardDrive,
  CreditCard,
  Shield,
  Key,
  Check,
  Share2,
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

type FAQCategory = 'all' | 'getting-started' | 'compute-k8s' | 'pricing-finops' | 'security-sovereignty' | 'developer-cli';

interface FAQItem {
  id: string;
  category: FAQCategory;
  icon: React.ComponentType<any>;
  title: string;
  answer: string;
  codeSnippet?: string;
}

const faqs: FAQItem[] = [
  {
    id: 'getting-started',
    category: 'getting-started',
    icon: Rocket,
    title: 'How do I get started with Aravanta Cloud OS?',
    answer:
      'Getting started takes under two minutes. You can create a free account with no credit card required. Once registered, install the official arv CLI to interact directly with your workspace from your terminal. The free developer tier grants 2 vCPUs, 4 GB RAM, 50 GB SSD storage, and 100 GB network egress per month.',
    codeSnippet: '# Install on macOS/Linux:\ncurl -fsSL https://aravantacos.vercel.app/install.sh | bash\n\n# Install on Windows PowerShell:\nirm https://aravantacos.vercel.app/install.ps1 | iex',
  },
  {
    id: 'inr-pricing-gst',
    category: 'pricing-finops',
    icon: CreditCard,
    title: 'How does pricing work, and can I pay in Indian Rupees (INR) with GST input credit?',
    answer:
      'Yes. Aravanta Cloud OS is designed for transparent, sovereign FinOps. All infrastructure rates are metered at 1-minute intervals and published in Indian Rupees (INR ₹) as well as USD ($). Our rates: Virtual Machines from ₹1.50/vCPU-hr, NVMe storage from ₹0.0014/GB-hr, Managed DBs from ₹3.00/hr, and Managed K8s from ₹4.00/hr. Invoices are issued on the 1st of every month with statutory 18% GST (CGST+SGST/IGST), allowing registered business entities to claim Input Tax Credit (ITC). Annual plans receive an automated 20% discount.',
  },
  {
    id: 'kubernetes-support',
    category: 'compute-k8s',
    icon: Layers,
    title: 'What Kubernetes versions and container runtimes are supported by ArvK8s?',
    answer:
      'ArvK8s supports upstream Kubernetes versions 1.27 through 1.30 with containerd as the high-performance container runtime. Clusters ship with self-healing multi-master etcd consensus, automated minor-version upgrades, and pre-integrated Prometheus telemetry, Loki log collectors, and Cilium eBPF network security.',
  },
  {
    id: 'arvs3-storage',
    category: 'compute-k8s',
    icon: HardDrive,
    title: 'What is ArvS3 and how does it compare with AWS S3?',
    answer:
      'ArvS3 is our distributed, S3-compatible object storage layer engineered on NVMe arrays. It supports standard AWS S3 API endpoints, multipart uploads, pre-signed URLs, and bucket versioning. Because our primary datacenter clusters are physically housed in Mumbai (ap-south-1), compute-to-storage transfer experiences sub-millisecond latency with zero cross-AZ data egress fees within the same region.',
  },
  {
    id: 'data-sovereignty',
    category: 'security-sovereignty',
    icon: Building2,
    title: 'Where is customer data stored, and how is DPDPA 2023 compliance enforced?',
    answer:
      'All primary customer workloads, virtual disks, database instances, and audit logs are physically pinned to sovereign Tier-4 datacenters in Mumbai (ap-south-1) and Chennai (ap-south-2). Under India\'s Digital Personal Data Protection Act (DPDPA 2023), we enforce strict cryptographic isolation, zero cross-border transfer without explicit configuration, and NIST SP 800-88 cryptographic disk sanitization upon instance destruction.',
  },
  {
    id: 'mfa-security',
    category: 'security-sovereignty',
    icon: Key,
    title: 'How does multi-factor authentication (MFA) and zero-trust IAM work?',
    answer:
      'Aravanta implements strict Zero-Trust Identity. Privileged accounts (Owner, Admin, Operator) support RFC 6238 Time-Based One-Time Password (TOTP) MFA compatible with Google Authenticator, Authy, and 1Password. Passwords are saved using Argon2id cryptographic hashing, and all sessions utilize short-lived JWT tokens signed with RS256/Ed25519 asymmetric keys.',
  },
  {
    id: 'cli-sdk-tools',
    category: 'developer-cli',
    icon: Code2,
    title: 'What developer tools, SDKs, and Terraform providers are available?',
    answer:
      'Every operation available in the Aravanta console is accessible via our OpenAPI 3.1 REST API, the arv CLI binary, and our official Terraform provider (registry.terraform.io/providers/aravanta/aravanta). We provide official SDKs for Python (asyncio), Node.js/TypeScript, and Go.',
  },
  {
    id: 'support-sla',
    category: 'getting-started',
    icon: Headphones,
    title: 'What support SLAs and War-Room escalation procedures exist for production outages?',
    answer:
      'Free tier users receive community support via our SRE Forum and Discord. Team plan customers receive email and portal support with an 8-hour P2 and 4-hour P1 response SLA. Enterprise plan customers receive 24×7 support with a 1-hour P1 response SLA, dedicated named Solutions Architects, and direct access to our 24×7 P1 War-Room emergency hotline (+91 80 4567 8999).',
  },
  {
    id: 'migration-support',
    category: 'compute-k8s',
    icon: GitBranch,
    title: 'Can I migrate existing workloads from AWS, GCP, or Azure to Aravanta?',
    answer:
      'Yes. Aravanta includes a built-in Cloud Migration Wizard in the console. For Kubernetes workloads, Velero-compatible backup and restore allows seamless migration of deployments, stateful sets, and persistent volume claims. For databases, continuous CDC replication (pg_dump/logical replication for Postgres and binary logs for MySQL) enables cutovers with minimal downtime.',
  },
  {
    id: 'ai-code-privacy',
    category: 'security-sovereignty',
    icon: Shield,
    title: 'Does Aravanta inspect or train AI models on my code or database records?',
    answer:
      'Never. Aravanta enforces a strict zero-workload-inspection policy. We do not inspect container memory, database tables, or application source code, and we never use customer telemetry or proprietary assets to train machine learning models. You maintain 100% intellectual property ownership.',
  },
];

const categoryPills: { id: FAQCategory; label: string }[] = [
  { id: 'all', label: 'All Questions' },
  { id: 'getting-started', label: 'Getting Started' },
  { id: 'compute-k8s', label: 'Compute & Kubernetes' },
  { id: 'pricing-finops', label: 'Pricing & FinOps (INR)' },
  { id: 'security-sovereignty', label: 'Security & DPDPA' },
  { id: 'developer-cli', label: 'Developer & CLI' },
];

export const FAQPage: React.FC<PageProps> = ({
  onGoToLogin,
  onGoToRegister,
  onOpenCommandPalette,
  onNavigate,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<FAQCategory>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>('getting-started');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const filteredFaqs = faqs.filter((item) => {
    const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory;
    const matchesSearch =
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.answer.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.codeSnippet && item.codeSnippet.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCategory && matchesSearch;
  });

  const toggleAccordion = (id: string) => {
    setExpandedId((prev) => (prev === id ? null : id));
  };

  const copyPermalink = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const url = `${window.location.origin}/#faq-${id}`;
    navigator.clipboard.writeText(url);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-brandObsidian-950 font-sans antialiased text-slate-900 dark:text-slate-100 transition-colors">
      <Navbar
        onGoToLogin={onGoToLogin}
        onGoToRegister={onGoToRegister}
        onOpenCommandPalette={onOpenCommandPalette}
        onNavigate={onNavigate}
        currentView="faq"
      />

      <main>
        {/* Breadcrumb Header */}
        <section className="pt-6 pb-4 sm:pt-8">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <Breadcrumbs
              items={[
                { label: 'Platform', onClick: () => onNavigate?.('home') },
                { label: 'Support & Docs' },
                { label: 'FAQ' },
              ]}
            />
          </div>
        </section>

        {/* Hero Title Strip */}
        <section className="pb-8 sm:pb-12 border-b border-slate-200/80 dark:border-brandObsidian-800">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              className="space-y-4 max-w-3xl"
            >
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="gold" size="sm" dot>
                  Knowledge Base &amp; Architecture FAQ
                </Badge>
                <span className="text-xs text-slate-500 dark:text-slate-400 font-mono">
                  {faqs.length} verified technical answers
                </span>
              </div>
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-slate-900 dark:text-white">
                Frequently Asked Questions
              </h1>
              <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 leading-relaxed">
                Everything you need to know about Aravanta Cloud OS &mdash; from pricing in INR and Kubernetes capabilities to sovereign DPDPA 2023 compliance and CLI automation.
              </p>
            </motion.div>

            {/* Real-time Search Box */}
            <div className="mt-8 max-w-2xl relative">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search across questions, CLI flags, pricing rates, or Kubernetes features..."
                className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-300 dark:border-brandObsidian-700 bg-white dark:bg-brandObsidian-900 text-xs sm:text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-brandGold-500 shadow-xs transition-colors"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                >
                  Clear
                </button>
              )}
            </div>

            {/* Filter Category Pills */}
            <div className="mt-6 flex flex-wrap items-center gap-2">
              {categoryPills.map((pill) => (
                <button
                  key={pill.id}
                  onClick={() => setSelectedCategory(pill.id)}
                  className={[
                    'px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer min-h-[34px] flex items-center',
                    selectedCategory === pill.id
                      ? 'bg-brandGold-500 text-brandObsidian-950 font-bold shadow-xs'
                      : 'bg-white dark:bg-brandObsidian-900 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-brandObsidian-800 hover:border-slate-300 dark:hover:border-brandObsidian-700',
                  ].join(' ')}
                >
                  {pill.label}
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* FAQ Accordion List */}
        <section className="py-12 sm:py-16">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            {filteredFaqs.length === 0 ? (
              <div className="text-center py-16 space-y-3">
                <HelpCircle className="w-12 h-12 text-slate-300 dark:text-brandObsidian-700 mx-auto" />
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                  No matching questions found
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
                  Try adjusting your search query or reach out to our engineering support desk directly.
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setSearchQuery('');
                    setSelectedCategory('all');
                  }}
                >
                  Reset Filters
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredFaqs.map((faq) => {
                  const FIcon = faq.icon;
                  const isExpanded = expandedId === faq.id;
                  return (
                    <div
                      key={faq.id}
                      id={`faq-${faq.id}`}
                      className={[
                        'rounded-2xl border transition-all duration-200 overflow-hidden',
                        isExpanded
                          ? 'border-brandGold-500/60 bg-white dark:bg-brandObsidian-900/90 shadow-md'
                          : 'border-slate-200 dark:border-brandObsidian-800 bg-white/70 dark:bg-brandObsidian-900/50 hover:border-slate-300 dark:hover:border-brandObsidian-700',
                      ].join(' ')}
                    >
                      <button
                        onClick={() => toggleAccordion(faq.id)}
                        className="w-full p-4 sm:p-5 text-left flex items-start justify-between gap-4 cursor-pointer focus:outline-none"
                        aria-expanded={isExpanded}
                      >
                        <div className="flex items-start gap-3.5 min-w-0">
                          <div className={[
                            'w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-colors',
                            isExpanded
                              ? 'bg-brandGold-500 text-brandObsidian-950 font-bold'
                              : 'bg-brandGold-500/10 text-brandGold-600 dark:text-brandGold-400',
                          ].join(' ')}>
                            <FIcon className="w-4 h-4" />
                          </div>
                          <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white pt-1 leading-snug">
                            {faq.title}
                          </h3>
                        </div>

                        <div className="flex items-center gap-2 shrink-0 pt-1">
                          <button
                            onClick={(e) => copyPermalink(faq.id, e)}
                            className="p-1 rounded-md text-slate-400 hover:text-brandGold-500 transition-colors"
                            title="Copy link to this answer"
                          >
                            {copiedId === faq.id ? (
                              <Check className="w-3.5 h-3.5 text-emerald-500" />
                            ) : (
                              <Share2 className="w-3.5 h-3.5" />
                            )}
                          </button>
                          <ChevronDown
                            className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${
                              isExpanded ? 'rotate-180 text-brandGold-500' : ''
                            }`}
                          />
                        </div>
                      </button>

                      <AnimatePresence>
                        {isExpanded && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.2 }}
                          >
                            <div className="px-4 pb-5 sm:px-5 sm:pb-6 pt-1 text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed border-t border-slate-100 dark:border-brandObsidian-800/80">
                              <p>{faq.answer}</p>

                              {faq.codeSnippet && (
                                <div className="mt-3 p-3 rounded-xl bg-slate-900 dark:bg-black border border-slate-800 text-slate-100 font-mono text-xs overflow-x-auto">
                                  <pre>{faq.codeSnippet}</pre>
                                </div>
                              )}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Bottom Support Banner */}
            <div className="mt-14">
              <Card className="bg-gradient-to-br from-brandGold-500/10 via-white to-white dark:via-brandObsidian-900 dark:to-brandObsidian-900 border border-brandGold-500/30">
                <CardBody className="!p-6 sm:!p-8 flex flex-col sm:flex-row sm:items-center justify-between gap-5">
                  <div className="space-y-1">
                    <h3 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">
                      Still have technical or billing questions?
                    </h3>
                    <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300">
                      Our Bengaluru engineering and solutions architecture teams are one message away.
                    </p>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <Button
                      variant="primary"
                      size="md"
                      onClick={() => onNavigate?.('contact')}
                      className="bg-brandGold-500 hover:bg-brandGold-600 text-brandObsidian-950 font-bold"
                      leftIcon={<Mail className="w-4 h-4" />}
                    >
                      Contact Support Desk
                    </Button>
                    <Button
                      variant="outline"
                      size="md"
                      onClick={() => onNavigate?.('community')}
                    >
                      Join SRE Forum
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
