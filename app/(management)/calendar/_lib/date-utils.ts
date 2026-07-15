/** Date helpers ของหน้า calendar — ทำงานบน local time ทั้งหมด (ไม่มี timezone math) */

export const WEEKDAYS_SHORT = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'] as const;

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
] as const;

const pad = (n: number) => String(n).padStart(2, '0');

/** Date → 'YYYY-MM-DD' (local) */
export function toDateKey(d: Date): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

/** 'YYYY-MM-DD' → Date (local midnight) */
export function parseDateKey(key: string): Date {
  const [y, m, d] = key.split('-').map(Number);
  return new Date(y, m - 1, d);
}

export function addDays(d: Date, n: number): Date {
  const next = new Date(d);
  next.setDate(next.getDate() + n);
  return next;
}

export function addMonths(d: Date, n: number): Date {
  // ตรึงไว้ที่วันที่ 1 กันเดือนสั้น (31 ม.ค. +1 เดือน ต้องได้ ก.พ. ไม่ใช่ มี.ค.)
  return new Date(d.getFullYear(), d.getMonth() + n, 1);
}

/** วันอาทิตย์ของสัปดาห์ที่ d อยู่ */
export function startOfWeek(d: Date): Date {
  return addDays(new Date(d.getFullYear(), d.getMonth(), d.getDate()), -d.getDay());
}

export function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

/**
 * วันทั้งหมดของ grid เดือน (เริ่มอาทิตย์ จบเสาร์ — เต็มสัปดาห์เสมอ)
 * คืนเป็นสัปดาห์ละแถว สำหรับ grid-template-rows ที่นับจำนวนแถวได้
 */
export function monthGridWeeks(cursor: Date): Date[][] {
  const first = new Date(cursor.getFullYear(), cursor.getMonth(), 1);
  const last = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 0);
  let day = startOfWeek(first);
  const weeks: Date[][] = [];
  while (day <= last || weeks.length === 0) {
    const week: Date[] = [];
    for (let i = 0; i < 7; i++) {
      week.push(day);
      day = addDays(day, 1);
    }
    weeks.push(week);
  }
  return weeks;
}

export function weekDays(cursor: Date): Date[] {
  const start = startOfWeek(cursor);
  return Array.from({ length: 7 }, (_, i) => addDays(start, i));
}

/** 'July 2026' */
export function formatMonthTitle(d: Date): string {
  return `${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
}

/** 'Jul 12 – 18, 2026' (คร่อมเดือน/ปีจะแสดงทั้งคู่) */
export function formatWeekTitle(cursor: Date): string {
  const start = startOfWeek(cursor);
  const end = addDays(start, 6);
  const s = `${MONTHS[start.getMonth()].slice(0, 3)} ${start.getDate()}`;
  const e =
    start.getMonth() === end.getMonth()
      ? `${end.getDate()}`
      : `${MONTHS[end.getMonth()].slice(0, 3)} ${end.getDate()}`;
  const year =
    start.getFullYear() === end.getFullYear()
      ? `${end.getFullYear()}`
      : `${start.getFullYear()}/${end.getFullYear()}`;
  return `${s} – ${e}, ${year}`;
}

/** 'Tuesday, July 14, 2026' */
export function formatDayTitle(d: Date): string {
  const weekday = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][d.getDay()];
  return `${weekday}, ${MONTHS[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
}

/** 'HH:mm' → นาทีตั้งแต่เที่ยงคืน */
export function timeToMinutes(t: string): number {
  const [h, m] = t.split(':').map(Number);
  return h * 60 + m;
}
