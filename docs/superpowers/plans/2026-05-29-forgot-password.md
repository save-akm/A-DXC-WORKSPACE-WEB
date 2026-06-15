# Forgot Password Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a 3-step Forgot Password flow (enter identifier → OTP email → reset password) as a third animated view inside the existing login page.

**Architecture:** Extend the existing `view` state in `app/login/page.tsx` from 2 to 3 views using the same `AnimatePresence` slide-fade pattern. All forgot-password logic lives in a new `ForgotPasswordForm` component that manages its own 2-step internal state. Backend layer follows the existing pattern: config → api → actions.

**Tech Stack:** Next.js 15 App Router, React `useActionState`, framer-motion, Tailwind CSS, lucide-react, TypeScript

---

## File Map

| File | Action | Responsibility |
|------|--------|----------------|
| `lib/auth/config.ts` | Modify | Add `forgotPassword` + `resetPassword` endpoint paths |
| `lib/auth/types.ts` | Modify | Add `ForgotPasswordActionState`, `ResetPasswordActionState` |
| `lib/auth/api.ts` | Modify | Add `forgotPasswordRequest`, `resetPasswordRequest` |
| `lib/auth/actions.ts` | Modify | Add `forgotPasswordAction`, `resetPasswordAction` server actions |
| `app/login/forgot-password-form.tsx` | Create | 2-step form component (email → OTP + new password) |
| `app/login/page.tsx` | Modify | Add `'forgot-password'` view + wire "ลืมรหัสผ่าน?" button |

---

### Task 1: Add endpoints to config and types

**Files:**
- Modify: `lib/auth/config.ts`
- Modify: `lib/auth/types.ts`

- [ ] **Step 1: Add endpoints to `lib/auth/config.ts`**

Open `lib/auth/config.ts`. The `endpoints` object currently has 6 keys. Add two more:

```ts
export const authConfig = {
  apiUrl: process.env.API_URL ?? 'http://localhost:3001',
  endpoints: {
    login: '/auth/login',
    refresh: '/auth/refresh',
    logout: '/auth/logout',
    me: '/auth/me',
    menus: '/menus/my',
    updatePassword: '/auth/update-password',
    forgotPassword: '/auth/forgot-password',
    resetPassword: '/auth/reset-password',
  },
  cookies: {
    refresh: 'a_dxc_rt',
  },
  refreshLeadMs: 60_000,
  refreshCookieMaxAgeSeconds: 60 * 60 * 24 * 30,
} as const;
```

- [ ] **Step 2: Add state types to `lib/auth/types.ts`**

Append to the end of `lib/auth/types.ts`:

```ts
export type ForgotPasswordActionState =
  | { status: 'idle' }
  | { status: 'success' }
  | { status: 'error'; error: string };

export type ResetPasswordActionState =
  | { status: 'idle' }
  | { status: 'success' }
  | { status: 'error'; error: string };
```

- [ ] **Step 3: Type-check**

```bash
npx tsc --noEmit
```

Expected: no errors

- [ ] **Step 4: Commit**

```bash
git add lib/auth/config.ts lib/auth/types.ts
git commit -m "feat(auth): add forgotPassword and resetPassword endpoint config and state types"
```

---

### Task 2: Add API request functions

**Files:**
- Modify: `lib/auth/api.ts`

- [ ] **Step 1: Add `forgotPasswordRequest` to `lib/auth/api.ts`**

Append after `updatePasswordRequest` at the bottom of the file:

```ts
export function forgotPasswordRequest(identifier: string): Promise<void> {
  return request<void>(authConfig.endpoints.forgotPassword, {
    method: 'POST',
    body: { identifier },
  });
}

export function resetPasswordRequest(
  identifier: string,
  otp: string,
  newPassword: string,
): Promise<void> {
  return request<void>(authConfig.endpoints.resetPassword, {
    method: 'POST',
    body: { identifier, otp, newPassword },
  });
}
```

- [ ] **Step 2: Type-check**

```bash
npx tsc --noEmit
```

