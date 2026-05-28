'use client';

import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Keyboard, X } from 'lucide-react';
import { useSidebarUIStore } from '@/lib/stores/sidebar-ui-store';

interface Shortcut {
  keys: string[];
  description: string;
}

const shortcuts: { group: string; items: Shortcut[] }[] = [
  {
    group: 'Navigation',
    items: [
      { keys: ['⌘', 'K'], description: 'Open command palette' },
      { keys: ['G', 'D'], description: 'Go to Dashboard' },
      { keys: ['G', 'I'], description: 'Go to Inbox' },
      { keys: ['G', 'M'], description: 'Go to My Issues' },
      { keys: ['G', 'P'], description: 'Go to Projects' },
    ],
  },
  {
    group: 'Sidebar',
    items: [
      { keys: ['⌘', 'B'], description: 'Toggle sidebar' },
      { keys: ['⌘', 'Shift', 'B'], description: 'Collapse to icons' },
    ],
  },
  {
    group: 'Actions',
    items: [
      { keys: ['C'], description: 'Create new issue' },
      { keys: ['/'], description: 'Focus search' },
      { keys: ['⌘', '/'], description: 'Show this panel' },
      { keys: ['?'], description: 'Show this panel (alt)' },
    ],
  },
];

export function ShortcutsPanel() {
  const [open, setOpen] = useState(false);
  const toggleCollapsed = useSidebarUIStore((s) => s.toggleCollapsed);

  useEffect(() => {
    const onKeydown = (e: KeyboardEvent) => {
      // Cmd+/ or Ctrl+/ or "?" toggles panel
      if (((e.metaKey || e.ctrlKey) && e.key === '/') || (e.key === '?' && !e.metaKey && !e.ctrlKey && !isTypingTarget(e.target))) {
        e.preventDefault();
        setOpen((v) => !v);
        return;
      }
      // Escape closes panel
      if (e.key === 'Escape') setOpen(false);
      // Cmd+B toggle sidebar
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'b' && !e.shiftKey) {
        e.preventDefault();
        toggleCollapsed();
      }
    };
    window.addEventListener('keydown', onKeydown);
    return () => window.removeEventListener('keydown', onKeydown);
  }, [toggleCollapsed]);

  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          key="backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18 }}
          onClick={() => setOpen(false)}
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
        >
          <motion.div
            key="panel"
            initial={{ opacity: 0, scale: 0.95, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 8 }}
            transition={{ type: 'spring', stiffness: 360, damping: 28 }}
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-lg overflow-hidden rounded-2xl border border-border bg-popover text-popover-foreground shadow-2xl"
          >
            <div className="flex items-center gap-2 border-b border-border/60 bg-gradient-to-r from-violet-500/15 via-sky-500/10 to-fuchsia-500/15 px-5 py-3">
              <Keyboard className="size-4 text-sky-300" />
              <h2 className="flex-1 text-sm font-semibold">Keyboard Shortcuts</h2>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Close"
                className="inline-flex size-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent/50 hover:text-foreground"
              >
                <X className="size-4" />
              </button>
            </div>

            <div className="grid max-h-[60vh] gap-4 overflow-y-auto p-5 sm:grid-cols-2">
              {shortcuts.map((section) => (
                <div key={section.group} className="flex flex-col gap-2">
                  <h3 className="text-[10px] font-bold uppercase tracking-wide text-sky-200/90">
                    {section.group}
                  </h3>
                  <div className="flex flex-col gap-1.5">
                    {section.items.map((sc, i) => (
                      <div key={i} className="flex items-center justify-between gap-3 text-xs">
                        <span className="text-foreground/80">{sc.description}</span>
                        <span className="flex shrink-0 items-center gap-1">
                          {sc.keys.map((k, j) => (
                            <kbd
                              key={j}
                              className="inline-flex h-5 min-w-5 items-center justify-center rounded border border-border/80 bg-muted/60 px-1 font-mono text-[10px] font-semibold text-foreground shadow-sm"
                            >
                              {k}
                            </kbd>
                          ))}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <div className="border-t border-border/60 bg-muted/30 px-5 py-2.5 text-[11px] text-muted-foreground">
              กด{' '}
              <kbd className="inline-flex h-4 items-center rounded border border-border bg-background px-1 font-mono text-[10px]">
                Esc
              </kbd>{' '}
              เพื่อปิด · กด{' '}
              <kbd className="inline-flex h-4 items-center rounded border border-border bg-background px-1 font-mono text-[10px]">
                ?
              </kbd>{' '}
              เพื่อเปิดอีกครั้ง
            </div>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}

function isTypingTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  const tag = target.tagName;
  return tag === 'INPUT' || tag === 'TEXTAREA' || target.isContentEditable;
}
