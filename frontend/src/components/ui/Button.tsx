import React from 'react';
import { Loader2 } from 'lucide-react';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'outline' | 'destructive';
export type ButtonSize = 'sm' | 'md' | 'lg' | 'xl';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    'bg-brandGold-500 text-white hover:bg-brandGold-600 active:bg-brandGold-700 shadow-sm shadow-brandGold-500/25 hover:shadow-md hover:shadow-brandGold-500/30',
  secondary:
    'bg-brandObsidian-800 dark:bg-brandObsidian-700 text-white hover:bg-brandObsidian-700 dark:hover:bg-brandObsidian-600 border border-brandObsidian-700 dark:border-brandObsidian-600',
  ghost:
    'bg-transparent text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-brandObsidian-800/60',
  outline:
    'bg-white dark:bg-brandObsidian-900 text-slate-800 dark:text-slate-100 border border-slate-200 dark:border-brandObsidian-700 hover:border-brandGold-500/60 dark:hover:border-brandGold-500/60 hover:bg-slate-50 dark:hover:bg-brandObsidian-800/40',
  destructive:
    'bg-rose-600 text-white hover:bg-rose-700 active:bg-rose-800 shadow-sm shadow-rose-500/25',
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: 'h-8 px-3 text-xs gap-1.5 rounded-lg',
  md: 'h-10 px-4 text-sm gap-2 rounded-xl',
  lg: 'h-12 px-6 text-sm gap-2 rounded-xl',
  xl: 'h-14 px-8 text-base gap-2.5 rounded-2xl',
};

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  loading = false,
  leftIcon,
  rightIcon,
  disabled,
  className = '',
  children,
  ...rest
}) => {
  const isDisabled = disabled || loading;

  return (
    <button
      disabled={isDisabled}
      className={[
        'inline-flex items-center justify-center font-semibold transition-all duration-200',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brandGold-500/60 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-brandObsidian-950',
        'disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none',
        variantClasses[variant],
        sizeClasses[size],
        className,
      ].join(' ')}
      {...rest}
    >
      {loading ? (
        <Loader2 className="w-4 h-4 animate-spin shrink-0" />
      ) : (
        leftIcon && <span className="shrink-0">{leftIcon}</span>
      )}
      {children && <span className="whitespace-nowrap">{children}</span>}
      {!loading && rightIcon && <span className="shrink-0">{rightIcon}</span>}
    </button>
  );
};
