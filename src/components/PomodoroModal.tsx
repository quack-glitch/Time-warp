import React, { useState } from 'react';
import { ThemeColors } from '../types/theme';
import { Goal } from '../types/goal';
import { PomodoroMode } from '../hooks/usePomodoroTimer';
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
  Timer
} from 'lucide-react';

interface PomodoroModalProps {
  isOpen: boolean;
  theme: ThemeColors;
  activeGoal: Goal;
  streakDays: number;
  mode: PomodoroMode;
  isRunning: boolean;
  timeLeft: number;
  totalDuration: number;
  progressPercent: number;
  durations: { focus: number; shortBreak: number; longBreak: number };
  onClose: () => void;
  onToggle: () => void;
  onReset: () => void;
  onSwitchMode: (mode: PomodoroMode) => void;
  onAdjustDuration: (deltaMinutes: number) => void;
}

export const PomodoroModal: React.FC<PomodoroModalProps> = ({
  isOpen,
  theme,
  activeGoal,
  streakDays,
  mode,
  isRunning,
  timeLeft,
  totalDuration: _totalDuration,
  progressPercent,
  durations,
  onClose,
  onToggle,
  onReset,
  onSwitchMode,
  onAdjustDuration
}) => {
  const [showCustomAdjuster, setShowCustomAdjuster] = useState(false);

  if (!isOpen) return null;

  // Format MM:SS
  const mins = Math.floor(timeLeft / 60);
  const secs = timeLeft % 60;
  const formattedTime = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;

  // Circular SVG dimensions
  const size = 240;
  const strokeWidth = 8;
  const center = size / 2;
  const radius = center - strokeWidth - 6;
  const circumference = 2 * Math.PI * radius;
  // Arc drains clockwise as time passes
  const strokeDashoffset = circumference - (progressPercent / 100) * circumference;

  // Leading dot position
  const angle = (progressPercent / 100) * 2 * Math.PI - Math.PI / 2;
  const dotX = center + radius * Math.cos(angle);
  const dotY = center + radius * Math.sin(angle);

  const goalSessions = activeGoal.pomodoroSessions || 0;

  const modeLabels: Record<PomodoroMode, { title: string; subtitle: string }> = {
    focus: { title: 'FOCUS TIME', subtitle: 'Time to focus!' },
    shortBreak: { title: 'SHORT BREAK', subtitle: 'Time to recharge' },
    longBreak: { title: 'LONG BREAK', subtitle: 'Deep recovery break' }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md transition-opacity duration-300 animate-ambient"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-3xl p-6 sm:p-7 border shadow-2xl relative overflow-hidden flex flex-col items-center select-none"
        style={{
          backgroundColor: theme.bgSecondary,
          borderColor: theme.border,
          color: theme.textPrimary
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Subtle radial ambient glow */}
        <div
          className="absolute -top-20 -left-20 w-52 h-52 rounded-full pointer-events-none opacity-20 blur-3xl"
          style={{ backgroundColor: theme.accent }}
        />

        {/* Top bar: Tomato/Timer Icon & Close */}
        <div className="w-full flex items-center justify-between relative z-10 mb-1">
          <div className="flex items-center gap-2">
            <span className="text-xl">🍅</span>
            <span
              className="text-[11px] font-bold tracking-widest uppercase font-mono px-2 py-0.5 rounded-md border"
              style={{
                borderColor: theme.border,
                backgroundColor: theme.cardBg,
                color: theme.accent
              }}
            >
              Sprint Companion
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-white/10 transition-colors"
            style={{ color: theme.textSecondary }}
            title="Close (Esc or P)"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Brand Heading inspired by screenshot */}
        <div className="text-center mb-4 relative z-10">
          <h2
            className="text-lg sm:text-xl font-cinzel font-bold tracking-widest uppercase"
            style={{ color: theme.textPrimary }}
          >
            POMODORO <span style={{ color: theme.accent }}>TIMER</span>
          </h2>
          <p
            className="text-[9px] font-mono tracking-widest uppercase opacity-60 mt-0.5"
            style={{ color: theme.textSecondary }}
          >
            FOCUS · WORK · ACHIEVE
          </p>
        </div>

        {/* Three Columns: Left Metric Card | Center Circular Ring | Right Metric Card */}
        <div className="w-full flex items-center justify-between gap-2 relative z-10 mb-4">
          {/* Left Card: Sessions Completed */}
          <div
            className="flex-1 flex flex-col items-center justify-center p-3 rounded-2xl border backdrop-blur-sm text-center min-w-0"
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
              className="text-xl sm:text-2xl font-bold font-sans tabular-nums mt-0.5"
              style={{ color: theme.textPrimary }}
            >
              {goalSessions}
            </span>
            <span className="text-[9px] font-medium opacity-60 truncate max-w-full">
              Completed
            </span>
          </div>

          {/* Center: Circular SVG Progress Ring */}
          <div className="relative flex items-center justify-center flex-shrink-0">
            <svg width={size} height={size} className="transform -rotate-90">
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

              {/* Dynamic Animated Progress Arc */}
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
                className="transition-all duration-500 ease-linear"
                style={{
                  filter: `drop-shadow(0 0 8px ${theme.accentGlow})`
                }}
              />

              {/* Glowing leading thumb dot */}
              {progressPercent > 0 && progressPercent < 100 && (
                <circle
                  cx={dotX}
                  cy={dotY}
                  r={strokeWidth * 0.75}
                  fill="#ffffff"
                  style={{
                    filter: `drop-shadow(0 0 6px ${theme.accent})`
                  }}
                />
              )}
            </svg>

            {/* Inner Content within Ring */}
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
              <span
                className="text-[10px] font-mono font-bold tracking-wider uppercase opacity-70 mb-0.5"
                style={{ color: theme.accent }}
              >
                {modeLabels[mode].title}
              </span>

              <span
                className="text-4xl sm:text-5xl font-sans font-extrabold tracking-tight tabular-nums"
                style={{ color: theme.textPrimary }}
              >
                {formattedTime}
              </span>

              <div
                className="flex items-center gap-1 mt-1 px-2.5 py-0.5 rounded-full text-[10px] font-medium border"
                style={{
                  borderColor: theme.border,
                  backgroundColor: 'rgba(255,255,255,0.03)',
                  color: theme.textSecondary
                }}
              >
                <Timer className="w-2.5 h-2.5 opacity-70" />
                <span>{modeLabels[mode].subtitle}</span>
              </div>
            </div>
          </div>

          {/* Right Card: Daily Streak */}
          <div
            className="flex-1 flex flex-col items-center justify-center p-3 rounded-2xl border backdrop-blur-sm text-center min-w-0"
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
              className="text-xl sm:text-2xl font-bold font-sans tabular-nums mt-0.5"
              style={{ color: theme.textPrimary }}
            >
              {streakDays}
            </span>
            <span className="text-[9px] font-medium opacity-60 truncate max-w-full">
              {streakDays === 1 ? 'Day' : 'Days'}
            </span>
          </div>
        </div>

        {/* Primary Controls: START / PAUSE + RESET */}
        <div className="flex items-center justify-center gap-3 relative z-10 mb-5">
          <button
            onClick={onToggle}
            className="flex items-center justify-center gap-2 px-8 py-3 rounded-full font-bold text-sm tracking-wider uppercase shadow-xl transition-all duration-200 hover:scale-105 active:scale-95 cursor-pointer text-white"
            style={{
              backgroundColor: theme.accent,
              boxShadow: `0 4px 20px ${theme.accentGlow}`
            }}
          >
            {isRunning ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current ml-0.5" />}
            <span>{isRunning ? 'PAUSE' : 'START'}</span>
          </button>

          <button
            onClick={onReset}
            className="p-3 rounded-full border transition-all duration-200 hover:bg-white/10 hover:scale-105 active:scale-95 cursor-pointer"
            style={{
              borderColor: theme.border,
              backgroundColor: theme.cardBg,
              color: theme.textSecondary
            }}
            title="Reset Timer"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>

        {/* Mode Selector Pill Bar inspired by screenshot */}
        <div
          className="w-full flex items-center justify-between p-1.5 rounded-2xl border backdrop-blur-md relative z-10 text-xs font-medium"
          style={{
            borderColor: theme.border,
            backgroundColor: theme.cardBg
          }}
        >
          {/* Focus Tab */}
          <button
            onClick={() => onSwitchMode('focus')}
            className={`flex-1 py-1.5 px-2 rounded-xl flex items-center justify-center gap-1.5 transition-all text-center ${
              mode === 'focus' ? 'font-bold shadow-md' : 'opacity-60 hover:opacity-100'
            }`}
            style={{
              backgroundColor: mode === 'focus' ? theme.bgSecondary : 'transparent',
              color: mode === 'focus' ? theme.accent : theme.textSecondary
            }}
          >
            <Timer className="w-3.5 h-3.5" />
            <span className="text-[11px]">Focus {durations.focus}m</span>
          </button>

          {/* Short Break Tab */}
          <button
            onClick={() => onSwitchMode('shortBreak')}
            className={`flex-1 py-1.5 px-2 rounded-xl flex items-center justify-center gap-1.5 transition-all text-center ${
              mode === 'shortBreak' ? 'font-bold shadow-md' : 'opacity-60 hover:opacity-100'
            }`}
            style={{
              backgroundColor: mode === 'shortBreak' ? theme.bgSecondary : 'transparent',
              color: mode === 'shortBreak' ? theme.accent : theme.textSecondary
            }}
          >
            <Coffee className="w-3.5 h-3.5" />
            <span className="text-[11px]">Short {durations.shortBreak}m</span>
          </button>

          {/* Long Break Tab */}
          <button
            onClick={() => onSwitchMode('longBreak')}
            className={`flex-1 py-1.5 px-2 rounded-xl flex items-center justify-center gap-1.5 transition-all text-center ${
              mode === 'longBreak' ? 'font-bold shadow-md' : 'opacity-60 hover:opacity-100'
            }`}
            style={{
              backgroundColor: mode === 'longBreak' ? theme.bgSecondary : 'transparent',
              color: mode === 'longBreak' ? theme.accent : theme.textSecondary
            }}
          >
            <Armchair className="w-3.5 h-3.5" />
            <span className="text-[11px]">Long {durations.longBreak}m</span>
          </button>

          {/* Custom Duration Toggle */}
          <button
            onClick={() => setShowCustomAdjuster((v) => !v)}
            className={`p-1.5 rounded-xl border transition-all ${
              showCustomAdjuster ? 'opacity-100' : 'opacity-60 hover:opacity-100'
            }`}
            style={{
              borderColor: showCustomAdjuster ? theme.accent : 'transparent',
              color: theme.textSecondary
            }}
            title="Adjust Current Interval"
          >
            <Sliders className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Custom Duration Inline Adjuster */}
        {showCustomAdjuster && (
          <div
            className="w-full mt-2 p-2 rounded-xl border flex items-center justify-between text-xs font-mono animate-ambient"
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
                className="p-1 rounded-lg border hover:bg-white/10"
                style={{ borderColor: theme.border }}
              >
                <Minus className="w-3 h-3" />
              </button>
              <span className="font-bold tabular-nums" style={{ color: theme.textPrimary }}>
                {durations[mode]} min
              </span>
              <button
                onClick={() => onAdjustDuration(5)}
                className="p-1 rounded-lg border hover:bg-white/10"
                style={{ borderColor: theme.border }}
              >
                <Plus className="w-3 h-3" />
              </button>
            </div>
          </div>
        )}

        {/* Motivational Footer */}
        <p
          className="text-[10px] font-sans tracking-wide opacity-50 mt-4 text-center"
          style={{ color: theme.textSecondary }}
        >
          Linked to: <span className="font-bold underline">{activeGoal.title}</span>
        </p>
      </div>
    </div>
  );
};
