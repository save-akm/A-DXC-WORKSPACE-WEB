import { apiFetch } from '@/lib/auth/client';
import { useAuthStore } from '@/lib/stores/auth-store';
import { assertActivityImageFile } from '@/lib/activity/image-validation';
import type {
  ApiEnvelope,
  Activity,
  ActivityAdminFilters,
  ActivityAttendee,
  ActivityDetail,
  ActivityImage,
  ActivityPublicFilters,
  ActivityTag,
  CreateActivityInput,
  CreateActivityTagInput,
  FeaturedSlots,
  JoinedActivity,
  ActivityAttendance,
  UpdateActivityImageInput,
  UpdateActivityInput,
  UploadActivityImageOptions,
} from '@/lib/activity/types';

function buildPublicQuery(filters?: ActivityPublicFilters): string {
  if (!filters) return '';
  const qs = new URLSearchParams();
  if (filters.status) qs.set('status', filters.status);
  if (filters.tagId) qs.set('tagId', filters.tagId);
  const q = qs.toString();
  return q ? `?${q}` : '';
}

function buildAdminQuery(filters?: ActivityAdminFilters): string {
  if (!filters) return '';
  const qs = new URLSearchParams();
  if (filters.status) qs.set('status', filters.status);
  if (filters.tagId) qs.set('tagId', filters.tagId);
  if (typeof filters.isActive === 'boolean') qs.set('isActive', String(filters.isActive));
  if (typeof filters.isFeatured === 'boolean') qs.set('isFeatured', String(filters.isFeatured));
  if (filters.limit != null) qs.set('limit', String(filters.limit));
  const q = qs.toString();
  return q ? `?${q}` : '';
}

// ── Public ────────────────────────────────────────────────────────────────────

/** GET /activities — featured landing list (max 5). */
export async function fetchActivities(filters?: ActivityPublicFilters): Promise<Activity[]> {
  const res = await apiFetch<ApiEnvelope<Activity[]>>(
    `/activities${buildPublicQuery(filters)}`,
    { auth: false },
  );
  return res.data;
}

/** GET /activity-tags — public list for filters & admin form tag picker. */
export async function fetchActivityTags(): Promise<ActivityTag[]> {
  const res = await apiFetch<ApiEnvelope<ActivityTag[]>>('/activity-tags', { auth: false });
  return res.data;
}

/** GET /activities/:id — detail; sends Bearer when logged in for isJoined. */
export async function fetchActivity(id: string): Promise<ActivityDetail> {
  const res = await apiFetch<ApiEnvelope<ActivityDetail>>(`/activities/${id}`);
  return res.data;
}

/** GET /activities/:id — public detail without auth header. */
export async function fetchActivityPublic(id: string): Promise<ActivityDetail> {
  const res = await apiFetch<ApiEnvelope<ActivityDetail>>(`/activities/${id}`, { auth: false });
  return res.data;
}

// ── User (auth) ───────────────────────────────────────────────────────────────

/** GET /activities/me — activities the current user joined. */
export async function fetchMyActivities(): Promise<JoinedActivity[]> {
  const res = await apiFetch<ApiEnvelope<JoinedActivity[]>>('/activities/me');
  return res.data;
}

/** POST /activities/:id/join */
export async function joinActivity(id: string): Promise<ActivityAttendance> {
  const res = await apiFetch<ApiEnvelope<ActivityAttendance>>(`/activities/${id}/join`, {
    method: 'POST',
  });
  return res.data;
}

/** DELETE /activities/:id/join */
export async function leaveActivity(id: string): Promise<void> {
  await apiFetch<ApiEnvelope<{ ok: true }>>(`/activities/${id}/join`, { method: 'DELETE' });
}

// ── Admin ─────────────────────────────────────────────────────────────────────

/** GET /admin/activities/featured-slots */
export async function fetchFeaturedSlots(): Promise<FeaturedSlots> {
  const res = await apiFetch<ApiEnvelope<FeaturedSlots>>('/admin/activities/featured-slots');
  return res.data;
}

/** GET /admin/activities */
export async function fetchAdminActivities(filters?: ActivityAdminFilters): Promise<Activity[]> {
  const res = await apiFetch<ApiEnvelope<Activity[]>>(
    `/admin/activities${buildAdminQuery(filters)}`,
  );
  return res.data;
}

