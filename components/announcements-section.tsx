'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { Pin, ChevronRight, ArrowRight, BellOff, TriangleAlert, X, CalendarClock, User } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { AppIcon } from '@/components/app-icon';
import { cn } from '@/lib/utils';
import { useSocketEvent } from '@/components/socket';
import { fetchAnnouncements } from '@/lib/api/announcements';
import { TYPE_META, LEVEL_META } from '@/lib/announcements/meta';
import type { Announcement } from '@/lib/announcements/types';

const DTF = new Intl.DateTimeFormat('th-TH', { day: 'numeric', month: 'short', year: 'numeric' });
const fmtDate = (a: Announcement) => DTF.format(new Date(a.startsAt ?? a.createdAt));

const DTF_FULL = new Intl.DateTimeFormat('th-TH', {
  day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit',
});
const fmtDateTime = (iso: string) => DTF_FULL.format(new Date(iso));

const authorName = (a: Announcement) =>
  a.createdBy ? `${a.createdBy.firstName} ${a.createdBy.lastName}`.trim() : null;

/** Sort by severity, then newest. */
function sortAnnouncements(list: Announcement[]): Announcement[] {
  return [...list].sort((a, b) => {
    const ao = LEVEL_META[a.level].order;
    const bo = LEVEL_META[b.level].order;
    if (ao !== bo) return ao - bo;
    const ad = new Date(a.startsAt ?? a.createdAt).getTime();
    const bd = new Date(b.startsAt ?? b.createdAt).getTime();
    return bd - ad;
  });
}

// ── Component ──────────────────────────────────────────────────────────────────────

