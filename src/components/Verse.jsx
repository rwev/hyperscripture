import { memo } from 'react';

/**
 * A single Bible verse with cross-reference indicator.
 */
const Verse = memo(function Verse({ bookAbbr, chapter, verse, text, hasRefs, refCount, isSelected, onSelect }) {
  const verseId = `${bookAbbr}.${chapter}.${verse}`;

  return (
    <span
      className="verse"
      id={verseId}
      data-selected={isSelected || undefined}
    >
      <sup
        className={`verse-num${hasRefs ? ' has-refs' : ''}`}
        onClick={(e) => {
          e.stopPropagation();
          onSelect(bookAbbr, chapter, verse);
        }}
        title={hasRefs ? `${refCount} cross-reference${refCount !== 1 ? 's' : ''}` : undefined}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            onSelect(bookAbbr, chapter, verse);
          }
        }}
      >
        {verse}
      </sup>
      {text}{' '}
    </span>
  );
});

export default Verse;
