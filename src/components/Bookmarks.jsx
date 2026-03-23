import { memo, useEffect, useRef, useCallback } from 'react';
import { useBookmarks } from '../hooks/useBookmarks';
import { getBookByAbbr } from '../utils/bible';
import { importUserData } from '../utils/userdata';

/**
 * Parse a verse ID like "Gen.1.1" into { book, chapter, verse }.
 * @param {string} id
 * @returns {{ book: string, chapter: number, verse: number } | null}
 */
function parseVerseId(id) {
  const parts = id.split('.');
  if (parts.length < 3) return null;
  const verse = parseInt(parts[parts.length - 1], 10);
  const chapter = parseInt(parts[parts.length - 2], 10);
  const book = parts.slice(0, parts.length - 2).join('.');
  if (isNaN(chapter) || isNaN(verse)) return null;
  return { book, chapter, verse };
}

/**
 * Format a verse ID into a human-readable citation.
 * @param {string} id
 * @returns {string}
 */
function formatCitation(id) {
  const parsed = parseVerseId(id);
  if (!parsed) return id;
  const bookMeta = getBookByAbbr(parsed.book);
  const bookName = bookMeta ? bookMeta.name : parsed.book;
  return `${bookName} ${parsed.chapter}:${parsed.verse}`;
}

/**
 * Full-screen bookmarks overlay showing all saved verses.
 * Uses its own useBookmarks instance (reads fresh from localStorage on mount).
 *
 * @param {{ onNavigate: Function, onClose: Function }} props
 */
const Bookmarks = memo(function Bookmarks({ onNavigate, onClose }) {
  const { bookmarks, toggle } = useBookmarks();
  const overlayRef = useRef(null);
  const fileInputRef = useRef(null);
  const entries = [...bookmarks].map(id => ({ id, ...parseVerseId(id) })).filter(e => e.book);

  const handleImport = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleFileChange = useCallback((e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      try {
        const data = JSON.parse(reader.result);
        const count = importUserData(data);
        if (count > 0) {
          // Reload to pick up imported data in all hooks
          window.location.reload();
        }
      } catch {
        // Invalid JSON; ignore
      }
    };
    reader.readAsText(file);
  }, []);

  useEffect(() => {
    const handler = (e) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [onClose]);

  const handleClick = (entry) => {
    onClose();
    onNavigate(entry.book, entry.chapter, entry.verse);
  };

  return (
    <div className="nav-overlay" ref={overlayRef} onClick={(e) => {
      if (e.target === overlayRef.current) onClose();
    }}>
      <div className="nav-header">
        <span className="nav-title">Bookmarks</span>
        <button className="nav-close" onClick={onClose} aria-label="Close bookmarks">&times;</button>
      </div>
      <div className="nav-body">
        {entries.length === 0 ? (
          <div className="bookmarks-empty">
            No bookmarks yet. Select a verse and press <kbd>m</kbd> to bookmark.
          </div>
        ) : (
          <div className="bookmarks-list">
            {entries.map(entry => (
              <div key={entry.id} className="bookmark-item">
                <button
                  className="bookmark-item-btn"
                  onClick={() => handleClick(entry)}
                >
                  {formatCitation(entry.id)}
                </button>
                <button
                  className="bookmark-remove"
                  onClick={() => toggle(entry.id)}
                  aria-label={`Remove bookmark ${formatCitation(entry.id)}`}
                  title="Remove"
                >
                  &times;
                </button>
              </div>
            ))}
          </div>
        )}
        <div className="bookmarks-footer">
          <button className="bookmarks-import-btn" onClick={handleImport}>
            Import backup
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".json"
            onChange={handleFileChange}
            style={{ display: 'none' }}
          />
        </div>
      </div>
    </div>
  );
});

export default Bookmarks;
