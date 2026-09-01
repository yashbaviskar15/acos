import React, { useState, useEffect } from 'react';
import { 
  HardDrive, 
  RotateCcw, 
  Search, 
  Plus, 
  RefreshCw, 
  CheckCircle2, 
  Trash2, 
  Lock
} from 'lucide-react';
import { apiFetch } from '../config/api';
import { StatusBadge } from '../components/StatusBadge';
import { ConfirmModal } from '../components/ConfirmModal';
import { ModalPortal } from '../components/ModalPortal';

interface BackupItem {
  id: string;
  name: string;
  resource_type: string;
  resource_name: string;
  size_mb: number;
  status: string;
  created_at: string;
  retention_days: number;
  restore_point: string;
  region: string;
  encryption: string;
}

export const Backups: React.FC<{ token: string | null }> = ({ token }) => {
  const [backups, setBackups] = useState<BackupItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  // New Backup Form
  const [newResourceName, setNewResourceName] = useState('aravanta-core-db (PostgreSQL 16)');
  const [newResourceType, setNewResourceType] = useState('database');
  const [newRetentionDays, setNewRetentionDays] = useState(30);

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

  const fetchBackups = async () => {
    setLoading(true);
    try {
      const data = await apiFetch<BackupItem[]>('/api/v1/operations/backups', { token });
      if (Array.isArray(data)) {
        setBackups(data);
      }
    } catch (err) {
      console.error('Failed to fetch backups:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBackups();
  }, [token]);

  const handleCreateBackup = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionLoading(true);
    try {
      await apiFetch('/api/v1/operations/backups', {
        method: 'POST',
        body: JSON.stringify({
          resource_type: newResourceType,
          resource_name: newResourceName,
          retention_days: newRetentionDays
        }),
        token
      });
      showToast(`Snapshot initiated for ${newResourceName}`);
      setIsCreateOpen(false);
      fetchBackups();
    } catch (err: any) {
      showToast(`Backup creation failed: ${err.message}`);
    } finally {
      setActionLoading(false);
    }
  };

  const handleRestoreBackup = (bsp: BackupItem) => {
    setConfirmModal({
      isOpen: true,
      title: `Restore Snapshot: ${bsp.name}`,
      message: `Caution: Restoring this snapshot will roll back data on ${bsp.resource_name} to restore point ${bsp.restore_point}. Active sessions will be momentarily paused.`,
      variant: 'warning',
      action: async () => {
        setActionLoading(true);
        try {
          await apiFetch(`/api/v1/operations/backups/${bsp.id}/restore`, {
            method: 'POST',
            token
          });
          showToast(`Restoration initiated for ${bsp.resource_name}. Status: IN_PROGRESS.`);
          setConfirmModal(prev => ({ ...prev, isOpen: false }));
        } catch (err: any) {
          showToast(`Restore failed: ${err.message}`);
        } finally {
          setActionLoading(false);
        }
      }
    });
  };

  const handleDeleteBackup = (bsp: BackupItem) => {
    setConfirmModal({
      isOpen: true,
      title: `Delete Backup Snapshot: ${bsp.name}`,
      message: `Permanently delete snapshot (${(bsp.size_mb / 1024).toFixed(1)} GB) from S3 Disaster Recovery bucket? This cannot be recovered.`,
      variant: 'danger',
      action: async () => {
        setActionLoading(true);
        try {
          await apiFetch(`/api/v1/operations/backups/${bsp.id}`, {
            method: 'DELETE',
            token
          });
          showToast(`Snapshot ${bsp.name} deleted.`);
          setConfirmModal(prev => ({ ...prev, isOpen: false }));
          fetchBackups();
        } catch (err: any) {
          showToast(`Delete failed: ${err.message}`);
        } finally {
          setActionLoading(false);
        }
      }
    });
  };

  const filtered = backups.filter(b => {
    return b.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
           b.resource_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
           b.resource_type.toLowerCase().includes(searchTerm.toLowerCase());
  });

  const totalSizeGb = (backups.reduce((acc, curr) => acc + (curr.size_mb || 0), 0) / 1024).toFixed(1);

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
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 font-mono">
        <div className="bg-white dark:bg-[#0F2038] border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm">
          <span className="text-xs font-bold text-slate-500">Total Snapshots</span>
          <p className="text-2xl font-black text-slate-900 dark:text-white mt-1">{backups.length}</p>
          <p className="text-[11px] text-slate-400 mt-0.5">Encrypted backups</p>
        </div>

        <div className="bg-white dark:bg-[#0F2038] border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm">
          <span className="text-xs font-bold text-blue-500">DR Storage Volume</span>
          <p className="text-2xl font-black text-blue-500 mt-1">{totalSizeGb} GB</p>
          <p className="text-[11px] text-slate-400 mt-0.5">Multi-region S3</p>
        </div>

        <div className="bg-white dark:bg-[#0F2038] border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm">
          <span className="text-xs font-bold text-emerald-500">RPO Compliance</span>
          <p className="text-2xl font-black text-emerald-500 mt-1">15 Mins</p>
          <p className="text-[11px] text-slate-400 mt-0.5">Recovery Point Objective</p>
        </div>

        <div className="bg-white dark:bg-[#0F2038] border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm">
          <span className="text-xs font-bold text-purple-500">Encryption Standard</span>
          <p className="text-2xl font-black text-purple-500 mt-1">AES-256</p>
          <p className="text-[11px] text-slate-400 mt-0.5">KMS Customer Managed</p>
        </div>
      </div>

      {/* Control Bar & Table */}
      <div className="bg-white dark:bg-[#0F2038] border border-slate-200 dark:border-slate-800 rounded-2xl p-4 sm:p-5 shadow-sm space-y-4 font-mono">
        <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search snapshot name, resource..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="flex items-center gap-2.5 w-full sm:w-auto justify-start sm:justify-end">
            <button
              onClick={() => setIsCreateOpen(true)}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-md transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-4 h-4" /> Create Snapshot
            </button>

            <button
              onClick={fetchBackups}
              disabled={loading}
              className="p-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl transition-colors cursor-pointer"
              title="Refresh backups"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* Backups Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 font-bold text-slate-500 dark:text-slate-400 bg-slate-50/50 dark:bg-slate-900/50">
                <th className="py-3 px-4">Snapshot Name & Resource</th>
                <th className="py-3 px-4">Type</th>
                <th className="py-3 px-4">Size</th>
                <th className="py-3 px-4">Restore Point</th>
                <th className="py-3 px-4">Retention</th>
                <th className="py-3 px-4">Encryption</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
              {loading ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-blue-500" />
                    <span>Loading backup snapshots...</span>
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    <p className="font-bold text-slate-700 dark:text-slate-300">No backup snapshots found</p>
                  </td>
                </tr>
              ) : (
                filtered.map((bsp) => (
                  <tr key={bsp.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="py-3.5 px-4 font-bold text-slate-900 dark:text-white">
                      <div className="flex items-center gap-2">
                        <HardDrive className="w-4 h-4 text-blue-500 shrink-0" />
                        <div>
                          <span>{bsp.name}</span>
                          <p className="text-[10px] text-slate-400 font-normal">{bsp.resource_name}</p>
                        </div>
                      </div>
                    </td>

                    <td className="py-3.5 px-4">
                      <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-[10px] uppercase font-bold text-slate-600 dark:text-slate-300">
                        {bsp.resource_type}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-slate-700 dark:text-slate-300 font-bold">
                      {bsp.size_mb > 1024 ? `${(bsp.size_mb / 1024).toFixed(1)} GB` : `${bsp.size_mb} MB`}
                    </td>

                    <td className="py-3.5 px-4 text-slate-500">{bsp.restore_point.replace('T', ' ').replace('Z', '')}</td>
                    <td className="py-3.5 px-4 text-slate-600 dark:text-slate-400">{bsp.retention_days} Days</td>

                    <td className="py-3.5 px-4">
                      <span className="flex items-center gap-1 text-[11px] text-emerald-600 dark:text-emerald-400">
                        <Lock className="w-3 h-3" /> {bsp.encryption}
                      </span>
                    </td>

                    <td className="py-3.5 px-4">
                      <StatusBadge status={bsp.status} size="sm" />
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => handleRestoreBackup(bsp)}
                          className="px-2.5 py-1 bg-blue-50 dark:bg-blue-500/15 text-blue-600 dark:text-blue-400 hover:bg-blue-100 text-[10px] font-bold rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
                          title="Restore Snapshot"
                        >
                          <RotateCcw className="w-3 h-3" /> Restore
                        </button>
                        <button
                          onClick={() => handleDeleteBackup(bsp)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                          title="Delete Snapshot"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
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

      {/* Create Backup Modal */}
      {isCreateOpen && (
        <ModalPortal isOpen={isCreateOpen} onClose={() => setIsCreateOpen(false)} maxWidth="max-w-md">
          <form onSubmit={handleCreateBackup} className="space-y-4 font-mono text-xs">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold">
                <HardDrive className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">Create Infrastructure Snapshot</h3>
                <p className="text-slate-500">Disaster recovery snapshot with AES-256 encryption</p>
              </div>
            </div>

            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Target Resource</label>
              <select
                value={newResourceName}
                onChange={(e) => {
                  setNewResourceName(e.target.value);
                  if (e.target.value.includes('PostgreSQL')) setNewResourceType('database');
                  else if (e.target.value.includes('etcd')) setNewResourceType('cluster_state');
                  else if (e.target.value.includes('assets')) setNewResourceType('storage_bucket');
                  else setNewResourceType('cache');
                }}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white cursor-pointer"
              >
                <option value="aravanta-core-db (PostgreSQL 16)">aravanta-core-db (PostgreSQL 16)</option>
                <option value="aravanta-prod (etcd Snapshot)">aravanta-prod (etcd Cluster State)</option>
                <option value="aravanta-assets-prod">aravanta-assets-prod (S3 Bucket)</option>
                <option value="redis-cluster-cache">redis-cluster-cache (Redis In-Memory)</option>
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Retention Period (Days)</label>
              <input
                type="number"
                min="1"
                max="365"
                value={newRetentionDays}
                onChange={(e) => setNewRetentionDays(parseInt(e.target.value))}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setIsCreateOpen(false)}
                className="px-4 py-2 font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={actionLoading}
                className="px-4 py-2 font-bold bg-blue-600 text-white rounded-xl shadow-md hover:bg-blue-700"
              >
                {actionLoading ? 'Creating Snapshot...' : 'Initiate Snapshot'}
              </button>
            </div>
          </form>
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
