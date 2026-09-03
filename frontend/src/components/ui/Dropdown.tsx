import React, {
  createContext,
  useContext,
  useState,
  useRef,
  useEffect,
  useCallback,
  useId,
} from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';

interface DropdownContextValue {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  triggerRef: React.RefObject<HTMLElement | null>;
  menuId: string;
  align?: 'start' | 'center' | 'end';
  side?: 'top' | 'bottom';
}

const DropdownContext = createContext<DropdownContextValue | null>(null);

const useDropdownContext = (): DropdownContextValue => {
  const ctx = useContext(DropdownContext);
  if (!ctx) throw new Error('Dropdown components must be used within <Dropdown>');
  return ctx;
};

export interface DropdownProps {
  defaultOpen?: boolean;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  align?: 'start' | 'center' | 'end';
  side?: 'top' | 'bottom';
  className?: string;
  children?: React.ReactNode;
}

export const Dropdown: React.FC<DropdownProps> = ({
  defaultOpen = false,
  open,
  onOpenChange,
  align = 'end',
  side = 'bottom',
  className = '',
  children,
}) => {
  const isControlled = open !== undefined;
  const [internalOpen, setInternalOpen] = useState(defaultOpen);
  const triggerRef = useRef<HTMLElement | null>(null);

  const isOpen = isControlled ? open! : internalOpen;
  const setIsOpen = useCallback(
    (next: boolean) => {
      if (!isControlled) setInternalOpen(next);
      onOpenChange?.(next);
    },
    [isControlled, onOpenChange]
  );

  const menuId = useId();

  return (
    <DropdownContext.Provider
      value={{ isOpen, setIsOpen, triggerRef, menuId, align, side }}
    >
      <div className={['relative inline-block', className].join(' ')}>
        {children}
      </div>
    </DropdownContext.Provider>
  );
};

export interface DropdownTriggerProps {
  asChild?: boolean;
  children?: React.ReactElement;
}

export const DropdownTrigger: React.FC<DropdownTriggerProps> = ({
  asChild = false,
  children,
}) => {
  const { isOpen, setIsOpen, triggerRef, menuId } = useDropdownContext();

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsOpen(!isOpen);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown' || (e.key === 'Enter' && !isOpen)) {
      e.preventDefault();
      setIsOpen(true);
      setTimeout(() => {
        const menu = document.getElementById(menuId);
        const firstItem = menu?.querySelector<HTMLElement>('[data-dropdown-item]');
        firstItem?.focus();
      }, 0);
    }
  };

  if (asChild && React.isValidElement(children)) {
    const mergedProps: any = {
      ref: (node: HTMLElement) => {
        (triggerRef as React.MutableRefObject<HTMLElement | null>).current = node;
        const { ref: originalRef } = children as any;
        if (typeof originalRef === 'function') originalRef(node);
        else if (originalRef) originalRef.current = node;
      },
      'aria-haspopup': true,
      'aria-expanded': isOpen,
      onClick: (e: React.MouseEvent) => {
        handleClick(e);
        (children.props as any).onClick?.(e);
      },
      onKeyDown: (e: React.KeyboardEvent) => {
        handleKeyDown(e);
        (children.props as any).onKeyDown?.(e);
      },
    };
    return React.cloneElement(children as React.ReactElement<any>, mergedProps);
  }

  return (
    <button
      ref={triggerRef as React.RefObject<HTMLButtonElement>}
      type="button"
      aria-haspopup={true}
      aria-expanded={isOpen}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
    >
      {children}
    </button>
  );
};

export interface DropdownMenuProps {
  className?: string;
  children?: React.ReactNode;
}

