import { sseMatchTimerService } from '../services/sse/SSEMatchTimerService';
import { database } from '../models/databaseFactory';
import { v4 as uuidv4 } from 'uuid';

/**
 * Test script for SSE timer system
 * Creates a test match and runs through timer scenarios
 */
async function testSSETimer() {
  console.log('🧪 Starting SSE Timer System Test...\n');
  
  let testMatchId: string | null = null;
  
  try {
    // 1. Create a test 5-minute match
    console.log('1️⃣ Creating test match (5 minutes duration)...');
    
    // Get test teams (you'll need actual team IDs)
    const teams = await database.getAllTeams();
    if (teams.length < 2) {
      throw new Error('Need at least 2 teams to create a test match');
    }
    
    const homeTeamId = teams[0].id;
    const awayTeamId = teams[1].id;
    
    testMatchId = uuidv4();
    const testMatch = await database.createMatch(
      homeTeamId,
      awayTeamId,
      'Test Stadium',
      new Date().toISOString(),
      5, // 5-minute match
      'test-user-id'
    );
    
    console.log(`✅ Created test match: ${testMatch.id}`);
    console.log(`   Home: ${teams[0].name} vs Away: ${teams[1].name}`);
    console.log(`   Duration: 5 minutes\n`);
    
    // 2. Start the match
    console.log('2️⃣ Starting match with SSE timer...');
    const startState = await sseMatchTimerService.startMatch(testMatch.id);
    console.log('✅ Match started:', {
      status: startState.status,
      currentTime: `${startState.currentMinute}:${String(startState.currentSecond).padStart(2, '0')}`,
      half: startState.currentHalf
    });
    
    // 3. Wait and check timer updates
    console.log('\n3️⃣ Monitoring timer for 10 seconds...');
    await new Promise(resolve => {
      let count = 0;
      const interval = setInterval(() => {
        count++;
        const state = sseMatchTimerService.getMatchState(testMatch.id);
        if (state) {
          console.log(`   ⏱️  ${state.currentMinute}:${String(state.currentSecond).padStart(2, '0')} - Half ${state.currentHalf}`);
        }
        
        if (count >= 10) {
          clearInterval(interval);
          resolve(undefined);
        }
      }, 1000);
    });
    
    // 4. Test pause/resume
    console.log('\n4️⃣ Testing pause/resume...');
    await sseMatchTimerService.pauseMatch(testMatch.id);
    console.log('⏸️  Match paused');
    
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    await sseMatchTimerService.resumeMatch(testMatch.id);
    console.log('▶️  Match resumed');
    
    // 5. Test stoppage time
    console.log('\n5️⃣ Adding stoppage time...');
    await sseMatchTimerService.addStoppageTime(testMatch.id, 1);
    const stateAfterStoppage = sseMatchTimerService.getMatchState(testMatch.id);
    console.log(`✅ Added 1 minute stoppage time to half ${stateAfterStoppage?.currentHalf}`);
    console.log(`   First half will now end at: 2.5 + ${stateAfterStoppage?.addedTimeFirstHalf} = ${2.5 + (stateAfterStoppage?.addedTimeFirstHalf || 0)} minutes`);
    
    // 6. Fast forward to near halftime
    console.log('\n6️⃣ Fast-forwarding to near halftime (this would happen automatically)...');
    // In real usage, this happens automatically
    
    // 7. Test manual second half start
    console.log('\n7️⃣ Testing manual halftime and second half start...');
    // Force halftime for testing
    const matchData = await database.getMatchById(testMatch.id);
    if (matchData) {
      await database.updateMatch(testMatch.id, { status: 'HALFTIME' });
      const state = sseMatchTimerService.getMatchState(testMatch.id);
      if (state) {
        state.status = 'HALFTIME';
        state.isHalftime = true;
        state.isPaused = true;
      }
      console.log('🟨 Halftime triggered');
      
      // Start second half
      await sseMatchTimerService.startSecondHalf(testMatch.id);
      const secondHalfState = sseMatchTimerService.getMatchState(testMatch.id);
      console.log('✅ Second half started:', {
        currentTime: `${secondHalfState?.currentMinute}:${String(secondHalfState?.currentSecond || 0).padStart(2, '0')}`,
        half: secondHalfState?.currentHalf
      });
    }
    
    // 8. Clean up
    console.log('\n8️⃣ Cleaning up test match...');
    await database.updateMatch(testMatch.id, { status: 'COMPLETED' });
    console.log('✅ Test match completed and cleaned up');
    
    console.log('\n🎉 SSE Timer System Test Completed Successfully!');
    
  } catch (error) {
    console.error('\n❌ Test failed:', error);
    
    // Clean up on error
    if (testMatchId) {
      try {
        await database.updateMatch(testMatchId, { status: 'COMPLETED' });
      } catch (cleanupError) {
        console.error('Failed to clean up test match:', cleanupError);
      }
    }
    
    throw error;
  }
}

// Test SSE client connection
async function testSSEConnection() {
  console.log('\n🌐 Testing SSE client connection...');
  
  try {
    // This would typically be done from a client
    // Here we're just verifying the endpoint exists
    const http = require('http');
    
    const options = {
      hostname: 'localhost',
      port: 3001,
      path: '/api/matches/test-match-id/timer-stream',
      method: 'GET',
      headers: {
        'Accept': 'text/event-stream',
      }
    };
    
    const req = http.request(options, (res: any) => {
      console.log(`✅ SSE endpoint responded with status: ${res.statusCode}`);
      
      if (res.statusCode === 401) {
        console.log('⚠️  Need authentication token to connect');
      }
      
      res.on('data', (chunk: any) => {
        console.log(`📡 Received: ${chunk.toString()}`);
      });
    });
    
    req.on('error', (error: any) => {
      console.error('❌ SSE connection error:', error.message);
    });
    
    req.end();
    
    // Give it a moment to connect
    await new Promise(resolve => setTimeout(resolve, 1000));
    
  } catch (error) {
    console.error('❌ SSE connection test failed:', error);
  }
}

// Run tests if called directly
if (require.main === module) {
  console.log('🚀 SSE Timer System Test Suite\n');
  console.log('This will create a test match and run through various timer scenarios.\n');
  
  testSSETimer()
    .then(async () => {
      await testSSEConnection();
      console.log('\n✅ All tests completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ Tests failed:', error);
      process.exit(1);
    });
}

export { testSSETimer, testSSEConnection };
