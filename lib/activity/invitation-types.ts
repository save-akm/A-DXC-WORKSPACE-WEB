// lib/activity/invitation-types.ts — activity email invitation API shapes.

import type { ApiEnvelope } from '@/lib/activity/types';

export type { ApiEnvelope };

export interface InvitationTargets {
  userIds?: string[];
  positionIds?: string[];
  branchIds?: string[];
}

export type InvitationRecipientSource = 'users' | 'positions' | 'branches';

export type InvitationSkipReason = 'INACTIVE' | 'RECENTLY_INVITED' | 'NO_EMAIL';

/** Per-recipient status in batch detail. */
export type InvitationItemStatus = 'PENDING' | 'SENT' | 'FAILED' | 'SKIPPED';

/** Batch-level status. */
export type InvitationBatchStatus = 'PENDING' | 'SENDING' | 'COMPLETED' | 'FAILED';

export interface InvitationPreviewActivity {
  id: string;
  name: string;
  eventStartAt: string;
  eventEndAt?: string | null;
  location: string | null;
}

export interface InvitationPreviewSummary {
  totalUnique: number;
  bySource: { users: number; positions: number; branches: number };
  overlapExcluded: number;
  willSend: number;
  willSkip: number;
}

export interface InvitationPreviewRecipient {
  userId: string;
  email: string;
  firstName: string;
  lastName: string;
  employeeId: string;
  position: { id: string; name: string } | null;
  branch: { id: string; name: string } | null;
  sources: InvitationRecipientSource[];
}

export interface InvitationSkippedRecipient {
  userId?: string;
  email?: string;
  reason: InvitationSkipReason;
}

export interface InvitationPreviewResult {
  activity: InvitationPreviewActivity;
  summary: InvitationPreviewSummary;
  recipients: InvitationPreviewRecipient[];
  skipped: InvitationSkippedRecipient[];
}

export interface SendActivityInvitationInput {
  targets: InvitationTargets;
  subject?: string;
  message?: string;
  /** 0–168, default 24 */
  excludeRecentlyInvitedHours?: number;
}

export interface InvitationSendSummary {
  recipientCount: number;
  sent: number;
  failed: number;
  skipped: number;
}

export interface InvitationFailedRecipient {
  userId: string;
  email: string;
  error: string;
}

export interface InvitationSendResult {
  batchId: string;
  activityId: string;
  activityUrl: string;
  status: InvitationBatchStatus;
  summary: InvitationSendSummary;
  failedRecipients?: InvitationFailedRecipient[];
}

export interface InvitationSentBy {
  id: string;
  firstName: string;
  lastName: string;
  employeeId: string;
}

export interface InvitationBatchListItem {
  id: string;
  subject: string;
  message: string | null;
  targets: InvitationTargets;
  status: InvitationBatchStatus;
  recipientCount: number;
  sentCount: number;
  failedCount: number;
  skippedCount: number;
  sentBy: InvitationSentBy | null;
  createdAt: string;
  completedAt: string | null;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
}

export interface InvitationHistoryResult {
  items: InvitationBatchListItem[];
  pagination: PaginationMeta;
}

export type InvitationBatchDetail = InvitationBatchListItem;

export interface InvitationDetailUser {
  id: string;
  firstName: string;
  lastName: string;
  employeeId: string;
}

export interface InvitationDetailItem {
  id: string;
  email: string;
  status: InvitationItemStatus;
  sources: InvitationRecipientSource[];
  skipReason: InvitationSkipReason | null;
  errorMessage: string | null;
  sentAt: string | null;
  user: InvitationDetailUser | null;
}

export interface InvitationBatchDetailResult {
  batch: InvitationBatchDetail;
  invitations: InvitationDetailItem[];
  pagination: PaginationMeta;
}

export interface InvitationHistoryFilters {
  page?: number;
  limit?: number;
}

export interface InvitationBatchFilters {
  status?: InvitationItemStatus;
  page?: number;
  limit?: number;
}

export interface InvitationPreviewOptions {
  limit?: number;
}

export interface InvitationRecipientOption {
  id: string;
  code: string;
  name: string;
  activeUserCount: number;
}

export interface InvitationRecipientOptionsResult {
  positions: InvitationRecipientOption[];
  branches: InvitationRecipientOption[];
}

export function isInvitationBatchInProgress(status?: InvitationBatchStatus): boolean {
  return status === 'PENDING' || status === 'SENDING';
}
