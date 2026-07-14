'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { FilePlus2 } from 'lucide-react';
import { toast } from '@/components/ui/toast';
import { PageHeader } from '@/components/management/page-header';
import { createSurvey, submitSurvey, updateSurvey } from '@/lib/api/project-surveys';
import type { CreateSurveyInput } from '@/lib/project-survey/types';
import { relinkPendingImages } from '@/lib/project-survey/pending-images';
import { SurveyForm } from '../_components/survey-form';

export default function NewProjectSurveyPage() {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(input: CreateSurveyInput, pendingImages: Map<string, File>) {
    setSubmitting(true);
    try {
      const wantsSend = !input.asDraft;
      // content-images only accepts DRAFT/REJECT, so the survey is always
      // created as DRAFT first — even for "ส่งคำร้อง" — images are relinked
      // while it's still editable, and only then does it move to SEND.
      const created = await createSurvey({ ...input, asDraft: true });

      let final = created;
      if (pendingImages.size > 0) {
        const { patch, failedCount } = await relinkPendingImages(created.id, pendingImages, {
          request: created.request ?? undefined,
          changePoint: created.changePoint ?? undefined,
          detail: created.detail ?? undefined,
        });
        try {
          final = await updateSurvey(created.id, patch);
        } catch {
          toast.error('บันทึกรูปที่แนบไม่สำเร็จ — เพิ่มใหม่ได้ที่หน้าแก้ไข');
        }
        if (failedCount > 0) {
          toast.error(`แนบรูปไม่สำเร็จ ${failedCount} ไฟล์ — เพิ่มใหม่ได้ที่หน้าแก้ไข`);
        }
      }

      if (wantsSend) {
        try {
          final = await submitSurvey(created.id);
        } catch (err) {
          toast.error(err instanceof Error ? err.message : 'บันทึกร่างสำเร็จ แต่ส่งคำร้องไม่สำเร็จ — ส่งได้ที่หน้ารายละเอียด');
          router.replace(`/project-survey/${created.id}`);
          return;
        }
      }

      toast.success(
        final.status === 'DRAFT'
          ? `บันทึกร่าง ${final.docNo} แล้ว`
          : `ส่งคำร้อง ${final.docNo} แล้ว — ระบบแจ้งผู้รับคำร้องทางอีเมล`,
      );
      router.replace(`/project-survey/${final.id}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'ส่งคำร้องไม่สำเร็จ กรุณาลองใหม่');
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-4 p-4 sm:gap-6 sm:p-6">
      <PageHeader
        title="สร้างคำร้อง Project Survey"
        subtitle="กรอกข้อมูลโครงการ — บันทึกเป็นร่างไว้แก้ทีหลังได้ หรือส่งทันทีก็ได้"
        icon={FilePlus2}
      />
      <SurveyForm onSubmit={handleSubmit} submitting={submitting} />
    </div>
  );
}
