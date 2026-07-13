'use client';

import { use, useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  ArrowLeft, BadgeCheck, Building2, CalendarClock, ClipboardList, FileText, Pencil, Trash2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { UserAvatar } from '@/components/ui/user-avatar';
import { toast } from '@/components/ui/toast';
import { ConfirmDialog } from '@/components/management/confirm-dialog';
import { PageHeader } from '@/components/management/page-header';
import { Markdown } from '@/app/(management)/blog/_components/markdown';
import { useAuthStore } from '@/lib/store';
import { useMenuPermission } from '@/lib/hooks/use-menu-permission';
import { approveSurvey, deleteSurvey, fetchSurvey } from '@/lib/api/project-surveys';
import type { SurveyAttachment, SurveyDetail, UserMini } from '@/lib/project-survey/types';
import {
  STATUS_DESCRIPTIONS, TYPE_SYSTEM_LABELS, formatDateTime, fullName,
} from '@/lib/project-survey/labels';
import { SurveyStatusBadge, SurveyStepper } from '../_components/survey-status';
import { ActivityPanel } from '../_components/activity-panel';
import { ApproveDialog } from '../_components/approve-dialog';
import { AttachmentsPanel } from '../_components/attachments-panel';
import { CommentsPanel } from '../_components/comments-panel';
import { CostsCard } from '../_components/costs-card';
import { NotificationsCard } from '../_components/notifications-card';
import { ReviewPanel } from '../_components/review-panel';
import { SchedulesCard } from '../_components/schedules-card';

const EASE = [0.4, 0, 0.2, 1] as const;
const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 14 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.3, delay, ease: EASE },
});

function InfoField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-0.5">
      <dt className="text-[11px] font-medium text-muted-foreground">{label}</dt>
      <dd className="text-[13px]">{children}</dd>
    </div>
  );
}

function PersonField({ label, user, color }: { label: string; user?: UserMini | null; color: string }) {
  return (
    <InfoField label={label}>
      {user ? (
        <span className="flex items-center gap-1.5">
          <UserAvatar
            avatarUrl={user.avatarUrl}
            initial={(user.firstName?.[0] ?? '?').toUpperCase()}
            color={color}
            size="xs"
          />
          <span className="truncate">{fullName(user)}</span>
        </span>
      ) : '—'}
    </InfoField>
  );
}

function MdSection({ title, content }: { title: string; content: string | null }) {
  return (
    <section className="space-y-1.5">
      <h3 className="text-sm font-medium">{title}</h3>
      {content?.trim() ? (
        <div className="rounded-lg bg-muted/30 px-4 py-3 ring-1 ring-border/60">
          <Markdown content={content} />
        </div>
      ) : (
        <p className="rounded-lg border border-dashed border-border px-3 py-3 text-center text-xs text-muted-foreground">
          ยังไม่ระบุ
        </p>
      )}
    </section>
  );
}

