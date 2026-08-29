import React, { useState, useRef, useEffect } from 'react';
import { Eye, EyeOff, AlertCircle, CheckCircle2, KeyRound, ShieldCheck, Check, ArrowLeft } from 'lucide-react';
import { Logo } from '../components/Logo';
import { apiFetch } from '../config/api';

interface LoginProps {
  onLoginSuccess: (user: any, token: string) => void;
  onGoToLanding?: () => void;
  initialTab?: 'signin' | 'register';
}

// Enterprise MFA Verification Component
const MfaVerifyForm: React.FC<{
  email: string;
  loading: boolean;
  mfaCode: string;
  setMfaCode: (v: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  onCancel: () => void;
}> = ({ email, loading, mfaCode, setMfaCode, onSubmit, onCancel }) => {
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  return (
    <form onSubmit={onSubmit} className="space-y-5">
      <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-center space-y-2">
        <div className="w-10 h-10 rounded-lg bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 mx-auto flex items-center justify-center border border-blue-200 dark:border-blue-800">
          <KeyRound className="w-5 h-5" />
        </div>
        <div>
          <h4 className="text-xs font-bold text-slate-900 dark:text-white">Two-Factor Authentication Required</h4>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 font-mono mt-0.5">{email}</p>
        </div>
      </div>

      <div>
        <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 text-center">
          Enter 6-Digit Authenticator Code
        </label>
        <div className="relative max-w-xs mx-auto">
          <input
            ref={inputRef}
            type="text"
            maxLength={6}
            required
            placeholder="000000"
            value={mfaCode}
            onChange={(e) => setMfaCode(e.target.value.replace(/\D/g, ''))}
            className="w-full px-4 py-3 text-center font-mono font-bold text-xl tracking-[0.35em] rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 transition-all"
          />
        </div>
      </div>

      <div className="space-y-2.5">
        <button
          type="submit"
          disabled={loading || mfaCode.length < 6}
          className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-semibold text-xs rounded-lg transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
        >
          {loading ? (
            <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
          ) : (
            <>
              <span>Verify & Continue</span>
              <ShieldCheck className="w-4 h-4" />
            </>
          )}
        </button>

        <button
          type="button"
          onClick={onCancel}
          className="w-full text-center text-xs font-medium text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer py-1"
        >
          Back to Sign In
        </button>
      </div>
    </form>
  );
};

export const Login: React.FC<LoginProps> = ({ onLoginSuccess, onGoToLanding, initialTab = 'signin' }) => {
  // Tab state: 'signin' | 'register' | 'reset' | 'mfa'
  const [activeTab, setActiveTab] = useState<'signin' | 'register' | 'reset' | 'mfa'>(initialTab);

  useEffect(() => {
    setActiveTab(initialTab);
  }, [initialTab]);

  // Sign-in fields
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [signInRole, setSignInRole] = useState('SuperAdmin');

  // Registration fields
  const [regFullName, setRegFullName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirmPwd, setRegConfirmPwd] = useState('');
  const [regRole, setRegRole] = useState('Developer');

  // Reset Password fields
  const [resetStep, setResetStep] = useState<1 | 2>(1);
  const [resetEmail, setResetEmail] = useState('');
  const [resetToken, setResetToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');

  // MFA Field
  const [mfaCode, setMfaCode] = useState('');
  const [mfaUserData, setMfaUserData] = useState<any>(null);

  // UI States
  const [showPassword, setShowPassword] = useState(false);
  const [showRegPwd, setShowRegPwd] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const emailInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    emailInputRef.current?.focus();
  }, [activeTab, resetStep]);

  // Sign In Handler
  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!email.trim()) {
      setError('Please enter your work email or Account ID.');
      return;
    }
    if (!password) {
      setError('Please enter your password.');
      return;
    }

    setLoading(true);
    try {
      const data = await apiFetch<any>('/v1/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email: email.trim(), password, role: signInRole }),
      });

      if (data.is_mfa_required) {
        setMfaUserData(data);
        setActiveTab('mfa');
        setSuccess('Two-Factor Authentication required.');
        return;
      }

      onLoginSuccess(
        {
          email: data.email,
          account_id: data.account_id || 'ARV-ACC-889412',
          role: data.role || signInRole || 'Developer',
          full_name: data.full_name || data.email.split('@')[0].replace(/[._]/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase()),
        },
        data.access_token
      );
    } catch (err: any) {
      setError(err.message || 'Authentication failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // MFA Verification Handler
  const handleMfaVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (mfaCode.length < 6) {
      setError('Please enter the 6-digit passcode.');
      return;
    }

    setLoading(true);
    try {
      const data = await apiFetch<any>('/v1/auth/mfa/verify', {
        method: 'POST',
        body: JSON.stringify({ email: mfaUserData?.email || email, mfa_code: mfaCode }),
      });

      onLoginSuccess(
        {
          email: data.email,
          account_id: data.account_id || 'ARV-ACC-889412',
          role: data.role || 'Developer',
          full_name: data.full_name || data.email.split('@')[0],
        },
        data.access_token
      );
    } catch (err: any) {
      setError(err.message || 'MFA verification failed.');
    } finally {
      setLoading(false);
    }
  };

  // Register Handler
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!regFullName.trim()) { setError('Full name is required.'); return; }
    if (!regEmail.trim()) { setError('Work email is required.'); return; }
    if (regPassword.length < 8) { setError('Password must be at least 8 characters long.'); return; }
    if (regPassword !== regConfirmPwd) { setError('Passwords do not match.'); return; }

    setLoading(true);
    try {
      const data = await apiFetch<any>('/v1/auth/register', {
        method: 'POST',
        body: JSON.stringify({ email: regEmail.trim(), password: regPassword, full_name: regFullName.trim(), role: regRole }),
      });

      setSuccess(`Account registered as '${data.role || regRole}'! Authenticating...`);

      // Auto-login after successful registration. Kept in its own try/catch so a
      // login failure falls back to the sign-in tab instead of surfacing as a
      // registration error.
      try {
        const loginData = await apiFetch<any>('/v1/auth/login', {
          method: 'POST',
          body: JSON.stringify({ email: regEmail.trim(), password: regPassword }),
        });

        setTimeout(() => {
          onLoginSuccess(
            {
              email: loginData.email,
              account_id: loginData.account_id || data.account_id,
              role: loginData.role || regRole,
              full_name: regFullName.trim(),
            },
            loginData.access_token
          );
        }, 500);
      } catch {
        setActiveTab('signin');
        setEmail(regEmail);
        setSuccess('Account registered. Please enter password to sign in.');
      }
    } catch (err: any) {
      setError(err.message || 'Unable to complete registration.');
    } finally {
      setLoading(false);
    }
  };

  // Step 1: Request Password Reset Verification Code
  const handleResetRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!resetEmail.trim()) {
      setError('Please enter your work email address.');
      return;
    }

    setLoading(true);
    try {
      await apiFetch('/v1/auth/password-reset/request', {
        method: 'POST',
        body: JSON.stringify({ email: resetEmail.trim() }),
      });

      setSuccess(`Verification code sent to ${resetEmail.trim()}`);
      setResetStep(2);
    } catch (err: any) {
      setError(err.message || 'Failed to send reset code.');
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Confirm Password Reset
  const handleResetConfirm = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!resetToken.trim()) {
      setError('Please enter verification code.');
      return;
    }
    if (newPassword.length < 8) {
      setError('New password must be at least 8 characters.');
      return;
    }
    if (newPassword !== confirmNewPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);
    try {
      await apiFetch('/v1/auth/password-reset/confirm', {
        method: 'POST',
        body: JSON.stringify({ email: resetEmail.trim(), reset_token: resetToken.trim(), new_password: newPassword }),
      });

      setEmail(resetEmail);
      setActiveTab('signin');
      setResetStep(1);
      setResetEmail('');
      setResetToken('');
      setNewPassword('');
      setConfirmNewPassword('');
      setSuccess('Password updated successfully. You can now sign in.');
    } catch (err: any) {
      setError(err.message || 'Failed to update password.');
    } finally {
      setLoading(false);
    }
  };

  const handleTabSwitch = (tab: 'signin' | 'register' | 'reset' | 'mfa') => {
    setError('');
    setSuccess('');
    if (tab !== 'reset') {
      setResetStep(1);
    }
    setActiveTab(tab);
  };

  return (
    <div className="min-h-screen w-full lg:h-screen lg:overflow-hidden flex flex-col lg:flex-row font-sans bg-slate-900 text-slate-100">
      
      {/* ─── LEFT BRANDING HERO PANEL ─── */}
      <div className="w-full lg:w-[45%] bg-[#0B1528] p-8 sm:p-12 flex flex-col justify-between border-r border-slate-800 relative overflow-hidden shrink-0">
        
        {/* Subtle Geometric Background */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b_1px,transparent_1px),linear-gradient(to_bottom,#1e293b_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] opacity-20 pointer-events-none"></div>

        {/* Top Logo */}
        <div className="relative z-10">
          <div className="mb-10">
            <Logo size="lg" variant="dark" />
          </div>

          {/* Heading */}
          <div className="space-y-4 max-w-md">
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-white leading-tight font-sans">
              Enterprise Infrastructure & Cloud Operations.
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 leading-relaxed font-normal">
              Unified management plane for compute instances, Kubernetes clusters, object storage, and managed relational databases.
            </p>
          </div>
        </div>

        {/* Value Points */}
        <div className="relative z-10 my-8 space-y-3.5 max-w-md hidden sm:block">
          <div className="flex items-center gap-3 text-xs text-slate-300">
            <div className="w-5 h-5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center shrink-0">
              <Check className="w-3 h-3" />
            </div>
            <span>High-performance virtual servers & Kubernetes worker nodes</span>
          </div>

          <div className="flex items-center gap-3 text-xs text-slate-300">
            <div className="w-5 h-5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
              <Check className="w-3 h-3" />
            </div>
            <span>Zero-Trust RBAC security with TOTP 2FA multi-factor protection</span>
          </div>

          <div className="flex items-center gap-3 text-xs text-slate-300">
            <div className="w-5 h-5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center shrink-0">
              <Check className="w-3 h-3" />
            </div>
            <span>Multi-region S3 storage buckets & PostgreSQL/MySQL databases</span>
          </div>
        </div>

        {/* Bottom Platform Status */}
        <div className="relative z-10 pt-4 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400 font-mono">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            <span>Console Status: <strong className="text-emerald-400 font-medium">99.99% Operational</strong></span>
          </div>
          <span className="text-[11px] text-slate-500 hidden sm:inline">Region: arv-us-east-1</span>
        </div>
      </div>

      {/* ─── RIGHT FORM PANEL ─── */}
      <div className="w-full lg:w-[55%] bg-white dark:bg-slate-950 p-6 sm:p-12 flex flex-col justify-between overflow-y-auto min-h-0 text-slate-900 dark:text-slate-100">
        
        <div className="max-w-sm mx-auto w-full my-auto">
          {onGoToLanding && (
            <div className="mb-6">
              <button
                type="button"
                onClick={onGoToLanding}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-blue-600 dark:text-slate-400 dark:hover:text-white transition-colors cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Back to Product Home</span>
              </button>
            </div>
          )}

          {/* Segmented Control Tabs */}
          {activeTab !== 'mfa' && activeTab !== 'reset' && (
            <div className="p-1 bg-slate-100 dark:bg-slate-900 rounded-lg flex mb-8 border border-slate-200 dark:border-slate-800">
              <button
                type="button"
                onClick={() => handleTabSwitch('signin')}
                className={`flex-1 py-2 text-xs font-semibold rounded-md transition-all cursor-pointer ${
                  activeTab === 'signin'
                    ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                Sign In
              </button>
              <button
                type="button"
                onClick={() => handleTabSwitch('register')}
                className={`flex-1 py-2 text-xs font-semibold rounded-md transition-all cursor-pointer ${
                  activeTab === 'register'
                    ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                Create Account
              </button>
            </div>
          )}

          {/* Form Header Title */}
          <div className="mb-6">
            <h3 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">
              {activeTab === 'signin' && 'Sign in to Console'}
              {activeTab === 'register' && 'Create Infrastructure Account'}
              {activeTab === 'reset' && 'Reset Account Password'}
              {activeTab === 'mfa' && 'Multi-Factor Verification'}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              {activeTab === 'signin' && 'Enter your work email or Account ID to access management portal.'}
              {activeTab === 'register' && '10-day free trial with access to all 7 cloud modules.'}
              {activeTab === 'reset' && 'Enter your registered work email to receive verification code.'}
              {activeTab === 'mfa' && 'Enter the 6-digit TOTP code from your authenticator app.'}
            </p>
          </div>

          {/* Alerts */}
          {error && (
            <div className="mb-5 p-3 rounded-lg bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800/60 text-red-700 dark:text-red-300 text-xs font-medium flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-600 dark:text-red-400 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="mb-5 p-3 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 text-emerald-700 dark:text-emerald-300 text-xs font-medium flex items-start gap-2.5">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600 dark:text-emerald-400 mt-0.5" />
              <span>{success}</span>
            </div>
          )}

          {/* ─── SIGN IN FORM ─── */}
          {activeTab === 'signin' && (
            <form onSubmit={handleSignIn} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                  Work Email or Account ID
                </label>
                <input
                  ref={emailInputRef}
                  type="text"
                  required
                  placeholder="alex@company.com or ARV-ACC-892341"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full h-10 px-3.5 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 transition-colors"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300">
                    Password
                  </label>
                  <button
                    type="button"
                    onClick={() => { setResetEmail(email); handleTabSwitch('reset'); }}
                    className="text-xs font-medium text-blue-600 dark:text-blue-400 hover:underline"
                  >
                    Forgot password?
                  </button>
                </div>

                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    placeholder="••••••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full h-10 px-3.5 pr-10 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 transition-colors"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                  Assign System Role (RBAC)
                </label>
                <select
                  value={signInRole}
                  onChange={(e) => setSignInRole(e.target.value)}
                  className="w-full h-10 px-3 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 transition-colors cursor-pointer font-medium"
                >
                  <option value="SuperAdmin">SuperAdmin (Infrastructure Owner)</option>
                  <option value="Developer">Developer (Deploy Workloads & Apps)</option>
                  <option value="Admin">Admin (Resource Operator)</option>
                  <option value="Viewer">Viewer (Telemetry Observer)</option>
                </select>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full h-10 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-semibold text-xs rounded-lg transition-colors flex items-center justify-center cursor-pointer disabled:opacity-60 mt-2"
              >
                {loading ? (
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                ) : (
                  'Sign In to Console'
                )}
              </button>
            </form>
          )}

          {/* ─── MFA VERIFICATION FORM ─── */}
          {activeTab === 'mfa' && (
            <MfaVerifyForm
              email={mfaUserData?.email || email}
              loading={loading}
              mfaCode={mfaCode}
              setMfaCode={setMfaCode}
              onSubmit={handleMfaVerify}
              onCancel={() => handleTabSwitch('signin')}
            />
          )}

          {/* ─── CREATE ACCOUNT FORM ─── */}
          {activeTab === 'register' && (
            <form onSubmit={handleRegister} className="space-y-3.5">
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Full Name
                </label>
                <input
                  ref={emailInputRef}
                  type="text"
                  required
                  placeholder="Jordan Vance"
                  value={regFullName}
                  onChange={(e) => setRegFullName(e.target.value)}
                  className="w-full h-10 px-3.5 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Work Email Address
                </label>
                <input
                  type="email"
                  required
                  placeholder="jordan@company.com"
                  value={regEmail}
                  onChange={(e) => setRegEmail(e.target.value)}
                  className="w-full h-10 px-3.5 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 transition-colors"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Password
                  </label>
                  <div className="relative">
                    <input
                      type={showRegPwd ? 'text' : 'password'}
                      required
                      placeholder="Min 8 chars"
                      value={regPassword}
                      onChange={(e) => setRegPassword(e.target.value)}
                      className="w-full h-10 px-3.5 pr-9 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 transition-colors"
                    />
                    <button
                      type="button"
                      onClick={() => setShowRegPwd(!showRegPwd)}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                    >
                      {showRegPwd ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Confirm Password
                  </label>
                  <input
                    type="password"
                    required
                    placeholder="Re-type password"
                    value={regConfirmPwd}
                    onChange={(e) => setRegConfirmPwd(e.target.value)}
                    className="w-full h-10 px-3.5 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Assign System Role (RBAC)
                </label>
                <select
                  value={regRole}
                  onChange={(e) => setRegRole(e.target.value)}
                  className="w-full h-10 px-3 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 transition-colors cursor-pointer"
                >
                  <option value="SuperAdmin">SuperAdmin (Infrastructure Owner)</option>
                  <option value="Developer">Developer (Deploy Workloads & Apps)</option>
                  <option value="Admin">Admin (Resource Operator)</option>
                  <option value="Viewer">Viewer (Telemetry Observer)</option>
                </select>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full h-10 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-semibold text-xs rounded-lg transition-colors flex items-center justify-center cursor-pointer disabled:opacity-60 mt-3"
              >
                {loading ? 'Creating Account...' : 'Complete Registration'}
              </button>
            </form>
          )}

          {/* ─── RESET PASSWORD FORM ─── */}
          {activeTab === 'reset' && (
            <div className="space-y-4">
              {resetStep === 1 ? (
                <form onSubmit={handleResetRequest} className="space-y-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                      Registered Work Email
                    </label>
                    <input
                      ref={emailInputRef}
                      type="email"
                      required
                      placeholder="alex@company.com"
                      value={resetEmail}
                      onChange={(e) => setResetEmail(e.target.value)}
                      className="w-full h-10 px-3.5 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 transition-colors"
                    />
                  </div>

                  <div className="space-y-2">
                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full h-10 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs rounded-lg transition-colors flex items-center justify-center cursor-pointer disabled:opacity-60"
                    >
                      {loading ? 'Sending Code...' : 'Send Verification Code'}
                    </button>

                    <button
                      type="button"
                      onClick={() => handleTabSwitch('signin')}
                      className="w-full text-center text-xs font-medium text-slate-500 hover:text-slate-900 dark:hover:text-white py-1 transition-colors cursor-pointer"
                    >
                      Back to Sign In
                    </button>
                  </div>
                </form>
              ) : (
                <form onSubmit={handleResetConfirm} className="space-y-3.5">
                  <div>
                    <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                      Verification Code
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Enter 6-digit code"
                      value={resetToken}
                      onChange={(e) => setResetToken(e.target.value)}
                      className="w-full h-10 px-3.5 text-xs font-mono font-bold rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 transition-colors"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                      New Password
                    </label>
                    <input
                      type="password"
                      required
                      placeholder="At least 8 characters"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="w-full h-10 px-3.5 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 transition-colors"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                      Confirm New Password
                    </label>
                    <input
                      type="password"
                      required
                      placeholder="Re-type new password"
                      value={confirmNewPassword}
                      onChange={(e) => setConfirmNewPassword(e.target.value)}
                      className="w-full h-10 px-3.5 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 transition-colors"
                    />
                  </div>

                  <div className="space-y-2 pt-1">
                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full h-10 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs rounded-lg transition-colors flex items-center justify-center cursor-pointer disabled:opacity-60"
                    >
                      {loading ? 'Updating Password...' : 'Reset Password & Sign In'}
                    </button>

                    <button
                      type="button"
                      onClick={() => handleTabSwitch('signin')}
                      className="w-full text-center text-xs font-medium text-slate-500 hover:text-slate-900 dark:hover:text-white py-1 transition-colors cursor-pointer"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="mt-8 text-center text-xs text-slate-400 font-normal">
          &copy; {new Date().getFullYear()} Aravanta CloudOS. Enterprise Infrastructure Platform.
        </div>
      </div>
    </div>
  );
};
