// FIX 1: Update LiveMatchScreen to handle both field names
// File: /football-app/src/screens/matches/LiveMatchScreen.tsx
// Replace the timerData declaration with:

const timerData = useSimpleMatchTimer(match ? {
  id: match.id,
  status: match.status,
  duration: match.duration || 90,
  timerStartedAt: match.timer_started_at,
  // CRITICAL FIX: Check both field names for second half
  secondHalfStartedAt: match.second_half_started_at || match.second_half_start_time,
  currentHalf: match.current_half || 1,
  addedTimeFirstHalf: match.added_time_first_half || 0,
  addedTimeSecondHalf: match.added_time_second_half || 0,
} : null);

// Also add debug logging after timerData to see what we're passing:
useEffect(() => {
  if (match) {
    console.log('🔍 TIMER_DATA: Passing to timer:', {
      id: match.id,
      status: match.status,
      currentHalf: match.current_half,
      timerStartedAt: match.timer_started_at,
      secondHalfStartedAt: match.second_half_started_at || match.second_half_start_time,
      secondHalfStartTime: match.second_half_start_time,
      duration: match.duration
    });
  }
}, [match]);

// FIX 2: Update ProfessionalMatchCard to handle both field names
// File: /football-app/src/components/professional/ProfessionalMatchCard.tsx
// Replace the timerData declaration with:

const timerData = useSimpleMatchTimer((match.status === 'LIVE' || match.status === 'HALFTIME') ? {
  id: match.id,
  status: match.status,
  duration: (match as any).duration || 90,
  timerStartedAt: (match as any).timer_started_at,
  // CRITICAL FIX: Check both field names for second half
  secondHalfStartedAt: (match as any).second_half_started_at || (match as any).second_half_start_time,
  currentHalf: (match as any).current_half || 1,
  addedTimeFirstHalf: (match as any).added_time_first_half || 0,
  addedTimeSecondHalf: (match as any).added_time_second_half || 0,
} : null);

// FIX 3: Update the timer service to be more robust
// File: /football-app/src/services/timerService.ts
// In the updateTimer function, add more debug logging:

const updateTimer = () => {
  const now = Date.now();
  const halfDuration = matchData.duration / 2;
  
  // Add debug logging
  console.log('⏱️ TIMER_UPDATE:', {
    matchId: matchData.id,
    status: matchData.status,
    currentHalf: matchData.currentHalf,
    secondHalfStartedAt: matchData.secondHalfStartedAt,
    timerStartedAt: matchData.timerStartedAt
  });
  
  if (matchData.status === 'HALFTIME') {
    setTime({ 
      minutes: Math.floor(halfDuration), 
      seconds: Math.round((halfDuration % 1) * 60), 
      displayText: 'HT' 
    });
    return;
  }
  
  // Rest of the function remains the same...

// FIX 4: Update MatchesScreen to pass the correct field
// File: /football-app/src/screens/main/MatchesScreen.tsx
// In renderMatches, ensure we pass the second half field:

const matchCardData = {
  ...match, // This ensures ALL fields are passed
  // Add explicit mapping for timer fields
  timer_started_at: match.timer_started_at,
  second_half_started_at: match.second_half_started_at,
  second_half_start_time: match.second_half_start_time, // Include both field names
  // ... rest of the fields
};

// FIX 5: Quick patch for immediate testing
// If you want to test immediately without changing multiple files,
// just update the timer service to be more defensive:
// In timerService.ts, modify the second half check:

} else if (matchData.currentHalf === 2) {
  // DEFENSIVE: Check if we have second half start time
  if (!matchData.secondHalfStartedAt) {
    console.warn('⚠️ Second half but no start time, showing halftime');
    setTime({ 
      minutes: Math.floor(halfDuration), 
      seconds: Math.round((halfDuration % 1) * 60), 
      displayText: 'HT' 
    });
    return;
  }
  
  // Second half calculation continues...
}