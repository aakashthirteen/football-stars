import { EventEmitter } from 'events';
import { database } from '../models/databaseFactory';

export interface MatchTimerState {
  matchId: string;
  currentMinute: number;
  currentSecond: number;
  status: 'SCHEDULED' | 'LIVE' | 'HALFTIME' | 'COMPLETED';
  currentHalf: 1 | 2;
  addedTimeFirstHalf: number;
  addedTimeSecondHalf: number;
  isPaused: boolean;
  serverTime: number; // Unix timestamp for synchronization
  isLive: boolean;
  isHalftime: boolean;
  automaticHalftimeTriggered: boolean;
  automaticFulltimeTriggered: boolean;
  // Add match configuration to avoid database calls in timer loop
  matchDuration: number; // Total match duration (e.g., 90 minutes)
  halfDuration: number; // Half duration (e.g., 45 minutes)
}

export interface MatchTimerUpdate {
  type: 'TIMER_UPDATE' | 'STATUS_CHANGE' | 'HALF_TIME' | 'FULL_TIME' | 'MATCH_END';
  matchId: string;
  timerState: MatchTimerState;
  message?: string;
}

/**
 * Professional-grade server-side match timer service
 * Provides atomic clock precision timing like ESPN/BBC Sport
 */
export class MatchTimerService extends EventEmitter {
  private static instance: MatchTimerService;
  private activeMatches: Map<string, NodeJS.Timeout> = new Map();
  private matchStates: Map<string, MatchTimerState> = new Map();
  private readonly TIMER_INTERVAL_MS = 1000; // 1 second precision

  private constructor() {
    super();
    console.log('🏆 MatchTimerService: Professional timer service initialized');
  }

  public static getInstance(): MatchTimerService {
    if (!MatchTimerService.instance) {
      MatchTimerService.instance = new MatchTimerService();
    }
    return MatchTimerService.instance;
  }

  /**
   * Start match timer - creates server-side timer authority
   */
  public async startMatch(matchId: string): Promise<MatchTimerState> {
    try {
      console.log(`⚽ TIMER_SERVICE: Starting match ${matchId}`);
      
      // Get match data from database
      const match = await database.getMatchById(matchId);
      if (!match) {
        throw new Error('Match not found');
      }

      // Update match status to LIVE in database
      await database.updateMatch(matchId, { status: 'LIVE', match_date: new Date() });

      // Get match configuration once at start (not in timer loop!)
      const matchDuration = match.duration || 90;
      const halfDuration = matchDuration / 2;

      // Initialize timer state
      const timerState: MatchTimerState = {
        matchId,
        currentMinute: 1,
        currentSecond: 0,
        status: 'LIVE',
        currentHalf: 1,
        addedTimeFirstHalf: 0,
        addedTimeSecondHalf: 0,
        isPaused: false,
        serverTime: Date.now(),
        isLive: true,
        isHalftime: false,
        automaticHalftimeTriggered: false,
        automaticFulltimeTriggered: false,
        // Store match config to avoid database calls in timer loop
        matchDuration,
        halfDuration
      };

      this.matchStates.set(matchId, timerState);

      // Start server-side timer interval
      const timer = setInterval(async () => {
        await this.updateMatchTimer(matchId);
      }, this.TIMER_INTERVAL_MS);

      this.activeMatches.set(matchId, timer);

      console.log(`✅ TIMER_SERVICE: Match ${matchId} timer started successfully with ${this.TIMER_INTERVAL_MS}ms interval`);
      console.log(`📊 TIMER_SERVICE: Active matches count: ${this.activeMatches.size}`);
      console.log(`🔍 TIMER_SERVICE: Initial timer state:`, {
        matchId: timerState.matchId,
        currentMinute: timerState.currentMinute,
        currentSecond: timerState.currentSecond,
        status: timerState.status,
        isPaused: timerState.isPaused
      });
      
      // Emit initial state to all connected clients
      this.emitTimerUpdate(matchId, 'STATUS_CHANGE', 'Match started! ⚽');

      return timerState;
    } catch (error) {
      console.error(`❌ TIMER_SERVICE: Failed to start match ${matchId}:`, error);
      throw error;
    }
  }

