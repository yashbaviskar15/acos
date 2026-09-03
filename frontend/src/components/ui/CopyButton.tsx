import React, { useState, useCallback } from 'react';
import { Copy, Check } from 'lucide-react';
import { Tooltip } from './Tooltip';
import { Button, ButtonProps } from './Button';

export interface CopyButtonProps extends Omit<ButtonProps, 'onClick' | 'children'> {
  text: string;
  successDuration?: number;
  tooltipText?: string;
  successText?: string;
}

export const CopyButton: React.FC<CopyButtonProps> = ({
  text,
  successDuration = 2000,
  tooltipText = 'Copy to clipboard',
  successText = 'Copied!',
  variant = 'ghost',
  size = 'sm',
  className = '',
  ...rest
}) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(async () => {
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(text);
      } else {
        const textarea = document.createElement('textarea');
        textarea.value = text;
        textarea.style.position = 'fixed';
        textarea.style.top = '-1000px';
        textarea.style.left = '-1000px';
        textarea.style.opacity = '0';
        document.body.appendChild(textarea);
        textarea.select();
        try {
          document.execCommand('copy');
        } finally {
          document.body.removeChild(textarea);
        }
      }
      setCopied(true);
      window.setTimeout(() => setCopied(false), successDuration);
    } catch (err) {
      console.error('Copy failed:', err);
    }
  }, [text, successDuration]);

  const content = copied ? (
    <>
      <Check className="w-4 h-4 text-emerald-500" />
    </>
  ) : (
    <>
      <Copy className="w-4 h-4" />
    </>
  );

  return (
    <Tooltip content={copied ? successText : tooltipText}>
      <Button
        variant={variant}
        size={size}
        onClick={handleCopy}
        aria-label={copied ? successText : tooltipText}
        className={className}
        {...rest}
      >
        {content}
      </Button>
    </Tooltip>
  );
};

export interface CodeBlockProps {
  code: string;
  language?: string;
  className?: string;
}

export const CodeBlock: React.FC<CodeBlockProps> = ({
  code,
  language,
  className = '',
}) => {
  return (
    <div
      className={[
        'relative group rounded-xl overflow-hidden border border-slate-800 dark:border-brandObsidian-700',
        className,
      ].join(' ')}
    >
      <div className="flex items-center justify-between px-4 py-2.5 bg-brandObsidian-950 border-b border-slate-800 dark:border-brandObsidian-700">
        <span className="text-[11px] font-mono font-semibold uppercase tracking-wider text-slate-500">
          {language || 'code'}
        </span>
        <CopyButton text={code} size="sm" variant="ghost" className="opacity-60 group-hover:opacity-100 -my-1 -mr-2" />
      </div>
      <pre className="overflow-x-auto bg-brandObsidian-950 p-4 text-xs font-mono text-slate-200 leading-relaxed">
        <code>{code}</code>
      </pre>
    </div>
  );
};
