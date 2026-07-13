'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CalendarDays,
  Users,
  ArrowUpRight,
  X,
  MapPin,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { AppIcon } from '@/components/app-icon';
import { BokehSparkles } from '@/components/bokeh-sparkles';
import {
  fetchActivities,
  fetchActivityPublic,
} from '@/lib/api/activity';
import {
  LANDING_GRADIENTS,
  LANDING_GRID_SPANS,
  type Activity,
  type ActivityDetail,
} from '@/lib/activity/types';
import { StatusBadge } from '@/app/(management)/admin/activity/_components/activity-meta';

import {
  formatActivityDateRange,
  formatActivityDateRangeDetail,
} from '@/lib/activity/format';

function MosaicSkeleton() {
  return (
    <div className="grid max-w-7xl auto-rows-[260px] grid-cols-1 gap-4 sm:grid-cols-2 lg:auto-rows-[280px] lg:grid-cols-3 lg:gap-5 2xl:auto-rows-[340px] 2xl:gap-6">
      {LANDING_GRID_SPANS.map((span, i) => (
        <div
          key={i}
          className={`animate-pulse rounded-3xl bg-muted/60 ${span}`}
        />
      ))}
    </div>
  );
}

function ActivityTile({
  activity,
  index,
  onClick,
}: {
  activity: Activity;
  index: number;
  onClick: () => void;
}) {
  const span = LANDING_GRID_SPANS[index] ?? '';
  const gradient = LANDING_GRADIENTS[index % LANDING_GRADIENTS.length];
  const category = activity.tags[0]?.name ?? 'Activity';
  const dateLabel = formatActivityDateRange(activity.eventStartAt, activity.eventEndAt);

  return (
    <motion.button
      type="button"
      initial={{ opacity: 0, scale: 0.92, y: 30 }}
      whileInView={{ opacity: 1, scale: 1, y: 0 }}
      viewport={{ once: false, margin: '-50px' }}
      transition={{ duration: 0.5, delay: index * 0.06 }}
      whileHover={{ y: -6 }}
      // When another album opens, the rest fade and drift apart.
      exit={{
        opacity: 0,
        scale: 0.88,
        y: 16,
        filter: 'blur(6px)',
        transition: { duration: 0.3, ease: [0.4, 0, 1, 1], delay: index * 0.04 },
      }}
      onClick={onClick}
      className={`group relative cursor-pointer text-left ${span}`}
    >
      <div className="relative h-full w-full overflow-hidden rounded-3xl border border-white/10 shadow-xl shadow-black/10 dark:shadow-black/40">
        {activity.coverImageUrl ? (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={activity.coverImageUrl}
              alt=""
              className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
            />
          </>
        ) : (
          /* No image — decorative gradient placeholder (tint + highlight + stripes) */
          <>
            <div className={`absolute inset-0 bg-linear-to-br ${gradient}`} />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.30),transparent_60%)]" />
            <div
              className="absolute inset-0 opacity-25 mix-blend-overlay"
              style={{
                backgroundImage:
                  'linear-gradient(135deg, rgba(255,255,255,0.25) 25%, transparent 25%, transparent 50%, rgba(255,255,255,0.25) 50%, rgba(255,255,255,0.25) 75%, transparent 75%)',
                backgroundSize: '28px 28px',
              }}
            />
          </>
        )}

        {/* Bottom scrim — keeps date / title / icon readable over image or gradient */}
        <div className="absolute inset-0 bg-linear-to-t from-black/75 via-black/15 to-transparent" />

        <AppIcon
          name={activity.icon}
          className="absolute top-6 right-6 h-10 w-10 text-white/40 transition-all duration-500 group-hover:rotate-12 group-hover:scale-110 group-hover:text-white/80 lg:h-12 lg:w-12"
        />

        <div className="absolute top-6 left-6 inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-white/15 px-3 py-1 text-[11px] font-semibold text-white backdrop-blur-md">
          <CalendarDays className="h-3 w-3" />
          {dateLabel}
        </div>

        <div className="absolute inset-x-0 bottom-0 p-5 text-white lg:p-6">
          <div className="mb-2 text-[10px] font-semibold uppercase tracking-widest text-white/80">
            {category}
          </div>
          <h3 className="mb-3 text-lg leading-tight font-extrabold drop-shadow-md lg:text-xl 2xl:text-3xl">
            {activity.name}
          </h3>
          <div className="flex items-center justify-between">
            <div className="inline-flex items-center gap-1.5 text-xs text-white/85">
              <Users className="h-3 w-3" />
              {activity.attendeeCount} ผู้เข้าร่วม
            </div>
            <div className="flex h-9 w-9 items-center justify-center rounded-full border border-white/30 bg-white/15 text-white backdrop-blur-md transition-colors duration-300 group-hover:bg-white group-hover:text-zinc-900">
              <ArrowUpRight className="h-4 w-4" />
            </div>
          </div>
        </div>
      </div>
    </motion.button>
  );
}

