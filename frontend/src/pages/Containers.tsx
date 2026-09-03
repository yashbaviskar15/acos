import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Search, 
  RefreshCw, 
  Square, 
  RotateCcw, 
  Terminal, 
  CheckCircle2
} from 'lucide-react';
import { apiFetch } from '../config/api';
import { StatusBadge } from '../components/StatusBadge';
import { ConfirmModal } from '../components/ConfirmModal';
import { ModalPortal } from '../components/ModalPortal';

interface ContainerItem {
  id: string;
  name: string;
  app: string;
  image: string;
  node: string;
  status: string;
  restarts: number;
  cpu_pct: number;
  ram_mb: number;
  uptime: string;
  ip: string;
}

export const Containers: React.FC<{ token: string | null }> = ({ token }) => {
  const [containers, setContainers] = useState<ContainerItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  // Logs modal
  const [activeLogsContainer, setActiveLogsContainer] = useState<ContainerItem | null>(null);
  const [logs, setLogs] = useState<any[]>([]);
  const [logsLoading, setLogsLoading] = useState(false);

  // Confirm Modal
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    action: () => Promise<void>;
    variant: 'danger' | 'warning' | 'primary';
  }>({
    isOpen: false,
    title: '',
    message: '',
    action: async () => {},
    variant: 'danger',
  });
  const [actionLoading, setActionLoading] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const fetchContainers = async () => {
    setLoading(true);
    try {
      const data = await apiFetch<ContainerItem[]>('/api/v1/operations/containers', { token });
      if (Array.isArray(data)) {
        setContainers(data);
      }
    } catch (err) {
      console.error('Failed to fetch containers:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchContainers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const handleContainerAction = (ctr: ContainerItem, action: 'start' | 'stop' | 'restart') => {
    const isDestructive = action === 'stop';
    setConfirmModal({
      isOpen: true,
      title: `${action.toUpperCase()} Container: ${ctr.name}`,
      message: `Execute container runtime ${action} on ${ctr.name} hosted on ${ctr.node}?`,
      variant: isDestructive ? 'danger' : 'warning',
      action: async () => {
        setActionLoading(true);
        try {
          await apiFetch(`/api/v1/operations/containers/${ctr.id}/action`, {
            method: 'POST',
            body: JSON.stringify({ action }),
            token
          });
          showToast(`Container ${ctr.name} ${action} completed successfully`);
          setConfirmModal(prev => ({ ...prev, isOpen: false }));
          fetchContainers();
        } catch (err: any) {
          showToast(`Action failed: ${err.message}`);
        } finally {
          setActionLoading(false);
        }
      }
    });
  };

  const viewContainerLogs = async (ctr: ContainerItem) => {
    setActiveLogsContainer(ctr);
    setLogsLoading(true);
    try {
      const data = await apiFetch<any[]>(`/api/v1/operations/containers/${ctr.id}/logs`, { token });
      setLogs(data || []);
    } catch (err) {
      console.error('Failed to fetch container logs:', err);
    } finally {
      setLogsLoading(false);
    }
  };

  const filtered = (containers || []).filter(c => {
    if (!c) return false;
    const name = (c.name || '').toLowerCase();
    const app = (c.app || '').toLowerCase();
    const image = (c.image || '').toLowerCase();
    const node = (c.node || '').toLowerCase();
    const status = (c.status || '').toLowerCase();
    const query = searchTerm.toLowerCase();

    const matchesSearch = name.includes(query) || app.includes(query) || image.includes(query) || node.includes(query);
    const matchesStatus = statusFilter === 'all' || status === statusFilter.toLowerCase();
    return matchesSearch && matchesStatus;
  });

  const runningCount = (containers || []).filter(c => (c?.status || '').toUpperCase() === 'RUNNING').length;
  const crashCount = (containers || []).filter(c => (c?.status || '').toUpperCase() === 'CRASHLOOPBACKOFF').length;

  return (
    <div className="space-y-6">
      {/* Toast Alert */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white dark:bg-white dark:text-slate-900 px-4 py-3 rounded-xl shadow-2xl flex items-center gap-3 border border-slate-700 animate-fadeIn font-mono text-xs font-bold">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 dark:text-emerald-600" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* KPI Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-[#0F2038] border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm">
          <span className="text-xs font-mono font-bold uppercase text-slate-500 dark:text-slate-400">Total Containers</span>
          <p className="text-2xl font-black text-slate-900 dark:text-white mt-2 font-mono">{containers.length}</p>
          <p className="text-[11px] text-slate-500 mt-1 font-mono">Distributed K8s pods</p>
        </div>

        <div className="bg-white dark:bg-[#0F2038] border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm">
          <span className="text-xs font-mono font-bold uppercase text-emerald-600 dark:text-emerald-400">Running / Healthy</span>
          <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-2 font-mono">{runningCount}</p>
          <p className="text-[11px] text-slate-500 mt-1 font-mono">Passing liveness probes</p>
        </div>

        <div className="bg-white dark:bg-[#0F2038] border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm">
          <span className="text-xs font-mono font-bold uppercase text-rose-600 dark:text-rose-400">CrashLoopBackOff</span>
          <p className="text-2xl font-black text-rose-600 dark:text-rose-400 mt-2 font-mono">{crashCount}</p>
          <p className="text-[11px] text-slate-500 mt-1 font-mono">Restarting containers</p>
        </div>

        <div className="bg-white dark:bg-[#0F2038] border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm">
          <span className="text-xs font-mono font-bold uppercase text-blue-600 dark:text-blue-400">Avg CPU Usage</span>
          <p className="text-2xl font-black text-blue-600 dark:text-blue-400 mt-2 font-mono">24.5%</p>
          <p className="text-[11px] text-slate-500 mt-1 font-mono">Across 3 worker nodes</p>
        </div>
      </div>

      {/* Filter and Table Container */}
      <div className="bg-white dark:bg-[#0F2038] border border-slate-200 dark:border-slate-800 rounded-2xl p-4 sm:p-5 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search pod name, image, node..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-mono text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="flex items-center gap-2.5 w-full sm:w-auto justify-start sm:justify-end">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-mono font-bold text-slate-700 dark:text-slate-300 focus:outline-none cursor-pointer"
            >
              <option value="all">Status: All</option>
              <option value="RUNNING">Running</option>
              <option value="CRASHLOOPBACKOFF">CrashLoopBackOff</option>
              <option value="STOPPED">Stopped</option>
            </select>

            <button
              onClick={fetchContainers}
              disabled={loading}
              className="p-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl transition-colors cursor-pointer"
              title="Refresh containers"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* Containers Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 font-mono font-bold text-slate-500 dark:text-slate-400 bg-slate-50/50 dark:bg-slate-900/50">
                <th className="py-3 px-4">Container Pod</th>
                <th className="py-3 px-4">Image Tag</th>
                <th className="py-3 px-4">Node Host</th>
                <th className="py-3 px-4">CPU %</th>
                <th className="py-3 px-4">Memory RAM</th>
                <th className="py-3 px-4">Restarts</th>
                <th className="py-3 px-4">Uptime</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-mono">
              {loading ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-400">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-blue-500" />
                    <span>Loading active container pods...</span>
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-400">
                    <p className="font-bold text-slate-700 dark:text-slate-300">No matching containers found</p>
                  </td>
                </tr>
              ) : (
                filtered.map((ctr) => (
                  <tr key={ctr.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="py-3.5 px-4 font-bold text-slate-900 dark:text-white">
                      <div className="flex items-center gap-2">
                        <Box className="w-4 h-4 text-blue-500 shrink-0" />
                        <div>
                          <span className="text-slate-900 dark:text-white">{ctr.name}</span>
                          <p className="text-[10px] text-slate-400 font-normal">App: {ctr.app} • IP: {ctr.ip}</p>
                        </div>
                      </div>
                    </td>

                    <td className="py-3.5 px-4 text-slate-600 dark:text-slate-300 max-w-[180px] truncate" title={ctr.image}>
                      {ctr.image}
                    </td>

                    <td className="py-3.5 px-4 text-slate-500 dark:text-slate-400">{ctr.node}</td>
                    <td className="py-3.5 px-4 text-slate-700 dark:text-slate-300 font-bold">{ctr.cpu_pct}%</td>
                    <td className="py-3.5 px-4 text-slate-700 dark:text-slate-300">{ctr.ram_mb} MB</td>

                    <td className="py-3.5 px-4">
                      <span className={`px-2 py-0.5 rounded font-bold text-[10px] ${
                        ctr.restarts > 0 ? 'bg-rose-50 dark:bg-rose-500/15 text-rose-700 dark:text-rose-400' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
                      }`}>
                        {ctr.restarts}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-slate-500 dark:text-slate-400">{ctr.uptime}</td>

                    <td className="py-3.5 px-4">
                      <StatusBadge status={ctr.status} size="sm" />
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => viewContainerLogs(ctr)}
                          title="Inspect Stdout Logs"
                          className="p-1.5 text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                        >
                          <Terminal className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleContainerAction(ctr, 'restart')}
                          title="Restart Container"
                          className="p-1.5 text-slate-400 hover:text-amber-600 dark:hover:text-amber-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleContainerAction(ctr, 'stop')}
                          title="Stop Container"
                          className="p-1.5 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                        >
                          <Square className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Container Logs Terminal Modal */}
      {activeLogsContainer && (
        <ModalPortal isOpen={!!activeLogsContainer} onClose={() => setActiveLogsContainer(null)} maxWidth="max-w-2xl">
          <div className="space-y-4 font-mono">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2.5">
                <Terminal className="w-5 h-5 text-emerald-400" />
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">{activeLogsContainer.name}</h3>
                  <p className="text-xs text-slate-500">Live stdout/stderr stream • Node: {activeLogsContainer.node}</p>
                </div>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-slate-950 text-slate-200 text-xs h-64 overflow-y-auto space-y-1.5 border border-slate-800">
              {logsLoading ? (
                <p className="text-slate-500">Connecting to container log stream socket...</p>
              ) : logs.length === 0 ? (
                <p className="text-slate-500">No output lines emitted.</p>
              ) : (
                logs.map((l, i) => (
                  <p key={i} className="text-emerald-400 leading-relaxed">
                    <span className="text-slate-500 mr-2">[{l.timestamp}]</span>
                    {l.log}
                  </p>
                ))
              )}
            </div>

            <div className="flex justify-end pt-2 border-t border-slate-200 dark:border-slate-800">
              <button
                onClick={() => setActiveLogsContainer(null)}
                className="px-4 py-2 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700"
              >
                Close Stream
              </button>
            </div>
          </div>
        </ModalPortal>
      )}

      {/* Confirmation Modal */}
      <ConfirmModal
        isOpen={confirmModal.isOpen}
        onClose={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
        onConfirm={confirmModal.action}
        title={confirmModal.title}
        message={confirmModal.message}
        variant={confirmModal.variant}
        isLoading={actionLoading}
      />
    </div>
  );
};
