import React from 'react';

// ─── TypeScript Interfaces ───
interface SkeletonProps {
  className?: string;
  variant?: 'text' | 'card' | 'circle' | 'button';
  width?: string;
  height?: string;
}

/**
 * Reusable Skeleton placeholder with shimmer gradient animation.
 * Uses a CSS linear-gradient that sweeps left-to-right.
 */
export const Skeleton: React.FC<SkeletonProps> = ({
  className = '',
  variant = 'text',
}) => {
  const variantClasses: Record<string, string> = {
    text: 'h-4 w-full rounded-md',
    card: 'h-48 w-full rounded-2xl',
    circle: 'rounded-full',
    button: 'h-11 w-32 rounded-xl',
  };

  return (
    <div
      className={`skeleton-shimmer ${variantClasses[variant] || ''} ${className}`}
      aria-hidden="true"
    />
  );
};

/**
 * Full landing page skeleton shown during initial 800ms load.
 * Mimics the real layout dimensions for a seamless transition.
 */
export const LandingPageSkeleton: React.FC = () => {
  return (
    <div className="min-h-screen bg-[#FAFBFC] font-sans">
      {/* ── Navbar Skeleton ── */}
      <div className="h-[72px] border-b border-slate-200/60 bg-white/90 px-4 sm:px-6 lg:px-8 flex items-center justify-between max-w-full">
        <div className="flex items-center gap-3">
          <Skeleton variant="circle" className="w-10 h-10" />
          <Skeleton variant="text" className="w-28 h-5 hidden sm:block" />
        </div>
        <div className="hidden md:flex items-center gap-6">
          <Skeleton variant="text" className="w-16 h-3.5" />
          <Skeleton variant="text" className="w-20 h-3.5" />
          <Skeleton variant="text" className="w-14 h-3.5" />
          <Skeleton variant="text" className="w-12 h-3.5" />
        </div>
        <div className="flex items-center gap-3">
          <Skeleton variant="button" className="w-16 h-9 hidden sm:block" />
          <Skeleton variant="button" className="w-28 h-9" />
        </div>
      </div>

      {/* ── Hero Skeleton ── */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 pt-16 pb-20 text-center space-y-5">
        <Skeleton variant="text" className="w-56 h-7 mx-auto rounded-full" />
        <Skeleton variant="text" className="w-4/5 h-10 sm:h-14 mx-auto rounded-lg" />
        <Skeleton variant="text" className="w-3/5 h-5 mx-auto rounded-md" />
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
          <Skeleton variant="button" className="w-52 h-12" />
          <Skeleton variant="button" className="w-44 h-12" />
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-10">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="p-5 bg-white border border-slate-100 rounded-2xl space-y-2.5 shadow-sm">
              <Skeleton variant="text" className="w-20 h-8" />
              <Skeleton variant="text" className="w-full h-3.5" />
              <Skeleton variant="text" className="w-3/4 h-3" />
            </div>
          ))}
        </div>
      </div>

      {/* ── Services Skeleton ── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 space-y-8">
        <div className="flex items-center justify-center gap-3 flex-wrap">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} variant="button" className="w-28 sm:w-32 h-11" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 bg-white border border-slate-100 rounded-2xl p-6 sm:p-10 shadow-sm">
          <div className="space-y-4">
            <Skeleton variant="circle" className="w-12 h-12 rounded-xl" />
            <Skeleton variant="text" className="w-56 h-7" />
            <Skeleton variant="text" className="w-full h-16" />
            <div className="space-y-2.5 pt-2">
              {[1, 2, 3, 4].map((i) => (
                <Skeleton key={i} variant="text" className="w-4/5 h-4" />
              ))}
            </div>
            <Skeleton variant="button" className="w-48 h-11 mt-4" />
          </div>
          <Skeleton variant="card" className="h-72 rounded-xl" />
        </div>
      </div>

      {/* ── Pricing Skeleton ── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 space-y-8">
        <div className="text-center space-y-3">
          <Skeleton variant="text" className="w-32 h-4 mx-auto" />
          <Skeleton variant="text" className="w-72 h-8 mx-auto" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white border border-slate-100 rounded-2xl p-6 sm:p-8 space-y-4 shadow-sm">
              <Skeleton variant="text" className="w-32 h-5" />
              <Skeleton variant="text" className="w-24 h-10" />
              <Skeleton variant="text" className="w-full h-12" />
              <div className="space-y-2 pt-3">
                {[1, 2, 3, 4].map((j) => (
                  <Skeleton key={j} variant="text" className="w-full h-3.5" />
                ))}
              </div>
              <Skeleton variant="button" className="w-full h-11 mt-3" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
