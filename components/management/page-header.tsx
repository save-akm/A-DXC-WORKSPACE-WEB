'use client';

import { motion, useReducedMotion } from 'framer-motion';
import type { LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface PageHeaderProps {
  /** The page title — the single H1 on the page. */
  title: ReactNode;
  /** One supporting line. Keep it short; it explains, it doesn't restate. */
  subtitle?: ReactNode;
  /** Optional brand-tinted icon chip shown beside the title (desktop only). */
  icon?: LucideIcon;
  /** Primary action(s), aligned to the end of the header row. */
  actions?: ReactNode;
  className?: string;
}

/**
 * The one page-header for the dashboard. Every page used to hand-roll its own
 * <h1> (text-3xl/extrabold here, text-xl/bold there), which made the hierarchy
 * inconsistent. This fixes the title/subtitle relationship in one place via the
 * .type-page-title / .type-page-subtitle roles.
 */
export function PageHeader({ title, subtitle, icon: Icon, actions, className }: PageHeaderProps) {
  const reduceMotion = useReducedMotion();

  return (
    <motion.header
      initial={reduceMotion ? false : { opacity: 0, x: -12 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
      className={cn('flex items-start justify-between gap-4', className)}
    >
      <div className="flex min-w-0 items-center gap-3">
        {Icon ? (
          <span className="hidden size-10 shrink-0 items-center justify-center rounded-xl bg-brand-muted text-brand ring-1 ring-brand/15 sm:inline-flex">
            <Icon className="size-5" />
          </span>
        ) : null}
        <div className="min-w-0">
          <h1 className="type-page-title">{title}</h1>
          {subtitle ? <p className="type-page-subtitle">{subtitle}</p> : null}
        </div>
      </div>
      {actions ? <div className="flex shrink-0 items-center gap-2">{actions}</div> : null}
    </motion.header>
  );
}
