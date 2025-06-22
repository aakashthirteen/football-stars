// Test script to verify halftime with stoppage time behavior
const axios = require('axios');

const API_URL = 'http://localhost:4001/api';
const TEST_DURATION = 5; // 5 minute match for testing
const STOPPAGE_TIME = 1; // 1 minute stoppage time

// Expected halftime: 2:30 + 1:00 = 3:30

async function testHalftimeWithStoppage() {
  console.log('🧪 Testing halftime with stoppage time...');
  console.log(`📊 Match duration: ${TEST_DURATION} minutes`);
  console.log(`⏱️ Expected halftime WITHOUT stoppage: ${TEST_DURATION/2}:00`);
  console.log(`➕ Stoppage time to add: ${STOPPAGE_TIME} minute`);
  console.log(`🎯 Expected halftime WITH stoppage: ${TEST_DURATION/2 + STOPPAGE_TIME}:00\n`);

  try {
    // 1. Create teams
    console.log('1️⃣ Creating teams...');
    const team1Response = await axios.post(`${API_URL}/teams`, {
      name: 'Stoppage Test FC',
      color: '#FF0000'
    });
    const team2Response = await axios.post(`${API_URL}/teams`, {
      name: 'Timing United',
      color: '#0000FF'
    });

    const team1Id = team1Response.data.team.id;
    const team2Id = team2Response.data.team.id;

    // 2. Create match
    console.log('2️⃣ Creating match...');
    const matchResponse = await axios.post(`${API_URL}/matches`, {
      homeTeamId: team1Id,
      awayTeamId: team2Id,
      matchDate: new Date().toISOString(),
      venue: 'Test Stadium',
      duration: TEST_DURATION
    });

    const matchId = matchResponse.data.match.id;
    console.log(`✅ Match created: ${matchId}`);

    // 3. Start match
    console.log('\n3️⃣ Starting match...');
    await axios.patch(`${API_URL}/matches/${matchId}/start`);
    console.log('✅ Match started');

    // 4. Wait for 1 minute, then add stoppage time
    console.log('\n4️⃣ Waiting 1 minute before adding stoppage time...');
    await new Promise(resolve => setTimeout(resolve, 60000)); // 1 minute

    console.log(`➕ Adding ${STOPPAGE_TIME} minute stoppage time...`);
    const stoppageResponse = await axios.patch(`${API_URL}/matches/${matchId}/add-time`, {
      minutes: STOPPAGE_TIME
    });
    console.log('✅ Stoppage time added:', stoppageResponse.data.message);

    // 5. Monitor timer via SSE
    console.log('\n5️⃣ Monitoring timer for halftime trigger...');
    console.log('Expected halftime at: 3:30');
    
    const EventSource = require('eventsource');
    const sse = new EventSource(`${API_URL}/sse/matches/${matchId}/timer`);
    
    let lastLoggedMinute = -1;
    
    sse.onmessage = (event) => {
      const data = JSON.parse(event.data);
      const { currentMinute, currentSecond, status, addedTimeFirstHalf } = data.state;
      
      // Log every 30 seconds
      if (currentMinute !== lastLoggedMinute && currentSecond < 5) {
        console.log(`⏱️ ${currentMinute}:${currentSecond.toString().padStart(2, '0')} - Status: ${status}, Stoppage: +${addedTimeFirstHalf}`);
        lastLoggedMinute = currentMinute;
      }
      
      // Check if halftime was triggered
      if (status === 'HALFTIME') {
        console.log(`\n🟨 HALFTIME TRIGGERED at ${currentMinute}:${currentSecond.toString().padStart(2, '0')}`);
        console.log(`📊 Added time first half: ${addedTimeFirstHalf} minute(s)`);
        
        // Verify timing
        const expectedMinutes = TEST_DURATION/2 + STOPPAGE_TIME;
        const actualTotalMinutes = currentMinute + (currentSecond / 60);
        
        if (Math.abs(actualTotalMinutes - expectedMinutes) < 0.1) {
          console.log(`✅ CORRECT: Halftime triggered at expected time (${expectedMinutes}:00)`);
        } else {
          console.log(`❌ ERROR: Halftime triggered at ${currentMinute}:${currentSecond}, expected ${expectedMinutes}:00`);
        }
        
        sse.close();
        process.exit(0);
      }
    };
    
    sse.onerror = (error) => {
      console.error('❌ SSE Error:', error);
      sse.close();
      process.exit(1);
    };

  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
    process.exit(1);
  }
}

// Run the test
testHalftimeWithStoppage();