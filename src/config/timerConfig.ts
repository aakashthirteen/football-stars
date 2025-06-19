// Timer system configuration
// Toggle between WebSocket and SSE implementations

export const TIMER_CONFIG = {
  // Set to true to use SSE, false for WebSocket
  USE_SSE_TIMER: true,
  
  // SSE specific settings
  SSE: {
    HEARTBEAT_INTERVAL_MS: 30000, // 30 seconds
    RECONNECT_MAX_RETRIES: 10,
    RECONNECT_BASE_DELAY_MS: 1000,
    RECONNECT_MAX_DELAY_MS: 30000,
  },
  
  // Timer update intervals
  TIMER_UPDATE_INTERVAL_MS: 1000, // 1 second
  INTERPOLATION_INTERVAL_MS: 100, // 100ms for smooth display
  
  // Halftime settings
  HALFTIME_BREAK_DURATION_MINUTES: 15,
  AUTO_START_SECOND_HALF: false, // Set to true for automatic
  
  // Debug settings
  DEBUG_LOGS: process.env.NODE_ENV === 'development',
  TIMER_DEBUG_LOGS: true,
};

// Helper to get timer service based on config
export function getTimerService() {
  if (TIMER_CONFIG.USE_SSE_TIMER) {
    const { sseMatchTimerService } = require('../services/sse/SSEMatchTimerService');
    return sseMatchTimerService;
  } else {
    const { matchTimerService } = require('../services/MatchTimerService');
    return matchTimerService;
  }
}
