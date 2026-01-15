import React, { useState, useEffect } from 'react';
import { deepWorkService } from '../services/deepWorkService';
import { DeepWorkScheduler } from './DeepWorkScheduler';
import { DeepWorkSession } from './DeepWorkSession';
import { AttentionTraining } from './AttentionTraining';
import {
  DeepWorkSession as DeepWorkSessionType,
  DeepWorkAnalyticsResponse,
  EnergyPatternsResponse
} from '../types/deepWork';

export const DeepWorkDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'schedule' | 'session' | 'training' | 'analytics'>('schedule');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentSession, setCurrentSession] = useState<DeepWorkSessionType | null>(null);
  const [upcomingSessions, setUpcomingSessions] = useState<DeepWorkSessionType[]>([]);
  const [analytics, setAnalytics] = useState<DeepWorkAnalyticsResponse | null>(null);
  const [energyPatterns, setEnergyPatterns] = useState<EnergyPatternsResponse | null>(null);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Load current and upcoming sessions
      const sessionsResponse = await deepWorkService.getUserDeepWorkSessions({
        status: 'scheduled,active',
        limit: 10
      });

      const activeSessions = sessionsResponse.sessions.filter(s => s.status === 'active');
      const scheduledSessions = sessionsResponse.sessions.filter(s => s.status === 'scheduled');

      setCurrentSession(activeSessions[0] || null);
      setUpcomingSessions(scheduledSessions);

      // Load analytics
      const analyticsResponse = await deepWorkService.getDeepWorkAnalytics({
        start_date: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        end_date: new Date().toISOString().split('T')[0]
      });
      setAnalytics(analyticsResponse);

      // Load energy patterns
      const patternsResponse = await deepWorkService.analyzeEnergyPatterns();
      setEnergyPatterns(patternsResponse);

    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to load dashboard data');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSessionScheduled = (session: DeepWorkSessionType) => {
    setUpcomingSessions(prev => [session, ...prev].sort((a, b) => 
      new Date(a.planned_start_time).getTime() - new Date(b.planned_start_time).getTime()
    ));
    setActiveTab('session');
  };

  const handleSessionUpdate = (session: DeepWorkSessionType | null) => {
    if (session?.status === 'active') {
      setCurrentSession(session);
    } else if (session?.status === 'completed' || session?.status === 'cancelled') {
      setCurrentSession(null);
      setUpcomingSessions(prev => prev.filter(s => s.id !== session.id));
    } else if (session?.status === 'scheduled') {
      setUpcomingSessions(prev => prev.map(s => s.id === session.id ? session : s));
    }
  };

  const renderOverview = () => (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
      <div className="border border-white/5 rounded-lg p-4">
        <h3 className="font-medium text-white mb-2">Today's Deep Work</h3>
        <div className="text-2xl font-bold text-white">
          {analytics?.total_deep_work_hours.toFixed(1) || '0.0'}h
        </div>
        <p className="text-sm text-slate-400">
          {currentSession ? 'Session in progress' : upcomingSessions.length > 0 ? `${upcomingSessions.length} scheduled` : 'No sessions scheduled'}
        </p>
      </div>

      <div className="border border-white/5 rounded-lg p-4">
        <h3 className="font-medium text-white mb-2">Average Quality</h3>
        <div className="text-2xl font-bold text-white">
          {analytics?.average_session_quality.toFixed(1) || 'N/A'}/10
        </div>
        <p className="text-sm text-slate-400">
          {analytics?.attention_metrics ? 
            `Attention span: ${analytics.attention_metrics.current_attention_span.toFixed(1)}m` : 
            'Complete sessions to see quality'
          }
        </p>
      </div>

      <div className="border border-white/5 rounded-lg p-4">
        <h3 className="font-medium text-white mb-2">Optimal Times</h3>
        <div className="text-lg font-bold text-white">
          {analytics?.optimal_time_slots.slice(0, 2).join(', ') || 'Analyzing...'}
        </div>
        <p className="text-sm text-slate-400">
          {energyPatterns?.insights[0] || 'Track activities to see patterns'}
        </p>
      </div>
    </div>
  );

  const renderCurrentSession = () => {
    if (!currentSession) {
      const nextSession = upcomingSessions[0];
      if (!nextSession) {
        return (
          <div className="border border-white/5 rounded-lg p-6 text-center">
            <h3 className="font-medium text-white mb-2">No Active Sessions</h3>
            <p className="text-slate-400 mb-4">Schedule a deep work session to get started.</p>
            <button
              onClick={() => setActiveTab('schedule')}
              className="bg-white text-slate-950 px-4 py-2 rounded-lg hover:bg-slate-100 transition-colors font-medium"
            >
              Schedule Session
            </button>
          </div>
        );
      }

      return (
        <DeepWorkSession 
          session={nextSession} 
          onSessionUpdate={handleSessionUpdate}
        />
      );
    }

    return (
      <DeepWorkSession 
        session={currentSession} 
        onSessionUpdate={handleSessionUpdate}
      />
    );
  };

  const renderUpcomingSessions = () => {
    if (upcomingSessions.length === 0) {
      return (
        <div className="border border-white/5 rounded-lg p-4 text-center">
          <p className="text-slate-400">No upcoming sessions scheduled.</p>
        </div>
      );
    }

    return (
      <div className="space-y-3">
        {upcomingSessions.slice(0, 3).map((session) => (
          <div key={session.id} className="border border-white/5 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium text-white">{session.activity}</h4>
                <p className="text-sm text-slate-400">
                  {deepWorkService.formatTime(session.planned_start_time)} • {deepWorkService.formatDuration(session.planned_duration)}
                </p>
              </div>
              <div className="text-right">
                <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium border border-white/10 text-slate-400">
                  {session.priority}
                </span>
                <p className="text-xs text-slate-500 mt-1">
                  {session.cognitive_load} load
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  };

  const renderAnalytics = () => {
    if (!analytics) {
      return (
        <div className="border border-white/5 rounded-lg p-6 text-center">
          <h3 className="font-medium text-white mb-2">No Analytics Available</h3>
          <p className="text-slate-400">Complete some deep work sessions to see your analytics.</p>
        </div>
      );
    }

    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="border border-white/5 rounded-lg p-4">
            <h3 className="font-medium text-white mb-4">Productivity Trends</h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-slate-400">Weekly Average:</span>
                <span className="font-medium text-white">{analytics.productivity_trends.weekly_average.toFixed(1)}h</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Monthly Trend:</span>
                <span className="font-medium text-white">
                  {analytics.productivity_trends.monthly_trend}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Best Days:</span>
                <span className="font-medium text-white">{analytics.productivity_trends.best_performing_days.join(', ')}</span>
              </div>
            </div>
          </div>

          <div className="border border-white/5 rounded-lg p-4">
            <h3 className="font-medium text-white mb-4">Energy Insights</h3>
            <div className="space-y-2 text-sm">
              {analytics.energy_pattern_insights.map((insight, index) => (
                <p key={index} className="text-slate-400">• {insight}</p>
              ))}
            </div>
          </div>
        </div>

        {analytics.attention_metrics && (
          <div className="border border-white/5 rounded-lg p-4">
            <h3 className="font-medium text-white mb-4">Attention Metrics</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-xl font-bold text-white">
                  {analytics.attention_metrics.current_attention_span.toFixed(1)}m
                </div>
                <div className="text-sm text-slate-400">Current Span</div>
              </div>
              <div className="text-center">
                <div className="text-xl font-bold text-white">
                  {analytics.attention_metrics.improvement_percentage >= 0 ? '+' : ''}{analytics.attention_metrics.improvement_percentage.toFixed(1)}%
                </div>
                <div className="text-sm text-slate-400">Improvement</div>
              </div>
              <div className="text-center">
                <div className="text-xl font-bold text-white">
                  {analytics.attention_metrics.training_sessions_completed}
                </div>
                <div className="text-sm text-slate-400">Sessions</div>
              </div>
              <div className="text-center">
                <div className="text-xl font-bold text-white">
                  {analytics.attention_metrics.consistency_score.toFixed(0)}
                </div>
                <div className="text-sm text-slate-400">Consistency</div>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  const tabs = [
    { id: 'schedule', label: 'Schedule', icon: '📅' },
    { id: 'session', label: 'Session', icon: '🎯' },
    { id: 'training', label: 'Training', icon: '🧠' },
    { id: 'analytics', label: 'Analytics', icon: '📊' }
  ];

  if (isLoading) {
    return (
      <div className="border border-white/5 rounded-lg p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-white/5 rounded w-1/4"></div>
          <div className="grid grid-cols-3 gap-4">
            <div className="h-24 bg-white/5 rounded"></div>
            <div className="h-24 bg-white/5 rounded"></div>
            <div className="h-24 bg-white/5 rounded"></div>
          </div>
          <div className="h-64 bg-white/5 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="border border-white/5 rounded-lg">
        <div className="p-6">
          <h1 className="text-2xl font-bold text-white mb-6">Deep Work & Attention Management</h1>
          
          {error && (
            <div className="mb-4 p-3 border border-white/10 rounded-lg">
              <p className="text-sm text-slate-400">{error}</p>
            </div>
          )}

          {renderOverview()}

          {/* Tab Navigation */}
          <div className="border-b border-white/5 mb-6">
            <nav className="-mb-px flex space-x-8">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                    activeTab === tab.id
                      ? 'border-white text-white'
                      : 'border-transparent text-slate-400 hover:text-white'
                  }`}
                >
                  <span className="mr-2">{tab.icon}</span>
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>

          {/* Tab Content */}
          <div className="space-y-6">
            {activeTab === 'schedule' && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2">
                  <DeepWorkScheduler onSessionScheduled={handleSessionScheduled} />
                </div>
                <div>
                  <h3 className="font-medium text-white mb-4">Upcoming Sessions</h3>
                  {renderUpcomingSessions()}
                </div>
              </div>
            )}

            {activeTab === 'session' && renderCurrentSession()}

            {activeTab === 'training' && <AttentionTraining />}

            {activeTab === 'analytics' && renderAnalytics()}
          </div>
        </div>
      </div>
    </div>
  );
};