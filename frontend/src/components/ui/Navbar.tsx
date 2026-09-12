import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Menu,
  X,
  ChevronRight,
  Search,
  Server,
  Boxes,
  HardDrive,
  Database,
  GitBranch,
  Activity,
  ArrowRight,
} from 'lucide-react';
import { Logo } from '../Logo';
import { Button } from './Button';
import { Dropdown, DropdownTrigger, DropdownMenu } from './Dropdown';
import { Badge } from './Badge';

export type LandingView =
  | 'home'
  | 'getting-started'
  | 'features'
  | 'developers'
  | 'documentation'
  | 'pricing'
  | 'foundations'
  | 'components'
  | 'patterns'
  | 'resources'
  | 'community'
  | 'about'
  | 'contact'
  | 'faq'
  | 'sitemap'
  | 'privacy'
  | 'disclaimer'
  | 'terms';

export interface NavbarProps {
  onGoToLogin: () => void;
  onGoToRegister: () => void;
  onOpenCommandPalette?: () => void;
  onNavigate?: (view: LandingView) => void;
  currentView?: LandingView;
}

const platformModules = [
  {
    icon: Server,
    name: 'Compute Engine',
    desc: 'Scalable VMs, bare metal & GPU nodes across regions',
  },
  {
    icon: Boxes,
    name: 'Managed Kubernetes',
    desc: 'Self-healing, multi-cluster K8s control plane',
  },
  {
    icon: HardDrive,
    name: 'Object Storage',
    desc: 'S3-compatible, ultra-low latency distributed storage',
  },
  {
    icon: Database,
    name: 'Managed Databases',
    desc: 'High-availability Postgres, Redis & MySQL clusters',
  },
  {
    icon: GitBranch,
    name: 'GitOps Pipelines',
    desc: 'Automated CI/CD releases with canary safety gates',
  },
  {
    icon: Activity,
    name: 'SRE Observability',
    desc: 'Sub-second metrics, Loki log stream & alert triage',
  },
];

