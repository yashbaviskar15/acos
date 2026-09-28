import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search, Server, Box, HardDrive, Database, Play, Terminal, 
  Settings, CreditCard, Shield, Activity, FileText,
  User, Zap, Key, Radio,
  LayoutDashboard, GitBranch,
  Sun, X, Plus, BookOpen, MessageSquare, AlertTriangle,
  Globe2, Folder, LayoutGrid, ShieldCheck, ChevronRight
} from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

export interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (path: string) => void;
  initialQuery?: string;
  mode?: 'landing' | 'dashboard' | 'auto';
}

interface CommandItem {
  id: string;
  label: string;
  description: string;
  icon: React.ElementType;
  group: string;
  action?: () => void;
  path?: string;
  badge?: string;
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({ 
  isOpen, 
  onClose, 
  onNavigate,
  initialQuery = '',
  mode = 'auto'
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

  const isLanding = mode === 'landing';

  // Landing Page Command Set: Public pages, services catalog, pricing, documentation, terminal sandbox
  const landingItems: CommandItem[] = [
    // Public Pages & Ecosystem
    { 
      id: 'lp-catalog', 
      label: 'Cloud Services Catalog', 
      description: 'Comprehensive directory of 20+ enterprise cloud services & architecture', 
      icon: LayoutGrid, 
      group: 'Public Pages & Guides', 
      path: 'services',
      badge: '20+ Services'
    },
    { 
      id: 'lp-feat', 
      label: 'Features & Architecture', 
      description: 'Distributed edge mesh, auto-scaling, and micro-second networking', 
      icon: Zap, 
      group: 'Public Pages & Guides', 
      path: 'features' 
    },
    { 
      id: 'lp-pricing', 
      label: 'Pricing & Compute Calculator', 
      description: 'Predictable billing, ₹399/mo starter tiers, and multi-currency estimator', 
      icon: CreditCard, 
      group: 'Public Pages & Guides', 
      path: 'pricing' 
    },
    { 
      id: 'lp-cli', 
      label: 'Interactive Web Terminal', 
      description: 'Live in-browser shell sandbox with arv CLI tools preloaded', 
      icon: Terminal, 
      group: 'Public Pages & Guides', 
      path: 'cli',
      badge: 'Live Sandbox'
    },
    { 
      id: 'lp-docs', 
      label: 'Developer Documentation', 
      description: 'REST API endpoints, SDK usage guides, and Terraform provider docs', 
      icon: BookOpen, 
      group: 'Public Pages & Guides', 
      path: 'documentation' 
    },
    { 
      id: 'lp-comm', 
      label: 'Community Hub & Forums', 
      description: 'Join discussions with cloud architects, share templates, and ask questions', 
      icon: MessageSquare, 
      group: 'Public Pages & Guides', 
      path: 'community' 
    },
    { 
      id: 'lp-faq', 
      label: 'Frequently Asked Questions', 
      description: 'Enterprise compliance, billing, data security, and migration FAQs', 
      icon: ShieldCheck, 
      group: 'Public Pages & Guides', 
      path: 'faq' 
    },
    { 
      id: 'lp-start', 
      label: 'Getting Started Guide', 
      description: 'From zero to production microservice deployment in under 3 minutes', 
      icon: Play, 
      group: 'Public Pages & Guides', 
      path: 'getting-started' 
    },
    { 
      id: 'lp-manual', 
      label: 'Platform User Manual', 
      description: 'Step-by-step administrator workflows, IAM policies, and VPC routing', 
      icon: FileText, 
      group: 'Public Pages & Guides', 
      path: 'user-manual' 
    },
    { 
      id: 'lp-about', 
      label: 'About Aravanta CloudOS', 
      description: 'Enterprise cloud vision, global datacenter footprint, and team mission', 
      icon: Globe2, 
      group: 'Public Pages & Guides', 
      path: 'about' 
    },

    // Design System & Specifications
    { 
      id: 'lp-found', 
      label: 'Design System Foundations', 
      description: 'Obsidian Black & Metallic Gold palettes, typography hierarchy, and spacing tokens', 
      icon: Box, 
      group: 'Design System & Primitives', 
      path: 'foundations' 
    },
    { 
      id: 'lp-comp', 
      label: 'Component Library', 
      description: 'Buttons, status badges, telemetry cards, and data table components', 
      icon: Folder, 
      group: 'Design System & Primitives', 
      path: 'components' 
    },
    { 
      id: 'lp-pat', 
      label: 'Interaction Patterns', 
      description: 'Drawer modals, notification systems, and responsive navigation patterns', 
      icon: LayoutDashboard, 
      group: 'Design System & Primitives', 
      path: 'patterns' 
    },
    { 
      id: 'lp-res', 
      label: 'Architecture Resources', 
      description: 'Production blueprints, security audit checklists, and reference designs', 
      icon: HardDrive, 
      group: 'Design System & Primitives', 
      path: 'resources' 
    },

    // Quick Actions
    { 
      id: 'lp-login', 
      label: 'Sign In to Cloud Console', 
      description: 'Access your active workspace, workloads, and real-time dashboard', 
      icon: User, 
      group: 'Quick Actions', 
      path: 'login' 
    },
    { 
      id: 'lp-reg', 
      label: 'Create Free Account', 
      description: 'Claim ₹4,000 in monthly compute credits with instant activation', 
      icon: Plus, 
      group: 'Quick Actions', 
      path: 'register',
      badge: 'Free Tier'
    },
    { 
      id: 'lp-theme', 
      label: 'Toggle Dark / Light Theme', 
      description: 'Switch between Obsidian Dark and Pearl White visual modes', 
      icon: Sun, 
      group: 'Quick Actions', 
      action: () => toggleTheme() 
    }
  ];

  // Dashboard Command Set: Console tabs, compute instances, clusters, storage, databases, networking, monitoring, logs, finops
  const dashboardItems: CommandItem[] = [
    // Operations & Telemetry
    { 
      id: 'cs-dash', 
      label: 'Operations Dashboard', 
      description: 'Real-time telemetry, fleet health overview, and active workload metrics', 
      icon: LayoutDashboard, 
      group: 'Operations & Telemetry', 
      path: 'dashboard' 
    },
    { 
      id: 'cs-mon', 
      label: 'ArvWatch Observability Hub', 
      description: 'Prometheus metrics, latency heatmaps, and threshold alerts', 
      icon: Activity, 
      group: 'Operations & Telemetry', 
      path: 'monitoring' 
    },
    { 
      id: 'cs-logs', 
      label: 'Centralized Log Stream Explorer', 
      description: 'Live streaming application, cluster, and ingress logs with regex filters', 
      icon: FileText, 
      group: 'Operations & Telemetry', 
      path: 'logs' 
    },
    { 
      id: 'cs-inc', 
      label: 'Incident Management & On-Call', 
      description: 'Active incidents, automated remediation runs, and SLA tracking', 
      icon: AlertTriangle, 
      group: 'Operations & Telemetry', 
      path: 'incidents' 
    },
    { 
      id: 'cs-deploy', 
      label: 'Deployments & GitOps CI/CD', 
      description: 'Canary deployments, blue-green releases, and automated commit webhooks', 
      icon: GitBranch, 
      group: 'Operations & Telemetry', 
      path: 'deployments' 
    },
    { 
      id: 'cs-infra', 
      label: 'Infrastructure Inventory', 
      description: 'Unified topology map of all provisioned cloud resources across regions', 
      icon: Server, 
      group: 'Operations & Telemetry', 
      path: 'infrastructure' 
    },

    // Cloud Services & Compute
    { 
      id: 'cs-vm', 
      label: 'ArvCompute (Virtual Machines)', 
      description: 'High-performance KVM & Bare Metal compute instances with SSD storage', 
      icon: Play, 
      group: 'Cloud Services & Compute', 
      path: 'compute',
      badge: 'Core Service'
    },
    { 
      id: 'cs-kube', 
      label: 'ArvKube (Managed Kubernetes)', 
      description: 'Production Kubernetes control plane, multi-AZ node pools, and pod metrics', 
      icon: Box, 
      group: 'Cloud Services & Compute', 
      path: 'kubernetes' 
    },
    { 
      id: 'cs-db', 
      label: 'ArvDB (Managed Databases)', 
      description: 'High-availability PostgreSQL, Redis caching, and MySQL clusters', 
      icon: Database, 
      group: 'Cloud Services & Compute', 
      path: 'database' 
    },
    { 
      id: 'cs-store', 
      label: 'ArvStore (S3 Compatible Storage)', 
      description: 'Encrypted object storage buckets with lifecycle policies and CDN integration', 
      icon: HardDrive, 
      group: 'Cloud Services & Compute', 
      path: 'storage' 
    },
    { 
      id: 'cs-func', 
      label: 'ArvFunctions (Serverless FaaS)', 
      description: 'Event-driven serverless code execution with sub-millisecond cold starts', 
      icon: Zap, 
      group: 'Cloud Services & Compute', 
      path: 'functions' 
    },

    // Cloud Networking & Security
    { 
      id: 'cs-vpc', 
      label: 'ArvVPC (Virtual Private Clouds)', 
      description: 'Isolated software-defined networks, subnets, NAT gateways, and peering', 
      icon: Server, 
      group: 'Networking & Security', 
      path: 'networking' 
    },
    { 
      id: 'cs-lb', 
      label: 'ArvLB (Elastic Load Balancers)', 
      description: 'L4 TCP/UDP & L7 HTTP/HTTPS traffic balancers with SSL termination', 
      icon: Radio, 
      group: 'Networking & Security', 
      path: 'load-balancers' 
    },
    { 
      id: 'cs-dns', 
      label: 'ArvDNS (Authoritative Anycast DNS)', 
      description: 'Ultra-low latency global DNS zones and dynamic routing record sets', 
      icon: Activity, 
      group: 'Networking & Security', 
      path: 'dns' 
    },
    { 
      id: 'cs-iam', 
      label: 'ArvIAM (Identity & Access Control)', 
      description: 'Granular RBAC role policies, workspace members, and invitation management', 
      icon: User, 
      group: 'Networking & Security', 
      path: 'iam' 
    },
    { 
      id: 'cs-vault', 
      label: 'ArvVault (KMS & Secrets Engine)', 
      description: 'Hardware envelope encryption, automated key rotation, and secret vaults', 
      icon: Key, 
      group: 'Networking & Security', 
      path: 'vault' 
    },
    { 
      id: 'cs-events', 
      label: 'ArvEvents (Event Bus & Queues)', 
      description: 'Distributed messaging pub/sub topics and dead-letter worker queues', 
      icon: Radio, 
      group: 'Networking & Security', 
      path: 'events' 
    },

    // FinOps & Management
    { 
      id: 'cs-billing', 
      label: 'FinOps, Invoices & Credits', 
      description: 'Real-time billing accrual, GST invoice downloads, and credit balances', 
      icon: CreditCard, 
      group: 'FinOps & Management', 
      path: 'billing',
      badge: 'Billing'
    },
    { 
      id: 'cs-api', 
      label: 'Cloud API Keys & SDK Tokens', 
      description: 'Programmatic REST gateway credentials and webhook delivery logs', 
      icon: Terminal, 
      group: 'FinOps & Management', 
      path: 'cloud-api' 
    },
    { 
      id: 'cs-sett', 
      label: 'Platform Settings', 
      description: 'Workspace preferences, notification webhooks, and audit log policies', 
      icon: Settings, 
      group: 'FinOps & Management', 
      path: 'settings' 
    },
    { 
      id: 'cs-prof', 
      label: 'User Profile & Security', 
      description: 'Personal authentication keys, session history, and Two-Factor MFA', 
      icon: Shield, 
      group: 'FinOps & Management', 
      path: 'profile' 
    },

    // Quick Actions
    { 
      id: 'qa-provision', 
      label: 'Provision New Workload', 
      description: 'Fast-deploy a new VM instance, database cluster, or S3 bucket', 
      icon: Plus, 
      group: 'Quick Actions', 
      action: () => onNavigate('compute'),
      badge: 'Action'
    },
    { 
      id: 'qa-cli', 
      label: 'Open Cloud Shell / Web Terminal', 
      description: 'Launch interactive terminal with pre-authenticated arv CLI tools', 
      icon: Terminal, 
      group: 'Quick Actions', 
      path: 'cli' 
    },
    { 
      id: 'qa-theme', 
      label: 'Toggle Dark / Light Theme', 
      description: 'Switch between Obsidian Dark and Pearl White visual modes', 
      icon: Sun, 
      group: 'Quick Actions', 
      action: () => toggleTheme() 
    }
  ];

  const items = isLanding ? landingItems : dashboardItems;

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
        <div className="fixed inset-0 z-[120] flex items-start justify-center pt-12 sm:pt-20 px-3 sm:px-4">
          {/* Backdrop */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 dark:bg-black/80 backdrop-blur-xs"
          />

          {/* Modal Container */}
          <motion.div 
            initial={{ scale: 0.95, opacity: 0, y: -10 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: -10 }}
            transition={{ duration: 0.15, ease: 'easeOut' }}
            className="relative w-full max-w-2xl bg-white dark:bg-[#0b0f17] border border-slate-200 dark:border-brandGold-500/30 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[82vh] z-10 ring-1 ring-black/5 dark:ring-brandGold-500/10"
          >
            {/* Context Header Badge */}
            <div className="flex items-center justify-between px-4 py-1.5 bg-slate-100/90 dark:bg-[#080b10] border-b border-slate-200 dark:border-slate-800 text-[10px] font-mono font-semibold tracking-wider text-slate-500 dark:text-slate-400">
              <span className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-brandGold-500 animate-pulse" />
                {isLanding ? 'PUBLIC PORTAL SEARCH & CATALOG' : 'CLOUD OPERATING SYSTEM SEARCH'}
              </span>
              <span className="text-brandGold-600 dark:text-brandGold-400 font-bold">
                {isLanding ? 'Landing Mode' : 'Console Operations'}
              </span>
            </div>

            {/* Search Input Bar */}
            <div className="flex items-center px-4 py-3.5 border-b border-slate-200 dark:border-slate-800/80 bg-white dark:bg-[#0e1422]">
              <Search className="w-5 h-5 text-brandGold-600 dark:text-brandGold-400 mr-3 shrink-0" />
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setSelectedIndex(0);
                }}
                onKeyDown={handleKeyDown}
                placeholder={
                  isLanding 
                    ? "Search documentation, 20+ services catalog, pricing, terminal sandbox, guides..." 
                    : "Search console services, compute instances, Kubernetes, storage, FinOps, logs..."
                }
                className="flex-1 bg-transparent border-none outline-none text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 text-sm sm:text-base font-medium font-sans"
              />
              <button 
                onClick={onClose}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
                title="Close palette"
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
                      <div className="px-3 py-1.5 text-[10px] font-mono font-bold text-brandGold-600 dark:text-brandGold-400 uppercase tracking-wider flex items-center justify-between">
                        <span>{group}</span>
                        <span className="text-[9px] text-slate-400 dark:text-slate-500">{groupItems.length}</span>
                      </div>
                      <div className="space-y-0.5">
                        {groupItems.map(item => {
                          const globalIndex = filteredItems.findIndex(i => i.id === item.id);
                          const isSelected = globalIndex === selectedIndex;
                          const Icon = item.icon;
                          
                          return (
                            <button
                              key={item.id}
                              className={`w-full flex items-center px-3 py-2.5 rounded-xl text-left transition-all cursor-pointer ${
                                isSelected 
                                  ? 'bg-brandGold-500/10 dark:bg-brandGold-500/20 text-brandGold-950 dark:text-brandGold-100 border border-brandGold-500/40 shadow-xs' 
                                  : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/60 border border-transparent'
                              }`}
                              onMouseEnter={() => setSelectedIndex(globalIndex)}
                              onClick={() => handleSelect(globalIndex)}
                            >
                              <div className={`p-2 rounded-xl mr-3 shrink-0 transition-colors ${
                                isSelected 
                                  ? 'bg-brandGold-500 text-brandObsidian-950 shadow-xs' 
                                  : 'bg-slate-100 dark:bg-[#151d2f] text-slate-600 dark:text-slate-400 border border-slate-200/60 dark:border-slate-800'
                              }`}>
                                <Icon className="w-4 h-4" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                  <span className="text-xs sm:text-sm font-semibold truncate text-slate-900 dark:text-white">
                                    {item.label}
                                  </span>
                                  {item.badge && (
                                    <span className="px-1.5 py-0.5 text-[9px] font-mono font-bold rounded bg-brandGold-500/20 text-brandGold-700 dark:text-brandGold-300 border border-brandGold-500/30">
                                      {item.badge}
                                    </span>
                                  )}
                                </div>
                                <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate mt-0.5">
                                  {item.description}
                                </div>
                              </div>
                              {isSelected ? (
                                <div className="text-[10px] font-mono text-brandGold-600 dark:text-brandGold-400 font-bold ml-2 shrink-0 flex items-center gap-1 bg-brandGold-500/15 px-2 py-0.5 rounded-md border border-brandGold-500/30">
                                  <span>↵ Go</span>
                                </div>
                              ) : (
                                <ChevronRight className="w-3.5 h-3.5 text-slate-400 dark:text-slate-600 ml-2 shrink-0 opacity-60" />
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
            
            {/* Footer Bar */}
            <div className="px-4 py-2.5 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#070a10] flex items-center justify-between text-[11px] font-mono text-slate-500">
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
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-brandGold-600 dark:text-brandGold-400 font-bold">
                  Aravanta CloudOS
                </span>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
