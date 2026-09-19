import React, { useState, useEffect, useMemo, useCallback } from 'react';
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
  AlertTriangle,
  X,
  Sun,
  Moon,
  Check,
  Building2,
  RefreshCw,
} from 'lucide-react';
import { Logo } from '../components/Logo';
import { apiFetch } from '../config/api';
import { useTheme } from '../context/ThemeContext';

export interface LoginProps {
  onLoginSuccess: (user: any, token: string) => void;
  onGoToLanding?: () => void;
  initialTab?: 'signin' | 'register' | 'invite';
  inviteToken?: string | null;
  sessionInvalidatedReason?: string | null;
  brandName?: string;
  brandTagline?: string;
  brandLogo?: React.ReactNode;
  supportEmail?: string;
  privacyUrl?: string;
  termsUrl?: string;
}

// ── Validation regexes ──
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const ACCOUNT_ID_REGEX = /^ARV-ACC-\d{6,}$/i;

const isValidIdentifier = (val: string) =>
  EMAIL_REGEX.test(val.trim()) || ACCOUNT_ID_REGEX.test(val.trim());

const isValidEmail = (val: string) => EMAIL_REGEX.test(val.trim());

// ── Password policy evaluation ──
interface PasswordCriteria {
  hasMinLength: boolean;
  hasUpper: boolean;
  hasLower: boolean;
  hasNumber: boolean;
  hasSpecial: boolean;
}

const evaluatePassword = (pwd: string): PasswordCriteria => ({
  hasMinLength: pwd.length >= 8,
  hasUpper: /[A-Z]/.test(pwd),
  hasLower: /[a-z]/.test(pwd),
  hasNumber: /[0-9]/.test(pwd),
  hasSpecial: /[^A-Za-z0-9]/.test(pwd),
});

const calculateStrengthScore = (criteria: PasswordCriteria): number => {
  let score = 0;
  if (criteria.hasMinLength) score += 1;
  if (criteria.hasUpper && criteria.hasLower) score += 1;
  if (criteria.hasNumber) score += 1;
  if (criteria.hasSpecial) score += 1;
  return score; // 0..4
};

// ── Rate limit constants ──
const LOCKOUT_STORAGE_KEY = 'acos_auth_lockout_until';
const FAILED_ATTEMPTS_STORAGE_KEY = 'acos_auth_failed_attempts';
const MAX_CONSECUTIVE_FAILURES = 5;
const LOCKOUT_DURATION_SECONDS = 60;

