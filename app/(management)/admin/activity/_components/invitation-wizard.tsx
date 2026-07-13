'use client';

import { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'framer-motion';
import {
  X,
  Mail,
  Users,
  Eye,
  FileText,
  CheckCircle2,
  ArrowLeft,
  ArrowRight,
  AlertCircle,
  Loader2,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  previewActivityInvitations,
  sendActivityInvitations,
  pollActivityInvitationBatch,
  mergeSendResultWithBatch,
} from '@/lib/api/activity-invitations';
import {
  isInvitationBatchInProgress,
  type InvitationPreviewResult,
  type InvitationSendResult,
  type InvitationTargets,
} from '@/lib/activity/invitation-types';
import { formatActivityDateRangeDetail } from '@/lib/activity/format';
import {
  InvitationTargetPicker,
  type SelectedInvitationUser,
} from './invitation-target-picker';
import {
  SOURCE_LABELS,
  buildInvitationTargets,
  hasInvitationTargets,
  humanizeInvitationError,
  humanizeSkipReason,
  invitationDisplayName,
} from './invitation-meta';

const INPUT_CLASS =
  'w-full rounded-xl border border-border bg-background px-3 py-2.5 text-[13px] text-foreground placeholder:text-muted-foreground/50 outline-none focus:border-indigo-400/60 focus:ring-2 focus:ring-indigo-500/20 transition-colors';
const LABEL_CLASS =
  'mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-muted-foreground';

const STEPS: { label: string; icon: LucideIcon }[] = [
  { label: 'เลือกเป้าหมาย', icon: Users },
  { label: 'ตรวจสอบ', icon: Eye },
  { label: 'ข้อความ', icon: FileText },
];

interface InvitationWizardProps {
  open: boolean;
  activityId: string;
  activityName: string;
  onClose: () => void;
  onSent?: () => void;
}

export function InvitationWizard({
  open,
  activityId,
  activityName,
  onClose,
  onSent,
}: InvitationWizardProps) {
  const [mounted, setMounted] = useState(false);
  const [step, setStep] = useState(0);
  const [done, setDone] = useState(false);

  const [selectedUsers, setSelectedUsers] = useState<SelectedInvitationUser[]>([]);
  const [selectedPositionIds, setSelectedPositionIds] = useState<string[]>([]);
  const [selectedBranchIds, setSelectedBranchIds] = useState<string[]>([]);

  const [preview, setPreview] = useState<InvitationPreviewResult | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);

  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [excludeHours, setExcludeHours] = useState('24');
  const [showAdvanced, setShowAdvanced] = useState(false);

  const [sendResult, setSendResult] = useState<InvitationSendResult | null>(null);
  const [sending, setSending] = useState(false);
  const [pollingBatch, setPollingBatch] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const targets: InvitationTargets = useMemo(
    () =>
      buildInvitationTargets(
        selectedUsers.map((u) => u.id),
        selectedPositionIds,
        selectedBranchIds,
      ),
    [selectedUsers, selectedPositionIds, selectedBranchIds],
  );

  const defaultSubject = `เชิญเข้าร่วมกิจกรรม: ${activityName}`;

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!open) return;
    setStep(0);
    setDone(false);
    setSelectedUsers([]);
    setSelectedPositionIds([]);
    setSelectedBranchIds([]);
    setPreview(null);
    setSubject('');
    setMessage('');
    setExcludeHours('24');
    setShowAdvanced(false);
    setSendResult(null);
    setSending(false);
    setPollingBatch(false);
    setPreviewLoading(false);
    setError(null);
  }, [open, activityId]);

  function handleClose() {
    if (sending || previewLoading || pollingBatch) return;
    onClose();
  }

  async function loadPreview() {
    if (!hasInvitationTargets(targets)) {
      setError('กรุณาเลือกเป้าหมายอย่างน้อย 1 รายการ');
      return false;
    }
    setPreviewLoading(true);
    setError(null);
    try {
      const data = await previewActivityInvitations(activityId, targets, { limit: 50 });
      setPreview(data);
      if (data.summary.willSend <= 0) {
        setError('ไม่มีผู้รับที่จะส่งเชิญ (อาจถูกข้ามทั้งหมด)');
        return false;
      }
      return true;
    } catch (err) {
      setError(humanizeInvitationError(err));
      return false;
    } finally {
      setPreviewLoading(false);
    }
  }

  async function handleNext() {
    if (step === 0) {
      const ok = await loadPreview();
      if (ok) setStep(1);
      return;
    }
    if (step === 1) {
      if (!preview || preview.summary.willSend <= 0) {
        setError('ไม่มีผู้รับที่จะส่งเชิญ');
        return;
      }
      setError(null);
      setStep(2);
    }
  }

  function handleBack() {
    setError(null);
    if (step > 0) setStep(step - 1);
  }

  async function handleSend() {
    const hours = excludeHours.trim() === '' ? 24 : Number(excludeHours);
    if (!Number.isFinite(hours) || hours < 0 || hours > 168) {
      setError('ชั่วโมงกรองซ้ำต้องอยู่ระหว่าง 0–168');
      return;
    }
    if (message.length > 2000) {
      setError('ข้อความต้องไม่เกิน 2,000 ตัวอักษร');
      return;
    }

    setSending(true);
    setError(null);
    try {
      let result = await sendActivityInvitations(activityId, {
        targets,
        ...(subject.trim() ? { subject: subject.trim() } : {}),
        ...(message.trim() ? { message: message.trim() } : {}),
        excludeRecentlyInvitedHours: hours,
      });

      if (isInvitationBatchInProgress(result.status)) {
        setSendResult(result);
        setDone(true);
        setPollingBatch(true);
        try {
          const polled = await pollActivityInvitationBatch(activityId, result.batchId);
          result = mergeSendResultWithBatch(result, polled.batch);
          setSendResult(result);
        } catch (pollErr) {
          setError(humanizeInvitationError(pollErr));
        } finally {
          setPollingBatch(false);
        }
      } else {
        setSendResult(result);
        setDone(true);
      }

      onSent?.();
    } catch (err) {
      setError(humanizeInvitationError(err));
    } finally {
      setSending(false);
    }
  }

  if (!mounted) return null;

  return createPortal(
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            key="inv-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
            onClick={handleClose}
          />
          <div className="fixed inset-0 z-50 overflow-y-auto p-3 sm:p-4">
            <div className="flex min-h-full items-center justify-center">
              <motion.div
                key="inv-modal"
                initial={{ opacity: 0, scale: 0.95, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 10 }}
                transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
                className="relative flex w-full max-h-[min(860px,calc(100dvh-1.5rem))] max-w-3xl flex-col overflow-hidden rounded-2xl bg-card shadow-2xl lg:max-w-4xl"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="h-1 w-full bg-linear-to-r from-violet-500 via-fuchsia-500 to-purple-600" />

                <div className="flex shrink-0 items-center justify-between border-b border-border/60 px-4 py-3 sm:px-6 sm:py-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-linear-to-br from-violet-500 to-fuchsia-600 shadow-md shadow-violet-500/30">
                      <Mail className="h-4 w-4 text-white" />
                    </div>
                    <div>
                      <h2 className="text-[14px] font-bold text-foreground">
                        {done ? 'ส่งเชิญสำเร็จ' : 'ส่งเชิญทางอีเมล'}
                      </h2>
                      <p className="text-[11px] text-muted-foreground">{activityName}</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={handleClose}
                    disabled={sending || previewLoading || pollingBatch}
                    className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:opacity-50"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>

                {!done && (
                  <div className="flex shrink-0 gap-1 border-b border-border/60 px-4 py-2.5 sm:px-6">
                    {STEPS.map((s, i) => {
                      const Icon = s.icon;
                      const active = i === step;
                      const completed = i < step;
                      return (
                        <div
                          key={s.label}
                          className={cn(
                            'flex flex-1 items-center justify-center gap-1.5 rounded-lg py-1.5 text-[10px] font-semibold sm:text-[11px]',
                            active && 'bg-violet-500/10 text-violet-700 dark:text-violet-400',
                            completed && !active && 'text-emerald-600 dark:text-emerald-400',
                            !active && !completed && 'text-muted-foreground',
                          )}
                        >
                          <Icon className="h-3.5 w-3.5" />
                          <span className="hidden sm:inline">{s.label}</span>
                        </div>
                      );
                    })}
                  </div>
                )}

                <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-4 sm:px-6 sm:py-5">
                  {done && sendResult ? (
                    <SendResultPanel
                      result={sendResult}
                      activityName={activityName}
                      polling={pollingBatch}
                    />
                  ) : (
                    <>
                      {step === 0 && (
                        <InvitationTargetPicker
                          activityId={activityId}
                          active={open}
                          selectedUsers={selectedUsers}
                          selectedPositionIds={selectedPositionIds}
                          selectedBranchIds={selectedBranchIds}
                          onUsersChange={setSelectedUsers}
                          onPositionIdsChange={setSelectedPositionIds}
                          onBranchIdsChange={setSelectedBranchIds}
                        />
                      )}

                      {step === 1 && (
                        <PreviewStep preview={preview} loading={previewLoading} />
                      )}

                      {step === 2 && preview && (
                        <ComposeStep
                          activityName={activityName}
                          preview={preview}
                          subject={subject}
                          message={message}
                          excludeHours={excludeHours}
                          showAdvanced={showAdvanced}
                          defaultSubject={defaultSubject}
                          onSubjectChange={setSubject}
                          onMessageChange={setMessage}
                          onExcludeHoursChange={setExcludeHours}
                          onShowAdvancedChange={setShowAdvanced}
                        />
                      )}
                    </>
                  )}

                  {error && (
                    <div className="mt-4 flex items-start gap-2 rounded-xl border border-destructive/30 bg-destructive/5 px-3 py-2.5 text-[12px] text-destructive">
                      <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                      {error}
                    </div>
                  )}
                </div>

                <div className="flex shrink-0 items-center justify-between gap-3 border-t border-border/60 px-4 py-3 sm:px-6 sm:py-4">
                  {done ? (
                    <button
                      type="button"
                      onClick={handleClose}
                      className="ml-auto cursor-pointer rounded-xl bg-primary px-4 py-2 text-[13px] font-semibold text-primary-foreground"
                    >
                      ปิด
                    </button>
                  ) : (
                    <>
                      <button
                        type="button"
                        onClick={step === 0 ? handleClose : handleBack}
                        disabled={sending || previewLoading || pollingBatch}
                        className="inline-flex cursor-pointer items-center gap-1.5 rounded-xl border border-border px-3 py-2 text-[13px] font-semibold text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:opacity-50"
                      >
                        {step === 0 ? (
                          'ยกเลิก'
                        ) : (
                          <>
                            <ArrowLeft className="h-3.5 w-3.5" />
                            ย้อนกลับ
                          </>
                        )}
                      </button>

                      {step < 2 ? (
                        <button
                          type="button"
                          onClick={handleNext}
                          disabled={previewLoading || (step === 0 && !hasInvitationTargets(targets))}
                          className="inline-flex cursor-pointer items-center gap-1.5 rounded-xl bg-primary px-4 py-2 text-[13px] font-semibold text-primary-foreground disabled:opacity-50"
                        >
                          {previewLoading ? (
                            <>
                              <Loader2 className="h-3.5 w-3.5 animate-spin" />
                              กำลังตรวจสอบ…
                            </>
                          ) : (
                            <>
                              ถัดไป
                              <ArrowRight className="h-3.5 w-3.5" />
                            </>
                          )}
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={handleSend}
                          disabled={sending}
                          className="inline-flex cursor-pointer items-center gap-1.5 rounded-xl bg-primary px-4 py-2 text-[13px] font-semibold text-primary-foreground disabled:opacity-50"
                        >
                          {sending ? (
                            <>
                              <Loader2 className="h-3.5 w-3.5 animate-spin" />
                              กำลังส่ง…
                            </>
                          ) : (
                            <>
                              <Mail className="h-3.5 w-3.5" />
                              ส่งเชิญ
                            </>
                          )}
                        </button>
                      )}
                    </>
                  )}
                </div>
              </motion.div>
            </div>
          </div>
        </>
      )}
    </AnimatePresence>,
    document.body,
  );
}

