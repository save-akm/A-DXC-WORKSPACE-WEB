'use client';

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { AlertTriangle } from 'lucide-react';

interface DeleteConfirmModalProps {
  itemType: string;
  name:     string;
  open:     boolean;
  deleting: boolean;
  onConfirm: () => void;
  onCancel:  () => void;
}

export function DeleteConfirmModal({
  itemType, name, open, deleting, onConfirm, onCancel,
}: DeleteConfirmModalProps) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);

  const modal = (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            key="del-backdrop"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
            onClick={onCancel}
          />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              key="del-modal"
              initial={{ opacity: 0, scale: 0.96, y: 8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 8 }}
              transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
              className="w-full max-w-sm overflow-hidden rounded-2xl bg-card shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="h-1 w-full bg-linear-to-r from-rose-500 to-red-500" />
              <div className="p-6">
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-rose-500/10">
                  <AlertTriangle className="h-6 w-6 text-rose-500" />
                </div>
                <h3 className="text-[15px] font-bold text-foreground">
                  Delete {itemType}
                </h3>
                <p className="mt-1.5 text-[13px] text-muted-foreground">
                  Are you sure you want to delete{' '}
                  <span className="font-semibold text-foreground">{name}</span>?{' '}
                  This action cannot be undone.
                </p>
                <div className="mt-5 flex gap-3">
                  <button
                    type="button" onClick={onCancel} disabled={deleting}
                    className="flex-1 cursor-pointer rounded-xl border border-border px-4 py-2.5 text-[13px] font-semibold text-muted-foreground transition-colors hover:bg-muted disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="button" onClick={onConfirm} disabled={deleting}
                    className="flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-xl bg-linear-to-r from-rose-500 to-red-600 px-4 py-2.5 text-[13px] font-semibold text-white shadow-md shadow-rose-500/30 transition-all hover:shadow-rose-500/50 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {deleting ? (
                      <>
                        <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                        Deleting…
                      </>
                    ) : (
                      'Delete'
                    )}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );

  if (!mounted) return null;
  return createPortal(modal, document.body);
}
