// SCALABLE TIMER TIMING ACCURACY TEST
// Verifies that the new ScalableFootballTimerService maintains FIFA-level precision
const axios = require('axios');
const EventSource = require('eventsource');

const API_URL = 'http://127.0.0.1:3001/api';

async function testScalableTimingAccuracy() {
  console.log('🎯 SCALABLE TIMER TIMING ACCURACY TEST');
  console.log('======================================');
  console.log('Verifies:');
  console.log('1. Halftime triggers at EXACT duration/2 + stoppage (no overshoot)');
  console.log('2. Second half starts at EXACT duration/2 (15:00 for 30min match)');
  console.log('3. Maintains FIFA-level precision with scalable architecture');
  console.log('4. Works correctly even with multiple concurrent matches\n');

  try {
    // Test scenario: 30-minute match with 4-minute stoppage
    const MATCH_DURATION = 30;
    const STOPPAGE_TIME = 4;
    const EXPECTED_HALFTIME = '19:00'; // 15:00 + 4:00
    const EXPECTED_SECOND_HALF_START = '15:00'; // Always duration/2

    console.log(`⚽ Test: ${MATCH_DURATION}-minute match with ${STOPPAGE_TIME}-minute stoppage`);
    console.log(`🎯 Expected halftime: ${EXPECTED_HALFTIME}`);
    console.log(`🔄 Expected second half start: ${EXPECTED_SECOND_HALF_START}\n`);

    // Create teams
    const team1 = await axios.post(`${API_URL}/teams`, {
      name: 'Scalable Timing FC',
      color: '#FF0000'
    });
    const team2 = await axios.post(`${API_URL}/teams`, {
      name: 'Accuracy United',
      color: '#0000FF'
    });

    // Create primary test match
    const match = await axios.post(`${API_URL}/matches`, {
      homeTeamId: team1.data.team.id,
      awayTeamId: team2.data.team.id,
      matchDate: new Date().toISOString(),
      venue: 'Scalable Stadium',
      duration: MATCH_DURATION
    });

    const matchId = match.data.match.id;
    console.log(`✅ Created ${MATCH_DURATION}-minute test match: ${matchId}`);

    // Create additional matches to test scalability doesn't affect accuracy
    console.log('\n🔄 Creating additional matches to test concurrent accuracy...');
    const additionalMatches = [];
    
    for (let i = 0; i < 5; i++) {
      const additionalMatch = await axios.post(`${API_URL}/matches`, {
        homeTeamId: team1.data.team.id,
        awayTeamId: team2.data.team.id,
        matchDate: new Date().toISOString(),
        venue: `Background Stadium ${i + 1}`,
        duration: 45 // Different duration to test mixed loads
      });
      additionalMatches.push(additionalMatch.data.match.id);
    }

    // Start all matches (including background matches)
    console.log('\n🚀 Starting all matches with scalable timer...');
    await axios.patch(`${API_URL}/sse/${matchId}/start-sse`);
    console.log('✅ Primary test match started');

    // Start background matches
    for (let i = 0; i < additionalMatches.length; i++) {
      await axios.patch(`${API_URL}/sse/${additionalMatches[i]}/start-sse`);
    }
    console.log(`✅ ${additionalMatches.length} additional background matches started`);

    // Check system performance with multiple matches
    try {
      const healthResponse = await axios.get(`${API_URL}/sse/health`);
      const performance = healthResponse.data.performance || {};
      console.log(`\n📊 System performance with ${1 + additionalMatches.length} concurrent matches:`);
      console.log(`   Active matches: ${performance.activeMatches || 'unknown'}`);
      console.log(`   Central timer active: ${performance.centralTimerActive || 'unknown'}`);
      console.log(`   Connected clients: ${performance.connectedClients || 'unknown'}`);
    } catch (error) {
      console.log('⚠️ Could not fetch performance metrics');
    }

    // Wait 1 minute then add stoppage time to primary match
    console.log('\n⏳ Waiting 1 minute before adding stoppage time...');
    await new Promise(resolve => setTimeout(resolve, 60000));

    console.log(`➕ Adding ${STOPPAGE_TIME} minutes stoppage time to primary match...`);
    const stoppageResponse = await axios.patch(`${API_URL}/sse/${matchId}/add-time-sse`, {
      minutes: STOPPAGE_TIME
    });
    console.log('✅ Stoppage time added - events rescheduled in scalable system');
    console.log(`📊 Timer state: ${stoppageResponse.data.timerState.currentMinute}:${stoppageResponse.data.timerState.currentSecond.toString().padStart(2, '0')}`);

    // Monitor with SSE for timing accuracy
    console.log('\n📡 Monitoring timing accuracy with scalable timer SSE...\n');
    
    const sse = new EventSource(`${API_URL}/sse/${matchId}/timer-stream`);
    
    let halftimeDetected = false;
    let secondHalfDetected = false;
    const results = {
      halftimeExact: false,
      secondHalfExact: false,
      halftimeTime: null,
      secondHalfTime: null,
      systemPerformedWell: true
    };
    
    sse.onmessage = (event) => {
      const data = JSON.parse(event.data);
      const { currentMinute, currentSecond, status, currentHalf } = data.state;
      const timeStr = `${currentMinute}:${currentSecond.toString().padStart(2, '0')}`;
      
      // Log approach to halftime
      if (currentMinute >= 18 && currentHalf === 1 && !halftimeDetected) {
        console.log(`⏱️  ${timeStr} - Approaching halftime (target: ${EXPECTED_HALFTIME})`);
      }
      
      // Detect halftime
      if (status === 'HALFTIME' && !halftimeDetected) {
        halftimeDetected = true;
        results.halftimeTime = timeStr;
        
        console.log(`\n${'🟨'.repeat(50)}`);
        console.log(`HALFTIME TRIGGERED at ${timeStr}`);
        console.log(`Expected: ${EXPECTED_HALFTIME}`);
        
        if (timeStr === EXPECTED_HALFTIME) {
          console.log('✅ PERFECT! Scalable timer triggered at EXACT time!');
          results.halftimeExact = true;
        } else {
          console.log(`❌ FAILED! Should be ${EXPECTED_HALFTIME}, got ${timeStr}`);
          results.systemPerformedWell = false;
        }
        console.log(`${'🟨'.repeat(50)}\n`);
        
        // Wait 5 seconds then start second half
        setTimeout(async () => {
          try {
            console.log('🔄 Starting second half...');
            await axios.patch(`${API_URL}/sse/${matchId}/second-half-sse`);
          } catch (error) {
            console.error('Failed to start second half:', error.message);
            results.systemPerformedWell = false;
          }
        }, 5000);
      }
      
      // Detect second half start
      if (currentHalf === 2 && status === 'LIVE' && !secondHalfDetected) {
        secondHalfDetected = true;
        results.secondHalfTime = timeStr;
        
        console.log(`${'⚽'.repeat(50)}`);
        console.log(`SECOND HALF STARTED at ${timeStr}`);
        console.log(`Expected: ${EXPECTED_SECOND_HALF_START}`);
        
        if (timeStr === EXPECTED_SECOND_HALF_START) {
          console.log('✅ PERFECT! Second half starts at exact half duration!');
          results.secondHalfExact = true;
        } else {
          console.log(`❌ FAILED! Should be ${EXPECTED_SECOND_HALF_START}, got ${timeStr}`);
          results.systemPerformedWell = false;
        }
        console.log(`${'⚽'.repeat(50)}\n`);
        
        // End test
        sse.close();
        showResults();
      }
    };
    
    sse.onerror = (error) => {
      console.error('❌ SSE Error:', error);
      results.systemPerformedWell = false;
      sse.close();
      showResults();
    };

    // Timeout for test
    setTimeout(() => {
      if (!secondHalfDetected) {
        console.log('⏰ Test timeout - second half not detected');
        results.systemPerformedWell = false;
        sse.close();
        showResults();
      }
    }, 25 * 60 * 1000); // 25 minutes timeout

    function showResults() {
      console.log('='.repeat(80));
      console.log('🎯 SCALABLE TIMER TIMING ACCURACY RESULTS');
      console.log('='.repeat(80));
      
      console.log(`Halftime Timing: ${results.halftimeExact ? '✅ EXACT' : '❌ FAILED'} (${results.halftimeTime})`);
      console.log(`Second Half Start: ${results.secondHalfExact ? '✅ EXACT' : '❌ FAILED'} (${results.secondHalfTime})`);
      console.log(`System Performance: ${results.systemPerformedWell ? '✅ GOOD' : '❌ ISSUES'}`);
      
      // Final performance check
      axios.get(`${API_URL}/sse/health`).then(response => {
        const performance = response.data.performance || {};
        console.log(`\nFinal Performance Metrics:`);
        console.log(`   Active matches: ${performance.activeMatches || 'unknown'}`);
        console.log(`   Events processed: ${performance.totalEventsProcessed || 'unknown'}`);
        console.log(`   Avg processing time: ${performance.averageProcessingTimeMs || 'unknown'}ms`);
        
        if (results.halftimeExact && results.secondHalfExact && results.systemPerformedWell) {
          console.log('\n🎉 SUCCESS! Scalable timer maintains FIFA-level precision!');
          console.log('🏆 Timing accuracy verified with scalable architecture!');
          process.exit(0);
        } else {
          console.log('\n❌ FAILURE! Scalable timer has accuracy or performance issues.');
          process.exit(1);
        }
      }).catch(() => {
        if (results.halftimeExact && results.secondHalfExact) {
          console.log('\n🎉 SUCCESS! Timing accuracy verified!');
          process.exit(0);
        } else {
          console.log('\n❌ FAILURE! Timing accuracy issues detected.');
          process.exit(1);
        }
      });
    }

  } catch (error) {
    console.error('❌ Timing accuracy test failed:', error.response?.data || error.message);
    process.exit(1);
  }
}

console.log('⚠️ Make sure your server is running on localhost:3001');
console.log('⚠️ Make sure you updated the routes to use scalableFootballTimer');
console.log('Starting scalable timing accuracy test in 3 seconds...\n');

setTimeout(testScalableTimingAccuracy, 3000);