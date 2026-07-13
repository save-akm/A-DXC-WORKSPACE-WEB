import type { AuditAction, LoginFailureReason, LoginStatus } from './types';

// ── Date / time ───────────────────────────────────────────────────────────────

const TIME_FMT = new Intl.DateTimeFormat('th-TH', {
  hour: '2-digit',
  minute: '2-digit',
});

const DATE_FMT = new Intl.DateTimeFormat('th-TH', {
  day: 'numeric',
  month: 'short',
  year: '2-digit',
});

const FULL_FMT = new Intl.DateTimeFormat('th-TH', {
  weekday: 'short',
  day: 'numeric',
  month: 'long',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit',
});

/** "12 มิ.ย. 69" — short date for a table cell. */
export function formatLogDate(iso: string): string {
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? '—' : DATE_FMT.format(d);
}

/** "14:30" — time only. */
export function formatLogTime(iso: string): string {
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? '' : TIME_FMT.format(d);
}

/** Full, unambiguous timestamp for detail panels. */
export function formatLogFull(iso: string): string {
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? '—' : `${FULL_FMT.format(d)} น.`;
}

/** "เมื่อสักครู่" / "5 นาทีที่แล้ว" / "3 ชม.ที่แล้ว" — coarse relative label. */
export function formatRelative(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  const diff = Date.now() - d.getTime();
  const sec = Math.round(diff / 1000);
  if (sec < 45) return 'เมื่อสักครู่';
  const min = Math.round(sec / 60);
  if (min < 60) return `${min} นาทีที่แล้ว`;
  const hr = Math.round(min / 60);
  if (hr < 24) return `${hr} ชม.ที่แล้ว`;
  const day = Math.round(hr / 24);
  if (day < 7) return `${day} วันที่แล้ว`;
  return formatLogDate(iso);
}

// ── Audit actions ─────────────────────────────────────────────────────────────

interface ActionMeta {
  /** Thai label. */
  label: string;
  /** Tailwind classes for the badge (bg + text + ring). */
  className: string;
  /** Tone used for the row accent / dot. */
  dot: string;
}

const ACTION_META: Record<AuditAction, ActionMeta> = {
  CREATE:          { label: 'สร้าง',          className: 'bg-emerald-500/12 text-emerald-600 ring-emerald-500/20 dark:text-emerald-400', dot: 'bg-emerald-500' },
  UPDATE:          { label: 'แก้ไข',          className: 'bg-sky-500/12 text-sky-600 ring-sky-500/20 dark:text-sky-400',                 dot: 'bg-sky-500' },
  DELETE:          { label: 'ลบ',             className: 'bg-rose-500/12 text-rose-600 ring-rose-500/20 dark:text-rose-400',             dot: 'bg-rose-500' },
  RESTORE:         { label: 'กู้คืน',          className: 'bg-teal-500/12 text-teal-600 ring-teal-500/20 dark:text-teal-400',             dot: 'bg-teal-500' },
  LOGIN:           { label: 'เข้าสู่ระบบ',     className: 'bg-blue-500/12 text-blue-600 ring-blue-500/20 dark:text-blue-400',            dot: 'bg-blue-500' },
  LOGOUT:          { label: 'ออกจากระบบ',     className: 'bg-slate-500/12 text-slate-600 ring-slate-500/20 dark:text-slate-300',        dot: 'bg-slate-400' },
  PASSWORD_CHANGE: { label: 'เปลี่ยนรหัสผ่าน', className: 'bg-violet-500/12 text-violet-600 ring-violet-500/20 dark:text-violet-400',    dot: 'bg-violet-500' },
  PASSWORD_RESET:  { label: 'รีเซ็ตรหัสผ่าน',  className: 'bg-fuchsia-500/12 text-fuchsia-600 ring-fuchsia-500/20 dark:text-fuchsia-400', dot: 'bg-fuchsia-500' },
  OTP_REQUESTED:   { label: 'ขอ OTP',         className: 'bg-indigo-500/12 text-indigo-600 ring-indigo-500/20 dark:text-indigo-400',    dot: 'bg-indigo-500' },
  ROLE_CHANGE:     { label: 'เปลี่ยนบทบาท',    className: 'bg-amber-500/12 text-amber-600 ring-amber-500/20 dark:text-amber-400',        dot: 'bg-amber-500' },
  TEAM_JOIN:       { label: 'เข้าร่วมทีม',     className: 'bg-pink-500/12 text-pink-600 ring-pink-500/20 dark:text-pink-400',            dot: 'bg-pink-500' },
  TEAM_LEAVE:      { label: 'ออกจากทีม',       className: 'bg-orange-500/12 text-orange-600 ring-orange-500/20 dark:text-orange-400',    dot: 'bg-orange-500' },
};

const ACTION_FALLBACK: ActionMeta = {
  label: '',
  className: 'bg-muted text-muted-foreground ring-border',
  dot: 'bg-muted-foreground',
};

export function actionMeta(action: AuditAction): ActionMeta {
  return ACTION_META[action] ?? { ...ACTION_FALLBACK, label: action };
}

// ── Login status ──────────────────────────────────────────────────────────────

interface StatusMeta {
  label: string;
  className: string;
  dot: string;
}

const STATUS_META: Record<LoginStatus, StatusMeta> = {
  SUCCESS: { label: 'สำเร็จ',     className: 'bg-emerald-500/12 text-emerald-600 ring-emerald-500/20 dark:text-emerald-400', dot: 'bg-emerald-500' },
  FAILURE: { label: 'ล้มเหลว',    className: 'bg-rose-500/12 text-rose-600 ring-rose-500/20 dark:text-rose-400',             dot: 'bg-rose-500' },
  BLOCKED: { label: 'ถูกบล็อก',   className: 'bg-orange-500/12 text-orange-600 ring-orange-500/20 dark:text-orange-400',     dot: 'bg-orange-500' },
};

export function statusMeta(status: LoginStatus): StatusMeta {
  return STATUS_META[status] ?? { label: status, className: ACTION_FALLBACK.className, dot: ACTION_FALLBACK.dot };
}

const FAILURE_LABELS: Record<string, string> = {
  wrong_password: 'รหัสผ่านไม่ถูกต้อง',
  wrong_2fa_pin: 'PIN 2FA ไม่ถูกต้อง',
  user_not_found: 'ไม่พบผู้ใช้',
  suspended: 'บัญชีถูกระงับ',
  terminated: 'บัญชีถูกยกเลิก',
  locked: 'บัญชีถูกล็อก',
};

export function failureReasonLabel(reason: LoginFailureReason | null): string {
  if (!reason) return '—';
  return FAILURE_LABELS[reason] ?? reason;
}