import type { LucideIcon } from 'lucide-react';
import { resolveIcon } from '@/components/management/sidebar/icon-registry';
import type { MenuNode } from '@/lib/auth/types';
import {
  ROLE_ACTIONS,
  ACTION_LABELS,
  type PermissionAction,
  type RolePermissionPatch,
} from '../../permissions/types';

export { ROLE_ACTIONS, ACTION_LABELS, type PermissionAction, type RolePermissionPatch };

/** One menu's action flags. */
export type ActionPerms = Record<PermissionAction, boolean>;

export const EMPTY_PERMS: ActionPerms = {
  view: false,
  create: false,
  update: false,
  delete: false,
  export: false,
  highPrivilege: false,
};

/** Defaults applied when a menu is first granted to the role. */
export const DEFAULT_PERMS: ActionPerms = { ...EMPTY_PERMS, view: true };

/** Wizard form state, shared across every step. */
export interface RoleFormState {
  roleName: string;
  /** Uppercase machine code, e.g. "MANAGER". */
  roleCode: string;
  roleDesc: string;
  /** Hex color sent to the API, e.g. "#6366f1". */
  color: string;
  /** Built-in/protected role — cannot be renamed or deleted once created. */
  isSystem: boolean;
  /** menuId → actions. Presence of a key means the role can access that menu. */
  permissions: Record<string, ActionPerms>;
}

/** API default is #6b7280; we preselect the indigo accent for a nicer first impression. */
export const DEFAULT_COLOR = '#6366f1';

export const INITIAL_FORM: RoleFormState = {
  roleName: '',
  roleCode: '',
  roleDesc: '',
  color: DEFAULT_COLOR,
  isSystem: false,
  permissions: {},
};

/** Derive an uppercase code from a role name: "Help Desk" → "HELP_DESK". */
export function slugifyCode(name: string): string {
  return name
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');
}

/** A leaf menu flattened out of the GROUP/MENU tree, tagged with its group. */
export interface FlatMenu {
  id: string;
  name: string;
  group: string;
  icon: LucideIcon;
}

/** Walk the MenuNode tree and collect leaf MENU nodes grouped by their nearest ancestor. */
export function flattenMenus(menus: MenuNode[]): FlatMenu[] {
  const out: FlatMenu[] = [];

  const walk = (nodes: MenuNode[], group: string) => {
    for (const node of nodes) {
      if (node.children && node.children.length > 0) {
        walk(node.children, group || node.name);
      } else if (node.type === 'MENU') {
        out.push({
          id: node.id,
          name: node.name,
          group: group || 'General',
          icon: resolveIcon(node.icon),
        });
      }
    }
  };

  for (const top of menus) {
    if (top.children && top.children.length > 0) walk(top.children, top.name);
    else if (top.type === 'MENU') {
      out.push({ id: top.id, name: top.name, group: 'General', icon: resolveIcon(top.icon) });
    }
  }

  return out;
}

/**
 * Flatten the wizard's permission map into the `changes[]` shape expected by
 * PATCH /permissions/roles. A new role starts all-false, so we only emit the
 * granted actions — anything omitted simply stays false.
 */
export function buildPermissionChanges(
  roleId: string,
  permissions: Record<string, ActionPerms>,
): RolePermissionPatch[] {
  const changes: RolePermissionPatch[] = [];
  for (const [menuId, actions] of Object.entries(permissions)) {
    for (const action of ROLE_ACTIONS) {
      if (actions[action]) changes.push({ roleId, menuId, action, value: true });
    }
  }
  return changes;
}

/**
 * Diff two permission maps into `changes[]` — emits a change for every
 * (menu × action) whose value flipped. Used in edit mode; a menu missing from
 * either side counts as all-false. (Create mode is just diff against `{}`.)
 */
export function diffPermissionChanges(
  roleId: string,
  original: Record<string, ActionPerms>,
  current: Record<string, ActionPerms>,
): RolePermissionPatch[] {
  const menuIds = new Set([...Object.keys(original), ...Object.keys(current)]);
  const changes: RolePermissionPatch[] = [];
  for (const menuId of menuIds) {
    for (const action of ROLE_ACTIONS) {
      const before = original[menuId]?.[action] ?? false;
      const after = current[menuId]?.[action] ?? false;
      if (before !== after) changes.push({ roleId, menuId, action, value: after });
    }
  }
  return changes;
}

/** Group flat menus by their `group` label, preserving insertion order. */
export function groupMenus(items: FlatMenu[]): Map<string, FlatMenu[]> {
  const map = new Map<string, FlatMenu[]>();
  for (const item of items) {
    if (!map.has(item.group)) map.set(item.group, []);
    map.get(item.group)!.push(item);
  }
  return map;
}
