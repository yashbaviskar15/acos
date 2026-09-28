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
  Activity,
  ArrowRight,
  User as UserIcon,
  LayoutDashboard,
  Settings,
  LogOut,
  Shield,
  ChevronDown,
  Zap,
  Network,
  Terminal,
} from 'lucide-react';
import { Logo } from '../Logo';
import { Button } from './Button';
import { Dropdown, DropdownTrigger, DropdownMenu } from './Dropdown';
import { Badge } from './Badge';
import { apiFetch } from '../../config/api';

export type LandingView =
  | 'home'
  | 'getting-started'
  | 'features'
  | 'developers'
  | 'documentation'
  | 'user-manual'
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
  | 'terms'
  | 'services'
  | 'cli'
  | 'not-found';

export interface NavbarProps {
  onGoToLogin: () => void;
  onGoToRegister: () => void;
  onOpenCommandPalette?: () => void;
  onNavigate?: (view: LandingView) => void;
  onGoToConsole?: () => void;
  currentView?: LandingView;
  user?: any;
  token?: string | null;
  onLogout?: () => void;
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
    desc: 'Self-healing, multi-cluster K8s control plane (1.27–1.30)',
  },
  {
    icon: HardDrive,
    name: 'Object Storage (ArvStore)',
    desc: 'S3-compatible, ultra-low latency distributed storage',
  },
  {
    icon: Database,
    name: 'Managed Databases',
    desc: 'High-availability Postgres, Redis & MySQL clusters',
  },
  {
    icon: Zap,
    name: 'Serverless Functions',
    desc: 'Sub-millisecond cold start event-driven execution',
  },
  {
    icon: Network,
    name: 'Virtual Private Cloud',
    desc: 'Isolated software-defined networks & security groups',
  },
  {
    icon: Shield,
    name: 'Zero-Trust IAM & KMS',
    desc: 'Hardware-backed secrets & RFC 6238 TOTP MFA',
  },
  {
    icon: Activity,
    name: 'SRE Observability',
    desc: 'Prometheus TSDB, Loki log streams & alert triage',
  },
];

