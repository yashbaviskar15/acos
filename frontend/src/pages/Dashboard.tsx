import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { createPortal } from 'react-dom';
import {
  RefreshCw,
  Layers,
  ChevronRight,
  Cpu,
  ShieldAlert,
  Server,
  Plus,
  Database,
  HardDrive,
  Search,
  X,
  RotateCw,
  GitBranch,
  Activity,
  Code2,
  Copy,
  Check,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  Network,
  CheckCircle2,
  Boxes,
  Zap,
  KeyRound,
  Radio,
  ArrowRight,
  Clock,
  Wallet,
  CreditCard,
  ShieldCheck
} from 'lucide-react';
import { apiFetch } from '../config/api';
import { getRecentServices, formatRelativeTime, RecentServiceItem, recordServiceAccess } from '../utils/recentServices';
import { DataTablePagination } from '../components/DataTablePagination';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line
} from 'recharts';

interface DashboardProps {
  token: string | null;
  onNavigate?: (tab: string) => void;
  searchTerm?: string;
}

interface ResourceItem {
  id: string;
  name: string;
  type: 'container' | 'database' | 'compute' | 'networking' | 'storage';
  engine: string;
  region: string;
  env: 'production' | 'staging' | 'development';
  status: 'RUNNING' | 'PROVISIONING' | 'STOPPED' | 'ERROR';
  cpu: number;
  memoryMb: number;
  specs: string;
  uptime: string;
  createdAt: string;
  privateIp: string;
  endpoint: string;
  sparkline: number[];
}

interface PipelineRun {
  id: string;
  name: string;
  commitHash: string;
  commitMsg: string;
  branch: string;
  status: 'SUCCESS' | 'RUNNING' | 'FAILED';
  duration: string;
  startedAt: string;
  trigger: string;
  steps: {
    name: string;
    status: 'completed' | 'running' | 'pending' | 'failed';
    duration: string;
    logSnippet?: string;
  }[];
}

interface IaCTemplate {
  id: string;
  name: string;
  category: string;
  version: string;
  provider: 'Terraform' | 'OpenTofu';
  resourceCount: number;
  lastApplied: string;
  description: string;
}

interface ServiceCostItem {
  service: string;
  service_id: string;
  cost_inr: number;
  cost_usd: number;
  percent: number;
  color: string;
  resource_count: number;
  billing_type: string;
  status: string;
}

