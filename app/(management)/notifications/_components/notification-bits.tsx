'use client';

import { createElement, type ReactNode } from 'react';
import { cn } from '@/lib/utils';
import {
  notificationIcon,
  priorityMeta,
  typeMeta,
} from '@/lib/notifications/meta';
import type { NotificationPriority, NotificationType } from '@/lib/notifications/types';

// ── Icon chip ───────────────────────────────────────────────────────────────────

/** The square, type-tinted glyph that leads every notification. */
export function IconChip({
  icon,
  type,
  size = 'md',
}: {
  icon: string | null;
  type: NotificationType;
  size?: 'sm' | 'md';
}) {
  const meta = typeMeta(type);
  return (
    <span
      className={cn(
        'inline-flex shrink-0 items-center justify-center rounded-xl',
        meta.bg,
        size === 'sm' ? 'size-8' : 'size-10',
      )}
    >
      {createElement(notificationIcon(icon, type), {
        className: cn(size === 'sm' ? 'size-4' : 'size-[18px]', meta.fg),
      })}
    </span>
  );
}

// ── Badges ──────────────────────────────────────────────────────────────────────

export function TypeBadge({ type, className }: { type: NotificationType; className?: string }) {
  const meta = typeMeta(type);
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[11px] font-medium',
        meta.bg,
        meta.fg,
        className,
      )}
    >
      <span className={cn('size-1.5 rounded-full', meta.dot)} />
      {meta.label}
    </span>
  );
}

/** Priority chip — only worth showing for HIGH/URGENT; NORMAL/LOW stay quiet. */
export function PriorityBadge({
  priority,
  force = false,
  className,
}: {
  priority: NotificationPriority;
  force?: boolean;
  className?: string;
}) {
  const meta = priorityMeta(priority);
  if (!force && !meta.loud) return null;
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium ring-1 ring-inset',
        meta.className,
        className,
      )}
    >
      {meta.label}
    </span>
  );
}

// ── Empty / error states ──────────────────────────────────────────────────────────

export function FeedState({
  icon,
  title,
  hint,
  action,
}: {
  icon: ReactNode;
  title: string;
  hint?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 px-6 py-20 text-center">
      <span className="inline-flex size-12 items-center justify-center rounded-2xl bg-muted/60 text-muted-foreground/70">
        {icon}
      </span>
      <div className="space-y-1">
        <p className="text-sm font-medium text-foreground">{title}</p>
        {hint ? <p className="mx-auto max-w-xs text-xs text-muted-foreground">{hint}</p> : null}
      </div>
      {action}
    </div>
  );
}
