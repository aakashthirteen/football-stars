// Test the complete simple timer system
const { simpleMatchTimer } = require('./dist/services/SimpleMatchTimer.js');
const { simpleWebSocketService } = require('./dist/services/SimpleWebSocketService.js');

console.log('🧪 Testing complete simple timer system...');

const testMatchId = 'integration-test-' + Date.now();

// Listen for timer updates
simpleMatchTimer.on('timerUpdate', (update) => {
  console.log(`📡 System Event: ${update.matchId} - ${update.timerState.currentMinute}:${update.timerState.currentSecond.toString().padStart(2, '0')} (${update.type})`);
});

async function runIntegrationTest() {
  try {
    console.log('1. Testing timer service...');
    const initialState = simpleMatchTimer.startMatch(testMatchId);
    console.log('✅ Timer started:', initialState);
    
    console.log('2. Testing WebSocket service stats...');
    const stats = simpleWebSocketService.getStats();
    console.log('✅ WebSocket stats:', stats);
    
    console.log('3. Running for 15 seconds to test timer progression...');
    
    // Check state after 5 seconds
    setTimeout(() => {
      const currentState = simpleMatchTimer.getState(testMatchId);
      console.log(`📊 After 5s: ${currentState?.currentMinute}:${currentState?.currentSecond.toString().padStart(2, '0')}`);
    }, 5000);
    
    // Check state after 10 seconds
    setTimeout(() => {
      const currentState = simpleMatchTimer.getState(testMatchId);
      console.log(`📊 After 10s: ${currentState?.currentMinute}:${currentState?.currentSecond.toString().padStart(2, '0')}`);
    }, 10000);
    
    // Cleanup after 15 seconds
    setTimeout(() => {
      console.log('4. Stopping test...');
      simpleMatchTimer.stopMatch(testMatchId);
      console.log('✅ Integration test completed successfully');
      process.exit(0);
    }, 15000);
    
  } catch (error) {
    console.error('❌ Integration test failed:', error);
    process.exit(1);
  }
}

runIntegrationTest();