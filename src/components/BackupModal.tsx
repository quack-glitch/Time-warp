import React, { useState } from 'react';
import { TimeWarpState } from '../types/goal';
import { ThemeColors } from '../types/theme';
import { exportBackup, importBackup } from '../services/storage';
import { Download, Upload, X, AlertCircle } from 'lucide-react';

interface BackupModalProps {
  isOpen: boolean;
  state: TimeWarpState;
  theme: ThemeColors;
  onClose: () => void;
  onRestore: (restored: TimeWarpState) => void;
}

export const BackupModal: React.FC<BackupModalProps> = ({
  isOpen,
  state,
  theme,
  onClose,
  onRestore
}) => {
  if (!isOpen) return null;

  const [errorMsg, setErrorMsg] = useState('');

  const handleDownload = () => {
    const jsonStr = exportBackup(state);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `timewarp-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    setErrorMsg('');
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const restored = importBackup(text);
        onRestore(restored);
        onClose();
      } catch (err: unknown) {
        setErrorMsg((err as Error).message || 'Invalid backup JSON file');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md">
      <div
        className="w-full max-w-md rounded-2xl p-6 border shadow-2xl"
        style={{
          backgroundColor: theme.bgSecondary,
          borderColor: theme.border,
          color: theme.textPrimary
        }}
      >
        <div className="flex items-center justify-between pb-3 border-b" style={{ borderColor: theme.border }}>
          <h2 className="text-lg font-cinzel font-bold">Data & Backup</h2>
          <button onClick={onClose} className="p-1 rounded-full hover:bg-white/10" style={{ color: theme.textSecondary }}>
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="mt-4 space-y-4 text-xs font-sans">
          <p style={{ color: theme.textSecondary }}>
            Time Warp stores all goals 100% locally in your browser. Download a JSON backup to transfer goals across devices or keep safe.
          </p>

          <button
            onClick={handleDownload}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl font-bold border transition-all hover:scale-102"
            style={{
              borderColor: theme.accent,
              backgroundColor: theme.cardBg,
              color: theme.accent
            }}
          >
            <Download className="w-4 h-4" />
            <span>Export Backup (.JSON)</span>
          </button>

          <div className="relative">
            <label
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl font-semibold border border-dashed cursor-pointer hover:border-solid transition-all"
              style={{ borderColor: theme.border, color: theme.textSecondary }}
            >
              <Upload className="w-4 h-4" />
              <span>Import JSON Backup</span>
              <input type="file" accept=".json" onChange={handleFileUpload} className="hidden" />
            </label>
          </div>

          {errorMsg && (
            <div className="flex items-center gap-2 p-2.5 rounded-lg bg-red-900/30 text-red-300 text-xs">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
