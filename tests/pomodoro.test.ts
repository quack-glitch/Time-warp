import { describe, it, expect } from 'vitest';
import { calculateStreak, formatLocalDate } from '../src/services/streak';

describe('Pomodoro Focus & Streak Engine', () => {
  it('formats local calendar date consistently', () => {
    const d = new Date(2026, 8, 4, 1, 30, 0); // Month is 0-indexed (8 = September)
    expect(formatLocalDate(d)).toBe('2026-09-04');
  });

  it('initializes streak to 1 on first session', () => {
    const today = new Date(2026, 8, 4, 12, 0, 0);
    const result = calculateStreak(undefined, 0, today);
    expect(result.currentStreak).toBe(1);
    expect(result.lastActiveDate).toBe('2026-09-04');
  });

  it('increments streak on consecutive days', () => {
    const yesterday = '2026-09-03';
    const today = new Date(2026, 8, 4, 12, 0, 0);
    const result = calculateStreak(yesterday, 3, today);
    expect(result.currentStreak).toBe(4);
    expect(result.lastActiveDate).toBe('2026-09-04');
  });

  it('maintains streak if multiple sessions occur on the same day', () => {
    const todayStr = '2026-09-04';
    const today = new Date(2026, 8, 4, 16, 0, 0);
    const result = calculateStreak(todayStr, 5, today);
    expect(result.currentStreak).toBe(5);
    expect(result.lastActiveDate).toBe('2026-09-04');
  });

  it('resets streak to 1 when a day is skipped', () => {
    const twoDaysAgo = '2026-09-02';
    const today = new Date(2026, 8, 4, 12, 0, 0);
    const result = calculateStreak(twoDaysAgo, 10, today);
    expect(result.currentStreak).toBe(1);
    expect(result.lastActiveDate).toBe('2026-09-04');
  });

  it('handles midnight boundary in local timezone without UTC shift', () => {
    // 00:05 AM in local time (e.g. Nepal UTC+5:45)
    const justAfterMidnight = new Date(2026, 8, 5, 0, 5, 0);
    const previousDay = '2026-09-04';
    const result = calculateStreak(previousDay, 2, justAfterMidnight);
    expect(result.currentStreak).toBe(3);
    expect(result.lastActiveDate).toBe('2026-09-05');
  });
});
