import { EventEmitter } from 'events';

export interface TimerState {
  matchId: string;
  currentMinute: number;
  currentSecond: number;
  status: 'LIVE' | 'PAUSED' | 'COMPLETED';
  startTime: number; // Unix timestamp when timer started
}

export interface TimerUpdate {
  matchId: string;
  timerState: TimerState;
  type: 'UPDATE' | 'START' | 'PAUSE' | 'COMPLETE';
}

/**
 * Simple, reliable match timer - built from scratch
 * Core principle: Keep it simple and make it work first
 */
export class SimpleMatchTimer extends EventEmitter {
  private static instance: SimpleMatchTimer;
  private activeTimers: Map<string, NodeJS.Timeout> = new Map();
  private timerStates: Map<string, TimerState> = new Map();
  private readonly TICK_INTERVAL = 1000; // 1 second

  private constructor() {
    super();
    console.log('🚀 SimpleMatchTimer: Initialized');
  }

  public static getInstance(): SimpleMatchTimer {
    if (!SimpleMatchTimer.instance) {
      SimpleMatchTimer.instance = new SimpleMatchTimer();
    }
    return SimpleMatchTimer.instance;
  }

  /**
   * Start a match timer
   */
  public startMatch(matchId: string): TimerState {
    console.log(`⚽ SimpleTimer: Starting match ${matchId}`);

    // Stop existing timer if any
    this.stopMatch(matchId);

    // Create initial state
    const initialState: TimerState = {
      matchId,
      currentMinute: 0,
      currentSecond: 0,
      status: 'LIVE',
      startTime: Date.now()
    };

    // Store state
    this.timerStates.set(matchId, initialState);

    // Create timer
    const timer = setInterval(() => {
      this.tick(matchId);
    }, this.TICK_INTERVAL);

    // Store timer reference
    this.activeTimers.set(matchId, timer);

    console.log(`✅ SimpleTimer: Match ${matchId} started successfully`);
    
    // Emit start event
    this.emit('timerUpdate', {
      matchId,
      timerState: { ...initialState },
      type: 'START'
    } as TimerUpdate);

    return initialState;
  }

  /**
   * Timer tick - increment time
   */
  private tick(matchId: string): void {
    const state = this.timerStates.get(matchId);
    if (!state || state.status !== 'LIVE') {
      return;
    }

    // Increment time
    state.currentSecond++;
    if (state.currentSecond >= 60) {
      state.currentSecond = 0;
      state.currentMinute++;
    }

    // Update state
    this.timerStates.set(matchId, state);

    // Log progress (every 10 seconds to avoid spam)
    if (state.currentSecond % 10 === 0) {
      console.log(`⏱️ SimpleTimer: Match ${matchId} - ${state.currentMinute}:${state.currentSecond.toString().padStart(2, '0')}`);
    }

    // Emit update (every 5 seconds to reduce network traffic)
    if (state.currentSecond % 5 === 0) {
      this.emit('timerUpdate', {
        matchId,
        timerState: { ...state },
        type: 'UPDATE'
      } as TimerUpdate);
    }

    // Auto-complete after 2 minutes for testing
    if (state.currentMinute >= 2) {
      this.completeMatch(matchId);
    }
  }

  /**
   * Stop a match timer
   */
  public stopMatch(matchId: string): void {
    const timer = this.activeTimers.get(matchId);
    if (timer) {
      clearInterval(timer);
      this.activeTimers.delete(matchId);
      console.log(`🛑 SimpleTimer: Stopped timer for match ${matchId}`);
    }
  }

  /**
   * Complete a match
   */
  public completeMatch(matchId: string): void {
    const state = this.timerStates.get(matchId);
    if (!state) return;

    // Update state
    state.status = 'COMPLETED';
    this.timerStates.set(matchId, state);

    // Stop timer
    this.stopMatch(matchId);

    console.log(`🏁 SimpleTimer: Match ${matchId} completed at ${state.currentMinute}:${state.currentSecond.toString().padStart(2, '0')}`);

    // Emit completion
    this.emit('timerUpdate', {
      matchId,
      timerState: { ...state },
      type: 'COMPLETE'
    } as TimerUpdate);
  }

  /**
   * Get current state of a match
   */
  public getState(matchId: string): TimerState | null {
    return this.timerStates.get(matchId) || null;
  }

  /**
   * Get all active matches
   */
  public getActiveMatches(): string[] {
    return Array.from(this.activeTimers.keys());
  }

  /**
   * Cleanup all timers
   */
  public cleanup(): void {
    console.log('🧹 SimpleTimer: Cleaning up all timers');
    for (const [matchId] of this.activeTimers) {
      this.stopMatch(matchId);
    }
    this.timerStates.clear();
  }
}

// Export singleton
export const simpleMatchTimer = SimpleMatchTimer.getInstance();