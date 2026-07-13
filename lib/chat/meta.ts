import type { ChatUserMini, Conversation, Message, MessageType } from './types';

const AVATAR_COLORS = [
  'bg-indigo-600', 'bg-violet-600', 'bg-sky-600', 'bg-teal-600',
  'bg-emerald-600', 'bg-pink-600', 'bg-rose-600', 'bg-amber-600',
  'bg-cyan-600', 'bg-fuchsia-600',
] as const;

const TIME_DTF = new Intl.DateTimeFormat('th-TH', { hour: '2-digit', minute: '2-digit' });
const SHORT_DTF = new Intl.DateTimeFormat('th-TH', { day: 'numeric', month: 'short' });
const DAY_DTF = new Intl.DateTimeFormat('th-TH', { weekday: 'long', day: 'numeric', month: 'long' });

export function avatarColor(seed: string): string {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
  return AVATAR_COLORS[hash % AVATAR_COLORS.length];
}

export function displayInitial(name: string): string {
  const trimmed = name.trim();
  return trimmed ? trimmed.charAt(0).toUpperCase() : '?';
}

export function userDisplayName(user: ChatUserMini): string {
  if (user.nickname?.trim()) return user.nickname.trim();
  const full = `${user.firstName ?? ''} ${user.lastName ?? ''}`.trim();
  return full || 'ผู้ใช้';
}

export function userOptionName(user: {
  firstName: string | null;
  lastName: string | null;
  nickname: string | null;
  email?: string | null;
}): string {
  if (user.nickname?.trim()) return user.nickname.trim();
  const full = `${user.firstName ?? ''} ${user.lastName ?? ''}`.trim();
  return full || user.email?.trim() || 'ผู้ใช้';
}

export function conversationSortKey(c: Conversation): number {
  const iso = c.lastMessageAt ?? c.updatedAt;
  const t = new Date(iso).getTime();
  return Number.isNaN(t) ? 0 : t;
}

export function sortConversations(list: Conversation[]): Conversation[] {
  return [...list].sort((a, b) => conversationSortKey(b) - conversationSortKey(a));
}

export function conversationTime(iso: string | null): string {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';

  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const t = d.getTime();

  if (t >= startOfToday) return `${TIME_DTF.format(d)} น.`;

  const startOfYesterday = startOfToday - 86_400_000;
  if (t >= startOfYesterday) return 'เมื่อวาน';

  return SHORT_DTF.format(d);
}

export function messageTime(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return `${TIME_DTF.format(d)} น.`;
}

export function formatUnread(count: number): string {
  if (count <= 0) return '';
  return count > 99 ? '99+' : String(count);
}

export type MessageDateGroup = 'today' | 'yesterday' | 'older';

export function messageDateGroup(iso: string): MessageDateGroup {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return 'older';
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const t = d.getTime();
  if (t >= startOfToday) return 'today';
  if (t >= startOfToday - 86_400_000) return 'yesterday';
  return 'older';
}

export function messageDateLabel(iso: string): string {
  const group = messageDateGroup(iso);
  if (group === 'today') return 'วันนี้';
  if (group === 'yesterday') return 'เมื่อวาน';
  return DAY_DTF.format(new Date(iso));
}

export function messagePreview(type: MessageType, content: string | null): string {
  switch (type) {
    case 'IMAGE': return content?.trim() ? `[รูป] ${content}` : '[รูป]';
    case 'FILE': return '[ไฟล์]';
    case 'VOICE': return '[เสียง]';
    case 'STICKER': return content ?? '[สติกเกอร์]';
    case 'SYSTEM': return content ?? '';
    default: return content ?? '';
  }
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function groupMessagesByDate(messages: Message[]): { label: string; items: Message[] }[] {
  const groups: { label: string; items: Message[] }[] = [];
  for (const msg of messages) {
    const label = messageDateLabel(msg.createdAt);
    const last = groups[groups.length - 1];
    if (last?.label === label) last.items.push(msg);
    else groups.push({ label, items: [msg] });
  }
  return groups;
}

export function mergeMessages(existing: Message[], incoming: Message[]): Message[] {
  const map = new Map(existing.map((m) => [m.id, m]));
  for (const m of incoming) map.set(m.id, m);
  return [...map.values()].sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
  );
}
