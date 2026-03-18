import { useMemo, useEffect, useRef } from 'react';
import { formatReference, parseReference, getVersePosition } from '../utils/bible';
import { useRefTexts } from '../hooks/useRefTexts';
import { useReader } from '../context/ReaderContext';

/**
 * Partition cross-references into prior/later relative to the selected verse,
 * sorted by ascending canonical distance (closest first).
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
 * A single reference entry in a column.
 */
function RefEntry({ refId, text, loading, onNavigate }) {
  return (
    <li className="crossref-entry">
      <button
        className="crossref-entry-btn"
        onClick={() => {
          const parsed = parseReference(refId);
          if (parsed) onNavigate(parsed.book, parsed.chapter, parsed.verseStart);
        }}
      >
        <span className="crossref-entry-label">{formatReference(refId)}</span>
        {text ? (
          <span className="crossref-entry-text">{text}</span>
        ) : loading ? (
          <span className="crossref-entry-loading" />
        ) : null}
      </button>
    </li>
  );
}

/**
 * A single column of cross-reference entries (prior or later).
 */
function RefColumn({ direction, entries, texts, loading, onNavigate }) {
  const scrollRef = useRef(null);

  // Reset scroll when entries change
  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = 0;
  }, [entries]);

  return (
    <aside className={`crossref-col crossref-${direction}`} ref={scrollRef}>
      <div className="crossref-col-header">
        <span className="crossref-col-label">
          {direction === 'prior' ? 'Prior' : 'Later'}
        </span>
        {entries.length > 0 && (
          <span className="crossref-col-count">{entries.length}</span>
        )}
      </div>
      {entries.length === 0 ? (
        <div className="crossref-col-empty">
          No references {direction === 'prior' ? 'before' : 'after'} this verse
        </div>
      ) : (
        <ul className="crossref-col-list">
          {entries.map(({ ref }, i) => (
            <RefEntry
              key={i}
              refId={ref}
              text={texts[ref]}
              loading={loading}
              onNavigate={onNavigate}
            />
          ))}
        </ul>
      )}
    </aside>
  );
}

/**
 * Hook that computes partitioned refs and loads their texts.
 * Used by the Reader to get data for both columns.
 */
export function useCrossRefColumns(selectedVerse, refs) {
  const { translation } = useReader();

  const { prior, later } = useMemo(
    () => partitionRefs(refs, selectedVerse),
    [refs, selectedVerse]
  );

  const priorRefArr = useMemo(() => prior.map(p => [p.ref, p.votes]), [prior]);
  const laterRefArr = useMemo(() => later.map(l => [l.ref, l.votes]), [later]);

  const { texts: priorTexts, loading: priorLoading } = useRefTexts(priorRefArr, translation);
  const { texts: laterTexts, loading: laterLoading } = useRefTexts(laterRefArr, translation);

  return { prior, later, priorTexts, laterTexts, priorLoading, laterLoading };
}

/**
 * The "prior" (left) column component.
 */
export function PriorColumn({ entries, texts, loading, onNavigate }) {
  return (
    <RefColumn
      direction="prior"
      entries={entries}
      texts={texts}
      loading={loading}
      onNavigate={onNavigate}
    />
  );
}

/**
 * The "later" (right) column component.
 */
export function LaterColumn({ entries, texts, loading, onNavigate }) {
  return (
    <RefColumn
      direction="later"
      entries={entries}
      texts={texts}
      loading={loading}
      onNavigate={onNavigate}
    />
  );
}
