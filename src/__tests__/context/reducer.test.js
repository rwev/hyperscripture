import { describe, it, expect } from 'vitest';
import { reducer, initialState } from '../../context/ReaderContext';

describe('reducer', () => {
  describe('META_LOADED', () => {
    it('sets meta and clears loading', () => {
      const meta = { books: [] };
      const next = reducer(initialState, { type: 'META_LOADED', meta });
      expect(next.meta).toBe(meta);
      expect(next.loading).toBe(false);
    });
  });

  describe('META_ERROR', () => {
    it('sets error and clears loading', () => {
      const next = reducer(initialState, { type: 'META_ERROR', error: 'network error' });
      expect(next.error).toBe('network error');
      expect(next.loading).toBe(false);
    });
  });

  describe('NAVIGATE', () => {
    it('updates book, chapter, clears selectedVerse, closes nav, increments navId', () => {
      const state = { ...initialState, selectedVerse: { book: 'Gen', chapter: 1, verse: 1 }, navOpen: true };
      const next = reducer(state, { type: 'NAVIGATE', book: 'John', chapter: 3 });
      expect(next.book).toBe('John');
      expect(next.chapter).toBe(3);
      expect(next.selectedVerse).toBeNull();
      expect(next.navOpen).toBe(false);
      expect(next.navId).toBe(1);
    });

    it('defaults chapter to 1 when not provided', () => {
      const next = reducer(initialState, { type: 'NAVIGATE', book: 'Gen' });
      expect(next.chapter).toBe(1);
    });

    it('increments navId from previous value', () => {
      const state = { ...initialState, navId: 5 };
      const next = reducer(state, { type: 'NAVIGATE', book: 'Gen', chapter: 1 });
      expect(next.navId).toBe(6);
    });
  });

  describe('SET_CHAPTER', () => {
    it('updates chapter', () => {
      const state = { ...initialState, book: 'Gen', chapter: 1 };
      const next = reducer(state, { type: 'SET_CHAPTER', chapter: 5 });
      expect(next.chapter).toBe(5);
    });

    it('returns same state when chapter and book unchanged', () => {
      const state = { ...initialState, book: 'Gen', chapter: 3 };
      const next = reducer(state, { type: 'SET_CHAPTER', chapter: 3 });
      expect(next).toBe(state); // exact same reference
    });

    it('updates book when provided', () => {
      const state = { ...initialState, book: 'Gen', chapter: 1 };
      const next = reducer(state, { type: 'SET_CHAPTER', chapter: 1, book: 'Exod' });
      expect(next.book).toBe('Exod');
    });

    it('no-ops when same chapter and explicit same book', () => {
      const state = { ...initialState, book: 'Gen', chapter: 3 };
      const next = reducer(state, { type: 'SET_CHAPTER', chapter: 3, book: 'Gen' });
      expect(next).toBe(state);
    });
  });

  describe('SET_TRANSLATION', () => {
    it('updates translation and clears selectedVerse', () => {
      const state = {
        ...initialState,
        translation: 'ESV',
        selectedVerse: { book: 'Gen', chapter: 1, verse: 1 },
      };
      const next = reducer(state, { type: 'SET_TRANSLATION', translation: 'KJV' });
      expect(next.translation).toBe('KJV');
      expect(next.selectedVerse).toBeNull();
    });

    it('returns same state when translation unchanged', () => {
      const state = { ...initialState, translation: 'ESV' };
      const next = reducer(state, { type: 'SET_TRANSLATION', translation: 'ESV' });
      expect(next).toBe(state);
    });
  });

  describe('SELECT_VERSE', () => {
    it('selects a new verse', () => {
      const next = reducer(initialState, {
        type: 'SELECT_VERSE', book: 'Gen', chapter: 1, verse: 1,
      });
      expect(next.selectedVerse).toEqual({ book: 'Gen', chapter: 1, verse: 1 });
    });

    it('deselects when selecting the same verse (toggle)', () => {
      const state = {
        ...initialState,
        selectedVerse: { book: 'Gen', chapter: 1, verse: 1 },
      };
      const next = reducer(state, {
        type: 'SELECT_VERSE', book: 'Gen', chapter: 1, verse: 1,
      });
      expect(next.selectedVerse).toBeNull();
    });

    it('switches to a different verse', () => {
      const state = {
        ...initialState,
        selectedVerse: { book: 'Gen', chapter: 1, verse: 1 },
      };
      const next = reducer(state, {
        type: 'SELECT_VERSE', book: 'Gen', chapter: 1, verse: 2,
      });
      expect(next.selectedVerse).toEqual({ book: 'Gen', chapter: 1, verse: 2 });
    });
  });

  describe('DESELECT_VERSE', () => {
    it('clears selectedVerse', () => {
      const state = {
        ...initialState,
        selectedVerse: { book: 'Gen', chapter: 1, verse: 1 },
      };
      const next = reducer(state, { type: 'DESELECT_VERSE' });
      expect(next.selectedVerse).toBeNull();
    });

    it('returns same state when no verse selected', () => {
      const next = reducer(initialState, { type: 'DESELECT_VERSE' });
      expect(next).toBe(initialState);
    });
  });

  describe('TOGGLE_NAV', () => {
    it('opens nav when closed', () => {
      const next = reducer(initialState, { type: 'TOGGLE_NAV' });
      expect(next.navOpen).toBe(true);
    });

    it('closes nav when open', () => {
      const state = { ...initialState, navOpen: true };
      const next = reducer(state, { type: 'TOGGLE_NAV' });
      expect(next.navOpen).toBe(false);
    });
  });

  describe('CLOSE_NAV', () => {
    it('closes nav when open', () => {
      const state = { ...initialState, navOpen: true };
      const next = reducer(state, { type: 'CLOSE_NAV' });
      expect(next.navOpen).toBe(false);
    });

    it('returns same state when already closed', () => {
      const next = reducer(initialState, { type: 'CLOSE_NAV' });
      expect(next).toBe(initialState);
    });
  });

  describe('unknown action', () => {
    it('returns same state', () => {
      const next = reducer(initialState, { type: 'UNKNOWN' });
      expect(next).toBe(initialState);
    });
  });
});
