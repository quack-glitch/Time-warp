import { useState, useEffect, useRef, useCallback } from 'react';
import { FocusMode, TimerStatus, PomodoroDurations, FocusSettings } from '../types/focus';
import { audioEngine } from '../services/audio';
import { sendFocusNotification } from '../services/notifications';
import {
  validateFocusSettings,
  saveActiveTimer,
  loadActiveTimer
} from '../services/storage';
import {
  startCountdown,
  getRemainingMs,
  pauseCountdown,
  calculateProgressPercent,
  startStopwatch,
  getStopwatchElapsedMs,
  pauseStopwatch,
  isCountdownComplete,
  getNextSessionMode,
  calculateNextCycle,
  canSwitchModeSafely
} from '../services/timer-engine';

export type { FocusMode, TimerStatus, PomodoroDurations, FocusSettings };
// Backward compatibility alias
export type PomodoroMode = FocusMode;

export function getDurationMinutes(durations: PomodoroDurations, m: FocusMode): number {
  if (m === 'stopwatch') return 0;
  return durations[m] ?? 25;
}

export interface UsePomodoroTimerOptions {
  initialSettings?: Partial<FocusSettings>;
  soundEnabled?: boolean;
  activeGoalId?: string;
  onSessionCompleted?: (mode: FocusMode) => void;
  onUpdateSettings?: (settings: FocusSettings) => void;
}

