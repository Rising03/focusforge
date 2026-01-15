import React, { useState, useEffect } from 'react';
import { deepWorkService } from '../services/deepWorkService';
import {
  ScheduleDeepWorkRequest,
  DeepWorkScheduleResponse,
  OptimalSchedulingResponse,
  DeepWorkSession
} from '../types/deepWork';

interface DeepWorkSchedulerProps {
  onSessionScheduled?: (session: DeepWorkSession) => void;
}

export const DeepWorkScheduler: React.FC<DeepWorkSchedulerProps> = ({ onSessionScheduled }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [optimalSlots, setOptimalSlots] = useState<OptimalSchedulingResponse | null>(null);
  const [showOptimalSlots, setShowOptimalSlots] = useState(false);

  const [formData, setFormData] = useState<ScheduleDeepWorkRequest>({
    activity: '',
    planned_duration: 90,
    cognitive_load: 'medium',
    energy_requirement: 'medium',
    priority: 'medium',
    preferred_time_slots: [],
    preparation_time: 10,
    preparation_notes: ''
  });

  useEffect(() => {
    loadOptimalSlots();
  }, []);

  const loadOptimalSlots = async () => {
    try {
      const slots = await deepWorkService.getOptimalTimeSlots();
      setOptimalSlots(slots);
    } catch (error) {
      console.error('Failed to load optimal slots:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.activity.trim()) {
      setError('Activity description is required');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response: DeepWorkScheduleResponse = await deepWorkService.scheduleDeepWork({
        ...formData,
        activity: formData.activity.trim(),
        preparation_notes: formData.preparation_notes?.trim() || undefined
      });

      // Reset form
      setFormData({
        activity: '',
        planned_duration: 90,
        cognitive_load: 'medium',
        energy_requirement: 'medium',
        priority: 'medium',
        preferred_time_slots: [],
        preparation_time: 10,
        preparation_notes: ''
      });

      if (onSessionScheduled) {
        onSessionScheduled(response.session);
      }

      // Show success message (you might want to use a toast notification instead)
      alert(`Deep work session scheduled for ${deepWorkService.formatTime(response.session.planned_start_time)}!`);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to schedule deep work session');
    } finally {
      setIsLoading(false);
    }
  };

  const handleTimeSlotToggle = (timeSlot: string) => {
    setFormData(prev => ({
      ...prev,
      preferred_time_slots: prev.preferred_time_slots?.includes(timeSlot)
        ? prev.preferred_time_slots.filter(slot => slot !== timeSlot)
        : [...(prev.preferred_time_slots || []), timeSlot]
    }));
  };

  const getDurationOptions = () => [
    { value: 25, label: '25 minutes (Pomodoro)' },
    { value: 45, label: '45 minutes' },
    { value: 60, label: '1 hour' },
    { value: 90, label: '1.5 hours (Recommended)' },
    { value: 120, label: '2 hours' },
    { value: 180, label: '3 hours' }
  ];

  return (
    <div className="bg-slate-900/50 backdrop-blur-sm border border-white/5 rounded-2xl">
      <div className="p-8">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-2xl font-bold text-white">Schedule Deep Work</h2>
          <button
            type="button"
            onClick={() => setShowOptimalSlots(!showOptimalSlots)}
            className="text-sm text-blue-400 hover:text-blue-300 font-medium transition-colors"
          >
            {showOptimalSlots ? 'Hide' : 'Show'} Optimal Times
          </button>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl">
            <p className="text-sm text-red-300">{error}</p>
          </div>
        )}

        {showOptimalSlots && optimalSlots && (
          <div className="mb-8 p-6 bg-blue-500/10 border border-blue-500/20 rounded-xl">
            <h3 className="font-medium text-blue-300 mb-4">Recommended Time Slots</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
              {optimalSlots.recommended_slots.slice(0, 4).map((slot) => (
                <div
                  key={slot.time_slot}
                  className={`p-4 rounded-xl border cursor-pointer transition-all duration-200 ${
                    formData.preferred_time_slots?.includes(slot.time_slot)
                      ? 'border-blue-500/50 bg-blue-500/20'
                      : 'border-white/10 bg-white/5 hover:bg-white/10'
                  }`}
                  onClick={() => handleTimeSlotToggle(slot.time_slot)}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-white">{slot.time_slot}</span>
                    <span className="text-sm text-slate-400">
                      {deepWorkService.getEnergyLevelText(slot.energy_prediction)}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400">{slot.reasoning}</p>
                </div>
              ))}
            </div>
            <div className="text-xs text-blue-300 space-y-1">
              {optimalSlots.scheduling_insights.map((insight, index) => (
                <p key={index}>• {insight}</p>
              ))}
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="activity" className="block text-sm font-medium text-slate-300 mb-2">
              What will you work on? *
            </label>
            <input
              type="text"
              id="activity"
              value={formData.activity}
              onChange={(e) => setFormData(prev => ({ ...prev, activity: e.target.value }))}
              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-transparent transition-all"
              placeholder="e.g., Write research paper, Code new feature, Study calculus"
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="planned_duration" className="block text-sm font-medium text-slate-300 mb-2">
                Duration
              </label>
              <select
                id="planned_duration"
                value={formData.planned_duration}
                onChange={(e) => setFormData(prev => ({ ...prev, planned_duration: parseInt(e.target.value) }))}
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-transparent transition-all"
              >
                {getDurationOptions().map(option => (
                  <option key={option.value} value={option.value} className="bg-slate-800">
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="preparation_time" className="block text-sm font-medium text-slate-300 mb-2">
                Preparation Time
              </label>
              <select
                id="preparation_time"
                value={formData.preparation_time}
                onChange={(e) => setFormData(prev => ({ ...prev, preparation_time: parseInt(e.target.value) }))}
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-transparent transition-all"
              >
                <option value={5} className="bg-slate-800">5 minutes</option>
                <option value={10} className="bg-slate-800">10 minutes</option>
                <option value={15} className="bg-slate-800">15 minutes</option>
                <option value={20} className="bg-slate-800">20 minutes</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label htmlFor="cognitive_load" className="block text-sm font-medium text-slate-300 mb-2">
                Cognitive Load
              </label>
              <select
                id="cognitive_load"
                value={formData.cognitive_load}
                onChange={(e) => setFormData(prev => ({ ...prev, cognitive_load: e.target.value as 'light' | 'medium' | 'heavy' }))}
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-transparent transition-all"
              >
                <option value="light" className="bg-slate-800">Light - Routine tasks</option>
                <option value="medium" className="bg-slate-800">Medium - Problem solving</option>
                <option value="heavy" className="bg-slate-800">Heavy - Complex analysis</option>
              </select>
            </div>

            <div>
              <label htmlFor="energy_requirement" className="block text-sm font-medium text-slate-300 mb-2">
                Energy Needed
              </label>
              <select
                id="energy_requirement"
                value={formData.energy_requirement}
                onChange={(e) => setFormData(prev => ({ ...prev, energy_requirement: e.target.value as 'low' | 'medium' | 'high' }))}
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-transparent transition-all"
              >
                <option value="low" className="bg-slate-800">Low - Can work when tired</option>
                <option value="medium" className="bg-slate-800">Medium - Need decent energy</option>
                <option value="high" className="bg-slate-800">High - Peak energy required</option>
              </select>
            </div>

            <div>
              <label htmlFor="priority" className="block text-sm font-medium text-slate-300 mb-2">
                Priority
              </label>
              <select
                id="priority"
                value={formData.priority}
                onChange={(e) => setFormData(prev => ({ ...prev, priority: e.target.value as 'low' | 'medium' | 'high' | 'critical' }))}
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-transparent transition-all"
              >
                <option value="low" className="bg-slate-800">Low</option>
                <option value="medium" className="bg-slate-800">Medium</option>
                <option value="high" className="bg-slate-800">High</option>
                <option value="critical" className="bg-slate-800">Critical</option>
              </select>
            </div>
          </div>

          <div>
            <label htmlFor="preparation_notes" className="block text-sm font-medium text-slate-300 mb-2">
              Preparation Notes (optional)
            </label>
            <textarea
              id="preparation_notes"
              value={formData.preparation_notes}
              onChange={(e) => setFormData(prev => ({ ...prev, preparation_notes: e.target.value }))}
              rows={3}
              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-transparent transition-all"
              placeholder="What do you need to prepare? Goals for this session? Materials needed?"
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-blue-500/20 hover:bg-blue-500/30 border border-blue-500/30 text-blue-300 py-4 px-6 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:ring-offset-2 focus:ring-offset-slate-900 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 font-medium"
          >
            {isLoading ? 'Scheduling...' : 'Schedule Deep Work Session'}
          </button>
        </form>
      </div>
    </div>
  );
};