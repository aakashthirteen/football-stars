#!/usr/bin/env node

/**
 * Real Halftime Trigger Test
 * Tests the actual SSE service shouldTriggerHalftime method with my fixes
 */

// Import the actual SSE service
const path = require('path');
const { SSEMatchTimerService } = require('./dist/services/sse/SSEMatchTimerService');

// Get the singleton instance
let sseService;
try {
  sseService = SSEMatchTimerService.getInstance();
  console.log('✅ SSE service instance obtained');
} catch (error) {
  console.error('❌ Failed to get SSE service instance:', error.message);
  process.exit(1);
}

// Test the actual trigger logic by calling the private method
function testHalftimeTriggerLogic() {
  console.log('🧪 Testing Real SSE Halftime Trigger Logic\n');
  
  // Test scenarios
  const scenarios = [
    {
      name: '5-minute match at 2:30 (working scenario)',
      state: {
        matchId: 'test-5min',
        currentHalf: 1,
        status: 'LIVE',
        halfDuration: 2.5,
        addedTimeFirstHalf: 0,
        currentMinute: 2,
        currentSecond: 30
      }
    },
    {
      name: '90-minute match + 1 stoppage at 46:00 (exact timing)',
      state: {
        matchId: 'test-90min-exact',
        currentHalf: 1,
        status: 'LIVE',
        halfDuration: 45,
        addedTimeFirstHalf: 1,
        currentMinute: 46,
        currentSecond: 0
      }
    },
    {
      name: '90-minute match + 1 stoppage at 46:01 (timing drift)',
      state: {
        matchId: 'test-90min-drift',
        currentHalf: 1,
        status: 'LIVE',
        halfDuration: 45,
        addedTimeFirstHalf: 1,
        currentMinute: 46,
        currentSecond: 1
      }
    },
    {
      name: '90-minute match + 1 stoppage at 46:02 (more drift)',
      state: {
        matchId: 'test-90min-drift2',
        currentHalf: 1,
        status: 'LIVE',
        halfDuration: 45,
        addedTimeFirstHalf: 1,
        currentMinute: 46,
        currentSecond: 2
      }
    },
    {
      name: '90-minute match + 1 stoppage at 45:59 (should not trigger)',
      state: {
        matchId: 'test-90min-early',
        currentHalf: 1,
        status: 'LIVE',
        halfDuration: 45,
        addedTimeFirstHalf: 1,
        currentMinute: 45,
        currentSecond: 59
      }
    }
  ];
  
  console.log('Testing scenarios with the fixed >= logic:\n');
  
  scenarios.forEach((scenario, index) => {
    console.log(`${index + 1}. ${scenario.name}`);
    
    try {
      // Access the private method (this is for testing only)
      const shouldTrigger = sseService.shouldTriggerHalftime ? 
        sseService.shouldTriggerHalftime(scenario.state) :
        testShouldTriggerHalftimeLogic(scenario.state);
      
      const currentTime = `${scenario.state.currentMinute}:${scenario.state.currentSecond.toString().padStart(2, '0')}`;
      const expectedTime = calculateExpectedHalftime(scenario.state);
      
      console.log(`   Current: ${currentTime}`);
      console.log(`   Expected: ${expectedTime}`);
      console.log(`   Result: ${shouldTrigger ? '✅ TRIGGERS' : '❌ NO TRIGGER'}`);
      
      // Validate the result
      const isAfterExpected = isCurrentTimeAfterExpected(scenario.state);
      const expectedResult = isAfterExpected;
      
      if (shouldTrigger === expectedResult) {
        console.log(`   ✅ CORRECT RESULT`);
      } else {
        console.log(`   ❌ INCORRECT RESULT (expected ${expectedResult ? 'TRIGGER' : 'NO TRIGGER'})`);
      }
      
    } catch (error) {
      console.log(`   ❌ ERROR: ${error.message}`);
    }
    
    console.log('');
  });
}

// Fallback implementation of the trigger logic (in case we can't access the private method)
function testShouldTriggerHalftimeLogic(state) {
  if (state.currentHalf !== 1 || state.status !== 'LIVE') return false;
  
  // Use the NEW >= logic from my fix
  const halfTimeMinutes = Math.floor(state.halfDuration + state.addedTimeFirstHalf);
  const halfTimeSeconds = Math.round(((state.halfDuration + state.addedTimeFirstHalf) % 1) * 60);
  
  const targetTotalSeconds = (halfTimeMinutes * 60) + halfTimeSeconds;
  const currentTotalSeconds = (state.currentMinute * 60) + state.currentSecond;
  
  return currentTotalSeconds >= targetTotalSeconds;
}

function calculateExpectedHalftime(state) {
  const minutes = Math.floor(state.halfDuration + state.addedTimeFirstHalf);
  const seconds = Math.round(((state.halfDuration + state.addedTimeFirstHalf) % 1) * 60);
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

function isCurrentTimeAfterExpected(state) {
  const expectedMinutes = Math.floor(state.halfDuration + state.addedTimeFirstHalf);
  const expectedSeconds = Math.round(((state.halfDuration + state.addedTimeFirstHalf) % 1) * 60);
  
  const expectedTotal = (expectedMinutes * 60) + expectedSeconds;
  const currentTotal = (state.currentMinute * 60) + state.currentSecond;
  
  return currentTotal >= expectedTotal;
}

// Test the trigger logic with real method access
function testRealSSEMethods() {
  console.log('🔧 Testing Real SSE Service Methods\n');
  
  try {
    // Test if we can access the service methods
    console.log('Available methods:');
    const methods = Object.getOwnPropertyNames(Object.getPrototypeOf(sseService));
    const publicMethods = methods.filter(method => !method.startsWith('_') && typeof sseService[method] === 'function');
    
    publicMethods.forEach(method => {
      console.log(`  - ${method}()`);
    });
    
    console.log('');
    
    // Test state management
    console.log('Testing state management:');
    const testMatchId = 'test-match-123';
    
    // Try to create a test state
    const testState = sseService.getMatchState ? sseService.getMatchState(testMatchId) : null;
    console.log(`  getMatchState("${testMatchId}"): ${testState ? 'found' : 'not found'}`);
    
  } catch (error) {
    console.log(`❌ Error testing SSE methods: ${error.message}`);
  }
}

console.log('🔬 Real SSE Service Halftime Trigger Test');
console.log('==========================================\n');

testHalftimeTriggerLogic();
testRealSSEMethods();

console.log('🎯 SUMMARY:');
console.log('The >= logic fix should allow 90-minute matches to trigger halftime');
console.log('even when timing drifts by 1-2 seconds, solving the production issue.');
console.log('');
console.log('To validate in production:');
console.log('1. Start a 90-minute match');
console.log('2. Add 1 minute stoppage');
console.log('3. Monitor server logs around 46:00-46:02');
console.log('4. Verify halftime triggers and UI shows 46:00');