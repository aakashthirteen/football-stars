import React, { useEffect } from 'react';
import { View, Text } from 'react-native';
import { FeatureFlags } from '../config/featureFlags';

export const TimerDebugComponent = () => {
  useEffect(() => {
    console.log('🔥 DEBUG COMPONENT: Feature flags loaded:', {
      USE_GLOBAL_TIMER_MANAGER: FeatureFlags.USE_GLOBAL_TIMER_MANAGER,
      TIMER_DEBUG_LOGS: FeatureFlags.TIMER_DEBUG_LOGS
    });
  }, []);

  return (
    <View style={{ position: 'absolute', top: 100, left: 20, backgroundColor: 'red', padding: 10, zIndex: 9999 }}>
      <Text style={{ color: 'white', fontSize: 12 }}>
        Global Timer: {FeatureFlags.USE_GLOBAL_TIMER_MANAGER ? 'ENABLED' : 'DISABLED'}
      </Text>
    </View>
  );
};