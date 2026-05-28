'use client';

import { create } from 'zustand';

export type NotificationType =
  | 'WORKFLOW'
  | 'SYSTEM'
  | 'SECURITY'
  | 'ANNOUNCEMENT'
  | 'REMINDER'
  | 'ALERT'
  | 'CHAT_MESSAGE';

export interface NotificationItem {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  createdAt: number;
  read: boolean;
  href?: string;
}

interface NotificationState {
  items: NotificationItem[];

  setItems: (items: NotificationItem[]) => void;
  add: (item: NotificationItem) => void;
  markRead: (id: string) => void;
  markAllRead: () => void;
  remove: (id: string) => void;
  clear: () => void;
}

// Mock seed — replace with socket payload:
//   socket.on('notification:new',  (n) => useNotificationStore.getState().add(n));
//   socket.on('notification:list', (items) => useNotificationStore.getState().setItems(items));
const now = Date.now();
const minutes = (n: number) => now - n * 60_000;
const hours = (n: number) => now - n * 60 * 60_000;
const days = (n: number) => now - n * 24 * 60 * 60_000;

const seed: NotificationItem[] = [
  {
    id: 'n1',
    type: 'CHAT_MESSAGE',
    title: 'ข้อความใหม่จาก คุณมาย',
    message: 'ฝากดู PR #482 หน่อยนะ ส่วนใหญ่เสร็จแล้ว',
    createdAt: minutes(3),
    read: false,
    href: '/inbox',
  },
  {
    id: 'n2',
    type: 'SECURITY',
    title: 'มีการเข้าสู่ระบบจากอุปกรณ์ใหม่',
    message: 'Chrome on Windows · Bangkok, Thailand',
    createdAt: minutes(18),
    read: false,
    href: '/security',
  },
  {
    id: 'n3',
    type: 'WORKFLOW',
    title: 'งาน "Atlas Mobile" รอการอนุมัติ',
    message: 'คุณถูกกำหนดให้เป็นผู้อนุมัติขั้นตอนถัดไป',
    createdAt: hours(1),
    read: false,
    href: '/myissues',
  },
  {
    id: 'n4',
    type: 'ALERT',
    title: 'พบความผิดปกติของ Equipment #B789',
    message: 'Sensor failure detected — โปรดตรวจสอบโดยเร็ว',
    createdAt: hours(2),
    read: false,
    href: '/monitoring',
  },
  {
    id: 'n5',
    type: 'ANNOUNCEMENT',
    title: 'ประกาศจากฝ่ายไอที',
    message: 'ระบบจะปิดปรับปรุงในวันเสาร์เวลา 02:00 — 04:00 น.',
    createdAt: hours(5),
    read: true,
    href: '/blog',
  },
  {
    id: 'n6',
    type: 'REMINDER',
    title: 'อย่าลืมประชุม Sprint Review',
    message: 'พรุ่งนี้ 10:00 น. ที่ห้อง Aurora',
    createdAt: days(1),
    read: true,
    href: '/calendar',
  },
  {
    id: 'n7',
    type: 'SYSTEM',
    title: 'อัพเดตเวอร์ชันใหม่พร้อมใช้งาน',
    message: 'v2.4.0 — ปรับปรุงประสิทธิภาพและแก้ไข bug',
    createdAt: days(2),
    read: true,
  },
];

export const useNotificationStore = create<NotificationState>((set) => ({
  items: seed,

  setItems: (items) => set({ items }),
  add: (item) => set((s) => ({ items: [item, ...s.items] })),
  markRead: (id) =>
    set((s) => ({
      items: s.items.map((n) => (n.id === id ? { ...n, read: true } : n)),
    })),
  markAllRead: () =>
    set((s) => ({ items: s.items.map((n) => ({ ...n, read: true })) })),
  remove: (id) => set((s) => ({ items: s.items.filter((n) => n.id !== id) })),
  clear: () => set({ items: [] }),
}));

export const selectUnreadCount = (s: NotificationState): number =>
  s.items.reduce((acc, n) => (n.read ? acc : acc + 1), 0);
