import React, { useState, useEffect } from 'react';
import { 
  Search, 
  RefreshCw, 
  CheckCircle2, 
  VolumeX
} from 'lucide-react';
import { apiFetch } from '../config/api';
import { StatusBadge } from '../components/StatusBadge';

interface AlertItem {
  id: string;
  title: string;
  severity: string;
  service: string;
  message: string;
  status: string;
  fired_at: string;
}

export const Alerts: React.FC<{ token: string | null; onNavigate?: (tab: string) => void }> = ({ token }) => {
  const [alerts, setAlerts] = useState<AlertItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [severityFilter, setSeverityFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
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

  const handleAcknowledge = async (alertId: string) => {
    try {
      await apiFetch(`/api/v1/monitoring/alerts/${alertId}/acknowledge`, { method: 'POST', token });
      setAlerts(prev => prev.map(a => a.id === alertId ? { ...a, status: 'acknowledged' } : a));
      showToast('Alert acknowledged. On-call engineer assigned.');
    } catch (err: any) {
      showToast(`Action failed: ${err.message}`);
    }
  };

  const handleMute = async (alertId: string) => {
    try {
      await apiFetch(`/api/v1/monitoring/alerts/${alertId}/mute`, { method: 'POST', token });
      setAlerts(prev => prev.map(a => a.id === alertId ? { ...a, status: 'muted' } : a));
      showToast('Alert silenced for 2 hours.');
    } catch (err: any) {
      showToast(`Action failed: ${err.message}`);
    }
  };

  const handleResolve = async (alertId: string) => {
    try {
      await apiFetch(`/api/v1/monitoring/alerts/${alertId}/resolve`, { method: 'POST', token });
      setAlerts(prev => prev.map(a => a.id === alertId ? { ...a, status: 'resolved' } : a));
      showToast('Alert resolved and closed.');
    } catch (err: any) {
      showToast(`Action failed: ${err.message}`);
    }
  };

  const filtered = alerts.filter(a => {
    const matchesSearch = a.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          a.message.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          a.service.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesSeverity = severityFilter === 'all' || a.severity.toLowerCase() === severityFilter.toLowerCase();
    const matchesStatus = statusFilter === 'all' || a.status.toLowerCase() === statusFilter.toLowerCase();
    return matchesSearch && matchesSeverity && matchesStatus;
  });

  const firingCount = alerts.filter(a => a.status.toLowerCase() === 'firing').length;
  const criticalCount = alerts.filter(a => a.severity.toLowerCase() === 'critical' && a.status.toLowerCase() === 'firing').length;
  const ackCount = alerts.filter(a => a.status.toLowerCase() === 'acknowledged').length;

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
          <span className="text-xs font-bold text-slate-500">Total Firing Alerts</span>
          <p className="text-2xl font-black text-slate-900 dark:text-white mt-1">{firingCount}</p>
          <p className="text-[11px] text-slate-400 mt-0.5">Active Alertmanager rules</p>
        </div>

        <div className="bg-white dark:bg-[#0F2038] border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm">
          <span className="text-xs font-bold text-rose-500">Critical (P1/P2)</span>
          <p className="text-2xl font-black text-rose-500 mt-1">{criticalCount}</p>
          <p className="text-[11px] text-slate-400 mt-0.5">Immediate triage required</p>
        </div>

        <div className="bg-white dark:bg-[#0F2038] border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm">
          <span className="text-xs font-bold text-amber-500">Acknowledged</span>
          <p className="text-2xl font-black text-amber-500 mt-1">{ackCount}</p>
          <p className="text-[11px] text-slate-400 mt-0.5">Under investigation</p>
        </div>

        <div className="bg-white dark:bg-[#0F2038] border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm">
          <span className="text-xs font-bold text-emerald-500">Resolved (24h)</span>
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
              <tr className="border-b border-slate-200 dark:border-slate-800 font-mono font-bold text-slate-500 dark:text-slate-400 bg-slate-50/50 dark:bg-slate-900/50">
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
                filtered.map((alert) => (
                  <tr key={alert.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="py-3.5 px-4 max-w-[320px]">
                      <div className="font-bold text-slate-900 dark:text-white">
                        {alert.title}
                      </div>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 font-normal mt-0.5 truncate" title={alert.message}>
                        {alert.message}
                      </p>
                    </td>

                    <td className="py-3.5 px-4">
                      <StatusBadge status={alert.severity} size="sm" />
                    </td>

                    <td className="py-3.5 px-4">
                      <span className="px-2 py-0.5 rounded bg-blue-50 dark:bg-blue-500/15 text-blue-700 dark:text-blue-300 text-[11px] font-bold">
                        {alert.service}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-slate-500 text-[11px]">
                      {alert.fired_at ? alert.fired_at.replace('T', ' ').replace('Z', '').split('.')[0] : 'Just now'}
                    </td>

                    <td className="py-3.5 px-4">
                      <StatusBadge status={alert.status} size="sm" />
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {alert.status.toLowerCase() === 'firing' && (
                          <button
                            onClick={() => handleAcknowledge(alert.id)}
                            className="px-2.5 py-1 text-[11px] font-bold bg-amber-50 dark:bg-amber-500/15 text-amber-700 dark:text-amber-400 hover:bg-amber-100 rounded-lg transition-colors cursor-pointer"
                            title="Acknowledge Alert"
                          >
                            Ack
                          </button>
                        )}
                        {alert.status.toLowerCase() !== 'muted' && alert.status.toLowerCase() !== 'resolved' && (
                          <button
                            onClick={() => handleMute(alert.id)}
                            className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                            title="Silence Alert (2h)"
                          >
                            <VolumeX className="w-3.5 h-3.5" />
                          </button>
                        )}
                        {alert.status.toLowerCase() !== 'resolved' && (
                          <button
                            onClick={() => handleResolve(alert.id)}
                            className="px-2.5 py-1 text-[11px] font-bold bg-emerald-50 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-100 rounded-lg transition-colors cursor-pointer"
                            title="Resolve Alert"
                          >
                            Resolve
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
