import React, { useState, useEffect } from 'react';
import { habitService } from '../services/habitService';
import { 
  HabitsListResponse,
  HabitResponse,
  CreateHabitRequest,
  UpdateHabitRequest,
  HabitFormData
} from '../types/habit';

interface HabitManagerProps {
  onHabitsUpdate?: (habits: HabitsListResponse) => void;
}

export const HabitManager: React.FC<HabitManagerProps> = ({ onHabitsUpdate }) => {
  const [habits, setHabits] = useState<HabitsListResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingHabit, setEditingHabit] = useState<HabitResponse | null>(null);
  const [formData, setFormData] = useState<HabitFormData>({
    name: '',
    description: '',
    frequency: 'daily',
    cue: '',
    reward: '',
    stacked_after: ''
  });

  useEffect(() => {
    loadHabits();
  }, []);

  useEffect(() => {
    if (habits && onHabitsUpdate) {
      onHabitsUpdate(habits);
    }
  }, [habits, onHabitsUpdate]);

  const loadHabits = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const data = await habitService.getUserHabits(true); // Include inactive habits
      setHabits(data);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to load habits');
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      frequency: 'daily',
      cue: '',
      reward: '',
      stacked_after: ''
    });
    setEditingHabit(null);
    setShowCreateForm(false);
  };

  const handleCreateHabit = () => {
    resetForm();
    setShowCreateForm(true);
  };

  const handleEditHabit = (habit: HabitResponse) => {
    setFormData({
      name: habit.habit.name,
      description: habit.habit.description || '',
      frequency: habit.habit.frequency,
      cue: habit.habit.cue || '',
      reward: habit.habit.reward || '',
      stacked_after: habit.habit.stacked_after || ''
    });
    setEditingHabit(habit);
    setShowCreateForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!formData.name.trim()) {
      setError('Habit name is required');
      return;
    }

    try {
      if (editingHabit) {
        // Update existing habit
        const request: UpdateHabitRequest = {
          name: formData.name.trim(),
          description: formData.description.trim() || undefined,
          frequency: formData.frequency,
          cue: formData.cue.trim() || undefined,
          reward: formData.reward.trim() || undefined,
          stacked_after: formData.stacked_after || undefined
        };

        await habitService.updateHabit(editingHabit.habit.id, request);
      } else {
        // Create new habit
        const request: CreateHabitRequest = {
          name: formData.name.trim(),
          description: formData.description.trim() || undefined,
          frequency: formData.frequency,
          cue: formData.cue.trim() || undefined,
          reward: formData.reward.trim() || undefined,
          stacked_after: formData.stacked_after || undefined
        };

        await habitService.createHabit(request);
      }

      resetForm();
      await loadHabits();
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to save habit');
    }
  };

  const handleDeleteHabit = async (habitId: string) => {
    if (!confirm('Are you sure you want to delete this habit? This action cannot be undone.')) {
      return;
    }

    setError(null);

    try {
      await habitService.deleteHabit(habitId);
      await loadHabits();
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to delete habit');
    }
  };

  const handleToggleActive = async (habit: HabitResponse) => {
    setError(null);

    try {
      const request: UpdateHabitRequest = {
        is_active: !habit.habit.is_active
      };

      await habitService.updateHabit(habit.habit.id, request);
      await loadHabits();
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to update habit status');
    }
  };

  const updateFormData = (field: keyof HabitFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const getStackableHabits = () => {
    if (!habits) return [];
    return habits.habits
      .filter(h => h.habit.is_active && h.habit.id !== editingHabit?.habit.id)
      .filter(h => h.current_streak >= 7 || h.completion_rate_30_days >= 70); // Only consistent habits
  };

  if (isLoading) {
    return (
      <div className="border border-white/5 rounded-lg p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-white/5 rounded w-1/3 mb-6"></div>
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="border border-white/5 rounded-lg p-4">
                <div className="h-4 bg-white/5 rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-white/5 rounded w-1/2"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="border border-white/5 rounded-lg">
      <div className="p-6">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-2xl font-bold text-white">Habit Manager</h2>
          <button
            onClick={handleCreateHabit}
            className="bg-white text-slate-950 px-4 py-2 rounded-lg hover:bg-slate-100 focus:outline-none transition-colors font-medium text-sm"
          >
            Create Habit
          </button>
        </div>

        {error && (
          <div className="mb-6 p-4 border border-white/10 rounded-lg">
            <p className="text-sm text-slate-400">{error}</p>
          </div>
        )}

        {/* Summary stats */}
        {habits && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <div className="border border-white/5 rounded-lg p-4">
              <div className="text-3xl font-bold text-white">{habits.total_active_habits}</div>
              <div className="text-sm text-slate-400 mt-1">Active Habits</div>
            </div>
            <div className="border border-white/5 rounded-lg p-4">
              <div className="text-3xl font-bold text-white">{habits.habits_completed_today}</div>
              <div className="text-sm text-slate-400 mt-1">Completed Today</div>
            </div>
            <div className="border border-white/5 rounded-lg p-4">
              <div className="text-3xl font-bold text-white">
                {Math.round(habits.overall_consistency)}%
              </div>
              <div className="text-sm text-slate-400 mt-1">Overall Consistency</div>
            </div>
          </div>
        )}

        {/* Create/Edit Form */}
        {showCreateForm && (
          <div className="mb-6 p-4 border border-white/5 rounded-lg">
            <h3 className="text-lg font-medium text-white mb-4">
              {editingHabit ? 'Edit Habit' : 'Create New Habit'}
            </h3>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-slate-400 mb-1">
                    Habit Name *
                  </label>
                  <input
                    type="text"
                    id="name"
                    value={formData.name}
                    onChange={(e) => updateFormData('name', e.target.value)}
                    className="w-full px-3 py-2 bg-transparent border border-white/10 rounded-lg text-white focus:outline-none focus:border-white/20 placeholder-slate-500"
                    placeholder="e.g., Read for 30 minutes"
                    required
                  />
                </div>

                <div>
                  <label htmlFor="frequency" className="block text-sm font-medium text-slate-400 mb-1">
                    Frequency *
                  </label>
                  <select
                    id="frequency"
                    value={formData.frequency}
                    onChange={(e) => updateFormData('frequency', e.target.value)}
                    className="w-full px-3 py-2 bg-transparent border border-white/10 rounded-lg text-white focus:outline-none focus:border-white/20"
                  >
                    <option value="daily">Daily</option>
                    <option value="weekly">Weekly</option>
                  </select>
                </div>
              </div>

              <div>
                <label htmlFor="description" className="block text-sm font-medium text-slate-400 mb-1">
                  Description
                </label>
                <textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => updateFormData('description', e.target.value)}
                  rows={2}
                  className="w-full px-3 py-2 bg-transparent border border-white/10 rounded-lg text-white focus:outline-none focus:border-white/20 placeholder-slate-500"
                  placeholder="Optional description of the habit"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="cue" className="block text-sm font-medium text-slate-400 mb-1">
                    Cue/Trigger
                  </label>
                  <input
                    type="text"
                    id="cue"
                    value={formData.cue}
                    onChange={(e) => updateFormData('cue', e.target.value)}
                    className="w-full px-3 py-2 bg-transparent border border-white/10 rounded-lg text-white focus:outline-none focus:border-white/20 placeholder-slate-500"
                    placeholder="e.g., After morning coffee"
                  />
                </div>

                <div>
                  <label htmlFor="reward" className="block text-sm font-medium text-slate-400 mb-1">
                    Reward
                  </label>
                  <input
                    type="text"
                    id="reward"
                    value={formData.reward}
                    onChange={(e) => updateFormData('reward', e.target.value)}
                    className="w-full px-3 py-2 bg-transparent border border-white/10 rounded-lg text-white focus:outline-none focus:border-white/20 placeholder-slate-500"
                    placeholder="e.g., Check social media for 5 minutes"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="stacked_after" className="block text-sm font-medium text-slate-400 mb-1">
                  Stack After (Habit Stacking)
                </label>
                <select
                  id="stacked_after"
                  value={formData.stacked_after}
                  onChange={(e) => updateFormData('stacked_after', e.target.value)}
                  className="w-full px-3 py-2 bg-transparent border border-white/10 rounded-lg text-white focus:outline-none focus:border-white/20"
                >
                  <option value="">Select an existing habit...</option>
                  {getStackableHabits().map(habit => (
                    <option key={habit.habit.id} value={habit.habit.id}>
                      {habit.habit.name} (Streak: {habit.current_streak})
                    </option>
                  ))}
                </select>
                <p className="text-xs text-slate-500 mt-1">
                  Link this habit to an existing consistent habit for better success
                </p>
              </div>

              <div className="flex space-x-3">
                <button
                  type="submit"
                  className="bg-white text-slate-950 px-4 py-2 rounded-lg hover:bg-slate-100 focus:outline-none transition-colors font-medium"
                >
                  {editingHabit ? 'Update Habit' : 'Create Habit'}
                </button>
                <button
                  type="button"
                  onClick={resetForm}
                  className="border border-white/10 text-white px-4 py-2 rounded-lg hover:border-white/20 focus:outline-none transition-colors font-medium"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Habits List */}
        {habits && (
          <div className="space-y-3">
            {habitService.sortHabitsByPriority(habits.habits).map((habitData) => {
              const { habit, current_streak, completion_rate_30_days, last_completed } = habitData;
              
              return (
                <div key={habit.id} className={`border border-white/5 rounded-lg p-4 ${!habit.is_active ? 'opacity-60' : ''}`}>
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2 mb-2">
                        <span className="text-lg">{habitService.getHabitIcon(habit.name)}</span>
                        <h3 className={`font-medium ${habit.is_active ? 'text-white' : 'text-slate-500'}`}>
                          {habit.name}
                        </h3>
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border border-white/10 text-slate-400">
                          {habit.is_active ? 'Active' : 'Inactive'}
                        </span>
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border border-white/10 text-slate-400">
                          {habitService.formatFrequency(habit.frequency)}
                        </span>
                      </div>

                      {habit.description && (
                        <p className="text-sm text-slate-400 mb-2">{habit.description}</p>
                      )}

                      <div className="flex flex-wrap items-center gap-4 text-sm">
                        <div className="flex items-center space-x-1 text-slate-400">
                          <span>🔥</span>
                          <span>{habitService.formatStreak(current_streak)}</span>
                        </div>
                        
                        <div className="flex items-center space-x-1 text-slate-400">
                          <span>📊</span>
                          <span>{habitService.formatConsistencyPercentage(completion_rate_30_days)} consistency</span>
                        </div>

                        {last_completed && (
                          <div className="flex items-center space-x-1 text-slate-500">
                            <span>📅</span>
                            <span>Last: {habitService.formatDisplayDate(last_completed)}</span>
                          </div>
                        )}
                      </div>

                      {habit.cue && (
                        <p className="text-xs text-slate-500 mt-2">
                          <span className="font-medium">Cue:</span> {habit.cue}
                        </p>
                      )}

                      {habit.stacked_after && (
                        <p className="text-xs text-slate-500 mt-1">
                          <span className="font-medium">Stacked after:</span> {
                            habits.habits.find(h => h.habit.id === habit.stacked_after)?.habit.name || 'Unknown habit'
                          }
                        </p>
                      )}
                    </div>

                    {/* Action buttons */}
                    <div className="flex items-center space-x-2 ml-4">
                      <button
                        onClick={() => handleToggleActive(habitData)}
                        className="px-3 py-1 border border-white/10 text-white rounded text-xs font-medium hover:border-white/20 transition-colors"
                      >
                        {habit.is_active ? 'Deactivate' : 'Activate'}
                      </button>
                      
                      <button
                        onClick={() => handleEditHabit(habitData)}
                        className="px-3 py-1 border border-white/10 text-white rounded text-xs font-medium hover:border-white/20 transition-colors"
                      >
                        Edit
                      </button>
                      
                      <button
                        onClick={() => handleDeleteHabit(habit.id)}
                        className="px-3 py-1 border border-white/10 text-white rounded text-xs font-medium hover:border-white/20 transition-colors"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}

            {habits.habits.length === 0 && (
              <div className="text-center py-8">
                <div className="text-slate-600 text-4xl mb-2">🎯</div>
                <p className="text-white">No habits created yet</p>
                <p className="text-sm text-slate-400 mt-1">Create your first habit to start building discipline!</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};