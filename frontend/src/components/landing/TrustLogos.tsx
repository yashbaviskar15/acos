import React from 'react';
import { ShieldCheck, Award, Lock, Flag } from 'lucide-react';
import { ScrollReveal } from './ScrollReveal';

export const TrustLogos: React.FC = () => {
  const BADGES = [
    {
      title: 'SOC 2 Type II Certified',
      subtitle: 'Audited Cloud Infrastructure',
      icon: ShieldCheck,
      color: 'hover:text-blue-600 hover:border-blue-200 hover:bg-blue-50/50',
    },
    {
      title: 'ISO 27001 Certified',
      subtitle: 'Information Security Standard',
      icon: Award,
      color: 'hover:text-emerald-600 hover:border-emerald-200 hover:bg-emerald-50/50',
    },
    {
      title: 'GDPR Compliant',
      subtitle: 'Zero Data Retention Risk',
      icon: Lock,
      color: 'hover:text-indigo-600 hover:border-indigo-200 hover:bg-indigo-50/50',
    },
    {
      title: 'Made in India ',
      subtitle: 'Local Data Sovereignty',
      icon: Flag,
      color: 'hover:text-amber-600 hover:border-amber-200 hover:bg-amber-50/50',
    },
  ];

  return (
    <ScrollReveal direction="up" distance={20} className="pt-8">
      <div className="text-center space-y-3">
        <p className="text-[11px] font-mono font-bold uppercase tracking-[0.2em] text-slate-400">
          Trusted Enterprise Compliance & Security
        </p>

        <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-4 max-w-4xl mx-auto">
          {BADGES.map((badge, idx) => {
            const Icon = badge.icon;
            return (
              <div
                key={idx}
                className={`flex items-center gap-2.5 px-4 py-2.5 bg-white border border-slate-200/60 rounded-xl shadow-2xs grayscale opacity-70 hover:grayscale-0 hover:opacity-100 transition-all duration-300 cursor-default ${badge.color}`}
              >
                <Icon className="w-4 h-4 text-slate-500 transition-colors" />
                <div className="text-left leading-tight">
                  <p className="text-xs font-bold text-slate-800">{badge.title}</p>
                  <p className="text-[10px] text-slate-400 font-medium">{badge.subtitle}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </ScrollReveal>
  );
};
