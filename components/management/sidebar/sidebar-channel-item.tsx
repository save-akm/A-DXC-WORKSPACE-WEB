'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
import { Hash } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ChannelItem } from '@/lib/management/types';
import { useSidebarUIStore } from '@/lib/stores/sidebar-ui-store';
import { useCollapsed } from './sidebar-context';
import { SidebarHoverPopover } from './sidebar-hover-popover';

interface SidebarChannelItemProps {
  channel: ChannelItem;
}

export function SidebarChannelItem({ channel }: SidebarChannelItemProps) {
  const pathname = usePathname();
  const collapsed = useCollapsed();
  const setMobileOpen = useSidebarUIStore((s) => s.setMobileOpen);
  const isActive = pathname === channel.href;

  return (
    <SidebarHoverPopover enabled={collapsed} label={`# ${channel.title}`}>
      <Link
        href={channel.href}
        onClick={() => setMobileOpen(false)}
        className={cn(
          'group/ch flex h-8 items-center gap-2 rounded-md px-2 text-sm transition-colors',
          isActive
            ? 'bg-gradient-to-r from-(--sidebar-menuactive-bg-from) via-(--sidebar-menuactive-bg-to) to-transparent font-medium text-foreground'
            : 'text-foreground/85 hover:bg-foreground/[0.08] hover:text-foreground',
        )}
      >
        <Hash
          className={cn(
            'size-4 shrink-0 transition-colors',
            isActive
              ? 'text-(--sidebar-menuactive-accent)'
              : 'text-foreground/70 group-hover/ch:text-foreground',
          )}
        />
        <motion.span
          animate={{ opacity: collapsed ? 0 : 1, width: collapsed ? 0 : 'auto' }}
          transition={{ duration: 0.18, ease: 'easeOut' }}
          className="min-w-0 flex-1 overflow-hidden truncate text-left"
        >
          {channel.title}
        </motion.span>
      </Link>
    </SidebarHoverPopover>
  );
}
