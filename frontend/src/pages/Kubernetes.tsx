import React, { useState, useEffect } from 'react';
import { Boxes, Plus, Trash2, RefreshCw, Activity } from 'lucide-react';
import { ModalPortal } from '../components/ModalPortal';
import { apiFetch } from '../config/api';

interface KubernetesProps {
  token: string | null;
}

export const Kubernetes: React.FC<KubernetesProps> = ({ token }) => {
  const [clusters, setClusters] = useState<any[]>([]);
  const [summary, setSummary] = useState<any>(null);
  const [selectedCluster, setSelectedCluster] = useState<any | null>(null);
  const [pods, setPods] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Form State
  const [name, setName] = useState('');
  const [version, setVersion] = useState('1.30.1');
  const [region, setRegion] = useState('arv-us-east-1');
  const [nodeCount, setNodeCount] = useState(3);
  const [nodeSize, setNodeSize] = useState('arv.large');
  const [actionLoading, setActionLoading] = useState(false);

  const authHeaders: Record<string, string> = token ? { 'Authorization': `Bearer ${token}` } : {};

  const fetchClusters = async () => {
    setLoading(true);
    try {
      const data = await apiFetch<any[]>('/v1/kubernetes/clusters', { headers: authHeaders });
      setClusters(Array.isArray(data) ? data : []);
      if (Array.isArray(data) && data.length > 0 && !selectedCluster) {
        setSelectedCluster(data[0]);
      }

      const summaryData = await apiFetch('/v1/kubernetes/summary', { headers: authHeaders });
      setSummary(summaryData);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchPods = async (clusterId: string) => {
    try {
      const data = await apiFetch<any[]>(`/v1/kubernetes/clusters/${clusterId}/pods`, { headers: authHeaders });
      setPods(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchClusters();
  }, [token]);

  useEffect(() => {
    if (selectedCluster) {
      fetchPods(selectedCluster.id);
    }
  }, [selectedCluster]);

  const handleCreateCluster = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionLoading(true);
    try {
      await apiFetch('/v1/kubernetes/clusters', {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify({ name, version, region, node_count: Number(nodeCount), node_size: nodeSize }),
      });
      setShowCreateModal(false);
      setName('');
      fetchClusters();
    } catch (err) {
      console.error(err);
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteCluster = async (clusterId: string) => {
    if (!confirm('Are you sure you want to terminate this cluster?')) return;
    try {
      await apiFetch(`/v1/kubernetes/clusters/${clusterId}`, {
        method: 'DELETE',
        headers: authHeaders,
      });
      if (selectedCluster?.id === clusterId) setSelectedCluster(null);
      fetchClusters();
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
            <Boxes className="w-5 h-5 text-purple-600 dark:text-purple-400" />
            ArvKube Managed Kubernetes Engine
          </h2>
          <p className="text-xs text-slate-600 dark:text-slate-400 font-mono mt-0.5">High availability Kubernetes clusters with automated pod scaling</p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchClusters}
            className="p-2.5 text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-900 hover:bg-slate-200 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 rounded-xl transition-colors cursor-pointer"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>

          <button
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-2.5 bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs rounded-xl transition-colors flex items-center gap-2 shadow-md cursor-pointer"
          >
            <Plus className="w-4 h-4" /> Create K8s Cluster
          </button>
        </div>
      </div>

      {/* Summary KPI Cards */}
      {summary && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white dark:bg-[#0F2038] border border-slate-200 dark:border-slate-800 p-5 rounded-2xl shadow-sm">
            <span className="text-[10px] font-mono uppercase font-bold text-slate-500 dark:text-slate-400">Total Clusters</span>
            <p className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white mt-1">{summary.total_clusters}</p>
          </div>
          <div className="bg-white dark:bg-[#0F2038] border border-slate-200 dark:border-slate-800 p-5 rounded-2xl shadow-sm">
            <span className="text-[10px] font-mono uppercase font-bold text-purple-600 dark:text-purple-400">Active Worker Nodes</span>
            <p className="text-2xl sm:text-3xl font-black text-purple-600 dark:text-purple-400 mt-1">{summary.total_nodes} Nodes</p>
          </div>
          <div className="bg-white dark:bg-[#0F2038] border border-slate-200 dark:border-slate-800 p-5 rounded-2xl shadow-sm">
            <span className="text-[10px] font-mono uppercase font-bold text-emerald-600 dark:text-emerald-400">Total Pods Running</span>
            <p className="text-2xl sm:text-3xl font-black text-emerald-600 dark:text-emerald-400 mt-1">{summary.total_pods} Pods</p>
          </div>
          <div className="bg-white dark:bg-[#0F2038] border border-slate-200 dark:border-slate-800 p-5 rounded-2xl shadow-sm">
            <span className="text-[10px] font-mono uppercase font-bold text-blue-600 dark:text-blue-400">Cluster Capacity</span>
            <p className="text-2xl sm:text-3xl font-black text-blue-600 dark:text-blue-400 mt-1">{summary.total_cpu_cores} Cores / {summary.total_ram_gb} GB</p>
          </div>
        </div>
      )}

      {/* Clusters List & Pod Inspector Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Clusters Column */}
        <div className="space-y-4">
          <h3 className="text-xs font-mono font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">Kubernetes Clusters</h3>
          {clusters.map((c) => {
            const isSelected = selectedCluster?.id === c.id;
            return (
              <div
                key={c.id}
                onClick={() => setSelectedCluster(c)}
                className={`p-5 rounded-2xl border cursor-pointer transition-all ${
                  isSelected
                    ? 'bg-purple-50 dark:bg-purple-500/10 border-purple-500 shadow-md'
                    : 'bg-white dark:bg-[#0F2038] border-slate-200 dark:border-slate-800 hover:border-purple-300'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <Boxes className={`w-4 h-4 ${isSelected ? 'text-purple-600 dark:text-purple-400' : 'text-slate-400'}`} />
                    <span className="font-bold text-slate-900 dark:text-white text-xs">{c.name}</span>
                  </div>
                  <span className="px-2.5 py-0.5 rounded-full text-[9px] font-mono font-bold bg-emerald-50 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/30">
                    {c.status}
                  </span>
                </div>

                <div className="mt-3 grid grid-cols-2 gap-2 text-[10px] text-slate-600 dark:text-slate-400 font-mono font-bold">
                  <div>Version: <span className="text-slate-900 dark:text-slate-200">{c.version}</span></div>
                  <div>Region: <span className="text-slate-900 dark:text-slate-200">{c.region}</span></div>
                  <div>Nodes: <span className="text-purple-600 dark:text-purple-400 font-bold">{c.node_count} nodes</span></div>
                  <div>Pods: <span className="text-emerald-600 dark:text-emerald-400 font-bold">{c.pod_count} pods</span></div>
                </div>

                <div className="mt-3 pt-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-[10px] text-slate-500 dark:text-slate-400 font-mono">
                  <span className="truncate max-w-[180px]">{c.endpoint}</span>
                  <button
                    onClick={(e) => { e.stopPropagation(); handleDeleteCluster(c.id); }}
                    className="text-red-600 dark:text-red-400 hover:underline p-1 cursor-pointer font-bold"
                    title="Terminate Cluster"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Pods Inspector Column */}
        <div className="lg:col-span-2 bg-white dark:bg-[#0F2038] border border-slate-200 dark:border-slate-800 rounded-2xl p-5 space-y-4 shadow-sm">
          {selectedCluster ? (
            <>
              <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
                <div>
                  <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider font-mono">
                    Pods in <span className="text-purple-600 dark:text-purple-400">{selectedCluster.name}</span>
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-mono mt-0.5">Live Kubernetes Pod telemetry & status</p>
                </div>

                <span className="px-3 py-1 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-mono text-purple-600 dark:text-purple-400 font-bold">
                  {pods.length} Workload Pods
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 dark:bg-slate-900/80 text-slate-600 dark:text-slate-400 font-mono text-[10px] uppercase border-b border-slate-200 dark:border-slate-800 font-extrabold">
                    <tr>
                      <th className="p-3">Pod Name</th>
                      <th className="p-3">Namespace</th>
                      <th className="p-3">Status</th>
                      <th className="p-3">CPU / RAM</th>
                      <th className="p-3">Restarts</th>
                      <th className="p-3">Node</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 dark:divide-slate-800/60 font-mono">
                    {pods.map((pod) => (
                      <tr key={pod.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                        <td className="p-3 font-semibold text-slate-900 dark:text-white font-mono flex items-center gap-2">
                          <Activity className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
                          {pod.name}
                        </td>
                        <td className="p-3 text-slate-700 dark:text-slate-300">{pod.namespace}</td>
                        <td className="p-3">
                          <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold border ${
                            pod.status === 'Running' 
                              ? 'bg-emerald-50 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/30' 
                              : (pod.status === 'CrashLoopBackOff' ? 'bg-red-50 dark:bg-red-500/20 text-red-700 dark:text-red-400 border-red-200 dark:border-red-500/30' : 'bg-amber-50 dark:bg-amber-500/20 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-500/30')
                          }`}>
                            {pod.status}
                          </span>
                        </td>
                        <td className="p-3 text-[11px] text-slate-700 dark:text-slate-300 font-bold">
                          {pod.cpu_usage_m}m / {pod.ram_usage_mb}MB
                        </td>
                        <td className="p-3 text-slate-500 dark:text-slate-400">{pod.restarts}</td>
                        <td className="p-3 text-slate-500 dark:text-slate-400">{pod.node}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          ) : (
            <div className="py-12 text-center text-slate-500 font-mono text-xs">Select a cluster to inspect workload pods</div>
          )}
        </div>
      </div>

      {/* Create Cluster Modal */}
      <ModalPortal isOpen={showCreateModal} onClose={() => setShowCreateModal(false)}>
        <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3.5">
          <h3 className="text-base font-black text-slate-900 dark:text-white uppercase tracking-wider font-mono">Create Managed K8s Cluster</h3>
          <button onClick={() => setShowCreateModal(false)} className="text-slate-400 hover:text-slate-700 dark:hover:text-white text-lg font-bold cursor-pointer">✕</button>
        </div>

        <form onSubmit={handleCreateCluster} className="space-y-4 text-xs mt-4">
          <div>
            <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1.5 uppercase font-mono">Cluster Name</label>
            <input
              type="text"
              required
              placeholder="e.g. production-k8s"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-slate-900 dark:text-white focus:outline-none focus:border-purple-600"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1.5 uppercase font-mono">Kubernetes Version</label>
              <select
                value={version}
                onChange={(e) => setVersion(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-slate-900 dark:text-white focus:outline-none focus:border-purple-600"
              >
                <option value="1.30.1">v1.30.1 (Latest)</option>
                <option value="1.29.2">v1.29.2 (Stable)</option>
                <option value="1.28.4">v1.28.4</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1.5 uppercase font-mono">Region</label>
              <select
                value={region}
                onChange={(e) => setRegion(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-slate-900 dark:text-white focus:outline-none focus:border-purple-600"
              >
                <option value="arv-us-east-1">arv-us-east-1</option>
                <option value="arv-us-west-2">arv-us-west-2</option>
                <option value="arv-eu-west-1">arv-eu-west-1</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1.5 uppercase font-mono">Worker Node Count</label>
              <input
                type="number"
                value={nodeCount}
                onChange={(e) => setNodeCount(Number(e.target.value))}
                min={1}
                max={20}
                className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-slate-900 dark:text-white focus:outline-none focus:border-purple-600"
              />
            </div>

            <div>
              <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1.5 uppercase font-mono">Node VM Size</label>
              <select
                value={nodeSize}
                onChange={(e) => setNodeSize(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-slate-900 dark:text-white focus:outline-none focus:border-purple-600"
              >
                <option value="arv.medium">arv.medium (2 vCPU, 4GB)</option>
                <option value="arv.large">arv.large (2 vCPU, 8GB)</option>
                <option value="arv.xlarge">arv.xlarge (4 vCPU, 16GB)</option>
              </select>
            </div>
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
              className="w-1/2 py-3 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-xl text-xs shadow-lg shadow-purple-600/20 transition-all cursor-pointer"
            >
              {actionLoading ? 'Provisioning...' : 'Provision Cluster'}
            </button>
          </div>
        </form>
      </ModalPortal>
    </div>
  );
};
