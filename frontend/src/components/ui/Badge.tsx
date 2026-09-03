import React from 'react';

export type BadgeVariant =
  | 'default'
  | 'gold'
  | 'success'
  | 'warning'
  | 'danger'
  | 'info'
  | 'outline';
export type BadgeSize = 'sm' | 'md' | 'lg';

export interface BadgeProps {
  variant?: BadgeVariant;
  size?: BadgeSize;
  dot?: boolean;
  className?: string;
  children?: React.ReactNode;
}

const variantClasses: Record<BadgeVariant, string> = {
  default:
    'bg-slate-100 dark:bg-brandObsidian-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-brandObsidian-700',
  gold:
    'bg-brandGold-500/10 text-brandGold-600 dark:text-brandGold-400 border border-brandGold-500/30',
  success:
    'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/25',
  warning:
    'bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/25',
  danger:
    'bg-rose-500/10 text-rose-700 dark:text-rose-400 border border-rose-500/25',
  info:
    'bg-blue-500/10 text-blue-700 dark:text-blue-400 border border-blue-500/25',
  outline:
    'bg-transparent text-slate-600 dark:text-slate-300 border border-slate-300 dark:border-brandObsidian-600',
};

const sizeClasses: Record<BadgeSize, string> = {
  sm: 'px-2 py-0.5 text-[10px] rounded-md gap-1',
  md: 'px-2.5 py-1 text-xs rounded-lg gap-1.5',
  lg: 'px-3 py-1.5 text-sm rounded-xl gap-2',
};

const dotColors: Record<BadgeVariant, string> = {
  default: 'bg-slate-400',
  gold: 'bg-brandGold-500',
  success: 'bg-emerald-500',
  warning: 'bg-amber-500',
  danger: 'bg-rose-500',
  info: 'bg-blue-500',
  outline: 'bg-slate-400',
};

export const Badge: React.FC<BadgeProps> = ({
  variant = 'default',
  size = 'md',
  dot = false,
  className = '',
  children,
}) => {
  return (
    <span
      className={[
        'inline-flex items-center font-semibold uppercase tracking-wide',
        variantClasses[variant],
        sizeClasses[size],
        className,
      ].join(' ')}
    >
      {dot && (
        <span
          className={[
            'w-1.5 h-1.5 rounded-full shrink-0',
            variant === 'success' || variant === 'gold' ? 'animate-pulse' : '',
            dotColors[variant],
          ].join(' ')}
        />
      )}
      {children}
    </span>
  );
};
