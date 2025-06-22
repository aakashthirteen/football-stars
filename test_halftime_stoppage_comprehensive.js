// Comprehensive test for halftime with stoppage time
const axios = require('axios');
const EventSource = require('eventsource');

const API_URL = 'http://localhost:4001/api';
const AUTH_TOKEN = 'test-token'; // Replace with actual token

// Test configuration
const TESTS = [
  { duration: 6, stoppage: 1, expectedHalftime: '3:00', withStoppageHalftime: '4:00' },
  { duration: 10, stoppage: 2, expectedHalftime: '5:00', withStoppageHalftime: '7:00' },
  { duration: 90, stoppage: 3, expectedHalftime: '45:00', withStoppageHalftime: '48:00' },
];

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function createTeamsAndMatch(duration) {
  // Create teams
  const team1 = await axios.post(`${API_URL}/teams`, {
    name: `Test FC ${Date.now()}`,
    color: '#FF0000'
  }, {
    headers: { Authorization: `Bearer ${AUTH_TOKEN}` }
  });

  const team2 = await axios.post(`${API_URL}/teams`, {
    name: `United ${Date.now()}`,
    color: '#0000FF'
  }, {
    headers: { Authorization: `Bearer ${AUTH_TOKEN}` }
  });

  // Create match
  const match = await axios.post(`${API_URL}/matches`, {
    homeTeamId: team1.data.team.id,
    awayTeamId: team2.data.team.id,
    matchDate: new Date().toISOString(),
    venue: 'Test Stadium',
    duration: duration
  }, {
    headers: { Authorization: `Bearer ${AUTH_TOKEN}` }
  });

  return match.data.match.id;
}

async function testHalftimeWithStoppage(testConfig) {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`🧪 Testing ${testConfig.duration}-minute match with ${testConfig.stoppage}-minute stoppage`);
  console.log(`${'='.repeat(60)}\n`);

  try {
    const matchId = await createTeamsAndMatch(testConfig.duration);
    console.log(`✅ Match created: ${matchId}`);

    // Start match
    await axios.patch(`${API_URL}/matches/${matchId}/start`, {}, {
      headers: { Authorization: `Bearer ${AUTH_TOKEN}` }
    });
    console.log('✅ Match started');

    // Add stoppage time after 30 seconds
    console.log('\n⏳ Waiting 30 seconds before adding stoppage time...');
    await sleep(30000);

    console.log(`\n➕ Adding ${testConfig.stoppage} minute(s) stoppage time...`);
    const stoppageResponse = await axios.patch(`${API_URL}/sse/${matchId}/add-time-sse`, {
      minutes: testConfig.stoppage
    }, {
      headers: { Authorization: `Bearer ${AUTH_TOKEN}` }
    });
    console.log('✅ Stoppage time added via SSE endpoint');
    console.log('📊 Timer state after adding stoppage:', {
      currentTime: `${stoppageResponse.data.timerState.currentMinute}:${stoppageResponse.data.timerState.currentSecond.toString().padStart(2, '0')}`,
      addedTimeFirstHalf: stoppageResponse.data.timerState.addedTimeFirstHalf
    });

    // Monitor timer
    console.log(`\n📡 Monitoring timer (expecting halftime at ${testConfig.withStoppageHalftime})...\n`);
    
    return new Promise((resolve, reject) => {
      const sse = new EventSource(`${API_URL}/sse/${matchId}/timer-stream`, {
        headers: { Authorization: `Bearer ${AUTH_TOKEN}` }
      });
      
      let lastLoggedMinute = -1;
      let halftimeDetected = false;
      
      sse.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          const { currentMinute, currentSecond, status, addedTimeFirstHalf } = data.state;
          
          // Log every 30 seconds or important moments
          const totalSeconds = currentMinute * 60 + currentSecond;
          if (totalSeconds % 30 === 0 && totalSeconds !== lastLoggedMinute * 60) {
            console.log(`⏱️  ${currentMinute}:${currentSecond.toString().padStart(2, '0')} - Status: ${status}, Stoppage: +${addedTimeFirstHalf}`);
            lastLoggedMinute = currentMinute;
          }
          
          // Check if we're approaching halftime
          const expectedHalftimeMinutes = testConfig.duration / 2 + testConfig.stoppage;
          if (currentMinute >= expectedHalftimeMinutes - 1 && !halftimeDetected) {
            console.log(`\n🎯 Approaching halftime (${expectedHalftimeMinutes}:00)...`);
            console.log(`⏱️  ${currentMinute}:${currentSecond.toString().padStart(2, '0')} - Waiting for trigger...`);
          }
          
          // Halftime detected
          if (status === 'HALFTIME' && !halftimeDetected) {
            halftimeDetected = true;
            console.log(`\n${'🟨'.repeat(30)}`);
            console.log(`HALFTIME TRIGGERED at ${currentMinute}:${currentSecond.toString().padStart(2, '0')}`);
            console.log(`Expected: ${testConfig.withStoppageHalftime}`);
            console.log(`Stoppage time: +${addedTimeFirstHalf} minute(s)`);
            
            // Verify timing
            const actualMinutes = currentMinute + (currentSecond / 60);
            const expectedMinutes = testConfig.duration / 2 + testConfig.stoppage;
            const difference = Math.abs(actualMinutes - expectedMinutes);
            
            if (difference < 0.05) { // Within 3 seconds
              console.log(`✅ PASS: Halftime triggered at correct time!`);
              console.log(`${'🟨'.repeat(30)}\n`);
              sse.close();
              resolve({ success: true, actualTime: `${currentMinute}:${currentSecond.toString().padStart(2, '0')}` });
            } else {
              console.log(`❌ FAIL: Timing mismatch! Difference: ${(difference * 60).toFixed(0)} seconds`);
              console.log(`${'🟨'.repeat(30)}\n`);
              sse.close();
              resolve({ success: false, actualTime: `${currentMinute}:${currentSecond.toString().padStart(2, '0')}`, difference });
            }
          }
        } catch (error) {
          console.error('Error parsing SSE data:', error);
        }
      };
      
      sse.onerror = (error) => {
        console.error('❌ SSE Error:', error);
        sse.close();
        reject(error);
      };
      
      // Timeout after reasonable time
      setTimeout(() => {
        if (!halftimeDetected) {
          console.error('❌ TIMEOUT: Halftime not triggered within expected time');
          sse.close();
          reject(new Error('Timeout waiting for halftime'));
        }
      }, (testConfig.duration / 2 + testConfig.stoppage + 2) * 60 * 1000); // Wait 2 minutes extra
    });

  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
    return { success: false, error: error.message };
  }
}

