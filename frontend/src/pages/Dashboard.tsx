import React, { useState, useEffect, useCallback, useMemo } from 'react';
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
  CheckCircle2
} from 'lucide-react';
import { apiFetch } from '../config/api';
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
  const [expandedPipelineId, setExpandedPipelineId] = useState<string | null>('pipe-204');

  // Initial fleet state
  const [fleet, setFleet] = useState<ResourceItem[]>([
    {
      id: 'arv-svc-auth-01',
      name: 'auth-gateway-cluster',
      type: 'container',
      engine: 'Docker / Node.js 20',
      region: 'ap-south-1a',
      env: 'production',
      status: 'RUNNING',
      cpu: 18,
      memoryMb: 1024,
      specs: '3 Replicas • 2 vCPU • 4 GB',
      uptime: '99.99% • 14d 6h',
      createdAt: '2026-09-10T08:00:00Z',
      privateIp: '10.0.1.14',
      endpoint: 'auth.internal.aravanta.net',
      sparkline: [12, 14, 18, 15, 22, 19, 18]
    },
    {
      id: 'arv-db-pg-core',
      name: 'production-postgres-primary',
      type: 'database',
      engine: 'PostgreSQL 16.2',
      region: 'ap-south-1a',
      env: 'production',
      status: 'RUNNING',
      cpu: 34,
      memoryMb: 8192,
      specs: 'db.m6g.xlarge • 4 vCPU • 16 GB • 250 GB NVMe',
      uptime: '99.98% • 28d 12h',
      createdAt: '2026-08-27T04:30:00Z',
      privateIp: '10.0.4.88',
      endpoint: 'postgres-primary.db.aravanta.internal:5432',
      sparkline: [28, 32, 45, 38, 35, 42, 34]
    },
    {
      id: 'arv-cache-redis',
      name: 'session-cache-redis',
      type: 'database',
      engine: 'Redis 7.2 Cluster',
      region: 'ap-south-1b',
      env: 'production',
      status: 'RUNNING',
      cpu: 42,
      memoryMb: 4096,
      specs: 'cache.r6g.large • 2 vCPU • 8 GB',
      uptime: '99.99% • 19d 3h',
      createdAt: '2026-09-05T12:00:00Z',
      privateIp: '10.0.4.92',
      endpoint: 'redis.cache.aravanta.internal:6379',
      sparkline: [35, 40, 52, 60, 58, 45, 42]
    },
    {
      id: 'arv-vm-worker-01',
      name: 'async-task-worker-pool',
      type: 'compute',
      engine: 'ArvCompute (Ubuntu 22.04 LTS)',
      region: 'ap-south-1a',
      env: 'production',
      status: 'RUNNING',
      cpu: 65,
      memoryMb: 16384,
      specs: 'c6g.2xlarge • 8 vCPU • 16 GB • 100 GB SSD',
      uptime: '99.95% • 8d 4h',
      createdAt: '2026-09-16T15:20:00Z',
      privateIp: '10.0.2.10',
      endpoint: 'worker-01.ap-south-1.compute.aravanta.internal',
      sparkline: [40, 55, 72, 68, 62, 70, 65]
    },
    {
      id: 'arv-lb-alb-external',
      name: 'public-alb-ingress',
      type: 'networking',
      engine: 'Application Load Balancer L7',
      region: 'ap-south-1 (Multi-AZ)',
      env: 'production',
      status: 'RUNNING',
      cpu: 12,
      memoryMb: 2048,
      specs: 'TLS 1.3 Term • 4 Target Groups • 12,400 req/s',
      uptime: '100.0% • 45d',
      createdAt: '2026-08-10T02:00:00Z',
      privateIp: '10.0.0.5',
      endpoint: 'ingress-alb-1940.ap-south-1.elb.aravanta.net',
      sparkline: [8, 10, 15, 12, 18, 14, 12]
    },
    {
      id: 'arv-s3-artifacts',
      name: 'aravanta-deploy-artifacts',
      type: 'storage',
      engine: 'ArvStore S3 Standard',
      region: 'ap-south-1',
      env: 'production',
      status: 'RUNNING',
      cpu: 5,
      memoryMb: 512,
      specs: '1.4 TB Stored • AES-256 Encrypted • Versioning On',
      uptime: '100.0% • 60d',
      createdAt: '2026-07-26T00:00:00Z',
      privateIp: '—',
      endpoint: 's3://aravanta-deploy-artifacts',
      sparkline: [5, 5, 6, 5, 7, 6, 5]
    },
    {
      id: 'arv-svc-billing-api',
      name: 'billing-metering-engine',
      type: 'container',
      engine: 'Docker / Python 3.12 FastAPI',
      region: 'ap-south-1a',
      env: 'production',
      status: 'RUNNING',
      cpu: 24,
      memoryMb: 2048,
      specs: '2 Replicas • 2 vCPU • 4 GB',
      uptime: '99.99% • 12d 2h',
      createdAt: '2026-09-12T10:15:00Z',
      privateIp: '10.0.1.22',
      endpoint: 'billing.internal.aravanta.net',
      sparkline: [20, 22, 28, 26, 24, 25, 24]
    },
    {
      id: 'arv-vm-staging-sandbox',
      name: 'staging-sandbox-vm',
      type: 'compute',
      engine: 'ArvCompute (Debian 12)',
      region: 'ap-south-1b',
      env: 'staging',
      status: 'PROVISIONING',
      cpu: 8,
      memoryMb: 4096,
      specs: 't4g.medium • 2 vCPU • 4 GB • 40 GB SSD',
      uptime: 'Provisioning... (65%)',
      createdAt: '2026-09-24T05:30:00Z',
      privateIp: '10.1.2.14',
      endpoint: 'sandbox.staging.aravanta.internal',
      sparkline: [0, 0, 5, 8, 8, 8, 8]
    },
    {
      id: 'arv-svc-analytics-etl',
      name: 'clickstream-etl-consumer',
      type: 'container',
      engine: 'Docker / Go 1.22',
      region: 'ap-south-1b',
      env: 'staging',
      status: 'STOPPED',
      cpu: 0,
      memoryMb: 1024,
      specs: '0 Replicas (Paused) • 1 vCPU • 2 GB',
      uptime: 'Stopped 4h ago',
      createdAt: '2026-09-14T09:00:00Z',
      privateIp: '10.1.1.45',
      endpoint: 'etl.staging.aravanta.internal',
      sparkline: [15, 22, 10, 0, 0, 0, 0]
    },
    {
      id: 'arv-fn-thumb-generator',
      name: 'image-thumbnail-faas',
      type: 'container',
      engine: 'ArvFunctions / Node 20',
      region: 'ap-south-1a',
      env: 'production',
      status: 'ERROR',
      cpu: 95,
      memoryMb: 512,
      specs: 'Serverless • Max Concurrency: 50',
      uptime: 'Error: OOM Exit Code 137',
      createdAt: '2026-09-18T14:40:00Z',
      privateIp: '10.0.9.11',
      endpoint: 'fn-thumb.ap-south-1.functions.aravanta.net',
      sparkline: [40, 60, 85, 98, 100, 95, 95]
    }
  ]);

  // Pipelines List
  const pipelines: PipelineRun[] = [
    {
      id: 'pipe-204',
      name: 'billing-metering-engine :: release-prod',
      commitHash: 'fc3e039b',
      commitMsg: 'feat: add payment debit/credit ledger & live invoices',
      branch: 'main',
      status: 'SUCCESS',
      duration: '1m 42s',
      startedAt: '12m ago',
      trigger: 'GitHub Actions Push',
      steps: [
        { name: 'Git Checkout & Lint', status: 'completed', duration: '12s', logSnippet: '✓ Code formatted with ruff & eslint. 0 warnings.' },
        { name: 'Pytest & Vitest Unit Tests', status: 'completed', duration: '34s', logSnippet: '✓ 6 passed in 6.90s. Billing tests verified.' },
        { name: 'Docker Build & Multi-Arch Tag', status: 'completed', duration: '28s', logSnippet: '✓ Pushed image to registry.aravanta.io/billing:v2.4.1' },
        { name: 'Kubernetes Rolling Deployment', status: 'completed', duration: '22s', logSnippet: '✓ 2/2 pods healthy. Zero-downtime traffic cutover complete.' },
        { name: 'SRE Smoke Check & Health Probe', status: 'completed', duration: '6s', logSnippet: '✓ GET /health returned 200 OK (latency: 14ms).' }
      ]
    },
    {
      id: 'pipe-203',
      name: 'auth-gateway-cluster :: docker-canary',
      commitHash: '8a12d910',
      commitMsg: 'fix: jwt refresh rotation race condition',
      branch: 'canary',
      status: 'RUNNING',
      duration: '48s (in progress)',
      startedAt: '2m ago',
      trigger: 'Manual Dispatch by Yash',
      steps: [
        { name: 'Git Checkout & Lint', status: 'completed', duration: '10s' },
        { name: 'Security & Dependency Scan (Trivy)', status: 'completed', duration: '24s', logSnippet: '✓ 0 HIGH/CRITICAL vulnerabilities found.' },
        { name: 'Docker Build & Push', status: 'running', duration: '14s', logSnippet: 'Building layer [4/8]: COPY package.json package-lock.json...' },
        { name: 'Deploy to Canary Target Group', status: 'pending', duration: '—' },
        { name: 'Synthetic Traffic Verification', status: 'pending', duration: '—' }
      ]
    },
    {
      id: 'pipe-202',
      name: 'analytics-etl :: daily-sync',
      commitHash: '7c40e1f9',
      commitMsg: 'refactor: streaming window aggregations',
      branch: 'main',
      status: 'FAILED',
      duration: '2m 10s',
      startedAt: '1h 14m ago',
      trigger: 'Scheduled Cron',
      steps: [
        { name: 'Git Checkout & Dependencies', status: 'completed', duration: '15s' },
        { name: 'Kafka Integration Test Suite', status: 'failed', duration: '1m 55s', logSnippet: 'FAIL: connection timeout to broker-0.kafka.internal:9092 after 10000ms.' }
      ]
    }
  ];

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

  // Fetch telemetry
  const fetchDashboardData = useCallback(async () => {
    setLoading(true);
    try {
      const [resMetrics, resTimeseries, resAlerts, resIncidents] = await Promise.all([
        apiFetch<any>('/api/v1/monitoring/metrics', { token }).catch(() => null),
        apiFetch<any[]>(`/api/v1/monitoring/metrics/timeseries?time_range=${selectedRange}`, { token }).catch(() => []),
        apiFetch<any[]>('/api/v1/monitoring/alerts', { token }).catch(() => []),
        apiFetch<any[]>('/api/v1/operations/incidents', { token }).catch(() => []),
      ]);

      if (resMetrics) setMetrics(resMetrics);
      if (Array.isArray(resTimeseries) && resTimeseries.length > 0) {
        setTimeseries(resTimeseries);
      } else {
        // Fallback realistic timeseries
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
      setLastRefreshedAt(new Date());
    } catch (err) {
      console.error('Failed to fetch dashboard data:', err);
    } finally {
      setLoading(false);
    }
  }, [selectedRange, token]);

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

  const handleProvisionSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!provisionName.trim()) return;

    const newResource: ResourceItem = {
      id: `arv-${provisionType.slice(0, 3)}-${Date.now().toString(36).slice(-5)}`,
      name: provisionName.trim().toLowerCase().replace(/\s+/g, '-'),
      type: provisionType,
      engine: provisionType === 'container' ? 'Docker / Python 3.12' :
              provisionType === 'database' ? 'PostgreSQL 16' :
              provisionType === 'compute' ? 'ArvCompute Ubuntu' :
              provisionType === 'networking' ? 'ALB Layer 7' : 'ArvStore S3',
      region: provisionRegion,
      env: provisionEnv,
      status: 'PROVISIONING',
      cpu: 5,
      memoryMb: 1024,
      specs: `${provisionSpec} • Auto-scaling configured`,
      uptime: 'Provisioning... (10%)',
      createdAt: new Date().toISOString(),
      privateIp: `10.0.${Math.floor(Math.random() * 5)}.${Math.floor(Math.random() * 200)}`,
      endpoint: `${provisionName}.internal.aravanta.net`,
      sparkline: [0, 2, 4, 5, 5, 5, 5]
    };

    setFleet(prev => [newResource, ...prev]);
    setIsProvisionModalOpen(false);
    setProvisionName('');
    showToast(`Initiated provisioning of '${newResource.name}'. Control plane active.`, 'success');

    // Simulate transition to running after 4 seconds
    setTimeout(() => {
      setFleet(prev => prev.map(r => r.id === newResource.id ? { ...r, status: 'RUNNING', uptime: '99.99% • Just now' } : r));
      showToast(`Resource '${newResource.name}' is now RUNNING and healthy.`, 'success');
    }, 4500);
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
              98.6%
            </span>
            <span className="text-xs text-emerald-600 dark:text-emerald-400 font-mono font-bold">Success Rate</span>
          </div>
          <div className="flex items-center justify-between mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-800/80 text-[11px] font-mono text-slate-600 dark:text-slate-400">
            <span>Avg Run: <strong className="text-slate-900 dark:text-white">1m 42s</strong></span>
            <span className="px-1.5 py-0.5 rounded bg-[#C6923B]/10 text-[#C6923B] dark:text-[#D4A347] font-bold">
              fc3e039b
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
              {alerts.length > 0 ? alerts.length : '1'}
            </span>
            <span className="text-xs text-amber-600 dark:text-amber-400 font-mono font-bold">Warning Alert</span>
          </div>
          <div className="flex items-center justify-between mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-800/80 text-[11px] font-mono text-slate-600 dark:text-slate-400">
            <span>Uptime: <strong className="text-emerald-600 dark:text-emerald-400">99.98%</strong></span>
            <span>MTTR: <strong className="text-slate-900 dark:text-white">12m</strong></span>
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
              {metrics?.cpu_usage_percent !== undefined ? `${metrics.cpu_usage_percent}%` : '28.4%'}
            </span>
            <span className="text-xs text-slate-500 font-mono">Fleet CPU</span>
          </div>
          <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-800/80 text-[11px] font-mono flex items-center justify-between text-slate-600 dark:text-slate-400">
            <span>RAM: <strong className="text-slate-900 dark:text-white">{metrics?.memory_usage_percent !== undefined ? `${metrics.memory_usage_percent}%` : '64.2%'}</strong></span>
            <span>Month: <strong className="text-[#C6923B] dark:text-[#D4A347]">₹4,820.00</strong></span>
          </div>
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
                          onClick={() => showToast(`Triggered rolling restart for ${resource.name}`, 'info')}
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
      {inspectResource && (
        <div className="fixed inset-0 z-50 overflow-hidden bg-black/60 backdrop-blur-2xs flex justify-end animate-fadeIn">
          <div className="w-full max-w-lg md:max-w-xl bg-white dark:bg-[#0f172a] h-full shadow-2xl flex flex-col border-l border-slate-200 dark:border-slate-800 animate-slideLeft">
            {/* Panel Header */}
            <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-slate-800 flex items-start justify-between bg-slate-50 dark:bg-[#0c1322]">
              <div>
                <div className="flex items-center gap-2">
                  {getTypeIcon(inspectResource.type)}
                  <h2 className="text-base font-bold text-slate-900 dark:text-white">{inspectResource.name}</h2>
                  {renderStatusBadge(inspectResource.status)}
                </div>
                <div className="flex items-center gap-2 mt-1 text-xs font-mono text-slate-500">
                  <span>ID: {inspectResource.id}</span>
                  <span>•</span>
                  <span>{inspectResource.region}</span>
                </div>
              </div>

              <button
                onClick={() => setInspectResource(null)}
                className="p-1.5 text-slate-400 hover:text-slate-900 dark:hover:text-white rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Panel Tab Navigation */}
            <div className="flex border-b border-slate-200 dark:border-slate-800 px-4 bg-slate-100/50 dark:bg-[#0b101c]">
              {(['overview', 'logs', 'metrics', 'settings'] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setDetailTab(t)}
                  className={`py-2.5 px-4 text-xs font-mono font-bold capitalize border-b-2 transition-colors cursor-pointer ${
                    detailTab === t
                      ? 'border-[#C6923B] text-[#C6923B] dark:text-[#D4A347]'
                      : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-slate-300'
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
                  <div className="bg-slate-50 dark:bg-[#141d2f] p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 space-y-2 font-mono">
                    <div className="flex justify-between py-1 border-b border-slate-200/50 dark:border-slate-800">
                      <span className="text-slate-500">Private IP</span>
                      <span className="text-slate-900 dark:text-white font-bold">{inspectResource.privateIp}</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-200/50 dark:border-slate-800">
                      <span className="text-slate-500">Internal DNS</span>
                      <span className="text-slate-900 dark:text-white truncate max-w-[240px]">{inspectResource.endpoint}</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-200/50 dark:border-slate-800">
                      <span className="text-slate-500">Runtime Engine</span>
                      <span className="text-slate-900 dark:text-white">{inspectResource.engine}</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-200/50 dark:border-slate-800">
                      <span className="text-slate-500">Environment</span>
                      <span className="text-slate-900 dark:text-white uppercase font-bold text-[#C6923B] dark:text-[#D4A347]">{inspectResource.env}</span>
                    </div>
                    <div className="flex justify-between py-1">
                      <span className="text-slate-500">Created At</span>
                      <span className="text-slate-900 dark:text-white">{new Date(inspectResource.createdAt).toLocaleString()}</span>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-bold text-xs uppercase tracking-wider text-slate-500 mb-2">Hardware Specifications</h4>
                    <p className="p-3 bg-slate-50 dark:bg-[#141d2f] rounded-xl border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 font-mono text-xs">
                      {inspectResource.specs}
                    </p>
                  </div>

                  <div>
                    <h4 className="font-bold text-xs uppercase tracking-wider text-slate-500 mb-2">Quick Ops Actions</h4>
                    <div className="grid grid-cols-2 gap-2">
                      <button 
                        onClick={() => showToast(`Initiated restart for ${inspectResource.name}`, 'info')}
                        className="p-2.5 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 font-semibold flex items-center justify-center gap-1.5 cursor-pointer text-slate-700 dark:text-slate-200"
                      >
                        <RotateCw className="w-3.5 h-3.5 text-[#C6923B]" /> Rolling Restart
                      </button>
                      <button 
                        onClick={() => showToast(`Created snapshot of ${inspectResource.name}`, 'success')}
                        className="p-2.5 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 font-semibold flex items-center justify-center gap-1.5 cursor-pointer text-slate-700 dark:text-slate-200"
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
                      onClick={() => {
                        setFleet(prev => prev.filter(r => r.id !== inspectResource.id));
                        setInspectResource(null);
                        showToast(`Terminated ${inspectResource.name}`, 'error');
                      }}
                      className="mt-3 px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs cursor-pointer"
                    >
                      Terminate Resource
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Provision New Resource Modal */}
      {isProvisionModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-2xs flex items-center justify-center p-3 sm:p-4 animate-fadeIn">
          <div className="w-full max-w-lg bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl overflow-hidden animate-scaleUp">
            <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-[#0e1624]">
              <div className="flex items-center gap-2">
                <Plus className="w-4 h-4 text-[#C6923B]" />
                <h3 className="font-bold text-sm text-slate-900 dark:text-white">Provision New Cloud Infrastructure</h3>
              </div>
              <button
                onClick={() => setIsProvisionModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleProvisionSubmit} className="p-4 sm:p-5 space-y-4 text-xs font-sans">
              {/* Category Picker */}
              <div>
                <label className="block text-slate-600 dark:text-slate-300 font-bold mb-1.5 font-mono text-[11px]">
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
                      className={`p-2 rounded-lg border text-center transition-all cursor-pointer text-[11px] font-mono font-semibold ${
                        provisionType === cat.id
                          ? 'border-[#C6923B] bg-[#C6923B]/10 text-[#C6923B] dark:text-[#D4A347] font-bold shadow-2xs'
                          : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                      }`}
                    >
                      {cat.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Resource Name */}
              <div>
                <label className="block text-slate-600 dark:text-slate-300 font-bold mb-1 font-mono text-[11px]">
                  RESOURCE NAME
                </label>
                <input
                  type="text"
                  required
                  value={provisionName}
                  onChange={(e) => setProvisionName(e.target.value)}
                  placeholder="e.g. payments-api-v2"
                  className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-[#141b2a] border border-slate-200 dark:border-slate-800 rounded-lg text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-[#C6923B] font-mono"
                />
              </div>

              {/* Region & Environment */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 dark:text-slate-300 font-bold mb-1 font-mono text-[11px]">
                    AVAILABILITY ZONE
                  </label>
                  <select
                    value={provisionRegion}
                    onChange={(e) => setProvisionRegion(e.target.value)}
                    className="w-full px-2.5 py-2 text-xs bg-slate-50 dark:bg-[#141b2a] border border-slate-200 dark:border-slate-800 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-[#C6923B] font-mono"
                  >
                    <option value="ap-south-1a">ap-south-1a (Mumbai)</option>
                    <option value="ap-south-1b">ap-south-1b (Mumbai)</option>
                    <option value="us-east-1a">us-east-1a (N. Virginia)</option>
                    <option value="eu-west-1a">eu-west-1a (Frankfurt)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-600 dark:text-slate-300 font-bold mb-1 font-mono text-[11px]">
                    ENVIRONMENT
                  </label>
                  <select
                    value={provisionEnv}
                    onChange={(e) => setProvisionEnv(e.target.value as any)}
                    className="w-full px-2.5 py-2 text-xs bg-slate-50 dark:bg-[#141b2a] border border-slate-200 dark:border-slate-800 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-[#C6923B] font-mono"
                  >
                    <option value="production">Production</option>
                    <option value="staging">Staging</option>
                    <option value="development">Development</option>
                  </select>
                </div>
              </div>

              {/* Hardware Spec */}
              <div>
                <label className="block text-slate-600 dark:text-slate-300 font-bold mb-1 font-mono text-[11px]">
                  INSTANCE SIZE / TIER
                </label>
                <select
                  value={provisionSpec}
                  onChange={(e) => setProvisionSpec(e.target.value)}
                  className="w-full px-2.5 py-2 text-xs bg-slate-50 dark:bg-[#141b2a] border border-slate-200 dark:border-slate-800 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-[#C6923B] font-mono"
                >
                  <option value="standard-1x">Standard 1x (1 vCPU • 2 GB RAM)</option>
                  <option value="standard-2x">Standard 2x (2 vCPU • 4 GB RAM • Recommended)</option>
                  <option value="performance-4x">Performance 4x (4 vCPU • 16 GB RAM)</option>
                  <option value="high-memory-8x">High-Memory 8x (8 vCPU • 32 GB RAM)</option>
                </select>
              </div>

              <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsProvisionModalOpen(false)}
                  className="px-3.5 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-bold text-white bg-[#C6923B] hover:bg-[#B07B28] rounded-lg shadow-md cursor-pointer flex items-center gap-1.5"
                >
                  <Plus className="w-3.5 h-3.5" /> Launch Infrastructure
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
