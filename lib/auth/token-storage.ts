'use client';

const RT_KEY = 'a-dxc-rt';

export interface StoredRefreshToken {
  token: string;
  rememberMe: boolean;
}

export function storeRefreshToken(token: string, rememberMe: boolean): void {
  if (typeof window === 'undefined') return;
  if (rememberMe) {
    localStorage.setItem(RT_KEY, token);
    sessionStorage.removeItem(RT_KEY);
  } else {
    sessionStorage.setItem(RT_KEY, token);
    localStorage.removeItem(RT_KEY);
  }
}

export function getStoredRefreshToken(): StoredRefreshToken | null {
  if (typeof window === 'undefined') return null;
  const ls = localStorage.getItem(RT_KEY);
  if (ls) return { token: ls, rememberMe: true };
  const ss = sessionStorage.getItem(RT_KEY);
  if (ss) return { token: ss, rememberMe: false };
  return null;
}

export function clearStoredRefreshToken(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(RT_KEY);
  sessionStorage.removeItem(RT_KEY);
}
