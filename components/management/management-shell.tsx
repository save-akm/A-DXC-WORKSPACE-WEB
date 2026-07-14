'use client';

import { useState, type ReactNode } from 'react';
import { useSidebarUIStore } from '@/lib/stores/sidebar-ui-store';
import { AppAnnouncementBanner } from '@/components/announcements/app-banner';
import { RealtimeBadgesProvider } from '@/components/providers/real-time-badges-provider';
import { SocketProvider } from '@/components/providers/socket-provider';
import { InboxUnreadSync } from './inbox-unread-sync';
import { OnlineSync } from './online-sync';
import { PageTransition } from './page-transition';
import { ShortcutsPanel } from './shortcuts-panel';
import { Sidebar } from './sidebar/sidebar';
import { Topbar } from './topbar/topbar';

interface ManagementShellProps {
  initialCollapsed: boolean;
  children: ReactNode;
}

export function ManagementShell({ initialCollapsed, children }: ManagementShellProps) {
  useState(() => {
    useSidebarUIStore.setState({ collapsed: initialCollapsed });
    return true;
  });

  return (
    <SocketProvider>
      <RealtimeBadgesProvider>
        <div className="flex h-svh w-full overflow-hidden text-foreground" style={{ background: 'var(--background)' }}>
        <InboxUnreadSync />
        <OnlineSync />
        <Sidebar />
        <div className="flex min-w-0 flex-1 flex-col">
          <AppAnnouncementBanner />
          <Topbar />
          <main className="flex-1 overflow-x-hidden overflow-y-auto" style={{ scrollbarGutter: 'stable' }}>
            <PageTransition>{children}</PageTransition>
          </main>
        </div>
        <ShortcutsPanel />
        </div>
      </RealtimeBadgesProvider>
    </SocketProvider>
  );
}
