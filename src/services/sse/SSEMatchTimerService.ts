import { EventEmitter } from 'events';
import { Response } from 'express';
import { database } from '../../models/databaseFactory';
import { redis } from '../redisClient'; // You'll need to set up Redis

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
        halfDuration
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

    // Check for automatic halftime
    if (this.shouldTriggerHalftime(state)) {
      await this.triggerHalftime(matchId);
      return;
    }

    // Check for automatic fulltime
    if (this.shouldTriggerFulltime(state)) {
      await this.triggerFulltime(matchId);
      return;
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
    
    const totalMinutes = state.currentMinute + (state.currentSecond / 60);
    const fullTimeMinute = state.matchDuration + state.addedTimeSecondHalf;
    
    return totalMinutes >= fullTimeMinute;
  }

  /**
   * Trigger halftime
   */
  private async triggerHalftime(matchId: string): Promise<void> {
    const state = this.matchStates.get(matchId);
    if (!state) return;

    console.log(`🟨 SSE Timer: Triggering halftime for match ${matchId}`);

    // Update state
    state.status = 'HALFTIME';
    state.isPaused = true;
    state.isHalftime = true;
    state.halftimeBreakRemaining = this.HALFTIME_BREAK_DURATION_SEC;
    
    // Update database
    await database.updateMatch(matchId, { 
      status: 'HALFTIME',
      halftime_started_at: new Date()
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

      // Auto-start second half when break ends
      if (state.halftimeBreakRemaining <= 0) {
        clearInterval(breakTimer);
        await this.startSecondHalf(matchId);
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

    // Calculate second half start time
    const totalFirstHalfMinutes = state.halfDuration + state.addedTimeFirstHalf;
    state.currentMinute = Math.ceil(totalFirstHalfMinutes);
    state.currentSecond = 0;
    state.totalSeconds = state.currentMinute * 60;
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
   * Trigger fulltime
   */
  private async triggerFulltime(matchId: string): Promise<void> {
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
    await database.updateMatch(matchId, { timer_paused_at: new Date() });
    
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
      const timerStarted = new Date((match as any).timer_started_at || match.matchDate);
      const now = new Date();
      const elapsedMs = now.getTime() - timerStarted.getTime();
      const elapsedSeconds = Math.floor(elapsedMs / 1000);

      const state: SSETimerState = {
        matchId,
        currentMinute: Math.floor(elapsedSeconds / 60),
        currentSecond: elapsedSeconds % 60,
        totalSeconds: elapsedSeconds,
        status: match.status as any,
        currentHalf: (match as any).current_half || 1,
        addedTimeFirstHalf: (match as any).added_time_first_half || 0,
        addedTimeSecondHalf: (match as any).added_time_second_half || 0,
        isPaused: false,
        isHalftime: (match.status as string) === 'HALFTIME',
        serverTime: Date.now(),
        matchDuration: match.duration || 90,
        halfDuration: (match.duration || 90) / 2
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
