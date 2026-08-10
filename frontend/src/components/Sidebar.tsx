import React from 'react';
import { 
  LayoutDashboard, 
  Server, 
  Boxes, 
  HardDrive, 
  Database, 
  GitBranch, 
  Activity, 
  ShieldCheck, 
  CreditCard,
  User,
  LogOut,
  X,
  BookOpen
} from 'lucide-react';
import { Logo } from './Logo';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  user: any;
  onLogout: () => void;
  isOpen?: boolean;
  onClose?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ 
  activeTab, 
  setActiveTab, 
  user, 
  onLogout,
  isOpen = false,
  onClose
}) => {
  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, badge: 'LIVE' },
    { id: 'compute', label: 'ArvCompute', icon: Server, count: 'VMs' },
    { id: 'kubernetes', label: 'ArvKube', icon: Boxes, count: 'Clusters' },
    { id: 'storage', label: 'ArvStore', icon: HardDrive, count: 'Buckets' },
    { id: 'database', label: 'ArvDB', icon: Database, count: 'Instances' },
    { id: 'cicd', label: 'CI/CD Pipelines', icon: GitBranch },
    { id: 'monitoring', label: 'ArvWatch', icon: Activity },
    { id: 'security', label: 'Security & Audit', icon: ShieldCheck },
    { id: 'billing', label: 'Billing & Costs', icon: CreditCard, count: 'INR ₹' },
    { id: 'guide', label: 'Getting Started', icon: BookOpen, badge: 'NEW' },
    { id: 'profile', label: 'User Profile', icon: User, badge: 'TRIAL' },
  ];

  const displayName = user?.full_name || user?.email?.split('@')[0] || 'Yashbaviskar47';
  const displayRole = user?.role || user?.roles?.[0] || 'Developer';
  const initial = displayName.charAt(0).toUpperCase();

  const handleTabClick = (id: string) => {
    setActiveTab(id);
    if (onClose) onClose();
  };

  return (
    <>
      {/* Mobile Drawer Backdrop */}
      {isOpen && (
        <div 
          onClick={onClose}
          className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[90] md:hidden transition-opacity"
        />
      )}

      {/* Sidebar Main Container */}
      <aside
        className={`w-64 bg-white dark:bg-[#0F2038] border-r border-slate-200 dark:border-slate-800 flex flex-col h-screen fixed md:sticky top-0 left-0 transition-transform duration-300 shadow-xl z-[95] md:z-30 shrink-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        {/* Sidebar Brand Header */}
        <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="cursor-pointer" onClick={() => handleTabClick('dashboard')}>
            <Logo size="md" />
          </div>

          {/* Close button for mobile drawer */}
          {onClose && (
            <button
              onClick={onClose}
              className="md:hidden text-slate-400 hover:text-slate-900 dark:hover:text-white p-1.5 rounded-lg"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Navigation Menu Items */}
        <nav className="flex-1 overflow-y-auto p-3 space-y-1.5">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleTabClick(item.id)}
                className={`w-full flex items-center justify-between px-3.5 py-3 rounded-xl text-xs font-bold transition-all cursor-pointer group ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-600/25 dark:bg-[#C9A84C]/25 dark:text-[#E8D48B] dark:border dark:border-[#C9A84C]/50'
                    : 'text-slate-700 dark:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800/80 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon 
                    className={`w-4 h-4 transition-colors ${
                      isActive 
                        ? 'text-white dark:text-[#C9A84C]' 
                        : 'text-blue-600 dark:text-blue-400 group-hover:text-blue-500 dark:group-hover:text-blue-300'
                    }`} 
                  />
                  <span className="truncate">{item.label}</span>
                </div>

                {item.badge && (
                  <span className={`px-2 py-0.5 text-[9px] font-extrabold uppercase tracking-wider rounded-md ${
                    isActive
                      ? 'bg-white/20 text-white dark:bg-emerald-500/20 dark:text-emerald-300'
                      : 'bg-emerald-50 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/30'
                  }`}>
                    {item.badge}
                  </span>
                )}

                {item.count && !item.badge && (
                  <span className={`px-2 py-0.5 text-[10px] font-mono font-bold rounded-md ${
                    isActive
                      ? 'bg-white/20 text-white dark:bg-slate-800 dark:text-slate-200'
                      : 'bg-slate-100 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700/80'
                  }`}>
                    {item.count}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* User Profile Footer */}
        <div className="p-3 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#0A1628]">
          <div className="flex items-center justify-between p-3 rounded-xl bg-white dark:bg-[#0F2038] border border-slate-200 dark:border-slate-800 shadow-sm">
            <div 
              onClick={() => handleTabClick('profile')}
              className="flex items-center gap-3 overflow-hidden cursor-pointer group"
            >
              <div className="w-9 h-9 rounded-full bg-blue-600 dark:bg-blue-500 text-white font-black text-sm flex items-center justify-center shrink-0 shadow-md group-hover:scale-105 transition-transform">
                {initial}
              </div>
              <div className="truncate">
                <p className="text-xs font-black text-slate-900 dark:text-white truncate group-hover:text-blue-600 dark:group-hover:text-[#C9A84C] transition-colors">{displayName}</p>
                <p className="text-[10px] text-blue-600 dark:text-[#C9A84C] font-mono font-bold capitalize">{displayRole}</p>
              </div>
            </div>
            <button 
              onClick={onLogout}
              title="Logout"
              className="text-slate-400 hover:text-red-600 dark:hover:text-red-400 p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors shrink-0 cursor-pointer"
            >
              <LogOut className="w-4.5 h-4.5" />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};
