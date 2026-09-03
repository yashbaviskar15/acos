import React, { useState, useEffect } from 'react';
import { 
  Server, 
  GitBranch, 
  Activity, 
  ShieldAlert, 
  Zap, 
  ShieldCheck, 
  Check, 
  ArrowRight, 
  Menu, 
  X,
  Cpu,
  Database,
  Layers,
  HardDrive,
  RefreshCw,
  Terminal,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { Logo } from '../components/Logo';

interface LandingPageProps {
  onGoToLogin: () => void;
  onGoToRegister: () => void;
  onOpenCommandPalette?: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({
  onGoToLogin,
  onGoToRegister,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeWorkflowStep, setActiveWorkflowStep] = useState(2); // Deploy
  const [activeHeroTab, setActiveHeroTab] = useState<'workloads' | 'canary' | 'alerts' | 'finops'>('workloads');
  const [isTelemetryLoading, setIsTelemetryLoading] = useState(false);
  const [billingPeriod, setBillingPeriod] = useState<'monthly' | 'annual'>('monthly');
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);

  // Trigger brief skeleton simulation on tab switch or manual refresh
  const triggerTelemetryRefresh = () => {
    setIsTelemetryLoading(true);
    setTimeout(() => {
      setIsTelemetryLoading(false);
    }, 650);
  };

  useEffect(() => {
    triggerTelemetryRefresh();
  }, [activeHeroTab]);

  const workflowSteps = [
    { step: '01', name: 'Plan', desc: 'Define declarative infrastructure specs and container image manifests with GitOps versioning.' },
    { step: '02', name: 'Provision', desc: 'Spin up high-performance compute instances, managed Kubernetes worker nodes, and replicated databases in seconds.' },
    { step: '03', name: 'Deploy', desc: 'Execute zero-downtime rolling updates, 25% canary traffic tests, or instant blue/green cutovers with automated rollback.' },
    { step: '04', name: 'Monitor', desc: 'Stream real-time multi-resolution telemetry, P95 latency profiles, and container resource saturation gauges.' },
    { step: '05', name: 'Detect', desc: 'Evaluate firing Alertmanager rules and trigger automated on-call notifications before SLO thresholds breach.' },
    { step: '06', name: 'Respond', desc: 'Engage incident command war-rooms, coordinate remediation timelines, and post timestamped operational updates.' },
    { step: '07', name: 'Recover', desc: 'Trigger self-healing automation runbooks or restore point-in-time database snapshots with 1-click execution.' },
  ];

  const faqs = [
    {
      q: 'How does Aravanta CloudOS guarantee zero-downtime deployments?',
      a: 'Aravanta CloudOS coordinates automated health checks and ingress routing across rolling pods, canary gates (e.g. 25% traffic slice verification), and instant blue/green cutovers. If synthetic latency or HTTP 5xx error spikes are detected, automated 1-click rollback restores the previous stable release within 1.2 seconds.'
    },
    {
      q: 'Can I connect existing AWS, GCP, and Kubernetes infrastructure?',
      a: 'Yes. Aravanta CloudOS acts as a unified control plane. You can orchestrate multi-cloud compute VMs, managed EKS/GKE clusters, database instances (PostgreSQL, MySQL, Redis), and S3-compatible object storage under a single tenant workspace.'
    },
    {
      q: 'How is Two-Factor Authentication (2FA) and RBAC enforced?',
      a: 'Every operational action is verified against a 4-tier Role-Based Access Control matrix (SuperAdmin, Admin, Operator, Developer, Viewer). Time-based One-Time Password (TOTP) MFA with standard 30s RFC 6238 tokens protects logins, and every administrative action is signed into an immutable audit trail.'
    },
    {
      q: 'Is there a free trial available for engineering teams?',
      a: 'Yes. Every new workspace starts with a 10-day full-access Developer Cloud trial with pre-allocated compute, Kubernetes pod testing quotas, and full access to the Alertmanager triage center without requiring a credit card.'
    }
  ];

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-[#0B0F17] text-slate-900 dark:text-slate-100 font-sans transition-colors selection:bg-[#C6923B] selection:text-white">
      
      {/* ── 1. Top Global Navigation Bar ── */}
      <header className="sticky top-0 z-50 bg-white/95 dark:bg-[#111827]/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-8">
            <Logo size="md" />
            
            <nav className="hidden md:flex items-center gap-6 text-xs font-mono font-bold text-slate-600 dark:text-slate-300">
              <a href="#capabilities" className="hover:text-[#C6923B] dark:hover:text-[#D4A347] transition-colors">Capabilities</a>
              <a href="#workflow" className="hover:text-[#C6923B] dark:hover:text-[#D4A347] transition-colors">Workflow</a>
              <a href="#architecture" className="hover:text-[#C6923B] dark:hover:text-[#D4A347] transition-colors">Architecture</a>
              <a href="#pricing" className="hover:text-[#C6923B] dark:hover:text-[#D4A347] transition-colors">Pricing</a>
              <a href="#faq" className="hover:text-[#C6923B] dark:hover:text-[#D4A347] transition-colors">FAQ</a>
            </nav>
          </div>

          <div className="hidden sm:flex items-center gap-3">
            <button
              onClick={onGoToLogin}
              className="px-4 py-2 text-xs font-mono font-bold text-slate-700 dark:text-slate-200 hover:text-[#C6923B] dark:hover:text-[#D4A347] hover:bg-slate-100 dark:hover:bg-slate-800/80 rounded-xl transition-colors cursor-pointer"
            >
              Sign In
            </button>
            <button
              onClick={onGoToRegister}
              className="px-4 py-2 bg-[#C6923B] hover:bg-[#B07B28] text-white text-xs font-mono font-bold rounded-xl shadow-md shadow-[#C6923B]/25 transition-all cursor-pointer flex items-center gap-1.5"
            >
              <span>Get Started</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>

        {/* Mobile Dropdown */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-white dark:bg-[#111827] border-b border-slate-200 dark:border-slate-800 px-4 py-4 space-y-3 font-mono text-xs font-bold">
            <a href="#capabilities" onClick={() => setMobileMenuOpen(false)} className="block py-1 text-slate-700 dark:text-slate-300">Capabilities</a>
            <a href="#workflow" onClick={() => setMobileMenuOpen(false)} className="block py-1 text-slate-700 dark:text-slate-300">Workflow</a>
            <a href="#architecture" onClick={() => setMobileMenuOpen(false)} className="block py-1 text-slate-700 dark:text-slate-300">Architecture</a>
            <a href="#pricing" onClick={() => setMobileMenuOpen(false)} className="block py-1 text-slate-700 dark:text-slate-300">Pricing</a>
            <a href="#faq" onClick={() => setMobileMenuOpen(false)} className="block py-1 text-slate-700 dark:text-slate-300">FAQ</a>
            <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex gap-2">
              <button onClick={onGoToLogin} className="flex-1 py-2 text-center bg-slate-100 dark:bg-slate-800 rounded-xl">Sign In</button>
              <button onClick={onGoToRegister} className="flex-1 py-2 text-center bg-[#C6923B] text-white rounded-xl">Get Started</button>
            </div>
          </div>
        )}
      </header>

      {/* ── 2. Hero Section with Live Telemetry Console ── */}
      <section className="relative pt-12 pb-16 sm:pt-20 sm:pb-24 overflow-hidden border-b border-slate-200 dark:border-slate-800/80">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-[#C6923B]/10 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12 relative z-10">
          
          <div className="max-w-3xl space-y-5">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#C6923B]/10 dark:bg-[#C6923B]/15 border border-[#C6923B]/30 text-[#C6923B] dark:text-[#E5B04E] text-xs font-mono font-bold">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>Aravanta CloudOS Control Plane</span>
              <span className="text-[10px] px-1.5 py-0.2 bg-[#C6923B]/20 rounded font-mono">v1.0 Production</span>
            </div>

            <h1 className="text-3xl sm:text-5xl font-black text-slate-900 dark:text-white tracking-tight leading-[1.12]">
              Manage infrastructure, deployments, and SRE operations from one control plane.
            </h1>

            <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 leading-relaxed max-w-2xl font-sans">
              A unified self-service platform for engineering teams to provision multi-cloud resources, execute zero-downtime GitOps rollouts, triage sub-second telemetry, and coordinate incident response.
            </p>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-2 font-mono text-xs">
              <button
                onClick={onGoToRegister}
                className="px-6 py-3.5 bg-[#C6923B] hover:bg-[#B07B28] text-white font-bold rounded-xl shadow-lg shadow-[#C6923B]/25 transition-all flex items-center justify-center gap-2 cursor-pointer group"
              >
                <span>Launch Operational Workspace</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </button>

              <button
                onClick={onGoToLogin}
                className="px-6 py-3.5 bg-white dark:bg-[#111827] hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200 font-bold rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer hover:border-[#C6923B]"
              >
                <span>Sign In to Console</span>
              </button>
            </div>

            <div className="flex items-center gap-6 pt-3 text-[11px] font-mono text-slate-500 dark:text-slate-400">
              <span className="flex items-center gap-1.5"><Check className="w-3.5 h-3.5 text-emerald-500" /> Multi-Cloud Inventory</span>
              <span className="flex items-center gap-1.5"><Check className="w-3.5 h-3.5 text-emerald-500" /> Automated Rollbacks</span>
              <span className="flex items-center gap-1.5"><Check className="w-3.5 h-3.5 text-emerald-500" /> 4-Tier Zero-Trust RBAC</span>
            </div>
          </div>

          {/* ── Interactive Hero Console Mockup with Skeleton Loader ── */}
          <div className="bg-[#0B0F17] border border-slate-800 rounded-2xl p-4 sm:p-6 shadow-2xl space-y-4 font-mono text-xs text-white">
            
            {/* Control Deck Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800/80 pb-3">
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-full bg-rose-500/80" />
                  <span className="w-3 h-3 rounded-full bg-amber-500/80" />
                  <span className="w-3 h-3 rounded-full bg-emerald-500/80" />
                </div>
                <span className="text-slate-400 text-[11px]">aravanta-control-plane // fleet-mumbai-az1</span>
              </div>

              {/* Console Tab Selectors & Live Reload Button */}
              <div className="flex items-center gap-2 flex-wrap">
                <div className="bg-slate-900 rounded-lg p-0.5 border border-slate-800 flex items-center text-[10px]">
                  <button
                    onClick={() => setActiveHeroTab('workloads')}
                    className={`px-2.5 py-1 rounded transition-colors ${activeHeroTab === 'workloads' ? 'bg-[#C6923B] text-white font-bold' : 'text-slate-400 hover:text-white'}`}
                  >
                    Workloads
                  </button>
                  <button
                    onClick={() => setActiveHeroTab('canary')}
                    className={`px-2.5 py-1 rounded transition-colors ${activeHeroTab === 'canary' ? 'bg-[#C6923B] text-white font-bold' : 'text-slate-400 hover:text-white'}`}
                  >
                    Canary Rollout
                  </button>
                  <button
                    onClick={() => setActiveHeroTab('alerts')}
                    className={`px-2.5 py-1 rounded transition-colors ${activeHeroTab === 'alerts' ? 'bg-[#C6923B] text-white font-bold' : 'text-slate-400 hover:text-white'}`}
                  >
                    Alertmanager
                  </button>
                  <button
                    onClick={() => setActiveHeroTab('finops')}
                    className={`px-2.5 py-1 rounded transition-colors ${activeHeroTab === 'finops' ? 'bg-[#C6923B] text-white font-bold' : 'text-slate-400 hover:text-white'}`}
                  >
                    FinOps
                  </button>
                </div>

                <button
                  onClick={triggerTelemetryRefresh}
                  disabled={isTelemetryLoading}
                  className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-400 hover:text-[#C6923B] transition-colors cursor-pointer"
                  title="Reload Live Telemetry Stream"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isTelemetryLoading ? 'animate-spin text-[#C6923B]' : ''}`} />
                </button>
              </div>
            </div>

            {/* Quick KPI Metric Strip */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              {isTelemetryLoading ? (
                // Skeleton Loaders for KPIs
                [...Array(4)].map((_, i) => (
                  <div key={i} className="p-3 bg-slate-900/60 rounded-xl border border-slate-800 space-y-2 animate-pulse">
                    <div className="h-3 w-20 bg-slate-800 rounded" />
                    <div className="h-6 w-28 bg-slate-800 rounded" />
                    <div className="h-2.5 w-24 bg-slate-800 rounded" />
                  </div>
                ))
              ) : (
                <>
                  <div className="p-3 bg-slate-900/60 rounded-xl border border-slate-800">
                    <span className="text-[10px] text-slate-400 uppercase font-bold">Active Fleet</span>
                    <p className="text-xl font-black text-white mt-1">5 Microservices</p>
                    <p className="text-[10px] text-emerald-400 mt-0.5">14 active pods running</p>
                  </div>

                  <div className="p-3 bg-slate-900/60 rounded-xl border border-slate-800">
                    <span className="text-[10px] text-slate-400 uppercase font-bold">P95 HTTP Latency</span>
                    <p className="text-xl font-black text-emerald-400 mt-1">38.5 ms</p>
                    <p className="text-[10px] text-slate-400 mt-0.5">SLO Target: &lt; 200ms</p>
                  </div>

                  <div className="p-3 bg-slate-900/60 rounded-xl border border-slate-800">
                    <span className="text-[10px] text-slate-400 uppercase font-bold">GitOps Deployments</span>
                    <p className="text-xl font-black text-[#C6923B] dark:text-[#E5B04E] mt-1">v2.4.1 Production</p>
                    <p className="text-[10px] text-slate-400 mt-0.5">Canary gate healthy</p>
                  </div>

                  <div className="p-3 bg-slate-900/60 rounded-xl border border-slate-800">
                    <span className="text-[10px] text-slate-400 uppercase font-bold">Security Posture</span>
                    <p className="text-xl font-black text-purple-400 mt-1">Zero-Trust</p>
                    <p className="text-[10px] text-slate-400 mt-0.5">TOTP MFA Enforced</p>
                  </div>
                </>
              )}
            </div>

            {/* Dynamic Interactive Body Section */}
            <div className="p-4 bg-slate-950/70 rounded-xl border border-slate-800/80">
              {isTelemetryLoading ? (
                // Skeleton Loader for Table / Content
                <div className="space-y-3 py-2 animate-pulse">
                  <div className="h-4 w-full bg-slate-900 rounded" />
                  <div className="h-4 w-5/6 bg-slate-900 rounded" />
                  <div className="h-4 w-4/6 bg-slate-900 rounded" />
                  <div className="h-4 w-full bg-slate-900 rounded" />
                </div>
              ) : activeHeroTab === 'workloads' ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-slate-800 text-slate-400 font-bold text-[11px]">
                        <th className="py-2 px-3">Service Name</th>
                        <th className="py-2 px-3">Version</th>
                        <th className="py-2 px-3">Pods</th>
                        <th className="py-2 px-3">P95 Latency</th>
                        <th className="py-2 px-3">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60 text-[11px]">
                      <tr>
                        <td className="py-2.5 px-3 font-bold text-white flex items-center gap-1.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" /> api-gateway
                        </td>
                        <td className="py-2.5 px-3 text-slate-300">v2.4.1</td>
                        <td className="py-2.5 px-3 text-slate-300">4 Replicas</td>
                        <td className="py-2.5 px-3 text-emerald-400">38.5ms</td>
                        <td className="py-2.5 px-3"><span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 font-bold text-[10px]">HEALTHY</span></td>
                      </tr>
                      <tr>
                        <td className="py-2.5 px-3 font-bold text-white flex items-center gap-1.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" /> auth-service
                        </td>
                        <td className="py-2.5 px-3 text-slate-300">v1.9.0</td>
                        <td className="py-2.5 px-3 text-slate-300">3 Replicas</td>
                        <td className="py-2.5 px-3 text-emerald-400">24.1ms</td>
                        <td className="py-2.5 px-3"><span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 font-bold text-[10px]">HEALTHY</span></td>
                      </tr>
                      <tr>
                        <td className="py-2.5 px-3 font-bold text-white flex items-center gap-1.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" /> web-console
                        </td>
                        <td className="py-2.5 px-3 text-slate-300">v1.5.2</td>
                        <td className="py-2.5 px-3 text-slate-300">3 Replicas</td>
                        <td className="py-2.5 px-3 text-emerald-400">18.2ms</td>
                        <td className="py-2.5 px-3"><span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 font-bold text-[10px]">HEALTHY</span></td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              ) : activeHeroTab === 'canary' ? (
                <div className="space-y-3 text-[11px]">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-white">Canary Release Strategy (25% Split)</span>
                    <span className="text-[#C6923B] font-bold">Target Version: v2.4.2</span>
                  </div>
                  <div className="w-full bg-slate-900 rounded-full h-3 border border-slate-800 flex overflow-hidden">
                    <div className="bg-emerald-500 h-full" style={{ width: '75%' }} title="Baseline v2.4.1 (75%)" />
                    <div className="bg-[#C6923B] h-full animate-pulse" style={{ width: '25%' }} title="Canary v2.4.2 (25%)" />
                  </div>
                  <div className="flex justify-between text-slate-400 text-[10px]">
                    <span>Baseline (v2.4.1): 75% traffic (0.00% 5xx errors)</span>
                    <span className="text-[#C6923B]">Canary (v2.4.2): 25% traffic (32.1ms latency)</span>
                  </div>
                </div>
              ) : activeHeroTab === 'alerts' ? (
                <div className="space-y-2 text-[11px]">
                  <div className="flex items-center justify-between p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-300">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
                      <strong>HighMemoryUsage</strong> • pod-auth-service-67b
                    </div>
                    <span className="text-[10px] font-bold bg-amber-500/20 px-2 py-0.5 rounded">ACKNOWLEDGED</span>
                  </div>
                  <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-400">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-emerald-400" />
                      <strong>TLSExpirationCheck</strong> • *.aravanta.com
                    </div>
                    <span className="text-[10px] font-bold text-emerald-400">VALID (84 DAYS)</span>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-3 gap-3 text-center text-[11px]">
                  <div className="p-2.5 bg-slate-900/60 rounded-lg border border-slate-800">
                    <span className="text-slate-400 text-[10px]">Monthly Compute</span>
                    <p className="text-sm font-bold text-white mt-0.5">₹1,840.00</p>
                  </div>
                  <div className="p-2.5 bg-slate-900/60 rounded-lg border border-slate-800">
                    <span className="text-slate-400 text-[10px]">Kubernetes Fleet</span>
                    <p className="text-sm font-bold text-white mt-0.5">₹650.00</p>
                  </div>
                  <div className="p-2.5 bg-slate-900/60 rounded-lg border border-slate-800">
                    <span className="text-slate-400 text-[10px]">Storage & Egress</span>
                    <p className="text-sm font-bold text-[#C6923B] mt-0.5">₹320.00</p>
                  </div>
                </div>
              )}
            </div>

            {/* Terminal Status Footer */}
            <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1">
              <span className="flex items-center gap-1.5">
                <Terminal className="w-3 h-3 text-[#C6923B]" /> CLI connected: <code>agy fleet status</code>
              </span>
              <span>Region: ap-south-1 (Mumbai)</span>
            </div>
          </div>
        </div>
      </section>

      {/* ── 3. Core Capabilities Section ── */}
      <section id="capabilities" className="py-16 sm:py-24 border-b border-slate-200 dark:border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          <div className="space-y-3 max-w-2xl">
            <span className="text-xs font-mono font-bold uppercase text-[#C6923B] dark:text-[#E5B04E] tracking-wider">Product Capabilities</span>
            <h2 className="text-2xl sm:text-4xl font-black text-slate-900 dark:text-white tracking-tight">
              Everything your team needs to operate production cloud services.
            </h2>
            <p className="text-sm text-slate-600 dark:text-slate-300">
              Eliminate fragmented dashboards with a unified operations plane designed for day-2 cloud management.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 font-mono text-xs">
            <div className="p-6 bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm space-y-3 hover:border-[#C6923B]/50 transition-colors">
              <div className="w-10 h-10 rounded-xl bg-[#C6923B]/15 text-[#C6923B] dark:text-[#E5B04E] flex items-center justify-center">
                <Server className="w-5 h-5" />
              </div>
              <h3 className="text-base font-black text-slate-900 dark:text-white">Multi-Cloud Inventory</h3>
              <p className="text-slate-600 dark:text-slate-300 font-sans text-xs leading-relaxed">
                Single pane of glass across compute VMs, Kubernetes clusters, managed databases, and object storage buckets with state filters and lifecycle actions.
              </p>
            </div>

            <div className="p-6 bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm space-y-3 hover:border-[#C6923B]/50 transition-colors">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                <GitBranch className="w-5 h-5" />
              </div>
              <h3 className="text-base font-black text-slate-900 dark:text-white">GitOps Deployments</h3>
              <p className="text-slate-600 dark:text-slate-300 font-sans text-xs leading-relaxed">
                Release pipelines supporting RollingUpdate, 25% Canary verification gates, and BlueGreen cutovers with automatic pre-flight scans and 1-click rollback.
              </p>
            </div>

            <div className="p-6 bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm space-y-3 hover:border-[#C6923B]/50 transition-colors">
              <div className="w-10 h-10 rounded-xl bg-purple-50 dark:bg-purple-500/15 text-purple-600 dark:text-purple-400 flex items-center justify-center">
                <Activity className="w-5 h-5" />
              </div>
              <h3 className="text-base font-black text-slate-900 dark:text-white">SRE Telemetry & Alerts</h3>
              <p className="text-slate-600 dark:text-slate-300 font-sans text-xs leading-relaxed">
                Multi-resolution time-series monitoring, P95 latency distributions, stdout/stderr live log explorer, and Alertmanager triage with acknowledge and mute actions.
              </p>
            </div>

            <div className="p-6 bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm space-y-3 hover:border-[#C6923B]/50 transition-colors">
              <div className="w-10 h-10 rounded-xl bg-rose-50 dark:bg-rose-500/15 text-rose-600 dark:text-rose-400 flex items-center justify-center">
                <ShieldAlert className="w-5 h-5" />
              </div>
              <h3 className="text-base font-black text-slate-900 dark:text-white">Incident Command Center</h3>
              <p className="text-slate-600 dark:text-slate-300 font-sans text-xs leading-relaxed">
                Structured 4-stage incident lifecycle (Detected → Investigating → Mitigating → Resolved) with war-room timeline recording, commander assignment, and RCA notes.
              </p>
            </div>

            <div className="p-6 bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm space-y-3 hover:border-[#C6923B]/50 transition-colors">
              <div className="w-10 h-10 rounded-xl bg-[#C6923B]/15 text-[#C6923B] dark:text-[#E5B04E] flex items-center justify-center">
                <Zap className="w-5 h-5" />
              </div>
              <h3 className="text-base font-black text-slate-900 dark:text-white">Self-Healing Automation</h3>
              <p className="text-slate-600 dark:text-slate-300 font-sans text-xs leading-relaxed">
                Operational runbooks with automated step sequences, schedule triggers, manual "Run Now" execution, and toil reduction metrics (84.2 hrs/mo saved).
              </p>
            </div>

            <div className="p-6 bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm space-y-3 hover:border-[#C6923B]/50 transition-colors">
              <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <h3 className="text-base font-black text-slate-900 dark:text-white">4-Tier RBAC & Governance</h3>
              <p className="text-slate-600 dark:text-slate-300 font-sans text-xs leading-relaxed">
                Granular role enforcement (Admin, Operator, Developer, Viewer), TOTP multi-factor authentication, active session revocation, and immutable audit trails.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── 4. Architecture & Cloud Resources Explorer ── */}
      <section id="architecture" className="py-16 sm:py-24 bg-slate-50/50 dark:bg-[#070D18] border-b border-slate-200 dark:border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          <div className="text-center max-w-2xl mx-auto space-y-3">
            <span className="text-xs font-mono font-bold uppercase text-[#C6923B] dark:text-[#E5B04E] tracking-wider">Cloud Resources</span>
            <h2 className="text-2xl sm:text-4xl font-black text-slate-900 dark:text-white tracking-tight">
              First-class primitives for every cloud layer.
            </h2>
            <p className="text-sm text-slate-600 dark:text-slate-300 font-sans">
              Deploy and manage infrastructure without configuring complex multi-console permissions.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 font-mono text-xs">
            <div className="p-6 bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm space-y-3">
              <Cpu className="w-6 h-6 text-[#C6923B]" />
              <h3 className="font-bold text-sm text-slate-900 dark:text-white">Elastic Compute VMs</h3>
              <p className="text-slate-500 font-sans text-[11px] leading-relaxed">
                Provision AMD EPYC and ARM Neoverse vCPUs with sub-second attachable NVMe block storage volumes.
              </p>
            </div>

            <div className="p-6 bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm space-y-3">
              <Layers className="w-6 h-6 text-purple-400" />
              <h3 className="font-bold text-sm text-slate-900 dark:text-white">Managed Kubernetes</h3>
              <p className="text-slate-500 font-sans text-[11px] leading-relaxed">
                Production-ready EKS & GKE clusters with automated horizontal pod autoscaling and CNI networking.
              </p>
            </div>

            <div className="p-6 bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm space-y-3">
              <Database className="w-6 h-6 text-emerald-400" />
              <h3 className="font-bold text-sm text-slate-900 dark:text-white">Managed Databases</h3>
              <p className="text-slate-500 font-sans text-[11px] leading-relaxed">
                Replicated PostgreSQL, MySQL, and in-memory Redis clusters with automated WAL archiving snapshots.
              </p>
            </div>

            <div className="p-6 bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm space-y-3">
              <HardDrive className="w-6 h-6 text-blue-400" />
              <h3 className="font-bold text-sm text-slate-900 dark:text-white">S3 Object Storage</h3>
              <p className="text-slate-500 font-sans text-[11px] leading-relaxed">
                High-throughput S3-compatible buckets with automatic lifecycle tiering and TLS 1.3 strict transport.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── 5. Operational Workflow Section ── */}
      <section id="workflow" className="py-16 sm:py-24 border-b border-slate-200 dark:border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
          <div className="max-w-2xl space-y-3">
            <span className="text-xs font-mono font-bold uppercase text-[#C6923B] dark:text-[#E5B04E] tracking-wider">Lifecycle Workflow</span>
            <h2 className="text-2xl sm:text-4xl font-black text-slate-900 dark:text-white tracking-tight">
              A continuous loop from provisioning to recovery.
            </h2>
            <p className="text-sm text-slate-600 dark:text-slate-300 font-sans">
              Click any stage below to inspect the operational procedures and safety guardrails.
            </p>
          </div>

          {/* Workflow Step Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2">
            {workflowSteps.map((step, idx) => (
              <button
                key={step.step}
                onClick={() => setActiveWorkflowStep(idx)}
                className={`p-3 rounded-xl text-left font-mono transition-all cursor-pointer border ${
                  activeWorkflowStep === idx
                    ? 'bg-[#C6923B] text-white border-[#C6923B] shadow-md shadow-[#C6923B]/25'
                    : 'bg-white dark:bg-[#111827] text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:border-[#C6923B]/40'
                }`}
              >
                <span className={`text-[10px] font-bold block ${activeWorkflowStep === idx ? 'text-amber-100' : 'text-slate-400'}`}>
                  STAGE {step.step}
                </span>
                <span className="text-sm font-black block mt-0.5">{step.name}</span>
              </button>
            ))}
          </div>

          {/* Active Step Showcase Card */}
          <div className="p-6 sm:p-8 rounded-2xl bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="space-y-3 max-w-2xl font-mono">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-1 rounded-lg bg-[#C6923B]/10 dark:bg-[#C6923B]/20 text-[#C6923B] dark:text-[#E5B04E] font-bold text-xs border border-[#C6923B]/30">
                  STAGE {workflowSteps[activeWorkflowStep].step}: {workflowSteps[activeWorkflowStep].name.toUpperCase()}
                </span>
              </div>
              <h3 className="text-xl font-black text-slate-900 dark:text-white">
                {workflowSteps[activeWorkflowStep].name} Stage Operational Controls
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-300 font-sans leading-relaxed">
                {workflowSteps[activeWorkflowStep].desc}
              </p>
            </div>

            <button
              onClick={onGoToRegister}
              className="px-5 py-3 bg-[#C6923B] hover:bg-[#B07B28] text-white font-mono text-xs font-bold rounded-xl shadow-md shadow-[#C6923B]/25 transition-all cursor-pointer shrink-0"
            >
              Explore {workflowSteps[activeWorkflowStep].name} in Workspace →
            </button>
          </div>
        </div>
      </section>

      {/* ── 6. Honest Pricing Section ── */}
      <section id="pricing" className="py-16 sm:py-24 border-b border-slate-200 dark:border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          <div className="text-center max-w-2xl mx-auto space-y-3">
            <span className="text-xs font-mono font-bold uppercase text-[#C6923B] dark:text-[#E5B04E] tracking-wider">Transparent FinOps</span>
            <h2 className="text-2xl sm:text-4xl font-black text-slate-900 dark:text-white tracking-tight">
              Predictable cloud operations pricing in INR (₹).
            </h2>
            <p className="text-sm text-slate-600 dark:text-slate-300">
              Clear capacity quotas with zero surprise overage fees.
            </p>

            {/* Billing Interval Toggle */}
            <div className="inline-flex items-center gap-2 p-1 bg-slate-100 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-mono font-bold mt-2">
              <button
                onClick={() => setBillingPeriod('monthly')}
                className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${billingPeriod === 'monthly' ? 'bg-white dark:bg-[#111827] text-slate-900 dark:text-white shadow-sm' : 'text-slate-500'}`}
              >
                Monthly
              </button>
              <button
                onClick={() => setBillingPeriod('annual')}
                className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 ${billingPeriod === 'annual' ? 'bg-[#C6923B] text-white shadow-sm' : 'text-slate-500'}`}
              >
                <span>Annual</span>
                <span className="text-[10px] px-1.5 py-0.2 bg-white/20 rounded">SAVE 20%</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 font-mono text-xs max-w-5xl mx-auto">
            {/* Developer Tier */}
            <div className="p-6 bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm space-y-6 flex flex-col justify-between hover:border-[#C6923B]/40 transition-colors">
              <div className="space-y-4">
                <div>
                  <span className="text-[10px] text-slate-400 font-bold uppercase">Starter Tier</span>
                  <h3 className="text-lg font-black text-slate-900 dark:text-white mt-1">Developer Cloud</h3>
                  <p className="text-slate-500 font-sans text-xs mt-1">For engineers building standalone projects and testing pipelines.</p>
                </div>

                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-black text-slate-900 dark:text-white">
                    {billingPeriod === 'annual' ? '₹399' : '₹499'}
                  </span>
                  <span className="text-slate-500">/ month</span>
                </div>

                <div className="space-y-2.5 pt-2 border-t border-slate-100 dark:border-slate-800 text-[11px]">
                  <p className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-emerald-500" /> 8 vCPUs / 16GB Memory</p>
                  <p className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-emerald-500" /> 500GB SSD NVMe Storage</p>
                  <p className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-emerald-500" /> 50 Deployments / month</p>
                  <p className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-emerald-500" /> 7-Day Log & Telemetry Retention</p>
                </div>
              </div>

              <button
                onClick={onGoToRegister}
                className="w-full py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-900 dark:text-white font-bold rounded-xl transition-colors cursor-pointer"
              >
                Get Started
              </button>
            </div>

            {/* Team Tier (Recommended) */}
            <div className="p-6 bg-white dark:bg-[#111827] border-2 border-[#C6923B] rounded-2xl shadow-xl space-y-6 flex flex-col justify-between relative">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 bg-[#C6923B] text-white rounded-full text-[10px] font-bold uppercase shadow-md">
                Most Popular
              </div>

              <div className="space-y-4">
                <div>
                  <span className="text-[10px] text-[#C6923B] dark:text-[#E5B04E] font-bold uppercase">Operations Standard</span>
                  <h3 className="text-lg font-black text-slate-900 dark:text-white mt-1">Team Cloud Operations</h3>
                  <p className="text-slate-500 font-sans text-xs mt-1">For growing teams running production workloads with high availability.</p>
                </div>

                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-black text-[#C6923B] dark:text-[#E5B04E]">
                    {billingPeriod === 'annual' ? '₹1,999' : '₹2,499'}
                  </span>
                  <span className="text-slate-500">/ month</span>
                </div>

                <div className="space-y-2.5 pt-2 border-t border-slate-100 dark:border-slate-800 text-[11px]">
                  <p className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-emerald-500" /> 64 vCPUs / 128GB Memory</p>
                  <p className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-emerald-500" /> 5,000GB S3 & Database Storage</p>
                  <p className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-emerald-500" /> Unlimited Canary & Rolling Deployments</p>
                  <p className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-emerald-500" /> 30-Day Metric & Log Retention</p>
                  <p className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-emerald-500" /> Incident War-Room Command Center</p>
                </div>
              </div>

              <button
                onClick={onGoToRegister}
                className="w-full py-2.5 bg-[#C6923B] hover:bg-[#B07B28] text-white font-bold rounded-xl shadow-md shadow-[#C6923B]/25 transition-colors cursor-pointer"
              >
                Launch Team Workspace
              </button>
            </div>

            {/* Enterprise Tier */}
            <div className="p-6 bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm space-y-6 flex flex-col justify-between hover:border-[#C6923B]/40 transition-colors">
              <div className="space-y-4">
                <div>
                  <span className="text-[10px] text-purple-400 font-bold uppercase">Dedicated Control Plane</span>
                  <h3 className="text-lg font-black text-slate-900 dark:text-white mt-1">Enterprise Platform</h3>
                  <p className="text-slate-500 font-sans text-xs mt-1">For organizations requiring customized compliance, SSO, and dedicated VPCs.</p>
                </div>

                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-black text-slate-900 dark:text-white">Custom</span>
                  <span className="text-slate-500">/ SLA</span>
                </div>

                <div className="space-y-2.5 pt-2 border-t border-slate-100 dark:border-slate-800 text-[11px]">
                  <p className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-emerald-500" /> Custom Dedicated Cluster Capacity</p>
                  <p className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-emerald-500" /> 365-Day SOC2 Immutable Audit Trail</p>
                  <p className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-emerald-500" /> Dedicated SAML 2.0 / Okta SSO</p>
                  <p className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-emerald-500" /> 99.99% Financial Uptime SLA</p>
                </div>
              </div>

              <button
                onClick={onGoToRegister}
                className="w-full py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-900 dark:text-white font-bold rounded-xl transition-colors cursor-pointer"
              >
                Contact Platform Engineering
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ── 7. Frequently Asked Questions (FAQ Accordion) ── */}
      <section id="faq" className="py-16 sm:py-24 bg-slate-50/50 dark:bg-[#070D18] border-b border-slate-200 dark:border-slate-800">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
          <div className="text-center space-y-3">
            <span className="text-xs font-mono font-bold uppercase text-[#C6923B] dark:text-[#E5B04E] tracking-wider">Frequently Asked Questions</span>
            <h2 className="text-2xl sm:text-4xl font-black text-slate-900 dark:text-white tracking-tight">
              Operational Safety & Architecture FAQs
            </h2>
          </div>

          <div className="space-y-3 font-mono text-xs">
            {faqs.map((faq, index) => (
              <div 
                key={index}
                className="bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-2 cursor-pointer transition-colors"
                onClick={() => setOpenFaqIndex(openFaqIndex === index ? null : index)}
              >
                <div className="flex items-center justify-between gap-4 font-bold text-slate-900 dark:text-white text-sm font-sans">
                  <span>{faq.q}</span>
                  {openFaqIndex === index ? (
                    <ChevronUp className="w-4 h-4 text-[#C6923B] shrink-0" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />
                  )}
                </div>
                {openFaqIndex === index && (
                  <p className="text-slate-600 dark:text-slate-300 font-sans text-xs leading-relaxed pt-2 border-t border-slate-100 dark:border-slate-800 animate-fadeIn">
                    {faq.a}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── 8. High-Impact Final CTA Section ── */}
      <section className="py-20 relative overflow-hidden bg-gradient-to-b from-transparent via-[#C6923B]/5 to-transparent">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="relative p-8 sm:p-12 rounded-3xl bg-[#0B0F17] border border-[#C6923B]/30 shadow-2xl shadow-[#C6923B]/10 overflow-hidden text-center space-y-6">
            
            {/* Ambient Background Glow */}
            <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-96 h-96 bg-[#C6923B]/20 blur-3xl rounded-full pointer-events-none" />

            <div className="relative space-y-3 max-w-2xl mx-auto">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#C6923B]/15 border border-[#C6923B]/30 text-[#C6923B] dark:text-[#E5B04E] text-[11px] font-mono font-bold uppercase tracking-wider">
                <ShieldCheck className="w-3.5 h-3.5" /> Ready for Production Day-2 Ops
              </span>
              <h2 className="text-2xl sm:text-4xl font-black text-white tracking-tight">
                Streamline your entire cloud infrastructure today.
              </h2>
              <p className="text-sm text-slate-300 font-sans leading-relaxed">
                Experience seamless microservice scaling, canary release verification, and incident management from a single self-service control plane.
              </p>
            </div>

            <div className="relative flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
              <button
                onClick={onGoToRegister}
                className="w-full sm:w-auto px-8 py-3.5 bg-[#C6923B] hover:bg-[#B07B28] text-white font-bold rounded-xl shadow-lg shadow-[#C6923B]/30 transition-all transform hover:-translate-y-0.5 flex items-center justify-center gap-2 cursor-pointer text-sm"
              >
                <span>Launch Operational Workspace</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <a
                href="https://arv-backend.vercel.app/docs"
                target="_blank"
                rel="noreferrer"
                className="w-full sm:w-auto px-6 py-3.5 bg-slate-800/80 hover:bg-slate-700 text-slate-200 font-bold rounded-xl border border-slate-700 transition-colors flex items-center justify-center gap-2 text-sm"
              >
                <Terminal className="w-4 h-4 text-[#C6923B]" />
                <span>Interactive Swagger API</span>
              </a>
            </div>

            {/* Trust Points */}
            <div className="relative pt-4 flex flex-wrap items-center justify-center gap-6 text-[11px] font-mono text-slate-400">
              <span className="flex items-center gap-1.5">
                <Check className="w-3.5 h-3.5 text-[#C6923B]" /> Instant Provisioning
              </span>
              <span className="flex items-center gap-1.5">
                <Check className="w-3.5 h-3.5 text-[#C6923B]" /> TOTP MFA Enabled
              </span>
              <span className="flex items-center gap-1.5">
                <Check className="w-3.5 h-3.5 text-[#C6923B]" /> 10-Day Full Access Trial
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* ── 9. Global Technical Footer ── */}
      <footer className="py-12 bg-white dark:bg-[#07111E] border-t border-slate-200 dark:border-slate-800 font-mono text-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div>
              <Logo size="md" />
              <p className="text-slate-500 font-sans text-xs mt-2 max-w-sm">
                Aravanta CloudOS — Self-Service Cloud Operations & Reliability Platform.
              </p>
            </div>

            <div className="flex items-center gap-6 text-slate-600 dark:text-slate-400 font-bold">
              <a href="https://arv-backend.vercel.app/docs" target="_blank" rel="noreferrer" className="hover:text-[#C6923B]">Swagger API</a>
              <a href="https://arv-backend.vercel.app/metrics" target="_blank" rel="noreferrer" className="hover:text-[#C6923B]">Prometheus</a>
              <a href="https://github.com/yashbaviskar15/acos" target="_blank" rel="noreferrer" className="hover:text-[#C6923B]">GitHub</a>
            </div>
          </div>

          <div className="pt-6 border-t border-slate-100 dark:border-slate-800/80 flex flex-col sm:flex-row items-center justify-between gap-3 text-slate-400 text-[11px]">
            <span>© 2026 Aravanta CloudOS. Developed by Yash Baviskar. MIT License.</span>
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>Control Plane Status: 99.98% Operational (Region: ap-south-1)</span>
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
};