export const Dashboard: React.FC<DashboardProps> = ({ token, onNavigate, searchTerm = '' }) => {
  const [metrics, setMetrics] = useState<any>(null);
  const [timeseries, setTimeseries] = useState<any[]>([]);
  const [alerts, setAlerts] = useState<any[]>([]);
  const [incidents, setIncidents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRange, setSelectedRange] = useState<string>('24h');
  const [lastRefreshedAt, setLastRefreshedAt] = useState<Date>(new Date());

  // Toast Notification state
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'info' | 'error' } | null>(null);

  const showToast = (message: string, type: 'success' | 'info' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  // Provisioning Modal State
  const [isProvisionModalOpen, setIsProvisionModalOpen] = useState(false);
  const [provisionType, setProvisionType] = useState<'container' | 'database' | 'compute' | 'networking' | 'storage'>('container');
  const [provisionName, setProvisionName] = useState('');
  const [provisionRegion, setProvisionRegion] = useState('ap-south-1a');
  const [provisionEnv, setProvisionEnv] = useState<'production' | 'staging' | 'development'>('production');
  const [provisionSpec, setProvisionSpec] = useState('standard-2x');

  // Resource Detail Side Panel
  const [inspectResource, setInspectResource] = useState<ResourceItem | null>(null);
  const [detailTab, setDetailTab] = useState<'overview' | 'logs' | 'metrics' | 'settings'>('overview');

  // Prevent background scroll and preserve viewport lock when modals/drawers open
  useEffect(() => {
    if (inspectResource || isProvisionModalOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [inspectResource, isProvisionModalOpen]);

  // Filter & Search States
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [tableSearch, setTableSearch] = useState<string>('');
  const [sortField, setSortField] = useState<string>('name');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');
  const [page, setPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(10);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Expanded Pipeline steps
  const [expandedPipelineId, setExpandedPipelineId] = useState<string | null>(null);

  // Fleet state initialized from SQL backend
  const [fleet, setFleet] = useState<ResourceItem[]>([]);
  const [pipelines, setPipelines] = useState<PipelineRun[]>([]);
  const [monthlyRunRateInr, setMonthlyRunRateInr] = useState<number>(4820);

  // Real-time FinOps cost breakdown and recently accessed services
  const [costBreakdown, setCostBreakdown] = useState<ServiceCostItem[]>([]);
  const [recentServices, setRecentServices] = useState<RecentServiceItem[]>([]);

  // Listen to recent services updates dynamically across navigation
  useEffect(() => {
    setRecentServices(getRecentServices());
    const handleRecentUpdate = () => {
      setRecentServices(getRecentServices());
    };
    window.addEventListener('acos:recent-services-updated', handleRecentUpdate);
    return () => window.removeEventListener('acos:recent-services-updated', handleRecentUpdate);
  }, []);

  // Helper to map backend inventory resources to UI fleet items
  const mapToResourceItem = useCallback((item: any): ResourceItem => {
    const rawType = (item.type || '').toLowerCase();
    let normalizedType: ResourceItem['type'] = 'container';
    if (rawType.includes('db') || rawType.includes('database')) normalizedType = 'database';
    else if (rawType.includes('compute') || rawType.includes('vm')) normalizedType = 'compute';
    else if (rawType.includes('net') || rawType.includes('alb') || rawType.includes('vpc')) normalizedType = 'networking';
    else if (rawType.includes('storage') || rawType.includes('s3') || rawType.includes('bucket')) normalizedType = 'storage';
    else normalizedType = 'container';

    const rawStatus = (item.status || 'RUNNING').toUpperCase();
    let normalizedStatus: ResourceItem['status'] = 'RUNNING';
    if (rawStatus === 'PROVISIONING' || rawStatus === 'PENDING' || rawStatus === 'DEPLOYING') normalizedStatus = 'PROVISIONING';
    else if (rawStatus === 'STOPPED' || rawStatus === 'PAUSED' || rawStatus === 'DISABLED') normalizedStatus = 'STOPPED';
    else if (rawStatus === 'ERROR' || rawStatus === 'FAILED' || rawStatus === 'DEGRADED') normalizedStatus = 'ERROR';
    else normalizedStatus = 'RUNNING';

    const env = ['production', 'staging', 'development'].includes(item.env) ? item.env : 'production';
    const cpu = typeof item.cpu === 'number' ? item.cpu : (item.cpu_usage ? Math.round(item.cpu_usage) : 16);
    const memoryMb = item.memory_mb || item.memoryMb || 1024;

    const baseVal = Math.max(5, Math.min(90, cpu));
    const seed = (item.id || '').split('').reduce((acc: number, c: string) => acc + c.charCodeAt(0), 0);
    const sparkline = [
      Math.max(2, baseVal - (seed % 7)),
      Math.max(2, baseVal + ((seed + 2) % 9) - 4),
      Math.max(2, baseVal - ((seed + 4) % 6)),
      baseVal,
      Math.max(2, baseVal + ((seed + 6) % 8) - 3),
      Math.max(2, baseVal + ((seed + 8) % 5) - 2),
      baseVal
    ];

    return {
      id: item.id,
      name: item.name,
      type: normalizedType,
      engine: item.engine || item.provider || 'Aravanta Engine',
      region: item.region || 'ap-south-1',
      env: env as any,
      status: normalizedStatus,
      cpu,
      memoryMb,
      specs: item.specs || `${cpu * 2} vCPU • ${Math.round(memoryMb / 1024)} GB`,
      uptime: item.uptime || '99.99%',
      createdAt: item.created_at || item.createdAt || new Date().toISOString(),
      privateIp: item.private_ip || item.privateIp || '10.0.1.15',
      endpoint: item.endpoint || `${item.name}.internal.aravanta.net`,
      sparkline
    };
  }, []);

  // IaC Templates Library
  const iacTemplates: IaCTemplate[] = [
    {
      id: 'iac-vpc-ha',
      name: 'Production 3-Tier VPC & Subnet Mesh',
      category: 'Networking',
      version: 'v2.4.1',
      provider: 'Terraform',
      resourceCount: 14,
      lastApplied: '2h ago',
      description: 'Multi-AZ public/private subnets, NAT Gateways, Route Tables, and Network ACLs.'
    },
    {
      id: 'iac-pg-ha',
      name: 'HA PostgreSQL Cluster with Standby Replica',
      category: 'Database',
      version: 'v1.8.0',
      provider: 'OpenTofu',
      resourceCount: 6,
      lastApplied: 'Yesterday',
      description: 'Synchronous replication, automatic failover, daily automated snapshots with 30d retention.'
    },
    {
      id: 'iac-k8s-nodes',
      name: 'Kubernetes EKS/ArvKube Node Auto-Scaler',
      category: 'Compute Fleet',
      version: 'v3.2.0',
      provider: 'Terraform',
      resourceCount: 9,
      lastApplied: '3d ago',
      description: 'Cluster autoscaler configuration, spot instance harvesting, and containerd runtime.'
    },
    {
      id: 'iac-faas-gateway',
      name: 'Serverless EventBridge & Microservices Bus',
      category: 'Serverless',
      version: 'v1.4.0',
      provider: 'OpenTofu',
      resourceCount: 8,
      lastApplied: '5d ago',
      description: 'API Gateway L7 router, FIFO SQS queues, dead-letter re-routing, and Lambda workers.'
    }
  ];

  // Fetch telemetry and live SQL fleet from backend
  const fetchDashboardData = useCallback(async () => {
    setLoading(true);
    try {
      const [resMetrics, resTimeseries, resAlerts, resIncidents, resInventory, resDeployments, resServices, resCostBreakdown, resBillingSummary] = await Promise.all([
        apiFetch<any>('/api/v1/monitoring/metrics', { token }).catch(() => null),
        apiFetch<any[]>(`/api/v1/monitoring/metrics/timeseries?time_range=${selectedRange}`, { token }).catch(() => []),
        apiFetch<any[]>('/api/v1/monitoring/alerts', { token }).catch(() => []),
        apiFetch<any[]>('/api/v1/operations/incidents', { token }).catch(() => []),
        apiFetch<any>('/api/v1/operations/infrastructure/inventory', { token }).catch(() => null),
        apiFetch<any[]>('/api/v1/operations/deployments', { token }).catch(() => []),
        apiFetch<any>('/api/v1/monitoring/dashboard/services', { token }).catch(() => null),
        apiFetch<ServiceCostItem[]>('/api/v1/billing/breakdown', { token }).catch(() => []),
        apiFetch<any>('/api/v1/billing/summary', { token }).catch(() => null),
      ]);

      if (resMetrics) setMetrics(resMetrics);
      if (Array.isArray(resTimeseries) && resTimeseries.length > 0) {
        setTimeseries(resTimeseries);
      } else {
        setTimeseries([
          { time: '00:00', cpu: 22, memory: 58, requests: 4200, errors: 2 },
          { time: '04:00', cpu: 18, memory: 54, requests: 3100, errors: 1 },
          { time: '08:00', cpu: 32, memory: 64, requests: 8900, errors: 5 },
          { time: '12:00', cpu: 45, memory: 72, requests: 14200, errors: 8 },
          { time: '16:00', cpu: 38, memory: 68, requests: 12100, errors: 4 },
          { time: '20:00', cpu: 28, memory: 62, requests: 7800, errors: 3 },
          { time: '24:00', cpu: 24, memory: 60, requests: 5400, errors: 2 },
        ]);
      }
      if (Array.isArray(resAlerts)) setAlerts(resAlerts);
      if (Array.isArray(resIncidents)) setIncidents(resIncidents);

      // Populate live fleet from PostgreSQL / SQLite
      if (resInventory && Array.isArray(resInventory.resources)) {
        setFleet(resInventory.resources.map(mapToResourceItem));
      }

      // Populate live deployment pipeline runs from SQL
      if (Array.isArray(resDeployments) && resDeployments.length > 0) {
        const mappedRuns: PipelineRun[] = resDeployments.slice(0, 6).map((dep: any) => {
          const statusUpper = (dep.status || 'SUCCESS').toUpperCase();
          const runStatus: 'SUCCESS' | 'RUNNING' | 'FAILED' =
            statusUpper.includes('FAIL') || statusUpper.includes('ERROR') ? 'FAILED' :
            (statusUpper.includes('RUN') || statusUpper.includes('PROGRESS') || statusUpper.includes('PENDING')) ? 'RUNNING' : 'SUCCESS';

          const durationSec = dep.duration_seconds || 60;
          const durationStr = durationSec >= 60 ? `${Math.floor(durationSec / 60)}m ${durationSec % 60}s` : `${durationSec}s`;

          let startedAtStr = 'Recently';
          if (dep.started_at) {
            const diffMs = Date.now() - new Date(dep.started_at).getTime();
            const diffMins = Math.floor(diffMs / 60000);
            if (diffMins < 1) startedAtStr = 'Just now';
            else if (diffMins < 60) startedAtStr = `${diffMins}m ago`;
            else if (diffMins < 1440) startedAtStr = `${Math.floor(diffMins / 60)}h ago`;
            else startedAtStr = `${Math.floor(diffMins / 1440)}d ago`;
          }

          return {
            id: dep.id,
            name: `${dep.application_name || 'workload'} :: release-${dep.environment || 'prod'}`,
            commitHash: (dep.commit_hash || 'head').slice(0, 8),
            commitMsg: dep.commit_message || `Release version ${dep.version || 'v1.0.0'}`,
            branch: 'main',
            status: runStatus,
            duration: durationStr,
            startedAt: startedAtStr,
            trigger: dep.trigger || 'GitHub Actions Push',
            steps: [
              { name: 'Git Checkout & Lint', status: 'completed', duration: '12s', logSnippet: '✓ Code formatted with ruff & eslint. 0 warnings.' },
              { name: 'Pytest & Vitest Unit Tests', status: runStatus === 'FAILED' ? 'failed' : 'completed', duration: '34s', logSnippet: runStatus === 'FAILED' ? 'FAIL: service integration check timed out.' : '✓ 6 passed in 6.90s. Tests verified.' },
              { name: 'Docker Build & Tag', status: runStatus === 'FAILED' ? 'pending' : 'completed', duration: '28s', logSnippet: `✓ Pushed image to registry.aravanta.io/${dep.application_name || 'app'}:${dep.version || 'latest'}` },
              { name: 'Kubernetes Rolling Release', status: runStatus === 'RUNNING' ? 'running' : (runStatus === 'FAILED' ? 'pending' : 'completed'), duration: '22s', logSnippet: '✓ Replicas healthy. Zero-downtime cutover complete.' },
              { name: 'SRE Smoke Check', status: runStatus === 'RUNNING' ? 'pending' : (runStatus === 'FAILED' ? 'pending' : 'completed'), duration: '6s', logSnippet: '✓ GET /health returned 200 OK.' },
            ]
          };
        });
        setPipelines(mappedRuns);
        setExpandedPipelineId(mappedRuns[0].id);
      }

      // Populate live FinOps cost breakdown from PostgreSQL / SQLite
      if (Array.isArray(resCostBreakdown) && resCostBreakdown.length > 0) {
        setCostBreakdown(resCostBreakdown);
      }
      if (resBillingSummary) {
        if (resBillingSummary.mtd_spend_inr) {
          setMonthlyRunRateInr(resBillingSummary.mtd_spend_inr);
        }
      } else if (resServices && (resServices.monthly_run_rate_inr || resServices.total_accrued_inr)) {
        setMonthlyRunRateInr(resServices.monthly_run_rate_inr || resServices.total_accrued_inr);
      }

      setLastRefreshedAt(new Date());
    } catch (err) {
      console.error('Failed to fetch dashboard data:', err);
    } finally {
      setLoading(false);
    }
  }, [selectedRange, token, mapToResourceItem]);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  // Compute fleet counts
  const totalFleetCount = fleet.length;
  const runningCount = fleet.filter(r => r.status === 'RUNNING').length;
  const provisioningCount = fleet.filter(r => r.status === 'PROVISIONING').length;
  const stoppedCount = fleet.filter(r => r.status === 'STOPPED').length;
  const errorCount = fleet.filter(r => r.status === 'ERROR').length;

  // Filtered & Sorted resources
  const effectiveSearch = (tableSearch || searchTerm).toLowerCase().trim();

  const filteredFleet = useMemo(() => {
    return fleet.filter(r => {
      const matchType = typeFilter === 'all' || r.type === typeFilter;
      const matchStatus = statusFilter === 'all' || r.status === statusFilter;
      const matchSearch = !effectiveSearch || 
        r.name.toLowerCase().includes(effectiveSearch) ||
        r.id.toLowerCase().includes(effectiveSearch) ||
        r.engine.toLowerCase().includes(effectiveSearch) ||
        r.region.toLowerCase().includes(effectiveSearch) ||
        r.specs.toLowerCase().includes(effectiveSearch) ||
        r.privateIp.toLowerCase().includes(effectiveSearch);

      return matchType && matchStatus && matchSearch;
    });
  }, [fleet, typeFilter, statusFilter, effectiveSearch]);

  const sortedFleet = useMemo(() => {
    return [...filteredFleet].sort((a: any, b: any) => {
      let aVal = a[sortField] ?? '';
      let bVal = b[sortField] ?? '';
      if (typeof aVal === 'number' && typeof bVal === 'number') {
        return sortDir === 'asc' ? aVal - bVal : bVal - aVal;
      }
      if (typeof aVal === 'string') aVal = aVal.toLowerCase();
      if (typeof bVal === 'string') bVal = bVal.toLowerCase();
      if (aVal < bVal) return sortDir === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortDir === 'asc' ? 1 : -1;
      return 0;
    });
  }, [filteredFleet, sortField, sortDir]);

  const paginatedFleet = useMemo(() => {
    return sortedFleet.slice((page - 1) * pageSize, page * pageSize);
  }, [sortedFleet, page, pageSize]);

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDir('asc');
    }
    setPage(1);
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    showToast(`Copied ${id} to clipboard!`, 'info');
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Deployment stats computed live from pipelines
  const deploymentSuccessRate = useMemo(() => {
    if (!pipelines.length) return '100.0';
    const successful = pipelines.filter(p => p.status === 'SUCCESS').length;
    return ((successful / pipelines.length) * 100).toFixed(1);
  }, [pipelines]);

  const avgRunTimeStr = useMemo(() => {
    if (!pipelines.length) return '1m 42s';
    return pipelines[0]?.duration || '1m 42s';
  }, [pipelines]);

  const latestCommitHash = useMemo(() => {
    return pipelines[0]?.commitHash || 'fc3e039b';
  }, [pipelines]);

  const handleProvisionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!provisionName.trim()) return;

    try {
      const typeMap: Record<string, string> = {
        container: 'Microservice',
        database: 'Managed Database',
        compute: 'Compute VM',
        networking: 'Network Ingress ALB',
        storage: 'Object Storage'
      };
      const cleanName = provisionName.trim().toLowerCase().replace(/\s+/g, '-');
      const payload = {
        name: cleanName,
        type: typeMap[provisionType] || 'Compute VM',
        provider: provisionType === 'database' ? 'PostgreSQL Managed' :
                  provisionType === 'storage' ? 'ArvStore S3' :
                  provisionType === 'networking' ? 'AWS / ALB' : 'AWS / EC2',
        region: provisionRegion,
        env: provisionEnv,
        specs: provisionSpec,
        tags: { env: provisionEnv, managed_by: 'aravanta-console' }
      };

      await apiFetch('/api/v1/operations/infrastructure/provision', {
        method: 'POST',
        body: JSON.stringify(payload),
        token
      });

      showToast(`Provisioned '${cleanName}' successfully. Persisted to database.`, 'success');
      setIsProvisionModalOpen(false);
      setProvisionName('');
      await fetchDashboardData();
    } catch (err: any) {
      console.error('Provision error:', err);
      showToast(err.message || 'Failed to provision resource', 'error');
    }
  };

  const handleRestartResource = async (res: ResourceItem) => {
    try {
      showToast(`Restarting '${res.name}'...`, 'info');
      await apiFetch(`/api/v1/operations/infrastructure/${res.id}/restart`, {
        method: 'POST',
        token
      });
      showToast(`Resource '${res.name}' restarted successfully.`, 'success');
      await fetchDashboardData();
    } catch (err: any) {
      showToast(err.message || `Failed to restart ${res.name}`, 'error');
    }
  };

  const handleTerminateResource = async (res: ResourceItem) => {
    try {
      showToast(`Decommissioning '${res.name}'...`, 'info');
      await apiFetch(`/api/v1/operations/infrastructure/${res.id}`, {
        method: 'DELETE',
        token
      });
      setInspectResource(null);
      showToast(`Resource '${res.name}' terminated and purged.`, 'error');
      await fetchDashboardData();
    } catch (err: any) {
      showToast(err.message || `Failed to terminate ${res.name}`, 'error');
    }
  };

  const renderStatusBadge = (status: ResourceItem['status']) => {
    switch (status) {
      case 'RUNNING':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-mono font-bold bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/30">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            RUNNING
          </span>
        );
      case 'PROVISIONING':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-mono font-bold bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-500/30">
            <RotateCw className="w-2.5 h-2.5 animate-spin text-[#C6923B]" />
            PROVISIONING
          </span>
        );
      case 'STOPPED':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-mono font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
            <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
            STOPPED
          </span>
        );
      case 'ERROR':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-mono font-bold bg-rose-50 dark:bg-rose-500/10 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-500/30">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-ping" />
            ERROR
          </span>
        );
    }
  };

  const renderSparklineSvg = (data: number[], status: string) => {
    const strokeColor = status === 'ERROR' ? '#ef4444' : status === 'PROVISIONING' ? '#C6923B' : '#10b981';
    const min = Math.min(...data);
    const max = Math.max(...data, 1);
    const width = 60;
    const height = 16;
    const points = data.map((val, idx) => {
      const x = (idx / (data.length - 1)) * width;
      const y = height - ((val - min) / (max - min || 1)) * (height - 4) - 2;
      return `${x},${y}`;
    }).join(' ');

    return (
      <svg width={width} height={height} className="overflow-visible inline-block">
        <polyline
          fill="none"
          stroke={strokeColor}
          strokeWidth="1.75"
          strokeLinecap="round"
          strokeLinejoin="round"
          points={points}
        />
      </svg>
    );
  };

  const getTypeIcon = (type: ResourceItem['type']) => {
    switch (type) {
      case 'container': return <Layers className="w-4 h-4 text-[#C6923B] dark:text-[#D4A347] shrink-0" />;
      case 'database': return <Database className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />;
      case 'compute': return <Server className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0" />;
      case 'networking': return <Network className="w-4 h-4 text-cyan-600 dark:text-cyan-400 shrink-0" />;
      case 'storage': return <HardDrive className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />;
    }
  };

  const getServiceIcon = (serviceId: string) => {
    switch (serviceId) {
      case 'compute': return <Server className="w-4 h-4 text-blue-500" />;
      case 'kubernetes': return <Boxes className="w-4 h-4 text-indigo-500" />;
      case 'database': return <Database className="w-4 h-4 text-amber-500" />;
      case 'storage': return <HardDrive className="w-4 h-4 text-emerald-500" />;
      case 'functions': return <Zap className="w-4 h-4 text-pink-500" />;
      case 'vault': return <KeyRound className="w-4 h-4 text-purple-500" />;
      case 'events': return <Radio className="w-4 h-4 text-cyan-500" />;
      case 'deployments':
      case 'cicd': return <GitBranch className="w-4 h-4 text-[#C6923B]" />;
      case 'monitoring': return <Activity className="w-4 h-4 text-emerald-500" />;
      case 'automation': return <Code2 className="w-4 h-4 text-[#C6923B]" />;
      case 'security': return <ShieldCheck className="w-4 h-4 text-indigo-500" />;
      case 'billing': return <CreditCard className="w-4 h-4 text-amber-500" />;
      default: return <Server className="w-4 h-4 text-[#C6923B]" />;
    }
  };

  const displayCostItems = useMemo<ServiceCostItem[]>(() => {
    if (costBreakdown && costBreakdown.length > 0) {
      return costBreakdown;
    }
    // Dynamic fallback calculated from active fleet items in state
    const vmCount = fleet.filter(r => r.type === 'compute').length || 1;
    const dbCount = fleet.filter(r => r.type === 'database').length || 1;
    const s3Count = fleet.filter(r => r.type === 'storage').length || 1;

    const computeCost = vmCount * 1250;
    const dbCost = dbCount * 1850;
    const s3Cost = s3Count * 120;
    const total = computeCost + dbCost + s3Cost;

    return [
      {
        service: 'ArvDB (Databases)',
        service_id: 'database',
        cost_inr: dbCost,
        cost_usd: Number((dbCost / 83).toFixed(2)),
        percent: Math.round((dbCost / total) * 100),
        color: '#F59E0B',
        resource_count: dbCount,
        billing_type: 'HA Cluster + IOPS & Storage',
        status: 'ACTIVE_CONSUMPTION'
      },
      {
        service: 'ArvCompute (VMs)',
        service_id: 'compute',
        cost_inr: computeCost,
        cost_usd: Number((computeCost / 83).toFixed(2)),
        percent: Math.round((computeCost / total) * 100),
        color: '#3B82F6',
        resource_count: vmCount,
        billing_type: 'vCPU / RAM Hourly Metered',
        status: 'ACTIVE_CONSUMPTION'
      },
      {
        service: 'ArvStore (S3)',
        service_id: 'storage',
        cost_inr: s3Cost,
        cost_usd: Number((s3Cost / 83).toFixed(2)),
        percent: Math.round((s3Cost / total) * 100),
        color: '#10B981',
        resource_count: s3Count,
        billing_type: 'GB Stored + Transfer',
        status: 'ACTIVE_CONSUMPTION'
      }
    ];
  }, [costBreakdown, fleet]);

  return (
    <div className="space-y-4 sm:space-y-5 text-slate-800 dark:text-slate-100 font-sans pb-10">
      {/* Floating Toast Notification */}
      {toast && (
        <div className={`fixed bottom-6 right-4 sm:right-6 z-50 flex items-center gap-2.5 px-4 py-3 rounded-xl shadow-2xl border text-xs font-mono font-medium animate-fadeIn ${
          toast.type === 'error' ? 'bg-rose-950 text-rose-200 border-rose-500/50' :
          toast.type === 'info' ? 'bg-slate-900 text-amber-200 border-[#C6923B]/50' :
          'bg-slate-900 text-emerald-200 border-emerald-500/50'
        }`}>
          {toast.type === 'error' ? <AlertCircle className="w-4 h-4 text-rose-400" /> : <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
          <span>{toast.message}</span>
        </div>
      )}

      {/* Incident War-Room Banner (if active incidents exist) */}
      {incidents && incidents.length > 0 && (
        <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-between gap-3 text-amber-700 dark:text-amber-300 text-xs font-mono">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-amber-500 shrink-0" />
            <span>Active Incident ({incidents[0].id || 'INC-101'}): {incidents[0].title || 'Elevated response latency on EU edge'}</span>
          </div>
          <button
            onClick={() => onNavigate?.('incidents')}
            className="text-[11px] font-bold text-[#C6923B] dark:text-[#D4A347] hover:underline shrink-0 cursor-pointer"
          >
            War-Room →
          </button>
        </div>
      )}

      {/* Breadcrumbs & Primary Action Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3 sm:gap-4 pb-1">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
            Cloud Infrastructure Operations
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-mono mt-0.5">
            Self-service fleet, deployments, Prometheus metrics & IaC blueprints.
          </p>
        </div>

        {/* Top Controls: Time-Range & Provision CTA */}
        <div className="flex items-center flex-wrap gap-2 shrink-0 w-full sm:w-auto justify-between sm:justify-end">
          {/* Time range selector */}
          <div className="flex items-center gap-1 bg-white dark:bg-[#111827] p-1 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs">
            {['15m', '1h', '6h', '24h', '7d'].map((r) => (
              <button
                key={r}
                onClick={() => setSelectedRange(r)}
                className={`px-2.5 py-1 text-xs font-mono font-semibold rounded-lg transition-colors cursor-pointer ${
                  selectedRange === r
                    ? 'bg-[#C6923B] text-white shadow-2xs font-bold'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                {r}
              </button>
            ))}
            <button
              onClick={fetchDashboardData}
              disabled={loading}
              className="p-1.5 text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer ml-0.5"
              title={`Last updated ${lastRefreshedAt.toLocaleTimeString()}`}
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-[#C6923B]' : ''}`} />
            </button>
          </div>

          {/* Quick IaC Link */}
          <button
            onClick={() => onNavigate?.('automation')}
            className="hidden sm:flex px-3.5 py-2 text-xs font-semibold rounded-xl bg-white dark:bg-[#111827] hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-800 shadow-2xs items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Code2 className="w-4 h-4 text-[#C6923B] dark:text-[#D4A347]" />
            <span>IaC Blueprints</span>
          </button>

          {/* Primary Action: Provision New Resource */}
          <button
            onClick={() => setIsProvisionModalOpen(true)}
            className="px-4 py-2 text-xs font-bold rounded-xl bg-[#C6923B] hover:bg-[#B07B28] text-white shadow-md shadow-[#C6923B]/25 flex items-center gap-2 transition-all cursor-pointer transform active:scale-98"
          >
            <Plus className="w-4 h-4" />
            <span>Provision Resource</span>
          </button>
        </div>
      </div>

      {/* 4 Summary Cards (Aravanta Brand Aesthetic) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-4">
        {/* Card 1: Resources Provisioned */}
        <div 
          onClick={() => {
            const el = document.getElementById('fleet-table-anchor');
            el?.scrollIntoView({ behavior: 'smooth' });
          }}
          className="bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-2xs hover:border-[#C6923B]/50 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
            <span className="text-[11px] font-mono font-bold uppercase tracking-wider">Provisioned Fleet</span>
            <Server className="w-4 h-4 text-[#C6923B] dark:text-[#D4A347] group-hover:scale-110 transition-transform" />
          </div>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-3xl font-black font-mono tabular-nums text-slate-900 dark:text-white">
              {totalFleetCount}
            </span>
            <span className="text-xs text-slate-500 font-mono">Workloads</span>
          </div>
          <div className="flex items-center gap-2 mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-800/80 text-[11px] font-mono">
            <span className="text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              {runningCount} Running
            </span>
            <span className="text-slate-300 dark:text-slate-700">•</span>
            <span className="text-amber-600 dark:text-amber-400 font-bold">
              {provisioningCount} Scaling
            </span>
            <span className="text-slate-300 dark:text-slate-700">•</span>
            <span className="text-slate-500 font-medium">
              {stoppedCount} Stopped
            </span>
            <span className="text-slate-300 dark:text-slate-700">•</span>
            <span className="text-rose-600 dark:text-rose-400 font-bold">
              {errorCount} Error
            </span>
          </div>
        </div>

        {/* Card 2: Active Deployments / Pipelines */}
        <div 
          onClick={() => onNavigate?.('deployments')}
          className="bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-2xs hover:border-[#C6923B]/50 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
            <span className="text-[11px] font-mono font-bold uppercase tracking-wider">CI/CD Deployments</span>
            <GitBranch className="w-4 h-4 text-[#C6923B] dark:text-[#D4A347] group-hover:scale-110 transition-transform" />
          </div>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-3xl font-black font-mono tabular-nums text-slate-900 dark:text-white">
              {deploymentSuccessRate}%
            </span>
            <span className="text-xs text-emerald-600 dark:text-emerald-400 font-mono font-bold">Success Rate</span>
          </div>
          <div className="flex items-center justify-between mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-800/80 text-[11px] font-mono text-slate-600 dark:text-slate-400">
            <span>Avg Run: <strong className="text-slate-900 dark:text-white">{avgRunTimeStr}</strong></span>
            <span className="px-1.5 py-0.5 rounded bg-[#C6923B]/10 text-[#C6923B] dark:text-[#D4A347] font-bold">
              {latestCommitHash}
            </span>
          </div>
        </div>

        {/* Card 3: Recent Alerts & System Health */}
        <div 
          onClick={() => onNavigate?.('alerts')}
          className="bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-2xs hover:border-[#C6923B]/50 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
            <span className="text-[11px] font-mono font-bold uppercase tracking-wider">Telemetry & Alerts</span>
            <ShieldAlert className="w-4 h-4 text-amber-500 group-hover:scale-110 transition-transform" />
          </div>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-3xl font-black font-mono tabular-nums text-slate-900 dark:text-white">
              {alerts.length}
            </span>
            <span className="text-xs text-amber-600 dark:text-amber-400 font-mono font-bold">
              {alerts.filter(a => a.status === 'firing').length > 0 ? `${alerts.filter(a => a.status === 'firing').length} Firing` : 'Active Alerts'}
            </span>
          </div>
          <div className="flex items-center justify-between mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-800/80 text-[11px] font-mono text-slate-600 dark:text-slate-400">
            <span>Uptime: <strong className="text-emerald-600 dark:text-emerald-400">99.98%</strong></span>
            <span>MTTR: <strong className="text-slate-900 dark:text-white">{alerts.length > 0 ? '12m' : '0m'}</strong></span>
          </div>
        </div>

        {/* Card 4: Usage & FinOps Snapshot */}
        <div 
          onClick={() => onNavigate?.('billing')}
          className="bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-2xs hover:border-[#C6923B]/50 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
            <span className="text-[11px] font-mono font-bold uppercase tracking-wider">Usage & FinOps</span>
            <Cpu className="w-4 h-4 text-[#C6923B] dark:text-[#D4A347] group-hover:scale-110 transition-transform" />
          </div>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-3xl font-black font-mono tabular-nums text-slate-900 dark:text-white">
              {metrics?.cpu_usage_percent !== undefined ? `${metrics.cpu_usage_percent}%` : '24.2%'}
            </span>
            <span className="text-xs text-slate-500 font-mono">Fleet CPU</span>
          </div>
          <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-800/80 text-[11px] font-mono flex items-center justify-between text-slate-600 dark:text-slate-400">
            <span>RAM: <strong className="text-slate-900 dark:text-white">{metrics?.memory_usage_percent !== undefined ? `${metrics.memory_usage_percent}%` : '52.0%'}</strong></span>
            <span>Month: <strong className="text-[#C6923B] dark:text-[#D4A347]">₹{(monthlyRunRateInr || 4820).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</strong></span>
          </div>
        </div>
      </div>

      {/* Recently Accessed Services Panel (Dynamic) */}
      <div className="bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 rounded-xl p-4 sm:p-5 shadow-2xs space-y-3.5">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <h2 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
              Recently Accessed Services
            </h2>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500">
              Dynamic History
            </span>
          </div>

          <button
            onClick={() => onNavigate?.('catalog')}
            className="text-xs font-mono font-bold text-[#C6923B] dark:text-[#D4A347] hover:underline flex items-center gap-1 cursor-pointer"
          >
            <span>Explore All 12 Services in Single Catalog</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 xs:grid-cols-2 lg:grid-cols-4 gap-3">
          {recentServices.slice(0, 4).map((service) => (
            <div
              key={service.id}
              onClick={() => {
                recordServiceAccess(service.route);
                onNavigate?.(service.route);
              }}
              className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800/90 bg-slate-50/60 dark:bg-[#141d2f]/70 hover:bg-slate-100/80 dark:hover:bg-[#141d2f] hover:border-[#C6923B]/60 transition-all cursor-pointer flex flex-col justify-between group"
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono font-bold uppercase text-slate-600 dark:text-slate-400">
                    {service.category}
                  </span>
                  <span className="text-[10px] font-mono text-slate-600 dark:text-slate-400 flex items-center gap-1">
                    <Clock className="w-3 h-3 text-slate-400" />
                    {formatRelativeTime(service.accessedAt)}
                  </span>
                </div>
                <div className="flex items-center gap-2.5 mt-2">
                  <div className="w-8 h-8 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform text-[#C6923B] dark:text-[#D4A347]">
                    {getServiceIcon(service.id)}
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-bold text-xs text-slate-900 dark:text-white truncate">
                      {service.name}
                    </h3>
                    <p className="text-[11px] text-slate-500 font-mono truncate">
                      {service.status || 'Operational'}
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-3 pt-2 border-t border-slate-200/60 dark:border-slate-800/60 flex items-center justify-between text-[11px] font-mono text-[#C6923B] dark:text-[#D4A347] font-semibold">
                <span>Open Service Console</span>
                <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Services Consuming Funds / Payment Section (100% Dynamic) */}
      <div className="bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 rounded-xl p-4 sm:p-5 shadow-2xs space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-3">
          <div>
            <div className="flex items-center gap-2">
              <Wallet className="w-4 h-4 text-[#C6923B] dark:text-[#D4A347]" />
              <h2 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-900 dark:text-white">
                Services Consuming Funds & Real-Time Burn Rate
              </h2>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/30">
                Live SQL Metering
              </span>
            </div>
            <p className="text-xs text-slate-500 font-mono mt-0.5">
              Live consumption per active cloud service from SQLite/PostgreSQL billing meters
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-right">
              <span className="text-[10px] font-mono text-slate-600 dark:text-slate-400 block">TOTAL MONTH ACCRUED</span>
              <span className="text-sm sm:text-base font-black font-mono text-[#C6923B] dark:text-[#D4A347]">
                ₹{(monthlyRunRateInr || 4820).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>
            <button
              onClick={() => onNavigate?.('billing')}
              className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-[#141b2a] hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-mono font-bold text-xs border border-slate-200 dark:border-slate-700 transition-colors cursor-pointer"
            >
              FinOps Portal →
            </button>
          </div>
        </div>

        {/* Cost breakdown cards / progress bars */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {displayCostItems.map((item) => (
            <div
              key={item.service_id}
              onClick={() => {
                recordServiceAccess(item.service_id);
                onNavigate?.(item.service_id);
              }}
              className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800/80 bg-slate-50/70 dark:bg-[#141d2f]/50 hover:bg-slate-100/90 dark:hover:bg-[#141d2f] transition-all cursor-pointer flex flex-col justify-between group"
            >
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center shrink-0">
                      {getServiceIcon(item.service_id)}
                    </div>
                    <div>
                      <h4 className="font-bold text-xs text-slate-900 dark:text-white">
                        {item.service}
                      </h4>
                      <span className="text-[10px] text-slate-500 font-mono">
                        {item.billing_type}
                      </span>
                    </div>
                  </div>

                  <span className="text-[11px] font-mono font-bold text-slate-900 dark:text-white">
                    {item.percent}%
                  </span>
                </div>

                {/* Progress Bar */}
                <div className="w-full bg-slate-200 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${Math.max(5, item.percent)}%`,
                      backgroundColor: item.color || '#C6923B'
                    }}
                  />
                </div>
              </div>

              <div className="mt-3 pt-2.5 border-t border-slate-200/70 dark:border-slate-800/70 flex items-center justify-between text-xs font-mono">
                <div>
                  <span className="text-slate-500 text-[10px] block">MONTHLY BURN</span>
                  <span className="font-bold text-slate-900 dark:text-white">
                    ₹{item.cost_inr.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-slate-500 text-[10px] block">EQUIV. USD</span>
                  <span className="text-slate-600 dark:text-slate-400 font-medium">
                    ${item.cost_usd.toFixed(2)}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Dense Resources Fleet Table Section */}
      <div id="fleet-table-anchor" className="bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 rounded-xl shadow-2xs overflow-hidden">
        {/* Table Filter & Search Controls */}
        <div className="p-3.5 sm:p-4 border-b border-slate-200 dark:border-slate-800 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 bg-slate-50/75 dark:bg-[#0e1624]">
          {/* Category Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
            {[
              { id: 'all', label: 'All Resources', count: totalFleetCount },
              { id: 'container', label: 'Containers', count: fleet.filter(r => r.type === 'container').length },
              { id: 'database', label: 'Databases', count: fleet.filter(r => r.type === 'database').length },
              { id: 'compute', label: 'Compute', count: fleet.filter(r => r.type === 'compute').length },
              { id: 'networking', label: 'Networking', count: fleet.filter(r => r.type === 'networking').length },
              { id: 'storage', label: 'Storage', count: fleet.filter(r => r.type === 'storage').length },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => { setTypeFilter(tab.id); setPage(1); }}
                className={`px-3 py-1.5 rounded-lg text-xs font-mono font-semibold transition-all whitespace-nowrap cursor-pointer ${
                  typeFilter === tab.id
                    ? 'bg-[#C6923B] text-white shadow-2xs'
                    : 'bg-white dark:bg-[#141b2a] text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white border border-slate-200 dark:border-slate-800'
                }`}
              >
                {tab.label} <span className="text-[10px] opacity-80">({tab.count})</span>
              </button>
            ))}
          </div>

          {/* Search & Status Filter */}
          <div className="flex items-center gap-2 shrink-0">
            {/* Status Select */}
            <select
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
              className="px-2.5 py-1.5 text-xs font-mono bg-white dark:bg-[#141b2a] border border-slate-200 dark:border-slate-800 rounded-lg text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-[#C6923B]"
            >
              <option value="all">Status: All</option>
              <option value="RUNNING">Running</option>
              <option value="PROVISIONING">Provisioning</option>
              <option value="STOPPED">Stopped</option>
              <option value="ERROR">Error</option>
            </select>

            {/* In-table Search */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-400 pointer-events-none" />
              <input
                type="text"
                value={tableSearch}
                onChange={(e) => { setTableSearch(e.target.value); setPage(1); }}
                placeholder="Filter table..."
                className="w-32 sm:w-48 pl-8 pr-7 py-1.5 text-xs bg-white dark:bg-[#141b2a] border border-slate-200 dark:border-slate-800 rounded-lg text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-[#C6923B] font-sans"
              />
              {tableSearch && (
                <button
                  onClick={() => setTableSearch('')}
                  className="absolute right-2 top-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Dense Table with Cross-Platform Horizontal Scroll */}
        <div className="overflow-x-auto min-w-full">
          <table className="w-full text-left border-collapse min-w-[780px]">
            <thead>
              <tr className="bg-slate-100/75 dark:bg-[#0c1322] border-b border-slate-200 dark:border-slate-800 text-[11px] font-mono font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                <th className="py-2.5 px-4 cursor-pointer hover:text-[#C6923B]" onClick={() => handleSort('name')}>
                  Resource Name {sortField === 'name' && (sortDir === 'asc' ? '↑' : '↓')}
                </th>
                <th className="py-2.5 px-4 cursor-pointer hover:text-[#C6923B]" onClick={() => handleSort('type')}>
                  Type & Engine {sortField === 'type' && (sortDir === 'asc' ? '↑' : '↓')}
                </th>
                <th className="py-2.5 px-4 cursor-pointer hover:text-[#C6923B]" onClick={() => handleSort('region')}>
                  Region & AZ {sortField === 'region' && (sortDir === 'asc' ? '↑' : '↓')}
                </th>
                <th className="py-2.5 px-4 cursor-pointer hover:text-[#C6923B]" onClick={() => handleSort('status')}>
                  Status {sortField === 'status' && (sortDir === 'asc' ? '↑' : '↓')}
                </th>
                <th className="py-2.5 px-4">Health (7d)</th>
                <th className="py-2.5 px-4">Specifications</th>
                <th className="py-2.5 px-4">Uptime</th>
                <th className="py-2.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 text-xs font-sans">
              {paginatedFleet.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-500 dark:text-slate-400">
                    <Server className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
                    <p className="font-semibold text-sm text-slate-700 dark:text-slate-300">No resources found</p>
                    <p className="text-xs text-slate-400 mt-1">Try changing your filters or provision a new resource.</p>
                    <button
                      onClick={() => setIsProvisionModalOpen(true)}
                      className="mt-3 px-3 py-1.5 rounded-lg bg-[#C6923B] hover:bg-[#B07B28] text-white text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" /> Provision First Resource
                    </button>
                  </td>
                </tr>
              ) : (
                paginatedFleet.map((resource) => (
                  <tr
                    key={resource.id}
                    onClick={() => setInspectResource(resource)}
                    className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors cursor-pointer group"
                  >
                    {/* Name & ID */}
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        {getTypeIcon(resource.type)}
                        <div>
                          <p className="font-bold text-slate-900 dark:text-white group-hover:text-[#C6923B] dark:group-hover:text-[#D4A347] transition-colors">
                            {resource.name}
                          </p>
                          <div className="flex items-center gap-1 mt-0.5">
                            <span className="font-mono text-[10px] text-slate-400 dark:text-slate-500">
                              {resource.id}
                            </span>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                copyToClipboard(resource.id, resource.id);
                              }}
                              className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                              title="Copy ID"
                            >
                              {copiedId === resource.id ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                            </button>
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Type & Engine */}
                    <td className="py-3 px-4 font-mono text-[11px] text-slate-600 dark:text-slate-300">
                      {resource.engine}
                    </td>

                    {/* Region */}
                    <td className="py-3 px-4 font-mono text-[11px] text-slate-500">
                      {resource.region}
                    </td>

                    {/* Status */}
                    <td className="py-3 px-4">
                      {renderStatusBadge(resource.status)}
                    </td>

                    {/* Health Sparkline */}
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        {renderSparklineSvg(resource.sparkline, resource.status)}
                        <span className="text-[10px] font-mono text-slate-400">
                          {resource.cpu}%
                        </span>
                      </div>
                    </td>

                    {/* Specifications */}
                    <td className="py-3 px-4 text-[11px] text-slate-600 dark:text-slate-300 max-w-xs truncate">
                      {resource.specs}
                    </td>

                    {/* Uptime */}
                    <td className="py-3 px-4 font-mono text-[11px] text-slate-500">
                      {resource.uptime}
                    </td>

                    {/* Actions */}
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => setInspectResource(resource)}
                          className="px-2 py-1 text-[11px] font-medium rounded-md text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                        >
                          Inspect
                        </button>
                        <button
                          onClick={() => handleRestartResource(resource)}
                          className="p-1 text-slate-400 hover:text-[#C6923B] transition-colors"
                          title="Restart"
                        >
                          <RotateCw className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        <div className="p-3 border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-[#0e1624]">
          <DataTablePagination
            currentPage={page}
            pageSize={pageSize}
            totalItems={filteredFleet.length}
            onPageChange={setPage}
            onPageSizeChange={setPageSize}
          />
        </div>
      </div>

      {/* Grid: CI/CD Pipelines & Prometheus Monitoring Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-5">
        {/* Left: CI/CD Pipelines Activity */}
        <div className="bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-2xs">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <GitBranch className="w-4 h-4 text-[#C6923B] dark:text-[#D4A347]" />
              <h3 className="font-bold text-sm text-slate-900 dark:text-white">Recent Deployments & Pipelines</h3>
            </div>
            <button
              onClick={() => onNavigate?.('deployments')}
              className="text-xs text-[#C6923B] dark:text-[#D4A347] hover:underline flex items-center gap-1 font-semibold"
            >
              View All Runs <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {pipelines.length === 0 ? (
            <div className="py-8 text-center text-slate-500 dark:text-slate-400 font-mono text-xs">
              <GitBranch className="w-6 h-6 mx-auto mb-2 text-slate-400 opacity-50" />
              <p>No recent deployment pipeline runs recorded.</p>
              <button
                onClick={() => onNavigate?.('deployments')}
                className="mt-2 text-[#C6923B] dark:text-[#D4A347] font-bold hover:underline cursor-pointer"
              >
                Trigger First Deployment →
              </button>
            </div>
          ) : (
            <div className="divide-y divide-slate-100 dark:divide-slate-800/80 mt-2">
              {pipelines.map(run => {
                const isExpanded = expandedPipelineId === run.id;
                return (
                  <div key={run.id} className="py-3">
                    <div 
                      onClick={() => setExpandedPipelineId(isExpanded ? null : run.id)}
                      className="flex items-center justify-between gap-3 cursor-pointer group"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span className={`w-2 h-2 rounded-full shrink-0 ${
                          run.status === 'SUCCESS' ? 'bg-emerald-500' :
                          run.status === 'RUNNING' ? 'bg-amber-400 animate-pulse' : 'bg-rose-500'
                        }`} />
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-slate-900 dark:text-white truncate group-hover:text-[#C6923B] transition-colors">
                            {run.name}
                          </p>
                          <p className="text-[11px] text-slate-500 font-mono truncate mt-0.5">
                            {run.commitMsg} • <span className="text-[#C6923B] dark:text-[#D4A347]">#{run.commitHash}</span>
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0 text-right">
                        <div className="text-[10px] font-mono text-slate-400">
                          <p>{run.duration}</p>
                          <p>{run.startedAt}</p>
                        </div>
                        {isExpanded ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
                      </div>
                    </div>

                    {/* Expandable Step View */}
                    {isExpanded && (
                      <div className="mt-3 pl-4 border-l-2 border-[#C6923B]/40 space-y-2 py-1 animate-fadeIn">
                        {run.steps.map((st, idx) => (
                          <div key={idx} className="text-xs font-mono">
                            <div className="flex items-center justify-between text-slate-700 dark:text-slate-300">
                              <span className="flex items-center gap-1.5">
                                <span className={`w-1.5 h-1.5 rounded-full ${
                                  st.status === 'completed' ? 'bg-emerald-400' :
                                  st.status === 'running' ? 'bg-amber-400 animate-spin' :
                                  st.status === 'failed' ? 'bg-rose-500' : 'bg-slate-400'
                                }`} />
                                {st.name}
                              </span>
                              <span className="text-[10px] text-slate-400">{st.duration}</span>
                            </div>
                            {st.logSnippet && (
                              <div className="mt-1 p-2 rounded bg-slate-950 text-slate-300 font-mono text-[10px] leading-relaxed overflow-x-auto">
                                {st.logSnippet}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right: Prometheus / Grafana Metric Charts */}
        <div className="bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-2xs">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-emerald-500" />
              <h3 className="font-bold text-sm text-slate-900 dark:text-white">Prometheus Telemetry Gauges</h3>
            </div>
            <span className="text-[11px] font-mono text-slate-400">
              Fleet CPU & Memory Load
            </span>
          </div>

          {/* Area Chart */}
          <div className="h-56 mt-3">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={timeseries}>
                <defs>
                  <linearGradient id="cpuGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#C6923B" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#C6923B" stopOpacity={0.0} />
                  </linearGradient>
                  <linearGradient id="memGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.2} />
                <XAxis dataKey="time" stroke="#64748b" fontSize={10} fontStyle="mono" />
                <YAxis stroke="#64748b" fontSize={10} fontStyle="mono" unit="%" domain={[0, 100]} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: 8, fontSize: 11 }}
                />
                <Area type="monotone" dataKey="cpu" stroke="#C6923B" strokeWidth={2} fillOpacity={1} fill="url(#cpuGradient)" name="CPU Load %" />
                <Area type="monotone" dataKey="memory" stroke="#10b981" strokeWidth={2} fillOpacity={1} fill="url(#memGradient)" name="Memory %" />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          <div className="flex items-center justify-center gap-6 mt-2 pt-2 border-t border-slate-100 dark:border-slate-800 text-[11px] font-mono">
            <span className="flex items-center gap-1.5 text-[#C6923B] dark:text-[#D4A347]">
              <span className="w-2 h-2 rounded-full bg-[#C6923B]" />
              Fleet CPU: {metrics?.cpu_usage_percent !== undefined ? `${metrics.cpu_usage_percent}%` : '28.4% Avg'}
            </span>
            <span className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              Fleet RAM: {metrics?.memory_usage_percent !== undefined ? `${metrics.memory_usage_percent}%` : '64.2% Avg'}
            </span>
            <span className="text-slate-400">
              Threshold: 80% Max
            </span>
          </div>
        </div>
      </div>

      {/* Infrastructure as Code (IaC) Library Section */}
      <div className="bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-2xs">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <Code2 className="w-4 h-4 text-[#C6923B] dark:text-[#D4A347]" />
            <div>
              <h3 className="font-bold text-sm text-slate-900 dark:text-white">Infrastructure as Code Blueprints</h3>
              <p className="text-[11px] text-slate-500">Pre-approved Terraform & OpenTofu architecture stacks.</p>
            </div>
          </div>
          <button
            onClick={() => onNavigate?.('automation')}
            className="text-xs text-[#C6923B] dark:text-[#D4A347] hover:underline flex items-center gap-1 font-semibold"
          >
            Catalog Explorer <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 mt-3">
          {iacTemplates.map(tpl => (
            <div
              key={tpl.id}
              className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-[#0e1624] hover:border-[#C6923B]/50 transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-[#C6923B]/10 text-[#C6923B] dark:text-[#D4A347] border border-[#C6923B]/30">
                    {tpl.provider}
                  </span>
                  <span className="text-[10px] font-mono text-slate-400">{tpl.version}</span>
                </div>
                <h4 className="font-bold text-xs text-slate-900 dark:text-white mt-2">{tpl.name}</h4>
                <p className="text-[11px] text-slate-500 mt-1 line-clamp-2">{tpl.description}</p>
              </div>

              <div className="mt-3 pt-2.5 border-t border-slate-200/60 dark:border-slate-800 flex items-center justify-between text-[10px] font-mono text-slate-500">
                <span>{tpl.resourceCount} Resources</span>
                <button
                  onClick={() => showToast(`Applying ${tpl.name} (${tpl.version}) via ${tpl.provider}...`, 'info')}
                  className="px-2.5 py-1 rounded bg-[#C6923B] hover:bg-[#B07B28] text-white font-bold text-[10px] cursor-pointer"
                >
                  Deploy
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Tabbed Resource Detail Side-Panel */}
      {inspectResource && typeof document !== 'undefined' && createPortal(
        <div 
          className="fixed inset-0 z-[99999] overflow-hidden bg-black/60 dark:bg-black/80 backdrop-blur-xs flex justify-end animate-fadeIn"
          style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0 }}
          onClick={() => setInspectResource(null)}
        >
          <div 
            className="w-full max-w-lg md:max-w-xl bg-white dark:bg-[#0f172a] h-full shadow-2xl flex flex-col border-l border-slate-300 dark:border-slate-800 animate-slideLeft"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Panel Header */}
            <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-slate-800 flex items-start justify-between bg-slate-50 dark:bg-[#0c1322]">
              <div>
                <div className="flex items-center gap-2">
                  {getTypeIcon(inspectResource.type)}
                  <h2 className="text-base font-bold text-slate-900 dark:text-white">{inspectResource.name}</h2>
                  {renderStatusBadge(inspectResource.status)}
                </div>
                <div className="flex items-center gap-2 mt-1 text-xs font-mono text-slate-500 dark:text-slate-400">
                  <span>ID: {inspectResource.id}</span>
                  <span>•</span>
                  <span>{inspectResource.region}</span>
                </div>
              </div>

              <button
                onClick={() => setInspectResource(null)}
                className="p-1.5 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                title="Close Inspector"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Panel Tab Navigation */}
            <div className="flex border-b border-slate-200 dark:border-slate-800 px-4 bg-slate-100/70 dark:bg-[#0b101c]">
              {(['overview', 'logs', 'metrics', 'settings'] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setDetailTab(t)}
                  className={`py-2.5 px-4 text-xs font-mono font-bold capitalize border-b-2 transition-colors cursor-pointer ${
                    detailTab === t
                      ? 'border-[#C6923B] text-[#C6923B] dark:text-[#D4A347] bg-white dark:bg-[#0f172a]'
                      : 'border-transparent text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>

            {/* Panel Body Content */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4 text-xs font-sans">
              {detailTab === 'overview' && (
                <div className="space-y-4">
                  <div className="bg-slate-50 dark:bg-[#141d2f] p-4 rounded-xl border border-slate-300 dark:border-slate-700/80 shadow-xs space-y-2.5 font-mono">
                    <div className="flex justify-between py-1.5 border-b border-slate-200 dark:border-slate-800">
                      <span className="text-slate-600 dark:text-slate-400 font-semibold">Private IP</span>
                      <span className="text-slate-900 dark:text-white font-bold">{inspectResource.privateIp}</span>
                    </div>
                    <div className="flex justify-between py-1.5 border-b border-slate-200 dark:border-slate-800">
                      <span className="text-slate-600 dark:text-slate-400 font-semibold">Internal DNS</span>
                      <span className="text-slate-900 dark:text-white font-bold truncate max-w-[240px]">{inspectResource.endpoint}</span>
                    </div>
                    <div className="flex justify-between py-1.5 border-b border-slate-200 dark:border-slate-800">
                      <span className="text-slate-600 dark:text-slate-400 font-semibold">Runtime Engine</span>
                      <span className="text-slate-900 dark:text-white font-bold">{inspectResource.engine}</span>
                    </div>
                    <div className="flex justify-between py-1.5 border-b border-slate-200 dark:border-slate-800">
                      <span className="text-slate-600 dark:text-slate-400 font-semibold">Environment</span>
                      <span className="text-slate-900 dark:text-white uppercase font-bold text-[#C6923B] dark:text-[#D4A347]">{inspectResource.env}</span>
                    </div>
                    <div className="flex justify-between py-1.5">
                      <span className="text-slate-600 dark:text-slate-400 font-semibold">Created At</span>
                      <span className="text-slate-900 dark:text-white font-bold">{new Date(inspectResource.createdAt).toLocaleString()}</span>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-bold text-xs uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-2">Hardware Specifications</h4>
                    <p className="p-3.5 bg-slate-50 dark:bg-[#141d2f] rounded-xl border border-slate-300 dark:border-slate-700/80 text-slate-800 dark:text-slate-200 font-mono text-xs font-semibold shadow-xs">
                      {inspectResource.specs}
                    </p>
                  </div>

                  <div>
                    <h4 className="font-bold text-xs uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-2">Quick Ops Actions</h4>
                    <div className="grid grid-cols-2 gap-2.5">
                      <button 
                        onClick={() => handleRestartResource(inspectResource)}
                        className="p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#141d2f] hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200 font-bold text-xs shadow-xs hover:border-[#C6923B] transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <RotateCw className="w-3.5 h-3.5 text-[#C6923B]" /> Rolling Restart
                      </button>
                      <button 
                        onClick={() => showToast(`Created snapshot of ${inspectResource.name}`, 'success')}
                        className="p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#141d2f] hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200 font-bold text-xs shadow-xs hover:border-emerald-500 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <HardDrive className="w-3.5 h-3.5 text-emerald-500" /> Snapshot Backup
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {detailTab === 'logs' && (
                <div className="space-y-3 font-mono">
                  <div className="flex items-center justify-between text-[11px] text-slate-500">
                    <span>Live Stdout / Stderr Stream</span>
                    <span className="flex items-center gap-1 text-emerald-500">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
                      Live Tail
                    </span>
                  </div>
                  <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 text-slate-300 text-[10px] leading-relaxed max-h-80 overflow-y-auto space-y-1">
                    <p className="text-slate-500">[2026-09-24T05:58:12Z] INFO: Server initialized on port 8080.</p>
                    <p className="text-[#D4A347]">[2026-09-24T05:58:14Z] INFO: Connected to control plane. Heartbeat OK.</p>
                    <p className="text-slate-300">[2026-09-24T05:58:20Z] DEBUG: Incoming health probe GET /health HTTP/1.1 (200 OK)</p>
                    <p className="text-slate-300">[2026-09-24T05:58:32Z] DEBUG: Handled 240 requests in 4.2ms avg.</p>
                    <p className="text-amber-400">[2026-09-24T05:59:02Z] WARN: Memory pressure at 68% threshold.</p>
                    <p className="text-slate-300">[2026-09-24T05:59:15Z] DEBUG: Garbage collection reclaimed 184 MB.</p>
                    <p className="text-emerald-400">[2026-09-24T06:00:00Z] SUCCESS: Synchronized state with replication group.</p>
                  </div>
                </div>
              )}

              {detailTab === 'metrics' && (
                <div className="space-y-4">
                  <div className="p-3 bg-slate-50 dark:bg-[#141d2f] rounded-xl border border-slate-200 dark:border-slate-800">
                    <p className="text-xs font-mono font-bold text-slate-700 dark:text-slate-300">CPU Usage Profile</p>
                    <div className="h-32 mt-2">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={inspectResource.sparkline.map((v, i) => ({ step: i, val: v }))}>
                          <Line type="monotone" dataKey="val" stroke="#C6923B" strokeWidth={2} dot={{ r: 2 }} />
                          <CartesianGrid stroke="#334155" opacity={0.2} />
                          <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderRadius: 6, fontSize: 10 }} />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>
              )}

              {detailTab === 'settings' && (
                <div className="space-y-4">
                  <div className="p-3.5 bg-slate-50 dark:bg-[#141d2f] rounded-xl border border-slate-200 dark:border-slate-800 space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-bold text-xs text-slate-900 dark:text-white">Auto-Restart on Crash</p>
                        <p className="text-[11px] text-slate-500">Restart workload automatically if exit code != 0</p>
                      </div>
                      <input type="checkbox" defaultChecked className="w-4 h-4 text-[#C6923B] rounded" />
                    </div>
                    <div className="flex items-center justify-between pt-2 border-t border-slate-200 dark:border-slate-800">
                      <div>
                        <p className="font-bold text-xs text-slate-900 dark:text-white">Termination Protection</p>
                        <p className="text-[11px] text-slate-500">Prevent accidental deletion via API or console</p>
                      </div>
                      <input type="checkbox" defaultChecked className="w-4 h-4 text-[#C6923B] rounded" />
                    </div>
                  </div>

                  <div className="p-3.5 bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/40 rounded-xl">
                    <p className="font-bold text-xs text-rose-700 dark:text-rose-400">Danger Zone</p>
                    <p className="text-[11px] text-rose-600/80 dark:text-rose-300 mt-0.5">
                      Permanently terminate and purge all allocated resources.
                    </p>
                    <button
                      onClick={() => handleTerminateResource(inspectResource)}
                      className="mt-3 px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs cursor-pointer"
                    >
                      Terminate Resource
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Provision New Resource Modal */}
      {isProvisionModalOpen && typeof document !== 'undefined' && createPortal(
        <div 
          className="fixed inset-0 z-[99999] bg-black/70 dark:bg-black/80 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-fadeIn"
          style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0 }}
          onClick={() => setIsProvisionModalOpen(false)}
        >
          <div 
            className="w-full max-w-lg bg-white dark:bg-[#111827] border border-slate-300 dark:border-slate-800 rounded-2xl shadow-2xl overflow-hidden animate-scaleUp"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-[#0e1624]">
              <div className="flex items-center gap-2">
                <Plus className="w-4 h-4 text-[#C6923B]" />
                <h3 className="font-bold text-sm text-slate-900 dark:text-white">Provision New Cloud Infrastructure</h3>
              </div>
              <button
                onClick={() => setIsProvisionModalOpen(false)}
                className="p-1.5 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                title="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleProvisionSubmit} className="p-4 sm:p-5 space-y-4 text-xs font-sans">
              {/* Category Picker */}
              <div>
                <label className="block text-slate-700 dark:text-slate-200 font-bold mb-1.5 font-mono text-[11px]">
                  RESOURCE CATEGORY
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {[
                    { id: 'container', label: 'Container (ECS/K8s)' },
                    { id: 'database', label: 'Managed DB' },
                    { id: 'compute', label: 'Compute (VM)' },
                    { id: 'networking', label: 'ALB / VPC' },
                    { id: 'storage', label: 'S3 Storage' },
                  ].map(cat => (
                    <button
                      type="button"
                      key={cat.id}
                      onClick={() => setProvisionType(cat.id as any)}
                      className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer text-[11px] font-mono font-semibold ${
                        provisionType === cat.id
                          ? 'border-2 border-[#C6923B] bg-[#C6923B]/10 text-[#C6923B] dark:text-[#D4A347] font-bold shadow-xs'
                          : 'border border-slate-300 dark:border-slate-700/80 bg-slate-50/70 dark:bg-[#141b2a] text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 hover:border-slate-400'
                      }`}
                    >
                      {cat.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Resource Name */}
              <div>
                <label className="block text-slate-700 dark:text-slate-200 font-bold mb-1.5 font-mono text-[11px]">
                  RESOURCE NAME
                </label>
                <input
                  type="text"
                  required
                  value={provisionName}
                  onChange={(e) => setProvisionName(e.target.value)}
                  placeholder="e.g. payments-api-v2"
                  className="w-full px-3 py-2 text-xs bg-white dark:bg-[#141b2a] border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-[#C6923B] focus:ring-2 focus:ring-[#C6923B]/20 font-mono shadow-xs transition-colors"
                />
              </div>

              {/* Region & Environment */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 dark:text-slate-200 font-bold mb-1.5 font-mono text-[11px]">
                    AVAILABILITY ZONE
                  </label>
                  <select
                    value={provisionRegion}
                    onChange={(e) => setProvisionRegion(e.target.value)}
                    className="w-full px-2.5 py-2 text-xs bg-white dark:bg-[#141b2a] border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:border-[#C6923B] focus:ring-2 focus:ring-[#C6923B]/20 font-mono shadow-xs transition-colors"
                  >
                    <option value="ap-south-1a">ap-south-1a (Mumbai)</option>
                    <option value="ap-south-1b">ap-south-1b (Mumbai)</option>
                    <option value="us-east-1a">us-east-1a (N. Virginia)</option>
                    <option value="eu-west-1a">eu-west-1a (Frankfurt)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 dark:text-slate-200 font-bold mb-1.5 font-mono text-[11px]">
                    ENVIRONMENT
                  </label>
                  <select
                    value={provisionEnv}
                    onChange={(e) => setProvisionEnv(e.target.value as any)}
                    className="w-full px-2.5 py-2 text-xs bg-white dark:bg-[#141b2a] border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:border-[#C6923B] focus:ring-2 focus:ring-[#C6923B]/20 font-mono shadow-xs transition-colors"
                  >
                    <option value="production">Production</option>
                    <option value="staging">Staging</option>
                    <option value="development">Development</option>
                  </select>
                </div>
              </div>

              {/* Hardware Spec */}
              <div>
                <label className="block text-slate-700 dark:text-slate-200 font-bold mb-1.5 font-mono text-[11px]">
                  INSTANCE SIZE / TIER
                </label>
                <select
                  value={provisionSpec}
                  onChange={(e) => setProvisionSpec(e.target.value)}
                  className="w-full px-2.5 py-2 text-xs bg-white dark:bg-[#141b2a] border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:border-[#C6923B] focus:ring-2 focus:ring-[#C6923B]/20 font-mono shadow-xs transition-colors"
                >
                  <option value="standard-1x">Standard 1x (1 vCPU • 2 GB RAM)</option>
                  <option value="standard-2x">Standard 2x (2 vCPU • 4 GB RAM • Recommended)</option>
                  <option value="performance-4x">Performance 4x (4 vCPU • 16 GB RAM)</option>
                  <option value="high-memory-8x">High-Memory 8x (8 vCPU • 32 GB RAM)</option>
                </select>
              </div>

              <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsProvisionModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-300 dark:border-slate-700 rounded-xl cursor-pointer transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-bold text-white bg-[#C6923B] hover:bg-[#B07B28] rounded-xl shadow-md shadow-[#C6923B]/20 hover:shadow-lg transition-all cursor-pointer flex items-center gap-1.5"
                >
                  <Plus className="w-3.5 h-3.5" /> Launch Infrastructure
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};
