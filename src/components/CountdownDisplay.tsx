import React, { useState } from 'react';
import { CountdownState } from '../types/countdown';
import { ThemeColors } from '../types/theme';

interface CountdownDisplayProps {
  countdown: CountdownState;
  theme: ThemeColors;
}

export const CountdownDisplay: React.FC<CountdownDisplayProps> = ({ countdown, theme }) => {
  const [viewMode, setViewMode] = useState<'hero' | 'detailed'>('hero');

  if (countdown.isExpired) {
    return (
      <div className="flex flex-col items-center justify-center my-3 text-center animate-ambient">
        <div
          className="text-3xl sm:text-5xl font-cinzel font-bold tracking-tight mb-1"
          style={{ color: theme.accent }}
        >
          Time Expired
        </div>
        <p className="text-xs sm:text-sm max-w-md font-sans" style={{ color: theme.textSecondary }}>
          The finite reservoir has drained completely. Take a moment to reflect on your journey toward this milestone.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center my-1 w-full max-w-xl mx-auto flex-shrink-0">
      {/* MODE 1: HERO DAYS REMAINING (Clear, Instant, Unmistakable) */}
      {viewMode === 'hero' ? (
        <div className="flex flex-col items-center">
          {/* Hero Days Counter */}
          <div className="flex items-baseline gap-2">
            <span
              className="text-5xl sm:text-6xl md:text-7xl font-sans font-extrabold tracking-tight tabular-nums"
              style={{ color: theme.textPrimary }}
            >
              {countdown.totalDays.toLocaleString()}
            </span>
            <span
              className="text-sm sm:text-base font-cinzel font-bold uppercase tracking-widest"
              style={{ color: theme.accent }}
            >
              Days Left
            </span>
          </div>

          {/* Live Ticking Time Pod: Hours, Minutes, Seconds */}
          <div
            className="flex items-center gap-2 mt-1 px-4 py-1.5 rounded-full border backdrop-blur-md text-xs sm:text-sm font-mono font-medium"
            style={{
              borderColor: theme.border,
              backgroundColor: theme.cardBg,
              color: theme.textSecondary
            }}
          >
            <span className="font-bold tabular-nums" style={{ color: theme.textPrimary }}>
              {String(countdown.hours).padStart(2, '0')}
            </span>
            <span className="opacity-40 text-[10px] uppercase">h</span>
            <span className="opacity-30">:</span>
            <span className="font-bold tabular-nums" style={{ color: theme.textPrimary }}>
              {String(countdown.minutes).padStart(2, '0')}
            </span>
            <span className="opacity-40 text-[10px] uppercase">m</span>
            <span className="opacity-30">:</span>
            <span className="font-bold tabular-nums" style={{ color: theme.accent }}>
              {String(countdown.seconds).padStart(2, '0')}
            </span>
            <span className="opacity-40 text-[10px] uppercase">s</span>
          </div>
        </div>
      ) : (
        /* MODE 2: MULTI-UNIT CARDS (For users who prefer discrete breakdown) */
        <div className="flex items-center justify-center gap-2 sm:gap-3 flex-wrap">
          {countdown.years > 0 && (
            <div
              className="flex flex-col items-center px-3 py-1.5 rounded-xl border"
              style={{ borderColor: theme.border, backgroundColor: theme.cardBg }}
            >
              <span className="text-2xl sm:text-3xl font-bold font-sans tabular-nums" style={{ color: theme.textPrimary }}>
                {countdown.years}
              </span>
              <span className="text-[9px] uppercase tracking-wider font-semibold opacity-60">Years</span>
            </div>
          )}
          {countdown.months > 0 && (
            <div
              className="flex flex-col items-center px-3 py-1.5 rounded-xl border"
              style={{ borderColor: theme.border, backgroundColor: theme.cardBg }}
            >
              <span className="text-2xl sm:text-3xl font-bold font-sans tabular-nums" style={{ color: theme.textPrimary }}>
                {countdown.months}
              </span>
              <span className="text-[9px] uppercase tracking-wider font-semibold opacity-60">Months</span>
            </div>
          )}
          <div
            className="flex flex-col items-center px-3 py-1.5 rounded-xl border"
            style={{ borderColor: theme.border, backgroundColor: theme.cardBg }}
          >
            <span className="text-2xl sm:text-3xl font-bold font-sans tabular-nums" style={{ color: theme.textPrimary }}>
              {countdown.days}
            </span>
            <span className="text-[9px] uppercase tracking-wider font-semibold opacity-60">Days</span>
          </div>
          <div
            className="flex flex-col items-center px-3 py-1.5 rounded-xl border"
            style={{ borderColor: theme.border, backgroundColor: theme.cardBg }}
          >
            <span className="text-2xl sm:text-3xl font-bold font-sans tabular-nums" style={{ color: theme.textPrimary }}>
              {String(countdown.hours).padStart(2, '0')}
            </span>
            <span className="text-[9px] uppercase tracking-wider font-semibold opacity-60">Hours</span>
          </div>
          <div
            className="flex flex-col items-center px-3 py-1.5 rounded-xl border"
            style={{ borderColor: theme.border, backgroundColor: theme.cardBg }}
          >
            <span className="text-2xl sm:text-3xl font-bold font-sans tabular-nums" style={{ color: theme.textPrimary }}>
              {String(countdown.minutes).padStart(2, '0')}
            </span>
            <span className="text-[9px] uppercase tracking-wider font-semibold opacity-60">Mins</span>
          </div>
          <div
            className="flex flex-col items-center px-3 py-1.5 rounded-xl border"
            style={{ borderColor: theme.border, backgroundColor: theme.cardBg }}
          >
            <span className="text-2xl sm:text-3xl font-bold font-sans tabular-nums" style={{ color: theme.accent }}>
              {String(countdown.seconds).padStart(2, '0')}
            </span>
            <span className="text-[9px] uppercase tracking-wider font-semibold opacity-60">Secs</span>
          </div>
        </div>
      )}

      {/* Glanceable Metrics & View Toggle */}
      <div className="flex items-center gap-4 mt-2 text-xs font-mono">
        <div className="flex items-center gap-1.5">
          <span className="opacity-60" style={{ color: theme.textSecondary }}>Remaining:</span>
          <span className="font-bold tabular-nums" style={{ color: theme.accent }}>
            {countdown.remainingPercent.toFixed(1)}%
          </span>
        </div>
        <span className="opacity-30">•</span>
        <button
          onClick={() => setViewMode((m) => (m === 'hero' ? 'detailed' : 'hero'))}
          className="underline underline-offset-4 opacity-50 hover:opacity-100 transition-opacity cursor-pointer"
          style={{ color: theme.textSecondary }}
        >
          {viewMode === 'hero' ? 'Show Units Breakdown' : 'Show Total Days Hero'}
        </button>
      </div>
    </div>
  );
};
