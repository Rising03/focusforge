import React, { useState, useEffect } from 'react';
import { identityService } from '../services/identityService';
import { IdentityAlignmentResponse, TaskAcknowledgmentRequest } from '../types/identity';

interface IdentityTrackerProps {
  className?: string;
}

export const IdentityTracker: React.FC<IdentityTrackerProps> = ({ className = '' }) => {
  const [alignmentData, setAlignmentData] = useState<IdentityAlignmentResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [acknowledgeTask, setAcknowledgeTask] = useState('');
  const [acknowledgmentMessage, setAcknowledgmentMessage] = useState<string | null>(null);
  const [submittingAcknowledgment, setSubmittingAcknowledgment] = useState(false);

  useEffect(() => {
    loadIdentityAlignment();
  }, []);

  const loadIdentityAlignment = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await identityService.calculateIdentityAlignment({ days: 7 });
      setAlignmentData(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load identity alignment');
    } finally {
      setLoading(false);
    }
  };

  const handleTaskAcknowledgment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!acknowledgeTask.trim()) return;

    try {
      setSubmittingAcknowledgment(true);
      const request: TaskAcknowledgmentRequest = {
        task: acknowledgeTask.trim()
      };
      
      const response = await identityService.acknowledgeTask(request);
      setAcknowledgmentMessage(response.acknowledgment.acknowledgment_message);
      setAcknowledgeTask('');
      
      // Refresh alignment data
      await loadIdentityAlignment();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to acknowledge task');
    } finally {
      setSubmittingAcknowledgment(false);
    }
  };

  const getAlignmentColor = (score: number) => {
    if (score >= 0.8) return 'text-green-600';
    if (score >= 0.6) return 'text-yellow-600';
    if (score >= 0.4) return 'text-orange-600';
    return 'text-red-600';
  };

  const getAlignmentBgColor = (score: number) => {
    if (score >= 0.8) return 'bg-green-100';
    if (score >= 0.6) return 'bg-yellow-100';
    if (score >= 0.4) return 'bg-orange-100';
    return 'bg-red-100';
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'improving':
        return <span className="text-green-600">↗️</span>;
      case 'declining':
        return <span className="text-red-600">↘️</span>;
      default:
        return <span className="text-gray-600">→</span>;
    }
  };

  if (loading) {
    return (
      <div className={`bg-white rounded-lg shadow-sm border p-6 ${className}`}>
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded mb-4"></div>
          <div className="h-4 bg-gray-200 rounded mb-2"></div>
          <div className="h-4 bg-gray-200 rounded mb-2"></div>
          <div className="h-4 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`bg-white rounded-lg shadow-sm border p-6 ${className}`}>
        <div className="text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={loadIdentityAlignment}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!alignmentData) {
    return (
      <div className={`bg-white rounded-lg shadow-sm border p-6 ${className}`}>
        <p className="text-gray-600 text-center">No identity alignment data available</p>
      </div>
    );
  }

  const { alignment, insights, recommendations, trend } = alignmentData;

  return (
    <div className={`bg-white rounded-lg shadow-sm border ${className}`}>
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-900">Identity Alignment</h2>
          <button
            onClick={loadIdentityAlignment}
            className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
          >
            Refresh
          </button>
        </div>

        {/* Alignment Score */}
        <div className={`rounded-lg p-4 mb-6 ${getAlignmentBgColor(alignment.alignment_score)}`}>
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-medium text-gray-900">
                {alignment.target_identity}
              </h3>
              <p className="text-sm text-gray-600">Target Identity</p>
            </div>
            <div className="text-right">
              <div className={`text-2xl font-bold ${getAlignmentColor(alignment.alignment_score)}`}>
                {Math.round(alignment.alignment_score * 100)}%
              </div>
              <div className="flex items-center text-sm text-gray-600">
                {getTrendIcon(trend)}
                <span className="ml-1 capitalize">{trend}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Contributing Activities */}
        {alignment.contributing_activities && alignment.contributing_activities.length > 0 && (
          <div className="mb-6">
            <h4 className="text-sm font-medium text-gray-900 mb-3">Top Identity-Aligned Activities</h4>
            <div className="space-y-2">
              {alignment.contributing_activities
                .filter(activity => activity.identity_relevance === 'high')
                .slice(0, 3)
                .map((activity, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-md">
                    <div>
                      <p className="text-sm font-medium text-gray-900">{activity.activity}</p>
                      <p className="text-xs text-gray-600">
                        {activity.frequency} sessions • {Math.round(activity.recent_performance * 100)}% performance
                      </p>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-medium text-green-600">
                        {Math.round(activity.alignment_weight * 100)}%
                      </div>
                      <div className="text-xs text-gray-500">alignment</div>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        )}

        {/* Task Acknowledgment */}
        <div className="mb-6">
          <h4 className="text-sm font-medium text-gray-900 mb-3">Acknowledge Completed Task</h4>
          <form onSubmit={handleTaskAcknowledgment} className="space-y-3">
            <input
              type="text"
              value={acknowledgeTask}
              onChange={(e) => setAcknowledgeTask(e.target.value)}
              placeholder="What did you just complete?"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <button
              type="submit"
              disabled={!acknowledgeTask.trim() || submittingAcknowledgment}
              className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
            >
              {submittingAcknowledgment ? 'Acknowledging...' : 'Acknowledge Task'}
            </button>
          </form>
          
          {acknowledgmentMessage && (
            <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-md">
              <p className="text-sm text-green-800">{acknowledgmentMessage}</p>
            </div>
          )}
        </div>

        {/* Insights */}
        {insights && insights.length > 0 && (
          <div className="mb-6">
            <h4 className="text-sm font-medium text-gray-900 mb-3">Insights</h4>
            <div className="space-y-2">
              {insights.map((insight, index) => (
                <div key={index} className="p-3 bg-blue-50 border border-blue-200 rounded-md">
                  <p className="text-sm text-blue-800">{insight}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Recommendations */}
        {recommendations && recommendations.length > 0 && (
          <div>
            <h4 className="text-sm font-medium text-gray-900 mb-3">Recommendations</h4>
            <div className="space-y-2">
              {recommendations.map((recommendation, index) => (
                <div key={index} className="p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                  <p className="text-sm text-yellow-800">{recommendation}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};