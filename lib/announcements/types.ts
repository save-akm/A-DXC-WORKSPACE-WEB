// lib/announcements/types.ts
//
// Shared types for the Announcements feature — the public banner endpoint
// (GET /announcements/active) and the admin CRUD surface
// (GET/POST/PATCH/DELETE /admin/announcements).

// ── Generic API envelope ────────────────────────────────────────────────────────

export interface ApiEnvelope<T> {
  status: string;
  message?: string;
  code?: string;
  timestamp?: string;
  data: T;
}

// ── Enums ───────────────────────────────────────────────────────────────────────

export type AnnouncementType =
  | 'NEW_RELEASE'
  | 'MAINTENANCE'
  | 'NOTICE'
  | 'EVENT'
  | 'SECURITY_ALERT';

export type AnnouncementLevel = 'CRITICAL' | 'URGENT' | 'NEW' | 'NOTICE';

export const ANNOUNCEMENT_TYPES: AnnouncementType[] = [
  'NEW_RELEASE',
  'MAINTENANCE',
  'NOTICE',
  'EVENT',
  'SECURITY_ALERT',
];

export const ANNOUNCEMENT_LEVELS: AnnouncementLevel[] = [
  'CRITICAL',
  'URGENT',
  'NEW',
  'NOTICE',
];

// ── Entities ──────────────────────────────────────────────────────────────────────

/** The user who authored an announcement (subset returned by the API). */
export interface AnnouncementAuthor {
  id: string;
  firstName: string;
  lastName: string;
  employeeId: string;
}

/** A single announcement record. */
export interface Announcement {
  id: string;
  header: string;
  detail: string;
  type: AnnouncementType;
  level: AnnouncementLevel;
  icon: string | null;
  isPriority: boolean;
  isActive: boolean;
  startsAt: string | null;
  endsAt: string | null;
  createdAt: string;
  updatedAt: string;
  createdBy: AnnouncementAuthor | null;
}

// ── Mutations ─────────────────────────────────────────────────────────────────────

export interface CreateAnnouncementInput {
  header: string;
  detail: string;
  type: AnnouncementType;
  level: AnnouncementLevel;
  icon?: string | null;
  isPriority?: boolean;
  isActive?: boolean;
  startsAt?: string | null;
  endsAt?: string | null;
}

/** Every field optional — PATCH sends only what changed (min 1 field). */
export type UpdateAnnouncementInput = Partial<CreateAnnouncementInput>;

// ── Admin list filters (GET /admin/announcements query params) ─────────────────────

export interface AnnouncementFilters {
  type?: AnnouncementType;
  level?: AnnouncementLevel;
  isActive?: boolean;
  isPriority?: boolean;
  /** Only announcements whose schedule window has not ended yet. */
  notExpired?: boolean;
}

// ── Derived display state ──────────────────────────────────────────────────────────

/**
 * The effective publication state, derived from `isActive` + the schedule
 * window relative to "now". This is what actually decides whether a banner is
 * visible on the public endpoint.
 */
export type AnnouncementState = 'LIVE' | 'SCHEDULED' | 'EXPIRED' | 'INACTIVE';

/** Resolve the effective state of an announcement at a given moment. */
export function getAnnouncementState(a: Announcement, now: number = Date.now()): AnnouncementState {
  if (!a.isActive) return 'INACTIVE';
  if (a.startsAt && new Date(a.startsAt).getTime() > now) return 'SCHEDULED';
  if (a.endsAt && new Date(a.endsAt).getTime() < now) return 'EXPIRED';
  return 'LIVE';
}
