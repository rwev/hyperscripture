/**
 * Hook for loading parallel translation text alongside the main reader blocks.
 *
 * Given an array of chapter blocks and a translation ID, loads the verse
 * arrays for each chapter in the alternate translation. Returns a Map
 * keyed by "bookAbbr.chapter" with verse arrays as values.
 */

import { useState, useEffect, useMemo } from 'react';
import { useBibleText } from './useBibleText';
import { getBookByAbbr } from '../utils/bible';

const EMPTY_MAP = new Map();

/**
 * @param {Array} blocks - Current chapter blocks from the main reader
 * @param {string|null} translation - The parallel translation ID (e.g. "KJV"), or null if disabled
 * @param {boolean} enabled - Whether parallel mode is active
 * @returns {Map<string, Array>} Map of "BookAbbr.chapter" → verse array
 */
export function useParallelText(blocks, translation, enabled) {
  const { loadBook, getVerses } = useBibleText();
  const [verseMap, setVerseMap] = useState(EMPTY_MAP);

  // Build a stable key for the current block set to detect changes
  const blockKey = useMemo(
    () => blocks.map(b => `${b.bookAbbr}.${b.chapter}`).join(','),
    [blocks],
  );

  useEffect(() => {
    if (!enabled || !translation || blocks.length === 0) return;

    let cancelled = false;

    const load = async () => {
      const next = new Map();

      for (const block of blocks) {
        const bookMeta = getBookByAbbr(block.bookAbbr);
        if (!bookMeta) continue;

        try {
          const bookData = await loadBook(translation, bookMeta.file);
          const verses = getVerses(bookData, block.chapter);
          if (verses && verses.length > 0) {
            next.set(`${block.bookAbbr}.${block.chapter}`, verses);
          }
        } catch {
          // Load failed for this chapter; skip
        }
      }

      if (!cancelled) {
        setVerseMap(next);
      }
    };

    load();
    return () => { cancelled = true; };
  }, [blockKey, translation, enabled, loadBook, getVerses, blocks]);

  // Return empty map when disabled (derived, no effect needed)
  if (!enabled || !translation) return EMPTY_MAP;
  return verseMap;
}
