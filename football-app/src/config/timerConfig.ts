// Timer system configuration for React Native
// Toggle between WebSocket and SSE implementations

export const TIMER_CONFIG = {
  // Set to true to use SSE, false for WebSocket
  USE_SSE_TIMER: true,
  
  // SSE specific settings
  SSE: {
    HEARTBEAT_TIMEOUT_MS: 35000, // Slightly more than server heartbeat
    RECONNECT_MAX_RETRIES: 10,
    RECONNECT_BASE_DELAY_MS: 1000,
    RECONNECT_MAX_DELAY_MS: 30000,
  },
  
  // Timer display settings
  INTERPOLATION_ENABLED: true,
  INTERPOLATION_INTERVAL_MS: 100, // 100ms for smooth display
  
  // Halftime UI settings
  HALFTIME_MODAL_AUTO_SHOW: true,
  HALFTIME_BREAK_WARNING_SECONDS: 60, // Warn when 1 minute left
  
  // Connection monitoring
  CONNECTION_HEALTH_CHECK_MS: 5000,
  CONNECTION_TIMEOUT_MS: 10000,
  
  // Debug settings
  DEBUG_LOGS: __DEV__,
  TIMER_DEBUG_LOGS: true,
  SHOW_CONNECTION_STATUS: true,
};

// Helper to format time consistently
export function formatMatchTime(minutes: number, seconds: number): string {
  const displayMinutes = String(Math.floor(minutes)).padStart(2, '0');
  const displaySeconds = String(Math.floor(seconds)).padStart(2, '0');
  return `${displayMinutes}:${displaySeconds}`;
}

// Helper to format minute display (e.g., "45+2'")
export function formatMinuteDisplay(
  currentMinute: number,
  currentHalf: 1 | 2,
  addedTimeFirstHalf: number,
  addedTimeSecondHalf: number,
  halfDuration: number = 45
): string {
  let displayMinute = currentMinute;
  let addedTime = 0;
  
  if (currentHalf === 1 && currentMinute >= halfDuration) {
    addedTime = currentMinute - halfDuration;
    displayMinute = halfDuration;
  } else if (currentHalf === 2 && currentMinute >= 90) {
    addedTime = currentMinute - 90;
    displayMinute = 90;
  }
  
  if (addedTime > 0) {
    return `${displayMinute}+${addedTime}'`;
  }
  
  return `${displayMinute}'`;
}
