import React, { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { AppState, AppStateStatus } from 'react-native';
import RootNavigator from './src/navigation/RootNavigator';
import { setupEventSourcePolyfill } from './src/utils/eventSourcePolyfill';
import { realtimeNotifications } from './src/services/realtimeNotificationService';

// Enhanced EventSource polyfill setup
const polyfillSuccess = setupEventSourcePolyfill();
if (!polyfillSuccess) {
  console.error('❌ EventSource polyfill setup failed. SSE timer will not work.');
}

export default function App() {
  useEffect(() => {
    // Initialize notification service
    realtimeNotifications.initialize();
    
    // Handle app state changes (background/foreground)
    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      if (nextAppState === 'active') {
        // Resume polling when app comes to foreground
        realtimeNotifications.resumePolling();
      } else {
        // Stop polling when app goes to background
        realtimeNotifications.stopPolling();
      }
    };
    
    const subscription = AppState.addEventListener('change', handleAppStateChange);
    
    return () => {
      subscription.remove();
      realtimeNotifications.cleanup();
    };
  }, []);

  return (
    <>
      <RootNavigator />
      <StatusBar style="auto" />
    </>
  );
}
