import { EventEmitter } from 'events';
import { Response } from 'express';
import { database } from '../../models/databaseFactory';
import { redis } from '../redisClient'; // You'll need to set up Redis
import { TIMER_CONFIG } from '../../config/timerConfig';

export interface SSETimerState {
  matchId: string;
  currentMinute: number;
  currentSecond: number;
  totalSeconds: number;
  status: 'SCHEDULED' | 'LIVE' | 'HALFTIME' | 'COMPLETED';
  currentHalf: 1 | 2;
  addedTimeFirstHalf: number;
  addedTimeSecondHalf: number;
  isPaused: boolean;
  isHalftime: boolean;
  halftimeBreakRemaining?: number; // seconds remaining in break
  serverTime: number;
  matchDuration: number;
  halfDuration: number;
  pausedAt?: number; // Timestamp when paused
  totalPausedDuration: number; // Total milliseconds paused
}

export interface SSETimerUpdate {
  type: 'timer_update' | 'status_change' | 'halftime' | 'fulltime' | 'initial_state';
  matchId: string;
  timestamp: number;
  state: SSETimerState;
  message?: string;
}

/**
 * Professional SSE-based Match Timer Service
 * Provides real-time timer updates via Server-Sent Events
 */
export class SSEMatchTimerService extends EventEmitter {
  private static instance: SSEMatchTimerService;
  private sseClients: Map<string, Set<Response>> = new Map();
  private matchTimers: Map<string, NodeJS.Timeout> = new Map();
  private matchStates: Map<string, SSETimerState> = new Map();
  private readonly TIMER_INTERVAL_MS = 1000; // 1 second updates
  private readonly HALFTIME_BREAK_DURATION_SEC = 15 * 60; // 15 minutes

  private constructor() {
    super();
    console.log('🚀 SSE Match Timer Service initialized');
  }

  public static getInstance(): SSEMatchTimerService {
    if (!SSEMatchTimerService.instance) {
      SSEMatchTimerService.instance = new SSEMatchTimerService();
    }
    return SSEMatchTimerService.instance;
  }

  /**
   * Add SSE client for a match
   */
  public addSSEClient(matchId: string, response: Response): void {
    if (!this.sseClients.has(matchId)) {
      this.sseClients.set(matchId, new Set());
    }
    this.sseClients.get(matchId)!.add(response);
    
    console.log(`📡 SSE client connected for match ${matchId}. Total clients: ${this.sseClients.get(matchId)!.size}`);
    
    // Send initial state if match is active
    const state = this.matchStates.get(matchId);
    if (state) {
      this.sendToClient(response, {
        type: 'initial_state',
        matchId,
        timestamp: Date.now(),
        state
      });
    }
  }

  /**
   * Remove SSE client
   */
  public removeSSEClient(matchId: string, response: Response): void {
    const clients = this.sseClients.get(matchId);
    if (clients) {
      clients.delete(response);
      console.log(`📡 SSE client disconnected for match ${matchId}. Remaining clients: ${clients.size}`);
      
      // Clean up if no more clients
      if (clients.size === 0) {
        this.sseClients.delete(matchId);
      }
    }
  }

  /**
   * Start match timer
   */
  public async startMatch(matchId: string): Promise<SSETimerState> {
    try {
      console.log(`⚽ SSE Timer: Starting match ${matchId}`);
      console.log(`📊 SSE Timer: Active matches before start:`, this.matchStates.size);
      console.log(`📊 SSE Timer: Connected clients:`, this.sseClients.get(matchId)?.size || 0);
      
      const match = await database.getMatchById(matchId);
      if (!match) {
        throw new Error('Match not found');
      }

      // Update database
      await database.updateMatch(matchId, { 
        status: 'LIVE', 
        timer_started_at: new Date() 
      });

      const matchDuration = match.duration || 90;
      const halfDuration = matchDuration / 2;

      // Initialize timer state
      const state: SSETimerState = {
        matchId,
        currentMinute: 0,
        currentSecond: 0,
        totalSeconds: 0,
        status: 'LIVE',
        currentHalf: 1,
        addedTimeFirstHalf: 0,
        addedTimeSecondHalf: 0,
        isPaused: false,
        isHalftime: false,
        serverTime: Date.now(),
        matchDuration,
        halfDuration,
        totalPausedDuration: 0
      };

      this.matchStates.set(matchId, state);
      
      // Start timer interval
      const timer = setInterval(() => this.updateTimer(matchId), this.TIMER_INTERVAL_MS);
      this.matchTimers.set(matchId, timer);

      // Broadcast initial state
      this.broadcastUpdate(matchId, 'status_change', 'Match started! ⚽');
      
      // Cache in Redis for fast access
      await this.cacheState(matchId, state);

      return state;
    } catch (error) {
      console.error(`❌ SSE Timer: Failed to start match ${matchId}:`, error);
      throw error;
    }
  }

