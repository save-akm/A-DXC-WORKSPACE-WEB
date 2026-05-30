# Permissions Page Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build `/admin/permissions` page with Role-based and User-level permission management, dirty tracking, and manual save.

**Architecture:** Client component page with two tabs (Role / User). All dirty state lives in local React state — no Zustand store. API calls go through the existing `apiFetch()` helper from `lib/auth/client.ts` which handles auth + token refresh automatically. Each tab owns its own dirty Map and exposes `onSave` / `onDiscard` callbacks to the shared sticky header.

**Tech Stack:** Next.js (app router), React `useState`/`useCallback`/`useMemo`, Framer Motion v12, Tailwind CSS v4, Lucide React icons, `apiFetch` from `lib/auth/client.ts`, existing `UserAvatar` component.

> **Note:** Project has no unit-test framework configured. Verification steps are manual (browser) unless otherwise noted.

---

## File Map

| File | Action | Purpose |
|---|---|---|
| `app/(management)/admin/permissions/types.ts` | Create | All TypeScript types for this feature |
| `lib/api/permissions.ts` | Create | API fetch functions (roles matrix, users list, PATCH) |
| `app/(management)/admin/permissions/_components/permission-checkbox.tsx` | Create | Checkbox with 4 visual states (clean✓, clean□, dirty+, dirty-) |
| `app/(management)/admin/permissions/_components/dirty-badge.tsx` | Create | Animated amber badge "N รายการที่เปลี่ยน" |
| `app/(management)/admin/permissions/_components/permissions-header.tsx` | Create | Sticky header card: icon + title + badge + save/discard buttons |
| `app/(management)/admin/permissions/_components/role-section-card.tsx` | Create | Single menu section card with permission table for all roles |
| `app/(management)/admin/permissions/_components/role-permissions-tab.tsx` | Create | List of all role section cards, manages dirty Map |
| `app/(management)/admin/permissions/_components/user-section-card.tsx` | Create | User permission table for one selected menu |
| `app/(management)/admin/permissions/_components/user-permissions-tab.tsx` | Create | Menu dropdown + search + user section card, manages dirty Map |
| `app/(management)/admin/permissions/page.tsx` | Create | Main page: tab switcher, AnimatePresence, passes save/discard down |

---

## Task 1: Types

**Files:**
- Create: `app/(management)/admin/permissions/types.ts`

- [ ] **Step 1: Create the types file**

```typescript
// app/(management)/admin/permissions/types.ts

export type PermissionAction = 'view' | 'create' | 'update' | 'delete' | 'export';

export const ROLE_ACTIONS: PermissionAction[] = ['view', 'create', 'update', 'delete', 'export'];
export const USER_ACTIONS: PermissionAction[] = ['view', 'create', 'update', 'delete'];

export const ACTION_LABELS: Record<PermissionAction, string> = {
  view: 'View',
  create: 'Create',
  update: 'Update',
  delete: 'Delete',
  export: 'Export',
};

/** One role's permissions for one menu */
export interface RoleMenuPermission {
  roleId: string;
  roleName: string;
  menuId: string;
  menuName: string;
  actions: Record<PermissionAction, boolean>;
}

/** Full matrix: array of role×menu entries */
export type RolePermissionMatrix = RoleMenuPermission[];

/** One user's permissions for one menu */
export interface UserMenuPermission {
  userId: string;
  userName: string;
  userInitials: string;
  avatarUrl: string | null;
  roleId: string;
  roleName: string;
  menuId: string;
  actions: Record<PermissionAction, boolean>;
}

export interface UserPermissionPage {
  items: UserMenuPermission[];
  total: number;
  page: number;
  pageSize: number;
}

/** A menu item as returned by GET /menus/my (used for the dropdown) */
export interface MenuItem {
  id: string;
  name: string;
  code: string;
}

/**
 * Dirty tracking key for a role permission cell:
 * format "role:<roleId>:menu:<menuId>:action:<action>"
 */
export type DirtyKey = string;

export interface DirtyEntry {
  original: boolean;
  current: boolean;
}

/** What we PATCH to the API for role permissions */
export interface RolePermissionPatch {
  roleId: string;
  menuId: string;
  action: PermissionAction;
  value: boolean;
}

/** What we PATCH to the API for user permissions */
export interface UserPermissionPatch {
  userId: string;
  menuId: string;
  action: PermissionAction;
  value: boolean;
}
```

- [ ] **Step 2: Commit**

```bash
git add app/(management)/admin/permissions/types.ts
git commit -m "feat(permissions): add TypeScript types"
```

---

## Task 2: API layer

**Files:**
- Create: `lib/api/permissions.ts`

- [ ] **Step 1: Create API helpers**

