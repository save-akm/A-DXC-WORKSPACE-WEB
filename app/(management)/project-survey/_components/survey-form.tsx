'use client';

import {
  useEffect, useMemo, useRef, useState,
} from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Loader2, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { UserAvatar } from '@/components/ui/user-avatar';
import { toast } from '@/components/ui/toast';
import { cn } from '@/lib/utils';
import { fetchOrgBranches, fetchOrgDepartments } from '@/lib/api/organization';
import {
  fetchBudgetTypes, fetchKiYears, fetchRequestToUsers, uploadContentImage,
} from '@/lib/api/project-surveys';
import type {
  CreateSurveyInput, RefItem, SurveyDetail, TypeSystem, UserMini,
} from '@/lib/project-survey/types';
import { USER_PROCESSES } from '@/lib/project-survey/types';
import { TYPE_SYSTEM_LABELS, fullName, toDateInputValue } from '@/lib/project-survey/labels';
import { assertContentImageSize, revokeAllPending } from '@/lib/project-survey/pending-images';
import { CostEditor, draftsToCosts, type CostDraft } from './cost-editor';
import { ScheduleEditor, draftsToSchedules, type ScheduleDraft } from './schedule-editor';
import { MdField } from './md-field';

const EASE = [0.4, 0, 0.2, 1] as const;
const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 14 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.3, delay, ease: EASE },
});

interface Option { id: string; name: string; code?: string }

interface SurveyFormProps {
  /** Present in edit mode — preloads values and enables inline image upload. */
  initial?: SurveyDetail;
  /**
   * Create mode: `pendingImages` holds images inserted before the survey
   * exists (blob URL → File) — the caller must create the survey, then relink
   * them via `relinkPendingImages` before persisting the markdown fields.
   */
  onSubmit: (input: CreateSurveyInput, pendingImages: Map<string, File>) => Promise<void>;
  submitting: boolean;
}

/**
 * Shared create/edit form. Create sends immediately (status SEND per spec),
 * so the primary button reads "ส่งคำร้อง" rather than "บันทึก".
 */
