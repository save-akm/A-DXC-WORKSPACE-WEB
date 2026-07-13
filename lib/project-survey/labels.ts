// Thai labels + display helpers for the Project Survey module.

import type {
  CostCategory,
  ScheduleJob,
  SchedulePlanType,
  SurveyStatus,
  TypeSystem,
} from './types';

export const STATUS_LABELS: Record<SurveyStatus, string> = {
  SEND: 'ส่งแล้ว',
  REVIEW: 'กำลังตรวจสอบ',
  APPROVE: 'อนุมัติแล้ว',
};

export const STATUS_DESCRIPTIONS: Record<SurveyStatus, string> = {
  SEND: 'รอผู้รับคำร้องเปิดดู',
  REVIEW: 'A-DXC กำลังประเมิน',
  APPROVE: 'อนุมัติแล้ว — เอกสารถูกล็อก',
};

export const TYPE_SYSTEM_LABELS: Record<TypeSystem, string> = {
  AS400: 'AS/400',
  NON_AS400: 'Non-AS/400',
};

export const COST_CATEGORY_LABELS: Record<CostCategory, string> = {
  HARDWARE: 'ฮาร์ดแวร์',
  SOFTWARE: 'ซอฟต์แวร์',
  OUTSOURCE: 'จ้างภายนอก',
  IN_HOUSE: 'พัฒนาภายใน',
};

export const SCHEDULE_JOB_LABELS: Record<ScheduleJob, string> = {
  REQUIREMENT: 'เก็บความต้องการ',
  DEVELOP: 'พัฒนาระบบ',
  START_USE: 'เริ่มใช้งาน',
};

export const PLAN_TYPE_LABELS: Record<SchedulePlanType, string> = {
  ORIGINAL_PLAN: 'แผนหลัก',
  REVISE_PLAN: 'แผนปรับปรุง',
  FORECAST_PLAN: 'แผนคาดการณ์',
  ACTUAL: 'ผลจริง',
};

export const PROCESS_LABELS: Record<string, string> = {
  U0: 'U0',
  J0_J2: 'J0–J2',
  J3: 'J3',
  J4: 'J4',
  J5: 'J5',
};

/** "สมหญิง ใจดี" — falls back to email or a dash. */
export function fullName(u?: { firstName?: string | null; lastName?: string | null; email?: string } | null): string {
  if (!u) return '—';
  const name = [u.firstName, u.lastName].filter(Boolean).join(' ').trim();
  return name || u.email || '—';
}

/** Decimal string / number → "50,000" (no currency symbol; column headers carry the unit). */
export function formatAmount(value: string | number | null | undefined): string {
  if (value === null || value === undefined || value === '') return '—';
  const n = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(n)) return '—';
  return n.toLocaleString('th-TH', { maximumFractionDigits: 2 });
}

/** ISO date → "1 ส.ค. 2569" (Thai Buddhist calendar, short month). */
export function formatDate(iso: string | null | undefined): string {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: 'numeric' });
}

/** ISO date-time → "1 ส.ค. 2569 14:05". */
export function formatDateTime(iso: string | null | undefined): string {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('th-TH', {
    day: 'numeric', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

/** ISO date → value for <input type="date"> ("YYYY-MM-DD"). */
export function toDateInputValue(iso: string | null | undefined): string {
  if (!iso) return '';
  return iso.slice(0, 10);
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
