import React, { useState, useEffect, useCallback } from 'react';
import {
  HeartPulse, Activity, AlertTriangle, TrendingUp,
  TrendingDown, RefreshCw, Cpu, Database, HardDrive, Boxes, Minus
} from 'lucide-react';
import { apiFetch } from '../config/api';

interface PulseProps {
  token: string | null;
}

export const Pulse: React.FC<PulseProps> = ({ token }) => {
  const [workspace, setWorkspace] = useState<any>(null);
  const [predictions, setPredictions] = useState<any[]>([]);
  const [patterns, setPatterns] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [w, pr, pa] = await Promise.all([
        apiFetch<any>('/api/v1/pulse/workspace', { token }).catch(() => null),
        apiFetch<any[]>('/api/v1/pulse/predictions', { token }).catch(() => []),
        apiFetch<any[]>('/api/v1/pulse/patterns', { token }).catch(() => []),
      ]);
      if (w) setWorkspace(w);
      if (Array.isArray(pr)) setPredictions(pr);
      if (Array.isArray(pa)) setPatterns(pa);
    } catch (err) {
      console.error('ArvPulse fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const overallScore = workspace?.overall_score ?? 0;
  const scoreColor = overallScore >= 80 ? 'emerald' : overallScore >= 60 ? 'amber' : 'red';
  const trendIcon = workspace?.trend === 'improving' ? TrendingUp : workspace?.trend === 'degrading' ? TrendingDown : Minus;
  const TrendIcon = trendIcon;
  const activePredictions = predictions.filter(p => p.status === 'active');

  return (
    <div className="space-y-6 font-mono text-xs">
      {/* Header */}
      <div className="bg-white dark:bg-[#0F2038] border border-slate-200 dark:border-slate-800 rounded-2xl p-4 sm:p-5 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <HeartPulse className="w-5 h-5 text-brandGold-500" />
            <h2 className="text-base font-black text-slate-900 dark:text-white uppercase tracking-tight">
              ArvPulse — Predictive Health Engine
            </h2>
            <span className="px-2 py-0.5 text-[10px] font-bold bg-brandGold-500/10 text-brandGold-500 rounded-full border border-brandGold-500/20">v2.0</span>
          </div>
          <p className="text-slate-500 text-[11px] mt-0.5">AI-powered health scoring, anomaly prediction, and auto-remediation</p>
        </div>
        <button onClick={fetchData} disabled={loading} className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-xs font-bold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white cursor-pointer">
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} /> Refresh
        </button>
      </div>

      {/* Overall Health Score */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
        <div className="bg-white dark:bg-[#0F2038] border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm text-center">
          <p className="text-slate-500 text-[10px] uppercase tracking-wider font-bold mb-3">Workspace Health Score</p>
          <div className="relative inline-flex items-center justify-center w-28 h-28">
            <svg className="w-28 h-28 -rotate-90">
              <circle cx="56" cy="56" r="48" fill="none" stroke="#1E293B" strokeWidth="8" />
              <circle cx="56" cy="56" r="48" fill="none" stroke={overallScore >= 80 ? '#10B981' : overallScore >= 60 ? '#F59E0B' : '#EF4444'}
                strokeWidth="8" strokeDasharray={`${overallScore * 3.01} 301.6`} strokeLinecap="round" />
            </svg>
            <span className={`absolute text-3xl font-black text-${scoreColor}-500`}>{overallScore}</span>
          </div>
          <div className="flex items-center justify-center gap-1 mt-3">
            <TrendIcon className={`w-3.5 h-3.5 text-${scoreColor}-500`} />
            <span className={`text-[10px] font-bold text-${scoreColor}-500 capitalize`}>{workspace?.trend || 'stable'}</span>
          </div>
        </div>

        {/* Resource Type Scores */}
        <div className="lg:col-span-2 bg-white dark:bg-[#0F2038] border border-slate-200 dark:border-slate-800 rounded-2xl p-4 sm:p-5 shadow-sm">
          <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider mb-4">Health by Resource Type</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {(workspace?.by_type || []).map((rt: any) => {
              const rtColor = rt.score >= 80 ? 'emerald' : rt.score >= 60 ? 'amber' : 'red';
              const Icon = rt.type === 'compute' ? Cpu : rt.type === 'kubernetes' ? Boxes : rt.type === 'database' ? Database : HardDrive;
              return (
                <div key={rt.type} className="p-3 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-200 dark:border-slate-800">
                  <div className="flex items-center gap-2 mb-2">
                    <Icon className={`w-4 h-4 text-${rtColor}-500`} />
                    <span className="text-[10px] font-bold uppercase text-slate-500">{rt.type}</span>
                  </div>
                  <p className={`text-2xl font-black text-${rtColor}-500`}>{rt.score}</p>
                  <p className={`text-[9px] text-${rtColor}-500 capitalize mt-0.5`}>{rt.trend}</p>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Active Predictions */}
      {activePredictions.length > 0 && (
        <div className="bg-white dark:bg-[#0F2038] border border-slate-200 dark:border-slate-800 rounded-2xl p-4 sm:p-5 shadow-sm">
          <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider mb-4 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-500" /> Active Predictions ({activePredictions.length})
          </h3>
          <div className="space-y-2">
            {activePredictions.map((pred) => (
              <div key={pred.id} className={`p-4 rounded-xl border ${
                pred.severity === 'critical' ? 'bg-red-500/5 border-red-500/20' :
                pred.severity === 'high' ? 'bg-orange-500/5 border-orange-500/20' :
                'bg-amber-500/5 border-amber-500/20'
              }`}>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`px-2 py-0.5 text-[9px] font-bold rounded-full ${
                        pred.severity === 'critical' ? 'bg-red-500/10 text-red-500' :
                        pred.severity === 'high' ? 'bg-orange-500/10 text-orange-500' :
                        'bg-amber-500/10 text-amber-500'
                      }`}>{pred.severity}</span>
                      <span className="text-[10px] text-slate-500 uppercase">{pred.prediction_type?.replace(/_/g, ' ')}</span>
                      <span className="text-[10px] text-slate-500">• {Math.round((pred.confidence || 0) * 100)}% confidence</span>
                    </div>
                    <p className="text-xs font-bold text-slate-900 dark:text-white">{pred.description}</p>
                    {pred.root_cause && <p className="text-[10px] text-slate-500 mt-1">Root cause: {pred.root_cause}</p>}
                    {pred.predicted_time && <p className="text-[10px] text-amber-500 mt-1">Predicted: {new Date(pred.predicted_time).toLocaleString()}</p>}
                  </div>
                  <div className="flex gap-2 ml-4 shrink-0">
                    <button className="px-3 py-1 text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 cursor-pointer">Acknowledge</button>
                    <button className="px-3 py-1 text-[10px] font-bold bg-brandGold-500 text-white rounded-lg hover:bg-brandGold-600 cursor-pointer">Remediate</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Detected Patterns */}
      {patterns.length > 0 && (
        <div className="bg-white dark:bg-[#0F2038] border border-slate-200 dark:border-slate-800 rounded-2xl p-4 sm:p-5 shadow-sm">
          <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider mb-4 flex items-center gap-2">
            <Activity className="w-4 h-4 text-purple-500" /> Detected Patterns
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {patterns.map((pat) => (
              <div key={pat.id} className="p-3 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-200 dark:border-slate-800">
                <p className="text-xs font-bold text-slate-900 dark:text-white">{pat.pattern_name}</p>
                <p className="text-[10px] text-slate-500 mt-0.5">{pat.description}</p>
                <div className="flex items-center gap-3 mt-2">
                  <span className="text-[9px] text-purple-500 font-bold">{pat.occurrences} occurrences</span>
                  <span className="text-[9px] text-slate-500">{pat.recommendation}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {loading && (
        <div className="text-center py-12 text-slate-500">
          <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2" />
          <p className="text-xs">Analyzing infrastructure health...</p>
        </div>
      )}
    </div>
  );
};
