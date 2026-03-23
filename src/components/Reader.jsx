import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useReader } from '../context/ReaderContext';
import { useBibleText } from '../hooks/useBibleText';
import { useCrossRefs } from '../hooks/useCrossRefs';
import { useMediaQuery } from '../hooks/useMediaQuery';
import { getBookByAbbr, getNextBook, getPrevBook, makeVerseId, bookAbbrToSlug } from '../utils/bible';
import { scrollToVerse } from '../utils/scroll';
import Chapter from './Chapter';
import { useCrossRefColumns, PriorColumn, LaterColumn } from './CrossRefColumns';
import CrossRefMobile from './CrossRefMobile';

const EMPTY_REFS = [];

/**
 * Main reader component with infinite scroll and cross-reference integration.
 *
 * Manages a list of "blocks" (chapters) that grow as the user scrolls.
 * Each block = { bookAbbr, bookName, chapter, verses, crossRefs }
 *
 * Key design: the initial load effect is triggered by `navId` from the context,
 * which increments only on explicit navigation (navigate() calls).
 * Passive scroll-tracking (setChapter) does NOT change navId and therefore
 * does NOT re-trigger the initial load, allowing the infinite scroll to
 * accumulate content across chapter and book boundaries.
 */
export default function Reader() {
  const {
    book, chapter, translation, meta, navId,
    selectedVerse, selectVerse, deselectVerse, navigate, setChapter,
  } = useReader();

  const { loadBook, getVerses } = useBibleText();
  const { loadRefs, getRefsForVerse } = useCrossRefs();
  const isDesktop = useMediaQuery('(min-width: 1024px)');

  const [blocks, setBlocks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [initialScrollDone, setInitialScrollDone] = useState(false);

  const scrollRef = useRef(null);
  const topSentinelRef = useRef(null);
  const bottomSentinelRef = useRef(null);
  const loadingRef = useRef(false);
  const blocksRef = useRef([]);
  const scrollTargetRef = useRef(null);
  const selectedVerseRef = useRef(selectedVerse);
  const scrollCancelRef = useRef(null);

  // ── Cross-reference breadcrumb trail ──────────────────────────────
  const trailRef = useRef([]);
  const [trailLength, setTrailLength] = useState(0);

  // Refs for keyboard handler and initial-load effect to avoid listener/effect churn
  const bookRef = useRef(book);
  const chapterRef = useRef(chapter);

  // Keep refs in sync with state (consolidated into a single effect)
  useEffect(() => {
    blocksRef.current = blocks;
    selectedVerseRef.current = selectedVerse;
    bookRef.current = book;
    chapterRef.current = chapter;
  }, [blocks, selectedVerse, book, chapter]);

  // ── Load a chapter block ──────────────────────────────────────────────

  const loadChapterBlock = useCallback(async (bookAbbr, chapterNum) => {
    const bookMeta = getBookByAbbr(bookAbbr);
    if (!bookMeta) return null;

    const bookData = await loadBook(translation, bookMeta.file);
    const verses = getVerses(bookData, chapterNum);
    if (!verses || verses.length === 0) return null;

    let crossRefs = {};
    try {
      crossRefs = await loadRefs(bookAbbr);
    } catch {
      // Cross-ref load failed; degrade gracefully with empty refs
    }

    return {
      bookAbbr,
      bookName: bookMeta.name,
      chapter: chapterNum,
      verses,
      crossRefs: crossRefs || {},
    };
  }, [translation, loadBook, getVerses, loadRefs]);

  // ── Initial load (only on explicit navigation) ────────────────────────
  // Uses refs for book/chapter so they don't need to be in the dep array.
  // navId increments only on navigate() calls, not on scroll-tracking setChapter().

  useEffect(() => {
    if (!bookRef.current || !meta) return;

    let cancelled = false;
    setLoading(true);
    setInitialScrollDone(false);

    // Cancel any in-progress scrollToVerse from a previous navigation
    if (scrollCancelRef.current) {
      scrollCancelRef.current();
      scrollCancelRef.current = null;
    }

    const currentBook = bookRef.current;
    const currentChapter = chapterRef.current;

    const init = async () => {
      const bookMeta = getBookByAbbr(currentBook);
      if (!bookMeta) return;

      const chaptersToLoad = [];
      const startCh = Math.max(1, currentChapter - 1);
      const endCh = Math.min(bookMeta.chapters, currentChapter + 2);

      for (let ch = startCh; ch <= endCh; ch++) {
        chaptersToLoad.push({ bookAbbr: currentBook, chapter: ch });
      }

      const loaded = [];
      for (const { bookAbbr, chapter: ch } of chaptersToLoad) {
        const block = await loadChapterBlock(bookAbbr, ch);
        if (block && !cancelled) loaded.push(block);
      }

      if (!cancelled) {
        setBlocks(loaded);
        setLoading(false);
        scrollTargetRef.current = { book: currentBook, chapter: currentChapter };
      }
    };

    init();
    return () => { cancelled = true; };
  }, [navId, translation, meta, loadChapterBlock]);

  // ── Scroll to target chapter after blocks update ─────────────────────

  useEffect(() => {
    if (!scrollTargetRef.current || blocks.length === 0) return;

    const target = scrollTargetRef.current;
    scrollTargetRef.current = null;

    requestAnimationFrame(() => {
      const el = document.querySelector(
        `[data-book="${target.book}"][data-chapter="${target.chapter}"]`
      );
      if (el && scrollRef.current) {
        const containerTop = scrollRef.current.getBoundingClientRect().top;
        const elTop = el.getBoundingClientRect().top;
        scrollRef.current.scrollTop += (elTop - containerTop - 20);
      }
      setInitialScrollDone(true);
    });
  }, [blocks]);

  // ── Load more content (infinite scroll) ──────────────────────────────

  const loadMore = useCallback(async (direction) => {
    if (loadingRef.current) return;
    loadingRef.current = true;

    try {
      const currentBlocks = blocksRef.current;
      if (currentBlocks.length === 0) return;

      if (direction === 'down') {
        const last = currentBlocks[currentBlocks.length - 1];
        const bookMeta = getBookByAbbr(last.bookAbbr);

        let nextBookAbbr = last.bookAbbr;
        let nextChapter = last.chapter + 1;

        if (nextChapter > bookMeta.chapters) {
          const nextBook = getNextBook(last.bookAbbr);
          if (!nextBook) return;
          nextBookAbbr = nextBook.abbr;
          nextChapter = 1;
        }

        const block = await loadChapterBlock(nextBookAbbr, nextChapter);
        if (block) {
          setBlocks(prev => [...prev, block]);
        }
      } else {
        const first = currentBlocks[0];

        let prevBookAbbr = first.bookAbbr;
        let prevChapter = first.chapter - 1;

        if (prevChapter < 1) {
          const prevBook = getPrevBook(first.bookAbbr);
          if (!prevBook) return;
          prevBookAbbr = prevBook.abbr;
          prevChapter = prevBook.chapters;
        }

        const scrollEl = scrollRef.current;
        const prevScrollHeight = scrollEl?.scrollHeight || 0;

        const block = await loadChapterBlock(prevBookAbbr, prevChapter);
        if (block) {
          setBlocks(prev => [block, ...prev]);

          requestAnimationFrame(() => {
            if (scrollEl) {
              const newScrollHeight = scrollEl.scrollHeight;
              scrollEl.scrollTop += (newScrollHeight - prevScrollHeight);
            }
          });
        }
      }
    } finally {
      loadingRef.current = false;
    }
  }, [loadChapterBlock]);

  // ── IntersectionObserver for infinite scroll ─────────────────────────

  useEffect(() => {
    if (!initialScrollDone) return;

    const options = {
      root: scrollRef.current,
      rootMargin: '400px',
      threshold: 0,
    };

    const observer = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          if (entry.target === bottomSentinelRef.current) {
            loadMore('down');
          } else if (entry.target === topSentinelRef.current) {
            loadMore('up');
          }
        }
      }
    }, options);

    if (topSentinelRef.current) observer.observe(topSentinelRef.current);
    if (bottomSentinelRef.current) observer.observe(bottomSentinelRef.current);

    return () => observer.disconnect();
  }, [initialScrollDone, loadMore]);

  // ── Track current chapter/book position on scroll ────────────────────

  useEffect(() => {
    if (!initialScrollDone) return;
    const scrollEl = scrollRef.current;
    if (!scrollEl) return;

    let ticking = false;
    let lastUpdate = 0;
    const handler = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        ticking = false;

        const now = Date.now();
        if (now - lastUpdate < 300) return;

        const chapters = scrollEl.querySelectorAll('.chapter');
        const containerTop = scrollEl.getBoundingClientRect().top;

        let currentSection = null;
        for (const ch of chapters) {
          const rect = ch.getBoundingClientRect();
          if (rect.top - containerTop <= 100) {
            currentSection = ch;
          }
        }

        if (currentSection) {
          const bookAbbr = currentSection.dataset.book;
          const ch = parseInt(currentSection.dataset.chapter, 10);
          if (bookAbbr && !isNaN(ch)) {
            lastUpdate = now;
            setChapter(ch, bookAbbr);
            // URL sync is handled by HashRouter via replaceState
          }
        }
      });
    };

    scrollEl.addEventListener('scroll', handler, { passive: true });
    return () => scrollEl.removeEventListener('scroll', handler);
  }, [initialScrollDone, setChapter]);

  // ── Toast (shared by copy and share) ────────────────────────────────

  const [toast, setToast] = useState(null);
  const toastTimerRef = useRef(null);

  const showToast = useCallback((message) => {
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    setToast(message);
    toastTimerRef.current = setTimeout(() => setToast(null), 2000);
  }, []);

  // ── Copy verse to clipboard ─────────────────────────────────────────

  const copySelectedVerse = useCallback(() => {
    const sv = selectedVerseRef.current;
    if (!sv) return;

    const currentBlocks = blocksRef.current;
    const block = currentBlocks.find(
      b => b.bookAbbr === sv.book && b.chapter === sv.chapter
    );
    if (!block) return;

    const verseData = block.verses.find(v => v.v === sv.verse);
    if (!verseData) return;

    const bookMeta = getBookByAbbr(sv.book);
    const bookName = bookMeta ? bookMeta.name : sv.book;
    const citation = `${bookName} ${sv.chapter}:${sv.verse}`;
    const text = `${verseData.t}\n— ${citation} (${translation})`;

    navigator.clipboard.writeText(text).then(() => {
      showToast(`Copied ${citation}`);
    }).catch(() => {
      // Clipboard API unavailable; degrade silently
    });
  }, [translation, showToast]);

  // ── Share verse link ──────────────────────────────────────────────────

  const shareSelectedVerse = useCallback(() => {
    const sv = selectedVerseRef.current;
    if (!sv) return;

    const hash = `#/${bookAbbrToSlug(sv.book)}/${sv.chapter}/${sv.verse}`;
    const url = `${window.location.origin}${window.location.pathname}${hash}`;

    navigator.clipboard.writeText(url).then(() => {
      const bookMeta = getBookByAbbr(sv.book);
      const bookName = bookMeta ? bookMeta.name : sv.book;
      showToast(`Link copied — ${bookName} ${sv.chapter}:${sv.verse}`);
    }).catch(() => {
      // Clipboard API unavailable; degrade silently
    });
  }, [showToast]);

  // ── Cross-reference navigation (navigate + re-select) ───────────────

  const handleCrossRefNavigate = useCallback((targetBook, targetChapter, targetVerse) => {
    // Push current position onto breadcrumb trail before following the ref
    const sv = selectedVerseRef.current;
    const currentBook = bookRef.current;
    const currentChapter = chapterRef.current;
    if (currentBook) {
      trailRef.current = [...trailRef.current, {
        book: sv?.book ?? currentBook,
        chapter: sv?.chapter ?? currentChapter,
        verse: sv?.verse ?? null,
      }];
      setTrailLength(trailRef.current.length);
    }

    // Cancel any previous scroll attempt
    if (scrollCancelRef.current) {
      scrollCancelRef.current();
    }

    navigate(targetBook, targetChapter);
    const cancel = scrollToVerse(makeVerseId(targetBook, targetChapter, targetVerse), {
      onFound: () => {
        setTimeout(() => selectVerse(targetBook, targetChapter, targetVerse), 100);
      },
    });
    scrollCancelRef.current = cancel;
  }, [navigate, selectVerse]);

  const navigateBack = useCallback(() => {
    if (trailRef.current.length === 0) return;
    const prev = trailRef.current[trailRef.current.length - 1];
    trailRef.current = trailRef.current.slice(0, -1);
    setTrailLength(trailRef.current.length);

    if (scrollCancelRef.current) {
      scrollCancelRef.current();
    }

    navigate(prev.book, prev.chapter);
    if (prev.verse) {
      const cancel = scrollToVerse(makeVerseId(prev.book, prev.chapter, prev.verse), {
        onFound: () => {
          setTimeout(() => selectVerse(prev.book, prev.chapter, prev.verse), 100);
        },
      });
      scrollCancelRef.current = cancel;
    }
  }, [navigate, selectVerse]);

  // ── Keyboard navigation (uses refs to avoid listener churn) ──────────

  useEffect(() => {
    const handler = (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'SELECT') return;
      const b = bookRef.current;
      const ch = chapterRef.current;

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

      if (e.key === 'b' && !e.metaKey && !e.ctrlKey) {
        navigateBack();
        return;
      }

      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        if (ch > 1) {
          navigate(b, ch - 1);
        } else {
          const prev = getPrevBook(b);
          if (prev) navigate(prev.abbr, prev.chapters);
        }
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        const bookMeta = getBookByAbbr(b);
        if (bookMeta && ch < bookMeta.chapters) {
          navigate(b, ch + 1);
        } else {
          const next = getNextBook(b);
          if (next) navigate(next.abbr, 1);
        }
      }
    };

    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [navigate, copySelectedVerse, shareSelectedVerse, navigateBack]);

  // ── Get cross-refs for selected verse ────────────────────────────────

  const selectedRefs = useMemo(() => {
    if (!selectedVerse) return EMPTY_REFS;
    return getRefsForVerse(selectedVerse.book, selectedVerse.chapter, selectedVerse.verse);
  }, [selectedVerse, getRefsForVerse]);

  const hasRefs = selectedVerse && selectedRefs.length > 0;

  const {
    prior, later, priorTexts, laterTexts, priorLoading, laterLoading,
  } = useCrossRefColumns(selectedVerse, selectedRefs);

  // ── Render ───────────────────────────────────────────────────────────

  if (loading && blocks.length === 0) {
    return (
      <div className="reader-loading">
        <div className="reader-loading-text">Loading...</div>
      </div>
    );
  }

  return (
    <div className={`reader${isDesktop && hasRefs ? ' with-refs' : ''}`}>
      {isDesktop && (
        <PriorColumn
          entries={prior}
          texts={priorTexts}
          loading={priorLoading}
          onNavigate={handleCrossRefNavigate}
        />
      )}

      {trailLength > 0 && (
        <button
          className="trail-back"
          onClick={navigateBack}
          aria-label={`Go back (${trailLength} step${trailLength !== 1 ? 's' : ''} in trail)`}
          title="Go back (b)"
        >
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5">
            <polyline points="7,2 3,6 7,10" />
          </svg>
          {trailLength > 1 && <span className="trail-depth">{trailLength}</span>}
        </button>
      )}

      <div className="reader-scroll" ref={scrollRef}>
        <div ref={topSentinelRef} className="scroll-sentinel" />
        <div className="reader-content">
          {blocks.map((block, i) => {
            const showBookHeading =
              block.chapter === 1 ||
              (i > 0 && blocks[i - 1].bookAbbr !== block.bookAbbr);

            return (
              <Chapter
                key={`${block.bookAbbr}-${block.chapter}`}
                bookAbbr={block.bookAbbr}
                bookName={block.bookName}
                chapter={block.chapter}
                verses={block.verses}
                showBookHeading={showBookHeading}
                crossRefData={block.crossRefs}
                selectedBook={selectedVerse?.book}
                selectedChapter={selectedVerse?.chapter}
                selectedVerseNum={selectedVerse?.verse}
                onSelectVerse={selectVerse}
              />
            );
          })}
        </div>
        <div ref={bottomSentinelRef} className="scroll-sentinel" />

        {!isDesktop && selectedVerse && selectedRefs.length > 0 && (
          <CrossRefMobile
            verse={selectedVerse}
            refs={selectedRefs}
            onNavigate={handleCrossRefNavigate}
            onClose={deselectVerse}
          />
        )}
      </div>

      {isDesktop && (
        <LaterColumn
          entries={later}
          texts={laterTexts}
          loading={laterLoading}
          onNavigate={handleCrossRefNavigate}
        />
      )}

      {toast && (
        <div className="copy-toast" key={toast}>
          {toast}
        </div>
      )}
    </div>
  );
}
