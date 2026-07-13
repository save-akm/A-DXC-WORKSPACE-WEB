'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { AtSign, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { fetchMentions } from '@/lib/api/messages';
import { conversationTime, userDisplayName } from '@/lib/chat/meta';
import type { MentionItem } from '@/lib/chat/types';

interface MentionsSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function MentionsSheet({ open, onOpenChange }: MentionsSheetProps) {
  const [items, setItems] = useState<MentionItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [cursor, setCursor] = useState<string | null>(null);

  const loadMore = useCallback((before?: string) => {
    setLoading(true);
    fetchMentions({ limit: 30, before })
      .then((page) => {
        setItems((prev) => (before ? [...prev, ...page.mentions] : page.mentions));
        setHasMore(page.hasMore);
        setCursor(page.nextCursor);
      })
      .catch(() => {
        if (!before) setItems([]);
      })
      .finally(() => setLoading(false));
  }, []);

  const handleOpenChange = useCallback(
    (next: boolean) => {
      if (next) {
        setLoading(true);
        setItems([]);
      }
      onOpenChange(next);
    },
    [onOpenChange],
  );

  useEffect(() => {
    if (!open) return undefined;
    let cancelled = false;
    fetchMentions({ limit: 30 })
      .then((page) => {
        if (cancelled) return;
        setItems(page.mentions);
        setHasMore(page.hasMore);
        setCursor(page.nextCursor);
      })
      .catch(() => {
        if (!cancelled) setItems([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [open]);

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetContent side="left" className="flex w-full flex-col sm:max-w-md">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <AtSign className="size-4 text-brand" />
            Mention ของฉัน
          </SheetTitle>
          <SheetDescription>ข้อความที่มีการ @mention คุณ</SheetDescription>
        </SheetHeader>

        <div className="min-h-0 flex-1 overflow-y-auto py-2">
          {loading && items.length === 0 ? (
            <div className="flex justify-center py-12">
              <Loader2 className="size-5 animate-spin text-muted-foreground" />
            </div>
          ) : items.length === 0 ? (
            <p className="py-12 text-center text-sm text-muted-foreground">ยังไม่มี mention</p>
          ) : (
            <ul className="space-y-1">
              {items.map((item) => {
                const msg = item.message;
                const sender = userDisplayName(msg.sender);
                return (
                  <li key={item.id}>
                    <Link
                      href={`/inbox/${item.conversationId}`}
                      onClick={() => handleOpenChange(false)}
                      className="block rounded-xl px-4 py-2.5 transition-colors hover:bg-accent/60"
                    >
                      <div className="flex items-baseline justify-between gap-2">
                        <span className="truncate text-sm font-medium">{sender}</span>
                        <span className="shrink-0 text-[11px] text-muted-foreground">
                          {conversationTime(item.mentionCreatedAt)}
                        </span>
                      </div>
                      <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">
                        {msg.content ?? '[ไฟล์/รูป]'}
                      </p>
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}

          {hasMore && !loading ? (
            <div className="flex justify-center py-3">
              <Button variant="ghost" size="sm" onClick={() => cursor && loadMore(cursor)}>
                โหลดเพิ่ม
              </Button>
            </div>
          ) : null}
        </div>
      </SheetContent>
    </Sheet>
  );
}
