/**
 * Bookmark persistence hook backed by localStorage.
 *
 * Stores a Set of verse IDs (e.g. "Gen.1.1") and exposes
 * toggle/has/getAll operations. State changes trigger re-renders.
 */

import { useState, useCallback } from 'react';

const STORAGE_KEY = 'hyperscripture:bookmarks';

/**
 * Load bookmarks from localStorage into a Set.
 * @returns {Set<string>}
 */
function loadBookmarks() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const arr = JSON.parse(raw);
      if (Array.isArray(arr)) return new Set(arr);
    }
  } catch {
    // Corrupt or unavailable; start fresh
  }
  return new Set();
}

/**
 * Persist a Set of bookmarks to localStorage.
 * @param {Set<string>} bookmarks
 */
function saveBookmarks(bookmarks) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify([...bookmarks]));
  } catch {
    // Storage full or unavailable
  }
}

/**
 * Hook for managing bookmarked verses.
 * @returns {{ bookmarks: Set<string>, toggle: (id: string) => boolean, getAll: () => string[] }}
 */
export function useBookmarks() {
  const [bookmarks, setBookmarks] = useState(loadBookmarks);

  const toggle = useCallback((verseId) => {
    let added = false;
    setBookmarks(prev => {
      const next = new Set(prev);
      if (next.has(verseId)) {
        next.delete(verseId);
      } else {
        next.add(verseId);
        added = true;
      }
      saveBookmarks(next);
      return next;
    });
    return added;
  }, []);

  const getAll = useCallback(() => {
    return [...bookmarks];
  }, [bookmarks]);

  return { bookmarks, toggle, getAll };
}
