import React, { useState } from 'react';
import { API_URL } from '../config/api';
import { BookOpen, Server, Boxes, HardDrive, Database, GitBranch, Activity, ShieldCheck, ArrowRight, ChevronDown, ChevronUp, Copy } from 'lucide-react';

interface GettingStartedProps {
  onNavigate: (tab: string) => void;
}

const serviceGuides = [
  {
    id: 'compute',
    icon: Server,
    name: 'ArvCompute — Virtual Machines',
    color: 'blue',
    description: 'Create, manage, and scale virtual machine instances across multiple regions.',
    steps: [
      { title: 'Navigate to ArvCompute', detail: 'Click "ArvCompute" in the sidebar to open the VM management dashboard.' },
      { title: 'Click "Launch Instance"', detail: 'Click the green "Launch Instance" button in the top action bar.' },
      { title: 'Configure your VM', detail: 'Fill in the instance name, select an instance type (e.g. arv.medium — 2 vCPUs, 4GB RAM), choose a region and OS image.' },
      { title: 'Launch & Monitor', detail: 'Click "Launch Instance" to create your VM. It will appear in the instances list with status "running". Use the action buttons to stop, restart, or terminate.' },
    ],
    apiExample: `curl -X POST ${API_URL}/v1/compute/instances \\
  -H "Content-Type: application/json" \\
  -d '{"name":"web-server","instance_type":"arv.medium","region":"arv-us-east-1","image":"Ubuntu 24.04 LTS"}'`,
  },
  {
    id: 'kubernetes',
    icon: Boxes,
    name: 'ArvKube — Managed Kubernetes',
    color: 'violet',
    description: 'Deploy and manage Kubernetes clusters with auto-scaling node pools.',
    steps: [
      { title: 'Navigate to ArvKube', detail: 'Click "ArvKube" in the sidebar to view your Kubernetes clusters.' },
      { title: 'Click "Create Cluster"', detail: 'Click the "Create Cluster" button to open the cluster creation form.' },
      { title: 'Configure your Cluster', detail: 'Enter a cluster name, select Kubernetes version (e.g. 1.29), choose a region, set the desired node count and node type.' },
      { title: 'Deploy & Scale', detail: 'Once created, you can view cluster details, scale node pools up/down, and monitor pod health from the dashboard.' },
    ],
    apiExample: `curl -X POST ${API_URL}/v1/kubernetes/clusters \\
  -H "Content-Type: application/json" \\
  -d '{"name":"prod-cluster","version":"1.29","region":"arv-us-east-1","node_count":3,"node_type":"arv.large"}'`,
  },
  {
    id: 'storage',
    icon: HardDrive,
    name: 'ArvStore — Object Storage',
    color: 'emerald',
    description: 'Create S3-compatible storage buckets with AES-256 encryption for files & assets.',
    steps: [
      { title: 'Navigate to ArvStore', detail: 'Click "ArvStore" in the sidebar to view your storage buckets.' },
      { title: 'Click "Create Bucket"', detail: 'Click the "Create Bucket" button to open the bucket creation form.' },
      { title: 'Configure your Bucket', detail: 'Enter a globally unique bucket name, select storage class (Standard, Infrequent Access, or Archive), choose a region and access policy.' },
      { title: 'Browse Objects', detail: 'Click on any bucket in the list to browse its contained objects, view file sizes, content types, and last modified timestamps.' },
    ],
    apiExample: `curl -X POST ${API_URL}/v1/storage/buckets \\
  -H "Content-Type: application/json" \\
  -d '{"name":"my-app-assets","region":"arv-us-east-1","storage_class":"STANDARD","access":"PRIVATE"}'`,
  },
  {
    id: 'database',
    icon: Database,
    name: 'ArvDB — Managed Databases',
    color: 'amber',
    description: 'Deploy managed database instances with automated backups and high availability.',
    steps: [
      { title: 'Navigate to ArvDB', detail: 'Click "ArvDB" in the sidebar to view your database instances.' },
      { title: 'Click "Create Database"', detail: 'Click the "Create Database" button to open the database creation form.' },
      { title: 'Configure your Database', detail: 'Enter a database name, select the engine (PostgreSQL, MySQL, MongoDB, Redis), choose instance size, region, and storage capacity.' },
      { title: 'Connect & Query', detail: 'Once provisioned, use the connection string shown in the database details to connect from your application. All databases include automated daily backups.' },
    ],
    apiExample: `curl -X POST ${API_URL}/v1/databases \\
  -H "Content-Type: application/json" \\
  -d '{"name":"analytics-db","engine":"postgresql","version":"16","region":"arv-us-east-1","instance_type":"arv.medium","storage_gb":50}'`,
  },
  {
    id: 'cicd',
    icon: GitBranch,
    name: 'CI/CD Pipelines',
    color: 'blue',
    description: 'Automate builds, tests, and deployments with integrated CI/CD pipelines.',
    steps: [
      { title: 'Navigate to CI/CD', detail: 'Click "CI/CD Pipelines" in the sidebar to view your build workflows.' },
      { title: 'Click "Create Pipeline"', detail: 'Click the "Create Pipeline" button to configure a new build workflow.' },
      { title: 'Configure your Pipeline', detail: 'Enter a pipeline name, Git repository URL, and target branch. The pipeline auto-detects your build configuration.' },
      { title: 'Trigger Builds', detail: 'Click "Trigger Run" on any pipeline to start a new build. Monitor status, duration, and success/failure indicators in real-time.' },
    ],
    apiExample: `curl -X POST ${API_URL}/v1/cicd/pipelines \\
  -H "Content-Type: application/json" \\
  -d '{"name":"auth-service-ci","repository":"aravanta/auth-service","branch":"main"}'`,
  },
  {
    id: 'monitoring',
    icon: Activity,
    name: 'ArvWatch — Monitoring & Alerts',
    color: 'purple',
    description: 'Real-time system metrics, health checks, and alert management.',
    steps: [
      { title: 'Navigate to ArvWatch', detail: 'Click "ArvWatch" in the sidebar to view your monitoring dashboard.' },
      { title: 'View System Metrics', detail: 'The top KPI cards show live metrics: Requests/Hour, System Uptime, P95 Latency, and Error Rate.' },
      { title: 'Manage Alerts', detail: 'The Alert Center shows active system alerts. Click "Ack" to acknowledge or "Resolve" to close an alert.' },
      { title: 'Health Matrix', detail: 'The Health Matrix panel shows real-time status of all microservices with latency measurements.' },
    ],
    apiExample: `# Get current system metrics
  curl ${API_URL}/v1/monitoring/metrics

  # Get active alerts
  curl ${API_URL}/v1/monitoring/alerts

  # Get microservice health status
  curl ${API_URL}/v1/monitoring/health`,
  },
  {
    id: 'security',
    icon: ShieldCheck,
    name: 'Security & Audit',
    color: 'emerald',
    description: 'RBAC, encryption policies, and immutable audit trail for compliance.',
    steps: [
      { title: 'Navigate to Security', detail: 'Click "Security & Audit" in the sidebar to view the security dashboard.' },
      { title: 'Review Security Policies', detail: 'The top cards show active security policies: Zero Trust Encryption (TLS 1.3 + AES-256), MFA/FIDO2, and RBAC enforcement.' },
      { title: 'Audit Trail', detail: 'The Audit Log table shows all user actions across the platform — including user, action type, target resource, IP address, and timestamp.' },
      { title: 'Compliance', detail: 'All audit logs are immutable and timestamped for regulatory compliance. Filter by service module to investigate specific events.' },
    ],
    apiExample: `# Get audit log entries
  curl ${API_URL}/v1/monitoring/audit-log`,
  },
];

