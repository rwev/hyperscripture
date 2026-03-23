/**
 * Export and import all user data stored in localStorage.
 *
 * Covers: bookmarks, notes, reading position, theme, font size,
 * recent visits, and onboarding hint state.
 */

const PREFIX = 'hyperscripture:';

/**
 * Collect all hyperscripture localStorage entries into an object.
 * @returns {object}
 */
function collectData() {
  const data = {};
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(PREFIX)) {
        const shortKey = key.slice(PREFIX.length);
        const raw = localStorage.getItem(key);
        try {
          data[shortKey] = JSON.parse(raw);
        } catch {
          data[shortKey] = raw;
        }
      }
    }
  } catch {
    // localStorage unavailable
  }
  return data;
}

/**
 * Export all user data as a JSON file download.
 */
export function exportUserData() {
  const data = collectData();
  const json = JSON.stringify(data, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);

  const a = document.createElement('a');
  a.href = url;
  a.download = `hyperscripture-backup-${new Date().toISOString().slice(0, 10)}.json`;
  a.click();

  URL.revokeObjectURL(url);
}

/**
 * Import user data from a JSON object, merging into localStorage.
 * Bookmarks and notes are merged (not replaced). Other keys are overwritten.
 * @param {object} data - Parsed JSON from an export file
 * @returns {number} Number of entries imported
 */
export function importUserData(data) {
  if (!data || typeof data !== 'object') return 0;

  let count = 0;
  try {
    for (const [shortKey, value] of Object.entries(data)) {
      const fullKey = PREFIX + shortKey;

      // Merge bookmarks (array → Set union)
      if (shortKey === 'bookmarks' && Array.isArray(value)) {
        const existing = JSON.parse(localStorage.getItem(fullKey) || '[]');
        const merged = [...new Set([...existing, ...value])];
        localStorage.setItem(fullKey, JSON.stringify(merged));
        count++;
        continue;
      }

      // Merge notes (object → shallow merge, existing wins on conflict)
      if (shortKey === 'notes' && typeof value === 'object' && !Array.isArray(value)) {
        const existing = JSON.parse(localStorage.getItem(fullKey) || '{}');
        const merged = { ...value, ...existing };
        localStorage.setItem(fullKey, JSON.stringify(merged));
        count++;
        continue;
      }

      // Overwrite everything else
      const serialized = typeof value === 'string' ? value : JSON.stringify(value);
      localStorage.setItem(fullKey, serialized);
      count++;
    }
  } catch {
    // Storage quota or unavailable
  }
  return count;
}