export function AnnouncementsSection() {
  const [pinned, setPinned] = useState<Announcement | null>(null);
  const [rest, setRest] = useState<Announcement[]>([]);
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const [selected, setSelected] = useState<Announcement | null>(null);
  const aliveRef = useRef(true);

  useEffect(() => {
    aliveRef.current = true;
    return () => { aliveRef.current = false; };
  }, []);

  // GET /announcements — public: isActive + not yet ended. The backend sorts
  // isPriority first; we still pull the single pinned one out for the banner.
  // `silent` skips the loading/error UI flip for background refreshes.
  const load = useCallback((silent = false) => {
    if (!silent) setStatus('loading');
    return fetchAnnouncements()
      .then((data) => {
        if (!aliveRef.current) return;
        const sorted = sortAnnouncements(data);
        const pinnedItem = sorted.find((a) => a.isPriority) ?? null;
        setPinned(pinnedItem);
        setRest(sorted.filter((a) => a.id !== pinnedItem?.id));
        setStatus('ready');
      })
      .catch(() => {
        if (!aliveRef.current || silent) return;
        setStatus('error');
      });
  }, []);

  useEffect(() => { load(); }, [load]);

  // Real-time: refresh when an announcement changes (socket, for signed-in
  // visitors) or when the tab regains focus (covers anonymous visitors).
  const reload = useCallback(() => { load(true); }, [load]);
  useSocketEvent('announcement:created', reload);
  useSocketEvent('announcement:updated', reload);
  useSocketEvent('announcement:deleted', reload);

  useEffect(() => {
    const onFocus = () => load(true);
    const onVisible = () => { if (document.visibilityState === 'visible') load(true); };
    window.addEventListener('focus', onFocus);
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      window.removeEventListener('focus', onFocus);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, [load]);

  const isEmpty = status === 'ready' && !pinned && rest.length === 0;

  return (
    <section
      id="announcements-section"
      className="relative w-full overflow-hidden bg-transparent py-16 text-foreground lg:py-20 2xl:py-32"
    >
      {/* Decorative brand glow — lifts the cards off the fixed 3D scene. */}
      <div aria-hidden className="pointer-events-none absolute inset-0 z-0 overflow-hidden">
        <div className="absolute left-1/2 top-4 h-[420px] w-[900px] -translate-x-1/2 rounded-full bg-brand/10 blur-[130px]" />
      </div>

      <div className="container relative z-10 mx-auto px-4">

        {/* ── Heading ── */}
        <div className="mb-10 text-center lg:mb-12 2xl:mb-16">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: false, margin: '-80px' }}
            transition={{ duration: 0.5 }}
            className="mb-4 inline-flex items-center gap-1.5 rounded-full border border-brand/20 bg-brand/10 px-3 py-1 text-[11px] font-semibold tracking-wide text-brand"
          >
            <Pin className="h-3 w-3" />
            ข่าวสารล่าสุด
          </motion.div>

          <motion.h2
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: false, margin: '-80px' }}
            transition={{ duration: 0.6, delay: 0.05 }}
            className="type-section-heading mb-3 lg:mb-4 2xl:mb-6"
          >
            A-DXC <span className="text-brand">Announcements</span>
          </motion.h2>

          <motion.p
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: false, margin: '-80px' }}
            transition={{ duration: 0.6, delay: 0.15 }}
            className="mx-auto max-w-2xl text-base leading-relaxed text-muted-foreground 2xl:text-xl"
          >
            ข่าวสาร อัปเดต และประกาศสำคัญจากทีม A-DXC ที่คุณไม่ควรพลาด
          </motion.p>
        </div>

        {/* ── Loading ── */}
        {status === 'loading' && <AnnouncementsSkeleton />}

        {/* ── Error ── */}
        {status === 'error' && (
          <EmptyState
            icon={TriangleAlert}
            title="โหลดประกาศไม่สำเร็จ"
            description="เกิดข้อผิดพลาดในการเชื่อมต่อ กรุณาลองใหม่อีกครั้งภายหลัง"
            tone="error"
          />
        )}

        {/* ── Empty ── */}
        {isEmpty && (
          <EmptyState
            icon={BellOff}
            title="ยังไม่มีประกาศในขณะนี้"
            description="เมื่อมีข่าวสารหรือประกาศใหม่จากทีม A-DXC จะแสดงที่นี่"
          />
        )}

        {/* ── Content ── */}
        {status === 'ready' && (pinned || rest.length > 0) && (
          <>
            {/* Pinned / priority announcement (only one allowed) */}
            {pinned && (() => {
              const meta = TYPE_META[pinned.type];
              const level = LEVEL_META[pinned.level];
              return (
                <motion.div
                  initial={{ opacity: 0, y: -16 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: false, margin: '-80px' }}
                  transition={{ duration: 0.5 }}
                  className="mx-auto mb-8 max-w-5xl lg:mb-12"
                >
                  <div
                    role="button"
                    tabIndex={0}
                    onClick={() => setSelected(pinned)}
                    onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setSelected(pinned); } }}
                    className={cn(
                      'group relative cursor-pointer overflow-hidden rounded-3xl border shadow-lg shadow-black/5 backdrop-blur-xl transition-shadow duration-500 hover:shadow-xl focus:outline-none focus-visible:ring-2 focus-visible:ring-brand/50 dark:shadow-black/30',
                      meta.soft,
                    )}
                  >
                    {/* Top accent rule */}
                    <div className={cn('absolute inset-x-0 top-0 h-1 bg-linear-to-r', meta.gradient)} />
                    {/* Soft corner glow */}
                    <div className={cn('absolute -right-20 -top-20 h-64 w-64 rounded-full blur-3xl transition-colors duration-500', meta.glow)} />

                    <div className="relative z-10 flex flex-col items-start gap-4 p-5 lg:flex-row lg:gap-5 lg:p-6 2xl:p-8">
                      {/* Icon */}
                      <div
                        className={cn(
                          'flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-linear-to-br text-white shadow-lg ring-1 ring-white/20 transition-transform duration-300 group-hover:scale-105 lg:h-14 lg:w-14',
                          meta.gradient,
                        )}
                      >
                        <AppIcon name={pinned.icon} className="h-6 w-6 lg:h-7 lg:w-7" />
                      </div>

                      {/* Body */}
                      <div className="min-w-0 flex-1">
                        <div className="mb-2 flex flex-wrap items-center gap-2">
                          <span className="inline-flex items-center gap-1 rounded-full bg-foreground px-2 py-0.5 text-[10px] font-bold tracking-[0.15em] text-background">
                            <Pin className="h-2.5 w-2.5" />
                            ปักหมุด
                          </span>
                          <span className={cn('rounded-full px-2 py-0.5 text-[10px] font-bold tracking-wider', level.solidBadge)}>
                            {level.label.toUpperCase()}
                          </span>
                          <span className={cn('text-[10px] font-bold uppercase tracking-wider', meta.text)}>
                            {meta.label}
                          </span>
                          <span className="text-muted-foreground/60">•</span>
                          <span className="text-[10px] text-muted-foreground">{fmtDate(pinned)}</span>
                        </div>

                        <h3 className="mb-2 text-base font-extrabold leading-snug text-foreground lg:text-lg 2xl:text-2xl">
                          {pinned.header}
                        </h3>
                        <p className="text-xs leading-relaxed text-muted-foreground lg:text-sm">
                          {pinned.detail}
                        </p>
                      </div>

                      {/* CTA (the whole banner is clickable) */}
                      <span
                        className={cn(
                          'inline-flex shrink-0 items-center justify-center gap-1 self-stretch whitespace-nowrap rounded-full bg-linear-to-r px-4 py-2 text-xs font-semibold text-white shadow-md transition-all group-hover:shadow-lg sm:self-center',
                          meta.gradient,
                        )}
                      >
                        ดูรายละเอียด
                        <ChevronRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5" />
                      </span>
                    </div>
                  </div>
                </motion.div>
              );
            })()}

            {/* Standard announcements — draggable carousel */}
            {rest.length > 0 && (
              <AnnouncementCarousel items={rest} onSelect={setSelected} />
            )}
          </>
        )}
      </div>

      <AnnouncementDetailModal
        announcement={selected}
        onClose={() => setSelected(null)}
      />
    </section>
  );
}

