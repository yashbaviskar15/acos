import React, { useState, useEffect, useCallback } from 'react';
import {
  Shield, ShieldCheck, ShieldAlert, CheckCircle2,
  RefreshCw, FileText, XCircle, Search, X, ArrowUpDown, ArrowUp, ArrowDown,
  Terminal, Bug, Play, Code, Check, Copy, AlertTriangle
} from 'lucide-react';
import { apiFetch } from '../config/api';
import { DataTablePagination } from '../components/DataTablePagination';

interface ComplianceProps {
  token: string | null;
}

export const Compliance: React.FC<ComplianceProps> = ({ token }) => {
  const [score, setScore] = useState<any>(null);
  const [policies, setPolicies] = useState<any[]>([]);
  const [violations, setViolations] = useState<any[]>([]);
  const [frameworks, setFrameworks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeView, setActiveView] = useState<'overview' | 'policies' | 'violations' | 'frameworks' | 'strix'>('overview');

  // Strix AI Penetration Testing States
  const [strixStatus, setStrixStatus] = useState<any>(null);
  const [strixScans, setStrixScans] = useState<any[]>([]);
  const [strixFindings, setStrixFindings] = useState<any[]>([]);
  const [selectedScan, setSelectedScan] = useState<any>(null);
  const [isLaunchingScan, setIsLaunchingScan] = useState(false);
  const [showLaunchModal, setShowLaunchModal] = useState(false);
  const [showDiagnostics, setShowDiagnostics] = useState(false);
  const [copiedPocId, setCopiedPocId] = useState<string | null>(null);

  // Strix Launch Form States
  const [targetInput, setTargetInput] = useState('http://localhost:8000');
  const [targetType, setTargetType] = useState('web_app');
  const [scanMode, setScanMode] = useState('quick');
  const [instruction, setInstruction] = useState('');
  const [budget, setBudget] = useState('10');

  // Findings filter
  const [findingSeverityFilter, setFindingSeverityFilter] = useState<string>('all');
  const [findingStatusFilter, setFindingStatusFilter] = useState<string>('all');

  // Policies table searching, sorting & pagination
  const [policySearch, setPolicySearch] = useState('');
  const [policySortField, setPolicySortField] = useState<string>('name');
  const [policySortDir, setPolicySortDir] = useState<'asc' | 'desc'>('asc');
  const [policyPage, setPolicyPage] = useState<number>(1);
  const [policyPageSize, setPolicyPageSize] = useState<number>(10);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [s, p, v, f, strixStat, strixRuns, strixFnds] = await Promise.all([
        apiFetch<any>('/api/v1/guard/score', { token }).catch(() => null),
        apiFetch<any[]>('/api/v1/guard/policies', { token }).catch(() => []),
        apiFetch<any[]>('/api/v1/guard/violations', { token }).catch(() => []),
        apiFetch<any[]>('/api/v1/guard/frameworks', { token }).catch(() => []),
        apiFetch<any>('/api/v1/guard/strix/status', { token }).catch(() => null),
        apiFetch<any[]>('/api/v1/guard/strix/scans', { token }).catch(() => []),
        apiFetch<any[]>('/api/v1/guard/strix/findings', { token }).catch(() => []),
      ]);
      if (s) setScore(s);
      if (Array.isArray(p)) setPolicies(p);
      if (Array.isArray(v)) setViolations(v);
      if (Array.isArray(f)) setFrameworks(f);
      if (strixStat) setStrixStatus(strixStat);
      if (Array.isArray(strixRuns)) setStrixScans(strixRuns);
      if (Array.isArray(strixFnds)) setStrixFindings(strixFnds);
    } catch (err) {
      console.error('ArvGuard fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const openViolations = violations.filter(v => v.status === 'open').length;
  const overallScore = score?.overall_score ?? 0;
  const scoreColor = overallScore >= 80 ? 'emerald' : overallScore >= 60 ? 'amber' : 'red';

  const handleLaunchScan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetInput.trim()) return;
    setIsLaunchingScan(true);
    try {
      await apiFetch<any>('/api/v1/guard/strix/scans', {
        method: 'POST',
        token,
        body: JSON.stringify({
          target: targetInput.trim(),
          target_type: targetType,
          scan_mode: scanMode,
          instruction: instruction.trim() || undefined,
          max_budget: budget ? parseFloat(budget) : undefined
        })
      });
      setShowLaunchModal(false);
      await fetchData();
      setActiveView('strix');
    } catch (err: any) {
      alert(err?.message || 'Failed to dispatch Strix penetration test');
    } finally {
      setIsLaunchingScan(false);
    }
  };

  const handleResolveFinding = async (findingId: string) => {
    try {
      await apiFetch<any>(`/api/v1/guard/strix/findings/${findingId}/resolve`, {
        method: 'POST',
        token
      });
      await fetchData();
    } catch (err) {
      console.error('Error resolving finding:', err);
    }
  };

  const handleCopyPoc = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedPocId(id);
    setTimeout(() => setCopiedPocId(null), 2000);
  };

  const handlePolicySort = (field: string) => {
    if (policySortField === field) {
      setPolicySortDir(policySortDir === 'asc' ? 'desc' : 'asc');
    } else {
      setPolicySortField(field);
      setPolicySortDir('asc');
    }
    setPolicyPage(1);
  };

  const renderPolicySortIcon = (field: string) => {
    if (policySortField !== field) {
      return <ArrowUpDown className="w-3 h-3 text-slate-400 opacity-60 ml-1 inline" />;
    }
    return policySortDir === 'asc' ? (
      <ArrowUp className="w-3 h-3 text-brandGold-500 ml-1 inline" />
    ) : (
      <ArrowDown className="w-3 h-3 text-brandGold-500 ml-1 inline" />
    );
  };

  const pQuery = policySearch.toLowerCase().trim();
  const filteredPolicies = pQuery
    ? policies.filter((pol) =>
        (pol.name || '').toLowerCase().includes(pQuery) ||
        (pol.description || '').toLowerCase().includes(pQuery) ||
        (pol.framework || '').toLowerCase().includes(pQuery) ||
        (pol.severity || '').toLowerCase().includes(pQuery) ||
        (pol.enforcement || '').toLowerCase().includes(pQuery)
      )
    : policies;

  const sortedPolicies = [...filteredPolicies].sort((a: any, b: any) => {
    let aVal = a[policySortField] ?? '';
    let bVal = b[policySortField] ?? '';
    if (typeof aVal === 'string') aVal = aVal.toLowerCase();
    if (typeof bVal === 'string') bVal = bVal.toLowerCase();
    if (aVal < bVal) return policySortDir === 'asc' ? -1 : 1;
    if (aVal > bVal) return policySortDir === 'asc' ? 1 : -1;
    return 0;
  });

  const paginatedPolicies = sortedPolicies.slice(
    (policyPage - 1) * policyPageSize,
    policyPage * policyPageSize
  );

  const filteredFindings = strixFindings.filter((f) => {
    if (findingSeverityFilter !== 'all' && f.severity !== findingSeverityFilter) return false;
    if (findingStatusFilter !== 'all' && f.status !== findingStatusFilter) return false;
    return true;
  });

  return (
    <div className="space-y-6 font-mono text-xs">
      {/* Header */}
      <div className="bg-white dark:bg-[#0F2038] border border-slate-200 dark:border-slate-800 rounded-2xl p-4 sm:p-5 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <Shield className="w-5 h-5 text-brandGold-500" />
            <h2 className="text-base font-black text-slate-900 dark:text-white uppercase tracking-tight">
              ArvGuard — Compliance & Autonomous Security
            </h2>
            <span className="px-2 py-0.5 text-[10px] font-bold bg-brandGold-500/10 text-brandGold-500 rounded-full border border-brandGold-500/20">v2.1</span>
          </div>
          <p className="text-slate-500 text-[11px] mt-0.5">Continuous Compliance & Strix Autonomous AI Penetration Testing Engine</p>
        </div>
        <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-900 p-1.5 rounded-xl border border-slate-200 dark:border-slate-800 shrink-0 overflow-x-auto">
          {(['overview', 'policies', 'violations', 'frameworks', 'strix'] as const).map((v) => (
            <button
              key={v}
              onClick={() => setActiveView(v)}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer capitalize flex items-center gap-1.5 ${
                activeView === v
                  ? 'bg-brandGold-500 text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              {v === 'strix' ? (
                <>
                  <Bug className="w-3 h-3" />
                  <span>Strix Pen-Test</span>
                </>
              ) : (
                v
              )}
            </button>
          ))}
          <button
            onClick={fetchData}
            disabled={loading}
            className="p-1.5 text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer ml-1"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* VIEW: STRIX AI PEN-TESTING & VULNERABILITY ASSESSMENT */}
      {activeView === 'strix' && (
        <div className="space-y-6">
          {/* Provider Readiness & Engine Health Banner */}
          <div className="bg-white dark:bg-[#0F2038] border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-600 dark:text-purple-400">
                  <Bug className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-tight">
                      Strix Autonomous Penetration Testing Engine
                    </h3>
                    <span className="px-2 py-0.5 text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded border border-slate-200 dark:border-slate-700">
                      {strixStatus?.strix_version || 'v1.7.0'}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Multi-agent red-team orchestration • Validated exploits & working PoCs • Zero hallucinated vulnerabilities
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold border bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800">
                  <span className="text-slate-400 uppercase text-[9px]">Status:</span>
                  {strixStatus?.status === 'CONNECTED' ? (
                    <span className="text-emerald-500 flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                      CONNECTED ({strixStatus.mode.toUpperCase()})
                    </span>
                  ) : (
                    <span className="text-amber-500 flex items-center gap-1">
                      <AlertTriangle className="w-3 h-3 text-amber-500" />
                      AWAITING_PROVIDER_SETUP
                    </span>
                  )}
                </div>

                <button
                  onClick={() => setShowLaunchModal(true)}
                  className="px-3 py-1.5 bg-brandGold-500 hover:bg-brandGold-600 text-white font-bold rounded-xl transition-all shadow-sm flex items-center gap-1.5 cursor-pointer"
                >
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>Launch Pen-Test</span>
                </button>
              </div>
            </div>

            {/* Diagnostics & Setup Guidance */}
            {strixStatus?.status !== 'CONNECTED' && (
              <div className="p-4 bg-amber-500/5 border border-amber-500/20 rounded-xl space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400 font-bold text-xs">
                    <AlertTriangle className="w-4 h-4" />
                    <span>Penetration Testing Engine Setup Required</span>
                  </div>
                  <button
                    onClick={() => setShowDiagnostics(!showDiagnostics)}
                    className="text-[10px] text-amber-600 dark:text-amber-400 underline cursor-pointer"
                  >
                    {showDiagnostics ? 'Hide Diagnostics' : 'View Diagnostics'}
                  </button>
                </div>
                <p className="text-[11px] text-slate-600 dark:text-slate-400">
                  Strix requires either a local Docker sandbox with an LLM key or a managed Strix Cloud API key to execute isolated penetration tests safely.
                </p>

                {showDiagnostics && (
                  <div className="mt-3 pt-3 border-t border-amber-500/20 space-y-2 text-[10px]">
                    <div className="bg-slate-900 text-slate-200 p-3 rounded-lg font-mono space-y-1">
                      {strixStatus?.diagnostics?.map((diag: string, idx: number) => (
                        <div key={idx} className="flex items-start gap-2">
                          <span className="text-slate-500">[{idx + 1}]</span>
                          <span>{diag}</span>
                        </div>
                      ))}
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-2">
                      <div className="p-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg">
                        <span className="font-bold text-slate-900 dark:text-white uppercase">Option 1: Local Docker</span>
                        <p className="text-slate-500 mt-1">{strixStatus?.setup_guide?.self_hosted}</p>
                      </div>
                      <div className="p-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg">
                        <span className="font-bold text-slate-900 dark:text-white uppercase">Option 2: Strix Cloud</span>
                        <p className="text-slate-500 mt-1">{strixStatus?.setup_guide?.cloud}</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Provenance Badge */}
            <div className="flex items-center justify-between pt-2 text-[10px] text-slate-400 border-t border-slate-100 dark:border-slate-800/60">
              <span className="flex items-center gap-1.5">
                <span className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 font-bold text-slate-500">PROVENANCE</span>
                <span>source: <strong>{strixStatus?.state_source || 'strix-agent'}</strong></span>
                <span>• observed_at: {strixStatus?.observed_at ? new Date(strixStatus.observed_at).toLocaleTimeString() : 'now'}</span>
              </span>
              <button onClick={fetchData} className="hover:text-slate-200 underline cursor-pointer">
                Re-check Provider State
              </button>
            </div>
          </div>

          {/* Strix KPIs */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="bg-white dark:bg-[#0F2038] border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-sm">
              <span className="text-slate-500 text-[10px] uppercase tracking-wider font-bold">Total Scans Executed</span>
              <p className="text-xl font-black text-slate-900 dark:text-white mt-2">{strixScans.length}</p>
            </div>
            <div className="bg-white dark:bg-[#0F2038] border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-sm">
              <span className="text-slate-500 text-[10px] uppercase tracking-wider font-bold">Active Pentest Runs</span>
              <p className="text-xl font-black text-blue-500 mt-2">
                {strixScans.filter((s) => s.status === 'RUNNING' || s.status === 'QUEUED').length}
              </p>
            </div>
            <div className="bg-white dark:bg-[#0F2038] border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-sm">
              <span className="text-slate-500 text-[10px] uppercase tracking-wider font-bold">Validated Vulnerabilities</span>
              <p className="text-xl font-black text-red-500 mt-2">
                {strixFindings.filter((f) => f.status === 'open').length}
              </p>
            </div>
            <div className="bg-white dark:bg-[#0F2038] border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-sm">
              <span className="text-slate-500 text-[10px] uppercase tracking-wider font-bold">Remediated Flaws</span>
              <p className="text-xl font-black text-emerald-500 mt-2">
                {strixFindings.filter((f) => f.status === 'resolved').length}
              </p>
            </div>
          </div>

          {/* Historical Scans Table */}
          <div className="bg-white dark:bg-[#0F2038] border border-slate-200 dark:border-slate-800 rounded-2xl p-4 sm:p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Terminal className="w-4 h-4 text-brandGold-500" />
                <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                  Penetration Test Runs
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                  {strixScans.length}
                </span>
              </div>
            </div>

            {strixScans.length === 0 ? (
              <div className="py-12 text-center text-slate-500 space-y-3">
                <Shield className="w-8 h-8 text-slate-400 mx-auto opacity-50" />
                <p className="text-xs">No penetration test runs recorded yet.</p>
                <button
                  onClick={() => setShowLaunchModal(true)}
                  className="px-4 py-2 bg-brandGold-500 hover:bg-brandGold-600 text-white font-bold rounded-xl text-xs transition-colors cursor-pointer"
                >
                  Launch First Strix Assessment
                </button>
              </div>
            ) : (
              <div className="overflow-x-auto min-w-full">
                <table className="w-full min-w-[700px] text-left">
                  <thead>
                    <tr className="border-b border-slate-200 dark:border-slate-800 text-[10px] text-slate-500 uppercase font-bold">
                      <th className="pb-2.5">Scan ID</th>
                      <th className="pb-2.5">Target</th>
                      <th className="pb-2.5">Mode</th>
                      <th className="pb-2.5">Status</th>
                      <th className="pb-2.5">Started</th>
                      <th className="pb-2.5">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {strixScans.map((scan) => (
                      <tr key={scan.id} className="border-b border-slate-100 dark:border-slate-800/50 hover:bg-slate-50 dark:hover:bg-slate-900/30">
                        <td className="py-3 pr-3 font-mono font-bold text-slate-900 dark:text-white">
                          {scan.id}
                        </td>
                        <td className="py-3 pr-3 max-w-xs truncate text-brandGold-500 font-bold">
                          {scan.target}
                        </td>
                        <td className="py-3 pr-3 uppercase text-[10px]">
                          <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-bold">
                            {scan.scan_mode}
                          </span>
                        </td>
                        <td className="py-3 pr-3">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${
                              scan.status === 'SUCCEEDED'
                                ? 'bg-emerald-500/10 text-emerald-500'
                                : scan.status === 'RUNNING'
                                ? 'bg-blue-500/10 text-blue-500 animate-pulse'
                                : scan.status === 'AWAITING_PROVIDER_SETUP'
                                ? 'bg-amber-500/10 text-amber-500'
                                : 'bg-red-500/10 text-red-500'
                            }`}
                          >
                            {scan.status}
                          </span>
                        </td>
                        <td className="py-3 pr-3 text-[10px] text-slate-500">
                          {scan.started_at ? new Date(scan.started_at).toLocaleString() : 'N/A'}
                        </td>
                        <td className="py-3">
                          <button
                            onClick={() => setSelectedScan(scan)}
                            className="px-2.5 py-1 text-[10px] font-bold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg transition-colors cursor-pointer"
                          >
                            Inspect Logs & Findings
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Validated Findings & Exploit PoCs Section */}
          <div className="bg-white dark:bg-[#0F2038] border border-slate-200 dark:border-slate-800 rounded-2xl p-4 sm:p-5 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Bug className="w-4 h-4 text-red-500" />
                <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                  Validated Findings with Proof-of-Concepts (PoCs)
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-500/10 text-red-500 border border-red-500/20">
                  {filteredFindings.length}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <select
                  value={findingSeverityFilter}
                  onChange={(e) => setFindingSeverityFilter(e.target.value)}
                  className="px-2 py-1 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-700 dark:text-slate-300 text-[11px]"
                >
                  <option value="all">All Severities</option>
                  <option value="critical">Critical</option>
                  <option value="high">High</option>
                  <option value="medium">Medium</option>
                  <option value="low">Low</option>
                </select>
                <select
                  value={findingStatusFilter}
                  onChange={(e) => setFindingStatusFilter(e.target.value)}
                  className="px-2 py-1 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-700 dark:text-slate-300 text-[11px]"
                >
                  <option value="all">All Statuses</option>
                  <option value="open">Open</option>
                  <option value="resolved">Resolved</option>
                </select>
              </div>
            </div>

            {filteredFindings.length === 0 ? (
              <div className="py-12 text-center text-slate-400 font-sans text-xs">
                {strixFindings.length === 0
                  ? 'No validated security vulnerabilities detected.'
                  : 'No findings match the selected severity and status filters.'}
              </div>
            ) : (
              <div className="space-y-4">
                {filteredFindings.map((finding) => (
                  <div
                    key={finding.id}
                    className="p-4 bg-slate-50 dark:bg-slate-900/60 rounded-xl border border-slate-200 dark:border-slate-800 space-y-3"
                  >
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span
                          className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase ${
                            finding.severity === 'critical'
                              ? 'bg-red-500 text-white'
                              : finding.severity === 'high'
                              ? 'bg-orange-500 text-white'
                              : finding.severity === 'medium'
                              ? 'bg-amber-500 text-white'
                              : 'bg-blue-500 text-white'
                          }`}
                        >
                          {finding.severity}
                        </span>
                        {finding.cvss_score && (
                          <span className="px-2 py-0.5 rounded bg-slate-200 dark:bg-slate-800 text-[10px] font-bold text-slate-700 dark:text-slate-300">
                            CVSS {finding.cvss_score}
                          </span>
                        )}
                        {finding.owasp_category && (
                          <span className="px-2 py-0.5 rounded bg-purple-500/10 text-purple-600 dark:text-purple-400 text-[10px] font-bold border border-purple-500/20">
                            {finding.owasp_category}
                          </span>
                        )}
                        <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                          {finding.title}
                        </h4>
                      </div>

                      <div className="flex items-center gap-2">
                        {finding.status === 'open' ? (
                          <button
                            onClick={() => handleResolveFinding(finding.id)}
                            className="px-2.5 py-1 text-[10px] font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors cursor-pointer"
                          >
                            Mark Resolved
                          </button>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                            RESOLVED
                          </span>
                        )}
                      </div>
                    </div>

                    <p className="text-[11px] text-slate-600 dark:text-slate-400">
                      {finding.description}
                    </p>

                    {finding.affected_endpoint && (
                      <div className="text-[10px] text-slate-500 flex items-center gap-1.5">
                        <span className="font-bold text-slate-400 uppercase">Endpoint:</span>
                        <code className="text-brandGold-500 bg-brandGold-500/5 px-1 py-0.5 rounded border border-brandGold-500/20">
                          {finding.affected_endpoint}
                        </code>
                      </div>
                    )}

                    {/* Proof of Concept (Working Exploit) */}
                    {finding.proof_of_concept && (
                      <div className="p-3 bg-slate-900 rounded-lg border border-slate-800 space-y-1.5">
                        <div className="flex items-center justify-between text-slate-400 text-[10px]">
                          <span className="font-bold flex items-center gap-1 text-red-400">
                            <Terminal className="w-3 h-3" /> Proof-of-Concept Exploit (Reproduction)
                          </span>
                          <button
                            onClick={() => handleCopyPoc(finding.id, finding.proof_of_concept)}
                            className="hover:text-white flex items-center gap-1 cursor-pointer"
                          >
                            {copiedPocId === finding.id ? (
                              <Check className="w-3 h-3 text-emerald-400" />
                            ) : (
                              <Copy className="w-3 h-3" />
                            )}
                            <span>{copiedPocId === finding.id ? 'Copied' : 'Copy Payload'}</span>
                          </button>
                        </div>
                        <pre className="text-[10px] text-slate-200 overflow-x-auto whitespace-pre-wrap font-mono">
                          {finding.proof_of_concept}
                        </pre>
                      </div>
                    )}

                    {/* AI Remediation Patch */}
                    {finding.remediation_patch && (
                      <div className="p-3 bg-emerald-500/5 border border-emerald-500/20 rounded-lg space-y-1">
                        <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                          <Code className="w-3 h-3" /> Suggested Remediation Patch
                        </span>
                        <p className="text-[11px] text-slate-700 dark:text-slate-300 whitespace-pre-wrap">
                          {finding.remediation_patch}
                        </p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* MODAL: LAUNCH NEW STRIX PENETRATION TEST */}
      {showLaunchModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white dark:bg-[#0F2038] border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-lg p-5 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Bug className="w-4 h-4 text-brandGold-500" />
                <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-tight">
                  Launch Strix Autonomous Pen-Test
                </h3>
              </div>
              <button
                onClick={() => setShowLaunchModal(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleLaunchScan} className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                  Target (URL, API Host, or Git Repository)
                </label>
                <input
                  type="text"
                  required
                  value={targetInput}
                  onChange={(e) => setTargetInput(e.target.value)}
                  placeholder="https://api.example.com or http://localhost:8000"
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-white font-mono focus:outline-none focus:border-brandGold-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Target Type</label>
                  <select
                    value={targetType}
                    onChange={(e) => setTargetType(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-white font-mono focus:outline-none focus:border-brandGold-500"
                  >
                    <option value="web_app">Web Application (Black-box)</option>
                    <option value="api">REST API / OpenAPI</option>
                    <option value="codebase">Code Repository (White-box)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Scan Mode</label>
                  <select
                    value={scanMode}
                    onChange={(e) => setScanMode(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-white font-mono focus:outline-none focus:border-brandGold-500"
                  >
                    <option value="quick">Quick (Rapid recon & OWASP)</option>
                    <option value="standard">Standard (~30 min deep)</option>
                    <option value="deep">Deep (Comprehensive red team)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                  Custom Testing Instructions & Scope (Optional)
                </label>
                <textarea
                  rows={2}
                  value={instruction}
                  onChange={(e) => setInstruction(e.target.value)}
                  placeholder="e.g. Focus on IDOR, authentication bypass, and SQL injection in /api/v1/billing"
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-white font-mono focus:outline-none focus:border-brandGold-500"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                  Budget Cap ($ USD, Optional)
                </label>
                <input
                  type="number"
                  value={budget}
                  onChange={(e) => setBudget(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-white font-mono focus:outline-none focus:border-brandGold-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowLaunchModal(false)}
                  className="px-3 py-1.5 text-slate-500 hover:text-slate-800 dark:hover:text-white text-xs font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isLaunchingScan}
                  className="px-4 py-2 bg-brandGold-500 hover:bg-brandGold-600 text-white text-xs font-bold rounded-xl transition-all shadow-sm flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  {isLaunchingScan ? (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Play className="w-3.5 h-3.5 fill-current" />
                  )}
                  <span>{isLaunchingScan ? 'Dispatching...' : 'Dispatch Scan'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: RUN DETAILS & TERMINAL LOG VIEWER */}
      {selectedScan && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white dark:bg-[#0F2038] border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-3xl p-5 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div>
                <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-tight">
                  Strix Scan Details — {selectedScan.id}
                </h3>
                <p className="text-[10px] text-slate-500">Target: {selectedScan.target} • Mode: {selectedScan.scan_mode}</p>
              </div>
              <button
                onClick={() => setSelectedScan(null)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold text-slate-500 uppercase">Status:</span>
                <span className="px-2 py-0.5 rounded font-bold text-[10px] bg-slate-100 dark:bg-slate-800 text-brandGold-500">
                  {selectedScan.status}
                </span>
                {selectedScan.job_id && (
                  <span className="text-[10px] text-slate-400">
                    (Job ID: {selectedScan.job_id})
                  </span>
                )}
              </div>

              {selectedScan.error_message && (
                <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-500 text-xs">
                  {selectedScan.error_message}
                </div>
              )}

              <div>
                <span className="text-[10px] font-bold text-slate-500 uppercase block mb-1">
                  Runner Execution Log:
                </span>
                <div className="bg-slate-950 text-slate-200 p-3 rounded-xl font-mono text-[10px] max-h-72 overflow-y-auto whitespace-pre-wrap border border-slate-800">
                  {selectedScan.raw_logs || 'No execution logs recorded.'}
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-2 border-t border-slate-100 dark:border-slate-800">
              <button
                onClick={() => setSelectedScan(null)}
                className="px-4 py-1.5 bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-white font-bold text-xs rounded-xl hover:bg-slate-200 cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DEFAULT VIEW: SCORE + KPIS + POLICIES + VIOLATIONS */}
      {activeView !== 'strix' && (
        <>
          {/* Score + KPIs */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="bg-white dark:bg-[#0F2038] border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-sm col-span-2 lg:col-span-1">
              <span className="text-slate-500 text-[10px] uppercase tracking-wider font-bold">Compliance Score</span>
              <div className="flex items-center gap-3 mt-2">
                <div className={`text-3xl font-black text-${scoreColor}-500`}>{overallScore}</div>
                <div className="text-[10px] text-slate-500">/100</div>
              </div>
              <div className="mt-2 h-1.5 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                <div className={`h-full bg-${scoreColor}-500 rounded-full transition-all`} style={{ width: `${overallScore}%` }} />
              </div>
            </div>
            {[
              { label: 'Active Policies', value: policies.filter(p => p.is_active).length, icon: ShieldCheck, color: 'blue' },
              { label: 'Open Violations', value: openViolations, icon: ShieldAlert, color: 'red' },
              { label: 'Frameworks', value: frameworks.length, icon: FileText, color: 'purple' },
            ].map((kpi) => (
              <div key={kpi.label} className="bg-white dark:bg-[#0F2038] border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-sm">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-slate-500 text-[10px] uppercase tracking-wider font-bold">{kpi.label}</span>
                  <kpi.icon className={`w-4 h-4 text-${kpi.color}-500`} />
                </div>
                <p className="text-xl font-black text-slate-900 dark:text-white">{kpi.value}</p>
              </div>
            ))}
          </div>

          {/* Framework Scores */}
          {score?.frameworks && (
            <div className="bg-white dark:bg-[#0F2038] border border-slate-200 dark:border-slate-800 rounded-2xl p-4 sm:p-5 shadow-sm">
              <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider mb-4">Framework Compliance Scores</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
                {(Array.isArray(score.frameworks) ? score.frameworks : []).map((fw: any) => {
                  const fwColor = fw.score >= 80 ? 'emerald' : fw.score >= 60 ? 'amber' : 'red';
                  return (
                    <div key={fw.framework} className="p-3 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-200 dark:border-slate-800 text-center">
                      <p className="text-[10px] font-bold text-brandGold-500 uppercase">{fw.framework}</p>
                      <p className={`text-2xl font-black text-${fwColor}-500 mt-1`}>{fw.score}</p>
                      <p className="text-[9px] text-slate-500 mt-1">{fw.passed}/{fw.total_policies} passed</p>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Policies Table */}
          {activeView === 'policies' && policies.length > 0 && (
            <div className="bg-white dark:bg-[#0F2038] border border-slate-200 dark:border-slate-800 rounded-2xl p-4 sm:p-5 shadow-sm space-y-4">
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">Active Compliance Policies</h3>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-50 dark:bg-purple-500/20 text-purple-700 dark:text-purple-400 border border-purple-200 dark:border-purple-500/30">
                    {filteredPolicies.length}
                  </span>
                </div>

                <div className="relative w-full sm:w-64">
                  <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                  <input
                    type="text"
                    placeholder="Search policies..."
                    value={policySearch}
                    onChange={(e) => {
                      setPolicySearch(e.target.value);
                      setPolicyPage(1);
                    }}
                    className="w-full pl-8 pr-7 py-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-mono text-slate-900 dark:text-white focus:outline-none focus:border-brandGold-500"
                  />
                  {policySearch && (
                    <button
                      type="button"
                      onClick={() => {
                        setPolicySearch('');
                        setPolicyPage(1);
                      }}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>

              <div className="space-y-3">
                <div className="overflow-x-auto min-w-full">
                  <table className="w-full min-w-[700px] text-left">
                    <thead>
                      <tr className="border-b border-slate-200 dark:border-slate-800 select-none">
                        <th className="pb-2.5 text-[10px] text-slate-500 uppercase font-bold cursor-pointer hover:text-slate-200" onClick={() => handlePolicySort('name')}>
                          Policy {renderPolicySortIcon('name')}
                        </th>
                        <th className="pb-2.5 text-[10px] text-slate-500 uppercase font-bold cursor-pointer hover:text-slate-200" onClick={() => handlePolicySort('framework')}>
                          Framework {renderPolicySortIcon('framework')}
                        </th>
                        <th className="pb-2.5 text-[10px] text-slate-500 uppercase font-bold cursor-pointer hover:text-slate-200" onClick={() => handlePolicySort('severity')}>
                          Severity {renderPolicySortIcon('severity')}
                        </th>
                        <th className="pb-2.5 text-[10px] text-slate-500 uppercase font-bold cursor-pointer hover:text-slate-200" onClick={() => handlePolicySort('enforcement')}>
                          Enforcement {renderPolicySortIcon('enforcement')}
                        </th>
                        <th className="pb-2.5 text-[10px] text-slate-500 uppercase font-bold cursor-pointer hover:text-slate-200" onClick={() => handlePolicySort('is_active')}>
                          Status {renderPolicySortIcon('is_active')}
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {paginatedPolicies.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="py-8 text-center text-slate-400 font-sans text-xs">
                            No compliance policies match your search
                          </td>
                        </tr>
                      ) : (
                        paginatedPolicies.map((pol) => (
                          <tr key={pol.id} className="border-b border-slate-100 dark:border-slate-800/50 hover:bg-slate-50 dark:hover:bg-slate-900/30">
                            <td className="py-2.5 pr-3">
                              <p className="text-xs font-bold text-slate-900 dark:text-white">{pol.name}</p>
                              <p className="text-[10px] text-slate-500 mt-0.5 max-w-xs truncate">{pol.description}</p>
                            </td>
                            <td className="py-2.5 pr-3"><span className="px-2 py-0.5 text-[9px] font-bold bg-purple-500/10 text-purple-500 rounded-full">{pol.framework}</span></td>
                            <td className="py-2.5 pr-3"><span className={`px-2 py-0.5 text-[9px] font-bold rounded-full ${
                              pol.severity === 'critical' ? 'bg-red-500/10 text-red-500' :
                              pol.severity === 'high' ? 'bg-orange-500/10 text-orange-500' :
                              pol.severity === 'medium' ? 'bg-amber-500/10 text-amber-500' : 'bg-blue-500/10 text-blue-500'
                            }`}>{pol.severity}</span></td>
                            <td className="py-2.5 pr-3"><span className="text-[10px] text-slate-400">{pol.enforcement}</span></td>
                            <td className="py-2.5">{pol.is_active ? <CheckCircle2 className="w-4 h-4 text-emerald-500" /> : <XCircle className="w-4 h-4 text-slate-400" />}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>

                <DataTablePagination
                  currentPage={policyPage}
                  totalItems={sortedPolicies.length}
                  pageSize={policyPageSize}
                  onPageChange={setPolicyPage}
                  onPageSizeChange={(sz) => {
                    setPolicyPageSize(sz);
                    setPolicyPage(1);
                  }}
                  pageSizeOptions={[5, 10, 20]}
                />
              </div>
            </div>
          )}

          {/* Violations */}
          {violations.length > 0 && activeView !== 'policies' && activeView !== 'frameworks' && (
            <div className="bg-white dark:bg-[#0F2038] border border-slate-200 dark:border-slate-800 rounded-2xl p-4 sm:p-5 shadow-sm">
              <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider mb-4 flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-red-500" /> Open Violations
              </h3>
              <div className="space-y-2">
                {violations.filter(v => v.status === 'open').map((viol) => (
                  <div key={viol.id} className="p-3 bg-red-500/5 rounded-xl border border-red-500/20 flex items-center justify-between">
                    <div>
                      <p className="text-xs font-bold text-slate-900 dark:text-white">{viol.description}</p>
                      <p className="text-[10px] text-slate-500 mt-0.5">Resource: {viol.resource_id} • Type: {viol.resource_type}</p>
                    </div>
                    <button className="px-3 py-1 text-[10px] font-bold bg-brandGold-500 text-white rounded-lg hover:bg-brandGold-600 transition-colors cursor-pointer">Remediate</button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {loading && (
        <div className="text-center py-12 text-slate-500">
          <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2" />
          <p className="text-xs">Loading security & compliance data...</p>
        </div>
      )}
    </div>
  );
};
