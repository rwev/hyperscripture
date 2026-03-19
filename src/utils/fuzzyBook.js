/**
 * Fuzzy book name matching and reference parsing for quick navigation.
 *
 * Handles inputs like:
 *   "gen3"      → Genesis 3
 *   "john3:16"  → John 3:16
 *   "1cor2"     → 1 Corinthians 2
 *   "ps119:105" → Psalms 119:105
 *   "rev 22:21" → Revelation 22:21
 *   "phil"      → Philippians (ranked above Philemon)
 */

import { getBooks, getBookByAbbr } from './bible';

// ── Alias table ────────────────────────────────────────────────────────
// Maps lowercase aliases to canonical abbreviations.
// Built to cover common shorthand, full names, and abbreviations.

const ALIASES = {
  // Genesis
  ge: 'Gen', gen: 'Gen', genesis: 'Gen',
  // Exodus
  ex: 'Exod', exo: 'Exod', exod: 'Exod', exodus: 'Exod',
  // Leviticus
  le: 'Lev', lev: 'Lev', leviticus: 'Lev',
  // Numbers
  nu: 'Num', num: 'Num', numbers: 'Num',
  // Deuteronomy
  de: 'Deut', deut: 'Deut', deuteronomy: 'Deut',
  // Joshua
  jos: 'Josh', josh: 'Josh', joshua: 'Josh',
  // Judges
  jdg: 'Judg', judg: 'Judg', judges: 'Judg',
  // Ruth
  ru: 'Ruth', ruth: 'Ruth',
  // 1 Samuel
  '1sa': '1Sam', '1sam': '1Sam', '1samuel': '1Sam',
  // 2 Samuel
  '2sa': '2Sam', '2sam': '2Sam', '2samuel': '2Sam',
  // 1 Kings
  '1ki': '1Kgs', '1kgs': '1Kgs', '1kings': '1Kgs',
  // 2 Kings
  '2ki': '2Kgs', '2kgs': '2Kgs', '2kings': '2Kgs',
  // 1 Chronicles
  '1ch': '1Chr', '1chr': '1Chr', '1chronicles': '1Chr',
  // 2 Chronicles
  '2ch': '2Chr', '2chr': '2Chr', '2chronicles': '2Chr',
  // Ezra
  ezr: 'Ezra', ezra: 'Ezra',
  // Nehemiah
  ne: 'Neh', neh: 'Neh', nehemiah: 'Neh',
  // Esther
  est: 'Esth', esth: 'Esth', esther: 'Esth',
  // Job
  job: 'Job',
  // Psalms
  ps: 'Ps', psa: 'Ps', psalm: 'Ps', psalms: 'Ps',
  // Proverbs
  pr: 'Prov', pro: 'Prov', prov: 'Prov', proverbs: 'Prov',
  // Ecclesiastes
  ec: 'Eccl', ecc: 'Eccl', eccl: 'Eccl', ecclesiastes: 'Eccl',
  // Song of Solomon
  so: 'Song', song: 'Song', songofsolomon: 'Song', sos: 'Song', songofso: 'Song',
  // Isaiah
  is: 'Isa', isa: 'Isa', isaiah: 'Isa',
  // Jeremiah
  je: 'Jer', jer: 'Jer', jeremiah: 'Jer',
  // Lamentations
  la: 'Lam', lam: 'Lam', lamentations: 'Lam',
  // Ezekiel
  eze: 'Ezek', ezek: 'Ezek', ezekiel: 'Ezek',
  // Daniel
  da: 'Dan', dan: 'Dan', daniel: 'Dan',
  // Hosea
  ho: 'Hos', hos: 'Hos', hosea: 'Hos',
  // Joel
  joe: 'Joel', joel: 'Joel',
  // Amos
  am: 'Amos', amos: 'Amos',
  // Obadiah
  ob: 'Obad', obad: 'Obad', obadiah: 'Obad',
  // Jonah
  jon: 'Jonah', jonah: 'Jonah',
  // Micah
  mi: 'Mic', mic: 'Mic', micah: 'Mic',
  // Nahum
  na: 'Nah', nah: 'Nah', nahum: 'Nah',
  // Habakkuk
  hab: 'Hab', habakkuk: 'Hab',
  // Zephaniah
  zep: 'Zeph', zeph: 'Zeph', zephaniah: 'Zeph',
  // Haggai
  hag: 'Hag', haggai: 'Hag',
  // Zechariah
  zec: 'Zech', zech: 'Zech', zechariah: 'Zech',
  // Malachi
  mal: 'Mal', malachi: 'Mal',
  // Matthew
  mt: 'Matt', mat: 'Matt', matt: 'Matt', matthew: 'Matt',
  // Mark
  mk: 'Mark', mar: 'Mark', mark: 'Mark',
  // Luke
  lu: 'Luke', luk: 'Luke', luke: 'Luke',
  // John
  jn: 'John', joh: 'John', john: 'John',
  // Acts
  ac: 'Acts', act: 'Acts', acts: 'Acts',
  // Romans
  ro: 'Rom', rom: 'Rom', romans: 'Rom',
  // 1 Corinthians
  '1co': '1Cor', '1cor': '1Cor', '1corinthians': '1Cor',
  // 2 Corinthians
  '2co': '2Cor', '2cor': '2Cor', '2corinthians': '2Cor',
  // Galatians
  ga: 'Gal', gal: 'Gal', galatians: 'Gal',
  // Ephesians
  ep: 'Eph', eph: 'Eph', ephesians: 'Eph',
  // Philippians
  php: 'Phil', phil: 'Phil', philippians: 'Phil',
  // Colossians
  col: 'Col', colossians: 'Col',
  // 1 Thessalonians
  '1th': '1Thess', '1thess': '1Thess', '1thessalonians': '1Thess',
  // 2 Thessalonians
  '2th': '2Thess', '2thess': '2Thess', '2thessalonians': '2Thess',
  // 1 Timothy
  '1ti': '1Tim', '1tim': '1Tim', '1timothy': '1Tim',
  // 2 Timothy
  '2ti': '2Tim', '2tim': '2Tim', '2timothy': '2Tim',
  // Titus
  tit: 'Titus', titus: 'Titus',
  // Philemon
  phm: 'Phlm', phlm: 'Phlm', philemon: 'Phlm',
  // Hebrews
  he: 'Heb', heb: 'Heb', hebrews: 'Heb',
  // James
  ja: 'Jas', jas: 'Jas', james: 'Jas',
  // 1 Peter
  '1pe': '1Pet', '1pet': '1Pet', '1peter': '1Pet',
  // 2 Peter
  '2pe': '2Pet', '2pet': '2Pet', '2peter': '2Pet',
  // 1 John
  '1jn': '1John', '1joh': '1John', '1john': '1John',
  // 2 John
  '2jn': '2John', '2joh': '2John', '2john': '2John',
  // 3 John
  '3jn': '3John', '3joh': '3John', '3john': '3John',
  // Jude
  jud: 'Jude', jude: 'Jude',
  // Revelation
  re: 'Rev', rev: 'Rev', revelation: 'Rev',
};

// ── Parsing ────────────────────────────────────────────────────────────

/**
 * Parse a fuzzy input string into a book query, chapter, and verse.
 *
 * Strategy: try progressively shorter prefixes of the input against the
 * alias table. The longest match wins as the "book" part; the remainder
 * is parsed as chapter[:verse].
 *
 * This correctly handles "1cor2" → book="1cor", chapter=2
 * and "john3:16" → book="john", chapter=3, verse=16.
 */
function parseQuery(raw) {
  if (!raw) return null;

  // Normalize: lowercase, trim, collapse spaces, strip leading/trailing punctuation
  let input = raw.trim().toLowerCase().replace(/\s+/g, ' ');

  // Handle explicit space between book and chapter: "gen 3:16", "1 cor 2"
  // First, try to extract chapter:verse from the end
  const explicitMatch = input.match(
    /^(.+?)\s+(\d+)\s*[:\.]?\s*(\d+)?$/
  );
  if (explicitMatch) {
    const bookQuery = explicitMatch[1].replace(/\s+/g, '');
    const chapter = parseInt(explicitMatch[2], 10);
    const verse = explicitMatch[3] ? parseInt(explicitMatch[3], 10) : null;
    return { bookQuery, chapter, verse };
  }

  // No space separator: "gen3:16", "1cor2", "john3"
  // Try to find the longest prefix that matches a known alias
  const noSpace = input.replace(/\s+/g, '');

  // Extract trailing chapter:verse pattern
  const cvMatch = noSpace.match(/^(.+?)(\d+)\s*[:\.]?\s*(\d+)?$/);
  if (cvMatch) {
    let bookPart = cvMatch[1];
    const chapter = parseInt(cvMatch[2], 10);
    const verse = cvMatch[3] ? parseInt(cvMatch[3], 10) : null;

    // bookPart might end with digits that are part of the book name (e.g., "1cor" → "1cor")
    // or might be just letters (e.g., "gen" → "gen")
    // The cvMatch greedily takes the last digit group as chapter.
    // But for "1cor2", cvMatch gives bookPart="1cor", chapter=2 ✓
    // For "1cor12", cvMatch gives bookPart="1cor1", chapter=2 ✗
    // We need to find the split point where the book prefix is a known alias.

    // Strategy: try splitting at each position where digits start (after the book prefix)
    // Find all possible split points
    const candidates = findBookSplits(noSpace);
    if (candidates.length > 0) {
      return candidates[0]; // Best match
    }

    // Fallback: use the regex result as-is
    return { bookQuery: bookPart, chapter, verse };
  }

  // No chapter/verse: just a book name query
  return { bookQuery: noSpace, chapter: null, verse: null };
}

