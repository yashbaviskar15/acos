import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Shield,
  Lock,
  Server,
  UserCheck,
  Mail,
  FileText,
  Printer,
  ChevronRight,
  Cpu,
  HardDrive,
  Key,
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
  { id: 'scope', title: '1. Scope & Sovereign Architecture' },
  { id: 'ownership', title: '2. Customer Workload Ownership' },
  { id: 'data-collection', title: '3. Information Collected & Legal Basis' },
  { id: 'security-crypto', title: '4. Cryptographic Security Standards' },
  { id: 'residency', title: '5. Data Residency & Datacenters' },
  { id: 'retention-wiping', title: '6. Retention & Sanitization Lifecycle' },
  { id: 'dpdpa-rights', title: '7. DPDPA 2023 & Sovereign Rights' },
  { id: 'subprocessors', title: '8. Upstream Infrastructure Partners' },
  { id: 'dpo-contact', title: '9. Grievance & DPO Office' },
];

export const PrivacyPolicyPage: React.FC<PageProps> = ({
  onGoToLogin,
  onGoToRegister,
  onOpenCommandPalette,
  onNavigate,
}) => {
  const [activeSection, setActiveSection] = useState<string>('scope');

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
        currentView="privacy"
      />

      <main>
        {/* Breadcrumb Header */}
        <section className="pt-6 pb-4 sm:pt-8">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <Breadcrumbs
              items={[
                { label: 'Platform', onClick: () => onNavigate?.('home') },
                { label: 'Legal & Governance' },
                { label: 'Privacy Policy' },
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
                    Version 2.4.0 (DPDPA Aligned)
                  </Badge>
                  <span className="text-xs text-slate-500 dark:text-slate-400 font-mono">
                    Doc ID: ACOS-POL-PRIV-2026-V2
                  </span>
                </div>
                <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-slate-900 dark:text-white">
                  Privacy Policy &amp; Sovereign Data Governance
                </h1>
                <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 leading-relaxed">
                  Aravanta CloudOS is engineered for complete cryptographic tenant isolation, zero workload telemetry inspection, and strict adherence to India&apos;s Digital Personal Data Protection Act (DPDPA 2023) and global sovereign data privacy standards.
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
                  leftIcon={<Mail className="w-4 h-4" />}
                >
                  Contact DPO
                </Button>
              </div>
            </div>

            {/* Quick Guarantees Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-8">
              <div className="p-4 rounded-2xl border border-slate-200 dark:border-brandObsidian-800 bg-white dark:bg-brandObsidian-900/80 shadow-xs space-y-1.5">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold">
                  <Lock className="w-4 h-4" />
                </div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white font-mono">
                  100% Workload Ownership
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                  You own all containers, disks, databases, and memory dumps. We never inspect customer code.
                </p>
              </div>

              <div className="p-4 rounded-2xl border border-slate-200 dark:border-brandObsidian-800 bg-white dark:bg-brandObsidian-900/80 shadow-xs space-y-1.5">
                <div className="w-8 h-8 rounded-lg bg-brandGold-500/10 text-brandGold-600 dark:text-brandGold-400 flex items-center justify-center font-bold">
                  <Shield className="w-4 h-4" />
                </div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white font-mono">
                  Zero AI Model Training
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                  Your tenant code, logs, and database records are never used to train internal or third-party AI models.
                </p>
              </div>

              <div className="p-4 rounded-2xl border border-slate-200 dark:border-brandObsidian-800 bg-white dark:bg-brandObsidian-900/80 shadow-xs space-y-1.5">
                <div className="w-8 h-8 rounded-lg bg-sky-500/10 text-sky-600 dark:text-sky-400 flex items-center justify-center font-bold">
                  <Server className="w-4 h-4" />
                </div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white font-mono">
                  Sovereign Residency
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                  Tier-4 datacenters in Mumbai (ap-south-1) and Chennai. Zero cross-border data transfer without consent.
                </p>
              </div>

              <div className="p-4 rounded-2xl border border-slate-200 dark:border-brandObsidian-800 bg-white dark:bg-brandObsidian-900/80 shadow-xs space-y-1.5">
                <div className="w-8 h-8 rounded-lg bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center font-bold">
                  <Key className="w-4 h-4" />
                </div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white font-mono">
                  Cryptographic Wiping
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                  NIST SP 800-88 block-level zero sanitization upon instance destruction or tenant termination.
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
                    <FileText className="w-4 h-4 text-brandGold-600 dark:text-brandGold-400" />
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white font-mono">
                      Policy Table of Contents
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

                {/* DPA Request Card */}
                <Card goldAccent className="hidden lg:block">
                  <CardBody className="!p-5 space-y-3">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white font-mono">
                      Enterprise DPA Available
                    </h4>
                    <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                      Organizations operating under statutory audits can execute an enterprise Data Processing Addendum (DPA) incorporating standard contractual clauses.
                    </p>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onNavigate?.('contact')}
                      className="w-full text-xs"
                    >
                      Request Sovereign DPA
                    </Button>
                  </CardBody>
                </Card>
              </div>

              {/* Right Column: Detailed Sections */}
              <div className="lg:col-span-8 space-y-10">
                {/* 1. Scope & Architecture */}
                <div id="scope" className="scroll-mt-28 space-y-4">
                  <div className="flex items-center gap-3">
                    <span className="w-7 h-7 rounded-lg bg-brandGold-500/10 text-brandGold-600 dark:text-brandGold-400 font-mono text-xs font-bold flex items-center justify-center">
                      01
                    </span>
                    <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                      Scope &amp; Sovereign Architecture
                    </h2>
                  </div>
                  <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 leading-relaxed">
                    This Privacy Policy governs the collection, processing, storage, and isolation of personal data and operational telemetry across the Aravanta Cloud OS control plane, CLI (<code className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-brandObsidian-800 text-xs font-mono">arv</code>), REST APIs, and managed infrastructure services operated by Aravanta CloudOS Technologies Inc. (&quot;Aravanta&quot;, &quot;we&quot;, &quot;our&quot;).
                  </p>
                  <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 leading-relaxed">
                    Aravanta operates strictly as a <strong>Data Processor</strong> with respect to customer application workloads, container images, and database contents. Our customers act as the <strong>Data Fiduciary</strong> (under India&apos;s DPDPA 2023) or <strong>Data Controller</strong> (under GDPR) and determine the purposes and means of processing personal data within their provisioned cloud infrastructure.
                  </p>
                </div>

                {/* 2. Customer Workload Ownership */}
                <div id="ownership" className="scroll-mt-28 space-y-4">
                  <div className="flex items-center gap-3">
                    <span className="w-7 h-7 rounded-lg bg-brandGold-500/10 text-brandGold-600 dark:text-brandGold-400 font-mono text-xs font-bold flex items-center justify-center">
                      02
                    </span>
                    <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                      Customer Workload Ownership &amp; Isolation
                    </h2>
                  </div>
                  <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 leading-relaxed">
                    You retain 100% intellectual property, title, and operational ownership of all applications, container workloads, database schemas, object storage buckets (ArvS3), and files deployed on Aravanta CloudOS.
                  </p>
                  <div className="p-4 rounded-xl bg-slate-100 dark:bg-brandObsidian-900 border border-slate-200 dark:border-brandObsidian-800 space-y-2">
                    <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase font-mono tracking-wider">
                      Workload Isolation Commitments:
                    </h4>
                    <ul className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 space-y-1.5 list-disc list-inside">
                      <li>We never monetize, inspect, index, or sell your customer workload data.</li>
                      <li>We never train foundational language models or generative AI engines on your source code or database records.</li>
                      <li>Multi-tenant isolation is enforced at the hypervisor (KVM/QEMU) and network namespace (VXLAN/eBPF) layers.</li>
                      <li>Administrative staff access to hypervisor hosts is audited via immutable append-only telemetry and requires dual-key authorization.</li>
                    </ul>
                  </div>
                </div>

                {/* 3. Information Collected & Legal Basis */}
                <div id="data-collection" className="scroll-mt-28 space-y-4">
                  <div className="flex items-center gap-3">
                    <span className="w-7 h-7 rounded-lg bg-brandGold-500/10 text-brandGold-600 dark:text-brandGold-400 font-mono text-xs font-bold flex items-center justify-center">
                      03
                    </span>
                    <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                      Information Collected &amp; Legal Basis
                    </h2>
                  </div>
                  <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 leading-relaxed">
                    We collect only the minimum telemetry and identity records required to deliver multi-tenant cloud orchestration, billing accuracy, and system resilience.
                  </p>

                  {/* Responsive Table */}
                  <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-brandObsidian-800">
                    <table className="w-full text-left text-xs sm:text-sm">
                      <thead className="bg-slate-100 dark:bg-brandObsidian-900 text-slate-700 dark:text-slate-300 font-mono text-[11px] uppercase tracking-wider border-b border-slate-200 dark:border-brandObsidian-800">
                        <tr>
                          <th className="p-3">Data Category</th>
                          <th className="p-3">Specific Data Elements</th>
                          <th className="p-3">Processing Purpose</th>
                          <th className="p-3">Legal Basis</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200 dark:divide-brandObsidian-800 bg-white dark:bg-brandObsidian-950 text-slate-600 dark:text-slate-400">
                        <tr>
                          <td className="p-3 font-semibold text-slate-900 dark:text-white">Account &amp; Identity</td>
                          <td className="p-3">Full name, business email, organization name, Argon2id hashed password, TOTP seed</td>
                          <td className="p-3">Authentication, session control, RBAC enforcement</td>
                          <td className="p-3 font-mono text-[11px]">Contract Performance</td>
                        </tr>
                        <tr>
                          <td className="p-3 font-semibold text-slate-900 dark:text-white">Billing &amp; Tax</td>
                          <td className="p-3">Billing address, GSTIN / VAT ID, PCI-DSS compliant payment token from payment gateway</td>
                          <td className="p-3">Invoicing, GST compliance, credit management</td>
                          <td className="p-3 font-mono text-[11px]">Legal Obligation</td>
                        </tr>
                        <tr>
                          <td className="p-3 font-semibold text-slate-900 dark:text-white">Infrastructure Telemetry</td>
                          <td className="p-3">vCPU load, RAM consumption, disk I/O, network bytes, API request latency</td>
                          <td className="p-3">Autoscaling, FinOps billing metrics, SLA monitoring</td>
                          <td className="p-3 font-mono text-[11px]">Legitimate Interest</td>
                        </tr>
                        <tr>
                          <td className="p-3 font-semibold text-slate-900 dark:text-white">Audit &amp; Security Logs</td>
                          <td className="p-3">Source IP address, user-agent string, API endpoint invoked, TLS cipher negotiated</td>
                          <td className="p-3">DDoS mitigation, incident response, fraud prevention</td>
                          <td className="p-3 font-mono text-[11px]">Legitimate Security</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* 4. Cryptographic Security Standards */}
                <div id="security-crypto" className="scroll-mt-28 space-y-4">
                  <div className="flex items-center gap-3">
                    <span className="w-7 h-7 rounded-lg bg-brandGold-500/10 text-brandGold-600 dark:text-brandGold-400 font-mono text-xs font-bold flex items-center justify-center">
                      04
                    </span>
                    <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                      Cryptographic Security Standards
                    </h2>
                  </div>
                  <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 leading-relaxed">
                    Aravanta implements defense-in-depth cryptographic controls aligned with NIST and ISO 27001 best practices:
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="p-4 rounded-xl border border-slate-200 dark:border-brandObsidian-800 bg-white dark:bg-brandObsidian-900 space-y-2">
                      <div className="flex items-center gap-2 text-brandGold-600 dark:text-brandGold-400 font-mono text-xs font-bold">
                        <Lock className="w-4 h-4" /> Data at Rest
                      </div>
                      <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                        All NVMe block storage volumes, object storage buckets (ArvS3), and database clusters are encrypted using AES-256-GCM. Keys are managed through customer-isolated hardware security modules (HSMs).
                      </p>
                    </div>

                    <div className="p-4 rounded-xl border border-slate-200 dark:border-brandObsidian-800 bg-white dark:bg-brandObsidian-900 space-y-2">
                      <div className="flex items-center gap-2 text-brandGold-600 dark:text-brandGold-400 font-mono text-xs font-bold">
                        <Cpu className="w-4 h-4" /> Data in Transit
                      </div>
                      <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                        100% of ingress and internal service mesh traffic is secured with TLS 1.3 using elliptic curve cryptography (ECDHE-ECDSA) and Perfect Forward Secrecy (PFS). Plain HTTP is rejected.
                      </p>
                    </div>

                    <div className="p-4 rounded-xl border border-slate-200 dark:border-brandObsidian-800 bg-white dark:bg-brandObsidian-900 space-y-2">
                      <div className="flex items-center gap-2 text-brandGold-600 dark:text-brandGold-400 font-mono text-xs font-bold">
                        <UserCheck className="w-4 h-4" /> Identity &amp; MFA
                      </div>
                      <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                        Multi-Factor Authentication (RFC 6238 TOTP) is enforced on all workspace owner and administrative accounts. API tokens utilize SHA-256 salted hashes with automatic expiry.
                      </p>
                    </div>

                    <div className="p-4 rounded-xl border border-slate-200 dark:border-brandObsidian-800 bg-white dark:bg-brandObsidian-900 space-y-2">
                      <div className="flex items-center gap-2 text-brandGold-600 dark:text-brandGold-400 font-mono text-xs font-bold">
                        <HardDrive className="w-4 h-4" /> Immutable Audit Trails
                      </div>
                      <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                        Every control plane interaction is signed and recorded into write-once-read-many (WORM) audit logs, preserved for 365 days on Enterprise plans for regulatory compliance.
                      </p>
                    </div>
                  </div>
                </div>

                {/* 5. Data Residency & Datacenters */}
                <div id="residency" className="scroll-mt-28 space-y-4">
                  <div className="flex items-center gap-3">
                    <span className="w-7 h-7 rounded-lg bg-brandGold-500/10 text-brandGold-600 dark:text-brandGold-400 font-mono text-xs font-bold flex items-center justify-center">
                      05
                    </span>
                    <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                      Data Residency &amp; Sovereign Datacenters
                    </h2>
                  </div>
                  <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 leading-relaxed">
                    Aravanta CloudOS is architected to guarantee national data sovereignty. Primary clusters are housed in sovereign Tier-4 datacenters within India:
                  </p>
                  <ul className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 space-y-2 list-disc list-inside">
                    <li><strong>ap-south-1 (Mumbai Region):</strong> Primary production control plane, high-availability Kubernetes control plane, multi-AZ ArvS3 object storage, and managed Postgres/Redis clusters.</li>
                    <li><strong>ap-south-2 (Chennai Region):</strong> Disaster recovery node, block storage replication target, and redundant ingress edge transit.</li>
                    <li><strong>eu-central-1 &amp; us-east-1 (Optional Global Edge Nodes):</strong> Available for enterprise clients with cross-border latency requirements, strictly governed by mutual consent.</li>
                  </ul>
                  <p className="text-xs text-slate-500 dark:text-slate-400 italic">
                    By default, all customer compute instances, storage volumes, and telemetry records are pinned to Indian territory and are never transmitted outside India without customer API instruction.
                  </p>
                </div>

                {/* 6. Retention & Sanitization Lifecycle */}
                <div id="retention-wiping" className="scroll-mt-28 space-y-4">
                  <div className="flex items-center gap-3">
                    <span className="w-7 h-7 rounded-lg bg-brandGold-500/10 text-brandGold-600 dark:text-brandGold-400 font-mono text-xs font-bold flex items-center justify-center">
                      06
                    </span>
                    <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                      Data Retention &amp; Cryptographic Sanitization Lifecycle
                    </h2>
                  </div>
                  <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 leading-relaxed">
                    We retain personal account records only for the duration of your active subscription and statutory tax retention periods:
                  </p>
                  <div className="p-4 rounded-xl border border-slate-200 dark:border-brandObsidian-800 bg-white dark:bg-brandObsidian-900 space-y-2 text-xs sm:text-sm text-slate-600 dark:text-slate-400">
                    <p><strong>Account Deletion:</strong> Upon workspace cancellation, you are granted a 14-day grace period to export database dumps and S3 objects. After 14 days, all associated resources enter the automated destruction pipeline.</p>
                    <p><strong>Cryptographic Sanitization:</strong> In compliance with NIST SP 800-88 Rev. 1 (Guidelines for Media Sanitization) and DoD 5220.22-M standards, all virtual disks and RAM blocks allocated to destroyed instances undergo zero-fill overwrites before reallocation to any other tenant.</p>
                    <p><strong>Tax &amp; Invoicing Records:</strong> GST invoices and transaction receipts are retained for 7 years to satisfy statutory requirements under the Central Goods and Services Tax Act, 2017.</p>
                  </div>
                </div>

                {/* 7. DPDPA 2023 & Sovereign Rights */}
                <div id="dpdpa-rights" className="scroll-mt-28 space-y-4">
                  <div className="flex items-center gap-3">
                    <span className="w-7 h-7 rounded-lg bg-brandGold-500/10 text-brandGold-600 dark:text-brandGold-400 font-mono text-xs font-bold flex items-center justify-center">
                      07
                    </span>
                    <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                      Your Rights Under DPDPA 2023 &amp; GDPR
                    </h2>
                  </div>
                  <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 leading-relaxed">
                    Under the Digital Personal Data Protection Act, 2023, you enjoy clear rights as a Data Principal:
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs sm:text-sm">
                    <div className="p-3.5 rounded-xl bg-slate-100 dark:bg-brandObsidian-900/60 border border-slate-200 dark:border-brandObsidian-800">
                      <span className="font-bold text-slate-900 dark:text-white block mb-1">Right to Access &amp; Summary</span>
                      Review the categories of personal data processed and processing history.
                    </div>
                    <div className="p-3.5 rounded-xl bg-slate-100 dark:bg-brandObsidian-900/60 border border-slate-200 dark:border-brandObsidian-800">
                      <span className="font-bold text-slate-900 dark:text-white block mb-1">Right to Correction &amp; Erasure</span>
                      Update inaccurate profile records or request permanent deletion of your account.
                    </div>
                    <div className="p-3.5 rounded-xl bg-slate-100 dark:bg-brandObsidian-900/60 border border-slate-200 dark:border-brandObsidian-800">
                      <span className="font-bold text-slate-900 dark:text-white block mb-1">Right of Grievance Redressal</span>
                      Lodge complaints with our Grievance Officer with guaranteed 24-hour turnaround.
                    </div>
                    <div className="p-3.5 rounded-xl bg-slate-100 dark:bg-brandObsidian-900/60 border border-slate-200 dark:border-brandObsidian-800">
                      <span className="font-bold text-slate-900 dark:text-white block mb-1">Right to Nominate</span>
                      Designate an authorized representative to exercise rights on your behalf.
                    </div>
                  </div>
                </div>

                {/* 8. Subprocessors */}
                <div id="subprocessors" className="scroll-mt-28 space-y-4">
                  <div className="flex items-center gap-3">
                    <span className="w-7 h-7 rounded-lg bg-brandGold-500/10 text-brandGold-600 dark:text-brandGold-400 font-mono text-xs font-bold flex items-center justify-center">
                      08
                    </span>
                    <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                      Upstream Infrastructure Partners &amp; Sub-processors
                    </h2>
                  </div>
                  <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 leading-relaxed">
                    We maintain strict legal agreements with Tier-4 datacenter providers and transit carriers:
                  </p>
                  <ul className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 space-y-1.5 list-disc list-inside">
                    <li><strong>Facility Partners:</strong> Equinix (Mumbai) &amp; CtrlS (Bengaluru/Hyderabad) for physical cage security, dual uninterruptible power supplies, and biometric access.</li>
                    <li><strong>Payment Gateways:</strong> RBI-authorized payment aggregators (Razorpay / Stripe) operating under PCI-DSS Level 1 certification.</li>
                    <li><strong>Transit Carriers:</strong> Tata Communications &amp; Bharti Airtel for sovereign Indian Internet exchange routing.</li>
                  </ul>
                </div>

                {/* 9. Grievance & DPO Office */}
                <div id="dpo-contact" className="scroll-mt-28 space-y-4">
                  <div className="flex items-center gap-3">
                    <span className="w-7 h-7 rounded-lg bg-brandGold-500/10 text-brandGold-600 dark:text-brandGold-400 font-mono text-xs font-bold flex items-center justify-center">
                      09
                    </span>
                    <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                      Grievance Officer &amp; Data Protection Office
                    </h2>
                  </div>
                  <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 leading-relaxed">
                    In accordance with the Information Technology Act, 2000, and the Digital Personal Data Protection Act, 2023, the details of our appointed Grievance Officer and Data Protection Office are provided below:
                  </p>
                  <Card className="border border-brandGold-500/30 bg-gradient-to-br from-brandGold-500/5 via-white to-white dark:via-brandObsidian-900 dark:to-brandObsidian-900">
                    <CardBody className="!p-6 space-y-3">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs sm:text-sm">
                        <div>
                          <p className="text-slate-500 dark:text-slate-400 text-xs font-mono uppercase">Designated Office</p>
                          <p className="font-bold text-slate-900 dark:text-white mt-0.5">Office of the Data Protection Officer</p>
                          <p className="text-slate-600 dark:text-slate-400 mt-1">
                            Aravanta CloudOS Technologies Inc.<br />
                            HSR Layout, Sector 2, Bengaluru 560102<br />
                            Karnataka, India
                          </p>
                        </div>
                        <div className="space-y-2">
                          <div>
                            <p className="text-slate-500 dark:text-slate-400 text-xs font-mono uppercase">Direct Electronic Mail</p>
                            <a href="mailto:privacy@aravanta.cloud" className="font-mono text-brandGold-600 dark:text-brandGold-400 font-semibold hover:underline">
                              privacy@aravanta.cloud
                            </a>
                          </div>
                          <div>
                            <p className="text-slate-500 dark:text-slate-400 text-xs font-mono uppercase">Legal Escalations</p>
                            <a href="mailto:legal@aravanta.cloud" className="font-mono text-brandGold-600 dark:text-brandGold-400 font-semibold hover:underline">
                              legal@aravanta.cloud
                            </a>
                          </div>
                          <div>
                            <p className="text-slate-500 dark:text-slate-400 text-xs font-mono uppercase">Statutory Response SLA</p>
                            <p className="text-slate-700 dark:text-slate-300 font-medium">Under 24 business hours</p>
                          </div>
                        </div>
                      </div>
                    </CardBody>
                  </Card>
                </div>

                {/* Bottom Assistance Card */}
                <div className="pt-6 border-t border-slate-200 dark:border-brandObsidian-800">
                  <Card className="bg-slate-100 dark:bg-brandObsidian-900 border border-slate-200 dark:border-brandObsidian-700">
                    <CardBody className="!p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div>
                        <h4 className="text-base font-bold text-slate-900 dark:text-white">
                          Looking for our acceptable usage or service boundaries?
                        </h4>
                        <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-1">
                          Review our Terms of Use and Platform SLA disclaimers.
                        </p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <Button
                          variant="outline"
                          size="md"
                          onClick={() => onNavigate?.('terms')}
                        >
                          Terms of Use
                        </Button>
                        <Button
                          variant="outline"
                          size="md"
                          onClick={() => onNavigate?.('disclaimer')}
                        >
                          Disclaimer
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
