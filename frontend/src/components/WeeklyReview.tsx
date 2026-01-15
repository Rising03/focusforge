import React, { useState, useEffect } from 'react';
import { Calendar, TrendingUp, Target, CheckCircle, AlertCircle, BarChart3 } from 'lucide-react';

interface WeeklyReview {
  id: string;
  user_id: string;
  week_start_date: string;
  week_end_date: string;
  system_effectiveness_score: number;
  habit_consistency_analysis: {
    overall_consistency: number;
    habit_performance: Array<{
      habit_id: string;
      habit_name: string;
      weekly_completion_rate: number;
      streak_changes: number;
      quality_trend: 'improving' | 'declining' | 'stable';
      effectiveness_score: number;
    }>;
    consistency_trends: Array<{
      period: string;
      consistency_score: number;
      trend_direction: 'up' | 'down' | 'stable';
      contributing_factors: string[];
    }>;
    stacking_opportunities: Array<{
      anchor_habit: string;
      suggested_habit: string;
      confidence_score: number;
      rationale: string;
    }>;
  };
  routine_performance_analysis: {
    average_completion_rate: number;
    most_successful_routines: string[];
    least_successful_routines: string[];
    time_utilization_efficiency: number;
    adaptation_effectiveness: number;
  };
  identified_patterns: Array<{
    pattern_type: 'productivity' | 'energy' | 'focus' | 'behavioral' | 'environmental';
    pattern_description: string;
    frequency: number;
    impact_level: 'high' | 'medium' | 'low';
    correlation_strength: number;
    actionable_insights: string[];
  }>;
  system_adjustments: Array<{
    adjustment_type: 'routine_simplification' | 'complexity_increase' | 'timing_optimization' | 'habit_modification';
    reason: string;
    expected_impact: number;
    implementation_priority: 'high' | 'medium' | 'low';
    specific_changes: string[];
  }>;
  insights: string[];
  goals_for_next_week: string[];
  created_at: string;
}

interface CreateWeeklyReviewRequest {
  week_start_date: string;
  additional_insights?: string[];
  focus_areas?: string[];
}

interface WeeklyReviewProps {
  onReviewCreated?: (review: WeeklyReview) => void;
}