Expected: no errors

- [ ] **Step 3: Commit**

```bash
git add lib/auth/api.ts
git commit -m "feat(auth): add forgotPasswordRequest and resetPasswordRequest API functions"
```

---

### Task 3: Add server actions

**Files:**
- Modify: `lib/auth/actions.ts`

- [ ] **Step 1: Update imports in `lib/auth/actions.ts`**

The existing import line at the top is:
```ts
import {
  AuthApiError,
  loginRequest,
  logoutRequest,
  meRequest,
  menuRequest,
  refreshRequest,
  updatePasswordRequest,
} from './api';
```

Change it to:
```ts
import {
  AuthApiError,
  forgotPasswordRequest,
  loginRequest,
  logoutRequest,
  meRequest,
  menuRequest,
  refreshRequest,
  resetPasswordRequest,
  updatePasswordRequest,
} from './api';
```

Also update the types import line:
```ts
import type { AuthUser, ForgotPasswordActionState, LoginActionState, MenuNode, RefreshActionState, ResetPasswordActionState, UpdatePasswordActionState } from './types';
```

- [ ] **Step 2: Add `forgotPasswordAction` and `resetPasswordAction`**

Append to the end of `lib/auth/actions.ts`:

```ts
export async function forgotPasswordAction(
  _prev: ForgotPasswordActionState,
  formData: FormData,
): Promise<ForgotPasswordActionState> {
  const identifier = (formData.get('identifier') ?? '').toString().trim();
  if (!identifier) return { status: 'error', error: 'กรุณากรอกอีเมลหรือรหัสพนักงาน' };

  try {
    await forgotPasswordRequest(identifier);
    return { status: 'success' };
  } catch (e) {
    const { message } = mapError(e, 'ไม่สามารถส่ง OTP ได้ กรุณาลองใหม่');
    return { status: 'error', error: message };
  }
}

export async function resetPasswordAction(
  identifier: string,
  _prev: ResetPasswordActionState,
  formData: FormData,
): Promise<ResetPasswordActionState> {
  const otp = (formData.get('otp') ?? '').toString().trim();
  const newPassword = (formData.get('newPassword') ?? '').toString();
  const confirmPassword = (formData.get('confirmPassword') ?? '').toString();

  if (!otp || otp.length !== 4) return { status: 'error', error: 'กรุณากรอก OTP 4 หลัก' };
  if (!newPassword) return { status: 'error', error: 'กรุณากรอกรหัสผ่านใหม่' };
  if (newPassword.length < 8) return { status: 'error', error: 'รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร' };
  if (newPassword !== confirmPassword) return { status: 'error', error: 'รหัสผ่านไม่ตรงกัน' };

  try {
    await resetPasswordRequest(identifier, otp, newPassword);
    return { status: 'success' };
  } catch (e) {
    const { message } = mapError(e, 'ไม่สามารถเปลี่ยนรหัสผ่านได้');
    return { status: 'error', error: message };
  }
}
```

- [ ] **Step 3: Type-check**

```bash
npx tsc --noEmit
```

Expected: no errors

- [ ] **Step 4: Commit**

```bash
git add lib/auth/actions.ts
git commit -m "feat(auth): add forgotPasswordAction and resetPasswordAction server actions"
```

---

### Task 4: Create `ForgotPasswordForm` component

**Files:**
- Create: `app/login/forgot-password-form.tsx`

- [ ] **Step 1: Create the file**

Create `app/login/forgot-password-form.tsx` with the full content below.

The component has two internal steps managed by `step: 'email' | 'reset'`:
- Step `email`: identifier input → calls `forgotPasswordAction`
- Step `reset`: 4-box OTP + new/confirm password → calls `resetPasswordAction`

Internal transitions use `AnimatePresence` with a horizontal slide (±40px), matching the outer card animation style.

The OTP input is 4 separate `<input>` elements that auto-advance on digit entry and auto-focus-back on backspace.

