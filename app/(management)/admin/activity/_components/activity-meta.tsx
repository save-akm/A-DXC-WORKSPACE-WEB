'use client';

import { cn } from '@/lib/utils';
import type { ActivityStatus } from '@/lib/activity/types';

export const STATUS_CONFIG: Record<
  ActivityStatus,
  { label: string; className: string; dot: string }
> = {
  UPCOMING: {
    label: 'เร็ว ๆ นี้',
    className: 'bg-sky-500/12 text-sky-700 dark:text-sky-400',
    dot: 'bg-sky-500',
  },
  ONGOING: {
    label: 'กำลังจัด',
    className: 'bg-emerald-500/12 text-emerald-700 dark:text-emerald-400',
    dot: 'bg-emerald-500',
  },
  COMPLETED: {
    label: 'จบแล้ว',
    className: 'bg-muted text-muted-foreground',
    dot: 'bg-muted-foreground/50',
  },
};

export function StatusBadge({ status }: { status: ActivityStatus }) {
  const cfg = STATUS_CONFIG[status];
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[10px] font-semibold',
        cfg.className,
      )}
    >
      <span className={cn('size-1.5 rounded-full', cfg.dot)} />
      {cfg.label}
    </span>
  );
}

export function FeaturedBadge({ featured }: { featured: boolean }) {
  if (!featured) return null;
  return (
    <span className="inline-flex items-center rounded-full bg-amber-500/12 px-2 py-0.5 text-[10px] font-semibold text-amber-700 dark:text-amber-400">
      หน้าบ้าน
    </span>
  );
}

export function TagChip({ name }: { name: string }) {
  return (
    <span className="inline-flex rounded-md bg-muted/80 px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
      {name}
    </span>
  );
}

/** Map backend error codes to Thai messages. */
export function humanizeActivityError(err: unknown): string {
  const e = err as { message?: string; code?: string };
  const code = e?.code ?? '';
  const map: Record<string, string> = {
    NOT_FOUND: 'ไม่พบกิจกรรม',
    NOTHING_TO_UPDATE: 'กรุณาระบุข้อมูลที่ต้องการแก้ไข',
    FEATURED_LIMIT_REACHED: 'ช่องแสดงหน้าบ้านเต็มแล้ว (สูงสุด 5 รายการ)',
    ALREADY_JOINED: 'คุณเข้าร่วมกิจกรรมนี้แล้ว',
    NOT_JOINED: 'คุณยังไม่ได้เข้าร่วมกิจกรรมนี้',
    FULL: 'ที่นั่งเต็มแล้ว',
    CANNOT_JOIN: 'กิจกรรมนี้จบแล้ว ไม่สามารถเข้าร่วมได้',
    NOT_ACTIVE: 'กิจกรรมนี้ปิดใช้งานอยู่',
    TAG_NOT_FOUND: 'ไม่พบแท็ก',
    TAG_IN_USE: 'แท็กนี้ถูกใช้งานอยู่ ไม่สามารถลบได้',
    IMAGE_NOT_FOUND: 'ไม่พบรูปภาพ',
    INVALID_FILE_TYPE: 'รองรับเฉพาะ JPG, PNG, WEBP',
    INVALID_EVENT_RANGE: 'เวลาสิ้นสุดต้องอยู่หลังเวลาเริ่มต้น',
  };
  if (code === 'INVALID_FILE_TYPE') {
    return e?.message?.trim() || map[code] || 'ไฟล์ไม่ถูกต้อง';
  }
  if (code && map[code]) return map[code];
  return e?.message?.trim() || 'เกิดข้อผิดพลาด กรุณาลองใหม่';
}
