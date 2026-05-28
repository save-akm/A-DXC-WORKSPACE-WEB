'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

export type UserAvatarSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

interface UserAvatarProps {
  avatarUrl?: string | null;
  initial: string;
  color: string;
  size?: UserAvatarSize;
  showStatus?: boolean;
  statusRingClass?: string;
  className?: string;
  alt?: string;
}

const sizeMap: Record<UserAvatarSize, { box: string; text: string; dot: string; dotInner: string }> = {
  xs: { box: 'size-6', text: 'text-xs', dot: 'size-2', dotInner: 'size-1.5' },
  sm: { box: 'size-8', text: 'text-sm', dot: 'size-2.5', dotInner: 'size-2' },
  md: { box: 'size-10', text: 'text-base', dot: 'size-2.5', dotInner: 'size-2' },
  lg: { box: 'size-16', text: 'text-xl', dot: 'size-3', dotInner: 'size-2.5' },
  xl: { box: 'size-24', text: 'text-3xl', dot: 'size-4', dotInner: 'size-3' },
};

export function UserAvatar({
  avatarUrl,
  initial,
  color,
  size = 'sm',
  showStatus = false,
  statusRingClass = 'bg-sidebar',
  className,
  alt,
}: UserAvatarProps) {
  const [errored, setErrored] = useState(false);
  const s = sizeMap[size];

  useEffect(() => {
    setErrored(false);
  }, [avatarUrl]);

  const showImage = avatarUrl && !errored;

  return (
    <span className={cn('relative shrink-0', className)}>
      <span
        className={cn(
          'flex items-center justify-center overflow-hidden rounded-full font-semibold text-white shadow-sm',
          s.box,
          s.text,
          showImage ? 'bg-muted' : color,
        )}
      >
        {showImage ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={avatarUrl}
            alt={alt ?? initial}
            className="h-full w-full object-cover"
            onError={() => setErrored(true)}
            draggable={false}
          />
        ) : (
          <span>{initial.toUpperCase()}</span>
        )}
      </span>
      {showStatus ? (
        <span
          aria-label="Online"
          className={cn(
            'absolute -bottom-0.5 -right-0.5 flex items-center justify-center rounded-full',
            s.dot,
            statusRingClass,
          )}
        >
          <motion.span
            className={cn(
              'rounded-full bg-emerald-400 shadow-[0_0_4px_rgba(52,211,153,0.8)]',
              s.dotInner,
            )}
            animate={{ scale: [1, 1.25, 1] }}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
          />
        </span>
      ) : null}
    </span>
  );
}
