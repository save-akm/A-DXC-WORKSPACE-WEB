'use client';

import { use, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, FilePen, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/toast';
import { PageHeader } from '@/components/management/page-header';
import { useAuthStore } from '@/lib/store';
import { useMenuPermission } from '@/lib/hooks/use-menu-permission';
import { fetchSurvey, updateSurvey } from '@/lib/api/project-surveys';
import type { CreateSurveyInput, SurveyDetail } from '@/lib/project-survey/types';
import { SurveyForm } from '../../_components/survey-form';

export default function EditProjectSurveyPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const meId = useAuthStore((s) => s.user?.id ?? '');
  const { canUpdate } = useMenuPermission('project_survey');

  const [survey, setSurvey] = useState<SurveyDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetchSurvey(id)
      .then((s) => { if (!cancelled) setSurvey(s); })
      .catch(() => { if (!cancelled) setNotFound(true); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [id]);

  async function handleSubmit(input: CreateSurveyInput) {
    setSubmitting(true);
    try {
      const updated = await updateSurvey(id, input);
      toast.success(`บันทึกคำร้อง ${updated.docNo} แล้ว`);
      router.replace(`/project-survey/${id}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'บันทึกไม่สำเร็จ กรุณาลองใหม่');
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="mx-auto flex w-full max-w-4xl flex-col gap-4 p-4 sm:gap-6 sm:p-6">
        <div className="h-8 w-64 animate-pulse rounded bg-muted" />
        <div className="h-72 animate-pulse rounded-xl bg-muted/60" />
        <div className="h-72 animate-pulse rounded-xl bg-muted/60" />
      </div>
    );
  }

  if (notFound || !survey) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-24 text-center">
        <p className="text-sm font-medium">ไม่พบคำร้องนี้ หรือคุณไม่มีสิทธิ์เข้าถึง</p>
        <Button variant="outline" size="sm" onClick={() => router.push('/project-survey')}>
          <ArrowLeft />กลับไปหน้ารายการ
        </Button>
      </div>
    );
  }

  const isOwner = survey.requesterId === meId || survey.createdById === meId;
  const isOwnerEditable = survey.status === 'DRAFT' || survey.status === 'REJECT';
  const editable = isOwnerEditable && (isOwner || canUpdate);

  if (!editable) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-24 text-center">
        <div className="flex size-12 items-center justify-center rounded-xl bg-muted">
          <Lock size={20} className="text-muted-foreground" />
        </div>
        <div>
          <p className="text-sm font-medium">แก้ไขไม่ได้</p>
          <p className="max-w-sm text-xs text-muted-foreground">
            {!isOwnerEditable
              ? 'คำร้องนี้ถูกส่งและอยู่ระหว่างตรวจสอบ/อนุมัติแล้ว จึงแก้ไขไม่ได้ — แก้ไขได้เฉพาะสถานะ “ร่าง” หรือ “ถูกปฏิเสธ” เท่านั้น'
              : 'เฉพาะเจ้าของคำร้องเท่านั้นที่แก้ไขได้'}
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={() => router.push(`/project-survey/${id}`)}>
          <ArrowLeft />กลับไปหน้ารายละเอียด
        </Button>
      </div>
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-4 p-4 sm:gap-6 sm:p-6">
      <PageHeader
        title={`แก้ไขคำร้อง ${survey.docNo}`}
        subtitle="แก้ไขได้เฉพาะสถานะ “ร่าง” หรือ “ถูกปฏิเสธ” เท่านั้น — บันทึกแล้วชุดงบประมาณและแผนงานของผู้ขอจะถูกแทนที่"
        icon={FilePen}
        actions={
          <Button variant="outline" size="sm" onClick={() => router.push(`/project-survey/${id}`)}>
            <ArrowLeft />กลับ
          </Button>
        }
      />
      <SurveyForm initial={survey} onSubmit={handleSubmit} submitting={submitting} />
    </div>
  );
}
