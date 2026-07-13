'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Hash, Bookmark, Clock, ChevronRight, TrendingUp, Eye } from 'lucide-react';
import { cn } from '@/lib/utils';
import { fetchBookmarks, fetchPosts } from '@/lib/api/blog';
import type { Post, Tag, Bookmark as BookmarkEntry } from '@/lib/blog/types';
import { fmtCount, tagChipStyle } from './blog-meta';

interface FeedRailProps {
  tags: Tag[];
  activeTag: string | null;
  onSelectTag: (id: string) => void;
}

/**
 * Right rail for the feed's list view — fills the space beside the reading
 * column with discovery aids. Both modules read from existing endpoints; the
 * rail (or an individual module) hides itself when it has nothing to show.
 */
export function FeedRail({ tags, activeTag, onSelectTag }: FeedRailProps) {
  const [bookmarks, setBookmarks] = useState<BookmarkEntry[]>([]);
  const [bmLoaded, setBmLoaded] = useState(false);
  const [mostRead, setMostRead] = useState<Post[]>([]);
  const [mrLoaded, setMrLoaded] = useState(false);

  useEffect(() => {
    let alive = true;
    fetchBookmarks({ limit: 5 })
      .then((res) => { if (alive) setBookmarks(res.data); })
      .catch(() => {})
      .finally(() => { if (alive) setBmLoaded(true); });
    fetchPosts({ limit: 5, status: 'PUBLISHED', orderBy: 'viewCount', order: 'desc' })
      .then((res) => {
        if (!alive) return;
        setMostRead(res.data);
      })
      .catch(() => {})
      .finally(() => { if (alive) setMrLoaded(true); });
    return () => { alive = false; };
  }, []);

  const popularTags = [...tags]
    .sort((a, b) => (b._count?.posts ?? 0) - (a._count?.posts ?? 0))
    .slice(0, 8);

  if (popularTags.length === 0 && bmLoaded && bookmarks.length === 0 && mrLoaded && mostRead.length === 0) return null;

  return (
    <nav className="sticky top-4 space-y-6">
      {/* Popular tags */}
      {popularTags.length > 0 && (
        <section>
          <p className="mb-2.5 flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
            <Hash className="size-3.5" />
            แท็กยอดนิยม
          </p>
          <div className="flex flex-wrap gap-1.5">
            {popularTags.map((t) => {
              const active = activeTag === t.id;
              return (
                <button
                  key={t.id}
                  onClick={() => onSelectTag(t.id)}
                  aria-pressed={active}
                  style={active ? tagChipStyle(t.color) : undefined}
                  className={cn(
                    'inline-flex cursor-pointer items-center gap-1 rounded-full border px-2.5 py-1 text-[11px] font-medium transition-colors',
                    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/50',
                    active ? 'tag-chip' : 'border-border/60 bg-card/40 text-muted-foreground hover:text-foreground',
                  )}
                >
                  <span className="size-1.5 rounded-full" style={{ backgroundColor: t.color || '#7c3aed' }} />
                  {t.name}
                  {typeof t._count?.posts === 'number' && (
                    <span className="tabular-nums opacity-60">{t._count.posts}</span>
                  )}
                </button>
              );
            })}
          </div>
        </section>
      )}

      {/* Most read */}
      {mostRead.length > 0 && (
        <section>
          <p className="mb-2.5 flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
            <TrendingUp className="size-3.5" />
            อ่านมากสุด
          </p>
          <ol className="space-y-0.5">
            {mostRead.map((p, i) => (
              <li key={p.id}>
                <Link
                  href={`/blog/${p.slug}`}
                  className="group flex items-start gap-2.5 rounded-lg px-2 py-1.5 transition-colors hover:bg-muted/50"
                >
                  <span className="mt-px shrink-0 w-4 text-right text-[11px] font-semibold tabular-nums text-muted-foreground/50">
                    {i + 1}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="line-clamp-2 text-[13px] font-medium leading-snug text-foreground transition-colors group-hover:text-brand">
                      {p.title}
                    </p>
                    <p className="mt-0.5 inline-flex items-center gap-1 text-[11px] text-muted-foreground">
                      <Eye className="size-3" />
                      {fmtCount(p.viewCount)} ครั้ง
                    </p>
                  </div>
                </Link>
              </li>
            ))}
          </ol>
        </section>
      )}

      {/* Recent bookmarks */}
      {bookmarks.length > 0 && (
        <section>
          <div className="mb-2 flex items-center justify-between gap-2">
            <p className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
              <Bookmark className="size-3.5" />
              ที่บันทึกไว้
            </p>
            <Link
              href="/blog/bookmarks"
              className="inline-flex items-center gap-0.5 text-[11px] font-medium text-brand transition-colors hover:underline"
            >
              ดูทั้งหมด
              <ChevronRight className="size-3" />
            </Link>
          </div>
          <ul className="space-y-0.5">
            {bookmarks.map((b) => (
              <li key={b.id}>
                <Link
                  href={`/blog/${b.post.slug}`}
                  className="group block rounded-lg px-2 py-1.5 transition-colors hover:bg-muted/50"
                >
                  <p className="line-clamp-2 text-[13px] font-medium leading-snug text-foreground transition-colors group-hover:text-brand">
                    {b.post.title}
                  </p>
                  <p className="mt-0.5 inline-flex items-center gap-1 text-[11px] text-muted-foreground">
                    <Clock className="size-3" />
                    {b.post.readTimeMinutes} นาที
                  </p>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}
    </nav>
  );
}
