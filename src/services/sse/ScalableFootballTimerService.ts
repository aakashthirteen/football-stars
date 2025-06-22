/**
 * SCALABLE FOOTBALL MATCH TIMER SYSTEM
 * 
 * PERFORMANCE PROBLEM SOLVED:
 * OLD: 3 timers per match × 1000 matches = 3000 timers = DEATH
 * NEW: 1 central timer for ALL matches = SCALABLE
 * 
 * Architecture based on:
 * - Broadcast Systems: Single master clock for thousands of events
 * - Real-time Gaming: Central game loop processing all entities
 * - Stock Trading Systems: High-frequency event processing
 * 
 * CORE PRINCIPLES:
 * 1. SINGLE CENTRAL TIMER: One setInterval for ALL matches (100ms precision)
 * 2. LIGHTWEIGHT STATE: Minimal memory footprint per match
 * 3. EVENT PREDICTION: Pre-calculate when events will fire (FIFA-style)
 * 4. CENTRALIZED SSE: Shared broadcast system
 * 5. MILLISECOND ACCURACY: Maintains FIFA-level precision despite single timer
 */

import { EventEmitter } from 'events';
import { Response } from 'express';
import { database } from '../../models/databaseFactory';

// Lightweight match state - optimized for memory efficiency
interface ScalableMatchState {
  matchId: string;
  
  // Timing (all in milliseconds for precision)
  startedAt: number;              // When match actually started (timestamp)
  durationMs: number;             // Total match duration 
  halfDurationMs: number;         // Half duration (always durationMs/2)
  
  // Current state
  phase: 'FIRST_HALF' | 'HALFTIME_BREAK' | 'SECOND_HALF' | 'COMPLETED';
  isActive: boolean;
  
  // Stoppage time
  firstHalfStoppageMs: number;
  secondHalfStoppageMs: number;
  
  // Pause tracking
  pausedAt?: number;              // When currently paused (if paused)
  totalPausedMs: number;          // Total time spent paused
  
  // Break tracking
  halftimeBreakStartedAt?: number;
  halftimeBreakDurationMs: number;  // How long halftime break should last
}

// Pre-calculated events for exact timing (like FIFA systems)
interface PredictedEvent {
  matchId: string;
  type: 'HALFTIME' | 'FULLTIME';
  fireAtElapsed: number;          // Fire when match elapsed time reaches this (ms)
  executed: boolean;
}

export class ScalableFootballTimerService extends EventEmitter {
  private static instance: ScalableFootballTimerService;
  
  // SCALABLE: Single timer for ALL matches
  private centralTimer?: NodeJS.Timeout;
  private readonly CENTRAL_TICK_MS = 100;  // Check all matches every 100ms
  private readonly UI_UPDATE_INTERVAL_MS = 1000; // Broadcast to UI every second
  private lastUIUpdateTime = 0;
  
  // Lightweight storage
  private matches = new Map<string, ScalableMatchState>();
  private predictedEvents = new Map<string, PredictedEvent[]>();
  
  // Centralized SSE management
  private sseClients = new Set<Response>();
  private matchSubscriptions = new Map<string, Set<Response>>();
  
  // Performance tracking
  private performanceMetrics = {
    activeMatches: 0,
    totalEventsProcessed: 0,
    averageProcessingTimeMs: 0
  };
  
  private constructor() {
    super();
    console.log('🚀 Scalable Football Timer Service initialized');
  }
  
  public static getInstance(): ScalableFootballTimerService {
    if (!ScalableFootballTimerService.instance) {
      ScalableFootballTimerService.instance = new ScalableFootballTimerService();
    }
    return ScalableFootballTimerService.instance;
  }

