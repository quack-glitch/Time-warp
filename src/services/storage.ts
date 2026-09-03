import { Goal, TimeWarpState } from '../types/goal';

const STORAGE_KEY = 'timewarp_app_state_v1';

export const DEFAULT_INITIAL_GOAL: Goal = {
  id: 'goal-genesis',
  title: 'Master Advanced Agentic AI & Ship Time Warp',
  startedAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
  deadline: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000).toISOString(),
  calendarType: 'AD',
  status: 'active',
  createdAt: new Date().toISOString()
};

export const DEFAULT_STATE: TimeWarpState = {
  goals: [DEFAULT_INITIAL_GOAL],
  activeGoalId: 'goal-genesis',
  theme: 'void',
  soundEnabled: false,
  soundVolume: 0.35,
  zenMode: false
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
    return {
      ...DEFAULT_STATE,
      ...parsed,
      theme: validThemes.includes(parsed.theme) ? parsed.theme : 'void',
      goals: parsed.goals.slice(0, 5)
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
      version: '1.0.0',
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
    goals: data.goals.slice(0, 5)
  };
}