```typescript
// lib/api/permissions.ts
import { apiFetch } from '@/lib/auth/client';
import type {
  RolePermissionMatrix,
  UserPermissionPage,
  MenuItem,
  RolePermissionPatch,
  UserPermissionPatch,
} from '@/app/(management)/admin/permissions/types';

export async function fetchRolePermissions(): Promise<RolePermissionMatrix> {
  return apiFetch<RolePermissionMatrix>('/permissions/roles');
}

export async function patchRolePermissions(
  changes: RolePermissionPatch[],
): Promise<void> {
  await apiFetch<void>('/permissions/roles', {
    method: 'PATCH',
    body: JSON.stringify({ changes }),
    headers: { 'Content-Type': 'application/json' },
  });
}

export async function fetchUserPermissions(
  menuId: string,
  page: number,
  search: string,
): Promise<UserPermissionPage> {
  const params = new URLSearchParams({
    menuId,
    page: String(page),
    pageSize: '20',
    ...(search ? { search } : {}),
  });
  return apiFetch<UserPermissionPage>(`/permissions/users?${params}`);
}

export async function patchUserPermissions(
  changes: UserPermissionPatch[],
): Promise<void> {
  await apiFetch<void>('/permissions/users', {
    method: 'PATCH',
    body: JSON.stringify({ changes }),
    headers: { 'Content-Type': 'application/json' },
  });
}

export async function fetchMenuList(): Promise<MenuItem[]> {
  return apiFetch<MenuItem[]>('/menus/my');
}
```

- [ ] **Step 2: Commit**

```bash
git add lib/api/permissions.ts
git commit -m "feat(permissions): add API layer"
```

---

## Task 3: PermissionCheckbox component

**Files:**
- Create: `app/(management)/admin/permissions/_components/permission-checkbox.tsx`

- [ ] **Step 1: Create the component**

```tsx
// app/(management)/admin/permissions/_components/permission-checkbox.tsx
'use client';

import { motion } from 'framer-motion';

export type CheckboxState = 'checked' | 'unchecked' | 'dirty-added' | 'dirty-removed';

interface PermissionCheckboxProps {
  state: CheckboxState;
  onToggle: () => void;
  disabled?: boolean;
}

const BASE =
  'relative w-[18px] h-[18px] rounded-[5px] flex items-center justify-center cursor-pointer transition-all duration-150 select-none';

const STATE_CLASSES: Record<CheckboxState, string> = {
  checked:
    'bg-gradient-to-br from-indigo-500 to-violet-600 shadow-[0_2px_8px_rgba(99,102,241,0.4)]',
  unchecked: 'bg-transparent border border-slate-600',
  'dirty-added':
    'bg-gradient-to-br from-emerald-500 to-green-600 shadow-[0_2px_8px_rgba(16,185,129,0.4)] outline outline-2 outline-emerald-500/40 outline-offset-1',
  'dirty-removed':
    'bg-transparent border border-red-500/50 outline outline-2 outline-red-500/20 outline-offset-1',
};

export function PermissionCheckbox({ state, onToggle, disabled }: PermissionCheckboxProps) {
  const showCheck = state === 'checked' || state === 'dirty-added';

  return (
    <motion.div
      className={`${BASE} ${STATE_CLASSES[state]} ${disabled ? 'opacity-40 cursor-not-allowed' : ''}`}
      onClick={disabled ? undefined : onToggle}
      whileTap={disabled ? undefined : { scale: 0.82 }}
      animate={{ scale: 1 }}
      transition={{ type: 'spring', stiffness: 400, damping: 20 }}
    >
      {showCheck && (
        <svg width="11" height="8" viewBox="0 0 11 8" fill="none">
          <path
            d="M1 3.5L4 6.5L10 1"
            stroke="white"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      )}
    </motion.div>
  );
}
```

- [ ] **Step 2: Verify visually** — you will see this used in Task 5. Ensure all four states render correctly when you reach that point.

- [ ] **Step 3: Commit**

```bash
git add app/(management)/admin/permissions/_components/permission-checkbox.tsx
git commit -m "feat(permissions): add PermissionCheckbox with 4 visual states"
```

---

## Task 4: DirtyBadge component

**Files:**
- Create: `app/(management)/admin/permissions/_components/dirty-badge.tsx`

- [ ] **Step 1: Create the component**