```tsx
'use client';

import { useActionState, useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
  Eye,
  EyeOff,
  KeyRound,
  Loader2,
  Lock,
  Mail,
  ShieldCheck,
} from 'lucide-react';
import { forgotPasswordAction, resetPasswordAction } from '@/lib/auth/actions';
import type { ForgotPasswordActionState, ResetPasswordActionState } from '@/lib/auth/types';

interface Props {
  onBack: () => void;
  onSuccess: () => void;
}

const initialForgot: ForgotPasswordActionState = { status: 'idle' };
const initialReset: ResetPasswordActionState = { status: 'idle' };

export function ForgotPasswordForm({ onBack, onSuccess }: Props) {
  const [step, setStep] = useState<'email' | 'reset'>('email');
  const [identifier, setIdentifier] = useState('');
  const [otp, setOtp] = useState(['', '', '', '']);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const otpRefs = [
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
  ];

  const [forgotState, forgotAction, forgotPending] = useActionState(
    forgotPasswordAction,
    initialForgot,
  );

  const [resetState, resetAction, resetPending] = useActionState(
    (prev: ResetPasswordActionState, formData: FormData) =>
      resetPasswordAction(identifier, prev, formData),
    initialReset,
  );

  useEffect(() => {
    if (forgotState.status === 'success') setStep('reset');
  }, [forgotState]);

  useEffect(() => {
    if (resetState.status === 'success') onSuccess();
  }, [resetState, onSuccess]);

  const handleOtpChange = (index: number, value: string) => {
    if (!/^\d?$/.test(value)) return;
    const next = [...otp];
    next[index] = value;
    setOtp(next);
    if (value && index < 3) otpRefs[index + 1].current?.focus();
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      otpRefs[index - 1].current?.focus();
    }
  };

  const maskedIdentifier = identifier.includes('@')
    ? identifier.replace(/^(.{2})(.*)(@.*)$/, (_, a, b, c) => a + '*'.repeat(b.length) + c)
    : identifier.slice(0, 2) + '***' + identifier.slice(-1);

  return (
    <AnimatePresence mode="wait" initial={false}>
      {step === 'email' ? (
        <motion.div
          key="email"
          initial={{ x: -40, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: -40, opacity: 0 }}
          transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
        >
          <div className="flex flex-col items-center gap-3 mb-6">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-sky-500 via-cyan-500 to-teal-500 flex items-center justify-center shadow-lg shadow-cyan-500/30">
              <KeyRound className="w-7 h-7 text-white" />
            </div>
            <div className="text-center">
              <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight">ลืมรหัสผ่าน?</h1>
              <p className="text-xs text-muted-foreground mt-1">
                กรอกอีเมลหรือรหัสพนักงาน เราจะส่ง OTP ให้คุณ
              </p>
            </div>
          </div>

          <form action={forgotAction} className="space-y-4">
            <input type="hidden" name="identifier" value={identifier} />
            <div>
              <label
                htmlFor="forgot-identifier"
                className="block text-[11px] font-bold uppercase tracking-wider text-muted-foreground/80 mb-1.5"
              >
                อีเมลหรือรหัสพนักงาน
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/60" />
                <input
                  id="forgot-identifier"
                  name="identifier"
                  type="text"
                  placeholder="name@a-dxc.com หรือ EMP001"
                  required
                  autoFocus
                  autoComplete="username"
                  disabled={forgotPending}
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  className="w-full pl-10 pr-3 py-2.5 rounded-xl text-sm
                    bg-zinc-100/70 dark:bg-white/5
                    border border-zinc-200 dark:border-white/10
                    text-foreground placeholder:text-muted-foreground/50
                    outline-none focus:border-cyan-400/60 focus:bg-white dark:focus:bg-white/[0.07]
                    transition-colors disabled:opacity-60"
                />
              </div>
            </div>

            {forgotState.status === 'error' && (
              <div
                role="alert"
                className="flex items-start gap-2 rounded-xl px-3 py-2.5 text-xs
                  bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-300"
              >
                <AlertCircle className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                <span>{forgotState.error}</span>
              </div>
            )}

            <motion.button
              type="submit"
              disabled={forgotPending}
              whileHover={forgotPending ? undefined : { scale: 1.02 }}
              whileTap={forgotPending ? undefined : { scale: 0.97 }}
              className="w-full inline-flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold
                bg-gradient-to-r from-sky-500 to-cyan-500 hover:from-sky-600 hover:to-cyan-600 text-white
                shadow-lg shadow-cyan-500/30
                transition-colors cursor-pointer
                disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {forgotPending ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  กำลังส่ง OTP…
                </>
              ) : (
                <>
                  <Mail className="w-4 h-4" />
                  ส่ง OTP
                </>
              )}
            </motion.button>
          </form>

          <div className="mt-5 flex justify-center">
            <button
              type="button"
              onClick={onBack}
              className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              กลับเข้าสู่ระบบ
            </button>
          </div>
        </motion.div>
      ) : (
        <motion.div
          key="reset"
          initial={{ x: 40, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: 40, opacity: 0 }}
          transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
        >
          <div className="flex flex-col items-center gap-3 mb-6">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-sky-500 via-cyan-500 to-teal-500 flex items-center justify-center shadow-lg shadow-cyan-500/30">
              <ShieldCheck className="w-7 h-7 text-white" />
            </div>
            <div className="text-center">
              <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight">ยืนยัน OTP</h1>
              <p className="text-xs text-muted-foreground mt-1">
                กรอก OTP 4 หลักที่ส่งไปยัง{' '}
                <span className="font-semibold text-foreground">{maskedIdentifier}</span>
              </p>
            </div>
          </div>

          <div className="flex items-start gap-2 rounded-xl px-3 py-2.5 mb-4 text-xs bg-cyan-500/10 border border-cyan-500/20 text-cyan-700 dark:text-cyan-300">
            <CheckCircle2 className="w-3.5 h-3.5 mt-0.5 shrink-0" />
            <span>OTP มีอายุ 5 นาที หากไม่ได้รับ ให้กดส่งใหม่ด้านล่าง</span>
          </div>

          <form
            action={(formData) => {
              formData.set('otp', otp.join(''));
              return resetAction(formData);
            }}
            className="space-y-4"
          >
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-muted-foreground/80 mb-1.5">
                รหัส OTP
              </label>
              <div className="flex gap-2 justify-center">
                {otp.map((digit, i) => (
                  <input
                    key={i}
                    ref={otpRefs[i]}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    autoFocus={i === 0}
                    disabled={resetPending}
                    onChange={(e) => handleOtpChange(i, e.target.value)}
                    onKeyDown={(e) => handleOtpKeyDown(i, e)}
                    className="w-12 h-12 rounded-xl text-center text-lg font-bold
                      bg-zinc-100/70 dark:bg-white/5
                      border border-zinc-200 dark:border-white/10
                      text-foreground
                      outline-none focus:border-cyan-400/60 focus:bg-white dark:focus:bg-white/[0.07]
                      transition-colors disabled:opacity-60"
                  />
                ))}
              </div>
            </div>

            <div>
              <label
                htmlFor="reset-new-password"
                className="block text-[11px] font-bold uppercase tracking-wider text-muted-foreground/80 mb-1.5"
              >
                รหัสผ่านใหม่
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/60" />
                <input
                  id="reset-new-password"
                  name="newPassword"
                  type={showNew ? 'text' : 'password'}
                  placeholder="••••••••"
                  required
                  autoComplete="new-password"
                  disabled={resetPending}
                  className="w-full pl-10 pr-10 py-2.5 rounded-xl text-sm
                    bg-zinc-100/70 dark:bg-white/5
                    border border-zinc-200 dark:border-white/10
                    text-foreground placeholder:text-muted-foreground/50
                    outline-none focus:border-cyan-400/60 focus:bg-white dark:focus:bg-white/[0.07]
                    transition-colors disabled:opacity-60"
                />
                <button
                  type="button"
                  onClick={() => setShowNew((v) => !v)}
                  aria-label={showNew ? 'ซ่อนรหัสผ่าน' : 'แสดงรหัสผ่าน'}
                  className="absolute right-2 top-1/2 -translate-y-1/2 w-7 h-7 rounded-lg flex items-center justify-center text-muted-foreground/60 hover:text-foreground hover:bg-zinc-200/60 dark:hover:bg-white/10 transition-colors cursor-pointer"
                >
                  {showNew ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>

            <div>
              <label
                htmlFor="reset-confirm-password"
                className="block text-[11px] font-bold uppercase tracking-wider text-muted-foreground/80 mb-1.5"
              >
                ยืนยันรหัสผ่าน
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/60" />
                <input
                  id="reset-confirm-password"
                  name="confirmPassword"
                  type={showConfirm ? 'text' : 'password'}
                  placeholder="••••••••"
                  required
                  autoComplete="new-password"
                  disabled={resetPending}
                  className="w-full pl-10 pr-10 py-2.5 rounded-xl text-sm
                    bg-zinc-100/70 dark:bg-white/5
                    border border-zinc-200 dark:border-white/10
                    text-foreground placeholder:text-muted-foreground/50
                    outline-none focus:border-cyan-400/60 focus:bg-white dark:focus:bg-white/[0.07]
                    transition-colors disabled:opacity-60"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm((v) => !v)}
                  aria-label={showConfirm ? 'ซ่อนรหัสผ่าน' : 'แสดงรหัสผ่าน'}
                  className="absolute right-2 top-1/2 -translate-y-1/2 w-7 h-7 rounded-lg flex items-center justify-center text-muted-foreground/60 hover:text-foreground hover:bg-zinc-200/60 dark:hover:bg-white/10 transition-colors cursor-pointer"
                >
                  {showConfirm ? (
                    <EyeOff className="w-3.5 h-3.5" />
                  ) : (
                    <Eye className="w-3.5 h-3.5" />
                  )}
                </button>
              </div>
            </div>

            {resetState.status === 'error' && (
              <div
                role="alert"
                className="flex items-start gap-2 rounded-xl px-3 py-2.5 text-xs
                  bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-300"
              >
                <AlertCircle className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                <span>{resetState.error}</span>
              </div>
            )}

            <motion.button
              type="submit"
              disabled={resetPending || otp.some((d) => !d)}
              whileHover={resetPending ? undefined : { scale: 1.02 }}
              whileTap={resetPending ? undefined : { scale: 0.97 }}
              className="w-full inline-flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold
                bg-gradient-to-r from-sky-500 to-cyan-500 hover:from-sky-600 hover:to-cyan-600 text-white
                shadow-lg shadow-cyan-500/30
                transition-colors cursor-pointer
                disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {resetPending ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  กำลังบันทึก…
                </>
              ) : (
                <>
                  <ShieldCheck className="w-4 h-4" />
                  ยืนยันและตั้งรหัสใหม่
                </>
              )}
            </motion.button>
          </form>

          <div className="mt-5 flex justify-center">
            <button
              type="button"
              onClick={() => {
                setStep('email');
                setOtp(['', '', '', '']);
              }}
              className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              ส่ง OTP ใหม่
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
```

