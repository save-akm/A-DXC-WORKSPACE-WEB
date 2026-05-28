'use client';

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { AuthUser } from '@/lib/auth/types';

export type AuthStatus = 'idle' | 'loading' | 'authenticated' | 'unauthenticated';

interface AuthState {
  user: AuthUser | null;
  // Access token is held in memory only — never persisted. On reload it is
  // repopulated by AuthProvider via the refresh server action (which reads
  // the httpOnly refresh cookie).
  accessToken: string | null;
  expiresAt: number | null;
  status: AuthStatus;
  setSession: (s: { user: AuthUser; accessToken: string; expiresAt: number }) => void;
  setTokens: (t: { accessToken: string; expiresAt: number }) => void;
  setUser: (user: AuthUser) => void;
  setStatus: (status: AuthStatus) => void;
  clear: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      accessToken: null,
      expiresAt: null,
      status: 'idle',
      setSession: ({ user, accessToken, expiresAt }) =>
        set({ user, accessToken, expiresAt, status: 'authenticated' }),
      setTokens: ({ accessToken, expiresAt }) => set({ accessToken, expiresAt }),
      setUser: (user) => set({ user }),
      setStatus: (status) => set({ status }),
      clear: () =>
        set({ user: null, accessToken: null, expiresAt: null, status: 'unauthenticated' }),
    }),
    {
      name: 'a-dxc-auth',
      storage: createJSONStorage(() => localStorage),
      // Persist the user profile + expiresAt only. Access token is memory-only;
      // refresh token lives in an httpOnly cookie set by the server action.
      partialize: (s) => ({ user: s.user, expiresAt: s.expiresAt }),
    },
  ),
);
