import React from 'react';
import { ThemeColors } from '../types/theme';
import { Volume2, VolumeX, Palette, Maximize, Download } from 'lucide-react';

interface ZenControlsProps {
  theme: ThemeColors;
  soundEnabled: boolean;
  onToggleSound: () => void;
  onCycleTheme: () => void;
  onToggleFullscreen: () => void;
  onOpenBackup: () => void;
}

export const ZenControls: React.FC<ZenControlsProps> = ({
  theme,
  soundEnabled,
  onToggleSound,
  onCycleTheme,
  onToggleFullscreen,
  onOpenBackup
}) => {
  return (
    <div
      className="flex items-center gap-2 p-1.5 rounded-full border backdrop-blur-md transition-all duration-300 shadow-xl"
      style={{
        backgroundColor: theme.cardBg,
        borderColor: theme.border
      }}
    >
      {/* Theme cycle */}
      <button
        onClick={onCycleTheme}
        className="p-2 rounded-full hover:bg-white/10 transition-colors"
        title={`Current Theme: ${theme.name} (Press T to cycle)`}
        style={{ color: theme.textSecondary }}
      >
        <Palette className="w-4 h-4" />
      </button>

      {/* Procedural Audio toggle */}
      <button
        onClick={onToggleSound}
        className="p-2 rounded-full hover:bg-white/10 transition-colors"
        title={soundEnabled ? 'Mute Ambient Audio (M)' : 'Enable Ambient Sand & Tick Audio (M)'}
        style={{ color: soundEnabled ? theme.accent : theme.textSecondary }}
      >
        {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
      </button>

      {/* Fullscreen */}
      <button
        onClick={onToggleFullscreen}
        className="p-2 rounded-full hover:bg-white/10 transition-colors"
        title="Toggle Fullscreen (F)"
        style={{ color: theme.textSecondary }}
      >
        <Maximize className="w-4 h-4" />
      </button>

      {/* Backup / Export */}
      <button
        onClick={onOpenBackup}
        className="p-2 rounded-full hover:bg-white/10 transition-colors"
        title="Backup & Restore (JSON)"
        style={{ color: theme.textSecondary }}
      >
        <Download className="w-4 h-4" />
      </button>
    </div>
  );
};
