'use client';

import { useActionState, useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { AlertCircle, Eye, EyeOff, KeyRound, Loader2, Lock, ShieldAlert } from 'lucide-react';
import { updatePasswordAction } from '@/lib/auth/actions';
import type { UpdatePasswordActionState } from '@/lib/auth/types';

interface Props {
  accessToken: string;
  onSuccess: (newAccessToken: string, newExpiresAt: number) => void;
}

const initialState: UpdatePasswordActionState = { status: 'idle' };

export function UpdatePasswordForm({ accessToken, onSuccess }: Props) {
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const tooShort = newPassword.length > 0 && newPassword.length < 8;
  const mismatch = confirmPassword.length > 0 && newPassword !== confirmPassword;

  const [state, formAction, pending] = useActionState<UpdatePasswordActionState, FormData>(
    (prev, formData) => updatePasswordAction(accessToken, prev, formData),
    initialState,
  );

  useEffect(() => {
    if (state.status === 'success') onSuccess(state.accessToken, state.expiresAt);
  }, [state, onSuccess]);

  return (
    <>
      <div className="flex flex-col items-center gap-3 mb-6">
        <div className="w-14 h-14 rounded-2xl bg-brand flex items-center justify-center shadow-lg shadow-brand/30">
          <KeyRound className="w-7 h-7 text-white" />
        </div>
        <div className="text-center">
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight">ตั้งรหัสผ่านใหม่</h1>
          <p className="text-xs text-muted-foreground mt-1">
            บัญชีของคุณต้องเปลี่ยนรหัสผ่านก่อนเข้าใช้งาน
          </p>
        </div>
      </div>

      <div className="flex items-start gap-2 rounded-xl px-3 py-2.5 mb-4 text-xs bg-warning/10 border border-warning/20 text-warning">
        <ShieldAlert className="w-3.5 h-3.5 mt-0.5 shrink-0" />
        <span>เพื่อความปลอดภัย กรุณาตั้งรหัสผ่านใหม่ที่คาดเดาได้ยาก (อย่างน้อย 8 ตัวอักษร)</span>
      </div>

      <form action={formAction} className="space-y-4">
        <div>
          <label
            htmlFor="new-password"
            className="block text-[11px] font-bold uppercase tracking-wider text-muted-foreground/80 mb-1.5"
          >
            รหัสผ่านใหม่
          </label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/60" />
            <input
              id="new-password"
              name="newPassword"
              type={showNew ? 'text' : 'password'}
              placeholder="••••••••"
              required
              autoFocus
              autoComplete="new-password"
              disabled={pending}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className={`w-full pl-10 pr-10 py-2.5 rounded-xl text-sm
                bg-zinc-100/70 dark:bg-white/5
                border text-foreground placeholder:text-muted-foreground/50
                outline-none focus:ring-2 focus:bg-white dark:focus:bg-white/8
                transition-colors disabled:opacity-60
                ${tooShort
                  ? 'border-destructive/60 focus:border-destructive focus:ring-destructive/25'
                  : 'border-zinc-200 dark:border-white/10 focus:border-ring focus:ring-ring/25'
                }`}
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
          {tooShort && (
            <p className="mt-1.5 text-[11px] text-destructive">รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร</p>
          )}
        </div>

        <div>
          <label
            htmlFor="confirm-password"
            className="block text-[11px] font-bold uppercase tracking-wider text-muted-foreground/80 mb-1.5"
          >
            ยืนยันรหัสผ่าน
          </label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/60" />
            <input
              id="confirm-password"
              name="confirmPassword"
              type={showConfirm ? 'text' : 'password'}
              placeholder="••••••••"
              required
              autoComplete="new-password"
              disabled={pending}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className={`w-full pl-10 pr-10 py-2.5 rounded-xl text-sm
                bg-zinc-100/70 dark:bg-white/5
                border text-foreground placeholder:text-muted-foreground/50
                outline-none focus:ring-2 focus:bg-white dark:focus:bg-white/8
                transition-colors disabled:opacity-60
                ${mismatch
                  ? 'border-destructive/60 focus:border-destructive focus:ring-destructive/25'
                  : 'border-zinc-200 dark:border-white/10 focus:border-ring focus:ring-ring/25'
                }`}
            />
            <button
              type="button"
              onClick={() => setShowConfirm((v) => !v)}
              aria-label={showConfirm ? 'ซ่อนรหัสผ่าน' : 'แสดงรหัสผ่าน'}
              className="absolute right-2 top-1/2 -translate-y-1/2 w-7 h-7 rounded-lg flex items-center justify-center text-muted-foreground/60 hover:text-foreground hover:bg-zinc-200/60 dark:hover:bg-white/10 transition-colors cursor-pointer"
            >
              {showConfirm ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
            </button>
          </div>
          {mismatch && (
            <p className="mt-1.5 text-[11px] text-destructive">รหัสผ่านไม่ตรงกัน</p>
          )}
        </div>

        {state.status === 'error' && (
          <div
            role="alert"
            className="flex items-start gap-2 rounded-xl px-3 py-2.5 text-xs
              bg-destructive/10 border border-destructive/20 text-destructive"
          >
            <AlertCircle className="w-3.5 h-3.5 mt-0.5 shrink-0" />
            <span>{state.error}</span>
          </div>
        )}

        <motion.button
          type="submit"
          disabled={pending || tooShort || mismatch}
          whileHover={pending ? undefined : { scale: 1.02 }}
          whileTap={pending ? undefined : { scale: 0.97 }}
          className="w-full inline-flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold
            bg-linear-to-br from-violet-600 to-fuchsia-700 hover:from-violet-700 hover:to-fuchsia-800 text-white
            shadow-lg shadow-brand/30
            transition-colors cursor-pointer
            disabled:opacity-70 disabled:cursor-not-allowed"
        >
          {pending ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              กำลังบันทึก…
            </>
          ) : (
            <>
              <KeyRound className="w-4 h-4" />
              บันทึกรหัสผ่านใหม่
            </>
          )}
        </motion.button>
      </form>
    </>
  );
}
