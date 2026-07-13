'use client';

import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import type { ReactNode } from 'react';
import { useAuthStore } from '@/lib/stores/auth-store';
import { useMenuStore } from '@/lib/stores/menu-store';
import { menuAction } from '@/lib/auth/actions';
import { createSocketClient, disconnectSocket, emitOnline } from '@/lib/socket/socket-client';
import type { Socket } from 'socket.io-client';

const SocketContext = createContext<Socket | null>(null);

export function useSocket() {
  return useContext(SocketContext);
}

export function useSocketEvent(
  event: string,
  listener: (...args: unknown[]) => void,
  deps: unknown[] = [],
) {
  const socket = useSocket();

  useEffect(() => {
    if (!socket) return undefined;

    const handler = (...args: unknown[]) => listener(...args);
    socket.on(event, handler as (...args: unknown[]) => void);

    return () => {
      socket.off(event, handler as (...args: unknown[]) => void);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [socket, event, listener, ...deps]);
}

export function useSocketEmit() {
  const socket = useSocket();

  return useCallback(
    (event: string, payload?: unknown) => {
      if (!socket || !socket.connected) return;
      socket.emit(event, payload);
    },
    [socket],
  );
}

export function SocketProvider({ children }: { children: ReactNode }) {
  const accessToken = useAuthStore((s) => s.accessToken);
  const user = useAuthStore((s) => s.user);
  const status = useAuthStore((s) => s.status);
  const [socket, setSocket] = useState<Socket | null>(null);

  useEffect(() => {
    if (status !== 'authenticated' || !accessToken || !user) return undefined;

    const client = createSocketClient(accessToken);

    const handlePermissionsUpdated = async () => {
      const token = useAuthStore.getState().accessToken;
      if (!token) return;
      const menus = await menuAction(token);
      useMenuStore.getState().setMenus(menus);
    };

    const profilePayload = {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      nickname: user.nickname,
      avatarUrl: user.avatarUrl,
    };

    const handleConnect = () => {
      emitOnline(profilePayload);
    };

    client.on('connect', handleConnect);
    client.on('permissions:updated', handlePermissionsUpdated);

    client.connect();
    setSocket(client);

    return () => {
      client.off('connect', handleConnect);
      client.off('permissions:updated', handlePermissionsUpdated);
      disconnectSocket();
      setSocket(null);
    };
  }, [accessToken, status, user]);

  return <SocketContext.Provider value={socket}>{children}</SocketContext.Provider>;
}
