import React from 'react';
import { type PersonalizationMetrics as PersonalizationMetricsType } from '../services/analyticsService';

interface PersonalizationMetricsProps {
  personalizationMetrics: PersonalizationMetricsType;
  className?: string;
}

// Simple circular progress component
const CircularProgress: React.FC<{ value: number; size?: number; strokeWidth?: number }> = ({ 
  value, 
  size = 64, 
  strokeWidth = 4 
}) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const strokeDasharray = `${circumference} ${circumference}`;
  const strokeDashoffset = circumference - (value / 100) * circumference;

  const getColor = (val: number) => {
    if (val >= 80) return '#10b981'; // green
    if (val >= 60) return '#3b82f6'; // blue
    if (val >= 40) return '#f59e0b'; // yellow
    return '#ef4444'; // red
  };

  return (
    <div className="relative inline-flex items-center justify-center">
      <svg
        className="transform -rotate-90"
        width={size}
        height={size}
      >
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="#f3f4f6"
          strokeWidth={strokeWidth}
          fill="transparent"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={getColor(value)}
          strokeWidth={strokeWidth}
          fill="transparent"
          strokeDasharray={strokeDasharray}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          className="transition-all duration-300 ease-in-out"
        />
      </svg>
      <span className="absolute text-sm font-medium text-gray-900">
        {value}%
      </span>
    </div>
  );
};

interface PersonalizationMetricsProps {
  personalizationMetrics: PersonalizationMetricsType;
  className?: string;
}

