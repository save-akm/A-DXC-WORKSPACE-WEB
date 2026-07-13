import { apiFetch } from '@/lib/auth/client';

/** A role as returned by the admin roles API (model fields only). */
export interface ApiRole {
  id: string;
  code: string;
  name: string;
  description: string | null;
  color: string; // hex (#rrggbb)
  sortOrder: number;
  /** Built-in role (SYSTEM/SUPER_ADMIN/ADMIN) — cannot be renamed or deleted. */
  isSystem?: boolean;
  /** Present only if the backend includes relation counts. */
  _count?: { users?: number; rolePermissions?: number };
}

/** List all roles (SYSTEM excluded by the backend). */
export async function fetchRoles(): Promise<ApiRole[]> {
  const res = await apiFetch<{ data: ApiRole[] }>('/admin/roles');
  return res.data;
}

/** Body for POST /admin/roles. */
export interface CreateRoleInput {
  code: string;
  name: string;
  description: string;
  color: string; // hex
  sortOrder: number;
  isSystem?: boolean; // optional; server defaults to false
}

/** Result of GET /admin/roles/check. */
export interface RoleCheckResult {
  available: boolean;
  name?: { taken: boolean };
  code?: { taken: boolean };
}

/** One menu row in a role's permission set. */
export interface RolePermissionMenu {
  menuId: string;
  menuCode: string;
  menuName: string;
  actions: {
    view: boolean;
    create: boolean;
    update: boolean;
    delete: boolean;
    export: boolean;
    highPrivilege: boolean;
  };
}

/** GET /admin/roles/:id/permission payload. */
export interface RolePermissions {
  roleId: string;
  roleName: string;
  roleCode: string;
  menus: RolePermissionMenu[];
}

/** Body for PATCH /admin/roles/:id (code is immutable; at least one field required). */
export interface UpdateRoleInput {
  name?: string;
  description?: string;
  color?: string; // hex
  sortOrder?: number;
}

/** Create a new role. Returns the created role (with its new id). */
export async function createRole(input: CreateRoleInput): Promise<ApiRole> {
  const res = await apiFetch<{ status: string; data: ApiRole }>('/admin/roles', {
    method: 'POST',
    body: input,
  });
  return res.data;
}

/** Update an existing role's editable fields. */
export async function updateRole(id: string, input: UpdateRoleInput): Promise<ApiRole> {
  const res = await apiFetch<{ status: string; data: ApiRole }>(`/admin/roles/${id}`, {
    method: 'PATCH',
    body: input,
  });
  return res.data;
}

/** Delete a role. */
export async function deleteRole(id: string): Promise<void> {
  await apiFetch<void>(`/admin/roles/${id}`, { method: 'DELETE' });
}

/**
 * Check whether a role name / code is already taken.
 * Pass at least one of name/code. `excludeId` skips a role (for edit).
 */
export async function checkRoleAvailability(params: {
  name?: string;
  code?: string;
  excludeId?: string;
}): Promise<RoleCheckResult> {
  const qs = new URLSearchParams();
  if (params.name) qs.set('name', params.name);
  if (params.code) qs.set('code', params.code);
  if (params.excludeId) qs.set('excludeId', params.excludeId);

  // Tolerate both the standard {status,data} envelope and a flat response.
  const res = await apiFetch<RoleCheckResult | { status: string; data: RoleCheckResult }>(
    `/admin/roles/check?${qs.toString()}`,
  );
  return 'data' in res ? res.data : res;
}

/** Fetch a single role's full permission matrix (all menus + action flags). */
export async function fetchRolePermissionsById(roleId: string): Promise<RolePermissions> {
  const res = await apiFetch<{ data: RolePermissions }>(`/admin/roles/${roleId}/permission`);
  return res.data;
}
