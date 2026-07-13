import { apiFetch } from '@/lib/auth/client';
import { useAuthStore } from '@/lib/stores/auth-store';
import type {
  ApiEnvelope,
  ContentImageResult,
  CostInput,
  CostRow,
  CreateSurveyInput,
  PaginatedSurveys,
  ReviewSurveyInput,
  ScheduleInput,
  ScheduleRow,
  SurveyActionEntry,
  SurveyAttachment,
  SurveyAuditLog,
  SurveyComment,
  SurveyDetail,
  SurveyHistoryEntry,
  SurveyListParams,
  SurveyNotification,
  UpdateSurveyInput,
  UserMini,
} from '@/lib/project-survey/types';

const BASE = '/api/project-surveys';

function buildQuery(params?: SurveyListParams): string {
  if (!params) return '';
  const qs = new URLSearchParams();
  if (params.page) qs.set('page', String(params.page));
  if (params.limit) qs.set('limit', String(params.limit));
  if (params.status) qs.set('status', params.status);
  if (params.requesterId) qs.set('requesterId', params.requesterId);
  if (params.branchId) qs.set('branchId', params.branchId);
  if (params.departmentId) qs.set('departmentId', params.departmentId);
  if (params.keyword?.trim()) qs.set('keyword', params.keyword.trim());
  if (params.mine) qs.set('mine', 'true');
  const q = qs.toString();
  return q ? `?${q}` : '';
}

/** Shared multipart POST — apiFetch always JSON-encodes bodies, so uploads go direct. */
async function uploadMultipart<T>(path: string, file: File): Promise<T> {
  const token = useAuthStore.getState().accessToken;
  const form = new FormData();
  form.append('file', file);

  const res = await fetch(`/api/_proxy${path}`, {
    method: 'POST',
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: form,
    cache: 'no-store',
  });
  if (!res.ok) {
    let message = res.statusText;
    try {
      const data = await res.json();
      message = data?.message ?? message;
    } catch { /* non-JSON */ }
    const err = new Error(message) as Error & { status: number };
    err.status = res.status;
    throw err;
  }
  const json = (await res.json()) as ApiEnvelope<T>;
  return json.data;
}

// ── Master data ───────────────────────────────────────────────────────────────

/** GET /request-to-users — active SUPER_ADMIN users. project_survey:CREATE */
export async function fetchRequestToUsers(): Promise<UserMini[]> {
  const res = await apiFetch<ApiEnvelope<UserMini[]>>(`${BASE}/request-to-users`);
  return res.data;
}

// ── List / inbox ──────────────────────────────────────────────────────────────

/** GET / — paginated list. project_survey:VIEW (USER sees own docs only) */
export async function fetchSurveys(params?: SurveyListParams): Promise<PaginatedSurveys> {
  const res = await apiFetch<ApiEnvelope<PaginatedSurveys>>(`${BASE}${buildQuery(params)}`);
  return res.data;
}

/** GET /inbox/review — A-DXC queue (SEND | REVIEW only). project_survey:UPDATE */
export async function fetchReviewInbox(params?: SurveyListParams): Promise<PaginatedSurveys> {
  const res = await apiFetch<ApiEnvelope<PaginatedSurveys>>(`${BASE}/inbox/review${buildQuery(params)}`);
  return res.data;
}

// ── CRUD + workflow ───────────────────────────────────────────────────────────

/** POST / — create + send immediately (status SEND). project_survey:CREATE */
export async function createSurvey(input: CreateSurveyInput): Promise<SurveyDetail> {
  const res = await apiFetch<ApiEnvelope<SurveyDetail>>(BASE, { method: 'POST', body: input });
  return res.data;
}

/** GET /:id — detail. Viewing as requestTo while SEND auto-starts REVIEW. */
export async function fetchSurvey(id: string): Promise<SurveyDetail> {
  const res = await apiFetch<ApiEnvelope<SurveyDetail>>(`${BASE}/${id}`);
  return res.data;
}

/** PUT /:id — owner edit while SEND. costs/schedules replace the USER set. */
export async function updateSurvey(id: string, input: UpdateSurveyInput): Promise<SurveyDetail> {
  const res = await apiFetch<ApiEnvelope<SurveyDetail>>(`${BASE}/${id}`, { method: 'PUT', body: input });
  return res.data;
}

/** DELETE /:id — owner delete while SEND. */
export async function deleteSurvey(id: string): Promise<void> {
  await apiFetch<ApiEnvelope<{ ok: true }>>(`${BASE}/${id}`, { method: 'DELETE' });
}

/** POST /:id/start-review — requestTo only, while SEND. (GET /:id already auto-starts.) */
export async function startReview(id: string): Promise<SurveyDetail> {
  const res = await apiFetch<ApiEnvelope<SurveyDetail>>(`${BASE}/${id}/start-review`, { method: 'POST' });
  return res.data;
}

