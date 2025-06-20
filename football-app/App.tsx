import React from 'react';
import { StatusBar } from 'expo-status-bar';
import RootNavigator from './src/navigation/RootNavigator';
import { setupEventSourcePolyfill } from './src/utils/eventSourcePolyfill';

// Enhanced EventSource polyfill setup
const polyfillSuccess = setupEventSourcePolyfill();
if (!polyfillSuccess) {
  console.error('❌ EventSource polyfill setup failed. SSE timer will not work.');
}

export default function App() {
  return (
    <>
      <RootNavigator />
      <StatusBar style="auto" />
    </>
  );
}
