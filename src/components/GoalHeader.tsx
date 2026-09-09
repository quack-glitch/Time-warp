import React from 'react';
import { Goal } from '../types/goal';
import { ThemeColors } from '../types/theme';
import { adToBs } from '../services/bs-converter';
import { Calendar, Sparkles, Edit3 } from 'lucide-react';

interface GoalHeaderProps {
  goal: Goal;
  theme: ThemeColors;
  onEdit: () => void;
}

export const GoalHeader: React.FC<GoalHeaderProps> = ({ goal, theme, onEdit }) => {
  const deadlineDate = new Date(goal.deadline);
  const formattedAD = new Intl.DateTimeFormat('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  }).format(deadlineDate).replace(' at ', ' · ');
  const formattedBS = adToBs(deadlineDate);

  return (
    <div className="flex flex-col items-center text-center px-4 w-full max-w-2xl mx-auto flex-shrink-0">
      {/* Category Tag */}
      <div
        className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-semibold tracking-wider uppercase mb-1.5 border backdrop-blur-md"
        style={{
          borderColor: theme.border,
          backgroundColor: theme.cardBg,
          color: theme.accent
        }}
      >
        <Sparkles className="w-2.5 h-2.5" />
        <span>Personal Milestone</span>
      </div>

      {/* Goal Title with Edit Trigger */}
      <div
        className="group relative inline-flex items-center justify-center cursor-pointer max-w-full"
        onClick={onEdit}
      >
        <h1
          className="text-xl sm:text-2xl md:text-3xl font-sans font-bold tracking-tight leading-snug transition-colors duration-200 line-clamp-2 px-2"
          style={{ color: theme.textPrimary }}
        >
          {goal.title}
        </h1>
        <button
          className="ml-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200 p-1 rounded-full hover:bg-white/10 flex-shrink-0"
          title="Edit Goal"
          aria-label="Edit Goal"
        >
          <Edit3 className="w-3.5 h-3.5" style={{ color: theme.textSecondary }} />
        </button>
      </div>

      {/* Dual Target Date Display (A.D. & B.S.) */}
      <div
        className="flex items-center flex-wrap justify-center gap-2 mt-1 text-xs font-medium"
        style={{ color: theme.textSecondary }}
      >
        <div className="flex items-center gap-1">
          <Calendar className="w-3 h-3 opacity-70" />
          <span>{formattedAD}</span>
        </div>
        <span className="opacity-30">•</span>
        <div className="flex items-center gap-1 text-[11px]" style={{ color: theme.accent }}>
          <span>{formattedBS.formattedEn}</span>
          <span className="opacity-70">({formattedBS.formattedNp})</span>
        </div>
      </div>
    </div>
  );
};
