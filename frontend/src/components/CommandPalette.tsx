import React, { useState, useEffect } from 'react';
import { Search, Server, Boxes, HardDrive, Database, GitBranch, Activity, ShieldCheck, CreditCard, User, BookOpen, Terminal, ArrowRight, X } from 'lucide-react';

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (tab: string) => void;
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({ isOpen, onClose, onNavigate }) => {
  const [query, setQuery] = useState('');

  const commands = [
    { id: 'dashboard', label: 'Go to Dashboard Command Center', category: 'Navigation', icon: Activity, tab: 'dashboard' },
    { id: 'compute', label: 'ArvCompute — Virtual Machine Instances', category: 'Compute', icon: Server, tab: 'compute' },
    { id: 'launch-vm', label: 'Launch New Virtual Machine (arv.medium)', category: 'Actions', icon: Server, tab: 'compute' },
    { id: 'kubernetes', label: 'ArvKube — Managed Kubernetes Clusters', category: 'Containers', icon: Boxes, tab: 'kubernetes' },
    { id: 'create-k8s', label: 'Deploy New Kubernetes Cluster (v1.29)', category: 'Actions', icon: Boxes, tab: 'kubernetes' },
    { id: 'storage', label: 'ArvStore — S3 Object Storage Buckets', category: 'Storage', icon: HardDrive, tab: 'storage' },
    { id: 'create-bucket', label: 'Create New S3 Storage Bucket', category: 'Actions', icon: HardDrive, tab: 'storage' },
    { id: 'database', label: 'ArvDB — Managed Database Instances', category: 'Databases', icon: Database, tab: 'database' },
    { id: 'create-db', label: 'Provision New PostgreSQL / MySQL Database', category: 'Actions', icon: Database, tab: 'database' },
    { id: 'cicd', label: 'CI/CD Pipelines & Container Builds', category: 'DevOps', icon: GitBranch, tab: 'cicd' },
    { id: 'trigger-build', label: 'Trigger CI/CD Build Runner', category: 'Actions', icon: GitBranch, tab: 'cicd' },
    { id: 'monitoring', label: 'ArvWatch — Telemetry & Active Alert Center', category: 'Observability', icon: Activity, tab: 'monitoring' },
    { id: 'security', label: 'Security Center & Audit Log Trail', category: 'Security', icon: ShieldCheck, tab: 'security' },
    { id: 'billing', label: 'Billing & Cost Analytics (INR ₹)', category: 'Finance', icon: CreditCard, tab: 'billing' },
    { id: 'profile', label: 'User Profile & API Credentials', category: 'Account', icon: User, tab: 'profile' },
    { id: 'guide', label: 'Getting Started — Service Usage Guide', category: 'Documentation', icon: BookOpen, tab: 'guide' },
  ];

  const filtered = commands.filter(c =>
    c.label.toLowerCase().includes(query.toLowerCase()) ||
    c.category.toLowerCase().includes(query.toLowerCase())
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
            placeholder="Type a command or search resources (e.g. 'compute', 'database', 'k8s')..."
            className="w-full bg-transparent text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none font-mono"
          />
          <kbd className="hidden sm:inline-block px-2 py-0.5 text-[10px] font-mono font-bold bg-slate-100 dark:bg-slate-800 text-slate-500 rounded border border-slate-200 dark:border-slate-700">ESC</kbd>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700 dark:hover:text-white p-1">
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
                      <p className="text-xs font-bold text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">{cmd.label}</p>
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
            <span>Aravanta CloudOS Command Palette</span>
          </div>
          <span>Press <kbd className="px-1.5 py-0.5 bg-slate-200 dark:bg-slate-800 rounded font-bold text-slate-700 dark:text-slate-300">Ctrl+K</kbd> anytime</span>
        </div>
      </div>
    </div>
  );
};
