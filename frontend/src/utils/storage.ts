// Simple storage utility for persisting application state
export class StorageManager {
  private static readonly KEYS = {
    USER_PROFILE: 'userProfile',
    APP_PREFERENCES: 'appPreferences',
    DASHBOARD_STATE: 'dashboardState',
    FOCUS_SESSIONS: 'focusSessions',
  } as const;

  // User Profile Storage
  static saveUserProfile(profile: any): void {
    try {
      localStorage.setItem(this.KEYS.USER_PROFILE, JSON.stringify(profile));
      console.log('✅ User profile saved to storage');
    } catch (error) {
      console.error('❌ Failed to save user profile:', error);
    }
  }

  static getUserProfile(): any | null {
    try {
      const stored = localStorage.getItem(this.KEYS.USER_PROFILE);
      return stored ? JSON.parse(stored) : null;
    } catch (error) {
      console.error('❌ Failed to load user profile:', error);
      return null;
    }
  }

  static clearUserProfile(): void {
    try {
      localStorage.removeItem(this.KEYS.USER_PROFILE);
      console.log('🗑️ User profile cleared from storage');
    } catch (error) {
      console.error('❌ Failed to clear user profile:', error);
    }
  }

  // App Preferences Storage
  static saveAppPreferences(preferences: any): void {
    try {
      localStorage.setItem(this.KEYS.APP_PREFERENCES, JSON.stringify(preferences));
      console.log('✅ App preferences saved to storage');
    } catch (error) {
      console.error('❌ Failed to save app preferences:', error);
    }
  }

  static getAppPreferences(): any | null {
    try {
      const stored = localStorage.getItem(this.KEYS.APP_PREFERENCES);
      return stored ? JSON.parse(stored) : null;
    } catch (error) {
      console.error('❌ Failed to load app preferences:', error);
      return null;
    }
  }

  // Dashboard State Storage
  static saveDashboardState(state: any): void {
    try {
      localStorage.setItem(this.KEYS.DASHBOARD_STATE, JSON.stringify(state));
    } catch (error) {
      console.error('❌ Failed to save dashboard state:', error);
    }
  }

  static getDashboardState(): any | null {
    try {
      const stored = localStorage.getItem(this.KEYS.DASHBOARD_STATE);
      return stored ? JSON.parse(stored) : null;
    } catch (error) {
      console.error('❌ Failed to load dashboard state:', error);
      return null;
    }
  }

  // Focus Sessions Storage
  static saveFocusSession(session: any): void {
    try {
      const sessions = this.getFocusSessions() || [];
      sessions.push({ ...session, timestamp: new Date().toISOString() });
      localStorage.setItem(this.KEYS.FOCUS_SESSIONS, JSON.stringify(sessions));
      console.log('✅ Focus session saved to storage');
    } catch (error) {
      console.error('❌ Failed to save focus session:', error);
    }
  }

  static getFocusSessions(): any[] {
    try {
      const stored = localStorage.getItem(this.KEYS.FOCUS_SESSIONS);
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('❌ Failed to load focus sessions:', error);
      return [];
    }
  }

  // Clear all data (for logout)
  static clearAllData(): void {
    try {
      Object.values(this.KEYS).forEach(key => {
        localStorage.removeItem(key);
      });
      console.log('🗑️ All application data cleared from storage');
    } catch (error) {
      console.error('❌ Failed to clear application data:', error);
    }
  }

  // Check if user has any stored data
  static hasUserData(): boolean {
    return this.getUserProfile() !== null;
  }
}