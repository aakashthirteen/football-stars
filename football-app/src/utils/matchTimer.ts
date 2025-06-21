/**
 * Shared Match Timer Utilities
 * Ensures consistent timer display across match cards and match screens
 */

export interface MatchTimerData {
  match: {
    id: string;
    status: 'LIVE' | 'SCHEDULED' | 'COMPLETED' | 'HALFTIME';
    duration?: number;
    timer_started_at?: string;
    match_date?: string;
    matchDate?: string;
    current_half?: number;
    added_time_first_half?: number;
    added_time_second_half?: number;
    second_half_start_time?: string;
    second_half_started_at?: string;
  };
  timerState?: {
    connectionStatus: 'connected' | 'disconnected';
    currentMinute: number;
    currentSecond: number;
    isHalftime: boolean;
  };
}

export interface TimerDisplayResult {
  minute: number;
  second: number;
  displayText: string; // e.g., "45'", "45+2'", "HT"
  isLive: boolean;
  isHalftime: boolean;
}

/**
 * Calculate the current timer values for a match
 * Uses the same logic as MatchScoringScreen to ensure consistency
 */
export function calculateMatchTimer(data: MatchTimerData): TimerDisplayResult {
  const { match, timerState } = data;
  
  const isLive = match.status === 'LIVE';
  const isHalftime = match.status === 'HALFTIME';
  const isCompleted = match.status === 'COMPLETED';
  
  // If we have SSE connection, use that data
  if (timerState?.connectionStatus === 'connected') {
    return {
      minute: timerState.currentMinute,
      second: timerState.currentSecond,
      displayText: formatTimerDisplay(timerState.currentMinute, timerState.currentSecond, match, timerState.isHalftime),
      isLive,
      isHalftime: timerState.isHalftime
    };
  }
  
  // Fallback calculation (same logic as MatchScoringScreen)
  if (isHalftime) {
    // During halftime, freeze at half duration + added time
    const halfDuration = (match.duration || 90) / 2;
    const minute = Math.floor(halfDuration + (match.added_time_first_half || 0));
    const second = Math.round(((halfDuration + (match.added_time_first_half || 0)) % 1) * 60);
    
    return {
      minute,
      second,
      displayText: 'HT',
      isLive: false,
      isHalftime: true
    };
  }
  
  if (isLive && match) {
    const currentHalf = match.current_half || 1;
    
    // Handle second half timing properly
    if (currentHalf === 2 && (match.second_half_start_time || match.second_half_started_at)) {
      // Second half: calculate from second half start time, starting from duration/2
      const halfDuration = (match.duration || 90) / 2;
      const secondHalfStartMinutes = Math.floor(halfDuration + (match.added_time_first_half || 0));
      const secondHalfStartSeconds = Math.round(((halfDuration + (match.added_time_first_half || 0)) % 1) * 60);
      
      const secondHalfStart = new Date(match.second_half_start_time || match.second_half_started_at).getTime();
      const secondHalfElapsed = Math.floor((Date.now() - secondHalfStart) / 1000);
      
      const totalSeconds = secondHalfStartSeconds + (secondHalfElapsed % 60);
      const minute = secondHalfStartMinutes + Math.floor(secondHalfElapsed / 60) + Math.floor(totalSeconds / 60);
      const second = totalSeconds % 60;
      
      return {
        minute,
        second,
        displayText: formatTimerDisplay(minute, second, match, false),
        isLive,
        isHalftime: false
      };
    } else {
      // First half: calculate from timer start
      const timerStart = new Date(match.timer_started_at || match.matchDate || match.match_date || 0).getTime();
      const elapsed = Date.now() - timerStart;
      const minute = Math.max(0, Math.floor(elapsed / 60000));
      const second = Math.floor((elapsed % 60000) / 1000);
      
      return {
        minute,
        second,
        displayText: formatTimerDisplay(minute, second, match, false),
        isLive,
        isHalftime: false
      };
    }
  }
  
  if (isCompleted) {
    return {
      minute: match.duration || 90,
      second: 0,
      displayText: 'FT',
      isLive: false,
      isHalftime: false
    };
  }
  
  // Scheduled match
  return {
    minute: 0,
    second: 0,
    displayText: formatDate(match.matchDate || match.match_date || ''),
    isLive: false,
    isHalftime: false
  };
}

/**
 * Format timer display like "45'", "45+2'", "HT", "FT"
 */
function formatTimerDisplay(minute: number, second: number, match: any, isHalftime: boolean): string {
  if (isHalftime) {
    return 'HT';
  }
  
  const currentHalf = match.current_half || 1;
  const addedTimeFirstHalf = match.added_time_first_half || 0;
  const addedTimeSecondHalf = match.added_time_second_half || 0;
  const halfDuration = (match.duration || 90) / 2;
  
  if (currentHalf === 1) {
    // First half
    const regularTime = Math.floor(halfDuration);
    if (minute <= regularTime) {
      return `${minute}'`;
    } else {
      const overtime = minute - regularTime;
      return `${regularTime}+${overtime}'`;
    }
  } else {
    // Second half
    const firstHalfTotal = Math.floor(halfDuration) + addedTimeFirstHalf;
    const secondHalfRegular = Math.floor(halfDuration);
    
    if (minute <= firstHalfTotal + secondHalfRegular) {
      return `${minute}'`;
    } else {
      const overtime = minute - firstHalfTotal - secondHalfRegular;
      return `${firstHalfTotal + secondHalfRegular}+${overtime}'`;
    }
  }
}

/**
 * Format date for scheduled matches
 */
function formatDate(dateString: string): string {
  try {
    const date = new Date(dateString);
    
    if (isNaN(date.getTime())) {
      return 'TBD';
    }
    
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    if (date.toDateString() === today.toDateString()) {
      return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    } else if (date.toDateString() === tomorrow.toDateString()) {
      return `Tomorrow`;
    } else if (date.toDateString() === yesterday.toDateString()) {
      return `Yesterday`;
    }
    
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric'
    });
  } catch (error) {
    return 'TBD';
  }
}