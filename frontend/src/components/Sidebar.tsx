import React from 'react';
import { 
  LayoutDashboard, 
  Server, 
  Boxes, 
  GitBranch, 
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
  LogOut, 
  Lock, 
  X, 
  Home, 
  ArrowRight, 
  Terminal, 
  KeyRound, 
  Radio,
  ChevronLeft,
  ChevronRight,
  Code2
} from 'lucide-react';
import { Logo } from './Logo';
import { canAccessTab } from '../utils/rbac';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  user: any;
  onLogout: () => void;
  isOpen?: boolean;
  onClose?: () => void;
  onGoToLanding?: () => void;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
}

interface NavSection {
  title: string;
  items: {
    id: string;
    label: string;
    icon: React.ElementType;
    badge?: string;
    count?: string;
    sublabel?: string;
  }[];
}

export const Sidebar: React.FC<SidebarProps> = ({ 
  activeTab, 
  setActiveTab, 
  user, 
  onLogout,
  isOpen = false,
  onClose,
  onGoToLanding,
  isCollapsed = false,
  onToggleCollapse,
}) => {
  const sections: NavSection[] = [
    {
      title: 'Core Platform',
      items: [
        { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, sublabel: 'Operations & Fleet Overview' },
        { id: 'infrastructure', label: 'Resources', icon: Server, count: '24', sublabel: 'Containers, DBs, VMs, Nets' },
        { id: 'deployments', label: 'Deployments', icon: GitBranch, badge: 'CI/CD', sublabel: 'Pipelines & Releases' },
        { id: 'automation', label: 'IaC Blueprints', icon: Code2, badge: 'IaC', sublabel: 'Infrastructure as Code' },
      ]
    },
    {
      title: 'Observability',
      items: [
        { id: 'monitoring', label: 'Monitoring', icon: Activity, sublabel: 'Prometheus & Grafana Metrics' },
        { id: 'logs', label: 'Logs Explorer', icon: FileText, sublabel: 'Live Tail & Severity Streams' },
        { id: 'alerts', label: 'Alerts', icon: Bell, badge: '1 firing' },
        { id: 'incidents', label: 'Incidents', icon: ShieldAlert, sublabel: 'War-Room Command' },
      ]
    },
    {
      title: 'Platform Services',
      items: [
        { id: 'compute', label: 'ArvCompute (VMs)', icon: Server },
        { id: 'kubernetes', label: 'ArvKube (K8s)', icon: Boxes },
        { id: 'database', label: 'ArvDB (Databases)', icon: Database },
        { id: 'storage', label: 'ArvStore (S3)', icon: HardDrive },
        { id: 'functions', label: 'ArvFunctions (FaaS)', icon: Zap, badge: 'New' },
        { id: 'vault', label: 'ArvVault (KMS)', icon: KeyRound, badge: 'New' },
        { id: 'events', label: 'ArvEvents (Queues)', icon: Radio, badge: 'New' },
      ]
    },
    {
      title: 'Governance & Admin',
      items: [
        { id: 'security', label: 'Access Control (RBAC)', icon: ShieldCheck, sublabel: 'Roles & Permission Matrix' },
        { id: 'billing', label: 'Billing & FinOps', icon: CreditCard, sublabel: 'Invoices & Usage Analytics' },
        { id: 'settings', label: 'Settings', icon: SettingsIcon, sublabel: 'API Keys & Org Integrations' },
        { id: 'cli', label: 'CLI & Shell', icon: Terminal, badge: 'v2.0' },
      ]
    }
  ];

  const displayName = user?.full_name || user?.email?.split('@')[0] || 'Cloud Operator';
  const displayRole = user?.role || user?.roles?.[0] || 'SuperAdmin';
  const initial = displayName.charAt(0).toUpperCase();

  const handleTabClick = (id: string) => {
    setActiveTab(id);
    if (onClose) onClose();
  };

  return (
    <>
      {/* Mobile Backdrop with smooth fade transition */}
      <div 
        onClick={onClose}
        aria-hidden="true"
        className={`fixed inset-0 bg-black/70 backdrop-blur-xs z-[90] md:hidden transition-opacity duration-300 ease-in-out ${
          isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
      />

      {/* Sidebar Container with smooth 60fps GPU transform & width transition */}
      <aside
        className={`bg-white dark:bg-[#0d131f] border-r border-slate-200 dark:border-[#1e293b] flex flex-col h-[100dvh] fixed md:sticky top-0 left-0 z-[95] md:z-30 shrink-0 pb-safe shadow-2xl md:shadow-none w-72 sm:w-80 transition-transform md:transition-[width,transform] duration-300 ease-in-out will-change-transform ${
          isCollapsed ? 'md:w-[68px]' : 'md:w-64'
        } ${
          isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        {/* Brand Header */}
        <div className={`h-14 border-b border-slate-200 dark:border-[#1e293b] flex items-center justify-between shrink-0 bg-slate-50 dark:bg-[#0a0f18] relative ${
          isCollapsed ? 'px-2 md:justify-center' : 'px-4'
        }`}>
          <div 
            className="cursor-pointer flex items-center min-w-0" 
            onClick={() => handleTabClick('dashboard')}
            title="Aravanta CloudOS Control Plane"
          >
            {/* Desktop Collapsed: Show only logo icon, centered, no text */}
            <div className={isCollapsed ? 'hidden md:block' : 'hidden'}>
              <Logo size="sm" showText={false} />
            </div>

            {/* Desktop Expanded or Mobile Drawer: Show logo with clean text */}
            <div className={isCollapsed ? 'block md:hidden' : 'block'}>
              <Logo size="sm" showText={true} />
            </div>
          </div>

          {/* Desktop Collapse / Expand Toggle */}
          <button
            onClick={onToggleCollapse}
            className={`hidden md:flex items-center justify-center text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-800/80 border border-slate-200 dark:border-slate-700/60 transition-all cursor-pointer ${
              isCollapsed 
                ? 'absolute -right-3 top-4 w-6 h-6 rounded-full bg-white dark:bg-[#111827] text-slate-600 dark:text-slate-300 hover:text-[#C6923B] dark:hover:text-[#D4A347] border border-slate-300 dark:border-[#23304a] shadow-md z-50' 
                : 'w-7 h-7 rounded-lg'
            }`}
            title={isCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
          >
            {isCollapsed ? <ChevronRight className="w-3.5 h-3.5" /> : <ChevronLeft className="w-4 h-4" />}
          </button>

          {/* Mobile Close Button */}
          {onClose && (
            <button
              onClick={onClose}
              className="md:hidden text-slate-400 hover:text-slate-900 dark:hover:text-white w-9 h-9 flex items-center justify-center rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              title="Close Menu"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Quick Link to Landing Page */}
        <div className={`p-2.5 border-b border-slate-200 dark:border-[#1e293b] bg-slate-50/60 dark:bg-[#090e17]/60 ${
          isCollapsed ? 'block md:hidden' : 'block'
        }`}>
          <button
            onClick={() => {
              if (onClose) onClose();
              if (onGoToLanding) onGoToLanding();
              window.dispatchEvent(new CustomEvent('acos:go-to-landing'));
            }}
            className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-semibold text-slate-700 dark:text-slate-300 hover:text-[#C6923B] dark:hover:text-[#D4A347] bg-white dark:bg-[#131b2c] hover:bg-[#C6923B]/10 dark:hover:bg-[#C6923B]/10 border border-slate-200 dark:border-[#22314d] hover:border-[#C6923B]/40 transition-all cursor-pointer group shadow-2xs"
            title="Return to Public Overview"
          >
            <div className="flex items-center gap-2">
              <Home className="w-3.5 h-3.5 text-[#C6923B] dark:text-[#D4A347] group-hover:scale-110 transition-transform shrink-0" />
              <span className="font-sans text-[11px] font-medium">Public Portal</span>
            </div>
            <ArrowRight className="w-3 h-3 text-slate-400 group-hover:text-[#C6923B] group-hover:translate-x-0.5 transition-all shrink-0" />
          </button>
        </div>

        {/* Categorized Navigation Menu — Hidden Scrollbars with Native Smooth Scrolling */}
        <nav className="flex-1 overflow-y-auto overflow-x-hidden p-2 space-y-3.5 no-scrollbar [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
          {sections.map((sec, secIdx) => (
            <div key={secIdx} className="space-y-0.5">
              <div className={`px-2.5 py-1 text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 ${
                isCollapsed ? 'block md:hidden' : 'block'
              }`}>
                {sec.title}
              </div>
              <div className="space-y-0.5">
                {sec.items.map((item) => {
                  const Icon = item.icon;
                  const isActive = activeTab === item.id;
                  const isPermitted = canAccessTab(item.id, displayRole);

                  return (
                    <button
                      key={item.id}
                      onClick={() => handleTabClick(item.id)}
                      title={isCollapsed ? `${item.label} (${sec.title})` : undefined}
                      className={`w-full flex items-center ${
                        isCollapsed ? 'justify-start md:justify-center px-2.5 md:px-0 py-2 md:py-2.5' : 'justify-between px-2.5 py-2'
                      } rounded-lg text-xs font-medium transition-all cursor-pointer group relative ${
                        isActive
                          ? 'bg-[#C6923B] text-white font-semibold shadow-md shadow-[#C6923B]/30'
                          : isPermitted
                          ? 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/80 hover:text-slate-900 dark:hover:text-white'
                          : 'text-slate-400 dark:text-slate-600 hover:bg-slate-100/50 dark:hover:bg-slate-900/50 cursor-not-allowed opacity-60'
                      }`}
                    >
                      {/* Active Left Indicator Bar (if collapsed on desktop) */}
                      {isActive && isCollapsed && (
                        <div className="hidden md:block absolute left-0 top-1.5 bottom-1.5 w-1 bg-[#D4A347] rounded-r" />
                      )}

                      <div className={`flex items-center gap-2.5 min-w-0 ${isCollapsed ? 'justify-start md:justify-center' : ''}`}>
                        <Icon 
                          className={`w-4 h-4 shrink-0 transition-colors ${
                            isActive 
                              ? 'text-white' 
                              : isPermitted
                              ? 'text-slate-500 dark:text-slate-400 group-hover:text-[#C6923B] dark:group-hover:text-[#D4A347]'
                              : 'text-slate-400 dark:text-slate-600'
                          }`} 
                        />
                        <div className={`flex flex-col text-left truncate ${isCollapsed ? 'block md:hidden' : 'block'}`}>
                          <span className="truncate font-sans text-[12px]">{item.label}</span>
                        </div>
                      </div>

                      {!isPermitted && (
                        <span title="Restricted to authorized roles" className={`p-0.5 rounded bg-slate-200 dark:bg-slate-800/60 text-slate-400 dark:text-slate-500 ${isCollapsed ? 'block md:hidden' : 'block'}`}>
                          <Lock className="w-3 h-3" />
                        </span>
                      )}

                      {isPermitted && item.badge && (
                        <span className={`px-1.5 py-0.5 text-[9px] font-mono font-bold uppercase rounded ${isCollapsed ? 'block md:hidden' : 'block'} ${
                          isActive
                            ? 'bg-black/20 text-white'
                            : item.badge === '1 firing'
                            ? 'bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-300 dark:border-amber-500/30'
                            : 'bg-[#C6923B]/10 dark:bg-[#C6923B]/20 text-[#C6923B] dark:text-[#D4A347] border border-[#C6923B]/30'
                        }`}>
                          {item.badge}
                        </span>
                      )}

                      {isPermitted && item.count && !item.badge && (
                        <span className={`px-1.5 py-0.2 text-[10px] font-mono font-bold rounded ${isCollapsed ? 'block md:hidden' : 'block'} ${
                          isActive
                            ? 'bg-black/20 text-white'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'
                        }`}>
                          {item.count}
                        </span>
                      )}

                      {/* Small badge dot in collapsed view on desktop */}
                      {isCollapsed && item.badge === '1 firing' && (
                        <span className="hidden md:block absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-amber-400 ring-2 ring-white dark:ring-[#0d131f] animate-pulse" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* User Profile Footer */}
        <div className="p-2.5 border-t border-slate-200 dark:border-[#1e293b] bg-slate-50 dark:bg-[#0a0f18] shrink-0">
          <div className={`flex items-center ${isCollapsed ? 'justify-between md:justify-center' : 'justify-between'} p-2 rounded-lg bg-white dark:bg-[#111827] border border-slate-200 dark:border-[#1e293b] shadow-2xs`}>
            <div 
              onClick={() => handleTabClick('profile')}
              className={`flex items-center gap-2.5 overflow-hidden cursor-pointer group min-w-0 ${isCollapsed ? 'justify-start md:justify-center' : ''}`}
              title={isCollapsed ? `${displayName} (${displayRole})` : undefined}
            >
              <div className="w-7 h-7 rounded-full bg-[#C6923B] text-white font-mono font-bold text-xs flex items-center justify-center shrink-0 shadow-2xs">
                {initial}
              </div>
              <div className={`truncate ${isCollapsed ? 'block md:hidden' : 'block'}`}>
                <p className="text-[12px] font-semibold text-slate-900 dark:text-slate-200 truncate group-hover:text-[#C6923B] transition-colors">
                  {displayName}
                </p>
                <p className="text-[10px] text-[#C6923B] dark:text-[#D4A347] font-mono font-bold capitalize truncate">
                  {displayRole}
                </p>
              </div>
            </div>

            <button 
              onClick={onLogout}
              title="Sign out of console"
              className={`text-slate-400 hover:text-rose-600 p-1.5 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors shrink-0 cursor-pointer ${
                isCollapsed ? 'block md:hidden' : 'block'
              }`}
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};
