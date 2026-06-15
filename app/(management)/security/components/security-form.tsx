'use client';

import { useEffect, useMemo, useState } from 'react';
import { useForm, useWatch, type Control } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Bell,
  Check,
  CheckCircle2,
  Eye,
  EyeOff,
  History,
  KeyRound,
  Laptop,
  type LucideIcon,
  LogOut,
  MapPin,
  Monitor,
  Save,
  Shield,
  ShieldCheck,
  Smartphone,
  Sparkles,
  Tablet,
  X,
  XCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { toast } from '@/components/ui/toast';
import {
  changePasswordRequest,
  fetchLoginHistoryRequest,
  fetchSessionsRequest,
  revokeOtherSessionsRequest,
  updateSecurityRequest,
  type ActiveSession,
  type LoginHistoryEntry,
} from '@/lib/api/security';
import { useAuthStore } from '@/lib/stores/auth-store';
import { cn } from '@/lib/utils';

/* ─── Preset ─────────────────────────────────────────────────────────── */

export interface SecurityPreset {
  twoFactorEnabled: boolean;
  loginAlertsEnabled: boolean;
  loginHistory: LoginHistoryEntry[];
  activeSessions: ActiveSession[];
}

const DEFAULT_PRESET: SecurityPreset = {
  twoFactorEnabled: false,
  loginAlertsEnabled: true,
  loginHistory: [],
  activeSessions: [],
};

/* ─── Schema ─────────────────────────────────────────────────────────── */

const securitySchema = z
  .object({
    currentPassword: z.string(),
    newPassword: z.string(),
    confirmPassword: z.string(),
    twoFactorEnabled: z.boolean(),
    loginAlertsEnabled: z.boolean(),
  })
  .superRefine((v, ctx) => {
    const wantsChange =
      v.currentPassword.length > 0 ||
      v.newPassword.length > 0 ||
      v.confirmPassword.length > 0;
    if (!wantsChange) return;

    if (v.currentPassword.length === 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['currentPassword'],
        message: 'กรุณากรอกรหัสผ่านปัจจุบัน',
      });
    }
    if (v.newPassword.length < 8) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['newPassword'],
        message: 'รหัสผ่านใหม่ต้องมีอย่างน้อย 8 ตัวอักษร',
      });
    }
    if (!/[A-Z]/.test(v.newPassword) || !/[a-z]/.test(v.newPassword)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['newPassword'],
        message: 'ต้องมีตัวอักษรพิมพ์เล็กและพิมพ์ใหญ่',
      });
    }
    if (!/[0-9]/.test(v.newPassword)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['newPassword'],
        message: 'ต้องมีตัวเลขอย่างน้อย 1 ตัว',
      });
    }
    if (v.newPassword === v.currentPassword && v.newPassword.length > 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['newPassword'],
        message: 'รหัสผ่านใหม่ต้องไม่ซ้ำกับรหัสผ่านเดิม',
      });
    }
    if (v.newPassword !== v.confirmPassword) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['confirmPassword'],
        message: 'ยืนยันรหัสผ่านไม่ตรงกัน',
      });
    }
  });

type SecurityFormValues = z.infer<typeof securitySchema>;

function toDefaults(preset: SecurityPreset): SecurityFormValues {
  return {
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
    twoFactorEnabled: preset.twoFactorEnabled,
    loginAlertsEnabled: preset.loginAlertsEnabled,
  };
}

/* ─── Component ──────────────────────────────────────────────────────── */

interface SecurityFormProps {
  preset?: Partial<SecurityPreset>;
}

