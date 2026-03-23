/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useReducer, useCallback, useEffect, useMemo } from 'react';
import { loadMeta } from '../utils/bible';

// ── Two contexts: stable (meta + actions) and volatile (state that changes often) ──

const StableContext = createContext(null);
const StateContext = createContext(null);

export const initialState = {
  meta: null,
  loading: true,
  error: null,
  book: null,
  chapter: 1,
  translation: 'ESV',
  selectedVerse: null,
  navOpen: false,
  navId: 0,
};

export function reducer(state, action) {
  switch (action.type) {
    case 'META_LOADED':
      return { ...state, meta: action.meta, loading: false };

    case 'META_ERROR':
      return { ...state, loading: false, error: action.error };

    case 'NAVIGATE': {
      return {
        ...state,
        book: action.book,
        chapter: action.chapter ?? 1,
        selectedVerse: null,
        navOpen: false,
        navId: (state.navId || 0) + 1,
      };
    }

    case 'SET_CHAPTER': {
      if (state.chapter === action.chapter && state.book === (action.book || state.book)) return state;
      const next = { ...state, chapter: action.chapter };
      if (action.book) next.book = action.book;
      return next;
    }

    case 'SET_TRANSLATION': {
      if (state.translation === action.translation) return state;
      return { ...state, translation: action.translation, selectedVerse: null };
    }

    case 'SELECT_VERSE':
      if (
        state.selectedVerse &&
        state.selectedVerse.book === action.book &&
        state.selectedVerse.chapter === action.chapter &&
        state.selectedVerse.verse === action.verse
      ) {
        return { ...state, selectedVerse: null };
      }
      return {
        ...state,
        selectedVerse: { book: action.book, chapter: action.chapter, verse: action.verse },
      };

    case 'DESELECT_VERSE':
      if (!state.selectedVerse) return state;
      return { ...state, selectedVerse: null };

    case 'TOGGLE_NAV':
      return { ...state, navOpen: !state.navOpen };

    case 'CLOSE_NAV':
      if (!state.navOpen) return state;
      return { ...state, navOpen: false };

    default:
      return state;
  }
}

/**
 * Provider that exposes reader state through two contexts:
 * - StableContext: meta + action callbacks (rarely changes, prevents re-render cascade)
 * - StateContext: volatile state (book, chapter, selectedVerse, etc.)
 */
export function ReaderProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, initialState);

  // Load metadata on mount; do NOT auto-navigate to Genesis here.
  // The HashRouter handles initial navigation after checking the URL hash,
  // avoiding a double-navigate on deep-link loads.
  useEffect(() => {
    loadMeta()
      .then(meta => {
        dispatch({ type: 'META_LOADED', meta });
      })
      .catch(err => {
        console.error('Failed to load Bible metadata:', err);
        dispatch({ type: 'META_ERROR', error: err.message });
      });
  }, []);

  const navigate = useCallback((book, chapter = 1) => {
    dispatch({ type: 'NAVIGATE', book, chapter });
  }, []);

  const setChapter = useCallback((chapter, book) => {
    dispatch({ type: 'SET_CHAPTER', chapter, book });
  }, []);

  const setTranslation = useCallback((translation) => {
    dispatch({ type: 'SET_TRANSLATION', translation });
  }, []);

  const selectVerse = useCallback((book, chapter, verse) => {
    dispatch({ type: 'SELECT_VERSE', book, chapter, verse });
  }, []);

  const deselectVerse = useCallback(() => {
    dispatch({ type: 'DESELECT_VERSE' });
  }, []);

  const toggleNav = useCallback(() => {
    dispatch({ type: 'TOGGLE_NAV' });
  }, []);

  const closeNav = useCallback(() => {
    dispatch({ type: 'CLOSE_NAV' });
  }, []);

  // Stable context: actions never change; meta changes once (null -> loaded)
  const stable = useMemo(() => ({
    navigate,
    setChapter,
    setTranslation,
    selectVerse,
    deselectVerse,
    toggleNav,
    closeNav,
  }), [navigate, setChapter, setTranslation, selectVerse, deselectVerse, toggleNav, closeNav]);

  return (
    <StableContext.Provider value={stable}>
      <StateContext.Provider value={state}>
        {children}
      </StateContext.Provider>
    </StableContext.Provider>
  );
}

/**
 * Access all reader state and actions. Use this when a component needs volatile state.
 */
export function useReader() {
  const stable = useContext(StableContext);
  const state = useContext(StateContext);
  if (!stable || !state) throw new Error('useReader must be used within ReaderProvider');
  return useMemo(() => ({ ...state, ...stable }), [state, stable]);
}

/**
 * Access only action callbacks (navigate, selectVerse, etc.).
 * Components using this hook do NOT re-render on state changes.
 */
export function useReaderActions() {
  const ctx = useContext(StableContext);
  if (!ctx) throw new Error('useReaderActions must be used within ReaderProvider');
  return ctx;
}

/**
 * Access only reader state (book, chapter, meta, etc.).
 * Use when a component needs state but not action callbacks.
 */
export function useReaderState() {
  const ctx = useContext(StateContext);
  if (!ctx) throw new Error('useReaderState must be used within ReaderProvider');
  return ctx;
}
