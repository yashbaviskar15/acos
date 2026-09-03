import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  ArrowRight,
  ChevronRight,
  Check,
  X,
  ShieldCheck,
  Sparkles,
  CreditCard,
  CalendarRange,
  Building2,
  Users,
  Server,
  Container,
  Activity,
  Lock,
  FileText,
  Headphones,
  ArrowUpRight,
  Clock,
  Globe2,
  FileCode,
  Rocket,
  MessageSquare,
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

type BillingCycle = 'monthly' | 'annual';

const tiers = [
  {
    key: 'dev',
    name: 'Developer Cloud',
    tagline: 'For engineers building standalone projects and testing pipelines.',
    badge: { label: 'Starter Tier', tone: 'outline' as const },
    monthly: '₹499',
    annual: '₹399',
    annualNote: null,
    ctaPrimary: 'Get started',
    ctaVariant: 'outline' as const,
    featured: false,
    highlights: [
      '8 vCPUs / 16GB memory',
      '500GB SSD NVMe storage',
      '50 deployments / month',
    ],
  },
  {
    key: 'team',
    name: 'Team Operations',
    tagline: 'For growing teams running production workloads with high availability.',
    badge: { label: 'Most Popular', tone: 'gold' as const },
    monthly: '₹2,499',
    annual: '₹1,999',
    annualNote: 'Billed annually (₹23,988)',
    ctaPrimary: 'Launch team workspace',
    ctaVariant: 'primary' as const,
    featured: true,
    highlights: [
      '64 vCPUs / 128GB memory',
      '5,000GB storage + S3 buckets',
      'Unlimited canary & rolling deploys',
    ],
  },
  {
    key: 'ent',
    name: 'Enterprise Platform',
    tagline: 'For organizations requiring custom compliance, SSO, and dedicated VPCs.',
    badge: { label: 'Dedicated Control Plane', tone: 'info' as const },
    monthly: 'Custom',
    annual: 'Custom',
    annualNote: 'Per SLA & requirements',
    ctaPrimary: 'Contact Platform Engineering',
    ctaVariant: 'secondary' as const,
    featured: false,
    highlights: [
      'Custom dedicated cluster capacity',
      '365-day SOC2 immutable audit trail',
      'SAML 2.0 / Okta SSO + SCIM sync',
    ],
  },
];

const comparisonRows = [
  {
    group: 'Compute & Infrastructure',
    icon: Server,
    rows: [
      { label: 'vCPU / Memory pool', dev: '8 / 16GB', team: '64 / 128GB', ent: 'Custom' },
      { label: 'NVMe storage included', dev: '500 GB', team: '5,000 GB', ent: 'Unlimited' },
      { label: 'Managed Kubernetes clusters', dev: '1', team: '8', ent: 'Unlimited' },
      { label: 'Availability zones per cluster', dev: '1', team: '3', ent: 'Up to 5' },
      { label: 'Regions available', dev: '2', team: '4', ent: 'All + private' },
    ],
  },
  {
    group: 'Delivery & Operations',
    icon: Container,
    rows: [
      { label: 'GitOps applications (ArvCD)', dev: '5', team: 'Unlimited', ent: 'Unlimited' },
      { label: 'Canary + blue/green deploys', dev: false, team: true, ent: true },
      { label: 'SLO-gated rollouts', dev: false, team: true, ent: true },
      { label: 'Deployment quotas / month', dev: '50', team: 'Unlimited', ent: 'Unlimited' },
      { label: 'Incident war rooms', dev: '1 concurrent', team: '10 concurrent', ent: 'Unlimited' },
    ],
  },
  {
    group: 'Observability & Alerting',
    icon: Activity,
    rows: [
      { label: 'Metrics retention', dev: '7 days', team: '30 days', ent: '365 days' },
      { label: 'Log retention (Loki)', dev: '7 days', team: '30 days', ent: '365 days' },
      { label: 'Traces retention (OTel)', dev: '3 days', team: '14 days', ent: '90 days' },
      { label: 'Alerting integrations', dev: 'Email', team: 'Slack, PD, Webhook', ent: 'All + MS Teams' },
      { label: 'Automated runbooks', dev: '5', team: '200+ templates', ent: 'Custom library' },
    ],
  },
  {
    group: 'Security & Compliance',
    icon: Lock,
    rows: [
      { label: 'RBAC roles', dev: '3-tier', team: '4-tier', ent: 'Custom + ABAC' },
      { label: 'TOTP MFA', dev: true, team: true, ent: true },
      { label: 'SSO (SAML 2.0 / OIDC)', dev: false, team: false, ent: true },
      { label: 'SCIM 2.0 directory sync', dev: false, team: false, ent: true },
      { label: 'Audit log retention', dev: '30 days', team: '90 days', ent: '365 days signed' },
      { label: 'BYOK / CMEK encryption', dev: false, team: false, ent: true },
    ],
  },
  {
    group: 'Support & SLA',
    icon: Headphones,
    rows: [
      { label: 'Platform uptime SLA', dev: '99.9%', team: '99.98%', ent: '99.99% financial' },
      { label: 'Support channels', dev: 'Email', team: 'Email + Slack', ent: 'Named SA + 24x7 P1' },
      { label: 'P1 response time', dev: 'Business hrs', team: '1 hr 24x7', ent: '15 min 24x7' },
      { label: 'Dedicated solutions architect', dev: false, team: false, ent: true },
      { label: 'On-prem / BYOK distribution', dev: false, team: false, ent: true },
    ],
  },
];

