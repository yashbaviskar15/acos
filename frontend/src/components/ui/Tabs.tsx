import React, {
  createContext,
  useContext,
  useState,
  useRef,
  useCallback,
  useId,
} from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface TabsContextValue {
  activeTab: string;
  setActiveTab: (value: string) => void;
  baseId: string;
  orientation?: 'horizontal' | 'vertical';
}

const TabsContext = createContext<TabsContextValue | null>(null);

const useTabsContext = (): TabsContextValue => {
  const ctx = useContext(TabsContext);
  if (!ctx) throw new Error('Tabs components must be used within <TabContainer>');
  return ctx;
};

export interface TabContainerProps {
  defaultValue?: string;
  value?: string;
  onValueChange?: (value: string) => void;
  orientation?: 'horizontal' | 'vertical';
  className?: string;
  children?: React.ReactNode;
}

export const TabContainer: React.FC<TabContainerProps> = ({
  defaultValue,
  value,
  onValueChange,
  orientation = 'horizontal',
  className = '',
  children,
}) => {
  const isControlled = value !== undefined;
  const [internalValue, setInternalValue] = useState<string>(() => {
    if (defaultValue !== undefined) return defaultValue;
    const firstTab = React.Children.toArray(children)[0];
    if (firstTab && React.isValidElement(firstTab)) {
      const tabList = (firstTab.props as any).children;
      const firstTabChild = React.Children.toArray(tabList)[0];
      if (firstTabChild && React.isValidElement(firstTabChild)) {
        return (firstTabChild.props as any).value ?? '';
      }
    }
    return '';
  });

  const activeTab = isControlled ? value! : internalValue;
  const setActiveTab = useCallback(
    (v: string) => {
      if (!isControlled) setInternalValue(v);
      onValueChange?.(v);
    },
    [isControlled, onValueChange]
  );

  const baseId = useId();

  return (
    <TabsContext.Provider value={{ activeTab, setActiveTab, baseId, orientation }}>
      <div className={className}>{children}</div>
    </TabsContext.Provider>
  );
};

export interface TabListProps {
  className?: string;
  children?: React.ReactNode;
}

export const TabList: React.FC<TabListProps> = ({ className = '', children }) => {
  const { orientation, activeTab, setActiveTab } = useTabsContext();
  const listRef = useRef<HTMLDivElement>(null);

  const getTabs = (): HTMLElement[] => {
    if (!listRef.current) return [];
    return Array.from(listRef.current.querySelectorAll<HTMLElement>('[data-tab-value]'));
  };

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      const tabs = getTabs();
      if (tabs.length === 0) return;
      const currentIdx = tabs.findIndex((t) => t.dataset.tabValue === activeTab);
      let nextIdx = currentIdx;

      const nextKeys =
        orientation === 'horizontal'
          ? { next: 'ArrowRight', prev: 'ArrowLeft' }
          : { next: 'ArrowDown', prev: 'ArrowUp' };

      if (e.key === nextKeys.next) {
        nextIdx = (currentIdx + 1) % tabs.length;
      } else if (e.key === nextKeys.prev) {
        nextIdx = (currentIdx - 1 + tabs.length) % tabs.length;
      } else if (e.key === 'Home') {
        nextIdx = 0;
      } else if (e.key === 'End') {
        nextIdx = tabs.length - 1;
      } else {
        return;
      }

      e.preventDefault();
      const nextValue = tabs[nextIdx].dataset.tabValue;
      if (nextValue) {
        setActiveTab(nextValue);
        tabs[nextIdx].focus();
      }
    },
    [activeTab, orientation, setActiveTab]
  );

  return (
    <div
      ref={listRef}
      role="tablist"
      aria-orientation={orientation}
      onKeyDown={handleKeyDown}
      className={[
        'inline-flex p-1 rounded-xl bg-slate-100 dark:bg-brandObsidian-800/70 border border-slate-200 dark:border-brandObsidian-700',
        orientation === 'vertical' ? 'flex-col' : 'flex-row w-auto',
        className,
      ].join(' ')}
    >
      {children}
    </div>
  );
};

export interface TabProps {
  value: string;
  disabled?: boolean;
  className?: string;
  children?: React.ReactNode;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Tab: React.FC<TabProps> = ({
  value,
  disabled = false,
  className = '',
  children,
  leftIcon,
  rightIcon,
}) => {
  const { activeTab, setActiveTab, baseId } = useTabsContext();
  const isActive = activeTab === value;

  return (
    <button
      type="button"
      role="tab"
      id={`${baseId}-tab-${value}`}
      aria-selected={isActive}
      aria-controls={`${baseId}-panel-${value}`}
      tabIndex={isActive ? 0 : -1}
      disabled={disabled}
      data-tab-value={value}
      onClick={() => !disabled && setActiveTab(value)}
      className={[
        'relative z-10 inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-semibold rounded-lg transition-colors duration-200 outline-none',
        'focus-visible:ring-2 focus-visible:ring-brandGold-500/50 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-brandObsidian-950',
        isActive
          ? 'text-brandGold-600 dark:text-brandGold-400'
          : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200',
        disabled && 'opacity-50 cursor-not-allowed',
        className,
      ].join(' ')}
    >
      {isActive && (
        <motion.span
          layoutId={`${baseId}-tab-indicator`}
          className="absolute inset-0 rounded-lg bg-white dark:bg-brandObsidian-950 shadow-sm border border-slate-200 dark:border-brandObsidian-700"
          transition={{ type: 'spring', stiffness: 500, damping: 40 }}
        />
      )}
      <span className="relative z-10 whitespace-nowrap inline-flex items-center gap-2">
        {leftIcon && <span className="shrink-0">{leftIcon}</span>}
        {children}
        {rightIcon && <span className="shrink-0">{rightIcon}</span>}
      </span>
    </button>
  );
};

export interface TabPanelProps {
  value: string;
  className?: string;
  children?: React.ReactNode;
}

export const TabPanel: React.FC<TabPanelProps> = ({ value, className = '', children }) => {
  const { activeTab, baseId } = useTabsContext();
  const isActive = activeTab === value;

  return (
    <div
      role="tabpanel"
      id={`${baseId}-panel-${value}`}
      aria-labelledby={`${baseId}-tab-${value}`}
      hidden={!isActive}
      className={className}
    >
      <AnimatePresence mode="wait">
        {isActive && (
          <motion.div
            key={value}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
          >
            {children}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
