'use client';

import Link from 'next/link';
import { motion, useReducedMotion } from 'framer-motion';
import { Star, Users } from 'lucide-react';
import { UserAvatar } from '@/components/ui/user-avatar';
import { cn } from '@/lib/utils';
import {
  avatarColor,
  conversationTime,
  displayInitial,
  formatUnread,
} from '@/lib/chat/meta';
import type { Conversation } from '@/lib/chat/types';
import { useAuthStore } from '@/lib/stores/auth-store';
import { useOnlineStore } from '@/lib/stores/online-store';

interface ConversationListItemProps {
  conversation: Conversation;
  active: boolean;
  index: number;
  onStar?: () => void;
}

export function ConversationListItem({ conversation, active, index, onStar }: ConversationListItemProps) {
  const reduce = useReducedMotion();
  const myId = useAuthStore((s) => s.user?.id);
  const onlineIds = useOnlineStore((s) => s.onlineIds);
  const {
    id,
    displayName,
    displayAvatar,
    type,
    lastMessagePreview,
    lastMessageAt,
    updatedAt,
    unreadCount,
    members,
    isStarred,
  } = conversation;

  const isOnline =
    type === 'DIRECT' &&
    members.some((m) => m.userId !== myId && onlineIds.has(m.userId));

  const hasUnread = unreadCount > 0;
  const timeLabel = conversationTime(lastMessageAt ?? updatedAt);

  return (
    <motion.li
      initial={reduce ? false : { opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.2, delay: Math.min(index * 0.03, 0.24), ease: [0.4, 0, 0.2, 1] }}
    >
      <Link
        href={`/inbox/${id}`}
        className={cn(
          'group relative flex items-start gap-3 rounded-xl px-3 py-2.5 transition-colors duration-150',
          active
            ? 'bg-brand-muted/80 ring-1 ring-brand/15'
            : 'hover:bg-accent/50',
          hasUnread && !active && 'bg-primary/[0.04] hover:bg-primary/[0.07]',
        )}
      >
        {active && !reduce ? (
          <motion.span
            layoutId="inbox-active-rail"
            className="absolute bottom-2 left-0 top-2 w-0.5 rounded-full bg-linear-to-b from-violet-500 to-fuchsia-500"
            transition={{ type: 'spring', stiffness: 420, damping: 34 }}
          />
        ) : active ? (
          <span className="absolute bottom-2 left-0 top-2 w-0.5 rounded-full bg-linear-to-b from-violet-500 to-fuchsia-500" />
        ) : null}

        <span className="relative shrink-0 pl-0.5">
          <UserAvatar
            avatarUrl={displayAvatar}
            initial={displayInitial(displayName)}
            color={avatarColor(id)}
            size="md"
            alt={displayName}
          />
          {type === 'GROUP' ? (
            <span
              className="absolute -bottom-0.5 -right-0.5 flex size-4 items-center justify-center rounded-full bg-card text-muted-foreground shadow-sm ring-2 ring-background"
              aria-hidden
            >
              <Users className="size-2.5" />
            </span>
          ) : isOnline ? (
            <motion.span
              aria-label="ออนไลน์"
              className="absolute -right-0 -top-0 size-2 rounded-full bg-emerald-400 shadow-[0_0_5px_rgba(52,211,153,0.8)]"
              animate={{ scale: [1, 1.3, 1] }}
              transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
            />
          ) : null}
        </span>

        <span className="min-w-0 flex-1">
          <span className="flex items-center justify-between gap-2">
            <span
              className={cn(
                'truncate text-sm',
                hasUnread ? 'font-semibold text-foreground' : 'font-medium text-foreground/90',
              )}
            >
              {displayName}
            </span>
            <span className="flex shrink-0 items-center gap-1">
              {onStar ? (
                <button
                  type="button"
                  aria-label={isStarred ? 'ยกเลิกติดดาว' : 'ติดดาว'}
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    onStar();
                  }}
                  className={cn(
                    'cursor-pointer rounded p-0.5 transition-opacity hover:opacity-100',
                    isStarred ? 'opacity-100' : 'opacity-0 group-hover:opacity-70',
                  )}
                >
                  <Star
                    className={cn(
                      'size-4',
                      isStarred
                        ? 'fill-amber-400 text-amber-400'
                        : 'text-muted-foreground',
                    )}
                  />
                </button>
              ) : null}
              {timeLabel ? (
                <span
                  className={cn(
                    'text-[11px] tabular-nums',
                    hasUnread ? 'font-medium text-brand' : 'text-muted-foreground',
                  )}
                >
                  {timeLabel}
                </span>
              ) : null}
            </span>
          </span>

          <span className="mt-0.5 flex items-center justify-between gap-2">
            <span
              className={cn(
                'truncate text-xs',
                hasUnread ? 'font-medium text-foreground/75' : 'text-muted-foreground',
              )}
            >
              {lastMessagePreview ?? 'ยังไม่มีข้อความ'}
            </span>
            {hasUnread ? (
              <span
                className="flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full bg-linear-to-r from-violet-500 to-fuchsia-500 px-1.5 text-[10px] font-semibold tabular-nums text-white shadow-sm"
                aria-label={`${unreadCount} ข้อความที่ยังไม่อ่าน`}
              >
                {formatUnread(unreadCount)}
              </span>
            ) : null}
          </span>
        </span>
      </Link>
    </motion.li>
  );
}
