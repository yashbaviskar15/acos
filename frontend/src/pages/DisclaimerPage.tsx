import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  AlertTriangle,
  Headphones,
  Printer,
  ChevronRight,
  Layers,
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
  { id: 'shared-responsibility', title: '1. Shared Responsibility Model' },
  { id: 'matrix-table', title: '2. Responsibilities Matrix Table' },
  { id: 'sla-boundaries', title: '3. Availability Targets & SLA Scope' },
  { id: 'disaster-recovery', title: '4. Disaster Recovery & Snapshot Duty' },
  { id: 'telemetry-metrics', title: '5. Telemetry & Real-Time FinOps Accuracy' },
  { id: 'upstream-transit', title: '6. Upstream Internet & Transit Carriers' },
  { id: 'support-hotline', title: '7. War-Room Emergency Support Protocol' },
];

export const DisclaimerPage: React.FC<PageProps> = ({
  onGoToLogin,
  onGoToRegister,
  onOpenCommandPalette,
  onNavigate,
}) => {
  const [activeSection, setActiveSection] = useState<string>('shared-responsibility');

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
        currentView="disclaimer"
      />

      <main>
        {/* Breadcrumb Header */}
        <section className="pt-6 pb-4 sm:pt-8">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <Breadcrumbs
              items={[
                { label: 'Platform', onClick: () => onNavigate?.('home') },
                { label: 'Legal & Governance' },
                { label: 'Platform Disclaimer' },
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
                    Operational Boundary Notice
                  </Badge>
                  <Badge variant="outline" size="sm" className="font-mono">
                    Shared Responsibility Matrix v2.4
                  </Badge>
                </div>
                <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-slate-900 dark:text-white">
                  Platform Disclaimer &amp; Shared Responsibility Matrix
                </h1>
                <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 leading-relaxed">
                  Clarifying the operational scope, infrastructure boundary lines, liability limitations, and customer engineering duties across Aravanta Cloud OS.
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
                  leftIcon={<Headphones className="w-4 h-4" />}
                >
                  Contact SRE Support
                </Button>
              </div>
            </div>

            {/* Critical Alert Banner */}
            <div className="mt-8 p-4 sm:p-5 rounded-2xl bg-brandGold-500/10 border border-brandGold-500/25 flex items-start gap-3.5">
              <AlertTriangle className="w-5 h-5 text-brandGold-600 dark:text-brandGold-400 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <h4 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white font-mono uppercase tracking-wider">
                  Important Architectural Guidance
                </h4>
                <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                  Aravanta Cloud OS provides enterprise-grade high availability (99.99% multi-region control plane). However, production mission-critical workloads must be architected across multiple Availability Zones with automated cross-region snapshot replication. Single-instance workloads without backups are susceptible to localized hardware failures.
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
                    <Layers className="w-4 h-4 text-brandGold-600 dark:text-brandGold-400" />
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white font-mono">
                      Disclaimer Contents
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

                {/* Status Box */}
                <div className="p-5 rounded-2xl border border-slate-200 dark:border-brandObsidian-800 bg-white dark:bg-brandObsidian-900 space-y-2 text-xs">
                  <h4 className="font-bold text-slate-900 dark:text-white font-mono uppercase tracking-wider">
                    Live Operational Status
                  </h4>
                  <p className="text-slate-600 dark:text-slate-400">
                    Check real-time control plane health, latency, and incident reports at{' '}
                    <a
                      href="https://status.aravanta.cloud"
                      target="_blank"
                      rel="noreferrer"
                      className="text-brandGold-600 dark:text-brandGold-400 font-mono underline"
                    >
                      status.aravanta.cloud
                    </a>.
                  </p>
                </div>
              </div>

              {/* Right Column: Detailed Clauses */}
              <div className="lg:col-span-8 space-y-10">
                {/* 1. Shared Responsibility Model */}
                <div id="shared-responsibility" className="scroll-mt-28 space-y-4">
                  <div className="flex items-center gap-3">
                    <span className="w-7 h-7 rounded-lg bg-brandGold-500/10 text-brandGold-600 dark:text-brandGold-400 font-mono text-xs font-bold flex items-center justify-center">
                      01
                    </span>
                    <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                      The Shared Responsibility Model
                    </h2>
                  </div>
                  <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 leading-relaxed">
                    Security and operational resilience in Aravanta Cloud OS is a shared responsibility between Aravanta and the customer. This model differentiates between <strong>Security OF the Cloud</strong> (managed by Aravanta) and <strong>Security IN the Cloud</strong> (managed by the customer).
                  </p>
                </div>

                {/* 2. Responsibilities Matrix Table */}
                <div id="matrix-table" className="scroll-mt-28 space-y-4">
                  <div className="flex items-center gap-3">
                    <span className="w-7 h-7 rounded-lg bg-brandGold-500/10 text-brandGold-600 dark:text-brandGold-400 font-mono text-xs font-bold flex items-center justify-center">
                      02
                    </span>
                    <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                      Responsibility Matrix Table
                    </h2>
                  </div>

                  {/* Responsive Matrix */}
                  <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-brandObsidian-800">
                    <table className="w-full text-left text-xs sm:text-sm">
                      <thead className="bg-slate-100 dark:bg-brandObsidian-900 text-slate-700 dark:text-slate-300 font-mono text-[11px] uppercase tracking-wider border-b border-slate-200 dark:border-brandObsidian-800">
                        <tr>
                          <th className="p-3">Architectural Domain</th>
                          <th className="p-3">Aravanta Managed (OF the Cloud)</th>
                          <th className="p-3">Customer Managed (IN the Cloud)</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200 dark:divide-brandObsidian-800 bg-white dark:bg-brandObsidian-950 text-slate-600 dark:text-slate-400">
                        <tr>
                          <td className="p-3 font-semibold text-slate-900 dark:text-white">Physical Datacenter Facilities</td>
                          <td className="p-3 text-emerald-600 dark:text-emerald-400 font-medium">Physical biometric cages, generators, dual power feeds, HVAC cooling</td>
                          <td className="p-3 text-slate-400">No customer obligation</td>
                        </tr>
                        <tr>
                          <td className="p-3 font-semibold text-slate-900 dark:text-white">Virtualization &amp; Hypervisors</td>
                          <td className="p-3 text-emerald-600 dark:text-emerald-400 font-medium">KVM kernel patching, host isolation, CPU microcode updates</td>
                          <td className="p-3 text-slate-400">No customer obligation</td>
                        </tr>
                        <tr>
                          <td className="p-3 font-semibold text-slate-900 dark:text-white">Kubernetes Control Plane</td>
                          <td className="p-3 text-emerald-600 dark:text-emerald-400 font-medium">etcd backups, API server HA, scheduler scaling</td>
                          <td className="p-3 text-amber-600 dark:text-amber-400 font-medium">Pod resource requests/limits, Helm charts, CRDs</td>
                        </tr>
                        <tr>
                          <td className="p-3 font-semibold text-slate-900 dark:text-white">Application Code &amp; Binaries</td>
                          <td className="p-3 text-slate-400">No inspection or tampering</td>
                          <td className="p-3 text-amber-600 dark:text-amber-400 font-medium">Source code security, dependencies, zero-day patching</td>
                        </tr>
                        <tr>
                          <td className="p-3 font-semibold text-slate-900 dark:text-white">Identity, Keys &amp; RBAC</td>
                          <td className="p-3 text-emerald-600 dark:text-emerald-400 font-medium">TOTP MFA engine, cryptographic token generation</td>
                          <td className="p-3 text-amber-600 dark:text-amber-400 font-medium">SSH key safeguarding, token rotation, user role assignments</td>
                        </tr>
                        <tr>
                          <td className="p-3 font-semibold text-slate-900 dark:text-white">Database Data &amp; Schema</td>
                          <td className="p-3 text-emerald-600 dark:text-emerald-400 font-medium">Engine binary upgrades, automated disk volume snapshots</td>
                          <td className="p-3 text-amber-600 dark:text-amber-400 font-medium">Database schema design, query optimization, logical backups</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* 3. Availability Targets */}
                <div id="sla-boundaries" className="scroll-mt-28 space-y-4">
                  <div className="flex items-center gap-3">
                    <span className="w-7 h-7 rounded-lg bg-brandGold-500/10 text-brandGold-600 dark:text-brandGold-400 font-mono text-xs font-bold flex items-center justify-center">
                      03
                    </span>
                    <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                      Availability Targets &amp; SLA Measurement Scope
                    </h2>
                  </div>
                  <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 leading-relaxed">
                    Aravanta targets 99.99% multi-region control plane availability. Individual compute instances, container pods, and databases remain subject to planned maintenance windows and hardware lifecycle maintenance.
                  </p>
                  <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                    Planned maintenance is communicated at least 72 hours in advance via status notifications. Emergency security updates (such as zero-day Linux kernel vulnerability patches) may be applied with shorter notice to protect cluster integrity.
                  </p>
                </div>

                {/* 4. Disaster Recovery & Snapshot Duty */}
                <div id="disaster-recovery" className="scroll-mt-28 space-y-4">
                  <div className="flex items-center gap-3">
                    <span className="w-7 h-7 rounded-lg bg-brandGold-500/10 text-brandGold-600 dark:text-brandGold-400 font-mono text-xs font-bold flex items-center justify-center">
                      04
                    </span>
                    <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                      Disaster Recovery &amp; Customer Snapshot Duty
                    </h2>
                  </div>
                  <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 leading-relaxed">
                    While Aravanta provides 1-click snapshot creation and cross-region S3 replication, customers operating production environments are strictly responsible for defining their own Recovery Point Objective (RPO) and Recovery Time Objective (RTO).
                  </p>
                  <div className="p-4 rounded-xl border border-slate-200 dark:border-brandObsidian-800 bg-white dark:bg-brandObsidian-900 space-y-2 text-xs sm:text-sm text-slate-600 dark:text-slate-400">
                    <p>Aravanta is not liable for data destruction caused by:</p>
                    <ul className="list-disc list-inside space-y-1">
                      <li>Customer-initiated volume deletion or accidental bucket purge commands.</li>
                      <li>Compromised administrative credentials or API tokens leaked in public Git repositories.</li>
                      <li>Application-level ransomware or malicious database DROP TABLE queries.</li>
                    </ul>
                  </div>
                </div>

                {/* 5. Telemetry & Metrics Precision */}
                <div id="telemetry-metrics" className="scroll-mt-28 space-y-4">
                  <div className="flex items-center gap-3">
                    <span className="w-7 h-7 rounded-lg bg-brandGold-500/10 text-brandGold-600 dark:text-brandGold-400 font-mono text-xs font-bold flex items-center justify-center">
                      05
                    </span>
                    <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                      Telemetry &amp; Real-Time FinOps Precision
                    </h2>
                  </div>
                  <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 leading-relaxed">
                    Dashboard telemetry, CPU load graphs, RAM utilization metrics, and live cost counters are streamed with sub-second polling frequencies on a best-effort basis.
                  </p>
                  <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                    Real-time FinOps projections reflect immediate usage but should be cross-referenced with your official monthly finalized invoice generated on the 1st of every month for audited accounting purposes.
                  </p>
                </div>

                {/* 6. Upstream Internet & Transit Carriers */}
                <div id="upstream-transit" className="scroll-mt-28 space-y-4">
                  <div className="flex items-center gap-3">
                    <span className="w-7 h-7 rounded-lg bg-brandGold-500/10 text-brandGold-600 dark:text-brandGold-400 font-mono text-xs font-bold flex items-center justify-center">
                      06
                    </span>
                    <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                      Upstream Internet &amp; Transit Carriers
                    </h2>
                  </div>
                  <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 leading-relaxed">
                    Aravanta peers with major Tier-1 telecommunication carriers (Tata Communications, Bharti Airtel) and the National Internet Exchange of India (NIXI). Aravanta cannot be held responsible for packet loss, latency spikes, or regional outages caused by external fiber cable cuts or third-party DNS routing issues outside Aravanta&apos;s autonomous system (AS).
                  </p>
                </div>

                {/* 7. War-Room Emergency Support */}
                <div id="support-hotline" className="scroll-mt-28 space-y-4">
                  <div className="flex items-center gap-3">
                    <span className="w-7 h-7 rounded-lg bg-brandGold-500/10 text-brandGold-600 dark:text-brandGold-400 font-mono text-xs font-bold flex items-center justify-center">
                      07
                    </span>
                    <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                      Production P1 War-Room Emergency Support Protocol
                    </h2>
                  </div>
                  <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 leading-relaxed">
                    For enterprise customers experiencing critical Severity-1 production outages (complete control plane unavailability or multi-node failure):
                  </p>
                  <Card className="border border-brandGold-500/30 bg-gradient-to-br from-brandGold-500/5 via-white to-white dark:via-brandObsidian-900 dark:to-brandObsidian-900">
                    <CardBody className="!p-6 space-y-3">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs sm:text-sm">
                        <div>
                          <p className="text-slate-500 dark:text-slate-400 text-xs font-mono uppercase">24x7 War-Room Hotline</p>
                          <p className="font-mono text-lg font-bold text-brandGold-600 dark:text-brandGold-400 mt-0.5">+91 80 4567 8999</p>
                          <p className="text-slate-500 dark:text-slate-400 text-xs mt-1">Dedicated to P1 incidents with active Enterprise SLA</p>
                        </div>
                        <div>
                          <p className="text-slate-500 dark:text-slate-400 text-xs font-mono uppercase">Electronic Triage</p>
                          <p className="font-mono font-bold text-slate-900 dark:text-white mt-0.5">support@aravanta.cloud</p>
                          <p className="text-slate-500 dark:text-slate-400 text-xs mt-1">Include Workspace ID, Resource UUID, and traceroute</p>
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
                          Questions about multi-zone architecture?
                        </h4>
                        <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-1">
                          Our solutions architects assist enterprise teams with high-availability disaster recovery setups.
                        </p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <Button
                          variant="primary"
                          size="md"
                          onClick={() => onNavigate?.('contact')}
                          className="bg-brandGold-500 hover:bg-brandGold-600 text-brandObsidian-950 font-bold"
                        >
                          Contact SRE Team
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
