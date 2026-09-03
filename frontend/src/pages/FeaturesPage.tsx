import React from 'react';
import { motion } from 'framer-motion';
import {
  Server,
  Container,
  HardDrive,
  Database,
  Activity,
  Shield,
  CreditCard,
  Check,
  ArrowRight,
  ChevronRight,
  Zap,
  Network,
  FileText,
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

const productLines = [
  {
    key: 'compute',
    icon: Server,
    title: 'Compute',
    subtitle: 'Elastic virtual machines and bare metal',
    tone: 'gold',
    features: [
      { name: 'AMD EPYC / ARM Neoverse instances', detail: '80+ instance shapes from shared to 224 vCPU' },
      { name: 'Live vertical resize', detail: 'Resize CPU/RAM without detaching volumes' },
      { name: 'NVMe block storage attachment', detail: 'Sub-ms latency local scratch disks' },
      { name: 'Spot & preemptible pools', detail: 'Save up to 72% with graceful 60s shutdown hooks' },
      { name: 'Custom images & snapshots', detail: 'Import RAW/QCOW2, replicate across regions' },
      { name: 'Placement groups', detail: 'Cluster or spread policies for HPC & HA' },
    ],
  },
  {
    key: 'k8s',
    icon: Container,
    title: 'Managed Kubernetes',
    subtitle: 'Production EKS/GKE-equivalent clusters',
    tone: 'emerald',
    features: [
      { name: 'Automated control plane HA', detail: '3-node etcd, self-healing control plane' },
      { name: 'HPA + VPA + Cluster Autoscaler', detail: 'Event-driven, KEDA-compatible' },
      { name: 'CNI networking + NetworkPolicy', detail: 'Calico eBPF dataplane by default' },
      { name: 'Private OCI image registry', detail: 'Vulnerability scanning on push' },
      { name: 'Node auto-draining & cordoning', detail: 'Rolling OS patches zero downtime' },
      { name: 'GitOps controller (ArvCD)', detail: 'Flux-compatible, multi-tenant' },
    ],
  },
  {
    key: 'storage',
    icon: HardDrive,
    title: 'Storage',
    subtitle: 'S3 object storage + persistent volumes',
    tone: 'sky',
    features: [
      { name: 'S3-compatible buckets', detail: 'AWS SDKs, boto3, s5cmd work out-of-box' },
      { name: 'Lifecycle tiering + versioning', detail: 'Infrequent-access and archival tiers' },
      { name: 'Object lock / WORM retention', detail: 'Compliance mode for regulated industries' },
      { name: 'Signed URLs + bucket policies', detail: 'Role-based pre-signed uploads' },
      { name: 'PersistentVolumeClasses', detail: 'io1/gp2/st1 classes for K8s' },
      { name: 'Cross-region replication', detail: 'Active-passive RPO < 15 min' },
    ],
  },
  {
    key: 'database',
    icon: Database,
    title: 'Managed Databases',
    subtitle: 'Postgres, MySQL, Redis, MongoDB',
    tone: 'violet',
    features: [
      { name: 'PostgreSQL 16 with pgvector', detail: 'Logical replication, pg_stat_statements' },
      { name: 'Read replicas & automated failover', detail: 'Patroni-driven, RPO < 1s' },
      { name: 'WAL continuous archiving', detail: 'Point-in-time restore to any second' },
      { name: 'Redis cluster + Sentinel', detail: 'Persistence options: AOF/RDB/hybrid' },
      { name: 'MySQL 8 with Group Replication', detail: 'Single-primary mode, GTID-based' },
      { name: 'Connection pooling', detail: 'Pgbouncer built-in with TLS 1.3' },
    ],
  },
  {
    key: 'sre',
    icon: Activity,
    title: 'SRE & Observability',
    subtitle: 'Metrics, logs, traces, SLOs',
    tone: 'gold',
    features: [
      { name: 'Prometheus-compatible TSDB', detail: 'Thanos-style long-term, global query' },
      { name: 'Loki-structured log explorer', detail: 'Live tail, saved views, shared URLs' },
      { name: 'OpenTelemetry traces', detail: 'Service graph, trace search by attribute' },
      { name: 'SLO burn-rate dashboards', detail: 'Multi-window, multi-burn alerting' },
      { name: 'Incident war rooms', detail: '4-stage lifecycle + RCA templates' },
      { name: 'Automated runbooks', detail: 'Parameterized, approval-gated actions' },
    ],
  },
  {
    key: 'security',
    icon: Shield,
    title: 'Security & Governance',
    subtitle: 'Zero-trust RBAC + audit + secrets',
    tone: 'rose',
    features: [
      { name: '4-tier RBAC matrix', detail: 'SuperAdmin / Admin / Operator / Viewer' },
      { name: 'TOTP MFA + passkey support', detail: 'RFC 6238 compliant, WebAuthn (FIDO2)' },
      { name: 'SCIM 2.0 directory sync', detail: 'Okta, Entra ID, Google Workspace' },
      { name: 'Secret manager', detail: 'Automatic rotation, CMEK support' },
      { name: 'WAF edge rules', detail: 'Managed OWASP ruleset + custom rules' },
      { name: 'Immutable audit trail', detail: '365-day log, signed, exportable CSV' },
    ],
  },
  {
    key: 'billing',
    icon: CreditCard,
    title: 'Billing & FinOps',
    subtitle: 'Per-second pricing, cost insights',
    tone: 'violet',
    features: [
      { name: 'Per-second metering', detail: 'Hourly minimums, no rounding tricks' },
      { name: 'Cost explorer + breakdowns', detail: 'Group by project, region, tag' },
      { name: 'Budget alerts & quotas', detail: 'Slack/email/webhook notifications' },
      { name: 'Resource tagging policies', detail: 'Require tags for cost attribution' },
      { name: 'Commitment discounts', detail: '1yr / 3yr CUDs, 30-55% off list' },
      { name: 'Invoice & tax documents', detail: 'GSTIN-supported, PDF export' },
    ],
  },
  {
    key: 'integrations',
    icon: Network,
    title: 'Integrations & Ecosystem',
    subtitle: 'Terraform, SDKs, CI/CD, APIs',
    tone: 'emerald',
    features: [
      { name: 'Official Terraform provider', detail: '180+ resources, drift detection' },
      { name: 'Typed SDKs (Node, Python, Go)', detail: 'Pagination helpers, retries' },
      { name: 'Swagger / OpenAPI 3.1 spec', detail: 'Exported from server code' },
      { name: 'GitHub Actions runner', detail: 'Self-hosted arm64/amd64' },
      { name: 'Slack / PagerDuty / Webhook', detail: 'Alert routing with deduplication' },
      { name: 'Grafana datasource plugin', detail: 'Native Prometheus-compatible' },
    ],
  },
];

const toneMap: Record<string, string> = {
  gold: 'from-brandGold-500/20 via-brandGold-500/5 to-transparent border-brandGold-500/30 text-brandGold-600 dark:text-brandGold-400',
  emerald: 'from-emerald-500/20 via-emerald-500/5 to-transparent border-emerald-500/30 text-emerald-600 dark:text-emerald-400',
  sky: 'from-sky-500/20 via-sky-500/5 to-transparent border-sky-500/30 text-sky-600 dark:text-sky-400',
  violet: 'from-violet-500/20 via-violet-500/5 to-transparent border-violet-500/30 text-violet-600 dark:text-violet-400',
  rose: 'from-rose-500/20 via-rose-500/5 to-transparent border-rose-500/30 text-rose-600 dark:text-rose-400',
};

const iconTone: Record<string, string> = {
  gold: 'bg-brandGold-500/10 text-brandGold-500 dark:text-brandGold-400 group-hover:bg-brandGold-500 group-hover:text-white',
  emerald: 'bg-emerald-500/10 text-emerald-500 dark:text-emerald-400 group-hover:bg-emerald-500 group-hover:text-white',
  sky: 'bg-sky-500/10 text-sky-500 dark:text-sky-400 group-hover:bg-sky-500 group-hover:text-white',
  violet: 'bg-violet-500/10 text-violet-500 dark:text-violet-400 group-hover:bg-violet-500 group-hover:text-white',
  rose: 'bg-rose-500/10 text-rose-500 dark:text-rose-400 group-hover:bg-rose-500 group-hover:text-white',
};

export const FeaturesPage: React.FC<PageProps> = ({
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
        currentView="features"
      />

      <main>
        <section className="relative pt-16 pb-20 overflow-hidden">
          <div aria-hidden className="absolute inset-x-0 top-0 -z-10 h-[500px] bg-hero-radial opacity-80" />
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
              className="max-w-3xl mx-auto text-center space-y-5"
            >
              <Badge variant="gold" size="md" dot>
                Product
              </Badge>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tighter leading-[1.03]">
                The complete feature matrix for Aravanta CloudOS.
              </h1>
              <p className="text-lg text-slate-600 dark:text-slate-300 leading-relaxed">
                A deep dive across every product line, from VMs and Kubernetes to SRE and
                governance. Every primitive ships with production-grade defaults,
                audit-logged APIs, and Terraform support.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
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
                  variant="outline"
                  onClick={() => onNavigate?.('pricing')}
                  rightIcon={<ChevronRight className="w-4 h-4" />}
                >
                  Compare pricing tiers
                </Button>
              </div>
            </motion.div>
          </div>
        </section>

        <section className="py-16 sm:py-20 border-t border-slate-200 dark:border-brandObsidian-800">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16 sm:space-y-24">
            {productLines.map((line, idx) => {
              const Icon = line.icon;
              return (
                <motion.article
                  key={line.key}
                  initial={{ opacity: 0, y: 16 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: '-80px' }}
                  transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1], delay: 0.04 * idx }}
                  className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12"
                >
                  <div className="lg:col-span-5 space-y-5 lg:sticky lg:top-24 self-start">
                    <div
                      className={[
                        'inline-flex p-4 rounded-2xl border bg-gradient-to-br',
                        toneMap[line.tone],
                      ].join(' ')}
                    >
                      <Icon className="w-7 h-7" />
                    </div>
                    <div className="space-y-2">
                      <h2 className="text-3xl sm:text-4xl font-black tracking-tight">
                        {line.title}
                      </h2>
                      <p className="text-lg text-slate-600 dark:text-slate-300 leading-relaxed">
                        {line.subtitle}
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2 pt-1">
                      {line.features.slice(0, 3).map((f) => (
                        <Badge key={f.name} variant="outline" size="md">
                          {f.name}
                        </Badge>
                      ))}
                    </div>
                    <div className="pt-3">
                      <Button
                        variant="ghost"
                        size="lg"
                        onClick={onGoToRegister}
                        rightIcon={<ChevronRight className="w-4 h-4" />}
                      >
                        Try {line.title} free
                      </Button>
                    </div>
                  </div>

                  <div className="lg:col-span-7">
                    <Card>
                      <CardBody className="!p-0">
                        <ul className="divide-y divide-slate-200 dark:divide-brandObsidian-700">
                          {line.features.map((f) => (
                            <li key={f.name} className="p-5 sm:p-6 flex items-start gap-4 group">
                              <span
                                className={[
                                  'mt-0.5 w-9 h-9 rounded-lg flex items-center justify-center shrink-0 transition-colors duration-300',
                                  iconTone[line.tone],
                                ].join(' ')}
                              >
                                <Check className="w-4.5 h-4.5" />
                              </span>
                              <div className="min-w-0 flex-1">
                                <div className="text-base font-bold text-slate-900 dark:text-white">
                                  {f.name}
                                </div>
                                <div className="mt-1 text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                                  {f.detail}
                                </div>
                              </div>
                            </li>
                          ))}
                        </ul>
                      </CardBody>
                    </Card>
                  </div>
                </motion.article>
              );
            })}
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
                  <Zap className="w-3.5 h-3.5" /> No credit card required
                </Badge>
                <div className="max-w-2xl mx-auto space-y-4">
                  <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight leading-[1.08]">
                    Explore every feature inside a live workspace.
                  </h2>
                  <p className="text-base sm:text-lg text-slate-300 leading-relaxed">
                    10-day full-access trial. Tear up VMs, deploy canary releases, and
                    trigger incident war rooms — then delete everything when done.
                  </p>
                </div>
                <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 pt-2">
                  <Button
                    size="xl"
                    variant="primary"
                    onClick={onGoToRegister}
                    rightIcon={<ArrowRight className="w-4.5 h-4.5" />}
                  >
                    Start free trial
                  </Button>
                  <Button
                    size="xl"
                    variant="secondary"
                    onClick={() => onNavigate?.('documentation')}
                    leftIcon={<FileText className="w-4 h-4" />}
                  >
                    Read the docs
                  </Button>
                </div>
                <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 pt-2 text-xs sm:text-sm text-slate-400 font-medium">
                  <span className="inline-flex items-center gap-1.5">
                    <Check className="w-4 h-4 text-brandGold-400" /> 80+ instance shapes
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <Check className="w-4 h-4 text-brandGold-400" /> 4 regions
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <Check className="w-4 h-4 text-brandGold-400" /> Cancel anytime
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
