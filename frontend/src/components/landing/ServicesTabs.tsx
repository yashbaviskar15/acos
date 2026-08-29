import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence, useInView, useReducedMotion } from 'framer-motion';
import { Server, Boxes, HardDrive, Database, CheckCircle2, ArrowRight } from 'lucide-react';
import { Skeleton } from './Skeleton';
import { CheckmarkBounce, ScrollReveal } from './ScrollReveal';

// ─── TypeScript Interfaces ───
interface ServiceModule {
  id: 'compute' | 'kube' | 'storage' | 'db';
  name: string;
  icon: React.FC<{ className?: string }>;
  title: string;
  desc: string;
  specs: string[];
  cliCmd: string;
  cliOutput: string[];
  resultBlock: { id: string; status: string; endpoint: string };
}

interface ServicesTabsProps {
  isLoading: boolean;
  onGoToRegister: () => void;
}

const SERVICES: ServiceModule[] = [
  {
    id: 'compute',
    name: 'ArvCompute',
    icon: Server,
    title: 'Elastic Virtual Compute Instances',
    desc: 'Deploy Linux & Windows VMs in under 10 seconds. High-frequency CPU cores, NVMe SSD storage, and isolated VPC networking.',
    specs: [
      'Up to 64 vCPUs & 256GB RAM',
      'NVMe SSD Block Storage',
      'Custom Security Groups & Firewalls',
      'Automated Daily Snapshots',
    ],
    cliCmd: 'arvcloud compute create --name "web-app-vm" --vcpus 4 --ram 16GB',
    cliOutput: [
      '[INFO] Allocating dedicated compute cores & storage...',
      '[INFO] Attaching VPC subnet & security firewall rules...',
    ],
    resultBlock: {
      id: 'arv-compute-98412',
      status: 'HEALTHY (100% SLA)',
      endpoint: 'https://api.aravanta.cloud/v1/compute',
    },
  },
  {
    id: 'kube',
    name: 'ArvKube',
    icon: Boxes,
    title: 'Managed Kubernetes Clusters',
    desc: 'Production-ready K8s control planes with automated node scaling, rolling zero-downtime upgrades, and integrated ingress routing.',
    specs: [
      'Managed Control Plane (HA)',
      'Horizontal Pod Autoscaling',
      'Built-in Container Registry',
      'Multi-zone Node Pools',
    ],
    cliCmd: 'arvcloud kube cluster create --name "k8s-prod-us" --nodes 3',
    cliOutput: [
      '[INFO] Provisioning Kubernetes control plane...',
      '[INFO] Scaling node pool to 3 worker nodes...',
    ],
    resultBlock: {
      id: 'arv-kube-77201',
      status: 'HEALTHY (100% SLA)',
      endpoint: 'https://api.aravanta.cloud/v1/kube',
    },
  },
  {
    id: 'storage',
    name: 'ArvStore',
    icon: HardDrive,
    title: 'S3-Compatible Object Storage',
    desc: 'High-throughput bucket storage with 99.999999999% data durability, presigned upload URLs, and automatic CDN edge caching.',
    specs: [
      'Direct Multipart File Uploads',
      'S3 API Protocol Compatibility',
      'Access Control Policies (ACLs)',
      'Global Edge Delivery',
    ],
    cliCmd: 'arvcloud storage bucket create --bucket "assets-media-bucket"',
    cliOutput: [
      '[INFO] Creating storage bucket with default ACL...',
      '[INFO] Configuring CDN edge caching rules...',
    ],
    resultBlock: {
      id: 'arv-storage-34501',
      status: 'HEALTHY (100% SLA)',
      endpoint: 'https://api.aravanta.cloud/v1/storage',
    },
  },
  {
    id: 'db',
    name: 'ArvDB',
    icon: Database,
    title: 'Managed Database Engines',
    desc: 'Fully managed PostgreSQL, MySQL, and Redis instances with automated failover, point-in-time recovery, and connection pooling.',
    specs: [
      'Automated Daily Backups',
      'Multi-AZ Read Replicas',
      'SSL/TLS Encrypted Connections',
      'Zero-Downtime Scaling',
    ],
    cliCmd: 'arvcloud db instance create --engine postgres --size db.m5.large',
    cliOutput: [
      '[INFO] Initializing PostgreSQL 16 engine...',
      '[INFO] Configuring automated backup & failover...',
    ],
    resultBlock: {
      id: 'arv-db-56180',
      status: 'HEALTHY (100% SLA)',
      endpoint: 'https://api.aravanta.cloud/v1/db',
    },
  },
];

