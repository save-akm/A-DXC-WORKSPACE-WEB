import { AuthApiError } from '@/lib/auth/api';
import { apiFetch } from '@/lib/auth/client';

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

async function unwrap<T>(res: Response): Promise<T> {
  let parsed: unknown = null;
  try {
    parsed = await res.json();
  } catch {
    // non-JSON body
  }
  if (!res.ok) {
    const message =
      isEnvelope(parsed) && parsed.message
        ? parsed.message
        : res.statusText || 'Request failed';
    const code = isEnvelope(parsed) ? parsed.code ?? parsed.error : undefined;
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

const endpoints = {
  changePassword: '/auth/change-password',
  twoFactor: '/auth/2fa/toggle',
  twoFactorStatus: '/auth/2fa/status',
  twoFactorSetup: '/auth/2fa/setup',
  preferences: '/auth/me/preferences',
  loginHistory: '/auth/me/login-history',
  sessions: '/auth/sessions',
  revokeOtherSessions: '/auth/sessions/revoke-others',
} as const;

export interface ChangePasswordBody {
  oldPassword: string;
  newPassword: string;
}

export interface SecurityUpdateBody {
  currentPassword?: string;
  newPassword?: string;
  twoFactorEnabled?: boolean;
  loginAlertsEnabled?: boolean;
}

export interface LoginHistoryEntry {
  id: string;
  status: 'SUCCESS' | 'FAILURE';
  ipAddress: string;
  location: string | null;
  deviceType: string;
  browser: string;
  os: string;
  createdAt: string; // ISO
}

export interface ActiveSession {
  id: string;
  device: 'laptop' | 'desktop' | 'smartphone' | 'tablet' | 'unknown';
  browser: string;
  os: string;
  current: boolean;
  lastActiveAt: string; // ISO
}

export async function changePasswordRequest(
  accessToken: string,
  body: ChangePasswordBody,
): Promise<void> {
  const res = await fetch('/api/_proxy' + endpoints.changePassword, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify(body),
    cache: 'no-store',
  });
  await unwrap<void>(res);
}

export async function setup2FARequest(
  accessToken: string,
  pin: string,
): Promise<void> {
  const res = await fetch('/api/_proxy' + endpoints.twoFactorSetup, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({ pin }),
    cache: 'no-store',
  });
  await unwrap<void>(res);
}

export async function toggle2FARequest(
  accessToken: string,
  enabled: boolean,
): Promise<void> {
  const res = await fetch('/api/_proxy' + endpoints.twoFactor, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({ enabled }),
    cache: 'no-store',
  });
  await unwrap<void>(res);
}

export async function updatePreferencesRequest(
  accessToken: string,
  body: { notifyNewDevice: boolean },
): Promise<void> {
  const res = await fetch('/api/_proxy' + endpoints.preferences, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify(body),
    cache: 'no-store',
  });
  await unwrap<void>(res);
}

export async function revokeOtherSessionsRequest(
  accessToken: string,
): Promise<{ revoked: number }> {
  const res = await fetch('/api/_proxy' + endpoints.revokeOtherSessions, {
    method: 'POST',
    headers: { Authorization: `Bearer ${accessToken}` },
    cache: 'no-store',
  });
  return unwrap<{ revoked: number }>(res);
}

// ── Read-only fetches via apiFetch (handles 401→refresh→retry automatically) ──

interface ApiSessionRaw {
  id: string;
  deviceType: string;
  browser: string;
  os: string;
  location: string | null;
  createdAt: string;
  expiresAt: string;
  isCurrent: boolean;
}

function normalizeDevice(deviceType: string): ActiveSession['device'] {
  const t = deviceType.toLowerCase();
  if (t === 'laptop') return 'laptop';
  if (t === 'desktop') return 'desktop';
  if (t === 'smartphone' || t === 'mobile') return 'smartphone';
  if (t === 'tablet') return 'tablet';
  return 'unknown';
}

export async function fetchSessionsRequest(): Promise<ActiveSession[]> {
  const env = await apiFetch<ApiEnvelope<{ sessions: ApiSessionRaw[] }>>(endpoints.sessions);
  return (env?.data?.sessions ?? []).map((s) => ({
    id: s.id,
    device: normalizeDevice(s.deviceType),
    browser: s.browser,
    os: s.os,
    current: s.isCurrent,
    lastActiveAt: s.createdAt,
  }));
}

export async function fetchLoginHistoryRequest(): Promise<LoginHistoryEntry[]> {
  const env = await apiFetch<ApiEnvelope<{ history: LoginHistoryEntry[] }>>(endpoints.loginHistory);
  return env?.data?.history ?? [];
}

export interface SecurityPreferences {
  twoFactorEnabled: boolean;
  notifyNewDevice: boolean;
  hasPin: boolean;
}

interface MeDataShape {
  user?: { notifyNewDevice?: boolean };
}

export async function fetchSecurityPreferencesRequest(): Promise<SecurityPreferences> {
  const [meEnv, tfaEnv] = await Promise.all([
    apiFetch<ApiEnvelope<MeDataShape>>('/auth/me'),
    apiFetch<ApiEnvelope<{ enabled: boolean; hasPin: boolean }>>(endpoints.twoFactorStatus),
  ]);
  return {
    twoFactorEnabled: tfaEnv?.data?.enabled ?? false,
    notifyNewDevice: meEnv?.data?.user?.notifyNewDevice ?? false,
    hasPin: tfaEnv?.data?.hasPin ?? false,
  };
}
