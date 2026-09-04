import React, { useState, useEffect, useCallback } from 'react';
import { loadState, saveState, DEFAULT_INITIAL_GOAL } from './services/storage';
import { THEMES, ThemeId } from './types/theme';
import { Goal, TimeWarpState } from './types/goal';
import { useCountdown } from './hooks/useCountdown';
import { useIdle } from './hooks/useIdle';
import { usePomodoroTimer } from './hooks/usePomodoroTimer';
import { calculateStreak } from './services/streak';
import { audioEngine } from './services/audio';
import { HourglassCanvas } from './components/HourglassCanvas';
import { CountdownDisplay } from './components/CountdownDisplay';
import { GoalHeader } from './components/GoalHeader';
import { GoalSwitcher } from './components/GoalSwitcher';
import { ZenControls } from './components/ZenControls';
import { GoalModal } from './components/GoalModal';
import { BackupModal } from './components/BackupModal';
import { PomodoroModal } from './components/PomodoroModal';

export const App: React.FC = () => {
  const [appState, setAppState] = useState<TimeWarpState>(() => loadState());
  const [isGoalModalOpen, setIsGoalModalOpen] = useState(false);
  const [isBackupModalOpen, setIsBackupModalOpen] = useState(false);
  const [isPomodoroModalOpen, setIsPomodoroModalOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState<Goal | undefined>(undefined);
  const [manualZen, setManualZen] = useState(false);

  const handlePomodoroSessionCompleted = useCallback((mode: string) => {
    if (mode === 'focus') {
      setAppState((prev) => {
        const updatedGoals = prev.goals.map((g) =>
          g.id === prev.activeGoalId
            ? { ...g, pomodoroSessions: (g.pomodoroSessions || 0) + 1 }
            : g
        );
        const streakResult = calculateStreak(
          prev.pomodoroStreak?.lastActiveDate,
          prev.pomodoroStreak?.currentStreak || 0
        );
        return {
          ...prev,
          goals: updatedGoals,
          pomodoroStreak: streakResult
        };
      });
    }
  }, []);

  const pomodoro = usePomodoroTimer({
    soundEnabled: appState.soundEnabled,
    onSessionCompleted: handlePomodoroSessionCompleted
  });

  const theme = THEMES[appState.theme] || THEMES.void;
  const isIdle = useIdle(4000);

  // Active Zen mode is triggered by either idle timeout or manual 'Z' toggle
  const isZenActive = manualZen || isIdle;

  // Active Goal lookup
  const activeGoal =
    appState.goals.find((g) => g.id === appState.activeGoalId) ||
    appState.goals[0] ||
    DEFAULT_INITIAL_GOAL;

  // Real-time Countdown hook
  const countdown = useCountdown(activeGoal.startedAt, activeGoal.deadline, appState.soundEnabled);

  // Sync state to LocalStorage
  useEffect(() => {
    saveState(appState);
  }, [appState]);

  // Handle ambient sound engine start/stop
  useEffect(() => {
    if (appState.soundEnabled && !countdown.isExpired) {
      audioEngine.startSandWhisper();
      audioEngine.setVolume(appState.soundVolume);
    } else {
      audioEngine.stopSandWhisper();
    }

    const handleFirstGesture = () => {
      if (appState.soundEnabled && !countdown.isExpired) {
        audioEngine.startSandWhisper();
      }
    };
    window.addEventListener('click', handleFirstGesture, { once: true });
    window.addEventListener('keydown', handleFirstGesture, { once: true });
    return () => {
      window.removeEventListener('click', handleFirstGesture);
      window.removeEventListener('keydown', handleFirstGesture);
    };
  }, [appState.soundEnabled, appState.soundVolume, countdown.isExpired]);

  // Actions
  const cycleTheme = useCallback(() => {
    const themeKeys: ThemeId[] = [
      'parchment',
      'void',
      'neon',
      'solar',
      'cherry',
      'emerald',
      'frost'
    ];
    setAppState((prev) => {
      const curIdx = themeKeys.indexOf(prev.theme);
      const nextIdx = curIdx === -1 ? 0 : (curIdx + 1) % themeKeys.length;
      return { ...prev, theme: themeKeys[nextIdx] };
    });
  }, []);

  const toggleSound = useCallback(() => {
    setAppState((prev) => ({ ...prev, soundEnabled: !prev.soundEnabled }));
  }, []);

  const toggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  }, []);

  const toggleZenMode = useCallback(() => {
    setManualZen((prev) => !prev);
  }, []);

  // Keyboard Shortcuts: 'F' (Fullscreen), 'Z' (Zen Mode), 'Space' (Sound Toggle)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)) return;

      // Space: Toggle Sound
      if (e.code === 'Space' || e.key === ' ') {
        e.preventDefault();
        toggleSound();
      } else if (e.key === 'z' || e.key === 'Z') {
        toggleZenMode();
      } else if (e.key === 'f' || e.key === 'F') {
        toggleFullscreen();
      } else if (e.key === 't' || e.key === 'T') {
        cycleTheme();
      } else if (e.key === 'm' || e.key === 'M') {
        toggleSound();
      } else if (e.key === 'p' || e.key === 'P') {
        setIsPomodoroModalOpen((prev) => !prev);
      } else if (['1', '2', '3', '4', '5'].includes(e.key)) {
        const index = parseInt(e.key, 10) - 1;
        if (appState.goals[index]) {
          setAppState((prev) => ({ ...prev, activeGoalId: prev.goals[index].id }));
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [appState.goals, toggleSound, toggleZenMode, toggleFullscreen, cycleTheme]);

  const handleSelectGoal = (id: string) => {
    setAppState((prev) => ({ ...prev, activeGoalId: id }));
  };

  const handleSaveGoal = (goalData: Partial<Goal>) => {
    if (editingGoal) {
      setAppState((prev) => ({
        ...prev,
        goals: prev.goals.map((g) => (g.id === editingGoal.id ? { ...g, ...goalData } : g))
      }));
    } else {
      const newGoal: Goal = {
        id: 'goal-' + Date.now(),
        title: goalData.title || 'Meaningful Life Goal',
        startedAt: goalData.startedAt || new Date().toISOString(),
        deadline: goalData.deadline || new Date(Date.now() + 90 * 86400000).toISOString(),
        calendarType: goalData.calendarType || 'AD',
        status: 'active',
        createdAt: new Date().toISOString()
      };
      setAppState((prev) => ({
        ...prev,
        goals: [...prev.goals.slice(0, 4), newGoal],
        activeGoalId: newGoal.id
      }));
    }
    setEditingGoal(undefined);
  };

  const handleDeleteGoal = () => {
    if (editingGoal && appState.goals.length > 1) {
      setAppState((prev) => {
        const filtered = prev.goals.filter((g) => g.id !== editingGoal.id);
        return {
          ...prev,
          goals: filtered,
          activeGoalId: filtered[0].id
        };
      });
    }
    setEditingGoal(undefined);
  };

  return (
    <div
      className="relative w-full min-h-screen h-screen flex flex-col justify-between overflow-x-hidden overflow-y-auto transition-colors duration-700"
      style={{ backgroundColor: theme.bg }}
    >
      {/* Dynamic Ambient Background Glow */}
      <div
        className="absolute inset-0 pointer-events-none opacity-30 blur-3xl transition-opacity duration-1000"
        style={{
          background: `radial-gradient(circle at 50% 45%, ${theme.sandGlow} 0%, transparent 65%)`
        }}
      />

      {/* TOP BAR: Goal Switcher & Zen Controls */}
      <header
        className={`relative z-20 pt-3 pb-2 px-4 sm:px-6 flex items-center justify-between flex-shrink-0 transition-opacity duration-700 ${
          isZenActive ? 'opacity-0 pointer-events-none' : 'opacity-100'
        }`}
      >
        <div className="flex items-center gap-2">
          <span className="font-cinzel font-bold text-xs tracking-widest uppercase opacity-80" style={{ color: theme.accent }}>
            TIME WARP
          </span>
        </div>

        <GoalSwitcher
          goals={appState.goals}
          activeGoalId={activeGoal.id}
          theme={theme}
          onSelect={handleSelectGoal}
          onNewGoal={() => {
            setEditingGoal(undefined);
            setIsGoalModalOpen(true);
          }}
        />

        <ZenControls
          theme={theme}
          soundEnabled={appState.soundEnabled}
          isPomodoroActive={pomodoro.isRunning}
          onToggleSound={toggleSound}
          onCycleTheme={cycleTheme}
          onToggleFullscreen={toggleFullscreen}
          onOpenBackup={() => setIsBackupModalOpen(true)}
          onOpenPomodoro={() => setIsPomodoroModalOpen(true)}
        />
      </header>

      {/* CENTER STAGE: Goal Title, Glass Hourglass, Bold Countdown */}
      <main className="relative z-10 flex-1 flex flex-col items-center justify-center px-4 max-w-4xl mx-auto w-full my-auto py-2">
        <GoalHeader
          goal={activeGoal}
          theme={theme}
          onEdit={() => {
            setEditingGoal(activeGoal);
            setIsGoalModalOpen(true);
          }}
        />

        <HourglassCanvas
          progressPercent={countdown.progressPercent}
          remainingPercent={countdown.remainingPercent}
          isExpired={countdown.isExpired}
          theme={theme}
        />

        <CountdownDisplay countdown={countdown} theme={theme} />
      </main>

      {/* BOTTOM FOOTER: Keyboard Hints */}
      <footer
        className={`relative z-20 pb-3 pt-1 px-4 sm:px-6 flex items-center justify-between text-[10px] sm:text-[11px] font-mono flex-shrink-0 transition-opacity duration-700 ${
          isZenActive ? 'opacity-0 pointer-events-none' : 'opacity-40 hover:opacity-100'
        }`}
        style={{ color: theme.textSecondary }}
      >
        <span>
          <kbd className="px-1 py-0.5 rounded bg-white/10 font-bold">P</kbd> Focus · <kbd className="px-1 py-0.5 rounded bg-white/10 font-bold">F</kbd> Fullscreen · <kbd className="px-1 py-0.5 rounded bg-white/10 font-bold">Z</kbd> Zen · <kbd className="px-1 py-0.5 rounded bg-white/10 font-bold">Space</kbd> Sound · <kbd className="px-1 py-0.5 rounded bg-white/10 font-bold">T</kbd> Theme
        </span>
        <span>Make time visible.</span>
      </footer>

      {/* Modals */}
      <GoalModal
        isOpen={isGoalModalOpen}
        initialGoal={editingGoal}
        canDelete={appState.goals.length > 1}
        theme={theme}
        onClose={() => {
          setIsGoalModalOpen(false);
          setEditingGoal(undefined);
        }}
        onSave={handleSaveGoal}
        onDelete={handleDeleteGoal}
      />

      <BackupModal
        isOpen={isBackupModalOpen}
        state={appState}
        theme={theme}
        onClose={() => setIsBackupModalOpen(false)}
        onRestore={(restored) => setAppState(restored)}
      />

      <PomodoroModal
        isOpen={isPomodoroModalOpen}
        theme={theme}
        activeGoal={activeGoal}
        streakDays={appState.pomodoroStreak?.currentStreak || 0}
        mode={pomodoro.mode}
        isRunning={pomodoro.isRunning}
        timeLeft={pomodoro.timeLeft}
        totalDuration={pomodoro.totalDuration}
        progressPercent={pomodoro.progressPercent}
        durations={pomodoro.durations}
        onClose={() => setIsPomodoroModalOpen(false)}
        onToggle={pomodoro.toggle}
        onReset={pomodoro.reset}
        onSwitchMode={pomodoro.switchMode}
        onAdjustDuration={pomodoro.adjustDuration}
      />
    </div>
  );
};
