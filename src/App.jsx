import { useEffect, useState, useCallback } from 'react';
import { ReaderProvider, useReader } from './context/ReaderContext';
import Reader from './components/Reader';
import Navigation from './components/Navigation';
import TranslationPicker from './components/TranslationPicker';
import QuickNav from './components/QuickNav';
import { getBookByAbbr, slugToBookAbbr, makeVerseId, bookAbbrToSlug } from './utils/bible';
import { scrollToVerse } from './utils/scroll';

function AppHeader({ onOpenQuickNav }) {
  const { book, chapter, meta, toggleNav } = useReader();

  if (!meta || !book) return null;

  const bookMeta = getBookByAbbr(book);
  const bookName = bookMeta?.name || book;

  return (
    <header className="app-header">
      <button className="header-nav-btn" onClick={toggleNav} aria-label="Open navigation">
        <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.5">
          <line x1="2" y1="4" x2="16" y2="4" />
          <line x1="2" y1="9" x2="16" y2="9" />
          <line x1="2" y1="14" x2="16" y2="14" />
        </svg>
      </button>
      <button className="header-location" onClick={toggleNav}>
        <span className="header-book">{bookName}</span>
        <span className="header-chapter">{chapter}</span>
      </button>
      <button
        className="header-search-btn"
        onClick={onOpenQuickNav}
        aria-label="Quick navigation"
        title="Quick navigation (/)"
      >
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
          <circle cx="6.5" cy="6.5" r="4.5" />
          <line x1="10" y1="10" x2="14" y2="14" />
        </svg>
      </button>
      <TranslationPicker />
    </header>
  );
}

function HashRouter() {
  const { navigate, selectVerse, meta, book, chapter, selectedVerse } = useReader();

  // Parse URL hash on load and on hash change
  useEffect(() => {
    if (!meta) return;

    const handleHash = () => {
      const hash = window.location.hash.replace(/^#\/?/, '');
      if (!hash) return;

      const parts = hash.split('/');
      const bookSlug = parts[0];
      const ch = parseInt(parts[1], 10) || 1;
      const verse = parts[2] ? parseInt(parts[2], 10) : null;

      const abbr = slugToBookAbbr(bookSlug);
      if (!abbr) return;

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

  // Set initial URL hash when no hash is present
  useEffect(() => {
    if (!meta || !book) return;
    const hash = window.location.hash.replace(/^#\/?/, '');
    if (!hash) {
      history.replaceState(null, '', `#/${bookAbbrToSlug(book)}/${chapter}`);
    }
  }, [meta, book, chapter]);

  // Update URL when verse selection changes
  useEffect(() => {
    if (!meta || !book) return;

    if (selectedVerse) {
      const hash = `#/${bookAbbrToSlug(selectedVerse.book)}/${selectedVerse.chapter}/${selectedVerse.verse}`;
      if (window.location.hash !== hash) {
        history.replaceState(null, '', hash);
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

function AppInner() {
  const { navigate, navOpen, meta } = useReader();
  const [quickNavOpen, setQuickNavOpen] = useState(false);

  const openQuickNav = useCallback(() => {
    setQuickNavOpen(true);
  }, []);

  const closeQuickNav = useCallback(() => {
    setQuickNavOpen(false);
  }, []);

  const handleQuickNavigate = useCallback((abbr, chapter, verse) => {
    navigate(abbr, chapter);
    if (verse) {
      scrollToVerse(makeVerseId(abbr, chapter, verse));
    }
  }, [navigate]);

  // Global `/` key listener
  useEffect(() => {
    if (!meta) return;

    const handler = (e) => {
      const tag = e.target.tagName;
      if (tag === 'INPUT' || tag === 'SELECT' || tag === 'TEXTAREA') return;
      if (navOpen) return;

      if (e.key === '/') {
        e.preventDefault();
        setQuickNavOpen(true);
      }
    };

    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [meta, navOpen]);

  return (
    <>
      <HashRouter />
      <div className="app">
        <AppHeader onOpenQuickNav={openQuickNav} />
        <main className="app-main">
          <Reader />
        </main>
        <Navigation />
        {quickNavOpen && (
          <QuickNav
            onNavigate={handleQuickNavigate}
            onClose={closeQuickNav}
          />
        )}
      </div>
    </>
  );
}

export default function App() {
  return (
    <ReaderProvider>
      <AppInner />
    </ReaderProvider>
  );
}
