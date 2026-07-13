'use client';

import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ActiveToggleProps {
  active: boolean;
  disabled?: boolean;
  onToggle: () => void;
  /** แสดงข้อความสถานะข้าง switch */
  showLabel?: boolean;
  title?: string;
}

export function ActiveToggle({
  active,
  disabled = false,
  onToggle,
  showLabel = true,
  title,
}: ActiveToggleProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={active}
      disabled={disabled}
      onClick={onToggle}
      title={title ?? (active ? 'ปิดการใช้งาน' : 'เปิดการใช้งาน')}
      className={cn(
        'inline-flex shrink-0 items-center gap-2 rounded-full border transition-all duration-200',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-card',
        showLabel ? 'px-2 py-1' : 'p-0.5',
        active
          ? 'border-emerald-500/25 bg-emerald-500/8 hover:border-emerald-500/40 hover:bg-emerald-500/12'
          : 'border-border/80 bg-muted/40 hover:border-border hover:bg-muted/60',
        disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer',
      )}
    >
      {showLabel && (
        <span
          className={cn(
            'pl-0.5 text-[10px] font-semibold leading-none tracking-wide',
            active ? 'text-emerald-700 dark:text-emerald-400' : 'text-muted-foreground',
          )}
        >
          {active ? 'เปิดใช้งาน' : 'ปิดใช้งาน'}
        </span>
      )}

      <span
        className={cn(
          'relative h-[18px] w-[32px] shrink-0 rounded-full ring-1 ring-inset transition-colors duration-200',
          active
            ? 'bg-emerald-500 shadow-[inset_0_1px_2px_rgba(0,0,0,0.12)] ring-emerald-600/25'
            : 'bg-muted-foreground/20 shadow-[inset_0_1px_2px_rgba(0,0,0,0.06)] ring-border/60',
        )}
      >
        <span
          className={cn(
            'absolute top-0.5 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-white shadow-sm transition-transform duration-200 ease-out',
            active ? 'translate-x-[14px]' : 'translate-x-0.5',
          )}
        >
          {active && <Check className="h-2 w-2 text-emerald-600" strokeWidth={3} />}
        </span>
      </span>
    </button>
  );
}
