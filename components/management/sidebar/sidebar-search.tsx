'use client';

import { Search } from 'lucide-react';
import { useCollapsed } from './sidebar-context';
import { SidebarHoverPopover } from './sidebar-hover-popover';

export function SidebarSearch() {
  const collapsed = useCollapsed();

  return (
    <SidebarHoverPopover enabled={collapsed} label="Search">
      {collapsed ? (
        <button
          type="button"
          aria-label="Search"
          className="flex size-10 cursor-pointer items-center justify-center rounded-md border border-border/60 bg-card/40 text-muted-foreground transition-colors hover:bg-card/80 hover:text-foreground"
        >
          <Search className="size-4" />
        </button>
      ) : (
        <div className="relative">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="search"
            name="sidebar-search"
            aria-label="Search navigation"
            placeholder="Search..."
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="off"
            spellCheck={false}
            data-form-type="other"
            data-1p-ignore
            data-lpignore="true"
            data-bwignore
            className="h-8 w-full rounded-md border border-border/60 bg-card/40 pl-8 pr-10 text-sm text-foreground placeholder:text-muted-foreground focus:border-ring focus:bg-card/80 focus:outline-none focus:ring-1 focus:ring-ring/60 [&::-webkit-search-cancel-button]:appearance-none"
          />
          <kbd className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 rounded border border-border/60 bg-background/60 px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
            ⌘K
          </kbd>
        </div>
      )}
    </SidebarHoverPopover>
  );
}
