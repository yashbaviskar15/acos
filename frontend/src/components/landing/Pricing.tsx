import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Check, Star, Table, LayoutGrid } from 'lucide-react';
import { Skeleton } from './Skeleton';
import { CheckmarkBounce, ScrollReveal } from './ScrollReveal';
import { Tooltip } from './Tooltip';
import { PricingTable } from './PricingTable';

// ─── TypeScript Interfaces ───
interface PricingTier {
  name: string;
  monthlyPrice: number;
  yearlyPrice: number;
  period: string;
  desc: string;
  features: Array<{ text: string; tooltip?: string }>;
  cta: string;
  popular: boolean;
}

interface CurrencyConfig {
  code: string;
  symbol: string;
  rate: number; // Multiplier against INR
  title: string;
}

interface PricingProps {
  isLoading: boolean;
  onGoToRegister: () => void;
  currency: string;
}

const CURRENCIES: Record<string, CurrencyConfig> = {
  INR: { code: 'INR', symbol: '₹', rate: 1, title: 'Indian Rupees (INR ₹)' },
  USD: { code: 'USD', symbol: '$', rate: 0.012, title: 'US Dollars (USD $)' },
  EUR: { code: 'EUR', symbol: '€', rate: 0.011, title: 'Euros (EUR €)' },
  GBP: { code: 'GBP', symbol: '£', rate: 0.0095, title: 'British Pounds (GBP £)' },
  JPY: { code: 'JPY', symbol: '¥', rate: 1.8, title: 'Japanese Yen (JPY ¥)' },
};

