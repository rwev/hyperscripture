import { useEffect, useState, useCallback, useRef } from 'react';
import { ReaderProvider, useReader } from './context/ReaderContext';
import Reader from './components/Reader';
import Navigation from './components/Navigation';
import AppHeader from './components/AppHeader';
import HashRouter from './components/HashRouter';
import ErrorBoundary from './components/ErrorBoundary';
import QuickNav from './components/QuickNav';
import Bookmarks from './components/Bookmarks';
import { makeVerseId } from './utils/bible';
import { scrollToVerse } from './utils/scroll';

// ── Theme persistence ─────────────────────────────────────────────────

const THEME_KEY = 'hyperscripture:theme';

/**
 * Resolve the initial theme: saved preference > system preference > light.
 */
function getInitialTheme() {
  try {
    const saved = localStorage.getItem(THEME_KEY);
    if (saved === 'dark' || saved === 'light') return saved;
  } catch {
    // localStorage unavailable
  }
  if (window.matchMedia?.('(prefers-color-scheme: dark)').matches) return 'dark';
  return 'light';
}

// ── Font size persistence ─────────────────────────────────────────────

const FONT_SIZE_KEY = 'hyperscripture:font-size';
const FONT_STEPS = [1, 1.125, 1.25, 1.375, 1.5, 1.625, 1.75];
const FONT_DEFAULT_INDEX = 2; // 1.25rem

/**
 * Resolve the initial font size index from localStorage.
 */
function getInitialFontIndex() {
  try {
    const saved = parseInt(localStorage.getItem(FONT_SIZE_KEY), 10);
    if (saved >= 0 && saved < FONT_STEPS.length) return saved;
  } catch {
    // localStorage unavailable
  }
  return FONT_DEFAULT_INDEX;
}

/**
 * Inner app shell that consumes ReaderProvider context.
 * Manages QuickNav overlay and global keyboard shortcuts.
 */
