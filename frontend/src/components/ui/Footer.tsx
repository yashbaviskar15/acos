import React, { useState } from 'react';
import { Twitter, Linkedin, Github, Mail, ChevronDown, Users, Shield, Globe, MessageSquare, Server } from 'lucide-react';
import { Logo } from '../Logo';
import { LandingView } from './Navbar';

export interface FooterProps {
  onNavigate?: (view: LandingView) => void;
}

type FooterLink = {
  label: string;
  view?: LandingView;
  href?: string;
  external?: boolean;
};

const footerColumns: Array<{
  title: string;
  links: FooterLink[];
}> = [
  {
    title: 'Product',
    links: [
      { label: 'Features & Architecture', view: 'features' },
      { label: 'Compute & Containers', view: 'features' },
      { label: 'Managed Kubernetes', view: 'features' },
      { label: 'Pricing Plans', view: 'pricing' },
      { label: 'Platform Documentation', view: 'documentation' },
      { label: 'Quickstart Guide', view: 'getting-started' },
    ],
  },
  {
    title: 'Community',
    links: [
      { label: 'Beginners Hub', view: 'community' },
      { label: 'Developers & SDKs', view: 'community' },
      { label: 'Students & Learning', view: 'community' },
      { label: 'Working Professionals', view: 'community' },
      { label: 'GitHub Discussions', href: 'https://github.com/yashbaviskar15/acos/discussions', external: true },
      { label: 'Community Discord', href: 'https://discord.gg/aravanta', external: true },
    ],
  },
  {
    title: 'Legal',
    links: [
      { label: 'Privacy Policy', view: 'privacy' },
      { label: 'Terms of Use', view: 'terms' },
      { label: 'Disclaimer', view: 'disclaimer' },
      { label: 'Sitemap', view: 'sitemap' },
    ],
  },
  {
    title: 'Contact & Support',
    links: [
      { label: 'Contact Us', view: 'contact' },
      { label: 'Frequently Asked Questions', view: 'faq' },
      { label: 'About Us', view: 'about' },
      { label: 'Support Desk', href: 'mailto:support@aravanta.cloud' },
      { label: 'Billing Inquiries', href: 'mailto:billing@aravanta.cloud' },
    ],
  },
];

