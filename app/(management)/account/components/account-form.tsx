'use client';

import { useEffect, useMemo, useState } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  AtSign,
  IdCard,
  Phone,
  Save,
  Smile,
  Sparkles,
  User as UserIcon,
  UserCircle2,
  UserSquare2,
  X,
  type LucideIcon,
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
import { UserAvatar } from '@/components/ui/user-avatar';
import { toast } from '@/components/ui/toast';
import {
  uploadAvatarRequest,
  updateMeRequest,
  type UpdateMeBody,
} from '@/lib/api/account';
import { useAuthStore } from '@/lib/stores/auth-store';
import type { AuthUser } from '@/lib/auth/types';
import { cn } from '@/lib/utils';
import { AvatarPicker } from './avatar-picker';

const PRESET_PREFIX = '/avatars/';

/* ─── Schema ─────────────────────────────────────────────────────────── */

const accountSchema = z.object({
  firstName: z.string().min(1, { message: 'กรุณากรอกชื่อ' }),
  lastName: z.string().min(1, { message: 'กรุณากรอกนามสกุล' }),
  nickname: z.string(),
  email: z
    .string()
    .min(1, { message: 'กรุณากรอกอีเมล' })
    .refine((v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v), {
      message: 'รูปแบบอีเมลไม่ถูกต้อง',
    }),
  phone: z
    .string()
    .refine((v) => v === '' || /^[\d\s+()-]{6,}$/.test(v), {
      message: 'รูปแบบเบอร์โทรไม่ถูกต้อง',
    }),
});

type AccountFormValues = z.infer<typeof accountSchema>;

function toDefaults(user: AuthUser): AccountFormValues {
  return {
    firstName: user.firstName ?? '',
    lastName: user.lastName ?? '',
    nickname: user.nickname ?? '',
    email: user.email ?? '',
    phone: user.phone ?? '',
  };
}

function parsePresetFromAvatarUrl(url: string | null | undefined): string | null {
  if (!url) return null;
  if (url.startsWith(PRESET_PREFIX)) return url.slice(PRESET_PREFIX.length);
  return null;
}

const fallbackColor = 'bg-gradient-to-br from-rose-400 to-fuchsia-500';

