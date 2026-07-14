'use client';

import { useSocketContext } from '@/components/providers/socket-provider';

/**
 * Socket.io instance, provided by SocketProvider wrapped around the app.
 * Requires SocketProvider to be in the component tree (usually in root or management layout).
 */
export function useSocket() {
  return useSocketContext();
}
