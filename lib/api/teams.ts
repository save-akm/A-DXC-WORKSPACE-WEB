// lib/api/teams.ts
import { apiFetch } from '@/lib/auth/client';
import type { Team, TeamsApiResponse, CreateTeamInput, UpdateTeamInput, TeamMutationResponse } from '@/app/(management)/admin/teams/types';
import { MOCK_TEAMS } from '@/app/(management)/admin/teams/_mocks/mock-data';

export async function fetchTeams(): Promise<Team[]> {
  try {
    const res = await apiFetch<TeamsApiResponse>('/teams');
    return res.data;
  } catch {
    return MOCK_TEAMS;
  }
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
