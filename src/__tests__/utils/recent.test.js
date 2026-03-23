import { describe, it, expect } from 'vitest';
import { recordVisit, loadRecent } from '../../utils/recent';

describe('loadRecent', () => {
  it('returns [] when storage is empty', () => {
    expect(loadRecent()).toEqual([]);
  });

  it('returns [] for corrupt JSON', () => {
    localStorage.setItem('hyperscripture:recent', '{bad json');
    expect(loadRecent()).toEqual([]);
  });

  it('returns [] for non-array JSON', () => {
    localStorage.setItem('hyperscripture:recent', '{"not":"array"}');
    expect(loadRecent()).toEqual([]);
  });
});

describe('recordVisit', () => {
  it('adds an entry that appears in loadRecent', () => {
    recordVisit('Gen', 1, 1, 'Genesis 1:1');
    const recent = loadRecent();
    expect(recent.length).toBe(1);
    expect(recent[0]).toEqual({
      abbr: 'Gen', chapter: 1, verse: 1, display: 'Genesis 1:1',
    });
  });

  it('prepends new entries (most recent first)', () => {
    recordVisit('Gen', 1, 1, 'Genesis 1:1');
    recordVisit('John', 3, 16, 'John 3:16');
    const recent = loadRecent();
    expect(recent[0].abbr).toBe('John');
    expect(recent[1].abbr).toBe('Gen');
  });

  it('deduplicates by moving to front', () => {
    recordVisit('Gen', 1, 1, 'Genesis 1:1');
    recordVisit('John', 3, 16, 'John 3:16');
    recordVisit('Gen', 1, 1, 'Genesis 1:1');
    const recent = loadRecent();
    expect(recent.length).toBe(2);
    expect(recent[0].abbr).toBe('Gen');
  });

  it('trims to max 10 entries', () => {
    for (let i = 1; i <= 11; i++) {
      recordVisit('Gen', i, 1, `Genesis ${i}:1`);
    }
    const recent = loadRecent();
    expect(recent.length).toBe(10);
    expect(recent[0].chapter).toBe(11); // most recent
  });

  it('handles null verse in key', () => {
    recordVisit('Gen', 1, null, 'Genesis 1');
    recordVisit('Gen', 1, null, 'Genesis 1'); // duplicate
    const recent = loadRecent();
    expect(recent.length).toBe(1);
  });
});
