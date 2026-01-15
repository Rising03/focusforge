import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from '../../App';

// Mock API responses for integration testing
const mockApiResponses = {
  auth: {
    register: {
      token: 'mock-jwt-token',
      user: { id: '1', email: 'test@example.com', name: 'Test User' }
    },
    login: {
      token: 'mock-jwt-token',
      user: { id: '1', email: 'test@example.com', name: 'Test User' }
    }
  },
  profile: {
    id: '1',
    targetIdentity: 'disciplined student',
    academicGoals: ['Complete degree'],
    skillGoals: ['Learn programming'],
    wakeUpTime: '06:00',
    sleepTime: '22:00'
  },
  routine: {
    id: '1',
    date: new Date().toISOString().split('T')[0],
    segments: [
      {
        id: '1',
        timeSlot: { start: '06:00', end: '08:00' },
        type: 'deep_work',
        activity: 'Study Mathematics',
        duration: 120,
        priority: 'high',
        completed: false
      },
      {
        id: '2',
        timeSlot: { start: '14:00', end: '15:30' },
        type: 'skill_practice',
        activity: 'Programming Practice',
        duration: 90,
        priority: 'medium',
        completed: false
      }
    ]
  },
  habits: [
    {
      id: '1',
      name: 'Morning Review',
      description: 'Review daily goals',
      frequency: 'daily',
      streak: 5
    }
  ],
  analytics: {
    consistencyScore: 85,
    identityAlignment: 78,
    deepWorkHours: 4.5,
    habitStreaks: [{ habitId: '1', currentStreak: 5, longestStreak: 12 }]
  }
};

// Mock fetch for API calls
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
  
  // Habits endpoints
  if (url.includes('/api/habits') && method === 'GET') {
    return Promise.resolve({
      ok: true,
      json: () => Promise.resolve(mockApiResponses.habits)
    });
  }
  
  // Analytics endpoints
  if (url.includes('/api/analytics/dashboard') && method === 'GET') {
    return Promise.resolve({
      ok: true,
      json: () => Promise.resolve(mockApiResponses.analytics)
    });
  }
  
  // Default response
  return Promise.resolve({
    ok: true,
    json: () => Promise.resolve({})
  });
};

(global.fetch as jest.Mock).mockImplementation(mockFetch);