export function SecurityForm({ preset }: SecurityFormProps) {
  const accessToken = useAuthStore((s) => s.accessToken);

  const fullPreset = useMemo<SecurityPreset>(
    () => ({ ...DEFAULT_PRESET, ...preset }),
    [preset],
  );

  const defaults = useMemo(() => toDefaults(fullPreset), [fullPreset]);

  const form = useForm<SecurityFormValues>({
    resolver: zodResolver(securitySchema),
    defaultValues: defaults,
    mode: 'onTouched',
  });

  const [submitting, setSubmitting] = useState(false);
  const [revoking, setRevoking] = useState(false);
  const [sessions, setSessions] = useState<ActiveSession[]>(fullPreset.activeSessions);
  const [sessionsLoading, setSessionsLoading] = useState(true);
  const [loginHistory, setLoginHistory] = useState<LoginHistoryEntry[]>([]);
  const [historyLoading, setHistoryLoading] = useState(true);

  useEffect(() => {
    form.reset(toDefaults(fullPreset));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fullPreset]);

  useEffect(() => {
    setSessionsLoading(true);
    fetchSessionsRequest()
      .then(setSessions)
      .catch(() => {})
      .finally(() => setSessionsLoading(false));
    setHistoryLoading(true);
    fetchLoginHistoryRequest()
      .then(setLoginHistory)
      .catch(() => {})
      .finally(() => setHistoryLoading(false));
  }, []);

  const watched = useWatch({ control: form.control });
  const isDirty = form.formState.isDirty;

  const handleReset = () => form.reset(defaults);

  const onSubmit = async (values: SecurityFormValues) => {
    if (!accessToken) {
      toast.error('Session ไม่ถูกต้อง', { description: 'กรุณาเข้าสู่ระบบใหม่' });
      return;
    }
    if (!isDirty || submitting) return;
    setSubmitting(true);

    const dirty = form.formState.dirtyFields;
    const wantsPassword =
      values.currentPassword.length > 0 &&
      values.newPassword.length > 0 &&
      values.confirmPassword.length > 0;

    const work = (async () => {
      if (wantsPassword) {
        await changePasswordRequest(accessToken, {
          currentPassword: values.currentPassword,
          newPassword: values.newPassword,
        });
      }

      const toggleBody: {
        twoFactorEnabled?: boolean;
        loginAlertsEnabled?: boolean;
      } = {};
      if (dirty.twoFactorEnabled) toggleBody.twoFactorEnabled = values.twoFactorEnabled;
      if (dirty.loginAlertsEnabled)
        toggleBody.loginAlertsEnabled = values.loginAlertsEnabled;
      if (Object.keys(toggleBody).length > 0) {
        await updateSecurityRequest(accessToken, toggleBody);
      }

      form.reset({
        ...values,
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
    })();

    toast.promise(work, {
      loading: 'กำลังบันทึก...',
      success: 'บันทึกการตั้งค่าเรียบร้อย',
      error: (e) => (e instanceof Error ? e.message : 'บันทึกล้มเหลว'),
    });

    try {
      await work;
    } catch {
      // toast handled
    } finally {
      setSubmitting(false);
    }
  };

  const handleRevokeOthers = async () => {
    if (!accessToken || revoking) return;
    setRevoking(true);
    const work = revokeOtherSessionsRequest(accessToken).then(() => {
      setSessions((prev) => prev.filter((s) => s.current));
    });
    toast.promise(work, {
      loading: 'กำลังออกจากระบบเซสชันอื่น...',
      success: 'ออกจากระบบเซสชันอื่นเรียบร้อย',
      error: (e) => (e instanceof Error ? e.message : 'ดำเนินการล้มเหลว'),
    });
    try {
      await work;
    } catch {
      // toast handled
    } finally {
      setRevoking(false);
    }
  };

  const newPwd = watched.newPassword ?? '';
  const strength = scorePassword(newPwd);

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="space-y-3 sm:space-y-4 2xl:space-y-6"
      >
        {/* Hero */}
        <section className="relative overflow-hidden rounded-2xl border border-border bg-gradient-to-br from-emerald-500/10 via-sky-500/10 to-violet-500/10 p-5 shadow-lg shadow-black/5 ring-1 ring-inset ring-white/10 backdrop-blur-md dark:ring-white/5 sm:p-6">
          <span
            aria-hidden
            className="pointer-events-none absolute -right-10 -top-12 size-48 rounded-full bg-emerald-500/20 blur-3xl"
          />
          <span
            aria-hidden
            className="pointer-events-none absolute -bottom-16 -left-10 size-44 rounded-full bg-violet-500/20 blur-3xl"
          />
          <span aria-hidden className="pointer-events-none absolute right-6 top-6">
            <Sparkles className="size-7 animate-pulse text-emerald-500 drop-shadow-[0_0_8px_rgba(16,185,129,0.55)]" />
            <span className="absolute inset-0 animate-ping rounded-full bg-emerald-300/25 blur-md" />
          </span>

          <div className="relative flex flex-col items-center gap-4 sm:flex-row sm:gap-5">
            <div className="inline-flex size-14 shrink-0 items-center justify-center rounded-2xl bg-background/70 shadow-xl shadow-emerald-500/10 ring-2 ring-background/60 backdrop-blur">
              <ShieldCheck className="size-7 text-emerald-500" />
            </div>
            <div className="min-w-0 flex-1 text-center sm:text-left">
              <div className="truncate text-xl font-extrabold tracking-tight text-foreground sm:text-2xl">
                ความปลอดภัยของบัญชี
              </div>
              <div className="mt-0.5 truncate text-sm text-muted-foreground">
                ปกป้องบัญชีของคุณด้วยรหัสผ่านที่แข็งแกร่งและการยืนยันตัวสองขั้นตอน
              </div>
              <div className="mt-2 flex flex-wrap items-center justify-center gap-1.5 sm:justify-start">
                <Pill
                  active={!!watched.twoFactorEnabled}
                  activeLabel="2FA เปิดอยู่"
                  inactiveLabel="2FA ปิดอยู่"
                />
                <Pill
                  active={!!watched.loginAlertsEnabled}
                  activeLabel="แจ้งเตือนการเข้าสู่ระบบ"
                  inactiveLabel="ไม่แจ้งเตือนการเข้าสู่ระบบ"
                />
              </div>
            </div>
          </div>
        </section>

        {/* Row: Password + Toggles */}
        <div className="grid grid-cols-1 gap-3 sm:gap-4 lg:grid-cols-2">
          <Section
            tone="emerald"
            icon={KeyRound}
            title="เปลี่ยนรหัสผ่าน"
            subtitle="แนะนำให้ใช้รหัสผ่านที่มีตัวพิมพ์เล็ก-ใหญ่ ตัวเลข และอักขระพิเศษอย่างน้อย 8 ตัว"
          >
            <div className="space-y-4">
              <FormField
                control={form.control}
                name="currentPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs text-foreground/70">
                      รหัสผ่านปัจจุบัน
                    </FormLabel>
                    <PasswordField
                      field={field}
                      autoComplete="current-password"
                      placeholder="••••••••"
                    />
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="newPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs text-foreground/70">รหัสผ่านใหม่</FormLabel>
                    <PasswordField
                      field={field}
                      autoComplete="new-password"
                      placeholder="อย่างน้อย 8 ตัวอักษร"
                    />
                    {newPwd ? (
                      <StrengthMeter score={strength.score} label={strength.label} />
                    ) : null}
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="confirmPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs text-foreground/70">
                      ยืนยันรหัสผ่านใหม่
                    </FormLabel>
                    <PasswordField
                      field={field}
                      autoComplete="new-password"
                      placeholder="กรอกรหัสผ่านใหม่อีกครั้ง"
                    />
                    <FormMessage />
                  </FormItem>
                )}
              />

              <ChecklistGrid value={newPwd} />
            </div>
          </Section>

          <Section
            tone="violet"
            icon={Shield}
            title="การยืนยันตัวตน"
            subtitle="เพิ่มชั้นการป้องกันด้วย 2FA และรับการแจ้งเตือนเมื่อมีการเข้าสู่ระบบ"
          >
            <div className="space-y-3">
              <ToggleRow
                control={form.control}
                name="twoFactorEnabled"
                icon={ShieldCheck}
                title="ยืนยันตัวตนสองขั้นตอน (2FA)"
                description="ต้องกรอกรหัสจากแอป Authenticator ทุกครั้งที่ลงชื่อเข้าใช้"
              />
              <ToggleRow
                control={form.control}
                name="loginAlertsEnabled"
                icon={Bell}
                title="แจ้งเตือนการเข้าสู่ระบบ"
                description="ส่งอีเมลทุกครั้งที่มีการเข้าสู่ระบบจากอุปกรณ์ใหม่"
              />
            </div>
          </Section>
        </div>

        {/* Row: History + Sessions */}
        <div className="grid grid-cols-1 gap-3 sm:gap-4 lg:grid-cols-2">
          <Section
            tone="sky"
            icon={History}
            title="ประวัติการเข้าสู่ระบบ"
            subtitle="กิจกรรมการเข้าสู่ระบบล่าสุดในบัญชีของคุณ"
          >
            {historyLoading ? (
              <div className="space-y-px">
                {[0, 1, 2].map((i) => (
                  <div
                    key={i}
                    className="h-10 animate-pulse rounded-lg border border-border bg-background/50"
                  />
                ))}
              </div>
            ) : loginHistory.length === 0 ? (
              <EmptyState text="ยังไม่มีประวัติการเข้าสู่ระบบ" />
            ) : (
              <ul className="divide-y divide-border/60">
                {loginHistory.map((entry) => (
                  <li
                    key={entry.id}
                    className="flex flex-col gap-2 py-3 text-xs"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5">
                        {entry.status === 'SUCCESS' ? (
                          <CheckCircle2 className="size-3.5 shrink-0 text-emerald-500" />
                        ) : (
                          <XCircle className="size-3.5 shrink-0 text-rose-500" />
                        )}
                        <span
                          className={cn(
                            'font-semibold',
                            entry.status === 'SUCCESS'
                              ? 'text-emerald-600 dark:text-emerald-400'
                              : 'text-rose-600 dark:text-rose-400',
                          )}
                        >
                          {entry.status === 'SUCCESS' ? 'สำเร็จ' : 'ล้มเหลว'}
                        </span>
                      </div>
                      <span className="font-mono text-muted-foreground">
                        {formatTimestamp(entry.createdAt)}
                      </span>
                    </div>
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-muted-foreground">
                      <span className="font-mono">{entry.ipAddress}</span>
                      <span>{entry.browser} · {entry.os}</span>
                      {entry.location ? (
                        <span className="flex items-center gap-1">
                          <MapPin className="size-3 text-sky-500" />
                          {entry.location}
                        </span>
                      ) : null}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </Section>

          <Section
            tone="amber"
            icon={Monitor}
            title="เซสชันที่ใช้งานอยู่"
            subtitle="เซสชันที่กำลังใช้งานในบัญชีของคุณ"
          >
            {sessionsLoading ? (
              <div className="space-y-2">
                {[0, 1].map((i) => (
                  <div
                    key={i}
                    className="h-14 animate-pulse rounded-xl border border-border bg-background/50"
                  />
                ))}
              </div>
            ) : sessions.length === 0 ? (
              <EmptyState text="ไม่มีเซสชันอื่น" />
            ) : (
              <>
                <ul className="space-y-2">
                  {sessions.map((s) => (
                    <li
                      key={s.id}
                      className="flex items-center justify-between gap-2 rounded-xl border border-border bg-background/50 p-2.5 text-sm backdrop-blur-sm"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <DeviceIcon device={s.device} />
                        <div className="min-w-0">
                          <div className="truncate font-medium text-foreground">
                            {labelDevice(s.device)}
                            {s.current ? (
                              <span className="ml-1.5 rounded-full bg-emerald-500/15 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">
                                ปัจจุบัน
                              </span>
                            ) : null}
                          </div>
                          <div className="truncate text-xs text-muted-foreground">
                            {s.browser} · {s.os}
                          </div>
                        </div>
                      </div>
                      <div className="shrink-0 text-right text-xs text-muted-foreground">
                        {formatRelative(s.lastActiveAt)}
                      </div>
                    </li>
                  ))}
                </ul>
                {sessions.some((s) => !s.current) ? (
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    className="mt-3 cursor-pointer"
                    onClick={handleRevokeOthers}
                    disabled={revoking}
                  >
                    <LogOut />
                    ออกจากระบบทุกเซสชันอื่น
                  </Button>
                ) : null}
              </>
            )}
          </Section>
        </div>

        {/* Actions */}
        <div className="sticky bottom-3 z-10 flex flex-col-reverse items-stretch gap-2 rounded-2xl border border-border bg-background/80 p-2 shadow-lg shadow-black/10 ring-1 ring-inset ring-white/10 backdrop-blur-md dark:ring-white/5 sm:flex-row sm:items-center sm:justify-between sm:p-3">
          <div className="hidden text-sm text-foreground/80 sm:block">
            {isDirty ? (
              <span className="inline-flex items-center gap-1.5">
                <span className="size-3 animate-pulse rounded-full bg-amber-500" />
                มีการเปลี่ยนแปลงที่ยังไม่ได้บันทึก
              </span>
            ) : (
              <span className="text-foreground/80">ไม่มีการเปลี่ยนแปลง</span>
            )}
          </div>
          <div className="flex flex-col-reverse gap-2 sm:flex-row">
            <Button
              type="button"
              variant="cancel"
              onClick={handleReset}
              disabled={!isDirty || submitting}
              className="cursor-pointer"
            >
              <X />
              ยกเลิกการแก้ไข
            </Button>
            <Button
              type="submit"
              variant="save"
              disabled={!isDirty || submitting}
              className="cursor-pointer"
            >
              <Save />
              บันทึกการตั้งค่าความปลอดภัย
            </Button>
          </div>
        </div>
      </form>
    </Form>
  );
}

/* ─── PasswordField ─────────────────────────────────────────────────── */

function PasswordField({
  field,
  autoComplete,
  placeholder,
}: {
  field: { value: string; onChange: (v: string) => void; onBlur: () => void; name: string };
  autoComplete: string;
  placeholder: string;
}) {
  const [show, setShow] = useState(false);
  return (
    <div className="group relative">
      <KeyRound className="pointer-events-none absolute left-3 top-1/2 z-10 size-4 -translate-y-1/2 text-muted-foreground/60 transition-colors group-focus-within:text-emerald-500" />
      <FormControl>
        <Input
          type={show ? 'text' : 'password'}
          placeholder={placeholder}
          autoComplete={autoComplete}
          value={field.value}
          onChange={(e) => field.onChange(e.target.value)}
          onBlur={field.onBlur}
          name={field.name}
          className="h-10 pl-9 pr-10"
        />
      </FormControl>
      <button
        type="button"
        onClick={() => setShow((v) => !v)}
        className="absolute right-2 top-1/2 inline-flex size-7 -translate-y-1/2 items-center justify-center rounded-md text-muted-foreground/70 transition-colors hover:bg-muted hover:text-foreground cursor-pointer"
        aria-label={show ? 'ซ่อนรหัสผ่าน' : 'แสดงรหัสผ่าน'}
        tabIndex={-1}
      >
        {show ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
      </button>
    </div>
  );
}

/* ─── ToggleRow ─────────────────────────────────────────────────────── */

function ToggleRow({
  control,
  name,
  icon: Icon,
  title,
  description,
}: {
  control: Control<SecurityFormValues>;
  name: 'twoFactorEnabled' | 'loginAlertsEnabled';
  icon: LucideIcon;
  title: string;
  description: string;
}) {
  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem className="flex items-center justify-between gap-3 rounded-xl border border-border bg-background/50 p-3 backdrop-blur-sm">
          <div className="flex items-start gap-3 min-w-0">
            <span className="inline-flex size-8 shrink-0 items-center justify-center rounded-lg bg-violet-500/10 text-violet-500">
              <Icon className="size-4" />
            </span>
            <div className="min-w-0">
              <FormLabel className="text-sm font-medium text-foreground">{title}</FormLabel>
              <p className="mt-0.5 text-xs text-muted-foreground">{description}</p>
            </div>
          </div>
          <Switch
            checked={!!field.value}
            onChange={(v) => field.onChange(v)}
            label={title}
          />
        </FormItem>
      )}
    />
  );
}

/* ─── Switch ─────────────────────────────────────────────────────────── */

function Switch({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className={cn(
        'relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border border-transparent transition-colors',
        'focus-visible:ring-2 focus-visible:ring-ring/50 outline-none',
        checked
          ? 'bg-gradient-to-br from-emerald-500 to-teal-500 shadow-md shadow-emerald-500/30'
          : 'bg-muted',
      )}
    >
      <span
        className={cn(
          'inline-block size-5 rounded-full bg-background shadow ring-1 ring-border/40 transition-transform',
          checked ? 'translate-x-5' : 'translate-x-0.5',
        )}
      />
    </button>
  );
}

/* ─── StrengthMeter ─────────────────────────────────────────────────── */

function scorePassword(pwd: string): { score: 0 | 1 | 2 | 3 | 4; label: string } {
  let s = 0;
  if (pwd.length >= 8) s++;
  if (pwd.length >= 12) s++;
  if (/[A-Z]/.test(pwd) && /[a-z]/.test(pwd)) s++;
  if (/[0-9]/.test(pwd)) s++;
  if (/[^A-Za-z0-9]/.test(pwd)) s++;
  const score = Math.min(s, 4) as 0 | 1 | 2 | 3 | 4;
  const label = ['อ่อนมาก', 'อ่อน', 'พอใช้', 'ดี', 'แข็งแกร่ง'][score];
  return { score, label };
}

function StrengthMeter({ score, label }: { score: 0 | 1 | 2 | 3 | 4; label: string }) {
  const colors = [
    'bg-rose-500',
    'bg-orange-500',
    'bg-amber-500',
    'bg-lime-500',
    'bg-emerald-500',
  ];
  return (
    <div className="mt-2 space-y-1">
      <div className="flex gap-1">
        {[0, 1, 2, 3, 4].map((i) => (
          <span
            key={i}
            className={cn(
              'h-1.5 flex-1 rounded-full transition-colors',
              i <= score ? colors[score] : 'bg-muted',
            )}
          />
        ))}
      </div>
      <div className="text-xs text-muted-foreground">
        ความแข็งแรง: <span className="font-medium text-foreground">{label}</span>
      </div>
    </div>
  );
}

/* ─── Checklist ──────────────────────────────────────────────────────── */

function ChecklistGrid({ value }: { value: string }) {
  const rules = [
    { label: 'อย่างน้อย 8 ตัวอักษร', ok: value.length >= 8 },
    { label: 'มีตัวพิมพ์เล็กและพิมพ์ใหญ่', ok: /[a-z]/.test(value) && /[A-Z]/.test(value) },
    { label: 'มีตัวเลข', ok: /[0-9]/.test(value) },
    { label: 'มีอักขระพิเศษ', ok: /[^A-Za-z0-9]/.test(value) },
  ];
  return (
    <ul className="grid grid-cols-1 gap-1.5 text-xs sm:grid-cols-2">
      {rules.map((r) => (
        <li
          key={r.label}
          className={cn(
            'inline-flex items-center gap-1.5',
            r.ok ? 'text-emerald-600 dark:text-emerald-400' : 'text-muted-foreground',
          )}
        >
          <Check
            className={cn('size-3.5', r.ok ? 'opacity-100' : 'opacity-30')}
          />
          {r.label}
        </li>
      ))}
    </ul>
  );
}

/* ─── Pill ───────────────────────────────────────────────────────────── */

function Pill({
  active,
  activeLabel,
  inactiveLabel,
}: {
  active: boolean;
  activeLabel: string;
  inactiveLabel: string;
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11px] backdrop-blur',
        active
          ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400'
          : 'border-border bg-background/60 text-muted-foreground',
      )}
    >
      <span
        className={cn(
          'size-1.5 rounded-full',
          active ? 'bg-emerald-500' : 'bg-muted-foreground/50',
        )}
      />
      {active ? activeLabel : inactiveLabel}
    </span>
  );
}

