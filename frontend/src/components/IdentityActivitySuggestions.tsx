import React, { useState, useEffect } from 'react';
import { identityService } from '../services/identityService';
import { ActivitySuggestionRequest, ActivitySuggestionResponse } from '../types/identity';

interface IdentityActivitySuggestionsProps {
  className?: string;
  onActivitySelect?: (activity: string) => void;
}

export const IdentityActivitySuggestions: React.FC<IdentityActivitySuggestionsProps> = ({ 
  className = '',
  onActivitySelect 
}) => {
  const [suggestions, setSuggestions] = useState<ActivitySuggestionResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Form state
  const [context, setContext] = useState('');
  const [availableTime, setAvailableTime] = useState<number>(60);
  const [energyLevel, setEnergyLevel] = useState<'low' | 'medium' | 'high'>('medium');

  useEffect(() => {
    loadSuggestions();
  }, []);

  const loadSuggestions = async (customRequest?: ActivitySuggestionRequest) => {
    try {
      setLoading(true);
      setError(null);
      
      const request: ActivitySuggestionRequest = customRequest || {
        available_time: availableTime,
        energy_level: energyLevel,
        context: context.trim() || undefined
      };
      
      const data = await identityService.suggestActivities(request);
      setSuggestions(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load activity suggestions');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = () => {
    loadSuggestions({
      available_time: availableTime,
      energy_level: energyLevel,
      context: context.trim() || undefined
    });
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low':
        return 'bg-green-100 text-green-800 border-green-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getAlignmentColor = (boost: number) => {
    if (boost >= 0.8) return 'text-green-600';
    if (boost >= 0.6) return 'text-yellow-600';
    return 'text-orange-600';
  };

  if (loading && !suggestions) {
    return (
      <div className={`bg-white rounded-lg shadow-sm border p-6 ${className}`}>
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded mb-4"></div>
          <div className="space-y-3">
            <div className="h-20 bg-gray-200 rounded"></div>
            <div className="h-20 bg-gray-200 rounded"></div>
            <div className="h-20 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-lg shadow-sm border ${className}`}>
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-900">Identity-Based Activities</h2>
          <button
            onClick={handleRefresh}
            disabled={loading}
            className="text-sm text-gray-500 hover:text-gray-700 disabled:opacity-50 transition-colors"
          >
            {loading ? 'Loading...' : 'Refresh'}
          </button>
        </div>

        {/* Configuration */}
        <div className="mb-6 p-4 bg-gray-50 rounded-lg">
          <h3 className="text-sm font-medium text-gray-900 mb-3">Customize Suggestions</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Available Time (minutes)
              </label>
              <input
                type="number"
                value={availableTime}
                onChange={(e) => setAvailableTime(parseInt(e.target.value) || 60)}
                min="5"
                max="480"
                className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Energy Level
              </label>
              <select
                value={energyLevel}
                onChange={(e) => setEnergyLevel(e.target.value as any)}
                className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Context (optional)
              </label>
              <input
                type="text"
                value={context}
                onChange={(e) => setContext(e.target.value)}
                placeholder="e.g., morning, stressed, deadline"
                className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
          </div>

          <button
            onClick={handleRefresh}
            disabled={loading}
            className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-400 transition-colors"
          >
            Update Suggestions
          </button>
        </div>

        {/* Error Display */}
        {error && (
          <div className="mb-6 p-3 bg-red-50 border border-red-200 rounded-md">
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}

        {/* Identity Question */}
        {suggestions?.identity_question && (
          <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <h3 className="text-sm font-medium text-blue-900 mb-2">Reflection</h3>
            <p className="text-sm text-blue-800 italic">"{suggestions.identity_question}"</p>
            {suggestions.reasoning && (
              <p className="text-xs text-blue-700 mt-2">{suggestions.reasoning}</p>
            )}
          </div>
        )}

        {/* Suggestions */}
        {suggestions?.suggestions && suggestions.suggestions.length > 0 ? (
          <div className="space-y-4">
            {suggestions.suggestions.map((suggestion, index) => (
              <div
                key={suggestion.id}
                className="border border-gray-200 rounded-lg p-4 hover:shadow-sm transition-shadow"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <h4 className="text-sm font-medium text-gray-900 mb-1">
                      {suggestion.activity}
                    </h4>
                    <p className="text-xs text-gray-600">{suggestion.reasoning}</p>
                  </div>
                  
                  <div className="flex items-center space-x-2 ml-4">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full border ${getPriorityColor(suggestion.priority)}`}>
                      {suggestion.priority}
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4 text-xs text-gray-600">
                    <span>⏱️ {suggestion.estimated_duration} min</span>
                    <span className={`font-medium ${getAlignmentColor(suggestion.identity_alignment_boost)}`}>
                      +{Math.round(suggestion.identity_alignment_boost * 100)}% alignment
                    </span>
                  </div>

                  {onActivitySelect && (
                    <button
                      onClick={() => onActivitySelect(suggestion.activity)}
                      className="px-3 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                    >
                      Start Activity
                    </button>
                  )}
                </div>

                {/* Identity Question for this specific activity */}
                <div className="mt-3 p-2 bg-gray-50 rounded text-xs text-gray-700 italic">
                  "{suggestion.identity_question}"
                </div>
              </div>
            ))}
          </div>
        ) : !loading && (
          <div className="text-center py-8">
            <p className="text-gray-600 mb-4">No activity suggestions available</p>
            <button
              onClick={handleRefresh}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              Generate Suggestions
            </button>
          </div>
        )}

        {/* Quick Actions */}
        <div className="mt-6 pt-4 border-t border-gray-200">
          <h4 className="text-sm font-medium text-gray-900 mb-3">Quick Context Updates</h4>
          <div className="flex flex-wrap gap-2">
            {[
              { label: 'Morning Focus', context: 'morning', time: 90, energy: 'high' as const },
              { label: 'Quick Break', context: 'break', time: 15, energy: 'medium' as const },
              { label: 'Evening Wind-down', context: 'evening', time: 30, energy: 'low' as const },
              { label: 'Stressed/Overwhelmed', context: 'stressed', time: 45, energy: 'low' as const }
            ].map((preset) => (
              <button
                key={preset.label}
                onClick={() => {
                  setContext(preset.context);
                  setAvailableTime(preset.time);
                  setEnergyLevel(preset.energy);
                  loadSuggestions({
                    context: preset.context,
                    available_time: preset.time,
                    energy_level: preset.energy
                  });
                }}
                className="px-3 py-1 text-xs bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors"
              >
                {preset.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};