/**
 * Find all valid ways to split an input string into book + chapter[:verse].
 * Returns candidates sorted by match quality (best first).
 */
function findBookSplits(input) {
  const candidates = [];

  // Try every possible split point where the book part ends and chapter begins
  for (let i = input.length; i >= 1; i--) {
    const bookPart = input.slice(0, i);
    const rest = input.slice(i);

    // Book part must end with a letter (not a digit, unless it's the full input)
    if (rest.length > 0 && !/[a-z]$/.test(bookPart)) continue;

    // Rest must start with a digit (or be empty)
    if (rest.length > 0 && !/^\d/.test(rest)) continue;

    // Check if bookPart matches any alias
    if (bookPart in ALIASES || matchBookPrefix(bookPart).length > 0) {
      let chapter = null;
      let verse = null;

      if (rest) {
        const cvParts = rest.match(/^(\d+)\s*[:\.]?\s*(\d+)?$/);
        if (cvParts) {
          chapter = parseInt(cvParts[1], 10);
          verse = cvParts[2] ? parseInt(cvParts[2], 10) : null;
        } else {
          continue; // rest doesn't parse as chapter:verse
        }
      }

      const isExact = bookPart in ALIASES;
      candidates.push({
        bookQuery: bookPart,
        chapter,
        verse,
        score: isExact ? 100 + bookPart.length : 50 + bookPart.length,
      });
    }
  }

  candidates.sort((a, b) => b.score - a.score);
  return candidates;
}

// ── Matching ───────────────────────────────────────────────────────────

/**
 * Match a book query string against known book names.
 * Returns an array of { abbr, name, chapters, score } sorted by score desc.
 */
function matchBookPrefix(query) {
  const books = getBooks();
  if (!books || books.length === 0) return [];

  const results = [];

  for (const book of books) {
    const nameLower = book.name.toLowerCase().replace(/\s+/g, '');
    const abbrLower = book.abbr.toLowerCase();

    let score = 0;

    if (abbrLower === query || nameLower === query) {
      score = 100; // Exact match
    } else if (nameLower.startsWith(query)) {
      score = 90 - (nameLower.length - query.length); // Prefix match on name
    } else if (abbrLower.startsWith(query)) {
      score = 80 - (abbrLower.length - query.length); // Prefix match on abbreviation
    } else if (nameLower.includes(query) && query.length >= 3) {
      score = 60; // Contains match (only for longer queries)
    }

    if (score > 0) {
      results.push({ abbr: book.abbr, name: book.name, chapters: book.chapters, score });
    }
  }

  results.sort((a, b) => b.score - a.score);
  return results;
}

/**
 * Match a book query against both the alias table and book names.
 * Returns top matches sorted by score.
 */
function matchBooks(query) {
  if (!query) return [];

  const q = query.toLowerCase().replace(/\s+/g, '');

  // Check alias table first (exact alias match)
  const aliasMatch = ALIASES[q];
  if (aliasMatch) {
    const book = getBookByAbbr(aliasMatch);
    if (book) {
      return [{ abbr: book.abbr, name: book.name, chapters: book.chapters, score: 100 }];
    }
  }

  // Fuzzy match against book names and abbreviations
  const prefixResults = matchBookPrefix(q);

  // Deduplicate (alias match might also appear in prefix results)
  const seen = new Set();
  const merged = [];

  if (aliasMatch) {
    const book = getBookByAbbr(aliasMatch);
    if (book) {
      seen.add(book.abbr);
      merged.push({ abbr: book.abbr, name: book.name, chapters: book.chapters, score: 100 });
    }
  }

  for (const r of prefixResults) {
    if (!seen.has(r.abbr)) {
      seen.add(r.abbr);
      merged.push(r);
    }
  }

  return merged.slice(0, 5);
}

// ── Public API ─────────────────────────────────────────────────────────

/**
 * Resolve a raw input string into navigation suggestions.
 *
 * Returns an array of { abbr, name, chapter, verse, display } objects.
 * Each represents a valid navigation target.
 */
export function resolveInput(raw) {
  const parsed = parseQuery(raw);
  if (!parsed) return [];

  const { bookQuery, chapter, verse } = parsed;
  const matches = matchBooks(bookQuery);

  const results = [];

  for (const match of matches) {
    // Validate chapter
    if (chapter !== null && chapter > match.chapters) continue;
    if (chapter !== null && chapter < 1) continue;

    let display;
    if (chapter && verse) {
      display = `${match.name} ${chapter}:${verse}`;
    } else if (chapter) {
      display = `${match.name} ${chapter}`;
    } else {
      display = match.name;
    }

    const subtitle = chapter
      ? null
      : `${match.chapters} chapter${match.chapters !== 1 ? 's' : ''}`;

    results.push({
      abbr: match.abbr,
      name: match.name,
      chapter: chapter || 1,
      verse: verse || null,
      display,
      subtitle,
      score: match.score,
    });
  }

  return results;
}
