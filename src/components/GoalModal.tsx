import React, { useState } from 'react';
import { Goal, CalendarType } from '../types/goal';
import { ThemeColors } from '../types/theme';
import { bsToAd, adToBs } from '../services/bs-converter';
import { X, Trash2 } from 'lucide-react';

interface GoalModalProps {
  isOpen: boolean;
  initialGoal?: Goal;
  canDelete: boolean;
  theme: ThemeColors;
  onClose: () => void;
  onSave: (goalData: Partial<Goal>) => void;
  onDelete?: () => void;
}

export const GoalModal: React.FC<GoalModalProps> = ({
  isOpen,
  initialGoal,
  canDelete,
  theme,
  onClose,
  onSave,
  onDelete
}) => {
  if (!isOpen) return null;

  const [title, setTitle] = useState(initialGoal?.title || '');
  const [calendarType, setCalendarType] = useState<CalendarType>(initialGoal?.calendarType || 'AD');

  // AD Date fields
  const initialDeadline = initialGoal ? new Date(initialGoal.deadline) : new Date(Date.now() + 90 * 86400000);
  const [adDateStr, setAdDateStr] = useState(initialDeadline.toISOString().slice(0, 16));

  // BS Date fields
  const initialBS = adToBs(initialDeadline);
  const [bsYear, setBsYear] = useState(initialBS.year);
  const [bsMonth, setBsMonth] = useState(initialBS.month);
  const [bsDay, setBsDay] = useState(initialBS.day);

  // Optional Start Date
  const [hasCustomStart, setHasCustomStart] = useState(Boolean(initialGoal?.startedAt));
  const [startedAtStr, setStartedAtStr] = useState(
    initialGoal?.startedAt
      ? new Date(initialGoal.startedAt).toISOString().slice(0, 16)
      : new Date().toISOString().slice(0, 16)
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    let computedDeadlineIso = new Date(adDateStr).toISOString();

    if (calendarType === 'BS') {
      const convertedAD = bsToAd(Number(bsYear), Number(bsMonth), Number(bsDay));
      computedDeadlineIso = convertedAD.toISOString();
    }

    onSave({
      title: title.trim(),
      deadline: computedDeadlineIso,
      startedAt: hasCustomStart ? new Date(startedAtStr).toISOString() : new Date().toISOString(),
      calendarType
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md">
      <div
        className="w-full max-w-lg rounded-2xl p-6 border shadow-2xl relative overflow-hidden"
        style={{
          backgroundColor: theme.bgSecondary,
          borderColor: theme.border,
          color: theme.textPrimary
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b" style={{ borderColor: theme.border }}>
          <h2 className="text-xl font-cinzel font-bold" style={{ color: theme.textPrimary }}>
            {initialGoal ? 'Edit Goal Deadline' : 'Set New Meaningful Goal'}
          </h2>
          <button onClick={onClose} className="p-1 rounded-full hover:bg-white/10" style={{ color: theme.textSecondary }}>
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4 font-sans text-sm">
          {/* Goal Title */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider mb-1" style={{ color: theme.textSecondary }}>
              What are you trying to achieve?
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Defend PhD Thesis / Ship Version 1.0"
              className="w-full px-3.5 py-2.5 rounded-lg border bg-black/20 focus:outline-none focus:ring-2 font-medium"
              style={{
                borderColor: theme.border,
                color: theme.textPrimary
              }}
            />
          </div>

          {/* Calendar System Switch */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider mb-1" style={{ color: theme.textSecondary }}>
              Deadline Calendar System
            </label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setCalendarType('AD')}
                className={`flex-1 py-2 rounded-lg text-xs font-bold border transition-all ${
                  calendarType === 'AD' ? 'shadow-md' : 'opacity-60'
                }`}
                style={{
                  borderColor: calendarType === 'AD' ? theme.accent : theme.border,
                  backgroundColor: calendarType === 'AD' ? theme.cardBg : 'transparent',
                  color: calendarType === 'AD' ? theme.accent : theme.textSecondary
                }}
              >
                Gregorian (A.D.)
              </button>
              <button
                type="button"
                onClick={() => setCalendarType('BS')}
                className={`flex-1 py-2 rounded-lg text-xs font-bold border transition-all ${
                  calendarType === 'BS' ? 'shadow-md' : 'opacity-60'
                }`}
                style={{
                  borderColor: calendarType === 'BS' ? theme.accent : theme.border,
                  backgroundColor: calendarType === 'BS' ? theme.cardBg : 'transparent',
                  color: calendarType === 'BS' ? theme.accent : theme.textSecondary
                }}
              >
                Bikram Sambat (B.S.)
              </button>
            </div>
          </div>

          {/* Date Picker Input */}
          {calendarType === 'AD' ? (
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider mb-1" style={{ color: theme.textSecondary }}>
                Target Deadline (Date & Time)
              </label>
              <input
                type="datetime-local"
                required
                value={adDateStr}
                onChange={(e) => setAdDateStr(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-lg border bg-black/20 font-mono text-sm focus:outline-none"
                style={{ borderColor: theme.border, color: theme.textPrimary }}
              />
            </div>
          ) : (
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider mb-1" style={{ color: theme.textSecondary }}>
                Target Deadline (B.S. Year / Month / Day)
              </label>
              <div className="grid grid-cols-3 gap-2 font-mono">
                <input
                  type="number"
                  min="2000"
                  max="2100"
                  value={bsYear}
                  onChange={(e) => setBsYear(Number(e.target.value))}
                  placeholder="Year (e.g. 2083)"
                  className="px-3 py-2 rounded-lg border bg-black/20 text-center"
                  style={{ borderColor: theme.border, color: theme.textPrimary }}
                />
                <input
                  type="number"
                  min="1"
                  max="12"
                  value={bsMonth}
                  onChange={(e) => setBsMonth(Number(e.target.value))}
                  placeholder="Month (1-12)"
                  className="px-3 py-2 rounded-lg border bg-black/20 text-center"
                  style={{ borderColor: theme.border, color: theme.textPrimary }}
                />
                <input
                  type="number"
                  min="1"
                  max="32"
                  value={bsDay}
                  onChange={(e) => setBsDay(Number(e.target.value))}
                  placeholder="Day (1-32)"
                  className="px-3 py-2 rounded-lg border bg-black/20 text-center"
                  style={{ borderColor: theme.border, color: theme.textPrimary }}
                />
              </div>
            </div>
          )}

          {/* Optional Start Date Accordion */}
          <div className="pt-2">
            <label className="flex items-center gap-2 cursor-pointer text-xs font-medium" style={{ color: theme.textSecondary }}>
              <input
                type="checkbox"
                checked={hasCustomStart}
                onChange={(e) => setHasCustomStart(e.target.checked)}
                className="rounded border-gray-600 accent-amber-500"
              />
              <span>Goal already in progress (custom start date)</span>
            </label>
            {hasCustomStart && (
              <div className="mt-2 pl-5">
                <input
                  type="datetime-local"
                  value={startedAtStr}
                  onChange={(e) => setStartedAtStr(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border bg-black/20 font-mono text-xs focus:outline-none"
                  style={{ borderColor: theme.border, color: theme.textPrimary }}
                />
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-between pt-4 border-t" style={{ borderColor: theme.border }}>
            {canDelete && onDelete ? (
              <button
                type="button"
                onClick={() => {
                  if (confirm('Delete this goal from Time Warp?')) {
                    onDelete();
                    onClose();
                  }
                }}
                className="flex items-center gap-1 text-xs text-red-400 hover:text-red-300 font-medium"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete</span>
              </button>
            ) : <div />}

            <div className="flex gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-lg border text-xs font-semibold hover:bg-white/5"
                style={{ borderColor: theme.border, color: theme.textSecondary }}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-lg text-xs font-bold shadow-lg transition-transform active:scale-95"
                style={{ backgroundColor: theme.accent, color: theme.isDark ? '#000000' : '#ffffff' }}
              >
                Save Deadline
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