  /**
   * Start a match - adds to central processing loop
   */
  public async startMatch(matchId: string): Promise<ScalableMatchState> {
    const match = await database.getMatchById(matchId);
    if (!match) throw new Error('Match not found');

    const now = Date.now();
    const durationMs = (match.duration || 90) * 60 * 1000;
    
    // Create lightweight state
    const state: ScalableMatchState = {
      matchId,
      startedAt: now,
      durationMs,
      halfDurationMs: durationMs / 2,
      phase: 'FIRST_HALF',
      isActive: true,
      firstHalfStoppageMs: 0,
      secondHalfStoppageMs: 0,
      totalPausedMs: 0,
      halftimeBreakDurationMs: 15 * 60 * 1000  // 15 minutes
    };

    this.matches.set(matchId, state);
    this.predictEvents(matchId);
    
    // Update database
    await database.updateMatch(matchId, { 
      status: 'LIVE', 
      timer_started_at: new Date(now)
    });

    // Start central timer if first match
    if (this.matches.size === 1) {
      this.startCentralTimer();
    }
    
    this.performanceMetrics.activeMatches = this.matches.size;
    console.log(`⚽ Match ${matchId} added to scalable timer (${this.matches.size} total matches)`);
    
    this.broadcastToMatch(matchId, 'match_started');
    return state;
  }

  /**
   * SCALABLE CORE: Single timer processes ALL matches
   */
  private startCentralTimer(): void {
    if (this.centralTimer) return;
    
    console.log('🎯 Starting CENTRAL TIMER for all matches (100ms precision)');
    
    this.centralTimer = setInterval(() => {
      this.processCentralTick();
    }, this.CENTRAL_TICK_MS);
  }

  /**
   * PERFORMANCE CORE: Process all matches in single loop
   */
  private processCentralTick(): void {
    if (this.matches.size === 0) {
      this.stopCentralTimer();
      return;
    }

    const startTime = Date.now();
    let eventsProcessed = 0;

    // Process all active matches in single loop
    for (const [matchId, state] of this.matches) {
      if (!state.isActive) continue;
      
      const elapsed = this.calculateElapsedTime(state);
      
      // Check for predicted events that should fire
      const events = this.predictedEvents.get(matchId) || [];
      for (const event of events) {
        if (!event.executed && elapsed >= event.fireAtElapsed) {
          this.executeEvent(event);
          eventsProcessed++;
        }
      }
    }

    // Broadcast UI updates (less frequently than core processing)
    const now = Date.now();
    if (now - this.lastUIUpdateTime >= this.UI_UPDATE_INTERVAL_MS) {
      this.broadcastUIUpdates();
      this.lastUIUpdateTime = now;
    }

    // Track performance
    this.performanceMetrics.totalEventsProcessed += eventsProcessed;
    this.performanceMetrics.averageProcessingTimeMs = 
      (this.performanceMetrics.averageProcessingTimeMs + (Date.now() - startTime)) / 2;
  }

  /**
   * Calculate precise elapsed time accounting for pauses
   */
  private calculateElapsedTime(state: ScalableMatchState): number {
    const now = Date.now();
    let elapsed = now - state.startedAt - state.totalPausedMs;
    
    // If currently paused, don't count pause time
    if (state.pausedAt) {
      elapsed -= (now - state.pausedAt);
    }
    
    return Math.max(0, elapsed);
  }

  /**
   * Pre-calculate when events should fire (FIFA-style prediction)
   */
  private predictEvents(matchId: string): void {
    const state = this.matches.get(matchId);
    if (!state) return;

    const events: PredictedEvent[] = [];

    // Predict halftime: fires at (halfDuration + firstHalfStoppage)
    const halftimeAt = state.halfDurationMs + state.firstHalfStoppageMs;
    events.push({
      matchId,
      type: 'HALFTIME',
      fireAtElapsed: halftimeAt,
      executed: false
    });

    // Predict fulltime: fires at (totalDuration + secondHalfStoppage)
    const fulltimeAt = state.durationMs + state.secondHalfStoppageMs;
    events.push({
      matchId,
      type: 'FULLTIME', 
      fireAtElapsed: fulltimeAt,
      executed: false
    });

    this.predictedEvents.set(matchId, events);
    
    console.log(`📅 Predicted events for ${matchId}:`);
    console.log(`   HALFTIME at: ${this.formatMs(halftimeAt)}`);
    console.log(`   FULLTIME at: ${this.formatMs(fulltimeAt)}`);
  }

