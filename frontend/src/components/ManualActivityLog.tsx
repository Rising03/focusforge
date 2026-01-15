import React, { useState } from 'react';
import { activityService } from '../services/activityService';
import { LogActivityRequest } from '../types/activity';

interface ManualActivityLogProps {
  onActivityLogged?: () => void;
}

export const ManualActivityLog: React.FC<ManualActivityLogProps> = ({ onActivityLogged }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const [form, setForm] = useState({
    activity: '',
    start_time: '',
    end_time: '',
    focus_quality: 'medium' as 'high' | 'medium' | 'low',
    distractions: 0,
    notes: ''
  });

  // Set default times when opening the form
  const handleOpen = () => {
    const now = new Date();
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
    
    setForm(prev => ({
      ...prev,
      start_time: oneHourAgo.toISOString().slice(0, 16), // Format for datetime-local input
      end_time: now.toISOString().slice(0, 16)
    }));
    
    setIsOpen(true);
    setError(null);
    setSuccess(false);
  };

  const handleClose = () => {
    setIsOpen(false);
    setForm({
      activity: '',
      start_time: '',
      end_time: '',
      focus_quality: 'medium',
      distractions: 0,
      notes: ''
    });
    setError(null);
    setSuccess(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      // Validate form
      if (!form.activity.trim()) {
        throw new Error('Activity name is required');
      }

      if (!form.start_time || !form.end_time) {
        throw new Error('Start time and end time are required');
      }

      const startTime = new Date(form.start_time);
      const endTime = new Date(form.end_time);

      if (endTime <= startTime) {
        throw new Error('End time must be after start time');
      }

      // Check if the time range is reasonable (not more than 12 hours)
      const durationHours = (endTime.getTime() - startTime.getTime()) / (1000 * 60 * 60);
      if (durationHours > 12) {
        throw new Error('Activity duration cannot exceed 12 hours');
      }

      const request: LogActivityRequest = {
        activity: form.activity.trim(),
        start_time: startTime.toISOString(),
        end_time: endTime.toISOString(),
        focus_quality: form.focus_quality,
        distractions: form.distractions,
        notes: form.notes.trim() || undefined
      };

      await activityService.logActivity(request);
      
      setSuccess(true);
      
      // Notify parent component
      if (onActivityLogged) {
        onActivityLogged();
      }

      // Close form after a brief success message
      setTimeout(() => {
        handleClose();
      }, 1500);

    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to log activity');
    } finally {
      setIsLoading(false);
    }
  };

  const calculateDuration = (): string => {
    if (!form.start_time || !form.end_time) return '';
    
    const startTime = new Date(form.start_time);
    const endTime = new Date(form.end_time);
    
    if (endTime <= startTime) return '';
    
    const durationMinutes = Math.round((endTime.getTime() - startTime.getTime()) / (1000 * 60));
    return activityService.formatDuration(durationMinutes);
  };

  if (!isOpen) {
    return (
      <button
        onClick={handleOpen}
        className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
      >
        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
        </svg>
        Log Past Activity
      </button>
    );
  }

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-full max-w-md shadow-lg rounded-md bg-white">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Log Past Activity</h3>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 focus:outline-none"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        {success && (
          <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-md">
            <p className="text-sm text-green-600">Activity logged successfully!</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="manual_activity" className="block text-sm font-medium text-gray-700 mb-1">
              Activity
            </label>
            <input
              type="text"
              id="manual_activity"
              value={form.activity}
              onChange={(e) => setForm(prev => ({ ...prev, activity: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="What did you work on?"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="manual_start_time" className="block text-sm font-medium text-gray-700 mb-1">
                Start Time
              </label>
              <input
                type="datetime-local"
                id="manual_start_time"
                value={form.start_time}
                onChange={(e) => setForm(prev => ({ ...prev, start_time: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>

            <div>
              <label htmlFor="manual_end_time" className="block text-sm font-medium text-gray-700 mb-1">
                End Time
              </label>
              <input
                type="datetime-local"
                id="manual_end_time"
                value={form.end_time}
                onChange={(e) => setForm(prev => ({ ...prev, end_time: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>
          </div>

          {calculateDuration() && (
            <div className="text-sm text-gray-600 bg-gray-50 p-2 rounded">
              Duration: {calculateDuration()}
            </div>
          )}

          <div>
            <label htmlFor="manual_focus_quality" className="block text-sm font-medium text-gray-700 mb-1">
              Focus Quality
            </label>
            <select
              id="manual_focus_quality"
              value={form.focus_quality}
              onChange={(e) => setForm(prev => ({ 
                ...prev, 
                focus_quality: e.target.value as 'high' | 'medium' | 'low' 
              }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="high">High - Deep focus, minimal distractions</option>
              <option value="medium">Medium - Good focus with some distractions</option>
              <option value="low">Low - Frequent distractions, shallow work</option>
            </select>
          </div>

          <div>
            <label htmlFor="manual_distractions" className="block text-sm font-medium text-gray-700 mb-1">
              Number of Distractions
            </label>
            <input
              type="number"
              id="manual_distractions"
              min="0"
              value={form.distractions}
              onChange={(e) => setForm(prev => ({ 
                ...prev, 
                distractions: parseInt(e.target.value) || 0 
              }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="0"
            />
          </div>

          <div>
            <label htmlFor="manual_notes" className="block text-sm font-medium text-gray-700 mb-1">
              Notes (optional)
            </label>
            <textarea
              id="manual_notes"
              value={form.notes}
              onChange={(e) => setForm(prev => ({ ...prev, notes: e.target.value }))}
              rows={2}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="What did you accomplish? Any insights?"
            />
          </div>

          <div className="flex space-x-3 pt-4">
            <button
              type="button"
              onClick={handleClose}
              className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading || success}
              className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isLoading ? 'Logging...' : success ? 'Logged!' : 'Log Activity'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};