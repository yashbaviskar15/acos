import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Menu,
  X,
  ChevronRight,
  Search,
  Server,
  Container,
  HardDrive,
  Database,
  GitBranch,
  Activity,
  Shield,
  CreditCard,
} from 'lucide-react';
import { Logo } from '../Logo';
import { Button } from './Button';
import { Dropdown, DropdownTrigger, DropdownMenu } from './Dropdown';
import { Badge } from './Badge';

export type LandingView =
  | 'home'
  | 'features'
  | 'developers'
  | 'documentation'
  | 'pricing'
  | 'about';

export interface NavbarProps {
  onGoToLogin: () => void;
  onGoToRegister: () => void;
  onOpenCommandPalette?: () => void;
  onNavigate?: (view: LandingView) => void;
  currentView?: LandingView;
}

const productModules = [
  {
    icon: Server,
    name: 'Compute',
    desc: 'Elastic VMs, bare metal, GPU',
    href: '#features',
  },
  {
    icon: Container,
    name: 'Kubernetes',
    desc: 'Managed K8s clusters with autoscaling',
    href: '#features',
  },
  {
    icon: HardDrive,
    name: 'Storage',
    desc: 'S3-compatible object storage, volumes',
    href: '#features',
  },
  {
    icon: Database,
    name: 'Database',
    desc: 'Postgres, MySQL, Redis, MongoDB',
    href: '#features',
  },
  {
    icon: GitBranch,
    name: 'CI/CD',
    desc: 'GitOps pipelines, artifact registry',
    href: '#features',
  },
  {
    icon: Activity,
    name: 'Monitoring',
    desc: 'Prometheus, Grafana, log explorer',
    href: '#features',
  },
  {
    icon: Shield,
    name: 'Security',
    desc: 'RBAC, WAF, secret manager, audit',
    href: '#features',
  },
  {
    icon: CreditCard,
    name: 'Billing',
    desc: 'FinOps analytics, cost alerts, invoices',
    href: '#features',
  },
];

const scrollSections = [
  { id: 'features', label: 'Features' },
  { id: 'workflow', label: 'Workflow' },
  { id: 'integrations', label: 'Integrations' },
  { id: 'pricing', label: 'Pricing' },
  { id: 'faq', label: 'FAQ' },
];

