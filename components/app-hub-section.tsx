'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion, Reorder, useDragControls } from 'framer-motion';
import { ChevronLeft, ChevronRight, GripVertical, Heart, Sparkles } from 'lucide-react';
import { useAuthStore } from '@/lib/stores/auth-store';
import { toast } from '@/components/ui/toast';
import { AppIcon } from '@/components/app-icon';
import { AppHubTile } from '@/components/app-hub-tile';
import { cn } from '@/lib/utils';
import {
  fetchApps,
  fetchFavorites,
  addFavorite,
  removeFavorite,
  reorderFavorites,
  trackAppClick,
} from '@/lib/api/apphub';
import type { PublicCategory, FavoriteApp, PublicApp } from '@/lib/apphub/types';

/** Open an app's destination, respecting its new-tab preference. */
function openApp(app: { url: string; openInNewTab: boolean }) {
  if (app.openInNewTab) window.open(app.url, '_blank', 'noopener,noreferrer');
  else window.location.href = app.url;
}

export function AppHubSection() {
  const authed = useAuthStore(s => s.status === 'authenticated');

  const [categories, setCategories] = useState<PublicCategory[]>([]);
  const [favorites, setFavorites] = useState<FavoriteApp[]>([]);
  const [loading, setLoading] = useState(true);

  const favoriteIds = useMemo(() => new Set(favorites.map(f => f.id)), [favorites]);

  /** All apps from all categories, deduplicated and sorted by clickCount desc. */
  const allApps = useMemo<PublicApp[]>(() => {
    const seen = new Set<string>();
    const flat: PublicApp[] = [];
    categories.forEach(cat => {
      cat.apps.forEach(app => {
        if (!seen.has(app.id)) {
          seen.add(app.id);
          flat.push(app);
        }
      });
    });
    return flat.sort((a, b) => b.clickCount - a.clickCount);
  }, [categories]);

  // ── Load public data ──────────────────────────────────────────────────────────
  useEffect(() => {
    fetchApps('order')
      .then(cats => setCategories(cats))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  // ── Load favorites once authenticated ────────────────────────────────────────
  useEffect(() => {
    if (!authed) { setFavorites([]); return; }
    fetchFavorites().then(setFavorites).catch(() => {});
  }, [authed]);

  // ── Click tracking + open ─────────────────────────────────────────────────────
  const handleOpen = useCallback((app: PublicApp | FavoriteApp) => {
    setCategories(prev => prev.map(c => ({
      ...c,
      apps: c.apps.map(a => (a.id === app.id ? { ...a, clickCount: a.clickCount + 1 } : a)),
    })));
    trackAppClick(app.id).catch(() => {});
    openApp(app);
  }, []);

  // ── Favorite toggle ───────────────────────────────────────────────────────────
  const toggleFavorite = useCallback(async (app: { id: string; name: string }) => {
    if (!authed) return;
    if (favoriteIds.has(app.id)) {
      const prev = favorites;
      setFavorites(f => f.filter(x => x.id !== app.id));
      try {
        await removeFavorite(app.id);
      } catch {
        setFavorites(prev);
        toast.error('นำออกจากรายการโปรดไม่สำเร็จ');
      }
    } else {
      try {
        await addFavorite(app.id);
        const fresh = await fetchFavorites();
        setFavorites(fresh);
        toast.success(`เพิ่ม "${app.name}" ในรายการโปรด`);
      } catch (e) {
        const code = (e as { code?: string }).code;
        if (code !== 'ALREADY_FAVORITED') toast.error('เพิ่มรายการโปรดไม่สำเร็จ');
      }
    }
  }, [authed, favoriteIds, favorites]);

  // ── Favorite reordering (drag) ────────────────────────────────────────────────
  const handleReorder = useCallback((next: FavoriteApp[]) => setFavorites(next), []);
  const commitOrder = useCallback(() => {
    reorderFavorites(favorites.map(f => f.id)).catch(() => toast.error('บันทึกลำดับไม่สำเร็จ'));
  }, [favorites]);

  return (
    <section
      id="app-hub-section"
      className="relative w-full overflow-hidden bg-transparent py-16 text-foreground lg:py-20 2xl:py-32"
    >
      {/* ── Decorative backdrop: a soft brand glow + concentric "universe" orbits.
            Improves card legibility over the fixed 3D scene and reinforces the
            "App Hub Universe" theme. Purely decorative → aria-hidden, no events. ── */}
      <div aria-hidden className="pointer-events-none absolute inset-0 z-0 overflow-hidden">
        {/* Center vignette to lift content off the 3D background */}
        <div className="absolute left-1/2 top-0 h-[520px] w-[1100px] -translate-x-1/2 rounded-full bg-brand/12 blur-[140px]" />
        {/* Orbit rings behind the heading */}
        <div className="absolute left-1/2 top-[-120px] -translate-x-1/2">
          <div className="h-[360px] w-[360px] rounded-full border border-brand/10 sm:h-[520px] sm:w-[520px]" />
          <div className="absolute left-1/2 top-1/2 h-[240px] w-[240px] -translate-x-1/2 -translate-y-1/2 rounded-full border border-brand/15 sm:h-[340px] sm:w-[340px]" />
          <div className="absolute left-1/2 top-1/2 h-[120px] w-[120px] -translate-x-1/2 -translate-y-1/2 rounded-full border border-brand/20 sm:h-[180px] sm:w-[180px]" />
        </div>
      </div>

      <div className="container relative z-10 mx-auto px-4">
        {/* Heading */}
        <div id="app-hub-heading" className="mb-8 text-center lg:mb-10 2xl:mb-20">
          <motion.h2
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: false, margin: '-80px' }}
            transition={{ duration: 0.6 }}
            className="type-section-heading mb-3 lg:mb-4 2xl:mb-6"
          >
            The <span className="text-brand">App Hub</span> Universe
          </motion.h2>
          <motion.p
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: false, margin: '-80px' }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="mx-auto max-w-2xl text-base leading-relaxed text-muted-foreground 2xl:text-xl"
          >
            ศูนย์รวมแอปพลิเคชันและบริการทั้งหมดของคุณ พร้อมทะยานสู่การทำงานยุคใหม่ที่ไร้ขีดจำกัด สัมผัสประสบการณ์ที่ลื่นไหล
          </motion.p>
        </div>

        {/* Loading skeleton */}
        {loading && (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 2xl:gap-8">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="h-40 animate-pulse rounded-xl bg-card/50" />
            ))}
          </div>
        )}

        {!loading && (
          <div className="space-y-12 2xl:space-y-16">
            {/* ── Favorites (authenticated) ── */}
            {authed && favorites.length > 0 && (
              <div>
                <SectionLabel icon={Heart} title="รายการโปรด" hint="ลากเพื่อจัดลำดับ" />
                <Reorder.Group
                  axis="x"
                  values={favorites}
                  onReorder={handleReorder}
                  className="flex flex-wrap gap-3"
                >
                  {favorites.map(fav => (
                    <FavoriteChip
                      key={fav.id}
                      fav={fav}
                      onOpen={() => handleOpen(fav)}
                      onRemove={() => toggleFavorite(fav)}
                      onCommit={commitOrder}
                    />
                  ))}
                </Reorder.Group>
              </div>
            )}

            {/* ── All apps carousel (2 rows, drag + dots) ── */}
            {allApps.length > 0 && (
              <div>
                <SectionLabel icon={Sparkles} title="ยอดนิยม" hint="แอปที่ถูกใช้งานมากที่สุด" />
                <AppCarousel
                  apps={allApps}
                  authed={authed}
                  favoriteIds={favoriteIds}
                  onOpen={handleOpen}
                  onToggleFavorite={toggleFavorite}
                />
              </div>
            )}

            {/* Empty state */}
            {allApps.length === 0 && (
              <p className="py-10 text-center text-sm text-muted-foreground">ยังไม่มีแอปให้แสดงในขณะนี้</p>
            )}
          </div>
        )}
      </div>
    </section>
  );
}

