import React from 'react';
import { StatusBar } from 'expo-status-bar';
import RootNavigator from './src/navigation/RootNavigator';

// Polyfill for EventSource in React Native
// This enables Server-Sent Events (SSE) support
try {
  const RNEventSource = require('react-native-event-source').default;
  global.EventSource = RNEventSource;
  console.log('✅ EventSource polyfill loaded successfully');
} catch (error) {
  console.warn('⚠️ EventSource polyfill not available. SSE timer will not work.');
  console.warn('Please run: npm install react-native-event-source');
}

export default function App() {
  return (
    <>
      <RootNavigator />
      <StatusBar style="auto" />
    </>
  );
}
