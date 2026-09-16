import React, { useState, useEffect, useCallback } from 'react';
import {
  FlaskConical, Plus, Clock, Trash2, RefreshCw, ExternalLink,
  Layers
} from 'lucide-react';
import { apiFetch } from '../config/api';

interface SandboxProps {
  token: string | null;
}

export const Sandbox: React.FC<SandboxProps> = ({ token }) => {
  const [sandboxes, setSandboxes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [formData, setFormData] = useState({ name: '', source_environment: 'production', ttl_hours: 4, anonymize_data: true });

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const data = await apiFetch<any[]>('/api/v1/sandbox', { token }).catch(() => []);
      if (Array.isArray(data)) setSandboxes(data);
    } catch (err) {
      console.error('ArvSandbox fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleCreate = async () => {
    setCreating(true);
    try {
      await apiFetch('/api/v1/sandbox/create', {
        token,
        method: 'POST',
        body: JSON.stringify(formData),
      });
      setShowCreate(false);
      setFormData({ name: '', source_environment: 'production', ttl_hours: 4, anonymize_data: true });
      fetchData();
    } catch (err) {
      console.error('Failed to create sandbox:', err);
    } finally {
      setCreating(false);
    }
  };

  const handleDestroy = async (id: string) => {
    try {
      await apiFetch(`/api/v1/sandbox/${id}`, { token, method: 'DELETE' });
      fetchData();
    } catch (err) {
      console.error('Failed to destroy sandbox:', err);
    }
  };

  const activeSandboxes = sandboxes.filter(s => s.status === 'active');

  return (
    <div className="space-y-6 font-mono text-xs">
      {/* Header */}
      <div className="bg-white dark:bg-[#0F2038] border border-slate-200 dark:border-slate-800 rounded-2xl p-4 sm:p-5 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <FlaskConical className="w-5 h-5 text-brandGold-500" />
            <h2 className="text-base font-black text-slate-900 dark:text-white uppercase tracking-tight">
              ArvSandbox — Ephemeral Environments
            </h2>
            <span className="px-2 py-0.5 text-[10px] font-bold bg-brandGold-500/10 text-brandGold-500 rounded-full border border-brandGold-500/20">v2.0</span>
          </div>
          <p className="text-slate-500 text-[11px] mt-0.5">Spin up production mirrors in 60 seconds. Auto-destroy when done.</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={fetchData} disabled={loading} className="p-2 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white cursor-pointer">
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button onClick={() => setShowCreate(true)} className="flex items-center gap-1.5 px-3 py-1.5 bg-brandGold-500 text-white rounded-lg text-xs font-bold hover:bg-brandGold-600 transition-colors cursor-pointer">
            <Plus className="w-3.5 h-3.5" /> New Sandbox
          </button>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Active Sandboxes', value: activeSandboxes.length, icon: Layers, color: 'blue' },
          { label: 'Total Created', value: sandboxes.length, icon: FlaskConical, color: 'purple' },
          { label: 'Est. Cost (Active)', value: `₹${activeSandboxes.reduce((s, sb) => s + (sb.estimated_cost || 0), 0).toFixed(0)}`, icon: Clock, color: 'amber' },
        ].map((kpi) => (
          <div key={kpi.label} className="bg-white dark:bg-[#0F2038] border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <span className="text-slate-500 text-[10px] uppercase tracking-wider font-bold">{kpi.label}</span>
              <kpi.icon className={`w-4 h-4 text-${kpi.color}-500`} />
            </div>
            <p className="text-xl font-black text-slate-900 dark:text-white">{kpi.value}</p>
          </div>
        ))}
      </div>

      {/* Create Modal */}
      {showCreate && (
        <div className="bg-white dark:bg-[#0F2038] border border-brandGold-500/30 rounded-2xl p-5 shadow-lg">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
            <Plus className="w-4 h-4 text-brandGold-500" /> Create New Sandbox
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-[10px] text-slate-500 uppercase font-bold mb-1 block">Name</label>
              <input value={formData.name} onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="e.g. feature-checkout-v2" className="w-full px-3 py-2 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-xs text-slate-900 dark:text-white" />
            </div>
            <div>
              <label className="text-[10px] text-slate-500 uppercase font-bold mb-1 block">Source Environment</label>
              <select value={formData.source_environment} onChange={(e) => setFormData(prev => ({ ...prev, source_environment: e.target.value }))}
                className="w-full px-3 py-2 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-xs text-slate-900 dark:text-white">
                <option value="production">Production</option>
                <option value="staging">Staging</option>
              </select>
            </div>
            <div>
              <label className="text-[10px] text-slate-500 uppercase font-bold mb-1 block">TTL (Hours)</label>
              <select value={formData.ttl_hours} onChange={(e) => setFormData(prev => ({ ...prev, ttl_hours: Number(e.target.value) }))}
                className="w-full px-3 py-2 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-xs text-slate-900 dark:text-white">
                <option value={1}>1 hour</option>
                <option value={4}>4 hours</option>
                <option value={24}>24 hours</option>
                <option value={168}>7 days</option>
              </select>
            </div>
            <div className="flex items-center gap-2 pt-5">
              <input type="checkbox" checked={formData.anonymize_data} onChange={(e) => setFormData(prev => ({ ...prev, anonymize_data: e.target.checked }))}
                className="rounded border-slate-300 dark:border-slate-700" />
              <label className="text-xs text-slate-600 dark:text-slate-400">Anonymize PII data</label>
            </div>
          </div>
          <div className="flex gap-2 mt-4">
            <button onClick={handleCreate} disabled={creating || !formData.name}
              className="px-4 py-2 bg-brandGold-500 text-white rounded-lg text-xs font-bold hover:bg-brandGold-600 disabled:opacity-50 cursor-pointer">
              {creating ? 'Creating...' : 'Create Sandbox'}
            </button>
            <button onClick={() => setShowCreate(false)} className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-lg text-xs font-bold cursor-pointer">Cancel</button>
          </div>
        </div>
      )}

      {/* Sandboxes List */}
      {sandboxes.length > 0 && (
        <div className="space-y-3">
          {sandboxes.map((sb) => (
            <div key={sb.id} className={`bg-white dark:bg-[#0F2038] border rounded-2xl p-4 shadow-sm ${
              sb.status === 'active' ? 'border-emerald-500/30' : sb.status === 'creating' ? 'border-blue-500/30' : 'border-slate-200 dark:border-slate-800'
            }`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <FlaskConical className={`w-5 h-5 ${sb.status === 'active' ? 'text-emerald-500' : sb.status === 'creating' ? 'text-blue-500' : 'text-slate-400'}`} />
                  <div>
                    <p className="text-sm font-bold text-slate-900 dark:text-white">{sb.name}</p>
                    <p className="text-[10px] text-slate-500 mt-0.5">
                      Source: {sb.source_environment} • TTL: {sb.ttl_hours}h •
                      {sb.data_anonymized ? ' PII anonymized' : ' Raw data'} •
                      Cost: ₹{sb.estimated_cost || 0}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`px-2 py-0.5 text-[9px] font-bold rounded-full ${
                    sb.status === 'active' ? 'bg-emerald-500/10 text-emerald-500' :
                    sb.status === 'creating' ? 'bg-blue-500/10 text-blue-500 animate-pulse' :
                    sb.status === 'expiring' ? 'bg-amber-500/10 text-amber-500' :
                    'bg-slate-500/10 text-slate-500'
                  }`}>{sb.status}</span>
                  {sb.access_url && (
                    <a href={sb.access_url} target="_blank" rel="noopener noreferrer"
                      className="p-1.5 text-blue-500 hover:bg-blue-500/10 rounded-lg cursor-pointer" title="Open sandbox">
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  )}
                  {sb.status === 'active' && (
                    <button onClick={() => handleDestroy(sb.id)}
                      className="p-1.5 text-red-500 hover:bg-red-500/10 rounded-lg cursor-pointer" title="Destroy">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
              {sb.expires_at && (
                <div className="mt-2 flex items-center gap-1.5 text-[10px] text-slate-500">
                  <Clock className="w-3 h-3" />
                  Expires: {new Date(sb.expires_at).toLocaleString()}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {!loading && sandboxes.length === 0 && !showCreate && (
        <div className="text-center py-16 bg-white dark:bg-[#0F2038] border border-slate-200 dark:border-slate-800 rounded-2xl">
          <FlaskConical className="w-12 h-12 text-slate-300 dark:text-slate-700 mx-auto mb-4" />
          <p className="text-sm font-bold text-slate-900 dark:text-white mb-1">No sandboxes yet</p>
          <p className="text-xs text-slate-500 mb-4">Create your first ephemeral environment</p>
          <button onClick={() => setShowCreate(true)} className="px-4 py-2 bg-brandGold-500 text-white rounded-lg text-xs font-bold hover:bg-brandGold-600 cursor-pointer">
            <Plus className="w-3.5 h-3.5 inline mr-1" /> Create Sandbox
          </button>
        </div>
      )}

      {loading && (
        <div className="text-center py-12 text-slate-500">
          <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2" />
          <p className="text-xs">Loading sandboxes...</p>
        </div>
      )}
    </div>
  );
};
