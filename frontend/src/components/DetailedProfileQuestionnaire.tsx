import React, { useState, useEffect } from 'react';
import { DetailedUserProfile, EnvironmentPreferences, PersonalityProfile, AcademicProfile } from '../types/profile';
import { profileService } from '../services/profileService';

interface DetailedProfileQuestionnaireProps {
  onComplete: (profile: DetailedUserProfile) => void;
  onSkip?: () => void;
  initialData?: Partial<DetailedUserProfile>;
}

interface QuestionnaireStep {
  id: string;
  title: string;
  description: string;
  questions: Question[];
}

interface Question {
  id: string;
  type: 'single-select' | 'multi-select' | 'text' | 'scale' | 'time-slots';
  question: string;
  options?: string[];
  required?: boolean;
  adaptive?: boolean;
  followUp?: { condition: string; questions: Question[] };
}

const DetailedProfileQuestionnaire: React.FC<DetailedProfileQuestionnaireProps> = ({
  onComplete,
  onSkip,
  initialData = {}
}) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [responses, setResponses] = useState<Record<string, any>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Progressive disclosure - steps are revealed based on previous answers
  const [availableSteps, setAvailableSteps] = useState<QuestionnaireStep[]>([]);

  const baseSteps: QuestionnaireStep[] = [
    {
      id: 'learning-style',
      title: 'Learning Style Assessment',
      description: 'Help us understand how you learn best',
      questions: [
        {
          id: 'learning_style',
          type: 'single-select',
          question: 'Which learning style describes you best?',
          options: ['visual', 'auditory', 'kinesthetic', 'reading'],
          required: true
        },
        {
          id: 'information_processing',
          type: 'single-select',
          question: 'How do you prefer to process new information?',
          options: [
            'Step-by-step with clear structure',
            'Big picture first, then details',
            'Through examples and practice',
            'By discussing with others'
          ],
          required: true
        },
        {
          id: 'learning_pace',
          type: 'single-select',
          question: 'What learning pace works best for you?',
          options: [
            'Slow and thorough',
            'Moderate with breaks',
            'Fast-paced and intensive',
            'Variable depending on topic'
          ],
          required: true
        }
      ]
    },
    {
      id: 'productivity-patterns',
      title: 'Productivity Patterns',
      description: 'When and how you work most effectively',
      questions: [
        {
          id: 'productivity_peaks',
          type: 'time-slots',
          question: 'When are you most productive? (Select all that apply)',
          options: [
            'Early morning (5-8 AM)',
            'Morning (8-11 AM)',
            'Late morning (11 AM-1 PM)',
            'Early afternoon (1-3 PM)',
            'Late afternoon (3-6 PM)',
            'Evening (6-9 PM)',
            'Night (9 PM-12 AM)',
            'Late night (12-3 AM)'
          ],
          required: true
        },
        {
          id: 'work_session_length',
          type: 'single-select',
          question: 'What is your ideal work session length?',
          options: [
            '15-25 minutes (Pomodoro style)',
            '30-45 minutes',
            '60-90 minutes',
            '2+ hours when in flow'
          ],
          required: true
        },
        {
          id: 'break_preferences',
          type: 'multi-select',
          question: 'What types of breaks help you recharge?',
          options: [
            'Short walks',
            'Stretching or light exercise',
            'Meditation or breathing exercises',
            'Listening to music',
            'Social interaction',
            'Snacking or hydration',
            'Complete rest/quiet time',
            'Creative activities'
          ],
          required: true
        }
      ]
    },
    {
      id: 'environment-preferences',
      title: 'Study Environment',
      description: 'Your ideal learning and working environment',
      questions: [
        {
          id: 'preferred_location',
          type: 'multi-select',
          question: 'Where do you prefer to study or work?',
          options: [
            'Quiet library',
            'Home office/desk',
            'Coffee shop or café',
            'Outdoor spaces',
            'Shared study spaces',
            'Bedroom',
            'Living room',
            'Different locations for variety'
          ],
          required: true
        },
        {
          id: 'noise_level',
          type: 'single-select',
          question: 'What noise level helps you focus best?',
          options: ['silent', 'quiet', 'moderate', 'background_music'],
          required: true
        },
        {
          id: 'lighting_preference',
          type: 'single-select',
          question: 'What lighting do you prefer?',
          options: ['bright', 'moderate', 'dim'],
          required: true
        },
        {
          id: 'temperature_preference',
          type: 'single-select',
          question: 'What temperature helps you focus?',
          options: ['cool', 'moderate', 'warm'],
          required: true
        },
        {
          id: 'organization_style',
          type: 'single-select',
          question: 'How do you prefer your workspace?',
          options: ['minimal', 'organized', 'flexible'],
          required: true
        }
      ]
    },
    {
      id: 'challenges-motivation',
      title: 'Challenges & Motivation',
      description: 'Understanding your obstacles and what drives you',
      questions: [
        {
          id: 'distraction_triggers',
          type: 'multi-select',
          question: 'What are your biggest distraction triggers?',
          options: [
            'Social media notifications',
            'Phone calls/messages',
            'Background noise',
            'Hunger or thirst',
            'Fatigue or low energy',
            'Anxiety or stress',
            'Boredom with material',
            'Perfectionism',
            'Other people around',
            'Cluttered environment'
          ],
          required: true
        },
        {
          id: 'motivation_factors',
          type: 'multi-select',
          question: 'What motivates you most to stay focused?',
          options: [
            'Clear goals and deadlines',
            'Progress tracking and metrics',
            'Rewards and celebrations',
            'Accountability partners',
            'Competition with others',
            'Personal growth mindset',
            'Future career benefits',
            'Helping others',
            'Mastery and expertise',
            'Recognition and praise'
          ],
          required: true
        },
        {
          id: 'challenge_areas',
          type: 'multi-select',
          question: 'Which areas do you find most challenging?',
          options: [
            'Starting tasks (procrastination)',
            'Maintaining focus',
            'Time management',
            'Prioritizing tasks',
            'Dealing with difficult material',
            'Managing stress and anxiety',
            'Staying consistent',
            'Balancing multiple commitments',
            'Self-discipline',
            'Perfectionism'
          ],
          required: true
        }
      ]
    },
    {
      id: 'personality-work-style',
      title: 'Personality & Work Style',
      description: 'How you prefer to approach work and receive feedback',
      questions: [
        {
          id: 'work_style',
          type: 'single-select',
          question: 'Which work style describes you best?',
          options: ['structured', 'flexible', 'mixed'],
          required: true
        },
        {
          id: 'social_preference',
          type: 'single-select',
          question: 'Do you prefer to work alone or with others?',
          options: ['solo', 'group', 'mixed'],
          required: true
        },
        {
          id: 'feedback_style',
          type: 'single-select',
          question: 'What type of feedback helps you most?',
          options: ['direct', 'encouraging', 'analytical'],
          required: true
        },
        {
          id: 'challenge_level',
          type: 'single-select',
          question: 'How do you prefer to approach new challenges?',
          options: ['gradual', 'moderate', 'aggressive'],
          required: true
        },
        {
          id: 'decision_making',
          type: 'single-select',
          question: 'How do you typically make decisions?',
          options: [
            'Quick and intuitive',
            'Careful analysis of options',
            'Seek advice from others',
            'Depends on the situation'
          ],
          required: true
        }
      ]
    },
    {
      id: 'academic-background',
      title: 'Academic Background',
      description: 'Your educational context and goals',
      questions: [
        {
          id: 'current_level',
          type: 'single-select',
          question: 'What is your current academic level?',
          options: ['high_school', 'undergraduate', 'graduate', 'professional'],
          required: true
        },
        {
          id: 'subjects',
          type: 'multi-select',
          question: 'What subjects are you currently studying or interested in?',
          options: [
            'Mathematics',
            'Science (Biology, Chemistry, Physics)',
            'Computer Science/Programming',
            'Engineering',
            'Literature/Writing',
            'History',
            'Psychology',
            'Business/Economics',
            'Art/Design',
            'Languages',
            'Medicine/Health Sciences',
            'Law',
            'Other'
          ],
          required: true
        },
        {
          id: 'learning_goals',
          type: 'multi-select',
          question: 'What are your primary learning goals?',
          options: [
            'Pass exams/get good grades',
            'Develop practical skills',
            'Prepare for career',
            'Personal enrichment',
            'Research and discovery',
            'Creative expression',
            'Problem-solving abilities',
            'Critical thinking',
            'Communication skills',
            'Leadership development'
          ],
          required: true
        },
        {
          id: 'time_constraints',
          type: 'multi-select',
          question: 'What time constraints do you face?',
          options: [
            'Full-time job',
            'Part-time work',
            'Family responsibilities',
            'Commuting time',
            'Multiple courses/subjects',
            'Extracurricular activities',
            'Health issues',
            'Financial pressures',
            'Social commitments',
            'Other responsibilities'
          ],
          required: false
        },
        {
          id: 'previous_challenges',
          type: 'multi-select',
          question: 'What academic challenges have you faced before?',
          options: [
            'Test anxiety',
            'Difficulty with math/quantitative subjects',
            'Writing and communication',
            'Time management',
            'Procrastination',
            'Information overload',
            'Lack of motivation',
            'Perfectionism',
            'Imposter syndrome',
            'Balancing work and study'
          ],
          required: false
        }
      ]
    }
  ];

  useEffect(() => {
    // Initialize with base steps
    setAvailableSteps(baseSteps);
    
    // Load initial data if provided
    if (Object.keys(initialData).length > 0) {
      setResponses(flattenDetailedProfile(initialData));
    }
  }, [initialData]);

  const flattenDetailedProfile = (profile: Partial<DetailedUserProfile>): Record<string, any> => {
    const flattened: Record<string, any> = {};
    
    // Direct fields
    if (profile.learning_style) flattened.learning_style = profile.learning_style;
    if (profile.productivity_peaks) flattened.productivity_peaks = profile.productivity_peaks;
    if (profile.distraction_triggers) flattened.distraction_triggers = profile.distraction_triggers;
    if (profile.motivation_factors) flattened.motivation_factors = profile.motivation_factors;
    if (profile.challenge_areas) flattened.challenge_areas = profile.challenge_areas;
    
    // Environment preferences
    if (profile.study_environment_prefs) {
      Object.entries(profile.study_environment_prefs).forEach(([key, value]) => {
        flattened[key] = value;
      });
    }
    
    // Personality traits
    if (profile.personality_traits) {
      Object.entries(profile.personality_traits).forEach(([key, value]) => {
        flattened[key] = value;
      });
    }
    
    // Academic background
    if (profile.academic_background) {
      Object.entries(profile.academic_background).forEach(([key, value]) => {
        flattened[key] = value;
      });
    }
    
    return flattened;
  };

  const handleResponse = (questionId: string, value: any) => {
    setResponses(prev => ({ ...prev, [questionId]: value }));
    setError(null);
    
    // Track behavioral event
    profileService.trackBehavioralEvent('questionnaire_response', {
      questionId,
      value,
      step: availableSteps[currentStep]?.id,
      timestamp: new Date().toISOString()
    });
  };

  const validateCurrentStep = (): boolean => {
    const currentStepQuestions = availableSteps[currentStep]?.questions || [];
    
    for (const question of currentStepQuestions) {
      if (question.required && !responses[question.id]) {
        return false;
      }
    }
    
    return true;
  };

  const nextStep = async () => {
    if (!validateCurrentStep()) {
      setError('Please answer all required questions before continuing');
      setSuccessMessage(null);
      return;
    }

    if (currentStep < availableSteps.length - 1) {
      setIsSaving(true);
      setError(null);
      setSuccessMessage(null);

      try {
        // Save current progress to server
        const partialProfile = buildDetailedProfile();
        await profileService.updateDetailedProfile(partialProfile);
        
        // Track step completion
        await profileService.trackBehavioralEvent('questionnaire_step_completed', {
          stepId: availableSteps[currentStep].id,
          responses: getCurrentStepResponses(),
          timestamp: new Date().toISOString()
        });

        // Show success message
        setSuccessMessage(`Section ${currentStep + 1} saved successfully! ✓`);
        
        // Move to next step after brief delay
        setTimeout(() => {
          setCurrentStep(currentStep + 1);
          setSuccessMessage(null);
        }, 800);
        
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to save progress. Please try again.');
      } finally {
        setIsSaving(false);
      }
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const getCurrentStepResponses = () => {
    const currentStepQuestions = availableSteps[currentStep]?.questions || [];
    const stepResponses: Record<string, any> = {};
    
    currentStepQuestions.forEach(question => {
      if (responses[question.id]) {
        stepResponses[question.id] = responses[question.id];
      }
    });
    
    return stepResponses;
  };

  const buildDetailedProfile = (): DetailedUserProfile => {
    const environmentPrefs: EnvironmentPreferences = {
      preferred_location: responses.preferred_location || [],
      noise_level: responses.noise_level || 'moderate',
      lighting_preference: responses.lighting_preference || 'moderate',
      temperature_preference: responses.temperature_preference || 'moderate',
      organization_style: responses.organization_style || 'organized'
    };

    const personalityTraits: PersonalityProfile = {
      work_style: responses.work_style || 'mixed',
      social_preference: responses.social_preference || 'mixed',
      feedback_style: responses.feedback_style || 'encouraging',
      challenge_level: responses.challenge_level || 'moderate'
    };

    const academicBackground: AcademicProfile = {
      current_level: responses.current_level || 'undergraduate',
      subjects: responses.subjects || [],
      learning_goals: responses.learning_goals || [],
      time_constraints: responses.time_constraints || [],
      previous_challenges: responses.previous_challenges || []
    };

    return {
      learning_style: responses.learning_style || 'visual',
      productivity_peaks: responses.productivity_peaks || [],
      distraction_triggers: responses.distraction_triggers || [],
      motivation_factors: responses.motivation_factors || [],
      study_environment_prefs: environmentPrefs,
      challenge_areas: responses.challenge_areas || [],
      personality_traits: personalityTraits,
      academic_background: academicBackground,
      behavioral_patterns: {
        interaction_patterns: [],
        task_completion_rates: {},
        feature_usage_stats: {},
        temporal_productivity_patterns: [],
        adaptation_history: []
      },
      contextual_preferences: {
        weather_preferences: [],
        seasonal_patterns: [],
        life_circumstances: [],
        social_context: []
      },
      implicit_feedback: {
        suggestion_acceptance_rate: 0,
        routine_modification_patterns: [],
        skip_patterns: [],
        engagement_metrics: []
      }
    };
  };

  const handleSubmit = async () => {
    if (!validateCurrentStep()) return;

    setIsLoading(true);
    setError(null);

    try {
      const detailedProfile = buildDetailedProfile();
      
      // Track questionnaire completion
      await profileService.trackBehavioralEvent('questionnaire_completed', {
        totalSteps: availableSteps.length,
        completionTime: Date.now(),
        responses: responses
      });

      onComplete(detailedProfile);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save profile');
    } finally {
      setIsLoading(false);
    }
  };

  const renderQuestion = (question: Question) => {
    const value = responses[question.id];

    switch (question.type) {
      case 'single-select':
        return (
          <div className="space-y-3">
            {question.options?.map((option) => (
              <label key={option} className="flex items-center space-x-3 cursor-pointer">
                <input
                  type="radio"
                  name={question.id}
                  value={option}
                  checked={value === option}
                  onChange={(e) => handleResponse(question.id, e.target.value)}
                  className="w-4 h-4 text-blue-600 dark:text-blue-500 border-gray-300 dark:border-white/20 focus:ring-blue-500 dark:focus:ring-blue-400"
                />
                <span className="text-gray-700 dark:text-slate-300 capitalize">
                  {option.replace(/_/g, ' ')}
                </span>
              </label>
            ))}
          </div>
        );

      case 'multi-select':
        return (
          <div className="space-y-3">
            {question.options?.map((option) => (
              <label key={option} className="flex items-center space-x-3 cursor-pointer">
                <input
                  type="checkbox"
                  value={option}
                  checked={Array.isArray(value) && value.includes(option)}
                  onChange={(e) => {
                    const currentValues = Array.isArray(value) ? value : [];
                    if (e.target.checked) {
                      handleResponse(question.id, [...currentValues, option]);
                    } else {
                      handleResponse(question.id, currentValues.filter(v => v !== option));
                    }
                  }}
                  className="w-4 h-4 text-blue-600 dark:text-blue-500 border-gray-300 dark:border-white/20 rounded focus:ring-blue-500 dark:focus:ring-blue-400"
                />
                <span className="text-gray-700 dark:text-slate-300">{option}</span>
              </label>
            ))}
          </div>
        );

      case 'time-slots':
        return (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {question.options?.map((option) => (
              <label key={option} className="flex items-center space-x-3 cursor-pointer p-3 border border-gray-200 dark:border-white/10 rounded-lg hover:bg-gray-50 dark:hover:bg-white/5">
                <input
                  type="checkbox"
                  value={option}
                  checked={Array.isArray(value) && value.includes(option)}
                  onChange={(e) => {
                    const currentValues = Array.isArray(value) ? value : [];
                    if (e.target.checked) {
                      handleResponse(question.id, [...currentValues, option]);
                    } else {
                      handleResponse(question.id, currentValues.filter(v => v !== option));
                    }
                  }}
                  className="w-4 h-4 text-blue-600 dark:text-blue-500 border-gray-300 dark:border-white/20 rounded focus:ring-blue-500 dark:focus:ring-blue-400"
                />
                <span className="text-gray-700 dark:text-slate-300 text-sm">{option}</span>
              </label>
            ))}
          </div>
        );

      case 'scale':
        return (
          <div className="flex items-center space-x-4">
            <span className="text-sm text-gray-500 dark:text-slate-400">Low</span>
            <div className="flex space-x-2">
              {[1, 2, 3, 4, 5].map((num) => (
                <button
                  key={num}
                  type="button"
                  onClick={() => handleResponse(question.id, num)}
                  className={`w-10 h-10 rounded-full border-2 transition-colors ${
                    value === num
                      ? 'bg-blue-600 dark:bg-blue-500 border-blue-600 dark:border-blue-500 text-white'
                      : 'border-gray-300 dark:border-white/20 text-gray-600 dark:text-slate-400 hover:border-blue-400 dark:hover:border-blue-500'
                  }`}
                >
                  {num}
                </button>
              ))}
            </div>
            <span className="text-sm text-gray-500 dark:text-slate-400">High</span>
          </div>
        );

      default:
        return null;
    }
  };

  if (availableSteps.length === 0) {
    return <div className="text-center py-8">Loading questionnaire...</div>;
  }

  const currentStepData = availableSteps[currentStep];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-950 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <div className="bg-white dark:bg-slate-900 rounded-lg shadow-lg p-8">
          {/* Progress Bar */}
          <div className="mb-8">
            <div className="flex justify-between text-sm text-gray-500 dark:text-slate-400 mb-2">
              <span>Step {currentStep + 1} of {availableSteps.length}</span>
              <span>{Math.round(((currentStep + 1) / availableSteps.length) * 100)}% Complete</span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-white/10 rounded-full h-2">
              <div
                className="bg-blue-600 dark:bg-blue-500 h-2 rounded-full transition-all duration-300"
                style={{ width: `${((currentStep + 1) / availableSteps.length) * 100}%` }}
              />
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
              <p className="text-red-600 dark:text-red-400 text-sm">{error}</p>
            </div>
          )}

          {/* Success Message */}
          {successMessage && (
            <div className="mb-6 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
              <p className="text-green-600 dark:text-green-400 text-sm font-medium">{successMessage}</p>
            </div>
          )}

          {/* Step Content */}
          <div className="mb-8">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-2">
                {currentStepData.title}
              </h2>
              <p className="text-gray-600 dark:text-slate-400">
                {currentStepData.description}
              </p>
            </div>

            <div className="space-y-8">
              {currentStepData.questions.map((question) => (
                <div key={question.id} className="space-y-4">
                  <div className="flex items-start space-x-2">
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white flex-1">
                      {question.question}
                    </h3>
                    {question.required && (
                      <span className="text-red-500 dark:text-red-400 text-sm">*</span>
                    )}
                  </div>
                  {renderQuestion(question)}
                </div>
              ))}
            </div>
          </div>

          {/* Navigation Buttons */}
          <div className="flex justify-between">
            <div>
              {currentStep > 0 && (
                <button
                  type="button"
                  onClick={prevStep}
                  className="px-6 py-2 border border-gray-300 dark:border-white/10 text-gray-700 dark:text-slate-300 rounded-lg hover:bg-gray-50 dark:hover:bg-white/5 transition-colors"
                >
                  Previous
                </button>
              )}
            </div>

            <div className="flex gap-3">
              {onSkip && currentStep === 0 && (
                <button
                  type="button"
                  onClick={onSkip}
                  className="px-6 py-2 text-gray-500 dark:text-slate-400 hover:text-gray-700 dark:hover:text-slate-300 transition-colors"
                >
                  Skip Detailed Profile
                </button>
              )}

              {currentStep < availableSteps.length - 1 ? (
                <button
                  type="button"
                  onClick={nextStep}
                  disabled={!validateCurrentStep() || isSaving}
                  className="px-6 py-2 bg-blue-600 dark:bg-blue-500 text-white rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600 disabled:bg-gray-300 dark:disabled:bg-slate-700 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
                >
                  {isSaving ? (
                    <>
                      <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Saving...
                    </>
                  ) : (
                    'Next'
                  )}
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={isLoading || !validateCurrentStep()}
                  className="px-6 py-2 bg-green-600 dark:bg-green-500 text-white rounded-lg hover:bg-green-700 dark:hover:bg-green-600 disabled:bg-gray-300 dark:disabled:bg-slate-700 disabled:cursor-not-allowed transition-colors"
                >
                  {isLoading ? 'Saving Profile...' : 'Complete Profile'}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DetailedProfileQuestionnaire;