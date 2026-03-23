const SWIPE_MIN_DISTANCE_PX = 80;
const SWIPE_MAX_ANGLE_RATIO = 0.6;

/**
 * Keyboard and touch gesture handler for the Reader component.
 *
 * Centralizes all Reader-scoped key bindings and the mobile swipe
 * gesture into a single hook to keep Reader.jsx focused on
 * scroll/render concerns.
 *
 * @param {object} deps - Named dependencies from Reader
 * @param {Function} deps.navigate - Navigate to book + chapter
 * @param {React.RefObject} deps.bookRef - Current book abbreviation ref
 * @param {React.RefObject} deps.chapterRef - Current chapter number ref
 * @param {React.RefObject} deps.selectedVerseRef - Current selected verse ref
 * @param {React.RefObject} deps.scrollRef - Reader scroll container ref
 * @param {Function} deps.copySelectedVerse
 * @param {Function} deps.shareSelectedVerse
 * @param {Function} deps.bookmarkSelectedVerse
 * @param {Function} deps.openNoteEditor
 * @param {Function} deps.openSearch
 * @param {Function} deps.toggleWordFreq
 * @param {Function} deps.toggleParallel
 * @param {Function} deps.navigateBack
 * @param {Function} deps.showToast
 * @param {Function} deps.setVersePerLine - State setter for verse-per-line mode
 */

import { useCallback, useEffect } from 'react';
import { getBookByAbbr, getNextBook, getPrevBook } from '../utils/bible';

export function useReaderKeys({
  navigate,
  bookRef,
  chapterRef,
  selectedVerseRef,
  scrollRef,
  copySelectedVerse,
  shareSelectedVerse,
  bookmarkSelectedVerse,
  openNoteEditor,
  openSearch,
  toggleWordFreq,
  toggleParallel,
  navigateBack,
  showToast,
  setVersePerLine,
}) {
  // ── Chapter navigation (shared by keyboard + touch swipe) ──────────

  const navigatePrev = useCallback(() => {
    const b = bookRef.current;
    const ch = chapterRef.current;
    if (ch > 1) {
      navigate(b, ch - 1);
    } else {
      const prev = getPrevBook(b);
      if (prev) navigate(prev.abbr, prev.chapters);
    }
  }, [navigate, bookRef, chapterRef]);

  const navigateNext = useCallback(() => {
    const b = bookRef.current;
    const ch = chapterRef.current;
    const bookMeta = getBookByAbbr(b);
    if (bookMeta && ch < bookMeta.chapters) {
      navigate(b, ch + 1);
    } else {
      const next = getNextBook(b);
      if (next) navigate(next.abbr, 1);
    }
  }, [navigate, bookRef, chapterRef]);

  // ── Keyboard navigation ───────────────────────────────────────────

  useEffect(() => {
    const handler = (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'SELECT' || e.target.tagName === 'TEXTAREA') return;

      if (e.key === 'c' && !e.metaKey && !e.ctrlKey) {
        if (selectedVerseRef.current) {
          e.preventDefault();
          copySelectedVerse();
        }
        return;
      }

      if (e.key === 's' && !e.metaKey && !e.ctrlKey) {
        if (selectedVerseRef.current) {
          e.preventDefault();
          shareSelectedVerse();
        }
        return;
      }

      if (e.key === 'm' && !e.metaKey && !e.ctrlKey) {
        if (selectedVerseRef.current) {
          e.preventDefault();
          bookmarkSelectedVerse();
        }
        return;
      }

      if (e.key === 'n' && !e.metaKey && !e.ctrlKey) {
        if (selectedVerseRef.current) {
          e.preventDefault();
          openNoteEditor();
        }
        return;
      }

      if (e.key === 'l' && !e.metaKey && !e.ctrlKey) {
        e.preventDefault();
        setVersePerLine(prev => {
          showToast(prev ? 'Prose mode' : 'Verse-per-line');
          return !prev;
        });
        return;
      }

      if (e.key === 'p' && !e.metaKey && !e.ctrlKey) {
        e.preventDefault();
        toggleParallel();
        return;
      }

      if (e.key === 'f' && !e.metaKey && !e.ctrlKey) {
        e.preventDefault();
        openSearch();
        return;
      }

      if (e.key === 'w' && !e.metaKey && !e.ctrlKey) {
        e.preventDefault();
        toggleWordFreq();
        return;
      }

      if (e.key === 'b' && !e.metaKey && !e.ctrlKey) {
        navigateBack();
        return;
      }

      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        navigatePrev();
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        navigateNext();
      }
    };

    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [navigatePrev, navigateNext, copySelectedVerse, shareSelectedVerse, bookmarkSelectedVerse, openNoteEditor, showToast, setVersePerLine, toggleParallel, openSearch, toggleWordFreq, navigateBack, selectedVerseRef]);

  // ── Touch swipe navigation (mobile chapter switching) ─────────────

  useEffect(() => {
    const scrollEl = scrollRef.current;
    if (!scrollEl) return;

    let startX = 0;
    let startY = 0;

    const onTouchStart = (e) => {
      if (e.touches.length !== 1) return;
      startX = e.touches[0].clientX;
      startY = e.touches[0].clientY;
    };

    const onTouchEnd = (e) => {
      if (e.changedTouches.length !== 1) return;
      const dx = e.changedTouches[0].clientX - startX;
      const dy = e.changedTouches[0].clientY - startY;

      // Require horizontal swipe: sufficient distance, angle < 30° from horizontal
      if (Math.abs(dx) < SWIPE_MIN_DISTANCE_PX || Math.abs(dy) > Math.abs(dx) * SWIPE_MAX_ANGLE_RATIO) return;

      if (dx > 0) {
        navigatePrev();
      } else {
        navigateNext();
      }
    };

    scrollEl.addEventListener('touchstart', onTouchStart, { passive: true });
    scrollEl.addEventListener('touchend', onTouchEnd, { passive: true });
    return () => {
      scrollEl.removeEventListener('touchstart', onTouchStart);
      scrollEl.removeEventListener('touchend', onTouchEnd);
    };
  }, [navigatePrev, navigateNext, scrollRef]);
}
