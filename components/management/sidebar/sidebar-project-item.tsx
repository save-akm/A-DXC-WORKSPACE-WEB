'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import type { ProjectItem, ProjectTone } from '@/lib/management/types';
import { useSidebarUIStore } from '@/lib/stores/sidebar-ui-store';
import { ProjectPreviewCard } from './project-preview-card';
import { useCollapsed } from './sidebar-context';
import { SidebarHoverPopover } from './sidebar-hover-popover';

interface SidebarProjectItemProps {
  project: ProjectItem;
}

const PROJECT_BADGE_TONES: Record<ProjectTone, { default: string; active: string }> = {
  sky: {
    default:
      'bg-sky-100 text-sky-700 ring-sky-500/30 group-hover/proj:bg-sky-200 group-hover/proj:text-sky-800 dark:bg-sky-400/15 dark:text-sky-200 dark:ring-sky-400/25 dark:group-hover/proj:bg-sky-400/25 dark:group-hover/proj:text-sky-100',
    active:
      'bg-gradient-to-br from-sky-400 to-sky-600 text-white shadow-[0_0_8px_rgba(56,189,248,0.5)] ring-sky-300/50',
  },
  pink: {
    default:
      'bg-pink-100 text-pink-700 ring-pink-500/30 group-hover/proj:bg-pink-200 group-hover/proj:text-pink-800 dark:bg-pink-400/15 dark:text-pink-200 dark:ring-pink-400/25 dark:group-hover/proj:bg-pink-400/25 dark:group-hover/proj:text-pink-100',
    active:
      'bg-gradient-to-br from-pink-400 to-pink-600 text-white shadow-[0_0_8px_rgba(236,72,153,0.5)] ring-pink-300/50',
  },
  emerald: {
    default:
      'bg-emerald-100 text-emerald-700 ring-emerald-500/30 group-hover/proj:bg-emerald-200 group-hover/proj:text-emerald-800 dark:bg-emerald-400/15 dark:text-emerald-200 dark:ring-emerald-400/25 dark:group-hover/proj:bg-emerald-400/25 dark:group-hover/proj:text-emerald-100',
    active:
      'bg-gradient-to-br from-emerald-400 to-emerald-600 text-white shadow-[0_0_8px_rgba(52,211,153,0.5)] ring-emerald-300/50',
  },
  amber: {
    default:
      'bg-amber-100 text-amber-700 ring-amber-500/30 group-hover/proj:bg-amber-200 group-hover/proj:text-amber-800 dark:bg-amber-400/15 dark:text-amber-200 dark:ring-amber-400/25 dark:group-hover/proj:bg-amber-400/25 dark:group-hover/proj:text-amber-100',
    active:
      'bg-gradient-to-br from-amber-400 to-amber-600 text-white shadow-[0_0_8px_rgba(251,191,36,0.5)] ring-amber-300/50',
  },
  violet: {
    default:
      'bg-violet-100 text-violet-700 ring-violet-500/30 group-hover/proj:bg-violet-200 group-hover/proj:text-violet-800 dark:bg-violet-400/15 dark:text-violet-200 dark:ring-violet-400/25 dark:group-hover/proj:bg-violet-400/25 dark:group-hover/proj:text-violet-100',
    active:
      'bg-gradient-to-br from-violet-400 to-violet-600 text-white shadow-[0_0_8px_rgba(167,139,250,0.5)] ring-violet-300/50',
  },
  rose: {
    default:
      'bg-rose-100 text-rose-700 ring-rose-500/30 group-hover/proj:bg-rose-200 group-hover/proj:text-rose-800 dark:bg-rose-400/15 dark:text-rose-200 dark:ring-rose-400/25 dark:group-hover/proj:bg-rose-400/25 dark:group-hover/proj:text-rose-100',
    active:
      'bg-gradient-to-br from-rose-400 to-rose-600 text-white shadow-[0_0_8px_rgba(244,63,94,0.5)] ring-rose-300/50',
  },
};

export function SidebarProjectItem({ project }: SidebarProjectItemProps) {
  const pathname = usePathname();
  const collapsed = useCollapsed();
  const setMobileOpen = useSidebarUIStore((s) => s.setMobileOpen);
  const isActive = pathname === project.href || pathname?.startsWith(project.href + '/');
  const toneClasses = PROJECT_BADGE_TONES[project.tone];

  return (
    <SidebarHoverPopover
      enabled
      variant="card"
      label={<ProjectPreviewCard project={project} />}
    >
      <Link
        href={project.href}
        onClick={() => setMobileOpen(false)}
        className={cn(
          'group/proj relative flex h-8 items-center gap-2.5 overflow-hidden rounded-md px-2 text-sm transition-colors',
          isActive
            ? 'bg-gradient-to-r from-[var(--sidebar-menuactive-bg-from)] via-[var(--sidebar-menuactive-bg-to)] to-transparent text-foreground font-medium'
            : 'text-foreground/85 hover:bg-foreground/[0.08] hover:text-foreground',
        )}
      >
        {isActive ? (
          <motion.span
            layoutId="sidebar-project-active"
            className="absolute left-0 top-1/2 h-4 w-0.5 -translate-y-1/2 rounded-full bg-sky-400"
            transition={{ type: 'spring', stiffness: 380, damping: 32 }}
          />
        ) : null}

        <span className={cn('size-2 shrink-0 rounded-full ring-2 ring-current/10', project.color)} />

        <motion.span
          animate={{ opacity: collapsed ? 0 : 1, width: collapsed ? 0 : 'auto' }}
          transition={{ duration: 0.18, ease: 'easeOut' }}
          className="min-w-0 flex-1 overflow-hidden truncate text-left"
        >
          {project.title}
        </motion.span>

        {!collapsed ? (
          <span
            className={cn(
              'ml-auto inline-flex h-[18px] items-center justify-center rounded-md px-1.5 font-mono text-[10px] font-bold tracking-wider ring-1 transition-colors',
              isActive ? toneClasses.active : toneClasses.default,
            )}
          >
            {project.badge}
          </span>
        ) : null}
      </Link>
    </SidebarHoverPopover>
  );
}
