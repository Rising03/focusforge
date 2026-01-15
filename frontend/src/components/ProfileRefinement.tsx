import React, { useState, useEffect } from 'react';
import { DetailedUserProfile, UserProfile } from '../types/profile';
import { profileService } from '../services/profileService';
import { useBehavioralTracking } from '../hooks/useBehavioralTracking';

interface ProfileRefinementProps {
  currentProfile: UserProfile;
  onUpdate: (updatedProfile: UserProfile) => void;
  onClose: () => void;
}

interface RefinementSuggestion {
  id: string;
  category: string;
  title: string;
  description: string;
  currentValue: any;
  suggestedValue: any;
  confidence: number;
  reason: string;
}

const ProfileRefinement: React.FC<ProfileRefinementProps> = ({
  currentProfile,
  onUpdate,
  onClose
}) => {
  const [suggestions, setSuggestions] = useState<RefinementSuggestion[]>([]);
  const [selectedSuggestions, setSelectedSuggestions] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [behavioralInsights, setBehavioralInsights] = useState<any>(null);

  const { elementRef, trackCustomEvent, trackSuggestionResponse } = useBehavioralTracking({
    featureName: 'profile_refinement'
  });

  useEffect(() => {
    loadRefinementSuggestions();
  }, []);

  const loadRefinementSuggestions = async () => {
    try {
      setIsLoading(true);
      
      // Get behavioral analytics and personalization insights
      const [behavioralData, insights] = await Promise.all([
        profileService.getBehavioralAnalytics(30),
        profileService.getPersonalizationInsights()
      ]);

      setBehavioralInsights(insights);
      
      // Generate refinement suggestions based on behavioral data
      const generatedSuggestions = generateRefinementSuggestions(
        currentProfile,
        behavioralData,
        insights
      );
      
      setSuggestions(generatedSuggestions);
      
      trackCustomEvent('refinement_suggestions_loaded', {
        suggestionCount: generatedSuggestions.length,
        categories: [...new Set(generatedSuggestions.map(s => s.category))]
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load suggestions');
    } finally {
      setIsLoading(false);
    }
  };

  const generateRefinementSuggestions = (
    profile: UserProfile,
    behavioralData: any[],
    insights: any
  ): RefinementSuggestion[] => {
    const suggestions: RefinementSuggestion[] = [];

    // Analyze productivity patterns
    const productivityEvents = behavioralData.filter(e => e.event_type === 'productivity_metrics');
    if (productivityEvents.length > 0) {
      const avgFocusQuality = productivityEvents.reduce((sum, e) => 
        sum + (e.event_data.focusQuality || 0), 0) / productivityEvents.length;
      
      if (avgFocusQuality < 2 && profile.detailed_profile?.productivity_peaks?.length === 0) {
        suggestions.push({
          id: 'productivity_peaks',
          category: 'Productivity',
          title: 'Update Productivity Peaks',
          description: 'Based on your recent activity, we noticed you might benefit from identifying your peak productivity hours.',
          currentValue: profile.detailed_profile?.productivity_peaks || [],
          suggestedValue: insights.suggestedProductivityPeaks || ['Morning (8-11 AM)', 'Late afternoon (3-6 PM)'],
          confidence: 0.8,
          reason: 'Low average focus quality detected in recent sessions'
        });
      }
    }

    // Analyze distraction patterns
    const distractionEvents = behavioralData.filter(e => 
      e.event_type === 'user_interaction' && e.event_data.interactionType === 'blur'
    );
    
    if (distractionEvents.length > 10) {
      const currentTriggers = profile.detailed_profile?.distraction_triggers || [];
      const suggestedTriggers = [...currentTriggers];
      
      if (!suggestedTriggers.includes('Background noise')) {
        suggestedTriggers.push('Background noise');
      }
      if (!suggestedTriggers.includes('Phone calls/messages')) {
        suggestedTriggers.push('Phone calls/messages');
      }

      suggestions.push({
        id: 'distraction_triggers',
        category: 'Focus',
        title: 'Update Distraction Triggers',
        description: 'We detected frequent interruptions in your work sessions. Consider updating your distraction triggers.',
        currentValue: currentTriggers,
        suggestedValue: suggestedTriggers,
        confidence: 0.7,
        reason: `${distractionEvents.length} interruption events detected in the last 30 days`
      });
    }

    // Analyze learning style effectiveness
    const taskCompletionEvents = behavioralData.filter(e => e.event_type === 'task_completion');
    const completionRate = taskCompletionEvents.length > 0 
      ? taskCompletionEvents.filter(e => e.event_data.completed).length / taskCompletionEvents.length 
      : 0;

    if (completionRate < 0.6 && profile.detailed_profile?.learning_style) {
      const alternativeLearningStyles = ['visual', 'auditory', 'kinesthetic', 'reading']
        .filter(style => style !== profile.detailed_profile?.learning_style);
      
      suggestions.push({
        id: 'learning_style',
        category: 'Learning',
        title: 'Consider Alternative Learning Style',
        description: 'Your current learning approach might not be optimal. Consider trying a different learning style.',
        currentValue: profile.detailed_profile.learning_style,
        suggestedValue: alternativeLearningStyles[0],
        confidence: 0.6,
        reason: `Low task completion rate (${Math.round(completionRate * 100)}%) detected`
      });
    }

    // Analyze environment preferences
    const environmentEvents = behavioralData.filter(e => e.event_type === 'contextual_factors');
    if (environmentEvents.length > 0) {
      const locationData = environmentEvents
        .map(e => e.event_data.factors?.location)
        .filter(Boolean);
      
      if (locationData.length > 0) {
        const mostCommonLocation = locationData
          .reduce((acc, location) => {
            acc[location] = (acc[location] || 0) + 1;
            return acc;
          }, {} as Record<string, number>);
        
        const topLocation = Object.entries(mostCommonLocation)
          .sort(([,a], [,b]) => b - a)[0][0];
        
        const currentLocations = profile.detailed_profile?.study_environment_prefs?.preferred_location || [];
        
        if (!currentLocations.includes(topLocation)) {
          suggestions.push({
            id: 'preferred_location',
            category: 'Environment',
            title: 'Update Preferred Study Location',
            description: 'Based on your usage patterns, you might want to add this location to your preferences.',
            currentValue: currentLocations,
            suggestedValue: [...currentLocations, topLocation],
            confidence: 0.9,
            reason: `You've been most active in "${topLocation}" recently`
          });
        }
      }
    }

    // Analyze motivation factors effectiveness
    const suggestionResponseEvents = behavioralData.filter(e => e.event_type === 'suggestion_response');
    const acceptanceRate = suggestionResponseEvents.length > 0
      ? suggestionResponseEvents.filter(e => e.event_data.response === 'accepted').length / suggestionResponseEvents.length
      : 0;

    if (acceptanceRate < 0.4) {
      const currentMotivation = profile.detailed_profile?.motivation_factors || [];
      const suggestedMotivation = [...currentMotivation];
      
      if (!suggestedMotivation.includes('Personal growth mindset')) {
        suggestedMotivation.push('Personal growth mindset');
      }
      if (!suggestedMotivation.includes('Progress tracking and metrics')) {
        suggestedMotivation.push('Progress tracking and metrics');
      }

      suggestions.push({
        id: 'motivation_factors',
        category: 'Motivation',
        title: 'Update Motivation Factors',
        description: 'Low engagement with suggestions indicates your motivation factors might need updating.',
        currentValue: currentMotivation,
        suggestedValue: suggestedMotivation,
        confidence: 0.7,
        reason: `Low suggestion acceptance rate (${Math.round(acceptanceRate * 100)}%)`
      });
    }

    return suggestions.sort((a, b) => b.confidence - a.confidence);
  };

  const handleSuggestionToggle = (suggestionId: string) => {
    const newSelected = new Set(selectedSuggestions);
    if (newSelected.has(suggestionId)) {
      newSelected.delete(suggestionId);
      trackSuggestionResponse('rejected', { suggestionId });
    } else {
      newSelected.add(suggestionId);
      trackSuggestionResponse('accepted', { suggestionId });
    }
    setSelectedSuggestions(newSelected);
  };

  const handleApplyChanges = async () => {
    if (selectedSuggestions.size === 0) {
      onClose();
      return;
    }

    setIsSaving(true);
    setError(null);

    try {
      // Build updated detailed profile
      const updatedDetailedProfile: Partial<DetailedUserProfile> = {
        ...currentProfile.detailed_profile
      };

      // Apply selected suggestions
      suggestions.forEach(suggestion => {
        if (selectedSuggestions.has(suggestion.id)) {
          switch (suggestion.id) {
            case 'productivity_peaks':
              updatedDetailedProfile.productivity_peaks = suggestion.suggestedValue;
              break;
            case 'distraction_triggers':
              updatedDetailedProfile.distraction_triggers = suggestion.suggestedValue;
              break;
            case 'learning_style':
              updatedDetailedProfile.learning_style = suggestion.suggestedValue;
              break;
            case 'preferred_location':
              if (updatedDetailedProfile.study_environment_prefs) {
                updatedDetailedProfile.study_environment_prefs.preferred_location = suggestion.suggestedValue;
              }
              break;
            case 'motivation_factors':
              updatedDetailedProfile.motivation_factors = suggestion.suggestedValue;
              break;
          }
        }
      });

      // Update profile
      const response = await profileService.updateDetailedProfile(updatedDetailedProfile);
      
      trackCustomEvent('profile_refinement_applied', {
        appliedSuggestions: Array.from(selectedSuggestions),
        totalSuggestions: suggestions.length
      });

      onUpdate(response.profile);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to apply changes');
    } finally {
      setIsSaving(false);
    }
  };

  const renderSuggestion = (suggestion: RefinementSuggestion) => {
    const isSelected = selectedSuggestions.has(suggestion.id);
    
    return (
      <div
        key={suggestion.id}
        className={`border rounded-lg p-4 cursor-pointer transition-all ${
          isSelected 
            ? 'border-blue-500 bg-blue-50' 
            : 'border-gray-200 hover:border-gray-300'
        }`}
        onClick={() => handleSuggestionToggle(suggestion.id)}
      >
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center space-x-2 mb-2">
              <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                {suggestion.category}
              </span>
              <div className="flex items-center space-x-1">
                <div className="w-2 h-2 rounded-full bg-green-400"></div>
                <span className="text-xs text-gray-500">
                  {Math.round(suggestion.confidence * 100)}% confidence
                </span>
              </div>
            </div>
            
            <h3 className="font-medium text-gray-900 mb-1">
              {suggestion.title}
            </h3>
            
            <p className="text-sm text-gray-600 mb-3">
              {suggestion.description}
            </p>
            
            <div className="text-xs text-gray-500 mb-2">
              <strong>Reason:</strong> {suggestion.reason}
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
              <div>
                <span className="font-medium text-gray-700">Current:</span>
                <div className="mt-1 text-gray-600">
                  {Array.isArray(suggestion.currentValue) 
                    ? suggestion.currentValue.length > 0 
                      ? suggestion.currentValue.join(', ')
                      : 'Not set'
                    : suggestion.currentValue || 'Not set'
                  }
                </div>
              </div>
              
              <div>
                <span className="font-medium text-gray-700">Suggested:</span>
                <div className="mt-1 text-gray-600">
                  {Array.isArray(suggestion.suggestedValue)
                    ? suggestion.suggestedValue.join(', ')
                    : suggestion.suggestedValue
                  }
                </div>
              </div>
            </div>
          </div>
          
          <div className="ml-4">
            <input
              type="checkbox"
              checked={isSelected}
              onChange={() => handleSuggestionToggle(suggestion.id)}
              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
          </div>
        </div>
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-8 max-w-md w-full mx-4">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Analyzing your behavior patterns...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div 
        ref={elementRef}
        className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col"
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                Profile Refinement Suggestions
              </h2>
              <p className="text-sm text-gray-600 mt-1">
                Based on your recent activity and behavior patterns
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-600 text-sm">{error}</p>
            </div>
          )}

          {suggestions.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Your Profile Looks Great!
              </h3>
              <p className="text-gray-600">
                We don't have any refinement suggestions at this time. Keep using the system and we'll provide personalized recommendations based on your behavior.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="mb-4">
                <p className="text-sm text-gray-600">
                  We found {suggestions.length} suggestions to improve your profile based on your recent activity. 
                  Select the ones you'd like to apply.
                </p>
              </div>
              
              {suggestions.map(renderSuggestion)}
            </div>
          )}
        </div>

        {/* Footer */}
        {suggestions.length > 0 && (
          <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-600">
                {selectedSuggestions.size} of {suggestions.length} suggestions selected
              </div>
              
              <div className="flex space-x-3">
                <button
                  onClick={onClose}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                
                <button
                  onClick={handleApplyChanges}
                  disabled={isSaving}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                >
                  {isSaving ? 'Applying Changes...' : 'Apply Selected Changes'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProfileRefinement;