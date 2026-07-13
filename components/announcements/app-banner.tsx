'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { X, ChevronLeft, ChevronRight, Pin } from 'lucide-react';
import { AppIcon } from '@/components/app-icon';
import { cn } from '@/lib/utils';
import { useSocketEvent } from '@/components/socket';
import { fetchActiveAnnouncements, dismissAnnouncements } from '@/lib/api/announcements';
import { TYPE_META, LEVEL_META } from '@/lib/announcements/meta';
import type { Announcement } from '@/lib/announcements/types';

/** A dismissal is keyed by id+updatedAt so edits re-surface the banner. */
const dismissKey = (a: Announcement) => `${a.id}:${a.updatedAt}`;

/** Most severe first, then pinned, then newest. */
function sortActive(list: Announcement[]): Announcement[] {
  return [...list].sort((a, b) => {
    if (a.isPriority !== b.isPriority) return a.isPriority ? -1 : 1;
    const ao = LEVEL_META[a.level].order;
    const bo = LEVEL_META[b.level].order;
    if (ao !== bo) return ao - bo;
    return new Date(b.startsAt ?? b.createdAt).getTime() - new Date(a.startsAt ?? a.createdAt).getTime();
  });
}

export function AppAnnouncementBanner() {
  const [items, setItems] = useState<Announcement[]>([]);
  // Optimistic in-session hide (keyed by id+updatedAt). The server is the source
  // of truth — GET /announcements/active already excludes dismissed items — so we
  // only need to hide instantly between the click and the next fetch.
  const [dismissed, setDismissed] = useState<Set<string>>(() => new Set());
  const [index, setIndex] = useState(0);

  const load = useCallback(() => {
    fetchActiveAnnouncements()
      .then((data) => setItems(sortActive(data)))
      .catch(() => setItems([]));
  }, []);

  useEffect(() => { load(); }, [load]);

  // Real-time: any announcement mutation on the backend refreshes the banner.
  const onMutation = useCallback(() => { load(); }, [load]);
  useSocketEvent('announcement:created', onMutation);
  useSocketEvent('announcement:updated', onMutation);
  useSocketEvent('announcement:deleted', onMutation);

  const visible = useMemo(
    () => items.filter((a) => !dismissed.has(dismissKey(a))),
    [items, dismissed],
  );

  // Keep the carousel index in range as the list changes.
  useEffect(() => {
    if (index > visible.length - 1) setIndex(Math.max(0, visible.length - 1));
  }, [visible.length, index]);

  if (visible.length === 0) return null;

  const current = visible[Math.min(index, visible.length - 1)];
  const meta = TYPE_META[current.type];
  const level = LEVEL_META[current.level];
  const hasMany = visible.length > 1;

  // Dismiss every currently-visible announcement at once — closing the bar
  // shouldn't require clicking N times when several are active. Hide optimistically,
  // then persist per-user on the server (cross-device); roll back if it fails.
  function dismiss() {
    const keys = visible.map(dismissKey);
    const ids = visible.map((a) => a.id);
    setDismissed((prev) => new Set([...prev, ...keys]));
    dismissAnnouncements(ids).catch(() => {
      setDismissed((prev) => {
        const next = new Set(prev);
        keys.forEach((k) => next.delete(k));
        return next;
      });
    });
  }

  return (
    <div className="shrink-0 border-b border-border/60">
      <AnimatePresence mode="wait">
        <motion.div
          key={current.id}
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.22 }}
          className={cn('relative overflow-hidden', meta.soft)}
        >
          {/* Left accent rule */}
          <div className={cn('absolute inset-y-0 left-0 w-1 bg-linear-to-b', meta.gradient)} />

          <div className="flex items-center gap-3 py-2 pl-4 pr-2 sm:pl-5 sm:pr-3">
            {/* Icon */}
            <div
              className={cn(
                'flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-linear-to-br text-white shadow-sm ring-1 ring-white/20',
                meta.gradient,
              )}
            >
              <AppIcon name={current.icon} className="h-4 w-4" />
            </div>

            {/* Text */}
            <div className="flex min-w-0 flex-1 items-center gap-2">
              {current.isPriority && (
                <Pin className="hidden h-3 w-3 shrink-0 text-foreground sm:block" />
              )}
              <span className={cn('hidden shrink-0 rounded-full px-1.5 py-0.5 text-[9px] font-bold tracking-wider sm:inline-block', level.solidBadge)}>
                {level.label.toUpperCase()}
              </span>
              <p className="min-w-0 truncate text-[13px] leading-tight text-foreground">
                <span className="font-semibold">{current.header}</span>
                <span className="mx-1.5 text-muted-foreground/40">—</span>
                <span className="text-muted-foreground">{current.detail}</span>
              </p>
            </div>

            {/* Carousel controls */}
            {hasMany && (
              <div className="flex shrink-0 items-center gap-0.5">
                <button
                  type="button"
                  aria-label="ก่อนหน้า"
                  onClick={() => setIndex((i) => (i - 1 + visible.length) % visible.length)}
                  className="flex h-6 w-6 cursor-pointer items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-foreground/5 hover:text-foreground"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <span className="px-0.5 text-[10px] tabular-nums text-muted-foreground">
                  {Math.min(index, visible.length - 1) + 1}/{visible.length}
                </span>
                <button
                  type="button"
                  aria-label="ถัดไป"
                  onClick={() => setIndex((i) => (i + 1) % visible.length)}
                  className="flex h-6 w-6 cursor-pointer items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-foreground/5 hover:text-foreground"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            )}

            {/* Dismiss */}
            <button
              type="button"
              aria-label="ปิดประกาศทั้งหมด"
              title="ปิดประกาศทั้งหมด"
              onClick={dismiss}
              className="flex h-7 w-7 shrink-0 cursor-pointer items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-foreground/5 hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
