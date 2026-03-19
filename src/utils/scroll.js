/**
 * Scroll to a verse element by ID using retry-based requestAnimationFrame polling.
 * Highlights the verse briefly after scrolling.
 *
 * @param {string} verseId - DOM element ID (e.g., "Gen.1.1")
 * @param {object} options
 * @param {function} [options.onFound] - Callback when the element is found
 * @param {number} [options.maxAttempts] - Max rAF retries (default 30)
 */
export function scrollToVerse(verseId, { onFound, maxAttempts = 30 } = {}) {
  let attempts = 0;
  const tryScroll = () => {
    const el = document.getElementById(verseId);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      el.dataset.highlight = 'true';
      setTimeout(() => { delete el.dataset.highlight; }, 2000);
      if (onFound) onFound(el);
    } else if (attempts < maxAttempts) {
      attempts++;
      requestAnimationFrame(tryScroll);
    }
  };
  requestAnimationFrame(tryScroll);
}
