'use client';

import type { ReactNode } from 'react';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { ConversationSidebar } from './conversation-sidebar';

function isConversationRoute(pathname: string): boolean {
  return /^\/inbox\/(?!join)[^/]+$/.test(pathname);
}

export function InboxShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const inConversation = isConversationRoute(pathname);

  return (
    <div className="flex h-[calc(100svh-3.5rem)] min-h-0 overflow-hidden bg-background">
      <div
        className={cn(
          'shrink-0 transition-[width] duration-200',
          inConversation ? 'hidden w-0 md:block md:w-auto' : 'block w-full md:w-auto',
        )}
      >
        <ConversationSidebar />
      </div>
      <div
        className={cn(
          'relative min-w-0 flex-1 overflow-hidden',
          !inConversation && 'hidden md:block',
        )}
      >
        {children}
      </div>
    </div>
  );
}
