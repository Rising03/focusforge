import React, { useState, useEffect } from 'react';
import { activityService } from '../services/activityService';
import { ActivitySession, ActivityHistoryResponse } from '../types/activity';

interface ActivityHistoryProps {
  limit?: number;
  showFilters?: boolean;
  onSessionSelect?: (session: ActivitySession) => void;
}

export const ActivityHistory: React.FC<ActivityHistoryProps> = ({ 
  limit = 10, 
  showFilters = true,
  onSessionSelect 
}) => {
  const [data, setData] = useState<ActivityHistoryResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [filters, setFilters] = useState({
    start_date: '',
    end_date: '',
    activity_filter: '',
    limit: limit,
    offset: 0
  });

  const [showAllFilters, setShowAllFilters] = useState(false);

  useEffect(() => {
    loadData();
  }, [filters]);

  const loadData = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await activityService.getActivityHistory({
        ...filters,
        start_date: filters.start_date || undefined,
        end_date: filters.end_date || undefined,
        activity_filter: filters.activity_filter || undefined
      });
      
      setData(response);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to load activity history');
    } finally {
      setIsLoading(false);
    }
  };

  const handleFilterChange = (key: string, value: string | number) => {
    setFilters(prev => ({
      ...prev,
      [key]: value,
      offset: key !== 'offset' ? 0 : value // Reset offset when other filters change
    }));
  };

  const handleLoadMore = () => {
    if (data) {
      setFilters(prev => ({
        ...prev,
        offset: prev.offset + prev.limit
      }));
    }
  };

  const formatDateTime = (date: Date): string => {
    return new Date(date).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });
  };

  const formatDuration = (minutes: number): string => {
    return activityService.formatDuration(minutes);
  };

  const getFocusQualityColor = (quality: 'high' | 'medium' | 'low'): string => {
    return activityService.getFocusQualityColor(quality);
  };

  const getFocusQualityBgColor = (quality: 'high' | 'medium' | 'low'): string => {
    return activityService.getFocusQualityBgColor(quality);
  };

  if (isLoading && !data) {
    return (
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-16 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border">
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-900">Activity History</h2>
          {showFilters && (
            <button
              onClick={() => setShowAllFilters(!showAllFilters)}
              className="text-sm text-blue-600 hover:text-blue-800 focus:outline-none"
            >
              {showAllFilters ? 'Hide Filters' : 'Show Filters'}
            </button>
          )}
        </div>

        {/* Filters */}
        {showFilters && showAllFilters && (
          <div className="mb-6 p-4 bg-gray-50 rounded-lg">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label htmlFor="start_date" className="block text-sm font-medium text-gray-700 mb-1">
                  Start Date
                </label>
                <input
                  type="date"
                  id="start_date"
                  value={filters.start_date}
                  onChange={(e) => handleFilterChange('start_date', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label htmlFor="end_date" className="block text-sm font-medium text-gray-700 mb-1">
                  End Date
                </label>
                <input
                  type="date"
                  id="end_date"
                  value={filters.end_date}
                  onChange={(e) => handleFilterChange('end_date', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label htmlFor="activity_filter" className="block text-sm font-medium text-gray-700 mb-1">
                  Activity Filter
                </label>
                <input
                  type="text"
                  id="activity_filter"
                  value={filters.activity_filter}
                  onChange={(e) => handleFilterChange('activity_filter', e.target.value)}
                  placeholder="Search activities..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>
        )}

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        {data && (
          <>
            {/* Summary */}
            {data.summary && (
              <div className="mb-6 grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <p className="text-2xl font-semibold text-gray-900">
                    {formatDuration(data.summary.total_time)}
                  </p>
                  <p className="text-sm text-gray-600">Total Time</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-semibold text-gray-900">
                    {formatDuration(data.summary.average_session_length)}
                  </p>
                  <p className="text-sm text-gray-600">Avg Session</p>
                </div>
                <div className="text-center">
                  <p className="text-lg font-semibold text-gray-900 truncate">
                    {data.summary.most_common_activity}
                  </p>
                  <p className="text-sm text-gray-600">Most Common</p>
                </div>
                <div className="text-center">
                  <p className="text-lg font-semibold text-gray-900">
                    {data.summary.best_focus_day !== 'None' 
                      ? new Date(data.summary.best_focus_day).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
                      : 'None'
                    }
                  </p>
                  <p className="text-sm text-gray-600">Best Focus Day</p>
                </div>
              </div>
            )}

            {/* Sessions List */}
            {data.sessions.length === 0 ? (
              <div className="text-center py-8">
                <div className="text-gray-400 mb-4">
                  <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Activities Found</h3>
                <p className="text-gray-600">No activities match your current filters.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {data.sessions.map((session) => (
                  <div
                    key={session.id}
                    className={`border rounded-lg p-4 hover:bg-gray-50 transition-colors ${
                      onSessionSelect ? 'cursor-pointer' : ''
                    }`}
                    onClick={() => onSessionSelect && onSessionSelect(session)}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-medium text-gray-900 truncate flex-1 mr-4">
                        {session.activity}
                      </h3>
                      <div className="flex items-center space-x-2">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getFocusQualityBgColor(session.focus_quality)} ${getFocusQualityColor(session.focus_quality)}`}>
                          {session.focus_quality}
                        </span>
                        <span className="text-sm font-medium text-gray-900">
                          {formatDuration(session.duration || 0)}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-sm text-gray-600">
                      <div className="flex items-center space-x-4">
                        <span>
                          {formatDateTime(session.start_time)} - {formatDateTime(session.end_time!)}
                        </span>
                        {session.distractions > 0 && (
                          <span className="flex items-center">
                            <svg className="w-4 h-4 mr-1 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 15.5c-.77.833.192 2.5 1.732 2.5z" />
                            </svg>
                            {session.distractions} distraction{session.distractions !== 1 ? 's' : ''}
                          </span>
                        )}
                      </div>
                    </div>

                    {session.notes && (
                      <div className="mt-2 text-sm text-gray-700 bg-gray-50 p-2 rounded">
                        {session.notes}
                      </div>
                    )}
                  </div>
                ))}

                {/* Load More Button */}
                {data.total_count > data.sessions.length && (
                  <div className="text-center pt-4">
                    <button
                      onClick={handleLoadMore}
                      disabled={isLoading}
                      className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      {isLoading ? 'Loading...' : `Load More (${data.total_count - data.sessions.length} remaining)`}
                    </button>
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};