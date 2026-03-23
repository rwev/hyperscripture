/**
 * Recently visited passages, persisted in localStorage.
 * Stores up to MAX_RECENT entries, most recent first.
 * Each entry: { abbr, chapter, verse, display }
 */

const STORAGE_KEY = 'hyperscripture:recent';
const MAX_RECENT = 10;

/**
 * Record a navigation to a passage.
 * Deduplicates by abbr+chapter+verse, moving duplicates to the front.
 * @param {string} abbr
 * @param {number} chapter
 * @param {number|null} verse
 * @param {string} display - Human-readable label (e.g. "John 3:16")
 */
export function recordVisit(abbr, chapter, verse, display) {
  const entries = loadRecent();
  const key = `${abbr}.${chapter}.${verse || ''}`;

  // Remove duplicate if present
  const filtered = entries.filter(e => `${e.abbr}.${e.chapter}.${e.verse || ''}` !== key);

  // Prepend new entry
  filtered.unshift({ abbr, chapter, verse, display });

  // Trim to max
  const trimmed = filtered.slice(0, MAX_RECENT);

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed));
  } catch {
    // Storage unavailable
  }
}

/**
 * Load recent visits from localStorage.
 * @returns {Array<{ abbr: string, chapter: number, verse: number|null, display: string }>}
 */
export function loadRecent() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const arr = JSON.parse(raw);
      if (Array.isArray(arr)) return arr;
    }
  } catch {
    // Corrupt data
  }
  return [];
}
