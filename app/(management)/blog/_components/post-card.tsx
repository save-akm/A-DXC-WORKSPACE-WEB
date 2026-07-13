'use client';

import Link from 'next/link';
import { Eye, Clock, Pin, Heart, MessageCircle, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import { UserAvatar } from '@/components/ui/user-avatar';
import { ActionMenu, type ActionItem } from '@/components/management/action-menu';
import { PostBookmarkButton } from './post-bookmark-button';
import {
  type Post,
  authorDisplayName,
  authorInitials,
  avatarColorFor,
} from '@/lib/blog/types';
import { TagChip, StatusBadge, VerifiedBadge, fmtDate, fmtCount, isNewPost } from './blog-meta';

// Deterministic cover fallback — a quiet tinted wash keyed off the post id.
const COVER_GRADIENTS = [
  'from-violet-500/15 to-fuchsia-500/10',
  'from-sky-500/15 to-indigo-500/10',
  'from-emerald-500/15 to-teal-500/10',
  'from-amber-500/15 to-orange-500/10',
  'from-rose-500/15 to-pink-500/10',
];
function coverGradient(seed: string) {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  return COVER_GRADIENTS[h % COVER_GRADIENTS.length];
}

export function CoverFallback({ post, className }: { post: Post; className?: string }) {
  return (
    <div className={cn('flex items-center justify-center bg-linear-to-br', coverGradient(post.id), className)}>
      <span className="max-w-[80%] truncate px-4 text-center text-2xl font-bold tracking-tight text-foreground/25">
        {post.tags[0]?.name ?? 'Know-how'}
      </span>
    </div>
  );
}

function MetaRow({ post, className }: { post: Post; className?: string }) {
  return (
    <div className={cn('flex items-center gap-3 text-[11px] text-muted-foreground', className)}>
      <span className="inline-flex items-center gap-1">
        <Clock className="size-3" />
        {post.readTimeMinutes} นาที
      </span>
      <span className="inline-flex items-center gap-1">
        <Eye className="size-3" />
        {fmtCount(post.viewCount)}
      </span>
      <span className="inline-flex items-center gap-1">
        <Heart className="size-3" />
        {fmtCount(post._count.reactions)}
      </span>
      <span className="inline-flex items-center gap-1">
        <MessageCircle className="size-3" />
        {fmtCount(post._count.comments)}
      </span>
      <span className="tabular-nums">{fmtDate(post.publishedAt ?? post.createdAt)}</span>
    </div>
  );
}

interface PostCardProps {
  post: Post;
  actions?: ActionItem[];
  /** `feature` = wide lead card (image beside content on desktop). */
  variant?: 'default' | 'feature';
  /** Bubbled up from the bookmark toggle so the parent can sync its state. */
  onBookmarkToggled?: (postId: string, bookmarked: boolean) => void;
  className?: string;
}

export function PostCard({ post, actions, variant = 'default', onBookmarkToggled, className }: PostCardProps) {
  const isFeature = variant === 'feature';
  const showStatus = post.status !== 'PUBLISHED';
  const author = post.author;

  return (
    <article
      className={cn(
        'group relative flex overflow-hidden rounded-2xl bg-card ring-1 ring-foreground/10 transition-all duration-200 hover:ring-foreground/20 hover:shadow-md',
        isFeature ? 'flex-col lg:flex-row' : 'flex-col',
        className,
      )}
    >
      {/* Stretched link — makes the whole card clickable while keeping the
          markup as a single anchor. Interactive children sit above via z-index. */}
      <Link
        href={`/blog/${post.slug}`}
        aria-label={post.title}
        className="absolute inset-0 z-[1] rounded-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/50"
      />

      {/* Cover */}
      <div
        className={cn(
          'relative shrink-0 overflow-hidden',
          isFeature ? 'aspect-video lg:aspect-auto lg:w-[46%]' : 'aspect-video',
        )}
      >
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

        {/* Pinned marker */}
        {post.isPinned && (
          <span className="absolute left-3 top-3 z-[2] inline-flex items-center gap-1 rounded-full bg-background/85 px-2 py-0.5 text-[11px] font-semibold text-brand shadow-sm backdrop-blur-sm">
            <Pin className="size-3 fill-brand" />
            ปักหมุด
          </span>
        )}
      </div>

      {/* Body */}
      <div className={cn('flex min-w-0 flex-1 flex-col p-4', isFeature && 'lg:p-6')}>
        {/* Tags + status */}
        <div className="mb-2 flex flex-wrap items-center gap-1.5">
          {showStatus && <StatusBadge status={post.status} />}
          {post.tags.slice(0, isFeature ? 3 : 2).map((t) => (
            <TagChip key={t.id} tag={t} />
          ))}
        </div>

        {/* Title */}
        <h3
          className={cn(
            'font-semibold tracking-tight text-foreground transition-colors group-hover:text-brand',
            isFeature ? 'line-clamp-3 text-xl leading-snug lg:text-2xl' : 'line-clamp-2 text-[15px] leading-snug',
          )}
        >
          {post.isFeatured && (
            <span className="relative -top-px mr-1.5 inline-flex items-center gap-1 rounded-full bg-amber-500/15 px-2 py-0.5 text-[11px] font-semibold tracking-wide text-amber-600 dark:text-amber-400">
              <Sparkles className="size-3" />
              แนะนำ
            </span>
          )}
          {post.isVerified && <VerifiedBadge className="mr-1 size-[1.05em]" />}
          {post.title}
          {post.status === 'PUBLISHED' && isNewPost(post.publishedAt, post.createdAt) && (
            <span className="relative -top-px ml-1.5 inline-flex items-center rounded-full bg-emerald-500 px-1.5 py-px text-[10px] font-bold uppercase tracking-wider text-white">
              new
            </span>
          )}
        </h3>

        {/* Summary */}
        {post.summary && (
          <p className={cn('mt-1.5 text-sm leading-relaxed text-muted-foreground', isFeature ? 'line-clamp-3' : 'line-clamp-2')}>
            {post.summary}
          </p>
        )}

        {/* Footer */}
        <div className="mt-auto flex items-center justify-between gap-2 pt-4">
          <div className="flex min-w-0 items-center gap-2">
            <UserAvatar
              avatarUrl={author.avatarUrl}
              initial={authorInitials(author)}
              color={avatarColorFor(author.id)}
              size="xs"
            />
            <div className="min-w-0">
              <p className="truncate text-xs font-medium text-foreground">{authorDisplayName(author)}</p>
              <MetaRow post={post} className="mt-0.5" />
            </div>
          </div>

          <div className="relative z-[2] flex shrink-0 items-center gap-1">
            <PostBookmarkButton
              postId={post.id}
              initialBookmarked={post.isBookmarked}
              variant="icon"
              onToggled={(b) => onBookmarkToggled?.(post.id, b)}
            />
            {actions && actions.length > 0 && <ActionMenu actions={actions} />}
          </div>
        </div>
      </div>
    </article>
  );
}
