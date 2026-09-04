import { useState, useEffect, useRef, useCallback } from 'react';
import { audioEngine } from '../services/audio';

export type PomodoroMode = 'focus' | 'shortBreak' | 'longBreak';

export interface PomodoroDurations {
  focus: number;       // in minutes
  shortBreak: number;  // in minutes
  longBreak: number;   // in minutes
}

export interface UsePomodoroTimerOptions {
  initialDurations?: Partial<PomodoroDurations>;
  soundEnabled?: boolean;
  onSessionCompleted?: (mode: PomodoroMode) => void;
}

export function usePomodoroTimer({
  initialDurations,
  onSessionCompleted
}: UsePomodoroTimerOptions = {}) {
  const [durations, setDurations] = useState<PomodoroDurations>({
    focus: initialDurations?.focus ?? 25,
    shortBreak: initialDurations?.shortBreak ?? 5,
    longBreak: initialDurations?.longBreak ?? 15
  });

  const [mode, setMode] = useState<PomodoroMode>('focus');
  const [isRunning, setIsRunning] = useState(false);
  const [timeLeft, setTimeLeft] = useState(() => (initialDurations?.focus ?? 25) * 60);
  const [progressPercent, setProgressPercent] = useState(0);

  const targetEndTimeRef = useRef<number | null>(null);
  const totalDuration = durations[mode] * 60;

  const onSessionCompletedRef = useRef(onSessionCompleted);
  useEffect(() => {
    onSessionCompletedRef.current = onSessionCompleted;
  }, [onSessionCompleted]);

  // High precision timer loop (50ms interval) for butter-smooth progress glide
  useEffect(() => {
    if (!isRunning) {
      targetEndTimeRef.current = null;
      return;
    }

    if (targetEndTimeRef.current === null) {
      targetEndTimeRef.current = Date.now() + timeLeft * 1000;
    }

    const timer = setInterval(() => {
      if (targetEndTimeRef.current === null) return;
      const now = Date.now();
      const diffMs = targetEndTimeRef.current - now;

      if (diffMs <= 0) {
        // FINISHED!
        setIsRunning(false);
        targetEndTimeRef.current = null;
        setTimeLeft(0);
        setProgressPercent(100);

        // Sound the ALARM!
        audioEngine.playAlarm();

        // Browser Desktop Notification
        if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
          try {
            new Notification('Time Warp Focus', {
              body: mode === 'focus'
                ? '🔔 Focus session complete! Time for a break.'
                : '🔔 Break finished! Ready to focus?',
              icon: '/hourglass.svg'
            });
          } catch {}
        }

        // Trigger completion callback
        onSessionCompletedRef.current?.(mode);

        // Automatically prepare default for next session
        const nextMode: PomodoroMode = mode === 'focus' ? 'shortBreak' : 'focus';
        setMode(nextMode);
        const nextTotalSec = durations[nextMode] * 60;
        setTimeLeft(nextTotalSec);
        setProgressPercent(0);
        return;
      }

      // Smooth progress and seconds update
      const curRemainingSec = Math.ceil(diffMs / 1000);
      setTimeLeft(curRemainingSec);

      const totalMs = durations[mode] * 60 * 1000;
      const elapsedMs = totalMs - diffMs;
      const pct = Math.min(100, Math.max(0, (elapsedMs / totalMs) * 100));
      setProgressPercent(pct);
    }, 50);

    return () => clearInterval(timer);
  }, [isRunning, mode, durations, timeLeft]);

  const start = useCallback(() => {
    if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission().catch(() => {});
    }
    targetEndTimeRef.current = Date.now() + timeLeft * 1000;
    setIsRunning(true);
  }, [timeLeft]);

  const pause = useCallback(() => {
    targetEndTimeRef.current = null;
    setIsRunning(false);
  }, []);

  const toggle = useCallback(() => {
    if (isRunning) {
      pause();
    } else {
      start();
    }
  }, [isRunning, start, pause]);

  const reset = useCallback(() => {
    targetEndTimeRef.current = null;
    setIsRunning(false);
    setTimeLeft(durations[mode] * 60);
    setProgressPercent(0);
  }, [durations, mode]);

  const switchMode = useCallback((newMode: PomodoroMode) => {
    targetEndTimeRef.current = null;
    setIsRunning(false);
    setMode(newMode);
    setTimeLeft(durations[newMode] * 60);
    setProgressPercent(0);
  }, [durations]);

  const adjustDuration = useCallback((deltaMinutes: number) => {
    targetEndTimeRef.current = null;
    setIsRunning(false);
    setProgressPercent(0);
    setDurations((prev) => {
      const current = prev[mode];
      const nextMin = Math.max(1, Math.min(120, current + deltaMinutes));
      const nextDurations = { ...prev, [mode]: nextMin };
      setTimeLeft(nextMin * 60);
      return nextDurations;
    });
  }, [mode]);

  return {
    mode,
    isRunning,
    timeLeft,
    totalDuration,
    progressPercent,
    durations,
    start,
    pause,
    toggle,
    reset,
    switchMode,
    adjustDuration
  };
}