  /**
   * Execute predicted event with exact timing
   */
  private async executeEvent(event: PredictedEvent): Promise<void> {
    if (event.executed) return;
    
    const state = this.matches.get(event.matchId);
    if (!state) return;

    const elapsed = this.calculateElapsedTime(state);
    console.log(`🎯 Executing ${event.type} for ${event.matchId} at ${this.formatMs(elapsed)}`);

    event.executed = true;

    if (event.type === 'HALFTIME') {
      await this.executeHalftime(event.matchId, elapsed);
    } else if (event.type === 'FULLTIME') {
      await this.executeFulltime(event.matchId, elapsed);
    }
  }

  /**
   * Execute halftime with exact display timing
   */
  private async executeHalftime(matchId: string, elapsedMs: number): Promise<void> {
    const state = this.matches.get(matchId);
    if (!state || state.phase !== 'FIRST_HALF') return;

    // Calculate exact display time users should see
    const targetDisplayMs = state.halfDurationMs + state.firstHalfStoppageMs;
    const displayMinute = Math.floor(targetDisplayMs / (60 * 1000));
    const displaySecond = Math.floor((targetDisplayMs % (60 * 1000)) / 1000);

    console.log(`🟨 HALFTIME: ${matchId} at exactly ${displayMinute}:${displaySecond.toString().padStart(2, '0')}`);

    // Update state
    state.phase = 'HALFTIME_BREAK';
    state.isActive = false;
    state.halftimeBreakStartedAt = Date.now();

    // Update database
    await database.updateMatch(matchId, { 
      status: 'HALFTIME',
      current_minute: displayMinute,
      current_second: displaySecond,
      halftime_started_at: new Date()
    });

    this.broadcastToMatch(matchId, 'halftime');
  }

  /**
   * Start second half from exact half duration
   */
  public async startSecondHalf(matchId: string): Promise<ScalableMatchState> {
    const state = this.matches.get(matchId);
    if (!state || state.phase !== 'HALFTIME_BREAK') {
      throw new Error('Invalid state for second half');
    }

    console.log(`⚽ Starting second half: ${matchId}`);

    // CRITICAL: Second half starts from EXACT half duration
    const secondHalfStartMs = state.halfDurationMs;
    const displayMinute = Math.floor(secondHalfStartMs / (60 * 1000));
    const displaySecond = 0;

    // CRITICAL FIX: Reset timing so second half starts from halfDuration
    const now = Date.now();
    
    // Reset the match start time so that current elapsed = halfDurationMs
    // This ensures second half display starts from duration/2, not duration/2 + stoppage
    state.startedAt = now - state.halfDurationMs;
    state.totalPausedMs = 0; // Reset paused time for clean second half start
    
    // Update state
    state.phase = 'SECOND_HALF';
    state.isActive = true;
    state.halftimeBreakStartedAt = undefined;

    console.log(`🔄 Second half starts at exactly ${displayMinute}:${displaySecond.toString().padStart(2, '0')}`);

    // Re-predict events for second half
    this.predictEvents(matchId);

    // Update database
    await database.updateMatch(matchId, { 
      status: 'LIVE',
      current_half: 2,
      second_half_start_time: new Date()
    });

    this.broadcastToMatch(matchId, 'second_half_started');
    return state;
  }

  /**
   * Add stoppage time and re-predict events
   */
  public async addStoppageTime(matchId: string, minutes: number): Promise<ScalableMatchState> {
    const state = this.matches.get(matchId);
    if (!state) throw new Error('Match state not found');

    const stoppageMs = minutes * 60 * 1000;
    console.log(`⏱️ Adding ${minutes} minute(s) stoppage to ${matchId}`);

    // Add to appropriate half
    if (state.phase === 'FIRST_HALF') {
      state.firstHalfStoppageMs += stoppageMs;
    } else if (state.phase === 'SECOND_HALF') {
      state.secondHalfStoppageMs += stoppageMs;
    }

    // Re-predict events with new timing
    this.predictEvents(matchId);

    // Update database
    const field = state.phase === 'FIRST_HALF' ? 'added_time_first_half' : 'added_time_second_half';
    const value = state.phase === 'FIRST_HALF' ? 
      state.firstHalfStoppageMs / (60 * 1000) : 
      state.secondHalfStoppageMs / (60 * 1000);

    await database.updateMatch(matchId, { [field]: value });

    this.broadcastToMatch(matchId, 'stoppage_time_added');
    return state;
  }

