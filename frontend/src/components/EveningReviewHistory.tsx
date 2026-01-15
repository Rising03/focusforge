import React, { useState, useEffect } from 'react';
import { 
  EveningReview,
  ReviewHistoryResponse,
  ReviewVisualizationData
} from '../types/eveningReview';
import eveningReviewService from '../services/eveningReviewService';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';

interface EveningReviewHistoryProps {
  onEditReview?: (review: EveningReview) => void;
}

const EveningReviewHistory: React.FC<EveningReviewHistoryProps> = ({ onEditReview }) => {
  const [historyData, setHistoryData] = useState<ReviewHistoryResponse | null>(null);
  const [visualizationData, setVisualizationData] = useState<ReviewVisualizationData | null>(null);
  const [selectedPeriod, setSelectedPeriod] = useState<number>(30);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedView, setSelectedView] = useState<'overview' | 'trends' | 'obstacles'>('overview');

  useEffect(() => {
    loadReviewHistory();
  }, [selectedPeriod]);

  const loadReviewHistory = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const data = await eveningReviewService.getReviewHistory(selectedPeriod);
      setHistoryData(data);
      
      const vizData = eveningReviewService.formatReviewsForVisualization(data.reviews);
      setVisualizationData(vizData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load review history');
      console.error('Error loading review history:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (date: Date | string) => {
    const d = typeof date === 'string' ? new Date(date) : date;
    return d.toLocaleDateString('en-US', { 
      weekday: 'short', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  const getCompletionRate = (review: EveningReview) => {
    const total = review.accomplished.length + review.missed.length;
    return total > 0 ? Math.round((review.accomplished.length / total) * 100) : 0;
  };

  const getMoodColor = (mood: number) => {
    if (mood <= 3) return 'text-red-600 bg-red-50';
    if (mood <= 6) return 'text-yellow-600 bg-yellow-50';
    return 'text-green-600 bg-green-50';
  };

  const getEnergyColor = (energy: number) => {
    if (energy <= 3) return 'text-red-600 bg-red-50';
    if (energy <= 6) return 'text-blue-600 bg-blue-50';
    return 'text-green-600 bg-green-50';
  };

  const renderOverview = () => {
    if (!historyData) return null;

    return (
      <div className="space-y-6">
        {/* Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-blue-50 p-4 rounded-lg">
            <h3 className="text-sm font-medium text-blue-900">Completion Rate</h3>
            <p className="text-2xl font-bold text-blue-600">
              {Math.round(historyData.analysis.completion_rate * 100)}%
            </p>
          </div>
          
          <div className="bg-green-50 p-4 rounded-lg">
            <h3 className="text-sm font-medium text-green-900">Total Reviews</h3>
            <p className="text-2xl font-bold text-green-600">
              {historyData.total_reviews}
            </p>
          </div>
          
          <div className="bg-purple-50 p-4 rounded-lg">
            <h3 className="text-sm font-medium text-purple-900">Review Frequency</h3>
            <p className="text-2xl font-bold text-purple-600">
              {Math.round((historyData.total_reviews / selectedPeriod) * 100)}%
            </p>
          </div>
          
          <div className="bg-orange-50 p-4 rounded-lg">
            <h3 className="text-sm font-medium text-orange-900">Avg Mood</h3>
            <p className="text-2xl font-bold text-orange-600">
              {historyData.analysis.mood_trends.length > 0 
                ? historyData.analysis.mood_trends[0].average_mood.toFixed(1)
                : 'N/A'
              }/10
            </p>
          </div>
        </div>

        {/* Recent Reviews */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Recent Reviews</h3>
          </div>
          <div className="divide-y divide-gray-200">
            {historyData.reviews.slice(0, 5).map((review) => (
              <div key={review.id} className="p-6 hover:bg-gray-50">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-4 mb-2">
                      <span className="text-sm font-medium text-gray-900">
                        {formatDate(review.date)}
                      </span>
                      <span className={`px-2 py-1 text-xs rounded-full ${getMoodColor(review.mood)}`}>
                        Mood: {review.mood}/10
                      </span>
                      <span className={`px-2 py-1 text-xs rounded-full ${getEnergyColor(review.energy_level)}`}>
                        Energy: {review.energy_level}/10
                      </span>
                      <span className="px-2 py-1 text-xs rounded-full bg-blue-50 text-blue-600">
                        {getCompletionRate(review)}% Complete
                      </span>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-gray-600 mb-1">Accomplished ({review.accomplished.length}):</p>
                        <ul className="text-green-700 space-y-1">
                          {review.accomplished.slice(0, 3).map((task, index) => (
                            <li key={index} className="truncate">✓ {task}</li>
                          ))}
                          {review.accomplished.length > 3 && (
                            <li className="text-gray-500">+{review.accomplished.length - 3} more</li>
                          )}
                        </ul>
                      </div>
                      
                      {review.missed.length > 0 && (
                        <div>
                          <p className="text-gray-600 mb-1">Missed ({review.missed.length}):</p>
                          <ul className="text-orange-700 space-y-1">
                            {review.missed.slice(0, 3).map((task, index) => (
                              <li key={index} className="truncate">⚠ {task}</li>
                            ))}
                            {review.missed.length > 3 && (
                              <li className="text-gray-500">+{review.missed.length - 3} more</li>
                            )}
                          </ul>
                        </div>
                      )}
                    </div>
                    
                    {review.insights && (
                      <div className="mt-3">
                        <p className="text-gray-600 text-sm">
                          <span className="font-medium">Insights:</span> {review.insights.slice(0, 100)}
                          {review.insights.length > 100 && '...'}
                        </p>
                      </div>
                    )}
                  </div>
                  
                  {onEditReview && (
                    <button
                      onClick={() => onEditReview(review)}
                      className="ml-4 px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
                    >
                      View
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Productivity Insights */}
        {historyData.analysis.productivity_insights.length > 0 && (
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Productivity Insights</h3>
            <div className="space-y-2">
              {historyData.analysis.productivity_insights.map((insight, index) => (
                <div key={index} className="flex items-start space-x-2">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                  <p className="text-gray-700">{insight}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderTrends = () => {
    if (!visualizationData) return null;

    return (
      <div className="space-y-6">
        {/* Completion Rate Trend */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Task Completion Trend</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={visualizationData.completion_trend}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="date" 
                tickFormatter={(date) => new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
              />
              <YAxis 
                domain={[0, 1]}
                tickFormatter={(value) => `${Math.round(value * 100)}%`}
              />
              <Tooltip 
                labelFormatter={(date) => new Date(date).toLocaleDateString()}
                formatter={(value: number) => [`${Math.round(value * 100)}%`, 'Completion Rate']}
              />
              <Line 
                type="monotone" 
                dataKey="rate" 
                stroke="#3B82F6" 
                strokeWidth={2}
                dot={{ fill: '#3B82F6', strokeWidth: 2, r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Mood and Energy Trends */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Mood Trend</h3>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={visualizationData.mood_trend}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="date" 
                  tickFormatter={(date) => new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                />
                <YAxis domain={[1, 10]} />
                <Tooltip 
                  labelFormatter={(date) => new Date(date).toLocaleDateString()}
                  formatter={(value: number) => [`${value}/10`, 'Mood']}
                />
                <Line 
                  type="monotone" 
                  dataKey="mood" 
                  stroke="#10B981" 
                  strokeWidth={2}
                  dot={{ fill: '#10B981', strokeWidth: 2, r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Energy Trend</h3>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={visualizationData.energy_trend}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="date" 
                  tickFormatter={(date) => new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                />
                <YAxis domain={[1, 10]} />
                <Tooltip 
                  labelFormatter={(date) => new Date(date).toLocaleDateString()}
                  formatter={(value: number) => [`${value}/10`, 'Energy']}
                />
                <Line 
                  type="monotone" 
                  dataKey="energy" 
                  stroke="#F59E0B" 
                  strokeWidth={2}
                  dot={{ fill: '#F59E0B', strokeWidth: 2, r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    );
  };

  const renderObstacles = () => {
    if (!visualizationData || !historyData) return null;

    return (
      <div className="space-y-6">
        {/* Common Obstacles Chart */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Common Obstacles</h3>
          {visualizationData.common_obstacles.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={visualizationData.common_obstacles} layout="horizontal">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis dataKey="obstacle" type="category" width={150} />
                <Tooltip formatter={(value: number) => [value, 'Occurrences']} />
                <Bar dataKey="count" fill="#EF4444" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <p>No obstacles recorded yet.</p>
              <p className="text-sm mt-1">Keep tracking your missed tasks to identify patterns.</p>
            </div>
          )}
        </div>

        {/* Obstacle Analysis */}
        {historyData.analysis.common_obstacles.length > 0 && (
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Obstacle Analysis</h3>
            <div className="space-y-4">
              {historyData.analysis.common_obstacles.map((obstacle, index) => (
                <div key={index} className="border-l-4 border-red-500 pl-4">
                  <p className="font-medium text-gray-900">{obstacle}</p>
                  <p className="text-sm text-gray-600 mt-1">
                    Consider strategies to address this recurring challenge.
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Recommendations */}
        <div className="bg-blue-50 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-blue-900 mb-4">Recommendations</h3>
          <div className="space-y-3 text-blue-800">
            <div className="flex items-start space-x-2">
              <div className="w-2 h-2 bg-blue-600 rounded-full mt-2 flex-shrink-0"></div>
              <p>Identify patterns in your most common obstacles and create specific strategies to address them.</p>
            </div>
            <div className="flex items-start space-x-2">
              <div className="w-2 h-2 bg-blue-600 rounded-full mt-2 flex-shrink-0"></div>
              <p>Consider breaking down tasks that are frequently missed into smaller, more manageable steps.</p>
            </div>
            <div className="flex items-start space-x-2">
              <div className="w-2 h-2 bg-blue-600 rounded-full mt-2 flex-shrink-0"></div>
              <p>Schedule your most important tasks during your highest energy periods.</p>
            </div>
          </div>
        </div>
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="max-w-6xl mx-auto p-6">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading review history...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">Evening Review History</h1>
        
        {/* Period and View Selection */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
          <div className="flex space-x-2">
            {[7, 30, 90].map((days) => (
              <button
                key={days}
                onClick={() => setSelectedPeriod(days)}
                className={`px-4 py-2 rounded-md text-sm font-medium ${
                  selectedPeriod === days
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                {days} days
              </button>
            ))}
          </div>
          
          <div className="flex space-x-2">
            {[
              { key: 'overview', label: 'Overview' },
              { key: 'trends', label: 'Trends' },
              { key: 'obstacles', label: 'Obstacles' }
            ].map((view) => (
              <button
                key={view.key}
                onClick={() => setSelectedView(view.key as typeof selectedView)}
                className={`px-4 py-2 rounded-md text-sm font-medium ${
                  selectedView === view.key
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                {view.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md">
          <p className="text-red-800">{error}</p>
        </div>
      )}

      {selectedView === 'overview' && renderOverview()}
      {selectedView === 'trends' && renderTrends()}
      {selectedView === 'obstacles' && renderObstacles()}
    </div>
  );
};

export default EveningReviewHistory;