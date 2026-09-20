import React, { useState, useEffect, useCallback } from 'react';
import {
  Shield, ShieldCheck, ShieldAlert, CheckCircle2,
  RefreshCw, FileText, XCircle, Search, X, ArrowUpDown, ArrowUp, ArrowDown
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
  const [activeView, setActiveView] = useState<'overview' | 'policies' | 'violations' | 'frameworks'>('overview');

  // Policies table searching, sorting & pagination
  const [policySearch, setPolicySearch] = useState('');
  const [policySortField, setPolicySortField] = useState<string>('name');
  const [policySortDir, setPolicySortDir] = useState<'asc' | 'desc'>('asc');
  const [policyPage, setPolicyPage] = useState<number>(1);
  const [policyPageSize, setPolicyPageSize] = useState<number>(10);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [s, p, v, f] = await Promise.all([
        apiFetch<any>('/api/v1/guard/score', { token }).catch(() => null),
        apiFetch<any[]>('/api/v1/guard/policies', { token }).catch(() => []),
        apiFetch<any[]>('/api/v1/guard/violations', { token }).catch(() => []),
        apiFetch<any[]>('/api/v1/guard/frameworks', { token }).catch(() => []),
      ]);
      if (s) setScore(s);
      if (Array.isArray(p)) setPolicies(p);
      if (Array.isArray(v)) setViolations(v);
      if (Array.isArray(f)) setFrameworks(f);
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

  return (
    <div className="space-y-6 font-mono text-xs">
      {/* Header */}
      <div className="bg-white dark:bg-[#0F2038] border border-slate-200 dark:border-slate-800 rounded-2xl p-4 sm:p-5 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <Shield className="w-5 h-5 text-brandGold-500" />
            <h2 className="text-base font-black text-slate-900 dark:text-white uppercase tracking-tight">
              ArvGuard — Compliance-as-Infrastructure
            </h2>
            <span className="px-2 py-0.5 text-[10px] font-bold bg-brandGold-500/10 text-brandGold-500 rounded-full border border-brandGold-500/20">v2.0</span>
          </div>
          <p className="text-slate-500 text-[11px] mt-0.5">India-first regulatory compliance engine — RBI, SEBI, DPDP Act, IRDAI</p>
        </div>
        <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-900 p-1.5 rounded-xl border border-slate-200 dark:border-slate-800 shrink-0">
          {(['overview', 'policies', 'violations', 'frameworks'] as const).map((v) => (
            <button key={v} onClick={() => setActiveView(v)}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer capitalize ${
                activeView === v ? 'bg-brandGold-500 text-white shadow-sm' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}>{v}</button>
          ))}
          <button onClick={fetchData} disabled={loading} className="p-1.5 text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer ml-1">
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

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

      {loading && (
        <div className="text-center py-12 text-slate-500">
          <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2" />
          <p className="text-xs">Loading compliance data...</p>
        </div>
      )}
    </div>
  );
};
