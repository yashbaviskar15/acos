import React, { useState } from 'react';
import { 
  ShieldCheck, 
  Lock, 
  UserCheck, 
  Check, 
  X, 
  Smartphone, 
  Globe,
  Shield,
  ArrowRight,
  Search,
  ArrowUpDown,
  ArrowUp,
  ArrowDown
} from 'lucide-react';
import { DataTablePagination } from '../components/DataTablePagination';

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

const PLAIN_LANGUAGE_CHECKS = [
  {
    id: 'deploy-prod',
    question: 'Can this user deploy to production?',
    action: 'Trigger Production Deployment',
    allowedRoles: ['SuperAdmin', 'Admin', 'Operator', 'Developer'],
    blockedRoles: ['Viewer'],
    explanation: 'Developers, Operators, and Admins can trigger production deployments. Viewers are strictly read-only.',
  },
  {
    id: 'emergency-rollback',
    question: 'Can this user execute an emergency rollback?',
    action: 'Execute Emergency Rollback',
    allowedRoles: ['SuperAdmin', 'Admin', 'Operator', 'Developer'],
    blockedRoles: ['Viewer'],
    explanation: 'Emergency rollback is self-service for all engineering tiers (Developer and above) to ensure immediate MTTR remediation.',
  },
  {
    id: 'terminate-resource',
    question: 'Who can decommission or terminate production resources?',
    action: 'Decommission / Terminate Resource',
    allowedRoles: ['SuperAdmin', 'Admin'],
    blockedRoles: ['Operator', 'Developer', 'Viewer'],
    explanation: 'Destructive termination actions require Administrator authority to prevent accidental outage or data loss.',
  },
  {
    id: 'manage-rbac',
    question: 'Who can assign roles or change permissions?',
    action: 'Assign RBAC System Roles',
    allowedRoles: ['SuperAdmin', 'Admin'],
    blockedRoles: ['Operator', 'Developer', 'Viewer'],
    explanation: 'Role modification is strictly restricted to Admins via server-verified hierarchy check.',
  },
  {
    id: 'run-automations',
    question: 'Can this user execute runbooks ("Run Now")?',
    action: 'Execute Runbook ("Run Now")',
    allowedRoles: ['SuperAdmin', 'Admin', 'Operator', 'Developer'],
    blockedRoles: ['Viewer'],
    explanation: 'Engineers can trigger pre-approved remediation workflows without manual ticket escalation.',
  },
];

const ROLE_SUMMARIES: Record<string, { title: string; can: string[]; cannot: string[] }> = {
  Developer: {
    title: 'Developer',
    can: [
      'Deploy applications & microservices to production and staging',
      'Trigger 1-click emergency rollbacks and canary traffic shifts',
      'Reboot and scale virtual machines and Kubernetes worker nodes',
      'View real-time telemetry, Prometheus metrics, and live stdout/stderr logs',
      'Execute pre-approved self-healing automation runbooks',
    ],
    cannot: [
      'Cannot decommission or terminate database instances or clusters',
      'Cannot invite users with Admin/SuperAdmin privileges or edit RBAC policies',
      'Cannot view or rotate master secret keys or workspace payment methods',
    ],
  },
  Operator: {
    title: 'Operator (SRE)',
    can: [
      'Provision new compute VMs, database engines, and storage buckets',
      'Trigger deployments, manage deployment strategies, and execute rollbacks',
      'Acknowledge, mute, and declare incidents in the Incident War Room',
      'Inspect security audit trails and log stream archives',
      'Create and edit cron schedules and automation runbooks',
    ],
    cannot: [
      'Cannot terminate production resources without Admin dual-authorization',
      'Cannot modify workspace security policies or assign SuperAdmin roles',
    ],
  },
  Admin: {
    title: 'Admin / SuperAdmin',
    can: [
      'Full administrative authority across all infrastructure and deployments',
      'Provision, scale, reboot, and decommission any resource',
      'Assign workspace roles (subject to hierarchy), invite members, and rotate API keys',
      'Manage billing, payment methods, and invoice exports',
    ],
    cannot: ['No restrictions within workspace scope'],
  },
  Viewer: {
    title: 'Viewer (Auditor)',
    can: [
      'Inspect live telemetry, performance gauges, and incident status',
      'Read application catalogs and deployment history',
      'Browse compliance reports and read-only audit log views',
    ],
    cannot: [
      'Cannot deploy, restart, or modify any container, VM, or database',
      'Cannot trigger automations, rollbacks, or alert actions',
      'Cannot access credentials or configuration secrets',
    ],
  },
};

