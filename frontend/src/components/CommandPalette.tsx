import React, { useState, useEffect } from 'react';
import { 
  Search, 
  Server, 
  Boxes, 
  HardDrive, 
  Database, 
  GitBranch, 
  Activity, 
  ShieldCheck, 
  CreditCard, 
  User, 
  BookOpen, 
  Terminal, 
  ArrowRight, 
  X,
  Layers,
  Box,
  FileText,
  Bell,
  ShieldAlert,
  Zap,
  Settings as SettingsIcon,
  FileCheck
} from 'lucide-react';

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (tab: string) => void;
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({ isOpen, onClose, onNavigate }) => {
  const [query, setQuery] = useState('');

  const commands = [
    // Public & Docs Navigation
    { id: 'page-home', label: 'Home — Unified Control Plane Landing', category: 'Public Pages', icon: BookOpen, tab: 'home' },
    { id: 'page-docs', label: 'Documentation — Guides, Tutorials & References', category: 'Public Pages', icon: BookOpen, tab: 'documentation' },
    { id: 'page-features', label: 'Features — Capability Matrix & Platform Specs', category: 'Public Pages', icon: Zap, tab: 'features' },
    { id: 'page-developers', label: 'Developers — CLI, SDK & OpenAPI Schemas', category: 'Public Pages', icon: Terminal, tab: 'developers' },
    { id: 'page-pricing', label: 'Pricing — Flexible Cloud Tiers & Cost Calculator', category: 'Public Pages', icon: CreditCard, tab: 'pricing' },
    { id: 'page-about', label: 'Company — About Aravanta CloudOS', category: 'Public Pages', icon: ShieldCheck, tab: 'about' },
    { id: 'page-login', label: 'Sign In to Control Plane Console', category: 'Account', icon: User, tab: 'login' },
    { id: 'page-register', label: 'Create Workspace — Start Free Trial', category: 'Account', icon: Zap, tab: 'register' },

    // Operations & Control Plane Console
    { id: 'dashboard', label: 'Dashboard & SRE Operations Console', category: 'Operations', icon: Activity, tab: 'dashboard' },
    { id: 'infrastructure', label: 'Infrastructure — Multi-Cloud Resource Inventory', category: 'Operations', icon: Server, tab: 'infrastructure' },
    { id: 'applications', label: 'Applications — Microservices Catalog & Scaling', category: 'Operations', icon: Layers, tab: 'applications' },
    { id: 'deployments', label: 'Deployments — GitOps Pipeline & Rollback Engine', category: 'Operations', icon: GitBranch, tab: 'deployments' },
    { id: 'containers', label: 'Containers — Kubernetes Pods & Live Logs', category: 'Operations', icon: Box, tab: 'containers' },
    
    { id: 'monitoring', label: 'Monitoring — Observability & Telemetry Gauges', category: 'Observability', icon: Activity, tab: 'monitoring' },
    { id: 'logs', label: 'Log Explorer — Real-Time Stdout/Stderr Stream', category: 'Observability', icon: FileText, tab: 'logs' },
    { id: 'alerts', label: 'Alertmanager — Firing Alerts & Triage Rules', category: 'Observability', icon: Bell, tab: 'alerts' },
    { id: 'incidents', label: 'Incidents — War-Room Command & RCA Notes', category: 'Observability', icon: ShieldAlert, tab: 'incidents' },
    
    { id: 'automation', label: 'Automation — Self-Healing Runbooks & Workflows', category: 'Reliability', icon: Zap, tab: 'automation' },
    { id: 'backups', label: 'Backups — Disaster Recovery & 1-Click Restore', category: 'Reliability', icon: HardDrive, tab: 'backups' },
    { id: 'cicd', label: 'CI/CD Pipelines & Container Builds', category: 'Reliability', icon: GitBranch, tab: 'cicd' },

    { id: 'compute', label: 'ArvCompute — Virtual Machines', category: 'Cloud Resources', icon: Server, tab: 'compute' },
    { id: 'kubernetes', label: 'ArvKube — Managed Kubernetes Clusters', category: 'Cloud Resources', icon: Boxes, tab: 'kubernetes' },
    { id: 'storage', label: 'ArvStore — S3 Object Storage', category: 'Cloud Resources', icon: HardDrive, tab: 'storage' },
    { id: 'database', label: 'ArvDB — Managed Database Engines', category: 'Cloud Resources', icon: Database, tab: 'database' },

    { id: 'security', label: 'Security & RBAC Permission Matrix', category: 'Governance', icon: ShieldCheck, tab: 'security' },
    { id: 'audit', label: 'Audit Logs — Tamper-Evident Security Log', category: 'Governance', icon: FileCheck, tab: 'audit' },
    { id: 'billing', label: 'Billing & FinOps Cost Analytics (INR ₹)', category: 'Governance', icon: CreditCard, tab: 'billing' },
    { id: 'settings', label: 'Platform Settings & SRE Microservice Health', category: 'Governance', icon: SettingsIcon, tab: 'settings' },
    { id: 'profile', label: 'User Profile & API Credentials', category: 'Governance', icon: User, tab: 'profile' },
    { id: 'guide', label: 'Operations Guide & SOP Documentation', category: 'Help', icon: BookOpen, tab: 'guide' },
  ];

  const filtered = commands.filter(c =>
    c.label.toLowerCase().includes(query.toLowerCase()) ||
    c.category.toLowerCase().includes(query.toLowerCase()) ||
    c.tab.toLowerCase().includes(query.toLowerCase())
  );

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        if (isOpen) onClose();
        else setQuery('');
      }
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-start justify-center pt-16 sm:pt-24 px-4 animate-fadeIn">
      <div 
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-xl bg-white dark:bg-[#0F2038] border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl overflow-hidden"
      >
        {/* Search Input Bar */}
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center gap-3">
          <Search className="w-5 h-5 text-slate-400" />
          <input
            type="text"
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Type a command or jump to page (e.g. 'incidents', 'logs', 'deploy', 'backups')..."
            className="w-full bg-transparent text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none font-mono"
          />
          <kbd className="hidden sm:inline-block px-2 py-0.5 text-[10px] font-mono font-bold bg-slate-100 dark:bg-slate-800 text-slate-500 rounded border border-slate-200 dark:border-slate-700">ESC</kbd>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700 dark:hover:text-white p-1 cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Results List */}
        <div className="max-h-80 overflow-y-auto p-2 space-y-1">
          {filtered.length === 0 ? (
            <p className="text-xs text-slate-500 text-center py-6 font-mono">No matching commands found</p>
          ) : (
            filtered.map((cmd) => {
              const Icon = cmd.icon;
              return (
                <button
                  key={cmd.id}
                  onClick={() => {
                    onNavigate(cmd.tab);
                    onClose();
                  }}
                  className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-left transition-colors cursor-pointer group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-900 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                      <Icon className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors font-mono">{cmd.label}</p>
                      <p className="text-[10px] text-slate-400 font-mono">{cmd.category}</p>
                    </div>
                  </div>
                  <ArrowRight className="w-4 h-4 text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                </button>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="p-3 bg-slate-50 dark:bg-slate-900/60 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-[10px] text-slate-500 font-mono">
          <div className="flex items-center gap-2">
            <Terminal className="w-3.5 h-3.5 text-blue-500" />
            <span>Aravanta Cloud Operations Command Palette</span>
          </div>
          <span>Press <kbd className="px-1.5 py-0.5 bg-slate-200 dark:bg-slate-800 rounded font-bold text-slate-700 dark:text-slate-300">Ctrl+K</kbd> anytime</span>
        </div>
      </div>
    </div>
  );
};