// ── AppCarousel ────────────────────────────────────────────────────────────────

const SLIDE_VARIANTS = {
  enter: (d: number) => ({ x: d > 0 ? 48 : -48, opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit: (d: number) => ({ x: d < 0 ? 48 : -48, opacity: 0 }),
};

function AppCarousel({
  apps,
  authed,
  favoriteIds,
  onOpen,
  onToggleFavorite,
}: {
  apps: PublicApp[];
  authed: boolean;
  favoriteIds: Set<string>;
  onOpen: (app: PublicApp) => void;
  onToggleFavorite: (app: { id: string; name: string }) => void;
}) {
  const [cols, setCols] = useState(4);
  const [page, setPage] = useState(0);
  const [direction, setDirection] = useState(0);

  // Track columns from viewport width
  useEffect(() => {
    function update() {
      const w = window.innerWidth;
      setCols(w < 640 ? 2 : w < 1024 ? 3 : 4);
    }
    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, []);

  const itemsPerPage = cols * 2; // 2 rows
  const totalPages = Math.ceil(apps.length / itemsPerPage);

  // Clamp page when cols/apps change
  useEffect(() => {
    setPage(p => Math.max(0, Math.min(p, totalPages - 1)));
  }, [totalPages]);

  const goTo = useCallback((next: number, dir: number) => {
    if (next < 0 || next >= totalPages) return;
    setDirection(dir);
    setPage(next);
  }, [totalPages]);

  const pageApps = apps.slice(page * itemsPerPage, (page + 1) * itemsPerPage);

  // Pointer-based drag/swipe detection (doesn't interfere with tile clicks)
  const dragStartX = useRef<number | null>(null);
  const didDrag = useRef(false);

  return (
    <div className="relative">
      {/* Carousel header controls (arrows, shown on desktop) */}
      {totalPages > 1 && (
        <div className="absolute -top-10 right-0 hidden items-center gap-1 lg:flex">
          <button
            type="button"
            onClick={() => goTo(page - 1, -1)}
            disabled={page === 0}
            aria-label="หน้าก่อนหน้า"
            className="flex h-7 w-7 items-center justify-center rounded-full transition-colors hover:bg-accent disabled:cursor-not-allowed disabled:opacity-30"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <span className="min-w-10 text-center text-xs text-muted-foreground tabular-nums">
            {page + 1} / {totalPages}
          </span>
          <button
            type="button"
            onClick={() => goTo(page + 1, 1)}
            disabled={page === totalPages - 1}
            aria-label="หน้าถัดไป"
            className="flex h-7 w-7 items-center justify-center rounded-full transition-colors hover:bg-accent disabled:cursor-not-allowed disabled:opacity-30"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Drag/swipe wrapper */}
      <div
        className="overflow-hidden"
        onPointerDown={e => {
          dragStartX.current = e.clientX;
          didDrag.current = false;
        }}
        onPointerMove={e => {
          if (dragStartX.current !== null && Math.abs(e.clientX - dragStartX.current) > 6) {
            didDrag.current = true;
          }
        }}
        onPointerUp={e => {
          const start = dragStartX.current;
          dragStartX.current = null;
          if (start === null || !didDrag.current) return;
          const delta = e.clientX - start;
          if (delta < -40) goTo(page + 1, 1);
          else if (delta > 40) goTo(page - 1, -1);
        }}
        onPointerLeave={() => { dragStartX.current = null; }}
        // Suppress tile clicks if a drag actually happened
        onClickCapture={e => {
          if (didDrag.current) {
            e.stopPropagation();
            didDrag.current = false;
          }
        }}
      >
        <AnimatePresence initial={false} custom={direction} mode="wait">
          <motion.div
            key={`page-${page}-${cols}`}
            custom={direction}
            variants={SLIDE_VARIANTS}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.22, ease: [0.4, 0, 0.2, 1] }}
            className="grid gap-4 2xl:gap-8"
            style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}
          >
            {pageApps.map(app => (
              <AppHubTile
                key={app.id}
                app={app}
                showFavorite={authed}
                isFavorite={favoriteIds.has(app.id)}
                onOpen={() => onOpen(app)}
                onToggleFavorite={() => onToggleFavorite(app)}
                inCarousel
              />
            ))}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Dot indicators */}
      {totalPages > 1 && (
        <div className="mt-8 flex items-center justify-center gap-2">
          {Array.from({ length: totalPages }).map((_, i) => (
            <button
              key={i}
              type="button"
              onClick={() => goTo(i, i > page ? 1 : -1)}
              aria-label={`ไปหน้าที่ ${i + 1}`}
              className={cn(
                'h-2 rounded-full transition-all duration-300',
                i === page
                  ? 'w-6 bg-brand'
                  : 'w-2 bg-muted-foreground/30 hover:bg-muted-foreground/50',
              )}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ── Helpers ────────────────────────────────────────────────────────────────────

function SectionLabel({
  icon: Icon, iconName, title, hint,
}: {
  icon?: React.ComponentType<{ className?: string }>;
  iconName?: string | null;
  title: string;
  hint?: string;
}) {
  return (
    <div className="mb-4 flex items-center gap-2">
      <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-brand/10 text-brand">
        {Icon ? <Icon className="h-4 w-4" /> : <AppIcon name={iconName} className="h-4 w-4" />}
      </span>
      <h3 className="text-lg font-bold tracking-tight 2xl:text-xl">{title}</h3>
      {hint && <span className="text-[11px] text-muted-foreground">· {hint}</span>}
    </div>
  );
}

/** A compact, draggable favorite pill. */
function FavoriteChip({
  fav, onOpen, onRemove, onCommit,
}: {
  fav: FavoriteApp;
  onOpen: () => void;
  onRemove: () => void;
  onCommit: () => void;
}) {
  const controls = useDragControls();
  return (
    <Reorder.Item
      value={fav}
      dragListener={false}
      dragControls={controls}
      onDragEnd={onCommit}
      className="flex items-center gap-2 rounded-full border border-border bg-card/60 py-1.5 pl-1.5 pr-3 shadow-sm backdrop-blur"
    >
      <button
        type="button"
        onPointerDown={e => controls.start(e)}
        className="cursor-grab touch-none text-muted-foreground active:cursor-grabbing"
        aria-label="ลากเพื่อจัดลำดับ"
      >
        <GripVertical className="h-4 w-4" />
      </button>
      <button type="button" onClick={onOpen} className="flex cursor-pointer items-center gap-2">
        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-brand text-brand-foreground">
          <AppIcon name={fav.icon} className="h-3.5 w-3.5" />
        </span>
        <span className="text-[13px] font-semibold text-foreground">{fav.name}</span>
      </button>
      <button
        type="button"
        onClick={onRemove}
        aria-label="นำออกจากรายการโปรด"
        className="ml-1 flex h-5 w-5 items-center justify-center rounded-full text-rose-500 transition-colors hover:bg-rose-500/10"
      >
        <Heart className="h-3.5 w-3.5 fill-current" />
      </button>
    </Reorder.Item>
  );
}
