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
    body: { changes },
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
    body: { changes },
  });
}

export async function fetchMenuList(): Promise<MenuItem[]> {
  return apiFetch<MenuItem[]>('/menus/my');
}
