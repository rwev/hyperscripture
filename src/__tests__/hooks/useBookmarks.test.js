import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useBookmarks } from '../../hooks/useBookmarks';

describe('useBookmarks', () => {
  it('starts with empty set when storage is empty', () => {
    const { result } = renderHook(() => useBookmarks());
    expect(result.current.bookmarks.size).toBe(0);
  });

  it('loads existing bookmarks from localStorage', () => {
    localStorage.setItem('hyperscripture:bookmarks', JSON.stringify(['Gen.1.1', 'John.3.16']));
    const { result } = renderHook(() => useBookmarks());
    expect(result.current.bookmarks.size).toBe(2);
    expect(result.current.bookmarks.has('Gen.1.1')).toBe(true);
  });

  it('toggle adds a verse and returns true', () => {
    const { result } = renderHook(() => useBookmarks());
    let added;
    act(() => {
      added = result.current.toggle('Gen.1.1');
    });
    expect(added).toBe(true);
    expect(result.current.bookmarks.has('Gen.1.1')).toBe(true);
  });

  it('toggle removes a verse and returns false', () => {
    localStorage.setItem('hyperscripture:bookmarks', JSON.stringify(['Gen.1.1']));
    const { result } = renderHook(() => useBookmarks());
    let added;
    act(() => {
      added = result.current.toggle('Gen.1.1');
    });
    expect(added).toBe(false);
    expect(result.current.bookmarks.has('Gen.1.1')).toBe(false);
  });

  it('persists to localStorage on toggle', () => {
    const { result } = renderHook(() => useBookmarks());
    act(() => {
      result.current.toggle('Gen.1.1');
    });
    const stored = JSON.parse(localStorage.getItem('hyperscripture:bookmarks'));
    expect(stored).toContain('Gen.1.1');
  });

  it('handles corrupt localStorage gracefully', () => {
    localStorage.setItem('hyperscripture:bookmarks', '{bad json');
    const { result } = renderHook(() => useBookmarks());
    expect(result.current.bookmarks.size).toBe(0);
  });

  it('handles non-array localStorage gracefully', () => {
    localStorage.setItem('hyperscripture:bookmarks', '"not an array"');
    const { result } = renderHook(() => useBookmarks());
    expect(result.current.bookmarks.size).toBe(0);
  });
});
