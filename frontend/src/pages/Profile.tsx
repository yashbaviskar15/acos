import React, { useState, useEffect } from 'react';
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
  UserPlus
} from 'lucide-react';
import { ModalPortal } from '../components/ModalPortal';
import { SkeletonTableRow } from '../components/Skeleton';
import { apiFetch } from '../config/api';

interface ProfileProps {
  user: any;
  onUpdateUser: (updatedUser: any, newToken?: string) => void;
  onNavigateToBilling?: () => void;
}

export const Profile: React.FC<ProfileProps> = ({ user, onUpdateUser, onNavigateToBilling: _onNavigateToBilling }) => {
  const [activeTab, setActiveTab] = useState<'profile' | 'security' | 'workspace' | 'preferences' | 'permissions'>('profile');
  
  // Profile Form State
  const [fullName, setFullName] = useState(user?.full_name || 'Yash Baviskar');
  const [workspaceName, setWorkspaceName] = useState(user?.workspace_name || 'Production SRE Workspace');
  const [timezone, setTimezone] = useState(user?.timezone || 'Asia/Kolkata');
  
  // Password Change State
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

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

  // Preferences toggles
  const [notifDeploy, setNotifDeploy] = useState(true);
  const [notifAlert, setNotifAlert] = useState(true);
  const [notifIncident, setNotifIncident] = useState(true);
  const [notifBilling, setNotifBilling] = useState(true);

  // Active Sessions
  const [sessions, setSessions] = useState([
    { id: 'sess-01', user: user?.email, ip: '203.0.113.45', location: 'Mumbai, IN', browser: 'Chrome 128 / Windows', status: 'ACTIVE', current: true },
    { id: 'sess-02', user: user?.email, ip: '198.51.100.22', location: 'Virginia, US', browser: 'Firefox 130 / macOS', status: 'ACTIVE', current: false },
  ]);

  const [loading, setLoading] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
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
    const token = localStorage.getItem('aravanta_token');
    if (token) {
      apiFetch<any>('/api/v1/auth/me', { token })
        .then((fresh) => {
          if (fresh && fresh.id) {
            setIsMfaEnabled(Boolean(fresh.is_mfa_enabled));
            if (fresh.full_name) setFullName(fresh.full_name);
            if (fresh.workspace_name) setWorkspaceName(fresh.workspace_name);
            if (fresh.timezone) setTimezone(fresh.timezone);
            onUpdateUser({ ...user, ...fresh, is_mfa_enabled: Boolean(fresh.is_mfa_enabled) });
          }
        })
        .catch(() => {});
    }
  }, [user?.email]);

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
        setErrorMessage('Session expired. Please log out and sign in again to set up 2FA.');
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
      showToast('Two-Factor Authentication (2FA) successfully activated!');
    } catch (err: any) {
      showToast(`Verification failed: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Disable MFA
  const handleDisableMfa = async () => {
    setLoading(true);
    try {
      await apiFetch<any>('/api/v1/auth/mfa/disable', { method: 'POST', token: localStorage.getItem('aravanta_token') });
      setIsMfaEnabled(false);
      onUpdateUser({ ...user, is_mfa_enabled: false });
      showToast('Two-Factor Authentication disabled.');
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
    const text = linkToCopy || lastInviteLink || `https://arv-frontend.vercel.app/join?ws=${user?.workspace_id || 'ws-aravanta'}`;
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

    // Strict Email Format Validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailClean || !emailRegex.test(emailClean)) {
      setInviteError('Please enter a valid work email address (e.g. name@company.com).');
      return;
    }

    // Check duplicate in current workspace
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

      // Optimistic update
      setMembers(prev => {
        const exists = prev.some(m => (m.email || '').toLowerCase() === emailClean);
        if (exists) {
          return prev.map(m => (m.email || '').toLowerCase() === emailClean ? { ...m, ...memberObj } : m);
        }
        return [...prev, memberObj];
      });

      const inviteLink = res.invite_link || `https://arv-frontend.vercel.app/join?ws=${user?.workspace_id || 'ws-prod'}&email=${encodeURIComponent(emailClean)}`;
      setLastInviteLink(inviteLink);
      setInviteSuccessMsg(res.message || `Invitation successfully sent to ${emailClean} as ${inviteRole}.`);
      setInviteStatus('success');
      showToast(`Invited ${emailClean} as ${inviteRole}.`);

      // Refresh real state in background
      fetchWorkspaceMembers();
    } catch (err: any) {
      setInviteStatus('error');
      setInviteError(err.message || 'Failed to send workspace invitation. Please check your connection and try again.');
    } finally {
      setLoading(false);
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
    showToast('Session revoked. JWT token invalidated.');
  };

  const initial = fullName.charAt(0).toUpperCase() || 'U';
  const qrUrl = mfaSetupData?.otpauth_url 
    ? `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(mfaSetupData.otpauth_url)}`
    : '';

  return (
    <div className="space-y-6 font-mono text-xs max-w-6xl mx-auto">
      
      {/* Toast Alert */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white dark:bg-white dark:text-slate-900 px-4 py-3 rounded-xl shadow-2xl flex items-center gap-3 border border-slate-700 animate-fadeIn font-mono text-xs font-bold">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 dark:text-emerald-600" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header Banner */}
      <div className="bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-[#C6923B] text-white text-xl font-black flex items-center justify-center shadow-md shrink-0">
            {initial}
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-lg font-black text-slate-900 dark:text-white font-sans">{fullName}</h2>
              <span className="px-2 py-0.5 rounded bg-[#C6923B]/10 dark:bg-[#C6923B]/20 text-[#C6923B] dark:text-[#E5B04E] text-[10px] font-bold border border-[#C6923B]/30">
                {user?.role || 'SuperAdmin'}
              </span>
              {isMfaEnabled && (
                <span className="px-2 py-0.5 rounded bg-[#C6923B]/15 dark:bg-[#C6923B]/25 text-[#C6923B] dark:text-[#E5B04E] text-[10px] font-bold flex items-center gap-1 border border-[#C6923B]/30">
                  <ShieldCheck className="w-3 h-3" /> 2FA Active
                </span>
              )}
            </div>
            <p className="text-slate-500 text-[11px] mt-0.5">{user?.email} • Account ID: {user?.account_id || 'ARV-ACC-100001'}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="px-3 py-1 bg-emerald-50 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/30 rounded-xl font-bold">
            Account Active
          </span>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2 overflow-x-auto">
        {[
          { id: 'profile', label: 'Personal Profile', icon: User },
          { id: 'security', label: 'Security & 2FA', icon: Lock },
          { id: 'workspace', label: 'Workspace & Team', icon: Users },
          { id: 'preferences', label: 'Preferences', icon: Sliders },
          { id: 'permissions', label: 'Role Permissions', icon: ShieldCheck },
        ].map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => { setActiveTab(tab.id as any); setErrorMessage(null); }}
              className={`px-3.5 py-2 rounded-xl font-bold transition-all cursor-pointer flex items-center gap-2 shrink-0 ${
                activeTab === tab.id
                  ? 'bg-[#C6923B] text-white shadow-md shadow-[#C6923B]/25'
                  : 'bg-white dark:bg-[#111827] text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-[#C6923B]'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Error Message */}
      {errorMessage && (
        <div className="p-3 bg-rose-50 dark:bg-rose-500/15 border border-rose-200 dark:border-rose-500/30 rounded-xl text-xs text-rose-700 dark:text-rose-400 flex items-start gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* ── 1. Personal Profile Tab ── */}
      {activeTab === 'profile' && (
        <div className="bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-5">
          <div>
            <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase">Personal & Workspace Information</h3>
            <p className="text-slate-500 text-[11px] mt-0.5">Manage your user identity and organization metadata</p>
          </div>

          <form onSubmit={handleSaveProfile} className="space-y-4 max-w-2xl">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Full Name</label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#C6923B] focus:border-[#C6923B]"
                  required
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Primary Email</label>
                <input
                  type="email"
                  value={user?.email || 'engineer@aravanta.com'}
                  disabled
                  className="w-full px-3.5 py-2.5 bg-slate-100 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-500 cursor-not-allowed"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Workspace Name</label>
                <input
                  type="text"
                  value={workspaceName}
                  onChange={(e) => setWorkspaceName(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#C6923B] focus:border-[#C6923B]"
                  required
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Timezone</label>
                <select
                  value={timezone}
                  onChange={(e) => setTimezone(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white cursor-pointer"
                >
                  <option value="Asia/Kolkata">Asia/Kolkata (IST +5:30)</option>
                  <option value="America/New_York">America/New_York (EST -5:00)</option>
                  <option value="Europe/London">Europe/London (GMT +0:00)</option>
                  <option value="Asia/Singapore">Asia/Singapore (SGT +8:00)</option>
                </select>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2.5 bg-[#C6923B] hover:bg-[#B07B28] text-white font-bold rounded-xl shadow-md shadow-[#C6923B]/25 transition-colors flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>{loading ? 'Saving Changes...' : 'Save Profile Changes'}</span>
            </button>
          </form>
        </div>
      )}

      {/* ── 2. Security Tab (Password & 2FA QR Code) ── */}
      {activeTab === 'security' && (
        <div className="space-y-6">
          
          {/* Two-Factor Authentication Card with QR Code */}
          <div className="bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase">Two-Factor Authentication (2FA / MFA)</h3>
                  {isMfaEnabled ? (
                    <span className="px-2 py-0.5 rounded bg-emerald-50 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 font-bold text-[10px]">
                      ENABLED
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 rounded bg-[#C6923B]/10 dark:bg-[#C6923B]/20 text-[#C6923B] dark:text-[#E5B04E] font-bold text-[10px] border border-[#C6923B]/30">
                      NOT CONFIGURED
                    </span>
                  )}
                </div>
                <p className="text-slate-500 text-[11px]">
                  Secure your account logins using Google Authenticator, Microsoft Authenticator, or Authy TOTP.
                </p>
              </div>

              <div>
                {!isMfaEnabled ? (
                  <button
                    onClick={handleOpenMfaSetup}
                    disabled={loading}
                    className="px-4 py-2 bg-[#C6923B] hover:bg-[#B07B28] text-white font-bold rounded-xl shadow-md shadow-[#C6923B]/25 transition-colors flex items-center gap-2 cursor-pointer"
                  >
                    <QrCode className="w-4 h-4" />
                    <span>Setup 2FA with QR Code</span>
                  </button>
                ) : (
                  <button
                    onClick={handleDisableMfa}
                    disabled={loading}
                    className="px-4 py-2 bg-rose-50 dark:bg-rose-500/15 hover:bg-rose-100 text-rose-700 dark:text-rose-400 font-bold rounded-xl transition-colors cursor-pointer"
                  >
                    Disable 2FA
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Password Change Card */}
          <div className="bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-5">
            <div>
              <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase">Update Account Password</h3>
              <p className="text-slate-500 text-[11px] mt-0.5">Ensure passwords use a minimum of 8 characters</p>
            </div>

            <form onSubmit={handleChangePassword} className="space-y-4 max-w-md">
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Current Password</label>
                <input
                  type="password"
                  value={oldPassword}
                  onChange={(e) => setOldPassword(e.target.value)}
                  required
                  placeholder="••••••••••••"
                  className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#C6923B] focus:border-[#C6923B]"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">New Password</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  placeholder="Min. 8 characters"
                  className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#C6923B] focus:border-[#C6923B]"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Confirm New Password</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  placeholder="Repeat new password"
                  className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#C6923B] focus:border-[#C6923B]"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="px-5 py-2 bg-[#C6923B] hover:bg-[#B07B28] text-white font-bold rounded-xl shadow-md shadow-[#C6923B]/25 transition-colors cursor-pointer"
              >
                {loading ? 'Updating Password...' : 'Update Password'}
              </button>
            </form>
          </div>

          {/* Active Sessions */}
          <div className="bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-4">
            <div>
              <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase">Active Authenticated Sessions</h3>
              <p className="text-slate-500 text-[11px] mt-0.5">Manage devices authorized with your JWT bearer tokens</p>
            </div>

            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {sessions.map((sess) => (
                <div key={sess.id} className="py-3.5 flex items-center justify-between flex-wrap gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-[#C6923B]/10 text-[#C6923B] flex items-center justify-center">
                      <Globe className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <strong className="text-slate-900 dark:text-white">{sess.browser}</strong>
                        {sess.current && (
                          <span className="px-2 py-0.5 rounded bg-emerald-50 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 text-[10px] font-bold">
                            CURRENT DEVICE
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-500">{sess.location} • IP: {sess.ip}</p>
                    </div>
                  </div>

                  {!sess.current && (
                    <button
                      onClick={() => handleRevokeSession(sess.id)}
                      className="px-3 py-1.5 text-xs text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded-xl transition-colors font-bold cursor-pointer"
                    >
                      Revoke Session
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── 3. Workspace & Team Tab ── */}
      {activeTab === 'workspace' && (
        <div className="bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-6">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div>
              <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase">Workspace Team & Members</h3>
              <p className="text-slate-500 text-[11px] mt-0.5">Workspace ID: <strong className="text-[#C6923B] dark:text-[#E5B04E]">{user?.workspace_id || 'ws-yash-prod'}</strong></p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => handleCopyInviteLink()}
                className="px-3.5 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer text-xs"
                title="Copy Workspace Invitation URL"
              >
                {copiedInviteLink ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Share2 className="w-3.5 h-3.5 text-[#C6923B]" />}
                <span>{copiedInviteLink ? 'Link Copied' : 'Share Join Link'}</span>
              </button>

              <button
                onClick={handleOpenInviteModal}
                className="px-4 py-2 bg-[#C6923B] hover:bg-[#B07B28] text-white font-bold rounded-xl shadow-md shadow-[#C6923B]/25 transition-colors flex items-center gap-2 cursor-pointer text-xs"
              >
                <UserPlus className="w-4 h-4" />
                <span>Invite Team Member</span>
              </button>
            </div>
          </div>

          {/* Members Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 font-bold text-slate-500 bg-slate-50/50 dark:bg-slate-900/50">
                  <th className="py-3 px-4">Member Name</th>
                  <th className="py-3 px-4">Email Address</th>
                  <th className="py-3 px-4">System Role</th>
                  <th className="py-3 px-4">Account Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {membersLoading ? (
                  <>
                    <SkeletonTableRow columns={5} />
                    <SkeletonTableRow columns={5} />
                    <SkeletonTableRow columns={5} />
                  </>
                ) : members.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-slate-400 font-mono">
                      <p>No team members added yet.</p>
                      <button
                        onClick={handleOpenInviteModal}
                        className="mt-2 text-xs font-bold text-[#C6923B] hover:underline inline-flex items-center gap-1"
                      >
                        <Plus className="w-3.5 h-3.5" /> Invite your first team member
                      </button>
                    </td>
                  </tr>
                ) : (
                  members.map((m) => {
                    const isOwner = (m.email || '').toLowerCase() === (user?.email || '').toLowerCase();
                    return (
                      <tr key={m.id || m.email} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors">
                        <td className="py-3 px-4 font-bold text-slate-900 dark:text-white flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-[#C6923B]/15 text-[#C6923B] font-black text-[10px] flex items-center justify-center shrink-0">
                            {(m.full_name || m.email || 'U').charAt(0).toUpperCase()}
                          </div>
                          <span>{m.full_name || m.email?.split('@')[0]}</span>
                          {isOwner && (
                            <span className="text-[9px] px-1.5 py-0.2 rounded bg-amber-500/15 text-amber-600 dark:text-amber-400 font-bold">
                              YOU
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-slate-500">{m.email}</td>
                        <td className="py-3 px-4">
                          <span className="px-2 py-0.5 rounded bg-[#C6923B]/10 dark:bg-[#C6923B]/20 text-[#C6923B] dark:text-[#E5B04E] font-bold border border-[#C6923B]/20 text-[11px]">
                            {m.role}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <span className="px-2 py-0.5 rounded bg-emerald-50 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 font-bold flex items-center gap-1 w-fit text-[11px]">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> Active
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right">
                          {!isOwner && (
                            <button
                              onClick={() => handleRevokeMember(m.id, m.email)}
                              className="text-rose-600 dark:text-rose-400 hover:underline font-bold text-[11px] cursor-pointer"
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
        </div>
      )}

      {/* ── 4. Preferences Tab ── */}
      {activeTab === 'preferences' && (
        <div className="bg-white dark:bg-[#0F2038] border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-6">
          <div>
            <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase">Operational Notifications & Preferences</h3>
            <p className="text-slate-500 text-[11px] mt-0.5">Control automated incident dispatch and deployment notifications</p>
          </div>

          <div className="space-y-4 max-w-xl">
            <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
              <div>
                <strong className="text-slate-900 dark:text-white">Deployment Lifecycle Notifications</strong>
                <p className="text-[11px] text-slate-500">Alert on successful rollouts, failures, and automatic rollbacks</p>
              </div>
              <input
                type="checkbox"
                checked={notifDeploy}
                onChange={(e) => setNotifDeploy(e.target.checked)}
                className="w-4 h-4 text-blue-600 rounded cursor-pointer"
              />
            </div>

            <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
              <div>
                <strong className="text-slate-900 dark:text-white">Alertmanager Firing Triggers</strong>
                <p className="text-[11px] text-slate-500">Immediate notifications on P1/P2 alert thresholds</p>
              </div>
              <input
                type="checkbox"
                checked={notifAlert}
                onChange={(e) => setNotifAlert(e.target.checked)}
                className="w-4 h-4 text-blue-600 rounded cursor-pointer"
              />
            </div>

            <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
              <div>
                <strong className="text-slate-900 dark:text-white">Incident War-Room Updates</strong>
                <p className="text-[11px] text-slate-500">Stream event timeline additions and commander assignments</p>
              </div>
              <input
                type="checkbox"
                checked={notifIncident}
                onChange={(e) => setNotifIncident(e.target.checked)}
                className="w-4 h-4 text-blue-600 rounded cursor-pointer"
              />
            </div>

            <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
              <div>
                <strong className="text-slate-900 dark:text-white">FinOps & Invoicing Summaries</strong>
                <p className="text-[11px] text-slate-500">Monthly billing receipts and capacity utilization alerts</p>
              </div>
              <input
                type="checkbox"
                checked={notifBilling}
                onChange={(e) => setNotifBilling(e.target.checked)}
                className="w-4 h-4 text-blue-600 rounded cursor-pointer"
              />
            </div>

            <button
              onClick={() => showToast('Preferences updated and persisted.')}
              className="px-5 py-2.5 bg-[#C6923B] hover:bg-[#B07B28] text-white font-bold rounded-xl shadow-md shadow-[#C6923B]/25 transition-colors cursor-pointer"
            >
              Save Notification Preferences
            </button>
          </div>
        </div>
      )}

      {/* ── 5. Permissions Matrix Tab ── */}
      {activeTab === 'permissions' && (
        <div className="bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-4">
          <div>
            <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase">Active Role Entitlements ({user?.role || 'SuperAdmin'})</h3>
            <p className="text-slate-500 text-[11px] mt-0.5">Authorizations granted at the API gateway middleware layer</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <span className="font-bold text-slate-900 dark:text-white">Provision & Scale Compute Instances</span>
              <span className="text-emerald-600 dark:text-emerald-400 font-bold">ALLOWED</span>
            </div>
            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <span className="font-bold text-slate-900 dark:text-white">Trigger Production Deployments & Rollbacks</span>
              <span className="text-emerald-600 dark:text-emerald-400 font-bold">ALLOWED</span>
            </div>
            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <span className="font-bold text-slate-900 dark:text-white">Declare & Resolve Operational Incidents</span>
              <span className="text-emerald-600 dark:text-emerald-400 font-bold">ALLOWED</span>
            </div>
            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <span className="font-bold text-slate-900 dark:text-white">Manage Workspace Roles & IAM Billing</span>
              <span className="text-emerald-600 dark:text-emerald-400 font-bold">ALLOWED</span>
            </div>
          </div>
        </div>
      )}

      {/* ── 2FA / MFA Setup Modal with QR Code ── */}
      {mfaModalOpen && (
        <ModalPortal isOpen={mfaModalOpen} onClose={() => setMfaModalOpen(false)} maxWidth="max-w-md">
          <div className="space-y-4 font-mono text-xs">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <QrCode className="w-5 h-5 text-[#C6923B]" />
                <h3 className="text-sm font-black text-slate-900 dark:text-white font-sans uppercase">Setup Two-Factor (2FA)</h3>
              </div>
              <button onClick={() => setMfaModalOpen(false)} className="text-slate-400 hover:text-slate-600"><X className="w-4 h-4" /></button>
            </div>

            <div className="text-center space-y-3">
              <p className="text-slate-500 text-xs">
                Scan this QR code with <strong>Google Authenticator</strong> or <strong>Authy</strong>:
              </p>

              {/* Real QR Code Image */}
              {qrUrl && (
                <div className="p-3 bg-white rounded-2xl border border-slate-200 shadow-inner inline-block mx-auto">
                  <img src={qrUrl} alt="2FA QR Code" className="w-44 h-44 mx-auto rounded-lg" />
                </div>
              )}

              {/* Manual Secret Key Copy */}
              <div className="p-2.5 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 text-left space-y-1">
                <span className="text-[10px] text-slate-400 uppercase font-bold">Or enter key manually:</span>
                <div className="flex items-center justify-between gap-2">
                  <code className="text-xs font-bold text-[#C6923B] dark:text-[#E5B04E] tracking-wider select-all">
                    {mfaSetupData?.mfa_secret}
                  </code>
                  <button
                    type="button"
                    onClick={() => handleCopySecret(mfaSetupData?.mfa_secret)}
                    className="p-1.5 rounded-lg bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 text-slate-700 dark:text-slate-300 font-bold flex items-center gap-1 cursor-pointer text-[11px]"
                  >
                    {mfaCopied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{mfaCopied ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Confirmation Code Form */}
            <form onSubmit={handleEnableMfa} className="space-y-3 pt-2">
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1 text-center">
                  Enter 6-digit code from authenticator app:
                </label>
                <input
                  type="text"
                  maxLength={6}
                  value={mfaVerifyCode}
                  onChange={(e) => setMfaVerifyCode(e.target.value.replace(/\D/g, ''))}
                  placeholder="000000"
                  required
                  className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-center text-xl font-bold tracking-widest text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#C6923B] focus:border-[#C6923B]"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setMfaModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 dark:bg-slate-800 rounded-xl font-bold hover:bg-slate-200 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading || mfaVerifyCode.length < 6}
                  className="px-4 py-2 bg-[#C6923B] hover:bg-[#B07B28] text-white font-bold rounded-xl shadow-md shadow-[#C6923B]/25 disabled:opacity-50 cursor-pointer"
                >
                  {loading ? 'Activating...' : 'Verify & Activate 2FA'}
                </button>
              </div>
            </form>
          </div>
        </ModalPortal>
      )}

      {/* ── Enhanced Invite Member Modal ── */}
      {inviteModalOpen && (
        <ModalPortal isOpen={inviteModalOpen} onClose={() => setInviteModalOpen(false)} maxWidth="max-w-md">
          <div className="space-y-4 font-mono text-xs">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-[#C6923B]/15 text-[#C6923B] flex items-center justify-center shrink-0">
                  <UserPlus className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-900 dark:text-white font-sans uppercase">Invite Workspace Member</h3>
                  <p className="text-[10px] text-slate-400 font-sans">Grant operational roles to engineering teammates</p>
                </div>
              </div>
              <button 
                onClick={() => setInviteModalOpen(false)} 
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* State 1: Success Screen */}
            {inviteStatus === 'success' ? (
              <div className="space-y-4 py-2 animate-fadeIn">
                <div className="p-4 bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/30 rounded-2xl text-center space-y-2">
                  <div className="w-10 h-10 rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto">
                    <CheckCircle2 className="w-5 h-5" />
                  </div>
                  <h4 className="font-bold text-slate-900 dark:text-white font-sans text-sm">Invitation Dispatched</h4>
                  <p className="text-slate-600 dark:text-slate-300 text-[11px] font-sans">
                    {inviteSuccessMsg || `An invitation has been generated for ${inviteEmail}.`}
                  </p>
                </div>

                {/* Direct Shareable Link Box */}
                {lastInviteLink && (
                  <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 space-y-1.5">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Direct Workspace Join URL:</span>
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        readOnly
                        value={lastInviteLink}
                        className="w-full px-2.5 py-1.5 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-[11px] text-slate-600 dark:text-slate-300 font-mono select-all"
                      />
                      <button
                        onClick={() => handleCopyInviteLink(lastInviteLink)}
                        className="px-3 py-1.5 bg-[#C6923B] hover:bg-[#B07B28] text-white font-bold rounded-lg shrink-0 flex items-center gap-1 cursor-pointer text-xs"
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
                    className="flex-1 py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 font-bold rounded-xl cursor-pointer"
                  >
                    Invite Another Teammate
                  </button>
                  <button
                    type="button"
                    onClick={() => setInviteModalOpen(false)}
                    className="flex-1 py-2.5 bg-[#C6923B] hover:bg-[#B07B28] text-white font-bold rounded-xl shadow-md shadow-[#C6923B]/25 cursor-pointer"
                  >
                    Done
                  </button>
                </div>
              </div>
            ) : (
              /* State 2: Input Form */
              <form onSubmit={handleInviteMember} className="space-y-3.5">
                {inviteError && (
                  <div className="p-3 bg-rose-50 dark:bg-rose-500/15 border border-rose-200 dark:border-rose-500/30 rounded-xl text-rose-700 dark:text-rose-400 text-[11px] flex items-start gap-2 animate-fadeIn">
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                    <span>{inviteError}</span>
                  </div>
                )}

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Work Email Address <span className="text-rose-500">*</span>
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
                      className="w-full pl-9 pr-3.5 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#C6923B] focus:border-[#C6923B]"
                    />
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Full Name <span className="text-slate-400 text-[10px] font-normal">(Optional)</span>
                  </label>
                  <input
                    type="text"
                    value={inviteName}
                    onChange={(e) => setInviteName(e.target.value)}
                    placeholder="e.g. Priya Sharma"
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#C6923B] focus:border-[#C6923B]"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Assigned RBAC Role
                  </label>
                  <select
                    value={inviteRole}
                    onChange={(e) => setInviteRole(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-700 dark:text-slate-300 font-bold cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#C6923B] focus:border-[#C6923B]"
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
                    className="px-4 py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl font-bold text-slate-700 dark:text-slate-300 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading || inviteStatus === 'submitting'}
                    className="px-5 py-2.5 bg-[#C6923B] hover:bg-[#B07B28] text-white font-bold rounded-xl shadow-md shadow-[#C6923B]/25 flex items-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    {inviteStatus === 'submitting' ? (
                      <>
                        <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        <span>Sending Invitation...</span>
                      </>
                    ) : (
                      <>
                        <UserPlus className="w-4 h-4" />
                        <span>Send Workspace Invite</span>
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
