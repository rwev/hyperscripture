import { useCallback } from 'react';
import { useSyncExternalStore } from 'react';

/**
 * Hook that returns whether a CSS media query matches.
 * Uses useSyncExternalStore for correct synchronization without
 * calling setState inside an effect body.
 */
export function useMediaQuery(query) {
  const subscribe = useCallback((callback) => {
    const mql = window.matchMedia(query);
    mql.addEventListener('change', callback);
    return () => mql.removeEventListener('change', callback);
  }, [query]);

  const getSnapshot = useCallback(() => {
    return window.matchMedia(query).matches;
  }, [query]);

  return useSyncExternalStore(subscribe, getSnapshot);
}
