import React, { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from 'recharts';
import { TrendingUp, Brain, Zap, Eye, Calendar, Filter } from 'lucide-react';

interface IdentifiedPattern {
  pattern_type: 'productivity' | 'energy' | 'focus' | 'behavioral' | 'environmental';
  pattern_description: string;
  frequency: number;
  impact_level: 'high' | 'medium' | 'low';
  correlation_strength: number;
  actionable_insights: string[];
}

interface LongTermPatternVisualizationProps {
  className?: string;
}

export const LongTermPatternVisualization: React.FC<LongTermPatternVisualizationProps> = ({ className = '' }) => {
  const [patterns, setPatterns] = useState<IdentifiedPattern[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedTimeframe, setSelectedTimeframe] = useState<number>(6);
  const [selectedPatternType, setSelectedPatternType] = useState<string>('all');

  useEffect(() => {
    loadPatterns();
  }, [selectedTimeframe]);

  const loadPatterns = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch(`/api/review-cycles/patterns?months=${selectedTimeframe}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to load long-term patterns');
      }

      const data = await response.json();
      setPatterns(data.data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load patterns');
    } finally {
      setLoading(false);
    }
  };

  const filteredPatterns = selectedPatternType === 'all' 
    ? patterns 
    : patterns.filter(p => p.pattern_type === selectedPatternType);

  const patternTypeData = patterns.reduce((acc, pattern) => {
    const existing = acc.find(item => item.type === pattern.pattern_type);
    if (existing) {
      existing.count += 1;
      existing.avgImpact = (existing.avgImpact + (pattern.impact_level === 'high' ? 3 : pattern.impact_level === 'medium' ? 2 : 1)) / 2;
    } else {
      acc.push({
        type: pattern.pattern_type,
        count: 1,
        avgImpact: pattern.impact_level === 'high' ? 3 : pattern.impact_level === 'medium' ? 2 : 1
      });
    }
    return acc;
  }, [] as Array<{ type: string; count: number; avgImpact: number }>);

  const correlationData = patterns.map((pattern, index) => ({
    name: `Pattern ${index + 1}`,
    correlation: Math.round(pattern.correlation_strength * 100),
    frequency: pattern.frequency,
    type: pattern.pattern_type,
    impact: pattern.impact_level === 'high' ? 3 : pattern.impact_level === 'medium' ? 2 : 1
  }));

  const impactDistribution = patterns.reduce((acc, pattern) => {
    acc[pattern.impact_level] = (acc[pattern.impact_level] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const pieData = Object.entries(impactDistribution).map(([level, count]) => ({
    name: level.charAt(0).toUpperCase() + level.slice(1),
    value: count,
    color: level === 'high' ? '#dc2626' : level === 'medium' ? '#d97706' : '#16a34a'
  }));

  const getPatternIcon = (type: string) => {
    switch (type) {
      case 'productivity':
        return <TrendingUp className="w-5 h-5 text-blue-600" />;
      case 'energy':
        return <Zap className="w-5 h-5 text-yellow-600" />;
      case 'focus':
        return <Eye className="w-5 h-5 text-purple-600" />;
      case 'behavioral':
        return <Brain className="w-5 h-5 text-green-600" />;
      case 'environmental':
        return <Calendar className="w-5 h-5 text-orange-600" />;
      default:
        return <TrendingUp className="w-5 h-5 text-gray-600" />;
    }
  };

  const getImpactColor = (impact: string): string => {
    switch (impact) {
      case 'high':
        return 'text-red-600 bg-red-50 border-red-200';
      case 'medium':
        return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'low':
        return 'text-green-600 bg-green-50 border-green-200';
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  if (loading) {
    return (
      <div className={`flex items-center justify-center p-8 ${className}`}>
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header and Controls */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <Brain className="w-6 h-6 text-purple-600" />
            <h2 className="text-xl font-semibold text-gray-900">Long-term Pattern Analysis</h2>
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <Calendar className="w-4 h-4 text-gray-500" />
              <select
                value={selectedTimeframe}
                onChange={(e) => setSelectedTimeframe(Number(e.target.value))}
                className="border border-gray-300 rounded-lg px-3 py-1 text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              >
                <option value={3}>3 months</option>
                <option value={6}>6 months</option>
                <option value={12}>12 months</option>
                <option value={24}>24 months</option>
              </select>
            </div>
            
            <div className="flex items-center space-x-2">
              <Filter className="w-4 h-4 text-gray-500" />
              <select
                value={selectedPatternType}
                onChange={(e) => setSelectedPatternType(e.target.value)}
                className="border border-gray-300 rounded-lg px-3 py-1 text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              >
                <option value="all">All Types</option>
                <option value="productivity">Productivity</option>
                <option value="energy">Energy</option>
                <option value="focus">Focus</option>
                <option value="behavioral">Behavioral</option>
                <option value="environmental">Environmental</option>
              </select>
            </div>
          </div>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-700">{error}</p>
          </div>
        )}

        {patterns.length === 0 && !loading && (
          <div className="text-center py-8">
            <Brain className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">No long-term patterns identified yet.</p>
            <p className="text-sm text-gray-500 mt-2">
              Patterns will appear as you accumulate more data over time.
            </p>
          </div>
        )}
      </div>

      {patterns.length > 0 && (
        <>
          {/* Pattern Overview Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Pattern Type Distribution */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Pattern Type Distribution</h3>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={patternTypeData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="type" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="count" fill="#8b5cf6" />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Impact Level Distribution */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Impact Level Distribution</h3>
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Correlation Strength Analysis */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Pattern Correlation Strength</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={correlationData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis domain={[0, 100]} />
                <Tooltip 
                  formatter={(value, name) => [`${value}%`, 'Correlation Strength']}
                  labelFormatter={(label) => `Pattern: ${label}`}
                />
                <Line 
                  type="monotone" 
                  dataKey="correlation" 
                  stroke="#8b5cf6" 
                  strokeWidth={2}
                  dot={{ fill: '#8b5cf6', strokeWidth: 2, r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Detailed Pattern List */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Identified Patterns</h3>
            <div className="space-y-4">
              {filteredPatterns.map((pattern, index) => (
                <div key={index} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center space-x-3">
                      {getPatternIcon(pattern.pattern_type)}
                      <div>
                        <h4 className="font-medium text-gray-900 capitalize">
                          {pattern.pattern_type} Pattern
                        </h4>
                        <p className="text-sm text-gray-600">{pattern.pattern_description}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className={`px-2 py-1 text-xs font-medium rounded border ${getImpactColor(pattern.impact_level)}`}>
                        {pattern.impact_level} impact
                      </span>
                      <span className="text-sm text-gray-500">
                        {Math.round(pattern.correlation_strength * 100)}% correlation
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <h5 className="text-sm font-medium text-gray-700 mb-2">Pattern Details</h5>
                      <div className="space-y-1 text-sm text-gray-600">
                        <div className="flex justify-between">
                          <span>Frequency:</span>
                          <span className="font-medium">{pattern.frequency} occurrences</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Correlation:</span>
                          <span className="font-medium">{Math.round(pattern.correlation_strength * 100)}%</span>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h5 className="text-sm font-medium text-gray-700 mb-2">Actionable Insights</h5>
                      <ul className="space-y-1">
                        {pattern.actionable_insights.map((insight, insightIndex) => (
                          <li key={insightIndex} className="text-sm text-gray-600 flex items-start space-x-2">
                            <div className="w-1.5 h-1.5 bg-purple-600 rounded-full mt-2 flex-shrink-0"></div>
                            <span>{insight}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Pattern Summary Stats */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Pattern Analysis Summary</h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">{patterns.length}</div>
                <p className="text-sm text-gray-600">Total Patterns</p>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-red-600">
                  {patterns.filter(p => p.impact_level === 'high').length}
                </div>
                <p className="text-sm text-gray-600">High Impact</p>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {Math.round(patterns.reduce((sum, p) => sum + p.correlation_strength, 0) / patterns.length * 100)}%
                </div>
                <p className="text-sm text-gray-600">Avg Correlation</p>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {patterns.reduce((sum, p) => sum + p.actionable_insights.length, 0)}
                </div>
                <p className="text-sm text-gray-600">Total Insights</p>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};