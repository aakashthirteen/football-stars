#!/usr/bin/env node

/**
 * Real System End-to-End Test
 * Tests the actual backend server with real API calls
 */

const fetch = require('node-fetch');

const BASE_URL = 'http://127.0.0.1:3001';

// Test configuration
const TEST_CONFIG = {
  // Use a very short match duration for testing (2 minutes = 1 min per half)
  MATCH_DURATION: 2, // 2 minutes total
  STOPPAGE_TIME: 0.5, // 30 seconds stoppage (0.5 minutes)
  // Expected halftime: 1 minute + 30 seconds = 1:30
  EXPECTED_HALFTIME_MINUTES: 1,
  EXPECTED_HALFTIME_SECONDS: 30
};

async function makeRequest(endpoint, options = {}) {
  try {
    const response = await fetch(`${BASE_URL}${endpoint}`, {
      headers: {
        'Content-Type': 'application/json',
        // You'll need to add authentication token here
        'Authorization': 'Bearer YOUR_TEST_TOKEN',
        ...options.headers
      },
      ...options
    });
    
    if (!response.ok) {
      const error = await response.text();
      throw new Error(`HTTP ${response.status}: ${error}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error(`❌ Request failed for ${endpoint}:`, error.message);
    return null;
  }
}

async function createTestMatch() {
  console.log('📝 Creating test match...');
  
  // Create match with very short duration for quick testing
  const matchData = {
    homeTeamId: 'test-home-team',
    awayTeamId: 'test-away-team',
    venue: 'Test Stadium',
    matchDate: new Date().toISOString(),
    duration: TEST_CONFIG.MATCH_DURATION // 2 minutes for quick test
  };
  
  const match = await makeRequest('/api/matches', {
    method: 'POST',
    body: JSON.stringify(matchData)
  });
  
  if (!match) {
    console.log('❌ Failed to create match - probably need authentication');
    console.log('💡 You need to:');
    console.log('   1. Get a valid auth token from the app');
    console.log('   2. Update the Authorization header in this script');
    console.log('   3. Or create a match through the frontend app');
    return null;
  }
  
  console.log(`✅ Created match: ${match.id}`);
  return match;
}

async function startMatch(matchId) {
  console.log(`🚀 Starting match ${matchId}...`);
  
  const result = await makeRequest(`/api/matches/${matchId}/start`, {
    method: 'PATCH'
  });
  
  if (result) {
    console.log(`✅ Match started successfully`);
    return true;
  }
  return false;
}

async function addStoppageTime(matchId, minutes) {
  console.log(`⏱️ Adding ${minutes} minutes stoppage time...`);
  
  const result = await makeRequest(`/api/matches/${matchId}/add-time`, {
    method: 'PATCH',
    body: JSON.stringify({ minutes })
  });
  
  if (result) {
    console.log(`✅ Added ${minutes} minutes stoppage time`);
    return true;
  }
  return false;
}

async function getMatchStatus(matchId) {
  const match = await makeRequest(`/api/matches/${matchId}`);
  
  if (match) {
    return {
      status: match.status,
      currentMinute: match.minute || 0,
      currentSecond: match.second || 0,
      addedTime: match.added_time_first_half || 0
    };
  }
  return null;
}

function startSSEConnection(matchId) {
  console.log(`🔌 Starting SSE connection for match ${matchId}...`);
  
  // Note: This is simplified - real SSE connection would be more complex
  const sseUrl = `${BASE_URL}/api/sse/${matchId}/timer-stream`;
  console.log(`SSE URL: ${sseUrl}`);
  
  // For this test, we'll just monitor the logs and API responses
  console.log('📡 SSE connection would be established here');
  console.log('   (Monitor server console for SSE timer logs)');
}

async function monitorMatchProgress(matchId) {
  console.log(`👀 Monitoring match progress...`);
  console.log(`Expected halftime at: ${TEST_CONFIG.EXPECTED_HALFTIME_MINUTES}:${TEST_CONFIG.EXPECTED_HALFTIME_SECONDS.toString().padStart(2, '0')}`);
  console.log('');
  
  let checkCount = 0;
  const maxChecks = 30; // Monitor for up to 30 checks (5 minutes)
  
  const monitor = setInterval(async () => {
    checkCount++;
    
    const status = await getMatchStatus(matchId);
    if (!status) {
      console.log('❌ Failed to get match status');
      clearInterval(monitor);
      return;
    }
    
    const timeDisplay = `${status.currentMinute}:${status.currentSecond.toString().padStart(2, '0')}`;
    console.log(`[${checkCount}] Status: ${status.status}, Time: ${timeDisplay}, Added: ${status.addedTime}`);
    
    // Check if halftime was triggered
    if (status.status === 'HALFTIME') {
      console.log('🎯 HALFTIME TRIGGERED!');
      console.log(`✅ Match paused at: ${timeDisplay}`);
      console.log(`✅ Should show UI time: ${TEST_CONFIG.EXPECTED_HALFTIME_MINUTES}:${TEST_CONFIG.EXPECTED_HALFTIME_SECONDS.toString().padStart(2, '0')}`);
      clearInterval(monitor);
      return;
    }
    
    // Check if we've passed the expected halftime and it still hasn't triggered
    const currentTotalSeconds = (status.currentMinute * 60) + status.currentSecond;
    const expectedTotalSeconds = (TEST_CONFIG.EXPECTED_HALFTIME_MINUTES * 60) + TEST_CONFIG.EXPECTED_HALFTIME_SECONDS;
    
    if (currentTotalSeconds > expectedTotalSeconds + 10) { // 10 seconds past expected
      console.log('❌ HALFTIME FAILED TO TRIGGER!');
      console.log(`Expected halftime at: ${TEST_CONFIG.EXPECTED_HALFTIME_MINUTES}:${TEST_CONFIG.EXPECTED_HALFTIME_SECONDS.toString().padStart(2, '0')}`);
      console.log(`Current time: ${timeDisplay} (${currentTotalSeconds - expectedTotalSeconds}s past expected)`);
      clearInterval(monitor);
      return;
    }
    
    if (checkCount >= maxChecks) {
      console.log('⏰ Monitoring timeout reached');
      clearInterval(monitor);
    }
  }, 10000); // Check every 10 seconds
}

async function runRealSystemTest() {
  console.log('🔬 REAL SYSTEM END-TO-END TEST');
  console.log('=====================================\n');
  
  // Check server health
  console.log('1. Checking server health...');
  const health = await makeRequest('/health');
  if (!health) {
    console.log('❌ Server is not responding');
    return;
  }
  console.log(`✅ Server is healthy: ${health.status}\n`);
  
  // For this test, we need authentication or an existing match
  console.log('2. Authentication required for full test');
  console.log('💡 To run the full test:');
  console.log('   a) Create a 2-minute match through the frontend app');
  console.log('   b) Add 30 seconds (0.5 min) stoppage time');
  console.log('   c) Start the match');
  console.log('   d) Monitor server logs for halftime trigger at 1:30');
  console.log('');
  
  console.log('3. Manual test steps:');
  console.log('   - Expected halftime: 1:30 (1 min + 30s stoppage)');
  console.log('   - Watch server console for: "🟨 HALFTIME TRIGGERED"');
  console.log('   - Verify UI shows exactly 1:30, not 1:31 or 1:32');
  console.log('');
  
  console.log('🎯 WHAT TO VERIFY:');
  console.log('✅ Server logs show halftime trigger at >= 1:30');
  console.log('✅ Frontend UI displays exactly 1:30');
  console.log('✅ Match status changes to HALFTIME');
  console.log('✅ Timer stops running');
}

// Run the test
runRealSystemTest().catch(console.error);