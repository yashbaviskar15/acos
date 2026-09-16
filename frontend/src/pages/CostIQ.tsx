import React, { useState, useEffect, useCallback } from 'react';
import {
  TrendingUp, DollarSign, AlertTriangle,
  RefreshCw, Zap, PiggyBank
} from 'lucide-react';
import { apiFetch } from '../config/api';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';

interface CostIQProps {
  token: string | null;
}

export const CostIQ: React.FC<CostIQProps> = ({ token }) => {
  const [forecast, setForecast] = useState<any>(null);
  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [history, setHistory] = useState<any[]>([]);
  const [anomalies, setAnomalies] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeView, setActiveView] = useState<'overview' | 'forecast' | 'recommendations' | 'budgets'>('overview');

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [f, r, h, a] = await Promise.all([
        apiFetch<any>('/api/v1/costiq/forecast', { token }).catch(() => null),
        apiFetch<any[]>('/api/v1/costiq/recommendations', { token }).catch(() => []),
        apiFetch<any[]>('/api/v1/costiq/history', { token }).catch(() => []),
        apiFetch<any[]>('/api/v1/costiq/anomalies', { token }).catch(() => []),
      ]);
      if (f) setForecast(f);
      if (Array.isArray(r)) setRecommendations(r);
      if (Array.isArray(h)) setHistory(h);
      if (Array.isArray(a)) setAnomalies(a);
    } catch (err) {
      console.error('CostIQ fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const totalSavings = recommendations.reduce((sum, r) => sum + (r.estimated_savings || 0), 0);

  return (
    <div className="space-y-6 font-mono text-xs">
      {/* Header */}
      <div className="bg-white dark:bg-[#0F2038] border border-slate-200 dark:border-slate-800 rounded-2xl p-4 sm:p-5 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <TrendingUp className="w-5 h-5 text-brandGold-500" />
            <h2 className="text-base font-black text-slate-900 dark:text-white uppercase tracking-tight">
              ArvCostIQ — Predictive Cost Intelligence
            </h2>
            <span className="px-2 py-0.5 text-[10px] font-bold bg-brandGold-500/10 text-brandGold-500 rounded-full border border-brandGold-500/20">v2.0</span>
          </div>
          <p className="text-slate-500 text-[11px] mt-0.5">30-day bill forecast, savings recommendations, and budget autopilot</p>
        </div>
        <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-900 p-1.5 rounded-xl border border-slate-200 dark:border-slate-800 shrink-0">
          {(['overview', 'forecast', 'recommendations', 'budgets'] as const).map((v) => (
            <button key={v} onClick={() => setActiveView(v)}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer capitalize ${
                activeView === v ? 'bg-brandGold-500 text-white shadow-sm' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}>{v}</button>
          ))}
          <button onClick={fetchData} disabled={loading} className="p-1.5 text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer ml-1" title="Refresh">
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: 'Current Month Spend', value: forecast?.current_spend ? `₹${forecast.current_spend.toLocaleString()}` : '₹0', icon: DollarSign, color: 'blue', sub: 'MTD actual' },
          { label: '30-Day Forecast', value: forecast?.predicted_amount ? `₹${forecast.predicted_amount.toLocaleString()}` : '—', icon: TrendingUp, color: 'amber', sub: `${forecast?.confidence ? Math.round(forecast.confidence * 100) : 0}% confidence` },
          { label: 'Potential Savings', value: `₹${totalSavings.toLocaleString()}`, icon: PiggyBank, color: 'emerald', sub: `${recommendations.length} recommendations` },
          { label: 'Active Anomalies', value: String(anomalies.filter(a => a.status === 'active').length), icon: AlertTriangle, color: 'red', sub: 'Needs investigation' },
        ].map((kpi) => (
          <div key={kpi.label} className="bg-white dark:bg-[#0F2038] border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <span className="text-slate-500 text-[10px] uppercase tracking-wider font-bold">{kpi.label}</span>
              <kpi.icon className={`w-4 h-4 text-${kpi.color}-500`} />
            </div>
            <p className="text-xl font-black text-slate-900 dark:text-white">{kpi.value}</p>
            <p className="text-[10px] text-slate-500 mt-1">{kpi.sub}</p>
          </div>
        ))}
      </div>

      {/* Spending Trend Chart */}
      {history.length > 0 && (
        <div className="bg-white dark:bg-[#0F2038] border border-slate-200 dark:border-slate-800 rounded-2xl p-4 sm:p-5 shadow-sm">
          <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider mb-4">Monthly Spending Trend</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={history}>
                <defs>
                  <linearGradient id="costGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#B98B3B" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#B98B3B" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" />
                <XAxis dataKey="month" tick={{ fill: '#94A3B8', fontSize: 10 }} />
                <YAxis tick={{ fill: '#94A3B8', fontSize: 10 }} tickFormatter={(v) => `₹${(v/1000).toFixed(0)}k`} />
                <Tooltip contentStyle={{ background: '#0F2038', border: '1px solid #334155', borderRadius: 8 }} labelStyle={{ color: '#B98B3B' }} />
                <Area type="monotone" dataKey="amount" stroke="#B98B3B" fill="url(#costGradient)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Recommendations */}
      {recommendations.length > 0 && (
        <div className="bg-white dark:bg-[#0F2038] border border-slate-200 dark:border-slate-800 rounded-2xl p-4 sm:p-5 shadow-sm">
          <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider mb-4 flex items-center gap-2">
            <Zap className="w-4 h-4 text-emerald-500" /> Savings Recommendations
          </h3>
          <div className="space-y-2">
            {recommendations.map((rec) => (
              <div key={rec.id} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-200 dark:border-slate-800">
                <div className="flex-1">
                  <p className="text-xs font-bold text-slate-900 dark:text-white">{rec.title}</p>
                  <p className="text-[10px] text-slate-500 mt-0.5">{rec.description}</p>
                </div>
                <div className="text-right ml-4 shrink-0">
                  <p className="text-sm font-black text-emerald-500">-₹{(rec.estimated_savings || 0).toLocaleString()}/mo</p>
                  <span className={`inline-block mt-1 px-2 py-0.5 text-[9px] font-bold rounded-full ${
                    rec.recommendation_type === 'rightsize' ? 'bg-blue-500/10 text-blue-500' :
                    rec.recommendation_type === 'spot' ? 'bg-purple-500/10 text-purple-500' :
                    rec.recommendation_type === 'schedule' ? 'bg-amber-500/10 text-amber-500' :
                    'bg-red-500/10 text-red-500'
                  }`}>{rec.recommendation_type}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Anomalies */}
      {anomalies.length > 0 && (
        <div className="bg-white dark:bg-[#0F2038] border border-slate-200 dark:border-slate-800 rounded-2xl p-4 sm:p-5 shadow-sm">
          <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider mb-4 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-red-500" /> Cost Anomalies
          </h3>
          <div className="space-y-2">
            {anomalies.map((a) => (
              <div key={a.id} className="flex items-center justify-between p-3 bg-red-500/5 rounded-xl border border-red-500/20">
                <div>
                  <p className="text-xs font-bold text-slate-900 dark:text-white">{a.description}</p>
                  <p className="text-[10px] text-slate-500 mt-0.5">Expected: ₹{a.expected_cost} → Actual: ₹{a.actual_cost}</p>
                </div>
                <span className={`px-2 py-0.5 text-[9px] font-bold rounded-full ${
                  a.severity === 'critical' ? 'bg-red-500/10 text-red-500' : 'bg-amber-500/10 text-amber-500'
                }`}>{a.severity}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {loading && (
        <div className="text-center py-12 text-slate-500">
          <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2" />
          <p className="text-xs">Loading cost intelligence...</p>
        </div>
      )}
    </div>
  );
};
