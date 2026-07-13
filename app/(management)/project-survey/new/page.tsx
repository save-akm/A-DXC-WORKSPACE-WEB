'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { FilePlus2 } from 'lucide-react';
import { toast } from '@/components/ui/toast';
import { PageHeader } from '@/components/management/page-header';
import { createSurvey } from '@/lib/api/project-surveys';
import type { CreateSurveyInput } from '@/lib/project-survey/types';
import { SurveyForm } from '../_components/survey-form';

export default function NewProjectSurveyPage() {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(input: CreateSurveyInput) {
    setSubmitting(true);
    try {
      const created = await createSurvey(input);
      toast.success(`ส่งคำร้อง ${created.docNo} แล้ว — ระบบแจ้งผู้รับคำร้องทางอีเมล`);
      router.replace(`/project-survey/${created.id}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'ส่งคำร้องไม่สำเร็จ กรุณาลองใหม่');
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-4 p-4 sm:gap-6 sm:p-6">
      <PageHeader
        title="สร้างคำร้อง Project Survey"
        subtitle="กรอกข้อมูลโครงการ — ส่งแล้วคำร้องจะเข้าสู่สถานะ “ส่งแล้ว” ทันที"
        icon={FilePlus2}
      />
      <SurveyForm onSubmit={handleSubmit} submitting={submitting} />
    </div>
  );
}
