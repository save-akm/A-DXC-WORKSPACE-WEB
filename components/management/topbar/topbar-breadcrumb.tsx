'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Hash } from 'lucide-react';
import { channels, projects } from '@/lib/management/nav-config';
import { useMenuStore } from '@/lib/stores/menu-store';
import type { MenuNode } from '@/lib/auth/types';

function findMenuTrail(
  menus: MenuNode[],
  pathname: string,
  ancestors: MenuNode[] = [],
): MenuNode[] | null {
  for (const node of menus) {
    const trail = [...ancestors, node];
    if (node.path && (pathname === node.path || pathname.startsWith(node.path + '/'))) {
      return trail;
    }
    if (node.children.length > 0) {
      const found = findMenuTrail(node.children, pathname, trail);
      if (found) return found;
    }
  }
  return null;
}

export function TopbarBreadcrumb() {
  const pathname = usePathname();
  const menus = useMenuStore((s) => s.menus);

  // Project pages
  const activeProject = projects.find(
    (p) => pathname === p.href || pathname?.startsWith(p.href + '/'),
  );
  if (activeProject) {
    return (
      <div className="flex min-w-0 items-center gap-2 text-sm">
        <span className={`inline-block size-2 shrink-0 rounded-full ${activeProject.color}`} aria-hidden />
        <div className="hidden items-center gap-2 sm:flex">
          <Link href="/projects" className="text-muted-foreground transition-colors hover:text-foreground">
            Projects
          </Link>
          <span className="text-muted-foreground/40">/</span>
        </div>
        <button type="button" className="group/bc inline-flex min-w-0 items-center rounded-md px-1.5 py-1 font-medium text-foreground transition-colors hover:bg-accent/40">
          <span className="truncate">{activeProject.title}</span>
        </button>
      </div>
    );
  }

  // Channel pages
  const activeChannel = channels.find(
    (c) => pathname === c.href || pathname?.startsWith(c.href + '/'),
  );
  if (activeChannel) {
    return (
      <div className="flex min-w-0 items-center gap-2 text-sm">
        <Hash className="size-3.5 shrink-0 text-muted-foreground/60" />
        <div className="hidden items-center gap-2 sm:flex">
          <span className="text-muted-foreground">Channels</span>
          <span className="text-muted-foreground/40">/</span>
        </div>
        <button type="button" className="group/bc inline-flex min-w-0 items-center rounded-md px-1.5 py-1 font-medium text-foreground transition-colors hover:bg-accent/40">
          <span className="truncate">{activeChannel.title}</span>
        </button>
      </div>
    );
  }

  // API menu nodes
  const trail = pathname ? findMenuTrail(menus, pathname) : null;
  if (trail && trail.length > 0) {
    const current = trail[trail.length - 1];
    return (
      <div className="flex min-w-0 items-center gap-2 text-sm">
        <span className="inline-block size-2 shrink-0 rounded-full bg-muted-foreground/30" aria-hidden />
        <button type="button" className="group/bc inline-flex min-w-0 items-center rounded-md px-1.5 py-1 font-medium text-foreground transition-colors hover:bg-accent/40">
          <span className="truncate">{current.name}</span>
        </button>
      </div>
    );
  }

  return null;
}
