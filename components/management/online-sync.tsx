'use client';

import { useCallback, useEffect } from 'react';
import { useSocketEmit, useSocketEvent } from '@/components/socket/SocketProvider';
import { useAuthStore } from '@/lib/stores/auth-store';
import { useOnlineStore } from '@/lib/stores/online-store';

function extractIds(payload: unknown): string[] {
  if (Array.isArray(payload)) return payload.flatMap(extractIds);
  if (!payload || typeof payload !== 'object') return [];
  const p = payload as Record<string, unknown>;
  if (p.user && typeof p.user === 'object') return extractIds(p.user);
  return typeof p.id === 'string' ? [p.id] : [];
}

export function OnlineSync() {
  const status = useAuthStore((s) => s.status);
  const emit = useSocketEmit();
  const setOnline = useOnlineStore((s) => s.setOnline);
  const setOffline = useOnlineStore((s) => s.setOffline);
  const setMany = useOnlineStore((s) => s.setMany);

  useEffect(() => {
    if (status !== 'authenticated') return;
    emit('presence:list');
  }, [status, emit]);

  const handleOnline = useCallback(
    (...args: unknown[]) => {
      const raw = args.length === 1 ? args[0] : args;
      const ids = extractIds(raw);
      if (Array.isArray(raw)) setMany(ids);
      else ids.forEach(setOnline);
    },
    [setOnline, setMany],
  );

  const handleOffline = useCallback(
    (...args: unknown[]) => {
      const p = args[0] as Record<string, unknown> | undefined;
      if (typeof p?.id === 'string') setOffline(p.id);
    },
    [setOffline],
  );

  const handleList = useCallback(
    (...args: unknown[]) => {
      setMany(extractIds(args[0]));
    },
    [setMany],
  );

  useSocketEvent('user-online', handleOnline, [handleOnline]);
  useSocketEvent('user-offline', handleOffline, [handleOffline]);
  useSocketEvent('presence:list', handleList, [handleList]);

  return null;
}