/** Clicked album bursts open into an inline peeking carousel (no login required). */
function ActivityCarousel({
  activity,
  onClose,
}: {
  activity: Activity;
  onClose: () => void;
}) {
  const [detail, setDetail] = useState<ActivityDetail | null>(null);

  // Measure the viewport so the next slide can peek a fixed amount on the right.
  const elRef = useRef<HTMLDivElement | null>(null);
  const [vw, setVw] = useState(0);
  const setViewport = useCallback((el: HTMLDivElement | null) => {
    elRef.current = el;
    if (el) setVw(el.clientWidth);
  }, []);
  useEffect(() => {
    const onResize = () => { if (elRef.current) setVw(elRef.current.clientWidth); };
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  useEffect(() => {
    let alive = true;
    // Public fetch — no auth, so the landing never gates on login.
    fetchActivityPublic(activity.id)
      .then((d) => { if (alive) setDetail(d); })
      .catch(() => {});
    return () => { alive = false; };
  }, [activity.id]);

  const galleryImages = (detail?.images ?? [])
    .slice()
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .map((i) => ({ url: i.imageUrl, caption: i.caption }));
  const slides =
    galleryImages.length > 0
      ? galleryImages
      : activity.coverImageUrl
        ? [{ url: activity.coverImageUrl, caption: null }]
        : [];

  const count = slides.length;
  const loop = count > 1;

  // For an infinite peek, wrap the strip with clones: one of the LAST image at the
  // head (so backward wrap slides in) and the first two at the tail (so the last
  // slide's right peek shows image #1, and the snap target has its own peek).
  const LEAD = loop ? 1 : 0;
  const display = loop
    ? [slides[count - 1], ...slides, slides[0], slides[1 % count]]
    : slides;

  // `pos` is the logical position; it may briefly run past the ends onto a clone,
  // then snaps back by `count` once the slide animation settles (seamless loop).
  const [pos, setPos] = useState(0);
  const [animate, setAnimate] = useState(false);
  const cur = count ? ((pos % count) + count) % count : 0;

  const go = useCallback(
    (d: number) => {
      setAnimate(true);
      setPos((p) => (loop ? p + d : Math.min(Math.max(0, p + d), count - 1)));
    },
    [loop, count],
  );
  const jumpTo = useCallback((logical: number) => {
    setAnimate(true);
    setPos(logical);
  }, []);
  const handleRest = useCallback(() => {
    if (!loop) return;
    if (pos >= count) { setAnimate(false); setPos(pos - count); }
    else if (pos < 0) { setAnimate(false); setPos(pos + count); }
  }, [loop, count, pos]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      else if (e.key === 'ArrowLeft') go(-1);
      else if (e.key === 'ArrowRight') go(1);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose, go]);

  const dateLabel = formatActivityDateRangeDetail(activity.eventStartAt, activity.eventEndAt);

  // Peeking filmstrip geometry — the next image's edge stays visible on the right.
  const GAP = 16;
  const peek = loop ? (vw >= 640 ? 84 : 40) : 0;
  const slideW = Math.max(0, vw - peek - (loop ? GAP : 0));
  const activeDisplay = pos + LEAD;
  const offset = -activeDisplay * (slideW + GAP);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.93 }}
      transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
      className="mx-auto w-full max-w-5xl"
    >
      <div
        ref={setViewport}
        className="relative aspect-4/3 w-full overflow-hidden rounded-3xl border border-white/10 bg-zinc-950 shadow-2xl sm:aspect-video"
      >
        {count > 0 ? (
          <motion.div
            className="flex h-full items-stretch"
            style={{ gap: GAP }}
            animate={{ x: offset }}
            transition={animate ? { type: 'spring', stiffness: 260, damping: 34 } : { duration: 0 }}
            onAnimationComplete={handleRest}
          >
            {display.map((s, j) => {
              const isActive = j === activeDisplay;
              return (
                <button
                  key={j}
                  type="button"
                  onClick={() => jumpTo(j - LEAD)}
                  style={{ width: slideW }}
                  tabIndex={isActive ? -1 : 0}
                  aria-label={isActive ? undefined : 'ดูรูปนี้'}
                  className={`group/slide relative h-full shrink-0 overflow-hidden rounded-2xl bg-zinc-900 ${
                    isActive ? 'cursor-default' : 'cursor-pointer'
                  }`}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={s.url}
                    alt={s.caption ?? ''}
                    draggable={false}
                    className="absolute inset-0 h-full w-full object-cover"
                  />
                  {/* Dim the stacked (non-active) slides so the active one stands out.
                      No transition: the active node changes during the seamless loop
                      snap, and a fading overlay would flash the centered image. */}
                  <div
                    className={`absolute inset-0 ${
                      isActive ? 'bg-transparent' : 'bg-black/50'
                    }`}
                  />
                </button>
              );
            })}
          </motion.div>
        ) : (
          <div className="absolute inset-0 flex items-center justify-center bg-linear-to-br from-indigo-700 via-violet-700 to-violet-600 text-sm text-white/80">
            ยังไม่มีรูปภาพ
          </div>
        )}

        {/* Overlay region — aligned to the active slide (left edge → slideW) */}
        <div
          className="pointer-events-none absolute inset-y-0 left-0 z-10 overflow-hidden rounded-2xl"
          style={{ width: count > 0 ? slideW : undefined, right: count > 0 ? undefined : 0 }}
        >
          <div className="absolute inset-x-0 top-0 h-28 bg-linear-to-b from-black/65 to-transparent" />
          <div className="absolute inset-x-0 bottom-0 h-48 bg-linear-to-t from-black/85 via-black/30 to-transparent" />

          <div className="absolute left-5 top-5">
            <StatusBadge status={activity.status} />
          </div>

          <div className="absolute inset-x-0 bottom-0 p-5 text-white sm:p-6">
            <h2 className="text-xl font-extrabold drop-shadow-md sm:text-2xl 2xl:text-3xl">
              {activity.name}
            </h2>
            <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-white/85 sm:text-sm">
              <span className="inline-flex items-center gap-1.5">
                <CalendarDays className="h-4 w-4" />
                {dateLabel}
              </span>
              {activity.location && (
                <span className="inline-flex items-center gap-1.5">
                  <MapPin className="h-4 w-4" />
                  {activity.location}
                </span>
              )}
              <span className="inline-flex items-center gap-1.5">
                <Users className="h-4 w-4" />
                {activity.attendeeCount}
                {activity.maxParticipants != null && ` / ${activity.maxParticipants}`} คน
              </span>
            </div>

            {count > 1 && (
              <div className="pointer-events-auto mt-4 flex items-center justify-between gap-3">
                <div className="flex items-center gap-1.5">
                  {slides.map((_, i) => (
                    <button
                      key={i}
                      type="button"
                      aria-label={`ไปรูปที่ ${i + 1}`}
                      onClick={() => jumpTo(i)}
                      className={`h-1.5 cursor-pointer rounded-full transition-all duration-300 ${
                        i === cur ? 'w-6 bg-white' : 'w-1.5 bg-white/40 hover:bg-white/70'
                      }`}
                    />
                  ))}
                </div>
                <span className="text-xs font-medium tabular-nums text-white/75">
                  {cur + 1} / {count}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Controls — also aligned to the active slide so the arrow sits on its edge */}
        <div
          className="pointer-events-none absolute inset-y-0 left-0 z-20"
          style={{ width: count > 0 ? slideW : undefined, right: count > 0 ? undefined : 0 }}
        >
          <button
            type="button"
            onClick={onClose}
            aria-label="ปิด"
            className="pointer-events-auto absolute right-4 top-4 flex h-9 w-9 cursor-pointer items-center justify-center rounded-full bg-black/45 text-white backdrop-blur-md transition-colors hover:bg-black/65 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60"
          >
            <X className="h-4 w-4" />
          </button>

          {count > 1 && (
            <>
              <button
                type="button"
                onClick={() => go(-1)}
                aria-label="รูปก่อนหน้า"
                className="pointer-events-auto absolute left-4 top-1/2 flex h-10 w-10 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full bg-black/45 text-white backdrop-blur-md transition-colors hover:bg-black/65 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              <button
                type="button"
                onClick={() => go(1)}
                aria-label="รูปถัดไป"
                className="pointer-events-auto absolute right-4 top-1/2 flex h-10 w-10 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full bg-black/45 text-white backdrop-blur-md transition-colors hover:bg-black/65 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            </>
          )}
        </div>
      </div>

      {detail?.description && (
        <p className="mx-auto mt-5 max-w-3xl text-center text-sm leading-relaxed text-muted-foreground 2xl:text-base">
          {detail.description}
        </p>
      )}
    </motion.div>
  );
}

