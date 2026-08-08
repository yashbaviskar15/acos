import React, { useState, useEffect } from 'react';
import { Database, Plus, Trash2, RefreshCw } from 'lucide-react';
import { ModalPortal } from '../components/ModalPortal';

interface DatabaseProps {
  token: string | null;
}

export const Databases: React.FC<DatabaseProps> = ({ token }) => {
  const [databases, setDatabases] = useState<any[]>([]);
  const [summary, setSummary] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Form State
  const [name, setName] = useState('');
  const [engine, setEngine] = useState('PostgreSQL 16');
  const [tier, setTier] = useState('db.arv.medium');
  const [region, setRegion] = useState('arv-us-east-1');
  const [storageGb, setStorageGb] = useState(100);
  const [multiAz, setMultiAz] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  const authHeaders: Record<string, string> = token ? { 'Authorization': `Bearer ${token}` } : {};

  const fetchDatabases = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/v1/databases/instances', { headers: authHeaders });
      if (res.ok) {
        const data = await res.json();
        setDatabases(Array.isArray(data) ? data : []);
      }

      const sumRes = await fetch('/api/v1/databases/summary', { headers: authHeaders });
      if (sumRes.ok) {
        setSummary(await sumRes.json());
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDatabases();
  }, [token]);

  const handleCreateDB = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionLoading(true);
    try {
      const res = await fetch('/api/v1/databases/instances', {
        method: 'POST',
        headers: { ...authHeaders, 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, engine, tier, region, storage_gb: Number(storageGb), multi_az: multiAz })
      });
      if (res.ok) {
        setShowCreateModal(false);
        setName('');
        fetchDatabases();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteDB = async (dbId: string) => {
    if (!confirm('Are you sure you want to terminate this database instance? Data will be backed up.')) return;
    try {
      const res = await fetch(`/api/v1/databases/instances/${dbId}`, {
        method: 'DELETE',
        headers: authHeaders
      });
      if (res.ok) {
        fetchDatabases();
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="p-4 sm:p-6 space-y-6">
      {/* Top Action Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white dark:bg-[#0F2038] border border-slate-200 dark:border-slate-800 p-5 rounded-2xl shadow-sm">
        <div>
          <h2 className="text-base sm:text-lg font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <Database className="w-5 h-5 text-amber-500" />
            ArvDB Managed Database Engines
          </h2>
          <p className="text-xs text-slate-600 dark:text-slate-400 font-mono mt-0.5">Fully managed relational (Postgres/MySQL), key-value (Redis), and document (MongoDB) databases</p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchDatabases}
            className="p-2.5 text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-900 hover:bg-slate-200 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 rounded-xl transition-colors cursor-pointer"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>

          <button
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-2.5 bg-amber-500 hover:bg-amber-600 text-black font-bold text-xs rounded-xl transition-colors flex items-center gap-2 shadow-md cursor-pointer"
          >
            <Plus className="w-4 h-4" /> Provision DB Instance
          </button>
        </div>
      </div>

      {/* Summary KPI Cards */}
      {summary && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white dark:bg-[#0F2038] border border-slate-200 dark:border-slate-800 p-5 rounded-2xl shadow-sm">
            <span className="text-[10px] font-mono uppercase font-bold text-slate-500 dark:text-slate-400">Total Database Instances</span>
            <p className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white mt-1">{summary.total_instances}</p>
          </div>
          <div className="bg-white dark:bg-[#0F2038] border border-slate-200 dark:border-slate-800 p-5 rounded-2xl shadow-sm">
            <span className="text-[10px] font-mono uppercase font-bold text-amber-600 dark:text-amber-400">Active Connections</span>
            <p className="text-2xl sm:text-3xl font-black text-amber-600 dark:text-amber-400 mt-1">{summary.total_connections} Active</p>
          </div>
          <div className="bg-white dark:bg-[#0F2038] border border-slate-200 dark:border-slate-800 p-5 rounded-2xl shadow-sm">
            <span className="text-[10px] font-mono uppercase font-bold text-blue-600 dark:text-blue-400">Allocated Storage</span>
            <p className="text-2xl sm:text-3xl font-black text-blue-600 dark:text-blue-400 mt-1">{summary.total_storage_gb} GB</p>
          </div>
          <div className="bg-white dark:bg-[#0F2038] border border-slate-200 dark:border-slate-800 p-5 rounded-2xl shadow-sm">
            <span className="text-[10px] font-mono uppercase font-bold text-purple-600 dark:text-purple-400">Monthly Cost (₹)</span>
            <p className="text-2xl sm:text-3xl font-black text-purple-600 dark:text-purple-400 mt-1">₹{Math.round(summary.total_monthly_cost * 83).toLocaleString('en-IN')}</p>
          </div>
        </div>
      )}

      {/* Database Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {databases.length > 0 ? databases.map((db) => (
          <div key={db.id} className="bg-white dark:bg-[#0F2038] border border-slate-200 dark:border-slate-800 rounded-2xl p-5 hover:border-blue-500/40 transition-all space-y-4 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 text-amber-600 dark:text-amber-400 rounded-xl">
                  <Database className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 dark:text-white text-sm">{db.name}</h3>
                  <p className="text-xs text-amber-600 dark:text-amber-400 font-mono font-semibold">{db.engine}</p>
                </div>
              </div>

              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-50 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/30">
                {db.status}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs bg-slate-50 dark:bg-slate-900/60 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 font-mono">
              <div>
                <span className="text-slate-500 text-[10px] uppercase font-bold block">Compute Tier</span>
                <span className="text-slate-900 dark:text-slate-200 font-bold">{db.tier}</span>
              </div>
              <div>
                <span className="text-slate-500 text-[10px] uppercase font-bold block">Endpoint</span>
                <span className="text-slate-700 dark:text-slate-300 text-[11px] truncate block">{db.endpoint}:{db.port}</span>
              </div>
              <div>
                <span className="text-slate-500 text-[10px] uppercase font-bold block">Connections</span>
                <span className="text-amber-600 dark:text-amber-400 font-bold">{db.connections_active} / {db.connections_max}</span>
              </div>
              <div>
                <span className="text-slate-500 text-[10px] uppercase font-bold block">Latency & IOPS</span>
                <span className="text-emerald-600 dark:text-emerald-400 font-bold">{db.latency_ms}ms • {db.iops} IOPS</span>
              </div>
            </div>

            {/* Storage Progress Bar */}
            {db.storage_gb > 0 && (
              <div>
                <div className="flex justify-between text-[11px] font-mono text-slate-600 dark:text-slate-400 mb-1 font-bold">
                  <span>Storage Usage</span>
                  <span>{db.storage_used_gb} GB / {db.storage_gb} GB</span>
                </div>
                <div className="w-full bg-slate-100 dark:bg-slate-900 h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-amber-500 h-full rounded-full transition-all duration-700"
                    style={{ width: `${(db.storage_used_gb / db.storage_gb) * 100}%` }}
                  ></div>
                </div>
              </div>
            )}

            <div className="flex items-center justify-between pt-3 border-t border-slate-200 dark:border-slate-800 text-[11px] text-slate-500 dark:text-slate-400 font-mono">
              <span>Multi-AZ: {db.multi_az ? 'Enabled' : 'Disabled'} • Backup: Active</span>
              <button
                onClick={() => handleDeleteDB(db.id)}
                className="text-red-600 dark:text-red-400 hover:underline flex items-center gap-1 font-bold cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" /> Terminate
              </button>
            </div>
          </div>
        )) : (
          <div className="col-span-2 bg-white dark:bg-[#0F2038] border border-slate-200 dark:border-slate-800 rounded-2xl p-12 text-center text-slate-500 font-mono text-xs shadow-sm">
            {loading ? 'Loading databases...' : 'No database instances found. Click "Provision DB Instance" to create one.'}
          </div>
        )}
      </div>

      {/* Create DB Modal */}
      <ModalPortal isOpen={showCreateModal} onClose={() => setShowCreateModal(false)}>
        <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3.5">
          <h3 className="text-base font-black text-slate-900 dark:text-white uppercase tracking-wider font-mono">Provision Managed Database</h3>
          <button onClick={() => setShowCreateModal(false)} className="text-slate-400 hover:text-slate-700 dark:hover:text-white text-lg font-bold cursor-pointer">✕</button>
        </div>

        <form onSubmit={handleCreateDB} className="space-y-4 text-xs mt-4">
          <div>
            <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1.5 uppercase font-mono">Database Instance Identifier</label>
            <input
              type="text"
              required
              placeholder="e.g. analytics-db-prod"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-slate-900 dark:text-white focus:outline-none focus:border-blue-600 dark:focus:border-[#C9A84C]"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1.5 uppercase font-mono">Database Engine</label>
              <select
                value={engine}
                onChange={(e) => setEngine(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-slate-900 dark:text-white focus:outline-none focus:border-blue-600 dark:focus:border-[#C9A84C]"
              >
                <option value="PostgreSQL 16">PostgreSQL 16</option>
                <option value="PostgreSQL 15">PostgreSQL 15</option>
                <option value="MySQL 8.0">MySQL 8.0</option>
                <option value="Redis 7.2">Redis 7.2 (In-memory)</option>
                <option value="MongoDB 7.0">MongoDB 7.0 (NoSQL)</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1.5 uppercase font-mono">Instance Tier</label>
              <select
                value={tier}
                onChange={(e) => setTier(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-slate-900 dark:text-white focus:outline-none focus:border-blue-600 dark:focus:border-[#C9A84C]"
              >
                <option value="db.arv.micro">db.arv.micro (1 vCPU, 1GB)</option>
                <option value="db.arv.small">db.arv.small (1 vCPU, 2GB)</option>
                <option value="db.arv.medium">db.arv.medium (2 vCPU, 4GB)</option>
                <option value="db.arv.large">db.arv.large (2 vCPU, 8GB)</option>
                <option value="db.arv.xlarge">db.arv.xlarge (4 vCPU, 16GB)</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1.5 uppercase font-mono">Storage (SSD GB)</label>
              <input
                type="number"
                value={storageGb}
                onChange={(e) => setStorageGb(Number(e.target.value))}
                min={20}
                max={5000}
                className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-slate-900 dark:text-white focus:outline-none focus:border-blue-600 dark:focus:border-[#C9A84C]"
              />
            </div>

            <div>
              <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1.5 uppercase font-mono">Deployment Region</label>
              <select
                value={region}
                onChange={(e) => setRegion(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-slate-900 dark:text-white focus:outline-none focus:border-blue-600 dark:focus:border-[#C9A84C]"
              >
                <option value="arv-us-east-1">arv-us-east-1</option>
                <option value="arv-us-west-2">arv-us-west-2</option>
                <option value="arv-eu-west-1">arv-eu-west-1</option>
              </select>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="multiAz"
              checked={multiAz}
              onChange={(e) => setMultiAz(e.target.checked)}
              className="rounded bg-slate-100 dark:bg-slate-900 border-slate-300 dark:border-slate-700 text-blue-600 focus:ring-0 cursor-pointer"
            />
            <label htmlFor="multiAz" className="text-slate-700 dark:text-slate-300 cursor-pointer font-medium">Enable Multi-AZ High Availability Replication</label>
          </div>

          <div className="pt-3 flex gap-3">
            <button
              type="button"
              onClick={() => setShowCreateModal(false)}
              className="w-1/2 py-3 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold rounded-xl text-xs transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={actionLoading}
              className="w-1/2 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs shadow-lg shadow-blue-600/20 transition-all cursor-pointer"
            >
              {actionLoading ? 'Provisioning...' : 'Provision DB'}
            </button>
          </div>
        </form>
      </ModalPortal>
    </div>
  );
};
