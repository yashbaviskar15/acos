import React, { useState, useEffect, useMemo } from 'react';
import { 
  Users, UserPlus, Shield, ShieldCheck, Trash2, RefreshCw, CheckCircle2, 
  AlertCircle, Search, Mail, KeyRound, Copy, Check, Clock
} from 'lucide-react';
import { ModalPortal } from '../components/ModalPortal';
import { DataTablePagination } from '../components/DataTablePagination';
import { apiFetch } from '../config/api';

interface IAMProps {
  token: string | null;
  user?: any;
}

interface MemberItem {
  id: string;
  email: string;
  full_name: string;
  role: 'SuperAdmin' | 'Admin' | 'Operator' | 'Developer' | 'Viewer';
  is_active: boolean;
  status: 'ACTIVE' | 'PENDING';
  joined_at: string;
  expires_at?: string;
  invited_by?: string;
}

export const IAM: React.FC<IAMProps> = ({ token, user }) => {
  const [activeSubTab, setActiveSubTab] = useState<'members' | 'roles' | 'audit'>('members');
  const [members, setMembers] = useState<MemberItem[]>([]);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [copiedToken, setCopiedToken] = useState<string | null>(null);

  // Search & Pagination
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Modals
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [generatedInviteLink, setGeneratedInviteLink] = useState<string | null>(null);
  const [deleteConfirmTarget, setDeleteConfirmTarget] = useState<MemberItem | null>(null);

  // Form State - Invite
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteName, setInviteName] = useState('');
  const [inviteRole, setInviteRole] = useState<'SuperAdmin' | 'Admin' | 'Operator' | 'Developer' | 'Viewer'>('Developer');

  const fetchMembers = async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const data = await apiFetch<any>('/api/v1/auth/workspace/members', { token });
      if (data && Array.isArray(data.members)) {
        setMembers(data.members);
      } else if (Array.isArray(data)) {
        setMembers(data);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to fetch workspace members');
    } finally {
      setLoading(false);
    }
  };

  const fetchAuditLogs = async () => {
    try {
      const data = await apiFetch<any[]>('/api/v1/auth/audit-logs', { token });
      setAuditLogs(Array.isArray(data) ? data : []);
    } catch {
      // Graceful fallback
    }
  };

  useEffect(() => {
    fetchMembers();
    fetchAuditLogs();
  }, [token]);

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail.trim() || !inviteEmail.includes('@')) {
      setErrorMsg('Please enter a valid work email address');
      return;
    }
    setActionLoading(true);
    setErrorMsg(null);
    try {
      const res = await apiFetch<any>('/api/v1/auth/workspace/members/invite', {
        token,
        method: 'POST',
        body: JSON.stringify({
          email: inviteEmail.trim().toLowerCase(),
          full_name: inviteName.trim(),
          role: inviteRole
        })
      });
      setSuccessMsg(res?.message || `Invitation successfully created for ${inviteEmail}`);
      if (res?.invite_link) {
        setGeneratedInviteLink(res.invite_link);
      }
      setInviteEmail('');
      setInviteName('');
      fetchMembers();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to send invitation');
    } finally {
      setActionLoading(false);
    }
  };

  const handleRoleChange = async (memberId: string, newRole: string) => {
    setActionLoading(true);
    setErrorMsg(null);
    try {
      await apiFetch(`/api/v1/auth/workspace/members/${memberId}/role`, {
        token,
        method: 'POST',
        body: JSON.stringify({ role: newRole })
      });
      setSuccessMsg(`Role updated to ${newRole}`);
      fetchMembers();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to update member role');
    } finally {
      setActionLoading(false);
    }
  };

  const handleRemoveMember = async () => {
    if (!deleteConfirmTarget) return;
    setActionLoading(true);
    setErrorMsg(null);
    try {
      await apiFetch(`/api/v1/auth/workspace/members/${deleteConfirmTarget.id}`, {
        token,
        method: 'DELETE'
      });
      setSuccessMsg(`Access revoked for ${deleteConfirmTarget.email}`);
      setDeleteConfirmTarget(null);
      fetchMembers();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to remove member');
    } finally {
      setActionLoading(false);
    }
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedToken('copied');
    setTimeout(() => setCopiedToken(null), 2000);
  };

  const filteredMembers = useMemo(() => {
    return members
      .filter(m => 
        m.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        m.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        m.role.toLowerCase().includes(searchTerm.toLowerCase()) ||
        m.status.toLowerCase().includes(searchTerm.toLowerCase())
      )
      .sort((a, b) => new Date(b.joined_at || 0).getTime() - new Date(a.joined_at || 0).getTime());
  }, [members, searchTerm]);

  const pagedMembers = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredMembers.slice(start, start + pageSize);
  }, [filteredMembers, page, pageSize]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-200 dark:border-zinc-800 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400">
              <ShieldCheck className="w-5 h-5" />
            </span>
            <h1 className="text-xl sm:text-2xl font-bold text-zinc-900 dark:text-white">
              ArvIAM — Identity & Access Management
            </h1>
          </div>
          <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
            Enterprise multi-tenant role-based access control, cryptographic team invitations, and audit telemetry.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => fetchMembers()}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800/80 text-zinc-700 dark:text-zinc-200 hover:bg-zinc-50 dark:hover:bg-zinc-700 transition"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          <button
            onClick={() => {
              setGeneratedInviteLink(null);
              setShowInviteModal(true);
            }}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-lg bg-amber-600 hover:bg-amber-500 text-white shadow-sm transition"
          >
            <UserPlus className="w-3.5 h-3.5" />
            Invite Member
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
            <span>Workspace Members</span>
            <Users className="w-4 h-4 text-amber-500" />
          </div>
          <p className="mt-2 text-2xl font-bold text-zinc-900 dark:text-white">
            {members.filter(m => m.status === 'ACTIVE').length}
          </p>
          <p className="text-xs text-zinc-500 mt-1">Active team collaborators</p>
        </div>

        <div className="p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/60 shadow-sm">
          <div className="flex items-center justify-between text-zinc-500 dark:text-zinc-400 text-xs font-medium">
            <span>Pending Invites</span>
            <Mail className="w-4 h-4 text-blue-500" />
          </div>
          <p className="mt-2 text-2xl font-bold text-zinc-900 dark:text-white">
            {members.filter(m => m.status === 'PENDING').length}
          </p>
          <p className="text-xs text-zinc-500 mt-1">Awaiting registration acceptance</p>
        </div>

        <div className="p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/60 shadow-sm">
          <div className="flex items-center justify-between text-zinc-500 dark:text-zinc-400 text-xs font-medium">
            <span>Privileged Roles</span>
            <Shield className="w-4 h-4 text-purple-500" />
          </div>
          <p className="mt-2 text-2xl font-bold text-zinc-900 dark:text-white">
            {members.filter(m => m.role === 'SuperAdmin' || m.role === 'Admin').length}
          </p>
          <p className="text-xs text-zinc-500 mt-1">SuperAdmin & Admin tiers</p>
        </div>

        <div className="p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/60 shadow-sm">
          <div className="flex items-center justify-between text-zinc-500 dark:text-zinc-400 text-xs font-medium">
            <span>RBAC Matrix</span>
            <KeyRound className="w-4 h-4 text-emerald-500" />
          </div>
          <p className="mt-2 text-2xl font-bold text-zinc-900 dark:text-white">
            5 Tiers
          </p>
          <p className="text-xs text-zinc-500 mt-1">Fine-grained API isolation</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-zinc-200 dark:border-zinc-800">
        <button
          onClick={() => { setActiveSubTab('members'); setPage(1); }}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs sm:text-sm font-semibold border-b-2 transition ${
            activeSubTab === 'members'
              ? 'border-amber-500 text-amber-600 dark:text-amber-400'
              : 'border-transparent text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
          }`}
        >
          <Users className="w-4 h-4" />
          Workspace Members & Invites ({members.length})
        </button>
        <button
          onClick={() => setActiveSubTab('roles')}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs sm:text-sm font-semibold border-b-2 transition ${
            activeSubTab === 'roles'
              ? 'border-amber-500 text-amber-600 dark:text-amber-400'
              : 'border-transparent text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
          }`}
        >
          <Shield className="w-4 h-4" />
          RBAC Role Hierarchy & Matrix
        </button>
        <button
          onClick={() => setActiveSubTab('audit')}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs sm:text-sm font-semibold border-b-2 transition ${
            activeSubTab === 'audit'
              ? 'border-amber-500 text-amber-600 dark:text-amber-400'
              : 'border-transparent text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
          }`}
        >
          <Clock className="w-4 h-4" />
          Security Audit Logs ({auditLogs.length})
        </button>
      </div>

      {/* Subtab 1: Members Table */}
      {activeSubTab === 'members' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-3">
            <div className="relative flex-1 max-w-sm">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search member by email, name, role..."
                className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-amber-500"
              />
            </div>
          </div>

          <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-zinc-600 dark:text-zinc-300">
                <thead className="bg-zinc-50 dark:bg-zinc-800/60 text-zinc-500 dark:text-zinc-400 border-b border-zinc-200 dark:border-zinc-800">
                  <tr>
                    <th className="py-3 px-4 font-semibold">User / Collaborator</th>
                    <th className="py-3 px-4 font-semibold">Role Tier</th>
                    <th className="py-3 px-4 font-semibold">Status</th>
                    <th className="py-3 px-4 font-semibold">Joined / Invited Date</th>
                    <th className="py-3 px-4 font-semibold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
                  {pagedMembers.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-zinc-400">
                        {loading ? 'Loading workspace members...' : 'No members found.'}
                      </td>
                    </tr>
                  ) : (
                    pagedMembers.map((member) => (
                      <tr key={member.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/40 transition">
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-amber-500 to-amber-700 text-white flex items-center justify-center font-bold text-xs shrink-0">
                              {member.full_name?.charAt(0)?.toUpperCase() || member.email?.charAt(0)?.toUpperCase() || 'U'}
                            </div>
                            <div>
                              <div className="font-semibold text-zinc-900 dark:text-white flex items-center gap-1.5">
                                <span>{member.full_name || 'Team Member'}</span>
                                {member.email === user?.email && (
                                  <span className="px-1.5 py-0.2 rounded bg-amber-500/10 text-amber-600 dark:text-amber-400 text-[10px] font-semibold">
                                    You
                                  </span>
                                )}
                              </div>
                              <div className="font-mono text-[11px] text-zinc-400">{member.email}</div>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <select
                            value={member.role}
                            onChange={(e) => handleRoleChange(member.id, e.target.value)}
                            disabled={actionLoading || member.email === user?.email}
                            className="px-2 py-1 text-xs font-semibold rounded border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 focus:ring-1 focus:ring-amber-500 outline-none cursor-pointer"
                          >
                            <option value="SuperAdmin">SuperAdmin</option>
                            <option value="Admin">Admin</option>
                            <option value="Operator">Operator</option>
                            <option value="Developer">Developer</option>
                            <option value="Viewer">Viewer</option>
                          </select>
                        </td>
                        <td className="py-3 px-4">
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                            member.status === 'ACTIVE'
                              ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                              : 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20'
                          }`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${member.status === 'ACTIVE' ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                            {member.status}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-zinc-400 text-[11px]">
                          {member.joined_at ? new Date(member.joined_at).toLocaleDateString() : 'Active'}
                        </td>
                        <td className="py-3 px-4 text-right">
                          {member.email !== user?.email && (
                            <button
                              onClick={() => setDeleteConfirmTarget(member)}
                              className="p-1.5 text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 rounded transition"
                              title={member.status === 'PENDING' ? 'Revoke Invite' : 'Remove Member'}
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            <DataTablePagination
              currentPage={page}
              totalItems={filteredMembers.length}
              pageSize={pageSize}
              onPageChange={setPage}
              onPageSizeChange={setPageSize}
            />
          </div>
        </div>
      )}

      {/* Subtab 2: Role Matrix */}
      {activeSubTab === 'roles' && (
        <div className="space-y-4">
          <div className="p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm">
            <h3 className="text-sm font-bold text-zinc-900 dark:text-white flex items-center gap-2">
              <Shield className="w-4 h-4 text-amber-500" />
              Hierarchical 5-Tier RBAC Privilege Matrix
            </h3>
            <p className="text-xs text-zinc-500 mt-1">
              Roles strictly enforce principle of least privilege (PoLP) across compute, networking, storage, secrets, and billing APIs.
            </p>

            <div className="mt-4 grid grid-cols-1 md:grid-cols-5 gap-3">
              <div className="p-3 rounded-lg border border-purple-500/30 bg-purple-500/5">
                <span className="text-xs font-bold text-purple-600 dark:text-purple-400">SuperAdmin</span>
                <p className="text-[11px] text-zinc-500 mt-1">Full control of org, billing wallets, IAM elevation, and datacenter infrastructure.</p>
                <div className="mt-2 text-[10px] text-zinc-400">Scope: Unrestricted</div>
              </div>

              <div className="p-3 rounded-lg border border-blue-500/30 bg-blue-500/5">
                <span className="text-xs font-bold text-blue-600 dark:text-blue-400">Admin</span>
                <p className="text-[11px] text-zinc-500 mt-1">Can invite operators/developers, provision resources, manage VPCs and clusters.</p>
                <div className="mt-2 text-[10px] text-zinc-400">Scope: Workspace Admin</div>
              </div>

              <div className="p-3 rounded-lg border border-emerald-500/30 bg-emerald-500/5">
                <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">Operator</span>
                <p className="text-[11px] text-zinc-500 mt-1">Manage running VM instances, start/stop/reboot workloads, trigger CI/CD pipelines.</p>
                <div className="mt-2 text-[10px] text-zinc-400">Scope: Operations</div>
              </div>

              <div className="p-3 rounded-lg border border-amber-500/30 bg-amber-500/5">
                <span className="text-xs font-bold text-amber-600 dark:text-amber-400">Developer</span>
                <p className="text-[11px] text-zinc-500 mt-1">Deploy serverless functions, upload storage objects, manage databases and app logs.</p>
                <div className="mt-2 text-[10px] text-zinc-400">Scope: App Dev</div>
              </div>

              <div className="p-3 rounded-lg border border-zinc-500/30 bg-zinc-500/5">
                <span className="text-xs font-bold text-zinc-600 dark:text-zinc-400">Viewer</span>
                <p className="text-[11px] text-zinc-500 mt-1">Read-only visibility for dashboards, telemetry graphs, and compliance reports.</p>
                <div className="mt-2 text-[10px] text-zinc-400">Scope: Read-Only</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Subtab 3: Audit Trail */}
      {activeSubTab === 'audit' && (
        <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-zinc-600 dark:text-zinc-300">
              <thead className="bg-zinc-50 dark:bg-zinc-800/60 text-zinc-500 dark:text-zinc-400 border-b border-zinc-200 dark:border-zinc-800">
                <tr>
                  <th className="py-3 px-4 font-semibold">Timestamp</th>
                  <th className="py-3 px-4 font-semibold">Actor Email</th>
                  <th className="py-3 px-4 font-semibold">Action</th>
                  <th className="py-3 px-4 font-semibold">Service</th>
                  <th className="py-3 px-4 font-semibold">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
                {auditLogs.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-zinc-400">
                      No security audit events recorded yet.
                    </td>
                  </tr>
                ) : (
                  auditLogs.slice(0, 15).map((log, idx) => (
                    <tr key={log.id || idx} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/40 transition">
                      <td className="py-3 px-4 font-mono text-[11px] text-zinc-400">
                        {log.timestamp ? new Date(log.timestamp).toLocaleString() : 'Recent'}
                      </td>
                      <td className="py-3 px-4 font-semibold text-zinc-900 dark:text-white">
                        {log.user_email || 'System'}
                      </td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                          {log.action}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-mono text-zinc-500">
                        {log.resource || 'IAM'}
                      </td>
                      <td className="py-3 px-4 text-zinc-700 dark:text-zinc-300 max-w-sm truncate">
                        {log.details || 'Identity event recorded'}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal: Invite Member */}
      <ModalPortal isOpen={showInviteModal} onClose={() => setShowInviteModal(false)}>
        <form onSubmit={handleInvite} className="space-y-4">
          <div className="flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800 pb-3">
            <div className="flex items-center gap-2">
              <UserPlus className="w-5 h-5 text-amber-500" />
              <h3 className="text-base font-bold text-zinc-900 dark:text-white">Invite Team Member</h3>
            </div>
            <button type="button" onClick={() => setShowInviteModal(false)} className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 text-sm">✕</button>
          </div>

          {generatedInviteLink ? (
            <div className="space-y-3 py-2">
              <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-700 dark:text-emerald-400 text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>Invitation link created! Share this secure URL with your colleague:</span>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  readOnly
                  value={generatedInviteLink}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 font-mono"
                />
                <button
                  type="button"
                  onClick={() => handleCopy(generatedInviteLink)}
                  className="p-2 text-xs rounded-lg bg-amber-600 hover:bg-amber-500 text-white font-medium flex items-center gap-1 shrink-0"
                >
                  {copiedToken ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  {copiedToken ? 'Copied' : 'Copy'}
                </button>
              </div>
              <div className="flex justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setShowInviteModal(false)}
                  className="px-4 py-1.5 text-xs font-semibold rounded-lg bg-zinc-800 text-white hover:bg-zinc-700 transition"
                >
                  Done
                </button>
              </div>
            </div>
          ) : (
            <>
              <div>
                <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">Work Email Address</label>
                <input
                  type="email"
                  required
                  placeholder="e.g. dev@company.com"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white focus:ring-1 focus:ring-amber-500 outline-none font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">Full Name (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. Sarah Connor"
                  value={inviteName}
                  onChange={(e) => setInviteName(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white focus:ring-1 focus:ring-amber-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">Assign Role</label>
                <select
                  value={inviteRole}
                  onChange={(e: any) => setInviteRole(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white focus:ring-1 focus:ring-amber-500 outline-none font-medium"
                >
                  <option value="SuperAdmin">SuperAdmin — Complete Administrative Access</option>
                  <option value="Admin">Admin — Manage Resources & Invite Team</option>
                  <option value="Operator">Operator — Manage Running Cloud Instances</option>
                  <option value="Developer">Developer — Build, Deploy & Access DBs</option>
                  <option value="Viewer">Viewer — Read-Only Observability & Reports</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-zinc-200 dark:border-zinc-800">
                <button
                  type="button"
                  onClick={() => setShowInviteModal(false)}
                  className="px-3.5 py-1.5 text-xs rounded-lg border border-zinc-300 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-4 py-1.5 text-xs font-semibold rounded-lg bg-amber-600 hover:bg-amber-500 text-white transition flex items-center gap-1.5"
                >
                  {actionLoading && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                  Create & Send Invite
                </button>
              </div>
            </>
          )}
        </form>
      </ModalPortal>

      {/* Delete / Revoke Modal */}
      <ModalPortal isOpen={Boolean(deleteConfirmTarget)} onClose={() => setDeleteConfirmTarget(null)}>
        <div className="space-y-4">
          <div className="flex items-center gap-3 text-red-600 dark:text-red-400">
            <AlertCircle className="w-6 h-6 shrink-0" />
            <h3 className="text-base font-bold text-zinc-900 dark:text-white">
              {deleteConfirmTarget?.status === 'PENDING' ? 'Revoke Invitation' : 'Remove Workspace Member'}
            </h3>
          </div>
          <p className="text-xs text-zinc-600 dark:text-zinc-300">
            Are you sure you want to revoke access for <span className="font-semibold text-zinc-900 dark:text-white">{deleteConfirmTarget?.email}</span>? 
            {deleteConfirmTarget?.status === 'ACTIVE' 
              ? ' This user will immediately lose access to all cloud resources, databases, and APIs in this workspace.'
              : ' The invitation token will be cancelled and cannot be used.'}
          </p>
          <div className="flex items-center justify-end gap-2 pt-4 border-t border-zinc-200 dark:border-zinc-800">
            <button
              onClick={() => setDeleteConfirmTarget(null)}
              className="px-3.5 py-1.5 text-xs rounded-lg border border-zinc-300 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 transition"
            >
              Cancel
            </button>
            <button
              onClick={handleRemoveMember}
              disabled={actionLoading}
              className="px-4 py-1.5 text-xs font-semibold rounded-lg bg-red-600 hover:bg-red-500 text-white transition flex items-center gap-1.5"
            >
              {actionLoading && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
              Revoke Access
            </button>
          </div>
        </div>
      </ModalPortal>
    </div>
  );
};
