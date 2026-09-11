/**
 * Pure helper to calculate and update daily focus streaks.
 * Uses local calendar dates to prevent timezone boundary bugs (e.g. Nepal UTC+5:45).
 */

export function formatLocalDate(date: Date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function calculateStreak(
  lastActiveDateStr: string | undefined,
  currentStreak: number = 0,
  today: Date = new Date()
): { currentStreak: number; lastActiveDate: string } {
  const todayStr = formatLocalDate(today);

  if (!lastActiveDateStr) {
    return { currentStreak: 1, lastActiveDate: todayStr };
  }

  if (lastActiveDateStr === todayStr) {
    return { currentStreak: Math.max(1, currentStreak), lastActiveDate: todayStr };
  }

  // Calculate day difference using calendar midnight dates in local time
  const lastParts = lastActiveDateStr.split('-').map(Number);
  if (lastParts.length !== 3 || lastParts.some(isNaN)) {
    return { currentStreak: 1, lastActiveDate: todayStr };
  }

  const lastDate = new Date(lastParts[0], lastParts[1] - 1, lastParts[2]);
  const currentDate = new Date(today.getFullYear(), today.getMonth(), today.getDate());

  const diffDays = Math.round((currentDate.getTime() - lastDate.getTime()) / (24 * 60 * 60 * 1000));

  if (diffDays === 1) {
    return { currentStreak: currentStreak + 1, lastActiveDate: todayStr };
  } else if (diffDays > 1) {
    // Streak broken, reset to 1
    return { currentStreak: 1, lastActiveDate: todayStr };
  }

  // If for some clock skew reason diffDays <= 0
  return { currentStreak: Math.max(1, currentStreak), lastActiveDate: todayStr };
}
