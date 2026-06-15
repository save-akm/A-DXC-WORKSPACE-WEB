'use client';

import { createElement } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { AnimatePresence, motion } from 'framer-motion';
import { ChevronRight } from 'lucide-react';
import type { MenuNode } from '@/lib/auth/types';
import { useMenuBadgesStore } from '@/lib/stores/menu-badges-store';
import { useSidebarUIStore } from '@/lib/stores/sidebar-ui-store';
import { cn } from '@/lib/utils';
import { resolveIcon } from './icon-registry';
import { useCollapsed } from './sidebar-context';
import { SidebarHoverPopover } from './sidebar-hover-popover';

interface SidebarMenuItemProps {
  node: MenuNode;
  depth?: number;
}

type BadgeTone = 'sky' | 'amber' | 'rose';

const BADGE_TONE_BY_CODE: Record<string, BadgeTone> = {
  myissues: 'amber',
  project_survey: 'rose',
};

const BADGE_TONE_CLASSES: Record<
  BadgeTone,
  { directlyActive: string; hasActiveChild: string; default: string; dot: string }
> = {
  sky: {
    directlyActive:
      'bg-gradient-to-br from-sky-400 to-sky-600 text-white shadow-[0_0_10px_rgba(56,189,248,0.5)] ring-sky-300/50',
    hasActiveChild:
      'bg-sky-500/15 text-sky-700 ring-sky-500/25 dark:bg-sky-400/20 dark:text-sky-200 dark:ring-sky-400/30',
    default:
      'bg-sky-500/15 text-sky-700 ring-sky-500/25 group-hover/menu:bg-sky-500/25 group-hover/menu:text-sky-800 dark:bg-sky-400/15 dark:text-sky-200 dark:ring-sky-400/20 dark:group-hover/menu:bg-sky-400/25 dark:group-hover/menu:text-sky-100',
    dot: 'bg-sky-400',
  },
  amber: {
    directlyActive:
      'bg-gradient-to-br from-amber-400 to-amber-600 text-white shadow-[0_0_10px_rgba(251,191,36,0.55)] ring-amber-300/50',
    hasActiveChild:
      'bg-amber-300/40 text-amber-800 ring-amber-500/30 dark:bg-amber-400/20 dark:text-amber-200 dark:ring-amber-400/30',
    default:
      'bg-amber-200/70 text-amber-800 ring-amber-500/30 group-hover/menu:bg-amber-300/80 group-hover/menu:text-amber-900 dark:bg-amber-400/15 dark:text-amber-200 dark:ring-amber-400/25 dark:group-hover/menu:bg-amber-400/25 dark:group-hover/menu:text-amber-100',
    dot: 'bg-amber-400',
  },
  rose: {
    directlyActive:
      'bg-gradient-to-br from-rose-400 to-rose-600 text-white shadow-[0_0_10px_rgba(244,63,94,0.55)] ring-rose-300/50',
    hasActiveChild:
      'bg-rose-300/40 text-rose-800 ring-rose-500/30 dark:bg-rose-400/20 dark:text-rose-200 dark:ring-rose-400/30',
    default:
      'bg-rose-200/70 text-rose-800 ring-rose-500/30 group-hover/menu:bg-rose-300/80 group-hover/menu:text-rose-900 dark:bg-rose-400/15 dark:text-rose-200 dark:ring-rose-400/25 dark:group-hover/menu:bg-rose-400/25 dark:group-hover/menu:text-rose-100',
    dot: 'bg-rose-400',
  },
};

function getBadgeTone(code: string): BadgeTone {
  return BADGE_TONE_BY_CODE[code] ?? 'sky';
}

function isPathActive(node: MenuNode, pathname: string | null): boolean {
  if (!node.path || !pathname) return false;
  return pathname === node.path || pathname.startsWith(node.path + '/');
}

function hasActiveDescendant(node: MenuNode, pathname: string | null): boolean {
  return node.children.some((c) => isPathActive(c, pathname) || hasActiveDescendant(c, pathname));
}