// ── Carousel ───────────────────────────────────────────────────────────────────────

function AnnouncementCarousel({
  items,
  onSelect,
}: {
  items: Announcement[];
  onSelect: (a: Announcement) => void;
}) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);
  // Mouse drag-to-scroll state. `moved` suppresses the click that would
  // otherwise open a card right after a drag.
  const drag = useRef({ down: false, startX: 0, startScroll: 0, moved: false });

  const updateActive = useCallback(() => {
    const el = trackRef.current;
    if (!el) return;
    const elLeft = el.getBoundingClientRect().left;
    let nearest = 0;
    let min = Infinity;
    Array.from(el.children).forEach((c, i) => {
      const d = Math.abs((c as HTMLElement).getBoundingClientRect().left - elLeft);
      if (d < min) { min = d; nearest = i; }
    });
    setActive(nearest);
  }, []);

  const scrollToIndex = useCallback((i: number) => {
    const el = trackRef.current;
    if (!el) return;
    const child = el.children[i] as HTMLElement | undefined;
    if (!child) return;
    const left = el.scrollLeft + (child.getBoundingClientRect().left - el.getBoundingClientRect().left);
    el.scrollTo({ left, behavior: 'smooth' });
  }, []);

  function onPointerDown(e: React.PointerEvent) {
    if (e.pointerType !== 'mouse') return;
    const el = trackRef.current;
    if (!el) return;
    drag.current = { down: true, startX: e.clientX, startScroll: el.scrollLeft, moved: false };
  }
  function onPointerMove(e: React.PointerEvent) {
    if (!drag.current.down) return;
    const el = trackRef.current;
    if (!el) return;
    const dx = e.clientX - drag.current.startX;
    if (Math.abs(dx) > 4) drag.current.moved = true;
    el.scrollLeft = drag.current.startScroll - dx;
  }
  function endDrag() { drag.current.down = false; }
  function onClickCapture(e: React.MouseEvent) {
    if (drag.current.moved) {
      e.preventDefault();
      e.stopPropagation();
      drag.current.moved = false;
    }
  }

  const showControls = items.length > 1;

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: false, margin: '-50px' }}
      transition={{ duration: 0.5 }}
      className="mx-auto max-w-5xl"
    >
      <div
        ref={trackRef}
        onScroll={updateActive}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endDrag}
        onPointerLeave={endDrag}
        onClickCapture={onClickCapture}
        className={cn(
          'flex snap-x snap-mandatory gap-5 overflow-x-auto overscroll-x-contain pb-1',
          '[scrollbar-width:none] [&::-webkit-scrollbar]:hidden',
          showControls && 'cursor-grab select-none active:cursor-grabbing',
        )}
      >
        {items.map((a) => (
          <div key={a.id} className="shrink-0 basis-full snap-start md:basis-[calc(50%-0.625rem)]">
            <AnnouncementCard a={a} onSelect={onSelect} />
          </div>
        ))}
      </div>

      {/* Dots */}
      {showControls && (
        <div className="mt-5 flex items-center justify-center gap-2">
          {items.map((a, i) => (
            <button
              key={a.id}
              type="button"
              aria-label={`ไปยังประกาศที่ ${i + 1}`}
              aria-current={active === i}
              onClick={() => scrollToIndex(i)}
              className={cn(
                'h-2 rounded-full transition-all duration-300',
                active === i
                  ? 'w-6 bg-brand'
                  : 'w-2 bg-muted-foreground/30 hover:bg-muted-foreground/50',
              )}
            />
          ))}
        </div>
      )}
    </motion.div>
  );
}

