import React, { useState, useEffect } from 'react';
import { Calendar, TrendingUp, Target, CheckCircle, AlertCircle, BarChart3, User, Brain, Zap } from 'lucide-react';

interface MonthlyReview {
  id: string;
  user_id: string;
  month_start_date: string;
  month_end_date: string;
  identity_alignment_score: number;
  long_term_goal_progress: Array<{
    goal_category: string;
    goal_description: string;
    progress_percentage: number;
    milestones_achieved: string[];
    obstacles_encountered: string[];
    trajectory: 'on_track' | 'ahead' | 'behind' | 'stalled';
  }>;
  habit_evolution_analysis: {
    habits_formed: Array<{
      habit_name: string;
      formation_start_date: string;
      days_to_consistency: number;
      current_streak: number;
      formation_challenges: string[];
    }>;
    habits_abandoned: Array<{
      habit_name: string;
      abandonment_date: string;
      days_attempted: number;
      abandonment_reasons: string[];
      lessons_learned: string[];
    }>;
    habits_evolved: Array<{
      habit_name: string;
      original_form: string;
      evolved_form: string;
      evolution_date: string;
      evolution_reason: string;
      effectiveness_change: number;
    }>;
    formation_success_rate: number;
    evolution_patterns: Array<{
      pattern_name: string;
      pattern_description: string;
      frequency: number;
      success_correlation: number;
    }>;
  };
  productivity_trend_analysis: {
    monthly_productivity_score: number;
    productivity_trend: 'improving' | 'declining' | 'stable';
    deep_work_evolution: {
      average_daily_hours: number;
      quality_improvement: number;
      session_length_optimization: number;
      distraction_resistance: number;
    };
    focus_quality_evolution: {
      average_focus_score: number;
      attention_span_improvement: number;
      distraction_frequency_change: number;
      focus_consistency: number;
    };
    energy_management_evolution: {
      energy_awareness_score: number;
      peak_utilization_efficiency: number;
      recovery_optimization: number;
      energy_consistency: number;
    };
  };
  behavioral_pattern_insights: Array<{
    insight_category: 'motivation' | 'obstacles' | 'triggers' | 'rewards' | 'environment';
    insight_description: string;
    pattern_strength: number;
    behavioral_correlation: number;
    actionable_recommendations: string[];
  }>;
  systematic_adjustments: Array<{
    adjustment_category: 'system_design' | 'habit_architecture' | 'routine_structure' | 'feedback_loops';
    current_approach: string;
    proposed_adjustment: string;
    rationale: string;
    expected_outcomes: string[];
    implementation_timeline: string;
  }>;
  identity_reinforcement_plan: {
    target_identity: string;
    current_alignment_score: number;
    identity_behaviors_to_strengthen: Array<{
      behavior_name: string;
      current_consistency: number;
      target_consistency: number;
      reinforcement_strategies: string[];
      identity_connection: string;
    }>;
    identity_narratives: string[];
    monthly_identity_goals: string[];
  };
  goals_for_next_month: string[];
  created_at: string;
}

interface CreateMonthlyReviewRequest {
  month_start_date: string;
  additional_insights?: string[];
  long_term_reflections?: string[];
}

interface MonthlyReviewProps {
  onReviewCreated?: (review: MonthlyReview) => void;
}

