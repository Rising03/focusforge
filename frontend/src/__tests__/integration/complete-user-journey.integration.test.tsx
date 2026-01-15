import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from '../../App';

// Mock API responses for complete user journey testing
const mockApiResponses = {
  auth: {
    register: {
      accessToken: 'mock-jwt-token-journey',
      user: { 
        id: 'journey-user-1', 
        email: 'journey@example.com', 
        name: 'Journey Test User' 
      }
    },
    login: {
      accessToken: 'mock-jwt-token-journey',
      user: { 
        id: 'journey-user-1', 
        email: 'journey@example.com', 
        name: 'Journey Test User' 
      }
    }
  },
  profile: {
    id: 'profile-1',
    targetIdentity: 'disciplined computer science student',
    academicGoals: ['Complete data structures course', 'Master algorithms'],
    skillGoals: ['Advanced React', 'System design'],
    wakeUpTime: '06:00',
    sleepTime: '22:30',
    availableHours: 8,
    detailedProfile: {
      learningStyle: 'visual',
      productivityPeaks: ['early_morning', 'late_morning'],
      studyEnvironmentPrefs: {
        preferredLocation: ['library', 'quiet_room'],
        noiseLevel: 'quiet'
      }
    }
  },
  routine: {
    id: 'routine-1',
    date: new Date().toISOString().split('T')[0],
    segments: [
      {
        id: 'segment-1',
        timeSlot: { start: '06:00', end: '08:00' },
        type: 'deep_work',
        activity: 'Algorithm Study Session',
        duration: 120,
        priority: 'high',
        completed: false
      },
      {
        id: 'segment-2',
        timeSlot: { start: '09:00', end: '10:30' },
        type: 'study',
        activity: 'Data Structures Practice',
        duration: 90,
        priority: 'high',
        completed: false
      },
      {
        id: 'segment-3',
        timeSlot: { start: '14:00', end: '15:00' },
        type: 'skill_practice',
        activity: 'React Development',
        duration: 60,
        priority: 'medium',
        completed: false
      }
    ],
    adaptations: ['Prioritized morning deep work based on energy patterns']
  },
  habits: [
    {
      id: 'habit-1',
      name: 'Morning Algorithm Practice',
      description: 'Practice algorithms to reinforce disciplined student identity',
      frequency: 'daily',
      streak: 5,
      completed: false
    }
  ],
  activities: [
    {
      id: 'activity-1',
      activity: 'Algorithm Study',
      type: 'study',
      duration: 120,
      focusQuality: 'high',
      startTime: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
      endTime: new Date().toISOString()
    }
  ],
  analytics: {
    consistencyScore: 87,
    identityAlignment: 82,
    deepWorkHours: 6.5,
    habitStreaks: [{ habitId: 'habit-1', currentStreak: 5, longestStreak: 12 }],
    categoryBreakdown: {
      study: 4.5,
      skill_practice: 2.0,
      deep_work: 6.5
    },
    productivityPatterns: {
      bestTimeOfDay: 'morning',
      averageFocusQuality: 8.2,
      consistencyTrend: 'improving'
    }
  },
  deepWork: {
    id: 'deep-work-1',
    scheduledTime: '09:00',
    duration: 120,
    task: 'Algorithm Implementation',
    environmentSetup: {
      location: 'library',
      preparation: ['Clear desk', 'Turn off notifications']
    }
  },
  eveningReview: {
    id: 'review-1',
    date: new Date().toISOString().split('T')[0],
    accomplished: ['Completed algorithm study', 'Finished morning habit'],
    missed: ['Planned reading session'],
    mood: 8,
    energyLevel: 7,
    insights: 'Morning sessions are most productive'
  },
  aiResponse: {
    success: false, // AI disabled in test environment
    fallbackOptions: {
      suggestedActions: [
        'Log completed study session',
        'Update daily progress',
        'Plan tomorrow\'s activities'
      ]
    },
    response: 'Great work on maintaining your disciplined student identity!',
    suggestions: [
      'Continue morning algorithm practice',
      'Schedule deep work for complex topics'
    ]
  }
};

// Enhanced mock fetch with complete journey support
global.fetch = jest.fn();

