// Comprehensive test to verify EXACT timing fixes
const axios = require('axios');
const EventSource = require('eventsource');

const API_URL = 'http://localhost:4001/api';
const SCENARIOS = [
  {
    name: "30-minute match with 4-minute stoppage",
    duration: 30,
    stoppage: 4,
    expectedHalftime: "19:00", // 15 + 4
    expectedSecondHalfStart: "15:00", // Always duration/2
    description: "This tests the exact scenario you mentioned"
  },
  {
    name: "6-minute match with 1-minute stoppage",
    duration: 6,
    stoppage: 1,
    expectedHalftime: "4:00", // 3 + 1
    expectedSecondHalfStart: "3:00", // Always duration/2
    description: "Quick test for rapid verification"
  },
  {
    name: "90-minute match with 3-minute stoppage",
    duration: 90,
    stoppage: 3,
    expectedHalftime: "48:00", // 45 + 3
    expectedSecondHalfStart: "45:00", // Always duration/2
    description: "Standard football match scenario"
  }
];

let currentScenario = 0;
let testResults = [];

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function createMatch(scenario) {
  try {
    // Create teams
    const team1 = await axios.post(`${API_URL}/teams`, {
      name: `${scenario.name} FC`,
      color: '#FF0000'
    });
    const team2 = await axios.post(`${API_URL}/teams`, {
      name: `Test United ${Date.now()}`,
      color: '#0000FF'
    });

    // Create match
    const match = await axios.post(`${API_URL}/matches`, {
      homeTeamId: team1.data.team.id,
      awayTeamId: team2.data.team.id,
      matchDate: new Date().toISOString(),
      venue: 'Precision Stadium',
      duration: scenario.duration
    });

    return match.data.match.id;
  } catch (error) {
    console.error('Failed to create match:', error.message);
    throw error;
  }
}

async function testScenario(scenario) {
  console.log(`\n${'='.repeat(80)}`);
  console.log(`🧪 TESTING: ${scenario.name.toUpperCase()}`);
  console.log(`📝 ${scenario.description}`);
  console.log(`⚽ Duration: ${scenario.duration} minutes`);
  console.log(`⏱️  Stoppage: ${scenario.stoppage} minutes`);
  console.log(`🎯 Expected halftime: ${scenario.expectedHalftime}`);
  console.log(`🔄 Expected 2nd half start: ${scenario.expectedSecondHalfStart}`);
  console.log(`${'='.repeat(80)}\n`);

  const result = {
    scenario: scenario.name,
    success: false,
    issues: [],
    actualHalftime: null,
    actualSecondHalfStart: null,
    halftimeOvershoot: null,
    secondHalfStartCorrect: false
  };

  try {
    const matchId = await createMatch(scenario);
    console.log(`✅ Match created: ${matchId}`);

    // Start match
    await axios.patch(`${API_URL}/matches/${matchId}/start`);
    console.log('✅ Match started');

    // Add stoppage time after 30 seconds
    console.log('\n⏳ Waiting 30 seconds before adding stoppage time...');
    await sleep(30000);

    console.log(`➕ Adding ${scenario.stoppage} minute(s) stoppage time...`);
    await axios.patch(`${API_URL}/sse/${matchId}/add-time-sse`, {
      minutes: scenario.stoppage
    });
    console.log('✅ Stoppage time added');

    // Monitor with SSE
    console.log(`\n📡 Monitoring timer (expecting halftime at ${scenario.expectedHalftime})...\n`);
    
    return new Promise((resolve) => {
      const sse = new EventSource(`${API_URL}/sse/${matchId}/timer-stream`);
      let halftimeDetected = false;
      let secondHalfDetected = false;
      
      const timeout = setTimeout(() => {
        console.log('⏰ Test timeout - resolving with current results');
        sse.close();
        resolve(result);
      }, (scenario.duration + 10) * 60 * 1000); // Extra time for safety
      
      sse.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          const { currentMinute, currentSecond, status, currentHalf, addedTimeFirstHalf } = data.state;
          const timeStr = `${currentMinute}:${currentSecond.toString().padStart(2, '0')}`;
          
          // Log every 30 seconds or important moments
          if (currentSecond === 0 && currentMinute % 1 === 0) {
            console.log(`⏱️  ${timeStr} - Status: ${status}, Half: ${currentHalf}, Stoppage: +${addedTimeFirstHalf}`);
          }
          
          // Check halftime trigger
          if (status === 'HALFTIME' && !halftimeDetected) {
            halftimeDetected = true;
            result.actualHalftime = timeStr;
            
            console.log(`\n🟨 HALFTIME TRIGGERED at ${timeStr}`);
            console.log(`🎯 Expected: ${scenario.expectedHalftime}`);
            
            // Calculate overshoot
            const [expectedMin, expectedSec] = scenario.expectedHalftime.split(':').map(Number);
            const expectedTotal = expectedMin * 60 + expectedSec;
            const actualTotal = currentMinute * 60 + currentSecond;
            const overshoot = actualTotal - expectedTotal;
            
            result.halftimeOvershoot = overshoot;
            
            if (timeStr === scenario.expectedHalftime) {
              console.log('✅ PERFECT: Halftime at exact expected time!');
            } else if (overshoot <= 1) {
              console.log(`✅ ACCEPTABLE: Halftime within 1 second (overshoot: ${overshoot}s)`);
            } else {
              console.log(`❌ FAILED: Halftime too late (overshoot: ${overshoot}s)`);
              result.issues.push(`Halftime overshoot: ${overshoot}s`);
            }
          }
          
          // Check second half start
          if (currentHalf === 2 && status === 'LIVE' && !secondHalfDetected) {
            secondHalfDetected = true;
            result.actualSecondHalfStart = timeStr;
            
            console.log(`\n⚽ SECOND HALF STARTED at ${timeStr}`);
            console.log(`🎯 Expected: ${scenario.expectedSecondHalfStart}`);
            
            if (timeStr === scenario.expectedSecondHalfStart) {
              console.log('✅ PERFECT: Second half starts at exact half duration!');
              result.secondHalfStartCorrect = true;
            } else {
              console.log(`❌ FAILED: Second half should start at ${scenario.expectedSecondHalfStart}, not ${timeStr}`);
              result.issues.push(`Second half started at ${timeStr} instead of ${scenario.expectedSecondHalfStart}`);
            }
            
            // End test after second half starts
            if (result.issues.length === 0) {
              result.success = true;
              console.log('\n🎉 ALL TESTS PASSED for this scenario!');
            } else {
              console.log('\n❌ Some tests failed for this scenario');
            }
            
            clearTimeout(timeout);
            sse.close();
            resolve(result);
          }
          
        } catch (error) {
          console.error('Error parsing SSE data:', error);
        }
      };
      
      sse.onerror = (error) => {
        console.error('❌ SSE Error:', error);
        clearTimeout(timeout);
        sse.close();
        result.issues.push('SSE connection failed');
        resolve(result);
      };
    });

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    result.issues.push(`Test setup failed: ${error.message}`);
    return result;
  }
}

