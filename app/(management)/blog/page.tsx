'use client';

import { Suspense, useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { AnimatePresence, motion } from 'framer-motion';
import {
  BookOpen, PenLine, Plus, Search, Tags, FileText, Sparkles, Shield,
  Pencil, Trash2, Send, Loader2, Bookmark, List, LayoutGrid, TrendingUp,
  Clock, Eye, BadgeCheck, Archive, Undo2, ArchiveRestore,
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { toast } from '@/components/ui/toast';
import { useMenuPermission } from '@/lib/hooks/use-menu-permission';
import { useAuthStore } from '@/lib/stores/auth-store';
import { PageHeader } from '@/components/management/page-header';
import { StatCard } from '@/components/management/stat-card';
import { Pagination } from '@/components/management/pagination';
import type { ActionItem } from '@/components/management/action-menu';
import { ConfirmDialog } from '@/components/management/confirm-dialog';

import {
  fetchPosts, fetchTags, publishPost, deletePost, fetchBlogStats,
  archivePost, unpublishPost, unarchivePost,
} from '@/lib/api/blog';
import {
  type Post, type Tag, type PostStatus, type PaginatedPosts,
  POST_STATUSES, humanizeBlogError,
} from '@/lib/blog/types';
import {
  readFeedSnapshot,
  writeFeedSnapshot,
  readTagsSnapshot,
  writeTagsSnapshot,
  readStatsSnapshot,
  writeStatsSnapshot,
  type FeedParams,
} from '@/lib/blog/feed-cache';
import { PostCard } from './_components/post-card';
import { PostRow, RowSkeleton } from './_components/post-row';
import { FeedRail } from './_components/feed-rail';
import { TagManager } from './_components/tag-manager';
import { STATUS_CONFIG, tagChipStyle } from './_components/blog-meta';

const PAGE_SIZE = 10;
// Layout effect on the client (apply stored view before first paint) without
// the SSR useLayoutEffect warning.
const useIsoLayoutEffect = typeof window === 'undefined' ? useEffect : useLayoutEffect;
// Visible keyboard-focus state for the toolbar's pill/tab controls.
const FOCUS_RING = 'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/50';
const EASE = [0.4, 0, 0.2, 1] as const;
const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 14 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.3, delay, ease: EASE },
});

type FeedTab = 'all' | 'mine';
type SortKey = 'newest' | 'views' | 'popular';

const SORT_PARAMS: Record<SortKey, { orderBy?: 'publishedAt' | 'viewCount' | 'reactions' | 'comments'; order?: 'asc' | 'desc' }> = {
  newest:  {},
  views:   { orderBy: 'viewCount',   order: 'desc' },
  popular: { orderBy: 'reactions',   order: 'desc' },
};

// Status transitions available from the feed's action menu.
const STATUS_ACTIONS = {
  archive:   { call: archivePost,   done: 'เก็บบทความเข้าคลังถาวรแล้ว' },
  unpublish: { call: unpublishPost, done: 'ยกเลิกการเผยแพร่แล้ว' },
  unarchive: { call: unarchivePost, done: 'นำบทความกลับมาเป็นฉบับร่างแล้ว' },
} as const;
type StatusAction = keyof typeof STATUS_ACTIONS;

function CardSkeleton() {
  return (
    <div className="overflow-hidden rounded-2xl bg-card ring-1 ring-foreground/10">
      <div className="aspect-video animate-pulse bg-muted" />
      <div className="space-y-2.5 p-4">
        <div className="h-3 w-16 animate-pulse rounded-full bg-muted" />
        <div className="h-4 w-full animate-pulse rounded bg-muted" />
        <div className="h-4 w-2/3 animate-pulse rounded bg-muted" />
        <div className="flex items-center gap-2 pt-3">
          <div className="size-6 animate-pulse rounded-full bg-muted" />
          <div className="h-3 w-24 animate-pulse rounded bg-muted" />
        </div>
      </div>
    </div>
  );
}

// useSearchParams ต้องอยู่ใต้ Suspense boundary ตอน prerender (Next.js docs)
export default function BlogPage() {
  return (
    <Suspense fallback={null}>
      <BlogPageContent />
    </Suspense>
  );
}

function BlogPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { canView, canCreate, canUpdate, canDelete } = useMenuPermission('blog');
  const noNode = !canView && !canCreate && !canUpdate && !canDelete;
  // Read/create stay fail-open when no permission node is configured; mutating
  // existing posts and admin tools are strict — same rule as the read page.
  const hasView = noNode || canView;
  const hasCreate = noNode || canCreate;
  const isAdmin = canUpdate; // blog:UPDATE → pin/feature/verify + tag CRUD
  const canDeleteAny = canDelete;

  const meId = useAuthStore((s) => s.user?.id);

  // ── Initial state from the URL — refresh/share restores the same view ──
  const [init] = useState(() => {
    const q = (searchParams.get('q') ?? '').trim();
    const status = searchParams.get('status');
    const sortParam = searchParams.get('sort');
    const params: FeedParams = {
      page: Math.max(1, Number.parseInt(searchParams.get('page') ?? '1', 10) || 1),
      debounced: q,
      activeTag: searchParams.get('tag'),
      tab: searchParams.get('tab') === 'mine' ? 'mine' : 'all',
      statusFilter:
        status && (POST_STATUSES as readonly string[]).includes(status) ? (status as PostStatus) : 'All',
      sort: sortParam === 'views' || sortParam === 'popular' ? sortParam : 'newest',
      verifiedOnly: searchParams.get('verified') === '1',
    };
    // The snapshot is in-memory, so it only exists after a client-side return
    // to this page — reading it here can never diverge from SSR'd HTML.
    return { params, feed: readFeedSnapshot(params) };
  });
  const initialFeed = init.feed;

  // ── Data ──
  const [posts, setPosts] = useState<Post[]>(() => initialFeed?.posts ?? []);
  const [total, setTotal] = useState(() => initialFeed?.total ?? 0);
  const [tags, setTags] = useState<Tag[]>(() => readTagsSnapshot() ?? []);
  // True once the first feed request settles — skeletons show only on that
  // initial load, never again on tab/filter refetches (avoids the flash).
  const [hasLoaded, setHasLoaded] = useState(() => initialFeed != null);
  // Accurate aggregate counts (fetched once) — not per-page sums.
  const [stats, setStats] = useState(() => readStatsSnapshot() ?? { total: 0, mine: 0, featured: 0 });

  // ── Filters ──
  const [search, setSearch] = useState(init.params.debounced);
  const [debounced, setDebounced] = useState(init.params.debounced);
  const [activeTag, setActiveTag] = useState<string | null>(init.params.activeTag); // tag id
  const [tab, setTab] = useState<FeedTab>(init.params.tab);
  const [statusFilter, setStatusFilter] = useState<'All' | PostStatus>(init.params.statusFilter);
  const [page, setPage] = useState(init.params.page);
  // List (editorial rows) vs grid (cards). Defaults to list; the stored choice
  // is applied in a pre-paint effect so SSR and hydration render never diverge.
  const [view, setView] = useState<'list' | 'grid'>('list');
  useIsoLayoutEffect(() => {
    try {
      if (localStorage.getItem('blog:view') === 'grid') setView('grid');
    } catch { /* ignore */ }
  }, []);
  const changeView = useCallback((v: 'list' | 'grid') => {
    setView(v);
    try { localStorage.setItem('blog:view', v); } catch { /* ignore */ }
  }, []);
  const [sort, setSort] = useState<SortKey>(init.params.sort as SortKey);
  const [verifiedOnly, setVerifiedOnly] = useState(init.params.verifiedOnly);
  // True while a refetch is in flight after the first load — dims the list so
  // tab/sort switches give feedback without the skeleton flash.
  const [refreshing, setRefreshing] = useState(false);

  // `/` jumps to search (ignored while typing in any field).
  const searchRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== '/' || e.ctrlKey || e.metaKey || e.altKey) return;
      const t = e.target as HTMLElement;
      if (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable) return;
      e.preventDefault();
      searchRef.current?.focus();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  // ── UI ──
  const [tagManagerOpen, setTagManagerOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Post | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [publishingId, setPublishingId] = useState<string | null>(null);
  const [statusBusyId, setStatusBusyId] = useState<string | null>(null);

  // Debounce search
  useEffect(() => {
    const t = setTimeout(() => setDebounced(search.trim()), 350);
    return () => clearTimeout(t);
  }, [search]);

  // Reset to page 1 when filters change — but not on mount, so a shared/
  // refreshed URL with ?page=N ไม่ถูกดีดกลับหน้าแรก
  const skipFirstReset = useRef(true);
  useEffect(() => {
    if (skipFirstReset.current) {
      skipFirstReset.current = false;
      return;
    }
    setPage(1);
  }, [debounced, activeTag, tab, statusFilter, sort, verifiedOnly]);

  // Reflect filters into the URL (replace, not push) so refresh and shared
  // links restore the same view. Native history API — no re-render loop.
  useEffect(() => {
    const qs = new URLSearchParams();
    if (debounced) qs.set('q', debounced);
    if (activeTag) qs.set('tag', activeTag);
    if (tab === 'mine') qs.set('tab', 'mine');
    if (sort !== 'newest') qs.set('sort', sort);
    if (statusFilter !== 'All') qs.set('status', statusFilter);
    if (verifiedOnly) qs.set('verified', '1');
    if (page > 1) qs.set('page', String(page));
    const next = qs.toString();
    if (window.location.search.replace(/^\?/, '') !== next) {
      window.history.replaceState(null, '', next ? `?${next}` : window.location.pathname);
    }
  }, [debounced, activeTag, tab, statusFilter, sort, verifiedOnly, page]);

  // Load tags once
  useEffect(() => {
    if (!hasView) return;
    fetchTags(!isAdmin) // admins see inactive tags too
      .then((t) => {
        setTags(t);
        writeTagsSnapshot(t);
      })
      .catch(() => { /* non-fatal */ });
  }, [hasView, isAdmin]);

  // Aggregate counts — a single stats endpoint (was 3× limit:1 round-trips).
  const refreshStats = useCallback(() => {
    if (!hasView) return;
    fetchBlogStats()
      .then((next) => {
        setStats(next);
        writeStatsSnapshot(next);
      })
      .catch(() => { /* non-fatal — cards keep the last snapshot */ });
  }, [hasView]);
  useEffect(() => { refreshStats(); }, [refreshStats]);


  const syncFeedCache = useCallback((params: FeedParams, nextPosts: Post[], nextTotal: number) => {
    writeFeedSnapshot(params, nextPosts, nextTotal);
  }, []);

  // Load feed on any param change. The sequence counter drops out-of-order
  // responses: rapid tab/sort clicks fire overlapping requests, and a slower
  // older response must never overwrite a newer one.
  const feedSeq = useRef(0);
  const loadFeed = useCallback(async () => {
    const seq = ++feedSeq.current;
    const params: FeedParams = { page, debounced, activeTag, tab, statusFilter, sort, verifiedOnly };
    setRefreshing(true);
    try {
      const res: PaginatedPosts = await fetchPosts({
        page,
        limit: PAGE_SIZE,
        search: debounced || undefined,
        tagId: activeTag ?? undefined,
        mine: tab === 'mine' || undefined,
        status: statusFilter === 'All' ? undefined : statusFilter,
        isVerified: verifiedOnly || undefined,
        ...SORT_PARAMS[sort],
      });
      if (seq !== feedSeq.current) return; // stale — a newer request took over
      setPosts(res.data);
      setTotal(res.total);
      syncFeedCache(params, res.data, res.total);
    } catch (err) {
      if (seq !== feedSeq.current) return;
      toast.error(humanizeBlogError(err));
      setPosts([]);
      setTotal(0);
    } finally {
      if (seq === feedSeq.current) {
        setHasLoaded(true);
        setRefreshing(false);
      }
    }
  }, [page, debounced, activeTag, tab, statusFilter, sort, verifiedOnly, syncFeedCache]);

  useEffect(() => { if (hasView) loadFeed(); }, [hasView, loadFeed]);

  // ── Per-post permissions + actions ──
  // Strict (no noNode fail-open) — admin (UPDATE) or the author with CREATE,
  // consistent with the read page's canEdit.
  const canEditPost = useCallback(
    (p: Post) => isAdmin || (canCreate && p.authorId === meId),
    [isAdmin, canCreate, meId],
  );

  const handlePublish = useCallback(async (p: Post) => {
    setPublishingId(p.id);
    try {
      const updated = await publishPost(p.id);
      setPosts((prev) => {
        const next = prev.map((it) => (it.id === p.id ? { ...it, ...updated } : it));
        syncFeedCache({ page, debounced, activeTag, tab, statusFilter, sort, verifiedOnly }, next, total);
        return next;
      });
      toast.success('เผยแพร่บทความแล้ว');
      refreshStats();
    } catch (err) {
      toast.error(humanizeBlogError(err));
    } finally {
      setPublishingId(null);
    }
  }, [refreshStats, syncFeedCache, page, debounced, activeTag, tab, statusFilter, sort, verifiedOnly, total]);

  // Status transitions — update the post in place and let the next feed load
  // reconcile filter membership.
  const handleStatusChange = useCallback(async (p: Post, action: StatusAction) => {
    setStatusBusyId(p.id);
    try {
      const { call, done } = STATUS_ACTIONS[action];
      const updated = await call(p.id);
      setPosts((prev) => {
        const next = prev.map((it) => (it.id === p.id ? { ...it, ...updated } : it));
        syncFeedCache({ page, debounced, activeTag, tab, statusFilter, sort, verifiedOnly }, next, total);
        return next;
      });
      toast.success(done);
      refreshStats();
    } catch (err) {
      toast.error(humanizeBlogError(err));
    } finally {
      setStatusBusyId(null);
    }
  }, [refreshStats, syncFeedCache, page, debounced, activeTag, tab, statusFilter, sort, verifiedOnly, total]);

  const handleDelete = useCallback(async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deletePost(deleteTarget.id);
      const nextTotal = Math.max(0, total - 1);
      setPosts((prev) => {
        const next = prev.filter((p) => p.id !== deleteTarget.id);
        syncFeedCache({ page, debounced, activeTag, tab, statusFilter, sort, verifiedOnly }, next, nextTotal);
        return next;
      });
      setTotal(nextTotal);
      // Deleting the last row of a page would otherwise strand the user on an
      // empty page — step back one (the effect refetches).
      const lastPage = Math.max(1, Math.ceil(nextTotal / PAGE_SIZE));
      if (page > lastPage) setPage(lastPage);
      toast.success('ลบบทความแล้ว');
      setDeleteTarget(null);
      refreshStats();
    } catch (err) {
      toast.error(humanizeBlogError(err));
    } finally {
      setDeleting(false);
    }
  }, [deleteTarget, refreshStats, syncFeedCache, page, debounced, activeTag, tab, statusFilter, sort, verifiedOnly, total]);

  // Keep the list + snapshot in step with the card's bookmark toggle, so
  // navigating away and back doesn't briefly show the stale state.
  const handleBookmarkToggled = useCallback((postId: string, bookmarked: boolean) => {
    setPosts((prev) => {
      const next = prev.map((p) => (p.id === postId ? { ...p, isBookmarked: bookmarked } : p));
      syncFeedCache({ page, debounced, activeTag, tab, statusFilter, sort, verifiedOnly }, next, total);
      return next;
    });
  }, [syncFeedCache, page, debounced, activeTag, tab, statusFilter, sort, verifiedOnly, total]);

  const actionsFor = useCallback((p: Post): ActionItem[] => {
    if (!canEditPost(p)) return [];
    const items: ActionItem[] = [
      { label: 'แก้ไข', icon: Pencil, onClick: () => router.push(`/blog/${p.slug}/edit`) },
    ];
    if (p.status === 'DRAFT') {
      items.push({
        label: publishingId === p.id ? 'กำลังเผยแพร่…' : 'เผยแพร่',
        icon: Send,
        disabled: publishingId === p.id,
        onClick: () => handlePublish(p),
      });
    }
    if (p.status === 'PUBLISHED') {
      items.push({
        label: statusBusyId === p.id ? 'กำลังดำเนินการ…' : 'ยกเลิกเผยแพร่',
        icon: Undo2,
        disabled: statusBusyId === p.id,
        onClick: () => handleStatusChange(p, 'unpublish'),
      });
    }
    if (p.status === 'ARCHIVED') {
      // ARCHIVED → DRAFT. Publish still rejects archived posts, so restoring
      // means unarchive → edit → publish.
      items.push({
        label: statusBusyId === p.id ? 'กำลังดำเนินการ…' : 'นำกลับมาแก้ไข',
        icon: ArchiveRestore,
        disabled: statusBusyId === p.id,
        onClick: () => handleStatusChange(p, 'unarchive'),
      });
    } else {
      items.push({
        label: statusBusyId === p.id ? 'กำลังดำเนินการ…' : 'เก็บถาวร',
        icon: Archive,
        disabled: statusBusyId === p.id,
        onClick: () => handleStatusChange(p, 'archive'),
      });
    }
    if (canDeleteAny) {
      items.push({ label: 'ลบ', icon: Trash2, destructive: true, onClick: () => setDeleteTarget(p) });
    }
    return items;
  }, [canEditPost, canDeleteAny, publishingId, statusBusyId, router, handlePublish, handleStatusChange]);

  // Show a lead/feature card only in grid view on the clean, first-page default
  // — any active filter means the user is hunting, not browsing.
  const isCleanView =
    page === 1 && !debounced && !activeTag && statusFilter === 'All' && !verifiedOnly && tab === 'all';
  const useHero = view === 'grid' && isCleanView && posts.length >= 4;
  // Promote a pinned post, then a featured one; fall back to the newest.
  const heroIndex = useHero
    ? (() => {
        const pinned = posts.findIndex((p) => p.isPinned);
        if (pinned !== -1) return pinned;
        const featured = posts.findIndex((p) => p.isFeatured);
        return featured !== -1 ? featured : 0;
      })()
    : -1;
  const hero = heroIndex === -1 ? undefined : posts[heroIndex];
  const gridPosts = heroIndex === -1 ? posts : posts.filter((_, i) => i !== heroIndex);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  if (!hasView) {
    return (
      <div className="page-shell flex flex-col items-center justify-center gap-3 py-32 text-center">
        <Shield className="size-10 text-muted-foreground/40" />
        <p className="text-sm font-medium text-muted-foreground">คุณไม่มีสิทธิ์เข้าถึงหน้านี้</p>
      </div>
    );
  }

  return (
    <div className="page-shell">
      {/* ── Header ── */}
      <PageHeader
        icon={BookOpen}
        title="คลังความรู้"
        subtitle="แบ่งปันและค้นหาความรู้จากทีม — บทความ How-to แนวทางปฏิบัติ และบันทึกประสบการณ์"
        actions={
          <>
            <Button variant="outline" size="lg" onClick={() => router.push('/blog/bookmarks')}>
              <Bookmark />
              <span className="hidden sm:inline">ที่บันทึกไว้</span>
            </Button>
            {isAdmin && (
              <Button variant="outline" size="lg" onClick={() => setTagManagerOpen(true)}>
                <Tags />
                <span className="hidden sm:inline">จัดการแท็ก</span>
              </Button>
            )}
            {hasCreate && (
              <Button variant="create" size="lg" onClick={() => router.push('/blog/new')}>
                <PenLine />
                <span className="hidden sm:inline">เขียนบทความ</span>
                <span className="sm:hidden">เขียน</span>
              </Button>
            )}
          </>
        }
      />

      {/* ── Stats ── */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <motion.div {...fadeUp(0.06)}>
          <StatCard icon={FileText} label="บทความทั้งหมด" value={stats.total} gradient="from-violet-500 to-fuchsia-500" />
        </motion.div>
        <motion.div {...fadeUp(0.12)}>
          <StatCard icon={Sparkles} label="บทความเด่น" value={stats.featured} gradient="from-amber-500 to-orange-500" />
        </motion.div>
        <motion.div {...fadeUp(0.18)}>
          <StatCard icon={PenLine} label="บทความของฉัน" value={stats.mine} gradient="from-sky-500 to-blue-600" />
        </motion.div>
        <motion.div {...fadeUp(0.24)}>
          <StatCard icon={Tags} label="แท็ก" value={tags.length} gradient="from-emerald-500 to-teal-500" />
        </motion.div>
      </div>

      {/* ── Toolbar ── */}
      <motion.div {...fadeUp(0.3)} className="flex flex-col gap-2.5">
        <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative w-full sm:max-w-72">
            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              ref={searchRef}
              className="pl-8 pr-8"
              placeholder="ค้นหาบทความ…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <kbd className="pointer-events-none absolute right-2.5 top-1/2 hidden -translate-y-1/2 rounded border border-border px-1.5 font-mono text-[10px] text-muted-foreground sm:inline-block">
              /
            </kbd>
          </div>

          <div className="flex shrink-0 items-center gap-2">
            {/* Tab: all / mine */}
            <div className="flex items-center gap-0.5 rounded-lg border border-border/60 bg-card/40 p-0.5">
              {([['all', 'ทั้งหมด'], ['mine', 'ของฉัน']] as const).map(([val, label]) => (
                <button
                  key={val}
                  onClick={() => setTab(val)}
                  className={cn(
                    'relative z-10 cursor-pointer whitespace-nowrap rounded-md px-3 py-1 text-xs font-medium transition-colors',
                    FOCUS_RING,
                    tab === val ? 'text-foreground' : 'text-muted-foreground hover:text-foreground',
                  )}
                >
                  {tab === val && (
                    <motion.span
                      layoutId="blog-tab-bg"
                      className="absolute inset-0 -z-10 rounded-md bg-accent/70"
                      transition={{ type: 'spring', stiffness: 380, damping: 32 }}
                    />
                  )}
                  {label}
                </button>
              ))}
            </div>

            {/* Sort */}
            <div className="flex items-center gap-0.5 rounded-lg border border-border/60 bg-card/40 p-0.5">
              {([
                ['newest', 'ล่าสุด', 'Clock'],
                ['views', 'ดูมาก', 'Eye'],
                ['popular', 'นิยม', 'TrendingUp'],
              ] as const).map(([val, label, iconName]) => {
                const Icon = iconName === 'Clock' ? Clock : iconName === 'Eye' ? Eye : TrendingUp;
                return (
                  <button
                    key={val}
                    type="button"
                    title={label}
                    onClick={() => setSort(val as SortKey)}
                    className={cn(
                      'relative z-10 flex cursor-pointer items-center gap-1 rounded-md px-2 py-1 text-xs font-medium transition-colors',
                      FOCUS_RING,
                      sort === val ? 'text-foreground' : 'text-muted-foreground hover:text-foreground',
                    )}
                  >
                    {sort === val && (
                      <motion.span
                        layoutId="blog-sort-bg"
                        className="absolute inset-0 -z-10 rounded-md bg-accent/70"
                        transition={{ type: 'spring', stiffness: 380, damping: 32 }}
                      />
                    )}
                    <Icon size={12} />
                    <span className="hidden sm:inline">{label}</span>
                  </button>
                );
              })}
            </div>

            {/* View: list / grid */}
            <div className="flex items-center rounded-lg border border-border/60 bg-card/40 p-0.5">
              {([['list', List], ['grid', LayoutGrid]] as const).map(([v, Icon]) => (
                <button
                  key={v}
                  onClick={() => changeView(v)}
                  aria-label={v === 'list' ? 'มุมมองรายการ' : 'มุมมองการ์ด'}
                  aria-pressed={view === v}
                  className={cn(
                    'relative z-10 flex size-7 cursor-pointer items-center justify-center rounded-md transition-colors',
                    FOCUS_RING,
                    view === v ? 'text-foreground' : 'text-muted-foreground hover:text-foreground',
                  )}
                >
                  {view === v && (
                    <motion.span
                      layoutId="blog-view-bg"
                      className="absolute inset-0 -z-10 rounded-md bg-accent/70"
                      transition={{ type: 'spring', stiffness: 380, damping: 32 }}
                    />
                  )}
                  <Icon size={14} />
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Tag filter + verified + admin status */}
        <div className="flex flex-wrap items-center gap-2">
            {tags.length > 0 && (
              <div className="flex min-w-0 flex-1 items-center gap-1.5 overflow-x-auto pb-0.5">
                <button
                  onClick={() => setActiveTag(null)}
                  className={cn(
                    'shrink-0 cursor-pointer rounded-full border px-2.5 py-1 text-[11px] font-medium transition-colors',
                    FOCUS_RING,
                    activeTag === null
                      ? 'border-brand/40 bg-brand-muted/60 text-brand'
                      : 'border-border/60 bg-card/40 text-muted-foreground hover:text-foreground',
                  )}
                >
                  ทุกแท็ก
                </button>
                {tags.map((t) => {
                  const active = activeTag === t.id;
                  return (
                    <button
                      key={t.id}
                      onClick={() => setActiveTag(active ? null : t.id)}
                      aria-pressed={active}
                      style={active ? tagChipStyle(t.color) : undefined}
                      className={cn(
                        'inline-flex shrink-0 cursor-pointer items-center gap-1 rounded-full border px-2.5 py-1 text-[11px] font-medium transition-colors',
                        FOCUS_RING,
                        active ? 'tag-chip' : 'border-border/60 bg-card/40 text-muted-foreground hover:text-foreground',
                      )}
                    >
                      <span className="size-1.5 rounded-full" style={{ backgroundColor: t.color || '#7c3aed' }} />
                      {t.name}
                    </button>
                  );
                })}
              </div>
            )}

            {/* Verified-only filter — available to everyone */}
            <button
              onClick={() => setVerifiedOnly((v) => !v)}
              title="แสดงเฉพาะบทความที่รับรองแล้ว"
              aria-pressed={verifiedOnly}
              className={cn(
                'inline-flex shrink-0 cursor-pointer items-center gap-1 rounded-full border px-2.5 py-1 text-[11px] font-medium transition-colors',
                FOCUS_RING,
                verifiedOnly
                  ? 'border-sky-500/40 bg-sky-500/12 text-sky-600 dark:text-sky-400'
                  : 'border-border/60 bg-card/40 text-muted-foreground hover:text-foreground',
              )}
            >
              <BadgeCheck className={cn('size-3.5', verifiedOnly && 'fill-sky-500 text-white')} />
              รับรองแล้ว
            </button>

            {/* Admin/mine status pills */}
            {(isAdmin || tab === 'mine') && (
              <div className="flex shrink-0 items-center gap-0.5 rounded-lg border border-border/60 bg-card/40 p-0.5">
                {(['All', ...POST_STATUSES] as const).map((s) => (
                  <button
                    key={s}
                    onClick={() => setStatusFilter(s)}
                    className={cn(
                      'relative z-10 cursor-pointer whitespace-nowrap rounded-md px-2.5 py-1 text-[11px] font-medium transition-colors',
                      FOCUS_RING,
                      statusFilter === s ? 'text-foreground' : 'text-muted-foreground hover:text-foreground',
                    )}
                  >
                    {statusFilter === s && (
                      <motion.span
                        layoutId="blog-status-bg"
                        className="absolute inset-0 -z-10 rounded-md bg-accent/70"
                        transition={{ type: 'spring', stiffness: 380, damping: 32 }}
                      />
                    )}
                    {s === 'All' ? 'ทุกสถานะ' : STATUS_CONFIG[s].label}
                  </button>
                ))}
              </div>
            )}
          </div>
      </motion.div>


      {/* ── Content + right rail (list view) ── */}
      <div className={cn(view === 'list' && 'lg:grid lg:grid-cols-[minmax(0,1fr)_15rem] lg:gap-8 xl:grid-cols-[minmax(0,1fr)_18rem] xl:gap-10 lg:items-start')}>
        <div className="min-w-0">
      {/* Fixed min-height keeps the page from collapsing/growing when switching tabs. */}
      <div className={cn('min-h-[60vh] transition-opacity duration-200', refreshing && hasLoaded && 'opacity-60')}>
      {!hasLoaded && posts.length === 0 ? (
        view === 'list' ? (
          <div className="divide-y divide-border/60">
            {Array.from({ length: 6 }).map((_, i) => <RowSkeleton key={i} />)}
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => <CardSkeleton key={i} />)}
          </div>
        )
      ) : posts.length === 0 ? (
        <motion.div {...fadeUp(0.36)} className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-border py-20 text-center">
          <div className="flex size-12 items-center justify-center rounded-2xl bg-brand-muted text-brand">
            <BookOpen className="size-5" />
          </div>
          <div>
            <p className="text-sm font-semibold text-foreground">
              {debounced || activeTag || tab === 'mine' || statusFilter !== 'All' ? 'ไม่พบบทความที่ตรงกับตัวกรอง' : 'ยังไม่มีบทความในคลังความรู้'}
            </p>
            <p className="mt-0.5 text-xs text-muted-foreground">
              {tab === 'mine' ? 'เริ่มแบ่งปันความรู้ของคุณกับทีมได้เลย' : 'เป็นคนแรกที่แบ่งปันความรู้กับทีม'}
            </p>
          </div>
          {hasCreate && (
            <Button variant="create" size="sm" onClick={() => router.push('/blog/new')}>
              <Plus />
              เขียนบทความ
            </Button>
          )}
        </motion.div>
      ) : (
        // Content stays mounted across tab/filter switches and swaps in place
        // (React reconciles by post id) — no skeleton flash. Only the list↔grid
        // switch cross-fades (DESIGN.md view-switch pattern).
        <AnimatePresence mode="wait" initial={false}>
          {view === 'list' ? (
            // Editorial list — date-led rows with a right thumbnail (default view).
            <motion.div
              key="list"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="divide-y divide-border/60"
            >
              {posts.map((p) => (
                <PostRow key={p.id} post={p} actions={actionsFor(p)} onBookmarkToggled={handleBookmarkToggled} />
              ))}
            </motion.div>
          ) : (
            <motion.div
              key="grid"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="flex flex-col gap-4"
            >
              {hero && (
                <PostCard
                  post={hero}
                  variant="feature"
                  actions={actionsFor(hero)}
                  onBookmarkToggled={handleBookmarkToggled}
                />
              )}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {gridPosts.map((p) => (
                  <PostCard key={p.id} post={p} actions={actionsFor(p)} onBookmarkToggled={handleBookmarkToggled} />
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      )}
      </div>{/* /min-height content region */}

          {/* Pagination */}
          {posts.length > 0 && totalPages > 1 && (
            <div className="mt-4 overflow-hidden rounded-xl bg-card ring-1 ring-foreground/10">
              <Pagination
                page={page}
                totalPages={totalPages}
                total={total}
                pageSize={PAGE_SIZE}
                onChange={setPage}
                layoutId="blog-page-active-bg"
                itemLabel="บทความ"
              />
            </div>
          )}
        </div>{/* /main column */}

        {view === 'list' && (
          <aside className="hidden lg:block">
            <FeedRail
              tags={tags}
              activeTag={activeTag}
              onSelectTag={(id) => setActiveTag((cur) => (cur === id ? null : id))}
            />
          </aside>
        )}
      </div>{/* /content + rail */}

      {/* Publishing overlay hint */}
      {publishingId && (
        <div className="pointer-events-none fixed bottom-6 left-1/2 z-30 -translate-x-1/2 rounded-full bg-foreground px-4 py-2 text-xs font-medium text-background shadow-lg">
          <span className="inline-flex items-center gap-2">
            <Loader2 className="size-3.5 animate-spin" />
            กำลังเผยแพร่…
          </span>
        </div>
      )}

      {/* ── Modals ── */}
      {isAdmin && (
        <TagManager
          open={tagManagerOpen}
          tags={tags}
          canDelete={canDeleteAny}
          onClose={() => setTagManagerOpen(false)}
          onChange={(nextTags) => {
            setTags(nextTags);
            writeTagsSnapshot(nextTags);
          }}
        />
      )}

      <ConfirmDialog
        open={deleteTarget !== null}
        title="ลบบทความ"
        loading={deleting}
        message={
          <>
            ลบ <span className="font-semibold text-foreground">{deleteTarget?.title}</span> ออกจากคลังความรู้?
            การกระทำนี้ไม่สามารถยกเลิกได้
          </>
        }
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
