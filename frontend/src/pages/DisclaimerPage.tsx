import React from 'react';
import { motion } from 'framer-motion';
import { AlertTriangle, Server, ShieldAlert, Scale, CheckCircle2, Headphones, FileText, Globe } from 'lucide-react';

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

const sections = [
  {
    icon: AlertTriangle,
    title: 'Cloud Service SLA & High Availability',
    body:
      'Aravanta Cloud OS targets a 99.99% multi-region control plane availability under standard operational conditions. Individual compute instances, container pods, and databases remain subject to scheduled maintenance windows, hardware lifecycle replacements, and provider-specific availability zone variations. Planned maintenance is announced at least 72 hours in advance via status.aravanta.cloud.',
  },
  {
    icon: Server,
    title: 'Shared Responsibility Model',
    body:
      'Aravanta maintains the physical datacenter facilities, virtualization hypervisors, control plane APIs, and core platform microservices. Customers remain strictly responsible for application source code, Docker images, database schema migrations, IAM access keys, firewall rule configurations, and independent snapshot backup schedules.',
  },
  {
    icon: ShieldAlert,
    title: 'Workload Continuity & Disaster Recovery',
    body:
      'While Aravanta provides automated snapshotting and distributed S3 bucket replication, customers running mission-critical workloads are strongly advised to architect across multiple availability zones and maintain multi-cloud recovery strategies. Aravanta is not liable for data loss caused by customer-initiated deletions or failure to configure backup retention.',
  },
  {
    icon: Scale,
    title: 'Limitation of Liability',
    body:
      'To the maximum extent permitted by applicable law, Aravanta Cloud OS Technologies Inc. and its affiliates, directors, employees, and suppliers shall not be liable for any indirect, punitive, incidental, special, consequential, or exemplary damages, including without limitation damages for loss of profits, goodwill, use, data, or other intangible losses arising from platform unavailability.',
  },
  {
    icon: CheckCircle2,
    title: 'Accuracy of Telemetry & Metrics',
    body:
      'Platform telemetry, Prometheus metrics, and cost estimators are provided on a best-effort basis with sub-second polling frequencies. While we make every engineering effort to ensure precision, telemetry graphs and real-time FinOps projections should be cross-referenced with your official monthly finalized invoices.',
  },
  {
    icon: Globe,
    title: 'Third-Party Cloud Providers & Upstream Networks',
    body:
      'Certain multi-cloud integrations interact with external infrastructure providers including AWS, Google Cloud Platform, Microsoft Azure, and Tier-1 transit carriers. Aravanta is not responsible for outages, DNS resolution delays, or packet loss caused by upstream Internet transit providers or third-party cloud infrastructure failures.',
  },
];

export const DisclaimerPage: React.FC<PageProps> = ({
  onGoToLogin,
  onGoToRegister,
  onOpenCommandPalette,
  onNavigate,
}) => {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-brandObsidian-950 font-sans antialiased text-slate-900 dark:text-slate-100 transition-colors">
      <Navbar
        onGoToLogin={onGoToLogin}
        onGoToRegister={onGoToRegister}
        onOpenCommandPalette={onOpenCommandPalette}
        onNavigate={onNavigate}
        currentView="disclaimer"
      />

      <main>
        <section className="pt-6 pb-12 sm:pt-10 sm:pb-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="max-w-[800px] mx-auto">
              <Breadcrumbs
                items={[
                  { label: 'Platform', onClick: () => onNavigate?.('home') },
                  { label: 'Legal' },
                  { label: 'Disclaimer' },
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
                className="space-y-6 mb-12"
              >
                <Badge variant="gold" size="md" dot>
                  <FileText className="w-3.5 h-3.5" /> Legal Notice
                </Badge>
                <h1 className="text-4xl sm:text-5xl font-black tracking-tighter leading-[1.03] text-slate-900 dark:text-white">
                  Platform Disclaimer
                </h1>
                <p className="text-base sm:text-lg text-slate-600 dark:text-slate-300 leading-relaxed">
                  The following statements govern the operational scope, availability targets, and liability boundaries of Aravanta Cloud OS. By provisioning cloud resources or accessing our APIs, you accept the shared responsibility architecture outlined below.
                </p>
                <div className="p-4 sm:p-5 rounded-2xl bg-brandGold-500/10 border border-brandGold-500/25 flex items-start gap-3.5">
                  <AlertTriangle className="w-5 h-5 text-brandGold-600 dark:text-brandGold-400 shrink-0 mt-0.5" />
                  <p className="text-sm sm:text-base text-slate-700 dark:text-slate-300 leading-relaxed">
                    Aravanta Cloud OS is designed for enterprise infrastructure management and high-availability web applications. For mission-critical production clusters, always enable multi-region failover and automated snapshot policies.
                  </p>
                </div>
              </motion.div>

              <div className="space-y-6">
                {sections.map((section, idx) => {
                  const Icon = section.icon;
                  return (
                    <motion.div
                      key={section.title}
                      initial={{ opacity: 0, y: 12 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true, margin: '-40px' }}
                      transition={{ duration: 0.4, delay: 0.03 * idx }}
                    >
                      <Card hover className="border border-slate-200 dark:border-brandObsidian-800">
                        <CardBody className="!p-6 sm:!p-8 space-y-4">
                          <div className="flex items-start gap-4">
                            <div className="shrink-0 w-11 h-11 rounded-xl bg-brandGold-500/10 text-brandGold-600 dark:text-brandGold-400 flex items-center justify-center">
                              <Icon className="w-5.5 h-5.5" />
                            </div>
                            <div className="min-w-0 flex-1 space-y-2">
                              <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
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
                transition={{ duration: 0.4, delay: 0.2 }}
                className="mt-12"
              >
                <Card className="bg-gradient-to-br from-brandGold-500/10 via-white to-white dark:via-brandObsidian-900 dark:to-brandObsidian-900 border border-brandGold-500/30">
                  <CardBody className="!p-6 sm:!p-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-5">
                    <div className="space-y-1.5">
                      <h3 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900 dark:text-white">
                        Need architectural guidance?
                      </h3>
                      <p className="text-sm text-slate-600 dark:text-slate-300">
                        Speak with an Aravanta solutions architect to verify your high-availability design.
                      </p>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-3 shrink-0">
                      <Button
                        size="md"
                        variant="primary"
                        onClick={() => onNavigate?.('contact')}
                        className="bg-brandGold-500 hover:bg-brandGold-600 text-brandObsidian-950 font-bold"
                        leftIcon={<Headphones className="w-4 h-4" />}
                      >
                        Contact Support
                      </Button>
                      <Button
                        size="md"
                        variant="outline"
                        onClick={() => onNavigate?.('faq')}
                      >
                        Browse FAQ
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
