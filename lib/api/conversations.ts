import { apiFetch } from '@/lib/auth/client';
import { useAuthStore } from '@/lib/stores/auth-store';
import type {
  Conversation,
  ConversationInvite,
  ConversationMember,
  ConversationsQuery,
  ConversationRole,
  MemberSettings,
} from '@/lib/chat/types';

interface Envelope<T> {
  status: string;
  message?: string;
  data: T;
}

function buildArchivedQuery(archived: ConversationsQuery['archived']): string {
  if (archived === undefined || archived === false) return '';
  return archived === true ? '?archived=true' : '?archived=all';
}

export async function fetchConversations(query: ConversationsQuery = {}): Promise<Conversation[]> {
  const qs = buildArchivedQuery(query.archived);
  const res = await apiFetch<Envelope<Conversation[]>>(`/conversations${qs}`);
  return Array.isArray(res.data) ? res.data : [];
}

export async function fetchConversation(id: string): Promise<Conversation> {
  const res = await apiFetch<Envelope<Conversation>>(`/conversations/${id}`);
  return res.data;
}

export async function createDirectConversation(userId: string): Promise<Conversation> {
  const res = await apiFetch<Envelope<Conversation>>('/conversations/direct', {
    method: 'POST',
    body: { userId },
  });
  return res.data;
}

export async function createGroupConversation(input: {
  name: string;
  description?: string;
  memberIds?: string[];
}): Promise<Conversation> {
  const res = await apiFetch<Envelope<Conversation>>('/conversations/group', {
    method: 'POST',
    body: input,
  });
  return res.data;
}

export async function updateConversation(
  id: string,
  body: { name?: string; description?: string; avatarUrl?: string | null },
): Promise<Conversation> {
  const res = await apiFetch<Envelope<Conversation>>(`/conversations/${id}`, {
    method: 'PATCH',
    body,
  });
  return res.data;
}

export async function uploadGroupAvatar(conversationId: string, file: File): Promise<Conversation> {
  const { accessToken } = useAuthStore.getState();
  const form = new FormData();
  form.append('avatar', file);
  const res = await fetch(`/api/_proxy/conversations/${conversationId}/avatar`, {
    method: 'POST',
    headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : {},
    body: form,
    cache: 'no-store',
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({})) as { message?: string };
    throw new Error(data?.message ?? res.statusText);
  }
  const json = await res.json() as Envelope<Conversation>;
  return json.data;
}

export async function deleteGroupAvatar(conversationId: string): Promise<Conversation> {
  const res = await apiFetch<Envelope<Conversation>>(`/conversations/${conversationId}/avatar`, {
    method: 'DELETE',
  });
  return res.data;
}

export async function addGroupMember(conversationId: string, userId: string): Promise<ConversationMember> {
  const res = await apiFetch<Envelope<ConversationMember>>(`/conversations/${conversationId}/members`, {
    method: 'POST',
    body: { userId },
  });
  return res.data;
}

export async function removeGroupMember(conversationId: string, userId: string): Promise<void> {
  await apiFetch(`/conversations/${conversationId}/members/${userId}`, { method: 'DELETE' });
}

export async function updateMemberRole(
  conversationId: string,
  userId: string,
  role: Exclude<ConversationRole, 'OWNER'>,
): Promise<ConversationMember> {
  const res = await apiFetch<Envelope<ConversationMember>>(
    `/conversations/${conversationId}/members/${userId}/role`,
    { method: 'PATCH', body: { role } },
  );
  return res.data;
}

export async function updateMyMemberSettings(
  conversationId: string,
  body: { isMuted?: boolean; mutedUntil?: string | null; nickname?: string | null },
): Promise<MemberSettings> {
  const res = await apiFetch<Envelope<MemberSettings>>(
    `/conversations/${conversationId}/members/me`,
    { method: 'PATCH', body },
  );
  return res.data;
}

export async function transferOwnership(conversationId: string, userId: string): Promise<Conversation> {
  const res = await apiFetch<Envelope<Conversation>>(
    `/conversations/${conversationId}/transfer-ownership`,
    { method: 'POST', body: { userId } },
  );
  return res.data;
}

export async function deleteGroup(conversationId: string): Promise<void> {
  await apiFetch(`/conversations/${conversationId}`, { method: 'DELETE' });
}

export async function markConversationRead(conversationId: string): Promise<void> {
  await apiFetch(`/conversations/${conversationId}/read`, { method: 'POST' });
}

export async function starConversation(conversationId: string, isStarred: boolean): Promise<Conversation> {
  const res = await apiFetch<Envelope<Conversation>>(`/conversations/${conversationId}/star`, {
    method: 'POST',
    body: { isStarred },
  });
  return res.data;
}

export async function archiveConversation(conversationId: string): Promise<void> {
  await apiFetch(`/conversations/${conversationId}/archive`, { method: 'POST' });
}

export async function unarchiveConversation(conversationId: string): Promise<void> {
  await apiFetch(`/conversations/${conversationId}/unarchive`, { method: 'POST' });
}

export async function leaveGroup(conversationId: string): Promise<void> {
  await apiFetch(`/conversations/${conversationId}/leave`, { method: 'POST' });
}

export async function createInvite(
  conversationId: string,
  body: { expiresAt?: string; maxUses?: number } = {},
): Promise<ConversationInvite> {
  const res = await apiFetch<Envelope<ConversationInvite>>(
    `/conversations/${conversationId}/invites`,
    { method: 'POST', body },
  );
  return res.data;
}

export async function fetchInvites(conversationId: string): Promise<ConversationInvite[]> {
  const res = await apiFetch<Envelope<ConversationInvite[]>>(`/conversations/${conversationId}/invites`);
  return Array.isArray(res.data) ? res.data : [];
}

export async function revokeInvite(inviteId: string): Promise<ConversationInvite> {
  const res = await apiFetch<Envelope<ConversationInvite>>(
    `/conversations/invites/${inviteId}`,
    { method: 'DELETE' },
  );
  return res.data;
}

export async function joinByInviteCode(code: string): Promise<Conversation> {
  const res = await apiFetch<Envelope<Conversation>>(`/conversations/join/${code}`, {
    method: 'POST',
  });
  return res.data;
}

export async function fetchUnreadCount(): Promise<number> {
  const res = await apiFetch<Envelope<{ totalUnread: number }>>('/conversations/unread-count?includeArchived=false');
  return res.data?.totalUnread ?? 0;
}
