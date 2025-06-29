/**
 * Feature Flags Configuration
 * Easy way to enable/disable features without changing multiple files
 */

export const FeatureFlags = {
  // Timer System - DISABLED (using new timer service)
  USE_GLOBAL_TIMER_MANAGER: false,
  FORCE_SINGLE_TIMER_MODE: false,
  
  // New Timer Service - ENABLED
  USE_NEW_TIMER_SERVICE: true,
  
  // Debug flags
  TIMER_DEBUG_LOGS: true,
  
  // Future features can be added here
};

// Helper to check if feature is enabled
export const isFeatureEnabled = (feature: keyof typeof FeatureFlags): boolean => {
  return FeatureFlags[feature] ?? false;
};