import { apiFetch } from '@/lib/auth/client';
import type {
  RolePermissionMatrix,
  UserPermissionPage,
  MenuItem,
  RolePermissionPatch,
  UserPermissionPatch,
} from '@/app/(management)/admin/permissions/types';
import {
  MOCK_ROLE_MATRIX,
  MOCK_MENUS,
  getMockUserPermissions,
} from '@/app/(management)/admin/permissions/_mocks/mock-data';

export async function fetchRolePermissions(): Promise<RolePermissionMatrix> {
  try {
    return await apiFetch<RolePermissionMatrix>('/permissions/roles');
  } catch {
    return MOCK_ROLE_MATRIX;
  }
}

export async function patchRolePermissions(
  changes: RolePermissionPatch[],
): Promise<void> {
  try {
    await apiFetch<void>('/permissions/roles', {
      method: 'PATCH',
      body: { changes },
    });
  } catch {
    // mock: silently succeed
  }
}

export async function fetchUserPermissions(
  menuId: string,
  _page: number,
  search: string,
): Promise<UserPermissionPage> {
  try {
    const params = new URLSearchParams({
      menuId,
      page: String(_page),
      pageSize: '20',
      ...(search ? { search } : {}),
    });
    return await apiFetch<UserPermissionPage>(`/permissions/users?${params}`);
  } catch {
    const data = getMockUserPermissions(menuId);
    if (search) {
      const q = search.toLowerCase();
      data.items = data.items.filter(
        (i) => i.userName.toLowerCase().includes(q) || i.roleName.toLowerCase().includes(q),
      );
      data.total = data.items.length;
    }
    return data;
  }
}

export async function patchUserPermissions(
  changes: UserPermissionPatch[],
): Promise<void> {
  try {
    await apiFetch<void>('/permissions/users', {
      method: 'PATCH',
      body: { changes },
    });
  } catch {
    // mock: silently succeed
  }
}

export async function fetchMenuList(): Promise<MenuItem[]> {
  try {
    return await apiFetch<MenuItem[]>('/menus/my');
  } catch {
    return MOCK_MENUS;
  }
}