export const Navbar: React.FC<NavbarProps> = ({
  onGoToLogin,
  onGoToRegister,
  onOpenCommandPalette,
  onNavigate,
  currentView = 'home',
}) => {
  const { t } = useTranslation();
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 8);
    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [mobileOpen]);

  const navLinkBase =
    'text-sm font-medium text-slate-600 dark:text-slate-300 hover:text-brandGold-600 dark:hover:text-brandGold-400 transition-colors relative py-2 min-h-[44px] flex items-center';

  const activeLink = (isActive: boolean) =>
    isActive
      ? 'text-brandGold-600 dark:text-brandGold-400 font-semibold after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-brandGold-500 after:rounded-full'
      : '';

  const handleNavClick = (view: LandingView) => {
    setMobileOpen(false);
    onNavigate?.(view);
    setTimeout(() => window.scrollTo({ top: 0, behavior: 'smooth' }), 50);
  };

  return (
    <>
      <header
        className={[
          'sticky top-0 z-50 w-full transition-all duration-300',
          scrolled
            ? 'bg-white/90 dark:bg-brandObsidian-950/90 backdrop-blur-xl border-b border-slate-200/80 dark:border-brandObsidian-800/80 shadow-[0_1px_3px_rgba(0,0,0,0.05),0_10px_25px_-15px_rgba(185,139,59,0.15)]'
            : 'bg-transparent border-b border-transparent',
        ].join(' ')}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="h-16 sm:h-20 flex items-center justify-between gap-4">
            <div className="flex items-center gap-6 lg:gap-8 shrink-0">
              <button
                onClick={() => handleNavClick('home')}
                className="flex items-center -m-2 p-2 rounded-xl focus:outline-none focus-visible:ring-2 focus-visible:ring-brandGold-500/50"
              >
                <Logo size="md" />
              </button>

              <nav className="hidden lg:flex items-center gap-1">
                <Dropdown align="start" side="bottom">
                  <DropdownTrigger asChild>
                    <button
                      className={[
                        navLinkBase,
                        'flex items-center gap-1.5 px-3 rounded-lg hover:bg-slate-100/60 dark:hover:bg-brandObsidian-800/60',
                        currentView === 'features' ? activeLink(true) : '',
                      ].join(' ')}
                    >
                      {t('nav.platform')}
                      <ChevronRight className="w-3.5 h-3.5 -rotate-90 opacity-60" />
                    </button>
                  </DropdownTrigger>
                  <DropdownMenu className="w-[480px] p-3 grid grid-cols-2 gap-2 bg-white dark:bg-brandObsidian-900 border border-slate-200 dark:border-brandObsidian-700 rounded-2xl shadow-xl">
                    {platformModules.map((mod) => {
                      const Icon = mod.icon;
                      return (
                        <button
                          key={mod.name}
                          onClick={() => handleNavClick('features')}
                          className="group flex items-start gap-3 p-2.5 rounded-xl text-left transition-all hover:bg-brandGold-50/60 dark:hover:bg-brandObsidian-800"
                        >
                          <div className="shrink-0 w-9 h-9 rounded-xl bg-brandGold-500/10 text-brandGold-600 dark:text-brandGold-400 flex items-center justify-center group-hover:bg-brandGold-500 group-hover:text-white transition-colors">
                            <Icon className="w-4.5 h-4.5" />
                          </div>
                          <div className="min-w-0">
                            <div className="text-xs sm:text-sm font-semibold text-slate-900 dark:text-white group-hover:text-brandGold-600 dark:group-hover:text-brandGold-400 transition-colors">
                              {mod.name}
                            </div>
                            <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 leading-snug line-clamp-2">
                              {mod.desc}
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </DropdownMenu>
                </Dropdown>

                <button
                  onClick={() => handleNavClick('features')}
                  className={[
                    navLinkBase,
                    'px-3 rounded-lg',
                    currentView === 'features' ? activeLink(true) : '',
                  ].join(' ')}
                >
                  {t('nav.features')}
                </button>

                <button
                  onClick={() => handleNavClick('community')}
                  className={[
                    navLinkBase,
                    'px-3 rounded-lg',
                    currentView === 'community' ? activeLink(true) : '',
                  ].join(' ')}
                >
                  {t('nav.community')}
                </button>

                <button
                  onClick={() => handleNavClick('pricing')}
                  className={[
                    navLinkBase,
                    'px-3 rounded-lg',
                    currentView === 'pricing' ? activeLink(true) : '',
                  ].join(' ')}
                >
                  {t('nav.pricing')}
                </button>

                <button
                  onClick={() => handleNavClick('documentation')}
                  className={[
                    navLinkBase,
                    'px-3 rounded-lg',
                    currentView === 'documentation' ? activeLink(true) : '',
                  ].join(' ')}
                >
                  {t('nav.documentation')}
                </button>
              </nav>
            </div>

            <div className="flex items-center gap-2 sm:gap-3">
              <button
                onClick={onOpenCommandPalette}
                className="hidden md:flex items-center gap-2.5 h-10 px-3.5 rounded-xl border border-slate-200 dark:border-brandObsidian-700 bg-slate-50/90 dark:bg-brandObsidian-900/80 text-slate-500 dark:text-slate-400 text-xs sm:text-sm hover:border-brandGold-500/50 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-white dark:hover:bg-brandObsidian-800 transition-all group shadow-sm cursor-pointer shrink-0"
                title="Search or press ⌘K"
              >
                <Search className="w-4 h-4 text-slate-400 group-hover:text-brandGold-500 transition-colors shrink-0" />
                <span className="inline font-medium text-slate-600 dark:text-slate-300">{t('common.search')}...</span>
                <span className="ml-2 flex items-center gap-0.5">
                  <kbd className="flex items-center justify-center px-1.5 py-0.5 text-[10px] font-mono font-semibold rounded border border-slate-200 dark:border-brandObsidian-700 bg-white dark:bg-brandObsidian-950 shadow-sm text-slate-500 dark:text-slate-400">
                    ⌘K
                  </kbd>
                </span>
              </button>

              <button
                onClick={onOpenCommandPalette}
                className="md:hidden flex items-center justify-center w-11 h-11 rounded-xl border border-slate-200 dark:border-brandObsidian-700 bg-slate-50/90 dark:bg-brandObsidian-900/80 text-slate-600 dark:text-slate-300 hover:text-brandGold-500 transition-colors"
                aria-label="Search"
                title="Search or press ⌘K"
              >
                <Search className="w-5 h-5" />
              </button>

              <div className="hidden sm:flex items-center gap-2">
                <Button variant="ghost" size="md" onClick={onGoToLogin} className="hover:text-brandGold-600 dark:hover:text-brandGold-400">
                  {t('nav.login')}
                </Button>
                <Button
                  variant="primary"
                  size="md"
                  onClick={onGoToRegister}
                  className="bg-brandGold-500 hover:bg-brandGold-600 text-brandObsidian-950 font-bold shadow-md shadow-brandGold-500/20"
                  rightIcon={<ArrowRight className="w-4 h-4" />}
                >
                  {t('nav.register')}
                </Button>
              </div>

              <button
                onClick={() => setMobileOpen(true)}
                className="lg:hidden p-2.5 min-w-[44px] min-h-[44px] flex items-center justify-center rounded-xl text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-brandObsidian-800 transition-colors"
                aria-label="Open menu"
              >
                <Menu className="w-6 h-6" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {typeof document !== 'undefined' &&
        createPortal(
          <AnimatePresence>
            {mobileOpen && (
              <>
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  onClick={() => setMobileOpen(false)}
                  className="fixed inset-0 z-[90] bg-slate-950/60 backdrop-blur-sm lg:hidden"
                />
                <motion.div
                  initial={{ x: '100%' }}
                  animate={{ x: 0 }}
                  exit={{ x: '100%' }}
                  transition={{ type: 'spring', stiffness: 320, damping: 32 }}
                  className="fixed top-0 right-0 bottom-0 z-[95] w-full max-w-sm bg-white dark:bg-brandObsidian-950 border-l border-slate-200 dark:border-brandObsidian-800 shadow-2xl lg:hidden overflow-y-auto"
                >
                  <div className="sticky top-0 z-10 flex items-center justify-between px-5 h-16 bg-white/90 dark:bg-brandObsidian-950/90 backdrop-blur-xl border-b border-slate-200 dark:border-brandObsidian-800">
                    <Logo size="sm" />
                    <button
                      onClick={() => setMobileOpen(false)}
                      className="p-2.5 min-w-[44px] min-h-[44px] flex items-center justify-center rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-brandObsidian-800"
                      aria-label="Close menu"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  <div className="p-4 border-b border-slate-200 dark:border-brandObsidian-800">
                    <button
                      onClick={() => {
                        setMobileOpen(false);
                        onOpenCommandPalette?.();
                      }}
                      className="w-full min-h-[44px] flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-brandObsidian-700 bg-slate-50 dark:bg-brandObsidian-900/80 text-slate-600 dark:text-slate-300 text-sm hover:border-brandGold-500/50 hover:bg-brandGold-50/20 transition-all text-left shadow-sm"
                    >
                      <Search className="w-4 h-4 text-brandGold-500 shrink-0" />
                      <span className="flex-1 font-medium text-xs sm:text-sm">{t('common.search')}...</span>
                      <kbd className="text-[10px] font-mono font-semibold px-1.5 py-0.5 rounded bg-slate-200 dark:bg-brandObsidian-800 border border-slate-300 dark:border-brandObsidian-700 text-slate-600 dark:text-slate-300">⌘K</kbd>
                    </button>
                  </div>

                  <div className="p-5 space-y-1">
                    <div className="px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 font-mono">
                      {t('nav.platform')}
                    </div>
                    {([
                      { view: 'home' as LandingView, key: 'nav.home' },
                      { view: 'features' as LandingView, key: 'nav.features' },
                      { view: 'community' as LandingView, key: 'nav.community' },
                      { view: 'pricing' as LandingView, key: 'nav.pricing' },
                      { view: 'documentation' as LandingView, key: 'nav.documentation' },
                      { view: 'about' as LandingView, key: 'nav.about' },
                      { view: 'contact' as LandingView, key: 'nav.contact' },
                      { view: 'faq' as LandingView, key: 'nav.faq' },
                    ]).map((item, i) => (
                      <motion.button
                        key={item.view}
                        initial={{ opacity: 0, x: 12 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.03 * i, duration: 0.2 }}
                        onClick={() => handleNavClick(item.view)}
                        className={[
                          'w-full min-h-[44px] flex items-center justify-between px-4 py-3 rounded-xl text-left text-sm sm:text-base font-semibold transition-colors',
                          currentView === item.view
                            ? 'bg-brandGold-500/10 text-brandGold-600 dark:text-brandGold-400'
                            : 'text-slate-800 dark:text-slate-100 hover:bg-slate-100 dark:hover:bg-brandObsidian-800/60',
                        ].join(' ')}
                      >
                        <span>{t(item.key)}</span>
                        <ChevronRight className="w-4 h-4 opacity-50" />
                      </motion.button>
                    ))}
                  </div>

                  <div className="px-5 py-5 mt-2 border-t border-slate-200 dark:border-brandObsidian-800 space-y-3">
                    <Button
                      variant="outline"
                      size="lg"
                      onClick={onGoToLogin}
                      className="w-full min-h-[44px]"
                    >
                      {t('nav.login')}
                    </Button>
                    <Button
                      variant="primary"
                      size="lg"
                      onClick={onGoToRegister}
                      className="w-full min-h-[44px] bg-brandGold-500 hover:bg-brandGold-600 text-brandObsidian-950 font-bold"
                      rightIcon={<ArrowRight className="w-4 h-4" />}
                    >
                      {t('nav.register')}
                    </Button>
                    <div className="pt-2 flex items-center gap-2 px-1 text-xs text-slate-500 dark:text-slate-400">
                      <Badge variant="gold" size="sm" dot>
                        Aravanta Cloud OS Production
                      </Badge>
                    </div>
                  </div>
                </motion.div>
              </>
            )}
          </AnimatePresence>,
          document.body
        )}
    </>
  );
};