export const PersonalizationMetrics: React.FC<PersonalizationMetricsProps> = ({
  personalizationMetrics,
  className = ''
}) => {
  const getMasteryIcon = (level: 'beginner' | 'intermediate' | 'advanced') => {
    switch (level) {
      case 'beginner':
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
          </svg>
        );
      case 'intermediate':
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
          </svg>
        );
      case 'advanced':
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
          </svg>
        );
    }
  };

  return (
    <div className={`border border-white/5 rounded-lg ${className}`}>
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-medium text-white">Personalization Metrics</h3>
            <p className="text-sm text-slate-400">How well the system adapts to your preferences</p>
          </div>
        
          {/* System Mastery Level */}
          <div className="px-3 py-1 rounded-full border border-white/10 text-sm font-medium text-slate-400">
            <div className="flex items-center">
              {getMasteryIcon(personalizationMetrics.learning_progression.system_mastery_level)}
              <span className="ml-1 capitalize">
                {personalizationMetrics.learning_progression.system_mastery_level}
              </span>
            </div>
          </div>
        </div>

        {/* Main Metrics Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {/* Profile Completeness */}
          <div className="border border-white/5 rounded-lg p-4 text-center">
            <div className="mb-2">
              <CircularProgress value={personalizationMetrics.profile_completeness} />
            </div>
            <p className="text-sm font-medium text-white">Profile</p>
            <p className="text-xs text-slate-400">Completeness</p>
          </div>

          {/* Adaptation Effectiveness */}
          <div className="border border-white/5 rounded-lg p-4 text-center">
            <div className="mb-2">
              <CircularProgress value={personalizationMetrics.adaptation_effectiveness} />
            </div>
            <p className="text-sm font-medium text-white">Adaptation</p>
            <p className="text-xs text-slate-400">Effectiveness</p>
          </div>

          {/* Suggestion Acceptance */}
          <div className="border border-white/5 rounded-lg p-4 text-center">
            <div className="mb-2">
              <CircularProgress value={personalizationMetrics.suggestion_acceptance_rate} />
            </div>
            <p className="text-sm font-medium text-white">Suggestions</p>
            <p className="text-xs text-slate-400">Accepted</p>
          </div>

          {/* Habit Formation Rate */}
          <div className="border border-white/5 rounded-lg p-4 text-center">
            <div className="mb-2">
              <CircularProgress value={personalizationMetrics.learning_progression.habit_formation_rate} />
            </div>
            <p className="text-sm font-medium text-white">Habit</p>
            <p className="text-xs text-slate-400">Formation</p>
          </div>
        </div>

        {/* Learning Progression */}
        <div className="mb-6">
          <h3 className="text-lg font-medium text-white mb-4">Learning Progression</h3>
          <div className="border border-white/5 rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm text-slate-400">Weeks Active</span>
              <span className="text-sm font-medium text-white">
                {personalizationMetrics.learning_progression.weeks_active}
              </span>
            </div>
            
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm text-slate-400">Routine Modifications</span>
              <span className="text-sm font-medium text-white">
                {personalizationMetrics.routine_modification_frequency.toFixed(1)}/week
              </span>
            </div>

            {/* System Mastery Progress */}
            <div className="mt-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-slate-400">System Mastery</span>
                <span className="text-sm font-medium text-white capitalize">
                  {personalizationMetrics.learning_progression.system_mastery_level}
                </span>
              </div>
              <div className="w-full bg-white/5 rounded-full h-2">
                <div 
                  className={`h-2 rounded-full transition-all duration-300 ${
                    personalizationMetrics.learning_progression.system_mastery_level === 'advanced' ? 'bg-green-500' :
                    personalizationMetrics.learning_progression.system_mastery_level === 'intermediate' ? 'bg-blue-500' :
                    'bg-yellow-500'
                  }`}
                  style={{ 
                    width: `${
                      personalizationMetrics.learning_progression.system_mastery_level === 'advanced' ? 100 :
                      personalizationMetrics.learning_progression.system_mastery_level === 'intermediate' ? 66 : 33
                    }%` 
                  }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Skill Improvements */}
        {personalizationMetrics.learning_progression.skill_improvements.length > 0 && (
          <div className="mb-6">
            <h3 className="text-lg font-medium text-white mb-4">Skill Improvements</h3>
            <div className="space-y-3">
              {personalizationMetrics.learning_progression.skill_improvements.map((skill, index) => (
                <div key={index} className="flex items-center justify-between p-4 border border-white/5 rounded-lg">
                  <div>
                    <p className="text-sm font-medium text-white">{skill.skill_area}</p>
                    <p className="text-xs text-slate-400">{skill.time_period}</p>
                  </div>
                  <div className="text-right">
                    <div className={`text-lg font-bold ${
                      skill.improvement_percentage > 0 ? 'text-green-400' :
                      skill.improvement_percentage < 0 ? 'text-red-400' : 'text-slate-400'
                    }`}>
                      {skill.improvement_percentage > 0 ? '+' : ''}{skill.improvement_percentage}%
                    </div>
                    <div className="flex items-center justify-end">
                      {skill.improvement_percentage > 0 ? (
                        <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 17l9.2-9.2M17 17V7H7" />
                        </svg>
                      ) : skill.improvement_percentage < 0 ? (
                        <svg className="w-4 h-4 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 7l-9.2 9.2M7 7v10h10" />
                        </svg>
                      ) : (
                        <svg className="w-4 h-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                        </svg>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Personalization Tips */}
        <div className="border border-white/5 rounded-lg p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h4 className="text-sm font-medium text-white">Personalization Tips</h4>
              <div className="text-sm text-slate-400 mt-1">
                {personalizationMetrics.profile_completeness < 80 && (
                  <p className="mb-2">• Complete your profile to improve system recommendations</p>
                )}
                {personalizationMetrics.suggestion_acceptance_rate < 50 && (
                  <p className="mb-2">• Try accepting more system suggestions to improve adaptation</p>
                )}
                {personalizationMetrics.routine_modification_frequency > 3 && (
                  <p className="mb-2">• High modification frequency suggests evolving preferences - consider updating your profile</p>
                )}
                {personalizationMetrics.learning_progression.system_mastery_level === 'beginner' && (
                  <p>• Keep using the system regularly to unlock advanced personalization features</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};