```tsx
// app/(management)/admin/permissions/_components/dirty-badge.tsx
'use client';

import { AnimatePresence, motion } from 'framer-motion';

interface DirtyBadgeProps {
  count: number;
  onDiscard: () => void;
}

export function DirtyBadge({ count, onDiscard }: DirtyBadgeProps) {
  return (
    <AnimatePresence>
      {count > 0 && (
        <motion.div
          key="dirty-badge"
          initial={{ opacity: 0, x: 16, scale: 0.9 }}
          animate={{ opacity: 1, x: 0, scale: 1 }}
          exit={{ opacity: 0, x: 16, scale: 0.9 }}
          transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
          className="flex items-center gap-2"
        >
          <div className="flex items-center gap-2 rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1.5 text-[11px] text-amber-400">
            <span className="animate-pulse size-1.5 rounded-full bg-amber-400" />
            <span>{count} รายการที่เปลี่ยน</span>
          </div>
          <button
            type="button"
            onClick={onDiscard}
            className="text-[11px] text-slate-500 hover:text-slate-300 transition-colors cursor-pointer"
          >
            ↩ ยกเลิก
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add app/(management)/admin/permissions/_components/dirty-badge.tsx
git commit -m "feat(permissions): add DirtyBadge with AnimatePresence"
```

---

## Task 5: PermissionsHeader component

**Files:**
- Create: `app/(management)/admin/permissions/_components/permissions-header.tsx`

- [ ] **Step 1: Create the component**

```tsx
// app/(management)/admin/permissions/_components/permissions-header.tsx
'use client';

import { LucideIcon } from 'lucide-react';
import { DirtyBadge } from './dirty-badge';

interface PermissionsHeaderProps {
  icon: LucideIcon;
  iconGradient: string;   // e.g. "from-indigo-500 to-violet-600"
  title: string;
  description: string;
  dirtyCount: number;
  saving: boolean;
  onSave: () => void;
  onDiscard: () => void;
}

export function PermissionsHeader({
  icon: Icon,
  iconGradient,
  title,
  description,
  dirtyCount,
  saving,
  onSave,
  onDiscard,
}: PermissionsHeaderProps) {
  const canSave = dirtyCount > 0 && !saving;

  return (
    <div className="sticky top-0 z-10 mb-5">
      <div className="rounded-2xl border border-indigo-500/15 bg-gradient-to-br from-[#1a1f3a] to-[#1e293b] p-5 shadow-xl shadow-black/20 backdrop-blur-sm">
        <div className="flex items-center justify-between gap-4">
          {/* Left: icon + text */}
          <div className="flex items-center gap-4">
            <div
              className={`flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br ${iconGradient} shadow-lg`}
            >
              <Icon className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-[15px] font-bold text-white">{title}</h1>
              <p className="mt-0.5 text-[11px] text-slate-500">{description}</p>
            </div>
          </div>

          {/* Right: badge + save button */}
          <div className="flex items-center gap-2">
            <DirtyBadge count={dirtyCount} onDiscard={onDiscard} />
            <button
              type="button"
              onClick={onSave}
              disabled={!canSave}
              className={`flex items-center gap-2 rounded-xl px-4 py-2 text-[12px] font-semibold transition-all duration-200 cursor-pointer ${
                canSave
                  ? 'bg-gradient-to-r from-emerald-500 to-green-600 text-white shadow-lg shadow-emerald-500/30 hover:shadow-emerald-500/50'
                  : 'cursor-not-allowed bg-slate-800 text-slate-600'
              }`}
            >
              {saving ? (
                <>
                  <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                  กำลังบันทึก…
                </>
              ) : (
                <>💾 Save Changes</>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add app/(management)/admin/permissions/_components/permissions-header.tsx
git commit -m "feat(permissions): add sticky PermissionsHeader"
```

---

## Task 6: RoleSectionCard component

**Files:**
- Create: `app/(management)/admin/permissions/_components/role-section-card.tsx`

- [ ] **Step 1: Create the component**

