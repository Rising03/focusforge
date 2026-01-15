import React, { useState, useEffect } from 'react';
import { deepWorkService } from '../services/deepWorkService';
import {
  DeepWorkSession as DeepWorkSessionType,
  StartDeepWorkRequest,
  CompleteDeepWorkRequest,
  CognitiveOutputMetrics
} from '../types/deepWork';

interface DeepWorkSessionProps {
  session: DeepWorkSessionType;
  onSessionUpdate?: (session: DeepWorkSessionType | null) => void;
}

export const DeepWorkSession: React.FC<DeepWorkSessionProps> = ({ session, onSessionUpdate }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [showCompleteForm, setShowCompleteForm] = useState(false);

  const [startForm, setStartForm] = useState({
    preparation_notes: ''
  });

  const [completeForm, setCompleteForm] = useState({
    work_quality_score: 7,
    interruptions: 0,
    session_notes: '',
    cognitive_output_metrics: {
      complexity_handled: 'medium' as 'low' | 'medium' | 'high',
      problem_solving_depth: 3,
      creative_insights: 2,
      decision_quality: 3,
      mental_fatigue_level: 2,
      flow_state_achieved: false,
      flow_duration: 0
    }
  });

  // Update current time every minute
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);

    return () => clearInterval(interval);
  }, []);

  const handleStartSession = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const request: StartDeepWorkRequest = {
        session_id: session.id,
        preparation_notes: startForm.preparation_notes.trim() || undefined
      };

      const response = await deepWorkService.startDeepWorkSession(request);
      
      if (onSessionUpdate) {
        onSessionUpdate(response.session);
      }

      setStartForm({ preparation_notes: '' });
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to start session');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCompleteSession = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const request: CompleteDeepWorkRequest = {
        session_id: session.id,
        work_quality_score: completeForm.work_quality_score,
        interruptions: completeForm.interruptions,
        session_notes: completeForm.session_notes.trim() || undefined,
        cognitive_output_metrics: completeForm.cognitive_output_metrics
      };

      const response = await deepWorkService.completeDeepWorkSession(request);
      
      if (onSessionUpdate) {
        onSessionUpdate(response.session);
      }

      setShowCompleteForm(false);
      // Reset form
      setCompleteForm({
        work_quality_score: 7,
        interruptions: 0,
        session_notes: '',
        cognitive_output_metrics: {
          complexity_handled: 'medium',
          problem_solving_depth: 3,
          creative_insights: 2,
          decision_quality: 3,
          mental_fatigue_level: 2,
          flow_state_achieved: false,
          flow_duration: 0
        }
      });
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to complete session');
    } finally {
      setIsLoading(false);
    }
  };

  const getCurrentDuration = (): number => {
    if (!session.actual_start_time) return 0;
    
    const startTime = new Date(session.actual_start_time);
    return Math.floor((currentTime.getTime() - startTime.getTime()) / (1000 * 60));
  };

  const getTimeUntilStart = (): number => {
    const startTime = new Date(session.planned_start_time);
    return Math.floor((startTime.getTime() - currentTime.getTime()) / (1000 * 60));
  };

  const getSessionProgress = (): number => {
    return deepWorkService.calculateSessionProgress(session);
  };

  const renderScheduledSession = () => {
    const minutesUntilStart = getTimeUntilStart();
    const isPreparationTime = minutesUntilStart <= session.preparation_time;

    return (
      <div className="space-y-4">
        <div className={`p-4 rounded-lg border ${isPreparationTime ? 'bg-yellow-50 border-yellow-200' : 'bg-blue-50 border-blue-200'}`}>
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-medium text-gray-900">Upcoming Deep Work Session</h3>
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${deepWorkService.getStatusBgColor(session.status)} ${deepWorkService.getStatusColor(session.status)}`}>
              {session.status === 'scheduled' && isPreparationTime ? 'Preparation Time' : session.status}
            </span>
          </div>
          
          <p className="text-lg font-semibold text-gray-900 mb-2">{session.activity}</p>
          
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-600">Start Time:</span>
              <p className="font-medium">{deepWorkService.formatTime(session.planned_start_time)}</p>
            </div>
            <div>
              <span className="text-gray-600">Duration:</span>
              <p className="font-medium">{deepWorkService.formatDuration(session.planned_duration)}</p>
            </div>
            <div>
              <span className="text-gray-600">Cognitive Load:</span>
              <p className={`font-medium ${deepWorkService.getCognitiveLoadColor(session.cognitive_load)}`}>
                {session.cognitive_load}
              </p>
            </div>
            <div>
              <span className="text-gray-600">Priority:</span>
              <p className={`font-medium ${deepWorkService.getPriorityColor(session.priority)}`}>
                {session.priority}
              </p>
            </div>
          </div>

          {minutesUntilStart > 0 && (
            <p className="text-sm text-gray-600 mt-3">
              {isPreparationTime 
                ? `Preparation time! Session starts in ${minutesUntilStart} minutes.`
                : `Starts in ${deepWorkService.formatDuration(minutesUntilStart)}`
              }
            </p>
          )}
        </div>

        {(isPreparationTime || minutesUntilStart <= 0) && (
          <div className="space-y-4">
            <div>
              <label htmlFor="preparation_notes" className="block text-sm font-medium text-gray-700 mb-1">
                Preparation Notes (optional)
              </label>
              <textarea
                id="preparation_notes"
                value={startForm.preparation_notes}
                onChange={(e) => setStartForm(prev => ({ ...prev, preparation_notes: e.target.value }))}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="How did preparation go? Any adjustments to your approach?"
              />
            </div>

            <button
              onClick={handleStartSession}
              disabled={isLoading}
              className="w-full bg-green-600 text-white py-3 px-4 rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
            >
              {isLoading ? 'Starting...' : 'Start Deep Work Session'}
            </button>
          </div>
        )}
      </div>
    );
  };

  const renderActiveSession = () => {
    const currentDuration = getCurrentDuration();
    const progress = getSessionProgress();

    return (
      <div className="space-y-4">
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-medium text-green-900">Deep Work Session Active</h3>
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
              Focus Mode
            </span>
          </div>
          
          <p className="text-lg font-semibold text-green-900 mb-3">{session.activity}</p>
          
          <div className="space-y-3">
            <div>
              <div className="flex justify-between text-sm text-green-700 mb-1">
                <span>Progress</span>
                <span>{deepWorkService.formatDuration(currentDuration)} / {deepWorkService.formatDuration(session.planned_duration)}</span>
              </div>
              <div className="w-full bg-green-200 rounded-full h-2">
                <div 
                  className="bg-green-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${Math.min(progress, 100)}%` }}
                ></div>
              </div>
            </div>

            <div className="text-sm text-green-700">
              <p>• Eliminate all distractions</p>
              <p>• Focus on the single task at hand</p>
              <p>• Take notes of insights as they come</p>
            </div>
          </div>
        </div>

        <button
          onClick={() => setShowCompleteForm(true)}
          className="w-full bg-blue-600 text-white py-3 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors font-medium"
        >
          Complete Session
        </button>

        {showCompleteForm && (
          <div className="border border-gray-200 rounded-lg p-4 space-y-4">
            <h4 className="font-medium text-gray-900">Session Completion</h4>
            
            <form onSubmit={handleCompleteSession} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="work_quality_score" className="block text-sm font-medium text-gray-700 mb-1">
                    Work Quality Score (1-10)
                  </label>
                  <input
                    type="number"
                    id="work_quality_score"
                    min="1"
                    max="10"
                    value={completeForm.work_quality_score}
                    onChange={(e) => setCompleteForm(prev => ({ ...prev, work_quality_score: parseInt(e.target.value) || 1 }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label htmlFor="interruptions" className="block text-sm font-medium text-gray-700 mb-1">
                    Interruptions
                  </label>
                  <input
                    type="number"
                    id="interruptions"
                    min="0"
                    value={completeForm.interruptions}
                    onChange={(e) => setCompleteForm(prev => ({ ...prev, interruptions: parseInt(e.target.value) || 0 }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="complexity_handled" className="block text-sm font-medium text-gray-700 mb-1">
                    Complexity Handled
                  </label>
                  <select
                    id="complexity_handled"
                    value={completeForm.cognitive_output_metrics.complexity_handled}
                    onChange={(e) => setCompleteForm(prev => ({
                      ...prev,
                      cognitive_output_metrics: {
                        ...prev.cognitive_output_metrics,
                        complexity_handled: e.target.value as 'low' | 'medium' | 'high'
                      }
                    }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="problem_solving_depth" className="block text-sm font-medium text-gray-700 mb-1">
                    Problem Solving Depth (1-5)
                  </label>
                  <input
                    type="number"
                    id="problem_solving_depth"
                    min="1"
                    max="5"
                    value={completeForm.cognitive_output_metrics.problem_solving_depth}
                    onChange={(e) => setCompleteForm(prev => ({
                      ...prev,
                      cognitive_output_metrics: {
                        ...prev.cognitive_output_metrics,
                        problem_solving_depth: parseInt(e.target.value) || 1
                      }
                    }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="flow_state_achieved"
                  checked={completeForm.cognitive_output_metrics.flow_state_achieved}
                  onChange={(e) => setCompleteForm(prev => ({
                    ...prev,
                    cognitive_output_metrics: {
                      ...prev.cognitive_output_metrics,
                      flow_state_achieved: e.target.checked
                    }
                  }))}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="flow_state_achieved" className="ml-2 block text-sm text-gray-700">
                  Achieved flow state
                </label>
              </div>

              <div>
                <label htmlFor="session_notes" className="block text-sm font-medium text-gray-700 mb-1">
                  Session Notes
                </label>
                <textarea
                  id="session_notes"
                  value={completeForm.session_notes}
                  onChange={(e) => setCompleteForm(prev => ({ ...prev, session_notes: e.target.value }))}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="What did you accomplish? Key insights? How did it go?"
                />
              </div>

              <div className="flex space-x-3">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="flex-1 bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {isLoading ? 'Completing...' : 'Complete Session'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowCompleteForm(false)}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    );
  };

  const renderCompletedSession = () => (
    <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
      <div className="flex items-center justify-between mb-2">
        <h3 className="font-medium text-gray-900">Completed Deep Work Session</h3>
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
          Completed
        </span>
      </div>
      
      <p className="text-lg font-semibold text-gray-900 mb-3">{session.activity}</p>
      
      <div className="grid grid-cols-2 gap-4 text-sm">
        <div>
          <span className="text-gray-600">Duration:</span>
          <p className="font-medium">{deepWorkService.formatDuration(session.actual_duration || session.planned_duration)}</p>
        </div>
        <div>
          <span className="text-gray-600">Quality Score:</span>
          <p className="font-medium">{session.work_quality_score}/10</p>
        </div>
        <div>
          <span className="text-gray-600">Interruptions:</span>
          <p className="font-medium">{session.interruptions}</p>
        </div>
        <div>
          <span className="text-gray-600">Flow State:</span>
          <p className="font-medium">{session.cognitive_output_metrics?.flow_state_achieved ? 'Yes' : 'No'}</p>
        </div>
      </div>

      {session.session_notes && (
        <div className="mt-3 pt-3 border-t border-gray-200">
          <span className="text-sm text-gray-600">Notes:</span>
          <p className="text-sm text-gray-800 mt-1">{session.session_notes}</p>
        </div>
      )}
    </div>
  );

  return (
    <div className="bg-white rounded-lg shadow-sm border">
      <div className="p-6">
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        {session.status === 'scheduled' && renderScheduledSession()}
        {session.status === 'active' && renderActiveSession()}
        {session.status === 'completed' && renderCompletedSession()}
      </div>
    </div>
  );
};