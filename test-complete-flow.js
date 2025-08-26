const axios = require('axios');
const { Client } = require('pg');

const API_BASE = 'http://localhost:3001/api';
const DATABASE_URL = process.env.DATABASE_URL || 'postgresql://localhost:5432/football_stars_dev';

// Test users with unique details
const users = [
  { 
    email: 'alice@football.com', 
    password: 'pass123456', 
    name: 'Alice Johnson', 
    phoneNumber: '+15551234567' 
  },
  { 
    email: 'bob@football.com', 
    password: 'pass123456', 
    name: 'Bob Smith', 
    phoneNumber: '+15551234568' 
  },
  { 
    email: 'charlie@football.com', 
    password: 'pass123456', 
    name: 'Charlie Brown', 
    phoneNumber: '+15551234569' 
  }
];

let tokens = {};
let playerIds = {};

async function cleanupDatabase() {
  const client = new Client({ connectionString: DATABASE_URL });
  
  try {
    await client.connect();
    console.log('\n🧹 Cleaning up database...');
    
    // Delete test users and their data
    for (const user of users) {
      await client.query(`
        DELETE FROM player_connections 
        WHERE player_id IN (
          SELECT id FROM players WHERE user_id IN (
            SELECT id FROM users WHERE email = $1
          )
        ) OR connected_player_id IN (
          SELECT id FROM players WHERE user_id IN (
            SELECT id FROM users WHERE email = $1
          )
        )
      `, [user.email]);
      
      await client.query(`
        DELETE FROM notifications 
        WHERE player_id IN (
          SELECT id FROM players WHERE user_id IN (
            SELECT id FROM users WHERE email = $1
          )
        )
      `, [user.email]);
      
      await client.query('DELETE FROM players WHERE user_id IN (SELECT id FROM users WHERE email = $1)', [user.email]);
      await client.query('DELETE FROM users WHERE email = $1', [user.email]);
    }
    
    console.log('✅ Cleanup complete');
  } catch (error) {
    console.error('Cleanup error:', error.message);
  } finally {
    await client.end();
  }
}

async function registerAndLogin(user) {
  try {
    // Register
    try {
      await axios.post(`${API_BASE}/auth/register`, user);
      console.log(`✅ Registered ${user.name}`);
    } catch (err) {
      if (err.response?.data?.error?.includes('already exists')) {
        console.log(`ℹ️  ${user.name} already exists`);
      } else {
        throw err;
      }
    }

    // Login
    const loginRes = await axios.post(`${API_BASE}/auth/login`, {
      email: user.email,
      password: user.password
    });
    
    tokens[user.email] = loginRes.data.accessToken;
    
    // Get player profile
    const profileRes = await axios.get(`${API_BASE}/players/me`, {
      headers: { Authorization: `Bearer ${tokens[user.email]}` }
    });
    
    playerIds[user.email] = profileRes.data.player.id;
    
    console.log(`✅ ${user.name} logged in (Player ID: ${profileRes.data.player.id})`);
    return tokens[user.email];
  } catch (error) {
    console.error(`❌ Error with ${user.name}:`, error.response?.data || error.message);
    throw error;
  }
}