export const ServicesTabs: React.FC<ServicesTabsProps> = ({ isLoading, onGoToRegister }) => {
  const [activeTab, setActiveTab] = useState<ServiceModule['id']>('compute');
  const [typedText, setTypedText] = useState('');
  const [isTypingFinished, setIsTypingFinished] = useState(false);

  const sectionRef = useRef<HTMLDivElement>(null);
  const terminalRef = useRef<HTMLDivElement>(null);
  const isTerminalInView = useInView(terminalRef, { once: true, margin: '-50px' });
  const shouldReduceMotion = useReducedMotion();

  const currentService = SERVICES.find((s) => s.id === activeTab)!;

  // ─── Sequential Typing Effect (Triggers once terminal enters view) ───
  useEffect(() => {
    if (!isTerminalInView && !shouldReduceMotion) return;

    setTypedText('');
    setIsTypingFinished(false);

    if (shouldReduceMotion) {
      setTypedText(currentService.cliCmd);
      setIsTypingFinished(true);
      return;
    }

    let i = 0;
    const target = currentService.cliCmd;
    const interval = setInterval(() => {
      if (i < target.length) {
        setTypedText((prev) => prev + target.charAt(i));
        i++;
      } else {
        setIsTypingFinished(true);
        clearInterval(interval);
      }
    }, 20);

    return () => clearInterval(interval);
  }, [activeTab, isTerminalInView, currentService.cliCmd, shouldReduceMotion]);

  if (isLoading) {
    return (
      <section className="py-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <div className="text-center space-y-3">
          <Skeleton variant="text" className="w-40 h-4 mx-auto" />
          <Skeleton variant="text" className="w-80 h-8 mx-auto" />
        </div>
        <div className="flex items-center justify-center gap-3 flex-wrap">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} variant="button" className="w-28 sm:w-32 h-11" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 bg-white border border-slate-100 rounded-2xl p-6 sm:p-10 shadow-sm">
          <div className="space-y-4">
            <Skeleton variant="circle" className="w-12 h-12 rounded-xl" />
            <Skeleton variant="text" className="w-56 h-7" />
            <Skeleton variant="text" className="w-full h-14" />
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} variant="text" className="w-4/5 h-4" />
            ))}
          </div>
          <Skeleton variant="card" className="h-72 rounded-xl" />
        </div>
      </section>
    );
  }

  return (
    <section ref={sectionRef} id="features" className="py-20 sm:py-24 bg-white border-b border-slate-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
        
        {/* ── Section Header (ScrollReveal) ── */}
        <ScrollReveal direction="up" distance={20} className="text-center space-y-3 max-w-2xl mx-auto">
          <p className="text-xs font-mono font-bold uppercase tracking-[0.2em] text-blue-600">
            Core Infrastructure Services
          </p>
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-slate-900 tracking-tight">
            7 Integrated Modules. One Powerful Console.
          </h2>
          <p className="text-sm text-slate-500 max-w-lg mx-auto">
            Eliminate multi-cloud fragmentation. Manage your full infrastructure stack from a single pane of glass.
          </p>
        </ScrollReveal>

        {/* ── Tab Selector with Framer Motion layoutId ── */}
        <div
          className="flex items-center justify-center gap-1.5 sm:gap-2 flex-wrap"
          role="tablist"
          aria-label="Service modules"
        >
          {SERVICES.map((service) => {
            const Icon = service.icon;
            const isActive = activeTab === service.id;
            return (
              <button
                key={service.id}
                role="tab"
                aria-selected={isActive}
                aria-controls={`panel-${service.id}`}
                onClick={() => setActiveTab(service.id)}
                className={`relative flex items-center gap-2 px-4 sm:px-5 py-2.5 sm:py-3 rounded-xl text-xs sm:text-[13px] font-bold transition-all cursor-pointer whitespace-nowrap min-h-[44px] ${
                  isActive ? 'text-blue-600' : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'
                }`}
              >
                {isActive && (
                  <motion.div
                    layoutId="activeServiceTab"
                    className="absolute inset-0 bg-blue-50 border border-blue-200/70 rounded-xl shadow-2xs"
                    transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                  />
                )}
                <span className="relative z-10 flex items-center gap-2">
                  <Icon className={`w-4 h-4 transition-colors ${isActive ? 'text-blue-600' : 'text-slate-400'}`} />
                  <span>{service.name}</span>
                </span>
              </button>
            );
          })}
        </div>

        {/* ── Two-Column Content with Smooth Cross-Fade + Horizontal Slide (250ms ease-out) ── */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            id={`panel-${activeTab}`}
            role="tabpanel"
            initial={{ opacity: 0, x: 12 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -12 }}
            transition={{ duration: 0.25, ease: [0.25, 0.1, 0.25, 1] }}
            className="bg-gradient-to-br from-slate-50/80 to-white border border-slate-200/60 rounded-2xl p-5 sm:p-8 lg:p-10 grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-10 items-center shadow-xs"
          >
            {/* ── Left Column: Description & Specs ── */}
            <div className="space-y-5">
              <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100/80 shadow-xs">
                <currentService.icon className="w-6 h-6" />
              </div>

              <h3 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight leading-tight">
                {currentService.title}
              </h3>

              <p className="text-sm text-slate-500 leading-relaxed">
                {currentService.desc}
              </p>

              {/* Staggered Checklist Items with Checkmark Bounce */}
              <div className="space-y-2.5 pt-1">
                {currentService.specs.map((spec, idx) => (
                  <motion.div
                    key={spec}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.06, duration: 0.3 }}
                    className="flex items-center gap-3 text-[13px] text-slate-700 font-medium"
                  >
                    <CheckmarkBounce delay={idx * 0.06}>
                      <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                    </CheckmarkBounce>
                    <span>{spec}</span>
                  </motion.div>
                ))}
              </div>

              {/* Action Button */}
              <div className="pt-3">
                <motion.button
                  whileHover={{ scale: 1.03, y: -1 }}
                  whileTap={{ scale: 0.97 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                  onClick={onGoToRegister}
                  className="group px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-[13px] rounded-xl shadow-md shadow-blue-600/20 transition-all cursor-pointer inline-flex items-center gap-2 min-h-[44px] will-change-transform"
                >
                  <span>Deploy {currentService.name}</span>
                  <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform duration-200" />
                </motion.button>
              </div>
            </div>

            {/* ── Right Column: Terminal/CLI Code Preview Panel (Types in on Viewport Entry) ── */}
            <div
              ref={terminalRef}
              className="bg-[#0f172a] border border-slate-700/60 rounded-xl overflow-hidden shadow-xl"
            >
              {/* Terminal Title Bar */}
              <div className="flex items-center justify-between px-4 py-3 bg-[#0b1120] border-b border-slate-700/50">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-red-500/80" />
                  <span className="w-3 h-3 rounded-full bg-amber-500/80" />
                  <span className="w-3 h-3 rounded-full bg-emerald-500/80" />
                  <span className="ml-3 text-[11px] text-slate-400 font-mono">aravanta-cli</span>
                </div>
                <span className="text-[10px] text-slate-500 font-mono">v1.0.4</span>
              </div>

              {/* Terminal Content Area */}
              <div className="p-4 sm:p-5 font-mono text-[11px] sm:text-xs leading-relaxed space-y-2.5 min-h-[220px]">
                {/* Command Prompt Line */}
                <p className="text-blue-400">
                  ${' '}
                  <span className="text-slate-200">{typedText}</span>
                  {!isTypingFinished && <span className="animate-pulse text-blue-400 ml-px">▋</span>}
                </p>

                {/* Sequential Output Lines (Reveals after typing) */}
                <AnimatePresence>
                  {isTypingFinished && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ duration: 0.3 }}
                      className="space-y-2 pt-0.5"
                    >
                      {currentService.cliOutput.map((line, idx) => (
                        <motion.p
                          key={idx}
                          initial={{ opacity: 0, x: -6 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: idx * 0.15 }}
                          className="text-slate-400"
                        >
                          {line}
                        </motion.p>
                      ))}

                      {/* Success Badge */}
                      <motion.p
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.35 }}
                        className="text-emerald-400 font-semibold pt-1 flex items-center gap-1.5"
                      >
                        <span> Instance successfully provisioned in 3.8s!</span>
                      </motion.p>

                      {/* Output Result Block */}
                      <motion.div
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.45 }}
                        className="mt-3 p-3 bg-slate-900/90 rounded-lg border border-slate-700/50 space-y-1 text-[11px]"
                      >
                        <p className="text-slate-400">
                          ID: <span className="text-slate-200">{currentService.resultBlock.id}</span>
                        </p>
                        <p className="text-slate-400">
                          Status:{' '}
                          <span className="text-emerald-400 font-semibold">
                            {currentService.resultBlock.status}
                          </span>
                        </p>
                        <p className="text-slate-400">
                          Endpoint:{' '}
                          <span className="text-blue-400">{currentService.resultBlock.endpoint}</span>
                        </p>
                      </motion.div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </section>
  );
};
