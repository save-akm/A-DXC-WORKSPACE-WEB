'use client';

import { create } from 'zustand';

export type BadgeValue = number | string;

interface MenuBadgesState {
  badges: Record<string, BadgeValue>;
  /** Timestamp of last increase per code — used to trigger pop animation. */
  increasedAt: Record<string, number>;
  setBadge: (code: string, value: BadgeValue | null) => void;
  setBadges: (badges: Record<string, BadgeValue>) => void;
  clear: () => void;
}

// MOCK — wire socket.io later by calling setBadge(code, value) from listeners.
// Keys must match the menu node `code` from /menus/my API response.
const initialBadges: Record<string, BadgeValue> = {
  inbox: 12,
  myissues: 3,
  projects: 8,
  project_survey: 2,
};

export const useMenuBadgesStore = create<MenuBadgesState>((set) => ({
  badges: initialBadges,
  increasedAt: {},
  setBadge: (code, value) =>
    set((s) => {
      const prev = s.badges[code];
      const nextBadges = { ...s.badges };
      if (value === null) {
        delete nextBadges[code];
        return { badges: nextBadges };
      }
      nextBadges[code] = value;
      if (typeof prev === 'number' && typeof value === 'number' && value > prev) {
        return {
          badges: nextBadges,
          increasedAt: { ...s.increasedAt, [code]: Date.now() },
        };
      }
      return { badges: nextBadges };
    }),
  setBadges: (badges) => set({ badges }),
  clear: () => set({ badges: {}, increasedAt: {} }),
}));
