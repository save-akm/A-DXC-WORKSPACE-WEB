'use client';

import { channels, projects } from '@/lib/management/nav-config';
import { SidebarChannelItem } from './sidebar-channel-item';
import { SidebarMenus } from './sidebar-menus';
import { SidebarProfile } from './sidebar-profile';
import { SidebarProjectItem } from './sidebar-project-item';
import { SidebarSearch } from './sidebar-search';
import { SidebarSection } from './sidebar-section';
import { SidebarWorkspace2 } from './sidebar-workspace2';

export function SidebarContent() {
  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex flex-col gap-3 p-3">
        <SidebarWorkspace2 />
        <SidebarSearch />
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-2 pb-4">
        <div className="flex flex-col gap-4">
          <SidebarMenus />

          <SidebarSection id="projects" title="Projects" onAdd={() => {}}>
            {projects.map((p) => (
              <SidebarProjectItem key={p.id} project={p} />
            ))}
          </SidebarSection>

          <SidebarSection id="channels" title="Channels">
            {channels.map((c) => (
              <SidebarChannelItem key={c.id} channel={c} />
            ))}
          </SidebarSection>
        </div>
      </div>

      <SidebarProfile />
    </div>
  );
}
