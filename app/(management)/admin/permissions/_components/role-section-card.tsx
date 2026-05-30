'use client';

import type React from 'react';
import { PermissionCheckbox } from './permission-checkbox';
import type { CheckboxState } from './permission-checkbox';
import type {
  RoleMenuPermission,
  PermissionAction,
  DirtyKey,
  DirtyEntry,
} from '../types';
import { ROLE_ACTIONS, ACTION_LABELS } from '../types';

const ACCENT_STYLES: React.CSSProperties[] = [
  { background: 'linear-gradient(to bottom, #6366f1, #7c3aed)' },
  { background: 'linear-gradient(to bottom, #a855f7, #db2777)' },
  { background: 'linear-gradient(to bottom, #ec4899, #f97316)' },
  { background: 'linear-gradient(to bottom, #14b8a6, #06b6d4)' },
  { background: 'linear-gradient(to bottom, #0ea5e9, #3b82f6)' },
  { background: 'linear-gradient(to bottom, #10b981, #14b8a6)' },
];

const ROLE_BADGE_STYLES: Record<string, string> = {
  'Super Admin': 'bg-indigo-100 text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-400',
  Admin:        'bg-violet-100 text-violet-700 dark:bg-violet-500/20 dark:text-violet-400',
  Supervisor:   'bg-teal-100   text-teal-700   dark:bg-teal-500/20   dark:text-teal-400',
  Viewer:       'bg-slate-100  text-slate-600  dark:bg-slate-500/20  dark:text-slate-400',
};

function roleBadgeClass(roleName: string): string {
  return ROLE_BADGE_STYLES[roleName] ?? 'bg-slate-100 text-slate-600 dark:bg-slate-500/20 dark:text-slate-400';
}

function roleShortLabel(roleName: string): string {
  const map: Record<string, string> = {
    'Super Admin': 'SUPER',
    Admin: 'ADMIN',
    Supervisor: 'SUP',
    Viewer: 'VIEW',
  };
  return map[roleName] ?? roleName.slice(0, 4).toUpperCase();
}

function makeKey(roleId: string, menuId: string, action: PermissionAction): DirtyKey {
  return `role:${roleId}:menu:${menuId}:action:${action}`;
}

function getCheckboxState(
  checked: boolean,
  key: DirtyKey,
  dirty: Map<DirtyKey, DirtyEntry>,
): CheckboxState {
  const entry = dirty.get(key);
  if (!entry) return checked ? 'checked' : 'unchecked';
  return entry.current ? 'dirty-added' : 'dirty-removed';
}

interface RoleSectionCardProps {
  rows: RoleMenuPermission[];
  accentIndex: number;
  dirty: Map<DirtyKey, DirtyEntry>;
  onToggle: (key: DirtyKey, original: boolean, newValue: boolean) => void;
}

export function RoleSectionCard({ rows, accentIndex, dirty, onToggle }: RoleSectionCardProps) {
  if (rows.length === 0) return null;

  const menuName = rows[0].menuName;
  const menuId = rows[0].menuId;
  const accentStyle = ACCENT_STYLES[accentIndex % ACCENT_STYLES.length];

  function currentValue(row: RoleMenuPermission, action: PermissionAction): boolean {
    const key = makeKey(row.roleId, menuId, action);
    const entry = dirty.get(key);
    return entry ? entry.current : row.actions[action];
  }

  function handleSelectAll() {
    const allChecked = rows.every((row) =>
      ROLE_ACTIONS.every((action) => currentValue(row, action)),
    );
    const newVal = !allChecked;
    rows.forEach((row) =>
      ROLE_ACTIONS.forEach((action) => {
        if (currentValue(row, action) !== newVal) {
          const key = makeKey(row.roleId, menuId, action);
          onToggle(key, row.actions[action], newVal);
        }
      }),
    );
  }

  const hasDirty = rows.some((row) =>
    ROLE_ACTIONS.some((action) => dirty.has(makeKey(row.roleId, menuId, action))),
  );

  return (
    <div className="overflow-hidden rounded-xl border border-border/60 bg-card shadow-sm">
      {/* Section header */}
      <div className="flex items-center justify-between border-b border-border/60 bg-muted/40 px-5 py-3.5">
        <div className="flex items-center gap-3">
          <div className="h-4.5 w-0.75 shrink-0 rounded-full" style={accentStyle} />
          <span className="text-[13px] font-bold text-foreground">{menuName}</span>
          <span className="text-[10px] text-muted-foreground">
            {rows.length} roles · {ROLE_ACTIONS.length} permissions
          </span>
        </div>
        <button
          type="button"
          onClick={handleSelectAll}
          className="rounded-md border border-indigo-500/30 bg-indigo-500/10 px-2.5 py-1 text-[10px] font-medium text-indigo-600 hover:bg-indigo-500/20 dark:text-indigo-400 transition-colors cursor-pointer"
        >
          Select All
        </button>
      </div>

      {/* Permission table */}
      <table className="w-full border-collapse">
        <thead>
          <tr className="bg-muted/20">
            <th className="py-2.5 pl-5 pr-3 text-left text-[10px] font-semibold uppercase tracking-widest text-muted-foreground w-44">
              Role
            </th>
            {ROLE_ACTIONS.map((action) => (
              <th
                key={action}
                className="py-2.5 px-3 text-center text-[10px] font-semibold uppercase tracking-widest text-muted-foreground"
              >
                {ACTION_LABELS[action]}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr
              key={row.roleId}
              className="border-t border-border/50 transition-colors hover:bg-muted/30"
            >
              <td className="py-3 pl-5 pr-3">
                <span className="text-[12px] font-semibold text-foreground">{row.roleName}</span>
                <span
                  className={`ml-1.5 rounded-lg px-1.5 py-0.5 text-[9px] font-bold ${roleBadgeClass(row.roleName)}`}
                >
                  {roleShortLabel(row.roleName)}
                </span>
              </td>
              {ROLE_ACTIONS.map((action) => {
                const key = makeKey(row.roleId, menuId, action);
                const original = row.actions[action];
                const cbState = getCheckboxState(original, key, dirty);
                return (
                  <td key={action} className="py-3 px-3 text-center">
                    <div className="flex justify-center">
                      <PermissionCheckbox
                        state={cbState}
                        onToggle={() => {
                          const cur = currentValue(row, action);
                          onToggle(key, original, !cur);
                        }}
                      />
                    </div>
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>

      {hasDirty && (
        <div className="border-t border-border/50 px-5 py-2 text-[10px] text-muted-foreground/60" aria-hidden="true">
          🟢 = เพิ่มใหม่ &nbsp; 🔴 = ลบออก &nbsp; (ยังไม่ได้ save)
        </div>
      )}
    </div>
  );
}
