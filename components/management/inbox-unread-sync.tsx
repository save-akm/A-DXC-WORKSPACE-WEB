'use client';

import { useCallback, useEffect, useMemo } from 'react';
import { fetchUnreadCount } from '@/lib/api/conversations';
import { useSocketEvent } from '@/components/socket/SocketProvider';
import { useMenuBadgesStore } from '@/lib/stores/menu-badges-store';
import { useAuthStore } from '@/lib/stores/auth-store';
import { useMenuStore } from '@/lib/stores/menu-store';
import type { MenuNode } from '@/lib/auth/types';

function findCodeByPath(nodes: MenuNode[], path: string): string | null {
  for (const node of nodes) {
    if (node.path === path) return node.code;
    const found = findCodeByPath(node.children, path);
    if (found) return found;
  }
  return null;
}

export function InboxUnreadSync() {
  const status = useAuthStore((s) => s.status);
  const setBadge = useMenuBadgesStore((s) => s.setBadge);
  const menus = useMenuStore((s) => s.menus);

  // Resolve the real menu code from the persisted menu tree instead of hardcoding 'inbox'
  const inboxCode = useMemo(
    () => findCodeByPath(menus, '/inbox') ?? 'inbox',
    [menus],
  );

  const applyCount = useCallback(
    (total: number) => {
      if (total > 0) setBadge(inboxCode, total);
      else setBadge(inboxCode, null);
    },
    [setBadge, inboxCode],
  );

  const refresh = useCallback(() => {
    fetchUnreadCount().then(applyCount).catch(() => {});
  }, [applyCount]);

  useEffect(() => {
    if (status !== 'authenticated') return;
    refresh();
  }, [status, refresh]);

  // Primary: backend emits this when unread count changes (mark-as-read path)
  const handleUnreadTotal = useCallback(
    (...args: unknown[]) => {
      const evt = args[0] as { totalUnread: number };
      applyCount(evt?.totalUnread ?? 0);
    },
    [applyCount],
  );

  // Fallback: backend emits notification:new to user:{id} room for each CHAT_MESSAGE —
  // re-fetch the count so the badge increases in real-time even when not in the inbox page
  const handleNotificationNew = useCallback(
    (...args: unknown[]) => {
      const evt = args[0] as { type?: string };
      if (evt?.type === 'CHAT_MESSAGE' || evt?.type === 'CHAT_MENTION') refresh();
    },
    [refresh],
  );

  useSocketEvent('chat:unread-total', handleUnreadTotal, [handleUnreadTotal]);
  useSocketEvent('notification:new', handleNotificationNew, [handleNotificationNew]);

  return null;
}
