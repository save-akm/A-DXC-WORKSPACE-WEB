'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { ChevronRight, Plus } from 'lucide-react';
import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { useSidebarUIStore } from '@/lib/stores/sidebar-ui-store';
import { useCollapsed } from './sidebar-context';

interface SidebarSectionProps {
  id: string;
  title: string;
  addLabel?: string;
  onAdd?: () => void;
  children: ReactNode;
}

export function SidebarSection({ id, title, addLabel, onAdd, children }: SidebarSectionProps) {
  const collapsed = useCollapsed();
  const isExpanded = useSidebarUIStore((s) => s.expandedSections[id] !== false);
  const toggleSection = useSidebarUIStore((s) => s.toggleSection);

  return (
    <div className="flex flex-col">
      {!collapsed ? (
        <div className="flex h-7 items-center gap-1 px-2">
          <button
            type="button"
            onClick={() => toggleSection(id)}
            className="group/sec flex flex-1 cursor-pointer items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-(--sidebar-mainmenu-text) transition-colors hover:text-(--sidebar-menuhover-text)"
            aria-expanded={isExpanded}
          >
            <motion.span
              animate={{ rotate: isExpanded ? 90 : 0 }}
              transition={{ duration: 0.18, ease: 'easeOut' }}
              className="inline-flex text-(--sidebar-mainmenu-icon)"
            >
              <ChevronRight className="size-4" />
            </motion.span>
            <span>{title}</span>
          </button>
          {onAdd ? (
            <button
              type="button"
              onClick={onAdd}
              aria-label={addLabel ?? `Add ${title}`}
              className="inline-flex size-5 items-center justify-center rounded text-muted-foreground/70 transition-colors hover:bg-accent/40 hover:text-foreground"
            >
              <Plus className="size-4" />
            </button>
          ) : null}
        </div>
      ) : (
        <div className="mx-2 my-1 h-px bg-border/60" aria-hidden />
      )}

      <AnimatePresence initial={false}>
        {isExpanded || collapsed ? (
          <motion.div
            key="content"
            initial={collapsed ? false : { height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.22, ease: [0.4, 0, 0.2, 1] }}
            className={cn('overflow-hidden')}
          >
            <div className="flex flex-col gap-0.5 pt-0.5">{children}</div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
