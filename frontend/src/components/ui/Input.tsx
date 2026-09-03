import React from 'react';
import { Search, X } from 'lucide-react';

export interface InputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'> {
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'filled';
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  clearable?: boolean;
  onClear?: () => void;
  wrapperClassName?: string;
}

const sizeClasses = {
  sm: 'h-9 px-3 text-xs rounded-lg',
  md: 'h-11 px-4 text-sm rounded-xl',
  lg: 'h-12 sm:h-14 px-4 sm:px-5 text-sm sm:text-base rounded-2xl',
};

const variantClasses = {
  default:
    'bg-white dark:bg-brandObsidian-900 border-slate-300 dark:border-brandObsidian-700 text-slate-900 dark:text-white focus-within:border-brandGold-500 focus-within:ring-2 focus-within:ring-brandGold-500/25 shadow-sm',
  filled:
    'bg-slate-100 dark:bg-brandObsidian-800 border-transparent dark:border-transparent focus-within:bg-white dark:focus-within:bg-brandObsidian-900 focus-within:border-brandGold-500',
};

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  (
    {
      size = 'md',
      variant = 'default',
      leftIcon,
      rightIcon,
      clearable = false,
      onClear,
      wrapperClassName = '',
      className = '',
      value,
      type = 'text',
      ...rest
    },
    ref
  ) => {
    const showClear = clearable && value && String(value).length > 0;

    return (
      <div
        className={[
          'relative flex items-center w-full border rounded-xl transition-all duration-200',
          'focus-within:ring-2 focus-within:ring-brandGold-500/30',
          sizeClasses[size],
          variantClasses[variant],
          wrapperClassName,
        ].join(' ')}
      >
        {leftIcon && (
          <span className="shrink-0 mr-2 text-slate-400 dark:text-slate-500">
            {leftIcon}
          </span>
        )}
        <input
          ref={ref}
          type={type}
          value={value}
          className={[
            'flex-1 min-w-0 bg-transparent outline-none text-slate-900 dark:text-white',
            'placeholder:text-slate-500 dark:placeholder:text-slate-400 font-medium',
            className,
          ].join(' ')}
          {...rest}
        />
        {showClear && (
          <button
            type="button"
            onClick={onClear}
            className="shrink-0 ml-2 p-0.5 -mr-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 rounded transition-colors"
            tabIndex={-1}
          >
            <X className="w-4 h-4" />
          </button>
        )}
        {rightIcon && !showClear && (
          <span className="shrink-0 ml-2 text-slate-400 dark:text-slate-500">
            {rightIcon}
          </span>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';

export interface SearchInputProps extends Omit<InputProps, 'leftIcon' | 'type'> {
  hotkey?: string;
}

export const SearchInput: React.FC<SearchInputProps> = ({
  hotkey,
  placeholder = 'Search...',
  className = '',
  ...rest
}) => {
  return (
    <Input
      type="search"
      placeholder={placeholder}
      leftIcon={<Search className="w-4 h-4" />}
      rightIcon={
        hotkey ? (
          <kbd className="hidden sm:inline-flex items-center px-1.5 py-0.5 text-[10px] font-mono font-semibold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-brandObsidian-800 border border-slate-200 dark:border-brandObsidian-700 rounded">
            {hotkey}
          </kbd>
        ) : undefined
      }
      className={className}
      {...rest}
    />
  );
};
