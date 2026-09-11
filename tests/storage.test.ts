import { describe, it, expect, beforeEach } from 'vitest';
import {
  loadState,
  saveState,
  exportBackup,
  importBackup,
  DEFAULT_STATE,
  saveActiveTimer,
  loadActiveTimer,
  clearActiveTimer,
  validateFocusSettings
} from '../src/services/storage';

// In-memory mock for tests
const store = new Map<string, string>();
const mockStorage = {
  getItem: (k: string) => store.get(k) ?? null,
  setItem: (k: string, v: string) => store.set(k, String(v)),
  removeItem: (k: string) => store.delete(k),
  clear: () => store.clear(),
  key: (i: number) => Array.from(store.keys())[i] ?? null,
  length: 0
} as unknown as Storage;

Object.defineProperty(globalThis, 'localStorage', {
  value: mockStorage,
  writable: true,
  configurable: true
});

describe('Storage & Backup Service', () => {
  beforeEach(() => {
    mockStorage.clear();
  });

  it('returns default state when localStorage is empty', () => {
    const state = loadState();
    expect(state.goals.length).toBe(1);
    expect(state.goals[0].id).toBe('goal-genesis');
    expect(state.pomodoroSettings).toBeDefined();
    expect(state.pomodoroSettings?.focusMinutes).toBe(25);
    expect(state.pomodoroSettings?.shortBreakMinutes).toBe(5);
    expect(state.pomodoroSettings?.longBreakMinutes).toBe(15);
  });

  it('persists and loads updated state including focus settings', () => {
    const modified = {
      ...DEFAULT_STATE,
      theme: 'solar' as const,
      goals: [
        ...DEFAULT_STATE.goals,
        {
          id: 'goal-2',
          title: 'Write Sci-Fi Novel',
          startedAt: new Date().toISOString(),
          deadline: new Date(Date.now() + 86400000).toISOString(),
          calendarType: 'AD' as const,
          status: 'active' as const,
          createdAt: new Date().toISOString()
        }
      ],
      pomodoroSettings: {
        focusMinutes: 50,
        shortBreakMinutes: 10,
        longBreakMinutes: 20,
        longBreakInterval: 3,
        autoStart: true,
        alarmType: 'soft' as const,
        alarmVolume: 0.9,
        notificationsEnabled: true
      }
    };

    saveState(modified);
    const loaded = loadState();
    expect(loaded.theme).toBe('solar');
    expect(loaded.goals.length).toBe(2);
    expect(loaded.goals[1].title).toBe('Write Sci-Fi Novel');
    expect(loaded.pomodoroSettings?.focusMinutes).toBe(50);
    expect(loaded.pomodoroSettings?.shortBreakMinutes).toBe(10);
    expect(loaded.pomodoroSettings?.autoStart).toBe(true);
    expect(loaded.pomodoroSettings?.alarmType).toBe('soft');
  });

  it('exports and imports backup JSON with integrity including focus settings', () => {
    const state = {
      ...DEFAULT_STATE,
      theme: 'neon' as const,
      pomodoroSettings: {
        focusMinutes: 30,
        shortBreakMinutes: 7,
        longBreakMinutes: 25,
        longBreakInterval: 5,
        autoStart: true,
        alarmType: 'strong' as const,
        alarmVolume: 1.0,
        notificationsEnabled: false
      }
    };
    const jsonBackup = exportBackup(state);
    const restored = importBackup(jsonBackup);

    expect(restored.theme).toBe('neon');
    expect(restored.goals.length).toBe(1);
    expect(restored.pomodoroSettings?.focusMinutes).toBe(30);
    expect(restored.pomodoroSettings?.longBreakInterval).toBe(5);
    expect(restored.pomodoroSettings?.alarmType).toBe('strong');
  });

  it('persists, loads, and clears active timer state', () => {
    const activeTimerData = {
      mode: 'focus' as const,
      status: 'running' as const,
      durationMs: 1500000,
      startTimestamp: 1000,
      targetTimestamp: 1501000,
      pausedRemainingMs: null,
      stopwatchStartTimestamp: null,
      pausedElapsedMs: null,
      completedCycleSessions: 2,
      sessionTarget: 4,
      linkedMilestoneId: 'goal-genesis',
      savedAt: 1000
    };

    saveActiveTimer(activeTimerData);
    const loaded = loadActiveTimer();
    expect(loaded).toBeDefined();
    expect(loaded?.mode).toBe('focus');
    expect(loaded?.status).toBe('running');
    expect(loaded?.targetTimestamp).toBe(1501000);
    expect(loaded?.completedCycleSessions).toBe(2);

    clearActiveTimer();
    expect(loadActiveTimer()).toBeNull();
  });

  it('validates and clamps invalid focus settings', () => {
    const clamped = validateFocusSettings({
      focusMinutes: 999,
      shortBreakMinutes: -10,
      longBreakMinutes: 0,
      longBreakInterval: 25,
      alarmVolume: 5
    });

    expect(clamped.focusMinutes).toBe(120);
    expect(clamped.shortBreakMinutes).toBe(1);
    expect(clamped.longBreakMinutes).toBe(1);
    expect(clamped.longBreakInterval).toBe(10);
    expect(clamped.alarmVolume).toBe(1);
  });
});
