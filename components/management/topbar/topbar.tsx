'use client';

import { ThemeToggle } from '@/components/theme-toggle';
import { SidebarTrigger } from '@/components/management/sidebar/sidebar-trigger';
import { ThemePicker } from '@/components/management/theme-picker';
import { NotificationBell } from './notification-bell';
import { TopbarAvatars } from './topbar-avatars';
import { TopbarBreadcrumb } from './topbar-breadcrumb';
import { TopbarViewTabs } from './topbar-view-tabs';

export function Topbar() {
  return (
    <header className="relative z-40 flex h-14 shrink-0 items-center gap-2 border-b border-border/60 bg-background/60 px-3 backdrop-blur-sm sm:gap-3 sm:px-4 print:hidden">
      <SidebarTrigger />

      <div className="flex min-w-0 flex-1 items-center gap-3 sm:gap-6">
        <TopbarBreadcrumb />
        <div className="hidden sm:block">
          <TopbarViewTabs />
        </div>
      </div>

      <div className="flex items-center gap-2 sm:gap-3">
        <div className="hidden md:block">
          <TopbarAvatars />
        </div>

        <span className="mx-1 hidden h-5 w-px bg-border/60 md:block" aria-hidden />

        <NotificationBell />

        <ThemePicker />
        <ThemeToggle />
      </div>
    </header>
  );
}
