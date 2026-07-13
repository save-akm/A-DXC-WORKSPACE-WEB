'use client';

import { useState, type ReactNode } from 'react';
import { Check, Copy } from 'lucide-react';
import { cn } from '@/lib/utils';
import { actionMeta, statusMeta } from '@/lib/audit/format';
import type { AuditAction, AuditChange, JsonRecord, LoginStatus } from '@/lib/audit/types';

// ── Badges ────────────────────────────────────────────────────────────────────

export function ActionBadge({ action, className }: { action: AuditAction; className?: string }) {
  const meta = actionMeta(action);
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset',
        meta.className,
        className,
      )}
    >
      <span className={cn('size-1.5 rounded-full', meta.dot)} />
      {meta.label}
    </span>
  );
}

export function StatusBadge({ status, className }: { status: LoginStatus; className?: string }) {
  const meta = statusMeta(status);
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset',
        meta.className,
        className,
      )}
    >
      <span className={cn('size-1.5 rounded-full', meta.dot)} />
      {meta.label}
    </span>
  );
}

// ── Initial avatar ──────────────────────────────────────────────────────────────

const AVATAR_COLORS = [
  'bg-violet-500', 'bg-sky-500', 'bg-emerald-500', 'bg-amber-500',
  'bg-rose-500', 'bg-indigo-500', 'bg-teal-500', 'bg-fuchsia-500',
];

export function InitialAvatar({ name, size = 'md' }: { name: string | null | undefined; size?: 'sm' | 'md' }) {
  const label = (name ?? '?').trim();
  const initial = label ? label[0]!.toUpperCase() : '?';
  const hash = label.split('').reduce((a, c) => a + c.charCodeAt(0), 0);
  const color = AVATAR_COLORS[hash % AVATAR_COLORS.length];
  return (
    <span
      className={cn(
        'flex shrink-0 items-center justify-center rounded-full font-semibold text-white',
        size === 'sm' ? 'size-7 text-xs' : 'size-8 text-[13px]',
        color,
      )}
    >
      {initial}
    </span>
  );
}

// ── Detail rows ─────────────────────────────────────────────────────────────────

export function MetaRow({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="grid grid-cols-[120px_1fr] gap-3 py-2.5">
      <dt className="text-xs font-medium text-muted-foreground">{label}</dt>
      <dd className="min-w-0 break-words text-sm">{children}</dd>
    </div>
  );
}

export function Mono({ children, className }: { children: ReactNode; className?: string }) {
  return <span className={cn('font-mono text-xs', className)}>{children}</span>;
}

export function CopyButton({ value }: { value: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      onClick={() => {
        navigator.clipboard.writeText(value).then(() => {
          setCopied(true);
          setTimeout(() => setCopied(false), 1500);
        });
      }}
      className="inline-flex size-6 cursor-pointer items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
      title="คัดลอก"
    >
      {copied ? <Check className="size-3.5 text-emerald-500" /> : <Copy className="size-3.5" />}
    </button>
  );
}

// ── JSON & diff ───────────────────────────────────────────────────────────────

function fmtValue(v: unknown): string {
  if (v === null) return 'null';
  if (v === undefined) return '—';
  if (typeof v === 'object') return JSON.stringify(v);
  return String(v);
}

/** Pretty-printed JSON block for metadata / raw snapshots. */
export function JsonView({ data }: { data: JsonRecord }) {
  if (!data || Object.keys(data).length === 0) {
    return <p className="text-sm text-muted-foreground">—</p>;
  }
  return (
    <pre className="max-h-72 overflow-auto rounded-lg border bg-muted/40 p-3 text-xs leading-relaxed">
      <code>{JSON.stringify(data, null, 2)}</code>
    </pre>
  );
}

/** Shared 3-column before → after grid used by ChangesView and FieldDiff. */
function DiffGrid({ rows }: { rows: { field: string; before: string; after: string }[] }) {
  return (
    <div className="overflow-hidden rounded-lg border">
      <div className="grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)] border-b bg-muted/40 text-xs font-medium text-muted-foreground">
        <div className="px-3 py-2">ฟิลด์</div>
        <div className="border-l px-3 py-2">ก่อน</div>
        <div className="border-l px-3 py-2">หลัง</div>
      </div>
      {rows.map((row) => {
        const changed = row.before !== row.after;
        return (
          <div
            key={row.field}
            className="grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)] border-b text-xs last:border-b-0"
          >
            <div className="truncate px-3 py-2 font-medium" title={row.field}>{row.field}</div>
            <div className={cn('break-words border-l px-3 py-2 font-mono', changed && 'bg-rose-500/5 text-rose-600 dark:text-rose-400')}>{row.before}</div>
            <div className={cn('break-words border-l px-3 py-2 font-mono', changed && 'bg-emerald-500/5 text-emerald-600 dark:text-emerald-400')}>{row.after}</div>
          </div>
        );
      })}
    </div>
  );
}

/** Renders the detail endpoint's ready-made `changes` array. */
export function ChangesView({ changes }: { changes: AuditChange[] }) {
  if (!changes || changes.length === 0) {
    return <p className="text-sm text-muted-foreground">ไม่มีข้อมูลการเปลี่ยนแปลง</p>;
  }
  return <DiffGrid rows={changes.map((c) => ({ field: c.field, before: fmtValue(c.before), after: fmtValue(c.after) }))} />;
}

/**
 * Field-level before/after diff derived from full snapshots — used for CREATE /
 * DELETE where the whole object is the change and there's no `changes` array.
 */
export function FieldDiff({ before, after }: { before: JsonRecord; after: JsonRecord }) {
  const b = before ?? {};
  const a = after ?? {};
  const keys = Array.from(new Set([...Object.keys(b), ...Object.keys(a)])).sort();

  if (keys.length === 0) {
    return <p className="text-sm text-muted-foreground">ไม่มีข้อมูลการเปลี่ยนแปลง</p>;
  }

  return (
    <DiffGrid
      rows={keys.map((key) => ({
        field: key,
        before: fmtValue((b as Record<string, unknown>)[key]),
        after: fmtValue((a as Record<string, unknown>)[key]),
      }))}
    />
  );
}

// ── Empty / error states ────────────────────────────────────────────────────────

export function EmptyState({ icon: Icon, title, hint }: { icon: ReactNode; title: string; hint?: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 py-20 text-center">
      <div className="text-muted-foreground/40">{Icon}</div>
      <p className="text-sm font-medium text-muted-foreground">{title}</p>
      {hint ? <p className="text-xs text-muted-foreground/70">{hint}</p> : null}
    </div>
  );
}