import React, { useState, useEffect } from 'react';
import { analyticsService, type DashboardSummary, type AnalyticsData } from '../services/analyticsService';
import { ProgressVisualization } from './ProgressVisualization';
import { HabitStreakDisplay } from './HabitStreakDisplay';
import { TimeUtilizationChart } from './TimeUtilizationChart';
import { BehavioralPatternVisualization } from './BehavioralPatternVisualization';
import { PersonalizationMetrics } from './PersonalizationMetrics';
import { useBehavioralTracking } from '../hooks/useBehavioralTracking';

interface DisciplineDashboardProps {
  className?: string;
}

export const DisciplineDashboard: React.FC<DisciplineDashboardProps> = ({ className = '' }) => {
  const [dashboardData, setDashboardData] = useState<DashboardSummary | null>(null);
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
  const [selectedPeriod, setSelectedPeriod] = useState<'daily' | 'weekly' | 'monthly'>('weekly');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Track behavioral analytics
  useBehavioralTracking('discipline_dashboard', {
    autoTrackEngagement: true,
    trackClicks: true,
    trackScroll: true
  });

  useEffect(() => {
    loadDashboardData();
  }, [selectedPeriod]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [summary, analytics] = await Promise.all([
        analyticsService.getDashboardSummary(),
        analyticsService.getDashboardAnalytics(selectedPeriod)
      ]);

      setDashboardData(summary);
      setAnalyticsData(analytics);
    } catch (err) {
      console.error('Error loading dashboard data:', err);
      
      // Provide more specific error messages
      let errorMessage = 'Failed to load dashboard data';
      
      if (err instanceof Error) {
        if (err.message.includes('401') || err.message.includes('Unauthorized')) {
          errorMessage = 'Please log in to view your analytics';
        } else if (err.message.includes('404') || err.message.includes('Not Found')) {
          errorMessage = 'No analytics data found. Start by creating habits and routines to generate insights.';
        } else if (err.message.includes('500') || err.message.includes('Internal Server Error')) {
          errorMessage = 'Server error occurred. Please try again later.';
        } else if (err.message.includes('Failed to fetch') || err.message.includes('Network')) {
          errorMessage = 'Network error. Please check your connection and try again.';
        } else {
          errorMessage = err.message;
        }
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handlePeriodChange = (period: 'daily' | 'weekly' | 'monthly') => {
    setSelectedPeriod(period);
  };

  if (loading) {
    return (
      <div className={`discipline-dashboard ${className}`}>
        <div className="flex items-center justify-center min-h-96">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`discipline-dashboard error-state ${className}`}>
        <div className="border border-white/10 rounded-lg p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-slate-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-white">Error Loading Dashboard</h3>
              <p className="mt-1 text-sm text-slate-400">{error}</p>
            </div>
          </div>
          <div className="mt-4">
            <button
              onClick={loadDashboardData}
              className="bg-white text-slate-950 px-4 py-2 rounded-lg text-sm font-medium hover:bg-slate-100 transition-colors"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!dashboardData || !analyticsData) {
    return (
      <div className={`discipline-dashboard ${className}`}>
        <div className="text-center py-12">
          <div className="max-w-md mx-auto">
            <div className="w-16 h-16 mx-auto mb-4 bg-white/5 rounded-full flex items-center justify-center">
              <svg className="w-8 h-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-white mb-2">No Analytics Data Yet</h3>
            <p className="text-slate-400 mb-6">
              Start building your discipline journey to see insights and progress analytics.
            </p>
            <div className="space-y-2 text-sm text-slate-500">
              <p>• Create and track daily habits</p>
              <p>• Generate and complete routines</p>
              <p>• Complete evening reviews</p>
              <p>• Track deep work sessions</p>
            </div>
            <button
              onClick={loadDashboardData}
              className="mt-6 bg-white text-slate-950 px-4 py-2 rounded-lg text-sm font-medium hover:bg-slate-100 transition-colors"
            >
              Refresh Analytics
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`discipline-dashboard space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white" data-testid="dashboard-title">Discipline Dashboard</h1>
          <p className="mt-1 text-sm text-slate-400">
            Track your progress and maintain consistency in your academic journey
          </p>
        </div>
        
        {/* Period Selector */}
        <div className="mt-4 sm:mt-0">
          <div className="flex rounded-lg border border-white/10 p-1">
            {(['daily', 'weekly', 'monthly'] as const).map((period) => (
              <button
                key={period}
                onClick={() => handlePeriodChange(period)}
                className={`px-3 py-1 text-sm font-medium rounded-lg transition-colors ${
                  selectedPeriod === period
                    ? 'bg-white text-slate-950'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {period.charAt(0).toUpperCase() + period.slice(1)}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Key Metrics Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="border border-white/5 rounded-lg p-4">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-white/5 rounded-lg flex items-center justify-center">
                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-slate-400" data-testid="consistency-label">Consistency</p>
              <p className="text-2xl font-bold text-white" data-testid="consistency-value">{dashboardData.overview.consistency_score}%</p>
            </div>
          </div>
        </div>

        <div className="border border-white/5 rounded-lg p-4">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-white/5 rounded-lg flex items-center justify-center">
                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-slate-400" data-testid="identity-alignment-label">Identity Alignment</p>
              <p className="text-2xl font-bold text-white" data-testid="identity-alignment-value">{dashboardData.overview.identity_alignment}%</p>
            </div>
          </div>
        </div>

        <div className="border border-white/5 rounded-lg p-4">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-white/5 rounded-lg flex items-center justify-center">
                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-slate-400">Strong Habits</p>
              <p className="text-2xl font-bold text-white">{dashboardData.overview.strong_habits}/{dashboardData.overview.total_habits}</p>
            </div>
          </div>
        </div>

        <div className="border border-white/5 rounded-lg p-4">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-white/5 rounded-lg flex items-center justify-center">
                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-slate-400">Deep Work</p>
              <p className="text-2xl font-bold text-white">{dashboardData.overview.avg_deep_work_hours.toFixed(1)}h</p>
            </div>
          </div>
        </div>

        <div className="border border-white/5 rounded-lg p-4">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-white/5 rounded-lg flex items-center justify-center">
                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-slate-400">Period</p>
              <p className="text-lg font-bold text-white capitalize">{selectedPeriod}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Alerts */}
      {dashboardData.alerts.length > 0 && (
        <div className="alerts-section border border-white/10 rounded-lg p-4" data-testid="alerts-section">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-slate-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-white" data-testid="alerts-title">Attention Needed</h3>
              <div className="mt-2 text-sm text-slate-400">
                <ul className="list-disc pl-5 space-y-1">
                  {dashboardData.alerts.map((alert, index) => (
                    <li key={`alert-${index}`} data-testid={`alert-${index}`}>{alert.description}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Progress Visualization */}
        <div className="lg:col-span-2">
          <ProgressVisualization 
            analyticsData={analyticsData}
            period={selectedPeriod}
          />
        </div>

        {/* Habit Streaks */}
        <HabitStreakDisplay 
          habitStreaks={analyticsData.habit_streaks}
        />

        {/* Time Utilization */}
        <TimeUtilizationChart 
          deepWorkTrend={analyticsData.deep_work_trend}
          focusQualityTrend={analyticsData.productivity_pattern.focus_quality_trend}
          period={selectedPeriod}
        />

        {/* Behavioral Patterns */}
        <BehavioralPatternVisualization 
          behavioralInsights={analyticsData.behavioral_insights}
          energyPatterns={analyticsData.productivity_pattern.energy_patterns}
        />

        {/* Personalization Metrics */}
        <PersonalizationMetrics 
          personalizationMetrics={analyticsData.personalization_metrics}
        />
      </div>

      {/* Key Insights */}
      {dashboardData.key_insights.length > 0 && (
        <div className="key-insights-section border border-white/10 rounded-lg p-6" data-testid="key-insights-section">
          <h3 className="text-lg font-medium text-white mb-4" data-testid="key-insights-title">Key Insights</h3>
          <div className="space-y-3">
            {dashboardData.key_insights.map((insight, index) => (
              <div key={`insight-${index}`} className="flex items-start" data-testid={`insight-${index}`}>
                <div className="flex-shrink-0">
                  <div className={`w-2 h-2 rounded-full mt-2 ${
                    insight.trend === 'improving' ? 'bg-white' :
                    insight.trend === 'declining' ? 'bg-slate-500' : 'bg-slate-600'
                  }`} />
                </div>
                <div className="ml-3">
                  <p className="text-sm text-white" data-testid={`insight-text-${index}`}>{insight.insight}</p>
                  <p className="text-xs text-slate-400 mt-1" data-testid={`insight-recommendation-${index}`}>{insight.recommendation}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Improvement Opportunities */}
      {dashboardData.opportunities.length > 0 && (
        <div className="opportunities-section border border-white/10 rounded-lg p-6" data-testid="opportunities-section">
          <h3 className="text-lg font-medium text-white mb-4" data-testid="opportunities-title">Improvement Opportunities</h3>
          <div className="space-y-4">
            {dashboardData.opportunities.map((opportunity, index) => (
              <div key={`opportunity-${index}`} className="border-l-2 border-white/20 pl-4" data-testid={`opportunity-${index}`}>
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-medium text-white" data-testid={`opportunity-area-${index}`}>{opportunity.area}</h4>
                  <span className="px-2 py-1 text-xs rounded border border-white/10 text-slate-400">
                    {opportunity.difficulty}
                  </span>
                </div>
                <p className="text-sm text-slate-400 mt-1">{opportunity.description}</p>
                <div className="mt-2">
                  <p className="text-xs text-slate-500 font-medium">Action Steps:</p>
                  <ul className="text-xs text-slate-400 mt-1 list-disc list-inside">
                    {opportunity.action_steps.slice(0, 2).map((step, stepIndex) => (
                      <li key={`step-${index}-${stepIndex}`}>{step}</li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recommendations */}
      {dashboardData.recommendations.length > 0 && (
        <div className="recommendations-section border border-white/10 rounded-lg p-6" data-testid="recommendations-section">
          <h3 className="text-lg font-medium text-white mb-4" data-testid="recommendations-title">System Recommendations</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {dashboardData.recommendations.map((recommendation, index) => (
              <div key={`recommendation-${index}`} className="border border-white/5 rounded-lg p-4" data-testid={`recommendation-${index}`}>
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-sm font-medium text-white" data-testid={`recommendation-category-${index}`}>{recommendation.category}</h4>
                  <span className="px-2 py-1 text-xs rounded border border-white/10 text-slate-400">
                    {recommendation.implementation_effort} effort
                  </span>
                </div>
                <p className="text-sm text-slate-400 mb-2">{recommendation.suggestion}</p>
                <p className="text-xs text-slate-500">{recommendation.expected_benefit}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};