import React from 'react';
import { motion } from 'framer-motion';
import {
  ArrowRight,
  ChevronRight,
  Terminal,
  BookOpen,
  FileCode,
  Github,
  ExternalLink,
  Check,
  Boxes,
  Network,
  Sparkles,
  Code2,
  ListTree,
  Zap,
} from 'lucide-react';

import { Navbar, LandingView } from '../components/ui/Navbar';
import { Footer } from '../components/ui/Footer';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Card, CardBody } from '../components/ui/Card';
import { TabContainer, TabList, Tab, TabPanel } from '../components/ui/Tabs';
import { CodeBlock } from '../components/ui/CopyButton';
import { SearchInput } from '../components/ui/Input';

interface PageProps {
  onGoToLogin: () => void;
  onGoToRegister: () => void;
  onOpenCommandPalette?: () => void;
  onNavigate?: (view: LandingView) => void;
}

const quickstartSteps = [
  {
    step: '01',
    title: 'Create an API key',
    body: 'From IAM Credentials in your workspace, create a scoped key with the "compute:write", "storage:readwrite", and "k8s:admin" roles. Store securely in env or a secret manager.',
    tip: 'Keys are scoped per project and never shown again after creation.',
  },
  {
    step: '02',
    title: 'Install the CLI',
    body: 'Install the agy binary via Homebrew, npm, bash installer, or direct download. Tab-completion scripts ship for bash, zsh, fish, and PowerShell.',
    tip: 'Run `agy completion zsh > ~/.zsh/completion/_agy` for shell completion.',
  },
  {
    step: '03',
    title: 'Authenticate & set defaults',
    body: 'Run `agy auth login` to paste your API key and set a default project/region. Config lives at `~/.config/aravanta/config.toml`.',
    tip: 'Use `--profile <name>` to juggle multiple workspaces.',
  },
  {
    step: '04',
    title: 'Provision your first resource',
    body: 'Launch a c3.small instance with the CLI in one command. Instance is reachable via SSH in ~45s with the SSH key attached.',
    tip: 'Delete with `agy compute delete <id>` to stop billing.',
  },
];

const sdkLanguages = [
  { name: 'TypeScript / Node', status: 'GA', pkg: '@aravanta/sdk', tone: 'gold' },
  { name: 'Python 3.10+', status: 'GA', pkg: 'aravanta-sdk', tone: 'emerald' },
  { name: 'Go 1.22+', status: 'GA', pkg: 'github.com/aravanta/go-sdk', tone: 'sky' },
  { name: 'Java / Kotlin', status: 'Beta', pkg: 'cloud.aravanta:aravanta-sdk', tone: 'violet' },
  { name: 'Ruby', status: 'Roadmap', pkg: 'aravanta (gem)', tone: 'rose' },
  { name: 'Rust', status: 'Roadmap', pkg: 'aravanta-sdk (crate)', tone: 'outline' },
];

const toneBadge: Record<string, any> = {
  gold: 'gold',
  emerald: 'success',
  sky: 'info',
  violet: 'info',
  rose: 'warning',
  outline: 'outline',
};

