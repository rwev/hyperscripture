import { memo, useCallback } from 'react';
import { makeVerseId } from '../utils/bible';
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
  bookmarks,
}) {
  const isSelectedChapter = selectedBook === bookAbbr && selectedChapter === chapter;

  const scrollToTop = useCallback((e) => {
    const section = e.target.closest('.chapter');
    const scroller = section?.closest('.reader-scroll');
    if (section && scroller) {
      const offset = section.getBoundingClientRect().top - scroller.getBoundingClientRect().top;
      scroller.scrollTop += offset - 20;
    }
  }, []);

  return (
    <section
      className="chapter"
      data-book={bookAbbr}
      data-chapter={chapter}
    >
      {showBookHeading && (
        <h2 className="book-heading">{bookName}</h2>
      )}
      <h3
        className="chapter-heading"
        onClick={scrollToTop}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            scrollToTop(e);
          }
        }}
      >
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
              isBookmarked={bookmarks?.has(makeVerseId(bookAbbr, chapter, v.v)) || false}
              onSelect={onSelectVerse}
            />
          );
        })}
      </div>
    </section>
  );
});

export default Chapter;
