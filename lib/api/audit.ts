import { apiFetch } from '@/lib/auth/client';
import type {
  AuditLog,
  AuditLogsPage,
  AuditLogsQuery,
  LoginLog,
  LoginLogsPage,
  LoginLogsQuery,
} from '@/lib/audit/types';

interface Envelope<T> {
  status: string;
  message?: string;
  data: T;
}

function buildQuery(params: Record<string, string | number | undefined>): string {
  const qs = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === '' || value === null) continue;
    qs.set(key, String(value));
  }
  const str = qs.toString();
  return str ? `?${str}` : '';
}

// ── Audit logs ──────────────────────────────────────────────────────────────

/** GET /audit/audit-logs — paginated, filterable audit trail. */
export async function fetchAuditLogs(query: AuditLogsQuery = {}): Promise<AuditLogsPage> {
  const qs = buildQuery({
    page: query.page ?? 1,
    limit: query.limit ?? 20,
    action: query.action,
    entityType: query.entityType,
    actorId: query.actorId,
    entityId: query.entityId,
    search: query.search?.trim() || undefined,
    from: query.from,
    to: query.to,
  });
  const res = await apiFetch<Envelope<AuditLogsPage>>(`/audit/audit-logs${qs}`);
  return res.data;
}

/** GET /audit/audit-logs/:id — single record incl. before/after snapshots. */
export async function fetchAuditLog(id: string): Promise<AuditLog> {
  const res = await apiFetch<Envelope<AuditLog>>(`/audit/audit-logs/${id}`);
  return res.data;
}

// ── Login logs ──────────────────────────────────────────────────────────────

/** GET /audit/login-logs — paginated, filterable login attempts. */
export async function fetchLoginLogs(query: LoginLogsQuery = {}): Promise<LoginLogsPage> {
  const qs = buildQuery({
    page: query.page ?? 1,
    limit: query.limit ?? 20,
    status: query.status,
    userId: query.userId,
    identifier: query.identifier,
    search: query.search?.trim() || undefined,
    from: query.from,
    to: query.to,
  });
  const res = await apiFetch<Envelope<LoginLogsPage>>(`/audit/login-logs${qs}`);
  return res.data;
}

/** GET /audit/login-logs/:id — single attempt (same fields as the list item). */
export async function fetchLoginLog(id: string): Promise<LoginLog> {
  const res = await apiFetch<Envelope<LoginLog>>(`/audit/login-logs/${id}`);
  return res.data;
}