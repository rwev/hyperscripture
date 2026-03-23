import { describe, it, expect, beforeAll } from 'vitest';
import { partitionRefs } from '../../utils/crossref';
import { seedBibleMeta } from '../setup';

beforeAll(async () => {
  await seedBibleMeta();
});

describe('partitionRefs', () => {
  it('returns empty arrays for null refs', () => {
    expect(partitionRefs(null, { book: 'Gen', chapter: 1, verse: 1 }))
      .toEqual({ prior: [], later: [] });
  });

  it('returns empty arrays for null selectedVerse', () => {
    expect(partitionRefs([['Gen.1.1', 10]], null))
      .toEqual({ prior: [], later: [] });
  });

  it('partitions refs before selected verse into prior', () => {
    const selected = { book: 'Exod', chapter: 1, verse: 1 };
    const refs = [['Gen.1.1', 10], ['Gen.50.1', 5]];
    const { prior, later } = partitionRefs(refs, selected);

    expect(prior.length).toBe(2);
    expect(later.length).toBe(0);
    expect(prior[0].ref).toBe('Gen.50.1'); // closer to Exod
    expect(prior[1].ref).toBe('Gen.1.1');  // farther
  });

  it('partitions refs after selected verse into later', () => {
    const selected = { book: 'Gen', chapter: 1, verse: 1 };
    const refs = [['John.3.16', 100], ['Exod.1.1', 50]];
    const { prior, later } = partitionRefs(refs, selected);

    expect(prior.length).toBe(0);
    expect(later.length).toBe(2);
    expect(later[0].ref).toBe('Exod.1.1'); // closer to Gen
    expect(later[1].ref).toBe('John.3.16');
  });

  it('handles mixed prior and later', () => {
    const selected = { book: 'John', chapter: 3, verse: 16 };
    const refs = [['Gen.1.1', 10], ['Rev.22.21', 5]];
    const { prior, later } = partitionRefs(refs, selected);

    expect(prior.length).toBe(1);
    expect(prior[0].ref).toBe('Gen.1.1');
    expect(later.length).toBe(1);
    expect(later[0].ref).toBe('Rev.22.21');
  });

  it('excludes refs at same position', () => {
    const selected = { book: 'Gen', chapter: 1, verse: 1 };
    const refs = [['Gen.1.1', 10]];
    const { prior, later } = partitionRefs(refs, selected);

    expect(prior.length).toBe(0);
    expect(later.length).toBe(0);
  });

  it('skips unparseable refs', () => {
    const selected = { book: 'Gen', chapter: 1, verse: 1 };
    const refs = [['invalid', 10], ['John.1.1', 5]];
    const { prior, later } = partitionRefs(refs, selected);

    expect(prior.length).toBe(0);
    expect(later.length).toBe(1);
    expect(later[0].ref).toBe('John.1.1');
  });

  it('sorts by ascending distance', () => {
    const selected = { book: 'John', chapter: 1, verse: 1 };
    const refs = [['Gen.1.1', 10], ['Matt.1.1', 5], ['Exod.1.1', 8]];
    const { prior } = partitionRefs(refs, selected);

    expect(prior.length).toBe(3);
    // Matt is closest to John, then Exod, then Gen
    expect(prior[0].ref).toBe('Matt.1.1');
    expect(prior[1].ref).toBe('Exod.1.1');
    expect(prior[2].ref).toBe('Gen.1.1');
  });
});
