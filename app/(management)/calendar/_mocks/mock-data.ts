import type { CalendarEvent, CalendarProject } from '../types';

// โปรเจกต์ชุดเดียวกับหน้า My Issues (orbit-web / atlas-mobile / nova-api / lumen-design)
// สีเป็น OKLCH ความสว่างกลาง อ่านได้ทั้ง light และ dark
export const mockProjects: CalendarProject[] = [
  { id: 'orbit-web', name: 'Orbit Web', color: 'oklch(0.62 0.19 265)' },
  { id: 'atlas-mobile', name: 'Atlas Mobile', color: 'oklch(0.66 0.21 350)' },
  { id: 'nova-api', name: 'Nova API', color: 'oklch(0.68 0.15 162)' },
  { id: 'lumen-design', name: 'Lumen Design', color: 'oklch(0.76 0.14 85)' },
];

// วันนี้ (mock) = 2026-07-14 — event ที่มี issueKey คือ due date ของ issue (ทั้งวัน)
// event ที่มีเวลา คือนัดหมาย/ประชุม
export const mockEvents: CalendarEvent[] = [
  // ── ปลายเดือน มิ.ย. (โผล่ในช่องต้น grid ของ ก.ค.) ──
  {
    id: 'e-01',
    title: 'สรุปปิดสปรินต์ มิ.ย.',
    projectId: 'orbit-web',
    date: '2026-06-30',
    startTime: '14:00',
    endTime: '15:00',
  },

  // ── สัปดาห์ 1 ──
  {
    id: 'e-02',
    title: 'Sprint planning รอบ ก.ค.',
    projectId: 'orbit-web',
    date: '2026-07-01',
    startTime: '09:30',
    endTime: '11:00',
    note: 'จัดลำดับ backlog กับ PM ก่อนเริ่มสปรินต์ 14',
  },
  {
    id: 'e-03',
    title: 'Motion spec: transition ของ modal',
    projectId: 'lumen-design',
    issueKey: 'LUM-38',
    date: '2026-07-05',
  },

  // ── สัปดาห์ 2 ──
  {
    id: 'e-04',
    title: 'Design review — icon set Admin',
    projectId: 'lumen-design',
    date: '2026-07-06',
    startTime: '10:00',
    endTime: '11:30',
  },
  {
    id: 'e-05',
    title: 'เอกสาร API v2: ตัวอย่าง error codes',
    projectId: 'nova-api',
    issueKey: 'NOV-219',
    date: '2026-07-08',
  },
  {
    id: 'e-06',
    title: 'ซ้อม demo ลูกค้า DXC',
    projectId: 'orbit-web',
    date: '2026-07-09',
    startTime: '14:00',
    endTime: '15:30',
  },
  {
    id: 'e-07',
    title: 'Unit test apiFetch (refresh ชนกัน)',
    projectId: 'orbit-web',
    issueKey: 'ORB-127',
    date: '2026-07-10',
  },

  // ── สัปดาห์ 3 (สัปดาห์ปัจจุบัน) ──
  {
    id: 'e-08',
    title: 'Migration: เพิ่ม index ตาราง audit_logs',
    projectId: 'nova-api',
    issueKey: 'NOV-228',
    date: '2026-07-12',
  },
  {
    id: 'e-09',
    title: 'แก้ layout Dashboard จอ 1366px',
    projectId: 'orbit-web',
    issueKey: 'ORB-142',
    date: '2026-07-13',
  },
  // วันนี้ — จงใจให้แน่นเพื่อโชว์ "+N more" ใน month view
  {
    id: 'e-10',
    title: 'Daily standup',
    projectId: 'orbit-web',
    date: '2026-07-14',
    startTime: '09:00',
    endTime: '09:15',
  },
  {
    id: 'e-11',
    title: 'ประชุมทีม Mobile — แผน Q3',
    projectId: 'atlas-mobile',
    date: '2026-07-14',
    startTime: '10:30',
    endTime: '12:00',
    note: 'เตรียมหัวข้อ deep link + bundle size',
  },
  {
    id: 'e-12',
    title: 'Code review: refresh token race',
    projectId: 'nova-api',
    date: '2026-07-14',
    startTime: '13:00',
    endTime: '14:00',
  },
  {
    id: 'e-13',
    title: 'Sprint review',
    projectId: 'orbit-web',
    date: '2026-07-14',
    startTime: '15:00',
    endTime: '16:00',
  },
  {
    id: 'e-14',
    title: '1:1 กับ team lead',
    projectId: 'orbit-web',
    date: '2026-07-14',
    startTime: '16:30',
    endTime: '17:00',
  },
  {
    id: 'e-15',
    title: 'Push notification ไม่เด้งบน Android 15',
    projectId: 'atlas-mobile',
    issueKey: 'ATL-87',
    date: '2026-07-15',
  },
  {
    id: 'e-16',
    title: 'Rate limit endpoint /auth/refresh',
    projectId: 'nova-api',
    issueKey: 'NOV-231',
    date: '2026-07-15',
  },
  {
    id: 'e-17',
    title: 'เพิ่ม empty state หน้า Audit Logs',
    projectId: 'orbit-web',
    issueKey: 'ORB-139',
    date: '2026-07-16',
  },
  {
    id: 'e-18',
    title: 'Design sync กับทีม Lumen',
    projectId: 'lumen-design',
    date: '2026-07-16',
    startTime: '11:00',
    endTime: '12:00',
  },
  {
    id: 'e-19',
    title: 'ลด bundle size ของ splash screen',
    projectId: 'atlas-mobile',
    issueKey: 'ATL-79',
    date: '2026-07-17',
  },
  {
    id: 'e-20',
    title: 'ออกแบบ icon set เมนู Admin ชุดใหม่',
    projectId: 'lumen-design',
    issueKey: 'LUM-45',
    date: '2026-07-18',
  },

  // ── สัปดาห์ 4–5 ──
  {
    id: 'e-21',
    title: 'ปรับ contrast muted text ใน dark mode',
    projectId: 'orbit-web',
    issueKey: 'ORB-131',
    date: '2026-07-20',
  },
  {
    id: 'e-22',
    title: 'Retro สปรินต์ 14',
    projectId: 'orbit-web',
    date: '2026-07-21',
    startTime: '13:30',
    endTime: '14:30',
  },
  {
    id: 'e-23',
    title: 'รองรับ deep link หน้ารายละเอียดโปรเจกต์',
    projectId: 'atlas-mobile',
    issueKey: 'ATL-82',
    date: '2026-07-22',
  },
  {
    id: 'e-24',
    title: 'สัมภาษณ์ frontend dev (รอบ 2)',
    projectId: 'orbit-web',
    date: '2026-07-24',
    startTime: '10:00',
    endTime: '11:00',
  },
  {
    id: 'e-25',
    title: 'ปุ่ม export CSV หน้า Login Logs',
    projectId: 'orbit-web',
    issueKey: 'ORB-118',
    date: '2026-07-28',
  },
  {
    id: 'e-26',
    title: 'Release v2.4.0',
    projectId: 'nova-api',
    date: '2026-07-29',
    startTime: '15:00',
    endTime: '16:00',
    note: 'Deploy staging ก่อน 1 วัน — ดู checklist ใน NOV-240',
  },
  {
    id: 'e-27',
    title: 'Freeze โค้ด v2.4.0',
    projectId: 'nova-api',
    date: '2026-08-01',
  },
];
