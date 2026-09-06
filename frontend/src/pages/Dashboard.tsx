import React, { useState, useEffect, useCallback } from 'react';
import {
  RefreshCw, Layers, ChevronRight,
  ShieldCheck, Cpu, ShieldAlert, Radio, Zap,
  Server, Plus, Boxes, DollarSign, Database, HardDrive
} from 'lucide-react';
import { apiFetch } from '../config/api';
import { StatusBadge } from '../components/StatusBadge';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';

interface DashboardProps {
  token: string | null;
  onNavigate?: (tab: string) => void;
  searchTerm?: string;
}

export const Dashboard: React.FC<DashboardProps> = ({ token, onNavigate, searchTerm = '' }) => {
  const [metrics, setMetrics] = useState<any>(null);
  const [timeseries, setTimeseries] = useState<any[]>([]);
  const [apps, setApps] = useState<any[]>([]);
  const [deployments, setDeployments] = useState<any[]>([]);
  const [alerts, setAlerts] = useState<any[]>([]);
  const [incidents, setIncidents] = useState<any[]>([]);
  const [health, setHealth] = useState<any>(null);
  const [dashboardServices, setDashboardServices] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedRange, setSelectedRange] = useState<string>('24h');

  const fetchDashboardData = useCallback(async () => {
    setLoading(true);
    try {
      const [resMetrics, resTimeseries, resApps, resDeployments, resAlerts, resIncidents, resHealth, resServices] = await Promise.all([
        apiFetch<any>('/api/v1/monitoring/metrics', { token }).catch(() => null),
        apiFetch<any[]>(`/api/v1/monitoring/metrics/timeseries?time_range=${selectedRange}`, { token }).catch(() => []),
        apiFetch<any[]>('/api/v1/operations/applications', { token }).catch(() => []),
        apiFetch<any[]>('/api/v1/operations/deployments', { token }).catch(() => []),
        apiFetch<any[]>('/api/v1/monitoring/alerts', { token }).catch(() => []),
        apiFetch<any[]>('/api/v1/operations/incidents', { token }).catch(() => []),
        apiFetch<any>('/api/v1/monitoring/health', { token }).catch(() => null),
        apiFetch<any>('/api/v1/monitoring/dashboard/services', { token }).catch(() => null),
      ]);

      if (resMetrics) setMetrics(resMetrics);
      if (Array.isArray(resTimeseries)) setTimeseries(resTimeseries);
      if (Array.isArray(resApps)) setApps(resApps);
      if (Array.isArray(resDeployments)) setDeployments(resDeployments);
      if (Array.isArray(resAlerts)) setAlerts(resAlerts);
      if (Array.isArray(resIncidents)) setIncidents(resIncidents);
      if (resHealth) setHealth(resHealth);
      if (resServices) setDashboardServices(resServices);
    } catch (err) {
      console.error('Failed to fetch dashboard data:', err);
    } finally {
      setLoading(false);
    }
  }, [selectedRange, token]);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  // Live services and real counts from backend
  const liveServicesList = dashboardServices?.services || [];
  const query = searchTerm.toLowerCase().trim();
  const displayedServices = query
    ? liveServicesList.filter((s: any) =>
        (s.name || '').toLowerCase().includes(query) ||
        (s.service_type || '').toLowerCase().includes(query) ||
        (s.category || '').toLowerCase().includes(query) ||
        (s.region || '').toLowerCase().includes(query) ||
        (s.spec || '').toLowerCase().includes(query) ||
        (s.status || '').toLowerCase().includes(query)
      )
    : liveServicesList;

  const totalServicesCount = dashboardServices?.services_count ?? (apps.length + (metrics?.compute?.instances_total || 0));
  const healthyApps = liveServicesList.length > 0 
    ? liveServicesList.filter((s: any) => ['RUNNING', 'ACTIVE', 'HEALTHY', 'AVAILABLE'].includes(s.status)).length
    : apps.filter(a => a.status === 'HEALTHY').length;
  const warningApps = liveServicesList.length > 0
    ? liveServicesList.filter((s: any) => s.status === 'WARNING').length
    : apps.filter(a => a.status === 'WARNING').length;
  const criticalApps = liveServicesList.length > 0
    ? liveServicesList.filter((s: any) => ['STOPPED', 'CRITICAL', 'ERROR', 'TERMINATED'].includes(s.status)).length
    : apps.filter(a => a.status === 'CRITICAL').length;

  const activeIncidents = incidents.filter(i => i.status !== 'Resolved');
  const firingAlerts = alerts.filter(a => a.status === 'firing');

  const formatTimestamp = (isoStr: string) => {
    if (!isoStr) return '—';
    try {
      const d = new Date(isoStr);
      return d.toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return isoStr;
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'COMPUTE': return <Server className="w-4 h-4 text-blue-500 shrink-0" />;
      case 'WORKLOAD': return <Layers className="w-4 h-4 text-emerald-500 shrink-0" />;
      case 'DATABASE': return <Database className="w-4 h-4 text-purple-500 shrink-0" />;
      case 'STORAGE': return <HardDrive className="w-4 h-4 text-amber-500 shrink-0" />;
      case 'KUBERNETES': return <Boxes className="w-4 h-4 text-cyan-500 shrink-0" />;
      default: return <Server className="w-4 h-4 text-slate-400 shrink-0" />;
    }
  };

  return (
    <div className="space-y-6 font-mono text-xs">
      {/* Active Incident Warning Banner */}
      {activeIncidents.length > 0 && (
        <div className="bg-rose-950/80 border border-rose-500/50 rounded-2xl p-4 sm:p-5 shadow-lg flex flex-col md:flex-row items-start md:items-center justify-between gap-4 text-rose-200 animate-fadeIn">
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-xl bg-rose-500/20 text-rose-400 flex items-center justify-center font-bold shrink-0 mt-0.5 animate-pulse">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-black text-rose-400 text-sm">ACTIVE INCIDENT: {activeIncidents[0].id || 'INC-01'}</span>
                <span className="px-2 py-0.5 rounded bg-rose-500/30 text-rose-200 text-[10px] font-bold">
                  {activeIncidents[0].severity}
                </span>
                <StatusBadge status={activeIncidents[0].status} size="sm" />
              </div>
              <p className="text-xs text-rose-300 mt-1 font-sans">{activeIncidents[0].title}</p>
              <p className="text-[11px] text-rose-400/80 mt-0.5">Affected Target: {activeIncidents[0].affected_service}</p>
            </div>
          </div>

          <button
            onClick={() => onNavigate?.('incidents')}
            className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl shadow-md transition-all shrink-0 flex items-center gap-1.5 cursor-pointer"
          >
            Open Incident War-Room <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Top Operations Bar: Environment, Status & Range Selector */}
      <div className="bg-white dark:bg-[#0F2038] border border-slate-200 dark:border-slate-800 rounded-2xl p-4 sm:p-5 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-500/15 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold shrink-0">
            <Radio className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-tight">Cloud Platform Operations Center</h2>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/30">
                PROD-ACTIVE
              </span>
            </div>
            <p className="text-slate-500 text-[11px] mt-0.5">
              Workspace: <strong className="text-slate-700 dark:text-slate-300">{dashboardServices?.workspace_name || 'Production Workspace'}</strong> • Multi-Region Control Plane
            </p>
          </div>
        </div>

        {/* Time Range Selector */}
        <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-900 p-1.5 rounded-xl border border-slate-200 dark:border-slate-800 shrink-0">
          {['5m', '15m', '1h', '6h', '24h', '7d'].map((range) => (
            <button
              key={range}
              onClick={() => setSelectedRange(range)}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                selectedRange === range
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              {range}
            </button>
          ))}
          <button
            onClick={fetchDashboardData}
            disabled={loading}
            className="p-1.5 text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer ml-1"
            title="Refresh dashboard telemetry"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Primary SRE Operational Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Service Fleet Health */}
        <div 
          onClick={() => onNavigate?.('applications')}
          className="bg-white dark:bg-[#0F2038] border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm hover:border-blue-500/50 cursor-pointer transition-all"
        >
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-[10px] font-bold uppercase">Services Fleet Health</span>
            <Layers className="w-4 h-4 text-blue-500" />
          </div>
          <div className="flex items-baseline gap-2 mt-2">
            <p className="text-2xl font-black text-slate-900 dark:text-white">{totalServicesCount}</p>
            <span className="text-[11px] text-slate-500">Active Workloads</span>
          </div>
          <div className="flex items-center gap-2 mt-3 text-[11px]">
            <span className="text-emerald-600 font-bold">{healthyApps} Healthy</span>
            <span className="text-slate-300">•</span>
            <span className="text-amber-600 font-bold">{warningApps} Warning</span>
            <span className="text-slate-300">•</span>
            <span className="text-rose-600 font-bold">{criticalApps} Stopped</span>
          </div>
        </div>

        {/* Fleet Resource Utilization */}
        <div 
          onClick={() => onNavigate?.('monitoring')}
          className="bg-white dark:bg-[#0F2038] border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm hover:border-blue-500/50 cursor-pointer transition-all"
        >
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-[10px] font-bold uppercase">Compute & RAM Gauges</span>
            <Cpu className="w-4 h-4 text-purple-500" />
          </div>
          <div className="flex items-baseline gap-2 mt-2">
            <p className="text-2xl font-black text-slate-900 dark:text-white">{metrics?.cpu_usage_percent !== undefined ? metrics.cpu_usage_percent : 0}%</p>
            <span className="text-[11px] text-slate-500">Avg CPU Load</span>
          </div>
          <div className="flex items-center gap-2 mt-3 text-[11px] text-slate-600 dark:text-slate-300">
            <span>RAM: <strong className="text-slate-900 dark:text-white">{metrics?.memory_usage_percent !== undefined ? metrics.memory_usage_percent : 0}%</strong></span>
            <span className="text-slate-300">•</span>
            <span>Disk: <strong className="text-slate-900 dark:text-white">{metrics?.storage_usage_percent !== undefined ? metrics.storage_usage_percent : 0}%</strong></span>
          </div>
        </div>

        {/* FinOps Accrued Spend & Run Rate */}
        <div 
          onClick={() => onNavigate?.('billing')}
          className="bg-white dark:bg-[#0F2038] border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm hover:border-blue-500/50 cursor-pointer transition-all"
        >
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-[10px] font-bold uppercase">FinOps Accrued Spend</span>
            <DollarSign className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="flex items-baseline gap-2 mt-2">
            <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
              ₹{(dashboardServices?.total_accrued_inr ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
            <span className="text-[11px] text-slate-500">(${ (dashboardServices?.total_accrued_usd ?? 0).toFixed(2) } USD)</span>
          </div>
          <div className="flex items-center gap-2 mt-3 text-[11px] text-slate-600 dark:text-slate-300">
            <span>Burn: <strong className="text-slate-900 dark:text-white">₹{(dashboardServices?.monthly_run_rate_inr ?? 0).toLocaleString()}/mo</strong></span>
            <span className="text-slate-300">•</span>
            <span>Latency: <strong className="text-blue-500">{metrics?.p95_latency_ms ?? 0}ms</strong></span>
          </div>
        </div>

        {/* Global Error Rate & SLA */}
        <div 
          onClick={() => onNavigate?.('monitoring')}
          className="bg-white dark:bg-[#0F2038] border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm hover:border-blue-500/50 cursor-pointer transition-all"
        >
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-[10px] font-bold uppercase">Error Rate & SLA</span>
            <ShieldCheck className="w-4 h-4 text-blue-500" />
          </div>
          <div className="flex items-baseline gap-2 mt-2">
            <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400">{metrics?.error_rate_percent !== undefined ? metrics.error_rate_percent : 0}%</p>
            <span className="text-[11px] text-slate-500">HTTP 5xx (SLO &lt; 0.1%)</span>
          </div>
          <div className="flex items-center gap-2 mt-3 text-[11px] text-slate-600 dark:text-slate-300">
            <span>Uptime: <strong className="text-emerald-600 dark:text-emerald-400">{metrics?.uptime_percent !== undefined ? metrics.uptime_percent : 100}%</strong></span>
            <span className="text-slate-300">•</span>
            <span>Monthly SLA: <strong className="text-blue-500">PASS</strong></span>
          </div>
        </div>
      </div>

      {/* ── Section: User's Actual Created Services & Granular Cost Accrual Table ── */}
      <div className="bg-white dark:bg-[#0F2038] border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800/80">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-tight">
                My Active Cloud Services & FinOps Cost Accrual
              </h3>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 dark:bg-blue-500/20 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-500/30">
                {liveServicesList.length} PROVISIONED
              </span>
              {query && (
                <span className="px-2 py-0.5 rounded-md bg-brandGold-500/15 border border-brandGold-500/30 text-brandGold-600 dark:text-brandGold-400 text-[10px] font-bold">
                  {displayedServices.length} match &ldquo;{searchTerm}&rdquo;
                </span>
              )}
            </div>
            <p className="text-slate-500 text-[11px] mt-0.5">
              Live per-service cost tracking, uptime runtime hours, and persistent database inventory
            </p>
          </div>

          <div className="flex items-center gap-2">
            <div className="px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center gap-2">
              <span className="text-[10px] text-slate-400 uppercase font-bold">Total Accrued:</span>
              <strong className="text-emerald-600 dark:text-emerald-400 font-black">
                ₹{(dashboardServices?.total_accrued_inr ?? 0).toFixed(2)}
              </strong>
              <span className="text-slate-400 text-[10px]">(${ (dashboardServices?.total_accrued_usd ?? 0).toFixed(2) })</span>
            </div>
            <button
              onClick={() => onNavigate?.('infrastructure')}
              className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition-colors flex items-center gap-1 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" /> Provision Service
            </button>
          </div>
        </div>

        {liveServicesList.length === 0 ? (
          <div className="py-8 text-center space-y-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-500/15 text-blue-600 dark:text-blue-400 flex items-center justify-center mx-auto">
              <Boxes className="w-5 h-5" />
            </div>
            <div>
              <p className="font-bold text-slate-800 dark:text-slate-200">No active cloud resources in this workspace</p>
              <p className="text-slate-500 text-[11px] max-w-sm mx-auto mt-0.5">
                Provision an ArvCompute VM, launch an ArvDB instance, or deploy an Application to view real-time runtime tracking and FinOps cost accrual.
              </p>
            </div>
            <div className="flex items-center justify-center gap-2 pt-1">
              <button
                onClick={() => onNavigate?.('compute')}
                className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition-colors cursor-pointer flex items-center gap-1"
              >
                <Server className="w-3.5 h-3.5" /> Launch VM
              </button>
              <button
                onClick={() => onNavigate?.('applications')}
                className="px-3.5 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold rounded-xl transition-colors cursor-pointer flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" /> Register App
              </button>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 text-[10px] uppercase font-bold text-slate-400">
                  <th className="pb-2.5">Service Name</th>
                  <th className="pb-2.5">Type & Spec</th>
                  <th className="pb-2.5">Status</th>
                  <th className="pb-2.5">Provisioned At</th>
                  <th className="pb-2.5">Runtime</th>
                  <th className="pb-2.5">Hourly Rate</th>
                  <th className="pb-2.5 text-right">Cost Accrued</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 text-xs">
                {displayedServices.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-slate-400 font-sans">
                      No services match &ldquo;<strong className="text-slate-200">{searchTerm}</strong>&rdquo;
                    </td>
                  </tr>
                ) : (
                  displayedServices.map((svc: any) => (
                    <tr key={svc.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/30 transition-colors">
                      <td className="py-3 pr-3">
                        <div className="flex items-center gap-2.5">
                          <div className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800">
                            {getCategoryIcon(svc.category)}
                          </div>
                          <div>
                            <strong className="text-slate-900 dark:text-white font-bold block">{svc.name}</strong>
                            <span className="text-[10px] text-slate-400">{svc.service_type}</span>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 pr-3 text-slate-600 dark:text-slate-300 font-mono text-[11px]">
                        {svc.spec}
                      </td>
                      <td className="py-3 pr-3">
                        <StatusBadge status={svc.status} size="sm" />
                      </td>
                      <td className="py-3 pr-3 text-slate-500 text-[11px]">
                        {formatTimestamp(svc.created_at)}
                      </td>
                      <td className="py-3 pr-3 text-slate-600 dark:text-slate-300 text-[11px]">
                        <span className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 font-bold">
                          {svc.runtime_hours} hrs
                        </span>
                      </td>
                      <td className="py-3 pr-3 text-slate-600 dark:text-slate-300 text-[11px]">
                        ₹{svc.hourly_rate_inr}/hr
                        <span className="text-[10px] text-slate-400 block">${svc.hourly_rate_usd}/hr</span>
                      </td>
                      <td className="py-3 text-right">
                        <strong className="text-emerald-600 dark:text-emerald-400 font-black text-xs block">
                          ₹{svc.accrued_cost_inr.toFixed(2)}
                        </strong>
                        <span className="text-[10px] text-slate-400 font-mono">
                          ${svc.accrued_cost_usd.toFixed(2)} USD
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Main Center Grid: Time-Series Chart & Firing Alerts Queue */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Real-Time Telemetry Time-Series Chart */}
            <div className="lg:col-span-2 bg-white dark:bg-[#0F2038] border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div>
                  <h3 className="text-sm font-black text-slate-900 dark:text-white">Fleet Telemetry & Resource Demand</h3>
                  <p className="text-slate-500 text-[11px]">Time-series metrics across {selectedRange} window</p>
                </div>
                <div className="flex items-center gap-3 text-[10px] font-bold">
                  <span className="flex items-center gap-1 text-blue-500">
                    <span className="w-2.5 h-2.5 rounded-full bg-blue-500" /> CPU Load %
                  </span>
                  <span className="flex items-center gap-1 text-purple-500">
                    <span className="w-2.5 h-2.5 rounded-full bg-purple-500" /> Memory RAM %
                  </span>
                  <span className="flex items-center gap-1 text-emerald-500">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" /> P95 Latency (ms)
                  </span>
                </div>
              </div>

              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={timeseries}>
                    <defs>
                      <linearGradient id="dashCpuGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#2563eb" stopOpacity={0.25}/>
                        <stop offset="95%" stopColor="#2563eb" stopOpacity={0}/>
                      </linearGradient>
                      <linearGradient id="dashRamGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.25}/>
                        <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.3} />
                    <XAxis dataKey="time_label" stroke="#64748b" tick={{ fontSize: 10 }} />
                    <YAxis stroke="#64748b" tick={{ fontSize: 10 }} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '0.75rem', fontSize: '11px', color: '#fff' }}
                    />
                    <Area type="monotone" dataKey="cpu" name="CPU %" stroke="#2563eb" strokeWidth={2} fillOpacity={1} fill="url(#dashCpuGrad)" />
                    <Area type="monotone" dataKey="memory" name="RAM %" stroke="#8b5cf6" strokeWidth={2} fillOpacity={1} fill="url(#dashRamGrad)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Firing Alerts Queue */}
            <div className="bg-white dark:bg-[#0F2038] border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-4 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-black text-slate-900 dark:text-white">Active Alerts Queue</h3>
                  <button
                    onClick={() => onNavigate?.('alerts')}
                    className="text-blue-600 dark:text-blue-400 hover:underline text-[11px] font-bold flex items-center gap-1 cursor-pointer"
                  >
                    Alertmanager <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="space-y-2.5 mt-3">
                  {firingAlerts.slice(0, 3).map((alt) => (
                    <div
                      key={alt.id}
                      onClick={() => onNavigate?.('alerts')}
                      className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 hover:border-blue-500/40 transition-colors cursor-pointer space-y-1"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-900 dark:text-white truncate max-w-[160px]">{alt.title}</span>
                        <StatusBadge status={alt.severity} size="sm" />
                      </div>
                      <p className="text-[11px] text-slate-500 truncate">{alt.message}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 dark:border-slate-800/80">
                <button
                  onClick={() => onNavigate?.('automation')}
                  className="w-full py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold rounded-xl text-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Zap className="w-3.5 h-3.5 text-blue-500" /> Run Automated Self-Healing Runbooks
                </button>
              </div>
            </div>
          </div>

          {/* Bottom Grid: Recent Deployments Feed & SRE Health Matrix */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Recent Deployments & Rollbacks Feed */}
            <div className="bg-white dark:bg-[#0F2038] border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-black text-slate-900 dark:text-white">Recent Deployments & Rollback Activity</h3>
                  <p className="text-slate-500 text-[11px]">GitOps release pipeline events</p>
                </div>
                <button
                  onClick={() => onNavigate?.('deployments')}
                  className="text-blue-600 dark:text-blue-400 hover:underline text-[11px] font-bold flex items-center gap-1 cursor-pointer"
                >
                  Pipeline Console <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="space-y-2.5">
                {deployments.slice(0, 4).map((dep) => (
                  <div
                    key={dep.id}
                    onClick={() => onNavigate?.('deployments')}
                    className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3 hover:border-blue-500/40 transition-colors cursor-pointer"
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <strong className="text-slate-900 dark:text-white">{dep.application_name}</strong>
                        <span className="px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-800 text-[10px] text-slate-700 dark:text-slate-300 font-bold">
                          {dep.version}
                        </span>
                        <span className="text-[10px] text-purple-600 dark:text-purple-400 font-bold uppercase">{dep.environment}</span>
                      </div>
                      <p className="text-[11px] text-slate-500 truncate mt-0.5" title={dep.commit_message}>
                        {dep.commit_hash} • {dep.commit_message}
                      </p>
                    </div>

                    <StatusBadge status={dep.status} size="sm" />
                  </div>
                ))}
              </div>
            </div>

            {/* SRE Health & Microservices Matrix */}
            <div className="bg-white dark:bg-[#0F2038] border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-black text-slate-900 dark:text-white">Platform Services Matrix</h3>
                  <p className="text-slate-500 text-[11px]">Heartbeat & latency status</p>
                </div>
                <button
                  onClick={() => onNavigate?.('settings')}
                  className="text-blue-600 dark:text-blue-400 hover:underline text-[11px] font-bold flex items-center gap-1 cursor-pointer"
                >
                  Settings <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                {health?.services?.slice(0, 6).map((svc: any) => (
                  <div 
                    key={svc.name}
                    className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 flex items-center justify-between"
                  >
                    <div>
                      <span className="font-bold text-slate-900 dark:text-white">{svc.name}</span>
                      <p className="text-[10px] text-slate-400">{svc.latency_ms}ms</p>
                    </div>
                    <StatusBadge status={svc.status} size="sm" />
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Workspace Work & Action Audit Trail */}
          <div className="bg-white dark:bg-[#0F2038] border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-black text-slate-900 dark:text-white">Workspace Work History & Infrastructure Audit Trail</h3>
                <p className="text-slate-500 text-[11px]">Real chronological log of user operations with exact timestamps</p>
              </div>
              <button
                onClick={() => onNavigate?.('audit')}
                className="text-blue-600 dark:text-blue-400 hover:underline text-[11px] font-bold flex items-center gap-1 cursor-pointer"
              >
                Full Audit Log <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {(!dashboardServices?.work_history || dashboardServices.work_history.length === 0) ? (
              <div className="py-4 text-center text-slate-500 text-xs">
                No recent workspace operations recorded yet.
              </div>
            ) : (
              <div className="divide-y divide-slate-100 dark:divide-slate-800/60">
                {dashboardServices.work_history.slice(0, 6).map((log: any) => (
                  <div key={log.id} className="py-2.5 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className="px-2 py-0.5 rounded bg-blue-50 dark:bg-blue-500/20 text-blue-700 dark:text-blue-400 text-[10px] font-bold shrink-0">
                        {log.action}
                      </span>
                      <div className="min-w-0">
                        <p className="text-slate-800 dark:text-slate-200 font-bold truncate text-[11px]">
                          {log.details || log.resource}
                        </p>
                        <span className="text-[10px] text-slate-400 truncate block">
                          Actor: {log.user_email} • Resource: {log.resource}
                        </span>
                      </div>
                    </div>
                    <span className="text-[11px] text-slate-400 shrink-0 font-mono">
                      {formatTimestamp(log.timestamp)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
    </div>
  );
};
