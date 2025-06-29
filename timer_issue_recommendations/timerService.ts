// services/timerService.ts
import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';

interface TimerMatch {
  id: string;
  status: 'SCHEDULED' | 'LIVE' | 'HALFTIME' | 'COMPLETED';
  duration: number; // Total match duration in minutes
  startedAt?: number; // Unix timestamp when match started
  halfTimeStartedAt?: number; // Unix timestamp when halftime started
  secondHalfStartedAt?: number; // Unix timestamp when second half started
  pausedAt?: number; // Unix timestamp when paused
  totalPausedDuration: number; // Total paused time in ms
  currentHalf: 1 | 2;
  addedTimeFirstHalf: number;
  addedTimeSecondHalf: number;
  lastSync: number; // Last server sync timestamp
}

interface TimerState {
  matches: Map<string, TimerMatch>;
  tickInterval: NodeJS.Timeout | null;
  
  // Actions
  addMatch: (match: TimerMatch) => void;
  removeMatch: (matchId: string) => void;
  startMatch: (matchId: string) => void;
  pauseMatch: (matchId: string) => void;
  resumeMatch: (matchId: string) => void;
  startHalftime: (matchId: string) => void;
  startSecondHalf: (matchId: string) => void;
  endMatch: (matchId: string) => void;
  syncMatch: (matchId: string, serverData: Partial<TimerMatch>) => void;
  getMatchTime: (matchId: string) => { minutes: number; seconds: number; display: string } | null;
}

