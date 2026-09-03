import React, { useState, useEffect } from 'react';
import { 
  Search, 
  RefreshCw, 
  CheckCircle2, 
  ShieldAlert, 
  ChevronRight, 
  Send 
} from 'lucide-react';
import { apiFetch } from '../config/api';
import { StatusBadge } from '../components/StatusBadge';
import { ModalPortal } from '../components/ModalPortal';

interface TimelineEntry {
  time: string;
  author: string;
  note: string;
  type: string;
}

interface IncidentItem {
  id: string;
  number: string;
  title: string;
  severity: string;
  status: string;
  affected_services: string[];
  detected_at: string;
  resolved_at?: string;
  commander: string;
  summary: string;
  root_cause: string;
  timeline: TimelineEntry[];
  related_alerts: string[];
}

export const Incidents: React.FC<{ token: string | null }> = ({ token }) => {
  const [incidents, setIncidents] = useState<IncidentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  // Selected incident for drawer/detail
  const [selectedIncident, setSelectedIncident] = useState<IncidentItem | null>(null);
  
  // New incident modal
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newIncidentTitle, setNewIncidentTitle] = useState('');
  const [newIncidentSeverity, setNewIncidentSeverity] = useState('P2 - Major');
  const [newIncidentSummary, setNewIncidentSummary] = useState('');
  const [newIncidentServices, setNewIncidentServices] = useState('api-gateway, auth-service');

  // New timeline update
  const [timelineNote, setTimelineNote] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const fetchIncidents = async () => {
    setLoading(true);
    try {
      const data = await apiFetch<IncidentItem[]>('/api/v1/operations/incidents', { token });
      if (Array.isArray(data)) {
        setIncidents(data);
        if (selectedIncident) {
          const updated = data.find(i => i.id === selectedIncident.id);
          if (updated) setSelectedIncident(updated);
        }
      }
    } catch (err) {
      console.error('Failed to fetch incidents:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchIncidents();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const handleCreateIncident = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionLoading(true);
    try {
      await apiFetch('/api/v1/operations/incidents', {
        method: 'POST',
        body: JSON.stringify({
          title: newIncidentTitle,
          severity: newIncidentSeverity,
          affected_services: newIncidentServices.split(',').map(s => s.trim()),
          summary: newIncidentSummary,
          commander: 'Yash Baviskar (Lead SRE)'
        }),
        token
      });
      showToast('New operational incident declared and bridge created.');
      setIsCreateOpen(false);
      setNewIncidentTitle('');
      setNewIncidentSummary('');
      fetchIncidents();
    } catch (err: any) {
      showToast(`Error creating incident: ${err.message}`);
    } finally {
      setActionLoading(false);
    }
  };

  const handleUpdateStatus = async (incidentId: string, newStatus: string) => {
    try {
      await apiFetch(`/api/v1/operations/incidents/${incidentId}`, {
        method: 'PATCH',
        body: JSON.stringify({ status: newStatus }),
        token
      });
      showToast(`Incident status updated to '${newStatus}'`);
      fetchIncidents();
    } catch (err: any) {
      showToast(`Update failed: ${err.message}`);
    }
  };

  const handleAddTimeline = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedIncident || !timelineNote) return;
    setActionLoading(true);
    try {
      await apiFetch(`/api/v1/operations/incidents/${selectedIncident.id}/timeline`, {
        method: 'POST',
        body: JSON.stringify({
          author: 'Yash Baviskar (Incident Commander)',
          note: timelineNote,
          type: 'UPDATE'
        }),
        token
      });
      setTimelineNote('');
      showToast('Timeline update logged.');
      fetchIncidents();
    } catch (err: any) {
      showToast(`Failed to add timeline event: ${err.message}`);
    } finally {
      setActionLoading(false);
    }
  };

  const filtered = (incidents || []).filter(inc => {
    if (!inc) return false;
    const title = (inc.title || '').toLowerCase();
    const number = (inc.number || inc.id || '').toLowerCase();
    const summary = (inc.summary || '').toLowerCase();
    const status = (inc.status || '').toLowerCase();
    const query = searchTerm.toLowerCase();

    const matchesSearch = title.includes(query) || number.includes(query) || summary.includes(query);
    const matchesStatus = statusFilter === 'all' || status === statusFilter.toLowerCase();
    return matchesSearch && matchesStatus;
  });

  const activeIncidents = (incidents || []).filter(i => (i?.status || '').toLowerCase() !== 'resolved').length;
  const p1Count = (incidents || []).filter(i => (i?.severity || '').includes('P1') && (i?.status || '').toLowerCase() !== 'resolved').length;

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
          <span className="text-xs font-bold text-slate-500">Active Incidents</span>
          <p className="text-2xl font-black text-slate-900 dark:text-white mt-1">{activeIncidents}</p>
          <p className="text-[11px] text-slate-400 mt-0.5">Open war-rooms</p>
        </div>

        <div className="bg-white dark:bg-[#0F2038] border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm">
          <span className="text-xs font-bold text-rose-500">P1 - Critical</span>
          <p className="text-2xl font-black text-rose-500 mt-1">{p1Count}</p>
          <p className="text-[11px] text-slate-400 mt-0.5">Customer-impacting</p>
        </div>

        <div className="bg-white dark:bg-[#0F2038] border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm">
          <span className="text-xs font-bold text-blue-500">Mean Time to Detect</span>
          <p className="text-2xl font-black text-blue-500 mt-1">2.4m</p>
          <p className="text-[11px] text-slate-400 mt-0.5">Alertmanager telemetry</p>
        </div>

        <div className="bg-white dark:bg-[#0F2038] border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm">
          <span className="text-xs font-bold text-emerald-500">Mean Time to Resolve</span>
          <p className="text-2xl font-black text-emerald-500 mt-1">18.5m</p>
          <p className="text-[11px] text-slate-400 mt-0.5">Last 30 days rolling</p>
        </div>
      </div>

      {/* Control Bar */}
      <div className="bg-white dark:bg-[#0F2038] border border-slate-200 dark:border-slate-800 rounded-2xl p-4 sm:p-5 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search incident number, title, summary..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-mono text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="flex items-center gap-2.5 flex-wrap w-full sm:w-auto justify-start sm:justify-end">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-mono font-bold text-slate-700 dark:text-slate-300 focus:outline-none cursor-pointer"
            >
              <option value="all">Status: All</option>
              <option value="Detected">Detected</option>
              <option value="Investigating">Investigating</option>
              <option value="Mitigating">Mitigating</option>
              <option value="Resolved">Resolved</option>
            </select>

            <button
              onClick={() => setIsCreateOpen(true)}
              className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-mono font-bold rounded-xl shadow-md transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <ShieldAlert className="w-4 h-4" /> Declare Incident
            </button>

            <button
              onClick={fetchIncidents}
              disabled={loading}
              className="p-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl transition-colors cursor-pointer"
              title="Refresh incidents"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* Incidents Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 font-bold text-slate-500 dark:text-slate-400 bg-slate-50/50 dark:bg-slate-900/50">
                <th className="py-3 px-4">Incident #</th>
                <th className="py-3 px-4">Title & Summary</th>
                <th className="py-3 px-4">Severity</th>
                <th className="py-3 px-4">Affected Services</th>
                <th className="py-3 px-4">Commander</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-blue-500" />
                    <span>Loading operational incident stream...</span>
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    <p className="font-bold text-slate-700 dark:text-slate-300">No active incidents matching criteria</p>
                  </td>
                </tr>
              ) : (
                filtered.map((inc) => (
                  <tr 
                    key={inc.id} 
                    className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors cursor-pointer group"
                    onClick={() => setSelectedIncident(inc)}
                  >
                    <td className="py-3.5 px-4 font-bold text-rose-600 dark:text-rose-400">
                      {inc.number}
                    </td>

                    <td className="py-3.5 px-4 max-w-[300px]">
                      <div className="font-bold text-slate-900 dark:text-white group-hover:text-blue-500 transition-colors">
                        {inc.title}
                      </div>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate mt-0.5" title={inc.summary}>
                        {inc.summary}
                      </p>
                    </td>

                    <td className="py-3.5 px-4">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        (inc.severity || '').includes('P1') ? 'bg-rose-50 dark:bg-rose-500/20 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-500/30' :
                        (inc.severity || '').includes('P2') ? 'bg-amber-50 dark:bg-amber-500/20 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-500/30' :
                        'bg-blue-50 dark:bg-blue-500/20 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-500/30'
                      }`}>
                        {inc.severity || 'Unknown'}
                      </span>
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-1 flex-wrap">
                        {(inc.affected_services || []).map((s, idx) => (
                          <span key={s || idx} className="px-1.5 py-0.5 bg-slate-100 dark:bg-slate-800 rounded text-[10px] text-slate-600 dark:text-slate-300">
                            {s}
                          </span>
                        ))}
                      </div>
                    </td>

                    <td className="py-3.5 px-4 text-slate-600 dark:text-slate-400">{inc.commander}</td>

                    <td className="py-3.5 px-4">
                      <StatusBadge status={inc.status} size="sm" />
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <button className="p-1.5 text-slate-400 hover:text-blue-500">
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Declare Incident Modal */}
      {isCreateOpen && (
        <ModalPortal isOpen={isCreateOpen} onClose={() => setIsCreateOpen(false)} maxWidth="max-w-lg">
          <form onSubmit={handleCreateIncident} className="space-y-4 font-mono text-xs">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-rose-100 dark:bg-rose-500/20 text-rose-600 dark:text-rose-400 flex items-center justify-center font-bold">
                <ShieldAlert className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">Declare Production Incident</h3>
                <p className="text-slate-500">Initiates incident commander bridge & notifies SRE on-call</p>
              </div>
            </div>

            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Incident Title</label>
              <input
                type="text"
                value={newIncidentTitle}
                onChange={(e) => setNewIncidentTitle(e.target.value)}
                placeholder="e.g. Ingress HTTP 504 Timeouts on Checkout API"
                required
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Severity Level</label>
                <select
                  value={newIncidentSeverity}
                  onChange={(e) => setNewIncidentSeverity(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white cursor-pointer"
                >
                  <option value="P1 - Critical">P1 - Critical (Outage)</option>
                  <option value="P2 - Major">P2 - Major (Degraded)</option>
                  <option value="P3 - Minor">P3 - Minor (Partial)</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Affected Services (comma sep)</label>
                <input
                  type="text"
                  value={newIncidentServices}
                  onChange={(e) => setNewIncidentServices(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white"
                />
              </div>
            </div>

            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Incident Summary & Initial Findings</label>
              <textarea
                rows={3}
                value={newIncidentSummary}
                onChange={(e) => setNewIncidentSummary(e.target.value)}
                placeholder="Describe observed impact, error rate spike, and affected users..."
                required
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
                className="px-4 py-2 font-bold bg-rose-600 text-white rounded-xl shadow-md hover:bg-rose-700"
              >
                {actionLoading ? 'Declaring...' : 'Declare & Open War-Room'}
              </button>
            </div>
          </form>
        </ModalPortal>
      )}

      {/* Incident Detail Console Modal */}
      {selectedIncident && (
        <ModalPortal isOpen={!!selectedIncident} onClose={() => setSelectedIncident(null)} maxWidth="max-w-3xl">
          <div className="space-y-4 font-mono text-xs">
            {/* Header */}
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-base font-black text-rose-600 dark:text-rose-400">{selectedIncident.number}</span>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">{selectedIncident.title}</h3>
                  <StatusBadge status={selectedIncident.status} size="sm" />
                </div>
                <p className="text-slate-500 mt-0.5">Commander: {selectedIncident.commander} • Detected: {selectedIncident.detected_at}</p>
              </div>

              {/* Status Transition dropdown */}
              <div className="flex items-center gap-2">
                <select
                  value={selectedIncident.status}
                  onChange={(e) => handleUpdateStatus(selectedIncident.id, e.target.value)}
                  className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-white cursor-pointer"
                >
                  <option value="Detected">Detected</option>
                  <option value="Investigating">Investigating</option>
                  <option value="Mitigating">Mitigating</option>
                  <option value="Resolved">Resolved</option>
                </select>
              </div>
            </div>

            {/* Summary & Root Cause */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 space-y-1">
                <span className="font-bold text-slate-400 uppercase text-[10px]">Observed Impact</span>
                <p className="text-slate-800 dark:text-slate-200 leading-relaxed">{selectedIncident.summary}</p>
              </div>
              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 space-y-1">
                <span className="font-bold text-slate-400 uppercase text-[10px]">Identified Root Cause</span>
                <p className="text-slate-800 dark:text-slate-200 leading-relaxed">{selectedIncident.root_cause || 'Under investigation'}</p>
              </div>
            </div>

            {/* Timeline Stream */}
            <div>
              <span className="font-bold text-slate-500 uppercase text-xs">Incident Timeline & War-Room Actions</span>
              <div className="space-y-2 mt-2 max-h-52 overflow-y-auto pr-1">
                {selectedIncident.timeline?.map((item, idx) => (
                  <div key={idx} className="p-3 rounded-xl bg-slate-900 text-slate-200 border border-slate-800 flex items-start justify-between gap-3">
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className="text-blue-400 font-bold">{item.author}</span>
                        <span className="px-1.5 py-0.5 rounded bg-slate-800 text-[10px] text-slate-400">{item.type}</span>
                      </div>
                      <p className="text-slate-300">{item.note}</p>
                    </div>
                    <span className="text-[10px] text-slate-500 shrink-0">{item.time}</span>
                  </div>
                ))}
              </div>

              {/* Add timeline update form */}
              <form onSubmit={handleAddTimeline} className="flex gap-2 mt-3">
                <input
                  type="text"
                  placeholder="Post operational action or status update to timeline..."
                  value={timelineNote}
                  onChange={(e) => setTimelineNote(e.target.value)}
                  className="flex-1 px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white"
                />
                <button
                  type="submit"
                  disabled={actionLoading || !timelineNote}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl flex items-center gap-1 cursor-pointer disabled:opacity-50"
                >
                  <Send className="w-3.5 h-3.5" /> Post
                </button>
              </form>
            </div>

            <div className="flex justify-end pt-3 border-t border-slate-200 dark:border-slate-800">
              <button
                onClick={() => setSelectedIncident(null)}
                className="px-4 py-2 font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700"
              >
                Close War-Room
              </button>
            </div>
          </div>
        </ModalPortal>
      )}
    </div>
  );
};
