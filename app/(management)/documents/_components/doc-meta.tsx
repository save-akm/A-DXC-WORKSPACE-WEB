'use client';

import Link from 'next/link';
import {
  FileText,
  FileSpreadsheet,
  FileType2,
  FileCode2,
  Link2,
  Loader2,
  AlertCircle,
  type LucideIcon,
} from 'lucide-react';
import { UserAvatar } from '@/components/ui/user-avatar';
import { cn } from '@/lib/utils';
import type {
  AccessLevel, DocCategory, DocumentPerson, DocumentStatus, SourceType,
} from '../types';

// ── File type icon ────────────────────────────────────────────────────────────

const FILE_STYLES: Record<string, { icon: LucideIcon; className: string }> = {
  PDF:  { icon: FileText,        className: 'bg-rose-500/10 text-rose-600 dark:text-rose-400' },
  DOCX: { icon: FileType2,       className: 'bg-sky-500/10 text-sky-600 dark:text-sky-400' },
  XLSX: { icon: FileSpreadsheet, className: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' },
  CSV:  { icon: FileSpreadsheet, className: 'bg-teal-500/10 text-teal-600 dark:text-teal-400' },
  TXT:  { icon: FileCode2,       className: 'bg-muted text-muted-foreground' },
  LINK: { icon: Link2,           className: 'bg-violet-500/10 text-violet-600 dark:text-violet-400' },
};

/** ไอคอนประจำชนิดไฟล์ — LINK ใช้ไอคอนลิงก์เสมอ */
export function DocIcon({
  sourceType,
  fileType,
  className,
}: {
  sourceType: SourceType;
  fileType: string | null;
  className?: string;
}) {
  const key = sourceType === 'LINK' ? 'LINK' : (fileType?.toUpperCase() ?? 'TXT');
  const { icon: Icon, className: style } = FILE_STYLES[key] ?? FILE_STYLES.TXT;
  return (
    <span
      className={cn(
        'flex size-8 shrink-0 items-center justify-center rounded-lg',
        style,
        className,
      )}
    >
      <Icon className="size-4" />
    </span>
  );
}

/** ป้ายชนิดเอกสาร — ชนิดไฟล์ หรือ "ลิงก์" */
export function DocTypeLabel({
  sourceType,
  fileType,
}: {
  sourceType: SourceType;
  fileType: string | null;
}) {
  return (
    <span className="inline-flex items-center rounded-full bg-muted px-2 py-0.5 font-mono text-[10px] font-semibold tracking-wide text-muted-foreground">
      {sourceType === 'LINK' ? 'LINK' : (fileType?.toUpperCase() ?? '—')}
    </span>
  );
}

// ── Document status ───────────────────────────────────────────────────────────

const STATUS_META: Record<
  DocumentStatus,
  { label: string; className: string; spinner?: boolean; failed?: boolean }
> = {
  PENDING:    { label: 'รอประมวลผล',       className: 'text-muted-foreground', spinner: true },
  PROCESSING: { label: 'กำลังประมวลผล',    className: 'text-muted-foreground', spinner: true },
  READY:      { label: 'พร้อมใช้',          className: 'text-emerald-600 dark:text-emerald-400' },
  FAILED:     { label: 'ประมวลผลไม่สำเร็จ', className: 'text-rose-600 dark:text-rose-400', failed: true },
};

export function StatusBadge({ status }: { status: DocumentStatus }) {
  const meta = STATUS_META[status];
  return (
    <span className={cn('inline-flex items-center gap-1.5 text-xs font-medium', meta.className)}>
      {meta.spinner ? (
        <Loader2 className="size-3 animate-spin" />
      ) : meta.failed ? (
        <AlertCircle className="size-3" />
      ) : (
        <span className="size-1.5 rounded-full bg-emerald-500" />
      )}
      {meta.label}
    </span>
  );
}

// ── Category (เฉพาะเอกสารใน PROJECT collection) ──────────────────────────────

export const CATEGORY_LABELS: Record<DocCategory, string> = {
  U0_J5_APPROVE: 'U0–J5 Approve',
  J_FLOW: 'J-Flow',
  GITSP: 'GITSP',
  GENERAL: 'ทั่วไป',
};

export function CategoryBadge({ category }: { category: DocCategory }) {
  return (
    <span className="inline-flex items-center rounded-full bg-indigo-500/10 px-2 py-0.5 text-[10px] font-semibold text-indigo-600 dark:text-indigo-400">
      {CATEGORY_LABELS[category]}
    </span>
  );
}

// ── Access level / member role ────────────────────────────────────────────────

const ROLE_STYLES: Record<AccessLevel, { label: string; className: string }> = {
  OWNER:  { label: 'เจ้าของ', className: 'bg-violet-500/10 text-violet-600 dark:text-violet-400' },
  EDITOR: { label: 'แก้ไขได้', className: 'bg-sky-500/10 text-sky-600 dark:text-sky-400' },
  VIEWER: { label: 'ดูอย่างเดียว', className: 'bg-muted text-muted-foreground' },
};

export function RoleBadge({ role }: { role: AccessLevel }) {
  const meta = ROLE_STYLES[role];
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold',
        meta.className,
      )}
    >
      {meta.label}
    </span>
  );
}

