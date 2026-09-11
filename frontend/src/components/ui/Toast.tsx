import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useRef,
  useEffect,
  useId,
} from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
  Info,
  X,
} from 'lucide-react';

export type ToastVariant = 'success' | 'error' | 'warning' | 'info';

export interface Toast {
  id: string;
  title: string;
  description?: string;
  variant: ToastVariant;
  duration: number;
}

interface ToastContextValue {
  toasts: Toast[];
  addToast: (toast: Omit<Toast, 'id'>) => string;
  removeToast: (id: string) => void;
  clearToasts: () => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export const useToast = (): ToastContextValue => {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx;
};

const variantConfig: Record<ToastVariant, { icon: React.FC<any>; iconClass: string; borderClass: string; bgClass: string }> = {
  success: {
    icon: CheckCircle2,
    iconClass: 'text-emerald-500',
    borderClass: 'border-l-4 border-l-emerald-500',
    bgClass: 'bg-emerald-500/5',
  },
  error: {
    icon: AlertCircle,
    iconClass: 'text-rose-500',
    borderClass: 'border-l-4 border-l-rose-500',
    bgClass: 'bg-rose-500/5',
  },
  warning: {
    icon: AlertTriangle,
    iconClass: 'text-amber-500',
    borderClass: 'border-l-4 border-l-amber-500',
    bgClass: 'bg-amber-500/5',
  },
  info: {
    icon: Info,
    iconClass: 'text-brandGold-600 dark:text-brandGold-400',
    borderClass: 'border-l-4 border-l-brandGold-500',
    bgClass: 'bg-brandGold-500/5',
  },
};

export interface ToastProviderProps {
  children: React.ReactNode;
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left' | 'top-center' | 'bottom-center';
}

export const ToastProvider: React.FC<ToastProviderProps> = ({
  children,
  position = 'top-right',
}) => {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const timersRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());
  const baseId = useId();

  const clearTimer = useCallback((id: string) => {
    const timer = timersRef.current.get(id);
    if (timer) {
      clearTimeout(timer);
      timersRef.current.delete(id);
    }
  }, []);

  const removeToast = useCallback((id: string) => {
    clearTimer(id);
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, [clearTimer]);

  const addToast = useCallback(
    (toast: Omit<Toast, 'id'>): string => {
      const id = `${baseId}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
      const newToast: Toast = { ...toast, id };
      setToasts((prev) => [...prev, newToast]);

      if (newToast.duration > 0) {
        const timer = setTimeout(() => removeToast(id), newToast.duration);
        timersRef.current.set(id, timer);
      }

      return id;
    },
    [baseId, removeToast]
  );

  const clearToasts = useCallback(() => {
    timersRef.current.forEach((_, id) => clearTimer(id));
    setToasts([]);
  }, [clearTimer]);

  useEffect(() => {
    return () => {
      timersRef.current.forEach((_, id) => clearTimer(id));
      timersRef.current.clear();
    };
  }, [clearTimer]);

  const positionClass: Record<string, string> = {
    'top-right': 'top-4 right-4 sm:top-6 sm:right-6',
    'top-left': 'top-4 left-4 sm:top-6 sm:left-6',
    'bottom-right': 'bottom-4 right-4 sm:bottom-6 sm:right-6',
    'bottom-left': 'bottom-4 left-4 sm:bottom-6 sm:left-6',
    'top-center': 'top-4 left-1/2 -translate-x-1/2 sm:top-6',
    'bottom-center': 'bottom-4 left-1/2 -translate-x-1/2 sm:bottom-6',
  };

  return (
    <ToastContext.Provider value={{ toasts, addToast, removeToast, clearToasts }}>
      {children}
      {typeof document !== 'undefined' &&
        createPortal(
          <div
            aria-live="polite"
            aria-atomic="true"
            className={[
              'fixed z-[9999] w-[calc(100%-2rem)] sm:w-auto max-w-sm pointer-events-none',
              positionClass[position],
            ].join(' ')}
          >
            <div className="space-y-3">
              <AnimatePresence initial={false}>
                {toasts.map((toast) => {
                  const cfg = variantConfig[toast.variant];
                  const Icon = cfg.icon;
                  return (
                    <motion.div
                      key={toast.id}
                      layout
                      initial={{ opacity: 0, x: position.includes('right') ? 24 : position.includes('left') ? -24 : 0, y: position.includes('top') ? -24 : 24 }}
                      animate={{ opacity: 1, x: 0, y: 0 }}
                      exit={{ opacity: 0, x: position.includes('right') ? 24 : position.includes('left') ? -24 : 0, y: position.includes('top') ? -24 : 24, scale: 0.98 }}
                      transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
                      className={[
                        'pointer-events-auto relative overflow-hidden rounded-xl border shadow-lg backdrop-blur-sm',
                        'bg-white/95 dark:bg-brandObsidian-900/95',
                        cfg.borderClass,
                        cfg.bgClass,
                      ].join(' ')}
                    >
                      <div className="flex items-start gap-3 p-4">
                        <div className="shrink-0 pt-0.5">
                          <Icon className={['w-5 h-5', cfg.iconClass].join(' ')} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-bold text-brandObsidian-800 dark:text-white">
                            {toast.title}
                          </div>
                          {toast.description && (
                            <div className="mt-1 text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                              {toast.description}
                            </div>
                          )}
                        </div>
                        <button
                          onClick={() => removeToast(toast.id)}
                          className="shrink-0 p-1.5 -m-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-brandObsidian-800 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-brandGold-500/30"
                          aria-label="Dismiss toast"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
          </div>,
          document.body
        )}
    </ToastContext.Provider>
  );
};