function AnnouncementCard({
  a,
  onSelect,
}: {
  a: Announcement;
  onSelect: (a: Announcement) => void;
}) {
  const meta = TYPE_META[a.type];
  const level = LEVEL_META[a.level];
  return (
    <Card
      role="button"
      tabIndex={0}
      onClick={() => onSelect(a)}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onSelect(a); } }}
      className="group relative h-full cursor-pointer overflow-hidden border-border bg-card/60 backdrop-blur-xl shadow-2xl shadow-black/30 transition-all duration-300 hover:-translate-y-1 hover:bg-card hover:shadow-xl hover:shadow-brand/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand/50"
    >
      {/* Top accent rule — reveals on hover */}
      <div className={cn('absolute inset-x-0 top-0 h-0.5 origin-left scale-x-0 bg-linear-to-r opacity-80 transition-transform duration-500 group-hover:scale-x-100', meta.gradient)} />
      {/* Hover glow */}
      <div className={cn('pointer-events-none absolute -right-16 -top-16 h-40 w-40 rounded-full opacity-0 blur-3xl transition-opacity duration-500 group-hover:opacity-100', meta.glow)} />

      <CardContent className="relative z-10 flex gap-4 p-5 lg:p-6 2xl:p-7">
        {/* Icon */}
        <div
          className={cn(
            'flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-linear-to-br text-white shadow-lg shadow-black/10 ring-1 ring-white/15 transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3 2xl:h-14 2xl:w-14',
            meta.gradient,
          )}
        >
          <AppIcon name={a.icon} className="h-5 w-5 2xl:h-6 2xl:w-6" />
        </div>

        {/* Body */}
        <div className="min-w-0 flex-1">
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <span className={cn('text-[10px] font-bold uppercase tracking-wider', meta.text)}>
              {meta.label}
            </span>
            <span className="text-muted-foreground/50">•</span>
            <span className="text-[10px] text-muted-foreground">{fmtDate(a)}</span>
            <span className={cn('ml-auto rounded-full px-2 py-0.5 text-[9px] font-bold tracking-wider', level.solidBadge)}>
              {level.label.toUpperCase()}
            </span>
          </div>

          <h3 className="mb-2 line-clamp-2 text-base font-semibold text-foreground lg:text-base 2xl:text-lg">
            {a.header}
          </h3>

          <p className="line-clamp-2 text-xs leading-relaxed text-muted-foreground lg:text-sm">
            {a.detail}
          </p>

          {/* Read more — slides in on hover */}
          <div className={cn('mt-3 flex -translate-x-1 items-center gap-1 text-[11px] font-semibold opacity-0 transition-all duration-300 group-hover:translate-x-0 group-hover:opacity-100', meta.text)}>
            อ่านเพิ่มเติม
            <ArrowRight className="h-3 w-3" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ── Detail modal ─────────────────────────────────────────────────────────────────────