export const Footer: React.FC<FooterProps> = ({ onNavigate }) => {
  const [langOpen, setLangOpen] = useState(false);
  const [selectedLang, setSelectedLang] = useState('English');

  const languages = ['English', 'Español', 'Deutsch', 'Français', '日本語', 'हिंदी'];

  const handleClick = (link?: FooterLink) => {
    if (!link) return;
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
        window.open(link.href, undefined, undefined);
      }
    }
  };

  return (
    <footer className="relative border-t border-slate-200 dark:border-brandObsidian-800 bg-white dark:bg-brandObsidian-950 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="py-14 lg:py-16">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-10 lg:gap-8">
            {/* Column 1: Brand & Bio */}
            <div className="sm:col-span-2 lg:col-span-1 space-y-4">
              <Logo size="md" subtitle="Cloud Platform & OS" />
              <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                The unified control plane for multi-cloud infrastructure, Kubernetes orchestration, and automated SRE operations.
              </p>
              <div className="pt-1">
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-brandGold-500/10 border border-brandGold-500/30 text-xs font-semibold text-brandGold-700 dark:text-brandGold-400">
                  <Shield className="w-3.5 h-3.5" />
                  SOC2 Type II & ISO 27001 Ready
                </span>
              </div>
              <div className="flex items-center gap-2.5 pt-2">
                <a
                  href="https://github.com/yashbaviskar15/acos"
                  target="_blank"
                  rel="noreferrer noopener"
                  className="p-2.5 rounded-xl border border-slate-200 dark:border-brandObsidian-800 text-slate-500 dark:text-slate-400 hover:text-brandGold-600 dark:hover:text-brandGold-400 hover:border-brandGold-500/40 hover:bg-brandGold-50/20 dark:hover:bg-brandObsidian-900 transition-all min-w-[44px] min-h-[44px] flex items-center justify-center"
                  aria-label="GitHub"
                >
                  <Github className="w-4.5 h-4.5" />
                </a>
                <a
                  href="https://twitter.com/aravanta_cloud"
                  target="_blank"
                  rel="noreferrer noopener"
                  className="p-2.5 rounded-xl border border-slate-200 dark:border-brandObsidian-800 text-slate-500 dark:text-slate-400 hover:text-brandGold-600 dark:hover:text-brandGold-400 hover:border-brandGold-500/40 hover:bg-brandGold-50/20 dark:hover:bg-brandObsidian-900 transition-all min-w-[44px] min-h-[44px] flex items-center justify-center"
                  aria-label="Twitter / X"
                >
                  <Twitter className="w-4.5 h-4.5" />
                </a>
                <a
                  href="https://linkedin.com/company/aravanta-cloud"
                  target="_blank"
                  rel="noreferrer noopener"
                  className="p-2.5 rounded-xl border border-slate-200 dark:border-brandObsidian-800 text-slate-500 dark:text-slate-400 hover:text-brandGold-600 dark:hover:text-brandGold-400 hover:border-brandGold-500/40 hover:bg-brandGold-50/20 dark:hover:bg-brandObsidian-900 transition-all min-w-[44px] min-h-[44px] flex items-center justify-center"
                  aria-label="LinkedIn"
                >
                  <Linkedin className="w-4.5 h-4.5" />
                </a>
                <a
                  href="https://discord.gg/aravanta"
                  target="_blank"
                  rel="noreferrer noopener"
                  className="p-2.5 rounded-xl border border-slate-200 dark:border-brandObsidian-800 text-slate-500 dark:text-slate-400 hover:text-brandGold-600 dark:hover:text-brandGold-400 hover:border-brandGold-500/40 hover:bg-brandGold-50/20 dark:hover:bg-brandObsidian-900 transition-all min-w-[44px] min-h-[44px] flex items-center justify-center"
                  aria-label="Discord"
                >
                  <MessageSquare className="w-4.5 h-4.5" />
                </a>
              </div>
            </div>

            {/* Columns 2-5 */}
            {footerColumns.map((col) => (
              <div key={col.title} className="space-y-4">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white font-mono">
                  {col.title}
                </h4>
                <ul className="space-y-2.5">
                  {col.links.map((link) => (
                    <li key={link.label}>
                      {link.external || link.href ? (
                        <button
                          onClick={() => handleClick(link)}
                          className="inline-flex items-center gap-1.5 text-sm text-slate-600 dark:text-slate-400 hover:text-brandGold-600 dark:hover:text-brandGold-400 transition-colors text-left py-1"
                        >
                          {link.href?.startsWith('mailto:') && (
                            <Mail className="w-3.5 h-3.5 text-brandGold-500 shrink-0" />
                          )}
                          {link.label}
                        </button>
                      ) : link.view ? (
                        <button
                          onClick={() => handleClick(link)}
                          className="text-sm text-slate-600 dark:text-slate-400 hover:text-brandGold-600 dark:hover:text-brandGold-400 transition-colors text-left py-1"
                        >
                          {link.label}
                        </button>
                      ) : (
                        <span className="text-sm text-slate-400 dark:text-slate-600 cursor-not-allowed">
                          {link.label}
                        </span>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="py-6 border-t border-slate-200 dark:border-brandObsidian-800 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex flex-col sm:flex-row sm:items-center gap-x-4 gap-y-2 text-xs text-slate-500 dark:text-slate-400">
            <span className="font-semibold text-slate-700 dark:text-slate-200">
              &copy; {new Date().getFullYear()} Aravanta Cloud OS Technologies Inc. All rights reserved.
            </span>
            <span className="hidden sm:inline-block text-slate-300 dark:text-brandObsidian-700">•</span>
            <span className="text-slate-500 dark:text-slate-400">
              Unified Multi-Cloud Control Plane
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-slate-500 dark:text-slate-400">
            <div className="flex items-center gap-1.5">
              <Server className="w-3.5 h-3.5 text-brandGold-500" />
              <span>v2.4.0 Production</span>
            </div>
            <span className="text-slate-300 dark:text-brandObsidian-700 hidden sm:inline-block">•</span>
            <div className="flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5 text-brandGold-500" />
              <span>12,000+ Engineers</span>
            </div>
            <span className="text-slate-300 dark:text-brandObsidian-700 hidden sm:inline-block">•</span>
            <div className="relative">
              <button
                onClick={() => setLangOpen(!langOpen)}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-brandObsidian-700 bg-white dark:bg-brandObsidian-900 hover:border-brandGold-500/50 hover:bg-brandGold-50/20 dark:hover:bg-brandObsidian-800 transition-all text-slate-700 dark:text-slate-200 font-medium"
                aria-haspopup="listbox"
                aria-expanded={langOpen}
              >
                <Globe className="w-3.5 h-3.5 text-brandGold-500" />
                <span>{selectedLang}</span>
                <ChevronDown className={`w-3 h-3 transition-transform ${langOpen ? 'rotate-180' : ''}`} />
              </button>
              {langOpen && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setLangOpen(false)} />
                  <div
                    className="absolute bottom-full mb-2 right-0 z-20 w-36 max-h-56 overflow-y-auto rounded-xl border border-slate-200 dark:border-brandObsidian-700 bg-white dark:bg-brandObsidian-900 shadow-xl py-1"
                    role="listbox"
                  >
                    {languages.map((lang) => (
                      <button
                        key={lang}
                        onClick={() => {
                          setSelectedLang(lang);
                          setLangOpen(false);
                        }}
                        className={`w-full px-3 py-1.5 text-left text-xs transition-colors ${
                          selectedLang === lang
                            ? 'text-brandGold-600 dark:text-brandGold-400 bg-brandGold-50/50 dark:bg-brandGold-500/10 font-bold'
                            : 'text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-brandObsidian-800'
                        }`}
                        role="option"
                        aria-selected={selectedLang === lang}
                      >
                        {lang}
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
