import React from 'react';
import { ThemeColors } from '../types/theme';
import { Volume2, VolumeX, Palette, Maximize, Download, Timer } from 'lucide-react';

interface ZenControlsProps {
  theme: ThemeColors;
  soundEnabled: boolean;
  isPomodoroActive?: boolean;
  onToggleSound: () => void;
  onCycleTheme: () => void;
  onToggleFullscreen: () => void;
  onOpenBackup: () => void;
  onOpenPomodoro: () => void;
}

export const ZenControls: React.FC<ZenControlsProps> = ({
  theme,
  soundEnabled,
  isPomodoroActive = false,
  onToggleSound,
  onCycleTheme,
  onToggleFullscreen,
  onOpenBackup,
  onOpenPomodoro
}) => {
  return (
    <div
      className="flex items-center gap-2 p-1.5 rounded-full border backdrop-blur-md transition-all duration-300 shadow-xl"
      style={{
        backgroundColor: theme.cardBg,
        borderColor: theme.border
      }}
    >
      {/* Pomodoro Focus Timer */}
      <button
        onClick={onOpenPomodoro}
        className="relative p-2 rounded-full hover:bg-white/10 transition-colors cursor-pointer"
        title="Pomodoro Focus Timer (P)"
        aria-label="Pomodoro Focus Timer"
        style={{ color: isPomodoroActive ? theme.accent : theme.textSecondary }}
      >
        <Timer className="w-4 h-4" />
        {isPomodoroActive && (
          <span
            className="absolute top-1 right-1 w-2 h-2 rounded-full animate-ping"
            style={{ backgroundColor: theme.accent }}
          />
        )}
        {isPomodoroActive && (
          <span
            className="absolute top-1 right-1 w-2 h-2 rounded-full"
            style={{ backgroundColor: theme.accent }}
          />
        )}
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

      {/* Procedural Audio toggle */}
      <button
        onClick={onToggleSound}
        className="p-2 rounded-full hover:bg-white/10 transition-colors cursor-pointer"
        title={soundEnabled ? 'Mute Ambient Audio (M)' : 'Enable Ambient Sand & Tick Audio (M)'}
        aria-label={soundEnabled ? 'Mute ambient audio' : 'Enable ambient audio'}
        style={{ color: soundEnabled ? theme.accent : theme.textSecondary }}
      >
        {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
      </button>

      {/* Fullscreen */}
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
