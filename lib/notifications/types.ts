// Notification domain types — shared by the inbox (/notifications) and the
// admin console (/admin/notification). Mirrors the backend response envelope
// `{ status, message, data, timestamp }` (the `data` shapes are below).

// ── Enums ─────────────────────────────────────────────────────────────────────

/**
 * Types an admin may pick in the composer. System-generated types
 * (chat, knowledge) are excluded — nobody hand-authors those.
 */
export const COMPOSABLE_NOTIFICATION_TYPES = [
  'WORKFLOW',
  'SYSTEM',
  'SECURITY',
  'ANNOUNCEMENT',
  'REMINDER',
  'ALERT',
] as const;

/** Every type the backend may emit — drives the inbox filter and all styling. */
export const NOTIFICATION_TYPES = [
  ...COMPOSABLE_NOTIFICATION_TYPES,
  'CHAT_MESSAGE',
  'CHAT_MENTION',
  'KNOWLEDGE_COMMENT',
  'KNOWLEDGE_REACTION',
] as const;
export type NotificationType = (typeof NOTIFICATION_TYPES)[number];
export type ComposableNotificationType = (typeof COMPOSABLE_NOTIFICATION_TYPES)[number];

/**
 * Selectable priorities in the composer — the canonical set sent to the backend.
 * The backend schema's top tier is `CRITICAL`.
 */
export const NOTIFICATION_PRIORITIES = ['LOW', 'NORMAL', 'HIGH', 'CRITICAL'] as const;

/**
 * Every priority value the backend may emit. `URGENT` is kept as a display alias
 * for `CRITICAL` so inbound payloads using either string render correctly.
 */
export type NotificationPriority = (typeof NOTIFICATION_PRIORITIES)[number] | 'URGENT';

export const NOTIFICATION_CHANNELS = ['IN_APP', 'EMAIL', 'BOTH'] as const;
export type NotificationChannel = (typeof NOTIFICATION_CHANNELS)[number];

export const TARGET_SCOPES = ['SYSTEM', 'ROLE', 'PERSONAL'] as const;
export type TargetScope = (typeof TARGET_SCOPES)[number];

export const FANOUT_STATUSES = ['PENDING', 'PROCESSING', 'COMPLETED', 'FAILED'] as const;
export type FanOutStatus = (typeof FANOUT_STATUSES)[number];

export type JsonRecord = Record<string, unknown> | null;

// ── Inbox ─────────────────────────────────────────────────────────────────────

/** The notification payload nested inside each inbox recipient row. */
export interface Notification {
  id: string;
  header: string;
  detail: string;
  icon: string | null;
  type: NotificationType;
  priority: NotificationPriority;
  channel: NotificationChannel;
  sourceType: string | null;
  sourceId: string | null;
  actionUrl: string | null;
  expiresAt: string | null;
  sentAt: string | null;
  createdAt: string;
}

/**
 * One row in the user's inbox. `id` is the **recipientId** — the handle every
 * read/dismiss mutation expects, NOT `notification.id`.
 */
export interface InboxItem {
  id: string;
  isRead: boolean;
  readAt: string | null;
  isDismissed: boolean;
  dismissedAt: string | null;
  createdAt: string;
  notification: Notification;
}

export interface InboxPage {
  data: InboxItem[];
  total: number;
  page: number;
  limit: number;
}

export interface InboxQuery {
  page?: number;
  limit?: number;
  unreadOnly?: boolean;
  type?: NotificationType;
}

// ── Mutation results ──────────────────────────────────────────────────────────

export interface UnreadCountResult {
  unreadCount: number;
}
export interface ReadResult {
  ok: boolean;
  unreadCount: number;
}
export interface ReadAllResult {
  ok: boolean;
  marked: number;
  unreadCount: number;
}
export interface DismissResult {
  ok: boolean;
  unreadCount: number;
}
export interface DismissAllResult {
  ok: boolean;
  dismissed: number;
  unreadCount: number;
}

// ── Socket payloads (room user:{userId}) ──────────────────────────────────────

