import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  isHighlightSupported,
  applyWordFrequencyHighlights,
  clearWordFrequencyHighlights,
} from '../../utils/wordfreq';

describe('isHighlightSupported', () => {
  const originalCSS = globalThis.CSS;

  afterEach(() => {
    globalThis.CSS = originalCSS;
  });

  it('returns true when CSS.highlights exists', () => {
    globalThis.CSS = { highlights: new Map() };
    expect(isHighlightSupported()).toBe(true);
  });

  it('returns false when CSS is undefined', () => {
    globalThis.CSS = undefined;
    expect(isHighlightSupported()).toBe(false);
  });

  it('returns false when CSS.highlights is null', () => {
    globalThis.CSS = { highlights: null };
    expect(isHighlightSupported()).toBe(false);
  });
});

describe('applyWordFrequencyHighlights', () => {
  const originalCSS = globalThis.CSS;

  beforeEach(() => {
    // Mock CSS.highlights
    globalThis.CSS = {
      highlights: {
        set: vi.fn(),
        delete: vi.fn(),
      },
    };
    // Mock Highlight constructor (must be a real class to use with `new`)
    globalThis.Highlight = class Highlight {
      constructor(...ranges) { this.ranges = ranges; }
    };
  });

  afterEach(() => {
    globalThis.CSS = originalCSS;
    delete globalThis.Highlight;
  });

  it('returns false for null container', () => {
    expect(applyWordFrequencyHighlights(null)).toBe(false);
  });

  it('returns false when highlight API not supported', () => {
    globalThis.CSS = undefined;
    const container = document.createElement('div');
    expect(applyWordFrequencyHighlights(container)).toBe(false);
  });

  it('returns false when no words meet minimum occurrences', () => {
    const container = document.createElement('div');
    container.textContent = 'hello world unique words'; // each word appears once
    expect(applyWordFrequencyHighlights(container)).toBe(false);
  });

  it('returns true and highlights recurring words (>= 3 occurrences, >= 4 chars)', () => {
    const container = document.createElement('div');
    // "word" appears 4 times, meets both MIN_OCCURRENCES (3) and MIN_WORD_LENGTH (4)
    container.textContent = 'This word is a word and another word plus word again';
    const result = applyWordFrequencyHighlights(container);
    expect(result).toBe(true);
    expect(CSS.highlights.set).toHaveBeenCalledWith('word-freq', expect.anything());
  });

  it('excludes stop words even with enough occurrences', () => {
    const container = document.createElement('div');
    // "this" is a stop word, appears 4 times but should be excluded
    // "long" is only 4 chars and appears 3 times
    container.textContent = 'this this this this only long long long';
    const result = applyWordFrequencyHighlights(container);
    // "long" (4 chars, 3 occurrences) should be highlighted
    // "this" is a stop word, excluded
    // "only" appears once, excluded
    expect(result).toBe(true);
  });

  it('excludes short words (< 4 characters)', () => {
    const container = document.createElement('div');
    // "cat" is 3 chars, below MIN_WORD_LENGTH
    container.textContent = 'cat cat cat cat cat';
    expect(applyWordFrequencyHighlights(container)).toBe(false);
  });
});

describe('clearWordFrequencyHighlights', () => {
  const originalCSS = globalThis.CSS;

  afterEach(() => {
    globalThis.CSS = originalCSS;
  });

  it('calls CSS.highlights.delete', () => {
    globalThis.CSS = {
      highlights: { delete: vi.fn(), set: vi.fn() },
    };
    clearWordFrequencyHighlights();
    expect(CSS.highlights.delete).toHaveBeenCalledWith('word-freq');
  });

  it('does nothing when API not supported', () => {
    globalThis.CSS = undefined;
    expect(() => clearWordFrequencyHighlights()).not.toThrow();
  });
});
