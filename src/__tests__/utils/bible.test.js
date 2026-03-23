import { describe, it, expect, beforeAll } from 'vitest';
import {
  getBookByAbbr, getNextBook, getPrevBook,
  parseReference, getVersePosition, formatReference,
  makeVerseId, bookAbbrToSlug, slugToBookAbbr, getBooks,
} from '../../utils/bible';
import { seedBibleMeta } from '../setup';

beforeAll(async () => {
  await seedBibleMeta();
});

describe('makeVerseId', () => {
  it('creates canonical ID', () => {
    expect(makeVerseId('Gen', 1, 1)).toBe('Gen.1.1');
    expect(makeVerseId('1Cor', 13, 4)).toBe('1Cor.13.4');
  });
});

describe('parseReference', () => {
  it('parses single verse', () => {
    expect(parseReference('Gen.1.1')).toEqual({
      book: 'Gen', chapter: 1, verseStart: 1, verseEnd: 1,
    });
  });

  it('parses full range', () => {
    expect(parseReference('John.1.1-John.1.3')).toEqual({
      book: 'John', chapter: 1, verseStart: 1, verseEnd: 3,
    });
  });

  it('parses short range (verse-only end)', () => {
    expect(parseReference('John.1.1-3')).toEqual({
      book: 'John', chapter: 1, verseStart: 1, verseEnd: 3,
    });
  });

  it('parses book with number prefix', () => {
    expect(parseReference('1Cor.13.4')).toEqual({
      book: '1Cor', chapter: 13, verseStart: 4, verseEnd: 4,
    });
  });

  it('returns null for null/empty/undefined', () => {
    expect(parseReference(null)).toBeNull();
    expect(parseReference('')).toBeNull();
    expect(parseReference(undefined)).toBeNull();
  });

  it('returns null for malformed input', () => {
    expect(parseReference('foo')).toBeNull();
    expect(parseReference('Gen.abc')).toBeNull();
    expect(parseReference('Gen')).toBeNull();
  });

  it('handles range with unparseable end as single verse', () => {
    expect(parseReference('Gen.1.1-abc')).toEqual({
      book: 'Gen', chapter: 1, verseStart: 1, verseEnd: 1,
    });
  });
});

describe('getBookByAbbr', () => {
  it('returns book for valid abbreviation', () => {
    const gen = getBookByAbbr('Gen');
    expect(gen).not.toBeNull();
    expect(gen.name).toBe('Genesis');
    expect(gen.chapters).toBe(50);
  });

  it('returns null for unknown abbreviation', () => {
    expect(getBookByAbbr('Xyz')).toBeNull();
    expect(getBookByAbbr('')).toBeNull();
  });
});

describe('getNextBook / getPrevBook', () => {
  it('returns adjacent books', () => {
    const next = getNextBook('Gen');
    expect(next).not.toBeNull();
    expect(next.abbr).toBe('Exod');

    const prev = getPrevBook('Exod');
    expect(prev).not.toBeNull();
    expect(prev.abbr).toBe('Gen');
  });

  it('returns null at boundaries', () => {
    expect(getPrevBook('Gen')).toBeNull();
    expect(getNextBook('Rev')).toBeNull();
  });

  it('returns null for unknown book', () => {
    expect(getNextBook('Xyz')).toBeNull();
    expect(getPrevBook('Xyz')).toBeNull();
  });
});

describe('getVersePosition', () => {
  it('orders books canonically', () => {
    const genPos = getVersePosition('Gen', 1, 1);
    const exodPos = getVersePosition('Exod', 1, 1);
    const johnPos = getVersePosition('John', 1, 1);
    const revPos = getVersePosition('Rev', 1, 1);

    expect(genPos).toBeLessThan(exodPos);
    expect(exodPos).toBeLessThan(johnPos);
    expect(johnPos).toBeLessThan(revPos);
  });

  it('orders chapters within a book', () => {
    expect(getVersePosition('Gen', 1, 1)).toBeLessThan(getVersePosition('Gen', 2, 1));
  });

  it('orders verses within a chapter', () => {
    expect(getVersePosition('Gen', 1, 1)).toBeLessThan(getVersePosition('Gen', 1, 2));
  });

  it('returns 0 for unknown book', () => {
    expect(getVersePosition('Xyz', 1, 1)).toBe(0);
  });
});

describe('formatReference', () => {
  it('formats single verse', () => {
    expect(formatReference('Gen.1.1')).toBe('Genesis 1:1');
  });

  it('formats range', () => {
    expect(formatReference('John.1.1-John.1.3')).toBe('John 1:1-3');
  });

  it('returns raw input for unparseable ref', () => {
    expect(formatReference('garbage')).toBe('garbage');
  });
});

describe('bookAbbrToSlug / slugToBookAbbr', () => {
  it('roundtrips correctly', () => {
    const slug = bookAbbrToSlug('Gen');
    expect(slug).toBe('gen');
    expect(slugToBookAbbr(slug)).toBe('Gen');
  });

  it('handles case-insensitive slug lookup', () => {
    expect(slugToBookAbbr('JOHN')).toBe('John');
    expect(slugToBookAbbr('1cor')).toBe('1Cor');
  });

  it('returns null for unknown slug', () => {
    expect(slugToBookAbbr('xyz')).toBeNull();
  });
});

describe('getBooks', () => {
  it('returns array of books', () => {
    const books = getBooks();
    expect(books.length).toBeGreaterThan(0);
    expect(books[0].abbr).toBe('Gen');
  });
});
