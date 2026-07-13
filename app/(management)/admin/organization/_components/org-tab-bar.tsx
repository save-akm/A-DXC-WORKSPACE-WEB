'use client';

import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

export type Tab = 'branches' | 'departments' | 'department-units' | 'positions';

export const TABS: { id: Tab; label: string }[] = [
  { id: 'branches',         label: 'Branches' },
  { id: 'departments',      label: 'Departments' },
  { id: 'department-units', label: 'Dept. Units' },
  { id: 'positions',        label: 'Positions' },
];

interface OrgTabBarProps {
  activeTab: Tab;
  onChange:  (tab: Tab) => void;
}

export function OrgTabBar({ activeTab, onChange }: OrgTabBarProps) {
  return (
    <div className="flex shrink-0 items-center gap-0.5 rounded-lg border border-border/60 bg-card/40 p-0.5">
      {TABS.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onChange(tab.id)}
          className={cn(
            'relative z-10 cursor-pointer whitespace-nowrap rounded-md px-2.5 py-1 text-xs font-medium transition-colors',
            activeTab === tab.id
              ? 'text-foreground'
              : 'text-muted-foreground hover:text-foreground',
          )}
        >
          {activeTab === tab.id && (
            <motion.span
              layoutId="org-tab-bg"
              className="absolute inset-0 -z-10 rounded-md bg-accent/70"
              transition={{ type: 'spring', stiffness: 380, damping: 32 }}
            />
          )}
          {tab.label}
        </button>
      ))}
    </div>
  );
}
