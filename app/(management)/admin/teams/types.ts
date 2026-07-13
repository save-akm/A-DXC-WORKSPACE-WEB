// app/(management)/admin/teams/types.ts

export type TeamTag = 'INFRA' | 'DEVELOP' | 'AS400' | 'NEW_TECH' | 'GENERAL' | 'HELPDESK';

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
  addedById: string | null;
  joinedAt: string;
  user: TeamUser;
}

export interface Team {
  id: string;
  name: string;
  description: string | null;
  logoUrl: string | null;
  tags: TeamTag[];
  createdById: string;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
  _count: { projects: number };
  members: TeamMember[];
}

// ── GET /teams/:id extras ────────────────────────────────────────────────────

export interface ProjectContributor {
  id: string;
  userId: string;
  role: string;
  joinedAt: string;
  user: TeamUser;
}

export interface ProjectMilestone {
  id: string;
  type: string;
  date: string | null;
  note: string | null;
}

export interface ProjectStatusHistory {
  id: string;
  fromStatus: string | null;
  toStatus: string;
  note: string | null;
  changedAt: string;
}

export interface TeamProject {
  id: string;
  name: string;
  shortName: string | null;
  description: string | null;
  category: string;
  statusCode: string;
  kiYear: number;
  quarter: string | null;
  startDate: string | null;
  plannedEndDate: string | null;
  actualEndDate: string | null;
  massProDate: string | null;
  costAmount: string | null;
  costCurrency: string | null;
  testServer: string | null;
  testUrl: string | null;
  mpServer: string | null;
  mpUrl: string | null;
  owner: TeamUser | null;
  lead: TeamUser | null;
  contributors: ProjectContributor[];
  milestones: ProjectMilestone[];
  statusHistory: ProjectStatusHistory[];
}

export interface TeamViewer {
  roleInTeam: 'LEAD' | 'MEMBER' | null;
  canEdit: boolean;
  canDelete: boolean;
}

export interface TeamDetail extends Team {
  projects: TeamProject[];
  _viewer: TeamViewer;
}

// ── API envelopes ────────────────────────────────────────────────────────────

export interface TeamsApiResponse {
  status: string;
  message: string;
  timestamp: string;
  data: Team[];
}

export interface TeamApiResponse {
  status: string;
  data: Team;
}

export interface TeamDetailApiResponse {
  status: string;
  data: TeamDetail;
}

export interface TeamMutationResponse {
  status: string;
  data: Team;
}

// ── Input types ──────────────────────────────────────────────────────────────

export interface CreateTeamInput {
  name: string;
  description?: string;
  tags?: TeamTag[];
}

export type UpdateTeamInput = Partial<CreateTeamInput>;

export interface AddMemberInput {
  userId: string;
  roleInTeam: 'LEAD' | 'MEMBER';
}

export interface UpdateMemberInput {
  roleInTeam: 'LEAD' | 'MEMBER';
}

export interface MemberApiResponse {
  status: string;
  data: TeamMember;
}
