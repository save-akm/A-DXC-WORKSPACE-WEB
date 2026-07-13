'use client';

import { motion, useReducedMotion } from 'framer-motion';
import { cn } from '@/lib/utils';
import type { SidebarTab } from '@/lib/chat/types';

const TABS: { id: SidebarTab; label: string }[] = [
  { id: 'active', label: 'ทั้งหมด' },
  { id: 'archived', label: 'เก็บถาวร' },
];

interface SidebarTabsProps {
  value: SidebarTab;
  onChange: (tab: SidebarTab) => void;
}

export function SidebarTabs({ value, onChange }: SidebarTabsProps) {
  const reduce = useReducedMotion();

  return (
    <div className="flex shrink-0 items-center gap-0.5 rounded-lg border border-border/60 bg-background/50 p-0.5">
      {TABS.map((tab) => (
        <button
          key={tab.id}
          type="button"
          onClick={() => onChange(tab.id)}
          className={cn(
            'relative z-10 flex-1 cursor-pointer whitespace-nowrap rounded-md px-2.5 py-1 text-xs font-medium transition-colors',
            value === tab.id ? 'text-foreground' : 'text-muted-foreground hover:text-foreground',
          )}
        >
          {value === tab.id && !reduce ? (
            <motion.span
              layoutId="inbox-tab-bg"
              className="absolute inset-0 -z-10 rounded-md bg-accent/80 ring-1 ring-brand/10"
              transition={{ type: 'spring', stiffness: 380, damping: 32 }}
            />
          ) : value === tab.id ? (
            <span className="absolute inset-0 -z-10 rounded-md bg-accent/80 ring-1 ring-brand/10" />
          ) : null}
          {tab.label}
        </button>
      ))}
    </div>
  );
}
