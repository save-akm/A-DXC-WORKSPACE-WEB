'use client';

import { useEffect, useState } from 'react';
import { FileSearch, Loader2, Pencil, Save, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { UserAvatar } from '@/components/ui/user-avatar';
import { toast } from '@/components/ui/toast';
import { fetchRequestToUsers, saveReview } from '@/lib/api/project-surveys';
import type { SurveyDetail, UserMini } from '@/lib/project-survey/types';
import { formatAmount, formatDateTime, fullName } from '@/lib/project-survey/labels';

interface ReviewPanelProps {
  survey: SurveyDetail;
  onChange: (next: SurveyDetail) => void;
  /** A-DXC while REVIEW — enables the inline review form. */
  canEdit: boolean;
}

const UNASSIGNED = '__none__';

function ReviewField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-0.5">
      <dt className="text-[11px] font-medium text-muted-foreground">{label}</dt>
      <dd className="text-[13px]">{children}</dd>
    </div>
  );
}

/** Review result: A-DXC's estimate + recommendation, editable while under review. */
export function ReviewPanel({ survey, onChange, canEdit }: ReviewPanelProps) {
  const review = survey.review;
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  const [estimateCost, setEstimateCost] = useState('');
  const [estimateSchedule, setEstimateSchedule] = useState('');
  const [responsibleId, setResponsibleId] = useState('');
  const [comment, setComment] = useState('');
  const [recommendation, setRecommendation] = useState('');

  // Candidate assignees — no dedicated endpoint yet, so reuse the Super Admin
  // list and always include the currently assigned person.
  const [assignees, setAssignees] = useState<UserMini[]>([]);
  useEffect(() => {
    if (!canEdit) return;
    let cancelled = false;
    fetchRequestToUsers()
      .then((users) => { if (!cancelled) setAssignees(users); })
      .catch(() => { /* list stays empty — current assignee still shown below */ });
    return () => { cancelled = true; };
  }, [canEdit]);

  const assigneeOptions = review?.responsible && !assignees.some((u) => u.id === review.responsible?.id)
    ? [review.responsible, ...assignees]
    : assignees;

  function startEdit() {
    setEstimateCost(review?.estimateCost ?? '');
    setEstimateSchedule(review?.estimateSchedule ?? '');
    setResponsibleId(review?.responsibleId ?? '');
    setComment(review?.comment ?? '');
    setRecommendation(review?.recommendation ?? '');
    setEditing(true);
  }

  async function handleSave() {
    const cost = estimateCost.trim();
    if (cost !== '' && !Number.isFinite(Number(cost))) {
      toast.error('ประมาณการค่าใช้จ่ายต้องเป็นตัวเลข');
      return;
    }
    setSaving(true);
    try {
      const next = await saveReview(survey.id, {
        estimateCost: cost !== '' ? Number(cost) : undefined,
        estimateSchedule: estimateSchedule.trim() || undefined,
        responsibleId: responsibleId || undefined,
        comment: comment.trim() || undefined,
        recommendation: recommendation.trim() || undefined,
      });
      onChange(next);
      setEditing(false);
      toast.success('บันทึกผลการตรวจสอบแล้ว');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'บันทึกผลการตรวจสอบไม่สำเร็จ');
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileSearch size={15} className="text-muted-foreground" />
          ผลการตรวจสอบ
        </CardTitle>
        {review?.reviewer && !editing && (
          <CardDescription>
            โดย {fullName(review.reviewer)} · อัปเดต {formatDateTime(review.updatedAt)}
          </CardDescription>
        )}
        {canEdit && !editing && (
          <CardAction>
            <Button variant="outline" size="sm" onClick={startEdit}>
              <Pencil />
              {review ? 'แก้ไข' : 'บันทึกผล'}
            </Button>
          </CardAction>
        )}
      </CardHeader>
      <CardContent>
        {editing ? (
          <div className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <label htmlFor="rv-estimate-cost" className="text-sm font-medium">ประมาณการค่าใช้จ่าย (บาท)</label>
                <Input
                  id="rv-estimate-cost"
                  type="number"
                  min={0}
                  step="any"
                  inputMode="decimal"
                  placeholder="เช่น 120000"
                  value={estimateCost}
                  onChange={(e) => setEstimateCost(e.target.value)}
                  disabled={saving}
                  className="text-right font-mono tabular-nums"
                />
              </div>
              <div className="space-y-1.5">
                <label htmlFor="rv-estimate-schedule" className="text-sm font-medium">ประมาณการระยะเวลา</label>
                <Input
                  id="rv-estimate-schedule"
                  placeholder="เช่น 3 เดือน"
                  value={estimateSchedule}
                  onChange={(e) => setEstimateSchedule(e.target.value)}
                  disabled={saving}
                  maxLength={200}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium">ผู้รับผิดชอบ</label>
              <Select
                value={responsibleId || UNASSIGNED}
                onValueChange={(v) => setResponsibleId(v === UNASSIGNED ? '' : v)}
                disabled={saving}
              >
                <SelectTrigger aria-label="ผู้รับผิดชอบ">
                  <SelectValue placeholder="เลือกผู้รับผิดชอบ" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={UNASSIGNED}>
                    <span className="text-muted-foreground">ยังไม่ระบุ</span>
                  </SelectItem>
                  {assigneeOptions.map((u) => (
                    <SelectItem key={u.id} value={u.id}>
                      <span className="flex items-center gap-2">
                        <UserAvatar
                          avatarUrl={u.avatarUrl}
                          initial={(u.firstName?.[0] ?? '?').toUpperCase()}
                          color="bg-fuchsia-500"
                          size="xs"
                        />
                        {fullName(u)}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <label htmlFor="rv-comment" className="text-sm font-medium">ความเห็นผู้ตรวจสอบ</label>
              <Textarea
                id="rv-comment"
                rows={3}
                placeholder="ข้อสังเกต คำถาม หรือสิ่งที่ขอเพิ่มเติมจากผู้ขอ…"
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                disabled={saving}
                className="text-[13px]"
              />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="rv-recommendation" className="text-sm font-medium">ข้อเสนอแนะ</label>
              <Textarea
                id="rv-recommendation"
                rows={3}
                placeholder="แนวทางที่แนะนำ เช่น อนุมัติหลังปรับ scope…"
                value={recommendation}
                onChange={(e) => setRecommendation(e.target.value)}
                disabled={saving}
                className="text-[13px]"
              />
            </div>

            <div className="flex justify-end gap-2 border-t border-border/60 pt-3">
              <Button variant="cancel" size="sm" disabled={saving} onClick={() => setEditing(false)}>
                <X />
                ยกเลิก
              </Button>
              <Button variant="save" size="sm" disabled={saving} onClick={handleSave}>
                {saving ? <Loader2 className="animate-spin" /> : <Save />}
                บันทึกผลการตรวจสอบ
              </Button>
            </div>
          </div>
        ) : !review ? (
          <p className="py-3 text-center text-xs text-muted-foreground">
            {canEdit ? 'ยังไม่มีผลการตรวจสอบ — กด "บันทึกผล" เพื่อเริ่มประเมิน' : 'ยังไม่มีผลการตรวจสอบจาก A-DXC'}
          </p>
        ) : (
          <dl className="grid gap-x-6 gap-y-3 sm:grid-cols-2">
            <ReviewField label="ประมาณการค่าใช้จ่าย (บาท)">
              <span className="font-mono font-medium tabular-nums">{formatAmount(review.estimateCost)}</span>
            </ReviewField>
            <ReviewField label="ประมาณการระยะเวลา">
              {review.estimateSchedule || '—'}
            </ReviewField>
            <ReviewField label="ผู้รับผิดชอบ">
              {review.responsible ? (
                <span className="flex items-center gap-1.5">
                  <UserAvatar
                    avatarUrl={review.responsible.avatarUrl}
                    initial={(review.responsible.firstName?.[0] ?? '?').toUpperCase()}
                    color="bg-fuchsia-500"
                    size="xs"
                  />
                  {fullName(review.responsible)}
                </span>
              ) : '—'}
            </ReviewField>
            <ReviewField label="วันที่ตอบกลับ">
              {review.replyDate ? formatDateTime(review.replyDate) : '—'}
            </ReviewField>
            <ReviewField label="ความเห็นผู้ตรวจสอบ">
              <span className="whitespace-pre-wrap break-words">{review.comment || '—'}</span>
            </ReviewField>
            <ReviewField label="ข้อเสนอแนะ">
              <span className="whitespace-pre-wrap break-words">{review.recommendation || '—'}</span>
            </ReviewField>
          </dl>
        )}
      </CardContent>
    </Card>
  );
}