export interface NotificationNewEvent {
  recipientId: string;
  notificationId: string;
  userId: string;
  header: string;
  detail: string;
  icon: string | null;
  type: NotificationType;
  priority: NotificationPriority;
  sourceType: string | null;
  sourceId: string | null;
  actionUrl: string | null;
  isRead: boolean;
  createdAt: string;
  /** Authoritative badge count — prefer this over incrementing locally. */
  unreadCount?: number;
  metadata?: JsonRecord;
}

/**
 * An existing unread notification was rewritten in place (aggregation), e.g.
 * `KNOWLEDGE_REACTION` folds every reaction on one post into a single row.
 * Same payload shape as `notification:new`; the badge count does NOT rise.
 */
export type NotificationUpdatedEvent = NotificationNewEvent;

/** `metadata` shape on aggregated KNOWLEDGE_REACTION notifications. */
export interface KnowledgeReactionMetadata {
  reactionCount: number;
  latestReactionType: string;
  latestActorUserId: string;
}

export interface NotificationReadEvent {
  userId: string;
  recipientIds: string[];
  unreadCount: number;
}
export interface NotificationDismissedEvent {
  userId: string;
  unreadCount: number;
}

// ── Admin: notifications ──────────────────────────────────────────────────────

export interface AdminNotification {
  id: string;
  header: string;
  detail: string;
  icon: string | null;
  type: NotificationType;
  priority: NotificationPriority;
  channel: NotificationChannel;
  targetScope: TargetScope;
  sourceType: string | null;
  sourceId: string | null;
  actionUrl: string | null;
  metadata: JsonRecord;
  isSent: boolean;
  fanOutStatus: FanOutStatus;
  scheduledAt: string | null;
  sentAt: string | null;
  expiresAt: string | null;
  createdAt: string;
  _count?: { recipients?: number; targetRoles?: number };
}

export interface AdminNotificationRecipient {
  id: string;
  isRead: boolean;
  readAt: string | null;
  isDismissed: boolean;
  user: {
    id: string;
    firstName: string | null;
    lastName: string | null;
    email: string | null;
    employeeId: string | null;
    avatarUrl: string | null;
  } | null;
}

export interface AdminNotificationTargetRole {
  id: string;
  role: { id: string; name: string; color: string | null } | null;
}

export interface AdminNotificationDetail extends AdminNotification {
  recipients: AdminNotificationRecipient[];
  targetRoles: AdminNotificationTargetRole[];
}

export interface AdminNotificationsPage {
  data: AdminNotification[];
  total: number;
  page: number;
  limit: number;
}

export interface AdminNotificationsQuery {
  page?: number;
  limit?: number;
  type?: NotificationType;
  targetScope?: TargetScope;
  channel?: NotificationChannel;
  isSent?: boolean;
  fanOutStatus?: FanOutStatus;
}

export interface CreateNotificationInput {
  header: string;
  detail: string;
  type: NotificationType;
  targetScope: TargetScope;
  channel?: NotificationChannel;
  priority?: NotificationPriority;
  userIds?: string[];
  roleIds?: string[];
  icon?: string | null;
  sourceType?: string | null;
  sourceId?: string | null;
  actionUrl?: string | null;
  metadata?: Record<string, unknown> | null;
  scheduledAt?: string | null;
  expiresAt?: string | null;
}

// ── Admin: templates ──────────────────────────────────────────────────────────

export interface NotificationTemplate {
  id: string;
  code: string;
  name: string;
  defaultChannel: NotificationChannel;
  defaultType: NotificationType;
  defaultPriority: NotificationPriority;
  headerTemplate: string;
  detailTemplate: string;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateTemplateInput {
  code: string;
  name: string;
  defaultChannel?: NotificationChannel;
  defaultType?: NotificationType;
  defaultPriority?: NotificationPriority;
  headerTemplate: string;
  detailTemplate: string;
  isActive?: boolean;
}

export type UpdateTemplateInput = Partial<CreateTemplateInput>;