export const GettingStarted: React.FC<GettingStartedProps> = ({ onNavigate }) => {
  const [expandedGuide, setExpandedGuide] = useState<string | null>('compute');
  const [copiedCmd, setCopiedCmd] = useState<string | null>(null);

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCmd(id);
    setTimeout(() => setCopiedCmd(null), 2000);
  };

  const colorMap: Record<string, { bg: string; text: string; border: string; bgLight: string }> = {
    blue: { bg: 'bg-blue-50 dark:bg-blue-500/10', text: 'text-blue-600 dark:text-blue-400', border: 'border-blue-200 dark:border-blue-500/30', bgLight: 'bg-blue-100 dark:bg-blue-500/20' },
    violet: { bg: 'bg-violet-50 dark:bg-violet-500/10', text: 'text-violet-600 dark:text-violet-400', border: 'border-violet-200 dark:border-violet-500/30', bgLight: 'bg-violet-100 dark:bg-violet-500/20' },
    emerald: { bg: 'bg-emerald-50 dark:bg-emerald-500/10', text: 'text-emerald-600 dark:text-emerald-400', border: 'border-emerald-200 dark:border-emerald-500/30', bgLight: 'bg-emerald-100 dark:bg-emerald-500/20' },
    amber: { bg: 'bg-amber-50 dark:bg-amber-500/10', text: 'text-amber-600 dark:text-amber-400', border: 'border-amber-200 dark:border-amber-500/30', bgLight: 'bg-amber-100 dark:bg-amber-500/20' },
    purple: { bg: 'bg-purple-50 dark:bg-purple-500/10', text: 'text-purple-600 dark:text-purple-400', border: 'border-purple-200 dark:border-purple-500/30', bgLight: 'bg-purple-100 dark:bg-purple-500/20' },
  };

  return (
    <div className="p-4 sm:p-6 space-y-6">
      {/* Header */}
      <div className="bg-white dark:bg-[#0F2038] border border-slate-200 dark:border-slate-800 p-6 rounded-2xl shadow-sm">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 flex items-center justify-center">
            <BookOpen className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-extrabold text-slate-900 dark:text-white tracking-tight">Getting Started — Service Usage Guide</h2>
            <p className="text-xs text-slate-600 dark:text-slate-400 font-mono">Step-by-step instructions for every Aravanta CloudOS service</p>
          </div>
        </div>
      </div>

      {/* Service Guides */}
      <div className="space-y-4">
        {serviceGuides.map((guide) => {
          const Icon = guide.icon;
          const isExpanded = expandedGuide === guide.id;
          const colors = colorMap[guide.color] || colorMap.blue;

          return (
            <div key={guide.id} className="bg-white dark:bg-[#0F2038] border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden">
              {/* Guide Header */}
              <button
                onClick={() => setExpandedGuide(isExpanded ? null : guide.id)}
                className="w-full flex items-center justify-between p-5 text-left cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div className={`w-10 h-10 rounded-xl ${colors.bg} ${colors.text} flex items-center justify-center shrink-0`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white">{guide.name}</h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{guide.description}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <button
                    onClick={(e) => { e.stopPropagation(); onNavigate(guide.id); }}
                    className={`hidden sm:flex items-center gap-1.5 px-3 py-1.5 ${colors.bg} ${colors.text} border ${colors.border} rounded-xl text-xs font-bold cursor-pointer hover:shadow-sm transition-all`}
                  >
                    Open Service <ArrowRight className="w-3 h-3" />
                  </button>
                  {isExpanded ? <ChevronUp className="w-5 h-5 text-slate-400" /> : <ChevronDown className="w-5 h-5 text-slate-400" />}
                </div>
              </button>

              {/* Expanded Guide Content */}
              {isExpanded && (
                <div className="border-t border-slate-200 dark:border-slate-800 p-5 space-y-5">
                  {/* Step-by-step Instructions */}
                  <div className="space-y-3">
                    <h4 className="text-xs font-bold uppercase font-mono text-slate-900 dark:text-white tracking-wider">Step-by-step Usage</h4>
                    <div className="space-y-2">
                      {guide.steps.map((step, i) => (
                        <div key={i} className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800">
                          <div className={`w-6 h-6 rounded-lg ${colors.bgLight} ${colors.text} flex items-center justify-center shrink-0 text-[10px] font-black mt-0.5`}>
                            {i + 1}
                          </div>
                          <div>
                            <p className="text-xs font-bold text-slate-900 dark:text-white">{step.title}</p>
                            <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-0.5 leading-relaxed">{step.detail}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* API Example */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-bold uppercase font-mono text-slate-900 dark:text-white tracking-wider">API Example (cURL)</h4>
                      <button
                        onClick={() => handleCopy(guide.apiExample, guide.id)}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-lg text-[10px] font-bold cursor-pointer hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors border border-slate-200 dark:border-slate-700"
                      >
                        <Copy className="w-3 h-3" />
                        {copiedCmd === guide.id ? 'Copied!' : 'Copy'}
                      </button>
                    </div>
                    <div className="bg-slate-900 dark:bg-black rounded-xl p-4 text-xs font-mono text-green-400 overflow-x-auto whitespace-pre-wrap leading-relaxed">
                      {guide.apiExample}
                    </div>
                  </div>

                  {/* Open Service Button (mobile) */}
                  <button
                    onClick={() => onNavigate(guide.id)}
                    className={`sm:hidden w-full flex items-center justify-center gap-2 px-4 py-3 ${colors.bg} ${colors.text} border ${colors.border} rounded-xl text-xs font-bold cursor-pointer`}
                  >
                    Open {guide.name.split(' — ')[0]} <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
