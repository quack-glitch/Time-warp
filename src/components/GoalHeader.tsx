import React from 'react';
import { Goal } from '../types/goal';
import { ThemeColors } from '../types/theme';
import { adToBs } from '../services/bs-converter';
import { format } from 'date-fns';
import { Calendar, Sparkles, Edit3 } from 'lucide-react';

interface GoalHeaderProps {
  goal: Goal;
  theme: ThemeColors;
  onEdit: () => void;
}

export const GoalHeader: React.FC<GoalHeaderProps> = ({ goal, theme, onEdit }) => {
  const deadlineDate = new Date(goal.deadline);
  const formattedAD = format(deadlineDate, 'MMMM d, yyyy · h:mm a');
  const formattedBS = adToBs(deadlineDate);

  return (
    <div className="flex flex-col items-center text-center px-4 w-full max-w-2xl mx-auto">
      {/* Category / Purpose Tag */}
      <div
        className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-semibold tracking-wider uppercase mb-3 border backdrop-blur-md"
        style={{
          borderColor: theme.border,
          backgroundColor: theme.cardBg,
          color: theme.accent
        }}
      >
        <Sparkles className="w-3 h-3" />
        <span>Personal Milestone</span>
      </div>

      {/* Goal Title with Edit Prompt */}
      <div className="group relative inline-flex items-center justify-center cursor-pointer" onClick={onEdit}>
        <h1
          className="text-2xl sm:text-4xl md:text-5xl font-cinzel font-bold tracking-tight transition-colors duration-200"
          style={{ color: theme.textPrimary }}
        >
          {goal.title}
        </h1>
        <button
          className="ml-3 opacity-0 group-hover:opacity-100 transition-opacity duration-200 p-1.5 rounded-full hover:bg-white/10"
          title="Edit Goal"
        >
          <Edit3 className="w-4 h-4" style={{ color: theme.textSecondary }} />
        </button>
      </div>

      {/* Dual Target Date Display (A.D. & B.S.) */}
      <div
        className="flex items-center flex-wrap justify-center gap-2 sm:gap-4 mt-3 text-xs sm:text-sm font-medium"
        style={{ color: theme.textSecondary }}
      >
        <div className="flex items-center gap-1.5">
          <Calendar className="w-3.5 h-3.5 opacity-70" />
          <span>{formattedAD}</span>
        </div>
        <span className="opacity-30">•</span>
        <div className="flex items-center gap-1 text-xs" style={{ color: theme.accent }}>
          <span>{formattedBS.formattedEn}</span>
          <span className="opacity-70">({formattedBS.formattedNp})</span>
        </div>
      </div>
    </div>
  );
};
