import React from 'react';
import { RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';
import { type BehavioralInsight, type EnergyPattern } from '../services/analyticsService';

interface BehavioralPatternVisualizationProps {
  behavioralInsights: BehavioralInsight[];
  energyPatterns: EnergyPattern[];
  className?: string;
}

export const BehavioralPatternVisualization: React.FC<BehavioralPatternVisualizationProps> = ({
  behavioralInsights,
  energyPatterns,
  className = ''
}) => {
  // Prepare radar chart data for behavioral insights
  const radarData = behavioralInsights.map(insight => ({
    category: insight.category,
    confidence: insight.confidence * 100,
    data_points: Math.min(insight.data_points / 10, 10) * 10 // Normalize to 0-100 scale
  }));

  // Prepare energy pattern data for bar chart
  const energyData = energyPatterns.map(pattern => ({
    time_period: pattern.time_period,
    energy: pattern.average_energy * 10, // Scale to 0-100
    productivity: pattern.productivity_correlation * 100,
    trend: pattern.trend
  }));

  const getTrendIcon = (trend: 'improving' | 'declining' | 'stable') => {
    switch (trend) {
      case 'improving':
        return (
          <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 17l9.2-9.2M17 17V7H7" />
          </svg>
        );
      case 'declining':
        return (
          <svg className="w-4 h-4 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 7l-9.2 9.2M7 7v10h10" />
          </svg>
        );
      default:
        return (
          <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
          </svg>
        );
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'productivity':
        return (
          <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
        );
      case 'habits':
        return (
          <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
        );
      case 'focus':
        return (
          <svg className="w-5 h-5 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
          </svg>
        );
      case 'energy':
        return (
          <svg className="w-5 h-5 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
          </svg>
        );
      default:
        return (
          <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
    }
  };

  return (
    <div className={`border border-white/5 rounded-lg ${className}`}>
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-medium text-white">Behavioral Patterns</h3>
            <p className="text-sm text-slate-400">Insights into your productivity patterns and energy cycles</p>
          </div>
        </div>

        <div className="space-y-6">
        {/* Behavioral Insights Radar Chart */}
        {radarData.length > 0 && (
          <div>
            <h3 className="text-lg font-medium text-white mb-4">Insight Confidence</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart data={radarData}>
                  <PolarGrid stroke="#e5e7eb" />
                  <PolarAngleAxis 
                    dataKey="category" 
                    tick={{ fontSize: 12, fill: '#6b7280' }}
                    className="capitalize"
                  />
                  <PolarRadiusAxis 
                    angle={90} 
                    domain={[0, 100]} 
                    tick={{ fontSize: 10, fill: '#9ca3af' }}
                  />
                  <Radar
                    name="Confidence"
                    dataKey="confidence"
                    stroke="#3b82f6"
                    fill="#3b82f6"
                    fillOpacity={0.2}
                    strokeWidth={2}
                  />
                  <Radar
                    name="Data Points"
                    dataKey="data_points"
                    stroke="#10b981"
                    fill="#10b981"
                    fillOpacity={0.1}
                    strokeWidth={2}
                  />
                  <Tooltip 
                    formatter={(value: number, name: string) => [
                      `${value.toFixed(1)}${name === 'confidence' ? '%' : ''}`,
                      name === 'confidence' ? 'Confidence' : 'Data Strength'
                    ]}
                    contentStyle={{
                      backgroundColor: 'white',
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px',
                      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                    }}
                  />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* Energy Patterns Bar Chart */}
        {energyData.length > 0 && (
          <div>
            <h3 className="text-lg font-medium text-white mb-4">Energy & Productivity Patterns</h3>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={energyData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis 
                    dataKey="time_period" 
                    tick={{ fontSize: 12, fill: '#6b7280' }}
                    className="capitalize"
                  />
                  <YAxis 
                    tick={{ fontSize: 12, fill: '#6b7280' }}
                    domain={[0, 100]}
                  />
                  <Tooltip 
                    formatter={(value: number, name: string) => [
                      `${value.toFixed(1)}${name === 'productivity' ? '%' : '/100'}`,
                      name === 'energy' ? 'Energy Level' : 'Productivity Correlation'
                    ]}
                    contentStyle={{
                      backgroundColor: 'white',
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px',
                      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                    }}
                  />
                  <Bar dataKey="energy" fill="#fbbf24" name="energy" />
                  <Bar dataKey="productivity" fill="#8b5cf6" name="productivity" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* Behavioral Insights List */}
        {behavioralInsights.length > 0 && (
          <div>
            <h3 className="text-lg font-medium text-white mb-4" data-testid="pattern-analysis-title">Pattern Analysis</h3>
            <div className="space-y-3">
              {behavioralInsights.slice(0, 4).map((insight, index) => (
                <div key={index} className="flex items-start p-4 border border-white/5 rounded-lg" data-testid={`pattern-insight-${index}`}>
                  <div className="flex-shrink-0 mr-3">
                    {getCategoryIcon(insight.category)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium text-white capitalize">
                        {insight.category}
                      </p>
                      <div className="flex items-center">
                        {getTrendIcon(insight.trend)}
                        <span className={`ml-1 text-xs font-medium ${
                          insight.trend === 'improving' ? 'text-green-400' :
                          insight.trend === 'declining' ? 'text-red-400' : 'text-slate-400'
                        }`}>
                          {insight.trend}
                        </span>
                      </div>
                    </div>
                    <p className="text-sm text-slate-300 mt-1">{insight.insight}</p>
                    <p className="text-xs text-slate-400 mt-1">{insight.recommendation}</p>
                    <div className="flex items-center mt-2">
                      <div className="flex-1 bg-white/5 rounded-full h-1.5">
                        <div 
                          className="bg-blue-500 h-1.5 rounded-full transition-all duration-300"
                          style={{ width: `${insight.confidence * 100}%` }}
                        />
                      </div>
                      <span className="ml-2 text-xs text-slate-500">
                        {(insight.confidence * 100).toFixed(0)}% confidence
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Energy Pattern Summary */}
        {energyPatterns.length > 0 && (
          <div className="border border-white/5 rounded-lg p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h4 className="text-sm font-medium text-white">Energy Optimization Tip</h4>
                <p className="text-sm text-slate-400 mt-1">
                  {(() => {
                    const bestPeriod = energyPatterns.reduce((best, current) => 
                      current.productivity_correlation > best.productivity_correlation ? current : best
                    );
                    return `Your most productive energy period is ${bestPeriod.time_period}. Schedule your most important work during these hours.`;
                  })()}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Empty State */}
        {behavioralInsights.length === 0 && energyPatterns.length === 0 && (
          <div className="text-center py-8">
            <svg className="mx-auto h-12 w-12 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-white">No behavioral patterns yet</h3>
            <p className="mt-1 text-sm text-slate-400">
              Use the system more to generate behavioral insights and energy patterns.
            </p>
          </div>
        )}
        </div>
      </div>
    </div>
  );
};