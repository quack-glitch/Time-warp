import { describe, it, expect } from 'vitest';
import { calculateStreak } from '../src/services/streak';

describe('Pomodoro Focus & Streak Engine', () => {
  it('initializes streak to 1 on first session', () => {
    const today = new Date('2026-09-04T12:00:00Z');
    const result = calculateStreak(undefined, 0, today);
    expect(result.currentStreak).toBe(1);
    expect(result.lastActiveDate).toBe('2026-09-04');
  });

  it('increments streak on consecutive days', () => {
    const yesterday = '2026-09-03';
    const today = new Date('2026-09-04T12:00:00Z');
    const result = calculateStreak(yesterday, 3, today);
    expect(result.currentStreak).toBe(4);
    expect(result.lastActiveDate).toBe('2026-09-04');
  });

  it('maintains streak if multiple sessions occur on the same day', () => {
    const todayStr = '2026-09-04';
    const today = new Date('2026-09-04T16:00:00Z');
    const result = calculateStreak(todayStr, 5, today);
    expect(result.currentStreak).toBe(5);
    expect(result.lastActiveDate).toBe('2026-09-04');
  });

  it('resets streak to 1 when a day is skipped', () => {
    const twoDaysAgo = '2026-09-02';
    const today = new Date('2026-09-04T12:00:00Z');
    const result = calculateStreak(twoDaysAgo, 10, today);
    expect(result.currentStreak).toBe(1);
    expect(result.lastActiveDate).toBe('2026-09-04');
  });
});
