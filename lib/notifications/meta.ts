import {
  AlertTriangle,
  AtSign,
  Bell,
  Clock,
  Cog,
  Heart,
  Megaphone,
  MessageCircle,
  MessageSquare,
  ShieldAlert,
  Workflow,
  type LucideIcon,
} from 'lucide-react';
import { resolveAppIcon } from '@/components/app-icon';
import type {
  FanOutStatus,
  NotificationChannel,
  NotificationPriority,
  NotificationType,
  TargetScope,
} from '@/lib/notifications/types';

// ── Type styling ──────────────────────────────────────────────────────────────
// One vocabulary shared by the inbox feed, the detail sheet, and the admin
// console. Colors echo the topbar bell so the two surfaces feel like one system.

export interface TypeMeta {
  label: string;
  icon: LucideIcon;
  /** soft chip background (color/10) */
  bg: string;
  /** icon + accent text */
  fg: string;
  /** unread dot */
  dot: string;
  /** full ring used on unread item surfaces (never a side-stripe) */
  ring: string;
}

const TYPE_META: Record<NotificationType, TypeMeta> = {
  WORKFLOW: {
    label: 'เวิร์กโฟลว์',
    icon: Workflow,
    bg: 'bg-violet-500/10',
    fg: 'text-violet-600 dark:text-violet-400',
    dot: 'bg-violet-500',
    ring: 'ring-violet-400/30 dark:ring-violet-500/25',
  },
  SYSTEM: {
    label: 'ระบบ',
    icon: Cog,
    bg: 'bg-slate-500/10',
    fg: 'text-slate-600 dark:text-slate-300',
    dot: 'bg-slate-500',
    ring: 'ring-slate-400/30 dark:ring-slate-500/25',
  },
  SECURITY: {
    label: 'ความปลอดภัย',
    icon: ShieldAlert,
    bg: 'bg-rose-500/10',
    fg: 'text-rose-600 dark:text-rose-400',
    dot: 'bg-rose-500',
    ring: 'ring-rose-400/30 dark:ring-rose-500/25',
  },
  ANNOUNCEMENT: {
    label: 'ประกาศ',
    icon: Megaphone,
    bg: 'bg-amber-500/10',
    fg: 'text-amber-600 dark:text-amber-400',
    dot: 'bg-amber-500',
    ring: 'ring-amber-400/30 dark:ring-amber-500/25',
  },
  REMINDER: {
    label: 'เตือนความจำ',
    icon: Clock,
    bg: 'bg-sky-500/10',
    fg: 'text-sky-600 dark:text-sky-400',
    dot: 'bg-sky-500',
    ring: 'ring-sky-400/30 dark:ring-sky-500/25',
  },
  ALERT: {
    label: 'แจ้งเหตุ',
    icon: AlertTriangle,
    bg: 'bg-orange-500/10',
    fg: 'text-orange-600 dark:text-orange-400',
    dot: 'bg-orange-500',
    ring: 'ring-orange-400/30 dark:ring-orange-500/25',
  },
  CHAT_MESSAGE: {
    label: 'ข้อความ',
    icon: MessageCircle,
    bg: 'bg-emerald-500/10',
    fg: 'text-emerald-600 dark:text-emerald-400',
    dot: 'bg-emerald-500',
    ring: 'ring-emerald-400/30 dark:ring-emerald-500/25',
  },
  CHAT_MENTION: {
    label: 'Mention',
    icon: AtSign,
    bg: 'bg-brand/10',
    fg: 'text-brand',
    dot: 'bg-brand',
    ring: 'ring-brand/30',
  },
  KNOWLEDGE_COMMENT: {
    label: 'ความคิดเห็น',
    icon: MessageSquare,
    bg: 'bg-indigo-500/10',
    fg: 'text-indigo-600 dark:text-indigo-400',
    dot: 'bg-indigo-500',
    ring: 'ring-indigo-400/30 dark:ring-indigo-500/25',
  },
  KNOWLEDGE_REACTION: {
    label: 'ความรู้สึก',
    icon: Heart,
    bg: 'bg-fuchsia-500/10',
    fg: 'text-fuchsia-600 dark:text-fuchsia-400',
    dot: 'bg-fuchsia-500',
    ring: 'ring-fuchsia-400/30 dark:ring-fuchsia-500/25',
  },
};

const FALLBACK_TYPE: TypeMeta = {
  label: 'ทั่วไป',
  icon: Bell,
  bg: 'bg-muted',
  fg: 'text-muted-foreground',
  dot: 'bg-muted-foreground/50',
  ring: 'ring-border',
};

export function typeMeta(type: NotificationType | string): TypeMeta {
  return TYPE_META[type as NotificationType] ?? FALLBACK_TYPE;
}

/**
 * The glyph to render for one notification: the author-chosen lucide icon when
 * present, otherwise the type's default icon. Keeps custom icons working while
 * guaranteeing every row has a sensible default.
 */
