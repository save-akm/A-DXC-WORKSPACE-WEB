'use client';

import { useState } from 'react';
import { Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';

import { toast } from '@/components/ui/toast';
import { StarRating } from './star-rating';
import { createReviewRequest } from '@/lib/api/profile';
import type { UserReview } from '@/lib/api/profile';

interface ReviewFormProps {
  targetUserId: string;
  onCreated: (review: UserReview) => void;
}

export function ReviewForm({ targetUserId, onCreated }: ReviewFormProps) {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const canSubmit = rating > 0 && !submitting;

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setSubmitting(true);
    try {
      const review = await createReviewRequest(targetUserId, {
        rating,
        comment: comment.trim() || undefined,
      });
      onCreated(review);
      setRating(0);
      setComment('');
      toast.success('ส่งรีวิวเรียบร้อย');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'ส่งรีวิวไม่สำเร็จ');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={(e) => { e.preventDefault(); void handleSubmit(); }} className="space-y-3 rounded-xl border border-border bg-muted/30 p-4">
      <p className="text-sm font-semibold text-foreground">เขียนรีวิว</p>

      <div className="flex items-center gap-2">
        <StarRating value={rating} onChange={setRating} size="lg" />
        {rating > 0 && (
          <span className="text-sm text-muted-foreground">
            {['', 'แย่', 'พอใช้', 'ดี', 'ดีมาก', 'ยอดเยี่ยม'][rating]}
          </span>
        )}
      </div>

      <Textarea
        placeholder="ความคิดเห็นของคุณ (ไม่บังคับ)"
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        rows={3}
        className="resize-none text-sm"
        maxLength={500}
      />

      <div className="flex items-center justify-between">
        <span className="text-xs text-muted-foreground">{comment.length}/500</span>
        <Button type="submit" size="sm" disabled={!canSubmit} variant="save">
          <Send className="size-3.5" />
          ส่งรีวิว
        </Button>
      </div>
    </form>
  );
}
