import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { scrollToVerse } from '../../utils/scroll';

describe('scrollToVerse', () => {
  let rafCallbacks;
  let originalRAF;
  let originalCAF;

  beforeEach(() => {
    rafCallbacks = [];
    originalRAF = globalThis.requestAnimationFrame;
    originalCAF = globalThis.cancelAnimationFrame;

    let rafId = 0;
    globalThis.requestAnimationFrame = vi.fn((cb) => {
      const id = ++rafId;
      rafCallbacks.push({ id, cb });
      return id;
    });
    globalThis.cancelAnimationFrame = vi.fn();
  });

  afterEach(() => {
    globalThis.requestAnimationFrame = originalRAF;
    globalThis.cancelAnimationFrame = originalCAF;
    vi.restoreAllMocks();
  });

  function flushRAF() {
    const pending = [...rafCallbacks];
    rafCallbacks = [];
    pending.forEach(({ cb }) => cb());
  }

  it('calls scrollIntoView when element found immediately', () => {
    const mockEl = {
      scrollIntoView: vi.fn(),
      dataset: {},
    };
    vi.spyOn(document, 'getElementById').mockReturnValue(mockEl);

    scrollToVerse('Gen.1.1');
    flushRAF();

    expect(mockEl.scrollIntoView).toHaveBeenCalledWith({
      behavior: 'smooth', block: 'center',
    });
  });

  it('fires onFound callback when element found', () => {
    const mockEl = { scrollIntoView: vi.fn(), dataset: {} };
    vi.spyOn(document, 'getElementById').mockReturnValue(mockEl);
    const onFound = vi.fn();

    scrollToVerse('Gen.1.1', { onFound });
    flushRAF();

    expect(onFound).toHaveBeenCalledWith(mockEl);
  });

  it('sets and clears data-highlight', () => {
    vi.useFakeTimers({ shouldAdvanceTime: false });
    // Override rAF to execute synchronously under fake timers
    globalThis.requestAnimationFrame = vi.fn((cb) => { cb(); return 1; });

    const mockEl = { scrollIntoView: vi.fn(), dataset: {} };
    vi.spyOn(document, 'getElementById').mockReturnValue(mockEl);

    scrollToVerse('Gen.1.1');

    expect(mockEl.dataset.highlight).toBe('true');

    vi.advanceTimersByTime(2000);
    expect(mockEl.dataset.highlight).toBeUndefined();

    vi.useRealTimers();
  });

  it('retries via rAF when element not found', () => {
    vi.spyOn(document, 'getElementById').mockReturnValue(null);

    scrollToVerse('Gen.1.1', { maxAttempts: 3 });

    // First rAF call
    flushRAF(); // attempt 1 — not found, schedules retry
    expect(requestAnimationFrame).toHaveBeenCalledTimes(2); // initial + 1 retry

    flushRAF(); // attempt 2
    expect(requestAnimationFrame).toHaveBeenCalledTimes(3);

    flushRAF(); // attempt 3
    expect(requestAnimationFrame).toHaveBeenCalledTimes(4);

    flushRAF(); // attempt 4 — exceeds maxAttempts, no more retries
    expect(requestAnimationFrame).toHaveBeenCalledTimes(4);
  });

  it('cancel aborts retry loop', () => {
    vi.spyOn(document, 'getElementById').mockReturnValue(null);

    const cancel = scrollToVerse('Gen.1.1');
    cancel();

    flushRAF(); // should not schedule another retry
    expect(cancelAnimationFrame).toHaveBeenCalled();
  });
});
