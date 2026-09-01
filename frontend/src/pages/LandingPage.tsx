import React, { useState } from 'react';
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
  X 
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

  const workflowSteps = [
    { step: '01', name: 'Plan', desc: 'Define declarative infrastructure specs and container image manifests with GitOps versioning.' },
    { step: '02', name: 'Provision', desc: 'Spin up high-performance compute instances, managed Kubernetes worker nodes, and replicated databases in seconds.' },
    { step: '03', name: 'Deploy', desc: 'Execute zero-downtime rolling updates, 25% canary traffic tests, or instant blue/green cutovers with automated rollback.' },
    { step: '04', name: 'Monitor', desc: 'Stream real-time multi-resolution telemetry, P95 latency profiles, and container resource saturation gauges.' },
    { step: '05', name: 'Detect', desc: 'Evaluate firing Alertmanager rules and trigger automated on-call notifications before SLO thresholds breach.' },
    { step: '06', name: 'Respond', desc: 'Engage incident command war-rooms, coordinate remediation timelines, and post timestamped operational updates.' },
    { step: '07', name: 'Recover', desc: 'Trigger self-healing automation runbooks or restore point-in-time database snapshots with 1-click execution.' },
  ];

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-[#0A1628] text-slate-900 dark:text-slate-100 font-sans transition-colors selection:bg-blue-600 selection:text-white">
      
      {/* ── 1. Top Global Navigation Bar ── */}
      <header className="sticky top-0 z-50 bg-white/90 dark:bg-[#0F2038]/90 backdrop-blur-md border-b border-slate-200 dark:border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-8">
            <Logo size="md" />
            
            <nav className="hidden md:flex items-center gap-6 text-xs font-mono font-bold text-slate-600 dark:text-slate-300">
              <a href="#capabilities" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">Capabilities</a>
              <a href="#workflow" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">Workflow</a>
              <a href="#operations" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">Operations</a>
              <a href="#observability" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">Observability</a>
              <a href="#security" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">Security</a>
              <a href="#pricing" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">Pricing</a>
            </nav>
          </div>

          <div className="hidden sm:flex items-center gap-3">
            <button
              onClick={onGoToLogin}
              className="px-4 py-2 text-xs font-mono font-bold text-slate-700 dark:text-slate-200 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-slate-100 dark:hover:bg-slate-800/80 rounded-xl transition-colors cursor-pointer"
            >
              Sign In
            </button>
            <button
              onClick={onGoToRegister}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-mono font-bold rounded-xl shadow-md shadow-blue-600/20 transition-all cursor-pointer"
            >
              Get Started
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
          <div className="md:hidden bg-white dark:bg-[#0F2038] border-b border-slate-200 dark:border-slate-800 px-4 py-4 space-y-3 font-mono text-xs font-bold">
            <a href="#capabilities" onClick={() => setMobileMenuOpen(false)} className="block py-1 text-slate-700 dark:text-slate-300">Capabilities</a>
            <a href="#workflow" onClick={() => setMobileMenuOpen(false)} className="block py-1 text-slate-700 dark:text-slate-300">Workflow</a>
            <a href="#operations" onClick={() => setMobileMenuOpen(false)} className="block py-1 text-slate-700 dark:text-slate-300">Operations</a>
            <a href="#observability" onClick={() => setMobileMenuOpen(false)} className="block py-1 text-slate-700 dark:text-slate-300">Observability</a>
            <a href="#security" onClick={() => setMobileMenuOpen(false)} className="block py-1 text-slate-700 dark:text-slate-300">Security</a>
            <a href="#pricing" onClick={() => setMobileMenuOpen(false)} className="block py-1 text-slate-700 dark:text-slate-300">Pricing</a>
            <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex gap-2">
              <button onClick={onGoToLogin} className="flex-1 py-2 text-center bg-slate-100 dark:bg-slate-800 rounded-xl">Sign In</button>
              <button onClick={onGoToRegister} className="flex-1 py-2 text-center bg-blue-600 text-white rounded-xl">Get Started</button>
            </div>
          </div>
        )}
      </header>

      {/* ── 2. Hero Section ── */}
      <section className="relative pt-12 pb-16 sm:pt-20 sm:pb-24 overflow-hidden border-b border-slate-200 dark:border-slate-800/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          
          <div className="max-w-3xl space-y-5">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-lg bg-blue-50 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/20 text-blue-700 dark:text-blue-300 text-xs font-mono font-bold">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>Aravanta CloudOS Control Plane</span>
            </div>

            <h1 className="text-3xl sm:text-5xl font-black text-slate-900 dark:text-white tracking-tight leading-[1.12]">
              Manage infrastructure, deployments and operations from one control plane.
            </h1>

            <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 leading-relaxed max-w-2xl font-sans">
              A unified self-service platform for engineering teams to provision multi-cloud resources, run GitOps deployment pipelines, triage SRE telemetry, and coordinate incident response.
            </p>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-2 font-mono text-xs">
              <button
                onClick={onGoToRegister}
                className="px-6 py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-lg shadow-blue-600/25 transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>Launch Operational Workspace</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <button
                onClick={onGoToLogin}
                className="px-6 py-3.5 bg-white dark:bg-[#0F2038] hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200 font-bold rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>Sign In to Console</span>
              </button>
            </div>

            <div className="flex items-center gap-6 pt-3 text-[11px] font-mono text-slate-500 dark:text-slate-400">
              <span className="flex items-center gap-1.5"><Check className="w-3.5 h-3.5 text-emerald-500" /> Multi-Cloud Inventory</span>
              <span className="flex items-center gap-1.5"><Check className="w-3.5 h-3.5 text-emerald-500" /> Automated Rollbacks</span>
              <span className="flex items-center gap-1.5"><Check className="w-3.5 h-3.5 text-emerald-500" /> 4-Tier RBAC</span>
            </div>
          </div>

          {/* Interactive Hero Console Preview Mockup */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-6 shadow-2xl space-y-4 font-mono text-xs text-white">
            {/* Header bar */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-rose-500/80" />
                <span className="w-3 h-3 rounded-full bg-amber-500/80" />
                <span className="w-3 h-3 rounded-full bg-emerald-500/80" />
                <span className="text-slate-400 text-[11px] ml-2">aravanta-control-plane // production-mumbai</span>
              </div>
              <span className="px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 text-[10px] font-bold">
                CLUSTER OPERATIONAL (99.98%)
              </span>
            </div>

            {/* Quick KPI Strip */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              <div className="p-3 bg-slate-800/60 rounded-xl border border-slate-800">
                <span className="text-[10px] text-slate-400 uppercase font-bold">Total Workloads</span>
                <p className="text-xl font-black text-white mt-1">5 Microservices</p>
                <p className="text-[10px] text-emerald-400 mt-0.5">14 active pods running</p>
              </div>

              <div className="p-3 bg-slate-800/60 rounded-xl border border-slate-800">
                <span className="text-[10px] text-slate-400 uppercase font-bold">P95 HTTP Latency</span>
                <p className="text-xl font-black text-emerald-400 mt-1">38.5 ms</p>
                <p className="text-[10px] text-slate-400 mt-0.5">Target: &lt; 200ms</p>
              </div>

              <div className="p-3 bg-slate-800/60 rounded-xl border border-slate-800">
                <span className="text-[10px] text-slate-400 uppercase font-bold">Active Deployments</span>
                <p className="text-xl font-black text-blue-400 mt-1">v2.4.1 Production</p>
                <p className="text-[10px] text-slate-400 mt-0.5">GitOps RollingUpdate</p>
              </div>

              <div className="p-3 bg-slate-800/60 rounded-xl border border-slate-800">
                <span className="text-[10px] text-slate-400 uppercase font-bold">Security Posture</span>
                <p className="text-xl font-black text-purple-400 mt-1">Zero Trust</p>
                <p className="text-[10px] text-slate-400 mt-0.5">MFA + HMAC Audit Trail</p>
              </div>
            </div>

            {/* Mini Workloads Table */}
            <div className="overflow-x-auto pt-2">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400 font-bold text-[11px]">
                    <th className="py-2 px-3">Service</th>
                    <th className="py-2 px-3">Version</th>
                    <th className="py-2 px-3">Replicas</th>
                    <th className="py-2 px-3">P95 Latency</th>
                    <th className="py-2 px-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 text-[11px]">
                  <tr>
                    <td className="py-2.5 px-3 font-bold text-white">api-gateway</td>
                    <td className="py-2.5 px-3 text-slate-300">v2.4.1</td>
                    <td className="py-2.5 px-3 text-slate-300">4 Pods</td>
                    <td className="py-2.5 px-3 text-emerald-400">38.5ms</td>
                    <td className="py-2.5 px-3"><span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 font-bold text-[10px]">HEALTHY</span></td>
                  </tr>
                  <tr>
                    <td className="py-2.5 px-3 font-bold text-white">auth-service</td>
                    <td className="py-2.5 px-3 text-slate-300">v1.9.0</td>
                    <td className="py-2.5 px-3 text-slate-300">3 Pods</td>
                    <td className="py-2.5 px-3 text-emerald-400">24.1ms</td>
                    <td className="py-2.5 px-3"><span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 font-bold text-[10px]">HEALTHY</span></td>
                  </tr>
                  <tr>
                    <td className="py-2.5 px-3 font-bold text-white">web-console</td>
                    <td className="py-2.5 px-3 text-slate-300">v1.5.2</td>
                    <td className="py-2.5 px-3 text-slate-300">3 Pods</td>
                    <td className="py-2.5 px-3 text-emerald-400">18.2ms</td>
                    <td className="py-2.5 px-3"><span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 font-bold text-[10px]">HEALTHY</span></td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </section>

      {/* ── 3. Core Capabilities Section ── */}
      <section id="capabilities" className="py-16 sm:py-24 border-b border-slate-200 dark:border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          <div className="space-y-3 max-w-2xl">
            <span className="text-xs font-mono font-bold uppercase text-blue-600 dark:text-blue-400 tracking-wider">Product Capabilities</span>
            <h2 className="text-2xl sm:text-4xl font-black text-slate-900 dark:text-white tracking-tight">
              Everything your team needs to operate services.
            </h2>
            <p className="text-sm text-slate-600 dark:text-slate-300">
              Eliminate disjointed dashboards with a unified operations plane designed for day-2 cloud management.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 font-mono text-xs">
            <div className="p-6 bg-white dark:bg-[#0F2038] border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm space-y-3">
              <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-500/15 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                <Server className="w-5 h-5" />
              </div>
              <h3 className="text-base font-black text-slate-900 dark:text-white">Multi-Cloud Inventory</h3>
              <p className="text-slate-600 dark:text-slate-300 font-sans text-xs leading-relaxed">
                Single pane of glass across compute VMs, Kubernetes clusters, managed databases, and object storage buckets with state filters and lifecycle actions.
              </p>
            </div>

            <div className="p-6 bg-white dark:bg-[#0F2038] border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm space-y-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                <GitBranch className="w-5 h-5" />
              </div>
              <h3 className="text-base font-black text-slate-900 dark:text-white">GitOps Deployments</h3>
              <p className="text-slate-600 dark:text-slate-300 font-sans text-xs leading-relaxed">
                Release pipelines supporting RollingUpdate, 25% Canary verification gates, and BlueGreen cutovers with automatic pre-flight scans and 1-click rollback.
              </p>
            </div>

            <div className="p-6 bg-white dark:bg-[#0F2038] border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm space-y-3">
              <div className="w-10 h-10 rounded-xl bg-purple-50 dark:bg-purple-500/15 text-purple-600 dark:text-purple-400 flex items-center justify-center">
                <Activity className="w-5 h-5" />
              </div>
              <h3 className="text-base font-black text-slate-900 dark:text-white">SRE Telemetry & Alerts</h3>
              <p className="text-slate-600 dark:text-slate-300 font-sans text-xs leading-relaxed">
                Multi-resolution time-series monitoring, P95 latency distributions, stdout/stderr live log explorer, and Alertmanager triage with acknowledge and mute actions.
              </p>
            </div>

            <div className="p-6 bg-white dark:bg-[#0F2038] border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm space-y-3">
              <div className="w-10 h-10 rounded-xl bg-rose-50 dark:bg-rose-500/15 text-rose-600 dark:text-rose-400 flex items-center justify-center">
                <ShieldAlert className="w-5 h-5" />
              </div>
              <h3 className="text-base font-black text-slate-900 dark:text-white">Incident Command Center</h3>
              <p className="text-slate-600 dark:text-slate-300 font-sans text-xs leading-relaxed">
                Structured 4-stage incident lifecycle (Detected → Investigating → Mitigating → Resolved) with war-room timeline recording, commander assignment, and RCA post-mortems.
              </p>
            </div>

            <div className="p-6 bg-white dark:bg-[#0F2038] border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm space-y-3">
              <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-500/15 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                <Zap className="w-5 h-5" />
              </div>
              <h3 className="text-base font-black text-slate-900 dark:text-white">Self-Healing Automation</h3>
              <p className="text-slate-600 dark:text-slate-300 font-sans text-xs leading-relaxed">
                Operational runbooks with automated step sequences, schedule triggers, manual "Run Now" execution, and toil reduction metrics (84.2 hrs/mo saved).
              </p>
            </div>

            <div className="p-6 bg-white dark:bg-[#0F2038] border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm space-y-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <h3 className="text-base font-black text-slate-900 dark:text-white">4-Tier RBAC & Governance</h3>
              <p className="text-slate-600 dark:text-slate-300 font-sans text-xs leading-relaxed">
                Granular role enforcement (Admin, Operator, Developer, Viewer), TOTP multi-factor authentication, active session revocation, and immutable HMAC audit trails.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── 4. Operational Workflow Section ── */}
      <section id="workflow" className="py-16 sm:py-24 bg-slate-50/50 dark:bg-[#081220] border-b border-slate-200 dark:border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
          <div className="max-w-2xl space-y-3">
            <span className="text-xs font-mono font-bold uppercase text-blue-600 dark:text-blue-400 tracking-wider">Lifecycle Workflow</span>
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
                    ? 'bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-600/20'
                    : 'bg-white dark:bg-[#0F2038] text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                }`}
              >
                <span className={`text-[10px] font-bold block ${activeWorkflowStep === idx ? 'text-blue-200' : 'text-slate-400'}`}>
                  STAGE {step.step}
                </span>
                <span className="text-sm font-black block mt-0.5">{step.name}</span>
              </button>
            ))}
          </div>

          {/* Active Step Showcase Card */}
          <div className="p-6 sm:p-8 rounded-2xl bg-white dark:bg-[#0F2038] border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="space-y-3 max-w-2xl font-mono">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-1 rounded-lg bg-blue-50 dark:bg-blue-500/15 text-blue-700 dark:text-blue-300 font-bold text-xs">
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
              className="px-5 py-3 bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-mono text-xs font-bold rounded-xl transition-colors cursor-pointer shrink-0"
            >
              Explore {workflowSteps[activeWorkflowStep].name} in Workspace →
            </button>
          </div>
        </div>
      </section>

      {/* ── 5. Honest Pricing Section ── */}
      <section id="pricing" className="py-16 sm:py-24 border-b border-slate-200 dark:border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          <div className="text-center max-w-2xl mx-auto space-y-3">
            <span className="text-xs font-mono font-bold uppercase text-blue-600 dark:text-blue-400 tracking-wider">Transparent FinOps</span>
            <h2 className="text-2xl sm:text-4xl font-black text-slate-900 dark:text-white tracking-tight">
              Predictable cloud operations pricing in INR (₹).
            </h2>
            <p className="text-sm text-slate-600 dark:text-slate-300">
              Clear capacity limits with no hidden surcharges.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 font-mono text-xs max-w-5xl mx-auto">
            {/* Developer Tier */}
            <div className="p-6 bg-white dark:bg-[#0F2038] border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm space-y-6 flex flex-col justify-between">
              <div className="space-y-4">
                <div>
                  <span className="text-[10px] text-slate-400 font-bold uppercase">Starter Tier</span>
                  <h3 className="text-lg font-black text-slate-900 dark:text-white mt-1">Developer Cloud</h3>
                  <p className="text-slate-500 font-sans text-xs mt-1">For engineers building standalone projects and testing pipelines.</p>
                </div>

                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-black text-slate-900 dark:text-white">₹499</span>
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
            <div className="p-6 bg-white dark:bg-[#0F2038] border-2 border-blue-600 rounded-2xl shadow-lg space-y-6 flex flex-col justify-between relative">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 bg-blue-600 text-white rounded-full text-[10px] font-bold uppercase">
                Most Popular
              </div>

              <div className="space-y-4">
                <div>
                  <span className="text-[10px] text-blue-600 dark:text-blue-400 font-bold uppercase">Operations Standard</span>
                  <h3 className="text-lg font-black text-slate-900 dark:text-white mt-1">Team Cloud Operations</h3>
                  <p className="text-slate-500 font-sans text-xs mt-1">For growing teams running production workloads with high availability.</p>
                </div>

                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-black text-blue-600 dark:text-blue-400">₹2,499</span>
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
                className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-md transition-colors cursor-pointer"
              >
                Launch Team Workspace
              </button>
            </div>

            {/* Enterprise Tier */}
            <div className="p-6 bg-white dark:bg-[#0F2038] border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm space-y-6 flex flex-col justify-between">
              <div className="space-y-4">
                <div>
                  <span className="text-[10px] text-purple-600 dark:text-purple-400 font-bold uppercase">Dedicated Control Plane</span>
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

      {/* ── 6. Global Technical Footer ── */}
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
              <a href="https://arv-backend.vercel.app/docs" target="_blank" rel="noreferrer" className="hover:text-blue-600">Swagger API</a>
              <a href="https://arv-backend.vercel.app/metrics" target="_blank" rel="noreferrer" className="hover:text-blue-600">Prometheus</a>
              <a href="https://github.com/yashbaviskar15/acos" target="_blank" rel="noreferrer" className="hover:text-blue-600">GitHub</a>
            </div>
          </div>

          <div className="pt-6 border-t border-slate-100 dark:border-slate-800/80 flex flex-col sm:flex-row items-center justify-between gap-3 text-slate-400 text-[11px]">
            <span>© 2026 Aravanta CloudOS. Developed by Yash Baviskar. MIT License.</span>
            <span>Status: 99.98% Operational (Region: ap-south-1)</span>
          </div>
        </div>
      </footer>
    </div>
  );
};