export function AccountForm({ user }: { user: AuthUser }) {
  const accessToken = useAuthStore((s) => s.accessToken);
  const setUser = useAuthStore((s) => s.setUser);

  const defaults = useMemo(() => toDefaults(user), [user]);

  const form = useForm<AccountFormValues>({
    resolver: zodResolver(accountSchema),
    defaultValues: defaults,
    mode: 'onTouched',
  });

  const [submitting, setSubmitting] = useState(false);

  // Avatar state lives outside RHF — files don't serialize, and we mix
  // preset choice with file uploads.
  const initialPreset = useMemo(
    () => parsePresetFromAvatarUrl(user.avatarUrl),
    [user.avatarUrl],
  );
  const [selectedPreset, setSelectedPreset] = useState<string | null>(initialPreset);
  const [customFile, setCustomFile] = useState<File | null>(null);
  const [customPreview, setCustomPreview] = useState<string | null>(null);

  // resync when user from store changes (e.g. after save).
  // Deps include only the primitive fields we care about — `form` itself is
  // a fresh reference each render in RHF, so putting it in deps loops.
  useEffect(() => {
    form.reset(toDefaults(user));
    setSelectedPreset(parsePresetFromAvatarUrl(user.avatarUrl));
    setCustomFile(null);
    setCustomPreview((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return null;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    user.id,
    user.firstName,
    user.lastName,
    user.nickname,
    user.email,
    user.phone,
    user.avatarUrl,
  ]);

  // revoke object URL on unmount
  useEffect(() => {
    return () => {
      if (customPreview) URL.revokeObjectURL(customPreview);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleUpload = (file: File) => {
    if (customPreview) URL.revokeObjectURL(customPreview);
    setCustomFile(file);
    setCustomPreview(URL.createObjectURL(file));
    setSelectedPreset(null);
  };

  const handleClearCustom = () => {
    if (customPreview) URL.revokeObjectURL(customPreview);
    setCustomFile(null);
    setCustomPreview(null);
  };

  const handleSelectPreset = (filename: string) => {
    if (customPreview) URL.revokeObjectURL(customPreview);
    setCustomFile(null);
    setCustomPreview(null);
    setSelectedPreset(filename);
  };

  // live preview values — useWatch scopes the subscription to this component
  // only, instead of re-rendering on every internal RHF state change.
  const watched = useWatch({ control: form.control });
  const presetChanged = selectedPreset !== initialPreset;
  const hasCustom = !!customFile;
  const isDirty = form.formState.isDirty || presetChanged || hasCustom;

  const previewAvatarUrl = customPreview
    ? customPreview
    : selectedPreset
      ? `${PRESET_PREFIX}${selectedPreset}`
      : user.avatarUrl;

  const initialLetter = (user.firstName?.[0] ?? user.email?.[0] ?? '?').toUpperCase();

  const handleReset = () => {
    form.reset(defaults);
    setSelectedPreset(initialPreset);
    handleClearCustom();
  };

  const onSubmit = async (values: AccountFormValues) => {
    if (!accessToken) {
      toast.error('Session ไม่ถูกต้อง', { description: 'กรุณาเข้าสู่ระบบใหม่' });
      return;
    }
    if (!isDirty || submitting) return;

    setSubmitting(true);

    const dirtyFields = form.formState.dirtyFields;

    const work = (async () => {
      let newAvatarUrl: string | null | undefined = undefined;
      if (customFile) {
        const res = await uploadAvatarRequest(accessToken, customFile);
        newAvatarUrl = res.avatarUrl;
      } else if (presetChanged) {
        newAvatarUrl = selectedPreset ? `${PRESET_PREFIX}${selectedPreset}` : null;
      }

      const body: UpdateMeBody = {
        ...(dirtyFields.firstName ? { firstName: values.firstName } : {}),
        ...(dirtyFields.lastName ? { lastName: values.lastName } : {}),
        ...(dirtyFields.nickname
          ? { nickname: values.nickname.trim() || null }
          : {}),
        ...(dirtyFields.email ? { email: values.email } : {}),
        ...(dirtyFields.phone ? { phone: values.phone.trim() || null } : {}),
        ...(newAvatarUrl !== undefined && !customFile ? { avatarUrl: newAvatarUrl } : {}),
      };

      const hasTextChanges = Object.keys(body).length > 0;
      let updated: AuthUser = user;
      if (hasTextChanges) {
        updated = await updateMeRequest(accessToken, body);
      }

      const finalAvatarUrl =
        customFile && newAvatarUrl !== undefined ? newAvatarUrl : updated.avatarUrl;

      const merged: AuthUser = {
        ...user,
        ...updated,
        avatarUrl: finalAvatarUrl ?? null,
      };
      setUser(merged);
      return merged;
    })();

    toast.promise(work, {
      loading: 'กำลังบันทึก...',
      success: 'บันทึกการตั้งค่าเรียบร้อย',
      error: (e) => (e instanceof Error ? e.message : 'บันทึกล้มเหลว'),
    });

    try {
      await work;
    } catch {
      // toast already showed the error
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-3 sm:space-y-4 2xl:space-y-6">
        {/* Hero preview */}
        <section className="relative overflow-hidden rounded-2xl border border-border bg-gradient-to-br from-violet-500/10 via-fuchsia-500/10 to-amber-500/10 p-5 shadow-lg shadow-black/5 ring-1 ring-inset ring-white/10 backdrop-blur-md dark:ring-white/5 sm:p-6">
          <span
            aria-hidden
            className="pointer-events-none absolute -right-10 -top-12 size-48 rounded-full bg-fuchsia-500/20 blur-3xl"
          />
          <span
            aria-hidden
            className="pointer-events-none absolute -bottom-16 -left-10 size-44 rounded-full bg-sky-500/20 blur-3xl"
          />
        <span
            aria-hidden
            className="pointer-events-none absolute right-6 top-6"
          >
            <Sparkles
              className="
                size-7
                animate-pulse
                text-rose-500
                drop-shadow-[0_0_8px_rgba(251,113,133,0.55)]
                brightness-110
              "
            />

            <span
              className="
                absolute inset-0
                animate-ping
                rounded-full
                bg-rose-300/25
                blur-md
              "
            />
          </span>

          <div className="relative flex flex-col items-center gap-4 sm:flex-row sm:gap-5">
            <div className="rounded-full p-1 ring-2 ring-background/60 shadow-xl shadow-fuchsia-500/10">
              <UserAvatar
                avatarUrl={previewAvatarUrl ?? null}
                initial={initialLetter}
                color={fallbackColor}
                size="xl"
                showStatus
                statusRingClass="bg-background"
              />
            </div>
            <div className="min-w-0 flex-1 text-center sm:text-left">
              <div className="truncate text-xl font-extrabold tracking-tight text-foreground sm:text-2xl">
                {`${watched.firstName ?? ''} ${watched.lastName ?? ''}`.trim() || 'ผู้ใช้'}
                {watched.nickname ? (
                  <span className="ml-2 text-sm font-medium text-muted-foreground">
                    ({watched.nickname})
                  </span>
                ) : null}
              </div>
              <div className="mt-0.5 truncate text-sm text-muted-foreground">
                {watched.email || '—'}
              </div>
              <div className="mt-2 inline-flex items-center gap-1.5 rounded-full border border-border bg-background/60 px-2.5 py-0.5 text-[11px] backdrop-blur">
                <IdCard className="size-3 text-violet-500" />
                <span className="text-muted-foreground">รหัสพนักงาน:</span>
                <span className="font-mono font-medium text-foreground">
                  {user.employeeId}
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* Avatar */}
        <Section
          tone="pink"
          icon={UserCircle2}
          title="รูปประจำตัว"
          subtitle="เลือกจาก preset หรืออัพโหลดเอง — ระบบจะตั้งชื่อไฟล์เป็นรหัสพนักงานให้อัตโนมัติ"
        >
          <AvatarPicker
            selectedPreset={selectedPreset}
            onSelectPreset={handleSelectPreset}
            customPreview={customPreview}
            onUpload={handleUpload}
            onClearCustom={handleClearCustom}
          />
        </Section>

        {/* Personal info — 2 columns */}
        <Section
          tone="violet"
          icon={UserIcon}
          title="ข้อมูลส่วนตัว"
          subtitle="อัพเดตข้อมูลของคุณให้เป็นปัจจุบัน"
        >
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-x-5">
            <FormField
              control={form.control}
              name="firstName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs text-foreground/70">
                    ชื่อ <span className="text-destructive">*</span>
                  </FormLabel>
                  <FieldShell icon={UserSquare2}>
                    <FormControl>
                      <Input placeholder="ชื่อจริง" {...field} className="h-10 pl-9" />
                    </FormControl>
                  </FieldShell>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="lastName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs text-foreground/70">
                    นามสกุล <span className="text-destructive">*</span>
                  </FormLabel>
                  <FieldShell icon={UserSquare2}>
                    <FormControl>
                      <Input placeholder="นามสกุล" {...field} className="h-10 pl-9" />
                    </FormControl>
                  </FieldShell>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="nickname"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs text-foreground/70">ชื่อเล่น</FormLabel>
                  <FieldShell icon={Smile}>
                    <FormControl>
                      <Input placeholder="—" {...field} className="h-10 pl-9" />
                    </FormControl>
                  </FieldShell>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs text-foreground/70">เบอร์โทรศัพท์</FormLabel>
                  <FieldShell icon={Phone}>
                    <FormControl>
                      <Input
                        type="tel"
                        placeholder="08x-xxx-xxxx"
                        {...field}
                        className="h-10 pl-9"
                      />
                    </FormControl>
                  </FieldShell>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem className="sm:col-span-2">
                  <FormLabel className="text-xs text-foreground/70">
                    อีเมล <span className="text-destructive">*</span>
                  </FormLabel>
                  <FieldShell icon={AtSign}>
                    <FormControl>
                      <Input
                        type="email"
                        placeholder="you@example.com"
                        {...field}
                        className="h-10 pl-9"
                      />
                    </FormControl>
                  </FieldShell>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </Section>

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
              บันทึกการตั้งค่า
            </Button>
          </div>
        </div>
      </form>
    </Form>
  );
}

/* ─── FieldShell — icon + child input wrapper ───────────────────────── */

function FieldShell({ icon: Icon, children }: { icon?: LucideIcon; children: React.ReactNode }) {
  return (
    <div className="group relative">
      {Icon ? (
        <Icon className="pointer-events-none absolute left-3 top-1/2 z-10 size-4 -translate-y-1/2 text-muted-foreground/60 transition-colors group-focus-within:text-violet-500" />
      ) : null}
      {children}
    </div>
  );
}

/* ─── Section ───────────────────────────────────────────────────────── */

type Tone = 'violet' | 'pink' | 'sky' | 'amber';

const toneStyles: Record<Tone, { ring: string; iconBg: string; iconColor: string; blob: string }> = {
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
