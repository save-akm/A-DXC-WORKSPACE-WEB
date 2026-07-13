// ── Audit logs ──────────────────────────────────────────────────────────────

export const AUDIT_ACTIONS = [
  'CREATE',
  'UPDATE',
  'DELETE',
  'RESTORE',
  'LOGIN',
  'LOGOUT',
  'PASSWORD_CHANGE',
  'PASSWORD_RESET',
  'OTP_REQUESTED',
  'ROLE_CHANGE',
  'TEAM_JOIN',
  'TEAM_LEAVE',
] as const;

export type AuditAction = (typeof AUDIT_ACTIONS)[number];

/** Arbitrary JSON snapshot stored in before/after/metadata. */
export type JsonRecord = Record<string, unknown> | null;

export interface AuditActor {
  id: string | null;
  email: string | null;
  employeeId: string | null;
  name: string | null;
}

/** One field-level change from the detail endpoint's `changes` array. */
export interface AuditChange {
  field: string;
  before: unknown;
  after: unknown;
}

/**
 * Shared between list and detail. List rows are lightweight — they carry
 * `changedFields`/`changeCount`/`hasSnapshot` but omit the full snapshot. The
 * detail endpoint (`/:id`) adds `before`, `after`, `changes`, and `userAgent`.
 */
export interface AuditLog {
  id: string;
  actor: AuditActor | null;
  action: AuditAction;
  entityType: string | null;
  entityId: string | null;
  metadata: JsonRecord;
  ipAddress: string | null;
  createdAt: string;
  hasSnapshot: boolean;
  changedFields: string[];
  changeCount: number;
  // ── detail-only ──
  before?: JsonRecord;
  after?: JsonRecord;
  changes?: AuditChange[];
  userAgent?: string | null;
}

export interface AuditLogsPage {
  logs: AuditLog[];
  total: number;
  page: number;
  limit: number;
}

export interface AuditLogsQuery {
  page?: number;
  limit?: number;
  action?: AuditAction;
  entityType?: string;
  actorId?: string;
  entityId?: string;
  search?: string;
  from?: string;
  to?: string;
}

// ── Login logs ──────────────────────────────────────────────────────────────

export const LOGIN_STATUSES = ['SUCCESS', 'FAILURE', 'BLOCKED'] as const;
export type LoginStatus = (typeof LOGIN_STATUSES)[number];

export type LoginFailureReason =
  | 'wrong_password'
  | 'wrong_2fa_pin'
  | 'user_not_found'
  | 'suspended'
  | 'terminated'
  | 'locked'
  | (string & {});

export interface LoginLogUser {
  id: string;
  email: string;
  employeeId: string | null;
  firstName: string | null;
  lastName: string | null;
}

export interface LoginLog {
  id: string;
  identifier: string;
  userId: string | null;
  status: LoginStatus;
  failureReason: LoginFailureReason | null;
  ipAddress: string | null;
  userAgent: string | null;
  deviceType: string | null;
  browser: string | null;
  os: string | null;
  location: string | null;
  createdAt: string;
  user: LoginLogUser | null;
}

export interface LoginLogsPage {
  logs: LoginLog[];
  total: number;
  page: number;
  limit: number;
}

export interface LoginLogsQuery {
  page?: number;
  limit?: number;
  status?: LoginStatus;
  userId?: string;
  identifier?: string;
  search?: string;
  from?: string;
  to?: string;
}