export const useTimerStore = create<TimerState>()(
  subscribeWithSelector((set, get) => ({
    matches: new Map(),
    tickInterval: null,
    
    addMatch: (match) => {
      const { matches } = get();
      matches.set(match.id, {
        ...match,
        totalPausedDuration: 0,
        lastSync: Date.now(),
      });
      set({ matches: new Map(matches) });
      
      // Start tick if not running
      if (!get().tickInterval) {
        get().startTick();
      }
    },
    
    removeMatch: (matchId) => {
      const { matches } = get();
      matches.delete(matchId);
      set({ matches: new Map(matches) });
      
      // Stop tick if no live matches
      if (![...matches.values()].some(m => m.status === 'LIVE')) {
        get().stopTick();
      }
    },
    
    startMatch: (matchId) => {
      const { matches } = get();
      const match = matches.get(matchId);
      if (!match) return;
      
      matches.set(matchId, {
        ...match,
        status: 'LIVE',
        startedAt: Date.now(),
        currentHalf: 1,
      });
      set({ matches: new Map(matches) });
    },
    
    pauseMatch: (matchId) => {
      const { matches } = get();
      const match = matches.get(matchId);
      if (!match || match.status !== 'LIVE') return;
      
      matches.set(matchId, {
        ...match,
        pausedAt: Date.now(),
      });
      set({ matches: new Map(matches) });
    },
    
    resumeMatch: (matchId) => {
      const { matches } = get();
      const match = matches.get(matchId);
      if (!match || !match.pausedAt) return;
      
      const pausedDuration = Date.now() - match.pausedAt;
      matches.set(matchId, {
        ...match,
        pausedAt: undefined,
        totalPausedDuration: match.totalPausedDuration + pausedDuration,
      });
      set({ matches: new Map(matches) });
    },
    
    startHalftime: (matchId) => {
      const { matches } = get();
      const match = matches.get(matchId);
      if (!match) return;
      
      matches.set(matchId, {
        ...match,
        status: 'HALFTIME',
        halfTimeStartedAt: Date.now(),
      });
      set({ matches: new Map(matches) });
    },
    
    startSecondHalf: (matchId) => {
      const { matches } = get();
      const match = matches.get(matchId);
      if (!match) return;
      
      matches.set(matchId, {
        ...match,
        status: 'LIVE',
        currentHalf: 2,
        secondHalfStartedAt: Date.now(),
      });
      set({ matches: new Map(matches) });
    },
    
    endMatch: (matchId) => {
      const { matches } = get();
      const match = matches.get(matchId);
      if (!match) return;
      
      matches.set(matchId, {
        ...match,
        status: 'COMPLETED',
      });
      set({ matches: new Map(matches) });
    },
    
    syncMatch: (matchId, serverData) => {
      const { matches } = get();
      const match = matches.get(matchId);
      if (!match) return;
      
      matches.set(matchId, {
        ...match,
        ...serverData,
        lastSync: Date.now(),
      });
      set({ matches: new Map(matches) });
    },
    
    getMatchTime: (matchId) => {
      const match = get().matches.get(matchId);
      if (!match || !match.startedAt) return null;
      
      const now = Date.now();
      const halfDurationMs = (match.duration / 2) * 60 * 1000;
      
      let elapsedMs = 0;
      let displayMinutes = 0;
      let displaySeconds = 0;
      
      if (match.status === 'HALFTIME') {
        // Show exact halftime
        displayMinutes = Math.floor(match.duration / 2);
        displaySeconds = Math.round((match.duration / 2 % 1) * 60);
        
        return {
          minutes: displayMinutes,
          seconds: displaySeconds,
          display: 'HT',
        };
      }
      
      if (match.currentHalf === 1) {
        // First half calculation
        elapsedMs = now - match.startedAt - match.totalPausedDuration;
        if (match.pausedAt) {
          elapsedMs -= (now - match.pausedAt);
        }
        
        // Check if we should auto-trigger halftime
        if (elapsedMs >= halfDurationMs + (match.addedTimeFirstHalf * 60 * 1000)) {
          // Auto-trigger halftime
          get().startHalftime(matchId);
          displayMinutes = Math.floor(match.duration / 2) + match.addedTimeFirstHalf;
          displaySeconds = 0;
        } else {
          const totalSeconds = Math.floor(elapsedMs / 1000);
          displayMinutes = Math.floor(totalSeconds / 60);
          displaySeconds = totalSeconds % 60;
        }
      } else if (match.currentHalf === 2 && match.secondHalfStartedAt) {
        // Second half calculation
        const secondHalfElapsed = now - match.secondHalfStartedAt - 
          (match.totalPausedDuration - (match.halfTimeStartedAt ? match.halfTimeStartedAt - match.startedAt : 0));
        
        if (match.pausedAt) {
          secondHalfElapsed -= (now - match.pausedAt);
        }
        
        const secondHalfSeconds = Math.floor(secondHalfElapsed / 1000);
        const halfMinutes = Math.floor(match.duration / 2);
        const halfSeconds = Math.round((match.duration / 2 % 1) * 60);
        
        const totalSeconds = (halfMinutes * 60 + halfSeconds) + secondHalfSeconds;
        displayMinutes = Math.floor(totalSeconds / 60);
        displaySeconds = totalSeconds % 60;
        
        // Check if match should end
        if (elapsedMs >= match.duration * 60 * 1000 + (match.addedTimeSecondHalf * 60 * 1000)) {
          get().endMatch(matchId);
        }
      }
      
      // Format display text for match cards
      let display = `${displayMinutes}'`;
      if (match.currentHalf === 1 && displayMinutes >= Math.floor(match.duration / 2)) {
        const addedMinutes = displayMinutes - Math.floor(match.duration / 2);
        if (addedMinutes > 0) {
          display = `${Math.floor(match.duration / 2)}+${addedMinutes}'`;
        }
      } else if (match.currentHalf === 2 && displayMinutes >= match.duration) {
        const addedMinutes = displayMinutes - match.duration;
        if (addedMinutes > 0) {
          display = `${match.duration}+${addedMinutes}'`;
        }
      }
      
      return {
        minutes: displayMinutes,
        seconds: displaySeconds,
        display,
      };
    },
    
    startTick: () => {
      const interval = setInterval(() => {
        // This just triggers subscribers, actual calculation happens in getMatchTime
        set({ matches: new Map(get().matches) });
      }, 1000);
      
      set({ tickInterval: interval });
    },
    
    stopTick: () => {
      const { tickInterval } = get();
      if (tickInterval) {
        clearInterval(tickInterval);
        set({ tickInterval: null });
      }
    },
  }))
);

// Hook for components to subscribe to a specific match
export function useMatchTimer(matchId: string) {
  const match = useTimerStore(state => state.matches.get(matchId));
  const getMatchTime = useTimerStore(state => state.getMatchTime);
  
  const time = getMatchTime(matchId);
  
  return {
    status: match?.status || 'SCHEDULED',
    currentHalf: match?.currentHalf || 1,
    minutes: time?.minutes || 0,
    seconds: time?.seconds || 0,
    displayText: time?.display || '0\'',
    isLive: match?.status === 'LIVE',
    isHalftime: match?.status === 'HALFTIME',
    isCompleted: match?.status === 'COMPLETED',
  };
}

// Server sync helper
export async function syncMatchWithServer(matchId: string, apiService: any) {
  try {
    const response = await apiService.getMatchById(matchId);
    const match = response.match;
    
    if (!match) return;
    
    useTimerStore.getState().syncMatch(matchId, {
      status: match.status,
      duration: match.duration || 90,
      startedAt: match.timer_started_at ? new Date(match.timer_started_at).getTime() : undefined,
      secondHalfStartedAt: match.second_half_started_at ? new Date(match.second_half_started_at).getTime() : undefined,
      currentHalf: match.current_half || 1,
      addedTimeFirstHalf: match.added_time_first_half || 0,
      addedTimeSecondHalf: match.added_time_second_half || 0,
    });
  } catch (error) {
    console.error('Failed to sync match with server:', error);
  }
}