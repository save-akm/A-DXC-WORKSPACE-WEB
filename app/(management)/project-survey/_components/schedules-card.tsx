'use client';

import { useState } from 'react';
import { CalendarRange, Loader2, Pencil, Save, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardAction, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { toast } from '@/components/ui/toast';
import { cn } from '@/lib/utils';
import { replaceSchedules } from '@/lib/api/project-surveys';
import type { ScheduleRow, ScheduleSource } from '@/lib/project-survey/types';
import { ADXC_PROCESSES } from '@/lib/project-survey/types';
import {
  PROCESS_LABELS, formatAmount, formatDate, toDateInputValue,
} from '@/lib/project-survey/labels';
import { ScheduleEditor, draftsToSchedules, type ScheduleDraft } from './schedule-editor';

interface SchedulesCardProps {
  surveyId: string;
  schedules: ScheduleRow[];
  onChange: (next: ScheduleRow[]) => void;
  /** A-DXC while REVIEW — enables the inline editor for the A_DXC set only. */
  canEdit: boolean;
}

const SOURCE_META: Record<ScheduleSource, { label: string; badge: string }> = {
  USER: { label: 'แผนของผู้ขอ', badge: 'bg-muted text-muted-foreground' },
  A_DXC: { label: 'แผนของ A-DXC', badge: 'bg-fuchsia-500/10 text-fuchsia-700 dark:text-fuchsia-400' },
};

function ScheduleTable({ rows }: { rows: ScheduleRow[] }) {
  return (
    <div className="overflow-x-auto rounded-lg ring-1 ring-border/60">
      <Table>
        <TableHeader>
          <TableRow className="border-b bg-muted/40 hover:bg-muted/40">
            <TableHead className="pl-3 text-xs">งาน</TableHead>
            <TableHead className="text-xs">Process</TableHead>
            <TableHead className="text-xs">ประเภทแผน</TableHead>
            <TableHead className="text-xs">ช่วงเวลา</TableHead>
            <TableHead className="text-right text-xs">ประมาณการ (บาท)</TableHead>
            <TableHead className="pr-3 text-xs">หมายเหตุ</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((s) => (
            <TableRow key={s.id}>
              <TableCell className="pl-3 text-[13px]">{s.job}</TableCell>
              <TableCell className="font-mono text-xs">{PROCESS_LABELS[s.process] ?? s.process}</TableCell>
              <TableCell className="text-xs">{s.planType}</TableCell>
              <TableCell className="whitespace-nowrap text-xs">
                {s.planStart || s.planEnd
                  ? `${formatDate(s.planStart)} – ${formatDate(s.planEnd)}`
                  : '—'}
              </TableCell>
              <TableCell className="text-right font-mono text-xs tabular-nums">
                {formatAmount(s.estimateCost)}
              </TableCell>
              <TableCell className="max-w-40 truncate pr-3 text-xs text-muted-foreground" title={s.remark ?? undefined}>
                {s.remark || '—'}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

/**
 * Plan phases grouped by source. USER rows are the requester's plan and stay
 * read-only here; the A_DXC set is replace-editable while under review.
 */
export function SchedulesCard({ surveyId, schedules, onChange, canEdit }: SchedulesCardProps) {
  const [editing, setEditing] = useState(false);
  const [drafts, setDrafts] = useState<ScheduleDraft[]>([]);
  const [saving, setSaving] = useState(false);

  const userPlans = schedules.filter((s) => s.source === 'USER');
  const adminPlans = schedules.filter((s) => s.source === 'A_DXC');

  function startEdit() {
    setDrafts(adminPlans.map((s) => ({
      job: s.job,
      process: s.process,
      planType: s.planType,
      planStart: toDateInputValue(s.planStart),
      planEnd: toDateInputValue(s.planEnd),
      estimateCost: s.estimateCost ?? '',
      remark: s.remark ?? '',
    })));
    setEditing(true);
  }

  async function handleSave() {
    if (drafts.some((d) => d.planStart && d.planEnd && d.planEnd < d.planStart)) {
      toast.error('แผนงานบางรายการมีวันสิ้นสุดก่อนวันเริ่ม');
      return;
    }
    setSaving(true);
    try {
      // The endpoint replaces only source=A_DXC and returns every row (USER + A_DXC).
      const next = await replaceSchedules(surveyId, draftsToSchedules(drafts));
      onChange(next);
      setEditing(false);
      toast.success('บันทึกแผนงานแล้ว');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'บันทึกแผนงานไม่สำเร็จ');
    } finally {
      setSaving(false);
    }
  }

  const group = (source: ScheduleSource, rows: ScheduleRow[]) => (
    <section className="space-y-2">
      <h3 className="flex items-center gap-2 text-xs font-medium">
        <span className={cn('rounded-full px-2 py-0.5 text-[11px] font-medium', SOURCE_META[source].badge)}>
          {SOURCE_META[source].label}
        </span>
        <span className="text-muted-foreground">{rows.length} รายการ</span>
      </h3>
      {rows.length === 0 ? (
        <p className="rounded-lg border border-dashed border-border px-3 py-3 text-center text-xs text-muted-foreground">
          ยังไม่มีแผนงาน
        </p>
      ) : (
        <ScheduleTable rows={rows} />
      )}
    </section>
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CalendarRange size={15} className="text-muted-foreground" />
          แผนงาน
        </CardTitle>
        {canEdit && !editing && (
          <CardAction>
            <Button variant="outline" size="sm" onClick={startEdit}>
              <Pencil />
              แก้ไขแผน A-DXC
            </Button>
          </CardAction>
        )}
      </CardHeader>
      <CardContent className="space-y-5">
        {group('USER', userPlans)}

        {editing ? (
          <section className="space-y-3">
            <h3 className="flex items-center gap-2 text-xs font-medium">
              <span className={cn('rounded-full px-2 py-0.5 text-[11px] font-medium', SOURCE_META.A_DXC.badge)}>
                {SOURCE_META.A_DXC.label}
              </span>
              <span className="text-muted-foreground">บันทึกแล้วจะแทนที่แผน A-DXC ทั้งชุด — แผนของผู้ขอไม่ถูกแตะ</span>
            </h3>
            <ScheduleEditor
              value={drafts}
              onChange={setDrafts}
              processOptions={ADXC_PROCESSES}
              disabled={saving}
            />
            <div className="flex justify-end gap-2 border-t border-border/60 pt-3">
              <Button variant="cancel" size="sm" disabled={saving} onClick={() => setEditing(false)}>
                <X />
                ยกเลิก
              </Button>
              <Button variant="save" size="sm" disabled={saving} onClick={handleSave}>
                {saving ? <Loader2 className="animate-spin" /> : <Save />}
                บันทึก
              </Button>
            </div>
          </section>
        ) : (
          group('A_DXC', adminPlans)
        )}
      </CardContent>
    </Card>
  );
}
