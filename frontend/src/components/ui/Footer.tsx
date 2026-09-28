import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Twitter,
  Linkedin,
  Github,
  Mail,
  ChevronDown,
  Users,
  Shield,
  Globe,
  MessageSquare,
  Server,
  ExternalLink,
  Radio,
  CheckCircle2,
  Send,
  Lock,
  ArrowUp,
  Sparkles,
  Terminal,
  Rocket,
  Layers,
  Cpu,
  Database,
} from 'lucide-react';
import { Logo } from '../Logo';
import { LandingView } from './Navbar';
import { SUPPORTED_LANGS, LangCode } from '../../i18n';

export interface FooterProps {
  onNavigate?: (view: LandingView) => void;
  onGoToLogin?: () => void;
  onGoToRegister?: () => void;
}

type FooterLink = {
  label: string;
  labelKey?: string;
  view?: LandingView;
  href?: string;
  external?: boolean;
  badge?: string;
};

interface FooterSection {
  id: string;
  title: string;
  icon: React.ComponentType<any>;
  links: FooterLink[];
}

export const Footer: React.FC<FooterProps> = ({ onNavigate, onGoToLogin, onGoToRegister }) => {
  const { i18n } = useTranslation();
  const [langOpen, setLangOpen] = useState(false);
  const [newsletterEmail, setNewsletterEmail] = useState('');
  const [newsletterStatus, setNewsletterStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');

  const currentCode = (i18n.resolvedLanguage || 'en') as LangCode;
  const currentLang = SUPPORTED_LANGS.find((l) => l.code === currentCode) || SUPPORTED_LANGS[0];
  const year = new Date().getFullYear();

  const footerSections: FooterSection[] = [
    {
      id: 'compute',
      title: 'Compute & Containers',
      icon: Cpu,
      links: [
        { label: 'Virtual Machines (ArvCompute)', view: 'features' },
        { label: 'Managed Kubernetes (ArvKube)', view: 'features' },
        { label: 'Serverless Functions (ArvFunctions)', view: 'features' },
        { label: 'Ephemeral Sandboxes (ArvSandbox)', view: 'features' },
        { label: 'GitOps Deployments & Canaries', view: 'features' },
        { label: 'All Cloud Services (20+)', view: 'services', badge: 'New' },
        { label: 'FinOps Pricing & TCO Engine', view: 'pricing' },
      ],
    },
    {
      id: 'storage-networking',
      title: 'Storage & Networking',
      icon: Database,
      links: [
        { label: 'ArvStore S3 Object Storage', view: 'features' },
        { label: 'Managed Databases (ArvDB)', view: 'features' },
        { label: 'Virtual Private Cloud (ArvVPC)', view: 'features' },
        { label: 'Elastic Load Balancing (ArvLB)', view: 'features' },
        { label: 'Authoritative Cloud DNS (ArvDNS)', view: 'features' },
        { label: 'Distributed Event Bus (ArvEvents)', view: 'features' },
        { label: 'Automated 1-Click Backups', view: 'features' },
      ],
    },
    {
      id: 'security-intel',
      title: 'Security & Governance',
      icon: Shield,
      links: [
        { label: 'Zero-Trust IAM & RBAC (ArvIAM)', view: 'features' },
        { label: 'Secrets & Key Manager (ArvVault)', view: 'features' },
        { label: 'Sovereign Compliance (ArvGuard)', view: 'features' },
        { label: 'Observability Hub (ArvWatch)', view: 'features' },
        { label: 'Predictive FinOps AI (ArvCostIQ)', view: 'features' },
        { label: 'System Health Engine (ArvPulse)', view: 'features' },
        { label: 'Incident Command War-Room', view: 'contact' },
      ],
    },
    {
      id: 'developers',
      title: 'Developers & Tools',
      icon: Terminal,
      links: [
        { label: 'Interactive Web Terminal & CLI', view: 'cli', badge: 'Live' },
        { label: 'Unified Service Catalog', view: 'services' },
        { label: 'Developer Hub & CLI Guides', view: 'developers' },
        { label: 'Architecture Docs & SOPs', view: 'documentation' },
        { label: 'User Security & Auth Manual', view: 'user-manual' },
        { label: '5-Minute Quickstart Guide', view: 'getting-started' },
        {
          label: 'GitHub Repository',
          href: 'https://github.com/yashbaviskar15/acos',
          external: true,
        },
      ],
    },
    {
      id: 'company-legal',
      title: 'Company & Legal',
      icon: Layers,
      links: [
        { label: 'About Aravanta Cloud OS', view: 'about' },
        { label: 'SRE Engineering Forum', view: 'community' },
        { label: 'Platform Sitemap Directory', view: 'sitemap' },
        { label: 'Frequently Asked Questions', view: 'faq' },
        { label: 'Contact Solutions Desk', view: 'contact' },
        { label: 'Privacy Policy (DPDPA 2023)', view: 'privacy' },
        { label: 'Terms of Use & Master SLA', view: 'terms' },
        { label: 'Platform Disclaimer & Matrix', view: 'disclaimer' },
      ],
    },
  ];

  const handleLanguageChange = (code: LangCode) => {
    i18n.changeLanguage(code);
    setLangOpen(false);
  };

  const handleLinkClick = (link: FooterLink) => {
    if (link.view) {
      onNavigate?.(link.view);
      setTimeout(() => window.scrollTo({ top: 0, behavior: 'smooth' }), 50);
      return;
    }
    if (link.href) {
      if (link.href.startsWith('mailto:')) {
        window.location.href = link.href;
      } else if (link.external || link.href.startsWith('http')) {
        window.open(link.href, '_blank', 'noopener,noreferrer');
      } else {
        window.open(link.href);
      }
    }
  };

  const handleNewsletterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newsletterEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newsletterEmail)) {
      setNewsletterStatus('error');
      return;
    }

    setNewsletterStatus('loading');
    setTimeout(() => {
      try {
        const existing = JSON.parse(localStorage.getItem('aravanta_newsletter_subs') || '[]');
        existing.push({ email: newsletterEmail, timestamp: new Date().toISOString() });
        localStorage.setItem('aravanta_newsletter_subs', JSON.stringify(existing));
      } catch {
        // ignore
      }
      setNewsletterStatus('success');
      setNewsletterEmail('');
    }, 600);
  };

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  useEffect(() => {
    const handleDocClick = () => setLangOpen(false);
    if (langOpen) {
      document.addEventListener('click', handleDocClick);
      return () => document.removeEventListener('click', handleDocClick);
    }
  }, [langOpen]);

  return (
    <footer className="relative border-t border-slate-200/90 dark:border-brandObsidian-800 bg-white dark:bg-[#070B14] text-slate-900 dark:text-slate-100 transition-colors overflow-hidden">
      {/* Top ambient gold shimmer hairline */}
      <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-brandGold-500/50 to-transparent" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Main Content Area */}
        <div className="pt-12 pb-10 md:pt-16 md:pb-14">
          {/* Pre-Footer Action Banner */}
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#0B0F17] via-[#0E1626] to-[#0A0F1D] border border-brandGold-500/20 shadow-2xl p-6 sm:p-8 lg:p-10 mb-12 text-white">
            <div className="absolute -right-12 -bottom-12 w-72 h-72 bg-brandGold-500/10 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute -left-12 -top-12 w-60 h-60 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
              <div className="space-y-2.5 max-w-2xl">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brandGold-500/15 border border-brandGold-500/30 text-brandGold-400 text-xs font-mono font-bold">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Sovereign Indian Cloud Platform • Sub-10ms Latency</span>
                </div>
                <h3 className="text-xl sm:text-2xl lg:text-3xl font-black tracking-tight text-white">
                  Architect, Deploy &amp; Scale on Aravanta Cloud OS
                </h3>
                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed font-sans">
                  Provision production Kubernetes clusters, enterprise virtual machines, distributed S3 storage, and serverless functions with 99.99% SLA and sovereign Indian compliance.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-3 shrink-0">
                <button
                  onClick={onGoToRegister || onGoToLogin}
                  className="px-5 py-2.5 rounded-xl bg-brandGold-500 hover:bg-brandGold-600 text-brandObsidian-950 font-bold text-xs sm:text-sm shadow-lg shadow-brandGold-500/20 transition-all cursor-pointer flex items-center gap-2 btn-press"
                >
                  <Rocket className="w-4 h-4" />
                  <span>Launch Free Account</span>
                </button>
                <button
                  onClick={() => onNavigate?.('cli')}
                  className="px-4 py-2.5 rounded-xl bg-slate-800/90 hover:bg-slate-700/90 border border-slate-700 hover:border-brandGold-500/40 text-slate-200 text-xs sm:text-sm font-semibold transition-all cursor-pointer flex items-center gap-2"
                >
                  <Terminal className="w-4 h-4 text-emerald-400" />
                  <span>Interactive Shell</span>
                </button>
                <button
                  onClick={() => onNavigate?.('services')}
                  className="px-4 py-2.5 rounded-xl border border-slate-700 hover:border-slate-500 text-slate-300 hover:text-white text-xs sm:text-sm font-semibold transition-all cursor-pointer flex items-center gap-1.5"
                >
                  <Layers className="w-4 h-4 text-brandGold-400" />
                  <span>20+ Services</span>
                </button>
              </div>
            </div>
          </div>

          {/* Unified Responsive Grid */}
          <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 lg:gap-10">
            {/* Left Column: Brand, Tagline, Badges, Newsletter, Socials */}
            <div className="xl:col-span-3 space-y-4">
              <Logo size="md" subtitle="Sovereign Cloud Platform & OS" />
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed max-w-sm font-sans">
                India's first unified sovereign cloud operating system. Orchestrating high-performance compute, managed Kubernetes, NVMe object storage, and zero-trust IAM across enterprise regions.
              </p>

              {/* Status & Compliance Badges */}
              <div className="flex flex-wrap items-center gap-2 pt-1">
                <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/25 text-[11px] font-semibold text-emerald-800 dark:text-emerald-400 shadow-xs">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                  </span>
                  <span>All Systems Operational (99.99%)</span>
                </div>
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-brandGold-500/10 border border-brandGold-500/30 text-[11px] font-mono font-semibold text-brandGold-800 dark:text-brandGold-300">
                  <Shield className="w-3 h-3" /> DPDPA 2023 &amp; ISO 27001
                </span>
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-slate-100 dark:bg-brandObsidian-800 border border-slate-200 dark:border-brandObsidian-700 text-[11px] font-mono text-slate-700 dark:text-slate-300">
                  Tier-4 Datacenters (Mumbai)
                </span>
              </div>

              {/* Newsletter Form */}
              <div className="pt-2 max-w-sm space-y-1.5">
                <p className="text-xs font-bold text-slate-900 dark:text-white font-sans flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-brandGold-500" />
                  <span>Engineering &amp; Security Updates</span>
                </p>
                <form onSubmit={handleNewsletterSubmit} className="space-y-1.5">
                  <div className="flex items-center gap-1.5">
                    <input
                      type="email"
                      value={newsletterEmail}
                      onChange={(e) => {
                        setNewsletterEmail(e.target.value);
                        if (newsletterStatus === 'error') setNewsletterStatus('idle');
                      }}
                      placeholder="operator@company.com"
                      className="w-full min-w-0 px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-brandObsidian-700 bg-slate-50 dark:bg-brandObsidian-900 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-brandGold-500 transition-colors"
                    />
                    <button
                      type="submit"
                      disabled={newsletterStatus === 'loading'}
                      className="px-3.5 py-2 rounded-xl bg-brandGold-500 hover:bg-brandGold-600 text-brandObsidian-950 font-bold text-xs shrink-0 transition-colors shadow-xs cursor-pointer flex items-center gap-1"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>Join</span>
                    </button>
                  </div>
                  {newsletterStatus === 'success' && (
                    <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" /> Subscribed to updates!
                    </p>
                  )}
                  {newsletterStatus === 'error' && (
                    <p className="text-[11px] text-rose-600 dark:text-rose-400">
                      Please enter a valid email address.
                    </p>
                  )}
                </form>
              </div>

              {/* Social Links */}
              <div className="flex items-center gap-2 pt-1">
                <a
                  href="https://github.com/yashbaviskar15/acos"
                  target="_blank"
                  rel="noreferrer noopener"
                  className="p-2 rounded-xl border border-slate-200 dark:border-brandObsidian-700 bg-slate-50 dark:bg-brandObsidian-900 text-slate-700 dark:text-slate-300 hover:text-brandGold-600 dark:hover:text-brandGold-400 hover:border-brandGold-500 transition-all min-w-[38px] min-h-[38px] flex items-center justify-center cursor-pointer"
                  aria-label="GitHub Repository"
                  title="GitHub Repository"
                >
                  <Github className="w-4 h-4" />
                </a>
                <a
                  href="https://twitter.com/aravanta_cloud"
                  target="_blank"
                  rel="noreferrer noopener"
                  className="p-2 rounded-xl border border-slate-200 dark:border-brandObsidian-700 bg-slate-50 dark:bg-brandObsidian-900 text-slate-700 dark:text-slate-300 hover:text-brandGold-600 dark:hover:text-brandGold-400 hover:border-brandGold-500 transition-all min-w-[38px] min-h-[38px] flex items-center justify-center cursor-pointer"
                  aria-label="Twitter / X"
                  title="Twitter / X"
                >
                  <Twitter className="w-4 h-4" />
                </a>
                <a
                  href="https://linkedin.com/company/aravanta-cloud"
                  target="_blank"
                  rel="noreferrer noopener"
                  className="p-2 rounded-xl border border-slate-200 dark:border-brandObsidian-700 bg-slate-50 dark:bg-brandObsidian-900 text-slate-700 dark:text-slate-300 hover:text-brandGold-600 dark:hover:text-brandGold-400 hover:border-brandGold-500 transition-all min-w-[38px] min-h-[38px] flex items-center justify-center cursor-pointer"
                  aria-label="LinkedIn"
                  title="LinkedIn"
                >
                  <Linkedin className="w-4 h-4" />
                </a>
                <a
                  href="https://discord.gg/aravanta"
                  target="_blank"
                  rel="noreferrer noopener"
                  className="p-2 rounded-xl border border-slate-200 dark:border-brandObsidian-700 bg-slate-50 dark:bg-brandObsidian-900 text-slate-700 dark:text-slate-300 hover:text-brandGold-600 dark:hover:text-brandGold-400 hover:border-brandGold-500 transition-all min-w-[38px] min-h-[38px] flex items-center justify-center cursor-pointer"
                  aria-label="Discord"
                  title="Discord Community"
                >
                  <MessageSquare className="w-4 h-4" />
                </a>
                <a
                  href="mailto:support@aravanta.cloud"
                  className="p-2 rounded-xl border border-slate-200 dark:border-brandObsidian-700 bg-slate-50 dark:bg-brandObsidian-900 text-slate-700 dark:text-slate-300 hover:text-brandGold-600 dark:hover:text-brandGold-400 hover:border-brandGold-500 transition-all min-w-[38px] min-h-[38px] flex items-center justify-center cursor-pointer"
                  aria-label="Email Support"
                  title="Email Support"
                >
                  <Mail className="w-4 h-4" />
                </a>
              </div>
            </div>

            {/* Right Columns: 5 Categories on lg/xl, 3 on md, 2 on sm */}
            <div className="xl:col-span-9 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-5 gap-6 sm:gap-8">
              {footerSections.map((section) => {
                const IconComponent = section.icon;
                return (
                  <div key={section.id} className="space-y-4">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white font-mono flex items-center gap-1.5">
                      <IconComponent className="w-3.5 h-3.5 text-brandGold-500 shrink-0" />
                      <span>{section.title}</span>
                    </h4>
                    <ul className="space-y-2.5">
                      {section.links.map((link, idx) => (
                        <li key={idx}>
                          <button
                            onClick={() => handleLinkClick(link)}
                            className="group inline-flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-400 hover:text-brandGold-600 dark:hover:text-brandGold-400 transition-all text-left py-0.5 cursor-pointer"
                          >
                            <span className="group-hover:translate-x-1 transition-transform">
                              {link.label}
                            </span>
                            {link.badge && (
                              <span className="px-1.5 py-0.2 rounded text-[9px] font-mono font-bold bg-brandGold-500/15 text-brandGold-700 dark:text-brandGold-300 border border-brandGold-500/30">
                                {link.badge}
                              </span>
                            )}
                            {link.external && (
                              <ExternalLink className="w-3 h-3 text-slate-400 group-hover:text-brandGold-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                            )}
                          </button>
                        </li>
                      ))}
                    </ul>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Bottom Bar: Stacked on Mobile, Row on Desktop */}
        <div className="py-6 border-t border-slate-200 dark:border-brandObsidian-800 flex flex-col md:flex-row md:items-center md:justify-between gap-4 text-xs">
          {/* Copyright & Mission Note */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-x-3 gap-y-1.5 text-slate-500 dark:text-slate-400">
            <span className="font-semibold text-slate-700 dark:text-slate-200">
              &copy; {year} Aravanta Cloud OS, Inc. All rights reserved.
            </span>
            <span className="hidden sm:inline-block text-slate-300 dark:text-brandObsidian-700">&bull;</span>
            <span className="text-slate-500 dark:text-slate-400 flex items-center gap-1">
              <Lock className="w-3 h-3 text-brandGold-500" />
              <span>Sovereign Indian Cloud Infrastructure &bull; MeitY &amp; DPDPA Compliant</span>
            </span>
          </div>

          {/* Right Controls / Badges / Language / Back to top */}
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-slate-500 dark:text-slate-400">
            <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-mono font-semibold">
              <Radio className="w-3.5 h-3.5 animate-pulse text-emerald-500" />
              <span>ap-south-1: 8ms</span>
            </div>
            <span className="text-slate-300 dark:text-brandObsidian-700 hidden sm:inline-block">&bull;</span>
            <div className="flex items-center gap-1.5 font-mono">
              <Server className="w-3.5 h-3.5 text-brandGold-500" />
              <span>v2.4.0 GA</span>
            </div>
            <span className="text-slate-300 dark:text-brandObsidian-700 hidden sm:inline-block">&bull;</span>
            <div className="flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5 text-brandGold-500" />
              <span>12,000+ SREs</span>
            </div>
            <span className="text-slate-300 dark:text-brandObsidian-700 hidden sm:inline-block">&bull;</span>

            {/* Language Selector Popover */}
            <div className="relative">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setLangOpen((prev) => !prev);
                }}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-brandObsidian-700 bg-white dark:bg-brandObsidian-900 hover:border-brandGold-500/50 hover:bg-brandGold-50/20 dark:hover:bg-brandObsidian-800 transition-all text-slate-700 dark:text-slate-200 font-medium min-h-[36px] min-w-[96px] cursor-pointer"
                aria-haspopup="listbox"
                aria-expanded={langOpen}
                aria-label="Select display language"
              >
                <Globe className="w-3.5 h-3.5 text-brandGold-500" />
                <span>{currentLang.label}</span>
                <ChevronDown className={`w-3 h-3 transition-transform ${langOpen ? 'rotate-180' : ''}`} />
              </button>
              {langOpen && (
                <>
                  <div
                    className="fixed inset-0 z-10"
                    onClick={() => setLangOpen(false)}
                  />
                  <div
                    className="absolute bottom-full mb-2 right-0 z-20 w-40 max-h-64 overflow-y-auto rounded-xl border border-slate-200 dark:border-brandObsidian-700 bg-white dark:bg-brandObsidian-900 shadow-xl py-1"
                    role="listbox"
                    aria-label="Select display language"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {SUPPORTED_LANGS.map((lang) => (
                      <button
                        key={lang.code}
                        onClick={() => handleLanguageChange(lang.code)}
                        className={`w-full px-3 py-2 text-left text-xs transition-colors min-h-[36px] flex items-center cursor-pointer ${
                          currentCode === lang.code
                            ? 'text-brandGold-600 dark:text-brandGold-400 bg-brandGold-50/50 dark:bg-brandGold-500/10 font-bold'
                            : 'text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-brandObsidian-800'
                        }`}
                        role="option"
                        aria-selected={currentCode === lang.code}
                      >
                        {lang.label}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>

            <span className="text-slate-300 dark:text-brandObsidian-700 hidden sm:inline-block">&bull;</span>

            {/* Back to Top */}
            <button
              onClick={scrollToTop}
              className="p-2 rounded-lg border border-slate-200 dark:border-brandObsidian-700 bg-white dark:bg-brandObsidian-900 text-slate-700 dark:text-slate-200 hover:text-brandGold-600 dark:hover:text-brandGold-400 hover:border-brandGold-500/50 transition-all cursor-pointer min-w-[36px] min-h-[36px] flex items-center justify-center"
              title="Back to Top"
              aria-label="Scroll back to top"
            >
              <ArrowUp className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
};
