import { useCallback } from 'react';

/**
 * Hook for lazy-loading and caching Bible book data.
 * Caches are module-level singletons shared across all component instances.
 */
const cache = new Map();
const inflight = new Map();

export function useBibleText() {
  const loadBook = useCallback(async (translation, filename) => {
    const key = `${translation}/${filename}`;

    if (cache.has(key)) {
      return cache.get(key);
    }

    if (inflight.has(key)) {
      return inflight.get(key);
    }

    const promise = fetch(`${import.meta.env.BASE_URL}data/translations/${key}`)
      .then(res => {
        if (!res.ok) throw new Error(`Failed to load ${key}`);
        return res.json();
      })
      .then(data => {
        cache.set(key, data);
        inflight.delete(key);
        return data;
      })
      .catch(err => {
        inflight.delete(key);
        throw err;
      });

    inflight.set(key, promise);
    return promise;
  }, []);

  const getVerses = useCallback((bookData, chapter) => {
    if (!bookData?.chapters) return [];
    return bookData.chapters[String(chapter)] || [];
  }, []);

  return { loadBook, getVerses };
}
