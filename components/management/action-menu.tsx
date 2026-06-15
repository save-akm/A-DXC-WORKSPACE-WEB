"use client";

import { useEffect, useRef, useState } from "react";
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

export function ActionMenu({ actions }: { actions: ActionItem[] }) {
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState({ top: 0, right: 0 });
  const containerRef = useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  const handleToggle = () => {
    if (!open && containerRef.current) {
      const r = containerRef.current.getBoundingClientRect();
      setPos({ top: r.bottom + 4, right: window.innerWidth - r.right });
    }
    setOpen((v) => !v);
  };

  return (
    <div ref={containerRef}>
      <Button variant="ghost" size="icon-sm" className="cursor-pointer" onClick={handleToggle}>
        <MoreHorizontal size={14} />
      </Button>

      {mounted && createPortal(
        <AnimatePresence>
          {open && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
              <motion.div
                style={{ position: "fixed", top: pos.top, right: pos.right }}
                initial={{ opacity: 0, scale: 0.95, y: -4 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: -4 }}
                transition={{ duration: 0.12 }}
                className="z-50 w-36 rounded-xl border bg-popover p-1 shadow-xl"
              >
                {actions.map((action) => {
                  const Icon = action.icon;
                  return (
                    <button
                      key={action.label}
                      disabled={action.disabled}
                      onClick={() => {
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
