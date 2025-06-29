# Fix Second Half Timer - Complete Root Cause Solution

## Problem Summary
The timer is stuck at 2:00 because TypeScript doesn't know about the timer fields the server sends. The `Match` type definition is missing fields like `second_half_start_time`, so even though the server sends this data, TypeScript makes it inaccessible.

## Implementation Steps (IN THIS EXACT ORDER)

### Step 1: Update the Match Type Definition
**File**: `/football-app/src/types/index.ts`

Find the `Match` interface and ADD these fields after the existing fields:

```typescript
// Match types
export interface Match {
  // ... existing fields ...
  
  // ADD ALL THESE TIMER FIELDS:
  // Snake case versions (from server)
  timer_started_at?: string;
  second_half_start_time?: string;
  second_half_started_at?: string;
  halftime_started_at?: string;
  timer_paused_at?: string;
  total_paused_duration?: number;
  current_half?: 1 | 2;
  current_minute?: number;
  current_second?: number;
  added_time_first_half?: number;
  added_time_second_half?: number;
  first_half_minutes?: number;
  second_half_minutes?: number;
  total_seconds_at_halftime?: number;
  
  // Camel case versions (for consistency)
  timerStartedAt?: string;
  secondHalfStartTime?: string;
  secondHalfStartedAt?: string;
  currentHalf?: 1 | 2;
  currentMinute?: number;
  addedTimeFirstHalf?: number;
  addedTimeSecondHalf?: number;
}
```

Also update the status to include 'HALFTIME':
```typescript
status: 'SCHEDULED' | 'LIVE' | 'COMPLETED' | 'CANCELLED' | 'HALFTIME';
```

### Step 2: Create a Match Data Normalizer
**Create new file**: `/football-app/src/utils/matchDataNormalizer.ts`

```typescript
import { Match } from '../types';

/**
 * Normalizes match data from the server to ensure all timer fields are accessible
 * Handles both snake_case and camelCase field variations
 */
export function normalizeMatchData(rawMatch: any): Match {
  if (!rawMatch) return rawMatch;
  
  return {
    ...rawMatch,
    // Normalize timer fields - try all possible variations
    timerStartedAt: rawMatch.timer_started_at || rawMatch.timerStartedAt,
    
    // CRITICAL: Map second_half_start_time to secondHalfStartedAt
    secondHalfStartedAt: rawMatch.second_half_start_time || 
                        rawMatch.second_half_started_at || 
                        rawMatch.secondHalfStartTime ||
                        rawMatch.secondHalfStartedAt,
    
    currentHalf: rawMatch.current_half || rawMatch.currentHalf || 1,
    currentMinute: rawMatch.current_minute || rawMatch.currentMinute || 0,
    addedTimeFirstHalf: rawMatch.added_time_first_half || rawMatch.addedTimeFirstHalf || 0,
    addedTimeSecondHalf: rawMatch.added_time_second_half || rawMatch.addedTimeSecondHalf || 0,
    
    // Preserve original fields too
    timer_started_at: rawMatch.timer_started_at,
    second_half_start_time: rawMatch.second_half_start_time,
    second_half_started_at: rawMatch.second_half_started_at,
    current_half: rawMatch.current_half || 1,
    current_minute: rawMatch.current_minute || 0,
    added_time_first_half: rawMatch.added_time_first_half || 0,
    added_time_second_half: rawMatch.added_time_second_half || 0,
  };
}
```

### Step 3: Update LiveMatchScreen
**File**: `/football-app/src/screens/matches/LiveMatchScreen.tsx`

1. Add import at the top:
```typescript
import { normalizeMatchData } from '../../utils/matchDataNormalizer';
```

2. Update the `loadMatchData` function:
```typescript
const loadMatchData = async () => {
  try {
    setIsLoading(true);
    const response = await apiService.getMatchById(matchId);
    const rawMatchData = response?.match || response;
    
    // CRITICAL: Normalize the match data
    const normalizedMatch = normalizeMatchData(rawMatchData);
    
    // Debug logging to verify normalization
    console.log('📊 Match data normalization:', {
      raw_second_half_start_time: rawMatchData.second_half_start_time,
      normalized_secondHalfStartedAt: normalizedMatch.secondHalfStartedAt,
      current_half: normalizedMatch.currentHalf,
      status: normalizedMatch.status
    });
    
    setMatch(normalizedMatch);
    
    // If match is not live, redirect to ScheduledMatchScreen
    if (normalizedMatch.status === 'SCHEDULED') {
      console.log('🔄 Match is scheduled, redirecting to ScheduledMatchScreen');
      navigation.replace('ScheduledMatch', { matchId });
      return;
    }
    
    // If match is completed, redirect to MatchOverview
    if (normalizedMatch.status === 'COMPLETED') {
      console.log('🔄 Match is completed, redirecting to MatchOverview');
      navigation.replace('MatchOverview', { matchId });
      return;
    }
  } catch (error) {
    console.error('Failed to load match:', error);
  } finally {
    setIsLoading(false);
  }
};
```

