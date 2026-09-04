/**
 * Pure helper to calculate and update daily focus streaks
 */
export function calculateStreak(
  lastActiveDateStr: string | undefined,
  currentStreak: number = 0,
  today: Date = new Date()
): { currentStreak: number; lastActiveDate: string } {
  const todayStr = today.toISOString().slice(0, 10); // YYYY-MM-DD

  if (!lastActiveDateStr) {
    return { currentStreak: 1, lastActiveDate: todayStr };
  }

  if (lastActiveDateStr === todayStr) {
    return { currentStreak: Math.max(1, currentStreak), lastActiveDate: todayStr };
  }

  // Calculate day difference at midnight boundaries
  const last = new Date(lastActiveDateStr + 'T00:00:00Z').getTime();
  const current = new Date(todayStr + 'T00:00:00Z').getTime();
  const diffDays = Math.round((current - last) / (24 * 60 * 60 * 1000));

  if (diffDays === 1) {
    return { currentStreak: currentStreak + 1, lastActiveDate: todayStr };
  } else if (diffDays > 1) {
    // Streak broken, reset to 1
    return { currentStreak: 1, lastActiveDate: todayStr };
  }

  return { currentStreak: Math.max(1, currentStreak), lastActiveDate: todayStr };
}
