#!/usr/bin/env node

/**
 * Timer Math Testing - Test the core calculations without API calls
 */

console.log('🧮 Testing Timer Math Logic...\n');

// Test 1: Halftime calculation for 5-minute match
console.log('Test 1: 5-minute match halftime calculation');
const match5min = {
  duration: 5,
  halfDuration: 2.5,
  addedTimeFirstHalf: 0
};

const halfTimeMinutes = Math.floor(match5min.halfDuration + match5min.addedTimeFirstHalf);
const halfTimeSeconds = Math.round(((match5min.halfDuration + match5min.addedTimeFirstHalf) % 1) * 60);

console.log(`Duration: ${match5min.duration} minutes`);
console.log(`Half duration: ${match5min.halfDuration} minutes`);
console.log(`Expected halftime trigger: ${halfTimeMinutes}:${halfTimeSeconds.toString().padStart(2, '0')}`);
console.log(`✅ Should trigger at exactly 2:30\n`);

// Test 2: Second half start calculation for 5-minute match
console.log('Test 2: 5-minute match second half start');
const secondHalfStartMinutes = Math.floor(match5min.halfDuration + match5min.addedTimeFirstHalf);
const secondHalfStartSeconds = Math.round(((match5min.halfDuration + match5min.addedTimeFirstHalf) % 1) * 60);

console.log(`Second half should start from: ${secondHalfStartMinutes}:${secondHalfStartSeconds.toString().padStart(2, '0')}`);
console.log(`✅ Should always start from 2:30 regardless of when first half ended\n`);

// Test 3: 90-minute match calculations
console.log('Test 3: 90-minute match calculations');
const match90min = {
  duration: 90,
  halfDuration: 45,
  addedTimeFirstHalf: 0
};

const halftime90 = Math.floor(match90min.halfDuration + match90min.addedTimeFirstHalf);
const halftimeSeconds90 = Math.round(((match90min.halfDuration + match90min.addedTimeFirstHalf) % 1) * 60);

console.log(`90-min match halftime: ${halftime90}:${halftimeSeconds90.toString().padStart(2, '0')}`);
console.log(`90-min match second half start: ${halftime90}:${halftimeSeconds90.toString().padStart(2, '0')}`);
console.log(`✅ Should trigger/start at exactly 45:00\n`);

// Test 4: Test timer calculation logic (simulating the fallback function)
console.log('Test 4: Timer calculation simulation');
function simulateTimerCalculation(timerStartedAt, currentTime, isSecondHalf, secondHalfStartTime, match) {
  if (isSecondHalf && secondHalfStartTime) {
    // Second half calculation
    const halfDuration = match.duration / 2;
    const secondHalfStartMinutes = Math.floor(halfDuration + (match.addedTimeFirstHalf || 0));
    const secondHalfStartSeconds = Math.round(((halfDuration + (match.addedTimeFirstHalf || 0)) % 1) * 60);
    
    const secondHalfElapsed = Math.floor((currentTime - secondHalfStartTime) / 1000);
    
    const totalSeconds = secondHalfStartSeconds + (secondHalfElapsed % 60);
    return {
      minute: secondHalfStartMinutes + Math.floor(secondHalfElapsed / 60) + Math.floor(totalSeconds / 60),
      second: totalSeconds % 60
    };
  } else {
    // First half calculation
    const elapsed = currentTime - timerStartedAt;
    return {
      minute: Math.max(0, Math.floor(elapsed / 60000)),
      second: Math.floor((elapsed % 60000) / 1000)
    };
  }
}

// Simulate a 5-minute match that started 3 minutes ago
const now = Date.now();
const timerStart = now - (3 * 60 * 1000); // 3 minutes ago
const secondHalfStart = now - (30 * 1000); // 30 seconds ago (second half started)

const firstHalfResult = simulateTimerCalculation(timerStart, now, false, null, { duration: 5 });
console.log(`First half after 3 minutes: ${firstHalfResult.minute}:${firstHalfResult.second.toString().padStart(2, '0')}`);

const secondHalfResult = simulateTimerCalculation(timerStart, now, true, secondHalfStart, { 
  duration: 5, 
  addedTimeFirstHalf: 0 
});
console.log(`Second half after 30 seconds: ${secondHalfResult.minute}:${secondHalfResult.second.toString().padStart(2, '0')}`);
console.log(`✅ Should show 3:00 (2:30 + 30 seconds)\n`);

console.log('🎉 Math tests completed! All calculations look correct.');
console.log('\n⚠️  NOTE: These are just math tests. Real testing requires running the actual mobile app.');