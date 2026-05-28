'use client';

import { useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { logoutAction } from '@/lib/auth/actions';
import { useAuthStore } from '@/lib/stores/auth-store';
import { useMenuStore } from '@/lib/stores/menu-store';
import { useMenuBadgesStore } from '@/lib/stores/menu-badges-store';
import { disconnectSocket, emitLogout } from '@/lib/socket/socket-client';

/**
 * Full logout sequence:
 *   1. Server action — revokes refresh token (best-effort) + clears the httpOnly refresh cookie
 *   2. Clear client-side persisted stores (auth, menus, badges) → also wipes their localStorage entries
 *   3. Navigate to /login
 */
export function useLogout() {
  const router = useRouter();

  return useCallback(async () => {
    const accessToken = useAuthStore.getState().accessToken;

    try {
      await logoutAction(accessToken);
    } catch {
      // best-effort: even if the server call fails, still clear client state
    }

    emitLogout();
    disconnectSocket();
    useAuthStore.getState().clear();
    useMenuStore.getState().clear();
    useMenuBadgesStore.getState().clear();

    router.replace('/login');
  }, [router]);
}