function AnnouncementDetailModal({
  announcement,
  onClose,
}: {
  announcement: Announcement | null;
  onClose: () => void;
}) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);

  const panelRef = useRef<HTMLDivElement>(null);
  const lastFocused = useRef<HTMLElement | null>(null);

  const open = Boolean(announcement);

  // Escape to close, Tab to cycle focus within the panel, lock body scroll,
  // move focus into the dialog on open and restore it to the trigger on close.
  useEffect(() => {
    if (!open) return;
    lastFocused.current = document.activeElement as HTMLElement | null;

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { onClose(); return; }
      if (e.key === 'Tab') {
        const panel = panelRef.current;
        if (!panel) return;
        const focusables = panel.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled]), input, [tabindex]:not([tabindex="-1"])',
        );
        if (focusables.length === 0) { e.preventDefault(); panel.focus(); return; }
        const first = focusables[0];
        const last = focusables[focusables.length - 1];
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    };
    document.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const t = setTimeout(() => panelRef.current?.focus(), 50);

    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
      clearTimeout(t);
      lastFocused.current?.focus?.();
    };
  }, [open, onClose]);

  if (!mounted) return null;

  return createPortal(
    <AnimatePresence>
      {announcement && (() => {
        const meta = TYPE_META[announcement.type];
        const level = LEVEL_META[announcement.level];
        const author = authorName(announcement);
        return (
          <div className="fixed inset-0 z-100 flex items-end justify-center p-0 sm:items-center sm:p-4">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={onClose}
              className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            />

            {/* Panel */}
            <motion.div
              ref={panelRef}
              tabIndex={-1}
              role="dialog"
              aria-modal="true"
              aria-label={announcement.header}
              initial={{ opacity: 0, scale: 0.96, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 20 }}
              transition={{ type: 'spring', stiffness: 300, damping: 28 }}
              className={cn(
                'relative z-10 max-h-[88vh] w-full max-w-2xl overflow-hidden rounded-t-3xl border bg-popover text-popover-foreground shadow-2xl outline-none sm:rounded-3xl',
                meta.soft,
              )}
            >
              {/* Top accent rule */}
              <div className={cn('absolute inset-x-0 top-0 h-1 bg-linear-to-r', meta.gradient)} />
              {/* Soft corner glow */}
              <div className={cn('pointer-events-none absolute -right-24 -top-24 h-64 w-64 rounded-full blur-3xl', meta.glow)} />

              {/* Close */}
              <button
                type="button"
                onClick={onClose}
                aria-label="ปิด"
                className="absolute right-4 top-4 z-20 flex h-9 w-9 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
              >
                <X className="h-5 w-5" />
              </button>

              <div className="relative z-10 max-h-[88vh] overflow-y-auto p-6 sm:p-8">
                {/* Icon + badges */}
                <div className="mb-5 flex items-start gap-4">
                  <div
                    className={cn(
                      'flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-linear-to-br text-white shadow-lg ring-1 ring-white/20',
                      meta.gradient,
                    )}
                  >
                    <AppIcon name={announcement.icon} className="h-7 w-7" />
                  </div>
                  <div className="min-w-0 flex-1 pr-8">
                    <div className="mb-2 flex flex-wrap items-center gap-2">
                      {announcement.isPriority && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-foreground px-2 py-0.5 text-[10px] font-bold tracking-[0.15em] text-background">
                          <Pin className="h-2.5 w-2.5" />
                          ปักหมุด
                        </span>
                      )}
                      <span className={cn('rounded-full px-2 py-0.5 text-[10px] font-bold tracking-wider', level.solidBadge)}>
                        {level.label.toUpperCase()}
                      </span>
                      <span className={cn('text-[10px] font-bold uppercase tracking-wider', meta.text)}>
                        {meta.label}
                      </span>
                    </div>
                    <h3 className="text-xl font-extrabold leading-snug text-foreground sm:text-2xl">
                      {announcement.header}
                    </h3>
                  </div>
                </div>

                {/* Detail */}
                <p className="whitespace-pre-line text-sm leading-relaxed text-muted-foreground sm:text-base">
                  {announcement.detail}
                </p>

                {/* Meta footer */}
                <div className="mt-6 flex flex-wrap items-center gap-x-5 gap-y-2 border-t border-border pt-4 text-xs text-muted-foreground">
                  <span className="inline-flex items-center gap-1.5">
                    <CalendarClock className="h-3.5 w-3.5" />
                    {fmtDateTime(announcement.startsAt ?? announcement.createdAt)}
                  </span>
                  {announcement.endsAt && (
                    <span className="inline-flex items-center gap-1.5">
                      <span className="text-muted-foreground/60">สิ้นสุด</span>
                      {fmtDateTime(announcement.endsAt)}
                    </span>
                  )}
                  {author && (
                    <span className="inline-flex items-center gap-1.5">
                      <User className="h-3.5 w-3.5" />
                      {author}
                    </span>
                  )}
                </div>
              </div>
            </motion.div>
          </div>
        );
      })()}
    </AnimatePresence>,
    document.body,
  );
}

