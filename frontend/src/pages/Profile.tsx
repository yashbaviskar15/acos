import React, { useState, useEffect } from 'react';
import { User, Shield, Key, CreditCard, CheckCircle2, Clock, Copy, RefreshCw, AlertTriangle, ShieldCheck, Smartphone } from 'lucide-react';
import { apiFetch } from '../config/api';

interface ProfileProps {
  user: any;
  onUpdateUser?: (updatedUser: any, newToken?: string) => void;
  onNavigateToBilling: () => void;
}

export const Profile: React.FC<ProfileProps> = ({ user, onUpdateUser, onNavigateToBilling }) => {
  const [activeTab, setActiveTab] = useState<'general' | 'security' | 'mfa' | 'api' | 'subscription'>('general');
  const [copiedKey, setCopiedKey] = useState(false);
  const [apiKey, setApiKey] = useState('arv_live_9f8a2c1e5b4d3a7f9e8d7c6b5a4f3e2d');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordMsg, setPasswordMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [profileData, setProfileData] = useState<any>(null);

  // Role assignment state
  const [selectedRole, setSelectedRole] = useState<string>('Developer');
  const [updatingRole, setUpdatingRole] = useState(false);
  const [roleMsg, setRoleMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // MFA State
  const [mfaData, setMfaData] = useState<any>(null);
  const [mfaTestCode, setMfaTestCode] = useState('');
  const [mfaMsg, setMfaMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [mfaLoading, setMfaLoading] = useState(false);

  const displayName = profileData?.full_name || user?.full_name || user?.email?.split('@')[0] || 'User';
  const email = profileData?.email || user?.email || 'user@aravanta.cloud';
  const role = profileData?.role || user?.role || user?.roles?.[0] || 'Developer';
  const accountId = profileData?.account_id || user?.account_id || 'ARV-ACC-000000';
  const createdAt = profileData?.created_at ? new Date(profileData.created_at).toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' }) : new Date().toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' });

  // Calculate trial days remaining
  const trialDays = 10;
  const accountCreated = profileData?.created_at ? new Date(profileData.created_at) : new Date();
  const now = new Date();
  const daysSinceCreation = Math.floor((now.getTime() - accountCreated.getTime()) / (1000 * 60 * 60 * 24));
  const trialDaysRemaining = Math.max(0, trialDays - daysSinceCreation);

  const token = localStorage.getItem('aravanta_token');

  const fetchProfile = async () => {
    if (!token) return;
    try {
      const data = await apiFetch<any>('/v1/auth/me', { token });
      setProfileData(data);
      setSelectedRole(data.role || 'Developer');
    } catch (err) {
      console.error('Failed to fetch profile:', err);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, [token]);

  const handleRoleChange = async (newRole: string) => {
    setSelectedRole(newRole);
    setUpdatingRole(true);
    setRoleMsg(null);

    try {
      const data = await apiFetch<any>('/v1/auth/role/update', {
        method: 'POST',
        token,
        body: JSON.stringify({ role: newRole })
      });
      setRoleMsg({ type: 'success', text: `System role assigned to '${data.role}'!` });
      fetchProfile();
      // Update local storage & parent app state
      const savedUser = JSON.parse(localStorage.getItem('aravanta_user') || '{}');
      savedUser.role = data.role;
      if (data.user) {
        Object.assign(savedUser, data.user);
      }
      localStorage.setItem('aravanta_user', JSON.stringify(savedUser));
      if (data.access_token) {
        localStorage.setItem('aravanta_token', data.access_token);
      }
      onUpdateUser?.(savedUser, data.access_token);
    } catch {
      setRoleMsg({ type: 'error', text: 'Failed to update system role.' });
    } finally {
      setUpdatingRole(false);
    }
  };

  const fetchMfaSetup = async () => {
    try {
      const data = await apiFetch<any>('/v1/auth/mfa/setup', { method: 'POST', token });
      setMfaData(data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    if (activeTab === 'mfa') {
      fetchMfaSetup();
    }
  }, [activeTab]);

  const handleEnableMfa = async (e: React.FormEvent) => {
    e.preventDefault();
    setMfaLoading(true);
    setMfaMsg(null);

    try {
      const data = await apiFetch<any>('/v1/auth/mfa/enable', {
        method: 'POST',
        token,
        body: JSON.stringify({ mfa_code: mfaTestCode })
      });
      setMfaMsg({ type: 'success', text: data.message });
      setMfaTestCode('');
      fetchProfile();
    } catch (err: any) {
      setMfaMsg({ type: 'error', text: err.message || 'Failed to verify MFA passcode.' });
    } finally {
      setMfaLoading(false);
    }
  };

  const handleDisableMfa = async () => {
    setMfaLoading(true);
    setMfaMsg(null);
    try {
      await apiFetch('/v1/auth/mfa/disable', { method: 'POST', token });
      setMfaMsg({ type: 'success', text: 'MFA has been disabled.' });
      fetchProfile();
    } catch {
      setMfaMsg({ type: 'error', text: 'Failed to disable MFA.' });
    } finally {
      setMfaLoading(false);
    }
  };

  const handleCopyApiKey = () => {
    navigator.clipboard.writeText(apiKey);
    setCopiedKey(true);
    setTimeout(() => setCopiedKey(false), 2000);
  };

  const handleCopyAccountId = () => {
    navigator.clipboard.writeText(accountId);
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 8) {
      setPasswordMsg({ type: 'error', text: 'Password must be at least 8 characters long.' });
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordMsg({ type: 'error', text: 'New password and confirmation do not match.' });
      return;
    }

    try {
      await apiFetch('/v1/auth/password-reset/confirm', {
        method: 'POST',
        token,
        body: JSON.stringify({ email, reset_token: '', new_password: newPassword })
      });
      setPasswordMsg({ type: 'success', text: 'Password updated successfully!' });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      setPasswordMsg({ type: 'error', text: err.message || 'Password change failed.' });
    }
  };

  return (
    <div className="p-3 xs:p-4 sm:p-6 space-y-4 sm:space-y-6 min-w-0">
      {/* Profile Header Banner */}
      <div className="bg-white dark:bg-[#0F2038] border border-slate-200 dark:border-slate-800 rounded-2xl p-4 sm:p-6 lg:p-8 shadow-sm relative overflow-hidden min-w-0">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 sm:gap-6 min-w-0">
          <div className="flex items-center gap-3 sm:gap-5 min-w-0 w-full lg:w-auto">
            <div className="w-12 h-12 sm:w-16 sm:h-16 lg:w-20 lg:h-20 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 text-white font-black text-xl sm:text-2xl lg:text-3xl flex items-center justify-center shadow-lg shadow-blue-600/25 border-2 border-white/20 shrink-0">
              {displayName.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-base sm:text-xl lg:text-2xl font-black text-slate-900 dark:text-white tracking-tight truncate max-w-[160px] xs:max-w-none">{displayName}</h2>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] sm:text-[11px] font-mono font-black bg-blue-50 dark:bg-blue-500/20 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-500/30 uppercase shrink-0">
                  {role}
                </span>
              </div>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-0.5 font-mono truncate">{email}</p>
              <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                <p className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 font-mono truncate">Account ID: <span className="text-slate-900 dark:text-white font-bold">{accountId}</span></p>
                <button onClick={handleCopyAccountId} className="text-slate-400 hover:text-blue-600 transition-colors cursor-pointer shrink-0" title="Copy Account ID">
                  <Copy className="w-3 h-3" />
                </button>
              </div>
            </div>
          </div>

          <div className="bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 rounded-2xl p-3 sm:p-4 flex flex-wrap sm:flex-nowrap items-center justify-between gap-3 shadow-sm w-full lg:w-auto">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-amber-100 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold shrink-0">
                <Clock className="w-4 h-4 sm:w-5 sm:h-5" />
              </div>
              <div className="min-w-0">
                <p className="text-[9px] sm:text-[10px] font-mono font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">10-Day Free Trial</p>
                <p className="text-xs sm:text-sm font-black text-amber-700 dark:text-amber-400 truncate">{trialDaysRemaining > 0 ? `${trialDaysRemaining} Days Remaining` : 'Trial Expired'}</p>
              </div>
            </div>
            <button
              onClick={onNavigateToBilling}
              className="px-3 sm:px-4 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-black font-extrabold text-xs rounded-xl shadow-md transition-all cursor-pointer shrink-0"
            >
              Upgrade Plan
            </button>
          </div>
        </div>

        {/* Profile Tabs Navigation */}
        <div className="flex items-center gap-2 border-t border-slate-200 dark:border-slate-800/80 pt-4 sm:pt-6 mt-4 sm:mt-6 overflow-x-auto pb-1">
          {[
            { key: 'general' as const, icon: User, label: 'Account & System Role' },
            { key: 'security' as const, icon: Shield, label: 'Password Security' },
            { key: 'mfa' as const, icon: Smartphone, label: 'Multi-Factor Auth (MFA)' },
            { key: 'api' as const, icon: Key, label: 'API Credentials' },
            { key: 'subscription' as const, icon: CreditCard, label: 'Trial & Subscription' },
          ].map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-2 px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap shrink-0 ${
                activeTab === tab.key
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-600/25'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <tab.icon className="w-4 h-4" /> {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content 1: Account & System Role */}
      {activeTab === 'general' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-white dark:bg-[#0F2038] border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-6">
            <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-900 dark:text-white flex items-center gap-2">
              <User className="w-4 h-4 text-blue-600 dark:text-blue-400" /> Account & System Role Assignment
            </h3>

            {roleMsg && (
              <div className={`p-4 rounded-xl text-xs font-bold flex items-center gap-2 ${
                roleMsg.type === 'success' ? 'bg-emerald-50 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/30' : 'bg-red-50 dark:bg-red-500/20 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-500/30'
              }`}>
                {roleMsg.type === 'success' ? <CheckCircle2 className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
                {roleMsg.text}
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="block text-slate-500 dark:text-slate-400 font-bold mb-1.5 uppercase font-mono text-[10px]">Full Display Name</label>
                <input
                  type="text"
                  readOnly
                  value={displayName}
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-slate-900 dark:text-white font-bold"
                />
              </div>

              <div>
                <label className="block text-slate-500 dark:text-slate-400 font-bold mb-1.5 uppercase font-mono text-[10px]">Primary Work Email</label>
                <input
                  type="email"
                  readOnly
                  value={email}
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-slate-900 dark:text-white font-bold font-mono"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1.5 uppercase font-mono text-[10px]">
                  Assigned System Role (RBAC Policy)
                </label>
                <select
                  value={selectedRole}
                  disabled={updatingRole}
                  onChange={(e) => handleRoleChange(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-blue-500/40 rounded-xl p-3 text-blue-600 dark:text-blue-400 font-extrabold font-mono focus:outline-none cursor-pointer"
                >
                  <option value="SuperAdmin">SuperAdmin (Infrastructure Owner — Full Rights)</option>
                  <option value="Developer">Developer (Deploy Workloads & Manage Apps)</option>
                  <option value="Admin">Admin (Resource Operator & Maintenance)</option>
                  <option value="Viewer">Viewer (Telemetry Observer & Read-only)</option>
                </select>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 font-mono">
                  Current Active Role: <strong className="text-slate-900 dark:text-white">{role}</strong>. Changing this updates your IAM access permissions immediately.
                </p>
              </div>

              <div>
                <label className="block text-slate-500 dark:text-slate-400 font-bold mb-1.5 uppercase font-mono text-[10px]">Unique Account ID</label>
                <input
                  type="text"
                  readOnly
                  value={accountId}
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-slate-900 dark:text-white font-bold font-mono"
                />
              </div>

              <div>
                <label className="block text-slate-500 dark:text-slate-400 font-bold mb-1.5 uppercase font-mono text-[10px]">Account Created</label>
                <input
                  type="text"
                  readOnly
                  value={createdAt}
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-slate-900 dark:text-white font-mono"
                />
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-[#0F2038] border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-4">
            <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-900 dark:text-white flex items-center gap-2">
              <Shield className="w-4 h-4 text-emerald-600 dark:text-emerald-400" /> Active System Status
            </h3>

            <div className="space-y-3 text-xs">
              {[
                { label: 'Account Access', value: 'FULL ACCESS', color: 'emerald' },
                { label: 'Multi-Factor Auth', value: profileData?.is_mfa_enabled ? 'ENABLED' : 'DISABLED', color: profileData?.is_mfa_enabled ? 'emerald' : 'amber' },
                { label: 'Billing Region', value: 'India (INR ₹)', color: 'slate' },
                { label: 'API Key Status', value: 'ACTIVE', color: 'emerald' },
                { label: 'Trial Status', value: trialDaysRemaining > 0 ? 'ACTIVE' : 'EXPIRED', color: trialDaysRemaining > 0 ? 'amber' : 'red' },
              ].map((item, i) => (
                <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800">
                  <span className="text-slate-600 dark:text-slate-400 font-medium">{item.label}</span>
                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-${item.color}-50 dark:bg-${item.color}-500/20 text-${item.color}-700 dark:text-${item.color}-400 border border-${item.color}-200 dark:border-${item.color}-500/30`}>
                    {item.value}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Tab Content 2: Multi-Factor Authentication (MFA / 2FA) */}
      {activeTab === 'mfa' && (
        <div className="bg-white dark:bg-[#0F2038] border border-slate-200 dark:border-slate-800 rounded-2xl p-6 sm:p-8 shadow-sm max-w-3xl space-y-6">
          <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Smartphone className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                Multi-Factor Authentication (MFA / 2FA)
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">Protect your Aravanta CloudOS account with TOTP authenticator passcodes.</p>
            </div>
            <span className={`px-3 py-1 rounded-full text-xs font-mono font-black uppercase border ${
              profileData?.is_mfa_enabled
                ? 'bg-emerald-50 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/30'
                : 'bg-amber-50 dark:bg-amber-500/20 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-500/30'
            }`}>
              {profileData?.is_mfa_enabled ? 'MFA ACTIVE' : 'MFA DISABLED'}
            </span>
          </div>

          {mfaMsg && (
            <div className={`p-4 rounded-xl text-xs font-bold flex items-center gap-2 ${
              mfaMsg.type === 'success' ? 'bg-emerald-50 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/30' : 'bg-red-50 dark:bg-red-500/20 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-500/30'
            }`}>
              {mfaMsg.type === 'success' ? <CheckCircle2 className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
              {mfaMsg.text}
            </div>
          )}

          {profileData?.is_mfa_enabled ? (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 text-xs text-emerald-800 dark:text-emerald-300">
                <p className="font-bold flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  Your account is protected by TOTP Multi-Factor Authentication.
                </p>
                <p className="mt-1 font-mono text-[11px] text-emerald-600 dark:text-emerald-400">
                  Every sign-in will prompt for a 6-digit TOTP code generated by Google Authenticator, Authy, or 1Password.
                </p>
              </div>

              <button
                onClick={handleDisableMfa}
                disabled={mfaLoading}
                className="px-6 py-3 bg-red-600 hover:bg-red-700 text-white font-bold text-xs rounded-xl shadow-md transition-all cursor-pointer"
              >
                {mfaLoading ? 'Disabling...' : 'Disable MFA'}
              </button>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="space-y-4">
                <h4 className="text-xs font-bold uppercase font-mono text-slate-900 dark:text-white">Step 1: Scan QR Code with Authenticator App</h4>
                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                  Open <strong>Google Authenticator</strong>, <strong>Authy</strong>, or <strong>Microsoft Authenticator</strong> on your mobile phone and scan this QR code:
                </p>

                <div className="flex flex-col sm:flex-row items-center gap-6 p-4 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                  {/* Scannable QR Code Image */}
                  <div className="w-40 h-40 bg-white p-2.5 rounded-xl border border-slate-300 shadow-md shrink-0 flex items-center justify-center">
                    <img
                      src={`https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=${encodeURIComponent(
                        mfaData?.otpauth_url || `otpauth://totp/AravantaCloudOS:${email}?secret=${mfaData?.mfa_secret || 'ARAVANTASECRETKEY123'}&issuer=AravantaCloudOS`
                      )}`}
                      alt="MFA QR Code"
                      className="w-full h-full object-contain"
                    />
                  </div>

                  <div className="space-y-2 flex-1">
                    <p className="text-xs font-bold text-slate-700 dark:text-slate-300 font-mono uppercase">Or Enter Key Manually:</p>
                    <div className="p-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-mono text-sm font-black text-blue-600 dark:text-blue-400 flex items-center justify-between shadow-sm">
                      <span className="truncate">{mfaData?.mfa_secret || 'ARAVANTASECRETKEY123'}</span>
                      <button
                        type="button"
                        onClick={() => navigator.clipboard.writeText(mfaData?.mfa_secret || 'ARAVANTASECRETKEY123')}
                        className="text-xs font-bold text-slate-500 hover:text-blue-600 cursor-pointer shrink-0 ml-2"
                      >
                        Copy Key
                      </button>
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">Account: <span className="font-mono font-bold text-slate-900 dark:text-white">{email}</span></p>
                  </div>
                </div>
              </div>

              <form onSubmit={handleEnableMfa} className="space-y-3">
                <h4 className="text-xs font-bold uppercase font-mono text-slate-900 dark:text-white">Step 2: Enter 6-Digit Passcode to Enable</h4>
                <input
                  type="text"
                  maxLength={6}
                  required
                  placeholder="e.g. 123456"
                  value={mfaTestCode}
                  onChange={(e) => setMfaTestCode(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-slate-900 dark:text-white font-mono font-bold tracking-widest text-center text-lg focus:outline-none focus:border-blue-600"
                />

                <button
                  type="submit"
                  disabled={mfaLoading || mfaTestCode.length < 6}
                  className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-lg shadow-blue-600/20 transition-all cursor-pointer disabled:opacity-50"
                >
                  {mfaLoading ? 'Verifying...' : 'Verify & Enable MFA'}
                </button>
              </form>
            </div>
          )}
        </div>
      )}

      {/* Tab Content 3: Security */}
      {activeTab === 'security' && (
        <div className="bg-white dark:bg-[#0F2038] border border-slate-200 dark:border-slate-800 rounded-2xl p-6 sm:p-8 shadow-sm max-w-2xl space-y-6">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Shield className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            Change Account Password
          </h3>

          {passwordMsg && (
            <div className={`p-4 rounded-xl text-xs font-bold flex items-center gap-2 ${
              passwordMsg.type === 'success' ? 'bg-emerald-50 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/30' : 'bg-red-50 dark:bg-red-500/20 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-500/30'
            }`}>
              {passwordMsg.type === 'success' ? <CheckCircle2 className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
              {passwordMsg.text}
            </div>
          )}

          <form onSubmit={handlePasswordChange} className="space-y-4 text-xs">
            <div>
              <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1.5 uppercase font-mono">Current Password</label>
              <input
                type="password"
                required
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-slate-900 dark:text-white focus:outline-none focus:border-blue-600"
              />
            </div>

            <div>
              <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1.5 uppercase font-mono">New Secure Password</label>
              <input
                type="password"
                required
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="At least 8 characters"
                className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-slate-900 dark:text-white focus:outline-none focus:border-blue-600"
              />
            </div>

            <div>
              <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1.5 uppercase font-mono">Confirm New Password</label>
              <input
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Re-enter new password"
                className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-slate-900 dark:text-white focus:outline-none focus:border-blue-600"
              />
            </div>

            <button
              type="submit"
              className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-extrabold rounded-xl shadow-lg shadow-blue-600/25 transition-all cursor-pointer"
            >
              Update Password
            </button>
          </form>
        </div>
      )}

      {/* Tab Content 4: API Credentials */}
      {activeTab === 'api' && (
        <div className="bg-white dark:bg-[#0F2038] border border-slate-200 dark:border-slate-800 rounded-2xl p-6 sm:p-8 shadow-sm max-w-3xl space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Key className="w-5 h-5 text-amber-600 dark:text-amber-400" />
              API Secret Token & Access Keys
            </h3>
            <button
              onClick={() => setApiKey(`arv_live_${Math.random().toString(36).substring(2, 15)}${Math.random().toString(36).substring(2, 15)}`)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-mono font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 border border-slate-200 dark:border-slate-700 transition-colors cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" /> Roll Token
            </button>
          </div>

          <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 font-mono text-xs">
            <input
              type="text"
              readOnly
              value={apiKey}
              className="w-full bg-transparent text-slate-900 dark:text-slate-100 font-bold focus:outline-none"
            />
            <button
              onClick={handleCopyApiKey}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold flex items-center gap-2 text-xs shrink-0 cursor-pointer"
            >
              <Copy className="w-3.5 h-3.5" />
              {copiedKey ? 'Copied!' : 'Copy Key'}
            </button>
          </div>
        </div>
      )}

      {/* Tab Content 5: Subscription */}
      {activeTab === 'subscription' && (
        <div className="bg-white dark:bg-[#0F2038] border border-slate-200 dark:border-slate-800 rounded-2xl p-6 sm:p-8 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                10-Day Free Trial Status & Access Permissions
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">All new accounts receive 10 days of unrestricted Enterprise Cloud access.</p>
            </div>
            <span className={`px-3 py-1 rounded-full text-xs font-mono font-black uppercase border ${
              trialDaysRemaining > 0
                ? 'bg-amber-50 dark:bg-amber-500/20 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-500/30'
                : 'bg-red-50 dark:bg-red-500/20 text-red-700 dark:text-red-400 border-red-200 dark:border-red-500/30'
            }`}>
              {trialDaysRemaining > 0 ? 'TRIAL ACTIVE' : 'TRIAL EXPIRED'}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800">
              <span className="text-[10px] font-mono uppercase font-bold text-slate-500 dark:text-slate-400">Trial Started</span>
              <p className="text-lg font-black text-slate-900 dark:text-white mt-1">{createdAt}</p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800">
              <span className="text-[10px] font-mono uppercase font-bold text-amber-600 dark:text-amber-400">Days Remaining</span>
              <p className="text-lg font-black text-amber-700 dark:text-amber-400 mt-1">{trialDaysRemaining} Days</p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800">
              <span className="text-[10px] font-mono uppercase font-bold text-slate-500 dark:text-slate-400">Included Services</span>
              <p className="text-sm font-bold text-slate-900 dark:text-white mt-1">All 7 Cloud Services</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
