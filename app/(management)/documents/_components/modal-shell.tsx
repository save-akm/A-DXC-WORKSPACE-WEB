'use client';

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { X, type LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ModalShellProps {
  open: boolean;
  title: string;
  icon: LucideIcon;
  description?: string;
  /** gradient แถบบนสุด — default = brand indigo→violet */
  accent?: string;
  maxWidth?: string;
  /** ปิดการกดพื้นหลัง/ปุ่ม X ระหว่างรอ request */
  locked?: boolean;
  onClose: () => void;
  children: React.ReactNode;
}

/** โครง modal กลางของหน้า Documents — backdrop + การ์ดกึ่งกลาง + แถบ accent */
export function ModalShell({
  open,
  title,
  icon: Icon,
  description,
  accent = 'from-indigo-500 to-violet-600',
  maxWidth = 'max-w-md',
  locked = false,
  onClose,
  children,
}: ModalShellProps) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !locked) onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, locked, onClose]);

  if (!mounted) return null;

  return createPortal(
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            key="modal-backdrop"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
            onClick={() => !locked && onClose()}
          />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              key="modal-panel"
              role="dialog"
              aria-modal="true"
              aria-label={title}
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
              className={cn(
                'flex max-h-[85vh] w-full flex-col overflow-hidden rounded-2xl bg-card shadow-2xl',
                maxWidth,
              )}
              onClick={e => e.stopPropagation()}
            >
              <div className={cn('h-1 w-full shrink-0 bg-linear-to-r', accent)} />
              <div className="flex items-start justify-between gap-3 px-6 pt-5 pb-3">
                <div>
                  <div className="flex items-center gap-2">
                    <Icon className="size-4 text-indigo-500" />
                    <h2 className="text-[14px] font-bold">{title}</h2>
                  </div>
                  {description && (
                    <p className="mt-0.5 text-xs text-muted-foreground">{description}</p>
                  )}
                </div>
                <button
                  type="button"
                  disabled={locked}
                  onClick={onClose}
                  aria-label="ปิด"
                  className="flex size-7 shrink-0 cursor-pointer items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:opacity-50"
                >
                  <X className="size-4" />
                </button>
              </div>
              {/* pt-1: กันไม่ให้ focus ring ของ input/select ตัวแรกโดน overflow-y-auto ตัดขอบบน */}
              <div className="min-h-0 flex-1 overflow-y-auto pt-1">{children}</div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>,
    document.body,
  );
}
