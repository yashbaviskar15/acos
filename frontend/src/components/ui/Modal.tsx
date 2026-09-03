import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
  useId,
} from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';

interface ModalContextValue {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  titleId: string;
  descriptionId: string;
}

const ModalContext = createContext<ModalContextValue | null>(null);

const useModalContext = (): ModalContextValue => {
  const ctx = useContext(ModalContext);
  if (!ctx) throw new Error('Modal components must be used within <Modal>');
  return ctx;
};

export interface ModalProps {
  defaultOpen?: boolean;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  children?: React.ReactNode;
}

export const Modal: React.FC<ModalProps> = ({
  defaultOpen = false,
  open,
  onOpenChange,
  children,
}) => {
  const isControlled = open !== undefined;
  const [internalOpen, setInternalOpen] = useState(defaultOpen);

  const isOpen = isControlled ? open! : internalOpen;
  const setIsOpen = useCallback(
    (next: boolean) => {
      if (!isControlled) setInternalOpen(next);
      onOpenChange?.(next);
    },
    [isControlled, onOpenChange]
  );

  const titleId = useId();
  const descriptionId = useId();

  return (
    <ModalContext.Provider value={{ isOpen, setIsOpen, titleId, descriptionId }}>
      {children}
    </ModalContext.Provider>
  );
};

export interface ModalTriggerProps {
  asChild?: boolean;
  children?: React.ReactElement;
}

export const ModalTrigger: React.FC<ModalTriggerProps> = ({
  asChild = false,
  children,
}) => {
  const { setIsOpen } = useModalContext();

  if (asChild && React.isValidElement(children)) {
    const mergedProps: any = {
      onClick: (e: React.MouseEvent) => {
        setIsOpen(true);
        (children.props as any).onClick?.(e);
      },
    };
    return React.cloneElement(children as React.ReactElement<any>, mergedProps);
  }

  return (
    <button type="button" onClick={() => setIsOpen(true)}>
      {children}
    </button>
  );
};

export interface ModalContentProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  children?: React.ReactNode;
  onClose?: () => void;
}

const sizeClasses = {
  sm: 'max-w-sm',
  md: 'max-w-lg',
  lg: 'max-w-2xl',
  xl: 'max-w-4xl',
};

export const ModalContent: React.FC<ModalContentProps> = ({
  size = 'md',
  className = '',
  children,
  onClose,
}) => {
  const { isOpen, setIsOpen, titleId, descriptionId } = useModalContext();
  const dialogRef = useRef<HTMLDivElement>(null);
  const previousFocus = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    previousFocus.current = document.activeElement as HTMLElement;
    return () => {
      previousFocus.current?.focus?.();
    };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const timer = setTimeout(() => {
      const focusable = dialogRef.current?.querySelector<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      focusable?.focus();
    }, 50);
    return () => clearTimeout(timer);
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsOpen(false);
        onClose?.();
      }
    };

    const handleTab = (e: KeyboardEvent) => {
      if (e.key !== 'Tab' || !dialogRef.current) return;
      const focusables = dialogRef.current.querySelectorAll<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      if (focusables.length === 0) return;
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };

    document.addEventListener('keydown', handleEscape);
    document.addEventListener('keydown', handleTab);
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.removeEventListener('keydown', handleTab);
      document.body.style.overflow = originalOverflow;
    };
  }, [isOpen, setIsOpen, onClose]);

  if (typeof document === 'undefined') return null;

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-[9998] bg-slate-950/60 backdrop-blur-sm"
            onClick={() => {
              setIsOpen(false);
              onClose?.();
            }}
          />
          <motion.div
            ref={dialogRef}
            role="dialog"
            aria-modal={true}
            aria-labelledby={titleId}
            aria-describedby={descriptionId}
            initial={{ opacity: 0, y: 8, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.98 }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            style={{ position: 'fixed', zIndex: 9999 }}
            className="inset-0 flex items-center justify-center p-4 sm:p-6"
          >
            <div
              className={[
                'relative w-full rounded-2xl border border-slate-200 dark:border-brandObsidian-700',
                'bg-white dark:bg-brandObsidian-800 shadow-2xl overflow-hidden',
                sizeClasses[size],
                className,
              ].join(' ')}
            >
              {children}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>,
    document.body
  );
};

export interface ModalCloseProps {
  className?: string;
  children?: React.ReactNode;
}

export const ModalClose: React.FC<ModalCloseProps> = ({
  className = '',
  children,
}) => {
  const { setIsOpen } = useModalContext();

  if (children) {
    return (
      <button
        type="button"
        onClick={() => setIsOpen(false)}
        className={className}
      >
        {children}
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={() => setIsOpen(false)}
      aria-label="Close modal"
      className={[
        'absolute top-4 right-4 z-10 p-2 rounded-lg',
        'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200',
        'hover:bg-slate-100 dark:hover:bg-brandObsidian-700',
        'focus:outline-none focus-visible:ring-2 focus-visible:ring-brandGold-500/50',
        'transition-colors',
        className,
      ].join(' ')}
    >
      <X className="w-5 h-5" />
    </button>
  );
};

export interface ModalHeaderProps {
  className?: string;
  children?: React.ReactNode;
}

export const ModalHeader: React.FC<ModalHeaderProps> = ({
  className = '',
  children,
}) => {
  return (
    <div
      className={[
        'px-6 pt-6 pb-4 border-b border-slate-200 dark:border-brandObsidian-700',
        className,
      ].join(' ')}
    >
      {children}
    </div>
  );
};

export interface ModalTitleProps {
  className?: string;
  children?: React.ReactNode;
}

export const ModalTitle: React.FC<ModalTitleProps> = ({
  className = '',
  children,
}) => {
  const { titleId } = useModalContext();
  return (
    <h2
      id={titleId}
      className={[
        'text-lg font-bold text-slate-900 dark:text-white tracking-tight',
        className,
      ].join(' ')}
    >
      {children}
    </h2>
  );
};

export interface ModalDescriptionProps {
  className?: string;
  children?: React.ReactNode;
}

export const ModalDescription: React.FC<ModalDescriptionProps> = ({
  className = '',
  children,
}) => {
  const { descriptionId } = useModalContext();
  return (
    <p
      id={descriptionId}
      className={[
        'mt-2 text-sm text-slate-600 dark:text-slate-300',
        className,
      ].join(' ')}
    >
      {children}
    </p>
  );
};

export interface ModalBodyProps {
  className?: string;
  children?: React.ReactNode;
}

export const ModalBody: React.FC<ModalBodyProps> = ({
  className = '',
  children,
}) => {
  return (
    <div className={['px-6 py-5', className].join(' ')}>
      {children}
    </div>
  );
};

export interface ModalFooterProps {
  className?: string;
  children?: React.ReactNode;
}

export const ModalFooter: React.FC<ModalFooterProps> = ({
  className = '',
  children,
}) => {
  return (
    <div
      className={[
        'px-6 py-4 border-t border-slate-200 dark:border-brandObsidian-700',
        'flex flex-col sm:flex-row gap-3 sm:justify-end',
        className,
      ].join(' ')}
    >
      {children}
    </div>
  );
};