/* ─── Device helpers ─────────────────────────────────────────────────── */

function DeviceIcon({ device }: { device: ActiveSession['device'] }) {
  const Icon =
    device === 'smartphone'
      ? Smartphone
      : device === 'tablet'
        ? Tablet
        : device === 'desktop'
          ? Monitor
          : Laptop;
  return <Icon className="size-4 text-amber-600 dark:text-amber-400" />;
}

function labelDevice(device: ActiveSession['device']): string {
  switch (device) {
    case 'smartphone':
      return 'Smartphone';
    case 'tablet':
      return 'Tablet';
    case 'desktop':
      return 'Desktop';
    case 'laptop':
      return 'Laptop';
    default:
      return 'อุปกรณ์ไม่ทราบชนิด';
  }
}

function formatTimestamp(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  const pad = (n: number) => n.toString().padStart(2, '0');
  return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())} ${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())} UTC`;
}

function formatRelative(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  const diff = Date.now() - d.getTime();
  const sec = Math.round(diff / 1000);
  if (sec < 60) return 'เมื่อสักครู่';
  const min = Math.round(sec / 60);
  if (min < 60) return `${min} นาทีที่แล้ว`;
  const hr = Math.round(min / 60);
  if (hr < 24) return `${hr} ชั่วโมงที่แล้ว`;
  const day = Math.round(hr / 24);
  return `${day} วันที่แล้ว`;
}

/* ─── EmptyState ─────────────────────────────────────────────────────── */

function EmptyState({ text }: { text: string }) {
  return (
    <div className="rounded-xl border border-dashed border-border bg-background/40 p-4 text-center text-xs text-muted-foreground backdrop-blur-sm">
      {text}
    </div>
  );
}

/* ─── Section (shared visual with account-form) ──────────────────────── */

type Tone = 'violet' | 'pink' | 'sky' | 'amber' | 'emerald';

const toneStyles: Record<
  Tone,
  { ring: string; iconBg: string; iconColor: string; blob: string }
> = {
  violet: {
    ring: 'before:from-violet-500/30 before:via-fuchsia-400/20 before:to-transparent',
    iconBg: 'bg-violet-500/10',
    iconColor: 'text-violet-500',
    blob: 'bg-violet-500/10',
  },
  pink: {
    ring: 'before:from-pink-500/30 before:via-rose-400/20 before:to-transparent',
    iconBg: 'bg-pink-500/10',
    iconColor: 'text-pink-500',
    blob: 'bg-pink-500/10',
  },
  sky: {
    ring: 'before:from-sky-500/30 before:via-cyan-400/20 before:to-transparent',
    iconBg: 'bg-sky-500/10',
    iconColor: 'text-sky-500',
    blob: 'bg-sky-500/10',
  },
  amber: {
    ring: 'before:from-amber-500/30 before:via-yellow-400/20 before:to-transparent',
    iconBg: 'bg-amber-500/10',
    iconColor: 'text-amber-600',
    blob: 'bg-amber-500/10',
  },
  emerald: {
    ring: 'before:from-emerald-500/30 before:via-teal-400/20 before:to-transparent',
    iconBg: 'bg-emerald-500/10',
    iconColor: 'text-emerald-500',
    blob: 'bg-emerald-500/10',
  },
};

interface SectionProps {
  tone: Tone;
  icon: LucideIcon;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}

function Section({ tone, icon: Icon, title, subtitle, children }: SectionProps) {
  const t = toneStyles[tone];
  return (
    <section
      className={cn(
        'relative overflow-hidden rounded-2xl border border-border bg-card/60 p-4 shadow-lg shadow-black/5 backdrop-blur-md sm:p-6',
        'ring-1 ring-inset ring-white/10 dark:ring-white/5',
        'before:pointer-events-none before:absolute before:inset-x-0 before:top-0 before:h-px before:bg-gradient-to-r',
        t.ring,
      )}
    >
      <span
        aria-hidden
        className={cn(
          'pointer-events-none absolute -right-12 -top-12 size-32 rounded-full blur-3xl',
          t.blob,
        )}
      />
      <div className="relative mb-4 flex items-start gap-3 sm:mb-5">
        <span
          className={cn(
            'inline-flex size-9 shrink-0 items-center justify-center rounded-xl shadow-sm',
            t.iconBg,
          )}
        >
          <Icon className={cn('size-4', t.iconColor)} />
        </span>
        <div className="min-w-0 flex-1">
          <h2 className="text-sm font-semibold text-foreground sm:text-base">{title}</h2>
          {subtitle ? (
            <p className="mt-0.5 text-sm text-muted-foreground">{subtitle}</p>
          ) : null}
        </div>
      </div>
      <div className="relative">{children}</div>
    </section>
  );
}
