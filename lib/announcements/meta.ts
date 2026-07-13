// lib/announcements/meta.ts
//
// Single source of truth for the visual identity of announcement types, levels,
// and states. Shared by the admin surface (table badges, modal) and the public
// landing page / app banner — keep all colors, labels, and icons here so the two
// surfaces never drift apart.

import {
  Sparkles,
  Wrench,
  Info,
  CalendarDays,
  ShieldAlert,
  Radio,
  Clock,
  CircleSlash,
  CalendarX,
  type LucideIcon,
} from 'lucide-react';
import type {
  AnnouncementType,
  AnnouncementLevel,
  AnnouncementState,
} from './types';

// ── Type ────────────────────────────────────────────────────────────────────────

export interface TypeMeta {
  label: string;
  icon: LucideIcon;
  /** Soft inline badge classes (admin table). */
  badge: string;
  /** Icon-chip gradient (`from-… to-…`). */
  gradient: string;
  /** Soft corner-glow tint (landing / banner). */
  glow: string;
  /** Card / banner border + background tint (landing). */
  soft: string;
  /** Foreground accent text (landing). */
  text: string;
}

export const TYPE_META: Record<AnnouncementType, TypeMeta> = {
  NEW_RELEASE: {
    label: 'New Release',
    icon: Sparkles,
    badge: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
    gradient: 'from-emerald-500 to-teal-500',
    glow: 'bg-emerald-500/15',
    soft: 'border-emerald-500/20 bg-emerald-500/5',
    text: 'text-emerald-600 dark:text-emerald-400',
  },
  MAINTENANCE: {
    label: 'Maintenance',
    icon: Wrench,
    badge: 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
    gradient: 'from-amber-500 to-orange-500',
    glow: 'bg-amber-500/15',
    soft: 'border-amber-500/20 bg-amber-500/5',
    text: 'text-amber-600 dark:text-amber-400',
  },
  NOTICE: {
    label: 'Notice',
    icon: Info,
    badge: 'bg-sky-500/10 text-sky-600 dark:text-sky-400',
    gradient: 'from-sky-500 to-blue-600',
    glow: 'bg-sky-500/15',
    soft: 'border-sky-500/20 bg-sky-500/5',
    text: 'text-sky-600 dark:text-sky-400',
  },
  EVENT: {
    label: 'Event',
    icon: CalendarDays,
    badge: 'bg-violet-500/10 text-violet-600 dark:text-violet-400',
    gradient: 'from-violet-500 to-fuchsia-500',
    glow: 'bg-violet-500/15',
    soft: 'border-violet-500/20 bg-violet-500/5',
    text: 'text-violet-600 dark:text-violet-400',
  },
  SECURITY_ALERT: {
    label: 'Security Alert',
    icon: ShieldAlert,
    badge: 'bg-rose-500/10 text-rose-600 dark:text-rose-400',
    gradient: 'from-rose-500 to-red-600',
    glow: 'bg-rose-500/15',
    soft: 'border-rose-500/25 bg-rose-500/5',
    text: 'text-rose-600 dark:text-rose-400',
  },
};

// ── Level ───────────────────────────────────────────────────────────────────────

export interface LevelMeta {
  label: string;
  /** Sort weight — lower is more severe. */
  order: number;
  dot: string;
  /** Soft inline badge classes (admin). */
  badge: string;
  /** Solid high-contrast badge classes (landing / banner). */
  solidBadge: string;
}

export const LEVEL_META: Record<AnnouncementLevel, LevelMeta> = {
  CRITICAL: {
    label: 'Critical',
    order: 0,
    dot: 'bg-red-500',
    badge: 'bg-red-500/10 text-red-600 dark:text-red-400',
    solidBadge: 'bg-red-500 text-white',
  },
  URGENT: {
    label: 'Urgent',
    order: 1,
    dot: 'bg-orange-500',
    badge: 'bg-orange-500/10 text-orange-600 dark:text-orange-400',
    solidBadge: 'bg-orange-500 text-white',
  },
  NEW: {
    label: 'New',
    order: 2,
    dot: 'bg-emerald-500',
    badge: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
    solidBadge: 'bg-emerald-500 text-white',
  },
  NOTICE: {
    label: 'Notice',
    order: 3,
    dot: 'bg-slate-400',
    badge: 'bg-muted text-muted-foreground',
    solidBadge: 'bg-zinc-200 text-zinc-700 dark:bg-white/10 dark:text-zinc-200',
  },
};

// ── State (derived publication status) ────────────────────────────────────────────

export interface StateMeta {
  label: string;
  icon: LucideIcon;
  dot: string;
  badge: string;
}

export const STATE_META: Record<AnnouncementState, StateMeta> = {
  LIVE: {
    label: 'กำลังแสดง',
    icon: Radio,
    dot: 'bg-emerald-500',
    badge: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
  },
  SCHEDULED: {
    label: 'ตั้งเวลา',
    icon: Clock,
    dot: 'bg-sky-500',
    badge: 'bg-sky-500/10 text-sky-600 dark:text-sky-400',
  },
  EXPIRED: {
    label: 'หมดอายุ',
    icon: CalendarX,
    dot: 'bg-muted-foreground/40',
    badge: 'bg-muted text-muted-foreground',
  },
  INACTIVE: {
    label: 'ปิดใช้งาน',
    icon: CircleSlash,
    dot: 'bg-muted-foreground/40',
    badge: 'bg-muted text-muted-foreground',
  },
};
