export type PermissionAction = 'view' | 'create' | 'update' | 'delete' | 'export' | 'highPrivilege';

export const ROLE_ACTIONS: PermissionAction[] = ['view', 'create', 'update', 'delete', 'export', 'highPrivilege'];
export const USER_ACTIONS: PermissionAction[] = ['view', 'create', 'update', 'delete', 'highPrivilege'];

export const ACTION_LABELS: Record<PermissionAction, string> = {
  view: 'View',
  create: 'Create',
  update: 'Update',
  delete: 'Delete',
  export: 'Export',
  highPrivilege: 'High Privilege',
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

/** A menu item as returned by GET /permissions/menus (used for the dropdown) */
export interface MenuItem {
  id: string;
  name: string;
  code: string;
  isActive: boolean;
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
