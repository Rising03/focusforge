import React, { useState, useEffect } from 'react';
import { routineService } from '../services/routineService';
import { DailyRoutine, RoutineSegment } from '../types/routine';

interface RoutineViewerProps {
  selectedDate?: string;
  onSegmentComplete?: (segmentId: string) => void;
}

const RoutineViewer: React.FC<RoutineViewerProps> = ({ selectedDate: propSelectedDate, onSegmentComplete }) => {
  const [routine, setRoutine] = useState<DailyRoutine | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>(
    propSelectedDate || new Date().toISOString().split('T')[0]
  );

  // Update selectedDate when prop changes
  useEffect(() => {
    if (propSelectedDate && propSelectedDate !== selectedDate) {
      setSelectedDate(propSelectedDate);
    }
  }, [propSelectedDate]);

  useEffect(() => {
    loadRoutine(selectedDate);
  }, [selectedDate]);

  const loadRoutine = async (date: string) => {
    setIsLoading(true);
    setError(null);
    console.log('RoutineViewer: Loading routine for date:', date);

    try {
      const loadedRoutine = await routineService.getRoutineByDate(date);
      console.log('RoutineViewer: Routine loaded successfully:', loadedRoutine);
      setRoutine(loadedRoutine);
    } catch (err) {
      console.log('RoutineViewer: Failed to load routine:', err);
      setError(err instanceof Error ? err.message : 'Failed to load routine');
      setRoutine(null);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSegmentToggle = async (segment: RoutineSegment) => {
    if (!routine) return;

    try {
      await routineService.updateRoutineSegment(routine.id, {
        segment_id: segment.id,
        completed: !segment.completed
      });

      // Update local state
      setRoutine({
        ...routine,
        segments: routine.segments.map(s =>
          s.id === segment.id ? { ...s, completed: !s.completed } : s
        )
      });

      if (onSegmentComplete) {
        onSegmentComplete(segment.id);
      }
    } catch (err) {
      console.error('Failed to update segment:', err);
    }
  };

  const formatTime = (timeStr: string) => {
    const [hours, minutes] = timeStr.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  const formatDate = (date: string) => {
    const d = new Date(date);
    return d.toLocaleDateString('en-US', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  const getCompletionPercentage = () => {
    if (!routine || routine.segments.length === 0) return 0;
    const completed = routine.segments.filter(s => s.completed).length;
    return Math.round((completed / routine.segments.length) * 100);
  };

  const goToPreviousDay = () => {
    const date = new Date(selectedDate);
    date.setDate(date.getDate() - 1);
    setSelectedDate(date.toISOString().split('T')[0]);
  };

  const goToNextDay = () => {
    const date = new Date(selectedDate);
    date.setDate(date.getDate() + 1);
    setSelectedDate(date.toISOString().split('T')[0]);
  };

  const goToToday = () => {
    setSelectedDate(new Date().toISOString().split('T')[0]);
  };

  const isToday = selectedDate === new Date().toISOString().split('T')[0];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <p className="text-slate-400">Loading routine...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Date Navigation */}
      <div className="border border-white/5 rounded-lg p-4">
        <div className="flex items-center justify-between">
          <button
            onClick={goToPreviousDay}
            className="p-2 hover:bg-white/5 rounded-lg transition-colors text-white"
          >
            <span className="text-xl">←</span>
          </button>

          <div className="text-center flex-1">
            <h2 className="text-lg font-semibold text-white">
              {formatDate(selectedDate)}
            </h2>
            {!isToday && (
              <button
                onClick={goToToday}
                className="text-sm text-white hover:text-slate-400 mt-1"
              >
                Go to Today
              </button>
            )}
          </div>

          <button
            onClick={goToNextDay}
            className="p-2 hover:bg-white/5 rounded-lg transition-colors text-white"
          >
            <span className="text-xl">→</span>
          </button>
        </div>
      </div>

      {/* Routine Content */}
      {error && (
        <div className="border border-white/10 rounded-lg p-4">
          <p className="text-slate-400">
            ⚠️ No routine found for this date. Generate one in the Daily Routine tab!
          </p>
        </div>
      )}

      {routine && (
        <>
          {/* Progress Bar */}
          <div className="border border-white/5 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-slate-400">Progress</span>
              <span className="text-sm font-semibold text-white">
                {getCompletionPercentage()}%
              </span>
            </div>
            <div className="w-full bg-white/5 rounded-full h-1">
              <div
                className="bg-white h-1 rounded-full transition-all duration-300"
                style={{ width: `${getCompletionPercentage()}%` }}
              />
            </div>
            <p className="text-xs text-slate-500 mt-2">
              {routine.segments.filter(s => s.completed).length} of {routine.segments.length} tasks completed
            </p>
          </div>

          {/* Routine Segments */}
          <div className="space-y-3">
            {routine.segments.map((segment) => (
              <div
                key={segment.id}
                className="border border-white/5 rounded-lg transition-all hover:border-white/10"
              >
                <div className="p-4">
                  <div className="flex items-start space-x-3">
                    {/* Checkbox */}
                    <button
                      onClick={() => handleSegmentToggle(segment)}
                      className={`flex-shrink-0 w-6 h-6 rounded border flex items-center justify-center transition-all ${
                        segment.completed
                          ? 'bg-white border-white text-slate-950'
                          : 'border-white/20 hover:border-white/40'
                      }`}
                    >
                      {segment.completed && (
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      )}
                    </button>

                    {/* Content */}
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-1">
                        <span className="text-2xl">{routineService.getActivityTypeIcon(segment.type)}</span>
                        <span className={`font-medium ${segment.completed ? 'text-slate-500 line-through' : 'text-white'}`}>
                          {segment.activity}
                        </span>
                      </div>

                      <div className="flex flex-wrap items-center gap-3 text-sm text-slate-400">
                        <span className="flex items-center space-x-1">
                          <span>🕐</span>
                          <span>
                            {formatTime(segment.time_slot?.start_time || '00:00')} - {formatTime(segment.time_slot?.end_time || '00:00')}
                          </span>
                        </span>
                        <span className="flex items-center space-x-1">
                          <span>⏱️</span>
                          <span>{routineService.formatDuration(segment.duration)}</span>
                        </span>
                        <span className="px-2 py-1 rounded text-xs font-medium border border-white/10 text-slate-400">
                          {segment.priority}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Completion Message */}
          {getCompletionPercentage() === 100 && (
            <div className="border border-white/10 rounded-lg p-4 text-center">
              <p className="text-white font-medium text-lg">
                🎉 Congratulations! You've completed all tasks for today!
              </p>
              <p className="text-slate-400 text-sm mt-1">
                Great job staying disciplined and focused!
              </p>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default RoutineViewer;
