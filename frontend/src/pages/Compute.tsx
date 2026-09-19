import React, { useState, useEffect } from 'react';
import { 
  Server, Plus, Play, Square, RotateCw, Trash2, RefreshCw, Search
} from 'lucide-react';
import { CreateComputeWizardModal, ComputeConfig } from '../components/CreateComputeWizardModal';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';
import { apiFetch } from '../config/api';

interface ComputeProps {
  token: string | null;
}

export const Compute: React.FC<ComputeProps> = ({ token }) => {
  const [instances, setInstances] = useState<any[]>([]);
  const [summary, setSummary] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showDeployWizard, setShowDeployWizard] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRegion, setSelectedRegion] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [confirmTarget, setConfirmTarget] = useState<{ id: string; action: 'stop' | 'terminate'; name: string } | null>(null);

  const fetchInstances = async () => {
    setLoading(true);
    try {
      let path = '/v1/compute/instances';
      const params = new URLSearchParams();
      if (selectedRegion) params.append('region', selectedRegion);
      if (selectedStatus) params.append('status', selectedStatus);
      if (params.toString()) path += `?${params.toString()}`;

      const data = await apiFetch<any[]>(path, { token }).catch(() => null);
      if (data) setInstances(Array.isArray(data) ? data : []);

      const sum = await apiFetch<any>('/v1/compute/summary', { token }).catch(() => null);
      if (sum) setSummary(sum);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInstances();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, selectedRegion, selectedStatus]);

  const handleDeploy = async (config: ComputeConfig) => {
    setActionLoading('deploy');
    try {
      await apiFetch('/v1/compute/instances', {
        method: 'POST',
        token,
        body: JSON.stringify({
          name: config.name,
          instance_type: config.instanceType,
          os_image: config.osImage,
          region: config.region,
          disk_gb: Number(config.diskGb),
          spec: {
            environment: config.environment,
            vpc_subnet: config.vpcSubnet,
            assign_public_ip: config.assignPublicIp,
            auto_suspend: config.autoSuspend,
            suspend_minutes: config.suspendMinutes,
            ssh_key_name: config.sshKeyName,
          }
        })
      });
      setShowDeployWizard(false);
      fetchInstances();
    } catch (err) {
      console.error(err);
      throw err;
    } finally {
      setActionLoading(null);
    }
  };

  const handleAction = async (instanceId: string, action: string) => {
    setActionLoading(`${instanceId}-${action}`);
    try {
      await apiFetch(`/v1/compute/instances/${instanceId}/action`, {
        method: 'POST',
        token,
        body: JSON.stringify({ action })
      });
      fetchInstances();
    } catch (err) {
      console.error(err);
    } finally {
      setActionLoading(null);
    }
  };

  const filteredInstances = instances.filter(inst => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      (inst.name && inst.name.toLowerCase().includes(q)) ||
      (inst.id && inst.id.toLowerCase().includes(q)) ||
      (inst.instance_type && inst.instance_type.toLowerCase().includes(q)) ||
      (inst.private_ip && inst.private_ip.includes(q))
    );
  });

  return (
    <div className="p-4 sm:p-6 space-y-5 max-w-7xl mx-auto font-sans">
      {/* Top Action Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white dark:bg-[#0F2038] border border-slate-200 dark:border-slate-800 p-5 rounded-2xl shadow-sm">
        <div>
          <h2 className="text-base sm:text-lg font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <Server className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            ArvCompute Virtual Machines
          </h2>
          <p className="text-xs text-slate-600 dark:text-slate-400 font-mono mt-0.5">
            Production-grade elastic cloud compute instances & container hosts
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchInstances}
            disabled={loading}
            className="p-2.5 text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-900 hover:bg-slate-200 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 rounded-xl transition-colors cursor-pointer"
            title="Refresh List"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-blue-500' : ''}`} />
          </button>

          <button
            onClick={() => setShowDeployWizard(true)}
            className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl transition-all flex items-center gap-2 shadow-md shadow-blue-600/20 cursor-pointer"
          >
            <Plus className="w-4 h-4" /> Deploy VM Instance
          </button>
        </div>
      </div>

      {/* KPI Metrics Widgets */}
      {summary && (
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3.5">
          <div className="bg-white dark:bg-[#0F2038] border border-slate-200 dark:border-slate-800 p-4 sm:p-5 rounded-2xl shadow-xs">
            <span className="text-[10px] font-mono uppercase font-bold text-slate-500 dark:text-slate-400">Total Instances</span>
            <p className="text-2xl font-black text-slate-900 dark:text-white mt-1 font-mono">{summary.total_instances || instances.length}</p>
          </div>
          <div className="bg-white dark:bg-[#0F2038] border border-slate-200 dark:border-slate-800 p-4 sm:p-5 rounded-2xl shadow-xs">
            <span className="text-[10px] font-mono uppercase font-bold text-emerald-600 dark:text-emerald-400">Running Nodes</span>
            <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1 font-mono">{summary.running || instances.filter(i => i.status === 'RUNNING').length}</p>
          </div>
          <div className="bg-white dark:bg-[#0F2038] border border-slate-200 dark:border-slate-800 p-4 sm:p-5 rounded-2xl shadow-xs">
            <span className="text-[10px] font-mono uppercase font-bold text-slate-500 dark:text-slate-400">Stopped</span>
            <p className="text-2xl font-black text-slate-500 dark:text-slate-400 mt-1 font-mono">{summary.stopped || instances.filter(i => i.status === 'STOPPED').length}</p>
          </div>
          <div className="bg-white dark:bg-[#0F2038] border border-slate-200 dark:border-slate-800 p-4 sm:p-5 rounded-2xl shadow-xs">
            <span className="text-[10px] font-mono uppercase font-bold text-blue-600 dark:text-blue-400">Allocated vCPU</span>
            <p className="text-2xl font-black text-blue-600 dark:text-blue-400 mt-1 font-mono">{summary.total_vcpus || instances.length * 2} vCPUs</p>
          </div>
          <div className="bg-white dark:bg-[#0F2038] border border-slate-200 dark:border-slate-800 p-4 sm:p-5 rounded-2xl shadow-xs col-span-2 lg:col-span-1">
            <span className="text-[10px] font-mono uppercase font-bold text-purple-600 dark:text-purple-400">Allocated RAM</span>
            <p className="text-2xl font-black text-purple-600 dark:text-purple-400 mt-1 font-mono">{summary.total_ram_gb || instances.length * 4} GB</p>
          </div>
        </div>
      )}

      {/* Filter & Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white dark:bg-[#0F2038] border border-slate-200 dark:border-slate-800 p-3.5 rounded-2xl shadow-xs">
        <div className="relative flex-1 max-w-md">
          <Search className="w-3.5 h-3.5 absolute left-3 top-3 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Filter by name, ID, or IP..."
            className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700/80 rounded-xl text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-blue-500 font-sans"
          />
        </div>

        <div className="flex items-center gap-2">
          <select
            value={selectedRegion}
            onChange={(e) => setSelectedRegion(e.target.value)}
            className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700/80 text-slate-700 dark:text-slate-300 rounded-xl px-3 py-2 text-xs font-mono font-medium focus:outline-none"
          >
            <option value="">All Regions</option>
            <option value="arv-us-east-1">arv-us-east-1</option>
            <option value="arv-in-central-1">arv-in-central-1</option>
            <option value="arv-eu-west-1">arv-eu-west-1</option>
          </select>

          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700/80 text-slate-700 dark:text-slate-300 rounded-xl px-3 py-2 text-xs font-mono font-medium focus:outline-none"
          >
            <option value="">All Statuses</option>
            <option value="RUNNING">Running</option>
            <option value="STOPPED">Stopped</option>
          </select>
        </div>
      </div>

      {/* Resource Table */}
      <div className="bg-white dark:bg-[#0F2038] border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 text-[11px] font-mono uppercase text-slate-500 dark:text-slate-400 bg-slate-50/80 dark:bg-slate-900/50">
                <th className="p-4 font-bold">Instance & ID</th>
                <th className="p-4 font-bold">Size & Spec</th>
                <th className="p-4 font-bold">Private IP</th>
                <th className="p-4 font-bold">Public IP</th>
                <th className="p-4 font-bold">Region</th>
                <th className="p-4 font-bold">Status</th>
                <th className="p-4 font-bold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-mono text-xs">
              {loading && instances.length === 0 ? (
                // Loading Skeletons
                [1, 2, 3].map((n) => (
                  <tr key={n} className="animate-pulse">
                    <td className="p-4"><div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-32" /></td>
                    <td className="p-4"><div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-24" /></td>
                    <td className="p-4"><div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-20" /></td>
                    <td className="p-4"><div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-20" /></td>
                    <td className="p-4"><div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-24" /></td>
                    <td className="p-4"><div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-16" /></td>
                    <td className="p-4 text-right"><div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-16 ml-auto" /></td>
                  </tr>
                ))
              ) : filteredInstances.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-12 text-center">
                    <div className="max-w-sm mx-auto space-y-3 font-sans">
                      <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 mx-auto flex items-center justify-center">
                        <Server className="w-6 h-6" />
                      </div>
                      <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                        {searchQuery ? 'No matching compute instances' : 'No Compute Instances Found'}
                      </h4>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        {searchQuery
                          ? 'Try adjusting your search filters or clearing the search query.'
                          : 'Provision your first high-performance virtual machine in seconds.'}
                      </p>
                      {!searchQuery && (
                        <button
                          onClick={() => setShowDeployWizard(true)}
                          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-sm transition-colors cursor-pointer"
                        >
                          Launch Compute Instance
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                filteredInstances.map((inst) => (
                  <tr key={inst.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                    <td className="p-4 font-sans">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded-xl border border-blue-200 dark:border-blue-500/20 shrink-0">
                          <Server className="w-4 h-4" />
                        </div>
                        <div>
                          <p className="font-bold text-slate-900 dark:text-white text-xs">{inst.name}</p>
                          <p className="font-mono text-[10px] text-slate-500 dark:text-slate-400">{inst.id}</p>
                        </div>
                      </div>
                    </td>

                    <td className="p-4">
                      <p className="font-bold text-slate-900 dark:text-slate-200">{inst.instance_type || 'arv.medium'}</p>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400 font-sans">{inst.os_image || 'Ubuntu 22.04 LTS'}</p>
                    </td>

                    <td className="p-4 text-slate-700 dark:text-slate-300">{inst.private_ip || '10.240.0.12'}</td>
                    <td className="p-4 text-slate-500 dark:text-slate-400">{inst.public_ip || '—'}</td>
                    <td className="p-4 text-slate-700 dark:text-slate-300 font-sans">{inst.region || 'arv-us-east-1'}</td>

                    <td className="p-4">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold font-mono border inline-flex items-center gap-1 ${
                        inst.status === 'RUNNING'
                          ? 'bg-emerald-50 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/30'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700'
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${inst.status === 'RUNNING' ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'}`} />
                        {inst.status || 'RUNNING'}
                      </span>
                    </td>

                    <td className="p-4 text-right space-x-1 shrink-0">
                      {inst.status === 'STOPPED' ? (
                        <button
                          onClick={() => handleAction(inst.id, 'start')}
                          disabled={!!actionLoading}
                          className="p-1.5 bg-emerald-50 dark:bg-emerald-500/10 hover:bg-emerald-100 dark:hover:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/30 rounded-lg transition-colors cursor-pointer"
                          title="Start Instance"
                        >
                          <Play className="w-3.5 h-3.5" />
                        </button>
                      ) : (
                        <button
                          onClick={() => setConfirmTarget({ id: inst.id, action: 'stop', name: inst.name })}
                          disabled={!!actionLoading}
                          className="p-1.5 bg-amber-50 dark:bg-amber-500/10 hover:bg-amber-100 dark:hover:bg-amber-500/20 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-500/30 rounded-lg transition-colors cursor-pointer"
                          title="Stop Instance"
                        >
                          <Square className="w-3.5 h-3.5" />
                        </button>
                      )}

                      <button
                        onClick={() => handleAction(inst.id, 'reboot')}
                        disabled={!!actionLoading || inst.status !== 'RUNNING'}
                        className="p-1.5 bg-blue-50 dark:bg-blue-500/10 hover:bg-blue-100 dark:hover:bg-blue-500/20 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-500/30 rounded-lg transition-colors cursor-pointer disabled:opacity-30"
                        title="Reboot Instance"
                      >
                        <RotateCw className="w-3.5 h-3.5" />
                      </button>

                      <button
                        onClick={() => setConfirmTarget({ id: inst.id, action: 'terminate', name: inst.name })}
                        disabled={!!actionLoading}
                        className="p-1.5 bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 dark:hover:bg-rose-900/40 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-900/50 rounded-lg transition-colors cursor-pointer"
                        title="Terminate Instance"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Step-by-Step Compute Provisioning Wizard Modal */}
      <CreateComputeWizardModal
        isOpen={showDeployWizard}
        onClose={() => setShowDeployWizard(false)}
        onSubmit={handleDeploy}
        loading={actionLoading === 'deploy'}
      />

      {/* Destructive Action Confirmation Dialog */}
      <ConfirmDialog
        isOpen={!!confirmTarget}
        onClose={() => setConfirmTarget(null)}
        onConfirm={async () => {
          if (confirmTarget) {
            await handleAction(confirmTarget.id, confirmTarget.action);
            setConfirmTarget(null);
          }
        }}
        title={confirmTarget?.action === 'terminate' ? 'Terminate Compute Instance' : 'Stop Compute Instance'}
        description={
          confirmTarget?.action === 'terminate'
            ? `Are you sure you want to permanently delete '${confirmTarget?.name}' (${confirmTarget?.id})? This action cannot be undone and attached virtual disks will be released.`
            : `Are you sure you want to stop '${confirmTarget?.name}'? Workloads hosted on this instance will become temporarily unreachable.`
        }
        confirmLabel={confirmTarget?.action === 'terminate' ? 'Terminate Instance' : 'Stop Instance'}
        isDestructive={confirmTarget?.action === 'terminate'}
        loading={!!actionLoading}
      />
    </div>
  );
};
