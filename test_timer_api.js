#!/usr/bin/env node

/**
 * Timer API Testing Script
 * Tests the actual timer API endpoints to verify fixes work
 */

const fetch = require('node-fetch');

const BASE_URL = 'http://localhost:3001';

async function testTimerFlow() {
  console.log('🧪 Testing Timer API Flow...\n');
  
  try {
    // Step 1: Create a 5-minute test match
    console.log('📝 Step 1: Creating 5-minute test match...');
    const createResponse = await fetch(`${BASE_URL}/api/matches`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer test-token'
      },
      body: JSON.stringify({
        homeTeamId: 'test-home-team',
        awayTeamId: 'test-away-team',
        venue: 'Test Stadium',
        duration: 5, // 5-minute match
        matchDate: new Date().toISOString()
      })
    });
    
    if (!createResponse.ok) {
      console.log('❌ Failed to create match:', await createResponse.text());
      return;
    }
    
    const createResult = await createResponse.json();
    const matchId = createResult.match?.id;
    console.log(`✅ Created match: ${matchId}\n`);
    
    // Step 2: Start the match with SSE timer
    console.log('⚽ Step 2: Starting match with SSE timer...');
    const startResponse = await fetch(`${BASE_URL}/api/sse/${matchId}/start-sse`, {
      method: 'PATCH',
      headers: {
        'Authorization': 'Bearer test-token'
      }
    });
    
    if (!startResponse.ok) {
      console.log('❌ Failed to start match:', await startResponse.text());
      return;
    }
    
    const startResult = await startResponse.json();
    console.log('✅ Match started successfully');
    console.log(`⏱️  Initial timer state: ${startResult.timerState.currentMinute}:${startResult.timerState.currentSecond.toString().padStart(2, '0')}\n`);
    
    // Step 3: Monitor timer for 5 seconds to see progression
    console.log('⏱️  Step 3: Monitoring timer progression...');
    for (let i = 0; i < 5; i++) {
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const statusResponse = await fetch(`${BASE_URL}/api/matches/${matchId}`, {
        headers: { 'Authorization': 'Bearer test-token' }
      });
      
      if (statusResponse.ok) {
        const statusResult = await statusResponse.json();
        console.log(`📊 Timer: ${i + 1}s elapsed - Match is using timer_started_at: ${statusResult.match.timer_started_at}`);
      }
    }
    
    // Step 4: Manually trigger halftime to test the fix
    console.log('\n🟨 Step 4: Manually triggering halftime...');
    const halftimeResponse = await fetch(`${BASE_URL}/api/sse/${matchId}/halftime-sse`, {
      method: 'PATCH',
      headers: { 'Authorization': 'Bearer test-token' }
    });
    
    if (!halftimeResponse.ok) {
      console.log('❌ Failed to trigger halftime:', await halftimeResponse.text());
      return;
    }
    
    const halftimeResult = await halftimeResponse.json();
    console.log('✅ Halftime triggered successfully');
    console.log(`⏱️  Halftime timer state: ${halftimeResult.timerState.currentMinute}:${halftimeResult.timerState.currentSecond.toString().padStart(2, '0')}\n`);
    
    // Step 5: Test second half start
    console.log('⚽ Step 5: Starting second half...');
    const secondHalfResponse = await fetch(`${BASE_URL}/api/sse/${matchId}/start-second-half-sse`, {
      method: 'PATCH',
      headers: { 'Authorization': 'Bearer test-token' }
    });
    
    if (!secondHalfResponse.ok) {
      console.log('❌ Failed to start second half:', await secondHalfResponse.text());
      return;
    }
    
    const secondHalfResult = await secondHalfResponse.json();
    console.log('✅ Second half started successfully');
    console.log(`⏱️  Second half timer state: ${secondHalfResult.timerState.currentMinute}:${secondHalfResult.timerState.currentSecond.toString().padStart(2, '0')}`);
    
    // Verify: Should be 2:30 for 5-minute match
    const expectedMinutes = Math.floor(2.5);
    const expectedSeconds = Math.round((2.5 % 1) * 60);
    
    if (secondHalfResult.timerState.currentMinute === expectedMinutes && 
        secondHalfResult.timerState.currentSecond === expectedSeconds) {
      console.log(`✅ SUCCESS: Second half starts from correct time ${expectedMinutes}:${expectedSeconds.toString().padStart(2, '0')}`);
    } else {
      console.log(`❌ FAILED: Second half should start from ${expectedMinutes}:${expectedSeconds.toString().padStart(2, '0')} but started from ${secondHalfResult.timerState.currentMinute}:${secondHalfResult.timerState.currentSecond.toString().padStart(2, '0')}`);
    }
    
    // Step 6: Check match data to verify timer_started_at field
    console.log('\n📊 Step 6: Verifying match data...');
    const finalStatusResponse = await fetch(`${BASE_URL}/api/matches/${matchId}`, {
      headers: { 'Authorization': 'Bearer test-token' }
    });
    
    if (finalStatusResponse.ok) {
      const finalMatch = await finalStatusResponse.json();
      console.log(`✅ Match has timer_started_at: ${finalMatch.match.timer_started_at}`);
      console.log(`✅ Match has second_half_start_time: ${finalMatch.match.second_half_start_time || 'Not set'}`);
      console.log(`✅ Current half: ${finalMatch.match.current_half}`);
    }
    
    console.log('\n🎉 Timer test completed!');
    
  } catch (error) {
    console.error('❌ Test failed with error:', error.message);
  }
}

// Run the test
testTimerFlow();