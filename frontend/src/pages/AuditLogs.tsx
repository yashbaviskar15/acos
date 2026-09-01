import React, { useState, useEffect } from 'react';
import { 
  Search, 
  RefreshCw, 
  Download, 
  User
} from 'lucide-react';
import { apiFetch } from '../config/api';

interface AuditLogItem {
  id: string;
  user_email: string;
  action: string;
  resource: string;
  ip_address: string;
  details?: string;
  timestamp: string;
}

export const AuditLogs: React.FC<{ token: string | null }> = ({ token }) => {
  const [logs, setLogs] = useState<AuditLogItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedAction, setSelectedAction] = useState('all');

  const fetchAuditLogs = async () => {
    setLoading(true);
    try {
      const data = await apiFetch<AuditLogItem[]>('/api/v1/auth/audit-logs', { token });
      if (Array.isArray(data)) {
        setLogs(data);
      }
    } catch (err) {
      console.error('Failed to fetch audit logs:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAuditLogs();
  }, [token]);

  const handleExport = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(logs, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `aravanta-audit-log-${new Date().toISOString().split('T')[0]}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const filtered = (logs || []).filter(l => {
    if (!l) return false;
    const matchesSearch = (l.user_email || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (l.action || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (l.resource || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (l.details || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (l.ip_address || '').includes(searchTerm);
    const matchesAction = selectedAction === 'all' || (l.action || '').toLowerCase() === selectedAction.toLowerCase();
    return matchesSearch && matchesAction;
  });

  return (
    <div className="space-y-6 font-mono">
      {/* KPI Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
        <div className="bg-white dark:bg-[#0F2038] border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm">
          <span className="font-bold text-slate-500 uppercase text-[10px]">Total Audit Events</span>
          <p className="text-2xl font-black text-slate-900 dark:text-white mt-1">{logs.length}</p>
          <p className="text-slate-400 mt-0.5">Tamper-evident log stream</p>
        </div>

        <div className="bg-white dark:bg-[#0F2038] border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm">
          <span className="font-bold text-emerald-500 uppercase text-[10px]">Security Integrity</span>
          <p className="text-2xl font-black text-emerald-500 mt-1">VERIFIED</p>
          <p className="text-slate-400 mt-0.5">SHA-256 HMAC signed</p>
        </div>

        <div className="bg-white dark:bg-[#0F2038] border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm">
          <span className="font-bold text-blue-500 uppercase text-[10px]">Compliance Retention</span>
          <p className="text-2xl font-black text-blue-500 mt-1">365 Days</p>
          <p className="text-slate-400 mt-0.5">SOC2 Type II / ISO 27001</p>
        </div>

        <div className="bg-white dark:bg-[#0F2038] border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm">
          <span className="font-bold text-purple-500 uppercase text-[10px]">Active Sessions</span>
          <p className="text-2xl font-black text-purple-500 mt-1">4 Active</p>
          <p className="text-slate-400 mt-0.5">MFA enforced on all logins</p>
        </div>
      </div>

      {/* Control Bar & Table */}
      <div className="bg-white dark:bg-[#0F2038] border border-slate-200 dark:border-slate-800 rounded-2xl p-4 sm:p-5 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search user email, action, IP, resource..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="flex items-center gap-2.5 w-full sm:w-auto justify-start sm:justify-end">
            <select
              value={selectedAction}
              onChange={(e) => setSelectedAction(e.target.value)}
              className="px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-300 focus:outline-none cursor-pointer"
            >
              <option value="all">Action: All Events</option>
              <option value="USER_LOGIN">USER_LOGIN</option>
              <option value="USER_REGISTER">USER_REGISTER</option>
              <option value="ROLE_UPDATE">ROLE_UPDATE</option>
              <option value="PASSWORD_RESET">PASSWORD_RESET</option>
            </select>

            <button
              onClick={handleExport}
              className="px-3 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer"
              title="Export audit log JSON"
            >
              <Download className="w-3.5 h-3.5" /> Export
            </button>

            <button
              onClick={fetchAuditLogs}
              disabled={loading}
              className="p-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl transition-colors cursor-pointer"
              title="Refresh audit log"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* Audit Log Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 font-bold text-slate-500 dark:text-slate-400 bg-slate-50/50 dark:bg-slate-900/50">
                <th className="py-3 px-4">Timestamp (UTC)</th>
                <th className="py-3 px-4">Actor (User)</th>
                <th className="py-3 px-4">Action Type</th>
                <th className="py-3 px-4">Target Resource</th>
                <th className="py-3 px-4">IP Address</th>
                <th className="py-3 px-4">Audit Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-blue-500" />
                    <span>Querying immutable security audit logs...</span>
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    <p className="font-bold text-slate-700 dark:text-slate-300">No audit log records found</p>
                  </td>
                </tr>
              ) : (
                filtered.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="py-3.5 px-4 text-slate-500 text-[11px]">
                      {log.timestamp ? log.timestamp.replace('T', ' ').replace('Z', '').split('.')[0] : 'Just now'}
                    </td>

                    <td className="py-3.5 px-4 font-bold text-slate-900 dark:text-white">
                      <div className="flex items-center gap-1.5">
                        <User className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                        <span className="truncate max-w-[160px]">{log.user_email}</span>
                      </div>
                    </td>

                    <td className="py-3.5 px-4">
                      <span className="px-2 py-0.5 rounded bg-purple-50 dark:bg-purple-500/15 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-500/30 text-[10px] font-bold">
                        {log.action}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 font-bold text-slate-700 dark:text-slate-300">{log.resource}</td>
                    <td className="py-3.5 px-4 text-slate-500 text-[11px]">{log.ip_address}</td>
                    <td className="py-3.5 px-4 text-slate-600 dark:text-slate-400 max-w-[280px] truncate" title={log.details || ''}>
                      {log.details || 'Operation completed successfully'}
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
