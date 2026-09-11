import React from 'react';
import { motion } from 'framer-motion';
import {
  Target,
  BookOpen,
  Cpu,
  Users,
  Server,
  Map,
  MessageCircle,
  Cloud,
  Globe2,
  HeartHandshake,
  Sparkles,
  ChevronRight,
  Rocket,
  Gauge,
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

const stats = [
  { label: 'Cloud Regions', value: '4', icon: Globe2, tone: 'gold' },
  { label: 'Avg VM Boot', value: '48s', icon: Server, tone: 'emerald' },
  { label: 'Uptime (6m)', value: '99.98%', icon: Gauge, tone: 'gold' },
  { label: 'Open-Source Modules', value: '32', icon: Cloud, tone: 'sky' },
];

const sections = [
  {
    icon: Target,
    title: 'Our Mission',
    body:
      'Aravanta Cloud OS exists to give every engineering team — from a two-person startup to a 500-engineer enterprise — a single, unified control plane for multi-cloud operations. We believe infrastructure should be observable, programmable, and portable. Our mission is to eliminate the operational tax of stitching together disparate cloud services so teams can focus on shipping product, not managing plumbing.',
  },
  {
    icon: BookOpen,
    title: 'The Platform Story',
    body:
      'Aravanta Cloud OS was born in 2024 when a team of ex-cloud-platform engineers from hyperscaler backgrounds realised they were all solving the same problem independently: unifying compute orchestration, storage provisioning, database lifecycle, and observability across AWS, GCP, Azure, and bare metal. Over 18 months, the founding team built a Kubernetes-native control plane that treats every cloud provider as a pluggable backend. Launched in public beta with 8 core platform services, the system today manages workloads across 4 regions with sub-second telemetry and a 99.98% uptime track record.',
  },
  {
    icon: Cpu,
    title: 'Why Cloud OS Matters',
    body:
      'Modern engineering teams run workloads across 3+ cloud providers, each with its own console, billing model, IAM system, and monitoring stack. The result is operational complexity that scales linearly with every new service. Aravanta Cloud OS collapses that complexity into a single pane of glass — unified identity, unified billing in INR and USD, unified telemetry, and unified deployment pipelines. No vendor lock-in, no surprise egress fees, no context-switching between dashboards.',
  },
  {
    icon: Users,
    title: 'Our Team',
    body:
      'The Aravanta team is a distributed group of platform engineers, SREs, DevOps specialists, and product designers who have collectively built and operated infrastructure serving millions of requests per second. Our engineering culture prioritises boring reliability over hype — we pick proven, audited implementations (etcd, Postgres WAL, Patroni) and wrap them with world-class UX. Every team member contributes to the open-source developer tooling under the Aravanta contributor covenant.',
  },
  {
    icon: HeartHandshake,
    title: 'Technology Partners',
    body:
      'Aravanta Cloud OS integrates deeply with the cloud-native ecosystem: AWS, Google Cloud, and Azure as compute backends; Kubernetes 1.27–1.30 for container orchestration; Terraform and OpenTofu for infrastructure-as-code; Prometheus, Grafana, and OpenTelemetry for observability; HashiCorp Vault for secrets management; and Cert-Manager for automated TLS. Our partner program includes bare-metal hosting providers, managed database vendors, and enterprise security platforms.',
  },
  {
    icon: Map,
    title: 'Roadmap',
    body:
      'The Aravanta roadmap is published quarterly and shaped by community vote and enterprise customer priorities. FY 2026–27 milestones include: Q1 — GPU compute pools, serverless function runtime, and FinOps cost-allocation tags. Q2 — multi-region database replication, edge CDN integration, and SOC 2 Type II re-certification. Q3 — bare-metal Kubernetes distribution for air-gapped environments, disaster recovery automation, and v3.0 API stability guarantees. Q4 — marketplace for pre-built deployment templates, advanced RBAC with attribute-based policies, and native mobile console app.',
  },
  {
    icon: MessageCircle,
    title: 'Join Our Community',
    body:
      'Aravanta Cloud OS is built in the open. Join 3,200+ engineers on Discord for real-time support, architecture discussions, and pair-debugging sessions. Contribute to our open-source CLI, Terraform provider, and SDKs on GitHub. Subscribe to the release notes for monthly platform updates. Attend the quarterly Aravanta Cloud Meetup. If you are an enterprise team, request a dedicated onboarding workshop. If you are a student or early-career engineer, apply for the Aravanta Cloud Fellowship. Great platforms are built together.',
  },
];

const toneMap: Record<string, string> = {
  gold: 'from-brandGold-500/20 via-brandGold-500/10 to-transparent border-brandGold-500/30 text-brandGold-600 dark:text-brandGold-400',
  emerald: 'from-emerald-500/20 via-emerald-500/10 to-transparent border-emerald-500/30 text-emerald-600 dark:text-emerald-400',
  sky: 'from-sky-500/20 via-sky-500/10 to-transparent border-sky-500/30 text-sky-600 dark:text-sky-400',
};

export const AboutUsPage: React.FC<PageProps> = ({
  onGoToLogin,
  onGoToRegister,
  onOpenCommandPalette,
  onNavigate,
}) => {
  return (
    <div className="min-h-screen bg-white dark:bg-brandObsidian-950 font-sans antialiased text-slate-900 dark:text-slate-100">
      <Navbar
        onGoToLogin={onGoToLogin}
        onGoToRegister={onGoToRegister}
        onOpenCommandPalette={onOpenCommandPalette}
        onNavigate={onNavigate}
        currentView="about"
      />

      <main>
        <section className="pt-6 pb-12 sm:pt-10 sm:pb-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="max-w-[800px] mx-auto">
              <Breadcrumbs
                items={[
                  { label: 'Platform', onClick: () => onNavigate?.('home') },
                  { label: 'About Us' },
                ]}
              />
            </div>
          </div>
        </section>

        <section className="pb-12 sm:pb-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="max-w-[800px] mx-auto">
              <motion.div
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="space-y-6 mb-12 text-center"
              >
                <Badge variant="gold" size="md" dot>
                  <Sparkles className="w-3.5 h-3.5" /> Our Story
                </Badge>
                <h1 className="text-4xl sm:text-5xl font-black tracking-tighter leading-[1.03] text-slate-900 dark:text-white">
                  About Aravanta Cloud OS
                </h1>
                <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 leading-relaxed max-w-3xl mx-auto">
                  The unified, multi-cloud operating system built by engineers who were tired of stitching 17 SaaS products together to ship one microservice. One control plane for compute, storage, databases, CI/CD, and observability.
                </p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.1 }}
                className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 mb-14"
              >
                {stats.map((s, i) => {
                  const SIcon = s.icon;
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
                            '!p-5 sm:!p-6 text-center space-y-2 bg-gradient-to-br border',
                            toneMap[s.tone],
                          ].join(' ')}
                        >
                          <div className="w-10 h-10 mx-auto rounded-xl bg-white/60 dark:bg-brandObsidian-900/50 flex items-center justify-center">
                            <SIcon className="w-5 h-5" />
                          </div>
                          <div className="text-2xl sm:text-3xl font-black tabular-nums text-slate-900 dark:text-white">
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
              </motion.div>

              <div className="space-y-5">
                {sections.map((section, idx) => {
                  const Icon = section.icon;
                  return (
                    <motion.div
                      key={section.title}
                      initial={{ opacity: 0, y: 12 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true, margin: '-40px' }}
                      transition={{ duration: 0.4, delay: 0.04 * idx }}
                    >
                      <Card goldAccent>
                        <CardBody className="!p-6 sm:!p-8 space-y-4">
                          <div className="flex items-start gap-4">
                            <div className="shrink-0 w-12 h-12 rounded-2xl bg-brandGold-500/10 text-brandGold-600 dark:text-brandGold-400 flex items-center justify-center">
                              <Icon className="w-6 h-6" />
                            </div>
                            <div className="min-w-0 flex-1 space-y-3">
                              <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
                                {section.title}
                              </h2>
                              <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 leading-relaxed">
                                {section.body}
                              </p>
                            </div>
                          </div>
                        </CardBody>
                      </Card>
                    </motion.div>
                  );
                })}
              </div>

              <motion.div
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: 0.3 }}
                className="mt-12"
              >
                <Card className="bg-gradient-to-br from-brandGold-50 via-white to-white dark:from-brandGold-600/10 dark:via-brandObsidian-900 dark:to-brandObsidian-900">
                  <CardBody className="!p-6 sm:!p-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-5">
                    <div className="space-y-2">
                      <h3 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900 dark:text-white">
                        Deploy with Aravanta today.
                      </h3>
                      <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 leading-relaxed">
                        Explore the platform, read the quickstart guide, or reach out for an enterprise onboarding workshop.
                      </p>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-3 shrink-0">
                      <Button
                        size="lg"
                        variant="primary"
                        onClick={() => onNavigate?.('getting-started')}
                        rightIcon={<Rocket className="w-4.5 h-4.5" />}
                      >
                        Get Started
                      </Button>
                      <Button
                        size="lg"
                        variant="outline"
                        onClick={() => onNavigate?.('contact')}
                        rightIcon={<ChevronRight className="w-4 h-4" />}
                      >
                        Contact Us
                      </Button>
                    </div>
                  </CardBody>
                </Card>
              </motion.div>
            </div>
          </div>
        </section>
      </main>

      <Footer onNavigate={onNavigate} />
    </div>
  );
};

