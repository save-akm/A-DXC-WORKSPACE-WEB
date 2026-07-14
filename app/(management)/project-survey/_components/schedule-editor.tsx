'use client';

import { Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';
import type { ScheduleInput, ScheduleJob, SchedulePlanType } from '@/lib/project-survey/types';
import { PROCESS_LABELS } from '@/lib/project-survey/labels';

// Shown verbatim as returned by the API — no Thai translation.
const JOBS: ScheduleJob[] = ['REQUIREMENT', 'DEVELOP', 'START_USE'];
const PLAN_TYPES: SchedulePlanType[] = ['ORIGINAL_PLAN', 'REVISE_PLAN', 'FORECAST_PLAN', 'ACTUAL'];

/** Editable row model — numeric/date fields kept as strings for form friendliness. */
export interface ScheduleDraft {
  job: ScheduleJob;
  process: string;
  planType: SchedulePlanType;
  planStart: string; // "YYYY-MM-DD" | ""
  planEnd: string;
  estimateCost: string;
  remark: string;
}

export function emptyScheduleDraft(process: string): ScheduleDraft {
  return {
    job: 'REQUIREMENT',
    process,
    planType: 'ORIGINAL_PLAN',
    planStart: '',
    planEnd: '',
    estimateCost: '',
    remark: '',
  };
}

export function draftsToSchedules(drafts: ScheduleDraft[]): ScheduleInput[] {
  // Coerce to string first — a draft seeded from an API row may hold numeric
  // estimateCost (backend returns Decimal as a number).
  return drafts.map((d) => ({
    job: d.job,
    process: d.process,
    planType: d.planType,
    planStart: d.planStart || null,
    planEnd: d.planEnd || null,
    estimateCost: String(d.estimateCost).trim() !== '' && Number.isFinite(Number(d.estimateCost))
      ? Number(d.estimateCost)
      : null,
    remark: String(d.remark).trim() || null,
  }));
}

interface ScheduleEditorProps {
  value: ScheduleDraft[];
  onChange: (next: ScheduleDraft[]) => void;
  /** Allowed process codes for this editor's actor (USER: U0/J3/J5, A-DXC: J0_J2/J3/J4/J5). */
  processOptions: readonly string[];
  disabled?: boolean;
  className?: string;
}

/** Row-card editor for plan phases (replace-set semantics, per source). */
export function ScheduleEditor({ value, onChange, processOptions, disabled, className }: ScheduleEditorProps) {
  const update = (i: number, patch: Partial<ScheduleDraft>) =>
    onChange(value.map((d, idx) => (idx === i ? { ...d, ...patch } : d)));

  return (
    <div className={cn('space-y-2.5', className)}>
      {value.length === 0 && (
        <p className="rounded-lg border border-dashed border-border px-3 py-4 text-center text-xs text-muted-foreground">
          ยังไม่มีแผนงาน
        </p>
      )}

      {value.map((row, i) => {
        const rangeInvalid = !!row.planStart && !!row.planEnd && row.planEnd < row.planStart;
        return (
          <div key={i} className="rounded-lg bg-muted/40 p-3 ring-1 ring-border/60">
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-[1fr_6.5rem_1fr_auto]">
              <div className="space-y-1">
                <label className="text-[11px] font-medium text-muted-foreground">งาน</label>
                <Select value={row.job} onValueChange={(v) => update(i, { job: v as ScheduleJob })} disabled={disabled}>
                  <SelectTrigger size="sm" aria-label="งาน"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {JOBS.map((j) => <SelectItem key={j} value={j}>{j}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-medium text-muted-foreground">Process</label>
                <Select value={row.process} onValueChange={(v) => update(i, { process: v })} disabled={disabled}>
                  <SelectTrigger size="sm" aria-label="Process"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {processOptions.map((p) => (
                      <SelectItem key={p} value={p}>{PROCESS_LABELS[p] ?? p}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-medium text-muted-foreground">ประเภทแผน</label>
                <Select value={row.planType} onValueChange={(v) => update(i, { planType: v as SchedulePlanType })} disabled={disabled}>
                  <SelectTrigger size="sm" aria-label="ประเภทแผน"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {PLAN_TYPES.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-end justify-end">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  disabled={disabled}
                  onClick={() => onChange(value.filter((_, idx) => idx !== i))}
                  aria-label="ลบแผนงานนี้"
                  className="text-muted-foreground hover:text-destructive"
                >
                  <Trash2 size={14} />
                </Button>
              </div>
            </div>

            <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-[1fr_1fr_8rem_1.5fr]">
              <div className="space-y-1">
                <label className="text-[11px] font-medium text-muted-foreground">เริ่ม</label>
                <Input
                  type="date"
                  value={row.planStart}
                  onChange={(e) => update(i, { planStart: e.target.value })}
                  disabled={disabled}
                  aria-label="วันที่เริ่ม"
                  className="h-8 text-xs"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[11px] font-medium text-muted-foreground">สิ้นสุด</label>
                <Input
                  type="date"
                  value={row.planEnd}
                  min={row.planStart || undefined}
                  onChange={(e) => update(i, { planEnd: e.target.value })}
                  disabled={disabled}
                  aria-invalid={rangeInvalid || undefined}
                  aria-label="วันที่สิ้นสุด"
                  className="h-8 text-xs"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[11px] font-medium text-muted-foreground">ประมาณการ (บาท)</label>
                <Input
                  type="number"
                  min={0}
                  step="any"
                  inputMode="decimal"
                  placeholder="—"
                  value={row.estimateCost}
                  onChange={(e) => update(i, { estimateCost: e.target.value })}
                  disabled={disabled}
                  aria-label="ประมาณการค่าใช้จ่าย (บาท)"
                  className="h-8 text-right font-mono text-xs tabular-nums"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[11px] font-medium text-muted-foreground">หมายเหตุ</label>
                <Input
                  value={row.remark}
                  onChange={(e) => update(i, { remark: e.target.value })}
                  disabled={disabled}
                  placeholder="—"
                  aria-label="หมายเหตุ"
                  className="h-8 text-xs"
                />
              </div>
            </div>

            {rangeInvalid && (
              <p className="mt-1.5 text-[11px] text-destructive">วันสิ้นสุดต้องไม่ก่อนวันเริ่ม</p>
            )}
          </div>
        );
      })}

      <Button
        type="button"
        variant="outline"
        size="sm"
        disabled={disabled}
        onClick={() => onChange([...value, emptyScheduleDraft(processOptions[0])])}
      >
        <Plus />
        เพิ่มแผนงาน
      </Button>
    </div>
  );
}
