import { memo } from 'react';
import { useReader } from '../context/ReaderContext';
import { getBookByAbbr } from '../utils/bible';
import TranslationPicker from './TranslationPicker';

/**
 * Application header bar with book/chapter display, nav trigger, and search button.
 */
const AppHeader = memo(function AppHeader({ onOpenQuickNav }) {
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
});

export default AppHeader;
