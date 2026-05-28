'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { projects, viewTabs } from '@/lib/management/nav-config';

export function TopbarViewTabs() {
  const pathname = usePathname();

  const activeProject = projects.find(
    (p) => pathname === p.href || pathname?.startsWith(p.href + '/'),
  );

  if (!activeProject) return null;

  // Build tab hrefs relative to the active project base path
  const tabs = viewTabs.map((tab) => {
    const subPath = tab.href.replace(/^\/projects\/[^/]+/, '');
    return { ...tab, href: activeProject.href + subPath };
  });

  // Find most-specific matching tab by checking in reverse (longest path first)
  const activeTab = [...tabs].reverse().find(
    (tab) => pathname === tab.href || pathname?.startsWith(tab.href + '/'),
  );

  return (
    <div
      role="tablist"
      aria-label="View"
      className="relative inline-flex items-center rounded-lg border border-border/60 bg-card/40 p-0.5"
    >
      {tabs.map((tab) => {
        const isActive = tab.id === activeTab?.id;
        return (
          <Link
            key={tab.id}
            href={tab.href}
            role="tab"
            aria-selected={isActive}
            className={cn(
              'relative z-10 inline-flex h-7 items-center justify-center rounded-md px-3 text-xs font-medium transition-colors',
              isActive ? 'text-foreground' : 'text-muted-foreground hover:text-foreground',
            )}
          >
            {isActive ? (
              <motion.span
                layoutId="topbar-view-tab-bg"
                className="absolute inset-0 -z-10 rounded-md bg-accent/70"
                transition={{ type: 'spring', stiffness: 380, damping: 32 }}
              />
            ) : null}
            {tab.label}
          </Link>
        );
      })}
    </div>
  );
}
