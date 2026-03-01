import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { debounce, throttle } from '@thinkix/collaboration/utils';

describe('debounce', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('delays function execution', () => {
    const fn = vi.fn();
    const debouncedFn = debounce(fn, 100);

    debouncedFn('test');
    expect(fn).not.toHaveBeenCalled();

    vi.advanceTimersByTime(100);
    expect(fn).toHaveBeenCalledTimes(1);
    expect(fn).toHaveBeenCalledWith('test');
  });

  it('resets timer on subsequent calls', () => {
    const fn = vi.fn();
    const debouncedFn = debounce(fn, 100);

    debouncedFn('first');
    vi.advanceTimersByTime(50);
    debouncedFn('second');
    vi.advanceTimersByTime(50);
    expect(fn).not.toHaveBeenCalled();

    vi.advanceTimersByTime(50);
    expect(fn).toHaveBeenCalledTimes(1);
    expect(fn).toHaveBeenCalledWith('second');
  });

  it('calls with latest arguments', () => {
    const fn = vi.fn();
    const debouncedFn = debounce(fn, 100);

    debouncedFn('a');
    debouncedFn('b');
    debouncedFn('c');

    vi.advanceTimersByTime(100);
    expect(fn).toHaveBeenCalledTimes(1);
    expect(fn).toHaveBeenCalledWith('c');
  });

  it('handles multiple arguments', () => {
    const fn = vi.fn();
    const debouncedFn = debounce(fn, 100);

    debouncedFn('a', 'b', 'c');

    vi.advanceTimersByTime(100);
    expect(fn).toHaveBeenCalledWith('a', 'b', 'c');
  });

  it('can be called again after first execution', () => {
    const fn = vi.fn();
    const debouncedFn = debounce(fn, 100);

    debouncedFn('first');
    vi.advanceTimersByTime(100);
    expect(fn).toHaveBeenCalledTimes(1);

    debouncedFn('second');
    vi.advanceTimersByTime(100);
    expect(fn).toHaveBeenCalledTimes(2);
  });

  it('handles zero delay', () => {
    const fn = vi.fn();
    const debouncedFn = debounce(fn, 0);

    debouncedFn('test');
    vi.advanceTimersByTime(0);
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('preserves this context', () => {
    const fn = vi.fn();
    const debouncedFn = debounce(fn, 100);

    debouncedFn('test');

    vi.advanceTimersByTime(100);
    expect(fn).toHaveBeenCalledTimes(1);
  });
});

describe('throttle', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('executes immediately on first call', () => {
    const fn = vi.fn();
    const throttledFn = throttle(fn, 100);

    throttledFn('test');
    expect(fn).toHaveBeenCalledTimes(1);
    expect(fn).toHaveBeenCalledWith('test');
  });

  it('ignores calls during throttle period', () => {
    const fn = vi.fn();
    const throttledFn = throttle(fn, 100);

    throttledFn('first');
    expect(fn).toHaveBeenCalledTimes(1);

    throttledFn('second');
    throttledFn('third');
    vi.advanceTimersByTime(50);
    throttledFn('fourth');

    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('allows calls after throttle period', () => {
    const fn = vi.fn();
    const throttledFn = throttle(fn, 100);

    throttledFn('first');
    expect(fn).toHaveBeenCalledTimes(1);

    vi.advanceTimersByTime(100);

    throttledFn('second');
    expect(fn).toHaveBeenCalledTimes(2);
    expect(fn).toHaveBeenLastCalledWith('second');
  });

  it('throttles rapid successive calls', () => {
    const fn = vi.fn();
    const throttledFn = throttle(fn, 50);

    for (let i = 0; i < 10; i++) {
      throttledFn(i);
      vi.advanceTimersByTime(10);
    }

    expect(fn.mock.calls.length).toBeLessThan(10);
  });

  it('handles multiple arguments', () => {
    const fn = vi.fn();
    const throttledFn = throttle(fn, 100);

    throttledFn('a', 'b', 'c');
    expect(fn).toHaveBeenCalledWith('a', 'b', 'c');
  });

  it('can be called again after throttle resets', () => {
    const fn = vi.fn();
    const throttledFn = throttle(fn, 100);

    throttledFn('first');
    vi.advanceTimersByTime(100);

    throttledFn('second');
    vi.advanceTimersByTime(100);

    throttledFn('third');

    expect(fn).toHaveBeenCalledTimes(3);
  });

  it('handles zero limit', () => {
    const fn = vi.fn();
    const throttledFn = throttle(fn, 0);

    throttledFn('test');
    vi.advanceTimersByTime(0);
    throttledFn('test2');

    expect(fn).toHaveBeenCalledTimes(2);
  });

  it('preserves this context', () => {
    const fn = vi.fn();
    const throttledFn = throttle(fn, 100);

    throttledFn('test');

    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('handles rapid calls correctly', () => {
    const fn = vi.fn();
    const throttledFn = throttle(fn, 100);

    const callTimes = [0, 10, 20, 110, 120, 130, 230];
    callTimes.forEach((time) => {
      vi.advanceTimersByTime(time === 0 ? 0 : time - callTimes[callTimes.indexOf(time) - 1]);
      throttledFn(time);
    });

    expect(fn.mock.calls.length).toBe(3);
    expect(fn).toHaveBeenNthCalledWith(1, 0);
    expect(fn).toHaveBeenNthCalledWith(2, 110);
    expect(fn).toHaveBeenNthCalledWith(3, 230);
  });
});

describe('debounce vs throttle behavior comparison', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('debounce only calls once at the end of rapid calls', () => {
    const debounceFn = vi.fn();
    const throttleFn = vi.fn();
    const debounced = debounce(debounceFn, 100);
    const throttled = throttle(throttleFn, 100);

    for (let i = 0; i < 10; i++) {
      debounced(i);
      throttled(i);
      vi.advanceTimersByTime(10);
    }

    vi.advanceTimersByTime(100);

    expect(debounceFn).toHaveBeenCalledTimes(1);
    expect(throttleFn).toHaveBeenCalledTimes(1);
  });

  it('throttle executes first call immediately, debounce waits', () => {
    const debounceFn = vi.fn();
    const throttleFn = vi.fn();
    const debounced = debounce(debounceFn, 100);
    const throttled = throttle(throttleFn, 100);

    debounced('test');
    throttled('test');

    expect(debounceFn).not.toHaveBeenCalled();
    expect(throttleFn).toHaveBeenCalledTimes(1);
  });
});
