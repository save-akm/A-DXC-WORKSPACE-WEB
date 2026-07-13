'use client';

import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { X, Megaphone, Star, Check, CalendarClock, Info } from 'lucide-react';
import { AppIcon } from '@/components/app-icon';
import { cn } from '@/lib/utils';
import { IconPicker } from '../../apps/_components/icon-picker';
import { TYPE_CONFIG, LEVEL_CONFIG } from './announcement-meta';
import {
  ANNOUNCEMENT_TYPES,
  ANNOUNCEMENT_LEVELS,
  type Announcement,
  type AnnouncementType,
  type AnnouncementLevel,
  type CreateAnnouncementInput,
} from '@/lib/announcements/types';

// ── Shared styles ──────────────────────────────────────────────────────────────

const INPUT_CLASS =
  'w-full rounded-xl border border-border bg-background px-3 py-2.5 text-[13px] text-foreground placeholder:text-muted-foreground/50 outline-none focus:border-indigo-400/60 focus:ring-2 focus:ring-indigo-500/20 transition-colors';
const LABEL_CLASS =
  'mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-muted-foreground';

// ── Date helpers — ISO ⇆ <input type="datetime-local"> ───────────────────────────

/** ISO string → "YYYY-MM-DDTHH:mm" in the browser's local time. */
function isoToLocalInput(iso: string | null): string {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

/**
 * "YYYY-MM-DDTHH:mm" (local) → ISO date-time string, or null when empty.
 * Milliseconds are stripped so the value matches strict `date-time` validators
 * (e.g. "2026-06-28T00:00:00Z").
 */
function localInputToIso(value: string): string | null {
  if (!value) return null;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return null;
  return d.toISOString().replace(/\.\d{3}Z$/, 'Z');
}

/** Human-readable Thai date-time for the picker trigger. */
const PICKER_DTF = new Intl.DateTimeFormat('th-TH', {
  day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
});
function formatPickerValue(local: string): string {
  const d = new Date(local);
  if (Number.isNaN(d.getTime())) return '';
  return `${PICKER_DTF.format(d)} น.`;
}

/** Turn raw backend / schema validation errors into friendly Thai messages. */
function humanizeError(err: unknown): string {
  const raw = (err as Error)?.message?.trim() ?? '';
  if (!raw) return 'บันทึกไม่สำเร็จ';
  const lower = raw.toLowerCase();
  if (lower.includes('date-time') || lower.includes('startsat') || lower.includes('endsat')) {
    return 'รูปแบบวันที่/เวลาไม่ถูกต้อง กรุณาเลือกใหม่อีกครั้ง';
  }
  if (lower.includes('header')) return 'กรุณากรอกหัวข้อให้ถูกต้อง';
  if (lower.includes('detail')) return 'กรุณากรอกรายละเอียดให้ถูกต้อง';
  if (lower.includes('must ') || lower.includes('body/') || lower.includes('validation') || lower.includes('invalid')) {
    return 'ข้อมูลไม่ถูกต้อง กรุณาตรวจสอบอีกครั้ง';
  }
  return raw;
}

// ── ToggleRow (matches app-modal switch) ─────────────────────────────────────────

function ToggleRow({ label, hint, checked, onChange, icon: Icon }: {
  label: string;
  hint: string;
  checked: boolean;
  onChange: (v: boolean) => void;
  icon?: typeof Star;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className="flex w-full cursor-pointer items-center justify-between rounded-xl border border-border bg-background px-3 py-2.5 text-left transition-colors hover:bg-muted/40"
    >
      <div className="flex items-center gap-2">
        {Icon && <Icon className={cn('h-3.5 w-3.5', checked ? 'text-amber-500' : 'text-muted-foreground')} />}
        <div>
          <div className="text-[12px] font-semibold text-foreground">{label}</div>
          <div className="text-[10px] text-muted-foreground">{hint}</div>
        </div>
      </div>
      <span className={cn(
        'relative ml-3 h-[18px] w-8 shrink-0 rounded-full ring-1 ring-inset transition-colors duration-200',
        checked
          ? 'bg-emerald-500 shadow-[inset_0_1px_2px_rgba(0,0,0,0.12)] ring-emerald-600/25'
          : 'bg-muted-foreground/20 shadow-[inset_0_1px_2px_rgba(0,0,0,0.06)] ring-border/60',
      )}>
        <span className={cn(
          'absolute top-0.5 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-white shadow-sm transition-transform duration-200 ease-out',
          checked ? 'translate-x-[14px]' : 'translate-x-0.5',
        )}>
          {checked && <Check className="h-2 w-2 text-emerald-600" strokeWidth={3} />}
        </span>
      </span>
    </button>
  );
}

// ── DateTimeField — styled trigger over a native datetime-local picker ───────────

function DateTimeField({ label, value, onChange, min }: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  min?: string;
}) {
  const ref = useRef<HTMLInputElement>(null);

  function openPicker() {
    const el = ref.current as (HTMLInputElement & { showPicker?: () => void }) | null;
    if (!el) return;
    if (typeof el.showPicker === 'function') {
      try { el.showPicker(); return; } catch { /* fall through to focus */ }
    }
    el.focus();
  }

  return (
    <div>
      <label className={LABEL_CLASS}>{label}</label>
      <div className="group relative">
        {/* Transparent native input on top — captures clicks & anchors the picker */}
        <input
          ref={ref}
          type="datetime-local"
          value={value}
          min={min}
          onChange={(e) => onChange(e.target.value)}
          onClick={openPicker}
          className="absolute inset-0 z-0 h-full w-full cursor-pointer caret-transparent opacity-0 [&::-webkit-calendar-picker-indicator]:hidden"
        />
        {/* Visual trigger */}
        <div
          className={cn(
            'flex w-full items-center gap-2 rounded-xl border border-border bg-background px-3 py-2.5 text-left transition-colors',
            'group-hover:border-indigo-400/40 group-focus-within:border-indigo-400/60 group-focus-within:ring-2 group-focus-within:ring-indigo-500/20',
            value ? 'pr-9' : '',
          )}
        >
          <CalendarClock className="h-4 w-4 shrink-0 text-indigo-500" />
          <span className={cn('flex-1 truncate text-[13px]', value ? 'text-foreground' : 'text-muted-foreground/50')}>
            {value ? formatPickerValue(value) : 'เลือกวันและเวลา'}
          </span>
        </div>
        {/* Clear */}
        {value && (
          <button
            type="button"
            onClick={() => onChange('')}
            aria-label="ล้างวันที่"
            className="absolute right-2 top-1/2 z-10 flex h-6 w-6 -translate-y-1/2 cursor-pointer items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>
    </div>
  );
}

// ── Props ─────────────────────────────────────────────────────────────────────────

interface AnnouncementModalProps {
  open: boolean;
  announcement?: Announcement | null;
  onClose: () => void;
  onSubmit: (input: CreateAnnouncementInput) => Promise<void>;
}

// ── Component ──────────────────────────────────────────────────────────────────────

export function AnnouncementModal({ open, announcement, onClose, onSubmit }: AnnouncementModalProps) {
  const [header, setHeader] = useState('');
  const [detail, setDetail] = useState('');
  const [type, setType] = useState<AnnouncementType>('NOTICE');
  const [level, setLevel] = useState<AnnouncementLevel>('NOTICE');
  const [icon, setIcon] = useState<string | null>(null);
  const [isPriority, setIsPriority] = useState(false);
  const [isActive, setIsActive] = useState(true);
  const [startsAt, setStartsAt] = useState('');
  const [endsAt, setEndsAt] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    if (!open) return;
    if (announcement) {
      setHeader(announcement.header);
      setDetail(announcement.detail);
      setType(announcement.type);
      setLevel(announcement.level);
      setIcon(announcement.icon ?? null);
      setIsPriority(announcement.isPriority);
      setIsActive(announcement.isActive);
      setStartsAt(isoToLocalInput(announcement.startsAt));
      setEndsAt(isoToLocalInput(announcement.endsAt));
    } else {
      setHeader('');
      setDetail('');
      setType('NOTICE');
      setLevel('NOTICE');
      setIcon(null);
      setIsPriority(false);
      setIsActive(true);
      setStartsAt('');
      setEndsAt('');
    }
    setError(null);
    // Move focus to the modal panel (not any text field) so no stray blinking
    // caret appears on open — the user clicks a field to start typing.
    const t = setTimeout(() => panelRef.current?.focus(), 80);
    return () => clearTimeout(t);
  }, [announcement, open]);

  const isEdit = Boolean(announcement);
  const canSubmit = header.trim() && detail.trim();
  const typeCfg = TYPE_CONFIG[type];

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit) {
      setError('กรุณากรอกหัวข้อและรายละเอียด');
      return;
    }
    const startIso = localInputToIso(startsAt);
    const endIso = localInputToIso(endsAt);
    if (startIso && endIso && new Date(endIso).getTime() <= new Date(startIso).getTime()) {
      setError('เวลาสิ้นสุดต้องอยู่หลังเวลาเริ่มต้น');
      return;
    }
    setError(null);
    setSaving(true);
    try {
      const payload: CreateAnnouncementInput = {
        header: header.trim(),
        detail: detail.trim(),
        type,
        level,
        icon: icon || null,
        isPriority,
        isActive,
      };
      // On edit, send null to clear a date; on create, omit empty dates entirely.
      if (isEdit) {
        payload.startsAt = startIso;
        payload.endsAt = endIso;
      } else {
        if (startIso) payload.startsAt = startIso;
        if (endIso) payload.endsAt = endIso;
      }
      await onSubmit(payload);
      onClose();
    } catch (err) {
      setError(humanizeError(err));
    } finally {
      setSaving(false);
    }
  }

  if (!mounted) return null;

  return createPortal(
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            key="ann-backdrop"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
            onClick={() => !saving && onClose()}
          />

          {/* Modal */}
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              key="ann-modal"
              ref={panelRef}
              tabIndex={-1}
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
              className="relative w-full max-w-2xl overflow-hidden rounded-2xl bg-card shadow-2xl outline-none"
              onClick={e => e.stopPropagation()}
            >
              {/* Gradient stripe — follows the selected type */}
              <div className={cn('h-1 w-full bg-linear-to-r', typeCfg.gradient)} />

              {/* Header */}
              <div className="flex items-center justify-between border-b border-border/60 px-6 py-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-linear-to-br from-indigo-500 to-violet-600 shadow-md shadow-indigo-500/30">
                    <Megaphone className="h-4 w-4 text-white" />
                  </div>
                  <div>
                    <h2 className="text-[14px] font-bold text-foreground">
                      {isEdit ? 'แก้ไขประกาศ' : 'สร้างประกาศใหม่'}
                    </h2>
                    <p className="text-[11px] text-muted-foreground">
                      {isEdit ? `แก้ไข "${announcement?.header}"` : 'กรอกรายละเอียดประกาศที่จะแสดงบนระบบ'}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => !saving && onClose()}
                  className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <form onSubmit={handleSubmit}>
                <div className="grid max-h-[68vh] grid-cols-1 gap-0 overflow-y-auto md:grid-cols-2">

                  {/* ── Left column ── */}
                  <div className="space-y-4 px-6 py-5 md:border-r md:border-border/60">
                    {/* Header */}
                    <div>
                      <label className={LABEL_CLASS}>
                        หัวข้อ <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={header}
                        onChange={e => setHeader(e.target.value)}
                        placeholder="เช่น ประกาศปิดระบบ"
                        required
                        className={INPUT_CLASS}
                      />
                    </div>

                    {/* Detail */}
                    <div>
                      <label className={LABEL_CLASS}>
                        รายละเอียด <span className="text-red-500">*</span>
                      </label>
                      <textarea
                        value={detail}
                        onChange={e => setDetail(e.target.value)}
                        placeholder="ระบบจะปิดปรับปรุงในวันที่ 30 มิ.ย. เวลา 00:00–06:00 น."
                        rows={5}
                        required
                        className={cn(INPUT_CLASS, 'resize-none leading-relaxed')}
                      />
                    </div>

                    {/* Type */}
                    <div>
                      <label className={LABEL_CLASS}>ประเภท</label>
                      <div className="grid grid-cols-2 gap-2">
                        {ANNOUNCEMENT_TYPES.map((t) => {
                          const cfg = TYPE_CONFIG[t];
                          const Icon = cfg.icon;
                          const active = type === t;
                          return (
                            <button
                              key={t}
                              type="button"
                              onClick={() => setType(t)}
                              className={cn(
                                'flex cursor-pointer items-center gap-2 rounded-xl border px-2.5 py-2 text-[12px] font-semibold transition-all',
                                active
                                  ? 'border-indigo-500/50 bg-indigo-500/10 text-indigo-600 dark:text-indigo-400'
                                  : 'border-border bg-background text-muted-foreground hover:border-indigo-400/40 hover:text-foreground',
                              )}
                            >
                              <Icon className="h-3.5 w-3.5 shrink-0" />
                              <span className="truncate">{cfg.label}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>

                  {/* ── Right column ── */}
                  <div className="space-y-4 px-6 py-5">
                    {/* Level */}
                    <div>
                      <label className={LABEL_CLASS}>ระดับความสำคัญ</label>
                      <div className="grid grid-cols-2 gap-2">
                        {ANNOUNCEMENT_LEVELS.map((l) => {
                          const cfg = LEVEL_CONFIG[l];
                          const active = level === l;
                          return (
                            <button
                              key={l}
                              type="button"
                              onClick={() => setLevel(l)}
                              className={cn(
                                'flex cursor-pointer items-center gap-2 rounded-xl border px-2.5 py-2 text-[12px] font-semibold transition-all',
                                active
                                  ? 'border-indigo-500/50 bg-indigo-500/10 text-indigo-600 dark:text-indigo-400'
                                  : 'border-border bg-background text-muted-foreground hover:border-indigo-400/40 hover:text-foreground',
                              )}
                            >
                              <span className={cn('size-2 shrink-0 rounded-full', cfg.dot)} />
                              <span className="truncate">{cfg.label}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Icon — preview + picker */}
                    <div>
                      <label className={LABEL_CLASS}>ไอคอน</label>
                      <div className="flex items-center gap-3 rounded-xl border border-border bg-muted/20 px-3 py-2.5">
                        <div className={cn(
                          'flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-linear-to-br text-white shadow-md',
                          typeCfg.gradient,
                        )}>
                          <AppIcon name={icon} className="h-5 w-5" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-[12px] font-semibold text-foreground">
                            {header.trim() || 'หัวข้อประกาศ'}
                          </p>
                          <p className="mt-0.5 text-[10px] text-muted-foreground">
                            {icon ? `ไอคอน: ${icon}` : 'ตัวอย่างไอคอนบน banner'}
                          </p>
                        </div>
                        <IconPicker value={icon} onChange={setIcon} size="sm" />
                      </div>
                    </div>

                    {/* Schedule */}
                    <div className="grid grid-cols-2 gap-2">
                      <DateTimeField label="เริ่มแสดง" value={startsAt} onChange={setStartsAt} />
                      <DateTimeField label="สิ้นสุด" value={endsAt} onChange={setEndsAt} min={startsAt || undefined} />
                    </div>

                    {/* Toggles */}
                    <div className="space-y-2">
                      <ToggleRow
                        label="ปักหมุดสำคัญ"
                        hint="แสดงเด่นบนสุดของหน้าแรก"
                        checked={isPriority}
                        onChange={setIsPriority}
                        icon={Star}
                      />
                      <AnimatePresence initial={false}>
                        {isPriority && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            transition={{ duration: 0.2 }}
                            className="overflow-hidden"
                          >
                            <div className="flex items-start gap-2 rounded-xl border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-[11px] leading-relaxed text-amber-700 dark:text-amber-300">
                              <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                              <span>ปักหมุดได้ครั้งละ 1 ประกาศเท่านั้น — เมื่อบันทึก ระบบจะยกเลิกปักหมุดของประกาศก่อนหน้าโดยอัตโนมัติ</span>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                      <ToggleRow
                        label="เปิดใช้งาน"
                        hint="แสดงบน banner (ตามช่วงเวลา)"
                        checked={isActive}
                        onChange={setIsActive}
                      />
                    </div>
                  </div>
                </div>

                {/* Error */}
                {error && (
                  <div className="border-t border-border/60 bg-destructive/5 px-6 py-2.5 text-[12px] font-medium text-destructive">
                    {error}
                  </div>
                )}

                {/* Footer */}
                <div className="flex gap-3 border-t border-border/60 px-6 py-4">
                  <button
                    type="button"
                    onClick={() => !saving && onClose()}
                    className="flex-1 cursor-pointer rounded-xl border border-border px-4 py-2.5 text-[13px] font-semibold text-muted-foreground transition-colors hover:bg-muted"
                  >
                    ยกเลิก
                  </button>
                  <button
                    type="submit"
                    disabled={saving || !canSubmit}
                    className="flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-xl bg-linear-to-r from-indigo-500 to-violet-600 px-4 py-2.5 text-[13px] font-semibold text-white shadow-md shadow-indigo-500/30 transition-all hover:shadow-indigo-500/50 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {saving ? (
                      <>
                        <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                        กำลังบันทึก…
                      </>
                    ) : isEdit ? 'บันทึกการแก้ไข' : 'สร้างประกาศ'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>,
    document.body,
  );
}
