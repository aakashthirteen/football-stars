#!/usr/bin/env node

/**
 * Test Halftime Trigger Logic
 * Tests the exact scenarios that are failing in production
 */

// Mock the halftime trigger logic from SSEMatchTimerService
function shouldTriggerHalftime(state) {
  if (state.currentHalf !== 1 || state.status !== 'LIVE') return false;
  
  // Calculate exact halftime moment (same logic as SSE service)
  const halfTimeMinutes = Math.floor(state.halfDuration + state.addedTimeFirstHalf);
  const halfTimeSeconds = Math.round(((state.halfDuration + state.addedTimeFirstHalf) % 1) * 60);
  
  // NEW LOGIC: Use >= with total seconds comparison
  const targetTotalSeconds = (halfTimeMinutes * 60) + halfTimeSeconds;
  const currentTotalSeconds = (state.currentMinute * 60) + state.currentSecond;
  const shouldTrigger = currentTotalSeconds >= targetTotalSeconds;
  
  return shouldTrigger;
}

// Test the UI fix logic
function calculateIntendedHalftimeDisplay(state) {
  const intendedHalftimeMinutes = Math.floor(state.halfDuration + state.addedTimeFirstHalf);
  const intendedHalftimeSeconds = Math.round(((state.halfDuration + state.addedTimeFirstHalf) % 1) * 60);
  
  return {
    minutes: intendedHalftimeMinutes,
    seconds: intendedHalftimeSeconds,
    display: `${intendedHalftimeMinutes}:${intendedHalftimeSeconds.toString().padStart(2, '0')}`
  };
}

console.log('🧪 Testing Halftime Trigger Logic\n');

// Test Case 1: 5-minute match (working scenario)
console.log('=== TEST 1: 5-minute match (should work) ===');
const fiveMinState = {
  matchId: 'test-5min',
  currentHalf: 1,
  status: 'LIVE',
  halfDuration: 2.5, // 5 / 2 = 2.5
  addedTimeFirstHalf: 0,
  currentMinute: 2,
  currentSecond: 30
};

const fiveMinResult = shouldTriggerHalftime(fiveMinState);
const fiveMinDisplay = calculateIntendedHalftimeDisplay(fiveMinState);
console.log(`Current time: ${fiveMinState.currentMinute}:${fiveMinState.currentSecond.toString().padStart(2, '0')}`);
console.log(`Should trigger: ${fiveMinResult}`);
console.log(`Intended display: ${fiveMinDisplay.display}`);

// Test Case 2: 90-minute match with 1 min stoppage (failing scenario)
console.log('\n=== TEST 2: 90-minute match with 1 min stoppage (currently broken) ===');
const ninetyMinState = {
  matchId: 'test-90min',
  currentHalf: 1,
  status: 'LIVE',
  halfDuration: 45, // 90 / 2 = 45
  addedTimeFirstHalf: 1,
  currentMinute: 46,
  currentSecond: 0
};

const ninetyMinResult = shouldTriggerHalftime(ninetyMinState);
const ninetyMinDisplay = calculateIntendedHalftimeDisplay(ninetyMinState);
console.log(`Current time: ${ninetyMinState.currentMinute}:${ninetyMinState.currentSecond.toString().padStart(2, '0')}`);
console.log(`Should trigger: ${ninetyMinResult}`);
console.log(`Intended display: ${ninetyMinDisplay.display}`);

// Test Case 3: 90-minute match at 46:01 (missed exact timing)
console.log('\n=== TEST 3: 90-minute match at 46:01 (timing drift) ===');
const ninetyMinDrift = {
  ...ninetyMinState,
  currentSecond: 1
};

const driftResult = shouldTriggerHalftime(ninetyMinDrift);
const driftDisplay = calculateIntendedHalftimeDisplay(ninetyMinDrift);
console.log(`Current time: ${ninetyMinDrift.currentMinute}:${ninetyMinDrift.currentSecond.toString().padStart(2, '0')}`);
console.log(`Should trigger: ${driftResult}`);
console.log(`Intended display: ${driftDisplay.display}`);

// Test Case 4: 90-minute match at 45:59 (should not trigger yet)
console.log('\n=== TEST 4: 90-minute match at 45:59 (should not trigger) ===');
const beforeTrigger = {
  ...ninetyMinState,
  currentMinute: 45,
  currentSecond: 59
};

const beforeResult = shouldTriggerHalftime(beforeTrigger);
const beforeDisplay = calculateIntendedHalftimeDisplay(beforeTrigger);
console.log(`Current time: ${beforeTrigger.currentMinute}:${beforeTrigger.currentSecond.toString().padStart(2, '0')}`);
console.log(`Should trigger: ${beforeResult}`);
console.log(`Intended display: ${beforeDisplay.display}`);

console.log('\n🎯 SUMMARY:');
console.log(`✅ 5-min at 2:30: ${fiveMinResult ? 'TRIGGERS' : 'NO TRIGGER'}`);
console.log(`✅ 90-min at 46:00: ${ninetyMinResult ? 'TRIGGERS' : 'NO TRIGGER'}`);
console.log(`✅ 90-min at 46:01: ${driftResult ? 'TRIGGERS' : 'NO TRIGGER'} (drift protection)`);
console.log(`✅ 90-min at 45:59: ${beforeResult ? 'TRIGGERS' : 'NO TRIGGER'} (should be NO)`);

console.log('\n📱 UI DISPLAY TEST:');
console.log(`5-min match UI shows: ${fiveMinDisplay.display}`);
console.log(`90-min match UI shows: ${ninetyMinDisplay.display} (regardless of actual pause time)`);

if (fiveMinResult && ninetyMinResult && driftResult && !beforeResult) {
  console.log('\n🎉 ALL TESTS PASSED! Logic should work for all match durations.');
} else {
  console.log('\n❌ TESTS FAILED! Logic needs more work.');
}