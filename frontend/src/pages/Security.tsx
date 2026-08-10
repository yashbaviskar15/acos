import React, { useState, useEffect } from 'react';
import { ShieldCheck, Lock, Key, UserCheck, RefreshCw } from 'lucide-react';
import { apiFetch } from '../config/api';

interface SecurityProps {
  token: string | null;
}

export const Security: React.FC<SecurityProps> = ({ token }) => {
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const authHeaders: Record<string, string> = token ? { 'Authorization': `Bearer ${token}` } : {};

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const data = await apiFetch('/v1/monitoring/audit-log', { headers: authHeaders });
      setAuditLogs(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [token]);

  return (
    <div className="p-4 sm:p-6 space-y-6">
      {/* Top Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white dark:bg-[#0F2038] border border-slate-200 dark:border-slate-800 p-5 rounded-2xl shadow-sm">
        <div>
          <h2 className="text-base sm:text-lg font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            ArvGate Identity & Audit Security Center
          </h2>
          <p className="text-xs text-slate-600 dark:text-slate-400 font-mono mt-0.5">RBAC permissions, multi-factor authentication (MFA), and immutable audit trail</p>
        </div>

        <button
          onClick={fetchLogs}
          className="p-2.5 text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-900 hover:bg-slate-200 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 rounded-xl transition-colors cursor-pointer"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Security Policies Overview Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-[#0F2038] border border-slate-200 dark:border-slate-800 p-5 rounded-2xl shadow-sm space-y-2">
          <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-bold text-xs">
            <Lock className="w-4 h-4" /> Zero Trust Encryption
          </div>
          <p className="text-xs text-slate-600 dark:text-slate-300 font-mono leading-relaxed">TLS 1.3 in transit, AES-256 at rest across all storage & database volumes.</p>
        </div>

        <div className="bg-white dark:bg-[#0F2038] border border-slate-200 dark:border-slate-800 p-5 rounded-2xl shadow-sm space-y-2">
          <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400 font-bold text-xs">
            <Key className="w-4 h-4" /> MFA & FIDO2 WebAuthn
          </div>
          <p className="text-xs text-slate-600 dark:text-slate-300 font-mono leading-relaxed">TOTP Authenticator & Hardware Security Keys enabled for SuperAdmin access.</p>
        </div>

        <div className="bg-white dark:bg-[#0F2038] border border-slate-200 dark:border-slate-800 p-5 rounded-2xl shadow-sm space-y-2">
          <div className="flex items-center gap-2 text-purple-600 dark:text-purple-400 font-bold text-xs">
            <UserCheck className="w-4 h-4" /> Role-Based Access Control
          </div>
          <p className="text-xs text-slate-600 dark:text-slate-300 font-mono leading-relaxed">Strictly enforced roles (SuperAdmin, Developer, Admin, Viewer, Auditor).</p>
        </div>
      </div>

      {/* Audit Log Table */}
      <div className="bg-white dark:bg-[#0F2038] border border-slate-200 dark:border-slate-800 rounded-2xl p-5 space-y-4 shadow-sm">
        <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
          <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider font-mono">
            Immutable Audit Trail Log
          </h3>
          <span className="px-3 py-1 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-mono text-emerald-600 dark:text-emerald-400 font-bold">
            {auditLogs.length} Events Recorded
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-900/80 text-slate-600 dark:text-slate-400 font-mono text-[10px] uppercase border-b border-slate-200 dark:border-slate-800 font-extrabold">
              <tr>
                <th className="p-3">User Principal</th>
                <th className="p-3">Action Type</th>
                <th className="p-3">Target Resource</th>
                <th className="p-3">Service Module</th>
                <th className="p-3">IP Address</th>
                <th className="p-3">Timestamp (UTC)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800/60 font-mono">
              {auditLogs.map((log) => (
                <tr key={log.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                  <td className="p-3 font-bold text-slate-900 dark:text-white">{log.user}</td>
                  <td className="p-3">
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 dark:bg-blue-500/20 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-500/30">
                      {log.action}
                    </span>
                  </td>
                  <td className="p-3 text-slate-700 dark:text-slate-300">{log.resource}</td>
                  <td className="p-3 text-purple-600 dark:text-purple-400 font-bold">{log.service}</td>
                  <td className="p-3 text-slate-500 dark:text-slate-400">{log.ip}</td>
                  <td className="p-3 text-slate-500 dark:text-slate-400">{log.timestamp.replace('T', ' ').slice(0, 19)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
