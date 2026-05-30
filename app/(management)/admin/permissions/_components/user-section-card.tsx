'use client';

import type React from 'react';
import { UserAvatar } from '@/components/ui/user-avatar';
import { PermissionCheckbox } from './permission-checkbox';
import type { CheckboxState } from './permission-checkbox';
import type {
  UserMenuPermission,
  PermissionAction,
  DirtyKey,
  DirtyEntry,
} from '../types';
import { USER_ACTIONS, ACTION_LABELS } from '../types';

function makeKey(userId: string, menuId: string, action: PermissionAction): DirtyKey {
  return `user:${userId}:menu:${menuId}:action:${action}`;
}

function getCheckboxState(
  original: boolean,
  key: DirtyKey,
  dirty: Map<DirtyKey, DirtyEntry>,
): CheckboxState {
  const entry = dirty.get(key);
  if (!entry) return original ? 'checked' : 'unchecked';
  return entry.current ? 'dirty-added' : 'dirty-removed';
}

function deriveAvatarColor(seed: string): string {
  const COLORS = [
    'bg-indigo-600', 'bg-violet-600', 'bg-sky-600', 'bg-teal-600',
    'bg-emerald-600', 'bg-pink-600', 'bg-rose-600', 'bg-amber-600',
    'bg-cyan-600', 'bg-fuchsia-600',
  ];
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
  }
  return COLORS[hash % COLORS.length];
}

const ROLE_BADGE: Record<string, string> = {
  'Super Admin': 'bg-indigo-100 text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-400',
  System:        'bg-indigo-100 text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-400',
  Admin:         'bg-violet-100 text-violet-700 dark:bg-violet-500/20 dark:text-violet-400',
  Supervisor:    'bg-teal-100   text-teal-700   dark:bg-teal-500/20   dark:text-teal-400',
  Viewer:        'bg-slate-100  text-slate-600  dark:bg-slate-500/20  dark:text-slate-400',
};

interface UserSectionCardProps {
  menuId: string;
  items: UserMenuPermission[];
  total: number;
  dirty: Map<DirtyKey, DirtyEntry>;
  onToggle: (key: DirtyKey, original: boolean, newValue: boolean) => void;
  onLoadMore: () => void;
}

export function UserSectionCard({
  menuId,
  items,
  total,
  dirty,
  onToggle,
  onLoadMore,
}: UserSectionCardProps) {
  const hasDirty = items.some((item) =>
    USER_ACTIONS.some((action) => dirty.has(makeKey(item.userId, menuId, action))),
  );

  return (
    <div>
      <table className="w-full border-collapse">
        <thead>
          <tr className="bg-muted/20">
            <th className="py-2.5 pl-5 pr-3 text-left text-[10px] font-semibold uppercase tracking-widest text-muted-foreground w-56">
              Name
            </th>
            <th className="py-2.5 px-3 text-left text-[10px] font-semibold uppercase tracking-widest text-muted-foreground w-32">
              Role
            </th>
            {USER_ACTIONS.map((action) => (
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
          {items.map((item) => (
            <tr
              key={item.userId}
              className="border-t border-border/50 transition-colors hover:bg-muted/30"
            >
              <td className="py-3 pl-5 pr-3">
                <div className="flex items-center gap-2.5">
                  <UserAvatar
                    initial={item.userInitials}
                    color={deriveAvatarColor(item.userId)}
                    avatarUrl={item.avatarUrl}
                    size="sm"
                  />
                  <span className="truncate max-w-40 text-[12px] font-semibold text-foreground">
                    {item.userName}
                  </span>
                </div>
              </td>
              <td className="py-3 px-3">
                <span
                  className={`rounded-lg px-2 py-0.5 text-[10px] font-semibold ${
                    ROLE_BADGE[item.roleName] ?? 'bg-slate-100 text-slate-600 dark:bg-slate-500/20 dark:text-slate-400'
                  }`}
                >
                  {item.roleName}
                </span>
              </td>
              {USER_ACTIONS.map((action) => {
                const key = makeKey(item.userId, menuId, action);
                const original = item.actions[action];
                const entry = dirty.get(key);
                const current = entry ? entry.current : original;
                const cbState = getCheckboxState(original, key, dirty);
                return (
                  <td key={action} className="py-3 px-3 text-center">
                    <div className="flex justify-center">
                      <PermissionCheckbox
                        state={cbState}
                        onToggle={() => onToggle(key, original, !current)}
                      />
                    </div>
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>

      <div className="flex items-center justify-between border-t border-border/50 px-5 py-3">
        <div className="text-[10px] text-muted-foreground/70">
          {hasDirty && (
            <span aria-hidden="true">🟢 = เพิ่มใหม่ &nbsp; 🔴 = ลบออก &nbsp; (ยังไม่ได้ save) &nbsp;·&nbsp; </span>
          )}
          แสดง {items.length} จาก {total} users
        </div>
        {items.length < total && (
          <button
            type="button"
            onClick={onLoadMore}
            className="text-[11px] font-medium text-indigo-600 hover:text-indigo-500 dark:text-indigo-400 dark:hover:text-indigo-300 transition-colors cursor-pointer"
          >
            โหลดเพิ่ม →
          </button>
        )}
      </div>
    </div>
  );
}