  /**
   * Core timer update logic - runs every second on server
   */
  private async updateMatchTimer(matchId: string): Promise<void> {
    const state = this.matchStates.get(matchId);
    if (!state || state.isPaused) {
      console.log(`⏱️ TIMER_DEBUG: Skipping update for ${matchId} - state:`, state ? 'paused' : 'not found');
      return;
    }

    console.log(`⏱️ TIMER_DEBUG: Updating timer for match ${matchId} - current: ${state.currentMinute}:${state.currentSecond}`);

    try {
      // NO DATABASE CALLS IN TIMER LOOP! Use stored config instead
      const matchDuration = state.matchDuration;
      const halfDuration = state.halfDuration;

      // Increment time
      state.currentSecond++;
      if (state.currentSecond >= 60) {
        state.currentSecond = 0;
        state.currentMinute++;
      }

      state.serverTime = Date.now();

      // Check for automatic halftime
      const halfTimeMinute = halfDuration + state.addedTimeFirstHalf;
      if (state.currentHalf === 1 && state.currentMinute >= halfTimeMinute && state.status === 'LIVE') {
        console.log(`🟨 TIMER_SERVICE: Auto-triggering halftime for match ${matchId} at ${state.currentMinute}'`);
        await this.triggerHalftime(matchId);
        return;
      }

      // Check for automatic fulltime
      const fullTimeMinute = matchDuration + state.addedTimeSecondHalf;
      if (state.currentHalf === 2 && state.currentMinute >= fullTimeMinute && state.status === 'LIVE') {
        console.log(`🔴 TIMER_SERVICE: Auto-triggering fulltime for match ${matchId} at ${state.currentMinute}'`);
        await this.triggerFulltime(matchId);
        return;
      }

      // Update state
      this.matchStates.set(matchId, state);

      // Emit timer update every 2 seconds for real-time feel (professional sports standard)
      if (state.currentSecond % 2 === 0) {
        this.emitTimerUpdate(matchId, 'TIMER_UPDATE');
      }

    } catch (error) {
      console.error(`❌ TIMER_SERVICE: Error updating timer for match ${matchId}:`, error);
    }
  }

  /**
   * Automatic halftime trigger - runs on server
   */
  private async triggerHalftime(matchId: string): Promise<void> {
    const state = this.matchStates.get(matchId);
    if (!state) return;

    try {
      // Update database
      await database.updateMatch(matchId, { status: 'HALFTIME' });
      
      // Update local state
      state.status = 'HALFTIME';
      state.isPaused = true;
      state.isLive = false;
      state.isHalftime = true;
      state.automaticHalftimeTriggered = true;
      this.matchStates.set(matchId, state);

      console.log(`✅ TIMER_SERVICE: Halftime triggered for match ${matchId}`);
      
      // Notify all clients
      this.emitTimerUpdate(matchId, 'HALF_TIME', '⏱️ HALF-TIME! First half ends.');

    } catch (error) {
      console.error(`❌ TIMER_SERVICE: Failed to trigger halftime for match ${matchId}:`, error);
    }
  }

  /**
   * Start second half - resumes timer
   */
  public async startSecondHalf(matchId: string): Promise<MatchTimerState> {
    const state = this.matchStates.get(matchId);
    if (!state) {
      throw new Error('Match timer state not found');
    }

    try {
      // Update database
      await database.updateMatch(matchId, { status: 'LIVE', second_half_start_time: new Date() });
      
      // Calculate second half starting minute
      const match = await database.getMatchById(matchId);
      const halfDuration = (match?.duration || 90) / 2;
      
      // Update state for second half
      state.status = 'LIVE';
      state.currentHalf = 2;
      state.currentMinute = halfDuration + state.addedTimeFirstHalf + 1; // Start at 46' typically
      state.currentSecond = 0;
      state.isPaused = false;
      state.isLive = true;
      state.isHalftime = false;
      state.serverTime = Date.now();

      this.matchStates.set(matchId, state);

      console.log(`✅ TIMER_SERVICE: Second half started for match ${matchId} at ${state.currentMinute}'`);
      
      // Notify all clients
      this.emitTimerUpdate(matchId, 'STATUS_CHANGE', '⚽ SECOND HALF! Match resumes.');

      return state;
    } catch (error) {
      console.error(`❌ TIMER_SERVICE: Failed to start second half for match ${matchId}:`, error);
      throw error;
    }
  }

