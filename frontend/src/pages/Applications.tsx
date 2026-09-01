import React, { useState, useEffect } from 'react';
import { 
  Layers, 
  Search, 
  RotateCcw, 
  Sliders, 
  GitBranch, 
  RefreshCw, 
  ArrowUpRight, 
  CheckCircle2, 
  ChevronRight,
  TrendingDown
} from 'lucide-react';
import { apiFetch } from '../config/api';
import { StatusBadge } from '../components/StatusBadge';
import { ConfirmModal } from '../components/ConfirmModal';
import { ModalPortal } from '../components/ModalPortal';

interface ApplicationItem {
  id: string;
  name: string;
  environment: string;
  version: string;
  previous_version?: string;
  replicas: number;
  target_replicas: number;
  status: string;
  health_percent: number;
  error_rate_percent: number;
  cpu_usage_m: number;
  memory_usage_mb: number;
  p95_latency_ms: number;
  requests_per_sec: number;
  strategy: string;
  image: string;
  repository: string;
  endpoints: string[];
  ports: number[];
  created_at: string;
  last_deployed_at: string;
  env_vars: Record<string, string>;
}

export const Applications: React.FC<{ token: string | null }> = ({ token }) => {
  const [apps, setApps] = useState<ApplicationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedEnv, setSelectedEnv] = useState('all');

  // Detail Modal
  const [selectedApp, setSelectedApp] = useState<ApplicationItem | null>(null);
  const [activeDetailTab, setActiveDetailTab] = useState<'overview' | 'metrics' | 'logs' | 'events' | 'deployments' | 'config'>('overview');
  
  // Scale Modal
  const [scaleModalApp, setScaleModalApp] = useState<ApplicationItem | null>(null);
  const [newReplicaCount, setNewReplicaCount] = useState<number>(3);
  
  // Deploy Modal
  const [deployModalApp, setDeployModalApp] = useState<ApplicationItem | null>(null);
  const [deployVersion, setDeployVersion] = useState<string>('');
  const [deployStrategy, setDeployStrategy] = useState<string>('RollingUpdate');

  // Confirmation Modal
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

  const fetchApps = async () => {
    setLoading(true);
    try {
      const data = await apiFetch<ApplicationItem[]>('/api/v1/operations/applications', { token });
      if (Array.isArray(data)) {
        setApps(data);
      }
    } catch (err) {
      console.error('Failed to fetch applications:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApps();
  }, [token]);

  const handleRestartApp = (app: ApplicationItem) => {
    setConfirmModal({
      isOpen: true,
      title: `Restart Service: ${app.name}`,
      message: `Triggering zero-downtime rolling restart on ${app.replicas} active replicas of ${app.name} (${app.version}).`,
      variant: 'warning',
      action: async () => {
        setActionLoading(true);
        try {
          await apiFetch(`/api/v1/operations/applications/${app.id}/restart`, {
            method: 'POST',
            token
          });
          showToast(`Rolling restart completed for ${app.name}`);
          setConfirmModal(prev => ({ ...prev, isOpen: false }));
          fetchApps();
        } catch (err: any) {
          showToast(`Restart failed: ${err.message}`);
        } finally {
          setActionLoading(false);
        }
      }
    });
  };

  const handleRollbackApp = (app: ApplicationItem) => {
    const targetVer = app.previous_version || 'v1.0.0';
    setConfirmModal({
      isOpen: true,
      title: `Rollback Service: ${app.name}`,
      message: `Execute immediate emergency rollback from ${app.version} to previous stable release ${targetVer}?`,
      variant: 'danger',
      action: async () => {
        setActionLoading(true);
        try {
          await apiFetch(`/api/v1/operations/applications/${app.id}/rollback`, {
            method: 'POST',
            body: JSON.stringify({ target_version: targetVer, reason: 'Operator initiated emergency rollback' }),
            token
          });
          showToast(`Application ${app.name} successfully rolled back to ${targetVer}`);
          setConfirmModal(prev => ({ ...prev, isOpen: false }));
          fetchApps();
        } catch (err: any) {
          showToast(`Rollback failed: ${err.message}`);
        } finally {
          setActionLoading(false);
        }
      }
    });
  };

  const handleExecuteScale = async () => {
    if (!scaleModalApp) return;
    setActionLoading(true);
    try {
      await apiFetch(`/api/v1/operations/applications/${scaleModalApp.id}/scale`, {
        method: 'POST',
        body: JSON.stringify({ replicas: newReplicaCount }),
        token
      });
      showToast(`${scaleModalApp.name} scaled to ${newReplicaCount} replicas`);
      setScaleModalApp(null);
      fetchApps();
    } catch (err: any) {
      showToast(`Scale failed: ${err.message}`);
    } finally {
      setActionLoading(false);
    }
  };

  const handleExecuteDeploy = async () => {
    if (!deployModalApp || !deployVersion) return;
    setActionLoading(true);
    try {
      await apiFetch('/api/v1/operations/deployments', {
        method: 'POST',
        body: JSON.stringify({
          version: deployVersion,
          image: `aravanta/${deployModalApp.name}:${deployVersion}`,
          environment: deployModalApp.environment,
          strategy: deployStrategy,
          replicas: deployModalApp.replicas,
          change_summary: `Manual release of ${deployVersion}`
        }),
        token
      });
      showToast(`Deployment initiated for ${deployModalApp.name} (${deployVersion})`);
      setDeployModalApp(null);
      fetchApps();
    } catch (err: any) {
      showToast(`Deploy failed: ${err.message}`);
    } finally {
      setActionLoading(false);
    }
  };

  const filteredApps = (apps || []).filter(a => {
    if (!a) return false;
    const name = (a.name || '').toLowerCase();
    const version = (a.version || '').toLowerCase();
    const repo = (a.repository || '').toLowerCase();
    const env = (a.environment || '').toLowerCase();
    const query = searchTerm.toLowerCase();

    const matchesSearch = name.includes(query) || version.includes(query) || repo.includes(query);
    const matchesEnv = selectedEnv === 'all' || env === selectedEnv.toLowerCase();
    return matchesSearch && matchesEnv;
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

      {/* Header Controls */}
      <div className="bg-white dark:bg-[#0F2038] border border-slate-200 dark:border-slate-800 rounded-2xl p-4 sm:p-5 shadow-sm">
        <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search service name, version, repo..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-mono text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="flex items-center gap-2.5 w-full sm:w-auto justify-start sm:justify-end">
            <select
              value={selectedEnv}
              onChange={(e) => setSelectedEnv(e.target.value)}
              className="px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-mono font-bold text-slate-700 dark:text-slate-300 focus:outline-none cursor-pointer"
            >
              <option value="all">Env: All Environments</option>
              <option value="production">Env: Production</option>
              <option value="staging">Env: Staging</option>
            </select>

            <button
              onClick={fetchApps}
              disabled={loading}
              className="p-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl transition-colors cursor-pointer"
              title="Refresh applications"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>
      </div>

      {/* Applications Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {loading ? (
          <div className="col-span-full py-16 text-center text-slate-400">
            <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-blue-500" />
            <p className="font-mono text-xs">Querying microservices state and telemetry...</p>
          </div>
        ) : filteredApps.length === 0 ? (
          <div className="col-span-full py-16 text-center text-slate-400 bg-white dark:bg-[#0F2038] rounded-2xl border border-slate-200 dark:border-slate-800 p-8">
            <Layers className="w-8 h-8 mx-auto mb-3 text-slate-400" />
            <p className="font-bold text-slate-700 dark:text-slate-200 font-mono">No matching services registered</p>
          </div>
        ) : (
          filteredApps.map((app) => (
            <div
              key={app.id}
              className="bg-white dark:bg-[#0F2038] border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm hover:shadow-md hover:border-blue-500/50 transition-all flex flex-col justify-between"
            >
              <div>
                {/* Header info */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-500/15 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold font-mono shrink-0">
                      <Layers className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900 dark:text-white text-sm font-mono">{app.name}</h3>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">{app.version}</p>
                    </div>
                  </div>

                  <StatusBadge status={app.status} size="sm" />
                </div>

                {/* Key operational metrics */}
                <div className="grid grid-cols-2 gap-2 mt-4 pt-4 border-t border-slate-100 dark:border-slate-800/80 font-mono text-[11px]">
                  <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800">
                    <span className="text-[10px] text-slate-400 uppercase font-bold">Replicas</span>
                    <p className="font-bold text-slate-900 dark:text-white mt-0.5">{app.replicas} Pods Active</p>
                  </div>
                  <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800">
                    <span className="text-[10px] text-slate-400 uppercase font-bold">P95 Latency</span>
                    <p className="font-bold text-slate-900 dark:text-white mt-0.5">{app.p95_latency_ms}ms</p>
                  </div>
                  <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800">
                    <span className="text-[10px] text-slate-400 uppercase font-bold">Error Rate</span>
                    <p className={`font-bold mt-0.5 ${app.error_rate_percent > 1.0 ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
                      {app.error_rate_percent}%
                    </p>
                  </div>
                  <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800">
                    <span className="text-[10px] text-slate-400 uppercase font-bold">Throughput</span>
                    <p className="font-bold text-slate-900 dark:text-white mt-0.5">{app.requests_per_sec} req/s</p>
                  </div>
                </div>

                {/* Strategy and Environment */}
                <div className="flex items-center justify-between mt-3 text-[10px] font-mono text-slate-400">
                  <span>Strategy: <strong className="text-slate-700 dark:text-slate-300">{app.strategy}</strong></span>
                  <span className="uppercase font-bold text-purple-600 dark:text-purple-400">{app.environment}</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-between gap-1.5 mt-5 pt-4 border-t border-slate-100 dark:border-slate-800/80">
                <button
                  onClick={() => {
                    setScaleModalApp(app);
                    setNewReplicaCount(app.replicas);
                  }}
                  className="px-2.5 py-1.5 text-[11px] font-mono font-bold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
                >
                  <Sliders className="w-3 h-3" /> Scale
                </button>

                <button
                  onClick={() => {
                    setDeployModalApp(app);
                    setDeployVersion(`v${(parseFloat(app.version.replace('v', '')) + 0.1).toFixed(1)}`);
                  }}
                  className="px-2.5 py-1.5 text-[11px] font-mono font-bold bg-blue-50 dark:bg-blue-500/15 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-500/25 rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
                >
                  <ArrowUpRight className="w-3 h-3" /> Deploy
                </button>

                <button
                  onClick={() => handleRestartApp(app)}
                  className="p-1.5 text-slate-400 hover:text-amber-600 dark:hover:text-amber-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                  title="Rolling Restart"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                </button>

                <button
                  onClick={() => handleRollbackApp(app)}
                  className="p-1.5 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                  title="Emergency Rollback"
                >
                  <TrendingDown className="w-3.5 h-3.5" />
                </button>

                <button
                  onClick={() => {
                    setSelectedApp(app);
                    setActiveDetailTab('overview');
                  }}
                  className="p-1.5 text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                  title="View Detail Console"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Scale Replicas Modal */}
      {scaleModalApp && (
        <ModalPortal isOpen={!!scaleModalApp} onClose={() => setScaleModalApp(null)} maxWidth="max-w-md">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold">
                <Sliders className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">Scale Service Replicas</h3>
                <p className="text-xs text-slate-500 font-mono">{scaleModalApp.name} ({scaleModalApp.environment})</p>
              </div>
            </div>

            <div className="bg-slate-50 dark:bg-slate-900/60 p-4 rounded-xl border border-slate-200 dark:border-slate-800 space-y-3 font-mono">
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-500">Current Replicas:</span>
                <strong className="text-slate-900 dark:text-white">{scaleModalApp.replicas} Pods</strong>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-500">Target Replicas:</span>
                <strong className="text-blue-600 text-sm">{newReplicaCount} Pods</strong>
              </div>

              <input
                type="range"
                min="0"
                max="10"
                value={newReplicaCount}
                onChange={(e) => setNewReplicaCount(parseInt(e.target.value))}
                className="w-full accent-blue-600 cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-slate-400">
                <span>0 (Stopped)</span>
                <span>5 Pods</span>
                <span>10 (Max)</span>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setScaleModalApp(null)}
                className="px-4 py-2 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700"
              >
                Cancel
              </button>
              <button
                onClick={handleExecuteScale}
                disabled={actionLoading}
                className="px-4 py-2 text-xs font-bold bg-blue-600 text-white rounded-xl shadow-md hover:bg-blue-700"
              >
                {actionLoading ? 'Scaling...' : 'Apply Replica Scale'}
              </button>
            </div>
          </div>
        </ModalPortal>
      )}

      {/* Deploy Version Modal */}
      {deployModalApp && (
        <ModalPortal isOpen={!!deployModalApp} onClose={() => setDeployModalApp(null)} maxWidth="max-w-lg">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold">
                <GitBranch className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">Deploy Service Version</h3>
                <p className="text-xs text-slate-500 font-mono">{deployModalApp.name} • Target: {deployModalApp.environment}</p>
              </div>
            </div>

            <div className="space-y-3 font-mono text-xs">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">Target Version Tag</label>
                <input
                  type="text"
                  value={deployVersion}
                  onChange={(e) => setDeployVersion(e.target.value)}
                  placeholder="v2.5.0"
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl font-mono text-xs text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">Deployment Strategy</label>
                <select
                  value={deployStrategy}
                  onChange={(e) => setDeployStrategy(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl font-mono text-xs text-slate-900 dark:text-white cursor-pointer"
                >
                  <option value="RollingUpdate">RollingUpdate (Zero Downtime)</option>
                  <option value="Canary">Canary (25% Traffic Verification)</option>
                  <option value="BlueGreen">BlueGreen (Instant Cutover)</option>
                </select>
              </div>

              <div className="p-3 bg-blue-50 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/20 rounded-xl text-[11px] text-blue-700 dark:text-blue-300">
                Deployment will pull <code>aravanta/{deployModalApp.name}:{deployVersion}</code>, run pre-flight vulnerability checks, and rollout across {deployModalApp.replicas} pods.
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setDeployModalApp(null)}
                className="px-4 py-2 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700"
              >
                Cancel
              </button>
              <button
                onClick={handleExecuteDeploy}
                disabled={actionLoading || !deployVersion}
                className="px-4 py-2 text-xs font-bold bg-blue-600 text-white rounded-xl shadow-md hover:bg-blue-700 disabled:opacity-50"
              >
                {actionLoading ? 'Deploying...' : 'Trigger Rollout'}
              </button>
            </div>
          </div>
        </ModalPortal>
      )}

      {/* App Drilldown Modal */}
      {selectedApp && (
        <ModalPortal isOpen={!!selectedApp} onClose={() => setSelectedApp(null)} maxWidth="max-w-3xl">
          <div className="space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="text-xl font-black text-slate-900 dark:text-white font-mono">{selectedApp.name}</h3>
                  <span className="px-2 py-0.5 rounded bg-blue-50 dark:bg-blue-500/20 text-blue-700 dark:text-blue-400 font-mono text-[10px] font-bold">
                    {selectedApp.version}
                  </span>
                  <StatusBadge status={selectedApp.status} size="sm" />
                </div>
                <p className="text-xs text-slate-500 font-mono mt-1">{selectedApp.repository}</p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleRestartApp(selectedApp)}
                  className="px-3 py-1.5 text-xs font-mono font-bold bg-amber-50 dark:bg-amber-500/15 text-amber-700 dark:text-amber-400 rounded-xl hover:bg-amber-100 transition-colors"
                >
                  Restart
                </button>
                <button
                  onClick={() => handleRollbackApp(selectedApp)}
                  className="px-3 py-1.5 text-xs font-mono font-bold bg-rose-50 dark:bg-rose-500/15 text-rose-700 dark:text-rose-400 rounded-xl hover:bg-rose-100 transition-colors"
                >
                  Rollback
                </button>
              </div>
            </div>

            {/* Navigation Tabs */}
            <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2 overflow-x-auto text-xs font-mono font-bold">
              {[
                { id: 'overview', label: 'Overview' },
                { id: 'metrics', label: 'Telemetry' },
                { id: 'logs', label: 'Live Logs' },
                { id: 'events', label: 'Cluster Events' },
                { id: 'config', label: 'Configuration' },
              ].map((t) => (
                <button
                  key={t.id}
                  onClick={() => setActiveDetailTab(t.id as any)}
                  className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                    activeDetailTab === t.id
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>

            {/* Tab Contents */}
            <div className="min-h-[220px]">
              {activeDetailTab === 'overview' && (
                <div className="space-y-4 font-mono text-xs">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800">
                      <span className="text-[10px] text-slate-400 uppercase font-bold">Public Endpoints</span>
                      {selectedApp.endpoints.map(ep => (
                        <p key={ep} className="text-blue-600 dark:text-blue-400 font-bold mt-1 truncate">{ep}</p>
                      ))}
                    </div>
                    <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800">
                      <span className="text-[10px] text-slate-400 uppercase font-bold">Container Image</span>
                      <p className="font-bold text-slate-900 dark:text-white mt-1 truncate">{selectedApp.image}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-3 text-center">
                    <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800">
                      <span className="text-[10px] text-slate-400 uppercase font-bold">Health SLA</span>
                      <p className="text-base font-black text-emerald-600 mt-1">{selectedApp.health_percent}%</p>
                    </div>
                    <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800">
                      <span className="text-[10px] text-slate-400 uppercase font-bold">CPU Usage</span>
                      <p className="text-base font-black text-slate-900 dark:text-white mt-1">{selectedApp.cpu_usage_m}m</p>
                    </div>
                    <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800">
                      <span className="text-[10px] text-slate-400 uppercase font-bold">Memory RAM</span>
                      <p className="text-base font-black text-slate-900 dark:text-white mt-1">{selectedApp.memory_usage_mb} MB</p>
                    </div>
                  </div>
                </div>
              )}

              {activeDetailTab === 'metrics' && (
                <div className="space-y-3 font-mono text-xs">
                  <div className="p-4 rounded-xl bg-slate-900 text-slate-200 space-y-2">
                    <p className="text-emerald-400 font-bold">● Telemetry Stream Connected (1s polling)</p>
                    <p className="text-slate-400">P95 HTTP Latency: <strong className="text-white">{selectedApp.p95_latency_ms}ms</strong></p>
                    <p className="text-slate-400">Total Requests/sec: <strong className="text-white">{selectedApp.requests_per_sec}</strong></p>
                    <p className="text-slate-400">Active Error Rate: <strong className="text-emerald-400">{selectedApp.error_rate_percent}%</strong></p>
                    <p className="text-slate-400">Replica Distribution: <strong className="text-white">{selectedApp.replicas} pods across 3 availability zones</strong></p>
                  </div>
                </div>
              )}

              {activeDetailTab === 'logs' && (
                <div className="p-3.5 rounded-xl bg-slate-950 text-emerald-400 font-mono text-[11px] h-52 overflow-y-auto space-y-1">
                  <p className="text-slate-500">[2026-09-01T18:30:00Z] Listening on 0.0.0.0:8000 (HTTP/1.1)</p>
                  <p className="text-slate-400">[2026-09-01T18:30:05Z] INFO: Initialized connection pool with 200 slots</p>
                  <p className="text-emerald-300">[2026-09-01T18:30:12Z] INFO: Readiness probe GET /health returned 200 OK</p>
                  <p className="text-slate-400">[2026-09-01T18:31:00Z] INFO: Processing ingress traffic from cloudos edge router</p>
                  <p className="text-slate-400">[2026-09-01T18:32:15Z] INFO: JWT token verified for subject developer@aravanta.cloud</p>
                </div>
              )}

              {activeDetailTab === 'events' && (
                <div className="space-y-2 font-mono text-xs">
                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 flex items-center justify-between">
                    <div>
                      <span className="font-bold text-emerald-600">Scaled</span>
                      <p className="text-slate-500 text-[11px] mt-0.5">HorizontalPodAutoscaler scaled replica count to {selectedApp.replicas}</p>
                    </div>
                    <span className="text-[10px] text-slate-400">10m ago</span>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 flex items-center justify-between">
                    <div>
                      <span className="font-bold text-blue-600">HealthCheckPassing</span>
                      <p className="text-slate-500 text-[11px] mt-0.5">Synthetic HTTP health probes reporting 100% success</p>
                    </div>
                    <span className="text-[10px] text-slate-400">1m ago</span>
                  </div>
                </div>
              )}

              {activeDetailTab === 'config' && (
                <div className="space-y-2 font-mono text-xs">
                  <span className="text-[11px] font-bold text-slate-500 uppercase">Environment Variables</span>
                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 space-y-1.5">
                    {Object.entries(selectedApp.env_vars || {}).map(([k, v]) => (
                      <div key={k} className="flex justify-between items-center text-[11px] py-0.5">
                        <span className="text-slate-400">{k}:</span>
                        <strong className="text-slate-900 dark:text-white font-bold">{v}</strong>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="flex justify-end pt-3 border-t border-slate-200 dark:border-slate-800">
              <button
                onClick={() => setSelectedApp(null)}
                className="px-4 py-2 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700"
              >
                Close Console
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
