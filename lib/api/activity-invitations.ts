import { apiFetch } from '@/lib/auth/client';
import {
  isInvitationBatchInProgress,
  type ApiEnvelope,
  type InvitationBatchDetailResult,
  type InvitationBatchFilters,
  type InvitationBatchStatus,
  type InvitationHistoryFilters,
  type InvitationHistoryResult,
  type InvitationPreviewOptions,
  type InvitationPreviewResult,
  type InvitationRecipientOptionsResult,
  type InvitationSendResult,
  type InvitationTargets,
  type SendActivityInvitationInput,
} from '@/lib/activity/invitation-types';

function buildQuery(params: Record<string, string | number | undefined>): string {
  const qs = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== '') qs.set(key, String(value));
  }
  const q = qs.toString();
  return q ? `?${q}` : '';
}

/** POST /admin/activities/:id/invitations/preview — Permission: activity UPDATE */
export async function previewActivityInvitations(
  activityId: string,
  targets: InvitationTargets,
  options?: InvitationPreviewOptions,
): Promise<InvitationPreviewResult> {
  const res = await apiFetch<ApiEnvelope<InvitationPreviewResult>>(
    `/admin/activities/${activityId}/invitations/preview${buildQuery({ limit: options?.limit })}`,
    { method: 'POST', body: { targets } },
  );
  return res.data;
}

/** POST /admin/activities/:id/invitations — Permission: activity UPDATE */
export async function sendActivityInvitations(
  activityId: string,
  input: SendActivityInvitationInput,
): Promise<InvitationSendResult> {
  const res = await apiFetch<ApiEnvelope<InvitationSendResult>>(
    `/admin/activities/${activityId}/invitations`,
    { method: 'POST', body: input },
  );
  return res.data;
}

/** GET /admin/activities/:id/invitations — Permission: activity VIEW */
export async function fetchActivityInvitationHistory(
  activityId: string,
  filters?: InvitationHistoryFilters,
): Promise<InvitationHistoryResult> {
  const res = await apiFetch<ApiEnvelope<InvitationHistoryResult>>(
    `/admin/activities/${activityId}/invitations${buildQuery({
      page: filters?.page,
      limit: filters?.limit,
    })}`,
  );
  return res.data;
}

/** GET /admin/activities/:id/invitations/:batchId — Permission: activity VIEW */
export async function fetchActivityInvitationBatch(
  activityId: string,
  batchId: string,
  filters?: InvitationBatchFilters,
): Promise<InvitationBatchDetailResult> {
  const res = await apiFetch<ApiEnvelope<InvitationBatchDetailResult>>(
    `/admin/activities/${activityId}/invitations/${batchId}${buildQuery({
      status: filters?.status,
      page: filters?.page,
      limit: filters?.limit,
    })}`,
  );
  return res.data;
}

/** GET /admin/activities/:id/invitations/recipient-options — Permission: activity VIEW */
export async function fetchInvitationRecipientOptions(
  activityId: string,
): Promise<InvitationRecipientOptionsResult> {
  const res = await apiFetch<ApiEnvelope<InvitationRecipientOptionsResult>>(
    `/admin/activities/${activityId}/invitations/recipient-options`,
  );
  return res.data;
}

/** Poll batch detail until status is terminal (COMPLETED | FAILED). */
export async function pollActivityInvitationBatch(
  activityId: string,
  batchId: string,
  options?: { intervalMs?: number; maxAttempts?: number },
): Promise<InvitationBatchDetailResult> {
  const intervalMs = options?.intervalMs ?? 2000;
  const maxAttempts = options?.maxAttempts ?? 90;

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const data = await fetchActivityInvitationBatch(activityId, batchId, { limit: 1 });
    if (!isInvitationBatchInProgress(data.batch.status)) return data;
    await new Promise((resolve) => setTimeout(resolve, intervalMs));
  }

  const err = new Error('การส่งเชิญใช้เวลานาน — ตรวจสอบสถานะในประวัติ') as Error & {
    code: string;
  };
  err.code = 'POLL_TIMEOUT';
  throw err;
}

export function mergeSendResultWithBatch(
  send: InvitationSendResult,
  batch: InvitationBatchDetailResult['batch'],
): InvitationSendResult {
  return {
    ...send,
    status: batch.status as InvitationBatchStatus,
    summary: {
      recipientCount: batch.recipientCount,
      sent: batch.sentCount,
      failed: batch.failedCount,
      skipped: batch.skippedCount,
    },
  };
}

export { isInvitationBatchInProgress };
