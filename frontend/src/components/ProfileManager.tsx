import React, { useState, useEffect } from 'react';
import { UserProfile } from '../types/profile';
import { profileService } from '../services/profileService';
import ProfileSetup from './ProfileSetup';
import ProfileDisplay from './ProfileDisplay';
import ProfileEdit from './ProfileEdit';
import DetailedProfileQuestionnaire from './DetailedProfileQuestionnaire';
import ProfileRefinement from './ProfileRefinement';
import { useBehavioralTracking } from '../hooks/useBehavioralTracking';

type ProfileView = 'loading' | 'setup' | 'detailed-questionnaire' | 'display' | 'edit' | 'refinement';

interface ProfileManagerProps {
  onProfileComplete?: (profile: UserProfile) => void;
}

const ProfileManager: React.FC<ProfileManagerProps> = ({ onProfileComplete }) => {
  const [currentView, setCurrentView] = useState<ProfileView>('loading');
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showDetailedQuestionnaire, setShowDetailedQuestionnaire] = useState(false);

  const { elementRef, trackCustomEvent } = useBehavioralTracking({
    featureName: 'profile_manager'
  });

  useEffect(() => {
    checkExistingProfile();
  }, []);

  const checkExistingProfile = async () => {
    try {
      const response = await profileService.getProfile();
      setProfile(response.profile);
      
      // Check if detailed profile is incomplete
      const detailedProfile = response.profile.detailed_profile;
      const isDetailedProfileIncomplete = !detailedProfile?.learning_style || 
        !detailedProfile?.productivity_peaks?.length ||
        !detailedProfile?.study_environment_prefs?.preferred_location?.length;

      if (isDetailedProfileIncomplete && response.completion_percentage < 80) {
        setShowDetailedQuestionnaire(true);
      }
      
      setCurrentView('display');
      
      trackCustomEvent('profile_loaded', {
        completionPercentage: response.completion_percentage,
        hasDetailedProfile: !!detailedProfile?.learning_style
      });
      
      // Notify parent component if profile exists
      if (onProfileComplete) {
        onProfileComplete(response.profile);
      }
    } catch (err) {
      // Profile doesn't exist, show setup
      setCurrentView('setup');
      setError(null);
      trackCustomEvent('profile_not_found', {});
    }
  };

  const handleSetupComplete = async () => {
    trackCustomEvent('basic_profile_completed', {});
    
    // Reload the profile to get the saved data
    try {
      const response = await profileService.getProfile();
      setProfile(response.profile);
      
      // After basic setup, show detailed questionnaire
      setCurrentView('detailed-questionnaire');
      
      // Notify parent component
      if (onProfileComplete) {
        onProfileComplete(response.profile);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load profile after setup');
      // Still show detailed questionnaire even if reload fails
      setCurrentView('detailed-questionnaire');
    }
  };

  const handleDetailedQuestionnaireComplete = async (detailedProfile: any) => {
    try {
      const response = await profileService.updateDetailedProfile(detailedProfile);
      setProfile(response.profile);
      setCurrentView('display');
      setShowDetailedQuestionnaire(false);
      
      trackCustomEvent('detailed_profile_completed', {
        completionPercentage: response.completion_percentage
      });
      
      if (onProfileComplete) {
        onProfileComplete(response.profile);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save detailed profile');
    }
  };

  const handleDetailedQuestionnaireSkip = async () => {
    // Reload profile to ensure we have the latest data
    try {
      const response = await profileService.getProfile();
      setProfile(response.profile);
    } catch (err) {
      // If reload fails, just continue
      console.error('Failed to reload profile:', err);
    }
    
    setCurrentView('display');
    setShowDetailedQuestionnaire(false);
    trackCustomEvent('detailed_profile_skipped', {});
  };

  const handleSetupSkip = () => {
    setCurrentView('display');
    trackCustomEvent('basic_profile_skipped', {});
  };

  const handleEditProfile = () => {
    setCurrentView('edit');
    trackCustomEvent('profile_edit_started', {});
  };

  const handleEditSave = async (updatedProfile: UserProfile) => {
    console.log('ProfileManager: Received updated profile:', updatedProfile);
    console.log('ProfileManager: Updated wake_up_time:', updatedProfile.wake_up_time);
    console.log('ProfileManager: Updated sleep_time:', updatedProfile.sleep_time);
    
    // Reload profile from server to ensure we have the latest data
    try {
      const response = await profileService.getProfile();
      console.log('ProfileManager: Reloaded profile from server:', response.profile);
      console.log('ProfileManager: Reloaded wake_up_time:', response.profile.wake_up_time);
      console.log('ProfileManager: Reloaded sleep_time:', response.profile.sleep_time);
      setProfile(response.profile);
    } catch (err) {
      console.error('ProfileManager: Failed to reload profile:', err);
      // Fall back to using the passed profile
      setProfile(updatedProfile);
    }
    
    setCurrentView('display');
    
    trackCustomEvent('profile_edit_completed', {});
    
    // Notify parent component of profile update
    if (onProfileComplete) {
      onProfileComplete(updatedProfile);
    }
  };

  const handleEditCancel = () => {
    setCurrentView('display');
    trackCustomEvent('profile_edit_cancelled', {});
  };

  const handleShowRefinement = () => {
    setCurrentView('refinement');
    trackCustomEvent('profile_refinement_started', {});
  };

  const handleRefinementComplete = (updatedProfile: UserProfile) => {
    setProfile(updatedProfile);
    setCurrentView('display');
    
    trackCustomEvent('profile_refinement_completed', {});
    
    if (onProfileComplete) {
      onProfileComplete(updatedProfile);
    }
  };

  const handleRefinementClose = () => {
    setCurrentView('display');
    trackCustomEvent('profile_refinement_cancelled', {});
  };

  const handleShowDetailedQuestionnaire = () => {
    setCurrentView('detailed-questionnaire');
    trackCustomEvent('detailed_questionnaire_started', {});
  };

  const renderCurrentView = () => {
    switch (currentView) {
      case 'loading':
        return (
          <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-slate-950">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 dark:border-blue-400 mx-auto mb-4"></div>
              <p className="text-gray-600 dark:text-slate-400">Loading your profile...</p>
            </div>
          </div>
        );

      case 'setup':
        return (
          <ProfileSetup
            onComplete={handleSetupComplete}
            onSkip={handleSetupSkip}
          />
        );

      case 'detailed-questionnaire':
        return (
          <DetailedProfileQuestionnaire
            onComplete={handleDetailedQuestionnaireComplete}
            onSkip={handleDetailedQuestionnaireSkip}
            initialData={profile?.detailed_profile}
          />
        );

      case 'display':
        return (
          <ProfileDisplay
            onEdit={handleEditProfile}
            onShowRefinement={handleShowRefinement}
            onShowDetailedQuestionnaire={handleShowDetailedQuestionnaire}
            showDetailedQuestionnairePrompt={showDetailedQuestionnaire}
          />
        );

      case 'edit':
        return (
          <ProfileEdit
            onSave={handleEditSave}
            onCancel={handleEditCancel}
          />
        );

      case 'refinement':
        return profile ? (
          <ProfileRefinement
            currentProfile={profile}
            onUpdate={handleRefinementComplete}
            onClose={handleRefinementClose}
          />
        ) : null;

      default:
        return (
          <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-slate-950">
            <div className="text-center">
              <p className="text-red-600 dark:text-red-400">Unknown view state</p>
              <button
                onClick={() => setCurrentView('loading')}
                className="mt-4 px-4 py-2 bg-blue-600 dark:bg-blue-500 text-white rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors"
              >
                Reload
              </button>
            </div>
          </div>
        );
    }
  };

  return (
    <div ref={elementRef} className="profile-manager">
      {error && currentView !== 'setup' && (
        <div className="fixed top-4 right-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 shadow-lg z-50">
          <p className="text-red-600 dark:text-red-400 text-sm">{error}</p>
          <button
            onClick={() => setError(null)}
            className="mt-2 text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300 text-sm underline"
          >
            Dismiss
          </button>
        </div>
      )}
      
      {renderCurrentView()}
    </div>
  );
};

export default ProfileManager;