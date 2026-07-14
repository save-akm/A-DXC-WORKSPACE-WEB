'use client';

import { useEffect } from 'react';
import { useSocket } from './use-socket';

type EventMap = Record<string, (...args: unknown[]) => void>;

/**
 * Attach socket.io listeners. Handles lifecycle: listeners are bound on mount
 * and unbound on unmount or dependency change.
 */
export function useSocketEvents<T extends EventMap>(events: T): void {
  const socket = useSocket();

  useEffect(() => {
    if (!socket) return;

    Object.entries(events).forEach(([event, handler]) => {
      socket.on(event, handler);
    });

    return () => {
      Object.entries(events).forEach(([event, handler]) => {
        socket.off(event, handler);
      });
    };
  }, [socket, events]);
}
