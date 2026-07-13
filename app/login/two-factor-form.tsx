'use client';

import { useCallback, useEffect, useRef, useState, useTransition } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { AlertCircle, ArrowLeft, KeyRound, Loader2, ShieldCheck } from 'lucide-react';
import { cn } from '@/lib/utils';
import { verify2FAAction } from '@/lib/auth/actions';
import type { SessionData } from '@/lib/auth/types';

const PIN_LENGTH = 6;

interface TwoFactorFormProps {
  twoFactorToken: string;
  rememberMe: boolean;
  onBack: () => void;
  onSuccess: (data: SessionData) => void;
}

export function TwoFactorForm({ twoFactorToken, rememberMe, onBack, onSuccess }: TwoFactorFormProps) {
  const [digits, setDigits] = useState<string[]>(Array(PIN_LENGTH).fill(''));
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    const id = setTimeout(() => inputRefs.current[0]?.focus(), 80);
    return () => clearTimeout(id);
  }, []);

  const pin = digits.join('');
  const isComplete = pin.length === PIN_LENGTH;

  const submit = useCallback(
    (currentPin: string) => {
      if (currentPin.length !== PIN_LENGTH || isPending) return;
      startTransition(async () => {
        const result = await verify2FAAction(twoFactorToken, currentPin, rememberMe);
        if (result.status === 'success') {
          onSuccess(result.data);
        } else if (result.status === 'error') {
          setError(result.error ?? 'รหัส PIN ไม่ถูกต้อง');
          setDigits(Array(PIN_LENGTH).fill(''));
          setTimeout(() => inputRefs.current[0]?.focus(), 50);
        }
      });
    },
    [isPending, twoFactorToken, rememberMe, onSuccess],
  );

  const handleChange = useCallback((index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;
    const digit = value.slice(-1);
    setError(null);
    setDigits((prev) => {
      const next = [...prev];
      next[index] = digit;
      if (digit && index < PIN_LENGTH - 1) {
        setTimeout(() => inputRefs.current[index + 1]?.focus(), 0);
      }
      if (digit && index === PIN_LENGTH - 1) {
        const full = [...next].join('');
        if (full.length === PIN_LENGTH) setTimeout(() => submit(full), 0);
      }
      return next;
    });
  }, [submit]);

  const handleKeyDown = useCallback((index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace') {
      setError(null);
      setDigits((prev) => {
        if (prev[index]) {
          const next = [...prev];
          next[index] = '';
          return next;
        }
        if (index > 0) setTimeout(() => inputRefs.current[index - 1]?.focus(), 0);
        return prev;
      });
    } else if (e.key === 'ArrowLeft' && index > 0) {
      inputRefs.current[index - 1]?.focus();
    } else if (e.key === 'ArrowRight' && index < PIN_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  }, []);

  const handlePaste = useCallback((e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const text = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, PIN_LENGTH);
    if (!text) return;
    const next = Array(PIN_LENGTH).fill('') as string[];
    text.split('').forEach((ch, i) => { next[i] = ch; });
    setDigits(next);
    setError(null);
    const focusIdx = Math.min(text.length, PIN_LENGTH - 1);
    setTimeout(() => inputRefs.current[focusIdx]?.focus(), 0);
    if (text.length === PIN_LENGTH) setTimeout(() => submit(next.join('')), 0);
  }, [submit]);

  return (
    <div>
      {/* Back */}
      <button
        type="button"
        onClick={onBack}
        disabled={isPending}
        className="mb-5 inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors cursor-pointer disabled:opacity-50"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        กลับเข้าสู่ระบบ
      </button>

      {/* Header */}
      <div className="flex flex-col items-center gap-3 mb-7">
        <motion.div
          initial={{ scale: 0.6, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 380, damping: 18 }}
          className="relative"
        >
          <div className="w-14 h-14 rounded-2xl bg-emerald-500/15 flex items-center justify-center shadow-lg shadow-emerald-500/20 ring-1 ring-emerald-500/20">
            <ShieldCheck className="w-7 h-7 text-emerald-500" />
          </div>
          <span className="absolute inset-0 animate-ping rounded-2xl bg-emerald-400/15 blur-sm" />
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.08, duration: 0.3 }}
          className="text-center"
        >
          <h2 className="text-xl font-bold tracking-tight">ยืนยันตัวตนสองขั้นตอน</h2>
          <p className="text-xs text-muted-foreground mt-1">
            กรอก PIN 6 หลักที่ตั้งไว้เพื่อเข้าสู่ระบบ
          </p>
        </motion.div>
      </div>

      {/* PIN Boxes */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.14, duration: 0.3 }}
        className="flex justify-center gap-2 sm:gap-2.5 mb-4"
      >
        {digits.map((digit, i) => (
          <div key={i} className="relative size-11 sm:size-13">
            <input
              ref={(el) => { inputRefs.current[i] = el; }}
              type="text"
              inputMode="numeric"
              pattern="\d*"
              maxLength={1}
              autoComplete="off"
              disabled={isPending}
              value={digit}
              onChange={(e) => handleChange(i, e.target.value)}
              onKeyDown={(e) => handleKeyDown(i, e)}
              onPaste={i === 0 ? handlePaste : undefined}
              className={cn(
                'absolute inset-0 size-full rounded-xl border text-center font-bold outline-none transition-all duration-200',
                'caret-transparent select-none text-transparent',
                'bg-zinc-100/70 dark:bg-white/5',
                error
                  ? 'border-destructive/60 bg-destructive/5 focus:border-destructive focus:ring-2 focus:ring-destructive/20'
                  : isComplete
                  ? 'border-emerald-500/60 bg-emerald-500/5 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20'
                  : 'border-zinc-200 dark:border-white/10 focus:border-ring focus:ring-2 focus:ring-ring/25',
                'disabled:opacity-50 disabled:cursor-not-allowed',
              )}
            />
            <AnimatePresence mode="wait">
              {digit && (
                <motion.span
                  key="dot"
                  initial={{ scale: 0.2, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.2, opacity: 0 }}
                  transition={{ type: 'spring', stiffness: 600, damping: 24 }}
                  className={cn(
                    'pointer-events-none absolute inset-0 flex items-center justify-center text-xl font-bold select-none',
                    error
                      ? 'text-destructive'
                      : isComplete
                      ? 'text-emerald-600 dark:text-emerald-400'
                      : 'text-foreground',
                  )}
                >
                  •
                </motion.span>
              )}
            </AnimatePresence>
          </div>
        ))}
      </motion.div>

      {/* Progress dots */}
      <div className="flex justify-center gap-1.5 mb-5">
        {digits.map((digit, i) => (
          <motion.span
            key={i}
            animate={{ scale: digit ? 1.4 : 1 }}
            transition={{ type: 'spring', stiffness: 500, damping: 22 }}
            className={cn(
              'size-1.5 rounded-full transition-colors duration-200',
              error
                ? 'bg-destructive/60'
                : isComplete
                ? 'bg-emerald-500'
                : digit
                ? 'bg-ring'
                : 'bg-muted-foreground/25',
            )}
          />
        ))}
      </div>

      {/* Error */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -4, height: 0 }}
            animate={{ opacity: 1, y: 0, height: 'auto' }}
            exit={{ opacity: 0, y: -4, height: 0 }}
            transition={{ duration: 0.2 }}
            role="alert"
            className="overflow-hidden mb-4"
          >
            <div className="flex items-start gap-2 rounded-xl px-3 py-2.5 text-xs bg-destructive/10 border border-destructive/20 text-destructive">
              <AlertCircle className="w-3.5 h-3.5 mt-0.5 shrink-0" />
              <span>{error}</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Submit */}
      <motion.button
        type="button"
        disabled={!isComplete || isPending}
        onClick={() => submit(pin)}
        whileHover={!isComplete || isPending ? undefined : { scale: 1.02 }}
        whileTap={!isComplete || isPending ? undefined : { scale: 0.97 }}
        className="w-full inline-flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold
          bg-linear-to-br from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white
          shadow-lg shadow-emerald-500/25 transition-all cursor-pointer
          disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none"
      >
        {isPending ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            กำลังตรวจสอบ…
          </>
        ) : (
          <>
            <KeyRound className="w-4 h-4" />
            ยืนยัน PIN
          </>
        )}
      </motion.button>
    </div>
  );
}
