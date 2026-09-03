import React from 'react';
import { ChevronDown } from 'lucide-react';

export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface SelectProps extends Omit<React.SelectHTMLAttributes<HTMLSelectElement>, 'size'> {
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'filled';
  options: SelectOption[];
  wrapperClassName?: string;
}

const sizeClasses = {
  sm: 'h-9 pl-3 pr-9 text-xs rounded-lg',
  md: 'h-11 pl-4 pr-10 text-sm rounded-xl',
  lg: 'h-13 pl-5 pr-11 text-base rounded-xl',
};

const variantClasses = {
  default:
    'bg-white dark:bg-brandObsidian-900 border-slate-200 dark:border-brandObsidian-700 focus-within:border-brandGold-500',
  filled:
    'bg-slate-50 dark:bg-brandObsidian-800 border-transparent dark:border-transparent focus-within:bg-white dark:focus-within:bg-brandObsidian-900 focus-within:border-brandGold-500',
};

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  (
    {
      size = 'md',
      variant = 'default',
      options,
      wrapperClassName = '',
      className = '',
      ...rest
    },
    ref
  ) => {
    return (
      <div
        className={[
          'relative inline-flex items-center w-full border rounded-xl transition-all duration-200',
          'focus-within:ring-2 focus-within:ring-brandGold-500/30',
          variantClasses[variant],
          wrapperClassName,
        ].join(' ')}
      >
        <select
          ref={ref}
          className={[
            'appearance-none w-full h-full bg-transparent outline-none text-slate-900 dark:text-slate-100 cursor-pointer pr-2',
            sizeClasses[size],
            className,
          ].join(' ')}
          {...rest}
        >
          {options.map((opt) => (
            <option key={opt.value} value={opt.value} disabled={opt.disabled}>
              {opt.label}
            </option>
          ))}
        </select>
        <ChevronDown
          className={[
            'absolute right-3 pointer-events-none text-slate-400 dark:text-slate-500 shrink-0',
            size === 'sm' ? 'w-4 h-4' : size === 'lg' ? 'w-5 h-5' : 'w-4.5 h-4.5',
          ].join(' ')}
        />
      </div>
    );
  }
);

Select.displayName = 'Select';
