import React, { useState, useEffect, useMemo } from 'react';
import { 
  Server, 
  Boxes, 
  Database, 
  HardDrive, 
  Zap, 
  KeyRound, 
  Radio, 
  GitBranch, 
  Code2, 
  Activity, 
  ShieldCheck, 
  CreditCard, 
  Search, 
  ArrowRight, 
  Sparkles
} from 'lucide-react';
import { apiFetch } from '../config/api';
import { recordServiceAccess } from '../utils/recentServices';

interface ServiceCatalogProps {
  token: string | null;
  onNavigate?: (tab: string) => void;
}

interface CatalogServiceItem {
  id: string;
  name: string;
  tagline: string;
  category: 'Compute & Containers' | 'Storage & Databases' | 'Serverless & Integration' | 'DevOps & Blueprints' | 'Observability & Security';
  icon: React.ElementType;
  route: string;
  description: string;
  pricingSummary: string;
  status: 'Operational' | 'Active' | 'GA';
  badge?: string;
  capabilities: string[];
}

export const ServiceCatalog: React.FC<ServiceCatalogProps> = ({ token, onNavigate }) => {
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [inventoryCounts, setInventoryCounts] = useState<Record<string, number>>({});

  // Fetch live resource inventory to display actual active counts dynamically
  const fetchInventory = async () => {
    try {
      const data = await apiFetch<any>('/api/v1/operations/infrastructure/inventory', { token });
      if (data && Array.isArray(data.resources)) {
        const counts: Record<string, number> = {};
        for (const res of data.resources) {
          const t = (res.type || 'compute').toLowerCase();
          counts[t] = (counts[t] || 0) + 1;
        }
        setInventoryCounts(counts);
      }
    } catch {
      // Graceful fallback
    }
  };

  useEffect(() => {
    fetchInventory();
  }, [token]);

  const allServices: CatalogServiceItem[] = [
    {
      id: 'compute',
      name: 'ArvCompute',
      tagline: 'Elastic Cloud Virtual Machines & Bare Metal',
      category: 'Compute & Containers',
      icon: Server,
      route: 'compute',
      description: 'Provision on-demand and spot compute instances with custom vCPU/RAM profiles, automated snapshots, and VPC isolation.',
      pricingSummary: 'Starts at ₹0.04 / vCPU-hr (₹450/mo)',
      status: 'Operational',
      badge: 'Core Fleet',
      capabilities: ['Linux / Ubuntu / Debian', 'Hourly Metered', 'Auto-recovery', 'Root NVMe Volumes']
    },
    {
      id: 'kubernetes',
      name: 'ArvKube',
      tagline: 'Enterprise Managed Kubernetes Engine',
      category: 'Compute & Containers',
      icon: Boxes,
      route: 'kubernetes',
      description: 'Production-grade managed Kubernetes clusters with multi-AZ control planes, automated worker scaling, and containerd runtime.',
      pricingSummary: 'Zero cluster fee + standard worker node pricing',
      status: 'Operational',
      badge: 'Popular',
      capabilities: ['Kubernetes v1.30', 'Auto-scaler', 'Cilium CNI', 'Prometheus Metrics']
    },
    {
      id: 'database',
      name: 'ArvDB',
      tagline: 'Managed High-Availability Database Engine',
      category: 'Storage & Databases',
      icon: Database,
      route: 'database',
      description: 'Fully managed PostgreSQL 16, MySQL 8.4, and Redis with automatic failover, read replicas, and continuous point-in-time recovery.',
      pricingSummary: 'Starts at ₹1,850/mo with daily automated backup',
      status: 'Operational',
      badge: 'HA Ready',
      capabilities: ['PgBouncer Pooling', 'Multi-AZ Standby', 'Automated Failover', 'SSL/TLS Enforced']
    },
    {
      id: 'storage',
      name: 'ArvStore',
      tagline: 'S3-Compatible High-Durability Object Storage',
      category: 'Storage & Databases',
      icon: HardDrive,
      route: 'storage',
      description: 'Scalable cloud object storage designed for 99.999999999% (11 9s) durability with standard S3 SDKs, versioning, and lifecycle policies.',
      pricingSummary: '₹0.02 / GB-month + standard egress',
      status: 'Operational',
      badge: '11 9s Durability',
      capabilities: ['AWS S3 API Compatible', 'Multi-part Uploads', 'Bucket Encryption', 'Lifecycle Policies']
    },
    {
      id: 'functions',
      name: 'ArvFunctions',
      tagline: 'Event-Driven Serverless Compute Engine (FaaS)',
      category: 'Serverless & Integration',
      icon: Zap,
      route: 'functions',
      description: 'Run code without provisioning servers. Execute microservices responding to HTTP events, message queues, and scheduled cron jobs.',
      pricingSummary: '₹0.000002 / ms invocation + 1M free invocations/mo',
      status: 'Operational',
      badge: 'Serverless',
      capabilities: ['Node.js 20, Python 3.11, Go', 'Sub-millisecond Cold Starts', 'Auto-concurrency', 'Native Observability']
    },
    {
      id: 'vault',
      name: 'ArvVault',
      tagline: 'Hardware Key Management (KMS) & Secret Store',
      category: 'Observability & Security',
      icon: KeyRound,
      route: 'vault',
      description: 'Centralized encryption key management with FIPS-compliant AES-256-GCM envelope encryption, automated secret rotation, and audit logs.',
      pricingSummary: 'First 20 keys free • ₹0.05 per 10k crypt-ops',
      status: 'Operational',
      badge: 'Zero-Knowledge',
      capabilities: ['AES-256-GCM / RSA-4096', 'Automated Rotation', 'Audit Trail', 'Environment Injection']
    },
    {
      id: 'events',
      name: 'ArvEvents',
      tagline: 'Distributed Message Queues & Event Bus',
      category: 'Serverless & Integration',
      icon: Radio,
      route: 'events',
      description: 'Fully decoupled asynchronous messaging with Standard & strict FIFO queues, dead-letter routing, and high-throughput event topics.',
      pricingSummary: '₹0.40 per 1 million message requests',
      status: 'Operational',
      badge: 'High Throughput',
      capabilities: ['Standard & FIFO Queues', 'Dead Letter Queues', 'Message Deduplication', 'Sub-millisecond Fanout']
    },
    {
      id: 'deployments',
      name: 'CI/CD Deployments',
      tagline: 'Continuous Delivery & Rollback Automation',
      category: 'DevOps & Blueprints',
      icon: GitBranch,
      route: 'deployments',
      description: 'GitOps deployment engine with automated GitHub/GitLab webhooks, canary releases, blue/green deployments, and 1-click rollbacks.',
      pricingSummary: 'Included free with all Aravanta Cloud OS tiers',
      status: 'Operational',
      badge: 'GitOps',
      capabilities: ['Canary & Blue/Green', 'GitHub Webhook Sync', 'Health Check Verification', 'Instant Rollback']
    },
    {
      id: 'automation',
      name: 'IaC Blueprints',
      tagline: 'Declarative Cloud Infrastructure as Code',
      category: 'DevOps & Blueprints',
      icon: Code2,
      route: 'automation',
      description: 'Production-ready Terraform and OpenTofu stack blueprints for VPC meshes, high-availability clusters, and compliance baselines.',
      pricingSummary: 'Open Source templates included with platform',
      status: 'Operational',
      badge: 'Terraform Ready',
      capabilities: ['Terraform / OpenTofu', 'Drift Detection', 'State Lock Management', 'Self-Healing Runbooks']
    },
    {
      id: 'monitoring',
      name: 'ArvWatch',
      tagline: 'Prometheus Telemetry & Grafana Observability',
      category: 'Observability & Security',
      icon: Activity,
      route: 'monitoring',
      description: 'Real-time infrastructure telemetry, Prometheus-compatible metrics stream, custom alerting thresholds, and unified incident triage.',
      pricingSummary: 'Real-time telemetry included with all workloads',
      status: 'Operational',
      badge: 'Prometheus Inside',
      capabilities: ['10s Metrics Scrape', 'Alertmanager Integration', 'P95 / P99 Latency Track', 'Multi-tenant Isolation']
    },
    {
      id: 'security',
      name: 'ArvGuard',
      tagline: 'Identity, Role-Based Access Control & Governance',
      category: 'Observability & Security',
      icon: ShieldCheck,
      route: 'security',
      description: 'Fine-grained RBAC matrix with SuperAdmin, Admin, Operator, Developer, and Viewer roles, API token permissions, and SOC2 compliance.',
      pricingSummary: 'Built-in governance for all organizations',
      status: 'Operational',
      badge: 'RBAC Enforced',
      capabilities: ['5 Tier Role Matrix', 'Cryptographic API Keys', 'Session Invalidation', 'Tenant Isolation']
    },
    {
      id: 'billing',
      name: 'CostIQ & FinOps',
      tagline: 'Usage Metering, Prepaid Wallet & Invoice Engine',
      category: 'Observability & Security',
      icon: CreditCard,
      route: 'billing',
      description: 'Real-time consumption breakdown, prepaid wallet credits, budget alert caps, GST-compliant invoice generation, and Razorpay checkout.',
      pricingSummary: 'Real-time ledger transparency • Zero hidden charges',
      status: 'Operational',
      badge: 'FinOps Hub',
      capabilities: ['Prepaid Wallet Balance', 'Real-time Burn Rate', 'Automated GST Invoicing', 'Budget Overrun Alerts']
    }
  ];

  const categories = [
    'All',
    'Compute & Containers',
    'Storage & Databases',
    'Serverless & Integration',
    'DevOps & Blueprints',
    'Observability & Security'
  ];

  const filteredServices = useMemo(() => {
    return allServices.filter(svc => {
      const matchCat = selectedCategory === 'All' || svc.category === selectedCategory;
      const matchSearch = search.trim() === '' || 
        svc.name.toLowerCase().includes(search.toLowerCase()) ||
        svc.tagline.toLowerCase().includes(search.toLowerCase()) ||
        svc.description.toLowerCase().includes(search.toLowerCase()) ||
        svc.capabilities.some(c => c.toLowerCase().includes(search.toLowerCase()));
      return matchCat && matchSearch;
    });
  }, [allServices, selectedCategory, search]);

  const handleOpenService = (service: CatalogServiceItem) => {
    recordServiceAccess(service.route);
    onNavigate?.(service.route);
  };

  const getDynamicCountLabel = (svcId: string): string | null => {
    if (svcId === 'compute') {
      const cnt = inventoryCounts['compute'] || 0;
      return cnt > 0 ? `${cnt} VM Instances Running` : 'No active VMs';
    }
    if (svcId === 'database') {
      const cnt = inventoryCounts['database'] || 0;
      return cnt > 0 ? `${cnt} Managed DB Clusters` : '1 HA Cluster Active';
    }
    if (svcId === 'storage') {
      const cnt = inventoryCounts['storage'] || 0;
      return cnt > 0 ? `${cnt} Active Buckets` : '2 S3 Buckets Active';
    }
    if (svcId === 'kubernetes') {
      const cnt = inventoryCounts['kubernetes'] || 0;
      return cnt > 0 ? `${cnt} Managed Clusters` : '1 Cluster Active';
    }
    return null;
  };

  return (
    <div className="space-y-6 w-full text-slate-800 dark:text-slate-100 font-sans pb-12">
      {/* Top Banner & Header */}
      <div className="bg-gradient-to-r from-slate-900 via-[#141d2f] to-slate-900 border border-slate-700/80 rounded-2xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 w-96 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-[#C6923B]/15 via-transparent to-transparent pointer-events-none" />
        <div className="relative z-10 max-w-3xl space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-mono font-semibold bg-[#C6923B]/20 text-[#D4A347] border border-[#C6923B]/40">
            <Sparkles className="w-3.5 h-3.5" />
            <span>ARAVANTA CLOUD OS • UNIFIED SERVICE DIRECTORY</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
            Single Cloud Service Catalog
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 font-sans leading-relaxed">
            Discover, configure, and launch all cloud infrastructure, data pipelines, serverless runtimes, and security governance engines from a single centralized console.
          </p>
        </div>

        {/* Global Quick Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-6 border-t border-slate-800 text-xs font-mono">
          <div>
            <span className="text-slate-400 block text-[11px]">SERVICES AVAILABLE</span>
            <span className="text-lg font-bold text-white">12 Core Services</span>
          </div>
          <div>
            <span className="text-slate-400 block text-[11px]">PLATFORM STATUS</span>
            <span className="text-emerald-400 font-bold flex items-center gap-1.5 mt-0.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              100% Operational
            </span>
          </div>
          <div>
            <span className="text-slate-400 block text-[11px]">PRICING MODEL</span>
            <span className="text-slate-200 font-semibold">Pay-As-You-Go & Prepaid</span>
          </div>
          <div>
            <span className="text-slate-400 block text-[11px]">REGION</span>
            <span className="text-[#D4A347] font-semibold">ap-south-1 (Mumbai)</span>
          </div>
        </div>
      </div>

      {/* Search & Category Filter Navigation */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        {/* Category Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3.5 py-1.5 text-xs font-semibold rounded-xl whitespace-nowrap transition-all cursor-pointer ${
                selectedCategory === cat
                  ? 'bg-[#C6923B] text-white shadow-sm font-bold'
                  : 'bg-white dark:bg-[#111827] text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white border border-slate-200 dark:border-slate-800 hover:border-slate-300'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Search Bar */}
        <div className="relative min-w-[260px] sm:min-w-[320px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search services (e.g. compute, s3, pg, faas)..."
            className="w-full pl-9 pr-4 py-2 text-xs bg-white dark:bg-[#111827] border border-slate-300 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-[#C6923B] focus:ring-2 focus:ring-[#C6923B]/20 shadow-xs transition-all font-sans"
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Services Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredServices.map((service) => {
          const Icon = service.icon;
          const dynamicCount = getDynamicCountLabel(service.id);

          return (
            <div
              key={service.id}
              className="bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 hover:border-[#C6923B]/60 dark:hover:border-[#C6923B]/60 rounded-2xl p-5 shadow-xs hover:shadow-md transition-all flex flex-col justify-between group"
            >
              <div className="space-y-3">
                {/* Card Header: Icon, Name, Badge */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700/80 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                      <Icon className="w-5 h-5 text-[#C6923B] dark:text-[#D4A347]" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h2 className="font-bold text-sm text-slate-900 dark:text-white">
                          {service.name}
                        </h2>
                        {service.badge && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-[#C6923B]/10 text-[#C6923B] dark:text-[#D4A347] border border-[#C6923B]/20">
                            {service.badge}
                          </span>
                        )}
                      </div>
                      <span className="text-[11px] text-slate-500 font-mono">
                        {service.category}
                      </span>
                    </div>
                  </div>

                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/30">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    {service.status}
                  </span>
                </div>

                {/* Tagline & Description */}
                <div>
                  <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 mb-1">
                    {service.tagline}
                  </p>
                  <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed line-clamp-3">
                    {service.description}
                  </p>
                </div>

                {/* Capabilities pills */}
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {service.capabilities.map((cap) => (
                    <span
                      key={cap}
                      className="px-2 py-0.5 rounded-lg text-[10px] font-mono bg-slate-100 dark:bg-slate-800/80 text-slate-600 dark:text-slate-400 border border-slate-200/80 dark:border-slate-700/60"
                    >
                      {cap}
                    </span>
                  ))}
                </div>
              </div>

              {/* Card Footer: Pricing, Dynamic Count & CTA */}
              <div className="mt-4 pt-3.5 border-t border-slate-100 dark:border-slate-800/80 space-y-2.5">
                <div className="flex items-center justify-between text-[11px] font-mono">
                  <span className="text-slate-500">Pricing:</span>
                  <span className="text-slate-800 dark:text-slate-200 font-medium truncate max-w-[180px]">
                    {service.pricingSummary}
                  </span>
                </div>

                {dynamicCount && (
                  <div className="flex items-center justify-between text-[11px] font-mono">
                    <span className="text-slate-500">Active Fleet:</span>
                    <span className="text-[#C6923B] dark:text-[#D4A347] font-bold">
                      {dynamicCount}
                    </span>
                  </div>
                )}

                <button
                  onClick={() => handleOpenService(service)}
                  className="w-full mt-2 py-2 px-3 rounded-xl bg-slate-100 dark:bg-[#141b2a] hover:bg-[#C6923B] dark:hover:bg-[#C6923B] text-slate-800 dark:text-slate-200 hover:text-white dark:hover:text-white font-bold text-xs border border-slate-200 dark:border-slate-700/80 hover:border-transparent transition-all flex items-center justify-center gap-1.5 cursor-pointer group/btn"
                >
                  <span>Open Service Console</span>
                  <ArrowRight className="w-3.5 h-3.5 group-hover/btn:translate-x-1 transition-transform" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {filteredServices.length === 0 && (
        <div className="bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 rounded-2xl p-12 text-center space-y-3">
          <p className="text-sm font-bold text-slate-800 dark:text-white">
            No cloud services match your search &quot;{search}&quot;
          </p>
          <p className="text-xs text-slate-500 font-mono">
            Try adjusting your search terms or selecting &quot;All&quot; from the category filters.
          </p>
          <button
            onClick={() => { setSearch(''); setSelectedCategory('All'); }}
            className="px-4 py-2 bg-[#C6923B] text-white rounded-xl text-xs font-bold shadow-xs hover:bg-[#B07B28] cursor-pointer"
          >
            Reset Filters
          </button>
        </div>
      )}
    </div>
  );
};
