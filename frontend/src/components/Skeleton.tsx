import React from 'react';

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  className?: string;
  variant?: 'rectangular' | 'circular' | 'text' | 'card' | 'row';
  width?: string | number;
  height?: string | number;
}

export const Skeleton: React.FC<SkeletonProps> = ({
  className = '',
  variant = 'rectangular',
  width,
  height,
  style,
  ...props
}) => {
  const getVariantStyles = () => {
    switch (variant) {
      case 'circular':
        return 'rounded-full';
      case 'text':
        return 'rounded h-3.5 w-full';
      case 'card':
        return 'rounded-2xl p-6 border border-slate-200 dark:border-slate-800';
      case 'row':
        return 'rounded-xl h-10 w-full';
      case 'rectangular':
      default:
        return 'rounded-xl';
    }
  };

  const inlineStyles: React.CSSProperties = {
    ...style,
    ...(width !== undefined ? { width } : {}),
    ...(height !== undefined ? { height } : {}),
  };

  return (
    <div
      role="status"
      aria-label="Loading content..."
      className={`relative overflow-hidden bg-slate-200/80 dark:bg-slate-800/80 animate-pulse ${getVariantStyles()} ${className}`}
      style={inlineStyles}
      {...props}
    >
      <span className="sr-only">Loading...</span>
    </div>
  );
};

export const SkeletonCard: React.FC<{ className?: string }> = ({ className = '' }) => (
  <div className={`p-6 bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 rounded-2xl space-y-4 ${className}`}>
    <div className="flex items-center gap-3">
      <Skeleton variant="circular" className="w-10 h-10 shrink-0" />
      <div className="space-y-1.5 flex-1">
        <Skeleton variant="text" className="w-2/3 h-4" />
        <Skeleton variant="text" className="w-1/3 h-3" />
      </div>
    </div>
    <div className="space-y-2">
      <Skeleton variant="text" className="w-full" />
      <Skeleton variant="text" className="w-4/5" />
    </div>
  </div>
);

export const SkeletonTableRow: React.FC<{ columns?: number; className?: string }> = ({ 
  columns = 5,
  className = '' 
}) => (
  <tr className={`border-b border-slate-100 dark:border-slate-800/60 ${className}`}>
    {[...Array(columns)].map((_, idx) => (
      <td key={idx} className="py-3 px-4">
        <Skeleton variant="text" className={`h-3.5 ${idx === 0 ? 'w-28' : idx === columns - 1 ? 'w-16' : 'w-20'}`} />
      </td>
    ))}
  </tr>
);
