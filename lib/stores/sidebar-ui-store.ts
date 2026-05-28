'use client';

import { create } from 'zustand';
import {
  SIDEBAR_COOKIE_MAX_AGE,
  SIDEBAR_COOKIE_NAME,
  serializeCollapsed,
} from '@/lib/management/sidebar-cookie';

const writeCollapsedCookie = (collapsed: boolean) => {
  if (typeof document === 'undefined') return;
  document.cookie = `${SIDEBAR_COOKIE_NAME}=${serializeCollapsed(collapsed)}; path=/; max-age=${SIDEBAR_COOKIE_MAX_AGE}; SameSite=Lax`;
};

interface SidebarUIState {
  collapsed: boolean;
  isMobileOpen: boolean;
  expandedSections: Record<string, boolean>;
  expandedItems: Record<string, boolean>;
  setCollapsed: (v: boolean) => void;
  toggleCollapsed: () => void;
  setMobileOpen: (v: boolean) => void;
  toggleSection: (id: string) => void;
  toggleItem: (id: string) => void;
}

export const useSidebarUIStore = create<SidebarUIState>((set, get) => ({
  collapsed: false,
  isMobileOpen: false,
  expandedSections: { projects: true, channels: true },
  expandedItems: {},
  setCollapsed: (collapsed) => {
    writeCollapsedCookie(collapsed);
    set({ collapsed });
  },
  toggleCollapsed: () => {
    const next = !get().collapsed;
    writeCollapsedCookie(next);
    set({ collapsed: next });
  },
  setMobileOpen: (isMobileOpen) => set({ isMobileOpen }),
  toggleSection: (id) =>
    set((s) => ({
      expandedSections: {
        ...s.expandedSections,
        [id]: s.expandedSections[id] === undefined ? false : !s.expandedSections[id],
      },
    })),
  toggleItem: (id) =>
    set((s) => ({
      expandedItems: { ...s.expandedItems, [id]: !s.expandedItems[id] },
    })),
}));
