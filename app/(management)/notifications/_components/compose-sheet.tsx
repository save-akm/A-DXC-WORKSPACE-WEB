'use client';

import { useEffect, useMemo, useState } from 'react';
import { Loader2, Search, Send, Users, X } from 'lucide-react';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { AppIcon } from '@/components/app-icon';
import { cn } from '@/lib/utils';
import { fetchRoles, type ApiRole } from '@/lib/api/roles';
import { fetchUserOptions } from '@/lib/api/users';
import { createNotification } from '@/lib/api/admin-notifications';
import { CHANNEL_LABELS, SCOPE_LABELS, priorityMeta, typeMeta } from '@/lib/notifications/meta';
import {
  NOTIFICATION_CHANNELS,
  NOTIFICATION_PRIORITIES,
  COMPOSABLE_NOTIFICATION_TYPES,
  TARGET_SCOPES,
  type CreateNotificationInput,
  type NotificationChannel,
  type NotificationPriority,
  type NotificationType,
  type TargetScope,
} from '@/lib/notifications/types';
import { IconChip, PriorityBadge, TypeBadge } from './notification-bits';

interface PickedUser {
  id: string;
  name: string;
  sub: string;
}

const LABEL ='mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-muted-foreground';
const FIELD =
  'w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/50 outline-none transition-colors focus:border-brand/50 focus:ring-2 focus:ring-brand/20';

function localToIso(v: string): string | null {
  if (!v) return null;
  const d = new Date(v);
  return Number.isNaN(d.getTime()) ? null : d.toISOString().replace(/\.\d{3}Z$/, 'Z');
}

interface Props {
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
}

