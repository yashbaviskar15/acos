import React, { useState, useMemo, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Search,
  ChevronRight,
  ArrowRight,
  BookOpen,
  FileJson,
  Terminal,
  ExternalLink,
  Check,
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
  ListOrdered,
  Lightbulb,
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
}

const sidebarTree = [
  {
    group: 'Getting started',
    items: [
      { id: 'intro', label: 'Introduction', icon: Rocket },
      { id: 'quickstart', label: 'Quickstart (4 steps)', icon: Zap, active: true },
      { id: 'concepts', label: 'Core concepts', icon: Lightbulb },
    ],
  },
  {
    group: 'Products',
    items: [
      { id: 'compute', label: 'Compute VMs', icon: Server },
      { id: 'k8s', label: 'Managed Kubernetes', icon: Container },
      { id: 'storage', label: 'S3 Object Storage', icon: HardDrive },
      { id: 'database', label: 'Managed Databases', icon: Database },
    ],
  },
  {
    group: 'Platform',
    items: [
      { id: 'monitoring', label: 'Observability', icon: Activity },
      { id: 'security', label: 'RBAC & Security', icon: Shield },
      { id: 'billing', label: 'Billing & FinOps', icon: CreditCard },
    ],
  },
  {
    group: 'Reference',
    items: [
      { id: 'cli', label: 'CLI (agy)', icon: Terminal },
      { id: 'terraform', label: 'Terraform provider', icon: Cpu },
      { id: 'sdk', label: 'SDKs', icon: FileCode },
      { id: 'openapi', label: 'OpenAPI / REST', icon: FileJson, external: true },
    ],
  },
];

const numberedSteps = [
  {
    step: 1,
    title: 'Create a workspace and project',
    body: 'Workspaces are the top-level container for billing and RBAC. Projects group related resources (VMs, K8s clusters, buckets) for cost attribution and access scoping. Every API call targets a single project.',
    tip: 'Use naming convention: {company}-{env}-{team}. Ex: acme-prod-billing.',
    code: `# List accessible workspaces for your user
agy workspaces list

# Switch active workspace
agy workspace switch acme-corp

# Create a new project scoped to the workspace
agy projects create \\
  --name acme-prod-billing \\
  --region ap-south-1 \\
  --description "Billing team production"`,
  },
  {
    step: 2,
    title: 'Upload an SSH key for compute access',
    body: 'Compute instances are reached exclusively via SSH key pairs; password auth is disabled on all stock images. Upload your public key once and reference it by name across all instance launches.',
    tip: 'Generate a dedicated ed25519 key for Aravanta resources.',
    code: `# Generate a dedicated SSH key pair
ssh-keygen -t ed25519 -C "deploy@acme" -f ~/.ssh/id_ed25519.aravanta

# Upload the public key to your workspace
agy compute ssh-keys upload \\
  --name acme-deploy-key \\
  --public-key ~/.ssh/id_ed25519.aravanta.pub

# Verify it's available
agy compute ssh-keys list --format json | jq .keys[].name`,
  },
  {
    step: 3,
    title: 'Launch a managed Kubernetes cluster',
    body: 'Provision a 3-node cluster with default CNI networking, HPA, and a private image registry. Cluster control plane is fully managed — etcd, API server, and controller manager are multi-AZ by default.',
    tip: 'Start with 3 nodes, 2 availability zones, and HPA enabled.',
    code: `# Create EKS-compatible cluster in Mumbai region
agy k8s clusters create \\
  --name prod-primary \\
  --version 1.30 \\
  --region ap-south-1 \\
  --node-count 3 \\
  --node-shape k3.medium \\
  --zones ap-south-1a,ap-south-1b \\
  --enable-hpa \\
  --enable-private-registry

# Wait for cluster Ready state
agy k8s clusters wait prod-primary --for ready

# Download kubeconfig to merge into ~/.kube/config
agy k8s clusters kubeconfig prod-primary --merge`,
  },
  {
    step: 4,
    title: 'Deploy a workload with GitOps (ArvCD)',
    body: 'Push a Kustomize/Helm manifest to a git repo, register it as an ArvCD Application, and the control plane reconciles it every 30s. Canary strategies are supported via progressive delivery flags.',
    tip: 'Enable SLO-gated rollouts on any app that serves user traffic.',
    code: `# Register a git repo as an ArvCD source
agy cd sources add git \\
  --name acme-apps \\
  --url ssh://git@github.com/acme/deploy.git \\
  --branch main \\
  --private-key ~/.ssh/id_ed25519.deploy

# Create an application pointed at a path
agy cd apps create \\
  --name api-gateway \\
  --source acme-apps \\
  --path services/api/kustomize/overlays/prod \\
  --cluster prod-primary \\
  --namespace default \\
  --strategy canary \\
  --slo-gate latency:200ms

# Force an immediate reconciliation
agy cd apps sync api-gateway --watch`,
  },
  {
    step: 5,
    title: 'Configure alerting & PagerDuty routing',
    body: 'Every workspace ships a Prometheus-compatible Alertmanager. Route firing alerts to Slack, email, PagerDuty, or generic webhooks. Silence rules during deploys are auto-created.',
    tip: 'Route severity=critical alerts to PagerDuty only.',
    code: `# Create a PagerDuty routing key
agy alerting integrations create pagerduty \\
  --name pagerduty-prod \\
  --routing-key \$PD_ROUTING_KEY

# Route severity=critical alerts to PagerDuty
agy alerting routes create \\
  --name "Critical pages" \\
  --match severity=critical \\
  --match team=billing \\
  --integration pagerduty-prod

# Silences auto-expire; set 2h for deploy windows
agy alerting silences create \\
  --reason "v2.4.2 canary deploy" \\
  --duration 2h \\
  --matchers "app=api-gateway"`,
  },
];

