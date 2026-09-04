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
  soundEnabled = true,
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

  const totalDuration = durations[mode] * 60;
  // Progress from 0% at start to 100% when time runs out
  const progressPercent = Math.min(
    100,
    Math.max(0, ((totalDuration - timeLeft) / totalDuration) * 100)
  );

  const onSessionCompletedRef = useRef(onSessionCompleted);
  useEffect(() => {
    onSessionCompletedRef.current = onSessionCompleted;
  }, [onSessionCompleted]);

  const soundEnabledRef = useRef(soundEnabled);
  useEffect(() => {
    soundEnabledRef.current = soundEnabled;
  }, [soundEnabled]);

  // Handle countdown interval
  useEffect(() => {
    if (!isRunning) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          // Timer finished
          setIsRunning(false);

          // Play procedural harmonic bell chime
          if (soundEnabledRef.current) {
            audioEngine.playCompletionChime();
          }

          // Browser Desktop Notification
          if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
            try {
              new Notification('Time Warp Focus', {
                body: mode === 'focus'
                  ? 'Great focus session! Time to take a well-deserved break.'
                  : 'Break completed! Ready to make progress on your goal?',
                icon: '/hourglass.svg'
              });
            } catch {}
          }

          // Trigger completion callback
          onSessionCompletedRef.current?.(mode);

          // Automatically prepare default for next session
          const nextMode: PomodoroMode = mode === 'focus' ? 'shortBreak' : 'focus';
          setMode(nextMode);
          return durations[nextMode] * 60;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isRunning, mode, durations]);

  const start = useCallback(() => {
    // Request notification permission if needed
    if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission().catch(() => {});
    }
    setIsRunning(true);
  }, []);

  const pause = useCallback(() => {
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
    setIsRunning(false);
    setTimeLeft(durations[mode] * 60);
  }, [durations, mode]);

  const switchMode = useCallback((newMode: PomodoroMode) => {
    setIsRunning(false);
    setMode(newMode);
    setTimeLeft(durations[newMode] * 60);
  }, [durations]);

  const adjustDuration = useCallback((deltaMinutes: number) => {
    setDurations((prev) => {
      const current = prev[mode];
      const nextMin = Math.max(1, Math.min(120, current + deltaMinutes));
      const nextDurations = { ...prev, [mode]: nextMin };
      setTimeLeft(nextMin * 60);
      return nextDurations;
    });
    setIsRunning(false);
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
