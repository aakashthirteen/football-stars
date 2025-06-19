// Test the SimpleMatchTimer
const { simpleMatchTimer } = require('./dist/services/SimpleMatchTimer.js');

console.log('🧪 Testing SimpleMatchTimer...');

const testMatchId = 'test-match-' + Date.now();

// Listen for timer updates
simpleMatchTimer.on('timerUpdate', (update) => {
  console.log(`📡 Timer Update: ${update.matchId} - ${update.timerState.currentMinute}:${update.timerState.currentSecond.toString().padStart(2, '0')} (${update.type})`);
});

async function runTest() {
  try {
    console.log('1. Starting match timer...');
    const initialState = simpleMatchTimer.startMatch(testMatchId);
    console.log('Initial state:', initialState);
    
    console.log('2. Checking active matches...');
    const activeMatches = simpleMatchTimer.getActiveMatches();
    console.log('Active matches:', activeMatches);
    
    console.log('3. Timer will run for 30 seconds then auto-complete...');
    
    // Let it run for a bit
    setTimeout(() => {
      console.log('4. Checking current state...');
      const currentState = simpleMatchTimer.getState(testMatchId);
      console.log('Current state:', currentState);
    }, 10000); // Check after 10 seconds
    
    // Cleanup after 35 seconds
    setTimeout(() => {
      console.log('5. Cleaning up...');
      simpleMatchTimer.cleanup();
      console.log('✅ Simple timer test completed');
      process.exit(0);
    }, 35000);
    
  } catch (error) {
    console.error('❌ Simple timer test failed:', error);
    process.exit(1);
  }
}

runTest();