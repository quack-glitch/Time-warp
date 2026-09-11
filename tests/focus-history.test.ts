import { describe, it, expect, beforeEach } from 'vitest';
import {
  recordFocusSession,
  loadFocusSessions,
  saveFocusSessions,
  pruneOldFocusSessions,
  clearFocusSessions,
  calculateTodayFocus,
  calculateSevenDayHistory,
  FOCUS_HISTORY_STORAGE_KEY,
  formatFocusDuration
} from '../src/services/focus-history';
import { FocusSession } from '../src/types/focus';

// In-memory mock for localStorage
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

describe('Section 38: Focus Time Tracking & History Specification', () => {
  // Controlled baseline timestamp: Friday, September 11, 2026 at 14:00:00 (local time)
  const T0 = new Date(2026, 8, 11, 14, 0, 0).getTime();

  beforeEach(() => {
    store.clear();
  });

  it('1. Completed focus session is recorded', () => {
    const session = {
      startedAt: T0 - 25 * 60 * 1000,
      completedAt: T0,
      durationMs: 25 * 60 * 1000,
      goalId: 'goal-genesis'
    };

    const updated = recordFocusSession(session);
    expect(updated.length).toBe(1);

    const loaded = loadFocusSessions();
    expect(loaded.length).toBe(1);
    expect(loaded[0].mode).toBe('focus');
    expect(loaded[0].startedAt).toBe(session.startedAt);
    expect(loaded[0].completedAt).toBe(session.completedAt);
    expect(loaded[0].durationMs).toBe(25 * 60 * 1000);
    expect(loaded[0].id).toBeDefined();
  });

  it('2. Focus duration is recorded correctly', () => {
    const customDurationMs = 45 * 60 * 1000; // 45 minutes
    recordFocusSession({
      startedAt: T0 - customDurationMs,
      completedAt: T0,
      durationMs: customDurationMs
    });

    const loaded = loadFocusSessions();
    expect(loaded[0].durationMs).toBe(customDurationMs);
    expect(formatFocusDuration(loaded[0].durationMs)).toBe('0h 45m');
  });

  it('3. Break sessions are not counted as focus time', () => {
    // Attempt to record shortBreak
    recordFocusSession({
      mode: 'shortBreak' as any,
      startedAt: T0 - 5 * 60 * 1000,
      completedAt: T0,
      durationMs: 5 * 60 * 1000
    });
    expect(loadFocusSessions().length).toBe(0);

    // Attempt to record longBreak
    recordFocusSession({
      mode: 'longBreak' as any,
      startedAt: T0 - 15 * 60 * 1000,
      completedAt: T0,
      durationMs: 15 * 60 * 1000
    });
    expect(loadFocusSessions().length).toBe(0);

    // If an invalid session with non-focus mode exists in raw array, aggregations must exclude it
    const mixedSessions: FocusSession[] = [
      {
        id: 'f1',
        mode: 'focus',
        startedAt: T0 - 25 * 60 * 1000,
        completedAt: T0,
        durationMs: 25 * 60 * 1000
      },
      {
        id: 'b1',
        mode: 'shortBreak' as any,
        startedAt: T0 - 30 * 60 * 1000,
        completedAt: T0 - 25 * 60 * 1000,
        durationMs: 5 * 60 * 1000
      }
    ];

    const todaySummary = calculateTodayFocus(mixedSessions, 0, T0);
    expect(todaySummary.durationMs).toBe(25 * 60 * 1000);
    expect(todaySummary.sessionCount).toBe(1);
  });

  it('4. Stopwatch sessions are not counted as focus time', () => {
    // Attempt to record stopwatch
    recordFocusSession({
      mode: 'stopwatch' as any,
      startedAt: T0 - 10 * 60 * 1000,
      completedAt: T0,
      durationMs: 10 * 60 * 1000
    });
    expect(loadFocusSessions().length).toBe(0);

    const mixedSessions: FocusSession[] = [
      {
        id: 'f1',
        mode: 'focus',
        startedAt: T0 - 25 * 60 * 1000,
        completedAt: T0,
        durationMs: 25 * 60 * 1000
      },
      {
        id: 'sw1',
        mode: 'stopwatch' as any,
        startedAt: T0 - 45 * 60 * 1000,
        completedAt: T0 - 35 * 60 * 1000,
        durationMs: 10 * 60 * 1000
      }
    ];

    const todaySummary = calculateTodayFocus(mixedSessions, 0, T0);
    expect(todaySummary.durationMs).toBe(25 * 60 * 1000);
    expect(todaySummary.sessionCount).toBe(1);
  });

  it("5. Today's focus total is calculated correctly", () => {
    const session1: FocusSession = {
      id: 'f1',
      mode: 'focus',
      startedAt: T0 - 75 * 60 * 1000,
      completedAt: T0 - 50 * 60 * 1000,
      durationMs: 25 * 60 * 1000 // 25m
    };
    const session2: FocusSession = {
      id: 'f2',
      mode: 'focus',
      startedAt: T0 - 50 * 60 * 1000,
      completedAt: T0,
      durationMs: 50 * 60 * 1000 // 50m
    };

    const summary = calculateTodayFocus([session1, session2], 0, T0);
    expect(summary.durationMs).toBe(75 * 60 * 1000); // 1h 15m
    expect(summary.formatted).toBe('1h 15m focused');
  });

  it("6. Today's session count is calculated correctly", () => {
    // 3 sessions completed today (Sep 11)
    const todaySessions: FocusSession[] = [1, 2, 3].map((i) => ({
      id: `today-${i}`,
      mode: 'focus' as const,
      startedAt: T0 - i * 30 * 60 * 1000,
      completedAt: T0 - (i - 1) * 30 * 60 * 1000,
      durationMs: 25 * 60 * 1000
    }));

    // 2 sessions completed yesterday (Sep 10)
    const yesterday = new Date(2026, 8, 10, 14, 0, 0).getTime();
    const yesterdaySessions: FocusSession[] = [1, 2].map((i) => ({
      id: `yesterday-${i}`,
      mode: 'focus' as const,
      startedAt: yesterday - i * 30 * 60 * 1000,
      completedAt: yesterday - (i - 1) * 30 * 60 * 1000,
      durationMs: 25 * 60 * 1000
    }));

    const summary = calculateTodayFocus([...todaySessions, ...yesterdaySessions], 0, T0);
    expect(summary.sessionCount).toBe(3);
    expect(summary.durationMs).toBe(75 * 60 * 1000);
  });

  it('7. Seven-day aggregation is correct', () => {
    // Create sessions across 7 days: Sep 5 through Sep 11
    // Day -6 (Sep 5): 1h (1 session)
    // Day -5 (Sep 6): 2h (2 sessions)
    // Day -4 (Sep 7): 1h 30m (2 sessions)
    // Day -3 (Sep 8): 30m (1 session)
    // Day -2 (Sep 9): 2h (2 sessions)
    // Day -1 (Sep 10): 1h (1 session)
    // Day 0  (Sep 11, Today): 2h 25m (3 sessions)
    const testSessions: FocusSession[] = [
      // Day -6
      { id: 'd6', mode: 'focus', startedAt: new Date(2026, 8, 5, 10, 0).getTime(), completedAt: new Date(2026, 8, 5, 11, 0).getTime(), durationMs: 60 * 60 * 1000 },
      // Day -5
      { id: 'd5_1', mode: 'focus', startedAt: new Date(2026, 8, 6, 9, 0).getTime(), completedAt: new Date(2026, 8, 6, 10, 0).getTime(), durationMs: 60 * 60 * 1000 },
      { id: 'd5_2', mode: 'focus', startedAt: new Date(2026, 8, 6, 11, 0).getTime(), completedAt: new Date(2026, 8, 6, 12, 0).getTime(), durationMs: 60 * 60 * 1000 },
      // Day -4
      { id: 'd4_1', mode: 'focus', startedAt: new Date(2026, 8, 7, 9, 0).getTime(), completedAt: new Date(2026, 8, 7, 10, 0).getTime(), durationMs: 60 * 60 * 1000 },
      { id: 'd4_2', mode: 'focus', startedAt: new Date(2026, 8, 7, 11, 0).getTime(), completedAt: new Date(2026, 8, 7, 11, 30).getTime(), durationMs: 30 * 60 * 1000 },
      // Day -3
      { id: 'd3', mode: 'focus', startedAt: new Date(2026, 8, 8, 14, 0).getTime(), completedAt: new Date(2026, 8, 8, 14, 30).getTime(), durationMs: 30 * 60 * 1000 },
      // Day -2
      { id: 'd2_1', mode: 'focus', startedAt: new Date(2026, 8, 9, 10, 0).getTime(), completedAt: new Date(2026, 8, 9, 11, 0).getTime(), durationMs: 60 * 60 * 1000 },
      { id: 'd2_2', mode: 'focus', startedAt: new Date(2026, 8, 9, 12, 0).getTime(), completedAt: new Date(2026, 8, 9, 13, 0).getTime(), durationMs: 60 * 60 * 1000 },
      // Day -1
      { id: 'd1', mode: 'focus', startedAt: new Date(2026, 8, 10, 15, 0).getTime(), completedAt: new Date(2026, 8, 10, 16, 0).getTime(), durationMs: 60 * 60 * 1000 },
      // Day 0 (Today)
      { id: 'd0_1', mode: 'focus', startedAt: new Date(2026, 8, 11, 9, 0).getTime(), completedAt: new Date(2026, 8, 11, 10, 0).getTime(), durationMs: 60 * 60 * 1000 },
      { id: 'd0_2', mode: 'focus', startedAt: new Date(2026, 8, 11, 10, 30).getTime(), completedAt: new Date(2026, 8, 11, 11, 30).getTime(), durationMs: 60 * 60 * 1000 },
      { id: 'd0_3', mode: 'focus', startedAt: new Date(2026, 8, 11, 12, 0).getTime(), completedAt: new Date(2026, 8, 11, 12, 25).getTime(), durationMs: 25 * 60 * 1000 }
    ];

    const history = calculateSevenDayHistory(testSessions, T0);
    expect(history.sevenDays.length).toBe(7);
    expect(history.totalSessionCount).toBe(12);

    // Total ms: 60 + 120 + 90 + 30 + 120 + 60 + 145 = 625 minutes = 10h 25m
    const expectedMs = 625 * 60 * 1000;
    expect(history.totalMs).toBe(expectedMs);
    expect(history.totalFormatted).toBe('10h 25m');

    // Today is the last item
    expect(history.sevenDays[6].isToday).toBe(true);
    expect(history.sevenDays[6].durationMs).toBe(145 * 60 * 1000);
    expect(history.sevenDays[6].sessionCount).toBe(3);
  });

  it('8. Sessions from outside the seven-day display window are excluded', () => {
    const todaySession: FocusSession = {
      id: 'today',
      mode: 'focus',
      startedAt: T0 - 25 * 60 * 1000,
      completedAt: T0,
      durationMs: 25 * 60 * 1000
    };

    // 8 days ago (Sep 3)
    const eightDaysAgoDate = new Date(2026, 8, 3, 10, 0, 0).getTime();
    const oldSession: FocusSession = {
      id: 'old-8-days',
      mode: 'focus',
      startedAt: eightDaysAgoDate - 60 * 60 * 1000,
      completedAt: eightDaysAgoDate,
      durationMs: 60 * 60 * 1000
    };

    // 20 days ago (Aug 22)
    const twentyDaysAgoDate = new Date(2026, 7, 22, 10, 0, 0).getTime();
    const veryOldSession: FocusSession = {
      id: 'old-20-days',
      mode: 'focus',
      startedAt: twentyDaysAgoDate - 60 * 60 * 1000,
      completedAt: twentyDaysAgoDate,
      durationMs: 60 * 60 * 1000
    };

    const history = calculateSevenDayHistory([todaySession, oldSession, veryOldSession], T0);

    expect(history.totalSessionCount).toBe(1);
    expect(history.totalMs).toBe(25 * 60 * 1000);
    expect(history.totalFormatted).toBe('0h 25m');
  });

  it('9. Sessions crossing midnight are handled consistently', () => {
    // Session starts at 2026-09-10 23:45:00 and completes at 2026-09-11 00:15:00 (30 minutes duration)
    const startMidnight = new Date(2026, 8, 10, 23, 45, 0).getTime();
    const completeMidnight = new Date(2026, 8, 11, 0, 15, 0).getTime();

    const crossingSession: FocusSession = {
      id: 'midnight-crossing',
      mode: 'focus',
      startedAt: startMidnight,
      completedAt: completeMidnight,
      durationMs: 30 * 60 * 1000
    };

    // According to the established completion model, the session is attributed to its completion day (Sep 11)
    const summarySep11 = calculateTodayFocus([crossingSession], 0, T0);
    expect(summarySep11.durationMs).toBe(30 * 60 * 1000);
    expect(summarySep11.sessionCount).toBe(1);

    // On Sep 10, before it completed, it does not count towards Sep 10 completed sessions
    const timeSep10 = new Date(2026, 8, 10, 20, 0, 0).getTime();
    const summarySep10 = calculateTodayFocus([crossingSession], 0, timeSep10);
    expect(summarySep10.durationMs).toBe(0);
    expect(summarySep10.sessionCount).toBe(0);
  });

  it('10. Multiple sessions on the same day aggregate correctly', () => {
    const sessions: FocusSession[] = [1, 2, 3, 4].map((i) => ({
      id: `s-${i}`,
      mode: 'focus' as const,
      startedAt: T0 - i * 35 * 60 * 1000,
      completedAt: T0 - (i - 1) * 35 * 60 * 1000,
      durationMs: 25 * 60 * 1000 // 25m each
    }));

    const summary = calculateTodayFocus(sessions, 0, T0);
    expect(summary.durationMs).toBe(100 * 60 * 1000); // 100 minutes = 1h 40m
    expect(summary.sessionCount).toBe(4);
    expect(summary.formatted).toBe('1h 40m focused');
  });

  it('11. History survives application restart', () => {
    const originalSession: FocusSession = {
      id: 'persist-test-1',
      mode: 'focus',
      startedAt: T0 - 25 * 60 * 1000,
      completedAt: T0,
      durationMs: 25 * 60 * 1000,
      goalId: 'goal-quantum'
    };

    saveFocusSessions([originalSession]);

    // Simulate complete application restart by reading from fresh loadFocusSessions
    const reloaded = loadFocusSessions();
    expect(reloaded.length).toBe(1);
    expect(reloaded[0].id).toBe('persist-test-1');
    expect(reloaded[0].mode).toBe('focus');
    expect(reloaded[0].durationMs).toBe(25 * 60 * 1000);
    expect(reloaded[0].goalId).toBe('goal-quantum');

    // Test clearing
    clearFocusSessions();
    expect(loadFocusSessions()).toEqual([]);
  });

  it('12. Invalid/corrupted history data does not crash the app', () => {
    // Corrupt non-JSON
    store.set(FOCUS_HISTORY_STORAGE_KEY, '{invalid json[[[');
    expect(() => loadFocusSessions()).not.toThrow();
    expect(loadFocusSessions()).toEqual([]);

    // Corrupt array with bad objects, nulls, negative numbers
    store.set(
      FOCUS_HISTORY_STORAGE_KEY,
      JSON.stringify([
        null,
        12345,
        'string',
        {},
        { mode: 'shortBreak', durationMs: 300000 },
        { mode: 'focus', id: '', startedAt: 'bad', completedAt: 100, durationMs: -50 }
      ])
    );
    expect(() => loadFocusSessions()).not.toThrow();
    expect(loadFocusSessions()).toEqual([]);

    // Aggregations must handle empty data without throwing
    expect(() => calculateTodayFocus([], 0)).not.toThrow();
    expect(calculateTodayFocus([], 0).durationMs).toBe(0);
    expect(calculateTodayFocus([], 0).sessionCount).toBe(0);

    expect(() => calculateSevenDayHistory([])).not.toThrow();
    expect(calculateSevenDayHistory([]).totalMs).toBe(0);
  });

  it('13. Old history is pruned according to the retention policy', () => {
    const dayMs = 24 * 60 * 60 * 1000;
    const session35DaysOld: FocusSession = {
      id: 'old-35',
      mode: 'focus',
      startedAt: T0 - 35 * dayMs - 25 * 60 * 1000,
      completedAt: T0 - 35 * dayMs,
      durationMs: 25 * 60 * 1000
    };

    const session20DaysOld: FocusSession = {
      id: 'valid-20',
      mode: 'focus',
      startedAt: T0 - 20 * dayMs - 25 * 60 * 1000,
      completedAt: T0 - 20 * dayMs,
      durationMs: 25 * 60 * 1000
    };

    const sessionToday: FocusSession = {
      id: 'today',
      mode: 'focus',
      startedAt: T0 - 25 * 60 * 1000,
      completedAt: T0,
      durationMs: 25 * 60 * 1000
    };

    const pruned = pruneOldFocusSessions([session35DaysOld, session20DaysOld, sessionToday], 30, T0);
    expect(pruned.length).toBe(2);
    expect(pruned.some((s) => s.id === 'old-35')).toBe(false);
    expect(pruned.some((s) => s.id === 'valid-20')).toBe(true);
    expect(pruned.some((s) => s.id === 'today')).toBe(true);
  });

  it('14. Current running focus time is reflected correctly in the live Today summary without double-counting after completion', () => {
    // Case from Section 38.1:
    // Completed focus: 50 minutes
    // Current focus: 18 minutes
    // Display: TODAY 1h 08m focused
    const completedSession: FocusSession = {
      id: 'initial-completed',
      mode: 'focus',
      startedAt: T0 - 50 * 60 * 1000,
      completedAt: T0,
      durationMs: 50 * 60 * 1000
    };

    let sessions = [completedSession];
    const runningElapsedMs = 18 * 60 * 1000; // 18 minutes running

    // Live display while running
    const liveSummary = calculateTodayFocus(sessions, runningElapsedMs, T0);
    expect(liveSummary.durationMs).toBe(68 * 60 * 1000); // 50m + 18m = 68m = 1h 08m
    expect(liveSummary.formatted).toBe('1h 08m focused');
    expect(liveSummary.sessionCount).toBe(1); // Running session does not count as completed yet

    // Timer reaches completion: newly completed 18m session is recorded
    const newlyCompletedSession: FocusSession = {
      id: 'newly-completed',
      mode: 'focus',
      startedAt: T0,
      completedAt: T0 + runningElapsedMs,
      durationMs: runningElapsedMs
    };
    sessions = [...sessions, newlyCompletedSession];

    // Running elapsed drops to 0 upon completion
    const postCompletionSummary = calculateTodayFocus(sessions, 0, T0 + runningElapsedMs);
    expect(postCompletionSummary.durationMs).toBe(68 * 60 * 1000); // Exactly 68m, NOT double-counted
    expect(postCompletionSummary.formatted).toBe('1h 08m focused');
    expect(postCompletionSummary.sessionCount).toBe(2); // Now 2 completed sessions
  });

  it('15. Goal ID is preserved when a session is associated with an active goal', () => {
    const goalId = 'goal-architectural-triumph';
    recordFocusSession({
      startedAt: T0 - 25 * 60 * 1000,
      completedAt: T0,
      durationMs: 25 * 60 * 1000,
      goalId
    });

    const loaded = loadFocusSessions();
    expect(loaded[0].goalId).toBe(goalId);
  });

  it('16. Deduplicates multiple writes of the same session ID without multiplying focus time', () => {
    const session = {
      id: 'unique-session-123',
      startedAt: T0 - 25 * 60 * 1000,
      completedAt: T0,
      durationMs: 25 * 60 * 1000,
      goalId: 'goal-unique'
    };

    // Record twice (e.g. React StrictMode or storage sync)
    recordFocusSession(session);
    recordFocusSession(session);

    const loaded = loadFocusSessions();
    expect(loaded.length).toBe(1);
    expect(loaded[0].id).toBe('unique-session-123');

    const todaySummary = calculateTodayFocus(loaded, 0, T0);
    expect(todaySummary.durationMs).toBe(25 * 60 * 1000);
    expect(todaySummary.sessionCount).toBe(1);
  });

  it('17. Rejects sessions with 0ms, negative, or non-finite durations', () => {
    // 0ms duration
    recordFocusSession({
      startedAt: T0 - 1000,
      completedAt: T0,
      durationMs: 0
    });
    expect(loadFocusSessions().length).toBe(0);

    // Negative duration
    recordFocusSession({
      startedAt: T0,
      completedAt: T0 - 1000,
      durationMs: -5000
    });
    expect(loadFocusSessions().length).toBe(0);

    // NaN duration
    recordFocusSession({
      startedAt: T0 - 1000,
      completedAt: T0,
      durationMs: NaN
    });
    expect(loadFocusSessions().length).toBe(0);
  });

  it('18. Automatically cleans up expired and corrupted sessions in storage on load', () => {
    const dayMs = 24 * 60 * 60 * 1000;
    const oldSession: FocusSession = {
      id: 'expired-session',
      mode: 'focus',
      startedAt: T0 - 35 * dayMs - 25 * 60 * 1000,
      completedAt: T0 - 35 * dayMs,
      durationMs: 25 * 60 * 1000
    };
    const validSession: FocusSession = {
      id: 'valid-session',
      mode: 'focus',
      startedAt: T0 - 25 * 60 * 1000,
      completedAt: T0,
      durationMs: 25 * 60 * 1000
    };

    // Store array with expired session and corrupted entry directly into storage
    store.set(
      FOCUS_HISTORY_STORAGE_KEY,
      JSON.stringify([oldSession, validSession, null, { corrupted: true }])
    );

    // Loading should prune the expired and corrupt entries and write clean list back
    const loaded = loadFocusSessions();
    expect(loaded.length).toBe(1);
    expect(loaded[0].id).toBe('valid-session');

    // Verify storage now only contains the single clean valid session
    const rawAfter = JSON.parse(store.get(FOCUS_HISTORY_STORAGE_KEY)!);
    expect(rawAfter.length).toBe(1);
    expect(rawAfter[0].id).toBe('valid-session');
  });
});
