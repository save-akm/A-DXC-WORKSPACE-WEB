import { apiFetch } from '@/lib/auth/client';
import type {
  RolePermissionMatrix,
  UserPermissionPage,
  MenuItem,
  RolePermissionPatch,
  UserPermissionPatch,
} from '@/app/(management)/admin/permissions/types';
export async function fetchRolePermissions(): Promise<RolePermissionMatrix> {
  const res = await apiFetch<{ data: RolePermissionMatrix }>('/permissions/roles');
  return res.data;
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
  _page: number,
  search: string,
): Promise<UserPermissionPage> {
  const params = new URLSearchParams({
    menuId,
    page: String(_page),
    pageSize: '20',
    ...(search ? { search } : {}),
  });
  const res = await apiFetch<{ data: UserPermissionPage }>(`/permissions/users?${params}`);
  return res.data;
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
  const res = await apiFetch<{ data: MenuItem[] }>('/permissions/menus');
  return res.data;
}