export const WeeklyReview: React.FC<WeeklyReviewProps> = ({ onReviewCreated }) => {
  const [currentReview, setCurrentReview] = useState<WeeklyReview | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [reviewHistory, setReviewHistory] = useState<WeeklyReview[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [additionalInsights, setAdditionalInsights] = useState<string>('');
  const [focusAreas, setFocusAreas] = useState<string>('');

  useEffect(() => {
    loadReviewHistory();
  }, []);

  const loadReviewHistory = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/review-cycles/weekly/history?weeks=4', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to load review history');
      }

      const data = await response.json();
      setReviewHistory(data.data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load review history');
    } finally {
      setLoading(false);
    }
  };

  const createWeeklyReview = async () => {
    try {
      setIsCreating(true);
      setError(null);

      const weekStartDate = getWeekStartDate();
      const request: CreateWeeklyReviewRequest = {
        week_start_date: weekStartDate.toISOString().split('T')[0],
        additional_insights: additionalInsights.trim() ? [additionalInsights.trim()] : undefined,
        focus_areas: focusAreas.trim() ? focusAreas.split(',').map(area => area.trim()) : undefined
      };

      const response = await fetch('/api/review-cycles/weekly', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(request)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create weekly review');
      }

      const data = await response.json();
      const newReview = data.data;
      
      setCurrentReview(newReview);
      setReviewHistory(prev => [newReview, ...prev]);
      setAdditionalInsights('');
      setFocusAreas('');
      
      if (onReviewCreated) {
        onReviewCreated(newReview);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create weekly review');
    } finally {
      setIsCreating(false);
    }
  };

  const getWeekStartDate = (): Date => {
    const today = new Date();
    const dayOfWeek = today.getDay();
    const daysToSubtract = dayOfWeek === 0 ? 6 : dayOfWeek - 1; // Monday as start of week
    const weekStart = new Date(today);
    weekStart.setDate(today.getDate() - daysToSubtract);
    weekStart.setHours(0, 0, 0, 0);
    return weekStart;
  };

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const getScoreColor = (score: number): string => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreBackground = (score: number): string => {
    if (score >= 80) return 'bg-green-50 border-green-200';
    if (score >= 60) return 'bg-yellow-50 border-yellow-200';
    return 'bg-red-50 border-red-200';
  };

  const getTrendIcon = (trend: 'up' | 'down' | 'stable') => {
    switch (trend) {
      case 'up':
        return <TrendingUp className="w-4 h-4 text-green-600" />;
      case 'down':
        return <TrendingUp className="w-4 h-4 text-red-600 rotate-180" />;
      default:
        return <BarChart3 className="w-4 h-4 text-gray-600" />;
    }
  };

  const getPriorityColor = (priority: 'high' | 'medium' | 'low'): string => {
    switch (priority) {
      case 'high':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low':
        return 'bg-green-100 text-green-800 border-green-200';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <Calendar className="w-6 h-6 text-blue-600" />
            <h1 className="text-2xl font-semibold text-gray-900">Weekly Review</h1>
          </div>
          
          {!currentReview && (
            <button
              onClick={createWeeklyReview}
              disabled={isCreating}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
            >
              {isCreating ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>Creating...</span>
                </>
              ) : (
                <>
                  <CheckCircle className="w-4 h-4" />
                  <span>Create This Week's Review</span>
                </>
              )}
            </button>
          )}
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center space-x-2">
            <AlertCircle className="w-5 h-5 text-red-600" />
            <span className="text-red-700">{error}</span>
          </div>
        )}

        {!currentReview && !isCreating && (
          <div className="space-y-4 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Additional Insights (Optional)
              </label>
              <textarea
                value={additionalInsights}
                onChange={(e) => setAdditionalInsights(e.target.value)}
                placeholder="Any specific observations or insights from this week..."
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                rows={3}
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Focus Areas for Next Week (Optional)
              </label>
              <input
                type="text"
                value={focusAreas}
                onChange={(e) => setFocusAreas(e.target.value)}
                placeholder="e.g., Deep work, Morning routine, Exercise consistency"
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <p className="text-sm text-gray-500 mt-1">Separate multiple areas with commas</p>
            </div>
          </div>
        )}
      </div>

      {currentReview && (
        <div className="space-y-6">
          {/* System Effectiveness Score */}
          <div className={`bg-white rounded-lg shadow-sm border p-6 ${getScoreBackground(currentReview.system_effectiveness_score)}`}>
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">System Effectiveness</h2>
              <div className={`text-3xl font-bold ${getScoreColor(currentReview.system_effectiveness_score)}`}>
                {currentReview.system_effectiveness_score}%
              </div>
            </div>
            <p className="text-sm text-gray-600 mt-2">
              Week of {formatDate(currentReview.week_start_date)} - {formatDate(currentReview.week_end_date)}
            </p>
          </div>

          {/* Habit Consistency Analysis */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Habit Consistency Analysis</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="font-medium text-gray-900 mb-3">Overall Consistency</h3>
                <div className={`text-2xl font-bold ${getScoreColor(currentReview.habit_consistency_analysis.overall_consistency)}`}>
                  {currentReview.habit_consistency_analysis.overall_consistency}%
                </div>
              </div>
              
              <div>
                <h3 className="font-medium text-gray-900 mb-3">Habit Performance</h3>
                <div className="space-y-2">
                  {currentReview.habit_consistency_analysis.habit_performance.slice(0, 3).map((habit, index) => (
                    <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                      <span className="text-sm font-medium">{habit.habit_name}</span>
                      <div className="flex items-center space-x-2">
                        <span className={`text-sm ${getScoreColor(habit.weekly_completion_rate)}`}>
                          {habit.weekly_completion_rate}%
                        </span>
                        {getTrendIcon(habit.quality_trend === 'improving' ? 'up' : 
                                    habit.quality_trend === 'declining' ? 'down' : 'stable')}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {currentReview.habit_consistency_analysis.stacking_opportunities.length > 0 && (
              <div className="mt-6">
                <h3 className="font-medium text-gray-900 mb-3">Habit Stacking Opportunities</h3>
                <div className="space-y-2">
                  {currentReview.habit_consistency_analysis.stacking_opportunities.slice(0, 2).map((opportunity, index) => (
                    <div key={index} className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                      <p className="text-sm font-medium text-blue-900">
                        After "{opportunity.anchor_habit}", try "{opportunity.suggested_habit}"
                      </p>
                      <p className="text-xs text-blue-700 mt-1">{opportunity.rationale}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Routine Performance */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Routine Performance</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="text-center">
                <div className={`text-xl font-bold ${getScoreColor(currentReview.routine_performance_analysis.average_completion_rate)}`}>
                  {currentReview.routine_performance_analysis.average_completion_rate}%
                </div>
                <p className="text-sm text-gray-600">Completion Rate</p>
              </div>
              <div className="text-center">
                <div className={`text-xl font-bold ${getScoreColor(currentReview.routine_performance_analysis.time_utilization_efficiency)}`}>
                  {currentReview.routine_performance_analysis.time_utilization_efficiency}%
                </div>
                <p className="text-sm text-gray-600">Time Efficiency</p>
              </div>
              <div className="text-center">
                <div className={`text-xl font-bold ${getScoreColor(currentReview.routine_performance_analysis.adaptation_effectiveness)}`}>
                  {currentReview.routine_performance_analysis.adaptation_effectiveness}%
                </div>
                <p className="text-sm text-gray-600">Adaptation</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="font-medium text-gray-900 mb-2">Most Successful</h3>
                <ul className="space-y-1">
                  {currentReview.routine_performance_analysis.most_successful_routines.map((routine, index) => (
                    <li key={index} className="text-sm text-green-700 flex items-center space-x-2">
                      <CheckCircle className="w-3 h-3" />
                      <span>{routine}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <h3 className="font-medium text-gray-900 mb-2">Needs Attention</h3>
                <ul className="space-y-1">
                  {currentReview.routine_performance_analysis.least_successful_routines.map((routine, index) => (
                    <li key={index} className="text-sm text-red-700 flex items-center space-x-2">
                      <AlertCircle className="w-3 h-3" />
                      <span>{routine}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          {/* System Adjustments */}
          {currentReview.system_adjustments.length > 0 && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Recommended Adjustments</h2>
              <div className="space-y-3">
                {currentReview.system_adjustments.map((adjustment, index) => (
                  <div key={index} className="p-4 border border-gray-200 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-medium text-gray-900 capitalize">
                        {adjustment.adjustment_type.replace('_', ' ')}
                      </h3>
                      <span className={`px-2 py-1 text-xs font-medium rounded border ${getPriorityColor(adjustment.implementation_priority)}`}>
                        {adjustment.implementation_priority} priority
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mb-2">{adjustment.reason}</p>
                    <ul className="text-sm text-gray-700 space-y-1">
                      {adjustment.specific_changes.map((change, changeIndex) => (
                        <li key={changeIndex} className="flex items-start space-x-2">
                          <Target className="w-3 h-3 mt-0.5 text-blue-600" />
                          <span>{change}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Insights and Goals */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Key Insights</h2>
              <ul className="space-y-2">
                {currentReview.insights.map((insight, index) => (
                  <li key={index} className="text-sm text-gray-700 flex items-start space-x-2">
                    <div className="w-2 h-2 bg-blue-600 rounded-full mt-2 flex-shrink-0"></div>
                    <span>{insight}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Goals for Next Week</h2>
              <ul className="space-y-2">
                {currentReview.goals_for_next_week.map((goal, index) => (
                  <li key={index} className="text-sm text-gray-700 flex items-start space-x-2">
                    <Target className="w-4 h-4 mt-0.5 text-green-600 flex-shrink-0" />
                    <span>{goal}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Review History */}
      {reviewHistory.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent Reviews</h2>
          <div className="space-y-3">
            {reviewHistory.slice(0, 4).map((review) => (
              <div key={review.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-medium text-gray-900">
                    {formatDate(review.week_start_date)} - {formatDate(review.week_end_date)}
                  </p>
                  <p className="text-sm text-gray-600">
                    System effectiveness: {review.system_effectiveness_score}% • 
                    Habit consistency: {review.habit_consistency_analysis.overall_consistency}%
                  </p>
                </div>
                <div className="text-right">
                  <div className={`text-lg font-semibold ${getScoreColor(review.system_effectiveness_score)}`}>
                    {review.system_effectiveness_score}%
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};