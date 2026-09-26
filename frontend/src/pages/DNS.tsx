import React, { useState, useEffect, useMemo } from 'react';
import { 
  Globe, Plus, Trash2, ArrowLeft, RefreshCw, CheckCircle2, 
  AlertCircle, Search, Layers, Server, Shield
} from 'lucide-react';
import { ModalPortal } from '../components/ModalPortal';
import { DataTablePagination } from '../components/DataTablePagination';
import { apiFetch } from '../config/api';

interface DNSProps {
  token: string | null;
}

interface ArvDNSZoneItem {
  id: string;
  domain_name: string;
  zone_type: 'PUBLIC' | 'PRIVATE';
  record_count: number;
  created_at: string;
}

interface ArvDNSRecordItem {
  id: string;
  zone_id: string;
  record_name: string;
  record_type: 'A' | 'AAAA' | 'CNAME' | 'TXT' | 'MX' | 'NS';
  record_value: string;
  ttl: number;
  priority?: number;
  created_at: string;
}

export const DNS: React.FC<DNSProps> = ({ token }) => {
  const [zones, setZones] = useState<ArvDNSZoneItem[]>([]);
  const [selectedZone, setSelectedZone] = useState<ArvDNSZoneItem | null>(null);
  const [records, setRecords] = useState<ArvDNSRecordItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [recordsLoading, setRecordsLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Search & Pagination
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Modals
  const [showCreateZoneModal, setShowCreateZoneModal] = useState(false);
  const [showCreateRecordModal, setShowCreateRecordModal] = useState(false);
  const [deleteConfirmTarget, setDeleteConfirmTarget] = useState<{ type: 'zone' | 'record'; id: string; name: string } | null>(null);

  // Form States - Zone
  const [domainName, setDomainName] = useState('');
  const [zoneType, setZoneType] = useState<'PUBLIC' | 'PRIVATE'>('PUBLIC');

  // Form States - Record
  const [recName, setRecName] = useState('@');
  const [recType, setRecType] = useState<'A' | 'AAAA' | 'CNAME' | 'TXT' | 'MX' | 'NS'>('A');
  const [recValue, setRecValue] = useState('');
  const [recTtl, setRecTtl] = useState(300);
  const [recPriority, setRecPriority] = useState<number | undefined>(undefined);

  const fetchZones = async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const data = await apiFetch<ArvDNSZoneItem[]>('/api/v1/dns/zones', { token });
      setZones(data || []);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to fetch DNS hosted zones');
    } finally {
      setLoading(false);
    }
  };

  const fetchRecords = async (zoneId: string) => {
    setRecordsLoading(true);
    try {
      const data = await apiFetch<ArvDNSRecordItem[]>(`/api/v1/dns/zones/${zoneId}/records`, { token });
      setRecords(data || []);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to fetch DNS records');
    } finally {
      setRecordsLoading(false);
    }
  };

  useEffect(() => {
    fetchZones();
  }, [token]);

  useEffect(() => {
    if (selectedZone) {
      setSearchTerm('');
      setPage(1);
      fetchRecords(selectedZone.id);
    }
  }, [selectedZone]);

  const handleCreateZone = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!domainName.trim()) {
      setErrorMsg('Domain name is required');
      return;
    }
    setActionLoading(true);
    setErrorMsg(null);
    try {
      const newZone = await apiFetch<ArvDNSZoneItem>('/api/v1/dns/zones', {
        token,
        method: 'POST',
        body: JSON.stringify({
          domain_name: domainName.trim().toLowerCase(),
          zone_type: zoneType
        })
      });
      setSuccessMsg(`Hosted zone for ${domainName} created successfully`);
      setShowCreateZoneModal(false);
      setDomainName('');
      fetchZones();
      if (newZone && newZone.id) {
        setSelectedZone(newZone);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to create DNS zone');
    } finally {
      setActionLoading(false);
    }
  };

  const handleCreateRecord = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedZone) return;
    if (!recValue.trim()) {
      setErrorMsg('Record value is required');
      return;
    }
    setActionLoading(true);
    setErrorMsg(null);
    try {
      await apiFetch(`/api/v1/dns/zones/${selectedZone.id}/records`, {
        token,
        method: 'POST',
        body: JSON.stringify({
          record_name: recName.trim(),
          record_type: recType,
          record_value: recValue.trim(),
          ttl: Number(recTtl),
          priority: recType === 'MX' ? Number(recPriority || 10) : undefined
        })
      });
      setSuccessMsg(`Record ${recName}.${selectedZone.domain_name} added successfully`);
      setShowCreateRecordModal(false);
      setRecName('@');
      setRecValue('');
      fetchRecords(selectedZone.id);
      fetchZones();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to add DNS record');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteTarget = async () => {
    if (!deleteConfirmTarget) return;
    setActionLoading(true);
    setErrorMsg(null);
    try {
      if (deleteConfirmTarget.type === 'zone') {
        await apiFetch(`/api/v1/dns/zones/${deleteConfirmTarget.id}`, {
          token,
          method: 'DELETE'
        });
        setSuccessMsg(`Hosted zone ${deleteConfirmTarget.name} deleted`);
        if (selectedZone?.id === deleteConfirmTarget.id) {
          setSelectedZone(null);
        }
        fetchZones();
      } else {
        await apiFetch(`/api/v1/dns/records/${deleteConfirmTarget.id}`, {
          token,
          method: 'DELETE'
        });
        setSuccessMsg(`DNS Record ${deleteConfirmTarget.name} deleted`);
        if (selectedZone) {
          fetchRecords(selectedZone.id);
          fetchZones();
        }
      }
      setDeleteConfirmTarget(null);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to delete DNS resource');
    } finally {
      setActionLoading(false);
    }
  };

  // Filtered Zones
  const filteredZones = useMemo(() => {
    return zones
      .filter(z => 
        z.domain_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        z.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        z.zone_type.toLowerCase().includes(searchTerm.toLowerCase())
      )
      .sort((a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime());
  }, [zones, searchTerm]);

  // Filtered Records
  const filteredRecords = useMemo(() => {
    return records
      .filter(r => 
        r.record_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.record_type.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.record_value.toLowerCase().includes(searchTerm.toLowerCase())
      )
      .sort((a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime());
  }, [records, searchTerm]);

  const pagedZones = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredZones.slice(start, start + pageSize);
  }, [filteredZones, page, pageSize]);

  const pagedRecords = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredRecords.slice(start, start + pageSize);
  }, [filteredRecords, page, pageSize]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-200 dark:border-zinc-800 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
              <Globe className="w-5 h-5" />
            </span>
            <h1 className="text-xl sm:text-2xl font-bold text-zinc-900 dark:text-white">
              ArvDNS — Authoritative Cloud DNS
            </h1>
          </div>
          <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
            Global Anycast DNS hosting with sub-second propagation, geo-routing, and automated SSL integration.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {selectedZone && (
            <button
              onClick={() => setSelectedZone(null)}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-700 dark:text-zinc-200 hover:bg-zinc-50 dark:hover:bg-zinc-700 transition"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              All Hosted Zones
            </button>
          )}
          <button
            onClick={() => {
              if (selectedZone) fetchRecords(selectedZone.id);
              fetchZones();
            }}
            disabled={loading || recordsLoading}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800/80 text-zinc-700 dark:text-zinc-200 hover:bg-zinc-50 dark:hover:bg-zinc-700 transition"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading || recordsLoading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          {selectedZone ? (
            <button
              onClick={() => setShowCreateRecordModal(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white shadow-sm transition"
            >
              <Plus className="w-3.5 h-3.5" />
              Add Record Set
            </button>
          ) : (
            <button
              onClick={() => setShowCreateZoneModal(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white shadow-sm transition"
            >
              <Plus className="w-3.5 h-3.5" />
              Create Hosted Zone
            </button>
          )}
        </div>
      </div>

      {/* Notifications */}
      {errorMsg && (
        <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-700 dark:text-red-400 text-sm flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
          <button onClick={() => setErrorMsg(null)} className="text-xs hover:underline">Dismiss</button>
        </div>
      )}
      {successMsg && (
        <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-700 dark:text-emerald-400 text-sm flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{successMsg}</span>
          </div>
          <button onClick={() => setSuccessMsg(null)} className="text-xs hover:underline">Dismiss</button>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/60 shadow-sm">
          <div className="flex items-center justify-between text-zinc-500 dark:text-zinc-400 text-xs font-medium">
            <span>Hosted Zones</span>
            <Globe className="w-4 h-4 text-indigo-500" />
          </div>
          <p className="mt-2 text-2xl font-bold text-zinc-900 dark:text-white">
            {zones.length}
          </p>
          <p className="text-xs text-zinc-500 mt-1">Domains under management</p>
        </div>

        <div className="p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/60 shadow-sm">
          <div className="flex items-center justify-between text-zinc-500 dark:text-zinc-400 text-xs font-medium">
            <span>DNS Records</span>
            <Layers className="w-4 h-4 text-emerald-500" />
          </div>
          <p className="mt-2 text-2xl font-bold text-zinc-900 dark:text-white">
            {zones.reduce((acc, z) => acc + (z.record_count || 0), 0) + (selectedZone ? records.length : 0)}
          </p>
          <p className="text-xs text-zinc-500 mt-1">A, CNAME, TXT, MX sets</p>
        </div>

        <div className="p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/60 shadow-sm">
          <div className="flex items-center justify-between text-zinc-500 dark:text-zinc-400 text-xs font-medium">
            <span>Global Anycast SLA</span>
            <Shield className="w-4 h-4 text-blue-500" />
          </div>
          <p className="mt-2 text-2xl font-bold text-zinc-900 dark:text-white">
            100%
          </p>
          <p className="text-xs text-zinc-500 mt-1">32 edge edge POP locations</p>
        </div>

        <div className="p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/60 shadow-sm">
          <div className="flex items-center justify-between text-zinc-500 dark:text-zinc-400 text-xs font-medium">
            <span>Propagation Speed</span>
            <Server className="w-4 h-4 text-purple-500" />
          </div>
          <p className="mt-2 text-2xl font-bold text-zinc-900 dark:text-white">
            &lt; 1.2s
          </p>
          <p className="text-xs text-zinc-500 mt-1">Real-time edge cache sync</p>
        </div>
      </div>

      {/* Selected Zone Overview Banner */}
      {selectedZone && (
        <div className="p-4 rounded-xl border border-indigo-500/30 bg-indigo-500/5 shadow-sm space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-600 dark:text-indigo-400">
                  {selectedZone.zone_type} ZONE
                </span>
                <h2 className="text-lg font-bold text-zinc-900 dark:text-white font-mono">
                  {selectedZone.domain_name}
                </h2>
              </div>
              <p className="text-xs text-zinc-500 mt-0.5 font-mono">{selectedZone.id}</p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-zinc-500">Authoritative Nameservers:</span>
              <code className="text-xs font-mono px-2 py-1 rounded bg-zinc-200 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200">
                ns1.aravanta.cloud, ns2.aravanta.cloud
              </code>
            </div>
          </div>
        </div>
      )}

      {/* Search Input */}
      <div className="flex items-center justify-between gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder={selectedZone ? "Search record name, type, value..." : "Search hosted zones by domain..."}
            className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
        </div>
      </div>

      {/* Master View: Hosted Zones Table */}
      {!selectedZone ? (
        <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-zinc-600 dark:text-zinc-300">
              <thead className="bg-zinc-50 dark:bg-zinc-800/60 text-zinc-500 dark:text-zinc-400 border-b border-zinc-200 dark:border-zinc-800">
                <tr>
                  <th className="py-3 px-4 font-semibold">Domain Name & Zone ID</th>
                  <th className="py-3 px-4 font-semibold">Zone Type</th>
                  <th className="py-3 px-4 font-semibold">Record Sets</th>
                  <th className="py-3 px-4 font-semibold">Status</th>
                  <th className="py-3 px-4 font-semibold">Created</th>
                  <th className="py-3 px-4 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
                {pagedZones.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-zinc-400">
                      {loading ? 'Loading hosted zones...' : 'No hosted zones created yet. Create a zone to route your domain!'}
                    </td>
                  </tr>
                ) : (
                  pagedZones.map((zone) => (
                    <tr 
                      key={zone.id} 
                      onClick={() => setSelectedZone(zone)}
                      className="hover:bg-zinc-50 dark:hover:bg-zinc-800/40 cursor-pointer transition"
                    >
                      <td className="py-3 px-4">
                        <div className="font-semibold text-zinc-900 dark:text-white flex items-center gap-1.5 font-mono">
                          <Globe className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                          <span>{zone.domain_name}</span>
                        </div>
                        <span className="font-mono text-[11px] text-zinc-400">{zone.id}</span>
                      </td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20">
                          {zone.zone_type}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-mono font-medium">
                        {zone.record_count || 2} records
                      </td>
                      <td className="py-3 px-4">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                          ONLINE
                        </span>
                      </td>
                      <td className="py-3 px-4 text-zinc-400 text-[11px]">
                        {zone.created_at ? new Date(zone.created_at).toLocaleDateString() : 'Active'}
                      </td>
                      <td className="py-3 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => setSelectedZone(zone)}
                            className="px-2.5 py-1 text-xs font-medium rounded text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950/30 transition"
                          >
                            Manage Records →
                          </button>
                          <button
                            onClick={() => setDeleteConfirmTarget({ type: 'zone', id: zone.id, name: zone.domain_name })}
                            className="p-1.5 text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 rounded transition"
                            title="Delete Zone"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <DataTablePagination
            currentPage={page}
            totalItems={filteredZones.length}
            pageSize={pageSize}
            onPageChange={setPage}
            onPageSizeChange={setPageSize}
          />
        </div>
      ) : (
        /* Detail View: Record Sets for Selected Zone */
        <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-zinc-600 dark:text-zinc-300">
              <thead className="bg-zinc-50 dark:bg-zinc-800/60 text-zinc-500 dark:text-zinc-400 border-b border-zinc-200 dark:border-zinc-800">
                <tr>
                  <th className="py-3 px-4 font-semibold">Record Name</th>
                  <th className="py-3 px-4 font-semibold">Type</th>
                  <th className="py-3 px-4 font-semibold">Value / Routing Target</th>
                  <th className="py-3 px-4 font-semibold">TTL</th>
                  <th className="py-3 px-4 font-semibold">Priority</th>
                  <th className="py-3 px-4 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
                {/* Always show Default NS Records */}
                <tr className="bg-zinc-50/50 dark:bg-zinc-800/20">
                  <td className="py-3 px-4 font-mono font-semibold text-zinc-900 dark:text-white">
                    @ ({selectedZone.domain_name})
                  </td>
                  <td className="py-3 px-4">
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                      NS
                    </span>
                  </td>
                  <td className="py-3 px-4 font-mono text-zinc-700 dark:text-zinc-300">
                    ns1.aravanta.cloud, ns2.aravanta.cloud
                  </td>
                  <td className="py-3 px-4 font-mono">172800s</td>
                  <td className="py-3 px-4 font-mono text-zinc-400">-</td>
                  <td className="py-3 px-4 text-right text-[11px] text-zinc-400 italic">System Protected</td>
                </tr>

                {pagedRecords.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-zinc-400">
                      {recordsLoading ? 'Loading records...' : 'No custom records yet. Click "Add Record Set" above!'}
                    </td>
                  </tr>
                ) : (
                  pagedRecords.map((rec) => (
                    <tr key={rec.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/40 transition">
                      <td className="py-3 px-4 font-mono font-semibold text-zinc-900 dark:text-white">
                        {rec.record_name === '@' ? rec.record_name : `${rec.record_name}.${selectedZone.domain_name}`}
                      </td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                          rec.record_type === 'A' ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20' :
                          rec.record_type === 'CNAME' ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20' :
                          rec.record_type === 'TXT' ? 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20' :
                          rec.record_type === 'MX' ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20' :
                          'bg-zinc-500/10 text-zinc-600 dark:text-zinc-400 border border-zinc-500/20'
                        }`}>
                          {rec.record_type}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-mono text-zinc-800 dark:text-zinc-200 max-w-xs truncate">
                        {rec.record_value}
                      </td>
                      <td className="py-3 px-4 font-mono">
                        {rec.ttl}s
                      </td>
                      <td className="py-3 px-4 font-mono">
                        {rec.priority !== undefined && rec.priority !== null ? rec.priority : '-'}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => setDeleteConfirmTarget({ type: 'record', id: rec.id, name: rec.record_name })}
                          className="p-1.5 text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 rounded transition"
                          title="Delete Record"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <DataTablePagination
            currentPage={page}
            totalItems={filteredRecords.length}
            pageSize={pageSize}
            onPageChange={setPage}
            onPageSizeChange={setPageSize}
          />
        </div>
      )}

      {/* Modal: Create Zone */}
      <ModalPortal isOpen={showCreateZoneModal} onClose={() => setShowCreateZoneModal(false)}>
        <form onSubmit={handleCreateZone} className="space-y-4">
          <div className="flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800 pb-3">
            <div className="flex items-center gap-2">
              <Globe className="w-5 h-5 text-indigo-500" />
              <h3 className="text-base font-bold text-zinc-900 dark:text-white">Create Hosted Zone</h3>
            </div>
            <button type="button" onClick={() => setShowCreateZoneModal(false)} className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 text-sm">✕</button>
          </div>

          <div>
            <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">Domain Name</label>
            <input
              type="text"
              required
              placeholder="e.g. example.com or app.example.com"
              value={domainName}
              onChange={(e) => setDomainName(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white focus:ring-1 focus:ring-indigo-500 outline-none font-mono"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">Zone Type</label>
            <select
              value={zoneType}
              onChange={(e: any) => setZoneType(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white focus:ring-1 focus:ring-indigo-500 outline-none"
            >
              <option value="PUBLIC">Public Hosted Zone (Internet routable)</option>
              <option value="PRIVATE">Private Hosted Zone (VPC mesh internal only)</option>
            </select>
          </div>

          <div className="flex items-center justify-end gap-2 pt-4 border-t border-zinc-200 dark:border-zinc-800">
            <button
              type="button"
              onClick={() => setShowCreateZoneModal(false)}
              className="px-3.5 py-1.5 text-xs rounded-lg border border-zinc-300 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={actionLoading}
              className="px-4 py-1.5 text-xs font-semibold rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white transition flex items-center gap-1.5"
            >
              {actionLoading && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
              Create Hosted Zone
            </button>
          </div>
        </form>
      </ModalPortal>

      {/* Modal: Create Record */}
      <ModalPortal isOpen={showCreateRecordModal} onClose={() => setShowCreateRecordModal(false)}>
        <form onSubmit={handleCreateRecord} className="space-y-4">
          <div className="flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800 pb-3">
            <div className="flex items-center gap-2">
              <Layers className="w-5 h-5 text-indigo-500" />
              <h3 className="text-base font-bold text-zinc-900 dark:text-white">Add DNS Record Set</h3>
            </div>
            <button type="button" onClick={() => setShowCreateRecordModal(false)} className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 text-sm">✕</button>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">Record Name</label>
              <div className="flex items-center">
                <input
                  type="text"
                  required
                  placeholder="@ or api or www"
                  value={recName}
                  onChange={(e) => setRecName(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-l-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white focus:ring-1 focus:ring-indigo-500 outline-none font-mono"
                />
                <span className="px-2 py-2 text-[11px] bg-zinc-100 dark:bg-zinc-800 border-y border-r border-zinc-300 dark:border-zinc-700 text-zinc-400 rounded-r-lg truncate max-w-[100px]">
                  .{selectedZone?.domain_name}
                </span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">Record Type</label>
              <select
                value={recType}
                onChange={(e: any) => setRecType(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white focus:ring-1 focus:ring-indigo-500 outline-none font-mono"
              >
                <option value="A">A (IPv4 Address)</option>
                <option value="AAAA">AAAA (IPv6 Address)</option>
                <option value="CNAME">CNAME (Canonical Alias)</option>
                <option value="TXT">TXT (SPF / Verification Text)</option>
                <option value="MX">MX (Mail Exchange)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">Record Value</label>
            <input
              type="text"
              required
              placeholder={recType === 'A' ? '192.0.2.1' : recType === 'CNAME' ? 'lb.aravanta.cloud' : 'v=spf1 include:...'}
              value={recValue}
              onChange={(e) => setRecValue(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white focus:ring-1 focus:ring-indigo-500 outline-none font-mono"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">TTL (Seconds)</label>
              <select
                value={recTtl}
                onChange={(e) => setRecTtl(Number(e.target.value))}
                className="w-full px-3 py-2 text-xs rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white focus:ring-1 focus:ring-indigo-500 outline-none font-mono"
              >
                <option value={60}>60 seconds (Fast propagation)</option>
                <option value={300}>300 seconds (5 mins - Standard)</option>
                <option value={3600}>3600 seconds (1 hour)</option>
                <option value={86400}>86400 seconds (1 day)</option>
              </select>
            </div>

            {recType === 'MX' && (
              <div>
                <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">Priority</label>
                <input
                  type="number"
                  placeholder="10"
                  value={recPriority ?? 10}
                  onChange={(e) => setRecPriority(Number(e.target.value))}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white focus:ring-1 focus:ring-indigo-500 outline-none font-mono"
                />
              </div>
            )}
          </div>

          <div className="flex items-center justify-end gap-2 pt-4 border-t border-zinc-200 dark:border-zinc-800">
            <button
              type="button"
              onClick={() => setShowCreateRecordModal(false)}
              className="px-3.5 py-1.5 text-xs rounded-lg border border-zinc-300 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={actionLoading}
              className="px-4 py-1.5 text-xs font-semibold rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white transition flex items-center gap-1.5"
            >
              {actionLoading && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
              Add Record
            </button>
          </div>
        </form>
      </ModalPortal>

      {/* Delete Modal */}
      <ModalPortal isOpen={Boolean(deleteConfirmTarget)} onClose={() => setDeleteConfirmTarget(null)}>
        <div className="space-y-4">
          <div className="flex items-center gap-3 text-red-600 dark:text-red-400">
            <AlertCircle className="w-6 h-6 shrink-0" />
            <h3 className="text-base font-bold text-zinc-900 dark:text-white">Delete DNS Resource</h3>
          </div>
          <p className="text-xs text-zinc-600 dark:text-zinc-300">
            Are you sure you want to delete <span className="font-semibold text-zinc-900 dark:text-white">{deleteConfirmTarget?.name}</span>? 
            {deleteConfirmTarget?.type === 'zone' && ' This will purge all associated DNS record sets and halt resolution immediately.'}
          </p>
          <div className="flex items-center justify-end gap-2 pt-4 border-t border-zinc-200 dark:border-zinc-800">
            <button
              onClick={() => setDeleteConfirmTarget(null)}
              className="px-3.5 py-1.5 text-xs rounded-lg border border-zinc-300 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 transition"
            >
              Cancel
            </button>
            <button
              onClick={handleDeleteTarget}
              disabled={actionLoading}
              className="px-4 py-1.5 text-xs font-semibold rounded-lg bg-red-600 hover:bg-red-500 text-white transition flex items-center gap-1.5"
            >
              {actionLoading && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
              Delete Permanently
            </button>
          </div>
        </div>
      </ModalPortal>
    </div>
  );
};
