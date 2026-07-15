export type CalendarView = 'month' | 'week' | 'day';

export interface CalendarProject {
  id: string;
  name: string;
  /** สี OKLCH กลางๆ อ่านได้ทั้ง light/dark — ใช้กับ dot + tint พื้นหลัง */
  color: string;
}

export interface CalendarEvent {
  id: string;
  title: string;
  projectId: string;
  /** Issue key เช่น ORB-118 — มีเฉพาะ event ที่ผูกกับ issue */
  issueKey?: string;
  /** YYYY-MM-DD (local) */
  date: string;
  /** HH:mm — ไม่มี = ทั้งวัน (เช่น due date ของ issue) */
  startTime?: string;
  endTime?: string;
  note?: string;
}
