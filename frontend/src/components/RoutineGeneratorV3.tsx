import React, { useState, useEffect } from 'react';
import { routineService } from '../services/routineService';
import { profileService } from '../services/profileService';
import { DailyRoutine, ManualTimeSlot } from '../types/routine';

interface RoutineGeneratorV3Props {
  onRoutineGenerated?: (routine: DailyRoutine) => void;
}

const RoutineGeneratorV3: React.FC<RoutineGeneratorV3Props> = ({ onRoutineGenerated }) => {
  const [mode, setMode] = useState<'automatic' | 'manual' | 'natural'>('automatic');
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [routine, setRoutine] = useState<DailyRoutine | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const [profileEnergyLevel, setProfileEnergyLevel] = useState<'low' | 'medium' | 'high'>('medium');
  const [wakeUpTime, setWakeUpTime] = useState<string>('07:00');
  const [isEditingRoutine, setIsEditingRoutine] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );

  // Automatic mode state
  const [priorityFocus, setPriorityFocus] = useState<'critical' | 'high' | 'medium' | 'low'>('high');

  // Load user profile to get energy level and wake-up time
  useEffect(() => {
    const loadProfile = async () => {
      try {
        const response = await profileService.getProfile();
        const profile = response.profile;
        
        // Set wake-up time from profile
        if (profile.wake_up_time) {
          setWakeUpTime(profile.wake_up_time);
        }
        
        // Get current time-based energy level from profile's energy pattern
        const currentHour = new Date().getHours();
        const energyPattern = profile.energy_pattern || [];
        
        // Find energy level for current time
        let energy: 'low' | 'medium' | 'high' = 'medium';
        
        if (energyPattern.length > 0) {
          // Find the closest time slot
          for (const slot of energyPattern) {
            const slotHour = parseInt(slot.time.split(':')[0]);
            if (currentHour >= slotHour) {
              energy = slot.level;
            }
          }
        }
        
        setProfileEnergyLevel(energy);
      } catch (err) {
        console.error('Failed to load profile:', err);
        // Default values if profile not available
        setProfileEnergyLevel('medium');
        setWakeUpTime('07:00');
      }
    };

    loadProfile();
  }, []);

  // Manual mode state - duration-based tasks
  interface ManualTask {
    purpose: string;
    duration: number; // in minutes
  }
  
  const [manualTasks, setManualTasks] = useState<ManualTask[]>([
    { purpose: '', duration: 60 }
  ]);

  // Natural language mode state
  const [naturalLanguageInput, setNaturalLanguageInput] = useState('');

  const handleGenerate = async () => {
    setIsGenerating(true);
    setError(null);
    setShowSuccess(false);

    try {
      let response;

      if (mode === 'natural' && naturalLanguageInput.trim()) {
        // Natural language mode
        response = await routineService.generateFromNaturalLanguage(naturalLanguageInput, selectedDate);
      } else if (mode === 'manual') {
        // Manual mode - convert duration-based tasks to time slots
        const validTasks = manualTasks.filter(task => task.purpose.trim() && task.duration > 0);
        if (validTasks.length === 0) {
          throw new Error('Please add at least one task with a purpose and duration');
        }
        
        // Convert tasks to time slots starting from wake-up time
        const manualSlots: ManualTimeSlot[] = [];
        let currentTime = wakeUpTime;
        
        for (const task of validTasks) {
          const [hours, minutes] = currentTime.split(':').map(Number);
          const startMinutes = hours * 60 + minutes;
          const endMinutes = startMinutes + task.duration;
          const endHours = Math.floor(endMinutes / 60) % 24;
          const endMins = endMinutes % 60;
          
          const endTime = `${String(endHours).padStart(2, '0')}:${String(endMins).padStart(2, '0')}`;
          
          manualSlots.push({
            start: currentTime,
            end: endTime,
            purpose: task.purpose
          });
          
          currentTime = endTime;
        }
        
        response = await routineService.generateWithManualSlots(manualSlots, selectedDate);
      } else {
        // Automatic mode (V3 with AI) - use profile energy level
        response = await routineService.generateDailyRoutine({
          date: selectedDate,
          mode: 'automatic',
          energy_level: profileEnergyLevel,
          priorityFocus: priorityFocus
        });
      }

      const generatedRoutine = response.routine;
      console.log('RoutineGeneratorV3: Generated routine:', generatedRoutine);
      console.log('RoutineGeneratorV3: Routine date:', generatedRoutine.date);
      setRoutine(generatedRoutine);
      setShowSuccess(true);
      setIsEditingRoutine(false);

      if (onRoutineGenerated) {
        console.log('RoutineGeneratorV3: Calling onRoutineGenerated callback');
        onRoutineGenerated(generatedRoutine);
      }

      setTimeout(() => setShowSuccess(false), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate routine');
    } finally {
      setIsGenerating(false);
    }
  };

  const addManualTask = () => {
    setManualTasks([...manualTasks, { purpose: '', duration: 60 }]);
  };

  const removeManualTask = (index: number) => {
    if (manualTasks.length > 1) {
      setManualTasks(manualTasks.filter((_, i) => i !== index));
    }
  };

  const updateManualTask = (index: number, field: keyof ManualTask, value: string | number) => {
    const updated = [...manualTasks];
    updated[index] = { ...updated[index], [field]: value };
    setManualTasks(updated);
  };

  const handleEditRoutine = () => {
    setIsEditingRoutine(true);
  };

  const handleSaveRoutineEdit = () => {
    setIsEditingRoutine(false);
    // Routine is already updated in state
  };

  const handleClearRoutine = () => {
    setRoutine(null);
    setShowSuccess(false);
    setError(null);
    setIsEditingRoutine(false);
  };

  const updateRoutineSegment = (segmentId: string, field: string, value: any) => {
    if (!routine) return;
    
    const updatedSegments = routine.segments.map(segment => 
      segment.id === segmentId 
        ? { ...segment, [field]: value }
        : segment
    );
    
    setRoutine({ ...routine, segments: updatedSegments });
  };

  const formatTime = (timeStr: string) => {
    const [hours, minutes] = timeStr.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  return (
    <div className="space-y-6">
      {/* Profile Info Display */}
      <div className="border border-white/5 rounded-lg p-4 bg-white/5">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-6">
            <div>
              <span className="text-xs text-slate-500">Current Energy</span>
              <div className="flex items-center space-x-2 mt-1">
                <span className="text-2xl">
                  {profileEnergyLevel === 'low' && '😴'}
                  {profileEnergyLevel === 'medium' && '😊'}
                  {profileEnergyLevel === 'high' && '⚡'}
                </span>
                <span className="text-white font-medium capitalize">{profileEnergyLevel}</span>
              </div>
            </div>
            <div className="border-l border-white/10 pl-6">
              <span className="text-xs text-slate-500">Wake-up Time</span>
              <div className="text-white font-medium mt-1">{formatTime(wakeUpTime)}</div>
            </div>
          </div>
          <div className="text-xs text-slate-500">
            From your profile
          </div>
        </div>
      </div>

      {/* Date Selection */}
      <div className="border border-white/5 rounded-lg p-4 bg-white/5">
        <div className="flex items-center justify-between">
          <div>
            <label className="block text-sm font-medium text-slate-400 mb-2">
              Generate routine for
            </label>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              min={new Date().toISOString().split('T')[0]}
              className="px-3 py-2 border border-white/10 bg-transparent text-white rounded-lg focus:outline-none focus:border-white/20"
            />
          </div>
          <div className="text-xs text-slate-500">
            {selectedDate === new Date().toISOString().split('T')[0] ? 'Today' : 
             new Date(selectedDate + 'T00:00:00').toLocaleDateString('en-US', { 
               weekday: 'long', 
               month: 'short', 
               day: 'numeric' 
             })}
          </div>
        </div>
      </div>

      {/* Mode Selection */}
      <div className="border border-white/5 rounded-lg p-6">
        <h2 className="text-xl font-bold text-white mb-4">Generate Your Routine</h2>
        
        <div className="grid grid-cols-3 gap-3 mb-6">
          <button
            onClick={() => setMode('automatic')}
            className={`p-4 rounded-lg border transition-all ${
              mode === 'automatic'
                ? 'border-white bg-white/10 text-white'
                : 'border-white/10 text-slate-400 hover:border-white/20'
            }`}
          >
            <div className="text-2xl mb-2">🤖</div>
            <div className="font-medium">AI Automatic</div>
            <div className="text-xs mt-1">Let AI plan your day</div>
          </button>

          <button
            onClick={() => setMode('manual')}
            className={`p-4 rounded-lg border transition-all ${
              mode === 'manual'
                ? 'border-white bg-white/10 text-white'
                : 'border-white/10 text-slate-400 hover:border-white/20'
            }`}
          >
            <div className="text-2xl mb-2">✏️</div>
            <div className="font-medium">Manual Slots</div>
            <div className="text-xs mt-1">Define your time blocks</div>
          </button>

          <button
            onClick={() => setMode('natural')}
            className={`p-4 rounded-lg border transition-all ${
              mode === 'natural'
                ? 'border-white bg-white/10 text-white'
                : 'border-white/10 text-slate-400 hover:border-white/20'
            }`}
          >
            <div className="text-2xl mb-2">💬</div>
            <div className="font-medium">Natural Language</div>
            <div className="text-xs mt-1">Describe your day</div>
          </button>
        </div>

        {/* Automatic Mode Options */}
        {mode === 'automatic' && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-400 mb-2">
                Priority Focus
              </label>
              <div className="grid grid-cols-4 gap-2">
                {(['critical', 'high', 'medium', 'low'] as const).map((priority) => (
                  <button
                    key={priority}
                    onClick={() => setPriorityFocus(priority)}
                    className={`px-4 py-2 rounded-lg border transition-all ${
                      priorityFocus === priority
                        ? 'border-white bg-white/10 text-white'
                        : 'border-white/10 text-slate-400 hover:border-white/20'
                    }`}
                  >
                    {priority.charAt(0).toUpperCase() + priority.slice(1)}
                  </button>
                ))}
              </div>
            </div>
            <p className="text-xs text-slate-500">
              💡 Your routine will be optimized based on your current energy level ({profileEnergyLevel}) and wake-up time ({formatTime(wakeUpTime)})
            </p>
          </div>
        )}

        {/* Manual Mode Options */}
        {mode === 'manual' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium text-slate-400">
                Define Your Tasks
              </label>
              <button
                onClick={addManualTask}
                className="px-3 py-1 text-sm border border-white/10 hover:border-white/20 text-white rounded-lg transition-colors"
              >
                + Add Task
              </button>
            </div>

            <p className="text-xs text-slate-500 mb-3">
              Tasks will start from your wake-up time: {formatTime(wakeUpTime)}
            </p>

            {manualTasks.map((task, index) => (
              <div key={index} className="border border-white/5 rounded-lg p-4">
                <div className="flex items-start space-x-3">
                  <div className="flex-1 space-y-3">
                    <div>
                      <label className="block text-xs text-slate-500 mb-1">What do you want to do?</label>
                      <input
                        type="text"
                        value={task.purpose}
                        onChange={(e) => updateManualTask(index, 'purpose', e.target.value)}
                        placeholder="e.g., Deep work on React project, Study algorithms..."
                        className="w-full px-3 py-2 border border-white/10 bg-transparent text-white rounded-lg focus:outline-none focus:border-white/20 placeholder-slate-600"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-slate-500 mb-1">How long? (minutes)</label>
                      <div className="flex items-center space-x-2">
                        <input
                          type="number"
                          value={task.duration}
                          onChange={(e) => updateManualTask(index, 'duration', parseInt(e.target.value) || 0)}
                          min="15"
                          step="15"
                          className="w-32 px-3 py-2 border border-white/10 bg-transparent text-white rounded-lg focus:outline-none focus:border-white/20"
                        />
                        <div className="flex space-x-1">
                          {[30, 60, 90, 120].map(duration => (
                            <button
                              key={duration}
                              onClick={() => updateManualTask(index, 'duration', duration)}
                              className={`px-3 py-1 text-xs rounded border transition-all ${
                                task.duration === duration
                                  ? 'border-white bg-white/10 text-white'
                                  : 'border-white/10 text-slate-400 hover:border-white/20'
                              }`}
                            >
                              {duration}m
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                  {manualTasks.length > 1 && (
                    <button
                      onClick={() => removeManualTask(index)}
                      className="p-2 text-slate-400 hover:text-white transition-colors"
                    >
                      ✕
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Natural Language Mode Options */}
        {mode === 'natural' && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-400 mb-2">
                Describe Your Ideal Day
              </label>
              <textarea
                value={naturalLanguageInput}
                onChange={(e) => setNaturalLanguageInput(e.target.value)}
                placeholder="Example: I want to focus on learning React hooks in the morning, practice algorithms in the afternoon, and review my notes in the evening. I also need time for a workout and lunch."
                rows={5}
                className="w-full px-4 py-3 border border-white/10 bg-transparent text-white rounded-lg focus:outline-none focus:border-white/20 placeholder-slate-600 resize-none"
              />
              <p className="text-xs text-slate-500 mt-2">
                💡 Tip: Be specific about what you want to do and when. The AI will create a detailed schedule based on your description.
              </p>
            </div>
          </div>
        )}

        {/* Generate Button */}
        <button
          onClick={handleGenerate}
          disabled={isGenerating || (mode === 'natural' && !naturalLanguageInput.trim())}
          className={`
            w-full mt-6 px-6 py-4 rounded-lg font-semibold text-lg
            transform transition-all duration-200
            ${isGenerating || (mode === 'natural' && !naturalLanguageInput.trim())
              ? 'bg-white/20 cursor-not-allowed text-slate-500'
              : 'bg-white text-slate-950 hover:bg-slate-100 hover:scale-105 active:scale-95'
            }
          `}
        >
          {isGenerating ? (
            <span className="flex items-center justify-center space-x-2">
              <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              <span>Generating Your Routine...</span>
            </span>
          ) : routine && !showSuccess ? (
            <span>🔄 Generate New Routine</span>
          ) : (
            <span>🚀 Generate Routine</span>
          )}
        </button>
      </div>

      {/* Success Message */}
      {showSuccess && (
        <div className="border border-white/10 rounded-lg p-4 animate-fade-in">
          <p className="text-white font-medium text-center">
            ✅ Your routine is ready! Check the Routine Viewer tab to see your schedule.
          </p>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="border border-white/10 rounded-lg p-4">
          <p className="text-slate-400 font-medium">❌ {error}</p>
        </div>
      )}

      {/* Routine Preview with Editing */}
      {routine && !showSuccess && (
        <div className="border border-white/5 rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-white">Generated Routine</h3>
            <div className="flex items-center space-x-3">
              <span className="text-sm text-slate-500">
                {routine.segments.length} activities
              </span>
              <div className="flex items-center space-x-2">
                {!isEditingRoutine ? (
                  <>
                    <button
                      onClick={handleEditRoutine}
                      className="px-3 py-1 text-sm border border-white/10 hover:border-white/20 text-white rounded-lg transition-colors"
                    >
                      ✏️ Edit
                    </button>
                    <button
                      onClick={handleClearRoutine}
                      className="px-3 py-1 text-sm border border-red-500/20 hover:border-red-500/40 text-red-400 hover:text-red-300 rounded-lg transition-colors"
                    >
                      🗑️ Clear
                    </button>
                  </>
                ) : (
                  <button
                    onClick={handleSaveRoutineEdit}
                    className="px-3 py-1 text-sm bg-white text-slate-950 hover:bg-slate-100 rounded-lg transition-colors"
                  >
                    ✓ Save
                  </button>
                )}
              </div>
            </div>
          </div>

          <div className="space-y-2">
            {routine.segments.map((segment) => (
              <div
                key={segment.id}
                className="border border-white/5 rounded-lg p-3 hover:border-white/10 transition-colors"
              >
                {isEditingRoutine ? (
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <span className="text-xl">{routineService.getActivityTypeIcon(segment.type)}</span>
                      <input
                        type="text"
                        value={segment.activity}
                        onChange={(e) => updateRoutineSegment(segment.id, 'activity', e.target.value)}
                        className="flex-1 px-2 py-1 border border-white/10 bg-transparent text-white rounded focus:outline-none focus:border-white/20"
                      />
                    </div>
                    <div className="flex items-center space-x-2 text-xs">
                      <input
                        type="time"
                        value={segment.time_slot.start_time}
                        onChange={(e) => updateRoutineSegment(segment.id, 'time_slot', { ...segment.time_slot, start_time: e.target.value })}
                        className="px-2 py-1 border border-white/10 bg-transparent text-slate-400 rounded focus:outline-none focus:border-white/20"
                      />
                      <span className="text-slate-500">to</span>
                      <input
                        type="time"
                        value={segment.time_slot.end_time}
                        onChange={(e) => updateRoutineSegment(segment.id, 'time_slot', { ...segment.time_slot, end_time: e.target.value })}
                        className="px-2 py-1 border border-white/10 bg-transparent text-slate-400 rounded focus:outline-none focus:border-white/20"
                      />
                      <span className="text-slate-500 ml-2">({segment.duration} min)</span>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <span className="text-xl">{routineService.getActivityTypeIcon(segment.type)}</span>
                      <span className="font-medium text-white text-sm">{segment.activity}</span>
                    </div>
                    <span className="text-xs text-slate-400">
                      {formatTime(segment.time_slot.start_time)} - {formatTime(segment.time_slot.end_time)}
                    </span>
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="mt-4 p-3 border border-white/10 rounded-lg">
            <p className="text-sm text-slate-400">
              💡 {isEditingRoutine 
                ? 'Edit your routine activities and times, then click Save.' 
                : 'View the complete routine in the Routine Viewer tab to track your progress. Use Clear to start over or Generate New Routine to create another one.'}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default RoutineGeneratorV3;
