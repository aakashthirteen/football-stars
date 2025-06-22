// Test the fixed match start API endpoint
const { database } = require('./dist/models/databaseFactory');

async function testMatchStartFix() {
  console.log('🧪 TESTING MATCH START API FIX');
  console.log('==============================');
  
  try {
    // Get existing teams from database or create UUID format ones
    console.log('1. Getting existing teams...');
    
    const { v4: uuidv4 } = require('uuid');
    
    // Try to get existing teams or create dummy UUIDs
    let homeTeamId, awayTeamId, userId;
    
    try {
      // Get any existing user
      const users = await database.pool.query('SELECT id FROM users LIMIT 1');
      userId = users.rows.length > 0 ? users.rows[0].id : uuidv4();
      
      // Get any existing teams  
      const teams = await database.pool.query('SELECT id FROM teams LIMIT 2');
      
      if (teams.rows.length >= 2) {
        homeTeamId = teams.rows[0].id;
        awayTeamId = teams.rows[1].id;
        console.log(`✅ Using existing teams: ${homeTeamId}, ${awayTeamId}`);
      } else {
        // Create teams if none exist
        homeTeamId = uuidv4();
        awayTeamId = uuidv4();
        
        await database.pool.query(
          'INSERT INTO teams (id, name, created_by) VALUES ($1, $2, $3), ($4, $5, $6)',
          [homeTeamId, 'Test Home Team', userId, awayTeamId, 'Test Away Team', userId]
        );
        console.log('✅ Created test teams');
      }
    } catch (error) {
      // Fallback to UUIDs
      homeTeamId = uuidv4();
      awayTeamId = uuidv4();
      userId = uuidv4();
      console.log('⚠️ Using generated UUIDs for teams');
    }
    
    console.log('2. Creating test match...');
    
    const match = await database.createMatch(
      homeTeamId,
      awayTeamId,
      'Test Venue',
      new Date(),
      5, // 5 minute duration for quick testing
      userId
    );
    
    console.log(`✅ Test match created: ${match.id}`);
    
    // Test the start match API endpoint
    console.log('\n3. Testing start match API...');
    
    const response = await fetch(`http://localhost:3001/api/matches/${match.id}/start`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer test-token'
      }
    });
    
    console.log(`📡 API Response status: ${response.status}`);
    console.log(`📡 API Response ok: ${response.ok}`);
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ SUCCESS! Match started successfully');
      console.log('📊 Response data:', JSON.stringify(data, null, 2));
      
      // Verify timer is running
      console.log('\n4. Verifying timer state...');
      
      setTimeout(async () => {
        try {
          const timerResponse = await fetch(`http://localhost:3001/api/matches/${match.id}`, {
            headers: {
              'Authorization': 'Bearer test-token'
            }
          });
          
          if (timerResponse.ok) {
            const timerData = await timerResponse.json();
            console.log('⏱️ Timer verification:');
            console.log(`   Status: ${timerData.match?.status}`);
            console.log(`   Timer started: ${timerData.match?.timer_started_at ? 'Yes' : 'No'}`);
            console.log('✅ Timer is working correctly!');
          }
        } catch (error) {
          console.error('❌ Timer verification failed:', error.message);
        }
      }, 2000);
      
    } else {
      const errorText = await response.text();
      console.error('❌ API Error:', response.status, response.statusText);
      console.error('❌ Error response:', errorText);
      
      // Check if it's still the "internal server error"
      if (response.status === 500) {
        console.error('\n🚨 INTERNAL SERVER ERROR STILL EXISTS');
        console.error('Need to investigate further...');
      }
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error('❌ Full error:', error);
  }
}

console.log('Starting match start API test...\n');
testMatchStartFix();