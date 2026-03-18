import { createContext, useContext, useReducer, useCallback, useEffect, useMemo } from 'react';
import { loadMeta } from '../utils/bible';

const ReaderContext = createContext(null);

const initialState = {
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

function reducer(state, action) {
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

export function ReaderProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, initialState);

  // Load metadata on mount, then default to Genesis 1
  useEffect(() => {
    loadMeta()
      .then(meta => {
        dispatch({ type: 'META_LOADED', meta });
        dispatch({ type: 'NAVIGATE', book: meta.books[0].abbr, chapter: 1 });
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

  const value = useMemo(() => ({
    ...state,
    navigate,
    setChapter,
    setTranslation,
    selectVerse,
    deselectVerse,
    toggleNav,
    closeNav,
  }), [state, navigate, setChapter, setTranslation, selectVerse, deselectVerse, toggleNav, closeNav]);

  return (
    <ReaderContext.Provider value={value}>
      {children}
    </ReaderContext.Provider>
  );
}

export function useReader() {
  const ctx = useContext(ReaderContext);
  if (!ctx) throw new Error('useReader must be used within ReaderProvider');
  return ctx;
}
