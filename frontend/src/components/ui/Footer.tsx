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
} from 'lucide-react';
import { Logo } from '../Logo';
import { LandingView } from './Navbar';
import { SUPPORTED_LANGS, LangCode } from '../../i18n';

export interface FooterProps {
  onNavigate?: (view: LandingView) => void;
  onGoToLogin?: () => void;
}

type FooterLink = {
  label: string;
  labelKey?: string;
  view?: LandingView;
  href?: string;
  external?: boolean;
  icon?: React.ComponentType<any>;
};

interface FooterSection {
  id: string;
  title: string;
  links: FooterLink[];
}

export const Footer: React.FC<FooterProps> = ({ onNavigate }) => {
  const { i18n } = useTranslation();
  const [langOpen, setLangOpen] = useState(false);
  const [newsletterEmail, setNewsletterEmail] = useState('');
  const [newsletterStatus, setNewsletterStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');

  const currentCode = (i18n.resolvedLanguage || 'en') as LangCode;
  const currentLang = SUPPORTED_LANGS.find((l) => l.code === currentCode) || SUPPORTED_LANGS[0];
  const year = new Date().getFullYear();

  const footerSections: FooterSection[] = [
    {
      id: 'product',
      title: 'Product',
      links: [
        { label: 'Compute Virtual Machines', view: 'features' },
        { label: 'Managed Kubernetes (ArvK8s)', view: 'features' },
        { label: 'ArvS3 Object Storage', view: 'features' },
        { label: 'Managed High-Availability DBs', view: 'features' },
        { label: 'Cloud OS Pricing & TCO', view: 'pricing' },
      ],
    },
    {
      id: 'solutions',
      title: 'Solutions & Architecture',
      links: [
        { label: 'Sovereign Cloud Architecture', view: 'about' },
        { label: 'Multi-Cloud Observability & SRE', view: 'documentation' },
        { label: 'ArvAI Copilot & Incident RCA', view: 'about' },
        { label: 'Developer Workflows & GitOps', view: 'developers' },
        { label: 'Zero-Trust Security & RBAC', view: 'documentation' },
      ],
    },
    {
      id: 'resources',
      title: 'Resources',
      links: [
        { label: 'Documentation & API Ref', view: 'documentation' },
        { label: 'User Authentication Manual', view: 'user-manual' },
        { label: 'Getting Started Guide', view: 'documentation' },
        { label: 'Community Hub & SRE Forum', view: 'community' },
        {
          label: 'GitHub Discussions',
          href: 'https://github.com/yashbaviskar15/acos/discussions',
          external: true,
        },
        { label: 'Frequently Asked Questions', view: 'faq' },
      ],
    },
    {
      id: 'company',
      title: 'Company',
      links: [
        { label: 'About Aravanta Cloud OS', view: 'about' },
        { label: 'Contact Solutions Team', view: 'contact' },
        { label: 'Privacy Policy (DPDP Act)', view: 'privacy' },
        { label: 'Terms of Service & SLAs', view: 'terms' },
        { label: 'Disclaimer & Compliance', view: 'disclaimer' },
        { label: 'Platform Sitemap', view: 'sitemap' },
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

  useEffect(() => {
    const handleDocClick = () => setLangOpen(false);
    if (langOpen) {
      document.addEventListener('click', handleDocClick);
      return () => document.removeEventListener('click', handleDocClick);
    }
  }, [langOpen]);

  return (
    <footer className="relative border-t border-slate-200/90 dark:border-brandObsidian-800 bg-white dark:bg-brandObsidian-950 text-slate-900 dark:text-slate-100 transition-colors overflow-hidden">
      {/* Top ambient gold shimmer hairline */}
      <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-brandGold-500/50 to-transparent" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Main Content Area */}
        <div className="py-10 md:py-14 lg:py-16">
          {/* Unified Responsive Grid */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-8 lg:gap-12">
            {/* Left Column: Brand, Tagline, Badges, Newsletter, Socials */}
            <div className="md:col-span-5 lg:col-span-5 space-y-4">
              <Logo size="md" subtitle="Cloud Platform & OS" />
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed max-w-sm font-sans">
                The Unified Multi-Cloud Operating System orchestrating sovereign Kubernetes clusters, virtual compute, and distributed NVMe object storage across India.
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
                  <Shield className="w-3 h-3" /> SOC 2 & ISO 27001
                </span>
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-slate-100 dark:bg-brandObsidian-800 border border-slate-200 dark:border-brandObsidian-700 text-[11px] font-mono text-slate-700 dark:text-slate-300">
                  Hosted in India
                </span>
              </div>

              {/* Newsletter Form */}
              <div className="pt-2 max-w-sm space-y-1.5">
                <p className="text-xs font-bold text-slate-900 dark:text-white font-sans">
                  Engineering Updates
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
                      placeholder="you@company.com"
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
                      Please enter a valid email.
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
                >
                  <Github className="w-4 h-4" />
                </a>
                <a
                  href="https://twitter.com/aravanta_cloud"
                  target="_blank"
                  rel="noreferrer noopener"
                  className="p-2 rounded-xl border border-slate-200 dark:border-brandObsidian-700 bg-slate-50 dark:bg-brandObsidian-900 text-slate-700 dark:text-slate-300 hover:text-brandGold-600 dark:hover:text-brandGold-400 hover:border-brandGold-500 transition-all min-w-[38px] min-h-[38px] flex items-center justify-center cursor-pointer"
                  aria-label="Twitter / X"
                >
                  <Twitter className="w-4 h-4" />
                </a>
                <a
                  href="https://linkedin.com/company/aravanta-cloud"
                  target="_blank"
                  rel="noreferrer noopener"
                  className="p-2 rounded-xl border border-slate-200 dark:border-brandObsidian-700 bg-slate-50 dark:bg-brandObsidian-900 text-slate-700 dark:text-slate-300 hover:text-brandGold-600 dark:hover:text-brandGold-400 hover:border-brandGold-500 transition-all min-w-[38px] min-h-[38px] flex items-center justify-center cursor-pointer"
                  aria-label="LinkedIn"
                >
                  <Linkedin className="w-4 h-4" />
                </a>
                <a
                  href="https://discord.gg/aravanta"
                  target="_blank"
                  rel="noreferrer noopener"
                  className="p-2 rounded-xl border border-slate-200 dark:border-brandObsidian-700 bg-slate-50 dark:bg-brandObsidian-900 text-slate-700 dark:text-slate-300 hover:text-brandGold-600 dark:hover:text-brandGold-400 hover:border-brandGold-500 transition-all min-w-[38px] min-h-[38px] flex items-center justify-center cursor-pointer"
                  aria-label="Discord"
                >
                  <MessageSquare className="w-4 h-4" />
                </a>
                <a
                  href="mailto:support@aravanta.cloud"
                  className="p-2 rounded-xl border border-slate-200 dark:border-brandObsidian-700 bg-slate-50 dark:bg-brandObsidian-900 text-slate-700 dark:text-slate-300 hover:text-brandGold-600 dark:hover:text-brandGold-400 hover:border-brandGold-500 transition-all min-w-[38px] min-h-[38px] flex items-center justify-center cursor-pointer"
                  aria-label="Email Support"
                >
                  <Mail className="w-4 h-4" />
                </a>
              </div>
            </div>

            {/* Right Columns: 4 Categories (2 cols on mobile, 4 cols on sm/md/lg) */}
            <div className="md:col-span-7 lg:col-span-7 grid grid-cols-2 sm:grid-cols-4 gap-6 sm:gap-8">
              {footerSections.map((section) => (
                <div key={section.id} className="space-y-4">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white font-mono">
                    {section.title}
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
                          {link.external && (
                            <ExternalLink className="w-3 h-3 text-slate-400 group-hover:text-brandGold-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                          )}
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Bottom Bar: Stacked on Mobile, Row on Desktop */}
        <div className="py-6 border-t border-slate-200 dark:border-brandObsidian-800 flex flex-col md:flex-row md:items-center md:justify-between gap-4 text-xs">
          {/* Copyright & Mission Note */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-x-3 gap-y-1.5 text-slate-500 dark:text-slate-400">
            <span className="font-semibold text-slate-700 dark:text-slate-200">
              © {year} Aravanta Cloud OS, Inc. All rights reserved.
            </span>
            <span className="hidden sm:inline-block text-slate-300 dark:text-brandObsidian-700">•</span>
            <span className="text-slate-500 dark:text-slate-400 flex items-center gap-1">
              <Lock className="w-3 h-3 text-brandGold-500" />
              <span>Sovereign Indian Cloud Infrastructure</span>
            </span>
          </div>

          {/* Right Controls / Badges / Language */}
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-slate-500 dark:text-slate-400">
            <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-mono font-semibold">
              <Radio className="w-3.5 h-3.5 animate-pulse text-emerald-500" />
              <span>ap-south-1: 8ms</span>
            </div>
            <span className="text-slate-300 dark:text-brandObsidian-700 hidden sm:inline-block">•</span>
            <div className="flex items-center gap-1.5 font-mono">
              <Server className="w-3.5 h-3.5 text-brandGold-500" />
              <span>v2.4.0 GA</span>
            </div>
            <span className="text-slate-300 dark:text-brandObsidian-700 hidden sm:inline-block">•</span>
            <div className="flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5 text-brandGold-500" />
              <span>12,000+ SREs</span>
            </div>
            <span className="text-slate-300 dark:text-brandObsidian-700 hidden sm:inline-block">•</span>

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
          </div>
        </div>
      </div>
    </footer>
  );
};
