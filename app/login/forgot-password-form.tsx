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

  const otpRef0 = useRef<HTMLInputElement>(null);
  const otpRef1 = useRef<HTMLInputElement>(null);
  const otpRef2 = useRef<HTMLInputElement>(null);
  const otpRef3 = useRef<HTMLInputElement>(null);
  const otpRefs = [otpRef0, otpRef1, otpRef2, otpRef3];

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

          <div role="status" className="flex items-start gap-2 rounded-xl px-3 py-2.5 mb-4 text-xs bg-cyan-500/10 border border-cyan-500/20 text-cyan-700 dark:text-cyan-300">
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