  /**
   * Automatic fulltime trigger - runs on server
   */
  private async triggerFulltime(matchId: string): Promise<void> {
    const state = this.matchStates.get(matchId);
    if (!state) return;

    try {
      // Update database
      await database.updateMatch(matchId, { status: 'COMPLETED' });
      
      // Update local state
      state.status = 'COMPLETED';
      state.isPaused = true;
      state.isLive = false;
      state.isHalftime = false;
      state.automaticFulltimeTriggered = true;
      this.matchStates.set(matchId, state);

      // Stop timer
      this.stopMatch(matchId);

      console.log(`✅ TIMER_SERVICE: Fulltime triggered for match ${matchId}`);
      
      // Notify all clients
      this.emitTimerUpdate(matchId, 'FULL_TIME', '📢 FULL-TIME! Match completed!');

    } catch (error) {
      console.error(`❌ TIMER_SERVICE: Failed to trigger fulltime for match ${matchId}:`, error);
    }
  }

  /**
   * Add stoppage time during match
   */
  public async addStoppageTime(matchId: string, minutes: number): Promise<MatchTimerState> {
    const state = this.matchStates.get(matchId);
    if (!state) {
      throw new Error('Match timer state not found');
    }

    try {
      if (state.currentHalf === 1) {
        state.addedTimeFirstHalf += minutes;
      } else {
        state.addedTimeSecondHalf += minutes;
      }

      state.serverTime = Date.now();
      this.matchStates.set(matchId, state);

      console.log(`⏱️ TIMER_SERVICE: Added ${minutes} minutes stoppage time to half ${state.currentHalf} for match ${matchId}`);
      
      // Notify all clients
      this.emitTimerUpdate(matchId, 'TIMER_UPDATE', `⏱️ +${minutes} minute(s) added time`);

      return state;
    } catch (error) {
      console.error(`❌ TIMER_SERVICE: Failed to add stoppage time for match ${matchId}:`, error);
      throw error;
    }
  }

  /**
   * End match manually (called by admin/referee)
   */
  public async endMatch(matchId: string): Promise<MatchTimerState> {
    console.log(`🏁 TIMER_SERVICE: Manually ending match ${matchId}`);
    
    const state = this.matchStates.get(matchId);
    if (!state) {
      throw new Error('Match timer state not found');
    }

    try {
      // Update database
      await database.updateMatch(matchId, { status: 'COMPLETED' });
      
      // Update local state
      state.status = 'COMPLETED';
      state.isPaused = true;
      state.isLive = false;
      state.isHalftime = false;
      state.automaticFulltimeTriggered = true;
      state.serverTime = Date.now();
      
      this.matchStates.set(matchId, state);

      // Stop timer
      this.stopMatch(matchId);

      console.log(`✅ TIMER_SERVICE: Match ${matchId} ended manually`);
      
      // Notify all clients
      this.emitTimerUpdate(matchId, 'MATCH_END', '🏁 Match ended by referee');

      return state;
    } catch (error) {
      console.error(`❌ TIMER_SERVICE: Failed to end match ${matchId}:`, error);
      throw error;
    }
  }

  /**
   * Get current timer state for a match
   */
  public getMatchState(matchId: string): MatchTimerState | null {
    const state = this.matchStates.get(matchId);
    if (state) {
      // Update server time for synchronization
      state.serverTime = Date.now();
    }
    return state || null;
  }

  /**
   * Stop match timer
   */
  public stopMatch(matchId: string): void {
    const timer = this.activeMatches.get(matchId);
    if (timer) {
      clearInterval(timer);
      this.activeMatches.delete(matchId);
    }
    
    // Keep state for clients but mark as stopped
    const state = this.matchStates.get(matchId);
    if (state) {
      state.isPaused = true;
    }

    console.log(`🛑 TIMER_SERVICE: Stopped timer for match ${matchId}`);
  }

