/**
 * Match Card Timer Hook
 * Provides timer data for match cards using either:
 * 1. New Global Timer Manager (if enabled)
 * 2. Old calculateMatchTimer utility (default)
 * 
 * This allows easy switching between timer systems
 */

import { useMemo, useEffect } from 'react';
import { calculateMatchTimer } from '../utils/matchTimer';
import { useMatchTimerFromGlobal, updateMatchTimerFromServer } from '../services/globalMatchTimerManager';
import { FeatureFlags } from '../config/featureFlags';

interface UseMatchCardTimerProps {
  match: any; // Match data object
}

export const useMatchCardTimer = ({ match }: UseMatchCardTimerProps) => {
  console.log(`🔍 MATCH CARD TIMER: Feature flag USE_GLOBAL_TIMER_MANAGER is:`, FeatureFlags.USE_GLOBAL_TIMER_MANAGER);
  
  const globalTimer = useMatchTimerFromGlobal(match.id);
  
  // Update global timer when match data changes (if using new system)
  useEffect(() => {
    console.log(`🔍 MATCH CARD TIMER: useEffect triggered for match ${match.id}`, {
      featureFlag: FeatureFlags.USE_GLOBAL_TIMER_MANAGER,
      matchStatus: match.status,
      shouldUpdate: FeatureFlags.USE_GLOBAL_TIMER_MANAGER && match.status === 'LIVE'
    });
    
    if (FeatureFlags.USE_GLOBAL_TIMER_MANAGER && match.status === 'LIVE') {
      console.log(`🎯 Match Card Timer Hook: Updating global timer for match ${match.id}`, {
        status: match.status,
        timerStartedAt: match.timer_started_at,
        secondHalfStartedAt: match.second_half_started_at
      });
      updateMatchTimerFromServer(match);
    }
  }, [match.id, match.status, match.timer_started_at, match.second_half_started_at]);
  
  // Calculate timer using old system
  const calculatedTimer = useMemo(() => {
    if (FeatureFlags.USE_GLOBAL_TIMER_MANAGER) {
      return null; // Not needed when using global timer
    }
    
    const result = calculateMatchTimer({ match });
    return {
      displayText: result.displayText,
      minute: result.minute,
      second: result.second
    };
  }, [match.status, match.matchDate, match.match_date, match.timer_started_at]);
  
  // Return appropriate timer based on feature flag
  if (FeatureFlags.USE_GLOBAL_TIMER_MANAGER) {
    return {
      displayText: globalTimer.displayText,
      minute: globalTimer.currentMinute,
      second: globalTimer.currentSecond,
      isLive: globalTimer.isLive,
      isHalftime: globalTimer.isHalftime,
      isCompleted: globalTimer.isCompleted,
      source: 'global' as const
    };
  } else {
    return {
      displayText: calculatedTimer?.displayText || '0\'',
      minute: calculatedTimer?.minute || 0,
      second: calculatedTimer?.second || 0,
      isLive: match.status === 'LIVE',
      isHalftime: match.status === 'HALFTIME',
      isCompleted: match.status === 'COMPLETED',
      source: 'calculated' as const
    };
  }
};