export const DevelopersPage: React.FC<PageProps> = ({
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
        currentView="developers"
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
                <Sparkles className="w-3.5 h-3.5" /> Developer platform
              </Badge>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tighter leading-[1.03]">
                Ship infrastructure with code, not consoles.
              </h1>
              <p className="text-lg text-slate-600 dark:text-slate-300 leading-relaxed">
                First-class CLI, Terraform provider, typed SDKs, and an OpenAPI 3.1 spec
                exported from the same server code that powers the console. Everything is
                scriptable, idempotent, and auditable.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
                <Button
                  size="xl"
                  variant="primary"
                  onClick={() => onNavigate?.('documentation')}
                  rightIcon={<BookOpen className="w-4.5 h-4.5" />}
                >
                  Read getting started
                </Button>
                <Button
                  size="xl"
                  variant="outline"
                  onClick={onGoToRegister}
                  rightIcon={<ChevronRight className="w-4 h-4" />}
                >
                  Create free API key
                </Button>
              </div>
            </motion.div>
          </div>
        </section>

        <section className="py-16 sm:py-20 border-t border-slate-200 dark:border-brandObsidian-800 bg-slate-100/60 dark:bg-brandObsidian-900/40">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-16 items-start">
              <div className="lg:col-span-5 space-y-5 lg:sticky lg:top-24">
                <Badge variant="outline" size="md">
                  Quickstart — 4 steps
                </Badge>
                <h2 className="text-3xl sm:text-4xl font-black tracking-tight leading-tight">
                  Go from zero → provisioned VM in under two minutes.
                </h2>
                <p className="text-base text-slate-600 dark:text-slate-300 leading-relaxed">
                  The agy CLI walks you through auth, then you can provision VMs, K8s
                  clusters, storage buckets, and DB replicas with one-liners.
                </p>
                <div className="space-y-3 pt-2">
                  {[
                    'Auto-retry with exponential backoff on transient errors',
                    'Structured JSON output for piping to jq',
                    'Idempotent commands with --if-exists skip/replace flags',
                  ].map((x) => (
                    <div key={x} className="flex items-start gap-2.5">
                      <span className="mt-1 w-5 h-5 rounded-full bg-brandGold-500/10 text-brandGold-500 flex items-center justify-center shrink-0">
                        <Check className="w-3 h-3" />
                      </span>
                      <span className="text-sm text-slate-700 dark:text-slate-200">{x}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="lg:col-span-7 space-y-4">
                {quickstartSteps.map((s, i) => (
                  <motion.div
                    key={s.step}
                    initial={{ opacity: 0, y: 12 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.4, delay: 0.05 * i }}
                  >
                    <Card className="group hover:border-brandGold-500/40 transition-colors">
                      <CardBody className="!p-5 sm:!p-6 grid grid-cols-1 sm:grid-cols-12 gap-4 sm:gap-6">
                        <div className="sm:col-span-2 flex sm:block items-center gap-3">
                          <div className="w-12 h-12 rounded-xl bg-brandGold-500/10 text-brandGold-600 dark:text-brandGold-400 font-black flex items-center justify-center shrink-0 group-hover:bg-brandGold-500 group-hover:text-white transition-colors">
                            {s.step}
                          </div>
                        </div>
                        <div className="sm:col-span-10 space-y-2">
                          <h3 className="text-lg font-black tracking-tight">{s.title}</h3>
                          <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">{s.body}</p>
                          <p className="text-xs text-brandGold-600 dark:text-brandGold-400 font-medium pt-0.5">
                            💡 {s.tip}
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

        <section className="py-16 sm:py-20 border-t border-slate-200 dark:border-brandObsidian-800">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-2xl mx-auto space-y-3 mb-10">
              <Badge variant="gold" size="md">
                Reference
              </Badge>
              <h2 className="text-3xl sm:text-4xl font-black tracking-tight">
                Pick the surface that fits your stack.
              </h2>
              <p className="text-base text-slate-600 dark:text-slate-300 leading-relaxed">
                All APIs accept the same request shapes and return the same resource
                objects; switching surfaces never requires re-learning the domain.
              </p>
            </div>
            <TabContainer defaultValue="cli">
              <div className="flex justify-center mb-5 overflow-x-auto">
                <TabList>
                  <Tab value="cli" leftIcon={<Terminal className="w-4 h-4" />}>
                    CLI
                  </Tab>
                  <Tab value="sdk" leftIcon={<Code2 className="w-4 h-4" />}>
                    SDK
                  </Tab>
                  <Tab value="terraform" leftIcon={<Boxes className="w-4 h-4" />}>
                    Terraform
                  </Tab>
                  <Tab value="rest" leftIcon={<Network className="w-4 h-4" />}>
                    REST API
                  </Tab>
                </TabList>
              </div>

              <TabPanel value="cli">
                <CodeBlock
                  language="bash"
                  code={`# 1. Install (linux/mac)
curl -fsSL https://cli.aravanta.cloud/install.sh | bash

# 2. Authenticate (pastes key from clipboard)
agy auth login --interactive

# 3. Set project + default region
agy config set project proj_3fa61b
agy config set region  ap-south-1

# 4. List instance shapes available in region
agy compute shapes list --region ap-south-1

# 5. Provision a c3.large with SSH key attached
agy compute create \
  --name web-prod-01 \
  --shape c3.large \
  --image ubuntu-24.04 \
  --ssh-key ops-key \
  --disk-size 120 \
  --tags env=prod,tier=web

# 6. Tail its boot log until cloud-init completes
agy compute logs cmp_7f3da1b2 --follow

# 7. JSON output for jq pipelines
agy compute list --format json | jq '.instances[].public_ip'`}
                />
              </TabPanel>

              <TabPanel value="sdk">
                <CodeBlock
                  language="typescript"
                  code={`import { AravantaClient, paginate } from '@aravanta/sdk';

const client = new AravantaClient({
  apiKey: process.env.ARVANTA_KEY,
  region: 'ap-south-1',
  projectId: 'proj_3fa61b',
});

// Create a VM with tag-based RBAC tags
const vm = await client.compute.instances.create({
  name: 'billing-worker-07',
  shape: 'c3.large',
  image: 'ubuntu-24.04',
  diskSizeGb: 120,
  sshKeyName: 'deploy-key',
  tags: { team: 'billing', env: 'prod' },
  userData: Buffer.from(\`#!/bin/sh
    curl -fsSL https://get.docker.com | sh
  \`).toString('base64'),
});

// Poll until running
await client.compute.instances.waitFor(vm.id, 'running', { pollEveryMs: 3000 });

// List all VMs with auto-pagination across marker tokens
const allVms = await paginate(client.compute.instances.list, {
  filters: { tags_eq: ['env:prod'] },
});

console.log(\`Booted \${vm.id} @ \${vm.publicIp}\`);`}
                />
              </TabPanel>

              <TabPanel value="terraform">
                <CodeBlock
                  language="hcl"
                  code={`terraform {
  required_providers {
    aravanta = {
      source  = "aravanta-cloud/aravanta"
      version = "~> 1.2"
    }
  }
}

provider "aravanta" {
  region    = "ap-south-1"
  project   = "proj_3fa61b"
}

resource "aravanta_compute_ssh_key" "deploy" {
  name       = "deploy-key"
  public_key = file("~/.ssh/id_ed25519.pub")
}

resource "aravanta_compute_instance" "web" {
  count         = 3
  name          = "web-prod-\${count.index}"
  instance_type = "c3.large"
  image         = "ubuntu-24.04"
  disk_size_gb  = 120
  ssh_key_name  = aravanta_compute_ssh_key.deploy.name

  tags = {
    environment = "production"
    tier        = "web"
  }
}

resource "aravanta_s3_bucket" "uploads" {
  name   = "prod-user-uploads-ap-south-1"
  acl    = "private"
  versioning = true

  lifecycle_rule {
    id      = "archive-to-cold"
    prefix  = "invoices/"
    enabled = true
    transition {
      days          = 90
      storage_class = "cold"
    }
  }
}

output "web_ips" {
  value = aravanta_compute_instance.web[*].public_ip
}`}
                />
              </TabPanel>

              <TabPanel value="rest">
                <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-4">
                  <Card className="md:col-span-2">
                    <CardBody className="!p-5 space-y-4">
                      <div>
                        <Badge variant="gold" size="sm">
                          REST
                        </Badge>
                        <h3 className="mt-3 text-lg font-black tracking-tight">
                          Full OpenAPI 3.1 spec
                        </h3>
                        <p className="mt-1.5 text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                          180+ endpoints, human-readable descriptions, request/response
                          examples exported directly from the server router.
                        </p>
                      </div>
                      <div className="space-y-2 text-sm">
                        {[
                          'Idempotency keys: Idempotency-Key header',
                          'Rate limits: 2,000 req/min per key',
                          'Versioning: /api/v1 prefix + semver changelog',
                          'Auth: Bearer tokens, 90d max lifetime',
                        ].map((r) => (
                          <div key={r} className="flex items-center gap-2">
                            <Check className="w-4 h-4 text-brandGold-500" />
                            <span className="text-slate-700 dark:text-slate-200">{r}</span>
                          </div>
                        ))}
                      </div>
                      <div className="flex flex-wrap gap-2 pt-1">
                        <a
                          href="https://arv-backend.vercel.app/docs"
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1.5 text-sm font-bold text-brandGold-600 dark:text-brandGold-400 hover:underline"
                        >
                          <ExternalLink className="w-4 h-4" /> Swagger UI
                        </a>
                        <a
                          href="https://arv-backend.vercel.app/docs/openapi.json"
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1.5 text-sm font-bold text-slate-700 dark:text-slate-200 hover:underline"
                        >
                          <FileCode className="w-4 h-4" /> Download JSON spec
                        </a>
                      </div>
                    </CardBody>
                  </Card>
                  <div className="md:col-span-3">
                    <CodeBlock
                      language="bash"
                      code={`# Auth header + idempotency for mutating requests
curl -X POST "\\$API_URL/api/v1/compute/instances" \\
  -H "Authorization: Bearer \\$ARVANTA_KEY" \\
  -H "Content-Type: application/json" \\
  -H "Idempotency-Key: \$(openssl rand -hex 12)" \\
  -H "X-Project-Id: proj_3fa61b" \\
  -d '{
    "name": "web-prod-01",
    "instance_type": "c3.large",
    "region": "ap-south-1",
    "image": "ubuntu-24.04",
    "disk_size_gb": 120,
    "ssh_key_name": "deploy-key",
    "tags": {"env": "prod", "tier": "web"}
  }'

# Paginate with a stable marker cursor
curl -G "\\$API_URL/api/v1/compute/instances" \\
  -H "Authorization: Bearer \\$ARVANTA_KEY" \\
  --data-urlencode "limit=100" \\
  --data-urlencode "marker=cursor_..." \\
  --data-urlencode "tags_eq=env:prod"`}
                    />
                  </div>
                </div>
              </TabPanel>
            </TabContainer>
          </div>
        </section>

        <section className="py-16 sm:py-20 border-t border-slate-200 dark:border-brandObsidian-800 bg-slate-100/60 dark:bg-brandObsidian-900/40">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8 items-start">
              <div className="space-y-4">
                <Badge variant="outline" size="md">
                  SDK matrix
                </Badge>
                <h2 className="text-3xl sm:text-4xl font-black tracking-tight leading-tight">
                  Typed, tested, and instrumented for every popular language.
                </h2>
                <p className="text-base text-slate-600 dark:text-slate-300 leading-relaxed">
                  Every SDK ships with automatic retries, pagination helpers, request
                  tracing hooks, and WebSocket support for live log tailing.
                </p>
                <SearchInput
                  placeholder="Search available packages..."
                  className="max-w-md"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {sdkLanguages.map((l) => (
                  <Card
                    key={l.name}
                    hover
                    className="group"
                  >
                    <CardBody className="!p-5 flex items-start gap-4">
                      <div className="w-10 h-10 rounded-xl bg-brandGold-500/10 text-brandGold-500 flex items-center justify-center shrink-0 group-hover:bg-brandGold-500 group-hover:text-white transition-colors">
                        <ListTree className="w-5 h-5" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="text-base font-bold text-slate-900 dark:text-white">
                            {l.name}
                          </h3>
                          <Badge variant={toneBadge[l.tone] || 'outline'} size="sm">
                            {l.status}
                          </Badge>
                        </div>
                        <code className="mt-1.5 block text-xs font-mono text-slate-600 dark:text-slate-400 truncate">
                          {l.pkg}
                        </code>
                      </div>
                    </CardBody>
                  </Card>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="py-16 sm:py-20 border-t border-slate-200 dark:border-brandObsidian-800">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-10 items-center">
              <div className="space-y-5">
                <Badge variant="gold" size="md" dot>
                  <Zap className="w-3.5 h-3.5" /> Open source
                </Badge>
                <h2 className="text-3xl sm:text-4xl font-black tracking-tight leading-tight">
                  Contribute to the CLI, Terraform provider, and docs.
                </h2>
                <p className="text-base text-slate-600 dark:text-slate-300 leading-relaxed">
                  Every developer-facing surface is developed in public GitHub repos.
                  Accepting contributions for new SDK languages, Terraform resources,
                  CLI commands, and integrations.
                </p>
                <div className="flex flex-col sm:flex-row gap-3 pt-1">
                  <Button
                    size="lg"
                    variant="outline"
                    onClick={() => window.open('https://github.com', '_blank', 'noreferrer')}
                    leftIcon={<Github className="w-4 h-4" />}
                    rightIcon={<ExternalLink className="w-3.5 h-3.5" />}
                  >
                    Aravanta on GitHub
                  </Button>
                  <Button
                    size="lg"
                    variant="ghost"
                    onClick={() => onNavigate?.('about')}
                    rightIcon={<ChevronRight className="w-4 h-4" />}
                  >
                    View open-source philosophy
                  </Button>
                </div>
              </div>
              <Card>
                <CardBody className="!p-0">
                  <div className="px-5 py-3 border-b border-slate-200 dark:border-brandObsidian-700 flex items-center justify-between">
                    <span className="text-xs font-mono text-slate-500 dark:text-slate-400">
                      github.com/aravanta-cloud/aravanta-cli — good first issues
                    </span>
                    <Badge variant="success" size="sm">
                      14 open
                    </Badge>
                  </div>
                  <ul className="divide-y divide-slate-200 dark:divide-brandObsidian-700">
                    {[
                      { label: 'feat: add `agy cluster node-pool drain --grace-period` flag', tags: ['cli', 'k8s'] },
                      { label: 'docs: improve error messages on auth failures', tags: ['docs', 'ux'] },
                      { label: 'test: add integration tests for S3 signed URLs', tags: ['sdk', 'tests'] },
                      { label: 'perf: batch ListInstances by project on server', tags: ['api', 'perf'] },
                    ].map((i) => (
                      <li key={i.label} className="p-4 flex items-center gap-3 hover:bg-slate-50 dark:hover:bg-brandObsidian-800/40 transition-colors cursor-pointer">
                        <div className="w-1.5 h-1.5 rounded-full bg-brandGold-500 shrink-0" />
                        <div className="min-w-0 flex-1">
                          <div className="text-sm font-semibold text-slate-800 dark:text-slate-100 truncate">
                            {i.label}
                          </div>
                        </div>
                        <div className="flex gap-1.5 shrink-0">
                          {i.tags.map((t) => (
                            <Badge key={t} variant="outline" size="sm">
                              {t}
                            </Badge>
                          ))}
                        </div>
                      </li>
                    ))}
                  </ul>
                </CardBody>
              </Card>
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
                  <Terminal className="w-3.5 h-3.5" /> Ready to code?
                </Badge>
                <div className="max-w-2xl mx-auto space-y-4">
                  <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight leading-[1.08]">
                    Grab an API key and ship your first resource today.
                  </h2>
                  <p className="text-base sm:text-lg text-slate-300 leading-relaxed">
                    10-day full-access trial, no credit card. Cancel with one `agy auth
                    logout` if it isn&apos;t a fit.
                  </p>
                </div>
                <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 pt-2">
                  <Button
                    size="xl"
                    variant="primary"
                    onClick={onGoToRegister}
                    rightIcon={<ArrowRight className="w-4.5 h-4.5" />}
                  >
                    Create API key
                  </Button>
                  <Button
                    size="xl"
                    variant="secondary"
                    onClick={() => onNavigate?.('documentation')}
                    leftIcon={<BookOpen className="w-4 h-4" />}
                  >
                    Read docs
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
