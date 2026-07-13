'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { Dialog } from '@base-ui/react/dialog';
import { AnimatePresence, motion } from 'framer-motion';
import { KeyRound, ShieldCheck, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { setup2FARequest } from '@/lib/api/security';
import { useAuthStore } from '@/lib/stores/auth-store';
import { toast } from '@/components/ui/toast';

const PIN_LENGTH = 6;

interface PinModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function PinModal({ open, onOpenChange, onSuccess }: PinModalProps) {
  const accessToken = useAuthStore((s) => s.accessToken);
  const [digits, setDigits] = useState<string[]>(Array(PIN_LENGTH).fill(''));
  const [submitting, setSubmitting] = useState(false);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (open) {
      setDigits(Array(PIN_LENGTH).fill(''));
      setSubmitting(false);
      const id = setTimeout(() => inputRefs.current[0]?.focus(), 60);
      return () => clearTimeout(id);
    }
  }, [open]);

  const handleChange = useCallback((index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;
    const digit = value.slice(-1);
    setDigits((prev) => {
      const next = [...prev];
      next[index] = digit;
      return next;
    });
    if (digit && index < PIN_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  }, []);

  const handleKeyDown = useCallback((index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace') {
      setDigits((prev) => {
        if (prev[index]) {
          const next = [...prev];
          next[index] = '';
          return next;
        }
        if (index > 0) inputRefs.current[index - 1]?.focus();
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
    inputRefs.current[Math.min(text.length, PIN_LENGTH - 1)]?.focus();
  }, []);

  const pin = digits.join('');
  const isComplete = pin.length === PIN_LENGTH;

  const handleSubmit = async () => {
    if (!isComplete || !accessToken || submitting) return;
    setSubmitting(true);
    try {
      await setup2FARequest(accessToken, pin);
      onSuccess();
      onOpenChange(false);
    } catch (e) {
      toast.error('ตั้ง PIN ไม่สำเร็จ', {
        description: e instanceof Error ? e.message : 'กรุณาลองใหม่อีกครั้ง',
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Backdrop className="fixed inset-0 z-50 bg-black/40 transition-opacity duration-200 data-ending-style:opacity-0 data-starting-style:opacity-0 supports-backdrop-filter:backdrop-blur-sm" />
        <Dialog.Popup className="fixed left-1/2 top-1/2 z-50 w-[calc(100vw-2rem)] max-w-md -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-border bg-popover p-5 shadow-2xl shadow-black/20 sm:p-7 transition duration-200 ease-out data-ending-style:scale-95 data-ending-style:opacity-0 data-starting-style:scale-95 data-starting-style:opacity-0">

          {/* Header */}
          <div className="mb-6 flex items-start gap-3">
            <motion.span
              initial={{ scale: 0.7, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.05, type: 'spring', stiffness: 400, damping: 20 }}
              className="inline-flex size-10 shrink-0 items-center justify-center rounded-xl bg-violet-500/10"
            >
              <ShieldCheck className="size-5 text-violet-500" />
            </motion.span>
            <div className="min-w-0 flex-1">
              <Dialog.Title className="text-base font-semibold text-foreground">
                ตั้งรหัส PIN สำหรับ 2FA
              </Dialog.Title>
              <Dialog.Description className="mt-0.5 text-sm text-muted-foreground">
                กรอกตัวเลข 6 หลักเพื่อใช้ยืนยันตัวตนสองขั้นตอน
              </Dialog.Description>
            </div>
            <Dialog.Close
              render={<Button variant="ghost" size="icon-sm" className="mt-0.5 shrink-0 cursor-pointer" />}
            >
              <X />
              <span className="sr-only">ปิด</span>
            </Dialog.Close>
          </div>

          {/* PIN Boxes */}
          <div className="mb-5 flex justify-center gap-2 sm:gap-3">
            {digits.map((digit, i) => (
              <div key={i} className="relative size-11 sm:size-14">
                <input
                  ref={(el) => { inputRefs.current[i] = el; }}
                  type="text"
                  inputMode="numeric"
                  pattern="\d*"
                  maxLength={1}
                  autoComplete="off"
                  value={digit}
                  onChange={(e) => handleChange(i, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(i, e)}
                  onPaste={i === 0 ? handlePaste : undefined}
                  className={cn(
                    'absolute inset-0 size-full rounded-xl border text-center text-xl font-bold outline-none transition-all duration-200',
                    'caret-transparent select-none text-transparent bg-background/80',
                    isComplete
                      ? 'border-emerald-500/60 bg-emerald-500/5 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/30'
                      : 'focus:border-violet-500 focus:ring-2 focus:ring-violet-500/30',
                    !isComplete && (digit ? 'border-violet-500/60 bg-violet-500/5' : 'border-border'),
                  )}
                />
                <AnimatePresence mode="wait">
                  {digit && (
                    <motion.span
                      key="dot"
                      initial={{ scale: 0.3, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 0.3, opacity: 0 }}
                      transition={{ type: 'spring', stiffness: 600, damping: 25 }}
                      className={cn(
                        'pointer-events-none absolute inset-0 flex items-center justify-center font-bold select-none',
                        'text-xl sm:text-2xl',
                        isComplete
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
          </div>

          {/* Progress dots */}
          <div className="mb-6 flex justify-center gap-2">
            {digits.map((digit, i) => (
              <motion.span
                key={i}
                animate={{ scale: digit ? 1.4 : 1 }}
                transition={{ type: 'spring', stiffness: 500, damping: 22 }}
                className={cn(
                  'size-1.5 rounded-full transition-colors duration-200',
                  isComplete
                    ? 'bg-emerald-500'
                    : digit
                    ? 'bg-violet-500'
                    : 'bg-muted-foreground/30',
                )}
              />
            ))}
          </div>

          {/* Complete label */}
          <AnimatePresence>
            {isComplete && (
              <motion.p
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.2 }}
                className="mb-4 text-center text-xs font-medium text-emerald-600 dark:text-emerald-400"
              >
                PIN ครบ 6 หลักแล้ว กด ยืนยัน ได้เลย
              </motion.p>
            )}
          </AnimatePresence>

          {/* Actions */}
          <div className="flex gap-2">
            <Dialog.Close
              render={<Button variant="cancel" className="flex-1 cursor-pointer" />}
              disabled={submitting}
            >
              ยกเลิก
            </Dialog.Close>
            <Button
              variant="save"
              className="flex-1 cursor-pointer"
              disabled={!isComplete || submitting}
              onClick={handleSubmit}
            >
              <KeyRound />
              ยืนยัน PIN
            </Button>
          </div>
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
