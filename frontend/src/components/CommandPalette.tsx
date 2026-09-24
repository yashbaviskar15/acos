import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search, Server, Box, HardDrive, Database, Play, Terminal, 
  Settings, CreditCard, Shield, Activity, FileText,
  User, Zap, Key, Radio,
  LayoutDashboard, GitBranch,
  Sun, X, Plus
} from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (path: string) => void;
  initialQuery?: string;
}

interface CommandItem {
  id: string;
  label: string;
  description: string;
  icon: React.ElementType;
  group: 'Quick Actions' | 'Cloud Services' | 'Settings & System';
  action?: () => void;
  path?: string;
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({ 
  isOpen, 
  onClose, 
  onNavigate,
  initialQuery = '' 
}) => {
  const { toggleTheme } = useTheme();
  const [query, setQuery] = useState(initialQuery);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setQuery(initialQuery);
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen, initialQuery]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const items: CommandItem[] = [
    // Quick Actions
    { 
      id: 'qa-provision', 
      label: 'Provision New Resource', 
      description: 'Deploy a container, database, VM or VPC', 
      icon: Plus, 
      group: 'Quick Actions', 
      action: () => {
        onNavigate('dashboard');
      } 
    },
    { 
      id: 'qa-theme', 
      label: 'Toggle Dark / Light Theme', 
      description: 'Switch between Obsidian Dark and Pearl White mode', 
      icon: Sun, 
      group: 'Quick Actions', 
      action: () => {
        toggleTheme();
      } 
    },
    { id: 'qa-vm', label: 'Launch VM Compute', description: 'Deploy a new ArvCompute instance', icon: Play, group: 'Quick Actions', path: 'compute' },
    { id: 'qa-cli', label: 'Open Cloud Shell / Terminal', description: 'Interactive browser shell & CLI tools', icon: Terminal, group: 'Quick Actions', path: 'cli' },
    { id: 'qa-billing', label: 'View Invoices & Billing', description: 'Check monthly usage and FinOps accrual', icon: CreditCard, group: 'Quick Actions', path: 'billing' },

    // Cloud Services
    { id: 'cs-dash', label: 'Operations Dashboard', description: 'Fleet overview and live telemetry', icon: LayoutDashboard, group: 'Cloud Services', path: 'dashboard' },
    { id: 'cs-infra', label: 'Resources Inventory', description: 'Provisioned infrastructure workloads', icon: Server, group: 'Cloud Services', path: 'infrastructure' },
    { id: 'cs-deploy', label: 'Deployments & Pipelines', description: 'GitOps CI/CD release engine', icon: GitBranch, group: 'Cloud Services', path: 'deployments' },
    { id: 'cs-func', label: 'ArvFunctions (Serverless FaaS)', description: 'Event-driven serverless compute runtime', icon: Zap, group: 'Cloud Services', path: 'functions' },
    { id: 'cs-vault', label: 'ArvVault (KMS & Secrets)', description: 'Hardware-grade secret and key management', icon: Key, group: 'Cloud Services', path: 'vault' },
    { id: 'cs-events', label: 'ArvEvents (Event Bus & Queues)', description: 'Distributed messaging topics and queues', icon: Radio, group: 'Cloud Services', path: 'events' },
    { id: 'cs-kube', label: 'ArvKube (Managed Kubernetes)', description: 'Container orchestration cluster control plane', icon: Box, group: 'Cloud Services', path: 'kubernetes' },
    { id: 'cs-db', label: 'ArvDB (Managed Databases)', description: 'PostgreSQL, Redis, MySQL database engines', icon: Database, group: 'Cloud Services', path: 'database' },
    { id: 'cs-store', label: 'ArvStore (S3 Storage)', description: 'Encrypted object storage buckets', icon: HardDrive, group: 'Cloud Services', path: 'storage' },

    // Settings & System
    { id: 'st-mon', label: 'ArvWatch Observability Hub', description: 'Prometheus metrics, alerts, and dashboards', icon: Activity, group: 'Settings & System', path: 'monitoring' },
    { id: 'st-logs', label: 'Log Stream Explorer', description: 'Centralized live log stream and query console', icon: FileText, group: 'Settings & System', path: 'logs' },
    { id: 'st-rbac', label: 'Access Control (RBAC)', description: 'Role-based access matrix and credentials', icon: Shield, group: 'Settings & System', path: 'security' },
    { id: 'st-prof', label: 'User Profile & Identity', description: 'Personal security keys and profile details', icon: User, group: 'Settings & System', path: 'profile' },
    { id: 'st-sett', label: 'Platform Settings', description: 'Global organization parameters and webhooks', icon: Settings, group: 'Settings & System', path: 'settings' },
  ];

  const filteredItems = items.filter(item => {
    const q = query.toLowerCase().trim();
    if (!q) return true;
    return (
      item.label.toLowerCase().includes(q) ||
      item.description.toLowerCase().includes(q) ||
      item.group.toLowerCase().includes(q) ||
      (item.path && item.path.toLowerCase().includes(q))
    );
  });

