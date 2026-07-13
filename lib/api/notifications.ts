import { apiFetch } from '@/lib/auth/client';
import type {
  DismissAllResult,
  DismissResult,
  InboxPage,
  InboxQuery,
  ReadAllResult,
  ReadResult,
  UnreadCountResult,
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

// ── Inbox ─────────────────────────────────────────────────────────────────────

/** GET /notifications/inbox — the current user's notification feed. */
export async function fetchInbox(query: InboxQuery = {}): Promise<InboxPage> {
  const qs = buildQuery({
    page: query.page ?? 1,
    limit: query.limit ?? 20,
    unreadOnly: query.unreadOnly ? true : undefined,
    type: query.type,
  });
  // Envelope nests the page object under `data`: { data: { data: [...], total, page, limit } }.
  const res = await apiFetch<Envelope<InboxPage>>(`/notifications/inbox${qs}`);
  const p = res.data;
  return {
    data: Array.isArray(p?.data) ? p.data : [],
    total: p?.total ?? 0,
    page: p?.page ?? query.page ?? 1,
    limit: p?.limit ?? query.limit ?? 20,
  };
}

/** GET /notifications/unread-count — badge source of truth. */
export async function fetchUnreadCount(): Promise<number> {
  const res = await apiFetch<Envelope<UnreadCountResult>>('/notifications/unread-count');
  return res.data.unreadCount;
}

/** PATCH /notifications/:recipientId/read — mark one as read. */
export async function markRead(recipientId: string): Promise<ReadResult> {
  const res = await apiFetch<Envelope<ReadResult>>(`/notifications/${recipientId}/read`, {
    method: 'PATCH',
  });
  return res.data;
}

/** PATCH /notifications/read-all — mark every unread as read. */
export async function markAllRead(): Promise<ReadAllResult> {
  const res = await apiFetch<Envelope<ReadAllResult>>('/notifications/read-all', {
    method: 'PATCH',
  });
  return res.data;
}

/** POST /notifications/dismiss — remove one or more from the feed. */
export async function dismissNotifications(ids: string[]): Promise<DismissResult> {
  const res = await apiFetch<Envelope<DismissResult>>('/notifications/dismiss', {
    method: 'POST',
    body: { ids },
  });
  return res.data;
}

/** POST /notifications/dismiss-all — clear the whole feed. */
export async function dismissAll(): Promise<DismissAllResult> {
  const res = await apiFetch<Envelope<DismissAllResult>>('/notifications/dismiss-all', {
    method: 'POST',
  });
  return res.data;
}
