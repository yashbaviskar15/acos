import React, { useState, useEffect } from 'react';
import { 
  GitBranch, 
  Search, 
  CheckCircle2, 
  RefreshCw, 
  Plus, 
  TrendingDown,
  ChevronRight
} from 'lucide-react';
import { apiFetch } from '../config/api';
import { StatusBadge } from '../components/StatusBadge';
import { ConfirmModal } from '../components/ConfirmModal';
import { ModalPortal } from '../components/ModalPortal';

interface DeploymentStep {
  name: string;
  status: string;
  duration: string;
}

interface DeploymentItem {
  id: string;
  application_id: string;
  application_name: string;
  environment: string;
  version: string;
  previous_version?: string;
  image: string;
  strategy: string;
  replicas: number;
  status: string;
  trigger: string;
  commit_hash: string;
  commit_message: string;
  author: string;
  started_at: string;
  finished_at: string;
  duration_seconds: number;
  error_reason?: string;
  steps: DeploymentStep[];
}

export const Deployments: React.FC<{ token: string | null }> = ({ token }) => {
  const [deployments, setDeployments] = useState<DeploymentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedEnv, setSelectedEnv] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');

  // New Deployment Modal
  const [isDeployModalOpen, setIsDeployModalOpen] = useState(false);
  const [deployForm, setDeployForm] = useState({
    appName: 'api-gateway',
    version: 'v2.4.2',
    environment: 'production',
    strategy: 'RollingUpdate',
    replicas: 4,
    change_summary: 'feat: add distributed rate limiter and timeout safeguards'
  });

  // Rollback / Confirm modal
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

  // Detail Modal
  const [selectedDeployment, setSelectedDeployment] = useState<DeploymentItem | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const fetchDeployments = async () => {
    setLoading(true);
    try {
      const data = await apiFetch<DeploymentItem[]>('/api/v1/operations/deployments', { token });
      if (Array.isArray(data)) {
        setDeployments(data);
      }
    } catch (err) {
      console.error('Failed to fetch deployments:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDeployments();
  }, [token]);

  const handleRollback = (dep: DeploymentItem) => {
    const targetVer = dep.previous_version || 'v1.0.0';
    setConfirmModal({
      isOpen: true,
      title: `Rollback Deployment: ${dep.id}`,
      message: `Revert ${dep.application_name} from failed/degraded release ${dep.version} back to stable baseline ${targetVer}? This triggers automated traffic draining and verifies 0 error rate.`,
      variant: 'danger',
      action: async () => {
        setActionLoading(true);
        try {
          await apiFetch(`/api/v1/operations/deployments/${dep.id}/rollback`, {
            method: 'POST',
            token
          });
          showToast(`Emergency rollback completed for ${dep.application_name} -> ${targetVer}`);
          setConfirmModal(prev => ({ ...prev, isOpen: false }));
          fetchDeployments();
        } catch (err: any) {
          showToast(`Rollback failed: ${err.message}`);
        } finally {
          setActionLoading(false);
        }
      }
    });
  };

  const handleCreateDeployment = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionLoading(true);
    try {
      await apiFetch('/api/v1/operations/deployments', {
        method: 'POST',
        body: JSON.stringify({
          version: deployForm.version,
          image: `aravanta/${deployForm.appName}:${deployForm.version}`,
          environment: deployForm.environment,
          strategy: deployForm.strategy,
          replicas: deployForm.replicas,
          change_summary: deployForm.change_summary
        }),
        token
      });
      showToast(`Deployment initiated for ${deployForm.appName} (${deployForm.version})`);
      setIsDeployModalOpen(false);
      fetchDeployments();
    } catch (err: any) {
      showToast(`Deployment trigger failed: ${err.message}`);
    } finally {
      setActionLoading(false);
    }
  };

  const filteredDeployments = (deployments || []).filter(d => {
    if (!d) return false;
    const appName = (d.application_name || '').toLowerCase();
    const version = (d.version || '').toLowerCase();
    const commitMsg = (d.commit_message || '').toLowerCase();
    const commitHash = (d.commit_hash || '').toLowerCase();
    const env = (d.environment || '').toLowerCase();
    const status = (d.status || '').toLowerCase();
    const query = searchTerm.toLowerCase();

    const matchesSearch = appName.includes(query) || version.includes(query) || commitMsg.includes(query) || commitHash.includes(query);
    const matchesEnv = selectedEnv === 'all' || env === selectedEnv.toLowerCase();
    const matchesStatus = selectedStatus === 'all' || status === selectedStatus.toLowerCase();
    return matchesSearch && matchesEnv && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {/* Toast Alert */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white dark:bg-white dark:text-slate-900 px-4 py-3 rounded-xl shadow-2xl flex items-center gap-3 border border-slate-700 animate-fadeIn font-mono text-xs font-bold">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 dark:text-emerald-600" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Deployment Workflow Guide / Banner */}
      <div className="bg-gradient-to-r from-blue-900/40 via-indigo-900/30 to-purple-900/30 border border-blue-500/30 rounded-2xl p-5 shadow-sm text-slate-200 space-y-3 font-mono">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2.5">
            <GitBranch className="w-5 h-5 text-blue-400" />
            <h3 className="font-bold text-white text-sm">GitOps & Automated Deployment Pipeline Engine</h3>
          </div>
          <span className="text-[10px] px-2.5 py-1 rounded bg-blue-500/20 text-blue-300 border border-blue-400/30 uppercase font-bold">
            Zero-Downtime Releases
          </span>
        </div>
        <p className="text-xs text-slate-300 leading-relaxed">
          Standard operational workflow: <strong>Git Push / Manual Trigger</strong> → <strong>Container Image Build</strong> → <strong>Trivy Vulnerability Scan</strong> → <strong>Canary Rollout (25%)</strong> → <strong>Synthetic Health Probes</strong> → <strong>Full Promotion</strong>. If health checks fail (e.g. OOM or HTTP 5xx errors), the engine executes an <strong>automated zero-downtime rollback</strong> to the previous stable release.
        </p>
      </div>

      {/* Action and Filter Controls */}
      <div className="bg-white dark:bg-[#0F2038] border border-slate-200 dark:border-slate-800 rounded-2xl p-4 sm:p-5 shadow-sm">
        <div className="flex flex-col md:flex-row gap-3 items-center justify-between">
          <div className="relative w-full md:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search commit hash, message, version..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-mono text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="flex items-center gap-2.5 flex-wrap w-full md:w-auto justify-start md:justify-end">
            <select
              value={selectedEnv}
              onChange={(e) => setSelectedEnv(e.target.value)}
              className="px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-mono font-bold text-slate-700 dark:text-slate-300 focus:outline-none cursor-pointer"
            >
              <option value="all">Env: All</option>
              <option value="production">Env: Production</option>
              <option value="staging">Env: Staging</option>
            </select>

            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-mono font-bold text-slate-700 dark:text-slate-300 focus:outline-none cursor-pointer"
            >
              <option value="all">Status: All</option>
              <option value="SUCCESSFUL">Successful</option>
              <option value="FAILED">Failed</option>
              <option value="ROLLED_BACK">Rolled Back</option>
            </select>

            <button
              onClick={() => setIsDeployModalOpen(true)}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-mono font-bold rounded-xl shadow-md transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-4 h-4" /> New Deployment
            </button>

            <button
              onClick={fetchDeployments}
              disabled={loading}
              className="p-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl transition-colors cursor-pointer"
              title="Refresh deployments"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* Deployments History List */}
        <div className="overflow-x-auto mt-4">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 font-mono font-bold text-slate-500 dark:text-slate-400 bg-slate-50/50 dark:bg-slate-900/50">
                <th className="py-3 px-4">Deployment ID</th>
                <th className="py-3 px-4">Service & Version</th>
                <th className="py-3 px-4">Environment</th>
                <th className="py-3 px-4">Commit & Summary</th>
                <th className="py-3 px-4">Strategy</th>
                <th className="py-3 px-4">Duration</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-mono">
              {loading ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-blue-500" />
                    <span>Loading deployment history...</span>
                  </td>
                </tr>
              ) : filteredDeployments.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    <p className="font-bold text-slate-700 dark:text-slate-300">No deployment records found</p>
                  </td>
                </tr>
              ) : (
                filteredDeployments.map((dep) => (
                  <tr 
                    key={dep.id} 
                    className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors group cursor-pointer"
                    onClick={() => setSelectedDeployment(dep)}
                  >
                    <td className="py-3.5 px-4 font-bold text-blue-600 dark:text-blue-400">
                      {dep.id}
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                        <span>{dep.application_name}</span>
                        <span className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-[10px] text-slate-600 dark:text-slate-300">
                          {dep.version}
                        </span>
                      </div>
                      <p className="text-[10px] text-slate-400 font-normal">Trigger: {dep.trigger}</p>
                    </td>

                    <td className="py-3.5 px-4">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                        dep.environment === 'production'
                          ? 'bg-purple-50 dark:bg-purple-500/15 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-500/30'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                      }`}>
                        {dep.environment}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 max-w-[280px]">
                      <div className="flex items-center gap-1.5">
                        <span className="px-1.5 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded text-[10px] font-bold">
                          {dep.commit_hash}
                        </span>
                        <span className="truncate text-slate-800 dark:text-slate-200 font-medium" title={dep.commit_message}>
                          {dep.commit_message}
                        </span>
                      </div>
                      <p className="text-[10px] text-slate-400">By {dep.author}</p>
                    </td>

                    <td className="py-3.5 px-4 text-slate-600 dark:text-slate-400">{dep.strategy}</td>
                    <td className="py-3.5 px-4 text-slate-500 dark:text-slate-400">{dep.duration_seconds}s</td>

                    <td className="py-3.5 px-4">
                      <StatusBadge status={dep.status} size="sm" />
                    </td>

                    <td className="py-3.5 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-1.5">
                        {dep.status === 'FAILED' && (
                          <button
                            onClick={() => handleRollback(dep)}
                            className="px-2 py-1 bg-rose-50 dark:bg-rose-500/15 text-rose-700 dark:text-rose-400 hover:bg-rose-100 text-[10px] font-bold rounded-lg transition-colors flex items-center gap-1"
                            title="Execute Rollback"
                          >
                            <TrendingDown className="w-3 h-3" /> Rollback
                          </button>
                        )}
                        <button
                          onClick={() => setSelectedDeployment(dep)}
                          className="p-1.5 text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"
                        >
                          <ChevronRight className="w-4 h-4" />
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

      {/* New Deployment Modal */}
      {isDeployModalOpen && (
        <ModalPortal isOpen={isDeployModalOpen} onClose={() => setIsDeployModalOpen(false)} maxWidth="max-w-lg">
          <form onSubmit={handleCreateDeployment} className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold">
                <Plus className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">Trigger New Production Deployment</h3>
                <p className="text-xs text-slate-500 font-mono">Automated CI/CD Delivery Pipeline</p>
              </div>
            </div>

            <div className="space-y-3 font-mono text-xs">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">Target Application Service</label>
                <select
                  value={deployForm.appName}
                  onChange={(e) => setDeployForm({ ...deployForm, appName: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl font-mono text-xs text-slate-900 dark:text-white cursor-pointer"
                >
                  <option value="api-gateway">api-gateway</option>
                  <option value="auth-service">auth-service</option>
                  <option value="web-console">web-console</option>
                  <option value="telemetry-engine">telemetry-engine</option>
                  <option value="payment-worker">payment-worker</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">Version Release Tag</label>
                  <input
                    type="text"
                    value={deployForm.version}
                    onChange={(e) => setDeployForm({ ...deployForm, version: e.target.value })}
                    required
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl font-mono text-xs text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">Target Environment</label>
                  <select
                    value={deployForm.environment}
                    onChange={(e) => setDeployForm({ ...deployForm, environment: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl font-mono text-xs text-slate-900 dark:text-white cursor-pointer"
                  >
                    <option value="production">Production</option>
                    <option value="staging">Staging</option>
                    <option value="development">Development</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">Deployment Strategy</label>
                <select
                  value={deployForm.strategy}
                  onChange={(e) => setDeployForm({ ...deployForm, strategy: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl font-mono text-xs text-slate-900 dark:text-white cursor-pointer"
                >
                  <option value="RollingUpdate">RollingUpdate (Zero Downtime)</option>
                  <option value="Canary">Canary (25% Traffic Verification)</option>
                  <option value="BlueGreen">BlueGreen (Instant Cutover)</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">Change Summary / Commit Note</label>
                <textarea
                  rows={2}
                  value={deployForm.change_summary}
                  onChange={(e) => setDeployForm({ ...deployForm, change_summary: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl font-mono text-xs text-slate-900 dark:text-white"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setIsDeployModalOpen(false)}
                className="px-4 py-2 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={actionLoading}
                className="px-4 py-2 text-xs font-bold bg-blue-600 text-white rounded-xl shadow-md hover:bg-blue-700"
              >
                {actionLoading ? 'Triggering...' : 'Deploy Version'}
              </button>
            </div>
          </form>
        </ModalPortal>
      )}

      {/* Deployment Steps Detail Modal */}
      {selectedDeployment && (
        <ModalPortal isOpen={!!selectedDeployment} onClose={() => setSelectedDeployment(null)} maxWidth="max-w-2xl">
          <div className="space-y-4 font-mono">
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-black text-slate-900 dark:text-white">{selectedDeployment.application_name} ({selectedDeployment.version})</h3>
                  <StatusBadge status={selectedDeployment.status} size="sm" />
                </div>
                <p className="text-xs text-slate-500 mt-0.5">Deployment ID: {selectedDeployment.id} • Strategy: {selectedDeployment.strategy}</p>
              </div>

              {selectedDeployment.status === 'FAILED' && (
                <button
                  onClick={() => {
                    const target = selectedDeployment;
                    setSelectedDeployment(null);
                    handleRollback(target);
                  }}
                  className="px-3 py-1.5 text-xs font-bold bg-rose-600 text-white rounded-xl shadow-md hover:bg-rose-700 flex items-center gap-1.5"
                >
                  <TrendingDown className="w-3.5 h-3.5" /> Execute Rollback
                </button>
              )}
            </div>

            {selectedDeployment.error_reason && (
              <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/20 text-rose-700 dark:text-rose-300 text-xs">
                <strong>Failure Diagnostics:</strong> {selectedDeployment.error_reason}
              </div>
            )}

            <div>
              <span className="text-xs font-bold text-slate-500 uppercase">Deployment Execution Timeline</span>
              <div className="space-y-2 mt-2">
                {selectedDeployment.steps?.map((step, idx) => (
                  <div key={idx} className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2.5">
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-[10px] ${
                        step.status === 'COMPLETED'
                          ? 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600'
                          : 'bg-rose-100 dark:bg-rose-500/20 text-rose-600'
                      }`}>
                        {idx + 1}
                      </div>
                      <span className="font-bold text-slate-900 dark:text-white">{step.name}</span>
                    </div>
                    <div className="flex items-center gap-3 text-slate-500">
                      <span>{step.duration}</span>
                      <StatusBadge status={step.status} size="sm" />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-end pt-3 border-t border-slate-200 dark:border-slate-800">
              <button
                onClick={() => setSelectedDeployment(null)}
                className="px-4 py-2 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700"
              >
                Close Timeline
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