export const DocumentationPage: React.FC<PageProps> = ({
  onGoToLogin,
  onGoToRegister,
  onOpenCommandPalette,
  onNavigate,
}) => {
  const [query, setQuery] = useState('');
  const [activeGroup, setActiveGroup] = useState<string>('intro');
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Global '/' hotkey to focus search bar
  useEffect(() => {
    const handleSlashKey = (e: KeyboardEvent) => {
      if (
        e.key === '/' &&
        !(e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement)
      ) {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handleSlashKey);
    return () => window.removeEventListener('keydown', handleSlashKey);
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

  // Real-time documentation match suggestions
  const searchMatches = useMemo(() => {
    if (!query.trim()) return [];
    const q = query.trim().toLowerCase();
    const results: { title: string; subtitle: string; targetId: string; type: string }[] = [];

    // Check numbered guide steps
    numberedSteps.forEach((s, idx) => {
      if (
        s.title.toLowerCase().includes(q) ||
        s.body.toLowerCase().includes(q) ||
        s.code.toLowerCase().includes(q)
      ) {
        results.push({
          title: `Step ${s.step}: ${s.title}`,
          subtitle: s.body.slice(0, 75) + '...',
          targetId: `step-${idx}`,
          type: 'Guide',
        });
      }
    });

    // Check sidebar navigation topics
    sidebarTree.forEach((group) => {
      group.items.forEach((item) => {
        if (item.label.toLowerCase().includes(q) || item.id.toLowerCase().includes(q)) {
          results.push({
            title: item.label,
            subtitle: group.group,
            targetId: item.id === 'quickstart' ? 'getting-started' : item.id,
            type: 'Topic',
          });
        }
      });
    });

    return results.slice(0, 5);
  }, [query]);

  const handleSelectSearchMatch = (targetId: string) => {
    const el = document.getElementById(targetId);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const handlePopularClick = (term: string) => {
    setQuery(term);
    if (term.includes('compute') || term.includes('keys')) {
      document.getElementById('step-1')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } else if (term.includes('Kubernetes') || term.includes('HPA')) {
      document.getElementById('step-2')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } else if (term.includes('Terraform')) {
      document.getElementById('getting-started')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } else if (term.includes('SLO') || term.includes('alerting')) {
      document.getElementById('step-4')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-brandObsidian-950 font-sans antialiased text-slate-900 dark:text-slate-100">
      <Navbar
        onGoToLogin={onGoToLogin}
        onGoToRegister={onGoToRegister}
        onOpenCommandPalette={onOpenCommandPalette}
        onNavigate={onNavigate}
        currentView="documentation"
      />

      <main>
        <section className="relative pt-16 pb-12 border-b border-slate-200 dark:border-brandObsidian-800 overflow-hidden">
          <div aria-hidden className="absolute inset-x-0 top-0 -z-10 h-[420px] bg-hero-radial opacity-70" />
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45 }}
              className="max-w-3xl mx-auto text-center space-y-5"
            >
              <div className="inline-flex items-center gap-2">
                <Badge variant="gold" size="md" dot>
                  <BookOpen className="w-3.5 h-3.5" /> v1.0 GA docs
                </Badge>
              </div>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tighter leading-[1.04]">
                Aravanta CloudOS Documentation
              </h1>
              <p className="text-lg text-slate-600 dark:text-slate-300 leading-relaxed">
                Guides, API references, and tutorials for multi-cloud infrastructure,
                GitOps delivery, and SRE operations.
              </p>

              <div className="max-w-2xl mx-auto pt-3">
                <div className="relative">
                  <Input
                    ref={searchInputRef}
                    size="lg"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder='Search docs: "ssh keys", "cluster create", "slo alerting"...'
                    leftIcon={<Search className="w-5 h-5 text-brandGold-500" />}
                    rightIcon={
                      !query ? (
                        <kbd className="hidden sm:inline-flex items-center justify-center h-6 px-2 rounded-md border border-slate-200 dark:border-brandObsidian-700 text-[11px] font-mono font-semibold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-brandObsidian-800/80">
                          /
                        </kbd>
                      ) : undefined
                    }
                    wrapperClassName="!rounded-2xl !shadow-xl !bg-white dark:!bg-brandObsidian-900 border border-slate-300 dark:border-brandObsidian-700"
                    clearable
                    onClear={() => setQuery('')}
                  />

                  {/* Live Search Quick Results Dropdown */}
                  {searchMatches.length > 0 && (
                    <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-brandObsidian-900 border border-slate-200 dark:border-brandObsidian-700 rounded-2xl shadow-2xl overflow-hidden z-30 p-2 text-left animate-fadeIn">
                      <div className="px-3 py-1.5 text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400">
                        Matching Documentation Topics ({searchMatches.length})
                      </div>
                      <div className="space-y-1">
                        {searchMatches.map((res, i) => (
                          <button
                            key={i}
                            type="button"
                            onClick={() => handleSelectSearchMatch(res.targetId)}
                            className="w-full flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-100 dark:hover:bg-brandObsidian-800 transition-colors text-left group cursor-pointer"
                          >
                            <div className="min-w-0 flex-1">
                              <div className="text-xs font-bold text-slate-900 dark:text-white group-hover:text-brandGold-600 dark:group-hover:text-brandGold-400 transition-colors truncate">
                                {res.title}
                              </div>
                              <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate mt-0.5">
                                {res.subtitle}
                              </div>
                            </div>
                            <span className="shrink-0 text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-100 dark:bg-brandObsidian-800 text-slate-500 font-semibold ml-2">
                              {res.type}
                            </span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex flex-wrap items-center justify-center gap-2 pt-3 text-xs text-slate-500 dark:text-slate-400">
                  <span className="font-semibold uppercase tracking-wider">Popular:</span>
                  {['agy compute create', 'Kubernetes HPA', 'Terraform provider', 'SLO burn rate'].map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => handlePopularClick(t)}
                      className="px-2.5 py-1 rounded-full border border-slate-200 dark:border-brandObsidian-700 hover:border-brandGold-500/50 hover:text-brandGold-600 dark:hover:text-brandGold-400 transition-colors cursor-pointer"
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>

              <div className="pt-3 flex flex-col sm:flex-row items-center justify-center gap-3">
                <Button
                  size="lg"
                  variant="primary"
                  rightIcon={<ArrowRight className="w-4 h-4" />}
                  onClick={() => document.getElementById('getting-started')?.scrollIntoView({ behavior: 'smooth' })}
                >
                  Start quickstart
                </Button>
                <a
                  href="https://arv-backend.vercel.app/docs"
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex"
                >
                  <Button
                    size="lg"
                    variant="outline"
                    leftIcon={<FileJson className="w-4 h-4" />}
                    rightIcon={<ExternalLink className="w-3.5 h-3.5" />}
                  >
                    Open Swagger API
                  </Button>
                </a>
              </div>
            </motion.div>
          </div>
        </section>

        <section className="py-10 sm:py-14">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10">
              <aside className="lg:col-span-3 hidden lg:block">
                <div className="lg:sticky lg:top-24 space-y-6">
                  <div>
                    <div className="text-[11px] uppercase font-bold tracking-wider text-slate-500 dark:text-slate-400 mb-2.5 px-2">
                      Table of contents
                    </div>
                    <nav className="space-y-5 max-h-[70vh] overflow-y-auto pr-2">
                      {filteredSidebar.map((group) => (
                        <div key={group.group}>
                          <div className="px-2 text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-1.5">
                            {group.group}
                          </div>
                          <ul className="space-y-0.5">
                            {group.items.map((item) => {
                              const Icon = item.icon;
                              const isActive = ('active' in item && (item as any).active) || activeGroup === item.id;
                              return (
                                <li key={item.id}>
                                  <button
                                    onClick={() => {
                                      setActiveGroup(item.id);
                                      document
                                        .getElementById(item.id === 'quickstart' ? 'getting-started' : item.id)
                                        ?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                                    }}
                                    className={[
                                      'w-full flex items-center gap-2 px-2.5 py-2 rounded-lg text-sm transition-colors text-left',
                                      isActive
                                        ? 'bg-brandGold-500/10 text-brandGold-600 dark:text-brandGold-400 font-semibold'
                                        : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-brandObsidian-800/70',
                                    ].join(' ')}
                                  >
                                    <Icon className="w-4 h-4 shrink-0" />
                                    <span className="truncate flex-1">{item.label}</span>
                                    {'external' in item && (item as any).external && (
                                      <ExternalLink className="w-3.5 h-3.5 opacity-60" />
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

                  <Card>
                    <CardBody className="!p-5 space-y-3">
                      <div className="flex items-center gap-2">
                        <FolderTree className="w-4.5 h-4.5 text-brandGold-500" />
                        <h3 className="text-sm font-black">On this page</h3>
                      </div>
                      <ol className="space-y-1.5 text-sm text-slate-600 dark:text-slate-300">
                        {[
                          'Getting started guide',
                          'Create workspace & project',
                          'Upload SSH key',
                          'Launch Kubernetes cluster',
                          'Deploy workload via ArvCD',
                          'Configure alert routing',
                        ].map((t, i) => (
                          <li key={t}>
                            <a
                              href={`#step-${i}`}
                              className="flex items-start gap-2 py-1 hover:text-brandGold-600 dark:hover:text-brandGold-400 transition-colors"
                            >
                              <span className="text-[11px] font-mono font-bold text-slate-400 dark:text-slate-500 tabular-nums w-4 shrink-0">
                                {i + 1}.
                              </span>
                              <span>{t}</span>
                            </a>
                          </li>
                        ))}
                      </ol>
                    </CardBody>
                  </Card>
                </div>
              </aside>

              <article id="getting-started" className="lg:col-span-9 space-y-10">
                <div className="space-y-4">
                  <Badge variant="gold" size="md">
                    <Rocket className="w-3.5 h-3.5" /> Getting started guide
                  </Badge>
                  <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight leading-[1.06]">
                    Launch a production Kubernetes cluster and deploy your first workload.
                  </h2>
                  <p className="text-lg text-slate-600 dark:text-slate-300 leading-relaxed max-w-3xl">
                    This 5-step guide walks you through every primitive you need to
                    operate workloads on Aravanta: workspaces, SSH keys, managed
                    Kubernetes, GitOps delivery via ArvCD, and Alertmanager routing.
                    Estimated completion time: <strong>10 minutes</strong>.
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-3">
                    {[
                      { label: 'Prerequisites', body: 'API key + installed agy CLI', icon: Check },
                      { label: 'Time', body: '~10 minutes', icon: Zap },
                      { label: 'Cost', body: 'Free trial quota covered', icon: CreditCard },
                    ].map((x) => {
                      const Icon = x.icon;
                      return (
                        <Card key={x.label}>
                          <CardBody className="!p-4 flex items-start gap-3">
                            <div className="w-9 h-9 rounded-lg bg-brandGold-500/10 text-brandGold-500 flex items-center justify-center shrink-0">
                              <Icon className="w-4.5 h-4.5" />
                            </div>
                            <div>
                              <div className="text-[11px] uppercase font-bold tracking-wider text-slate-500 dark:text-slate-400">
                                {x.label}
                              </div>
                              <div className="text-sm font-semibold mt-0.5">{x.body}</div>
                            </div>
                          </CardBody>
                        </Card>
                      );
                    })}
                  </div>
                </div>

                <div className="space-y-10">
                  {numberedSteps.map((s, i) => (
                    <motion.section
                      key={s.step}
                      id={`step-${i}`}
                      initial={{ opacity: 0, y: 14 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true, margin: '-80px' }}
                      transition={{ duration: 0.4 }}
                      className="relative scroll-mt-24"
                    >
                      <div className="flex items-start gap-4 sm:gap-6">
                        <div className="shrink-0">
                          <div className="w-12 h-12 rounded-2xl bg-brandGold-500 text-white font-black text-xl flex items-center justify-center shadow-md shadow-brandGold-500/25">
                            <ListOrdered className="w-6 h-6" style={{ display: 'none' }} />
                            {s.step}
                          </div>
                        </div>
                        <div className="min-w-0 flex-1 space-y-4">
                          <div>
                            <div className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                              Step {s.step} of {numberedSteps.length}
                            </div>
                            <h3 className="mt-1.5 text-2xl sm:text-3xl font-black tracking-tight">
                              {s.title}
                            </h3>
                          </div>
                          <p className="text-base text-slate-600 dark:text-slate-300 leading-relaxed">
                            {s.body}
                          </p>
                          <div className="flex items-start gap-3 rounded-xl border border-brandGold-500/30 bg-brandGold-500/5 p-4">
                            <Lightbulb className="w-4.5 h-4.5 text-brandGold-500 shrink-0 mt-0.5" />
                            <p className="text-sm text-brandGold-700 dark:text-brandGold-300 leading-relaxed">
                              <strong className="font-bold">Pro tip:</strong> {s.tip}
                            </p>
                          </div>
                          <CodeBlock code={s.code} language={`bash`} />
                        </div>
                      </div>
                    </motion.section>
                  ))}
                </div>

                <div className="mt-14 grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Card hover>
                    <CardBody className="!p-6 space-y-3">
                      <div className="w-11 h-11 rounded-xl bg-sky-500/10 text-sky-500 flex items-center justify-center">
                        <Terminal className="w-5.5 h-5.5" />
                      </div>
                      <h3 className="text-xl font-black tracking-tight">CLI Command Reference</h3>
                      <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                        Every `agy` subcommand, flag, and output format. Searchable, with
                        interactive examples.
                      </p>
                      <Button
                        variant="ghost"
                        onClick={() => onNavigate?.('developers')}
                        rightIcon={<ChevronRight className="w-4 h-4" />}
                        className="-ml-3"
                      >
                        Browse CLI reference
                      </Button>
                    </CardBody>
                  </Card>
                  <Card hover>
                    <CardBody className="!p-6 space-y-3">
                      <div className="w-11 h-11 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
                        <FileJson className="w-5.5 h-5.5" />
                      </div>
                      <h3 className="text-xl font-black tracking-tight">REST API — OpenAPI 3.1</h3>
                      <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                        Human-readable Swagger UI with request/response examples and
                        per-endpoint error codes. Download the JSON spec for codegen.
                      </p>
                      <a
                        href="https://arv-backend.vercel.app/docs"
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex -ml-3"
                      >
                        <Button
                          variant="ghost"
                          rightIcon={<ExternalLink className="w-3.5 h-3.5" />}
                        >
                          Open Swagger UI
                        </Button>
                      </a>
                    </CardBody>
                  </Card>
                </div>

                <div className="pt-4">
                  <div className="relative overflow-hidden rounded-3xl bg-brandObsidian-950 text-white shadow-2xl">
                    <div
                      aria-hidden
                      className="pointer-events-none absolute inset-0 opacity-[0.2]"
                      style={{
                        background:
                          'radial-gradient(85% 85% at 50% -10%, rgba(198,146,59,0.55) 0%, rgba(198,146,59,0) 60%)',
                      }}
                    />
                    <div className="relative p-8 sm:p-12 text-center space-y-5">
                      <Badge variant="gold" size="md" dot>
                        <Check className="w-3.5 h-3.5" /> 5-step guide complete
                      </Badge>
                      <h2 className="text-3xl sm:text-4xl font-black tracking-tight leading-tight max-w-2xl mx-auto">
                        Now deploy your first workload with a live API key.
                      </h2>
                      <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-1">
                        <Button
                          size="xl"
                          variant="primary"
                          onClick={onGoToRegister}
                          rightIcon={<ArrowRight className="w-4.5 h-4.5" />}
                        >
                          Get free API key
                        </Button>
                        <Button
                          size="xl"
                          variant="secondary"
                          onClick={() => onNavigate?.('developers')}
                          leftIcon={<Terminal className="w-4 h-4" />}
                        >
                          Browse developer docs
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </article>
            </div>
          </div>
        </section>
      </main>

      <Footer onNavigate={onNavigate} />
    </div>
  );
};
