/**
 * Pure Mathematical Timer Engine for Time Warp Focus Companion.
 * Section 6: Source of truth is system time (Date.now()), never interval counters.
 * Section 12: Zero accumulated drift on pause/resume.
 * Section 39: Demonstrates SYSTEM CLOCK -> TIMER CALCULATION -> STATE architecture.
 */

import { FocusMode, TimerStatus } from '../types/focus';

export interface CountdownInterval {
  startTimestamp: number;
  targetTimestamp: number;
}

/**
 * Calculates start and target timestamps for a new countdown or resume from pause.
 */
export function startCountdown(
  totalDurationMs: number,
  pausedRemainingMs?: number | null,
  now: number = Date.now()
): CountdownInterval {
  const remaining = pausedRemainingMs !== undefined && pausedRemainingMs !== null
    ? Math.max(0, pausedRemainingMs)
    : totalDurationMs;

  const target = now + remaining;
  const start = now - (totalDurationMs - remaining);

  return {
    startTimestamp: start,
    targetTimestamp: target
  };
}

/**
 * Derives current remaining milliseconds from target timestamp and system time.
 */
export function getRemainingMs(targetTimestamp: number, now: number = Date.now()): number {
  return Math.max(0, targetTimestamp - now);
}

/**
 * Captures the remaining milliseconds at pause time.
 */
export function pauseCountdown(targetTimestamp: number, now: number = Date.now()): number {
  return Math.max(0, targetTimestamp - now);
}

/**
 * Resumes a paused countdown by establishing a fresh target timestamp from the current system time.
 * Avoids any drift from the pause period.
 */
export function resumeCountdown(
  pausedRemainingMs: number,
  totalDurationMs: number,
  now: number = Date.now()
): CountdownInterval {
  return startCountdown(totalDurationMs, pausedRemainingMs, now);
}

/**
 * Checks whether the timer target timestamp has arrived or elapsed.
 */
export function isCountdownComplete(targetTimestamp: number, now: number = Date.now()): boolean {
  return now >= targetTimestamp;
}

/**
 * Calculates progress percentage (0 to 100) from remaining and total milliseconds.
 */
export function calculateProgressPercent(remainingMs: number, totalDurationMs: number): number {
  if (totalDurationMs <= 0) return 100;
  const elapsed = Math.max(0, totalDurationMs - remainingMs);
  return Math.min(100, Math.max(0, (elapsed / totalDurationMs) * 100));
}

/**
 * Computes the start timestamp for a stopwatch session.
 */
export function startStopwatch(
  pausedElapsedMs?: number | null,
  now: number = Date.now()
): number {
  if (pausedElapsedMs !== undefined && pausedElapsedMs !== null) {
    return now - pausedElapsedMs;
  }
  return now;
}

/**
 * Computes elapsed milliseconds for a running stopwatch.
 */
export function getStopwatchElapsedMs(startTimestamp: number, now: number = Date.now()): number {
  return Math.max(0, now - startTimestamp);
}

/**
 * Computes elapsed milliseconds at the instant of pausing the stopwatch.
 */
export function pauseStopwatch(startTimestamp: number, now: number = Date.now()): number {
  return Math.max(0, now - startTimestamp);
}

/**
 * Resumes the stopwatch by adjusting start timestamp backward by already elapsed milliseconds.
 */
export function resumeStopwatch(pausedElapsedMs: number, now: number = Date.now()): number {
  return now - Math.max(0, pausedElapsedMs);
}

/**
  * Determines the next session mode following completion according to Section 10, 17, 18.
  */
export function getNextSessionMode(
  completedMode: FocusMode,
  nextCycleCount: number,
  longBreakInterval: number
): FocusMode {
  if (completedMode === 'focus') {
    return nextCycleCount >= longBreakInterval ? 'longBreak' : 'shortBreak';
  }
  return 'focus';
}

/**
 * Calculates updated completed cycle count after a session completes.
 * Section 10 & 20: Focus increments count, long break resets cycle to 0.
 */
export function calculateNextCycle(completedMode: FocusMode, currentCycle: number): number {
  if (completedMode === 'focus') {
    return currentCycle + 1;
  }
  if (completedMode === 'longBreak') {
    return 0;
  }
  return currentCycle;
}

/**
 * Section 34.D: Checks whether switching mode is safe without accidental loss of active timer.
 */
export function canSwitchModeSafely(status: TimerStatus, force: boolean = false): boolean {
  if (status === 'running' && !force) {
    return false;
  }
  return true;
}

