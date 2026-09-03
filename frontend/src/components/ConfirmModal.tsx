import React from 'react';
import { ModalPortal } from './ModalPortal';
import { AlertTriangle, AlertOctagon, CheckCircle2, X } from 'lucide-react';

interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'danger' | 'warning' | 'primary';
  isLoading?: boolean;
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirm Action',
  cancelText = 'Cancel',
  variant = 'danger',
  isLoading = false,
}) => {
  if (!isOpen) return null;

  const variantStyles = {
    danger: {
      icon: AlertOctagon,
      iconBg: 'bg-rose-100 dark:bg-rose-500/20 text-rose-600 dark:text-rose-400',
      btnBg: 'bg-rose-600 hover:bg-rose-700 text-white shadow-rose-600/25',
    },
    warning: {
      icon: AlertTriangle,
      iconBg: 'bg-amber-100 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400',
      btnBg: 'bg-amber-600 hover:bg-amber-700 text-white shadow-amber-600/25',
    },
    primary: {
      icon: CheckCircle2,
      iconBg: 'bg-[#C6923B]/15 text-[#C6923B] dark:text-[#E5B04E]',
      btnBg: 'bg-[#C6923B] hover:bg-[#B07B28] text-white shadow-md shadow-[#C6923B]/25',
    },
  }[variant];

  const Icon = variantStyles.icon;

  return (
    <ModalPortal isOpen={isOpen} onClose={onClose} maxWidth="max-w-md">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${variantStyles.iconBg}`}>
            <Icon className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">{title}</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Operational Safety Confirmation</p>
          </div>
        </div>
        <button
          onClick={onClose}
          disabled={isLoading}
          className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1.5 rounded-lg transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="mt-4 text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed bg-slate-50 dark:bg-slate-900/60 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800">
        {message}
      </div>

      <div className="flex items-center justify-end gap-3 mt-6">
        <button
          type="button"
          onClick={onClose}
          disabled={isLoading}
          className="px-4 py-2 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 transition-colors cursor-pointer"
        >
          {cancelText}
        </button>
        <button
          type="button"
          onClick={onConfirm}
          disabled={isLoading}
          className={`px-4 py-2 text-xs font-bold rounded-xl shadow-md transition-all cursor-pointer flex items-center gap-2 ${variantStyles.btnBg} ${isLoading ? 'opacity-70 cursor-not-allowed' : ''}`}
        >
          {isLoading ? (
            <>
              <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              <span>Processing...</span>
            </>
          ) : (
            confirmText
          )}
        </button>
      </div>
    </ModalPortal>
  );
};
