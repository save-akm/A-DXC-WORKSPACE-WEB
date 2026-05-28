'use client';

import { useCallback, useSyncExternalStore } from 'react';

export function useMediaQuery(query: string): boolean {
  const subscribe = useCallback(
    (notify: () => void) => {
      if (typeof window === 'undefined') return () => {};
      const mql = window.matchMedia(query);
      mql.addEventListener('change', notify);
      return () => mql.removeEventListener('change', notify);
    },
    [query],
  );

  const getSnapshot = useCallback(
    () => (typeof window === 'undefined' ? false : window.matchMedia(query).matches),
    [query],
  );

  return useSyncExternalStore(subscribe, getSnapshot, () => false);
}

export const useIsMobile = () => useMediaQuery('(max-width: 767px)');
