import React, { useState, useEffect } from 'react';
import { routineService } from '../services/routineService';
import { FocusScreenData, RoutineSegment, DailyRoutine } from '../types/routine';

interface FocusScreenProps {
  onExit?: () => void;
}

export const FocusScreen: React.FC<FocusScreenProps> = ({ onExit }) => {
  const [focusData, setFocusData] = useState<FocusScreenData>({
    currentTask: null,
    nextTask: null,
    timeRemaining: 0,
    totalProgress: 0,
    completedTasks: 0,
    totalTasks: 0
  });
  const [currentRoutine, setCurrentRoutine] = useState<DailyRoutine | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentTime, setCurrentTime] = useState(new Date());

  // Update current time every minute
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000); // Update every minute

    return () => clearInterval(interval);
  }, []);

  // Load focus screen data
  useEffect(() => {
    loadFocusData();
    
    // Refresh data every 5 minutes
    const interval = setInterval(loadFocusData, 5 * 60 * 1000);
    
    return () => clearInterval(interval);
  }, []);

  // Update time remaining when current time changes
  useEffect(() => {
    if (focusData.currentTask) {
      const timeRemaining = calculateTimeRemaining(focusData.currentTask, currentTime);
      setFocusData(prev => ({ ...prev, timeRemaining }));
    }
  }, [currentTime, focusData.currentTask]);

  const loadFocusData = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      console.log('🔄 Loading focus data...');
      
      // Get the full routine to have access to the routine ID
      const routine = await routineService.getTodayRoutine();
      console.log('📅 Today\'s routine:', routine ? { id: routine.id, segmentCount: routine.segments.length } : 'No routine found');
      setCurrentRoutine(routine);
      
      // Get focus screen data
      const data = await routineService.getFocusScreenData();
      console.log('🎯 Focus data:', {
        hasCurrentTask: !!data.currentTask,
        currentTaskActivity: data.currentTask?.activity,
        completedTasks: data.completedTasks,
        totalTasks: data.totalTasks
      });
      setFocusData(data);
    } catch (error) {
      console.error('❌ Failed to load focus data:', error);
      setError(error instanceof Error ? error.message : 'Failed to load focus data');
    } finally {
      setIsLoading(false);
    }
  };

  const calculateTimeRemaining = (task: RoutineSegment, currentTime: Date): number => {
    const currentTimeMinutes = currentTime.getHours() * 60 + currentTime.getMinutes();
    const endTimeMinutes = parseTime(task.time_slot.end_time);
    return Math.max(0, endTimeMinutes - currentTimeMinutes);
  };

  const parseTime = (timeStr: string): number => {
    const [hours, minutes] = timeStr.split(':').map(Number);
    return hours * 60 + minutes;
  };

  const handleCompleteTask = async () => {
    if (!focusData.currentTask || !currentRoutine) {
      console.log('❌ Cannot complete task:', { 
        hasCurrentTask: !!focusData.currentTask, 
        hasCurrentRoutine: !!currentRoutine 
      });
      return;
    }

    console.log('🎯 Attempting to complete task:', {
      taskId: focusData.currentTask.id,
      routineId: currentRoutine.id,
      taskActivity: focusData.currentTask.activity
    });

    try {
      // Mark the current task as completed
      await routineService.updateRoutineSegment(currentRoutine.id, {
        segment_id: focusData.currentTask.id,
        completed: true
      });
      
      console.log('✅ Task completed successfully');
      
      // Refresh the data to show the updated state
      await loadFocusData();
    } catch (error) {
      console.error('❌ Failed to complete task:', error);
      setError(error instanceof Error ? error.message : 'Failed to complete task');
    }
  };

  const formatTimeRemaining = (minutes: number): string => {
    if (minutes <= 0) return "Time's up!";
    
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    
    if (hours > 0) {
      return `${hours}h ${mins}m remaining`;
    } else {
      return `${mins}m remaining`;
    }
  };

  const getNextActionSuggestion = (): string => {
    return routineService.getNextActionSuggestion(focusData.currentTask, focusData.nextTask);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your focus session...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Minimal header with exit option */}
      <header className="bg-white shadow-sm border-b border-gray-200 px-4 sm:px-6 py-3 sm:py-4">
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-2 sm:space-x-4">
            <h1 className="text-base sm:text-lg font-medium text-gray-900">Focus Mode</h1>
            <div className="text-xs sm:text-sm text-gray-500">
              {currentTime.toLocaleTimeString('en-US', { 
                hour: '2-digit', 
                minute: '2-digit',
                hour12: false 
              })}
            </div>
          </div>
          {onExit && (
            <button
              onClick={onExit}
              className="text-xs sm:text-sm text-gray-500 hover:text-gray-700 transition-colors touch-manipulation p-2"
            >
              Exit Focus
            </button>
          )}
        </div>
      </header>

      {/* Main focus content */}
      <main className="flex-1 flex items-center justify-center px-4 sm:px-6 py-6 sm:py-12">
        <div className="max-w-2xl w-full text-center space-y-6 sm:space-y-8">
          {error && (
            <div className="mb-4 sm:mb-6 p-3 sm:p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-600 text-sm sm:text-base">{error}</p>
              <button
                onClick={loadFocusData}
                className="mt-2 text-xs sm:text-sm text-red-700 hover:text-red-900 underline touch-manipulation"
              >
                Try again
              </button>
            </div>
          )}

          {/* Progress indicator */}
          <div className="mb-6 sm:mb-8">
            <div className="flex justify-between text-xs sm:text-sm text-gray-600 mb-2">
              <span>Today's Progress</span>
              <span>{focusData.completedTasks} of {focusData.totalTasks} tasks</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${focusData.totalProgress}%` }}
              ></div>
            </div>
          </div>

          {/* Current task display */}
          {focusData.currentTask ? (
            <div className="space-y-4 sm:space-y-6">
              <div className="text-center">
                <div className="text-xs sm:text-sm text-gray-500 mb-2">Current Focus</div>
                <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-3 sm:mb-4 px-2">
                  {focusData.currentTask.activity}
                </h2>
                <div className="flex items-center justify-center space-x-2 sm:space-x-4 text-xs sm:text-sm text-gray-600 flex-wrap">
                  <span className="flex items-center">
                    {routineService.getActivityTypeIcon(focusData.currentTask.type)}
                    <span className="ml-1 capitalize">{focusData.currentTask.type.replace('_', ' ')}</span>
                  </span>
                  <span className="hidden sm:inline">•</span>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${routineService.getPriorityBgColor(focusData.currentTask.priority)} ${routineService.getPriorityColor(focusData.currentTask.priority)}`}>
                    {focusData.currentTask.priority} priority
                  </span>
                </div>
              </div>

              {/* Time remaining */}
              <div className="text-center">
                <div className="text-xl sm:text-2xl font-semibold text-blue-600 mb-2">
                  {formatTimeRemaining(focusData.timeRemaining)}
                </div>
                <div className="text-xs sm:text-sm text-gray-500">
                  {focusData.currentTask.time_slot.start_time} - {focusData.currentTask.time_slot.end_time}
                </div>
              </div>

              {/* Complete task button */}
              <div className="flex justify-center px-4">
                <button
                  onClick={handleCompleteTask}
                  className="w-full sm:w-auto px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 active:bg-green-800 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-colors font-medium touch-manipulation"
                >
                  Mark Complete
                </button>
              </div>
            </div>
          ) : (
            <div className="text-center space-y-4">
              <div className="text-4xl sm:text-6xl mb-4">🎉</div>
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900">
                All tasks completed!
              </h2>
              <p className="text-sm sm:text-base text-gray-600 px-4">
                Great work today. Take some time to reflect on your progress.
              </p>
            </div>
          )}

          {/* Next action suggestion */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 sm:p-4 mx-2 sm:mx-0">
            <div className="text-xs sm:text-sm text-blue-700 font-medium mb-1">Next Action</div>
            <p className="text-blue-800 text-sm sm:text-base">{getNextActionSuggestion()}</p>
          </div>

          {/* Next task preview (if exists) */}
          {focusData.nextTask && (
            <div className="bg-gray-100 rounded-lg p-3 sm:p-4 mx-2 sm:mx-0">
              <div className="text-xs sm:text-sm text-gray-600 font-medium mb-2">Coming Up Next</div>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2 flex-1 min-w-0">
                  <span>{routineService.getActivityTypeIcon(focusData.nextTask.type)}</span>
                  <span className="text-gray-900 text-sm sm:text-base truncate">{focusData.nextTask.activity}</span>
                </div>
                <div className="text-xs sm:text-sm text-gray-500 ml-2 flex-shrink-0">
                  {focusData.nextTask.time_slot.start_time}
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Minimal footer */}
      <footer className="bg-white border-t border-gray-200 px-4 sm:px-6 py-3 sm:py-4">
        <div className="text-center text-xs sm:text-sm text-gray-500">
          Stay focused. You've got this. 💪
        </div>
      </footer>
    </div>
  );
};