function AppInner() {
  const { navigate, navOpen, meta, error } = useReader();
  const [quickNavOpen, setQuickNavOpen] = useState(false);
  const [bookmarksOpen, setBookmarksOpen] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);
  const navOpenRef = useRef(navOpen);

  // Keep ref in sync to avoid reinstalling the keydown listener on navOpen changes
  useEffect(() => { navOpenRef.current = navOpen; }, [navOpen]);

  // ── Theme ─────────────────────────────────────────────────────────────

  const [theme, setTheme] = useState(getInitialTheme);

  // Apply theme attribute to <html> and persist
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    try { localStorage.setItem(THEME_KEY, theme); } catch { /* ignore */ }
  }, [theme]);

  const toggleTheme = useCallback(() => {
    setTheme(t => t === 'dark' ? 'light' : 'dark');
  }, []);

  // ── Font size ───────────────────────────────────────────────────────

  const [fontIndex, setFontIndex] = useState(getInitialFontIndex);

  // Apply font size to <html> as a --text-base override and persist
  useEffect(() => {
    document.documentElement.style.setProperty('--text-base', `${FONT_STEPS[fontIndex]}rem`);
    try { localStorage.setItem(FONT_SIZE_KEY, String(fontIndex)); } catch { /* ignore */ }
  }, [fontIndex]);

  const increaseFontSize = useCallback(() => {
    setFontIndex(i => Math.min(i + 1, FONT_STEPS.length - 1));
  }, []);

  const decreaseFontSize = useCallback(() => {
    setFontIndex(i => Math.max(i - 1, 0));
  }, []);

  const resetFontSize = useCallback(() => {
    setFontIndex(FONT_DEFAULT_INDEX);
  }, []);

  const openQuickNav = useCallback(() => {
    setQuickNavOpen(true);
  }, []);

  const closeQuickNav = useCallback(() => {
    setQuickNavOpen(false);
  }, []);

  const closeBookmarks = useCallback(() => {
    setBookmarksOpen(false);
  }, []);

  const handleQuickNavigate = useCallback((abbr, chapter, verse) => {
    navigate(abbr, chapter);
    if (verse) {
      scrollToVerse(makeVerseId(abbr, chapter, verse));
    }
  }, [navigate]);

  // Global keyboard shortcuts (uses ref to avoid listener churn)
  useEffect(() => {
    if (!meta) return;

    const handler = (e) => {
      // Escape closes any overlay
      if (e.key === 'Escape' && helpOpen) {
        e.preventDefault();
        setHelpOpen(false);
        return;
      }

      const tag = e.target.tagName;
      if (tag === 'INPUT' || tag === 'SELECT' || tag === 'TEXTAREA') return;
      if (navOpenRef.current) return;

      if (e.key === '?') {
        e.preventDefault();
        setHelpOpen(prev => !prev);
      } else if (e.key === '/') {
        e.preventDefault();
        setQuickNavOpen(true);
      } else if (e.key === 'B') {
        e.preventDefault();
        setBookmarksOpen(true);
      } else if (e.key === 'd' && !e.metaKey && !e.ctrlKey) {
        toggleTheme();
      } else if ((e.key === '+' || e.key === '=') && !e.metaKey && !e.ctrlKey) {
        e.preventDefault();
        increaseFontSize();
      } else if (e.key === '-' && !e.metaKey && !e.ctrlKey) {
        e.preventDefault();
        decreaseFontSize();
      } else if (e.key === '0' && !e.metaKey && !e.ctrlKey) {
        resetFontSize();
      }
    };

    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [meta, helpOpen, toggleTheme, increaseFontSize, decreaseFontSize, resetFontSize]);

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
        {bookmarksOpen && (
          <Bookmarks
            onNavigate={handleQuickNavigate}
            onClose={closeBookmarks}
          />
        )}
        {helpOpen && (
          <div className="help-overlay" onClick={() => setHelpOpen(false)}>
            <div className="help-panel" onClick={(e) => e.stopPropagation()}>
              <div className="help-header">
                <span className="help-title">Keyboard Shortcuts</span>
                <button className="nav-close" onClick={() => setHelpOpen(false)} aria-label="Close help">&times;</button>
              </div>
              <div className="help-body">
                <div className="help-section">
                  <div className="help-section-title">Navigation</div>
                  <div className="help-row"><kbd>/</kbd><span>Quick navigation</span></div>
                  <div className="help-row"><kbd>&larr;</kbd> <kbd>&rarr;</kbd><span>Previous / next chapter</span></div>
                  <div className="help-row"><kbd>f</kbd><span>Search in text</span></div>
                  <div className="help-row"><kbd>b</kbd><span>Go back in cross-ref trail</span></div>
                  <div className="help-row"><kbd>Esc</kbd><span>Close overlay</span></div>
                </div>
                <div className="help-section">
                  <div className="help-section-title">Verse Actions</div>
                  <div className="help-row"><kbd>c</kbd><span>Copy verse text</span></div>
                  <div className="help-row"><kbd>s</kbd><span>Copy share link</span></div>
                  <div className="help-row"><kbd>m</kbd><span>Toggle bookmark</span></div>
                  <div className="help-row"><kbd>n</kbd><span>Edit note</span></div>
                </div>
                <div className="help-section">
                  <div className="help-section-title">Display</div>
                  <div className="help-row"><kbd>d</kbd><span>Toggle dark mode</span></div>
                  <div className="help-row"><kbd>w</kbd><span>Word frequency patterns</span></div>
                  <div className="help-row"><kbd>+</kbd> <kbd>-</kbd><span>Font size</span></div>
                  <div className="help-row"><kbd>0</kbd><span>Reset font size</span></div>
                </div>
                <div className="help-section">
                  <div className="help-section-title">Collections</div>
                  <div className="help-row"><kbd>B</kbd><span>Open bookmarks</span></div>
                  <div className="help-row"><kbd>?</kbd><span>This help</span></div>
                </div>
              </div>
            </div>
          </div>
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