export function usePomodoroTimer({
  initialSettings,
  activeGoalId,
  onSessionCompleted,
  onUpdateSettings
}: UsePomodoroTimerOptions = {}) {
  // Settings
  const [settings, setSettings] = useState<FocusSettings>(() =>
    validateFocusSettings(initialSettings)
  );

  // Sync settings when initialSettings prop changes
  useEffect(() => {
    if (initialSettings) {
      setSettings(validateFocusSettings(initialSettings));
    }
  }, [
    initialSettings?.focusMinutes,
    initialSettings?.shortBreakMinutes,
    initialSettings?.longBreakMinutes,
    initialSettings?.longBreakInterval,
    initialSettings?.autoStart,
    initialSettings?.alarmType,
    initialSettings?.alarmVolume,
    initialSettings?.notificationsEnabled
  ]);

  const durations: PomodoroDurations = {
    focus: settings.focusMinutes,
    shortBreak: settings.shortBreakMinutes,
    longBreak: settings.longBreakMinutes
  };

  // Synchronously initialize state from saved active timer in storage
  const [initialActiveState] = useState(() => loadActiveTimer());

  const initMode: FocusMode = initialActiveState?.mode || 'focus';
  const initCycle = initialActiveState?.completedCycleSessions || 0;
  const initNow = Date.now();

  let initStatus: TimerStatus = 'idle';
  let initStartTs: number | null = null;
  let initTargetTs: number | null = null;
  let initPausedRemaining: number | null = null;
  let initStopwatchStartTs: number | null = null;
  let initPausedElapsed: number | null = null;
  let initDisplayMs = getDurationMinutes(durations, initMode) * 60 * 1000;
  let initProgress = 0;

  if (initialActiveState) {
    if (initialActiveState.mode === 'stopwatch') {
      if (initialActiveState.status === 'running' && initialActiveState.stopwatchStartTimestamp) {
        initStatus = 'running';
        initStopwatchStartTs = initialActiveState.stopwatchStartTimestamp;
        initDisplayMs = Math.max(0, initNow - initialActiveState.stopwatchStartTimestamp);
      } else if (initialActiveState.status === 'paused') {
        initStatus = 'paused';
        initPausedElapsed = initialActiveState.pausedElapsedMs;
        initDisplayMs = initialActiveState.pausedElapsedMs || 0;
      }
    } else {
      // Countdown modes
      const totalMs = getDurationMinutes(durations, initMode) * 60 * 1000;
      if (initialActiveState.status === 'running' && initialActiveState.targetTimestamp) {
        if (initialActiveState.targetTimestamp <= initNow) {
          initStatus = 'completed';
          initDisplayMs = 0;
          initProgress = 100;
        } else {
          initStatus = 'running';
          initStartTs = initialActiveState.startTimestamp;
          initTargetTs = initialActiveState.targetTimestamp;
          initDisplayMs = Math.max(0, initialActiveState.targetTimestamp - initNow);
          initProgress = calculateProgressPercent(initDisplayMs, totalMs);
        }
      } else if (initialActiveState.status === 'paused') {
        initStatus = 'paused';
        initPausedRemaining = initialActiveState.pausedRemainingMs;
        initDisplayMs = initialActiveState.pausedRemainingMs ?? totalMs;
        initProgress = calculateProgressPercent(initDisplayMs, totalMs);
      } else if (initialActiveState.status === 'completed') {
        initStatus = 'completed';
        initDisplayMs = 0;
        initProgress = 100;
      }
    }
  }

  // State
  const [mode, setMode] = useState<FocusMode>(initMode);
  const [status, setStatus] = useState<TimerStatus>(initStatus);
  const [startTimestamp, setStartTimestamp] = useState<number | null>(initStartTs);
  const [targetTimestamp, setTargetTimestamp] = useState<number | null>(initTargetTs);
  const [pausedRemainingMs, setPausedRemainingMs] = useState<number | null>(initPausedRemaining);
  const [stopwatchStartTimestamp, setStopwatchStartTimestamp] = useState<number | null>(initStopwatchStartTs);
  const [pausedElapsedMs, setPausedElapsedMs] = useState<number | null>(initPausedElapsed);
  const [cycleSessions, setCycleSessions] = useState<number>(initCycle);

  // High-precision display values driven by Date.now()
  const [displayRemainingMs, setDisplayRemainingMs] = useState<number>(initDisplayMs);
  const [progressPercent, setProgressPercent] = useState<number>(initProgress);

  // Completion handled flag to prevent multiple triggers from re-renders or concurrent ticks
  const completionHandledRef = useRef<boolean>(initStatus === 'completed');
  const autoStartTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearAutoStartTimeout = useCallback(() => {
    if (autoStartTimeoutRef.current) {
      clearTimeout(autoStartTimeoutRef.current);
      autoStartTimeoutRef.current = null;
    }
  }, []);

  const onSessionCompletedRef = useRef(onSessionCompleted);
  useEffect(() => {
    onSessionCompletedRef.current = onSessionCompleted;
  }, [onSessionCompleted]);

  const onUpdateSettingsRef = useRef(onUpdateSettings);
  useEffect(() => {
    onUpdateSettingsRef.current = onUpdateSettings;
  }, [onUpdateSettings]);

  // Keep references to latest state for event handlers (visibilitychange, etc.)
  const stateRef = useRef({
    mode,
    status,
    durations,
    settings,
    startTimestamp,
    targetTimestamp,
    pausedRemainingMs,
    stopwatchStartTimestamp,
    pausedElapsedMs,
    cycleSessions,
    activeGoalId
  });

  useEffect(() => {
    stateRef.current = {
      mode,
      status,
      durations,
      settings,
      startTimestamp,
      targetTimestamp,
      pausedRemainingMs,
      stopwatchStartTimestamp,
      pausedElapsedMs,
      cycleSessions,
      activeGoalId
    };
  });

  // Calculate live remaining ms or elapsed ms purely from system clock Date.now()
  const computeCurrentValues = useCallback(() => {
    const s = stateRef.current;
    const now = Date.now();

    if (s.mode === 'stopwatch') {
      let elapsed = 0;
      if (s.status === 'running' && s.stopwatchStartTimestamp !== null) {
        elapsed = getStopwatchElapsedMs(s.stopwatchStartTimestamp, now);
      } else if (s.status === 'paused' && s.pausedElapsedMs !== null) {
        elapsed = s.pausedElapsedMs;
      }
      return { remainingMs: elapsed, progress: 0 };
    }

    // Countdown modes ('focus', 'shortBreak', 'longBreak')
    const totalMs = (s.durations[s.mode] ?? 25) * 60 * 1000;

    if (s.status === 'idle') {
      return { remainingMs: totalMs, progress: 0 };
    }
    if (s.status === 'completed') {
      return { remainingMs: 0, progress: 100 };
    }
    if (s.status === 'paused') {
      const rem = s.pausedRemainingMs ?? totalMs;
      return { remainingMs: rem, progress: calculateProgressPercent(rem, totalMs) };
    }
    if (s.status === 'running' && s.targetTimestamp !== null) {
      const rem = getRemainingMs(s.targetTimestamp, now);
      return { remainingMs: rem, progress: calculateProgressPercent(rem, totalMs) };
    }

    return { remainingMs: totalMs, progress: 0 };
  }, []);

  // Completion orchestrator (fires exactly once per session)
  const triggerCompletion = useCallback((completedMode: FocusMode) => {
    if (completionHandledRef.current) return;
    completionHandledRef.current = true;
    clearAutoStartTimeout();

    const s = stateRef.current;
    setStatus('completed');
    setDisplayRemainingMs(0);
    setProgressPercent(100);

    // 1. Play Alarm independently of ambient audio
    audioEngine.playAlarm(s.settings.alarmType, s.settings.alarmVolume);

    // 2. Browser Desktop Notification (if enabled and granted)
    if (s.settings.notificationsEnabled) {
      const title =
        completedMode === 'focus'
          ? 'FOCUS COMPLETE'
          : completedMode === 'shortBreak'
          ? 'BREAK COMPLETE'
          : 'LONG BREAK COMPLETE';

      const durationMinutes =
        completedMode === 'focus'
          ? s.durations.focus
          : completedMode === 'shortBreak'
          ? s.durations.shortBreak
          : s.durations.longBreak;

      const body =
        completedMode === 'focus'
          ? `${durationMinutes} minute session finished.`
          : `${durationMinutes} minute break finished.`;

      sendFocusNotification(title, { body });
    }

    // 3. Increment cycle count and invoke session callback
    const nextCycle = calculateNextCycle(completedMode, s.cycleSessions);
    setCycleSessions(nextCycle);
    if (completedMode === 'focus') {
      onSessionCompletedRef.current?.('focus');
    } else if (completedMode === 'longBreak') {
      onSessionCompletedRef.current?.('longBreak');
    } else {
      onSessionCompletedRef.current?.('shortBreak');
    }

    const durationMs = completedMode === 'stopwatch' ? 0 : (s.durations[completedMode] ?? 25) * 60 * 1000;

    // 4. Update persistent storage
    saveActiveTimer({
      mode: completedMode,
      status: 'completed',
      durationMs,
      startTimestamp: s.startTimestamp,
      targetTimestamp: s.targetTimestamp,
      pausedRemainingMs: 0,
      stopwatchStartTimestamp: null,
      pausedElapsedMs: null,
      completedCycleSessions: nextCycle,
      sessionTarget: s.settings.longBreakInterval,
      linkedMilestoneId: s.activeGoalId,
      savedAt: Date.now()
    });

    // 5. Handle Auto-Start
    if (s.settings.autoStart) {
      const nextMode = getNextSessionMode(completedMode, nextCycle, s.settings.longBreakInterval);
      autoStartTimeoutRef.current = setTimeout(() => {
        autoStartTimeoutRef.current = null;
        completionHandledRef.current = false;
        setMode(nextMode);

        const nextDurationMin = getDurationMinutes(s.durations, nextMode);
        const totalMs = nextDurationMin * 60 * 1000;
        const now = Date.now();
        const startTs = now;
        const targetTs = now + totalMs;

        setStartTimestamp(startTs);
        setTargetTimestamp(targetTs);
        setPausedRemainingMs(null);
        setStopwatchStartTimestamp(null);
        setPausedElapsedMs(null);
        setStatus('running');
        setDisplayRemainingMs(totalMs);
        setProgressPercent(0);

        saveActiveTimer({
          mode: nextMode,
          status: 'running',
          durationMs: totalMs,
          startTimestamp: startTs,
          targetTimestamp: targetTs,
          pausedRemainingMs: null,
          stopwatchStartTimestamp: null,
          pausedElapsedMs: null,
          completedCycleSessions: nextCycle,
          sessionTarget: s.settings.longBreakInterval,
          linkedMilestoneId: s.activeGoalId,
          savedAt: now
        });
      }, 1000);
    }
  }, [clearAutoStartTimeout]);

  // Clean up timers on unmount
  useEffect(() => {
    return () => {
      clearAutoStartTimeout();
    };
  }, [clearAutoStartTimeout]);

  // Fire completion once on startup if a timer was running and expired while the app was closed
  useEffect(() => {
    if (initialActiveState?.status === 'running' && initialActiveState.targetTimestamp) {
      if (initialActiveState.targetTimestamp <= Date.now()) {
        triggerCompletion(initialActiveState.mode);
      }
    }
  }, [initialActiveState, triggerCompletion]);

  // Main UI ticker (250ms interval) to update display and detect completion
  // Note: the interval tick is NOT the source of truth, it only samples Date.now()!
  useEffect(() => {
    if (status !== 'running') {
      const { remainingMs, progress } = computeCurrentValues();
      setDisplayRemainingMs(remainingMs);
      setProgressPercent(progress);
      return;
    }

    const checkAndTick = () => {
      const now = Date.now();
      const currentMode = stateRef.current.mode;

      if (currentMode === 'stopwatch') {
        const start = stateRef.current.stopwatchStartTimestamp ?? now;
        const elapsed = Math.max(0, now - start);
        setDisplayRemainingMs(elapsed);
        return;
      }

      // Countdown modes
      const target = stateRef.current.targetTimestamp;
      if (target === null) return;

      if (isCountdownComplete(target, now)) {
        triggerCompletion(currentMode);
        return;
      }

      const totalMs = (stateRef.current.durations[currentMode] ?? 25) * 60 * 1000;
      const diffMs = target - now;
      const elapsed = Math.max(0, totalMs - diffMs);
      const pct = Math.min(100, Math.max(0, (elapsed / totalMs) * 100));

      setDisplayRemainingMs(diffMs);
      setProgressPercent(pct);
    };

    checkAndTick();
    const intervalId = setInterval(checkAndTick, 250);

    return () => clearInterval(intervalId);
  }, [status, computeCurrentValues, triggerCompletion]);

  // Tab suspension, visibility change, and sleep recovery listener
  useEffect(() => {
    const handleReconcile = () => {
      const s = stateRef.current;
      if (s.status !== 'running') return;

      const now = Date.now();
      if (s.mode === 'stopwatch') {
        const start = s.stopwatchStartTimestamp ?? now;
        setDisplayRemainingMs(Math.max(0, now - start));
        return;
      }

      if (s.targetTimestamp !== null) {
        if (isCountdownComplete(s.targetTimestamp, now)) {
          triggerCompletion(s.mode);
        } else {
          const totalMs = (s.durations[s.mode] ?? 25) * 60 * 1000;
          const diffMs = s.targetTimestamp - now;
          const elapsed = Math.max(0, totalMs - diffMs);
          const pct = Math.min(100, Math.max(0, (elapsed / totalMs) * 100));
          setDisplayRemainingMs(diffMs);
          setProgressPercent(pct);
        }
      }
    };

    const onVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        handleReconcile();
      }
    };

    window.addEventListener('visibilitychange', onVisibilityChange);
    window.addEventListener('pageshow', handleReconcile);
    window.addEventListener('focus', handleReconcile);

    return () => {
      window.removeEventListener('visibilitychange', onVisibilityChange);
      window.removeEventListener('pageshow', handleReconcile);
      window.removeEventListener('focus', handleReconcile);
    };
  }, [triggerCompletion]);

  // ACTIONS

  const start = useCallback(() => {
    // Section 34.A, 34.C: Double-click prevention & no start while running
    if (status === 'running') return;

    clearAutoStartTimeout();
    completionHandledRef.current = false;
    const now = Date.now();
    const curMode = mode;

    if (curMode === 'stopwatch') {
      const startTime = startStopwatch(pausedElapsedMs, now);
      setStopwatchStartTimestamp(startTime);
      setPausedElapsedMs(null);
      setStatus('running');

      saveActiveTimer({
        mode: 'stopwatch',
        status: 'running',
        durationMs: 0,
        startTimestamp: startTime,
        targetTimestamp: null,
        pausedRemainingMs: null,
        stopwatchStartTimestamp: startTime,
        pausedElapsedMs: null,
        completedCycleSessions: cycleSessions,
        sessionTarget: settings.longBreakInterval,
        linkedMilestoneId: activeGoalId,
        savedAt: now
      });
      return;
    }

    // Countdown
    const totalMs = (durations[curMode] ?? 25) * 60 * 1000;
    const { startTimestamp: startTs, targetTimestamp: targetTs } = startCountdown(
      totalMs,
      pausedRemainingMs,
      now
    );
    const remainingToRun = getRemainingMs(targetTs, now);

    setStartTimestamp(startTs);
    setTargetTimestamp(targetTs);
    setPausedRemainingMs(null);
    setStatus('running');
    setDisplayRemainingMs(remainingToRun);

    saveActiveTimer({
      mode: curMode,
      status: 'running',
      durationMs: totalMs,
      startTimestamp: startTs,
      targetTimestamp: targetTs,
      pausedRemainingMs: null,
      stopwatchStartTimestamp: null,
      pausedElapsedMs: null,
      completedCycleSessions: cycleSessions,
      sessionTarget: settings.longBreakInterval,
      linkedMilestoneId: activeGoalId,
      savedAt: now
    });
  }, [mode, status, pausedElapsedMs, pausedRemainingMs, durations, cycleSessions, settings.longBreakInterval, activeGoalId, clearAutoStartTimeout]);

  const pause = useCallback(() => {
    clearAutoStartTimeout();
    const now = Date.now();
    const curMode = mode;

    if (curMode === 'stopwatch') {
      const elapsed = stopwatchStartTimestamp !== null ? pauseStopwatch(stopwatchStartTimestamp, now) : 0;
      setPausedElapsedMs(elapsed);
      setStatus('paused');
      setDisplayRemainingMs(elapsed);

      saveActiveTimer({
        mode: 'stopwatch',
        status: 'paused',
        durationMs: 0,
        startTimestamp: null,
        targetTimestamp: null,
        pausedRemainingMs: null,
        stopwatchStartTimestamp: null,
        pausedElapsedMs: elapsed,
        completedCycleSessions: cycleSessions,
        sessionTarget: settings.longBreakInterval,
        linkedMilestoneId: activeGoalId,
        savedAt: now
      });
      return;
    }

    // Countdown
    const curDurationMin = durations[curMode] ?? 25;
    const remaining = targetTimestamp !== null
      ? pauseCountdown(targetTimestamp, now)
      : curDurationMin * 60 * 1000;

    setPausedRemainingMs(remaining);
    setStatus('paused');
    setDisplayRemainingMs(remaining);

    saveActiveTimer({
      mode: curMode,
      status: 'paused',
      durationMs: curDurationMin * 60 * 1000,
      startTimestamp: startTimestamp,
      targetTimestamp: null,
      pausedRemainingMs: remaining,
      stopwatchStartTimestamp: null,
      pausedElapsedMs: null,
      completedCycleSessions: cycleSessions,
      sessionTarget: settings.longBreakInterval,
      linkedMilestoneId: activeGoalId,
      savedAt: now
    });
  }, [mode, stopwatchStartTimestamp, targetTimestamp, durations, startTimestamp, cycleSessions, settings.longBreakInterval, activeGoalId, clearAutoStartTimeout]);

  const toggle = useCallback(() => {
    if (status === 'running') {
      pause();
    } else {
      start();
    }
  }, [status, start, pause]);

  const reset = useCallback(() => {
    clearAutoStartTimeout();
    completionHandledRef.current = false;
    setStatus('idle');
    setStartTimestamp(null);
    setTargetTimestamp(null);
    setPausedRemainingMs(null);
    setStopwatchStartTimestamp(null);
    setPausedElapsedMs(null);

    const initialMs = mode === 'stopwatch' ? 0 : (durations[mode] ?? 25) * 60 * 1000;
    setDisplayRemainingMs(initialMs);
    setProgressPercent(0);

    // Section 34.B: Safe reset preserves session history
    saveActiveTimer({
      mode,
      status: 'idle',
      durationMs: initialMs,
      startTimestamp: null,
      targetTimestamp: null,
      pausedRemainingMs: null,
      stopwatchStartTimestamp: null,
      pausedElapsedMs: null,
      completedCycleSessions: cycleSessions,
      sessionTarget: settings.longBreakInterval,
      linkedMilestoneId: activeGoalId,
      savedAt: Date.now()
    });
  }, [mode, durations, cycleSessions, settings.longBreakInterval, activeGoalId, clearAutoStartTimeout]);

  const switchMode = useCallback(
    (newMode: FocusMode, force: boolean = false) => {
      if (newMode === mode) return;

      // Section 34.D: Safe mode switching
      if (!canSwitchModeSafely(status, force)) {
        const confirmSwitch =
          typeof window !== 'undefined'
            ? window.confirm('A session is currently running. Switch mode and discard current active session?')
            : true;
        if (!confirmSwitch) return;
      }

      clearAutoStartTimeout();
      completionHandledRef.current = false;
      setMode(newMode);
      setStatus('idle');
      setStartTimestamp(null);
      setTargetTimestamp(null);
      setPausedRemainingMs(null);
      setStopwatchStartTimestamp(null);
      setPausedElapsedMs(null);

      const nextMs = newMode === 'stopwatch' ? 0 : (durations[newMode] ?? 25) * 60 * 1000;
      setDisplayRemainingMs(nextMs);
      setProgressPercent(0);

      saveActiveTimer({
        mode: newMode,
        status: 'idle',
        durationMs: nextMs,
        startTimestamp: null,
        targetTimestamp: null,
        pausedRemainingMs: null,
        stopwatchStartTimestamp: null,
        pausedElapsedMs: null,
        completedCycleSessions: cycleSessions,
        sessionTarget: settings.longBreakInterval,
        linkedMilestoneId: activeGoalId,
        savedAt: Date.now()
      });
    },
    [mode, status, durations, cycleSessions, settings.longBreakInterval, activeGoalId, clearAutoStartTimeout]
  );

  // Starts the next session immediately from the completion UI (Sections 8, 9, 10, 33)
  const startNextSession = useCallback(
    (nextMode: FocusMode) => {
      clearAutoStartTimeout();
      completionHandledRef.current = false;
      setMode(nextMode);

      const now = Date.now();
      if (nextMode === 'stopwatch') {
        const startTime = now;
        setStopwatchStartTimestamp(startTime);
        setPausedElapsedMs(null);
        setStartTimestamp(null);
        setTargetTimestamp(null);
        setPausedRemainingMs(null);
        setStatus('running');
        setDisplayRemainingMs(0);
        setProgressPercent(0);

        saveActiveTimer({
          mode: 'stopwatch',
          status: 'running',
          durationMs: 0,
          startTimestamp: startTime,
          targetTimestamp: null,
          pausedRemainingMs: null,
          stopwatchStartTimestamp: startTime,
          pausedElapsedMs: null,
          completedCycleSessions: cycleSessions,
          sessionTarget: settings.longBreakInterval,
          linkedMilestoneId: activeGoalId,
          savedAt: now
        });
        return;
      }

      const nextDurationMin = durations[nextMode] ?? 25;
      const totalMs = nextDurationMin * 60 * 1000;
      const startTs = now;
      const targetTs = now + totalMs;

      setStartTimestamp(startTs);
      setTargetTimestamp(targetTs);
      setPausedRemainingMs(null);
      setStopwatchStartTimestamp(null);
      setPausedElapsedMs(null);
      setStatus('running');
      setDisplayRemainingMs(totalMs);
      setProgressPercent(0);

      saveActiveTimer({
        mode: nextMode,
        status: 'running',
        durationMs: totalMs,
        startTimestamp: startTs,
        targetTimestamp: targetTs,
        pausedRemainingMs: null,
        stopwatchStartTimestamp: null,
        pausedElapsedMs: null,
        completedCycleSessions: cycleSessions,
        sessionTarget: settings.longBreakInterval,
        linkedMilestoneId: activeGoalId,
        savedAt: now
      });
    },
    [durations, cycleSessions, settings.longBreakInterval, activeGoalId, clearAutoStartTimeout]
  );

  const adjustDuration = useCallback(
    (deltaMinutes: number) => {
      if (mode === 'stopwatch') return;

      setSettings((prev) => {
        const currentMin = mode === 'focus'
          ? prev.focusMinutes
          : mode === 'shortBreak'
          ? prev.shortBreakMinutes
          : prev.longBreakMinutes;

        const maxMin = mode === 'shortBreak' ? 60 : 120;
        const nextMin = Math.max(1, Math.min(maxMin, currentMin + deltaMinutes));

        const updated: FocusSettings = {
          ...prev,
          ...(mode === 'focus' && { focusMinutes: nextMin }),
          ...(mode === 'shortBreak' && { shortBreakMinutes: nextMin }),
          ...(mode === 'longBreak' && { longBreakMinutes: nextMin })
        };

        // Section 34.E: If timer is idle, apply to current display immediately
        if (status === 'idle') {
          setDisplayRemainingMs(nextMin * 60 * 1000);
          setProgressPercent(0);
        }

        onUpdateSettingsRef.current?.(updated);
        return updated;
      });
    },
    [mode, status]
  );

  const setDuration = useCallback(
    (targetMode: 'focus' | 'shortBreak' | 'longBreak', minutes: number) => {
      const maxMin = targetMode === 'shortBreak' ? 60 : 120;
      const validMin = Math.max(1, Math.min(maxMin, Math.round(minutes)));

      setSettings((prev) => {
        const updated: FocusSettings = {
          ...prev,
          ...(targetMode === 'focus' && { focusMinutes: validMin }),
          ...(targetMode === 'shortBreak' && { shortBreakMinutes: validMin }),
          ...(targetMode === 'longBreak' && { longBreakMinutes: validMin })
        };

        if (status === 'idle' && mode === targetMode) {
          setDisplayRemainingMs(validMin * 60 * 1000);
          setProgressPercent(0);
        }

        onUpdateSettingsRef.current?.(updated);
        return updated;
      });
    },
    [mode, status]
  );

  const updateSettings = useCallback((newSettings: Partial<FocusSettings>) => {
    setSettings((prev) => {
      const merged = validateFocusSettings({ ...prev, ...newSettings });
      onUpdateSettingsRef.current?.(merged);
      return merged;
    });

    // Section 34.E: If timer is idle and not stopwatch, immediately apply updated duration to current display
    const s = stateRef.current;
    if (s.status === 'idle' && s.mode !== 'stopwatch') {
      const merged = validateFocusSettings({ ...s.settings, ...newSettings });
      const curMin =
        s.mode === 'focus'
          ? merged.focusMinutes
          : s.mode === 'shortBreak'
          ? merged.shortBreakMinutes
          : merged.longBreakMinutes;
      setDisplayRemainingMs(curMin * 60 * 1000);
      setProgressPercent(0);
    }
  }, []);

  const skipLongBreak = useCallback(() => {
    clearAutoStartTimeout();
    setCycleSessions(0);
    switchMode('focus', true);
  }, [switchMode, clearAutoStartTimeout]);

  // In seconds for backwards compatibility
  const timeLeft = mode === 'stopwatch'
    ? Math.floor(displayRemainingMs / 1000)
    : Math.ceil(displayRemainingMs / 1000);

  const currentDurationMin = mode === 'stopwatch' ? 0 : (durations[mode] ?? 25);
  const totalDuration = mode === 'stopwatch' ? 0 : currentDurationMin * 60;

  return {
    mode,
    status,
    isRunning: status === 'running',
    isPaused: status === 'paused',
    isCompleted: status === 'completed',
    timeLeft,
    timeLeftMs: displayRemainingMs,
    totalDuration,
    progressPercent,
    durations,
    cycleSessions,
    sessionTarget: settings.longBreakInterval,
    settings,
    start,
    pause,
    toggle,
    reset,
    switchMode,
    startNextSession,
    adjustDuration,
    setDuration,
    updateSettings,
    skipLongBreak
  };
}
