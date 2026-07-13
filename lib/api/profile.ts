import { apiFetch } from '@/lib/auth/client';

const PROXY = '/api/_proxy';

// ── Structural types ───────────────────────────────────────────────────────────

export interface PositionDetail       { id: string; code: string; name: string }
export interface BranchDetail         { id: string; code: string; name: string }
export interface DepartmentDetail     { id: string; code: string; name: string; branch: BranchDetail }
export interface DepartmentUnitDetail { id: string; code: string; name: string }

export interface ProfileHighlight { type: 'QUOTE' | string; content: string }

export interface UserProfileData {
  id: string;
  userId: string;
  bio: string | null;
  coverUrl: string | null;
  highlight: ProfileHighlight | null;
  isActive: boolean;
  likeCount: number;
  isLiked: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface UserSkill {
  id: string;
  name: string;
  sortOrder: number;
  createdAt: string;
}

export interface ProfileUser {
  firstName: string;
  lastName: string;
  nickname: string | null;
  email: string;
  phone: string | null;
  avatarUrl: string | null;
  position: PositionDetail;
  department: DepartmentDetail;
  departmentUnit: DepartmentUnitDetail | null;
}

export interface UserProfileResponse {
  user: ProfileUser;
  profile: UserProfileData | null;
  skills: UserSkill[];
  postCount: number;
  totalPostLikes: number;
}

// ── Public profile directory (GET /profiles) ─────────────────────────────────────

/** A department shape that carries its unit + branch inline (public listing). */
export interface PublicProfileDepartment {
  id: string;
  code: string;
  name: string;
  unit: DepartmentUnitDetail | null;
  branch: BranchDetail;
}

/** A single entry in the public IT-team directory returned by GET /profiles. */
export interface PublicProfile {
  id: string;
  firstName: string;
  lastName: string;
  nickname: string | null;
  email: string;
  phone: string | null;
  avatarUrl: string | null;
  position: PositionDetail;
  skills: Pick<UserSkill, 'id' | 'name'>[];
  department: PublicProfileDepartment;
  bio: string | null;
  coverUrl: string | null;
  highlight: ProfileHighlight | null;
  likeCount: number;
  isLiked: boolean;
  review: { average: number; total: number };
}

// ── Review types ───────────────────────────────────────────────────────────────

export interface ReviewerSnippet {
  id: string;
  firstName: string;
  lastName: string;
  avatarUrl: string | null;
}

export interface UserReview {
  id: string;
  rating: number;
  comment: string | null;
  reviewer: ReviewerSnippet;
  createdAt: string;
}

export interface ReviewsPage {
  average: number | null;
  total: number;
  data: UserReview[];
  page: number;
  limit: number;
}

export interface LikeState { likeCount: number; isLiked: boolean }

// ── Request body types ─────────────────────────────────────────────────────────

export interface UpsertProfileBody {
  bio?: string | null;
  coverUrl?: string | null;
  type?: string | null;
  content?: string | null;
  isActive?: boolean;
  skills?: string[];
}

export interface CreateReviewBody {
  rating: number;
  comment?: string;
}

// ── Envelope helper ────────────────────────────────────────────────────────────

interface Env<T> { status: string; data: T }

function unwrapEnv<T>(env: Env<T>): T { return env.data }

// For raw fetch (FormData uploads that can't go through apiFetch JSON serializer)
async function rawUnwrap<T>(res: Response): Promise<T> {
  let parsed: unknown = null;
  try { parsed = await res.json() } catch { /* non-JSON */ }
  if (!res.ok) {
    const msg = (parsed as Env<unknown> | null)?.status !== undefined
      ? ((parsed as { message?: string }).message ?? res.statusText)
      : res.statusText;
    const err = new Error(msg) as Error & { status: number };
    err.status = res.status;
    throw err;
  }
  return (parsed as Env<T>).data as T;
}

// ── Profile endpoints ──────────────────────────────────────────────────────────

export async function fetchMyProfileRequest(): Promise<UserProfileResponse> {
  const env = await apiFetch<Env<UserProfileResponse>>('/auth/me/profile');
  return unwrapEnv(env);
}

export async function fetchUserProfileRequest(userId: string): Promise<UserProfileResponse> {
  const env = await apiFetch<Env<UserProfileResponse>>(`/users/${userId}/profile`);
  return unwrapEnv(env);
}

/** GET /profiles — public IT-team directory (no auth required). */
export async function fetchProfilesRequest(): Promise<PublicProfile[]> {
  const env = await apiFetch<Env<PublicProfile[]>>('/profiles', { auth: false });
  return unwrapEnv(env);
}

export async function upsertProfileRequest(
  userId: string,
  body: UpsertProfileBody,
): Promise<UserProfileData> {
  const env = await apiFetch<Env<UserProfileData>>(`/users/${userId}/profile`, {
    method: 'PUT',
    body,
  });
  return unwrapEnv(env);
}

// ── Skills endpoint ────────────────────────────────────────────────────────────

export async function saveSkillsRequest(
  userId: string,
  skills: string[],
): Promise<UserSkill[]> {
  const env = await apiFetch<Env<{ skills: UserSkill[] }>>(`/users/${userId}/skills`, {
    method: 'POST',
    body: { skills },
  });
  return unwrapEnv(env).skills;
}

export async function deleteSkillRequest(userId: string, skillId: string): Promise<void> {
  await apiFetch<void>(`/users/${userId}/skills/${skillId}`, { method: 'DELETE' });
}

// ── Cover upload / delete ──────────────────────────────────────────────────────

export async function uploadCoverRequest(
  accessToken: string,
  userId: string,
  file: File,
): Promise<{ coverUrl: string }> {
  const form = new FormData();
  form.append('cover', file);
  const res = await fetch(`${PROXY}/users/${userId}/profile/cover`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${accessToken}` },
    body: form,
    cache: 'no-store',
  });
  return rawUnwrap<{ coverUrl: string }>(res);
}

export async function deleteCoverRequest(
  accessToken: string,
  userId: string,
): Promise<{ ok: boolean }> {
  const res = await fetch(`${PROXY}/users/${userId}/profile/cover`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${accessToken}` },
    cache: 'no-store',
  });
  return rawUnwrap<{ ok: boolean }>(res);
}

// ── Like endpoints ─────────────────────────────────────────────────────────────

export async function likeUserRequest(userId: string): Promise<LikeState> {
  const env = await apiFetch<Env<LikeState>>(`/users/${userId}/likes`, { method: 'POST' });
  return unwrapEnv(env);
}

export async function unlikeUserRequest(userId: string): Promise<LikeState> {
  const env = await apiFetch<Env<LikeState>>(`/users/${userId}/likes`, { method: 'DELETE' });
  return unwrapEnv(env);
}

// ── Review endpoints ───────────────────────────────────────────────────────────

export async function fetchReviewsRequest(
  userId: string,
  page = 1,
  limit = 10,
): Promise<ReviewsPage> {
  const env = await apiFetch<Env<ReviewsPage>>(
    `/users/${userId}/reviews?page=${page}&limit=${limit}`,
    { auth: false },
  );
  return unwrapEnv(env);
}

export async function createReviewRequest(
  userId: string,
  body: CreateReviewBody,
): Promise<UserReview> {
  const env = await apiFetch<Env<UserReview>>(`/users/${userId}/reviews`, { method: 'POST', body });
  return unwrapEnv(env);
}

export async function deleteReviewRequest(
  userId: string,
  reviewId: string,
): Promise<void> {
  await apiFetch<void>(`/users/${userId}/reviews/${reviewId}`, { method: 'DELETE' });
}
