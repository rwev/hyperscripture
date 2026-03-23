import { useState, useEffect, useRef, useCallback } from 'react';
import { resolveInput } from '../utils/fuzzyBook';
import { getBookByAbbr } from '../utils/bible';
import { recordVisit, loadRecent } from '../utils/recent';

/**
 * Command-palette style fuzzy-find overlay for quick Bible navigation.
 * Triggered by pressing `/`. Parses inputs like "gen3", "john3:16", "1cor2".
 */
export default function QuickNav({ onNavigate, onClose }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [recents] = useState(loadRecent);
  const inputRef = useRef(null);
  const overlayRef = useRef(null);

  // Items to display: search results when typing, recents when empty
  const showRecents = !query.trim() && recents.length > 0;
  const displayItems = showRecents ? recents : results;

  // Focus input on mount
  useEffect(() => {
    requestAnimationFrame(() => {
      inputRef.current?.focus();
    });
  }, []);

  // Resolve results directly in onChange to avoid extra render cycle
  const handleChange = useCallback((e) => {
    const value = e.target.value;
    setQuery(value);
    if (!value.trim()) {
      setResults([]);
      setSelectedIndex(0);
    } else {
      setResults(resolveInput(value));
      setSelectedIndex(0);
    }
  }, []);

  // Close on click outside the palette
  useEffect(() => {
    const handler = (e) => {
      if (overlayRef.current && !overlayRef.current.querySelector('.quicknav-palette')?.contains(e.target)) {
        onClose();
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [onClose]);

  const handleItemClick = useCallback((result) => {
    // Build display label for recording
    const bookMeta = getBookByAbbr(result.abbr);
    const name = bookMeta?.name || result.name || result.abbr;
    const display = result.verse
      ? `${name} ${result.chapter}:${result.verse}`
      : `${name} ${result.chapter}`;
    recordVisit(result.abbr, result.chapter, result.verse, display);
    onNavigate(result.abbr, result.chapter, result.verse);
    onClose();
  }, [onNavigate, onClose]);

  // Close on Escape, navigate on Enter, arrow keys for selection
  const handleKeyDown = useCallback((e) => {
    if (e.key === 'Escape') {
      e.preventDefault();
      onClose();
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (displayItems.length > 0) {
        const selected = displayItems[selectedIndex] || displayItems[0];
        handleItemClick(selected);
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(i => Math.min(i + 1, displayItems.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(i => Math.max(i - 1, 0));
    }
  }, [displayItems, selectedIndex, handleItemClick, onClose]);

  return (
    <div className="quicknav-overlay" ref={overlayRef}>
      <div className="quicknav-palette">
        <div className="quicknav-input-wrap">
          <input
            ref={inputRef}
            className="quicknav-input"
            type="text"
            value={query}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            placeholder="john3:16, rom8, ps23…"
            spellCheck={false}
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="off"
          />
        </div>
        {displayItems.length > 0 && (
          <ul className="quicknav-results">
            {showRecents && (
              <li className="quicknav-section-label">Recent</li>
            )}
            {displayItems.map((r, i) => (
              <li
                key={`${r.abbr}-${r.chapter}-${r.verse}`}
                className={`quicknav-item${i === selectedIndex ? ' selected' : ''}`}
                onClick={() => handleItemClick(r)}
                onMouseEnter={() => setSelectedIndex(i)}
              >
                <span className="quicknav-item-display">{r.display}</span>
                {r.subtitle && (
                  <span className="quicknav-item-subtitle">{r.subtitle}</span>
                )}
              </li>
            ))}
          </ul>
        )}
        {query.trim() && results.length === 0 && (
          <div className="quicknav-empty">No matches</div>
        )}
      </div>
    </div>
  );
}
