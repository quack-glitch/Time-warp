import React, { useState, useEffect } from 'react';
import { ThemeColors } from '../types/theme';
import { Goal } from '../types/goal';
import { FocusMode, TimerStatus, PomodoroDurations, FocusSettings, DayFocusSummary } from '../types/focus';
import { TimerDisplay } from './TimerDisplay';
import { audioEngine } from '../services/audio';
import { requestNotificationPermission, isNotificationSupported } from '../services/notifications';
import {
  loadFocusSessions,
  calculateTodayFocus,
  calculateSevenDayHistory,
  formatFocusDuration
} from '../services/focus-history';
import {
  X,
  Play,
  Pause,
  RotateCcw,
  Target,
  Flame,
  Coffee,
  Armchair,
  Sliders,
  Plus,
  Minus,
  Timer,
  Volume2,
  Bell,
  CheckCircle2,
  FastForward,
  Activity
} from 'lucide-react';

interface PomodoroModalProps {
  isOpen: boolean;
  theme: ThemeColors;
  activeGoal: Goal;
  streakDays: number;
  mode: FocusMode;
  status: TimerStatus;
  isRunning: boolean;
  isPaused: boolean;
  isCompleted: boolean;
  timeLeft: number;
  timeLeftMs: number;
  totalDuration: number;
  progressPercent: number;
  durations: PomodoroDurations;
  cycleSessions: number;
  sessionTarget: number;
  settings: FocusSettings;
  todayFocusSummary?: { durationMs: number; sessionCount: number; formatted: string };
  sevenDayHistory?: {
    sevenDays: DayFocusSummary[];
    totalMs: number;
    totalSessionCount: number;
    totalFormatted: string;
  };
  onClose: () => void;
  onToggle: () => void;
  onReset: () => void;
  onSwitchMode: (mode: FocusMode) => void;
  onStartNextSession?: (mode: FocusMode) => void;
  onAdjustDuration: (deltaMinutes: number) => void;
  onUpdateSettings: (settings: Partial<FocusSettings>) => void;
  onSkipLongBreak: () => void;
}

