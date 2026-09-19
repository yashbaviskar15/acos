import React, { useState, useMemo } from 'react';
import {
  Shield,
  KeyRound,
  Lock,
  Globe,
  Search,
  CheckCircle2,
  AlertTriangle,
  ChevronRight,
  Terminal,
  Activity,
  Building2,
  Sliders,
  Mail,
  HelpCircle,
  Zap,
} from 'lucide-react';
import { Navbar, LandingView } from '../components/ui/Navbar';
import { Footer } from '../components/ui/Footer';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { CodeBlock } from '../components/ui/CopyButton';

interface PageProps {
  onGoToLogin: () => void;
  onGoToRegister: () => void;
  onOpenCommandPalette?: () => void;
  onNavigate?: (view: LandingView) => void;
}

interface ManualSection {
  id: string;
  title: string;
  icon: React.ComponentType<any>;
  summary: string;
}

const SECTIONS: ManualSection[] = [
  {
    id: 'architecture',
    title: 'Security Architecture & Protocols',
    icon: Shield,
    summary: 'Zero-trust perimeter, TLS 1.3 encryption, and enterprise RBAC boundary standards.',
  },
  {
    id: 'signin',
    title: 'Platform Authentication & Identifiers',
    icon: KeyRound,
    summary: 'Signing in via corporate work email or unique ARV-ACC account identifier.',
  },
  {
    id: 'password-policy',
    title: 'Password Complexity & Live Tester',
    icon: Sliders,
    summary: 'Mandatory 5-rule criteria, entropy score grading, and interactive validator.',
  },
  {
    id: 'mfa',
    title: 'Two-Factor Authentication (TOTP)',
    icon: Lock,
    summary: 'RFC 6238 time-based passcodes using Google Authenticator, 1Password, or Bitwarden.',
  },
  {
    id: 'oauth',
    title: 'OAuth 2.0 (Google & GitHub)',
    icon: Globe,
    summary: 'Single-click federated identity provider integration for engineering teams.',
  },
  {
    id: 'recovery',
    title: 'Password Reset & Account Recovery',
    icon: Mail,
    summary: 'Secure SMTP email dispatch with 6-digit cryptographic verification fallback.',
  },
  {
    id: 'workspaces',
    title: 'Workspace Provisioning & RBAC',
    icon: Building2,
    summary: 'Tenant isolation, team invitations, and role delegation matrices.',
  },
  {
    id: 'troubleshooting',
    title: 'Rate Limits & SRE Troubleshooting',
    icon: Activity,
    summary: 'Lockout defense thresholds, HTTP status codes, and recovery procedures.',
  },
];

