import React, { useState, useEffect, useMemo } from 'react';
import {
  Eye,
  EyeOff,
  AlertCircle,
  CheckCircle2,
  KeyRound,
  ArrowLeft,
  Activity,
  Lock,
  ShieldCheck,
  Globe,
  Layers,
  Cpu,
  Boxes,
  Loader2,
  X,
} from 'lucide-react';
import { Logo } from '../components/Logo';
import { apiFetch } from '../config/api';

interface LoginProps {
  onLoginSuccess: (user: any, token: string) => void;
  onGoToLanding?: () => void;
  initialTab?: 'signin' | 'register' | 'invite';
  inviteToken?: string | null;
}

// ---- lightweight inline validators ----
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const ACCOUNT_ID_RE = /^ARV-ACC-\d{6,}$/i;
const isValidLoginIdentifier = (v: string) =>
  EMAIL_RE.test(v.trim()) || ACCOUNT_ID_RE.test(v.trim());
const isValidEmail = (v: string) => EMAIL_RE.test(v.trim());
const pwdStrong = (v: string) => v.length >= 8;
// -------------------------------------

export const Login: React.FC<LoginProps> = ({
  onLoginSuccess,
  onGoToLanding,
  initialTab = 'signin',
  inviteToken = null,
}) => {
  const [activeTab, setActiveTab] = useState<'signin' | 'register' | 'mfa' | 'forgot' | 'invite'>(initialTab);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [errorDismissed, setErrorDismissed] = useState(false);
  const [success, setSuccess] = useState('');

  // Sign In form state
  const [email, setEmail] = useState('');
  const [emailTouched, setEmailTouched] = useState(false);
  const [password, setPassword] = useState('');
  const [passwordTouched, setPasswordTouched] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);

  // Register form state
  const [regFullName, setRegFullName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regEmailTouched, setRegEmailTouched] = useState(false);
  const [regPassword, setRegPassword] = useState('');
  const [regConfirmPwd, setRegConfirmPwd] = useState('');
  const [regWorkspaceName, setRegWorkspaceName] = useState('');

  // Derived: sign-in form validity (submit disabled until OK)
  const signInValid = useMemo(
    () => isValidLoginIdentifier(email) && pwdStrong(password),
    [email, password],
  );
  const signInEmailHint =
    emailTouched && email && !isValidLoginIdentifier(email)
      ? 'Enter a valid work email or Account ID (ARV-ACC-100001).'
      : '';
  const signInPwdHint =
    passwordTouched && password && !pwdStrong(password)
      ? 'Password must be at least 8 characters.'
      : '';

  // MFA & Password Reset
  const [mfaCode, setMfaCode] = useState('');
  const [mfaUserData, setMfaUserData] = useState<any>(null);
  const [resetEmail, setResetEmail] = useState('');
  const [resetCode, setResetCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');

  // Invitation state
  const [tokenFromUrl, setTokenFromUrl] = useState<string | null>(() => {
    if (inviteToken) return inviteToken;
    try {
      const params = new URLSearchParams(window.location.search);
      return params.get('invite_token');
    } catch {
      return null;
    }
  });
  const [inviteDetails, setInviteDetails] = useState<any>(null);
  const [invitePassword, setInvitePassword] = useState('');
  const [inviteConfirmPassword, setInviteConfirmPassword] = useState('');
  const [inviteFullName, setInviteFullName] = useState('');
  const [showInvitePassword, setShowInvitePassword] = useState(false);

  useEffect(() => {
    if (tokenFromUrl || initialTab === 'invite') {
      setActiveTab('invite');
    } else {
      setActiveTab(initialTab);
    }
    setError('');
    setSuccess('');
  }, [initialTab, tokenFromUrl]);

  useEffect(() => {
    if (tokenFromUrl) {
      setLoading(true);
      apiFetch<any>(`/api/v1/auth/workspace/invite/verify?token=${encodeURIComponent(tokenFromUrl)}`)
        .then((data) => {
          setInviteDetails(data);
          if (data.full_name) {
            setInviteFullName(data.full_name);
          }
        })
        .catch((err: any) => {
          setError(err.message || 'Invitation is invalid or has expired.');
        })
        .finally(() => {
          setLoading(false);
        });
    }
  }, [tokenFromUrl]);

  // Handle standard login
  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      const data = await apiFetch<any>('/api/v1/auth/login', {
        method: 'POST',
        body: JSON.stringify({
          email: email.trim(),
          password: password
        })
      });

      if (data.is_mfa_required) {
        setMfaUserData(data);
        setActiveTab('mfa');
        setSuccess('Credentials verified. Please provide your 6-digit TOTP code.');
      } else {
        const userObj = {
          id: data.user_id,
          account_id: data.account_id,
          workspace_id: data.workspace_id,
          workspace_name: data.workspace_name,
          email: data.email,
          full_name: data.full_name,
          role: data.role,
          is_mfa_enabled: Boolean(data.is_mfa_enabled)
        };
        onLoginSuccess(userObj, data.access_token);
      }
    } catch (err: any) {
      setError(err.message || 'Authentication failed. Please check your credentials or network connection.');
    } finally {
      setLoading(false);
    }
  };

  // Handle registration
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (regPassword !== regConfirmPwd) {
      setError('Passwords do not match. Please verify.');
      return;
    }

    if (regPassword.length < 8) {
      setError('Password must be at least 8 characters long.');
      return;
    }

    setLoading(true);
    try {
      await apiFetch<any>('/api/v1/auth/register', {
        method: 'POST',
        body: JSON.stringify({
          email: regEmail.trim(),
          password: regPassword,
          full_name: regFullName.trim(),
          workspace_name: regWorkspaceName.trim() || `${regFullName.trim()}'s Workspace`
        })
      });

      // Auto login after registration
      const loginData = await apiFetch<any>('/api/v1/auth/login', {
        method: 'POST',
        body: JSON.stringify({
          email: regEmail.trim(),
          password: regPassword
        })
      });

      const userObj = {
        id: loginData.user_id,
        account_id: loginData.account_id,
        workspace_id: loginData.workspace_id,
        workspace_name: loginData.workspace_name,
        email: loginData.email,
        full_name: loginData.full_name,
        role: loginData.role,
        is_mfa_enabled: Boolean(loginData.is_mfa_enabled)
      };

      onLoginSuccess(userObj, loginData.access_token);
    } catch (err: any) {
      const msg = err.message || 'Registration failed.';
      if (msg.toLowerCase().includes('already exists') || msg.toLowerCase().includes('already registered')) {
        setEmail(regEmail.trim());
        setPassword('');
        setActiveTab('signin');
        setError('An account with this email already exists. Please sign in instead.');
      } else {
        setError(msg);
      }
    } finally {
      setLoading(false);
    }
  };

  // Handle MFA verification
  const handleMfaVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const emailToVerify = mfaUserData?.email || email;
      const data = await apiFetch<any>('/api/v1/auth/mfa/verify', {
        method: 'POST',
        body: JSON.stringify({
          email: emailToVerify,
          mfa_code: mfaCode.trim()
        })
      });

      const userObj = {
        id: data.user_id,
        account_id: data.account_id,
        workspace_id: data.workspace_id,
        workspace_name: data.workspace_name,
        email: data.email,
        full_name: data.full_name,
        role: data.role,
        is_mfa_enabled: true
      };
      onLoginSuccess(userObj, data.access_token);
    } catch (err: any) {
      setError(err.message || 'Invalid MFA code. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Handle password reset request
  const handleRequestReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      const data = await apiFetch<any>('/api/v1/auth/password-reset/request', {
        method: 'POST',
        body: JSON.stringify({ email: resetEmail.trim() })
      });
      setSuccess(data.message || 'Verification code sent to your email.');
      if (data.reset_token) {
        setResetCode(data.reset_token);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to request reset token.');
    } finally {
      setLoading(false);
    }
  };

  // Handle password reset confirmation
  const handleConfirmReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (newPassword !== confirmNewPassword) {
      setError('New passwords do not match.');
      return;
    }

    const targetEmail = (resetEmail || email).trim();
    if (!targetEmail) {
      setError('Please provide the account email address.');
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const data = await apiFetch<any>('/api/v1/auth/password-reset/confirm', {
        method: 'POST',
        body: JSON.stringify({
          email: targetEmail,
          reset_token: resetCode.trim(),
          new_password: newPassword
        })
      });
      setSuccess(data.message || 'Password reset successfully.');
      setTimeout(() => {
        setActiveTab('signin');
        setEmail(targetEmail);
        setResetCode('');
      }, 1500);
    } catch (err: any) {
      setError(err.message || 'Password reset failed.');
    } finally {
      setLoading(false);
    }
  };

  // Handle invitation acceptance
  const handleAcceptInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (invitePassword !== inviteConfirmPassword) {
      setError('Passwords do not match. Please verify.');
      return;
    }

    if (invitePassword.length < 8) {
      setError('Password must be at least 8 characters long.');
      return;
    }

    setLoading(true);
    try {
      const data = await apiFetch<any>('/api/v1/auth/workspace/invite/accept', {
        method: 'POST',
        body: JSON.stringify({
          token: tokenFromUrl,
          password: invitePassword,
          full_name: inviteFullName.trim() || undefined,
        })
      });

      const userObj = {
        id: data.user_id,
        account_id: data.account_id,
        workspace_id: data.workspace_id,
        workspace_name: data.workspace_name,
        email: data.email,
        full_name: data.full_name,
        role: data.role,
        is_mfa_enabled: Boolean(data.is_mfa_enabled)
      };

      try {
        window.history.replaceState({}, document.title, window.location.pathname);
      } catch {}

      onLoginSuccess(userObj, data.access_token);
    } catch (err: any) {
      setError(err.message || 'Failed to accept invitation. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-screen h-screen min-h-screen m-0 p-0 overflow-hidden bg-slate-900 flex flex-col md:flex-row font-sans selection:bg-brandGold-500/30 selection:text-brandGold-900 dark:selection:text-brandGold-100 touch-manipulation select-none [touch-action:manipulation]">

      {/* ── LEFT PANE: SRE Platform Console Deck ── */}
      {/* Responsive: `hidden md:flex` collapses this panel cleanly on <768px (mobile / small tablet). */}
      <div className="hidden md:flex md:w-[46%] lg:w-[42%] h-full bg-[#0B0F17] text-white border-r border-slate-800/80 p-8 lg:p-12 flex-col justify-between overflow-y-auto touch-manipulation">
        <div className="space-y-8">
          {/* Logo Brand Header */}
          <div className="flex items-center gap-3">
            <Logo size="md" variant="dark" />
          </div>

          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brandGold-500/10 border border-brandGold-500/30 text-brandGold-400 text-xs font-mono font-bold">
              <span className="w-2 h-2 rounded-full bg-brandGold-400 animate-pulse" />
              Unified Cloud Operations Platform
            </div>
            <h1 className="text-2xl lg:text-3xl font-black tracking-tight text-white font-sans leading-tight">
              A single control plane for multi-cloud workloads.
            </h1>
            <p className="text-xs lg:text-sm text-slate-400 font-normal leading-relaxed">
              Automate GitOps release pipelines, monitor telemetry with sub-second MTTR, and manage isolated infrastructure workloads with zero-trust RBAC.
            </p>
          </div>

          {/* Telemetry & SLA Status Strip */}
          <div className="bg-[#111827]/90 rounded-2xl border border-slate-800 p-4 space-y-3 font-mono text-xs shadow-inner">
            <div className="flex items-center justify-between">
              <span className="text-slate-400 flex items-center gap-2">
                <Activity className="w-3.5 h-3.5 text-emerald-400" /> Control Plane SLA
              </span>
              <span className="text-emerald-400 font-bold">99.98% High Availability</span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-slate-400 flex items-center gap-2">
                <Globe className="w-3.5 h-3.5 text-brandGold-400" /> Active Region
              </span>
              <span className="text-white font-bold">ap-south-1 (Mumbai, 4 AZs)</span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-slate-400 flex items-center gap-2">
                <Lock className="w-3.5 h-3.5 text-purple-400" /> IAM Governance
              </span>
              <span className="text-purple-400 font-bold">Zero-Trust & TOTP MFA</span>
            </div>
          </div>

          {/* Capability Badges */}
          <div className="space-y-2">
            <span className="text-[10px] font-bold font-mono uppercase tracking-wider text-slate-500">Core Capabilities</span>
            <div className="grid grid-cols-2 gap-2 text-xs font-mono">
              <div className="p-2.5 rounded-xl bg-[#111827]/60 border border-slate-800/80 text-slate-300 flex items-center gap-2">
                <Cpu className="w-3.5 h-3.5 text-brandGold-400" /> Elastic Compute
              </div>
              <div className="p-2.5 rounded-xl bg-[#111827]/60 border border-slate-800/80 text-slate-300 flex items-center gap-2">
                <Boxes className="w-3.5 h-3.5 text-purple-400" /> Kubernetes EKS
              </div>
              <div className="p-2.5 rounded-xl bg-[#111827]/60 border border-slate-800/80 text-slate-300 flex items-center gap-2">
                <Layers className="w-3.5 h-3.5 text-emerald-400" /> GitOps Pipelines
              </div>
              <div className="p-2.5 rounded-xl bg-[#111827]/60 border border-slate-800/80 text-slate-300 flex items-center gap-2">
                <ShieldCheck className="w-3.5 h-3.5 text-amber-400" /> SRE Alertmanager
              </div>
            </div>
          </div>
        </div>

        {/* Footer info */}
        <div className="pt-6 border-t border-slate-800/80 flex items-center justify-between text-[11px] font-mono text-slate-500">
          <span>TLS 1.3 Strict Encrypted Session</span>
          <span>v1.0.0 Stable</span>
        </div>
      </div>

      {/* ── RIGHT PANE: Full-Bleed Authentication Form ── */}
      <div className="flex-1 h-full bg-slate-50 dark:bg-[#0B0F17] flex flex-col justify-between p-6 sm:p-10 lg:p-14 overflow-y-auto">
        <div className="w-full max-w-md mx-auto space-y-6 my-auto">
          
          {/* Top Bar: Back to Landing & Mobile Logo */}
          <div className="flex items-center justify-between gap-4">
            <div className="md:hidden">
              <Logo size="sm" />
            </div>
            {onGoToLanding && (
              <button
                type="button"
                onClick={onGoToLanding}
                className="inline-flex items-center gap-2 text-xs font-mono font-bold text-slate-500 hover:text-brandGold-600 dark:hover:text-brandGold-400 transition-colors cursor-pointer ml-auto"
              >
                <ArrowLeft className="w-3.5 h-3.5" /> Back to Home
              </button>
            )}
          </div>

          {/* Tab Switcher */}
          {activeTab !== 'mfa' && activeTab !== 'forgot' && activeTab !== 'invite' && (
            <div
              role="tablist"
              aria-label="Authentication mode"
              className="p-1 bg-slate-200/80 dark:bg-[#111827] rounded-2xl border border-slate-300 dark:border-slate-800 font-mono text-xs font-bold flex items-center"
            >
              <button
                type="button"
                role="tab"
                aria-selected={activeTab === 'signin'}
                tabIndex={activeTab === 'signin' ? 0 : -1}
                onClick={() => { setActiveTab('signin'); setError(''); setSuccess(''); }}
                className={`relative flex-1 py-2.5 rounded-xl transition-all cursor-pointer ${
                  activeTab === 'signin'
                    ? 'bg-white dark:bg-[#1E293B] text-slate-900 dark:text-white shadow-sm ring-1 ring-black/5 dark:ring-white/5'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                Sign In
                {activeTab === 'signin' && (
                  <span
                    aria-hidden="true"
                    className="absolute left-1/2 -translate-x-1/2 -bottom-1 w-10 h-0.5 rounded-full bg-[#C6923B]"
                  />
                )}
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={activeTab === 'register'}
                tabIndex={activeTab === 'register' ? 0 : -1}
                onClick={() => { setActiveTab('register'); setError(''); setSuccess(''); }}
                className={`relative flex-1 py-2.5 rounded-xl transition-all cursor-pointer ${
                  activeTab === 'register'
                    ? 'bg-white dark:bg-[#1E293B] text-slate-900 dark:text-white shadow-sm ring-1 ring-black/5 dark:ring-white/5'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                Create Workspace
                {activeTab === 'register' && (
                  <span
                    aria-hidden="true"
                    className="absolute left-1/2 -translate-x-1/2 -bottom-1 w-10 h-0.5 rounded-full bg-[#C6923B]"
                  />
                )}
              </button>
            </div>
          )}

          {/* Feedback Messages — dismissible, inline, user-safe */}
          {error && !errorDismissed && (
            <div
              role="alert"
              aria-live="polite"
              className="p-3.5 bg-rose-50 dark:bg-rose-500/15 border border-rose-200 dark:border-rose-500/30 rounded-xl text-xs text-rose-700 dark:text-rose-400 flex items-start gap-2.5 font-mono animate-fadeIn"
            >
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" aria-hidden="true" />
              <div className="flex-1 space-y-2">
                <div>{error}</div>
                <div className="flex items-center gap-3 pt-0.5">
                  <button
                    type="button"
                    onClick={() => {
                      setError('');
                      setErrorDismissed(false);
                      window.location.reload();
                    }}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-rose-600/10 hover:bg-rose-600/20 text-rose-700 dark:text-rose-300 font-bold transition-colors cursor-pointer"
                  >
                    Retry
                  </button>
                </div>
              </div>
              <button
                type="button"
                aria-label="Dismiss error message"
                onClick={() => {
                  setErrorDismissed(true);
                }}
                className="shrink-0 p-1 rounded hover:bg-rose-200/60 dark:hover:bg-rose-500/20 cursor-pointer transition-colors"
              >
                <X className="w-3.5 h-3.5" aria-hidden="true" />
              </button>
            </div>
          )}

          {success && (
            <div
              role="status"
              aria-live="polite"
              className="p-3.5 bg-emerald-50 dark:bg-emerald-500/15 border border-emerald-200 dark:border-emerald-500/30 rounded-xl text-xs text-emerald-700 dark:text-emerald-400 flex items-start gap-2.5 font-mono animate-fadeIn"
            >
              <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" aria-hidden="true" />
              <span>{success}</span>
            </div>
          )}

          {/* ── 1. SIGN IN FORM ── */}
          {activeTab === 'signin' && (
            <form onSubmit={handleSignIn} className="space-y-4 font-mono text-xs touch-manipulation">
              <div>
                <label htmlFor="signin-email" className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Work Email or Account ID
                </label>
                <input
                  id="signin-email"
                  name="email"
                  type="text"
                  autoComplete="username"
                  aria-label="Work email or Aravanta account ID"
                  aria-invalid={!!signInEmailHint}
                  aria-describedby={signInEmailHint ? 'signin-email-hint' : undefined}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onBlur={() => setEmailTouched(true)}
                  placeholder="name@company.com or ARV-ACC-100001"
                  required
                  className="w-full px-3.5 py-2.5 bg-white dark:bg-[#111827] border border-slate-300 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white placeholder:text-slate-500 dark:placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#C6923B]/40 focus:border-[#C6923B]"
                />
                {signInEmailHint && (
                  <p id="signin-email-hint" className="mt-1 text-[10px] text-rose-600 dark:text-rose-400">
                    {signInEmailHint}
                  </p>
                )}
              </div>

              <div>
                <div className="flex justify-between items-center mb-1">
                  <label htmlFor="signin-password" className="font-bold text-slate-700 dark:text-slate-300">
                    Password
                  </label>
                  <button
                    type="button"
                    onClick={() => { setActiveTab('forgot'); setError(''); setSuccess(''); setResetEmail(email); }}
                    className="text-[11px] text-[#C6923B] dark:text-[#E5B04E] hover:underline cursor-pointer font-bold"
                  >
                    Forgot password?
                  </button>
                </div>
                <div className="relative">
                  <input
                    id="signin-password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    aria-label="Account password"
                    aria-invalid={!!signInPwdHint}
                    aria-describedby={signInPwdHint ? 'signin-password-hint' : undefined}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    onBlur={() => setPasswordTouched(true)}
                    placeholder="Minimum 8 characters"
                    required
                    className="w-full px-3.5 py-2.5 bg-white dark:bg-[#111827] border border-slate-300 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white placeholder:text-slate-500 dark:placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#C6923B]/40 focus:border-[#C6923B] pr-10"
                  />
                  <button
                    type="button"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" aria-hidden="true" /> : <Eye className="w-4 h-4" aria-hidden="true" />}
                  </button>
                </div>
                <p id="signin-password-hint" className="mt-1 text-[10px] text-slate-500 dark:text-slate-400">
                  {signInPwdHint || 'At least 8 characters.'}
                </p>
              </div>

              <div className="flex items-center justify-between pt-1">
                <label className="flex items-center gap-2 cursor-pointer text-slate-600 dark:text-slate-400 select-none">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    aria-label="Stay signed in for 30 days on this device"
                    className="rounded text-[#C6923B] accent-[#C6923B] focus:ring-[#C6923B]"
                  />
                  <span className="text-[11px]">Stay signed in for 30 days</span>
                </label>
              </div>

              <button
                type="submit"
                disabled={loading || !signInValid}
                aria-disabled={loading || !signInValid}
                className="w-full py-3 bg-[#C6923B] hover:bg-[#B07B28] text-white font-bold rounded-xl shadow-md shadow-[#C6923B]/25 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed mt-2 font-sans inline-flex items-center justify-center gap-2"
              >
                {loading && <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />}
                {loading ? 'Authenticating…' : 'Sign In to Control Plane'}
              </button>
            </form>
          )}

          {/* ── 2. CREATE ACCOUNT FORM ── */}
          {activeTab === 'register' && (
            <form onSubmit={handleRegister} className="space-y-3 font-mono text-xs">
              <div>
                <label htmlFor="reg-name" className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Full Name</label>
                <input id="reg-name" name="name" type="text" autoComplete="name" aria-label="Full name" value={regFullName}
                  onChange={(e) => setRegFullName(e.target.value)} placeholder="Yash Baviskar" required
                  className="w-full px-3.5 py-2.5 bg-white dark:bg-[#111827] border border-slate-300 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white placeholder:text-slate-500 dark:placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#C6923B]/40 focus:border-[#C6923B]" />
              </div>

              <div>
                <label htmlFor="reg-email" className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Work Email</label>
                <input id="reg-email" name="email" type="email" autoComplete="email" aria-label="Work email address"
                  aria-invalid={!!(regEmailTouched && regEmail && !isValidEmail(regEmail))}
                  value={regEmail} onChange={(e) => setRegEmail(e.target.value)} onBlur={() => setRegEmailTouched(true)}
                  placeholder="engineer@aravanta.com" required
                  className="w-full px-3.5 py-2.5 bg-white dark:bg-[#111827] border border-slate-300 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white placeholder:text-slate-500 dark:placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#C6923B]/40 focus:border-[#C6923B]" />
                {regEmailTouched && regEmail && !isValidEmail(regEmail) && (
                  <p className="mt-1 text-[10px] text-rose-600 dark:text-rose-400">Enter a valid work email address.</p>
                )}
              </div>

              <div>
                <label htmlFor="reg-workspace" className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Workspace Name</label>
                <input id="reg-workspace" type="text" aria-label="Workspace name" value={regWorkspaceName}
                  onChange={(e) => setRegWorkspaceName(e.target.value)} placeholder="Production SRE Cluster" required
                  className="w-full px-3.5 py-2.5 bg-white dark:bg-[#111827] border border-slate-300 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white placeholder:text-slate-500 dark:placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#C6923B]/40 focus:border-[#C6923B]" />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label htmlFor="reg-pwd" className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Password</label>
                  <input id="reg-pwd" name="new-password" type="password" autoComplete="new-password" aria-label="New password"
                    value={regPassword} onChange={(e) => setRegPassword(e.target.value)} placeholder="Min. 8 characters" required
                    className="w-full px-3 py-2.5 bg-white dark:bg-[#111827] border border-slate-300 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white placeholder:text-slate-500 dark:placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#C6923B]/40 focus:border-[#C6923B]" />
                </div>
                <div>
                  <label htmlFor="reg-pwd2" className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Confirm Password</label>
                  <input id="reg-pwd2" name="new-password" type="password" autoComplete="new-password" aria-label="Confirm new password"
                    value={regConfirmPwd} onChange={(e) => setRegConfirmPwd(e.target.value)} placeholder="Repeat password" required
                    className="w-full px-3 py-2.5 bg-white dark:bg-[#111827] border border-slate-300 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white placeholder:text-slate-500 dark:placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#C6923B]/40 focus:border-[#C6923B]" />
                </div>
              </div>
              {regPassword && (
                <p className={`text-[10px] ${pwdStrong(regPassword) ? 'text-slate-500 dark:text-slate-400' : 'text-rose-600 dark:text-rose-400'}`}>
                  {pwdStrong(regPassword) ? 'Password OK.' : 'Password must be at least 8 characters.'}
                  {regConfirmPwd && regConfirmPwd !== regPassword && (
                    <span className="block text-rose-600 dark:text-rose-400">Passwords do not match.</span>
                  )}
                </p>
              )}

              <button
                type="submit"
                disabled={loading || !(regFullName.trim() && isValidEmail(regEmail) && regWorkspaceName.trim() && pwdStrong(regPassword) && (!regConfirmPwd || regConfirmPwd === regPassword))}
                aria-disabled={loading || !(regFullName.trim() && isValidEmail(regEmail) && regWorkspaceName.trim() && pwdStrong(regPassword) && (!regConfirmPwd || regConfirmPwd === regPassword))}
                className="w-full py-3 bg-[#C6923B] hover:bg-[#B07B28] text-white font-bold rounded-xl shadow-md shadow-[#C6923B]/25 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed mt-1 font-sans inline-flex items-center justify-center gap-2"
              >
                {loading && <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />}
                {loading ? 'Creating Workspace…' : 'Create Operational Workspace'}
              </button>
            </form>
          )}

          {/* ── 3. MFA CODE VERIFICATION STEP ── */}
          {activeTab === 'mfa' && (
            <form onSubmit={handleMfaVerify} className="space-y-4 font-mono text-xs">
              <div className="p-4 bg-slate-50 dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 text-center space-y-2">
                <div className="w-10 h-10 rounded-xl bg-[#C6923B]/15 text-[#C6923B] dark:text-[#E5B04E] flex items-center justify-center mx-auto">
                  <KeyRound className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-slate-900 dark:text-white font-sans text-sm">Enter Authenticator Passcode</h3>
                <p className="text-[11px] text-slate-500 font-sans">
                  Open Google Authenticator or Authy to retrieve your 6-digit TOTP code for <strong className="text-[#C6923B] dark:text-[#E5B04E]">{mfaUserData?.email || email}</strong>.
                </p>
              </div>

              <div>
                <input
                  type="text"
                  maxLength={6}
                  value={mfaCode}
                  onChange={(e) => setMfaCode(e.target.value.replace(/\D/g, ''))}
                  placeholder="000000"
                  autoFocus
                  required
                  className="w-full px-4 py-3 bg-white dark:bg-[#111827] border border-slate-300 dark:border-slate-800 rounded-xl text-center text-2xl font-bold tracking-widest text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#C6923B]/30 focus:border-[#C6923B]"
                />
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => { setActiveTab('signin'); setError(''); }}
                  className="flex-1 py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold rounded-xl transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading || mfaCode.length < 6}
                  className="flex-1 py-2.5 bg-[#C6923B] hover:bg-[#B07B28] text-white font-bold rounded-xl shadow-md shadow-[#C6923B]/25 transition-all cursor-pointer disabled:opacity-50"
                >
                  {loading ? 'Verifying...' : 'Verify TOTP'}
                </button>
              </div>
            </form>
          )}

          {/* ── 4. FORGOT PASSWORD STEP ── */}
          {activeTab === 'forgot' && (
            <div className="space-y-4 font-mono text-xs">
              {!resetCode ? (
                <form onSubmit={handleRequestReset} className="space-y-4">
                  <div className="space-y-1">
                    <h3 className="font-bold text-slate-900 dark:text-white font-sans text-sm">Reset Account Password</h3>
                    <p className="text-[11px] text-slate-500 font-sans">
                      Enter your account email to generate a secure reset token.
                    </p>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Email Address</label>
                    <input
                      type="email"
                      value={resetEmail}
                      onChange={(e) => setResetEmail(e.target.value)}
                      placeholder="name@company.com"
                      required
                      className="w-full px-3.5 py-2.5 bg-white dark:bg-[#111827] border border-slate-300 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-[#C6923B]/30 focus:border-[#C6923B]"
                    />
                  </div>

                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setActiveTab('signin')}
                      className="flex-1 py-2.5 bg-slate-100 dark:bg-slate-800 rounded-xl font-bold"
                    >
                      Back to Sign In
                    </button>
                    <button
                      type="submit"
                      disabled={loading}
                      className="flex-1 py-2.5 bg-[#C6923B] hover:bg-[#B07B28] text-white rounded-xl font-bold shadow-md shadow-[#C6923B]/25"
                    >
                      {loading ? 'Sending...' : 'Request Reset Code'}
                    </button>
                  </div>
                </form>
              ) : (
                <form onSubmit={handleConfirmReset} className="space-y-3">
                  <div className="p-3 bg-[#C6923B]/10 border border-[#C6923B]/30 rounded-xl text-slate-700 dark:text-slate-300 text-[11px]">
                    Resetting password for: <strong className="text-[#C6923B] dark:text-[#E5B04E] font-bold">{resetEmail || email || 'your account'}</strong>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Verification Code</label>
                    <input
                      type="text"
                      value={resetCode}
                      onChange={(e) => setResetCode(e.target.value)}
                      placeholder="6-digit reset code"
                      required
                      className="w-full px-3.5 py-2.5 bg-white dark:bg-[#111827] border border-slate-300 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white font-bold focus:outline-none focus:ring-2 focus:ring-[#C6923B]/30 focus:border-[#C6923B]"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">New Password</label>
                    <input
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Min. 8 characters"
                      required
                      className="w-full px-3.5 py-2.5 bg-white dark:bg-[#111827] border border-slate-300 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-[#C6923B]/30 focus:border-[#C6923B]"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Confirm New Password</label>
                    <input
                      type="password"
                      value={confirmNewPassword}
                      onChange={(e) => setConfirmNewPassword(e.target.value)}
                      placeholder="Repeat new password"
                      required
                      className="w-full px-3.5 py-2.5 bg-white dark:bg-[#111827] border border-slate-300 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-[#C6923B]/30 focus:border-[#C6923B]"
                    />
                  </div>

                  <div className="flex gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => setActiveTab('signin')}
                      className="flex-1 py-2.5 bg-slate-100 dark:bg-slate-800 rounded-xl font-bold"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={loading}
                      className="flex-1 py-2.5 bg-[#C6923B] hover:bg-[#B07B28] text-white rounded-xl font-bold shadow-md shadow-[#C6923B]/25"
                    >
                      {loading ? 'Saving...' : 'Set New Password'}
                    </button>
                  </div>
                </form>
              )}
            </div>
          )}

          {/* ── 5. ACCEPT WORKSPACE INVITATION STEP ── */}
          {activeTab === 'invite' && (
            <form onSubmit={handleAcceptInvite} className="space-y-4 font-mono text-xs">
              <div className="p-4 bg-blue-50 dark:bg-blue-500/10 rounded-2xl border border-blue-200 dark:border-blue-500/30 text-center space-y-1.5">
                <div className="w-10 h-10 rounded-xl bg-blue-500/15 text-blue-600 dark:text-blue-400 flex items-center justify-center mx-auto">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-slate-900 dark:text-white font-sans text-sm">
                  Join Workspace: {inviteDetails?.workspace_name || 'Production Workspace'}
                </h3>
                <p className="text-[11px] text-slate-500 font-sans">
                  You were invited by <strong className="text-blue-600 dark:text-blue-400">{inviteDetails?.invited_by || 'Workspace Admin'}</strong> to join as a <span className="px-1.5 py-0.5 rounded bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 font-bold">{inviteDetails?.role || 'Developer'}</span>.
                </p>
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Invited Email Address</label>
                <input
                  type="email"
                  value={inviteDetails?.email || ''}
                  disabled
                  className="w-full px-3.5 py-2.5 bg-slate-100 dark:bg-[#161f30] border border-slate-300 dark:border-slate-800 rounded-xl text-slate-600 dark:text-slate-400 font-bold cursor-not-allowed"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Your Full Name</label>
                <input
                  type="text"
                  value={inviteFullName}
                  onChange={(e) => setInviteFullName(e.target.value)}
                  placeholder="e.g. Alex Kumar"
                  required
                  className="w-full px-3.5 py-2.5 bg-white dark:bg-[#111827] border border-slate-300 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-[#C6923B]/30 focus:border-[#C6923B]"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Create Your Password</label>
                <div className="relative">
                  <input
                    type={showInvitePassword ? 'text' : 'password'}
                    value={invitePassword}
                    onChange={(e) => setInvitePassword(e.target.value)}
                    placeholder="Min. 8 characters"
                    required
                    className="w-full px-3.5 py-2.5 bg-white dark:bg-[#111827] border border-slate-300 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-[#C6923B]/30 focus:border-[#C6923B] pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowInvitePassword(!showInvitePassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                  >
                    {showInvitePassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Confirm Password</label>
                <input
                  type="password"
                  value={inviteConfirmPassword}
                  onChange={(e) => setInviteConfirmPassword(e.target.value)}
                  placeholder="Repeat your password"
                  required
                  className="w-full px-3.5 py-2.5 bg-white dark:bg-[#111827] border border-slate-300 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-[#C6923B]/30 focus:border-[#C6923B]"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 bg-[#C6923B] hover:bg-[#B07B28] text-white font-bold rounded-xl shadow-md shadow-[#C6923B]/25 transition-all cursor-pointer disabled:opacity-50 font-sans"
                >
                  {loading ? 'Joining Workspace...' : 'Accept Invitation & Launch Console'}
                </button>
              </div>

              <div className="text-center pt-2">
                <button
                  type="button"
                  onClick={() => { setTokenFromUrl(null); setActiveTab('signin'); }}
                  className="text-[11px] text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 cursor-pointer"
                >
                  Already have another account? Switch to Sign In
                </button>
              </div>
            </form>
          )}

        </div>

        {/* Right Pane Footer */}
        <div className="w-full max-w-md mx-auto pt-6 text-center text-[11px] font-mono text-slate-400">
          Aravanta CloudOS Control Plane • Multi-Tenant Enterprise SRE
        </div>
      </div>

    </div>
  );
};
