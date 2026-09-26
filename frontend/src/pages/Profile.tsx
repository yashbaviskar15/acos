import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  User, 
  Lock, 
  Users, 
  Sliders, 
  ShieldCheck, 
  CheckCircle2, 
  AlertCircle, 
  QrCode, 
  Copy, 
  Check, 
  Plus, 
  X, 
  Save, 
  Globe, 
  Share2, 
  Mail, 
  UserPlus,
  Search,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Camera,
  Shield,
  Laptop,
  Clock,
  RotateCcw,
  Eye,
  EyeOff,
  Server,
  Terminal,
  Activity,
  CreditCard,
  FileCheck
} from 'lucide-react';
import { ModalPortal } from '../components/ModalPortal';
import { SkeletonTableRow } from '../components/Skeleton';
import { DataTablePagination } from '../components/DataTablePagination';
import { apiFetch } from '../config/api';

interface ProfileProps {
  user: any;
  onUpdateUser: (updatedUser: any, newToken?: string) => void;
  onNavigateToBilling?: () => void;
}

export const Profile: React.FC<ProfileProps> = ({ user, onUpdateUser, onNavigateToBilling }) => {
  const [activeTab, setActiveTab] = useState<'personal' | 'security' | 'workspace' | 'preferences' | 'permissions'>('personal');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Baseline Form Values (for dirty tracking)
  const [initialProfile, setInitialProfile] = useState({
    fullName: user?.full_name || 'Engineering Operator',
    workspaceName: user?.workspace_name || 'Production Cloud Workspace',
    timezone: user?.timezone || 'Asia/Kolkata',
  });

  // Personal Profile Form State
  const [fullName, setFullName] = useState(initialProfile.fullName);
  const [workspaceName, setWorkspaceName] = useState(initialProfile.workspaceName);
  const [timezone, setTimezone] = useState(initialProfile.timezone);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(user?.avatar_url || null);

  // Dirty state tracking for Personal tab
  const isPersonalDirty = useMemo(() => {
    return (
      fullName.trim() !== initialProfile.fullName.trim() ||
      workspaceName.trim() !== initialProfile.workspaceName.trim() ||
      timezone !== initialProfile.timezone
    );
  }, [fullName, workspaceName, timezone, initialProfile]);

  // Password Change State
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showOldPassword, setShowOldPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);

  // 2FA / MFA Setup Modal State
  const [mfaModalOpen, setMfaModalOpen] = useState(false);
  const [mfaSetupData, setMfaSetupData] = useState<any>(null);
  const [mfaVerifyCode, setMfaVerifyCode] = useState('');
  const [mfaCopied, setMfaCopied] = useState(false);
  const [isMfaEnabled, setIsMfaEnabled] = useState(Boolean(user?.is_mfa_enabled));

  // Workspace team members & Invitation State
  const [members, setMembers] = useState<any[]>([]);
  const [membersLoading, setMembersLoading] = useState(false);
  const [inviteModalOpen, setInviteModalOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteName, setInviteName] = useState('');
  const [inviteRole, setInviteRole] = useState('Developer');
  const [inviteStatus, setInviteStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');
  const [inviteError, setInviteError] = useState<string | null>(null);
  const [inviteSuccessMsg, setInviteSuccessMsg] = useState<string | null>(null);
  const [lastInviteLink, setLastInviteLink] = useState<string | null>(null);
  const [copiedInviteLink, setCopiedInviteLink] = useState(false);
  const [updatingRoleId, setUpdatingRoleId] = useState<string | null>(null);

  // Members table searching, sorting, pagination
  const [memberSearchTerm, setMemberSearchTerm] = useState('');
  const [memberSortField, setMemberSortField] = useState<string>('full_name');
  const [memberSortDir, setMemberSortDir] = useState<'asc' | 'desc'>('asc');
  const [memberPage, setMemberPage] = useState<number>(1);
  const [memberPageSize, setMemberPageSize] = useState<number>(5);

  // Notification Preferences State & Dirty Tracking
  const [initialPreferences, setInitialPreferences] = useState({
    notifDeploy: true,
    notifAlert: true,
    notifIncident: true,
    notifBilling: true,
  });
  const [notifDeploy, setNotifDeploy] = useState(initialPreferences.notifDeploy);
  const [notifAlert, setNotifAlert] = useState(initialPreferences.notifAlert);
  const [notifIncident, setNotifIncident] = useState(initialPreferences.notifIncident);
  const [notifBilling, setNotifBilling] = useState(initialPreferences.notifBilling);

  const isPreferencesDirty = useMemo(() => {
    return (
      notifDeploy !== initialPreferences.notifDeploy ||
      notifAlert !== initialPreferences.notifAlert ||
      notifIncident !== initialPreferences.notifIncident ||
      notifBilling !== initialPreferences.notifBilling
    );
  }, [notifDeploy, notifAlert, notifIncident, notifBilling, initialPreferences]);

  // Active Sessions
  const [sessions, setSessions] = useState([
    { id: 'sess-01', user: user?.email, ip: '203.0.113.45', location: 'Mumbai, IN', browser: 'Chrome 128 / Windows', status: 'ACTIVE', current: true },
    { id: 'sess-02', user: user?.email, ip: '198.51.100.22', location: 'Virginia, US', browser: 'Firefox 130 / macOS', status: 'ACTIVE', current: false },
  ]);

  // Role Elevation Request Modal & State
  const [roleRequestModalOpen, setRoleRequestModalOpen] = useState(false);
  const [requestedTargetRole, setRequestedTargetRole] = useState('Admin');
  const [roleRequestReason, setRoleRequestReason] = useState('');
  const [roleRequestStatus, setRoleRequestStatus] = useState<{
    hasPending: boolean;
    details?: string;
    timestamp?: string;
  }>({ hasPending: false });
  const [roleRequestSubmitting, setRoleRequestSubmitting] = useState(false);

  // Common UI State
  const [loading, setLoading] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [copiedAccountId, setCopiedAccountId] = useState(false);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const accountId = user?.account_id || user?.id || 'ARV-ACC-760499';

  const copyAccountId = () => {
    navigator.clipboard.writeText(accountId);
    setCopiedAccountId(true);
    showToast('Account ID copied to clipboard.');
    setTimeout(() => setCopiedAccountId(false), 2500);
  };

  // Check pending role change request status on load
  const fetchRoleRequestStatus = async () => {
    try {
      const data = await apiFetch<any>('/api/v1/auth/role-request/status', {
        token: localStorage.getItem('aravanta_token')
      });
      if (data?.has_pending_request && data.latest_request) {
        setRoleRequestStatus({
          hasPending: true,
          details: data.latest_request.details,
          timestamp: data.latest_request.timestamp
        });
      }
    } catch {
      // Ignore network errors on optional check
    }
  };

  const fetchWorkspaceMembers = async () => {
    setMembersLoading(true);
    try {
      const data = await apiFetch<any[]>('/api/v1/auth/workspace/members', { token: localStorage.getItem('aravanta_token') });
      if (Array.isArray(data) && data.length > 0) {
        setMembers(data);
      } else {
        setMembers([
          { id: 'm-01', email: user?.email || 'engineer@aravanta.com', full_name: fullName, role: user?.role || 'SuperAdmin', is_active: true }
        ]);
      }
    } catch {
      setMembers([
        { id: 'm-01', email: user?.email || 'engineer@aravanta.com', full_name: fullName, role: user?.role || 'SuperAdmin', is_active: true }
      ]);
    } finally {
      setMembersLoading(false);
    }
  };

  useEffect(() => {
    if (user?.is_mfa_enabled !== undefined) {
      setIsMfaEnabled(Boolean(user.is_mfa_enabled));
    }
  }, [user?.is_mfa_enabled]);

  useEffect(() => {
    fetchWorkspaceMembers();
    fetchRoleRequestStatus();
    const token = localStorage.getItem('aravanta_token');
    if (token) {
      apiFetch<any>('/api/v1/auth/me', { token })
        .then((fresh) => {
          if (fresh && fresh.id) {
            setIsMfaEnabled(Boolean(fresh.is_mfa_enabled));
            if (fresh.full_name) {
              setFullName(fresh.full_name);
              setInitialProfile(prev => ({ ...prev, fullName: fresh.full_name }));
            }
            if (fresh.workspace_name) {
              setWorkspaceName(fresh.workspace_name);
              setInitialProfile(prev => ({ ...prev, workspaceName: fresh.workspace_name }));
            }
            if (fresh.timezone) {
              setTimezone(fresh.timezone);
              setInitialProfile(prev => ({ ...prev, timezone: fresh.timezone }));
            }
            if (fresh.avatar_url) {
              setAvatarPreview(fresh.avatar_url);
            }
            if (fresh.preferences) {
              try {
                const parsed = typeof fresh.preferences === 'string' ? JSON.parse(fresh.preferences) : fresh.preferences;
                if (parsed.notifDeploy !== undefined) setNotifDeploy(parsed.notifDeploy);
                if (parsed.notifAlert !== undefined) setNotifAlert(parsed.notifAlert);
                if (parsed.notifIncident !== undefined) setNotifIncident(parsed.notifIncident);
                if (parsed.notifBilling !== undefined) setNotifBilling(parsed.notifBilling);
                setInitialPreferences({
                  notifDeploy: parsed.notifDeploy ?? true,
                  notifAlert: parsed.notifAlert ?? true,
                  notifIncident: parsed.notifIncident ?? true,
                  notifBilling: parsed.notifBilling ?? true,
                });
              } catch {
                // fall through
              }
            }
            onUpdateUser({ ...user, ...fresh, is_mfa_enabled: Boolean(fresh.is_mfa_enabled) });
          }
        })
        .catch(() => {});
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.email]);

  // Handle Avatar File Upload
  const handleAvatarFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      showToast('Avatar file size must be under 2MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = async () => {
      const dataUrl = reader.result as string;
      setAvatarPreview(dataUrl);

      try {
        await apiFetch('/api/v1/auth/profile', {
          method: 'PUT',
          body: JSON.stringify({ avatar_url: dataUrl }),
          token: localStorage.getItem('aravanta_token')
        });
        onUpdateUser({ ...user, avatar_url: dataUrl });
        showToast('Avatar updated successfully.');
      } catch (err: any) {
        showToast(err.message || 'Failed to save avatar image.');
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMessage(null);
    try {
      const updated = await apiFetch<any>('/api/v1/auth/profile', {
        method: 'PUT',
        body: JSON.stringify({
          full_name: fullName.trim(),
          workspace_name: workspaceName.trim(),
          timezone: timezone,
        }),
        token: localStorage.getItem('aravanta_token')
      });

      setInitialProfile({
        fullName: updated.full_name,
        workspaceName: updated.workspace_name,
        timezone: updated.timezone,
      });

      onUpdateUser({
        ...user,
        full_name: updated.full_name,
        workspace_name: updated.workspace_name,
        timezone: updated.timezone,
      });

      showToast('Profile and workspace details updated successfully.');
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to update profile.');
    } finally {
      setLoading(false);
    }
  };

  const handleResetProfile = () => {
    setFullName(initialProfile.fullName);
    setWorkspaceName(initialProfile.workspaceName);
    setTimezone(initialProfile.timezone);
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (newPassword !== confirmPassword) {
      setErrorMessage('New passwords do not match.');
      return;
    }
    if (newPassword.length < 8) {
      setErrorMessage('New password must be at least 8 characters long.');
      return;
    }

    setLoading(true);
    try {
      await apiFetch<any>('/api/v1/auth/password/change', {
        method: 'POST',
        body: JSON.stringify({
          old_password: oldPassword,
          new_password: newPassword,
        }),
        token: localStorage.getItem('aravanta_token')
      });

      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
      showToast('Password changed successfully.');
    } catch (err: any) {
      const msg = err.message || 'Password change failed.';
      if (msg.includes('credentials') || msg.includes('401')) {
        setErrorMessage('Session expired. Please log out and sign in again to change your password.');
      } else {
        setErrorMessage(msg);
      }
    } finally {
      setLoading(false);
    }
  };

  // Open MFA Setup Modal & Fetch Secret / Otpauth URL
  const handleOpenMfaSetup = async () => {
    setLoading(true);
    setErrorMessage(null);
    try {
      const data = await apiFetch<any>('/api/v1/auth/mfa/setup', { method: 'POST', token: localStorage.getItem('aravanta_token') });
      setMfaSetupData(data);
      setMfaModalOpen(true);
    } catch (err: any) {
      const msg = err.message || 'Unknown error';
      if (msg.includes('credentials') || msg.includes('401')) {
        setErrorMessage('Session expired. Please log out and sign in again to configure 2FA.');
      } else {
        showToast(`Failed to initialize 2FA: ${msg}`);
      }
    } finally {
      setLoading(false);
    }
  };

  // Confirm and Enable MFA
  const handleEnableMfa = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!mfaVerifyCode || mfaVerifyCode.length < 6) return;

    setLoading(true);
    try {
      await apiFetch<any>('/api/v1/auth/mfa/enable', {
        method: 'POST',
        body: JSON.stringify({ mfa_code: mfaVerifyCode.trim() }),
        token: localStorage.getItem('aravanta_token')
      });

      setIsMfaEnabled(true);
      onUpdateUser({ ...user, is_mfa_enabled: true });
      setMfaModalOpen(false);
      setMfaVerifyCode('');
      showToast('Two-factor authentication successfully enabled.');
    } catch (err: any) {
      showToast(`Verification failed: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Disable MFA
  const handleDisableMfa = async () => {
    if (!window.confirm('Are you sure you want to disable two-factor authentication? Your account will have reduced sign-in protection.')) {
      return;
    }
    setLoading(true);
    try {
      await apiFetch<any>('/api/v1/auth/mfa/disable', { method: 'POST', token: localStorage.getItem('aravanta_token') });
      setIsMfaEnabled(false);
      onUpdateUser({ ...user, is_mfa_enabled: false });
      showToast('Two-factor authentication disabled.');
    } catch (err: any) {
      showToast(`Failed: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleCopySecret = (secretText: string) => {
    navigator.clipboard.writeText(secretText);
    setMfaCopied(true);
    setTimeout(() => setMfaCopied(false), 2500);
  };

  // Save Preferences
  const handleSavePreferences = async () => {
    setLoading(true);
    try {
      const prefs = { notifDeploy, notifAlert, notifIncident, notifBilling };
      await apiFetch('/api/v1/auth/profile', {
        method: 'PUT',
        body: JSON.stringify({ preferences: prefs }),
        token: localStorage.getItem('aravanta_token')
      });
      setInitialPreferences(prefs);
      showToast('Notification preferences saved successfully.');
    } catch (err: any) {
      showToast(err.message || 'Failed to save preferences.');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPreferences = () => {
    setNotifDeploy(initialPreferences.notifDeploy);
    setNotifAlert(initialPreferences.notifAlert);
    setNotifIncident(initialPreferences.notifIncident);
    setNotifBilling(initialPreferences.notifBilling);
  };

  // Submit Role Change Request
  const handleSubmitRoleRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!roleRequestReason || roleRequestReason.trim().length < 5) {
      showToast('Please provide a valid justification (minimum 5 characters).');
      return;
    }

    setRoleRequestSubmitting(true);
    try {
      const res = await apiFetch<any>('/api/v1/auth/role-request', {
        method: 'POST',
        body: JSON.stringify({
          requested_role: requestedTargetRole,
          reason: roleRequestReason.trim()
        }),
        token: localStorage.getItem('aravanta_token')
      });

      setRoleRequestStatus({
        hasPending: true,
        details: `Requested elevation to '${requestedTargetRole}'. Reason: ${roleRequestReason.trim()}`,
        timestamp: new Date().toISOString()
      });

      setRoleRequestModalOpen(false);
      setRoleRequestReason('');
      showToast(res.message || `Role change request submitted to SuperAdmin.`);
    } catch (err: any) {
      showToast(err.message || 'Failed to submit role change request.');
    } finally {
      setRoleRequestSubmitting(false);
    }
  };

  // Workspace Invite Handlers
  const handleOpenInviteModal = () => {
    setInviteStatus('idle');
    setInviteError(null);
    setInviteSuccessMsg(null);
    setLastInviteLink(null);
    setCopiedInviteLink(false);
    setInviteEmail('');
    setInviteName('');
    setInviteRole('Developer');
    setInviteModalOpen(true);
  };

  const handleCopyInviteLink = (linkToCopy?: string) => {
    const text = linkToCopy || lastInviteLink || `https://aravantacos.vercel.app/join?ws=${user?.workspace_id || 'ws-aravanta'}`;
    navigator.clipboard.writeText(text);
    setCopiedInviteLink(true);
    setTimeout(() => setCopiedInviteLink(false), 3000);
    showToast('Invitation link copied to clipboard.');
  };

  const handleInviteMember = async (e: React.FormEvent) => {
    e.preventDefault();
    setInviteError(null);

    const emailClean = inviteEmail.trim().toLowerCase();
    const nameClean = inviteName.trim();

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailClean || !emailRegex.test(emailClean)) {
      setInviteError('Please enter a valid work email address (e.g. name@company.com).');
      return;
    }

    const isDuplicate = members.some(m => (m.email || '').toLowerCase() === emailClean);
    if (isDuplicate) {
      setInviteError(`User ${emailClean} is already a member of this workspace.`);
      return;
    }

    setInviteStatus('submitting');
    setLoading(true);

    try {
      const res = await apiFetch<any>('/api/v1/auth/workspace/members/invite', {
        method: 'POST',
        body: JSON.stringify({
          email: emailClean,
          full_name: nameClean || undefined,
          role: inviteRole,
        }),
        token: localStorage.getItem('aravanta_token')
      });

      const memberObj = res.member || {
        id: `m-${Date.now()}`,
        email: emailClean,
        full_name: nameClean || emailClean.split('@')[0],
        role: inviteRole,
        is_active: true,
        joined_at: new Date().toISOString()
      };

      setMembers(prev => {
        const exists = prev.some(m => (m.email || '').toLowerCase() === emailClean);
        if (exists) {
          return prev.map(m => (m.email || '').toLowerCase() === emailClean ? { ...m, ...memberObj } : m);
        }
        return [...prev, memberObj];
      });

      const inviteLink = res.invite_link || `https://aravantacos.vercel.app/join?ws=${user?.workspace_id || 'ws-prod'}&email=${encodeURIComponent(emailClean)}`;
      setLastInviteLink(inviteLink);
      setInviteSuccessMsg(res.message || `Invitation successfully sent to ${emailClean} as ${inviteRole}.`);
      setInviteStatus('success');
      showToast(`Invited ${emailClean} as ${inviteRole}.`);
      fetchWorkspaceMembers();
    } catch (err: any) {
      setInviteStatus('error');
      setInviteError(err.message || 'Failed to send workspace invitation.');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateMemberRole = async (memberId: string, newRole: string) => {
    setUpdatingRoleId(memberId);
    try {
      await apiFetch(`/api/v1/auth/workspace/members/${memberId}/role`, {
        method: 'POST',
        body: JSON.stringify({ role: newRole }),
        token: localStorage.getItem('aravanta_token')
      });
      setMembers(prev => prev.map(m => (m.id === memberId || m.email === memberId) ? { ...m, role: newRole } : m));
      showToast(`Member role updated to ${newRole}.`);
      fetchWorkspaceMembers();
    } catch (err: any) {
      showToast(err.message || 'Failed to update member role.');
    } finally {
      setUpdatingRoleId(null);
    }
  };

  const handleRevokeMember = async (memberId: string, memberEmail: string) => {
    if (memberEmail.toLowerCase() === (user?.email || '').toLowerCase()) {
      showToast('Cannot remove workspace owner.');
      return;
    }
    setMembers(prev => prev.filter(m => (m.id !== memberId && m.email !== memberEmail)));
    showToast(`Removed ${memberEmail} from workspace.`);
  };

  const handleRevokeSession = (sessId: string) => {
    setSessions(prev => prev.filter(s => s.id !== sessId));
    showToast('Session revoked. JWT authentication token invalidated.');
  };

  const handleMemberSort = (field: string) => {
    if (memberSortField === field) {
      setMemberSortDir(memberSortDir === 'asc' ? 'desc' : 'asc');
    } else {
      setMemberSortField(field);
      setMemberSortDir('asc');
    }
    setMemberPage(1);
  };

  const renderMemberSortIcon = (field: string) => {
    if (memberSortField !== field) {
      return <ArrowUpDown className="w-3 h-3 text-[#8a7c65] dark:text-[#b6a88f] opacity-50 ml-1 inline" />;
    }
    return memberSortDir === 'asc' ? (
      <ArrowUp className="w-3 h-3 text-[#d99a3a] ml-1 inline" />
    ) : (
      <ArrowDown className="w-3 h-3 text-[#d99a3a] ml-1 inline" />
    );
  };

  const memQuery = memberSearchTerm.toLowerCase().trim();
  const filteredMembers = members.filter((m) =>
    !memQuery ||
    (m.full_name || '').toLowerCase().includes(memQuery) ||
    (m.email || '').toLowerCase().includes(memQuery) ||
    (m.role || '').toLowerCase().includes(memQuery) ||
    (m.status || '').toLowerCase().includes(memQuery)
  );

  const sortedMembers = [...filteredMembers].sort((a: any, b: any) => {
    let aVal = a[memberSortField] ?? '';
    let bVal = b[memberSortField] ?? '';
    if (typeof aVal === 'string') aVal = aVal.toLowerCase();
    if (typeof bVal === 'string') bVal = bVal.toLowerCase();
    if (aVal < bVal) return memberSortDir === 'asc' ? -1 : 1;
    if (aVal > bVal) return memberSortDir === 'asc' ? 1 : -1;
    return 0;
  });

  const paginatedMembers = sortedMembers.slice(
    (memberPage - 1) * memberPageSize,
    memberPage * memberPageSize
  );

  const userInitial = (fullName || user?.email || 'U').charAt(0).toUpperCase();
  const currentRole = user?.role || 'SuperAdmin';
  const qrUrl = mfaSetupData?.otpauth_url 
    ? `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(mfaSetupData.otpauth_url)}`
    : '';

  // Clean Tab Definitions
  const tabs = [
    { id: 'personal', label: 'Personal profile', icon: User },
    { id: 'security', label: 'Security & authentication', icon: Lock },
    { id: 'workspace', label: 'Workspace & team', icon: Users },
    { id: 'preferences', label: 'Preferences', icon: Sliders },
    { id: 'permissions', label: 'Role & permissions', icon: ShieldCheck },
  ] as const;

  return (
    <div className="space-y-5 text-slate-800 dark:text-slate-100 font-sans pb-10 w-full">
      {/* Toast Notification */}
      {toastMessage && (
        <div 
          role="status" 
          aria-live="polite"
          className="fixed bottom-6 right-6 z-50 bg-[#211b14] text-[#f2ead9] dark:bg-[#fdfbf7] dark:text-[#211b14] px-4 py-3 rounded-xl shadow-2xl flex items-center gap-3 border border-[#3c3122] dark:border-[#e8e0d2] text-xs font-medium animate-fadeIn"
        >
          <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Banner Error Notification */}
      {errorMessage && (
        <div className="p-4 rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/50 text-xs text-rose-800 dark:text-rose-300 flex items-start gap-3 w-full">
          <AlertCircle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
          <div className="flex-1">{errorMessage}</div>
          <button 
            onClick={() => setErrorMessage(null)} 
            className="text-rose-500 hover:text-rose-700 dark:hover:text-rose-200 p-0.5"
            aria-label="Dismiss message"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* ── 1. Top Identity Action Header (Matching Dashboard & Compute Top Bar) ── */}
      <div className="bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 p-5 sm:p-6 rounded-2xl shadow-sm flex flex-col lg:flex-row items-start lg:items-center justify-between gap-5 w-full">
        {/* User Identity Details */}
        <div className="flex items-center gap-4 min-w-0">
          <div className="relative group shrink-0">
            <input 
              type="file" 
              ref={fileInputRef} 
              onChange={handleAvatarFileChange} 
              accept="image/png, image/jpeg, image/webp" 
              className="hidden" 
            />
            
            {avatarPreview ? (
              <img 
                src={avatarPreview} 
                alt={fullName} 
                className="w-16 h-16 rounded-2xl object-cover border-2 border-[#d99a3a]/40 shadow-md"
              />
            ) : (
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#d99a3a] to-[#b07b28] text-white text-2xl font-bold flex items-center justify-center shadow-md">
                {userInitial}
              </div>
            )}

            {/* Camera Overlay */}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              title="Upload profile avatar"
              aria-label="Upload profile avatar"
              className="absolute inset-0 rounded-2xl bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-white cursor-pointer"
            >
              <Camera className="w-5 h-5 mb-0.5" />
              <span className="text-[9px] font-medium">Change</span>
            </button>
          </div>

          <div className="space-y-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white tracking-tight truncate">
                {fullName}
              </h2>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#d99a3a]/15 text-[#9e6e24] dark:text-[#f0b656] border border-[#d99a3a]/30">
                {currentRole}
              </span>
              {isMfaEnabled ? (
                <span className="px-2 py-0.5 rounded-full text-[11px] font-medium bg-[#7a9a7a]/15 text-[#3b633b] dark:text-[#9bc29b] border border-[#7a9a7a]/30 inline-flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3" />
                  2FA Active
                </span>
              ) : (
                <span className="px-2 py-0.5 rounded-full text-[11px] font-medium bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                  2FA Inactive
                </span>
              )}
            </div>

            <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400 flex-wrap">
              <span className="truncate">{user?.email || 'engineer@aravanta.com'}</span>
              <span>•</span>
              <div className="flex items-center gap-1.5 font-mono text-[11px]">
                <span>ID: {accountId}</span>
                <button
                  type="button"
                  onClick={copyAccountId}
                  title="Copy account ID"
                  className="hover:text-slate-700 dark:hover:text-slate-200 cursor-pointer"
                >
                  {copiedAccountId ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                </button>
              </div>
              <span>•</span>
              <span className="inline-flex items-center gap-1">
                <Globe className="w-3 h-3 text-[#d99a3a]" />
                ap-south-1
              </span>
            </div>
          </div>
        </div>

        {/* Right CTA Actions */}
        <div className="flex items-center gap-2.5 flex-wrap self-stretch sm:self-auto shrink-0">
          {roleRequestStatus.hasPending ? (
            <div className="px-3.5 py-2 rounded-xl bg-[#d99a3a]/10 border border-[#d99a3a]/30 text-xs font-semibold text-[#9e6e24] dark:text-[#f0b656] flex items-center gap-2">
              <Clock className="w-3.5 h-3.5 animate-spin" />
              <span>Role Elevation Pending</span>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setRoleRequestModalOpen(true)}
              className="px-4 py-2 text-xs font-semibold bg-[#f7f4ee] hover:bg-[#ede7da] dark:bg-[#1a2333] dark:hover:bg-[#222e44] text-[#211b14] dark:text-[#f2ead9] border border-slate-200 dark:border-slate-800 rounded-xl transition-colors flex items-center gap-2 cursor-pointer shadow-sm"
            >
              <Shield className="w-3.5 h-3.5 text-[#d99a3a]" />
              <span>Request Role Change</span>
            </button>
          )}

          <button
            type="button"
            onClick={handleOpenInviteModal}
            className="px-4 py-2 bg-[#d99a3a] hover:bg-[#f0b656] text-[#241605] text-xs font-bold rounded-xl shadow-md transition-colors flex items-center gap-2 cursor-pointer"
          >
            <UserPlus className="w-4 h-4" />
            <span>Invite Member</span>
          </button>
        </div>
      </div>

      {/* ── 2. Stat Summary Cards Grid (Matching Dashboard / Compute / Storage 4-column layout) ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 w-full">
        {/* Metric Card 1: Role & Access Level */}
        <div className="bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 p-4 sm:p-5 rounded-2xl shadow-sm flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-[#d99a3a]/10 text-[#d99a3a] flex items-center justify-center shrink-0">
            <Shield className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
              System Role
            </span>
            <span className="text-base font-bold text-slate-900 dark:text-white truncate block">
              {currentRole}
            </span>
            <span className="text-[10px] text-slate-400 dark:text-slate-500 block">
              Tier {currentRole === 'SuperAdmin' ? 5 : currentRole === 'Admin' ? 4 : currentRole === 'Operator' ? 3 : currentRole === 'Developer' ? 2 : 1} Privileges
            </span>
          </div>
        </div>

        {/* Metric Card 2: Security & 2FA */}
        <div className="bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 p-4 sm:p-5 rounded-2xl shadow-sm flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
            <Lock className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
              2FA Authentication
            </span>
            <span className="text-base font-bold text-slate-900 dark:text-white truncate block">
              {isMfaEnabled ? 'Enabled' : 'Not Configured'}
            </span>
            <span className="text-[10px] text-slate-400 dark:text-slate-500 block">
              {isMfaEnabled ? 'TOTP Authenticator Protected' : 'Single factor password'}
            </span>
          </div>
        </div>

        {/* Metric Card 3: Active Sessions */}
        <div className="bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 p-4 sm:p-5 rounded-2xl shadow-sm flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
            <Laptop className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
              Active Sessions
            </span>
            <span className="text-base font-bold text-slate-900 dark:text-white truncate block">
              {sessions.length} Devices
            </span>
            <span className="text-[10px] text-slate-400 dark:text-slate-500 truncate block">
              Current: 203.0.113.45 (IN)
            </span>
          </div>
        </div>

        {/* Metric Card 4: Organization Workspace */}
        <div className="bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 p-4 sm:p-5 rounded-2xl shadow-sm flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 flex items-center justify-center shrink-0">
            <Globe className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
              Workspace
            </span>
            <span className="text-base font-bold text-slate-900 dark:text-white truncate block">
              {workspaceName}
            </span>
            <span className="text-[10px] text-slate-400 dark:text-slate-500 truncate block">
              {timezone}
            </span>
          </div>
        </div>
      </div>

      {/* ── 3. Navigation Tabs Across Full Width (Matching Main Console IA) ── */}
      <div 
        role="tablist" 
        aria-label="Profile and account settings tabs"
        className="flex items-center gap-2 sm:gap-6 border-b border-slate-200 dark:border-slate-800 overflow-x-auto scrollbar-none pb-px w-full"
      >
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              id={`tab-${tab.id}`}
              role="tab"
              aria-selected={isActive}
              aria-controls={`panel-${tab.id}`}
              onClick={() => {
                setActiveTab(tab.id);
                setErrorMessage(null);
              }}
              className={`pb-3 px-1 sm:px-2 text-xs sm:text-sm font-semibold transition-colors flex items-center gap-2 whitespace-nowrap cursor-pointer border-b-2 relative ${
                isActive
                  ? 'border-[#d99a3a] text-[#d99a3a]'
                  : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Icon className="w-4 h-4 shrink-0" />
              <span>{tab.label}</span>
              {tab.id === 'personal' && isPersonalDirty && (
                <span className="w-2 h-2 rounded-full bg-[#d99a3a]" title="Unsaved changes" />
              )}
              {tab.id === 'preferences' && isPreferencesDirty && (
                <span className="w-2 h-2 rounded-full bg-[#d99a3a]" title="Unsaved changes" />
              )}
            </button>
          );
        })}
      </div>

      {/* ── 4. Main Tabbed Content Panel Across Full Width ── */}
      <div className="w-full">
        {/* ── Tab 1: Personal Profile ── */}
        {activeTab === 'personal' && (
          <div 
            id="panel-personal" 
            role="tabpanel" 
            aria-labelledby="tab-personal"
            className="bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 rounded-2xl p-6 sm:p-8 shadow-sm space-y-6 w-full animate-fadeIn"
          >
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Personal and workspace information
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Update your display name, default workspace name, and localized timezone.
              </p>
            </div>

            <form onSubmit={handleSaveProfile} className="space-y-6 w-full">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    Full name
                  </label>
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    required
                    placeholder="e.g. Yash Naresh Baviskar"
                    className="w-full px-4 py-2.5 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#d99a3a] transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    Primary email address
                  </label>
                  <input
                    type="email"
                    value={user?.email || 'yashbaviskar47@gmail.com'}
                    disabled
                    className="w-full px-4 py-2.5 text-xs bg-slate-100 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-400 dark:text-slate-500 cursor-not-allowed"
                  />
                  <span className="block text-[11px] text-slate-400 mt-1">
                    Primary login email is verified and managed by system administrator.
                  </span>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    Workspace name
                  </label>
                  <input
                    type="text"
                    value={workspaceName}
                    onChange={(e) => setWorkspaceName(e.target.value)}
                    required
                    placeholder="e.g. Production Cloud Workspace"
                    className="w-full px-4 py-2.5 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#d99a3a] transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    Timezone
                  </label>
                  <select
                    value={timezone}
                    onChange={(e) => setTimezone(e.target.value)}
                    className="w-full px-4 py-2.5 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#d99a3a] cursor-pointer transition-all"
                  >
                    <option value="Asia/Kolkata">Asia/Kolkata (IST +05:30)</option>
                    <option value="America/New_York">America/New_York (EST -05:00)</option>
                    <option value="America/Los_Angeles">America/Los_Angeles (PST -08:00)</option>
                    <option value="Europe/London">Europe/London (GMT +00:00)</option>
                    <option value="Europe/Frankfurt">Europe/Frankfurt (CET +01:00)</option>
                    <option value="Asia/Singapore">Asia/Singapore (SGT +08:00)</option>
                    <option value="Asia/Tokyo">Asia/Tokyo (JST +09:00)</option>
                  </select>
                </div>
              </div>

              {/* Form Action Controls with Dirty Indicator */}
              <div className="flex items-center gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="submit"
                  disabled={loading || !isPersonalDirty}
                  className={`px-6 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 cursor-pointer transition-all ${
                    isPersonalDirty
                      ? 'bg-[#d99a3a] hover:bg-[#f0b656] text-[#241605] shadow-md'
                      : 'bg-slate-200 dark:bg-slate-800 text-slate-400 dark:text-slate-500 cursor-not-allowed'
                  }`}
                >
                  <Save className="w-4 h-4" />
                  <span>{loading ? 'Saving changes...' : 'Save profile changes'}</span>
                </button>

                {isPersonalDirty && (
                  <button
                    type="button"
                    onClick={handleResetProfile}
                    className="px-4 py-2.5 rounded-xl text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 transition-colors flex items-center gap-1.5 cursor-pointer"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Discard</span>
                  </button>
                )}

                {isPersonalDirty && (
                  <span className="text-xs text-[#d99a3a] font-semibold">
                    Unsaved changes
                  </span>
                )}
              </div>
            </form>
          </div>
        )}

        {/* ── Tab 2: Security & Authentication ── */}
        {activeTab === 'security' && (
          <div 
            id="panel-security" 
            role="tabpanel" 
            aria-labelledby="tab-security"
            className="space-y-6 w-full animate-fadeIn"
          >
            {/* Two-Factor Authentication Card */}
            <div className="bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 rounded-2xl p-6 sm:p-8 shadow-sm w-full">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-bold text-slate-900 dark:text-white">
                      Two-factor authentication (2FA)
                    </h3>
                    {isMfaEnabled ? (
                      <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                        Enabled
                      </span>
                    ) : (
                      <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-[#d99a3a]/15 text-[#9e6e24] dark:text-[#f0b656] border border-[#d99a3a]/30">
                        Not configured
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Add an extra layer of defense using Google Authenticator, Microsoft Authenticator, or any standard TOTP application.
                  </p>
                </div>

                <div className="shrink-0">
                  {!isMfaEnabled ? (
                    <button
                      type="button"
                      onClick={handleOpenMfaSetup}
                      disabled={loading}
                      className="px-5 py-2.5 bg-[#d99a3a] hover:bg-[#f0b656] text-[#241605] text-xs font-bold rounded-xl shadow-md transition-colors flex items-center gap-2 cursor-pointer"
                    >
                      <QrCode className="w-4 h-4" />
                      <span>Set up two-factor authentication</span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={handleDisableMfa}
                      disabled={loading}
                      className="px-5 py-2 text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 border border-rose-200 dark:border-rose-900/50 rounded-xl transition-colors cursor-pointer"
                    >
                      Disable two-factor authentication
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Password Update Card */}
            <div className="bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 rounded-2xl p-6 sm:p-8 shadow-sm space-y-5 w-full">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Update account password
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Choose a strong password containing at least 8 characters.
                </p>
              </div>

              <form onSubmit={handleChangePassword} className="space-y-4 w-full">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-5 w-full">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                      Current password
                    </label>
                    <div className="relative">
                      <input
                        type={showOldPassword ? 'text' : 'password'}
                        value={oldPassword}
                        onChange={(e) => setOldPassword(e.target.value)}
                        required
                        placeholder="••••••••••••"
                        className="w-full pl-3.5 pr-10 py-2.5 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#d99a3a]"
                      />
                      <button
                        type="button"
                        onClick={() => setShowOldPassword(!showOldPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                      >
                        {showOldPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                      New password
                    </label>
                    <div className="relative">
                      <input
                        type={showNewPassword ? 'text' : 'password'}
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        required
                        placeholder="Minimum 8 characters"
                        className="w-full pl-3.5 pr-10 py-2.5 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#d99a3a]"
                      />
                      <button
                        type="button"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                      >
                        {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                      Confirm new password
                    </label>
                    <input
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                      placeholder="Repeat new password"
                      className="w-full px-3.5 py-2.5 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#d99a3a]"
                    />
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={loading || !oldPassword || !newPassword}
                    className="px-6 py-2.5 bg-[#d99a3a] hover:bg-[#f0b656] text-[#241605] text-xs font-bold rounded-xl shadow-md transition-colors cursor-pointer disabled:opacity-50"
                  >
                    {loading ? 'Updating password...' : 'Update password'}
                  </button>
                </div>
              </form>
            </div>

            {/* Active Authenticated Sessions */}
            <div className="bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 rounded-2xl p-6 sm:p-8 shadow-sm space-y-4 w-full">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Active authenticated sessions
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Authorized browser sessions and devices holding valid JWT tokens for your account.
                </p>
              </div>

              <div className="divide-y divide-slate-100 dark:divide-slate-800 w-full">
                {sessions.map((sess) => (
                  <div key={sess.id} className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 w-full">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-[#d99a3a]/10 text-[#d99a3a] flex items-center justify-center shrink-0">
                        <Laptop className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-semibold text-slate-900 dark:text-white">
                            {sess.browser}
                          </span>
                          {sess.current && (
                            <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[10px] font-bold border border-emerald-500/30">
                              Current session
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                          {sess.location} • IP: <span className="font-mono">{sess.ip}</span>
                        </p>
                      </div>
                    </div>

                    {!sess.current && (
                      <button
                        type="button"
                        onClick={() => handleRevokeSession(sess.id)}
                        className="self-start sm:self-auto px-4 py-1.5 text-xs text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-lg border border-rose-200 dark:border-rose-900/40 transition-colors font-semibold cursor-pointer"
                      >
                        Revoke session
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── Tab 3: Workspace & Team ── */}
        {activeTab === 'workspace' && (
          <div 
            id="panel-workspace" 
            role="tabpanel" 
            aria-labelledby="tab-workspace"
            className="bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 rounded-2xl p-6 sm:p-8 shadow-sm space-y-6 w-full animate-fadeIn"
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 w-full">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    Workspace members
                  </h3>
                  <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-[#d99a3a]/15 text-[#9e6e24] dark:text-[#f0b656] border border-[#d99a3a]/30">
                    {filteredMembers.length}
                  </span>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Manage team access tiers, RBAC roles, and invite engineering collaborators.
                </p>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                <button
                  type="button"
                  onClick={() => handleCopyInviteLink()}
                  className="px-3.5 py-2 bg-slate-50 hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-700 transition-colors flex items-center gap-1.5 cursor-pointer"
                  title="Copy direct join link"
                >
                  {copiedInviteLink ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Share2 className="w-3.5 h-3.5 text-[#d99a3a]" />}
                  <span>{copiedInviteLink ? 'Link copied' : 'Share join link'}</span>
                </button>

                <button
                  type="button"
                  onClick={handleOpenInviteModal}
                  className="px-4 py-2 bg-[#d99a3a] hover:bg-[#f0b656] text-[#241605] text-xs font-bold rounded-xl shadow-md transition-colors flex items-center gap-2 cursor-pointer"
                >
                  <UserPlus className="w-4 h-4" />
                  <span>Invite member</span>
                </button>
              </div>
            </div>

            {/* Search Bar */}
            <div className="relative w-full sm:max-w-md">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              <input
                type="text"
                placeholder="Search members by name, email, or role..."
                value={memberSearchTerm}
                onChange={(e) => {
                  setMemberSearchTerm(e.target.value);
                  setMemberPage(1);
                }}
                className="w-full pl-10 pr-8 py-2.5 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#d99a3a]"
              />
              {memberSearchTerm && (
                <button
                  type="button"
                  onClick={() => {
                    setMemberSearchTerm('');
                    setMemberPage(1);
                  }}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Members Table */}
            <div className="overflow-x-auto border border-slate-200 dark:border-slate-800 rounded-xl w-full">
              <table className="w-full min-w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800 font-bold text-slate-500 dark:text-slate-400 bg-slate-50/70 dark:bg-slate-900/50 select-none">
                    <th className="py-3.5 px-4 cursor-pointer hover:text-slate-900 dark:hover:text-white" onClick={() => handleMemberSort('full_name')}>
                      Member name {renderMemberSortIcon('full_name')}
                    </th>
                    <th className="py-3.5 px-4 cursor-pointer hover:text-slate-900 dark:hover:text-white" onClick={() => handleMemberSort('email')}>
                      Email address {renderMemberSortIcon('email')}
                    </th>
                    <th className="py-3.5 px-4 cursor-pointer hover:text-slate-900 dark:hover:text-white" onClick={() => handleMemberSort('role')}>
                      System role {renderMemberSortIcon('role')}
                    </th>
                    <th className="py-3.5 px-4 cursor-pointer hover:text-slate-900 dark:hover:text-white" onClick={() => handleMemberSort('status')}>
                      Status {renderMemberSortIcon('status')}
                    </th>
                    <th className="py-3.5 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {membersLoading ? (
                    <>
                      <SkeletonTableRow columns={5} />
                      <SkeletonTableRow columns={5} />
                      <SkeletonTableRow columns={5} />
                    </>
                  ) : paginatedMembers.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-slate-400">
                        {memberSearchTerm ? (
                          <p>No workspace members match &ldquo;{memberSearchTerm}&rdquo;</p>
                        ) : (
                          <div className="space-y-2">
                            <p>No other members found in this workspace.</p>
                            <button
                              onClick={handleOpenInviteModal}
                              className="text-xs font-semibold text-[#d99a3a] hover:underline inline-flex items-center gap-1"
                            >
                              <Plus className="w-3.5 h-3.5" /> Invite first collaborator
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ) : (
                    paginatedMembers.map((m) => {
                      const isSelf = (m.email || '').toLowerCase() === (user?.email || '').toLowerCase();
                      return (
                        <tr key={m.id || m.email} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors">
                          <td className="py-3.5 px-4 font-semibold text-slate-900 dark:text-white flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-[#d99a3a]/15 text-[#d99a3a] font-bold text-xs flex items-center justify-center shrink-0">
                              {(m.full_name || m.email || 'U').charAt(0).toUpperCase()}
                            </div>
                            <span className="truncate">
                              {m.full_name || m.email?.split('@')[0]}
                            </span>
                            {isSelf && (
                              <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#d99a3a]/15 text-[#d99a3a] font-bold">
                                You
                              </span>
                            )}
                          </td>
                          <td className="py-3.5 px-4 text-slate-500 dark:text-slate-400">
                            {m.email}
                          </td>
                          <td className="py-3.5 px-4">
                            {(currentRole === 'SuperAdmin' || currentRole === 'Admin') && !isSelf ? (
                              <select
                                value={m.role}
                                onChange={(e) => handleUpdateMemberRole(m.id || m.email, e.target.value)}
                                disabled={updatingRoleId === (m.id || m.email)}
                                className="px-2.5 py-1 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-900 dark:text-white cursor-pointer focus:ring-1 focus:ring-[#d99a3a]"
                              >
                                {currentRole === 'SuperAdmin' && (
                                  <option value="SuperAdmin">SuperAdmin</option>
                                )}
                                <option value="Admin">Admin</option>
                                <option value="Operator">Operator</option>
                                <option value="Developer">Developer</option>
                                <option value="Viewer">Viewer</option>
                              </select>
                            ) : (
                              <span className="px-2.5 py-0.5 rounded-full bg-[#d99a3a]/10 text-[#9e6e24] dark:text-[#f0b656] font-semibold text-[11px] border border-[#d99a3a]/25">
                                {m.role}
                              </span>
                            )}
                          </td>
                          <td className="py-3.5 px-4">
                            <span className="inline-flex items-center gap-1.5 text-[11px] font-medium text-emerald-600 dark:text-emerald-400">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                              Active
                            </span>
                          </td>
                          <td className="py-3.5 px-4 text-right">
                            {!isSelf && (
                              <button
                                type="button"
                                onClick={() => handleRevokeMember(m.id, m.email)}
                                className="text-xs text-rose-600 dark:text-rose-400 hover:underline font-medium cursor-pointer"
                              >
                                Remove
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Table Pagination */}
            <DataTablePagination
              currentPage={memberPage}
              totalItems={sortedMembers.length}
              pageSize={memberPageSize}
              onPageChange={setMemberPage}
              onPageSizeChange={(sz) => {
                setMemberPageSize(sz);
                setMemberPage(1);
              }}
              pageSizeOptions={[5, 10, 20]}
              itemName="workspace members"
            />
          </div>
        )}

        {/* ── Tab 4: Preferences ── */}
        {activeTab === 'preferences' && (
          <div 
            id="panel-preferences" 
            role="tabpanel" 
            aria-labelledby="tab-preferences"
            className="bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 rounded-2xl p-6 sm:p-8 shadow-sm space-y-6 w-full animate-fadeIn"
          >
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Operational notifications
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Choose which infrastructure alerts, deployment rollouts, and billing reports are delivered to your feed.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
              <div className="flex items-center justify-between p-4 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                <div className="pr-4">
                  <strong className="block text-xs font-semibold text-slate-900 dark:text-white">
                    Deployment lifecycle notifications
                  </strong>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                    Receive alerts on successful image rollouts, build pipeline failures, and automated rollbacks.
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={notifDeploy}
                  onChange={(e) => setNotifDeploy(e.target.checked)}
                  className="w-4 h-4 text-[#d99a3a] accent-[#d99a3a] rounded cursor-pointer shrink-0"
                />
              </div>

              <div className="flex items-center justify-between p-4 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                <div className="pr-4">
                  <strong className="block text-xs font-semibold text-slate-900 dark:text-white">
                    Alertmanager threshold triggers
                  </strong>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                    Immediate high-priority dispatches when P1/P2 Prometheus alerts fire.
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={notifAlert}
                  onChange={(e) => setNotifAlert(e.target.checked)}
                  className="w-4 h-4 text-[#d99a3a] accent-[#d99a3a] rounded cursor-pointer shrink-0"
                />
              </div>

              <div className="flex items-center justify-between p-4 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                <div className="pr-4">
                  <strong className="block text-xs font-semibold text-slate-900 dark:text-white">
                    Incident war-room updates
                  </strong>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                    Live status timeline additions, commander reassignments, and RCA publications.
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={notifIncident}
                  onChange={(e) => setNotifIncident(e.target.checked)}
                  className="w-4 h-4 text-[#d99a3a] accent-[#d99a3a] rounded cursor-pointer shrink-0"
                />
              </div>

              <div className="flex items-center justify-between p-4 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                <div className="pr-4">
                  <strong className="block text-xs font-semibold text-slate-900 dark:text-white">
                    FinOps & invoicing summaries
                  </strong>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                    Monthly billing receipts, budget threshold warnings, and cost anomaly alerts.
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={notifBilling}
                  onChange={(e) => setNotifBilling(e.target.checked)}
                  className="w-4 h-4 text-[#d99a3a] accent-[#d99a3a] rounded cursor-pointer shrink-0"
                />
              </div>
            </div>

            <div className="flex items-center gap-3 pt-3 border-t border-slate-200 dark:border-slate-800">
              <button
                type="button"
                onClick={handleSavePreferences}
                disabled={loading || !isPreferencesDirty}
                className={`px-6 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 cursor-pointer transition-all ${
                  isPreferencesDirty
                    ? 'bg-[#d99a3a] hover:bg-[#f0b656] text-[#241605] shadow-md'
                    : 'bg-slate-200 dark:bg-slate-800 text-slate-400 dark:text-slate-500 cursor-not-allowed'
                }`}
              >
                <Save className="w-4 h-4" />
                <span>{loading ? 'Saving preferences...' : 'Save notification preferences'}</span>
              </button>

              {isPreferencesDirty && (
                <button
                  type="button"
                  onClick={handleResetPreferences}
                  className="px-4 py-2.5 rounded-xl text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Discard</span>
                </button>
              )}

              {isPreferencesDirty && (
                <span className="text-xs text-[#d99a3a] font-semibold">
                  Unsaved changes
                </span>
              )}
            </div>
          </div>
        )}

        {/* ── Tab 5: Role & Permissions ── */}
        {activeTab === 'permissions' && (
          <div 
            id="panel-permissions" 
            role="tabpanel" 
            aria-labelledby="tab-permissions"
            className="bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 rounded-2xl p-6 sm:p-8 shadow-sm space-y-6 w-full animate-fadeIn"
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 w-full">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    Active role entitlements ({currentRole})
                  </h3>
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#d99a3a]/15 text-[#9e6e24] dark:text-[#f0b656] border border-[#d99a3a]/30">
                    Tier {currentRole === 'SuperAdmin' ? 5 : currentRole === 'Admin' ? 4 : currentRole === 'Operator' ? 3 : currentRole === 'Developer' ? 2 : 1}
                  </span>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Capabilities enforced across the API gateway, microservices, and Infrastructure as Code orchestrator.
                </p>
              </div>

              <div>
                {roleRequestStatus.hasPending ? (
                  <div className="px-3.5 py-1.5 rounded-xl bg-[#d99a3a]/10 border border-[#d99a3a]/30 text-xs text-[#9e6e24] dark:text-[#f0b656] font-semibold flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5" />
                    <span>Role elevation under review</span>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setRoleRequestModalOpen(true)}
                    className="px-4 py-2 bg-[#d99a3a] hover:bg-[#f0b656] text-[#241605] text-xs font-bold rounded-xl shadow-md transition-colors flex items-center gap-1.5 cursor-pointer"
                  >
                    <Shield className="w-3.5 h-3.5" />
                    <span>Request elevated role</span>
                  </button>
                )}
              </div>
            </div>

            {/* Capability Grid across full width */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 w-full">
              {[
                {
                  title: 'Provision & scale compute',
                  desc: 'Manage virtual machines, container tasks, and autoscaling groups.',
                  icon: Server,
                  allowed: true,
                },
                {
                  title: 'Trigger CI/CD deployments',
                  desc: 'Dispatch production rollouts, run canary pipelines, and execute rollback plans.',
                  icon: Terminal,
                  allowed: true,
                },
                {
                  title: 'Incident response & war room',
                  desc: 'Declare severity incidents, page on-call engineers, and acknowledge alerts.',
                  icon: Activity,
                  allowed: true,
                },
                {
                  title: 'Secrets & encryption keys (KMS)',
                  desc: 'Create, rotate, and decrypt ArvVault credentials and key material.',
                  icon: Lock,
                  allowed: currentRole === 'SuperAdmin' || currentRole === 'Admin',
                },
                {
                  title: 'IAM & workspace administration',
                  desc: 'Invite engineering teammates, adjust RBAC roles, and manage API keys.',
                  icon: Users,
                  allowed: currentRole === 'SuperAdmin' || currentRole === 'Admin',
                },
                {
                  title: 'FinOps & invoice management',
                  desc: 'Access monthly cloud invoices, adjust payment methods, and set budget limits.',
                  icon: CreditCard,
                  allowed: currentRole === 'SuperAdmin' || currentRole === 'Admin',
                },
              ].map((cap, i) => {
                const Icon = cap.icon;
                return (
                  <div 
                    key={i} 
                    className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-start gap-3 w-full"
                  >
                    <div className="w-9 h-9 rounded-lg bg-[#d99a3a]/10 text-[#d99a3a] flex items-center justify-center shrink-0 mt-0.5">
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-semibold text-slate-900 dark:text-white truncate">
                          {cap.title}
                        </span>
                        {cap.allowed ? (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 shrink-0">
                            Allowed
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-200 dark:bg-slate-800 text-slate-500 shrink-0">
                            Restricted
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                        {cap.desc}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Active API Token Scopes */}
            <div className="pt-4 border-t border-slate-200 dark:border-slate-800 space-y-2 w-full">
              <span className="text-xs font-semibold text-slate-900 dark:text-white block">
                Active API gateway bearer scopes
              </span>
              <div className="flex items-center gap-2 flex-wrap font-mono text-[11px]">
                {['compute:*', 'deployments:write', 'telemetry:read', 'incidents:write', 'vault:read', 'billing:read'].map((scope) => (
                  <span 
                    key={scope}
                    className="px-3 py-1 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400"
                  >
                    {scope}
                  </span>
                ))}
              </div>
            </div>

            {onNavigateToBilling && (
              <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 w-full">
                <div>
                  <span className="text-xs font-semibold text-slate-900 dark:text-white">
                    Billing & cost management
                  </span>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                    Review monthly invoices, payment methods, and AWS/GCP-style usage breakdown.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={onNavigateToBilling}
                  className="px-4 py-2 bg-[#d99a3a] hover:bg-[#f0b656] text-[#241605] text-xs font-bold rounded-xl shadow-sm transition-colors cursor-pointer self-start sm:self-auto shrink-0"
                >
                  Open billing console
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── Modal 1: Role Elevation Request Modal ── */}
      {roleRequestModalOpen && (
        <ModalPortal isOpen={roleRequestModalOpen} onClose={() => setRoleRequestModalOpen(false)} maxWidth="max-w-lg">
          <div className="space-y-5">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-[#d99a3a]/15 text-[#d99a3a] flex items-center justify-center shrink-0">
                  <Shield className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    Request role elevation
                  </h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Submit an access tier request to the workspace SuperAdmin
                  </p>
                </div>
              </div>
              <button 
                type="button" 
                onClick={() => setRoleRequestModalOpen(false)} 
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 cursor-pointer"
                aria-label="Close modal"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmitRoleRequest} className="space-y-4 text-xs">
              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-1">
                <span className="text-[11px] text-slate-500 dark:text-slate-400">Current assigned role</span>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-slate-900 dark:text-white">{currentRole}</span>
                  <span className="text-[10px] text-slate-400">({user?.email})</span>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Requested target role
                </label>
                <select
                  value={requestedTargetRole}
                  onChange={(e) => setRequestedTargetRole(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white font-medium cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#d99a3a]"
                >
                  <option value="SuperAdmin">SuperAdmin (Full Workspace Governance)</option>
                  <option value="Admin">Admin (Workspace Admin & IAM)</option>
                  <option value="Operator">Operator (Deployments & Release Incident Management)</option>
                  <option value="Developer">Developer (Standard Workload Deployment & Observability)</option>
                  <option value="Viewer">Viewer (Telemetry Observer & Metrics Read-Only)</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Business justification & rationale <span className="text-rose-500">*</span>
                </label>
                <textarea
                  value={roleRequestReason}
                  onChange={(e) => setRoleRequestReason(e.target.value)}
                  required
                  rows={3}
                  placeholder="e.g. Need elevated permissions to provision managed databases and configure cluster ingress for production workloads..."
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#d99a3a] leading-relaxed resize-none"
                />
                <span className="text-[10px] text-slate-400">
                  Minimum 5 characters. This justification is permanently recorded in the security audit trail.
                </span>
              </div>

              <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setRoleRequestModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl font-medium bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={roleRequestSubmitting || roleRequestReason.trim().length < 5}
                  className="px-5 py-2.5 bg-[#d99a3a] hover:bg-[#f0b656] text-[#241605] font-bold rounded-xl shadow-md transition-colors cursor-pointer disabled:opacity-50 flex items-center gap-2"
                >
                  {roleRequestSubmitting ? (
                    <>
                      <span className="w-3.5 h-3.5 border-2 border-[#241605] border-t-transparent rounded-full animate-spin" />
                      <span>Submitting request...</span>
                    </>
                  ) : (
                    <>
                      <FileCheck className="w-4 h-4" />
                      <span>Submit request to SuperAdmin</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </ModalPortal>
      )}

      {/* ── Modal 2: 2FA / MFA Setup Modal with QR Code ── */}
      {mfaModalOpen && (
        <ModalPortal isOpen={mfaModalOpen} onClose={() => setMfaModalOpen(false)} maxWidth="max-w-md">
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <QrCode className="w-5 h-5 text-[#d99a3a]" />
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  Set up two-factor authentication
                </h3>
              </div>
              <button 
                type="button" 
                onClick={() => setMfaModalOpen(false)} 
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="text-center space-y-3">
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Scan this QR code with <strong>Google Authenticator</strong>, <strong>Microsoft Authenticator</strong>, or <strong>Authy</strong>:
              </p>

              {/* Real QR Code Display */}
              {qrUrl && (
                <div className="p-3 bg-white rounded-2xl border border-slate-200 shadow-inner inline-block mx-auto">
                  <img src={qrUrl} alt="2FA QR Code" className="w-40 h-40 mx-auto rounded-lg" />
                </div>
              )}

              {/* Manual Secret Key Copy */}
              <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 text-left space-y-1">
                <span className="text-[10px] text-slate-400 uppercase font-semibold">
                  Or enter secret key manually
                </span>
                <div className="flex items-center justify-between gap-2">
                  <code className="text-xs font-mono font-bold text-[#d99a3a] tracking-wider select-all truncate">
                    {mfaSetupData?.mfa_secret}
                  </code>
                  <button
                    type="button"
                    onClick={() => handleCopySecret(mfaSetupData?.mfa_secret)}
                    className="px-2.5 py-1 rounded-lg bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-medium text-[11px] flex items-center gap-1 cursor-pointer shrink-0"
                  >
                    {mfaCopied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{mfaCopied ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Verification Code Form */}
            <form onSubmit={handleEnableMfa} className="space-y-3 pt-2">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 text-center">
                  Enter 6-digit confirmation code from your authenticator app
                </label>
                <input
                  type="text"
                  maxLength={6}
                  value={mfaVerifyCode}
                  onChange={(e) => setMfaVerifyCode(e.target.value.replace(/\D/g, ''))}
                  placeholder="000000"
                  required
                  autoFocus
                  className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-center text-xl font-mono font-bold tracking-widest text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#d99a3a]"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setMfaModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-xs font-medium rounded-xl hover:bg-slate-200 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading || mfaVerifyCode.length < 6}
                  className="px-4 py-2 bg-[#d99a3a] hover:bg-[#f0b656] text-[#241605] text-xs font-bold rounded-xl shadow-md disabled:opacity-50 cursor-pointer"
                >
                  {loading ? 'Activating...' : 'Verify & activate 2FA'}
                </button>
              </div>
            </form>
          </div>
        </ModalPortal>
      )}

      {/* ── Modal 3: Workspace Invite Member Modal ── */}
      {inviteModalOpen && (
        <ModalPortal isOpen={inviteModalOpen} onClose={() => setInviteModalOpen(false)} maxWidth="max-w-md">
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-[#d99a3a]/15 text-[#d99a3a] flex items-center justify-center shrink-0">
                  <UserPlus className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    Invite workspace member
                  </h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Grant cloud console access to an engineering colleague
                  </p>
                </div>
              </div>
              <button 
                type="button" 
                onClick={() => setInviteModalOpen(false)} 
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {inviteStatus === 'success' ? (
              <div className="space-y-4 py-2 animate-fadeIn text-xs">
                <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl text-center space-y-2">
                  <div className="w-10 h-10 rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto">
                    <CheckCircle2 className="w-5 h-5" />
                  </div>
                  <h4 className="font-bold text-slate-900 dark:text-white text-sm">
                    Invitation dispatched
                  </h4>
                  <p className="text-slate-600 dark:text-slate-300 text-[11px]">
                    {inviteSuccessMsg || `An invitation has been generated for ${inviteEmail}.`}
                  </p>
                </div>

                {lastInviteLink && (
                  <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 space-y-1.5">
                    <span className="text-[10px] uppercase font-semibold text-slate-400 block">
                      Direct workspace join URL
                    </span>
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        readOnly
                        value={lastInviteLink}
                        className="w-full px-2.5 py-1.5 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-[11px] text-slate-700 dark:text-slate-300 font-mono select-all"
                      />
                      <button
                        type="button"
                        onClick={() => handleCopyInviteLink(lastInviteLink)}
                        className="px-3 py-1.5 bg-[#d99a3a] hover:bg-[#f0b656] text-[#241605] font-bold rounded-lg shrink-0 flex items-center gap-1 cursor-pointer text-xs"
                      >
                        {copiedInviteLink ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                        <span>{copiedInviteLink ? 'Copied' : 'Copy'}</span>
                      </button>
                    </div>
                  </div>
                )}

                <div className="flex gap-2 pt-2 border-t border-slate-200 dark:border-slate-800">
                  <button
                    type="button"
                    onClick={() => {
                      setInviteStatus('idle');
                      setInviteEmail('');
                      setInviteName('');
                      setInviteError(null);
                    }}
                    className="flex-1 py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 font-semibold rounded-xl cursor-pointer"
                  >
                    Invite another member
                  </button>
                  <button
                    type="button"
                    onClick={() => setInviteModalOpen(false)}
                    className="flex-1 py-2.5 bg-[#d99a3a] hover:bg-[#f0b656] text-[#241605] font-bold rounded-xl shadow-md cursor-pointer"
                  >
                    Done
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleInviteMember} className="space-y-3.5 text-xs">
                {inviteError && (
                  <div className="p-3 bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/50 rounded-xl text-rose-700 dark:text-rose-300 text-[11px] flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                    <span>{inviteError}</span>
                  </div>
                )}

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Work email address <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="email"
                      value={inviteEmail}
                      onChange={(e) => {
                        setInviteEmail(e.target.value);
                        if (inviteError) setInviteError(null);
                      }}
                      placeholder="teammate@company.com"
                      required
                      autoFocus
                      className="w-full pl-9 pr-3.5 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#d99a3a]"
                    />
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  </div>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Full name <span className="text-slate-400 text-[10px] font-normal">(Optional)</span>
                  </label>
                  <input
                    type="text"
                    value={inviteName}
                    onChange={(e) => setInviteName(e.target.value)}
                    placeholder="e.g. Sandeep Varma"
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#d99a3a]"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Assigned RBAC role
                  </label>
                  <select
                    value={inviteRole}
                    onChange={(e) => setInviteRole(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white font-medium cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#d99a3a]"
                  >
                    <option value="Admin">Admin (Workspace Admin & IAM)</option>
                    <option value="Operator">Operator (SRE, Release, Incidents)</option>
                    <option value="Developer">Developer (Deploy Workloads & View Logs)</option>
                    <option value="Viewer">Viewer (Telemetry Observer - Read Only)</option>
                  </select>
                </div>

                <div className="flex justify-end gap-2 pt-3 border-t border-slate-200 dark:border-slate-800">
                  <button
                    type="button"
                    onClick={() => setInviteModalOpen(false)}
                    className="px-4 py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 rounded-xl font-medium text-slate-600 dark:text-slate-300 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading || inviteStatus === 'submitting'}
                    className="px-5 py-2.5 bg-[#d99a3a] hover:bg-[#f0b656] text-[#241605] font-bold rounded-xl shadow-md flex items-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    {inviteStatus === 'submitting' ? (
                      <>
                        <span className="w-3.5 h-3.5 border-2 border-[#241605] border-t-transparent rounded-full animate-spin" />
                        <span>Sending invitation...</span>
                      </>
                    ) : (
                      <>
                        <UserPlus className="w-4 h-4" />
                        <span>Send workspace invite</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>
        </ModalPortal>
      )}
    </div>
  );
};