  /**
   * Core timer update logic
   */
  private async updateTimer(matchId: string): Promise<void> {
    const state = this.matchStates.get(matchId);
    if (!state || state.isPaused) return;

    // Update time
    state.totalSeconds++;
    state.currentSecond++;
    if (state.currentSecond >= 60) {
      state.currentSecond = 0;
      state.currentMinute++;
    }
    state.serverTime = Date.now();

    // Check for automatic halftime (if enabled)
    if (TIMER_CONFIG.AUTO_TRIGGER_HALFTIME && this.shouldTriggerHalftime(state)) {
      await this.triggerHalftime(matchId);
      return;
    }

    // Check for automatic fulltime (if enabled)
    if (TIMER_CONFIG.AUTO_TRIGGER_FULLTIME && this.shouldTriggerFulltime(state)) {
      await this.triggerFulltime(matchId);
      return;
    }
    
    // Log milestones when auto-triggers are disabled
    if (!TIMER_CONFIG.AUTO_TRIGGER_HALFTIME && this.shouldTriggerHalftime(state)) {
      console.log(`⏰ SSE Timer: Match ${matchId} reached halftime (45'), waiting for manual trigger`);
    } else if (!TIMER_CONFIG.AUTO_TRIGGER_FULLTIME && this.shouldTriggerFulltime(state)) {
      console.log(`⏰ SSE Timer: Match ${matchId} reached fulltime (90'), waiting for manual trigger`);
    }

    // Update state
    this.matchStates.set(matchId, state);
    
    // Broadcast update
    this.broadcastUpdate(matchId, 'timer_update');
    
    // Cache state
    await this.cacheState(matchId, state);
  }

  /**
   * Check if halftime should trigger
   */
  private shouldTriggerHalftime(state: SSETimerState): boolean {
    if (state.currentHalf !== 1 || state.status !== 'LIVE') return false;
    
    const totalMinutes = state.currentMinute + (state.currentSecond / 60);
    const halfTimeMinute = state.halfDuration + state.addedTimeFirstHalf;
    
    return totalMinutes >= halfTimeMinute;
  }

  /**
   * Check if fulltime should trigger
   */
  private shouldTriggerFulltime(state: SSETimerState): boolean {
    if (state.currentHalf !== 2 || state.status !== 'LIVE') return false;
    
    // CRITICAL FIX: Second half timer continues from where first half ended
    // currentMinute starts at ~45 and goes to ~90+
    // Fulltime should trigger at 90 + second half stoppage time
    const totalMinutes = state.currentMinute + (state.currentSecond / 60);
    const fullMatchEnd = state.matchDuration + state.addedTimeSecondHalf; // 90 + stoppage
    
    console.log(`🕐 FULLTIME CHECK: currentMinute=${state.currentMinute}, fullMatchEnd=${fullMatchEnd}, shouldTrigger=${totalMinutes >= fullMatchEnd}`);
    
    return totalMinutes >= fullMatchEnd;
  }

