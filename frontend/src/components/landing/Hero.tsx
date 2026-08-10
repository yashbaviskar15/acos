import React, { useRef } from 'react';
import { motion, useScroll, useTransform, useReducedMotion } from 'framer-motion';
import { ArrowRight, Sparkles, Terminal, Shield, Zap, Layers, IndianRupee, Activity, Server, Cpu, HardDrive } from 'lucide-react';
import { Skeleton } from './Skeleton';
import { CountUp, CheckmarkBounce } from './ScrollReveal';

// ─── TypeScript Interfaces ───
interface HeroProps {
  isLoading: boolean;
  onGoToLogin: () => void;
  onGoToRegister: () => void;
}

interface StatCardData {
  label: string;
  endValue: number;
  decimals: number;
  prefix: string;
  suffix: string;
  sub: string;
  icon: React.FC<{ className?: string }>;
  color: string;
  bgColor: string;
  borderColor: string;
}

const STATS: StatCardData[] = [
  {
    label: 'Uptime SLA Guarantee',
    endValue: 99.99,
    decimals: 2,
    prefix: '',
    suffix: '%',
    sub: 'Tier-4 Data Centers',
    icon: Shield,
    color: 'text-blue-600',
    bgColor: 'bg-blue-50/80',
    borderColor: 'border-blue-100',
  },
  {
    label: 'VM Provisioning Speed',
    endValue: 10,
    decimals: 0,
    prefix: '< ',
    suffix: 's',
    sub: 'High-Frequency CPU',
    icon: Zap,
    color: 'text-emerald-600',
    bgColor: 'bg-emerald-50/80',
    borderColor: 'border-emerald-100',
  },
  {
    label: 'Unified Cloud Stack',
    endValue: 7,
    decimals: 0,
    prefix: '',
    suffix: ' Modules',
    sub: 'Single Control Plane',
    icon: Layers,
    color: 'text-amber-600',
    bgColor: 'bg-amber-50/80',
    borderColor: 'border-amber-100',
  },
  {
    label: 'Developer Starter Tier',
    endValue: 499,
    decimals: 0,
    prefix: '₹',
    suffix: '/mo',
    sub: '10-Day Free Trial',
    icon: IndianRupee,
    color: 'text-indigo-600',
    bgColor: 'bg-indigo-50/80',
    borderColor: 'border-indigo-100',
  },
];

