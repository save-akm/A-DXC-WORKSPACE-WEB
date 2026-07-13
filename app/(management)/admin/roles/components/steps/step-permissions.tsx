'use client';

import { useMemo } from 'react';
import { KeyRound, ArrowLeft, ShieldAlert } from 'lucide-react';
import { useMenuStore } from '@/lib/stores/menu-store';
import { cn } from '@/lib/utils';
import { PermissionCheckbox } from '../../../permissions/_components/permission-checkbox';
import {
  flattenMenus,
  groupMenus,
  ROLE_ACTIONS,
  ACTION_LABELS,
  type RoleFormState,
  type PermissionAction,
  type FlatMenu,
} from '../create-role-shared';

interface StepProps {
  state: RoleFormState;
  patch: (next: Partial<RoleFormState>) => void;
}

export function StepPermissions({ state, patch }: StepProps) {
  const menus = useMenuStore((s) => s.menus);

  const selectedMenus = useMemo(() => {
    const flat = flattenMenus(menus);
    return flat.filter((m) => state.permissions[m.id]);
  }, [menus, state.permissions]);

  const groups = useMemo(() => groupMenus(selectedMenus), [selectedMenus]);

  function setAction(menuId: string, action: PermissionAction, value: boolean) {
    patch({
      permissions: {
        ...state.permissions,
        [menuId]: { ...state.permissions[menuId], [action]: value },
      },
    });
  }

  function toggleMenuAll(menuId: string) {
    const cur = state.permissions[menuId];
    const allOn = ROLE_ACTIONS.every((a) => cur[a]);
    const next = { ...cur };
    for (const a of ROLE_ACTIONS) next[a] = !allOn;
    patch({ permissions: { ...state.permissions, [menuId]: next } });
  }

  if (selectedMenus.length === 0) {
    return (
      <div className="flex h-[260px] flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-border text-muted-foreground">
        <ArrowLeft size={22} />
        <span className="text-[12px]">ยังไม่ได้เลือกเมนู — กลับไปขั้น “Menu Access” ก่อน</span>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-start gap-2.5 rounded-xl border border-indigo-500/20 bg-indigo-500/5 px-3.5 py-2.5">
        <KeyRound size={15} className="mt-0.5 shrink-0 text-indigo-500" />
        <p className="text-[12px] leading-relaxed text-muted-foreground">
          ตั้งสิทธิ์การทำงานของแต่ละเมนู — ติ๊กเฉพาะ action ที่ role นี้ทำได้
        </p>
      </div>

      <div className="max-h-[320px] space-y-3 overflow-y-auto pr-1">
        {Array.from(groups.entries()).map(([group, rows]) => (
          <PermissionGroup
            key={group}
            group={group}
            rows={rows}
            perms={state.permissions}
            onSet={setAction}
            onToggleAll={toggleMenuAll}
          />
        ))}
      </div>
    </div>
  );
}

interface GroupProps {
  group: string;
  rows: FlatMenu[];
  perms: RoleFormState['permissions'];
  onSet: (menuId: string, action: PermissionAction, value: boolean) => void;
  onToggleAll: (menuId: string) => void;
}

function PermissionGroup({ group, rows, perms, onSet, onToggleAll }: GroupProps) {
  return (
    <div className="overflow-hidden rounded-xl border border-border/60 bg-card">
      <div className="border-b border-border/60 bg-muted/40 px-4 py-2">
        <span className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">{group}</span>
      </div>
      <table className="w-full table-fixed border-collapse">
        <thead>
          <tr className="bg-muted/20">
            <th className="py-2 pl-4 pr-3 text-left text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
              Menu
            </th>
            {ROLE_ACTIONS.map((action) => (
              <th
                key={action}
                className={cn(
                  'w-20 px-2 py-2 text-center text-[10px] font-semibold uppercase tracking-widest',
                  action === 'highPrivilege'
                    ? 'text-amber-600 dark:text-amber-400'
                    : 'text-muted-foreground',
                )}
              >
                {action === 'highPrivilege' ? (
                  <span className="inline-flex items-center justify-center gap-1">
                    <ShieldAlert size={11} className="shrink-0" />
                    {ACTION_LABELS[action]}
                  </span>
                ) : (
                  ACTION_LABELS[action]
                )}
              </th>
            ))}
            <th className="w-12 pr-3" />
          </tr>
        </thead>
        <tbody>
          {rows.map((m) => {
            const cur = perms[m.id];
            const Icon = m.icon;
            const allOn = ROLE_ACTIONS.every((a) => cur[a]);
            return (
              <tr key={m.id} className="border-t border-border/50 transition-colors hover:bg-muted/30">
                <td className="py-2.5 pl-4 pr-3">
                  <div className="flex items-center gap-2">
                    <Icon size={13} className="shrink-0 text-muted-foreground" />
                    <span className="text-[12px] font-medium text-foreground">{m.name}</span>
                  </div>
                </td>
                {ROLE_ACTIONS.map((action) => (
                  <td key={action} className="px-2 py-2.5 text-center">
                    <div className="flex justify-center">
                      <PermissionCheckbox
                        state={cur[action] ? 'checked' : 'unchecked'}
                        variant={action === 'highPrivilege' ? 'privilege' : 'default'}
                        onToggle={() => onSet(m.id, action, !cur[action])}
                      />
                    </div>
                  </td>
                ))}
                <td className="pr-3 text-right">
                  <button
                    type="button"
                    onClick={() => onToggleAll(m.id)}
                    className="rounded-md border border-border px-1.5 py-0.5 text-[9px] font-medium text-muted-foreground transition-colors hover:bg-muted cursor-pointer"
                  >
                    {allOn ? 'Clear' : 'All'}
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
