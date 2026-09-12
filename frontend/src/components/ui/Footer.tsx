import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Twitter, Linkedin, Github, Mail, ChevronDown, Users, Shield, Globe, MessageSquare, Server, ExternalLink } from 'lucide-react';
import { Logo } from '../Logo';
import { LandingView } from './Navbar';
import { SUPPORTED_LANGS, LangCode } from '../../i18n';

export interface FooterProps {
  onNavigate?: (view: LandingView) => void;
}

type FooterLink = {
  labelKey: string;
  view?: LandingView;
  href?: string;
  external?: boolean;
  icon?: React.ComponentType<any>;
};

export const Footer: React.FC<FooterProps> = ({ onNavigate }) => {
  const { t, i18n } = useTranslation();
  const [langOpen, setLangOpen] = useState(false);

  const currentCode = (i18n.resolvedLanguage || 'en') as LangCode;
  const currentLang = SUPPORTED_LANGS.find((l) => l.code === currentCode) || SUPPORTED_LANGS[0];

  const year = new Date().getFullYear();

  const footerColumns: Array<{
    titleKey: string;
    links: FooterLink[];
  }> = [
    {
      titleKey: 'footer.product',
      links: [
        { labelKey: 'footer.features_link', view: 'features' },
        { labelKey: 'footer.docs_link', view: 'documentation' },
        { labelKey: 'footer.pricing_link', view: 'pricing' },
        { labelKey: 'footer.changelog_link', view: 'documentation' },
      ],
    },
    {
      titleKey: 'footer.community',
      links: [
        { labelKey: 'footer.beginners_link', view: 'community' },
        { labelKey: 'footer.developers_link', view: 'developers' },
        { labelKey: 'footer.students_link', view: 'community' },
        { labelKey: 'footer.professionals_link', view: 'community' },
        {
          labelKey: 'footer.docs_link',
          href: 'https://github.com/yashbaviskar15/acos/discussions',
          external: true,
        },
      ],
    },
    {
      titleKey: 'footer.legal',
      links: [
        { labelKey: 'footer.privacy_link', view: 'privacy' },
        { labelKey: 'footer.terms_link', view: 'terms' },
        { labelKey: 'footer.disclaimer_link', view: 'disclaimer' },
        { labelKey: 'footer.sitemap_link', view: 'sitemap' },
      ],
    },
    {
      titleKey: 'footer.contact',
      links: [
        { labelKey: 'nav.contact', view: 'contact' },
        { labelKey: 'nav.faq', view: 'faq' },
        { labelKey: 'nav.about', view: 'about' },
        { labelKey: 'footer.support_email', href: 'mailto:support@aravanta.cloud', icon: Mail },
      ],
    },
  ];

  const handleLanguageChange = (code: LangCode) => {
    i18n.changeLanguage(code);
    setLangOpen(false);
  };

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

  useEffect(() => {
    const handleDocClick = () => setLangOpen(false);
    if (langOpen) {
      document.addEventListener('click', handleDocClick);
      return () => document.removeEventListener('click', handleDocClick);
    }
    return;
  }, [langOpen]);

  return (
    <footer className="relative border-t border-slate-200 dark:border-brandObsidian-800 bg-white dark:bg-brandObsidian-950 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="py-14 lg:py-16">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-10 lg:gap-8">
            {/* Column 1: Brand & Bio */}
            <div className="sm:col-span-2 lg:col-span-1 space-y-4">
              <Logo size="md" subtitle="Cloud Platform & OS" />
              <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                {t('footer.tagline')}
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
              <div key={col.titleKey} className="space-y-4">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white font-mono">
                  {t(col.titleKey)}
                </h4>
                <ul className="space-y-2.5">
                  {col.links.map((link) => (
                    <li key={link.labelKey}>
                      <button
                        onClick={() => handleClick(link)}
                        className="inline-flex items-center gap-1.5 text-sm text-slate-600 dark:text-slate-400 hover:text-brandGold-600 dark:hover:text-brandGold-400 transition-colors text-left py-1 min-h-[32px]"
                      >
                        {link.icon && <link.icon className="w-3.5 h-3.5 text-brandGold-500 shrink-0" />}
                        {link.href?.startsWith('http') && !link.icon && (
                          <ExternalLink className="w-3 h-3 text-slate-400 shrink-0" />
                        )}
                        {t(link.labelKey)}
                      </button>
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
              {t('footer.copyright', { year })}
            </span>
            <span className="hidden sm:inline-block text-slate-300 dark:text-brandObsidian-700">•</span>
            <span className="text-slate-500 dark:text-slate-400">
              {t('footer.built_by')}
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
                onClick={(e) => {
                  e.stopPropagation();
                  setLangOpen((prev) => !prev);
                }}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-brandObsidian-700 bg-white dark:bg-brandObsidian-900 hover:border-brandGold-500/50 hover:bg-brandGold-50/20 dark:hover:bg-brandObsidian-800 transition-all text-slate-700 dark:text-slate-200 font-medium min-h-[36px] min-w-[96px]"
                aria-haspopup="listbox"
                aria-expanded={langOpen}
                aria-label={t('footer.select_language')}
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
                    onContextMenu={(e) => e.stopPropagation()}
                  />
                  <div
                    className="absolute bottom-full mb-2 right-0 z-20 w-40 max-h-64 overflow-y-auto rounded-xl border border-slate-200 dark:border-brandObsidian-700 bg-white dark:bg-brandObsidian-900 shadow-xl py-1"
                    role="listbox"
                    aria-label={t('footer.select_language')}
                    onClick={(e) => e.stopPropagation()}
                  >
                    {SUPPORTED_LANGS.map((lang) => (
                      <button
                        key={lang.code}
                        onClick={() => handleLanguageChange(lang.code)}
                        className={`w-full px-3 py-2 text-left text-xs transition-colors min-h-[36px] flex items-center ${
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
