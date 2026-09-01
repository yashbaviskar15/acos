import React, { useState } from 'react';
import { 
  ShieldCheck, 
  Lock, 
  UserCheck, 
  Check, 
  X, 
  Smartphone, 
  Globe
} from 'lucide-react';

interface PermissionRow {
  category: string;
  action: string;
  admin: boolean;
  operator: boolean;
  developer: boolean;
  viewer: boolean;
}

const PERMISSIONS_MATRIX: PermissionRow[] = [
  { category: 'Infrastructure', action: 'Provision Elastic VM / Cluster', admin: true, operator: true, developer: false, viewer: false },
  { category: 'Infrastructure', action: 'Stop / Reboot / Scale Nodes', admin: true, operator: true, developer: true, viewer: false },
  { category: 'Infrastructure', action: 'Decommission / Terminate Resource', admin: true, operator: false, developer: false, viewer: false },
  
  { category: 'Deployments', action: 'Trigger Production Deployment', admin: true, operator: true, developer: true, viewer: false },
  { category: 'Deployments', action: 'Execute Emergency Rollback', admin: true, operator: true, developer: true, viewer: false },
  { category: 'Deployments', action: 'Modify Deployment Strategy', admin: true, operator: true, developer: false, viewer: false },
  
  { category: 'Observability', action: 'Inspect Live Telemetry & Gauges', admin: true, operator: true, developer: true, viewer: true },
  { category: 'Observability', action: 'Acknowledge / Mute Alerts', admin: true, operator: true, developer: true, viewer: false },
  { category: 'Observability', action: 'Declare / Resolve Incidents', admin: true, operator: true, developer: false, viewer: false },
  
  { category: 'Logs', action: 'View Live Stdout/Stderr Stream', admin: true, operator: true, developer: true, viewer: true },
  { category: 'Logs', action: 'Export Log Dumps (JSON/CSV)', admin: true, operator: true, developer: true, viewer: false },
  
  { category: 'Automation', action: 'Execute Runbook ("Run Now")', admin: true, operator: true, developer: true, viewer: false },
  { category: 'Automation', action: 'Create / Edit Cron Schedules', admin: true, operator: true, developer: false, viewer: false },
  
  { category: 'Security & IAM', action: 'Assign RBAC System Roles', admin: true, operator: false, developer: false, viewer: false },
  { category: 'Security & IAM', action: 'Inspect Security Audit Logs', admin: true, operator: true, developer: false, viewer: false },
  { category: 'Security & IAM', action: 'Rotate API Keys & MFA Secrets', admin: true, operator: false, developer: false, viewer: false },
];

