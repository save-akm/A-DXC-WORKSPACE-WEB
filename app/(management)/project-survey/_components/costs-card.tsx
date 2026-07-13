'use client';

import { useState } from 'react';
import { Coins, Loader2, Pencil, Save, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardAction, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from '@/components/ui/toast';
import { replaceCosts } from '@/lib/api/project-surveys';
import type { CostRow } from '@/lib/project-survey/types';
import { COST_CATEGORY_LABELS, formatAmount } from '@/lib/project-survey/labels';
import { CostEditor, draftsToCosts, type CostDraft } from './cost-editor';

interface CostsCardProps {
  surveyId: string;
  costs: CostRow[];
  onChange: (next: CostRow[]) => void;
  /** A-DXC while REVIEW — enables the inline replace-set editor. */
  canEdit: boolean;
}

/** Cost breakdown: read-only rows with a total, plus an inline editor for A-DXC. */
export function CostsCard({ surveyId, costs, onChange, canEdit }: CostsCardProps) {
  const [editing, setEditing] = useState(false);
  const [drafts, setDrafts] = useState<CostDraft[]>([]);
  const [saving, setSaving] = useState(false);

  const total = costs.reduce((sum, c) => sum + (Number(c.amount) || 0), 0);

  function startEdit() {
    setDrafts(costs.map((c) => ({ category: c.category, amount: c.amount })));
    setEditing(true);
  }

  async function handleSave() {
    setSaving(true);
    try {
      const next = await replaceCosts(surveyId, draftsToCosts(drafts));
      onChange(next);
      setEditing(false);
      toast.success('บันทึกงบประมาณแล้ว');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'บันทึกงบประมาณไม่สำเร็จ');
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Coins size={15} className="text-muted-foreground" />
          งบประมาณ
        </CardTitle>
        {canEdit && !editing && (
          <CardAction>
            <Button variant="outline" size="sm" onClick={startEdit}>
              <Pencil />
              แก้ไข
            </Button>
          </CardAction>
        )}
      </CardHeader>
      <CardContent>
        {editing ? (
          <div className="space-y-3">
            <CostEditor value={drafts} onChange={setDrafts} disabled={saving} />
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
          </div>
        ) : costs.length === 0 ? (
          <p className="py-3 text-center text-xs text-muted-foreground">ยังไม่มีรายการค่าใช้จ่าย</p>
        ) : (
          <div>
            <ul className="divide-y divide-border/60">
              {costs.map((c) => (
                <li key={c.id} className="flex items-center justify-between gap-3 py-2 first:pt-0">
                  <span className="text-[13px]">{COST_CATEGORY_LABELS[c.category]}</span>
                  <span className="font-mono text-[13px] tabular-nums">{formatAmount(c.amount)}</span>
                </li>
              ))}
            </ul>
            <div className="flex items-center justify-between border-t border-border pt-2.5">
              <span className="text-xs font-medium text-muted-foreground">รวมทั้งหมด (บาท)</span>
              <span className="font-mono text-sm font-semibold tabular-nums">{formatAmount(total)}</span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
