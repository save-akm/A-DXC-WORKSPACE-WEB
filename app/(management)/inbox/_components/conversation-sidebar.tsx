'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { Archive, AtSign, MessageSquarePlus, RefreshCw, Search, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import {
  fetchConversations,
  starConversation,
} from '@/lib/api/conversations';
import { sortConversations, messagePreview } from '@/lib/chat/meta';
import type { ChatConversationUpdatedEvent, ChatMessageEvent, ChatReadEvent, Conversation, SidebarTab } from '@/lib/chat/types';
import { useSocketEvent } from '@/components/socket/SocketProvider';
import { ConversationListItem } from './conversation-list-item';
import { SidebarTabs } from './sidebar-tabs';
import { NewChatSheet } from './new-chat-sheet';
import { MentionsSheet } from './mentions-sheet';

function activeConversationId(pathname: string): string | null {
  const match = pathname.match(/^\/inbox\/(?!join)([^/]+)$/);
  return match?.[1] ?? null;
}

export function ConversationSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const reduce = useReducedMotion();
  const selectedId = activeConversationId(pathname);

  const [tab, setTab] = useState<SidebarTab>('active');
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [newChatOpen, setNewChatOpen] = useState(false);
  const [mentionsOpen, setMentionsOpen] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    setError(null);
    fetchConversations({ archived: tab === 'archived' ? true : false })
      .then((data) => setConversations(sortConversations(data)))
      .catch((e) => setError((e as Error)?.message ?? 'โหลดรายการแชทไม่สำเร็จ'))
      .finally(() => setLoading(false));
  }, [tab]);

  useEffect(() => {
    let cancelled = false;
    fetchConversations({ archived: tab === 'archived' ? true : false })
      .then((data) => {
        if (!cancelled) setConversations(sortConversations(data));
      })
      .catch((e) => {
        if (!cancelled) setError((e as Error)?.message ?? 'โหลดรายการแชทไม่สำเร็จ');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [tab]);

  const patchFromMessage = useCallback((...args: unknown[]) => {
    const evt = args[0] as ChatMessageEvent;
    if (!evt?.conversationId || !evt.message) {
      load();
      return;
    }

    setConversations((prev) => {
      const idx = prev.findIndex((c) => c.id === evt.conversationId);
      const preview = messagePreview(
        evt.message.type,
        evt.message.content ?? (evt.message.attachments?.length ? '' : null),
      );
      const at = evt.message.createdAt;

      if (idx === -1) {
        load();
        return prev;
      }

      const current = prev[idx];
      const isActive = selectedId === evt.conversationId;

      const updated: Conversation = {
        ...current,
        lastMessageId: evt.message.id,
        lastMessagePreview: preview || current.lastMessagePreview,
        lastMessageAt: at,
        unreadCount: isActive ? current.unreadCount : current.unreadCount + 1,
        updatedAt: at,
      };

      const next = [...prev];
      next.splice(idx, 1);
      return sortConversations([updated, ...next]);
    });
  }, [load, selectedId]);

  const patchFromRead = useCallback((...args: unknown[]) => {
    const evt = args[0] as ChatReadEvent;
    if (!evt?.conversationId) return;
    setConversations((prev) =>
      prev.map((c) =>
        c.id === evt.conversationId ? { ...c, unreadCount: 0 } : c,
      ),
    );
  }, []);

  const patchFromConversationUpdated = useCallback((...args: unknown[]) => {
    const evt = args[0] as ChatConversationUpdatedEvent;
    if (!evt?.conversationId || !evt.conversation) return;
    const updated = evt.conversation;

    setConversations((prev) => {
      const exists = prev.findIndex((c) => c.id === updated.id);
      const belongsHere = tab === 'archived' ? updated.isArchived : !updated.isArchived;

      if (!belongsHere) {
        // conversation moved to other tab — remove from current list
        return exists === -1 ? prev : prev.filter((c) => c.id !== updated.id);
      }

      if (exists === -1) {
        // conversation now belongs here — add it
        return sortConversations([updated, ...prev]);
      }

      // update in-place
      const next = [...prev];
      next[exists] = updated;
      return sortConversations(next);
    });
  }, [tab]);

  useSocketEvent('chat:message', patchFromMessage, [patchFromMessage]);
  useSocketEvent('chat:read', patchFromRead, [patchFromRead]);
  useSocketEvent('chat:conversation-updated', patchFromConversationUpdated, [patchFromConversationUpdated]);

  // chat:message only arrives when the socket has joined the conversation room.
  // When the user is on the inbox list (no specific chat open), they haven't joined any room,
  // so new messages won't trigger patchFromMessage. Instead, we listen to chat:unread-total
  // which is always delivered to the user's personal room — reload the list when the total
  // increases so unread badges stay accurate.
  const prevUnreadTotalRef = useRef(0);
  const handleUnreadTotalInSidebar = useCallback((...args: unknown[]) => {
    const { totalUnread = 0 } = args[0] as { totalUnread?: number };
    if (totalUnread > prevUnreadTotalRef.current) load();
    prevUnreadTotalRef.current = totalUnread;
  }, [load]);
  useSocketEvent('chat:unread-total', handleUnreadTotalInSidebar, [handleUnreadTotalInSidebar]);

  // local archive/unarchive — dispatched by chat-header without relying on socket
  useEffect(() => {
    const handler = (e: Event) => {
      const updated = (e as CustomEvent<Conversation>).detail;
      if (!updated?.id) return;
      setConversations((prev) => {
        const exists = prev.findIndex((c) => c.id === updated.id);
        const belongsHere = tab === 'archived' ? updated.isArchived : !updated.isArchived;
        if (!belongsHere) {
          return exists === -1 ? prev : prev.filter((c) => c.id !== updated.id);
        }
        if (exists === -1) return sortConversations([updated, ...prev]);
        const next = [...prev];
        next[exists] = updated;
        return sortConversations(next);
      });
    };
    window.addEventListener('inbox:conversation-updated', handler);
    return () => window.removeEventListener('inbox:conversation-updated', handler);
  }, [tab]);

  const handleStar = useCallback((conversationId: string, isStarred: boolean) => {
    setConversations((prev) =>
      prev.map((c) => (c.id === conversationId ? { ...c, isStarred } : c)),
    );
    starConversation(conversationId, isStarred).catch(() => {
      setConversations((prev) =>
        prev.map((c) => (c.id === conversationId ? { ...c, isStarred: !isStarred } : c)),
      );
    });
  }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return conversations;
    return conversations.filter((c) => c.displayName.toLowerCase().includes(q));
  }, [conversations, search]);

  const { starred, unstarred } = useMemo(() => {
    if (tab !== 'active') return { starred: [] as typeof filtered, unstarred: filtered };
    return {
      starred: filtered.filter((c) => c.isStarred),
      unstarred: filtered.filter((c) => !c.isStarred),
    };
  }, [filtered, tab]);

  const unreadTotal = useMemo(
    () => conversations.reduce((sum, c) => sum + c.unreadCount, 0),
    [conversations],
  );

  const handleCreated = useCallback(
    (conversation: Conversation) => {
      setNewChatOpen(false);
      router.push(`/inbox/${conversation.id}`);
    },
    [router],
  );

  return (
    <>
      <aside
        className={cn(
          'relative flex h-full w-full max-w-[360px] shrink-0 flex-col',
          'border-r border-border/60 bg-sidebar/40 backdrop-blur-sm',
          'sm:w-[340px]',
        )}
      >
        {!reduce ? (
          <div
            aria-hidden
            className="pointer-events-none absolute inset-x-0 top-0 h-24 bg-linear-to-b from-brand-muted/30 to-transparent"
          />
        ) : null}

        <div className="relative shrink-0 space-y-3 border-b border-border/60 px-4 pb-4 pt-4">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h1 className="type-page-title text-lg">Inbox</h1>
                {unreadTotal > 0 ? (
                  <span className="rounded-full bg-brand-muted px-2 py-0.5 text-[10px] font-semibold text-brand">
                    {unreadTotal} ใหม่
                  </span>
                ) : null}
              </div>
              <p className="text-xs text-muted-foreground">แชทส่วนตัวและกลุ่ม</p>
            </div>
            <div className="flex shrink-0 items-center gap-0.5">
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={() => setMentionsOpen(true)}
                aria-label="Mention ของฉัน"
              >
                <AtSign className="size-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={load}
                disabled={loading}
                aria-label="รีเฟรชรายการแชท"
              >
                <RefreshCw className={cn('size-4', loading && 'animate-spin')} />
              </Button>
              <Button
                variant="create"
                size="icon-sm"
                onClick={() => setNewChatOpen(true)}
                aria-label="เริ่มแชทใหม่"
              >
                <MessageSquarePlus className="size-4" />
              </Button>
            </div>
          </div>

          <SidebarTabs
            value={tab}
            onChange={(next) => {
              setTab(next);
              setLoading(true);
              setError(null);
            }}
          />

          <div className="relative">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="ค้นหาแชท..."
              className="h-8 border-border/60 bg-background/70 pl-8"
            />
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-2 py-2">
          {loading && conversations.length === 0 ? (
            <div className="space-y-2 px-1 py-2">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="flex animate-pulse items-center gap-3 rounded-xl px-3 py-2.5">
                  <div className="size-10 shrink-0 rounded-full bg-muted" />
                  <div className="min-w-0 flex-1 space-y-2">
                    <div className="h-3 w-2/3 rounded bg-muted" />
                    <div className="h-2.5 w-full rounded bg-muted/70" />
                  </div>
                </div>
              ))}
            </div>
          ) : null}

          {!loading && error ? (
            <div className="flex flex-col items-center gap-3 px-4 py-10 text-center">
              <p className="text-sm text-destructive">{error}</p>
              <Button variant="outline" size="sm" onClick={load}>
                ลองใหม่
              </Button>
            </div>
          ) : null}

          {!loading && !error && filtered.length === 0 ? (
            <motion.div
              {...(reduce ? {} : { initial: { opacity: 0, y: 8 }, animate: { opacity: 1, y: 0 } })}
              className="flex flex-col items-center justify-center gap-3 px-4 py-16 text-center"
            >
              <div className="flex size-12 items-center justify-center rounded-xl bg-muted ring-1 ring-border/60">
                {tab === 'archived' ? (
                  <Archive className="size-5 text-muted-foreground" />
                ) : (
                  <MessageSquarePlus className="size-5 text-muted-foreground" />
                )}
              </div>
              <div>
                <p className="text-sm font-medium">
                  {search.trim()
                    ? 'ไม่พบแชทที่ค้นหา'
                    : tab === 'archived'
                      ? 'ยังไม่มีแชทที่เก็บถาวร'
                      : 'ยังไม่มีการสนทนา'}
                </p>
                <p className="text-xs text-muted-foreground">
                  {search.trim()
                    ? 'ลองคำค้นอื่น หรือล้างช่องค้นหา'
                    : tab === 'archived'
                      ? 'แชทที่ archive จะแสดงที่นี่'
                      : 'เริ่มแชทใหม่ด้วยปุ่ม + ด้านบน'}
                </p>
              </div>
              {!search.trim() && tab === 'active' ? (
                <Button variant="create" size="sm" onClick={() => setNewChatOpen(true)}>
                  <MessageSquarePlus />
                  เริ่มแชท
                </Button>
              ) : null}
            </motion.div>
          ) : null}

          <AnimatePresence mode="popLayout">
            {!error && filtered.length > 0 ? (
              <motion.div
                key={tab}
                initial={reduce ? false : { opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.15 }}
              >
                {/* Starred section — active tab only */}
                {starred.length > 0 ? (
                  <>
                    <div className="px-3 pb-1 pt-1">
                      <span className="flex items-center gap-1 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                        <Star className="size-2.5 fill-amber-400 text-amber-400" />
                        ติดดาว
                      </span>
                    </div>
                    <ul className="space-y-0.5">
                      {starred.map((c, i) => (
                        <ConversationListItem
                          key={c.id}
                          conversation={c}
                          active={selectedId === c.id}
                          index={i}
                          onStar={() => handleStar(c.id, !c.isStarred)}
                        />
                      ))}
                    </ul>
                    {unstarred.length > 0 ? (
                      <div className="mx-3 my-1.5 border-t border-border/40" />
                    ) : null}
                  </>
                ) : null}

                {/* Main list (unstarred for active, all for archived) */}
                <ul className="space-y-0.5">
                  {(tab === 'active' ? unstarred : filtered).map((c, i) => (
                    <ConversationListItem
                      key={c.id}
                      conversation={c}
                      active={selectedId === c.id}
                      index={i}
                      onStar={tab === 'active' ? () => handleStar(c.id, !c.isStarred) : undefined}
                    />
                  ))}
                </ul>
              </motion.div>
            ) : null}
          </AnimatePresence>
        </div>
      </aside>

      <NewChatSheet
        open={newChatOpen}
        onOpenChange={setNewChatOpen}
        onCreated={handleCreated}
      />
      <MentionsSheet open={mentionsOpen} onOpenChange={setMentionsOpen} />
    </>
  );
}
