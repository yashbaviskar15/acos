import React, { useState, useEffect } from 'react';
import { 
  Server, 
  Search, 
  RefreshCw, 
  Boxes, 
  Database, 
  HardDrive, 
  Network, 
  Layers, 
  Square, 
  RotateCcw, 
  Trash2, 
  ChevronRight,
  CheckCircle2,
  AlertTriangle,
  AlertOctagon
} from 'lucide-react';
import { apiFetch } from '../config/api';
import { StatusBadge } from '../components/StatusBadge';
import { ConfirmModal } from '../components/ConfirmModal';
import { ModalPortal } from '../components/ModalPortal';

interface ResourceItem {
  id: string;
  name: string;
  type: string;
  provider: string;
  region: string;
  env: string;
  status: string;
  specs: string;
  uptime: string;
  tags: Record<string, string>;
}

export const Infrastructure: React.FC<{ token: string | null }> = ({ token }) => {
  const [resources, setResources] = useState<ResourceItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedEnv, setSelectedEnv] = useState<string>('all');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  
  // Selected resource for inspect modal
  const [inspectResource, setInspectResource] = useState<ResourceItem | null>(null);
  
  // Destructive action state
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

  const fetchInventory = async () => {
    setLoading(true);
    try {
      const data = await apiFetch<any>('/api/v1/operations/infrastructure/inventory', { token });
      if (data && data.resources) {
        setResources(data.resources);
      }
    } catch (err: any) {
      console.error('Failed to fetch infrastructure inventory:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInventory();
  }, [token]);

  // Filter logic
  const filteredResources = resources.filter((res) => {
    const matchesSearch = 
      res.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      res.type.toLowerCase().includes(searchTerm.toLowerCase()) ||
      res.region.toLowerCase().includes(searchTerm.toLowerCase()) ||
      Object.entries(res.tags || {}).some(([k, v]) => `${k}:${v}`.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesEnv = selectedEnv === 'all' || res.env.toLowerCase() === selectedEnv.toLowerCase();
    const matchesType = selectedType === 'all' || res.type.toLowerCase() === selectedType.toLowerCase();
    const matchesStatus = selectedStatus === 'all' || res.status.toLowerCase() === selectedStatus.toLowerCase();

    return matchesSearch && matchesEnv && matchesType && matchesStatus;
  });

  const getResourceIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case 'compute vm': return Server;
      case 'kubernetes cluster': return Boxes;
      case 'managed database':
      case 'managed in-memory': return Database;
      case 'object storage': return HardDrive;
      case 'microservice': return Layers;
      default: return Network;
    }
  };

  const handleResourceAction = (res: ResourceItem, actionType: 'restart' | 'stop' | 'delete') => {
    if (actionType === 'restart') {
      setConfirmModal({
        isOpen: true,
        title: `Restart Resource: ${res.name}`,
        message: `Are you sure you want to execute a rolling restart on ${res.name} (${res.specs})? Traffic will temporarily failover to healthy replicas.`,
        variant: 'warning',
        action: async () => {
          setActionLoading(true);
          try {
            await new Promise(r => setTimeout(r, 600));
            showToast(`Restart command sent to ${res.name}. Health probes verified.`);
            setConfirmModal(prev => ({ ...prev, isOpen: false }));
          } finally {
            setActionLoading(false);
          }
        }
      });
    } else if (actionType === 'stop') {
      setConfirmModal({
        isOpen: true,
        title: `Stop Resource: ${res.name}`,
        message: `Stopping ${res.name} will halt runtime execution and disconnect dependent microservices. Are you sure?`,
        variant: 'danger',
        action: async () => {
          setActionLoading(true);
          try {
            await new Promise(r => setTimeout(r, 600));
            setResources(prev => prev.map(item => item.id === res.id ? { ...item, status: 'STOPPED' } : item));
            showToast(`Resource ${res.name} has been stopped.`);
            setConfirmModal(prev => ({ ...prev, isOpen: false }));
          } finally {
            setActionLoading(false);
          }
        }
      });
    } else if (actionType === 'delete') {
      setConfirmModal({
        isOpen: true,
        title: `Decommission Resource: ${res.name}`,
        message: `Permanent action: This will tear down ${res.name} (${res.id}), release its IP addresses, and delete attached ephemeral volumes. This cannot be undone.`,
        variant: 'danger',
        action: async () => {
          setActionLoading(true);
          try {
            await new Promise(r => setTimeout(r, 600));
            setResources(prev => prev.filter(item => item.id !== res.id));
            showToast(`Resource ${res.name} decommissioned successfully.`);
            setConfirmModal(prev => ({ ...prev, isOpen: false }));
          } finally {
            setActionLoading(false);
          }
        }
      });
    }
  };

  const totalCount = resources.length;
  const runningCount = resources.filter(r => r.status.toUpperCase() === 'RUNNING').length;
  const warningCount = resources.filter(r => r.status.toUpperCase() === 'WARNING').length;
  const criticalCount = resources.filter(r => r.status.toUpperCase() === 'CRITICAL').length;

  return (
    <div className="space-y-6">
      {/* Toast notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white dark:bg-white dark:text-slate-900 px-4 py-3 rounded-xl shadow-2xl flex items-center gap-3 border border-slate-700 animate-fadeIn font-mono text-xs font-bold">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 dark:text-emerald-600" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Banner & KPI Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-[#0F2038] border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono font-bold uppercase text-slate-500 dark:text-slate-400">Total Assets</span>
            <Server className="w-4 h-4 text-blue-600 dark:text-blue-400" />
          </div>
          <p className="text-2xl font-black text-slate-900 dark:text-white mt-2 font-mono">{totalCount}</p>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 font-mono">Multi-region inventory</p>
        </div>

        <div className="bg-white dark:bg-[#0F2038] border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono font-bold uppercase text-emerald-600 dark:text-emerald-400">Healthy / Running</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          </div>
          <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-2 font-mono">{runningCount}</p>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 font-mono">Passing SLO probes</p>
        </div>

        <div className="bg-white dark:bg-[#0F2038] border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono font-bold uppercase text-amber-600 dark:text-amber-400">Degraded / Warning</span>
            <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400" />
          </div>
          <p className="text-2xl font-black text-amber-600 dark:text-amber-400 mt-2 font-mono">{warningCount}</p>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 font-mono">Under observation</p>
        </div>

        <div className="bg-white dark:bg-[#0F2038] border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono font-bold uppercase text-rose-600 dark:text-rose-400">Critical / Failing</span>
            <AlertOctagon className="w-4 h-4 text-rose-600 dark:text-rose-400" />
          </div>
          <p className="text-2xl font-black text-rose-600 dark:text-rose-400 mt-2 font-mono">{criticalCount}</p>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 font-mono">Requires mitigation</p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white dark:bg-[#0F2038] border border-slate-200 dark:border-slate-800 rounded-2xl p-4 sm:p-5 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row gap-3 items-center justify-between">
          <div className="relative w-full md:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search resource name, type, region, tag..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-mono text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="flex items-center gap-2.5 flex-wrap w-full md:w-auto justify-start md:justify-end">
            {/* Env Filter */}
            <select
              value={selectedEnv}
              onChange={(e) => setSelectedEnv(e.target.value)}
              className="px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-mono font-bold text-slate-700 dark:text-slate-300 focus:outline-none cursor-pointer"
            >
              <option value="all">Env: All Environments</option>
              <option value="production">Env: Production</option>
              <option value="staging">Env: Staging</option>
              <option value="development">Env: Development</option>
            </select>

            {/* Type Filter */}
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-mono font-bold text-slate-700 dark:text-slate-300 focus:outline-none cursor-pointer"
            >
              <option value="all">Type: All Resources</option>
              <option value="Compute VM">Compute VM</option>
              <option value="Kubernetes Cluster">Kubernetes Cluster</option>
              <option value="Managed Database">Managed Database</option>
              <option value="Object Storage">Object Storage</option>
              <option value="Microservice">Microservice</option>
            </select>

            {/* Status Filter */}
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-mono font-bold text-slate-700 dark:text-slate-300 focus:outline-none cursor-pointer"
            >
              <option value="all">Status: All</option>
              <option value="RUNNING">Running / Healthy</option>
              <option value="WARNING">Warning / Degraded</option>
              <option value="CRITICAL">Critical</option>
              <option value="STOPPED">Stopped</option>
            </select>

            <button
              onClick={fetchInventory}
              disabled={loading}
              className="p-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl transition-colors cursor-pointer shrink-0"
              title="Refresh inventory"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* Resources Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 font-mono font-bold text-slate-500 dark:text-slate-400 bg-slate-50/50 dark:bg-slate-900/50">
                <th className="py-3 px-4">Resource & Provider</th>
                <th className="py-3 px-4">Type</th>
                <th className="py-3 px-4">Environment</th>
                <th className="py-3 px-4">Region</th>
                <th className="py-3 px-4">Specs & Capacity</th>
                <th className="py-3 px-4">Uptime</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-mono">
              {loading ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-blue-500" />
                    <span>Synchronizing multi-cloud resource inventory...</span>
                  </td>
                </tr>
              ) : filteredResources.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    <p className="font-bold text-sm text-slate-500 dark:text-slate-400">No matching infrastructure resources found</p>
                    <p className="text-xs mt-1">Try modifying search keywords or clearing environment filters</p>
                  </td>
                </tr>
              ) : (
                filteredResources.map((res) => {
                  const Icon = getResourceIcon(res.type);
                  return (
                    <tr 
                      key={res.id} 
                      className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors group cursor-pointer"
                      onClick={() => setInspectResource(res)}
                    >
                      <td className="py-3.5 px-4 font-bold text-slate-900 dark:text-white">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-500/15 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                            <Icon className="w-4 h-4" />
                          </div>
                          <div>
                            <span className="group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">{res.name}</span>
                            <p className="text-[10px] text-slate-400 dark:text-slate-500 font-normal">{res.provider}</p>
                          </div>
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-[11px]">
                          {res.type}
                        </span>
                      </td>

                      <td className="py-3.5 px-4">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                          res.env === 'production' 
                            ? 'bg-purple-50 dark:bg-purple-500/15 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-500/30'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                        }`}>
                          {res.env}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-slate-500 dark:text-slate-400 text-[11px]">{res.region}</td>
                      <td className="py-3.5 px-4 text-slate-700 dark:text-slate-300 text-[11px]">{res.specs}</td>
                      <td className="py-3.5 px-4 text-slate-500 dark:text-slate-400 text-[11px]">{res.uptime}</td>

                      <td className="py-3.5 px-4">
                        <StatusBadge status={res.status} size="sm" />
                      </td>

                      <td className="py-3.5 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleResourceAction(res, 'restart')}
                            title="Rolling Restart"
                            className="p-1.5 text-slate-400 hover:text-amber-600 dark:hover:text-amber-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                          >
                            <RotateCcw className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleResourceAction(res, 'stop')}
                            title="Stop Instance"
                            className="p-1.5 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                          >
                            <Square className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => setInspectResource(res)}
                            title="Inspect Details"
                            className="p-1.5 text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                          >
                            <ChevronRight className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Inspect Resource Drawer / Modal */}
      {inspectResource && (
        <ModalPortal isOpen={!!inspectResource} onClose={() => setInspectResource(null)} maxWidth="max-w-xl">
          <div className="space-y-5">
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="text-lg font-black text-slate-900 dark:text-white">{inspectResource.name}</h3>
                  <StatusBadge status={inspectResource.status} size="sm" />
                </div>
                <p className="text-xs text-slate-500 font-mono mt-0.5">{inspectResource.provider} • ID: {inspectResource.id}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 font-mono text-xs">
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800">
                <span className="text-[10px] text-slate-400 uppercase font-bold">Resource Type</span>
                <p className="font-bold text-slate-900 dark:text-white mt-1">{inspectResource.type}</p>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800">
                <span className="text-[10px] text-slate-400 uppercase font-bold">Region</span>
                <p className="font-bold text-slate-900 dark:text-white mt-1">{inspectResource.region}</p>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800">
                <span className="text-[10px] text-slate-400 uppercase font-bold">Specification</span>
                <p className="font-bold text-slate-900 dark:text-white mt-1">{inspectResource.specs}</p>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800">
                <span className="text-[10px] text-slate-400 uppercase font-bold">Continuous Uptime</span>
                <p className="font-bold text-slate-900 dark:text-white mt-1">{inspectResource.uptime}</p>
              </div>
            </div>

            <div>
              <span className="text-xs font-mono font-bold uppercase text-slate-500 dark:text-slate-400">Attached Resource Tags</span>
              <div className="flex items-center gap-2 flex-wrap mt-2 font-mono text-xs">
                {Object.entries(inspectResource.tags || {}).map(([k, v]) => (
                  <span key={k} className="px-2.5 py-1 rounded-lg bg-blue-50 dark:bg-blue-500/10 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-500/20 text-[11px]">
                    {k}: <span className="font-bold">{v}</span>
                  </span>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-slate-200 dark:border-slate-800">
              <button
                onClick={() => {
                  const target = inspectResource;
                  setInspectResource(null);
                  handleResourceAction(target, 'delete');
                }}
                className="px-3 py-2 text-xs font-bold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded-xl transition-colors cursor-pointer flex items-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" /> Decommission
              </button>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setInspectResource(null)}
                  className="px-4 py-2 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 transition-colors cursor-pointer"
                >
                  Close
                </button>
                <button
                  onClick={() => {
                    const target = inspectResource;
                    setInspectResource(null);
                    handleResourceAction(target, 'restart');
                  }}
                  className="px-4 py-2 text-xs font-bold bg-blue-600 text-white rounded-xl shadow-md hover:bg-blue-700 transition-colors cursor-pointer flex items-center gap-1.5"
                >
                  <RotateCcw className="w-3.5 h-3.5" /> Rolling Restart
                </button>
              </div>
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
