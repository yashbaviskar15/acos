import React, { useState, useEffect, useCallback } from 'react';
import { apiFetch } from '../config/api';
import {
  Server, Boxes, HardDrive, Database, GitBranch, Activity, ShieldCheck, CreditCard,
  ArrowUpRight, Zap, AlertTriangle, RefreshCw, LayoutGrid, Layers, ChevronRight,
  Sparkles, Plus, X, Settings, Eye, EyeOff, TrendingUp, IndianRupee, BarChart3
} from 'lucide-react';
import { ModalPortal } from '../components/ModalPortal';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  AreaChart, Area, Cell
} from 'recharts';

interface DashboardProps {
  token: string | null;
  onNavigate?: (tab: string) => void;
}

interface WidgetConfig {
  kpiCards: boolean;
  serviceDirectory: boolean;
  vmTable: boolean;
  telemetryGauges: boolean;
  alerts: boolean;
  serviceCostChart: boolean;
  spendTrendChart: boolean;
  servicePricing: boolean;
}

const DEFAULT_WIDGETS: WidgetConfig = {
  kpiCards: true,
  serviceDirectory: true,
  vmTable: true,
  telemetryGauges: true,
  alerts: true,
  serviceCostChart: true,
  spendTrendChart: true,
  servicePricing: true,
};

const WIDGET_LABELS: Record<keyof WidgetConfig, { label: string; icon: React.ElementType }> = {
  kpiCards: { label: 'KPI Telemetry Cards', icon: Layers },
  serviceDirectory: { label: 'CloudOS Services Directory', icon: LayoutGrid },
  vmTable: { label: 'Active Virtual Machines', icon: Server },
  telemetryGauges: { label: 'Resource Gauges (CPU/RAM/Disk)', icon: Activity },
  alerts: { label: 'System Alerts & Notices', icon: AlertTriangle },
  serviceCostChart: { label: 'Service Cost Bar Chart', icon: BarChart3 },
  spendTrendChart: { label: 'Monthly Spend Trend', icon: TrendingUp },
  servicePricing: { label: 'Service Pricing (₹/month)', icon: IndianRupee },
};

