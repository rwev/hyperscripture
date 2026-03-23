/**
 * Verse-of-the-day: a curated list of notable verses, one per day of the year.
 *
 * Each entry is [bookAbbr, chapter, verse]. The list cycles annually
 * using the day-of-year as the index.
 */

const VERSES = [
  // ── Genesis – Deuteronomy ──
  ['Gen', 1, 1], ['Gen', 1, 27], ['Gen', 2, 18], ['Gen', 3, 15], ['Gen', 12, 2],
  ['Gen', 15, 6], ['Gen', 28, 15], ['Gen', 50, 20], ['Exod', 3, 14], ['Exod', 14, 14],
  ['Exod', 15, 2], ['Exod', 33, 14], ['Lev', 19, 18], ['Num', 6, 24], ['Num', 6, 25],
  ['Num', 6, 26], ['Deut', 6, 4], ['Deut', 6, 5], ['Deut', 7, 9], ['Deut', 31, 6],
  ['Deut', 31, 8],
  // ── Joshua – 2 Chronicles ──
  ['Josh', 1, 9], ['Josh', 24, 15], ['Judg', 6, 12], ['Ruth', 1, 16],
  ['1Sam', 16, 7], ['2Sam', 22, 31], ['1Kgs', 8, 56], ['2Chr', 7, 14],
  ['2Chr', 16, 9], ['2Chr', 20, 15],
  // ── Ezra – Esther ──
  ['Neh', 8, 10],
  // ── Job ──
  ['Job', 1, 21], ['Job', 12, 10], ['Job', 19, 25], ['Job', 23, 10],
  ['Job', 37, 5], ['Job', 38, 4],
  // ── Psalms ──
  ['Ps', 1, 1], ['Ps', 1, 2], ['Ps', 4, 8], ['Ps', 5, 3], ['Ps', 8, 1],
  ['Ps', 16, 8], ['Ps', 16, 11], ['Ps', 18, 2], ['Ps', 19, 1], ['Ps', 19, 14],
  ['Ps', 23, 1], ['Ps', 23, 4], ['Ps', 23, 6], ['Ps', 24, 1], ['Ps', 25, 4],
  ['Ps', 27, 1], ['Ps', 27, 4], ['Ps', 28, 7], ['Ps', 29, 2], ['Ps', 30, 5],
  ['Ps', 31, 24], ['Ps', 32, 8], ['Ps', 33, 4], ['Ps', 34, 1], ['Ps', 34, 8],
  ['Ps', 34, 18], ['Ps', 37, 4], ['Ps', 37, 5], ['Ps', 37, 7], ['Ps', 40, 1],
  ['Ps', 42, 1], ['Ps', 42, 11], ['Ps', 46, 1], ['Ps', 46, 10], ['Ps', 51, 10],
  ['Ps', 51, 12], ['Ps', 55, 22], ['Ps', 56, 3], ['Ps', 62, 1], ['Ps', 63, 1],
  ['Ps', 66, 16], ['Ps', 68, 19], ['Ps', 71, 6], ['Ps', 73, 26], ['Ps', 84, 11],
  ['Ps', 86, 5], ['Ps', 90, 2], ['Ps', 91, 1], ['Ps', 91, 2], ['Ps', 91, 11],
  ['Ps', 94, 19], ['Ps', 95, 1], ['Ps', 96, 1], ['Ps', 100, 4], ['Ps', 100, 5],
  ['Ps', 103, 1], ['Ps', 103, 12], ['Ps', 107, 1], ['Ps', 111, 10], ['Ps', 118, 6],
  ['Ps', 118, 24], ['Ps', 119, 9], ['Ps', 119, 11], ['Ps', 119, 105], ['Ps', 119, 114],
  ['Ps', 121, 1], ['Ps', 121, 2], ['Ps', 127, 1], ['Ps', 133, 1], ['Ps', 136, 1],
  ['Ps', 138, 3], ['Ps', 139, 14], ['Ps', 139, 23], ['Ps', 143, 8], ['Ps', 145, 18],
  ['Ps', 147, 3], ['Ps', 150, 6],
  // ── Proverbs ──
  ['Prov', 1, 7], ['Prov', 2, 6], ['Prov', 3, 3], ['Prov', 3, 5], ['Prov', 3, 6],
  ['Prov', 3, 9], ['Prov', 4, 23], ['Prov', 10, 9], ['Prov', 11, 2], ['Prov', 11, 25],
  ['Prov', 12, 25], ['Prov', 13, 20], ['Prov', 14, 26], ['Prov', 15, 1], ['Prov', 15, 13],
  ['Prov', 16, 3], ['Prov', 16, 9], ['Prov', 17, 17], ['Prov', 18, 10], ['Prov', 19, 21],
  ['Prov', 22, 6], ['Prov', 27, 17], ['Prov', 28, 13], ['Prov', 29, 25], ['Prov', 31, 25],
  ['Prov', 31, 30],
  // ── Ecclesiastes – Song of Solomon ──
  ['Eccl', 3, 1], ['Eccl', 3, 11], ['Eccl', 4, 9], ['Eccl', 7, 8], ['Eccl', 12, 13],
  // ── Isaiah ──
  ['Isa', 6, 8], ['Isa', 9, 6], ['Isa', 25, 1], ['Isa', 26, 3], ['Isa', 30, 15],
  ['Isa', 40, 8], ['Isa', 40, 29], ['Isa', 40, 31], ['Isa', 41, 10], ['Isa', 41, 13],
  ['Isa', 43, 2], ['Isa', 43, 19], ['Isa', 49, 15], ['Isa', 53, 5], ['Isa', 54, 10],
  ['Isa', 55, 8], ['Isa', 55, 9], ['Isa', 58, 11], ['Isa', 61, 1],
  // ── Jeremiah – Lamentations ──
  ['Jer', 1, 5], ['Jer', 17, 7], ['Jer', 29, 11], ['Jer', 29, 13], ['Jer', 31, 3],
  ['Jer', 33, 3], ['Lam', 3, 22], ['Lam', 3, 23], ['Lam', 3, 25],
  // ── Ezekiel – Daniel ──
  ['Ezek', 36, 26], ['Dan', 2, 20], ['Dan', 3, 17],
  // ── Minor Prophets ──
  ['Hos', 6, 3], ['Joel', 2, 25], ['Amos', 5, 24], ['Mic', 6, 8], ['Hab', 2, 14],
  ['Hab', 3, 19], ['Zeph', 3, 17], ['Zech', 4, 6], ['Mal', 3, 6],
  // ── Matthew ──
  ['Matt', 4, 19], ['Matt', 5, 3], ['Matt', 5, 6], ['Matt', 5, 8], ['Matt', 5, 9],
  ['Matt', 5, 14], ['Matt', 5, 16], ['Matt', 5, 44], ['Matt', 6, 21], ['Matt', 6, 25],
  ['Matt', 6, 33], ['Matt', 6, 34], ['Matt', 7, 7], ['Matt', 7, 12], ['Matt', 10, 31],
  ['Matt', 11, 28], ['Matt', 11, 29], ['Matt', 16, 24], ['Matt', 17, 20],
  ['Matt', 18, 20], ['Matt', 19, 26], ['Matt', 22, 37], ['Matt', 22, 39],
  ['Matt', 28, 19], ['Matt', 28, 20],
  // ── Mark ──
  ['Mark', 5, 36], ['Mark', 9, 23], ['Mark', 10, 27], ['Mark', 10, 45],
  ['Mark', 11, 24], ['Mark', 12, 30], ['Mark', 16, 15],
  // ── Luke ──
  ['Luke', 1, 37], ['Luke', 1, 45], ['Luke', 2, 10], ['Luke', 6, 27], ['Luke', 6, 31],
  ['Luke', 6, 35], ['Luke', 6, 38], ['Luke', 10, 27], ['Luke', 11, 9], ['Luke', 12, 7],
  ['Luke', 12, 34], ['Luke', 15, 7], ['Luke', 18, 27],
  // ── John ──
  ['John', 1, 1], ['John', 1, 5], ['John', 1, 14], ['John', 3, 16], ['John', 3, 17],
  ['John', 4, 24], ['John', 6, 35], ['John', 8, 12], ['John', 8, 32], ['John', 8, 36],
  ['John', 10, 10], ['John', 10, 28], ['John', 11, 25], ['John', 13, 34], ['John', 13, 35],
  ['John', 14, 1], ['John', 14, 6], ['John', 14, 13], ['John', 14, 27], ['John', 15, 5],
  ['John', 15, 9], ['John', 15, 12], ['John', 15, 13], ['John', 16, 33],
  // ── Acts ──
  ['Acts', 1, 8], ['Acts', 2, 28], ['Acts', 4, 12], ['Acts', 17, 28], ['Acts', 20, 35],
  // ── Romans ──
  ['Rom', 1, 16], ['Rom', 3, 23], ['Rom', 5, 1], ['Rom', 5, 3], ['Rom', 5, 5],
  ['Rom', 5, 8], ['Rom', 6, 23], ['Rom', 8, 1], ['Rom', 8, 18], ['Rom', 8, 26],
  ['Rom', 8, 28], ['Rom', 8, 31], ['Rom', 8, 37], ['Rom', 8, 38], ['Rom', 8, 39],
  ['Rom', 10, 9], ['Rom', 10, 17], ['Rom', 12, 1], ['Rom', 12, 2], ['Rom', 12, 12],
  ['Rom', 12, 21], ['Rom', 15, 13],
  // ── 1 & 2 Corinthians ──
  ['1Cor', 1, 18], ['1Cor', 2, 9], ['1Cor', 6, 19], ['1Cor', 10, 13], ['1Cor', 12, 27],
  ['1Cor', 13, 4], ['1Cor', 13, 7], ['1Cor', 13, 13], ['1Cor', 15, 55], ['1Cor', 15, 58],
  ['1Cor', 16, 13], ['1Cor', 16, 14], ['2Cor', 1, 3], ['2Cor', 4, 16], ['2Cor', 4, 17],
  ['2Cor', 4, 18], ['2Cor', 5, 7], ['2Cor', 5, 17], ['2Cor', 9, 7], ['2Cor', 12, 9],
  ['2Cor', 12, 10],
  // ── Galatians – Colossians ──
  ['Gal', 2, 20], ['Gal', 5, 1], ['Gal', 5, 22], ['Gal', 6, 2], ['Gal', 6, 9],
  ['Eph', 2, 8], ['Eph', 2, 10], ['Eph', 3, 17], ['Eph', 3, 20], ['Eph', 4, 2],
  ['Eph', 4, 32], ['Eph', 6, 10], ['Eph', 6, 11], ['Phil', 1, 6], ['Phil', 2, 3],
  ['Phil', 2, 13], ['Phil', 3, 14], ['Phil', 4, 4], ['Phil', 4, 6], ['Phil', 4, 7],
  ['Phil', 4, 8], ['Phil', 4, 11], ['Phil', 4, 13], ['Phil', 4, 19],
  ['Col', 2, 6], ['Col', 3, 2], ['Col', 3, 12], ['Col', 3, 13], ['Col', 3, 15],
  ['Col', 3, 17], ['Col', 3, 23],
  // ── 1 & 2 Thessalonians – Philemon ──
  ['1Thess', 5, 11], ['1Thess', 5, 16], ['1Thess', 5, 17], ['1Thess', 5, 18],
  ['2Thess', 3, 3], ['1Tim', 4, 12], ['1Tim', 6, 6], ['1Tim', 6, 12],
  ['2Tim', 1, 7], ['2Tim', 2, 15], ['2Tim', 3, 16], ['2Tim', 4, 7],
  ['Titus', 3, 5], ['Heb', 4, 12], ['Heb', 4, 16], ['Heb', 10, 23], ['Heb', 10, 24],
  ['Heb', 11, 1], ['Heb', 11, 6], ['Heb', 12, 1], ['Heb', 12, 2], ['Heb', 13, 5],
  ['Heb', 13, 6], ['Heb', 13, 8],
  // ── James – Jude ──
  ['Jas', 1, 2], ['Jas', 1, 3], ['Jas', 1, 5], ['Jas', 1, 12], ['Jas', 1, 17],
  ['Jas', 1, 19], ['Jas', 4, 7], ['Jas', 4, 8], ['Jas', 4, 10], ['Jas', 5, 16],
  ['1Pet', 2, 9], ['1Pet', 3, 15], ['1Pet', 5, 6], ['1Pet', 5, 7], ['1Pet', 5, 10],
  ['2Pet', 1, 3], ['2Pet', 3, 9], ['1John', 1, 9], ['1John', 3, 1], ['1John', 3, 18],
  ['1John', 4, 7], ['1John', 4, 8], ['1John', 4, 16], ['1John', 4, 18], ['1John', 4, 19],
  ['1John', 5, 4], ['1John', 5, 14],
  // ── Revelation ──
  ['Rev', 1, 8], ['Rev', 3, 20], ['Rev', 7, 12], ['Rev', 21, 4], ['Rev', 21, 5],
  ['Rev', 22, 13], ['Rev', 22, 21],
];

/**
 * Get the verse-of-the-day based on the current date.
 * Cycles through the list using day-of-year as index.
 * @returns {{ book: string, chapter: number, verse: number }}
 */
export function getVerseOfTheDay() {
  const now = new Date();
  const start = new Date(now.getFullYear(), 0, 0);
  const dayOfYear = Math.floor((now - start) / 86400000);
  const idx = dayOfYear % VERSES.length;
  const [book, chapter, verse] = VERSES[idx];
  return { book, chapter, verse };
}
