'use client';

import { useMemo } from 'react';
import { useMenuStore } from '@/lib/stores/menu-store';
import type { MenuNode, MenuPermission } from '@/lib/auth/types';

function findNode(nodes: MenuNode[], code: string): MenuNode | undefined {
  for (const node of nodes) {
    if (node.code === code) return node;
    const found = findNode(node.children, code);
    if (found) return found;
  }
}

export function useMenuPermission(code: string) {
  const menus = useMenuStore((s) => s.menus);

  return useMemo(() => {
    const node = findNode(menus, code);
    const permissions = node?.permissions ?? [];

    return {
      permissions,
      can: (action: MenuPermission) => permissions.includes(action),
    };
  }, [menus, code]);
}
