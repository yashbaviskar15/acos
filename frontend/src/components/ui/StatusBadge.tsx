import React from 'react';
import { 
  CheckCircle2, Clock, AlertTriangle, AlertCircle, 
  Loader2, PowerOff, HelpCircle 
} from 'lucide-react';

export type LifecycleStatus = 
  | 'AWAITING_PROVIDER_SETUP'
  | 'AWAITING_CREDENTIALS'
  | 'PROVISIONING'
  | 'STARTING'
  | 'RUNNING'
  | 'AVAILABLE'
  | 'ACTIVE'
  | 'STOPPING'
  | 'STOPPED'
  | 'DELETING'
  | 'DELETED'
  | 'FAILED'
  | 'MISSING_AT_PROVIDER'
  | 'UNKNOWN'
  | string;

interface StatusBadgeProps {
  status: LifecycleStatus;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, className = '', size = 'md' }) => {
  const norm = (status || 'UNKNOWN').toUpperCase();

  let bgClass = 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border-slate-300 dark:border-slate-700';
  let Icon = HelpCircle;
  let label = norm.replace(/_/g, ' ');

  switch (norm) {
    case 'RUNNING':
    case 'AVAILABLE':
    case 'ACTIVE':
    case 'SUCCESS':
      bgClass = 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30';
      Icon = CheckCircle2;
      break;

    case 'PROVISIONING':
    case 'STARTING':
    case 'DELETING':
    case 'QUEUED':
      bgClass = 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/30';
      Icon = Loader2;
      break;

    case 'STOPPED':
    case 'DELETED':
      bgClass = 'bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-500/30';
      Icon = PowerOff;
      break;

    case 'AWAITING_PROVIDER_SETUP':
    case 'AWAITING_CREDENTIALS':
      bgClass = 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30';
      Icon = Clock;
      break;

    case 'MISSING_AT_PROVIDER':
      bgClass = 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/30';
      Icon = AlertTriangle;
      break;

    case 'FAILED':
      bgClass = 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/30';
      Icon = AlertCircle;
      break;

    case 'UNKNOWN':
    default:
      bgClass = 'bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-500/30';
      Icon = HelpCircle;
      break;
  }

  const sizeClasses = {
    sm: 'text-[10px] px-1.5 py-0.5 gap-1',
    md: 'text-xs px-2.5 py-1 gap-1.5',
    lg: 'text-sm px-3 py-1.5 gap-2',
  }[size];

  const isSpinning = norm === 'PROVISIONING' || norm === 'STARTING' || norm === 'DELETING';

  return (
    <span
      className={`inline-flex items-center font-mono font-medium rounded-full border ${bgClass} ${sizeClasses} ${className}`}
      title={`Resource status: ${norm}`}
    >
      <Icon className={`w-3.5 h-3.5 shrink-0 ${isSpinning ? 'animate-spin' : ''}`} />
      <span className="capitalize">{label.toLowerCase()}</span>
    </span>
  );
};
