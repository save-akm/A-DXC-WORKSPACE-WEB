'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  deleteMessage,
  editMessage,
  fetchMessages,
  pinMessage,
  reactToMessage,
  sendMessage as sendMessageApi,
  unpinMessage,
} from '@/lib/api/messages';
import { useSocketEvent } from '@/components/socket/SocketProvider';
import { useAuthStore } from '@/lib/stores/auth-store';
import { mergeMessages } from '@/lib/chat/meta';
import type {
  ChatDeletedEvent,
  ChatEditedEvent,
  ChatMessageEvent,
  ChatPinnedEvent,
  ChatReactionEvent,
  Message,
  SendMessageInput,
} from '@/lib/chat/types';

function patchMessage(list: Message[], updated: Message): Message[] {
  return list.map((m) => (m.id === updated.id ? updated : m));
}

export function useMessages(conversationId: string) {
  const myId = useAuthStore((s) => s.user?.id);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);

  const loadInitial = useCallback(() => {
    setLoading(true);
    setError(null);
    fetchMessages(conversationId, { limit: 50 })
      .then((page) => {
        setMessages(page.messages);
        setHasMore(page.hasMore);
        setNextCursor(page.nextCursor);
      })
      .catch((e) => setError((e as Error)?.message ?? 'โหลดข้อความไม่สำเร็จ'))
      .finally(() => setLoading(false));
  }, [conversationId]);

  useEffect(() => {
    let cancelled = false;
    fetchMessages(conversationId, { limit: 50 })
      .then((page) => {
        if (cancelled) return;
        setMessages(page.messages);
        setHasMore(page.hasMore);
        setNextCursor(page.nextCursor);
      })
      .catch((e) => {
        if (!cancelled) setError((e as Error)?.message ?? 'โหลดข้อความไม่สำเร็จ');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [conversationId]);

  const loadMore = useCallback(() => {
    if (!hasMore || !nextCursor || loadingMore) return;
    setLoadingMore(true);
    fetchMessages(conversationId, { limit: 50, before: nextCursor })
      .then((page) => {
        setMessages((prev) => mergeMessages(page.messages, prev));
        setHasMore(page.hasMore);
        setNextCursor(page.nextCursor);
      })
      .catch(() => { /* keep scroll position */ })
      .finally(() => setLoadingMore(false));
  }, [conversationId, hasMore, nextCursor, loadingMore]);

  const onMessage = useCallback((...args: unknown[]) => {
    const evt = args[0] as ChatMessageEvent;
    if (evt.conversationId !== conversationId) return;
    setMessages((prev) => mergeMessages(prev, [evt.message]));
  }, [conversationId]);

  const onEdited = useCallback((...args: unknown[]) => {
    const evt = args[0] as ChatEditedEvent;
    if (evt.conversationId !== conversationId) return;
    setMessages((prev) => patchMessage(prev, evt.message));
  }, [conversationId]);

  const onDeleted = useCallback((...args: unknown[]) => {
    const evt = args[0] as ChatDeletedEvent;
    if (evt.conversationId !== conversationId) return;
    setMessages((prev) => patchMessage(prev, evt.message));
  }, [conversationId]);

  const onReaction = useCallback((...args: unknown[]) => {
    const evt = args[0] as ChatReactionEvent;
    if (evt.conversationId !== conversationId) return;
    setMessages((prev) =>
      prev.map((m) => {
        if (m.id !== evt.messageId) return m;
        if (evt.action === 'added' && evt.reaction) {
          const exists = m.reactions.some((r) => r.userId === evt.userId && r.emoji === evt.emoji);
          if (exists) return m;
          return { ...m, reactions: [...m.reactions, evt.reaction] };
        }
        if (evt.action === 'removed') {
          return {
            ...m,
            reactions: m.reactions.filter((r) => !(r.userId === evt.userId && r.emoji === evt.emoji)),
          };
        }
        if (evt.action === 'changed' && evt.reaction) {
          const filtered = m.reactions.filter(
            (r) => !(r.userId === evt.userId && (r.emoji === evt.previousEmoji || r.emoji === evt.emoji)),
          );
          return { ...m, reactions: [...filtered, evt.reaction] };
        }
        return m;
      }),
    );
  }, [conversationId]);

  const onPinned = useCallback((...args: unknown[]) => {
    const evt = args[0] as ChatPinnedEvent;
    if (evt.conversationId !== conversationId) return;
    setMessages((prev) => patchMessage(prev, evt.message));
  }, [conversationId]);

  useSocketEvent('chat:message', onMessage, [onMessage]);
  useSocketEvent('chat:edited', onEdited, [onEdited]);
  useSocketEvent('chat:deleted', onDeleted, [onDeleted]);
  useSocketEvent('chat:reaction', onReaction, [onReaction]);
  useSocketEvent('chat:pinned', onPinned, [onPinned]);

  const sendMessage = useCallback(
    async (input: SendMessageInput) => {
      setSending(true);
      try {
        const msg = await sendMessageApi(conversationId, input);
        setMessages((prev) => mergeMessages(prev, [msg]));
        return msg;
      } finally {
        setSending(false);
      }
    },
    [conversationId],
  );

  const updateMessage = useCallback((updated: Message) => {
    setMessages((prev) => patchMessage(prev, updated));
  }, []);

  const editMessageContent = useCallback(
    async (messageId: string, content: string) => {
      const updated = await editMessage(messageId, { content });
      setMessages((prev) => patchMessage(prev, updated));
      return updated;
    },
    [],
  );

  const removeMessage = useCallback(async (messageId: string) => {
    const updated = await deleteMessage(messageId);
    setMessages((prev) => patchMessage(prev, updated));
    return updated;
  }, []);

  const toggleReaction = useCallback(
    async (message: Message, emoji: string) => {
      const result = await reactToMessage(message.id, emoji);
      setMessages((prev) =>
        prev.map((m) => {
          if (m.id !== message.id) return m;
          // Remove toggled-off emoji and any previous emoji (for 'changed')
          let reactions = m.reactions.filter(
            (r) =>
              !(r.userId === myId && r.emoji === emoji) &&
              !(result.previousEmoji && r.userId === myId && r.emoji === result.previousEmoji),
          );
          if (result.action !== 'removed' && result.reaction) {
            reactions = [...reactions, result.reaction];
          }
          return { ...m, reactions };
        }),
      );
    },
    [myId],
  );

  const togglePin = useCallback(async (message: Message) => {
    const updated = message.isPinned
      ? await unpinMessage(message.id)
      : await pinMessage(message.id);
    setMessages((prev) =>
      prev.map((m) => {
        if (m.id === updated.id) return updated;
        if (!message.isPinned && updated.isPinned) return { ...m, isPinned: false };
        return m;
      }),
    );
    return updated;
  }, []);

  return {
    messages,
    loading,
    loadingMore,
    hasMore,
    error,
    sending,
    loadInitial,
    loadMore,
    sendMessage,
    updateMessage,
    editMessageContent,
    removeMessage,
    toggleReaction,
    togglePin,
  };
}
