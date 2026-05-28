import { authConfig } from '@/lib/auth/config';
import { AuthApiError } from '@/lib/auth/api';
import type { AuthUser } from '@/lib/auth/types';

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

async function unwrap<T>(res: Response): Promise<T> {
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

const endpoints = {
  updateMe: '/me',
  uploadAvatar: '/me/avatar',
  deleteAvatar: '/me/avatar',
} as const;

export type UpdateMeBody = Partial<
  Pick<AuthUser, 'firstName' | 'lastName' | 'nickname' | 'email' | 'phone' | 'avatarUrl'>
>;

export async function updateMeRequest(
  accessToken: string,
  body: UpdateMeBody,
): Promise<AuthUser> {
  const res = await fetch(authConfig.apiUrl + endpoints.updateMe, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify(body),
    cache: 'no-store',
  });
  return unwrap<AuthUser>(res);
}

export async function uploadAvatarRequest(
  accessToken: string,
  file: File,
): Promise<{ avatarUrl: string }> {
  const form = new FormData();
  form.append('file', file);
  const res = await fetch(authConfig.apiUrl + endpoints.uploadAvatar, {
    method: 'POST',
    headers: { Authorization: `Bearer ${accessToken}` },
    body: form,
    cache: 'no-store',
  });
  return unwrap<{ avatarUrl: string }>(res);
}

export async function deleteAvatarRequest(
  accessToken: string,
): Promise<{ avatarUrl: null }> {
  const res = await fetch(authConfig.apiUrl + endpoints.deleteAvatar, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${accessToken}` },
    cache: 'no-store',
  });
  return unwrap<{ avatarUrl: null }>(res);
}
