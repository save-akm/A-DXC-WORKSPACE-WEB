'use client';

import { useMemo } from 'react';
import { ShieldCheck, LayoutGrid, KeyRound, Lock } from 'lucide-react';
import { useMenuStore } from '@/lib/stores/menu-store';
import {
  flattenMenus,
  groupMenus,
  ROLE_ACTIONS,
  ACTION_LABELS,
  type RoleFormState,
} from '../create-role-shared';

interface StepProps {
  state: RoleFormState;
}

export function StepReview({ state }: StepProps) {
  const menus = useMenuStore((s) => s.menus);

  const selectedMenus = useMemo(() => {
    const flat = flattenMenus(menus);
    return flat.filter((m) => state.permissions[m.id]);
  }, [menus, state.permissions]);

  const groups = useMemo(() => groupMenus(selectedMenus), [selectedMenus]);

  const totalPerms = useMemo(
    () =>
      selectedMenus.reduce(
        (sum, m) => sum + ROLE_ACTIONS.filter((a) => state.permissions[m.id][a]).length,
        0,
      ),
    [selectedMenus, state.permissions],
  );

  return (
    <div className="space-y-4">
      {/* Role info */}
      <div className="rounded-xl border border-border/60 bg-muted/30 p-4">
        <div className="flex items-center gap-3">
          <span
            style={{ backgroundColor: state.color }}
            className="flex size-9 shrink-0 items-center justify-center rounded-xl text-white"
          >
            <ShieldCheck size={16} />
          </span>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <p className="truncate text-[14px] font-bold text-foreground">
                {state.roleName || <span className="text-muted-foreground/60">— ยังไม่ตั้งชื่อ —</span>}
              </p>
              <span className="rounded bg-muted px-1.5 py-0.5 font-mono text-[10px] font-medium text-muted-foreground">
                {state.roleCode}
              </span>
              {state.isSystem && (
                <span className="inline-flex items-center gap-0.5 rounded-full bg-rose-100 px-1.5 py-0.5 text-[10px] font-medium text-rose-600 dark:bg-rose-500/20 dark:text-rose-400">
                  <Lock size={8} />
                  Protected
                </span>
              )}
            </div>
            <p className="line-clamp-2 text-[12px] text-muted-foreground">
              {state.roleDesc || 'ไม่มีคำอธิบาย'}
            </p>
          </div>
        </div>
      </div>

      {/* Counters */}
      <div className="grid grid-cols-2 gap-3">
        <div className="flex items-center gap-3 rounded-xl border border-border/60 bg-card px-4 py-3">
          <span className="flex size-8 items-center justify-center rounded-lg bg-indigo-500/10 text-indigo-500">
            <LayoutGrid size={15} />
          </span>
          <div>
            <p className="text-[18px] font-bold leading-none text-foreground">{selectedMenus.length}</p>
            <p className="mt-1 text-[10px] uppercase tracking-wider text-muted-foreground">Menus</p>
          </div>
        </div>
        <div className="flex items-center gap-3 rounded-xl border border-border/60 bg-card px-4 py-3">
          <span className="flex size-8 items-center justify-center rounded-lg bg-violet-500/10 text-violet-500">
            <KeyRound size={15} />
          </span>
          <div>
            <p className="text-[18px] font-bold leading-none text-foreground">{totalPerms}</p>
            <p className="mt-1 text-[10px] uppercase tracking-wider text-muted-foreground">Permissions</p>
          </div>
        </div>
      </div>

      {/* Selected menus + their actions */}
      <div>
        <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
          Access Summary
        </p>
        {selectedMenus.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border px-4 py-8 text-center text-[12px] text-muted-foreground">
            ยังไม่ได้เลือกเมนู
          </div>
        ) : (
          <div className="max-h-[220px] space-y-2.5 overflow-y-auto pr-1">
            {Array.from(groups.entries()).map(([group, rows]) => (
              <div key={group} className="rounded-xl border border-border/60 bg-card p-3">
                <p className="mb-2 text-[9px] font-bold uppercase tracking-widest text-muted-foreground/70">
                  {group}
                </p>
                <div className="space-y-2">
                  {rows.map((m) => {
                    const granted = ROLE_ACTIONS.filter((a) => state.permissions[m.id][a]);
                    const Icon = m.icon;
                    return (
                      <div key={m.id} className="flex items-center gap-2">
                        <Icon size={13} className="shrink-0 text-muted-foreground" />
                        <span className="w-36 shrink-0 truncate text-[12px] font-medium text-foreground">
                          {m.name}
                        </span>
                        <div className="flex flex-wrap gap-1">
                          {granted.length === 0 ? (
                            <span className="text-[10px] italic text-muted-foreground/50">no access</span>
                          ) : (
                            granted.map((a) => (
                              <span
                                key={a}
                                className="rounded-md bg-indigo-500/10 px-1.5 py-0.5 text-[9px] font-medium text-indigo-600 dark:text-indigo-400"
                              >
                                {ACTION_LABELS[a]}
                              </span>
                            ))
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
