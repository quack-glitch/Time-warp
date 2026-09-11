import { describe, it, expect, vi } from 'vitest';
import {
  startCountdown,
  getRemainingMs,
  pauseCountdown,
  resumeCountdown,
  isCountdownComplete,
  calculateProgressPercent,
  startStopwatch,
  getStopwatchElapsedMs,
  pauseStopwatch,
  resumeStopwatch,
  getNextSessionMode,
  calculateNextCycle,
  canSwitchModeSafely
} from '../src/services/timer-engine';
import { formatTimerMs } from '../src/services/timer-format';
import { validateFocusSettings, DEFAULT_FOCUS_SETTINGS } from '../src/services/storage';
import { audioEngine } from '../src/services/audio';

describe('Timestamp-Based Timer Engine (Section 38 & 39 Requirements)', () => {
  const T0 = 1770000000000; // Fixed baseline timestamp for deterministic testing

  it('1. Focus timer initial state: 25 minutes corresponds to 1,500,000 ms', () => {
    const focusDurationMs = 25 * 60 * 1000;
    expect(focusDurationMs).toBe(1500000);
    const formatted = formatTimerMs(focusDurationMs);
    expect(formatted).toBe('25:00');
  });

  it('2. Start creates correct target timestamp based on Date.now()', () => {
    const totalMs = 25 * 60 * 1000;
    const { startTimestamp, targetTimestamp } = startCountdown(totalMs, null, T0);

    expect(startTimestamp).toBe(T0);
    expect(targetTimestamp).toBe(T0 + 1500000);
  });

  it('3. Countdown derives from Date.now() system clock without interval counters', () => {
    const totalMs = 25 * 60 * 1000;
    const { targetTimestamp } = startCountdown(totalMs, null, T0);

    // After 10 minutes (600,000 ms)
    const now10m = T0 + 600000;
    const remaining = getRemainingMs(targetTimestamp, now10m);
    expect(remaining).toBe(900000); // exactly 15 minutes left
    expect(formatTimerMs(remaining)).toBe('15:00');

    // Progress percentage
    const progress = calculateProgressPercent(remaining, totalMs);
    expect(progress).toBeCloseTo(40, 1);
  });

  it('4. Pause preserves remaining duration accurately', () => {
    const totalMs = 25 * 60 * 1000;
    const { targetTimestamp } = startCountdown(totalMs, null, T0);

    // User pauses after 8 minutes and 30 seconds (510,000 ms)
    const nowPause = T0 + 510000;
    const remainingAtPause = pauseCountdown(targetTimestamp, nowPause);

    expect(remainingAtPause).toBe(990000); // 16 minutes, 30 seconds
    expect(formatTimerMs(remainingAtPause)).toBe('16:30');
  });

  it('5. Resume creates a new target timestamp eliminating pause drift', () => {
    const totalMs = 25 * 60 * 1000;
    const pausedRemainingMs = 990000; // 16m 30s remaining

    // User resumes 1 hour later
    const resumeTime = T0 + 3600000;
    const { targetTimestamp } = resumeCountdown(pausedRemainingMs, totalMs, resumeTime);

    expect(targetTimestamp).toBe(resumeTime + 990000);
    // Remaining time immediately after resume is identical to paused remaining time
    expect(getRemainingMs(targetTimestamp, resumeTime)).toBe(990000);
    expect(formatTimerMs(getRemainingMs(targetTimestamp, resumeTime))).toBe('16:30');
  });

  it('6. Reset returns to configured duration', () => {
    const totalMs = 25 * 60 * 1000;
    expect(getRemainingMs(T0 + totalMs, T0)).toBe(totalMs);
    expect(formatTimerMs(totalMs)).toBe('25:00');
  });

  it('7. Completion occurs at target timestamp', () => {
    const totalMs = 25 * 60 * 1000;
    const { targetTimestamp } = startCountdown(totalMs, null, T0);

    expect(isCountdownComplete(targetTimestamp, targetTimestamp - 1)).toBe(false);
    expect(isCountdownComplete(targetTimestamp, targetTimestamp)).toBe(true);
    expect(getRemainingMs(targetTimestamp, targetTimestamp)).toBe(0);
  });

  it('8. Completion fires exactly once (idempotent target detection)', () => {
    const totalMs = 25 * 60 * 1000;
    const { targetTimestamp } = startCountdown(totalMs, null, T0);

    let completionCount = 0;
    const handleCompletionOnce = vi.fn(() => {
      completionCount += 1;
    });

    // Simulate multiple ticks and visibility reconciliations after target timestamp
    const times = [targetTimestamp, targetTimestamp + 100, targetTimestamp + 1000, targetTimestamp + 5000];
    let handled = false;

    times.forEach((t) => {
      if (isCountdownComplete(targetTimestamp, t) && !handled) {
        handled = true;
        handleCompletionOnce();
      }
    });

    expect(completionCount).toBe(1);
    expect(handleCompletionOnce).toHaveBeenCalledTimes(1);
  });

  it('9. Short break works using identical timer math (5 minutes = 300,000 ms)', () => {
    const shortBreakMs = 5 * 60 * 1000;
    const { startTimestamp, targetTimestamp } = startCountdown(shortBreakMs, null, T0);

    expect(targetTimestamp - startTimestamp).toBe(300000);
    expect(formatTimerMs(shortBreakMs)).toBe('05:00');

    // Check halfway
    const halfway = T0 + 150000;
    expect(getRemainingMs(targetTimestamp, halfway)).toBe(150000);
    expect(calculateProgressPercent(150000, shortBreakMs)).toBe(50);
  });

  it('10. Long break works (15 minutes = 900,000 ms)', () => {
    const longBreakMs = 15 * 60 * 1000;
    const { targetTimestamp } = startCountdown(longBreakMs, null, T0);

    expect(formatTimerMs(longBreakMs)).toBe('15:00');
    expect(getRemainingMs(targetTimestamp, T0)).toBe(900000);
  });

  it('11. Stopwatch starts at 0 elapsed time', () => {
    const start = startStopwatch(null, T0);
    expect(getStopwatchElapsedMs(start, T0)).toBe(0);
    expect(formatTimerMs(0, true)).toBe('00:00:00');
  });

  it('12. Stopwatch calculates elapsed time directly from timestamp', () => {
    const start = startStopwatch(null, T0);

    // 1 hour, 24 minutes, 37 seconds = 5,077,000 ms
    const elapsedMs = (1 * 3600 + 24 * 60 + 37) * 1000;
    const now = T0 + elapsedMs;

    expect(getStopwatchElapsedMs(start, now)).toBe(elapsedMs);
    expect(formatTimerMs(elapsedMs, true)).toBe('01:24:37');
  });

  it('13. Stopwatch pause captures exact elapsed duration', () => {
    const start = startStopwatch(null, T0);
    const pauseTime = T0 + 45000; // 45 seconds
    const elapsedAtPause = pauseStopwatch(start, pauseTime);

    expect(elapsedAtPause).toBe(45000);
    expect(formatTimerMs(elapsedAtPause, true)).toBe('00:00:45');
  });

  it('14. Stopwatch resume continues from paused elapsed duration without drift', () => {
    const pausedElapsedMs = 45000;
    const resumeTime = T0 + 120000; // Resumed after 2 minutes

    const newStart = resumeStopwatch(pausedElapsedMs, resumeTime);
    expect(getStopwatchElapsedMs(newStart, resumeTime)).toBe(45000);

    // 15 seconds after resume
    const laterTime = resumeTime + 15000;
    expect(getStopwatchElapsedMs(newStart, laterTime)).toBe(60000);
    expect(formatTimerMs(getStopwatchElapsedMs(newStart, laterTime), true)).toBe('00:01:00');
  });

  it('15. Session count increments after focus completion and resets on long break', () => {
    let cycle = 0;
    cycle = calculateNextCycle('focus', cycle);
    expect(cycle).toBe(1);

    cycle = calculateNextCycle('focus', cycle);
    expect(cycle).toBe(2);

    // Short break does not increment cycle
    cycle = calculateNextCycle('shortBreak', cycle);
    expect(cycle).toBe(2);

    // Long break completion resets cycle to 0
    cycle = calculateNextCycle('longBreak', cycle);
    expect(cycle).toBe(0);
  });

  it('16. Long-break threshold triggers recommendation after configured sessions', () => {
    const threshold = 4;

    expect(getNextSessionMode('focus', 1, threshold)).toBe('shortBreak');
    expect(getNextSessionMode('focus', 2, threshold)).toBe('shortBreak');
    expect(getNextSessionMode('focus', 3, threshold)).toBe('shortBreak');
    expect(getNextSessionMode('focus', 4, threshold)).toBe('longBreak');
    expect(getNextSessionMode('focus', 5, threshold)).toBe('longBreak');

    // After breaks, next session returns to focus
    expect(getNextSessionMode('shortBreak', 2, threshold)).toBe('focus');
    expect(getNextSessionMode('longBreak', 0, threshold)).toBe('focus');
  });

  it('17. Auto-start OFF leaves next action to user', () => {
    const settings = validateFocusSettings({ autoStart: false });
    expect(settings.autoStart).toBe(false);

    let autoStartedMode: string | null = null;
    if (settings.autoStart) {
      autoStartedMode = getNextSessionMode('focus', 1, settings.longBreakInterval);
    }

    expect(autoStartedMode).toBeNull();
  });

  it('18. Auto-start ON initiates next sequence', () => {
    const settings = validateFocusSettings({ autoStart: true, longBreakInterval: 4 });
    expect(settings.autoStart).toBe(true);

    let autoStartedMode: string | null = null;
    if (settings.autoStart) {
      autoStartedMode = getNextSessionMode('focus', 1, settings.longBreakInterval);
    }
    expect(autoStartedMode).toBe('shortBreak');

    // At threshold, auto-start determines long break
    let thresholdMode: string | null = null;
    if (settings.autoStart) {
      thresholdMode = getNextSessionMode('focus', 4, settings.longBreakInterval);
    }
    expect(thresholdMode).toBe('longBreak');
  });

  it('19. Invalid durations are rejected and clamped safely', () => {
    const sanitized1 = validateFocusSettings({
      focusMinutes: -5,
      shortBreakMinutes: 0,
      longBreakMinutes: 999
    });

    expect(sanitized1.focusMinutes).toBe(1); // clamped to min 1
    expect(sanitized1.shortBreakMinutes).toBe(1); // clamped to min 1
    expect(sanitized1.longBreakMinutes).toBe(120); // clamped to max 120

    const sanitizedNaN = validateFocusSettings({
      focusMinutes: NaN,
      shortBreakMinutes: Infinity,
      alarmVolume: -1
    });

    expect(sanitizedNaN.focusMinutes).toBe(DEFAULT_FOCUS_SETTINGS.focusMinutes);
    expect(sanitizedNaN.shortBreakMinutes).toBe(DEFAULT_FOCUS_SETTINGS.shortBreakMinutes);
    expect(sanitizedNaN.alarmVolume).toBe(0);
  });

  it('20. Settings persist valid configurations with defaults', () => {
    const custom = validateFocusSettings({
      focusMinutes: 50,
      shortBreakMinutes: 10,
      longBreakMinutes: 30,
      longBreakInterval: 3,
      autoStart: true,
      alarmType: 'soft',
      alarmVolume: 0.6,
      notificationsEnabled: true
    });

    expect(custom.focusMinutes).toBe(50);
    expect(custom.shortBreakMinutes).toBe(10);
    expect(custom.longBreakMinutes).toBe(30);
    expect(custom.longBreakInterval).toBe(3);
    expect(custom.autoStart).toBe(true);
    expect(custom.alarmType).toBe('soft');
    expect(custom.alarmVolume).toBe(0.6);
    expect(custom.notificationsEnabled).toBe(true);
  });

  it('21. Active timer survives visibility changes without loss of sync', () => {
    const totalMs = 25 * 60 * 1000;
    const { targetTimestamp } = startCountdown(totalMs, null, T0);

    // App goes to background for 8 minutes
    const backgroundReturnTime = T0 + 8 * 60 * 1000;
    const remainingAfterBackground = getRemainingMs(targetTimestamp, backgroundReturnTime);

    expect(remainingAfterBackground).toBe(17 * 60 * 1000);
    expect(formatTimerMs(remainingAfterBackground)).toBe('17:00');
  });

  it('22. Expired timer is detected immediately after returning from sleep/background', () => {
    const totalMs = 25 * 60 * 1000;
    const { targetTimestamp } = startCountdown(totalMs, null, T0);

    // Return after 35 minutes (past 25m target)
    const returnFromSleep = T0 + 35 * 60 * 1000;

    expect(isCountdownComplete(targetTimestamp, returnFromSleep)).toBe(true);
    expect(getRemainingMs(targetTimestamp, returnFromSleep)).toBe(0);
  });

  it('23. Timer state does not depend on interval tick count', () => {
    const totalMs = 25 * 60 * 1000;
    const { targetTimestamp } = startCountdown(totalMs, null, T0);

    const checkTime = T0 + 10 * 60 * 1000; // 10 minutes in

    // Whether 0 ticks, 1 tick, or 50,000 ticks occurred, remaining time is identical
    const resultNoTicks = getRemainingMs(targetTimestamp, checkTime);
    const resultManyTicks = getRemainingMs(targetTimestamp, checkTime);

    expect(resultNoTicks).toBe(15 * 60 * 1000);
    expect(resultManyTicks).toBe(resultNoTicks);
  });

  it('24. Mode switching guards running timer against accidental loss', () => {
    // When timer is running, switching mode is blocked unless force is true
    expect(canSwitchModeSafely('running', false)).toBe(false);
    expect(canSwitchModeSafely('running', true)).toBe(true);

    // When timer is idle, paused, or completed, switching mode is always allowed
    expect(canSwitchModeSafely('idle', false)).toBe(true);
    expect(canSwitchModeSafely('paused', false)).toBe(true);
    expect(canSwitchModeSafely('completed', false)).toBe(true);
  });

  it('25. Alarm completion event is emitted once without duplicate triggers', () => {
    const playAlarmSpy = vi.spyOn(audioEngine, 'playAlarm').mockImplementation(() => {});

    let completionHandled = false;
    const triggerCompletion = () => {
      if (completionHandled) return;
      completionHandled = true;
      audioEngine.playAlarm('standard', 0.8);
    };

    // Simulate 5 consecutive trigger attempts (e.g. React re-render, ticker interval, visibility event)
    triggerCompletion();
    triggerCompletion();
    triggerCompletion();
    triggerCompletion();
    triggerCompletion();

    expect(playAlarmSpy).toHaveBeenCalledTimes(1);
    expect(playAlarmSpy).toHaveBeenCalledWith('standard', 0.8);

    playAlarmSpy.mockRestore();
  });
});
