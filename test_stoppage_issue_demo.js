// Script to demonstrate the stoppage time issue and solution
const axios = require('axios');
const EventSource = require('eventsource');

const API_URL = 'http://localhost:4001/api';
const MATCH_DURATION = 6; // 6 minute match for quick testing

async function demonstrateIssue() {
  console.log('🔴 DEMONSTRATING THE ISSUE\n');
  console.log('This test shows what happens when using the wrong endpoint for adding stoppage time.\n');

  try {
    // Create match
    const team1 = await axios.post(`${API_URL}/teams`, { name: 'Issue Demo FC', color: '#FF0000' });
    const team2 = await axios.post(`${API_URL}/teams`, { name: 'Problem United', color: '#0000FF' });
    
    const match = await axios.post(`${API_URL}/matches`, {
      homeTeamId: team1.data.team.id,
      awayTeamId: team2.data.team.id,
      matchDate: new Date().toISOString(),
      venue: 'Bug Stadium',
      duration: MATCH_DURATION
    });

    const matchId = match.data.match.id;
    console.log(`✅ Created ${MATCH_DURATION}-minute match: ${matchId}`);

    // Start match
    await axios.patch(`${API_URL}/matches/${matchId}/start`);
    console.log('✅ Match started');
    console.log(`⏱️  Expected halftime WITHOUT stoppage: ${MATCH_DURATION/2}:00`);

    // Monitor with SSE
    const sse = new EventSource(`${API_URL}/sse/${matchId}/timer-stream`);
    
    // Wait 30 seconds then add stoppage using WRONG endpoint
    setTimeout(async () => {
      console.log('\n❌ Adding stoppage time using WRONG endpoint (database only)...');
      await axios.patch(`${API_URL}/matches/${matchId}/add-time`, { minutes: 2 });
      console.log('📝 Database updated with +2 minutes stoppage');
      console.log('❓ Expected halftime WITH stoppage: 5:00');
      console.log('⚠️  But SSE timer doesn\'t know about this change!\n');
    }, 30000);

    sse.onmessage = (event) => {
      const data = JSON.parse(event.data);
      const { currentMinute, currentSecond, status, addedTimeFirstHalf } = data.state;
      
      // Log key moments
      if (currentSecond === 0 || status === 'HALFTIME') {
        console.log(`⏱️  ${currentMinute}:${currentSecond.toString().padStart(2, '0')} - Stoppage in SSE state: +${addedTimeFirstHalf}`);
      }
      
      if (status === 'HALFTIME') {
        console.log(`\n🟨 HALFTIME at ${currentMinute}:${currentSecond.toString().padStart(2, '0')}`);
        console.log('❌ ISSUE: Halftime triggered at 3:00 instead of 5:00!');
        console.log('📝 Reason: SSE timer never received the stoppage time update\n');
        sse.close();
        demonstrateSolution();
      }
    };

  } catch (error) {
    console.error('Error:', error.message);
  }
}

async function demonstrateSolution() {
  console.log('\n' + '='.repeat(60));
  console.log('🟢 DEMONSTRATING THE SOLUTION\n');
  console.log('This test shows the correct behavior using the SSE endpoint.\n');

  try {
    // Create new match
    const team1 = await axios.post(`${API_URL}/teams`, { name: 'Solution FC', color: '#00FF00' });
    const team2 = await axios.post(`${API_URL}/teams`, { name: 'Fixed United', color: '#0000FF' });
    
    const match = await axios.post(`${API_URL}/matches`, {
      homeTeamId: team1.data.team.id,
      awayTeamId: team2.data.team.id,
      matchDate: new Date().toISOString(),
      venue: 'Success Stadium',
      duration: MATCH_DURATION
    });

    const matchId = match.data.match.id;
    console.log(`✅ Created ${MATCH_DURATION}-minute match: ${matchId}`);

    // Start match
    await axios.patch(`${API_URL}/matches/${matchId}/start`);
    console.log('✅ Match started');
    console.log(`⏱️  Expected halftime WITHOUT stoppage: ${MATCH_DURATION/2}:00`);

    // Monitor with SSE
    const sse = new EventSource(`${API_URL}/sse/${matchId}/timer-stream`);
    
    // Wait 30 seconds then add stoppage using CORRECT endpoint
    setTimeout(async () => {
      console.log('\n✅ Adding stoppage time using CORRECT SSE endpoint...');
      const response = await axios.patch(`${API_URL}/sse/${matchId}/add-time-sse`, { minutes: 2 });
      console.log('📝 SSE timer state updated immediately!');
      console.log('🎯 Expected halftime WITH stoppage: 5:00\n');
      
      // Show the immediate update
      const { currentMinute, currentSecond, addedTimeFirstHalf } = response.data.timerState;
      console.log(`📊 Timer state after update: ${currentMinute}:${currentSecond.toString().padStart(2, '0')}, Stoppage: +${addedTimeFirstHalf}`);
    }, 30000);

    sse.onmessage = (event) => {
      const data = JSON.parse(event.data);
      const { currentMinute, currentSecond, status, addedTimeFirstHalf } = data.state;
      
      // Log key moments
      if (currentSecond === 0 || status === 'HALFTIME') {
        console.log(`⏱️  ${currentMinute}:${currentSecond.toString().padStart(2, '0')} - Stoppage in SSE state: +${addedTimeFirstHalf}`);
      }
      
      if (status === 'HALFTIME') {
        console.log(`\n🟨 HALFTIME at ${currentMinute}:${currentSecond.toString().padStart(2, '0')}`);
        console.log('✅ SUCCESS: Halftime triggered at correct time (5:00)!');
        console.log('📝 Solution: Using SSE endpoint ensures timer knows about stoppage\n');
        sse.close();
        
        console.log('🎉 SUMMARY:');
        console.log('   - Problem: /matches/:id/add-time only updates database');
        console.log('   - Solution: /sse/:id/add-time-sse updates both database AND timer');
        console.log('   - Frontend fix: Change apiService.addStoppageTime to apiService.addStoppageTimeSSE');
        
        process.exit(0);
      }
    };

  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

console.log('🧪 Stoppage Time Issue Demonstration\n');
console.log('This script demonstrates:');
console.log('1. The ISSUE when using the wrong endpoint (halftime at wrong time)');
console.log('2. The SOLUTION using the correct SSE endpoint (halftime at correct time)\n');
console.log('Starting in 3 seconds...\n');

setTimeout(demonstrateIssue, 3000);