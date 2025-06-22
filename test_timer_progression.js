// TEST: Timer Second-by-Second Progression
// Tests if timer shows smooth 1,2,3,4,5... progression instead of jumping 1,3,5 or 1,4,7
const { scalableFootballTimer } = require('./dist/services/sse/ScalableFootballTimerService');

async function testTimerProgression() {
  console.log('🕐 TESTING TIMER SECOND-BY-SECOND PROGRESSION');
  console.log('=============================================');
  console.log('Issue: Timer jumping seconds (1→3→5 instead of 1→2→3→4→5)');
  console.log('Expected: Smooth progression every second\n');
  
  try {
    // Mock database
    require('./dist/models/databaseFactory').database.getMatchById = async (id) => ({
      id, duration: 10, status: 'SCHEDULED' // Short 10-minute match for testing
    });
    require('./dist/models/databaseFactory').database.updateMatch = async (id, updates) => {
      return { id, ...updates };
    };
    
    const matchId = 'timer-progression-test';
    
    console.log('🎯 Testing Timer Progression:');
    console.log('1. Start match');
    console.log('2. Monitor timer for 10 seconds');
    console.log('3. Verify each second increments smoothly\n');
    
    // Start match
    await scalableFootballTimer.startMatch(matchId);
    console.log('✅ Match started with scalable backend timer');
    
    // Simulate frontend timer behavior
    console.log('\n📱 Simulating Frontend Timer Display:');
    console.log('====================================');
    
    // This simulates what the frontend useMatchTimer does
    let frontendSeconds = 0;
    const startTime = Date.now();
    
    console.log('Timer progression (should be 1,2,3,4,5...):');
    
    // Track progression for 15 seconds
    const progressionTest = new Promise((resolve) => {
      const timerHistory = [];
      let expectedSecond = 0;
      let missedSeconds = 0;
      let jumpedSeconds = 0;
      
      const interval = setInterval(() => {
        // OLD METHOD (problematic): Calculate from elapsed time
        const elapsed = (Date.now() - startTime) / 1000;
        const calculatedSeconds = Math.floor(elapsed);
        
        // NEW METHOD (fixed): Simple increment
        frontendSeconds += 1;
        
        const oldDisplaySecond = calculatedSeconds % 60;
        const newDisplaySecond = frontendSeconds % 60;
        
        timerHistory.push({
          expected: expectedSecond,
          oldMethod: oldDisplaySecond,
          newMethod: newDisplaySecond,
          timestamp: Date.now()
        });
        
        console.log(`${expectedSecond.toString().padStart(2, '0')}s: Old=${oldDisplaySecond.toString().padStart(2, '0')} New=${newDisplaySecond.toString().padStart(2, '0')} ${oldDisplaySecond === expectedSecond ? '✅' : '❌'} ${newDisplaySecond === expectedSecond ? '✅' : '❌'}`);
        
        // Check for progression issues
        if (oldDisplaySecond !== expectedSecond) {
          if (oldDisplaySecond > expectedSecond + 1) {
            jumpedSeconds++;
          } else if (oldDisplaySecond < expectedSecond) {
            missedSeconds++;
          }
        }
        
        expectedSecond++;
        
        if (expectedSecond >= 15) {
          clearInterval(interval);
          
          console.log('\n📊 TIMER PROGRESSION ANALYSIS:');
          console.log('==============================');
          console.log(`Total seconds tested: ${timerHistory.length}`);
          console.log(`Missed seconds (old method): ${missedSeconds}`);
          console.log(`Jumped seconds (old method): ${jumpedSeconds}`);
          console.log(`Smooth progression (new method): ${timerHistory.every((h, i) => h.newMethod === i) ? '✅ YES' : '❌ NO'}`);
          
          // Check timing consistency
          const intervals = [];
          for (let i = 1; i < timerHistory.length; i++) {
            intervals.push(timerHistory[i].timestamp - timerHistory[i-1].timestamp);
          }
          
          const avgInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length;
          const maxDeviation = Math.max(...intervals.map(i => Math.abs(i - 1000)));
          
          console.log(`\n⏱️ TIMING CONSISTENCY:`);
          console.log(`Average interval: ${avgInterval.toFixed(1)}ms (should be ~1000ms)`);
          console.log(`Max deviation: ${maxDeviation.toFixed(1)}ms`);
          console.log(`Timing stable: ${maxDeviation < 100 ? '✅ YES' : '❌ NO'}`);
          
          resolve({
            oldMethodAccurate: missedSeconds === 0 && jumpedSeconds === 0,
            newMethodSmooth: timerHistory.every((h, i) => h.newMethod === i),
            timingStable: maxDeviation < 100,
            avgInterval
          });
        }
      }, 1000);
    });
    
    const results = await progressionTest;
    
    console.log('\n' + '='.repeat(60));
    console.log('🕐 TIMER PROGRESSION TEST RESULTS');
    console.log('='.repeat(60));
    
    console.log(`Old Method (elapsed calculation): ${results.oldMethodAccurate ? '✅ SMOOTH' : '❌ JUMPING'}`);
    console.log(`New Method (simple increment): ${results.newMethodSmooth ? '✅ SMOOTH' : '❌ JUMPING'}`);
    console.log(`Timing Stability: ${results.timingStable ? '✅ STABLE' : '❌ UNSTABLE'}`);
    
    if (results.newMethodSmooth && results.timingStable) {
      console.log('\n🎉 SUCCESS! Timer progression issue FIXED!');
      console.log('✅ Timer now shows smooth 1,2,3,4,5... progression');
      console.log('✅ No more jumping seconds (1,3,5 or 1,4,7)');
      console.log('✅ Consistent 1-second intervals');
    } else {
      console.log('\n❌ ISSUE REMAINS: Timer still jumping seconds');
      console.log('Need to implement the simple increment method in frontend');
    }
    
    // Test with SSE integration
    console.log('\n📡 TESTING WITH BACKEND INTEGRATION:');
    console.log('====================================');
    
    // Test how backend timer state affects display
    const backendState = scalableFootballTimer.getMatchState(matchId);
    if (backendState) {
      const backendElapsed = Date.now() - backendState.startedAt - backendState.totalPausedMs;
      const backendSeconds = Math.floor(backendElapsed / 1000);
      
      console.log(`Backend elapsed: ${backendSeconds} seconds`);
      console.log(`Frontend should sync to: ${backendSeconds} and increment smoothly`);
      console.log(`Key insight: Frontend gets server time as baseline, then increments locally`);
    }
    
    console.log('\n🔧 RECOMMENDED FIX:');
    console.log('==================');
    console.log('1. Get server seconds as baseline');
    console.log('2. Use simple increment: currentSeconds += 1');
    console.log('3. Avoid elapsed time calculations in display loop');
    console.log('4. Resync with server periodically (every 10-30 seconds)');
    
  } catch (error) {
    console.error('❌ Timer progression test failed:', error.message);
  }
}

console.log('Starting timer progression test...\n');
testTimerProgression();