export const PomodoroModal: React.FC<PomodoroModalProps> = ({
  isOpen,
  theme,
  activeGoal,
  streakDays,
  mode,
  status,
  isRunning,
  isPaused,
  isCompleted,
  timeLeft: _timeLeft,
  timeLeftMs,
  totalDuration: _totalDuration,
  progressPercent,
  durations,
  cycleSessions,
  sessionTarget,
  settings,
  todayFocusSummary,
  sevenDayHistory,
  onClose,
  onToggle,
  onReset,
  onSwitchMode,
  onStartNextSession,
  onAdjustDuration,
  onUpdateSettings,
  onSkipLongBreak
}) => {
  const [showSettingsDrawer, setShowSettingsDrawer] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [testSoundPlaying, setTestSoundPlaying] = useState(false);

  // Modal Keyboard Shortcuts: Space (Toggle), R (Reset), Esc (Close)
  useEffect(() => {
    if (!isOpen) return;

    const handleModalKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes(target?.tagName || '') || target?.isContentEditable) return;

      if (e.code === 'Space' || e.key === ' ') {
        e.preventDefault();
        onToggle();
      } else if (e.key === 'r' || e.key === 'R') {
        e.preventDefault();
        onReset();
      } else if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };

    window.addEventListener('keydown', handleModalKeyDown);
    return () => window.removeEventListener('keydown', handleModalKeyDown);
  }, [isOpen, onToggle, onReset, onClose]);

  // Fallback focus summary calculation if not provided via props
  const fallbackSummary = React.useMemo(() => {
    if (todayFocusSummary && sevenDayHistory) return null;
    const sessions = loadFocusSessions();
    const runningElapsed =
      mode === 'focus' && (status === 'running' || status === 'paused')
        ? Math.max(0, durations.focus * 60 * 1000 - timeLeftMs)
        : 0;
    return {
      today: calculateTodayFocus(sessions, runningElapsed),
      sevenDay: calculateSevenDayHistory(sessions)
    };
  }, [todayFocusSummary, sevenDayHistory, mode, status, durations.focus, timeLeftMs]);

  const activeTodaySummary = todayFocusSummary || fallbackSummary?.today || {
    durationMs: 0,
    sessionCount: 0,
    formatted: '0h 00m focused'
  };

  const activeSevenDayHistory = sevenDayHistory || fallbackSummary?.sevenDay || {
    sevenDays: [],
    totalMs: 0,
    totalSessionCount: 0,
    totalFormatted: '0h 00m'
  };

  const maxSevenDayMs = Math.max(
    ...activeSevenDayHistory.sevenDays.map((d) => d.durationMs),
    1
  );

  if (!isOpen) return null;

  // Circular SVG dimensions
  const size = 200;
  const strokeWidth = 7;
  const center = size / 2;
  const radius = center - strokeWidth - 6;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (progressPercent / 100) * circumference;

  // Leading thumb dot calculation
  const angle = -Math.PI / 2 + (progressPercent / 100) * 2 * Math.PI;
  const dotX = center + radius * Math.cos(angle);
  const dotY = center + radius * Math.sin(angle);

  const goalSessions = activeGoal.pomodoroSessions || 0;
  const isStopwatch = mode === 'stopwatch';

  const modeLabels: Record<FocusMode, { title: string; subtitle: string }> = {
    focus: { title: 'FOCUS TIME', subtitle: 'Time to focus' },
    shortBreak: { title: 'SHORT BREAK', subtitle: 'Time to rest and recharge' },
    longBreak: { title: 'LONG BREAK', subtitle: 'Deep restorative pause' },
    stopwatch: { title: 'STOPWATCH', subtitle: 'Open-ended active session' }
  };

  const handleTestSound = () => {
    setTestSoundPlaying(true);
    audioEngine.testAlarm(settings.alarmType, settings.alarmVolume);
    setTimeout(() => setTestSoundPlaying(false), 1500);
  };

  const handleToggleNotifications = async () => {
    if (!settings.notificationsEnabled) {
      if (isNotificationSupported()) {
        const perm = await requestNotificationPermission();
        if (perm === 'granted') {
          onUpdateSettings({ notificationsEnabled: true });
        } else {
          alert('Notification permission was denied in your browser settings.');
          onUpdateSettings({ notificationsEnabled: false });
        }
      } else {
        alert('Desktop notifications are not supported in this browser.');
      }
    } else {
      onUpdateSettings({ notificationsEnabled: false });
    }
  };

  // Completion UI content determination
  const isThresholdMet = cycleSessions >= sessionTarget;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/90 backdrop-blur-xl transition-opacity duration-200"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Focus Companion"
    >
      <div
        className="w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-3xl p-5 sm:p-7 border shadow-2xl relative flex flex-col items-center select-none"
        style={{
          backgroundColor: theme.bgSecondary,
          borderColor: theme.border,
          color: theme.textPrimary
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Subtle radial background glow */}
        <div
          className="absolute -top-20 -left-20 w-52 h-52 rounded-full pointer-events-none opacity-20 blur-3xl"
          style={{ backgroundColor: theme.accent }}
        />

        {/* Top bar: Capsule & Close */}
        <div className="w-full flex items-center justify-between relative z-10 mb-1">
          <div className="flex items-center gap-2">
            <span className="text-xl">🍅</span>
            <span
              className="text-[11px] font-bold tracking-widest uppercase font-mono px-2.5 py-0.5 rounded-md border"
              style={{
                borderColor: theme.border,
                backgroundColor: theme.cardBg,
                color: theme.accent
              }}
            >
              Focus Companion
            </span>
            {mode === 'focus' && (
              <span
                className="text-[10px] font-mono tracking-wider px-2 py-0.5 rounded border opacity-80"
                style={{ borderColor: theme.border, color: theme.textSecondary }}
              >
                SESSION {Math.min(cycleSessions + 1, sessionTarget)} / {sessionTarget}
              </span>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-white/10 transition-colors cursor-pointer"
            style={{ color: theme.textSecondary }}
            title="Close (Esc or P)"
            aria-label="Close Focus Companion"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Brand Heading */}
        <div className="text-center mb-3 relative z-10">
          <h2
            className="text-lg sm:text-xl font-cinzel font-bold tracking-widest uppercase"
            style={{ color: theme.textPrimary }}
          >
            FOCUS <span style={{ color: theme.accent }}>COMPANION</span>
          </h2>
          <p
            className="text-[9px] font-mono tracking-widest uppercase opacity-60 mt-0.5"
            style={{ color: theme.textSecondary }}
          >
            INTENTION · FOCUS · MASTERY
          </p>
        </div>

        {/* Three Columns: Sessions Completed | Circular Timer | Daily Streak */}
        <div className="w-full flex items-center justify-between gap-3 relative z-10 mb-3">
          {/* Left: Total Milestone Sessions */}
          <div
            className="flex-1 flex flex-col items-center justify-center p-3 rounded-2xl border backdrop-blur-sm text-center min-w-[85px]"
            style={{
              backgroundColor: theme.cardBg,
              borderColor: theme.border
            }}
          >
            <Target className="w-4 h-4 mb-1" style={{ color: theme.accent }} />
            <span className="text-[9px] font-mono uppercase tracking-wider opacity-60">
              Sessions
            </span>
            <span
              className="text-xl font-bold font-sans tabular-nums mt-0.5"
              style={{ color: theme.textPrimary }}
            >
              {goalSessions}
            </span>
            <span className="text-[9px] font-medium opacity-60 whitespace-nowrap">
              Completed
            </span>
          </div>

          {/* Center: Circular Display or Stopwatch Ring */}
          <div className="relative flex items-center justify-center flex-shrink-0">
            <svg width={size} height={size}>
              {/* Background Track Ring */}
              <circle
                cx={center}
                cy={center}
                r={radius}
                fill="transparent"
                stroke="currentColor"
                strokeWidth={strokeWidth}
                className="opacity-15"
                style={{ color: theme.textSecondary }}
              />

              {/* Dynamic Progress Arc (hidden in stopwatch mode) */}
              {!isStopwatch && (
                <circle
                  cx={center}
                  cy={center}
                  r={radius}
                  fill="transparent"
                  stroke={theme.accent}
                  strokeWidth={strokeWidth}
                  strokeDasharray={circumference}
                  strokeDashoffset={strokeDashoffset}
                  strokeLinecap="round"
                  transform={`rotate(-90 ${center} ${center})`}
                  style={{
                    filter: `drop-shadow(0 0 8px ${theme.accentGlow})`,
                    transition: 'stroke-dashoffset 200ms linear'
                  }}
                />
              )}

              {/* Stopwatch glowing indicator */}
              {isStopwatch && isRunning && (
                <circle
                  cx={center}
                  cy={center}
                  r={radius}
                  fill="transparent"
                  stroke={theme.accent}
                  strokeWidth={strokeWidth}
                  className="animate-pulse"
                  style={{
                    filter: `drop-shadow(0 0 8px ${theme.accentGlow})`
                  }}
                />
              )}

              {/* Leading Thumb Dot */}
              {!isStopwatch && progressPercent > 0 && progressPercent < 100 && (
                <circle
                  cx={dotX}
                  cy={dotY}
                  r={strokeWidth * 0.8}
                  fill="#ffffff"
                  style={{
                    filter: `drop-shadow(0 0 6px ${theme.accent})`
                  }}
                />
              )}
            </svg>

            {/* Inner Content within Ring */}
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-4">
              <span
                className="text-[9px] font-mono font-bold tracking-wider uppercase opacity-70 mb-0.5"
                style={{ color: theme.accent }}
              >
                {isCompleted ? 'COMPLETE' : modeLabels[mode].title}
              </span>

              {/* Reusable Central Timer Display */}
              <TimerDisplay
                timeMs={timeLeftMs}
                isStopwatch={isStopwatch}
                size="lg"
                color={theme.textPrimary}
              />

              <div
                className="flex items-center gap-1 mt-1 px-2.5 py-0.5 rounded-full text-[9px] font-medium border max-w-[150px] truncate"
                style={{
                  borderColor: theme.border,
                  backgroundColor: 'rgba(255,255,255,0.03)',
                  color: theme.textSecondary
                }}
              >
                {isStopwatch ? (
                  <Activity className="w-2.5 h-2.5 opacity-70 flex-shrink-0" />
                ) : (
                  <Timer className="w-2.5 h-2.5 opacity-70 flex-shrink-0" />
                )}
                <span className="truncate">
                  {status === 'paused'
                    ? 'Paused'
                    : isCompleted
                    ? 'Session Ended'
                    : modeLabels[mode].subtitle}
                </span>
              </div>
            </div>
          </div>

          {/* Right: Daily Streak */}
          <div
            className="flex-1 flex flex-col items-center justify-center p-3 rounded-2xl border backdrop-blur-sm text-center min-w-[85px]"
            style={{
              backgroundColor: theme.cardBg,
              borderColor: theme.border
            }}
          >
            <Flame className="w-4 h-4 mb-1" style={{ color: theme.accent }} />
            <span className="text-[9px] font-mono uppercase tracking-wider opacity-60">
              Streak
            </span>
            <span
              className="text-xl font-bold font-sans tabular-nums mt-0.5"
              style={{ color: theme.textPrimary }}
            >
              {streakDays}
            </span>
            <span className="text-[9px] font-medium opacity-60 whitespace-nowrap">
              {streakDays === 1 ? 'Day' : 'Days'}
            </span>
          </div>
        </div>

        {isCompleted ? (
          <div
            className="w-full my-2 p-4 rounded-2xl border text-center flex flex-col items-center justify-center gap-2.5 animate-fadeIn"
            style={{
              borderColor: theme.accent,
              backgroundColor: 'rgba(234, 179, 8, 0.05)'
            }}
          >
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4" style={{ color: theme.accent }} />
              <span
                className="font-cinzel font-bold text-sm tracking-wider uppercase"
                style={{ color: theme.accent }}
              >
                {mode === 'focus'
                  ? isThresholdMet
                    ? `SESSION ${sessionTarget} COMPLETE`
                    : 'FOCUS COMPLETE'
                  : mode === 'shortBreak'
                  ? 'BREAK COMPLETE'
                  : 'LONG BREAK COMPLETE'}
              </span>
            </div>

            <p className="text-xs font-mono opacity-80" style={{ color: theme.textSecondary }}>
              {mode === 'focus'
                ? isThresholdMet
                  ? `Cycle completed! Long break recommended (${durations.longBreak}m).`
                  : `${durations.focus}m session finished. Take a rest!`
                : mode === 'shortBreak'
                ? `${durations.shortBreak}m break finished. Ready to focus again?`
                : `${durations.longBreak}m long break finished. Well done!`}
            </p>

            <div className="flex items-center gap-2 mt-1">
              {mode === 'focus' && !isThresholdMet && (
                <button
                  onClick={() => {
                    if (onStartNextSession) onStartNextSession('shortBreak');
                    else onSwitchMode('shortBreak');
                  }}
                  className="px-5 py-2 rounded-full font-bold text-xs uppercase tracking-wider text-white shadow-lg cursor-pointer hover:scale-105 active:scale-95 transition-all"
                  style={{
                    backgroundColor: theme.accent,
                    boxShadow: `0 4px 15px ${theme.accentGlow}`
                  }}
                >
                  START BREAK
                </button>
              )}

              {mode === 'focus' && isThresholdMet && (
                <>
                  <button
                    onClick={() => {
                      if (onStartNextSession) onStartNextSession('longBreak');
                      else onSwitchMode('longBreak');
                    }}
                    className="px-5 py-2 rounded-full font-bold text-xs uppercase tracking-wider text-white shadow-lg cursor-pointer hover:scale-105 active:scale-95 transition-all"
                    style={{
                      backgroundColor: theme.accent,
                      boxShadow: `0 4px 15px ${theme.accentGlow}`
                    }}
                  >
                    START LONG BREAK
                  </button>
                  <button
                    onClick={onSkipLongBreak}
                    className="px-4 py-2 rounded-full font-semibold text-xs border cursor-pointer hover:bg-white/10 transition-all flex items-center gap-1"
                    style={{ borderColor: theme.border, color: theme.textSecondary }}
                  >
                    <FastForward className="w-3 h-3" />
                    <span>SKIP</span>
                  </button>
                </>
              )}

              {(mode === 'shortBreak' || mode === 'longBreak') && (
                <button
                  onClick={() => {
                    if (onStartNextSession) onStartNextSession('focus');
                    else onSwitchMode('focus');
                  }}
                  className="px-5 py-2 rounded-full font-bold text-xs uppercase tracking-wider text-white shadow-lg cursor-pointer hover:scale-105 active:scale-95 transition-all"
                  style={{
                    backgroundColor: theme.accent,
                    boxShadow: `0 4px 15px ${theme.accentGlow}`
                  }}
                >
                  START FOCUS
                </button>
              )}

              <button
                onClick={onReset}
                className="px-4 py-2 rounded-full font-semibold text-xs border cursor-pointer hover:bg-white/10 transition-all"
                style={{ borderColor: theme.border, color: theme.textSecondary }}
              >
                DONE
              </button>
            </div>
          </div>
        ) : (
          /* PRIMARY RUNNING CONTROLS: START / PAUSE + RESET */
          <div className="flex items-center justify-center gap-3 relative z-10 mb-4">
            <button
              onClick={onToggle}
              className="flex items-center justify-center gap-2 px-8 py-3 rounded-full font-bold text-sm tracking-wider uppercase shadow-xl transition-all duration-200 hover:scale-105 active:scale-95 cursor-pointer text-white"
              style={{
                backgroundColor: theme.accent,
                boxShadow: `0 4px 20px ${theme.accentGlow}`
              }}
              aria-label={isRunning ? 'Pause Timer' : isPaused ? 'Resume Timer' : 'Start Timer'}
            >
              {isRunning ? (
                <Pause className="w-4 h-4 fill-current" />
              ) : (
                <Play className="w-4 h-4 fill-current ml-0.5" />
              )}
              <span>{isRunning ? 'PAUSE' : isPaused ? 'RESUME' : 'START'}</span>
            </button>

            <button
              onClick={onReset}
              className="p-3 rounded-full border transition-all duration-200 hover:bg-white/10 hover:scale-105 active:scale-95 cursor-pointer"
              style={{
                borderColor: theme.border,
                backgroundColor: theme.cardBg,
                color: theme.textSecondary
              }}
              title="Reset Timer (R)"
              aria-label="Reset Timer"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Mode Selector Pill Bar */}
        <div
          className="w-full flex items-center justify-between p-1.5 rounded-2xl border backdrop-blur-md relative z-10 text-xs font-medium mb-3"
          style={{
            borderColor: theme.border,
            backgroundColor: theme.cardBg
          }}
        >
          {/* Focus Tab */}
          <button
            onClick={() => onSwitchMode('focus')}
            className={`flex-1 py-1.5 px-2 rounded-xl flex items-center justify-center gap-1 transition-all text-center cursor-pointer ${
              mode === 'focus' ? 'font-bold shadow-md' : 'opacity-60 hover:opacity-100'
            }`}
            style={{
              backgroundColor: mode === 'focus' ? theme.bgSecondary : 'transparent',
              color: mode === 'focus' ? theme.accent : theme.textSecondary
            }}
          >
            <Timer className="w-3.5 h-3.5" />
            <span className="text-[10px] sm:text-[11px]">Focus {durations.focus}m</span>
          </button>

          {/* Short Break Tab */}
          <button
            onClick={() => onSwitchMode('shortBreak')}
            className={`flex-1 py-1.5 px-2 rounded-xl flex items-center justify-center gap-1 transition-all text-center cursor-pointer ${
              mode === 'shortBreak' ? 'font-bold shadow-md' : 'opacity-60 hover:opacity-100'
            }`}
            style={{
              backgroundColor: mode === 'shortBreak' ? theme.bgSecondary : 'transparent',
              color: mode === 'shortBreak' ? theme.accent : theme.textSecondary
            }}
          >
            <Coffee className="w-3.5 h-3.5" />
            <span className="text-[10px] sm:text-[11px]">Short {durations.shortBreak}m</span>
          </button>

          {/* Long Break Tab */}
          <button
            onClick={() => onSwitchMode('longBreak')}
            className={`flex-1 py-1.5 px-2 rounded-xl flex items-center justify-center gap-1 transition-all text-center cursor-pointer ${
              mode === 'longBreak' ? 'font-bold shadow-md' : 'opacity-60 hover:opacity-100'
            }`}
            style={{
              backgroundColor: mode === 'longBreak' ? theme.bgSecondary : 'transparent',
              color: mode === 'longBreak' ? theme.accent : theme.textSecondary
            }}
          >
            <Armchair className="w-3.5 h-3.5" />
            <span className="text-[10px] sm:text-[11px]">Long {durations.longBreak}m</span>
          </button>

          {/* Stopwatch Tab */}
          <button
            onClick={() => onSwitchMode('stopwatch')}
            className={`flex-1 py-1.5 px-2 rounded-xl flex items-center justify-center gap-1 transition-all text-center cursor-pointer ${
              mode === 'stopwatch' ? 'font-bold shadow-md' : 'opacity-60 hover:opacity-100'
            }`}
            style={{
              backgroundColor: mode === 'stopwatch' ? theme.bgSecondary : 'transparent',
              color: mode === 'stopwatch' ? theme.accent : theme.textSecondary
            }}
          >
            <Activity className="w-3.5 h-3.5" />
            <span className="text-[10px] sm:text-[11px]">Stopwatch</span>
          </button>

          {/* Settings Drawer Toggle */}
          <button
            onClick={() => setShowSettingsDrawer((v) => !v)}
            className={`p-1.5 rounded-xl border transition-all cursor-pointer ${
              showSettingsDrawer ? 'opacity-100' : 'opacity-60 hover:opacity-100'
            }`}
            style={{
              borderColor: showSettingsDrawer ? theme.accent : 'transparent',
              color: showSettingsDrawer ? theme.accent : theme.textSecondary
            }}
            title="Focus Timer Settings"
            aria-label="Focus Timer Settings"
          >
            <Sliders className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Quick Stepper (when settings drawer is collapsed) */}
        {!showSettingsDrawer && mode !== 'stopwatch' && (
          <div
            className="w-full p-2 rounded-xl border flex items-center justify-between text-xs font-mono"
            style={{
              borderColor: theme.border,
              backgroundColor: theme.cardBg
            }}
          >
            <span className="text-[11px]" style={{ color: theme.textSecondary }}>
              Set {mode}:
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => onAdjustDuration(-5)}
                className="p-1 rounded-lg border hover:bg-white/10 cursor-pointer"
                style={{ borderColor: theme.border }}
                title="Decrease 5 minutes"
                aria-label="Decrease 5 minutes"
              >
                <Minus className="w-3 h-3" />
              </button>
              <span className="font-bold tabular-nums" style={{ color: theme.textPrimary }}>
                {durations[mode]} min
              </span>
              <button
                onClick={() => onAdjustDuration(5)}
                className="p-1 rounded-lg border hover:bg-white/10 cursor-pointer"
                style={{ borderColor: theme.border }}
                title="Increase 5 minutes"
                aria-label="Increase 5 minutes"
              >
                <Plus className="w-3 h-3" />
              </button>
            </div>
          </div>
        )}

        {/* COMPREHENSIVE FOCUS TIMER SETTINGS DRAWER (Section 29) */}
        {showSettingsDrawer && (
          <div
            className="w-full p-3.5 rounded-2xl border flex flex-col gap-3 text-xs font-mono animate-fadeIn"
            style={{
              borderColor: theme.accent,
              backgroundColor: theme.cardBg
            }}
          >
            <div className="flex items-center justify-between border-b pb-2" style={{ borderColor: theme.border }}>
              <span className="font-bold uppercase tracking-wider text-[10px]" style={{ color: theme.accent }}>
                Focus Timer Settings
              </span>
              <button
                onClick={() => setShowSettingsDrawer(false)}
                className="text-[10px] opacity-70 hover:opacity-100 underline cursor-pointer"
                style={{ color: theme.textSecondary }}
              >
                Done
              </button>
            </div>

            {/* Durations Grid */}
            <div className="grid grid-cols-3 gap-2">
              <div className="flex flex-col gap-1">
                <label className="text-[9px] uppercase opacity-70" style={{ color: theme.textSecondary }}>
                  Focus (min)
                </label>
                <input
                  type="number"
                  min="1"
                  max="120"
                  value={settings.focusMinutes}
                  onChange={(e) => {
                    const v = parseInt(e.target.value, 10);
                    if (!isNaN(v)) onUpdateSettings({ focusMinutes: v });
                  }}
                  onBlur={(e) => {
                    const v = parseInt(e.target.value, 10);
                    onUpdateSettings({ focusMinutes: isNaN(v) ? 25 : v });
                  }}
                  className="px-2 py-1 rounded border bg-black/30 font-bold tabular-nums text-center"
                  style={{ borderColor: theme.border, color: theme.textPrimary }}
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[9px] uppercase opacity-70" style={{ color: theme.textSecondary }}>
                  Short (min)
                </label>
                <input
                  type="number"
                  min="1"
                  max="60"
                  value={settings.shortBreakMinutes}
                  onChange={(e) => {
                    const v = parseInt(e.target.value, 10);
                    if (!isNaN(v)) onUpdateSettings({ shortBreakMinutes: v });
                  }}
                  onBlur={(e) => {
                    const v = parseInt(e.target.value, 10);
                    onUpdateSettings({ shortBreakMinutes: isNaN(v) ? 5 : v });
                  }}
                  className="px-2 py-1 rounded border bg-black/30 font-bold tabular-nums text-center"
                  style={{ borderColor: theme.border, color: theme.textPrimary }}
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[9px] uppercase opacity-70" style={{ color: theme.textSecondary }}>
                  Long (min)
                </label>
                <input
                  type="number"
                  min="1"
                  max="120"
                  value={settings.longBreakMinutes}
                  onChange={(e) => {
                    const v = parseInt(e.target.value, 10);
                    if (!isNaN(v)) onUpdateSettings({ longBreakMinutes: v });
                  }}
                  onBlur={(e) => {
                    const v = parseInt(e.target.value, 10);
                    onUpdateSettings({ longBreakMinutes: isNaN(v) ? 15 : v });
                  }}
                  className="px-2 py-1 rounded border bg-black/30 font-bold tabular-nums text-center"
                  style={{ borderColor: theme.border, color: theme.textPrimary }}
                />
              </div>
            </div>

            {/* Cycle Threshold & Auto-Start */}
            <div className="flex items-center justify-between gap-2 pt-1 border-t" style={{ borderColor: theme.border }}>
              <div className="flex flex-col gap-0.5">
                <span className="text-[10px] font-semibold" style={{ color: theme.textPrimary }}>
                  Long Break Threshold
                </span>
                <span className="text-[9px] opacity-60" style={{ color: theme.textSecondary }}>
                  Sessions before long break
                </span>
              </div>
              <input
                type="number"
                min="1"
                max="10"
                value={settings.longBreakInterval}
                onChange={(e) => {
                  const v = parseInt(e.target.value, 10);
                  if (!isNaN(v)) onUpdateSettings({ longBreakInterval: v });
                }}
                onBlur={(e) => {
                  const v = parseInt(e.target.value, 10);
                  onUpdateSettings({ longBreakInterval: isNaN(v) ? 4 : v });
                }}
                className="w-16 px-2 py-1 rounded border bg-black/30 font-bold tabular-nums text-center"
                style={{ borderColor: theme.border, color: theme.textPrimary }}
              />
            </div>

            {/* Auto-Start Next Session Toggle */}
            <div className="flex items-center justify-between gap-2 pt-1 border-t" style={{ borderColor: theme.border }}>
              <div className="flex flex-col gap-0.5">
                <span className="text-[10px] font-semibold" style={{ color: theme.textPrimary }}>
                  Auto-Start Next Session
                </span>
                <span className="text-[9px] opacity-60" style={{ color: theme.textSecondary }}>
                  Start breaks and sprints automatically
                </span>
              </div>
              <button
                type="button"
                onClick={() => onUpdateSettings({ autoStart: !settings.autoStart })}
                className={`px-3 py-1 rounded-full text-[10px] font-bold border transition-all cursor-pointer ${
                  settings.autoStart ? 'bg-amber-500 text-black border-amber-400' : 'opacity-60 border-white/20'
                }`}
              >
                {settings.autoStart ? 'ON' : 'OFF'}
              </button>
            </div>

            {/* Alarm Sound Style */}
            <div className="flex items-center justify-between gap-2 pt-1 border-t" style={{ borderColor: theme.border }}>
              <div className="flex flex-col gap-0.5">
                <span className="text-[10px] font-semibold" style={{ color: theme.textPrimary }}>
                  Alarm Style
                </span>
                <span className="text-[9px] opacity-60" style={{ color: theme.textSecondary }}>
                  Procedural completion signal
                </span>
              </div>
              <select
                value={settings.alarmType}
                onChange={(e) => onUpdateSettings({ alarmType: e.target.value as FocusSettings['alarmType'] })}
                className="px-2 py-1 rounded border bg-black/30 font-mono text-[10px] uppercase cursor-pointer"
                style={{ borderColor: theme.border, color: theme.textPrimary }}
              >
                <option value="none">None</option>
                <option value="soft">Soft</option>
                <option value="standard">Standard</option>
                <option value="strong">Strong</option>
              </select>
            </div>

            {/* Alarm Volume Slider & Test Sound */}
            <div className="flex items-center justify-between gap-2 pt-1 border-t" style={{ borderColor: theme.border }}>
              <div className="flex items-center gap-2">
                <Volume2 className="w-3.5 h-3.5" style={{ color: theme.accent }} />
                <span className="text-[10px] font-semibold" style={{ color: theme.textPrimary }}>
                  Alarm Volume ({Math.round(settings.alarmVolume * 100)}%)
                </span>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={settings.alarmVolume}
                  onChange={(e) => onUpdateSettings({ alarmVolume: Number(e.target.value) })}
                  className="w-20 accent-amber-500 cursor-pointer"
                />
                <button
                  type="button"
                  onClick={handleTestSound}
                  disabled={testSoundPlaying}
                  className="px-2 py-0.5 rounded border text-[9px] font-bold hover:bg-white/10 transition-colors cursor-pointer"
                  style={{ borderColor: theme.border, color: theme.accent }}
                >
                  {testSoundPlaying ? 'Playing...' : 'Test Sound'}
                </button>
              </div>
            </div>

            {/* Desktop Notifications Toggle */}
            <div className="flex items-center justify-between gap-2 pt-1 border-t" style={{ borderColor: theme.border }}>
              <div className="flex items-center gap-2">
                <Bell className="w-3.5 h-3.5" style={{ color: theme.accent }} />
                <div className="flex flex-col gap-0.5">
                  <span className="text-[10px] font-semibold" style={{ color: theme.textPrimary }}>
                    Desktop Notifications
                  </span>
                  <span className="text-[9px] opacity-60" style={{ color: theme.textSecondary }}>
                    Native browser alerts
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={handleToggleNotifications}
                className={`px-3 py-1 rounded-full text-[10px] font-bold border transition-all cursor-pointer ${
                  settings.notificationsEnabled ? 'bg-amber-500 text-black border-amber-400' : 'opacity-60 border-white/20'
                }`}
              >
                {settings.notificationsEnabled ? 'ON' : 'OFF'}
              </button>
            </div>
          </div>
        )}

        {/* Focus Time Tracking (Section 38) */}
        <div
          className="w-full mt-3.5 p-3 sm:p-4 rounded-2xl border text-center flex flex-col items-center gap-1.5 transition-all relative z-10"
          style={{
            borderColor: theme.border,
            backgroundColor: theme.cardBg
          }}
        >
          <span
            className="text-[9px] font-mono font-bold tracking-widest uppercase opacity-60"
            style={{ color: theme.textSecondary }}
          >
            TODAY
          </span>
          <div
            className="text-xs sm:text-sm font-mono font-bold tracking-wide"
            style={{ color: theme.textPrimary }}
          >
            {activeTodaySummary.formatted} • {activeTodaySummary.sessionCount}{' '}
            {activeTodaySummary.sessionCount === 1 ? 'session' : 'sessions'}
          </div>

          <button
            type="button"
            onClick={() => setShowHistory((prev) => !prev)}
            className="mt-1 text-[10px] font-mono uppercase tracking-wider px-3.5 py-1 rounded-lg border hover:bg-white/10 active:scale-95 transition-all cursor-pointer"
            style={{
              borderColor: theme.border,
              color: theme.accent
            }}
            aria-expanded={showHistory}
          >
            {showHistory ? '[ HIDE 7-DAY HISTORY ]' : '[ VIEW 7-DAY HISTORY ]'}
          </button>

          {showHistory && (
            <div
              className="w-full mt-2.5 pt-3 border-t text-left flex flex-col gap-1.5 animate-fadeIn"
              style={{ borderColor: theme.border }}
            >
              <div
                className="text-[10px] font-mono uppercase tracking-wider font-bold opacity-60 mb-0.5"
                style={{ color: theme.textSecondary }}
              >
                RECENT 7 DAYS
              </div>

              {activeSevenDayHistory.sevenDays.map((day) => {
                const barPercent =
                  day.durationMs > 0
                    ? Math.max(8, Math.round((day.durationMs / maxSevenDayMs) * 100))
                    : 0;
                return (
                  <div
                    key={day.dateStr}
                    className="w-full flex items-center justify-between text-xs font-mono py-0.5"
                  >
                    <span
                      className={`w-9 text-left font-bold ${
                        day.isToday ? 'opacity-100' : 'opacity-70'
                      }`}
                      style={{ color: day.isToday ? theme.accent : theme.textSecondary }}
                    >
                      {day.dayLabel}
                    </span>
                    <div className="flex-1 mx-3 h-2 bg-black/40 rounded-full overflow-hidden border border-white/5">
                      <div
                        className="h-full rounded-full transition-all duration-300"
                        style={{
                          width: `${barPercent}%`,
                          backgroundColor: day.isToday
                            ? theme.accent
                            : 'rgba(255, 255, 255, 0.4)',
                          boxShadow:
                            day.isToday && day.durationMs > 0
                              ? `0 0 6px ${theme.accentGlow}`
                              : 'none'
                        }}
                      />
                    </div>
                    <span
                      className="w-16 text-right tabular-nums opacity-90"
                      style={{ color: theme.textPrimary }}
                    >
                      {formatFocusDuration(day.durationMs)}
                    </span>
                  </div>
                );
              })}

              <div
                className="w-full mt-2 pt-2.5 border-t flex items-center justify-between text-xs font-mono"
                style={{ borderColor: theme.border }}
              >
                <span
                  className="text-[10px] uppercase tracking-wider font-bold opacity-70"
                  style={{ color: theme.textSecondary }}
                >
                  7-DAY TOTAL
                </span>
                <span
                  className="font-bold tabular-nums"
                  style={{ color: theme.textPrimary }}
                >
                  {activeSevenDayHistory.totalFormatted} • {activeSevenDayHistory.totalSessionCount}{' '}
                  {activeSevenDayHistory.totalSessionCount === 1 ? 'session' : 'sessions'}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Milestone Linkage Footer */}
        <div
          className="w-full flex items-center justify-center mt-3.5 pt-2 text-center relative z-10"
        >
          <div
            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border text-[10px] font-mono backdrop-blur-sm transition-all shadow-sm"
            style={{
              borderColor: theme.border,
              backgroundColor: 'rgba(255, 255, 255, 0.03)'
            }}
          >
            <Target className="w-3 h-3 flex-shrink-0" style={{ color: theme.accent }} />
            <span
              className="tracking-wider uppercase opacity-60 font-semibold"
              style={{ color: theme.textSecondary }}
            >
              LINKED TO:
            </span>
            <span
              className="font-bold tracking-wide truncate max-w-[260px] underline underline-offset-2 cursor-default"
              style={{ color: theme.accent }}
              title={activeGoal.title}
            >
              {activeGoal.title || 'Current Goal'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