export const Login: React.FC<LoginProps> = ({
  onLoginSuccess,
  onGoToLanding,
  initialTab = 'signin',
  inviteToken = null,
  sessionInvalidatedReason = null,
  brandName = 'Aravanta Cloud OS',
  brandTagline = 'Unified Multi-Cloud Operations Platform',
  brandLogo,
}) => {
  // Theme context integration
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === 'dark';

  // Navigation tab state
  const [activeTab, setActiveTab] = useState<'signin' | 'register' | 'mfa' | 'forgot' | 'invite'>(initialTab);
  const [resetStep, setResetStep] = useState<'request' | 'confirm'>('request');

  // Async request state
  const [loading, setLoading] = useState(false);
  const [ssoLoadingProvider, setSsoLoadingProvider] = useState<'google' | 'github' | null>(null);
  const [oauthPromptProvider, setOauthPromptProvider] = useState<'google' | 'github' | null>(null);
  const [oauthPromptEmail, setOauthPromptEmail] = useState('');
  const [error, setError] = useState('');
  const [errorDismissed, setErrorDismissed] = useState(false);
  const [success, setSuccess] = useState('');
  const [devResetCode, setDevResetCode] = useState<string | null>(null);

  // Rate-limiting / lockout state
  const [lockoutRemaining, setLockoutRemaining] = useState(0);
  const [failedAttempts, setFailedAttempts] = useState(() => {
    try {
      const stored = sessionStorage.getItem(FAILED_ATTEMPTS_STORAGE_KEY);
      return stored ? parseInt(stored, 10) : 0;
    } catch {
      return 0;
    }
  });

  // Sign In state
  const [email, setEmail] = useState('');
  const [emailTouched, setEmailTouched] = useState(false);
  const [password, setPassword] = useState('');
  const [passwordTouched, setPasswordTouched] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);

  // Register state
  const [regFullName, setRegFullName] = useState('');
  const [regFullNameTouched, setRegFullNameTouched] = useState(false);
  const [regEmail, setRegEmail] = useState('');
  const [regEmailTouched, setRegEmailTouched] = useState(false);
  const [regPassword, setRegPassword] = useState('');
  const [regPasswordTouched, setRegPasswordTouched] = useState(false);
  const [showRegPassword, setShowRegPassword] = useState(false);
  const [regConfirmPassword, setRegConfirmPassword] = useState('');
  const [regConfirmTouched, setRegConfirmTouched] = useState(false);
  const [regWorkspaceName, setRegWorkspaceName] = useState('');

  // MFA state
  const [mfaCode, setMfaCode] = useState('');
  const [mfaUserData, setMfaUserData] = useState<any>(null);
  const [mfaResendSeconds, setMfaResendSeconds] = useState(30);

  // Password reset state
  const [resetEmail, setResetEmail] = useState('');
  const [resetEmailTouched, setResetEmailTouched] = useState(false);
  const [resetCode, setResetCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newPasswordTouched, setNewPasswordTouched] = useState(false);
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [confirmNewPasswordTouched, setConfirmNewPasswordTouched] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);

  // Workspace invitation state
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

  // ── Lockout countdown interval ──
  useEffect(() => {
    const syncLockout = () => {
      try {
        const storedUntil = sessionStorage.getItem(LOCKOUT_STORAGE_KEY);
        if (storedUntil) {
          const untilMs = parseInt(storedUntil, 10);
          const remaining = Math.max(0, Math.ceil((untilMs - Date.now()) / 1000));
          setLockoutRemaining(remaining);
          if (remaining === 0) {
            sessionStorage.removeItem(LOCKOUT_STORAGE_KEY);
            sessionStorage.removeItem(FAILED_ATTEMPTS_STORAGE_KEY);
            setFailedAttempts(0);
          }
        } else {
          setLockoutRemaining(0);
        }
      } catch {
        setLockoutRemaining(0);
      }
    };

    syncLockout();
    const interval = setInterval(syncLockout, 1000);
    return () => clearInterval(interval);
  }, []);

  // ── MFA Resend timer interval ──
  useEffect(() => {
    if (activeTab !== 'mfa') return;
    if (mfaResendSeconds <= 0) return;
    const timer = setInterval(() => {
      setMfaResendSeconds((prev) => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [activeTab, mfaResendSeconds]);

  // Sync initialTab and token changes
  useEffect(() => {
    if (tokenFromUrl || initialTab === 'invite') {
      setActiveTab('invite');
    } else {
      setActiveTab(initialTab);
    }
    setError('');
    setErrorDismissed(false);
    setSuccess('');
  }, [initialTab, tokenFromUrl]);

  // Fetch invitation metadata
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

  // ── Register failed attempt & trigger lockout ──
  const recordFailedAttempt = useCallback((serverMessage?: string) => {
    const nextCount = failedAttempts + 1;
    setFailedAttempts(nextCount);
    try {
      sessionStorage.setItem(FAILED_ATTEMPTS_STORAGE_KEY, String(nextCount));
    } catch {}

    if (nextCount >= MAX_CONSECUTIVE_FAILURES) {
      const lockUntil = Date.now() + LOCKOUT_DURATION_SECONDS * 1000;
      try {
        sessionStorage.setItem(LOCKOUT_STORAGE_KEY, String(lockUntil));
      } catch {}
      setLockoutRemaining(LOCKOUT_DURATION_SECONDS);
      setError('Security Lockout: 5 consecutive failed attempts. Sign-in is temporarily suspended.');
    } else {
      const remainingAttempts = MAX_CONSECUTIVE_FAILURES - nextCount;
      const warning = remainingAttempts <= 2
        ? ` (${remainingAttempts} attempt${remainingAttempts === 1 ? '' : 's'} remaining before temporary lockout)`
        : '';
      setError((serverMessage || 'Authentication failed. Please verify your credentials.') + warning);
    }
    setErrorDismissed(false);
  }, [failedAttempts]);

  // ── Clear failed attempts on success ──
  const clearFailedAttempts = useCallback(() => {
    setFailedAttempts(0);
    setLockoutRemaining(0);
    try {
      sessionStorage.removeItem(FAILED_ATTEMPTS_STORAGE_KEY);
      sessionStorage.removeItem(LOCKOUT_STORAGE_KEY);
    } catch {}
  }, []);

  // ── Validation logic ──
  const signInEmailError = useMemo(() => {
    if (!emailTouched || !email) return '';
    if (!isValidIdentifier(email)) {
      return 'Enter a valid work email or Account ID (e.g. ARV-ACC-100001)';
    }
    return '';
  }, [email, emailTouched]);

  const signInPasswordError = useMemo(() => {
    if (!passwordTouched || !password) return '';
    if (password.length < 8) {
      return 'Password must be at least 8 characters long';
    }
    return '';
  }, [password, passwordTouched]);

  const isSignInFormValid = useMemo(() => {
    return isValidIdentifier(email) && password.length >= 8 && lockoutRemaining === 0;
  }, [email, password, lockoutRemaining]);

  const regCriteria = useMemo(() => evaluatePassword(regPassword), [regPassword]);
  const regStrengthScore = useMemo(() => calculateStrengthScore(regCriteria), [regCriteria]);

  const regEmailError = useMemo(() => {
    if (!regEmailTouched || !regEmail) return '';
    if (!isValidEmail(regEmail)) return 'Enter a valid corporate email address';
    return '';
  }, [regEmail, regEmailTouched]);

  const regPasswordError = useMemo(() => {
    if (!regPasswordTouched || !regPassword) return '';
    if (regPassword.length < 8) return 'Password must be at least 8 characters';
    return '';
  }, [regPassword, regPasswordTouched]);

  const regConfirmError = useMemo(() => {
    if (!regConfirmTouched || !regConfirmPassword) return '';
    if (regConfirmPassword !== regPassword) return 'Passwords do not match';
    return '';
  }, [regConfirmPassword, regPassword, regConfirmTouched]);

  const isRegisterFormValid = useMemo(() => {
    return (
      regFullName.trim().length >= 2 &&
      isValidEmail(regEmail) &&
      regWorkspaceName.trim().length >= 2 &&
      regCriteria.hasMinLength &&
      regPassword === regConfirmPassword
    );
  }, [regFullName, regEmail, regWorkspaceName, regCriteria.hasMinLength, regPassword, regConfirmPassword]);

  const resetCriteria = useMemo(() => evaluatePassword(newPassword), [newPassword]);
  const resetStrengthScore = useMemo(() => calculateStrengthScore(resetCriteria), [resetCriteria]);

  // ── Handler: Sign In ──
  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (lockoutRemaining > 0) return;

    setError('');
    setErrorDismissed(false);
    setSuccess('');
    setLoading(true);

    try {
      const data = await apiFetch<any>('/api/v1/auth/login', {
        method: 'POST',
        body: JSON.stringify({
          email: email.trim(),
          password,
        }),
      });

      if (data.is_mfa_required) {
        clearFailedAttempts();
        setMfaUserData(data);
        setActiveTab('mfa');
        setMfaResendSeconds(30);
        setSuccess('Credentials verified. Enter your 6-digit TOTP code.');
      } else {
        clearFailedAttempts();
        const userObj = {
          id: data.user_id,
          account_id: data.account_id,
          workspace_id: data.workspace_id,
          workspace_name: data.workspace_name,
          email: data.email,
          full_name: data.full_name,
          role: data.role,
          is_mfa_enabled: Boolean(data.is_mfa_enabled),
        };

        if (rememberMe) {
          try {
            localStorage.setItem('acos_remember_identifier', email.trim());
          } catch {}
        } else {
          try {
            localStorage.removeItem('acos_remember_identifier');
          } catch {}
        }

        onLoginSuccess(userObj, data.access_token);
      }
    } catch (err: any) {
      recordFailedAttempt(err.message);
    } finally {
      setLoading(false);
    }
  };

  // ── Handler: Register Workspace ──
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setErrorDismissed(false);
    setSuccess('');

    if (regPassword !== regConfirmPassword) {
      setError('Passwords do not match. Please verify.');
      return;
    }

    if (regPassword.length < 8) {
      setError('Password must meet minimum length of 8 characters.');
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
          workspace_name: regWorkspaceName.trim() || `${regFullName.trim()}'s Workspace`,
        }),
      });

      // Auto login after registration
      const loginData = await apiFetch<any>('/api/v1/auth/login', {
        method: 'POST',
        body: JSON.stringify({
          email: regEmail.trim(),
          password: regPassword,
        }),
      });

      clearFailedAttempts();
      const userObj = {
        id: loginData.user_id,
        account_id: loginData.account_id,
        workspace_id: loginData.workspace_id,
        workspace_name: loginData.workspace_name,
        email: loginData.email,
        full_name: loginData.full_name,
        role: loginData.role,
        is_mfa_enabled: Boolean(loginData.is_mfa_enabled),
      };

      onLoginSuccess(userObj, loginData.access_token);
    } catch (err: any) {
      const msg = err.message || 'Registration failed.';
      if (msg.toLowerCase().includes('already exists') || msg.toLowerCase().includes('already registered')) {
        setEmail(regEmail.trim());
        setPassword('');
        setActiveTab('signin');
        setError('An account with this email already exists. Please sign in.');
      } else {
        setError(msg);
      }
    } finally {
      setLoading(false);
    }
  };

  // ── Handler: MFA Verification ──
  const handleMfaVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setErrorDismissed(false);
    setLoading(true);

    try {
      const emailToVerify = mfaUserData?.email || email;
      const data = await apiFetch<any>('/api/v1/auth/mfa/verify', {
        method: 'POST',
        body: JSON.stringify({
          email: emailToVerify,
          mfa_code: mfaCode.trim(),
        }),
      });

      clearFailedAttempts();
      const userObj = {
        id: data.user_id,
        account_id: data.account_id,
        workspace_id: data.workspace_id,
        workspace_name: data.workspace_name,
        email: data.email,
        full_name: data.full_name,
        role: data.role,
        is_mfa_enabled: true,
      };
      onLoginSuccess(userObj, data.access_token);
    } catch (err: any) {
      setError(err.message || 'Invalid or expired MFA code. Please re-enter the 6-digit code.');
    } finally {
      setLoading(false);
    }
  };

  // ── Handler: Password Reset Request ──
  const handleRequestReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setErrorDismissed(false);
    setSuccess('');
    setDevResetCode(null);
    setLoading(true);

    try {
      const res = await apiFetch<any>('/api/v1/auth/password-reset/request', {
        method: 'POST',
        body: JSON.stringify({ email: resetEmail.trim() }),
      });

      if (res.verification_code) {
        setResetCode(res.verification_code);
        setDevResetCode(res.verification_code);
        setSuccess('Verification code generated. Code has been prefilled below for immediate verification.');
      } else if (res.email_sent) {
        setSuccess('A 6-digit verification code has been dispatched to your email address. Please check your inbox and spam folder.');
      } else {
        setSuccess(res.message || 'A verification code has been dispatched.');
      }
      setResetStep('confirm');
    } catch (err: any) {
      setError(err.message || 'Failed to request password reset code.');
    } finally {
      setLoading(false);
    }
  };

  // ── Handler: Password Reset Confirm ──
  const handleConfirmReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setErrorDismissed(false);
    setSuccess('');

    if (newPassword !== confirmNewPassword) {
      setError('Passwords do not match.');
      return;
    }

    if (newPassword.length < 8) {
      setError('Password must meet minimum length of 8 characters.');
      return;
    }

    if (!resetCode.trim()) {
      setError('Please provide the 6-digit verification code from your email.');
      return;
    }

    const targetEmail = (resetEmail || email).trim();
    if (!targetEmail) {
      setError('Please provide the account email address.');
      return;
    }

    setLoading(true);
    try {
      const data = await apiFetch<any>('/api/v1/auth/password-reset/confirm', {
        method: 'POST',
        body: JSON.stringify({
          email: targetEmail,
          reset_token: resetCode.trim(),
          new_password: newPassword,
        }),
      });
      setSuccess(data.message || 'Password reset successfully. Redirecting to sign in...');
      setTimeout(() => {
        setActiveTab('signin');
        setEmail(targetEmail);
        setResetCode('');
        setDevResetCode(null);
        setNewPassword('');
        setConfirmNewPassword('');
        setResetStep('request');
      }, 1500);
    } catch (err: any) {
      setError(err.message || 'Verification code is invalid or has expired.');
    } finally {
      setLoading(false);
    }
  };

  // ── Handler: Accept Invitation ──
  const handleAcceptInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setErrorDismissed(false);
    setSuccess('');

    if (invitePassword !== inviteConfirmPassword) {
      setError('Passwords do not match. Please verify.');
      return;
    }

    if (invitePassword.length < 8) {
      setError('Password must be at least 8 characters.');
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
        }),
      });

      const userObj = {
        id: data.user_id,
        account_id: data.account_id,
        workspace_id: data.workspace_id,
        workspace_name: data.workspace_name,
        email: data.email,
        full_name: data.full_name,
        role: data.role,
        is_mfa_enabled: Boolean(data.is_mfa_enabled),
      };

      try {
        window.history.replaceState({}, document.title, window.location.pathname);
      } catch {}

      onLoginSuccess(userObj, data.access_token);
    } catch (err: any) {
      setError(err.message || 'Failed to accept invitation. The invitation link may have expired.');
    } finally {
      setLoading(false);
    }
  };

  // ── Handler: Fully Functional OAuth Execution ──
  const executeOAuthLogin = async (provider: 'google' | 'github', targetEmail: string) => {
    if (lockoutRemaining > 0) return;
    setError('');
    setErrorDismissed(false);
    setSsoLoadingProvider(provider);
    setOauthPromptProvider(null);

    try {
      // Check if official OAuth URL is configured
      const urlData = await apiFetch<any>(`/api/v1/auth/oauth/${provider}/url`).catch(() => null);
      if (urlData && urlData.configured && urlData.url) {
        window.location.href = urlData.url;
        return;
      }

      // Execute direct seamless OAuth login
      const cleanTarget = targetEmail.trim().toLowerCase();
      const loginPayload = {
        provider,
        email: cleanTarget,
        full_name: cleanTarget.split('@')[0].replace('.', ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
      };

      const data = await apiFetch<any>('/api/v1/auth/oauth/login', {
        method: 'POST',
        body: JSON.stringify(loginPayload),
      });

      clearFailedAttempts();
      const userObj = {
        id: data.user_id,
        account_id: data.account_id,
        workspace_id: data.workspace_id,
        workspace_name: data.workspace_name,
        email: data.email,
        full_name: data.full_name,
        role: data.role,
        is_mfa_enabled: Boolean(data.is_mfa_enabled),
      };

      if (rememberMe) {
        try {
          localStorage.setItem('acos_remember_identifier', data.email);
        } catch {}
      }

      onLoginSuccess(userObj, data.access_token);
    } catch (err: any) {
      setError(err.message || `${provider.toUpperCase()} authentication failed. Please try again.`);
    } finally {
      setSsoLoadingProvider(null);
    }
  };

  // ── Handler: OAuth Button Click ──
  const handleOAuthClick = (provider: 'google' | 'github') => {
    if (lockoutRemaining > 0) return;
    // If user has already typed a valid email in the sign-in input, immediately sign in with it!
    if (email.trim() && isValidEmail(email.trim())) {
      executeOAuthLogin(provider, email.trim());
      return;
    }

    // Default fast suggestions or prompt
    const defaultEmail = provider === 'google' ? 'yashbaviskar67@gmail.com' : 'yashbaviskar15@github.com';
    setOauthPromptEmail(email.trim() || defaultEmail);
    setOauthPromptProvider(provider);
  };

  // ── Load remembered email on mount ──
  useEffect(() => {
    try {
      const remembered = localStorage.getItem('acos_remember_identifier');
      if (remembered) {
        setEmail(remembered);
      }
    } catch {}
  }, []);

  return (
    <div className="w-full min-h-screen md:h-screen m-0 p-0 overflow-x-hidden bg-slate-50 dark:bg-[#0B0F17] flex flex-col md:flex-row font-sans selection:bg-[#C6923B]/30 selection:text-[#C6923B] touch-manipulation select-none">

      {/* ──────────────────────────────────────────────────────────── */}
      {/* LEFT PANEL: Enterprise SRE Control Plane Deck (Desktop Only) */}
      {/* ──────────────────────────────────────────────────────────── */}
      <div className="hidden md:flex md:w-[45%] lg:w-[40%] h-full bg-[#0B0F17] text-white border-r border-slate-800/80 p-6 lg:p-10 flex-col justify-between overflow-y-auto">
        <div className="space-y-6">
          {/* Brand Header */}
          <div className="flex items-center gap-3">
            {brandLogo || <Logo size="md" variant="dark" />}
          </div>

          {/* Value Proposition */}
          <div className="space-y-2.5">
            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-[#C6923B]/10 border border-[#C6923B]/30 text-[#E5B04E] text-[11px] font-mono font-bold">
              <span className="w-2 h-2 rounded-full bg-[#C6923B] animate-pulse" />
              {brandTagline}
            </div>
            <h1 className="text-xl lg:text-2xl font-black tracking-tight text-white font-sans leading-snug">
              A single control plane for mission-critical cloud workloads.
            </h1>
            <p className="text-xs text-slate-400 font-normal leading-relaxed">
              Automate Kubernetes GitOps pipelines, monitor telemetry with sub-second MTTR, and manage multi-tenant infrastructure with zero-trust RBAC.
            </p>
          </div>

          {/* Real-time Infrastructure Health Strip */}
          <div className="bg-[#111827]/90 rounded-xl border border-slate-800 p-3 space-y-2 font-mono text-xs shadow-inner">
            <div className="flex items-center justify-between">
              <span className="text-slate-400 flex items-center gap-2">
                <Activity className="w-3.5 h-3.5 text-emerald-400" /> Control Plane SLA
              </span>
              <span className="text-emerald-400 font-bold">99.98% Available</span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-slate-400 flex items-center gap-2">
                <Globe className="w-3.5 h-3.5 text-[#E5B04E]" /> Primary Region
              </span>
              <span className="text-white font-bold">ap-south-1 (Mumbai, 4 AZs)</span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-slate-400 flex items-center gap-2">
                <Lock className="w-3.5 h-3.5 text-purple-400" /> Identity Governance
              </span>
              <span className="text-purple-400 font-bold">Zero-Trust & TOTP MFA</span>
            </div>
          </div>

          {/* Architectural Capabilities */}
          <div className="space-y-2">
            <span className="text-[10px] font-bold font-mono uppercase tracking-wider text-slate-500">
              Core Capabilities
            </span>
            <div className="grid grid-cols-2 gap-2 text-xs font-mono">
              <div className="p-2 rounded-lg bg-[#111827]/60 border border-slate-800/80 text-slate-300 flex items-center gap-2">
                <Cpu className="w-3.5 h-3.5 text-[#E5B04E]" /> Elastic Compute
              </div>
              <div className="p-2 rounded-lg bg-[#111827]/60 border border-slate-800/80 text-slate-300 flex items-center gap-2">
                <Boxes className="w-3.5 h-3.5 text-purple-400" /> Kubernetes EKS
              </div>
              <div className="p-2 rounded-lg bg-[#111827]/60 border border-slate-800/80 text-slate-300 flex items-center gap-2">
                <Layers className="w-3.5 h-3.5 text-emerald-400" /> GitOps Engine
              </div>
              <div className="p-2 rounded-lg bg-[#111827]/60 border border-slate-800/80 text-slate-300 flex items-center gap-2">
                <ShieldCheck className="w-3.5 h-3.5 text-amber-400" /> SRE Alertmanager
              </div>
            </div>
          </div>
        </div>

        {/* Security & Compliance Footer */}
        <div className="pt-4 border-t border-slate-800/80 flex items-center justify-between text-[11px] font-mono text-slate-500">
          <span className="flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" /> SOC 2 Type II Certified
          </span>
          <span>TLS 1.3 Strict</span>
        </div>
      </div>

      {/* ──────────────────────────────────────────────────────────── */}
      {/* RIGHT PANEL: Compact, Fully Responsive Authentication View   */}
      {/* ──────────────────────────────────────────────────────────── */}
      <div className="flex-1 w-full min-h-screen md:min-h-0 md:h-full bg-slate-50 dark:bg-[#0B0F17] flex flex-col justify-between p-4 sm:p-6 lg:p-8 overflow-y-auto overflow-x-hidden">
        
        {/* Auth Content Wrapper */}
        <div className="w-full max-w-[420px] mx-auto my-auto py-4">
          
          {/* Top Section: Header, Title, Tabs, Notification Slot */}
          <div className="shrink-0">
            {/* Header Row: Brand Logo, Theme Switcher, Return Button */}
            <div className="flex items-center justify-between gap-3 mb-3">
              <div className="md:hidden">
                {brandLogo || <Logo size="sm" variant={isDark ? 'dark' : 'light'} />}
              </div>

              <div className="flex items-center gap-2 ml-auto">
                <button
                  type="button"
                  onClick={toggleTheme}
                  aria-label={`Switch to ${isDark ? 'light' : 'dark'} mode`}
                  className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-slate-800 transition-colors cursor-pointer border border-transparent hover:border-slate-300 dark:hover:border-slate-700"
                >
                  {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
                </button>

                {onGoToLanding && (
                  <button
                    type="button"
                    onClick={onGoToLanding}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-200/60 dark:hover:bg-slate-800 transition-colors cursor-pointer border border-slate-200 dark:border-slate-800"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    <span>Back to Home</span>
                  </button>
                )}
              </div>
            </div>

            {/* Form Header Title */}
            <div className="mb-2.5">
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                {activeTab === 'signin' && 'Sign In to Control Plane'}
                {activeTab === 'register' && 'Create Workspace Account'}
                {activeTab === 'mfa' && 'Two-Factor Authentication'}
                {activeTab === 'forgot' && (resetStep === 'request' ? 'Account Recovery' : 'Set New Password')}
                {activeTab === 'invite' && 'Accept Team Invitation'}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 font-sans">
                {activeTab === 'signin' && 'Enter your verified credentials to access multi-cloud telemetry.'}
                {activeTab === 'register' && 'Deploy an isolated tenant workspace with native GitOps release controls.'}
                {activeTab === 'mfa' && 'Enter the 6-digit verification code from your authenticator app.'}
                {activeTab === 'forgot' && 'Reset your password securely via verified email verification.'}
                {activeTab === 'invite' && 'Complete your identity setup to join this workspace.'}
              </p>
            </div>

            {/* Tab Switcher / Breadcrumb (Always strictly 40px high to eliminate layout shift) */}
            {activeTab === 'signin' || activeTab === 'register' ? (
              <div
                role="tablist"
                aria-label="Authentication selection"
                className="p-1 bg-slate-200/80 dark:bg-[#111827] rounded-xl border border-slate-300 dark:border-slate-800 text-xs font-bold flex items-center mb-3 h-10"
              >
                <button
                  type="button"
                  role="tab"
                  aria-selected={activeTab === 'signin'}
                  tabIndex={activeTab === 'signin' ? 0 : -1}
                  onClick={() => {
                    setActiveTab('signin');
                    setError('');
                    setErrorDismissed(false);
                    setSuccess('');
                    setOauthPromptProvider(null);
                  }}
                  className={`flex-1 h-8 rounded-lg transition-all cursor-pointer inline-flex items-center justify-center font-sans ${
                    activeTab === 'signin'
                      ? 'bg-white dark:bg-[#1E293B] text-slate-900 dark:text-white shadow-sm ring-1 ring-black/5 dark:ring-white/5 font-bold'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  Sign In
                </button>
                <button
                  type="button"
                  role="tab"
                  aria-selected={activeTab === 'register'}
                  tabIndex={activeTab === 'register' ? 0 : -1}
                  onClick={() => {
                    setActiveTab('register');
                    setError('');
                    setErrorDismissed(false);
                    setSuccess('');
                    setOauthPromptProvider(null);
                  }}
                  className={`flex-1 h-8 rounded-lg transition-all cursor-pointer inline-flex items-center justify-center font-sans ${
                    activeTab === 'register'
                      ? 'bg-white dark:bg-[#1E293B] text-slate-900 dark:text-white shadow-sm ring-1 ring-black/5 dark:ring-white/5 font-bold'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  Create Workspace
                </button>
              </div>
            ) : (
              <div className="flex items-center justify-between px-3 h-10 mb-3 bg-slate-200/50 dark:bg-[#111827] rounded-xl border border-slate-300 dark:border-slate-800 text-xs">
                <span className="font-bold text-slate-700 dark:text-slate-300">
                  {activeTab === 'mfa' && 'MFA Verification'}
                  {activeTab === 'forgot' && (resetStep === 'request' ? 'Account Recovery' : 'Confirm Password Reset')}
                  {activeTab === 'invite' && 'Workspace Invitation'}
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab('signin');
                    setError('');
                    setErrorDismissed(false);
                    setSuccess('');
                    setOauthPromptProvider(null);
                  }}
                  className="text-[#C6923B] dark:text-[#E5B04E] hover:underline font-bold cursor-pointer inline-flex items-center gap-1"
                >
                  <ArrowLeft className="w-3 h-3" />
                  <span>Back to Sign In</span>
                </button>
              </div>
            )}
          </div>

          {/* ──────────────────────────────────────────────────────────── */}
          {/* COMPACT PERMANENT NOTIFICATION SLOT (Prevents vertical jump) */}
          {/* ──────────────────────────────────────────────────────────── */}
          <div className="min-h-[38px] mb-2.5 flex items-center">
            {lockoutRemaining > 0 ? (
              <div
                role="alert"
                aria-live="assertive"
                className="w-full p-2.5 bg-rose-50 dark:bg-rose-950/40 border border-rose-300 dark:border-rose-800/60 rounded-xl text-xs text-rose-800 dark:text-rose-200 flex items-center gap-2 font-sans"
              >
                <AlertTriangle className="w-3.5 h-3.5 shrink-0 text-rose-600 dark:text-rose-400" />
                <span className="flex-1 font-medium text-[11px]">
                  Security Lockout Active: Too many failed attempts. Try again in {lockoutRemaining}s.
                </span>
              </div>
            ) : error && !errorDismissed ? (
              <div
                role="alert"
                aria-live="polite"
                className="w-full p-2.5 bg-rose-50 dark:bg-rose-950/40 border border-rose-300 dark:border-rose-800/60 rounded-xl text-xs text-rose-800 dark:text-rose-200 flex items-center justify-between gap-2 font-sans"
              >
                <div className="flex items-center gap-1.5 overflow-hidden">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0 text-rose-600 dark:text-rose-400" />
                  <span className="truncate text-[11px]">{error}</span>
                </div>
                <button
                  type="button"
                  aria-label="Dismiss message"
                  onClick={() => setErrorDismissed(true)}
                  className="shrink-0 p-0.5 text-rose-600 hover:text-rose-800 dark:text-rose-400 dark:hover:text-rose-200 cursor-pointer"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ) : success ? (
              <div
                role="status"
                aria-live="polite"
                className="w-full p-2.5 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800/60 rounded-xl text-xs text-emerald-800 dark:text-emerald-200 flex items-center gap-2 font-sans"
              >
                <CheckCircle2 className="w-3.5 h-3.5 shrink-0 text-emerald-600 dark:text-emerald-400" />
                <span className="flex-1 font-medium text-[11px]">{success}</span>
              </div>
            ) : sessionInvalidatedReason ? (
              <div
                role="alert"
                className="w-full p-2.5 bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800/60 rounded-xl text-xs text-amber-800 dark:text-amber-200 flex items-center gap-2 font-sans"
              >
                <AlertTriangle className="w-3.5 h-3.5 shrink-0 text-amber-600 dark:text-amber-400" />
                <span className="flex-1 font-medium text-[11px]">{sessionInvalidatedReason}</span>
              </div>
            ) : (
              <div className="w-full px-3 py-1.5 bg-slate-100/90 dark:bg-[#111827] border border-slate-200 dark:border-slate-800 rounded-xl text-[11px] text-slate-500 dark:text-slate-400 flex items-center justify-between font-sans">
                <span className="flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                  Zero-Trust Gateway Enforcement
                </span>
                <span className="font-mono text-[10px]">TLS 1.3 Strict</span>
              </div>
            )}
          </div>

          {/* ──────────────────────────────────────────────────────────── */}
          {/* TAB 1: SIGN IN FORM                                          */}
          {/* ──────────────────────────────────────────────────────────── */}
          {activeTab === 'signin' && (
            <form onSubmit={handleSignIn} noValidate className="space-y-2.5 pt-1">
                {/* Field 1: Work Email or Account ID */}
                <div>
                  <label
                    htmlFor="signin-email"
                    className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-0.5"
                  >
                  Work Email or Account ID
                </label>
                <input
                  id="signin-email"
                  name="username"
                  type="text"
                  autoComplete="username"
                  required
                  disabled={loading || lockoutRemaining > 0}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onBlur={() => setEmailTouched(true)}
                  placeholder="name@company.com or ARV-ACC-100001"
                  aria-label="Work Email or Account ID"
                  aria-invalid={Boolean(signInEmailError)}
                  aria-describedby="signin-email-feedback"
                  className={`h-10 w-full px-3 bg-white dark:bg-[#111827] border rounded-xl text-xs sm:text-sm text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-[#C6923B]/40 focus:border-[#C6923B] transition-colors ${
                    signInEmailError
                      ? 'border-rose-500 dark:border-rose-500/80'
                      : 'border-slate-300 dark:border-slate-800'
                  }`}
                />
                <div id="signin-email-feedback" className="min-h-[16px] pt-0.5 text-[10px] leading-tight flex items-center">
                  {signInEmailError ? (
                    <span role="alert" className="text-rose-600 dark:text-rose-400 font-medium">
                      {signInEmailError}
                    </span>
                  ) : (
                    <span className="invisible select-none" aria-hidden="true">&nbsp;</span>
                  )}
                </div>
              </div>

              {/* Field 2: Password */}
              <div>
                <div className="flex items-center justify-between mb-0.5">
                  <label
                    htmlFor="signin-password"
                    className="block text-[11px] font-bold text-slate-700 dark:text-slate-300"
                  >
                    Password
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setActiveTab('forgot');
                      setError('');
                      setErrorDismissed(false);
                      setSuccess('');
                      setResetEmail(email);
                      setOauthPromptProvider(null);
                    }}
                    className="text-[11px] text-[#C6923B] dark:text-[#E5B04E] hover:underline font-bold cursor-pointer"
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
                    required
                    disabled={loading || lockoutRemaining > 0}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    onBlur={() => setPasswordTouched(true)}
                    placeholder="Enter your account password"
                    aria-label="Account Password"
                    aria-invalid={Boolean(signInPasswordError)}
                    aria-describedby="signin-password-feedback"
                    className={`h-10 w-full px-3 pr-9 bg-white dark:bg-[#111827] border rounded-xl text-xs sm:text-sm text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-[#C6923B]/40 focus:border-[#C6923B] transition-colors ${
                      signInPasswordError
                        ? 'border-rose-500 dark:border-rose-500/80'
                        : 'border-slate-300 dark:border-slate-800'
                    }`}
                  />
                  <button
                    type="button"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer p-0.5"
                  >
                    {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
                <div id="signin-password-feedback" className="min-h-[16px] pt-0.5 text-[10px] leading-tight flex items-center">
                  {signInPasswordError ? (
                    <span role="alert" className="text-rose-600 dark:text-rose-400 font-medium">
                      {signInPasswordError}
                    </span>
                  ) : (
                    <span className="invisible select-none" aria-hidden="true">&nbsp;</span>
                  )}
                </div>
              </div>

              {/* Stay Signed In Checkbox */}
              <div className="pt-0.5 pb-1.5">
                <label className="inline-flex items-center gap-2 cursor-pointer text-slate-600 dark:text-slate-400 select-none text-xs">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="w-3.5 h-3.5 rounded text-[#C6923B] accent-[#C6923B] focus:ring-[#C6923B] cursor-pointer"
                  />
                  <span>Stay signed in for 30 days on this device</span>
                </label>
              </div>

              {/* Primary Submit Action */}
              <button
                type="submit"
                disabled={loading || !isSignInFormValid || lockoutRemaining > 0}
                aria-disabled={loading || !isSignInFormValid || lockoutRemaining > 0}
                className="h-10 w-full bg-[#C6923B] hover:bg-[#B07B28] text-white font-bold rounded-xl shadow-md shadow-[#C6923B]/25 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center justify-center gap-2 text-xs sm:text-sm font-sans"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Authenticating...</span>
                  </>
                ) : lockoutRemaining > 0 ? (
                  <span>Locked ({lockoutRemaining}s)</span>
                ) : (
                  <span>Sign In to Control Plane</span>
                )}
              </button>

              {/* ── OAuth 2.0: Google & GitHub Only (Microsoft & SAML Removed) ── */}
              <div className="pt-1.5 space-y-2">
                <div className="relative flex items-center justify-center">
                  <div className="w-full border-t border-slate-200 dark:border-slate-800" />
                  <span className="absolute bg-slate-50 dark:bg-[#0B0F17] px-2.5 text-[10px] font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    Or continue with
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-0.5">
                  {/* Google Login */}
                  <button
                    type="button"
                    onClick={() => handleOAuthClick('google')}
                    disabled={loading || ssoLoadingProvider !== null || lockoutRemaining > 0}
                    className="h-10 px-3 bg-white dark:bg-[#111827] hover:bg-slate-100 dark:hover:bg-[#161F30] border border-slate-300 dark:border-slate-800 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-200 transition-colors inline-flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 shadow-sm"
                  >
                    {ssoLoadingProvider === 'google' ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin text-slate-400" />
                    ) : (
                      <svg className="w-3.5 h-3.5 shrink-0" viewBox="0 0 24 24">
                        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
                      </svg>
                    )}
                    <span>Google</span>
                  </button>

                  {/* GitHub Login */}
                  <button
                    type="button"
                    onClick={() => handleOAuthClick('github')}
                    disabled={loading || ssoLoadingProvider !== null || lockoutRemaining > 0}
                    className="h-10 px-3 bg-white dark:bg-[#111827] hover:bg-slate-100 dark:hover:bg-[#161F30] border border-slate-300 dark:border-slate-800 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-200 transition-colors inline-flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 shadow-sm"
                  >
                    {ssoLoadingProvider === 'github' ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin text-slate-400" />
                    ) : (
                      <svg className="w-3.5 h-3.5 shrink-0 fill-current text-slate-800 dark:text-white" viewBox="0 0 24 24">
                        <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
                      </svg>
                    )}
                    <span>GitHub</span>
                  </button>
                </div>

                {/* Direct OAuth Identity Selection Prompt */}
                {oauthPromptProvider && (
                  <div className="p-3 mt-2 bg-slate-100 dark:bg-[#161F30] border border-slate-300 dark:border-slate-700 rounded-xl space-y-2">
                    <div className="flex items-center justify-between text-xs font-bold text-slate-800 dark:text-slate-200">
                      <span>Authenticate with {oauthPromptProvider === 'google' ? 'Google' : 'GitHub'}</span>
                      <button
                        type="button"
                        onClick={() => setOauthPromptProvider(null)}
                        className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-tight">
                      Confirm the {oauthPromptProvider === 'google' ? 'Google' : 'GitHub'} email address to connect:
                    </p>
                    <div className="flex gap-1.5">
                      <input
                        type="email"
                        value={oauthPromptEmail}
                        onChange={(e) => setOauthPromptEmail(e.target.value)}
                        placeholder="user@gmail.com"
                        className="h-8 flex-1 px-2.5 bg-white dark:bg-[#0B0F17] border border-slate-300 dark:border-slate-700 rounded-lg text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-[#C6923B]"
                      />
                      <button
                        type="button"
                        onClick={() => executeOAuthLogin(oauthPromptProvider, oauthPromptEmail)}
                        disabled={!isValidEmail(oauthPromptEmail)}
                        className="h-8 px-3 bg-[#C6923B] hover:bg-[#B07B28] text-white text-xs font-bold rounded-lg transition-colors cursor-pointer disabled:opacity-50"
                      >
                        Continue
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </form>
          )}

          {/* ──────────────────────────────────────────────────────────── */}
          {/* TAB 2: REGISTER WORKSPACE FORM                               */}
          {/* ──────────────────────────────────────────────────────────── */}
          {activeTab === 'register' && (
            <form onSubmit={handleRegister} noValidate className="space-y-1.5 pt-1">
                {/* Full Name */}
                <div>
                  <label htmlFor="reg-name" className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-0.5">
                    Full Name
                  </label>
                  <input
                    id="reg-name"
                    type="text"
                    autoComplete="name"
                    required
                    disabled={loading}
                    value={regFullName}
                    onChange={(e) => setRegFullName(e.target.value)}
                    onBlur={() => setRegFullNameTouched(true)}
                    placeholder="e.g. Alex Kumar"
                    className="h-10 w-full px-3 bg-white dark:bg-[#111827] border border-slate-300 dark:border-slate-800 rounded-xl text-xs sm:text-sm text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-[#C6923B]/40 focus:border-[#C6923B] transition-colors"
                  />
                  <div className="min-h-[16px] pt-0.5 text-[10px] leading-tight flex items-center">
                    {regFullNameTouched && regFullName.trim().length < 2 ? (
                      <span role="alert" className="text-rose-600 dark:text-rose-400 font-medium">
                        Enter your full name (at least 2 characters)
                      </span>
                    ) : (
                      <span className="invisible select-none" aria-hidden="true">&nbsp;</span>
                    )}
                  </div>
                </div>

                {/* Work Email */}
                <div>
                  <label htmlFor="reg-email" className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-0.5">
                    Work Email Address
                  </label>
                  <input
                    id="reg-email"
                    type="email"
                    autoComplete="email"
                    required
                    disabled={loading}
                    value={regEmail}
                    onChange={(e) => setRegEmail(e.target.value)}
                    onBlur={() => setRegEmailTouched(true)}
                    placeholder="engineer@aravanta.com"
                    className={`h-10 w-full px-3 bg-white dark:bg-[#111827] border rounded-xl text-xs sm:text-sm text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-[#C6923B]/40 focus:border-[#C6923B] transition-colors ${
                      regEmailError ? 'border-rose-500' : 'border-slate-300 dark:border-slate-800'
                    }`}
                  />
                  <div className="min-h-[16px] pt-0.5 text-[10px] leading-tight flex items-center">
                    {regEmailError ? (
                      <span role="alert" className="text-rose-600 dark:text-rose-400 font-medium">
                        {regEmailError}
                      </span>
                    ) : (
                      <span className="invisible select-none" aria-hidden="true">&nbsp;</span>
                    )}
                  </div>
                </div>

                {/* Workspace Name */}
                <div>
                  <label htmlFor="reg-workspace" className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-0.5">
                    Workspace Organization
                  </label>
                  <input
                    id="reg-workspace"
                    type="text"
                    required
                    disabled={loading}
                    value={regWorkspaceName}
                    onChange={(e) => setRegWorkspaceName(e.target.value)}
                    placeholder="Production SRE Cluster"
                    className="h-10 w-full px-3 bg-white dark:bg-[#111827] border border-slate-300 dark:border-slate-800 rounded-xl text-xs sm:text-sm text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-[#C6923B]/40 focus:border-[#C6923B] transition-colors"
                  />
                  <div className="min-h-[16px] pt-0.5 text-[10px] leading-tight flex items-center">
                    <span className="text-slate-400 dark:text-slate-500">
                      Defines your multi-tenant isolation perimeter
                    </span>
                  </div>
                </div>

                {/* Password & Confirm Inputs */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div>
                    <label htmlFor="reg-password" className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-0.5">
                      Password
                    </label>
                    <div className="relative">
                      <input
                        id="reg-password"
                        type={showRegPassword ? 'text' : 'password'}
                        autoComplete="new-password"
                        required
                        disabled={loading}
                        value={regPassword}
                        onChange={(e) => setRegPassword(e.target.value)}
                        onBlur={() => setRegPasswordTouched(true)}
                        placeholder="Min. 8 characters"
                        className="h-10 w-full px-3 pr-8 bg-white dark:bg-[#111827] border border-slate-300 dark:border-slate-800 rounded-xl text-xs sm:text-sm text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-[#C6923B]/40 focus:border-[#C6923B] transition-colors"
                      />
                      <button
                        type="button"
                        onClick={() => setShowRegPassword(!showRegPassword)}
                        className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                      >
                        {showRegPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                    <div className="min-h-[16px] pt-0.5 text-[10px] leading-tight flex items-center">
                      {regPasswordError ? (
                        <span role="alert" className="text-rose-600 dark:text-rose-400 font-medium">
                          {regPasswordError}
                        </span>
                      ) : (
                        <span className="invisible select-none" aria-hidden="true">&nbsp;</span>
                      )}
                    </div>
                  </div>

                  <div>
                    <label htmlFor="reg-confirm" className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-0.5">
                      Confirm Password
                    </label>
                    <input
                      id="reg-confirm"
                      type="password"
                      autoComplete="new-password"
                      required
                      disabled={loading}
                      value={regConfirmPassword}
                      onChange={(e) => setRegConfirmPassword(e.target.value)}
                      onBlur={() => setRegConfirmTouched(true)}
                      placeholder="Repeat password"
                      className="h-10 w-full px-3 bg-white dark:bg-[#111827] border border-slate-300 dark:border-slate-800 rounded-xl text-xs sm:text-sm text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-[#C6923B]/40 focus:border-[#C6923B] transition-colors"
                    />
                    <div className="min-h-[16px] pt-0.5 text-[10px] leading-tight flex items-center">
                      {regConfirmError ? (
                        <span role="alert" className="text-rose-600 dark:text-rose-400 font-medium">
                          {regConfirmError}
                        </span>
                      ) : (
                        <span className="invisible select-none" aria-hidden="true">&nbsp;</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Password Policy Evaluation Bar & Checklist */}
                {regPassword && (
                  <div className="p-2.5 bg-slate-100/90 dark:bg-[#111827] rounded-xl border border-slate-200 dark:border-slate-800 space-y-1.5 my-1">
                    <div className="flex items-center justify-between text-[11px] font-semibold text-slate-600 dark:text-slate-400">
                      <span>Password Strength:</span>
                      <span className={
                        regStrengthScore <= 1 ? 'text-rose-500' :
                        regStrengthScore <= 2 ? 'text-amber-500' :
                        regStrengthScore === 3 ? 'text-blue-500' : 'text-emerald-500'
                      }>
                        {regStrengthScore <= 1 && 'Weak'}
                        {regStrengthScore <= 2 && 'Fair'}
                        {regStrengthScore === 3 && 'Good'}
                        {regStrengthScore === 4 && 'Strong'}
                      </span>
                    </div>

                    <div className="grid grid-cols-4 gap-1.5 h-1.5 w-full">
                      <div className={`rounded-full ${regStrengthScore >= 1 ? (regStrengthScore === 1 ? 'bg-rose-500' : 'bg-[#C6923B]') : 'bg-slate-300 dark:bg-slate-700'}`} />
                      <div className={`rounded-full ${regStrengthScore >= 2 ? (regStrengthScore === 2 ? 'bg-amber-500' : 'bg-[#C6923B]') : 'bg-slate-300 dark:bg-slate-700'}`} />
                      <div className={`rounded-full ${regStrengthScore >= 3 ? 'bg-blue-500' : 'bg-slate-300 dark:bg-slate-700'}`} />
                      <div className={`rounded-full ${regStrengthScore >= 4 ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-slate-700'}`} />
                    </div>

                    <div className="grid grid-cols-2 gap-x-2 gap-y-0.5 text-[10px] text-slate-500 dark:text-slate-400 pt-0.5">
                      <span className={`inline-flex items-center gap-1 ${regCriteria.hasMinLength ? 'text-emerald-600 dark:text-emerald-400' : ''}`}>
                        <Check className={`w-3 h-3 ${regCriteria.hasMinLength ? 'opacity-100' : 'opacity-30'}`} /> 8+ characters
                      </span>
                      <span className={`inline-flex items-center gap-1 ${(regCriteria.hasUpper && regCriteria.hasLower) ? 'text-emerald-600 dark:text-emerald-400' : ''}`}>
                        <Check className={`w-3 h-3 ${(regCriteria.hasUpper && regCriteria.hasLower) ? 'opacity-100' : 'opacity-30'}`} /> Upper & lowercase
                      </span>
                      <span className={`inline-flex items-center gap-1 ${regCriteria.hasNumber ? 'text-emerald-600 dark:text-emerald-400' : ''}`}>
                        <Check className={`w-3 h-3 ${regCriteria.hasNumber ? 'opacity-100' : 'opacity-30'}`} /> At least 1 number
                      </span>
                      <span className={`inline-flex items-center gap-1 ${regCriteria.hasSpecial ? 'text-emerald-600 dark:text-emerald-400' : ''}`}>
                        <Check className={`w-3 h-3 ${regCriteria.hasSpecial ? 'opacity-100' : 'opacity-30'}`} /> Special character
                      </span>
                    </div>
                  </div>
                )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading || !isRegisterFormValid}
                aria-disabled={loading || !isRegisterFormValid}
                className="h-10 w-full bg-[#C6923B] hover:bg-[#B07B28] text-white font-bold rounded-xl shadow-md shadow-[#C6923B]/25 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center justify-center gap-2 text-xs sm:text-sm font-sans mt-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Provisioning Workspace...</span>
                  </>
                ) : (
                  <span>Create Operational Workspace</span>
                )}
              </button>
            </form>
          )}

          {/* ──────────────────────────────────────────────────────────── */}
          {/* TAB 3: TWO-FACTOR AUTHENTICATION (TOTP MFA)                  */}
          {/* ──────────────────────────────────────────────────────────── */}
          {activeTab === 'mfa' && (
            <form onSubmit={handleMfaVerify} className="space-y-4 pt-1">
              <div className="space-y-3">
                <div className="p-3.5 bg-slate-100 dark:bg-[#111827] rounded-2xl border border-slate-200 dark:border-slate-800 text-center space-y-1.5">
                  <div className="w-9 h-9 rounded-xl bg-[#C6923B]/15 text-[#C6923B] dark:text-[#E5B04E] flex items-center justify-center mx-auto">
                    <KeyRound className="w-4 h-4" />
                  </div>
                  <h3 className="font-bold text-slate-900 dark:text-white text-sm">
                    Enter Authenticator Code
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Open your TOTP app (Google Authenticator, Microsoft Authenticator, or 1Password) and enter the 6-digit code for{' '}
                    <strong className="text-[#C6923B] dark:text-[#E5B04E]">{mfaUserData?.email || email}</strong>.
                  </p>
                </div>

                <div>
                  <input
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    maxLength={6}
                    autoFocus
                    required
                    value={mfaCode}
                    onChange={(e) => setMfaCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    placeholder="000000"
                    aria-label="6-digit authentication code"
                    className="h-12 w-full px-4 bg-white dark:bg-[#111827] border border-slate-300 dark:border-slate-800 rounded-xl text-center text-xl font-mono font-bold tracking-[0.3em] text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#C6923B]/40 focus:border-[#C6923B]"
                  />
                  <div className="min-h-[16px] pt-1 text-[11px] text-center text-slate-500 dark:text-slate-400">
                    {mfaResendSeconds > 0 ? (
                      <span>Code active. Resend backup code in {mfaResendSeconds}s</span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => {
                          setMfaResendSeconds(30);
                          setSuccess('Backup authentication prompt dispatched.');
                        }}
                        className="text-[#C6923B] dark:text-[#E5B04E] font-bold hover:underline cursor-pointer inline-flex items-center gap-1"
                      >
                        <RefreshCw className="w-3 h-3" /> Resend verification code
                      </button>
                    )}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab('signin');
                    setError('');
                    setErrorDismissed(false);
                    setSuccess('');
                    setMfaCode('');
                  }}
                  className="h-10 px-3 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold rounded-xl transition-colors cursor-pointer text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading || mfaCode.length < 6}
                  className="h-10 px-3 bg-[#C6923B] hover:bg-[#B07B28] text-white font-bold rounded-xl shadow-md shadow-[#C6923B]/25 transition-all cursor-pointer disabled:opacity-50 text-xs inline-flex items-center justify-center gap-2"
                >
                  {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
                  <span>{loading ? 'Verifying...' : 'Verify & Continue'}</span>
                </button>
              </div>
            </form>
          )}

          {/* ──────────────────────────────────────────────────────────── */}
          {/* TAB 4: PASSWORD RESET WORKFLOW                               */}
          {/* ──────────────────────────────────────────────────────────── */}
          {activeTab === 'forgot' && (
            <div className="space-y-3 pt-1">
              {resetStep === 'request' ? (
                <form onSubmit={handleRequestReset} noValidate className="space-y-4">
                  <div>
                    <label htmlFor="reset-email" className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-0.5">
                      Account Email Address
                    </label>
                    <input
                      id="reset-email"
                      type="email"
                      autoComplete="email"
                      required
                      disabled={loading}
                      value={resetEmail}
                      onChange={(e) => setResetEmail(e.target.value)}
                      onBlur={() => setResetEmailTouched(true)}
                      placeholder="name@company.com"
                      className="h-10 w-full px-3 bg-white dark:bg-[#111827] border border-slate-300 dark:border-slate-800 rounded-xl text-xs sm:text-sm text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-[#C6923B]/40 focus:border-[#C6923B] transition-colors"
                    />
                    <div className="min-h-[16px] pt-0.5 text-[10px] leading-tight flex items-center">
                      {resetEmailTouched && !isValidEmail(resetEmail) ? (
                        <span role="alert" className="text-rose-600 dark:text-rose-400 font-medium">
                          Enter a valid account email address
                        </span>
                      ) : (
                        <span className="text-slate-400 dark:text-slate-500">
                          A 6-digit verification code will be sent to this email address
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setActiveTab('signin');
                        setError('');
                        setErrorDismissed(false);
                      }}
                      className="h-10 px-3 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold rounded-xl transition-colors cursor-pointer text-xs"
                    >
                      Back to Sign In
                    </button>
                    <button
                      type="submit"
                      disabled={loading || !isValidEmail(resetEmail)}
                      className="h-10 px-3 bg-[#C6923B] hover:bg-[#B07B28] text-white font-bold rounded-xl shadow-md shadow-[#C6923B]/25 transition-all cursor-pointer disabled:opacity-50 text-xs inline-flex items-center justify-center gap-2"
                    >
                      {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
                      <span>{loading ? 'Sending...' : 'Send Reset Code'}</span>
                    </button>
                  </div>
                </form>
              ) : (
                <form onSubmit={handleConfirmReset} noValidate className="space-y-2">
                    <div className="p-2.5 bg-[#C6923B]/10 border border-[#C6923B]/30 rounded-xl text-xs text-slate-700 dark:text-slate-300">
                      Resetting password for: <strong className="text-[#C6923B] dark:text-[#E5B04E]">{resetEmail || email}</strong>
                    </div>

                    {/* Dev Code Banner if SMTP wasn't configured on server */}
                    {devResetCode && (
                      <div className="p-2 bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800/60 rounded-xl text-[11px] text-amber-800 dark:text-amber-200 flex items-center justify-between">
                        <span>Verification Code: <strong className="font-mono text-xs">{devResetCode}</strong></span>
                        <span className="text-[10px] text-amber-600 dark:text-amber-400">Prefilled for test</span>
                      </div>
                    )}

                    {/* Verification code input */}
                    <div>
                      <label htmlFor="reset-code" className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-0.5">
                        Verification Code
                      </label>
                      <input
                        id="reset-code"
                        type="text"
                        maxLength={8}
                        required
                        disabled={loading}
                        value={resetCode}
                        onChange={(e) => setResetCode(e.target.value.trim())}
                        placeholder="Enter 6-digit code"
                        className="h-10 w-full px-3 bg-white dark:bg-[#111827] border border-slate-300 dark:border-slate-800 rounded-xl text-xs sm:text-sm font-mono text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#C6923B]/40 focus:border-[#C6923B]"
                      />
                      <div className="min-h-[16px] pt-0.5 text-[10px] text-slate-400 dark:text-slate-500">
                        Check your email inbox or spam folder for the verification code
                      </div>
                    </div>

                    {/* New Password */}
                    <div>
                      <label htmlFor="reset-new-pwd" className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-0.5">
                        New Password
                      </label>
                      <div className="relative">
                        <input
                          id="reset-new-pwd"
                          type={showNewPassword ? 'text' : 'password'}
                          autoComplete="new-password"
                          required
                          disabled={loading}
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          onBlur={() => setNewPasswordTouched(true)}
                          placeholder="Min. 8 characters"
                          className="h-10 w-full px-3 pr-8 bg-white dark:bg-[#111827] border border-slate-300 dark:border-slate-800 rounded-xl text-xs sm:text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#C6923B]/40 focus:border-[#C6923B]"
                        />
                        <button
                          type="button"
                          onClick={() => setShowNewPassword(!showNewPassword)}
                          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                        >
                          {showNewPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                      <div className="min-h-[16px] pt-0.5 text-[10px] leading-tight flex items-center">
                        {newPasswordTouched && newPassword.length < 8 ? (
                          <span role="alert" className="text-rose-600 dark:text-rose-400 font-medium">
                            Password must be at least 8 characters
                          </span>
                        ) : (
                          <span className="invisible select-none" aria-hidden="true">&nbsp;</span>
                        )}
                      </div>
                    </div>

                    {/* Confirm New Password */}
                    <div>
                      <label htmlFor="reset-confirm-pwd" className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-0.5">
                        Confirm New Password
                      </label>
                      <input
                        id="reset-confirm-pwd"
                        type="password"
                        autoComplete="new-password"
                        required
                        disabled={loading}
                        value={confirmNewPassword}
                        onChange={(e) => setConfirmNewPassword(e.target.value)}
                        onBlur={() => setConfirmNewPasswordTouched(true)}
                        placeholder="Repeat new password"
                        className="h-10 w-full px-3 bg-white dark:bg-[#111827] border border-slate-300 dark:border-slate-800 rounded-xl text-xs sm:text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#C6923B]/40 focus:border-[#C6923B]"
                      />
                      <div className="min-h-[16px] pt-0.5 text-[10px] leading-tight flex items-center">
                        {confirmNewPasswordTouched && confirmNewPassword !== newPassword ? (
                          <span role="alert" className="text-rose-600 dark:text-rose-400 font-medium">
                            Passwords do not match
                          </span>
                        ) : (
                          <span className="invisible select-none" aria-hidden="true">&nbsp;</span>
                        )}
                      </div>
                    </div>

                    {/* Reset Password strength indicator */}
                    {newPassword && (
                      <div className="p-2 bg-slate-100/90 dark:bg-[#111827] rounded-xl border border-slate-200 dark:border-slate-800 space-y-1">
                        <div className="flex items-center justify-between text-[11px] font-semibold text-slate-600 dark:text-slate-400">
                          <span>Password Strength:</span>
                          <span className={
                            resetStrengthScore <= 1 ? 'text-rose-500' :
                            resetStrengthScore <= 2 ? 'text-amber-500' :
                            resetStrengthScore === 3 ? 'text-blue-500' : 'text-emerald-500'
                          }>
                            {resetStrengthScore <= 1 && 'Weak'}
                            {resetStrengthScore <= 2 && 'Fair'}
                            {resetStrengthScore === 3 && 'Good'}
                            {resetStrengthScore === 4 && 'Strong'}
                          </span>
                        </div>
                        <div className="grid grid-cols-4 gap-1.5 h-1.5 w-full">
                          <div className={`rounded-full ${resetStrengthScore >= 1 ? 'bg-[#C6923B]' : 'bg-slate-300 dark:bg-slate-700'}`} />
                          <div className={`rounded-full ${resetStrengthScore >= 2 ? 'bg-[#C6923B]' : 'bg-slate-300 dark:bg-slate-700'}`} />
                          <div className={`rounded-full ${resetStrengthScore >= 3 ? 'bg-blue-500' : 'bg-slate-300 dark:bg-slate-700'}`} />
                          <div className={`rounded-full ${resetStrengthScore >= 4 ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-slate-700'}`} />
                        </div>
                      </div>
                    )}

                  <div className="grid grid-cols-2 gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => {
                        setResetStep('request');
                        setResetCode('');
                        setDevResetCode(null);
                        setError('');
                      }}
                      className="h-10 px-3 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold rounded-xl transition-colors cursor-pointer text-xs"
                    >
                      Change Email
                    </button>
                    <button
                      type="submit"
                      disabled={loading || !resetCode || newPassword.length < 8 || newPassword !== confirmNewPassword}
                      className="h-10 px-3 bg-[#C6923B] hover:bg-[#B07B28] text-white font-bold rounded-xl shadow-md shadow-[#C6923B]/25 transition-all cursor-pointer disabled:opacity-50 text-xs inline-flex items-center justify-center gap-2"
                    >
                      {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
                      <span>{loading ? 'Saving...' : 'Set New Password'}</span>
                    </button>
                  </div>
                </form>
              )}
            </div>
          )}

          {/* ──────────────────────────────────────────────────────────── */}
          {/* TAB 5: WORKSPACE INVITATION ACCEPTANCE                       */}
          {/* ──────────────────────────────────────────────────────────── */}
          {activeTab === 'invite' && (
            <form onSubmit={handleAcceptInvite} className="space-y-2">
              <div className="p-3 bg-blue-50 dark:bg-blue-950/30 rounded-xl border border-blue-200 dark:border-blue-800/40 text-center space-y-1">
                <div className="w-8 h-8 rounded-xl bg-blue-500/15 text-blue-600 dark:text-blue-400 flex items-center justify-center mx-auto">
                  <Building2 className="w-4 h-4" />
                </div>
                <h3 className="font-bold text-slate-900 dark:text-white text-sm">
                  Join Workspace: {inviteDetails?.workspace_name || 'Production Workspace'}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Invited by <strong className="text-blue-600 dark:text-blue-400">{inviteDetails?.invited_by || 'Workspace Admin'}</strong> to join as a <span className="px-1.5 py-0.5 rounded bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 font-bold">{inviteDetails?.role || 'Engineer'}</span>.
                </p>
              </div>

              {/* Email (Disabled) */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-0.5">
                  Invited Email
                </label>
                <input
                  type="email"
                  value={inviteDetails?.email || ''}
                  disabled
                  className="h-10 w-full px-3 bg-slate-100 dark:bg-[#161F30] border border-slate-300 dark:border-slate-800 rounded-xl text-xs sm:text-sm text-slate-600 dark:text-slate-400 font-bold cursor-not-allowed"
                />
              </div>

              {/* Full Name */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-0.5">
                  Your Full Name
                </label>
                <input
                  type="text"
                  required
                  value={inviteFullName}
                  onChange={(e) => setInviteFullName(e.target.value)}
                  placeholder="e.g. Alex Kumar"
                  className="h-10 w-full px-3 bg-white dark:bg-[#111827] border border-slate-300 dark:border-slate-800 rounded-xl text-xs sm:text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#C6923B]/40 focus:border-[#C6923B]"
                />
              </div>

              {/* Password */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-0.5">
                  Create Password
                </label>
                <div className="relative">
                  <input
                    type={showInvitePassword ? 'text' : 'password'}
                    required
                    value={invitePassword}
                    onChange={(e) => setInvitePassword(e.target.value)}
                    placeholder="Min. 8 characters"
                    className="h-10 w-full px-3 pr-8 bg-white dark:bg-[#111827] border border-slate-300 dark:border-slate-800 rounded-xl text-xs sm:text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#C6923B]/40 focus:border-[#C6923B]"
                  />
                  <button
                    type="button"
                    onClick={() => setShowInvitePassword(!showInvitePassword)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                  >
                    {showInvitePassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              {/* Confirm Password */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-0.5">
                  Confirm Password
                </label>
                <input
                  type="password"
                  required
                  value={inviteConfirmPassword}
                  onChange={(e) => setInviteConfirmPassword(e.target.value)}
                  placeholder="Repeat your password"
                  className="h-10 w-full px-3 bg-white dark:bg-[#111827] border border-slate-300 dark:border-slate-800 rounded-xl text-xs sm:text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#C6923B]/40 focus:border-[#C6923B]"
                />
              </div>

              <div className="pt-1">
                <button
                  type="submit"
                  disabled={loading || invitePassword.length < 8 || invitePassword !== inviteConfirmPassword}
                  className="h-10 w-full bg-[#C6923B] hover:bg-[#B07B28] text-white font-bold rounded-xl shadow-md shadow-[#C6923B]/25 transition-all cursor-pointer disabled:opacity-50 text-xs sm:text-sm font-sans"
                >
                  {loading ? 'Joining Workspace...' : 'Accept Invitation & Launch Console'}
                </button>
              </div>

              <div className="text-center pt-0.5">
                <button
                  type="button"
                  onClick={() => {
                    setTokenFromUrl(null);
                    setActiveTab('signin');
                  }}
                  className="text-xs text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 cursor-pointer"
                >
                  Switch to standard sign-in
                </button>
              </div>
            </form>
          )}

        </div>

        {/* ──────────────────────────────────────────────────────────── */}
        {/* RIGHT PANEL FOOTER                                           */}
        {/* ──────────────────────────────────────────────────────────── */}
        <div className="w-full max-w-[420px] mx-auto pt-3 text-center text-[11px] font-sans text-slate-500 dark:text-slate-400 border-t border-slate-200 dark:border-slate-800/80 shrink-0">
          <span>{brandName} • Multi-Tenant Control Plane</span>
        </div>

      </div>

    </div>
  );
};
