import { Goal, TimeWarpState, PomodoroSettings } from '../types/goal';
import { ActiveTimerPersistedState, FocusSettings, AlarmType } from '../types/focus';

const STORAGE_KEY = 'timewarp_app_state_v1';
const ACTIVE_TIMER_STORAGE_KEY = 'timewarp_active_timer_v1';

export const DEFAULT_INITIAL_GOAL: Goal = {
  id: 'goal-genesis',
  title: 'Master Advanced Agentic AI & Ship Time Warp',
  startedAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
  deadline: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000).toISOString(),
  calendarType: 'AD',
  status: 'active',
  createdAt: new Date().toISOString(),
  pomodoroSessions: 0
};

export const DEFAULT_FOCUS_SETTINGS: FocusSettings = {
  focusMinutes: 25,
  shortBreakMinutes: 5,
  longBreakMinutes: 15,
  longBreakInterval: 4,
  autoStart: false,
  alarmType: 'standard',
  alarmVolume: 0.8,
  notificationsEnabled: false
};

export const DEFAULT_STATE: TimeWarpState = {
  goals: [DEFAULT_INITIAL_GOAL],
  activeGoalId: 'goal-genesis',
  theme: 'void',
  soundEnabled: false,
  soundVolume: 0.35,
  zenMode: false,
  pomodoroStreak: {
    currentStreak: 0,
    lastActiveDate: ''
  },
  pomodoroSettings: DEFAULT_FOCUS_SETTINGS
};

function getStorage(): Storage | null {
  try {
    if (typeof window !== 'undefined' && window.localStorage) return window.localStorage;
    if (typeof globalThis !== 'undefined' && (globalThis as unknown as { localStorage: Storage }).localStorage) {
      return (globalThis as unknown as { localStorage: Storage }).localStorage;
    }
  } catch {}
  return null;
}

export function sanitizeInt(val: unknown, fallback: number, min: number, max: number): number {
  const num = typeof val === 'string' && val.trim() !== '' ? Number(val) : val;
  if (typeof num !== 'number' || isNaN(num) || !isFinite(num)) return fallback;
  const clamped = Math.round(num);
  if (clamped < min) return min;
  if (clamped > max) return max;
  return clamped;
}

export function sanitizeVolume(val: unknown, fallback: number = 0.8): number {
  const num = typeof val === 'string' && val.trim() !== '' ? Number(val) : val;
  if (typeof num !== 'number' || isNaN(num) || !isFinite(num)) return fallback;
  return Math.max(0, Math.min(1, num));
}

export function validateFocusSettings(input?: Partial<PomodoroSettings>): FocusSettings {
  if (!input) return { ...DEFAULT_FOCUS_SETTINGS };

  const validAlarmTypes: AlarmType[] = ['none', 'soft', 'standard', 'strong'];
  const alarmType: AlarmType = validAlarmTypes.includes(input.alarmType as AlarmType)
    ? (input.alarmType as AlarmType)
    : DEFAULT_FOCUS_SETTINGS.alarmType;

  return {
    focusMinutes: sanitizeInt(input.focusMinutes, DEFAULT_FOCUS_SETTINGS.focusMinutes, 1, 120),
    shortBreakMinutes: sanitizeInt(input.shortBreakMinutes, DEFAULT_FOCUS_SETTINGS.shortBreakMinutes, 1, 60),
    longBreakMinutes: sanitizeInt(input.longBreakMinutes, DEFAULT_FOCUS_SETTINGS.longBreakMinutes, 1, 120),
    longBreakInterval: sanitizeInt(input.longBreakInterval, DEFAULT_FOCUS_SETTINGS.longBreakInterval, 1, 10),
    autoStart: typeof input.autoStart === 'boolean' ? input.autoStart : DEFAULT_FOCUS_SETTINGS.autoStart,
    alarmType,
    alarmVolume: sanitizeVolume(input.alarmVolume, DEFAULT_FOCUS_SETTINGS.alarmVolume),
    notificationsEnabled: typeof input.notificationsEnabled === 'boolean'
      ? input.notificationsEnabled
      : DEFAULT_FOCUS_SETTINGS.notificationsEnabled
  };
}

export function loadState(): TimeWarpState {
  try {
    const storage = getStorage();
    if (!storage) return DEFAULT_STATE;
    const raw = storage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_STATE;
    const parsed = JSON.parse(raw);
    if (!parsed.goals || !Array.isArray(parsed.goals) || parsed.goals.length === 0) {
      return DEFAULT_STATE;
    }
    const validThemes = ['parchment', 'void', 'neon', 'solar', 'cherry', 'emerald', 'frost'];
    const validatedSettings = validateFocusSettings(parsed.pomodoroSettings);

    return {
      ...DEFAULT_STATE,
      ...parsed,
      theme: validThemes.includes(parsed.theme) ? parsed.theme : 'void',
      goals: parsed.goals.slice(0, 5),
      pomodoroSettings: validatedSettings
    };
  } catch (err) {
    console.error('Failed to load state from storage:', err);
    return DEFAULT_STATE;
  }
}

export function saveState(state: TimeWarpState): void {
  try {
    const storage = getStorage();
    if (!storage) return;
    storage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (err) {
    console.error('Failed to save state to storage:', err);
  }
}

export function exportBackup(state: TimeWarpState): string {
  return JSON.stringify(
    {
      app: 'TimeWarp',
      version: '1.1.0',
      exportedAt: new Date().toISOString(),
      data: state
    },
    null,
    2
  );
}

export function importBackup(jsonStr: string): TimeWarpState {
  const parsed = JSON.parse(jsonStr);
  const data = parsed.data || parsed;
  if (!data.goals || !Array.isArray(data.goals)) {
    throw new Error('Invalid Time Warp backup file: missing goals array');
  }
  return {
    ...DEFAULT_STATE,
    ...data,
    goals: data.goals.slice(0, 5),
    pomodoroSettings: validateFocusSettings(data.pomodoroSettings)
  };
}

export function saveActiveTimer(timer: ActiveTimerPersistedState | null): void {
  try {
    const storage = getStorage();
    if (!storage) return;
    if (timer === null) {
      storage.removeItem(ACTIVE_TIMER_STORAGE_KEY);
    } else {
      storage.setItem(ACTIVE_TIMER_STORAGE_KEY, JSON.stringify(timer));
    }
  } catch (err) {
    console.warn('Failed to persist active timer:', err);
  }
}

export function loadActiveTimer(): ActiveTimerPersistedState | null {
  try {
    const storage = getStorage();
    if (!storage) return null;
    const raw = storage.getItem(ACTIVE_TIMER_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || !parsed.mode || !parsed.status) return null;
    return parsed as ActiveTimerPersistedState;
  } catch {
    return null;
  }
}

export function clearActiveTimer(): void {
  saveActiveTimer(null);
}
