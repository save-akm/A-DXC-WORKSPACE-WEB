'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import {
  ArrowUpRight,
  Bell,
  BellOff,
  CheckCheck,
  Inbox,
  Send,
  Sparkles,
  Trash2,
  TriangleAlert,
  X,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { PageHeader } from '@/components/management/page-header';
import { Pagination } from '@/components/management/pagination';
import { useSocketEvent } from '@/components/socket/SocketProvider';
import { useMenuPermission } from '@/lib/hooks/use-menu-permission';
import {
  dismissAll,
  dismissNotifications,
  fetchInbox,
  fetchUnreadCount,
  markAllRead,
  markRead,
} from '@/lib/api/notifications';
import {
  DATE_GROUP_LABELS,
  dateGroup,
  relativeTime,
  typeMeta,
  type DateGroup,
} from '@/lib/notifications/meta';
import {
  NOTIFICATION_TYPES,
  type InboxItem,
  type NotificationNewEvent,
  type NotificationReadEvent,
  type NotificationType,
  type NotificationUpdatedEvent,
} from '@/lib/notifications/types';
import { FeedState, IconChip, PriorityBadge, TypeBadge } from './_components/notification-bits';
import { NotificationDetailSheet } from './_components/notification-detail-sheet';
import { ComposeSheet } from './_components/compose-sheet';

const PAGE_SIZE = 20;
const EASE = [0.4, 0, 0.2, 1] as const;

type TypeFilter = NotificationType | 'ALL';

