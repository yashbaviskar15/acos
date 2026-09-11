import React from 'react';
import { motion } from 'framer-motion';
import {
  HelpCircle,
  Rocket,
  Globe2,
  Lock,
  Building2,
  GitBranch,
  Scale,
  Headphones,
  ChevronRight,
  Mail,
  Code2,
  Server,
} from 'lucide-react';

import { Navbar, LandingView } from '../components/ui/Navbar';
import { Footer } from '../components/ui/Footer';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Card, CardBody } from '../components/ui/Card';
import { Breadcrumbs } from '../components/ui/Breadcrumbs';
import {
  Accordion,
  AccordionItem,
  AccordionHeader,
  AccordionBody,
} from '../components/ui/Accordion';

interface PageProps {
  onGoToLogin: () => void;
  onGoToRegister: () => void;
  onOpenCommandPalette?: () => void;
  onNavigate?: (view: LandingView) => void;
}

const faqs = [
  {
    id: 'getting-started',
    icon: Rocket,
    title: 'How do I get started with Aravanta Cloud OS?',
    answer:
      'Getting started takes under 10 minutes. Create a free workspace at console.aravanta.cloud, install the Aravanta CLI via npm install -g @aravanta/cli, and run arv init to scaffold your first project. From the console, you can provision VMs, Kubernetes clusters, managed databases, and object storage with a few clicks. The free tier includes 2 vCPUs, 4 GB RAM, 50 GB SSD, and 100 GB bandwidth per month \u2014 no credit card required. Enterprise teams can request a guided onboarding workshop by emailing sales@aravanta.cloud.',
  },
  {
    id: 'supported-clouds',
    icon: Globe2,
    title: 'Which cloud providers does Aravanta support?',
    answer:
      'Aravanta Cloud OS currently supports AWS, Google Cloud Platform, and Microsoft Azure as compute backends, with first-class integrations for each provider\u2019s networking, storage, and IAM systems. We also support bare-metal provisioning via IPMI/Redfish and on-premises Kubernetes clusters (v1.27\u20131.30). The unified control plane abstracts provider-specific APIs, so your deployment manifests, Terraform configs, and CI/CD pipelines work identically across all backends. Multi-cloud workload placement is handled by our intelligent scheduler based on cost, latency, and compliance constraints.',
  },
  {
    id: 'kubernetes',
    icon: Server,
    title: 'What Kubernetes versions are supported?',
    answer:
      'ArvKube supports Kubernetes versions 1.27 through 1.30, with automatic minor-version upgrades and configurable maintenance windows. We support both managed clusters (where Aravanta handles the control plane) and self-hosted bring-your-own-cluster (BYOK) mode. Helm chart deployments, custom operators, and CRDs are fully supported. The platform ships with pre-configured monitoring (Prometheus + Grafana), log aggregation (Loki), and distributed tracing (Jaeger via OpenTelemetry) for every cluster.',
  },
  {
    id: 'migration',
    icon: GitBranch,
    title: 'How do I migrate from my existing cloud setup?',
    answer:
      'Aravanta provides a Migration Wizard in the console and a terraform import workflow for infrastructure-as-code users. For compute workloads, we support live VM migration with near-zero downtime using block-level replication. Kubernetes workloads can be migrated via Velero-compatible backup/restore or GitOps-driven redeployment. Database migrations use logical replication for Postgres and change-data-capture for MySQL. Our Solutions Architecture team offers free migration assessments for Enterprise plan customers.',
  },
  {
    id: 'pricing',
    icon: Scale,
    title: 'How does pricing work?',
    answer:
      'Aravanta uses transparent, usage-based pricing with no hidden fees. Compute is billed per vCPU-hour, storage per GB-month, and databases per instance-hour. We do not charge egress fees within the same region, and cross-region egress is priced at cost. Pricing is published in both INR and USD. The free tier includes generous limits for personal projects and prototyping. Team and Enterprise plans add SLA guarantees, priority support, advanced RBAC, and dedicated account management. See our pricing page for detailed per-resource rates.',
  },
  {
    id: 'security',
    icon: Lock,
    title: 'Is Aravanta SOC 2 and ISO 27001 compliant?',
    answer:
      'Yes. Aravanta Cloud OS holds SOC 2 Type II certification (audited annually by an independent firm) and is aligned with ISO 27001 controls. All data at rest is encrypted with AES-256, and all data in transit uses TLS 1.3. The platform enforces RBAC with fine-grained permissions, TOTP-based MFA for administrative roles, and produces immutable audit logs that are retained for 365 days on Enterprise plans. SSH key-only access is mandatory for all compute instances. We publish our security practices and compliance reports at security.aravanta.cloud.',
  },
  {
    id: 'data-residency',
    icon: Building2,
    title: 'Where is my data stored?',
    answer:
      'Aravanta operates data centres in Mumbai (ap-south-1) and Chennai (ap-south-2) for India-first data residency. Optional regions include Singapore (ap-southeast-1) and Frankfurt (eu-central-1) for global workloads. You have full control over region selection at the workspace, project, and individual resource level. For regulated industries, we support data sovereignty configurations that guarantee data never leaves the selected jurisdiction. All region choices are transparent in the console and auditable via the API.',
  },
  {
    id: 'support-sla',
    icon: Headphones,
    title: 'What support SLAs do you offer?',
    answer:
      'Free tier users receive community support via Discord and GitHub Discussions. Team plan customers get email support with 8-hour response SLA for P2 issues and 4-hour for P1. Enterprise plan customers receive 24\u00d77 support with a 1-hour P1 response SLA, a named Solutions Architect, quarterly business reviews, and access to the P1 War-Room hotline (+91 80 4567 8999) for critical production incidents. All plans include access to our comprehensive documentation, tutorials, and API reference.',
  },
  {
    id: 'api-cli',
    icon: Code2,
    title: 'Do you have APIs and a CLI?',
    answer:
      'Absolutely. Every operation available in the Aravanta console is also available via our REST API (documented with OpenAPI 3.1) and the arv CLI. We also publish a Terraform provider (registry.terraform.io/providers/aravanta/aravanta) and SDKs for Go, Python, and Node.js. The CLI supports shell completion, JSON/YAML output modes, and can be used in CI/CD pipelines. All API endpoints support pagination, filtering, and webhook subscriptions for event-driven automation.',
  },
  {
    id: 'open-source',
    icon: GitBranch,
    title: 'Is Aravanta open source?',
    answer:
      'Developer-facing surfaces are open source under permissive licenses: the arv CLI, Terraform provider, Go/Python/Node SDKs, and documentation are all available on GitHub at github.com/aravanta. The core control plane (scheduler, billing engine, multi-tenant isolation layer) is proprietary. We believe this hybrid model gives you full inspectability and portability for the tools you interact with daily, while allowing us to invest sustainably in the platform\u2019s reliability and security. Community contributions are welcome \u2014 start with our Contributing.md.',
  },
];

