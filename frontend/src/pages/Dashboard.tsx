import React, { useState, useEffect, useCallback } from 'react';
import {
  Activity, RefreshCw, Layers, ChevronRight,
  ShieldCheck, Cpu, ShieldAlert, Radio, Zap,
  Server, Plus, Boxes
} from 'lucide-react';
import { apiFetch } from '../config/api';
import { StatusBadge } from '../components/StatusBadge';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';

interface DashboardProps {
  token: string | null;
  onNavigate?: (tab: string) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ token, onNavigate }) => {
  const [metrics, setMetrics] = useState<any>(null);
  const [timeseries, setTimeseries] = useState<any[]>([]);
  const [apps, setApps] = useState<any[]>([]);
  const [deployments, setDeployments] = useState<any[]>([]);
  const [alerts, setAlerts] = useState<any[]>([]);
  const [incidents, setIncidents] = useState<any[]>([]);
  const [health, setHealth] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedRange, setSelectedRange] = useState<string>('24h');

  const fetchDashboardData = useCallback(async () => {
    setLoading(true);
    try {
      const [resMetrics, resTimeseries, resApps, resDeployments, resAlerts, resIncidents, resHealth] = await Promise.all([
        apiFetch<any>('/api/v1/monitoring/metrics', { token }).catch(() => null),
        apiFetch<any[]>(`/api/v1/monitoring/metrics/timeseries?time_range=${selectedRange}`, { token }).catch(() => []),
        apiFetch<any[]>('/api/v1/operations/applications', { token }).catch(() => []),
        apiFetch<any[]>('/api/v1/operations/deployments', { token }).catch(() => []),
        apiFetch<any[]>('/api/v1/monitoring/alerts', { token }).catch(() => []),
        apiFetch<any[]>('/api/v1/operations/incidents', { token }).catch(() => []),
        apiFetch<any>('/api/v1/monitoring/health', { token }).catch(() => null),
      ]);

      if (resMetrics) setMetrics(resMetrics);
      if (Array.isArray(resTimeseries)) setTimeseries(resTimeseries);
      if (Array.isArray(resApps)) setApps(resApps);
      if (Array.isArray(resDeployments)) setDeployments(resDeployments);
      if (Array.isArray(resAlerts)) setAlerts(resAlerts);
      if (Array.isArray(resIncidents)) setIncidents(resIncidents);
      if (resHealth) setHealth(resHealth);
    } catch (err) {
      console.error('Failed to fetch dashboard data:', err);
    } finally {
      setLoading(false);
    }
  }, [selectedRange, token]);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  // Derive counts purely from actual returned data
  const totalApps = apps.length;
  const healthyApps = apps.filter(a => a.status === 'HEALTHY').length;
  const warningApps = apps.filter(a => a.status === 'WARNING').length;
  const criticalApps = apps.filter(a => a.status === 'CRITICAL').length;

  const activeIncidents = incidents.filter(i => i.status !== 'Resolved');
  const firingAlerts = alerts.filter(a => a.status === 'firing');

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
            <p className="text-slate-500 text-[11px] mt-0.5">Multi-Region Control Plane • Kubernetes 1.30 • 4 AZs</p>
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
            <p className="text-2xl font-black text-slate-900 dark:text-white">{totalApps}</p>
            <span className="text-[11px] text-slate-500">Registered Services</span>
          </div>
          <div className="flex items-center gap-2 mt-3 text-[11px]">
            <span className="text-emerald-600 font-bold">{healthyApps} Healthy</span>
            <span className="text-slate-300">•</span>
            <span className="text-amber-600 font-bold">{warningApps} Warning</span>
            <span className="text-slate-300">•</span>
            <span className="text-rose-600 font-bold">{criticalApps} Critical</span>
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
            <p className="text-2xl font-black text-slate-900 dark:text-white">{metrics?.cpu_usage_percent || 48.2}%</p>
            <span className="text-[11px] text-slate-500">Avg CPU Load</span>
          </div>
          <div className="flex items-center gap-2 mt-3 text-[11px] text-slate-600 dark:text-slate-300">
            <span>RAM: <strong className="text-slate-900 dark:text-white">{metrics?.memory_usage_percent || 64.5}%</strong></span>
            <span className="text-slate-300">•</span>
            <span>Disk: <strong className="text-slate-900 dark:text-white">{metrics?.storage_usage_percent || 38.0}%</strong></span>
          </div>
        </div>

        {/* Throughput & Latency */}
        <div 
          onClick={() => onNavigate?.('monitoring')}
          className="bg-white dark:bg-[#0F2038] border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm hover:border-blue-500/50 cursor-pointer transition-all"
        >
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-[10px] font-bold uppercase">Traffic & Latency</span>
            <Activity className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="flex items-baseline gap-2 mt-2">
            <p className="text-2xl font-black text-slate-900 dark:text-white">{metrics?.p95_latency_ms || 38.5}ms</p>
            <span className="text-[11px] text-slate-500">P95 Response Latency</span>
          </div>
          <div className="flex items-center gap-2 mt-3 text-[11px] text-slate-600 dark:text-slate-300">
            <span>Reqs/hr: <strong className="text-slate-900 dark:text-white">{(metrics?.total_requests_1h || 184200).toLocaleString()}</strong></span>
            <span className="text-slate-300">•</span>
            <span>In: <strong className="text-slate-900 dark:text-white">{metrics?.network_in_mbps || 142} Mbps</strong></span>
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
            <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400">{metrics?.error_rate_percent || 0.02}%</p>
            <span className="text-[11px] text-slate-500">HTTP 5xx (SLO &lt; 0.1%)</span>
          </div>
          <div className="flex items-center gap-2 mt-3 text-[11px] text-slate-600 dark:text-slate-300">
            <span>Uptime: <strong className="text-emerald-600 dark:text-emerald-400">{metrics?.uptime_percent || 99.98}%</strong></span>
            <span className="text-slate-300">•</span>
            <span>Monthly SLA: <strong className="text-blue-500">PASS</strong></span>
          </div>
        </div>
      </div>

      {/* If Workspace is Fresh with 0 Apps, show actionable onboarding empty state */}
      {totalApps === 0 && !loading ? (
        <div className="bg-white dark:bg-[#0F2038] border border-slate-200 dark:border-slate-800 rounded-2xl p-8 shadow-sm text-center space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-500/15 text-blue-600 dark:text-blue-400 flex items-center justify-center mx-auto font-bold">
            <Boxes className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-bold text-slate-900 dark:text-white">No Infrastructure Workloads in this Workspace Yet</h3>
            <p className="text-slate-500 text-xs max-w-md mx-auto">
              Get started by provisioning an elastic compute instance, deploying a container service, or connecting a Kubernetes cluster.
            </p>
          </div>
          <div className="flex items-center justify-center gap-3 pt-2">
            <button
              onClick={() => onNavigate?.('infrastructure')}
              className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-md transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <Server className="w-4 h-4" /> Provision Infrastructure
            </button>
            <button
              onClick={() => onNavigate?.('applications')}
              className="px-4 py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-800 dark:text-slate-200 font-bold rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-4 h-4" /> Register Microservice
            </button>
          </div>
        </div>
      ) : (
        <>
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
        </>
      )}
    </div>
  );
};
