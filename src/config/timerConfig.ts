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
  AUTO_TRIGGER_HALFTIME: true, // Set to true for automatic halftime at 45'
  AUTO_TRIGGER_FULLTIME: true, // Set to true for automatic fulltime at 90'
  
  // Debug settings
  DEBUG_LOGS: process.env.NODE_ENV === 'development',
  TIMER_DEBUG_LOGS: true,
};

// Helper to get timer service based on config
export function getTimerService() {
  // FIXED: Use the new ScalableFootballTimerService with compatibility adapter
  const { scalableFootballTimer } = require('../services/sse/ScalableFootballTimerService');
  
  // Create compatibility adapter for the match controller
  return {
    async startMatch(matchId: string) {
      const state = await scalableFootballTimer.startMatch(matchId);
      
      // Convert ScalableMatchState to expected format
      const elapsed = Date.now() - state.startedAt - state.totalPausedMs;
      const currentMinute = Math.floor(elapsed / (60 * 1000));
      const currentSecond = Math.floor((elapsed % (60 * 1000)) / 1000);
      
      return {
        matchId: state.matchId,
        currentMinute,
        currentSecond,
        status: state.isActive ? 'LIVE' : 'PAUSED',
        isLive: state.isActive,
        phase: state.phase,
        originalState: state
      };
    },
    
    getMatchState(matchId: string) {
      const state = scalableFootballTimer.getMatchState(matchId);
      if (!state) return null;
      
      // Convert ScalableMatchState to expected format
      const elapsed = Date.now() - state.startedAt - state.totalPausedMs;
      const currentMinute = Math.floor(elapsed / (60 * 1000));
      const currentSecond = Math.floor((elapsed % (60 * 1000)) / 1000);
      
      return {
        matchId: state.matchId,
        currentMinute,
        currentSecond,
        currentHalf: state.phase === 'FIRST_HALF' ? 1 : state.phase === 'SECOND_HALF' ? 2 : 1,
        status: state.isActive ? 'LIVE' : 'PAUSED',
        isLive: state.isActive,
        phase: state.phase,
        originalState: state
      };
    },
    
    // Delegate other methods directly
    pauseMatch: (matchId: string) => scalableFootballTimer.pauseMatch(matchId),
    resumeMatch: (matchId: string) => scalableFootballTimer.resumeMatch(matchId),
    addStoppageTime: (matchId: string, minutes: number) => scalableFootballTimer.addStoppageTime(matchId, minutes),
    startSecondHalf: (matchId: string) => scalableFootballTimer.startSecondHalf(matchId),
    subscribeToMatch: (matchId: string, response: any) => scalableFootballTimer.subscribeToMatch(matchId, response),
    unsubscribeFromMatch: (matchId: string, response: any) => scalableFootballTimer.unsubscribeFromMatch(matchId, response),
    
    // Add missing methods
    triggerHalftime: (matchId: string) => scalableFootballTimer.manuallyTriggerHalftime(matchId),
    triggerFulltime: (matchId: string) => scalableFootballTimer.manuallyTriggerFulltime(matchId),
    initializeFromDatabase: async (matchId?: string) => {
      // ScalableFootballTimerService doesn't need database initialization
      console.log(`Timer service initialization completed (scalable service)${matchId ? ` for match ${matchId}` : ''}`);
      return true;
    }
  };
}