```tsx
// app/(management)/admin/permissions/_components/role-section-card.tsx
'use client';

import { motion } from 'framer-motion';
import { PermissionCheckbox } from './permission-checkbox';
import type { CheckboxState } from './permission-checkbox';
import type {
  RoleMenuPermission,
  PermissionAction,
  DirtyKey,
  DirtyEntry,
} from '../types';
import { ROLE_ACTIONS, ACTION_LABELS } from '../types';

const ACCENT_GRADIENTS = [
  'from-indigo-500 to-violet-600',
  'from-violet-500 to-pink-600',
  'from-pink-500 to-orange-500',
  'from-teal-500 to-cyan-500',
  'from-sky-500 to-blue-600',
  'from-emerald-500 to-teal-500',
];

const ROLE_BADGE_STYLES: Record<string, string> = {
  'Super Admin': 'bg-indigo-500/20 text-indigo-300',
  Admin: 'bg-violet-500/15 text-violet-300',
  Supervisor: 'bg-teal-500/15 text-teal-300',
  Viewer: 'bg-slate-500/20 text-slate-400',
};

function roleBadgeClass(roleName: string): string {
  return ROLE_BADGE_STYLES[roleName] ?? 'bg-slate-500/20 text-slate-400';
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
  /** All role-permission rows for this menu */
  rows: RoleMenuPermission[];
  accentIndex: number;
  dirty: Map<DirtyKey, DirtyEntry>;
  onToggle: (key: DirtyKey, original: boolean, newValue: boolean) => void;
}

export function RoleSectionCard({ rows, accentIndex, dirty, onToggle }: RoleSectionCardProps) {
  if (rows.length === 0) return null;

  const menuName = rows[0].menuName;
  const menuId = rows[0].menuId;
  const accentClass = ACCENT_GRADIENTS[accentIndex % ACCENT_GRADIENTS.length];

  // Determine current value for a cell (considering dirty state)
  function currentValue(row: RoleMenuPermission, action: PermissionAction): boolean {
    const key = makeKey(row.roleId, menuId, action);
    const entry = dirty.get(key);
    return entry ? entry.current : row.actions[action];
  }

  // Select-all: if every cell is currently true → uncheck all, else check all
  function handleSelectAll() {
    const allChecked = rows.every((row) =>
      ROLE_ACTIONS.every((action) => currentValue(row, action)),
    );
    const newVal = !allChecked;
    rows.forEach((row) =>
      ROLE_ACTIONS.forEach((action) => {
        const key = makeKey(row.roleId, menuId, action);
        const original = row.actions[action];
        if (currentValue(row, action) !== newVal) {
          onToggle(key, original, newVal);
        }
      }),
    );
  }

  return (
    <div className="overflow-hidden rounded-[14px] border border-white/[0.06] bg-[#131929]">
      {/* Section header */}
      <div className="flex items-center justify-between border-b border-white/[0.06] bg-[#1a2236] px-5 py-3.5">
        <div className="flex items-center gap-3">
          <div className={`h-[18px] w-[3px] rounded-full bg-gradient-to-b ${accentClass}`} />
          <span className="text-[13px] font-bold text-white">{menuName}</span>
          <span className="text-[10px] text-slate-500">
            {rows.length} roles · {ROLE_ACTIONS.length} permissions
          </span>
        </div>
        <button
          type="button"
          onClick={handleSelectAll}
          className="rounded-md border border-indigo-500/20 bg-indigo-500/10 px-2.5 py-1 text-[10px] font-medium text-indigo-400 hover:bg-indigo-500/20 transition-colors cursor-pointer"
        >
          Select All
        </button>
      </div>

      {/* Permission table */}
      <table className="w-full border-collapse">
        <thead>
          <tr className="bg-white/[0.02]">
            <th className="py-2.5 pl-5 pr-3 text-left text-[10px] font-semibold uppercase tracking-widest text-slate-500 w-44">
              Role
            </th>
            {ROLE_ACTIONS.map((action) => (
              <th
                key={action}
                className="py-2.5 px-3 text-center text-[10px] font-semibold uppercase tracking-widest text-slate-500"
              >
                {ACTION_LABELS[action]}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr
              key={row.roleId}
              className={`border-t border-white/[0.04] transition-colors hover:bg-white/[0.02] ${
                i === rows.length - 1 ? '' : ''
              }`}
            >
              <td className="py-3 pl-5 pr-3">
                <span className="text-[12px] font-semibold text-slate-200">{row.roleName}</span>
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

      {/* Dirty legend (only show when something in this section is dirty) */}
      {rows.some((row) =>
        ROLE_ACTIONS.some((action) => dirty.has(makeKey(row.roleId, menuId, action))),
      ) && (
        <div className="border-t border-white/[0.04] px-5 py-2 text-[10px] text-slate-600">
          🟢 = เพิ่มใหม่ &nbsp; 🔴 = ลบออก &nbsp; (ยังไม่ได้ save)
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add app/(management)/admin/permissions/_components/role-section-card.tsx
git commit -m "feat(permissions): add RoleSectionCard with select-all and dirty tracking"
```

---

## Task 7: RolePermissionsTab

**Files:**
- Create: `app/(management)/admin/permissions/_components/role-permissions-tab.tsx`

- [ ] **Step 1: Create the component**

