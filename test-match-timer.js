// Test the MatchTimerService directly
const { matchTimerService } = require('./dist/services/MatchTimerService.js');

console.log('🧪 Testing MatchTimerService...');

// Create a test match ID
const testMatchId = 'test-match-123';

async function runTest() {
  try {
    console.log('1. Testing timer service singleton...');
    console.log('Timer service exists:', !!matchTimerService);
    
    console.log('2. Testing getMatchState for non-existent match...');
    const nonExistentState = matchTimerService.getMatchState(testMatchId);
    console.log('Non-existent match state:', nonExistentState);
    
    console.log('3. Testing active matches...');
    const activeMatches = matchTimerService.getActiveMatches();
    console.log('Active matches:', activeMatches);
    
    console.log('✅ Basic MatchTimerService test completed');
  } catch (error) {
    console.error('❌ MatchTimerService test failed:', error);
  }
}

runTest();