export function ComposeSheet({ open, onClose, onCreated }: Props) {
  const [header, setHeader] = useState('');
  const [detail, setDetail] = useState('');
  const [type, setType] = useState<NotificationType>('SYSTEM');
  const [priority, setPriority] = useState<NotificationPriority>('NORMAL');
  const [channel, setChannel] = useState<NotificationChannel>('IN_APP');
  const [scope, setScope] = useState<TargetScope>('SYSTEM');
  const [icon, setIcon] = useState('');
  const [actionUrl, setActionUrl] = useState('');
  const [scheduledAt, setScheduledAt] = useState('');
  const [expiresAt, setExpiresAt] = useState('');

  const [roles, setRoles] = useState<ApiRole[]>([]);
  const [roleIds, setRoleIds] = useState<string[]>([]);

  const [userQuery, setUserQuery] = useState('');
  const [allUsers, setAllUsers] = useState<PickedUser[]>([]);
  const [usersLoaded, setUsersLoaded] = useState(false);
  const [usersLoading, setUsersLoading] = useState(false);
  const [pickedUsers, setPickedUsers] = useState<PickedUser[]>([]);

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Reset on each open.
  useEffect(() => {
    if (!open) return;
    setHeader(''); setDetail(''); setType('SYSTEM'); setPriority('NORMAL');
    setChannel('IN_APP'); setScope('SYSTEM'); setIcon(''); setActionUrl('');
    setScheduledAt(''); setExpiresAt('');
    setRoleIds([]); setPickedUsers([]); setUserQuery('');
    setError(null); setSaving(false);
  }, [open]);

  // Lazy-load roles the first time ROLE scope is needed.
  useEffect(() => {
    if (scope !== 'ROLE' || roles.length > 0) return;
    fetchRoles().then(setRoles).catch(() => setRoles([]));
  }, [scope, roles.length]);

  // Load the lightweight user list once when PERSONAL scope is first opened,
  // then filter client-side as the user types (the options endpoint returns all).
  useEffect(() => {
    if (scope !== 'PERSONAL' || usersLoaded) return;
    setUsersLoading(true);
    fetchUserOptions()
      .then((list) => {
        setAllUsers(
          list.map((u) => ({
            id: u.id,
            name: [u.firstName, u.lastName].filter(Boolean).join(' ') || u.nickname || u.email || u.id,
            sub: u.employeeId || u.email || '',
          })),
        );
        setUsersLoaded(true);
      })
      .catch(() => setAllUsers([]))
      .finally(() => setUsersLoading(false));
  }, [scope, usersLoaded]);

  const pickedIds = useMemo(() => new Set(pickedUsers.map((u) => u.id)), [pickedUsers]);

  const userResults = useMemo(() => {
    const q = userQuery.trim().toLowerCase();
    const base = q
      ? allUsers.filter((u) => u.name.toLowerCase().includes(q) || u.sub.toLowerCase().includes(q))
      : allUsers;
    return base.slice(0, 30);
  }, [allUsers, userQuery]);

  const meta = typeMeta(type);

  const canSubmit =
    header.trim().length > 0 &&
    detail.trim().length > 0 &&
    (scope === 'SYSTEM' ||
      (scope === 'ROLE' && roleIds.length > 0) ||
      (scope === 'PERSONAL' && pickedUsers.length > 0));

  // Tell the admin exactly what's missing instead of a silent disabled button.
  const missingHint = !header.trim()
    ? 'กรอกหัวข้อก่อนส่ง'
    : !detail.trim()
      ? 'กรอกรายละเอียดก่อนส่ง'
      : scope === 'ROLE' && roleIds.length === 0
        ? 'เลือกบทบาทเป้าหมายอย่างน้อย 1 รายการ'
        : scope === 'PERSONAL' && pickedUsers.length === 0
          ? 'เลือกผู้รับอย่างน้อย 1 คน'
          : null;

  function toggleRole(id: string) {
    setRoleIds((prev) => (prev.includes(id) ? prev.filter((r) => r !== id) : [...prev, id]));
  }
  function togglePickUser(u: PickedUser) {
    setPickedUsers((prev) => (prev.some((p) => p.id === u.id) ? prev.filter((p) => p.id !== u.id) : [...prev, u]));
  }

  async function submit() {
    if (!canSubmit || saving) return;
    setSaving(true);
    setError(null);
    const payload: CreateNotificationInput = {
      header: header.trim(),
      detail: detail.trim(),
      type,
      priority,
      channel,
      targetScope: scope,
      icon: icon.trim() || null,
      actionUrl: actionUrl.trim() || null,
    };
    if (scope === 'ROLE') payload.roleIds = roleIds;
    if (scope === 'PERSONAL') payload.userIds = pickedUsers.map((u) => u.id);
    const sIso = localToIso(scheduledAt);
    const eIso = localToIso(expiresAt);
    if (sIso) payload.scheduledAt = sIso;
    if (eIso) payload.expiresAt = eIso;

    try {
      await createNotification(payload);
      onCreated();
      onClose();
    } catch (e) {
      setError((e as Error)?.message ?? 'ส่งการแจ้งเตือนไม่สำเร็จ');
    } finally {
      setSaving(false);
    }
  }

  return (
    <Sheet open={open} onOpenChange={(v) => !v && !saving && onClose()}>
      <SheetContent side="right" className="w-full gap-0 overflow-y-auto p-0 sm:max-w-xl">
        <SheetHeader className="gap-1 border-b p-5 pr-14">
          <SheetTitle className="flex items-center gap-2 text-base">
            <span className="inline-flex size-8 items-center justify-center rounded-lg bg-brand-muted text-brand">
              <Send className="size-4" />
            </span>
            ส่งการแจ้งเตือนใหม่
          </SheetTitle>
          <SheetDescription className="text-xs">
            เขียนข้อความและเลือกกลุ่มผู้รับ — ระบบจะกระจายให้ตามขอบเขตที่กำหนด
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-5 p-5">
          {/* Live preview */}
          <div className="rounded-xl border bg-muted/20 p-3">
            <p className={cn('mb-2 text-[10px] font-semibold uppercase tracking-wider', meta.fg)}>ตัวอย่าง</p>
            <div className="flex items-start gap-3">
              <IconChip icon={icon || null} type={type} />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-foreground">
                  {header.trim() || 'หัวข้อการแจ้งเตือน'}
                </p>
                <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">
                  {detail.trim() || 'รายละเอียดที่ผู้รับจะเห็นในกล่องแจ้งเตือน'}
                </p>
                <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                  <TypeBadge type={type} />
                  <PriorityBadge priority={priority} force />
                </div>
              </div>
            </div>
          </div>

          {/* Header */}
          <div>
            <label className={LABEL}>หัวข้อ <span className="text-rose-500">*</span></label>
            <input value={header} onChange={(e) => setHeader(e.target.value)} placeholder="เช่น ระบบจะปิดปรับปรุงคืนนี้" className={FIELD} />
          </div>

          {/* Detail */}
          <div>
            <label className={LABEL}>รายละเอียด <span className="text-rose-500">*</span></label>
            <textarea value={detail} onChange={(e) => setDetail(e.target.value)} rows={3} placeholder="อธิบายให้ชัดเจนว่าผู้รับต้องรู้หรือทำอะไร" className={cn(FIELD, 'resize-none leading-relaxed')} />
          </div>

          {/* Type */}
          <div>
            <label className={LABEL}>ประเภท</label>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {COMPOSABLE_NOTIFICATION_TYPES.map((t) => {
                const m = typeMeta(t);
                const active = type === t;
                const Icon = m.icon;
                return (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setType(t)}
                    className={cn(
                      'flex cursor-pointer items-center gap-2 rounded-xl border px-2.5 py-2 text-xs font-medium transition-all',
                      active ? cn('border-transparent ring-1', m.bg, m.fg, m.ring) : 'border-border bg-background text-muted-foreground hover:border-border hover:text-foreground',
                    )}
                  >
                    <Icon className={cn('size-3.5 shrink-0', active ? m.fg : 'text-muted-foreground')} />
                    <span className="truncate">{m.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Priority — full width so the 4 levels read clearly */}
          <div>
            <label className={LABEL}>ความสำคัญ</label>
            <Segmented
              options={NOTIFICATION_PRIORITIES.map((p) => ({ value: p, label: priorityMeta(p).label }))}
              value={priority}
              onChange={(v) => setPriority(v as NotificationPriority)}
            />
          </div>

          {/* Channel — full width so "ในแอป + อีเมล" fits on one line */}
          <div>
            <label className={LABEL}>ช่องทาง</label>
            <Segmented
              options={NOTIFICATION_CHANNELS.map((c) => ({ value: c, label: CHANNEL_LABELS[c] }))}
              value={channel}
              onChange={(v) => setChannel(v as NotificationChannel)}
            />
          </div>

          {/* Target scope */}
          <div>
            <label className={LABEL}>กลุ่มเป้าหมาย <span className="text-rose-500">*</span></label>
            <div className="grid grid-cols-3 gap-2">
              {TARGET_SCOPES.map((s) => {
                const active = scope === s;
                return (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setScope(s)}
                    className={cn(
                      'cursor-pointer rounded-xl border px-2.5 py-2 text-xs font-medium transition-all',
                      active ? 'border-brand/40 bg-brand-muted text-brand' : 'border-border bg-background text-muted-foreground hover:border-border hover:text-foreground',
                    )}
                  >
                    {SCOPE_LABELS[s]}
                  </button>
                );
              })}
            </div>

            {scope === 'SYSTEM' && (
              <div className="mt-2 flex items-center gap-2 rounded-xl border border-border bg-muted/20 px-3 py-2.5 text-xs text-muted-foreground">
                <Users className="size-3.5 shrink-0" />
                ส่งถึงผู้ใช้ทุกคนในระบบ
              </div>
            )}

            {scope === 'ROLE' && (
              <div className="mt-2 flex flex-wrap gap-1.5">
                {roles.length === 0 ? (
                  <span className="text-xs text-muted-foreground">กำลังโหลดบทบาท…</span>
                ) : (
                  roles.map((r) => {
                    const active = roleIds.includes(r.id);
                    return (
                      <button
                        key={r.id}
                        type="button"
                        onClick={() => toggleRole(r.id)}
                        className={cn(
                          'inline-flex cursor-pointer items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium transition-colors',
                          active ? 'border-brand/40 bg-brand-muted text-brand' : 'border-border bg-background text-muted-foreground hover:text-foreground',
                        )}
                      >
                        <span className="size-1.5 rounded-full" style={{ backgroundColor: r.color || 'currentColor' }} />
                        {r.name}
                      </button>
                    );
                  })
                )}
              </div>
            )}

            {scope === 'PERSONAL' && (
              <div className="mt-2 space-y-2">
                {pickedUsers.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {pickedUsers.map((u) => (
                      <span key={u.id} className="inline-flex items-center gap-1 rounded-full bg-brand-muted py-1 pl-2.5 pr-1 text-xs font-medium text-brand">
                        {u.name}
                        <button type="button" onClick={() => togglePickUser(u)} className="inline-flex size-4 cursor-pointer items-center justify-center rounded-full hover:bg-brand/15" aria-label={`เอา ${u.name} ออก`}>
                          <X className="size-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
                <div className="relative">
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <input value={userQuery} onChange={(e) => setUserQuery(e.target.value)} placeholder="ค้นหาผู้ใช้ตามชื่อ, อีเมล หรือรหัสพนักงาน…" className={cn(FIELD, 'pl-8')} />
                </div>
                <div className="max-h-52 overflow-y-auto rounded-xl border">
                  {usersLoading ? (
                    <div className="flex items-center justify-center gap-2 py-6 text-xs text-muted-foreground">
                      <Loader2 className="size-3.5 animate-spin" /> กำลังโหลดรายชื่อ…
                    </div>
                  ) : userResults.length === 0 ? (
                    <div className="py-6 text-center text-xs text-muted-foreground">ไม่พบผู้ใช้</div>
                  ) : (
                    userResults.map((u) => {
                      const picked = pickedIds.has(u.id);
                      return (
                        <button
                          key={u.id}
                          type="button"
                          onClick={() => togglePickUser(u)}
                          className={cn(
                            'flex w-full cursor-pointer items-center justify-between gap-2 border-b px-3 py-2 text-left transition-colors last:border-b-0 hover:bg-accent/40',
                            picked && 'bg-brand-muted/40',
                          )}
                        >
                          <span className="min-w-0">
                            <span className="block truncate text-sm font-medium text-foreground">{u.name}</span>
                            {u.sub && <span className="block truncate text-[11px] text-muted-foreground">{u.sub}</span>}
                          </span>
                          <span className={cn('inline-flex size-4 shrink-0 items-center justify-center rounded-full border', picked ? 'border-brand bg-brand text-brand-foreground' : 'border-border')}>
                            {picked && <X className="size-2.5 rotate-45" strokeWidth={3} />}
                          </span>
                        </button>
                      );
                    })
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Optional fields */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className={LABEL}>ไอคอน (Lucide)</label>
              <div className="flex items-center gap-2">
                <span className={cn('inline-flex size-9 shrink-0 items-center justify-center rounded-lg', meta.bg)}>
                  <AppIcon name={icon || null} className={cn('size-4', meta.fg)} />
                </span>
                <input value={icon} onChange={(e) => setIcon(e.target.value)} placeholder="Bell" className={FIELD} />
              </div>
            </div>
            <div>
              <label className={LABEL}>ลิงก์ปลายทาง</label>
              <input value={actionUrl} onChange={(e) => setActionUrl(e.target.value)} placeholder="/projects/abc" className={FIELD} />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className={LABEL}>ตั้งเวลาส่ง</label>
              <input type="datetime-local" value={scheduledAt} onChange={(e) => setScheduledAt(e.target.value)} className={cn(FIELD, 'cursor-pointer')} />
            </div>
            <div>
              <label className={LABEL}>หมดอายุ</label>
              <input type="datetime-local" value={expiresAt} onChange={(e) => setExpiresAt(e.target.value)} min={scheduledAt || undefined} className={cn(FIELD, 'cursor-pointer')} />
            </div>
          </div>

          {error && (
            <div className="rounded-xl border border-rose-300/50 bg-rose-500/5 px-3 py-2.5 text-xs font-medium text-rose-600 dark:border-rose-500/30 dark:text-rose-400">
              {error}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 flex items-center justify-between gap-3 border-t bg-popover/90 p-4 backdrop-blur-sm">
          <p className="min-w-0 flex-1 truncate text-[11px] text-muted-foreground">
            {missingHint ?? (
              scope === 'SYSTEM' ? 'จะส่งถึงผู้ใช้ทุกคนในระบบ' : 'พร้อมส่ง'
            )}
          </p>
          <div className="flex shrink-0 items-center gap-2">
            <Button variant="cancel" onClick={() => !saving && onClose()} disabled={saving}>ยกเลิก</Button>
            <Button variant="create" onClick={submit} disabled={!canSubmit || saving}>
              {saving ? <Loader2 className="animate-spin" /> : <Send />}
              {scheduledAt ? 'ตั้งเวลาส่ง' : 'ส่งทันที'}
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}

// ── Segmented control ────────────────────────────────────────────────────────────

function Segmented({
  options,
  value,
  onChange,
}: {
  options: { value: string; label: string }[];
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="flex items-center gap-0.5 rounded-xl border border-border/60 bg-card/40 p-0.5">
      {options.map((o) => {
        const active = value === o.value;
        return (
          <button
            key={o.value}
            type="button"
            onClick={() => onChange(o.value)}
            className={cn(
              'flex-1 cursor-pointer truncate whitespace-nowrap rounded-lg px-2 py-1.5 text-center text-xs font-medium transition-colors',
              active ? 'bg-brand-muted text-brand' : 'text-muted-foreground hover:text-foreground',
            )}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}