// ── Formatters ────────────────────────────────────────────────────────────────

export function formatBytes(bytes: number | null): string {
  if (bytes === null || Number.isNaN(bytes)) return '—';
  if (bytes < 1024) return `${bytes} B`;
  const units = ['KB', 'MB', 'GB'];
  let v = bytes / 1024;
  let u = 0;
  while (v >= 1024 && u < units.length - 1) {
    v /= 1024;
    u += 1;
  }
  return `${v >= 10 ? Math.round(v) : v.toFixed(1)} ${units[u]}`;
}

export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('th-TH', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

/** ต่อนามสกุลไฟล์ให้ชื่อที่บันทึกลงเครื่อง ถ้าชื่อเอกสารยังไม่มีนามสกุลนั้นอยู่แล้ว */
export function buildDownloadFilename(title: string, fileType: string | null): string {
  if (!fileType) return title;
  const ext = fileType.toLowerCase();
  return title.toLowerCase().endsWith(`.${ext}`) ? title : `${title}.${ext}`;
}

// ── Collection chips (โชว์ว่าเอกสารอยู่ collection ไหนบ้าง) ───────────────────

export function CollectionChips({
  collections,
}: {
  collections: Array<{ id: string; name: string }>;
}) {
  if (collections.length === 0) {
    return <span className="text-xs text-muted-foreground/50">—</span>;
  }
  const shown = collections.slice(0, 2);
  const rest = collections.length - shown.length;
  return (
    <div className="flex flex-wrap items-center gap-1">
      {shown.map(c => (
        <Link
          key={c.id}
          href={`/documents/${c.id}`}
          title={c.name}
          className="max-w-24 truncate rounded-full bg-indigo-500/10 px-2 py-0.5 text-[10px] font-medium text-indigo-600 transition-colors hover:bg-indigo-500/20 dark:text-indigo-400"
        >
          {c.name}
        </Link>
      ))}
      {rest > 0 && (
        <span className="rounded-full bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
          +{rest}
        </span>
      )}
    </div>
  );
}

// ── Person helpers (uploader / member avatars) ────────────────────────────────

const AVATAR_COLORS = [
  'bg-violet-500', 'bg-sky-500', 'bg-emerald-500', 'bg-amber-500',
  'bg-rose-500', 'bg-teal-500', 'bg-indigo-500', 'bg-fuchsia-500',
];

/** สีประจำตัวคงที่ต่อ user id — ใช้แทน avatar เมื่อไม่มีรูป */
export function avatarColorForId(id: string): string {
  let hash = 0;
  for (const ch of id) hash = (hash * 31 + ch.charCodeAt(0)) | 0;
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

export function displayPersonName(u: {
  firstName?: string | null;
  lastName?: string | null;
  email?: string | null;
  nickname?: string | null;
}): string {
  if (u.nickname?.trim()) return u.nickname.trim();
  const name = [u.firstName, u.lastName].filter(Boolean).join(' ');
  return name || u.email || 'ไม่ทราบชื่อ';
}

export function DocUploaderCell({
  uploader,
}: {
  uploader: DocumentPerson | null;
}) {
  if (!uploader) {
    return <span className="text-xs text-muted-foreground">—</span>;
  }

  const label = displayPersonName(uploader);
  const initial = (uploader.nickname || uploader.firstName || uploader.email || '?').charAt(0);

  return (
    <div className="flex min-w-0 items-center gap-2">
      <UserAvatar
        avatarUrl={uploader.avatarUrl}
        initial={initial}
        color={avatarColorForId(uploader.id)}
        size="xs"
      />
      <span className="truncate text-xs text-muted-foreground">{label}</span>
    </div>
  );
}