- [ ] **Step 2: Type-check**

```bash
npx tsc --noEmit
```

Expected: no errors

- [ ] **Step 3: Commit**

```bash
git add app/login/forgot-password-form.tsx
git commit -m "feat(login): add ForgotPasswordForm component with 2-step OTP flow"
```

---

### Task 5: Wire up `page.tsx`

**Files:**
- Modify: `app/login/page.tsx`

- [ ] **Step 1: Update imports**

At the top of `app/login/page.tsx`, add the new import after the `UpdatePasswordForm` import line:

```ts
import { ForgotPasswordForm } from './forgot-password-form';
```

- [ ] **Step 2: Extend the `view` state type**

Find the line:
```ts
const [view, setView] = useState<'login' | 'update-password'>('login');
```

Change it to:
```ts
const [view, setView] = useState<'login' | 'update-password' | 'forgot-password'>('login');
```

- [ ] **Step 3: Add `handleForgotPasswordSuccess` callback**

After `handlePasswordUpdated` (around line 87), add:

```ts
const handleForgotPasswordSuccess = useCallback(() => {
  setView('login');
  toast.success('เปลี่ยนรหัสผ่านสำเร็จ', {
    description: 'กรุณาเข้าสู่ระบบด้วยรหัสผ่านใหม่',
  });
}, []);
```