describe('Frontend Integration Tests - Complete User Flow', () => {
  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear();
    jest.clearAllMocks();
  });

  describe('User Registration and Onboarding Flow', () => {
    it('should complete full registration and profile setup flow', async () => {
      const user = userEvent.setup();
      render(<App />);

      // Step 1: Navigate to registration
      const registerLink = screen.getByText(/register/i);
      await user.click(registerLink);

      // Step 2: Fill registration form
      const emailInput = screen.getByLabelText(/email/i);
      const passwordInput = screen.getByLabelText(/password/i);
      const nameInput = screen.getByLabelText(/name/i);
      const registerButton = screen.getByRole('button', { name: /register/i });

      await user.type(emailInput, 'test@example.com');
      await user.type(passwordInput, 'SecurePassword123!');
      await user.type(nameInput, 'Test User');
      await user.click(registerButton);

      // Step 3: Verify successful registration and redirect to profile setup
      await waitFor(() => {
        expect(screen.getByText(/profile setup/i)).toBeInTheDocument();
      });

      // Step 4: Complete profile setup
      const identityInput = screen.getByLabelText(/target identity/i);
      const wakeTimeInput = screen.getByLabelText(/wake up time/i);
      const sleepTimeInput = screen.getByLabelText(/sleep time/i);
      const saveProfileButton = screen.getByRole('button', { name: /save profile/i });

      await user.type(identityInput, 'disciplined student');
      await user.type(wakeTimeInput, '06:00');
      await user.type(sleepTimeInput, '22:00');
      await user.click(saveProfileButton);

      // Step 5: Verify redirect to dashboard
      await waitFor(() => {
        expect(screen.getByText(/dashboard/i)).toBeInTheDocument();
      });
    });

    it('should handle detailed profile questionnaire flow', async () => {
      const user = userEvent.setup();
      
      // Mock authenticated state
      localStorage.setItem('authToken', 'mock-token');
      
      render(<App />);

      // Navigate to detailed profile setup
      const profileLink = screen.getByText(/profile/i);
      await user.click(profileLink);

      const detailedSetupButton = screen.getByText(/detailed setup/i);
      await user.click(detailedSetupButton);

      // Fill learning style
      const visualLearningRadio = screen.getByLabelText(/visual/i);
      await user.click(visualLearningRadio);

      // Fill productivity peaks
      const morningCheckbox = screen.getByLabelText(/morning/i);
      await user.click(morningCheckbox);

      // Fill environment preferences
      const libraryCheckbox = screen.getByLabelText(/library/i);
      await user.click(libraryCheckbox);

      // Submit detailed profile
      const submitButton = screen.getByRole('button', { name: /complete setup/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/profile updated successfully/i)).toBeInTheDocument();
      });
    });
  });

  describe('Daily Routine Management Flow', () => {
    beforeEach(() => {
      localStorage.setItem('authToken', 'mock-token');
    });

    it('should generate and display daily routine', async () => {
      const user = userEvent.setup();
      render(<App />);

      // Navigate to routine page
      const routineLink = screen.getByText(/routine/i);
      await user.click(routineLink);

      // Generate new routine
      const generateButton = screen.getByRole('button', { name: /generate routine/i });
      await user.click(generateButton);

      // Verify routine segments are displayed
      await waitFor(() => {
        expect(screen.getByText(/Study Mathematics/i)).toBeInTheDocument();
        expect(screen.getByText(/Programming Practice/i)).toBeInTheDocument();
      });

      // Mark segment as completed
      const completeButtons = screen.getAllByText(/complete/i);
      await user.click(completeButtons[0]);

      await waitFor(() => {
        expect(screen.getByText(/completed/i)).toBeInTheDocument();
      });
    });

    it('should handle routine adaptation based on performance', async () => {
      const user = userEvent.setup();
      render(<App />);

      // Navigate to routine page
      const routineLink = screen.getByText(/routine/i);
      await user.click(routineLink);

      // Access routine settings
      const settingsButton = screen.getByLabelText(/routine settings/i);
      await user.click(settingsButton);

      // Adjust complexity
      const complexitySlider = screen.getByLabelText(/complexity level/i);
      fireEvent.change(complexitySlider, { target: { value: '3' } });

      // Save settings
      const saveButton = screen.getByRole('button', { name: /save settings/i });
      await user.click(saveButton);

      await waitFor(() => {
        expect(screen.getByText(/settings updated/i)).toBeInTheDocument();
      });
    });
  });

  describe('Activity Tracking Flow', () => {
    beforeEach(() => {
      localStorage.setItem('authToken', 'mock-token');
    });

    it('should track activities with real-time updates', async () => {
      const user = userEvent.setup();
      render(<App />);

      // Navigate to activity tracker
      const activityLink = screen.getByText(/activities/i);
      await user.click(activityLink);

      // Start activity tracking
      const activityInput = screen.getByLabelText(/current activity/i);
      const startButton = screen.getByRole('button', { name: /start tracking/i });

      await user.type(activityInput, 'Study Mathematics');
      await user.click(startButton);

      // Verify tracking started
      await waitFor(() => {
        expect(screen.getByText(/tracking: Study Mathematics/i)).toBeInTheDocument();
        expect(screen.getByText(/00:00/i)).toBeInTheDocument(); // Timer display
      });

      // Stop tracking
      const stopButton = screen.getByRole('button', { name: /stop tracking/i });
      await user.click(stopButton);

      // Fill focus quality
      const focusSelect = screen.getByLabelText(/focus quality/i);
      await user.selectOptions(focusSelect, 'high');

      // Submit activity log
      const submitButton = screen.getByRole('button', { name: /save activity/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/activity saved/i)).toBeInTheDocument();
      });
    });

    it('should display activity history and statistics', async () => {
      const user = userEvent.setup();
      render(<App />);

      // Navigate to activity history
      const historyLink = screen.getByText(/activity history/i);
      await user.click(historyLink);

      // Verify history displays
      await waitFor(() => {
        expect(screen.getByText(/today's activities/i)).toBeInTheDocument();
      });

      // Switch to weekly view
      const weeklyTab = screen.getByText(/weekly/i);
      await user.click(weeklyTab);

      await waitFor(() => {
        expect(screen.getByText(/this week/i)).toBeInTheDocument();
      });
    });
  });

  describe('Habit Tracking Flow', () => {
    beforeEach(() => {
      localStorage.setItem('authToken', 'mock-token');
    });

    it('should create and track habits', async () => {
      const user = userEvent.setup();
      render(<App />);

      // Navigate to habits
      const habitsLink = screen.getByText(/habits/i);
      await user.click(habitsLink);

      // Create new habit
      const addHabitButton = screen.getByRole('button', { name: /add habit/i });
      await user.click(addHabitButton);

      // Fill habit form
      const nameInput = screen.getByLabelText(/habit name/i);
      const descriptionInput = screen.getByLabelText(/description/i);
      const cueInput = screen.getByLabelText(/cue/i);

      await user.type(nameInput, 'Morning Review');
      await user.type(descriptionInput, 'Review daily goals and priorities');
      await user.type(cueInput, 'After waking up');

      // Save habit
      const saveButton = screen.getByRole('button', { name: /save habit/i });
      await user.click(saveButton);

      // Verify habit appears in list
      await waitFor(() => {
        expect(screen.getByText(/Morning Review/i)).toBeInTheDocument();
      });

      // Mark habit as completed
      const completeCheckbox = screen.getByLabelText(/complete Morning Review/i);
      await user.click(completeCheckbox);

      await waitFor(() => {
        expect(screen.getByText(/streak: 6/i)).toBeInTheDocument(); // Incremented from mock data
      });
    });

    it('should display habit streaks and consistency metrics', async () => {
      const user = userEvent.setup();
      render(<App />);

      // Navigate to habit streaks
      const streaksLink = screen.getByText(/streaks/i);
      await user.click(streaksLink);

      // Verify streak displays
      await waitFor(() => {
        expect(screen.getByText(/current streak: 5/i)).toBeInTheDocument();
        expect(screen.getByText(/longest streak: 12/i)).toBeInTheDocument();
      });

      // Check consistency calendar
      const calendarView = screen.getByText(/calendar view/i);
      await user.click(calendarView);

      await waitFor(() => {
        expect(screen.getByText(/habit calendar/i)).toBeInTheDocument();
      });
    });
  });

  describe('Evening Review Flow', () => {
    beforeEach(() => {
      localStorage.setItem('authToken', 'mock-token');
    });

    it('should complete evening review process', async () => {
      const user = userEvent.setup();
      render(<App />);

      // Navigate to evening review
      const reviewLink = screen.getByText(/evening review/i);
      await user.click(reviewLink);

      // Fill accomplished tasks
      const accomplishedInput = screen.getByLabelText(/what did you accomplish/i);
      await user.type(accomplishedInput, 'Completed math study session, finished morning routine');

      // Fill missed tasks
      const missedInput = screen.getByLabelText(/what did you miss/i);
      await user.type(missedInput, 'Planned reading session');

      // Fill reasons
      const reasonsInput = screen.getByLabelText(/why were tasks missed/i);
      await user.type(reasonsInput, 'Got distracted by unexpected meeting');

      // Set mood and energy
      const moodSlider = screen.getByLabelText(/mood rating/i);
      fireEvent.change(moodSlider, { target: { value: '8' } });

      const energySlider = screen.getByLabelText(/energy level/i);
      fireEvent.change(energySlider, { target: { value: '7' } });

      // Add insights
      const insightsInput = screen.getByLabelText(/insights and reflections/i);
      await user.type(insightsInput, 'Need to block time more effectively');

      // Submit review
      const submitButton = screen.getByRole('button', { name: /submit review/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/review submitted successfully/i)).toBeInTheDocument();
      });
    });
  });

  describe('Analytics Dashboard Flow', () => {
    beforeEach(() => {
      localStorage.setItem('authToken', 'mock-token');
    });

    it('should display comprehensive analytics', async () => {
      const user = userEvent.setup();
      render(<App />);

      // Navigate to dashboard
      const dashboardLink = screen.getByText(/dashboard/i);
      await user.click(dashboardLink);

      // Verify key metrics are displayed
      await waitFor(() => {
        expect(screen.getByText(/consistency score: 85%/i)).toBeInTheDocument();
        expect(screen.getByText(/identity alignment: 78%/i)).toBeInTheDocument();
        expect(screen.getByText(/deep work hours: 4.5/i)).toBeInTheDocument();
      });

      // Switch to different time periods
      const weeklyTab = screen.getByText(/weekly/i);
      await user.click(weeklyTab);

      await waitFor(() => {
        expect(screen.getByText(/this week's progress/i)).toBeInTheDocument();
      });

      const monthlyTab = screen.getByText(/monthly/i);
      await user.click(monthlyTab);

      await waitFor(() => {
        expect(screen.getByText(/this month's progress/i)).toBeInTheDocument();
      });
    });

    it('should display behavioral patterns and insights', async () => {
      const user = userEvent.setup();
      render(<App />);

      // Navigate to patterns
      const patternsLink = screen.getByText(/patterns/i);
      await user.click(patternsLink);

      // Verify pattern visualizations
      await waitFor(() => {
        expect(screen.getByText(/productivity patterns/i)).toBeInTheDocument();
        expect(screen.getByText(/temporal patterns/i)).toBeInTheDocument();
      });

      // Check personalization insights
      const insightsTab = screen.getByText(/insights/i);
      await user.click(insightsTab);

      await waitFor(() => {
        expect(screen.getByText(/personalization insights/i)).toBeInTheDocument();
      });
    });
  });

  describe('AI Integration Flow', () => {
    beforeEach(() => {
      localStorage.setItem('authToken', 'mock-token');
    });

    it('should handle natural language input with AI processing', async () => {
      const user = userEvent.setup();
      render(<App />);

      // Navigate to AI assistant
      const aiLink = screen.getByText(/ai assistant/i);
      await user.click(aiLink);

      // Enter natural language input
      const inputField = screen.getByLabelText(/tell me about your day/i);
      await user.type(inputField, 'I studied math for 2 hours and felt very focused');

      // Submit input
      const submitButton = screen.getByRole('button', { name: /process/i });
      await user.click(submitButton);

      // Verify AI response
      await waitFor(() => {
        expect(screen.getByText(/great job on your focused study session/i)).toBeInTheDocument();
      });
    });

    it('should fallback to manual input when AI fails', async () => {
      const user = userEvent.setup();
      
      // Mock AI failure
      (global.fetch as jest.Mock).mockImplementationOnce(() => 
        Promise.resolve({
          ok: false,
          status: 500
        })
      );

      render(<App />);

      // Navigate to AI assistant
      const aiLink = screen.getByText(/ai assistant/i);
      await user.click(aiLink);

      // Enter input that will fail AI processing
      const inputField = screen.getByLabelText(/tell me about your day/i);
      await user.type(inputField, 'Complex input that AI cannot process');

      const submitButton = screen.getByRole('button', { name: /process/i });
      await user.click(submitButton);

      // Verify fallback to manual input
      await waitFor(() => {
        expect(screen.getByText(/manual input options/i)).toBeInTheDocument();
      });
    });
  });

  describe('Mobile Responsiveness', () => {
    it('should adapt to mobile viewport', async () => {
      // Mock mobile viewport
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 375,
      });
      Object.defineProperty(window, 'innerHeight', {
        writable: true,
        configurable: true,
        value: 667,
      });

      window.dispatchEvent(new Event('resize'));

      const user = userEvent.setup();
      render(<App />);

      // Verify mobile navigation
      const menuButton = screen.getByLabelText(/menu/i);
      expect(menuButton).toBeInTheDocument();

      await user.click(menuButton);

      // Verify mobile menu opens
      await waitFor(() => {
        expect(screen.getByText(/navigation menu/i)).toBeInTheDocument();
      });
    });

    it('should maintain functionality on touch devices', async () => {
      const user = userEvent.setup();
      render(<App />);

      // Test touch interactions
      const touchButton = screen.getByRole('button', { name: /start tracking/i });
      
      // Simulate touch events
      fireEvent.touchStart(touchButton);
      fireEvent.touchEnd(touchButton);

      // Verify touch interaction works
      await waitFor(() => {
        expect(screen.getByText(/tracking started/i)).toBeInTheDocument();
      });
    });
  });

  describe('Error Handling and Recovery', () => {
    it('should handle network errors gracefully', async () => {
      const user = userEvent.setup();
      
      // Mock network error
      (global.fetch as jest.Mock).mockImplementationOnce(() => 
        Promise.reject(new Error('Network error'))
      );

      render(<App />);

      // Attempt action that will fail
      const generateButton = screen.getByRole('button', { name: /generate routine/i });
      await user.click(generateButton);

      // Verify error handling
      await waitFor(() => {
        expect(screen.getByText(/network error occurred/i)).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /retry/i })).toBeInTheDocument();
      });
    });

    it('should recover from authentication errors', async () => {
      const user = userEvent.setup();
      
      // Mock auth error
      (global.fetch as jest.Mock).mockImplementationOnce(() => 
        Promise.resolve({
          ok: false,
          status: 401,
          json: () => Promise.resolve({ error: 'Unauthorized' })
        })
      );

      localStorage.setItem('authToken', 'expired-token');
      render(<App />);

      // Attempt authenticated action
      const profileLink = screen.getByText(/profile/i);
      await user.click(profileLink);

      // Verify redirect to login
      await waitFor(() => {
        expect(screen.getByText(/please log in/i)).toBeInTheDocument();
      });
    });
  });
});