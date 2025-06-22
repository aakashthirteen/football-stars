// SCALABLE TIMER PERFORMANCE TEST
// Tests the new ScalableFootballTimerService with hundreds of concurrent matches
const axios = require('axios');
const EventSource = require('eventsource');

const API_URL = 'http://127.0.0.1:3001/api';

async function testScalablePerformance() {
  console.log('🚀 SCALABLE TIMER PERFORMANCE TEST');
  console.log('=====================================');
  console.log('Testing with high concurrent match load...\n');

  try {
    const startTime = Date.now();
    let performanceData = {};

    // Test configuration
    const TOTAL_MATCHES = 100; // Start with 100, can increase to 1000+
    const BATCH_SIZE = 10;     // Process matches in batches
    const matches = [];
    let successfulStarts = 0;
    let activeConnections = 0;

    console.log(`🎯 Creating ${TOTAL_MATCHES} concurrent matches in batches of ${BATCH_SIZE}...`);

    // Create teams for testing
    console.log('Creating test teams...');
    const team1 = await axios.post(`${API_URL}/teams`, {
      name: 'Scalable FC',
      color: '#FF0000'
    });
    const team2 = await axios.post(`${API_URL}/teams`, {
      name: 'Performance United',
      color: '#0000FF'
    });

    // Process matches in batches to avoid overwhelming the system
    for (let batch = 0; batch < Math.ceil(TOTAL_MATCHES / BATCH_SIZE); batch++) {
      const batchStart = Date.now();
      const batchPromises = [];
      const batchStartIndex = batch * BATCH_SIZE;
      const batchEndIndex = Math.min((batch + 1) * BATCH_SIZE, TOTAL_MATCHES);
      
      console.log(`\n📦 Processing batch ${batch + 1}: matches ${batchStartIndex + 1}-${batchEndIndex}`);

      for (let i = batchStartIndex; i < batchEndIndex; i++) {
        const promise = createAndStartMatch(team1.data.team.id, team2.data.team.id, i + 1);
        batchPromises.push(promise);
      }

      // Wait for batch completion
      const batchResults = await Promise.allSettled(batchPromises);
      
      // Process batch results
      batchResults.forEach((result, index) => {
        if (result.status === 'fulfilled') {
          matches.push(result.value);
          successfulStarts++;
        } else {
          console.error(`❌ Match ${batchStartIndex + index + 1} failed:`, result.reason.message);
        }
      });

      const batchTime = Date.now() - batchStart;
      console.log(`✅ Batch ${batch + 1} completed in ${batchTime}ms (${batchResults.filter(r => r.status === 'fulfilled').length}/${batchResults.length} successful)`);

      // Small delay between batches to prevent overwhelming
      if (batch < Math.ceil(TOTAL_MATCHES / BATCH_SIZE) - 1) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }

    console.log(`\n📊 MATCH CREATION SUMMARY:`);
    console.log(`   Total matches: ${TOTAL_MATCHES}`);
    console.log(`   Successful starts: ${successfulStarts}`);
    console.log(`   Failed starts: ${TOTAL_MATCHES - successfulStarts}`);
    console.log(`   Success rate: ${(successfulStarts / TOTAL_MATCHES * 100).toFixed(1)}%`);

    if (successfulStarts === 0) {
      console.log('❌ No matches started successfully. Test failed.');
      return;
    }

    // Check system performance
    console.log(`\n🔍 CHECKING SYSTEM PERFORMANCE...`);
    
    try {
      const healthResponse = await axios.get(`${API_URL}/sse/health`);
      performanceData = healthResponse.data.performance || {};
      
      console.log(`📈 Performance Metrics:`);
      console.log(`   Active matches: ${performanceData.activeMatches || 'unknown'}`);
      console.log(`   Connected clients: ${performanceData.connectedClients || 'unknown'}`);
      console.log(`   Central timer active: ${performanceData.centralTimerActive || 'unknown'}`);
      console.log(`   Events processed: ${performanceData.totalEventsProcessed || 'unknown'}`);
      console.log(`   Avg processing time: ${performanceData.averageProcessingTimeMs || 'unknown'}ms`);
    } catch (error) {
      console.log('⚠️ Could not fetch performance metrics:', error.message);
    }

    // Test SSE connections
    console.log(`\n📡 TESTING SSE CONNECTIONS...`);
    const sseTestPromises = [];
    const MAX_SSE_TESTS = Math.min(10, successfulStarts); // Test up to 10 SSE connections

    for (let i = 0; i < MAX_SSE_TESTS; i++) {
      const match = matches[i];
      if (match) {
        sseTestPromises.push(testSSEConnection(match.id, i + 1));
      }
    }

    const sseResults = await Promise.allSettled(sseTestPromises);
    const successfulSSE = sseResults.filter(r => r.status === 'fulfilled').length;
    
    console.log(`📡 SSE Test Results: ${successfulSSE}/${MAX_SSE_TESTS} connections successful`);

    // Test stoppage time addition performance
    console.log(`\n⏱️ TESTING STOPPAGE TIME PERFORMANCE...`);
    const stoppageTestStart = Date.now();
    const stoppagePromises = [];
    
    for (let i = 0; i < Math.min(20, successfulStarts); i++) {
      const match = matches[i];
      if (match) {
        stoppagePromises.push(addStoppageTimeToMatch(match.id, 2));
      }
    }

    const stoppageResults = await Promise.allSettled(stoppagePromises);
    const stoppageTime = Date.now() - stoppageTestStart;
    const successfulStoppage = stoppageResults.filter(r => r.status === 'fulfilled').length;
    
    console.log(`⏱️ Stoppage time test: ${successfulStoppage}/${stoppagePromises.length} successful in ${stoppageTime}ms`);

    // Overall test summary
    const totalTime = Date.now() - startTime;
    
    console.log(`\n${'='.repeat(60)}`);
    console.log('🏆 SCALABLE TIMER PERFORMANCE TEST RESULTS');
    console.log(`${'='.repeat(60)}`);
    console.log(`Total test time: ${totalTime}ms`);
    console.log(`Matches created: ${successfulStarts}/${TOTAL_MATCHES}`);
    console.log(`SSE connections: ${successfulSSE}/${MAX_SSE_TESTS}`);
    console.log(`Stoppage time ops: ${successfulStoppage}/${Math.min(20, successfulStarts)}`);
    
    if (performanceData.activeMatches) {
      console.log(`Active matches in system: ${performanceData.activeMatches}`);
      console.log(`Central timer efficiency: ${performanceData.centralTimerActive ? 'ACTIVE' : 'INACTIVE'}`);
    }

    // Performance scoring
    let score = 0;
    if (successfulStarts >= TOTAL_MATCHES * 0.9) score += 30; // 90%+ match creation
    if (successfulSSE >= MAX_SSE_TESTS * 0.8) score += 30;    // 80%+ SSE success
    if (successfulStoppage >= Math.min(20, successfulStarts) * 0.8) score += 20; // 80%+ stoppage success
    if (totalTime < 30000) score += 20; // Under 30 seconds

    console.log(`\nPerformance Score: ${score}/100`);
    
    if (score >= 80) {
      console.log('🎉 EXCELLENT! Scalable timer system performs well under load!');
    } else if (score >= 60) {
      console.log('✅ GOOD! System handles load but has room for improvement.');
    } else {
      console.log('⚠️ NEEDS IMPROVEMENT! System struggles under high load.');
    }

  } catch (error) {
    console.error('❌ Performance test failed:', error.message);
    process.exit(1);
  }
}

