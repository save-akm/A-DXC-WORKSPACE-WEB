'use client';

import { useState } from 'react';
import { Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { UserAvatar } from '@/components/ui/user-avatar';
import { toast } from '@/components/ui/toast';
import { StarRating } from './star-rating';
import { deleteReviewRequest } from '@/lib/api/profile';
import type { UserReview } from '@/lib/api/profile';

const fallbackColor = 'bg-gradient-to-br from-slate-400 to-slate-600';

interface ReviewListProps {
  userId: string;
  reviews: UserReview[];
  currentUserId: string;
  onDeleted: (reviewId: string) => void;
  className?: string;
}

export function ReviewList({ userId, reviews, currentUserId, onDeleted, className }: ReviewListProps) {
  const [deleting, setDeleting] = useState<string | null>(null);

  const handleDelete = async (reviewId: string) => {
    setDeleting(reviewId);
    try {
      await deleteReviewRequest(userId, reviewId);
      onDeleted(reviewId);
      toast.success('ลบรีวิวเรียบร้อย');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'ลบรีวิวไม่สำเร็จ');
    } finally {
      setDeleting(null);
    }
  };

  if (reviews.length === 0) {
    return (
      <p className={cn('py-8 text-center text-sm text-muted-foreground', className)}>
        ยังไม่มีรีวิว
      </p>
    );
  }

  return (
    <ul className={cn('space-y-3', className)}>
      {reviews.map((r) => {
        const isOwner = r.reviewer.id === currentUserId;
        const initial = (r.reviewer.firstName?.[0] ?? '?').toUpperCase();
        const name = `${r.reviewer.firstName} ${r.reviewer.lastName}`.trim();
        const date = new Date(r.createdAt).toLocaleDateString('th-TH', {
          day: 'numeric', month: 'short', year: 'numeric',
        });

        return (
          <li
            key={r.id}
            className="flex gap-3 rounded-xl border border-border bg-card/60 p-3"
          >
            <UserAvatar
              avatarUrl={r.reviewer.avatarUrl}
              initial={initial}
              color={fallbackColor}
              size="sm"
            />
            <div className="min-w-0 flex-1">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="text-sm font-medium text-foreground">{name}</p>
                  <div className="mt-0.5 flex items-center gap-2">
                    <StarRating value={r.rating} size="sm" />
                    <span className="text-xs text-muted-foreground">{date}</span>
                  </div>
                </div>
                {isOwner && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="size-7 shrink-0 text-muted-foreground hover:text-destructive"
                    onClick={() => handleDelete(r.id)}
                    disabled={deleting === r.id}
                    aria-label="ลบรีวิว"
                  >
                    <Trash2 className="size-3.5" />
                  </Button>
                )}
              </div>
              {r.comment && (
                <p className="mt-1.5 text-sm text-muted-foreground">{r.comment}</p>
              )}
            </div>
          </li>
        );
      })}
    </ul>
  );
}
