/**
 * Pure Focus Time Tracking & History Service for Time Warp Focus Companion.
 * Adheres strictly to Section 38:
 * - 38.1: Today's focus tracking (only focus time; breaks & stopwatch excluded).
 * - 38.2: FocusSession data model & local persistence.
 * - 38.3: Recent 7-Day History aggregation.
 * - 38.4: 7-Day Total summary.
 * - 38.5: FocusSession records as single source of truth.
 * - 38.6: 30-day retention pruning.
 * - 38.7: Local calendar day grouping using formatLocalDate.
 * - 38.8: Goal connection (preserving goalId).
 */

import { FocusSession, DayFocusSummary, FocusHistorySummary } from '../types/focus';
import { formatLocalDate } from './streak';

export const FOCUS_HISTORY_STORAGE_KEY = 'timewarp_focus_history_v1';
export const RETENTION_DAYS = 30;

function getStorage(customStorage?: Storage | null): Storage | null {
  if (customStorage !== undefined) return customStorage;
  try {
    if (typeof window !== 'undefined' && window.localStorage) return window.localStorage;
    if (typeof globalThis !== 'undefined' && (globalThis as unknown as { localStorage: Storage }).localStorage) {
      return (globalThis as unknown as { localStorage: Storage }).localStorage;
    }
  } catch {}
  return null;
}

/**
 * Formats duration in ms to "Xh YYm" or "YYm" format.
 * Defaults to "Xh YYm" (e.g. 1h 08m, 0h 50m, 10h 25m) matching Section 38 specifications.
 */
export function formatFocusDuration(ms: number, forceHours = true): string {
  const totalMinutes = Math.max(0, Math.floor(ms / (60 * 1000)));
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (hours > 0 || forceHours) {
    return `${hours}h ${String(minutes).padStart(2, '0')}m`;
  }
  return `${minutes}m`;
}

/**
 * Prunes focus session records older than the retention threshold (default 30 days).
 */
export function pruneOldFocusSessions(
  sessions: FocusSession[],
  retentionDays: number = RETENTION_DAYS,
  now: number = Date.now()
): FocusSession[] {
  const threshold = now - retentionDays * 24 * 60 * 60 * 1000;
  return sessions.filter((s) => s && typeof s.completedAt === 'number' && s.completedAt >= threshold);
}

/**
 * Validates a raw record ensuring data integrity and preventing app crashes.
 */
export function validateFocusSession(item: unknown): FocusSession | null {
  if (!item || typeof item !== 'object') return null;
  const s = item as Partial<FocusSession>;
  if (s.mode !== 'focus') return null;
  if (typeof s.id !== 'string' || !s.id.trim()) return null;
  if (typeof s.startedAt !== 'number' || isNaN(s.startedAt) || !isFinite(s.startedAt)) return null;
  if (typeof s.completedAt !== 'number' || isNaN(s.completedAt) || !isFinite(s.completedAt)) return null;
  if (typeof s.durationMs !== 'number' || isNaN(s.durationMs) || !isFinite(s.durationMs) || s.durationMs <= 0) return null;

  return {
    id: s.id.trim(),
    mode: 'focus',
    startedAt: s.startedAt,
    completedAt: s.completedAt,
    durationMs: s.durationMs,
    ...(s.goalId ? { goalId: String(s.goalId) } : {})
  };
}

/**
 * Safely loads persisted focus sessions from local storage with auto-pruning and deduplication.
 */
export function loadFocusSessions(storageOverride?: Storage | null): FocusSession[] {
  try {
    const storage = getStorage(storageOverride);
    if (!storage) return [];
    const raw = storage.getItem(FOCUS_HISTORY_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];

    const validSessions: FocusSession[] = [];
    const seenIds = new Set<string>();
    for (const item of parsed) {
      const valid = validateFocusSession(item);
      if (valid && !seenIds.has(valid.id)) {
        seenIds.add(valid.id);
        validSessions.push(valid);
      }
    }

    const pruned = pruneOldFocusSessions(validSessions);
    // If invalid, duplicate, or expired entries were discarded, synchronize clean list to storage
    if (pruned.length < parsed.length) {
      try {
        storage.setItem(FOCUS_HISTORY_STORAGE_KEY, JSON.stringify(pruned));
      } catch {}
    }
    return pruned;
  } catch (err) {
    console.warn('Failed to load focus sessions, returning empty list:', err);
    return [];
  }
}

/**
 * Persists focus sessions to local storage after pruning.
 */
export function saveFocusSessions(sessions: FocusSession[], storageOverride?: Storage | null): void {
  try {
    const storage = getStorage(storageOverride);
    if (!storage) return;
    const pruned = pruneOldFocusSessions(sessions);
    storage.setItem(FOCUS_HISTORY_STORAGE_KEY, JSON.stringify(pruned));
  } catch (err) {
    console.warn('Failed to save focus sessions:', err);
  }
}

/**
 * Records a newly completed focus session.
 * Rejects non-focus sessions (breaks, stopwatch) according to Section 38.1.
 * Deduplicates by session ID to prevent double-writes.
 */
