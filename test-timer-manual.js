// Manually test timer creation and increment
const { matchTimerService } = require('./dist/services/MatchTimerService.js');

console.log('🔧 MANUAL TIMER TEST - Bypassing database calls');

// Create a timer state manually (like the service does)
const testMatchId = 'manual-test-' + Date.now();

// Access private methods by testing the public interface
console.log('1. Testing if we can manually create timer logic...');

// Simulate what startMatch should do but without database
const mockTimerState = {
  matchId: testMatchId,
  currentMinute: 1,
  currentSecond: 0,
  status: 'LIVE',
  currentHalf: 1,
  addedTimeFirstHalf: 0,
  addedTimeSecondHalf: 0,
  isPaused: false,
  serverTime: Date.now(),
  isLive: true,
  isHalftime: false,
  automaticHalftimeTriggered: false,
  automaticFulltimeTriggered: false,
  matchDuration: 90,
  halfDuration: 45
};

console.log('2. Mock timer state created:', mockTimerState);

// Try to manually set the timer state in the service
try {
  // We can't access private matchStates directly, so let's test differently
  console.log('3. Current active matches:', matchTimerService.getActiveMatches());
  
  // The issue might be that startMatch() fails when calling database
  console.log('4. Let me check what happens when we try to start a match without a real database match...');
  
  // This will fail because the match doesn't exist in the database
  // But we'll see the exact error
  matchTimerService.startMatch(testMatchId)
    .then(result => {
      console.log('✅ startMatch succeeded!', result);
      
      // Check if timer is now active
      setTimeout(() => {
        const state = matchTimerService.getMatchState(testMatchId);
        console.log('📊 Timer state after 3 seconds:', state);
        
        setTimeout(() => {
          const state2 = matchTimerService.getMatchState(testMatchId);
          console.log('📊 Timer state after 6 seconds:', state2);
          process.exit(0);
        }, 3000);
      }, 3000);
    })
    .catch(error => {
      console.error('❌ startMatch failed:', error.message);
      console.log('🎯 THIS IS LIKELY THE REAL ISSUE!');
      console.log('💡 The timer fails to start because the database match lookup fails');
      process.exit(1);
    });
    
} catch (error) {
  console.error('❌ Manual test failed:', error);
}

// Auto-exit after 15 seconds
setTimeout(() => {
  console.log('⏱️ Test timeout reached');
  process.exit(0);
}, 15000);