async function runAllTests() {
  console.log('🚀 STARTING COMPREHENSIVE TIMING VERIFICATION TESTS');
  console.log('🎯 These tests verify that:');
  console.log('   1. Halftime triggers at EXACTLY duration/2 + stoppage time');
  console.log('   2. Second half starts at EXACTLY duration/2 (no stoppage)');
  console.log('   3. UI shows correct times (no overshoot beyond 1 second)');
  
  for (const scenario of SCENARIOS) {
    const result = await testScenario(scenario);
    testResults.push(result);
    
    if (SCENARIOS.indexOf(scenario) < SCENARIOS.length - 1) {
      console.log('\n⏳ Waiting 10 seconds before next test...\n');
      await sleep(10000);
    }
  }
  
  // Final report
  console.log('\n' + '='.repeat(80));
  console.log('📊 FINAL TEST RESULTS');
  console.log('='.repeat(80));
  
  let passedTests = 0;
  testResults.forEach((result, index) => {
    const status = result.success ? '✅ PASS' : '❌ FAIL';
    console.log(`\n${status} | ${result.scenario}`);
    
    if (result.actualHalftime) {
      console.log(`      Halftime: ${result.actualHalftime} (overshoot: ${result.halftimeOvershoot || 0}s)`);
    }
    
    if (result.actualSecondHalfStart) {
      console.log(`      2nd Half: ${result.actualSecondHalfStart} (correct: ${result.secondHalfStartCorrect})`);
    }
    
    if (result.issues.length > 0) {
      console.log(`      Issues: ${result.issues.join(', ')}`);
    }
    
    if (result.success) passedTests++;
  });
  
  console.log(`\n🏁 SUMMARY: ${passedTests}/${testResults.length} scenarios passed`);
  
  if (passedTests === testResults.length) {
    console.log('🎉 ALL TESTS PASSED! The timing system is now working correctly.');
  } else {
    console.log('⚠️  Some tests failed. The timing system needs further fixes.');
  }
  
  process.exit(passedTests === testResults.length ? 0 : 1);
}

console.log('⚠️  IMPORTANT: Make sure your server is running on localhost:4001');
console.log('Starting tests in 5 seconds...\n');

setTimeout(runAllTests, 5000);