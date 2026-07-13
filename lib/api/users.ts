import { apiFetch } from '@/lib/auth/client';
import { useAuthStore } from '@/lib/stores/auth-store';
import type { User, UserStatus, UsersApiResponse } from '@/app/(management)/admin/users/types';
import type { SelectOption, DepartmentOption, InviteUserInput } from '@/app/(management)/admin/users/components/user-modal';

interface RolesEnvelope       { status: string; data: SelectOption[] }
interface BranchesEnvelope    { status: string; data: SelectOption[] }
interface DepartmentItem {
  id: string;
  name: string;
  code: string;
  branchId: string;
  units: { id: string; name: string; code: string }[];
}
interface DepartmentsEnvelope { status: string; data: DepartmentItem[] }
interface PositionsEnvelope   { status: string; data: SelectOption[] }

interface UsersEnvelope {
  status: string;
  data: UsersApiResponse;
}

interface UserEnvelope { success: boolean; data: User }
interface OkEnvelope   { success: boolean; data: { ok: boolean } }

// ── List / fetch ──────────────────────────────────────────────────────────────

async function fetchPage(page: number, limit: number): Promise<UsersApiResponse> {
  const res = await apiFetch<UsersEnvelope>(`/admin/users?page=${page}&limit=${limit}`);
  return res.data;
}

export interface SearchUsersParams {
  search?: string;
  status?: UserStatus;
  page?: number;
  limit?: number;
}

/** GET /admin/users — paginated search for pickers (prefer over fetchAllUsers). */
export async function searchUsers(params: SearchUsersParams = {}): Promise<UsersApiResponse> {
  const qs = new URLSearchParams();
  const page = params.page ?? 1;
  const limit = params.limit ?? 20;
  qs.set('page', String(page));
  qs.set('limit', String(limit));
  if (params.search?.trim()) qs.set('search', params.search.trim());
  if (params.status) qs.set('status', params.status);
  const res = await apiFetch<UsersEnvelope>(`/admin/users?${qs.toString()}`);
  return res.data;
}

/** Lightweight user record from GET /admin/users/options — for recipient pickers. */
export interface UserOption {
  id: string;
  employeeId: string | null;
  email: string | null;
  firstName: string | null;
  lastName: string | null;
  nickname: string | null;
  avatarUrl: string | null;
  status: string;
  role?: { id: string; code: string; name: string; color: string } | null;
  department?: { id: string; code: string; name: string } | null;
  position?: { id: string; code: string; name: string } | null;
}

/**
 * GET /admin/users/options — flat list of all selectable users for pickers
 * (lighter than the paginated /admin/users; intended for recipient selection).
 */
export async function fetchUserOptions(): Promise<UserOption[]> {
  const res = await apiFetch<{ status: string; data: UserOption[] }>('/admin/users/options');
  return Array.isArray(res.data) ? res.data : [];
}

export async function fetchAllUsers(): Promise<User[]> {
  const LIMIT = 100;
  const first = await fetchPage(1, LIMIT);
  const users = [...first.users];

  if (first.total > LIMIT) {
    const totalPages = Math.ceil(first.total / LIMIT);
    const rest = await Promise.all(
      Array.from({ length: totalPages - 1 }, (_, i) => fetchPage(i + 2, LIMIT)),
    );
    for (const r of rest) users.push(...r.users);
  }

  return users;
}

export async function fetchRoles(): Promise<SelectOption[]> {
  const res = await apiFetch<RolesEnvelope>('/admin/roles');
  return res.data;
}

export async function fetchBranches(): Promise<SelectOption[]> {
  const res = await apiFetch<BranchesEnvelope>('/admin/branches');
  return res.data;
}

export async function fetchDepartments(): Promise<DepartmentOption[]> {
  const res = await apiFetch<DepartmentsEnvelope>('/admin/departments/options');
  const result: DepartmentOption[] = [];
  for (const d of res.data) {
    if (d.units.length > 0) {
      for (const u of d.units) {
        result.push({ id: u.id, name: u.name, deptId: d.id, deptCode: d.code, unitCode: u.code });
      }
    } else {
      result.push({ id: d.id, name: d.name, deptId: d.id, deptCode: d.code });
    }
  }
  return result;
}

export async function fetchPositions(): Promise<SelectOption[]> {
  const res = await apiFetch<PositionsEnvelope>('/admin/positions');
  return res.data;
}

// ── Types ─────────────────────────────────────────────────────────────────────

export type CreateUserBody = Pick<
  InviteUserInput,
  | 'employeeId' | 'email' | 'firstName' | 'lastName' | 'nickname'
  | 'phone' | 'departmentId' | 'departmentUnitId' | 'roleId'
  | 'positionId' | 'avatarUrl' | 'commuteMinutes'
>;

export interface UpdateUserBody {
  email?: string;
  password?: string;
  firstName?: string;
  lastName?: string;
  nickname?: string;
  phone?: string;
  departmentId?: string;
  departmentUnitId?: string;
  roleId?: string;
  positionId?: string;
  status?: UserStatus;
  commuteMinutes?: number;
}

// ── Create ────────────────────────────────────────────────────────────────────

export async function createUser(body: CreateUserBody): Promise<User> {
  const res = await apiFetch<UserEnvelope>('/admin/users', { method: 'POST', body });
  return res.data;
}

// ── Update ────────────────────────────────────────────────────────────────────

export async function updateUser(id: string, body: UpdateUserBody): Promise<User> {
  const res = await apiFetch<UserEnvelope>(`/admin/users/${id}`, { method: 'PATCH', body });
  return res.data;
}

// ── Delete ────────────────────────────────────────────────────────────────────

export async function deleteUser(id: string): Promise<void> {
  await apiFetch<OkEnvelope>(`/admin/users/${id}`, { method: 'DELETE' });
}

// ── Avatar ────────────────────────────────────────────────────────────────────

export async function uploadAvatar(id: string, file: File): Promise<User> {
  const token = useAuthStore.getState().accessToken;
  const form = new FormData();
  form.append('avatar', file);

  const res = await fetch(`/api/_proxy/admin/users/${id}/avatar`, {
    method: 'POST',
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: form,
  });

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    const err = new Error((data?.message as string) ?? res.statusText) as Error & { status: number };
    err.status = res.status;
    throw err;
  }

  const envelope = (await res.json()) as UserEnvelope;
  return envelope.data;
}

export async function deleteAvatar(id: string): Promise<void> {
  await apiFetch<OkEnvelope>(`/admin/users/${id}/avatar`, { method: 'DELETE' });
}
