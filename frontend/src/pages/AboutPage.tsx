import React from 'react';
import { motion } from 'framer-motion';
import {
  ArrowRight,
  ChevronRight,
  Sparkles,
  Rocket,
  ShieldCheck,
  HeartHandshake,
  Compass,
  Target,
  Eye,
  Github,
  ExternalLink,
  Users,
  Building2,
  Gauge,
  Lock,
  BookOpen,
  MessageSquare,
  Briefcase,
  Code2,
  Flag,
  Globe2,
  Zap,
} from 'lucide-react';

import { Navbar, LandingView } from '../components/ui/Navbar';
import { Footer } from '../components/ui/Footer';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Card, CardBody } from '../components/ui/Card';

interface PageProps {
  onGoToLogin: () => void;
  onGoToRegister: () => void;
  onOpenCommandPalette?: () => void;
  onNavigate?: (view: LandingView) => void;
}

const principles = [
  {
    icon: Target,
    title: 'Engineer-first workflows',
    body: 'Every surface (CLI, Terraform, console) exposes the exact same primitives. Nothing lives only in the UI. Everything is scriptable.',
  },
  {
    icon: Compass,
    title: 'Open standards, no lock-in',
    body: 'Kubernetes, Prometheus, Loki, OpenTelemetry, Terraform, S3-compatible APIs. Migrate out tomorrow if we stop earning your trust.',
  },
  {
    icon: Gauge,
    title: 'Boring reliability over hype',
    body: 'We pick proven, audited implementations — etcd, Postgres WAL, Patroni — and wrap them with UX, not replace them with custom magic.',
  },
  {
    icon: Lock,
    title: 'Secure by default, always',
    body: 'SSH-only access, TLS 1.3 mandatory, TOTP MFA required for Admin+ roles, immutable audit logs that even employees cannot delete.',
  },
  {
    icon: Eye,
    title: 'Transparent pricing & roadmaps',
    body: 'List prices published in INR with no negotiation. Public roadmap with community voting. Quarterly architecture notes in public repos.',
  },
  {
    icon: HeartHandshake,
    title: 'Human support, not tickets',
    body: 'Enterprise customers get a named Solutions Architect. P1 pages to the on-call engineer, never a tiered support queue.',
  },
];

const openSourceTenets = [
  {
    label: 'Developer surfaces in public repos',
    detail: 'CLI, Terraform provider, SDKs, and docs are developed in public GitHub repositories under permissive licenses.',
  },
  {
    label: 'Community-driven roadmap voting',
    detail: 'Every quarter, the top 3 community-voted issues get prioritized into the platform engineering sprint.',
  },
  {
    label: 'Contributor-first review SLA',
    detail: 'First-time external contributors receive a review within 48 hours. All PRs build against the same CI as internal changes.',
  },
  {
    label: 'Self-hostable distribution (Enterprise)',
    detail: 'The full control plane ships as a BYOK Kubernetes distribution for bare-metal, VMware, or air-gapped environments.',
  },
];

const stats = [
  { label: 'Control plane regions', value: '4', tone: 'gold' },
  { label: 'Avg VM boot time', value: '48s', tone: 'emerald' },
  { label: 'Platform uptime (6m)', value: '99.98%', tone: 'gold' },
  { label: 'Public roadmap issues', value: '142', tone: 'sky' },
];