async function runAllTests() {
  console.log('🚀 Starting comprehensive halftime stoppage time tests...\n');
  console.log('📋 Test scenarios:');
  TESTS.forEach(test => {
    console.log(`   - ${test.duration}-min match: Halftime at ${test.expectedHalftime} → With +${test.stoppage} stoppage: ${test.withStoppageHalftime}`);
  });
  
  const results = [];
  
  for (const test of TESTS) {
    const result = await testHalftimeWithStoppage(test);
    results.push({ ...test, ...result });
    
    if (TESTS.indexOf(test) < TESTS.length - 1) {
      console.log('\n⏳ Waiting 10 seconds before next test...\n');
      await sleep(10000);
    }
  }
  
  // Summary
  console.log(`\n${'='.repeat(60)}`);
  console.log('📊 TEST SUMMARY');
  console.log(`${'='.repeat(60)}\n`);
  
  results.forEach(result => {
    const status = result.success ? '✅ PASS' : '❌ FAIL';
    console.log(`${status} | ${result.duration}-min match with +${result.stoppage} stoppage`);
    console.log(`      Expected: ${result.withStoppageHalftime}, Actual: ${result.actualTime || 'N/A'}`);
    if (result.error) {
      console.log(`      Error: ${result.error}`);
    }
  });
  
  const passed = results.filter(r => r.success).length;
  const total = results.length;
  console.log(`\n🏁 Overall: ${passed}/${total} tests passed`);
  
  process.exit(passed === total ? 0 : 1);
}

// Check if token is provided
if (!process.env.AUTH_TOKEN && AUTH_TOKEN === 'test-token') {
  console.log('⚠️  Warning: Using default test token. Set AUTH_TOKEN environment variable for real testing.');
  console.log('   Example: AUTH_TOKEN=your-token-here node test_halftime_stoppage_comprehensive.js\n');
}

// Run tests
runAllTests().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});