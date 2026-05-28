'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { useRef, useState, useSyncExternalStore, type ReactNode } from 'react';
import { createPortal } from 'react-dom';

const noop = () => () => {};
const useIsClient = () =>
  useSyncExternalStore(
    noop,
    () => true,
    () => false,
  );

interface SidebarHoverPopoverProps {
  label: ReactNode;
  enabled: boolean;
  variant?: 'tooltip' | 'card';
  children: ReactNode;
}

export function SidebarHoverPopover({
  label,
  enabled,
  variant = 'tooltip',
  children,
}: SidebarHoverPopoverProps) {
  const triggerRef = useRef<HTMLDivElement | null>(null);
  const [open, setOpen] = useState(false);
  const [coords, setCoords] = useState<{ top: number; left: number } | null>(null);
  const isClient = useIsClient();

  const show = () => {
    if (!enabled || !triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    setCoords({ top: rect.top + rect.height / 2, left: rect.right + 8 });
    setOpen(true);
  };
  const hide = () => setOpen(false);

  return (
    <div
      ref={triggerRef}
      className="relative"
      onMouseEnter={show}
      onMouseLeave={hide}
      onFocus={show}
      onBlur={hide}
    >
      {children}
      {isClient
        ? createPortal(
            <AnimatePresence>
              {enabled && open && coords ? (
                <motion.div
                  key="popover"
                  initial={{ opacity: 0, x: -4 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -4 }}
                  transition={{ duration: 0.12, ease: 'easeOut' }}
                  role="tooltip"
                  style={{ top: coords.top, left: coords.left, transform: 'translateY(-50%)' }}
                  className={
                    variant === 'card'
                      ? 'pointer-events-none fixed z-50 w-64 rounded-xl border border-border bg-popover/95 p-3 text-sm text-popover-foreground shadow-xl backdrop-blur-sm'
                      : 'pointer-events-none fixed z-50 whitespace-nowrap rounded-md border border-border bg-popover px-2.5 py-1.5 text-xs font-medium text-popover-foreground shadow-lg'
                  }
                >
                  {label}
                </motion.div>
              ) : null}
            </AnimatePresence>,
            document.body,
          )
        : null}
    </div>
  );
}
