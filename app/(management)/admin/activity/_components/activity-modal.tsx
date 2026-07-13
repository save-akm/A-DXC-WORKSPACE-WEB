'use client';

import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { X, PartyPopper, Star, Check, CalendarClock, MapPin, Users, AlertCircle } from 'lucide-react';
import { AppIcon } from '@/components/app-icon';
import { cn } from '@/lib/utils';
import { IconPicker } from '../../apps/_components/icon-picker';
import { STATUS_CONFIG, humanizeActivityError } from './activity-meta';
import { ActivityTagPicker } from './activity-tag-picker';
import { ActivityImagePicker, validatePendingActivityImages } from './activity-image-picker';
import {
  ACTIVITY_STATUSES,
  type Activity,
  type ActivityStatus,
  type CreateActivityInput,
  type FeaturedSlots,
} from '@/lib/activity/types';

const INPUT_CLASS =
  'w-full rounded-xl border border-border bg-background px-3 py-2.5 text-[13px] text-foreground placeholder:text-muted-foreground/50 outline-none focus:border-indigo-400/60 focus:ring-2 focus:ring-indigo-500/20 transition-colors';
const LABEL_CLASS =
  'mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-muted-foreground';

function isoToLocalInput(iso: string | null): string {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function localInputToIso(value: string): string | null {
  if (!value) return null;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return null;
  return d.toISOString().replace(/\.\d{3}Z$/, 'Z');
}

const PICKER_DTF = new Intl.DateTimeFormat('th-TH', {
  day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
});
function formatPickerValue(local: string): string {
  const d = new Date(local);
  if (Number.isNaN(d.getTime())) return '';
  return `${PICKER_DTF.format(d)} น.`;
}

function ToggleRow({ label, hint, checked, onChange, icon: Icon, warn }: {
  label: string;
  hint: string;
  checked: boolean;
  onChange: (v: boolean) => void;
  icon?: typeof Star;
  warn?: boolean;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={cn(
        'flex w-full cursor-pointer items-center justify-between rounded-xl border px-3 py-2.5 text-left transition-colors hover:bg-muted/40',
        warn && checked ? 'border-amber-500/40 bg-amber-500/5' : 'border-border bg-background',
      )}
    >
      <div className="flex items-center gap-2">
        {Icon && (
          <Icon className={cn('h-3.5 w-3.5', checked ? 'text-amber-500' : 'text-muted-foreground')} />
        )}
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
      try { el.showPicker(); return; } catch { /* fall through */ }
    }
    el.focus();
  }

  return (
    <div>
      <label className={LABEL_CLASS}>{label}</label>
      <div className="group relative">
        <input
          ref={ref}
          type="datetime-local"
          value={value}
          min={min}
          onChange={(e) => onChange(e.target.value)}
          onClick={openPicker}
          className="absolute inset-0 z-0 h-full w-full cursor-pointer caret-transparent opacity-0 [&::-webkit-calendar-picker-indicator]:hidden"
        />
        <div className={cn(
          'flex w-full items-center gap-2 rounded-xl border border-border bg-background px-3 py-2.5 text-left transition-colors',
          'group-hover:border-indigo-400/40 group-focus-within:border-indigo-400/60 group-focus-within:ring-2 group-focus-within:ring-indigo-500/20',
        )}>
          <CalendarClock className="h-4 w-4 shrink-0 text-indigo-500" />
          <span className={cn('flex-1 truncate text-[13px]', value ? 'text-foreground' : 'text-muted-foreground/50')}>
            {value ? formatPickerValue(value) : 'เลือกวันและเวลา'}
          </span>
        </div>
      </div>
    </div>
  );
}

interface ActivityModalProps {
  open: boolean;
  activity?: Activity | null;
  featuredSlots: FeaturedSlots | null;
  onClose: () => void;
  onSubmit: (input: CreateActivityInput, pendingFiles: File[]) => Promise<void>;
}