export function recordFocusSession(
  session: Omit<FocusSession, 'id' | 'mode'> & { id?: string; mode?: 'focus' },
  storageOverride?: Storage | null
): FocusSession[] {
  // Reject non-focus sessions
  if (session.mode && session.mode !== 'focus') {
    return loadFocusSessions(storageOverride);
  }

  const id =
    session.id ||
    (typeof crypto !== 'undefined' && crypto.randomUUID
      ? crypto.randomUUID()
      : `fs-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`);

  const rawSession: FocusSession = {
    id,
    mode: 'focus',
    startedAt: session.startedAt,
    completedAt: session.completedAt,
    durationMs: session.durationMs,
    ...(session.goalId ? { goalId: session.goalId } : {})
  };

  const validated = validateFocusSession(rawSession);
  if (!validated) {
    return loadFocusSessions(storageOverride);
  }

  const existing = loadFocusSessions(storageOverride);
  const existingIdx = existing.findIndex((s) => s.id === validated.id);
  let updated: FocusSession[];
  if (existingIdx >= 0) {
    updated = [...existing];
    updated[existingIdx] = validated;
  } else {
    updated = [...existing, validated];
  }

  saveFocusSessions(updated, storageOverride);
  return updated;
}

/**
 * Clears focus history from storage.
 */
export function clearFocusSessions(storageOverride?: Storage | null): void {
  try {
    const storage = getStorage(storageOverride);
    if (!storage) return;
    storage.removeItem(FOCUS_HISTORY_STORAGE_KEY);
  } catch (err) {
    console.warn('Failed to clear focus sessions:', err);
  }
}

/**
 * Calculates Today's focus summary.
 * Groups by local calendar day of session completion timestamp.
 * Allows a currently running focus session's elapsed time to contribute live (Section 38.1).
 */
export function calculateTodayFocus(
  sessions: FocusSession[],
  runningElapsedMs: number = 0,
  now: number = Date.now()
): { durationMs: number; sessionCount: number; formatted: string } {
  const todayStr = formatLocalDate(new Date(now));

  const todayCompletedSessions = sessions.filter((s) => {
    if (s.mode !== 'focus') return false;
    const sessionDateStr = formatLocalDate(new Date(s.completedAt));
    return sessionDateStr === todayStr;
  });

  const completedDurationMs = todayCompletedSessions.reduce((acc, s) => acc + s.durationMs, 0);
  const sessionCount = todayCompletedSessions.length;
  const totalDurationMs = completedDurationMs + Math.max(0, runningElapsedMs);

  return {
    durationMs: totalDurationMs,
    sessionCount,
    formatted: `${formatFocusDuration(totalDurationMs)} focused`
  };
}

/**
 * Calculates the recent 7 calendar days breakdown and 7-day total.
 * Ends with today. Excludes sessions outside the 7-day calendar window (Section 38.3 & 38.4).
 */
export function calculateSevenDayHistory(
  sessions: FocusSession[],
  now: number = Date.now()
): {
  sevenDays: DayFocusSummary[];
  totalMs: number;
  totalSessionCount: number;
  totalFormatted: string;
} {
  const nowDate = new Date(now);
  const todayYear = nowDate.getFullYear();
  const todayMonth = nowDate.getMonth();
  const todayDay = nowDate.getDate();
  const todayStr = formatLocalDate(nowDate);

  const focusSessions = sessions.filter((s) => s.mode === 'focus');

  const days: DayFocusSummary[] = [];
  let totalMs = 0;
  let totalSessionCount = 0;

  // 7 days ending with today (i from 6 down to 0)
  for (let i = 6; i >= 0; i--) {
    const dayDate = new Date(todayYear, todayMonth, todayDay - i, 12, 0, 0);
    const dateStr = formatLocalDate(dayDate);
    const isToday = dateStr === todayStr;
    const dayLabel = dayDate.toLocaleDateString('en-US', { weekday: 'short' }).slice(0, 3).toUpperCase();

    const daySessions = focusSessions.filter((s) => {
      const sDateStr = formatLocalDate(new Date(s.completedAt));
      return sDateStr === dateStr;
    });

    const dayDurationMs = daySessions.reduce((acc, s) => acc + s.durationMs, 0);
    const daySessionCount = daySessions.length;

    totalMs += dayDurationMs;
    totalSessionCount += daySessionCount;

    days.push({
      dateStr,
      dayLabel,
      durationMs: dayDurationMs,
      sessionCount: daySessionCount,
      isToday
    });
  }

  return {
    sevenDays: days,
    totalMs,
    totalSessionCount,
    totalFormatted: formatFocusDuration(totalMs)
  };
}

/**
 * Unified summary helper returning Today's focus and 7-day history in one call.
 */
export function getFocusHistorySummary(
  sessions: FocusSession[],
  runningElapsedMs: number = 0,
  now: number = Date.now()
): FocusHistorySummary {
  const today = calculateTodayFocus(sessions, runningElapsedMs, now);
  const history = calculateSevenDayHistory(sessions, now);

  return {
    todayDurationMs: today.durationMs,
    todaySessionCount: today.sessionCount,
    todayFormatted: today.formatted,
    sevenDays: history.sevenDays,
    sevenDayTotalMs: history.totalMs,
    sevenDaySessionCount: history.totalSessionCount,
    sevenDayTotalFormatted: history.totalFormatted
  };
}
