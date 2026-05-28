'use server';

import {
  AuthApiError,
  loginRequest,
  logoutRequest,
  meRequest,
  menuRequest,
  refreshRequest,
} from './api';
import { clearRefreshCookie, getRefreshCookie, setRefreshCookie } from './cookies';
import type { AuthUser, LoginActionState, MenuNode, RefreshActionState } from './types';

function mapError(e: unknown, fallback: string): { message: string; code?: string } {
  if (e instanceof AuthApiError) {
    if (e.status === 401) return { message: 'อีเมลหรือรหัสผ่านไม่ถูกต้อง', code: e.code };
    if (e.status >= 500) return { message: 'ระบบขัดข้อง กรุณาลองใหม่ภายหลัง', code: e.code };
    return { message: e.message, code: e.code };
  }
  return { message: fallback };
}

export async function loginAction(
  _prev: LoginActionState | undefined,
  formData: FormData,
): Promise<LoginActionState> {
  const identifier = (formData.get('identifier') ?? '').toString().trim();
  const password = (formData.get('password') ?? '').toString();

  if (!identifier || !password) {
    return { status: 'error', error: 'กรุณากรอกอีเมลและรหัสผ่าน' };
  }

  try {
    const res = await loginRequest(identifier, password);
    await setRefreshCookie(res.refreshToken);
    const [user, menus] = await Promise.all([
      meRequest(res.accessToken),
      menuRequest(res.accessToken).catch((e) => {
        console.error('[loginAction.menus] failed:', e);
        return [] as MenuNode[];
      }),
    ]);
    return {
      status: 'success',
      data: {
        user,
        menus,
        accessToken: res.accessToken,
        expiresAt: Date.now() + res.expiresIn * 1000,
        mustChangePassword: res.mustChangePassword,
      },
    };
  } catch (e) {
    const { message, code } = mapError(e, 'ไม่สามารถเชื่อมต่อระบบได้');
    return { status: 'error', error: message, code };
  }
}

export async function refreshAction(): Promise<RefreshActionState> {
  const token = await getRefreshCookie();
  if (!token) return { status: 'error', error: 'NO_REFRESH_TOKEN' };
  try {
    const res = await refreshRequest(token);
    await setRefreshCookie(res.refreshToken);
    return {
      status: 'success',
      accessToken: res.accessToken,
      expiresAt: Date.now() + res.expiresIn * 1000,
    };
  } catch {
    await clearRefreshCookie();
    return { status: 'error', error: 'REFRESH_FAILED' };
  }
}

export async function meAction(accessToken: string): Promise<AuthUser | null> {
  try {
    return await meRequest(accessToken);
  } catch {
    return null;
  }
}

export async function menuAction(accessToken: string): Promise<MenuNode[]> {
  try {
    return await menuRequest(accessToken);
  } catch (e) {
    console.error('[menuAction] failed:', e);
    return [];
  }
}

export async function logoutAction(accessToken: string | null): Promise<{ ok: boolean }> {
  try {
    if (accessToken) await logoutRequest(accessToken);
  } catch {
    // best effort — server-side revocation may fail (e.g. token already expired)
  }
  await clearRefreshCookie();
  return { ok: true };
}
