import { useCallback, useMemo } from 'react';

/**
 * Hook for loading and querying cross-reference data.
 * Caches are module-level singletons shared across all component instances.
 */
const cache = new Map();
const inflight = new Map();
const EMPTY = [];

export function useCrossRefs() {
  const loadRefs = useCallback(async (bookAbbr) => {
    if (cache.has(bookAbbr)) {
      return cache.get(bookAbbr);
    }

    if (inflight.has(bookAbbr)) {
      return inflight.get(bookAbbr);
    }

    const promise = fetch(`${import.meta.env.BASE_URL}data/cross-refs/${bookAbbr}.json`)
      .then(res => {
        if (!res.ok) throw new Error(`Failed to load cross-refs for ${bookAbbr}`);
        return res.json();
      })
      .then(data => {
        cache.set(bookAbbr, data);
        inflight.delete(bookAbbr);
        return data;
      })
      .catch(err => {
        inflight.delete(bookAbbr);
        console.warn(`Could not load cross-refs for ${bookAbbr}:`, err);
        // Re-throw so callers can handle; do NOT cache empty results on error
        // to allow retry on subsequent attempts
        throw err;
      });

    inflight.set(bookAbbr, promise);
    return promise;
  }, []);

  /**
   * Get cross-references for a specific verse.
   * Returns the cached array (stable reference) or EMPTY (stable constant).
   */
  const getRefsForVerse = useCallback((bookAbbr, chapter, verse) => {
    const bookRefs = cache.get(bookAbbr);
    if (!bookRefs) return EMPTY;
    const key = `${chapter}.${verse}`;
    return bookRefs[key] || EMPTY;
  }, []);

  return useMemo(() => ({ loadRefs, getRefsForVerse }), [loadRefs, getRefsForVerse]);
}
