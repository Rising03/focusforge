import React from 'react';
import { type HabitStreak } from '../services/analyticsService';

interface HabitStreakDisplayProps {
  habitStreaks: HabitStreak[];
  className?: string;
}

export const HabitStreakDisplay: React.FC<HabitStreakDisplayProps> = ({
  habitStreaks,
  className = ''
}) => {
  const getStreakColor = (consistency: number | null | undefined) => {
    const safeConsistency = consistency ?? 0;
    if (safeConsistency >= 80) return 'text-green-400 border-white/5';
    if (safeConsistency >= 60) return 'text-yellow-400 border-white/5';
    return 'text-red-400 border-white/5';
  };

  const getStreakIcon = (consistency: number | null | undefined) => {
    const safeConsistency = consistency ?? 0;
    if (safeConsistency >= 80) {
      return (
        <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
      );
    }
    if (safeConsistency >= 60) {
      return (
        <svg className="w-5 h-5 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
        </svg>
      );
    }
    return (
      <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
      </svg>
    );
  };

  const sortedHabits = [...habitStreaks].sort((a, b) => (b.consistency_percentage ?? 0) - (a.consistency_percentage ?? 0));

  if (habitStreaks.length === 0) {
    return (
      <div className={`border border-white/5 rounded-lg p-6 ${className}`}>
        <h3 className="text-lg font-medium text-white mb-4">Habit Streaks</h3>
        <div className="text-center py-8">
          <svg className="mx-auto h-12 w-12 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-white">No habits tracked yet</h3>
          <p className="mt-1 text-sm text-slate-400">Start building habits to see your streaks here.</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`border border-white/5 rounded-lg p-6 ${className}`}>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-medium text-white">Habit Streaks</h3>
          <p className="text-sm text-slate-400">Track your consistency and build momentum</p>
        </div>
        
        {/* Summary Stats */}
        <div className="text-right">
          <p className="text-sm text-slate-400">
            {habitStreaks.filter(h => h.consistency_percentage >= 70).length} strong habits
          </p>
          <p className="text-xs text-slate-500">
            {Math.round(habitStreaks.reduce((sum, h) => sum + (h.consistency_percentage ?? 0), 0) / habitStreaks.length)}% avg consistency
          </p>
        </div>
      </div>

      <div className="space-y-4">
        {sortedHabits.map((habit) => (
          <div key={habit.habit_id} className="relative">
            <div className={`rounded-lg border p-4 ${getStreakColor(habit.consistency_percentage)}`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="flex-shrink-0 mr-3">
                    {getStreakIcon(habit.consistency_percentage)}
                  </div>
                  <div>
                    <h4 className="font-medium text-white">{habit.habit_name}</h4>
                    <p className="text-sm text-slate-400">
                      Current streak: {habit.current_streak ?? 0} days
                    </p>
                  </div>
                </div>
                
                <div className="text-right">
                  <div className="text-lg font-bold text-white">
                    {(habit.consistency_percentage ?? 0).toFixed(0)}%
                  </div>
                  <div className="text-xs text-slate-400">
                    Best: {habit.longest_streak ?? 0} days
                  </div>
                </div>
              </div>
              
              {/* Progress Bar */}
              <div className="mt-3">
                <div className="flex items-center justify-between text-xs mb-1 text-slate-400">
                  <span>Consistency</span>
                  <span>{(habit.consistency_percentage ?? 0).toFixed(1)}%</span>
                </div>
                <div className="w-full bg-white/5 rounded-full h-2">
                  <div 
                    className={`h-2 rounded-full transition-all duration-300 ${
                      (habit.consistency_percentage ?? 0) >= 80 ? 'bg-green-500' :
                      (habit.consistency_percentage ?? 0) >= 60 ? 'bg-yellow-500' : 'bg-red-500'
                    }`}
                    style={{ width: `${Math.min(habit.consistency_percentage ?? 0, 100)}%` }}
                  />
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Insights */}
      <div className="mt-6 pt-4 border-t border-white/5">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div className="text-center">
            <div className="text-lg font-bold text-green-400">
              {habitStreaks.filter(h => (h.consistency_percentage ?? 0) >= 80).length}
            </div>
            <div className="text-slate-400">Strong Habits</div>
            <div className="text-xs text-slate-500">≥80% consistency</div>
          </div>
          
          <div className="text-center">
            <div className="text-lg font-bold text-yellow-400">
              {habitStreaks.filter(h => (h.consistency_percentage ?? 0) >= 60 && (h.consistency_percentage ?? 0) < 80).length}
            </div>
            <div className="text-slate-400">Building Habits</div>
            <div className="text-xs text-slate-500">60-79% consistency</div>
          </div>
          
          <div className="text-center">
            <div className="text-lg font-bold text-red-400">
              {habitStreaks.filter(h => (h.consistency_percentage ?? 0) < 60).length}
            </div>
            <div className="text-slate-400">Needs Focus</div>
            <div className="text-xs text-slate-500">&lt;60% consistency</div>
          </div>
        </div>
      </div>

      {/* Tips */}
      {habitStreaks.some(h => (h.consistency_percentage ?? 0) < 60) && (
        <div className="mt-4 p-3 border border-white/5 rounded-lg">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h4 className="text-sm font-medium text-white">Habit Building Tip</h4>
              <p className="text-sm text-slate-400 mt-1">
                Focus on your struggling habits using the "never miss twice" rule. 
                If you miss once, prioritize not missing again the next day.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};