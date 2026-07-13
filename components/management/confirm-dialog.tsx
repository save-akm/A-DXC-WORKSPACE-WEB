'use client';

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { Trash2 } from 'lucide-react';

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  /** Body content — pass a node so callers can highlight the target name. */
  message: React.ReactNode;
  confirmLabel?: string;
  loading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

/** Centered destructive-confirm modal shared across management features. */
export function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = 'ลบ',
  loading = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);
  if (!mounted) return null;

  return createPortal(
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            key="confirm-backdrop"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
            onClick={() => !loading && onCancel()}
          />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              key="confirm-modal"
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
              className="w-full max-w-sm overflow-hidden rounded-2xl bg-card shadow-2xl"
              onClick={e => e.stopPropagation()}
            >
              <div className="h-1 w-full bg-linear-to-r from-rose-500 to-red-600" />
              <div className="px-6 py-5">
                <div className="mb-1 flex items-center gap-2">
                  <Trash2 className="h-4 w-4 text-destructive" />
                  <h2 className="text-[14px] font-bold">{title}</h2>
                </div>
                <div className="text-[13px] text-muted-foreground">{message}</div>
              </div>
              <div className="flex gap-3 border-t border-border/60 px-6 py-4">
                <button
                  type="button"
                  disabled={loading}
                  onClick={onCancel}
                  className="flex-1 cursor-pointer rounded-xl border border-border px-4 py-2.5 text-[13px] font-semibold text-muted-foreground transition-colors hover:bg-muted disabled:opacity-60"
                >
                  ยกเลิก
                </button>
                <button
                  type="button"
                  disabled={loading}
                  onClick={onConfirm}
                  className="flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-xl bg-destructive px-4 py-2.5 text-[13px] font-semibold text-white transition-all hover:bg-destructive/90 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {loading ? (
                    <>
                      <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                      กำลังลบ…
                    </>
                  ) : (
                    <>
                      <Trash2 className="h-3.5 w-3.5" />
                      {confirmLabel}
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>,
    document.body,
  );
}