export default function NotificationsPage() {
  const reduce = useReducedMotion();

  // CREATE on the `notification` node unlocks composing/broadcasting from here.
  // An absent node (SYSTEM/super-admin bypassing menu perms) falls through to true.
  const { canView, canCreate, canUpdate, canDelete } = useMenuPermission('notification');
  const hasCreate = (!canView && !canCreate && !canUpdate && !canDelete) || canCreate;
  const [composeOpen, setComposeOpen] = useState(false);

  const [items, setItems] = useState<InboxItem[]>([]);
  const [total, setTotal] = useState(0);
  const [unreadCount, setUnreadCount] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [typeFilter, setTypeFilter] = useState<TypeFilter>('ALL');
  const [unreadOnly, setUnreadOnly] = useState(false);
  const [incoming, setIncoming] = useState(0);
  const [busy, setBusy] = useState(false);

  const [selected, setSelected] = useState<InboxItem | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);

  // ── Data ─────────────────────────────────────────────────────────────────────

  const load = useCallback(() => {
    setLoading(true);
    setError(null);
    setIncoming(0);
    fetchInbox({
      page,
      limit: PAGE_SIZE,
      unreadOnly: unreadOnly || undefined,
      type: typeFilter === 'ALL' ? undefined : typeFilter,
    })
      .then((res) => {
        setItems(res.data);
        setTotal(res.total);
      })
      .catch((e) => setError((e as Error)?.message ?? 'โหลดการแจ้งเตือนไม่สำเร็จ'))
      .finally(() => setLoading(false));
  }, [page, unreadOnly, typeFilter]);

  useEffect(() => { load(); }, [load]);

  // Unread count — independent of the current filter/page.
  const refreshUnread = useCallback(() => {
    fetchUnreadCount().then(setUnreadCount).catch(() => { /* keep last known */ });
  }, []);
  useEffect(() => { refreshUnread(); }, [refreshUnread]);

  // ── Real-time ──────────────────────────────────────────────────────────────────

  const onNew = useCallback((...args: unknown[]) => {
    const evt = args[0] as NotificationNewEvent;
    // Trust the server's count when present — aggregated events don't bump it.
    setUnreadCount((c) => (typeof evt.unreadCount === 'number' ? evt.unreadCount : c + 1));
    // Don't splice into the middle of a paginated/filtered view — surface a
    // "new" pill the user taps to refresh. Only count it when it could appear.
    const matchesType = typeFilter === 'ALL' || evt.type === typeFilter;
    if (page === 1 && matchesType) setIncoming((n) => n + 1);
  }, [page, typeFilter]);

  /**
   * An existing unread notification was rewritten in place (aggregation).
   * Patch the row when it's on screen; it is not a new arrival, so neither the
   * "new" pill nor the badge count moves.
   */
  const onUpdated = useCallback((...args: unknown[]) => {
    const evt = args[0] as NotificationUpdatedEvent;
    if (typeof evt.unreadCount === 'number') setUnreadCount(evt.unreadCount);
    setItems((prev) =>
      prev.map((it) =>
        it.id === evt.recipientId
          ? { ...it, notification: { ...it.notification, header: evt.header, detail: evt.detail } }
          : it,
      ),
    );
  }, []);

  const onRead = useCallback((...args: unknown[]) => {
    const evt = args[0] as NotificationReadEvent;
    if (typeof evt?.unreadCount === 'number') setUnreadCount(evt.unreadCount);
    const ids = new Set(evt?.recipientIds ?? []);
    if (ids.size === 0) return;
    setItems((prev) =>
      unreadOnly
        ? prev.filter((it) => !ids.has(it.id))
        : prev.map((it) => (ids.has(it.id) ? { ...it, isRead: true } : it)),
    );
  }, [unreadOnly]);

  const onDismissed = useCallback((...args: unknown[]) => {
    const evt = args[0] as { unreadCount?: number };
    if (typeof evt?.unreadCount === 'number') setUnreadCount(evt.unreadCount);
  }, []);

  useSocketEvent('notification:new', onNew, [onNew]);
  useSocketEvent('notification:updated', onUpdated, [onUpdated]);
  useSocketEvent('notification:read', onRead, [onRead]);
  useSocketEvent('notification:dismissed', onDismissed, [onDismissed]);

  // ── Mutations (optimistic) ──────────────────────────────────────────────────────

  const doMarkRead = useCallback((id: string) => {
    setItems((prev) =>
      unreadOnly
        ? prev.filter((it) => it.id !== id)
        : prev.map((it) => (it.id === id ? { ...it, isRead: true, readAt: new Date().toISOString() } : it)),
    );
    setUnreadCount((c) => Math.max(0, c - 1));
    markRead(id)
      .then((r) => setUnreadCount(r.unreadCount))
      .catch(() => { refreshUnread(); load(); });
  }, [unreadOnly, refreshUnread, load]);

  const doDismiss = useCallback((id: string) => {
    const wasUnread = items.find((it) => it.id === id && !it.isRead);
    setItems((prev) => prev.filter((it) => it.id !== id));
    setTotal((t) => Math.max(0, t - 1));
    if (wasUnread) setUnreadCount((c) => Math.max(0, c - 1));
    dismissNotifications([id])
      .then((r) => setUnreadCount(r.unreadCount))
      .catch(() => { refreshUnread(); load(); });
  }, [items, refreshUnread, load]);

  const doMarkAll = useCallback(() => {
    if (busy || unreadCount === 0) return;
    setBusy(true);
    setItems((prev) => (unreadOnly ? [] : prev.map((it) => ({ ...it, isRead: true }))));
    setUnreadCount(0);
    markAllRead()
      .then((r) => setUnreadCount(r.unreadCount))
      .catch(() => { refreshUnread(); })
      .finally(() => { setBusy(false); if (unreadOnly) load(); });
  }, [busy, unreadCount, unreadOnly, refreshUnread, load]);

  const doDismissAll = useCallback(() => {
    if (busy || total === 0) return;
    setBusy(true);
    setItems([]);
    setTotal(0);
    setUnreadCount(0);
    dismissAll()
      .then((r) => setUnreadCount(r.unreadCount))
      .catch(() => { refreshUnread(); })
      .finally(() => { setBusy(false); load(); });
  }, [busy, total, refreshUnread, load]);

  // ── Interaction ──────────────────────────────────────────────────────────────────

  const openDetail = (item: InboxItem) => {
    setSelected(item);
    setSheetOpen(true);
    if (!item.isRead) doMarkRead(item.id);
  };

  const setFilter = (t: TypeFilter) => { setTypeFilter(t); setPage(1); };
  const toggleUnread = () => { setUnreadOnly((v) => !v); setPage(1); };

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  // Group items into date buckets, preserving server order (newest first).
  const groups = useMemo(() => {
    const order: DateGroup[] = ['today', 'yesterday', 'week', 'older'];
    const map = new Map<DateGroup, InboxItem[]>();
    for (const it of items) {
      const g = dateGroup(it.notification.sentAt ?? it.notification.createdAt);
      const bucket = map.get(g);
      if (bucket) bucket.push(it);
      else map.set(g, [it]);
    }
    return order.filter((g) => map.has(g)).map((g) => ({ group: g, items: map.get(g)! }));
  }, [items]);

  // ── Render ───────────────────────────────────────────────────────────────────────

  return (
    <div className="page-shell">
      <PageHeader
        icon={Bell}
        title="การแจ้งเตือน"
        subtitle="ติดตามความเคลื่อนไหว งานที่ได้รับมอบหมาย และประกาศจากระบบในที่เดียว"
        actions={
          <>
            <Button
              variant="ghost"
              size="lg"
              onClick={doMarkAll}
              disabled={busy || unreadCount === 0}
              className="hidden sm:inline-flex"
            >
              <CheckCheck />
              อ่านทั้งหมด
            </Button>
            <Button
              variant="ghost"
              size="lg"
              onClick={doDismissAll}
              disabled={busy || total === 0}
              className="text-muted-foreground hover:text-rose-600 dark:hover:text-rose-400"
            >
              <Trash2 />
              <span className="hidden sm:inline">ล้างทั้งหมด</span>
            </Button>
            {hasCreate && (
              <>
                <span aria-hidden className="mx-0.5 hidden h-5 w-px bg-border sm:inline-block" />
                <Button variant="create" size="lg" onClick={() => setComposeOpen(true)}>
                  <Send />
                  <span className="hidden sm:inline">ส่งการแจ้งเตือน</span>
                </Button>
              </>
            )}
          </>
        }
      />

      {/* Toolbar: type filter + unread toggle */}
      <motion.div
        initial={reduce ? false : { opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, ease: EASE }}
        className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between"
      >
        <div className="flex flex-wrap items-center gap-1.5">
          <FilterPill active={typeFilter === 'ALL'} onClick={() => setFilter('ALL')}>
            ทั้งหมด
          </FilterPill>
          {NOTIFICATION_TYPES.map((t) => {
            const meta = typeMeta(t);
            const active = typeFilter === t;
            return (
              <FilterPill key={t} active={active} onClick={() => setFilter(t)}>
                <span className={cn('size-1.5 rounded-full', active ? 'bg-brand' : meta.dot)} />
                {meta.label}
              </FilterPill>
            );
          })}
        </div>

        <button
          type="button"
          onClick={toggleUnread}
          role="switch"
          aria-checked={unreadOnly}
          className={cn(
            'inline-flex shrink-0 cursor-pointer items-center gap-2 self-start rounded-full border px-3 py-1.5 text-xs font-medium transition-colors lg:self-auto',
            unreadOnly
              ? 'border-brand/30 bg-brand-muted text-brand'
              : 'border-border/60 bg-card/40 text-muted-foreground hover:border-border hover:text-foreground',
          )}
        >
          <span className={cn('size-1.5 rounded-full', unreadOnly ? 'bg-brand' : 'bg-muted-foreground/40')} />
          เฉพาะที่ยังไม่อ่าน
          {unreadCount > 0 && (
            <span
              className={cn(
                'inline-flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[10px] font-bold',
                unreadOnly ? 'bg-brand text-brand-foreground' : 'bg-muted text-foreground',
              )}
            >
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          )}
        </button>
      </motion.div>

      {/* Feed */}
      <motion.div
        initial={reduce ? false : { opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.08, ease: EASE }}
      >
        <Card className="overflow-hidden">
          <CardContent className="p-0">
            {/* New-notifications pill */}
            <AnimatePresence>
              {incoming > 0 && (
                <motion.button
                  type="button"
                  onClick={load}
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  className="flex w-full cursor-pointer items-center justify-center gap-2 border-b bg-brand-muted/60 py-2.5 text-xs font-semibold text-brand transition-colors hover:bg-brand-muted"
                >
                  <Sparkles className="size-3.5" />
                  มีการแจ้งเตือนใหม่ {incoming} รายการ — แตะเพื่อโหลด
                </motion.button>
              )}
            </AnimatePresence>

            {loading ? (
              <FeedSkeleton />
            ) : error ? (
              <FeedState
                icon={<TriangleAlert className="size-6" />}
                title="โหลดการแจ้งเตือนไม่สำเร็จ"
                hint={error}
                action={<Button variant="outline" size="sm" onClick={load}>ลองอีกครั้ง</Button>}
              />
            ) : items.length === 0 ? (
              unreadOnly || typeFilter !== 'ALL' ? (
                <FeedState
                  icon={<Inbox className="size-6" />}
                  title="ไม่พบการแจ้งเตือนที่ตรงกับตัวกรอง"
                  hint="ลองล้างตัวกรองหรือเลือกประเภทอื่น"
                  action={
                    <Button variant="outline" size="sm" onClick={() => { setTypeFilter('ALL'); setUnreadOnly(false); setPage(1); }}>
                      ล้างตัวกรอง
                    </Button>
                  }
                />
              ) : (
                <FeedState
                  icon={<BellOff className="size-6" />}
                  title="ไม่มีการแจ้งเตือน"
                  hint="เคลียร์ครบทุกรายการแล้ว — เริ่มต้นวันใหม่ได้เลย"
                />
              )
            ) : (
              <div>
                {groups.map(({ group, items: groupItems }) => (
                  <section key={group}>
                    <div className="sticky top-0 z-10 flex items-center gap-2 border-b bg-card/80 px-4 py-1.5 backdrop-blur-sm sm:px-5">
                      <span className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                        {DATE_GROUP_LABELS[group]}
                      </span>
                      <span className="text-[11px] text-muted-foreground/60">· {groupItems.length}</span>
                    </div>
                    <AnimatePresence initial={false}>
                      {groupItems.map((item, i) => (
                        <NotificationRow
                          key={item.id}
                          item={item}
                          index={i}
                          reduce={!!reduce}
                          onOpen={() => openDetail(item)}
                          onMarkRead={() => doMarkRead(item.id)}
                          onDismiss={() => doDismiss(item.id)}
                        />
                      ))}
                    </AnimatePresence>
                  </section>
                ))}
              </div>
            )}

            {!loading && !error && total > PAGE_SIZE && (
              <Pagination
                page={page}
                totalPages={totalPages}
                total={total}
                pageSize={PAGE_SIZE}
                onChange={setPage}
                layoutId="notifications-page-active-bg"
                itemLabel="รายการ"
              />
            )}
          </CardContent>
        </Card>
      </motion.div>

      <NotificationDetailSheet
        item={selected}
        open={sheetOpen}
        onClose={() => setSheetOpen(false)}
        onDismiss={doDismiss}
      />

      {hasCreate && (
        <ComposeSheet
          open={composeOpen}
          onClose={() => setComposeOpen(false)}
          onCreated={() => { load(); refreshUnread(); }}
        />
      )}
    </div>
  );
}

