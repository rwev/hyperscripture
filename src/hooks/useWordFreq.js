/**
 * Word frequency highlighting hook.
 *
 * Wraps the wordfreq utility with React state management.
 * Toggled on/off, auto-updates when blocks change.
 *
 * @param {React.RefObject<HTMLElement>} contentRef - Ref to the container to scan
 * @param {Array} blocks - Current chapter blocks (triggers re-highlight on change)
 * @param {Function} showToast - Toast notification callback
 */

import { useState, useCallback, useEffect } from 'react';
import {
  applyWordFrequencyHighlights,
  clearWordFrequencyHighlights,
  isHighlightSupported,
} from '../utils/wordfreq';

/**
 * @returns {{ wordFreqOn: boolean, toggleWordFreq: Function }}
 */
export function useWordFreq(contentRef, blocks, showToast) {
  const [wordFreqOn, setWordFreqOn] = useState(false);

  const toggleWordFreq = useCallback(() => {
    if (!isHighlightSupported()) {
      showToast('Word highlighting not supported in this browser');
      return;
    }
    setWordFreqOn(prev => {
      showToast(prev ? 'Word patterns off' : 'Word patterns on');
      return !prev;
    });
  }, [showToast]);

  // Apply/clear highlights when toggled or blocks change
  useEffect(() => {
    if (!wordFreqOn) {
      clearWordFrequencyHighlights();
      return;
    }
    const timer = setTimeout(() => {
      if (contentRef.current) {
        applyWordFrequencyHighlights(contentRef.current);
      }
    }, 100);
    return () => clearTimeout(timer);
  }, [wordFreqOn, blocks, contentRef]);

  // Clean up on unmount
  useEffect(() => {
    return () => clearWordFrequencyHighlights();
  }, []);

  return { wordFreqOn, toggleWordFreq };
}