  /**
   * Trigger halftime (can be called manually)
   */
  public async triggerHalftime(matchId: string): Promise<void> {
    const state = this.matchStates.get(matchId);
    if (!state) return;

    console.log(`🟨 SSE Timer: Triggering halftime for match ${matchId}`);

    // Update state
    state.status = 'HALFTIME';
    state.isPaused = true;
    state.isHalftime = true;
    state.halftimeBreakRemaining = this.HALFTIME_BREAK_DURATION_SEC;
    
    // Store exact halftime timing for precise second half continuation
    console.log(`💾 SSE Timer: Storing exact halftime timing - ${state.currentMinute}:${state.currentSecond.toString().padStart(2, '0')} (${state.totalSeconds}s)`);
    
    // Update database with precise halftime timing
    await database.updateMatch(matchId, { 
      status: 'HALFTIME',
      halftime_started_at: new Date(),
      // Store exact timing for second half continuation
      current_minute: state.currentMinute,        // Exact minute when halftime triggered
      current_second: state.currentSecond,        // Exact second when halftime triggered
      total_seconds_at_halftime: state.totalSeconds, // Total elapsed seconds
      added_time_first_half: state.addedTimeFirstHalf,
      current_half: 1
    });

    // Start halftime break countdown
    this.startHalftimeBreakCountdown(matchId);

    // Broadcast halftime
    this.broadcastUpdate(matchId, 'halftime', '⏱️ HALF-TIME! 15-minute break begins.');
    
    await this.cacheState(matchId, state);
  }

  /**
   * Halftime break countdown
   */
  private startHalftimeBreakCountdown(matchId: string): void {
    const breakTimer = setInterval(async () => {
      const state = this.matchStates.get(matchId);
      if (!state || !state.isHalftime) {
        clearInterval(breakTimer);
        return;
      }

      state.halftimeBreakRemaining = Math.max(0, (state.halftimeBreakRemaining || 0) - 1);
      
      // Broadcast countdown update every 5 seconds
      if (state.halftimeBreakRemaining % 5 === 0) {
        this.broadcastUpdate(matchId, 'timer_update');
      }

      // Auto-start second half when break ends (if enabled)
      if (state.halftimeBreakRemaining <= 0 && TIMER_CONFIG.AUTO_START_SECOND_HALF) {
        clearInterval(breakTimer);
        console.log(`🤖 SSE Timer: Auto-starting second half for match ${matchId}`);
        await this.startSecondHalf(matchId);
      } else if (state.halftimeBreakRemaining <= 0) {
        clearInterval(breakTimer);
        console.log(`⏸️ SSE Timer: Halftime break ended for match ${matchId}, waiting for manual start`);
        // Just stop the countdown, don't auto-start
      }
    }, 1000);
  }

  /**
   * Start second half
   */
  public async startSecondHalf(matchId: string): Promise<SSETimerState> {
    const state = this.matchStates.get(matchId);
    if (!state) throw new Error('Match state not found');

    console.log(`⚽ SSE Timer: Starting second half for match ${matchId}`);

    // Retrieve the match from database to get stored halftime timing
    const match = await database.getMatchById(matchId);
    if (!match) throw new Error('Match not found in database');

    // CRITICAL FIX: Continue from exact halftime timing instead of calculating
    if (match.currentMinute !== undefined && match.currentSecond !== undefined && match.totalSecondsAtHalftime !== undefined) {
      // Restore exact timing from when halftime was triggered
      state.currentMinute = match.currentMinute;
      state.currentSecond = match.currentSecond;
      state.totalSeconds = match.totalSecondsAtHalftime;
      console.log(`🔄 SSE Timer: Continuing from exact halftime timing - ${state.currentMinute}:${state.currentSecond.toString().padStart(2, '0')} (${state.totalSeconds}s)`);
    } else {
      // Fallback to old calculation if halftime timing not stored
      console.log(`⚠️ SSE Timer: Halftime timing not found, using fallback calculation`);
      const totalFirstHalfMinutes = state.halfDuration + state.addedTimeFirstHalf;
      state.currentMinute = Math.ceil(totalFirstHalfMinutes);
      state.currentSecond = 0;
      state.totalSeconds = state.currentMinute * 60;
    }

    state.currentHalf = 2;
    state.status = 'LIVE';
    state.isPaused = false;
    state.isHalftime = false;
    state.halftimeBreakRemaining = undefined;

    // Update database
    await database.updateMatch(matchId, { 
      status: 'LIVE',
      current_half: 2,
      second_half_start_time: new Date()
    });

    // Restart timer
    if (!this.matchTimers.has(matchId)) {
      const timer = setInterval(() => this.updateTimer(matchId), this.TIMER_INTERVAL_MS);
      this.matchTimers.set(matchId, timer);
    }

    // Broadcast update
    this.broadcastUpdate(matchId, 'status_change', '⚽ SECOND HALF! Match resumes.');
    
    await this.cacheState(matchId, state);
    return state;
  }