export const Security: React.FC<{ token?: string | null }> = () => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [activeQuestionId, setActiveQuestionId] = useState<string>('deploy-prod');
  const [inspectedRole, setInspectedRole] = useState<string>('Developer');
  const [viewMode, setViewMode] = useState<'plain' | 'matrix'>('plain');
  const [sessions, setSessions] = useState([
    { id: 'sess-01', user: 'yashbaviskar67@gmail.com', ip: '203.0.113.45', location: 'Mumbai, IN', browser: 'Chrome 128 / Windows', status: 'ACTIVE', current: true },
    { id: 'sess-02', user: 'admin@aravanta.cloud', ip: '198.51.100.22', location: 'Virginia, US', browser: 'Firefox 130 / macOS', status: 'ACTIVE', current: false },
    { id: 'sess-03', user: 'yashbaviskar67@gmail.com', ip: '203.0.113.45', location: 'Mumbai, IN', browser: 'Mobile Safari / iOS', status: 'ACTIVE', current: false },
  ]);

  const handleRevokeSession = (id: string) => {
    setSessions(prev => prev.filter(s => s.id !== id));
  };

  const currentQuestion = PLAIN_LANGUAGE_CHECKS.find(q => q.id === activeQuestionId) || PLAIN_LANGUAGE_CHECKS[0];
  const currentRoleSummary = ROLE_SUMMARIES[inspectedRole] || ROLE_SUMMARIES.Developer;

  // Matrix table searching, sorting, pagination
  const [matrixSearch, setMatrixSearch] = useState('');
  const [matrixSortField, setMatrixSortField] = useState<string>('category');
  const [matrixSortDir, setMatrixSortDir] = useState<'asc' | 'desc'>('asc');
  const [matrixPage, setMatrixPage] = useState<number>(1);
  const [matrixPageSize, setMatrixPageSize] = useState<number>(10);

  const handleMatrixSort = (field: string) => {
    if (matrixSortField === field) {
      setMatrixSortDir(matrixSortDir === 'asc' ? 'desc' : 'asc');
    } else {
      setMatrixSortField(field);
      setMatrixSortDir('asc');
    }
    setMatrixPage(1);
  };

  const renderMatrixSortIcon = (field: string) => {
    if (matrixSortField !== field) {
      return <ArrowUpDown className="w-3 h-3 text-slate-400 opacity-60 ml-1 inline" />;
    }
    return matrixSortDir === 'asc' ? (
      <ArrowUp className="w-3 h-3 text-purple-500 ml-1 inline" />
    ) : (
      <ArrowDown className="w-3 h-3 text-purple-500 ml-1 inline" />
    );
  };

  const mQuery = matrixSearch.toLowerCase().trim();
  const filteredPermissions = PERMISSIONS_MATRIX.filter((p) => {
    const matchesCategory = selectedCategory === 'all' || p.category.toLowerCase() === selectedCategory.toLowerCase();
    const matchesSearch = !mQuery || p.category.toLowerCase().includes(mQuery) || p.action.toLowerCase().includes(mQuery);
    return matchesCategory && matchesSearch;
  });

  const sortedPermissions = [...filteredPermissions].sort((a: any, b: any) => {
    let aVal = a[matrixSortField] ?? '';
    let bVal = b[matrixSortField] ?? '';
    if (typeof aVal === 'boolean' && typeof bVal === 'boolean') {
      return matrixSortDir === 'asc' ? (aVal === bVal ? 0 : aVal ? -1 : 1) : (aVal === bVal ? 0 : aVal ? 1 : -1);
    }
    if (typeof aVal === 'string') aVal = aVal.toLowerCase();
    if (typeof bVal === 'string') bVal = bVal.toLowerCase();
    if (aVal < bVal) return matrixSortDir === 'asc' ? -1 : 1;
    if (aVal > bVal) return matrixSortDir === 'asc' ? 1 : -1;
    return 0;
  });

  const paginatedPermissions = sortedPermissions.slice(
    (matrixPage - 1) * matrixPageSize,
    matrixPage * matrixPageSize
  );

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

      {/* RBAC Governance Section */}
      <div className="bg-white dark:bg-[#0F2038] border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-5">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-800 pb-4">
          <div>
            <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase flex items-center gap-2">
              <Shield className="w-4 h-4 text-purple-500" />
              RBAC Plain-Language Entitlement Inspector
            </h3>
            <p className="text-slate-500 text-[11px] mt-0.5">Zero-cross-referencing plain-English answers to critical authorization questions</p>
          </div>

          <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-900 p-1 rounded-xl border border-slate-200 dark:border-slate-800">
            <button
              onClick={() => setViewMode('plain')}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                viewMode === 'plain'
                  ? 'bg-purple-600 text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Plain-Language Inspector
            </button>
            <button
              onClick={() => setViewMode('matrix')}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                viewMode === 'matrix'
                  ? 'bg-purple-600 text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Raw 4-Tier Matrix
            </button>
          </div>
        </div>

        {viewMode === 'plain' ? (
          <div className="space-y-5">
            {/* Quick Question Bar */}
            <div className="space-y-2">
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Frequently Asked Entitlement Questions</span>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                {PLAIN_LANGUAGE_CHECKS.map((q) => (
                  <button
                    key={q.id}
                    onClick={() => setActiveQuestionId(q.id)}
                    className={`text-left p-3 rounded-xl border transition-all cursor-pointer text-xs ${
                      activeQuestionId === q.id
                        ? 'border-purple-500 bg-purple-50/50 dark:bg-purple-500/10 text-purple-950 dark:text-purple-200 shadow-sm font-bold'
                        : 'border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30 text-slate-700 dark:text-slate-300 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span>{q.question}</span>
                      <ArrowRight className={`w-3.5 h-3.5 shrink-0 ml-2 ${activeQuestionId === q.id ? 'text-purple-600 dark:text-purple-400' : 'text-slate-400'}`} />
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Answer Card */}
            <div className="p-4 bg-gradient-to-br from-purple-500/5 via-slate-50 dark:via-[#111827] to-slate-100 dark:to-[#0B1528] rounded-2xl border border-purple-500/20 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="space-y-1">
                  <span className="text-[10px] font-bold text-purple-600 dark:text-purple-400 uppercase tracking-wider">Direct Verdict</span>
                  <h4 className="text-sm font-black text-slate-900 dark:text-white">{currentQuestion.question}</h4>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  {['SuperAdmin', 'Admin', 'Operator', 'Developer', 'Viewer'].map((r) => {
                    const isAllowed = currentQuestion.allowedRoles.includes(r);
                    return (
                      <span
                        key={r}
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-bold border ${
                          isAllowed
                            ? 'bg-emerald-50 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-300 dark:border-emerald-500/30'
                            : 'bg-rose-50 dark:bg-rose-500/15 text-rose-700 dark:text-rose-400 border-rose-200 dark:border-rose-500/30'
                        }`}
                      >
                        {isAllowed ? <Check className="w-3 h-3" /> : <X className="w-3 h-3" />}
                        {r}
                      </span>
                    );
                  })}
                </div>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-300 bg-white/70 dark:bg-slate-900/60 p-3 rounded-xl border border-slate-200 dark:border-slate-800">
                {currentQuestion.explanation}
              </p>
            </div>

            {/* Role Persona Inspector */}
            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Inspect Capabilities by Role</span>
                <div className="flex items-center gap-1">
                  {['Developer', 'Operator', 'Admin', 'Viewer'].map((r) => (
                    <button
                      key={r}
                      onClick={() => setInspectedRole(r)}
                      className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        inspectedRole === r
                          ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                      }`}
                    >
                      {r}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 bg-emerald-50/50 dark:bg-emerald-500/5 rounded-xl border border-emerald-200 dark:border-emerald-500/20 space-y-2">
                  <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-400 font-bold text-xs uppercase tracking-wider">
                    <Check className="w-4 h-4" /> Allowed Actions for {currentRoleSummary.title}
                  </div>
                  <ul className="space-y-1.5 text-slate-700 dark:text-slate-300 text-xs">
                    {currentRoleSummary.can.map((item, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <span className="text-emerald-600 dark:text-emerald-400 font-bold">•</span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="p-4 bg-rose-50/50 dark:bg-rose-500/5 rounded-xl border border-rose-200 dark:border-rose-500/20 space-y-2">
                  <div className="flex items-center gap-2 text-rose-700 dark:text-rose-400 font-bold text-xs uppercase tracking-wider">
                    <X className="w-4 h-4" /> Restricted / Blocked for {currentRoleSummary.title}
                  </div>
                  <ul className="space-y-1.5 text-slate-700 dark:text-slate-300 text-xs">
                    {currentRoleSummary.cannot.map((item, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <span className="text-rose-600 dark:text-rose-400 font-bold">•</span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-1">
              <div className="flex items-center gap-2 flex-wrap">
                {['all', 'Infrastructure', 'Deployments', 'Observability', 'Logs', 'Automation', 'Security & IAM'].map((cat) => (
                  <button
                    key={cat}
                    onClick={() => {
                      setSelectedCategory(cat);
                      setMatrixPage(1);
                    }}
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

              <div className="relative w-full sm:w-56">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                <input
                  type="text"
                  placeholder="Search entitlements..."
                  value={matrixSearch}
                  onChange={(e) => {
                    setMatrixSearch(e.target.value);
                    setMatrixPage(1);
                  }}
                  className="w-full pl-8 pr-7 py-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-mono text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
                />
                {matrixSearch && (
                  <button
                    type="button"
                    onClick={() => {
                      setMatrixSearch('');
                      setMatrixPage(1);
                    }}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>

            {/* Matrix Table */}
            <div className="space-y-3">
              <div className="overflow-x-auto min-w-full">
                <table className="w-full min-w-[750px] text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-200 dark:border-slate-800 font-bold text-slate-500 dark:text-slate-400 bg-slate-50/50 dark:bg-slate-900/50 select-none">
                      <th className="py-3 px-4 cursor-pointer hover:text-slate-200" onClick={() => handleMatrixSort('category')}>
                        Domain {renderMatrixSortIcon('category')}
                      </th>
                      <th className="py-3 px-4 cursor-pointer hover:text-slate-200" onClick={() => handleMatrixSort('action')}>
                        Action / Entitlement {renderMatrixSortIcon('action')}
                      </th>
                      <th className="py-3 px-4 text-center cursor-pointer hover:text-slate-200" onClick={() => handleMatrixSort('admin')}>
                        Admin (SuperAdmin) {renderMatrixSortIcon('admin')}
                      </th>
                      <th className="py-3 px-4 text-center cursor-pointer hover:text-slate-200" onClick={() => handleMatrixSort('operator')}>
                        Operator (SRE) {renderMatrixSortIcon('operator')}
                      </th>
                      <th className="py-3 px-4 text-center cursor-pointer hover:text-slate-200" onClick={() => handleMatrixSort('developer')}>
                        Developer {renderMatrixSortIcon('developer')}
                      </th>
                      <th className="py-3 px-4 text-center cursor-pointer hover:text-slate-200" onClick={() => handleMatrixSort('viewer')}>
                        Viewer (Auditor) {renderMatrixSortIcon('viewer')}
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                    {paginatedPermissions.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="py-8 text-center text-slate-400 font-sans">
                          No entitlements match your criteria
                        </td>
                      </tr>
                    ) : (
                      paginatedPermissions.map((row, idx) => (
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
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              <DataTablePagination
                currentPage={matrixPage}
                totalItems={sortedPermissions.length}
                pageSize={matrixPageSize}
                onPageChange={setMatrixPage}
                onPageSizeChange={(sz) => {
                  setMatrixPageSize(sz);
                  setMatrixPage(1);
                }}
                pageSizeOptions={[5, 10, 20]}
              />
            </div>
          </div>
        )}
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
