/**
 * Word frequency analysis and CSS Custom Highlight API integration.
 *
 * Scans text nodes within a container for recurring words,
 * then uses CSS.highlights to visually mark them without DOM mutation.
 */

const HIGHLIGHT_NAME = 'word-freq';
const MIN_OCCURRENCES = 3;
const MIN_WORD_LENGTH = 4;

/** Common English stop words to exclude from highlighting. */
const STOP_WORDS = new Set([
  'a', 'an', 'the', 'and', 'but', 'for', 'nor', 'not', 'yet', 'so',
  'or', 'as', 'at', 'by', 'in', 'of', 'on', 'to', 'up', 'is', 'it',
  'be', 'do', 'he', 'we', 'me', 'my', 'no', 'if', 'am', 'us', 'his',
  'her', 'him', 'its', 'our', 'who', 'how', 'all', 'has', 'had', 'was',
  'are', 'did', 'she', 'you', 'can', 'may', 'let', 'say', 'any',
  'this', 'that', 'them', 'they', 'than', 'then', 'what', 'when',
  'with', 'will', 'were', 'been', 'have', 'from', 'your', 'said',
  'each', 'does', 'also', 'into', 'upon', 'over', 'come', 'came',
  'went', 'made', 'which', 'there', 'their', 'these', 'those',
  'would', 'could', 'shall', 'should', 'about', 'before', 'after',
  'because', 'through', 'against', 'every',
]);

/**
 * Check if the CSS Custom Highlight API is available.
 * @returns {boolean}
 */
export function isHighlightSupported() {
  return typeof CSS !== 'undefined' && CSS.highlights != null;
}

/**
 * Collect all text nodes under a container element.
 * @param {Element} container
 * @returns {Text[]}
 */
function getTextNodes(container) {
  const nodes = [];
  const walker = document.createTreeWalker(container, NodeFilter.SHOW_TEXT);
  let node;
  while ((node = walker.nextNode())) {
    if (node.textContent.trim()) {
      nodes.push(node);
    }
  }
  return nodes;
}

/**
 * Analyze word frequencies and create highlight ranges.
 *
 * @param {Element} container - The DOM element to scan (e.g. .reader-content)
 * @returns {boolean} true if highlights were applied
 */
export function applyWordFrequencyHighlights(container) {
  if (!isHighlightSupported() || !container) return false;

  clearWordFrequencyHighlights();

  const textNodes = getTextNodes(container);

  // Build frequency map
  const wordPositions = new Map(); // word -> [{ node, start, end }]
  const wordPattern = /[a-zA-Z]+/g;

  for (const node of textNodes) {
    const text = node.textContent;
    let match;
    wordPattern.lastIndex = 0;
    while ((match = wordPattern.exec(text))) {
      const word = match[0].toLowerCase();
      if (word.length < MIN_WORD_LENGTH) continue;
      if (STOP_WORDS.has(word)) continue;

      if (!wordPositions.has(word)) {
        wordPositions.set(word, []);
      }
      wordPositions.set(word, [...wordPositions.get(word), {
        node,
        start: match.index,
        end: match.index + match[0].length,
      }]);
    }
  }

  // Create ranges for words with enough occurrences
  const ranges = [];
  for (const [, positions] of wordPositions) {
    if (positions.length < MIN_OCCURRENCES) continue;
    for (const pos of positions) {
      try {
        const range = new Range();
        range.setStart(pos.node, pos.start);
        range.setEnd(pos.node, pos.end);
        ranges.push(range);
      } catch {
        // Node may have been removed; skip
      }
    }
  }

  if (ranges.length === 0) return false;

  const highlight = new Highlight(...ranges);
  CSS.highlights.set(HIGHLIGHT_NAME, highlight);
  return true;
}

/**
 * Remove word frequency highlights.
 */
export function clearWordFrequencyHighlights() {
  if (!isHighlightSupported()) return;
  CSS.highlights.delete(HIGHLIGHT_NAME);
}
