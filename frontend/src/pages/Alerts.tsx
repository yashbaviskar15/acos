import React, { useState, useEffect } from 'react';
import { 
  Search, 
  RefreshCw, 
  CheckCircle2, 
  VolumeX, 
  ShieldAlert, 
  X
} from 'lucide-react';
import { apiFetch } from '../config/api';
import { StatusBadge } from '../components/StatusBadge';
import { ModalPortal } from '../components/ModalPortal';

interface AlertItem {
  id: string;
  title: string;
  severity: string;
  service: string;
  message: string;
  status: string;
  fired_at: string;
  query?: string;
  summary?: string;
  runbook_url?: string;
}

export const Alerts: React.FC<{ token: string | null; onNavigate?: (tab: string) => void }> = ({ token, onNavigate }) => {
  const [alerts, setAlerts] = useState<AlertItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [severityFilter, setSeverityFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedAlert, setSelectedAlert] = useState<AlertItem | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const fetchAlerts = async () => {
    setLoading(true);
    try {
      const data = await apiFetch<AlertItem[]>('/api/v1/monitoring/alerts', { token });
      if (Array.isArray(data)) {
        setAlerts(data);
      }
    } catch (err) {
      console.error('Failed to fetch alerts:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAlerts();
  }, [token]);

  const handleAcknowledge = async (alertId: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    try {
      await apiFetch(`/api/v1/monitoring/alerts/${alertId}/acknowledge`, { method: 'POST', token });
      setAlerts(prev => prev.map(a => a.id === alertId ? { ...a, status: 'acknowledged' } : a));
      if (selectedAlert && selectedAlert.id === alertId) {
        setSelectedAlert(prev => prev ? { ...prev, status: 'acknowledged' } : null);
      }
      showToast('Alert acknowledged. On-call SRE assigned.');
    } catch (err: any) {
      showToast(`Action failed: ${err.message}`);
    }
  };

  const handleMute = async (alertId: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    try {
      await apiFetch(`/api/v1/monitoring/alerts/${alertId}/mute`, { method: 'POST', token });
      setAlerts(prev => prev.map(a => a.id === alertId ? { ...a, status: 'muted' } : a));
      if (selectedAlert && selectedAlert.id === alertId) {
        setSelectedAlert(prev => prev ? { ...prev, status: 'muted' } : null);
      }
      showToast('Alert silenced for 2 hours.');
    } catch (err: any) {
      showToast(`Action failed: ${err.message}`);
    }
  };

  const handleResolve = async (alertId: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    try {
      await apiFetch(`/api/v1/monitoring/alerts/${alertId}/resolve`, { method: 'POST', token });
      setAlerts(prev => prev.map(a => a.id === alertId ? { ...a, status: 'resolved' } : a));
      if (selectedAlert && selectedAlert.id === alertId) {
        setSelectedAlert(prev => prev ? { ...prev, status: 'resolved' } : null);
      }
      showToast('Alert resolved and rule state normalized.');
    } catch (err: any) {
      showToast(`Action failed: ${err.message}`);
    }
  };

  const filtered = alerts.filter(a => {
    if (!a) return false;
    const title = (a.title || '').toLowerCase();
    const message = (a.message || '').toLowerCase();
    const service = (a.service || '').toLowerCase();
    const severity = (a.severity || '').toLowerCase();
    const status = (a.status || '').toLowerCase();
    const query = searchTerm.toLowerCase();

    const matchesSearch = title.includes(query) || message.includes(query) || service.includes(query);
    const matchesSeverity = severityFilter === 'all' || severity === severityFilter.toLowerCase();
    const matchesStatus = statusFilter === 'all' || status === statusFilter.toLowerCase();
    return matchesSearch && matchesSeverity && matchesStatus;
  });

  const firingCount = alerts.filter(a => (a?.status || '').toLowerCase() === 'firing').length;
  const criticalCount = alerts.filter(a => (a?.severity || '').toLowerCase() === 'critical' && (a?.status || '').toLowerCase() === 'firing').length;
  const ackCount = alerts.filter(a => (a?.status || '').toLowerCase() === 'acknowledged').length;

  return (
    <div className="space-y-6 font-mono text-xs">
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
          <span className="text-[10px] font-bold text-slate-500 uppercase">Total Firing Alerts</span>
          <p className="text-2xl font-black text-slate-900 dark:text-white mt-1">{firingCount}</p>
          <p className="text-[11px] text-slate-400 mt-0.5">Active Alertmanager rules</p>
        </div>

        <div className="bg-white dark:bg-[#0F2038] border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm">
          <span className="text-[10px] font-bold text-rose-500 uppercase">Critical (P1/P2)</span>
          <p className="text-2xl font-black text-rose-500 mt-1">{criticalCount}</p>
          <p className="text-[11px] text-slate-400 mt-0.5">Immediate triage required</p>
        </div>

        <div className="bg-white dark:bg-[#0F2038] border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm">
          <span className="text-[10px] font-bold text-amber-500 uppercase">Acknowledged</span>
          <p className="text-2xl font-black text-amber-500 mt-1">{ackCount}</p>
          <p className="text-[11px] text-slate-400 mt-0.5">Under SRE investigation</p>
        </div>

        <div className="bg-white dark:bg-[#0F2038] border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm">
          <span className="text-[10px] font-bold text-emerald-500 uppercase">Resolved (24h)</span>
          <p className="text-2xl font-black text-emerald-500 mt-1">18</p>
          <p className="text-[11px] text-slate-400 mt-0.5">MTTR: 14 minutes</p>
        </div>
      </div>

      {/* Filter and Table */}
      <div className="bg-white dark:bg-[#0F2038] border border-slate-200 dark:border-slate-800 rounded-2xl p-4 sm:p-5 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search alert title, message, service..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-mono text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="flex items-center gap-2.5 flex-wrap w-full sm:w-auto justify-start sm:justify-end">
            <select
              value={severityFilter}
              onChange={(e) => setSeverityFilter(e.target.value)}
              className="px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-mono font-bold text-slate-700 dark:text-slate-300 focus:outline-none cursor-pointer"
            >
              <option value="all">Severity: All</option>
              <option value="critical">Critical</option>
              <option value="warning">Warning</option>
              <option value="info">Info</option>
            </select>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-mono font-bold text-slate-700 dark:text-slate-300 focus:outline-none cursor-pointer"
            >
              <option value="all">Status: All</option>
              <option value="firing">Firing</option>
              <option value="acknowledged">Acknowledged</option>
              <option value="muted">Muted</option>
              <option value="resolved">Resolved</option>
            </select>

            <button
              onClick={fetchAlerts}
              disabled={loading}
              className="p-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl transition-colors cursor-pointer"
              title="Refresh alerts"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* Alerts Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 font-bold text-slate-500 dark:text-slate-400 bg-slate-50/50 dark:bg-slate-900/50">
                <th className="py-3 px-4">Alert Name & Description</th>
                <th className="py-3 px-4">Severity</th>
                <th className="py-3 px-4">Affected Target</th>
                <th className="py-3 px-4">Fired At</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Triage Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-mono">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-blue-500" />
                    <span>Evaluating alert rule triggers...</span>
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    <p className="font-bold text-slate-700 dark:text-slate-300">No active alerts matching criteria</p>
                  </td>
                </tr>
              ) : (
                filtered.map((alert) => {
                  const alertStatus = (alert.status || '').toLowerCase();
                  return (
                    <tr 
                      key={alert.id} 
                      onClick={() => setSelectedAlert(alert)}
                      className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors cursor-pointer"
                    >
                      <td className="py-3.5 px-4 max-w-[320px]">
                        <div className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                          <span>{alert.title}</span>
                        </div>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 font-normal mt-0.5 truncate" title={alert.message}>
                          {alert.message}
                        </p>
                      </td>

                      <td className="py-3.5 px-4">
                        <StatusBadge status={alert.severity || 'info'} size="sm" />
                      </td>

                      <td className="py-3.5 px-4">
                        <span className="px-2 py-0.5 rounded bg-blue-50 dark:bg-blue-500/15 text-blue-700 dark:text-blue-300 text-[11px] font-bold">
                          {alert.service || 'global'}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-slate-500 text-[11px]">
                        {alert.fired_at ? alert.fired_at.replace('T', ' ').replace('Z', '').split('.')[0] : 'Just now'}
                      </td>

                      <td className="py-3.5 px-4">
                        <StatusBadge status={alert.status || 'firing'} size="sm" />
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5" onClick={(e) => e.stopPropagation()}>
                          {alertStatus === 'firing' && (
                            <button
                              onClick={(e) => handleAcknowledge(alert.id, e)}
                              className="px-2.5 py-1 text-[11px] font-bold bg-amber-50 dark:bg-amber-500/15 text-amber-700 dark:text-amber-400 hover:bg-amber-100 dark:hover:bg-amber-500/25 rounded-lg transition-colors cursor-pointer"
                              title="Acknowledge Alert"
                            >
                              Ack
                            </button>
                          )}
                          {alertStatus !== 'muted' && alertStatus !== 'resolved' && (
                            <button
                              onClick={(e) => handleMute(alert.id, e)}
                              className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                              title="Silence Alert (2h)"
                            >
                              <VolumeX className="w-3.5 h-3.5" />
                            </button>
                          )}
                          {alertStatus !== 'resolved' && (
                            <button
                              onClick={(e) => handleResolve(alert.id, e)}
                              className="px-2.5 py-1 text-[11px] font-bold bg-emerald-50 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-500/25 rounded-lg transition-colors cursor-pointer"
                              title="Resolve Alert"
                            >
                              Resolve
                            </button>
                          )}
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

      {/* Alert Detail Modal */}
      {selectedAlert && (
        <ModalPortal isOpen={!!selectedAlert} onClose={() => setSelectedAlert(null)} maxWidth="max-w-2xl">
          <div className="space-y-5 font-mono text-xs">
            <div className="flex items-start justify-between gap-3 border-b border-slate-200 dark:border-slate-800 pb-3">
              <div className="space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-base font-black text-slate-900 dark:text-white font-sans">{selectedAlert.title}</span>
                  <StatusBadge status={selectedAlert.severity} size="sm" />
                  <StatusBadge status={selectedAlert.status} size="sm" />
                </div>
                <p className="text-slate-500 text-[11px]">Alert ID: {selectedAlert.id} • Service: {selectedAlert.service}</p>
              </div>

              <button 
                onClick={() => setSelectedAlert(null)} 
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Alert Details */}
            <div className="space-y-3">
              <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 space-y-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase">Alert Message & Impact</span>
                <p className="text-slate-800 dark:text-slate-200 font-sans text-xs leading-relaxed">{selectedAlert.message}</p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 space-y-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Fired Timestamp</span>
                  <p className="text-slate-800 dark:text-slate-200">{selectedAlert.fired_at ? selectedAlert.fired_at.replace('T', ' ').replace('Z', '') : 'Active'}</p>
                </div>

                <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 space-y-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Target Cluster / Host</span>
                  <p className="text-slate-800 dark:text-slate-200">prod-cluster-ap-south-1</p>
                </div>
              </div>

              <div className="p-3 bg-slate-900 text-slate-200 rounded-xl border border-slate-800 space-y-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase">Evaluated PromQL Trigger Expression</span>
                <code className="block text-[11px] text-emerald-400 overflow-x-auto py-1">
                  {selectedAlert.query || `sum(rate(container_cpu_usage_seconds_total{service="${selectedAlert.service}"}[5m])) > 0.85`}
                </code>
              </div>
            </div>

            {/* Action Bar */}
            <div className="flex items-center justify-between pt-3 border-t border-slate-200 dark:border-slate-800 flex-wrap gap-2">
              <button
                onClick={() => {
                  setSelectedAlert(null);
                  onNavigate?.('incidents');
                }}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl shadow-sm transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <ShieldAlert className="w-3.5 h-3.5" /> Escalate to War-Room Incident
              </button>

              <div className="flex items-center gap-2">
                {selectedAlert.status.toLowerCase() === 'firing' && (
                  <button
                    onClick={() => handleAcknowledge(selectedAlert.id)}
                    className="px-3.5 py-2 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-xl shadow-sm transition-colors cursor-pointer"
                  >
                    Acknowledge
                  </button>
                )}
                {selectedAlert.status.toLowerCase() !== 'muted' && (
                  <button
                    onClick={() => handleMute(selectedAlert.id)}
                    className="px-3.5 py-2 bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold rounded-xl transition-colors cursor-pointer"
                  >
                    Mute (2h)
                  </button>
                )}
                {selectedAlert.status.toLowerCase() !== 'resolved' && (
                  <button
                    onClick={() => handleResolve(selectedAlert.id)}
                    className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-sm transition-colors cursor-pointer"
                  >
                    Resolve Alert
                  </button>
                )}
              </div>
            </div>
          </div>
        </ModalPortal>
      )}
    </div>
  );
};