export const Security: React.FC<{ token?: string | null }> = () => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [sessions, setSessions] = useState([
    { id: 'sess-01', user: 'yashbaviskar67@gmail.com', ip: '203.0.113.45', location: 'Mumbai, IN', browser: 'Chrome 128 / Windows', status: 'ACTIVE', current: true },
    { id: 'sess-02', user: 'admin@aravanta.cloud', ip: '198.51.100.22', location: 'Virginia, US', browser: 'Firefox 130 / macOS', status: 'ACTIVE', current: false },
    { id: 'sess-03', user: 'yashbaviskar67@gmail.com', ip: '203.0.113.45', location: 'Mumbai, IN', browser: 'Mobile Safari / iOS', status: 'ACTIVE', current: false },
  ]);

  const handleRevokeSession = (id: string) => {
    setSessions(prev => prev.filter(s => s.id !== id));
  };

  const filteredPermissions = selectedCategory === 'all' 
    ? PERMISSIONS_MATRIX 
    : PERMISSIONS_MATRIX.filter(p => p.category.toLowerCase() === selectedCategory.toLowerCase());

  return (
    <div className="space-y-6 font-mono text-xs">
      {/* Top Banner */}
      <div className="bg-white dark:bg-[#0F2038] border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-purple-50 dark:bg-purple-500/15 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-black text-slate-900 dark:text-white uppercase tracking-tight">
              ArvGate Role-Based Access Control (RBAC) & Governance
            </h2>
            <p className="text-slate-500 text-[11px] mt-0.5">Granular 4-tier role policy matrix across cloud engineering domains</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="px-3 py-1 bg-emerald-50 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/30 rounded-xl font-bold">
            Zero Trust Enforced
          </span>
        </div>
      </div>

      {/* Security Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-[#0F2038] border border-slate-200 dark:border-slate-800 p-5 rounded-2xl shadow-sm space-y-2">
          <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-bold text-xs">
            <Lock className="w-4 h-4" /> Transport & Storage Encryption
          </div>
          <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed font-sans">
            TLS 1.3 encryption across all public ingress API routes. Storage volumes and database snapshots encrypted with AES-256-GCM.
          </p>
        </div>

        <div className="bg-white dark:bg-[#0F2038] border border-slate-200 dark:border-slate-800 p-5 rounded-2xl shadow-sm space-y-2">
          <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400 font-bold text-xs">
            <Smartphone className="w-4 h-4" /> Multi-Factor Authentication
          </div>
          <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed font-sans">
            RFC 6238 TOTP Authenticator standard (Google Authenticator / Authy) enforced on all administrative actions and user sign-ins.
          </p>
        </div>

        <div className="bg-white dark:bg-[#0F2038] border border-slate-200 dark:border-slate-800 p-5 rounded-2xl shadow-sm space-y-2">
          <div className="flex items-center gap-2 text-purple-600 dark:text-purple-400 font-bold text-xs">
            <UserCheck className="w-4 h-4" /> Cryptographic JWT Verification
          </div>
          <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed font-sans">
            Stateless JWT bearer tokens signed with SHA-256 HMAC. Tokens embed user system roles for sub-millisecond API authorization.
          </p>
        </div>
      </div>

      {/* RBAC Permission Matrix */}
      <div className="bg-white dark:bg-[#0F2038] border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase">RBAC Roles & Permission Entitlements Matrix</h3>
            <p className="text-slate-500 text-[11px]">Enforced at API gateway middleware layer</p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {['all', 'Infrastructure', 'Deployments', 'Observability', 'Logs', 'Automation', 'Security & IAM'].map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                  selectedCategory === cat
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                }`}
              >
                {cat === 'all' ? 'All Domains' : cat}
              </button>
            ))}
          </div>
        </div>

        {/* Matrix Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 font-bold text-slate-500 dark:text-slate-400 bg-slate-50/50 dark:bg-slate-900/50">
                <th className="py-3 px-4">Domain</th>
                <th className="py-3 px-4">Action / Entitlement</th>
                <th className="py-3 px-4 text-center">Admin (SuperAdmin)</th>
                <th className="py-3 px-4 text-center">Operator (SRE)</th>
                <th className="py-3 px-4 text-center">Developer</th>
                <th className="py-3 px-4 text-center">Viewer (Auditor)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
              {filteredPermissions.map((row, idx) => (
                <tr key={idx} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors">
                  <td className="py-3 px-4 font-bold text-purple-600 dark:text-purple-400 text-[11px]">
                    {row.category}
                  </td>

                  <td className="py-3 px-4 font-bold text-slate-900 dark:text-white">
                    {row.action}
                  </td>

                  <td className="py-3 px-4 text-center">
                    {row.admin ? (
                      <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600">
                        <Check className="w-3.5 h-3.5" />
                      </span>
                    ) : (
                      <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400">
                        <X className="w-3.5 h-3.5" />
                      </span>
                    )}
                  </td>

                  <td className="py-3.5 px-4 text-center">
                    {row.operator ? (
                      <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600">
                        <Check className="w-3.5 h-3.5" />
                      </span>
                    ) : (
                      <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400">
                        <X className="w-3.5 h-3.5" />
                      </span>
                    )}
                  </td>

                  <td className="py-3.5 px-4 text-center">
                    {row.developer ? (
                      <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600">
                        <Check className="w-3.5 h-3.5" />
                      </span>
                    ) : (
                      <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400">
                        <X className="w-3.5 h-3.5" />
                      </span>
                    )}
                  </td>

                  <td className="py-3.5 px-4 text-center">
                    {row.viewer ? (
                      <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600">
                        <Check className="w-3.5 h-3.5" />
                      </span>
                    ) : (
                      <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400">
                        <X className="w-3.5 h-3.5" />
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Active User Sessions */}
      <div className="bg-white dark:bg-[#0F2038] border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase">Active Authenticated Sessions</h3>
            <p className="text-slate-500 text-[11px]">Inspect active JWT bearer token authorizations</p>
          </div>
        </div>

        <div className="divide-y divide-slate-100 dark:divide-slate-800/80">
          {sessions.map((sess) => (
            <div key={sess.id} className="py-3.5 flex items-center justify-between flex-wrap gap-3">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-500/15 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold">
                  <Globe className="w-4 h-4" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <strong className="text-slate-900 dark:text-white">{sess.user}</strong>
                    {sess.current && (
                      <span className="px-2 py-0.5 rounded bg-emerald-50 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 text-[10px] font-bold">
                        CURRENT DEVICE
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-500">{sess.browser} • {sess.location} (IP: {sess.ip})</p>
                </div>
              </div>

              {!sess.current && (
                <button
                  onClick={() => handleRevokeSession(sess.id)}
                  className="px-3 py-1.5 text-xs text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded-xl transition-colors font-bold cursor-pointer"
                >
                  Revoke Token
                </button>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