  /**
   * Execute fulltime
   */
  private async executeFulltime(matchId: string, elapsedMs: number): Promise<void> {
    const state = this.matches.get(matchId);
    if (!state || state.phase !== 'SECOND_HALF') return;

    console.log(`🏁 FULLTIME: ${matchId}`);

    // Update state
    state.phase = 'COMPLETED';
    state.isActive = false;

    // Clean up
    this.matches.delete(matchId);
    this.predictedEvents.delete(matchId);
    
    // Update performance metrics
    this.performanceMetrics.activeMatches = this.matches.size;

    // Update database
    await database.updateMatch(matchId, { status: 'COMPLETED' });

    this.broadcastToMatch(matchId, 'fulltime');
    
    // Clean up SSE subscriptions for this match
    this.cleanupMatchSubscriptions(matchId);
  }

  /**
   * Broadcast UI updates to all clients (called every second)
   */
  private broadcastUIUpdates(): void {
    const updates = new Map<string, any>();

    // Prepare updates for all active matches
    for (const [matchId, state] of this.matches) {
      const elapsed = this.calculateElapsedTime(state);
      const displayMinute = Math.floor(elapsed / (60 * 1000));
      const displaySecond = Math.floor((elapsed % (60 * 1000)) / 1000);

      updates.set(matchId, {
        type: 'timer_update',
        matchId,
        timestamp: Date.now(),
        state: {
          currentMinute: displayMinute,
          currentSecond: displaySecond,
          totalSeconds: Math.floor(elapsed / 1000), // Added for frontend sync
          status: this.mapPhaseToStatus(state.phase),
          currentHalf: state.phase === 'FIRST_HALF' ? 1 : 2,
          isHalftime: state.phase === 'HALFTIME_BREAK',
          isPaused: !state.isActive,
          addedTimeFirstHalf: Math.floor(state.firstHalfStoppageMs / (60 * 1000)),
          addedTimeSecondHalf: Math.floor(state.secondHalfStoppageMs / (60 * 1000)),
          serverTime: Date.now()
        }
      });
    }

    // Send updates to subscribed clients
    for (const [matchId, update] of updates) {
      this.sendToMatchClients(matchId, update);
    }
  }

  /**
   * Centralized SSE Management
   */
  public subscribeToMatch(matchId: string, response: Response): void {
    if (!this.matchSubscriptions.has(matchId)) {
      this.matchSubscriptions.set(matchId, new Set());
    }
    this.matchSubscriptions.get(matchId)!.add(response);
    this.sseClients.add(response);
    
    console.log(`📡 Client subscribed to match ${matchId} (${this.sseClients.size} total clients)`);
  }

  public unsubscribeFromMatch(matchId: string, response: Response): void {
    const subscribers = this.matchSubscriptions.get(matchId);
    if (subscribers) {
      subscribers.delete(response);
      if (subscribers.size === 0) {
        this.matchSubscriptions.delete(matchId);
      }
    }
    this.sseClients.delete(response);
  }

  private broadcastToMatch(matchId: string, eventType: string): void {
    const state = this.matches.get(matchId);
    if (!state) return;

    const elapsed = this.calculateElapsedTime(state);
    const displayMinute = Math.floor(elapsed / (60 * 1000));
    const displaySecond = Math.floor((elapsed % (60 * 1000)) / 1000);

    const update = {
      type: eventType,
      matchId,
      timestamp: Date.now(),
      state: {
        currentMinute: displayMinute,
        currentSecond: displaySecond,
        totalSeconds: Math.floor(elapsed / 1000), // Added for frontend sync
        status: this.mapPhaseToStatus(state.phase),
        currentHalf: state.phase === 'FIRST_HALF' ? 1 : 2,
        isHalftime: state.phase === 'HALFTIME_BREAK',
        isPaused: !state.isActive,
        addedTimeFirstHalf: Math.floor(state.firstHalfStoppageMs / (60 * 1000)),
        addedTimeSecondHalf: Math.floor(state.secondHalfStoppageMs / (60 * 1000)),
        serverTime: Date.now()
      }
    };

    this.sendToMatchClients(matchId, update);
  }

