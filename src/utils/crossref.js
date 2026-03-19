/**
 * Shared cross-reference utilities.
 */

import { parseReference, getVersePosition } from './bible';

/**
 * Partition cross-references into prior/later relative to the selected verse,
 * sorted by ascending canonical distance (closest first).
 *
 * @param {Array} refs - Array of [refId, votes] tuples
 * @param {object} selectedVerse - { book, chapter, verse }
 * @returns {{ prior: Array, later: Array }}
 */
export function partitionRefs(refs, selectedVerse) {
  if (!refs || !selectedVerse) return { prior: [], later: [] };

  const selectedPos = getVersePosition(
    selectedVerse.book, selectedVerse.chapter, selectedVerse.verse
  );

  const prior = [];
  const later = [];

  for (const [ref, votes] of refs) {
    const parsed = parseReference(ref);
    if (!parsed) continue;
    const pos = getVersePosition(parsed.book, parsed.chapter, parsed.verseStart);
    const distance = Math.abs(pos - selectedPos);

    if (pos < selectedPos) {
      prior.push({ ref, votes, distance });
    } else if (pos > selectedPos) {
      later.push({ ref, votes, distance });
    }
  }

  prior.sort((a, b) => a.distance - b.distance);
  later.sort((a, b) => a.distance - b.distance);

  return { prior, later };
}
