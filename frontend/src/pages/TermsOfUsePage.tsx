import React from 'react';
import { motion } from 'framer-motion';
import { CheckCircle2, UserCircle, Ban, Copyright, DoorOpen, Gavel, Scale, CreditCard, Cpu } from 'lucide-react';

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
    icon: CheckCircle2,
    title: 'Acceptance of SaaS Terms',
    body:
      'By registering an account, generating API credentials, or provisioning compute, storage, or database workloads on Aravanta Cloud OS ("the Services"), you agree to be legally bound by these Terms of Use. If you represent an organization or enterprise, you warrant that you possess the authority to bind that entity to this agreement.',
  },
  {
    icon: UserCircle,
    title: 'Workspace Management & Credential Security',
    body:
      'You are responsible for safeguarding your administrative login credentials, SSH key pairs, and personal access tokens. Multi-factor authentication (TOTP) is strongly enforced across privileged roles. Any actions performed using your account API keys or authenticated session tokens are deemed authorized by your organization.',
  },
  {
    icon: Ban,
    title: 'Acceptable Cloud Use Policy',
    body:
      'Aravanta Cloud OS resources must not be utilized for unauthorized penetration testing, distributed denial-of-service (DDoS) orchestration, unauthorized cryptocurrency mining, distribution of malware, or hosting illegal materials. Violation of our Acceptable Use Policy results in immediate automated workload isolation and account termination.',
  },
  {
    icon: Cpu,
    title: 'Resource Quotas & Fair Use Telemetry',
    body:
      'Workspaces are allocated compute, bandwidth, and API request quotas corresponding to their subscription tier. API rate limits protect multi-tenant stability. In the event of excessive burst traffic threatening cluster availability, Aravanta dynamically throttles non-essential ingress while preserving core control plane stability.',
  },
  {
    icon: CreditCard,
    title: 'Subscriptions, Billing & Currency',
    body:
      'Paid subscriptions are billed in advance on a monthly or annual cadence in either Indian Rupees (INR ₹) or US Dollars (USD $). Invoices reflect statutory Goods and Services Tax (GST) where applicable. Failure to maintain a valid payment instrument after a 7-day grace period may result in workload suspension.',
  },
  {
    icon: Copyright,
    title: 'Intellectual Property Rights',
    body:
      'You retain all rights, title, and ownership in and to your software applications, Docker containers, database schemas, and proprietary algorithms hosted on the platform. Aravanta retains all exclusive rights to the Aravanta Cloud OS software, CLI utilities, APIs, branding, documentation, and user interfaces.',
  },
  {
    icon: DoorOpen,
    title: 'Account Cancellation & Workload Termination',
    body:
      'You may cancel your workspace at any time through the Billing & Settings dashboard. Upon termination, a 14-day export window is provided during which you may download database backups and snapshot archives before persistent storage volumes are permanently sanitized.',
  },
  {
    icon: Gavel,
    title: 'Governing Law & Dispute Resolution',
    body:
      'These Terms of Use shall be governed by and construed in accordance with the laws of India. Any controversy or claim arising out of or relating to these Terms shall first be submitted to informal resolution, and if unresolved after 30 days, referred to binding arbitration under the Arbitration and Conciliation Act.',
  },
];

export const TermsOfUsePage: React.FC<PageProps> = ({
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
        currentView="terms"
      />

      <main>
        <section className="pt-6 pb-12 sm:pt-10 sm:pb-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="max-w-[800px] mx-auto">
              <Breadcrumbs
                items={[
                  { label: 'Platform', onClick: () => onNavigate?.('home') },
                  { label: 'Legal' },
                  { label: 'Terms of Use' },
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
                  <Scale className="w-3.5 h-3.5" /> Effective: September 2026
                </Badge>
                <h1 className="text-4xl sm:text-5xl font-black tracking-tighter leading-[1.03] text-slate-900 dark:text-white">
                  Terms of Use
                </h1>
                <p className="text-base sm:text-lg text-slate-600 dark:text-slate-300 leading-relaxed">
                  These Terms of Use govern your access to the Aravanta Cloud OS control plane, CLI tools, managed infrastructure, and API services operated by Aravanta CloudOS Technologies Inc.
                </p>
                <div className="flex flex-wrap gap-2.5 pt-2">
                  <Badge variant="outline" size="sm">Enterprise SaaS Terms</Badge>
                  <Badge variant="outline" size="sm">GST Compliant Billing</Badge>
                  <Badge variant="outline" size="sm">Version 2.4</Badge>
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
                        Questions regarding commercial agreements?
                      </h3>
                      <p className="text-sm text-slate-600 dark:text-slate-300">
                        Contact our sales and legal representatives for custom Master Services Agreements (MSAs).
                      </p>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-3 shrink-0">
                      <Button
                        size="md"
                        variant="primary"
                        onClick={() => onNavigate?.('contact')}
                        className="bg-brandGold-500 hover:bg-brandGold-600 text-brandObsidian-950 font-bold"
                      >
                        Contact Sales
                      </Button>
                      <Button
                        size="md"
                        variant="outline"
                        onClick={() => onNavigate?.('faq')}
                      >
                        Read FAQ
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