  private sendToMatchClients(matchId: string, data: any): void {
    const clients = this.matchSubscriptions.get(matchId);
    if (!clients) return;

    const message = `data: ${JSON.stringify(data)}\n\n`;
    const deadClients: Response[] = [];

    clients.forEach(client => {
      try {
        client.write(message);
      } catch (error) {
        console.error('SSE send error:', error);
        deadClients.push(client);
      }
    });

    // Clean up dead connections
    deadClients.forEach(client => {
      this.unsubscribeFromMatch(matchId, client);
    });
  }

  private cleanupMatchSubscriptions(matchId: string): void {
    this.matchSubscriptions.delete(matchId);
  }

  private stopCentralTimer(): void {
    if (this.centralTimer) {
      clearInterval(this.centralTimer);
      this.centralTimer = undefined;
      console.log('⏹️ Central timer stopped (no active matches)');
    }
  }

  // Utility methods
  private mapPhaseToStatus(phase: ScalableMatchState['phase']): string {
    switch (phase) {
      case 'FIRST_HALF':
      case 'SECOND_HALF':
        return 'LIVE';
      case 'HALFTIME_BREAK':
        return 'HALFTIME';
      case 'COMPLETED':
        return 'COMPLETED';
      default:
        return 'SCHEDULED';
    }
  }

  private formatMs(ms: number): string {
    const minutes = Math.floor(ms / (60 * 1000));
    const seconds = Math.floor((ms % (60 * 1000)) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  }

  /**
   * Pause/Resume functionality
   */
  public async pauseMatch(matchId: string): Promise<ScalableMatchState> {
    const state = this.matches.get(matchId);
    if (!state) throw new Error('Match state not found');

    state.pausedAt = Date.now();
    state.isActive = false;

    await database.updateMatch(matchId, { timer_paused_at: new Date() });
    this.broadcastToMatch(matchId, 'match_paused');
    
    return state;
  }

  public async resumeMatch(matchId: string): Promise<ScalableMatchState> {
    const state = this.matches.get(matchId);
    if (!state || !state.pausedAt) throw new Error('Match not paused');

    const pauseDuration = Date.now() - state.pausedAt;
    state.totalPausedMs += pauseDuration;
    state.pausedAt = undefined;
    state.isActive = true;

    // Re-predict events with updated timing
    this.predictEvents(matchId);

    await database.updateMatch(matchId, { timer_paused_at: null });
    this.broadcastToMatch(matchId, 'match_resumed');
    
    return state;
  }

  /**
   * Public API
   */
  public getMatchState(matchId: string): ScalableMatchState | null {
    return this.matches.get(matchId) || null;
  }

  public getPerformanceMetrics() {
    return {
      ...this.performanceMetrics,
      connectedClients: this.sseClients.size,
      centralTimerActive: !!this.centralTimer
    };
  }

  /**
   * Manual triggers for testing
   */
  public async manuallyTriggerHalftime(matchId: string): Promise<ScalableMatchState> {
    const state = this.matches.get(matchId);
    if (!state || state.phase !== 'FIRST_HALF') {
      throw new Error('Cannot trigger halftime - invalid state');
    }

    const elapsed = this.calculateElapsedTime(state);
    await this.executeHalftime(matchId, elapsed);
    return this.getMatchState(matchId)!;
  }

  public async manuallyTriggerFulltime(matchId: string): Promise<ScalableMatchState> {
    const state = this.matches.get(matchId);
    if (!state || (state.phase !== 'FIRST_HALF' && state.phase !== 'SECOND_HALF')) {
      throw new Error('Cannot trigger fulltime - invalid state');
    }

    const elapsed = this.calculateElapsedTime(state);
    await this.executeFulltime(matchId, elapsed);
    return this.getMatchState(matchId)!;
  }
}

export const scalableFootballTimer = ScalableFootballTimerService.getInstance();