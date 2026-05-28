'use client';

import { create } from 'zustand';

interface LoginUIState {
  isLoginActive: boolean;
  setLoginActive: (active: boolean) => void;
}

export const useLoginUIStore = create<LoginUIState>((set) => ({
  isLoginActive: false,
  setLoginActive: (isLoginActive) => set({ isLoginActive }),
}));
