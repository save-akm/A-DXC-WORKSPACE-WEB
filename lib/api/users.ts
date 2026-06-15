import { apiFetch } from '@/lib/auth/client';
import type { User, UsersApiResponse } from '@/app/(management)/admin/users/types';
import type { SelectOption, DepartmentOption } from '@/app/(management)/admin/users/components/user-modal';

interface RolesEnvelope    { status: string; data: SelectOption[] }
interface BranchesEnvelope     { status: string; data: SelectOption[] }
interface DepartmentItem        { id: string; name: string; code?: string; unitId?: string }
interface DepartmentsEnvelope  { status: string; data: DepartmentItem[] }

interface PositionsEnvelope    { status: string; data: SelectOption[] }

interface UsersEnvelope {
  status: string;
  data: UsersApiResponse;
}

async function fetchPage(page: number, limit: number): Promise<UsersApiResponse> {
  const res = await apiFetch<UsersEnvelope>(`/admin/users?page=${page}&limit=${limit}`);
  return res.data;
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
  const res = await apiFetch<DepartmentsEnvelope>('/admin/departments');
  return res.data.map((d) => ({
    id:     d.unitId ?? d.id,
    name:   d.code ?? d.name,
    deptId: d.id,
  }));
}

export async function fetchPositions(): Promise<SelectOption[]> {
  const res = await apiFetch<PositionsEnvelope>('/admin/positions');
  return res.data;
}
