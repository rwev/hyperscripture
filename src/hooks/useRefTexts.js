import { useState, useEffect, useRef, useMemo } from 'react';
import { parseReference, getBookByAbbr } from '../utils/bible';
import { useBibleText } from './useBibleText';

/**
 * Shared hook for loading verse texts for an array of cross-references.
 * Handles batched parallel loading and cancellation.
 *
 * @param {Array} refs - Array of [refId, votes] tuples (must be memoized by caller)
 * @param {string} translation - Current translation ID
 * @returns {{ texts: Object, loading: boolean }}
 */
export function useRefTexts(refs, translation) {
  const { loadBook } = useBibleText();
  const [texts, setTexts] = useState({});
  const [loading, setLoading] = useState(false);
  const prevKey = useRef('');

  useEffect(() => {
    if (!refs || refs.length === 0) {
      // Only update state if not already empty, to avoid render loops
      if (prevKey.current !== '') {
        prevKey.current = '';
        setTexts({});
        setLoading(false);
      }
      return;
    }

    // Deduplicate work: skip if refs haven't changed
    const key = refs.map(r => r[0]).join(',');
    if (key === prevKey.current) return;

    let cancelled = false;
    setLoading(true);
    setTexts({});

    const load = async () => {
      const result = {};
      const booksNeeded = new Map();

      for (const [ref] of refs) {
        const parsed = parseReference(ref);
        if (!parsed) continue;
        if (!booksNeeded.has(parsed.book)) {
          booksNeeded.set(parsed.book, []);
        }
        booksNeeded.get(parsed.book).push({ ref, parsed });
      }

      const bookEntries = [...booksNeeded.entries()];

      for (let i = 0; i < bookEntries.length; i += 10) {
        if (cancelled) return;

        const batch = bookEntries.slice(i, i + 10);
        await Promise.all(
          batch.map(async ([bookAbbr, entries]) => {
            try {
              const meta = getBookByAbbr(bookAbbr);
              if (!meta) return;
              const bookData = await loadBook(translation, meta.file);
              if (cancelled) return;

              for (const { ref, parsed } of entries) {
                const chapterVerses = bookData.chapters[String(parsed.chapter)];
                if (!chapterVerses) continue;
                const parts = [];
                for (let v = parsed.verseStart; v <= parsed.verseEnd; v++) {
                  const found = chapterVerses.find(cv => cv.v === v);
                  if (found) parts.push(found.t);
                }
                if (parts.length > 0) {
                  result[ref] = parts.join(' ');
                }
              }
            } catch {
              // skip failed loads
            }
          })
        );
      }

      if (!cancelled) {
        prevKey.current = key;
        setTexts(result);
        setLoading(false);
      }
    };

    load();
    return () => {
      cancelled = true;
      // Reset prevKey so that the same refs can re-trigger loading after cancellation
      prevKey.current = '';
      setLoading(false);
    };
  }, [refs, translation, loadBook]);

  return useMemo(() => ({ texts, loading }), [texts, loading]);
}
