'use client';

import { useState } from 'react';
import { Star } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StarRatingProps {
  value: number;
  onChange?: (v: number) => void;
  max?: number;
  size?: 'sm' | 'base' | 'md' | 'lg';
  className?: string;
}

const sizeMap = {
  sm: 'size-3.5',
  base: 'size-4',
  md: 'size-5',
  lg: 'size-6',
};

export function StarRating({
  value,
  onChange,
  max = 5,
  size = 'md',
  className,
}: StarRatingProps) {
  const [hovered, setHovered] = useState<number | null>(null);
  const interactive = !!onChange;
  const display = hovered ?? value;

  return (
    <span
      className={cn('inline-flex items-center gap-0.5', className)}
      onMouseLeave={() => interactive && setHovered(null)}
    >
      {Array.from({ length: max }, (_, i) => {
        const filled = display >= i + 1;
        const half = !filled && display >= i + 0.5;
        return (
          <button
            key={i}
            type="button"
            disabled={!interactive}
            onClick={() => onChange?.(i + 1)}
            onMouseEnter={() => interactive && setHovered(i + 1)}
            className={cn(
              'transition-transform',
              interactive && 'cursor-pointer hover:scale-110',
              !interactive && 'cursor-default',
            )}
            aria-label={`${i + 1} ดาว`}
          >
            <Star
              className={cn(
                sizeMap[size],
                'transition-colors',
                filled
                  ? 'fill-amber-400 text-amber-400'
                  : half
                    ? 'fill-amber-400/50 text-amber-400'
                    : 'fill-muted text-muted-foreground/30',
              )}
            />
          </button>
        );
      })}
    </span>
  );
}
