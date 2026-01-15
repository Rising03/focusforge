import React, { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';
import { TrendingUp, CheckCircle, XCircle, RotateCcw, Calendar, Filter, Zap } from 'lucide-react';

interface HabitFormationData {
  habit_name: string;
  formation_start_date: string;
  days_to_consistency: number;
  current_streak: number;
  formation_challenges: string[];
}

interface HabitAbandonmentData {
  habit_name: string;
  abandonment_date: string;
  days_attempted: number;
  abandonment_reasons: string[];
  lessons_learned: string[];
}

interface HabitEvolutionData {
  habit_name: string;
  original_form: string;
  evolved_form: string;
  evolution_date: string;
  evolution_reason: string;
  effectiveness_change: number;
}

interface EvolutionPattern {
  pattern_name: string;
  pattern_description: string;
  frequency: number;
  success_correlation: number;
}

interface HabitEvolutionAnalysis {
  habits_formed: HabitFormationData[];
  habits_abandoned: HabitAbandonmentData[];
  habits_evolved: HabitEvolutionData[];
  formation_success_rate: number;
  evolution_patterns: EvolutionPattern[];
}

interface HabitEvolutionTrackingProps {
  className?: string;
}

export const HabitEvolutionTracking: React.FC<HabitEvolutionTrackingProps> = ({ className = '' }) => {
  const [evolutionData, setEvolutionData] = useState<HabitEvolutionAnalysis | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedTimeframe, setSelectedTimeframe] = useState<number>(12);
  const [activeTab, setActiveTab] = useState<'formed' | 'evolved' | 'abandoned' | 'patterns'>('formed');

  useEffect(() => {
    loadHabitEvolution();
  }, [selectedTimeframe]);

  const loadHabitEvolution = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch(`/api/review-cycles/habit-evolution?months=${selectedTimeframe}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to load habit evolution data');
      }

      const data = await response.json();
      setEvolutionData(data.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load habit evolution data');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const getSuccessRateColor = (rate: number): string => {
    if (rate >= 80) return 'text-green-600';
    if (rate >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getEffectivenessColor = (change: number): string => {
    if (change > 0) return 'text-green-600';
    if (change < 0) return 'text-red-600';
    return 'text-gray-600';
  };

  // Generate timeline data for visualization
  const generateTimelineData = () => {
    if (!evolutionData) return [];

    const events: Array<{
      date: string;
      type: 'formed' | 'evolved' | 'abandoned';
      habit_name: string;
      value: number;
    }> = [];

    evolutionData.habits_formed.forEach(habit => {
      events.push({
        date: habit.formation_start_date,
        type: 'formed',
        habit_name: habit.habit_name,
        value: 1
      });
    });

    evolutionData.habits_evolved.forEach(habit => {
      events.push({
        date: habit.evolution_date,
        type: 'evolved',
        habit_name: habit.habit_name,
        value: habit.effectiveness_change
      });
    });

    evolutionData.habits_abandoned.forEach(habit => {
      events.push({
        date: habit.abandonment_date,
        type: 'abandoned',
        habit_name: habit.habit_name,
        value: -1
      });
    });

    return events.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  };

  const timelineData = generateTimelineData();

  if (loading) {
    return (
      <div className={`flex items-center justify-center p-8 ${className}`}>
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header and Controls */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <Zap className="w-6 h-6 text-orange-600" />
            <h2 className="text-xl font-semibold text-gray-900">Habit Evolution Tracking</h2>
          </div>
          
          <div className="flex items-center space-x-2">
            <Calendar className="w-4 h-4 text-gray-500" />
            <select
              value={selectedTimeframe}
              onChange={(e) => setSelectedTimeframe(Number(e.target.value))}
              className="border border-gray-300 rounded-lg px-3 py-1 text-sm focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            >
              <option value={6}>6 months</option>
              <option value={12}>12 months</option>
              <option value={18}>18 months</option>
              <option value={24}>24 months</option>
            </select>
          </div>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-700">{error}</p>
          </div>
        )}

        {!evolutionData && !loading && (
          <div className="text-center py-8">
            <Zap className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">No habit evolution data available yet.</p>
            <p className="text-sm text-gray-500 mt-2">
              Data will appear as you form, evolve, and track habits over time.
            </p>
          </div>
        )}
      </div>

      {evolutionData && (
        <>
          {/* Overview Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 text-center">
              <div className="flex items-center justify-center mb-2">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
              <div className="text-2xl font-bold text-green-600">
                {evolutionData.habits_formed.length}
              </div>
              <p className="text-sm text-gray-600">Habits Formed</p>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 text-center">
              <div className="flex items-center justify-center mb-2">
                <RotateCcw className="w-6 h-6 text-blue-600" />
              </div>
              <div className="text-2xl font-bold text-blue-600">
                {evolutionData.habits_evolved.length}
              </div>
              <p className="text-sm text-gray-600">Habits Evolved</p>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 text-center">
              <div className="flex items-center justify-center mb-2">
                <XCircle className="w-6 h-6 text-red-600" />
              </div>
              <div className="text-2xl font-bold text-red-600">
                {evolutionData.habits_abandoned.length}
              </div>
              <p className="text-sm text-gray-600">Habits Abandoned</p>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 text-center">
              <div className="flex items-center justify-center mb-2">
                <TrendingUp className="w-6 h-6 text-purple-600" />
              </div>
              <div className={`text-2xl font-bold ${getSuccessRateColor(evolutionData.formation_success_rate)}`}>
                {evolutionData.formation_success_rate}%
              </div>
              <p className="text-sm text-gray-600">Success Rate</p>
            </div>
          </div>

          {/* Evolution Timeline */}
          {timelineData.length > 0 && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Habit Evolution Timeline</h3>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={timelineData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="date" 
                    tickFormatter={(value) => new Date(value).toLocaleDateString('en-US', { month: 'short', year: '2-digit' })}
                  />
                  <YAxis />
                  <Tooltip 
                    labelFormatter={(value) => formatDate(value)}
                    formatter={(value, name, props) => [
                      `${props.payload.habit_name}: ${props.payload.type}`,
                      'Event'
                    ]}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="value" 
                    stroke="#f97316" 
                    fill="#fed7aa" 
                    strokeWidth={2}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Tab Navigation */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="border-b border-gray-200">
              <nav className="flex space-x-8 px-6">
                {[
                  { key: 'formed', label: 'Formed Habits', icon: CheckCircle, count: evolutionData.habits_formed.length },
                  { key: 'evolved', label: 'Evolved Habits', icon: RotateCcw, count: evolutionData.habits_evolved.length },
                  { key: 'abandoned', label: 'Abandoned Habits', icon: XCircle, count: evolutionData.habits_abandoned.length },
                  { key: 'patterns', label: 'Evolution Patterns', icon: TrendingUp, count: evolutionData.evolution_patterns.length }
                ].map(({ key, label, icon: Icon, count }) => (
                  <button
                    key={key}
                    onClick={() => setActiveTab(key as any)}
                    className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 ${
                      activeTab === key
                        ? 'border-orange-500 text-orange-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{label}</span>
                    <span className="bg-gray-100 text-gray-600 px-2 py-1 rounded-full text-xs">
                      {count}
                    </span>
                  </button>
                ))}
              </nav>
            </div>

            <div className="p-6">
              {/* Formed Habits Tab */}
              {activeTab === 'formed' && (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900">Successfully Formed Habits</h3>
                  {evolutionData.habits_formed.length === 0 ? (
                    <p className="text-gray-600">No habits have been successfully formed yet.</p>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {evolutionData.habits_formed.map((habit, index) => (
                        <div key={index} className="border border-green-200 bg-green-50 rounded-lg p-4">
                          <div className="flex items-center justify-between mb-3">
                            <h4 className="font-medium text-green-900">{habit.habit_name}</h4>
                            <span className="text-sm text-green-700 font-medium">
                              {habit.current_streak} day streak
                            </span>
                          </div>
                          
                          <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                              <span className="text-green-700">Started:</span>
                              <span className="text-green-800 font-medium">
                                {formatDate(habit.formation_start_date)}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-green-700">Days to consistency:</span>
                              <span className="text-green-800 font-medium">
                                {habit.days_to_consistency} days
                              </span>
                            </div>
                          </div>

                          {habit.formation_challenges.length > 0 && (
                            <div className="mt-3">
                              <h5 className="text-sm font-medium text-green-800 mb-1">Challenges Overcome:</h5>
                              <ul className="text-sm text-green-700 space-y-1">
                                {habit.formation_challenges.map((challenge, cIndex) => (
                                  <li key={cIndex} className="flex items-start space-x-2">
                                    <div className="w-1.5 h-1.5 bg-green-600 rounded-full mt-2 flex-shrink-0"></div>
                                    <span>{challenge}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Evolved Habits Tab */}
              {activeTab === 'evolved' && (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900">Evolved Habits</h3>
                  {evolutionData.habits_evolved.length === 0 ? (
                    <p className="text-gray-600">No habits have evolved yet.</p>
                  ) : (
                    <div className="space-y-4">
                      {evolutionData.habits_evolved.map((habit, index) => (
                        <div key={index} className="border border-blue-200 bg-blue-50 rounded-lg p-4">
                          <div className="flex items-center justify-between mb-3">
                            <h4 className="font-medium text-blue-900">{habit.habit_name}</h4>
                            <div className="flex items-center space-x-2">
                              <span className={`text-sm font-medium ${getEffectivenessColor(habit.effectiveness_change)}`}>
                                {habit.effectiveness_change > 0 ? '+' : ''}{habit.effectiveness_change}%
                              </span>
                              <span className="text-xs text-blue-600">effectiveness</span>
                            </div>
                          </div>

                          <div className="space-y-3">
                            <div>
                              <div className="text-sm text-blue-700 mb-1">Evolution:</div>
                              <div className="bg-white rounded p-2 text-sm">
                                <div className="text-gray-600 mb-1">From: <span className="font-medium">{habit.original_form}</span></div>
                                <div className="text-gray-600">To: <span className="font-medium text-blue-800">{habit.evolved_form}</span></div>
                              </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                              <div>
                                <span className="text-blue-700">Evolution Date:</span>
                                <div className="font-medium text-blue-800">{formatDate(habit.evolution_date)}</div>
                              </div>
                              <div>
                                <span className="text-blue-700">Reason:</span>
                                <div className="font-medium text-blue-800">{habit.evolution_reason}</div>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Abandoned Habits Tab */}
              {activeTab === 'abandoned' && (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900">Abandoned Habits</h3>
                  {evolutionData.habits_abandoned.length === 0 ? (
                    <p className="text-gray-600">No habits have been abandoned.</p>
                  ) : (
                    <div className="space-y-4">
                      {evolutionData.habits_abandoned.map((habit, index) => (
                        <div key={index} className="border border-red-200 bg-red-50 rounded-lg p-4">
                          <div className="flex items-center justify-between mb-3">
                            <h4 className="font-medium text-red-900">{habit.habit_name}</h4>
                            <span className="text-sm text-red-700">
                              {habit.days_attempted} days attempted
                            </span>
                          </div>

                          <div className="text-sm text-red-700 mb-3">
                            Abandoned: {formatDate(habit.abandonment_date)}
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <h5 className="text-sm font-medium text-red-800 mb-2">Abandonment Reasons:</h5>
                              <ul className="text-sm text-red-700 space-y-1">
                                {habit.abandonment_reasons.map((reason, rIndex) => (
                                  <li key={rIndex} className="flex items-start space-x-2">
                                    <div className="w-1.5 h-1.5 bg-red-600 rounded-full mt-2 flex-shrink-0"></div>
                                    <span>{reason}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>

                            <div>
                              <h5 className="text-sm font-medium text-red-800 mb-2">Lessons Learned:</h5>
                              <ul className="text-sm text-red-700 space-y-1">
                                {habit.lessons_learned.map((lesson, lIndex) => (
                                  <li key={lIndex} className="flex items-start space-x-2">
                                    <div className="w-1.5 h-1.5 bg-red-600 rounded-full mt-2 flex-shrink-0"></div>
                                    <span>{lesson}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Evolution Patterns Tab */}
              {activeTab === 'patterns' && (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900">Evolution Patterns</h3>
                  {evolutionData.evolution_patterns.length === 0 ? (
                    <p className="text-gray-600">No evolution patterns identified yet.</p>
                  ) : (
                    <div className="space-y-4">
                      {evolutionData.evolution_patterns.map((pattern, index) => (
                        <div key={index} className="border border-purple-200 bg-purple-50 rounded-lg p-4">
                          <div className="flex items-center justify-between mb-3">
                            <h4 className="font-medium text-purple-900">{pattern.pattern_name}</h4>
                            <div className="flex items-center space-x-4 text-sm">
                              <span className="text-purple-700">
                                {pattern.frequency} occurrences
                              </span>
                              <span className="text-purple-700">
                                {Math.round(pattern.success_correlation * 100)}% success correlation
                              </span>
                            </div>
                          </div>

                          <p className="text-sm text-purple-800">{pattern.pattern_description}</p>

                          <div className="mt-3 flex items-center space-x-4">
                            <div className="flex items-center space-x-2">
                              <div className="w-3 h-3 bg-purple-600 rounded-full"></div>
                              <span className="text-sm text-purple-700">
                                Pattern strength: {Math.round(pattern.success_correlation * 100)}%
                              </span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};