import React, { useState, useEffect } from 'react';
import { activityService } from '../services/activityService';
import { TimeUtilizationResponse } from '../types/activity';

interface TimeUtilizationChartProps {
  date?: string; // YYYY-MM-DD format, defaults to today
  onDataLoad?: (data: TimeUtilizationResponse) => void;
}

export const TimeUtilizationChart: React.FC<TimeUtilizationChartProps> = ({ 
  date, 
  onDataLoad 
}) => {
  const [data, setData] = useState<TimeUtilizationResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, [date]);

  const loadData = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = date 
        ? await activityService.getTimeUtilization(date)
        : await activityService.getTodayUtilization();
      
      setData(response);
      
      if (onDataLoad) {
        onDataLoad(response);
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to load time utilization data');
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (dateStr: string | Date): string => {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  const calculatePercentage = (value: number, total: number): number => {
    if (total === 0) return 0;
    return Math.round((value / total) * 100);
  };

  if (isLoading) {
    return (
      <div className="border border-white/5 rounded-lg p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-white/5 rounded w-1/3 mb-4"></div>
          <div className="h-32 bg-white/5 rounded mb-4"></div>
          <div className="space-y-2">
            <div className="h-4 bg-white/5 rounded"></div>
            <div className="h-4 bg-white/5 rounded w-3/4"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="border border-white/5 rounded-lg p-6">
        <div className="text-center">
          <div className="text-red-400 mb-2">
            <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-white mb-2">Unable to Load Data</h3>
          <p className="text-slate-400 mb-4">{error}</p>
          <button
            onClick={loadData}
            className="bg-white text-slate-950 px-4 py-2 rounded-lg hover:bg-slate-100 focus:outline-none transition-colors font-medium"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (!data) {
    return null;
  }

  const { utilization, insights, recommendations } = data;
  const totalTrackedTime = utilization.focused_time + utilization.distracted_time;
  const totalDayTime = totalTrackedTime + utilization.unused_time;

  return (
    <div className="border border-white/5 rounded-lg">
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-white">Time Utilization</h2>
          <p className="text-sm text-slate-400">
            {formatDate(utilization.date)}
          </p>
        </div>

        {totalTrackedTime === 0 ? (
          <div className="text-center py-8">
            <div className="text-slate-600 mb-4">
              <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-white mb-2">No Activity Tracked</h3>
            <p className="text-slate-400">Start tracking your activities to see your time utilization.</p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Time breakdown chart */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-medium text-white">Time Breakdown</h3>
                <span className="text-sm text-slate-400">
                  {activityService.formatDuration(totalTrackedTime)} tracked
                </span>
              </div>
              
              <div className="w-full bg-white/5 rounded-full h-6 mb-4">
                <div className="flex h-full rounded-full overflow-hidden">
                  <div 
                    className="bg-green-500 flex items-center justify-center text-xs text-white font-medium"
                    style={{ width: `${calculatePercentage(utilization.focused_time, totalDayTime)}%` }}
                  >
                    {calculatePercentage(utilization.focused_time, totalTrackedTime)}%
                  </div>
                  <div 
                    className="bg-yellow-500 flex items-center justify-center text-xs text-white font-medium"
                    style={{ width: `${calculatePercentage(utilization.distracted_time, totalDayTime)}%` }}
                  >
                    {calculatePercentage(utilization.distracted_time, totalTrackedTime)}%
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4 text-sm">
                <div className="text-center">
                  <div className="flex items-center justify-center mb-1">
                    <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
                    <span className="font-medium text-white">Focused</span>
                  </div>
                  <p className="text-slate-400">{activityService.formatDuration(utilization.focused_time)}</p>
                </div>
                <div className="text-center">
                  <div className="flex items-center justify-center mb-1">
                    <div className="w-3 h-3 bg-yellow-500 rounded-full mr-2"></div>
                    <span className="font-medium text-white">Distracted</span>
                  </div>
                  <p className="text-slate-400">{activityService.formatDuration(utilization.distracted_time)}</p>
                </div>
                <div className="text-center">
                  <div className="flex items-center justify-center mb-1">
                    <div className="w-3 h-3 bg-slate-600 rounded-full mr-2"></div>
                    <span className="font-medium text-white">Untracked</span>
                  </div>
                  <p className="text-slate-400">{activityService.formatDuration(utilization.unused_time)}</p>
                </div>
              </div>
            </div>

            {/* Deep work highlight */}
            {utilization.deep_work_hours > 0 && (
              <div className="border border-white/5 rounded-lg p-4">
                <div className="flex items-center">
                  <div className="text-blue-400 mr-3">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                    </svg>
                  </div>
                  <div>
                    <h4 className="font-medium text-white">Deep Work</h4>
                    <p className="text-sm text-slate-400">
                      {utilization.deep_work_hours.toFixed(1)} hours of high-focus sessions
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Activity categories */}
            {utilization.categories.length > 0 && (
              <div>
                <h3 className="font-medium text-white mb-3">Activity Categories</h3>
                <div className="space-y-2">
                  {utilization.categories
                    .sort((a, b) => b.time - a.time)
                    .map((category, index) => (
                      <div key={index} className="flex items-center justify-between">
                        <span className="text-sm text-slate-300">{category.category}</span>
                        <div className="flex items-center">
                          <span className="text-sm text-slate-400 mr-2">
                            {activityService.formatDuration(category.time)}
                          </span>
                          <span className="text-xs text-slate-500">
                            ({category.percentage.toFixed(0)}%)
                          </span>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            )}

            {/* Insights */}
            {insights.length > 0 && (
              <div>
                <h3 className="font-medium text-white mb-3">Insights</h3>
                <div className="space-y-2">
                  {insights.map((insight, index) => (
                    <div key={index} className="flex items-start">
                      <div className="text-blue-400 mr-2 mt-0.5">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      <p className="text-sm text-slate-300">{insight}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Recommendations */}
            {recommendations.length > 0 && (
              <div>
                <h3 className="font-medium text-white mb-3">Recommendations</h3>
                <div className="space-y-2">
                  {recommendations.map((recommendation, index) => (
                    <div key={index} className="flex items-start">
                      <div className="text-green-400 mr-2 mt-0.5">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      <p className="text-sm text-slate-300">{recommendation}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};