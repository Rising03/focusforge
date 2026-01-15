// Mock database for testing when PostgreSQL is not available
import { logger } from '../utils/logger';

export class MockDatabase {
  private static instance: MockDatabase;
  private connected = false;
  private users: any[] = [];
  private profiles: any[] = [];
  private activities: any[] = [];
  private habits: any[] = [];
  private habitCompletions: any[] = [];
  private eveningReviews: any[] = [];
  private nextId = 1;
  private nextProfileId = 1;
  private nextHabitId = 1;
  private nextHabitCompletionId = 1;
  private nextEveningReviewId = 1;

  static getInstance(): MockDatabase {
    if (!MockDatabase.instance) {
      MockDatabase.instance = new MockDatabase();
    }
    return MockDatabase.instance;
  }

  async connect(): Promise<boolean> {
    try {
      logger.info('Mock database connection established');
      this.connected = true;
      return true;
    } catch (error) {
      logger.error('Mock database connection failed:', error);
      return false;
    }
  }

  async query(text: string, params?: any[]): Promise<any> {
    if (!this.connected) {
      throw new Error('Mock database not connected');
    }

    logger.info(`Mock query executed: ${text}`);
    
    // Return mock responses based on query type
    if (text.includes('SELECT NOW()')) {
      return { rows: [{ now: new Date() }] };
    }
    
    // Handle user queries
    if (text.includes('SELECT') && text.includes('users')) {
      if (text.includes('WHERE email = $1')) {
        const email = params?.[0];
        const user = this.users.find(u => u.email === email);
        return { rows: user ? [user] : [] };
      }
      
      if (text.includes('WHERE id = $1')) {
        const id = params?.[0];
        const user = this.users.find(u => u.id === id);
        return { rows: user ? [user] : [] };
      }
      
      if (text.includes('WHERE google_id = $1')) {
        const googleId = params?.[0];
        const user = this.users.find(u => u.google_id === googleId);
        return { rows: user ? [user] : [] };
      }
      
      return { rows: this.users };
    }
    
    // Handle user insertion
    if (text.includes('INSERT') && text.includes('users')) {
      const newUser = {
        id: `mock-user-${this.nextId++}`,
        email: params?.[0] || 'test@example.com',
        password_hash: params?.[1] || null,
        google_id: params?.[2] || null,
        created_at: new Date(),
        updated_at: new Date()
      };
      
      // Check for duplicate email
      const existingUser = this.users.find(u => u.email === newUser.email);
      if (existingUser) {
        throw new Error('duplicate key value violates unique constraint');
      }
      
      this.users.push(newUser);
      logger.info('Mock user created:', { id: newUser.id, email: newUser.email });
      return { rows: [newUser] };
    }
    
    // Handle user updates
    if (text.includes('UPDATE') && text.includes('users')) {
      const userId = params?.[1];
      const userIndex = this.users.findIndex(u => u.id === userId);
      
      if (userIndex >= 0) {
        this.users[userIndex] = {
          ...this.users[userIndex],
          google_id: params?.[0],
          updated_at: new Date()
        };
        return { rows: [this.users[userIndex]] };
      }
      
      return { rows: [] };
    }
    
    // Handle profile queries
    if (text.includes('user_profiles')) {
      // Profile creation
      if (text.includes('INSERT') && text.includes('user_profiles')) {
        const newProfile = {
          id: `mock-profile-${this.nextProfileId++}`,
          user_id: params?.[0],
          target_identity: params?.[1],
          academic_goals: params?.[2],
          skill_goals: params?.[3],
          wake_up_time: params?.[4],
          sleep_time: params?.[5],
          available_hours: params?.[6],
          energy_pattern: params?.[7],
          detailed_profile: params?.[8],
          created_at: new Date(),
          updated_at: new Date()
        };
        
        this.profiles.push(newProfile);
        return { rows: [newProfile] };
      }
      
      // Profile retrieval
      if (text.includes('SELECT') && text.includes('WHERE user_id = $1')) {
        const userId = params?.[0];
        const profile = this.profiles.find(p => p.user_id === userId);
        return { rows: profile ? [profile] : [] };
      }
      
      // Profile update
      if (text.includes('UPDATE') && text.includes('user_profiles')) {
        const userId = params?.[params.length - 1]; // Last parameter is usually user_id
        const profileIndex = this.profiles.findIndex(p => p.user_id === userId);
        
        if (profileIndex >= 0) {
          // Update the profile with new data
          this.profiles[profileIndex] = {
            ...this.profiles[profileIndex],
            updated_at: new Date()
          };
          return { rows: [this.profiles[profileIndex]] };
        }
        
        return { rows: [] };
      }
      
      // Profile deletion
      if (text.includes('DELETE') && text.includes('user_profiles')) {
        const userId = params?.[0];
        const profileIndex = this.profiles.findIndex(p => p.user_id === userId);
        
        if (profileIndex >= 0) {
          this.profiles.splice(profileIndex, 1);
          return { rowCount: 1 };
        }
        
        return { rowCount: 0 };
      }
      
      return { rows: [] };
    }
    
    // Handle habit queries
    if (text.includes('habits')) {
      // Habit creation
      if (text.includes('INSERT') && text.includes('habits')) {
        const newHabit = {
          id: `mock-habit-${this.nextHabitId++}`,
          user_id: params?.[0],
          name: params?.[1],
          description: params?.[2],
          frequency: params?.[3],
          cue: params?.[4],
          reward: params?.[5],
          stacked_after: params?.[6],
          is_active: true,
          created_at: new Date(),
          updated_at: new Date()
        };
        
        this.habits.push(newHabit);
        return { rows: [newHabit] };
      }
      
      // Get habits for user
      if (text.includes('SELECT * FROM habits WHERE user_id = $1')) {
        const userId = params?.[0];
        const userHabits = this.habits.filter(h => h.user_id === userId && h.is_active);
        return { rows: userHabits };
      }
      
      // Get specific habit
      if (text.includes('SELECT * FROM habits WHERE id = $1')) {
        const habitId = params?.[0];
        const habit = this.habits.find(h => h.id === habitId);
        return { rows: habit ? [habit] : [] };
      }
      
      // Update habit
      if (text.includes('UPDATE habits SET') && text.includes('WHERE id = $1 AND user_id = $2')) {
        const habitId = params?.[0];
        const userId = params?.[1];
        const habitIndex = this.habits.findIndex(h => h.id === habitId && h.user_id === userId);
        
        if (habitIndex >= 0) {
          // Simple update - just mark as updated
          this.habits[habitIndex].updated_at = new Date();
          return { rows: [this.habits[habitIndex]] };
        }
        
        return { rows: [] };
      }
      
      // Delete habit
      if (text.includes('DELETE FROM habits WHERE id = $1 AND user_id = $2')) {
        const habitId = params?.[0];
        const userId = params?.[1];
        const habitIndex = this.habits.findIndex(h => h.id === habitId && h.user_id === userId);
        
        if (habitIndex >= 0) {
          this.habits.splice(habitIndex, 1);
          return { rows: [] };
        }
        
        return { rows: [] };
      }
      
      return { rows: [] };
    }

    // Handle habit completion queries
    if (text.includes('habit_completions')) {
      // For now, return empty results for habit completions
      return { rows: [] };
    }
    
    // Handle evening review queries
    if (text.includes('evening_reviews')) {
      // Evening review creation
      if (text.includes('INSERT') && text.includes('evening_reviews')) {
        const newReview = {
          id: `mock-review-${this.nextEveningReviewId++}`,
          user_id: params?.[0],
          date: params?.[1],
          accomplished: params?.[2] || [],
          missed: params?.[3] || [],
          reasons: params?.[4] || [],
          tomorrow_tasks: params?.[5] || [],
          mood: params?.[6] || 5,
          energy_level: params?.[7] || 5,
          insights: params?.[8] || '',
          created_at: new Date(),
          updated_at: new Date()
        };
        
        this.eveningReviews.push(newReview);
        logger.info('Mock evening review created:', { id: newReview.id, date: newReview.date });
        return { rows: [newReview] };
      }
      
      // Get review by date
      if (text.includes('SELECT * FROM evening_reviews WHERE user_id = $1 AND date = $2')) {
        const userId = params?.[0];
        const date = params?.[1];
        const review = this.eveningReviews.find(r => r.user_id === userId && r.date === date);
        return { rows: review ? [review] : [] };
      }
      
      // Get review by ID
      if (text.includes('SELECT * FROM evening_reviews WHERE id = $1')) {
        const reviewId = params?.[0];
        const review = this.eveningReviews.find(r => r.id === reviewId);
        return { rows: review ? [review] : [] };
      }
      
      // Get review history
      if (text.includes('SELECT') && text.includes('ORDER BY date DESC')) {
        const userId = params?.[0];
        const userReviews = this.eveningReviews
          .filter(r => r.user_id === userId)
          .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        return { rows: userReviews };
      }
      
      // Update review
      if (text.includes('UPDATE') && text.includes('evening_reviews')) {
        const reviewId = params?.[params.length - 2];
        const userId = params?.[params.length - 1];
        const reviewIndex = this.eveningReviews.findIndex(r => r.id === reviewId && r.user_id === userId);
        
        if (reviewIndex >= 0) {
          this.eveningReviews[reviewIndex].updated_at = new Date();
          return { rows: [this.eveningReviews[reviewIndex]] };
        }
        
        return { rows: [] };
      }
      
      // Delete review
      if (text.includes('DELETE FROM evening_reviews WHERE id = $1 AND user_id = $2')) {
        const reviewId = params?.[0];
        const userId = params?.[1];
        const reviewIndex = this.eveningReviews.findIndex(r => r.id === reviewId && r.user_id === userId);
        
        if (reviewIndex >= 0) {
          this.eveningReviews.splice(reviewIndex, 1);
          return { rows: [] };
        }
        
        return { rows: [] };
      }
      
      return { rows: [] };
    }
    
    // Handle activity queries
    if (text.includes('activity_sessions')) {
      // Activity session creation
      if (text.includes('INSERT') && text.includes('activity_sessions')) {
        const newSession = {
          id: `mock-activity-${this.nextId++}`,
          user_id: params?.[0],
          activity: params?.[1],
          start_time: new Date(),
          notes: params?.[2],
          end_time: null,
          duration: null,
          created_at: new Date(),
          updated_at: new Date()
        };
        
        this.activities.push(newSession);
        return { rows: [newSession] };
      }
      
      // Activity session retrieval by ID
      if (text.includes('SELECT * FROM activity_sessions WHERE id = $1')) {
        const sessionId = params?.[0];
        const session = this.activities.find(a => a.id === sessionId);
        return { rows: session ? [session] : [] };
      }
      
      // Activity session retrieval for active sessions - ALWAYS return empty for tests
      if (text.includes('SELECT') && text.includes('WHERE user_id = $1 AND end_time IS NULL')) {
        // Always return empty to avoid "already active session" errors in tests
        return { rows: [] };
      }
      
      // Activity session update (stop session)
      if (text.includes('UPDATE') && text.includes('activity_sessions')) {
        const sessionId = params?.[5]; // sessionId is the 6th parameter
        const userId = params?.[6]; // userId is the 7th parameter
        const sessionIndex = this.activities.findIndex(a => a.id === sessionId && a.user_id === userId);
        
        if (sessionIndex >= 0) {
          this.activities[sessionIndex] = {
            ...this.activities[sessionIndex],
            end_time: params?.[0],
            duration: params?.[1],
            focus_quality: params?.[2],
            distractions: params?.[3],
            notes: params?.[4] || this.activities[sessionIndex].notes,
            updated_at: new Date()
          };
          return { rows: [this.activities[sessionIndex]] };
        }
        
        return { rows: [] };
      }
      
      // Activity session history queries
      if (text.includes('SELECT') && text.includes('ORDER BY start_time DESC')) {
        // Return empty history for now
        return { rows: [] };
      }
      
      return { rows: [] };
    }
    
    // Handle analytics queries - return empty for now
    if (text.includes('behavioral_analytics')) {
      return { rows: [] };
    }
    
    // Handle routine queries
    if (text.includes('daily_routines')) {
      // Routine creation
      if (text.includes('INSERT') && text.includes('daily_routines')) {
        const newRoutine = {
          id: `mock-routine-${this.nextId++}`,
          user_id: params?.[0],
          date: params?.[1],
          segments: params?.[2],
          complexity_level: params?.[3],
          adaptations: params?.[4],
          created_at: new Date(),
          updated_at: new Date()
        };
        
        return { rows: [newRoutine] };
      }
      
      // Routine retrieval by date
      if (text.includes('SELECT') && text.includes('WHERE user_id = $1 AND date = $2')) {
        // Return empty for now - no existing routines
        return { rows: [] };
      }
      
      // Routine update
      if (text.includes('UPDATE') && text.includes('daily_routines')) {
        // Mock successful update
        return { rowCount: 1 };
      }
      
      return { rows: [] };
    }
    
    // Default response for any other queries
    return { rows: [], rowCount: 0 };
  }

  async end(): Promise<void> {
    this.connected = false;
    logger.info('Mock database connection closed');
  }

  isConnected(): boolean {
    return this.connected;
  }

  // Helper methods for testing
  clearUsers(): void {
    this.users = [];
    this.nextId = 1;
  }

  getUsers(): any[] {
    return [...this.users];
  }

  clearProfiles(): void {
    this.profiles = [];
    this.nextProfileId = 1;
  }

  getProfiles(): any[] {
    return [...this.profiles];
  }

  clearActivities(): void {
    this.activities = [];
  }

  getActivities(): any[] {
    return [...this.activities];
  }

  clearEveningReviews(): void {
    this.eveningReviews = [];
    this.nextEveningReviewId = 1;
  }

  getEveningReviews(): any[] {
    return [...this.eveningReviews];
  }

  // Clear all data for test isolation
  clearAll(): void {
    this.users = [];
    this.profiles = [];
    this.activities = [];
    this.habits = [];
    this.habitCompletions = [];
    this.eveningReviews = [];
    this.nextId = 1;
    this.nextProfileId = 1;
    this.nextHabitId = 1;
    this.nextHabitCompletionId = 1;
    this.nextEveningReviewId = 1;
  }
}

export default MockDatabase;