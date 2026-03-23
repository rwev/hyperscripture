import { useEffect, useRef } from 'react';
import { useReader } from '../context/ReaderContext';
import { slugToBookAbbr, makeVerseId, bookAbbrToSlug, getBookByAbbr } from '../utils/bible';
import { scrollToVerse } from '../utils/scroll';

// ── Reading position persistence ──────────────────────────────────────────

const POSITION_KEY = 'hyperscripture:position';

/**
 * Save the current reading position to localStorage.
 * @param {string} bookAbbr
 * @param {number} chapter
 */
function savePosition(bookAbbr, chapter) {
  try {
    localStorage.setItem(POSITION_KEY, JSON.stringify({ book: bookAbbr, chapter }));
  } catch {
    // Storage full or unavailable; degrade silently
  }
}

/**
 * Load the saved reading position from localStorage.
 * Returns null if no valid position is stored.
 * @returns {{ book: string, chapter: number } | null}
 */
function loadPosition() {
  try {
    const raw = localStorage.getItem(POSITION_KEY);
    if (!raw) return null;
    const pos = JSON.parse(raw);
    if (pos && typeof pos.book === 'string' && typeof pos.chapter === 'number' && getBookByAbbr(pos.book)) {
      return pos;
    }
  } catch {
    // Corrupt data; ignore
  }
  return null;
}

/**
 * Hash-based router that synchronizes URL hash with reader state.
 *
 * - Explicit navigations (navigate/selectVerse) use pushState for back/forward support.
 * - Scroll-tracking chapter updates use replaceState to avoid history pollution.
 * - Initial load with a URL hash navigates to that location rather than defaulting to Genesis.
 * - When no hash is present, resumes the last-read position from localStorage.
 */
export default function HashRouter() {
  const { navigate, selectVerse, meta, book, chapter, selectedVerse } = useReader();
  const initialNavDone = useRef(false);

  // Parse URL hash on load and on hash change
  useEffect(() => {
    if (!meta) return;

    const handleHash = () => {
      const hash = window.location.hash.replace(/^#\/?/, '');
      if (!hash) {
        // No hash present: resume saved position, or fall back to Genesis 1
        if (!initialNavDone.current) {
          initialNavDone.current = true;
          const saved = loadPosition();
          const startBook = saved?.book ?? meta.books[0].abbr;
          const startChapter = saved?.chapter ?? 1;
          navigate(startBook, startChapter);
          history.replaceState(null, '', `#/${bookAbbrToSlug(startBook)}/${startChapter}`);
        }
        return;
      }

      const parts = hash.split('/');
      const bookSlug = parts[0];
      const ch = parseInt(parts[1], 10) || 1;
      const verse = parts[2] ? parseInt(parts[2], 10) : null;

      const abbr = slugToBookAbbr(bookSlug);
      if (!abbr) return;

      initialNavDone.current = true;
      navigate(abbr, ch);

      if (verse) {
        scrollToVerse(makeVerseId(abbr, ch, verse), {
          onFound: () => selectVerse(abbr, ch, verse),
        });
      }
    };

    handleHash();
    window.addEventListener('hashchange', handleHash);
    return () => window.removeEventListener('hashchange', handleHash);
  }, [meta, navigate, selectVerse]);

  // Update URL when verse selection changes (pushState for back/forward support)
  // Also persist reading position to localStorage for session resumption.
  useEffect(() => {
    if (!meta || !book) return;

    if (selectedVerse) {
      const hash = `#/${bookAbbrToSlug(selectedVerse.book)}/${selectedVerse.chapter}/${selectedVerse.verse}`;
      if (window.location.hash !== hash) {
        history.pushState(null, '', hash);
      }
      savePosition(selectedVerse.book, selectedVerse.chapter);
    } else {
      const hash = `#/${bookAbbrToSlug(book)}/${chapter}`;
      if (window.location.hash !== hash) {
        history.replaceState(null, '', hash);
      }
      savePosition(book, chapter);
    }
  }, [selectedVerse, meta, book, chapter]);

  return null;
}
