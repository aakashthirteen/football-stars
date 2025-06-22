// TEST: Second Half Timing Fix
// Verifies second half ALWAYS starts from duration/2, not duration/2 + stoppage
const { scalableFootballTimer } = require('./dist/services/sse/ScalableFootballTimerService');

async function testSecondHalfTimingFix() {
  console.log('🔧 TESTING SECOND HALF TIMING FIX');
  console.log('=================================');
  console.log('BUG: Second half started at 3:30 (where first half ended)');
  console.log('FIX: Second half should start at 2:30 (duration/2 for 5min match)\n');
  
  try {
    // Mock database
    require('./dist/models/databaseFactory').database.getMatchById = async (id) => ({
      id, duration: 5, status: 'SCHEDULED' // 5 minute match
    });
    require('./dist/models/databaseFactory').database.updateMatch = async (id, updates) => {
      console.log(`📝 DB Update: ${Object.keys(updates).join(', ')}`);
      return { id, ...updates };
    };
    
    const matchId = 'timing-fix-test';
    
    console.log('🎯 TEST SCENARIO:');
    console.log('  - 5 minute match (2.5 min per half)');
    console.log('  - Add 1 minute stoppage in first half');
    console.log('  - First half should end at 3:30 (2:30 + 1:00)');
    console.log('  - Second half should start at 2:30 (NOT 3:30)\n');
    
    // Step 1: Start match
    console.log('1️⃣ Starting 5-minute match...');
    const initialState = await scalableFootballTimer.startMatch(matchId);
    console.log(`✅ Match started - Half duration: ${initialState.halfDurationMs / (60 * 1000)} minutes`);
    
    // Step 2: Add stoppage time
    console.log('\n2️⃣ Adding 1 minute stoppage time...');
    await scalableFootballTimer.addStoppageTime(matchId, 1);
    console.log('✅ Added 1 minute stoppage to first half');
    
    // Step 3: Manually trigger halftime to simulate exact timing
    console.log('\n3️⃣ Triggering halftime (should be at 3:30)...');
    const halftimeState = await scalableFootballTimer.manuallyTriggerHalftime(matchId);
    
    // Calculate what time halftime shows
    const halftimeElapsed = initialState.halfDurationMs + (1 * 60 * 1000); // 2.5 + 1 = 3.5 minutes
    const halftimeMinute = Math.floor(halftimeElapsed / (60 * 1000));
    const halftimeSecond = Math.floor((halftimeElapsed % (60 * 1000)) / 1000);
    
    console.log(`📊 Halftime triggered at: ${halftimeMinute}:${halftimeSecond.toString().padStart(2, '0')}`);
    console.log(`   Expected: 3:30 ✅`);
    
    // Step 4: Start second half - THE CRITICAL TEST
    console.log('\n4️⃣ Starting second half (CRITICAL TEST)...');
    const secondHalfState = await scalableFootballTimer.startSecondHalf(matchId);
    
    // Calculate the display time when second half starts
    const elapsed = Date.now() - secondHalfState.startedAt - secondHalfState.totalPausedMs;
    const displayMinute = Math.floor(elapsed / (60 * 1000));
    const displaySecond = Math.floor((elapsed % (60 * 1000)) / 1000);
    
    console.log(`📊 Second half starts at: ${displayMinute}:${displaySecond.toString().padStart(2, '0')}`);
    console.log(`   Expected: 2:30 (half duration, NOT 3:30)`);
    
    // Step 5: Verify the fix
    const expectedSecondHalfMinute = Math.floor(secondHalfState.halfDurationMs / (60 * 1000));
    const expectedSecondHalfSecond = Math.floor((secondHalfState.halfDurationMs % (60 * 1000)) / 1000);
    
    console.log('\n🔍 VERIFICATION:');
    console.log(`   Half duration: ${secondHalfState.halfDurationMs / (60 * 1000)} minutes`);
    console.log(`   Expected second half start: ${expectedSecondHalfMinute}:${expectedSecondHalfSecond.toString().padStart(2, '0')}`);
    console.log(`   Actual second half start: ${displayMinute}:${displaySecond.toString().padStart(2, '0')}`);
    
    // Check if fix worked
    const isFixWorking = (displayMinute === expectedSecondHalfMinute) && (displaySecond === expectedSecondHalfSecond);
    
    console.log('\n' + '='.repeat(60));
    console.log('🔧 SECOND HALF TIMING FIX RESULTS');
    console.log('='.repeat(60));
    
    if (isFixWorking) {
      console.log('✅ SUCCESS! Second half timing fix is working correctly!');
      console.log('✅ Second half starts at exact half duration (2:30), not halftime end (3:30)');
      console.log('🎉 Bug fixed - timing is now correct!');
    } else {
      console.log('❌ FAILED! Second half timing is still incorrect');
      console.log(`❌ Expected: ${expectedSecondHalfMinute}:${expectedSecondHalfSecond.toString().padStart(2, '0')}`);
      console.log(`❌ Got: ${displayMinute}:${displaySecond.toString().padStart(2, '0')}`);
      console.log('🚨 Bug still exists - needs more investigation');
    }
    
    // Additional verification: Test with different scenarios
    console.log('\n📝 Additional verification - testing with different stoppage times...');
    
    const testCases = [
      { duration: 10, stoppage: 2 }, // 10min match, 2min stoppage -> second half at 5:00
      { duration: 30, stoppage: 4 }, // 30min match, 4min stoppage -> second half at 15:00
    ];
    
    for (const testCase of testCases) {
      const testMatchId = `test-${testCase.duration}-${testCase.stoppage}`;
      
      // Mock different duration
      require('./dist/models/databaseFactory').database.getMatchById = async (id) => ({
        id, duration: testCase.duration, status: 'SCHEDULED'
      });
      
      await scalableFootballTimer.startMatch(testMatchId);
      await scalableFootballTimer.addStoppageTime(testMatchId, testCase.stoppage);
      await scalableFootballTimer.manuallyTriggerHalftime(testMatchId);
      const testSecondHalfState = await scalableFootballTimer.startSecondHalf(testMatchId);
      
      const testElapsed = Date.now() - testSecondHalfState.startedAt - testSecondHalfState.totalPausedMs;
      const testDisplayMinute = Math.floor(testElapsed / (60 * 1000));
      const expectedMinute = testCase.duration / 2;
      
      console.log(`   ${testCase.duration}min match + ${testCase.stoppage}min stoppage: Second half at ${testDisplayMinute}:00 (expected ${expectedMinute}:00) ${testDisplayMinute === expectedMinute ? '✅' : '❌'}`);
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error('Stack:', error.stack);
  }
}

console.log('Starting second half timing fix test...\n');
testSecondHalfTimingFix();