export const FAQPage: React.FC<PageProps> = ({
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
        currentView="faq"
      />

      <main>
        <section className="pt-6 pb-12 sm:pt-10 sm:pb-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="max-w-[800px] mx-auto">
              <Breadcrumbs
                items={[
                  { label: 'Platform', onClick: () => onNavigate?.('home') },
                  { label: 'Support', onClick: () => onNavigate?.('contact') },
                  { label: 'FAQ' },
                ]}
              />
            </div>
          </div>
        </section>

        <section className="pb-16 sm:pb-24">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="max-w-[800px] mx-auto">
              <motion.div
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="space-y-6 mb-12 text-center"
              >
                <Badge variant="gold" size="md" dot>
                  <HelpCircle className="w-3.5 h-3.5" /> {faqs.length} questions answered
                </Badge>
                <h1 className="text-4xl sm:text-5xl font-black tracking-tighter leading-[1.03] text-slate-900 dark:text-white">
                  Frequently Asked Questions
                </h1>
                <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 leading-relaxed max-w-3xl mx-auto">
                  Everything you need to know about Aravanta Cloud OS &mdash; from getting started and supported clouds to pricing, security, and open-source philosophy. Can&apos;t find your answer? Reach out to our team.
                </p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.1 }}
              >
                <Accordion>
                  {faqs.map((faq) => {
                    const FIcon = faq.icon;
                    return (
                      <AccordionItem key={faq.id} value={faq.id}>
                        <AccordionHeader value={faq.id}>
                          <div className="flex items-center gap-3">
                            <div className="shrink-0 w-9 h-9 rounded-lg bg-brandGold-500/10 text-brandGold-600 dark:text-brandGold-400 flex items-center justify-center">
                              <FIcon className="w-4.5 h-4.5" />
                            </div>
                            <span className="text-left font-bold text-sm sm:text-base text-slate-900 dark:text-white">
                              {faq.title}
                            </span>
                          </div>
                        </AccordionHeader>
                        <AccordionBody value={faq.id}>
                          <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 leading-relaxed pl-12">
                            {faq.answer}
                          </p>
                        </AccordionBody>
                      </AccordionItem>
                    );
                  })}
                </Accordion>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: 0.2 }}
                className="mt-12"
              >
                <Card className="bg-gradient-to-br from-brandGold-50 via-white to-white dark:from-brandGold-600/10 dark:via-brandObsidian-900 dark:to-brandObsidian-900">
                  <CardBody className="!p-6 sm:!p-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-5">
                    <div className="space-y-2">
                      <h3 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900 dark:text-white">
                        Still have questions?
                      </h3>
                      <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 leading-relaxed">
                        Our engineering team is happy to help. Drop us a line at{' '}
                        <span className="font-mono text-brandGold-600 dark:text-brandGold-400">support@aravanta.cloud</span>{' '}
                        or join our Discord community.
                      </p>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-3 shrink-0">
                      <Button
                        size="lg"
                        variant="primary"
                        onClick={() => onNavigate?.('contact')}
                        rightIcon={<Mail className="w-4 h-4" />}
                      >
                        Contact Us
                      </Button>
                      <Button
                        size="lg"
                        variant="outline"
                        onClick={() => onNavigate?.('community')}
                        rightIcon={<ChevronRight className="w-4 h-4" />}
                      >
                        Join Community
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
