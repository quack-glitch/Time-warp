import { CountdownState } from '../types/countdown';

export function calculateCountdown(
  startedAtIso: string,
  deadlineIso: string,
  now: Date = new Date()
): CountdownState {
  const started = new Date(startedAtIso).getTime();
  const deadline = new Date(deadlineIso).getTime();
  const current = now.getTime();

  const totalMs = Math.max(1000, deadline - started);
  const remainingMs = deadline - current;
  const elapsedMs = current - started;

  const totalSeconds = Math.floor(totalMs / 1000);

  if (remainingMs <= 0) {
    return {
      years: 0,
      months: 0,
      days: 0,
      hours: 0,
      minutes: 0,
      seconds: 0,
      totalDays: 0,
      totalSeconds,
      elapsedSeconds: totalSeconds,
      remainingSeconds: 0,
      progressPercent: 100,
      remainingPercent: 0,
      isExpired: true,
      isImminent: false
    };
  }

  const remainingSeconds = Math.floor(remainingMs / 1000);
  const elapsedSeconds = Math.max(0, Math.floor(elapsedMs / 1000));

  const progressPercent = Math.min(100, Math.max(0, (elapsedMs / totalMs) * 100));
  const remainingPercent = 100 - progressPercent;

  // Multi-unit calendar breakdown
  const sec = remainingSeconds % 60;
  const totalMinutes = Math.floor(remainingSeconds / 60);
  const min = totalMinutes % 60;
  const totalHours = Math.floor(totalMinutes / 60);
  const hrs = totalHours % 24;
  const allDays = Math.floor(totalHours / 24);

  // Approximate years (365.25 days) and months (30.44 days)
  const years = Math.floor(allDays / 365.25);
  const daysAfterYears = allDays - Math.floor(years * 365.25);
  const months = Math.floor(daysAfterYears / 30.4375);
  const days = Math.floor(daysAfterYears - Math.floor(months * 30.4375));

  return {
    years,
    months,
    days,
    hours: hrs,
    minutes: min,
    seconds: sec,
    totalDays: Math.max(0, allDays),
    totalSeconds,
    elapsedSeconds,
    remainingSeconds,
    progressPercent,
    remainingPercent,
    isExpired: false,
    isImminent: remainingSeconds < 86400
  };
}
