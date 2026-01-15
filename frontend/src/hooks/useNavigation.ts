import { useCallback } from 'react';
import { useAppContext } from '../contexts/AppContext';

export const useNavigation = () => {
  const { state, actions } = useAppContext();

  const navigateToFocus = useCallback(() => {
    console.log('🎯 Navigating to Focus Mode');
    actions.enterFocusMode();
  }, [actions]);

  const navigateToDashboard = useCallback(() => {
    console.log('📊 Navigating to Dashboard');
    actions.exitFocusMode();
  }, [actions]);

  const logout = useCallback(() => {
    console.log('🚪 Logging out');
    actions.logout();
  }, [actions]);

  const isInFocusMode = state.appState === 'focus_mode';
  const isAuthenticated = state.appState === 'authenticated' || state.appState === 'focus_mode';

  return {
    navigateToFocus,
    navigateToDashboard,
    logout,
    isInFocusMode,
    isAuthenticated,
    currentState: state.appState,
    userProfile: state.userProfile,
    error: state.error,
  };
};