export const Navbar: React.FC<NavbarProps> = ({
  onGoToLogin,
  onGoToRegister,
  onOpenCommandPalette,
  onNavigate,
  currentView = 'home',
}) => {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [activeSection, setActiveSection] = useState<string>('');

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 8);

      if (currentView === 'home') {
        let current = '';
        for (const section of scrollSections) {
          const el = document.getElementById(section.id);
          if (el) {
            const rect = el.getBoundingClientRect();
            if (rect.top <= 120) current = section.id;
          }
        }
        setActiveSection(current);
      }
    };

    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [currentView]);

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
    'text-sm font-medium text-slate-600 dark:text-slate-300 hover:text-brandGold-600 dark:hover:text-brandGold-400 transition-colors relative py-2';

  const activeLink = (isActive: boolean) =>
    isActive
      ? 'text-brandGold-600 dark:text-brandGold-400 after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-brandGold-500'
      : '';

  const handleNavClick = (view: LandingView, hash?: string) => {
    setMobileOpen(false);
    onNavigate?.(view);
    if (hash && currentView === view) {
      setTimeout(() => {
        const el = document.getElementById(hash.replace('#', ''));
        el?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 50);
    } else if (view === 'home') {
      setTimeout(() => window.scrollTo({ top: 0, behavior: 'smooth' }), 50);
    }
  };

  return (
    <>
      <header
        className={[
          'sticky top-0 z-50 w-full transition-all duration-300',
          scrolled
            ? 'bg-white/85 dark:bg-brandObsidian-950/85 backdrop-blur-xl border-b border-slate-200/80 dark:border-brandObsidian-800/80 shadow-[0_1px_0_0_rgba(0,0,0,0.04),0_8px_24px_-16px_rgba(0,0,0,0.2)]'
            : 'bg-transparent border-b border-transparent',
        ].join(' ')}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="h-16 flex items-center justify-between gap-4">
            <div className="flex items-center gap-8 shrink-0">
              <button
                onClick={() => handleNavClick('home')}
                className="flex items-center -m-2 p-2 rounded-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-brandGold-500/50"
              >
                <Logo size="md" />
              </button>

              <nav className="hidden lg:flex items-center gap-1">
                <Dropdown align="start" side="bottom">
                  <DropdownTrigger asChild>
                    <button
                      className={[
                        navLinkBase,
                        'flex items-center gap-1 px-3',
                        activeSection === 'features'
                          ? activeLink(true)
                          : '',
                      ].join(' ')}
                    >
                      Product
                      <ChevronRight className="w-3.5 h-3.5 -rotate-90 opacity-60" />
                    </button>
                  </DropdownTrigger>
                  <DropdownMenu className="w-[420px] p-3 grid grid-cols-2 gap-1">
                    {productModules.map((mod) => {
                      const Icon = mod.icon;
                      return (
                        <button
                          key={mod.name}
                          onClick={() => handleNavClick('features')}
                          className="group flex items-start gap-3 p-2.5 rounded-xl text-left transition-colors hover:bg-slate-50 dark:hover:bg-brandObsidian-700/50"
                        >
                          <div className="shrink-0 w-9 h-9 rounded-lg bg-brandGold-500/10 text-brandGold-500 dark:text-brandGold-400 flex items-center justify-center group-hover:bg-brandGold-500 group-hover:text-white transition-colors">
                            <Icon className="w-4.5 h-4.5" />
                          </div>
                          <div className="min-w-0">
                            <div className="text-sm font-semibold text-slate-900 dark:text-white">
                              {mod.name}
                            </div>
                            <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 leading-snug">
                              {mod.desc}
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </DropdownMenu>
                </Dropdown>

                <button
                  onClick={() => handleNavClick('home', '#integrations')}
                  className={[
                    navLinkBase,
                    'px-3',
                    activeSection === 'integrations' ? activeLink(true) : '',
                  ].join(' ')}
                >
                  Solutions
                </button>

                <button
                  onClick={() => handleNavClick('developers')}
                  className={[
                    navLinkBase,
                    'px-3',
                    currentView === 'developers' ? activeLink(true) : '',
                  ].join(' ')}
                >
                  Developers
                </button>

                <button
                  onClick={() => handleNavClick('pricing')}
                  className={[
                    navLinkBase,
                    'px-3',
                    currentView === 'pricing' || activeSection === 'pricing'
                      ? activeLink(true)
                      : '',
                  ].join(' ')}
                >
                  Pricing
                </button>

                <button
                  onClick={() => handleNavClick('documentation')}
                  className={[
                    navLinkBase,
                    'px-3',
                    currentView === 'documentation' ? activeLink(true) : '',
                  ].join(' ')}
                >
                  Docs
                </button>

                <button
                  onClick={() => handleNavClick('about')}
                  className={[
                    navLinkBase,
                    'px-3',
                    currentView === 'about' ? activeLink(true) : '',
                  ].join(' ')}
                >
                  Company
                </button>
              </nav>
            </div>

            <div className="flex items-center gap-2 sm:gap-3">
              {/* Desktop & Tablet Search Trigger */}
              <button
                onClick={onOpenCommandPalette}
                className="hidden md:flex items-center gap-2.5 h-10 px-3.5 rounded-xl border border-slate-200 dark:border-brandObsidian-700 bg-slate-50/80 dark:bg-brandObsidian-800/60 text-slate-500 dark:text-slate-400 text-xs sm:text-sm hover:border-brandGold-500/50 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100/80 dark:hover:bg-brandObsidian-800 transition-all group shadow-sm cursor-pointer shrink-0"
                title="Search or press ⌘K"
              >
                <Search className="w-4 h-4 text-slate-400 group-hover:text-brandGold-500 transition-colors shrink-0" />
                <span className="inline font-medium text-slate-600 dark:text-slate-300">Search docs & fleet...</span>
                <span className="ml-2 flex items-center gap-0.5">
                  <kbd className="flex items-center justify-center px-1.5 py-0.5 text-[10px] font-mono font-semibold rounded border border-slate-200 dark:border-brandObsidian-600 bg-white dark:bg-brandObsidian-900 shadow-sm text-slate-500 dark:text-slate-400">
                    ⌘K
                  </kbd>
                </span>
              </button>

              {/* Mobile Search Button (< md) */}
              <button
                onClick={onOpenCommandPalette}
                className="md:hidden flex items-center justify-center w-9 h-9 rounded-xl border border-slate-200 dark:border-brandObsidian-700 bg-slate-50/80 dark:bg-brandObsidian-800/60 text-slate-600 dark:text-slate-300 hover:text-brandGold-500 hover:border-brandGold-500/40 transition-colors"
                aria-label="Search"
                title="Search or press ⌘K"
              >
                <Search className="w-4 h-4" />
              </button>

              <div className="hidden sm:flex items-center gap-2">
                <Button variant="ghost" size="md" onClick={onGoToLogin}>
                  Sign in
                </Button>
                <Button variant="primary" size="md" onClick={onGoToRegister} rightIcon={<ChevronRight className="w-4 h-4" />}>
                  Get started
                </Button>
              </div>

              <button
                onClick={() => setMobileOpen(true)}
                className="lg:hidden p-2 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-brandObsidian-800 transition-colors"
                aria-label="Open menu"
              >
                <Menu className="w-5 h-5" />
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
                  className="fixed inset-0 z-[90] bg-slate-950/50 backdrop-blur-sm lg:hidden"
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
                      className="p-2 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-brandObsidian-800"
                      aria-label="Close menu"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  {/* Mobile Menu Search Bar */}
                  <div className="p-4 border-b border-slate-200 dark:border-brandObsidian-800">
                    <button
                      onClick={() => {
                        setMobileOpen(false);
                        onOpenCommandPalette?.();
                      }}
                      className="w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-brandObsidian-700 bg-slate-50 dark:bg-brandObsidian-900/80 text-slate-600 dark:text-slate-300 text-sm hover:border-brandGold-500/50 hover:bg-brandGold-500/5 transition-all text-left shadow-sm"
                    >
                      <Search className="w-4 h-4 text-brandGold-500 shrink-0" />
                      <span className="flex-1 font-medium text-xs sm:text-sm">Search docs, commands...</span>
                      <kbd className="text-[10px] font-mono font-semibold px-1.5 py-0.5 rounded bg-slate-200 dark:bg-brandObsidian-800 border border-slate-300 dark:border-brandObsidian-700 text-slate-600 dark:text-slate-300">⌘K</kbd>
                    </button>
                  </div>

                  <div className="p-5 space-y-1">
                    {(['home', 'features', 'developers', 'documentation', 'pricing', 'about'] as LandingView[]).map(
                      (view, i) => (
                        <motion.button
                          key={view}
                          initial={{ opacity: 0, x: 12 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.04 * i, duration: 0.2 }}
                          onClick={() => handleNavClick(view)}
                          className={[
                            'w-full flex items-center justify-between px-4 py-3.5 rounded-xl text-left text-base font-semibold transition-colors',
                            currentView === view
                              ? 'bg-brandGold-500/10 text-brandGold-600 dark:text-brandGold-400'
                              : 'text-slate-800 dark:text-slate-100 hover:bg-slate-100 dark:hover:bg-brandObsidian-800/60',
                          ].join(' ')}
                        >
                          <span className="capitalize">
                            {view === 'home' ? 'Overview' : view}
                          </span>
                          <ChevronRight className="w-4.5 h-4.5 opacity-50" />
                        </motion.button>
                      )
                    )}
                  </div>

                  <div className="px-5 py-4 mt-2 border-t border-slate-200 dark:border-brandObsidian-800">
                    <div className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-3 px-2">
                      Product Modules
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      {productModules.slice(0, 6).map((mod) => {
                        const Icon = mod.icon;
                        return (
                          <button
                            key={mod.name}
                            onClick={() => handleNavClick('features')}
                            className="flex flex-col items-start gap-1.5 p-3 rounded-xl bg-slate-50 dark:bg-brandObsidian-800/50 hover:bg-slate-100 dark:hover:bg-brandObsidian-700/60 transition-colors"
                          >
                            <Icon className="w-4.5 h-4.5 text-brandGold-500" />
                            <span className="text-xs font-semibold text-slate-800 dark:text-slate-100">
                              {mod.name}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="px-5 py-5 mt-2 border-t border-slate-200 dark:border-brandObsidian-800 space-y-3">
                    <Button
                      variant="outline"
                      size="lg"
                      onClick={onGoToLogin}
                      className="w-full"
                    >
                      Sign in
                    </Button>
                    <Button
                      variant="primary"
                      size="lg"
                      onClick={onGoToRegister}
                      className="w-full"
                      rightIcon={<ChevronRight className="w-4 h-4" />}
                    >
                      Create workspace
                    </Button>
                    <div className="pt-2 flex items-center gap-2 px-1 text-xs text-slate-500 dark:text-slate-400">
                      <Badge variant="success" size="sm" dot>
                        All systems operational
                      </Badge>
                      <span className="ml-auto font-mono">99.98%</span>
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
