import React from 'react';

export interface SkeletonProps {
  className?: string;
  rounded?: 'none' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | 'full';
  style?: React.CSSProperties;
}

export const Skeleton: React.FC<SkeletonProps> = ({
  className = '',
  rounded = 'md',
  style,
}) => {
  const roundedClass: Record<string, string> = {
    'none': 'rounded-none',
    'sm': 'rounded-sm',
    'md': 'rounded-md',
    'lg': 'rounded-lg',
    'xl': 'rounded-xl',
    '2xl': 'rounded-2xl',
    '3xl': 'rounded-3xl',
    'full': 'rounded-full',
  };

  return (
    <div
      style={style}
      className={[
        'relative overflow-hidden bg-slate-200 dark:bg-brandObsidian-700',
        roundedClass[rounded],
        className,
      ].join(' ')}
    >
      <div
        className="absolute inset-0 -translate-x-full animate-[shimmer_1.5s_infinite] bg-gradient-to-r from-transparent via-white/60 dark:via-brandObsidian-600/40 to-transparent"
        style={{
          willChange: 'transform',
        }}
      />
    </div>
  );
};

export interface SkeletonTextProps {
  lines?: number;
  lastLineWidth?: string;
  className?: string;
}

export const SkeletonText: React.FC<SkeletonTextProps> = ({
  lines = 3,
  lastLineWidth = '60%',
  className = '',
}) => {
  return (
    <div className={['space-y-2', className].join(' ')}>
      {Array.from({ length: lines }).map((_, i) => {
        const isLast = i === lines - 1;
        return (
          <Skeleton
            key={i}
            rounded="md"
            className={[
              'h-4',
              isLast ? '' : 'w-full',
            ].join(' ')}
            style={isLast ? { width: lastLineWidth } : undefined}
          />
        );
      })}
    </div>
  );
};

export interface SkeletonCardProps {
  className?: string;
  showImage?: boolean;
  imageHeight?: string;
  showAvatar?: boolean;
  lines?: number;
}

export const SkeletonCard: React.FC<SkeletonCardProps> = ({
  className = '',
  showImage = false,
  imageHeight = '160px',
  showAvatar = false,
  lines = 3,
}) => {
  return (
    <div
      className={[
        'bg-white dark:bg-brandObsidian-800 border border-slate-200 dark:border-brandObsidian-700 rounded-2xl shadow-card overflow-hidden',
        className,
      ].join(' ')}
    >
      {showImage && (
        <Skeleton rounded="none" className="w-full" style={{ height: imageHeight }} />
      )}
      <div className="p-6 space-y-4">
        {(showAvatar || !showImage) && (
          <div className="flex items-center gap-3">
            {showAvatar && <Skeleton rounded="full" className="w-10 h-10 shrink-0" />}
            <div className="flex-1 space-y-2">
              <Skeleton rounded="md" className="h-4 w-2/3" />
              <Skeleton rounded="md" className="h-3 w-1/2" />
            </div>
          </div>
        )}
        {showAvatar && <div className="border-t border-slate-100 dark:border-brandObsidian-700 pt-4">
          <SkeletonText lines={lines} />
        </div>}
        {!showAvatar && <SkeletonText lines={lines} />}
      </div>
    </div>
  );
};

export const injectShimmerKeyframes = () => {
  if (typeof document === 'undefined') return;
  const existing = document.querySelector('style[data-shimmer]');
  if (existing) return;
  const style = document.createElement('style');
  style.setAttribute('data-shimmer', 'true');
  style.textContent = `@keyframes shimmer { 100% { transform: translateX(100%); } }`;
  document.head.appendChild(style);
};
