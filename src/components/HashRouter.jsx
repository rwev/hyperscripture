import { useEffect, useRef } from 'react';
import { useReader } from '../context/ReaderContext';
import { slugToBookAbbr, makeVerseId, bookAbbrToSlug } from '../utils/bible';
import { scrollToVerse } from '../utils/scroll';

/**
 * Hash-based router that synchronizes URL hash with reader state.
 *
 * - Explicit navigations (navigate/selectVerse) use pushState for back/forward support.
 * - Scroll-tracking chapter updates use replaceState to avoid history pollution.
 * - Initial load with a URL hash navigates to that location rather than defaulting to Genesis.
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
        // No hash present: default to Genesis 1 on initial load
        if (!initialNavDone.current) {
          initialNavDone.current = true;
          navigate(meta.books[0].abbr, 1);
          history.replaceState(null, '', `#/${bookAbbrToSlug(meta.books[0].abbr)}/1`);
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
  useEffect(() => {
    if (!meta || !book) return;

    if (selectedVerse) {
      const hash = `#/${bookAbbrToSlug(selectedVerse.book)}/${selectedVerse.chapter}/${selectedVerse.verse}`;
      if (window.location.hash !== hash) {
        history.pushState(null, '', hash);
      }
    } else {
      const hash = `#/${bookAbbrToSlug(book)}/${chapter}`;
      if (window.location.hash !== hash) {
        history.replaceState(null, '', hash);
      }
    }
  }, [selectedVerse, meta, book, chapter]);

  return null;
}
