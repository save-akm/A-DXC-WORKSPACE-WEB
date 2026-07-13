'use client';

import { Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';
import type { CostCategory, CostInput } from '@/lib/project-survey/types';
import { COST_CATEGORY_LABELS, formatAmount } from '@/lib/project-survey/labels';

const CATEGORIES = Object.keys(COST_CATEGORY_LABELS) as CostCategory[];

/** Editable row model — amount kept as string so the field can be cleared while typing. */
export interface CostDraft {
  category: CostCategory;
  amount: string;
}

export function draftsToCosts(drafts: CostDraft[]): CostInput[] {
  return drafts
    .filter((d) => d.amount.trim() !== '' && Number.isFinite(Number(d.amount)))
    .map((d) => ({ category: d.category, amount: Number(d.amount) }));
}

interface CostEditorProps {
  value: CostDraft[];
  onChange: (next: CostDraft[]) => void;
  disabled?: boolean;
  className?: string;
}

/** Row-based editor for the survey cost breakdown (replace-set semantics). */
export function CostEditor({ value, onChange, disabled, className }: CostEditorProps) {
  const total = value.reduce((sum, d) => sum + (Number(d.amount) || 0), 0);

  const update = (i: number, patch: Partial<CostDraft>) =>
    onChange(value.map((d, idx) => (idx === i ? { ...d, ...patch } : d)));

  return (
    <div className={cn('space-y-2', className)}>
      {value.length === 0 && (
        <p className="rounded-lg border border-dashed border-border px-3 py-4 text-center text-xs text-muted-foreground">
          ยังไม่มีรายการค่าใช้จ่าย
        </p>
      )}

      {value.map((row, i) => (
        <div key={i} className="flex items-center gap-2">
          <Select
            value={row.category}
            onValueChange={(v) => update(i, { category: v as CostCategory })}
            disabled={disabled}
          >
            <SelectTrigger size="sm" className="w-44 shrink-0" aria-label="หมวดค่าใช้จ่าย">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {CATEGORIES.map((c) => (
                <SelectItem key={c} value={c}>{COST_CATEGORY_LABELS[c]}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <div className="relative flex-1">
            <Input
              type="number"
              min={0}
              step="any"
              inputMode="decimal"
              placeholder="0"
              value={row.amount}
              onChange={(e) => update(i, { amount: e.target.value })}
              disabled={disabled}
              aria-label="จำนวนเงิน (บาท)"
              className="h-8 pr-12 text-right font-mono text-xs tabular-nums"
            />
            <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
              บาท
            </span>
          </div>

          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            disabled={disabled}
            onClick={() => onChange(value.filter((_, idx) => idx !== i))}
            aria-label="ลบรายการนี้"
            className="text-muted-foreground hover:text-destructive"
          >
            <Trash2 size={14} />
          </Button>
        </div>
      ))}

      <div className="flex items-center justify-between pt-1">
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={disabled}
          onClick={() => onChange([...value, { category: 'SOFTWARE', amount: '' }])}
        >
          <Plus />
          เพิ่มรายการ
        </Button>
        {value.length > 0 && (
          <p className="text-xs text-muted-foreground">
            รวม{' '}
            <span className="font-mono text-sm font-semibold tabular-nums text-foreground">
              {formatAmount(total)}
            </span>{' '}
            บาท
          </p>
        )}
      </div>
    </div>
  );
}