export const UserManualPage: React.FC<PageProps> = ({
  onGoToLogin,
  onGoToRegister,
  onOpenCommandPalette,
  onNavigate,
}) => {
  const [activeSectionId, setActiveSectionId] = useState('architecture');
  const [searchQuery, setSearchQuery] = useState('');

  // Interactive Password Tester state
  const [testPassword, setTestPassword] = useState('');

  const passwordEvaluation = useMemo(() => {
    const pwd = testPassword;
    const hasMinLength = pwd.length >= 8;
    const hasUpper = /[A-Z]/.test(pwd);
    const hasLower = /[a-z]/.test(pwd);
    const hasNumber = /[0-9]/.test(pwd);
    const hasSpecial = /[^A-Za-z0-9]/.test(pwd);

    let score = 0;
    if (hasMinLength) score += 1;
    if (hasUpper && hasLower) score += 1;
    if (hasNumber) score += 1;
    if (hasSpecial) score += 1;

    return {
      hasMinLength,
      hasUpper,
      hasLower,
      hasNumber,
      hasSpecial,
      score,
    };
  }, [testPassword]);

  // Troubleshooting accordion state
  const [expandedFaqIndex, setExpandedFaqIndex] = useState<number | null>(0);

  const troubleshootingItems = [
    {
      q: 'Account is locked: "Security Lockout Active (429)"',
      cause: '5 consecutive failed credential attempts within a 60-second window.',
      resolution: 'The system locks authentication for 60 seconds. Wait until the timer hits zero or initiate a self-service password reset to instantly clear the failed attempt counter.',
    },
    {
      q: 'MFA 6-Digit code rejected as invalid',
      cause: 'Device clock drift or expired 30-second TOTP rotation window.',
      resolution: 'Ensure your mobile device clock is set to automatic network time synchronization. If a code fails, wait for the next 30-second rotation or click "Resend verification code".',
    },
    {
      q: 'Password reset code not arriving in inbox',
      cause: 'Corporate email gateway filtering or SMTP delay.',
      resolution: 'Check your spam or quarantine folders. In development or preview environments where SMTP host variables are not mounted, the 6-digit verification code displays directly on-screen and pre-fills automatically.',
    },
    {
      q: 'OAuth authentication returns "Invalid state token"',
      cause: 'Stale OAuth session or third-party cookies disabled in browser.',
      resolution: 'Ensure third-party storage is permitted for oauth.google.com / github.com, or use the direct OAuth email prompt fallback by entering your corporate address in the sign-in input before clicking the provider button.',
    },
    {
      q: 'Workspace invitation token expired',
      cause: 'Invitation links remain active for 7 days from initial administrator issuance.',
      resolution: 'Request your Workspace Administrator to re-issue the invitation from the Settings > Members console, or create an independent tenant workspace.',
    },
  ];

  const filteredSections = useMemo(() => {
    if (!searchQuery.trim()) return SECTIONS;
    const query = searchQuery.toLowerCase();
    return SECTIONS.filter(
      (s) =>
        s.title.toLowerCase().includes(query) ||
        s.summary.toLowerCase().includes(query) ||
        s.id.toLowerCase().includes(query)
    );
  }, [searchQuery]);

  const scrollToSection = (id: string) => {
    setActiveSectionId(id);
    const element = document.getElementById(`manual-${id}`);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0B0F17] text-slate-900 dark:text-slate-100 font-sans selection:bg-[#C6923B]/30 selection:text-[#C6923B]">
      {/* Universal Top Navigation */}
      <Navbar
        onGoToLogin={onGoToLogin}
        onGoToRegister={onGoToRegister}
        onOpenCommandPalette={onOpenCommandPalette}
        onNavigate={onNavigate}
        currentView="documentation"
      />

      {/* Hero Header Strip */}
      <section className="border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0E131F] py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-2 max-w-3xl">
              <div className="flex items-center gap-2">
                <Badge variant="gold" size="sm" className="font-mono">
                  ACOS v2.4 Enterprise Edition
                </Badge>
                <Badge variant="success" size="sm" className="font-mono">
                  SOC 2 Type II Certified
                </Badge>
              </div>
              <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-slate-900 dark:text-white">
                User Authentication & Security Manual
              </h1>
              <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400 leading-relaxed">
                Comprehensive operational guide for enterprise identity, multi-factor credential governance, OAuth 2.0 federation, and multi-tenant access control across the Aravanta Cloud OS control plane.
              </p>
            </div>

            <div className="flex items-center gap-3 shrink-0">
              <Button
                variant="outline"
                size="md"
                onClick={onGoToLogin}
                className="cursor-pointer"
              >
                Launch Portal
              </Button>
              <Button
                variant="primary"
                size="md"
                onClick={onGoToRegister}
                className="cursor-pointer bg-[#C6923B] hover:bg-[#B07B28] text-white border-none shadow-md shadow-[#C6923B]/20"
              >
                Create Workspace
              </Button>
            </div>
          </div>

          {/* Search Filter Bar */}
          <div className="mt-8 max-w-xl relative">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search user manual topics, security policies, error codes..."
              className="w-full h-11 pl-10 pr-4 bg-slate-50 dark:bg-[#111827] border border-slate-300 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#C6923B]/40 focus:border-[#C6923B] transition-colors"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-200"
              >
                Clear
              </button>
            )}
          </div>
        </div>
      </section>

      {/* Main Two-Column Manual Layout */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="flex flex-col lg:flex-row gap-10">

          {/* Left Sticky Sidebar Navigation */}
          <aside className="lg:w-72 shrink-0">
            <div className="sticky top-24 space-y-4">
              <div className="p-3 bg-white dark:bg-[#111827] rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-1">
                <div className="px-3 py-2 text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400">
                  Manual Sections ({filteredSections.length})
                </div>
                <nav className="space-y-0.5">
                  {filteredSections.map((sec) => {
                    const Icon = sec.icon;
                    const isActive = activeSectionId === sec.id;
                    return (
                      <button
                        key={sec.id}
                        type="button"
                        onClick={() => scrollToSection(sec.id)}
                        className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold transition-colors text-left cursor-pointer ${
                          isActive
                            ? 'bg-[#C6923B]/10 text-[#C6923B] dark:text-[#E5B04E] font-bold'
                            : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/60'
                        }`}
                      >
                        <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-[#C6923B] dark:text-[#E5B04E]' : 'text-slate-400'}`} />
                        <span className="truncate">{sec.title}</span>
                      </button>
                    );
                  })}
                </nav>
              </div>

              {/* Quick Compliance Card */}
              <div className="p-4 bg-slate-100 dark:bg-[#111827] rounded-2xl border border-slate-200 dark:border-slate-800 text-xs space-y-2">
                <div className="flex items-center gap-2 font-bold text-slate-800 dark:text-slate-200">
                  <Shield className="w-4 h-4 text-emerald-500" />
                  <span>Zero-Trust Standard</span>
                </div>
                <p className="text-slate-500 dark:text-slate-400 text-[11px] leading-relaxed">
                  All requests undergo mutual authentication and hardware-accelerated TLS 1.3 cryptographic integrity checks before reaching cluster workloads.
                </p>
              </div>
            </div>
          </aside>

          {/* Right Content Area: Manual Sections */}
          <main className="flex-1 space-y-12 min-w-0">

            {/* SECTION 1: ARCHITECTURE */}
            <section id="manual-architecture" className="space-y-4 scroll-mt-28">
              <div className="flex items-center gap-3 pb-2 border-b border-slate-200 dark:border-slate-800">
                <div className="w-8 h-8 rounded-xl bg-blue-500/10 text-blue-500 flex items-center justify-center shrink-0">
                  <Shield className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-xl font-black text-slate-900 dark:text-white">
                    1. Security Architecture & Cryptographic Standards
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Control plane identity verification and zero-trust transport boundary.
                  </p>
                </div>
              </div>

              <div className="prose dark:prose-invert max-w-none text-xs sm:text-sm text-slate-600 dark:text-slate-300 space-y-3 leading-relaxed">
                <p>
                  Aravanta Cloud OS (ACOS) implements a defense-in-depth security perimeter. Every telemetry stream, Kubernetes API invocation, and administrative action requires signed cryptographic verification via JSON Web Tokens (JWT) using the HMAC-SHA256 protocol.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                <div className="p-3.5 bg-white dark:bg-[#111827] rounded-xl border border-slate-200 dark:border-slate-800 space-y-1">
                  <div className="text-[10px] font-mono font-bold uppercase text-slate-400">Encryption</div>
                  <div className="font-bold text-slate-900 dark:text-white text-sm">TLS 1.3 Strict</div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400">AES-256-GCM cipher suite with perfect forward secrecy.</div>
                </div>

                <div className="p-3.5 bg-white dark:bg-[#111827] rounded-xl border border-slate-200 dark:border-slate-800 space-y-1">
                  <div className="text-[10px] font-mono font-bold uppercase text-slate-400">Governance</div>
                  <div className="font-bold text-slate-900 dark:text-white text-sm">Zero-Trust RBAC</div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400">Granular permission gates on all cluster resources.</div>
                </div>

                <div className="p-3.5 bg-white dark:bg-[#111827] rounded-xl border border-slate-200 dark:border-slate-800 space-y-1">
                  <div className="text-[10px] font-mono font-bold uppercase text-slate-400">Tokens</div>
                  <div className="font-bold text-slate-900 dark:text-white text-sm">Rotating JWTs</div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400">15-minute standard expiration with cryptographic refresh.</div>
                </div>
              </div>
            </section>

            {/* SECTION 2: SIGN-IN PROCEDURES */}
            <section id="manual-signin" className="space-y-4 scroll-mt-28">
              <div className="flex items-center gap-3 pb-2 border-b border-slate-200 dark:border-slate-800">
                <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center shrink-0">
                  <KeyRound className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-xl font-black text-slate-900 dark:text-white">
                    2. Platform Authentication & Credential Identifiers
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Supported identifier formats and step-by-step console sign-in protocol.
                  </p>
                </div>
              </div>

              <div className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 space-y-2">
                <p>
                  Users may authenticate using either of two supported credential identifiers:
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  <div className="p-3.5 bg-white dark:bg-[#111827] rounded-xl border border-slate-200 dark:border-slate-800 space-y-1.5">
                    <div className="flex items-center gap-2 font-bold text-slate-900 dark:text-white text-xs">
                      <Mail className="w-4 h-4 text-[#C6923B]" />
                      <span>Corporate Work Email</span>
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Standard corporate email address assigned to your organization tenant.
                    </p>
                    <div className="p-1.5 bg-slate-100 dark:bg-slate-800/80 rounded-lg font-mono text-[11px] text-slate-700 dark:text-slate-300">
                      Format: engineer@company.com
                    </div>
                  </div>

                  <div className="p-3.5 bg-white dark:bg-[#111827] rounded-xl border border-slate-200 dark:border-slate-800 space-y-1.5">
                    <div className="flex items-center gap-2 font-bold text-slate-900 dark:text-white text-xs">
                      <Terminal className="w-4 h-4 text-[#C6923B]" />
                      <span>Enterprise Account ID</span>
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Permanent system identifier provisioned during tenant onboarding.
                    </p>
                    <div className="p-1.5 bg-slate-100 dark:bg-slate-800/80 rounded-lg font-mono text-[11px] text-slate-700 dark:text-slate-300">
                      Format: ARV-ACC-100001
                    </div>
                  </div>
                </div>
              </div>

              {/* Step list */}
              <div className="p-4 bg-white dark:bg-[#111827] rounded-xl border border-slate-200 dark:border-slate-800 space-y-2.5">
                <div className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider font-mono">
                  Authentication Sequence
                </div>
                <ol className="space-y-2 text-xs sm:text-sm text-slate-600 dark:text-slate-400 list-decimal list-inside">
                  <li>Navigate to the Login portal via the top navigation bar.</li>
                  <li>Ensure the <strong>Sign In</strong> tab is selected (default tab).</li>
                  <li>Enter your verified Work Email or Account ID in the primary credential field.</li>
                  <li>Enter your password. Use the reveal toggle to verify character accuracy if needed.</li>
                  <li>Optionally check <em>"Stay signed in for 30 days"</em> for dedicated corporate workstations.</li>
                  <li>Click <strong>Sign In to Control Plane</strong>. If TOTP is enabled, proceed to the MFA challenge.</li>
                </ol>
              </div>
            </section>

            {/* SECTION 3: PASSWORD COMPLEXITY & LIVE TESTER */}
            <section id="manual-password-policy" className="space-y-4 scroll-mt-28">
              <div className="flex items-center gap-3 pb-2 border-b border-slate-200 dark:border-slate-800">
                <div className="w-8 h-8 rounded-xl bg-purple-500/10 text-purple-500 flex items-center justify-center shrink-0">
                  <Sliders className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-xl font-black text-slate-900 dark:text-white">
                    3. Password Complexity Policy & Interactive Tester
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Mandatory 5-rule criteria and live policy evaluation engine.
                  </p>
                </div>
              </div>

              {/* Policy Table */}
              <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111827]">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/75 dark:bg-slate-800/40 text-slate-700 dark:text-slate-300 font-bold font-mono">
                      <th className="py-2.5 px-4">Criterion</th>
                      <th className="py-2.5 px-4">Rule Requirement</th>
                      <th className="py-2.5 px-4">Enforcement Details</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 dark:divide-slate-800 font-sans text-slate-600 dark:text-slate-300">
                    <tr>
                      <td className="py-2.5 px-4 font-bold text-slate-900 dark:text-white">Minimum Length</td>
                      <td className="py-2.5 px-4 font-mono text-emerald-600 dark:text-emerald-400">8+ Characters</td>
                      <td className="py-2.5 px-4">Must contain at least 8 characters (12+ recommended for privileged SRE accounts).</td>
                    </tr>
                    <tr>
                      <td className="py-2.5 px-4 font-bold text-slate-900 dark:text-white">Character Diversity</td>
                      <td className="py-2.5 px-4 font-mono text-emerald-600 dark:text-emerald-400">Mixed Case</td>
                      <td className="py-2.5 px-4">Must contain at least one uppercase character (A-Z) and one lowercase character (a-z).</td>
                    </tr>
                    <tr>
                      <td className="py-2.5 px-4 font-bold text-slate-900 dark:text-white">Numeric Content</td>
                      <td className="py-2.5 px-4 font-mono text-emerald-600 dark:text-emerald-400">At least 1 digit</td>
                      <td className="py-2.5 px-4">Must contain at least one numeric digit (0-9).</td>
                    </tr>
                    <tr>
                      <td className="py-2.5 px-4 font-bold text-slate-900 dark:text-white">Special Symbol</td>
                      <td className="py-2.5 px-4 font-mono text-emerald-600 dark:text-emerald-400">At least 1 symbol</td>
                      <td className="py-2.5 px-4">Must contain at least one non-alphanumeric character (e.g. ! @ # $ % ^ & *).</td>
                    </tr>
                    <tr>
                      <td className="py-2.5 px-4 font-bold text-slate-900 dark:text-white">History Restrictions</td>
                      <td className="py-2.5 px-4 font-mono text-emerald-600 dark:text-emerald-400">No recent reuse</td>
                      <td className="py-2.5 px-4">New passwords cannot match the previous 3 passwords utilized on the account.</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Interactive Tester Widget */}
              <div className="p-5 bg-white dark:bg-[#111827] rounded-2xl border-2 border-[#C6923B]/40 shadow-sm space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Zap className="w-4 h-4 text-[#C6923B]" />
                    <span className="font-bold text-slate-900 dark:text-white text-sm">
                      Interactive Password Policy Tester
                    </span>
                  </div>
                  <Badge variant={
                    passwordEvaluation.score <= 1 ? 'danger' :
                    passwordEvaluation.score <= 2 ? 'warning' :
                    passwordEvaluation.score === 3 ? 'info' : 'success'
                  }>
                    {passwordEvaluation.score <= 1 && 'Weak Rating'}
                    {passwordEvaluation.score === 2 && 'Fair Rating'}
                    {passwordEvaluation.score === 3 && 'Good Rating'}
                    {passwordEvaluation.score === 4 && 'Strong Compliant'}
                  </Badge>
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="test-pwd-input" className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                    Type a password to test policy compliance:
                  </label>
                  <input
                    id="test-pwd-input"
                    type="text"
                    value={testPassword}
                    onChange={(e) => setTestPassword(e.target.value)}
                    placeholder="Enter test password (e.g. Aravanta$2026Secure)"
                    className="h-10 w-full px-3.5 bg-slate-50 dark:bg-[#0B0F17] border border-slate-300 dark:border-slate-700 rounded-xl text-xs sm:text-sm font-mono text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#C6923B]/40 focus:border-[#C6923B]"
                  />
                </div>

                {/* Progress bar */}
                <div className="space-y-1">
                  <div className="grid grid-cols-4 gap-1.5 h-1.5 w-full">
                    <div className={`rounded-full ${passwordEvaluation.score >= 1 ? 'bg-[#C6923B]' : 'bg-slate-200 dark:bg-slate-700'}`} />
                    <div className={`rounded-full ${passwordEvaluation.score >= 2 ? 'bg-[#C6923B]' : 'bg-slate-200 dark:bg-slate-700'}`} />
                    <div className={`rounded-full ${passwordEvaluation.score >= 3 ? 'bg-blue-500' : 'bg-slate-200 dark:bg-slate-700'}`} />
                    <div className={`rounded-full ${passwordEvaluation.score >= 4 ? 'bg-emerald-500' : 'bg-slate-200 dark:bg-slate-700'}`} />
                  </div>
                </div>

                {/* Criteria checklist */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                  <div className={`p-2 rounded-lg border flex items-center gap-1.5 ${
                    passwordEvaluation.hasMinLength
                      ? 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-300 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300'
                      : 'bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800 text-slate-400'
                  }`}>
                    <CheckCircle2 className={`w-3.5 h-3.5 ${passwordEvaluation.hasMinLength ? 'opacity-100' : 'opacity-30'}`} />
                    <span>8+ Chars</span>
                  </div>

                  <div className={`p-2 rounded-lg border flex items-center gap-1.5 ${
                    (passwordEvaluation.hasUpper && passwordEvaluation.hasLower)
                      ? 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-300 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300'
                      : 'bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800 text-slate-400'
                  }`}>
                    <CheckCircle2 className={`w-3.5 h-3.5 ${(passwordEvaluation.hasUpper && passwordEvaluation.hasLower) ? 'opacity-100' : 'opacity-30'}`} />
                    <span>Upper & Lower</span>
                  </div>

                  <div className={`p-2 rounded-lg border flex items-center gap-1.5 ${
                    passwordEvaluation.hasNumber
                      ? 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-300 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300'
                      : 'bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800 text-slate-400'
                  }`}>
                    <CheckCircle2 className={`w-3.5 h-3.5 ${passwordEvaluation.hasNumber ? 'opacity-100' : 'opacity-30'}`} />
                    <span>Numbers (0-9)</span>
                  </div>

                  <div className={`p-2 rounded-lg border flex items-center gap-1.5 ${
                    passwordEvaluation.hasSpecial
                      ? 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-300 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300'
                      : 'bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800 text-slate-400'
                  }`}>
                    <CheckCircle2 className={`w-3.5 h-3.5 ${passwordEvaluation.hasSpecial ? 'opacity-100' : 'opacity-30'}`} />
                    <span>Special Symbols</span>
                  </div>
                </div>
              </div>
            </section>

            {/* SECTION 4: TWO-FACTOR AUTHENTICATION */}
            <section id="manual-mfa" className="space-y-4 scroll-mt-28">
              <div className="flex items-center gap-3 pb-2 border-b border-slate-200 dark:border-slate-800">
                <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center shrink-0">
                  <Lock className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-xl font-black text-slate-900 dark:text-white">
                    4. Two-Factor Authentication (TOTP MFA)
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Hardware and software authenticator application configuration.
                  </p>
                </div>
              </div>

              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                When Multi-Factor Authentication is enabled for your account or mandated by organizational security policy, primary credential submission is accompanied by an RFC 6238 Time-based One-Time Password challenge.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-4 bg-white dark:bg-[#111827] rounded-xl border border-slate-200 dark:border-slate-800 space-y-2">
                  <div className="font-bold text-xs uppercase tracking-wider text-slate-400 font-mono">
                    Supported TOTP Applications
                  </div>
                  <ul className="space-y-1.5 text-xs text-slate-600 dark:text-slate-300 list-disc list-inside">
                    <li>Google Authenticator (Android, iOS)</li>
                    <li>Microsoft Authenticator (Android, iOS)</li>
                    <li>1Password / Bitwarden / Apple Passwords</li>
                    <li>Authy & YubiKey Authenticator</li>
                  </ul>
                </div>

                <div className="p-4 bg-white dark:bg-[#111827] rounded-xl border border-slate-200 dark:border-slate-800 space-y-2">
                  <div className="font-bold text-xs uppercase tracking-wider text-slate-400 font-mono">
                    Challenge Behavior
                  </div>
                  <ul className="space-y-1.5 text-xs text-slate-600 dark:text-slate-300 list-disc list-inside">
                    <li>6-Digit numeric code format with auto-submit</li>
                    <li>30-Second time window rotation with active countdown</li>
                    <li>Single-use cryptographic nonce invalidation</li>
                    <li>Zero layout-shift transitional challenge screen</li>
                  </ul>
                </div>
              </div>
            </section>

            {/* SECTION 5: OAUTH 2.0 (GOOGLE & GITHUB) */}
            <section id="manual-oauth" className="space-y-4 scroll-mt-28">
              <div className="flex items-center gap-3 pb-2 border-b border-slate-200 dark:border-slate-800">
                <div className="w-8 h-8 rounded-xl bg-cyan-500/10 text-cyan-500 flex items-center justify-center shrink-0">
                  <Globe className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-xl font-black text-slate-900 dark:text-white">
                    5. Single Sign-On and Social Authentication (Google & GitHub)
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Federated OAuth 2.0 flow for developers and engineering teams.
                  </p>
                </div>
              </div>

              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                Aravanta Cloud OS natively integrates with Google and GitHub OAuth 2.0 providers. Microsoft and SAML SSO options were deprecated in favor of streamlined developer workflows.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-4 bg-white dark:bg-[#111827] rounded-xl border border-slate-200 dark:border-slate-800 space-y-2">
                  <div className="flex items-center gap-2 font-bold text-slate-900 dark:text-white text-xs">
                    <svg className="w-4 h-4" viewBox="0 0 24 24">
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
                    </svg>
                    <span>Google Workspace & Gmail</span>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                    Connect corporate Google Workspace credentials. Seamlessly binds corporate email identities to existing tenant profiles without password synchronization.
                  </p>
                </div>

                <div className="p-4 bg-white dark:bg-[#111827] rounded-xl border border-slate-200 dark:border-slate-800 space-y-2">
                  <div className="flex items-center gap-2 font-bold text-slate-900 dark:text-white text-xs">
                    <svg className="w-4 h-4 fill-current text-slate-800 dark:text-white" viewBox="0 0 24 24">
                      <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
                    </svg>
                    <span>GitHub Developer OAuth</span>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                    Connect GitHub developer credentials for unified GitOps pipelines, container deployment approvals, and repository webhook integration.
                  </p>
                </div>
              </div>

              <div className="pt-2">
                <div className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-2 font-mono">
                  OAuth Direct API Endpoint Example:
                </div>
                <CodeBlock
                  language="bash"
                  code={`curl -X POST https://api.aravanta.com/api/v1/auth/oauth/login \\
  -H "Content-Type: application/json" \\
  -d '{
    "provider": "google",
    "email": "engineer@company.com",
    "full_name": "Alex Kumar"
  }'`}
                />
              </div>
            </section>

            {/* SECTION 6: PASSWORD RESET & ACCOUNT RECOVERY */}
            <section id="manual-recovery" className="space-y-4 scroll-mt-28">
              <div className="flex items-center gap-3 pb-2 border-b border-slate-200 dark:border-slate-800">
                <div className="w-8 h-8 rounded-xl bg-rose-500/10 text-rose-500 flex items-center justify-center shrink-0">
                  <Mail className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-xl font-black text-slate-900 dark:text-white">
                    6. Password Reset & Account Recovery (SMTP & Fallback)
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Two-step email challenge and development mode verification code fallback.
                  </p>
                </div>
              </div>

              <div className="p-4 bg-white dark:bg-[#111827] rounded-xl border border-slate-200 dark:border-slate-800 space-y-3">
                <div className="font-bold text-xs uppercase tracking-wider text-slate-400 font-mono">
                  Recovery Workflow (Step-by-Step)
                </div>
                <div className="space-y-2 text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                  <p>
                    <strong>1. Request Verification Code:</strong> Navigate to the Sign In screen and click <em>"Forgot password?"</em>. Input your registered account email and click <em>"Send Reset Code"</em>.
                  </p>
                  <p>
                    <strong>2. SMTP Email Delivery:</strong> In production environments with SMTP configured (<code className="font-mono text-[11px] bg-slate-100 dark:bg-slate-800 px-1 py-0.5 rounded">SMTP_HOST</code>, <code className="font-mono text-[11px] bg-slate-100 dark:bg-slate-800 px-1 py-0.5 rounded">SMTP_USER</code>), an encrypted TLS email containing a 6-digit numeric verification code is dispatched immediately.
                  </p>
                  <p>
                    <strong>3. Development & Preview Fallback:</strong> When running in local development or preview deployments where an external SMTP server is not connected, the platform automatically returns the generated 6-digit verification code in the on-screen banner and pre-fills the input field. This prevents developer lockout.
                  </p>
                  <p>
                    <strong>4. Confirm & Update:</strong> Enter the 6-digit code, specify a compliant new password (satisfying all 5 policy rules), and submit. The system updates your credentials and returns you to the login screen.
                  </p>
                </div>
              </div>
            </section>

            {/* SECTION 7: WORKSPACES & RBAC PROVISIONING */}
            <section id="manual-workspaces" className="space-y-4 scroll-mt-28">
              <div className="flex items-center gap-3 pb-2 border-b border-slate-200 dark:border-slate-800">
                <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center shrink-0">
                  <Building2 className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-xl font-black text-slate-900 dark:text-white">
                    7. Workspace Provisioning & Team Invitations
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Tenant isolation boundaries and role delegation matrices.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="p-3.5 bg-white dark:bg-[#111827] rounded-xl border border-slate-200 dark:border-slate-800 space-y-1">
                  <div className="text-[10px] font-mono font-bold uppercase text-slate-400">Role</div>
                  <div className="font-bold text-slate-900 dark:text-white text-sm">Owner / Admin</div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400">Full billing, member provisioning, cluster creation, and API key generation.</div>
                </div>

                <div className="p-3.5 bg-white dark:bg-[#111827] rounded-xl border border-slate-200 dark:border-slate-800 space-y-1">
                  <div className="text-[10px] font-mono font-bold uppercase text-slate-400">Role</div>
                  <div className="font-bold text-slate-900 dark:text-white text-sm">SRE / Operator</div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400">Workload deployments, rollback trigger, alerting rules, and telemetry access.</div>
                </div>

                <div className="p-3.5 bg-white dark:bg-[#111827] rounded-xl border border-slate-200 dark:border-slate-800 space-y-1">
                  <div className="text-[10px] font-mono font-bold uppercase text-slate-400">Role</div>
                  <div className="font-bold text-slate-900 dark:text-white text-sm">Viewer</div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400">Read-only audit logging and infrastructure health dashboard monitoring.</div>
                </div>
              </div>
            </section>

            {/* SECTION 8: TROUBLESHOOTING & SRE MATRIX */}
            <section id="manual-troubleshooting" className="space-y-4 scroll-mt-28">
              <div className="flex items-center gap-3 pb-2 border-b border-slate-200 dark:border-slate-800">
                <div className="w-8 h-8 rounded-xl bg-rose-500/10 text-rose-500 flex items-center justify-center shrink-0">
                  <Activity className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-xl font-black text-slate-900 dark:text-white">
                    8. Rate Limits & SRE Troubleshooting Matrix
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Defensive lockout limits, error code index, and interactive troubleshooting.
                  </p>
                </div>
              </div>

              {/* Rate Limit Summary Strip */}
              <div className="p-4 bg-amber-50 dark:bg-amber-950/20 border border-amber-300 dark:border-amber-800/60 rounded-xl flex items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
                  <span className="text-amber-900 dark:text-amber-200 font-medium">
                    Rate Limit Protection: 5 failed consecutive attempts triggers an automatic 60-second lockout cooldown.
                  </span>
                </div>
                <Badge variant="warning" size="sm">
                  Lockout Threshold: 5 Attempts
                </Badge>
              </div>

              {/* Interactive Accordion */}
              <div className="space-y-2">
                {troubleshootingItems.map((item, index) => {
                  const isExpanded = expandedFaqIndex === index;
                  return (
                    <div
                      key={index}
                      className="border border-slate-200 dark:border-slate-800 rounded-xl bg-white dark:bg-[#111827] overflow-hidden"
                    >
                      <button
                        type="button"
                        onClick={() => setExpandedFaqIndex(isExpanded ? null : index)}
                        className="w-full p-3.5 flex items-center justify-between text-left font-bold text-xs sm:text-sm text-slate-900 dark:text-white hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors cursor-pointer"
                      >
                        <span className="flex items-center gap-2">
                          <HelpCircle className="w-4 h-4 text-[#C6923B] shrink-0" />
                          <span>{item.q}</span>
                        </span>
                        <ChevronRight className={`w-4 h-4 text-slate-400 transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
                      </button>

                      {isExpanded && (
                        <div className="px-4 pb-4 pt-1 border-t border-slate-100 dark:border-slate-800/60 space-y-2 text-xs text-slate-600 dark:text-slate-400">
                          <div>
                            <span className="font-bold text-slate-700 dark:text-slate-300">Root Cause: </span>
                            {item.cause}
                          </div>
                          <div>
                            <span className="font-bold text-emerald-600 dark:text-emerald-400">Resolution Step: </span>
                            {item.resolution}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* SRE Direct Contact Banner */}
              <div className="p-5 bg-gradient-to-r from-slate-900 to-slate-800 text-white rounded-2xl border border-slate-700 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="space-y-1 text-center sm:text-left">
                  <div className="font-bold text-sm">Need Additional SRE or Identity Support?</div>
                  <p className="text-xs text-slate-400">
                    Enterprise Tier customers have 24/7/365 direct SRE on-call war room dispatch.
                  </p>
                </div>
                <a
                  href="mailto:support@aravanta.com"
                  className="px-4 py-2 bg-[#C6923B] hover:bg-[#B07B28] text-white font-bold rounded-xl text-xs transition-colors cursor-pointer shrink-0"
                >
                  Contact SRE Support
                </a>
              </div>
            </section>

          </main>
        </div>
      </div>

      {/* Universal Page Footer */}
      <Footer onNavigate={onNavigate} />
    </div>
  );
};
export default UserManualPage;