export function ActivitySection() {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const aliveRef = useRef(true);

  useEffect(() => {
    aliveRef.current = true;
    return () => { aliveRef.current = false; };
  }, []);

  const load = useCallback((silent = false) => {
    if (!silent) setStatus('loading');
    return fetchActivities()
      .then((data) => {
        if (!aliveRef.current) return;
        setActivities(data.slice(0, 5));
        setStatus('ready');
      })
      .catch(() => {
        if (!aliveRef.current || silent) return;
        setStatus('error');
      });
  }, []);

  useEffect(() => { load(); }, [load]);

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

  const isEmpty = status === 'ready' && activities.length === 0;
  const selected = selectedId ? activities.find((a) => a.id === selectedId) ?? null : null;

  return (
    <section
      id="activity-section"
      className="relative w-full overflow-hidden bg-transparent py-16 text-zinc-900 lg:py-20 2xl:py-32 dark:text-white"
    >
      <BokehSparkles />

      <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
        <div className="absolute top-0 left-1/3 h-96 w-96 rounded-full bg-brand/12 blur-3xl" />
        <div className="absolute right-1/4 bottom-0 h-[28rem] w-[28rem] rounded-full bg-brand/10 blur-3xl" />
      </div>

      <div className="relative z-10 container mx-auto px-4">
        <div className="mb-10 text-center lg:mb-12 2xl:mb-16">
          <motion.h2
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: false, margin: '-80px' }}
            transition={{ duration: 0.6 }}
            className="type-section-heading mb-3 lg:mb-4 2xl:mb-6"
          >
            A-DXC{' '}
            <span className="text-brand">Activity</span>
          </motion.h2>

          <motion.p
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: false, margin: '-80px' }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="mx-auto max-w-2xl text-base leading-relaxed text-muted-foreground 2xl:text-xl"
          >
            ภาพบรรยากาศและความทรงจำของกิจกรรมต่าง ๆ ที่หล่อหลอมเราให้เป็นทีมเดียวกัน
          </motion.p>
        </div>

        {status === 'loading' && <MosaicSkeleton />}

        {status === 'error' && (
          <p className="py-10 text-center text-sm text-muted-foreground">
            โหลดกิจกรรมไม่สำเร็จ กรุณาลองใหม่อีกครั้งภายหลัง
          </p>
        )}

        {isEmpty && (
          <p className="py-10 text-center text-sm text-muted-foreground">
            ยังไม่มีกิจกรรมให้แสดงในขณะนี้
          </p>
        )}

        {status === 'ready' && activities.length > 0 && (
          <AnimatePresence mode="wait" initial={false}>
            {selected ? (
              <ActivityCarousel
                key={`carousel-${selected.id}`}
                activity={selected}
                onClose={() => setSelectedId(null)}
              />
            ) : (
              <motion.div
                key="grid"
                className="mx-auto grid max-w-7xl auto-rows-[260px] grid-cols-1 gap-4 sm:grid-cols-2 lg:auto-rows-[280px] lg:grid-cols-3 lg:gap-5 2xl:auto-rows-[340px] 2xl:gap-6"
              >
                {activities.map((act, idx) => (
                  <ActivityTile
                    key={act.id}
                    activity={act}
                    index={idx}
                    onClick={() => setSelectedId(act.id)}
                  />
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        )}
      </div>
    </section>
  );
}
