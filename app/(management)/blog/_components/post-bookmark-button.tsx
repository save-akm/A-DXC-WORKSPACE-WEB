'use client';

import { useCallback, useState } from 'react';
import { Bookmark, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from '@/components/ui/toast';
import { toggleBookmark } from '@/lib/api/blog';
import { humanizeBlogError } from '@/lib/blog/types';

interface PostBookmarkButtonProps {
  postId: string;
  /** Current state from the post payload (`Post.isBookmarked`). */
  initialBookmarked: boolean;
  /** `full` = labelled pill (read page); `icon` = compact square (cards). */
  variant?: 'full' | 'icon';
  /** Called after a successful toggle, e.g. to sync the parent list. */
  onToggled?: (bookmarked: boolean) => void;
  className?: string;
}

export function PostBookmarkButton({
  postId,
  initialBookmarked,
  variant = 'full',
  onToggled,
  className,
}: PostBookmarkButtonProps) {
  const [bookmarked, setBookmarked] = useState(initialBookmarked);
  const [busy, setBusy] = useState(false);

  const handleToggle = useCallback(async (e?: React.MouseEvent) => {
    // On a card the button sits over a stretched link — don't navigate.
    e?.preventDefault();
    e?.stopPropagation();
    setBusy(true);
    try {
      const res = await toggleBookmark(postId);
      setBookmarked(res.bookmarked);
      onToggled?.(res.bookmarked);
      toast.success(res.bookmarked ? 'บันทึกบทความแล้ว' : 'ยกเลิกการบันทึกแล้ว');
    } catch (err) {
      toast.error(humanizeBlogError(err));
    } finally {
      setBusy(false);
    }
  }, [postId, onToggled]);

  const label = bookmarked ? 'ยกเลิกการบันทึก' : 'บันทึกบทความ';

  if (variant === 'icon') {
    return (
      <button
        type="button"
        disabled={busy}
        onClick={handleToggle}
        title={label}
        aria-label={label}
        aria-pressed={bookmarked}
        className={cn(
          'inline-flex size-8 cursor-pointer items-center justify-center rounded-lg border transition-colors',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/50',
          bookmarked
            ? 'border-brand/40 bg-brand-muted/60 text-brand'
            : 'border-border/60 bg-card/40 text-muted-foreground hover:border-border hover:text-foreground',
          busy && 'opacity-70',
          className,
        )}
      >
        {busy ? (
          <Loader2 className="size-3.5 animate-spin" />
        ) : (
          <Bookmark className={cn('size-3.5', bookmarked && 'fill-brand/30')} />
        )}
      </button>
    );
  }

  return (
    <button
      type="button"
      disabled={busy}
      onClick={handleToggle}
      title={label}
      aria-pressed={bookmarked}
      className={cn(
        'inline-flex cursor-pointer items-center gap-1.5 rounded-lg border px-3 py-1.5 text-[12px] font-medium transition-colors',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/50',
        bookmarked
          ? 'border-brand/40 bg-brand-muted/60 text-brand'
          : 'border-border/60 bg-card/40 text-muted-foreground hover:border-border hover:text-foreground',
        busy && 'opacity-70',
        className,
      )}
    >
      {busy ? (
        <Loader2 className="size-3.5 animate-spin" />
      ) : (
        <Bookmark className={cn('size-3.5', bookmarked && 'fill-brand/30')} />
      )}
      {bookmarked ? 'บันทึกแล้ว' : 'บันทึก'}
    </button>
  );
}