- [ ] **Step 4: Wire "ลืมรหัสผ่าน?" button**

Find the existing button (around line 221-226):
```tsx
<button
  type="button"
  className="text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer font-medium"
>
  ลืมรหัสผ่าน?
</button>
```

Change it to:
```tsx
<button
  type="button"
  onClick={() => setView('forgot-password')}
  className="text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer font-medium"
>
  ลืมรหัสผ่าน?
</button>
```

- [ ] **Step 5: Add `forgot-password` case to `AnimatePresence`**

The `AnimatePresence` block currently ends with the `update-password` motion.div. Add a new `else` case after the `update-password` ternary closing brace. The current structure ends at line ~305:

```tsx
        ) : (
          <motion.div
            key="update-password"
            initial={{ x: 80, opacity: 0, scale: 0.97 }}
            animate={{ x: 0, opacity: 1, scale: 1 }}
            exit={{ x: -80, opacity: 0, scale: 0.97 }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            className="w-full max-w-md"
          >
            <div className={CARD_CLASS}>
              {CARD_GLOW}
              <div className="relative p-7 sm:p-9">
                {pendingSession && (
                  <UpdatePasswordForm
                    accessToken={pendingSession.accessToken}
                    refreshToken={pendingSession.pendingRefreshToken!}
                    onSuccess={handlePasswordUpdated}
                  />
                )}
              </div>
            </div>
          </motion.div>
        )}
```

