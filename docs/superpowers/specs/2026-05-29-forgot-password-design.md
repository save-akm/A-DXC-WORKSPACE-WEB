# Forgot Password — Design Spec

**Date:** 2026-05-29  
**Status:** Approved

---

## Overview

Add a Forgot Password flow to the login page (`app/login/page.tsx`) as a third view alongside the existing `login` and `update-password` views. The transition animation (slide + fade via `framer-motion` AnimatePresence) matches the existing update-password pattern exactly.

---

## User Flow

```
[Login]
  └── Click "ลืมรหัสผ่าน?" button
        └── [Forgot Step 1: Enter identifier]
              └── Submit → POST /auth/forgot-password → OTP sent
                    └── [Forgot Step 2: Enter OTP + new password]
                          └── Submit → POST /auth/reset-password → success
                                └── [Back to Login] + toast "เปลี่ยนรหัสผ่านสำเร็จ"
```

- "Back" button on Step 1 → returns to Login view (outer AnimatePresence)  
- "Back" button on Step 2 → returns to Step 1 (inner AnimatePresence, re-entry allowed)

---

## API

| Step | Method | Endpoint | Body |
|------|--------|----------|------|
| 1 | POST | `/auth/forgot-password` | `{ identifier: string }` |
| 2 | POST | `/auth/reset-password` | `{ identifier: string, otp: string, newPassword: string }` |

- OTP: 4-digit numeric, expires in 5 minutes  
- `identifier`: employeeId or email (same field for both steps)  
- On reset-password success: backend revokes all active sessions

---

## Architecture

### Files Changed

| File | Change |
|------|--------|
| `lib/auth/config.ts` | Add `forgotPassword: '/auth/forgot-password'` and `resetPassword: '/auth/reset-password'` to `endpoints` |
| `lib/auth/types.ts` | Add `ForgotPasswordActionState` and `ResetPasswordActionState` types |
| `lib/auth/api.ts` | Add `forgotPasswordRequest(identifier)` and `resetPasswordRequest(identifier, otp, newPassword)` |
| `lib/auth/actions.ts` | Add `forgotPasswordAction` and `resetPasswordAction` server actions |
| `app/login/forgot-password-form.tsx` | New component — 2-step form with internal AnimatePresence |
| `app/login/page.tsx` | Extend `view` union to `'login' \| 'update-password' \| 'forgot-password'`, wire up "ลืมรหัสผ่าน?" button, add `forgot-password` AnimatePresence case |

### Component: `ForgotPasswordForm`

Props:
```ts
interface Props {
  onBack: () => void;       // return to login view
  onSuccess: () => void;    // reset complete → back to login
}
```

Internal state:
- `step: 'email' | 'reset'`
- `identifier: string` — persisted between steps for the reset call
- `useActionState` for each step's action

### State Types

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

---

## UI Design

### Visual Identity
- Icon color: `from-sky-500 via-cyan-500 to-teal-500` (distinct from indigo/login and amber/update-password)
- Icon: `KeyRound` for Step 1, `ShieldCheck` for Step 2

### Step 1 — Enter Identifier
- Label: `อีเมลหรือรหัสพนักงาน`
- Input: text, placeholder `name@a-dxc.com หรือ EMP001`
- Submit button: `ส่ง OTP` with cyan gradient
- Back link: `← กลับเข้าสู่ระบบ`

### Step 2 — OTP + New Password
- Info banner: `OTP 4 หลักถูกส่งไปยัง [masked identifier] — หมดอายุใน 5 นาที`
- OTP input: 4 separate single-character boxes, `inputMode="numeric"`, `maxLength={1}`, auto-advance on input, auto-focus-back on backspace
- New password + confirm password inputs (same style as `UpdatePasswordForm`)
- Submit button: `ยืนยันและตั้งรหัสใหม่` with cyan gradient
- Back link: `← ส่ง OTP ใหม่` (returns to step 1)

### Transition (outer — view switch)
- Matches update-password exactly:  
  Enter: `{ x: 80, opacity: 0, scale: 0.97 }` → `{ x: 0, opacity: 1, scale: 1 }`  
  Exit: `{ x: -80, opacity: 0, scale: 0.97 }`

### Transition (inner — step switch)
- Step 1 → Step 2: `{ x: 40, opacity: 0 }` → `{ x: 0, opacity: 1 }`  
- Step 2 → Step 1: `{ x: -40, opacity: 0 }` → `{ x: 0, opacity: 1 }`  
- Duration: `0.3s ease`

---

## Error Handling

- Step 1: show inline error alert (red banner) below input — same style as login error
- Step 2: show inline error alert below OTP/password fields
- OTP expired: user can go back to step 1 to resend
- Password mismatch / too short: validated client-side before calling API

---

## Post-Success

On `resetPasswordAction` success:
1. Call `onSuccess()` → parent sets `view = 'login'`
2. Parent fires `toast.success('เปลี่ยนรหัสผ่านสำเร็จ', { description: 'กรุณาเข้าสู่ระบบด้วยรหัสผ่านใหม่' })`