export const Pricing: React.FC<PricingProps> = ({ isLoading, onGoToRegister, currency = 'INR' }) => {
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('yearly');
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards');

  const curr = CURRENCIES[currency] || CURRENCIES.INR;

  // Format price helper
  const formatPrice = (inrPrice: number) => {
    const converted = inrPrice * curr.rate;
    if (curr.code === 'INR') {
      return `${curr.symbol}${converted.toLocaleString()}`;
    }
    if (curr.code === 'JPY') {
      return `${curr.symbol}${Math.round(converted).toLocaleString()}`;
    }
    return `${curr.symbol}${converted.toFixed(converted < 10 ? 2 : 0)}`;
  };

  const PLANS: PricingTier[] = [
    {
      name: 'Starter Developer Tier',
      monthlyPrice: 499,
      yearlyPrice: 399,
      period: '/month',
      desc: 'Perfect for individual developers, side projects, and API microservices.',
      features: [
        { text: '2 vCPU, 4GB RAM Compute VM' },
        { text: '50GB NVMe SSD Block Storage', tooltip: 'Ultra-fast solid-state drives with high IOPS' },
        { text: '1 S3 Bucket (10GB Included)', tooltip: 'S3 API compatible object storage bucket' },
        { text: 'Basic Telemetry & Log Monitoring' },
        { text: 'Community Support & API Access' },
      ],
      cta: 'Start 10-Day Free Trial',
      popular: false,
    },
    {
      name: 'Pro Production Tier',
      monthlyPrice: 1499,
      yearlyPrice: 1199,
      period: '/month',
      desc: 'Ideal for growing startups and production application clusters needing high availability.',
      features: [
        { text: '4 vCPU, 16GB RAM Compute VM' },
        { text: '1 Managed Kubernetes Cluster', tooltip: 'HA control plane with automated worker scaling' },
        { text: '200GB NVMe SSD & 100GB S3 Storage' },
        { text: '1 Managed PostgreSQL / MySQL DB', tooltip: 'Fully automated DB with point-in-time recovery' },
        { text: 'Full CI/CD Pipeline Automation' },
        { text: '24/7 Priority Engineer Support' },
      ],
      cta: 'Get Started with Pro',
      popular: true,
    },
    {
      name: 'Enterprise Cloud Tier',
      monthlyPrice: 4999,
      yearlyPrice: 3999,
      period: '/month',
      desc: 'For high-throughput enterprise workloads, compliance-driven infrastructure, and multi-tenant clusters.',
      features: [
        { text: '16 vCPU, 64GB RAM Dedicated Nodes' },
        { text: 'Unlimited Kubernetes & Storage Buckets' },
        { text: 'Multi-AZ Dedicated Database Cluster', tooltip: 'Multi-Availability Zone failover replicas' },
        { text: 'Zero-Trust RBAC & Audit Trail Logging', tooltip: 'Granular role-based access control with MFA' },
        { text: 'Custom SLA Guarantee (99.99%)' },
        { text: 'Dedicated Technical Account Manager' },
      ],
      cta: 'Launch Enterprise',
      popular: false,
    },
  ];

  if (isLoading) {
    return (
      <section className="py-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <div className="text-center space-y-3">
          <Skeleton variant="text" className="w-32 h-4 mx-auto" />
          <Skeleton variant="text" className="w-72 h-8 mx-auto" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white border border-slate-100 rounded-2xl p-6 sm:p-8 space-y-4 shadow-sm">
              <Skeleton variant="text" className="w-32 h-5" />
              <Skeleton variant="text" className="w-24 h-10" />
              <Skeleton variant="text" className="w-full h-12" />
              <div className="space-y-2 pt-3">
                {[1, 2, 3, 4, 5].map((j) => (
                  <Skeleton key={j} variant="text" className="w-full h-3.5" />
                ))}
              </div>
              <Skeleton variant="button" className="w-full h-11 mt-3" />
            </div>
          ))}
        </div>
      </section>
    );
  }

  return (
    <section id="pricing" className="py-20 sm:py-24 bg-gradient-to-b from-slate-50/60 via-white to-slate-50/40 border-b border-slate-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
        
        {/* ── Section Header ── */}
        <ScrollReveal direction="up" distance={20} className="text-center space-y-3 max-w-2xl mx-auto">
          <p className="text-xs font-mono font-bold uppercase tracking-[0.2em] text-blue-600">
            Transparent Billing
          </p>
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-slate-900 tracking-tight">
            Predictable Pricing in {curr.title}.
          </h2>
          <p className="text-sm text-slate-500">
            No hidden egress charges or unexpected bills. Start with 10 days free, then choose a plan that scales with you.
          </p>
        </ScrollReveal>

        {/* ── Controls Row: Monthly/Yearly Switch & Card/Table View Toggle ── */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 max-w-4xl mx-auto pt-2 pb-2">
          {/* Monthly / Yearly Toggle */}
          <div className="flex items-center gap-3 bg-slate-100 p-1.5 rounded-2xl border border-slate-200/80">
            <button
              onClick={() => setBillingCycle('monthly')}
              className={`px-4 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                billingCycle === 'monthly'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              Monthly Billing
            </button>
            <button
              onClick={() => setBillingCycle('yearly')}
              className={`px-4 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center gap-1.5 ${
                billingCycle === 'yearly'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              <span>Yearly Billing</span>
              <span className="px-1.5 py-0.5 bg-emerald-400 text-slate-950 text-[10px] font-extrabold rounded-full">
                Save 20%
              </span>
            </button>
          </div>

          {/* Card View vs Comparison Table View Toggle */}
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200/80 text-xs font-semibold text-slate-600">
            <button
              onClick={() => setViewMode('cards')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                viewMode === 'cards' ? 'bg-white text-slate-900 shadow-2xs font-bold' : 'hover:text-slate-900'
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span>Card View</span>
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                viewMode === 'table' ? 'bg-white text-slate-900 shadow-2xs font-bold' : 'hover:text-slate-900'
              }`}
            >
              <Table className="w-3.5 h-3.5" />
              <span>Detailed Comparison Table</span>
            </button>
          </div>
        </div>

        {/* ── Content View: Cards vs Table ── */}
        {viewMode === 'table' ? (
          <PricingTable onGoToRegister={onGoToRegister} currency={currency} />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8 items-stretch">
            {PLANS.map((plan, idx) => {
              const currentPrice = billingCycle === 'yearly' ? plan.yearlyPrice : plan.monthlyPrice;
              return (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: 32, scale: 0.95 }}
                  whileInView={{ opacity: 1, y: 0, scale: plan.popular ? 1.03 : 1 }}
                  viewport={{ once: true, margin: '-50px' }}
                  transition={{
                    duration: 0.55,
                    delay: idx * 0.12,
                    ease: [0.25, 0.1, 0.25, 1],
                  }}
                  whileHover={{
                    y: -6,
                    scale: plan.popular ? 1.05 : 1.02,
                    transition: { duration: 0.25, ease: 'easeOut' },
                  }}
                  className={`relative rounded-2xl p-6 sm:p-8 flex flex-col justify-between space-y-6 transition-all duration-300 will-change-transform ${
                    plan.popular
                      ? 'bg-white border-2 border-blue-500 shadow-xl shadow-blue-500/15 z-10 hover:shadow-2xl hover:shadow-blue-500/25 hover:border-blue-600'
                      : 'bg-white border border-slate-200/80 shadow-xs hover:shadow-lg hover:border-slate-300'
                  }`}
                >
                  {/* Glow effect for popular card */}
                  {plan.popular && (
                    <div className="absolute -inset-[2px] bg-gradient-to-r from-blue-500 via-indigo-500 to-blue-600 rounded-[18px] opacity-30 blur-xs -z-10 animate-pulse pointer-events-none" />
                  )}

                  {/* Popular Badge */}
                  {plan.popular && (
                    <span className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-4 py-1 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold text-[10px] uppercase tracking-wider rounded-full shadow-md flex items-center gap-1.5">
                      <Star className="w-3 h-3 fill-current animate-spin-slow" />
                      Most Popular
                    </span>
                  )}

                  <div className="space-y-5">
                    <h3 className="text-base sm:text-lg font-bold text-slate-900">{plan.name}</h3>

                    <div className="flex items-baseline gap-1.5">
                      <motion.span
                        key={currentPrice}
                        initial={{ opacity: 0, y: -8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.2 }}
                        className="text-3xl sm:text-4xl font-black font-mono text-slate-900"
                      >
                        {formatPrice(currentPrice)}
                      </motion.span>
                      <span className="text-sm text-slate-400 font-medium">{plan.period}</span>
                      {billingCycle === 'yearly' && (
                        <span className="ml-auto text-[10px] font-mono font-bold text-emerald-600 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                          Billed Annually
                        </span>
                      )}
                    </div>

                    <p className="text-xs sm:text-sm text-slate-500 leading-relaxed">{plan.desc}</p>

                    {/* Feature List with Tooltips & Staggered Checkmark Bounce */}
                    <div className="space-y-2.5 pt-4 border-t border-slate-100">
                      {plan.features.map((feat, fIdx) => (
                        <div key={fIdx} className="flex items-start gap-2.5 text-[13px] text-slate-700">
                          <CheckmarkBounce delay={idx * 0.1 + fIdx * 0.05}>
                            <div className="w-4 h-4 rounded-full bg-emerald-50 border border-emerald-100 flex items-center justify-center shrink-0">
                              <Check className="w-2.5 h-2.5 text-emerald-600" strokeWidth={3} />
                            </div>
                          </CheckmarkBounce>
                          <div className="flex items-center gap-1">
                            <span>{feat.text}</span>
                            {feat.tooltip && <Tooltip content={feat.tooltip} term="" />}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* CTA Button */}
                  <motion.button
                    whileHover={{ scale: 1.03, y: -1 }}
                    whileTap={{ scale: 0.97 }}
                    transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                    onClick={onGoToRegister}
                    className={`w-full py-3.5 font-bold text-sm rounded-xl transition-all cursor-pointer min-h-[48px] will-change-transform ${
                      plan.popular
                        ? 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-md shadow-blue-600/25 hover:shadow-lg hover:shadow-blue-600/35'
                        : 'bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-200/80 hover:border-slate-300'
                    }`}
                  >
                    {plan.cta}
                  </motion.button>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
};
