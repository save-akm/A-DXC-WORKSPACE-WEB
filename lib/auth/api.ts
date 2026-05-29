import { authConfig } from './config';
import type { AuthUser, LoginResponse, MenuNode, RefreshResponse } from './types';

export class AuthApiError extends Error {
  status: number;
  code?: string;
  constructor(status: number, message: string, code?: string) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

interface ApiEnvelope<T> {
  status: string;
  message?: string;
  code?: string;
  error?: string;
  data?: T;
}

function isEnvelope(body: unknown): body is ApiEnvelope<unknown> {
  return (
    typeof body === 'object' &&
    body !== null &&
    'status' in (body as Record<string, unknown>) &&
    typeof (body as Record<string, unknown>).status === 'string'
  );
}

function readMessage(body: unknown, fallback: string): { message: string; code?: string } {
  if (isEnvelope(body)) {
    return { message: body.message ?? fallback, code: body.code ?? body.error };
  }
  if (typeof body === 'object' && body !== null) {
    const record = body as Record<string, unknown>;
    const message = typeof record.message === 'string' ? record.message : fallback;
    const code =
      typeof record.code === 'string'
        ? record.code
        : typeof record.error === 'string'
          ? record.error
          : undefined;
    return { message, code };
  }
  return { message: fallback };
}

async function request<T>(
  path: string,
  init: { method?: string; body?: unknown; accessToken?: string } = {},
): Promise<T> {
  const { method = 'GET', body, accessToken } = init;
  const res = await fetch(authConfig.apiUrl + path, {
    method,
    headers: {
      ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}),
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
    cache: 'no-store',
  });

  let parsed: unknown = null;
  try {
    parsed = await res.json();
  } catch {
    // non-JSON body
  }

  if (!res.ok) {
    const { message, code } = readMessage(parsed, res.statusText || 'Request failed');
    throw new AuthApiError(res.status, message, code);
  }

  if (isEnvelope(parsed)) {
    if (parsed.status !== 'OK') {
      throw new AuthApiError(
        res.status,
        parsed.message ?? 'Request failed',
        parsed.code ?? parsed.error,
      );
    }
    return parsed.data as T;
  }

  return parsed as T;
}

export function loginRequest(identifier: string, password: string) {
  return request<LoginResponse>(authConfig.endpoints.login, {
    method: 'POST',
    body: { identifier, password },
  });
}

export function refreshRequest(refreshToken: string) {
  return request<RefreshResponse>(authConfig.endpoints.refresh, {
    method: 'POST',
    body: { refreshToken },
  });
}

export function logoutRequest(accessToken: string) {
  return request<{ success: boolean }>(authConfig.endpoints.logout, {
    method: 'POST',
    accessToken,
  });
}

export async function meRequest(accessToken: string): Promise<AuthUser> {
  const data = await request<{ user: AuthUser }>(authConfig.endpoints.me, { accessToken });
  return data.user;
}

export function menuRequest(accessToken: string): Promise<MenuNode[]> {
  return request<MenuNode[]>(authConfig.endpoints.menus, { accessToken });
}

export function updatePasswordRequest(accessToken: string, newPassword: string): Promise<void> {
  return request<void>(authConfig.endpoints.updatePassword, {
    method: 'POST',
    accessToken,
    body: { newPassword },
  });
}

export function forgotPasswordRequest(identifier: string): Promise<void> {
  return request<void>(authConfig.endpoints.forgotPassword, {
    method: 'POST',
    body: { identifier },
  });
}

export function resetPasswordRequest(
  identifier: string,
  otp: string,
  newPassword: string,
): Promise<void> {
  return request<void>(authConfig.endpoints.resetPassword, {
    method: 'POST',
    body: { identifier, otp, newPassword },
  });
}
