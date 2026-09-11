import React from 'react';
import { motion } from 'framer-motion';
import { Shield, Mail, Clock, ShieldCheck, UserCheck, RefreshCw, Server } from 'lucide-react';

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
    icon: Shield,
    title: 'Customer Data Ownership & Isolation',
    body:
      'You retain 100% ownership of all applications, container workloads, database records, and files hosted on Aravanta Cloud OS. We enforce strict cryptographic multi-tenant isolation across all compute clusters, virtual networks, and storage volumes. We never sell, monetize, inspect, or train machine learning models on your customer workload data.',
  },
  {
    icon: UserCheck,
    title: 'Information We Collect',
    body:
      'To provide and maintain the Cloud OS platform, we collect account credentials (name, business email, organization name), billing addresses, payment transaction tokens via authorized gateways, and telemetry logs (API call volume, error rates, CPU/RAM utilization). All collection is governed by legitimate business purposes and explicit consent.',
  },
  {
    icon: ShieldCheck,
    title: 'Security & Cryptographic Standards',
    body:
      'We implement bank-grade security controls: AES-256 encryption for all block and object storage at rest, TLS 1.3 with forward secrecy for all API traffic in transit, mandatory TOTP multi-factor authentication for administrative accounts, automated vulnerability scanning, and immutable audit logs preserved for 365 days.',
  },
  {
    icon: Server,
    title: 'Infrastructure & Data Residency',
    body:
      'Aravanta Cloud OS operates across certified Tier-4 datacenters with data residency options in Mumbai (ap-south-1), Singapore (ap-southeast-1), Frankfurt (eu-central-1), and North Virginia (us-east-1). Enterprise customers can enforce strict sovereign data residency to guarantee data never leaves designated geographical boundaries.',
  },
  {
    icon: RefreshCw,
    title: 'Your Privacy Rights (DPDPA & GDPR)',
    body:
      'Under the Digital Personal Data Protection Act (DPDPA), 2023, and General Data Protection Regulation (GDPR), you possess full rights to export your data in machine-readable format, request rectification or erasure of personal information, designate authorized representatives, and lodge grievances with our Data Protection Officer.',
  },
  {
    icon: Clock,
    title: 'Data Retention & Deletion Lifecycle',
    body:
      'Telemetry logs and audit events are retained according to your workspace subscription tier (7 days for Starter, 30 days for Team, 365 days for Enterprise). Upon workspace termination, all provisioned virtual disks, databases, and cryptographic keys are securely wiped using DoD 5220.22-M sanitization standards within 30 days.',
  },
  {
    icon: Mail,
    title: 'Contact & Grievance Officer',
    body:
      'If you have questions regarding this Privacy Policy or wish to exercise your data subject rights, please contact our Data Protection Office at privacy@aravanta.cloud or legal@aravanta.cloud. We acknowledge all inquiries within 24 business hours.',
  },
];

export const PrivacyPolicyPage: React.FC<PageProps> = ({
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
        currentView="privacy"
      />

      <main>
        <section className="pt-6 pb-12 sm:pt-10 sm:pb-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="max-w-[800px] mx-auto">
              <Breadcrumbs
                items={[
                  { label: 'Platform', onClick: () => onNavigate?.('home') },
                  { label: 'Legal' },
                  { label: 'Privacy Policy' },
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
                  <Shield className="w-3.5 h-3.5" /> Effective: September 2026
                </Badge>
                <h1 className="text-4xl sm:text-5xl font-black tracking-tighter leading-[1.03] text-slate-900 dark:text-white">
                  Privacy Policy
                </h1>
                <p className="text-base sm:text-lg text-slate-600 dark:text-slate-300 leading-relaxed">
                  Aravanta Cloud OS (&quot;Aravanta&quot;, &quot;we&quot;, &quot;our&quot;) is committed to transparent data practices, rigorous security safeguards, and respect for customer autonomy. This policy outlines how we handle data across our cloud control plane, APIs, CLI, and hosted infrastructure services.
                </p>
                <div className="flex flex-wrap gap-2.5 pt-2">
                  <Badge variant="outline" size="sm">DPDPA 2023 Compliant</Badge>
                  <Badge variant="outline" size="sm">SOC 2 Type II Certified</Badge>
                  <Badge variant="outline" size="sm">AES-256 Cloud Encryption</Badge>
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
                        Have privacy or compliance questions?
                      </h3>
                      <p className="text-sm text-slate-600 dark:text-slate-300">
                        Our security and legal teams are available to assist enterprise inquiries.
                      </p>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-3 shrink-0">
                      <Button
                        size="md"
                        variant="primary"
                        onClick={() => onNavigate?.('contact')}
                        className="bg-brandGold-500 hover:bg-brandGold-600 text-brandObsidian-950 font-bold"
                        leftIcon={<Mail className="w-4 h-4" />}
                      >
                        Contact Us
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