// ── Filter pill ────────────────────────────────────────────────────────────────────

function FilterPill({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'inline-flex cursor-pointer items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium transition-colors',
        active
          ? 'border-brand/30 bg-brand-muted text-brand'
          : 'border-border/60 bg-card/40 text-muted-foreground hover:border-border hover:text-foreground',
      )}
    >
      {children}
    </button>
  );
}

// ── Row ────────────────────────────────────────────────────────────────────────────

function NotificationRow({
  item,
  index,
  reduce,
  onOpen,
  onMarkRead,
  onDismiss,
}: {
  item: InboxItem;
  index: number;
  reduce: boolean;
  onOpen: () => void;
  onMarkRead: () => void;
  onDismiss: () => void;
}) {
  const n = item.notification;
  const unread = !item.isRead;
  const meta = typeMeta(n.type);

  return (
    <motion.div
      layout={!reduce}
      initial={reduce ? false : { opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={reduce ? { opacity: 0 } : { opacity: 0, height: 0, marginTop: 0 }}
      transition={{ duration: 0.22, delay: Math.min(index * 0.025, 0.2), ease: EASE }}
      onClick={onOpen}
      className={cn(
        'group relative flex cursor-pointer items-start gap-3 border-b px-4 py-3.5 transition-colors last:border-b-0 sm:px-5',
        unread ? 'bg-brand/[0.06] hover:bg-brand/[0.1]' : 'hover:bg-accent/30',
      )}
    >
      {/* Unread marker — a dot, not a side stripe */}
      <span className="flex w-2 shrink-0 justify-center pt-2.5">
        {unread ? <span className={cn('size-2 rounded-full', meta.dot)} /> : null}
      </span>

      <IconChip icon={n.icon} type={n.type} />

      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-3">
          <div className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1">
            <p className={cn('text-sm leading-snug', unread ? 'font-semibold text-foreground' : 'font-medium text-foreground/80')}>
              {n.header}
            </p>
            {unread && (
              <span className="inline-flex shrink-0 items-center rounded-full bg-brand-muted px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-brand">
                ยังไม่อ่าน
              </span>
            )}
          </div>
          <time className="shrink-0 pt-0.5 text-[11px] text-muted-foreground/80" title={n.createdAt}>
            {relativeTime(n.sentAt ?? n.createdAt)}
          </time>
        </div>
        <p className="mt-0.5 line-clamp-2 text-xs leading-relaxed text-muted-foreground">
          {n.detail}
        </p>
        <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
          <TypeBadge type={n.type} />
          <PriorityBadge priority={n.priority} />
          {n.actionUrl && (
            <span className="inline-flex items-center gap-0.5 text-[11px] text-muted-foreground/70">
              <ArrowUpRight className="size-3" />
              มีลิงก์
            </span>
          )}
        </div>
      </div>

      {/* Hover quick actions — a floating cluster lifted off the row */}
      <TooltipProvider delay={200}>
        <div className="absolute right-3 top-2.5 flex translate-x-1 items-center gap-1 rounded-xl border border-border/70 bg-popover/95 p-1 opacity-0 shadow-md ring-1 ring-black/[0.03] backdrop-blur-sm transition-all duration-200 ease-out group-hover:translate-x-0 group-hover:opacity-100 focus-within:translate-x-0 focus-within:opacity-100 sm:right-4">
          {unread && (
            <>
              <Tooltip>
                <TooltipTrigger
                  render={
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); onMarkRead(); }}
                      aria-label="ทำเครื่องหมายว่าอ่านแล้ว"
                      className="inline-flex size-7 cursor-pointer items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-brand-muted hover:text-brand"
                    >
                      <CheckCheck className="size-3.5" />
                    </button>
                  }
                />
                <TooltipContent>ทำเครื่องหมายว่าอ่านแล้ว</TooltipContent>
              </Tooltip>
              <span aria-hidden className="h-4 w-px bg-border/70" />
            </>
          )}
          <Tooltip>
            <TooltipTrigger
              render={
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); onDismiss(); }}
                  aria-label="ลบการแจ้งเตือน"
                  className="inline-flex size-7 cursor-pointer items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-rose-500/10 hover:text-rose-600 dark:hover:text-rose-400"
                >
                  <X className="size-3.5" />
                </button>
              }
            />
            <TooltipContent>ลบการแจ้งเตือน</TooltipContent>
          </Tooltip>
        </div>
      </TooltipProvider>
    </motion.div>
  );
}

// ── Skeleton ───────────────────────────────────────────────────────────────────────

function FeedSkeleton() {
  return (
    <div>
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="flex items-start gap-3 border-b px-4 py-3.5 last:border-b-0 sm:px-5">
          <span className="w-2 shrink-0" />
          <div className="size-10 shrink-0 animate-pulse rounded-xl bg-muted" />
          <div className="min-w-0 flex-1 space-y-2">
            <div className="flex items-center justify-between gap-3">
              <div className="h-3.5 w-44 animate-pulse rounded bg-muted" />
              <div className="h-3 w-12 animate-pulse rounded bg-muted" />
            </div>
            <div className="h-3 w-full max-w-md animate-pulse rounded bg-muted" />
            <div className="h-4 w-20 animate-pulse rounded-full bg-muted" />
          </div>
        </div>
      ))}
    </div>
  );
}
