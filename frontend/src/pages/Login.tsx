import React, { useState, useEffect } from 'react';
import { 
  Eye, 
  EyeOff, 
  AlertCircle, 
  CheckCircle2, 
  KeyRound, 
  ArrowLeft,
  Server,
  Activity,
  Lock
} from 'lucide-react';
import { Logo } from '../components/Logo';
import { apiFetch } from '../config/api';

interface LoginProps {
  onLoginSuccess: (user: any, token: string) => void;
  onGoToLanding?: () => void;
  initialTab?: 'signin' | 'register';
}

export const Login: React.FC<LoginProps> = ({ 
  onLoginSuccess, 
  onGoToLanding, 
  initialTab = 'signin' 
}) => {
  const [activeTab, setActiveTab] = useState<'signin' | 'register' | 'mfa' | 'forgot'>(initialTab);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Sign In form state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [signInRole, setSignInRole] = useState('SuperAdmin');
  const [rememberMe, setRememberMe] = useState(true);

  // Register form state
  const [regFullName, setRegFullName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirmPwd, setRegConfirmPwd] = useState('');
  const [regWorkspaceName, setRegWorkspaceName] = useState('');
  const [regRole, setRegRole] = useState('Developer');

  // MFA & Password Reset
  const [mfaCode, setMfaCode] = useState('');
  const [mfaUserData, setMfaUserData] = useState<any>(null);
  const [resetEmail, setResetEmail] = useState('');
  const [resetCode, setResetCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [resetStep, setResetStep] = useState<'email' | 'code'>('email');

  useEffect(() => {
    setError('');
    setSuccess('');
  }, [activeTab]);

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
      const data = await apiFetch<any>('/api/v1/auth/login', {
        method: 'POST',
        body: JSON.stringify({
          email: email.trim(),
          password: password,
          role: signInRole,
        }),
      });

      if (data.is_mfa_required) {
        setMfaUserData(data);
        setActiveTab('mfa');
        setSuccess('Two-Factor Authentication (MFA) required.');
        return;
      }

      onLoginSuccess(
        {
          id: data.user_id,
          account_id: data.account_id || 'ARV-ACC-100001',
          workspace_id: data.workspace_id || 'ws-yash-prod',
          workspace_name: data.workspace_name || 'Production Cloud Ops',
          email: data.email,
          role: data.role || signInRole,
          full_name: data.full_name || email.split('@')[0],
        },
        data.access_token
      );
    } catch (err: any) {
      setError(err.message || 'Authentication failed. Please verify credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!regFullName.trim()) { setError('Full name is required.'); return; }
    if (!regEmail.trim()) { setError('Work email is required.'); return; }
    if (regPassword.length < 8) { setError('Password must be at least 8 characters.'); return; }
    if (regPassword !== regConfirmPwd) { setError('Passwords do not match.'); return; }

    setLoading(true);
    try {
      const data = await apiFetch<any>('/api/v1/auth/register', {
        method: 'POST',
        body: JSON.stringify({
          email: regEmail.trim(),
          password: regPassword,
          full_name: regFullName.trim(),
          workspace_name: regWorkspaceName.trim() || `${regFullName.trim()}'s Workspace`,
          role: regRole,
        }),
      });

      setSuccess(`Account created for ${data.full_name}! Authenticating...`);

      // Auto login
      try {
        const loginData = await apiFetch<any>('/api/v1/auth/login', {
          method: 'POST',
          body: JSON.stringify({ email: regEmail.trim(), password: regPassword }),
        });

        setTimeout(() => {
          onLoginSuccess(
            {
              id: loginData.user_id || data.id,
              account_id: loginData.account_id || data.account_id,
              workspace_id: loginData.workspace_id || data.workspace_id,
              workspace_name: loginData.workspace_name || data.workspace_name,
              email: loginData.email,
              role: loginData.role || regRole,
              full_name: regFullName.trim(),
            },
            loginData.access_token
          );
        }, 400);
      } catch {
        setActiveTab('signin');
        setEmail(regEmail);
      }
    } catch (err: any) {
      setError(err.message || 'Registration failed. Please check form entries.');
    } finally {
      setLoading(false);
    }
  };

  const handleMfaVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (mfaCode.length < 6) {
      setError('Please enter the 6-digit TOTP code.');
      return;
    }

    setLoading(true);
    try {
      const data = await apiFetch<any>('/api/v1/auth/mfa/verify', {
        method: 'POST',
        body: JSON.stringify({ email: mfaUserData?.email || email, mfa_code: mfaCode }),
      });

      onLoginSuccess(
        {
          id: data.user_id,
          account_id: data.account_id,
          workspace_id: data.workspace_id,
          workspace_name: data.workspace_name,
          email: data.email,
          role: data.role || 'Developer',
          full_name: data.full_name,
        },
        data.access_token
      );
    } catch (err: any) {
      setError(err.message || 'MFA passcode verification failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleResetRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!resetEmail.trim()) { setError('Email is required.'); return; }
    setLoading(true);
    try {
      const res = await apiFetch<any>('/api/v1/auth/password-reset/request', {
        method: 'POST',
        body: JSON.stringify({ email: resetEmail.trim() }),
      });
      setSuccess(`Verification code generated for ${resetEmail}. Code: ${res.reset_token || '123456'}`);
      setResetStep('code');
    } catch (err: any) {
      setError(err.message || 'Reset request failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleResetConfirm = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!resetCode.trim()) { setError('Enter verification code.'); return; }
    if (newPassword.length < 8) { setError('New password must be at least 8 characters.'); return; }

    setLoading(true);
    try {
      await apiFetch<any>('/api/v1/auth/password-reset/confirm', {
        method: 'POST',
        body: JSON.stringify({ email: resetEmail.trim(), reset_token: resetCode.trim(), new_password: newPassword }),
      });
      setSuccess('Password updated successfully! You can now sign in.');
      setTimeout(() => setActiveTab('signin'), 1200);
    } catch (err: any) {
      setError(err.message || 'Password reset failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-[#0A1628] flex flex-col justify-center py-8 px-4 sm:px-6 lg:px-8 font-sans selection:bg-blue-600 selection:text-white">
      
      {/* Top back button */}
      {onGoToLanding && (
        <div className="max-w-4xl mx-auto w-full mb-6">
          <button
            onClick={onGoToLanding}
            className="inline-flex items-center gap-2 text-xs font-mono font-bold text-slate-500 hover:text-blue-600 dark:hover:text-blue-400 transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Back to Product Home
          </button>
        </div>
      )}

      {/* Main Split Layout Container */}
      <div className="max-w-4xl mx-auto w-full bg-white dark:bg-[#0F2038] border border-slate-200 dark:border-slate-800 rounded-3xl shadow-xl overflow-hidden grid grid-cols-1 md:grid-cols-12">
        
        {/* Left Side: Product Identity & Operational Telemetry */}
        <div className="md:col-span-5 bg-slate-900 text-white p-6 sm:p-8 flex flex-col justify-between border-b md:border-b-0 md:border-r border-slate-800 font-mono">
          <div className="space-y-6">
            <Logo size="md" variant="dark" />

            <div className="space-y-2 pt-4">
              <h2 className="text-lg font-black text-white font-sans">
                Aravanta CloudOS Control Plane
              </h2>
              <p className="text-xs text-slate-400 font-sans leading-relaxed">
                Self-service management platform for compute workloads, GitOps release pipelines, and SRE observability.
              </p>
            </div>

            {/* Quick Status Block */}
            <div className="p-3.5 bg-slate-800/80 rounded-2xl border border-slate-700/60 space-y-2 text-xs">
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-slate-400 flex items-center gap-1.5"><Activity className="w-3.5 h-3.5 text-emerald-400" /> Platform Status</span>
                <span className="text-emerald-400 font-bold">99.98% SLA</span>
              </div>
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-slate-400 flex items-center gap-1.5"><Server className="w-3.5 h-3.5 text-blue-400" /> Primary Region</span>
                <span className="text-white">ap-south-1</span>
              </div>
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-slate-400 flex items-center gap-1.5"><Lock className="w-3.5 h-3.5 text-purple-400" /> Security Mode</span>
                <span className="text-purple-400 font-bold">Zero Trust</span>
              </div>
            </div>
          </div>

          <div className="pt-6 border-t border-slate-800/80 text-[10px] text-slate-500">
            <span>TLS 1.3 Encrypted Session • MFA Enforced</span>
          </div>
        </div>

        {/* Right Side: Authentication Forms */}
        <div className="md:col-span-7 p-6 sm:p-8 space-y-5">
          
          {/* Navigation Tab Selector */}
          {activeTab !== 'mfa' && activeTab !== 'forgot' && (
            <div className="flex items-center gap-2 p-1 bg-slate-100 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 font-mono text-xs font-bold">
              <button
                type="button"
                onClick={() => setActiveTab('signin')}
                className={`flex-1 py-2 rounded-lg transition-all cursor-pointer ${
                  activeTab === 'signin'
                    ? 'bg-white dark:bg-[#0F2038] text-slate-900 dark:text-white shadow-sm'
                    : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                Sign In
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('register')}
                className={`flex-1 py-2 rounded-lg transition-all cursor-pointer ${
                  activeTab === 'register'
                    ? 'bg-white dark:bg-[#0F2038] text-slate-900 dark:text-white shadow-sm'
                    : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                Create Account
              </button>
            </div>
          )}

          {/* Feedback Messages */}
          {error && (
            <div className="p-3 bg-rose-50 dark:bg-rose-500/15 border border-rose-200 dark:border-rose-500/30 rounded-xl text-xs text-rose-700 dark:text-rose-400 flex items-start gap-2 font-mono">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="p-3 bg-emerald-50 dark:bg-emerald-500/15 border border-emerald-200 dark:border-emerald-500/30 rounded-xl text-xs text-emerald-700 dark:text-emerald-400 flex items-start gap-2 font-mono">
              <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{success}</span>
            </div>
          )}

          {/* ── 1. Sign In Form ── */}
          {activeTab === 'signin' && (
            <form onSubmit={handleSignIn} className="space-y-4 font-mono text-xs">
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Work Email or Account ID
                </label>
                <input
                  type="text"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@company.com or ARV-ACC-100001"
                  required
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="font-bold text-slate-700 dark:text-slate-300">Password</label>
                  <button
                    type="button"
                    onClick={() => setActiveTab('forgot')}
                    className="text-[11px] text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
                  >
                    Forgot password?
                  </button>
                </div>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••••••"
                    required
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-1">
                <div>
                  <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Sign-In Role</label>
                  <select
                    value={signInRole}
                    onChange={(e) => setSignInRole(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-700 dark:text-slate-300 font-bold cursor-pointer"
                  >
                    <option value="SuperAdmin">SuperAdmin (Full Access)</option>
                    <option value="Admin">Admin (Workspace)</option>
                    <option value="Operator">Operator (SRE)</option>
                    <option value="Developer">Developer</option>
                    <option value="Viewer">Viewer (Read-Only)</option>
                  </select>
                </div>

                <div className="flex items-center pt-5">
                  <label className="flex items-center gap-2 cursor-pointer text-slate-600 dark:text-slate-400">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="rounded text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-[11px]">Remember me</span>
                  </label>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-md transition-all cursor-pointer disabled:opacity-50 mt-2"
              >
                {loading ? 'Authenticating...' : 'Sign In to Workspace'}
              </button>
            </form>
          )}

          {/* ── 2. Create Account Form ── */}
          {activeTab === 'register' && (
            <form onSubmit={handleRegister} className="space-y-3 font-mono text-xs">
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Full Name</label>
                <input
                  type="text"
                  value={regFullName}
                  onChange={(e) => setRegFullName(e.target.value)}
                  placeholder="Yash Baviskar"
                  required
                  className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Work Email</label>
                <input
                  type="email"
                  value={regEmail}
                  onChange={(e) => setRegEmail(e.target.value)}
                  placeholder="engineer@company.com"
                  required
                  className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Workspace Name</label>
                <input
                  type="text"
                  value={regWorkspaceName}
                  onChange={(e) => setRegWorkspaceName(e.target.value)}
                  placeholder="e.g. Production Cloud Ops"
                  className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Password</label>
                  <input
                    type="password"
                    value={regPassword}
                    onChange={(e) => setRegPassword(e.target.value)}
                    placeholder="Min. 8 characters"
                    required
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Confirm Password</label>
                  <input
                    type="password"
                    value={regConfirmPwd}
                    onChange={(e) => setRegConfirmPwd(e.target.value)}
                    placeholder="Repeat password"
                    required
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Default Workspace Role</label>
                <select
                  value={regRole}
                  onChange={(e) => setRegRole(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-700 dark:text-slate-300 font-bold cursor-pointer"
                >
                  <option value="Admin">Admin (Full Control)</option>
                  <option value="Operator">Operator (SRE)</option>
                  <option value="Developer">Developer</option>
                  <option value="Viewer">Viewer (Read-Only)</option>
                </select>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-md transition-all cursor-pointer disabled:opacity-50 mt-2"
              >
                {loading ? 'Creating Workspace...' : 'Create Operational Workspace'}
              </button>
            </form>
          )}

          {/* ── 3. MFA Verification Form ── */}
          {activeTab === 'mfa' && (
            <form onSubmit={handleMfaVerify} className="space-y-4 font-mono text-xs">
              <div className="p-4 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 text-center space-y-2">
                <KeyRound className="w-8 h-8 mx-auto text-blue-600 dark:text-blue-400" />
                <h3 className="font-bold text-slate-900 dark:text-white">Enter Two-Factor Authenticator Code</h3>
                <p className="text-[11px] text-slate-500 font-sans">
                  Open Google Authenticator or Authy to retrieve your 6-digit TOTP passcode.
                </p>
              </div>

              <div>
                <input
                  type="text"
                  maxLength={6}
                  value={mfaCode}
                  onChange={(e) => setMfaCode(e.target.value.replace(/\D/g, ''))}
                  placeholder="000000"
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-center text-xl font-bold tracking-widest text-slate-900 dark:text-white"
                />
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setActiveTab('signin')}
                  className="flex-1 py-2.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading || mfaCode.length < 6}
                  className="flex-1 py-2.5 bg-blue-600 text-white font-bold rounded-xl disabled:opacity-50"
                >
                  {loading ? 'Verifying...' : 'Verify MFA'}
                </button>
              </div>
            </form>
          )}

          {/* ── 4. Forgot Password Flow ── */}
          {activeTab === 'forgot' && (
            <div className="space-y-4 font-mono text-xs">
              {resetStep === 'email' ? (
                <form onSubmit={handleResetRequest} className="space-y-4">
                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Account Work Email</label>
                    <input
                      type="email"
                      value={resetEmail}
                      onChange={(e) => setResetEmail(e.target.value)}
                      placeholder="engineer@company.com"
                      required
                      className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white"
                    />
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setActiveTab('signin')}
                      className="flex-1 py-2.5 bg-slate-100 dark:bg-slate-800 rounded-xl font-bold"
                    >
                      Back
                    </button>
                    <button
                      type="submit"
                      disabled={loading}
                      className="flex-1 py-2.5 bg-blue-600 text-white rounded-xl font-bold"
                    >
                      {loading ? 'Sending...' : 'Send Reset Code'}
                    </button>
                  </div>
                </form>
              ) : (
                <form onSubmit={handleResetConfirm} className="space-y-3">
                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">6-Digit Reset Code</label>
                    <input
                      type="text"
                      value={resetCode}
                      onChange={(e) => setResetCode(e.target.value)}
                      placeholder="123456"
                      required
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white"
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
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-2.5 bg-blue-600 text-white rounded-xl font-bold"
                  >
                    {loading ? 'Updating...' : 'Set New Password'}
                  </button>
                </form>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
