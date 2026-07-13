import { apiFetch } from '@/lib/auth/client';
import { useAuthStore } from '@/lib/stores/auth-store';
import type {
  Team,
  TeamDetail,
  TeamDetailApiResponse,
  TeamsApiResponse,
  TeamMutationResponse,
  CreateTeamInput,
  UpdateTeamInput,
  TeamMember,
  MemberApiResponse,
  AddMemberInput,
  UpdateMemberInput,
} from '@/app/(management)/admin/teams/types';
import { MOCK_TEAMS } from '@/app/(management)/admin/teams/_mocks/mock-data';

// ── Team CRUD ─────────────────────────────────────────────────────────────────

export async function fetchTeams(): Promise<Team[]> {
  try {
    const res = await apiFetch<TeamsApiResponse>('/teams');
    return res.data;
  } catch {
    return MOCK_TEAMS;
  }
}

export async function fetchTeam(id: string): Promise<TeamDetail> {
  const res = await apiFetch<TeamDetailApiResponse>(`/teams/${id}`);
  return res.data;
}

export async function createTeam(input: CreateTeamInput): Promise<Team> {
  const res = await apiFetch<TeamMutationResponse>('/teams', {
    method: 'POST',
    body: input,
  });
  return res.data;
}

export async function updateTeam(id: string, input: UpdateTeamInput): Promise<Team> {
  const res = await apiFetch<TeamMutationResponse>(`/teams/${id}`, {
    method: 'PATCH',
    body: input,
  });
  return res.data;
}

export async function deleteTeam(id: string): Promise<void> {
  await apiFetch<void>(`/teams/${id}`, { method: 'DELETE' });
}

// ── Logo ──────────────────────────────────────────────────────────────────────

export async function uploadTeamLogo(id: string, file: File): Promise<Team> {
  const { accessToken } = useAuthStore.getState();
  const form = new FormData();
  form.append('logo', file);

  const res = await fetch(`/api/_proxy/teams/${id}/logo`, {
    method: 'POST',
    headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : {},
    body: form,
    cache: 'no-store',
  });

  if (!res.ok) {
    const data = await res.json().catch(() => ({})) as { message?: string };
    const err = new Error(data?.message ?? res.statusText) as Error & { status: number };
    err.status = res.status;
    throw err;
  }

  const envelope = await res.json() as TeamMutationResponse;
  return envelope.data;
}

export async function deleteTeamLogo(id: string): Promise<void> {
  await apiFetch<void>(`/teams/${id}/logo`, { method: 'DELETE' });
}

// ── Members ───────────────────────────────────────────────────────────────────

export async function addMember(teamId: string, input: AddMemberInput): Promise<TeamMember> {
  const res = await apiFetch<MemberApiResponse>(`/teams/${teamId}/members`, {
    method: 'POST',
    body: input,
  });
  return res.data;
}

export async function updateMemberRole(
  teamId: string,
  userId: string,
  input: UpdateMemberInput,
): Promise<TeamMember> {
  const res = await apiFetch<MemberApiResponse>(`/teams/${teamId}/members/${userId}`, {
    method: 'PATCH',
    body: input,
  });
  return res.data;
}

export async function removeMember(teamId: string, userId: string): Promise<void> {
  await apiFetch<void>(`/teams/${teamId}/members/${userId}`, { method: 'DELETE' });
}
