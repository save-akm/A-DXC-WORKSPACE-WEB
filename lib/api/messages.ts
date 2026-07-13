import { apiFetch } from '@/lib/auth/client';
import { useAuthStore } from '@/lib/stores/auth-store';
import type {
  AttachmentUploadResult,
  MentionPage,
  Message,
  MessageReaction,
  MessagesPage,
  SendMessageInput,
} from '@/lib/chat/types';

interface Envelope<T> {
  status: string;
  message?: string;
  data: T;
}

export async function fetchMessages(
  conversationId: string,
  opts: { limit?: number; before?: string } = {},
): Promise<MessagesPage> {
  const qs = new URLSearchParams();
  qs.set('limit', String(opts.limit ?? 50));
  if (opts.before) qs.set('before', opts.before);
  const res = await apiFetch<Envelope<MessagesPage>>(
    `/conversations/${conversationId}/messages?${qs.toString()}`,
  );
  const p = res.data;
  return {
    messages: Array.isArray(p?.messages) ? p.messages : [],
    nextCursor: p?.nextCursor ?? null,
    hasMore: p?.hasMore ?? false,
    limit: p?.limit ?? opts.limit ?? 50,
  };
}

export async function sendMessage(
  conversationId: string,
  input: SendMessageInput,
): Promise<Message> {
  const res = await apiFetch<Envelope<Message>>(`/conversations/${conversationId}/messages`, {
    method: 'POST',
    body: input,
  });
  return res.data;
}

export async function editMessage(
  messageId: string,
  body: { content: string; mentionUserIds?: string[] },
): Promise<Message> {
  const res = await apiFetch<Envelope<Message>>(`/messages/${messageId}`, {
    method: 'PATCH',
    body,
  });
  return res.data;
}

export async function deleteMessage(messageId: string): Promise<Message> {
  const res = await apiFetch<Envelope<Message>>(`/messages/${messageId}`, {
    method: 'DELETE',
  });
  return res.data;
}

export interface ReactionResponse {
  action: 'added' | 'removed' | 'changed';
  emoji: string;
  previousEmoji: string | null;
  reaction?: MessageReaction;
}

export async function reactToMessage(messageId: string, emoji: string): Promise<ReactionResponse> {
  const res = await apiFetch<Envelope<ReactionResponse>>(`/messages/${messageId}/reactions`, {
    method: 'POST',
    body: { emoji },
  });
  return res.data;
}

export async function pinMessage(messageId: string): Promise<Message> {
  const res = await apiFetch<Envelope<Message>>(`/messages/${messageId}/pin`, {
    method: 'POST',
  });
  return res.data;
}

export async function unpinMessage(messageId: string): Promise<Message> {
  const res = await apiFetch<Envelope<Message>>(`/messages/${messageId}/pin`, {
    method: 'DELETE',
  });
  return res.data;
}

export async function uploadChatAttachment(
  conversationId: string,
  file: File,
): Promise<AttachmentUploadResult> {
  const { accessToken } = useAuthStore.getState();
  const form = new FormData();
  form.append('file', file);

  const res = await fetch(`/api/_proxy/conversations/${conversationId}/uploads`, {
    method: 'POST',
    headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : {},
    body: form,
    cache: 'no-store',
  });

  if (!res.ok) {
    const data = await res.json().catch(() => ({})) as { message?: string; code?: string };
    const err = new Error(data?.message ?? res.statusText) as Error & { status: number; code?: string };
    err.status = res.status;
    err.code = data?.code;
    throw err;
  }

  const json = await res.json() as Envelope<AttachmentUploadResult>;
  return json.data;
}

export async function fetchPinnedMessages(conversationId: string): Promise<Message[]> {
  const res = await apiFetch<Envelope<Message[]>>(`/conversations/${conversationId}/pinned`);
  return Array.isArray(res.data) ? res.data : [];
}

export async function fetchMentions(opts: { limit?: number; before?: string } = {}): Promise<MentionPage> {
  const qs = new URLSearchParams();
  qs.set('limit', String(opts.limit ?? 50));
  if (opts.before) qs.set('before', opts.before);
  const res = await apiFetch<Envelope<MentionPage>>(`/conversations/mentions?${qs.toString()}`);
  const p = res.data;
  return {
    mentions: Array.isArray(p?.mentions) ? p.mentions : [],
    nextCursor: p?.nextCursor ?? null,
    hasMore: p?.hasMore ?? false,
  };
}
