import { io, type Socket } from 'socket.io-client';
import { authConfig } from '@/lib/auth/config';
import type { PresenceIdentifyPayload } from '@/lib/socket/types';

let socket: Socket | null = null;

export function createSocketClient(accessToken: string) {
  if (socket && socket.connected) return socket;

  if (socket) {
    socket.disconnect();
    socket = null;
  }

  socket = io(authConfig.apiUrl, {
    path: '/socket.io',
    auth: {
      token: accessToken,
    },
    transports: ['websocket'],
    autoConnect: false,
  });

  return socket;
}

export function disconnectSocket() {
  if (!socket) return;
  socket.disconnect();
  socket = null;
}

export function emitOnline(payload: PresenceIdentifyPayload) {
  if (!socket || !socket.connected) return;
  socket.emit('online', payload);
}

export function emitLogout() {
  const isConnected = socket?.connected === true;
  console.log('[socket-client] emitLogout called', { isConnected });

  if (!isConnected) return;
  socket?.emit('logout');
  console.log('[socket-client] logout event emitted');
}