const CHART_COLORS = ['#2563eb', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444', '#06b6d4'];

const USD_TO_INR = 83;

export const Dashboard: React.FC<DashboardProps> = ({ token, onNavigate }) => {
  const [metrics, setMetrics] = useState<any>(null);
  const [instances, setInstances] = useState<any[]>([]);
  const [alerts, setAlerts] = useState<any[]>([]);
  const [breakdown, setBreakdown] = useState<any[]>([]);
  const [invoices, setInvoices] = useState<any[]>([]);
  const [servicePricing, setServicePricing] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showDeployModal, setShowDeployModal] = useState(false);
  const [showWidgetSettings, setShowWidgetSettings] = useState(false);

  // Deploy Modal form state
  const [vmName, setVmName] = useState('');
  const [vmType, setVmType] = useState('arv.general.medium');
  const [vmRegion, setVmRegion] = useState('arv-us-east-1');
  const [deploying, setDeploying] = useState(false);

  // Widget configuration (persisted in localStorage)
  const [widgets, setWidgets] = useState<WidgetConfig>(() => {
    try {
      const saved = localStorage.getItem('aravanta_widget_config');
      if (saved) return { ...DEFAULT_WIDGETS, ...JSON.parse(saved) };
    } catch { /* ignore */ }
    return DEFAULT_WIDGETS;
  });

  // Persist widget config
  useEffect(() => {
    localStorage.setItem('aravanta_widget_config', JSON.stringify(widgets));
  }, [widgets]);

  const toggleWidget = (key: keyof WidgetConfig) => {
    setWidgets(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const resetWidgets = () => {
    setWidgets(DEFAULT_WIDGETS);
    localStorage.setItem('aravanta_widget_config', JSON.stringify(DEFAULT_WIDGETS));
  };

  const fetchDashboardData = useCallback(async () => {
    setLoading(true);
    const authHeaders: Record<string, string> = token ? { 'Authorization': `Bearer ${token}` } : {};

    try {
      const [resMetrics, resInstances, resAlerts, resBreakdown, resPricing, resInvoices] = await Promise.all([
        apiFetch('/v1/monitoring/metrics', { headers: authHeaders }).catch(() => null),
        apiFetch('/v1/compute/instances', { headers: authHeaders }).catch(() => null),
        apiFetch('/v1/monitoring/alerts', { headers: authHeaders }).catch(() => null),
        apiFetch('/v1/billing/breakdown').catch(() => null),
        apiFetch('/v1/billing/service-pricing').catch(() => null),
        apiFetch('/v1/billing/invoices').catch(() => null),
      ]);

      if (resMetrics) setMetrics(resMetrics);
      if (resInstances) setInstances(Array.isArray(resInstances) ? resInstances : []);
      if (resAlerts) setAlerts(Array.isArray(resAlerts) ? resAlerts : []);
      if (resBreakdown) setBreakdown(Array.isArray(resBreakdown) ? resBreakdown : []);
      if (resPricing) setServicePricing(Array.isArray(resPricing) ? resPricing : []);
      if (resInvoices) setInvoices(Array.isArray(resInvoices) ? resInvoices : []);
    } catch (err) {
      console.error("Error fetching dashboard telemetry:", err);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchDashboardData();
    const interval = setInterval(fetchDashboardData, 15000);
    return () => clearInterval(interval);
  }, [fetchDashboardData]);

  const handleDeployVm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!vmName.trim()) return;
    setDeploying(true);
    const authHeaders: Record<string, string> = token ? {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    } : { 'Content-Type': 'application/json' };

    try {
      await apiFetch('/v1/compute/instances', {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify({ name: vmName.trim(), instance_type: vmType, region: vmRegion }),
      });
      setShowDeployModal(false);
      setVmName('');
      fetchDashboardData();
    } catch (err) {
      console.error('Deploy failed:', err);
    } finally {
      setDeploying(false);
    }
  };

  // Prepare chart data
  const costChartData = breakdown.map((item: any) => ({
    name: item.service.split('(')[0].trim(),
    cost: Math.round(item.cost_usd * USD_TO_INR),
    percent: item.percent
  }));

  const spendTrendData = [...invoices].reverse().map((inv: any) => ({
    month: inv.period.replace(' 2026', '').substring(0, 3),
    spend: Math.round(inv.amount_usd * USD_TO_INR),
  }));

  const quickServices = [
    { id: 'compute', name: 'ArvCompute (EC2)', desc: 'Elastic VM Instances & Auto-Scaling', icon: Server, badge: `${instances.length || 0} Active` },
    { id: 'kubernetes', name: 'ArvKube (EKS)', desc: 'Managed Kubernetes Worker Pools', icon: Boxes, badge: `${metrics?.active_clusters || 0} Clusters` },
    { id: 'storage', name: 'ArvStore (S3)', desc: 'Distributed Object Storage Buckets', icon: HardDrive, badge: `${metrics?.active_buckets || 0} Buckets` },
    { id: 'database', name: 'ArvDB (RDS)', desc: 'High-Availability Database Engines', icon: Database, badge: '4 Instances' },
    { id: 'cicd', name: 'CI/CD Pipelines', desc: 'Automated Container Build Runners', icon: GitBranch, badge: '4 Pipelines' },
    { id: 'monitoring', name: 'ArvWatch', desc: 'Real-time Metrics & System Telemetry', icon: Activity, badge: 'Operational' },
    { id: 'security', name: 'Security & Audit', desc: 'Zero-Trust RBAC & Compliance Logs', icon: ShieldCheck, badge: 'Zero-Trust' },
    { id: 'billing', name: 'Billing & Costs', desc: 'Cost Breakdown & Monthly Forecast', icon: CreditCard, badge: `₹${metrics?.cost_mtd_usd ? Math.round(metrics.cost_mtd_usd * USD_TO_INR / 1000) + 'K' : '0'} MTD` },
  ];

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white dark:bg-[#0F2038] border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 shadow-xl">
          <p className="text-xs font-bold text-slate-900 dark:text-white">{label}</p>
          <p className="text-sm font-black text-blue-600 dark:text-blue-400 mt-1">₹{payload[0].value.toLocaleString('en-IN')}</p>
        </div>
      );
    }
    return null;
  };

  const enabledCount = Object.values(widgets).filter(Boolean).length;

  return (
    <div className="p-4 sm:p-6 space-y-6">

      {/* ─── CONSOLE HOME BANNER ─── */}
      <div className="bg-white dark:bg-[#0F2038] border border-slate-200 dark:border-slate-800 p-5 sm:p-6 rounded-2xl relative overflow-hidden shadow-sm">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 relative z-10">
          <div className="space-y-1 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-blue-50 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/30 text-blue-600 dark:text-blue-400 text-[11px] font-mono font-bold">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              <span>Aravanta CloudOS Console Home</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
              Unified Multicloud Infrastructure Control Plane
            </h2>
            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed font-medium">
              Deploy virtual compute, manage Kubernetes clusters, provision S3 object storage buckets, and monitor system metrics in real time.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={() => setShowWidgetSettings(!showWidgetSettings)}
              className={`px-3.5 py-2 text-xs font-bold rounded-xl border flex items-center gap-1.5 transition-all shadow-sm cursor-pointer ${
                showWidgetSettings
                  ? 'bg-blue-600 text-white border-blue-600 shadow-blue-600/25'
                  : 'bg-slate-100 dark:bg-slate-900/80 hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200 border-slate-200 dark:border-slate-800'
              }`}
            >
              <Settings className={`w-3.5 h-3.5 ${showWidgetSettings ? 'animate-spin' : ''}`} />
              <span>Customize ({enabledCount}/{Object.keys(widgets).length})</span>
            </button>

            <button
              onClick={fetchDashboardData}
              className="px-3.5 py-2 bg-slate-100 dark:bg-slate-900/80 hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200 text-xs font-bold rounded-xl border border-slate-200 dark:border-slate-800 flex items-center gap-1.5 transition-colors shadow-sm cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </button>

            <div className="hidden sm:flex items-center gap-2 px-3 py-2 bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/30 text-emerald-700 dark:text-emerald-400 rounded-xl text-xs font-mono font-bold">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span>Operational</span>
            </div>
          </div>
        </div>
      </div>

      {/* ─── WIDGET SETTINGS PANEL ─── */}
      {showWidgetSettings && (
        <div className="bg-white dark:bg-[#0F2038] border border-blue-200 dark:border-blue-500/30 rounded-2xl p-5 shadow-lg shadow-blue-500/5 animate-fadeIn">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase font-mono tracking-wider flex items-center gap-2">
              <Settings className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              Customize Dashboard Widgets
            </h3>
            <div className="flex items-center gap-2">
              <button
                onClick={resetWidgets}
                className="px-3 py-1 text-[10px] font-bold text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-500/10 rounded-lg transition-colors cursor-pointer"
              >
                Reset All
              </button>
              <button
                onClick={() => setShowWidgetSettings(false)}
                className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-white rounded-lg cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {(Object.keys(widgets) as Array<keyof WidgetConfig>).map((key) => {
              const { label, icon: Icon } = WIDGET_LABELS[key];
              const enabled = widgets[key];
              return (
                <button
                  key={key}
                  onClick={() => toggleWidget(key)}
                  className={`p-3 rounded-xl border text-left transition-all cursor-pointer group ${
                    enabled
                      ? 'bg-blue-50 dark:bg-blue-500/10 border-blue-200 dark:border-blue-500/30 shadow-sm'
                      : 'bg-slate-50 dark:bg-slate-900/40 border-slate-200 dark:border-slate-800 opacity-60 hover:opacity-100'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <Icon className={`w-3.5 h-3.5 ${enabled ? 'text-blue-600 dark:text-blue-400' : 'text-slate-400'}`} />
                    {enabled ? <Eye className="w-3 h-3 text-emerald-500" /> : <EyeOff className="w-3 h-3 text-slate-400" />}
                  </div>
                  <p className={`text-[10px] font-bold leading-tight ${enabled ? 'text-blue-700 dark:text-blue-300' : 'text-slate-500'}`}>
                    {label}
                  </p>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* ─── KPI TELEMETRY CARDS ─── */}
      {widgets.kpiCards && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white dark:bg-[#0F2038] border border-slate-200 dark:border-slate-800 rounded-2xl p-5 relative overflow-hidden group hover:border-blue-500/50 transition-all shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono text-slate-600 dark:text-slate-300 uppercase tracking-wider font-extrabold">ArvCompute</span>
              <div className="p-2 bg-blue-50 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/20 text-blue-600 dark:text-blue-400 rounded-xl">
                <Server className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3">
              <h3 className="text-2xl font-black text-slate-900 dark:text-white">{instances.length} Active VMs</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-1 font-mono font-medium">
                <span className="text-emerald-600 dark:text-emerald-400 font-bold flex items-center">
                  <ArrowUpRight className="w-3 h-3" /> Live data
                </span>
              </p>
            </div>
            <div className="w-full bg-slate-100 dark:bg-slate-900 h-1.5 rounded-full mt-4 overflow-hidden">
              <div className="bg-blue-600 dark:bg-blue-500 h-full rounded-full transition-all duration-700" style={{ width: `${Math.min(instances.length * 15, 100)}%` }}></div>
            </div>
          </div>

          <div className="bg-white dark:bg-[#0F2038] border border-slate-200 dark:border-slate-800 rounded-2xl p-5 relative overflow-hidden group hover:border-purple-500/50 transition-all shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono text-slate-600 dark:text-slate-300 uppercase tracking-wider font-extrabold">ArvKube</span>
              <div className="p-2 bg-purple-50 dark:bg-purple-500/10 border border-purple-200 dark:border-purple-500/20 text-purple-600 dark:text-purple-400 rounded-xl">
                <Boxes className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3">
              <h3 className="text-2xl font-black text-slate-900 dark:text-white">{metrics?.active_clusters || 0} Clusters</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-mono font-medium">{metrics?.uptime_percent || 0}% Uptime</p>
            </div>
            <div className="w-full bg-slate-100 dark:bg-slate-900 h-1.5 rounded-full mt-4 overflow-hidden">
              <div className="bg-purple-600 dark:bg-purple-500 h-full rounded-full transition-all duration-700" style={{ width: `${metrics?.uptime_percent || 0}%` }}></div>
            </div>
          </div>

          <div className="bg-white dark:bg-[#0F2038] border border-slate-200 dark:border-slate-800 rounded-2xl p-5 relative overflow-hidden group hover:border-emerald-500/50 transition-all shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono text-slate-600 dark:text-slate-300 uppercase tracking-wider font-extrabold">ArvStore</span>
              <div className="p-2 bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 text-emerald-600 dark:text-emerald-400 rounded-xl">
                <HardDrive className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3">
              <h3 className="text-2xl font-black text-slate-900 dark:text-white">{metrics?.storage_usage_percent || 0}% Used</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-mono font-medium">{metrics?.active_buckets || 0} Buckets</p>
            </div>
            <div className="w-full bg-slate-100 dark:bg-slate-900 h-1.5 rounded-full mt-4 overflow-hidden">
              <div className="bg-emerald-600 dark:bg-emerald-500 h-full rounded-full transition-all duration-700" style={{ width: `${metrics?.storage_usage_percent || 0}%` }}></div>
            </div>
          </div>

          <div className="bg-white dark:bg-[#0F2038] border border-slate-200 dark:border-slate-800 rounded-2xl p-5 relative overflow-hidden group hover:border-amber-500/50 transition-all shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono text-slate-600 dark:text-slate-300 uppercase tracking-wider font-extrabold">Monthly Spend</span>
              <div className="p-2 bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 text-amber-600 dark:text-amber-400 rounded-xl">
                <Zap className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3">
              <h3 className="text-2xl font-black text-amber-600 dark:text-amber-400">
                ₹{metrics?.cost_mtd_usd ? Math.round(metrics.cost_mtd_usd * USD_TO_INR).toLocaleString('en-IN') : '0'}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-mono font-medium">
                Projected ₹{metrics?.cost_mtd_usd ? Math.round(metrics.cost_mtd_usd * USD_TO_INR * 1.18).toLocaleString('en-IN') : '0'}
              </p>
            </div>
            <div className="w-full bg-slate-100 dark:bg-slate-900 h-1.5 rounded-full mt-4 overflow-hidden">
              <div className="bg-amber-500 h-full rounded-full transition-all duration-700" style={{ width: '68%' }}></div>
            </div>
          </div>
        </div>
      )}

      {/* ─── CHARTS ROW: Service Cost + Spend Trend ─── */}
      {(widgets.serviceCostChart || widgets.spendTrendChart) && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Service Cost Bar Chart */}
          {widgets.serviceCostChart && (
            <div className="bg-white dark:bg-[#0F2038] border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm">
              <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase font-mono tracking-wider flex items-center gap-2 mb-4 border-b border-slate-200 dark:border-slate-800 pb-3">
                <BarChart3 className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                Service Cost Distribution (₹ INR)
              </h3>
              {costChartData.length > 0 ? (
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={costChartData} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis dataKey="name" tick={{ fontSize: 10, fontWeight: 700 }} />
                    <YAxis tick={{ fontSize: 10 }} tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}K`} />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar dataKey="cost" radius={[8, 8, 0, 0]} maxBarSize={50}>
                      {costChartData.map((_: any, index: number) => (
                        <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[280px] flex items-center justify-center text-xs text-slate-500 font-mono">
                  {loading ? <RefreshCw className="w-5 h-5 animate-spin text-blue-500" /> : 'No cost data available'}
                </div>
              )}
            </div>
          )}

          {/* Monthly Spend Trend Area Chart */}
          {widgets.spendTrendChart && (
            <div className="bg-white dark:bg-[#0F2038] border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm">
              <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase font-mono tracking-wider flex items-center gap-2 mb-4 border-b border-slate-200 dark:border-slate-800 pb-3">
                <TrendingUp className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                Monthly Spend Trend (₹ INR)
              </h3>
              {spendTrendData.length > 0 ? (
                <ResponsiveContainer width="100%" height={280}>
                  <AreaChart data={spendTrendData} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
                    <defs>
                      <linearGradient id="spendGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#2563eb" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#2563eb" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis dataKey="month" tick={{ fontSize: 11, fontWeight: 700 }} />
                    <YAxis tick={{ fontSize: 10 }} tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}K`} />
                    <Tooltip content={<CustomTooltip />} />
                    <Area type="monotone" dataKey="spend" stroke="#2563eb" strokeWidth={2.5} fill="url(#spendGrad)" />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[280px] flex items-center justify-center text-xs text-slate-500 font-mono">
                  {loading ? <RefreshCw className="w-5 h-5 animate-spin text-blue-500" /> : 'No trend data available'}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ─── SERVICE PRICING GRID ─── */}
      {widgets.servicePricing && (
        <div className="bg-white dark:bg-[#0F2038] border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
            <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase font-mono tracking-wider flex items-center gap-2">
              <IndianRupee className="w-4 h-4 text-amber-600 dark:text-amber-400" />
              Service Pricing — Amount to Access Each Service (₹/month)
            </h3>
            <span className="text-[10px] text-slate-500 dark:text-slate-400 font-mono font-bold">{servicePricing.length} Services</span>
          </div>

          {servicePricing.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {servicePricing.map((svc: any, idx: number) => {
                const IconMap: Record<string, React.ElementType> = {
                  Server, Boxes, HardDrive, Database, GitBranch, Activity
                };
                const Icon = IconMap[svc.icon] || Server;
                return (
                  <div
                    key={idx}
                    className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 hover:border-blue-500/40 transition-all group"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-xl border shrink-0`} style={{ backgroundColor: `${CHART_COLORS[idx % CHART_COLORS.length]}15`, borderColor: `${CHART_COLORS[idx % CHART_COLORS.length]}30` }}>
                          <Icon className="w-4 h-4" style={{ color: CHART_COLORS[idx % CHART_COLORS.length] }} />
                        </div>
                        <div>
                          <h4 className="text-xs font-bold text-slate-900 dark:text-white">{svc.service}</h4>
                          <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">{svc.description}</p>
                        </div>
                      </div>
                    </div>
                    <div className="mt-3 flex items-end justify-between">
                      <div>
                        <span className="text-lg font-black text-blue-600 dark:text-blue-400">₹{svc.price_inr.toLocaleString('en-IN')}</span>
                        <span className="text-[10px] text-slate-500 dark:text-slate-400 ml-1 font-mono">/{svc.unit.replace('per ', '').replace('/month', '')}</span>
                      </div>
                      <span className="text-[10px] text-slate-400 font-mono">monthly</span>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-8 text-xs text-slate-500 font-mono">
              {loading ? <RefreshCw className="w-5 h-5 animate-spin text-blue-500 mx-auto" /> : 'No pricing data available'}
            </div>
          )}
        </div>
      )}

      {/* ─── MAIN WIDGET GRID ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* LEFT 2 COLUMNS */}
        <div className="lg:col-span-2 space-y-6">

          {/* Quick Services Grid */}
          {widgets.serviceDirectory && (
            <div className="bg-white dark:bg-[#0F2038] border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
                <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase font-mono tracking-wider flex items-center gap-2">
                  <LayoutGrid className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  CloudOS Services Directory
                </h3>
                <span className="text-[11px] text-slate-500 dark:text-slate-400 font-mono font-bold">8 Active Services</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {quickServices.map((srv) => {
                  const Icon = srv.icon;
                  return (
                    <div
                      key={srv.id}
                      onClick={() => onNavigate && onNavigate(srv.id)}
                      className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 flex items-start gap-3 hover:border-blue-500/40 transition-all cursor-pointer group"
                    >
                      <div className="p-2 rounded-xl bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-500/20 shrink-0">
                        <Icon className="w-4 h-4" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between">
                          <h4 className="text-xs font-bold text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors truncate">
                            {srv.name}
                          </h4>
                          <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover:translate-x-0.5 transition-transform shrink-0" />
                        </div>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate mt-0.5">{srv.desc}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* VM Instances Table */}
          {widgets.vmTable && (
            <div className="bg-white dark:bg-[#0F2038] border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
                <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider font-mono flex items-center gap-2">
                  <Server className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  Active Virtual Machines (ArvCompute)
                </h3>
                <button
                  onClick={() => setShowDeployModal(true)}
                  className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl transition-colors shadow-sm flex items-center gap-1.5 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Deploy Instance</span>
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 dark:bg-slate-900/60 text-slate-600 dark:text-slate-300 uppercase font-mono text-[10px] border-b border-slate-200 dark:border-slate-800 font-extrabold">
                    <tr>
                      <th className="p-3">Instance Name</th>
                      <th className="p-3">Type</th>
                      <th className="p-3">IP Address</th>
                      <th className="p-3">Region</th>
                      <th className="p-3">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 dark:divide-slate-800/60 font-mono">
                    {instances.length > 0 ? instances.map((inst: any) => (
                      <tr key={inst.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors text-slate-800 dark:text-slate-200">
                        <td className="p-3 font-bold text-slate-900 dark:text-white flex items-center gap-2">
                          <Server className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 shrink-0" />
                          <span>{inst.name}</span>
                        </td>
                        <td className="p-3 text-slate-600 dark:text-slate-300">{inst.instance_type}</td>
                        <td className="p-3 text-slate-500 dark:text-slate-400">{inst.ip_address}</td>
                        <td className="p-3 text-slate-500 dark:text-slate-400">{inst.region}</td>
                        <td className="p-3">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                            inst.status === 'RUNNING'
                              ? 'bg-emerald-50 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/30'
                              : 'bg-amber-50 dark:bg-amber-500/20 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-500/30'
                          }`}>
                            {inst.status}
                          </span>
                        </td>
                      </tr>
                    )) : (
                      <tr>
                        <td colSpan={5} className="p-6 text-center text-slate-500">
                          {loading ? 'Loading instances...' : 'No active instances — Deploy one to get started'}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* RIGHT COLUMN */}
        <div className="space-y-6">

          {/* Telemetry Gauges */}
          {widgets.telemetryGauges && (
            <div className="bg-white dark:bg-[#0F2038] border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
              <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider font-mono border-b border-slate-200 dark:border-slate-800 pb-3 flex items-center gap-2">
                <Layers className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                Telemetry & Resource Gauges
              </h3>

              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-slate-700 dark:text-slate-300 font-bold">CPU Utilization</span>
                    <span className="font-mono text-blue-600 dark:text-blue-400 font-bold">{metrics?.cpu_usage_percent || 0}%</span>
                  </div>
                  <div className="w-full bg-slate-100 dark:bg-slate-900 h-2 rounded-full overflow-hidden">
                    <div className="bg-blue-600 h-full transition-all duration-700 rounded-full" style={{ width: `${metrics?.cpu_usage_percent || 0}%` }}></div>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-slate-700 dark:text-slate-300 font-bold">RAM Utilization</span>
                    <span className="font-mono text-purple-600 dark:text-purple-400 font-bold">{metrics?.memory_usage_percent || 0}%</span>
                  </div>
                  <div className="w-full bg-slate-100 dark:bg-slate-900 h-2 rounded-full overflow-hidden">
                    <div className="bg-purple-600 h-full transition-all duration-700 rounded-full" style={{ width: `${metrics?.memory_usage_percent || 0}%` }}></div>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-slate-700 dark:text-slate-300 font-bold">Storage Capacity</span>
                    <span className="font-mono text-emerald-600 dark:text-emerald-400 font-bold">{metrics?.storage_usage_percent || 0}%</span>
                  </div>
                  <div className="w-full bg-slate-100 dark:bg-slate-900 h-2 rounded-full overflow-hidden">
                    <div className="bg-emerald-600 h-full transition-all duration-700 rounded-full" style={{ width: `${metrics?.storage_usage_percent || 0}%` }}></div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Alerts */}
          {widgets.alerts && (
            <div className="bg-white dark:bg-[#0F2038] border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-3">
              <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-3">
                <AlertTriangle className="w-4 h-4 text-amber-500" />
                <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider font-mono">ArvWatch System Notice</h3>
              </div>

              {alerts.length > 0 ? (
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {alerts.slice(0, 3).map((a: any) => (
                    <div key={a.id} className="p-3 bg-amber-50/50 dark:bg-slate-900/60 border border-amber-200 dark:border-slate-800 rounded-xl text-xs space-y-1">
                      <div className="flex items-center justify-between font-mono">
                        <span className="font-bold text-amber-700 dark:text-amber-400">{a.title}</span>
                        <span className="text-[10px] text-slate-500 uppercase">{a.severity}</span>
                      </div>
                      <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-tight">{a.message}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-3 bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 rounded-xl text-xs text-emerald-700 dark:text-emerald-400 font-mono flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                  <span><strong>All systems operational.</strong> No active alerts.</span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ─── DEPLOY INSTANCE MODAL ─── */}
      <ModalPortal isOpen={showDeployModal} onClose={() => setShowDeployModal(false)}>
        <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3.5">
          <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
            <Server className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            Deploy New ArvCompute Instance
          </h3>
          <button
            onClick={() => setShowDeployModal(false)}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleDeployVm} className="space-y-4 mt-4">
          <div>
            <label className="block text-xs font-mono font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">Instance Name</label>
            <input
              type="text"
              required
              placeholder="e.g. app-worker-prod-03"
              value={vmName}
              onChange={(e) => setVmName(e.target.value)}
              className="w-full px-4 py-3 text-xs sm:text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white focus:border-blue-600 focus:outline-none transition-all"
            />
          </div>

          <div>
            <label className="block text-xs font-mono font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">Instance Type</label>
            <select
              value={vmType}
              onChange={(e) => setVmType(e.target.value)}
              className="w-full px-4 py-3 text-xs sm:text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white focus:border-blue-600 focus:outline-none transition-all"
            >
              <option value="arv.general.small">arv.general.small (1 vCPU, 2GB RAM)</option>
              <option value="arv.general.medium">arv.general.medium (2 vCPU, 4GB RAM)</option>
              <option value="arv.compute.large">arv.compute.large (4 vCPU, 8GB RAM)</option>
              <option value="arv.memory.xlarge">arv.memory.xlarge (8 vCPU, 32GB RAM)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-mono font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">Deployment Region</label>
            <select
              value={vmRegion}
              onChange={(e) => setVmRegion(e.target.value)}
              className="w-full px-4 py-3 text-xs sm:text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white focus:border-blue-600 focus:outline-none transition-all"
            >
              <option value="arv-us-east-1">arv-us-east-1 (N. Virginia)</option>
              <option value="arv-eu-west-1">arv-eu-west-1 (Ireland)</option>
              <option value="arv-ap-south-1">arv-ap-south-1 (Mumbai)</option>
            </select>
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={() => setShowDeployModal(false)}
              className="px-4 py-2.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl text-xs font-bold transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={deploying}
              className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-lg shadow-blue-600/25 flex items-center gap-2 disabled:opacity-60 transition-all cursor-pointer"
            >
              {deploying ? 'Deploying Instance...' : 'Provision Instance'}
            </button>
          </div>
        </form>
      </ModalPortal>
    </div>
  );
};
