import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { type AnalyticsData } from '../services/analyticsService';

interface ProgressVisualizationProps {
  analyticsData: AnalyticsData;
  period: 'daily' | 'weekly' | 'monthly';
  className?: string;
}

export const ProgressVisualization: React.FC<ProgressVisualizationProps> = ({
  analyticsData,
  period,
  className = ''
}) => {
  // Prepare chart data
  const chartData = analyticsData.productivity_pattern.daily_completion_rates.map((rate, index) => ({
    day: index + 1,
    completion_rate: rate,
    focus_quality: analyticsData.productivity_pattern.focus_quality_trend[index] || 0,
    deep_work_hours: analyticsData.deep_work_trend[index] || 0
  }));

  const formatXAxisLabel = (tickItem: number) => {
    if (period === 'daily') return `Hour ${tickItem}`;
    if (period === 'weekly') return `Day ${tickItem}`;
    return `Week ${tickItem}`;
  };

  const formatTooltipLabel = (label: number) => {
    if (period === 'daily') return `Hour ${label}`;
    if (period === 'weekly') return `Day ${label}`;
    return `Week ${label}`;
  };

  return (
    <div className={`border border-white/5 rounded-lg p-6 ${className}`}>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-medium text-white">Progress Overview</h3>
          <p className="text-sm text-slate-400">
            Track your completion rates, focus quality, and deep work hours over time
          </p>
        </div>
        
        {/* Legend */}
        <div className="flex items-center space-x-4 text-sm">
          <div className="flex items-center">
            <div className="w-3 h-3 bg-blue-500 rounded-full mr-2"></div>
            <span className="text-slate-400">Completion Rate</span>
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
            <span className="text-slate-400">Focus Quality</span>
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 bg-purple-500 rounded-full mr-2"></div>
            <span className="text-slate-400">Deep Work Hours</span>
          </div>
        </div>
      </div>

      {/* Main Chart */}
      <div className="h-80 mb-6">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis 
              dataKey="day" 
              tickFormatter={formatXAxisLabel}
              stroke="#6b7280"
              fontSize={12}
            />
            <YAxis 
              stroke="#6b7280"
              fontSize={12}
              domain={[0, 100]}
            />
            <YAxis 
              yAxisId="right"
              orientation="right"
              stroke="#6b7280"
              fontSize={12}
              domain={[0, 'dataMax']}
            />
            <Tooltip 
              labelFormatter={formatTooltipLabel}
              formatter={(value: number, name: string) => {
                if (name === 'deep_work_hours') {
                  return [`${value.toFixed(1)}h`, 'Deep Work Hours'];
                }
                return [`${value.toFixed(1)}%`, name === 'completion_rate' ? 'Completion Rate' : 'Focus Quality'];
              }}
              contentStyle={{
                backgroundColor: 'white',
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
              }}
            />
            <Line 
              type="monotone" 
              dataKey="completion_rate" 
              stroke="#3b82f6" 
              strokeWidth={2}
              dot={{ fill: '#3b82f6', strokeWidth: 2, r: 4 }}
              activeDot={{ r: 6, stroke: '#3b82f6', strokeWidth: 2 }}
            />
            <Line 
              type="monotone" 
              dataKey="focus_quality" 
              stroke="#10b981" 
              strokeWidth={2}
              dot={{ fill: '#10b981', strokeWidth: 2, r: 4 }}
              activeDot={{ r: 6, stroke: '#10b981', strokeWidth: 2 }}
            />
            <Line 
              type="monotone" 
              dataKey="deep_work_hours" 
              stroke="#8b5cf6" 
              strokeWidth={2}
              dot={{ fill: '#8b5cf6', strokeWidth: 2, r: 4 }}
              activeDot={{ r: 6, stroke: '#8b5cf6', strokeWidth: 2 }}
              yAxisId="right"
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="border border-white/5 rounded-lg p-4">
          <div className="flex items-center">
            <div className="w-8 h-8 bg-blue-500/10 rounded-lg flex items-center justify-center mr-3">
              <svg className="w-4 h-4 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-medium text-slate-400">Avg Completion</p>
              <p className="text-lg font-bold text-white">
                {(analyticsData.productivity_pattern.daily_completion_rates.reduce((sum, rate) => sum + rate, 0) / 
                  Math.max(analyticsData.productivity_pattern.daily_completion_rates.length, 1)).toFixed(1)}%
              </p>
            </div>
          </div>
        </div>

        <div className="border border-white/5 rounded-lg p-4">
          <div className="flex items-center">
            <div className="w-8 h-8 bg-green-500/10 rounded-lg flex items-center justify-center mr-3">
              <svg className="w-4 h-4 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-medium text-slate-400">Avg Focus</p>
              <p className="text-lg font-bold text-white">
                {(analyticsData.productivity_pattern.focus_quality_trend.reduce((sum, quality) => sum + quality, 0) / 
                  Math.max(analyticsData.productivity_pattern.focus_quality_trend.length, 1)).toFixed(1)}%
              </p>
            </div>
          </div>
        </div>

        <div className="border border-white/5 rounded-lg p-4">
          <div className="flex items-center">
            <div className="w-8 h-8 bg-purple-500/10 rounded-lg flex items-center justify-center mr-3">
              <svg className="w-4 h-4 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-medium text-slate-400">Avg Deep Work</p>
              <p className="text-lg font-bold text-white">
                {(analyticsData.deep_work_trend.reduce((sum, hours) => sum + hours, 0) / 
                  Math.max(analyticsData.deep_work_trend.length, 1)).toFixed(1)}h
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Trend Indicators */}
      <div className="mt-4 flex items-center justify-center space-x-6 text-sm">
        {(() => {
          const recentCompletion = analyticsData.productivity_pattern.daily_completion_rates.slice(-3);
          const olderCompletion = analyticsData.productivity_pattern.daily_completion_rates.slice(-6, -3);
          const recentAvg = recentCompletion.reduce((sum, rate) => sum + rate, 0) / Math.max(recentCompletion.length, 1);
          const olderAvg = olderCompletion.reduce((sum, rate) => sum + rate, 0) / Math.max(olderCompletion.length, 1);
          const trend = recentAvg > olderAvg + 5 ? 'improving' : recentAvg < olderAvg - 5 ? 'declining' : 'stable';
          
          return (
            <div className="flex items-center">
              <span className="text-slate-400 mr-2">Completion Trend:</span>
              <div className={`flex items-center ${
                trend === 'improving' ? 'text-green-400' :
                trend === 'declining' ? 'text-red-400' : 'text-slate-400'
              }`}>
                {trend === 'improving' && (
                  <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 17l9.2-9.2M17 17V7H7" />
                  </svg>
                )}
                {trend === 'declining' && (
                  <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 7l-9.2 9.2M7 7v10h10" />
                  </svg>
                )}
                {trend === 'stable' && (
                  <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                  </svg>
                )}
                <span className="capitalize font-medium">{trend}</span>
              </div>
            </div>
          );
        })()}
      </div>
    </div>
  );
};