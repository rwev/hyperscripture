/**
 * Note persistence hook backed by localStorage.
 *
 * Stores a Map of verse IDs to note strings and exposes
 * get/set operations. State changes trigger re-renders.
 */

import { useState, useCallback } from 'react';

const STORAGE_KEY = 'hyperscripture:notes';

/**
 * Load notes from localStorage into a Map.
 * @returns {Map<string, string>}
 */
function loadNotes() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const obj = JSON.parse(raw);
      if (obj && typeof obj === 'object') return new Map(Object.entries(obj));
    }
  } catch {
    // Corrupt or unavailable; start fresh
  }
  return new Map();
}

/**
 * Persist notes Map to localStorage.
 * @param {Map<string, string>} notes
 */
function saveNotes(notes) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(Object.fromEntries(notes)));
  } catch {
    // Storage full or unavailable
  }
}

/**
 * Hook for managing verse notes.
 * @returns {{ notes: Map<string, string>, getNote: (id: string) => string, setNote: (id: string, text: string) => void }}
 */
export function useNotes() {
  const [notes, setNotes] = useState(loadNotes);

  const getNote = useCallback((verseId) => {
    return notes.get(verseId) || '';
  }, [notes]);

  const setNote = useCallback((verseId, text) => {
    setNotes(prev => {
      const next = new Map(prev);
      if (text.trim()) {
        next.set(verseId, text);
      } else {
        next.delete(verseId);
      }
      saveNotes(next);
      return next;
    });
  }, []);

  return { notes, getNote, setNote };
}
