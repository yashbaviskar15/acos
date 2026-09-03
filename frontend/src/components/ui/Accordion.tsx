import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useId,
  useMemo,
} from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown } from 'lucide-react';

interface AccordionContextValue {
  openItems: Set<string>;
  toggleItem: (value: string) => void;
  type: 'single' | 'multiple';
  baseId: string;
}

const AccordionContext = createContext<AccordionContextValue | null>(null);

const useAccordionContext = (): AccordionContextValue => {
  const ctx = useContext(AccordionContext);
  if (!ctx) throw new Error('Accordion components must be used within <Accordion>');
  return ctx;
};

export interface AccordionProps {
  type?: 'single' | 'multiple';
  defaultValue?: string | string[];
  value?: string | string[];
  onValueChange?: (value: string | string[]) => void;
  className?: string;
  children?: React.ReactNode;
}

export const Accordion: React.FC<AccordionProps> = ({
  type = 'single',
  defaultValue,
  value,
  onValueChange,
  className = '',
  children,
}) => {
  const isControlled = value !== undefined;

  const initialSet = (() => {
    const initValue = isControlled ? value : defaultValue;
    if (Array.isArray(initValue)) return new Set(initValue);
    if (typeof initValue === 'string') return new Set([initValue]);
    return new Set<string>();
  })();

  const [internalOpen, setInternalOpen] = useState<Set<string>>(initialSet);

  const openItems = useMemo(
    () =>
      isControlled
        ? Array.isArray(value)
          ? new Set(value)
          : typeof value === 'string'
          ? new Set([value])
          : new Set<string>()
        : internalOpen,
    [isControlled, value, internalOpen]
  );

  const toggleItem = useCallback(
    (itemValue: string) => {
      let next = new Set(openItems);
      if (type === 'single') {
        if (next.has(itemValue)) {
          next.delete(itemValue);
        } else {
          next = new Set([itemValue]);
        }
        const result = type === 'single'
          ? (next.size === 0 ? '' : Array.from(next)[0])
          : Array.from(next);
        if (!isControlled) setInternalOpen(next);
        onValueChange?.(result as any);
      } else {
        if (next.has(itemValue)) next.delete(itemValue);
        else next.add(itemValue);
        if (!isControlled) setInternalOpen(next);
        onValueChange?.(Array.from(next));
      }
    },
    [openItems, type, isControlled, onValueChange]
  );

  const baseId = useId();

  return (
    <AccordionContext.Provider value={{ openItems, toggleItem, type, baseId }}>
      <div className={['space-y-3', className].join(' ')}>{children}</div>
    </AccordionContext.Provider>
  );
};

export interface AccordionItemProps {
  value: string;
  className?: string;
  children?: React.ReactNode;
}

export const AccordionItem: React.FC<AccordionItemProps> = ({
  value,
  className = '',
  children,
}) => {
  return (
    <div
      data-accordion-item={value}
      className={[
        'bg-white dark:bg-brandObsidian-800 border border-slate-200 dark:border-brandObsidian-700 rounded-2xl overflow-hidden shadow-card hover:border-slate-300 dark:hover:border-brandObsidian-600 transition-colors',
        className,
      ].join(' ')}
    >
      {children}
    </div>
  );
};

export interface AccordionHeaderProps {
  value: string;
  className?: string;
  children?: React.ReactNode;
}

export const AccordionHeader: React.FC<AccordionHeaderProps> = ({
  value,
  className = '',
  children,
}) => {
  const { openItems, toggleItem, baseId } = useAccordionContext();
  const isOpen = openItems.has(value);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      toggleItem(value);
    }
  };

  return (
    <h3>
      <button
        type="button"
        id={`${baseId}-trigger-${value}`}
        aria-expanded={isOpen}
        aria-controls={`${baseId}-content-${value}`}
        onClick={() => toggleItem(value)}
        onKeyDown={handleKeyDown}
        className={[
          'w-full flex items-center justify-between gap-4 px-6 py-5 text-left',
          'text-sm font-semibold text-slate-900 dark:text-slate-100',
          'hover:bg-slate-50 dark:hover:bg-brandObsidian-700/40 transition-colors',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brandGold-500/50 focus-visible:ring-inset',
          className,
        ].join(' ')}
      >
        <span className="pr-2">{children}</span>
        <motion.span
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.25, ease: 'easeOut' }}
          className="shrink-0 text-brandGold-500"
        >
          <ChevronDown className="w-5 h-5" />
        </motion.span>
      </button>
    </h3>
  );
};

export interface AccordionBodyProps {
  value: string;
  className?: string;
  children?: React.ReactNode;
}

export const AccordionBody: React.FC<AccordionBodyProps> = ({
  value,
  className = '',
  children,
}) => {
  const { openItems, baseId } = useAccordionContext();
  const isOpen = openItems.has(value);

  return (
    <AnimatePresence initial={false}>
      {isOpen && (
        <motion.div
          id={`${baseId}-content-${value}`}
          role="region"
          aria-labelledby={`${baseId}-trigger-${value}`}
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
          className="overflow-hidden"
        >
          <div
            className={[
              'px-6 pb-6 pt-0 text-sm text-slate-600 dark:text-slate-300 leading-relaxed',
              className,
            ].join(' ')}
          >
            {children}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