export default function ProjectSurveyDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const meId = useAuthStore((s) => s.user?.id ?? '');
  const { canUpdate, canDelete } = useMenuPermission('project_survey');

  const [survey, setSurvey] = useState<SurveyDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  const [approveOpen, setApproveOpen] = useState(false);
  const [approving, setApproving] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // GET /:id auto-starts REVIEW when the viewer is requestTo and status is SEND.
  useEffect(() => {
    let cancelled = false;
    fetchSurvey(id)
      .then((s) => { if (!cancelled) setSurvey(s); })
      .catch(() => { if (!cancelled) setNotFound(true); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [id]);

  const handleAttachments = useCallback((next: SurveyAttachment[]) => {
    setSurvey((prev) => (prev ? { ...prev, attachments: next } : prev));
  }, []);

  async function handleApprove(remark: string) {
    setApproving(true);
    try {
      const next = await approveSurvey(id, remark);
      setSurvey(next);
      setApproveOpen(false);
      toast.success(`อนุมัติคำร้อง ${next.docNo} แล้ว`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'อนุมัติไม่สำเร็จ');
    } finally {
      setApproving(false);
    }
  }

  async function handleDelete() {
    if (!survey) return;
    setDeleting(true);
    try {
      await deleteSurvey(survey.id);
      toast.success(`ลบคำร้อง ${survey.docNo} แล้ว`);
      router.replace('/project-survey');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'ลบคำร้องไม่สำเร็จ');
      setDeleting(false);
    }
  }

  if (loading) {
    return (
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-4 p-4 sm:gap-6 sm:p-6">
        <div className="h-8 w-72 animate-pulse rounded bg-muted" />
        <div className="h-14 animate-pulse rounded-xl bg-muted/60" />
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,21rem)]">
          <div className="space-y-4">
            <div className="h-48 animate-pulse rounded-xl bg-muted/60" />
            <div className="h-64 animate-pulse rounded-xl bg-muted/60" />
            <div className="h-40 animate-pulse rounded-xl bg-muted/60" />
          </div>
          <div className="space-y-4">
            <div className="h-40 animate-pulse rounded-xl bg-muted/60" />
            <div className="h-56 animate-pulse rounded-xl bg-muted/60" />
          </div>
        </div>
      </div>
    );
  }

  if (notFound || !survey) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-24 text-center">
        <div className="flex size-12 items-center justify-center rounded-xl bg-muted">
          <ClipboardList size={20} className="text-muted-foreground" />
        </div>
        <div>
          <p className="text-sm font-medium">ไม่พบคำร้องนี้ หรือคุณไม่มีสิทธิ์เข้าถึง</p>
          <p className="text-xs text-muted-foreground">คำร้องอาจถูกลบไปแล้ว</p>
        </div>
        <Button variant="outline" size="sm" onClick={() => router.push('/project-survey')}>
          <ArrowLeft />กลับไปหน้ารายการ
        </Button>
      </div>
    );
  }

  const isOwner = survey.requesterId === meId || survey.createdById === meId;
  const isRequestTo = survey.requestToId === meId;
  const canEditDoc = survey.status === 'SEND' && isOwner;
  const canDeleteDoc = survey.status === 'SEND' && isOwner && (canUpdate || canDelete);
  const canReview = canUpdate && survey.status === 'REVIEW';
  const canUploadFiles = (isOwner && survey.status === 'SEND') || canReview;
  const canComment = survey.status !== 'APPROVE' && (isOwner || isRequestTo || canUpdate);

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-4 p-4 sm:gap-6 sm:p-6">
      <PageHeader
        title={survey.projectName}
        subtitle={
          <span className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
            <span className="font-mono">{survey.docNo}</span>
            {survey.revision > 0 && <span>· แก้ไขครั้งที่ {survey.revision}</span>}
            <span>· อัปเดตล่าสุด {formatDateTime(survey.updatedAt)}</span>
          </span>
        }
        icon={ClipboardList}
        actions={
          <>
            <Button variant="outline" size="sm" onClick={() => router.push('/project-survey')}>
              <ArrowLeft />
              <span className="hidden sm:inline">กลับ</span>
            </Button>
            {canDeleteDoc && (
              <Button variant="destructive" size="sm" onClick={() => setDeleteOpen(true)}>
                <Trash2 />
                <span className="hidden sm:inline">ลบ</span>
              </Button>
            )}
            {canEditDoc && (
              <Button variant="save" size="sm" onClick={() => router.push(`/project-survey/${survey.id}/edit`)}>
                <Pencil />
                แก้ไข
              </Button>
            )}
            {canReview && (
              <Button variant="save" size="sm" onClick={() => setApproveOpen(true)}>
                <BadgeCheck />
                อนุมัติ
              </Button>
            )}
          </>
        }
      />

      {/* Status banner */}
      <motion.div {...fadeUp(0.05)}>
        <Card size="sm">
          <CardContent className="flex flex-wrap items-center justify-between gap-x-6 gap-y-3">
            <div className="flex items-center gap-2.5">
              <SurveyStatusBadge status={survey.status} />
              <p className="text-xs text-muted-foreground">{STATUS_DESCRIPTIONS[survey.status]}</p>
            </div>
            <SurveyStepper status={survey.status} />
          </CardContent>
        </Card>
      </motion.div>

      <div className="grid items-start gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,21rem)]">
        {/* ── Main column ── */}
        <div className="flex min-w-0 flex-col gap-4">
          <motion.div {...fadeUp(0.1)}>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building2 size={15} className="text-muted-foreground" />
                  ข้อมูลโครงการ
                </CardTitle>
              </CardHeader>
              <CardContent>
                <dl className="grid grid-cols-2 gap-x-6 gap-y-3 sm:grid-cols-3">
                  <InfoField label="สาขา">{survey.branch?.name ?? '—'}</InfoField>
                  <InfoField label="แผนก">{survey.department?.name ?? '—'}</InfoField>
                  <InfoField label="ประเภทระบบ">{TYPE_SYSTEM_LABELS[survey.typeSystem]}</InfoField>
                  <InfoField label="ปี KI">{survey.kiYear?.name ?? '—'}</InfoField>
                  <InfoField label="ประเภทงบประมาณ">{survey.budgetType?.name ?? '—'}</InfoField>
                  <InfoField label="ส่งซ้ำ">{survey.resubmitCount} ครั้ง</InfoField>
                  <PersonField label="ผู้ขอ" user={survey.requester} color="bg-violet-500" />
                  <PersonField label="ผู้รับคำร้อง" user={survey.requestTo} color="bg-fuchsia-500" />
                  <InfoField label="สร้างเมื่อ">
                    <span className="flex items-center gap-1.5">
                      <CalendarClock size={13} className="text-muted-foreground" />
                      {formatDateTime(survey.createdAt)}
                    </span>
                  </InfoField>
                </dl>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div {...fadeUp(0.14)}>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText size={15} className="text-muted-foreground" />
                  รายละเอียดคำร้อง
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-5">
                <MdSection title="ความต้องการ / ปัญหาปัจจุบัน" content={survey.request} />
                <MdSection title="จุดที่เปลี่ยนแปลง" content={survey.changePoint} />
                <MdSection title="รายละเอียดเพิ่มเติม / ผลที่คาดหวัง" content={survey.detail} />
              </CardContent>
            </Card>
          </motion.div>

          <motion.div {...fadeUp(0.18)}>
            <CostsCard
              surveyId={survey.id}
              costs={survey.costs}
              onChange={(next) => setSurvey((prev) => (prev ? { ...prev, costs: next } : prev))}
              canEdit={canReview}
            />
          </motion.div>

          <motion.div {...fadeUp(0.22)}>
            <SchedulesCard
              surveyId={survey.id}
              schedules={survey.schedules}
              onChange={(next) => setSurvey((prev) => (prev ? { ...prev, schedules: next } : prev))}
              canEdit={canReview}
            />
          </motion.div>

          <motion.div {...fadeUp(0.26)}>
            <ReviewPanel survey={survey} onChange={setSurvey} canEdit={canReview} />
          </motion.div>

          <motion.div {...fadeUp(0.3)}>
            <CommentsPanel surveyId={survey.id} canComment={canComment} meId={meId} />
          </motion.div>
        </div>

        {/* ── Sidebar ── */}
        <div className="flex min-w-0 flex-col gap-4">
          <motion.div {...fadeUp(0.14)}>
            <AttachmentsPanel
              surveyId={survey.id}
              attachments={survey.attachments}
              onChange={handleAttachments}
              canUpload={canUploadFiles}
            />
          </motion.div>

          <motion.div {...fadeUp(0.18)}>
            <NotificationsCard surveyId={survey.id} />
          </motion.div>

          <motion.div {...fadeUp(0.22)}>
            <ActivityPanel surveyId={survey.id} showAudit={canUpdate} />
          </motion.div>
        </div>
      </div>

      <ApproveDialog
        open={approveOpen}
        docNo={survey.docNo}
        projectName={survey.projectName}
        loading={approving}
        onConfirm={handleApprove}
        onCancel={() => setApproveOpen(false)}
      />

      <ConfirmDialog
        open={deleteOpen}
        title="ลบคำร้อง"
        message={
          <>ต้องการลบคำร้อง <span className="font-medium text-foreground">{survey.docNo}</span>{' '}
            &ldquo;{survey.projectName}&rdquo; หรือไม่? การลบไม่สามารถย้อนกลับได้</>
        }
        loading={deleting}
        onConfirm={handleDelete}
        onCancel={() => setDeleteOpen(false)}
      />
    </div>
  );
}