```tsx
// app/(management)/admin/permissions/_components/role-permissions-tab.tsx
'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { LayoutGrid } from 'lucide-react';
import { toast } from '@/components/ui/toast';
import { fetchRolePermissions, patchRolePermissions } from '@/lib/api/permissions';
import { PermissionsHeader } from './permissions-header';
import { RoleSectionCard } from './role-section-card';
import type { RoleMenuPermission, DirtyKey, DirtyEntry, RolePermissionPatch } from '../types';

export function RolePermissionsTab() {
  const [matrix, setMatrix] = useState<RoleMenuPermission[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState<Map<DirtyKey, DirtyEntry>>(new Map());

  // Fetch on mount
  useEffect(() => {
    fetchRolePermissions()
      .then(setMatrix)
      .catch(() => toast.error('ไม่สามารถโหลดข้อมูล permissions ได้'))
      .finally(() => setLoading(false));
  }, []);

  // Group rows by menuId
  const sections = useMemo(() => {
    const map = new Map<string, RoleMenuPermission[]>();
    matrix.forEach((row) => {
      if (!map.has(row.menuId)) map.set(row.menuId, []);
      map.get(row.menuId)!.push(row);
    });
    return Array.from(map.values());
  }, [matrix]);

  const dirtyCount = useMemo(() => dirty.size, [dirty]);

  const handleToggle = useCallback(
    (key: DirtyKey, original: boolean, newValue: boolean) => {
      setDirty((prev) => {
        const next = new Map(prev);
        if (newValue === original) {
          next.delete(key); // back to original — no longer dirty
        } else {
          next.set(key, { original, current: newValue });
        }
        return next;
      });
    },
    [],
  );

  const handleDiscard = useCallback(() => {
    setDirty(new Map());
  }, []);

  const handleSave = useCallback(async () => {
    if (dirty.size === 0) return;
    setSaving(true);
    try {
      const changes: RolePermissionPatch[] = Array.from(dirty.entries()).map(([key, entry]) => {
        // key format: "role:<roleId>:menu:<menuId>:action:<action>"
        const parts = key.split(':');
        return {
          roleId: parts[1],
          menuId: parts[3],
          action: parts[5] as RolePermissionPatch['action'],
          value: entry.current,
        };
      });
      await patchRolePermissions(changes);
      // Update matrix with new values so original resets
      setMatrix((prev) =>
        prev.map((row) => {
          const updatedActions = { ...row.actions };
          (Object.keys(updatedActions) as RolePermissionPatch['action'][]).forEach((action) => {
            const key = `role:${row.roleId}:menu:${row.menuId}:action:${action}`;
            const entry = dirty.get(key);
            if (entry) updatedActions[action] = entry.current;
          });
          return { ...row, actions: updatedActions };
        }),
      );
      setDirty(new Map());
      toast.success('บันทึก Role Permissions สำเร็จ');
    } catch {
      toast.error('บันทึกไม่สำเร็จ กรุณาลองใหม่');
    } finally {
      setSaving(false);
    }
  }, [dirty]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24 text-slate-500 text-sm">
        กำลังโหลด…
      </div>
    );
  }

  return (
    <div>
      <PermissionsHeader
        icon={LayoutGrid}
        iconGradient="from-indigo-500 to-violet-600"
        title="Role Permissions Settings"
        description="Manage role-based access and permissions across all menus"
        dirtyCount={dirtyCount}
        saving={saving}
        onSave={handleSave}
        onDiscard={handleDiscard}
      />

      <div className="flex flex-col gap-3.5">
        {sections.map((rows, i) => (
          <motion.div
            key={rows[0].menuId}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: i * 0.05, ease: [0.22, 1, 0.36, 1] }}
          >
            <RoleSectionCard
              rows={rows}
              accentIndex={i}
              dirty={dirty}
              onToggle={handleToggle}
            />
          </motion.div>
        ))}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add app/(management)/admin/permissions/_components/role-permissions-tab.tsx
git commit -m "feat(permissions): add RolePermissionsTab with load/save/discard"
```

---

## Task 8: UserSectionCard component

**Files:**
- Create: `app/(management)/admin/permissions/_components/user-section-card.tsx`

- [ ] **Step 1: Create the component**

