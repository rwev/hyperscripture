import { useEffect, useRef, useMemo, useCallback } from 'react';
import {
  formatReference, parseReference, getVersePosition,
} from '../utils/bible';
import { useRefTexts } from '../hooks/useRefTexts';
import { useReader } from '../context/ReaderContext';

/**
 * Partition refs into prior/later, sorted by ascending distance.
 */
function partitionRefs(refs, selectedVerse) {
  if (!refs || !selectedVerse) return { prior: [], later: [] };

  const selectedPos = getVersePosition(
    selectedVerse.book, selectedVerse.chapter, selectedVerse.verse
  );

  const prior = [];
  const later = [];

  for (const [ref, votes] of refs) {
    const parsed = parseReference(ref);
    if (!parsed) continue;
    const pos = getVersePosition(parsed.book, parsed.chapter, parsed.verseStart);
    const distance = Math.abs(pos - selectedPos);
    if (pos < selectedPos) {
      prior.push({ ref, votes, distance });
    } else if (pos > selectedPos) {
      later.push({ ref, votes, distance });
    }
  }

  prior.sort((a, b) => a.distance - b.distance);
  later.sort((a, b) => a.distance - b.distance);

  return { prior, later };
}

/**
 * Mobile cross-reference popover with Prior / Later sections.
 */
export default function CrossRefMobile({ verse, refs, onNavigate, onClose }) {
  const popoverRef = useRef(null);
  const { translation } = useReader();

  const { prior, later } = useMemo(
    () => partitionRefs(refs, verse),
    [refs, verse]
  );

  // Cap for mobile performance
  const cappedPrior = useMemo(() => prior.slice(0, 25), [prior]);
  const cappedLater = useMemo(() => later.slice(0, 25), [later]);

  const priorRefArr = useMemo(() => cappedPrior.map(p => [p.ref, p.votes]), [cappedPrior]);
  const laterRefArr = useMemo(() => cappedLater.map(l => [l.ref, l.votes]), [cappedLater]);

  const { texts: priorTexts } = useRefTexts(priorRefArr, translation);
  const { texts: laterTexts } = useRefTexts(laterRefArr, translation);

  // Position below selected verse
  useEffect(() => {
    if (!verse || !popoverRef.current) return;
    const verseId = `${verse.book}.${verse.chapter}.${verse.verse}`;
    const verseEl = document.getElementById(verseId);
    if (!verseEl) return;

    const scrollContainer = document.querySelector('.reader-scroll');
    if (!scrollContainer) return;

    const rect = verseEl.getBoundingClientRect();
    const containerRect = scrollContainer.getBoundingClientRect();
    const popover = popoverRef.current;

    popover.style.top = `${rect.bottom - containerRect.top + scrollContainer.scrollTop + 8}px`;

    const readerContent = document.querySelector('.reader-content');
    if (readerContent) {
      const contentRect = readerContent.getBoundingClientRect();
      popover.style.left = `${contentRect.left - containerRect.left}px`;
      popover.style.width = `${contentRect.width}px`;
    }
  }, [verse]);

  // Close on Escape
  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [onClose]);

  // Close on click outside
  useEffect(() => {
    const handler = (e) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target)) {
        if (e.target.classList.contains('verse-num')) return;
        onClose();
      }
    };
    const timer = setTimeout(() => {
      document.addEventListener('mousedown', handler);
    }, 100);
    return () => {
      clearTimeout(timer);
      document.removeEventListener('mousedown', handler);
    };
  }, [onClose]);

  const handleClick = useCallback((ref) => {
    const parsed = parseReference(ref);
    if (parsed) onNavigate(parsed.book, parsed.chapter, parsed.verseStart);
  }, [onNavigate]);

  if (!verse || !refs || refs.length === 0) return null;

  const renderSection = (label, entries, texts) => (
    <section className="crossref-mobile-section">
      <h4 className="crossref-mobile-section-title">
        {label}
        <span className="crossref-mobile-section-count">{entries.length}</span>
      </h4>
      {entries.length === 0 ? (
        <p className="crossref-mobile-section-empty">None</p>
      ) : (
        <ul className="crossref-mobile-list">
          {entries.map(({ ref }, i) => (
            <li key={i} className="crossref-entry">
              <button className="crossref-entry-btn" onClick={() => handleClick(ref)}>
                <span className="crossref-entry-label">{formatReference(ref)}</span>
                {texts[ref] && (
                  <span className="crossref-entry-text">{texts[ref]}</span>
                )}
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );

  return (
    <div className="crossref-mobile" ref={popoverRef}>
      <div className="crossref-mobile-header">
        <span className="crossref-mobile-title">
          {formatReference(`${verse.book}.${verse.chapter}.${verse.verse}`)}
        </span>
        <span className="crossref-mobile-total">
          {refs.length} ref{refs.length !== 1 ? 's' : ''}
        </span>
        <button className="crossref-mobile-close" onClick={onClose} aria-label="Close">
          &times;
        </button>
      </div>
      {renderSection('Prior in Scripture', cappedPrior, priorTexts)}
      {renderSection('Later in Scripture', cappedLater, laterTexts)}
      {(prior.length > 25 || later.length > 25) && (
        <div className="crossref-mobile-overflow">
          {refs.length} total references
        </div>
      )}
    </div>
  );
}
