'use client';

import { useState } from 'react';
import { Check, AlertCircle, Lock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { slugifyCode, type RoleFormState } from '../create-role-shared';

const COLOR_OPTIONS = [
  { label: 'Violet', value: '#8b5cf6' },
  { label: 'Fuchsia', value: '#d946ef' },
  { label: 'Sky', value: '#0ea5e9' },
  { label: 'Amber', value: '#f59e0b' },
  { label: 'Emerald', value: '#10b981' },
  { label: 'Rose', value: '#f43f5e' },
  { label: 'Indigo', value: '#6366f1' },
  { label: 'Teal', value: '#14b8a6' },
];

const INPUT_CLASS =
  'w-full rounded-xl border border-border bg-background px-3 py-2.5 text-[13px] text-foreground placeholder:text-muted-foreground/50 outline-none focus:border-indigo-400/60 focus:ring-2 focus:ring-indigo-500/20 transition-colors';

const LABEL_CLASS =
  'mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-muted-foreground';

interface StepProps {
  state: RoleFormState;
  patch: (next: Partial<RoleFormState>) => void;
  errors?: { name?: boolean; code?: boolean };
  /** Edit mode — code is immutable. */
  codeDisabled?: boolean;
  /** System role — name is immutable too. */
  nameDisabled?: boolean;
  /** Show the "Protected role" toggle (create mode only). */
  showSystemToggle?: boolean;
}

export function StepRoleInfo({ state, patch, errors, codeDisabled, nameDisabled, showSystemToggle }: StepProps) {
  // Treat the code as manually edited if it no longer matches the auto-derived form.
  const [codeEdited, setCodeEdited] = useState(
    () => state.roleCode !== '' && state.roleCode !== slugifyCode(state.roleName),
  );

  function handleNameChange(name: string) {
    if (codeEdited) patch({ roleName: name });
    else patch({ roleName: name, roleCode: slugifyCode(name) });
  }

  function handleCodeChange(raw: string) {
    setCodeEdited(true);
    patch({ roleCode: raw.toUpperCase().replace(/[^A-Z0-9_]/g, '') });
  }

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className={LABEL_CLASS}>
            Role Name <span className="text-red-500">*</span>
          </label>
          <input
            autoFocus={!nameDisabled}
            value={state.roleName}
            onChange={(e) => handleNameChange(e.target.value)}
            placeholder="เช่น Manager"
            disabled={nameDisabled}
            className={cn(
              INPUT_CLASS,
              nameDisabled && 'cursor-not-allowed opacity-60',
              errors?.name && 'border-red-500/60 focus:border-red-500/60 focus:ring-red-500/20',
            )}
          />
          {nameDisabled ? (
            <p className="mt-1 text-[10px] text-muted-foreground/70">system role เปลี่ยนชื่อไม่ได้</p>
          ) : errors?.name ? (
            <p className="mt-1 flex items-center gap-1 text-[11px] text-red-500">
              <AlertCircle size={11} /> ชื่อนี้ถูกใช้แล้ว
            </p>
          ) : null}
        </div>

        <div>
          <label className={LABEL_CLASS}>
            Code <span className="text-red-500">*</span>
          </label>
          <input
            value={state.roleCode}
            onChange={(e) => handleCodeChange(e.target.value)}
            placeholder="เช่น MANAGER"
            disabled={codeDisabled}
            className={cn(
              INPUT_CLASS,
              'font-mono tracking-wide',
              codeDisabled && 'cursor-not-allowed opacity-60',
              errors?.code && 'border-red-500/60 focus:border-red-500/60 focus:ring-red-500/20',
            )}
          />
          {codeDisabled ? (
            <p className="mt-1 text-[10px] text-muted-foreground/70">เปลี่ยน code ไม่ได้</p>
          ) : errors?.code ? (
            <p className="mt-1 flex items-center gap-1 text-[11px] text-red-500">
              <AlertCircle size={11} /> code นี้ถูกใช้แล้ว
            </p>
          ) : (
            <p className="mt-1 text-[10px] text-muted-foreground/70">สร้างอัตโนมัติจากชื่อ — แก้ได้</p>
          )}
        </div>
      </div>

      <div>
        <label className={LABEL_CLASS}>Description</label>
        <textarea
          rows={3}
          value={state.roleDesc}
          onChange={(e) => patch({ roleDesc: e.target.value })}
          placeholder="อธิบายว่า role นี้ทำอะไรได้บ้าง…"
          className={cn(INPUT_CLASS, 'resize-none')}
        />
      </div>

      <div>
        <label className={LABEL_CLASS}>Color</label>
        <div className="flex flex-wrap gap-2">
          {COLOR_OPTIONS.map((c) => (
            <button
              key={c.value}
              type="button"
              onClick={() => patch({ color: c.value })}
              title={`${c.label} · ${c.value}`}
              style={{ backgroundColor: c.value }}
              className="relative flex size-7 cursor-pointer items-center justify-center rounded-full transition-transform hover:scale-110"
            >
              {state.color === c.value && <Check size={12} className="text-white" strokeWidth={3} />}
            </button>
          ))}
        </div>
      </div>

      {showSystemToggle && (
        <button
          type="button"
          onClick={() => patch({ isSystem: !state.isSystem })}
          className={cn(
            'flex w-full items-center justify-between gap-3 rounded-xl border px-3.5 py-3 text-left transition-colors',
            state.isSystem ? 'border-rose-500/40 bg-rose-500/5' : 'border-border bg-background hover:bg-muted/40',
          )}
        >
          <div className="flex items-start gap-2.5">
            <span
              className={cn(
                'mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-lg',
                state.isSystem ? 'bg-rose-500/15 text-rose-500' : 'bg-muted text-muted-foreground',
              )}
            >
              <Lock size={14} />
            </span>
            <div>
              <p className="text-[12px] font-semibold text-foreground">Protected role</p>
              <p className="mt-0.5 text-[10px] text-muted-foreground">
                ทำเครื่องหมายเป็น system role — เปลี่ยนชื่อและลบไม่ได้หลังสร้าง
              </p>
            </div>
          </div>
          <span
            role="switch"
            aria-checked={state.isSystem}
            className={cn(
              'relative h-[18px] w-8 shrink-0 rounded-full ring-1 ring-inset transition-colors duration-200',
              state.isSystem
                ? 'bg-rose-500 shadow-[inset_0_1px_2px_rgba(0,0,0,0.12)] ring-rose-600/25'
                : 'bg-muted-foreground/20 shadow-[inset_0_1px_2px_rgba(0,0,0,0.06)] ring-border/60',
            )}
          >
            <span
              className={cn(
                'absolute top-0.5 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-white shadow-sm transition-transform duration-200 ease-out',
                state.isSystem ? 'translate-x-[14px]' : 'translate-x-0.5',
              )}
            >
              {state.isSystem && <Check className="h-2 w-2 text-rose-600" strokeWidth={3} />}
            </span>
          </span>
        </button>
      )}
    </div>
  );
}
