#!/usr/bin/env node
/**
 * process-data.mjs
 *
 * Downloads Bible translations from scrollmapper/bible_databases and
 * cross-reference data from openbible.info, then processes them into
 * optimized per-book JSON files for the Hyperscripture app.
 *
 * Usage: node scripts/process-data.mjs
 */

import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const OUTPUT = path.join(ROOT, 'public', 'data');

// ── Configuration ──────────────────────────────────────────────────────

const TRANSLATIONS = ['KJV'];

const GITHUB_RAW =
  'https://raw.githubusercontent.com/scrollmapper/bible_databases/master/formats/json';

const CROSSREF_URL = 'https://a.openbible.info/data/cross-references.zip';

// ── Canonical book data ────────────────────────────────────────────────

const BOOKS = [
  // Old Testament
  { abbr: 'Gen',    name: 'Genesis',         order: 1,  testament: 'OT' },
  { abbr: 'Exod',   name: 'Exodus',          order: 2,  testament: 'OT' },
  { abbr: 'Lev',    name: 'Leviticus',       order: 3,  testament: 'OT' },
  { abbr: 'Num',    name: 'Numbers',         order: 4,  testament: 'OT' },
  { abbr: 'Deut',   name: 'Deuteronomy',     order: 5,  testament: 'OT' },
  { abbr: 'Josh',   name: 'Joshua',          order: 6,  testament: 'OT' },
  { abbr: 'Judg',   name: 'Judges',          order: 7,  testament: 'OT' },
  { abbr: 'Ruth',   name: 'Ruth',            order: 8,  testament: 'OT' },
  { abbr: '1Sam',   name: '1 Samuel',        order: 9,  testament: 'OT' },
  { abbr: '2Sam',   name: '2 Samuel',        order: 10, testament: 'OT' },
  { abbr: '1Kgs',   name: '1 Kings',         order: 11, testament: 'OT' },
  { abbr: '2Kgs',   name: '2 Kings',         order: 12, testament: 'OT' },
  { abbr: '1Chr',   name: '1 Chronicles',    order: 13, testament: 'OT' },
  { abbr: '2Chr',   name: '2 Chronicles',    order: 14, testament: 'OT' },
  { abbr: 'Ezra',   name: 'Ezra',            order: 15, testament: 'OT' },
  { abbr: 'Neh',    name: 'Nehemiah',        order: 16, testament: 'OT' },
  { abbr: 'Esth',   name: 'Esther',          order: 17, testament: 'OT' },
  { abbr: 'Job',    name: 'Job',             order: 18, testament: 'OT' },
  { abbr: 'Ps',     name: 'Psalms',          order: 19, testament: 'OT' },
  { abbr: 'Prov',   name: 'Proverbs',        order: 20, testament: 'OT' },
  { abbr: 'Eccl',   name: 'Ecclesiastes',    order: 21, testament: 'OT' },
  { abbr: 'Song',   name: 'Song of Solomon', order: 22, testament: 'OT' },
  { abbr: 'Isa',    name: 'Isaiah',          order: 23, testament: 'OT' },
  { abbr: 'Jer',    name: 'Jeremiah',        order: 24, testament: 'OT' },
  { abbr: 'Lam',    name: 'Lamentations',    order: 25, testament: 'OT' },
  { abbr: 'Ezek',   name: 'Ezekiel',         order: 26, testament: 'OT' },
  { abbr: 'Dan',    name: 'Daniel',          order: 27, testament: 'OT' },
  { abbr: 'Hos',    name: 'Hosea',           order: 28, testament: 'OT' },
  { abbr: 'Joel',   name: 'Joel',            order: 29, testament: 'OT' },
  { abbr: 'Amos',   name: 'Amos',            order: 30, testament: 'OT' },
  { abbr: 'Obad',   name: 'Obadiah',         order: 31, testament: 'OT' },
  { abbr: 'Jonah',  name: 'Jonah',           order: 32, testament: 'OT' },
  { abbr: 'Mic',    name: 'Micah',           order: 33, testament: 'OT' },
  { abbr: 'Nah',    name: 'Nahum',           order: 34, testament: 'OT' },
  { abbr: 'Hab',    name: 'Habakkuk',        order: 35, testament: 'OT' },
  { abbr: 'Zeph',   name: 'Zephaniah',       order: 36, testament: 'OT' },
  { abbr: 'Hag',    name: 'Haggai',          order: 37, testament: 'OT' },
  { abbr: 'Zech',   name: 'Zechariah',       order: 38, testament: 'OT' },
  { abbr: 'Mal',    name: 'Malachi',         order: 39, testament: 'OT' },
  // New Testament
  { abbr: 'Matt',   name: 'Matthew',         order: 40, testament: 'NT' },
  { abbr: 'Mark',   name: 'Mark',            order: 41, testament: 'NT' },
  { abbr: 'Luke',   name: 'Luke',            order: 42, testament: 'NT' },
  { abbr: 'John',   name: 'John',            order: 43, testament: 'NT' },
  { abbr: 'Acts',   name: 'Acts',            order: 44, testament: 'NT' },
  { abbr: 'Rom',    name: 'Romans',          order: 45, testament: 'NT' },
  { abbr: '1Cor',   name: '1 Corinthians',   order: 46, testament: 'NT' },
  { abbr: '2Cor',   name: '2 Corinthians',   order: 47, testament: 'NT' },
  { abbr: 'Gal',    name: 'Galatians',       order: 48, testament: 'NT' },
  { abbr: 'Eph',    name: 'Ephesians',       order: 49, testament: 'NT' },
  { abbr: 'Phil',   name: 'Philippians',     order: 50, testament: 'NT' },
  { abbr: 'Col',    name: 'Colossians',      order: 51, testament: 'NT' },
  { abbr: '1Thess', name: '1 Thessalonians', order: 52, testament: 'NT' },
  { abbr: '2Thess', name: '2 Thessalonians', order: 53, testament: 'NT' },
  { abbr: '1Tim',   name: '1 Timothy',       order: 54, testament: 'NT' },
  { abbr: '2Tim',   name: '2 Timothy',       order: 55, testament: 'NT' },
  { abbr: 'Titus',  name: 'Titus',           order: 56, testament: 'NT' },
  { abbr: 'Phlm',   name: 'Philemon',        order: 57, testament: 'NT' },
  { abbr: 'Heb',    name: 'Hebrews',         order: 58, testament: 'NT' },
  { abbr: 'Jas',    name: 'James',           order: 59, testament: 'NT' },
  { abbr: '1Pet',   name: '1 Peter',         order: 60, testament: 'NT' },
  { abbr: '2Pet',   name: '2 Peter',         order: 61, testament: 'NT' },
  { abbr: '1John',  name: '1 John',          order: 62, testament: 'NT' },
  { abbr: '2John',  name: '2 John',          order: 63, testament: 'NT' },
  { abbr: '3John',  name: '3 John',          order: 64, testament: 'NT' },
  { abbr: 'Jude',   name: 'Jude',            order: 65, testament: 'NT' },
  { abbr: 'Rev',    name: 'Revelation',      order: 66, testament: 'NT' },
];

