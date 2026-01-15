import React, { useState, useEffect } from 'react';
import ProfileManager from './ProfileManager';
import RoutineGeneratorV3 from './RoutineGeneratorV3';
import RoutineViewer from './RoutineViewer';
import EveningReview from './EveningReview';
import { HabitTracker } from './HabitTracker';
import { HabitManager } from './HabitManager';
import { DisciplineDashboard } from './DisciplineDashboard';
import { DeepWorkDashboard } from './DeepWorkDashboard';
import { UserProfile } from '../types/profile';

interface DashboardProps {
  onProfileComplete: (profile: UserProfile) => void;
  onEnterFocusMode: () => void;
}

type DashboardView = 'profile' | 'routine' | 'evening-review' | 'habits' | 'analytics' | 'deep-work';

const Dashboard: React.FC<DashboardProps> = ({ onProfileComplete }) => {
  const [currentView, setCurrentView] = useState<DashboardView>('profile');
  const [hasCheckedProfile, setHasCheckedProfile] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0); // Key to force component refresh
  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  ); // Add selectedDate state

  // Initialize view from URL hash on mount and check profile
  useEffect(() => {
    const checkProfile = async () => {
      const hash = window.location.hash.slice(1) as DashboardView;
      const validViews: DashboardView[] = ['profile', 'routine', 'evening-review', 'habits', 'analytics', 'deep-work'];
      
      // If there's a valid hash, use it
      if (hash && validViews.includes(hash)) {
        setCurrentView(hash);
        setHasCheckedProfile(true);
        return;
      }

      // No hash specified, check if user has profile to determine default view
      try {
        const { profileService } = await import('../services/profileService');
        await profileService.getProfile();
        // Profile exists, default to routine view
        setCurrentView('routine');
        window.location.hash = 'routine';
      } catch (err) {
        // No profile, default to profile view
        setCurrentView('profile');
        window.location.hash = 'profile';
      } finally {
        setHasCheckedProfile(true);
      }
    };
    
    if (!hasCheckedProfile) {
      checkProfile();
    }
  }, [hasCheckedProfile]);

  // Handle tab change with URL update and data refresh
  const handleViewChange = (view: DashboardView) => {
    setCurrentView(view);
    window.location.hash = view;
    // Increment refresh key to force component remount
    setRefreshKey(prev => prev + 1);
  };

  const navigationItems = [
    { 
      key: 'routine' as const, 
      label: 'Routine',
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      )
    },
    { 
      key: 'habits' as const, 
      label: 'Habits',
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      )
    },
    { 
      key: 'deep-work' as const, 
      label: 'Deep Work',
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
      )
    },
    { 
      key: 'analytics' as const, 
      label: 'Analytics',
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      )
    },
    { 
      key: 'evening-review' as const, 
      label: 'Evening Review',
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
        </svg>
      )
    },
    { 
      key: 'profile' as const, 
      label: 'Profile',
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
      )
    },
  ];

  // Render premium pill-style navigation
  const renderNavigation = () => (
    <div className="border-b border-white/5">
      <div className="max-w-7xl mx-auto px-6 lg:px-8 py-6">
        <nav className="flex items-center gap-3 overflow-x-auto pb-2">
          {navigationItems.map((item) => (
            <button
              key={item.key}
              onClick={() => handleViewChange(item.key)}
              className={`
                group relative flex items-center gap-2 px-4 py-2.5 rounded-xl
                font-medium text-sm whitespace-nowrap transition-all duration-300
                ${currentView === item.key
                  ? 'bg-white/10 text-white shadow-lg shadow-white/5'
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
                }
              `}
            >
              {/* Icon with glow effect on active */}
              <span className={`
                transition-all duration-300
                ${currentView === item.key 
                  ? 'text-white drop-shadow-[0_0_8px_rgba(255,255,255,0.5)]' 
                  : 'group-hover:scale-110'
                }
              `}>
                {item.icon}
              </span>
              
              {/* Label */}
              <span className="hidden sm:inline">{item.label}</span>
              
              {/* Active indicator - animated gradient border */}
              {currentView === item.key && (
                <span className="absolute inset-0 rounded-xl border border-white/20 pointer-events-none" />
              )}
            </button>
          ))}
        </nav>
      </div>
    </div>
  );

  const renderContent = () => {
    switch (currentView) {
      case 'routine':
        return (
          <div key={`routine-${refreshKey}`} className="space-y-12">
            {/* Routine Generator Section */}
            <div>
              <h2 className="text-2xl font-bold text-white mb-6">Generate New Routine</h2>
              <RoutineGeneratorV3 
                onRoutineGenerated={(routine) => {
                  console.log('V3 Routine generated:', routine);
                  console.log('Routine date from backend:', routine.date);
                  
                  // Extract date properly - handle both ISO strings and date-only strings
                  let routineDate;
                  if (routine.date) {
                    const dateValue = typeof routine.date === 'string' ? routine.date : routine.date.toString();
                    if (dateValue.includes('T')) {
                      // ISO string - extract date part
                      routineDate = dateValue.split('T')[0];
                    } else {
                      // Already a date string
                      routineDate = dateValue;
                    }
                  } else {
                    // Fallback to today
                    routineDate = new Date().toISOString().split('T')[0];
                  }
                  
                  console.log('Setting RoutineViewer date to:', routineDate);
                  setSelectedDate(routineDate);
                  
                  // Refresh the routine viewer
                  setRefreshKey(prev => prev + 1);
                }}
              />
            </div>

            {/* Divider */}
            <div className="border-t border-white/5"></div>

            {/* Routine Viewer Section */}
            <div>
              <h2 className="text-2xl font-bold text-white mb-6">My Routines</h2>
              <RoutineViewer 
                key={`routine-viewer-${refreshKey}`}
                selectedDate={selectedDate}
                onSegmentComplete={(segmentId) => {
                  console.log('Segment completed:', segmentId);
                }}
              />
            </div>
          </div>
        );

      case 'profile':
        return (
          <div key={`profile-${refreshKey}`}>
            <ProfileManager onProfileComplete={onProfileComplete} />
          </div>
        );
      
      case 'evening-review':
        return (
          <div key={`evening-review-${refreshKey}`}>
            <EveningReview 
              onReviewComplete={(review) => {
                console.log('Evening review completed:', review);
              }}
            />
          </div>
        );
      
      case 'habits':
        return (
          <div key={`habits-${refreshKey}`} className="space-y-12">
            {/* Habit Manager - Create and manage habits */}
            <HabitManager 
              onHabitsUpdate={(habits) => {
                console.log('Habits list updated:', habits);
              }}
            />
            
            {/* Habit Tracker - Track daily completion */}
            <HabitTracker 
              onHabitUpdate={(todayHabits) => {
                console.log('Habits updated:', todayHabits);
              }}
            />
          </div>
        );

      case 'deep-work':
        return (
          <div key={`deep-work-${refreshKey}`}>
            <DeepWorkDashboard />
          </div>
        );
      
      case 'analytics':
        return (
          <div key={`analytics-${refreshKey}`}>
            <DisciplineDashboard />
          </div>
        );
      
      default:
        return <ProfileManager onProfileComplete={onProfileComplete} />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-950">
      {/* Horizontal Navigation */}
      {renderNavigation()}
      
      {/* Main Content */}
      <main className="py-12">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          {renderContent()}
        </div>
      </main>
    </div>
  );
};

export default Dashboard;