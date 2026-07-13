'use client';

import { forwardRef, useCallback, useEffect, useImperativeHandle, useRef } from 'react';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { groupMessagesByDate } from '@/lib/chat/meta';
import type { Conversation, Message } from '@/lib/chat/types';
import { MessageBubble } from './message-bubble';
import { DateDivider } from './message-bits';

export interface MessageListHandle {
  scrollToMessage: (messageId: string) => void;
}

interface MessageListProps {
  messages: Message[];
  conversation: Conversation;
  loading: boolean;
  loadingMore: boolean;
  hasMore: boolean;
  error: string | null;
  showSender: boolean;
  editingId: string | null;
  onLoadMore: () => void;
  onRetry: () => void;
  onReply: (message: Message) => void;
  onEdit: (message: Message) => void;
  onDelete: (message: Message) => void;
  onToggleReaction: (message: Message, emoji: string) => void;
  onTogglePin: (message: Message) => void;
  onSaveEdit: (message: Message, content: string) => void;
  onCancelEdit: () => void;
}

export const MessageList = forwardRef<MessageListHandle, MessageListProps>(function MessageList(
  {
    messages,
    conversation,
    loading,
    loadingMore,
    hasMore,
    error,
    showSender,
    editingId,
    onLoadMore,
    onRetry,
    onReply,
    onEdit,
    onDelete,
    onToggleReaction,
    onTogglePin,
    onSaveEdit,
    onCancelEdit,
  },
  ref,
) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const prevCount = useRef(messages.length);
  const isNearBottom = useRef(true);

  const scrollToBottom = useCallback((behavior: ScrollBehavior = 'smooth') => {
    bottomRef.current?.scrollIntoView({ behavior, block: 'end' });
  }, []);

  useImperativeHandle(ref, () => ({
    scrollToMessage: (messageId: string) => {
      document.getElementById(`msg-${messageId}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    },
  }));

  useEffect(() => {
    if (loading) return;
    if (messages.length > prevCount.current && isNearBottom.current) {
      scrollToBottom(prevCount.current === 0 ? 'instant' : 'smooth');
    }
    prevCount.current = messages.length;
  }, [messages.length, loading, scrollToBottom]);

  const handleScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    isNearBottom.current = el.scrollHeight - el.scrollTop - el.clientHeight < 80;
    if (el.scrollTop < 80 && hasMore && !loadingMore) {
      onLoadMore();
    }
  }, [hasMore, loadingMore, onLoadMore]);

  const groups = groupMessagesByDate(messages);

  if (loading) {
    return (
      <div className="flex flex-1 flex-col gap-1 overflow-hidden px-4 py-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex gap-3 py-0.5">
            {i === 0 || i === 2 || i === 4 ? (
              <div className="size-8 shrink-0 animate-pulse rounded-full bg-muted" />
            ) : (
              <div className="w-8 shrink-0" />
            )}
            <div className="flex flex-col gap-1 pt-0.5">
              {i === 0 || i === 2 || i === 4 ? (
                <div className="h-3 w-20 animate-pulse rounded bg-muted" />
              ) : null}
              <div
                className="animate-pulse rounded-2xl bg-muted"
                style={{ width: `${120 + (i % 3) * 60}px`, height: 36 }}
              />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-3 p-6 text-center">
        <p className="text-sm text-destructive">{error}</p>
        <Button variant="outline" size="sm" onClick={onRetry}>
          ลองใหม่
        </Button>
      </div>
    );
  }

  if (messages.length === 0) {
    return (
      <div className="flex flex-1 items-center justify-center p-6 text-center">
        <p className="text-sm text-muted-foreground">ยังไม่มีข้อความ — ส่งข้อความแรกได้เลย</p>
      </div>
    );
  }

  return (
    <div
      ref={scrollRef}
      onScroll={handleScroll}
      className="flex min-h-0 flex-1 flex-col overflow-y-auto overscroll-contain py-3"
    >
      {loadingMore ? (
        <div className="flex justify-center py-2">
          <Loader2 className="size-4 animate-spin text-muted-foreground" />
        </div>
      ) : hasMore ? (
        <div className="flex justify-center py-1">
          <Button variant="ghost" size="sm" onClick={onLoadMore}>
            โหลดข้อความเก่า
          </Button>
        </div>
      ) : null}

      {groups.map((group) => (
        <div key={group.label}>
          <DateDivider label={group.label} />
          {group.items.map((msg, idx) => {
            const prev = idx > 0 ? group.items[idx - 1] : null;
            const isFirstInGroup =
              !prev ||
              prev.sender.id !== msg.sender.id ||
              prev.type === 'SYSTEM' ||
              new Date(msg.createdAt).getTime() - new Date(prev.createdAt).getTime() > 5 * 60 * 1000;
            return (
              <MessageBubble
                key={msg.id}
                message={msg}
                showSender={isFirstInGroup}
                conversation={conversation}
                editing={editingId === msg.id}
                onReply={onReply}
                onEdit={onEdit}
                onDelete={onDelete}
                onToggleReaction={onToggleReaction}
                onTogglePin={onTogglePin}
                onSaveEdit={onSaveEdit}
                onCancelEdit={onCancelEdit}
              />
            );
          })}
        </div>
      ))}
      <div ref={bottomRef} className="h-px shrink-0" aria-hidden />
    </div>
  );
});