// Map full book names (various spellings) → canonical abbreviation
const NAME_TO_ABBR = {};
for (const b of BOOKS) {
  NAME_TO_ABBR[b.name] = b.abbr;
  NAME_TO_ABBR[b.name.toLowerCase()] = b.abbr;
}
// Common aliases
const ALIASES = {
  'Psalm': 'Ps', 'Psalms': 'Ps',
  'Song of Songs': 'Song', 'Canticles': 'Song',
  'Revelation of John': 'Rev',
  'Apocalypse': 'Rev',
  'I Samuel': '1Sam', 'II Samuel': '2Sam',
  'I Kings': '1Kgs', 'II Kings': '2Kgs',
  'I Chronicles': '1Chr', 'II Chronicles': '2Chr',
  'I Corinthians': '1Cor', 'II Corinthians': '2Cor',
  'I Thessalonians': '1Thess', 'II Thessalonians': '2Thess',
  'I Timothy': '1Tim', 'II Timothy': '2Tim',
  'I Peter': '1Pet', 'II Peter': '2Pet',
  'I John': '1John', 'II John': '2John', 'III John': '3John',
  'Acts of the Apostles': 'Acts',
};
for (const [alias, abbr] of Object.entries(ALIASES)) {
  NAME_TO_ABBR[alias] = abbr;
  NAME_TO_ABBR[alias.toLowerCase()] = abbr;
}

const ABBR_SET = new Set(BOOKS.map(b => b.abbr));

// ── Utilities ──────────────────────────────────────────────────────────

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

async function fetchJSON(url) {
  console.log(`  Fetching ${url.split('/').pop()}...`);
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
  return res.json();
}

async function fetchBuffer(url) {
  console.log(`  Fetching ${url.split('/').pop()}...`);
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
  return Buffer.from(await res.arrayBuffer());
}

/**
 * Extract the first file from a ZIP buffer using manual parsing + node:zlib.
 * Works for simple single-file ZIPs (like the cross-references download).
 */
