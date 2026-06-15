'use client';

import { useEffect, useRef } from 'react';
import { useAuthStore } from '@/lib/stores/auth-store';
import { useMenuStore } from '@/lib/stores/menu-store';
import { useMenuBadgesStore } from '@/lib/stores/menu-badges-store';
import { disconnectSocket, emitLogout } from '@/lib/socket/socket-client';
import { meAction, menuAction, refreshAction } from '@/lib/auth/actions';
import { authConfig } from '@/lib/auth/config';
import { clearStoredRefreshToken } from '@/lib/auth/token-storage';

/**
 * Auth lifecycle:
 *   1. On mount, if there's a persisted user but no in-memory access token,
 *      read the refresh token from localStorage/sessionStorage and call refreshAction.
 *   2. Schedule a single setTimeout to refresh `refreshLeadMs` before expiry.
 *   3. Single-flight guard prevents concurrent refresh calls.
 *   4. On focus / online events, eagerly refresh if the token is past lead.
 *
 * The access token is never persisted — the refresh token lives in
 * localStorage (rememberMe=true) or sessionStorage (rememberMe=false).
 */
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const user = useAuthStore((s) => s.user);
  const accessToken = useAuthStore((s) => s.accessToken);
  const expiresAt = useAuthStore((s) => s.expiresAt);

  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const inFlightRef = useRef<Promise<boolean> | null>(null);
  const menuRetryRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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
        if (menus.length > 0) {
          useMenuStore.getState().setMenus(menus);
        } else {
          // menuAction returned [] — backend session hasn't propagated yet
          // (read-after-write lag). Don't overwrite cached menus; retry once
          // after a short delay when the DB is guaranteed to be consistent.
          if (menuRetryRef.current) clearTimeout(menuRetryRef.current);
          menuRetryRef.current = setTimeout(async () => {
            menuRetryRef.current = null;
            const token = useAuthStore.getState().accessToken;
            if (!token) return;
            const retried = await menuAction(token);
            if (retried.length > 0) useMenuStore.getState().setMenus(retried);
          }, 700);
        }
        store.setStatus('authenticated');

        return true;
      }
      emitLogout();
      disconnectSocket();
      store.clear();
      useMenuStore.getState().clear();
      useMenuBadgesStore.getState().clear();
      clearStoredRefreshToken();
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

  // Cancel any pending menu retry on unmount.
  useEffect(() => {
    return () => {
      if (menuRetryRef.current) clearTimeout(menuRetryRef.current);
    };
  }, []);

  return <>{children}</>;
}
