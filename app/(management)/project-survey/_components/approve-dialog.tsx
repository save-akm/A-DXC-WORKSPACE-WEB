'use client';

import { useState, useSyncExternalStore } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { BadgeCheck } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';

interface ApproveDialogProps {
  open: boolean;
  docNo: string;
  projectName: string;
  loading?: boolean;
  onConfirm: (remark: string) => void;
  onCancel: () => void;
}

const noopSubscribe = () => () => {};

/** Remark state lives here so it resets whenever the dialog re-opens. */
function ApproveDialogContent({
  docNo, projectName, loading, onConfirm, onCancel,
}: Omit<ApproveDialogProps, 'open'>) {
  const [remark, setRemark] = useState('');

  return (
    <>
      <motion.div
        key="approve-backdrop"
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
        onClick={() => !loading && onCancel()}
      />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <motion.div
          key="approve-modal"
          role="dialog"
          aria-modal="true"
          aria-labelledby="approve-dialog-title"
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
          className="w-full max-w-sm overflow-hidden rounded-2xl bg-card shadow-2xl"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="h-1 w-full bg-linear-to-r from-emerald-500 to-teal-600" />
          <div className="px-6 py-5">
            <div className="mb-1 flex items-center gap-2">
              <BadgeCheck className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
              <h2 id="approve-dialog-title" className="text-[14px] font-bold">อนุมัติคำร้อง</h2>
            </div>
            <p className="text-[13px] text-muted-foreground">
              อนุมัติ <span className="font-medium text-foreground">{docNo}</span>{' '}
              &ldquo;{projectName}&rdquo; หรือไม่? อนุมัติแล้วเอกสารจะถูกล็อกทั้งหมด
              และแก้ไขหรือแสดงความคิดเห็นต่อไม่ได้
            </p>
            <div className="mt-3 space-y-1">
              <label htmlFor="approve-remark" className="text-xs font-medium">
                หมายเหตุ <span className="font-normal text-muted-foreground">(ไม่บังคับ)</span>
              </label>
              <Textarea
                id="approve-remark"
                rows={2}
                maxLength={500}
                placeholder="เช่น อนุมัติตาม scope ที่ปรับ"
                value={remark}
                onChange={(e) => setRemark(e.target.value)}
                disabled={loading}
                className="min-h-16 text-[13px]"
              />
            </div>
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
              onClick={() => onConfirm(remark)}
              className="flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-[13px] font-semibold text-white transition-all hover:bg-emerald-600/90 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? (
                <>
                  <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                  กำลังอนุมัติ…
                </>
              ) : (
                <>
                  <BadgeCheck className="h-3.5 w-3.5" />
                  อนุมัติ
                </>
              )}
            </button>
          </div>
        </motion.div>
      </div>
    </>
  );
}

/**
 * Approval confirm modal (emerald counterpart of ConfirmDialog) with an
 * optional remark that lands in the status history.
 */
export function ApproveDialog({ open, ...content }: ApproveDialogProps) {
  // false during SSR, true after hydration — portals need a live document.
  const mounted = useSyncExternalStore(noopSubscribe, () => true, () => false);
  if (!mounted) return null;

  return createPortal(
    <AnimatePresence>
      {open && <ApproveDialogContent {...content} />}
    </AnimatePresence>,
    document.body,
  );
}
