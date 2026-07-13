'use client';

import { Globe, Building2, Lock, FileEdit, CheckCircle2, Archive, BadgeCheck } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { PostStatus, PostVisibility, Tag } from '@/lib/blog/types';

// ── Status ──────────────────────────────────────────────────────────────────────

export const STATUS_CONFIG: Record<
  PostStatus,
  { label: string; icon: typeof FileEdit; className: string }
> = {
  DRAFT: {
    label: 'ฉบับร่าง',
    icon: FileEdit,
    className: 'bg-amber-500/12 text-amber-700 dark:text-amber-400 ring-amber-500/20',
  },
  PUBLISHED: {
    label: 'เผยแพร่แล้ว',
    icon: CheckCircle2,
    className: 'bg-emerald-500/12 text-emerald-700 dark:text-emerald-400 ring-emerald-500/20',
  },
  ARCHIVED: {
    label: 'เก็บถาวร',
    icon: Archive,
    className: 'bg-muted text-muted-foreground ring-border',
  },
};

export function StatusBadge({ status, className }: { status: PostStatus; className?: string }) {
  const cfg = STATUS_CONFIG[status];
  const Icon = cfg.icon;
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold ring-1 ring-inset',
        cfg.className,
        className,
      )}
    >
      <Icon className="size-3" />
      {cfg.label}
    </span>
  );
}

// ── Visibility ──────────────────────────────────────────────────────────────────

export const VISIBILITY_CONFIG: Record<
  PostVisibility,
  { label: string; icon: typeof Globe; hint: string }
> = {
  PUBLIC: { label: 'สาธารณะ', icon: Globe, hint: 'ทุกคนในระบบเห็นได้' },
  INTERNAL: { label: 'ภายในองค์กร', icon: Building2, hint: 'เฉพาะสมาชิกที่ล็อกอิน' },
  PRIVATE: { label: 'ส่วนตัว', icon: Lock, hint: 'เฉพาะคุณและผู้ดูแล' },
};

export function VisibilityBadge({ visibility }: { visibility: PostVisibility }) {
  const cfg = VISIBILITY_CONFIG[visibility];
  const Icon = cfg.icon;
  return (
    <span className="inline-flex items-center gap-1 text-[11px] font-medium text-muted-foreground">
      <Icon className="size-3" />
      {cfg.label}
    </span>
  );
}

/**
 * Facebook-style verified mark — a filled blue seal with a white check.
 * Icon-only by default; pass `label` to also render the "รับรองแล้ว" text.
 */
export function VerifiedBadge({ className, label = false }: { className?: string; label?: boolean }) {
  const icon = (
    <BadgeCheck
      className={cn('size-4 shrink-0 fill-sky-500 text-white', className)}
      aria-label="รับรองเนื้อหาแล้ว"
    />
  );
  if (!label) {
    return <span title="ตรวจสอบและรับรองเนื้อหาแล้ว" className="inline-flex align-middle">{icon}</span>;
  }
  return (
    <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-sky-600 dark:text-sky-400" title="ตรวจสอบและรับรองเนื้อหาแล้ว">
      {icon}
      รับรองแล้ว
    </span>
  );
}

// ── Tag chip ────────────────────────────────────────────────────────────────────

const DEFAULT_TAG_COLOR = '#7c3aed'; // violet-600 — matches the brand accent

// ── Readable tag text color ────────────────────────────────────────────────────
// Tag colors are user data; light ones (amber, sky) fail AA as 11px text on the
// ~12% tint. Adjust the hue toward black/white until it clears 4.5:1 against
// the light/dark page background, then let CSS pick per theme via the
// `.tag-chip` rule in globals.css (inline styles can't be theme-aware).

function hexToRgb(hex: string): [number, number, number] | null {
  const m = /^#([0-9a-f]{6})$/i.exec(hex.trim());
  if (!m) return null;
  const n = parseInt(m[1], 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

function luminance([r, g, b]: [number, number, number]): number {
  const lin = (v: number) => {
    const s = v / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
}

function contrast(l1: number, l2: number): number {
  const [hi, lo] = l1 > l2 ? [l1, l2] : [l2, l1];
  return (hi + 0.05) / (lo + 0.05);
}

const rgbToHex = (rgb: [number, number, number]) =>
  `#${rgb.map((v) => Math.round(v).toString(16).padStart(2, '0')).join('')}`;

/** Mix `rgb` toward `target` (0..1) step-wise until it clears 4.5:1 vs `bgLum`. */
function readableAgainst(rgb: [number, number, number], target: 0 | 255, bgLum: number): string {
  let cur = rgb;
  for (let i = 0; i < 20 && contrast(luminance(cur), bgLum) < 4.5; i++) {
    cur = cur.map((v) => v + (target - v) * 0.12) as [number, number, number];
  }
  return rgbToHex(cur);
}

const cache = new Map<string, { light: string; dark: string }>();

function readableTagColors(c: string): { light: string; dark: string } {
  const hit = cache.get(c);
  if (hit) return hit;
  const rgb = hexToRgb(c);
  // Non-hex color (unexpected) — pass through untouched.
  const out = rgb
    ? { light: readableAgainst(rgb, 0, 1), dark: readableAgainst(rgb, 255, 0.02) }
    : { light: c, dark: c };
  cache.set(c, out);
  return out;
}

/**
 * Inline style for a tag chip, tinted from the tag's own color. Pair with the
 * `tag-chip` className so the readable text color follows the active theme.
 */
export function tagChipStyle(color: string | null | undefined): React.CSSProperties {
  const c = color || DEFAULT_TAG_COLOR;
  const fg = readableTagColors(c);
  return {
    '--tag-chip-fg': fg.light,
    '--tag-chip-fg-dark': fg.dark,
    backgroundColor: `${c}1f`,
    borderColor: `${c}33`,
  } as React.CSSProperties;
}

export function TagChip({
  tag,
  size = 'sm',
  className,
}: {
  tag: Pick<Tag, 'name' | 'color'>;
  size?: 'xs' | 'sm';
  className?: string;
}) {
  return (
    <span
      style={tagChipStyle(tag.color)}
      className={cn(
        'tag-chip inline-flex items-center gap-1 rounded-full border font-medium leading-none',
        size === 'xs' ? 'px-1.5 py-0.5 text-[10px]' : 'px-2 py-0.5 text-[11px]',
        className,
      )}
    >
      <span
        className="size-1.5 shrink-0 rounded-full"
        style={{ backgroundColor: tag.color || DEFAULT_TAG_COLOR }}
      />
      {tag.name}
    </span>
  );
}

// ── Date + number formatting ────────────────────────────────────────────────────

const DTF = new Intl.DateTimeFormat('th-TH', { day: 'numeric', month: 'short', year: 'numeric' });
const DTF_FULL = new Intl.DateTimeFormat('th-TH', {
  day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit',
});

export function fmtDate(iso: string | null): string {
  if (!iso) return '—';
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? '—' : DTF.format(d);
}

export function fmtDateFull(iso: string | null): string {
  if (!iso) return '—';
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? '—' : DTF_FULL.format(d);
}

/** Compact count: 1,234 → "1.2k". */
export function fmtCount(n: number): string {
  if (n < 1000) return String(n);
  return `${(n / 1000).toFixed(n % 1000 >= 100 ? 1 : 0)}k`;
}

/** A post is "new" for its first 7 days (by publish date, falling back to created). */
export function isNewPost(publishedAt: string | null, createdAt: string): boolean {
  const ref = publishedAt ?? createdAt;
  return Date.now() - new Date(ref).getTime() < 7 * 24 * 60 * 60 * 1000;
}