export function notificationIcon(icon: string | null | undefined, type: NotificationType): LucideIcon {
  if (icon) return resolveAppIcon(icon);
  return typeMeta(type).icon;
}

// ── Priority ──────────────────────────────────────────────────────────────────

export interface PriorityMeta {
  label: string;
  /** chip classes (bg + text + ring) for the badge */
  className: string;
  /** true for HIGH/URGENT — surfaces a stronger visual treatment */
  loud: boolean;
}

const PRIORITY_META: Record<NotificationPriority, PriorityMeta> = {
  LOW: { label: 'ต่ำ', className: 'bg-muted text-muted-foreground ring-border', loud: false },
  NORMAL: { label: 'ปกติ', className: 'bg-sky-500/10 text-sky-600 ring-sky-400/30 dark:text-sky-400', loud: false },
  HIGH: { label: 'สูง', className: 'bg-amber-500/10 text-amber-600 ring-amber-400/30 dark:text-amber-400', loud: true },
  // CRITICAL is the backend schema value; URGENT is an inbound alias — same style.
  CRITICAL: { label: 'วิกฤต', className: 'bg-rose-500/10 text-rose-600 ring-rose-400/40 dark:text-rose-400', loud: true },
  URGENT: { label: 'ด่วน', className: 'bg-rose-500/10 text-rose-600 ring-rose-400/40 dark:text-rose-400', loud: true },
};

export function priorityMeta(priority: NotificationPriority | string): PriorityMeta {
  return PRIORITY_META[priority as NotificationPriority] ?? PRIORITY_META.NORMAL;
}

// ── Channel / scope / fan-out labels ──────────────────────────────────────────

export const CHANNEL_LABELS: Record<NotificationChannel, string> = {
  IN_APP: 'ในแอป',
  EMAIL: 'อีเมล',
  BOTH: 'ในแอป + อีเมล',
};

export const SCOPE_LABELS: Record<TargetScope, string> = {
  SYSTEM: 'ทั้งระบบ',
  ROLE: 'ตามบทบาท',
  PERSONAL: 'รายบุคคล',
};

export const FANOUT_META: Record<FanOutStatus, { label: string; className: string; dot: string }> = {
  PENDING: { label: 'รอส่ง', className: 'text-muted-foreground', dot: 'bg-muted-foreground/40' },
  PROCESSING: { label: 'กำลังส่ง', className: 'text-sky-600 dark:text-sky-400', dot: 'bg-sky-500 animate-pulse' },
  COMPLETED: { label: 'ส่งแล้ว', className: 'text-emerald-600 dark:text-emerald-400', dot: 'bg-emerald-500' },
  FAILED: { label: 'ล้มเหลว', className: 'text-rose-600 dark:text-rose-400', dot: 'bg-rose-500' },
};

// ── Time helpers ──────────────────────────────────────────────────────────────

const FULL_DTF = new Intl.DateTimeFormat('th-TH', {
  day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit',
});
const SHORT_DTF = new Intl.DateTimeFormat('th-TH', { day: 'numeric', month: 'short' });
const TIME_DTF = new Intl.DateTimeFormat('th-TH', { hour: '2-digit', minute: '2-digit' });

/** "เมื่อสักครู่ · 5 นาทีที่แล้ว · 3 ชม. ที่แล้ว · 2 วันที่แล้ว · 14 มิ.ย." */
export function relativeTime(iso: string): string {
  const t = new Date(iso).getTime();
  if (Number.isNaN(t)) return '';
  const sec = Math.floor((Date.now() - t) / 1000);
  if (sec < 45) return 'เมื่อสักครู่';
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min} นาทีที่แล้ว`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr} ชม. ที่แล้ว`;
  const day = Math.floor(hr / 24);
  if (day < 7) return `${day} วันที่แล้ว`;
  return SHORT_DTF.format(t);
}

export function fullDateTime(iso: string): string {
  const t = new Date(iso).getTime();
  return Number.isNaN(t) ? '—' : `${FULL_DTF.format(t)} น.`;
}

export function clockTime(iso: string): string {
  const t = new Date(iso).getTime();
  return Number.isNaN(t) ? '—' : `${TIME_DTF.format(t)} น.`;
}

export type DateGroup = 'today' | 'yesterday' | 'week' | 'older';

/** Bucket a timestamp for the feed's date dividers. */
export function dateGroup(iso: string): DateGroup {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return 'older';
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const ts = d.getTime();
  if (ts >= startOfToday) return 'today';
  if (ts >= startOfToday - 86_400_000) return 'yesterday';
  if (ts >= startOfToday - 7 * 86_400_000) return 'week';
  return 'older';
}

export const DATE_GROUP_LABELS: Record<DateGroup, string> = {
  today: 'วันนี้',
  yesterday: 'เมื่อวาน',
  week: '7 วันที่ผ่านมา',
  older: 'ก่อนหน้านี้',
};