export const DropdownMenu: React.FC<DropdownMenuProps> = ({
  className = '',
  children,
}) => {
  const { isOpen, setIsOpen, triggerRef, menuId, align, side } = useDropdownContext();
  const menuRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState({ top: 0, left: 0, width: 0 });

  useEffect(() => {
    if (!isOpen) return;

    const updatePosition = () => {
      if (triggerRef.current && menuRef.current) {
        const triggerRect = triggerRef.current.getBoundingClientRect();
        const menuRect = menuRef.current.getBoundingClientRect();
        let left = triggerRect.left;
        let top: number;

        if (align === 'end') {
          left = triggerRect.right - menuRect.width;
        } else if (align === 'center') {
          left = triggerRect.left + (triggerRect.width - menuRect.width) / 2;
        }

        left = Math.max(8, Math.min(left, window.innerWidth - menuRect.width - 8));

        if (side === 'bottom') {
          top = triggerRect.bottom + 8;
        } else {
          top = triggerRect.top - menuRect.height - 8;
        }

        setPosition({ top, left, width: Math.max(triggerRect.width, 180) });
      }
    };

    updatePosition();
    window.addEventListener('scroll', updatePosition, true);
    window.addEventListener('resize', updatePosition);

    return () => {
      window.removeEventListener('scroll', updatePosition, true);
      window.removeEventListener('resize', updatePosition);
    };
  }, [isOpen, align, side, triggerRef]);

  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node;
      if (
        triggerRef.current &&
        !triggerRef.current.contains(target) &&
        menuRef.current &&
        !menuRef.current.contains(target)
      ) {
        setIsOpen(false);
      }
    };

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsOpen(false);
        (triggerRef.current as HTMLElement)?.focus();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen, setIsOpen, triggerRef]);

  if (typeof document === 'undefined') return null;

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <motion.div
          id={menuId}
          ref={menuRef}
          role="menu"
          style={{
            position: 'fixed',
            top: position.top,
            left: position.left,
            minWidth: position.width,
            zIndex: 9999,
          }}
          initial={{ opacity: 0, y: side === 'bottom' ? -6 : 6, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: side === 'bottom' ? -4 : 4, scale: 0.97 }}
          transition={{ duration: 0.15, ease: 'easeOut' }}
          className={[
            'overflow-hidden rounded-xl border border-slate-200 dark:border-brandObsidian-700',
            'bg-white dark:bg-brandObsidian-800 shadow-lg p-1.5',
            className,
          ].join(' ')}
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
};

export interface DropdownItemProps {
  onSelect?: () => void;
  disabled?: boolean;
  className?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  children?: React.ReactNode;
}

export const DropdownItem: React.FC<DropdownItemProps> = ({
  onSelect,
  disabled = false,
  className = '',
  leftIcon,
  rightIcon,
  children,
}) => {
  const { setIsOpen } = useDropdownContext();

  const handleClick = () => {
    if (disabled) return;
    onSelect?.();
    setIsOpen(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleClick();
    }
  };

  return (
    <button
      type="button"
      role="menuitem"
      data-dropdown-item
      disabled={disabled}
      tabIndex={disabled ? -1 : 0}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      className={[
        'w-full flex items-center gap-3 px-3 py-2.5 text-sm rounded-lg text-left',
        'text-slate-700 dark:text-slate-200',
        'hover:bg-slate-100 dark:hover:bg-brandObsidian-700/70 hover:text-slate-900 dark:hover:text-white',
        'focus:outline-none focus-visible:bg-slate-100 dark:focus-visible:bg-brandObsidian-700/70',
        disabled && 'opacity-50 cursor-not-allowed hover:bg-transparent dark:hover:bg-transparent',
        className,
      ].join(' ')}
    >
      {leftIcon && <span className="shrink-0 text-slate-500 dark:text-slate-400">{leftIcon}</span>}
      <span className="flex-1 min-w-0">{children}</span>
      {rightIcon && <span className="shrink-0 text-slate-400">{rightIcon}</span>}
    </button>
  );
};

export interface DropdownSeparatorProps {
  className?: string;
}

export const DropdownSeparator: React.FC<DropdownSeparatorProps> = ({
  className = '',
}) => {
  return (
    <div
      role="separator"
      className={['my-1.5 h-px bg-slate-200 dark:bg-brandObsidian-700', className].join(' ')}
    />
  );
};

export interface DropdownLabelProps {
  className?: string;
  children?: React.ReactNode;
}

export const DropdownLabel: React.FC<DropdownLabelProps> = ({
  className = '',
  children,
}) => {
  return (
    <div
      className={[
        'px-3 py-2 text-[11px] font-semibold uppercase tracking-wider',
        'text-slate-500 dark:text-slate-400',
        className,
      ].join(' ')}
    >
      {children}
    </div>
  );
};
