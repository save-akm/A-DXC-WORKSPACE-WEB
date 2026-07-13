'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { Loader2, MessageSquare } from 'lucide-react';
import { fetchConversation } from '@/lib/api/conversations';
import { useSocketEvent } from '@/components/socket/SocketProvider';
import { useChatRoom } from '@/lib/hooks/use-chat-room';
import { useMessages } from '@/lib/hooks/use-messages';
import { usePinnedMessages } from '@/lib/hooks/use-pinned-messages';
import { canPinMessage } from '@/lib/chat/permissions';
import { chatSlidePanel } from '@/lib/chat/motion';
import type { ChatConversationDeletedEvent, ChatConversationUpdatedEvent, Conversation, Message } from '@/lib/chat/types';
import { ChatHeader } from './chat-header';
import { MessageComposer } from './message-composer';
import { MessageList, type MessageListHandle } from './message-list';
import { PinnedMessagesBanner } from './pinned-messages-banner';
import { TypingIndicator } from './message-bits';

interface ChatPanelProps {
  conversationId: string;
}

export function ChatPanel({ conversationId }: ChatPanelProps) {
  const router = useRouter();
  const reduce = useReducedMotion();
  const listRef = useRef<MessageListHandle>(null);
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [loadingConv, setLoadingConv] = useState(true);
  const [replyTo, setReplyTo] = useState<Message | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetchConversation(conversationId)
      .then((c) => {
        if (!cancelled) setConversation(c);
      })
      .catch(() => {
        if (!cancelled) setConversation(null);
      })
      .finally(() => {
        if (!cancelled) setLoadingConv(false);
      });
    return () => {
      cancelled = true;
    };
  }, [conversationId]);

  const onConversationUpdated = useCallback((...args: unknown[]) => {
    const evt = args[0] as ChatConversationUpdatedEvent;
    if (evt.conversationId !== conversationId || !evt.conversation) return;
    setConversation(evt.conversation);
  }, [conversationId]);

  const onConversationDeleted = useCallback((...args: unknown[]) => {
    const evt = args[0] as ChatConversationDeletedEvent;
    if (evt.conversationId === conversationId) router.push('/inbox');
  }, [conversationId, router]);

  useSocketEvent('chat:conversation-updated', onConversationUpdated, [onConversationUpdated]);
  useSocketEvent('chat:conversation-deleted', onConversationDeleted, [onConversationDeleted]);

  const memberUsers = useMemo(
    () => conversation?.members.map((m) => m.user) ?? [],
    [conversation],
  );

  const { typingUsers, sendTyping } = useChatRoom(conversationId, memberUsers);
  const {
    messages,
    loading,
    loadingMore,
    hasMore,
    error,
    sending,
    loadInitial,
    loadMore,
    sendMessage,
    editMessageContent,
    removeMessage,
    toggleReaction,
    togglePin,
  } = useMessages(conversationId);

  const { pinned, reload: reloadPinned } = usePinnedMessages(conversationId);

  const typingLabel = useMemo(() => {
    if (typingUsers.length === 0) return null;
    if (typingUsers.length === 1) return `${typingUsers[0].name} กำลังพิมพ์...`;
    return `${typingUsers.length} คนกำลังพิมพ์...`;
  }, [typingUsers]);

  const handleSend = useCallback(
    async (input: Parameters<typeof sendMessage>[0]) => {
      await sendMessage(input);
      setReplyTo(null);
    },
    [sendMessage],
  );

  const handleReply = useCallback((message: Message) => {
    setReplyTo(message);
    setEditingId(null);
  }, []);

  const handleEdit = useCallback((message: Message) => {
    setEditingId(message.id);
    setReplyTo(null);
  }, []);

  const handleDelete = useCallback(
    async (message: Message) => {
      if (!confirm('ลบข้อความนี้?')) return;
      await removeMessage(message.id);
      if (editingId === message.id) setEditingId(null);
    },
    [removeMessage, editingId],
  );

  const handleSaveEdit = useCallback(
    async (message: Message, content: string) => {
      if (!content) return;
      await editMessageContent(message.id, content);
      setEditingId(null);
    },
    [editMessageContent],
  );

  const handleTogglePin = useCallback(
    async (message: Message) => {
      await togglePin(message);
      reloadPinned();
    },
    [togglePin, reloadPinned],
  );

  const handleUnpin = useCallback(
    async (message: Message) => {
      await togglePin(message);
      reloadPinned();
    },
    [togglePin, reloadPinned],
  );

  if (loadingConv) {
    return (
      <div className="flex h-full items-center justify-center bg-background">
        <Loader2 className="size-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!conversation) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-3 bg-background px-6 text-center">
        <div className="flex size-12 items-center justify-center rounded-xl bg-muted ring-1 ring-border/60">
          <MessageSquare className="size-5 text-muted-foreground" />
        </div>
        <div>
          <p className="text-sm font-medium">ไม่พบห้องแชท</p>
          <p className="text-xs text-muted-foreground">ห้องนี้อาจถูกลบหรือคุณไม่มีสิทธิ์เข้าถึง</p>
        </div>
      </div>
    );
  }

  const canUnpin = canPinMessage(conversation.myRole, conversation.type === 'GROUP');

  return (
    <motion.div
      {...(reduce ? {} : chatSlidePanel)}
      className="flex h-full min-w-0 flex-col bg-background"
    >
      <ChatHeader
        conversation={conversation}
        typingLabel={typingLabel}
        onConversationChange={setConversation}
        onLeave={() => router.push('/inbox')}
      />

      <PinnedMessagesBanner
        pinned={pinned}
        onScrollTo={(id) => listRef.current?.scrollToMessage(id)}
        onUnpin={handleUnpin}
        canUnpin={canUnpin}
      />

      <div
        className="relative flex min-h-0 flex-1 flex-col"
        style={{
          backgroundImage:
            'radial-gradient(circle at 1px 1px, color-mix(in oklch, var(--border) 35%, transparent) 1px, transparent 0)',
          backgroundSize: '20px 20px',
        }}
      >
        <div className="pointer-events-none absolute inset-0 bg-linear-to-b from-brand-muted/10 via-transparent to-transparent" />

        <MessageList
          ref={listRef}
          messages={messages}
          conversation={conversation}
          loading={loading}
          loadingMore={loadingMore}
          hasMore={hasMore}
          error={error}
          showSender={conversation.type === 'GROUP'}
          editingId={editingId}
          onLoadMore={loadMore}
          onRetry={loadInitial}
          onReply={handleReply}
          onEdit={handleEdit}
          onDelete={handleDelete}
          onToggleReaction={toggleReaction}
          onTogglePin={handleTogglePin}
          onSaveEdit={handleSaveEdit}
          onCancelEdit={() => setEditingId(null)}
        />

        <AnimatePresence mode="wait">
          {typingUsers.length > 0 ? (
            <TypingIndicator key="typing" names={typingUsers.map((u) => u.name)} />
          ) : null}
        </AnimatePresence>
      </div>

      <MessageComposer
        conversationId={conversationId}
        sending={sending}
        replyTo={replyTo}
        onClearReply={() => setReplyTo(null)}
        onSend={handleSend}
        onTyping={sendTyping}
        members={conversation.members}
      />
    </motion.div>
  );
}
