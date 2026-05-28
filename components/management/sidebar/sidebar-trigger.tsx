'use client';

import { Menu, PanelLeft } from 'lucide-react';
import { useSidebarUIStore } from '@/lib/stores/sidebar-ui-store';

export function SidebarTrigger() {
  const toggleCollapsed = useSidebarUIStore((s) => s.toggleCollapsed);
  const collapsed = useSidebarUIStore((s) => s.collapsed);
  const isMobileOpen = useSidebarUIStore((s) => s.isMobileOpen);
  const setMobileOpen = useSidebarUIStore((s) => s.setMobileOpen);

  return (
    <>
      <button
        type="button"
        onClick={() => setMobileOpen(!isMobileOpen)}
        aria-label={isMobileOpen ? 'Close menu' : 'Open menu'}
        aria-expanded={isMobileOpen}
        className="inline-flex size-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent/50 hover:text-foreground md:hidden"
      >
        <Menu className="size-4" />
      </button>

      <button
        type="button"
        onClick={toggleCollapsed}
        aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        aria-pressed={collapsed}
        className="hidden size-8 cursor-pointer items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent/50 hover:text-foreground md:inline-flex"
      >
        <PanelLeft className="size-4" />
      </button>
    </>
  );
}