// ── Empty / error state ─────────────────────────────────────────────────────────────

function EmptyState({
  icon: Icon,
  title,
  description,
  tone = 'muted',
}: {
  icon: typeof BellOff;
  title: string;
  description: string;
  tone?: 'muted' | 'error';
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: false, margin: '-50px' }}
      transition={{ duration: 0.45 }}
      className="mx-auto flex max-w-md flex-col items-center justify-center gap-4 rounded-3xl border border-dashed border-border bg-card/50 px-6 py-14 text-center backdrop-blur-xl"
    >
      <div
        className={cn(
          'flex h-14 w-14 items-center justify-center rounded-2xl ring-1',
          tone === 'error'
            ? 'bg-rose-500/10 text-rose-500 ring-rose-500/20'
            : 'bg-brand/10 text-brand ring-brand/20',
        )}
      >
        <Icon className="h-7 w-7" />
      </div>
      <div>
        <h3 className="mb-1 text-base font-semibold text-foreground">{title}</h3>
        <p className="text-sm leading-relaxed text-muted-foreground">{description}</p>
      </div>
    </motion.div>
  );
}

// ── Loading skeleton ─────────────────────────────────────────────────────────────────

function AnnouncementsSkeleton() {
  return (
    <div className="mx-auto max-w-5xl">
      {/* Pinned skeleton */}
      <div className="mb-8 overflow-hidden rounded-3xl border border-border bg-card/50 p-5 backdrop-blur-xl lg:mb-12 lg:p-6 2xl:p-8">
        <div className="flex flex-col gap-4 lg:flex-row lg:gap-5">
          <div className="h-12 w-12 shrink-0 animate-pulse rounded-2xl bg-muted lg:h-14 lg:w-14" />
          <div className="flex-1 space-y-3">
            <div className="h-3 w-40 animate-pulse rounded bg-muted" />
            <div className="h-5 w-3/4 animate-pulse rounded bg-muted" />
            <div className="h-3 w-full animate-pulse rounded bg-muted" />
          </div>
        </div>
      </div>

      {/* Grid skeleton */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:gap-5 2xl:gap-8">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="flex gap-4 rounded-xl border border-border bg-card/50 p-5 backdrop-blur-xl lg:p-6"
          >
            <div className="h-12 w-12 shrink-0 animate-pulse rounded-2xl bg-muted" />
            <div className="flex-1 space-y-2.5">
              <div className="h-3 w-28 animate-pulse rounded bg-muted" />
              <div className="h-4 w-2/3 animate-pulse rounded bg-muted" />
              <div className="h-3 w-full animate-pulse rounded bg-muted" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
