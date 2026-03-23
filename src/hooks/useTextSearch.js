/**
 * Text search hook using the CSS Custom Highlight API.
 *
 * Scans text nodes within a content element for case-insensitive
 * matches, highlights them without DOM mutation, and supports
 * cycling through matches with scroll-into-view.
 *
 * @param {React.RefObject<HTMLElement>} contentRef - Ref to the container to search within
 * @param {React.RefObject<HTMLElement>} scrollRef - Ref to the scroll container (for scrolling to matches)
 * @param {Array} blocks - Current chapter blocks (triggers re-highlight on change)
 * @param {Function} showToast - Toast notification callback
 */

import { useState, useCallback, useEffect, useRef } from 'react';
import { isHighlightSupported } from '../utils/wordfreq';

/**
 * @returns {{ searchOpen, searchQuery, searchMatchCount, searchCurrentIndex, openSearch, closeSearch, searchProps }}
 */
export function useTextSearch(contentRef, scrollRef, blocks, showToast) {
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchMatchCount, setSearchMatchCount] = useState(0);
  const [searchCurrentIndex, setSearchCurrentIndex] = useState(0);
  const rangesRef = useRef([]);

  const openSearch = useCallback(() => {
    if (!isHighlightSupported()) {
      showToast('Search not supported in this browser');
      return;
    }
    setSearchOpen(true);
    setSearchQuery('');
    setSearchMatchCount(0);
    setSearchCurrentIndex(0);
  }, [showToast]);

  const closeSearch = useCallback(() => {
    setSearchOpen(false);
    setSearchQuery('');
    setSearchMatchCount(0);
    setSearchCurrentIndex(0);
    rangesRef.current = [];
    CSS.highlights.delete('search-match');
    CSS.highlights.delete('search-current');
  }, []);

  const applyHighlights = useCallback((query) => {
    CSS.highlights.delete('search-match');
    CSS.highlights.delete('search-current');
    rangesRef.current = [];

    if (!query || query.length < 2 || !contentRef.current) {
      setSearchMatchCount(0);
      setSearchCurrentIndex(0);
      return;
    }

    const lower = query.toLowerCase();
    const walker = document.createTreeWalker(contentRef.current, NodeFilter.SHOW_TEXT);
    const ranges = [];
    let node;

    while ((node = walker.nextNode())) {
      const text = node.textContent.toLowerCase();
      let idx = text.indexOf(lower);
      while (idx !== -1) {
        try {
          const range = new Range();
          range.setStart(node, idx);
          range.setEnd(node, idx + query.length);
          ranges.push(range);
        } catch {
          // Node boundary issue; skip
        }
        idx = text.indexOf(lower, idx + 1);
      }
    }

    rangesRef.current = ranges;
    setSearchMatchCount(ranges.length);

    if (ranges.length > 0) {
      CSS.highlights.set('search-match', new Highlight(...ranges));
      setSearchCurrentIndex(0);
      CSS.highlights.set('search-current', new Highlight(ranges[0]));
    }
  }, [contentRef]);

  const scrollToMatch = useCallback((index) => {
    const ranges = rangesRef.current;
    if (ranges.length === 0) return;
    const wrappedIndex = ((index % ranges.length) + ranges.length) % ranges.length;
    setSearchCurrentIndex(wrappedIndex);

    CSS.highlights.set('search-current', new Highlight(ranges[wrappedIndex]));

    const range = ranges[wrappedIndex];
    const el = range.startContainer.parentElement;
    if (el && scrollRef.current) {
      const containerRect = scrollRef.current.getBoundingClientRect();
      const elRect = el.getBoundingClientRect();
      if (elRect.top < containerRect.top || elRect.bottom > containerRect.bottom) {
        scrollRef.current.scrollTop += elRect.top - containerRect.top - containerRect.height / 3;
      }
    }
  }, [scrollRef]);

  // Re-apply highlights when blocks change while search is open
  useEffect(() => {
    if (searchOpen && searchQuery.length >= 2) {
      const timer = setTimeout(() => applyHighlights(searchQuery), 100);
      return () => clearTimeout(timer);
    }
  }, [blocks, searchOpen, searchQuery, applyHighlights]);

  // Clean up highlights on unmount (e.g. if search is open when Reader unmounts)
  useEffect(() => {
    return () => {
      if (isHighlightSupported()) {
        CSS.highlights.delete('search-match');
        CSS.highlights.delete('search-current');
      }
    };
  }, []);

  /** Props bundle for the search bar input element. */
  const searchBarProps = {
    value: searchQuery,
    onChange: (e) => {
      const q = e.target.value;
      setSearchQuery(q);
      applyHighlights(q);
    },
    onKeyDown: (e) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        closeSearch();
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (e.shiftKey) {
          scrollToMatch(searchCurrentIndex - 1);
        } else {
          scrollToMatch(searchCurrentIndex + 1);
        }
      }
    },
  };

  return {
    searchOpen,
    searchQuery,
    searchMatchCount,
    searchCurrentIndex,
    openSearch,
    closeSearch,
    searchBarProps,
  };
}
