'use client';

import { cn } from '@/lib/utils';
import type {
  InvitationBatchStatus,
  InvitationItemStatus,
  InvitationRecipientSource,
  InvitationSentBy,
  InvitationTargets,
} from '@/lib/activity/invitation-types';

export function invitationDisplayName(u: {
  firstName: string;
  lastName: string;
  nickname?: string | null;
}): string {
  return u.nickname?.trim() || `${u.firstName} ${u.lastName}`.trim();
}

const BATCH_STATUS: Record<
  InvitationBatchStatus,
  { label: string; className: string }
> = {
  PENDING: {
    label: 'รอดำเนินการ',
    className: 'bg-muted text-muted-foreground',
  },
  SENDING: {
    label: 'กำลังส่ง',
    className: 'bg-amber-500/12 text-amber-700 dark:text-amber-400',
  },
  COMPLETED: {
    label: 'สำเร็จ',
    className: 'bg-emerald-500/12 text-emerald-700 dark:text-emerald-400',
  },
  FAILED: {
    label: 'ล้มเหลว',
    className: 'bg-destructive/12 text-destructive',
  },
};

const ITEM_STATUS: Record<
  InvitationItemStatus,
  { label: string; className: string }
> = {
  SENT: {
    label: 'ส่งแล้ว',
    className: 'bg-emerald-500/12 text-emerald-700 dark:text-emerald-400',
  },
  FAILED: {
    label: 'ล้มเหลว',
    className: 'bg-destructive/12 text-destructive',
  },
  SKIPPED: {
    label: 'ข้าม',
    className: 'bg-muted text-muted-foreground',
  },
  PENDING: {
    label: 'รอส่ง',
    className: 'bg-amber-500/12 text-amber-700 dark:text-amber-400',
  },
};

const SKIP_REASONS: Record<string, string> = {
  INACTIVE: 'บัญชีไม่ active',
  RECENTLY_INVITED: 'ได้รับเชิญเมื่อเร็ว ๆ นี้',
  NO_EMAIL: 'ไม่มีอีเมล',
};

export function InvitationBatchStatusBadge({ status }: { status?: InvitationBatchStatus }) {
  if (!status) return null;
  const cfg = BATCH_STATUS[status];
  return (
    <span className={cn('inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold', cfg.className)}>
      {cfg.label}
    </span>
  );
}

export function InvitationItemStatusBadge({ status }: { status: InvitationItemStatus }) {
  const cfg = ITEM_STATUS[status];
  return (
    <span className={cn('inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold', cfg.className)}>
      {cfg.label}
    </span>
  );
}

export function formatInvitationTargets(targets: InvitationTargets): string {
  const parts: string[] = [];
  const users = targets.userIds?.length ?? 0;
  const positions = targets.positionIds?.length ?? 0;
  const branches = targets.branchIds?.length ?? 0;
  if (users > 0) parts.push(`${users} คน`);
  if (positions > 0) parts.push(`${positions} ตำแหน่ง`);
  if (branches > 0) parts.push(`${branches} สาขา`);
  return parts.length > 0 ? parts.join(' · ') : '—';
}

export function formatSentBy(sentBy: InvitationSentBy | null): string {
  if (!sentBy) return '—';
  return invitationDisplayName(sentBy);
}

export function humanizeSkipReason(reason: string): string {
  return SKIP_REASONS[reason] ?? reason;
}

export const SOURCE_LABELS: Record<InvitationRecipientSource, string> = {
  users: 'รายบุคคล',
  positions: 'ตำแหน่ง',
  branches: 'สาขา',
};

export function buildInvitationTargets(
  userIds: string[],
  positionIds: string[],
  branchIds: string[],
): InvitationTargets {
  return {
    ...(userIds.length > 0 ? { userIds } : {}),
    ...(positionIds.length > 0 ? { positionIds } : {}),
    ...(branchIds.length > 0 ? { branchIds } : {}),
  };
}

export function hasInvitationTargets(targets: InvitationTargets): boolean {
  return (
    (targets.userIds?.length ?? 0) +
    (targets.positionIds?.length ?? 0) +
    (targets.branchIds?.length ?? 0) >
    0
  );
}

export function humanizeInvitationError(err: unknown): string {
  const e = err as { message?: string; code?: string };
  const map: Record<string, string> = {
    NOT_FOUND: 'ไม่พบข้อมูลการส่งเชิญ',
    EMPTY_TARGETS: 'กรุณาเลือกเป้าหมายอย่างน้อย 1 รายการ',
    NO_RECIPIENTS: 'ไม่มีผู้รับที่จะส่งเชิญ',
    INVALID_TARGET: 'เป้าหมายบางรายการไม่มีในระบบ',
    BATCH_TOO_LARGE: 'จำนวนผู้รับเกิน 500 คน — กรุณาแบ่งส่ง',
    ACTIVITY_NOT_INVITABLE: 'กิจกรรมนี้ไม่สามารถส่งเชิญได้ (ปิดใช้งานหรือจบแล้ว)',
    POLL_TIMEOUT: 'การส่งใช้เวลานาน — ตรวจสอบสถานะในประวัติ',
  };
  if (e?.code && map[e.code]) return map[e.code];
  return e?.message?.trim() || 'เกิดข้อผิดพลาด กรุณาลองใหม่';
}
