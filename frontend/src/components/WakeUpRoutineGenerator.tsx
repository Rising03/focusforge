import React, { useState } from 'react';
import { routineService } from '../services/routineService';
import { DailyRoutine } from '../types/routine';

interface WakeUpRoutineGeneratorProps {
  onRoutineGenerated?: (routine: DailyRoutine) => void;
}

const WakeUpRoutineGenerator: React.FC<WakeUpRoutineGeneratorProps> = ({ onRoutineGenerated }) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [routine, setRoutine] = useState<DailyRoutine | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const [hasClassToday, setHasClassToday] = useState<boolean | null>(null);
  const [classStartTime, setClassStartTime] = useState<string>('09:00');
  const [classEndTime, setClassEndTime] = useState<string>('15:00');

  // Check if today is a class day (you can customize these days)
  const getClassDays = () => {
    const today = new Date().getDay(); // 0 = Sunday, 1 = Monday, etc.
    // Default: Classes on Monday (1), Wednesday (3), Friday (5)
    return [1, 3, 5].includes(today);
  };

  const handleWakeUp = async (hasClass?: boolean) => {
    setIsGenerating(true);
    setError(null);
    setShowSuccess(false);

    try {
      const today = new Date().toISOString().split('T')[0];
      const currentHour = new Date().getHours();
      const isClassDay = hasClass !== undefined ? hasClass : getClassDays();
      
      // Determine energy level based on wake-up time
      let energyLevel: 'low' | 'medium' | 'high' = 'medium';
      if (currentHour < 6 || currentHour > 22) {
        energyLevel = 'low'; // Very early or very late
      } else if (currentHour >= 6 && currentHour <= 9) {
        energyLevel = 'high'; // Morning energy
      }

      // Calculate university hours from time range
      let universityHours: number | undefined;
      if (isClassDay) {
        const [startHour, startMin] = classStartTime.split(':').map(Number);
        const [endHour, endMin] = classEndTime.split(':').map(Number);
        const startMinutes = startHour * 60 + startMin;
        const endMinutes = endHour * 60 + endMin;
        universityHours = Math.max(1, Math.round((endMinutes - startMinutes) / 60));
      }

      // Generate routine for today with class schedule consideration (V3 automatic mode)
      const response = await routineService.generateDailyRoutine({
        date: today,
        mode: 'automatic', // V3: Use AI-powered automatic mode
        energy_level: energyLevel,
        priorityFocus: 'high', // V3: Default to high priority focus
        has_classes: isClassDay,
        university_hours: universityHours,
        class_start_time: isClassDay ? classStartTime : undefined,
        class_end_time: isClassDay ? classEndTime : undefined
      });

      const generatedRoutine = response.routine;
      setRoutine(generatedRoutine);
      setShowSuccess(true);

      if (onRoutineGenerated) {
        onRoutineGenerated(generatedRoutine);
      }

      // Hide success message after 3 seconds
      setTimeout(() => setShowSuccess(false), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate routine');
    } finally {
      setIsGenerating(false);
    }
  };

  const formatTime = (timeStr: string) => {
    const [hours, minutes] = timeStr.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  return (
    <div className="border border-white/5 rounded-lg p-6">
      {/* Wake Up Button */}
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-white mb-2">
          Good {new Date().getHours() < 12 ? 'Morning' : new Date().getHours() < 18 ? 'Afternoon' : 'Evening'}! 🌅
        </h2>
        <p className="text-slate-400 mb-2">
          Ready to start your day? Generate your personalized routine now!
        </p>
        <p className="text-sm text-white font-medium">
          ⏰ Current time: {new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })} - Routine will adapt to your wake-up time!
        </p>
      </div>

        {/* Class Schedule Question */}
        {hasClassToday === null && !isGenerating && !routine && (
          <div className="mb-6 p-4 border border-white/5 rounded-lg">
            <p className="text-white font-medium mb-3">Do you have classes today?</p>
            <div className="flex justify-center space-x-3">
              <button
                onClick={() => setHasClassToday(true)}
                className="px-6 py-3 bg-white text-slate-950 rounded-lg font-medium hover:bg-slate-100 transition-colors"
              >
                📚 Yes, I have classes
              </button>
              <button
                onClick={() => {
                  setHasClassToday(false);
                  handleWakeUp(false);
                }}
                className="px-6 py-3 bg-white text-slate-950 rounded-lg font-medium hover:bg-slate-100 transition-colors"
              >
                🏠 No, free day
              </button>
            </div>
            <p className="text-xs text-slate-500 mt-3">
              {getClassDays() ? '📅 Auto-detected: Class day (Mon/Wed/Fri)' : '📅 Auto-detected: Free day'}
            </p>
          </div>
        )}

        {/* Class Time Range Input (shown when user selects "Yes, I have classes") */}
        {hasClassToday === true && !isGenerating && !routine && (
          <div className="mb-6 p-4 border border-white/5 rounded-lg">
            <p className="text-white font-medium mb-4">What time are your classes?</p>
            
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm text-slate-400 mb-2">Start Time</label>
                <input
                  type="time"
                  value={classStartTime}
                  onChange={(e) => setClassStartTime(e.target.value)}
                  className="w-full px-3 py-2 border border-white/10 bg-transparent text-white rounded-lg focus:outline-none focus:border-white/20"
                />
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-2">End Time</label>
                <input
                  type="time"
                  value={classEndTime}
                  onChange={(e) => setClassEndTime(e.target.value)}
                  className="w-full px-3 py-2 border border-white/10 bg-transparent text-white rounded-lg focus:outline-none focus:border-white/20"
                />
              </div>
            </div>

            {/* Quick preset buttons */}
            <div className="mb-4">
              <p className="text-xs text-slate-500 mb-2">Quick presets:</p>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => {
                    setClassStartTime('09:00');
                    setClassEndTime('12:00');
                  }}
                  className="px-3 py-2 border border-white/10 hover:border-white/20 bg-transparent text-white rounded-lg text-sm transition-colors"
                >
                  🌅 Morning (9-12)
                </button>
                <button
                  onClick={() => {
                    setClassStartTime('13:00');
                    setClassEndTime('17:00');
                  }}
                  className="px-3 py-2 border border-white/10 hover:border-white/20 bg-transparent text-white rounded-lg text-sm transition-colors"
                >
                  🌞 Afternoon (1-5)
                </button>
                <button
                  onClick={() => {
                    setClassStartTime('09:00');
                    setClassEndTime('15:00');
                  }}
                  className="px-3 py-2 border border-white/10 hover:border-white/20 bg-transparent text-white rounded-lg text-sm transition-colors"
                >
                  📚 Full Day (9-3)
                </button>
                <button
                  onClick={() => {
                    setClassStartTime('10:00');
                    setClassEndTime('14:00');
                  }}
                  className="px-3 py-2 border border-white/10 hover:border-white/20 bg-transparent text-white rounded-lg text-sm transition-colors"
                >
                  ⏰ Mid Day (10-2)
                </button>
              </div>
            </div>

            <button
              onClick={() => handleWakeUp(true)}
              className="w-full px-6 py-3 bg-white text-slate-950 rounded-lg font-medium hover:bg-slate-100 transition-colors"
            >
              Generate Routine ({classStartTime} - {classEndTime})
            </button>
          </div>
        )}

        {/* Generate Button (shown after selection or for regeneration) */}
        {(hasClassToday !== null || routine) && (
          <button
            onClick={() => handleWakeUp(hasClassToday ?? undefined)}
            disabled={isGenerating}
            className={`
              px-8 py-4 rounded-lg font-semibold text-lg
              transform transition-all duration-200
              ${isGenerating 
                ? 'bg-white/20 cursor-not-allowed' 
                : 'bg-white text-slate-950 hover:bg-slate-100 hover:scale-105 active:scale-95'
              }
            `}
          >
            {isGenerating ? (
              <span className="flex items-center space-x-2">
                <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                <span>Generating Your Routine...</span>
              </span>
            ) : routine ? (
              <span className="flex items-center space-x-2">
                <span>🔄</span>
                <span>Regenerate Routine</span>
              </span>
            ) : (
              <span className="flex items-center space-x-2">
                <span>☀️</span>
                <span>Generate My Routine!</span>
              </span>
            )}
          </button>
        )}

      {/* Success Message */}
      {showSuccess && (
        <div className="mb-4 p-4 border border-white/10 rounded-lg animate-fade-in">
          <p className="text-white font-medium text-center">
            ✅ Your routine is ready! Check the Profile & Routines tab to see your schedule.
          </p>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="mb-4 p-4 border border-white/10 rounded-lg">
          <p className="text-slate-400 font-medium">❌ {error}</p>
          <p className="text-slate-500 text-sm mt-1">
            Make sure you've completed your profile first.
          </p>
        </div>
      )}

      {/* Routine Preview */}
      {routine && !showSuccess && (
        <div className="mt-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-white">Today's Schedule</h3>
            <span className="text-sm text-slate-500">
              {routine.segments.length} activities
            </span>
          </div>

          <div className="space-y-2">
            {routine.segments.map((segment) => (
              <div
                key={segment.id}
                className="border border-white/5 rounded-lg p-4 hover:border-white/10 transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-1">
                      <span className="text-2xl">{routineService.getActivityTypeIcon(segment.type)}</span>
                      <span className="font-medium text-white">{segment.activity}</span>
                    </div>
                    <div className="flex items-center space-x-4 text-sm text-slate-400">
                      <span className="flex items-center space-x-1">
                        <span>🕐</span>
                        <span>
                          {formatTime(segment.time_slot.start_time)} - {formatTime(segment.time_slot.end_time)}
                        </span>
                      </span>
                      <span className="flex items-center space-x-1">
                        <span>⏱️</span>
                        <span>{routineService.formatDuration(segment.duration)}</span>
                      </span>
                    </div>
                  </div>
                  <div className="px-3 py-1 rounded text-xs font-medium border border-white/10 text-slate-400">
                    {segment.priority}
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-4 p-4 border border-white/10 rounded-lg">
            <p className="text-sm text-slate-400">
              💡 <strong className="text-white">Tip:</strong> Your routine is personalized based on your wake-up time and energy level. 
              You can view and track your progress in the Profile & Routines tab.
            </p>
          </div>
        </div>
      )}

      {/* Info Box */}
      {!routine && !isGenerating && hasClassToday === null && (
        <div className="mt-6 p-4 border border-white/5 rounded-lg">
          <h4 className="font-semibold text-white mb-2">How it works:</h4>
          <ul className="space-y-2 text-sm text-slate-400">
            <li className="flex items-start space-x-2">
              <span className="text-white mt-0.5">✓</span>
              <span>Generates a routine based on your current wake-up time</span>
            </li>
            <li className="flex items-start space-x-2">
              <span className="text-white mt-0.5">✓</span>
              <span>Adapts to your energy level (morning, afternoon, or evening)</span>
            </li>
            <li className="flex items-start space-x-2">
              <span className="text-white mt-0.5">✓</span>
              <span>Adjusts schedule based on whether you have classes</span>
            </li>
            <li className="flex items-start space-x-2">
              <span className="text-white mt-0.5">✓</span>
              <span>Uses your profile goals and preferences</span>
            </li>
            <li className="flex items-start space-x-2">
              <span className="text-white mt-0.5">✓</span>
              <span>Perfect for inconsistent sleep schedules!</span>
            </li>
          </ul>
        </div>
      )}
    </div>
  );
};

export default WakeUpRoutineGenerator;
