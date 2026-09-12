import React from 'react';
import { ChevronRight, Home } from 'lucide-react';

export interface BreadcrumbItem {
  label: string;
  href?: string;
  onClick?: () => void;
}

export interface BreadcrumbsProps {
  items: BreadcrumbItem[];
  showHome?: boolean;
  onHomeClick?: () => void;
  className?: string;
}

export const Breadcrumbs: React.FC<BreadcrumbsProps> = ({
  items,
  showHome = true,
  onHomeClick,
  className = '',
}) => {
  return (
    <nav
      aria-label="Breadcrumb"
      className={['flex flex-wrap items-center gap-1 text-sm text-slate-500 dark:text-slate-400', className].join(' ')}
    >
      <ol className="flex flex-wrap items-center gap-1 min-w-0">
        {showHome && (
          <li className="flex items-center shrink-0">
            <button
              type="button"
              onClick={() => {
                if (typeof window !== 'undefined') {
                  window.scrollTo({ top: 0, behavior: 'auto' });
                }
                if (onHomeClick) {
                  onHomeClick();
                } else if (items[0]?.onClick) {
                  items[0].onClick();
                }
              }}
              className="inline-flex items-center gap-1 h-8 px-2 rounded-lg hover:bg-brandGold-50 dark:hover:bg-brandObsidian-800 hover:text-brandGold-600 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-brandGold-500/30 cursor-pointer"
            >
              <Home className="w-3.5 h-3.5" />
              <span className="hidden xs:inline font-medium">Home</span>
            </button>
          </li>
        )}
        {showHome && items.length > 0 && (
          <li className="flex items-center shrink-0 px-0.5">
            <ChevronRight className="w-3.5 h-3.5 text-brandObsidian-400" />
          </li>
        )}
        {items.map((item, index) => {
          const isLast = index === items.length - 1;
          return (
            <li key={`${item.label}-${index}`} className="flex items-center min-w-0">
              {isLast ? (
                <span className="inline-flex items-center h-8 px-2 rounded-lg bg-brandGold-50 dark:bg-brandObsidian-800 text-brandGold-700 dark:text-brandGold-400 font-semibold truncate max-w-[200px]">
                  {item.label}
                </span>
              ) : (
                <>
                  <button
                    onClick={item.onClick}
                    className="inline-flex items-center h-8 px-2 rounded-lg hover:bg-brandGold-50 dark:hover:bg-brandObsidian-800 hover:text-brandGold-600 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-brandGold-500/30 font-medium truncate max-w-[150px]"
                  >
                    {item.label}
                  </button>
                  {index < items.length - 1 && (
                    <span className="flex items-center shrink-0 px-0.5">
                      <ChevronRight className="w-3.5 h-3.5 text-brandObsidian-400" />
                    </span>
                  )}
                </>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
};
