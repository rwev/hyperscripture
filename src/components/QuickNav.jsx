import { useState, useEffect, useRef, useCallback } from 'react';
import { resolveInput } from '../utils/fuzzyBook';

/**
 * Command-palette style fuzzy-find overlay for quick Bible navigation.
 * Triggered by pressing `/`. Parses inputs like "gen3", "john3:16", "1cor2".
 */
export default function QuickNav({ onNavigate, onClose }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef(null);
  const overlayRef = useRef(null);

  // Focus input on mount
  useEffect(() => {
    requestAnimationFrame(() => {
      inputRef.current?.focus();
    });
  }, []);

  // Resolve results on every keystroke
  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      setSelectedIndex(0);
      return;
    }
    const r = resolveInput(query);
    setResults(r);
    setSelectedIndex(0);
  }, [query]);

  // Close on Escape, navigate on Enter, arrow keys for selection
  const handleKeyDown = useCallback((e) => {
    if (e.key === 'Escape') {
      e.preventDefault();
      onClose();
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (results.length > 0) {
        const selected = results[selectedIndex] || results[0];
        onNavigate(selected.abbr, selected.chapter, selected.verse);
        onClose();
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(i => Math.min(i + 1, results.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(i => Math.max(i - 1, 0));
    }
  }, [results, selectedIndex, onNavigate, onClose]);

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
    onNavigate(result.abbr, result.chapter, result.verse);
    onClose();
  }, [onNavigate, onClose]);

  return (
    <div className="quicknav-overlay" ref={overlayRef}>
      <div className="quicknav-palette">
        <div className="quicknav-input-wrap">
          <input
            ref={inputRef}
            className="quicknav-input"
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="john3:16, rom8, ps23…"
            spellCheck={false}
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="off"
          />
        </div>
        {results.length > 0 && (
          <ul className="quicknav-results">
            {results.map((r, i) => (
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
