import React, { useState } from 'react';
import { ActivityTracker } from './ActivityTracker';
import { ManualActivityLog } from './ManualActivityLog';
import { TimeUtilizationChart } from './TimeUtilizationChart';
import { ActivityHistory } from './ActivityHistory';
import { ActivitySessionResponse } from '../types/activity';

export const ActivityDashboard: React.FC = () => {
  const [activeSession, setActiveSession] = useState<ActivitySessionResponse | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const handleSessionUpdate = (session: ActivitySessionResponse | null) => {
    setActiveSession(session);
  };

  const handleActivityLogged = () => {
    // Refresh all components by updating the key
    setRefreshKey(prev => prev + 1);
  };

  const handleRefresh = () => {
    setRefreshKey(prev => prev + 1);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Activity Tracking</h1>
              <p className="mt-2 text-gray-600">
                Track your time, monitor your focus, and optimize your productivity.
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <ManualActivityLog onActivityLogged={handleActivityLogged} />
              <button
                onClick={handleRefresh}
                className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Refresh
              </button>
            </div>
          </div>
        </div>

        {/* Active Session Alert */}
        {activeSession && (
          <div className="mb-6 bg-blue-50 border-l-4 border-blue-400 p-4 rounded-r-lg">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-blue-700">
                  <span className="font-medium">Active Session:</span> {activeSession.session.activity}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Activity Tracker */}
          <div className="lg:col-span-1">
            <div className="sticky top-8">
              <ActivityTracker 
                key={`tracker-${refreshKey}`}
                onSessionUpdate={handleSessionUpdate} 
              />
            </div>
          </div>

          {/* Right Column - Charts and History */}
          <div className="lg:col-span-2 space-y-8">
            {/* Time Utilization Chart */}
            <TimeUtilizationChart 
              key={`chart-${refreshKey}`}
            />

            {/* Activity History */}
            <ActivityHistory 
              key={`history-${refreshKey}`}
              limit={10}
              showFilters={true}
            />
          </div>
        </div>

        {/* Quick Stats Footer */}
        <div className="mt-12 bg-white rounded-lg shadow-sm border p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Tips</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                  <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
              <div className="ml-3">
                <h4 className="text-sm font-medium text-gray-900">Track Consistently</h4>
                <p className="text-sm text-gray-600">
                  Track your activities throughout the day to get accurate insights into your productivity patterns.
                </p>
              </div>
            </div>

            <div className="flex items-start">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                  <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
              <div className="ml-3">
                <h4 className="text-sm font-medium text-gray-900">Focus Quality Matters</h4>
                <p className="text-sm text-gray-600">
                  Be honest about your focus quality - this helps identify patterns and improve your work environment.
                </p>
              </div>
            </div>

            <div className="flex items-start">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                  <svg className="w-4 h-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                  </svg>
                </div>
              </div>
              <div className="ml-3">
                <h4 className="text-sm font-medium text-gray-900">Aim for Deep Work</h4>
                <p className="text-sm text-gray-600">
                  Try to achieve at least 2 hours of deep work daily by scheduling longer, uninterrupted focus blocks.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};