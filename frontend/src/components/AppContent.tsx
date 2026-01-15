import React, { useState, useEffect } from 'react';
import { LoginForm } from './LoginForm';
import { RegisterForm } from './RegisterForm';
import { GoogleCallback } from './GoogleCallback';
import { FocusScreen } from './FocusScreen';
import { Homepage } from './Homepage';
import Dashboard from './Dashboard';
import { ThemeToggle } from './ThemeToggle';
import { useAppContext } from '../contexts/AppContext';
import { UserProfile } from '../types/profile';

type AuthMode = 'homepage' | 'login' | 'register';

export const AppContent: React.FC = () => {
  const { state, actions } = useAppContext();
  const [authMode, setAuthMode] = useState<AuthMode>('homepage');
  const [isGoogleCallback, setIsGoogleCallback] = useState(false);

  console.log('🎯 AppContent rendering with state:', state.appState);
  console.log('👤 User profile:', state.userProfile);

  useEffect(() => {
    // Check if this is a Google OAuth callback with code
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('code')) {
      setIsGoogleCallback(true);
    }
  }, []);

  const handleAuthSuccess = async () => {
    console.log('Authentication successful!');
    actions.clearError();
    actions.setAppState('authenticated');
    setIsGoogleCallback(false);
    
    // After successful registration, check if profile exists
    // If not, the Dashboard/ProfileManager will automatically show profile setup
  };

  const handleAuthError = (errorMessage: string) => {
    console.error('Authentication error:', errorMessage);
    actions.setError(errorMessage);
    setIsGoogleCallback(false);
  };

  const handleProfileComplete = (profile: UserProfile) => {
    console.log('Profile completed:', profile);
    actions.setUserProfile(profile);
    actions.clearError();
  };

  const renderUnauthenticated = () => {
    // Show homepage first
    if (authMode === 'homepage') {
      return (
        <Homepage
          onGetStarted={() => setAuthMode('register')}
          onLogin={() => setAuthMode('login')}
        />
      );
    }

    // Show login/register forms
    return (
      <div className="min-h-screen relative">
        {/* Subtle gradient background */}
        <div className="absolute inset-0 bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950"></div>
        
        {/* Minimal grid pattern */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:64px_64px]"></div>

        <div className="relative z-10">
          {/* Back to Homepage Button */}
          <div className="max-w-7xl mx-auto px-6 lg:px-8 pt-6">
            <button
              onClick={() => setAuthMode('homepage')}
              className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors text-sm"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              <span>Back</span>
            </button>
          </div>

          <div className="max-w-7xl mx-auto px-6 lg:px-8 py-24">
            {state.error && (
              <div className="max-w-md mx-auto mb-8 p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
                <p className="text-red-400 text-sm">{state.error}</p>
              </div>
            )}
            
            {authMode === 'login' ? (
              <LoginForm
                onSuccess={handleAuthSuccess}
                onSwitchToRegister={() => setAuthMode('register')}
                onError={handleAuthError}
              />
            ) : (
              <RegisterForm
                onSuccess={handleAuthSuccess}
                onSwitchToLogin={() => setAuthMode('login')}
                onError={handleAuthError}
              />
            )}
          </div>
        </div>
      </div>
    );
  };

  const renderAuthenticated = () => (
    <div className="min-h-screen relative">
      {/* Subtle gradient background - matching homepage */}
      <div className="fixed inset-0 bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950"></div>
      
      {/* Minimal grid pattern - matching homepage */}
      <div className="fixed inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:64px_64px]"></div>

      {/* Ultra Premium Navigation Header */}
      <nav className="relative z-10 sticky top-0">
        {/* Glassmorphism background with gradient border */}
        <div className="absolute inset-0 bg-gradient-to-r from-slate-900/95 via-slate-900/90 to-slate-900/95 backdrop-blur-2xl"></div>
        <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent"></div>
        
        <div className="relative max-w-7xl mx-auto px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            {/* Logo Section - Enhanced */}
            <div className="flex items-center gap-3 group">
              <div className="relative">
                {/* Glow effect */}
                <div className="absolute inset-0 bg-white/20 rounded-xl blur-xl group-hover:bg-white/30 transition-all duration-500"></div>
                {/* Logo container */}
                <div className="relative w-10 h-10 bg-gradient-to-br from-white to-slate-200 rounded-xl flex items-center justify-center shadow-lg group-hover:shadow-white/20 group-hover:scale-105 transition-all duration-300">
                  <svg className="w-6 h-6 text-slate-950" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
              </div>
              <div className="flex flex-col">
                <span className="text-base font-bold text-white tracking-tight">Discipline</span>
                <span className="text-xs text-slate-400 font-medium hidden sm:inline">Focus & Growth</span>
              </div>
            </div>

            {/* Action Buttons - Ultra Premium */}
            <div className="flex items-center gap-2">
              {/* Theme Toggle - Enhanced */}
              <div className="relative group">
                <div className="absolute inset-0 bg-white/5 rounded-lg blur group-hover:bg-white/10 transition-all duration-300"></div>
                <div className="relative">
                  <ThemeToggle />
                </div>
              </div>

              {/* Focus Button - Premium Style */}
              <button
                onClick={() => {
                  console.log('🎯 FOCUS MODE BUTTON CLICKED!');
                  actions.enterFocusMode();
                }}
                className="relative group px-5 py-2.5 overflow-hidden rounded-lg transition-all duration-300"
                style={{ cursor: 'pointer' }}
              >
                {/* Animated gradient background - Light mode: slate, Dark mode: white */}
                <div className="absolute inset-0 bg-gradient-to-r from-slate-800 via-slate-700 to-slate-800 group-hover:from-slate-700 group-hover:via-slate-600 group-hover:to-slate-700 dark:from-white dark:via-slate-100 dark:to-white dark:group-hover:from-slate-100 dark:group-hover:via-white dark:group-hover:to-slate-100 transition-all duration-500"></div>
                {/* Shine effect */}
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-slate-500/40 dark:via-white/40 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"></div>
                </div>
                {/* Button content */}
                <div className="relative flex items-center gap-2">
                  <svg className="w-4 h-4 text-white dark:text-slate-950 group-hover:scale-110 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  <span className="text-sm font-bold text-white dark:text-slate-950 hidden sm:inline">Focus</span>
                </div>
              </button>

              {/* Divider */}
              <div className="w-px h-8 bg-gradient-to-b from-transparent via-white/20 to-transparent"></div>

              {/* Sign Out Button - Subtle Premium */}
              <button
                onClick={() => {
                  console.log('🚪 LOGOUT BUTTON CLICKED!');
                  actions.logout();
                }}
                className="relative group px-4 py-2.5 rounded-lg transition-all duration-300 hover:bg-white/5"
                style={{ cursor: 'pointer' }}
              >
                <div className="flex items-center gap-2">
                  <svg className="w-4 h-4 text-slate-400 group-hover:text-white transition-colors duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                  <span className="text-sm font-medium text-slate-400 group-hover:text-white transition-colors duration-300 hidden sm:inline">Sign out</span>
                </div>
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content - Dashboard Component */}
      <div className="relative z-10">
        <Dashboard 
          onProfileComplete={handleProfileComplete}
          onEnterFocusMode={actions.enterFocusMode}
        />
      </div>
    </div>
  );

  const renderFocusMode = () => (
    <FocusScreen onExit={actions.exitFocusMode} />
  );

  const renderLoading = () => (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <div className="relative w-20 h-20 mx-auto mb-6">
          <div className="absolute inset-0 border-4 border-indigo-200 rounded-full"></div>
          <div className="absolute inset-0 border-4 border-indigo-600 rounded-full border-t-transparent animate-spin"></div>
          <div className="absolute inset-2 bg-gradient-to-br from-indigo-500 to-blue-500 rounded-full flex items-center justify-center">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
        </div>
        <p className="text-slate-600 font-medium text-lg">Loading your workspace...</p>
        <p className="text-slate-400 text-sm mt-2">Preparing your discipline system</p>
      </div>
    </div>
  );

  switch (state.appState) {
    case 'loading':
      return renderLoading();
    case 'unauthenticated':
      // Handle Google OAuth callback
      if (isGoogleCallback) {
        return (
          <GoogleCallback
            onSuccess={handleAuthSuccess}
            onError={handleAuthError}
          />
        );
      }
      return renderUnauthenticated();
    case 'authenticated':
      return renderAuthenticated();
    case 'focus_mode':
      return renderFocusMode();
    default:
      return renderLoading();
  }
};