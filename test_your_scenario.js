// Test the exact scenario you described: 30min match + 4min stoppage
const axios = require('axios');
const EventSource = require('eventsource');

const API_URL = 'http://localhost:4001/api';

async function testYourScenario() {
  console.log('🎯 TESTING YOUR EXACT SCENARIO');
  console.log('⚽ 30-minute match');
  console.log('⏱️  +4 minutes stoppage time in first half');
  console.log('🎯 Expected halftime: 19:00 (15:00 + 4:00)');
  console.log('🔄 Expected second half start: 15:00 (always duration/2)');
  console.log('\n' + '='.repeat(60) + '\n');

  try {
    // Create teams
    const team1 = await axios.post(`${API_URL}/teams`, {
      name: 'Your Scenario FC',
      color: '#FF0000'
    });
    const team2 = await axios.post(`${API_URL}/teams`, {
      name: 'Test United',
      color: '#0000FF'
    });

    // Create 30-minute match
    const match = await axios.post(`${API_URL}/matches`, {
      homeTeamId: team1.data.team.id,
      awayTeamId: team2.data.team.id,
      matchDate: new Date().toISOString(),
      venue: 'Your Stadium',
      duration: 30
    });

    const matchId = match.data.match.id;
    console.log(`✅ Created 30-minute match: ${matchId}`);

    // Start match
    await axios.patch(`${API_URL}/matches/${matchId}/start`);
    console.log('✅ Match started');

    // Wait 1 minute then add 4 minutes stoppage
    console.log('\n⏳ Waiting 1 minute before adding stoppage time...');
    await new Promise(resolve => setTimeout(resolve, 60000));

    console.log('➕ Adding 4 minutes stoppage time...');
    const stoppageResponse = await axios.patch(`${API_URL}/sse/${matchId}/add-time-sse`, {
      minutes: 4
    });
    console.log('✅ Stoppage time added');
    console.log(`📊 Current timer state: ${stoppageResponse.data.timerState.currentMinute}:${stoppageResponse.data.timerState.currentSecond.toString().padStart(2, '0')}`);
    console.log(`📊 Added time first half: ${stoppageResponse.data.timerState.addedTimeFirstHalf} minutes`);

    // Monitor with detailed logging
    console.log('\n📡 Monitoring timer with second-by-second logging near halftime...\n');
    
    const sse = new EventSource(`${API_URL}/sse/${matchId}/timer-stream`);
    
    let halftimeTriggered = false;
    let secondHalfStarted = false;
    
    sse.onmessage = (event) => {
      const data = JSON.parse(event.data);
      const { currentMinute, currentSecond, status, currentHalf, addedTimeFirstHalf } = data.state;
      const timeStr = `${currentMinute}:${currentSecond.toString().padStart(2, '0')}`;
      
      // Log every second when approaching halftime (18:00 onwards)
      if (currentMinute >= 18 && currentHalf === 1) {
        console.log(`⏱️  ${timeStr} - Status: ${status}, Stoppage: +${addedTimeFirstHalf}, Target: 19:00`);
      }
      
      // Detect halftime
      if (status === 'HALFTIME' && !halftimeTriggered) {
        halftimeTriggered = true;
        
        console.log(`\n${'🟨'.repeat(40)}`);
        console.log(`HALFTIME TRIGGERED at ${timeStr}`);
        console.log(`Expected: 19:00`);
        
        if (timeStr === '19:00') {
          console.log(`✅ PERFECT! Halftime at exactly 19:00`);
        } else {
          const [actualMin, actualSec] = [currentMinute, currentSecond];
          const actualTotal = actualMin * 60 + actualSec;
          const expectedTotal = 19 * 60;
          const difference = actualTotal - expectedTotal;
          
          if (difference <= 1) {
            console.log(`✅ ACCEPTABLE! Halftime within 1 second (${difference}s late)`);
          } else {
            console.log(`❌ FAILED! Halftime ${difference} seconds too late`);
          }
        }
        console.log(`${'🟨'.repeat(40)}\n`);
      }
      
      // Detect second half start
      if (currentHalf === 2 && status === 'LIVE' && !secondHalfStarted) {
        secondHalfStarted = true;
        
        console.log(`${'⚽'.repeat(40)}`);
        console.log(`SECOND HALF STARTED at ${timeStr}`);
        console.log(`Expected: 15:00`);
        
        if (timeStr === '15:00') {
          console.log(`✅ PERFECT! Second half starts at exactly 15:00`);
        } else {
          console.log(`❌ FAILED! Second half should start at 15:00, not ${timeStr}`);
        }
        console.log(`${'⚽'.repeat(40)}\n`);
        
        // End test
        sse.close();
        
        if (timeStr === '15:00') {
          console.log('🎉 SUCCESS! Both halftime and second half timing are correct!');
          process.exit(0);
        } else {
          console.log('❌ Second half start timing is incorrect');
          process.exit(1);
        }
      }
      
      // Log every 30 seconds for other times
      if (currentSecond === 0 && currentMinute % 1 === 0 && currentMinute < 18) {
        console.log(`⏱️  ${timeStr} - Status: ${status}, Half: ${currentHalf}`);
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

console.log('🧪 Testing your exact scenario: 30-min match with 4-min stoppage');
console.log('⚠️  Make sure your server is running on localhost:4001');
console.log('Starting test in 3 seconds...\n');

setTimeout(testYourScenario, 3000);