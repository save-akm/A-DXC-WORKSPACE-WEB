import { apiFetch } from '@/lib/auth/client';

// ─── Branch ───────────────────────────────────────────────────────────────────

export interface Branch {
  id: string;
  code: string;
  name: string;
  address: string | null;
  phone: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface BranchCreateBody { code: string; name: string; address?: string; phone?: string }
export interface BranchUpdateBody { name?: string; address?: string | null; phone?: string | null }

// ─── Department ───────────────────────────────────────────────────────────────

export interface Department {
  id: string;
  code: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  _count: { units: number; users: number };
  hasUnits: boolean;
}

export interface DepartmentCreateBody { branchId: string; code: string; name: string }
export interface DepartmentUpdateBody { code?: string; name?: string }

// ─── Department Unit ──────────────────────────────────────────────────────────

export interface DepartmentUnit {
  id: string;
  departmentId: string;
  code: string;
  name: string;
  description: string | null;
  createdAt: string;
  updatedAt: string;
  _count?: { users: number };
  departmentName?: string; // injected by the frontend when fetching
}

export interface DepartmentUnitCreateBody { code: string; name: string; description?: string }
export interface DepartmentUnitUpdateBody { name?: string; description?: string | null }

// ─── Position ─────────────────────────────────────────────────────────────────

export interface Position {
  id: string;
  code: string;
  name: string;
  jobDesc: string | null;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

export interface PositionCreateBody { code: string; name: string; jobDesc?: string; sortOrder?: number }
export interface PositionUpdateBody { name?: string; jobDesc?: string | null; sortOrder?: number }

// ─── Helpers ──────────────────────────────────────────────────────────────────

type Envelope<T> = { status: string; data: T };

async function safeFetchList<T>(path: string): Promise<T[]> {
  try {
    const res = await apiFetch<{ status: string; data: T[] }>(path);
    return res.data ?? [];
  } catch {
    return [];
  }
}

// ─── Branch CRUD ──────────────────────────────────────────────────────────────

export const fetchOrgBranches = () => safeFetchList<Branch>('/admin/branches');

export async function createBranch(body: BranchCreateBody): Promise<Branch> {
  const res = await apiFetch<Envelope<Branch>>('/admin/branches', { method: 'POST', body });
  return res.data;
}
export async function updateBranch(id: string, body: BranchUpdateBody): Promise<Branch> {
  const res = await apiFetch<Envelope<Branch>>(`/admin/branches/${id}`, { method: 'PATCH', body });
  return res.data;
}
export async function deleteBranch(id: string): Promise<void> {
  await apiFetch(`/admin/branches/${id}`, { method: 'DELETE' });
}

// ─── Department CRUD ──────────────────────────────────────────────────────────

export const fetchOrgDepartments = () => safeFetchList<Department>('/admin/departments');

export async function createDepartment(body: DepartmentCreateBody): Promise<Department> {
  const res = await apiFetch<Envelope<Department>>('/admin/departments', { method: 'POST', body });
  return res.data;
}
export async function updateDepartment(id: string, body: DepartmentUpdateBody): Promise<Department> {
  const res = await apiFetch<Envelope<Department>>(`/admin/departments/${id}`, { method: 'PATCH', body });
  return res.data;
}
export async function deleteDepartment(id: string): Promise<void> {
  await apiFetch(`/admin/departments/${id}`, { method: 'DELETE' });
}

// ─── Department Unit CRUD ─────────────────────────────────────────────────────

export async function fetchDepartmentUnits(departmentId: string): Promise<DepartmentUnit[]> {
  try {
    const res = await apiFetch<{ status: string; data: DepartmentUnit[] }>(
      `/admin/departments/${departmentId}/units`,
    );
    return res.data ?? [];
  } catch {
    return [];
  }
}

export async function createDepartmentUnit(
  departmentId: string,
  body: DepartmentUnitCreateBody,
): Promise<DepartmentUnit> {
  const res = await apiFetch<Envelope<DepartmentUnit>>(
    `/admin/departments/${departmentId}/units`,
    { method: 'POST', body },
  );
  return res.data;
}
export async function updateDepartmentUnit(
  departmentId: string,
  unitId: string,
  body: DepartmentUnitUpdateBody,
): Promise<DepartmentUnit> {
  const res = await apiFetch<Envelope<DepartmentUnit>>(
    `/admin/departments/${departmentId}/units/${unitId}`,
    { method: 'PATCH', body },
  );
  return res.data;
}
export async function deleteDepartmentUnit(departmentId: string, unitId: string): Promise<void> {
  await apiFetch(`/admin/departments/${departmentId}/units/${unitId}`, { method: 'DELETE' });
}

// ─── Position CRUD ────────────────────────────────────────────────────────────

export const fetchOrgPositions = () => safeFetchList<Position>('/admin/positions');

export async function createPosition(body: PositionCreateBody): Promise<Position> {
  const res = await apiFetch<Envelope<Position>>('/admin/positions', { method: 'POST', body });
  return res.data;
}
export async function updatePosition(id: string, body: PositionUpdateBody): Promise<Position> {
  const res = await apiFetch<Envelope<Position>>(`/admin/positions/${id}`, { method: 'PATCH', body });
  return res.data;
}
export async function deletePosition(id: string): Promise<void> {
  await apiFetch(`/admin/positions/${id}`, { method: 'DELETE' });
}