export const Navbar: React.FC<NavbarProps> = ({
  onGoToLogin,
  onGoToRegister,
  onOpenCommandPalette,
  onNavigate,
  onGoToConsole,
  currentView = 'home',
}) => {
  const { t } = useTranslation();
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(() => {
    try {
      const saved = localStorage.getItem('aravanta_user');
      if (saved && saved !== 'undefined' && saved !== 'null') {
        return JSON.parse(saved);
      }
    } catch {}
    return null;
  });
  const [isCheckingSession, setIsCheckingSession] = useState<boolean>(() => {
    return !!localStorage.getItem('aravanta_token');
  });
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('aravanta_token');
    if (!token) {
      setCurrentUser(null);
      setIsCheckingSession(false);
      return;
    }

    let isMounted = true;
    apiFetch<any>('/api/v1/auth/me', { token })
      .then((data) => {
        if (!isMounted) return;
        if (data && (data.email || data.id)) {
          setCurrentUser(data);
          localStorage.setItem('aravanta_user', JSON.stringify(data));
        } else {
          setCurrentUser(null);
          localStorage.removeItem('aravanta_token');
          localStorage.removeItem('aravanta_user');
        }
      })
      .catch(() => {
        if (!isMounted) return;
        const currentToken = localStorage.getItem('aravanta_token');
        if (!currentToken) setCurrentUser(null);
      })
      .finally(() => {
        if (isMounted) setIsCheckingSession(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const handleLogout = () => {
    setUserMenuOpen(false);
    localStorage.removeItem('aravanta_token');
    localStorage.removeItem('aravanta_user');
    setCurrentUser(null);
    window.location.href = '/';
  };

  const getInitials = (name?: string, email?: string) => {
    if (name && name.trim()) {
      const parts = name.trim().split(/\s+/);
      if (parts.length >= 2) return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
      return name.substring(0, 2).toUpperCase();
    }
    if (email) return email.substring(0, 2).toUpperCase();
    return 'AC';
  };

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

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setMobileOpen(false);
        setUserMenuOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const navLinkBase =
    'text-sm font-medium text-slate-600 dark:text-slate-300 hover:text-brandGold-600 dark:hover:text-brandGold-400 transition-colors relative py-2 min-h-[44px] flex items-center';

  const activeLink = (isActive: boolean) =>
    isActive
      ? 'text-brandGold-600 dark:text-brandGold-400 font-semibold after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-brandGold-500 after:rounded-full'
      : '';

  const handleNavClick = (view: LandingView) => {
    setMobileOpen(false);
    if (typeof window !== 'undefined') {
      if (window.location.hash) {
        window.history.replaceState(null, '', window.location.pathname);
      }
      window.scrollTo(0, 0);
    }
    onNavigate?.(view);
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
          <div className="h-16 sm:h-20 flex items-center justify-between gap-2 lg:gap-3">
            <div className="flex items-center gap-2 lg:gap-3 shrink-0">
              <button
                onClick={() => handleNavClick('home')}
                className="flex items-center -m-2 p-2 rounded-xl focus:outline-none focus-visible:ring-2 focus-visible:ring-brandGold-500/50"
              >
                <Logo size="md" />
              </button>

              <div className="hidden 2xl:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-[11px] font-mono font-medium shadow-xs">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span>ap-south-1 • 8ms</span>
              </div>

              <nav className="hidden lg:flex items-center gap-0.5 xl:gap-1">
                <Dropdown align="start" side="bottom">
                  <DropdownTrigger asChild>
                    <button
                      className={[
                        navLinkBase,
                        'flex items-center gap-1 px-2.5 rounded-lg hover:bg-slate-100/60 dark:hover:bg-brandObsidian-800/60',
                        currentView === 'foundations' ? activeLink(true) : '',
                      ].join(' ')}
                    >
                      {t('nav.platform')}
                      <ChevronRight className="w-3.5 h-3.5 -rotate-90 opacity-60" />
                    </button>
                  </DropdownTrigger>
                  <DropdownMenu className="w-[540px] p-3.5 bg-white dark:bg-brandObsidian-900 border border-slate-200 dark:border-brandObsidian-700 rounded-2xl shadow-2xl">
                    <div className="grid grid-cols-2 gap-2">
                      {platformModules.map((mod) => {
                        const Icon = mod.icon;
                        return (
                          <button
                            key={mod.name}
                            onClick={() => handleNavClick('features')}
                            className="group flex items-start gap-3 p-2.5 rounded-xl text-left transition-all hover:bg-brandGold-50/80 dark:hover:bg-brandObsidian-800/80 cursor-pointer"
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
                    </div>
                    <div className="mt-2.5 pt-2.5 border-t border-slate-100 dark:border-brandObsidian-800 flex items-center justify-between px-2 text-xs">
                      <button
                        onClick={() => handleNavClick('services')}
                        className="font-medium text-slate-600 dark:text-slate-400 hover:text-brandGold-600 dark:hover:text-brandGold-400 flex items-center gap-1 cursor-pointer transition-colors"
                      >
                        <span>All Services (20+)</span>
                        <ChevronRight className="w-3 h-3 opacity-60" />
                      </button>
                      <button
                        onClick={() => handleNavClick('cli')}
                        className="font-medium text-slate-600 dark:text-slate-400 hover:text-brandGold-600 dark:hover:text-brandGold-400 flex items-center gap-1 cursor-pointer transition-colors"
                      >
                        <Terminal className="w-3 h-3 text-brandGold-500" />
                        <span>Web Terminal</span>
                        <ChevronRight className="w-3 h-3 opacity-60" />
                      </button>
                      <button
                        onClick={() => handleNavClick('documentation')}
                        className="font-medium text-slate-600 dark:text-slate-400 hover:text-brandGold-600 dark:hover:text-brandGold-400 flex items-center gap-1 cursor-pointer transition-colors"
                      >
                        <span>Architecture Docs</span>
                        <ChevronRight className="w-3 h-3 opacity-60" />
                      </button>
                    </div>
                  </DropdownMenu>
                </Dropdown>

                <button
                  onClick={() => handleNavClick('features')}
                  className={[
                    navLinkBase,
                    'px-2.5 rounded-lg',
                    currentView === 'features' ? activeLink(true) : '',
                  ].join(' ')}
                >
                  {t('nav.features')}
                </button>

                <button
                  onClick={() => handleNavClick('services')}
                  className={[
                    navLinkBase,
                    'px-2.5 rounded-lg',
                    currentView === 'services' ? activeLink(true) : '',
                  ].join(' ')}
                >
                  Services
                </button>

                <button
                  onClick={() => handleNavClick('pricing')}
                  className={[
                    navLinkBase,
                    'px-2.5 rounded-lg',
                    currentView === 'pricing' ? activeLink(true) : '',
                  ].join(' ')}
                >
                  {t('nav.pricing')}
                </button>

                <button
                  onClick={() => handleNavClick('documentation')}
                  className={[
                    navLinkBase,
                    'px-2.5 rounded-lg',
                    currentView === 'documentation' ? activeLink(true) : '',
                  ].join(' ')}
                >
                  Docs
                </button>

                <button
                  onClick={() => handleNavClick('cli')}
                  className={[
                    navLinkBase,
                    'px-2.5 rounded-lg flex items-center gap-1.5',
                    currentView === 'cli' ? activeLink(true) : '',
                  ].join(' ')}
                >
                  <Terminal className="w-3.5 h-3.5 text-brandGold-500" />
                  Terminal
                </button>

                <button
                  onClick={() => handleNavClick('community')}
                  className={[
                    navLinkBase,
                    'px-2.5 rounded-lg',
                    currentView === 'community' ? activeLink(true) : '',
                  ].join(' ')}
                >
                  {t('nav.community')}
                </button>
              </nav>
            </div>

            <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
              <button
                onClick={onOpenCommandPalette}
                className="hidden xl:flex items-center justify-between gap-2 h-9 w-32 xl:w-40 px-3 rounded-xl border border-slate-300 dark:border-brandObsidian-700 bg-slate-100/90 dark:bg-brandObsidian-900/90 text-slate-700 dark:text-slate-200 text-xs hover:border-brandGold-500 hover:bg-white dark:hover:bg-brandObsidian-800 shadow-sm transition-all duration-200 group cursor-pointer shrink-0 focus:outline-none focus:ring-2 focus:ring-brandGold-500/30 btn-press"
                title="Search console or documentation (⌘K)"
              >
                <span className="flex items-center gap-1.5 min-w-0">
                  <Search className="w-3.5 h-3.5 text-brandGold-600 dark:text-brandGold-400 group-hover:scale-110 transition-transform shrink-0" />
                  <span className="truncate font-semibold text-slate-700 dark:text-slate-200">{t('common.search')}</span>
                </span>
                <kbd className="flex items-center justify-center px-1.5 py-0.5 text-[10px] font-mono font-bold rounded-md border border-slate-300 dark:border-brandObsidian-600 bg-white dark:bg-brandObsidian-950 text-slate-600 dark:text-slate-300 shadow-xs">
                  ⌘K
                </kbd>
              </button>

              <button
                onClick={onOpenCommandPalette}
                className="xl:hidden flex items-center justify-center w-9 h-9 sm:w-10 sm:h-10 rounded-xl border border-slate-300 dark:border-brandObsidian-700 bg-slate-100 dark:bg-brandObsidian-900 text-slate-700 dark:text-slate-200 hover:text-brandGold-600 hover:border-brandGold-500 transition-colors shadow-sm btn-press shrink-0"
                aria-label="Search"
                title="Search or press ⌘K"
              >
                <Search className="w-4 h-4 text-brandGold-600 dark:text-brandGold-400" />
              </button>

              {/* Desktop Auth State */}
              <div className="hidden sm:flex items-center gap-2">
                {isCheckingSession ? (
                  <div className="flex items-center gap-2 h-10 px-3 rounded-xl border border-slate-200 dark:border-brandObsidian-800 bg-slate-50 dark:bg-brandObsidian-900/60 animate-pulse">
                    <div className="w-7 h-7 rounded-full bg-slate-300 dark:bg-brandObsidian-700" />
                    <div className="w-16 h-3.5 rounded bg-slate-300 dark:bg-brandObsidian-700" />
                  </div>
                ) : currentUser ? (
                  <div className="relative">
                    <button
                      onClick={() => setUserMenuOpen(!userMenuOpen)}
                      className="flex items-center gap-2.5 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-brandObsidian-700 bg-white/90 dark:bg-brandObsidian-900/90 hover:border-brandGold-500/60 shadow-xs transition-all cursor-pointer btn-press"
                      aria-expanded={userMenuOpen}
                      aria-label="User profile menu"
                    >
                      {currentUser.avatar_url ? (
                        <img
                          src={currentUser.avatar_url}
                          alt={currentUser.full_name || 'User'}
                          className="w-7 h-7 rounded-full object-cover border border-brandGold-500/40"
                        />
                      ) : (
                        <div className="w-7 h-7 rounded-full bg-[#0A1628] border border-brandGold-500/50 flex items-center justify-center text-[11px] font-bold text-brandGold-400 font-mono shadow-xs">
                          {getInitials(currentUser.full_name, currentUser.email)}
                        </div>
                      )}
                      <div className="flex flex-col text-left min-w-0 max-w-[120px]">
                        <span className="text-xs font-bold text-slate-900 dark:text-white truncate leading-tight">
                          {currentUser.full_name || currentUser.email?.split('@')[0]}
                        </span>
                        <span className="text-[10px] text-brandGold-600 dark:text-brandGold-400 font-mono font-medium truncate">
                          {currentUser.role || 'Developer'}
                        </span>
                      </div>
                      <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform ${userMenuOpen ? 'rotate-180' : ''}`} />
                    </button>

                    {userMenuOpen && (
                      <>
                        <div className="fixed inset-0 z-40" onClick={() => setUserMenuOpen(false)} />
                        <div className="absolute right-0 mt-2 w-64 rounded-2xl border border-slate-200 dark:border-brandObsidian-700 bg-white dark:bg-[#0F2038] shadow-2xl p-2 z-50 animate-dropdownIn font-sans">
                          <div className="px-3 py-2 border-b border-slate-100 dark:border-brandObsidian-800 mb-1">
                            <p className="text-xs font-bold text-slate-900 dark:text-white truncate">{currentUser.full_name || 'User'}</p>
                            <p className="text-[11px] text-slate-500 dark:text-slate-400 font-mono truncate">{currentUser.email}</p>
                            <div className="mt-1.5 inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-brandGold-500/15 text-brandGold-700 dark:text-brandGold-300 border border-brandGold-500/30">
                              <Shield className="w-3 h-3" /> {currentUser.role || 'Developer'}
                            </div>
                          </div>
                          <button
                            onClick={() => {
                              setUserMenuOpen(false);
                              if (onGoToConsole) {
                                onGoToConsole();
                              } else {
                                window.dispatchEvent(new CustomEvent('acos:go-to-console'));
                              }
                            }}
                            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-brandObsidian-800/80 transition-colors text-left cursor-pointer"
                          >
                            <LayoutDashboard className="w-4 h-4 text-brandGold-500" />
                            <span>Console Dashboard</span>
                          </button>
                          <button
                            onClick={() => {
                              setUserMenuOpen(false);
                              onNavigate?.('contact');
                            }}
                            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-brandObsidian-800/80 transition-colors text-left cursor-pointer"
                          >
                            <UserIcon className="w-4 h-4 text-blue-500" />
                            <span>Profile & Account</span>
                          </button>
                          <button
                            onClick={() => {
                              setUserMenuOpen(false);
                              onNavigate?.('documentation');
                            }}
                            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-brandObsidian-800/80 transition-colors text-left cursor-pointer"
                          >
                            <Settings className="w-4 h-4 text-slate-400" />
                            <span>Platform Settings</span>
                          </button>
                          <div className="h-px bg-slate-100 dark:bg-brandObsidian-800 my-1" />
                          <button
                            onClick={handleLogout}
                            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-colors text-left cursor-pointer"
                          >
                            <LogOut className="w-4 h-4" />
                            <span>Sign Out</span>
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                ) : (
                  <div className="flex items-center gap-1.5 shrink-0">
                    <Button variant="ghost" size="sm" onClick={onGoToLogin} className="hover:text-brandGold-600 dark:hover:text-brandGold-400 whitespace-nowrap text-xs sm:text-sm font-semibold px-2.5">
                      {t('nav.login')}
                    </Button>
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={onGoToRegister}
                      className="bg-brandGold-500 hover:bg-brandGold-600 text-brandObsidian-950 font-bold shadow-md shadow-brandGold-500/20 whitespace-nowrap shrink-0 px-3 py-1.5 text-xs sm:text-sm"
                      rightIcon={<ArrowRight className="w-3.5 h-3.5" />}
                    >
                      {t('nav.register')}
                    </Button>
                  </div>
                )}
              </div>

              {/* Mobile Profile / Hamburger */}
              <div className="flex sm:hidden items-center gap-1.5">
                {currentUser && (
                  <div className="w-8 h-8 rounded-full bg-[#0A1628] border border-brandGold-500/50 flex items-center justify-center text-[10px] font-bold text-brandGold-400 font-mono shadow-xs">
                    {getInitials(currentUser.full_name, currentUser.email)}
                  </div>
                )}
                <button
                  onClick={() => setMobileOpen(true)}
                  className="p-2 min-w-[40px] min-h-[40px] flex items-center justify-center rounded-xl text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-brandObsidian-800 transition-colors"
                  aria-label="Open menu"
                >
                  <Menu className="w-6 h-6" />
                </button>
              </div>

              <button
                onClick={() => setMobileOpen(true)}
                className="hidden sm:max-lg:flex p-2.5 min-w-[44px] min-h-[44px] items-center justify-center rounded-xl text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-brandObsidian-800 transition-colors"
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
                      className="w-full min-h-[44px] flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-brandObsidian-700 bg-slate-100 dark:bg-brandObsidian-900 text-slate-800 dark:text-slate-100 text-sm hover:border-brandGold-500 hover:bg-white dark:hover:bg-brandObsidian-800 transition-all text-left shadow-sm btn-press"
                    >
                      <Search className="w-4 h-4 text-brandGold-600 dark:text-brandGold-400 shrink-0" />
                      <span className="flex-1 font-semibold text-xs sm:text-sm">{t('common.search')}...</span>
                      <kbd className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-md bg-white dark:bg-brandObsidian-800 border border-slate-300 dark:border-brandObsidian-600 text-slate-700 dark:text-slate-200">⌘K</kbd>
                    </button>
                  </div>

                  <div className="p-4 space-y-6">
                    {/* Category: Core Infrastructure */}
                    <div className="space-y-1">
                      <div className="px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 font-mono">
                        Core Infrastructure
                      </div>
                      {[
                        { view: 'home' as LandingView, label: 'Platform Overview' },
                        { view: 'features' as LandingView, label: 'Feature Matrix (18+ Primitives)' },
                        { view: 'services' as LandingView, label: 'Service Catalog (20+ Services)' },
                        { view: 'cli' as LandingView, label: 'Interactive Web Terminal (CLI)' },
                        { view: 'developers' as LandingView, label: 'Developer Hub & CLI' },
                        { view: 'pricing' as LandingView, label: 'Pricing & FinOps Engine' },
                      ].map((item) => (
                        <button
                          key={item.view}
                          onClick={() => handleNavClick(item.view)}
                          className={[
                            'w-full min-h-[44px] flex items-center justify-between px-3.5 py-2.5 rounded-xl text-left text-sm font-semibold transition-colors',
                            currentView === item.view
                              ? 'bg-brandGold-500/10 text-brandGold-600 dark:text-brandGold-400'
                              : 'text-slate-800 dark:text-slate-100 hover:bg-slate-100 dark:hover:bg-brandObsidian-800/60',
                          ].join(' ')}
                        >
                          <span>{item.label}</span>
                          <ChevronRight className="w-4 h-4 opacity-50" />
                        </button>
                      ))}
                    </div>

                    {/* Category: Documentation & Architecture */}
                    <div className="space-y-1">
                      <div className="px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 font-mono">
                        Documentation & SOPs
                      </div>
                      {[
                        { view: 'documentation' as LandingView, label: 'Architecture Docs & API' },
                        { view: 'getting-started' as LandingView, label: '5-Minute Quickstart Guide' },
                        { view: 'user-manual' as LandingView, label: 'Security & Auth Manual' },
                        { view: 'faq' as LandingView, label: 'Frequently Asked Questions' },
                      ].map((item) => (
                        <button
                          key={item.view}
                          onClick={() => handleNavClick(item.view)}
                          className={[
                            'w-full min-h-[44px] flex items-center justify-between px-3.5 py-2.5 rounded-xl text-left text-sm font-semibold transition-colors',
                            currentView === item.view
                              ? 'bg-brandGold-500/10 text-brandGold-600 dark:text-brandGold-400'
                              : 'text-slate-800 dark:text-slate-100 hover:bg-slate-100 dark:hover:bg-brandObsidian-800/60',
                          ].join(' ')}
                        >
                          <span>{item.label}</span>
                          <ChevronRight className="w-4 h-4 opacity-50" />
                        </button>
                      ))}
                    </div>

                    {/* Category: Ecosystem & Governance */}
                    <div className="space-y-1">
                      <div className="px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 font-mono">
                        Ecosystem & Legal
                      </div>
                      {[
                        { view: 'about' as LandingView, label: 'About Aravanta Cloud OS' },
                        { view: 'community' as LandingView, label: 'SRE Engineering Community' },
                        { view: 'contact' as LandingView, label: 'Contact & War-Room' },
                        { view: 'sitemap' as LandingView, label: 'Platform Sitemap' },
                        { view: 'privacy' as LandingView, label: 'Privacy Policy (DPDPA)' },
                        { view: 'terms' as LandingView, label: 'Terms of Use & SLAs' },
                        { view: 'disclaimer' as LandingView, label: 'Platform Disclaimer' },
                      ].map((item) => (
                        <button
                          key={item.view}
                          onClick={() => handleNavClick(item.view)}
                          className={[
                            'w-full min-h-[44px] flex items-center justify-between px-3.5 py-2.5 rounded-xl text-left text-sm font-semibold transition-colors',
                            currentView === item.view
                              ? 'bg-brandGold-500/10 text-brandGold-600 dark:text-brandGold-400'
                              : 'text-slate-800 dark:text-slate-100 hover:bg-slate-100 dark:hover:bg-brandObsidian-800/60',
                          ].join(' ')}
                        >
                          <span>{item.label}</span>
                          <ChevronRight className="w-4 h-4 opacity-50" />
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="px-5 py-5 mt-2 border-t border-slate-200 dark:border-brandObsidian-800 space-y-3">
                    {currentUser ? (
                      <div className="space-y-3">
                        <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 dark:bg-brandObsidian-900 border border-slate-200 dark:border-brandObsidian-800">
                          {currentUser.avatar_url ? (
                            <img
                              src={currentUser.avatar_url}
                              alt={currentUser.full_name || 'User'}
                              className="w-10 h-10 rounded-full object-cover border border-brandGold-500/40"
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-full bg-[#0A1628] border border-brandGold-500/50 flex items-center justify-center text-xs font-bold text-brandGold-400 font-mono">
                              {getInitials(currentUser.full_name, currentUser.email)}
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-bold text-slate-900 dark:text-white truncate">
                              {currentUser.full_name || currentUser.email?.split('@')[0]}
                            </p>
                            <p className="text-xs text-slate-500 dark:text-slate-400 font-mono truncate">
                              {currentUser.email}
                            </p>
                            <span className="inline-block mt-1 text-[10px] font-mono font-bold text-brandGold-600 dark:text-brandGold-400">
                              {currentUser.role || 'Developer'}
                            </span>
                          </div>
                        </div>

                        <Button
                          variant="primary"
                          size="lg"
                          onClick={() => {
                            setMobileOpen(false);
                            if (onGoToConsole) {
                              onGoToConsole();
                            } else {
                              window.dispatchEvent(new CustomEvent('acos:go-to-console'));
                            }
                          }}
                          className="w-full min-h-[44px] bg-brandGold-500 hover:bg-brandGold-600 text-brandObsidian-950 font-bold"
                          leftIcon={<LayoutDashboard className="w-4 h-4" />}
                        >
                          Console Dashboard
                        </Button>

                        <Button
                          variant="outline"
                          size="lg"
                          onClick={() => {
                            setMobileOpen(false);
                            handleLogout();
                          }}
                          className="w-full min-h-[44px] text-rose-600 dark:text-rose-400 border-rose-200 dark:border-rose-900/40 hover:bg-rose-50 dark:hover:bg-rose-950/20"
                          leftIcon={<LogOut className="w-4 h-4" />}
                        >
                          Sign Out
                        </Button>
                      </div>
                    ) : (
                      <>
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
                      </>
                    )}
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
