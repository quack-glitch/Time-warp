import { describe, it, expect } from 'vitest';
import { formatTimerMs, formatTimerSeconds, getTimerParts } from '../src/services/timer-format';

describe('Timer Formatting Service (Section 32)', () => {
  it('formats standard Pomodoro countdown (< 60 minutes) as MM:SS', () => {
    expect(formatTimerMs(25 * 60 * 1000)).toBe('25:00');
    expect(formatTimerMs(5 * 60 * 1000)).toBe('05:00');
    expect(formatTimerMs(15 * 60 * 1000)).toBe('15:00');
    expect(formatTimerMs(59 * 60 * 1000 + 59 * 1000)).toBe('59:59');
  });

  it('formats countdown 60 minutes or longer as H:MM:SS', () => {
    const oneHourFiveMinsThirtyTwoSecs = (1 * 3600 + 5 * 60 + 32) * 1000;
    expect(formatTimerMs(oneHourFiveMinsThirtyTwoSecs)).toBe('1:05:32');

    const twoHours = 2 * 3600 * 1000;
    expect(formatTimerMs(twoHours)).toBe('2:00:00');
  });

  it('formats stopwatch always as HH:MM:SS', () => {
    expect(formatTimerMs(0, true)).toBe('00:00:00');
    expect(formatTimerMs(5000, true)).toBe('00:00:05');
    expect(formatTimerMs(65000, true)).toBe('00:01:05');

    const elapsed = (1 * 3600 + 24 * 60 + 37) * 1000;
    expect(formatTimerMs(elapsed, true)).toBe('01:24:37');
  });

  it('formats raw seconds correctly for countdown and stopwatch', () => {
    expect(formatTimerSeconds(1500)).toBe('25:00');
    expect(formatTimerSeconds(300)).toBe('05:00');
    expect(formatTimerSeconds(3932)).toBe('1:05:32');
    expect(formatTimerSeconds(0, true)).toBe('00:00:00');
    expect(formatTimerSeconds(5077, true)).toBe('01:24:37');
  });

  it('handles negative or zero milliseconds safely', () => {
    expect(formatTimerMs(0)).toBe('00:00');
    expect(formatTimerMs(-500)).toBe('00:00');
    expect(formatTimerMs(-1000, true)).toBe('00:00:00');
  });

  it('extracts discrete timer parts correctly', () => {
    const parts = getTimerParts((1 * 3600 + 24 * 60 + 37) * 1000, true);
    expect(parts.hours).toBe(1);
    expect(parts.minutes).toBe(24);
    expect(parts.seconds).toBe(37);
    expect(parts.formatted).toBe('01:24:37');
  });
});
