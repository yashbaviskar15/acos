import React from 'react';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';

interface DataTablePaginationProps {
  currentPage: number;
  pageSize: number;
  totalItems: number;
  onPageChange: (page: number) => void;
  onPageSizeChange?: (size: number) => void;
  pageSizeOptions?: number[];
  itemName?: string;
}

export const DataTablePagination: React.FC<DataTablePaginationProps> = ({
  currentPage,
  pageSize,
  totalItems,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions = [5, 10, 25, 50],
  itemName = 'entries'
}) => {
  if (totalItems === 0) return null;

  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const validPage = Math.min(Math.max(1, currentPage), totalPages);
  const startItem = (validPage - 1) * pageSize + 1;
  const endItem = Math.min(validPage * pageSize, totalItems);

  // Generate visible page numbers
  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    if (totalPages <= 5) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      if (validPage > 3) pages.push('...');
      const start = Math.max(2, validPage - 1);
      const end = Math.min(totalPages - 1, validPage + 1);
      for (let i = start; i <= end; i++) pages.push(i);
      if (validPage < totalPages - 2) pages.push('...');
      pages.push(totalPages);
    }
    return pages;
  };

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-slate-200 dark:border-slate-800 text-xs font-mono">
      {/* Showing count and page size selector */}
      <div className="flex items-center gap-3 text-slate-500 dark:text-slate-400 flex-wrap justify-center sm:justify-start">
        <span>
          Showing <strong className="text-slate-800 dark:text-slate-200">{startItem}</strong> to{' '}
          <strong className="text-slate-800 dark:text-slate-200">{endItem}</strong> of{' '}
          <strong className="text-slate-800 dark:text-slate-200">{totalItems}</strong> {itemName}
        </span>

        {onPageSizeChange && (
          <div className="flex items-center gap-1.5 ml-1">
            <span className="text-[11px]">Rows:</span>
            <select
              value={pageSize}
              onChange={(e) => {
                onPageSizeChange(Number(e.target.value));
                onPageChange(1);
              }}
              className="px-2 py-1 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-700 dark:text-slate-200 text-xs font-bold cursor-pointer focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              {pageSizeOptions.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Navigation Buttons */}
      <div className="flex items-center gap-1">
        <button
          onClick={() => onPageChange(1)}
          disabled={validPage === 1}
          className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-40 disabled:pointer-events-none transition cursor-pointer"
          title="First page"
        >
          <ChevronsLeft className="w-3.5 h-3.5" />
        </button>

        <button
          onClick={() => onPageChange(validPage - 1)}
          disabled={validPage === 1}
          className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-40 disabled:pointer-events-none transition cursor-pointer"
          title="Previous page"
        >
          <ChevronLeft className="w-3.5 h-3.5" />
        </button>

        {/* Numeric page pills */}
        <div className="flex items-center gap-1 mx-1">
          {getPageNumbers().map((p, idx) =>
            typeof p === 'number' ? (
              <button
                key={idx}
                onClick={() => onPageChange(p)}
                className={`min-w-[28px] h-7 px-2 rounded-lg text-xs font-bold transition cursor-pointer ${
                  p === validPage
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700'
                }`}
              >
                {p}
              </button>
            ) : (
              <span key={idx} className="px-1 text-slate-400">
                {p}
              </span>
            )
          )}
        </div>

        <button
          onClick={() => onPageChange(validPage + 1)}
          disabled={validPage === totalPages}
          className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-40 disabled:pointer-events-none transition cursor-pointer"
          title="Next page"
        >
          <ChevronRight className="w-3.5 h-3.5" />
        </button>

        <button
          onClick={() => onPageChange(totalPages)}
          disabled={validPage === totalPages}
          className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-40 disabled:pointer-events-none transition cursor-pointer"
          title="Last page"
        >
          <ChevronsRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
