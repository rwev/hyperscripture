/**
 * Bible data utilities: book metadata, verse ID parsing, reference formatting.
 */

// ── Loaded at runtime from meta.json ───────────────────────────────────
let _meta = null;
let _booksByAbbr = {};
let _booksByIndex = [];

export async function loadMeta() {
  if (_meta) return _meta;
  const res = await fetch(`${import.meta.env.BASE_URL}data/meta.json`);
  _meta = await res.json();
  _booksByAbbr = {};
  _booksByIndex = _meta.books;
  _meta.books.forEach((b, i) => {
    b.index = i;
    _booksByAbbr[b.abbr] = b;
  });
  return _meta;
}

export function getMeta() {
  return _meta;
}

export function getBooks() {
  return _booksByIndex;
}

export function getBookByAbbr(abbr) {
  return _booksByAbbr[abbr] || null;
}

export function getBookByIndex(index) {
  return _booksByIndex[index] || null;
}

export function getNextBook(abbr) {
  const book = _booksByAbbr[abbr];
  if (!book) return null;
  return _booksByIndex[book.index + 1] || null;
}

export function getPrevBook(abbr) {
  const book = _booksByAbbr[abbr];
  if (!book) return null;
  return _booksByIndex[book.index - 1] || null;
}

// ── Verse ID parsing ───────────────────────────────────────────────────

/**
 * Parse a verse reference string like "Gen.1.1" or "1John.3.16"
 * Returns { book, chapter, verse } or null.
 */
export function parseVerseId(id) {
  if (!id) return null;
  const parts = id.split('.');
  if (parts.length < 3) return null;
  const verse = parseInt(parts[parts.length - 1], 10);
  const chapter = parseInt(parts[parts.length - 2], 10);
  const book = parts.slice(0, parts.length - 2).join('.');
  if (isNaN(chapter) || isNaN(verse)) return null;
  return { book, chapter, verse };
}

/**
 * Parse a reference that may be a range like "John.1.1-John.1.3"
 * Returns { book, chapter, verseStart, verseEnd } or null.
 */
export function parseReference(ref) {
  if (!ref) return null;
  const rangeParts = ref.split('-');
  const start = parseVerseId(rangeParts[0]);
  if (!start) return null;

  if (rangeParts.length === 1) {
    return { book: start.book, chapter: start.chapter, verseStart: start.verse, verseEnd: start.verse };
  }

  // Range: "John.1.1-John.1.3" or potentially "John.1.1-3"
  const endPart = rangeParts.slice(1).join('-');
  const end = parseVerseId(endPart);

  if (end) {
    return { book: start.book, chapter: start.chapter, verseStart: start.verse, verseEnd: end.verse };
  }

  // Maybe just a verse number like "3"
  const endVerse = parseInt(endPart, 10);
  if (!isNaN(endVerse)) {
    return { book: start.book, chapter: start.chapter, verseStart: start.verse, verseEnd: endVerse };
  }

  return { book: start.book, chapter: start.chapter, verseStart: start.verse, verseEnd: start.verse };
}

// ── Canonical verse position ───────────────────────────────────────────

/**
 * Compute a canonical numeric position for a verse in the Bible.
 * Used for sorting cross-references by distance from a selected verse.
 * Produces a unique sortable integer: (bookIndex+1)*100000 + chapter*1000 + verse
 */
export function getVersePosition(bookAbbr, chapter, verse) {
  const book = _booksByAbbr[bookAbbr];
  if (!book) return 0;
  return (book.index + 1) * 100000 + chapter * 1000 + verse;
}

// ── Reference formatting ───────────────────────────────────────────────

/**
 * Format a reference ID into a human-readable string.
 * "Gen.1.1" → "Genesis 1:1"
 * "John.1.1-John.1.3" → "John 1:1-3"
 */
export function formatReference(ref) {
  const parsed = parseReference(ref);
  if (!parsed) return ref;

  const book = _booksByAbbr[parsed.book];
  const bookName = book ? book.name : parsed.book;

  if (parsed.verseStart === parsed.verseEnd) {
    return `${bookName} ${parsed.chapter}:${parsed.verseStart}`;
  }
  return `${bookName} ${parsed.chapter}:${parsed.verseStart}-${parsed.verseEnd}`;
}

/**
 * Create a canonical verse ID string.
 */
export function makeVerseId(bookAbbr, chapter, verse) {
  return `${bookAbbr}.${chapter}.${verse}`;
}

/**
 * Create a URL-safe slug from a book abbreviation.
 */
export function bookAbbrToSlug(abbr) {
  return abbr.toLowerCase();
}

/**
 * Resolve a URL slug back to a book abbreviation.
 */
export function slugToBookAbbr(slug) {
  const lower = slug.toLowerCase();
  for (const book of _booksByIndex) {
    if (book.abbr.toLowerCase() === lower) return book.abbr;
  }
  return null;
}
