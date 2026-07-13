'use client';

import Link from 'next/link';
import { Eye, Clock, Pin, Heart, MessageCircle, Sparkles } from 'lucide-react';
import { ActionMenu, type ActionItem } from '@/components/management/action-menu';
import { type Post, authorDisplayName } from '@/lib/blog/types';
import { CoverFallback } from './post-card';
import { PostBookmarkButton } from './post-bookmark-button';
import { TagChip, StatusBadge, VerifiedBadge, fmtDate, fmtCount, isNewPost } from './blog-meta';

/**
 * Editorial list row: date-led, underlined title, summary, and a thumbnail on
 * the right — the row equivalent of PostCard. Used by the feed's list view.
 */
export function PostRow({
  post,
  actions,
  onBookmarkToggled,
}: {
  post: Post;
  actions?: ActionItem[];
  /** Bubbled up from the bookmark toggle so the parent can sync its state. */
  onBookmarkToggled?: (postId: string, bookmarked: boolean) => void;
}) {
  const showStatus = post.status !== 'PUBLISHED';

  return (
    <article className="group relative flex gap-4 py-5 sm:gap-6">
      {/* Stretched link — whole row is clickable; interactive children sit above. */}
      <Link
        href={`/blog/${post.slug}`}
        aria-label={post.title}
        className="absolute inset-0 z-[1] rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40"
      />

      {/* Text */}
      <div className="min-w-0 flex-1">
        <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
          {post.isPinned && <Pin className="size-3 fill-brand text-brand" />}
          <span className="tabular-nums">{fmtDate(post.publishedAt ?? post.createdAt)}</span>
        </p>

        <h3 className="mt-1 text-base font-semibold leading-snug text-foreground underline decoration-foreground/15 underline-offset-4 transition-colors group-hover:text-brand group-hover:decoration-brand/40 sm:text-lg">
          {post.isFeatured && (
            <span className="relative -top-px mr-1.5 inline-flex items-center gap-1 rounded-full bg-amber-500/15 px-2 py-0.5 text-[11px] font-semibold tracking-wide text-amber-600 no-underline dark:text-amber-400">
              <Sparkles className="size-3" />
              แนะนำ
            </span>
          )}
          {post.isVerified && <VerifiedBadge className="mr-1 size-[1.05em] no-underline" />}
          {post.title}
          {post.status === 'PUBLISHED' && isNewPost(post.publishedAt, post.createdAt) && (
            <span className="relative -top-px ml-1.5 inline-flex items-center rounded-full bg-emerald-500 px-1.5 py-px text-[10px] font-bold uppercase tracking-wider text-white no-underline">
              new
            </span>
          )}
        </h3>

        {(showStatus || post.tags.length > 0) && (
          <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
            {showStatus && <StatusBadge status={post.status} />}
            {post.tags.slice(0, 3).map((t) => <TagChip key={t.id} tag={t} />)}
          </div>
        )}

        {post.summary && (
          <p className="mt-2 line-clamp-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">
            {post.summary}
          </p>
        )}

        <div className="mt-2.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
          <span className="truncate font-medium text-foreground/70">{authorDisplayName(post.author)}</span>
          <span className="inline-flex items-center gap-1"><Clock className="size-3" />{post.readTimeMinutes} นาที</span>
          <span className="inline-flex items-center gap-1"><Eye className="size-3" />{fmtCount(post.viewCount)}</span>
          <span className="inline-flex items-center gap-1"><Heart className="size-3" />{fmtCount(post._count.reactions)}</span>
          <span className="inline-flex items-center gap-1"><MessageCircle className="size-3" />{fmtCount(post._count.comments)}</span>
        </div>
      </div>

      {/* Thumbnail */}
      <div className="relative w-24 shrink-0 self-start overflow-hidden rounded-lg ring-1 ring-foreground/10 sm:w-40">
        <div className="aspect-video">
          {post.coverImageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={post.coverImageUrl}
              alt=""
              loading="lazy"
              className="size-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
            />
          ) : (
            <CoverFallback post={post} className="size-full" />
          )}
        </div>
      </div>

      <div className="relative z-[2] -mr-1 flex shrink-0 flex-col items-center gap-1 self-start">
        <PostBookmarkButton
          postId={post.id}
          initialBookmarked={post.isBookmarked}
          variant="icon"
          onToggled={(b) => onBookmarkToggled?.(post.id, b)}
        />
        {actions && actions.length > 0 && <ActionMenu actions={actions} />}
      </div>
    </article>
  );
}

/** Loading placeholder matching a PostRow. */
export function RowSkeleton() {
  return (
    <div className="flex gap-4 py-5 sm:gap-6">
      <div className="min-w-0 flex-1 space-y-2.5">
        <div className="h-3 w-20 animate-pulse rounded bg-muted" />
        <div className="h-5 w-2/3 animate-pulse rounded bg-muted" />
        <div className="h-3.5 w-full max-w-lg animate-pulse rounded bg-muted" />
        <div className="h-3 w-40 animate-pulse rounded bg-muted" />
      </div>
      <div className="aspect-video w-24 shrink-0 animate-pulse rounded-lg bg-muted sm:w-40" />
    </div>
  );
}
