import { apiFetch } from '@/lib/auth/client';
import type {
  ApiEnvelope,
  Announcement,
  AnnouncementFilters,
  CreateAnnouncementInput,
  UpdateAnnouncementInput,
} from '@/lib/announcements/types';

// ── Public (no auth) — sorted with isPriority first ─────────────────────────────────

/**
 * GET /announcements — public. isActive announcements that have not ended yet
 * (endsAt >= now, or null). Used by the landing page list.
 */
export async function fetchAnnouncements(): Promise<Announcement[]> {
  const res = await apiFetch<ApiEnvelope<Announcement[]>>('/announcements', { auth: false });
  return res.data;
}

/**
 * GET /announcements/active — auth. isActive announcements currently inside
 * their schedule window (startsAt/endsAt) that the current user has NOT dismissed.
 * Used by the in-app banner. The backend filters out per-user dismissals.
 */
export async function fetchActiveAnnouncements(): Promise<Announcement[]> {
  const res = await apiFetch<ApiEnvelope<Announcement[]>>('/announcements/active');
  return res.data;
}

/**
 * POST /announcements/dismiss — auth. Mark announcements as dismissed for the
 * current user so they stop appearing in the banner (persists across devices).
 */
export async function dismissAnnouncements(ids: string[]): Promise<void> {
  if (ids.length === 0) return;
  await apiFetch<ApiEnvelope<{ ok: true }>>('/announcements/dismiss', {
    method: 'POST',
    body: { ids },
  });
}

// ── Admin — requires permission `announcements` ────────────────────────────────────

/** Serialize optional filters into a query string. */
function buildQuery(filters?: AnnouncementFilters): string {
  if (!filters) return '';
  const qs = new URLSearchParams();
  if (filters.type) qs.set('type', filters.type);
  if (filters.level) qs.set('level', filters.level);
  if (typeof filters.isActive === 'boolean') qs.set('isActive', String(filters.isActive));
  if (typeof filters.isPriority === 'boolean') qs.set('isPriority', String(filters.isPriority));
  if (typeof filters.notExpired === 'boolean') qs.set('notExpired', String(filters.notExpired));
  const q = qs.toString();
  return q ? `?${q}` : '';
}

/** GET /admin/announcements — all announcements, with optional filters (VIEW). */
export async function fetchAdminAnnouncements(filters?: AnnouncementFilters): Promise<Announcement[]> {
  const res = await apiFetch<ApiEnvelope<Announcement[]>>(`/admin/announcements${buildQuery(filters)}`);
  return res.data;
}

/** GET /admin/announcements/:id — a single announcement (VIEW). */
export async function fetchAdminAnnouncement(id: string): Promise<Announcement> {
  const res = await apiFetch<ApiEnvelope<Announcement>>(`/admin/announcements/${id}`);
  return res.data;
}

/** POST /admin/announcements — create (CREATE). */
export async function createAnnouncement(input: CreateAnnouncementInput): Promise<Announcement> {
  const res = await apiFetch<ApiEnvelope<Announcement>>('/admin/announcements', {
    method: 'POST',
    body: input,
  });
  return res.data;
}

/** PATCH /admin/announcements/:id — partial update, min 1 field (UPDATE). */
export async function updateAnnouncement(id: string, input: UpdateAnnouncementInput): Promise<Announcement> {
  const res = await apiFetch<ApiEnvelope<Announcement>>(`/admin/announcements/${id}`, {
    method: 'PATCH',
    body: input,
  });
  return res.data;
}

/** DELETE /admin/announcements/:id — delete (DELETE). */
export async function deleteAnnouncement(id: string): Promise<void> {
  await apiFetch<ApiEnvelope<{ ok: true }>>(`/admin/announcements/${id}`, { method: 'DELETE' });
}
