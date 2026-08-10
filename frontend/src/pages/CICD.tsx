import React, { useState, useEffect } from 'react';
import { GitBranch, Play, Plus, RefreshCw, CheckCircle, AlertCircle } from 'lucide-react';
import { ModalPortal } from '../components/ModalPortal';
import { apiFetch } from '../config/api';

export const CICD: React.FC = () => {
  const [pipelines, setPipelines] = useState<any[]>([]);
  const [summary, setSummary] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [triggering, setTriggering] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);

  // New pipeline form
  const [pipeName, setPipeName] = useState('');
  const [pipeRepo, setPipeRepo] = useState('');
  const [pipeBranch, setPipeBranch] = useState('main');

  const fetchData = async () => {
    setLoading(true);
    try {
      const [pipelineData, summaryData] = await Promise.all([
        apiFetch('/v1/cicd/pipelines'),
        apiFetch('/v1/cicd/summary'),
      ]);
      setPipelines(Array.isArray(pipelineData) ? pipelineData : []);
      setSummary(summaryData);
    } catch (err) {
      console.error('Failed to load CI/CD data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleRunPipeline = async (id: string) => {
    setTriggering(id);
    try {
      const updated = await apiFetch(`/v1/cicd/pipelines/${id}/trigger`, { method: 'POST' });
      setPipelines(prev => prev.map(p => (p.id === id ? updated : p)));
    } catch (err) {
      console.error(err);
    } finally {
      setTriggering(null);
    }
  };

  const handleCreatePipeline = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pipeName.trim() || !pipeRepo.trim()) return;

    try {
      await apiFetch('/v1/cicd/pipelines', {
        method: 'POST',
        body: JSON.stringify({ name: pipeName.trim(), repository: pipeRepo.trim(), branch: pipeBranch }),
      });
      setShowCreateModal(false);
      setPipeName('');
      setPipeRepo('');
      fetchData();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="p-4 sm:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white dark:bg-[#0F2038] border border-slate-200 dark:border-slate-800 p-5 rounded-2xl shadow-sm">
        <div>
          <h2 className="text-base sm:text-lg font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <GitBranch className="w-5 h-5 text-blue-600 dark:text-blue-400 font-bold" />
            CI/CD Pipelines & Container Artifacts
          </h2>
          <p className="text-xs text-slate-600 dark:text-slate-400 font-mono mt-0.5">Automated build runners, test suites, and Kubernetes cluster deployments</p>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <button
            onClick={fetchData}
            className="p-2.5 text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-900 hover:bg-slate-200 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 rounded-xl transition-colors cursor-pointer"
            title="Refresh"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>

          <button
            onClick={() => setShowCreateModal(true)}
            className="flex-1 sm:flex-initial px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-md flex items-center justify-center gap-2 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Create Pipeline</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-[#0F2038] border border-slate-200 dark:border-slate-800 p-5 rounded-2xl shadow-sm">
          <span className="text-[10px] text-slate-500 dark:text-slate-400 font-mono font-bold uppercase">Total Pipelines</span>
          <h3 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white mt-2">{summary?.total_pipelines ?? 4}</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 font-mono">Active workflow specifications</p>
        </div>

        <div className="bg-white dark:bg-[#0F2038] border border-slate-200 dark:border-slate-800 p-5 rounded-2xl shadow-sm">
          <span className="text-[10px] text-slate-500 dark:text-slate-400 font-mono font-bold uppercase">Success Pass Rate</span>
          <h3 className="text-2xl sm:text-3xl font-black text-emerald-600 dark:text-emerald-400 mt-2">{summary?.pass_rate_percent ?? 75}%</h3>
          <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-2 font-mono font-bold">{summary?.successful_runs ?? 3} passed • {summary?.failed_runs ?? 1} failed</p>
        </div>

        <div className="bg-white dark:bg-[#0F2038] border border-slate-200 dark:border-slate-800 p-5 rounded-2xl shadow-sm">
          <span className="text-[10px] text-slate-500 dark:text-slate-400 font-mono font-bold uppercase">Avg Build Time</span>
          <h3 className="text-2xl sm:text-3xl font-black text-amber-600 dark:text-amber-400 mt-2">1m 54s</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 font-mono">Optimized build caching enabled</p>
        </div>
      </div>

      {/* Pipelines Table */}
      <div className="bg-white dark:bg-[#0F2038] border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm">
        <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-slate-800">
          <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase font-mono tracking-wider">Active CI/CD Workflows</h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-900/80 border-b border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 font-mono font-extrabold text-[10px] uppercase">
              <tr>
                <th className="p-4">Pipeline Name</th>
                <th className="p-4">Branch / Commit</th>
                <th className="p-4">Trigger</th>
                <th className="p-4">Status</th>
                <th className="p-4">Duration</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800/60 font-mono text-slate-900 dark:text-slate-100">
              {pipelines.map((p) => (
                <tr key={p.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                  <td className="p-4 font-bold text-slate-900 dark:text-white">
                    <div className="flex items-center gap-2">
                      <GitBranch className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />
                      <span>{p.name}</span>
                    </div>
                  </td>
                  <td className="p-4 text-slate-600 dark:text-slate-400 font-bold">
                    <span className="text-blue-600 dark:text-blue-400">{p.branch}</span> ({p.commit})
                  </td>
                  <td className="p-4 capitalize text-slate-600 dark:text-slate-400">{p.trigger}</td>
                  <td className="p-4">
                    {p.status === 'SUCCESS' ? (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/30">
                        <CheckCircle className="w-3 h-3" />
                        SUCCESS
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-red-50 dark:bg-red-500/20 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-500/30">
                        <AlertCircle className="w-3 h-3" />
                        FAILED
                      </span>
                    )}
                  </td>
                  <td className="p-4 text-slate-600 dark:text-slate-400">{p.duration}</td>
                  <td className="p-4 text-right">
                    <button
                      onClick={() => handleRunPipeline(p.id)}
                      disabled={triggering === p.id}
                      className="px-3.5 py-1.5 bg-blue-50 dark:bg-blue-500/10 hover:bg-blue-100 dark:hover:bg-blue-500/20 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-500/30 rounded-xl text-xs font-bold inline-flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
                    >
                      <Play className={`w-3 h-3 ${triggering === p.id ? 'animate-spin' : ''}`} />
                      <span>{triggering === p.id ? 'Running...' : 'Trigger Run'}</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Pipeline Modal */}
      <ModalPortal isOpen={showCreateModal} onClose={() => setShowCreateModal(false)}>
        <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3.5">
          <h3 className="text-base font-black text-slate-900 dark:text-white uppercase tracking-wider font-mono">Create New CI/CD Pipeline</h3>
          <button onClick={() => setShowCreateModal(false)} className="text-slate-400 hover:text-slate-700 dark:hover:text-white text-lg font-bold cursor-pointer">✕</button>
        </div>

        <form onSubmit={handleCreatePipeline} className="space-y-4 text-xs mt-4">
          <div>
            <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1.5 uppercase font-mono">Pipeline Name</label>
            <input
              type="text"
              required
              placeholder="e.g. auth-service-ci"
              value={pipeName}
              onChange={(e) => setPipeName(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-slate-900 dark:text-white focus:outline-none focus:border-blue-600"
            />
          </div>

          <div>
            <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1.5 uppercase font-mono">Git Repository</label>
            <input
              type="text"
              required
              placeholder="aravanta/auth-service"
              value={pipeRepo}
              onChange={(e) => setPipeRepo(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-slate-900 dark:text-white focus:outline-none focus:border-blue-600"
            />
          </div>

          <div>
            <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1.5 uppercase font-mono">Target Branch</label>
            <input
              type="text"
              required
              value={pipeBranch}
              onChange={(e) => setPipeBranch(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-slate-900 dark:text-white focus:outline-none focus:border-blue-600"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={() => setShowCreateModal(false)}
              className="px-4 py-2.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl text-xs font-bold transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-lg shadow-blue-600/20 transition-all cursor-pointer"
            >
              Save Pipeline
            </button>
          </div>
        </form>
      </ModalPortal>
    </div>
  );
};
