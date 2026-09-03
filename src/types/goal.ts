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
}

export interface TimeWarpState {
  goals: Goal[];
  activeGoalId: string;
  theme: 'void' | 'golden' | 'neon' | 'parchment';
  soundEnabled: boolean;
  soundVolume: number;
  zenMode: boolean;
}
