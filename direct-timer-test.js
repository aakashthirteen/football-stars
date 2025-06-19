// Direct test of timer functionality - no WebSocket, no auth, no complexity
console.log('🔥 DIRECT TIMER TEST - Finding the real issue');

// Test 1: Basic setInterval works
console.log('Test 1: Basic JavaScript timer...');
let basicCounter = 0;
const basicTimer = setInterval(() => {
  basicCounter++;
  console.log(`✅ Basic timer: ${basicCounter} seconds`);
  if (basicCounter >= 3) {
    clearInterval(basicTimer);
    console.log('✅ Basic timer works fine');
    
    // Test 2: Can we import the timer service?
    console.log('\nTest 2: Import timer service...');
    try {
      const { matchTimerService } = require('./dist/services/MatchTimerService.js');
      console.log('✅ Timer service imported successfully');
      
      // Test 3: Can we call methods?
      console.log('\nTest 3: Timer service methods...');
      const activeMatches = matchTimerService.getActiveMatches();
      console.log('✅ getActiveMatches():', activeMatches);
      
      const testState = matchTimerService.getMatchState('non-existent');
      console.log('✅ getMatchState():', testState);
      
      console.log('\n🎯 CONCLUSION: Basic timer works, service loads');
      console.log('🔍 NEXT: Need to test if startMatch() actually creates a working timer');
      
    } catch (error) {
      console.error('❌ Timer service import failed:', error.message);
    }
  }
}, 1000);

// Auto-exit after 10 seconds
setTimeout(() => {
  clearInterval(basicTimer);
  console.log('\n🏁 Direct timer test completed');
  process.exit(0);
}, 10000);