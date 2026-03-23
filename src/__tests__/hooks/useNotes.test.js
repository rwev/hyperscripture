import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useNotes } from '../../hooks/useNotes';

describe('useNotes', () => {
  it('starts with empty map when storage is empty', () => {
    const { result } = renderHook(() => useNotes());
    expect(result.current.notes.size).toBe(0);
  });

  it('loads existing notes from localStorage', () => {
    localStorage.setItem('hyperscripture:notes', JSON.stringify({
      'Gen.1.1': 'In the beginning...',
    }));
    const { result } = renderHook(() => useNotes());
    expect(result.current.notes.size).toBe(1);
  });

  it('getNote returns empty string for missing key', () => {
    const { result } = renderHook(() => useNotes());
    expect(result.current.getNote('nonexistent')).toBe('');
  });

  it('getNote returns stored note', () => {
    localStorage.setItem('hyperscripture:notes', JSON.stringify({
      'Gen.1.1': 'My note',
    }));
    const { result } = renderHook(() => useNotes());
    expect(result.current.getNote('Gen.1.1')).toBe('My note');
  });

  it('setNote stores a note and persists to localStorage', () => {
    const { result } = renderHook(() => useNotes());
    act(() => {
      result.current.setNote('Gen.1.1', 'Hello world');
    });
    expect(result.current.notes.get('Gen.1.1')).toBe('Hello world');

    const stored = JSON.parse(localStorage.getItem('hyperscripture:notes'));
    expect(stored['Gen.1.1']).toBe('Hello world');
  });

  it('setNote with whitespace-only text deletes the note', () => {
    localStorage.setItem('hyperscripture:notes', JSON.stringify({
      'Gen.1.1': 'Existing note',
    }));
    const { result } = renderHook(() => useNotes());
    act(() => {
      result.current.setNote('Gen.1.1', '   ');
    });
    expect(result.current.notes.has('Gen.1.1')).toBe(false);
  });

  it('setNote with empty string deletes the note', () => {
    localStorage.setItem('hyperscripture:notes', JSON.stringify({
      'Gen.1.1': 'Existing note',
    }));
    const { result } = renderHook(() => useNotes());
    act(() => {
      result.current.setNote('Gen.1.1', '');
    });
    expect(result.current.notes.has('Gen.1.1')).toBe(false);
  });

  it('handles corrupt localStorage gracefully', () => {
    localStorage.setItem('hyperscripture:notes', '{not valid json');
    const { result } = renderHook(() => useNotes());
    expect(result.current.notes.size).toBe(0);
  });
});
