import { apiFetch } from '@/lib/auth/client';
import type {
  AdminNotification,
  AdminNotificationDetail,
  AdminNotificationsPage,
  AdminNotificationsQuery,
  CreateNotificationInput,
  CreateTemplateInput,
  NotificationTemplate,
  UpdateTemplateInput,
} from '@/lib/notifications/types';

interface Envelope<T> {
  status: string;
  message?: string;
  data: T;
}

function buildQuery(params: Record<string, string | number | boolean | undefined>): string {
  const qs = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === '' || value === null) continue;
    qs.set(key, String(value));
  }
  const str = qs.toString();
  return str ? `?${str}` : '';
}

// ── Notifications ─────────────────────────────────────────────────────────────

/** GET /admin/notifications — paginated catalogue of every dispatched/scheduled notification. */
export async function fetchAdminNotifications(
  query: AdminNotificationsQuery = {},
): Promise<AdminNotificationsPage> {
  const qs = buildQuery({
    page: query.page ?? 1,
    limit: query.limit ?? 20,
    type: query.type,
    targetScope: query.targetScope,
    channel: query.channel,
    isSent: query.isSent,
    fanOutStatus: query.fanOutStatus,
  });
  // Envelope nests the page object under `data`: { data: { data: [...], total, page, limit } }.
  const res = await apiFetch<Envelope<AdminNotificationsPage>>(`/admin/notifications${qs}`);
  const p = res.data;
  return {
    data: Array.isArray(p?.data) ? p.data : [],
    total: p?.total ?? 0,
    page: p?.page ?? query.page ?? 1,
    limit: p?.limit ?? query.limit ?? 20,
  };
}

/** GET /admin/notifications/:id — detail incl. first 50 recipients + target roles. */
export async function fetchAdminNotification(id: string): Promise<AdminNotificationDetail> {
  const res = await apiFetch<Envelope<AdminNotificationDetail>>(`/admin/notifications/${id}`);
  return res.data;
}

/** POST /admin/notifications — compose & dispatch (permission: CREATE). */
export async function createNotification(
  input: CreateNotificationInput,
): Promise<AdminNotification> {
  const res = await apiFetch<Envelope<AdminNotification>>('/admin/notifications', {
    method: 'POST',
    body: input,
  });
  return res.data;
}

// ── Templates ─────────────────────────────────────────────────────────────────

/** GET /admin/notification-templates */
export async function fetchTemplates(): Promise<NotificationTemplate[]> {
  const res = await apiFetch<Envelope<NotificationTemplate[]>>('/admin/notification-templates');
  return res.data;
}

/** GET /admin/notification-templates/:id */
export async function fetchTemplate(id: string): Promise<NotificationTemplate> {
  const res = await apiFetch<Envelope<NotificationTemplate>>(`/admin/notification-templates/${id}`);
  return res.data;
}

/** POST /admin/notification-templates (permission: CREATE) */
export async function createTemplate(input: CreateTemplateInput): Promise<NotificationTemplate> {
  const res = await apiFetch<Envelope<NotificationTemplate>>('/admin/notification-templates', {
    method: 'POST',
    body: input,
  });
  return res.data;
}

/** PATCH /admin/notification-templates/:id (permission: UPDATE) */
export async function updateTemplate(
  id: string,
  input: UpdateTemplateInput,
): Promise<NotificationTemplate> {
  const res = await apiFetch<Envelope<NotificationTemplate>>(`/admin/notification-templates/${id}`, {
    method: 'PATCH',
    body: input,
  });
  return res.data;
}

/** DELETE /admin/notification-templates/:id (permission: DELETE) */
export async function deleteTemplate(id: string): Promise<void> {
  await apiFetch<Envelope<{ ok: boolean }>>(`/admin/notification-templates/${id}`, {
    method: 'DELETE',
  });
}