/** GET /admin/activities/:id */
export async function fetchAdminActivity(id: string): Promise<ActivityDetail> {
  const res = await apiFetch<ApiEnvelope<ActivityDetail>>(`/admin/activities/${id}`);
  return res.data;
}

/** POST /admin/activities */
export async function createActivity(input: CreateActivityInput): Promise<ActivityDetail> {
  const res = await apiFetch<ApiEnvelope<ActivityDetail>>('/admin/activities', {
    method: 'POST',
    body: input,
  });
  return res.data;
}

/** PATCH /admin/activities/:id */
export async function updateActivity(id: string, input: UpdateActivityInput): Promise<ActivityDetail> {
  const res = await apiFetch<ApiEnvelope<ActivityDetail>>(`/admin/activities/${id}`, {
    method: 'PATCH',
    body: input,
  });
  return res.data;
}

/** DELETE /admin/activities/:id */
export async function deleteActivity(id: string): Promise<void> {
  await apiFetch<ApiEnvelope<{ ok: true }>>(`/admin/activities/${id}`, { method: 'DELETE' });
}

/** POST /admin/activity-tags — create tag (admin). Form picks via GET /activity-tags. */
export async function createActivityTag(input: CreateActivityTagInput): Promise<ActivityTag> {
  const res = await apiFetch<ApiEnvelope<ActivityTag>>('/admin/activity-tags', {
    method: 'POST',
    body: input,
  });
  return res.data;
}

/** DELETE /admin/activity-tags/:id — fails with TAG_IN_USE if linked to activities. */
export async function deleteActivityTag(id: string): Promise<void> {
  await apiFetch<ApiEnvelope<{ ok: true }>>(`/admin/activity-tags/${id}`, { method: 'DELETE' });
}

/** POST /admin/activities/:id/images — multipart upload (jpg/png/webp). */
export async function uploadActivityImage(
  activityId: string,
  file: File,
  options?: UploadActivityImageOptions,
): Promise<ActivityImage> {
  assertActivityImageFile(file);

  const { accessToken } = useAuthStore.getState();
  const form = new FormData();
  form.append('file', file);
  if (options?.caption) form.append('caption', options.caption);
  if (options?.sortOrder != null) form.append('sortOrder', String(options.sortOrder));

  const res = await fetch(`/api/_proxy/admin/activities/${activityId}/images`, {
    method: 'POST',
    headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : {},
    body: form,
    cache: 'no-store',
  });

  if (!res.ok) {
    const data = await res.json().catch(() => ({})) as { message?: string; code?: string };
    const err = new Error(data?.message ?? res.statusText) as Error & { status: number; code?: string };
    err.status = res.status;
    err.code = data?.code;
    throw err;
  }

  const envelope = await res.json() as ApiEnvelope<ActivityImage>;
  return envelope.data;
}

/** Upload files queued during create — first image (lowest sortOrder) becomes the cover. */
export async function uploadQueuedActivityImages(
  activityId: string,
  files: File[],
): Promise<void> {
  for (const file of files) {
    assertActivityImageFile(file);
  }
  for (let i = 0; i < files.length; i++) {
    await uploadActivityImage(activityId, files[i]);
  }
}

/** PATCH /admin/activities/:id/images/:imageId */
export async function updateActivityImage(
  activityId: string,
  imageId: string,
  input: UpdateActivityImageInput,
): Promise<ActivityImage> {
  const res = await apiFetch<ApiEnvelope<ActivityImage>>(
    `/admin/activities/${activityId}/images/${imageId}`,
    { method: 'PATCH', body: input },
  );
  return res.data;
}

/** DELETE /admin/activities/:id/images/:imageId */
export async function deleteActivityImage(activityId: string, imageId: string): Promise<void> {
  await apiFetch<ApiEnvelope<{ ok: true }>>(
    `/admin/activities/${activityId}/images/${imageId}`,
    { method: 'DELETE' },
  );
}

/** GET /admin/activities/:id/attendees */
export async function fetchActivityAttendees(activityId: string): Promise<ActivityAttendee[]> {
  const res = await apiFetch<ApiEnvelope<ActivityAttendee[]>>(
    `/admin/activities/${activityId}/attendees`,
  );
  return res.data;
}

/** DELETE /admin/activities/:id/attendees/:userId */
export async function removeActivityAttendee(activityId: string, userId: string): Promise<void> {
  await apiFetch<ApiEnvelope<{ ok: true }>>(
    `/admin/activities/${activityId}/attendees/${userId}`,
    { method: 'DELETE' },
  );
}