export const MonthlyReview: React.FC<MonthlyReviewProps> = ({ onReviewCreated }) => {
  const [currentReview, setCurrentReview] = useState<MonthlyReview | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [reviewHistory, setReviewHistory] = useState<MonthlyReview[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [additionalInsights, setAdditionalInsights] = useState<string>('');
  const [longTermReflections, setLongTermReflections] = useState<string>('');

  useEffect(() => {
    loadReviewHistory();
  }, []);

  const loadReviewHistory = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/review-cycles/monthly/history?months=3', {
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

  const createMonthlyReview = async () => {
    try {
      setIsCreating(true);
      setError(null);

      const monthStartDate = getMonthStartDate();
      const request: CreateMonthlyReviewRequest = {
        month_start_date: monthStartDate.toISOString().split('T')[0],
        additional_insights: additionalInsights.trim() ? [additionalInsights.trim()] : undefined,
        long_term_reflections: longTermReflections.trim() ? longTermReflections.split(',').map(r => r.trim()) : undefined
      };

      const response = await fetch('/api/review-cycles/monthly', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(request)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create monthly review');
      }

      const data = await response.json();
      const newReview = data.data;
      
      setCurrentReview(newReview);
      setReviewHistory(prev => [newReview, ...prev]);
      setAdditionalInsights('');
      setLongTermReflections('');
      
      if (onReviewCreated) {
        onReviewCreated(newReview);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create monthly review');
    } finally {
      setIsCreating(false);
    }
  };

  const getMonthStartDate = (): Date => {
    const today = new Date();
    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
    return monthStart;
  };

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'long',
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

  const getTrendIcon = (trend: 'improving' | 'declining' | 'stable') => {
    switch (trend) {
      case 'improving':
        return <TrendingUp className="w-4 h-4 text-green-600" />;
      case 'declining':
        return <TrendingUp className="w-4 h-4 text-red-600 rotate-180" />;
      default:
        return <BarChart3 className="w-4 h-4 text-gray-600" />;
    }
  };

  const getTrajectoryColor = (trajectory: string): string => {
    switch (trajectory) {
      case 'ahead':
        return 'text-green-600 bg-green-50 border-green-200';
      case 'on_track':
        return 'text-blue-600 bg-blue-50 border-blue-200';
      case 'behind':
        return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'stalled':
        return 'text-red-600 bg-red-50 border-red-200';
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200';
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
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <Calendar className="w-6 h-6 text-purple-600" />
            <h1 className="text-2xl font-semibold text-gray-900">Monthly Review</h1>
          </div>
          
          {!currentReview && (
            <button
              onClick={createMonthlyReview}
              disabled={isCreating}
              className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
            >
              {isCreating ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>Creating...</span>
                </>
              ) : (
                <>
                  <CheckCircle className="w-4 h-4" />
                  <span>Create This Month's Review</span>
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
                placeholder="Any specific observations or insights from this month..."
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                rows={3}
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Long-term Reflections (Optional)
              </label>
              <input
                type="text"
                value={longTermReflections}
                onChange={(e) => setLongTermReflections(e.target.value)}
                placeholder="e.g., Identity development, Goal alignment, System effectiveness"
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
              <p className="text-sm text-gray-500 mt-1">Separate multiple reflections with commas</p>
            </div>
          </div>
        )}
      </div>

      {currentReview && (
        <div className="space-y-6">
          {/* Identity Alignment Score */}
          <div className={`bg-white rounded-lg shadow-sm border p-6 ${getScoreBackground(currentReview.identity_alignment_score)}`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <User className="w-6 h-6 text-purple-600" />
                <h2 className="text-lg font-semibold text-gray-900">Identity Alignment</h2>
              </div>
              <div className={`text-3xl font-bold ${getScoreColor(currentReview.identity_alignment_score)}`}>
                {currentReview.identity_alignment_score}%
              </div>
            </div>
            <p className="text-sm text-gray-600 mt-2">
              {formatDate(currentReview.month_start_date)}
            </p>
          </div>

          {/* Long-term Goal Progress */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Long-term Goal Progress</h2>
            <div className="space-y-4">
              {currentReview.long_term_goal_progress.map((goal, index) => (
                <div key={index} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <h3 className="font-medium text-gray-900">{goal.goal_category}</h3>
                      <p className="text-sm text-gray-600">{goal.goal_description}</p>
                    </div>
                    <div className="text-right">
                      <div className={`text-xl font-bold ${getScoreColor(goal.progress_percentage)}`}>
                        {goal.progress_percentage}%
                      </div>
                      <span className={`px-2 py-1 text-xs font-medium rounded border ${getTrajectoryColor(goal.trajectory)}`}>
                        {goal.trajectory.replace('_', ' ')}
                      </span>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <h4 className="text-sm font-medium text-green-700 mb-1">Milestones Achieved</h4>
                      <ul className="text-sm text-gray-600 space-y-1">
                        {goal.milestones_achieved.map((milestone, mIndex) => (
                          <li key={mIndex} className="flex items-start space-x-2">
                            <CheckCircle className="w-3 h-3 mt-0.5 text-green-600" />
                            <span>{milestone}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-red-700 mb-1">Obstacles Encountered</h4>
                      <ul className="text-sm text-gray-600 space-y-1">
                        {goal.obstacles_encountered.map((obstacle, oIndex) => (
                          <li key={oIndex} className="flex items-start space-x-2">
                            <AlertCircle className="w-3 h-3 mt-0.5 text-red-600" />
                            <span>{obstacle}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Productivity Trend Analysis */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center space-x-3 mb-4">
              <Brain className="w-6 h-6 text-blue-600" />
              <h2 className="text-lg font-semibold text-gray-900">Productivity Evolution</h2>
              {getTrendIcon(currentReview.productivity_trend_analysis.productivity_trend)}
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-4">
                <h3 className="font-medium text-gray-900">Deep Work Evolution</h3>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Daily Hours</span>
                    <span className="font-medium">{currentReview.productivity_trend_analysis.deep_work_evolution.average_daily_hours}h</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Quality Improvement</span>
                    <span className="font-medium text-green-600">+{currentReview.productivity_trend_analysis.deep_work_evolution.quality_improvement}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Distraction Resistance</span>
                    <span className="font-medium">{currentReview.productivity_trend_analysis.deep_work_evolution.distraction_resistance}%</span>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="font-medium text-gray-900">Focus Quality</h3>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Average Score</span>
                    <span className="font-medium">{currentReview.productivity_trend_analysis.focus_quality_evolution.average_focus_score}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Attention Span</span>
                    <span className="font-medium text-green-600">+{currentReview.productivity_trend_analysis.focus_quality_evolution.attention_span_improvement}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Consistency</span>
                    <span className="font-medium">{currentReview.productivity_trend_analysis.focus_quality_evolution.focus_consistency}%</span>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="font-medium text-gray-900">Energy Management</h3>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Awareness</span>
                    <span className="font-medium">{currentReview.productivity_trend_analysis.energy_management_evolution.energy_awareness_score}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Peak Utilization</span>
                    <span className="font-medium">{currentReview.productivity_trend_analysis.energy_management_evolution.peak_utilization_efficiency}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Recovery</span>
                    <span className="font-medium">{currentReview.productivity_trend_analysis.energy_management_evolution.recovery_optimization}%</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Habit Evolution Analysis */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center space-x-3 mb-4">
              <Zap className="w-6 h-6 text-orange-600" />
              <h2 className="text-lg font-semibold text-gray-900">Habit Evolution</h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {currentReview.habit_evolution_analysis.habits_formed.length}
                </div>
                <p className="text-sm text-gray-600">Habits Formed</p>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {currentReview.habit_evolution_analysis.habits_evolved.length}
                </div>
                <p className="text-sm text-gray-600">Habits Evolved</p>
              </div>
              <div className="text-center">
                <div className={`text-2xl font-bold ${getScoreColor(currentReview.habit_evolution_analysis.formation_success_rate)}`}>
                  {currentReview.habit_evolution_analysis.formation_success_rate}%
                </div>
                <p className="text-sm text-gray-600">Success Rate</p>
              </div>
            </div>

            {currentReview.habit_evolution_analysis.habits_formed.length > 0 && (
              <div className="mb-6">
                <h3 className="font-medium text-gray-900 mb-3">Successfully Formed Habits</h3>
                <div className="space-y-2">
                  {currentReview.habit_evolution_analysis.habits_formed.map((habit, index) => (
                    <div key={index} className="p-3 bg-green-50 border border-green-200 rounded-lg">
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-green-900">{habit.habit_name}</span>
                        <span className="text-sm text-green-700">{habit.current_streak} day streak</span>
                      </div>
                      <p className="text-sm text-green-700 mt-1">
                        Took {habit.days_to_consistency} days to establish consistency
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {currentReview.habit_evolution_analysis.habits_evolved.length > 0 && (
              <div>
                <h3 className="font-medium text-gray-900 mb-3">Evolved Habits</h3>
                <div className="space-y-2">
                  {currentReview.habit_evolution_analysis.habits_evolved.map((habit, index) => (
                    <div key={index} className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-blue-900">{habit.habit_name}</span>
                        <span className={`text-sm ${habit.effectiveness_change > 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {habit.effectiveness_change > 0 ? '+' : ''}{habit.effectiveness_change}% effectiveness
                        </span>
                      </div>
                      <p className="text-sm text-blue-700 mt-1">
                        From: {habit.original_form} → To: {habit.evolved_form}
                      </p>
                      <p className="text-xs text-blue-600 mt-1">{habit.evolution_reason}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Identity Reinforcement Plan */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Identity Reinforcement Plan</h2>
            
            <div className="mb-6">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-medium text-gray-900">Target Identity</h3>
                <span className="text-lg font-semibold text-purple-600">
                  {currentReview.identity_reinforcement_plan.target_identity}
                </span>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Identity Narratives</h4>
                  <ul className="space-y-1">
                    {currentReview.identity_reinforcement_plan.identity_narratives.map((narrative, index) => (
                      <li key={index} className="text-sm text-gray-600 italic">
                        "{narrative}"
                      </li>
                    ))}
                  </ul>
                </div>
                
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Monthly Identity Goals</h4>
                  <ul className="space-y-1">
                    {currentReview.identity_reinforcement_plan.monthly_identity_goals.map((goal, index) => (
                      <li key={index} className="text-sm text-gray-600 flex items-start space-x-2">
                        <Target className="w-3 h-3 mt-0.5 text-purple-600" />
                        <span>{goal}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>

            {currentReview.identity_reinforcement_plan.identity_behaviors_to_strengthen.length > 0 && (
              <div>
                <h3 className="font-medium text-gray-900 mb-3">Behaviors to Strengthen</h3>
                <div className="space-y-3">
                  {currentReview.identity_reinforcement_plan.identity_behaviors_to_strengthen.map((behavior, index) => (
                    <div key={index} className="p-4 border border-gray-200 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium text-gray-900">{behavior.behavior_name}</h4>
                        <div className="text-sm text-gray-600">
                          {behavior.current_consistency}% → {behavior.target_consistency}%
                        </div>
                      </div>
                      <p className="text-sm text-gray-600 mb-2">{behavior.identity_connection}</p>
                      <div className="flex flex-wrap gap-1">
                        {behavior.reinforcement_strategies.map((strategy, sIndex) => (
                          <span key={sIndex} className="px-2 py-1 text-xs bg-purple-100 text-purple-700 rounded">
                            {strategy}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Goals for Next Month */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Goals for Next Month</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {currentReview.goals_for_next_month.map((goal, index) => (
                <div key={index} className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg">
                  <Target className="w-5 h-5 text-purple-600 mt-0.5 flex-shrink-0" />
                  <span className="text-sm text-gray-700">{goal}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Review History */}
      {reviewHistory.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent Monthly Reviews</h2>
          <div className="space-y-3">
            {reviewHistory.slice(0, 3).map((review) => (
              <div key={review.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-medium text-gray-900">
                    {formatDate(review.month_start_date)}
                  </p>
                  <p className="text-sm text-gray-600">
                    Identity alignment: {review.identity_alignment_score}% • 
                    Productivity: {review.productivity_trend_analysis.monthly_productivity_score}% • 
                    Habits formed: {review.habit_evolution_analysis.habits_formed.length}
                  </p>
                </div>
                <div className="text-right">
                  <div className={`text-lg font-semibold ${getScoreColor(review.identity_alignment_score)}`}>
                    {review.identity_alignment_score}%
                  </div>
                  <div className="text-sm text-gray-500">Identity</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};