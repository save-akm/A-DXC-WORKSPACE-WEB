'use client';

import { useCallback, useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { StarRating } from './star-rating';
import { ReviewForm } from './review-form';
import { ReviewList } from './review-list';
import { fetchReviewsRequest } from '@/lib/api/profile';
import type { UserReview, ReviewsPage } from '@/lib/api/profile';

const PAGE_SIZE = 10;

interface ReviewSectionProps {
  targetUserId: string;
  currentUserId: string;
  isOwn: boolean;
  onStatsChange?: (average: number | null, total: number) => void;
}

export function ReviewSection({
  targetUserId,
  currentUserId,
  isOwn,
  onStatsChange,
}: ReviewSectionProps) {
  const [page, setPage] = useState<ReviewsPage | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetchReviewsRequest(targetUserId, 1, PAGE_SIZE);
      setPage(res);
      onStatsChange?.(res.average, res.total);
    } finally {
      setLoading(false);
    }
  }, [targetUserId, onStatsChange]);

  useEffect(() => { void load() }, [load]);

  const handleCreated = (review: UserReview) => {
    setPage((prev) => {
      if (!prev) return prev;
      const data = [review, ...prev.data];
      const total = prev.total + 1;
      const average = data.reduce((s, r) => s + r.rating, 0) / total;
      onStatsChange?.(average, total);
      return { ...prev, data, total, average };
    });
  };

  const handleDeleted = (reviewId: string) => {
    setPage((prev) => {
      if (!prev) return prev;
      const data = prev.data.filter((r) => r.id !== reviewId);
      const total = prev.total - 1;
      const average = total > 0 ? data.reduce((s, r) => s + r.rating, 0) / total : null;
      onStatsChange?.(average, total);
      return { ...prev, data, total, average };
    });
  };

  return (
    <section className="space-y-4">
      {/* Summary header */}
      {page && page.total > 0 && (
        <div className="flex items-center gap-3 rounded-xl border border-border bg-card/60 px-4 py-3">
          <StarRating value={page.average ?? 0} size="md" />
          <div>
            <span className="text-sm font-semibold text-foreground">
              {page.average?.toFixed(1)}
            </span>
            <span className="ml-1.5 text-xs text-muted-foreground">
              จาก {page.total} รีวิว
            </span>
          </div>
        </div>
      )}

      {/* Write review — hidden on own profile */}
      {!isOwn && (
        <ReviewForm targetUserId={targetUserId} onCreated={handleCreated} />
      )}

      {/* List */}
      {loading ? (
        <div className="flex justify-center py-8">
          <Loader2 className="size-5 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <ReviewList
          userId={targetUserId}
          reviews={page?.data ?? []}
          currentUserId={currentUserId}
          onDeleted={handleDeleted}
        />
      )}
    </section>
  );
}
