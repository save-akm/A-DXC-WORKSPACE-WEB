'use client';

import { useMenuStore } from '@/lib/stores/menu-store';
import { SidebarMenuGroup } from './sidebar-menu-group';
import { SidebarMenuItem } from './sidebar-menu-item';

export function SidebarMenus() {
  const menus = useMenuStore((s) => s.menus);

  if (menus.length === 0) return null;

  return (
    <div className="flex flex-col gap-4">
      {menus.map((node) =>
        node.type === 'GROUP' ? (
          <SidebarMenuGroup key={node.id} group={node} />
        ) : (
          <SidebarMenuItem key={node.id} node={node} />
        ),
      )}
    </div>
  );
}
