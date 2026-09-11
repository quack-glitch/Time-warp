import React from 'react';
import { formatTimerMs } from '../services/timer-format';

interface TimerDisplayProps {
  timeMs: number;
  isStopwatch?: boolean;
  className?: string;
  color?: string;
  size?: 'sm' | 'md' | 'lg' | 'hero';
}

export const TimerDisplay: React.FC<TimerDisplayProps> = React.memo(({
  timeMs,
  isStopwatch = false,
  className = '',
  color,
  size = 'hero'
}) => {
  const formatted = formatTimerMs(timeMs, isStopwatch);

  const sizeClasses = {
    sm: 'text-sm font-mono font-bold tabular-nums',
    md: 'text-xl sm:text-2xl font-mono font-bold tabular-nums',
    lg: 'text-3xl sm:text-4xl font-mono font-bold tracking-tight tabular-nums',
    hero: 'text-4xl sm:text-5xl font-mono font-extrabold tracking-tight tabular-nums'
  };

  return (
    <span
      className={`${sizeClasses[size]} ${className}`}
      style={color ? { color } : undefined}
      aria-label={`Timer display: ${formatted}`}
    >
      {formatted}
    </span>
  );
});
