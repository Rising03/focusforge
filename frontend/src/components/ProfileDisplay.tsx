import React, { useState, useEffect } from 'react';
import { UserProfile } from '../types/profile';
import { profileService } from '../services/profileService';
import { useBehavioralTracking } from '../hooks/useBehavioralTracking';

interface ProfileDisplayProps {
  onEdit: () => void;
  onShowRefinement?: () => void;
  onShowDetailedQuestionnaire?: () => void;
  showDetailedQuestionnairePrompt?: boolean;
}

const ProfileDisplay: React.FC<ProfileDisplayProps> = ({ 
  onEdit, 
  onShowRefinement,
  onShowDetailedQuestionnaire
}) => {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [completionPercentage, setCompletionPercentage] = useState(0);
  const [missingFields, setMissingFields] = useState<string[]>([]);

  const { trackCustomEvent } = useBehavioralTracking({
    featureName: 'profile_display',
    trackClicks: true,
    trackHovers: true
  });

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      setIsLoading(true);
      const response = await profileService.getProfile();
      setProfile(response.profile);
      setCompletionPercentage(response.completion_percentage);
      setMissingFields(response.missing_fields);
      
      trackCustomEvent('profile_viewed', {
        completionPercentage: response.completion_percentage,
        missingFieldsCount: response.missing_fields.length
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load profile');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefinementClick = () => {
    trackCustomEvent('refinement_button_clicked', {});
    onShowRefinement?.();
  };

  const handleDetailedQuestionnaireClick = () => {
    trackCustomEvent('detailed_questionnaire_button_clicked', {});
    onShowDetailedQuestionnaire?.();
  };

  const handleEditClick = () => {
    trackCustomEvent('edit_button_clicked', {});
    onEdit();
  };

  const formatTime = (time: string) => {
    return new Date(`2000-01-01T${time}`).toLocaleTimeString([], { 
      hour: 'numeric', 
      minute: '2-digit',
      hour12: true 
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-8">
          <h2 className="text-lg font-semibold text-red-400 mb-2">Error Loading Profile</h2>
          <p className="text-red-300">{error}</p>
          <button
            onClick={loadProfile}
            className="mt-4 px-6 py-3 bg-red-500/20 hover:bg-red-500/30 border border-red-500/30 text-red-300 rounded-xl transition-all duration-200"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="space-y-6">
        <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-2xl p-8">
          <h2 className="text-lg font-semibold text-yellow-400 mb-2">No Profile Found</h2>
          <p className="text-yellow-300 mb-4">You haven't set up your profile yet.</p>
          <button
            onClick={handleEditClick}
            className="px-6 py-3 bg-blue-500/20 hover:bg-blue-500/30 border border-blue-500/30 text-blue-300 rounded-xl transition-all duration-200"
          >
            Create Profile
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="border border-white/5 rounded-lg">
      <div className="p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Your Profile</h2>
            <p className="text-sm text-gray-600 dark:text-slate-400 mt-1">
              Created {new Date(profile.created_at).toLocaleDateString()}
            </p>
          </div>
          <button
            onClick={handleEditClick}
            className="bg-white text-slate-950 px-4 py-2 rounded-lg hover:bg-slate-100 focus:outline-none transition-colors font-medium text-sm"
          >
            Edit Profile
          </button>
        </div>

        {/* Completion Status */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          {/* Basic Profile Completion */}
          <div className="border border-white/5 rounded-lg p-4">
            <div className="flex justify-between items-center mb-3">
              <span className="text-sm font-medium text-slate-400">Basic Profile</span>
              <span className={`text-sm font-semibold ${
                completionPercentage >= 80 ? 'text-green-400' :
                completionPercentage >= 60 ? 'text-yellow-400' : 'text-red-400'
              }`}>
                {completionPercentage}%
              </span>
            </div>
            <div className="w-full bg-white/5 rounded-full h-2">
              <div
                className={`h-2 rounded-full transition-all duration-300 ${
                  completionPercentage >= 80 ? 'bg-green-500' :
                  completionPercentage >= 60 ? 'bg-yellow-500' : 'bg-red-500'
                }`}
                style={{ width: `${completionPercentage}%` }}
              />
            </div>
          </div>

          {/* Detailed Questionnaire Completion */}
          {(() => {
            const detailedProfile = profile.detailed_profile;
            const hasLearningStyle = !!detailedProfile?.learning_style;
            const hasProductivityPeaks = !!detailedProfile?.productivity_peaks?.length;
            const hasEnvironmentPrefs = !!detailedProfile?.study_environment_prefs?.preferred_location?.length;
            const hasMotivationFactors = !!detailedProfile?.motivation_factors?.length;
            const hasPersonalityTraits = !!detailedProfile?.personality_traits?.work_style;
            const hasAcademicBackground = !!detailedProfile?.academic_background?.current_level;
            
            const completedSections = [
              hasLearningStyle,
              hasProductivityPeaks,
              hasEnvironmentPrefs,
              hasMotivationFactors,
              hasPersonalityTraits,
              hasAcademicBackground
            ].filter(Boolean).length;
            
            const totalSections = 6;
            const questionnairePercentage = Math.round((completedSections / totalSections) * 100);
            const isQuestionnaireComplete = completedSections === totalSections;

            return (
              <div className="border border-white/5 rounded-lg p-4">
                <div className="flex justify-between items-center mb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-slate-400">Detailed Questionnaire</span>
                    {isQuestionnaireComplete && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-500/20 text-green-400 border border-green-500/20">
                        <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                        Complete
                      </span>
                    )}
                  </div>
                  <span className={`text-sm font-semibold ${
                    questionnairePercentage >= 80 ? 'text-green-400' :
                    questionnairePercentage >= 60 ? 'text-yellow-400' : 'text-red-400'
                  }`}>
                    {completedSections}/{totalSections}
                  </span>
                </div>
                <div className="w-full bg-white/5 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full transition-all duration-300 ${
                      questionnairePercentage >= 80 ? 'bg-green-500' :
                      questionnairePercentage >= 60 ? 'bg-yellow-500' : 'bg-red-500'
                    }`}
                    style={{ width: `${questionnairePercentage}%` }}
                  />
                </div>
              </div>
            );
          })()}
        </div>

        {/* Identity & Goals */}
        <div className="mb-6">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Identity & Goals</h3>
          
          <div className="space-y-3">
            <div className="border border-gray-300 dark:border-white/10 rounded-lg p-4">
              <div className="text-sm text-gray-600 dark:text-slate-400 mb-1">Target Identity</div>
              <p className="text-gray-900 dark:text-white">{profile.target_identity}</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="border border-gray-300 dark:border-white/10 rounded-lg p-4">
                <div className="text-sm text-gray-600 dark:text-slate-400 mb-2">Academic Goals</div>
                {profile.academic_goals.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {profile.academic_goals.map((goal, index) => (
                      <span
                        key={index}
                        className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border border-gray-300 dark:border-white/10 text-gray-600 dark:text-slate-400"
                      >
                        {goal}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500 dark:text-slate-500 italic">No academic goals set</p>
                )}
              </div>

              <div className="border border-gray-300 dark:border-white/10 rounded-lg p-4">
                <div className="text-sm text-gray-600 dark:text-slate-400 mb-2">Skill Goals</div>
                {profile.skill_goals.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {profile.skill_goals.map((skill, index) => (
                      <span
                        key={index}
                        className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border border-gray-300 dark:border-white/10 text-gray-600 dark:text-slate-400"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500 dark:text-slate-500 italic">No skill goals set</p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Schedule */}
        <div className="mb-6">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Daily Schedule</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="border border-gray-300 dark:border-white/10 rounded-lg p-4">
              <div className="text-sm text-gray-600 dark:text-slate-400 mb-1">Wake Up</div>
              <div className="text-2xl font-bold text-gray-900 dark:text-white">
                {formatTime(profile.wake_up_time)}
              </div>
            </div>

            <div className="border border-gray-300 dark:border-white/10 rounded-lg p-4">
              <div className="text-sm text-gray-600 dark:text-slate-400 mb-1">Available Hours</div>
              <div className="text-2xl font-bold text-gray-900 dark:text-white">
                {profile.available_hours}h
              </div>
            </div>

            <div className="border border-gray-300 dark:border-white/10 rounded-lg p-4">
              <div className="text-sm text-gray-600 dark:text-slate-400 mb-1">Sleep Time</div>
              <div className="text-2xl font-bold text-gray-900 dark:text-white">
                {formatTime(profile.sleep_time)}
              </div>
            </div>
          </div>
        </div>

        {/* Energy Pattern */}
        <div className="mb-6">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Energy Pattern</h3>
          
          {profile.energy_pattern.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3">
              {profile.energy_pattern
                .sort((a, b) => a.time.localeCompare(b.time))
                .map((energy, index) => (
                  <div key={index} className="border border-gray-300 dark:border-white/10 rounded-lg p-3 text-center">
                    <div className="text-xs text-gray-600 dark:text-slate-400 mb-1">
                      {formatTime(energy.time)}
                    </div>
                    <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${
                      energy.level === 'high' ? 'bg-green-500/20 text-green-400 border border-green-500/20' :
                      energy.level === 'medium' ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/20' :
                      'bg-red-500/20 text-red-400 border border-red-500/20'
                    }`}>
                      {energy.level}
                    </span>
                  </div>
                ))}
            </div>
          ) : (
            <div className="border border-gray-300 dark:border-white/10 rounded-lg p-6 text-center">
              <p className="text-gray-600 dark:text-slate-400">No energy pattern set</p>
              <p className="text-sm text-gray-500 dark:text-slate-500 mt-1">
                Add your energy levels throughout the day to help optimize your routine
              </p>
            </div>
          )}
        </div>

        {/* Profile Stats */}
        <div className="mb-6">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Profile Statistics</h3>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="border border-gray-300 dark:border-white/10 rounded-lg p-4">
              <div className="text-2xl font-bold text-gray-900 dark:text-white">
                {profile.academic_goals.length}
              </div>
              <div className="text-sm text-gray-600 dark:text-slate-400 mt-1">Academic Goals</div>
            </div>

            <div className="border border-gray-300 dark:border-white/10 rounded-lg p-4">
              <div className="text-2xl font-bold text-gray-900 dark:text-white">
                {profile.skill_goals.length}
              </div>
              <div className="text-sm text-gray-600 dark:text-slate-400 mt-1">Skill Goals</div>
            </div>

            <div className="border border-gray-300 dark:border-white/10 rounded-lg p-4">
              <div className="text-2xl font-bold text-gray-900 dark:text-white">
                {profile.energy_pattern.length}
              </div>
              <div className="text-sm text-gray-600 dark:text-slate-400 mt-1">Energy Points</div>
            </div>

            <div className="border border-gray-300 dark:border-white/10 rounded-lg p-4">
              <div className="text-2xl font-bold text-gray-900 dark:text-white">
                {(() => {
                  const wake = new Date(`2000-01-01T${profile.wake_up_time}`);
                  const sleep = new Date(`2000-01-01T${profile.sleep_time}`);
                  let diff = sleep.getTime() - wake.getTime();
                  if (diff < 0) diff += 24 * 60 * 60 * 1000;
                  return Math.round(diff / (1000 * 60 * 60));
                })()}h
              </div>
              <div className="text-sm text-gray-600 dark:text-slate-400 mt-1">Daily Window</div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Profile Actions</h3>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            <button
              onClick={handleEditClick}
              className="border border-gray-300 dark:border-white/10 text-gray-900 dark:text-white px-4 py-3 rounded-lg hover:border-gray-400 dark:hover:border-white/20 focus:outline-none transition-colors font-medium text-sm"
            >
              Edit Basic Profile
            </button>

            {onShowDetailedQuestionnaire && (() => {
              const detailedProfile = profile.detailed_profile;
              const hasAnyQuestionnaireData = detailedProfile?.learning_style || 
                detailedProfile?.productivity_peaks?.length ||
                detailedProfile?.study_environment_prefs?.preferred_location?.length;
              
              return (
                <button
                  onClick={handleDetailedQuestionnaireClick}
                  className="border border-gray-300 dark:border-white/10 text-gray-900 dark:text-white px-4 py-3 rounded-lg hover:border-gray-400 dark:hover:border-white/20 focus:outline-none transition-colors font-medium text-sm"
                >
                  {hasAnyQuestionnaireData ? 'Edit Questionnaire' : 'Complete Questionnaire'}
                </button>
              );
            })()}

            {onShowRefinement && (
              <button
                onClick={handleRefinementClick}
                className="border border-gray-300 dark:border-white/10 text-gray-900 dark:text-white px-4 py-3 rounded-lg hover:border-gray-400 dark:hover:border-white/20 focus:outline-none transition-colors font-medium text-sm"
              >
                Get AI Suggestions
              </button>
            )}
          </div>

          {/* Questionnaire Benefits */}
          {onShowDetailedQuestionnaire && (() => {
            const detailedProfile = profile.detailed_profile;
            const hasCompletedQuestionnaire = detailedProfile?.learning_style && 
              detailedProfile?.productivity_peaks?.length &&
              detailedProfile?.study_environment_prefs?.preferred_location?.length &&
              detailedProfile?.motivation_factors?.length &&
              detailedProfile?.personality_traits?.work_style &&
              detailedProfile?.academic_background?.current_level;

            if (!hasCompletedQuestionnaire) {
              return (
                <div className="mt-4 border border-gray-300 dark:border-white/10 rounded-lg p-4">
                  <div className="text-sm font-medium text-gray-900 dark:text-white mb-2">
                    📋 Why complete the detailed questionnaire?
                  </div>
                  <ul className="text-sm text-gray-600 dark:text-slate-400 space-y-1">
                    <li>• Get personalized routine recommendations</li>
                    <li>• Receive AI-powered productivity insights</li>
                    <li>• Optimize your schedule based on your energy patterns</li>
                    <li>• Unlock advanced features tailored to your learning style</li>
                  </ul>
                </div>
              );
            }
            return null;
          })()}
        </div>
      </div>
    </div>
  );
};

export default ProfileDisplay;
