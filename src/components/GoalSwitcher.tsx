import React from 'react';
import { Goal } from '../types/goal';
import { ThemeColors } from '../types/theme';
import { Plus } from 'lucide-react';

interface GoalSwitcherProps {
  goals: Goal[];
  activeGoalId: string;
  theme: ThemeColors;
  onSelect: (id: string) => void;
  onNewGoal: () => void;
}

export const GoalSwitcher: React.FC<GoalSwitcherProps> = ({
  goals,
  activeGoalId,
  theme,
  onSelect,
  onNewGoal
}) => {
  return (
    <div className="flex items-center justify-center gap-2 flex-wrap max-w-xl mx-auto px-4">
      {goals.map((goal, idx) => {
        const isActive = goal.id === activeGoalId;
        return (
          <button
            key={goal.id}
            onClick={() => onSelect(goal.id)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-200 border ${
              isActive
                ? 'shadow-lg scale-105 font-bold'
                : 'opacity-70 hover:opacity-100 hover:scale-102'
            }`}
            style={{
              borderColor: isActive ? theme.accent : theme.border,
              backgroundColor: isActive ? theme.cardBg : 'transparent',
              color: isActive ? theme.accent : theme.textSecondary
            }}
          >
            <span className="opacity-50 mr-1.5 font-mono">#{idx + 1}</span>
            <span className="truncate max-w-[120px] sm:max-w-[160px] inline-block align-bottom">
              {goal.title}
            </span>
          </button>
        );
      })}

      {goals.length < 5 && (
        <button
          onClick={onNewGoal}
          className="p-1.5 rounded-full border border-dashed hover:border-solid transition-all duration-200 opacity-60 hover:opacity-100"
          style={{ borderColor: theme.border, color: theme.textSecondary }}
          title="Add New Goal (Max 5)"
        >
          <Plus className="w-3.5 h-3.5" />
        </button>
      )}
    </div>
  );
};
