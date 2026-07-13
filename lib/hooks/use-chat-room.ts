'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { markConversationRead } from '@/lib/api/conversations';
import { useSocket, useSocketEmit, useSocketEvent } from '@/components/socket/SocketProvider';
import { useAuthStore } from '@/lib/stores/auth-store';
import type { ChatMessageEvent, ChatTypingEvent } from '@/lib/chat/types';
import { userDisplayName } from '@/lib/chat/meta';
import type { ChatUserMini } from '@/lib/chat/types';

interface TypingUser {
  userId: string;
  name: string;
}

export function useChatRoom(conversationId: string | null, members: ChatUserMini[] = []) {
  const socket = useSocket();
  const emit = useSocketEmit();
  const myId = useAuthStore((s) => s.user?.id);
  const [typingUsers, setTypingUsers] = useState<TypingUser[]>([]);
  const typingTimers = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  const memberName = useCallback(
    (userId: string) => {
      const m = members.find((u) => u.id === userId);
      return m ? userDisplayName(m) : 'มีคนกำลังพิมพ์';
    },
    [members],
  );

  useEffect(() => {
    if (!conversationId || !socket) return undefined;

    const joinRoom = () => emit('chat:join', { conversationId });

    if (socket.connected) {
      joinRoom();
    } else {
      socket.once('connect', joinRoom);
    }

    markConversationRead(conversationId).catch(() => {});

    return () => {
      socket.off('connect', joinRoom);
      emit('chat:leave', { conversationId });
    };
  }, [conversationId, socket, emit]);

  // Keep the read marker advancing while the room is open — but only when the
  // tab is genuinely visible AND focused. A chat left open in a background tab
  // should still accrue unread badges (matches Slack/Messenger). This keeps the
  // sidebar list badge and the INBOX menu badge from lighting up for the very
  // conversation the user is looking at.
  const markReadTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const markReadIfFocused = useCallback(() => {
    if (!conversationId || typeof document === 'undefined') return;
    if (document.visibilityState !== 'visible' || !document.hasFocus()) return;
    markConversationRead(conversationId).catch(() => {});
  }, [conversationId]);

  const scheduleMarkRead = useCallback(() => {
    clearTimeout(markReadTimer.current);
    markReadTimer.current = setTimeout(markReadIfFocused, 150);
  }, [markReadIfFocused]);

  const onRoomMessage = useCallback((...args: unknown[]) => {
    const evt = args[0] as ChatMessageEvent;
    if (!conversationId || evt.conversationId !== conversationId) return;
    if (evt.message?.sender?.id === myId) return; // my own message is already read
    scheduleMarkRead();
  }, [conversationId, myId, scheduleMarkRead]);

  useSocketEvent('chat:message', onRoomMessage, [onRoomMessage]);

  // When the tab regains focus/visibility, flush any messages that arrived while
  // it was in the background.
  useEffect(() => {
    if (!conversationId) return undefined;
    const onWake = () => markReadIfFocused();
    window.addEventListener('focus', onWake);
    document.addEventListener('visibilitychange', onWake);
    return () => {
      window.removeEventListener('focus', onWake);
      document.removeEventListener('visibilitychange', onWake);
    };
  }, [conversationId, markReadIfFocused]);

  const onTyping = useCallback((...args: unknown[]) => {
    const evt = args[0] as ChatTypingEvent;
    if (!conversationId || evt.conversationId !== conversationId) return;
    if (evt.userId === myId) return;

    const existing = typingTimers.current.get(evt.userId);
    if (existing) clearTimeout(existing);

    if (evt.isTyping !== false) {
      setTypingUsers((prev) => {
        if (prev.some((u) => u.userId === evt.userId)) return prev;
        return [...prev, { userId: evt.userId, name: memberName(evt.userId) }];
      });
      typingTimers.current.set(
        evt.userId,
        setTimeout(() => {
          setTypingUsers((prev) => prev.filter((u) => u.userId !== evt.userId));
          typingTimers.current.delete(evt.userId);
        }, 4000),
      );
    } else {
      setTypingUsers((prev) => prev.filter((u) => u.userId !== evt.userId));
      typingTimers.current.delete(evt.userId);
    }
  }, [conversationId, myId, memberName]);

  useSocketEvent('chat:typing', onTyping, [onTyping]);

  const typingTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  const sendTyping = useCallback(
    (isTyping: boolean) => {
      if (!conversationId) return;
      emit('chat:typing', { conversationId, isTyping });
      if (isTyping) {
        if (typingTimeout.current) clearTimeout(typingTimeout.current);
        typingTimeout.current = setTimeout(() => {
          emit('chat:typing', { conversationId, isTyping: false });
        }, 3000);
      }
    },
    [conversationId, emit],
  );

  useEffect(() => () => {
    typingTimers.current.forEach((t) => clearTimeout(t));
    if (typingTimeout.current) clearTimeout(typingTimeout.current);
    clearTimeout(markReadTimer.current);
  }, []);

  return { typingUsers, sendTyping };
}
