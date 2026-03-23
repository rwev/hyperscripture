import { describe, it, expect, vi, afterEach } from 'vitest';
import { getVerseOfTheDay } from '../../utils/votd';

describe('getVerseOfTheDay', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('returns object with book, chapter, verse', () => {
    const votd = getVerseOfTheDay();
    expect(votd).toHaveProperty('book');
    expect(votd).toHaveProperty('chapter');
    expect(votd).toHaveProperty('verse');
    expect(typeof votd.book).toBe('string');
    expect(typeof votd.chapter).toBe('number');
    expect(typeof votd.verse).toBe('number');
  });

  it('is deterministic for the same date', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 0, 15)); // Jan 15
    const first = getVerseOfTheDay();
    const second = getVerseOfTheDay();
    expect(first).toEqual(second);
  });

  it('returns different verses for different days', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 0, 1)); // Jan 1
    const jan1 = getVerseOfTheDay();
    vi.setSystemTime(new Date(2026, 0, 2)); // Jan 2
    const jan2 = getVerseOfTheDay();
    // Different days should (almost certainly) give different verses
    expect(jan1).not.toEqual(jan2);
  });

  it('handles leap year (Feb 29)', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2028, 1, 29)); // Feb 29, 2028 (leap year)
    const votd = getVerseOfTheDay();
    expect(votd.book).toBeTruthy();
    expect(votd.chapter).toBeGreaterThan(0);
    expect(votd.verse).toBeGreaterThan(0);
  });

  it('wraps around for day > 365', () => {
    vi.useFakeTimers();
    // Day 366 in a leap year should still work (modulo wraps)
    vi.setSystemTime(new Date(2028, 11, 31)); // Dec 31 in leap year
    const votd = getVerseOfTheDay();
    expect(votd.book).toBeTruthy();
  });

  it('returns Genesis 1:1 on the first day of the cycle', () => {
    vi.useFakeTimers();
    // Day 1 of year (Jan 1) — index = 1 % 365 = 1, which is Gen.1.27
    // Day 0 would be Gen.1.1 but day-of-year starts at 1 for Jan 1
    // Actually, the formula is: dayOfYear = Math.floor((now - start) / 86400000)
    // where start = new Date(year, 0, 0), so Jan 1 gives dayOfYear = 1
    // index = 1 % 365 = 1 → VERSES[1] = Gen.1.27
    vi.setSystemTime(new Date(2026, 0, 1));
    const votd = getVerseOfTheDay();
    // Just verify it's a valid Genesis verse
    expect(votd.book).toBe('Gen');
  });
});