  /**
   * Trigger fulltime (can be called manually)
   */
  public async triggerFulltime(matchId: string): Promise<void> {
    const state = this.matchStates.get(matchId);
    if (!state) return;

    console.log(`🏁 SSE Timer: Triggering fulltime for match ${matchId}`);

    // Update state
    state.status = 'COMPLETED';
    state.isPaused = true;

    // Stop timer
    this.stopMatch(matchId);

    // Update database
    await database.updateMatch(matchId, { status: 'COMPLETED' });

    // Broadcast fulltime
    this.broadcastUpdate(matchId, 'fulltime', '📢 FULL-TIME! Match completed!');
    
    await this.cacheState(matchId, state);
  }

  /**
   * Pause match
   */
  public async pauseMatch(matchId: string): Promise<SSETimerState> {
    const state = this.matchStates.get(matchId);
    if (!state) throw new Error('Match state not found');

    state.isPaused = true;
    state.pausedAt = Date.now();
    
    await database.updateMatch(matchId, { 
      timer_paused_at: new Date(state.pausedAt) 
    });
    
    this.broadcastUpdate(matchId, 'status_change', '⏸️ Match paused');
    await this.cacheState(matchId, state);
    
    return state;
  }

  /**
   * Resume match
   */
  public async resumeMatch(matchId: string): Promise<SSETimerState> {
    const state = this.matchStates.get(matchId);
    if (!state) throw new Error('Match state not found');

    // Calculate pause duration and update total
    if (state.pausedAt) {
      const pauseDuration = Date.now() - state.pausedAt;
      state.totalPausedDuration = (state.totalPausedDuration || 0) + pauseDuration;
      state.pausedAt = undefined;
      
      // Update database with total paused duration
      await database.updateMatch(matchId, { 
        timer_paused_at: null,
        total_paused_duration: Math.floor(state.totalPausedDuration / 1000) // Store in seconds
      });
    }
    
    state.isPaused = false;
    
    this.broadcastUpdate(matchId, 'status_change', '▶️ Match resumed');
    await this.cacheState(matchId, state);
    
    return state;
  }

  /**
   * Add stoppage time
   */
  public async addStoppageTime(matchId: string, minutes: number): Promise<SSETimerState> {
    const state = this.matchStates.get(matchId);
    if (!state) throw new Error('Match state not found');

    if (state.currentHalf === 1) {
      state.addedTimeFirstHalf += minutes;
    } else {
      state.addedTimeSecondHalf += minutes;
    }

    await database.updateMatch(matchId, {
      [`added_time_${state.currentHalf === 1 ? 'first' : 'second'}_half`]: 
        state.currentHalf === 1 ? state.addedTimeFirstHalf : state.addedTimeSecondHalf
    });

    this.broadcastUpdate(matchId, 'timer_update', `⏱️ +${minutes} minute(s) added`);
    await this.cacheState(matchId, state);
    
    return state;
  }

  /**
   * Stop match and cleanup
   */
  private stopMatch(matchId: string): void {
    const timer = this.matchTimers.get(matchId);
    if (timer) {
      clearInterval(timer);
      this.matchTimers.delete(matchId);
    }
  }

  /**
   * Broadcast update to all SSE clients
   */
  private broadcastUpdate(matchId: string, type: SSETimerUpdate['type'], message?: string): void {
    const state = this.matchStates.get(matchId);
    if (!state) return;

    const clients = this.sseClients.get(matchId) || new Set();
    const update: SSETimerUpdate = {
      type,
      matchId,
      timestamp: Date.now(),
      state,
      message
    };

    clients.forEach(client => {
      this.sendToClient(client, update);
    });
  }