export function SidebarMenuItem({ node, depth = 0 }: SidebarMenuItemProps) {
  const pathname = usePathname();
  const collapsed = useCollapsed();
  const setMobileOpen = useSidebarUIStore((s) => s.setMobileOpen);
  const expandedItems = useSidebarUIStore((s) => s.expandedItems);
  const toggleItem = useSidebarUIStore((s) => s.toggleItem);
  const badgeValue = useMenuBadgesStore((s) => s.badges[node.code]);
  const increasedAt = useMenuBadgesStore((s) => s.increasedAt[node.code]);

  const icon = resolveIcon(node.icon);
  const hasBadge = badgeValue !== undefined && badgeValue !== null && badgeValue !== '';
  const badgeTone = BADGE_TONE_CLASSES[getBadgeTone(node.code)];
  const hasChildren = node.children.length > 0;
  const isDirectlyActive = isPathActive(node, pathname);
  const hasActiveChild = !isDirectlyActive && hasActiveDescendant(node, pathname);
  const isExpanded = expandedItems[node.id] ?? (isDirectlyActive || hasActiveChild);
  const paddingLeft = depth === 0 ? 12 : 12 + depth * 16;

  const iconElement = createElement(icon, {
    className: cn(
      'size-4 transition-colors',
      isDirectlyActive
        ? 'text-[var(--sidebar-mainmenu-icon)]'
        : hasActiveChild
          ? 'text-foreground'
          : 'text-foreground/85 group-hover/menu:text-foreground',
    ),
  });

  const iconNode = (
    <span className="relative inline-flex shrink-0">
      {iconElement}
      {hasBadge && collapsed ? (
        <span
          className={cn(
            'absolute -right-1 -top-0.5 size-1.5 rounded-full shadow-[0_0_0_2px_var(--color-sidebar)]',
            badgeTone.dot,
          )}
        />
      ) : null}
    </span>
  );

  const badgeNode =
    hasBadge && !collapsed ? (
      <motion.span
        key={increasedAt ?? 'init'}
        initial={increasedAt ? { scale: 1.6 } : false}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 480, damping: 18 }}
        className={cn(
          'inline-flex h-5 min-w-5 shrink-0 items-center justify-center rounded-sm px-1.5 text-[11px] font-bold tabular-nums tracking-tight ring-1 transition-colors',
          isDirectlyActive
            ? badgeTone.directlyActive
            : hasActiveChild
              ? badgeTone.hasActiveChild
              : badgeTone.default,
        )}
      >
        {badgeValue}
      </motion.span>
    ) : null;

  const baseClass = cn(
    'group/menu relative flex h-8 items-center cursor-pointer gap-2.5 overflow-hidden rounded-sm pr-2 text-sm transition-colors',
    isDirectlyActive
      ? 'bg-gradient-to-r from-[var(--sidebar-menuactive-bg-from)] via-[var(--sidebar-menuactive-bg-to)] to-transparent text-foreground font-medium'
      : hasActiveChild
        ? 'text-foreground hover:bg-foreground/[0.06]'
        : 'text-foreground/85 hover:bg-foreground/[0.08] hover:text-foreground',
  );

  const label = (
    <motion.span
      animate={{ opacity: collapsed ? 0 : 1, width: collapsed ? 0 : 'auto' }}
      transition={{ duration: 0.18, ease: 'easeOut' }}
      className="min-w-0 flex-1 overflow-hidden truncate text-left"
    >
      {node.name}
    </motion.span>
  );

  const chevron =
    hasChildren && !collapsed ? (
      <motion.span
        animate={{ rotate: isExpanded ? 90 : 0 }}
        transition={{ duration: 0.18, ease: 'easeOut' }}
        className="inline-flex shrink-0"
      >
        <ChevronRight
          className={cn(
            'size-3.5 transition-colors',
            isDirectlyActive
              ? 'text-(--sidebar-menuactive-accent)'
              : 'text-muted-foreground/60',
          )}
        />
      </motion.span>
    ) : null;

  const activeBar = isDirectlyActive ? (
    <motion.span
      layoutId="sidebar-menu-active"
      className="absolute left-0 top-1/2 h-5 w-0.75 -translate-y-1/2 rounded-r-full bg-(--sidebar-menuactive-accent) shadow-[0_0_8px_var(--sidebar-menuactive-accent)]"
      transition={{ type: 'spring', stiffness: 400, damping: 34 }}
    >
      <motion.span
        aria-hidden
        className="absolute inset-0 rounded-r-full bg-(--sidebar-menuactive-accent)"
        animate={{ opacity: [0.4, 1, 0.4] }}
        transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
      />
    </motion.span>
  ) : null;

  return (
    <div className="flex flex-col">
      <SidebarHoverPopover enabled={collapsed} label={node.name}>
        {hasChildren && !node.path ? (
          <button
            type="button"
            onClick={() => toggleItem(node.id)}
            aria-expanded={isExpanded}
            style={{ paddingLeft }}
            className={cn(baseClass, 'w-full')}
          >
            {activeBar}
            {iconNode}
            {label}
            {badgeNode}
            {chevron}
          </button>
        ) : (
          <Link
            href={node.path ?? '#'}
            onClick={() => {
              setMobileOpen(false);
              if (hasChildren) toggleItem(node.id);
            }}
            style={{ paddingLeft }}
            className={cn(baseClass)}
          >
            {activeBar}
            {iconNode}
            {label}
            {badgeNode}
            {chevron}
          </Link>
        )}
      </SidebarHoverPopover>

      {hasChildren ? (
        <AnimatePresence initial={false}>
          {isExpanded && !collapsed ? (
            <motion.div
              key="children"
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.22, ease: [0.4, 0, 0.2, 1] }}
              className="overflow-hidden"
            >
              <div className="flex flex-col gap-0.5 pt-0.5">
                {node.children.map((child) => (
                  <SidebarMenuItem key={child.id} node={child} depth={depth + 1} />
                ))}
              </div>
            </motion.div>
          ) : null}
        </AnimatePresence>
      ) : null}
    </div>
  );
}
