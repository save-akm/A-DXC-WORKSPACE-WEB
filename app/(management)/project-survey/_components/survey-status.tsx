'use client';

import { Check, FileEdit, FileSearch, Send, XCircle, type LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { SurveyStatus } from '@/lib/project-survey/types';
import { STATUS_LABELS } from '@/lib/project-survey/labels';

export const STATUS_STYLES: Record<SurveyStatus, { badge: string; dot: string; icon: LucideIcon }> = {
  DRAFT:   { badge: 'bg-muted text-muted-foreground',                       dot: 'bg-muted-foreground/50', icon: FileEdit },
  SEND:    { badge: 'bg-sky-500/10 text-sky-700 dark:text-sky-400',         dot: 'bg-sky-500',     icon: Send },
  REVIEW:  { badge: 'bg-amber-500/10 text-amber-700 dark:text-amber-400',   dot: 'bg-amber-500',   icon: FileSearch },
  APPROVE: { badge: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400', dot: 'bg-emerald-500', icon: Check },
  REJECT:  { badge: 'bg-rose-500/10 text-rose-700 dark:text-rose-400',      dot: 'bg-rose-500',    icon: XCircle },
};

export function SurveyStatusBadge({ status, className }: { status: SurveyStatus; className?: string }) {
  const s = STATUS_STYLES[status];
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium',
        s.badge,
        className,
      )}
    >
      <span className={cn('size-1.5 rounded-full', s.dot)} />
      {STATUS_LABELS[status]}
    </span>
  );
}

const STEPS: { key: SurveyStatus; icon: LucideIcon }[] = [
  { key: 'SEND', icon: Send },
  { key: 'REVIEW', icon: FileSearch },
  { key: 'APPROVE', icon: Check },
];

/**
 * Horizontal SEND → REVIEW → APPROVE stepper for the detail header.
 * Completed + current steps are tinted; upcoming steps stay muted.
 * DRAFT hasn't entered this flow yet and REJECT is a side-branch out of it —
 * both render nothing here; the caller shows a status-specific banner instead.
 */
export function SurveyStepper({ status, className }: { status: SurveyStatus; className?: string }) {
  if (status === 'DRAFT' || status === 'REJECT') return null;

  const currentIdx = STEPS.findIndex((s) => s.key === status);

  return (
    <ol className={cn('flex items-center', className)} aria-label="สถานะคำร้อง">
      {STEPS.map((step, i) => {
        const done = i < currentIdx || status === 'APPROVE';
        const current = i === currentIdx && status !== 'APPROVE';
        const Icon = done ? Check : step.icon;
        return (
          <li key={step.key} className="flex items-center">
            {i > 0 && (
              <span
                aria-hidden
                className={cn(
                  'mx-2 h-px w-6 sm:w-10',
                  i <= currentIdx || status === 'APPROVE' ? 'bg-brand/50' : 'bg-border',
                )}
              />
            )}
            <span
              className={cn(
                'flex items-center gap-1.5',
                done || current ? 'text-foreground' : 'text-muted-foreground/70',
              )}
              aria-current={current ? 'step' : undefined}
            >
              <span
                className={cn(
                  'flex size-6 items-center justify-center rounded-full ring-1 transition-colors',
                  done && 'bg-emerald-500/12 text-emerald-600 ring-emerald-500/30 dark:text-emerald-400',
                  current && 'bg-brand-muted text-brand ring-brand/30',
                  !done && !current && 'bg-muted/60 text-muted-foreground ring-border',
                )}
              >
                <Icon className="size-3.5" />
              </span>
              <span className="hidden text-xs font-medium sm:inline">{STATUS_LABELS[step.key]}</span>
            </span>
          </li>
        );
      })}
    </ol>
  );
}
