'use client';

import { useMenuStore } from '@/lib/stores/menu-store';
import type { MenuNode, MenuPermission } from '@/lib/auth/types';

function findByCode(nodes: MenuNode[], code: string): MenuNode | undefined {
  for (const node of nodes) {
    if (node.code === code) return node;
    const found = findByCode(node.children, code);
    if (found) return found;
  }
}

export function useMenuPermission(code: string) {
  const menus = useMenuStore((s) => s.menus);
  const node = findByCode(menus, code);
  const permissions: MenuPermission[] = node?.permissions ?? [];

  return {
    canView:   permissions.includes('VIEW'),
    canCreate: permissions.includes('CREATE'),
    canUpdate: permissions.includes('UPDATE'),
    canDelete: permissions.includes('DELETE'),
    canExport: permissions.includes('EXPORT'),
  };
}