  /**
   * Emit timer update to all connected clients (WebSocket)
   */
  private emitTimerUpdate(matchId: string, type: MatchTimerUpdate['type'], message?: string): void {
    const state = this.matchStates.get(matchId);
    if (!state) return;

    const update: MatchTimerUpdate = {
      type,
      matchId,
      timerState: { ...state },
      message
    };

    // Emit to WebSocket clients (will be handled by WebSocket service)
    this.emit('timerUpdate', update);
    
    console.log(`📡 TIMER_SERVICE: Emitted ${type} for match ${matchId}:`, {
      minute: state.currentMinute,
      second: state.currentSecond,
      status: state.status,
      half: state.currentHalf
    });
  }

  /**
   * Initialize timer state from existing live match (for server restarts)
   */
  public async initializeFromDatabase(matchId: string): Promise<void> {
    try {
      const match = await database.getMatchById(matchId);
      if (!match || match.status !== 'LIVE') return;

      // Calculate current time based on database timestamps
      const matchStart = new Date(match.matchDate);
      const now = new Date();
      const elapsedMs = now.getTime() - matchStart.getTime();
      const elapsedMinutes = Math.floor(elapsedMs / 60000);

      // Get match configuration
      const matchDuration = match.duration || 90;
      const halfDuration = matchDuration / 2;

      const state: MatchTimerState = {
        matchId,
        currentMinute: Math.max(1, elapsedMinutes),
        currentSecond: Math.floor((elapsedMs % 60000) / 1000),
        status: match.status as any,
        currentHalf: (match.current_half === 2 ? 2 : 1) as 1 | 2,
        addedTimeFirstHalf: match.added_time_first_half || 0,
        addedTimeSecondHalf: match.added_time_second_half || 0,
        isPaused: (match.status as string) === 'HALFTIME',
        serverTime: Date.now(),
        isLive: (match.status as string) === 'LIVE',
        isHalftime: (match.status as string) === 'HALFTIME',
        automaticHalftimeTriggered: false,
        automaticFulltimeTriggered: false,
        // Add match config to avoid database calls in timer loop
        matchDuration,
        halfDuration
      };

      this.matchStates.set(matchId, state);

      // Start timer if not paused
      if (!state.isPaused) {
        const timer = setInterval(async () => {
          await this.updateMatchTimer(matchId);
        }, this.TIMER_INTERVAL_MS);
        this.activeMatches.set(matchId, timer);
      }

      console.log(`🔄 TIMER_SERVICE: Initialized timer for existing match ${matchId} at ${state.currentMinute}:${state.currentSecond}`);
    } catch (error) {
      console.error(`❌ TIMER_SERVICE: Failed to initialize timer for match ${matchId}:`, error);
    }
  }

  /**
   * Get all active matches for monitoring
   */
  public getActiveMatches(): string[] {
    return Array.from(this.activeMatches.keys());
  }

  /**
   * Start the professional timer service (called at server startup)
   */
  public async startTimerService(): Promise<void> {
    console.log('🚀 TIMER_SERVICE: Starting professional match timer service');
    
    try {
      // Load all active matches from database and resume their timers
      const activeMatches = await database.getAllMatches();
      
      const liveMatches = activeMatches.filter(match => match.status === 'LIVE');
      
      for (const match of liveMatches) {
        console.log(`🔄 TIMER_SERVICE: Resuming timer for active match ${match.id}`);
        await this.initializeFromDatabase(match.id);
      }
      
      console.log(`✅ TIMER_SERVICE: Professional timer service started successfully with ${activeMatches.length} active matches`);
    } catch (error) {
      console.error('❌ TIMER_SERVICE: Failed to start timer service:', error);
      throw error;
    }
  }

  /**
   * Cleanup - stop all timers
   */
  public cleanup(): void {
    console.log('🧹 TIMER_SERVICE: Cleaning up all timers');
    for (const [matchId, timer] of this.activeMatches) {
      clearInterval(timer);
    }
    this.activeMatches.clear();
  }
}

// Export singleton instance
export const matchTimerService = MatchTimerService.getInstance();