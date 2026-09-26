import React, { useState, useEffect, useRef } from 'react';
import { 
  Bell, 
  Search, 
  RefreshCw, 
  X, 
  Menu, 
  User, 
  ChevronDown, 
  ChevronRight, 
  LogOut, 
  KeyRound,
  Sun,
  Moon,
  CheckCircle2
} from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { apiFetch } from '../config/api';

interface HeaderProps {
  title: string;
  subtitle?: string;
  user?: any;
  token?: string | null;
  onUpdateUser?: (updatedUser: any, newToken?: string) => void;
  onRefresh?: () => void;
  searchTerm?: string;
  onSearchChange?: (val: string) => void;
  onMobileMenuToggle?: () => void;
  onNavigateToProfile?: () => void;
  onOpenCommandPalette?: () => void;
  onToggleCopilot?: () => void;
  onNavigateTab?: (tab: string) => void;
}

interface NotificationItem {
  id: string | number;
  title: string;
  desc: string;
  time: string;
  type: 'info' | 'success' | 'warning' | 'error';
  read: boolean;
}

export const Header: React.FC<HeaderProps> = ({ 
  title, 
  subtitle, 
  user,
  token,
  onRefresh, 
  searchTerm = '',
  onSearchChange,
  onMobileMenuToggle,
  onNavigateToProfile,
  onOpenCommandPalette,
  onNavigateTab,
}) => {
  const { theme, toggleTheme } = useTheme();
  const [showNotifications, setShowNotifications] = useState(false);
  const [showEnvMenu, setShowEnvMenu] = useState(false);
  const [showAccountMenu, setShowAccountMenu] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [activeEnv, setActiveEnv] = useState<'prod' | 'staging' | 'dev'>('prod');
  const [activeRegion, setActiveRegion] = useState('ap-south-1');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isMobileSearchOpen, setIsMobileSearchOpen] = useState(false);

  const [notifications, setNotifications] = useState<NotificationItem[]>([]);

  // Fetch real user and system notifications from operations center
  useEffect(() => {
    let isMounted = true;
    const fetchActualNotifications = async () => {
      try {
        const authToken = token || localStorage.getItem('aravanta_token');
        const data = await apiFetch<any[]>('/api/v1/operations/notifications', { token: authToken });
        if (Array.isArray(data) && isMounted) {
          const formatted: NotificationItem[] = data.map((n: any, idx: number) => {
            let itemType: 'info' | 'success' | 'warning' | 'error' = 'info';
            const t = (n.type || '').toLowerCase();
            if (t === 'error' || t === 'critical') itemType = 'error';
            else if (t === 'warning') itemType = 'warning';
            else if (t === 'success') itemType = 'success';

            let timeStr = 'Just now';
            if (n.created_at) {
              const diffMs = Date.now() - new Date(n.created_at).getTime();
              const diffMin = Math.max(1, Math.floor(diffMs / 60000));
              if (diffMin < 60) timeStr = `${diffMin}m ago`;
              else if (diffMin < 1440) timeStr = `${Math.floor(diffMin / 60)}h ago`;
              else timeStr = `${Math.floor(diffMin / 1440)}d ago`;
            }

            return {
              id: n.id || `notif-${idx}`,
              title: n.title || 'System Notification',
              desc: n.desc || n.message || '',
              time: timeStr,
              type: itemType,
              read: Boolean(n.read)
            };
          });
          setNotifications(formatted);
        } else if (isMounted) {
          setNotifications([]);
        }
      } catch {
        if (isMounted) {
          setNotifications([]);
        }
      }
    };

    fetchActualNotifications();
    const interval = setInterval(fetchActualNotifications, 15000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [token]);

  const envMenuRef = useRef<HTMLDivElement>(null);
  const notifMenuRef = useRef<HTMLDivElement>(null);
  const accountMenuRef = useRef<HTMLDivElement>(null);

  // Close dropdowns on outside click
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (envMenuRef.current && !envMenuRef.current.contains(e.target as Node)) {
        setShowEnvMenu(false);
      }
      if (notifMenuRef.current && !notifMenuRef.current.contains(e.target as Node)) {
        setShowNotifications(false);
      }
      if (accountMenuRef.current && !accountMenuRef.current.contains(e.target as Node)) {
        setShowAccountMenu(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  const handleRefreshClick = () => {
    setIsRefreshing(true);
    onRefresh?.();
    setTimeout(() => setIsRefreshing(false), 800);
  };

  const markAllRead = async () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    try {
      const authToken = token || localStorage.getItem('aravanta_token');
      await apiFetch('/api/v1/operations/notifications/read-all', { method: 'POST', token: authToken });
    } catch {
      // ignore
    }
  };

  const handleNotificationClick = async (notifId: string | number) => {
    setNotifications(prev => prev.map(item => item.id === notifId ? { ...item, read: true } : item));
    try {
      const authToken = token || localStorage.getItem('aravanta_token');
      await apiFetch(`/api/v1/operations/notifications/${notifId}/read`, { method: 'POST', token: authToken });
    } catch {
      // ignore
    }
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  const displayName = user?.full_name || user?.email?.split('@')[0] || 'Cloud Operator';
  const displayRole = user?.role || user?.roles?.[0] || 'SuperAdmin';
  const userInitial = displayName.charAt(0).toUpperCase();

  // Extract clean breadcrumb title
  const cleanTitle = title.includes('—') ? title.split('—')[0].trim() : title;

  return (
    <header className="h-14 bg-white dark:bg-[#0d131f] border-b border-slate-300 dark:border-[#1e293b] px-3 sm:px-4 lg:px-6 flex items-center justify-between sticky top-0 z-20 shadow-xs dark:shadow-md min-w-0 w-full select-none transition-colors duration-200">
      {/* Mobile Search Overlay */}
      {isMobileSearchOpen && (
        <div className="absolute inset-0 bg-white dark:bg-[#0d131f] z-30 px-3 flex items-center gap-2 border-b border-slate-200 dark:border-[#1e293b]">
          <Search className="w-4 h-4 text-[#C6923B] dark:text-[#D4A347] shrink-0" />
          <input
            type="text"
            autoFocus
            value={searchTerm}
            onChange={(e) => onSearchChange?.(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && onOpenCommandPalette) {
                setIsMobileSearchOpen(false);
                onOpenCommandPalette();
              }
            }}
            placeholder="Search console, resources, logs..."
            className="flex-1 bg-transparent border-none text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none"
          />
          <button
            onClick={() => setIsMobileSearchOpen(false)}
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Left: Mobile Toggle & Breadcrumbs */}
      <div className="flex items-center gap-1.5 sm:gap-3 min-w-0 flex-1 mr-2">
        {onMobileMenuToggle && (
          <button
            onClick={onMobileMenuToggle}
            className="p-1.5 md:hidden text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white bg-slate-100 dark:bg-slate-800/60 hover:bg-slate-200 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700/60 rounded-lg transition-colors shrink-0 cursor-pointer"
            title="Toggle Menu"
          >
            <Menu className="w-4 h-4" />
          </button>
        )}

        {/* Cloud-Ops Breadcrumbs */}
        <div className="flex items-center gap-1 sm:gap-1.5 text-xs font-mono text-slate-500 dark:text-slate-400 truncate">
          <span className="hidden sm:inline font-bold text-slate-600 dark:text-slate-400 hover:text-[#C6923B] dark:hover:text-[#D4A347] transition-colors cursor-pointer">
            Aravanta
          </span>
          <ChevronRight className="w-3 h-3 text-slate-400 dark:text-slate-600 hidden sm:inline shrink-0" />
          <span className="font-bold text-slate-900 dark:text-slate-100 truncate text-[11px] sm:text-xs">
            {cleanTitle}
          </span>
          {subtitle && (
            <span className="hidden 2xl:inline text-[10px] text-slate-400 font-mono font-normal truncate max-w-xs">
              • {subtitle}
            </span>
          )}
          <span className="hidden lg:inline-flex items-center gap-1 ml-1 px-1.5 py-0.5 rounded text-[9px] font-sans font-semibold bg-[#C6923B]/10 text-[#C6923B] dark:text-[#D4A347] border border-[#C6923B]/25">
            CloudOS
          </span>
        </div>
      </div>

      {/* Center: Global Search Bar with Keyboard Pill (Desktop) */}
      <div className="hidden md:flex items-center relative max-w-xs xl:max-w-md w-full mx-2 lg:mx-3">
        <Search className="w-3.5 h-3.5 absolute left-3 text-slate-400 dark:text-slate-500 pointer-events-none" />
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => onSearchChange?.(e.target.value)}
          placeholder="Search resources, services, docs... (Ctrl+K)"
          className="w-full pl-9 pr-14 py-1.5 bg-slate-100 dark:bg-[#141b2a] hover:bg-slate-200/70 dark:hover:bg-[#182236] focus:bg-white dark:focus:bg-[#1a253b] border border-slate-300 dark:border-[#23304a] focus:border-[#C6923B] dark:focus:border-[#D4A347] rounded-lg text-xs text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-[#C6923B]/30 transition-all font-sans"
        />
        {onOpenCommandPalette && (
          <button
            onClick={onOpenCommandPalette}
            title="Open Command Palette (Ctrl+K)"
            className="absolute right-2 px-1.5 py-0.5 text-[9px] font-mono font-bold bg-slate-200 dark:bg-[#1e293b] hover:bg-[#C6923B] hover:text-white dark:hover:bg-[#C6923B] text-slate-600 dark:text-slate-400 rounded border border-slate-300 dark:border-slate-700/80 transition-colors cursor-pointer"
          >
            Ctrl K
          </button>
        )}
      </div>

      {/* Right: Environment Switcher, Theme Toggle, Notifications, Account */}
      <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
        {/* Mobile Search Button */}
        <button
          onClick={() => {
            if (onOpenCommandPalette) {
              onOpenCommandPalette();
            } else {
              setIsMobileSearchOpen(true);
            }
          }}
          className="md:hidden p-1.5 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white bg-slate-100 dark:bg-slate-800/60 rounded-lg border border-slate-200 dark:border-slate-700/60"
          title="Search console (Ctrl+K)"
        >
          <Search className="w-3.5 h-3.5" />
        </button>

        {/* Environment & Region Switcher */}
        <div className="relative" ref={envMenuRef}>
          <button
            onClick={() => setShowEnvMenu(!showEnvMenu)}
            className="flex items-center gap-1.5 px-2 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200/80 dark:bg-[#141b2a] dark:hover:bg-[#192236] border border-slate-300 dark:border-[#23304a] text-xs font-mono font-semibold text-slate-800 dark:text-slate-200 transition-colors cursor-pointer"
            title="Switch Active Environment"
          >
            <span className="w-2 h-2 rounded-full bg-emerald-500 ring-2 ring-emerald-500/20 shrink-0" />
            <span className="capitalize">{activeEnv}</span>
            <span className="hidden sm:inline text-slate-400 dark:text-slate-500">•</span>
            <span className="hidden sm:inline text-slate-600 dark:text-slate-400 text-[11px]">{activeRegion}</span>
            <ChevronDown className="w-3 h-3 text-slate-400" />
          </button>

          {showEnvMenu && (
            <div className="absolute right-0 mt-1.5 w-56 sm:w-60 max-w-[calc(100vw-1rem)] bg-white dark:bg-[#111827] border border-slate-300 dark:border-[#23304a] rounded-xl shadow-2xl py-1.5 z-50 animate-fadeIn">
              <div className="px-3 py-1.5 text-[10px] font-mono font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800">
                Target Cloud Environment
              </div>
              {[
                { id: 'prod', name: 'production', region: 'ap-south-1 (Mumbai)', latency: '14ms', status: 'Active' },
                { id: 'staging', name: 'staging', region: 'us-east-1 (N. Virginia)', latency: '82ms', status: 'Available' },
                { id: 'dev', name: 'development', region: 'eu-west-1 (Frankfurt)', latency: '116ms', status: 'Available' },
              ].map((env) => (
                <button
                  key={env.id}
                  onClick={() => {
                    setActiveEnv(env.id as any);
                    setActiveRegion(env.id === 'prod' ? 'ap-south-1' : env.id === 'staging' ? 'us-east-1' : 'eu-west-1');
                    setShowEnvMenu(false);
                  }}
                  className={`w-full flex items-center justify-between px-3 py-2 text-xs text-left hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer ${
                    activeEnv === env.id ? 'bg-[#C6923B]/10 text-[#C6923B] dark:text-[#D4A347] font-bold' : 'text-slate-700 dark:text-slate-300'
                  }`}
                >
                  <div className="flex flex-col">
                    <div className="flex items-center gap-1.5">
                      <span className={`w-1.5 h-1.5 rounded-full ${activeEnv === env.id ? 'bg-emerald-500' : 'bg-slate-400 dark:bg-slate-600'}`} />
                      <span className="capitalize font-mono">{env.name}</span>
                    </div>
                    <span className="text-[10px] text-slate-400 dark:text-slate-500 pl-3">{env.region}</span>
                  </div>
                  <span className="text-[10px] font-mono text-slate-400">{env.latency}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Global Live Operational Health Badge (Desktop) */}
        <div className="hidden xl:flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-500/30 text-[11px] font-mono font-semibold text-emerald-800 dark:text-emerald-400">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          <span>Operational</span>
        </div>

        {/* White / Dark Theme Toggle Button */}
        <button
          onClick={toggleTheme}
          className="p-1.5 text-slate-700 dark:text-slate-300 hover:text-[#C6923B] dark:hover:text-[#D4A347] bg-slate-100 hover:bg-slate-200 dark:bg-[#141b2a] dark:hover:bg-[#192236] border border-slate-300 dark:border-[#23304a] rounded-lg transition-colors cursor-pointer"
          title={theme === 'dark' ? 'Switch to Light Theme' : 'Switch to Dark Theme'}
        >
          {theme === 'dark' ? (
            <Sun className="w-3.5 h-3.5 text-[#D4A347] transition-transform hover:rotate-45" />
          ) : (
            <Moon className="w-3.5 h-3.5 text-[#C6923B] transition-transform hover:-rotate-12" />
          )}
        </button>

        {/* Telemetry Refresh Button */}
        <button
          onClick={handleRefreshClick}
          className="p-1.5 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white bg-slate-100 hover:bg-slate-200 dark:bg-[#141b2a] dark:hover:bg-[#192236] border border-slate-300 dark:border-[#23304a] rounded-lg transition-colors cursor-pointer"
          title="Refresh Telemetry"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-[#C6923B] dark:text-[#D4A347]' : ''}`} />
        </button>

        {/* Responsive Notifications Bell & Mobile-Safe Dropdown */}
        <div className="relative" ref={notifMenuRef}>
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="p-1.5 text-slate-700 dark:text-slate-300 hover:text-[#C6923B] dark:hover:text-[#D4A347] bg-slate-100 hover:bg-slate-200 dark:bg-[#141b2a] dark:hover:bg-[#192236] border border-slate-300 dark:border-[#23304a] rounded-lg transition-colors relative cursor-pointer"
            title="System Notifications"
          >
            <Bell className="w-3.5 h-3.5" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-[#C6923B] dark:bg-[#D4A347] text-white dark:text-slate-950 rounded-full text-[9px] font-mono font-bold flex items-center justify-center ring-2 ring-white dark:ring-[#0d131f]">
                {unreadCount}
              </span>
            )}
          </button>

          {showNotifications && (
            <>
              {/* Mobile overlay backdrop to avoid overflow clipping */}
              <div 
                className="fixed inset-0 z-40 bg-black/50 backdrop-blur-2xs sm:hidden" 
                onClick={() => setShowNotifications(false)} 
              />
              
              {/* Responsive Container: Centered on mobile, aligned right on desktop */}
              <div className="fixed sm:absolute inset-x-2 sm:inset-x-auto sm:right-0 top-16 sm:top-full mt-0 sm:mt-1.5 max-w-sm sm:w-96 mx-auto sm:mx-0 bg-white dark:bg-[#111827] border border-slate-200 dark:border-[#23304a] rounded-2xl shadow-2xl overflow-hidden z-50 animate-fadeIn">
                <div className="p-3 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-[#0e1624]">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold font-mono text-slate-800 dark:text-slate-200">Alerts & System Events</span>
                    {unreadCount > 0 && (
                      <span className="px-1.5 py-0.2 rounded text-[10px] font-mono bg-[#C6923B]/15 text-[#C6923B] dark:text-[#D4A347] font-bold">
                        {unreadCount} new
                      </span>
                    )}
                  </div>
                  {unreadCount > 0 && (
                    <button
                      onClick={markAllRead}
                      className="text-[11px] font-semibold text-[#C6923B] dark:text-[#D4A347] hover:underline cursor-pointer"
                    >
                      Mark all read
                    </button>
                  )}
                </div>

                <div className="max-h-80 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/60 no-scrollbar">
                  {notifications.length === 0 ? (
                    <div className="py-8 px-4 text-center">
                      <CheckCircle2 className="w-8 h-8 mx-auto text-emerald-500 mb-2 opacity-90" />
                      <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">All systems nominal</p>
                      <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">No active firing alerts or urgent notices</p>
                    </div>
                  ) : (
                    notifications.map((n) => (
                      <div 
                        key={n.id} 
                        onClick={() => handleNotificationClick(n.id)}
                        className={`p-3 hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors cursor-pointer ${!n.read ? 'bg-[#C6923B]/5 dark:bg-[#C6923B]/10' : ''}`}
                        title="Click to mark as read"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-1.5">
                            <span className={`w-2 h-2 rounded-full shrink-0 ${
                              n.type === 'error' ? 'bg-rose-500 ring-2 ring-rose-500/20' :
                              n.type === 'warning' ? 'bg-amber-500 ring-2 ring-amber-500/20' :
                              n.type === 'success' ? 'bg-emerald-500 ring-2 ring-emerald-500/20' : 'bg-[#C6923B]'
                            }`} />
                            <h4 className="text-xs font-bold text-slate-900 dark:text-slate-200">{n.title}</h4>
                          </div>
                          <span className="text-[10px] font-mono text-slate-400 dark:text-slate-500 shrink-0">{n.time}</span>
                        </div>
                        <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-1 pl-3.5 leading-relaxed font-sans">{n.desc}</p>
                      </div>
                    ))
                  )}
                </div>

                <div className="p-2 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#0e1624] text-center">
                  <button
                    onClick={() => {
                      setShowNotifications(false);
                      if (onNavigateTab) {
                        onNavigateTab('alerts');
                      } else {
                        window.dispatchEvent(new CustomEvent('acos:navigate-tab', { detail: 'alerts' }));
                      }
                    }}
                    className="text-[11px] font-semibold text-[#C6923B] dark:text-[#D4A347] hover:underline cursor-pointer"
                  >
                    View All in Alerts Console &rarr;
                  </button>
                </div>
              </div>
            </>
          )}
        </div>

        {/* User Account Menu */}
        <div className="relative" ref={accountMenuRef}>
          <button
            onClick={() => setShowAccountMenu(!showAccountMenu)}
            className="flex items-center gap-1.5 pl-1.5 pr-1 py-1 rounded-lg bg-slate-100 dark:bg-[#141b2a] hover:bg-slate-200/80 dark:hover:bg-[#192236] border border-slate-200 dark:border-[#23304a] transition-colors cursor-pointer"
          >
            <div className="w-6 h-6 rounded-full bg-[#C6923B] text-white font-mono font-bold text-[11px] flex items-center justify-center shadow-2xs">
              {userInitial}
            </div>
            <span className="hidden xl:inline text-xs font-medium text-slate-700 dark:text-slate-200 max-w-[90px] truncate">
              {displayName}
            </span>
            <ChevronDown className="w-3 h-3 text-slate-400" />
          </button>

          {showAccountMenu && (
            <div className="absolute right-0 mt-1.5 w-60 sm:w-64 bg-white dark:bg-[#111827] border border-slate-200 dark:border-[#23304a] rounded-xl shadow-2xl p-2 z-50 animate-fadeIn">
              <div className="p-2 border-b border-slate-100 dark:border-slate-800 pb-2.5">
                <p className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate">{displayName}</p>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 font-mono truncate">{user?.email || 'admin@aravanta.internal'}</p>
                <div className="flex items-center gap-1.5 mt-2">
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-[#C6923B]/15 text-[#C6923B] dark:text-[#D4A347] border border-[#C6923B]/30">
                    {displayRole}
                  </span>
                  <span className="text-[10px] text-slate-500">Org: Aravanta</span>
                </div>
              </div>

              <div className="py-1">
                <button
                  onClick={() => {
                    setShowAccountMenu(false);
                    onNavigateToProfile?.();
                  }}
                  className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white cursor-pointer"
                >
                  <User className="w-3.5 h-3.5 text-slate-400" />
                  <span>Account & Profile</span>
                </button>
                <button
                  onClick={() => {
                    setShowAccountMenu(false);
                    if (onNavigateTab) {
                      onNavigateTab('api-keys');
                    } else {
                      window.dispatchEvent(new CustomEvent('acos:navigate-tab', { detail: 'api-keys' }));
                    }
                  }}
                  className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white cursor-pointer"
                >
                  <KeyRound className="w-3.5 h-3.5 text-[#C6923B]" />
                  <span>Cloud API Keys</span>
                </button>
              </div>

              <div className="border-t border-slate-100 dark:border-slate-800 pt-1">
                <button
                  onClick={() => {
                    setShowAccountMenu(false);
                    setShowLogoutConfirm(true);
                  }}
                  className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-500/10 cursor-pointer"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Sign Out of Console</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Sign Out Confirmation Modal */}
      {showLogoutConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn font-sans">
          <div className="w-full max-w-md bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 flex items-center justify-center border border-rose-200 dark:border-rose-900/60 shrink-0">
                <LogOut className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">Sign Out of Console?</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">End your active cloud session</p>
              </div>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              Are you sure you want to sign out from <strong>{user?.email || 'your account'}</strong>? Any unsaved terminal workflows or uncommitted configurations will be closed.
            </p>

            <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setShowLogoutConfirm(false)}
                className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  try {
                    apiFetch('/api/v1/auth/logout', { method: 'POST', token }).catch(() => {});
                    localStorage.removeItem('aravanta_token');
                    localStorage.removeItem('aravanta_user');
                    localStorage.removeItem('aravanta_active_tab');
                    localStorage.setItem('aravanta_is_console_mode', 'false');
                  } catch {}
                  window.location.reload();
                }}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold shadow-sm transition cursor-pointer flex items-center gap-1.5"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Confirm Sign Out</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};
