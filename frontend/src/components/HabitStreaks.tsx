import React, { useState, useEffect } from 'react';
import { habitService } from '../services/habitService';
import { 
  HabitStreaksResponse,
  ConsistencyScore,
  HabitStackSuggestionsResponse
} from '../types/habit';

interface HabitStreaksProps {
  onDataUpdate?: (data: { streaks: HabitStreaksResponse; consistency: ConsistencyScore; suggestions: HabitStackSuggestionsResponse }) => void;
}

export const HabitStreaks: React.FC<HabitStreaksProps> = ({ onDataUpdate }) => {
  const [streaks, setStreaks] = useState<HabitStreaksResponse | null>(null);
  const [consistencyScore, setConsistencyScore] = useState<ConsistencyScore | null>(null);
  const [stackSuggestions, setStackSuggestions] = useState<HabitStackSuggestionsResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'streaks' | 'consistency' | 'stacking'>('streaks');

  useEffect(() => {
    loadAllData();
  }, []);

  useEffect(() => {
    if (streaks && consistencyScore && stackSuggestions && onDataUpdate) {
      onDataUpdate({ streaks, consistency: consistencyScore, suggestions: stackSuggestions });
    }
  }, [streaks, consistencyScore, stackSuggestions, onDataUpdate]);

  const loadAllData = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const [streaksData, consistencyData, suggestionsData] = await Promise.all([
        habitService.getHabitStreaks(),
        habitService.getConsistencyScore(),
        habitService.getHabitStackSuggestions()
      ]);

      setStreaks(streaksData);
      setConsistencyScore(consistencyData);
      setStackSuggestions(suggestionsData);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to load habit data');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="flex space-x-4 mb-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-8 bg-gray-200 rounded w-20"></div>
            ))}
          </div>
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="border border-gray-200 rounded-lg p-4">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border">
      <div className="p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">Habit Analytics</h2>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        {/* Tab Navigation */}
        <div className="flex space-x-1 mb-6 bg-gray-100 p-1 rounded-lg">
          <button
            onClick={() => setActiveTab('streaks')}
            className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'streaks'
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Streaks
          </button>
          <button
            onClick={() => setActiveTab('consistency')}
            className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'consistency'
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Consistency
          </button>
          <button
            onClick={() => setActiveTab('stacking')}
            className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'stacking'
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Stacking
          </button>
        </div>

        {/* Streaks Tab */}
        {activeTab === 'streaks' && streaks && (
          <div className="space-y-4">
            {/* Summary Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                <div className="text-2xl font-bold text-orange-600">{streaks.longest_current_streak}</div>
                <div className="text-sm text-orange-700">Longest Current Streak</div>
              </div>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="text-2xl font-bold text-blue-600">
                  {Math.round(streaks.overall_consistency)}%
                </div>
                <div className="text-sm text-blue-700">Overall Consistency</div>
              </div>
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="text-lg font-bold text-green-600">{streaks.most_consistent_habit}</div>
                <div className="text-sm text-green-700">Most Consistent Habit</div>
              </div>
            </div>

            {/* Individual Streaks */}
            <div className="space-y-3">
              {streaks.streaks.map((streak) => (
                <div key={streak.habit_id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      <span className="text-lg">{habitService.getHabitIcon(streak.habit_name)}</span>
                      <h3 className="font-medium text-gray-900">{streak.habit_name}</h3>
                    </div>
                    <div className={`px-2 py-1 rounded text-xs font-medium ${habitService.getConsistencyBgColor(streak.consistency_percentage)} ${habitService.getConsistencyColor(streak.consistency_percentage)}`}>
                      {habitService.formatConsistencyPercentage(streak.consistency_percentage)}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <div className={`text-lg font-semibold ${habitService.getStreakColor(streak.current_streak)}`}>
                        {streak.current_streak}
                      </div>
                      <div className="text-gray-500">Current Streak</div>
                    </div>
                    <div>
                      <div className="text-lg font-semibold text-gray-700">
                        {streak.longest_streak}
                      </div>
                      <div className="text-gray-500">Longest Streak</div>
                    </div>
                    <div>
                      <div className="text-lg font-semibold text-blue-600">
                        {Math.round(streak.consistency_percentage)}%
                      </div>
                      <div className="text-gray-500">Consistency</div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-700">
                        {streak.last_completed 
                          ? habitService.formatDisplayDate(streak.last_completed)
                          : 'Never'
                        }
                      </div>
                      <div className="text-gray-500">Last Completed</div>
                    </div>
                  </div>

                  {/* Streak visualization */}
                  <div className="mt-3">
                    <div className="flex items-center space-x-1">
                      {Array.from({ length: Math.min(streak.current_streak, 30) }, (_, i) => (
                        <div
                          key={i}
                          className={`w-2 h-2 rounded-full ${
                            i < streak.current_streak ? 'bg-green-500' : 'bg-gray-200'
                          }`}
                        />
                      ))}
                      {streak.current_streak > 30 && (
                        <span className="text-xs text-gray-500 ml-2">+{streak.current_streak - 30} more</span>
                      )}
                    </div>
                  </div>

                  {/* Motivational message */}
                  <div className="mt-3 p-2 bg-gray-50 rounded text-xs text-gray-600">
                    {habitService.getMotivationalMessage(streak.current_streak, streak.consistency_percentage)}
                  </div>
                </div>
              ))}

              {streaks.streaks.length === 0 && (
                <div className="text-center py-8">
                  <div className="text-gray-400 text-4xl mb-2">🔥</div>
                  <p className="text-gray-500">No habit streaks yet</p>
                  <p className="text-sm text-gray-400 mt-1">Start completing your habits to build streaks!</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Consistency Tab */}
        {activeTab === 'consistency' && consistencyScore && (
          <div className="space-y-6">
            {/* Overall Score */}
            <div className="text-center">
              <div className={`text-6xl font-bold mb-2 ${habitService.getConsistencyColor(consistencyScore.overall_score)}`}>
                {consistencyScore.overall_score}%
              </div>
              <div className="text-lg text-gray-600">Overall Consistency Score</div>
            </div>

            {/* Individual Habit Scores */}
            <div className="space-y-3">
              <h3 className="text-lg font-medium text-gray-900">Individual Habit Scores</h3>
              {consistencyScore.habit_scores.map((habitScore) => (
                <div key={habitScore.habit_id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      <span className="text-lg">{habitService.getHabitIcon(habitScore.habit_name)}</span>
                      <h4 className="font-medium text-gray-900">{habitScore.habit_name}</h4>
                    </div>
                    <div className={`px-3 py-1 rounded text-sm font-medium ${habitService.getConsistencyBgColor(habitScore.score)} ${habitService.getConsistencyColor(habitScore.score)}`}>
                      {habitScore.score}%
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-sm text-gray-600">
                    <span>Current Streak: {habitService.formatStreak(habitScore.streak)}</span>
                    <div className="w-32 bg-gray-200 rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full transition-all duration-300 ${
                          habitScore.score >= 80 ? 'bg-green-500' :
                          habitScore.score >= 60 ? 'bg-blue-500' :
                          habitScore.score >= 40 ? 'bg-yellow-500' : 'bg-red-500'
                        }`}
                        style={{ width: `${habitScore.score}%` }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Insights */}
            {consistencyScore.insights.length > 0 && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h3 className="text-lg font-medium text-blue-900 mb-2">Insights</h3>
                <ul className="space-y-1">
                  {consistencyScore.insights.map((insight, index) => (
                    <li key={index} className="text-sm text-blue-800 flex items-start space-x-2">
                      <span className="text-blue-600 mt-0.5">•</span>
                      <span>{insight}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Recommendations */}
            {consistencyScore.recommendations.length > 0 && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <h3 className="text-lg font-medium text-green-900 mb-2">Recommendations</h3>
                <ul className="space-y-1">
                  {consistencyScore.recommendations.map((recommendation, index) => (
                    <li key={index} className="text-sm text-green-800 flex items-start space-x-2">
                      <span className="text-green-600 mt-0.5">💡</span>
                      <span>{recommendation}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {/* Stacking Tab */}
        {activeTab === 'stacking' && stackSuggestions && (
          <div className="space-y-6">
            {/* Existing Stacks */}
            {stackSuggestions.existing_stacks.length > 0 && (
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Current Habit Stacks</h3>
                <div className="space-y-3">
                  {stackSuggestions.existing_stacks.map((stack, index) => (
                    <div key={index} className="border border-gray-200 rounded-lg p-4 bg-green-50">
                      <div className="flex items-center space-x-2 mb-2">
                        <span className="text-green-600">🔗</span>
                        <h4 className="font-medium text-green-900">{stack.parent_habit}</h4>
                      </div>
                      <div className="ml-6 space-y-1">
                        {stack.stacked_habits.map((stackedHabit, stackIndex) => (
                          <div key={stackIndex} className="text-sm text-green-800 flex items-center space-x-2">
                            <span>→</span>
                            <span>{stackedHabit}</span>
                          </div>
                        ))}
                      </div>
                      <div className="mt-2 text-xs text-green-700 bg-green-100 rounded px-2 py-1 inline-block">
                        {habitService.getHabitStackingTip(stack.parent_habit, stack.stacked_habits[0])}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Suggestions */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Habit Stacking Suggestions</h3>
              {stackSuggestions.suggestions.length > 0 ? (
                <div className="space-y-3">
                  {stackSuggestions.suggestions.map((suggestion, index) => (
                    <div key={index} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <h4 className="font-medium text-gray-900 mb-1">
                            Stack "{suggestion.suggested_new_habit}" after "{suggestion.existing_habit_name}"
                          </h4>
                          <p className="text-sm text-gray-600">{suggestion.reason}</p>
                        </div>
                        <div className="ml-4 flex items-center space-x-1">
                          <div className="flex">
                            {Array.from({ length: 5 }, (_, i) => (
                              <span
                                key={i}
                                className={`text-xs ${
                                  i < Math.round(suggestion.confidence_score * 5) 
                                    ? 'text-yellow-400' 
                                    : 'text-gray-300'
                                }`}
                              >
                                ⭐
                              </span>
                            ))}
                          </div>
                          <span className="text-xs text-gray-500">
                            {Math.round(suggestion.confidence_score * 100)}%
                          </span>
                        </div>
                      </div>
                      
                      <div className="bg-blue-50 border border-blue-200 rounded p-2 text-sm text-blue-800">
                        <strong>Stack format:</strong> {habitService.getHabitStackingTip(suggestion.existing_habit_name, suggestion.suggested_new_habit)}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <div className="text-gray-400 text-4xl mb-2">🔗</div>
                  <p className="text-gray-500">No stacking suggestions available</p>
                  <p className="text-sm text-gray-400 mt-1">Build consistent habits first to unlock stacking opportunities!</p>
                </div>
              )}
            </div>

            {/* Stacking Tips */}
            <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
              <h3 className="text-lg font-medium text-purple-900 mb-2">Habit Stacking Tips</h3>
              <ul className="space-y-1 text-sm text-purple-800">
                <li className="flex items-start space-x-2">
                  <span className="text-purple-600 mt-0.5">💡</span>
                  <span>Stack new habits after existing consistent habits (70%+ consistency)</span>
                </li>
                <li className="flex items-start space-x-2">
                  <span className="text-purple-600 mt-0.5">💡</span>
                  <span>Use the format: "After I [existing habit], I will [new habit]"</span>
                </li>
                <li className="flex items-start space-x-2">
                  <span className="text-purple-600 mt-0.5">💡</span>
                  <span>Start with small, easy habits that take less than 2 minutes</span>
                </li>
                <li className="flex items-start space-x-2">
                  <span className="text-purple-600 mt-0.5">💡</span>
                  <span>Stack habits that naturally flow together (e.g., brush teeth → floss)</span>
                </li>
              </ul>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};