function extractFirstFileFromZip(buf) {
  // Local file header signature = 0x04034b50
  if (buf.readUInt32LE(0) !== 0x04034b50) {
    throw new Error('Not a valid ZIP file');
  }
  const compressionMethod = buf.readUInt16LE(8);
  const compressedSize = buf.readUInt32LE(18);
  const filenameLen = buf.readUInt16LE(26);
  const extraLen = buf.readUInt16LE(28);
  const dataOffset = 30 + filenameLen + extraLen;
  const compressedData = buf.subarray(dataOffset, dataOffset + compressedSize);

  if (compressionMethod === 0) {
    // stored (no compression)
    return compressedData.toString('utf-8');
  } else if (compressionMethod === 8) {
    // deflated
    return zlib.inflateRawSync(compressedData).toString('utf-8');
  } else {
    throw new Error(`Unsupported compression method: ${compressionMethod}`);
  }
}

/**
 * Resolve a scrollmapper book name to our canonical abbreviation.
 */
function resolveBookName(name) {
  if (NAME_TO_ABBR[name]) return NAME_TO_ABBR[name];
  if (NAME_TO_ABBR[name.toLowerCase()]) return NAME_TO_ABBR[name.toLowerCase()];
  // Try trimming common suffixes
  const trimmed = name.replace(/\s+of\s+.*$/, '');
  if (NAME_TO_ABBR[trimmed]) return NAME_TO_ABBR[trimmed];
  console.warn(`  WARNING: Unknown book name "${name}"`);
  return null;
}

/**
 * Parse a cross-reference verse ID like "Gen.1.1" into { book, chapter, verse }.
 */
function parseVerseId(id) {
  const parts = id.split('.');
  if (parts.length < 3) return null;
  const verse = parseInt(parts[parts.length - 1], 10);
  const chapter = parseInt(parts[parts.length - 2], 10);
  const book = parts.slice(0, parts.length - 2).join('.');
  if (!ABBR_SET.has(book) || isNaN(chapter) || isNaN(verse)) return null;
  return { book, chapter, verse };
}

// ── Step 1: Process Bible Translations ─────────────────────────────────

async function processTranslations() {
  console.log('\n── Processing Bible Translations ──');

  const metaBooks = [];
  let metaBuilt = false;

  for (const tid of TRANSLATIONS) {
    console.log(`\nTranslation: ${tid}`);
    const url = `${GITHUB_RAW}/${tid}.json`;

    let data;
    try {
      data = await fetchJSON(url);
    } catch (err) {
      console.error(`  ERROR: Failed to fetch ${tid}: ${err.message}`);
      continue;
    }

    const transDir = path.join(OUTPUT, 'translations', tid);
    ensureDir(transDir);

    const srcBooks = data.books || [];
    console.log(`  Found ${srcBooks.length} books`);

    for (let i = 0; i < srcBooks.length; i++) {
      const srcBook = srcBooks[i];
      const bookName = srcBook.name;
      const abbr = resolveBookName(bookName);
      if (!abbr) continue;

      // Build per-book file: { name, abbr, chapters: { "1": [{v, text},...], ... } }
      const chapters = {};
      let totalVerses = 0;

      for (const ch of (srcBook.chapters || [])) {
        const chNum = String(ch.chapter);
        chapters[chNum] = (ch.verses || []).map(v => ({
          v: v.verse,
          t: v.text,
        }));
        totalVerses += chapters[chNum].length;
      }

      const bookData = { name: bookName, abbr, chapters };
      const filename = `${String(i + 1).padStart(2, '0')}-${abbr}.json`;
      fs.writeFileSync(
        path.join(transDir, filename),
        JSON.stringify(bookData),
      );

      // Build metadata from the first translation (KJV)
      if (!metaBuilt) {
        const bookMeta = BOOKS.find(b => b.abbr === abbr);
        metaBooks.push({
          abbr,
          name: bookMeta?.name || bookName,
          testament: bookMeta?.testament || (i < 39 ? 'OT' : 'NT'),
          chapters: Object.keys(chapters).length,
          file: filename,
        });
      }
    }

    if (!metaBuilt) metaBuilt = true;
    console.log(`  Wrote ${srcBooks.length} book files to ${transDir}`);
  }

  return metaBooks;
}

// ── Step 2: Process Cross-References ───────────────────────────────────

