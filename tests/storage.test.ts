import { describe, it, expect, beforeEach } from 'vitest';
import { loadState, saveState, exportBackup, importBackup, DEFAULT_STATE } from '../src/services/storage';

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
  });

  it('persists and loads updated state', () => {
    const modified = {
      ...DEFAULT_STATE,
      theme: 'golden' as const,
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
      ]
    };

    saveState(modified);
    const loaded = loadState();
    expect(loaded.theme).toBe('golden');
    expect(loaded.goals.length).toBe(2);
    expect(loaded.goals[1].title).toBe('Write Sci-Fi Novel');
  });

  it('exports and imports backup JSON with integrity', () => {
    const state = { ...DEFAULT_STATE, theme: 'neon' as const };
    const jsonBackup = exportBackup(state);
    const restored = importBackup(jsonBackup);

    expect(restored.theme).toBe('neon');
    expect(restored.goals.length).toBe(1);
  });
});
