'use client';

import { useEffect, useState, useSyncExternalStore } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { Send } from 'lucide-react';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { UserAvatar } from '@/components/ui/user-avatar';
import { fetchRequestToUsers } from '@/lib/api/project-surveys';
import type { UserMini } from '@/lib/project-survey/types';
import { fullName } from '@/lib/project-survey/labels';

interface SubmitDialogProps {
  open: boolean;
  docNo: string;
  projectName: string;
  /** Already set on the survey, if any — skips the picker and just confirms. */
  currentRequestTo: UserMini | null;
  /** Sending a rejected request back for review — swaps the wording. */
  resubmit?: boolean;
  loading?: boolean;
  onConfirm: (requestToId?: string) => void;
  onCancel: () => void;
}

const noopSubscribe = () => () => {};

/** Picker state lives here so it resets whenever the dialog re-opens. */
function SubmitDialogContent({
  docNo, projectName, currentRequestTo, resubmit, loading, onConfirm, onCancel,
}: Omit<SubmitDialogProps, 'open'>) {
  const verb = resubmit ? 'ส่งอีกครั้ง' : 'ส่งคำร้อง';
  const [requestToId, setRequestToId] = useState('');
  const [options, setOptions] = useState<UserMini[] | null>(null);

  useEffect(() => {
    if (currentRequestTo) return;
    let cancelled = false;
    fetchRequestToUsers()
      .then((u) => { if (!cancelled) setOptions(u); })
      .catch(() => { if (!cancelled) setOptions([]); });
    return () => { cancelled = true; };
  }, [currentRequestTo]);

  const needsPick = !currentRequestTo;
  const canConfirm = !needsPick || requestToId !== '';

  return (
    <>
      <motion.div
        key="submit-backdrop"
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
        onClick={() => !loading && onCancel()}
      />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <motion.div
          key="submit-modal"
          role="dialog"
          aria-modal="true"
          aria-labelledby="submit-dialog-title"
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
          className="w-full max-w-sm overflow-hidden rounded-2xl bg-card shadow-2xl"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="h-1 w-full bg-linear-to-r from-sky-500 to-blue-600" />
          <div className="px-6 py-5">
            <div className="mb-1 flex items-center gap-2">
              <Send className="h-4 w-4 text-sky-600 dark:text-sky-400" />
              <h2 id="submit-dialog-title" className="text-[14px] font-bold">{verb}</h2>
            </div>
            <p className="text-[13px] text-muted-foreground">
              ส่ง <span className="font-medium text-foreground">{docNo}</span>{' '}
              &ldquo;{projectName}&rdquo; ให้ผู้รับคำร้องหรือไม่? ระบบจะแจ้งเตือนทางอีเมลทันที
              และจะแก้ไข/ลบไม่ได้จนกว่าจะถูกตีกลับ
            </p>

            {needsPick ? (
              <div className="mt-3 space-y-1">
                <label className="text-xs font-medium">
                  ผู้รับคำร้อง <span className="font-normal text-destructive">(บังคับ)</span>
                </label>
                <Select value={requestToId} onValueChange={setRequestToId} disabled={loading || options === null}>
                  <SelectTrigger aria-invalid={requestToId === '' || undefined}>
                    {(() => {
                      const sel = options?.find((u) => u.id === requestToId);
                      return sel ? (
                        <div className="flex min-w-0 items-center gap-2">
                          <UserAvatar
                            avatarUrl={sel.avatarUrl}
                            initial={(sel.firstName?.[0] ?? '?').toUpperCase()}
                            color="bg-violet-500"
                            size="xs"
                          />
                          <span className="truncate">{fullName(sel)}</span>
                        </div>
                      ) : (
                        <SelectValue placeholder={options === null ? 'กำลังโหลด…' : 'เลือกผู้รับคำร้อง'} />
                      );
                    })()}
                  </SelectTrigger>
                  <SelectContent>
                    {options?.map((u) => (
                      <SelectItem key={u.id} value={u.id}>
                        <span className="flex items-center gap-2">
                          <UserAvatar
                            avatarUrl={u.avatarUrl}
                            initial={(u.firstName?.[0] ?? '?').toUpperCase()}
                            color="bg-violet-500"
                            size="xs"
                          />
                          <span>
                            {fullName(u)}
                            {u.email && <span className="ml-1.5 text-xs text-muted-foreground">{u.email}</span>}
                          </span>
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            ) : (
              <div className="mt-3 flex items-center gap-2 rounded-lg bg-muted/40 px-3 py-2 ring-1 ring-border/60">
                <UserAvatar
                  avatarUrl={currentRequestTo.avatarUrl}
                  initial={(currentRequestTo.firstName?.[0] ?? '?').toUpperCase()}
                  color="bg-fuchsia-500"
                  size="sm"
                />
                <div className="min-w-0">
                  <p className="text-[11px] text-muted-foreground">ส่งถึง</p>
                  <p className="truncate text-[13px] font-medium">{fullName(currentRequestTo)}</p>
                </div>
              </div>
            )}
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
              disabled={loading || !canConfirm}
              onClick={() => onConfirm(needsPick ? requestToId : undefined)}
              className="flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-xl bg-sky-600 px-4 py-2.5 text-[13px] font-semibold text-white transition-all hover:bg-sky-600/90 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? (
                <>
                  <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                  กำลังส่ง…
                </>
              ) : (
                <>
                  <Send className="h-3.5 w-3.5" />
                  {verb}
                </>
              )}
            </button>
          </div>
        </motion.div>
      </div>
    </>
  );
}

/** Submit-draft confirm modal — collects requestTo if the draft doesn't have one yet. */
export function SubmitDialog({ open, ...content }: SubmitDialogProps) {
  // false during SSR, true after hydration — portals need a live document.
  const mounted = useSyncExternalStore(noopSubscribe, () => true, () => false);
  if (!mounted) return null;

  return createPortal(
    <AnimatePresence>
      {open && <SubmitDialogContent {...content} />}
    </AnimatePresence>,
    document.body,
  );
}
