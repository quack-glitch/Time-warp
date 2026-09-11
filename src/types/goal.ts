import { ThemeId } from './theme';

export type CalendarType = 'AD' | 'BS';

export interface BSDateRecord {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
}

export interface Goal {
  id: string;
  title: string;
  startedAt: string; // ISO 8601
  deadline: string;  // ISO 8601
  calendarType: CalendarType;
  bsDeadline?: BSDateRecord;
  status: 'active' | 'completed' | 'archived';
  createdAt: string; // ISO 8601
  notes?: string;
  pomodoroSessions?: number;
}

export interface PomodoroStreak {
  currentStreak: number;
  lastActiveDate: string; // YYYY-MM-DD
}

export interface PomodoroSettings {
  focusMinutes: number;
  shortBreakMinutes: number;
  longBreakMinutes: number;
  longBreakInterval?: number;
  autoStart?: boolean;
  alarmType?: 'none' | 'soft' | 'standard' | 'strong';
  alarmVolume?: number;
  notificationsEnabled?: boolean;
}

export interface TimeWarpState {
  goals: Goal[];
  activeGoalId: string;
  theme: ThemeId;
  soundEnabled: boolean;
  soundVolume: number;
  zenMode: boolean;
  pomodoroStreak?: PomodoroStreak;
  pomodoroSettings?: PomodoroSettings;
}
