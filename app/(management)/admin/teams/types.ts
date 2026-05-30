// app/(management)/admin/teams/types.ts

export interface TeamUser {
  id: string;
  firstName: string;
  lastName: string;
  nickname: string | null;
  avatarUrl: string | null;
}

export interface TeamMember {
  id: string;
  teamId: string;
  userId: string;
  roleInTeam: 'LEAD' | 'MEMBER';
  addedById: string;
  joinedAt: string;
  user: TeamUser;
}

export interface Team {
  id: string;
  name: string;
  description: string | null;
  logoUrl: string | null;
  tags: string[];
  createdById: string;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
  _count: { projects: number };
  members: TeamMember[];
}

export interface TeamsApiResponse {
  status: string;
  message: string;
  timestamp: string;
  data: Team[];
}

export interface CreateTeamInput {
  name: string;
  description?: string;
  tags?: string[];
  logoUrl?: string;
}

export type UpdateTeamInput = Partial<CreateTeamInput>;
