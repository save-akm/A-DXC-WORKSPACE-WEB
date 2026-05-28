'use client';

import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import type { MenuNode } from '@/lib/auth/types';

interface MenuState {
  menus: MenuNode[];
  setMenus: (menus: MenuNode[]) => void;
  clear: () => void;
}

export const useMenuStore = create<MenuState>()(
  persist(
    (set) => ({
      menus: [],
      setMenus: (menus) => set({ menus }),
      clear: () => set({ menus: [] }),
    }),
    {
      name: 'a-dxc-menus',
      storage: createJSONStorage(() => localStorage),
    },
  ),
);