async function processCrossReferences() {
  console.log('\n── Processing Cross-References ──');

  // Download the zip
  const zipBuf = await fetchBuffer(CROSSREF_URL);
  console.log(`  Downloaded ${(zipBuf.length / 1024 / 1024).toFixed(1)} MB`);

  // Extract TSV
  const tsv = extractFirstFileFromZip(zipBuf);
  const lines = tsv.trim().split('\n');
  console.log(`  Extracted ${lines.length} lines`);

  // Parse cross-references and build bidirectional per-book indexes
  // Index structure: { [bookAbbr]: { [chapter.verse]: [[targetRef, votes], ...] } }
  const bookIndex = {};

  for (const abbr of BOOKS.map(b => b.abbr)) {
    bookIndex[abbr] = {};
  }

  let parsed = 0;
  let skipped = 0;

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    if (!line || line.startsWith('#')) continue;

    const parts = line.split('\t');
    if (parts.length < 3) { skipped++; continue; }

    const fromRef = parts[0].trim();
    const toRef = parts[1].trim();
    const votes = parseInt(parts[2], 10) || 0;

    const fromParsed = parseVerseId(fromRef);
    if (!fromParsed) { skipped++; continue; }

    // Parse the target - might be a range like "John.1.1-John.1.3"
    const toStart = toRef.split('-')[0];
    const toParsed = parseVerseId(toStart);
    if (!toParsed) { skipped++; continue; }

    // Add forward reference: fromVerse → toRef
    const fromKey = `${fromParsed.chapter}.${fromParsed.verse}`;
    if (!bookIndex[fromParsed.book][fromKey]) {
      bookIndex[fromParsed.book][fromKey] = [];
    }
    bookIndex[fromParsed.book][fromKey].push([toRef, votes]);

    // Add backward reference: toVerse → fromRef (for bidirectional linking)
    const toKey = `${toParsed.chapter}.${toParsed.verse}`;
    if (!bookIndex[toParsed.book][toKey]) {
      bookIndex[toParsed.book][toKey] = [];
    }
    bookIndex[toParsed.book][toKey].push([fromRef, votes]);

    parsed++;
  }

  console.log(`  Parsed ${parsed} cross-references (skipped ${skipped})`);

  // Sort each verse's references by vote count (descending) and deduplicate
  const crossRefDir = path.join(OUTPUT, 'cross-refs');
  ensureDir(crossRefDir);

  let totalEntries = 0;
  let totalRefs = 0;

  for (const abbr of BOOKS.map(b => b.abbr)) {
    const index = bookIndex[abbr];
    const sortedIndex = {};

    for (const [verseKey, refs] of Object.entries(index)) {
      // Deduplicate by target reference string
      const seen = new Set();
      const deduped = [];
      for (const [ref, votes] of refs) {
        if (!seen.has(ref)) {
          seen.add(ref);
          deduped.push([ref, votes]);
        }
      }
      // Sort by votes descending
      deduped.sort((a, b) => b[1] - a[1]);
      sortedIndex[verseKey] = deduped;
      totalRefs += deduped.length;
    }

    totalEntries += Object.keys(sortedIndex).length;

    fs.writeFileSync(
      path.join(crossRefDir, `${abbr}.json`),
      JSON.stringify(sortedIndex),
    );
  }

  console.log(`  Wrote cross-ref indexes for ${BOOKS.length} books`);
  console.log(`  Total verses with refs: ${totalEntries}`);
  console.log(`  Total reference entries: ${totalRefs}`);
}

// ── Step 3: Write Metadata ─────────────────────────────────────────────

function writeMetadata(metaBooks) {
  console.log('\n── Writing Metadata ──');

  // List all translations that exist in the output directory
  const allTranslations = [
    { id: 'KJV', name: 'King James Version' },
    { id: 'AMP', name: 'Amplified Bible' },
    { id: 'NIV', name: 'New International Version' },
    { id: 'ESV', name: 'English Standard Version' },
  ].filter(t => {
    const dir = path.join(OUTPUT, 'translations', t.id);
    return fs.existsSync(dir) && fs.readdirSync(dir).length > 0;
  });

  const meta = {
    books: metaBooks,
    translations: allTranslations,
    defaultTranslation: 'KJV',
  };

  fs.writeFileSync(
    path.join(OUTPUT, 'meta.json'),
    JSON.stringify(meta, null, 2),
  );
  console.log('  Wrote meta.json');
}

// ── Main ───────────────────────────────────────────────────────────────

async function main() {
  console.log('Hyperscripture Data Processing');
  console.log('==============================\n');

  ensureDir(OUTPUT);

  const metaBooks = await processTranslations();
  await processCrossReferences();
  writeMetadata(metaBooks);

  // Report sizes
  console.log('\n── Output Summary ──');
  const walk = (dir, prefix = '') => {
    let total = 0;
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        total += walk(full, `${prefix}${entry.name}/`);
      } else {
        const size = fs.statSync(full).size;
        total += size;
      }
    }
    if (prefix) {
      console.log(`  ${prefix.padEnd(30)} ${(total / 1024).toFixed(0)} KB`);
    }
    return total;
  };
  const totalSize = walk(OUTPUT);
  console.log(`  ${'TOTAL'.padEnd(30)} ${(totalSize / 1024 / 1024).toFixed(1)} MB`);

  console.log('\nDone.');
}

main().catch(err => {
  console.error('\nFATAL:', err);
  process.exit(1);
});
