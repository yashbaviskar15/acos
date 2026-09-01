import React, { useState, useEffect, useCallback } from 'react';
import { 
  Activity, 
  RefreshCw, 
  Cpu, 
  HardDrive, 
  Network
} from 'lucide-react';
import { apiFetch } from '../config/api';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, LineChart, Line
} from 'recharts';

export const Monitoring: React.FC<{ token: string | null }> = ({ token }) => {
  const [metrics, setMetrics] = useState<any>(null);
  const [timeseries, setTimeseries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRange, setSelectedRange] = useState<string>('24h');

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [m, ts] = await Promise.all([
        apiFetch<any>('/api/v1/monitoring/metrics', { token }).catch(() => null),
        apiFetch<any[]>(`/api/v1/monitoring/metrics/timeseries?time_range=${selectedRange}`, { token }).catch(() => []),
      ]);
      if (m) setMetrics(m);
      if (Array.isArray(ts)) setTimeseries(ts);
    } catch (err) {
      console.error('Failed to fetch monitoring telemetry:', err);
    } finally {
      setLoading(false);
    }
  }, [selectedRange, token]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return (
    <div className="space-y-6 font-mono text-xs">
      {/* Top Header & Range Controls */}
      <div className="bg-white dark:bg-[#0F2038] border border-slate-200 dark:border-slate-800 rounded-2xl p-4 sm:p-5 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <Activity className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            <h2 className="text-base font-black text-slate-900 dark:text-white uppercase tracking-tight">
              ArvWatch Observability Hub & Telemetry Engine
            </h2>
          </div>
          <p className="text-slate-500 text-[11px] mt-0.5">Real-time SRE metrics, P95 latency distribution, and throughput</p>
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
            onClick={fetchData}
            disabled={loading}
            className="p-1.5 text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer ml-1"
            title="Refresh telemetry"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* SRE KPI Metric Gauges */}
      {metrics && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white dark:bg-[#0F2038] border border-slate-200 dark:border-slate-800 p-4 rounded-2xl shadow-sm">
            <div className="flex justify-between items-center text-slate-500 text-[10px] font-bold uppercase">
              <span>Fleet CPU Load</span>
              <Cpu className="w-4 h-4 text-blue-500" />
            </div>
            <p className="text-2xl font-black text-slate-900 dark:text-white mt-1">{metrics.cpu_usage_percent}%</p>
            <div className="w-full bg-slate-200 dark:bg-slate-800 h-1.5 rounded-full mt-2 overflow-hidden">
              <div className="bg-blue-500 h-full" style={{ width: `${metrics.cpu_usage_percent}%` }} />
            </div>
          </div>

          <div className="bg-white dark:bg-[#0F2038] border border-slate-200 dark:border-slate-800 p-4 rounded-2xl shadow-sm">
            <div className="flex justify-between items-center text-slate-500 text-[10px] font-bold uppercase">
              <span>RAM Allocation</span>
              <HardDrive className="w-4 h-4 text-purple-500" />
            </div>
            <p className="text-2xl font-black text-purple-600 dark:text-purple-400 mt-1">{metrics.memory_usage_percent}%</p>
            <div className="w-full bg-slate-200 dark:bg-slate-800 h-1.5 rounded-full mt-2 overflow-hidden">
              <div className="bg-purple-500 h-full" style={{ width: `${metrics.memory_usage_percent}%` }} />
            </div>
          </div>

          <div className="bg-white dark:bg-[#0F2038] border border-slate-200 dark:border-slate-800 p-4 rounded-2xl shadow-sm">
            <div className="flex justify-between items-center text-slate-500 text-[10px] font-bold uppercase">
              <span>P95 HTTP Latency</span>
              <Activity className="w-4 h-4 text-emerald-500" />
            </div>
            <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1">{metrics.p95_latency_ms} ms</p>
            <p className="text-[10px] text-slate-400 mt-1">SLO target: &lt; 200ms</p>
          </div>

          <div className="bg-white dark:bg-[#0F2038] border border-slate-200 dark:border-slate-800 p-4 rounded-2xl shadow-sm">
            <div className="flex justify-between items-center text-slate-500 text-[10px] font-bold uppercase">
              <span>Network In / Out</span>
              <Network className="w-4 h-4 text-blue-500" />
            </div>
            <p className="text-2xl font-black text-slate-900 dark:text-white mt-1">{metrics.network_in_mbps} Mbps</p>
            <p className="text-[10px] text-slate-400 mt-1">Outbound: {metrics.network_out_mbps} Mbps</p>
          </div>
        </div>
      )}

      {/* Chart 1: CPU, Memory, & Disk I/O Utilization */}
      <div className="bg-white dark:bg-[#0F2038] border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div>
            <h3 className="text-sm font-black text-slate-900 dark:text-white">Compute, Memory, & Disk I/O Saturation</h3>
            <p className="text-slate-500 text-[11px]">Aggregated cluster utilization over {selectedRange}</p>
          </div>
          <div className="flex items-center gap-3 text-[10px] font-bold">
            <span className="flex items-center gap-1 text-blue-500">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-500" /> CPU Load %
            </span>
            <span className="flex items-center gap-1 text-purple-500">
              <span className="w-2.5 h-2.5 rounded-full bg-purple-500" /> RAM Memory %
            </span>
            <span className="flex items-center gap-1 text-amber-500">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500" /> Disk I/O %
            </span>
          </div>
        </div>

        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={timeseries}>
              <defs>
                <linearGradient id="monCpuGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#2563eb" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#2563eb" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="monRamGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.3} />
              <XAxis dataKey="time_label" stroke="#64748b" tick={{ fontSize: 10 }} />
              <YAxis stroke="#64748b" tick={{ fontSize: 10 }} />
              <Tooltip 
                contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '0.75rem', fontSize: '11px', color: '#fff' }}
              />
              <Area type="monotone" dataKey="cpu" name="CPU %" stroke="#2563eb" strokeWidth={2} fillOpacity={1} fill="url(#monCpuGrad)" />
              <Area type="monotone" dataKey="memory" name="RAM %" stroke="#8b5cf6" strokeWidth={2} fillOpacity={1} fill="url(#monRamGrad)" />
              <Area type="monotone" dataKey="disk_io" name="Disk I/O %" stroke="#f59e0b" strokeWidth={1.5} fill="none" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Chart 2: Request Rate & Latency Response */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-[#0F2038] border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
          <div>
            <h3 className="text-sm font-black text-slate-900 dark:text-white">HTTP Request Volume & Throughput</h3>
            <p className="text-slate-500 text-[11px]">Requests ingested across edge proxies</p>
          </div>
          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={timeseries}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.3} />
                <XAxis dataKey="time_label" stroke="#64748b" tick={{ fontSize: 10 }} />
                <YAxis stroke="#64748b" tick={{ fontSize: 10 }} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '0.75rem', fontSize: '11px', color: '#fff' }}
                />
                <Bar dataKey="requests" name="Requests" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white dark:bg-[#0F2038] border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
          <div>
            <h3 className="text-sm font-black text-slate-900 dark:text-white">P95 Latency & Error Rate Profile</h3>
            <p className="text-slate-500 text-[11px]">Millisecond latency and 5xx percentages</p>
          </div>
          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={timeseries}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.3} />
                <XAxis dataKey="time_label" stroke="#64748b" tick={{ fontSize: 10 }} />
                <YAxis stroke="#64748b" tick={{ fontSize: 10 }} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '0.75rem', fontSize: '11px', color: '#fff' }}
                />
                <Line type="monotone" dataKey="p95_latency" name="P95 ms" stroke="#10b981" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="errors" name="Errors" stroke="#ef4444" strokeWidth={1.5} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};
