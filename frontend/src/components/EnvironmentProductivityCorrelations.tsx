import React, { useState, useEffect } from 'react';
import { identityService } from '../services/identityService';
import { EnvironmentCorrelationResponse } from '../types/identity';

interface EnvironmentProductivityCorrelationsProps {
  className?: string;
}

export const EnvironmentProductivityCorrelations: React.FC<EnvironmentProductivityCorrelationsProps> = ({ 
  className = '' 
}) => {
  const [correlations, setCorrelations] = useState<EnvironmentCorrelationResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadCorrelations();
  }, []);

  const loadCorrelations = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await identityService.getEnvironmentCorrelations();
      setCorrelations(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load environment correlations');
    } finally {
      setLoading(false);
    }
  };

  const getImpactColor = (impact: number) => {
    if (impact >= 0.7) return 'text-green-600 bg-green-50 border-green-200';
    if (impact >= 0.5) return 'text-yellow-600 bg-yellow-50 border-yellow-200';
    if (impact >= 0.3) return 'text-orange-600 bg-orange-50 border-orange-200';
    return 'text-red-600 bg-red-50 border-red-200';
  };

  const getConfidenceIcon = (confidence: number) => {
    if (confidence >= 0.8) return '🔴'; // High confidence
    if (confidence >= 0.5) return '🟡'; // Medium confidence
    return '⚪'; // Low confidence
  };

  const getImpactIcon = (impact: number) => {
    if (impact >= 0.7) return '📈'; // Highly beneficial
    if (impact >= 0.5) return '➡️'; // Neutral/slight positive
    if (impact >= 0.3) return '📉'; // Slight negative
    return '❌'; // Detrimental
  };

  if (loading) {
    return (
      <div className={`bg-white rounded-lg shadow-sm border p-6 ${className}`}>
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded mb-4"></div>
          <div className="space-y-3">
            <div className="h-16 bg-gray-200 rounded"></div>
            <div className="h-16 bg-gray-200 rounded"></div>
            <div className="h-16 bg-gray-200 rounded"></div>
          </div>
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
            onClick={loadCorrelations}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!correlations || correlations.correlations.length === 0) {
    return (
      <div className={`bg-white rounded-lg shadow-sm border p-6 ${className}`}>
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Environment Insights</h2>
        <div className="text-center py-8">
          <div className="text-4xl mb-4">📊</div>
          <p className="text-gray-600 mb-2">No environment data yet</p>
          <p className="text-sm text-gray-500">
            Use the Environment Designer to track how different factors affect your productivity
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-lg shadow-sm border ${className}`}>
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-900">Environment Insights</h2>
          <button
            onClick={loadCorrelations}
            className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
          >
            Refresh
          </button>
        </div>

        {/* Key Insights */}
        {correlations.insights && correlations.insights.length > 0 && (
          <div className="mb-6">
            <h3 className="text-sm font-medium text-gray-900 mb-3">Key Insights</h3>
            <div className="space-y-2">
              {correlations.insights.map((insight, index) => (
                <div key={index} className="p-3 bg-blue-50 border border-blue-200 rounded-md">
                  <p className="text-sm text-blue-800">{insight}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Correlations Grid */}
        <div className="mb-6">
          <h3 className="text-sm font-medium text-gray-900 mb-3">
            Environment-Productivity Correlations
          </h3>
          <div className="grid gap-3">
            {correlations.correlations
              .sort((a, b) => b.productivity_impact - a.productivity_impact)
              .map((correlation, index) => (
                <div
                  key={correlation.id}
                  className={`p-4 rounded-lg border ${getImpactColor(correlation.productivity_impact)}`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      <span className="text-lg">
                        {getImpactIcon(correlation.productivity_impact)}
                      </span>
                      <div>
                        <h4 className="text-sm font-medium text-gray-900">
                          {correlation.environment_factor}
                        </h4>
                        <p className="text-xs text-gray-600">
                          {correlation.factor_value}
                        </p>
                      </div>
                    </div>
                    
                    <div className="text-right">
                      <div className="text-lg font-bold">
                        {Math.round(correlation.productivity_impact * 100)}%
                      </div>
                      <div className="text-xs text-gray-600">
                        productivity impact
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-xs text-gray-600">
                    <div className="flex items-center space-x-3">
                      <span className="flex items-center">
                        {getConfidenceIcon(correlation.confidence_level)}
                        <span className="ml-1">
                          {Math.round(correlation.confidence_level * 100)}% confidence
                        </span>
                      </span>
                      <span>
                        {correlation.sample_size} data points
                      </span>
                    </div>
                    
                    <span className="text-gray-500">
                      Updated {new Date(correlation.last_updated).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              ))}
          </div>
        </div>

        {/* Optimization Recommendations */}
        {correlations.optimization_recommendations && correlations.optimization_recommendations.length > 0 && (
          <div className="mb-6">
            <h3 className="text-sm font-medium text-gray-900 mb-3">Optimization Recommendations</h3>
            <div className="space-y-2">
              {correlations.optimization_recommendations.map((recommendation, index) => (
                <div key={index} className="p-3 bg-green-50 border border-green-200 rounded-md">
                  <p className="text-sm text-green-800">{recommendation}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Legend */}
        <div className="pt-4 border-t border-gray-200">
          <h4 className="text-xs font-medium text-gray-700 mb-2">Legend</h4>
          <div className="grid grid-cols-2 gap-4 text-xs">
            <div>
              <p className="font-medium text-gray-700 mb-1">Impact Level:</p>
              <div className="space-y-1">
                <div className="flex items-center space-x-2">
                  <span>📈</span>
                  <span className="text-green-600">Highly beneficial (70%+)</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span>➡️</span>
                  <span className="text-yellow-600">Neutral/slight positive (50-70%)</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span>📉</span>
                  <span className="text-orange-600">Slight negative (30-50%)</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span>❌</span>
                  <span className="text-red-600">Detrimental (&lt;30%)</span>
                </div>
              </div>
            </div>
            
            <div>
              <p className="font-medium text-gray-700 mb-1">Confidence Level:</p>
              <div className="space-y-1">
                <div className="flex items-center space-x-2">
                  <span>🔴</span>
                  <span>High confidence (80%+)</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span>🟡</span>
                  <span>Medium confidence (50-80%)</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span>⚪</span>
                  <span>Low confidence (&lt;50%)</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};