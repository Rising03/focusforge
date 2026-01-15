import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { UserProfile } from '../types/profile';
import { authService } from '../services/authService';
import { StorageManager } from '../utils/storage';

// App State Types
export type AppState = 'loading' | 'unauthenticated' | 'authenticated' | 'focus_mode';

export interface AppContextState {
  appState: AppState;
  userProfile: UserProfile | null;
  error: string | null;
  isLoading: boolean;
}

// Action Types
export type AppAction =
  | { type: 'SET_APP_STATE'; payload: AppState }
  | { type: 'SET_USER_PROFILE'; payload: UserProfile | null }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'CLEAR_ERROR' }
  | { type: 'LOGOUT' };

// Initial State
const initialState: AppContextState = {
  appState: 'loading',
  userProfile: null,
  error: null,
  isLoading: false,
};

// Reducer
function appReducer(state: AppContextState, action: AppAction): AppContextState {
  switch (action.type) {
    case 'SET_APP_STATE':
      return { ...state, appState: action.payload };
    case 'SET_USER_PROFILE':
      return { ...state, userProfile: action.payload };
    case 'SET_ERROR':
      return { ...state, error: action.payload };
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
    case 'CLEAR_ERROR':
      return { ...state, error: null };
    case 'LOGOUT':
      return { ...initialState, appState: 'unauthenticated' };
    default:
      return state;
  }
}

// Context
const AppContext = createContext<{
  state: AppContextState;
  dispatch: React.Dispatch<AppAction>;
  actions: {
    setAppState: (state: AppState) => void;
    setUserProfile: (profile: UserProfile | null) => void;
    setError: (error: string | null) => void;
    clearError: () => void;
    logout: () => void;
    enterFocusMode: () => void;
    exitFocusMode: () => void;
  };
} | null>(null);

// Provider Component
export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(appReducer, initialState);

  console.log('🏗️ AppProvider is initializing...');

  // Action creators
  const actions = {
    setAppState: (appState: AppState) => dispatch({ type: 'SET_APP_STATE', payload: appState }),
    setUserProfile: (profile: UserProfile | null) => dispatch({ type: 'SET_USER_PROFILE', payload: profile }),
    setError: (error: string | null) => dispatch({ type: 'SET_ERROR', payload: error }),
    clearError: () => dispatch({ type: 'CLEAR_ERROR' }),
    logout: () => {
      try {
        console.log('🚪 Logging out user...');
        authService.logout();
        StorageManager.clearAllData();
        dispatch({ type: 'LOGOUT' });
      } catch (error) {
        console.error('Error during logout:', error);
      }
    },
    enterFocusMode: () => dispatch({ type: 'SET_APP_STATE', payload: 'focus_mode' }),
    exitFocusMode: () => dispatch({ type: 'SET_APP_STATE', payload: 'authenticated' }),
  };

  // Initialize app state on mount
  useEffect(() => {
    const initializeApp = async () => {
      console.log('🚀 Initializing app...');
      try {
        // Check for OAuth tokens in URL parameters
        const urlParams = new URLSearchParams(window.location.search);
        const token = urlParams.get('token');
        const refreshToken = urlParams.get('refresh');
        const error = urlParams.get('error');
        
        if (error) {
          console.log('❌ OAuth error found in URL:', error);
          actions.setError(decodeURIComponent(error));
          window.history.replaceState({}, document.title, window.location.pathname);
          actions.setAppState('unauthenticated');
          return;
        }
        
        if (token && refreshToken) {
          console.log('🔑 OAuth tokens found in URL');
          localStorage.setItem('accessToken', token);
          localStorage.setItem('refreshToken', refreshToken);
          window.history.replaceState({}, document.title, window.location.pathname);
          actions.setAppState('authenticated');
          return;
        }
        
        // Check if user is already authenticated
        const isAuthenticated = authService.isAuthenticated();
        console.log('🔐 Authentication check result:', isAuthenticated);
        
        if (isAuthenticated) {
          // Load stored user profile if available
          const storedProfile = StorageManager.getUserProfile();
          console.log('👤 Stored profile found:', !!storedProfile);
          if (storedProfile) {
            actions.setUserProfile(storedProfile);
          }
          actions.setAppState('authenticated');
        } else {
          actions.setAppState('unauthenticated');
        }
      } catch (error) {
        console.error('❌ Error initializing app:', error);
        actions.setError('Failed to initialize application');
        actions.setAppState('unauthenticated');
      }
    };

    // Add a small delay to show loading state
    const timer = setTimeout(initializeApp, 1000);
    return () => clearTimeout(timer);
  }, []);

  // Save user profile to storage when it changes
  useEffect(() => {
    if (state.userProfile) {
      console.log('💾 Saving user profile to storage');
      try {
        StorageManager.saveUserProfile(state.userProfile);
      } catch (error) {
        console.error('Error saving user profile:', error);
      }
    }
  }, [state.userProfile]);

  console.log('🎯 AppProvider rendering with state:', state.appState);

  return (
    <AppContext.Provider value={{ state, dispatch, actions }}>
      {children}
    </AppContext.Provider>
  );
};

// Hook to use the context
export const useAppContext = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
};