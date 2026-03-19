import { useEffect, useState, useCallback, useRef } from 'react';
import { ReaderProvider, useReader } from './context/ReaderContext';
import Reader from './components/Reader';
import Navigation from './components/Navigation';
import AppHeader from './components/AppHeader';
import HashRouter from './components/HashRouter';
import ErrorBoundary from './components/ErrorBoundary';
import QuickNav from './components/QuickNav';
import { makeVerseId } from './utils/bible';
import { scrollToVerse } from './utils/scroll';

/**
 * Inner app shell that consumes ReaderProvider context.
 * Manages QuickNav overlay and global keyboard shortcuts.
 */
function AppInner() {
  const { navigate, navOpen, meta, error } = useReader();
  const [quickNavOpen, setQuickNavOpen] = useState(false);
  const navOpenRef = useRef(navOpen);

  // Keep ref in sync to avoid reinstalling the keydown listener on navOpen changes
  useEffect(() => { navOpenRef.current = navOpen; }, [navOpen]);

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

  // Global `/` key listener (uses ref to avoid listener churn)
  useEffect(() => {
    if (!meta) return;

    const handler = (e) => {
      const tag = e.target.tagName;
      if (tag === 'INPUT' || tag === 'SELECT' || tag === 'TEXTAREA') return;
      if (navOpenRef.current) return;

      if (e.key === '/') {
        e.preventDefault();
        setQuickNavOpen(true);
      }
    };

    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [meta]);

  // Display error state from context
  if (error) {
    return (
      <div className="reader-loading">
        <div className="reader-loading-text">
          Failed to load: {error}
        </div>
      </div>
    );
  }

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
    <ErrorBoundary>
      <ReaderProvider>
        <AppInner />
      </ReaderProvider>
    </ErrorBoundary>
  );
}
