import React, { useState, useEffect } from 'react';
import { habitService } from '../services/habitService';
import { 
  TodayHabitsResponse,
  LogHabitCompletionRequest,
  HabitCompletionFormData
} from '../types/habit';

interface HabitTrackerProps {
  onHabitUpdate?: (todayHabits: TodayHabitsResponse) => void;
}

export const HabitTracker: React.FC<HabitTrackerProps> = ({ onHabitUpdate }) => {
  const [todayHabits, setTodayHabits] = useState<TodayHabitsResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expandedHabit, setExpandedHabit] = useState<string | null>(null);
  const [completionForms, setCompletionForms] = useState<Record<string, HabitCompletionFormData>>({});

  useEffect(() => {
    loadTodayHabits();
  }, []);

  useEffect(() => {
    if (todayHabits && onHabitUpdate) {
      onHabitUpdate(todayHabits);
    }
  }, [todayHabits, onHabitUpdate]);

  const loadTodayHabits = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const data = await habitService.getTodayHabits();
      setTodayHabits(data);
      
      // Initialize completion forms
      const forms: Record<string, HabitCompletionFormData> = {};
      data.habits.forEach(({ habit, completed_today, quality_today, notes_today }) => {
        forms[habit.id] = {
          completed: completed_today,
          quality: quality_today || '',
          notes: notes_today || ''
        };
      });
      setCompletionForms(forms);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to load today\'s habits');
    } finally {
      setIsLoading(false);
    }
  };

  const handleHabitCompletion = async (habitId: string, completed: boolean) => {
    setError(null);
    
    try {
      const form = completionForms[habitId];
      const request: LogHabitCompletionRequest = {
        habit_id: habitId,
        date: habitService.formatDate(new Date()),
        completed,
        quality: form?.quality && form.quality !== '' ? form.quality as 'excellent' | 'good' | 'poor' : undefined,
        notes: form?.notes?.trim() || undefined
      };

      await habitService.logHabitCompletion(request);
      
      // Reload today's habits to get updated data
      await loadTodayHabits();
      
      // Collapse the expanded form if it was open
      if (expandedHabit === habitId) {
        setExpandedHabit(null);
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to update habit completion');
    }
  };

  const updateCompletionForm = (habitId: string, field: keyof HabitCompletionFormData, value: any) => {
    setCompletionForms(prev => ({
      ...prev,
      [habitId]: {
        ...prev[habitId],
        [field]: value
      }
    }));
  };

  const toggleExpanded = (habitId: string) => {
    setExpandedHabit(expandedHabit === habitId ? null : habitId);
  };

  if (isLoading) {
    return (
      <div className="border border-white/5 rounded-lg p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-white/5 rounded w-1/3 mb-6"></div>
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="flex items-center space-x-3">
                <div className="h-5 w-5 bg-white/5 rounded"></div>
                <div className="h-4 bg-white/5 rounded flex-1"></div>
                <div className="h-6 w-16 bg-white/5 rounded"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!todayHabits) {
    return (
      <div className="border border-white/5 rounded-lg p-6">
        <h2 className="text-2xl font-bold text-white mb-4">Today's Habits</h2>
        <p className="text-slate-400">No habits found. Create your first habit to get started.</p>
      </div>
    );
  }

  const completionPercentage = todayHabits.total_habits > 0 
    ? Math.round((todayHabits.completed_count / todayHabits.total_habits) * 100)
    : 0;

  return (
    <div className="border border-white/5 rounded-lg">
      <div className="p-6">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-2xl font-bold text-white">Today's Habits</h2>
          <div className="text-right">
            <div className="text-3xl font-bold text-white">
              {todayHabits.completed_count}/{todayHabits.total_habits}
            </div>
            <div className="text-sm text-slate-400">
              {completionPercentage}% complete
            </div>
          </div>
        </div>

        {error && (
          <div className="mb-6 p-4 border border-white/10 rounded-lg">
            <p className="text-sm text-slate-400">{error}</p>
          </div>
        )}

        {/* Progress bar */}
        <div className="mb-8">
          <div className="flex justify-between text-sm text-slate-400 mb-2">
            <span>Daily Progress</span>
            <span>{completionPercentage}%</span>
          </div>
          <div className="w-full bg-white/5 rounded-full h-1">
            <div 
              className="bg-white h-1 rounded-full transition-all duration-300"
              style={{ width: `${completionPercentage}%` }}
            ></div>
          </div>
        </div>

        {/* Habits list */}
        <div className="space-y-3">
          {todayHabits.habits.map(({ habit, completed_today, quality_today, notes_today }) => {
            const form = completionForms[habit.id] || { completed: completed_today, quality: quality_today || '', notes: notes_today || '' };
            const isExpanded = expandedHabit === habit.id;
            
            return (
              <div key={habit.id} className="border border-white/5 rounded-lg">
                <div className="p-4">
                  <div className="flex items-center space-x-3">
                    {/* Completion checkbox */}
                    <button
                      onClick={() => handleHabitCompletion(habit.id, !form.completed)}
                      className={`flex-shrink-0 w-6 h-6 rounded border flex items-center justify-center transition-colors ${
                        form.completed
                          ? 'bg-white border-white text-slate-950'
                          : 'border-white/20 hover:border-white/40'
                      }`}
                    >
                      {form.completed && (
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      )}
                    </button>

                    {/* Habit info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2">
                        <span className="text-lg">{habitService.getHabitIcon(habit.name)}</span>
                        <h3 className={`font-medium ${form.completed ? 'text-slate-500 line-through' : 'text-white'}`}>
                          {habit.name}
                        </h3>
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border border-white/10 text-slate-400">
                          {habitService.formatFrequency(habit.frequency)}
                        </span>
                      </div>
                      
                      {habit.description && (
                        <p className="text-sm text-slate-400 mt-1">{habit.description}</p>
                      )}
                      
                      {habit.cue && (
                        <p className="text-xs text-slate-500 mt-1">
                          <span className="font-medium">Cue:</span> {habit.cue}
                        </p>
                      )}
                    </div>

                    {/* Quality indicator */}
                    {form.completed && quality_today && (
                      <div className="px-2 py-1 rounded text-xs font-medium border border-white/10 text-slate-400">
                        {quality_today}
                      </div>
                    )}

                    {/* Expand button */}
                    <button
                      onClick={() => toggleExpanded(habit.id)}
                      className="flex-shrink-0 p-1 text-slate-500 hover:text-white transition-colors"
                    >
                      <svg 
                        className={`w-5 h-5 transition-transform ${isExpanded ? 'rotate-180' : ''}`} 
                        fill="none" 
                        stroke="currentColor" 
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                  </div>

                  {/* Expanded form */}
                  {isExpanded && (
                    <div className="mt-4 pt-4 border-t border-white/5 space-y-3">
                      {/* Quality selection */}
                      <div>
                        <label className="block text-sm font-medium text-slate-400 mb-2">
                          Quality (optional)
                        </label>
                        <select
                          value={form.quality}
                          onChange={(e) => updateCompletionForm(habit.id, 'quality', e.target.value)}
                          className="w-full px-3 py-2 bg-transparent border border-white/10 rounded-lg text-white focus:outline-none focus:border-white/20 text-sm"
                        >
                          <option value="">Select quality...</option>
                          <option value="excellent">Excellent - Exceeded expectations</option>
                          <option value="good">Good - Met expectations</option>
                          <option value="poor">Poor - Below expectations</option>
                        </select>
                      </div>

                      {/* Notes */}
                      <div>
                        <label className="block text-sm font-medium text-slate-400 mb-2">
                          Notes (optional)
                        </label>
                        <textarea
                          value={form.notes}
                          onChange={(e) => updateCompletionForm(habit.id, 'notes', e.target.value)}
                          rows={2}
                          className="w-full px-3 py-2 bg-transparent border border-white/10 rounded-lg text-white focus:outline-none focus:border-white/20 text-sm placeholder-slate-500"
                          placeholder="How did it go? Any insights or challenges?"
                        />
                      </div>

                      {/* Action buttons */}
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleHabitCompletion(habit.id, true)}
                          disabled={form.completed}
                          className="flex-1 bg-white text-slate-950 py-2 px-3 rounded-lg hover:bg-slate-100 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm font-medium"
                        >
                          {form.completed ? 'Completed' : 'Mark Complete'}
                        </button>
                        
                        {form.completed && (
                          <button
                            onClick={() => handleHabitCompletion(habit.id, false)}
                            className="flex-1 border border-white/10 text-white py-2 px-3 rounded-lg hover:border-white/20 focus:outline-none transition-colors text-sm font-medium"
                          >
                            Mark Incomplete
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {todayHabits.habits.length === 0 && (
          <div className="text-center py-12">
            <div className="text-slate-600 text-4xl mb-3">📋</div>
            <p className="text-white font-medium">No habits for today</p>
            <p className="text-sm text-slate-400 mt-1">Create your first habit to get started</p>
          </div>
        )}

        {/* Motivational message */}
        {todayHabits.habits.length > 0 && (
          <div className="mt-8 p-4 border border-white/10 rounded-lg">
            <p className="text-sm text-slate-400">
              {completionPercentage === 100 
                ? "Amazing! You've completed all your habits for today."
                : completionPercentage >= 75
                ? "You're doing great. Keep up the momentum."
                : completionPercentage >= 50
                ? "Good progress. You're halfway there."
                : completionPercentage > 0
                ? "Every habit counts. Keep building your discipline."
                : "Ready to tackle your habits? Start with just one."
              }
            </p>
          </div>
        )}
      </div>
    </div>
  );
};