  /**
   * Send data to SSE client
   */
  private sendToClient(client: Response, data: SSETimerUpdate): void {
    try {
      client.write(`data: ${JSON.stringify(data)}\n\n`);
    } catch (error) {
      console.error('Failed to send SSE update:', error);
    }
  }

  /**
   * Cache state in Redis
   */
  private async cacheState(matchId: string, state: SSETimerState): Promise<void> {
    if (!redis) return; // Skip if Redis not configured
    
    try {
      await redis.setex(
        `match:${matchId}:timer`,
        5, // 5 second TTL
        JSON.stringify(state)
      );
    } catch (error) {
      console.error('Redis cache error:', error);
    }
  }

  /**
   * Get match state
   */
  public getMatchState(matchId: string): SSETimerState | null {
    return this.matchStates.get(matchId) || null;
  }

  /**
   * Initialize from database (for server restarts)
   */
  public async initializeFromDatabase(matchId: string): Promise<void> {
    try {
      const match = await database.getMatchById(matchId);
      if (!match || match.status !== 'LIVE') return;

      // Reconstruct timer state from database
      let currentMinute: number;
      let currentSecond: number;
      let totalSeconds: number;
      
      // Calculate paused duration (needed for state object)
      const totalPausedMs = ((match as any).total_paused_duration || 0) * 1000; // Convert from seconds to ms

      // CRITICAL FIX: Use exact halftime timing if available (for halftime/second half)
      if (match.currentMinute !== undefined && match.currentSecond !== undefined && match.totalSecondsAtHalftime !== undefined) {
        // Restore from stored exact timing
        currentMinute = match.currentMinute;
        currentSecond = match.currentSecond;
        totalSeconds = match.totalSecondsAtHalftime;
        console.log(`🔄 SSE Timer Recovery: Using exact stored timing - ${currentMinute}:${currentSecond.toString().padStart(2, '0')} (${totalSeconds}s)`);
      } else {
        // Fallback to time calculation for first half or when exact timing not stored
        const timerStarted = new Date((match as any).timer_started_at || match.matchDate);
        const now = new Date();
        const elapsedMs = now.getTime() - timerStarted.getTime() - totalPausedMs;
        const elapsedSeconds = Math.floor(elapsedMs / 1000);
        
        currentMinute = Math.floor(elapsedSeconds / 60);
        currentSecond = elapsedSeconds % 60;
        totalSeconds = elapsedSeconds;
        console.log(`⏰ SSE Timer Recovery: Calculated timing - ${currentMinute}:${currentSecond.toString().padStart(2, '0')} (${totalSeconds}s)`);
      }

      const state: SSETimerState = {
        matchId,
        currentMinute,
        currentSecond,
        totalSeconds,
        status: match.status as any,
        currentHalf: (match as any).current_half || 1,
        addedTimeFirstHalf: (match as any).added_time_first_half || 0,
        addedTimeSecondHalf: (match as any).added_time_second_half || 0,
        isPaused: !!(match as any).timer_paused_at,
        isHalftime: (match.status as string) === 'HALFTIME',
        serverTime: Date.now(),
        matchDuration: match.duration || 90,
        halfDuration: (match.duration || 90) / 2,
        totalPausedDuration: totalPausedMs,
        pausedAt: (match as any).timer_paused_at ? new Date((match as any).timer_paused_at).getTime() : undefined
      };

      this.matchStates.set(matchId, state);

      // Resume timer
      const timer = setInterval(() => this.updateTimer(matchId), this.TIMER_INTERVAL_MS);
      this.matchTimers.set(matchId, timer);

      console.log(`🔄 SSE Timer: Resumed timer for match ${matchId}`);
    } catch (error) {
      console.error(`Failed to initialize timer for match ${matchId}:`, error);
    }
  }
}

export const sseMatchTimerService = SSEMatchTimerService.getInstance();
