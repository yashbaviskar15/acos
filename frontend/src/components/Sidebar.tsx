import React from 'react';
import { 
  LayoutDashboard, 
  Layers, 
  Server, 
  Boxes, 
  GitBranch, 
  Box, 
  Activity, 
  FileText, 
  Bell, 
  ShieldAlert, 
  Zap, 
  HardDrive, 
  Database, 
  ShieldCheck, 
  CreditCard, 
  Settings as SettingsIcon, 
  BookOpen, 
  LogOut, 
  X,
  FileCheck
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

interface NavSection {
  title: string;
  items: {
    id: string;
    label: string;
    icon: React.ElementType;
    badge?: string;
    count?: string;
  }[];
}

export const Sidebar: React.FC<SidebarProps> = ({ 
  activeTab, 
  setActiveTab, 
  user, 
  onLogout,
  isOpen = false,
  onClose
}) => {
  const sections: NavSection[] = [
    {
      title: 'OPERATIONS',
      items: [
        { id: 'dashboard', label: 'Overview', icon: LayoutDashboard, badge: 'PROD' },
        { id: 'infrastructure', label: 'Infrastructure', icon: Server, count: '28' },
        { id: 'applications', label: 'Applications', icon: Layers, count: '5' },
        { id: 'deployments', label: 'Deployments', icon: GitBranch },
        { id: 'containers', label: 'Containers', icon: Box, count: '11' },
      ]
    },
    {
      title: 'OBSERVABILITY',
      items: [
        { id: 'monitoring', label: 'Monitoring', icon: Activity },
        { id: 'logs', label: 'Log Explorer', icon: FileText, badge: 'LIVE' },
        { id: 'alerts', label: 'Alerts', icon: Bell, count: '6' },
        { id: 'incidents', label: 'Incidents', icon: ShieldAlert, badge: 'P1' },
      ]
    },
    {
      title: 'AUTOMATION & RELIABILITY',
      items: [
        { id: 'automation', label: 'Automation', icon: Zap },
        { id: 'backups', label: 'Backups & DR', icon: HardDrive },
        { id: 'cicd', label: 'CI/CD Pipelines', icon: GitBranch },
      ]
    },
    {
      title: 'CLOUD RESOURCES',
      items: [
        { id: 'compute', label: 'Compute VMs', icon: Server },
        { id: 'kubernetes', label: 'Kubernetes', icon: Boxes },
        { id: 'database', label: 'Databases', icon: Database },
        { id: 'storage', label: 'Object Storage', icon: HardDrive },
      ]
    },
    {
      title: 'GOVERNANCE & PLATFORM',
      items: [
        { id: 'security', label: 'Security & RBAC', icon: ShieldCheck },
        { id: 'audit', label: 'Audit Logs', icon: FileCheck },
        { id: 'billing', label: 'Billing & FinOps', icon: CreditCard },
        { id: 'settings', label: 'Platform Settings', icon: SettingsIcon },
        { id: 'guide', label: 'Operations Guide', icon: BookOpen },
      ]
    }
  ];

  const displayName = user?.full_name || user?.email?.split('@')[0] || 'Yash Baviskar';
  const displayRole = user?.role || user?.roles?.[0] || 'SuperAdmin';
  const initial = displayName.charAt(0).toUpperCase();

  const handleTabClick = (id: string) => {
    setActiveTab(id);
    if (onClose) onClose();
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div 
          onClick={onClose}
          className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[90] md:hidden transition-opacity"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`w-64 bg-white dark:bg-[#0F2038] border-r border-slate-200 dark:border-slate-800 flex flex-col h-screen fixed md:sticky top-0 left-0 transition-transform duration-300 shadow-xl z-[95] md:z-30 shrink-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        {/* Brand Header */}
        <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="cursor-pointer" onClick={() => handleTabClick('dashboard')}>
            <Logo size="md" />
          </div>

          {onClose && (
            <button
              onClick={onClose}
              className="md:hidden text-slate-400 hover:text-slate-900 dark:hover:text-white p-1.5 rounded-lg"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Categorized Navigation Menu */}
        <nav className="flex-1 overflow-y-auto p-3 space-y-4">
          {sections.map((sec, secIdx) => (
            <div key={secIdx} className="space-y-1">
              <span className="px-3 text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                {sec.title}
              </span>
              <div className="space-y-0.5 pt-0.5">
                {sec.items.map((item) => {
                  const Icon = item.icon;
                  const isActive = activeTab === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => handleTabClick(item.id)}
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer group ${
                        isActive
                          ? 'bg-[#C6923B] text-white shadow-md shadow-[#C6923B]/30'
                          : 'text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/80 hover:text-[#C6923B] dark:hover:text-[#E5B04E]'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <Icon 
                          className={`w-4 h-4 shrink-0 transition-colors ${
                            isActive 
                              ? 'text-white' 
                              : 'text-[#C6923B] dark:text-[#D4A347] group-hover:text-[#B07B28]'
                          }`} 
                        />
                        <span className="truncate">{item.label}</span>
                      </div>

                      {item.badge && (
                        <span className={`px-1.5 py-0.5 text-[9px] font-extrabold uppercase rounded ${
                          isActive
                            ? 'bg-white/20 text-white'
                            : (item.badge === 'P1' ? 'bg-rose-50 dark:bg-rose-500/20 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-500/30' : 'bg-emerald-50 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/30')
                        }`}>
                          {item.badge}
                        </span>
                      )}

                      {item.count && !item.badge && (
                        <span className={`px-1.5 py-0.5 text-[10px] font-bold rounded ${
                          isActive
                            ? 'bg-white/20 text-white'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'
                        }`}>
                          {item.count}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* User Profile Footer */}
        <div className="p-3 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#0B0F17]">
          <div className="flex items-center justify-between p-2.5 rounded-xl bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 shadow-sm">
            <div 
              onClick={() => handleTabClick('profile')}
              className="flex items-center gap-2.5 overflow-hidden cursor-pointer group min-w-0"
            >
              <div className="w-8 h-8 rounded-full bg-[#C6923B] text-white font-black text-xs flex items-center justify-center shrink-0 shadow-md">
                {initial}
              </div>
              <div className="truncate">
                <p className="text-xs font-bold text-slate-900 dark:text-white truncate group-hover:text-[#C6923B] transition-colors">{displayName}</p>
                <p className="text-[10px] text-[#C6923B] dark:text-[#D4A347] font-mono font-bold capitalize truncate">{displayRole}</p>
              </div>
            </div>
            <button 
              onClick={onLogout}
              title="Logout"
              className="text-slate-400 hover:text-red-600 p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors shrink-0 cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};