export const AboutPage: React.FC<PageProps> = ({
  onGoToLogin,
  onGoToRegister,
  onOpenCommandPalette,
  onNavigate,
}) => {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-brandObsidian-950 font-sans antialiased text-slate-900 dark:text-slate-100">
      <Navbar
        onGoToLogin={onGoToLogin}
        onGoToRegister={onGoToRegister}
        onOpenCommandPalette={onOpenCommandPalette}
        onNavigate={onNavigate}
        currentView="about"
      />

      <main>
        <section className="relative pt-16 pb-20 overflow-hidden">
          <div aria-hidden className="absolute inset-x-0 top-0 -z-10 h-[500px] bg-hero-radial opacity-80" />
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="max-w-3xl mx-auto text-center space-y-5"
            >
              <Badge variant="gold" size="md" dot>
                <Building2 className="w-3.5 h-3.5" /> Company
              </Badge>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tighter leading-[1.03]">
                Built by engineers, for engineers.
              </h1>
              <p className="text-lg text-slate-600 dark:text-slate-300 leading-relaxed">
                Aravanta CloudOS was started by a team of ex-cloud-platform engineers who
                were tired of stitching 17 SaaS products together to ship one
                microservice. We&apos;re building the unified control plane we always wanted.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
                <Button
                  size="xl"
                  variant="primary"
                  onClick={onGoToRegister}
                  rightIcon={<Rocket className="w-4.5 h-4.5" />}
                >
                  Try the platform
                </Button>
                <Button
                  size="xl"
                  variant="outline"
                  onClick={() => onNavigate?.('pricing')}
                  rightIcon={<ChevronRight className="w-4 h-4" />}
                >
                  View pricing
                </Button>
              </div>
            </motion.div>

            <div className="mt-14 grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 max-w-5xl mx-auto">
              {stats.map((s, i) => {
                const toneMap: Record<string, string> = {
                  gold: 'from-brandGold-500/20 to-brandGold-500/5 border-brandGold-500/30 text-brandGold-600 dark:text-brandGold-400',
                  emerald: 'from-emerald-500/20 to-emerald-500/5 border-emerald-500/30 text-emerald-600 dark:text-emerald-400',
                  sky: 'from-sky-500/20 to-sky-500/5 border-sky-500/30 text-sky-600 dark:text-sky-400',
                };
                return (
                  <motion.div
                    key={s.label}
                    initial={{ opacity: 0, y: 10 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.4, delay: 0.05 * i }}
                  >
                    <Card>
                      <CardBody
                        className={[
                          '!p-5 sm:!p-6 text-center space-y-1 bg-gradient-to-br border',
                          toneMap[s.tone],
                        ].join(' ')}
                      >
                        <div className="text-3xl sm:text-4xl font-black tabular-nums text-slate-900 dark:text-white">
                          {s.value}
                        </div>
                        <div className="text-xs sm:text-sm font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300">
                          {s.label}
                        </div>
                      </CardBody>
                    </Card>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </section>

        <section className="py-16 sm:py-20 border-t border-slate-200 dark:border-brandObsidian-800 bg-slate-100/60 dark:bg-brandObsidian-900/40">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="max-w-2xl space-y-4 mb-12">
              <Badge variant="outline" size="md">
                <Compass className="w-3.5 h-3.5" /> Platform principles
              </Badge>
              <h2 className="text-3xl sm:text-4xl font-black tracking-tight leading-tight">
                The six design rules that govern every product decision.
              </h2>
              <p className="text-base text-slate-600 dark:text-slate-300 leading-relaxed">
                When there&apos;s a tradeoff between UX and operational correctness, we pick
                correctness. When we don&apos;t know, we ask our users — publicly.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {principles.map((p, i) => {
                const Icon = p.icon;
                return (
                  <motion.div
                    key={p.title}
                    initial={{ opacity: 0, y: 12 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.4, delay: 0.03 * i }}
                  >
                    <Card hover className="group h-full">
                      <CardBody className="!p-6 space-y-4 h-full">
                        <div className="w-12 h-12 rounded-2xl bg-brandGold-500/10 text-brandGold-600 dark:text-brandGold-400 flex items-center justify-center transition-colors group-hover:bg-brandGold-500 group-hover:text-white duration-300">
                          <Icon className="w-6 h-6" />
                        </div>
                        <div className="space-y-2">
                          <h3 className="text-lg font-black tracking-tight">{p.title}</h3>
                          <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                            {p.body}
                          </p>
                        </div>
                      </CardBody>
                    </Card>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </section>

        <section className="py-16 sm:py-20 border-t border-slate-200 dark:border-brandObsidian-800">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
              <div className="lg:col-span-5 space-y-5 lg:sticky lg:top-24 self-start">
                <Badge variant="gold" size="md" dot>
                  <Sparkles className="w-3.5 h-3.5" /> Open source philosophy
                </Badge>
                <h2 className="text-3xl sm:text-4xl font-black tracking-tight leading-tight">
                  Open when it matters, accountable when it counts.
                </h2>
                <p className="text-base text-slate-600 dark:text-slate-300 leading-relaxed">
                  We believe infrastructure tools should be inspectable, forkable, and
                  upgradeable without vendor lock-in. The control plane&apos;s data plane
                  is proprietary — but every developer surface is open and patchable.
                </p>
                <div className="flex flex-col sm:flex-row gap-3 pt-1">
                  <a
                    href="https://github.com"
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex"
                  >
                    <Button
                      size="lg"
                      variant="outline"
                      leftIcon={<Github className="w-4 h-4" />}
                      rightIcon={<ExternalLink className="w-3.5 h-3.5" />}
                    >
                      Aravanta on GitHub
                    </Button>
                  </a>
                  <Button
                    size="lg"
                    variant="ghost"
                    onClick={() => onNavigate?.('developers')}
                    rightIcon={<ChevronRight className="w-4 h-4" />}
                  >
                    Contributing guide
                  </Button>
                </div>
              </div>

              <div className="lg:col-span-7 space-y-4">
                {openSourceTenets.map((t, i) => (
                  <motion.div
                    key={t.label}
                    initial={{ opacity: 0, y: 12 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.4, delay: 0.05 * i }}
                  >
                    <Card hover className="group">
                      <CardBody className="!p-5 sm:!p-6 flex items-start gap-4 sm:gap-5">
                        <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-brandGold-500/10 text-brandGold-500 font-black flex items-center justify-center group-hover:bg-brandGold-500 group-hover:text-white transition-colors duration-300">
                          {String(i + 1).padStart(2, '0')}
                        </div>
                        <div className="min-w-0 flex-1 space-y-1.5">
                          <h3 className="text-base sm:text-lg font-black tracking-tight">
                            {t.label}
                          </h3>
                          <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                            {t.detail}
                          </p>
                        </div>
                      </CardBody>
                    </Card>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="py-16 sm:py-20 border-t border-slate-200 dark:border-brandObsidian-800 bg-slate-100/60 dark:bg-brandObsidian-900/40">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-10 items-center">
              <div className="space-y-5 order-2 lg:order-1">
                <Badge variant="outline" size="md">
                  <Users className="w-3.5 h-3.5" /> Team & hiring
                </Badge>
                <h2 className="text-3xl sm:text-4xl font-black tracking-tight leading-tight">
                  A tiny, senior, fully-distributed platform team.
                </h2>
                <p className="text-base text-slate-600 dark:text-slate-300 leading-relaxed">
                  We operate with less than 20 engineers across India and Singapore. Most
                  of us have 10+ years running production infrastructure at scale. We
                  don&apos;t do vanity metrics — we ship and we are on-call for what we ship.
                </p>
                <div className="grid grid-cols-3 gap-3 pt-2">
                  {[
                    { label: 'Avg engineering tenure', value: '11 yrs', icon: Briefcase },
                    { label: 'Remote-first', value: '100%', icon: Globe2 },
                    { label: 'On-call rotation', value: 'Everyone', icon: Zap },
                  ].map((s) => {
                    const SIcon = s.icon;
                    return (
                      <div
                        key={s.label}
                        className="rounded-2xl border border-slate-200 dark:border-brandObsidian-700 bg-white dark:bg-brandObsidian-800/60 p-4 shadow-card"
                      >
                        <SIcon className="w-4.5 h-4.5 text-brandGold-500 mb-2" />
                        <div className="text-xl font-black tabular-nums text-slate-900 dark:text-white">
                          {s.value}
                        </div>
                        <div className="mt-1 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                          {s.label}
                        </div>
                      </div>
                    );
                  })}
                </div>
                <div className="pt-3 flex flex-col sm:flex-row gap-3">
                  <Button
                    size="lg"
                    variant="primary"
                    onClick={() => window.open('https://github.com', '_blank', 'noreferrer')}
                    leftIcon={<Code2 className="w-4 h-4" />}
                    rightIcon={<ExternalLink className="w-3.5 h-3.5" />}
                  >
                    View open roles
                  </Button>
                  <Button
                    size="lg"
                    variant="ghost"
                    onClick={() => onNavigate?.('features')}
                    rightIcon={<ChevronRight className="w-4 h-4" />}
                  >
                    What we&apos;re building next
                  </Button>
                </div>
              </div>

              <div className="order-1 lg:order-2">
                <Card>
                  <CardBody className="!p-0">
                    <div className="px-5 py-4 border-b border-slate-200 dark:border-brandObsidian-700 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Flag className="w-4.5 h-4.5 text-brandGold-500" />
                        <h3 className="text-sm font-black">Public roadmap — Q3 highlights</h3>
                      </div>
                      <Badge variant="success" size="sm" dot>
                        42% shipped
                      </Badge>
                    </div>
                    <ul className="divide-y divide-slate-200 dark:divide-brandObsidian-700">
                      {[
                        { label: 'Tokyo & São Paulo regions GA', status: 'In progress', tone: 'amber' },
                        { label: 'Azure compute backend', status: 'Planned', tone: 'sky' },
                        { label: 'MongoDB managed engine', status: 'Beta', tone: 'emerald' },
                        { label: 'ClickHouse managed engine', status: 'Shipped', tone: 'emerald' },
                        { label: 'ArvCD progressive delivery UI', status: 'In progress', tone: 'amber' },
                        { label: 'SOC2 Type II report published', status: 'Shipped', tone: 'emerald' },
                      ].map((item) => {
                        const toneBadge: any =
                          item.tone === 'emerald'
                            ? 'success'
                            : item.tone === 'amber'
                            ? 'warning'
                            : 'info';
                        return (
                          <li
                            key={item.label}
                            className="p-4 sm:p-5 flex items-center gap-3 sm:gap-4 hover:bg-slate-50 dark:hover:bg-brandObsidian-800/40 transition-colors cursor-pointer"
                          >
                            <div
                              className={[
                                'w-2.5 h-2.5 rounded-full shrink-0',
                                item.status === 'Shipped' ? 'bg-emerald-500' : item.status === 'In progress' ? 'bg-amber-500' : 'bg-sky-500',
                              ].join(' ')}
                            />
                            <div className="min-w-0 flex-1">
                              <div className="text-sm font-bold text-slate-800 dark:text-slate-100 truncate">
                                {item.label}
                              </div>
                            </div>
                            <Badge variant={toneBadge} size="sm">
                              {item.status}
                            </Badge>
                          </li>
                        );
                      })}
                    </ul>
                  </CardBody>
                </Card>
              </div>
            </div>
          </div>
        </section>

        <section className="py-16 sm:py-20 border-t border-slate-200 dark:border-brandObsidian-800">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-10 items-stretch">
              <div className="lg:col-span-5 space-y-5">
                <Badge variant="gold" size="md" dot>
                  <MessageSquare className="w-3.5 h-3.5" /> Contact
                </Badge>
                <h2 className="text-3xl sm:text-4xl font-black tracking-tight leading-tight">
                  Questions, proposals, or just want to say hi?
                </h2>
                <p className="text-base text-slate-600 dark:text-slate-300 leading-relaxed">
                  The fastest way to reach us is to create a workspace and send a message
                  from within the in-app support chat. For sales and compliance, email
                  works too.
                </p>
                <ul className="space-y-3 pt-2 text-sm">
                  {[
                    { label: 'Sales & enterprise proposals', value: 'enterprise@aravanta.cloud' },
                    { label: 'Security & compliance docs', value: 'security@aravanta.cloud' },
                    { label: 'Status & incident updates', value: 'status.aravanta.cloud' },
                    { label: 'Support (all plans)', value: 'In-app chat or support@aravanta.cloud' },
                  ].map((row) => (
                    <li
                      key={row.label}
                      className="flex items-start gap-3 rounded-xl border border-slate-200 dark:border-brandObsidian-700 bg-white dark:bg-brandObsidian-800/50 p-4 shadow-card"
                    >
                      <div className="mt-0.5 w-2 h-2 rounded-full bg-brandGold-500 shrink-0" />
                      <div className="min-w-0 flex-1">
                        <div className="text-[11px] uppercase font-bold tracking-wider text-slate-500 dark:text-slate-400">
                          {row.label}
                        </div>
                        <div className="mt-0.5 text-sm font-semibold text-slate-800 dark:text-slate-100 font-mono break-all">
                          {row.value}
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="lg:col-span-7 flex">
                <Card className="flex-1">
                  <CardBody className="!p-6 sm:!p-8 flex flex-col justify-between h-full gap-6">
                    <div className="space-y-4">
                      <div className="flex items-center gap-2">
                        <Rocket className="w-5 h-5 text-brandGold-500" />
                        <h3 className="text-2xl sm:text-3xl font-black tracking-tight">
                          Get started in the time it takes to make coffee.
                        </h3>
                      </div>
                      <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                        Creating a workspace walks you through IAM key creation, SSH key
                        upload, and project setup. You&apos;ll be deploying to Kubernetes in
                        about 2 minutes.
                      </p>
                      <ol className="space-y-2.5 text-sm">
                        {[
                          'Create workspace → verify email → set MFA',
                          'Upload an SSH key from IAM credentials',
                          'Create project and launch a cluster via quickstart',
                          'ArvCD deploy a sample app to verify the pipeline',
                        ].map((s, i) => (
                          <li key={s} className="flex items-start gap-3">
                            <span className="mt-0.5 w-6 h-6 rounded-lg bg-brandGold-500/10 text-brandGold-500 font-black text-xs flex items-center justify-center shrink-0">
                              {i + 1}
                            </span>
                            <span className="text-slate-700 dark:text-slate-200 leading-relaxed">
                              {s}
                            </span>
                          </li>
                        ))}
                      </ol>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-3 pt-2">
                      <Button
                        size="xl"
                        variant="primary"
                        onClick={onGoToRegister}
                        rightIcon={<ArrowRight className="w-4.5 h-4.5" />}
                        className="flex-1"
                      >
                        Create free workspace
                      </Button>
                      <Button
                        size="xl"
                        variant="outline"
                        onClick={() => onNavigate?.('documentation')}
                        leftIcon={<BookOpen className="w-4 h-4" />}
                        className="flex-1"
                      >
                        Read getting started
                      </Button>
                    </div>
                  </CardBody>
                </Card>
              </div>
            </div>
          </div>
        </section>

        <section className="py-20 sm:py-28 border-t border-slate-200 dark:border-brandObsidian-800">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="relative overflow-hidden rounded-3xl bg-brandObsidian-950 text-white shadow-2xl">
              <div
                aria-hidden
                className="pointer-events-none absolute inset-0 opacity-[0.22]"
                style={{
                  background:
                    'radial-gradient(85% 85% at 50% -10%, rgba(198,146,59,0.55) 0%, rgba(198,146,59,0) 60%)',
                }}
              />
              <div className="relative p-8 sm:p-12 lg:p-14 text-center space-y-6">
                <Badge variant="gold" size="md" dot>
                  <ShieldCheck className="w-3.5 h-3.5" /> Built by engineers, for engineers
                </Badge>
                <div className="max-w-2xl mx-auto space-y-4">
                  <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight leading-[1.08]">
                    Stop stitching 17 dashboards together.
                  </h2>
                  <p className="text-base sm:text-lg text-slate-300 leading-relaxed">
                    Start a 10-day full-access trial with Aravanta CloudOS today. No
                    credit card, no sales call required, cancel with one click.
                  </p>
                </div>
                <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 pt-2">
                  <Button
                    size="xl"
                    variant="primary"
                    onClick={onGoToRegister}
                    rightIcon={<ArrowRight className="w-4.5 h-4.5" />}
                  >
                    Launch workspace
                  </Button>
                  <Button
                    size="xl"
                    variant="secondary"
                    onClick={() => onNavigate?.('pricing')}
                    leftIcon={<ShieldCheck className="w-4 h-4" />}
                  >
                    Talk to platform team
                  </Button>
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
