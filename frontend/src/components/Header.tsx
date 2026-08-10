import React, { useState, useEffect, useCallback } from 'react';
import { Bell, Search, RefreshCw, Sun, Moon, X, Menu, User, Clock, BellRing, CheckCircle2 } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { apiFetch } from '../config/api';
import { requestNotificationPermission, sendSystemNotification } from '../utils/notifications';

interface HeaderProps {
  title: string;
  subtitle?: string;
  onRefresh?: () => void;
  searchTerm?: string;
  onSearchChange?: (val: string) => void;
  onMobileMenuToggle?: () => void;
  onNavigateToProfile?: () => void;
  onOpenCommandPalette?: () => void;
}

interface NotificationItem {
  id: number;
  title: string;
  desc: string;
  time: string;
  type: 'info' | 'success' | 'warning' | 'error';
  read: boolean;
}

export const Header: React.FC<HeaderProps> = ({ 
  title, 
  subtitle, 
  onRefresh, 
  searchTerm: _searchTerm = '', 
  onSearchChange: _onSearchChange,
  onMobileMenuToggle,
  onNavigateToProfile,
  onOpenCommandPalette
}) => {
  const { theme, toggleTheme } = useTheme();
  const [showNotifications, setShowNotifications] = useState(false);
  const [hasNotificationPermission, setHasNotificationPermission] = useState(false);
  const [permissionJustGranted, setPermissionJustGranted] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);

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
        const alerts = await apiFetch('/v1/monitoring/alerts');
        if (Array.isArray(alerts) && alerts.length > 0) {
          setNotifications(alerts.map((a: any, i: number) => ({
            id: a.id || i + 1,
            title: a.title || a.name || 'System Alert',
            desc: a.message || a.description || 'Alert triggered',
            time: a.created_at ? new Date(a.created_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : 'Just now',
            type: a.severity === 'critical' ? 'error' : a.severity === 'warning' ? 'warning' : 'info',
            read: false
          })));
          return;
        }
      } catch {
        // ignore and fall back to defaults
      }

      setNotifications([
        { id: 1, title: 'System Operational', desc: 'All Aravanta CloudOS services are running normally', time: 'Now', type: 'success', read: false },
        { id: 2, title: 'Trial Active', desc: 'Your 10-day free trial is active. Complete payment to continue.', time: '1h ago', type: 'info', read: false },
      ]);
    };
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleRequestNotification = useCallback(async () => {
    if (hasNotificationPermission) {
      // Already granted — send a test notification to prove it works
      sendSystemNotification(
        '✅ Notifications Already Active',
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
        '🔔 Aravanta CloudOS Notifications Enabled',
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

  const markAllRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
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
    <header className="h-16 bg-white dark:bg-[#0F2038] border-b border-slate-200 dark:border-slate-800 px-4 sm:px-6 flex items-center justify-between sticky top-0 z-20 transition-colors duration-300 shadow-sm">
      <div className="flex items-center gap-3">
        {/* Mobile Hamburger Drawer Trigger */}
        {onMobileMenuToggle && (
          <button
            onClick={onMobileMenuToggle}
            className="p-2 md:hidden text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-900/80 hover:bg-slate-200 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 rounded-xl transition-colors"
            title="Toggle Menu"
          >
            <Menu className="w-5 h-5" />
          </button>
        )}

        <div>
          <h2 className="text-sm sm:text-lg font-black text-slate-900 dark:text-white tracking-tight truncate max-w-[220px] sm:max-w-none">
            {title}
          </h2>
          {subtitle && <p className="text-[11px] sm:text-xs text-slate-600 dark:text-slate-300 font-mono font-medium mt-0.5 hidden sm:block">{subtitle}</p>}
        </div>
      </div>

      <div className="flex items-center gap-2 sm:gap-3">
        {/* Global Search & Command Palette Trigger */}
        {onOpenCommandPalette && (
          <button
            onClick={onOpenCommandPalette}
            className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-slate-100 dark:bg-slate-900/80 hover:bg-slate-200 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-500 dark:text-slate-400 font-mono transition-colors cursor-pointer"
          >
            <Search className="w-3.5 h-3.5 text-slate-400" />
            <span className="truncate max-w-[120px]">Search / Cmds...</span>
            <kbd className="px-1.5 py-0.5 text-[9px] font-bold bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded border border-slate-300 dark:border-slate-700">Ctrl K</kbd>
          </button>
        )}

        {/* Desktop System Notification Toggle */}
        <button
          onClick={handleRequestNotification}
          className={`hidden lg:flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-mono font-bold transition-all cursor-pointer ${
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
