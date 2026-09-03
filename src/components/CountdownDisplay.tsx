import React from 'react';
import { CountdownState } from '../types/countdown';
import { ThemeColors } from '../types/theme';

interface CountdownDisplayProps {
  countdown: CountdownState;
  theme: ThemeColors;
}

interface UnitItemProps {
  value: number;
  label: string;
  theme: ThemeColors;
  isHero?: boolean;
}

const UnitItem: React.FC<UnitItemProps> = ({ value, label, theme, isHero = false }) => {
  const formatted = String(value).padStart(2, '0');

  return (
    <div className="flex flex-col items-center mx-1.5 sm:mx-3">
      <div
        className={`font-mono font-bold tracking-tighter tabular-nums transition-transform duration-200 ${
          isHero ? 'text-4xl sm:text-6xl md:text-7xl' : 'text-2xl sm:text-4xl md:text-5xl'
        }`}
        style={{ color: theme.textPrimary }}
      >
        {formatted}
      </div>
      <div
        className="text-[10px] sm:text-xs tracking-widest uppercase mt-1 font-semibold"
        style={{ color: theme.textSecondary }}
      >
        {label}
      </div>
    </div>
  );
};

export const CountdownDisplay: React.FC<CountdownDisplayProps> = ({ countdown, theme }) => {
  if (countdown.isExpired) {
    return (
      <div className="flex flex-col items-center justify-center my-6 text-center animate-ambient">
        <div
          className="text-4xl sm:text-6xl font-cinzel font-bold tracking-tight mb-2"
          style={{ color: theme.accent }}
        >
          Time Expired
        </div>
        <p className="text-sm sm:text-base max-w-md font-sans" style={{ color: theme.textSecondary }}>
          The finite reservoir has drained completely. Take a moment to reflect on your journey toward this milestone.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center my-4 w-full">
      {/* Primary Hero Units: Days / Hours / Minutes / Seconds */}
      <div className="flex items-center justify-center flex-wrap">
        {countdown.years > 0 && (
          <UnitItem value={countdown.years} label="Years" theme={theme} />
        )}
        {countdown.months > 0 && (
          <UnitItem value={countdown.months} label="Months" theme={theme} />
        )}
        <UnitItem value={countdown.days} label="Days" theme={theme} isHero />
        <span className="text-2xl sm:text-5xl font-mono font-light opacity-30 mx-0.5">:</span>
        <UnitItem value={countdown.hours} label="Hours" theme={theme} isHero />
        <span className="text-2xl sm:text-5xl font-mono font-light opacity-30 mx-0.5">:</span>
        <UnitItem value={countdown.minutes} label="Minutes" theme={theme} isHero />
        <span className="text-2xl sm:text-5xl font-mono font-light opacity-30 mx-0.5">:</span>
        <UnitItem value={countdown.seconds} label="Seconds" theme={theme} isHero />
      </div>

      {/* Glanceable Metrics Footer */}
      <div className="flex items-center gap-4 sm:gap-8 mt-5 text-xs sm:text-sm font-mono">
        <div className="flex items-center gap-2">
          <span className="opacity-60" style={{ color: theme.textSecondary }}>Remaining:</span>
          <span className="font-bold tabular-nums" style={{ color: theme.accent }}>
            {countdown.remainingPercent.toFixed(1)}%
          </span>
        </div>
        <div className="w-1 h-1 rounded-full bg-white/20" />
        <div className="flex items-center gap-2">
          <span className="opacity-60" style={{ color: theme.textSecondary }}>Total Days:</span>
          <span className="font-bold tabular-nums" style={{ color: theme.textPrimary }}>
            {countdown.totalDays.toLocaleString()}
          </span>
        </div>
      </div>
    </div>
  );
};