```tsx
// app/(management)/admin/permissions/_components/user-section-card.tsx
'use client';

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

const ROLE_BADGE: Record<string, string> = {
  'Super Admin': 'bg-indigo-500/20 text-indigo-300',
  System: 'bg-indigo-500/20 text-indigo-300',
  Admin: 'bg-violet-500/15 text-violet-300',
  Supervisor: 'bg-teal-500/15 text-teal-300',
  Viewer: 'bg-slate-500/20 text-slate-400',
};

interface UserSectionCardProps {
  menuName: string;
  menuId: string;
  items: UserMenuPermission[];
  total: number;
  page: number;
  pageSize: number;
  dirty: Map<DirtyKey, DirtyEntry>;
  onToggle: (key: DirtyKey, original: boolean, newValue: boolean) => void;
  onLoadMore: () => void;
}

export function UserSectionCard({
  menuName,
  menuId,
  items,
  total,
  page,
  pageSize,
  dirty,
  onToggle,
  onLoadMore,
}: UserSectionCardProps) {
  const hasDirty = items.some((item) =>
    USER_ACTIONS.some((action) => dirty.has(makeKey(item.userId, menuId, action))),
  );

  return (
    <div className="overflow-hidden rounded-[14px] border border-white/[0.06] bg-[#131929]">
      {/* Table */}
      <table className="w-full border-collapse">
        <thead>
          <tr className="bg-white/[0.02]">
            <th className="py-2.5 pl-5 pr-3 text-left text-[10px] font-semibold uppercase tracking-widest text-slate-500 w-56">
              Name
            </th>
            <th className="py-2.5 px-3 text-left text-[10px] font-semibold uppercase tracking-widest text-slate-500 w-32">
              Role
            </th>
            {USER_ACTIONS.map((action) => (
              <th
                key={action}
                className="py-2.5 px-3 text-center text-[10px] font-semibold uppercase tracking-widest text-slate-500"
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
              className="border-t border-white/[0.04] transition-colors hover:bg-white/[0.02]"
            >
              <td className="py-3 pl-5 pr-3">
                <div className="flex items-center gap-2.5">
                  <UserAvatar
                    name={item.userName}
                    avatarUrl={item.avatarUrl ?? undefined}
                    size="sm"
                  />
                  <span className="text-[12px] font-semibold text-slate-200 truncate max-w-[140px]">
                    {item.userName}
                  </span>
                </div>
              </td>
              <td className="py-3 px-3">
                <span
                  className={`rounded-lg px-2 py-0.5 text-[10px] font-semibold ${
                    ROLE_BADGE[item.roleName] ?? 'bg-slate-500/20 text-slate-400'
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

      {/* Footer */}
      <div className="flex items-center justify-between border-t border-white/[0.04] px-5 py-3">
        <div className="text-[10px] text-slate-600">
          {hasDirty && <>🟢 = เพิ่มใหม่ &nbsp; 🔴 = ลบออก &nbsp; (ยังไม่ได้ save) &nbsp;·&nbsp; </>}
          แสดง {items.length} จาก {total} users
        </div>
        {items.length < total && (
          <button
            type="button"
            onClick={onLoadMore}
            className="text-[11px] font-medium text-indigo-400 hover:text-indigo-300 transition-colors cursor-pointer"
          >
            โหลดเพิ่ม →
          </button>
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add app/(management)/admin/permissions/_components/user-section-card.tsx
git commit -m "feat(permissions): add UserSectionCard with avatar and dirty tracking"
```

---

## Task 9: UserPermissionsTab

**Files:**
- Create: `app/(management)/admin/permissions/_components/user-permissions-tab.tsx`

- [ ] **Step 1: Create the component**

```tsx
// app/(management)/admin/permissions/_components/user-permissions-tab.tsx
'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Search, Users, ChevronDown } from 'lucide-react';
import { toast } from '@/components/ui/toast';
import { fetchUserPermissions, fetchMenuList, patchUserPermissions } from '@/lib/api/permissions';
import { PermissionsHeader } from './permissions-header';
import { UserSectionCard } from './user-section-card';
import type {
  UserMenuPermission,
  MenuItem,
  DirtyKey,
  DirtyEntry,
  UserPermissionPatch,
} from '../types';

const PAGE_SIZE = 20;

export function UserPermissionsTab() {
  const [menus, setMenus] = useState<MenuItem[]>([]);
  const [selectedMenuId, setSelectedMenuId] = useState<string>('');
  const [items, setItems] = useState<UserMenuPermission[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState<Map<DirtyKey, DirtyEntry>>(new Map());
  const [showMenuDropdown, setShowMenuDropdown] = useState(false);

  // Load menus on mount
  useEffect(() => {
    fetchMenuList()
      .then((list) => {
        setMenus(list);
        if (list.length > 0) setSelectedMenuId(list[0].id);
      })
      .catch(() => toast.error('ไม่สามารถโหลด menu list ได้'));
  }, []);

  // Load users when menu or search changes (reset page)
  useEffect(() => {
    if (!selectedMenuId) return;
    setLoading(true);
    setPage(1);
    fetchUserPermissions(selectedMenuId, 1, search)
      .then((data) => {
        setItems(data.items);
        setTotal(data.total);
      })
      .catch(() => toast.error('ไม่สามารถโหลดข้อมูล users ได้'))
      .finally(() => setLoading(false));
  }, [selectedMenuId, search]);

  const selectedMenu = menus.find((m) => m.id === selectedMenuId);
  const dirtyCount = useMemo(() => dirty.size, [dirty]);

  const handleToggle = useCallback(
    (key: DirtyKey, original: boolean, newValue: boolean) => {
      setDirty((prev) => {
        const next = new Map(prev);
        if (newValue === original) {
          next.delete(key);
        } else {
          next.set(key, { original, current: newValue });
        }
        return next;
      });
    },
    [],
  );

  const handleDiscard = useCallback(() => setDirty(new Map()), []);

  // Menu change — confirm if dirty
  const handleMenuChange = useCallback(
    (menuId: string) => {
      if (dirty.size > 0) {
        const ok = window.confirm('มีการเปลี่ยนแปลงที่ยังไม่บันทึก ต้องการออกไหม?');
        if (!ok) return;
        setDirty(new Map());
      }
      setSelectedMenuId(menuId);
      setShowMenuDropdown(false);
    },
    [dirty],
  );

  const handleLoadMore = useCallback(async () => {
    if (!selectedMenuId) return;
    const nextPage = page + 1;
    const data = await fetchUserPermissions(selectedMenuId, nextPage, search);
    setItems((prev) => [...prev, ...data.items]);
    setPage(nextPage);
  }, [selectedMenuId, page, search]);

  const handleSave = useCallback(async () => {
    if (dirty.size === 0) return;
    setSaving(true);
    try {
      const changes: UserPermissionPatch[] = Array.from(dirty.entries()).map(([key, entry]) => {
        // key: "user:<userId>:menu:<menuId>:action:<action>"
        const parts = key.split(':');
        return {
          userId: parts[1],
          menuId: parts[3],
          action: parts[5] as UserPermissionPatch['action'],
          value: entry.current,
        };
      });
      await patchUserPermissions(changes);
      // Apply dirty values into items
      setItems((prev) =>
        prev.map((item) => {
          const updatedActions = { ...item.actions };
          (Object.keys(updatedActions) as UserPermissionPatch['action'][]).forEach((action) => {
            const key = `user:${item.userId}:menu:${item.menuId}:action:${action}`;
            const entry = dirty.get(key);
            if (entry) updatedActions[action] = entry.current;
          });
          return { ...item, actions: updatedActions };
        }),
      );
      setDirty(new Map());
      toast.success('บันทึก User Permissions สำเร็จ');
    } catch {
      toast.error('บันทึกไม่สำเร็จ กรุณาลองใหม่');
    } finally {
      setSaving(false);
    }
  }, [dirty]);

  return (
    <div>
      <PermissionsHeader
        icon={Users}
        iconGradient="from-violet-500 to-pink-600"
        title="User Permissions Settings"
        description="Override permissions per individual user"
        dirtyCount={dirtyCount}
        saving={saving}
        onSave={handleSave}
        onDiscard={handleDiscard}
      />

      {/* Toolbar */}
      <div className="mb-4 flex items-center gap-3">
        {/* Search */}
        <div className="flex max-w-xs flex-1 items-center gap-2 rounded-xl border border-slate-800 bg-slate-900 px-3 py-2">
          <Search className="h-3.5 w-3.5 text-slate-500" />
          <input
            type="text"
            placeholder="ค้นหาชื่อหรือ role…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 bg-transparent text-[12px] text-slate-200 placeholder:text-slate-600 outline-none"
          />
        </div>
      </div>

      {/* Section card */}
      <div className="overflow-hidden rounded-[14px] border border-white/[0.06] bg-[#131929]">
        {/* Section header with menu dropdown */}
        <div className="flex items-center justify-between border-b border-white/[0.06] bg-[#1a2236] px-5 py-3.5">
          <div className="flex items-center gap-3">
            <div className="h-[18px] w-[3px] rounded-full bg-gradient-to-b from-indigo-500 to-violet-600" />
            <span className="text-[13px] font-bold text-white">
              {selectedMenu?.name ?? '—'}
            </span>
            <span className="text-[10px] text-slate-500">{total} users</span>
          </div>
          {/* Menu dropdown */}
          <div className="relative">
            <div className="flex items-center gap-2">
              <span className="text-[11px] text-slate-500">Select Menu:</span>
              <button
                type="button"
                onClick={() => setShowMenuDropdown((v) => !v)}
                className="flex min-w-[130px] items-center justify-between gap-2 rounded-lg border border-slate-700 bg-slate-900 px-3 py-1.5 text-[11px] text-slate-200 cursor-pointer hover:border-slate-600 transition-colors"
              >
                <span>{selectedMenu?.name ?? 'เลือก menu'}</span>
                <ChevronDown className="h-3 w-3 text-slate-500" />
              </button>
            </div>
            {showMenuDropdown && (
              <div className="absolute right-0 top-full z-20 mt-1 w-48 overflow-hidden rounded-xl border border-slate-700 bg-slate-900 shadow-2xl">
                {menus.map((menu) => (
                  <button
                    key={menu.id}
                    type="button"
                    onClick={() => handleMenuChange(menu.id)}
                    className={`w-full px-4 py-2.5 text-left text-[12px] transition-colors cursor-pointer ${
                      menu.id === selectedMenuId
                        ? 'bg-indigo-500/20 text-indigo-300'
                        : 'text-slate-300 hover:bg-white/5'
                    }`}
                  >
                    {menu.name}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16 text-slate-500 text-sm">
            กำลังโหลด…
          </div>
        ) : (
          <UserSectionCard
            menuName={selectedMenu?.name ?? ''}
            menuId={selectedMenuId}
            items={items}
            total={total}
            page={page}
            pageSize={PAGE_SIZE}
            dirty={dirty}
            onToggle={handleToggle}
            onLoadMore={handleLoadMore}
          />
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add app/(management)/admin/permissions/_components/user-permissions-tab.tsx
git commit -m "feat(permissions): add UserPermissionsTab with menu dropdown and pagination"
```

---

## Task 10: Main page.tsx

**Files:**
- Create: `app/(management)/admin/permissions/page.tsx`

- [ ] **Step 1: Create the page**

```tsx
// app/(management)/admin/permissions/page.tsx
'use client';

import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { LayoutGrid, Users } from 'lucide-react';
import { RolePermissionsTab } from './_components/role-permissions-tab';
import { UserPermissionsTab } from './_components/user-permissions-tab';

type Tab = 'role' | 'user';

const TABS: { id: Tab; label: string; icon: typeof LayoutGrid }[] = [
  { id: 'role', label: 'Role Permissions Settings', icon: LayoutGrid },
  { id: 'user', label: 'User Permissions Settings', icon: Users },
];

export default function PermissionsPage() {
  const [activeTab, setActiveTab] = useState<Tab>('role');

  return (
    <div className="p-6">
      {/* Tab pill switcher */}
      <div className="mb-6 flex gap-2">
        {TABS.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 rounded-full px-4 py-2 text-[12px] font-semibold transition-all duration-200 cursor-pointer ${
                isActive
                  ? 'bg-gradient-to-r from-indigo-500 to-violet-600 text-white shadow-lg shadow-indigo-500/30'
                  : 'border border-slate-800 bg-[#1e293b] text-slate-500 hover:text-slate-300'
              }`}
            >
              <tab.icon className="h-3.5 w-3.5" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Tab content with slide transition */}
      <AnimatePresence mode="wait">
        {activeTab === 'role' ? (
          <motion.div
            key="role"
            initial={{ opacity: 0, x: -40 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -40 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
          >
            <RolePermissionsTab />
          </motion.div>
        ) : (
          <motion.div
            key="user"
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 40 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
          >
            <UserPermissionsTab />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
```

- [ ] **Step 2: Run dev server and verify the page renders**

```bash
npm run dev
```

Open `http://localhost:3000/admin/permissions` and confirm:
- Two tab pills render, clicking switches between tabs with slide animation
- Role tab shows a loading state then section cards
- User tab shows menu dropdown and user table
- Checking a checkbox shows the dirty visual states (green outline / red border)
- Dirty badge appears with count, Save button becomes active
- Clicking Save triggers the save flow and toast
- Clicking ↩ ยกเลิก resets all dirty state

- [ ] **Step 3: Commit**

```bash
git add app/(management)/admin/permissions/page.tsx
git commit -m "feat(permissions): add main permissions page with tab switcher"
```

---

## Self-Review Checklist

**Spec coverage:**
- ✅ Two tabs (Role / User) with pill switcher
- ✅ Sticky header with dirty badge + Save/Discard
- ✅ Role: always-expanded section cards per menu
- ✅ Role: accent color cycling
- ✅ Role: Select All per section
- ✅ Dirty tracking: 4 checkbox states (clean✓, clean□, dirty+, dirty-)
- ✅ Dirty count badge with AnimatePresence
- ✅ Save flow: PATCH only changed values, toast on success
- ✅ Discard: reset to original
- ✅ User: menu dropdown with unsaved-changes confirmation
- ✅ User: search input
- ✅ User: UserAvatar + role badge
- ✅ User: load-more pagination
- ✅ Dirty legend below tables
- ✅ Staggered section card animations
- ✅ Checkbox scale pulse animation

**Placeholder scan:** None — all steps contain actual code.

**Type consistency:** `DirtyKey`, `DirtyEntry`, `RolePermissionPatch`, `UserPermissionPatch` defined once in `types.ts` and imported consistently. Key format `role:<id>:menu:<id>:action:<action>` used in Task 6 (toggle) and Task 7 (save parse) — consistent. Same for user key in Tasks 8/9.
