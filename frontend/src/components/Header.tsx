import React, { useState, useEffect, useCallback } from 'react';
import { Bell, Search, RefreshCw, Sun, Moon, X, Menu, User, Clock, BellRing, CheckCircle2, Shield, ChevronDown, Check } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { requestNotificationPermission, sendSystemNotification } from '../utils/notifications';
import { apiFetch } from '../config/api';

interface HeaderProps {
  title: string;
  subtitle?: string;
  user?: any;
  onUpdateUser?: (updatedUser: any, newToken?: string) => void;
  onRefresh?: () => void;
  searchTerm?: string;
  onSearchChange?: (val: string) => void;
  onMobileMenuToggle?: () => void;
  onNavigateToProfile?: () => void;
  onOpenCommandPalette?: () => void;
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
  onUpdateUser,
  onRefresh, 
  searchTerm = '',
  onSearchChange,
  onMobileMenuToggle,
  onNavigateToProfile,
  onOpenCommandPalette
}) => {
  const { theme, toggleTheme } = useTheme();
  const [showNotifications, setShowNotifications] = useState(false);
  const [showRoleMenu, setShowRoleMenu] = useState(false);
  const [switchingRole, setSwitchingRole] = useState(false);
  const [hasNotificationPermission, setHasNotificationPermission] = useState(false);
  const [permissionJustGranted, setPermissionJustGranted] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [isMobileSearchOpen, setIsMobileSearchOpen] = useState(false);

  const activeRole = user?.role || user?.roles?.[0] || 'Developer';

  const handleRoleSwitch = async (newRole: string) => {
    if (newRole === activeRole || switchingRole) {
      setShowRoleMenu(false);
      return;
    }
    setSwitchingRole(true);
    const token = localStorage.getItem('aravanta_token');
    try {
      const data = await apiFetch<any>('/v1/auth/role/update', {
        method: 'POST',
        token,
        body: JSON.stringify({ role: newRole })
      });
      const savedUser = JSON.parse(localStorage.getItem('aravanta_user') || '{}');
      savedUser.role = data.role;
      if (data.user) {
        Object.assign(savedUser, data.user);
      }
      localStorage.setItem('aravanta_user', JSON.stringify(savedUser));
      if (data.access_token) {
        localStorage.setItem('aravanta_token', data.access_token);
      }
      onUpdateUser?.(savedUser, data.access_token);
      setShowRoleMenu(false);
    } catch (err) {
      console.error('Failed to update role:', err);
    } finally {
      setSwitchingRole(false);
    }
  };

  // Check existing notification permission on mount
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'granted') {
      setHasNotificationPermission(true);
    }
  }, []);

  // Fetch real notifications from API
  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const token = localStorage.getItem('aravanta_token');
        const notifs = await apiFetch<any[]>('/v1/operations/notifications', { token }).catch(() => null);
        if (Array.isArray(notifs) && notifs.length > 0) {
          setNotifications(notifs.map((n: any, i: number) => ({
            id: n.id || `notif-${i}`,
            title: n.title || 'System Notification',
            desc: n.message || n.desc || 'Platform event',
            time: n.created_at ? new Date(n.created_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : 'Just now',
            type: (n.severity === 'CRITICAL' || n.severity === 'ERROR') ? 'error' : (n.severity === 'WARNING' ? 'warning' : (n.severity === 'SUCCESS' ? 'success' : 'info')),
            read: !!n.read
          })));
        } else {
          // Fallback to alerts if no notifications
          const alerts = await apiFetch<any[]>('/v1/monitoring/alerts', { token }).catch(() => null);
          if (Array.isArray(alerts) && alerts.length > 0) {
            setNotifications(alerts.map((a: any, i: number) => ({
              id: a.id || `alert-${i}`,
              title: a.title || a.name || 'System Alert',
              desc: a.message || a.description || 'Alert triggered',
              time: a.fired_at || a.created_at ? new Date(a.fired_at || a.created_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : 'Just now',
              type: a.severity === 'critical' ? 'error' : a.severity === 'warning' ? 'warning' : 'info',
              read: a.status === 'resolved'
            })));
          } else {
            setNotifications([
              { id: '1', title: 'System Operational', desc: 'All Aravanta CloudOS services are running normally', time: 'Now', type: 'success', read: false },
            ]);
          }
        }
      } catch {
        setNotifications([
          { id: '1', title: 'System Operational', desc: 'All services running normally', time: 'Now', type: 'success', read: false },
        ]);
      }
    };
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleRequestNotification = useCallback(async () => {
    if (hasNotificationPermission) {
      // Already granted — send a test notification to prove it works
      sendSystemNotification(
        ' Notifications Already Active',
        'Aravanta CloudOS desktop notifications are enabled and working!'
      );
      return;
    }

    const granted = await requestNotificationPermission();
    setHasNotificationPermission(granted);

    if (granted) {
      setPermissionJustGranted(true);
      setTimeout(() => setPermissionJustGranted(false), 4000);

      // Send an immediate system notification to confirm
      sendSystemNotification(
        ' Aravanta CloudOS Notifications Enabled',
        'You will now receive real-time desktop alerts for auto-scaling events, high CPU warnings, payment confirmations, and security notices.'
      );

      // Add it to the in-app notification list too
      setNotifications(prev => [{
        id: Date.now(),
        title: 'Desktop Notifications Enabled',
        desc: 'You will now receive native OS notifications for system events.',
        time: 'Just now',
        type: 'success',
        read: false
      }, ...prev]);
    }
  }, [hasNotificationPermission]);

  const markAllRead = async () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    const token = localStorage.getItem('aravanta_token');
    try {
      await apiFetch('/v1/operations/notifications/read-all', {
        method: 'POST',
        token,
      });
    } catch {
      // Ignored
    }
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'success': return 'text-emerald-600 dark:text-emerald-400';
      case 'warning': return 'text-amber-600 dark:text-amber-400';
      case 'error': return 'text-red-600 dark:text-red-400';
      default: return 'text-blue-600 dark:text-blue-400';
    }
  };

  const getTypeBg = (type: string) => {
    switch (type) {
      case 'success': return 'bg-emerald-50 dark:bg-emerald-500/10 border-emerald-200 dark:border-emerald-500/30';
      case 'warning': return 'bg-amber-50 dark:bg-amber-500/10 border-amber-200 dark:border-amber-500/30';
      case 'error': return 'bg-red-50 dark:bg-red-500/10 border-red-200 dark:border-red-500/30';
      default: return 'bg-blue-50 dark:bg-blue-500/10 border-blue-200 dark:border-blue-500/30';
    }
  };

  return (
    <header className="h-16 bg-white dark:bg-[#0F2038] border-b border-slate-200 dark:border-slate-800 px-3 sm:px-6 flex items-center justify-between sticky top-0 z-20 transition-colors duration-300 shadow-sm min-w-0 w-full relative">
      {/* Full-width Mobile Search Bar Overlay */}
      {isMobileSearchOpen && (
        <div className="absolute inset-0 bg-white dark:bg-[#0F2038] z-30 px-3 flex items-center gap-2 animate-fadeIn">
          <Search className="w-4 h-4 text-brandGold-500 shrink-0" />
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
            placeholder="Search console, services, logs..."
            className="flex-1 bg-transparent border-none text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none"
          />
          {searchTerm && (
            <button
              onClick={() => onSearchChange?.('')}
              className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              title="Clear"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
          {onOpenCommandPalette && (
            <button
              onClick={() => {
                setIsMobileSearchOpen(false);
                onOpenCommandPalette();
              }}
              className="px-2 py-1 text-[10px] font-bold font-mono bg-brandGold-500/10 text-brandGold-600 dark:text-brandGold-400 border border-brandGold-500/30 rounded-lg"
            >
              Cmds
            </button>
          )}
          <button
            onClick={() => setIsMobileSearchOpen(false)}
            className="p-1.5 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
            title="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1 mr-2">
        {/* Mobile Hamburger Drawer Trigger */}
        {onMobileMenuToggle && (
          <button
            onClick={onMobileMenuToggle}
            className="p-2 md:hidden text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-900/80 hover:bg-slate-200 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 rounded-xl transition-colors shrink-0"
            title="Toggle Menu"
          >
            <Menu className="w-5 h-5" />
          </button>
        )}

        <div className="min-w-0 flex-1">
          <h2 className="text-xs sm:text-base md:text-lg font-black text-slate-900 dark:text-white tracking-tight truncate">
            {title}
          </h2>
          {subtitle && <p className="text-[10px] sm:text-xs text-slate-600 dark:text-slate-300 font-mono font-medium mt-0.5 hidden md:block truncate">{subtitle}</p>}
        </div>
      </div>

      <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
        {/* Interactive Desktop Search Input */}
        <div className="hidden md:flex items-center relative">
          <Search className="w-3.5 h-3.5 absolute left-2.5 text-slate-400 pointer-events-none" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => onSearchChange?.(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && onOpenCommandPalette) {
                onOpenCommandPalette();
              }
            }}
            placeholder="Search services, logs... (Ctrl+K)"
            className="w-44 lg:w-60 pl-8 pr-14 py-1.5 bg-slate-100 dark:bg-slate-900/80 hover:bg-slate-200/60 dark:hover:bg-slate-800/80 focus:bg-white dark:focus:bg-slate-900 border border-slate-200 dark:border-slate-800 focus:border-brandGold-500/50 dark:focus:border-brandGold-500/50 rounded-xl text-xs text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-brandGold-500/30 transition-all font-sans"
          />
          <div className="absolute right-1.5 flex items-center gap-1">
            {searchTerm ? (
              <button
                onClick={() => onSearchChange?.('')}
                className="p-0.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                title="Clear search"
              >
                <X className="w-3 h-3" />
              </button>
            ) : null}
            {onOpenCommandPalette && (
              <button
                onClick={onOpenCommandPalette}
                title="Command Palette (Ctrl+K)"
                className="px-1.5 py-0.5 text-[9px] font-mono font-bold bg-slate-200 dark:bg-slate-800 hover:bg-brandGold-500/20 text-slate-500 dark:text-slate-400 hover:text-brandGold-500 rounded border border-slate-300 dark:border-slate-700 transition-colors cursor-pointer"
              >
                Ctrl K
              </button>
            )}
          </div>
        </div>

        {/* Mobile Search Button (< md) */}
        <button
          onClick={() => setIsMobileSearchOpen(true)}
          className="md:hidden flex items-center justify-center p-2 text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-900/80 hover:bg-slate-200 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 rounded-xl transition-colors shrink-0"
          title="Search console"
        >
          <Search className="w-4 h-4" />
        </button>

        {/* Desktop System Notification Toggle */}
        <button
          onClick={handleRequestNotification}
          className={`hidden xl:flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-mono font-bold transition-all cursor-pointer ${
            hasNotificationPermission
              ? 'bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/30 text-emerald-700 dark:text-emerald-400'
              : 'bg-blue-50 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/30 text-blue-700 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-500/20'
          } ${permissionJustGranted ? 'animate-pulse ring-2 ring-emerald-400' : ''}`}
          title={hasNotificationPermission ? 'Desktop Notifications Active — Click to test' : 'Enable Native OS Desktop Notifications'}
        >
          {hasNotificationPermission ? (
            <>
              <BellRing className="w-3.5 h-3.5" />
              <span>NOTIFICATIONS ACTIVE</span>
              <CheckCircle2 className="w-3 h-3" />
            </>
          ) : (
            <>
              <Bell className="w-3.5 h-3.5" />
              <span>ENABLE OS ALERTS</span>
            </>
          )}
        </button>

        {/* RBAC Role Indicator / Admin Role Switcher */}
        <div className="relative">
          {(activeRole === 'SuperAdmin' || activeRole === 'Admin') ? (
            <>
              <button
                onClick={() => setShowRoleMenu(!showRoleMenu)}
                disabled={switchingRole}
                className={`flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1.5 rounded-xl text-[10px] sm:text-xs font-mono font-bold uppercase transition-all cursor-pointer shadow-sm border ${
                  activeRole === 'SuperAdmin'
                    ? 'bg-purple-50 dark:bg-purple-500/15 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-500/30 hover:bg-purple-100 dark:hover:bg-purple-500/25'
                    : 'bg-amber-50 dark:bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-500/30 hover:bg-amber-100 dark:hover:bg-amber-500/25'
                }`}
                title="Admin Role Controls — Click to switch active role"
              >
                <Shield className="w-3.5 h-3.5 shrink-0" />
                <span className="truncate max-w-[55px] xs:max-w-[80px] sm:max-w-none">{switchingRole ? '...' : activeRole}</span>
                <ChevronDown className="w-3 h-3 opacity-60 shrink-0" />
              </button>

              {showRoleMenu && (
                <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-[#0F2038] border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl p-2.5 z-50 space-y-1 animate-fadeIn font-sans">
                  <div className="px-2.5 py-1.5 border-b border-slate-100 dark:border-slate-800 text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400">
                    Switch System Role (RBAC)
                  </div>
                  {[
                    { role: 'SuperAdmin', desc: 'Infrastructure Owner — Full Rights', color: 'purple' },
                    { role: 'Admin', desc: 'Resource Operator & Maintenance', color: 'amber' },
                    { role: 'Operator', desc: 'SRE & Workload Orchestrator', color: 'cyan' },
                    { role: 'Developer', desc: 'Deploy Workloads & Manage Apps', color: 'blue' },
                    { role: 'Viewer', desc: 'Telemetry Observer & Read-only', color: 'slate' },
                  ].map((item) => (
                    <button
                      key={item.role}
                      onClick={() => handleRoleSwitch(item.role)}
                      className={`w-full flex items-center justify-between p-2 rounded-xl text-left text-xs transition-colors cursor-pointer ${
                        activeRole === item.role
                          ? 'bg-blue-50 dark:bg-blue-500/20 text-blue-700 dark:text-blue-300 font-bold'
                          : 'text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800/60'
                      }`}
                    >
                      <div>
                        <p className="font-bold">{item.role}</p>
                        <p className="text-[10px] text-slate-400 font-mono font-normal">{item.desc}</p>
                      </div>
                      {activeRole === item.role && <Check className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />}
                    </button>
                  ))}
                </div>
              )}
            </>
          ) : (
            <div
              className={`flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1.5 rounded-xl text-[10px] sm:text-xs font-mono font-bold uppercase shadow-sm border ${
                activeRole === 'Developer'
                  ? 'bg-blue-50 dark:bg-blue-500/15 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-500/30'
                  : activeRole === 'Operator'
                  ? 'bg-cyan-50 dark:bg-cyan-500/15 text-cyan-700 dark:text-cyan-300 border-cyan-200 dark:border-cyan-500/30'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
              }`}
              title={`Assigned RBAC Role: ${activeRole} (Managed by Workspace Administrator)`}
            >
              <Shield className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate max-w-[55px] xs:max-w-[80px] sm:max-w-none">{activeRole}</span>
            </div>
          )}
        </div>

        {/* 10-Day Free Trial Badge */}
        <div 
          onClick={onNavigateToProfile}
          className="hidden xl:flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-700 dark:text-amber-400 text-xs font-mono font-bold cursor-pointer hover:bg-amber-500/20 transition-colors"
          title="Click to view trial status"
        >
          <Clock className="w-3.5 h-3.5 text-amber-500" />
          <span>TRIAL: 8 DAYS LEFT</span>
        </div>

        {/* Theme Toggle Button (Light/Dark Switcher) */}
        <button
          onClick={toggleTheme}
          className="p-2 text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-900/80 hover:bg-slate-200 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 rounded-xl transition-all shadow-sm flex items-center justify-center cursor-pointer"
          title={`Switch to ${theme === 'dark' ? 'White/Light' : 'Dark'} Theme`}
        >
          {theme === 'dark' ? (
            <Sun className="w-4 h-4 text-amber-400 hover:rotate-45 transition-transform" />
          ) : (
            <Moon className="w-4 h-4 text-indigo-600 hover:-rotate-12 transition-transform" />
          )}
        </button>

        {/* User Profile Button */}
        {onNavigateToProfile && (
          <button
            onClick={onNavigateToProfile}
            className="p-2 text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-900/80 hover:bg-slate-200 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 rounded-xl transition-colors cursor-pointer"
            title="User Profile & Settings"
          >
            <User className="w-4 h-4 text-blue-600 dark:text-blue-400" />
          </button>
        )}

        {/* Refresh Button */}
        {onRefresh && (
          <button
            onClick={onRefresh}
            className="p-2 text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-900/80 hover:bg-slate-200 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 rounded-xl transition-colors cursor-pointer"
            title="Refresh Service Data"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        )}

        {/* Notification Bell */}
        <div className="relative">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="relative p-2 text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-900/80 hover:bg-slate-200 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 rounded-xl transition-colors cursor-pointer"
            title={`Notifications (${unreadCount} unread)`}
          >
            <Bell className="w-4 h-4" />
            {unreadCount > 0 && (
              <>
                <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-blue-600 dark:bg-[#C9A84C] animate-ping"></span>
                <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-blue-600 dark:bg-[#C9A84C]"></span>
              </>
            )}
          </button>

          {/* Notifications Dropdown */}
          {showNotifications && (
            <div className="absolute right-0 mt-2 w-72 sm:w-80 bg-white dark:bg-[#0F2038] border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl p-4 z-50 space-y-3 animate-fadeIn">
              <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-2">
                <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase font-mono tracking-wider flex items-center gap-2">
                  <Bell className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                  Notifications
                  {unreadCount > 0 && (
                    <span className="px-1.5 py-0.5 text-[9px] font-bold bg-blue-600 text-white rounded-md">{unreadCount}</span>
                  )}
                </h4>
                <div className="flex items-center gap-2">
                  {unreadCount > 0 && (
                    <button 
                      onClick={markAllRead}
                      className="text-[10px] text-blue-600 dark:text-blue-400 font-bold hover:underline cursor-pointer"
                    >
                      Mark all read
                    </button>
                  )}
                  <button onClick={() => setShowNotifications(false)} className="text-slate-400 hover:text-slate-700 dark:hover:text-white cursor-pointer">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="space-y-2 max-h-64 overflow-y-auto">
                {notifications.length === 0 ? (
                  <p className="text-xs text-slate-500 text-center py-4 font-mono">No notifications</p>
                ) : (
                  notifications.map((n) => (
                    <div 
                      key={n.id} 
                      className={`p-2.5 rounded-xl border text-xs space-y-1 transition-all ${
                        n.read 
                          ? 'bg-slate-50 dark:bg-slate-900/40 border-slate-200 dark:border-slate-800 opacity-70' 
                          : getTypeBg(n.type)
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className={`font-bold ${n.read ? 'text-slate-600 dark:text-slate-400' : getTypeColor(n.type)}`}>{n.title}</span>
                        <span className="text-[10px] text-slate-400 font-mono">{n.time}</span>
                      </div>
                      <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-tight">{n.desc}</p>
                    </div>
                  ))
                )}
              </div>

              {/* Enable Notifications CTA if not granted */}
              {!hasNotificationPermission && (
                <button
                  onClick={handleRequestNotification}
                  className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl transition-colors cursor-pointer flex items-center justify-center gap-2"
                >
                  <BellRing className="w-3.5 h-3.5" />
                  Enable Desktop Notifications
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
