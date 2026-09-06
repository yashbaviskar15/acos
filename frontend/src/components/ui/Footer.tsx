import React from 'react';
import { Github, FileJson, Activity, ExternalLink } from 'lucide-react';
import { Logo } from '../Logo';
import { LandingView } from './Navbar';

export interface FooterProps {
  onNavigate?: (view: LandingView) => void;
  onGoToLogin?: () => void;
  onGoToRegister?: () => void;
}

const footerColumns: Array<{
  title: string;
  links: Array<{ label: string; href?: string; view?: LandingView; external?: boolean }>;
}> = [
  {
    title: 'Product',
    links: [
      { label: 'Compute', view: 'features' },
      { label: 'Kubernetes', view: 'features' },
      { label: 'Object Storage', view: 'features' },
      { label: 'Managed Databases', view: 'features' },
      { label: 'CI/CD Pipelines', view: 'features' },
    ],
  },
  {
    title: 'Developers',
    links: [
      { label: 'Documentation', view: 'documentation' },
      { label: 'CLI Reference', view: 'developers' },
      { label: 'API Reference (Swagger)', href: 'https://arv-backend.vercel.app/docs', external: true },
      { label: 'SDK & Libraries', view: 'developers' },
      { label: 'Terraform Provider', view: 'developers' },
    ],
  },
  {
    title: 'Resources',
    links: [
      { label: 'Prometheus Endpoint', href: '/api/v1/metrics', external: true },
      { label: 'Status & Incidents', href: '#', external: false },
      { label: 'Changelog', view: 'about' },
      { label: 'Security Center', view: 'about' },
      { label: 'Support', view: 'about' },
    ],
  },
  {
    title: 'Company',
    links: [
      { label: 'About', view: 'about' },
      { label: 'Pricing', view: 'pricing' },
      { label: 'Customers', view: 'about' },
      { label: 'Careers', view: 'about' },
      { label: 'Contact Sales', view: 'pricing' },
    ],
  },
];

import { openCookiePreferences } from './CookieConsent';

const legalLinks = [
  { label: 'Privacy Policy', action: 'cookies' },
  { label: 'Cookie Settings', action: 'cookies' },
  { label: 'Terms of Service', href: '#' },
  { label: 'Security', href: '#' },
  { label: 'DPA', href: '#' },
  { label: 'Status', href: '#' },
];

export const Footer: React.FC<FooterProps> = ({ onNavigate }) => {
  const handleClick = (view?: LandingView, href?: string) => {
    if (view) {
      onNavigate?.(view);
      setTimeout(() => window.scrollTo({ top: 0, behavior: 'smooth' }), 50);
      return;
    }
    if (href && href !== '#') {
      window.open(href, href.startsWith('http') ? '_blank' : undefined, href.startsWith('http') ? 'noopener,noreferrer' : undefined);
    }
  };

  return (
    <footer className="relative border-t border-slate-200 dark:border-brandObsidian-800 bg-white dark:bg-brandObsidian-950">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="py-14 lg:py-16">
          <div className="grid grid-cols-2 md:grid-cols-6 gap-8 lg:gap-12">
            <div className="col-span-2 md:col-span-2 space-y-5">
              <Logo size="md" />
              <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed max-w-sm">
                Aravanta CloudOS is the unified control plane for multi-cloud infrastructure, GitOps delivery, and SRE operations.
              </p>
              <div className="flex items-center gap-3 pt-2">
                <a
                  href="https://github.com"
                  target="_blank"
                  rel="noreferrer noopener"
                  className="p-2 rounded-lg border border-slate-200 dark:border-brandObsidian-800 text-slate-500 hover:text-slate-900 dark:hover:text-white hover:border-slate-300 dark:hover:border-brandObsidian-700 hover:bg-slate-50 dark:hover:bg-brandObsidian-800/50 transition-all"
                  aria-label="GitHub"
                >
                  <Github className="w-4.5 h-4.5" />
                </a>
                <a
                  href="https://arv-backend.vercel.app/docs"
                  target="_blank"
                  rel="noreferrer noopener"
                  className="p-2 rounded-lg border border-slate-200 dark:border-brandObsidian-800 text-slate-500 hover:text-slate-900 dark:hover:text-white hover:border-slate-300 dark:hover:border-brandObsidian-700 hover:bg-slate-50 dark:hover:bg-brandObsidian-800/50 transition-all"
                  aria-label="Swagger API"
                >
                  <FileJson className="w-4.5 h-4.5" />
                </a>
                <a
                  href="/api/v1/metrics"
                  target="_blank"
                  rel="noreferrer noopener"
                  className="p-2 rounded-lg border border-slate-200 dark:border-brandObsidian-800 text-slate-500 hover:text-slate-900 dark:hover:text-white hover:border-slate-300 dark:hover:border-brandObsidian-700 hover:bg-slate-50 dark:hover:bg-brandObsidian-800/50 transition-all"
                  aria-label="Prometheus Metrics"
                >
                  <Activity className="w-4.5 h-4.5" />
                </a>
              </div>
            </div>

            {footerColumns.map((col) => (
              <div key={col.title} className="space-y-4">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-900 dark:text-white">
                  {col.title}
                </h4>
                <ul className="space-y-2.5">
                  {col.links.map((link) => (
                    <li key={link.label}>
                      {link.external && link.href ? (
                        <a
                          href={link.href}
                          target="_blank"
                          rel="noreferrer noopener"
                          className="inline-flex items-center gap-1 text-sm text-slate-600 dark:text-slate-400 hover:text-brandGold-600 dark:hover:text-brandGold-400 transition-colors"
                        >
                          {link.label}
                          <ExternalLink className="w-3 h-3 opacity-60" />
                        </a>
                      ) : link.view ? (
                        <button
                          onClick={() => handleClick(link.view)}
                          className="text-sm text-slate-600 dark:text-slate-400 hover:text-brandGold-600 dark:hover:text-brandGold-400 transition-colors text-left"
                        >
                          {link.label}
                        </button>
                      ) : (
                        <span className="text-sm text-slate-600 dark:text-slate-400 cursor-not-allowed opacity-70">
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

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 py-6 border-t border-slate-200 dark:border-brandObsidian-800">
          <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-slate-500 dark:text-slate-400">
            <span className="font-semibold">
              &copy; {new Date().getFullYear()} Aravanta Systems, Inc. All rights reserved.
            </span>
            {legalLinks.map((link) => (
              link.action ? (
                <button
                  key={link.label}
                  type="button"
                  onClick={() => openCookiePreferences()}
                  className="hover:text-slate-700 dark:hover:text-slate-200 transition-colors cursor-pointer"
                >
                  {link.label}
                </button>
              ) : (
                <a
                  key={link.label}
                  href={link.href}
                  className="hover:text-slate-700 dark:hover:text-slate-200 transition-colors"
                >
                  {link.label}
                </a>
              )
            ))}
          </div>

          <div className="flex items-center gap-2 text-xs">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-60" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
            </span>
            <span className="font-semibold text-slate-700 dark:text-slate-200">
              All systems operational
            </span>
            <span className="mx-1 text-slate-300 dark:text-brandObsidian-700">•</span>
            <span className="font-mono font-semibold text-slate-600 dark:text-slate-300">
              99.98%
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
};
