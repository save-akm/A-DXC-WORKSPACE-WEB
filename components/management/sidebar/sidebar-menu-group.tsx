'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { ChevronRight } from 'lucide-react';
import type { MenuNode } from '@/lib/auth/types';
import { useSidebarUIStore } from '@/lib/stores/sidebar-ui-store';
import { useCollapsed } from './sidebar-context';
import { SidebarMenuItem } from './sidebar-menu-item';

interface SidebarMenuGroupProps {
  group: MenuNode;
}

export function SidebarMenuGroup({ group }: SidebarMenuGroupProps) {
  const collapsed = useCollapsed();
  const expandedSections = useSidebarUIStore((s) => s.expandedSections);
  const toggleSection = useSidebarUIStore((s) => s.toggleSection);
  const isExpanded = expandedSections[group.id] !== false;

  return (
    <div className="flex flex-col">
      {!collapsed ? (
        <div className="flex h-7 items-center gap-1 px-2">
          <button
            type="button"
            onClick={() => toggleSection(group.id)}
            aria-expanded={isExpanded}
            className="group/sec flex flex-1 cursor-pointer items-center gap-1.5 text-[11px] font-bold uppercase tracking-wide text-[var(--sidebar-mainmenu-text)] transition-colors hover:text-[var(--sidebar-menuhover-text)] dark:text-sky-200/90 dark:hover:text-sky-100"
          >
            <motion.span
              animate={{ rotate: isExpanded ? 90 : 0 }}
              transition={{ duration: 0.18, ease: 'easeOut' }}
              className="inline-flex text-[var(--sidebar-mainmenu-icon)] dark:text-sky-300"
            >
              <ChevronRight className="size-4" />
            </motion.span>
            <span className="truncate text-left">{group.name}</span>
          </button>
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
            className="overflow-hidden"
          >
            <div className="flex flex-col gap-0.5 pt-0.5">
              {group.children.map((child) => (
                <SidebarMenuItem key={child.id} node={child} />
              ))}
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
