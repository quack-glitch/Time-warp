export type FocusMode = 'focus' | 'shortBreak' | 'longBreak' | 'stopwatch';

export type TimerStatus = 'idle' | 'running' | 'paused' | 'completed';

export type AlarmType = 'none' | 'soft' | 'standard' | 'strong';

export interface PomodoroDurations {
  focus: number;       // in minutes (1–120)
  shortBreak: number;  // in minutes (1–60)
  longBreak: number;   // in minutes (1–120)
}

export interface FocusSettings {
  focusMinutes: number;
  shortBreakMinutes: number;
  longBreakMinutes: number;
  longBreakInterval: number;     // Sessions before long break (1–10, default: 4)
  autoStart: boolean;            // Automatically start next session (default: false)
  alarmType: AlarmType;          // Alarm sound style (default: 'standard')
  alarmVolume: number;           // Volume 0 to 1 (default: 0.8)
  notificationsEnabled: boolean; // Desktop notification toggle (default: false)
}

export interface ActiveTimerPersistedState {
  mode: FocusMode;
  status: TimerStatus;
  durationMs: number;
  startTimestamp: number | null;
  targetTimestamp: number | null;
  pausedRemainingMs: number | null;
  stopwatchStartTimestamp: number | null;
  pausedElapsedMs: number | null;
  completedCycleSessions: number;
  sessionTarget: number;
  linkedMilestoneId?: string;
  savedAt: number;
}
