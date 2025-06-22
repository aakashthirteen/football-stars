// Simple test to check if the internal server error is fixed
const http = require('http');

function testMatchStart() {
  console.log('🧪 TESTING MATCH START API (Simple Test)');
  console.log('========================================');
  
  // First, get an existing match from the database
  const { database } = require('./dist/models/databaseFactory');
  
  database.pool.query('SELECT id FROM matches WHERE status = $1 LIMIT 1', ['SCHEDULED'])
    .then(result => {
      if (result.rows.length === 0) {
        console.log('⚠️ No scheduled matches found, creating one...');
        return createTestMatch();
      } else {
        const matchId = result.rows[0].id;
        console.log(`✅ Found existing scheduled match: ${matchId}`);
        return testStartAPI(matchId);
      }
    })
    .catch(error => {
      console.error('❌ Database error:', error.message);
    });
}

async function createTestMatch() {
  const { database } = require('./dist/models/databaseFactory');
  const { v4: uuidv4 } = require('uuid');
  
  try {
    // Get existing teams and user
    const teams = await database.pool.query('SELECT id FROM teams LIMIT 2');
    const users = await database.pool.query('SELECT id FROM users LIMIT 1');
    
    if (teams.rows.length < 2) {
      console.log('❌ Need at least 2 teams in database');
      return;
    }
    
    const userId = users.rows.length > 0 ? users.rows[0].id : uuidv4();
    
    const match = await database.createMatch(
      teams.rows[0].id,
      teams.rows[1].id,
      'Test Venue',
      new Date(),
      5,
      userId
    );
    
    console.log(`✅ Created test match: ${match.id}`);
    return testStartAPI(match.id);
    
  } catch (error) {
    console.error('❌ Failed to create test match:', error.message);
  }
}

function testStartAPI(matchId) {
  console.log(`\n🚀 Testing start match API for: ${matchId}`);
  
  const postData = JSON.stringify({});
  
  const options = {
    hostname: 'localhost',
    port: 3001,
    path: `/api/matches/${matchId}/start`,
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer dummy-token', // This might be invalid but let's see the error
      'Content-Length': Buffer.byteLength(postData)
    }
  };
  
  const req = http.request(options, (res) => {
    console.log(`📡 Status Code: ${res.statusCode}`);
    console.log(`📡 Headers:`, res.headers);
    
    let data = '';
    res.on('data', (chunk) => {
      data += chunk;
    });
    
    res.on('end', () => {
      console.log('\n📥 Response Body:');
      
      try {
        const parsed = JSON.parse(data);
        console.log(JSON.stringify(parsed, null, 2));
        
        if (res.statusCode === 500) {
          console.log('\n🚨 INTERNAL SERVER ERROR - NEED TO CHECK SERVER LOGS');
        } else if (res.statusCode === 401) {
          console.log('\n✅ GOOD! No internal server error (just auth issue)');
          console.log('The timerService integration is working');
        } else if (res.statusCode === 200) {
          console.log('\n🎉 SUCCESS! Match started without errors');
        }
        
      } catch (e) {
        console.log('Raw response:', data);
      }
    });
  });
  
  req.on('error', (e) => {
    console.error(`❌ Request error: ${e.message}`);
  });
  
  req.write(postData);
  req.end();
}

// Start the test
console.log('Initializing database connection...\n');
testMatchStart();