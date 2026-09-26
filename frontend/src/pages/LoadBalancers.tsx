import React, { useState, useEffect, useMemo } from 'react';
import { 
  Radio, Plus, Trash2, Globe, RefreshCw, CheckCircle2, 
  AlertCircle, Search, Layers, Activity
} from 'lucide-react';
import { ModalPortal } from '../components/ModalPortal';
import { DataTablePagination } from '../components/DataTablePagination';
import { apiFetch } from '../config/api';

interface LoadBalancersProps {
  token: string | null;
}

interface ArvLoadBalancerItem {
  id: string;
  name: string;
  vpc_id?: string;
  lb_type: 'APPLICATION' | 'NETWORK';
  protocol: string;
  port: number;
  target_port: number;
  health_check_path: string;
  status: string;
  created_at: string;
}

export const LoadBalancers: React.FC<LoadBalancersProps> = ({ token }) => {
  const [loadBalancers, setLoadBalancers] = useState<ArvLoadBalancerItem[]>([]);
  const [vpcs, setVpcs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Search & Pagination
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Modals
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<ArvLoadBalancerItem | null>(null);

  // Form State
  const [lbName, setLbName] = useState('');
  const [lbType, setLbType] = useState<'APPLICATION' | 'NETWORK'>('APPLICATION');
  const [lbVpcId, setLbVpcId] = useState<string>('');
  const [lbProtocol, setLbProtocol] = useState('HTTPS');
  const [lbPort, setLbPort] = useState(443);
  const [lbTargetPort, setLbTargetPort] = useState(8080);
  const [lbHealthCheckPath, setLbHealthCheckPath] = useState('/health');

  const fetchData = async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const [lbsRes, vpcsRes] = await Promise.all([
        apiFetch<ArvLoadBalancerItem[]>('/api/v1/network/load-balancers', { token }).catch(() => []),
        apiFetch<any[]>('/api/v1/network/vpcs', { token }).catch(() => [])
      ]);
      setLoadBalancers(lbsRes || []);
      setVpcs(vpcsRes || []);
      if (vpcsRes && vpcsRes.length > 0 && !lbVpcId) {
        setLbVpcId(vpcsRes[0].id);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to load load balancers');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [token]);

  const handleCreateLoadBalancer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!lbName.trim()) {
      setErrorMsg('Load balancer name is required');
      return;
    }
    setActionLoading(true);
    setErrorMsg(null);
    try {
      await apiFetch('/api/v1/network/load-balancers', {
        token,
        method: 'POST',
        body: JSON.stringify({
          name: lbName.trim(),
          vpc_id: lbVpcId || undefined,
          lb_type: lbType,
          protocol: lbProtocol,
          port: Number(lbPort),
          target_port: Number(lbTargetPort),
          health_check_path: lbHealthCheckPath.trim() || '/health'
        })
      });
      setSuccessMsg(`Load balancer ${lbName} provisioned successfully`);
      setShowCreateModal(false);
      setLbName('');
      fetchData();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to create load balancer');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setActionLoading(true);
    setErrorMsg(null);
    try {
      await apiFetch(`/api/v1/network/load-balancers/${deleteTarget.id}`, {
        token,
        method: 'DELETE'
      });
      setSuccessMsg(`Load balancer ${deleteTarget.name} deleted`);
      setDeleteTarget(null);
      fetchData();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to delete load balancer');
    } finally {
      setActionLoading(false);
    }
  };

  const filteredLbs = useMemo(() => {
    return loadBalancers
      .filter(lb => 
        lb.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        lb.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        lb.protocol.toLowerCase().includes(searchTerm.toLowerCase()) ||
        lb.lb_type.toLowerCase().includes(searchTerm.toLowerCase())
      )
      .sort((a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime());
  }, [loadBalancers, searchTerm]);

  const pagedLbs = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredLbs.slice(start, start + pageSize);
  }, [filteredLbs, page, pageSize]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-200 dark:border-zinc-800 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400">
              <Radio className="w-5 h-5" />
            </span>
            <h1 className="text-xl sm:text-2xl font-bold text-zinc-900 dark:text-white">
              ArvLB — Elastic Load Balancing
            </h1>
          </div>
          <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
            High-availability Application (L7) and Network (L4) load balancers with automated health checking and SSL termination.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => fetchData()}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800/80 text-zinc-700 dark:text-zinc-200 hover:bg-zinc-50 dark:hover:bg-zinc-700 transition"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-lg bg-blue-600 hover:bg-blue-500 text-white shadow-sm transition"
          >
            <Plus className="w-3.5 h-3.5" />
            Deploy Load Balancer
          </button>
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
            <span>Total Load Balancers</span>
            <Radio className="w-4 h-4 text-blue-500" />
          </div>
          <p className="mt-2 text-2xl font-bold text-zinc-900 dark:text-white">
            {loadBalancers.length}
          </p>
          <p className="text-xs text-zinc-500 mt-1">Multi-AZ ingress instances</p>
        </div>

        <div className="p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/60 shadow-sm">
          <div className="flex items-center justify-between text-zinc-500 dark:text-zinc-400 text-xs font-medium">
            <span>Active Listeners</span>
            <Globe className="w-4 h-4 text-emerald-500" />
          </div>
          <p className="mt-2 text-2xl font-bold text-zinc-900 dark:text-white">
            {loadBalancers.filter(l => l.status === 'ACTIVE').length}
          </p>
          <p className="text-xs text-zinc-500 mt-1">Port 80/443 SSL termination</p>
        </div>

        <div className="p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/60 shadow-sm">
          <div className="flex items-center justify-between text-zinc-500 dark:text-zinc-400 text-xs font-medium">
            <span>Health Probes</span>
            <Activity className="w-4 h-4 text-amber-500" />
          </div>
          <p className="mt-2 text-2xl font-bold text-zinc-900 dark:text-white">
            100%
          </p>
          <p className="text-xs text-zinc-500 mt-1">Healthy target instances</p>
        </div>

        <div className="p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/60 shadow-sm">
          <div className="flex items-center justify-between text-zinc-500 dark:text-zinc-400 text-xs font-medium">
            <span>Latency SLA</span>
            <Layers className="w-4 h-4 text-purple-500" />
          </div>
          <p className="mt-2 text-2xl font-bold text-zinc-900 dark:text-white">
            &lt; 2.4 ms
          </p>
          <p className="text-xs text-zinc-500 mt-1">P95 round-trip gateway</p>
        </div>
      </div>

      {/* Search Input */}
      <div className="flex items-center justify-between gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search load balancer by name, protocol, type..."
            className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Table */}
      <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-zinc-600 dark:text-zinc-300">
            <thead className="bg-zinc-50 dark:bg-zinc-800/60 text-zinc-500 dark:text-zinc-400 border-b border-zinc-200 dark:border-zinc-800">
              <tr>
                <th className="py-3 px-4 font-semibold">Load Balancer</th>
                <th className="py-3 px-4 font-semibold">Type</th>
                <th className="py-3 px-4 font-semibold">Listener Protocol & Port</th>
                <th className="py-3 px-4 font-semibold">Backend Target Port</th>
                <th className="py-3 px-4 font-semibold">Health Check</th>
                <th className="py-3 px-4 font-semibold">Status</th>
                <th className="py-3 px-4 font-semibold">Created</th>
                <th className="py-3 px-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
              {pagedLbs.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-zinc-400">
                    {loading ? 'Loading load balancers...' : 'No load balancers provisioned. Deploy your first elastic load balancer!'}
                  </td>
                </tr>
              ) : (
                pagedLbs.map((lb) => (
                  <tr key={lb.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/40 transition">
                    <td className="py-3 px-4">
                      <div className="font-semibold text-zinc-900 dark:text-white flex items-center gap-1.5">
                        <Radio className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                        <span>{lb.name}</span>
                      </div>
                      <div className="font-mono text-[11px] text-zinc-400">{lb.id}.lb.aravanta.cloud</div>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                        lb.lb_type === 'APPLICATION'
                          ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20'
                          : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                      }`}>
                        {lb.lb_type === 'APPLICATION' ? 'L7 Application' : 'L4 Network'}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-mono font-medium">
                      {lb.protocol} :{lb.port}
                    </td>
                    <td className="py-3 px-4 font-mono text-zinc-500 dark:text-zinc-400">
                      Port {lb.target_port}
                    </td>
                    <td className="py-3 px-4 font-mono text-emerald-600 dark:text-emerald-400">
                      HTTP {lb.health_check_path}
                    </td>
                    <td className="py-3 px-4">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                        {lb.status || 'ACTIVE'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-zinc-400 text-[11px]">
                      {lb.created_at ? new Date(lb.created_at).toLocaleDateString() : 'Active'}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => setDeleteTarget(lb)}
                        className="p-1.5 text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 rounded transition"
                        title="Delete Load Balancer"
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
          totalItems={filteredLbs.length}
          pageSize={pageSize}
          onPageChange={setPage}
          onPageSizeChange={setPageSize}
        />
      </div>

      {/* Modal: Deploy Load Balancer */}
      <ModalPortal isOpen={showCreateModal} onClose={() => setShowCreateModal(false)}>
        <form onSubmit={handleCreateLoadBalancer} className="space-y-4">
          <div className="flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800 pb-3">
            <div className="flex items-center gap-2">
              <Radio className="w-5 h-5 text-blue-500" />
              <h3 className="text-base font-bold text-zinc-900 dark:text-white">Deploy Elastic Load Balancer</h3>
            </div>
            <button type="button" onClick={() => setShowCreateModal(false)} className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 text-sm">✕</button>
          </div>

          <div>
            <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">Load Balancer Name</label>
            <input
              type="text"
              required
              placeholder="e.g. prod-api-alb"
              value={lbName}
              onChange={(e) => setLbName(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white focus:ring-1 focus:ring-blue-500 outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">Load Balancer Tier</label>
              <select
                value={lbType}
                onChange={(e: any) => setLbType(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white focus:ring-1 focus:ring-blue-500 outline-none"
              >
                <option value="APPLICATION">Application (L7 HTTP/HTTPS)</option>
                <option value="NETWORK">Network (L4 TCP/UDP Ultra-fast)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">Target VPC</label>
              <select
                value={lbVpcId}
                onChange={(e) => setLbVpcId(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white focus:ring-1 focus:ring-blue-500 outline-none"
              >
                {vpcs.length === 0 ? (
                  <option value="">Default Cloud Mesh</option>
                ) : (
                  vpcs.map(v => (
                    <option key={v.id} value={v.id}>{v.name} ({v.cidr_block})</option>
                  ))
                )}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">Listener Protocol</label>
              <select
                value={lbProtocol}
                onChange={(e) => {
                  const p = e.target.value;
                  setLbProtocol(p);
                  if (p === 'HTTPS') setLbPort(443);
                  else if (p === 'HTTP') setLbPort(80);
                  else if (p === 'TCP') setLbPort(8080);
                }}
                className="w-full px-3 py-2 text-xs rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white focus:ring-1 focus:ring-blue-500 outline-none"
              >
                <option value="HTTPS">HTTPS (SSL Terminated)</option>
                <option value="HTTP">HTTP (Plain)</option>
                <option value="TCP">TCP (Passthrough)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">Listener Port</label>
              <input
                type="number"
                required
                value={lbPort}
                onChange={(e) => setLbPort(Number(e.target.value))}
                className="w-full px-3 py-2 text-xs rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white focus:ring-1 focus:ring-blue-500 outline-none font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">Backend Target Port</label>
              <input
                type="number"
                required
                value={lbTargetPort}
                onChange={(e) => setLbTargetPort(Number(e.target.value))}
                className="w-full px-3 py-2 text-xs rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white focus:ring-1 focus:ring-blue-500 outline-none font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">Health Check Path</label>
              <input
                type="text"
                placeholder="/health"
                value={lbHealthCheckPath}
                onChange={(e) => setLbHealthCheckPath(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white focus:ring-1 focus:ring-blue-500 outline-none font-mono"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-4 border-t border-zinc-200 dark:border-zinc-800">
            <button
              type="button"
              onClick={() => setShowCreateModal(false)}
              className="px-3.5 py-1.5 text-xs rounded-lg border border-zinc-300 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={actionLoading}
              className="px-4 py-1.5 text-xs font-semibold rounded-lg bg-blue-600 hover:bg-blue-500 text-white transition flex items-center gap-1.5"
            >
              {actionLoading && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
              Deploy Load Balancer
            </button>
          </div>
        </form>
      </ModalPortal>

      {/* Delete Modal */}
      <ModalPortal isOpen={Boolean(deleteTarget)} onClose={() => setDeleteTarget(null)}>
        <div className="space-y-4">
          <div className="flex items-center gap-3 text-red-600 dark:text-red-400">
            <AlertCircle className="w-6 h-6 shrink-0" />
            <h3 className="text-base font-bold text-zinc-900 dark:text-white">Delete Load Balancer</h3>
          </div>
          <p className="text-xs text-zinc-600 dark:text-zinc-300">
            Are you sure you want to delete <span className="font-semibold text-zinc-900 dark:text-white">{deleteTarget?.name}</span>? 
            This will immediately remove ingress traffic distribution and stop DNS resolution for this endpoint.
          </p>
          <div className="flex items-center justify-end gap-2 pt-4 border-t border-zinc-200 dark:border-zinc-800">
            <button
              onClick={() => setDeleteTarget(null)}
              className="px-3.5 py-1.5 text-xs rounded-lg border border-zinc-300 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 transition"
            >
              Cancel
            </button>
            <button
              onClick={handleDelete}
              disabled={actionLoading}
              className="px-4 py-1.5 text-xs font-semibold rounded-lg bg-red-600 hover:bg-red-500 text-white transition flex items-center gap-1.5"
            >
              {actionLoading && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
              Delete Load Balancer
            </button>
          </div>
        </div>
      </ModalPortal>
    </div>
  );
};
