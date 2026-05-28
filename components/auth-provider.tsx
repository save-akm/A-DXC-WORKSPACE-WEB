'use client';

import { useEffect, useRef } from 'react';
import { useAuthStore } from '@/lib/stores/auth-store';
import { useMenuStore } from '@/lib/stores/menu-store';
import { useMenuBadgesStore } from '@/lib/stores/menu-badges-store';
import { disconnectSocket, emitLogout } from '@/lib/socket/socket-client';
import { meAction, menuAction, refreshAction } from '@/lib/auth/actions';
import { authConfig } from '@/lib/auth/config';

/**
 * Auth lifecycle:
 *   1. On mount, if there's a persisted user but no in-memory access token,
 *      call refreshAction (reads httpOnly refresh cookie) to repopulate it.
 *   2. Schedule a single setTimeout to refresh `refreshLeadMs` before expiry.
 *   3. Single-flight guard prevents concurrent refresh calls.
 *   4. On focus / online events, eagerly refresh if the token is past lead.
 *
 * The access token is never persisted — only the refresh token (httpOnly cookie)
 * survives a reload. That cookie is used to re-issue an access token silently.
 */
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const user = useAuthStore((s) => s.user);
  const accessToken = useAuthStore((s) => s.accessToken);
  const expiresAt = useAuthStore((s) => s.expiresAt);

  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const inFlightRef = useRef<Promise<boolean> | null>(null);

  const doRefresh = (): Promise<boolean> => {
    if (inFlightRef.current) return inFlightRef.current;
    const p = (async () => {
      const res = await refreshAction();
      const store = useAuthStore.getState();
      if (res.status === 'success') {
        store.setTokens({ accessToken: res.accessToken, expiresAt: res.expiresAt });
        const [user, menus] = await Promise.all([
          meAction(res.accessToken),
          menuAction(res.accessToken),
        ]);
        if (user) store.setUser(user);
        useMenuStore.getState().setMenus(menus);
        store.setStatus('authenticated');
        return true;
      }
      emitLogout();
      disconnectSocket();
      store.clear();
      useMenuStore.getState().clear();
      useMenuBadgesStore.getState().clear();
      return false;
    })();
    inFlightRef.current = p;
    p.finally(() => {
      inFlightRef.current = null;
    });
    return p;
  };

  // Initial hydration: persisted user but no in-memory token → refresh.
  useEffect(() => {
    const store = useAuthStore.getState();
    if (store.user && !store.accessToken) {
      store.setStatus('loading');
      doRefresh();
    } else if (!store.user) {
      store.setStatus('unauthenticated');
    } else {
      store.setStatus('authenticated');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Schedule next refresh based on expiresAt.
  useEffect(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    if (!expiresAt || !accessToken) return;
    const delay = expiresAt - Date.now() - authConfig.refreshLeadMs;
    if (delay <= 0) {
      doRefresh();
    } else {
      timerRef.current = setTimeout(() => {
        doRefresh();
      }, delay);
    }
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [expiresAt, accessToken]);

  // Refresh eagerly on focus / online if past lead time.
  useEffect(() => {
    const onWake = () => {
      const s = useAuthStore.getState();
      if (!s.expiresAt) return;
      if (s.expiresAt - Date.now() <= authConfig.refreshLeadMs) {
        doRefresh();
      }
    };
    window.addEventListener('focus', onWake);
    window.addEventListener('online', onWake);
    return () => {
      window.removeEventListener('focus', onWake);
      window.removeEventListener('online', onWake);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return <>{children}</>;
}
