import { memo } from 'react';
import Verse from './Verse';

/**
 * A chapter of Bible text, rendered as flowing prose with verse markers.
 */
const Chapter = memo(function Chapter({
  bookAbbr,
  bookName,
  chapter,
  verses,
  showBookHeading,
  crossRefData,
  selectedVerse,
  onSelectVerse,
}) {
  return (
    <section
      className="chapter"
      data-book={bookAbbr}
      data-chapter={chapter}
    >
      {showBookHeading && (
        <h2 className="book-heading">{bookName}</h2>
      )}
      <h3 className="chapter-heading">
        {chapter}
      </h3>
      <div className="chapter-text">
        {verses.map(v => {
          const key = `${chapter}.${v.v}`;
          const refs = crossRefData?.[key];
          const isSelected =
            selectedVerse?.book === bookAbbr &&
            selectedVerse?.chapter === chapter &&
            selectedVerse?.verse === v.v;

          return (
            <Verse
              key={v.v}
              bookAbbr={bookAbbr}
              chapter={chapter}
              verse={v.v}
              text={v.t}
              hasRefs={!!refs && refs.length > 0}
              refCount={refs?.length || 0}
              isSelected={isSelected}
              onSelect={onSelectVerse}
            />
          );
        })}
      </div>
    </section>
  );
});

export default Chapter;