3. Update the timer data mapping (around line 42):
```typescript
const timerData = useSimpleMatchTimer(match ? {
  id: match.id,
  status: match.status,
  duration: match.duration || 90,
  timerStartedAt: match.timerStartedAt,  // Use normalized field
  secondHalfStartedAt: match.secondHalfStartedAt,  // This will now have the value!
  currentHalf: match.currentHalf || 1,
  addedTimeFirstHalf: match.addedTimeFirstHalf || 0,
  addedTimeSecondHalf: match.addedTimeSecondHalf || 0,
} : null);
```

4. Update `handleStartSecondHalf` with better retry logic:
```typescript
const handleStartSecondHalf = async () => {
  try {
    console.log('⚽ Starting second half...');
    
    const response = await apiService.startSecondHalf(matchId);
    console.log('📡 Second half started:', response);
    
    // Reload data immediately
    await loadMatchData();
    
    // Keep reloading until we get the timestamp
    let attempts = 0;
    const checkInterval = setInterval(async () => {
      attempts++;
      
      const currentMatch = await apiService.getMatchById(matchId);
      const normalized = normalizeMatchData(currentMatch?.match || currentMatch);
      
      console.log(`🔄 Checking for timestamp (attempt ${attempts}):`, {
        has_timestamp: !!normalized.secondHalfStartedAt,
        timestamp: normalized.secondHalfStartedAt
      });
      
      if (normalized.secondHalfStartedAt || attempts >= 10) {
        clearInterval(checkInterval);
        setMatch(normalized);
        
        if (normalized.secondHalfStartedAt) {
          console.log('✅ Second half timestamp received!');
        } else {
          console.error('❌ Failed to get second half timestamp after 10 attempts');
        }
      }
    }, 500);
    
  } catch (error) {
    console.error('❌ Failed to start second half:', error);
    Alert.alert('Error', 'Failed to start second half. Please try again.');
  }
};
```

### Step 4: Update ProfessionalMatchCard
**File**: `/football-app/src/components/professional/ProfessionalMatchCard.tsx`

The match card should already work once the parent component passes normalized data. Just ensure the timer data uses the right fields:

```typescript
const timerData = useSimpleMatchTimer((match.status === 'LIVE' || match.status === 'HALFTIME') ? {
  id: match.id,
  status: match.status,
  duration: (match as any).duration || 90,
  timerStartedAt: (match as any).timerStartedAt || (match as any).timer_started_at,
  secondHalfStartedAt: (match as any).secondHalfStartedAt || 
                      (match as any).second_half_start_time ||
                      (match as any).second_half_started_at,
  currentHalf: (match as any).currentHalf || (match as any).current_half || 1,
  addedTimeFirstHalf: (match as any).addedTimeFirstHalf || (match as any).added_time_first_half || 0,
  addedTimeSecondHalf: (match as any).addedTimeSecondHalf || (match as any).added_time_second_half || 0,
} : null);
```

### Step 5: Clean Up Timer Service Error Handling
**File**: `/football-app/src/services/timerService.ts`

In the timer service, update the else block that handles missing second half timestamp (around line 99):

```typescript
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
```

## Expected Results
1. TypeScript will now recognize all timer fields
2. The normalizer ensures `secondHalfStartedAt` gets the value from `second_half_start_time`
3. Timer will progress past 2:00 in the second half
4. No more "timestamp missing" errors

## How to Verify It's Working
Check the console logs for:
```
📊 Match data normalization: {
  raw_second_half_start_time: "2025-06-28T13:30:27.475Z",
  normalized_secondHalfStartedAt: "2025-06-28T13:30:27.475Z",  // Should have value!
  current_half: 2,
  status: "LIVE"
}
```

The timer should now progress: 2:01, 2:02, 2:03...

This solution fixes the ROOT CAUSE - TypeScript now knows about the timer fields!