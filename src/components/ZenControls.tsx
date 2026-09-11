import React from 'react';
import { ThemeColors } from '../types/theme';
import { FocusMode, TimerStatus } from '../types/focus';
import { Volume2, VolumeX, Palette, Maximize, Download, Timer } from 'lucide-react';

interface ZenControlsProps {
  theme: ThemeColors;
  soundEnabled: boolean;
  timerMode?: FocusMode;
  timerStatus?: TimerStatus;
  formattedTime?: string;
  onToggleSound: () => void;
  onCycleTheme: () => void;
  onToggleFullscreen: () => void;
  onOpenBackup: () => void;
  onOpenPomodoro: () => void;
}

export const ZenControls: React.FC<ZenControlsProps> = ({
  theme,
  soundEnabled,
  timerMode,
  timerStatus = 'idle',
  formattedTime = '',
  onToggleSound,
  onCycleTheme,
  onToggleFullscreen,
  onOpenBackup,
  onOpenPomodoro
}) => {
  const isTimerActive = timerStatus === 'running' || timerStatus === 'paused';
  const isRunning = timerStatus === 'running';
  const isPaused = timerStatus === 'paused';
  const isCompleted = timerStatus === 'completed';

  let activeIndicatorText = '';
  if (isRunning) {
    if (timerMode === 'focus') activeIndicatorText = `● FOCUS ${formattedTime}`;
    else if (timerMode === 'shortBreak' || timerMode === 'longBreak') activeIndicatorText = `● BREAK ${formattedTime}`;
    else if (timerMode === 'stopwatch') activeIndicatorText = `● TIMER ${formattedTime}`;
  } else if (isPaused) {
    if (timerMode === 'focus') activeIndicatorText = `Ⅱ FOCUS ${formattedTime}`;
    else if (timerMode === 'shortBreak' || timerMode === 'longBreak') activeIndicatorText = `Ⅱ BREAK ${formattedTime}`;
    else if (timerMode === 'stopwatch') activeIndicatorText = `Ⅱ TIMER ${formattedTime}`;
  } else if (isCompleted) {
    activeIndicatorText = '✓ COMPLETE';
  }

  return (
    <div
      className="flex items-center gap-1.5 sm:gap-2 p-1.5 rounded-full border backdrop-blur-md transition-all duration-300 shadow-xl"
      style={{
        backgroundColor: theme.cardBg,
        borderColor: theme.border
      }}
    >
      {/* Pomodoro Focus Companion Pill / Button */}
      <button
        onClick={onOpenPomodoro}
        className={`relative flex items-center gap-1.5 rounded-full hover:bg-white/10 transition-all cursor-pointer font-mono text-[10px] sm:text-[11px] font-bold ${
          activeIndicatorText ? 'px-2.5 py-1.5' : 'p-2'
        }`}
        title={`Focus Companion (P)${activeIndicatorText ? ` — ${activeIndicatorText}` : ''}`}
        aria-label={`Focus Companion${activeIndicatorText ? ` ${activeIndicatorText}` : ''}`}
        style={{ color: isTimerActive || isCompleted ? theme.accent : theme.textSecondary }}
      >
        <Timer className="w-4 h-4 flex-shrink-0" />
        {activeIndicatorText ? (
          <span className="tabular-nums tracking-wider whitespace-nowrap">
            {activeIndicatorText}
          </span>
        ) : isTimerActive ? (
          <>
            <span
              className="absolute top-1 right-1 w-2 h-2 rounded-full animate-ping"
              style={{ backgroundColor: theme.accent }}
            />
            <span
              className="absolute top-1 right-1 w-2 h-2 rounded-full"
              style={{ backgroundColor: theme.accent }}
            />
          </>
        ) : null}
      </button>

      {/* Theme cycle */}
      <button
        onClick={onCycleTheme}
        className="p-2 rounded-full hover:bg-white/10 transition-colors cursor-pointer"
        title={`Current Theme: ${theme.name} (Press T to cycle)`}
        aria-label={`Cycle theme, currently ${theme.name}`}
        style={{ color: theme.textSecondary }}
      >
        <Palette className="w-4 h-4" />
      </button>

      {/* Ambient Audio toggle */}
      <button
        onClick={onToggleSound}
        className="p-2 rounded-full hover:bg-white/10 transition-colors cursor-pointer"
        title={soundEnabled ? 'Mute Ambient Audio (M)' : 'Enable Ambient Sand & Tick Audio (M)'}
        aria-label={soundEnabled ? 'Mute ambient audio' : 'Enable ambient audio'}
        style={{ color: soundEnabled ? theme.accent : theme.textSecondary }}
      >
        {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
      </button>

      {/* Fullscreen toggle */}
      <button
        onClick={onToggleFullscreen}
        className="p-2 rounded-full hover:bg-white/10 transition-colors cursor-pointer"
        title="Toggle Fullscreen (F)"
        aria-label="Toggle Fullscreen"
        style={{ color: theme.textSecondary }}
      >
        <Maximize className="w-4 h-4" />
      </button>

      {/* Backup / Export */}
      <button
        onClick={onOpenBackup}
        className="p-2 rounded-full hover:bg-white/10 transition-colors cursor-pointer"
        title="Backup & Restore (JSON)"
        aria-label="Backup and restore data"
        style={{ color: theme.textSecondary }}
      >
        <Download className="w-4 h-4" />
      </button>
    </div>
  );
};
