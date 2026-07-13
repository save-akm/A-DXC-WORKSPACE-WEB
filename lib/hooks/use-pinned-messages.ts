'use client';

import { useCallback, useEffect, useState } from 'react';
import { fetchPinnedMessages } from '@/lib/api/messages';
import { useSocketEvent } from '@/components/socket/SocketProvider';
import type { ChatPinnedEvent, Message } from '@/lib/chat/types';

export function usePinnedMessages(conversationId: string) {
  const [pinned, setPinned] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);

  const reload = useCallback(() => {
    setLoading(true);
    fetchPinnedMessages(conversationId)
      .then(setPinned)
      .catch(() => setPinned([]))
      .finally(() => setLoading(false));
  }, [conversationId]);

  useEffect(() => {
    let cancelled = false;
    fetchPinnedMessages(conversationId)
      .then((list) => {
        if (!cancelled) setPinned(list);
      })
      .catch(() => {
        if (!cancelled) setPinned([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [conversationId]);

  const onPinned = useCallback((...args: unknown[]) => {
    const evt = args[0] as ChatPinnedEvent;
    if (evt.conversationId !== conversationId) return;
    setPinned((prev) => {
      if (evt.message.isPinned) {
        const without = prev.filter((m) => m.id !== evt.message.id);
        return [evt.message, ...without];
      }
      return prev.filter((m) => m.id !== evt.message.id);
    });
  }, [conversationId]);

  useSocketEvent('chat:pinned', onPinned, [onPinned]);

  return { pinned, loading, reload };
}