function formatCell(v: string | boolean) {
  if (typeof v === 'boolean') {
    return v ? (
      <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-semibold">
        <Check className="w-4 h-4" /> Included
      </span>
    ) : (
      <span className="inline-flex items-center gap-1 text-slate-400 dark:text-slate-500">
        <X className="w-4 h-4" /> —
      </span>
    );
  }
  return <span className="text-slate-700 dark:text-slate-200 font-medium">{v}</span>;
}

export const PricingPage: React.FC<PageProps> = ({
  onGoToLogin,
  onGoToRegister,
  onOpenCommandPalette,
  onNavigate,
}) => {
  const [cycle, setCycle] = useState<BillingCycle>('annual');
  const savings = cycle === 'annual';

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-brandObsidian-950 font-sans antialiased text-slate-900 dark:text-slate-100">
      <Navbar
        onGoToLogin={onGoToLogin}
        onGoToRegister={onGoToRegister}
        onOpenCommandPalette={onOpenCommandPalette}
        onNavigate={onNavigate}
        currentView="pricing"
      />

      <main>
        <section className="relative pt-16 pb-16 overflow-hidden">
          <div aria-hidden className="absolute inset-x-0 top-0 -z-10 h-[480px] bg-hero-radial opacity-80" />
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="max-w-3xl mx-auto text-center space-y-5"
            >
              <Badge variant="gold" size="md" dot>
                <CreditCard className="w-3.5 h-3.5" /> Transparent FinOps
              </Badge>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tighter leading-[1.03]">
                Predictable cloud operations pricing in INR (₹).
              </h1>
              <p className="text-lg text-slate-600 dark:text-slate-300 leading-relaxed">
                Clear capacity quotas with zero surprise overage fees, detailed
                per-resource invoices, and an Enterprise tier for the most demanding
                compliance and VPC requirements.
              </p>

              <div className="pt-2 flex justify-center">
                <div className="inline-flex items-center p-1 rounded-2xl bg-slate-100 dark:bg-brandObsidian-800/70 border border-slate-200 dark:border-brandObsidian-700 shadow-sm">
                  <button
                    onClick={() => setCycle('monthly')}
                    className={[
                      'relative inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all',
                      cycle === 'monthly'
                        ? 'bg-white dark:bg-brandObsidian-900 text-slate-900 dark:text-white shadow-sm'
                        : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200',
                    ].join(' ')}
                  >
                    <CalendarRange className="w-4 h-4" />
                    Monthly billing
                  </button>
                  <button
                    onClick={() => setCycle('annual')}
                    className={[
                      'relative inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all',
                      cycle === 'annual'
                        ? 'bg-brandGold-500 text-white shadow-sm'
                        : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200',
                    ].join(' ')}
                  >
                    <Sparkles className="w-4 h-4" />
                    Annual billing
                    <span
                      className={[
                        'text-[10px] px-2 py-0.5 rounded-full font-black',
                        cycle === 'annual'
                          ? 'bg-white/20 text-white'
                          : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
                      ].join(' ')}
                    >
                      SAVE 20%
                    </span>
                  </button>
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 pt-2 text-sm text-slate-600 dark:text-slate-300 font-medium">
                <span className="inline-flex items-center gap-1.5">
                  <Check className="w-4 h-4 text-emerald-500" /> No credit card required
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <Check className="w-4 h-4 text-emerald-500" /> Cancel anytime
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <Check className="w-4 h-4 text-emerald-500" /> 10-day full-access trial
                </span>
              </div>
            </motion.div>
          </div>
        </section>

        <section className="py-12 sm:py-16 border-t border-slate-200 dark:border-brandObsidian-800">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8 items-stretch">
              {tiers.map((tier) => {
                const price = cycle === 'annual' ? tier.annual : tier.monthly;
                const badgeTone: any =
                  tier.badge.tone === 'gold'
                    ? 'gold'
                    : tier.badge.tone === 'info'
                    ? 'info'
                    : 'outline';
                return (
                  <motion.div
                    key={tier.key}
                    initial={{ opacity: 0, y: 16 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.45 }}
                    className="relative flex"
                  >
                    <Card
                      className={[
                        'w-full flex flex-col flex-1',
                        tier.featured ? 'ring-2 ring-brandGold-500/70 shadow-glow relative' : '',
                      ].join(' ')}
                    >
                      {tier.featured && (
                        <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-brandGold-500 text-white text-[10px] font-black uppercase tracking-wider shadow-md z-10">
                          Most Popular
                        </div>
                      )}
                      <CardBody className="!p-7 flex flex-col flex-1">
                        <div className="space-y-1.5">
                          <Badge variant={badgeTone} size="md">
                            {tier.badge.label}
                          </Badge>
                          <h2 className="mt-3 text-2xl font-black tracking-tight">
                            {tier.name}
                          </h2>
                          <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                            {tier.tagline}
                          </p>
                        </div>

                        <div className="mt-6 pb-6 border-b border-slate-200 dark:border-brandObsidian-700">
                          <div className="flex items-baseline gap-1.5">
                            <span className="text-5xl font-black tabular-nums tracking-tight text-slate-900 dark:text-white">
                              {price}
                            </span>
                            {tier.monthly !== 'Custom' && (
                              <span className="text-sm text-slate-500 dark:text-slate-400 font-medium">
                                / month
                              </span>
                            )}
                          </div>
                          {tier.annualNote && cycle === 'annual' && tier.monthly !== 'Custom' && (
                            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                              {tier.annualNote}
                            </p>
                          )}
                          {tier.monthly !== 'Custom' && savings && tier.annualNote && (
                            <p className="mt-1.5 text-xs font-bold text-emerald-600 dark:text-emerald-400 inline-flex items-center gap-1">
                              <ArrowUpRight className="w-3.5 h-3.5" />
                              Saves you ~₹{((parseInt(tier.monthly.replace(/[^\d]/g, '')) - parseInt(tier.annual.replace(/[^\d]/g, ''))) * 12).toLocaleString('en-IN')}/yr
                            </p>
                          )}
                        </div>

                        <div className="mt-6 space-y-2.5 flex-1">
                          {tier.highlights.map((h) => (
                            <div key={h} className="flex items-start gap-2.5 text-sm">
                              <Check className="w-4.5 h-4.5 text-emerald-500 shrink-0 mt-0.5" />
                              <span className="text-slate-700 dark:text-slate-200">{h}</span>
                            </div>
                          ))}
                        </div>

                        <div className="mt-8 space-y-2.5">
                          <Button
                            size="lg"
                            variant={tier.ctaVariant}
                            className="w-full"
                            onClick={onGoToRegister}
                            rightIcon={tier.featured ? <ArrowRight className="w-4 h-4" /> : undefined}
                          >
                            {tier.ctaPrimary}
                          </Button>
                          <p className="text-center text-xs text-slate-500 dark:text-slate-400 pt-1">
                            {tier.key === 'ent'
                              ? 'Typical reply within one business day.'
                              : 'Trial includes full access to all listed features.'}
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
            <div className="max-w-2xl mx-auto text-center space-y-4 mb-10">
              <Badge variant="outline" size="md">
                <FileText className="w-3.5 h-3.5" /> Full comparison
              </Badge>
              <h2 className="text-3xl sm:text-4xl font-black tracking-tight">
                Compare every feature side-by-side.
              </h2>
              <p className="text-base text-slate-600 dark:text-slate-300 leading-relaxed">
                A detailed breakdown across infrastructure, delivery, observability,
                security, and support. Nothing hidden — if it&apos;s listed, you get it.
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200 dark:border-brandObsidian-700 bg-white dark:bg-brandObsidian-800/40 shadow-card overflow-hidden">
              <div className="hidden md:grid grid-cols-12 px-6 py-4 bg-slate-50/70 dark:bg-brandObsidian-900/50 border-b border-slate-200 dark:border-brandObsidian-700 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                <div className="col-span-6">Feature</div>
                <div className="col-span-2 text-center">Developer Cloud</div>
                <div className="col-span-2 text-center text-brandGold-600 dark:text-brandGold-400">Team Operations</div>
                <div className="col-span-2 text-center">Enterprise</div>
              </div>

              <div className="divide-y divide-slate-200 dark:divide-brandObsidian-700">
                {comparisonRows.map((block) => {
                  const BlockIcon = block.icon;
                  return (
                    <div key={block.group}>
                      <div className="md:grid md:grid-cols-12 px-6 py-4 bg-slate-50/40 dark:bg-brandObsidian-900/30 border-y border-slate-200/60 dark:border-brandObsidian-700/60">
                        <div className="col-span-12 md:col-span-12 flex items-center gap-2">
                          <BlockIcon className="w-4.5 h-4.5 text-brandGold-500" />
                          <h3 className="text-sm font-black uppercase tracking-wider text-slate-700 dark:text-slate-200">
                            {block.group}
                          </h3>
                        </div>
                      </div>
                      {block.rows.map((row, rIdx) => (
                        <div
                          key={row.label}
                          className={[
                            'md:grid md:grid-cols-12 items-center px-6 py-4 gap-3 md:gap-0 text-sm',
                            rIdx % 2 === 1 ? 'bg-slate-50/30 dark:bg-brandObsidian-900/20' : '',
                          ].join(' ')}
                        >
                          <div className="md:col-span-6 font-semibold text-slate-800 dark:text-slate-100">
                            {row.label}
                          </div>
                          <div className="md:col-span-2 md:text-center">{formatCell(row.dev)}</div>
                          <div className="md:col-span-2 md:text-center">{formatCell(row.team)}</div>
                          <div className="md:col-span-2 md:text-center">{formatCell(row.ent)}</div>
                        </div>
                      ))}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </section>

        <section className="py-16 sm:py-20 border-t border-slate-200 dark:border-brandObsidian-800 bg-slate-100/60 dark:bg-brandObsidian-900/40">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-10 items-stretch">
              <div className="lg:col-span-5 space-y-5">
                <Badge variant="gold" size="md" dot>
                  <Building2 className="w-3.5 h-3.5" /> Enterprise
                </Badge>
                <h2 className="text-3xl sm:text-4xl font-black tracking-tight leading-tight">
                  Running a regulated or high-scale org? We ship a dedicated control plane.
                </h2>
                <p className="text-base text-slate-600 dark:text-slate-300 leading-relaxed">
                  Enterprise customers get a namespaced or fully-isolated Aravanta
                  distribution with private VPC peering, dedicated SA, 99.99% financial
                  uptime SLA, and signed SOC2 audit report for regulators.
                </p>
                <ul className="space-y-3 text-sm">
                  {[
                    'Dedicated VPC with private endpoints, no public ingress by default',
                    'BYOK (AWS KMS, GCP KMS, HashiCorp Vault) for CMEK encryption',
                    'SAML 2.0 SSO, SCIM 2.0 sync, Okta + Entra ID + Google pre-built',
                    '99.99% financial uptime SLA with service credits',
                    'Named solutions architect + quarterly architecture reviews',
                  ].map((item) => (
                    <li key={item} className="flex items-start gap-2.5">
                      <ShieldCheck className="w-4.5 h-4.5 text-brandGold-500 shrink-0 mt-0.5" />
                      <span className="text-slate-700 dark:text-slate-200">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="lg:col-span-7 flex">
                <Card className="flex-1">
                  <CardBody className="!p-6 sm:!p-8 flex flex-col justify-between h-full gap-6">
                    <div>
                      <div className="flex items-center gap-2">
                        <Users className="w-5 h-5 text-brandGold-500" />
                        <h3 className="text-2xl font-black tracking-tight">
                          Book a 30-minute platform walkthrough.
                        </h3>
                      </div>
                      <p className="mt-2 text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                        Tell us about your workloads, compliance posture, and timelines.
                        We&apos;ll tailor a demo and send a custom proposal within 24 hours.
                      </p>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                      {[
                        { label: 'Typical reply', value: '< 4 hrs', icon: Clock },
                        { label: 'Regions available', value: '4 + private', icon: Globe2 },
                        { label: 'On-prem distro', value: 'BYOK K8s', icon: FileCode },
                        { label: 'Min commitment', value: 'Annual / SLA', icon: Rocket },
                      ].map((s) => {
                        const SIcon = s.icon;
                        return (
                          <div
                            key={s.label}
                            className="rounded-xl border border-slate-200 dark:border-brandObsidian-700 bg-slate-50/60 dark:bg-brandObsidian-900/50 p-3"
                          >
                            <div className="flex items-center gap-1.5 text-[10px] uppercase font-bold tracking-wider text-slate-500 dark:text-slate-400">
                              <SIcon className="w-3 h-3" />
                              {s.label}
                            </div>
                            <div className="mt-1.5 text-sm font-black text-slate-900 dark:text-white">
                              {s.value}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                    <div className="flex flex-col sm:flex-row gap-3">
                      <Button
                        size="lg"
                        variant="primary"
                        onClick={onGoToRegister}
                        rightIcon={<MessageSquare className="w-4 h-4" />}
                        className="flex-1"
                      >
                        Request enterprise proposal
                      </Button>
                      <Button
                        size="lg"
                        variant="outline"
                        onClick={() => onNavigate?.('about')}
                        rightIcon={<ChevronRight className="w-4 h-4" />}
                        className="flex-1"
                      >
                        About the platform team
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
                  <ShieldCheck className="w-3.5 h-3.5" /> Ready to start?
                </Badge>
                <div className="max-w-2xl mx-auto space-y-4">
                  <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight leading-[1.08]">
                    Launch a workspace in under 60 seconds.
                  </h2>
                  <p className="text-base sm:text-lg text-slate-300 leading-relaxed">
                    10-day full-access trial, no credit card. Cancel anytime with one click
                    — nothing to uninstall.
                  </p>
                </div>
                <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 pt-2">
                  <Button
                    size="xl"
                    variant="primary"
                    onClick={onGoToRegister}
                    rightIcon={<ArrowRight className="w-4.5 h-4.5" />}
                  >
                    Create workspace
                  </Button>
                  <Button
                    size="xl"
                    variant="secondary"
                    onClick={() => onNavigate?.('features')}
                    leftIcon={<Server className="w-4 h-4" />}
                  >
                    Compare all features
                  </Button>
                </div>
                <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 pt-2 text-xs sm:text-sm text-slate-400 font-medium">
                  <span className="inline-flex items-center gap-1.5">
                    <Check className="w-4 h-4 text-brandGold-400" /> Per-second billing
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <Check className="w-4 h-4 text-brandGold-400" /> GST invoices supported
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <Check className="w-4 h-4 text-brandGold-400" /> 4 GA regions live
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
