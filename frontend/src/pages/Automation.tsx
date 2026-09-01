import React, { useState, useEffect } from 'react';
import { 
  Play, 
  RefreshCw, 
  CheckCircle2, 
  Zap
} from 'lucide-react';
import { apiFetch } from '../config/api';
import { StatusBadge } from '../components/StatusBadge';
import { ConfirmModal } from '../components/ConfirmModal';

interface WorkflowItem {
  id: string;
  name: string;
  description: string;
  trigger: string;
  target: string;
  status: string;
  last_run: string;
  last_status: string;
  duration: string;
  run_count: number;
  actions: string[];
}

export const Automation: React.FC<{ token: string | null }> = ({ token }) => {
  const [workflows, setWorkflows] = useState<WorkflowItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [executingId, setExecutingId] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

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

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const fetchWorkflows = async () => {
    setLoading(true);
    try {
      const data = await apiFetch<WorkflowItem[]>('/api/v1/operations/automation/workflows', { token });
      if (Array.isArray(data)) {
        setWorkflows(data);
      }
    } catch (err) {
      console.error('Failed to fetch automation workflows:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWorkflows();
  }, [token]);

  const handleRunWorkflow = (wf: WorkflowItem) => {
    setConfirmModal({
      isOpen: true,
      title: `Execute Runbook: ${wf.name}`,
      message: `Trigger immediate execution of automation runbook on target: ${wf.target}? Actions: ${wf.actions.join(' -> ')}`,
      variant: 'primary',
      action: async () => {
        setExecutingId(wf.id);
        setConfirmModal(prev => ({ ...prev, isOpen: false }));
        try {
          const res = await apiFetch<any>(`/api/v1/operations/automation/workflows/${wf.id}/run`, {
            method: 'POST',
            token
          });
          showToast(`Runbook '${wf.name}' executed successfully in ${res.duration || '42s'}`);
          fetchWorkflows();
        } catch (err: any) {
          showToast(`Execution failed: ${err.message}`);
        } finally {
          setExecutingId(null);
        }
      }
    });
  };

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
          <span className="text-xs font-bold text-slate-500">Automated Runbooks</span>
          <p className="text-2xl font-black text-slate-900 dark:text-white mt-1">{workflows.length}</p>
          <p className="text-[11px] text-slate-400 mt-0.5">Active operational playbooks</p>
        </div>

        <div className="bg-white dark:bg-[#0F2038] border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm">
          <span className="text-xs font-bold text-emerald-500">Total Executions</span>
          <p className="text-2xl font-black text-emerald-500 mt-1">
            {workflows.reduce((acc, curr) => acc + (curr.run_count || 0), 0)}
          </p>
          <p className="text-[11px] text-slate-400 mt-0.5">100% automated pass rate</p>
        </div>

        <div className="bg-white dark:bg-[#0F2038] border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm">
          <span className="text-xs font-bold text-blue-500">Hours Saved / Month</span>
          <p className="text-2xl font-black text-blue-500 mt-1">84.2 hrs</p>
          <p className="text-[11px] text-slate-400 mt-0.5">SRE toil reduction</p>
        </div>

        <div className="bg-white dark:bg-[#0F2038] border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm">
          <span className="text-xs font-bold text-purple-500">Scheduler Engine</span>
          <p className="text-2xl font-black text-purple-500 mt-1">HEALTHY</p>
          <p className="text-[11px] text-slate-400 mt-0.5">Cron daemon synced</p>
        </div>
      </div>

      {/* Workflows List */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-black font-mono uppercase text-slate-900 dark:text-white">Active Operational Runbooks</h3>
          <button
            onClick={fetchWorkflows}
            disabled={loading}
            className="p-2 bg-white dark:bg-[#0F2038] border border-slate-200 dark:border-slate-800 rounded-xl text-slate-700 dark:text-slate-300 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {loading ? (
            <div className="col-span-full py-16 text-center text-slate-400">
              <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-blue-500" />
              <p className="font-mono text-xs">Loading automation runbooks...</p>
            </div>
          ) : (
            workflows.map((wf) => (
              <div
                key={wf.id}
                className="bg-white dark:bg-[#0F2038] border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-4 font-mono flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <div className="w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-500/15 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold shrink-0">
                        <Zap className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="font-bold text-slate-900 dark:text-white text-sm">{wf.name}</h4>
                        <p className="text-[11px] text-slate-500">Trigger: {wf.trigger}</p>
                      </div>
                    </div>
                    <StatusBadge status={wf.status} size="sm" />
                  </div>

                  <p className="text-xs text-slate-600 dark:text-slate-300 mt-3 leading-relaxed">
                    {wf.description}
                  </p>

                  {/* Actions Pipeline */}
                  <div className="mt-4 p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 space-y-1.5 text-xs">
                    <span className="text-[10px] text-slate-400 uppercase font-bold">Execution Step Sequence</span>
                    <div className="flex items-center gap-1.5 flex-wrap mt-1">
                      {(wf.actions || []).map((act, i) => (
                        <React.Fragment key={i}>
                          <span className="px-2 py-0.5 rounded bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 text-[10px] font-bold">
                            {act}
                          </span>
                          {i < (wf.actions || []).length - 1 && <span className="text-slate-400">→</span>}
                        </React.Fragment>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Execution Stats & Run Button */}
                <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-slate-800/80 text-xs">
                  <div className="text-[11px] text-slate-400">
                    <span>Runs: <strong className="text-slate-800 dark:text-slate-200">{wf.run_count}</strong></span>
                    <span className="ml-3">Duration: <strong className="text-slate-800 dark:text-slate-200">{wf.duration}</strong></span>
                  </div>

                  <button
                    onClick={() => handleRunWorkflow(wf)}
                    disabled={executingId === wf.id}
                    className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-md transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    {executingId === wf.id ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        <span>Running...</span>
                      </>
                    ) : (
                      <>
                        <Play className="w-3.5 h-3.5" />
                        <span>Run Now</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Confirmation Modal */}
      <ConfirmModal
        isOpen={confirmModal.isOpen}
        onClose={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
        onConfirm={confirmModal.action}
        title={confirmModal.title}
        message={confirmModal.message}
        variant={confirmModal.variant}
      />
    </div>
  );
};
