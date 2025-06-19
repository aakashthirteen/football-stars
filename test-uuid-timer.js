// Test timer with proper UUID format
const { matchTimerService } = require('./dist/services/MatchTimerService.js');

console.log('🧪 UUID TIMER TEST - Testing with proper UUID format');

// Generate a proper UUID format (this match won't exist but the ID format will be valid)
const { v4: uuidv4 } = require('uuid');
const validUuid = uuidv4();

console.log('1. Testing with valid UUID format:', validUuid);

matchTimerService.startMatch(validUuid)
  .then(result => {
    console.log('✅ startMatch with UUID succeeded!', result);
    
    // Check if timer is running
    setTimeout(() => {
      const state = matchTimerService.getMatchState(validUuid);
      console.log('📊 Timer state after 3 seconds:', state);
      
      if (state) {
        console.log(`⏱️ Timer: ${state.currentMinute}:${state.currentSecond.toString().padStart(2, '0')}`);
      }
      
      setTimeout(() => {
        const state2 = matchTimerService.getMatchState(validUuid);
        console.log('📊 Timer state after 6 seconds:', state2);
        
        if (state2) {
          console.log(`⏱️ Timer: ${state2.currentMinute}:${state2.currentSecond.toString().padStart(2, '0')}`);
        }
        
        // Stop the timer
        matchTimerService.stopMatch(validUuid);
        console.log('✅ Timer test completed successfully');
        process.exit(0);
      }, 3000);
    }, 3000);
  })
  .catch(error => {
    console.error('❌ startMatch with UUID failed:', error.message);
    
    if (error.message.includes('Match not found')) {
      console.log('💡 This is expected - the UUID match doesn\'t exist in database');
      console.log('🎯 BUT if the error was about UUID format, that would be the real issue');
    }
    
    process.exit(1);
  });

// Auto-exit
setTimeout(() => {
  console.log('⏱️ Test timeout');
  process.exit(0);
}, 15000);