export function ActivityModal({
  open,
  activity,
  featuredSlots,
  onClose,
  onSubmit,
}: ActivityModalProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [eventStartAt, setEventStartAt] = useState('');
  const [eventEndAt, setEventEndAt] = useState('');
  const [icon, setIcon] = useState<string | null>('PartyPopper');
  const [pendingFiles, setPendingFiles] = useState<File[]>([]);
  const [location, setLocation] = useState('');
  const [status, setStatus] = useState<ActivityStatus>('UPCOMING');
  const [maxParticipants, setMaxParticipants] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [isFeatured, setIsFeatured] = useState(false);
  const [tagIds, setTagIds] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    if (!open) return;
    if (activity) {
      setName(activity.name);
      setDescription(activity.description ?? '');
      setEventStartAt(isoToLocalInput(activity.eventStartAt));
      setEventEndAt(isoToLocalInput(activity.eventEndAt));
      setIcon(activity.icon ?? 'PartyPopper');
      setPendingFiles([]);
      setLocation(activity.location ?? '');
      setStatus(activity.status);
      setMaxParticipants(activity.maxParticipants != null ? String(activity.maxParticipants) : '');
      setIsActive(activity.isActive);
      setIsFeatured(activity.isFeatured);
      setTagIds(activity.tags.map((t) => t.id));
    } else {
      setName('');
      setDescription('');
      setEventStartAt('');
      setEventEndAt('');
      setIcon('PartyPopper');
      setPendingFiles([]);
      setLocation('');
      setStatus('UPCOMING');
      setMaxParticipants('');
      setIsActive(true);
      setIsFeatured(false);
      setTagIds([]);
    }
    setError(null);
    const t = setTimeout(() => panelRef.current?.focus(), 80);
    return () => clearTimeout(t);
  }, [activity, open]);

  const isEdit = Boolean(activity);
  const featuredFull =
    isFeatured &&
    !activity?.isFeatured &&
    featuredSlots != null &&
    featuredSlots.remaining <= 0;


  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const startIso = localInputToIso(eventStartAt);
    const endIso = localInputToIso(eventEndAt);
    if (!startIso) {
      setError('กรุณาเลือกวันและเวลาเริ่มต้น');
      return;
    }
    if (!endIso) {
      setError('กรุณาเลือกวันและเวลาสิ้นสุด');
      return;
    }
    if (new Date(endIso).getTime() <= new Date(startIso).getTime()) {
      setError('เวลาสิ้นสุดต้องอยู่หลังเวลาเริ่มต้น');
      return;
    }
    if (!name.trim()) {
      setError('กรุณากรอกชื่อกิจกรรม');
      return;
    }
    const maxParsed = maxParticipants.trim() ? Number(maxParticipants) : null;
    if (maxParsed !== null && (!Number.isInteger(maxParsed) || maxParsed < 1)) {
      setError('จำนวนผู้เข้าร่วมต้องเป็นจำนวนเต็ม 1 ขึ้นไป');
      return;
    }
    if (featuredFull) {
      setError('ช่องแสดงหน้าบ้านเต็มแล้ว (สูงสุด 5 รายการ)');
      return;
    }
    if (!isEdit && pendingFiles.length > 0) {
      const fileErr = validatePendingActivityImages(pendingFiles);
      if (fileErr) {
        setError(fileErr);
        return;
      }
    }
    setError(null);
    setSaving(true);
    try {
      const payload: CreateActivityInput = {
        name: name.trim(),
        eventStartAt: startIso,
        eventEndAt: endIso,
        description: description.trim() || null,
        icon: icon || null,
        location: location.trim() || null,
        status,
        // Create API rejects null — omit field for unlimited; PATCH allows null.
        maxParticipants: maxParsed ?? (isEdit ? null : undefined),
        isActive,
        isFeatured,
        tagIds,
      };
      await onSubmit(payload, isEdit ? [] : pendingFiles);
      onClose();
    } catch (err) {
      setError(humanizeActivityError(err));
    } finally {
      setSaving(false);
    }
  }

  if (!mounted) return null;

  return createPortal(
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            key="act-backdrop"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
            onClick={() => !saving && onClose()}
          />
          <div className="fixed inset-0 z-50 overflow-y-auto p-3 sm:p-4">
            <div className="flex min-h-full items-center justify-center">
            <motion.div
              key="act-modal"
              ref={panelRef}
              tabIndex={-1}
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
              className="relative flex w-full max-h-[min(860px,calc(100dvh-1.5rem))] max-w-3xl flex-col overflow-hidden rounded-2xl bg-card shadow-2xl outline-none lg:max-w-4xl xl:max-w-5xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="h-1 w-full bg-linear-to-r from-violet-500 via-fuchsia-500 to-purple-600" />

              <div className="flex shrink-0 items-center justify-between border-b border-border/60 px-4 py-3 sm:px-6 sm:py-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-linear-to-br from-violet-500 to-fuchsia-600 shadow-md shadow-violet-500/30">
                    <PartyPopper className="h-4 w-4 text-white" />
                  </div>
                  <div>
                    <h2 className="text-[14px] font-bold text-foreground">
                      {isEdit ? 'แก้ไขกิจกรรม' : 'สร้างกิจกรรมใหม่'}
                    </h2>
                    <p className="text-[11px] text-muted-foreground">
                      {isEdit ? `แก้ไข "${activity?.name}"` : 'กรอกรายละเอียดกิจกรรม'}
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

              <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col overflow-hidden">
                <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
                <div className="grid grid-cols-1 gap-0 md:grid-cols-2">
                  <div className="space-y-3 px-4 py-4 sm:space-y-4 sm:px-6 sm:py-5 md:border-r md:border-border/60">
                    <div>
                      <label className={LABEL_CLASS}>
                        ชื่อกิจกรรม <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Team Building 2026"
                        className={INPUT_CLASS}
                      />
                    </div>

                    <DateTimeField
                      label="วันและเวลาเริ่มต้น *"
                      value={eventStartAt}
                      onChange={setEventStartAt}
                    />

                    <DateTimeField
                      label="วันและเวลาสิ้นสุด *"
                      value={eventEndAt}
                      onChange={setEventEndAt}
                      min={eventStartAt || undefined}
                    />

                    <div>
                      <label className={LABEL_CLASS}>สถานที่</label>
                      <div className="relative">
                        <MapPin className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                        <input
                          type="text"
                          value={location}
                          onChange={(e) => setLocation(e.target.value)}
                          placeholder="HQ Room A"
                          className={cn(INPUT_CLASS, 'pl-9')}
                        />
                      </div>
                    </div>

                    <div>
                      <label className={LABEL_CLASS}>รายละเอียด</label>
                      <textarea
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        rows={3}
                        placeholder="อธิบายกิจกรรม…"
                        className={cn(INPUT_CLASS, 'resize-none lg:min-h-[88px]')}
                      />
                    </div>

                    {isEdit && (
                      <p className="text-[11px] text-muted-foreground">
                        จัดการรูปภาพได้ที่หน้ารายละเอียดกิจกรรม
                      </p>
                    )}
                  </div>

                  <div className="space-y-3 px-4 py-4 sm:space-y-4 sm:px-6 sm:py-5">
                    <div>
                      <label className={LABEL_CLASS}>ไอคอน</label>
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-linear-to-br from-violet-500 to-fuchsia-600 text-white">
                          <AppIcon name={icon} className="h-4 w-4" />
                        </div>
                        <IconPicker value={icon} onChange={setIcon} />
                      </div>
                    </div>

                    <div>
                      <label className={LABEL_CLASS}>สถานะกิจกรรม</label>
                      <div className="flex flex-wrap gap-1.5">
                        {ACTIVITY_STATUSES.map((s) => (
                          <button
                            key={s}
                            type="button"
                            onClick={() => setStatus(s)}
                            className={cn(
                              'cursor-pointer rounded-lg border px-2.5 py-1.5 text-[11px] font-semibold transition-colors',
                              status === s
                                ? 'border-indigo-500/40 bg-indigo-500/10 text-indigo-700 dark:text-indigo-400'
                                : 'border-border text-muted-foreground hover:text-foreground',
                            )}
                          >
                            {STATUS_CONFIG[s].label}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className={LABEL_CLASS}>จำนวนผู้เข้าร่วมสูงสุด</label>
                      <div className="relative">
                        <Users className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                        <input
                          type="number"
                          min={1}
                          value={maxParticipants}
                          onChange={(e) => setMaxParticipants(e.target.value)}
                          placeholder="ไม่จำกัด"
                          className={cn(INPUT_CLASS, 'pl-9')}
                        />
                      </div>
                    </div>

                    <ActivityTagPicker
                      active={open}
                      value={tagIds}
                      onChange={setTagIds}
                    />

                    <ToggleRow
                      label="เปิดใช้งาน"
                      hint="แสดงในระบบเมื่อเปิด"
                      checked={isActive}
                      onChange={setIsActive}
                    />

                    <ToggleRow
                      label="แสดงหน้าบ้าน"
                      hint={
                        featuredSlots
                          ? `ใช้แล้ว ${featuredSlots.used}/${featuredSlots.max} ช่อง`
                          : 'แสดงในหน้า landing (สูงสุด 5)'
                      }
                      checked={isFeatured}
                      onChange={setIsFeatured}
                      icon={Star}
                      warn={featuredFull}
                    />

                    {featuredFull && (
                      <p className="flex items-start gap-1.5 text-[11px] text-amber-600 dark:text-amber-400">
                        <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                        ช่องหน้าบ้านเต็มแล้ว — ปิด featured ของกิจกรรมอื่นก่อน
                      </p>
                    )}
                  </div>
                </div>

                {!isEdit && (
                  <div className="border-t border-border/60 bg-muted/10 px-4 py-3 sm:px-6 sm:py-4">
                    <ActivityImagePicker
                      files={pendingFiles}
                      onChange={setPendingFiles}
                      disabled={saving}
                      fullWidth
                    />
                  </div>
                )}

                {error && (
                  <div className="mx-4 mb-0 rounded-xl border border-destructive/30 bg-destructive/5 px-3 py-2 text-[12px] text-destructive sm:mx-6">
                    {error}
                  </div>
                )}
                </div>

                <div className="flex shrink-0 gap-3 border-t border-border/60 bg-card px-4 py-3 sm:px-6 sm:py-4">
                  <button
                    type="button"
                    disabled={saving}
                    onClick={onClose}
                    className="flex-1 cursor-pointer rounded-xl border border-border px-4 py-2.5 text-[13px] font-semibold text-muted-foreground transition-colors hover:bg-muted disabled:opacity-60"
                  >
                    ยกเลิก
                  </button>
                  <button
                    type="submit"
                    disabled={saving || featuredFull}
                    className="flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-xl bg-linear-to-r from-violet-600 to-fuchsia-600 px-4 py-2.5 text-[13px] font-semibold text-white transition-all hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {saving ? (
                      <>
                        <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                        กำลังบันทึก…
                      </>
                    ) : (
                      isEdit ? 'บันทึกการแก้ไข' : 'สร้างกิจกรรม'
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
            </div>
          </div>
        </>
      )}
    </AnimatePresence>,
    document.body,
  );
}
