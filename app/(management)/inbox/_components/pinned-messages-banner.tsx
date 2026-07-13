'use client';

import { ChevronDown, Pin, X } from 'lucide-react';
import { useState } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import type { Message } from '@/lib/chat/types';

interface PinnedMessagesBannerProps {
  pinned: Message[];
  onScrollTo: (messageId: string) => void;
  onUnpin: (message: Message) => void;
  canUnpin: boolean;
}

export function PinnedMessagesBanner({
  pinned,
  onScrollTo,
  onUnpin,
  canUnpin,
}: PinnedMessagesBannerProps) {
  const [expanded, setExpanded] = useState(false);

  if (pinned.length === 0) return null;

  const visible = expanded ? pinned : pinned.slice(0, 1);

  return (
    <div className="relative z-10 shrink-0 border-b border-amber-500/20 bg-amber-500/5 px-3 py-2">
      <div className="flex items-center gap-2">
        <Pin className="size-3.5 shrink-0 text-amber-600" />
        <span className="text-xs font-medium text-amber-700 dark:text-amber-400">
          ปักหมุด {pinned.length} รายการ
        </span>
        {pinned.length > 1 ? (
          <Button
            variant="ghost"
            size="sm"
            className="ml-auto h-6 px-2 text-xs"
            onClick={() => setExpanded((v) => !v)}
          >
            {expanded ? 'ย่อ' : 'ดูทั้งหมด'}
            <ChevronDown className={cn('size-3 transition-transform', expanded && 'rotate-180')} />
          </Button>
        ) : null}
      </div>

      <ul className="mt-1.5 space-y-1">
        {visible.map((msg) => (
          <li key={msg.id} className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => onScrollTo(msg.id)}
              className="min-w-0 flex-1 cursor-pointer truncate rounded-md px-2 py-1 text-left text-xs text-foreground/80 hover:bg-amber-500/10"
            >
              {msg.content ?? '[ข้อความ]'}
            </button>
            {canUnpin ? (
              <Button
                variant="ghost"
                size="icon-xs"
                onClick={() => onUnpin(msg)}
                aria-label="ยกเลิกปักหมุด"
              >
                <X className="size-3" />
              </Button>
            ) : null}
          </li>
        ))}
      </ul>
    </div>
  );
}
