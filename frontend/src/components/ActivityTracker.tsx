import React, { useState, useEffect } from 'react';
import { activityService } from '../services/activityService';
import { 
  ActivitySessionResponse, 
  StartActivityRequest, 
  StopActivityRequest,
  ActivityTrackingState 
} from '../types/activity';

interface ActivityTrackerProps {
  onSessionUpdate?: (session: ActivitySessionResponse | null) => void;
}

export const ActivityTracker: React.FC<ActivityTrackerProps> = ({ onSessionUpdate }) => {
  const [state, setState] = useState<ActivityTrackingState>({
    activeSession: null,
    isLoading: false,
    error: null
  });

  const [startForm, setStartForm] = useState({
    activity: '',
    notes: ''
  });

  const [stopForm, setStopForm] = useState({
    focus_quality: 'medium' as 'high' | 'medium' | 'low',
    distractions: 0,
    notes: ''
  });

  const [currentTime, setCurrentTime] = useState(new Date());

  // Update current time every minute for active session display
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000); // Update every minute

    return () => clearInterval(interval);
  }, []);

  // Load active session on component mount
  useEffect(() => {
    loadActiveSession();
  }, []);

  // Notify parent component when session changes
  useEffect(() => {
    if (onSessionUpdate) {
      onSessionUpdate(state.activeSession);
    }
  }, [state.activeSession, onSessionUpdate]);

  const loadActiveSession = async () => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    
    try {
      const activeSession = await activityService.getActiveSession();
      setState(prev => ({ 
        ...prev, 
        activeSession, 
        isLoading: false 
      }));
    } catch (error) {
      setState(prev => ({ 
        ...prev, 
        error: error instanceof Error ? error.message : 'Failed to load active session',
        isLoading: false 
      }));
    }
  };

  const handleStartActivity = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!startForm.activity.trim()) {
      setState(prev => ({ ...prev, error: 'Activity name is required' }));
      return;
    }

    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const request: StartActivityRequest = {
        activity: startForm.activity.trim(),
        notes: startForm.notes.trim() || undefined
      };

      const session = await activityService.startActivity(request);
      
      setState(prev => ({ 
        ...prev, 
        activeSession: session, 
        isLoading: false 
      }));

      // Reset form
      setStartForm({ activity: '', notes: '' });
    } catch (error) {
      setState(prev => ({ 
        ...prev, 
        error: error instanceof Error ? error.message : 'Failed to start activity',
        isLoading: false 
      }));
    }
  };

  const handleStopActivity = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!state.activeSession) {
      setState(prev => ({ ...prev, error: 'No active session to stop' }));
      return;
    }

    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const request: StopActivityRequest = {
        focus_quality: stopForm.focus_quality,
        distractions: stopForm.distractions,
        notes: stopForm.notes.trim() || undefined
      };

      await activityService.stopActivity(state.activeSession.session.id, request);
      
      setState(prev => ({ 
        ...prev, 
        activeSession: null, 
        isLoading: false 
      }));

      // Reset form
      setStopForm({
        focus_quality: 'medium',
        distractions: 0,
        notes: ''
      });
    } catch (error) {
      setState(prev => ({ 
        ...prev, 
        error: error instanceof Error ? error.message : 'Failed to stop activity',
        isLoading: false 
      }));
    }
  };

  const getCurrentDuration = (): number => {
    if (!state.activeSession) return 0;
    
    const startTime = new Date(state.activeSession.session.start_time);
    return Math.floor((currentTime.getTime() - startTime.getTime()) / (1000 * 60));
  };

  const formatDuration = (minutes: number): string => {
    return activityService.formatDuration(minutes);
  };

  if (state.isLoading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="h-10 bg-gray-200 rounded mb-4"></div>
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border">
      <div className="p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">Activity Tracker</h2>

        {state.error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
            <p className="text-sm text-red-600">{state.error}</p>
          </div>
        )}

        {state.activeSession ? (
          // Active session view
          <div className="space-y-6">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-medium text-blue-900">Currently Tracking</h3>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                  Active
                </span>
              </div>
              <p className="text-lg font-semibold text-blue-900 mb-1">
                {state.activeSession.session.activity}
              </p>
              <p className="text-sm text-blue-700">
                Duration: {formatDuration(getCurrentDuration())}
              </p>
              <p className="text-xs text-blue-600 mt-1">
                Started at {activityService.formatTime(new Date(state.activeSession.session.start_time))}
              </p>
            </div>

            {/* Stop activity form */}
            <form onSubmit={handleStopActivity} className="space-y-4">
              <div>
                <label htmlFor="focus_quality" className="block text-sm font-medium text-gray-700 mb-1">
                  How was your focus quality?
                </label>
                <select
                  id="focus_quality"
                  value={stopForm.focus_quality}
                  onChange={(e) => setStopForm(prev => ({ 
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
                <label htmlFor="distractions" className="block text-sm font-medium text-gray-700 mb-1">
                  Number of distractions
                </label>
                <input
                  type="number"
                  id="distractions"
                  min="0"
                  value={stopForm.distractions}
                  onChange={(e) => setStopForm(prev => ({ 
                    ...prev, 
                    distractions: parseInt(e.target.value) || 0 
                  }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="0"
                />
              </div>

              <div>
                <label htmlFor="stop_notes" className="block text-sm font-medium text-gray-700 mb-1">
                  Notes (optional)
                </label>
                <textarea
                  id="stop_notes"
                  value={stopForm.notes}
                  onChange={(e) => setStopForm(prev => ({ ...prev, notes: e.target.value }))}
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="What did you accomplish? Any insights?"
                />
              </div>

              <button
                type="submit"
                disabled={state.isLoading}
                className="w-full bg-red-600 text-white py-2 px-4 rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {state.isLoading ? 'Stopping...' : 'Stop Activity'}
              </button>
            </form>
          </div>
        ) : (
          // Start activity form
          <form onSubmit={handleStartActivity} className="space-y-4">
            <div>
              <label htmlFor="activity" className="block text-sm font-medium text-gray-700 mb-1">
                What are you working on?
              </label>
              <input
                type="text"
                id="activity"
                value={startForm.activity}
                onChange={(e) => setStartForm(prev => ({ ...prev, activity: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="e.g., Study calculus, Write essay, Code project"
                required
              />
            </div>

            <div>
              <label htmlFor="start_notes" className="block text-sm font-medium text-gray-700 mb-1">
                Notes (optional)
              </label>
              <textarea
                id="start_notes"
                value={startForm.notes}
                onChange={(e) => setStartForm(prev => ({ ...prev, notes: e.target.value }))}
                rows={2}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Goals, context, or reminders for this session"
              />
            </div>

            <button
              type="submit"
              disabled={state.isLoading}
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {state.isLoading ? 'Starting...' : 'Start Activity'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};