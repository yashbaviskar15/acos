import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Scale,
  ShieldCheck,
  CheckCircle2,
  Ban,
  CreditCard,
  Printer,
  ChevronRight,
  DollarSign,
  FileCheck,
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

interface NavSection {
  id: string;
  title: string;
}

const tocSections: NavSection[] = [
  { id: 'acceptance', title: '1. Acceptance & Organization Authority' },
  { id: 'sla-availability', title: '2. SLA Commitments & Service Credits' },
  { id: 'acceptable-use', title: '3. Acceptable Cloud Use Policy' },
  { id: 'quotas-bursting', title: '4. Compute Quotas & Rate Limits' },
  { id: 'billing-taxes', title: '5. Invoicing, Currency (INR/USD) & GST' },
  { id: 'ip-ownership', title: '6. Intellectual Property & Customer Workloads' },
  { id: 'suspension-termination', title: '7. Suspension & Data Export Window' },
  { id: 'liability', title: '8. Limitation of Liability' },
  { id: 'dispute-resolution', title: '9. Governing Law & Arbitration' },
];

export const TermsOfUsePage: React.FC<PageProps> = ({
  onGoToLogin,
  onGoToRegister,
  onOpenCommandPalette,
  onNavigate,
}) => {
  const [activeSection, setActiveSection] = useState<string>('acceptance');

  useEffect(() => {
    const handleScroll = () => {
      const scrollPosition = window.scrollY + 140;
      for (let i = tocSections.length - 1; i >= 0; i--) {
        const el = document.getElementById(tocSections[i].id);
        if (el && el.offsetTop <= scrollPosition) {
          setActiveSection(tocSections[i].id);
          break;
        }
      }
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToSection = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      const yOffset = -90;
      const y = el.getBoundingClientRect().top + window.pageYOffset + yOffset;
      window.scrollTo({ top: y, behavior: 'smooth' });
    }
  };

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
        {/* Breadcrumb Header */}
        <section className="pt-6 pb-4 sm:pt-8">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <Breadcrumbs
              items={[
                { label: 'Platform', onClick: () => onNavigate?.('home') },
                { label: 'Legal & Governance' },
                { label: 'Terms of Use' },
              ]}
            />
          </div>
        </section>

        {/* Hero Title Strip */}
        <section className="pb-8 sm:pb-12 border-b border-slate-200/80 dark:border-brandObsidian-800">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
                className="space-y-3 max-w-3xl"
              >
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="gold" size="sm" dot>
                    Effective: September 2026
                  </Badge>
                  <Badge variant="outline" size="sm" className="font-mono">
                    Enterprise SaaS Agreement v2.4
                  </Badge>
                  <span className="text-xs text-slate-500 dark:text-slate-400 font-mono">
                    Doc ID: ACOS-LEGAL-TOU-2026
                  </span>
                </div>
                <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-slate-900 dark:text-white">
                  Master Terms of Use &amp; Cloud Services Agreement
                </h1>
                <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 leading-relaxed">
                  These terms govern your access to the Aravanta CloudOS control plane, managed Kubernetes clusters, compute hypervisors, distributed S3 storage, developer CLI (<code className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-brandObsidian-800 text-xs font-mono">arv</code>), and associated APIs.
                </p>
              </motion.div>

              <div className="flex items-center gap-3 shrink-0">
                <Button
                  variant="outline"
                  size="md"
                  onClick={() => window.print()}
                  leftIcon={<Printer className="w-4 h-4" />}
                  className="cursor-pointer"
                >
                  Print / PDF
                </Button>
                <Button
                  variant="primary"
                  size="md"
                  onClick={() => onNavigate?.('contact')}
                  className="bg-brandGold-500 hover:bg-brandGold-600 text-brandObsidian-950 font-bold"
                >
                  Enterprise MSA
                </Button>
              </div>
            </div>

            {/* Quick Summary Highlights */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-8">
              <div className="p-4 rounded-2xl border border-slate-200 dark:border-brandObsidian-800 bg-white dark:bg-brandObsidian-900/80 shadow-xs space-y-1.5">
                <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-mono text-xs font-bold">
                  <CheckCircle2 className="w-4 h-4" /> 99.99% Control Plane SLA
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                  Guaranteed control plane uptime across Indian regions with statutory service credits for unplanned downtime.
                </p>
              </div>

              <div className="p-4 rounded-2xl border border-slate-200 dark:border-brandObsidian-800 bg-white dark:bg-brandObsidian-900/80 shadow-xs space-y-1.5">
                <div className="flex items-center gap-2 text-brandGold-600 dark:text-brandGold-400 font-mono text-xs font-bold">
                  <CreditCard className="w-4 h-4" /> GST Invoicing &amp; INR
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                  Usage-based pricing in Indian Rupees (₹) with statutory 18% GST input tax credit for registered business entities.
                </p>
              </div>

              <div className="p-4 rounded-2xl border border-slate-200 dark:border-brandObsidian-800 bg-white dark:bg-brandObsidian-900/80 shadow-xs space-y-1.5">
                <div className="flex items-center gap-2 text-sky-600 dark:text-sky-400 font-mono text-xs font-bold">
                  <Scale className="w-4 h-4" /> Sovereign Jurisdiction
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                  Governed exclusively under Indian Law with dispute resolution via binding arbitration seated in Bengaluru, Karnataka.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Main Content Area: Sticky TOC + Clauses */}
        <section className="py-12 sm:py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
              {/* Left Column: Sticky Table of Contents */}
              <div className="lg:col-span-4 sticky top-24 space-y-5">
                <div className="p-5 rounded-2xl border border-slate-200 dark:border-brandObsidian-800 bg-white dark:bg-brandObsidian-900/90 shadow-sm">
                  <div className="flex items-center gap-2 pb-3 mb-3 border-b border-slate-100 dark:border-brandObsidian-800">
                    <FileCheck className="w-4 h-4 text-brandGold-600 dark:text-brandGold-400" />
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white font-mono">
                      Agreement Navigation
                    </span>
                  </div>
                  <nav className="space-y-1">
                    {tocSections.map((sec) => (
                      <button
                        key={sec.id}
                        onClick={() => scrollToSection(sec.id)}
                        className={[
                          'w-full text-left px-3 py-2 rounded-xl text-xs font-medium transition-all flex items-center justify-between cursor-pointer',
                          activeSection === sec.id
                            ? 'bg-brandGold-500/10 text-brandGold-600 dark:text-brandGold-400 font-bold border-l-2 border-brandGold-500'
                            : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-brandObsidian-800 hover:text-slate-900 dark:hover:text-white',
                        ].join(' ')}
                      >
                        <span className="truncate">{sec.title}</span>
                        {activeSection === sec.id && (
                          <ChevronRight className="w-3.5 h-3.5 text-brandGold-500 shrink-0" />
                        )}
                      </button>
                    ))}
                  </nav>
                </div>

                {/* Service Credit Summary Box */}
                <div className="p-5 rounded-2xl border border-emerald-500/30 bg-emerald-500/5 space-y-3">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-800 dark:text-emerald-400 font-mono flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5" /> SLA Service Credit Schedule
                  </h4>
                  <ul className="text-xs text-slate-600 dark:text-slate-400 space-y-2">
                    <li className="flex justify-between border-b border-emerald-500/15 pb-1">
                      <span>99.0% &ndash; 99.9%</span>
                      <strong className="text-emerald-700 dark:text-emerald-300 font-mono">10% Credit</strong>
                    </li>
                    <li className="flex justify-between border-b border-emerald-500/15 pb-1">
                      <span>95.0% &ndash; 99.0%</span>
                      <strong className="text-emerald-700 dark:text-emerald-300 font-mono">25% Credit</strong>
                    </li>
                    <li className="flex justify-between">
                      <span>&lt; 95.0%</span>
                      <strong className="text-emerald-700 dark:text-emerald-300 font-mono">50% Credit</strong>
                    </li>
                  </ul>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-tight">
                    Applied automatically to the following month&apos;s billing statement upon ticket verification.
                  </p>
                </div>
              </div>

              {/* Right Column: Detailed Clauses */}
              <div className="lg:col-span-8 space-y-10">
                {/* 1. Acceptance */}
                <div id="acceptance" className="scroll-mt-28 space-y-4">
                  <div className="flex items-center gap-3">
                    <span className="w-7 h-7 rounded-lg bg-brandGold-500/10 text-brandGold-600 dark:text-brandGold-400 font-mono text-xs font-bold flex items-center justify-center">
                      01
                    </span>
                    <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                      Acceptance of Terms &amp; Organization Authority
                    </h2>
                  </div>
                  <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 leading-relaxed">
                    By creating an account, generating API credentials, deploying virtual instances, or invoking any CLI commands against Aravanta Cloud OS (&quot;the Services&quot;), you agree to be bound by these Master Terms of Use.
                  </p>
                  <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 leading-relaxed">
                    If you accept these terms on behalf of a corporation, partnership, or enterprise entity, you warrant that you hold legitimate legal authority to bind that entity to this agreement. If you do not possess such authority, or do not agree with any provision herein, you must refrain from provisioning or accessing any Aravanta infrastructure.
                  </p>
                </div>

                {/* 2. SLA & Availability */}
                <div id="sla-availability" className="scroll-mt-28 space-y-4">
                  <div className="flex items-center gap-3">
                    <span className="w-7 h-7 rounded-lg bg-brandGold-500/10 text-brandGold-600 dark:text-brandGold-400 font-mono text-xs font-bold flex items-center justify-center">
                      02
                    </span>
                    <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                      Service Level Agreement (SLA) &amp; High Availability
                    </h2>
                  </div>
                  <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 leading-relaxed">
                    Aravanta CloudOS commits to delivering commercially reasonable availability for our core multi-tenant services across all provisioned Indian regions:
                  </p>
                  <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-brandObsidian-800">
                    <table className="w-full text-left text-xs sm:text-sm">
                      <thead className="bg-slate-100 dark:bg-brandObsidian-900 text-slate-700 dark:text-slate-300 font-mono text-[11px] uppercase tracking-wider border-b border-slate-200 dark:border-brandObsidian-800">
                        <tr>
                          <th className="p-3">Service Tier</th>
                          <th className="p-3">Monthly Uptime SLA</th>
                          <th className="p-3">Measurement Boundary</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200 dark:divide-brandObsidian-800 bg-white dark:bg-brandObsidian-950 text-slate-600 dark:text-slate-400">
                        <tr>
                          <td className="p-3 font-semibold text-slate-900 dark:text-white">Multi-Region Control Plane</td>
                          <td className="p-3 font-mono font-bold text-emerald-600 dark:text-emerald-400">99.99%</td>
                          <td className="p-3">REST APIs, CLI Gateway, IAM token verification, Scheduler</td>
                        </tr>
                        <tr>
                          <td className="p-3 font-semibold text-slate-900 dark:text-white">Managed Kubernetes (ArvK8s)</td>
                          <td className="p-3 font-mono font-bold text-emerald-600 dark:text-emerald-400">99.95%</td>
                          <td className="p-3">Control plane API server, etcd consensus, worker node scheduler</td>
                        </tr>
                        <tr>
                          <td className="p-3 font-semibold text-slate-900 dark:text-white">Distributed Object Storage (ArvS3)</td>
                          <td className="p-3 font-mono font-bold text-emerald-600 dark:text-emerald-400">99.99%</td>
                          <td className="p-3">Multi-AZ block durability (99.999999999%) and GET/PUT availability</td>
                        </tr>
                        <tr>
                          <td className="p-3 font-semibold text-slate-900 dark:text-white">Single-AZ Virtual Compute (VMs)</td>
                          <td className="p-3 font-mono font-bold text-emerald-600 dark:text-emerald-400">99.90%</td>
                          <td className="p-3">Hypervisor execution and block storage I/O availability</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    SLA calculations exclude announced scheduled maintenance (communicated 72 hours prior) and force majeure events.
                  </p>
                </div>

                {/* 3. Acceptable Use */}
                <div id="acceptable-use" className="scroll-mt-28 space-y-4">
                  <div className="flex items-center gap-3">
                    <span className="w-7 h-7 rounded-lg bg-brandGold-500/10 text-brandGold-600 dark:text-brandGold-400 font-mono text-xs font-bold flex items-center justify-center">
                      03
                    </span>
                    <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                      Acceptable Cloud Use Policy
                    </h2>
                  </div>
                  <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 leading-relaxed">
                    Aravanta CloudOS infrastructure is dedicated to legitimate commercial software workloads, web services, database hosting, and CI/CD pipelines. The following activities are strictly prohibited:
                  </p>
                  <div className="p-4 rounded-xl bg-rose-500/5 border border-rose-500/20 space-y-2 text-xs sm:text-sm text-slate-700 dark:text-slate-300">
                    <div className="flex items-center gap-2 text-rose-600 dark:text-rose-400 font-bold font-mono text-xs">
                      <Ban className="w-4 h-4" /> Zero-Tolerance Violations:
                    </div>
                    <ul className="space-y-1.5 list-disc list-inside text-xs sm:text-sm text-slate-600 dark:text-slate-400">
                      <li>Unauthorized cryptocurrency mining or unauthorized distributed cryptographic hashing.</li>
                      <li>Orchestration of Denial-of-Service (DoS/DDoS) attacks or port-scanning without written authorization.</li>
                      <li>Hosting or propagating malware, ransomware, botnet command nodes, or phishing infrastructure.</li>
                      <li>Circumvention of billing metrics, multi-tenant kernel boundaries, or network isolation rules.</li>
                    </ul>
                  </div>
                </div>

                {/* 4. Quotas & Rate Limits */}
                <div id="quotas-bursting" className="scroll-mt-28 space-y-4">
                  <div className="flex items-center gap-3">
                    <span className="w-7 h-7 rounded-lg bg-brandGold-500/10 text-brandGold-600 dark:text-brandGold-400 font-mono text-xs font-bold flex items-center justify-center">
                      04
                    </span>
                    <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                      Compute Quotas, Bursting &amp; API Rate Limits
                    </h2>
                  </div>
                  <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 leading-relaxed">
                    Each workspace is allocated resource quotas based on subscription tier:
                  </p>
                  <ul className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 space-y-1.5 list-disc list-inside">
                    <li><strong>Free Developer Tier:</strong> Up to 2 vCPUs, 4 GB RAM, 50 GB SSD storage, and 100 GB network egress/month. API rate limit: 120 requests/minute.</li>
                    <li><strong>Team Tier:</strong> Up to 64 vCPUs, 256 GB RAM, 2 TB SSD storage, and 2,000 requests/minute.</li>
                    <li><strong>Enterprise Tier:</strong> Custom quotas with dedicated hardware nodes, unmetered intra-region bandwidth, and dedicated API ingress routing.</li>
                  </ul>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    In the event of unpredicted traffic surges threatening hypervisor stability, Aravanta&apos;s adaptive control plane throttles non-critical control plane requests while safeguarding workload runtime.
                  </p>
                </div>

                {/* 5. Invoicing & GST */}
                <div id="billing-taxes" className="scroll-mt-28 space-y-4">
                  <div className="flex items-center gap-3">
                    <span className="w-7 h-7 rounded-lg bg-brandGold-500/10 text-brandGold-600 dark:text-brandGold-400 font-mono text-xs font-bold flex items-center justify-center">
                      05
                    </span>
                    <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                      Invoicing, Currency (INR/USD) &amp; GST Compliance
                    </h2>
                  </div>
                  <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 leading-relaxed">
                    All cloud resource consumption (vCPU-hours, GB-hours, DB-hours) is metered at 1-minute intervals and finalized on the 1st of every calendar month.
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs sm:text-sm">
                    <div className="p-4 rounded-xl border border-slate-200 dark:border-brandObsidian-800 bg-white dark:bg-brandObsidian-900 space-y-2">
                      <h4 className="font-bold text-slate-900 dark:text-white font-mono flex items-center gap-1.5">
                        <DollarSign className="w-4 h-4 text-brandGold-500" /> Indian Rupee (INR ₹) Billing
                      </h4>
                      <p className="text-slate-600 dark:text-slate-400 leading-relaxed text-xs">
                        Default invoicing for Indian enterprises is generated in INR (₹). Invoices include 18% Goods and Services Tax (CGST + SGST or IGST) with registered GSTINs eligible for Input Tax Credit.
                      </p>
                    </div>

                    <div className="p-4 rounded-xl border border-slate-200 dark:border-brandObsidian-800 bg-white dark:bg-brandObsidian-900 space-y-2">
                      <h4 className="font-bold text-slate-900 dark:text-white font-mono flex items-center gap-1.5">
                        <CreditCard className="w-4 h-4 text-brandGold-500" /> Payment Grace Period
                      </h4>
                      <p className="text-slate-600 dark:text-slate-400 leading-relaxed text-xs">
                        Failed invoice payments trigger automated retries over a 7-day grace period. Workloads are not halted immediately; administrative alerts are dispatched via email and webhooks.
                      </p>
                    </div>
                  </div>
                </div>

                {/* 6. Intellectual Property */}
                <div id="ip-ownership" className="scroll-mt-28 space-y-4">
                  <div className="flex items-center gap-3">
                    <span className="w-7 h-7 rounded-lg bg-brandGold-500/10 text-brandGold-600 dark:text-brandGold-400 font-mono text-xs font-bold flex items-center justify-center">
                      06
                    </span>
                    <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                      Intellectual Property &amp; Customer Workloads
                    </h2>
                  </div>
                  <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 leading-relaxed">
                    <strong>Your Ownership:</strong> You retain complete, unencumbered ownership of all software source code, database tables, Docker images, secret tokens, and algorithmic models deployed into your Aravanta Cloud OS workspace.
                  </p>
                  <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 leading-relaxed">
                    <strong>Platform Ownership:</strong> Aravanta retains all right, title, and interest in and to the Aravanta Cloud OS control plane, CLI binaries, API schemas, user interfaces, documentation, trademarks, and logos.
                  </p>
                </div>

                {/* 7. Suspension & Termination */}
                <div id="suspension-termination" className="scroll-mt-28 space-y-4">
                  <div className="flex items-center gap-3">
                    <span className="w-7 h-7 rounded-lg bg-brandGold-500/10 text-brandGold-600 dark:text-brandGold-400 font-mono text-xs font-bold flex items-center justify-center">
                      07
                    </span>
                    <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                      Suspension &amp; 14-Day Data Export Window
                    </h2>
                  </div>
                  <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 leading-relaxed">
                    You may terminate your workspace at any time via the console billing settings. Upon voluntary workspace cancellation or account deactivation:
                  </p>
                  <ul className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 space-y-2 list-disc list-inside">
                    <li>Active billing stops immediately for usage beyond the current billing cycle.</li>
                    <li>A <strong>14-day data export window</strong> is maintained during which you can download database dumps, snapshot images, and S3 bucket contents.</li>
                    <li>Following day 14, all allocated persistent disks, databases, and encryption keys are permanently sanitized using NIST SP 800-88 cryptographic overwrite protocols.</li>
                  </ul>
                </div>

                {/* 8. Limitation of Liability */}
                <div id="liability" className="scroll-mt-28 space-y-4">
                  <div className="flex items-center gap-3">
                    <span className="w-7 h-7 rounded-lg bg-brandGold-500/10 text-brandGold-600 dark:text-brandGold-400 font-mono text-xs font-bold flex items-center justify-center">
                      08
                    </span>
                    <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                      Limitation of Liability
                    </h2>
                  </div>
                  <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 leading-relaxed">
                    To the maximum extent permitted by applicable law, in no event shall Aravanta CloudOS Technologies Inc. or its directors, employees, or partners be liable for any indirect, punitive, incidental, special, or consequential damages, including loss of data or business interruption.
                  </p>
                  <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                    Aravanta&apos;s aggregate liability arising out of or related to these Terms of Use shall not exceed the total fees paid by you to Aravanta during the twelve (12) month period immediately preceding the event giving rise to liability.
                  </p>
                </div>

                {/* 9. Governing Law */}
                <div id="dispute-resolution" className="scroll-mt-28 space-y-4">
                  <div className="flex items-center gap-3">
                    <span className="w-7 h-7 rounded-lg bg-brandGold-500/10 text-brandGold-600 dark:text-brandGold-400 font-mono text-xs font-bold flex items-center justify-center">
                      09
                    </span>
                    <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                      Governing Law &amp; Bengaluru Arbitration
                    </h2>
                  </div>
                  <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 leading-relaxed">
                    These Terms shall be governed by and interpreted in accordance with the laws of India. Any controversy, dispute, or claim arising out of or in connection with these Terms shall first be submitted to good-faith mutual negotiations.
                  </p>
                  <Card className="border border-brandGold-500/30 bg-gradient-to-br from-brandGold-500/5 via-white to-white dark:via-brandObsidian-900 dark:to-brandObsidian-900">
                    <CardBody className="!p-6 space-y-2 text-xs sm:text-sm text-slate-600 dark:text-slate-400">
                      <p><strong>Arbitration Venue:</strong> Bengaluru, Karnataka, India.</p>
                      <p><strong>Arbitration Act:</strong> Conducted in accordance with the Arbitration and Conciliation Act, 1996, by a sole arbitrator mutually agreed upon.</p>
                      <p><strong>Language:</strong> The language of arbitration proceedings and all documentation shall be English.</p>
                    </CardBody>
                  </Card>
                </div>

                {/* Bottom Assistance Card */}
                <div className="pt-6 border-t border-slate-200 dark:border-brandObsidian-800">
                  <Card className="bg-slate-100 dark:bg-brandObsidian-900 border border-slate-200 dark:border-brandObsidian-700">
                    <CardBody className="!p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div>
                        <h4 className="text-base font-bold text-slate-900 dark:text-white">
                          Need custom SLA clauses or custom commercial invoicing?
                        </h4>
                        <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-1">
                          Speak with our enterprise legal and solutions architects.
                        </p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <Button
                          variant="primary"
                          size="md"
                          onClick={() => onNavigate?.('contact')}
                          className="bg-brandGold-500 hover:bg-brandGold-600 text-brandObsidian-950 font-bold"
                        >
                          Contact Sales
                        </Button>
                        <Button
                          variant="outline"
                          size="md"
                          onClick={() => onNavigate?.('faq')}
                        >
                          Read FAQ
                        </Button>
                      </div>
                    </CardBody>
                  </Card>
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
