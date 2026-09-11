/**
 * Unified timer formatting service for Time Warp Focus Companion.
 * Adheres to Section 32:
 * - Pomodoro countdown (< 60m): MM:SS (e.g. 25:00)
 * - Long countdown (>= 60m): H:MM:SS (e.g. 1:05:32)
 * - Stopwatch: HH:MM:SS (e.g. 00:00:00, 01:24:37)
 */

export interface FormattedTimerParts {
  hours: number;
  minutes: number;
  seconds: number;
  formatted: string;
}

export function formatTimerMs(ms: number, isStopwatch = false): string {
  const totalSeconds = isStopwatch
    ? Math.max(0, Math.floor(ms / 1000))
    : Math.max(0, Math.ceil(ms / 1000));

  return formatTimerSeconds(totalSeconds, isStopwatch);
}

export function formatTimerSeconds(totalSeconds: number, isStopwatch = false): string {
  const clamped = Math.max(0, Math.floor(totalSeconds));
  const hours = Math.floor(clamped / 3600);
  const minutes = Math.floor((clamped % 3600) / 60);
  const seconds = clamped % 60;

  if (isStopwatch) {
    const hh = String(hours).padStart(2, '0');
    const mm = String(minutes).padStart(2, '0');
    const ss = String(seconds).padStart(2, '0');
    return `${hh}:${mm}:${ss}`;
  }

  if (hours > 0) {
    const mm = String(minutes).padStart(2, '0');
    const ss = String(seconds).padStart(2, '0');
    return `${hours}:${mm}:${ss}`;
  }

  const mm = String(minutes).padStart(2, '0');
  const ss = String(seconds).padStart(2, '0');
  return `${mm}:${ss}`;
}

export function getTimerParts(ms: number, isStopwatch = false): FormattedTimerParts {
  const totalSeconds = isStopwatch
    ? Math.max(0, Math.floor(ms / 1000))
    : Math.max(0, Math.ceil(ms / 1000));

  const clamped = Math.max(0, Math.floor(totalSeconds));
  const hours = Math.floor(clamped / 3600);
  const minutes = Math.floor((clamped % 3600) / 60);
  const seconds = clamped % 60;

  return {
    hours,
    minutes,
    seconds,
    formatted: formatTimerSeconds(totalSeconds, isStopwatch)
  };
}
