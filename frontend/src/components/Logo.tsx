import React, { useState } from 'react';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg';
  showText?: boolean;
  variant?: 'light' | 'dark' | 'auto';
  className?: string;
}

export const Logo: React.FC<LogoProps> = ({ 
  size = 'md', 
  showText = true, 
  variant = 'auto', 
  className = '' 
}) => {
  const [imgError, setImgError] = useState(false);

  const dimensions = {
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-12 h-12'
  }[size];

  const textSizes = {
    sm: 'text-sm',
    md: 'text-base sm:text-lg',
    lg: 'text-lg sm:text-xl'
  }[size];

  const textColorClass = {
    dark: 'text-white',
    light: 'text-slate-900',
    auto: 'text-slate-900 dark:text-white'
  }[variant];

  const subtextColorClass = {
    dark: 'text-slate-400',
    light: 'text-slate-500',
    auto: 'text-slate-500 dark:text-slate-400'
  }[variant];

  return (
    <div className={`flex items-center gap-3 select-none ${className}`}>
      {/* Brand Icon Container */}
      <div className={`${dimensions} rounded-xl bg-white dark:bg-slate-900 p-1 flex items-center justify-center border border-slate-200 dark:border-slate-800 shadow-sm shrink-0 overflow-hidden`}>
        {!imgError ? (
          <img 
            src="/logo.png" 
            alt="Aravanta Logo" 
            onError={() => setImgError(true)}
            className="w-full h-full object-contain p-0.5" 
          />
        ) : (
          <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5 text-blue-600 dark:text-[#C9A84C]" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M17.5 19H9a7 7 0 1 1 6.71-9h1.79a4.5 4.5 0 1 1 0 9Z" />
            <path d="M12 13v4" stroke="#C9A84C" strokeWidth="2.5" />
          </svg>
        )}
      </div>

      {/* Brand Text */}
      {showText && (
        <div className="flex flex-col">
          <h1 className={`font-black ${textSizes} leading-none tracking-tight ${textColorClass} font-sans`}>
            Aravanta <span className="text-blue-500 dark:text-[#C9A84C]">CloudOS</span>
          </h1>
          <span className={`text-[9px] ${subtextColorClass} font-mono font-bold tracking-widest uppercase mt-0.5`}>
            Enterprise Console
          </span>
        </div>
      )}
    </div>
  );
};
