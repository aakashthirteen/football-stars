// Test the actual MatchTimerService with a simulated match
const { matchTimerService } = require('./dist/services/MatchTimerService.js');

console.log('🧪 Testing real MatchTimerService with simulated match...');

// Create a mock match for testing
const mockMatchId = 'test-match-' + Date.now();

async function runTimerTest() {
  try {
    console.log('1. Check initial state...');
    const initialState = matchTimerService.getMatchState(mockMatchId);
    console.log('Initial state:', initialState);
    
    console.log('2. Check active matches...');
    const activeMatches = matchTimerService.getActiveMatches();
    console.log('Active matches before start:', activeMatches);
    
    // Note: We can't test startMatch without a real database match
    // But we can test if the service is functioning
    
    console.log('3. Testing timer service methods...');
    console.log('Service has startMatch method:', typeof matchTimerService.startMatch === 'function');
    console.log('Service has getMatchState method:', typeof matchTimerService.getMatchState === 'function');
    console.log('Service has getActiveMatches method:', typeof matchTimerService.getActiveMatches === 'function');
    
    console.log('✅ Real timer service test completed');
    
    // The issue might be that we need a real match in the database to test startMatch
    console.log('💡 Next step: Test with actual database match or mock database calls');
    
  } catch (error) {
    console.error('❌ Real timer test failed:', error);
  }
}

runTimerTest();