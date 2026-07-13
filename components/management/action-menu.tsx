"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { MoreHorizontal, type LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export interface ActionItem {
  label: string;
  icon: LucideIcon;
  destructive?: boolean;
  disabled?: boolean;
  onClick: () => void;
}

// Estimated menu height per item — used to decide whether to open upward.
const ITEM_HEIGHT = 32;
const MENU_PADDING = 8;
const GAP = 4;

export function ActionMenu({ actions, triggerClassName, triggerSize = 'icon-xs' }: { actions: ActionItem[]; triggerClassName?: string; triggerSize?: 'icon-xs' | 'icon-sm' | 'icon' }) {
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState<{ top?: number; bottom?: number; right: number }>({ top: 0, right: 0 });
  const containerRef = useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  const computePos = useCallback(() => {
    if (!containerRef.current) return;
    const r = containerRef.current.getBoundingClientRect();
    const right = window.innerWidth - r.right;
    const menuHeight = actions.length * ITEM_HEIGHT + MENU_PADDING;
    const spaceBelow = window.innerHeight - r.bottom;
    // Flip upward when there isn't enough room below the trigger.
    if (spaceBelow < menuHeight + GAP && r.top > spaceBelow) {
      setPos({ bottom: window.innerHeight - r.top + GAP, right });
    } else {
      setPos({ top: r.bottom + GAP, right });
    }
  }, [actions.length]);

  // Keep the menu glued to its trigger while scrolling/resizing.
  useEffect(() => {
    if (!open) return;
    const onChange = () => computePos();
    window.addEventListener('scroll', onChange, true);
    window.addEventListener('resize', onChange);
    return () => {
      window.removeEventListener('scroll', onChange, true);
      window.removeEventListener('resize', onChange);
    };
  }, [open, computePos]);

  const handleToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!open) computePos();
    setOpen((v) => !v);
  };

  return (
    <div ref={containerRef} onClick={e => e.stopPropagation()}>
      <Button variant="ghost" size={triggerSize} className={cn("cursor-pointer", triggerClassName)} onClick={handleToggle}>
        <MoreHorizontal size={14} />
      </Button>

      {mounted && createPortal(
        <AnimatePresence>
          {open && (
            <>
              <div className="fixed inset-0 z-[60]" onClick={() => setOpen(false)} />
              <motion.div
                style={{ position: "fixed", top: pos.top, bottom: pos.bottom, right: pos.right }}
                initial={{ opacity: 0, scale: 0.95, y: pos.bottom !== undefined ? 4 : -4 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: pos.bottom !== undefined ? 4 : -4 }}
                transition={{ duration: 0.12 }}
                className="z-[61] w-36 rounded-xl border bg-popover p-1 shadow-xl"
              >
                {actions.map((action) => {
                  const Icon = action.icon;
                  return (
                    <button
                      key={action.label}
                      disabled={action.disabled}
                      onClick={(e) => {
                        e.stopPropagation();
                        if (!action.disabled) {
                          action.onClick();
                          setOpen(false);
                        }
                      }}
                      className={cn(
                        "flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs transition-colors",
                        action.disabled
                          ? "cursor-not-allowed text-muted-foreground/50"
                          : action.destructive
                            ? "cursor-pointer text-destructive hover:bg-destructive/10"
                            : "cursor-pointer hover:bg-muted",
                      )}
                    >
                      <Icon size={11} />
                      {action.label}
                    </button>
                  );
                })}
              </motion.div>
            </>
          )}
        </AnimatePresence>,
        document.body,
      )}
    </div>
  );
}