export const Hero: React.FC<HeroProps> = ({ isLoading, onGoToLogin, onGoToRegister }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const shouldReduceMotion = useReducedMotion();

  // ─── Background Parallax on Scroll ───
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start start', 'end start'],
  });

  const blobY1 = useTransform(scrollYProgress, [0, 1], [0, 90]);
  const blobY2 = useTransform(scrollYProgress, [0, 1], [0, -70]);
  const contentY = useTransform(scrollYProgress, [0, 1], [0, 20]);

  if (isLoading) {
    return (
      <section className="pt-16 pb-20 max-w-7xl mx-auto px-4 sm:px-6 text-center space-y-5">
        <Skeleton variant="text" className="w-56 h-7 mx-auto rounded-full" />
        <Skeleton variant="text" className="w-4/5 h-12 mx-auto" />
        <Skeleton variant="text" className="w-3/5 h-5 mx-auto" />
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
          <Skeleton variant="button" className="w-52 h-12" />
          <Skeleton variant="button" className="w-44 h-12" />
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-10">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="p-5 bg-white border border-slate-100 rounded-2xl space-y-2.5 shadow-sm">
              <Skeleton variant="text" className="w-20 h-8" />
              <Skeleton variant="text" className="w-full h-3.5" />
              <Skeleton variant="text" className="w-3/4 h-3" />
            </div>
          ))}
        </div>
      </section>
    );
  }

  return (
    <section
      ref={containerRef}
      className="relative pt-12 pb-20 sm:pt-16 sm:pb-28 overflow-hidden bg-gradient-to-b from-slate-50 via-white to-[#FAFBFC]"
    >
      {/* ── Background Subtle Grid Pattern ── */}
      <div className="absolute inset-0 bg-[radial-gradient(#cbd5e1_1px,transparent_1px)] [background-size:24px_24px] opacity-40 pointer-events-none" />

      {/* ── Parallax Background Glowing Blobs ── */}
      <motion.div
        style={{ y: shouldReduceMotion ? 0 : blobY1 }}
        className="absolute -top-40 left-1/2 -translate-x-1/2 w-[850px] h-[420px] bg-blue-500/[0.07] rounded-full blur-[120px] pointer-events-none will-change-transform"
      />
      <motion.div
        style={{ y: shouldReduceMotion ? 0 : blobY2 }}
        className="absolute top-20 right-0 w-[320px] h-[320px] bg-indigo-400/[0.05] rounded-full blur-[90px] pointer-events-none will-change-transform"
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 space-y-12">
        {/* ── Split Desktop Layout (Left: Copy + CTAs, Right: Live Console Preview Mockup) ── */}
        <motion.div
          style={{ y: shouldReduceMotion ? 0 : contentY }}
          className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center"
        >
          {/* Left Column: Headline & Action CTAs (lg:col-span-7) */}
          <div className="lg:col-span-7 text-center lg:text-left space-y-6">
            {/* Badge Pill */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, ease: [0.25, 0.1, 0.25, 1] }}
            >
              <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-50/90 border border-blue-200/80 text-blue-700 text-xs font-semibold shadow-xs hover:border-blue-300 transition-colors">
                <Sparkles className="w-3.5 h-3.5 text-blue-500 animate-pulse" />
                <span>Aravanta CloudOS v1.0 Enterprise is Live</span>
              </span>
            </motion.div>

            {/* H1 Headline */}
            <motion.h1
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.12, ease: [0.25, 0.1, 0.25, 1] }}
              className="text-3xl sm:text-5xl lg:text-[3.25rem] font-black text-slate-900 tracking-tight leading-[1.12]"
            >
              Unified Enterprise Cloud OS for{' '}
              <span className="bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-600 bg-clip-text text-transparent">
                Modern Workloads.
              </span>
            </motion.h1>

            {/* Subtext */}
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.24, ease: [0.25, 0.1, 0.25, 1] }}
              className="text-sm sm:text-base lg:text-lg text-slate-500 max-w-xl mx-auto lg:mx-0 leading-relaxed"
            >
              Provision elastic virtual servers, Kubernetes worker pools, S3 object
              storage buckets, and managed databases with zero operational friction.
            </motion.p>

            {/* CTA Buttons */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.36, ease: [0.25, 0.1, 0.25, 1] }}
              className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-3.5 pt-2"
            >
              <motion.button
                whileHover={{ scale: 1.03, y: -2 }}
                whileTap={{ scale: 0.97 }}
                transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                onClick={onGoToRegister}
                className="group w-full sm:w-auto px-7 py-3.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold text-sm rounded-xl shadow-lg shadow-blue-600/25 hover:shadow-xl hover:shadow-blue-600/35 transition-all flex items-center justify-center gap-2.5 cursor-pointer min-h-[48px] will-change-transform"
              >
                <span>Launch 10-Day Free Trial</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-200" />
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.02, y: -1 }}
                whileTap={{ scale: 0.98 }}
                transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                onClick={onGoToLogin}
                className="w-full sm:w-auto px-7 py-3.5 bg-white hover:bg-slate-50 text-slate-700 font-semibold text-sm rounded-xl border border-slate-200/90 shadow-sm hover:shadow hover:border-slate-300 transition-all flex items-center justify-center gap-2.5 cursor-pointer min-h-[48px] will-change-transform"
              >
                <Terminal className="w-4 h-4 text-blue-600" />
                <span>Sign In to Console</span>
              </motion.button>
            </motion.div>
          </div>

          {/* Right Column: Live CloudOS Dashboard Console Mockup Preview (lg:col-span-5) */}
          <motion.div
            initial={{ opacity: 0, x: 30, scale: 0.96 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            transition={{ duration: 0.7, delay: 0.2, ease: [0.25, 0.1, 0.25, 1] }}
            className="lg:col-span-5"
          >
            <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-4 sm:p-5 text-white space-y-4 relative overflow-hidden group hover:border-slate-700 transition-colors">
              {/* Window Bar */}
              <div className="flex items-center justify-between pb-3 border-b border-slate-800 text-xs">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-red-500/80" />
                  <span className="w-3 h-3 rounded-full bg-amber-500/80" />
                  <span className="w-3 h-3 rounded-full bg-emerald-500/80" />
                  <span className="ml-2 text-slate-400 font-mono text-[11px]">aravanta-console-v1.0</span>
                </div>
                <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded text-[10px] font-mono font-bold flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                  LIVE OPERATIONAL
                </span>
              </div>

              {/* Console Dashboard Summary Widgets */}
              <div className="grid grid-cols-2 gap-2.5">
                <div className="p-3 bg-slate-800/80 rounded-xl border border-slate-700/60 space-y-1">
                  <div className="flex items-center justify-between text-slate-400 text-[11px]">
                    <span className="flex items-center gap-1.5"><Server className="w-3.5 h-3.5 text-blue-400" /> Active VMs</span>
                    <span className="text-emerald-400 font-mono font-bold">14 Online</span>
                  </div>
                  <p className="text-lg font-black font-mono text-white">48 vCPUs</p>
                  <div className="w-full bg-slate-700 h-1.5 rounded-full overflow-hidden">
                    <div className="bg-blue-500 h-full w-[65%]" />
                  </div>
                </div>

                <div className="p-3 bg-slate-800/80 rounded-xl border border-slate-700/60 space-y-1">
                  <div className="flex items-center justify-between text-slate-400 text-[11px]">
                    <span className="flex items-center gap-1.5"><Cpu className="w-3.5 h-3.5 text-indigo-400" /> K8s Pools</span>
                    <span className="text-emerald-400 font-mono font-bold">3 Clusters</span>
                  </div>
                  <p className="text-lg font-black font-mono text-white">99.99% SLA</p>
                  <div className="w-full bg-slate-700 h-1.5 rounded-full overflow-hidden">
                    <div className="bg-emerald-500 h-full w-[95%]" />
                  </div>
                </div>
              </div>

              {/* Active Resource Monitoring Sparkline Preview */}
              <div className="p-3 bg-slate-800/50 rounded-xl border border-slate-800 space-y-2">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-slate-300 font-semibold flex items-center gap-1.5">
                    <Activity className="w-3.5 h-3.5 text-blue-400" /> Global Egress & Telemetry
                  </span>
                  <span className="text-slate-400 font-mono">1.2 GB/s</span>
                </div>
                <div className="h-12 flex items-end gap-1 pt-1">
                  {[35, 45, 30, 65, 80, 55, 70, 90, 85, 95, 75, 88].map((val, i) => (
                    <div
                      key={i}
                      className="flex-1 bg-gradient-to-t from-blue-600 to-indigo-400 rounded-t transition-all hover:opacity-100 opacity-80"
                      style={{ height: `${val}%` }}
                    />
                  ))}
                </div>
              </div>

              {/* Status Bar */}
              <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono pt-1">
                <span className="flex items-center gap-1">
                  <HardDrive className="w-3 h-3 text-amber-400" /> Storage: 14.2TB S3 Buckets
                </span>
                <span className="text-blue-400 hover:underline cursor-pointer">Explore Console &rarr;</span>
              </div>
            </div>
          </motion.div>
        </motion.div>

        {/* ── Staggered Stat Cards with Count-Up Numbers & Icon Bounce ── */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5 sm:gap-4 max-w-7xl mx-auto pt-4">
          {STATS.map((stat, idx) => {
            const Icon = stat.icon;
            return (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 28 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-40px' }}
                transition={{
                  duration: 0.5,
                  delay: 0.1 * idx,
                  ease: [0.25, 0.1, 0.25, 1],
                }}
                whileHover={{ y: -5, transition: { duration: 0.2 } }}
                className={`group p-4 sm:p-5 bg-white border border-slate-200/70 hover:border-blue-200/80 rounded-2xl shadow-xs hover:shadow-md transition-all text-left relative overflow-hidden`}
              >
                <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-bl from-slate-50 to-transparent pointer-events-none rounded-bl-full" />

                <div className={`w-9 h-9 ${stat.bgColor} border ${stat.borderColor} rounded-xl flex items-center justify-center mb-3 transition-transform group-hover:scale-105`}>
                  <CheckmarkBounce delay={0.2 + idx * 0.1}>
                    <Icon className={`w-4 h-4 ${stat.color}`} />
                  </CheckmarkBounce>
                </div>

                <p className={`text-2xl sm:text-3xl font-black font-mono ${stat.color} leading-none tracking-tight`}>
                  <CountUp
                    end={stat.endValue}
                    decimals={stat.decimals}
                    prefix={stat.prefix}
                    suffix={stat.suffix}
                    duration={1400}
                  />
                </p>

                <p className="text-xs font-bold text-slate-800 mt-2 leading-tight">{stat.label}</p>
                <p className="text-[11px] text-slate-400 font-medium mt-0.5">{stat.sub}</p>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
