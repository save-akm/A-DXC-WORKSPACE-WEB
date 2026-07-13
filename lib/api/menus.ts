import { apiFetch } from '@/lib/auth/client';

export interface Menu {
  id: string;
  code: string;
  name: string;
  type: 'GROUP' | 'MENU';
  parentId: string | null;
  parent: { id: string; name: string; code: string } | null;
  path: string | null;
  icon: string | null;
  sortOrder: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  _count: {
    children: number;
    rolePermissions: number;
    userPermissions: number;
  };
}

type Envelope<T> = { status: string; data: T };

export async function fetchAdminMenus(): Promise<Menu[]> {
  const res = await apiFetch<Envelope<Menu[]>>('/admin/menus');
  return res.data;
}

export async function checkMenuCode(code: string, excludeId?: string): Promise<boolean> {
  const params = new URLSearchParams({ code });
  if (excludeId) params.set('excludeId', excludeId);
  const res = await apiFetch<Envelope<{ available: boolean }>>(`/admin/menus/check?${params}`);
  return res.data.available;
}

export interface CreateMenuBody {
  code: string;
  name: string;
  type: 'GROUP' | 'MENU';
  parentId?: string | null;
  path?: string | null;
  icon?: string | null;
  sortOrder?: number;
  isActive?: boolean;
}

export interface UpdateMenuBody {
  name?: string;
  parentId?: string | null;
  path?: string | null;
  icon?: string | null;
  sortOrder?: number;
  isActive?: boolean;
}

export async function createMenu(body: CreateMenuBody): Promise<Menu> {
  const res = await apiFetch<Envelope<Menu>>('/admin/menus', { method: 'POST', body });
  return res.data;
}

export async function updateMenu(id: string, body: UpdateMenuBody): Promise<Menu> {
  const res = await apiFetch<Envelope<Menu>>(`/admin/menus/${id}`, { method: 'PATCH', body });
  return res.data;
}

export async function reorderMenus(items: { id: string; sortOrder: number }[]): Promise<void> {
  await apiFetch<Envelope<{ ok: boolean }>>('/admin/menus/reorder', {
    method: 'PATCH',
    body: { items },
  });
}

export async function deleteMenu(id: string): Promise<void> {
  await apiFetch<Envelope<{ ok: boolean }>>(`/admin/menus/${id}`, { method: 'DELETE' });
}
