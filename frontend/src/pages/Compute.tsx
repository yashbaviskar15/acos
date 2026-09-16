import React, { useState, useEffect } from 'react';
import { Server, Plus, Play, Square, RotateCw, Trash2, RefreshCw, Moon, Clock, Zap } from 'lucide-react';
import { ModalPortal } from '../components/ModalPortal';
import { apiFetch } from '../config/api';

interface ComputeProps {
  token: string | null;
}

export const Compute: React.FC<ComputeProps> = ({ token }) => {
  const [instances, setInstances] = useState<any[]>([]);
  const [summary, setSummary] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showDeployModal, setShowDeployModal] = useState(false);
  const [selectedRegion, setSelectedRegion] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');

  // Form State
  const [name, setName] = useState('');
  const [instanceType, setInstanceType] = useState('arv.medium');
  const [osImage, setOsImage] = useState('Ubuntu 22.04 LTS');
  const [region, setRegion] = useState('arv-us-east-1');
  const [diskGb, setDiskGb] = useState(50);
  const [environment, setEnvironment] = useState<'development' | 'staging' | 'production'>('development');
  const [autoSuspend, setAutoSuspend] = useState(true);
  const [suspendMinutes, setSuspendMinutes] = useState(30);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const calculateAllInPrice = () => {
    const basePrices: Record<string, number> = {
      'arv.micro': 350,
      'arv.small': 700,
      'arv.medium': 1400,
      'arv.large': 2800,
      'arv.xlarge': 5600,
    };
    const computeBase = basePrices[instanceType] || 1400;
    const diskCost = diskGb * 4;
    const fullMonthly = computeBase + diskCost;
    const effectiveMonthly = autoSuspend && environment !== 'production' ? Math.round(fullMonthly * 0.38) : fullMonthly;
    return { fullMonthly, effectiveMonthly };
  };

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

  const handleDeploy = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionLoading('deploy');
    try {
      await apiFetch('/v1/compute/instances', {
        method: 'POST',
        token,
        body: JSON.stringify({ name, instance_type: instanceType, os_image: osImage, region, disk_gb: Number(diskGb) })
      });
      setShowDeployModal(false);
      setName('');
      fetchInstances();
    } catch (err) {
      console.error(err);
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

  return (
    <div className="p-4 sm:p-6 space-y-6">
      {/* Top Action Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white dark:bg-[#0F2038] border border-slate-200 dark:border-slate-800 p-5 rounded-2xl shadow-sm">
        <div>
          <h2 className="text-base sm:text-lg font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <Server className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            ArvCompute Virtual Machines
          </h2>
          <p className="text-xs text-slate-600 dark:text-slate-400 font-mono mt-0.5">High-performance elastic cloud compute instances</p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchInstances}
            className="p-2.5 text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-900 hover:bg-slate-200 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 rounded-xl transition-colors cursor-pointer"
            title="Refresh List"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>

          <button
            onClick={() => setShowDeployModal(true)}
            className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl transition-colors flex items-center gap-2 shadow-md cursor-pointer"
          >
            <Plus className="w-4 h-4" /> Deploy VM Instance
          </button>
        </div>
      </div>

      {/* Summary KPI Widgets */}
      {summary && (
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
          <div className="bg-white dark:bg-[#0F2038] border border-slate-200 dark:border-slate-800 p-5 rounded-2xl shadow-sm">
            <span className="text-[10px] font-mono uppercase font-bold text-slate-500 dark:text-slate-400">Total Instances</span>
            <p className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white mt-1">{summary.total_instances}</p>
          </div>
          <div className="bg-white dark:bg-[#0F2038] border border-slate-200 dark:border-slate-800 p-5 rounded-2xl shadow-sm">
            <span className="text-[10px] font-mono uppercase font-bold text-emerald-600 dark:text-emerald-400">Running</span>
            <p className="text-2xl sm:text-3xl font-black text-emerald-600 dark:text-emerald-400 mt-1">{summary.running}</p>
          </div>
          <div className="bg-white dark:bg-[#0F2038] border border-slate-200 dark:border-slate-800 p-5 rounded-2xl shadow-sm">
            <span className="text-[10px] font-mono uppercase font-bold text-slate-500 dark:text-slate-400">Stopped</span>
            <p className="text-2xl sm:text-3xl font-black text-slate-500 dark:text-slate-400 mt-1">{summary.stopped}</p>
          </div>
          <div className="bg-white dark:bg-[#0F2038] border border-slate-200 dark:border-slate-800 p-5 rounded-2xl shadow-sm">
            <span className="text-[10px] font-mono uppercase font-bold text-blue-600 dark:text-blue-400">Total vCPUs</span>
            <p className="text-2xl sm:text-3xl font-black text-blue-600 dark:text-blue-400 mt-1">{summary.total_vcpus} vCPUs</p>
          </div>
          <div className="bg-white dark:bg-[#0F2038] border border-slate-200 dark:border-slate-800 p-5 rounded-2xl shadow-sm">
            <span className="text-[10px] font-mono uppercase font-bold text-purple-600 dark:text-purple-400">Total Memory</span>
            <p className="text-2xl sm:text-3xl font-black text-purple-600 dark:text-purple-400 mt-1">{summary.total_ram_gb} GB</p>
          </div>
        </div>
      )}

      {/* Filters Bar */}
      <div className="flex items-center gap-4 bg-white dark:bg-[#0F2038] border border-slate-200 dark:border-slate-800 p-4 rounded-2xl text-xs shadow-sm">
        <span className="font-mono text-slate-600 dark:text-slate-400 uppercase text-[10px] font-bold">Filter By:</span>
        <select
          value={selectedRegion}
          onChange={(e) => setSelectedRegion(e.target.value)}
          className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl px-3 py-1.5 focus:outline-none focus:border-blue-600 font-mono font-bold"
        >
          <option value="">All Regions</option>
          <option value="arv-us-east-1">arv-us-east-1</option>
          <option value="arv-us-west-2">arv-us-west-2</option>
          <option value="arv-eu-west-1">arv-eu-west-1</option>
          <option value="arv-ap-south-1">arv-ap-south-1</option>
        </select>

        <select
          value={selectedStatus}
          onChange={(e) => setSelectedStatus(e.target.value)}
          className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl px-3 py-1.5 focus:outline-none focus:border-blue-600 font-mono font-bold"
        >
          <option value="">All Statuses</option>
          <option value="RUNNING">Running</option>
          <option value="STOPPED">Stopped</option>
        </select>
      </div>

      {/* Main Instance Table */}
      <div className="bg-white dark:bg-[#0F2038] border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-900/80 text-slate-600 dark:text-slate-400 font-mono text-[10px] uppercase border-b border-slate-200 dark:border-slate-800 font-extrabold">
              <tr>
                <th className="p-4">Instance Name & ID</th>
                <th className="p-4">Type & OS</th>
                <th className="p-4">Private IP</th>
                <th className="p-4">Public IP</th>
                <th className="p-4">Region</th>
                <th className="p-4">CPU / RAM</th>
                <th className="p-4">Status</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800/60 font-mono">
              {instances.map((inst) => (
                <tr key={inst.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded-xl border border-blue-200 dark:border-blue-500/20">
                        <Server className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-bold text-slate-900 dark:text-white text-xs">{inst.name}</p>
                          <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                            Auto-Suspend: 30m
                          </span>
                        </div>
                        <p className="font-mono text-[10px] text-slate-500 dark:text-slate-400">{inst.id}</p>
                      </div>
                    </div>
                  </td>

                  <td className="p-4">
                    <p className="font-mono font-bold text-slate-900 dark:text-slate-200">{inst.instance_type}</p>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400">{inst.os_image}</p>
                  </td>

                  <td className="p-4 font-mono text-slate-700 dark:text-slate-300">{inst.private_ip}</td>
                  <td className="p-4 font-mono text-slate-500 dark:text-slate-400">{inst.public_ip || '—'}</td>
                  <td className="p-4 text-slate-700 dark:text-slate-300">{inst.region}</td>

                  <td className="p-4 font-mono text-[11px]">
                    {inst.status === 'RUNNING' ? (
                      <div>
                        <span className="text-blue-600 dark:text-blue-400 font-bold">{inst.cpu_usage}% CPU</span> • <span className="text-purple-600 dark:text-purple-400 font-bold">{inst.ram_usage}% RAM</span>
                      </div>
                    ) : (
                      <span className="text-slate-400">Offline</span>
                    )}
                  </td>

                  <td className="p-4">
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold font-mono border ${
                      inst.status === 'RUNNING' 
                        ? 'bg-emerald-50 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/30' 
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700'
                    }`}>
                      {inst.status}
                    </span>
                  </td>

                  <td className="p-4 text-right space-x-1">
                    {inst.status === 'STOPPED' ? (
                      <button
                        onClick={() => handleAction(inst.id, 'start')}
                        disabled={!!actionLoading}
                        className="p-2 bg-emerald-50 dark:bg-emerald-500/10 hover:bg-emerald-100 dark:hover:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/30 rounded-xl transition-colors cursor-pointer"
                        title="Start Instance"
                      >
                        <Play className="w-3.5 h-3.5" />
                      </button>
                    ) : (
                      <button
                        onClick={() => handleAction(inst.id, 'stop')}
                        disabled={!!actionLoading}
                        className="p-2 bg-amber-50 dark:bg-amber-500/10 hover:bg-amber-100 dark:hover:bg-amber-500/20 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-500/30 rounded-xl transition-colors cursor-pointer"
                        title="Stop Instance"
                      >
                        <Square className="w-3.5 h-3.5" />
                      </button>
                    )}

                    <button
                      onClick={() => handleAction(inst.id, 'reboot')}
                      disabled={!!actionLoading || inst.status !== 'RUNNING'}
                      className="p-2 bg-blue-50 dark:bg-blue-500/10 hover:bg-blue-100 dark:hover:bg-blue-500/20 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-500/30 rounded-xl transition-colors cursor-pointer"
                      title="Reboot Instance"
                    >
                      <RotateCw className="w-3.5 h-3.5" />
                    </button>

                    <button
                      onClick={() => handleAction(inst.id, 'terminate')}
                      disabled={!!actionLoading}
                      className="p-2 bg-red-50 dark:bg-red-500/10 hover:bg-red-100 dark:hover:bg-red-500/20 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-500/30 rounded-xl transition-colors cursor-pointer"
                      title="Terminate Instance"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Deploy Instance Modal */}
      <ModalPortal isOpen={showDeployModal} onClose={() => setShowDeployModal(false)}>
        <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3.5">
          <h3 className="text-base font-black text-slate-900 dark:text-white uppercase tracking-wider font-mono">Deploy Virtual Machine</h3>
          <button onClick={() => setShowDeployModal(false)} className="text-slate-400 hover:text-slate-700 dark:hover:text-white text-lg font-bold cursor-pointer"></button>
        </div>

        <form onSubmit={handleDeploy} className="space-y-4 text-xs mt-4">
          <div>
            <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1.5 uppercase font-mono">Instance Name</label>
            <input
              type="text"
              required
              placeholder="e.g. web-frontend-prod-02"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-slate-900 dark:text-white focus:outline-none focus:border-blue-600"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1.5 uppercase font-mono">Instance Type</label>
              <select
                value={instanceType}
                onChange={(e) => setInstanceType(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-slate-900 dark:text-white focus:outline-none focus:border-blue-600"
              >
                <option value="arv.micro">arv.micro (1 vCPU, 1GB)</option>
                <option value="arv.small">arv.small (1 vCPU, 2GB)</option>
                <option value="arv.medium">arv.medium (2 vCPU, 4GB)</option>
                <option value="arv.large">arv.large (2 vCPU, 8GB)</option>
                <option value="arv.xlarge">arv.xlarge (4 vCPU, 16GB)</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1.5 uppercase font-mono">Region</label>
              <select
                value={region}
                onChange={(e) => setRegion(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-slate-900 dark:text-white focus:outline-none focus:border-blue-600"
              >
                <option value="arv-us-east-1">arv-us-east-1</option>
                <option value="arv-us-west-2">arv-us-west-2</option>
                <option value="arv-eu-west-1">arv-eu-west-1</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1.5 uppercase font-mono">OS Image</label>
              <select
                value={osImage}
                onChange={(e) => setOsImage(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-slate-900 dark:text-white focus:outline-none focus:border-blue-600"
              >
                <option value="Ubuntu 22.04 LTS">Ubuntu 22.04 LTS</option>
                <option value="Ubuntu 24.04 LTS">Ubuntu 24.04 LTS</option>
                <option value="Amazon Linux 2023">Amazon Linux 2023</option>
                <option value="Debian 12">Debian 12</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1.5 uppercase font-mono">Disk Size (GB)</label>
              <input
                type="number"
                value={diskGb}
                onChange={(e) => setDiskGb(Number(e.target.value))}
                min={10}
                max={2000}
                className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-slate-900 dark:text-white focus:outline-none focus:border-blue-600"
              />
            </div>
          </div>

          {/* Environment Selector */}
          <div>
            <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1.5 uppercase font-mono">Environment Tier</label>
            <div className="grid grid-cols-3 gap-2">
              {(['development', 'staging', 'production'] as const).map((env) => (
                <button
                  key={env}
                  type="button"
                  onClick={() => {
                    setEnvironment(env);
                    if (env === 'production') {
                      setAutoSuspend(false);
                    } else {
                      setAutoSuspend(true);
                      setSuspendMinutes(30);
                    }
                  }}
                  className={`py-2 px-3 rounded-xl border text-center font-bold capitalize transition-all cursor-pointer ${
                    environment === env
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-500/15 text-blue-700 dark:text-blue-300 shadow-sm'
                      : 'border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-slate-600 dark:text-slate-400'
                  }`}
                >
                  {env}
                </button>
              ))}
            </div>
          </div>

          {/* Non-Prod Auto-Suspend Autopilot */}
          <div className="p-3.5 bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 rounded-xl space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Moon className="w-4 h-4 text-amber-500" />
                <span className="font-bold text-slate-800 dark:text-slate-200">Non-Prod Auto-Suspend</span>
                {environment !== 'production' && (
                  <span className="px-2 py-0.5 text-[9px] font-bold rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                    On by Default
                  </span>
                )}
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={autoSuspend}
                  onChange={(e) => setAutoSuspend(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-9 h-5 bg-slate-300 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Automatically suspends CPU cores after inactivity. Wakes instantly on incoming traffic with zero state loss.
            </p>
            {autoSuspend && (
              <div className="flex items-center gap-2 pt-1">
                <Clock className="w-3.5 h-3.5 text-slate-400" />
                <span className="text-[11px] text-slate-600 dark:text-slate-300 font-bold">Inactivity Timer:</span>
                <select
                  value={suspendMinutes}
                  onChange={(e) => setSuspendMinutes(Number(e.target.value))}
                  className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1 text-xs font-bold text-slate-900 dark:text-white"
                >
                  <option value={15}>15 minutes</option>
                  <option value={30}>30 minutes (Recommended)</option>
                  <option value={60}>1 hour</option>
                  <option value={120}>2 hours</option>
                </select>
              </div>
            )}
          </div>

          {/* All-in Pricing Display */}
          <div className="p-4 bg-gradient-to-br from-blue-500/5 via-slate-50 dark:via-slate-900 to-slate-100 dark:to-slate-950 border border-blue-500/20 rounded-2xl space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400 flex items-center gap-1.5">
                <Zap className="w-3.5 h-3.5" /> All-In Estimated Monthly Price
              </span>
              <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400">
                100 GB Egress Included
              </span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-xl font-black text-slate-900 dark:text-white">
                ₹{calculateAllInPrice().effectiveMonthly.toLocaleString()}/mo
              </span>
              {autoSuspend && environment !== 'production' && (
                <span className="text-[11px] text-slate-400 line-through">
                  ₹{calculateAllInPrice().fullMonthly.toLocaleString()}/mo
                </span>
              )}
              <span className="text-[11px] text-slate-500 font-medium">all-in estimate</span>
            </div>
            <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-tight">
              Includes {instanceType} + {diskGb}GB NVMe SSD storage + 100GB bundled network egress. No hidden intra-VPC or API request fees.
            </p>
          </div>

          <div className="pt-3 flex gap-3">
            <button
              type="button"
              onClick={() => setShowDeployModal(false)}
              className="w-1/2 py-3 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold rounded-xl text-xs transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={Boolean(actionLoading)}
              className="w-1/2 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs shadow-lg shadow-blue-600/20 transition-all cursor-pointer"
            >
              {actionLoading ? 'Launching...' : 'Launch Instance'}
            </button>
          </div>
        </form>
      </ModalPortal>
    </div>
  );
};
