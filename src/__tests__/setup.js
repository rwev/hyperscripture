/**
 * Shared test setup: seeds bible.js module state and clears localStorage.
 */
import '@testing-library/jest-dom';
import { loadMeta } from '../utils/bible';

/** Minimal mock meta.json with enough books for testing. */
export const MOCK_META = {
  default_translation: 'ESV',
  translations: [
    { id: 'ESV', name: 'English Standard Version' },
    { id: 'KJV', name: 'King James Version' },
  ],
  books: [
    { abbr: 'Gen', name: 'Genesis', testament: 'OT', chapters: 50, file: '01-Gen.json' },
    { abbr: 'Exod', name: 'Exodus', testament: 'OT', chapters: 40, file: '02-Exod.json' },
    { abbr: 'Ps', name: 'Psalms', testament: 'OT', chapters: 150, file: '19-Ps.json' },
    { abbr: 'Isa', name: 'Isaiah', testament: 'OT', chapters: 66, file: '23-Isa.json' },
    { abbr: 'Matt', name: 'Matthew', testament: 'NT', chapters: 28, file: '40-Matt.json' },
    { abbr: 'John', name: 'John', testament: 'NT', chapters: 21, file: '43-John.json' },
    { abbr: 'Rom', name: 'Romans', testament: 'NT', chapters: 16, file: '45-Rom.json' },
    { abbr: 'Phil', name: 'Philippians', testament: 'NT', chapters: 4, file: '50-Phil.json' },
    { abbr: 'Phlm', name: 'Philemon', testament: 'NT', chapters: 1, file: '57-Phlm.json' },
    { abbr: '1Cor', name: '1 Corinthians', testament: 'NT', chapters: 16, file: '46-1Cor.json' },
    { abbr: 'Rev', name: 'Revelation', testament: 'NT', chapters: 22, file: '66-Rev.json' },
  ],
};

/**
 * Seed bible.js module state by mocking fetch and calling loadMeta().
 * Call in beforeAll of tests that depend on bible.js.
 */
export async function seedBibleMeta() {
  globalThis.fetch = vi.fn().mockResolvedValue({
    json: () => Promise.resolve(structuredClone(MOCK_META)),
  });

  // import.meta.env.BASE_URL defaults to '/' in vitest
  await loadMeta();

  vi.restoreAllMocks();
}

// Clear localStorage before each test
beforeEach(() => {
  localStorage.clear();
});
