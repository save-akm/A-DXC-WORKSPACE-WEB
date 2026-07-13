'use server';

import { headers } from 'next/headers';
import {
  AuthApiError,
  forgotPasswordRequest,
  loginRequest,
  logoutRequest,
  meRequest,
  menuRequest,
  refreshRequest,
  resetPasswordRequest,
  updatePasswordRequest,
  verify2FARequest,
} from './api';
import { clearRefreshCookie, getRefreshCookie, setRefreshCookie } from './cookies';
import type { AuthUser, ForgotPasswordActionState, LoginActionState, MenuNode, RefreshActionState, ResetPasswordActionState, UpdatePasswordActionState } from './types';

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
  const rememberMe = formData.get('remember') === 'on';

  if (!identifier || !password) {
    return { status: 'error', error: 'กรุณากรอกอีเมลและรหัสผ่าน' };
  }

  try {
    const ua = (await headers()).get('user-agent') ?? undefined;
    const res = await loginRequest(identifier, password, rememberMe, ua);
    if (res.twoFactorRequired) {
      return { status: 'two-factor', twoFactorToken: res.twoFactorToken, rememberMe };
    }
    const [user, menus] = await Promise.all([
      meRequest(res.accessToken),
      menuRequest(res.accessToken).catch((e) => {
        console.error('[loginAction.menus] failed:', e);
        return [] as MenuNode[];
      }),
    ]);
    if (res.mustChangePassword) {
      // Don't persist the refresh cookie yet — the user must change their
      // password first. The cookie will be set by updatePasswordAction so
      // that a page refresh on /login keeps them on the login page (no
      // session), not redirected to /dashboard by the middleware.
      return {
        status: 'success',
        data: {
          user,
          menus,
          accessToken: res.accessToken,
          expiresAt: Date.now() + res.expiresIn * 1000,
          mustChangePassword: true,
          pendingRefreshToken: res.refreshToken,
        },
      };
    }
    await setRefreshCookie(res.refreshToken);
    return {
      status: 'success',
      data: {
        user,
        menus,
        accessToken: res.accessToken,
        expiresAt: Date.now() + res.expiresIn * 1000,
        mustChangePassword: false,
      },
    };
  } catch (e) {
    const { message, code } = mapError(e, 'ไม่สามารถเชื่อมต่อระบบได้');
    return { status: 'error', error: message, code };
  }
}

export async function verify2FAAction(
  twoFactorToken: string,
  pin: string,
  rememberMe: boolean,
): Promise<LoginActionState> {
  try {
    const res = await verify2FARequest({ twoFactorToken, pin, rememberMe });
    const [user, menus] = await Promise.all([
      meRequest(res.accessToken),
      menuRequest(res.accessToken).catch(() => [] as MenuNode[]),
    ]);
    if (res.mustChangePassword) {
      return {
        status: 'success',
        data: {
          user, menus,
          accessToken: res.accessToken,
          expiresAt: Date.now() + res.expiresIn * 1000,
          mustChangePassword: true,
          pendingRefreshToken: res.refreshToken,
        },
      };
    }
    await setRefreshCookie(res.refreshToken);
    return {
      status: 'success',
      data: {
        user, menus,
        accessToken: res.accessToken,
        expiresAt: Date.now() + res.expiresIn * 1000,
        mustChangePassword: false,
      },
    };
  } catch (e) {
    const { message, code } = mapError(e, 'รหัส PIN ไม่ถูกต้อง');
    return { status: 'error', error: message, code };
  }
}

export async function refreshAction(): Promise<RefreshActionState> {
  const token = await getRefreshCookie();
  if (!token) return { status: 'error', error: 'NO_REFRESH_TOKEN' };
  try {
    const ua = (await headers()).get('user-agent') ?? undefined;
    const res = await refreshRequest(token, ua);
    await setRefreshCookie(res.refreshToken);
    return {
      status: 'success',
      accessToken: res.accessToken,
      expiresAt: Date.now() + res.expiresIn * 1000,
      menus: res.menus,
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
    if (accessToken) {
      const ua = (await headers()).get('user-agent') ?? undefined;
      await logoutRequest(accessToken, ua);
    }
  } catch {
    // best effort — server-side revocation may fail (e.g. token already expired)
  }
  await clearRefreshCookie();
  return { ok: true };
}

export async function updatePasswordAction(
  accessToken: string,
  _prev: UpdatePasswordActionState,
  formData: FormData,
): Promise<UpdatePasswordActionState> {
  const newPassword = (formData.get('newPassword') ?? '').toString();
  const confirmPassword = (formData.get('confirmPassword') ?? '').toString();

  if (!newPassword) return { status: 'error', error: 'กรุณากรอกรหัสผ่านใหม่' };
  if (newPassword.length < 8) return { status: 'error', error: 'รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร' };
  if (newPassword !== confirmPassword) return { status: 'error', error: 'รหัสผ่านไม่ตรงกัน' };

  try {
    const tokens = await updatePasswordRequest(accessToken, newPassword);
    // Backend revokes all old sessions on password change and returns a fresh
    // token pair. Activate the cookie with the new refresh token only now so
    // that a page refresh before this point keeps the user on /login.
    await setRefreshCookie(tokens.refreshToken);
    return {
      status: 'success',
      accessToken: tokens.accessToken,
      expiresAt: Date.now() + tokens.expiresIn * 1000,
    };
  } catch (e) {
    const { message } = mapError(e, 'ไม่สามารถเปลี่ยนรหัสผ่านได้');
    return { status: 'error', error: message };
  }
}

export async function forgotPasswordAction(
  _prev: ForgotPasswordActionState,
  formData: FormData,
): Promise<ForgotPasswordActionState> {
  const identifier = (formData.get('identifier') ?? '').toString().trim();
  if (!identifier) return { status: 'error', error: 'กรุณากรอกอีเมลหรือรหัสพนักงาน' };

  try {
    await forgotPasswordRequest(identifier);
    return { status: 'success' };
  } catch (e) {
    const { message } = mapError(e, 'ไม่สามารถส่ง OTP ได้ กรุณาลองใหม่');
    return { status: 'error', error: message };
  }
}

export async function resetPasswordAction(
  identifier: string,
  _prev: ResetPasswordActionState,
  formData: FormData,
): Promise<ResetPasswordActionState> {
  const otp = (formData.get('otp') ?? '').toString().trim();
  const newPassword = (formData.get('newPassword') ?? '').toString();
  const confirmPassword = (formData.get('confirmPassword') ?? '').toString();

  if (!otp || !/^\d{4}$/.test(otp)) return { status: 'error', error: 'กรุณากรอก OTP 4 หลัก' };
  if (!newPassword) return { status: 'error', error: 'กรุณากรอกรหัสผ่านใหม่' };
  if (newPassword.length < 8) return { status: 'error', error: 'รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร' };
  if (newPassword !== confirmPassword) return { status: 'error', error: 'รหัสผ่านไม่ตรงกัน' };

  try {
    await resetPasswordRequest(identifier, otp, newPassword);
    return { status: 'success' };
  } catch (e) {
    const { message } = mapError(e, 'ไม่สามารถเปลี่ยนรหัสผ่านได้');
    return { status: 'error', error: message };
  }
}
