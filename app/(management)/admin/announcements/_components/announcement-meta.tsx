'use client';

import { cn } from '@/lib/utils';
import type {
  AnnouncementType,
  AnnouncementLevel,
  AnnouncementState,
} from '@/lib/announcements/types';
import { TYPE_META, LEVEL_META, STATE_META } from '@/lib/announcements/meta';

// Config now lives in the shared module (lib/announcements/meta.ts) so the admin
// surface and the public landing page never drift apart. Re-exported here under
// the names the admin code already uses.
export {
  TYPE_META as TYPE_CONFIG,
  LEVEL_META as LEVEL_CONFIG,
  STATE_META as STATE_CONFIG,
} from '@/lib/announcements/meta';

// ── Badge components ──────────────────────────────────────────────────────────────

export function TypeBadge({ type }: { type: AnnouncementType }) {
  const cfg = TYPE_META[type];
  const Icon = cfg.icon;
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium whitespace-nowrap',
        cfg.badge,
      )}
    >
      <Icon size={11} />
      {cfg.label}
    </span>
  );
}

export function LevelBadge({ level }: { level: AnnouncementLevel }) {
  const cfg = LEVEL_META[level];
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium whitespace-nowrap',
        cfg.badge,
      )}
    >
      <span className={cn('size-1.5 rounded-full', cfg.dot)} />
      {cfg.label}
    </span>
  );
}

export function StateBadge({ state }: { state: AnnouncementState }) {
  const cfg = STATE_META[state];
  const Icon = cfg.icon;
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium whitespace-nowrap',
        cfg.badge,
      )}
    >
      <Icon size={11} />
      {cfg.label}
    </span>
  );
}
