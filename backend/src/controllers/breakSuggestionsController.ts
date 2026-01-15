import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth';
import { logger } from '../utils/logger';

interface BreakSuggestionRequest {
  duration: number;
  energy_level: 'low' | 'medium' | 'high';
  time_of_day: 'morning' | 'afternoon' | 'evening';
  previous_activity?: string;
  stimulation_tolerance: 'very_low' | 'low' | 'minimal';
}

interface BreakSuggestion {
  activity_name: string;
  description: string;
  duration: number;
  stimulation_level: 'very_low' | 'low' | 'minimal';
  attention_preservation_score: number;
  instructions: string[];
  benefits: string[];
}

export const suggestBreakActivities = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      res.status(401).json({ error: 'User not authenticated' });
      return;
    }

    const request: BreakSuggestionRequest = req.body;

    // Validate required fields
    if (!request.duration || !request.energy_level || !request.time_of_day || !request.stimulation_tolerance) {
      res.status(400).json({ 
        error: 'Missing required fields: duration, energy_level, time_of_day, and stimulation_tolerance are required' 
      });
      return;
    }

    // Generate break suggestions based on context
    const suggestions: BreakSuggestion[] = generateBreakSuggestions(request);

    res.json({
      success: true,
      data: {
        suggestions,
        context: {
          requested_duration: request.duration,
          energy_level: request.energy_level,
          time_of_day: request.time_of_day,
          stimulation_tolerance: request.stimulation_tolerance
        }
      }
    });
  } catch (error) {
    logger.error('Error in suggestBreakActivities controller:', error);
    res.status(500).json({ 
      error: 'Failed to generate break suggestions',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

function generateBreakSuggestions(request: BreakSuggestionRequest): BreakSuggestion[] {
  const baseActivities: BreakSuggestion[] = [
    {
      activity_name: 'Deep Breathing',
      description: 'Simple breathing exercise to reset focus and calm the mind',
      duration: Math.min(5, request.duration),
      stimulation_level: 'very_low',
      attention_preservation_score: 0.95,
      instructions: [
        'Sit comfortably with feet flat on floor',
        'Close eyes or soften gaze',
        'Breathe in slowly for 4 counts',
        'Hold breath for 4 counts',
        'Exhale slowly for 6 counts',
        'Repeat for the full duration'
      ],
      benefits: ['Reduces stress', 'Improves focus', 'Calms nervous system']
    },
    {
      activity_name: 'Gentle Stretching',
      description: 'Light stretches to release tension without increasing stimulation',
      duration: Math.min(10, request.duration),
      stimulation_level: 'low',
      attention_preservation_score: 0.85,
      instructions: [
        'Stand and reach arms overhead',
        'Gentle neck rolls (both directions)',
        'Shoulder blade squeezes',
        'Seated spinal twist',
        'Ankle circles and calf raises',
        'Hold each stretch for 30 seconds'
      ],
      benefits: ['Releases muscle tension', 'Improves circulation', 'Maintains alertness']
    },
    {
      activity_name: 'Window Gazing',
      description: 'Look out the window to rest eyes and mind without overstimulation',
      duration: Math.min(3, request.duration),
      stimulation_level: 'very_low',
      attention_preservation_score: 0.90,
      instructions: [
        'Find a window with a natural view',
        'Sit or stand comfortably',
        'Let your eyes relax and unfocus',
        'Notice natural elements (trees, sky, clouds)',
        'Avoid analyzing or thinking',
        'Simply observe without judgment'
      ],
      benefits: ['Rests eyes', 'Reduces mental fatigue', 'Provides natural stimulation']
    },
    {
      activity_name: 'Mindful Water Drinking',
      description: 'Slow, mindful hydration to reset attention',
      duration: Math.min(2, request.duration),
      stimulation_level: 'very_low',
      attention_preservation_score: 0.88,
      instructions: [
        'Get a glass of room temperature water',
        'Hold the glass mindfully',
        'Notice the temperature and weight',
        'Drink slowly, feeling each sip',
        'Focus on the sensation of swallowing',
        'Take 3-4 mindful sips'
      ],
      benefits: ['Hydrates body', 'Provides mental reset', 'Grounds attention']
    }
  ];

  // Filter based on stimulation tolerance
  const stimulationLevels = { 'very_low': 1, 'low': 2, 'minimal': 3 };
  const toleranceLevel = stimulationLevels[request.stimulation_tolerance];
  
  const filteredActivities = baseActivities.filter(activity => {
    const activityLevel = stimulationLevels[activity.stimulation_level];
    return activityLevel <= toleranceLevel && activity.duration <= request.duration + 5;
  });

  // Sort by attention preservation score (highest first)
  return filteredActivities.sort((a, b) => b.attention_preservation_score - a.attention_preservation_score);
}