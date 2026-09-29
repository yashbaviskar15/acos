import React from 'react';
import { CloudOff, ArrowRight, ShieldCheck, KeyRound } from 'lucide-react';
import { Button } from './Button';

interface SetupRequiredProps {
  serviceName: string;
  requiredProviders: string[];
  reason?: string;
  onConfigureProviders?: () => void;
  className?: string;
}

export const SetupRequired: React.FC<SetupRequiredProps> = ({
  serviceName,
  requiredProviders,
  reason,
  onConfigureProviders,
  className = '',
}) => {
  return (
    <div className={`p-8 sm:p-12 rounded-3xl border border-dashed border-slate-300 dark:border-brandObsidian-700 bg-white/50 dark:bg-brandObsidian-900/40 text-center space-y-5 max-w-2xl mx-auto my-8 ${className}`}>
      <div className="w-14 h-14 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 flex items-center justify-center mx-auto shadow-sm">
        <CloudOff className="w-7 h-7" />
      </div>

      <div className="space-y-2">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 text-amber-700 dark:text-amber-400 text-xs font-mono font-semibold">
          <KeyRound className="w-3.5 h-3.5" />
          <span>Awaiting Provider Setup</span>
        </div>
        <h3 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
          {serviceName} Requires Cloud Infrastructure
        </h3>
        <p className="text-sm text-slate-600 dark:text-slate-400 max-w-lg mx-auto leading-relaxed">
          {reason || `Aravanta Cloud OS control plane does not generate fake resources. To provision and manage genuine ${serviceName} workloads, connect a verified provider driver.`}
        </p>
      </div>

      <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
        <span className="text-xs font-mono text-slate-400">Supported Drivers:</span>
        {requiredProviders.map((p) => (
          <span
            key={p}
            className="px-2.5 py-0.5 rounded-md border border-slate-200 dark:border-brandObsidian-700 bg-slate-100 dark:bg-brandObsidian-800 text-xs font-mono font-medium text-slate-700 dark:text-slate-300"
          >
            {p}
          </span>
        ))}
      </div>

      {onConfigureProviders && (
        <div className="pt-2">
          <Button
            variant="primary"
            size="md"
            onClick={onConfigureProviders}
            rightIcon={<ArrowRight className="w-4 h-4" />}
            className="shadow-md"
          >
            Configure Cloud Providers
          </Button>
        </div>
      )}

      <div className="flex items-center justify-center gap-1.5 text-[11px] font-mono text-slate-400 pt-2">
        <ShieldCheck className="w-3.5 h-3.5 text-brandGold-500" />
        <span>Control Plane Invariant #1: Zero fabricated or mock resources</span>
      </div>
    </div>
  );
};
