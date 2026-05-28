import { cookies } from 'next/headers';
import { authConfig } from './config';

export async function setRefreshCookie(token: string) {
  const store = await cookies();
  store.set(authConfig.cookies.refresh, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: authConfig.refreshCookieMaxAgeSeconds,
  });
}

export async function getRefreshCookie() {
  const store = await cookies();
  return store.get(authConfig.cookies.refresh)?.value ?? null;
}

export async function clearRefreshCookie() {
  const store = await cookies();
  store.delete(authConfig.cookies.refresh);
}
