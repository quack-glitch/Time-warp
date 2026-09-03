import { describe, it, expect } from 'vitest';
import { calculateCountdown } from '../src/services/countdown';

describe('Countdown Engine Math', () => {
  it('correctly calculates remaining time for a deadline 10 days ahead', () => {
    const started = new Date('2026-09-01T00:00:00Z').toISOString();
    const deadline = new Date('2026-09-11T00:00:00Z').toISOString();
    const now = new Date('2026-09-01T00:00:00Z');

    const res = calculateCountdown(started, deadline, now);
    expect(res.isExpired).toBe(false);
    expect(res.totalDays).toBe(10);
    expect(res.days).toBe(10);
    expect(res.hours).toBe(0);
    expect(res.minutes).toBe(0);
    expect(res.seconds).toBe(0);
    expect(res.progressPercent).toBe(0);
    expect(res.remainingPercent).toBe(100);
  });

  it('correctly reports 50% elapsed when halfway through duration', () => {
    const started = new Date('2026-01-01T00:00:00Z').toISOString();
    const deadline = new Date('2026-01-11T00:00:00Z').toISOString();
    const now = new Date('2026-01-06T00:00:00Z');

    const res = calculateCountdown(started, deadline, now);
    expect(res.progressPercent).toBeCloseTo(50, 1);
    expect(res.remainingPercent).toBeCloseTo(50, 1);
    expect(res.days).toBe(5);
  });

  it('handles expired deadlines by settling gracefully at zero', () => {
    const started = new Date('2026-01-01T00:00:00Z').toISOString();
    const deadline = new Date('2026-01-10T00:00:00Z').toISOString();
    const now = new Date('2026-01-15T00:00:00Z');

    const res = calculateCountdown(started, deadline, now);
    expect(res.isExpired).toBe(true);
    expect(res.years).toBe(0);
    expect(res.months).toBe(0);
    expect(res.days).toBe(0);
    expect(res.hours).toBe(0);
    expect(res.minutes).toBe(0);
    expect(res.seconds).toBe(0);
    expect(res.totalDays).toBe(0);
    expect(res.progressPercent).toBe(100);
    expect(res.remainingPercent).toBe(0);
  });

  it('flags imminent deadlines (< 24 hours)', () => {
    const started = new Date('2026-09-01T00:00:00Z').toISOString();
    const deadline = new Date('2026-09-02T12:00:00Z').toISOString();
    const now = new Date('2026-09-02T00:00:00Z'); // 12 hours left

    const res = calculateCountdown(started, deadline, now);
    expect(res.isImminent).toBe(true);
    expect(res.hours).toBe(12);
  });
});