function PreviewStep({
  preview,
  loading,
}: {
  preview: InvitationPreviewResult | null;
  loading: boolean;
}) {
  if (loading || !preview) {
    return (
      <div className="flex h-48 items-center justify-center gap-2 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" />
        กำลังคำนวณผู้รับ…
      </div>
    );
  }

  const { activity, summary, recipients, skipped } = preview;
  const dateLabel = activity.eventEndAt
    ? formatActivityDateRangeDetail(activity.eventStartAt, activity.eventEndAt)
    : formatActivityDateRangeDetail(activity.eventStartAt, activity.eventStartAt);

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-border/60 bg-muted/20 p-4">
        <p className="text-sm font-bold">{activity.name}</p>
        <p className="mt-1 text-xs text-muted-foreground">{dateLabel}</p>
        {activity.location && (
          <p className="text-xs text-muted-foreground">{activity.location}</p>
        )}
      </div>

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        <SummaryStat label="จะส่ง" value={summary.willSend} highlight />
        <SummaryStat label="ข้าม" value={summary.willSkip} />
        <SummaryStat label="ซ้ำตัดออก" value={summary.overlapExcluded} />
        <SummaryStat label="รวม unique" value={summary.totalUnique} />
      </div>

      <div className="grid grid-cols-3 gap-2 text-center text-[10px]">
        <SourceStat label="รายบุคคล" value={summary.bySource.users} />
        <SourceStat label="ตำแหน่ง" value={summary.bySource.positions} />
        <SourceStat label="สาขา" value={summary.bySource.branches} />
      </div>

      {recipients.length > 0 && (
        <div>
          <p className={LABEL_CLASS}>
            ตัวอย่างผู้รับ ({recipients.length}
            {summary.willSend > recipients.length ? ` จาก ${summary.willSend}` : ''})
          </p>
          <div className="max-h-48 overflow-y-auto rounded-xl border border-border/60 divide-y divide-border/40">
            {recipients.map((r) => (
              <div key={r.userId} className="px-3 py-2.5">
                <p className="text-sm font-medium">{invitationDisplayName(r)}</p>
                <p className="text-xs text-muted-foreground">{r.email}</p>
                <div className="mt-1 flex flex-wrap gap-1">
                  {r.sources.map((s) => (
                    <span
                      key={s}
                      className="rounded-md bg-muted/80 px-1.5 py-0.5 text-[10px] text-muted-foreground"
                    >
                      {SOURCE_LABELS[s]}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {skipped.length > 0 && (
        <div>
          <p className={LABEL_CLASS}>รายการที่ข้าม ({skipped.length})</p>
          <div className="max-h-32 overflow-y-auto rounded-xl border border-border/60 divide-y divide-border/40">
            {skipped.map((s, i) => (
              <div
                key={s.userId ?? s.email ?? `skip-${i}`}
                className="flex items-center justify-between gap-2 px-3 py-2 text-xs"
              >
                <span className="truncate text-muted-foreground">
                  {s.email ?? s.userId ?? '—'}
                </span>
                <span className="shrink-0 text-destructive">{humanizeSkipReason(s.reason)}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function ComposeStep({
  activityName,
  preview,
  subject,
  message,
  excludeHours,
  showAdvanced,
  defaultSubject,
  onSubjectChange,
  onMessageChange,
  onExcludeHoursChange,
  onShowAdvancedChange,
}: {
  activityName: string;
  preview: InvitationPreviewResult;
  subject: string;
  message: string;
  excludeHours: string;
  showAdvanced: boolean;
  defaultSubject: string;
  onSubjectChange: (v: string) => void;
  onMessageChange: (v: string) => void;
  onExcludeHoursChange: (v: string) => void;
  onShowAdvancedChange: (v: boolean) => void;
}) {
  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 px-3 py-2.5 text-xs text-emerald-800 dark:text-emerald-300">
        จะส่งเชิญถึง{' '}
        <span className="font-bold">{preview.summary.willSend}</span> คน
        {preview.summary.willSkip > 0 && (
          <> (ข้าม {preview.summary.willSkip} คน)</>
        )}
      </div>

      <div>
        <label className={LABEL_CLASS}>หัวข้ออีเมล</label>
        <input
          type="text"
          value={subject}
          onChange={(e) => onSubjectChange(e.target.value)}
          placeholder={defaultSubject}
          className={INPUT_CLASS}
        />
        <p className="mt-1 text-[10px] text-muted-foreground">
          ว่างไว้จะใช้: {defaultSubject}
        </p>
      </div>

      <div>
        <label className={LABEL_CLASS}>ข้อความ</label>
        <textarea
          value={message}
          onChange={(e) => onMessageChange(e.target.value)}
          rows={5}
          maxLength={2000}
          placeholder={`ขอเชิญเข้าร่วมกิจกรรม ${activityName} กดลิงก์ด้านล่างเพื่อดูรายละเอียดและลงทะเบียน`}
          className={cn(INPUT_CLASS, 'resize-y min-h-[120px]')}
        />
        <p className="mt-1 text-[10px] text-muted-foreground">
          ว่างไว้จะใช้ template มาตรฐานจากระบบ · {message.length}/2000
        </p>
      </div>

      <div>
        <button
          type="button"
          onClick={() => onShowAdvancedChange(!showAdvanced)}
          className="cursor-pointer text-[11px] font-semibold text-primary hover:underline"
        >
          {showAdvanced ? 'ซ่อนตั้งค่าขั้นสูง' : 'ตั้งค่าขั้นสูง'}
        </button>
        {showAdvanced && (
          <div className="mt-2">
            <label className={LABEL_CLASS}>
              ไม่ส่งซ้ำถ้าเคยเชิญภายใน (ชั่วโมง)
            </label>
            <input
              type="number"
              min={0}
              max={168}
              value={excludeHours}
              onChange={(e) => onExcludeHoursChange(e.target.value)}
              className={cn(INPUT_CLASS, 'max-w-[120px]')}
            />
            <p className="mt-1 text-[10px] text-muted-foreground">
              0 = ไม่กรอง · ค่าเริ่มต้น 24 ชม. · สูงสุด 168 ชม.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

function SendResultPanel({
  result,
  activityName,
  polling = false,
}: {
  result: InvitationSendResult;
  activityName: string;
  polling?: boolean;
}) {
  const { summary, failedRecipients, activityUrl, status } = result;
  const inProgress = polling || isInvitationBatchInProgress(status);

  return (
    <div className="space-y-4 text-center sm:text-left">
      <div className="flex flex-col items-center gap-2 sm:flex-row sm:items-start">
        {inProgress ? (
          <Loader2 className="h-10 w-10 animate-spin text-amber-500" />
        ) : (
          <CheckCircle2 className="h-10 w-10 text-emerald-500" />
        )}
        <div>
          <p className="text-base font-bold">
            {inProgress
              ? `กำลังส่งเชิญกิจกรรม ${activityName}…`
              : `ส่งเชิญกิจกรรม ${activityName} แล้ว`}
          </p>
          {inProgress && (
            <p className="text-xs text-amber-600 dark:text-amber-400">
              ระบบกำลังส่งอีเมลในคิว — อาจใช้เวลาสักครู่
            </p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        <SummaryStat label="ผู้รับ" value={summary.recipientCount} />
        <SummaryStat label="ส่งแล้ว" value={summary.sent} highlight />
        <SummaryStat label="ล้มเหลว" value={summary.failed} />
        <SummaryStat label="ข้าม" value={summary.skipped} />
      </div>

      {activityUrl && (
        <p className="text-xs text-muted-foreground">
          ลิงก์กิจกรรม:{' '}
          <a href={activityUrl} className="font-medium text-primary hover:underline" target="_blank" rel="noreferrer">
            {activityUrl}
          </a>
        </p>
      )}

      {failedRecipients && failedRecipients.length > 0 && (
        <div className="text-left">
          <p className={LABEL_CLASS}>ส่งไม่สำเร็จ ({failedRecipients.length})</p>
          <div className="max-h-36 overflow-y-auto rounded-xl border border-destructive/20 divide-y divide-border/40">
            {failedRecipients.map((f) => (
              <div key={f.userId} className="px-3 py-2 text-xs">
                <p className="font-medium">{f.email}</p>
                <p className="text-destructive">{f.error}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function SummaryStat({
  label,
  value,
  highlight,
}: {
  label: string;
  value: number;
  highlight?: boolean;
}) {
  return (
    <div className="rounded-xl border border-border/60 bg-muted/20 px-3 py-2.5 text-center">
      <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
        {label}
      </p>
      <p
        className={cn(
          'text-lg font-bold tabular-nums',
          highlight && 'text-emerald-600 dark:text-emerald-400',
        )}
      >
        {value}
      </p>
    </div>
  );
}

function SourceStat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg bg-muted/40 py-2">
      <p className="text-muted-foreground">{label}</p>
      <p className="font-bold tabular-nums">{value}</p>
    </div>
  );
}
