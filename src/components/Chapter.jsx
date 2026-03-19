import { memo } from 'react';
import Verse from './Verse';

/**
 * A chapter of Bible text, rendered as flowing prose with verse markers.
 *
 * Accepts scalar selectedBook/selectedChapter/selectedVerseNum props instead
 * of a selectedVerse object to preserve memo() effectiveness -- only the
 * chapter containing the selected verse re-renders on selection change.
 */
const Chapter = memo(function Chapter({
  bookAbbr,
  bookName,
  chapter,
  verses,
  showBookHeading,
  crossRefData,
  selectedBook,
  selectedChapter,
  selectedVerseNum,
  onSelectVerse,
}) {
  const isSelectedChapter = selectedBook === bookAbbr && selectedChapter === chapter;

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
          const isSelected = isSelectedChapter && selectedVerseNum === v.v;

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