async function createAndStartMatch(homeTeamId, awayTeamId, matchNumber) {
  // Create match
  const match = await axios.post(`${API_URL}/matches`, {
    homeTeamId,
    awayTeamId,
    matchDate: new Date().toISOString(),
    venue: `Stadium ${matchNumber}`,
    duration: 30 // 30-minute match for faster testing
  });

  const matchId = match.data.match.id;

  // Start match with scalable timer
  await axios.patch(`${API_URL}/sse/${matchId}/start-sse`);

  return { id: matchId, number: matchNumber };
}

async function testSSEConnection(matchId, connectionNumber) {
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      sse.close();
      reject(new Error(`SSE connection ${connectionNumber} timeout`));
    }, 5000);

    const sse = new EventSource(`${API_URL}/sse/${matchId}/timer-stream`);
    
    sse.onmessage = (event) => {
      clearTimeout(timeout);
      sse.close();
      resolve(`SSE connection ${connectionNumber} successful`);
    };
    
    sse.onerror = (error) => {
      clearTimeout(timeout);
      sse.close();
      reject(new Error(`SSE connection ${connectionNumber} failed`));
    };
  });
}

async function addStoppageTimeToMatch(matchId, minutes) {
  await axios.patch(`${API_URL}/sse/${matchId}/add-time-sse`, {
    minutes: minutes
  });
  return `Added ${minutes} minutes to ${matchId}`;
}

console.log('⚠️ Make sure your server is running on localhost:3001');
console.log('⚠️ Make sure you updated the routes to use scalableFootballTimer');
console.log('Starting scalable performance test in 3 seconds...\n');

setTimeout(testScalablePerformance, 3000);