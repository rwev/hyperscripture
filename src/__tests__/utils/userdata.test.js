import { describe, it, expect, vi } from 'vitest';
import { importUserData, exportUserData } from '../../utils/userdata';

describe('importUserData', () => {
  it('returns 0 for null input', () => {
    expect(importUserData(null)).toBe(0);
  });

  it('returns 0 for non-object input', () => {
    expect(importUserData('string')).toBe(0);
    expect(importUserData(42)).toBe(0);
  });

  it('returns 0 for empty object', () => {
    expect(importUserData({})).toBe(0);
  });

  it('merges bookmarks via Set union', () => {
    localStorage.setItem('hyperscripture:bookmarks', JSON.stringify(['Gen.1.1', 'John.3.16']));
    const count = importUserData({ bookmarks: ['Gen.1.1', 'Rev.22.21'] });
    expect(count).toBe(1);

    const stored = JSON.parse(localStorage.getItem('hyperscripture:bookmarks'));
    expect(stored).toContain('Gen.1.1');
    expect(stored).toContain('John.3.16');
    expect(stored).toContain('Rev.22.21');
    expect(stored.length).toBe(3); // no duplicates
  });

  it('merges notes with existing values winning on conflict', () => {
    localStorage.setItem('hyperscripture:notes', JSON.stringify({
      'Gen.1.1': 'existing note',
      'John.3.16': 'old note',
    }));
    const count = importUserData({
      notes: { 'Gen.1.1': 'imported note', 'Rev.1.1': 'new note' },
    });
    expect(count).toBe(1);

    const stored = JSON.parse(localStorage.getItem('hyperscripture:notes'));
    expect(stored['Gen.1.1']).toBe('existing note'); // existing wins
    expect(stored['John.3.16']).toBe('old note');     // preserved
    expect(stored['Rev.1.1']).toBe('new note');       // added from import
  });

  it('overwrites other keys', () => {
    localStorage.setItem('hyperscripture:theme', '"light"');
    importUserData({ theme: 'dark' });
    // String values are stored as-is (not JSON-stringified)
    expect(localStorage.getItem('hyperscripture:theme')).toBe('dark');
  });

  it('returns correct count for multiple keys', () => {
    const count = importUserData({
      bookmarks: ['Gen.1.1'],
      theme: 'dark',
      position: { book: 'Gen', chapter: 1 },
    });
    expect(count).toBe(3);
  });

  it('handles string values without double-serialization', () => {
    importUserData({ theme: 'dark' });
    // String values should be stored as-is, not JSON-stringified
    expect(localStorage.getItem('hyperscripture:theme')).toBe('dark');
  });
});

describe('exportUserData', () => {
  it('collects all hyperscripture: prefixed keys', () => {
    localStorage.setItem('hyperscripture:theme', '"dark"');
    localStorage.setItem('hyperscripture:bookmarks', '["Gen.1.1"]');
    localStorage.setItem('other-key', 'ignored');

    // Mock DOM APIs used by exportUserData
    const mockClick = vi.fn();
    const mockCreateElement = vi.spyOn(document, 'createElement').mockReturnValue({
      href: '',
      download: '',
      click: mockClick,
    });
    const mockCreateObjectURL = vi.fn().mockReturnValue('blob:test');
    const mockRevokeObjectURL = vi.fn();
    globalThis.URL.createObjectURL = mockCreateObjectURL;
    globalThis.URL.revokeObjectURL = mockRevokeObjectURL;

    exportUserData();

    expect(mockClick).toHaveBeenCalled();
    expect(mockCreateObjectURL).toHaveBeenCalledWith(expect.any(Blob));
    expect(mockRevokeObjectURL).toHaveBeenCalledWith('blob:test');

    mockCreateElement.mockRestore();
  });
});
