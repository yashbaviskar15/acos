import React, { useState, useEffect } from 'react';
import { Activity, AlertTriangle, CheckCircle, RefreshCw } from 'lucide-react';

interface MonitoringProps {
  token: string | null;
}

export const Monitoring: React.FC<MonitoringProps> = ({ token }) => {
  const [metrics, setMetrics] = useState<any>(null);
  const [alerts, setAlerts] = useState<any[]>([]);
  const [health, setHealth] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const authHeaders: Record<string, string> = token ? { 'Authorization': `Bearer ${token}` } : {};

  const fetchData = async () => {
    setLoading(true);
    try {
      const mRes = await fetch('/api/v1/monitoring/metrics', { headers: authHeaders });
      if (mRes.ok) setMetrics(await mRes.json());

      const aRes = await fetch('/api/v1/monitoring/alerts', { headers: authHeaders });
      if (aRes.ok) setAlerts(await aRes.json());

      const hRes = await fetch('/api/v1/monitoring/health', { headers: authHeaders });
      if (hRes.ok) setHealth(await hRes.json());
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [token]);

  const handleAlertAction = async (alertId: string, action: 'acknowledge' | 'resolve') => {
    try {
      const res = await fetch(`/api/v1/monitoring/alerts/${alertId}/${action}`, {
        method: 'POST',
        headers: authHeaders
      });
      if (res.ok) fetchData();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="p-4 sm:p-6 space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white dark:bg-[#0F2038] border border-slate-200 dark:border-slate-800 p-5 rounded-2xl shadow-sm">
        <div>
          <h2 className="text-base sm:text-lg font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <Activity className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            ArvWatch System Monitoring & Alerting
          </h2>
          <p className="text-xs text-slate-600 dark:text-slate-400 font-mono mt-0.5">Real-time microservice health, Alertmanager rules, and telemetry</p>
        </div>

        <button
          onClick={fetchData}
          className="p-2.5 text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-900 hover:bg-slate-200 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 rounded-xl transition-colors cursor-pointer"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Metrics Row */}
      {metrics && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 font-mono">
          <div className="bg-white dark:bg-[#0F2038] border border-slate-200 dark:border-slate-800 p-5 rounded-2xl shadow-sm">
            <span className="text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase">Requests / Hour</span>
            <p className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white mt-1">{metrics.total_requests_1h.toLocaleString()}</p>
          </div>
          <div className="bg-white dark:bg-[#0F2038] border border-slate-200 dark:border-slate-800 p-5 rounded-2xl shadow-sm">
            <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold uppercase">System Uptime</span>
            <p className="text-2xl sm:text-3xl font-black text-emerald-600 dark:text-emerald-400 mt-1">{metrics.uptime_percent}%</p>
          </div>
          <div className="bg-white dark:bg-[#0F2038] border border-slate-200 dark:border-slate-800 p-5 rounded-2xl shadow-sm">
            <span className="text-[10px] text-blue-600 dark:text-blue-400 font-bold uppercase">P95 Latency</span>
            <p className="text-2xl sm:text-3xl font-black text-blue-600 dark:text-blue-400 mt-1">{metrics.p95_latency_ms} ms</p>
          </div>
          <div className="bg-white dark:bg-[#0F2038] border border-slate-200 dark:border-slate-800 p-5 rounded-2xl shadow-sm">
            <span className="text-[10px] text-purple-600 dark:text-purple-400 font-bold uppercase">Error Rate</span>
            <p className="text-2xl sm:text-3xl font-black text-purple-600 dark:text-purple-400 mt-1">{metrics.error_rate_percent}%</p>
          </div>
        </div>
      )}

      {/* Main Grid: Active Alerts & Health Status */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Active Alert Center */}
        <div className="bg-white dark:bg-[#0F2038] border border-slate-200 dark:border-slate-800 rounded-2xl p-5 space-y-4 shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
            <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider font-mono flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-500" />
              Active System Alert Center
            </h3>
            <span className="px-2.5 py-0.5 bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 text-amber-700 dark:text-amber-400 rounded-full text-xs font-mono font-bold">
              {alerts.filter(a => a.status === 'firing').length} Firing
            </span>
          </div>

          <div className="space-y-3">
            {alerts.map((a) => (
              <div
                key={a.id}
                className={`p-4 rounded-xl border text-xs space-y-2 ${
                  a.severity === 'critical'
                    ? 'bg-red-50 dark:bg-red-500/10 border-red-200 dark:border-red-500/30'
                    : (a.severity === 'warning' ? 'bg-amber-50 dark:bg-amber-500/10 border-amber-200 dark:border-amber-500/30' : 'bg-blue-50 dark:bg-blue-500/10 border-blue-200 dark:border-blue-500/30')
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${a.severity === 'critical' ? 'bg-red-500 animate-ping' : 'bg-amber-500'}`}></span>
                    {a.title}
                  </span>
                  <span className="font-mono text-[10px] font-bold uppercase px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-900 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-800">
                    {a.service}
                  </span>
                </div>

                <p className="text-slate-600 dark:text-slate-300 font-mono text-[11px] leading-relaxed">{a.message}</p>

                <div className="flex items-center justify-between pt-2 border-t border-slate-200 dark:border-slate-800/60 text-[10px] font-mono text-slate-500 dark:text-slate-400">
                  <span>Fired at: {a.fired_at.split('T')[1].slice(0, 5)} UTC</span>
                  {a.status === 'firing' && (
                    <div className="space-x-2">
                      <button
                        onClick={() => handleAlertAction(a.id, 'acknowledge')}
                        className="px-2.5 py-1 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold rounded-lg cursor-pointer"
                      >
                        Ack
                      </button>
                      <button
                        onClick={() => handleAlertAction(a.id, 'resolve')}
                        className="px-2.5 py-1 bg-emerald-50 dark:bg-emerald-500/20 hover:bg-emerald-100 dark:hover:bg-emerald-500/30 text-emerald-700 dark:text-emerald-400 font-bold rounded-lg cursor-pointer"
                      >
                        Resolve
                      </button>
                    </div>
                  )}
                  {a.status !== 'firing' && (
                    <span className="text-emerald-600 dark:text-emerald-400 font-bold uppercase">{a.status}</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Microservices Health Matrix */}
        <div className="bg-white dark:bg-[#0F2038] border border-slate-200 dark:border-slate-800 rounded-2xl p-5 space-y-4 shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
            <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider font-mono flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              Microservice Health Matrix
            </h3>
            {health && (
              <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-emerald-50 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/30">
                {health.overall}
              </span>
            )}
          </div>

          <div className="divide-y divide-slate-200 dark:divide-slate-800/80 font-mono">
            {health?.services?.map((svc: any, i: number) => (
              <div key={i} className="py-3 flex items-center justify-between text-xs">
                <span className="font-bold text-slate-900 dark:text-slate-200">{svc.name}</span>
                <div className="flex items-center gap-4 text-[11px]">
                  <span className="text-slate-500 dark:text-slate-400 font-bold">{svc.latency_ms} ms</span>
                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                    svc.status === 'healthy' ? 'bg-emerald-50 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/30' : 'bg-amber-50 dark:bg-amber-500/20 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-500/30'
                  }`}>
                    {svc.status.toUpperCase()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
