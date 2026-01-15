import React, { useState, useEffect } from 'react';
import { Coffee, Leaf, Eye, Headphones, Book, Moon, Sun, Clock, RefreshCw, Play, Pause, CheckCircle, Zap } from 'lucide-react';

interface BreakActivity {
  id: string;
  name: string;
  description: string;
  duration: number; // in minutes
  category: 'movement' | 'mindfulness' | 'rest' | 'nature' | 'creative';
  stimulation_level: 'very_low' | 'low' | 'minimal';
  benefits: string[];
  instructions: string[];
  best_time: 'morning' | 'afternoon' | 'evening' | 'anytime';
  energy_requirement: 'very_low' | 'low' | 'moderate';
}

interface LowStimulationBreaksProps {
  currentEnergyLevel?: 'high' | 'medium' | 'low';
  timeOfDay?: 'morning' | 'afternoon' | 'evening';
  className?: string;
}

export const LowStimulationBreaks: React.FC<LowStimulationBreaksProps> = ({ 
  currentEnergyLevel = 'medium',
  timeOfDay = 'afternoon',
  className = ''
}) => {
  const [activities, setActivities] = useState<BreakActivity[]>([]);
  const [selectedActivity, setSelectedActivity] = useState<BreakActivity | null>(null);
  const [isActive, setIsActive] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [completedActivities, setCompletedActivities] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadBreakActivities();
  }, [currentEnergyLevel, timeOfDay]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isActive && timeRemaining > 0) {
      interval = setInterval(() => {
        setTimeRemaining(time => {
          if (time <= 1) {
            setIsActive(false);
            if (selectedActivity) {
              handleActivityComplete(selectedActivity.id);
            }
            return 0;
          }
          return time - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isActive, timeRemaining, selectedActivity]);

  const loadBreakActivities = async () => {
    try {
      setLoading(true);
      setError(null);

      // For now, use predefined activities. In a real implementation, 
      // this would fetch from an API based on user preferences and context
      const predefinedActivities: BreakActivity[] = [
        {
          id: '1',
          name: 'Deep Breathing',
          description: 'Simple breathing exercise to reset focus and calm the mind',
          duration: 5,
          category: 'mindfulness',
          stimulation_level: 'very_low',
          benefits: ['Reduces stress', 'Improves focus', 'Calms nervous system'],
          instructions: [
            'Sit comfortably with feet flat on floor',
            'Close eyes or soften gaze',
            'Breathe in slowly for 4 counts',
            'Hold breath for 4 counts',
            'Exhale slowly for 6 counts',
            'Repeat for the full duration'
          ],
          best_time: 'anytime',
          energy_requirement: 'very_low'
        },
        {
          id: '2',
          name: 'Gentle Stretching',
          description: 'Light stretches to release tension without increasing stimulation',
          duration: 10,
          category: 'movement',
          stimulation_level: 'low',
          benefits: ['Releases muscle tension', 'Improves circulation', 'Maintains alertness'],
          instructions: [
            'Stand and reach arms overhead',
            'Gentle neck rolls (both directions)',
            'Shoulder blade squeezes',
            'Seated spinal twist',
            'Ankle circles and calf raises',
            'Hold each stretch for 30 seconds'
          ],
          best_time: 'anytime',
          energy_requirement: 'low'
        },
        {
          id: '3',
          name: 'Window Gazing',
          description: 'Look out the window to rest eyes and mind without overstimulation',
          duration: 3,
          category: 'rest',
          stimulation_level: 'very_low',
          benefits: ['Rests eyes', 'Reduces mental fatigue', 'Provides natural stimulation'],
          instructions: [
            'Find a window with a natural view',
            'Sit or stand comfortably',
            'Let your eyes relax and unfocus',
            'Notice natural elements (trees, sky, clouds)',
            'Avoid analyzing or thinking',
            'Simply observe without judgment'
          ],
          best_time: 'anytime',
          energy_requirement: 'very_low'
        },
        {
          id: '4',
          name: 'Mindful Water Drinking',
          description: 'Slow, mindful hydration to reset attention',
          duration: 2,
          category: 'mindfulness',
          stimulation_level: 'very_low',
          benefits: ['Hydrates body', 'Provides mental reset', 'Grounds attention'],
          instructions: [
            'Get a glass of room temperature water',
            'Hold the glass mindfully',
            'Notice the temperature and weight',
            'Drink slowly, feeling each sip',
            'Focus on the sensation of swallowing',
            'Take 3-4 mindful sips'
          ],
          best_time: 'anytime',
          energy_requirement: 'very_low'
        },
        {
          id: '5',
          name: 'Progressive Muscle Relaxation',
          description: 'Brief tension and release cycle to reduce physical stress',
          duration: 8,
          category: 'mindfulness',
          stimulation_level: 'low',
          benefits: ['Reduces muscle tension', 'Lowers stress', 'Improves body awareness'],
          instructions: [
            'Sit comfortably in your chair',
            'Tense shoulders for 5 seconds, then release',
            'Tense hands into fists for 5 seconds, then release',
            'Tense facial muscles for 5 seconds, then release',
            'Tense leg muscles for 5 seconds, then release',
            'Notice the contrast between tension and relaxation'
          ],
          best_time: 'afternoon',
          energy_requirement: 'low'
        },
        {
          id: '6',
          name: 'Quiet Sitting',
          description: 'Simply sit quietly without any agenda or stimulation',
          duration: 5,
          category: 'rest',
          stimulation_level: 'very_low',
          benefits: ['Mental reset', 'Reduces overstimulation', 'Restores attention'],
          instructions: [
            'Sit in a comfortable chair',
            'Place hands gently on lap',
            'Close eyes or look down softly',
            'Don\'t try to meditate or think',
            'Simply exist in the moment',
            'Let thoughts come and go naturally'
          ],
          best_time: 'anytime',
          energy_requirement: 'very_low'
        },
        {
          id: '7',
          name: 'Gentle Hand Massage',
          description: 'Self-massage to release tension and provide grounding',
          duration: 4,
          category: 'movement',
          stimulation_level: 'low',
          benefits: ['Releases hand tension', 'Improves circulation', 'Provides tactile grounding'],
          instructions: [
            'Rub palms together to warm hands',
            'Massage each finger from base to tip',
            'Press and release pressure points in palms',
            'Gently rotate wrists in both directions',
            'Stretch fingers wide, then make gentle fists',
            'End with palms pressed together'
          ],
          best_time: 'anytime',
          energy_requirement: 'very_low'
        },
        {
          id: '8',
          name: 'Slow Walking',
          description: 'Very slow, mindful walking to reset without overstimulation',
          duration: 6,
          category: 'movement',
          stimulation_level: 'low',
          benefits: ['Gentle movement', 'Improves circulation', 'Mental reset'],
          instructions: [
            'Stand and take three deep breaths',
            'Walk very slowly (half normal pace)',
            'Focus on the sensation of each step',
            'Keep path short (10-15 steps)',
            'Turn around slowly and repeat',
            'Maintain soft, downward gaze'
          ],
          best_time: 'anytime',
          energy_requirement: 'low'
        }
      ];

      // Filter activities based on current context
      const filteredActivities = predefinedActivities.filter(activity => {
        const energyMatch = 
          (currentEnergyLevel === 'low' && activity.energy_requirement === 'very_low') ||
          (currentEnergyLevel === 'medium' && ['very_low', 'low'].includes(activity.energy_requirement)) ||
          (currentEnergyLevel === 'high' && ['very_low', 'low', 'moderate'].includes(activity.energy_requirement));
        
        const timeMatch = activity.best_time === 'anytime' || activity.best_time === timeOfDay;
        
        return energyMatch && timeMatch;
      });

      setActivities(filteredActivities);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load break activities');
    } finally {
      setLoading(false);
    }
  };

  const startActivity = (activity: BreakActivity) => {
    setSelectedActivity(activity);
    setTimeRemaining(activity.duration * 60); // Convert minutes to seconds
    setIsActive(true);
  };

  const pauseActivity = () => {
    setIsActive(false);
  };

  const resumeActivity = () => {
    setIsActive(true);
  };

  const stopActivity = () => {
    setIsActive(false);
    setTimeRemaining(0);
    setSelectedActivity(null);
  };

  const handleActivityComplete = (activityId: string) => {
    setCompletedActivities(prev => [...prev, activityId]);
    setSelectedActivity(null);
    setTimeRemaining(0);
  };

  const formatTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'movement':
        return <RefreshCw className="w-5 h-5 text-green-600" />;
      case 'mindfulness':
        return <Eye className="w-5 h-5 text-purple-600" />;
      case 'rest':
        return <Moon className="w-5 h-5 text-blue-600" />;
      case 'nature':
        return <Leaf className="w-5 h-5 text-green-600" />;
      case 'creative':
        return <Book className="w-5 h-5 text-orange-600" />;
      default:
        return <Coffee className="w-5 h-5 text-gray-600" />;
    }
  };

  const getStimulationColor = (level: string): string => {
    switch (level) {
      case 'very_low':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'low':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'minimal':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  if (loading) {
    return (
      <div className={`flex items-center justify-center p-8 ${className}`}>
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <Coffee className="w-6 h-6 text-green-600" />
            <h2 className="text-xl font-semibold text-gray-900">Low-Stimulation Breaks</h2>
          </div>
          
          <div className="flex items-center space-x-4 text-sm text-gray-600">
            <div className="flex items-center space-x-2">
              <Sun className="w-4 h-4" />
              <span className="capitalize">{timeOfDay}</span>
            </div>
            <div className="flex items-center space-x-2">
              <Zap className="w-4 h-4" />
              <span className="capitalize">{currentEnergyLevel} energy</span>
            </div>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-700">{error}</p>
          </div>
        )}

        <p className="text-gray-600">
          Choose a gentle activity to reset your focus without overstimulation. 
          These breaks are designed to maintain your attention capacity while providing necessary rest.
        </p>
      </div>

      {/* Active Break Timer */}
      {selectedActivity && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="text-center">
            <div className="flex items-center justify-center mb-4">
              {getCategoryIcon(selectedActivity.category)}
              <h3 className="text-lg font-semibold text-gray-900 ml-2">
                {selectedActivity.name}
              </h3>
            </div>
            
            <div className="text-4xl font-bold text-blue-600 mb-4">
              {formatTime(timeRemaining)}
            </div>
            
            <div className="flex items-center justify-center space-x-4 mb-6">
              {!isActive ? (
                <button
                  onClick={resumeActivity}
                  className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                >
                  <Play className="w-4 h-4" />
                  <span>Start</span>
                </button>
              ) : (
                <button
                  onClick={pauseActivity}
                  className="flex items-center space-x-2 px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700"
                >
                  <Pause className="w-4 h-4" />
                  <span>Pause</span>
                </button>
              )}
              
              <button
                onClick={stopActivity}
                className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
              >
                Stop
              </button>
            </div>

            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="font-medium text-gray-900 mb-2">Instructions:</h4>
              <ol className="text-sm text-gray-700 space-y-1 text-left">
                {selectedActivity.instructions.map((instruction, index) => (
                  <li key={index} className="flex items-start space-x-2">
                    <span className="text-blue-600 font-medium">{index + 1}.</span>
                    <span>{instruction}</span>
                  </li>
                ))}
              </ol>
            </div>
          </div>
        </div>
      )}

      {/* Available Activities */}
      {!selectedActivity && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Recommended Activities
          </h3>
          
          {activities.length === 0 ? (
            <div className="text-center py-8">
              <Coffee className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">No activities available for current context.</p>
              <p className="text-sm text-gray-500 mt-2">
                Try adjusting your energy level or time of day.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {activities.map((activity) => (
                <div key={activity.id} className="border border-gray-200 rounded-lg p-4 hover:border-blue-300 transition-colors">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center space-x-2">
                      {getCategoryIcon(activity.category)}
                      <h4 className="font-medium text-gray-900">{activity.name}</h4>
                      {completedActivities.includes(activity.id) && (
                        <CheckCircle className="w-4 h-4 text-green-600" />
                      )}
                    </div>
                    <div className="flex items-center space-x-2">
                      <Clock className="w-4 h-4 text-gray-500" />
                      <span className="text-sm text-gray-600">{activity.duration}m</span>
                    </div>
                  </div>
                  
                  <p className="text-sm text-gray-600 mb-3">{activity.description}</p>
                  
                  <div className="flex items-center justify-between mb-3">
                    <span className={`px-2 py-1 text-xs font-medium rounded border ${getStimulationColor(activity.stimulation_level)}`}>
                      {activity.stimulation_level.replace('_', ' ')} stimulation
                    </span>
                    <span className="text-xs text-gray-500 capitalize">
                      {activity.category}
                    </span>
                  </div>
                  
                  <div className="mb-3">
                    <h5 className="text-xs font-medium text-gray-700 mb-1">Benefits:</h5>
                    <div className="flex flex-wrap gap-1">
                      {activity.benefits.slice(0, 2).map((benefit, index) => (
                        <span key={index} className="text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded">
                          {benefit}
                        </span>
                      ))}
                    </div>
                  </div>
                  
                  <button
                    onClick={() => startActivity(activity)}
                    className="w-full px-3 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Start Break
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Completed Activities Summary */}
      {completedActivities.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Today's Completed Breaks
          </h3>
          <div className="flex flex-wrap gap-2">
            {completedActivities.map((activityId, index) => {
              const activity = activities.find(a => a.id === activityId);
              return activity ? (
                <div key={index} className="flex items-center space-x-2 bg-green-50 text-green-800 px-3 py-1 rounded-full text-sm">
                  <CheckCircle className="w-3 h-3" />
                  <span>{activity.name}</span>
                </div>
              ) : null;
            })}
          </div>
          <p className="text-sm text-gray-600 mt-2">
            Great job taking {completedActivities.length} low-stimulation break{completedActivities.length !== 1 ? 's' : ''} today!
          </p>
        </div>
      )}
    </div>
  );
};