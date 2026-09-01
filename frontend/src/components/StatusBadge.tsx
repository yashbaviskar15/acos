import React from 'react';
import { CheckCircle2, AlertTriangle, AlertOctagon, Clock, HelpCircle, Loader2, RefreshCw } from 'lucide-react';

export type StatusType = 
  | 'HEALTHY' 
  | 'RUNNING' 
  | 'ACTIVE' 
  | 'SUCCESS' 
  | 'SUCCESSFUL' 
  | 'COMPLETED' 
  | 'OPERATIONAL'
  | 'WARNING' 
  | 'DEGRADED' 
  | 'INVESTIGATING' 
  | 'MUTED'
  | 'CRITICAL' 
  | 'FAILED' 
  | 'FIRING' 
  | 'CRASHLOOPBACKOFF' 
  | 'TERMINATED'
  | 'PENDING' 
  | 'DEPLOYING' 
  | 'PROVISIONING' 
  | 'UPDATING' 
  | 'MITIGATING' 
  | 'IN_PROGRESS'
  | 'ROLLED_BACK' 
  | 'RESOLVED' 
  | 'STOPPED' 
  | 'PAUSED'
  | 'UNKNOWN';

interface StatusBadgeProps {
  status: string | StatusType;
  size?: 'sm' | 'md' | 'lg';
  showIcon?: boolean;
  className?: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  status,
  size = 'md',
  showIcon = true,
  className = '',
}) => {
  const norm = (status || '').toUpperCase().trim();

  let colorClasses = 'bg-slate-100 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700';
  let Icon = HelpCircle;

  if (['HEALTHY', 'RUNNING', 'ACTIVE', 'SUCCESS', 'SUCCESSFUL', 'COMPLETED', 'OPERATIONAL'].includes(norm)) {
    colorClasses = 'bg-emerald-50 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/30';
    Icon = CheckCircle2;
  } else if (['WARNING', 'DEGRADED', 'INVESTIGATING', 'MUTED'].includes(norm)) {
    colorClasses = 'bg-amber-50 dark:bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-500/30';
    Icon = AlertTriangle;
  } else if (['CRITICAL', 'FAILED', 'FIRING', 'CRASHLOOPBACKOFF', 'TERMINATED'].includes(norm)) {
    colorClasses = 'bg-rose-50 dark:bg-rose-500/15 text-rose-700 dark:text-rose-400 border-rose-200 dark:border-rose-500/30';
    Icon = AlertOctagon;
  } else if (['PENDING', 'DEPLOYING', 'PROVISIONING', 'UPDATING', 'MITIGATING', 'IN_PROGRESS'].includes(norm)) {
    colorClasses = 'bg-blue-50 dark:bg-blue-500/15 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-500/30';
    Icon = Loader2;
  } else if (['ROLLED_BACK', 'RESOLVED'].includes(norm)) {
    colorClasses = 'bg-purple-50 dark:bg-purple-500/15 text-purple-700 dark:text-purple-400 border-purple-200 dark:border-purple-500/30';
    Icon = RefreshCw;
  } else if (['STOPPED', 'PAUSED'].includes(norm)) {
    colorClasses = 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700';
    Icon = Clock;
  }

  const sizeClasses = {
    sm: 'px-2 py-0.5 text-[10px] gap-1',
    md: 'px-2.5 py-1 text-xs gap-1.5',
    lg: 'px-3 py-1.5 text-sm gap-2',
  }[size];

  const iconSize = size === 'sm' ? 'w-3 h-3' : size === 'lg' ? 'w-4 h-4' : 'w-3.5 h-3.5';
  const isSpinning = ['PENDING', 'DEPLOYING', 'PROVISIONING', 'UPDATING', 'MITIGATING', 'IN_PROGRESS'].includes(norm);

  return (
    <span
      className={`inline-flex items-center font-mono font-bold uppercase tracking-wider rounded-md border shrink-0 ${sizeClasses} ${colorClasses} ${className}`}
    >
      {showIcon && <Icon className={`${iconSize} shrink-0 ${isSpinning ? 'animate-spin' : ''}`} />}
      <span>{status || 'UNKNOWN'}</span>
    </span>
  );
};
