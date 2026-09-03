import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';

export interface TooltipProps {
  content: React.ReactNode;
  children: React.ReactElement;
  side?: 'top' | 'bottom' | 'left' | 'right';
  delay?: number;
  className?: string;
}

export const Tooltip: React.FC<TooltipProps> = ({
  content,
  children,
  side = 'top',
  delay = 150,
  className = '',
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [coords, setCoords] = useState({ top: 0, left: 0 });
  const triggerRef = useRef<HTMLElement>(null);
  const timeoutRef = useRef<number | null>(null);

  const updatePosition = () => {
    if (triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      let top = 0;
      let left = 0;

      switch (side) {
        case 'top':
          top = rect.top - 8;
          left = rect.left + rect.width / 2;
          break;
        case 'bottom':
          top = rect.bottom + 8;
          left = rect.left + rect.width / 2;
          break;
        case 'left':
          top = rect.top + rect.height / 2;
          left = rect.left - 8;
          break;
        case 'right':
          top = rect.top + rect.height / 2;
          left = rect.right + 8;
          break;
      }

      setCoords({ top, left });
    }
  };

  const show = () => {
    if (timeoutRef.current) window.clearTimeout(timeoutRef.current);
    timeoutRef.current = window.setTimeout(() => {
      updatePosition();
      setIsVisible(true);
    }, delay);
  };

  const hide = () => {
    if (timeoutRef.current) window.clearTimeout(timeoutRef.current);
    setIsVisible(false);
  };

  useEffect(() => {
    return () => {
      if (timeoutRef.current) window.clearTimeout(timeoutRef.current);
    };
  }, []);

  const childWithRef = React.cloneElement(children, {
    ref: (node: HTMLElement) => {
      (triggerRef as React.MutableRefObject<HTMLElement | null>).current = node;
      const { ref } = children as any;
      if (typeof ref === 'function') ref(node);
      else if (ref) ref.current = node;
    },
    onMouseEnter: (e: React.MouseEvent) => {
      show();
      children.props.onMouseEnter?.(e);
    },
    onMouseLeave: (e: React.MouseEvent) => {
      hide();
      children.props.onMouseLeave?.(e);
    },
    onFocus: (e: React.FocusEvent) => {
      show();
      children.props.onFocus?.(e);
    },
    onBlur: (e: React.FocusEvent) => {
      hide();
      children.props.onBlur?.(e);
    },
  });

  const positionClasses = {
    top: 'transform -translate-x-1/2 -translate-y-full mb-2',
    bottom: 'transform -translate-x-1/2 mt-2',
    left: 'transform -translate-x-full -translate-y-1/2 mr-2',
    right: 'transform translate-x-0 -translate-y-1/2 ml-2',
  };

  return (
    <>
      {childWithRef}
      {isVisible &&
        typeof document !== 'undefined' &&
        createPortal(
          <div
            role="tooltip"
            style={{ top: coords.top, left: coords.left, position: 'fixed', zIndex: 9999 }}
            className={[
              'pointer-events-none animate-fade-in',
              positionClasses[side],
              className,
            ].join(' ')}
          >
            <div className="px-3 py-1.5 text-xs font-medium text-white bg-brandObsidian-900 dark:bg-brandObsidian-700 rounded-lg shadow-lg border border-brandObsidian-700 dark:border-brandObsidian-600 whitespace-nowrap">
              {content}
            </div>
          </div>,
          document.body
        )}
    </>
  );
};