Replace the final ternary with a chained condition — change the entire `AnimatePresence` inner JSX from:

```tsx
        {view === 'login' ? (
          <motion.div key="login" ...>
            ...login card...
          </motion.div>
        ) : (
          <motion.div key="update-password" ...>
            ...update-password card...
          </motion.div>
        )}
```

to:

```tsx
        {view === 'login' ? (
          <motion.div key="login" ...>
            ...login card... {/* unchanged */}
          </motion.div>
        ) : view === 'update-password' ? (
          <motion.div
            key="update-password"
            initial={{ x: 80, opacity: 0, scale: 0.97 }}
            animate={{ x: 0, opacity: 1, scale: 1 }}
            exit={{ x: -80, opacity: 0, scale: 0.97 }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            className="w-full max-w-md"
          >
            <div className={CARD_CLASS}>
              {CARD_GLOW}
              <div className="relative p-7 sm:p-9">
                {pendingSession && (
                  <UpdatePasswordForm
                    accessToken={pendingSession.accessToken}
                    refreshToken={pendingSession.pendingRefreshToken!}
                    onSuccess={handlePasswordUpdated}
                  />
                )}
              </div>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="forgot-password"
            initial={{ x: 80, opacity: 0, scale: 0.97 }}
            animate={{ x: 0, opacity: 1, scale: 1 }}
            exit={{ x: -80, opacity: 0, scale: 0.97 }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            className="w-full max-w-md"
          >
            <div className={CARD_CLASS}>
              {CARD_GLOW}
              <div className="relative p-7 sm:p-9">
                <ForgotPasswordForm
                  onBack={() => setView('login')}
                  onSuccess={handleForgotPasswordSuccess}
                />
              </div>
            </div>
          </motion.div>
        )}
```

- [ ] **Step 6: Type-check and build**

```bash
npx tsc --noEmit
```

Expected: no errors

- [ ] **Step 7: Commit**

```bash
git add app/login/page.tsx
git commit -m "feat(login): add forgot-password view with slide-fade transition"
```
