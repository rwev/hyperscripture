import { describe, it, expect, beforeAll } from 'vitest';
import { resolveInput } from '../../utils/fuzzyBook';
import { seedBibleMeta } from '../setup';

beforeAll(async () => {
  await seedBibleMeta();
});

describe('resolveInput', () => {
  it('returns [] for null/empty input', () => {
    expect(resolveInput(null)).toEqual([]);
    expect(resolveInput('')).toEqual([]);
  });

  it('resolves "gen3" to Genesis chapter 3', () => {
    const results = resolveInput('gen3');
    expect(results.length).toBeGreaterThan(0);
    expect(results[0].abbr).toBe('Gen');
    expect(results[0].chapter).toBe(3);
  });

  it('resolves "gen 3" with space separator', () => {
    const results = resolveInput('gen 3');
    expect(results[0].abbr).toBe('Gen');
    expect(results[0].chapter).toBe(3);
  });

  it('resolves "gen3:16" to Genesis 3:16', () => {
    const results = resolveInput('gen3:16');
    expect(results[0].abbr).toBe('Gen');
    expect(results[0].chapter).toBe(3);
    expect(results[0].verse).toBe(16);
  });

  it('resolves "gen 3:16" with space', () => {
    const results = resolveInput('gen 3:16');
    expect(results[0].abbr).toBe('Gen');
    expect(results[0].chapter).toBe(3);
    expect(results[0].verse).toBe(16);
  });

  it('resolves "john3:16"', () => {
    const results = resolveInput('john3:16');
    expect(results[0].abbr).toBe('John');
    expect(results[0].chapter).toBe(3);
    expect(results[0].verse).toBe(16);
  });

  it('resolves "1cor2" to 1 Corinthians 2', () => {
    const results = resolveInput('1cor2');
    expect(results[0].abbr).toBe('1Cor');
    expect(results[0].chapter).toBe(2);
  });

  it('resolves "1cor12" to 1 Corinthians 12 (not ch 2)', () => {
    const results = resolveInput('1cor12');
    expect(results[0].abbr).toBe('1Cor');
    expect(results[0].chapter).toBe(12);
  });

  it('resolves "ps119:105"', () => {
    const results = resolveInput('ps119:105');
    expect(results[0].abbr).toBe('Ps');
    expect(results[0].chapter).toBe(119);
    expect(results[0].verse).toBe(105);
  });

  it('resolves "rev" to Revelation (book only)', () => {
    const results = resolveInput('rev');
    expect(results[0].abbr).toBe('Rev');
    expect(results[0].chapter).toBe(1); // defaults to 1
    expect(results[0].verse).toBeNull();
    expect(results[0].subtitle).toMatch(/chapter/);
  });

  it('resolves "phil" with Philippians ranked first', () => {
    const results = resolveInput('phil');
    expect(results[0].abbr).toBe('Phil');
  });

  it('filters out-of-range chapters', () => {
    const results = resolveInput('gen99');
    // Gen has 50 chapters, so chapter 99 is invalid
    expect(results.length).toBe(0);
  });

  it('resolves full name "revelation"', () => {
    const results = resolveInput('revelation');
    expect(results[0].abbr).toBe('Rev');
  });

  it('resolves full name "exodus"', () => {
    const results = resolveInput('exodus');
    expect(results[0].abbr).toBe('Exod');
  });

  it('resolves "genesis"', () => {
    const results = resolveInput('genesis');
    expect(results[0].abbr).toBe('Gen');
  });

  it('generates correct display string', () => {
    const results = resolveInput('john3:16');
    expect(results[0].display).toBe('John 3:16');
  });

  it('generates display with chapter only', () => {
    const results = resolveInput('gen3');
    expect(results[0].display).toBe('Genesis 3');
  });

  it('generates display with book only', () => {
    const results = resolveInput('rev');
    expect(results[0].display).toBe('Revelation');
  });
});