/** PUT /:id/review — A-DXC saves the review while REVIEW. */
export async function saveReview(id: string, input: ReviewSurveyInput): Promise<SurveyDetail> {
  const res = await apiFetch<ApiEnvelope<SurveyDetail>>(`${BASE}/${id}/review`, { method: 'PUT', body: input });
  return res.data;
}

/** POST /:id/approve — A-DXC approves while REVIEW; locks the document. */
export async function approveSurvey(id: string, remark?: string): Promise<SurveyDetail> {
  const res = await apiFetch<ApiEnvelope<SurveyDetail>>(`${BASE}/${id}/approve`, {
    method: 'POST',
    body: remark?.trim() ? { remark: remark.trim() } : {},
  });
  return res.data;
}

// ── Comments ──────────────────────────────────────────────────────────────────

export async function fetchComments(id: string): Promise<SurveyComment[]> {
  const res = await apiFetch<ApiEnvelope<SurveyComment[]>>(`${BASE}/${id}/comments`);
  return res.data;
}

export async function addComment(id: string, comment: string): Promise<SurveyComment> {
  const res = await apiFetch<ApiEnvelope<SurveyComment>>(`${BASE}/${id}/comments`, {
    method: 'POST',
    body: { comment },
  });
  return res.data;
}

export async function deleteComment(id: string, commentId: string): Promise<void> {
  await apiFetch<ApiEnvelope<{ ok: true }>>(`${BASE}/${id}/comments/${commentId}`, { method: 'DELETE' });
}

// ── Files ─────────────────────────────────────────────────────────────────────

/** POST /:id/content-images — inline Markdown image (owner, while SEND). */
export function uploadContentImage(id: string, file: File): Promise<ContentImageResult> {
  return uploadMultipart<ContentImageResult>(`${BASE}/${id}/content-images`, file);
}

export async function fetchAttachments(id: string): Promise<SurveyAttachment[]> {
  const res = await apiFetch<ApiEnvelope<SurveyAttachment[]>>(`${BASE}/${id}/attachments`);
  return res.data;
}

/** POST /:id/attachments — PDF/Office upload (USER while SEND, A-DXC while REVIEW). */
export function uploadAttachment(id: string, file: File): Promise<SurveyAttachment> {
  return uploadMultipart<SurveyAttachment>(`${BASE}/${id}/attachments`, file);
}

export async function deleteAttachment(id: string, attachmentId: string): Promise<void> {
  await apiFetch<ApiEnvelope<{ ok: true }>>(`${BASE}/${id}/attachments/${attachmentId}`, { method: 'DELETE' });
}

// ── Costs / schedules (A-DXC while REVIEW) ────────────────────────────────────

/** PUT /:id/costs — replaces the whole cost set. */
export async function replaceCosts(id: string, costs: CostInput[]): Promise<CostRow[]> {
  const res = await apiFetch<ApiEnvelope<CostRow[]>>(`${BASE}/${id}/costs`, {
    method: 'PUT',
    body: { costs },
  });
  return res.data;
}

/** PUT /:id/schedules — replaces only the A_DXC rows; returns ALL rows. */
export async function replaceSchedules(id: string, schedules: ScheduleInput[]): Promise<ScheduleRow[]> {
  const res = await apiFetch<ApiEnvelope<ScheduleRow[]>>(`${BASE}/${id}/schedules`, {
    method: 'PUT',
    body: { schedules },
  });
  return res.data;
}

// ── Trails ────────────────────────────────────────────────────────────────────

export async function fetchHistory(id: string): Promise<SurveyHistoryEntry[]> {
  const res = await apiFetch<ApiEnvelope<SurveyHistoryEntry[]>>(`${BASE}/${id}/history`);
  return res.data;
}

export async function fetchActions(id: string): Promise<SurveyActionEntry[]> {
  const res = await apiFetch<ApiEnvelope<SurveyActionEntry[]>>(`${BASE}/${id}/actions`);
  return res.data;
}

/** Admin / reviewer (UPDATE) only. */
export async function fetchAuditLogs(id: string): Promise<SurveyAuditLog[]> {
  const res = await apiFetch<ApiEnvelope<SurveyAuditLog[]>>(`${BASE}/${id}/audit-logs`);
  return res.data;
}

// ── Notifications ─────────────────────────────────────────────────────────────

export async function fetchSurveyNotifications(id: string): Promise<SurveyNotification[]> {
  const res = await apiFetch<ApiEnvelope<SurveyNotification[]>>(`${BASE}/${id}/notifications`);
  return res.data;
}

export async function markNotificationRead(notificationId: string): Promise<SurveyNotification> {
  const res = await apiFetch<ApiEnvelope<SurveyNotification>>(
    `${BASE}/notifications/${notificationId}/read`,
    { method: 'PATCH' },
  );
  return res.data;
}
