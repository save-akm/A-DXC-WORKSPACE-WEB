'use client';

import { useAuthStore } from '@/lib/stores/auth-store';
import { useMenuStore } from '@/lib/stores/menu-store';
import { useMenuBadgesStore } from '@/lib/stores/menu-badges-store';
import { disconnectSocket, emitLogout } from '@/lib/socket/socket-client';
import { authConfig } from './config';
import { refreshAction } from './actions';
import { clearStoredRefreshToken } from './token-storage';

const clearSessionAfterAuthFailure = () => {
  emitLogout();
  disconnectSocket();
  useAuthStore.getState().clear();
  useMenuStore.getState().clear();
  useMenuBadgesStore.getState().clear();
  clearStoredRefreshToken();
};

/**
 * Single-flight refresh promise — multiple parallel API calls hitting 401
 * (or noticing the token is near expiry) all await the same refresh round-trip.
 */
let inFlightRefresh: Promise<boolean> | null = null;

async function refreshNow(): Promise<boolean> {
  if (inFlightRefresh) return inFlightRefresh;
  inFlightRefresh = (async () => {
    const res = await refreshAction();
    const store = useAuthStore.getState();
    if (res.status === 'success') {
      store.setTokens({ accessToken: res.accessToken, expiresAt: res.expiresAt });
      store.setStatus('authenticated');
      return true;
    }
    clearSessionAfterAuthFailure();
    window.location.href = '/login';
    return false;
  })();
  try {
    return await inFlightRefresh;
  } finally {
    inFlightRefresh = null;
  }
}

async function ensureFreshToken(): Promise<string | null> {
  const { accessToken, expiresAt } = useAuthStore.getState();
  if (!accessToken) return null;
  if (expiresAt && expiresAt - Date.now() <= authConfig.refreshLeadMs) {
    const ok = await refreshNow();
    if (!ok) return null;
    return useAuthStore.getState().accessToken;
  }
  return accessToken;
}

export interface ApiFetchOptions extends Omit<RequestInit, 'body'> {
  body?: unknown;
  /** When false, the call is sent without an Authorization header. */
  auth?: boolean;
}

export async function apiFetch<T = unknown>(path: string, opts: ApiFetchOptions = {}): Promise<T> {
  const { auth = true, body, headers, cache = 'no-store', ...init } = opts;

  const buildHeaders = async (): Promise<Headers> => {
    const h = new Headers(headers);
    if (body !== undefined && !h.has('Content-Type')) {
      h.set('Content-Type', 'application/json');
    }
    if (auth) {
      const token = await ensureFreshToken();
      if (token) h.set('Authorization', `Bearer ${token}`);
    }
    return h;
  };

  const exec = async (): Promise<Response> =>
    fetch("/api/_proxy" + path, {
      ...init,
      cache,
      headers: await buildHeaders(),
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });

  let res = await exec();

  // 401 → try refresh once, then retry the original call.
  if (res.status === 401 && auth) {
    const ok = await refreshNow();
    if (ok) res = await exec();
  }

  if (!res.ok) {
    let message = res.statusText;
    let code: string | undefined;
    try {
      const data = await res.json();
      // envelope APIs ใช้ message, กลุ่ม document/collection API ตอบ { error }
      message = (data?.message as string) ?? (data?.error as string) ?? message;
      code = (data?.code as string) ?? undefined;
    } catch {
      // non-JSON
    }
    const err = new Error(message) as Error & { status: number; code?: string };
    err.status = res.status;
    err.code = code;
    throw err;
  }

  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}
