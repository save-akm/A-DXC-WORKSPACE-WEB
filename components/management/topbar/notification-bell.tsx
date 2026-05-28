'use client';

import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useRouter } from 'next/navigation';
import { AnimatePresence, motion } from 'framer-motion';
import {
  AlertTriangle,
  Bell,
  BellOff,
  CheckCheck,
  Clock,
  Cog,
  type LucideIcon,
  MessageCircle,
  Megaphone,
  ShieldAlert,
  Workflow,
  X,
} from 'lucide-react';
import {
  selectUnreadCount,
  useNotificationStore,
  type NotificationItem,
  type NotificationType,
} from '@/lib/stores/notification-store';
import { cn } from '@/lib/utils';

/* ─── Type styling ─────────────────────────────────────────────────── */

interface TypeStyle {
  label: string;
  icon: LucideIcon;
  /** badge background (with /10 alpha) */
  bg: string;
  /** badge icon + accent text color */
  fg: string;
  /** dot color for unread indicator on item */
  dot: string;
  /** colored border shown around unread item cards */
  border: string;
  /** soft glow shadow for unread cards */
  shadow: string;
}

const typeStyles: Record<NotificationType, TypeStyle> = {
  WORKFLOW: {
    label: 'Workflow',
    icon: Workflow,
    bg: 'bg-violet-500/10',
    fg: 'text-violet-500',
    dot: 'bg-violet-500',
    border: 'border-violet-300/70 dark:border-violet-500/40',
    shadow: 'shadow-violet-500/10',
  },
  SYSTEM: {
    label: 'System',
    icon: Cog,
    bg: 'bg-slate-500/10',
    fg: 'text-slate-500',
    dot: 'bg-slate-500',
    border: 'border-slate-300/70 dark:border-slate-500/40',
    shadow: 'shadow-slate-500/10',
  },
  SECURITY: {
    label: 'Security',
    icon: ShieldAlert,
    bg: 'bg-rose-500/10',
    fg: 'text-rose-500',
    dot: 'bg-rose-500',
    border: 'border-rose-300/70 dark:border-rose-500/40',
    shadow: 'shadow-rose-500/10',
  },
  ANNOUNCEMENT: {
    label: 'Announcement',
    icon: Megaphone,
    bg: 'bg-amber-500/10',
    fg: 'text-amber-600',
    dot: 'bg-amber-500',
    border: 'border-amber-300/70 dark:border-amber-500/40',
    shadow: 'shadow-amber-500/10',
  },
  REMINDER: {
    label: 'Reminder',
    icon: Clock,
    bg: 'bg-sky-500/10',
    fg: 'text-sky-500',
    dot: 'bg-sky-500',
    border: 'border-sky-300/70 dark:border-sky-500/40',
    shadow: 'shadow-sky-500/10',
  },
  ALERT: {
    label: 'Alert',
    icon: AlertTriangle,
    bg: 'bg-orange-500/10',
    fg: 'text-orange-500',
    dot: 'bg-orange-500',
    border: 'border-orange-300/70 dark:border-orange-500/40',
    shadow: 'shadow-orange-500/10',
  },
  CHAT_MESSAGE: {
    label: 'Chat',
    icon: MessageCircle,
    bg: 'bg-emerald-500/10',
    fg: 'text-emerald-500',
    dot: 'bg-emerald-500',
    border: 'border-emerald-300/70 dark:border-emerald-500/40',
    shadow: 'shadow-emerald-500/10',
  },
};

/* ─── Time helper ─────────────────────────────────────────────────── */

function timeAgo(createdAt: number): string {
  const diff = Date.now() - createdAt;
  const sec = Math.floor(diff / 1000);
  if (sec < 60) return 'เมื่อสักครู่';
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min} นาทีที่แล้ว`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr} ชม. ที่แล้ว`;
  const day = Math.floor(hr / 24);
  if (day < 7) return `${day} วันที่แล้ว`;
  return new Date(createdAt).toLocaleDateString('th-TH', {
    day: 'numeric',
    month: 'short',
  });
}

/* ─── Component ───────────────────────────────────────────────────── */

