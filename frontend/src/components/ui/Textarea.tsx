import React from 'react';

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  variant?: 'default' | 'filled';
  wrapperClassName?: string;
}

const variantClasses = {
  default:
    'bg-white dark:bg-brandObsidian-900 border-slate-200 dark:border-brandObsidian-700 focus-within:border-brandGold-500',
  filled:
    'bg-slate-50 dark:bg-brandObsidian-800 border-transparent dark:border-transparent focus-within:bg-white dark:focus-within:bg-brandObsidian-900 focus-within:border-brandGold-500',
};

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  (
    {
      variant = 'default',
      wrapperClassName = '',
      className = '',
      rows = 4,
      ...rest
    },
    ref
  ) => {
    return (
      <div
        className={[
          'relative w-full border rounded-xl transition-all duration-200',
          'focus-within:ring-2 focus-within:ring-brandGold-500/30',
          'p-3',
          variantClasses[variant],
          wrapperClassName,
        ].join(' ')}
      >
        <textarea
          ref={ref}
          rows={rows}
          className={[
            'w-full bg-transparent outline-none text-sm text-slate-900 dark:text-slate-100 resize-y',
            'placeholder:text-slate-400 dark:placeholder:text-slate-500',
            className,
          ].join(' ')}
          {...rest}
        />
      </div>
    );
  }
);

Textarea.displayName = 'Textarea';