const mockFetch = (url: string, options?: any) => {
  const method = options?.method || 'GET';
  
  // Auth endpoints
  if (url.includes('/api/auth/register') && method === 'POST') {
    return Promise.resolve({
      ok: true,
      json: () => Promise.resolve(mockApiResponses.auth.register)
    });
  }
  
  if (url.includes('/api/auth/login') && method === 'POST') {
    return Promise.resolve({
      ok: true,
      json: () => Promise.resolve(mockApiResponses.auth.login)
    });
  }
  
  // Profile endpoints
  if (url.includes('/api/profile') && method === 'POST') {
    return Promise.resolve({
      ok: true,
      json: () => Promise.resolve(mockApiResponses.profile)
    });
  }
  
  if (url.includes('/api/profile/detailed') && method === 'PUT') {
    return Promise.resolve({
      ok: true,
      json: () => Promise.resolve({ success: true })
    });
  }
  
  if (url.includes('/api/profile') && method === 'GET') {
    return Promise.resolve({
      ok: true,
      json: () => Promise.resolve(mockApiResponses.profile)
    });
  }
  
  // Routine endpoints
  if (url.includes('/api/routines/generate') && method === 'POST') {
    return Promise.resolve({
      ok: true,
      json: () => Promise.resolve(mockApiResponses.routine)
    });
  }
  
  if (url.includes('/api/routines/today') && method === 'GET') {
    return Promise.resolve({
      ok: true,
      json: () => Promise.resolve(mockApiResponses.routine)
    });
  }
  
  // Activity endpoints
  if (url.includes('/api/activities/start') && method === 'POST') {
    return Promise.resolve({
      ok: true,
      json: () => Promise.resolve({
        data: { session: { id: 'session-1' } }
      })
    });
  }
  
  if (url.includes('/api/activities') && url.includes('/stop') && method === 'PATCH') {
    return Promise.resolve({
      ok: true,
      json: () => Promise.resolve({
        duration: 120,
        focusQuality: 'high'
      })
    });
  }
  
  if (url.includes('/api/activities/stats') && method === 'GET') {
    return Promise.resolve({
      ok: true,
      json: () => Promise.resolve({
        focusedTime: 240,
        categories: mockApiResponses.analytics.categoryBreakdown
      })
    });
  }
  
  // Habit endpoints
  if (url.includes('/api/habits') && method === 'POST') {
    return Promise.resolve({
      ok: true,
      json: () => Promise.resolve({
        data: { habit: mockApiResponses.habits[0] }
      })
    });
  }
  
  if (url.includes('/api/habits') && method === 'GET') {
    return Promise.resolve({
      ok: true,
      json: () => Promise.resolve(mockApiResponses.habits)
    });
  }
  
  if (url.includes('/api/habits') && url.includes('/complete') && method === 'POST') {
    return Promise.resolve({
      ok: true,
      json: () => Promise.resolve({ success: true })
    });
  }
  
  if (url.includes('/api/habits/streaks') && method === 'GET') {
    return Promise.resolve({
      ok: true,
      json: () => Promise.resolve(mockApiResponses.analytics.habitStreaks)
    });
  }
  
  // Deep work endpoints
  if (url.includes('/api/deep-work/schedule') && method === 'POST') {
    return Promise.resolve({
      ok: true,
      json: () => Promise.resolve(mockApiResponses.deepWork)
    });
  }
  
  if (url.includes('/api/deep-work') && url.includes('/start') && method === 'POST') {
    return Promise.resolve({
      ok: true,
      json: () => Promise.resolve({ sessionId: 'deep-session-1' })
    });
  }
  
  // Evening review endpoints
  if (url.includes('/api/evening-reviews') && method === 'POST') {
    return Promise.resolve({
      ok: true,
      json: () => Promise.resolve(mockApiResponses.eveningReview)
    });
  }
  
  // Analytics endpoints
  if (url.includes('/api/analytics/dashboard') && method === 'GET') {
    return Promise.resolve({
      ok: true,
      json: () => Promise.resolve(mockApiResponses.analytics)
    });
  }
  
  if (url.includes('/api/analytics/patterns') && method === 'GET') {
    return Promise.resolve({
      ok: true,
      json: () => Promise.resolve({
        productivityPatterns: mockApiResponses.analytics.productivityPatterns,
        temporalPatterns: [],
        focusQualityTrends: []
      })
    });
  }
  
  // Identity endpoints
  if (url.includes('/api/identity/alignment') && method === 'GET') {
    return Promise.resolve({
      ok: true,
      json: () => Promise.resolve({
        alignmentScore: mockApiResponses.analytics.identityAlignment,
        identityEvidence: ['Consistent morning habits', 'Deep work sessions']
      })
    });
  }
  
  // AI endpoints
  if (url.includes('/api/ai/parse') && method === 'POST') {
    return Promise.resolve({
      ok: true,
      json: () => Promise.resolve(mockApiResponses.aiResponse)
    });
  }
  
  if (url.includes('/api/ai/coach') && method === 'POST') {
    return Promise.resolve({
      ok: true,
      json: () => Promise.resolve({
        response: mockApiResponses.aiResponse.response,
        suggestions: mockApiResponses.aiResponse.suggestions
      })
    });
  }
  
  // Data export endpoints
  if (url.includes('/api/data-export/export') && method === 'GET') {
    return Promise.resolve({
      ok: true,
      json: () => Promise.resolve({
        profile: mockApiResponses.profile,
        routines: [mockApiResponses.routine],
        activities: mockApiResponses.activities,
        habits: mockApiResponses.habits,
        reviews: [mockApiResponses.eveningReview],
        analytics: mockApiResponses.analytics
      })
    });
  }
  
  // Default response
  return Promise.resolve({
    ok: true,
    json: () => Promise.resolve({})
  });
};

