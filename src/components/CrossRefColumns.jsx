/* eslint-disable react-refresh/only-export-components */
import { useMemo, useEffect, useRef, memo } from 'react';
import { formatReference, parseReference } from '../utils/bible';
import { partitionRefs } from '../utils/crossref';
import { useRefTexts } from '../hooks/useRefTexts';
import { useCrossRefs } from '../hooks/useCrossRefs';
import { useReader } from '../context/ReaderContext';

/**
 * A single reference entry in a column.
 * Shows a subtle depth indicator (›) if the target verse itself has cross-references.
 */
const RefEntry = memo(function RefEntry({ refId, text, loading, hasChain, onNavigate }) {
  return (
    <li className="crossref-entry">
      <button
        className="crossref-entry-btn"
        onClick={() => {
          const parsed = parseReference(refId);
          if (parsed) onNavigate(parsed.book, parsed.chapter, parsed.verseStart);
        }}
      >
        <span className="crossref-entry-label">
          {formatReference(refId)}
          {hasChain && <span className="crossref-chain" title="Has further references"> ›</span>}
        </span>
        {text ? (
          <span className="crossref-entry-text">{text}</span>
        ) : loading ? (
          <span className="crossref-entry-loading" />
        ) : null}
      </button>
    </li>
  );
});

/**
 * A single column of cross-reference entries (prior or later).
 */
const RefColumn = memo(function RefColumn({ direction, entries, texts, loading, onNavigate }) {
  const scrollRef = useRef(null);
  const { getRefsForVerse } = useCrossRefs();

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
          {entries.map(({ ref }) => {
            // Check if the target verse has its own cross-refs (one-hop depth check)
            const parsed = parseReference(ref);
            const hasChain = parsed
              ? getRefsForVerse(parsed.book, parsed.chapter, parsed.verseStart).length > 0
              : false;
            return (
              <RefEntry
                key={ref}
                refId={ref}
                text={texts[ref]}
                loading={loading}
                hasChain={hasChain}
                onNavigate={onNavigate}
              />
            );
          })}
        </ul>
      )}
    </aside>
  );
});

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
 * Prior cross-reference column (desktop).
 */
export const PriorColumn = memo(function PriorColumn({ entries, texts, loading, onNavigate }) {
  return <RefColumn direction="prior" entries={entries} texts={texts} loading={loading} onNavigate={onNavigate} />;
});

/**
 * Later cross-reference column (desktop).
 */
export const LaterColumn = memo(function LaterColumn({ entries, texts, loading, onNavigate }) {
  return <RefColumn direction="later" entries={entries} texts={texts} loading={loading} onNavigate={onNavigate} />;
});
