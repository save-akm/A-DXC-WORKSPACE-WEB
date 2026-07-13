'use client';

import { create } from 'zustand';

interface OnlineState {
  onlineIds: Set<string>;
  setOnline: (id: string) => void;
  setOffline: (id: string) => void;
  setMany: (ids: string[]) => void;
}

export const useOnlineStore = create<OnlineState>((set) => ({
  onlineIds: new Set<string>(),
  setOnline: (id) =>
    set((s) => ({ onlineIds: new Set([...s.onlineIds, id]) })),
  setOffline: (id) =>
    set((s) => {
      const next = new Set(s.onlineIds);
      next.delete(id);
      return { onlineIds: next };
    }),
  setMany: (ids) => set({ onlineIds: new Set(ids) }),
}));