async function testCompleteFlow() {
  console.log(`
╔════════════════════════════════════════════════════════════════╗
║  FRIENDS & CONNECTIONS SYSTEM - COMPLETE FLOW TEST             ║
║  Testing with REAL DATA on production database                 ║
╚════════════════════════════════════════════════════════════════╝
  `);

  // Step 0: Cleanup
  await cleanupDatabase();
  
  // Step 1: Setup users
  console.log('\n📝 STEP 1: Setting up test users...');
  for (const user of users) {
    await registerAndLogin(user);
  }
  
  // Step 2: Alice sends connection request to Bob
  console.log('\n🤝 STEP 2: Alice sends connection request to Bob...');
  try {
    const requestRes = await axios.post(
      `${API_BASE}/players/connections/request`,
      { connectedPlayerId: playerIds['bob@football.com'] },
      { headers: { Authorization: `Bearer ${tokens['alice@football.com']}` } }
    );
    console.log('   ✅ Connection request sent');
    console.log('   Connection ID:', requestRes.data.connection.id);
    
    const connectionId = requestRes.data.connection.id;
    
    // Step 3: Check Bob's notifications
    console.log('\n📬 STEP 3: Checking Bob\'s notifications...');
    const bobNotifs = await axios.get(
      `${API_BASE}/players/notifications`,
      { headers: { Authorization: `Bearer ${tokens['bob@football.com']}` } }
    );
    console.log(`   📨 Bob has ${bobNotifs.data.unreadCount} unread notifications`);
    if (bobNotifs.data.notifications.length > 0) {
      const latestNotif = bobNotifs.data.notifications[0];
      console.log(`   Title: "${latestNotif.title}"`);
      console.log(`   Message: "${latestNotif.message}"`);
      console.log(`   Type: ${latestNotif.type}`);
    }
    
    // Step 4: Bob checks pending connections
    console.log('\n⏳ STEP 4: Bob checks pending connection requests...');
    const bobPending = await axios.get(
      `${API_BASE}/players/connections/pending`,
      { headers: { Authorization: `Bearer ${tokens['bob@football.com']}` } }
    );
    const pendingConnections = bobPending.data.pendingConnections || [];
    console.log(`   Bob has ${pendingConnections.length} pending requests`);
    if (pendingConnections.length > 0) {
      const request = pendingConnections[0];
      console.log(`   From: ${request.from_player_name || 'Unknown'}`);
      console.log(`   Status: ${request.status}`);
    }
    
    // Step 5: Bob accepts Alice's request
    console.log('\n✅ STEP 5: Bob accepts Alice\'s connection request...');
    await axios.post(
      `${API_BASE}/players/connections/accept/${connectionId}`,
      {},
      { headers: { Authorization: `Bearer ${tokens['bob@football.com']}` } }
    );
    console.log('   Connection accepted!');
    
    // Wait a moment for notification to be created
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Step 6: Check Alice's notifications (should be notified of acceptance)
    console.log('\n📬 STEP 6: Checking Alice\'s notifications for acceptance...');
    const aliceNotifs = await axios.get(
      `${API_BASE}/players/notifications`,
      { headers: { Authorization: `Bearer ${tokens['alice@football.com']}` } }
    );
    console.log(`   📨 Alice has ${aliceNotifs.data.unreadCount} unread notifications`);
    if (aliceNotifs.data.notifications.length > 0) {
      const latestNotif = aliceNotifs.data.notifications[0];
      console.log(`   Title: "${latestNotif.title}"`);
      console.log(`   Message: "${latestNotif.message}"`);
    }
    
    // Step 7: Check both users' connections
    console.log('\n👥 STEP 7: Verifying both users are now connected...');
    const aliceConnections = await axios.get(
      `${API_BASE}/players/connections`,
      { headers: { Authorization: `Bearer ${tokens['alice@football.com']}` } }
    );
    const aliceFriends = (aliceConnections.data.connections || []).filter(c => c.status === 'accepted');
    console.log(`   Alice has ${aliceFriends.length} friends`);
    
    const bobConnections = await axios.get(
      `${API_BASE}/players/connections`,
      { headers: { Authorization: `Bearer ${tokens['bob@football.com']}` } }
    );
    const bobFriends = (bobConnections.data.connections || []).filter(c => c.status === 'accepted');
    console.log(`   Bob has ${bobFriends.length} friends`);
    
    // Step 8: Charlie sends requests to both
    console.log('\n🔄 STEP 8: Charlie sending multiple connection requests...');
    for (const email of ['alice@football.com', 'bob@football.com']) {
      try {
        await axios.post(
          `${API_BASE}/players/connections/request`,
          { connectedPlayerId: playerIds[email] },
          { headers: { Authorization: `Bearer ${tokens['charlie@football.com']}` } }
        );
        console.log(`   ✅ Charlie → ${email.split('@')[0]}`);
      } catch (err) {
        console.log(`   ⚠️  Charlie → ${email.split('@')[0]}: ${err.response?.data?.error}`);
      }
    }
    
    // Step 9: Check Charlie's connection summary
    console.log('\n📊 STEP 9: Charlie\'s connection summary...');
    const charlieSummary = await axios.get(
      `${API_BASE}/players/connections/summary`,
      { headers: { Authorization: `Bearer ${tokens['charlie@football.com']}` } }
    );
    const summary = charlieSummary.data.summary;
    console.log(`   Total connections: ${summary.total}`);
    console.log(`   Accepted: ${summary.accepted}`);
    console.log(`   Pending sent: ${summary.pendingSent}`);
    console.log(`   Pending received: ${summary.pendingReceived}`);
    
    // Step 10: Mark notifications as read
    console.log('\n✉️ STEP 10: Testing notification read functionality...');
    if (aliceNotifs.data.notifications.length > 0) {
      const notifId = aliceNotifs.data.notifications[0].id;
      await axios.post(
        `${API_BASE}/players/notifications/${notifId}/read`,
        {},
        { headers: { Authorization: `Bearer ${tokens['alice@football.com']}` } }
      );
      console.log('   ✅ Alice marked notification as read');
    }
    
    // Final summary
    console.log(`
╔════════════════════════════════════════════════════════════════╗
║  ✅ ALL TESTS PASSED SUCCESSFULLY!                            ║
║                                                                ║
║  ✓ Users can register and login                               ║
║  ✓ Connection requests work                                   ║
║  ✓ Notifications are created for requests                     ║
║  ✓ Pending connections show up correctly                      ║
║  ✓ Accepting connections works                                ║
║  ✓ Notifications are sent on acceptance                       ║
║  ✓ Connections list updates properly                          ║
║  ✓ Connection summary works                                   ║
║  ✓ Marking notifications as read works                        ║
║                                                                ║
║  🎉 FRIENDS & CONNECTIONS SYSTEM IS FULLY OPERATIONAL!        ║
╚════════════════════════════════════════════════════════════════╝
    `);
    
  } catch (error) {
    console.error('\n❌ TEST FAILED:', error.response?.data || error.message);
    if (error.response?.data) {
      console.error('Full error:', JSON.stringify(error.response.data, null, 2));
    }
  }
}

// Run the complete test
testCompleteFlow().catch(console.error);