export function SurveyForm({ initial, onSubmit, submitting }: SurveyFormProps) {
  const router = useRouter();
  const isEdit = !!initial;

  // ── Master data ─────────────────────────────────────────────────────────────
  const [branches, setBranches] = useState<Option[]>([]);
  const [departments, setDepartments] = useState<Option[]>([]);
  const [requestToUsers, setRequestToUsers] = useState<UserMini[]>([]);
  const [kiOptions, setKiOptions] = useState<Option[]>([]);
  const [budgetOptions, setBudgetOptions] = useState<Option[]>([]);
  const [loadingMaster, setLoadingMaster] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const [orgBranches, orgDepartments, superAdmins, kiYears, budgetTypes] = await Promise.all([
        fetchOrgBranches(),
        fetchOrgDepartments(),
        fetchRequestToUsers().catch(() => [] as UserMini[]),
        fetchKiYears().catch(() => []),
        fetchBudgetTypes().catch(() => []),
      ]);
      if (cancelled) return;

      const ki = new Map<string, Option>(
        kiYears.map((k) => [k.id, { id: k.id, name: k.name }]),
      );
      const budget = new Map<string, Option>(
        budgetTypes.map((b) => [b.id, { id: b.id, name: b.name, code: b.code }]),
      );
      // Edit mode: make sure current relations are selectable even if absent from master data.
      if (initial) {
        ki.set(initial.kiYear.id, { id: initial.kiYear.id, name: initial.kiYear.name });
        budget.set(initial.budgetType.id, { id: initial.budgetType.id, name: initial.budgetType.name });
        const addRef = (list: Option[], ref: RefItem): Option[] =>
          list.some((o) => o.id === ref.id) ? list : [...list, { id: ref.id, name: ref.name, code: ref.code }];
        setBranches(addRef(orgBranches, initial.branch));
        setDepartments(addRef(orgDepartments, initial.department));
      } else {
        setBranches(orgBranches);
        setDepartments(orgDepartments);
      }
      setKiOptions([...ki.values()].sort((a, b) => a.name.localeCompare(b.name)));
      setBudgetOptions([...budget.values()].sort((a, b) => a.name.localeCompare(b.name)));
      setRequestToUsers(superAdmins);
      setLoadingMaster(false);
    })();
    return () => { cancelled = true; };
  }, [initial]);

  // ── Form state ──────────────────────────────────────────────────────────────
  const [projectName, setProjectName] = useState(initial?.projectName ?? '');
  const [branchId, setBranchId] = useState(initial?.branchId ?? '');
  const [departmentId, setDepartmentId] = useState(initial?.departmentId ?? '');
  const [kiId, setKiId] = useState(initial?.kiId ?? '');
  const [budgetTypeId, setBudgetTypeId] = useState(initial?.budgetTypeId ?? '');
  const [typeSystem, setTypeSystem] = useState<TypeSystem>(initial?.typeSystem ?? 'NON_AS400');
  const [requestToId, setRequestToId] = useState(initial?.requestToId ?? '');
  const [request, setRequest] = useState(initial?.request ?? '');
  const [changePoint, setChangePoint] = useState(initial?.changePoint ?? '');
  const [detail, setDetail] = useState(initial?.detail ?? '');
  const [costs, setCosts] = useState<CostDraft[]>(
    initial?.costs.map((c) => ({ category: c.category, amount: c.amount })) ?? [],
  );
  const [schedules, setSchedules] = useState<ScheduleDraft[]>(
    initial?.schedules
      .filter((s) => s.source === 'USER')
      .map((s) => ({
        job: s.job,
        process: s.process,
        planType: s.planType,
        planStart: toDateInputValue(s.planStart),
        planEnd: toDateInputValue(s.planEnd),
        estimateCost: s.estimateCost ?? '',
        remark: s.remark ?? '',
      })) ?? [],
  );
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Create mode only: images staged locally (blob URL → File) before the
  // survey exists. Revoked as each is relinked on submit, or on unmount if
  // the user cancels/navigates away first.
  const pendingImagesRef = useRef<Map<string, File>>(new Map());
  useEffect(() => {
    if (initial) return;
    const pending = pendingImagesRef.current;
    return () => revokeAllPending(pending);
  }, [initial]);

  async function stageLocalImage(file: File): Promise<{ url: string }> {
    assertContentImageSize(file);
    const url = URL.createObjectURL(file);
    pendingImagesRef.current.set(url, file);
    return { url };
  }

  const selectedRequestTo = useMemo(
    () => requestToUsers.find((u) => u.id === requestToId),
    [requestToUsers, requestToId],
  );

  // ── Submit ──────────────────────────────────────────────────────────────────
  function validate(): boolean {
    const next: Record<string, string> = {};
    if (!projectName.trim()) next.projectName = 'กรุณากรอกชื่อโครงการ';
    if (!branchId) next.branchId = 'กรุณาเลือกสาขา';
    if (!departmentId) next.departmentId = 'กรุณาเลือกแผนก';
    if (!kiId) next.kiId = 'กรุณาเลือกปี KI';
    if (!budgetTypeId) next.budgetTypeId = 'กรุณาเลือกประเภทงบประมาณ';
    if (!requestToId) next.requestToId = 'กรุณาเลือกผู้รับคำร้อง';
    if (schedules.some((s) => s.planStart && s.planEnd && s.planEnd < s.planStart)) {
      next.schedules = 'แผนงานบางรายการมีวันสิ้นสุดก่อนวันเริ่ม';
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) {
      toast.error('กรุณากรอกข้อมูลให้ครบถ้วน');
      return;
    }
    await onSubmit({
      projectName: projectName.trim(),
      branchId,
      departmentId,
      kiId,
      typeSystem,
      budgetTypeId,
      requestToId,
      request: request.trim() || undefined,
      changePoint: changePoint.trim() || undefined,
      detail: detail.trim() || undefined,
      costs: draftsToCosts(costs),
      schedules: draftsToSchedules(schedules),
    }, pendingImagesRef.current);
  }

  const fieldError = (key: string) =>
    errors[key] ? <p className="text-xs text-destructive">{errors[key]}</p> : null;

  const selectDisabled = loadingMaster || submitting;

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4 pb-20 sm:gap-5">
      {/* ── ข้อมูลโครงการ ── */}
      <motion.div {...fadeUp(0.05)}>
        <Card>
          <CardHeader>
            <CardTitle>ข้อมูลโครงการ</CardTitle>
            <CardDescription>ข้อมูลหลักของคำร้องสำรวจโครงการ</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <label htmlFor="projectName" className="text-sm font-medium">
                ชื่อโครงการ <span className="text-destructive">*</span>
              </label>
              <Input
                id="projectName"
                value={projectName}
                onChange={(e) => setProjectName(e.target.value)}
                placeholder="เช่น ระบบจองห้องประชุม"
                disabled={submitting}
                aria-invalid={!!errors.projectName || undefined}
                maxLength={200}
              />
              {fieldError('projectName')}
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <label className="text-sm font-medium">สาขา <span className="text-destructive">*</span></label>
                <Select value={branchId} onValueChange={setBranchId} disabled={selectDisabled}>
                  <SelectTrigger aria-invalid={!!errors.branchId || undefined}>
                    <SelectValue placeholder={loadingMaster ? 'กำลังโหลด…' : 'เลือกสาขา'} />
                  </SelectTrigger>
                  <SelectContent>
                    {branches.map((b) => <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>)}
                  </SelectContent>
                </Select>
                {fieldError('branchId')}
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium">แผนก <span className="text-destructive">*</span></label>
                <Select value={departmentId} onValueChange={setDepartmentId} disabled={selectDisabled}>
                  <SelectTrigger aria-invalid={!!errors.departmentId || undefined}>
                    <SelectValue placeholder={loadingMaster ? 'กำลังโหลด…' : 'เลือกแผนก'} />
                  </SelectTrigger>
                  <SelectContent>
                    {departments.map((d) => <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>)}
                  </SelectContent>
                </Select>
                {fieldError('departmentId')}
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium">ปี KI <span className="text-destructive">*</span></label>
                <Select value={kiId} onValueChange={setKiId} disabled={selectDisabled || kiOptions.length === 0}>
                  <SelectTrigger aria-invalid={!!errors.kiId || undefined}>
                    <SelectValue placeholder={kiOptions.length === 0 && !loadingMaster ? 'ไม่มีข้อมูลปี KI' : 'เลือกปี KI'} />
                  </SelectTrigger>
                  <SelectContent>
                    {kiOptions.map((k) => <SelectItem key={k.id} value={k.id}>{k.name}</SelectItem>)}
                  </SelectContent>
                </Select>
                {fieldError('kiId')}
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium">ประเภทงบประมาณ <span className="text-destructive">*</span></label>
                <Select value={budgetTypeId} onValueChange={setBudgetTypeId} disabled={selectDisabled || budgetOptions.length === 0}>
                  <SelectTrigger aria-invalid={!!errors.budgetTypeId || undefined}>
                    <SelectValue placeholder={budgetOptions.length === 0 && !loadingMaster ? 'ไม่มีข้อมูลงบประมาณ' : 'เลือกประเภทงบ'} />
                  </SelectTrigger>
                  <SelectContent>
                    {budgetOptions.map((b) => <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>)}
                  </SelectContent>
                </Select>
                {fieldError('budgetTypeId')}
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <label className="text-sm font-medium">ประเภทระบบ <span className="text-destructive">*</span></label>
                <div className="flex items-center gap-0.5 rounded-lg border border-border/60 bg-card/40 p-0.5">
                  {(Object.keys(TYPE_SYSTEM_LABELS) as TypeSystem[]).map((t) => (
                    <button
                      key={t}
                      type="button"
                      disabled={submitting}
                      onClick={() => setTypeSystem(t)}
                      className={cn(
                        'relative z-10 flex-1 cursor-pointer whitespace-nowrap rounded-md px-2.5 py-1.5 text-xs font-semibold transition-colors',
                        typeSystem === t ? 'text-brand' : 'text-muted-foreground hover:text-foreground',
                      )}
                    >
                      {typeSystem === t && (
                        <motion.span
                          layoutId="survey-type-system"
                          className="absolute inset-0 -z-10 rounded-md bg-brand-muted ring-1 ring-brand/30"
                          transition={{ type: 'spring', stiffness: 380, damping: 32 }}
                        />
                      )}
                      {TYPE_SYSTEM_LABELS[t]}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium">ผู้รับคำร้อง <span className="text-destructive">*</span></label>
                <Select value={requestToId} onValueChange={setRequestToId} disabled={selectDisabled}>
                  <SelectTrigger aria-invalid={!!errors.requestToId || undefined}>
                    {selectedRequestTo ? (
                      <span className="flex items-center gap-2">
                        <UserAvatar
                          avatarUrl={selectedRequestTo.avatarUrl}
                          initial={(selectedRequestTo.firstName?.[0] ?? '?').toUpperCase()}
                          color="bg-violet-500"
                          size="xs"
                        />
                        {fullName(selectedRequestTo)}
                      </span>
                    ) : (
                      <SelectValue placeholder={loadingMaster ? 'กำลังโหลด…' : 'เลือกผู้รับคำร้อง'} />
                    )}
                  </SelectTrigger>
                  <SelectContent>
                    {requestToUsers.map((u) => (
                      <SelectItem key={u.id} value={u.id}>
                        <span className="flex items-center gap-2">
                          <UserAvatar
                            avatarUrl={u.avatarUrl}
                            initial={(u.firstName?.[0] ?? '?').toUpperCase()}
                            color="bg-violet-500"
                            size="xs"
                          />
                          <span>{fullName(u)}</span>
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {fieldError('requestToId')}
                {isEdit && (
                  <p className="text-xs text-muted-foreground">เปลี่ยนผู้รับคำร้องแล้วระบบจะส่งอีเมลแจ้งคนใหม่</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* ── รายละเอียดคำร้อง (Markdown) ── */}
      <motion.div {...fadeUp(0.1)}>
        <Card>
          <CardHeader>
            <CardTitle>รายละเอียดคำร้อง</CardTitle>
            <CardDescription>
              รองรับ Markdown — แทรกรูปภาพประกอบได้ (ไฟล์ไม่เกิน 25 MB)
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <MdField
              id="request"
              label="ความต้องการ / ปัญหาปัจจุบัน"
              value={request}
              onChange={setRequest}
              placeholder="อธิบายปัญหาปัจจุบันและสิ่งที่ต้องการ…"
              disabled={submitting}
              onUploadImage={initial ? (f) => uploadContentImage(initial.id, f) : stageLocalImage}
            />
            <MdField
              id="changePoint"
              label="จุดที่เปลี่ยนแปลง"
              value={changePoint}
              onChange={setChangePoint}
              placeholder="สิ่งที่จะเปลี่ยนไปจากระบบ/ขั้นตอนเดิม…"
              disabled={submitting}
              onUploadImage={initial ? (f) => uploadContentImage(initial.id, f) : stageLocalImage}
            />
            <MdField
              id="detail"
              label="รายละเอียดเพิ่มเติม / ผลที่คาดหวัง"
              value={detail}
              onChange={setDetail}
              placeholder="ประโยชน์ที่คาดว่าจะได้รับ ขอบเขต หรือเงื่อนไขอื่น ๆ…"
              disabled={submitting}
              onUploadImage={initial ? (f) => uploadContentImage(initial.id, f) : stageLocalImage}
            />
          </CardContent>
        </Card>
      </motion.div>

      {/* ── งบประมาณ ── */}
      <motion.div {...fadeUp(0.15)}>
        <Card>
          <CardHeader>
            <CardTitle>งบประมาณเบื้องต้น</CardTitle>
            <CardDescription>ประมาณการค่าใช้จ่ายแยกตามหมวด</CardDescription>
          </CardHeader>
          <CardContent>
            <CostEditor value={costs} onChange={setCosts} disabled={submitting} />
          </CardContent>
        </Card>
      </motion.div>

      {/* ── แผนงาน ── */}
      <motion.div {...fadeUp(0.2)}>
        <Card>
          <CardHeader>
            <CardTitle>แผนงานของผู้ขอ</CardTitle>
            <CardDescription>ช่วงเวลาที่คาดหวังในแต่ละงาน (Process: U0, J3, J5)</CardDescription>
          </CardHeader>
          <CardContent>
            <ScheduleEditor
              value={schedules}
              onChange={setSchedules}
              processOptions={USER_PROCESSES}
              disabled={submitting}
            />
            {errors.schedules && <p className="mt-2 text-xs text-destructive">{errors.schedules}</p>}
          </CardContent>
        </Card>
      </motion.div>

      {/* ── Sticky actions ── */}
      <div className="sticky bottom-3 z-10 flex items-center justify-between gap-2 rounded-xl border bg-card/80 p-3 shadow-lg backdrop-blur-sm">
        <p className="hidden text-xs text-muted-foreground sm:block">
          {isEdit
            ? 'แก้ไขได้เฉพาะสถานะ "ส่งแล้ว" — เมื่อเริ่มตรวจสอบจะแก้ไขไม่ได้'
            : 'ส่งแล้วระบบจะแจ้งเตือนผู้รับคำร้องทางอีเมลทันที'}
        </p>
        <div className="flex shrink-0 items-center gap-2">
          <Button type="button" variant="cancel" disabled={submitting} onClick={() => router.back()}>
            ยกเลิก
          </Button>
          <Button type="submit" variant={isEdit ? 'save' : 'create'} disabled={submitting}>
            {submitting ? <Loader2 className="animate-spin" /> : isEdit ? null : <Send />}
            {isEdit ? 'บันทึกการแก้ไข' : 'ส่งคำร้อง'}
          </Button>
        </div>
      </div>
    </form>
  );
}
