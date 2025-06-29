// services/timerService.ts
import { useState, useEffect, useRef } from 'react';

// Simple timer data structure
interface MatchTimerData {
  id: string;
  status: 'SCHEDULED' | 'LIVE' | 'HALFTIME' | 'COMPLETED';
  duration: number; // minutes
  timerStartedAt?: string;
  secondHalfStartedAt?: string;
  currentHalf: 1 | 2;
  addedTimeFirstHalf: number;
  addedTimeSecondHalf: number;
}

export function useSimpleMatchTimer(matchData: MatchTimerData | null) {
  const [time, setTime] = useState({ minutes: 0, seconds: 0, displayText: '0\'' });
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  
  useEffect(() => {
    // Clear any existing interval
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    
    // No timer needed if no match data or not live
    if (!matchData || (matchData.status !== 'LIVE' && matchData.status !== 'HALFTIME')) {
      if (matchData?.status === 'COMPLETED') {
        setTime({ minutes: matchData.duration, seconds: 0, displayText: 'FT' });
      } else if (matchData?.status === 'HALFTIME') {
        const halfDuration = matchData.duration / 2;
        setTime({ 
          minutes: Math.floor(halfDuration), 
          seconds: Math.round((halfDuration % 1) * 60), 
          displayText: 'HT' 
        });
      } else {
        setTime({ minutes: 0, seconds: 0, displayText: '0\'' });
      }
      return;
    }
    
    // Function to calculate current time
    const updateTimer = () => {
      const now = Date.now();
      const halfDuration = matchData.duration / 2;
      
      
      if (matchData.currentHalf === 1 && matchData.timerStartedAt) {
        // First half
        const startTime = new Date(matchData.timerStartedAt).getTime();
        const elapsed = Math.max(0, now - startTime);
        const totalSeconds = Math.floor(elapsed / 1000);
        const minutes = Math.floor(totalSeconds / 60);
        const seconds = totalSeconds % 60;
        
        // Check if should be halftime
        const halfDurationMinutes = Math.floor(halfDuration);
        const halfDurationSeconds = Math.round((halfDuration % 1) * 60);
        const halfTotalSeconds = halfDurationMinutes * 60 + halfDurationSeconds + (matchData.addedTimeFirstHalf * 60);
        
        if (totalSeconds >= halfTotalSeconds) {
          setTime({ 
            minutes: halfDurationMinutes + matchData.addedTimeFirstHalf, 
            seconds: 0, 
            displayText: 'HT' 
          });
        } else {
          // FIXED: Calculate display text properly for extra time
          let displayText = '';
          
          if (minutes >= halfDurationMinutes) {
            // We're in extra time
            const extraMinutes = minutes - halfDurationMinutes;
            // For match cards in extra time, we DON'T add 1 to the extra minutes
            displayText = `${halfDurationMinutes}+${extraMinutes + 1}'`;
          } else {
            // Regular time - for match cards, show ceiling of minutes
            const displayMinute = seconds > 0 ? minutes + 1 : Math.max(1, minutes);
            displayText = `${displayMinute}'`;
          }
          
          setTime({ minutes, seconds, displayText });
        }
      } else if (matchData.currentHalf === 2 && matchData.secondHalfStartedAt) {
        // Second half
        const secondHalfStart = new Date(matchData.secondHalfStartedAt).getTime();
        const secondHalfElapsed = Math.max(0, now - secondHalfStart);
        const secondHalfTotalSeconds = Math.floor(secondHalfElapsed / 1000);
        
        // Start from half duration
        const halfMinutes = Math.floor(halfDuration);
        const halfSeconds = Math.round((halfDuration % 1) * 60);
        const totalSeconds = (halfMinutes * 60 + halfSeconds) + secondHalfTotalSeconds;
        const minutes = Math.floor(totalSeconds / 60);
        const seconds = totalSeconds % 60;
        
        // FIXED: Calculate display text properly for second half
        let displayText = '';
        
        if (minutes >= matchData.duration) {
            // We're in extra time of second half
            const extraMinutes = minutes - matchData.duration;
            displayText = `${matchData.duration}+${extraMinutes + 1}'`;
        } else {
            // Regular second half time - for match cards, show ceiling of minutes
            const displayMinute = seconds > 0 ? minutes + 1 : minutes;
            displayText = `${displayMinute}'`;
        }
        
        setTime({ minutes, seconds, displayText });
      } else if (matchData.currentHalf === 2 && !matchData.secondHalfStartedAt) {
        // This should rarely happen now that we're normalizing data
        console.error('⚠️ Second half but no timestamp provided!', {
          status: matchData.status,
          currentHalf: matchData.currentHalf,
          secondHalfStartedAt: matchData.secondHalfStartedAt
        });
        
        // Show the half duration as fallback
        const halfMinutes = Math.floor(matchData.duration / 2);
        setTime({ 
          minutes: halfMinutes, 
          seconds: 0, 
          displayText: `${halfMinutes}'` 
        });
      }
    };
    
    // Update immediately
    updateTimer();
    
    // Then update every second
    intervalRef.current = setInterval(updateTimer, 1000);
    
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [matchData?.id, matchData?.status, matchData?.timerStartedAt, matchData?.secondHalfStartedAt, matchData?.currentHalf, matchData?.duration, matchData?.addedTimeFirstHalf]);
  
  return {
    minutes: time.minutes,
    seconds: time.seconds,
    displayText: time.displayText,
    displayTime: `${time.minutes}:${String(time.seconds).padStart(2, '0')}`,
    isLive: matchData?.status === 'LIVE',
    isHalftime: matchData?.status === 'HALFTIME',
    currentHalf: matchData?.currentHalf || 1
  };
}