export function NotificationBell() {
  const items = useNotificationStore((s) => s.items);
  const unread = useNotificationStore(selectUnreadCount);
  const markRead = useNotificationStore((s) => s.markRead);
  const markAllRead = useNotificationStore((s) => s.markAllRead);
  const remove = useNotificationStore((s) => s.remove);

  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [anchor, setAnchor] = useState<{ top: number; right: number }>({
    top: 64,
    right: 10,
  });
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const panelRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => setMounted(true), []);

  // Anchor the dropdown to the bell's bottom-right edge.
  // Recomputes when opening, on resize, and on scroll so it stays put.
  useLayoutEffect(() => {
    if (!open) return;
    const compute = () => {
      const rect = triggerRef.current?.getBoundingClientRect();
      if (!rect) return;
      setAnchor({
        top: Math.round(rect.bottom + 8),
        right: Math.max(8, Math.round(window.innerWidth - rect.right) - 80),
      });
    };
    compute();
    window.addEventListener('resize', compute);
    window.addEventListener('scroll', compute, true);
    return () => {
      window.removeEventListener('resize', compute);
      window.removeEventListener('scroll', compute, true);
    };
  }, [open]);

  const hasUnread = unread > 0;
  const label = unread > 99 ? '99+' : String(unread);

  // close on outside click / Escape — trigger and portal panel are separate trees
  useEffect(() => {
    if (!open) return;
    const onMouseDown = (e: MouseEvent) => {
      const target = e.target as Node;
      if (triggerRef.current?.contains(target)) return;
      if (panelRef.current?.contains(target)) return;
      setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    window.addEventListener('mousedown', onMouseDown);
    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('mousedown', onMouseDown);
      window.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const sortedItems = useMemo(
    () => [...items].sort((a, b) => b.createdAt - a.createdAt),
    [items],
  );

  const handleItemClick = (n: NotificationItem) => {
    if (!n.read) markRead(n.id);
    if (n.href) {
      setOpen(false);
      router.push(n.href);
    }
  };

  const handleRemove = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    remove(id);
  };

  const panel = (
    <AnimatePresence>
      {open ? (
        <>
          {/* dim backdrop on mobile so page content behind isn't visible */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            onClick={() => setOpen(false)}
            className="fixed inset-0 z-[59] bg-black/30 backdrop-blur-[2px] sm:hidden"
          />
          <motion.div
            ref={panelRef}
            role="menu"
            initial={{ opacity: 0, y: -8, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.96 }}
            transition={{ type: 'spring', stiffness: 380, damping: 28 }}
            style={{ top: anchor.top, right: anchor.right }}
            className="fixed z-[60] w-[calc(100vw-1.5rem)] origin-top-right overflow-hidden rounded-xl border border-border bg-popover text-popover-foreground shadow-2xl sm:w-96"
          >
            {/* Header */}
            <div className="relative overflow-hidden border-b border-border/60 bg-gradient-to-r from-violet-500/10 via-fuchsia-500/10 to-amber-500/10 p-3">
              <span
                aria-hidden
                className="pointer-events-none absolute -right-6 -top-8 size-24 rounded-full bg-fuchsia-500/15 blur-2xl"
              />
              <div className="relative flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="inline-flex size-7 items-center justify-center rounded-lg bg-violet-500/15 text-violet-500">
                    <Bell className="size-3.5" />
                  </span>
                  <div>
                    <div className="text-sm font-semibold text-foreground">
                      การแจ้งเตือน
                    </div>
                    <div className="text-[11px] text-muted-foreground">
                      {hasUnread ? `${unread} รายการที่ยังไม่ได้อ่าน` : 'ไม่มีรายการใหม่'}
                    </div>
                  </div>
                </div>
                {hasUnread ? (
                  <button
                    type="button"
                    onClick={markAllRead}
                    className="inline-flex cursor-pointer items-center gap-1 rounded-md px-2 py-1 text-[12px] text-foreground/90 font-medium transition-colors hover:bg-foreground/[0.06] hover:text-foreground"
                  >
                    <CheckCheck className="size-3" />
                    อ่านทั้งหมด
                  </button>
                ) : null}
              </div>
            </div>

            {/* List */}
            <div className="max-h-[60vh] overflow-y-auto sm:max-h-[420px]">
              {sortedItems.length === 0 ? (
                <div className="flex flex-col items-center gap-2 px-4 py-10 text-center">
                  <span className="inline-flex size-10 items-center justify-center rounded-full bg-muted/60">
                    <BellOff className="size-4 text-muted-foreground" />
                  </span>
                  <p className="text-sm font-medium text-foreground">ไม่มีการแจ้งเตือน</p>
                  <p className="text-xs text-muted-foreground">
                    เคลียร์เรียบร้อยแล้ว ดีจัง!
                  </p>
                </div>
              ) : (
                <ul className="flex flex-col gap-2 p-2">
                  {sortedItems.map((n) => {
                    const style = typeStyles[n.type];
                    const Icon = style.icon;
                    return (
                      <li key={n.id}>
                        <button
                          type="button"
                          onClick={() => handleItemClick(n)}
                          className={cn(
                            'group/item relative flex w-full cursor-pointer items-start gap-3 rounded-xl px-3 py-3 text-left transition-all',
                            n.read
                              ? 'border border-border/60 bg-transparent hover:bg-foreground/[0.03]'
                              : cn(
                                  'border-2 bg-foreground/[0.02] shadow-sm hover:bg-foreground/[0.05]',
                                  style.border,
                                  style.shadow,
                                ),
                          )}
                        >
                          {/* type icon */}
                          <span
                            className={cn(
                              'inline-flex size-9 shrink-0 items-center justify-center rounded-xl shadow-sm',
                              style.bg,
                            )}
                          >
                            <Icon className={cn('size-4', style.fg)} />
                          </span>

                          <div className="min-w-0 flex-1">
                            <div className="flex items-start justify-between gap-2">
                              <p
                                className={cn(
                                  'truncate text-sm leading-tight',
                                  n.read
                                    ? 'font-medium text-foreground/80'
                                    : 'font-semibold text-foreground',
                                )}
                              >
                                {n.title}
                              </p>
                              {!n.read ? (
                                <span
                                  aria-hidden
                                  className={cn(
                                    'mt-1 size-1.5 shrink-0 rounded-full',
                                    style.dot,
                                  )}
                                />
                              ) : null}
                            </div>
                            <p className="mt-0.5 line-clamp-2 text-xs leading-relaxed text-muted-foreground">
                              {n.message}
                            </p>
                            <div className="mt-1.5 flex items-center gap-2 text-[10px]">
                              <span
                                className={cn(
                                  'inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 font-medium',
                                  style.bg,
                                  style.fg,
                                )}
                              >
                                {style.label}
                              </span>
                              <span className="text-muted-foreground/70">·</span>
                              <span className="text-muted-foreground/70">
                                {timeAgo(n.createdAt)}
                              </span>
                            </div>
                          </div>

                          {/* dismiss */}
                          <span
                            role="button"
                            tabIndex={-1}
                            onClick={(e) => handleRemove(e, n.id)}
                            aria-label="Dismiss"
                            className="inline-flex size-6 shrink-0 items-center justify-center rounded-md text-muted-foreground/0 transition-all hover:bg-foreground/[0.08] hover:text-foreground group-hover/item:text-muted-foreground/70"
                          >
                            <X className="size-3.5" />
                          </span>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>

            {/* Footer */}
            <div className="border-t border-border/60 bg-muted/30">
              <button
                type="button"
                onClick={() => {
                  setOpen(false);
                  router.push('/notifications');
                }}
                className="block w-full cursor-pointer px-3 py-2.5 text-center text-sm font-medium text-foreground/90 transition-colors hover:bg-foreground/[0.04] hover:text-foreground"
              >
                ดูทั้งหมด ({items.length})
              </button>
            </div>
          </motion.div>
        </>
      ) : null}
    </AnimatePresence>
  );

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label={hasUnread ? `${unread} notifications` : 'Notifications'}
        aria-expanded={open}
        className={cn(
          'group/bell relative inline-flex size-8 cursor-pointer items-center justify-center rounded-full transition-colors',
          open
            ? 'bg-foreground/[0.06] text-foreground'
            : 'text-muted-foreground hover:bg-accent/50 hover:text-foreground',
        )}
      >
        <motion.span
          animate={hasUnread ? { rotate: [0, -10, 10, -6, 6, 0] } : { rotate: 0 }}
          transition={{ duration: 0.6, ease: 'easeInOut' }}
          className="inline-flex"
        >
          <Bell className="size-4" />
        </motion.span>

        {hasUnread ? (
          <motion.span
            key={unread}
            aria-hidden
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 500, damping: 22 }}
            className="absolute -right-0.5 -top-0.5 inline-flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-gradient-to-br from-rose-500 to-red-500 px-1 text-[10px] font-bold leading-none text-white shadow-sm ring-2 ring-background"
          >
            {label}
          </motion.span>
        ) : null}
      </button>

      {mounted ? createPortal(panel, document.body) : null}
    </>
  );
}
