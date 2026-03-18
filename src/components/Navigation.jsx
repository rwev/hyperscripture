import { useState, useEffect, useRef, useCallback } from 'react';
import { useReader } from '../context/ReaderContext';

/**
 * Full-screen book/chapter navigation overlay.
 */
export default function Navigation() {
  const { meta, navOpen, closeNav, navigate, book: currentBook, chapter: currentChapter } = useReader();
  const [expandedBook, setExpandedBook] = useState(null);
  const overlayRef = useRef(null);
  const expandedRef = useRef(null);

  // Reset expanded book when opening
  useEffect(() => {
    if (navOpen) {
      setExpandedBook(null);
    }
  }, [navOpen]);

  // Close on Escape
  useEffect(() => {
    if (!navOpen) return;
    const handler = (e) => {
      if (e.key === 'Escape') closeNav();
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [navOpen, closeNav]);

  // Scroll expanded book into view
  useEffect(() => {
    if (expandedRef.current) {
      expandedRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }, [expandedBook]);

  const handleBookClick = useCallback((abbr) => {
    setExpandedBook(prev => prev === abbr ? null : abbr);
  }, []);

  const handleChapterClick = useCallback((bookAbbr, chapter) => {
    navigate(bookAbbr, chapter);
  }, [navigate]);

  if (!navOpen || !meta) return null;

  const otBooks = meta.books.filter(b => b.testament === 'OT');
  const ntBooks = meta.books.filter(b => b.testament === 'NT');

  const renderBookList = (books) => (
    <ul className="nav-book-list">
      {books.map(book => (
        <li
          key={book.abbr}
          className={`nav-book-item${book.abbr === currentBook ? ' current' : ''}${book.abbr === expandedBook ? ' expanded' : ''}`}
          ref={book.abbr === expandedBook ? expandedRef : undefined}
        >
          <button
            className="nav-book-btn"
            onClick={() => handleBookClick(book.abbr)}
          >
            {book.name}
            {book.abbr === currentBook && (
              <span className="nav-current-indicator" />
            )}
          </button>
          {book.abbr === expandedBook && (
            <div className="nav-chapters">
              {Array.from({ length: book.chapters }, (_, i) => i + 1).map(ch => (
                <button
                  key={ch}
                  className={`nav-chapter-btn${book.abbr === currentBook && ch === currentChapter ? ' current' : ''}`}
                  onClick={() => handleChapterClick(book.abbr, ch)}
                >
                  {ch}
                </button>
              ))}
            </div>
          )}
        </li>
      ))}
    </ul>
  );

  return (
    <div className="nav-overlay" ref={overlayRef}>
      <div className="nav-header">
        <h2 className="nav-title">Navigate</h2>
        <button className="nav-close" onClick={closeNav} aria-label="Close navigation">
          &times;
        </button>
      </div>
      <div className="nav-body">
        <div className="nav-testament">
          <h3 className="nav-testament-title">Old Testament</h3>
          {renderBookList(otBooks)}
        </div>
        <div className="nav-testament">
          <h3 className="nav-testament-title">New Testament</h3>
          {renderBookList(ntBooks)}
        </div>
      </div>
    </div>
  );
}
