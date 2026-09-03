export interface CountdownState {
  years: number;
  months: number;
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  totalDays: number;
  totalSeconds: number;
  elapsedSeconds: number;
  remainingSeconds: number;
  progressPercent: number;  // 0 to 100 (elapsed / total)
  remainingPercent: number; // 100 to 0
  isExpired: boolean;
  isImminent: boolean;     // < 24 hours
}