  const handleSelect = (index: number) => {
    const item = filteredItems[index];
    if (!item) return;

    if (item.action) {
      item.action();
    } else if (item.path) {
      onNavigate(item.path);
    }
    onClose();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => (prev + 1) % (filteredItems.length || 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => (prev - 1 + filteredItems.length) % (filteredItems.length || 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (filteredItems.length > 0) {
        handleSelect(selectedIndex);
      }
    }
  };

  const groups = Array.from(new Set(filteredItems.map(item => item.group)));

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-start justify-center pt-12 sm:pt-20 px-3 sm:px-4">
          {/* Backdrop */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 dark:bg-black/80 backdrop-blur-2xs"
          />

          {/* Modal Container */}
          <motion.div 
            initial={{ scale: 0.95, opacity: 0, y: -10 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: -10 }}
            transition={{ duration: 0.15, ease: 'easeOut' }}
            className="relative w-full max-w-xl bg-white dark:bg-[#0d1424] border border-slate-200 dark:border-[#22314d] rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[82vh] z-10"
          >
            {/* Search Input Bar */}
            <div className="flex items-center px-4 py-3.5 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-[#0a0f18]/60">
              <Search className="w-5 h-5 text-[#C6923B] dark:text-[#D4A347] mr-3 shrink-0" />
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Search commands, services, resources... (e.g. 'functions', 'theme', 'billing')"
                className="flex-1 bg-transparent border-none outline-none text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 text-sm sm:text-base font-medium font-sans"
              />
              <button 
                onClick={onClose}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-800 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Results List */}
            <div className="flex-1 overflow-y-auto p-2 scrollbar-thin">
              {filteredItems.length === 0 ? (
                <div className="px-4 py-12 text-center text-slate-500 font-mono text-xs">
                  No matching services or commands for "{query}"
                </div>
              ) : (
                groups.map(group => {
                  const groupItems = filteredItems.filter(item => item.group === group);
                  return (
                    <div key={group} className="mb-3 last:mb-0">
                      <div className="px-3 py-1.5 text-[10px] font-mono font-bold text-[#C6923B] dark:text-[#D4A347] uppercase tracking-wider">
                        {group}
                      </div>
                      <div className="space-y-0.5">
                        {groupItems.map(item => {
                          const globalIndex = filteredItems.findIndex(i => i.id === item.id);
                          const isSelected = globalIndex === selectedIndex;
                          const Icon = item.icon;
                          
                          return (
                            <button
                              key={item.id}
                              className={`w-full flex items-center px-3 py-2 rounded-xl text-left transition-all cursor-pointer ${
                                isSelected 
                                  ? 'bg-[#C6923B]/10 dark:bg-[#C6923B]/20 text-[#C6923B] dark:text-[#D4A347] border border-[#C6923B]/30' 
                                  : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/60'
                              }`}
                              onMouseEnter={() => setSelectedIndex(globalIndex)}
                              onClick={() => handleSelect(globalIndex)}
                            >
                              <div className={`p-2 rounded-lg mr-3 shrink-0 ${
                                isSelected 
                                  ? 'bg-[#C6923B] text-white shadow-2xs' 
                                  : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'
                              }`}>
                                <Icon className="w-4 h-4" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="text-xs sm:text-sm font-semibold truncate">{item.label}</div>
                                <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate">{item.description}</div>
                              </div>
                              {isSelected && (
                                <div className="text-[11px] font-mono text-[#C6923B] dark:text-[#D4A347] font-bold ml-2 shrink-0">
                                  ↵ Select
                                </div>
                              )}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
            
            {/* Footer */}
            <div className="px-4 py-2.5 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#0a0f18] flex items-center justify-between text-[11px] font-mono text-slate-500">
              <div className="flex items-center gap-3">
                <span className="flex items-center gap-1">
                  <kbd className="bg-white dark:bg-slate-800 px-1.5 py-0.5 rounded border border-slate-300 dark:border-slate-700 text-[10px]">↑</kbd> 
                  <kbd className="bg-white dark:bg-slate-800 px-1.5 py-0.5 rounded border border-slate-300 dark:border-slate-700 text-[10px]">↓</kbd> navigate
                </span>
                <span className="flex items-center gap-1">
                  <kbd className="bg-white dark:bg-slate-800 px-1.5 py-0.5 rounded border border-slate-300 dark:border-slate-700 text-[10px]">↵</kbd> select
                </span>
                <span className="hidden sm:inline">
                  <kbd className="bg-white dark:bg-slate-800 px-1.5 py-0.5 rounded border border-slate-300 dark:border-slate-700 text-[10px]">esc</kbd> close
                </span>
              </div>
              <span className="text-[10px] text-[#C6923B] dark:text-[#D4A347] font-bold">
                Aravanta CloudOS
              </span>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