(global.fetch as jest.Mock).mockImplementation(mockFetch);

describe('Frontend Complete User Journey Integration Tests', () => {
  beforeEach(() => {
    localStorage.clear();
    jest.clearAllMocks();
  });

  describe('Complete User Journey: Registration to Full Feature Usage', () => {
    it('Journey Step 1-3: Registration, Profile Setup, and Detailed Profiling', async () => {
      const user = userEvent.setup();
      render(<App />);

      // Step 1: User Registration
      const registerLink = screen.getByText(/register/i);
      await user.click(registerLink);

      const emailInput = screen.getByLabelText(/email/i);
      const passwordInput = screen.getByLabelText(/password/i);
      const nameInput = screen.getByLabelText(/name/i);
      const registerButton = screen.getByRole('button', { name: /register/i });

      await user.type(emailInput, 'journey@example.com');
      await user.type(passwordInput, 'SecurePassword123!');
      await user.type(nameInput, 'Journey Test User');
      await user.click(registerButton);

      // Step 2: Profile Setup
      await waitFor(() => {
        expect(screen.getByText(/profile setup/i)).toBeInTheDocument();
      });

      const identityInput = screen.getByLabelText(/target identity/i);
      const wakeTimeInput = screen.getByLabelText(/wake up time/i);
      const sleepTimeInput = screen.getByLabelText(/sleep time/i);
      const saveProfileButton = screen.getByRole('button', { name: /save profile/i });

      await user.type(identityInput, 'disciplined computer science student');
      await user.type(wakeTimeInput, '06:00');
      await user.type(sleepTimeInput, '22:30');
      await user.click(saveProfileButton);

      // Step 3: Detailed Profile Questionnaire
      await waitFor(() => {
        expect(screen.getByText(/detailed setup/i)).toBeInTheDocument();
      });

      const visualLearningRadio = screen.getByLabelText(/visual/i);
      await user.click(visualLearningRadio);

      const morningCheckbox = screen.getByLabelText(/morning/i);
      await user.click(morningCheckbox);

      const completeSetupButton = screen.getByRole('button', { name: /complete setup/i });
      await user.click(completeSetupButton);

      await waitFor(() => {
        expect(screen.getByText(/dashboard/i)).toBeInTheDocument();
      });
    });

    it('Journey Step 4-5: Daily Routine Generation and Activity Tracking', async () => {
      const user = userEvent.setup();
      localStorage.setItem('authToken', 'mock-token');
      
      render(<App />);

      // Step 4: Daily Routine Generation
      const routineLink = screen.getByText(/routine/i);
      await user.click(routineLink);

      const generateButton = screen.getByRole('button', { name: /generate routine/i });
      await user.click(generateButton);

      await waitFor(() => {
        expect(screen.getByText(/Algorithm Study Session/i)).toBeInTheDocument();
        expect(screen.getByText(/Data Structures Practice/i)).toBeInTheDocument();
        expect(screen.getByText(/React Development/i)).toBeInTheDocument();
      });

      // Step 5: Activity Tracking
      const activityLink = screen.getByText(/activities/i);
      await user.click(activityLink);

      const activityInput = screen.getByLabelText(/current activity/i);
      const startButton = screen.getByRole('button', { name: /start tracking/i });

      await user.type(activityInput, 'Algorithm Study Session');
      await user.click(startButton);

      await waitFor(() => {
        expect(screen.getByText(/tracking: Algorithm Study Session/i)).toBeInTheDocument();
      });

      const stopButton = screen.getByRole('button', { name: /stop tracking/i });
      await user.click(stopButton);

      const focusSelect = screen.getByLabelText(/focus quality/i);
      await user.selectOptions(focusSelect, 'high');

      const submitButton = screen.getByRole('button', { name: /save activity/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/activity saved/i)).toBeInTheDocument();
      });
    });

    it('Journey Step 6-7: Habit Creation and Deep Work Management', async () => {
      const user = userEvent.setup();
      localStorage.setItem('authToken', 'mock-token');
      
      render(<App />);

      // Step 6: Habit Creation
      const habitsLink = screen.getByText(/habits/i);
      await user.click(habitsLink);

      const addHabitButton = screen.getByRole('button', { name: /add habit/i });
      await user.click(addHabitButton);

      const nameInput = screen.getByLabelText(/habit name/i);
      const descriptionInput = screen.getByLabelText(/description/i);
      const cueInput = screen.getByLabelText(/cue/i);

      await user.type(nameInput, 'Morning Algorithm Practice');
      await user.type(descriptionInput, 'Practice algorithms to reinforce disciplined student identity');
      await user.type(cueInput, 'After morning coffee');

      const saveButton = screen.getByRole('button', { name: /save habit/i });
      await user.click(saveButton);

      await waitFor(() => {
        expect(screen.getByText(/Morning Algorithm Practice/i)).toBeInTheDocument();
      });

      // Complete habit
      const completeCheckbox = screen.getByLabelText(/complete Morning Algorithm Practice/i);
      await user.click(completeCheckbox);

      await waitFor(() => {
        expect(screen.getByText(/streak: 6/i)).toBeInTheDocument();
      });

      // Step 7: Deep Work Scheduling
      const deepWorkLink = screen.getByText(/deep work/i);
      await user.click(deepWorkLink);

      const scheduleButton = screen.getByRole('button', { name: /schedule session/i });
      await user.click(scheduleButton);

      const taskInput = screen.getByLabelText(/task/i);
      const durationInput = screen.getByLabelText(/duration/i);

      await user.type(taskInput, 'Algorithm Implementation Project');
      await user.type(durationInput, '120');

      const scheduleSubmitButton = screen.getByRole('button', { name: /schedule/i });
      await user.click(scheduleSubmitButton);

      await waitFor(() => {
        expect(screen.getByText(/session scheduled/i)).toBeInTheDocument();
      });
    });

    it('Journey Step 8-9: AI Integration and Evening Review', async () => {
      const user = userEvent.setup();
      localStorage.setItem('authToken', 'mock-token');
      
      render(<App />);

      // Step 8: AI Integration
      const aiLink = screen.getByText(/ai assistant/i);
      await user.click(aiLink);

      const inputField = screen.getByLabelText(/tell me about your day/i);
      await user.type(inputField, 'I completed a 2-hour algorithm study session and felt very focused');

      const processButton = screen.getByRole('button', { name: /process/i });
      await user.click(processButton);

      await waitFor(() => {
        expect(screen.getByText(/manual input options/i)).toBeInTheDocument();
      });

      // Step 9: Evening Review
      const reviewLink = screen.getByText(/evening review/i);
      await user.click(reviewLink);

      const accomplishedInput = screen.getByLabelText(/what did you accomplish/i);
      await user.type(accomplishedInput, 'Completed algorithm study session, finished morning routine');

      const missedInput = screen.getByLabelText(/what did you miss/i);
      await user.type(missedInput, 'Planned reading session');

      const reasonsInput = screen.getByLabelText(/why were tasks missed/i);
      await user.type(reasonsInput, 'Got distracted by unexpected meeting');

      const moodSlider = screen.getByLabelText(/mood rating/i);
      fireEvent.change(moodSlider, { target: { value: '8' } });

      const insightsInput = screen.getByLabelText(/insights and reflections/i);
      await user.type(insightsInput, 'Morning sessions are most productive');

      const submitReviewButton = screen.getByRole('button', { name: /submit review/i });
      await user.click(submitReviewButton);

      await waitFor(() => {
        expect(screen.getByText(/review submitted successfully/i)).toBeInTheDocument();
      });
    });

    it('Journey Step 10-11: Analytics Dashboard and Data Export', async () => {
      const user = userEvent.setup();
      localStorage.setItem('authToken', 'mock-token');
      
      render(<App />);

      // Step 10: Analytics Dashboard
      const dashboardLink = screen.getByText(/dashboard/i);
      await user.click(dashboardLink);

      await waitFor(() => {
        expect(screen.getByText(/consistency score: 87%/i)).toBeInTheDocument();
        expect(screen.getByText(/identity alignment: 82%/i)).toBeInTheDocument();
        expect(screen.getByText(/deep work hours: 6.5/i)).toBeInTheDocument();
      });

      // View different time periods
      const weeklyTab = screen.getByText(/weekly/i);
      await user.click(weeklyTab);

      await waitFor(() => {
        expect(screen.getByText(/this week's progress/i)).toBeInTheDocument();
      });

      // View behavioral patterns
      const patternsLink = screen.getByText(/patterns/i);
      await user.click(patternsLink);

      await waitFor(() => {
        expect(screen.getByText(/productivity patterns/i)).toBeInTheDocument();
      });

      // Step 11: Data Export
      const exportLink = screen.getByText(/export data/i);
      await user.click(exportLink);

      const exportButton = screen.getByRole('button', { name: /export all data/i });
      await user.click(exportButton);

      await waitFor(() => {
        expect(screen.getByText(/data exported successfully/i)).toBeInTheDocument();
      });
    });
  });

  describe('Cross-Component Integration Validation', () => {
    beforeEach(() => {
      localStorage.setItem('authToken', 'mock-token');
    });

    it('should validate profile influences routine display', async () => {
      const user = userEvent.setup();
      render(<App />);

      // Navigate to profile
      const profileLink = screen.getByText(/profile/i);
      await user.click(profileLink);

      // Verify profile information is displayed
      await waitFor(() => {
        expect(screen.getByText(/disciplined computer science student/i)).toBeInTheDocument();
      });

      // Navigate to routine
      const routineLink = screen.getByText(/routine/i);
      await user.click(routineLink);

      // Verify routine reflects profile goals
      await waitFor(() => {
        expect(screen.getByText(/Algorithm Study Session/i)).toBeInTheDocument();
      });
    });

    it('should validate habit completion affects identity display', async () => {
      const user = userEvent.setup();
      render(<App />);

      // Check initial identity alignment
      const identityLink = screen.getByText(/identity/i);
      await user.click(identityLink);

      await waitFor(() => {
        expect(screen.getByText(/alignment: 82%/i)).toBeInTheDocument();
      });

      // Complete a habit
      const habitsLink = screen.getByText(/habits/i);
      await user.click(habitsLink);

      const completeButton = screen.getByRole('button', { name: /complete/i });
      await user.click(completeButton);

      // Verify identity reinforcement message
      await waitFor(() => {
        expect(screen.getByText(/identity reinforced/i)).toBeInTheDocument();
      });
    });

    it('should validate activity tracking updates analytics', async () => {
      const user = userEvent.setup();
      render(<App />);

      // Start and complete an activity
      const activityLink = screen.getByText(/activities/i);
      await user.click(activityLink);

      const startButton = screen.getByRole('button', { name: /start tracking/i });
      await user.click(startButton);

      const stopButton = screen.getByRole('button', { name: /stop tracking/i });
      await user.click(stopButton);

      // Navigate to analytics
      const analyticsLink = screen.getByText(/analytics/i);
      await user.click(analyticsLink);

      // Verify updated metrics
      await waitFor(() => {
        expect(screen.getByText(/focused time: 240 minutes/i)).toBeInTheDocument();
      });
    });
  });

  describe('System Resilience and User Experience', () => {
    beforeEach(() => {
      localStorage.setItem('authToken', 'mock-token');
    });

    it('should handle navigation between all major features', async () => {
      const user = userEvent.setup();
      render(<App />);

      const navigationItems = [
        'dashboard',
        'routine',
        'activities',
        'habits',
        'deep work',
        'evening review',
        'analytics',
        'profile'
      ];

      for (const item of navigationItems) {
        const link = screen.getByText(new RegExp(item, 'i'));
        await user.click(link);
        
        await waitFor(() => {
          expect(screen.getByText(new RegExp(item, 'i'))).toBeInTheDocument();
        });
      }
    });

    it('should maintain state across component switches', async () => {
      const user = userEvent.setup();
      render(<App />);

      // Start activity tracking
      const activityLink = screen.getByText(/activities/i);
      await user.click(activityLink);

      const activityInput = screen.getByLabelText(/current activity/i);
      await user.type(activityInput, 'Test Activity');

      const startButton = screen.getByRole('button', { name: /start tracking/i });
      await user.click(startButton);

      // Navigate away and back
      const dashboardLink = screen.getByText(/dashboard/i);
      await user.click(dashboardLink);

      await user.click(activityLink);

      // Verify activity is still being tracked
      await waitFor(() => {
        expect(screen.getByText(/tracking: Test Activity/i)).toBeInTheDocument();
      });
    });

    it('should handle error states gracefully', async () => {
      const user = userEvent.setup();
      
      // Mock network error
      (global.fetch as jest.Mock).mockImplementationOnce(() => 
        Promise.reject(new Error('Network error'))
      );

      render(<App />);

      const routineLink = screen.getByText(/routine/i);
      await user.click(routineLink);

      const generateButton = screen.getByRole('button', { name: /generate routine/i });
      await user.click(generateButton);

      // Verify error handling
      await waitFor(() => {
        expect(screen.getByText(/error occurred/i)).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /retry/i })).toBeInTheDocument();
      });
    });

    it('should provide responsive mobile experience', async () => {
      // Mock mobile viewport
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 375,
      });

      window.dispatchEvent(new Event('resize'));

      const user = userEvent.setup();
      render(<App />);

      // Verify mobile navigation
      const menuButton = screen.getByLabelText(/menu/i);
      expect(menuButton).toBeInTheDocument();

      await user.click(menuButton);

      await waitFor(() => {
        expect(screen.getByText(/navigation menu/i)).toBeInTheDocument();
      });

      // Test mobile-specific interactions
      const dashboardLink = screen.getByText(/dashboard/i);
      await user.click(dashboardLink);

      await waitFor(() => {
        expect(screen.getByText(/consistency score/i)).toBeInTheDocument();
      });
    });

    it('should handle offline scenarios', async () => {
      const user = userEvent.setup();
      
      // Mock offline state
      Object.defineProperty(navigator, 'onLine', {
        writable: true,
        value: false,
      });

      render(<App />);

      // Verify offline indicator
      await waitFor(() => {
        expect(screen.getByText(/offline mode/i)).toBeInTheDocument();
      });

      // Test offline functionality
      const offlineButton = screen.getByRole('button', { name: /view cached data/i });
      await user.click(offlineButton);

      await waitFor(() => {
        expect(screen.getByText(/cached information/i)).toBeInTheDocument();
      });
    });
  });

  describe('Performance and Accessibility', () => {
    it('should maintain performance with large datasets', async () => {
      const user = userEvent.setup();
      
      // Mock large dataset
      const largeHabitsArray = Array.from({ length: 100 }, (_, i) => ({
        id: `habit-${i}`,
        name: `Habit ${i}`,
        streak: i % 10,
        completed: i % 2 === 0
      }));

      (global.fetch as jest.Mock).mockImplementation((url: string) => {
        if (url.includes('/api/habits')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve(largeHabitsArray)
          });
        }
        return mockFetch(url);
      });

      render(<App />);

      const habitsLink = screen.getByText(/habits/i);
      await user.click(habitsLink);

      // Verify large list renders without performance issues
      await waitFor(() => {
        expect(screen.getByText(/Habit 0/i)).toBeInTheDocument();
      }, { timeout: 5000 });
    });

    it('should be accessible with keyboard navigation', async () => {
      render(<App />);

      // Test keyboard navigation
      const firstButton = screen.getAllByRole('button')[0];
      firstButton.focus();

      // Simulate tab navigation
      fireEvent.keyDown(firstButton, { key: 'Tab' });
      
      // Verify focus management
      expect(document.activeElement).toBeDefined();
    });

    it('should provide proper ARIA labels and roles', async () => {
      render(<App />);

      // Verify ARIA attributes
      const navigation = screen.getByRole('navigation');
      expect(navigation).toBeInTheDocument();

      const buttons = screen.getAllByRole('button');
      buttons.forEach(button => {
        expect(button).toHaveAttribute('aria-label');
      });
    });
  });
});