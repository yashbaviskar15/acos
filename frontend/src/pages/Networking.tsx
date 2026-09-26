import React, { useState, useEffect, useMemo } from 'react';
import { 
  Network, Plus, Trash2, Shield, Globe, Layers, RefreshCw, 
  CheckCircle2, AlertCircle, Search
} from 'lucide-react';
import { ModalPortal } from '../components/ModalPortal';
import { DataTablePagination } from '../components/DataTablePagination';
import { apiFetch } from '../config/api';

interface NetworkingProps {
  token: string | null;
}

interface ArvVPCItem {
  id: string;
  name: string;
  cidr_block: string;
  region: string;
  status: string;
  is_default: boolean;
  created_at: string;
}

interface ArvFirewallItem {
  id: string;
  vpc_id?: string;
  name: string;
  direction: 'INBOUND' | 'OUTBOUND';
  protocol: string;
  port_range: string;
  source_cidr: string;
  action: 'ALLOW' | 'DENY';
  priority: number;
  created_at: string;
}

export const Networking: React.FC<NetworkingProps> = ({ token }) => {
  const [activeSubTab, setActiveSubTab] = useState<'vpcs' | 'firewall' | 'subnets'>('vpcs');
  const [vpcs, setVpcs] = useState<ArvVPCItem[]>([]);
  const [firewallRules, setFirewallRules] = useState<ArvFirewallItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Search & Filter
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Modals
  const [showCreateVpcModal, setShowCreateVpcModal] = useState(false);
  const [showCreateFwModal, setShowCreateFwModal] = useState(false);
  const [deleteConfirmTarget, setDeleteConfirmTarget] = useState<{ type: 'vpc' | 'fw'; id: string; name: string } | null>(null);

  // Form states - VPC
  const [vpcName, setVpcName] = useState('');
  const [vpcCidr, setVpcCidr] = useState('10.0.0.0/16');
  const [vpcRegion, setVpcRegion] = useState('arv-us-east-1');
  const [vpcIsDefault, setVpcIsDefault] = useState(false);

  // Form states - Firewall
  const [fwName, setFwName] = useState('');
  const [fwVpcId, setFwVpcId] = useState<string>('');
  const [fwDirection, setFwDirection] = useState<'INBOUND' | 'OUTBOUND'>('INBOUND');
  const [fwProtocol, setFwProtocol] = useState('TCP');
  const [fwPortRange, setFwPortRange] = useState('443');
  const [fwSourceCidr, setFwSourceCidr] = useState('0.0.0.0/0');
  const [fwAction, setFwAction] = useState<'ALLOW' | 'DENY'>('ALLOW');
  const [fwPriority, setFwPriority] = useState<number>(100);

  const fetchData = async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const [vpcsRes, fwRes] = await Promise.all([
        apiFetch<ArvVPCItem[]>('/api/v1/network/vpcs', { token }).catch(() => []),
        apiFetch<ArvFirewallItem[]>('/api/v1/network/firewall-rules', { token }).catch(() => [])
      ]);
      setVpcs(vpcsRes || []);
      setFirewallRules(fwRes || []);
      if (vpcsRes && vpcsRes.length > 0 && !fwVpcId) {
        setFwVpcId(vpcsRes[0].id);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to fetch network configuration');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [token]);

  const handleCreateVpc = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!vpcName.trim()) {
      setErrorMsg('VPC name is required');
      return;
    }
    setActionLoading(true);
    setErrorMsg(null);
    try {
      await apiFetch('/api/v1/network/vpcs', {
        token,
        method: 'POST',
        body: JSON.stringify({
          name: vpcName.trim(),
          cidr_block: vpcCidr,
          region: vpcRegion,
          is_default: vpcIsDefault
        })
      });
      setSuccessMsg(`VPC ${vpcName} provisioned successfully`);
      setShowCreateVpcModal(false);
      setVpcName('');
      setVpcCidr('10.0.0.0/16');
      fetchData();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to create VPC');
    } finally {
      setActionLoading(false);
    }
  };

  const handleCreateFirewallRule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fwName.trim()) {
      setErrorMsg('Rule name is required');
      return;
    }
    setActionLoading(true);
    setErrorMsg(null);
    try {
      await apiFetch('/api/v1/network/firewall-rules', {
        token,
        method: 'POST',
        body: JSON.stringify({
          name: fwName.trim(),
          vpc_id: fwVpcId || undefined,
          direction: fwDirection,
          protocol: fwProtocol,
          port_range: fwPortRange,
          source_cidr: fwSourceCidr,
          action: fwAction,
          priority: Number(fwPriority)
        })
      });
      setSuccessMsg(`Firewall rule ${fwName} added successfully`);
      setShowCreateFwModal(false);
      setFwName('');
      fetchData();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to create firewall rule');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteTarget = async () => {
    if (!deleteConfirmTarget) return;
    setActionLoading(true);
    setErrorMsg(null);
    try {
      if (deleteConfirmTarget.type === 'vpc') {
        await apiFetch(`/api/v1/network/vpcs/${deleteConfirmTarget.id}`, {
          token,
          method: 'DELETE'
        });
        setSuccessMsg(`VPC ${deleteConfirmTarget.name} deleted`);
      } else {
        await apiFetch(`/api/v1/network/firewall-rules/${deleteConfirmTarget.id}`, {
          token,
          method: 'DELETE'
        });
        setSuccessMsg(`Firewall rule ${deleteConfirmTarget.name} deleted`);
      }
      setDeleteConfirmTarget(null);
      fetchData();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to delete network resource');
    } finally {
      setActionLoading(false);
    }
  };

  // Filtered & Sorted VPCs
  const filteredVpcs = useMemo(() => {
    return vpcs
      .filter(v => 
        v.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        v.cidr_block.toLowerCase().includes(searchTerm.toLowerCase()) ||
        v.region.toLowerCase().includes(searchTerm.toLowerCase()) ||
        v.id.toLowerCase().includes(searchTerm.toLowerCase())
      )
      .sort((a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime());
  }, [vpcs, searchTerm]);

  // Filtered & Sorted Firewall Rules
  const filteredFwRules = useMemo(() => {
    return firewallRules
      .filter(r => 
        r.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.protocol.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.port_range.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.source_cidr.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.direction.toLowerCase().includes(searchTerm.toLowerCase())
      )
      .sort((a, b) => a.priority - b.priority);
  }, [firewallRules, searchTerm]);

  const pagedVpcs = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredVpcs.slice(start, start + pageSize);
  }, [filteredVpcs, page, pageSize]);

  const pagedFwRules = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredFwRules.slice(start, start + pageSize);
  }, [filteredFwRules, page, pageSize]);

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-200 dark:border-zinc-800 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <Network className="w-5 h-5" />
            </span>
            <h1 className="text-xl sm:text-2xl font-bold text-zinc-900 dark:text-white">
              ArvVPC — Virtual Private Cloud & Networking
            </h1>
          </div>
          <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
            Isolated cloud networks, subnets, routing tables, and security groups with multi-AZ topology.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => fetchData()}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800/80 text-zinc-700 dark:text-zinc-200 hover:bg-zinc-50 dark:hover:bg-zinc-700 transition"
            title="Refresh network topology"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          {activeSubTab === 'vpcs' ? (
            <button
              onClick={() => setShowCreateVpcModal(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white shadow-sm transition"
            >
              <Plus className="w-3.5 h-3.5" />
              Create VPC
            </button>
          ) : (
            <button
              onClick={() => setShowCreateFwModal(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white shadow-sm transition"
            >
              <Plus className="w-3.5 h-3.5" />
              Add Firewall Rule
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
            <span>Total VPCs</span>
            <Network className="w-4 h-4 text-emerald-500" />
          </div>
          <p className="mt-2 text-2xl font-bold text-zinc-900 dark:text-white">
            {vpcs.length}
          </p>
          <p className="text-xs text-zinc-500 mt-1">Isolated sub-networks</p>
        </div>

        <div className="p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/60 shadow-sm">
          <div className="flex items-center justify-between text-zinc-500 dark:text-zinc-400 text-xs font-medium">
            <span>Security Rules</span>
            <Shield className="w-4 h-4 text-amber-500" />
          </div>
          <p className="mt-2 text-2xl font-bold text-zinc-900 dark:text-white">
            {firewallRules.length}
          </p>
          <p className="text-xs text-zinc-500 mt-1">Inbound / Outbound filters</p>
        </div>

        <div className="p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/60 shadow-sm">
          <div className="flex items-center justify-between text-zinc-500 dark:text-zinc-400 text-xs font-medium">
            <span>Primary Region</span>
            <Globe className="w-4 h-4 text-blue-500" />
          </div>
          <p className="mt-2 text-xl font-bold text-zinc-900 dark:text-white truncate">
            {vpcs[0]?.region || 'arv-us-east-1'}
          </p>
          <p className="text-xs text-zinc-500 mt-1">Tier-4 Datacenter</p>
        </div>

        <div className="p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/60 shadow-sm">
          <div className="flex items-center justify-between text-zinc-500 dark:text-zinc-400 text-xs font-medium">
            <span>Subnet Mesh</span>
            <Layers className="w-4 h-4 text-purple-500" />
          </div>
          <p className="mt-2 text-2xl font-bold text-zinc-900 dark:text-white">
            {vpcs.length * 3 || 3}
          </p>
          <p className="text-xs text-zinc-500 mt-1">Multi-AZ Subnets (A/B/C)</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-zinc-200 dark:border-zinc-800">
        <button
          onClick={() => { setActiveSubTab('vpcs'); setPage(1); }}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs sm:text-sm font-semibold border-b-2 transition ${
            activeSubTab === 'vpcs'
              ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400'
              : 'border-transparent text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
          }`}
        >
          <Network className="w-4 h-4" />
          Virtual Private Clouds (VPCs) ({vpcs.length})
        </button>
        <button
          onClick={() => { setActiveSubTab('firewall'); setPage(1); }}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs sm:text-sm font-semibold border-b-2 transition ${
            activeSubTab === 'firewall'
              ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400'
              : 'border-transparent text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
          }`}
        >
          <Shield className="w-4 h-4" />
          Firewall & Security Rules ({firewallRules.length})
        </button>
        <button
          onClick={() => { setActiveSubTab('subnets'); setPage(1); }}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs sm:text-sm font-semibold border-b-2 transition ${
            activeSubTab === 'subnets'
              ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400'
              : 'border-transparent text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
          }`}
        >
          <Layers className="w-4 h-4" />
          Subnet Topology & Routing
        </button>
      </div>

      {/* Search Input */}
      {activeSubTab !== 'subnets' && (
        <div className="flex items-center justify-between gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder={activeSubTab === 'vpcs' ? 'Search VPC by name, CIDR, region...' : 'Search rules by protocol, port, CIDR...'}
              className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
            />
          </div>
        </div>
      )}

      {/* Tab Content 1: VPCs */}
      {activeSubTab === 'vpcs' && (
        <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-zinc-600 dark:text-zinc-300">
              <thead className="bg-zinc-50 dark:bg-zinc-800/60 text-zinc-500 dark:text-zinc-400 border-b border-zinc-200 dark:border-zinc-800">
                <tr>
                  <th className="py-3 px-4 font-semibold">Name & ID</th>
                  <th className="py-3 px-4 font-semibold">IPv4 CIDR Block</th>
                  <th className="py-3 px-4 font-semibold">Region</th>
                  <th className="py-3 px-4 font-semibold">Status</th>
                  <th className="py-3 px-4 font-semibold">Scope</th>
                  <th className="py-3 px-4 font-semibold">Created</th>
                  <th className="py-3 px-4 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
                {pagedVpcs.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-zinc-400">
                      {loading ? 'Loading VPCs...' : 'No VPCs provisioned. Create your first isolated cloud network!'}
                    </td>
                  </tr>
                ) : (
                  pagedVpcs.map((vpc) => (
                    <tr key={vpc.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/40 transition">
                      <td className="py-3 px-4">
                        <div className="font-semibold text-zinc-900 dark:text-white flex items-center gap-1.5">
                          <Network className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                          <span>{vpc.name}</span>
                        </div>
                        <span className="font-mono text-[11px] text-zinc-400">{vpc.id}</span>
                      </td>
                      <td className="py-3 px-4 font-mono font-medium text-emerald-600 dark:text-emerald-400">
                        {vpc.cidr_block}
                      </td>
                      <td className="py-3 px-4 font-mono">
                        {vpc.region}
                      </td>
                      <td className="py-3 px-4">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                          {vpc.status || 'ACTIVE'}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        {vpc.is_default ? (
                          <span className="px-2 py-0.5 rounded bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 text-[10px] font-semibold">
                            Default
                          </span>
                        ) : (
                          <span className="text-zinc-400 text-[11px]">Custom</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-zinc-400 text-[11px]">
                        {vpc.created_at ? new Date(vpc.created_at).toLocaleDateString() : 'Active'}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => setDeleteConfirmTarget({ type: 'vpc', id: vpc.id, name: vpc.name })}
                          className="p-1.5 text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 rounded transition"
                          title="Delete VPC"
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
            totalItems={filteredVpcs.length}
            pageSize={pageSize}
            onPageChange={setPage}
            onPageSizeChange={setPageSize}
          />
        </div>
      )}

      {/* Tab Content 2: Firewall Rules */}
      {activeSubTab === 'firewall' && (
        <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-zinc-600 dark:text-zinc-300">
              <thead className="bg-zinc-50 dark:bg-zinc-800/60 text-zinc-500 dark:text-zinc-400 border-b border-zinc-200 dark:border-zinc-800">
                <tr>
                  <th className="py-3 px-4 font-semibold">Rule Name</th>
                  <th className="py-3 px-4 font-semibold">Direction</th>
                  <th className="py-3 px-4 font-semibold">Protocol</th>
                  <th className="py-3 px-4 font-semibold">Port Range</th>
                  <th className="py-3 px-4 font-semibold">Source CIDR</th>
                  <th className="py-3 px-4 font-semibold">Action</th>
                  <th className="py-3 px-4 font-semibold">Priority</th>
                  <th className="py-3 px-4 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
                {pagedFwRules.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-8 text-center text-zinc-400">
                      {loading ? 'Loading rules...' : 'No custom firewall rules configured. Default deny inbound / allow outbound applies.'}
                    </td>
                  </tr>
                ) : (
                  pagedFwRules.map((rule) => (
                    <tr key={rule.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/40 transition">
                      <td className="py-3 px-4 font-semibold text-zinc-900 dark:text-white flex items-center gap-1.5">
                        <Shield className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                        <div>
                          <span>{rule.name}</span>
                          <div className="font-mono text-[10px] text-zinc-400">{rule.id}</div>
                        </div>
                      </td>
                      <td className="py-3 px-4 font-semibold">
                        <span className={`px-2 py-0.5 rounded text-[10px] ${
                          rule.direction === 'INBOUND' 
                            ? 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20' 
                            : 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20'
                        }`}>
                          {rule.direction}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-mono font-bold text-zinc-700 dark:text-zinc-200">
                        {rule.protocol}
                      </td>
                      <td className="py-3 px-4 font-mono">
                        {rule.port_range}
                      </td>
                      <td className="py-3 px-4 font-mono text-zinc-500 dark:text-zinc-400">
                        {rule.source_cidr}
                      </td>
                      <td className="py-3 px-4">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                          rule.action === 'ALLOW' 
                            ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                            : 'bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20'
                        }`}>
                          {rule.action}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-mono">
                        {rule.priority}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => setDeleteConfirmTarget({ type: 'fw', id: rule.id, name: rule.name })}
                          className="p-1.5 text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 rounded transition"
                          title="Delete Rule"
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
            totalItems={filteredFwRules.length}
            pageSize={pageSize}
            onPageChange={setPage}
            onPageSizeChange={setPageSize}
          />
        </div>
      )}

      {/* Tab Content 3: Subnet Topology & Architecture View */}
      {activeSubTab === 'subnets' && (
        <div className="space-y-4">
          <div className="p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm">
            <h3 className="text-sm font-bold text-zinc-900 dark:text-white flex items-center gap-2">
              <Layers className="w-4 h-4 text-purple-500" />
              Automated Subnet Partitioning & Routing Table
            </h3>
            <p className="text-xs text-zinc-500 mt-1">
              Every provisioned VPC is automatically apportioned across 3 availability zones with public egress and private isolated subnets.
            </p>

            <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="p-3 rounded-lg border border-emerald-500/30 bg-emerald-500/5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-300">Public Subnet (Zone A)</span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-600 font-mono">10.0.1.0/24</span>
                </div>
                <p className="text-[11px] text-zinc-500 mt-2">Route: 0.0.0.0/0 → Internet Gateway (IGW)</p>
                <div className="mt-2 text-[10px] text-zinc-400">Available IPs: 251 • Auto-assign Public IP: Enabled</div>
              </div>

              <div className="p-3 rounded-lg border border-blue-500/30 bg-blue-500/5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-blue-700 dark:text-blue-300">Application Subnet (Zone B)</span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-600 font-mono">10.0.2.0/24</span>
                </div>
                <p className="text-[11px] text-zinc-500 mt-2">Route: 0.0.0.0/0 → NAT Gateway</p>
                <div className="mt-2 text-[10px] text-zinc-400">Available IPs: 251 • Private Compute & K8s Workers</div>
              </div>

              <div className="p-3 rounded-lg border border-purple-500/30 bg-purple-500/5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-purple-700 dark:text-purple-300">Database Subnet (Zone C)</span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-600 font-mono">10.0.3.0/24</span>
                </div>
                <p className="text-[11px] text-zinc-500 mt-2">Route: Local VPC Peering only (Zero Egress)</p>
                <div className="mt-2 text-[10px] text-zinc-400">Available IPs: 251 • Postgres, MySQL, Redis HA Clusters</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Create VPC */}
      <ModalPortal isOpen={showCreateVpcModal} onClose={() => setShowCreateVpcModal(false)}>
        <form onSubmit={handleCreateVpc} className="space-y-4">
          <div className="flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800 pb-3">
            <div className="flex items-center gap-2">
              <Network className="w-5 h-5 text-emerald-500" />
              <h3 className="text-base font-bold text-zinc-900 dark:text-white">Provision Virtual Private Cloud</h3>
            </div>
            <button type="button" onClick={() => setShowCreateVpcModal(false)} className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 text-sm">✕</button>
          </div>

          <div>
            <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">VPC Name</label>
            <input
              type="text"
              required
              placeholder="e.g. production-us-east-vpc"
              value={vpcName}
              onChange={(e) => setVpcName(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white focus:ring-1 focus:ring-emerald-500 outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">IPv4 CIDR Block</label>
              <select
                value={vpcCidr}
                onChange={(e) => setVpcCidr(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white focus:ring-1 focus:ring-emerald-500 outline-none font-mono"
              >
                <option value="10.0.0.0/16">10.0.0.0/16 (65,536 IPs)</option>
                <option value="172.16.0.0/16">172.16.0.0/16 (65,536 IPs)</option>
                <option value="192.168.0.0/16">192.168.0.0/16 (65,536 IPs)</option>
                <option value="10.100.0.0/16">10.100.0.0/16 (Secondary)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">Deployment Region</label>
              <select
                value={vpcRegion}
                onChange={(e) => setVpcRegion(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white focus:ring-1 focus:ring-emerald-500 outline-none"
              >
                <option value="arv-us-east-1">arv-us-east-1 (N. Virginia)</option>
                <option value="arv-ap-south-1">arv-ap-south-1 (Mumbai)</option>
                <option value="arv-eu-central-1">arv-eu-central-1 (Frankfurt)</option>
              </select>
            </div>
          </div>

          <div className="flex items-center gap-2 pt-2">
            <input
              type="checkbox"
              id="isDefault"
              checked={vpcIsDefault}
              onChange={(e) => setVpcIsDefault(e.target.checked)}
              className="rounded text-emerald-600 focus:ring-emerald-500"
            />
            <label htmlFor="isDefault" className="text-xs text-zinc-600 dark:text-zinc-400">
              Set as workspace default VPC for newly launched VMs & clusters
            </label>
          </div>

          <div className="flex items-center justify-end gap-2 pt-4 border-t border-zinc-200 dark:border-zinc-800">
            <button
              type="button"
              onClick={() => setShowCreateVpcModal(false)}
              className="px-3.5 py-1.5 text-xs rounded-lg border border-zinc-300 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={actionLoading}
              className="px-4 py-1.5 text-xs font-semibold rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white transition flex items-center gap-1.5"
            >
              {actionLoading && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
              Create VPC
            </button>
          </div>
        </form>
      </ModalPortal>

      {/* Modal: Create Firewall Rule */}
      <ModalPortal isOpen={showCreateFwModal} onClose={() => setShowCreateFwModal(false)}>
        <form onSubmit={handleCreateFirewallRule} className="space-y-4">
          <div className="flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800 pb-3">
            <div className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-amber-500" />
              <h3 className="text-base font-bold text-zinc-900 dark:text-white">Add Security Group Firewall Rule</h3>
            </div>
            <button type="button" onClick={() => setShowCreateFwModal(false)} className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 text-sm">✕</button>
          </div>

          <div>
            <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">Rule Name</label>
            <input
              type="text"
              required
              placeholder="e.g. allow-web-https"
              value={fwName}
              onChange={(e) => setFwName(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white focus:ring-1 focus:ring-emerald-500 outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">Direction</label>
              <select
                value={fwDirection}
                onChange={(e: any) => setFwDirection(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white focus:ring-1 focus:ring-emerald-500 outline-none"
              >
                <option value="INBOUND">INBOUND (Ingress)</option>
                <option value="OUTBOUND">OUTBOUND (Egress)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">Protocol</label>
              <select
                value={fwProtocol}
                onChange={(e) => setFwProtocol(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white focus:ring-1 focus:ring-emerald-500 outline-none"
              >
                <option value="TCP">TCP</option>
                <option value="UDP">UDP</option>
                <option value="ICMP">ICMP</option>
                <option value="ALL">ALL Protocols</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">Port Range</label>
              <input
                type="text"
                required
                placeholder="443, 80, 8080, or 1-65535"
                value={fwPortRange}
                onChange={(e) => setFwPortRange(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white focus:ring-1 focus:ring-emerald-500 outline-none font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">Source CIDR</label>
              <input
                type="text"
                required
                placeholder="0.0.0.0/0 (Internet) or 10.0.0.0/16"
                value={fwSourceCidr}
                onChange={(e) => setFwSourceCidr(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white focus:ring-1 focus:ring-emerald-500 outline-none font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">Action</label>
              <select
                value={fwAction}
                onChange={(e: any) => setFwAction(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white focus:ring-1 focus:ring-emerald-500 outline-none"
              >
                <option value="ALLOW">ALLOW Traffic</option>
                <option value="DENY">DENY Traffic</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">Priority (10-1000)</label>
              <input
                type="number"
                min={10}
                max={1000}
                value={fwPriority}
                onChange={(e) => setFwPriority(Number(e.target.value))}
                className="w-full px-3 py-2 text-xs rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white focus:ring-1 focus:ring-emerald-500 outline-none font-mono"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-4 border-t border-zinc-200 dark:border-zinc-800">
            <button
              type="button"
              onClick={() => setShowCreateFwModal(false)}
              className="px-3.5 py-1.5 text-xs rounded-lg border border-zinc-300 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={actionLoading}
              className="px-4 py-1.5 text-xs font-semibold rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white transition flex items-center gap-1.5"
            >
              {actionLoading && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
              Save Rule
            </button>
          </div>
        </form>
      </ModalPortal>

      {/* Delete Confirmation Modal */}
      <ModalPortal isOpen={Boolean(deleteConfirmTarget)} onClose={() => setDeleteConfirmTarget(null)}>
        <div className="space-y-4">
          <div className="flex items-center gap-3 text-red-600 dark:text-red-400">
            <AlertCircle className="w-6 h-6 shrink-0" />
            <h3 className="text-base font-bold text-zinc-900 dark:text-white">Confirm Resource Deletion</h3>
          </div>
          <p className="text-xs text-zinc-600 dark:text-zinc-300">
            Are you sure you want to delete <span className="font-semibold text-zinc-900 dark:text-white">{deleteConfirmTarget?.name}</span>? 
            {deleteConfirmTarget?.type === 'vpc' && ' This will tear down all subnets and routing boundaries associated with this VPC.'}
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
